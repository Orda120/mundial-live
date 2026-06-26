import {
  ALL_GROUP_FIXTURES,
  ALL_TEAMS,
  GROUP_KEYS,
  GROUPS,
  groupFixtures,
} from "./worldCupData.js";

const SCORE_RE = /^(\d{1,2})-(\d{1,2})$/;
const THIRD_PLACE_ROUNDS = new Set(["sf"]);

const TEAM_GROUP = Object.fromEntries(
  GROUP_KEYS.flatMap((group) => GROUPS[group].map((team) => [team, group])),
);

const scoreOf = (result) => {
  const match = typeof result === "string" && SCORE_RE.exec(result);
  return match ? [Number(match[1]), Number(match[2])] : null;
};

const outcomeOf = (result) => {
  if (!result) return null;
  const score = scoreOf(result);
  if (!score) return result;
  return score[0] > score[1] ? "1" : score[0] < score[1] ? "2" : "X";
};

function groupStandings(group, groupResults) {
  const teams = GROUPS[group];
  const pts = {};
  const wins = {};
  const gd = {};
  const gf = {};

  teams.forEach((team) => {
    pts[team] = 0;
    wins[team] = 0;
    gd[team] = 0;
    gf[team] = 0;
  });

  groupFixtures(group).forEach((fixture) => {
    const result = groupResults[fixture.id];
    const outcome = outcomeOf(result);
    if (!outcome) return;

    const score = scoreOf(result);
    if (score) {
      gf[fixture.t1] += score[0];
      gf[fixture.t2] += score[1];
      gd[fixture.t1] += score[0] - score[1];
      gd[fixture.t2] += score[1] - score[0];
    }

    if (outcome === "1") {
      pts[fixture.t1] += 3;
      wins[fixture.t1] += 1;
    } else if (outcome === "2") {
      pts[fixture.t2] += 3;
      wins[fixture.t2] += 1;
    } else {
      pts[fixture.t1] += 1;
      pts[fixture.t2] += 1;
    }
  });

  const baseSort = (a, b) => pts[b] - pts[a] || gd[b] - gd[a] || gf[b] - gf[a];
  const order = [...teams].sort((a, b) => baseSort(a, b) || teams.indexOf(a) - teams.indexOf(b));
  const ranked = [];
  let index = 0;

  while (index < order.length) {
    let next = index;
    while (next < order.length && baseSort(order[index], order[next]) === 0) next += 1;

    const tied = order.slice(index, next);
    if (tied.length > 1) {
      const headToHead = Object.fromEntries(tied.map((team) => [team, 0]));
      groupFixtures(group).forEach((fixture) => {
        if (!tied.includes(fixture.t1) || !tied.includes(fixture.t2)) return;
        const outcome = outcomeOf(groupResults[fixture.id]);
        if (!outcome) return;
        if (outcome === "1") headToHead[fixture.t1] += 3;
        else if (outcome === "2") headToHead[fixture.t2] += 3;
        else {
          headToHead[fixture.t1] += 1;
          headToHead[fixture.t2] += 1;
        }
      });
      tied.sort(
        (a, b) =>
          headToHead[b] - headToHead[a] ||
          wins[b] - wins[a] ||
          teams.indexOf(a) - teams.indexOf(b),
      );
    }

    ranked.push(...tied);
    index = next;
  }

  return { order: ranked, pts, wins, gd, gf };
}

function computeQualification(groupResults) {
  const standings = {};
  GROUP_KEYS.forEach((group) => {
    standings[group] = groupStandings(group, groupResults);
  });

  const thirdsRanked = GROUP_KEYS
    .map((group) => ({ group, team: standings[group].order[2] }))
    .sort(
      (a, b) =>
        standings[b.group].pts[b.team] - standings[a.group].pts[a.team] ||
        standings[b.group].gd[b.team] - standings[a.group].gd[a.team] ||
        standings[b.group].gf[b.team] - standings[a.group].gf[a.team] ||
        standings[b.group].wins[b.team] - standings[a.group].wins[a.team] ||
        a.group.localeCompare(b.group),
    );

  const filled = ALL_GROUP_FIXTURES.filter((fixture) => groupResults[fixture.id]).length;
  return {
    standings,
    thirdsRanked,
    qualifyingThirdGroups: new Set(thirdsRanked.slice(0, 8).map((row) => row.group)),
    complete: filled === ALL_GROUP_FIXTURES.length,
  };
}

