import {
  ALL_GROUP_FIXTURES,
  GROUP_KEYS,
  GROUPS,
  groupFixtures,
} from "./worldCupData.js";
import { assignOfficialThirds } from "./thirdPlaceMatrix.js";

const SCORE_RE = /^(\d{1,2})-(\d{1,2})$/;

export const R32_SLOTS = [
  { m: 73, a: "2A", b: "2B" }, { m: 74, a: "1E", b: "3ABCDF" },
  { m: 75, a: "1F", b: "2C" }, { m: 76, a: "1C", b: "2F" },
  { m: 77, a: "1I", b: "3CDFGH" }, { m: 78, a: "2E", b: "2I" },
  { m: 79, a: "1A", b: "3CEFHI" }, { m: 80, a: "1L", b: "3EHIJK" },
  { m: 81, a: "1D", b: "3BEFIJ" }, { m: 82, a: "1G", b: "3AEHIJ" },
  { m: 83, a: "2K", b: "2L" }, { m: 84, a: "1H", b: "2J" },
  { m: 85, a: "1B", b: "3EFGIJ" }, { m: 86, a: "1J", b: "2H" },
  { m: 87, a: "1K", b: "3DEIJL" }, { m: 88, a: "2D", b: "2G" },
];

export const NEXT_ROUNDS = [
  { k: "r16", slots: [{ m: 89, a: 74, b: 77 }, { m: 90, a: 73, b: 75 }, { m: 91, a: 76, b: 78 }, { m: 92, a: 79, b: 80 }, { m: 93, a: 83, b: 84 }, { m: 94, a: 81, b: 82 }, { m: 95, a: 86, b: 88 }, { m: 96, a: 85, b: 87 }] },
  { k: "qf", slots: [{ m: 97, a: 89, b: 90 }, { m: 98, a: 93, b: 94 }, { m: 99, a: 91, b: 92 }, { m: 100, a: 95, b: 96 }] },
  { k: "sf", slots: [{ m: 101, a: 97, b: 98 }, { m: 102, a: 99, b: 100 }] },
];

export const TREE_COLS = [
  { k: "r32", n: "שלב ה־32", ms: [74, 77, 73, 75, 83, 84, 81, 82, 76, 78, 79, 80, 86, 88, 85, 87] },
  { k: "r16", n: "שמינית", ms: [89, 90, 93, 94, 91, 92, 95, 96] },
  { k: "qf", n: "רבע גמר", ms: [97, 98, 99, 100] },
  { k: "sf", n: "חצי גמר", ms: [101, 102] },
  { k: "f", n: "הגמר", ms: [104] },
];

export const FEED = {
  89: [74, 77], 90: [73, 75], 91: [76, 78], 92: [79, 80],
  93: [83, 84], 94: [81, 82], 95: [86, 88], 96: [85, 87],
  97: [89, 90], 98: [93, 94], 99: [91, 92], 100: [95, 96],
  101: [97, 98], 102: [99, 100], 104: [101, 102], 103: [101, 102],
};

const MATCH_ROUNDS = new Map([
  ...R32_SLOTS.map((slot) => [slot.m, "r32"]),
  ...NEXT_ROUNDS.flatMap(({ k, slots }) => slots.map((slot) => [slot.m, k])),
  [103, "p3"],
  [104, "f"],
]);

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

function groupIsComplete(group, groupResults) {
  return groupFixtures(group).every((fixture) => groupResults[fixture.id]);
}

