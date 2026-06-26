import test from "node:test";
import assert from "node:assert/strict";

import { ALL_GROUP_FIXTURES } from "./worldCupData.js";
import { buildTeamTournamentRows } from "./teamStandings.js";

const baseConfig = {
  players: [
    { id: "p1", name: "Anna" },
    { id: "p2", name: "Bo" },
  ],
  assign: {
    MEX: "p1",
    CZE: "p1",
    KOR: "p2",
    RSA: "p2",
  },
};

const fullGroupResults = () => {
  const g = Object.fromEntries(ALL_GROUP_FIXTURES.map((fixture) => [fixture.id, "0-0"]));
  return {
    ...g,
    "A-0": "2-0",
    "A-1": "1-1",
    "A-2": "1-0",
    "A-3": "0-0",
    "A-4": "0-0",
    "A-5": "2-0",
  };
};

test("builds team tournament rows with owner, group, points, and elimination status", () => {
  const rows = buildTeamTournamentRows(baseConfig, { g: fullGroupResults(), ko: {} });

  assert.equal(rows.length, 48);
  assert.ok(rows.every((row, index) => index === 0 || rows[index - 1].points >= row.points));

  const mexico = rows.find((row) => row.team === "MEX");
  assert.deepEqual(
    {
      group: mexico.group,
      ownerId: mexico.ownerId,
      ownerName: mexico.ownerName,
      points: mexico.points,
      eliminated: mexico.eliminated,
    },
    {
      group: "A",
      ownerId: "p1",
      ownerName: "Anna",
      points: 7,
      eliminated: false,
    },
  );

  const czechia = rows.find((row) => row.team === "CZE");
  assert.equal(czechia.points, 1);
  assert.equal(czechia.eliminated, true);
  assert.equal(czechia.status, "eliminated");
});

test("adds knockout points and marks the loser as eliminated", () => {
  const rows = buildTeamTournamentRows(baseConfig, {
    g: fullGroupResults(),
    ko: {
      "m-73": { round: "r32", t1: "MEX", t2: "KOR", w: "MEX", p: "et" },
    },
  });

  const mexico = rows.find((row) => row.team === "MEX");
  const korea = rows.find((row) => row.team === "KOR");

  assert.equal(mexico.points, 10);
  assert.equal(mexico.eliminated, false);
  assert.equal(korea.points, 5);
  assert.equal(korea.eliminated, true);
  assert.equal(korea.status, "eliminated");
});
