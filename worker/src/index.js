import { timingSafeEqual } from "node:crypto";

import {
  buildFirebasePatch,
  extractSchedule,
  shouldPoll,
  shouldRefreshSchedule,
} from "./liveScores.js";

const FULL_SCHEDULE_DATES = "20260611-20260719";
const ESPN_BASE = "https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard";
const ESPN_NEWS_URL = "https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/news";
const ESPN_HEADERS = {
  Accept: "application/json",
  "User-Agent": "mundial-live-score-sync/1.0",
};

function firebaseUrl(env, path = "") {
  const base = env.FIREBASE_DATABASE_URL.replace(/\/+$/, "");
  const suffix = path ? `/${path.replace(/^\/+/, "")}` : "";
  return `${base}/leagues/${encodeURIComponent(env.LEAGUE_ID)}${suffix}.json`;
}

async function readFirebase(env, path) {
  const response = await fetch(firebaseUrl(env, path), {
    headers: { Accept: "application/json" },
  });
  if (!response.ok) throw new Error(`Firebase GET ${path} returned ${response.status}`);
  return response.json();
}

async function patchLeague(env, patch) {
  if (!Object.keys(patch).length) return;
  const response = await fetch(firebaseUrl(env), {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  });
  if (!response.ok) throw new Error(`Firebase PATCH returned ${response.status}`);
}

async function fetchEspn(dates) {
  const url = new URL(ESPN_BASE);
  url.searchParams.set("dates", dates);
  url.searchParams.set("limit", "200");
  const response = await fetch(url, { headers: ESPN_HEADERS });
  if (!response.ok) throw new Error(`ESPN returned ${response.status}`);
  const data = await response.json();
  return Array.isArray(data?.events) ? data.events : [];
}

function nearbyDates(now) {
  const day = 24 * 60 * 60 * 1000;
  const format = (value) => new Date(value).toISOString().slice(0, 10).replaceAll("-", "");
  return `${format(now - day)}-${format(now + day)}`;
}

function sameSecret(provided, expected) {
  if (!provided || !expected) return false;
  const left = Buffer.from(provided);
  const right = Buffer.from(expected);
  return left.length === right.length && timingSafeEqual(left, right);
}

export async function syncLiveScores(env, { now = Date.now(), dryRun = false } = {}) {
  const syncState = (await readFirebase(env, "liveSync")) || {};
  let schedule = syncState.schedule || {};
  let events = null;
  let refreshedSchedule = false;

  if (shouldRefreshSchedule(syncState.lastScheduleAt, now, schedule)) {
    events = await fetchEspn(FULL_SCHEDULE_DATES);
    schedule = extractSchedule(events);
    refreshedSchedule = true;
  } else if (shouldPoll({ schedule, now, lastPollAt: syncState.lastPollAt })) {
    events = await fetchEspn(nearbyDates(now));
  }

  if (!events) {
    return { status: "idle", scheduleSize: Object.keys(schedule).length, writes: 0 };
  }

  const [groupResults, koResults, liveMeta] = await Promise.all([
    readFirebase(env, "results/g"),
    readFirebase(env, "results/ko"),
    readFirebase(env, "liveMeta/g"),
  ]);
  const scorePatch = buildFirebasePatch({
    events,
    existingResults: {
      g: groupResults || {},
      ko: koResults || {},
    },
    liveMeta: liveMeta || {},
    now,
  });
  const patch = {
    ...scorePatch,
    "liveSync/lastSuccessAt": now,
    "liveSync/lastError": null,
    "liveSync/lastErrorAt": null,
  };

  if (refreshedSchedule) {
    patch["liveSync/schedule"] = schedule;
    patch["liveSync/lastScheduleAt"] = now;
  }
  if (!refreshedSchedule || shouldPoll({ schedule, now, lastPollAt: syncState.lastPollAt })) {
    patch["liveSync/lastPollAt"] = now;
  }

  if (!dryRun) await patchLeague(env, patch);

  return {
    status: dryRun ? "dry-run" : "synced",
    scheduleSize: Object.keys(schedule).length,
    writes: Object.keys(scorePatch).filter((key) =>
      key.startsWith("results/g/") || /^results\/ko\/[^/]+\/score$/.test(key)
    ).length,
  };
}

async function runSafely(env, options) {
  try {
    const result = await syncLiveScores(env, options);
    console.log(JSON.stringify({ event: "live-score-sync", ...result }));
    return result;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(JSON.stringify({ event: "live-score-sync-error", message }));
    if (!options?.dryRun) {
      try {
        await patchLeague(env, {
          "liveSync/lastError": message,
          "liveSync/lastErrorAt": options?.now || Date.now(),
        });
      } catch (loggingError) {
        const loggingMessage =
          loggingError instanceof Error ? loggingError.message : String(loggingError);
        console.error(
          JSON.stringify({ event: "live-score-sync-error-log-failed", message: loggingMessage }),
        );
      }
    }
    throw error;
  }
}

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};
const GEMINI_MODELS = ["gemini-2.5-flash-lite", "gemini-2.5-flash"];
const GEMINI_MAX_ATTEMPTS = 3;
const GEMINI_RETRYABLE_STATUSES = new Set([500, 502, 503, 504]);

