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
  homeWinner = undefined,
  awayWinner = undefined,
  type = "group",
  displayClock = "52'",
  period = state === "post" ? 2 : 1,
  shortDetail = state === "post" ? "FT" : "52'",
  detail = shortDetail,
  description = state === "post" ? "Full Time" : "In Progress",
} = {}) => ({
  id,
  date,
  season: { type: 1 },
  status: {
    displayClock,
    period,
    type: {
      state,
      detail,
      shortDetail,
      description,
    },
  },
  competitions: [{
    type: { abbreviation: type },
    competitors: [
      { homeAway: "home", score: homeScore, winner: homeWinner, team: { abbreviation: home } },
      { homeAway: "away", score: awayScore, winner: awayWinner, team: { abbreviation: away } },
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

test("refreshes a group-only schedule cache after its polling windows are exhausted", () => {
  const now = Date.parse("2026-06-30T06:30:00Z");
  const groupOnlySchedule = extractSchedule([
    espnEvent({ id: "760485", date: "2026-06-28T02:00:00Z" }),
  ]);
  const expandedSchedule = extractSchedule([
    espnEvent({ id: "760485", date: "2026-06-28T02:00:00Z" }),
    espnEvent({
      id: "760486",
      date: "2026-06-28T19:00:00Z",
      type: "round-of-32",
    }),
  ]);

  assert.equal(shouldRefreshSchedule(now - 31 * 60 * 1000, now, groupOnlySchedule), true);
  assert.equal(shouldRefreshSchedule(now - 29 * 60 * 1000, now, groupOnlySchedule), false);
  assert.equal(shouldRefreshSchedule(now - 31 * 60 * 1000, now, expandedSchedule), false);
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
    period: 1,
    statusText: "52' In Progress",
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

test("fills an ESPN knockout score when only the winner was saved for bracket progression", () => {
  const now = Date.parse("2026-07-01T20:30:00Z");
  const patch = buildFirebasePatch({
    events: [
      espnEvent({
        id: "900001",
        date: "2026-07-01T20:00:00Z",
        state: "post",
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
          w: "MEX",
        },
      },
    },
    liveMeta: {},
    now,
  });

  assert.equal(patch["results/ko/m79/score"], "2-1");
  assert.equal(patch["results/ko/m79/w"], "MEX");
  assert.deepEqual(patch["liveMeta/g/m79"], {
    source: "espn",
    status: "finished",
    providerFixtureId: "900001",
    kickoff: "2026-07-01T20:00:00Z",
    displayClock: "52'",
    updatedAt: now,
    manualOverride: false,
  });
});

test("recovers a winner-only knockout match that was previously tagged as manual", () => {
  const now = Date.parse("2026-07-01T20:30:00Z");
  const patch = buildFirebasePatch({
    events: [
      espnEvent({
        id: "900001",
        date: "2026-07-01T20:00:00Z",
        state: "post",
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
          w: "MEX",
        },
      },
    },
    liveMeta: {
      m79: {
        source: "manual",
        status: "manual",
        manualOverride: true,
        updatedAt: now - 1,
      },
    },
    now,
  });

  assert.equal(patch["results/ko/m79/score"], "2-1");
  assert.equal(patch["liveMeta/g/m79"].source, "espn");
  assert.equal(patch["liveMeta/g/m79"].manualOverride, false);
});

test("fills an ESPN knockout score when winner and method were saved without a score", () => {
  const now = Date.parse("2026-07-01T20:30:00Z");
  const patch = buildFirebasePatch({
    events: [
      espnEvent({
        id: "900001",
        date: "2026-07-01T20:00:00Z",
        state: "post",
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
          w: "MEX",
          p: "90",
        },
      },
    },
    liveMeta: {
      m79: {
        source: "manual",
        status: "manual",
        manualOverride: true,
        updatedAt: now - 1,
      },
    },
    now,
  });

  assert.equal(patch["results/ko/m79/score"], "2-1");
  assert.equal(patch["results/ko/m79/w"], "MEX");
  assert.equal("results/ko/m79/p" in patch, false);
});

test("protects an existing knockout score without metadata as a manual override", () => {
  const now = Date.parse("2026-07-01T20:30:00Z");
  const patch = buildFirebasePatch({
    events: [
      espnEvent({
        id: "900001",
        date: "2026-07-01T20:00:00Z",
        state: "post",
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
          score: "9-9",
          w: "MEX",
          p: "90",
        },
      },
    },
    liveMeta: {},
    now,
  });

  assert.equal("results/ko/m79/score" in patch, false);
  assert.deepEqual(patch["liveMeta/g/m79"], {
    source: "manual",
    status: "manual",
    updatedAt: now,
    manualOverride: true,
  });
});

test("fills knockout method as regulation for finished matches that did not reach extra time", () => {
  const now = Date.parse("2026-07-01T22:00:00Z");
  const patch = buildFirebasePatch({
    events: [
      espnEvent({
        id: "900001",
        date: "2026-07-01T20:00:00Z",
        state: "post",
        type: "round-of-32",
        home: "MEX",
        away: "CZE",
        homeScore: "2",
        awayScore: "1",
        homeWinner: true,
        displayClock: "90'+4'",
        period: 2,
        shortDetail: "FT",
        detail: "FT",
        description: "Full Time",
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

  assert.equal(patch["results/ko/m79/w"], "MEX");
  assert.equal(patch["results/ko/m79/p"], "90");
});

test("fills knockout method as extra time for matches decided after extra time or penalties", () => {
  const now = Date.parse("2026-07-01T22:45:00Z");
  const patch = buildFirebasePatch({
    events: [
      espnEvent({
        id: "900001",
        date: "2026-07-01T20:00:00Z",
        state: "post",
        type: "round-of-32",
        home: "MEX",
        away: "CZE",
        homeScore: "2",
        awayScore: "2",
        homeWinner: true,
        awayWinner: false,
        displayClock: "120'",
        period: 5,
        shortDetail: "FT-Pens",
        detail: "FT-Pens",
        description: "Final Score - After Penalties",
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

  assert.equal(patch["results/ko/m79/score"], "2-2");
  assert.equal(patch["results/ko/m79/w"], "MEX");
  assert.equal(patch["results/ko/m79/p"], "et");
});
