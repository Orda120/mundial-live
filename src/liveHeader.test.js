import test from "node:test";
import assert from "node:assert/strict";

import { selectLiveMatches } from "./liveHeader.js";

test("selects only scored automatic live fixtures", () => {
  const matches = selectLiveMatches({
    results: {
      g: {
        "B-2": "1-0",
        "D-5": "2-1",
        "E-5": "0-0",
        "F-0": "3-2",
      },
    },
    liveMeta: {
      "B-2": {
        source: "espn",
        status: "live",
        manualOverride: false,
        kickoff: "2026-06-13T19:00:00Z",
        displayClock: "52'",
      },
      "D-5": {
        source: "manual",
        status: "live",
        manualOverride: true,
        kickoff: "2026-06-14T04:00:00Z",
      },
      "E-5": {
        source: "espn",
        status: "finished",
        manualOverride: false,
        kickoff: "2026-06-14T23:00:00Z",
      },
      "F-0": {
        source: "espn",
        status: "live",
        manualOverride: false,
        kickoff: "2026-06-14T20:00:00Z",
      },
      "G-0": {
        source: "espn",
        status: "live",
        manualOverride: false,
        kickoff: "2026-06-15T20:00:00Z",
      },
    },
  });

  assert.deepEqual(matches, [
    {
      id: "B-2",
      t1: "SUI",
      t2: "QAT",
      score: "0-1",
      kickoff: "2026-06-13T19:00:00Z",
      displayClock: "52'",
    },
    {
      id: "F-0",
      t1: "NED",
      t2: "JPN",
      score: "2-3",
      kickoff: "2026-06-14T20:00:00Z",
      displayClock: "",
    },
  ]);
});

test("sorts simultaneous live matches by kickoff and fixture id", () => {
  const matches = selectLiveMatches({
    results: { g: { "E-5": "1-2", "D-5": "0-0", "B-2": "2-2" } },
    liveMeta: {
      "E-5": {
        source: "espn",
        status: "live",
        manualOverride: false,
        kickoff: "2026-06-14T23:00:00Z",
      },
      "D-5": {
        source: "espn",
        status: "live",
        manualOverride: false,
        kickoff: "2026-06-14T04:00:00Z",
      },
      "B-2": {
        source: "espn",
        status: "live",
        manualOverride: false,
        kickoff: "2026-06-14T04:00:00Z",
      },
    },
  });

  assert.deepEqual(matches.map(({ id }) => id), ["B-2", "D-5", "E-5"]);
});
