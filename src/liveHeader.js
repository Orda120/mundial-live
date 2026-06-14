import { ALL_GROUP_FIXTURES } from "./worldCupData.js";

const FIXTURES_BY_ID = new Map(
  ALL_GROUP_FIXTURES.map((fixture) => [fixture.id, fixture]),
);

export function selectLiveMatches({ results, liveMeta }) {
  const groupResults = results?.g || {};

  return Object.entries(liveMeta || {})
    .flatMap(([fixtureId, meta]) => {
      const fixture = FIXTURES_BY_ID.get(fixtureId);
      const score = groupResults[fixtureId];

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
        score,
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
