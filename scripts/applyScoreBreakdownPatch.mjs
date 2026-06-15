import { readFileSync, writeFileSync } from "node:fs";

const appPath = new URL("../src/App.jsx", import.meta.url);
const originalSource = readFileSync(appPath, "utf8");
const newline = originalSource.includes("\r\n") ? "\r\n" : "\n";
let source = originalSource.replaceAll("\r\n", "\n");
let changed = false;

function replaceOnce(search, replacement, label) {
  if (source.includes(replacement)) return;
  if (!source.includes(search)) {
    throw new Error(`Could not apply score breakdown patch: missing ${label}`);
  }
  source = source.replace(search, replacement);
  changed = true;
}

replaceOnce(
  'import { applyManualOverrides, clearManualOverride } from "./liveResults";\n',
  'import { applyManualOverrides, clearManualOverride } from "./liveResults";\nimport {\n  createScoreBreakdownRow,\n  recordBracketPoints,\n  recordDraftGroupPoints,\n  recordDraftKoPoints,\n  recordGroupBetPoints,\n  recordKoBetPoints,\n  summarizeScoreBreakdown,\n} from "./scoreBreakdown";\n',
  "score breakdown import",
);

replaceOnce(
  '    const myTeams = Object.keys(assign).filter((t) => assign[t] === p.id);\n\n    // ---- part 1: draft ----',
  '    const myTeams = Object.keys(assign).filter((t) => assign[t] === p.id);\n    const breakdown = createScoreBreakdownRow(p);\n\n    // ---- part 1: draft ----',
  "breakdown row initialization",
);

replaceOnce(
  `    // ---- part 1: draft ----
    let draft = 0;
    ALL_GROUP_FIXTURES.forEach((f) => {
      const o = outcomeOf(gRes[f.id]);
      if (!o) return;
      [f.t1, f.t2].forEach((team) => {
        if (!myTeams.includes(team)) return;
        const won = (o === "1" && team === f.t1) || (o === "2" && team === f.t2);
        draft += won ? 3 : o === "X" ? 1 : 0;
      });
    });
    koArr.forEach((m) => {
      if (!m.w) return;
      [m.t1, m.t2].forEach((team) => {
        if (!myTeams.includes(team)) return;
        if (team === m.w) draft += 3;
        else if (m.p === "et") draft += 1; // הפסד בהארכה/פנדלים
      });
    });`,
  `    // ---- part 1: draft ----
    ALL_GROUP_FIXTURES.forEach((f) => {
      recordDraftGroupPoints(breakdown, { fixture: f, result: gRes[f.id], teams: myTeams });
    });
    koArr.forEach((m) => {
      recordDraftKoPoints(breakdown, { match: m, teams: myTeams });
    });
    const draft =
      (breakdown.byType.draftGroupWin || 0) +
      (breakdown.byType.draftGroupDraw || 0) +
      (breakdown.byType.draftKoWin || 0) +
      (breakdown.byType.draftKoExtraLoss || 0);`,
  "draft scoring breakdown",
);

replaceOnce(
  `    // ---- part 2a: group-stage match bets ----
    let mGroup = 0;
    Object.entries(gRes).forEach(([id, r]) => {
      if (my.g && my.g[id] === outcomeOf(r)) mGroup += 1;
    });`,
  `    // ---- part 2a: group-stage match bets ----
    Object.entries(gRes).forEach(([id, r]) => {
      recordGroupBetPoints(breakdown, { fixtureId: id, bet: my.g && my.g[id], result: r });
    });
    const mGroup = breakdown.byType.matchGroup || 0;`,
  "group match bet breakdown",
);

replaceOnce(
  `    // ---- part 2b: knockout bets ----
    let mKo = 0;
    koArr.forEach((m) => {
      if (!m.w) return;
      const b = my.ko && my.ko[m.id];
      if (b && b.t === m.w) {
        mKo += 1;
        if (m.p && b.p === m.p) mKo += 1; // bonus only if the team was right too
      }
    });`,
  `    // ---- part 2b: knockout bets ----
    koArr.forEach((m) => {
      recordKoBetPoints(breakdown, { match: m, bet: my.ko && my.ko[m.id] });
    });
    const mKo = (breakdown.byType.matchKoWinner || 0) + (breakdown.byType.matchKoMethod || 0);`,
  "knockout match bet breakdown",
);

