import test from "node:test";
import assert from "node:assert/strict";

import {
  applyManualOverrides,
  clearManualOverride,
} from "./liveResults.js";

test("marks only changed group scores as manual overrides", () => {
  const now = 1234;
  const liveMeta = {
    "A-4": { source: "espn", status: "finished", manualOverride: false },
    "A-5": { source: "espn", status: "finished", manualOverride: false },
  };

  const next = applyManualOverrides({
    previousResults: { g: { "A-4": "2-0", "A-5": "2-1" }, ko: {} },
    nextResults: { g: { "A-4": "3-0", "A-5": "2-1" }, ko: {} },
    liveMeta,
    now,
  });

  assert.deepEqual(next["A-4"], {
    source: "manual",
    status: "manual",
    manualOverride: true,
    updatedAt: now,
  });
  assert.deepEqual(next["A-5"], liveMeta["A-5"]);
});

test("clearing a score still creates a manual override", () => {
  const next = applyManualOverrides({
    previousResults: { g: { "B-2": "0-1" }, ko: {} },
    nextResults: { g: {}, ko: {} },
    liveMeta: {},
    now: 99,
  });

  assert.equal(next["B-2"].manualOverride, true);
});

test("clearing an override preserves metadata and returns control to automation", () => {
  const current = {
    "B-2": {
      source: "manual",
      status: "manual",
      manualOverride: true,
      updatedAt: 99,
    },
  };

  const next = clearManualOverride(current, "B-2", 100);

  assert.deepEqual(next["B-2"], {
    source: "automatic",
    status: "scheduled",
    manualOverride: false,
    updatedAt: 100,
  });
});
