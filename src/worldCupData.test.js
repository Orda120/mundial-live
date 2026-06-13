import test from "node:test";
import assert from "node:assert/strict";

import {
  ALL_GROUP_FIXTURES,
  GROUP_KEYS,
  fixtureIdForTeams,
} from "./worldCupData.js";

test("builds six unique fixtures for every group", () => {
  assert.equal(GROUP_KEYS.length, 12);
  assert.equal(ALL_GROUP_FIXTURES.length, 72);
  assert.equal(new Set(ALL_GROUP_FIXTURES.map((fixture) => fixture.id)).size, 72);
});

test("maps a provider team pair to the existing fixture id in either order", () => {
  assert.equal(fixtureIdForTeams("MEX", "RSA"), "A-4");
  assert.equal(fixtureIdForTeams("RSA", "MEX"), "A-4");
  assert.equal(fixtureIdForTeams("QAT", "SUI"), "B-2");
});

test("does not map teams from different groups", () => {
  assert.equal(fixtureIdForTeams("MEX", "CAN"), null);
});
