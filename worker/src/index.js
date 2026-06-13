import { timingSafeEqual } from "node:crypto";

import {
  buildFirebasePatch,
  extractSchedule,
  shouldPoll,
  shouldRefreshSchedule,
} from "./liveScores.js";

const FULL_SCHEDULE_DATES = "20260611-20260719";
const ESPN_BASE = "https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard";
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

  if (shouldRefreshSchedule(syncState.lastScheduleAt, now)) {
    events = await fetchEspn(FULL_SCHEDULE_DATES);
    schedule = extractSchedule(events);
    refreshedSchedule = true;
  } else if (shouldPoll({ schedule, now, lastPollAt: syncState.lastPollAt })) {
    events = await fetchEspn(nearbyDates(now));
  }

  if (!events) {
    return { status: "idle", scheduleSize: Object.keys(schedule).length, writes: 0 };
  }

  const [existingResults, liveMeta] = await Promise.all([
    readFirebase(env, "results/g"),
    readFirebase(env, "liveMeta/g"),
  ]);
  const scorePatch = buildFirebasePatch({
    events,
    existingResults: existingResults || {},
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
    writes: Object.keys(scorePatch).filter((key) => key.startsWith("results/g/")).length,
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

export default {
  async scheduled(_controller, env, _ctx) {
    await runSafely(env, { now: Date.now() });
  },

  async fetch(request, env, _ctx) {
    const url = new URL(request.url);

    if (request.method === "GET" && url.pathname === "/health") {
      return Response.json({
        ok: true,
        provider: "espn",
        leagueConfigured: Boolean(env.LEAGUE_ID),
        firebaseConfigured: Boolean(env.FIREBASE_DATABASE_URL),
        manualSyncConfigured: Boolean(env.SYNC_TOKEN),
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

    return Response.json({ error: "Not found" }, { status: 404 });
  },
};
