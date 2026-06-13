# Live Scores Design

## Goal

Automatically update the existing group-stage result fields during World Cup
matches while preserving the current fixtures, bets, scoring logic, and manual
administration workflow.

The integration must use free plans only.

## Architecture

The existing React app remains hosted on GitHub Pages and continues reading
results from Firebase Realtime Database.

A Cloudflare Worker on the free plan provides the server-side integration:

- A Cron Trigger runs once per minute.
- The Worker keeps the World Cup fixture schedule and API fixture identifiers.
- It calls API-Football only when a match is within its polling window.
- The API key is stored as a Cloudflare Worker secret and is never sent to the
  browser or committed to Git.
- The Worker writes normalized scores to the existing Firebase result paths.

API-Football's free plan currently allows 100 requests per day. The Worker uses
one request for all live World Cup fixtures, at most once every five minutes
while at least one match may be active. A daily request counter reserves capacity
for final-score checks and prevents exceeding the free quota. If the remaining
budget becomes tight, polling automatically slows to once every 10 minutes.

## Polling Rules

For each scheduled match:

1. The polling window opens 10 minutes before kickoff.
2. While any match is in its polling window, the Worker may request live
   fixtures once every five minutes.
3. A single request retrieves all currently live World Cup matches.
4. Polling continues while the provider reports a live state.
5. When the provider reports the match as finished, the Worker stores the final
   score and closes that match's polling window.
6. If a match is delayed, suspended, or postponed, the Worker retains the last
   known score and continues only within a bounded extended window.

The Worker records its last provider request and daily request count under the
active league's `liveSync` Firebase path so overlapping Cron invocations do not
consume duplicate API requests.

## Fixture Mapping

The app's existing fixture IDs such as `A-0` remain authoritative. Saved bets
and group definitions are not changed.

Each API fixture is mapped to an existing app fixture by:

1. Normalized home and away team codes.
2. Scheduled kickoff time as a validation signal.
3. A checked static team-code mapping for provider naming differences.

If a provider fixture cannot be mapped uniquely, the Worker skips it and records
an error rather than writing to the wrong match.

## Firebase Data

The existing score value remains unchanged:

```text
leagues/<leagueId>/results/g/<fixtureId> = "2-1"
```

Additional metadata is stored separately:

```text
leagues/<leagueId>/liveMeta/g/<fixtureId> = {
  source: "api-football" | "manual",
  status: "scheduled" | "live" | "finished" | "delayed" | "error",
  providerFixtureId: number,
  updatedAt: number,
  manualOverride: boolean
}
```

This keeps the existing scoring engine compatible while making ownership of the
score explicit.

## Manual Overrides

The existing administration score fields remain editable.

When an administrator saves a score manually:

- The app writes the score to the existing result path.
- It sets `manualOverride: true` and `source: "manual"` for that fixture.
- The Worker will not overwrite that fixture while the override is active.

The administration screen will provide a small action to return that fixture to
automatic updates. Clearing the override does not erase the current score; the
next successful provider update replaces it.

## User Experience

No new score-entry section is introduced.

The existing **תוצאות שלב הבתים** fields update through the current Firebase
subscription. As soon as a live score arrives:

- The score appears in the existing field.
- The leaderboard recalculates.
- Betting for that match is locked by the existing completed-result behavior.

The administration screen shows a compact source/status indicator beside each
score so an administrator can distinguish live-feed values, final values, and
manual overrides.

## Failure Handling

- Provider request failure: keep the previous score and retry at the next
  eligible interval.
- Daily quota exhausted: stop provider requests until the quota resets and keep
  manual editing available.
- Firebase write failure: record a Worker error and retry without changing the
  browser state.
- Unknown or ambiguous fixture: skip the write.
- Missing API credentials: the Worker reports configuration failure and the app
  continues to work manually.

Automation never clears a known score because of an empty or failed provider
response.

## Deployment Configuration

Cloudflare Worker configuration:

- `API_FOOTBALL_KEY`: secret
- `FIREBASE_DATABASE_URL`: environment variable
- `LEAGUE_ID`: the current active league
- Cron Trigger: every minute

The Worker uses Firebase's REST endpoint for the active league. This is compatible
with the project's existing rules, which already allow the browser to write
under `leagues/<leagueId>`. No additional Firebase billing or server credential
is required.

## Testing

Automated tests cover:

- Poll-window decisions before, during, and after matches.
- Five-minute request throttling.
- Daily quota budgeting and the 10-minute fallback interval.
- Team and fixture mapping.
- Live and final score normalization.
- Manual overrides preventing automated writes.
- Failed or empty provider responses preserving existing scores.
- Quota exhaustion behavior.

The app tests cover:

- Manual saves setting override metadata.
- Clearing an override.
- Live result updates immediately locking a group bet and recalculating scores.

Before deployment, a dry-run mode will parse real provider responses without
writing to the active league.

## Scope

This first version updates group-stage scores only. It does not automatically
create fixtures, alter groups, update knockout matches, import events, or change
existing bets.
