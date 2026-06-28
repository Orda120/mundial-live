import { ALL_GROUP_FIXTURES } from "./worldCupData.js";
import { buildKnockoutSchedule } from "./bracketSchedule.js";

const FIXTURES_BY_ID = new Map(
  ALL_GROUP_FIXTURES.map((fixture) => [fixture.id, fixture]),
);

function scoreForVisualOrder(score) {
  const trimmed = String(score || "").trim();
  const match = trimmed.match(/^(\d+)(\s*[:–—-]\s*)(\d+)$/);

  // The live header is rendered inside the app's RTL layout, so the second team
  // appears on the visual left before the first team. Flip only the displayed
  // header score so each number stays next to the side it belongs to.
  if (!match) return trimmed;
  return `${match[3]}${match[2]}${match[1]}`;
}

export function selectLiveMatches({ results, liveMeta }) {
  const groupResults = results?.g || {};
  const koResults = results?.ko || {};
  const knockoutMatches = new Map(
    buildKnockoutSchedule(results).map((match) => [match.id, match]),
  );

  return Object.entries(liveMeta || {})
    .flatMap(([fixtureId, meta]) => {
      let fixture = FIXTURES_BY_ID.get(fixtureId);
      let score = groupResults[fixtureId];

      if (!fixture) {
        const knockoutMatch = knockoutMatches.get(fixtureId);
        if (knockoutMatch?.t1 && knockoutMatch?.t2) {
          fixture = knockoutMatch;
          score = koResults[fixtureId]?.score || knockoutMatch.score;
        }
      }

      if (
        !fixture ||
        meta?.source !== "espn" ||
        meta?.status !== "live" ||
        meta?.manualOverride ||
        typeof score !== "string" ||
        !score.trim()
      ) {
        return [];
      }

      return [{
        id: fixture.id,
        t1: fixture.t1,
        t2: fixture.t2,
        score: scoreForVisualOrder(score),
        kickoff: meta.kickoff || "",
        displayClock: meta.displayClock || "",
      }];
    })
    .sort((left, right) => {
      const kickoffOrder =
        (Date.parse(left.kickoff) || Number.POSITIVE_INFINITY) -
        (Date.parse(right.kickoff) || Number.POSITIVE_INFINITY);
      return kickoffOrder || left.id.localeCompare(right.id);
    });
}