replaceOnce(
  `    // ---- part 3: bracket predictions (cumulative by construction) ----
    let bracket = 0;
    const tierHits = {};
    TIERS.forEach((tier) => {
      const picks = (my.br && my.br[tier.k]) || [];
      const hits = picks.filter((t) => reach[tier.k].has(t)).length;
      tierHits[tier.k] = hits;
      bracket += hits * tier.pts;
    });`,
  `    // ---- part 3: bracket predictions (cumulative by construction) ----
    const tierHits = {};
    TIERS.forEach((tier) => {
      const picks = (my.br && my.br[tier.k]) || [];
      tierHits[tier.k] = recordBracketPoints(breakdown, { tier, picks, reached: reach[tier.k] });
    });
    const bracket = Object.entries(breakdown.byType)
      .filter(([type]) => type.startsWith("bracket"))
      .reduce((sum, [, points]) => sum + points, 0);
    const breakdownSummary = summarizeScoreBreakdown(breakdown);`,
  "bracket prediction breakdown",
);

replaceOnce(
  `      matches: mGroup + mKo, bracket, tierHits,
      total: draft + mGroup + mKo + bracket,`,
  `      matches: mGroup + mKo, bracket, tierHits,
      breakdown: breakdownSummary,
      total: draft + mGroup + mKo + bracket,`,
  "row breakdown payload",
);

replaceOnce(
  `                <div className="mt-2 text-xs text-slate-500">
                  פירוט משחקים: {r.mGroup} נק׳ בתים · {r.mKo} נק׳ נוקאאוט
                </div>`,
  `                <ScoreBreakdownDetails row={r} />`,
  "leaderboard breakdown details",
);

replaceOnce(
  `// peeks at another player's champion pick (only rendered after bracket lock)
const BracketPeekCtx = React.createContext({});`,
  `function ScoreBreakdownDetails({ row }) {
  const [mode, setMode] = useState("type");
  const typeRows = row.breakdown?.typeRows || [];
  const teamRows = row.breakdown?.teamRows || [];
  const rows = mode === "team" ? teamRows : typeRows;

  return (
    <div className="mt-3 rounded-xl border border-slate-800 bg-slate-950 p-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <div>
          <div className="text-xs font-bold text-slate-300">פירוט נקודות</div>
          <div className="text-[11px] text-slate-500">משחקים: {row.mGroup} נק׳ בתים · {row.mKo} נק׳ נוקאאוט</div>
        </div>
        <div className="flex rounded-full border border-slate-800 bg-slate-900 p-0.5 text-[11px]">
          <button
            type="button"
            onClick={() => setMode("type")}
            className={"rounded-full px-2 py-1 " + (mode === "type" ? "bg-sky-500 text-white" : "text-slate-400")}
          >
            לפי דרך
          </button>
          <button
            type="button"
            onClick={() => setMode("team")}
            className={"rounded-full px-2 py-1 " + (mode === "team" ? "bg-sky-500 text-white" : "text-slate-400")}
          >
            לפי נבחרת
          </button>
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="text-xs text-slate-600">עוד אין נקודות לפירוט</div>
      ) : (
        <div className="flex flex-col gap-1.5">
          {rows.map((item) => (
            <div key={mode === "team" ? item.team : item.type} className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-900 px-2 py-1.5 text-xs">
              <span className="flex min-w-0 items-center gap-1.5 text-slate-300">
                {mode === "team" && <Flag code={item.team} />}
                <span className="truncate">{mode === "team" ? <TName code={item.team} /> : item.label}</span>
              </span>
              <span className="font-mono font-bold text-emerald-300">+{item.points}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// peeks at another player's champion pick (only rendered after bracket lock)
const BracketPeekCtx = React.createContext({});`,
  "ScoreBreakdownDetails component",
);

if (changed) {
  writeFileSync(appPath, source.replaceAll("\n", newline));
  console.log("Applied score breakdown UI patch to src/App.jsx");
} else {
  console.log("Score breakdown UI patch already applied");
}