function geminiUrl(model) {
  return `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
}

function retryDelayMs(response, attempt) {
  const retryAfter = response.headers.get("Retry-After");
  const retryAfterSeconds = Number(retryAfter);
  if (retryAfter !== null && Number.isFinite(retryAfterSeconds) && retryAfterSeconds >= 0) {
    return Math.min(retryAfterSeconds * 1000, 5000);
  }
  return 300 * (2 ** attempt);
}

async function fetchGemini(options) {
  let response;
  for (const model of GEMINI_MODELS) {
    for (let attempt = 0; attempt < GEMINI_MAX_ATTEMPTS; attempt += 1) {
      response = await fetch(geminiUrl(model), options);
      if (response.ok) return response;
      if (response.status === 429) break;
      if (!GEMINI_RETRYABLE_STATUSES.has(response.status)) return response;
      if (attempt < GEMINI_MAX_ATTEMPTS - 1) {
        await new Promise((resolve) => setTimeout(resolve, retryDelayMs(response, attempt)));
      }
    }
  }
  return response;
}

async function handleTeamInsights() {
  try {
    const res = await fetch(`${ESPN_NEWS_URL}?limit=25`, { headers: ESPN_HEADERS });
    if (!res.ok) throw new Error(`ESPN news returned ${res.status}`);
    const data = await res.json();

    const articles = (data.articles || [])
      .filter((a) => a.headline)
      .slice(0, 20)
      .map((a) => ({
        headline: a.headline,
        summary: (a.description || "").replace(/\s+/g, " ").trim().slice(0, 300),
        published: (a.published || "").slice(0, 10),
        teams: (a.categories || [])
          .filter((c) => c.type === "team" || c.type === "athlete")
          .map((c) => c.description)
          .filter(Boolean)
          .slice(0, 4),
      }));

    return Response.json({ articles, updatedAt: Date.now() }, { headers: CORS_HEADERS });
  } catch (err) {
    return Response.json(
      { articles: [], error: String(err), updatedAt: Date.now() },
      { headers: CORS_HEADERS },
    );
  }
}

async function handleAiChat(request, env) {
  if (!env.GEMINI_API_KEY) {
    return Response.json(
      { error: "AI not configured — set GEMINI_API_KEY as a Worker secret" },
      { status: 503, headers: CORS_HEADERS },
    );
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400, headers: CORS_HEADERS });
  }

  const { messages, systemPrompt } = body;
  if (!Array.isArray(messages) || messages.length === 0) {
    return Response.json({ error: "messages required" }, { status: 400, headers: CORS_HEADERS });
  }

  const geminiMessages = messages.map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));

  const geminiRes = await fetchGemini({
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": env.GEMINI_API_KEY,
    },
    body: JSON.stringify({
      systemInstruction: {
        parts: [{ text: systemPrompt || "You are a helpful World Cup assistant. Always reply in Hebrew." }],
      },
      contents: geminiMessages,
      generationConfig: { maxOutputTokens: 1024 },
    }),
  });

  if (!geminiRes.ok) {
    const err = await geminiRes.text();
    return Response.json({ error: "Upstream AI error", details: err }, { status: 502, headers: CORS_HEADERS });
  }

  const data = await geminiRes.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
  return Response.json({ content: text }, { headers: CORS_HEADERS });
}

export default {
  async scheduled(_controller, env, _ctx) {
    await runSafely(env, { now: Date.now() });
  },

  async fetch(request, env, _ctx) {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    if (request.method === "GET" && url.pathname === "/health") {
      return Response.json({
        ok: true,
        provider: "espn",
        leagueConfigured: Boolean(env.LEAGUE_ID),
        firebaseConfigured: Boolean(env.FIREBASE_DATABASE_URL),
        manualSyncConfigured: Boolean(env.SYNC_TOKEN),
        aiConfigured: Boolean(env.GEMINI_API_KEY),
      });
    }

    if (request.method === "POST" && url.pathname === "/sync") {
      const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
      if (!sameSecret(token, env.SYNC_TOKEN)) {
        return Response.json({ error: "Unauthorized" }, { status: 401 });
      }
      const result = await runSafely(env, {
        now: Date.now(),
        dryRun: url.searchParams.get("dryRun") === "1",
      });
      return Response.json(result);
    }

    if (request.method === "POST" && url.pathname === "/ai-chat") {
      return handleAiChat(request, env);
    }

    if (request.method === "GET" && url.pathname === "/team-insights") {
      return handleTeamInsights();
    }

    return Response.json({ error: "Not found" }, { status: 404 });
  },
};
