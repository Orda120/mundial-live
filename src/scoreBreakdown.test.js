import test from "node:test";
import assert from "node:assert/strict";

import {
  createScoreBreakdownRow,
  recordDraftKoPoints,
  recordKoBetPoints,
  summarizeScoreBreakdown,
} from "./scoreBreakdown.js";

test("awards one draft point to the knockout loser when the match reaches extra time", () => {
  const row = createScoreBreakdownRow({ id: "p1" });

  recordDraftKoPoints(row, {
    match: { id: "ko-1", t1: "ARG", t2: "FRA", w: "ARG", p: "et" },
    teams: ["ARG", "FRA"],
  });

  const summary = summarizeScoreBreakdown(row);

  assert.equal(summary.total, 4);
  assert.equal(row.byType.draftKoWin, 3);
  assert.equal(row.byType.draftKoExtraLoss, 1);
  assert.equal(row.byTeam.ARG, 3);
  assert.equal(row.byTeam.FRA, 1);
});

test("does not award a draft point to the knockout loser in normal time", () => {
  const row = createScoreBreakdownRow({ id: "p1" });

  recordDraftKoPoints(row, {
    match: { id: "ko-1", t1: "ARG", t2: "FRA", w: "ARG", p: "90" },
    teams: ["ARG", "FRA"],
  });

  const summary = summarizeScoreBreakdown(row);

  assert.equal(summary.total, 3);
  assert.equal(row.byType.draftKoWin, 3);
  assert.equal(row.byType.draftKoExtraLoss, undefined);
  assert.equal(row.byTeam.ARG, 3);
  assert.equal(row.byTeam.FRA, undefined);
});

test("awards the knockout method bonus when the saved result method matches the bet", () => {
  const row = createScoreBreakdownRow({ id: "p1" });

  recordKoBetPoints(row, {
    match: { id: "ko-1", t1: "ARG", t2: "FRA", w: "ARG", p: "et" },
    bet: { t: "ARG", p: "et" },
  });

  const summary = summarizeScoreBreakdown(row);

  assert.equal(summary.total, 2);
  assert.equal(row.byType.matchKoWinner, 1);
  assert.equal(row.byType.matchKoMethod, 1);
});

test("does not award the knockout method bonus until the saved result has a method", () => {
  const row = createScoreBreakdownRow({ id: "p1" });

  recordKoBetPoints(row, {
    match: { id: "ko-1", t1: "ARG", t2: "FRA", w: "ARG", p: null },
    bet: { t: "ARG", p: "et" },
  });

  const summary = summarizeScoreBreakdown(row);

  assert.equal(summary.total, 1);
  assert.equal(row.byType.matchKoWinner, 1);
  assert.equal(row.byType.matchKoMethod, undefined);
});
