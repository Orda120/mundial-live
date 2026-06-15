import test from "node:test";
import assert from "node:assert/strict";

import worker from "./index.js";

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
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent",
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