function groupIsComplete(group, groupResults) {
  return groupFixtures(group).every((fixture) => groupResults[fixture.id]);
}

function buildPointTotals(results) {
  const totals = Object.fromEntries(ALL_TEAMS.map((team) => [team, 0]));
  const groupResults = results?.g || {};

  ALL_GROUP_FIXTURES.forEach((fixture) => {
    const outcome = outcomeOf(groupResults[fixture.id]);
    if (!outcome) return;

    if (outcome === "1") totals[fixture.t1] += 3;
    else if (outcome === "2") totals[fixture.t2] += 3;
    else {
      totals[fixture.t1] += 1;
      totals[fixture.t2] += 1;
    }
  });

  Object.values(results?.ko || {}).forEach((match) => {
    if (!match?.w || !match.t1 || !match.t2) return;
    const loser = match.w === match.t1 ? match.t2 : match.t1;
    totals[match.w] += 3;
    if (match.p === "et") totals[loser] += 1;
  });

  return totals;
}

export function buildTeamStatusMap(results = {}) {
  const groupResults = results?.g || {};
  const qualification = computeQualification(groupResults);
  const statuses = Object.fromEntries(
    ALL_TEAMS.map((team) => [
      team,
      { status: "active", eliminated: false, canScoreMore: true },
    ]),
  );

  const stopTeam = (team, status = "eliminated") => {
    if (!team) return;
    statuses[team] = {
      status,
      eliminated: status === "eliminated",
      canScoreMore: false,
    };
  };

  if (qualification.complete) {
    const qualified = new Set();
    GROUP_KEYS.forEach((group) => {
      const order = qualification.standings[group].order;
      qualified.add(order[0]);
      qualified.add(order[1]);
      if (qualification.qualifyingThirdGroups.has(group)) qualified.add(order[2]);
    });

    ALL_TEAMS.forEach((team) => {
      if (!qualified.has(team)) stopTeam(team);
    });
  } else {
    GROUP_KEYS.forEach((group) => {
      if (!groupIsComplete(group, groupResults)) return;
      stopTeam(qualification.standings[group].order[3]);
    });
  }

  const koMatches = Object.values(results?.ko || {}).filter((match) => match?.t1 && match?.t2);
  const thirdPlaceMatch = koMatches.find((match) => match.round === "p3");

  koMatches.forEach((match) => {
    if (!match.w) return;
    const loser = match.w === match.t1 ? match.t2 : match.t1;

    if (THIRD_PLACE_ROUNDS.has(match.round) && (!thirdPlaceMatch || !thirdPlaceMatch.w)) return;

    if (match.round === "f") {
      stopTeam(loser);
      stopTeam(match.w, "complete");
    } else if (match.round === "p3") {
      stopTeam(loser);
      stopTeam(match.w, "complete");
    } else {
      stopTeam(loser);
    }
  });

  return statuses;
}

export function buildTeamTournamentRows(config = {}, results = {}) {
  const points = buildPointTotals(results);
  const statusMap = buildTeamStatusMap(results);
  const playersById = Object.fromEntries((config?.players || []).map((player) => [player.id, player]));
  const assign = config?.assign || {};

  return ALL_TEAMS
    .map((team) => {
      const ownerId = assign[team] || null;
      const status = statusMap[team] || { status: "active", eliminated: false, canScoreMore: true };
      return {
        team,
        group: TEAM_GROUP[team],
        ownerId,
        ownerName: ownerId ? playersById[ownerId]?.name || ownerId : "",
        points: points[team] || 0,
        status: status.status,
        eliminated: status.eliminated,
        canScoreMore: status.canScoreMore,
      };
    })
    .sort(
      (a, b) =>
        b.points - a.points ||
        Number(a.eliminated) - Number(b.eliminated) ||
        a.group.localeCompare(b.group) ||
        a.team.localeCompare(b.team),
    );
}
