import test from "node:test";
import assert from "node:assert/strict";

import { buildKnockoutSchedule } from "./bracketSchedule.js";

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
