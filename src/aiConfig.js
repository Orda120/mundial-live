export const DEFAULT_AI_WORKER_URL =
  "https://mundial-live-scores.ordahan120.workers.dev";

export function resolveAiWorkerUrl(value) {
  const normalized = typeof value === "string"
    ? value.trim().replace(/\/+$/, "")
    : "";
  return normalized || DEFAULT_AI_WORKER_URL;
}
