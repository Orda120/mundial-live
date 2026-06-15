const GROUP_SCORE_RE = /^(\d{1,2})-(\d{1,2})$/;

export const SCORE_BREAKDOWN_LABELS = {
  draftGroupWin: "דראפט — ניצחון בבתים",
  draftGroupDraw: "דראפט — תיקו בבתים",
  draftKoWin: "דראפט — ניצחון בנוקאאוט",
  draftKoExtraLoss: "דראפט — הפסד בהארכה/פנדלים",
  matchGroup: "ניחוש משחקי בתים",
  matchKoWinner: "ניחוש מנצחת נוקאאוט",
  matchKoMethod: "בונוס שיטת הכרעה",
  bracketR32: "עולות לשמינית",
  bracketR16: "עולות לשמינית הגמר",
  bracketQf: "עולות לרבע הגמר",
  bracketSf: "עולות לחצי הגמר",
  bracketFin: "פיינליסטיות",
  bracketWin: "אלופה",
};

export function outcomeFromScore(result) {
  if (!result) return null;
  const match = typeof result === "string" && GROUP_SCORE_RE.exec(result);
  if (!match) return result;
  const left = Number(match[1]);
  const right = Number(match[2]);
  return left > right ? "1" : left < right ? "2" : "X";
}

function addEvent(row, event) {
  const points = Number(event.points || 0);
  if (!points) return;

  const fullEvent = {
    team: null,
    fixtureId: null,
    label: SCORE_BREAKDOWN_LABELS[event.type] || event.type,
    ...event,
    points,
  };

  row.events.push(fullEvent);
  row.byType[fullEvent.type] = (row.byType[fullEvent.type] || 0) + points;

  if (fullEvent.team) {
    row.byTeam[fullEvent.team] = (row.byTeam[fullEvent.team] || 0) + points;
  }
}

export function createScoreBreakdownRow(player) {
  return {
    playerId: player.id,
    events: [],
    byType: {},
    byTeam: {},
  };
}

export function recordDraftGroupPoints(row, { fixture, result, teams }) {
  const outcome = outcomeFromScore(result);
  if (!outcome) return;

  [fixture.t1, fixture.t2].forEach((team) => {
    if (!teams.includes(team)) return;
    const won = (outcome === "1" && team === fixture.t1) || (outcome === "2" && team === fixture.t2);
    addEvent(row, {
      type: won ? "draftGroupWin" : "draftGroupDraw",
      team,
      fixtureId: fixture.id,
      points: won ? 3 : outcome === "X" ? 1 : 0,
    });
  });
}

export function recordDraftKoPoints(row, { match, teams }) {
  if (!match.w) return;

  [match.t1, match.t2].forEach((team) => {
    if (!teams.includes(team)) return;
    addEvent(row, {
      type: team === match.w ? "draftKoWin" : "draftKoExtraLoss",
      team,
      fixtureId: match.id,
      points: team === match.w ? 3 : match.p === "et" ? 1 : 0,
    });
  });
}

export function recordGroupBetPoints(row, { fixtureId, bet, result }) {
  if (bet && bet === outcomeFromScore(result)) {
    addEvent(row, { type: "matchGroup", fixtureId, points: 1 });
  }
}

export function recordKoBetPoints(row, { match, bet }) {
  if (!match.w || !bet || bet.t !== match.w) return;

  addEvent(row, {
    type: "matchKoWinner",
    team: match.w,
    fixtureId: match.id,
    points: 1,
  });

  if (match.p && bet.p === match.p) {
    addEvent(row, {
      type: "matchKoMethod",
      team: match.w,
      fixtureId: match.id,
      points: 1,
    });
  }
}

export function recordBracketPoints(row, { tier, picks, reached }) {
  const hits = picks.filter((team) => reached.has(team));
  hits.forEach((team) => {
    addEvent(row, {
      type: `bracket${tier.k[0].toUpperCase()}${tier.k.slice(1)}`,
      team,
      points: tier.pts,
    });
  });
  return hits.length;
}

export function summarizeScoreBreakdown(row) {
  const total = Object.values(row.byType).reduce((sum, value) => sum + value, 0);
  const typeRows = Object.entries(row.byType)
    .map(([type, points]) => ({ type, label: SCORE_BREAKDOWN_LABELS[type] || type, points }))
    .sort((a, b) => b.points - a.points || a.label.localeCompare(b.label, "he"));

  const teamRows = Object.entries(row.byTeam)
    .map(([team, points]) => ({ team, points }))
    .sort((a, b) => b.points - a.points || a.team.localeCompare(b.team));

  return { total, typeRows, teamRows, events: row.events };
}
