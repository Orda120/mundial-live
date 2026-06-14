# Live Match Header Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Display every active group-stage match, current score, and ESPN match clock in the center of the existing header.

**Architecture:** Extend the existing Worker normalization to persist ESPN's display clock in `liveMeta`. Add a pure React-side selector that joins automatic live metadata with authoritative fixtures and app-ordered scores, then render its output in a responsive header component.

**Tech Stack:** React 18, Firebase Realtime Database, Cloudflare Workers, ESPN public scoreboard, Tailwind CSS, Node test runner.

---

### Task 1: Persist ESPN Live Clock

**Files:**
- Modify: `worker/src/liveScores.js`
- Test: `worker/src/liveScores.test.js`

- [x] **Step 1: Write failing normalization and patch tests**

Add `displayClock` to the ESPN event fixture and assert that:

```js
normalizeEspnEvent(espnEvent()).displayClock === "52'"
patch["liveMeta/g/B-2"].displayClock === "52'"
```

Add a second assertion where `status.displayClock` is missing and
`status.type.shortDetail` is `"HT"`.

- [x] **Step 2: Verify the tests fail**

Run: `node --test worker/src/liveScores.test.js`

Expected: failures because normalized events and metadata do not contain
`displayClock`.

- [x] **Step 3: Implement clock normalization**

Set normalized `displayClock` from:

```js
event.status.displayClock ||
event.status.type.shortDetail ||
event.status.type.detail ||
event.status.type.description ||
""
```

Write that value into the fixture metadata patch.

- [x] **Step 4: Verify Worker tests pass**

Run: `node --test worker/src/liveScores.test.js`

Expected: all Worker tests pass.

### Task 2: Select Active Header Matches

**Files:**
- Create: `src/liveHeader.js`
- Create: `src/liveHeader.test.js`

- [x] **Step 1: Write failing selector tests**

Import a wished-for `selectLiveMatches` function and verify that it:

```js
selectLiveMatches({ results, liveMeta })
```

- includes only `source: "espn"`, `status: "live"`,
  `manualOverride: false` fixtures with a score;
- returns fixture `t1`, `t2`, app-ordered score, kickoff, and display clock;
- sorts simultaneous matches by kickoff and then fixture ID.

- [x] **Step 2: Verify the tests fail**

Run: `node --test src/liveHeader.test.js`

Expected: module-not-found failure because `liveHeader.js` does not exist.

- [x] **Step 3: Implement the pure selector**

Use `ALL_GROUP_FIXTURES` as the authoritative fixture list, join by fixture ID,
and return:

```js
{
  id,
  t1,
  t2,
  score,
  kickoff,
  displayClock
}
```

- [x] **Step 4: Verify selector tests pass**

Run: `node --test src/liveHeader.test.js`

Expected: all selector tests pass.

### Task 3: Render the Responsive Header

**Files:**
- Modify: `src/App.jsx`

- [x] **Step 1: Add a `LiveMatchPills` component**

Render a compact pill per selected match with a red live dot, `LIVE` plus the
clock when present, both team names, flags, and the current score.

- [x] **Step 2: Derive matches once**

Add:

```js
const liveMatches = useMemo(
  () => selectLiveMatches({ results, liveMeta }),
  [results, liveMeta],
);
```

- [x] **Step 3: Update the header layout**

On desktop, use three columns for title, centered stacked pills, and controls.
On mobile, retain the title/control row and render the pills in a horizontally
scrollable row below it. Render no live container when `liveMatches` is empty.

- [x] **Step 4: Run app tests and build**

Run:

```powershell
npm test
npm run build
```

Expected: all tests pass and Vite builds successfully.

### Task 4: Deploy and Verify

**Files:**
- No additional source files.

- [x] **Step 1: Validate Worker bundle**

Run: `npm --prefix worker run check`

Expected: Wrangler dry-run succeeds.

- [ ] **Step 2: Deploy Worker**

Upload the bundled Worker while inheriting the existing Firebase URL,
`LEAGUE_ID`, and `SYNC_TOKEN` bindings. Confirm the one-minute Cron remains
configured and `/health` returns `ok: true`.

- [ ] **Step 3: Commit and push**

Commit the Worker, selector, UI, tests, spec, and plan. Push `main`.

- [ ] **Step 4: Verify production**

Confirm the GitHub Pages workflow succeeds and Firebase live metadata receives
`displayClock` on an eligible sync. Validate the published app renders the live
header when live metadata is present.
