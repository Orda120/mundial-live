import test from "node:test";
import assert from "node:assert/strict";

import worker, { syncLiveScores } from "./index.js";

test("health reports Gemini configuration", async () => {
  const configured = await worker.fetch(
    new Request("https://worker.test/health"),
    {
      FIREBASE_DATABASE_URL: "https://firebase.test",
      LEAGUE_ID: "league",
      SYNC_TOKEN: "sync",
      GEMINI_API_KEY: "gemini-secret",
    },
  );
  const missing = await worker.fetch(
    new Request("https://worker.test/health"),
    {
      FIREBASE_DATABASE_URL: "https://firebase.test",
      LEAGUE_ID: "league",
      SYNC_TOKEN: "sync",
    },
  );

  assert.equal((await configured.json()).aiConfigured, true);
  assert.equal((await missing.json()).aiConfigured, false);
});

test("AI chat sends Gemini-compatible history to the supported model", async () => {
  const originalFetch = globalThis.fetch;
  let upstreamRequest;

  globalThis.fetch = async (request, options) => {
    upstreamRequest = { request: String(request), options };
    return Response.json({
      candidates: [{
        content: {
          parts: [{ text: "answer" }],
        },
      }],
    });
  };

  try {
    const response = await worker.fetch(
      new Request("https://worker.test/ai-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemPrompt: "Reply in Hebrew",
          messages: [
            { role: "user", content: "question" },
            { role: "assistant", content: "previous answer" },
          ],
        }),
      }),
      { GEMINI_API_KEY: "gemini-secret" },
    );

    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { content: "answer" });
    assert.equal(
      upstreamRequest.request,
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent",
    );
    assert.equal(upstreamRequest.options.headers["x-goog-api-key"], "gemini-secret");
    assert.deepEqual(JSON.parse(upstreamRequest.options.body), {
      systemInstruction: {
        parts: [{ text: "Reply in Hebrew" }],
      },
      contents: [
        { role: "user", parts: [{ text: "question" }] },
        { role: "model", parts: [{ text: "previous answer" }] },
      ],
      generationConfig: { maxOutputTokens: 1024 },
    });
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("AI chat retries a transient Gemini overload response", async () => {
  const originalFetch = globalThis.fetch;
  let attempts = 0;

  globalThis.fetch = async () => {
    attempts += 1;
    if (attempts === 1) {
      return Response.json(
        {
          error: {
            code: 503,
            message: "This model is currently experiencing high demand.",
            status: "UNAVAILABLE",
          },
        },
        {
          status: 503,
          headers: { "Retry-After": "0" },
        },
      );
    }

    return Response.json({
      candidates: [{
        content: {
          parts: [{ text: "recovered" }],
        },
      }],
    });
  };

  try {
    const response = await worker.fetch(
      new Request("https://worker.test/ai-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{ role: "user", content: "question" }],
        }),
      }),
      { GEMINI_API_KEY: "gemini-secret" },
    );

    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { content: "recovered" });
    assert.equal(attempts, 2);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("AI chat falls back to Flash when Flash-Lite quota is exhausted", async () => {
  const originalFetch = globalThis.fetch;
  const requestedModels = [];

  globalThis.fetch = async (request) => {
    const url = String(request);
    requestedModels.push(url);

    if (url.includes("gemini-2.5-flash-lite")) {
      return Response.json(
        {
          error: {
            code: 429,
            message: "Quota exceeded",
            status: "RESOURCE_EXHAUSTED",
          },
        },
        { status: 429 },
      );
    }

    return Response.json({
      candidates: [{
        content: {
          parts: [{ text: "fallback answer" }],
        },
      }],
    });
  };

  try {
    const response = await worker.fetch(
      new Request("https://worker.test/ai-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{ role: "user", content: "question" }],
        }),
      }),
      { GEMINI_API_KEY: "gemini-secret" },
    );

    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { content: "fallback answer" });
    assert.deepEqual(
      requestedModels.map((url) => url.match(/models\/([^:]+)/)?.[1]),
      ["gemini-2.5-flash-lite", "gemini-2.5-flash"],
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("live sync fetches ESPN to backfill missing knockout methods outside the polling window", async () => {
  const originalFetch = globalThis.fetch;
  const now = Date.parse("2026-07-02T12:00:00Z");
  const requests = [];
  let patchedLeague = null;

  const firebaseResponse = (url) => {
    if (url.endsWith("/liveSync.json")) {
      return {
        lastScheduleAt: now - 5 * 60 * 1000,
        lastPollAt: now - 5 * 60 * 1000,
        schedule: {
          "900001": {
            kickoff: "2026-07-01T20:00:00Z",
            stage: "knockout",
            home: "MEX",
            away: "CZE",
          },
        },
      };
    }
    if (url.endsWith("/results/g.json")) return {};
    if (url.endsWith("/results/ko.json")) {
      return {
        m79: {
          round: "r32",
          matchNo: 79,
          scheduled: true,
          t1: "MEX",
          t2: "CZE",
          score: "2-2",
          w: "MEX",
        },
      };
    }
    if (url.endsWith("/liveMeta/g.json")) {
      return {
        m79: {
          source: "espn",
          status: "finished",
          providerFixtureId: "900001",
          kickoff: "2026-07-01T20:00:00Z",
          displayClock: "FT",
          manualOverride: false,
        },
      };
    }
    throw new Error(`Unexpected Firebase URL ${url}`);
  };

  globalThis.fetch = async (request, options = {}) => {
    const url = String(request);
    requests.push({ url, method: options.method || "GET" });

    if (url.startsWith("https://firebase.test")) {
      if (options.method === "PATCH") {
        patchedLeague = JSON.parse(options.body);
        return Response.json({ ok: true });
      }
      return Response.json(firebaseResponse(url));
    }

    if (url.startsWith("https://site.api.espn.com/")) {
      return Response.json({
        events: [{
          id: "900001",
          date: "2026-07-01T20:00:00Z",
          season: { type: 1, slug: "round-of-32" },
          status: {
            displayClock: "120'",
            period: 5,
            type: {
              state: "post",
              detail: "FT-Pens",
              shortDetail: "FT-Pens",
              description: "Final Score - After Penalties",
            },
          },
          competitions: [{
            status: {
              displayClock: "120'",
              period: 5,
              type: {
                state: "post",
                detail: "FT-Pens",
                shortDetail: "FT-Pens",
                description: "Final Score - After Penalties",
              },
            },
            type: { abbreviation: "round-of-32" },
            competitors: [
              { homeAway: "home", score: "2", winner: true, team: { abbreviation: "MEX" } },
              { homeAway: "away", score: "2", winner: false, team: { abbreviation: "CZE" } },
            ],
          }],
        }],
      });
    }

    throw new Error(`Unexpected request ${url}`);
  };

  try {
    const result = await syncLiveScores(
      {
        FIREBASE_DATABASE_URL: "https://firebase.test",
        LEAGUE_ID: "league",
      },
      { now },
    );

    assert.equal(result.status, "synced");
    assert.equal(result.writes, 2);
    assert.ok(requests.some(({ url }) => url.startsWith("https://site.api.espn.com/")));
    assert.equal(patchedLeague["results/ko/m79/p"], "et");
  } finally {
    globalThis.fetch = originalFetch;
  }
});