function groupStandings(group, groupResults) {
  const teams = GROUPS[group];
  const pts = {}, wins = {}, gd = {}, gf = {};
  teams.forEach((team) => { pts[team] = 0; wins[team] = 0; gd[team] = 0; gf[team] = 0; });

  groupFixtures(group).forEach((fixture) => {
    const result = groupResults[fixture.id];
    const outcome = outcomeOf(result);
    if (!outcome) return;

    const score = scoreOf(result);
    if (score) {
      gf[fixture.t1] += score[0]; gd[fixture.t1] += score[0] - score[1];
      gf[fixture.t2] += score[1]; gd[fixture.t2] += score[1] - score[0];
    }

    if (outcome === "1") { pts[fixture.t1] += 3; wins[fixture.t1]++; }
    else if (outcome === "2") { pts[fixture.t2] += 3; wins[fixture.t2]++; }
    else { pts[fixture.t1]++; pts[fixture.t2]++; }
  });

  const base = (a, b) => pts[b] - pts[a] || gd[b] - gd[a] || gf[b] - gf[a];
  const order = [...teams].sort((a, b) => base(a, b) || teams.indexOf(a) - teams.indexOf(b));
  const out = [];
  let i = 0;
  while (i < order.length) {
    let j = i;
    while (j < order.length && base(order[i], order[j]) === 0) j++;
    const tied = order.slice(i, j);
    if (tied.length > 1) {
      const mp = Object.fromEntries(tied.map((team) => [team, 0]));
      groupFixtures(group).forEach((fixture) => {
        if (!tied.includes(fixture.t1) || !tied.includes(fixture.t2)) return;
        const outcome = outcomeOf(groupResults[fixture.id]);
        if (!outcome) return;
        if (outcome === "1") mp[fixture.t1] += 3;
        else if (outcome === "2") mp[fixture.t2] += 3;
        else { mp[fixture.t1]++; mp[fixture.t2]++; }
      });
      tied.sort((a, b) => mp[b] - mp[a] || wins[b] - wins[a] || teams.indexOf(a) - teams.indexOf(b));
    }
    out.push(...tied);
    i = j;
  }
  return { order: out, pts, wins, gd, gf, complete: groupIsComplete(group, groupResults) };
}

function computeQualification(groupResults) {
  const st = {};
  GROUP_KEYS.forEach((group) => { st[group] = groupStandings(group, groupResults); });
  const thirdsRanked = GROUP_KEYS
    .map((group) => ({ g: group, t: st[group].order[2] }))
    .sort((a, b) =>
      st[b.g].pts[b.t] - st[a.g].pts[a.t] ||
      st[b.g].gd[b.t] - st[a.g].gd[a.t] ||
      st[b.g].gf[b.t] - st[a.g].gf[a.t] ||
      st[b.g].wins[b.t] - st[a.g].wins[a.t] ||
      a.g.localeCompare(b.g));
  const filled = ALL_GROUP_FIXTURES.filter((fixture) => groupResults[fixture.id]).length;
  return { st, thirdsRanked, complete: filled === ALL_GROUP_FIXTURES.length };
}

function slotLabel(token) {
  if (typeof token !== "string") return "";
  const group = token.slice(1);
  if (token[0] === "1") return `Winner Group ${group}`;
  if (token[0] === "2") return `Runner-up Group ${group}`;
  if (token[0] === "3") return `3rd Group ${group.split("").join("/")}`;
  return token;
}

function teamCompetitor(team, fallbackLabel = null) {
  return { team: team || null, label: team || fallbackLabel || null };
}

function resolveGroupSlot(token, matchNo, qualification) {
  const group = token.slice(1);
  if (token[0] === "1" || token[0] === "2") {
    const index = token[0] === "1" ? 0 : 1;
    const team = qualification.st[group]?.complete ? qualification.st[group].order[index] : null;
    return teamCompetitor(team, slotLabel(token));
  }

  if (token[0] === "3") {
    if (qualification.complete) {
      const thirdMap = assignOfficialThirds(qualification.thirdsRanked.slice(0, 8).map((row) => row.g));
      const thirdGroup = thirdMap[matchNo];
      const team = thirdGroup ? qualification.st[thirdGroup].order[2] : null;
      return teamCompetitor(team, slotLabel(token));
    }
    return teamCompetitor(null, slotLabel(token));
  }

  return teamCompetitor(null, slotLabel(token));
}

