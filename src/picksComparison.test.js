import test from "node:test";
import assert from "node:assert/strict";

import { buildKnockoutSchedule } from "./bracketSchedule.js";
import { buildLockedPicksComparison } from "./picksComparison.js";
import { ALL_GROUP_FIXTURES } from "./worldCupData.js";

const players = [
  { id: "p1", name: "Anna" },
  { id: "p2", name: "Bo" },
  { id: "p3", name: "Chen" },
];

const baseConfig = (locks) => ({
  players,
  locks: {
    bracket: false,
    groups: false,
    ko: {},
    ...locks,
  },
});

const fullGroupResults = () =>
  Object.fromEntries(ALL_GROUP_FIXTURES.map((fixture) => [fixture.id, "1-0"]));

test("comparison data is unavailable when bracket lock is false", () => {
  const data = buildLockedPicksComparison({
    config: baseConfig({ groups: true, ko: { r32: true } }),
    results: { g: fullGroupResults(), ko: {} },
    betsAll: {
      p1: { g: { "A-0": "1" }, ko: { m79: { t: "MEX", p: "90" } }, br: { win: ["MEX"] } },
    },
  });

  assert.equal(data.bracketAvailable, false);
  assert.deepEqual(data.bracketRounds, []);
  assert.deepEqual(data.groupMatches, []);
  assert.ok(data.koRounds.every((round) => round.locked === false && round.matches.length === 0));
});

test("bracket tiers aggregate teams by player and include missing players", () => {
  const data = buildLockedPicksComparison({
    config: baseConfig({ bracket: true }),
    betsAll: {
      p1: { br: { r16: ["MEX", "CAN"] } },
      p2: { br: { r16: ["CAN"] } },
      p3: { br: { r16: [] } },
    },
  });

  const round = data.bracketRounds.find((item) => item.tierKey === "r16");

  assert.equal(round.required, 16);
  assert.deepEqual(
    round.rows.map((row) => ({ team: row.team, playerIds: row.playerIds, count: row.count, pct: row.pct })),
    [
      { team: "CAN", playerIds: ["p1", "p2"], count: 2, pct: 67 },
      { team: "MEX", playerIds: ["p1"], count: 1, pct: 33 },
    ],
  );
  assert.deepEqual(round.missingPlayerIds, ["p3"]);
});

test("group match picks are hidden before group lock and revealed after it", () => {
  const betsAll = {
    p1: { g: { "A-0": "1" } },
    p2: { g: { "A-0": "X" } },
    p3: { g: {} },
  };

  const hidden = buildLockedPicksComparison({
    config: baseConfig({ bracket: true, groups: false }),
    betsAll,
  });
  assert.deepEqual(hidden.groupMatches, []);

  const revealed = buildLockedPicksComparison({
    config: baseConfig({ bracket: true, groups: true }),
    results: { g: {}, ko: {} },
    betsAll,
  });
  const match = revealed.groupMatches.find((item) => item.id === "A-0");

  assert.deepEqual(match.buckets, { "1": ["p1"], X: ["p2"], "2": [], none: ["p3"] });
});

test("ko picks reveal only locked rounds and never leak later unlocked-round bets", () => {
  const results = {
    g: fullGroupResults(),
    ko: { "custom-r16": { round: "r16", t1: "MEX", t2: "CAN", w: null, p: null } },
  };
  const r32Match = buildKnockoutSchedule(results).find((match) => match.round === "r32" && match.t1 && match.t2);

  const data = buildLockedPicksComparison({
    config: baseConfig({ bracket: true, ko: { r32: true, r16: false } }),
    results,
    betsAll: {
      p1: { ko: { [r32Match.id]: { t: r32Match.t1, p: "90" } } },
      p2: { ko: { "custom-r16": { t: "MEX", p: "et" } } },
    },
  });

  const lockedR32 = data.koRounds.find((round) => round.roundKey === "r32");
  const openR16 = data.koRounds.find((round) => round.roundKey === "r16");
  const match = lockedR32.matches.find((item) => item.id === r32Match.id);

  assert.equal(lockedR32.locked, true);
  assert.deepEqual(match.winnerBuckets[r32Match.t1], ["p1"]);
  assert.deepEqual(match.methodBuckets["90"], ["p1"]);
  assert.equal(openR16.locked, false);
  assert.deepEqual(openR16.matches, []);
  assert.equal(JSON.stringify(data).includes("custom-r16"), false);
});

test("bracket sorting is stable by count, team code, and player order", () => {
  const data = buildLockedPicksComparison({
    config: baseConfig({ bracket: true }),
    betsAll: {
      p2: { br: { qf: ["MEX", "CAN"] } },
      p1: { br: { qf: ["MEX", "CAN"] } },
      p3: { br: { qf: ["KOR"] } },
    },
  });

  const round = data.bracketRounds.find((item) => item.tierKey === "qf");

  assert.deepEqual(round.rows.map((row) => row.team), ["CAN", "MEX", "KOR"]);
  assert.deepEqual(round.rows.find((row) => row.team === "CAN").playerIds, ["p1", "p2"]);
});
