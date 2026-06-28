import { buildBettableKnockoutSchedule } from "./bracketSchedule.js";
import { ALL_GROUP_FIXTURES } from "./worldCupData.js";

export const COMPARISON_TIERS = [
  { tierKey: "r32", required: 32 },
  { tierKey: "r16", required: 16 },
  { tierKey: "qf", required: 8 },
  { tierKey: "sf", required: 4 },
  { tierKey: "fin", required: 2 },
  { tierKey: "win", required: 1 },
];

export const COMPARISON_KO_ROUNDS = ["r32", "r16", "qf", "sf", "p3", "f"];

const GROUP_PICK_KEYS = ["1", "X", "2"];
const METHOD_KEYS = ["90", "et"];

function playerIds(config) {
  return (config?.players || []).map((player) => player.id);
}

function sortByPlayerOrder(ids, order) {
  const index = new Map(order.map((id, idx) => [id, idx]));
  return [...ids].sort((a, b) => (index.get(a) ?? 9999) - (index.get(b) ?? 9999) || a.localeCompare(b));
}

function uniqueValidTeams(teams) {
  return [...new Set((teams || []).filter(Boolean))];
}

function sortMatches(matches) {
  return [...matches].sort((a, b) => {
    const aDone = !!(a.result || a.winner);
    const bDone = !!(b.result || b.winner);
    return Number(aDone) - Number(bDone) || (a.matchNo || 999) - (b.matchNo || 999) || a.id.localeCompare(b.id);
  });
}

function emptyGroupBuckets() {
  return { "1": [], X: [], "2": [], none: [] };
}

function emptyMethodBuckets() {
  return { "90": [], et: [], none: [] };
}

function buildBracketRounds({ config, betsAll, ids }) {
  const playerCount = Math.max(ids.length, 1);
  return COMPARISON_TIERS.map((tier) => {
    const byTeam = new Map();
    const missingPlayerIds = [];

    ids.forEach((playerId) => {
      const picks = uniqueValidTeams(betsAll?.[playerId]?.br?.[tier.tierKey]);
      if (picks.length === 0) missingPlayerIds.push(playerId);
      picks.forEach((team) => {
        if (!byTeam.has(team)) byTeam.set(team, []);
        byTeam.get(team).push(playerId);
      });
    });

    const rows = [...byTeam.entries()]
      .map(([team, rawPlayerIds]) => {
        const pickedBy = sortByPlayerOrder(rawPlayerIds, ids);
        return {
          team,
          playerIds: pickedBy,
          count: pickedBy.length,
          pct: Math.round((pickedBy.length / playerCount) * 100),
        };
      })
      .sort((a, b) => b.count - a.count || a.team.localeCompare(b.team));

    return {
      tierKey: tier.tierKey,
      required: tier.required,
      rows,
      missingPlayerIds: sortByPlayerOrder(missingPlayerIds, ids),
    };
  });
}

function buildGroupMatches({ config, results, betsAll, ids }) {
  if (!config?.locks?.groups) return [];

  const matches = ALL_GROUP_FIXTURES.map((fixture) => {
    const buckets = emptyGroupBuckets();
    ids.forEach((playerId) => {
      const pick = betsAll?.[playerId]?.g?.[fixture.id];
      if (GROUP_PICK_KEYS.includes(pick)) buckets[pick].push(playerId);
      else buckets.none.push(playerId);
    });

    return {
      id: fixture.id,
      matchNo: null,
      t1: fixture.t1,
      t2: fixture.t2,
      result: results?.g?.[fixture.id] || null,
      buckets,
    };
  });

  return sortMatches(matches).map(({ matchNo, ...match }) => match);
}

function buildKoRounds({ config, results, betsAll, ids }) {
  const locks = config?.locks?.ko || {};
  const matches = buildBettableKnockoutSchedule(results);

  return COMPARISON_KO_ROUNDS.map((roundKey) => {
    const locked = !!locks[roundKey];
    if (!locked) return { roundKey, locked: false, matches: [] };

    const roundMatches = matches
      .filter((match) => match.round === roundKey)
      .map((match) => {
        const winnerBuckets = {};
        [match.t1, match.t2].filter(Boolean).forEach((team) => {
          winnerBuckets[team] = [];
        });
        const methodBuckets = emptyMethodBuckets();
        const none = [];

        ids.forEach((playerId) => {
          const pick = betsAll?.[playerId]?.ko?.[match.id];
          if (pick?.t) {
            if (!winnerBuckets[pick.t]) winnerBuckets[pick.t] = [];
            winnerBuckets[pick.t].push(playerId);
          } else {
            none.push(playerId);
          }

          if (METHOD_KEYS.includes(pick?.p)) methodBuckets[pick.p].push(playerId);
          else methodBuckets.none.push(playerId);
        });

        Object.keys(winnerBuckets).forEach((team) => {
          winnerBuckets[team] = sortByPlayerOrder(winnerBuckets[team], ids);
        });
        METHOD_KEYS.concat("none").forEach((key) => {
          methodBuckets[key] = sortByPlayerOrder(methodBuckets[key], ids);
        });

        return {
          id: match.id,
          matchNo: match.matchNo || null,
          t1: match.t1,
          t2: match.t2,
          winner: match.w || null,
          method: match.p || null,
          winnerBuckets,
          methodBuckets,
          none: sortByPlayerOrder(none, ids),
        };
      });

    return {
      roundKey,
      locked,
      matches: sortMatches(roundMatches),
    };
  });
}

export function buildLockedPicksComparison({ config, results = {}, betsAll = {} }) {
  const bracketAvailable = !!config?.locks?.bracket;
  const ids = playerIds(config);

  if (!bracketAvailable) {
    return {
      bracketAvailable: false,
      bracketRounds: [],
      groupMatches: [],
      koRounds: COMPARISON_KO_ROUNDS.map((roundKey) => ({ roundKey, locked: false, matches: [] })),
    };
  }

  return {
    bracketAvailable: true,
    bracketRounds: buildBracketRounds({ config, betsAll, ids }),
    groupMatches: buildGroupMatches({ config, results, betsAll, ids }),
    koRounds: buildKoRounds({ config, results, betsAll, ids }),
  };
}
