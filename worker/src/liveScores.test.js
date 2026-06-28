import test from "node:test";
import assert from "node:assert/strict";

import {
  buildFirebasePatch,
  extractSchedule,
  isPollingWindowOpen,
  normalizeEspnEvent,
  shouldPoll,
  shouldRefreshSchedule,
} from "./liveScores.js";

const espnEvent = ({
  id = "760420",
  date = "2026-06-13T19:00:00Z",
  state = "in",
  home = "QAT",
  away = "SUI",
  homeScore = "0",
  awayScore = "1",
  type = "group",
  displayClock = "52'",
  shortDetail = state === "post" ? "FT" : "52'",
} = {}) => ({
  id,
  date,
  season: { type: 1 },
  status: {
    displayClock,
    type: {
      state,
      detail: shortDetail,
      shortDetail,
      description: state === "post" ? "Final" : "In Progress",
    },
  },
  competitions: [{
    type: { abbreviation: type },
    competitors: [
      { homeAway: "home", score: homeScore, team: { abbreviation: home } },
      { homeAway: "away", score: awayScore, team: { abbreviation: away } },
    ],
  }],
});

test("extracts group and knockout tournament events into the cached schedule", () => {
  const schedule = extractSchedule([
    espnEvent({ id: "1" }),
    espnEvent({ id: "2", type: "round-of-32" }),
  ]);

  assert.deepEqual(Object.keys(schedule), ["1", "2"]);
  assert.equal(schedule["1"].home, "QAT");
  assert.equal(schedule["1"].away, "SUI");
  assert.equal(schedule["2"].home, "QAT");
  assert.equal(schedule["2"].away, "SUI");
});

test("opens the polling window ten minutes before kickoff and closes four hours later", () => {
  const schedule = extractSchedule([espnEvent()]);

  assert.equal(isPollingWindowOpen(schedule, Date.parse("2026-06-13T18:49:59Z")), false);
  assert.equal(isPollingWindowOpen(schedule, Date.parse("2026-06-13T18:50:00Z")), true);
  assert.equal(isPollingWindowOpen(schedule, Date.parse("2026-06-13T22:59:59Z")), true);
  assert.equal(isPollingWindowOpen(schedule, Date.parse("2026-06-13T23:00:01Z")), false);
});

test("polls at most once every five minutes while a window is open", () => {
  const schedule = extractSchedule([espnEvent()]);
  const now = Date.parse("2026-06-13T19:30:00Z");

  assert.equal(shouldPoll({ schedule, now, lastPollAt: now - 300_000 }), true);
  assert.equal(shouldPoll({ schedule, now, lastPollAt: now - 299_999 }), false);
  assert.equal(shouldPoll({ schedule, now: Date.parse("2026-06-13T10:00:00Z"), lastPollAt: 0 }), false);
});

test("refreshes the full schedule twice per day", () => {
  const now = Date.parse("2026-06-13T12:00:00Z");

  assert.equal(shouldRefreshSchedule(0, now), true);
  assert.equal(shouldRefreshSchedule(now - 12 * 60 * 60 * 1000, now), true);
  assert.equal(shouldRefreshSchedule(now - 11 * 60 * 60 * 1000, now), false);
});

test("normalizes ESPN live and final events", () => {
  assert.deepEqual(normalizeEspnEvent(espnEvent()), {
    providerFixtureId: "760420",
    kickoff: "2026-06-13T19:00:00Z",
    stage: "group",
    home: "QAT",
    away: "SUI",
    homeScore: 0,
    awayScore: 1,
    winner: null,
    status: "live",
    displayClock: "52'",
  });

  assert.equal(normalizeEspnEvent(espnEvent({ state: "post" })).status, "finished");
  assert.equal(
    normalizeEspnEvent(espnEvent({ displayClock: null, shortDetail: "HT" })).displayClock,
    "HT",
  );
});

test("writes the mapped live score in app fixture order without touching other results", () => {
  const now = Date.parse("2026-06-13T19:30:00Z");
  const patch = buildFirebasePatch({
    events: [espnEvent()],
    existingResults: { "A-5": "2-1" },
    liveMeta: { "A-5": { manualOverride: true } },
    now,
  });

  assert.equal(patch["results/g/B-2"], "1-0");
  assert.deepEqual(patch["liveMeta/g/B-2"], {
    source: "espn",
    status: "live",
    providerFixtureId: "760420",
    kickoff: "2026-06-13T19:00:00Z",
    displayClock: "52'",
    updatedAt: now,
    manualOverride: false,
  });
  assert.equal("results/g/A-5" in patch, false);
});

test("never overwrites an explicit manual override", () => {
  const patch = buildFirebasePatch({
    events: [espnEvent()],
    existingResults: { "B-2": "3-3" },
    liveMeta: { "B-2": { manualOverride: true, source: "manual" } },
    now: Date.now(),
  });

  assert.deepEqual(patch, {});
});

test("protects a legacy score with no metadata as a manual override", () => {
  const now = Date.now();
  const patch = buildFirebasePatch({
    events: [espnEvent()],
    existingResults: { "B-2": "3-3" },
    liveMeta: {},
    now,
  });

  assert.deepEqual(patch, {
    "liveMeta/g/B-2": {
      source: "manual",
      status: "manual",
      updatedAt: now,
      manualOverride: true,
    },
  });
});

test("pre-match and malformed responses do not clear known scores", () => {
  const patch = buildFirebasePatch({
    events: [
      espnEvent({ state: "pre", homeScore: "0", awayScore: "0" }),
      { id: "broken" },
    ],
    existingResults: { "B-2": "2-0" },
    liveMeta: { "B-2": { manualOverride: false } },
    now: Date.now(),
  });

  assert.deepEqual(patch, {});
});

test("writes knockout live scores into matching knockout result records", () => {
  const now = Date.parse("2026-07-01T20:30:00Z");
  const patch = buildFirebasePatch({
    events: [
      espnEvent({
        id: "900001",
        date: "2026-07-01T20:00:00Z",
        type: "round-of-32",
        home: "CZE",
        away: "MEX",
        homeScore: "1",
        awayScore: "2",
      }),
    ],
    existingResults: {
      g: {},
      ko: {
        m79: {
          round: "r32",
          matchNo: 79,
          scheduled: true,
          t1: "MEX",
          t2: "CZE",
        },
      },
    },
    liveMeta: {},
    now,
  });

  assert.equal(patch["results/ko/m79/round"], "r32");
  assert.equal(patch["results/ko/m79/matchNo"], 79);
  assert.equal(patch["results/ko/m79/scheduled"], true);
  assert.equal(patch["results/ko/m79/t1"], "MEX");
  assert.equal(patch["results/ko/m79/t2"], "CZE");
  assert.equal(patch["results/ko/m79/score"], "2-1");
  assert.deepEqual(patch["liveMeta/g/m79"], {
    source: "espn",
    status: "live",
    providerFixtureId: "900001",
    kickoff: "2026-07-01T20:00:00Z",
    displayClock: "52'",
    updatedAt: now,
    manualOverride: false,
  });
});
