import test from "node:test";
import assert from "node:assert/strict";

import {
  buildBettableKnockoutSchedule,
  buildKnockoutSchedule,
} from "./bracketSchedule.js";
import { ALL_GROUP_FIXTURES } from "./worldCupData.js";

const groupAComplete = {
  "A-0": "2-0",
  "A-1": "1-1",
  "A-2": "1-0",
  "A-3": "0-0",
  "A-4": "0-0",
  "A-5": "2-0",
};

test("builds every knockout match with expected placeholders before qualifiers are known", () => {
  const schedule = buildKnockoutSchedule({ g: {}, ko: {} });

  assert.equal(schedule.length, 32);

  const match79 = schedule.find((match) => match.matchNo === 79);
  assert.equal(match79.id, "m79");
  assert.equal(match79.round, "r32");
  assert.deepEqual(
    { a: match79.a.label, b: match79.b.label },
    { a: "Winner Group A", b: "3rd Group C/E/F/H/I" },
  );

  const final = schedule.find((match) => match.matchNo === 104);
  assert.deepEqual(
    { a: final.a.label, b: final.b.label },
    { a: "Winner Match 101", b: "Winner Match 102" },
  );
});

test("resolves known group placements while keeping unresolved third-place slots visible", () => {
  const schedule = buildKnockoutSchedule({ g: groupAComplete, ko: {} });
  const match79 = schedule.find((match) => match.matchNo === 79);

  assert.equal(match79.a.team, "MEX");
  assert.equal(match79.a.label, "MEX");
  assert.equal(match79.b.team, null);
  assert.equal(match79.b.label, "3rd Group C/E/F/H/I");
});

test("propagates winners into later matches and keeps unknown opponents as winner placeholders", () => {
  const schedule = buildKnockoutSchedule({
    g: groupAComplete,
    ko: {
      m79: { round: "r32", matchNo: 79, t1: "MEX", t2: null, w: "MEX", p: "90" },
    },
  });

  const match92 = schedule.find((match) => match.matchNo === 92);
  assert.equal(match92.a.team, "MEX");
  assert.equal(match92.a.label, "MEX");
  assert.equal(match92.b.team, null);
  assert.equal(match92.b.label, "Winner Match 80");
});

test("exposes all round-of-32 matches as bettable once group stage is complete", () => {
  const groupResults = Object.fromEntries(
    ALL_GROUP_FIXTURES.map((fixture) => [fixture.id, "1-0"]),
  );

  const bettable = buildBettableKnockoutSchedule({ g: groupResults, ko: {} });
  const r32 = bettable.filter((match) => match.round === "r32");

  assert.equal(r32.length, 16);
  assert.equal(bettable.filter((match) => match.round === "r16").length, 0);
  assert.ok(r32.every((match) => match.t1 && match.t2));
});

test("exposes later rounds automatically after feeder winners are saved", () => {
  const groupResults = Object.fromEntries(
    ALL_GROUP_FIXTURES.map((fixture) => [fixture.id, "1-0"]),
  );
  const r32Schedule = buildKnockoutSchedule({ g: groupResults, ko: {} })
    .filter((match) => match.round === "r32");
  const ko = Object.fromEntries(
    r32Schedule.map((match) => [
      match.id,
      { round: match.round, matchNo: match.matchNo, w: match.t1, p: "90" },
    ]),
  );

  const bettable = buildBettableKnockoutSchedule({ g: groupResults, ko });
  const r16 = bettable.filter((match) => match.round === "r16");

  assert.equal(r16.length, 8);
  assert.ok(r16.every((match) => match.t1 && match.t2));
});
