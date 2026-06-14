# Live Match Header Design

## Goal

Show every currently live World Cup group-stage match in the empty center of
the existing application header. Each item displays the two teams, the current
score, and ESPN's current match clock.

The header must disappear automatically when no match is live.

## Data Flow

The existing Cloudflare Worker remains the only ESPN client. The browser does
not call ESPN directly.

For every live event, the Worker stores ESPN's display clock alongside the
existing result metadata:

```text
leagues/<leagueId>/liveMeta/g/<fixtureId> = {
  source: "espn",
  status: "live",
  providerFixtureId: string,
  kickoff: string,
  displayClock: string,
  updatedAt: number,
  manualOverride: false
}
```

`displayClock` comes from ESPN's event status, for example `67'`, `45'+2'`, or
a provider status label such as halftime. It updates on the existing five-minute
polling interval. Finished events keep their final metadata but are not shown in
the header.

## Match Selection

The React app derives header matches from the existing Firebase subscriptions:

1. Select group fixtures whose metadata has `status: "live"`.
2. Require an existing score in `results/g`.
3. Join the metadata and score with the authoritative fixture from
   `worldCupData.js`.
4. Preserve the app's `t1-t2` team and score order.
5. Sort simultaneous live matches by kickoff time, then fixture ID for a stable
   order.

No additional Firebase subscription is required.

## Desktop Layout

The existing header becomes a three-column grid:

- Right: league title and subtitle.
- Center: all live-match pills.
- Left: player selector, share-link button, and Firebase connection indicator.

The center column stacks one compact pill per live match. Each pill contains:

- a red live indicator;
- the current ESPN display clock;
- team 1 name;
- the current score;
- team 2 name.

The title and controls keep their current visual treatment. The live area is
rendered only when at least one match is active.

## Mobile Layout

On narrow screens, the existing title and controls stay on the first header
row. Live-match pills move to a full-width row below them.

That row scrolls horizontally when several matches are live. Pills do not wrap
internally, so team names, clock, and score remain readable without overlapping
the existing controls.

## Failure Handling

- Missing `displayClock`: show `LIVE` without a minute.
- Missing score: omit that match rather than render incomplete information.
- Stale Firebase connection: keep the last known live item visible while the
  existing connection indicator shows the disconnected state.
- Finished provider status: remove the match from the header on the next
  Firebase update.
- Manual overrides: do not appear as live unless their metadata still has
  `status: "live"` and `manualOverride: false`.

## Testing

Worker tests cover:

- extraction of ESPN's display clock;
- clock metadata included in Firebase patches;
- fallback to a provider status label when a numeric clock is unavailable.

App tests cover a pure live-header selector:

- only active automatic fixtures are returned;
- scores remain in app fixture order;
- multiple matches sort by kickoff;
- fixtures with missing scores are excluded.

Production verification covers:

- full test suite and Vite build;
- Wrangler dry-run bundle;
- deployed Worker health and Cron configuration;
- GitHub Pages deployment.

## Scope

This change covers group-stage live matches only. It does not add knockout live
scores, a separate match page, animations, notifications, direct browser ESPN
requests, or a locally ticking clock between Worker polls.