function savedMatchFor(matchNo, round, ko) {
  const id = `m${matchNo}`;
  return ko[id] ? { id, ...ko[id] } : { id, round, matchNo };
}

function winnerOf(matchNo, built, ko) {
  const saved = ko[`m${matchNo}`];
  if (saved?.w) return teamCompetitor(saved.w, saved.w);
  return teamCompetitor(null, `Winner Match ${matchNo}`);
}

function loserOf(matchNo, built, ko) {
  const saved = ko[`m${matchNo}`];
  if (saved?.w) {
    const match = built.get(matchNo);
    const teams = [match?.t1 || saved.t1, match?.t2 || saved.t2].filter(Boolean);
    const loser = teams.find((team) => team !== saved.w) || null;
    if (loser) return teamCompetitor(loser, loser);
  }
  return teamCompetitor(null, `Loser Match ${matchNo}`);
}

function mergeMatch({ matchNo, round, a, b, ko }) {
  const saved = savedMatchFor(matchNo, round, ko);
  return {
    id: saved.id,
    matchNo,
    round,
    scheduled: true,
    a,
    b,
    t1: a.team || saved.t1 || null,
    t2: b.team || saved.t2 || null,
    w: saved.w || null,
    p: saved.p || null,
  };
}

export function buildKnockoutSchedule(results = {}) {
  const groupResults = results?.g || {};
  const ko = results?.ko || {};
  const qualification = computeQualification(groupResults);
  const built = new Map();
  const schedule = [];

  const add = (match) => {
    built.set(match.matchNo, match);
    schedule.push(match);
  };

  R32_SLOTS.forEach((slot) => {
    add(mergeMatch({
      matchNo: slot.m,
      round: "r32",
      a: resolveGroupSlot(slot.a, slot.m, qualification),
      b: resolveGroupSlot(slot.b, slot.m, qualification),
      ko,
    }));
  });

  NEXT_ROUNDS.forEach(({ k, slots }) => {
    slots.forEach((slot) => {
      add(mergeMatch({
        matchNo: slot.m,
        round: k,
        a: winnerOf(slot.a, built, ko),
        b: winnerOf(slot.b, built, ko),
        ko,
      }));
    });
  });

  add(mergeMatch({
    matchNo: 103,
    round: "p3",
    a: loserOf(101, built, ko),
    b: loserOf(102, built, ko),
    ko,
  }));

  add(mergeMatch({
    matchNo: 104,
    round: "f",
    a: winnerOf(101, built, ko),
    b: winnerOf(102, built, ko),
    ko,
  }));

  const scheduledIds = new Set(schedule.map((match) => match.id));
  Object.entries(ko).forEach(([id, match]) => {
    if (scheduledIds.has(id)) return;
    schedule.push({
      id,
      matchNo: match.matchNo || null,
      round: match.round || MATCH_ROUNDS.get(match.matchNo) || "r32",
      scheduled: false,
      a: teamCompetitor(match.t1, match.t1 || "Team 1"),
      b: teamCompetitor(match.t2, match.t2 || "Team 2"),
      t1: match.t1 || null,
      t2: match.t2 || null,
      w: match.w || null,
      p: match.p || null,
    });
  });

  return schedule;
}

export function buildBettableKnockoutSchedule(results = {}) {
  return buildKnockoutSchedule(results).filter((match) => match.t1 && match.t2);
}

export function buildScheduledBracketKo(results = {}) {
  return Object.fromEntries(
    buildKnockoutSchedule(results).map((match) => [
      match.id,
      {
        round: match.round,
        matchNo: match.matchNo,
        scheduled: match.scheduled,
        aLabel: match.a.label,
        bLabel: match.b.label,
        t1: match.t1,
        t2: match.t2,
        w: match.w,
        p: match.p,
      },
    ]),
  );
}
