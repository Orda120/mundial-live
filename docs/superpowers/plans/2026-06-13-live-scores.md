# Live Scores Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a free Cloudflare Worker that updates the existing group-stage score fields during live World Cup matches while retaining manual overrides.

**Architecture:** Pure Worker modules handle schedule decisions, provider normalization, and Firebase patches. A scheduled Worker calls ESPN's public scoreboard only inside active match windows and writes scores plus metadata to the active league. The React administration screen writes manual override metadata and can return an individual fixture to automatic mode.

**Tech Stack:** React 18, Firebase Realtime Database REST API, Cloudflare Workers, Wrangler 4, ESPN public scoreboard, Node test runner.

---

### Task 1: Extract Shared World Cup Fixture Data

**Files:**
- Create: `src/worldCupData.js`
- Modify: `src/App.jsx`
- Test: `src/worldCupData.test.js`

- [ ] **Step 1: Write a failing test**

Test that all 72 group fixtures have unique IDs and that team-pair lookup maps
both provider orderings to the existing fixture ID.

- [ ] **Step 2: Run the test and verify failure**

Run: `npm test`

Expected: failure because `worldCupData.js` does not exist.

- [ ] **Step 3: Move team groups and fixture generation into the shared module**

Export `GROUPS`, `GROUP_KEYS`, `ALL_TEAMS`, `PAIRS`, `groupFixtures`,
`ALL_GROUP_FIXTURES`, and `fixtureIdForTeams`.

- [ ] **Step 4: Import the shared exports from `App.jsx`**

Remove only the duplicated fixture constants; leave labels and rendering data in
the existing component file.

- [ ] **Step 5: Run tests and build**

Run: `npm test && npm run build`

Expected: all tests pass and Vite builds successfully.

### Task 2: Implement Polling and Provider Normalization

**Files:**
- Create: `worker/src/liveScores.js`
- Create: `worker/src/liveScores.test.js`

- [ ] **Step 1: Write failing unit tests**

Cover:

- polling opens 10 minutes before kickoff;
- five-minute normal interval;
- twice-daily full schedule refresh;
- provider status and score normalization;
- unique mapping by team pair;
- manual overrides excluded from updates;
- empty and failed responses produce no score-clearing patch.

- [ ] **Step 2: Run Worker tests and verify failure**

Run: `node --test worker/src/*.test.js`

Expected: failure because `liveScores.js` does not exist.

- [ ] **Step 3: Implement pure functions**

Add `shouldRefreshSchedule`, `isPollingWindowOpen`, `shouldPoll`,
`normalizeEspnEvent`, and `buildFirebasePatch`. Keep network and secrets out of
this module.

- [ ] **Step 4: Run Worker tests**

Run: `node --test worker/src/*.test.js`

Expected: all Worker unit tests pass.

### Task 3: Implement the Scheduled Cloudflare Worker

**Files:**
- Create: `worker/src/index.js`
- Create: `worker/wrangler.jsonc`
- Create: `worker/package.json`
- Create: `worker/.dev.vars.example`
- Modify: `.gitignore`

- [ ] **Step 1: Add Wrangler configuration**

Use compatibility date `2026-06-13`, `nodejs_compat`, one-minute Cron Trigger,
production Firebase URL and league ID variables, and enabled observability.

- [ ] **Step 2: Implement scheduled synchronization**

The handler must:

1. read `liveSync`, `liveMeta/g`, and current scores from Firebase;
2. decide whether a provider request is eligible;
3. refresh the full ESPN schedule twice per day or fetch nearby match dates
   during an active polling window;
4. build one Firebase multipath PATCH;
5. update request timing even if no live score changes;
6. preserve known scores on all errors.

- [ ] **Step 3: Add an authenticated diagnostic HTTP endpoint**

`GET /health` returns configuration status without secrets. `POST /sync` uses a
separate `SYNC_TOKEN` secret and constant-time verification to trigger a dry run
or real synchronization for deployment verification.

- [ ] **Step 4: Generate Worker types and validate**

Run:

```powershell
npm install
npx wrangler types
npx wrangler deploy --dry-run
```

Expected: generated binding types and successful dry-run bundle.

### Task 4: Add Manual Override Metadata to the App

**Files:**
- Create: `src/liveResults.js`
- Create: `src/liveResults.test.js`
- Modify: `src/App.jsx`
- Modify: `src/db.js`

- [ ] **Step 1: Write failing app tests**

Test that saving a changed score marks only changed fixtures as manual, clearing
a score still marks that fixture manual, unchanged live metadata is preserved,
and clearing an override leaves the current score intact.

- [ ] **Step 2: Run tests and verify failure**

Run: `npm test`

Expected: failure because `liveResults.js` does not exist.

- [ ] **Step 3: Implement metadata helpers**

Add pure `applyManualOverrides` and `clearManualOverride` helpers.

- [ ] **Step 4: Subscribe to `liveMeta` and save results plus metadata**

Add paths for `liveMeta` and `liveSync`. Extend result saving to write the score
object and metadata together with a Firebase root multipath update.

- [ ] **Step 5: Show status and automatic-mode action**

Beside each group score display:

- `LIVE` for provider live status;
- `FINAL` for provider finished status;
- `MANUAL` for overrides;
- a button to clear a manual override.

- [ ] **Step 6: Run app tests and build**

Run: `npm test && npm run build`

Expected: all tests pass and production build succeeds.

### Task 5: Configure Secrets, Deploy, and Verify

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Detect required credentials**

Check Cloudflare authentication and generate a private `SYNC_TOKEN`. Never print
the token or active league ID.

- [ ] **Step 2: Deploy available configuration**

Set `LEAGUE_ID` and `SYNC_TOKEN` through Worker secrets, deploy the Worker, and
verify `/health`.

- [ ] **Step 3: Dry-run provider synchronization**

Trigger `/sync?dryRun=1`; verify request accounting, fixture parsing, and zero
Firebase writes.

- [ ] **Step 4: Deploy app changes**

Commit and push `main`; monitor GitHub Pages until deployment completes.

- [ ] **Step 5: Verify production**

Run all tests and builds, verify Worker health and Cron configuration, inspect
Firebase `liveSync`, and confirm the published frontend bundle contains the
manual override UI.

- [ ] **Step 6: Document operation**

Add README commands for checking Worker logs and manually triggering a dry run.
