import { fixtureForTeams } from "../../src/worldCupData.js";
import { buildKnockoutSchedule } from "../../src/bracketSchedule.js";

const MINUTE = 60 * 1000;
const SCHEDULE_REFRESH_MS = 12 * 60 * MINUTE;
const POLL_INTERVAL_MS = 5 * MINUTE;
const POLL_LEAD_MS = 10 * MINUTE;
const POLL_TAIL_MS = 4 * 60 * MINUTE;

function competitionOf(event) {
  return event?.competitions?.[0] || null;
}

function isGroupEvent(event) {
  return event?.season?.slug === "group-stage" ||
    competitionOf(event)?.type?.abbreviation === "group";
}

function eventStage(event) {
  return isGroupEvent(event) ? "group" : "knockout";
}

function competitorsOf(event) {
  const competitors = competitionOf(event)?.competitors || [];
  const home = competitors.find((competitor) => competitor.homeAway === "home");
  const away = competitors.find((competitor) => competitor.homeAway === "away");
  return { home, away };
}

export function extractSchedule(events) {
  const schedule = {};

  for (const event of events || []) {
    if (!event?.id || !event?.date) continue;
    const { home, away } = competitorsOf(event);
    if (!home?.team?.abbreviation || !away?.team?.abbreviation) continue;

    schedule[String(event.id)] = {
      kickoff: event.date,
      stage: eventStage(event),
      home: home.team.abbreviation,
      away: away.team.abbreviation,
    };
  }

  return schedule;
}

export function shouldRefreshSchedule(lastScheduleAt, now) {
  return !lastScheduleAt || now - lastScheduleAt >= SCHEDULE_REFRESH_MS;
}

export function isPollingWindowOpen(schedule, now) {
  return Object.values(schedule || {}).some(({ kickoff }) => {
    const kickoffAt = Date.parse(kickoff);
    if (!Number.isFinite(kickoffAt)) return false;
    return now >= kickoffAt - POLL_LEAD_MS && now <= kickoffAt + POLL_TAIL_MS;
  });
}

export function shouldPoll({ schedule, now, lastPollAt }) {
  if (!isPollingWindowOpen(schedule, now)) return false;
  return !lastPollAt || now - lastPollAt >= POLL_INTERVAL_MS;
}

export function normalizeEspnEvent(event) {
  if (!event?.id || !event?.date) return null;
  const { home, away } = competitorsOf(event);
  const homeCode = home?.team?.abbreviation;
  const awayCode = away?.team?.abbreviation;
  const homeScore = Number(home?.score);
  const awayScore = Number(away?.score);
  const state = event?.status?.type?.state;
  const displayClock =
    event?.status?.displayClock ||
    event?.status?.type?.shortDetail ||
    event?.status?.type?.detail ||
    event?.status?.type?.description ||
    "";

  if (
    !homeCode ||
    !awayCode ||
    !Number.isFinite(homeScore) ||
    !Number.isFinite(awayScore) ||
    !["pre", "in", "post"].includes(state)
  ) {
    return null;
  }

  return {
    providerFixtureId: String(event.id),
    kickoff: event.date,
    stage: eventStage(event),
    home: homeCode,
    away: awayCode,
    homeScore,
    awayScore,
    winner: home?.winner === true ? homeCode : away?.winner === true ? awayCode : null,
    status: state === "in" ? "live" : state === "post" ? "finished" : "scheduled",
    displayClock,
  };
}

function normalizeExistingResults(existingResults) {
  if (existingResults?.g || existingResults?.ko) {
    return {
      g: existingResults.g || {},
      ko: existingResults.ko || {},
    };
  }
  return { g: existingResults || {}, ko: {} };
}

function teamsMatch(match, normalized) {
  return Boolean(
    match?.t1 &&
    match?.t2 &&
    (
      (match.t1 === normalized.home && match.t2 === normalized.away) ||
      (match.t1 === normalized.away && match.t2 === normalized.home)
    ),
  );
}

function knockoutMatchForEvent(normalized, results) {
  return buildKnockoutSchedule(results).find((match) => teamsMatch(match, normalized)) || null;
}

function scoreInAppOrder(normalized, t1, t2) {
  if (t1 === normalized.home && t2 === normalized.away) {
    return `${normalized.homeScore}-${normalized.awayScore}`;
  }
  if (t1 === normalized.away && t2 === normalized.home) {
    return `${normalized.awayScore}-${normalized.homeScore}`;
  }
  return null;
}

function winnerInAppOrder(normalized, t1, t2) {
  if (normalized.winner === t1 || normalized.winner === t2) return normalized.winner;
  if (normalized.status !== "finished" || normalized.homeScore === normalized.awayScore) return null;
  const winner = normalized.homeScore > normalized.awayScore ? normalized.home : normalized.away;
  return winner === t1 || winner === t2 ? winner : null;
}

function writeLiveMeta(patch, fixtureId, normalized, now) {
  patch[`liveMeta/g/${fixtureId}`] = {
    source: "espn",
    status: normalized.status,
    providerFixtureId: normalized.providerFixtureId,
    kickoff: normalized.kickoff,
    displayClock: normalized.displayClock,
    updatedAt: now,
    manualOverride: false,
  };
}

export function buildFirebasePatch({
  events,
  existingResults = {},
  liveMeta = {},
  now,
}) {
  const patch = {};
  const results = normalizeExistingResults(existingResults);

  for (const event of events || []) {
    const normalized = normalizeEspnEvent(event);
    if (!normalized || normalized.status === "scheduled") continue;

    if (normalized.stage === "group") {
      const fixture = fixtureForTeams(normalized.home, normalized.away);
      if (!fixture || liveMeta[fixture.id]?.manualOverride) continue;
      const fixtureId = fixture.id;

      if (results.g[fixtureId] != null && !liveMeta[fixtureId]) {
        patch[`liveMeta/g/${fixtureId}`] = {
          source: "manual",
          status: "manual",
          updatedAt: now,
          manualOverride: true,
        };
        continue;
      }

      const score = scoreInAppOrder(normalized, fixture.t1, fixture.t2);
      if (!score) continue;

      patch[`results/g/${fixtureId}`] = score;
      writeLiveMeta(patch, fixtureId, normalized, now);
      continue;
    }

    const match = knockoutMatchForEvent(normalized, results);
    if (!match || liveMeta[match.id]?.manualOverride) continue;

    const existingKo = results.ko[match.id] || {};
    if ((existingKo.score != null || existingKo.w || existingKo.p) && !liveMeta[match.id]) {
      patch[`liveMeta/g/${match.id}`] = {
        source: "manual",
        status: "manual",
        updatedAt: now,
        manualOverride: true,
      };
      continue;
    }

    const score = scoreInAppOrder(normalized, match.t1, match.t2);
    if (!score) continue;

    patch[`results/ko/${match.id}/round`] = match.round;
    patch[`results/ko/${match.id}/matchNo`] = match.matchNo;
    patch[`results/ko/${match.id}/scheduled`] = match.scheduled;
    patch[`results/ko/${match.id}/t1`] = match.t1;
    patch[`results/ko/${match.id}/t2`] = match.t2;
    patch[`results/ko/${match.id}/score`] = score;

    const winner = winnerInAppOrder(normalized, match.t1, match.t2);
    if (winner) patch[`results/ko/${match.id}/w`] = winner;

    writeLiveMeta(patch, match.id, normalized, now);
  }

  return patch;
}
