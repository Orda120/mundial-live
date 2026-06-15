import test from "node:test";
import assert from "node:assert/strict";

import { DEFAULT_AI_WORKER_URL, resolveAiWorkerUrl } from "./aiConfig.js";

test("uses the deployed Worker when the league has no saved AI URL", () => {
  assert.equal(resolveAiWorkerUrl(""), DEFAULT_AI_WORKER_URL);
  assert.equal(resolveAiWorkerUrl(undefined), DEFAULT_AI_WORKER_URL);
});

test("normalizes a custom Worker URL", () => {
  assert.equal(
    resolveAiWorkerUrl(" https://example.workers.dev/// "),
    "https://example.workers.dev",
  );
});
