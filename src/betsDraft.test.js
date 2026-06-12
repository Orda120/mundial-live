import test from "node:test";
import assert from "node:assert/strict";

import { syncBetsDraft } from "./betsDraft.js";

const empty = () => ({ g: {}, ko: {}, br: { r32: [], r16: [], qf: [], sf: [], fin: [], win: [] } });

test("hydrates an untouched draft when Firebase bets arrive after mount", () => {
  const initial = empty();
  const saved = { ...empty(), g: { "A-0": "1", "B-3": "X" } };

  const next = syncBetsDraft(
    { playerId: "p1", saved: initial, draft: initial },
    "p1",
    saved
  );

  assert.deepEqual(next.draft, saved);
  assert.deepEqual(next.saved, saved);
});

test("keeps unsaved local picks when a Firebase update arrives", () => {
  const initial = empty();
  const draft = { ...empty(), g: { "C-2": "2" } };
  const saved = { ...empty(), g: { "A-0": "1" } };

  const next = syncBetsDraft(
    { playerId: "p1", saved: initial, draft },
    "p1",
    saved
  );

  assert.deepEqual(next.draft, draft);
  assert.deepEqual(next.saved, saved);
});

test("loads the selected player's bets when identity changes", () => {
  const previous = { ...empty(), g: { "A-0": "1" } };
  const saved = { ...empty(), g: { "D-4": "2" } };

  const next = syncBetsDraft(
    { playerId: "p1", saved: previous, draft: previous },
    "p2",
    saved
  );

  assert.equal(next.playerId, "p2");
  assert.deepEqual(next.draft, saved);
  assert.deepEqual(next.saved, saved);
});
