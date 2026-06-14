import { fixtureForTeams } from "../../src/worldCupData.js";

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

function competitorsOf(event) {
  const competitors = competitionOf(event)?.competitors || [];
  const home = competitors.find((competitor) => competitor.homeAway === "home");
  const away = competitors.find((competitor) => competitor.homeAway === "away");
  return { home, away };
}

export function extractSchedule(events) {
  const schedule = {};

  for (const event of events || []) {
    if (!event?.id || !event?.date || !isGroupEvent(event)) continue;
    const { home, away } = competitorsOf(event);
    if (!home?.team?.abbreviation || !away?.team?.abbreviation) continue;

    schedule[String(event.id)] = {
      kickoff: event.date,
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
  if (!event?.id || !event?.date || !isGroupEvent(event)) return null;
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
    home: homeCode,
    away: awayCode,
    homeScore,
    awayScore,
    status: state === "in" ? "live" : state === "post" ? "finished" : "scheduled",
    displayClock,
  };
}

export function buildFirebasePatch({
  events,
  existingResults = {},
  liveMeta = {},
  now,
}) {
  const patch = {};

  for (const event of events || []) {
    const normalized = normalizeEspnEvent(event);
    if (!normalized || normalized.status === "scheduled") continue;

    const fixture = fixtureForTeams(normalized.home, normalized.away);
    if (!fixture || liveMeta[fixture.id]?.manualOverride) continue;
    const fixtureId = fixture.id;

    if (existingResults[fixtureId] != null && !liveMeta[fixtureId]) {
      patch[`liveMeta/g/${fixtureId}`] = {
        source: "manual",
        status: "manual",
        updatedAt: now,
        manualOverride: true,
      };
      continue;
    }

    const [team1Score, team2Score] =
      fixture.t1 === normalized.home
        ? [normalized.homeScore, normalized.awayScore]
        : [normalized.awayScore, normalized.homeScore];
    patch[`results/g/${fixtureId}`] = `${team1Score}-${team2Score}`;
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

  return patch;
}
