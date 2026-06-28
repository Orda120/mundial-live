import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  Trophy, RefreshCw, Check, X, Plus, Trash2, ChevronDown, ChevronLeft,
  Lock, Unlock, Users, Target, Shuffle, Settings, BookOpen, Undo2, AlertTriangle, Pencil, FlaskConical, Link2,
  Bot, Send, MessageSquare, ListOrdered, ShieldX, Languages,
} from "lucide-react";
import { LocaleProvider, useLocale } from "./i18n";
import { Button, Card, EmptyState, Pill, StatCard } from "./ui";
import { dbReady, sSet, sUpdate, sDel, sTx, subscribe, subscribeConnected } from "./db";
import { resolveAiWorkerUrl } from "./aiConfig";
import { syncBetsDraft } from "./betsDraft";
import { selectLiveMatches } from "./liveHeader";
import { applyManualOverrides, clearManualOverride } from "./liveResults";
import {
  createScoreBreakdownRow,
  recordBracketPoints,
  recordDraftGroupPoints,
  recordDraftKoPoints,
  recordGroupBetPoints,
  recordKoBetPoints,
  summarizeScoreBreakdown,
} from "./scoreBreakdown";
import {
  ALL_GROUP_FIXTURES,
  ALL_TEAMS,
  GROUP_KEYS,
  GROUPS,
  groupFixtures,
} from "./worldCupData";
import { buildTeamTournamentRows } from "./teamStandings";
import {
  buildBettableKnockoutSchedule,
  buildKnockoutSchedule,
  buildScheduledBracketKo,
  FEED,
  TREE_COLS,
} from "./bracketSchedule";

/* ================= DATA — World Cup 2026 (final groups, post-playoffs) ================= */

const T = {
  MEX: ["מקסיקו", "🇲🇽"], KOR: ["דרום קוריאה", "🇰🇷"], CZE: ["צ׳כיה", "🇨🇿"], RSA: ["דרום אפריקה", "🇿🇦"],
  SUI: ["שווייץ", "🇨🇭"], CAN: ["קנדה", "🇨🇦"], QAT: ["קטאר", "🇶🇦"], BIH: ["בוסניה", "🇧🇦"],
  BRA: ["ברזיל", "🇧🇷"], MAR: ["מרוקו", "🇲🇦"], HAI: ["האיטי", "🇭🇹"], SCO: ["סקוטלנד", "🏴󠁧󠁢󠁳󠁣󠁴󠁿"],
  USA: ["ארה״ב", "🇺🇸"], TUR: ["טורקיה", "🇹🇷"], AUS: ["אוסטרליה", "🇦🇺"], PAR: ["פרגוואי", "🇵🇾"],
  GER: ["גרמניה", "🇩🇪"], ECU: ["אקוודור", "🇪🇨"], CIV: ["חוף השנהב", "🇨🇮"], CUW: ["קוראסאו", "🇨🇼"],
  NED: ["הולנד", "🇳🇱"], JPN: ["יפן", "🇯🇵"], SWE: ["שוודיה", "🇸🇪"], TUN: ["טוניסיה", "🇹🇳"],
  BEL: ["בלגיה", "🇧🇪"], EGY: ["מצרים", "🇪🇬"], IRN: ["איראן", "🇮🇷"], NZL: ["ניו זילנד", "🇳🇿"],
  ESP: ["ספרד", "🇪🇸"], CPV: ["כף ורדה", "🇨🇻"], KSA: ["ערב הסעודית", "🇸🇦"], URU: ["אורוגוואי", "🇺🇾"],
  FRA: ["צרפת", "🇫🇷"], SEN: ["סנגל", "🇸🇳"], IRQ: ["עיראק", "🇮🇶"], NOR: ["נורווגיה", "🇳🇴"],
  ARG: ["ארגנטינה", "🇦🇷"], ALG: ["אלג׳יריה", "🇩🇿"], AUT: ["אוסטריה", "🇦🇹"], JOR: ["ירדן", "🇯🇴"],
  POR: ["פורטוגל", "🇵🇹"], COD: ["קונגו", "🇨🇩"], UZB: ["אוזבקיסטן", "🇺🇿"], COL: ["קולומביה", "🇨🇴"],
  ENG: ["אנגליה", "🏴󠁧󠁢󠁥󠁮󠁧󠁿"], CRO: ["קרואטיה", "🇭🇷"], GHA: ["גאנה", "🇬🇭"], PAN: ["פנמה", "🇵🇦"],
};

/* ===== inline SVG flags (render everywhere, incl. Windows; simplified but recognizable) ===== */
const _st = (cx, cy, R, fill) => {
  let pts = "";
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5, r = i % 2 ? R * 0.45 : R;
    pts += (cx + r * Math.cos(a)).toFixed(1) + "," + (cy + r * Math.sin(a)).toFixed(1) + " ";
  }
  return ["p", pts.trim(), fill];
};
const _h = (...cs) => cs.map((c, i) => ["r", 0, +((20 * i) / cs.length).toFixed(2), 30, +(20 / cs.length).toFixed(2) + 0.3, c]);
const _v = (...cs) => cs.map((c, i) => ["r", +((30 * i) / cs.length).toFixed(2), 0, +(30 / cs.length).toFixed(2) + 0.3, 20, c]);
const _uj = [
  ["r", 0, 0, 15, 10, "#00247d"],
  ["l", 0, 0, 15, 10, "#fff", 2.4], ["l", 15, 0, 0, 10, "#fff", 2.4],
  ["l", 0, 0, 15, 10, "#cf142b", 1], ["l", 15, 0, 0, 10, "#cf142b", 1],
  ["r", 6.2, 0, 2.6, 10, "#fff"], ["r", 0, 3.7, 15, 2.6, "#fff"],
  ["r", 6.9, 0, 1.2, 10, "#cf142b"], ["r", 0, 4.4, 15, 1.2, "#cf142b"],
];
const FLAGS = {
  MEX: [..._v("#006847", "#fff", "#ce1126"), ["c", 15, 10, 2.3, "#8c6239"]],
  KOR: [["r", 0, 0, 30, 20, "#fff"], ["c", 15, 10, 5.4, "#cd2e3a"], ["d", "M9.6,10a5.4,5.4 0 0 0 10.8,0z", "#0047a0"],
  ["r", 3, 3, 4.5, 1, "#000"], ["r", 3, 4.8, 4.5, 1, "#000"], ["r", 3, 6.6, 4.5, 1, "#000"],
  ["r", 22.5, 12.4, 4.5, 1, "#000"], ["r", 22.5, 14.2, 4.5, 1, "#000"], ["r", 22.5, 16, 4.5, 1, "#000"]],
  CZE: [..._h("#fff", "#d7141a"), ["p", "0,0 13,10 0,20", "#11457e"]],
  RSA: [["r", 0, 0, 30, 10, "#e03c31"], ["r", 0, 10, 30, 10, "#001489"], ["r", 0, 6.2, 30, 7.6, "#fff"], ["r", 0, 7.8, 30, 4.4, "#007749"],
  ["p", "0,0 12,10 0,20", "#fff"], ["p", "0,1.8 9.8,10 0,18.2", "#ffb81c"], ["p", "0,3.6 7.7,10 0,16.4", "#000"]],
  SUI: [["r", 0, 0, 30, 20, "#da291c"], ["r", 13, 4.5, 4, 11, "#fff"], ["r", 9.5, 8, 11, 4, "#fff"]],
  CAN: [["r", 0, 0, 30, 20, "#fff"], ["r", 0, 0, 7.5, 20, "#d80621"], ["r", 22.5, 0, 7.5, 20, "#d80621"], _st(15, 9.3, 4.4, "#d80621"), ["r", 14.5, 12, 1, 3.2, "#d80621"]],
  QAT: [["r", 0, 0, 30, 20, "#8d1b3d"], ["p", "0,0 8,0 10,1.1 8,2.2 10,3.3 8,4.4 10,5.6 8,6.7 10,7.8 8,8.9 10,10 8,11.1 10,12.2 8,13.3 10,14.4 8,15.6 10,16.7 8,17.8 10,18.9 8,20 0,20", "#fff"]],
  BIH: [["r", 0, 0, 30, 20, "#002395"], ["p", "8,0 26,0 8,20", "#fecb00"], _st(8.3, 3.6, 1.7, "#fff"), _st(12.8, 8.6, 1.7, "#fff"), _st(17.3, 13.6, 1.7, "#fff")],
  BRA: [["r", 0, 0, 30, 20, "#009b3a"], ["p", "15,2 27.5,10 15,18 2.5,10", "#fedf00"], ["c", 15, 10, 4.1, "#002776"], ["r", 10.9, 9.3, 8.2, 1.4, "#fff"]],
  MAR: [["r", 0, 0, 30, 20, "#c1272d"], _st(15, 10.6, 4.8, "#006233")],
  HAI: [..._h("#00209f", "#d21034"), ["r", 11, 6.8, 8, 6.4, "#fff"], ["c", 15, 10, 1.5, "#016a16"]],
  SCO: [["r", 0, 0, 30, 20, "#005eb8"], ["l", 0, 0, 30, 20, "#fff", 3.6], ["l", 30, 0, 0, 20, "#fff", 3.6]],
  USA: [..._h("#b22234", "#fff", "#b22234", "#fff", "#b22234", "#fff", "#b22234"), ["r", 0, 0, 13.5, 8.8, "#3c3b6e"],
  ["c", 2.5, 2.2, 0.7, "#fff"], ["c", 6.7, 2.2, 0.7, "#fff"], ["c", 10.9, 2.2, 0.7, "#fff"],
  ["c", 4.6, 4.4, 0.7, "#fff"], ["c", 8.8, 4.4, 0.7, "#fff"],
  ["c", 2.5, 6.6, 0.7, "#fff"], ["c", 6.7, 6.6, 0.7, "#fff"], ["c", 10.9, 6.6, 0.7, "#fff"]],
  TUR: [["r", 0, 0, 30, 20, "#e30a17"], ["c", 11.5, 10, 5.2, "#fff"], ["c", 12.8, 10, 4.2, "#e30a17"], _st(18.6, 10, 2.3, "#fff")],
  AUS: [["r", 0, 0, 30, 20, "#00247d"], ..._uj, _st(7.5, 15.5, 2.3, "#fff"), _st(22, 4.5, 1.4, "#fff"), _st(26.3, 8.5, 1.4, "#fff"), _st(21.5, 12.5, 1.4, "#fff"), _st(24.5, 17, 1.3, "#fff"), _st(19, 9.5, 0.9, "#fff")],
  PAR: [..._h("#d52b1e", "#fff", "#0038a8"), ["c", 15, 10, 2.3, "#fcd116"], ["c", 15, 10, 1.6, "#fff"], _st(15, 10, 1.3, "#009b3a")],
  GER: _h("#000", "#dd0000", "#ffce00"),
  ECU: [["r", 0, 0, 30, 10, "#ffd100"], ["r", 0, 10, 30, 5, "#0072ce"], ["r", 0, 15, 30, 5, "#ef3340"], ["c", 15, 10, 2.4, "#6d4f2f"]],
  CIV: _v("#ff8200", "#fff", "#009a44"),
  CUW: [["r", 0, 0, 30, 20, "#002b7f"], ["r", 0, 12.5, 30, 3.4, "#f9e814"], _st(5.5, 4.5, 2.4, "#fff"), _st(10, 8.3, 1.6, "#fff")],
  NED: _h("#ae1c28", "#fff", "#21468b"),
  JPN: [["r", 0, 0, 30, 20, "#fff"], ["c", 15, 10, 5.6, "#bc002d"]],
  SWE: [["r", 0, 0, 30, 20, "#006aa7"], ["r", 8.5, 0, 4.4, 20, "#fecc02"], ["r", 0, 7.8, 30, 4.4, "#fecc02"]],
  TUN: [["r", 0, 0, 30, 20, "#e70013"], ["c", 15, 10, 5.4, "#fff"], ["c", 15.6, 10, 4.2, "#e70013"], ["c", 17, 10, 3.3, "#fff"], _st(15.4, 10, 2, "#e70013")],
  BEL: _v("#000", "#fdda24", "#ef3340"),
  EGY: [..._h("#ce1126", "#fff", "#000"), ["c", 15, 10, 1.8, "#c09300"]],
  IRN: [..._h("#239f40", "#fff", "#da0000"), ["c", 15, 10, 1.7, "#da0000"]],
  NZL: [["r", 0, 0, 30, 20, "#00247d"], ..._uj, _st(22, 5, 1.5, "#cc142b"), _st(26, 9, 1.5, "#cc142b"), _st(21.5, 12.5, 1.5, "#cc142b"), _st(23.8, 16.5, 1.3, "#cc142b")],
  ESP: [["r", 0, 0, 30, 5, "#aa151b"], ["r", 0, 5, 30, 10, "#f1bf00"], ["r", 0, 15, 30, 5, "#aa151b"], ["r", 7.4, 8, 3, 4, "#aa151b"], ["c", 8.9, 8, 1.1, "#f1bf00"]],
  CPV: [["r", 0, 0, 30, 20, "#003893"], ["r", 0, 12, 30, 1.7, "#fff"], ["r", 0, 13.7, 30, 1.7, "#cf2027"], ["r", 0, 15.4, 30, 1.7, "#fff"],
  ["c", 11, 10.5, 0.7, "#f7d116"], ["c", 13.4, 11.5, 0.7, "#f7d116"], ["c", 14.4, 14, 0.7, "#f7d116"], ["c", 13.4, 16.5, 0.7, "#f7d116"], ["c", 11, 17.5, 0.7, "#f7d116"], ["c", 8.6, 16.5, 0.7, "#f7d116"], ["c", 7.6, 14, 0.7, "#f7d116"], ["c", 8.6, 11.5, 0.7, "#f7d116"]],
  KSA: [["r", 0, 0, 30, 20, "#006c35"], ["r", 7, 7, 16, 1, "#fff"], ["r", 9, 9, 12, 1, "#fff"], ["r", 8, 12.6, 12, 1.1, "#fff"], ["r", 20.5, 12.1, 2.2, 2.1, "#fff"]],
  URU: [..._h("#fff", "#0038a8", "#fff", "#0038a8", "#fff", "#0038a8", "#fff", "#0038a8", "#fff"), ["r", 0, 0, 13.4, 11.2, "#fff"], _st(6.5, 5.5, 3.4, "#fcd116"), ["c", 6.5, 5.5, 2.2, "#fcd116"]],
  FRA: _v("#002395", "#fff", "#ed2939"),
  SEN: [..._v("#00853f", "#fdef42", "#e31b23"), _st(15, 10.6, 3, "#00853f")],
  IRQ: [..._h("#ce1126", "#fff", "#000"), ["r", 8.5, 8.9, 3.6, 1.9, "#007a3d"], ["r", 13.2, 8.9, 3.6, 1.9, "#007a3d"], ["r", 17.9, 8.9, 3.6, 1.9, "#007a3d"]],
  NOR: [["r", 0, 0, 30, 20, "#ba0c2f"], ["r", 7.5, 0, 5.4, 20, "#fff"], ["r", 0, 7.3, 30, 5.4, "#fff"], ["r", 8.9, 0, 2.6, 20, "#00205b"], ["r", 0, 8.7, 30, 2.6, "#00205b"]],
  ARG: [..._h("#74acdf", "#fff", "#74acdf"), _st(15, 10, 2.8, "#f6b40e"), ["c", 15, 10, 1.8, "#f6b40e"]],
  ALG: [["r", 0, 0, 15, 20, "#006233"], ["r", 15, 0, 15, 20, "#fff"], ["c", 16.6, 10, 4.1, "#d21034"], ["c", 18.2, 10, 3.4, "#fff"], _st(18.4, 10, 1.9, "#d21034")],
  AUT: _h("#ed2939", "#fff", "#ed2939"),
  JOR: [..._h("#000", "#fff", "#007a3d"), ["p", "0,0 13,10 0,20", "#ce1126"], _st(4.5, 10, 1.3, "#fff")],
  POR: [["r", 0, 0, 12, 20, "#046a38"], ["r", 12, 0, 18, 20, "#da291c"], ["c", 12, 10, 3.3, "#ffe900"], ["c", 12, 10, 1.9, "#fff"], ["r", 11.1, 9.1, 1.8, 1.8, "#da291c"]],
  COD: [["r", 0, 0, 30, 20, "#007fff"], ["l", -2, 21.5, 32, -1.5, "#f7d618", 6], ["l", -2, 21.5, 32, -1.5, "#ce1021", 3.4], _st(5, 4.5, 2.7, "#f7d618")],
  UZB: [["r", 0, 0, 30, 6.6, "#0099b5"], ["r", 0, 6.6, 30, 6.8, "#fff"], ["r", 0, 13.4, 30, 6.6, "#1eb53a"], ["r", 0, 6.6, 30, 0.8, "#ce1126"], ["r", 0, 12.6, 30, 0.8, "#ce1126"],
  ["c", 4.6, 3.3, 2.1, "#fff"], ["c", 5.5, 3.3, 1.8, "#0099b5"], ["c", 9, 2.2, 0.5, "#fff"], ["c", 11, 3.3, 0.5, "#fff"], ["c", 13, 2.2, 0.5, "#fff"]],
  COL: [["r", 0, 0, 30, 10, "#fcd116"], ["r", 0, 10, 30, 5, "#003893"], ["r", 0, 15, 30, 5, "#ce1126"]],
  ENG: [["r", 0, 0, 30, 20, "#fff"], ["r", 12.7, 0, 4.6, 20, "#ce1124"], ["r", 0, 7.7, 30, 4.6, "#ce1124"]],
  CRO: [..._h("#ff0000", "#fff", "#171796"), ["r", 11.4, 6.4, 7.2, 7.2, "#fff"],
  ["r", 11.4, 6.4, 1.8, 1.8, "#ff0000"], ["r", 15, 6.4, 1.8, 1.8, "#ff0000"],
  ["r", 13.2, 8.2, 1.8, 1.8, "#ff0000"], ["r", 16.8, 8.2, 1.8, 1.8, "#ff0000"],
  ["r", 11.4, 10, 1.8, 1.8, "#ff0000"], ["r", 15, 10, 1.8, 1.8, "#ff0000"],
  ["r", 13.2, 11.8, 1.8, 1.8, "#ff0000"], ["r", 16.8, 11.8, 1.8, 1.8, "#ff0000"]],
  GHA: [..._h("#ce1126", "#fcd116", "#006b3f"), _st(15, 10, 3, "#000")],
  PAN: [["r", 0, 0, 15, 10, "#fff"], ["r", 15, 0, 15, 10, "#d21034"], ["r", 0, 10, 15, 10, "#005293"], ["r", 15, 10, 15, 10, "#fff"], _st(7.5, 5, 2.5, "#005293"), _st(22.5, 15, 2.5, "#d21034")],
};

const KO_ROUNDS = [
  { k: "r32", n: "שלב ה־32" },
  { k: "r16", n: "שמינית גמר" },
  { k: "qf", n: "רבע גמר" },
  { k: "sf", n: "חצי גמר" },
  { k: "p3", n: "מקום שלישי" },
  { k: "f", n: "הגמר" },
];
const ROUND_TO_TIER = { r32: "r16", r16: "qf", qf: "sf", sf: "fin", f: "win" };

const TIERS = [
  { k: "r32", n: "עולות לשלב ה־32", size: 32, pts: 0.5 },
  { k: "r16", n: "עולות לשמינית הגמר", size: 16, pts: 1 },
  { k: "qf", n: "עולות לרבע הגמר", size: 8, pts: 2 },
  { k: "sf", n: "עולות לחצי הגמר", size: 4, pts: 3 },
  { k: "fin", n: "פיינליסטיות", size: 2, pts: 4 },
  { k: "win", n: "אלופת העולם", size: 1, pts: 5 },
];

const COLORS = [
  "bg-sky-500", "bg-rose-500", "bg-emerald-500", "bg-amber-500", "bg-violet-500",
  "bg-cyan-500", "bg-orange-500", "bg-lime-500", "bg-fuchsia-500", "bg-teal-400",
  "bg-red-400", "bg-indigo-400",
];

const EMPTY_BETS = { g: {}, ko: {}, br: { r32: [], r16: [], qf: [], sf: [], fin: [], win: [] } };

/* ================= AI STATIC CONTEXT ================= */

function buildAiStaticContext() {
  const groupsText = GROUP_KEYS.map((g) =>
    `  בית ${g}: ${GROUPS[g].map((c) => T[c]?.[0] || c).join(", ")}`
  ).join("\n");

  const fixtureCount = GROUP_KEYS.length * 6;
  const tiersText = TIERS.map((t) => `${t.n} (${t.pts} נק׳)`).join(" | ");
  const koText = KO_ROUNDS.map((r) => r.n).join(" ← ");

  return `אתה יועץ הימורים מקצועי עבור ליגת הימורים פנימית על גביע העולם FIFA 2026.
ענה תמיד בעברית, בצורה ממוקדת וידידותית.

=== פורמט הטורניר ===
48 נבחרות, 12 בתים (A–L), 4 נבחרות בכל בית.
${fixtureCount} משחקי שלב הבתים. מהכל בית עולות 2 נבחרות; בנוסף 8 המיקומות השלישיים הטובים מעפילים — סה״כ 32 לנוקאאוט.
שלב הנוקאאוט: ${koText}.

=== הבתים ===
${groupsText}

=== חוקי הניקוד (בליגה זו) ===
דראפט נבחרות:
  • ניצחון ב-90 דק׳ = 3 נק׳
  • תיקו / הפסד בהארכה/פנדלים = 1 נק׳
  • הפסד ב-90 דק׳ = 0 נק׳
הימורי שלב הבתים (1/X/2): 1 נק׳ להגדרת תוצאה נכונה.
הימורי נוקאאוט: עולה נכונה = 1 נק׳, + 1 נק׳ בונוס לניחוש דרך (90 דק׳ / הארכה-פנדלים).
ניחושי עולות: ${tiersText}.

=== פורמט תשובה למשחק ספציפי ===
כשנשאלים על משחק, ענה תמיד במבנה הבא:
🎯 המלצה: [1 / תיקו / 2]
💪 נימוקים:
• [נימוק 1]
• [נימוק 2]
• [נימוק 3 אם רלוונטי]
⚠️ רמת ביטחון: גבוה / בינוני / נמוך
💡 טיפ: [מידע נוסף חשוב]`;
}

const AI_STATIC_CONTEXT = buildAiStaticContext();

function computeGroupStandings(gResults) {
  return GROUP_KEYS.map((g) => {
    const teams = GROUPS[g];
    const stats = Object.fromEntries(teams.map((t) => [t, { w: 0, d: 0, l: 0, gf: 0, ga: 0 }]));
    groupFixtures(g).forEach((f) => {
      const sc = scoreOf(gResults?.[f.id]);
      if (!sc) return;
      const [g1, g2] = sc;
      if (g1 > g2) { stats[f.t1].w++; stats[f.t2].l++; }
      else if (g1 < g2) { stats[f.t2].w++; stats[f.t1].l++; }
      else { stats[f.t1].d++; stats[f.t2].d++; }
      stats[f.t1].gf += g1; stats[f.t1].ga += g2;
      stats[f.t2].gf += g2; stats[f.t2].ga += g1;
    });
    const rows = teams
      .map((t) => {
        const s = stats[t];
        const pts = s.w * 3 + s.d;
        return { t, pts, gd: s.gf - s.ga, gf: s.gf, played: s.w + s.d + s.l };
      })
      .sort((a, b) => b.pts - a.pts || b.gd - a.gd || b.gf - a.gf);
    const line = rows.map((r, i) =>
      `${i + 1}. ${T[r.t]?.[0] || r.t} ${r.pts}נק׳${r.played === 0 ? "" : ` (${r.played} משחקים)`}`
    ).join(" | ");
    return `בית ${g}: ${line}`;
  }).join("\n");
}

function computeTeamForm(gResults) {
  const form = {};
  ALL_GROUP_FIXTURES.forEach((f) => {
    const sc = scoreOf(gResults?.[f.id]);
    if (!sc) return;
    const [g1, g2] = sc;
    const r1 = g1 > g2 ? "נצ" : g1 === g2 ? "ת" : "ה";
    const r2 = g2 > g1 ? "נצ" : g2 === g1 ? "ת" : "ה";
    (form[f.t1] = form[f.t1] || []).push(`${r1}(${g1}-${g2} vs ${T[f.t2]?.[0] || f.t2})`);
    (form[f.t2] = form[f.t2] || []).push(`${r2}(${g2}-${g1} vs ${T[f.t1]?.[0] || f.t1})`);
  });
  if (Object.keys(form).length === 0) return null;
  return Object.entries(form)
    .map(([tc, rr]) => `${T[tc]?.[0] || tc}: ${rr.join(", ")}`)
    .join("\n");
}

/* group results are stored as exact scores ("2-1"); legacy outcome values ("1"|"X"|"2") still work */
const SCORE_RE = /^(\d{1,2})-(\d{1,2})$/;
const scoreOf = (r) => { const m = typeof r === "string" && SCORE_RE.exec(r); return m ? [+m[1], +m[2]] : null; };
const outcomeOf = (r) => {
  if (!r) return null;
  const s = scoreOf(r);
  if (!s) return r;
  return s[0] > s[1] ? "1" : s[0] < s[1] ? "2" : "X";
};
const DRAFT_NS = [3, 4, 6]; // player counts that divide 48 evenly

/* Balanced pick order, generalized from the original rules document:
   full rotation cycles (every player passes through every position once per cycle),
   then leftover rounds as mirror pairs (a round followed by its reverse).
   Every player ends with an identical sum of pick positions.
   For n=4, rounds=6 this reproduces the document's sequence exactly. */
function buildDraftRounds(n, rounds) {
  const rot = (k) => Array.from({ length: n }, (_, i) => (i + k) % n);
  let cycles = Math.floor(rounds / n);
  while (cycles > 0 && (rounds - cycles * n) % 2 === 1) cycles--;
  const out = [];
  for (let c = 0; c < cycles; c++)
    for (let j = 0; j < n; j++) out.push(rot(j === 0 ? 0 : n - j));
  let k = n - 2;
  while (out.length < rounds) {
    const base = rot(((k % n) + n) % n);
    k--;
    out.push(base);
    if (out.length < rounds) out.push([...base].reverse());
  }
  return out;
}
/* ================= LIVE STORAGE (Firebase Realtime Database) ================= */

const LP = (lid) => ({
  config: `leagues/${lid}/config`,
  results: `leagues/${lid}/results`,
  liveMeta: `leagues/${lid}/liveMeta/g`,
  liveSync: `leagues/${lid}/liveSync`,
  bets: `leagues/${lid}/bets`,
  bet: (pid) => `leagues/${lid}/bets/${pid}`,
});
const ME_KEY = (lid) => `wc26me:${lid}`;
const newLeagueId = () =>
  Math.random().toString(36).slice(2, 8) + Math.random().toString(36).slice(2, 4);

/* RTDB prunes empty objects/arrays and nulls — normalize everything on read */
const normConfig = (c) =>
  !c
    ? null
    : {
      name: c.name || "ליגת החברים",
      players: c.players || [],
      assign: c.assign || {},
      draft: c.draft
        ? {
          order: c.draft.order || [],
          perPlayer: c.draft.perPlayer || 0,
          picks: c.draft.picks || [],
          active: !!c.draft.active,
        }
        : null,
      locks: {
        bracket: !!(c.locks?.bracket),
        groups: !!(c.locks?.groups),
        ko: c.locks?.ko || {},
      },
      ai: {
        enabled: !!(c.ai?.enabled),
        workerUrl: resolveAiWorkerUrl(c.ai?.workerUrl),
      },
      created: c.created || 0,
    };
const normResults = (r) => ({ g: (r && r.g) || {}, ko: (r && r.ko) || {} });
const normBets = (b) => ({
  g: (b && b.g) || {},
  ko: (b && b.ko) || {},
  br: Object.fromEntries(TIERS.map((t) => [t.k, (b && b.br && b.br[t.k]) || []])),
});

/* ================= SCORING ENGINE ================= */

function computeScores(config, results, betsAll) {
  const players = config?.players || [];
  const assign = config?.assign || {};
  const gRes = results?.g || {};
  const koArr = buildKnockoutSchedule(results);

  // teams that actually reached each stage: playing in a round means you reached it,
  // winning a round means you reached the next one
  const reach = { r32: new Set(), r16: new Set(), qf: new Set(), sf: new Set(), fin: new Set(), win: new Set() };
  const PART_TIER = { r32: "r32", r16: "r16", qf: "qf", sf: "sf", p3: "sf", f: "fin" };
  koArr.forEach((m) => {
    const pt = PART_TIER[m.round];
    if (pt) { if (m.t1) reach[pt].add(m.t1); if (m.t2) reach[pt].add(m.t2); }
    const tier = ROUND_TO_TIER[m.round];
    if (m.w && tier) reach[tier].add(m.w);
  });

  const rows = players.map((p) => {
    const my = betsAll[p.id] || EMPTY_BETS;
    const myTeams = Object.keys(assign).filter((t) => assign[t] === p.id);
    const breakdown = createScoreBreakdownRow(p);

    // ---- part 1: draft ----
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
      (breakdown.byType.draftKoExtraLoss || 0);

    // ---- part 2a: group-stage match bets ----
    Object.entries(gRes).forEach(([id, r]) => {
      recordGroupBetPoints(breakdown, { fixtureId: id, bet: my.g && my.g[id], result: r });
    });
    const mGroup = breakdown.byType.matchGroup || 0;

    // ---- part 2b: knockout bets ----
    koArr.forEach((m) => {
      recordKoBetPoints(breakdown, { match: m, bet: my.ko && my.ko[m.id] });
    });
    const mKo = (breakdown.byType.matchKoWinner || 0) + (breakdown.byType.matchKoMethod || 0);

    // ---- part 3: bracket predictions (cumulative by construction) ----
    const tierHits = {};
    TIERS.forEach((tier) => {
      const picks = (my.br && my.br[tier.k]) || [];
      tierHits[tier.k] = recordBracketPoints(breakdown, { tier, picks, reached: reach[tier.k] });
    });
    const bracket = Object.entries(breakdown.byType)
      .filter(([type]) => type.startsWith("bracket"))
      .reduce((sum, [, points]) => sum + points, 0);
    const breakdownSummary = summarizeScoreBreakdown(breakdown);

    return {
      p, myTeams, draft, mGroup, mKo,
      matches: mGroup + mKo, bracket, tierHits,
      breakdown: breakdownSummary,
      total: draft + mGroup + mKo + bracket,
    };
  });

  rows.sort((a, b) => b.total - a.total || a.p.name.localeCompare(b.p.name, "he"));
  return { rows, reach };
}

/* ================= SMALL UI PIECES ================= */

const Flag = ({ code, lg }) => {
  const fl = FLAGS[code];
  if (!fl) return <span className={lg ? "text-xl" : "text-base"}>{T[code]?.[1] || "🏳️"}</span>;
  return (
    <svg
      width={lg ? 27 : 17} height={lg ? 18 : 11.5} viewBox="0 0 30 20"
      role="img" aria-label={T[code]?.[0]} preserveAspectRatio="none"
      className="inline-block shrink-0 rounded-sm"
      style={{ boxShadow: "0 0 0 1px rgba(148,163,184,.35)" }}
    >
      {fl.map((s, i) =>
        s[0] === "r" ? <rect key={i} x={s[1]} y={s[2]} width={s[3]} height={s[4]} fill={s[5]} /> :
          s[0] === "c" ? <circle key={i} cx={s[1]} cy={s[2]} r={s[3]} fill={s[4]} /> :
            s[0] === "p" ? <polygon key={i} points={s[1]} fill={s[2]} /> :
              s[0] === "l" ? <line key={i} x1={s[1]} y1={s[2]} x2={s[3]} y2={s[4]} stroke={s[5]} strokeWidth={s[6]} /> :
                s[0] === "d" ? <path key={i} d={s[1]} fill={s[2]} /> : null
      )}
    </svg>
  );
};
const TName = ({ code }) => {
  const { teamName } = useLocale();
  return <span>{teamName(code, T[code]?.[0] || code)}</span>;
};

const HOST_TEAMS = ["USA", "CAN", "MEX"];
const BRAND_ICON_SRC = `${import.meta.env.BASE_URL || "/"}icon-192.png`;

function HostFlags({ className = "" }) {
  return (
    <span dir="ltr" className={"inline-flex items-center gap-1.5 align-middle " + className} aria-label="USA, Canada, Mexico">
      {HOST_TEAMS.map((code) => (
        <span key={code} className="inline-flex items-center gap-1.5 rounded-full border border-slate-700 bg-slate-950/70 px-2.5 py-1 text-[11px] font-black text-slate-200">
          <Flag code={code} lg />
          <span dir="ltr">{code}</span>
        </span>
      ))}
    </span>
  );
}

function HostMark() {
  const [imageOk, setImageOk] = useState(true);
  return (
    <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-slate-700 bg-slate-950/80 p-1 shadow-lg">
      {imageOk ? (
        <img
          src={BRAND_ICON_SRC}
          alt=""
          className="h-full w-full rounded-xl object-cover"
          onError={() => setImageOk(false)}
        />
      ) : (
        <div className="flex flex-col gap-0.5" aria-hidden="true">
          {HOST_TEAMS.map((code) => <Flag key={code} code={code} />)}
        </div>
      )}
    </div>
  );
}

function LiveMatchPills({ matches, className = "" }) {
  const { t } = useLocale();
  if (!matches.length) return null;

  return (
    <div
      className={"gap-1.5 " + className}
      role="status"
      aria-live="polite"
      aria-label={t("liveMatches")}
    >
      {matches.map((match) => (
        <div
          key={match.id}
          className="flex shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-full border border-emerald-800 bg-emerald-950/85 px-2.5 py-1 text-[10px] shadow-sm shadow-emerald-950"
        >
          <span className="flex items-center gap-1 font-black text-emerald-300">
            <span className="h-1.5 w-1.5 rounded-full bg-red-500 shadow-sm shadow-red-500" />
            {match.displayClock ? `${t("statusLive")} · ${match.displayClock}` : t("statusLive")}
          </span>
          <span className="flex items-center gap-1 text-slate-200">
            <Flag code={match.t1} />
            <TName code={match.t1} />
          </span>
          <strong dir="ltr" className="text-sm text-white">{match.score}</strong>
          <span className="flex items-center gap-1 text-slate-200">
            <TName code={match.t2} />
            <Flag code={match.t2} />
          </span>
        </div>
      ))}
    </div>
  );
}

function TeamChip({ code, on, off, onClick, disabled, mark, eliminated = false }) {
  const stateClass = eliminated
    ? on
      ? "border-rose-500 bg-rose-500 bg-opacity-15 text-rose-100"
      : "border-rose-800 bg-rose-950 bg-opacity-40 text-rose-300 hover:border-rose-600"
    : on
      ? "border-sky-400 bg-sky-500 bg-opacity-20 text-sky-200"
      : off
        ? "border-slate-800 text-slate-600"
        : "border-slate-700 text-slate-300 hover:border-slate-500";

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={eliminated ? "הודחה - לא יכולה לצבור עוד נקודות" : undefined}
      className={
        "flex items-center gap-1 rounded-full border px-2 py-1 text-xs transition-colors " +
        stateClass +
        (disabled ? " cursor-default" : "")
      }
    >
      <Flag code={code} />
      <TName code={code} />
      {eliminated && <ShieldX size={12} className="text-rose-300" />}
      {mark === "hit" && <Check size={12} className="text-emerald-400" />}
      {mark === "miss" && <X size={12} className="text-rose-400" />}
    </button>
  );
}

function Section({ title, sub, children, defaultOpen = false, badge }) {
  const [open, setOpen] = useState(defaultOpen);
  useEffect(() => {
    if (defaultOpen) setOpen(true);
  }, [defaultOpen]);
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900">
      <button onClick={() => setOpen(!open)} className="flex w-full items-center justify-between px-4 py-3 text-right">
        <div className="flex items-center gap-2">
          <span className="font-bold text-slate-100">{title}</span>
          {badge != null && (
            <span className="rounded-full bg-slate-800 px-2 py-0.5 font-mono text-xs text-slate-300">{badge}</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {sub && <span className="text-xs text-slate-500">{sub}</span>}
          <ChevronDown size={16} className={"text-slate-500 transition-transform " + (open ? "rotate-180" : "")} />
        </div>
      </button>
      {open && <div className="border-t border-slate-800 px-4 py-3">{children}</div>}
    </div>
  );
}

/* exact-score entry: commits "a-b" when both goals are set, null when both cleared.
   legacy outcome-only values ("1"|"X"|"2") are shown as a small badge until a score is typed. */
function ScoreCell({ value, locked, onCommit }) {
  const sc = scoreOf(value);
  const legacy = value && !sc ? value : null;
  const [a, setA] = useState(sc ? String(sc[0]) : "");
  const [b, setB] = useState(sc ? String(sc[1]) : "");
  useEffect(() => {
    const s = scoreOf(value);
    setA(s ? String(s[0]) : "");
    setB(s ? String(s[1]) : "");
  }, [value]);
  const push = (na, nb) => {
    setA(na); setB(nb);
    if (na !== "" && nb !== "") onCommit(`${+na}-${+nb}`);
    else if (value != null) onCommit(null);
  };
  const cls =
    "w-8 rounded-lg border bg-slate-950 py-1 text-center font-mono text-xs outline-none " +
    (locked
      ? "border-emerald-600 text-emerald-300"
      : "border-slate-700 text-slate-100 focus:border-sky-500");
  const clean = (v) => v.replace(/\D/g, "").slice(0, 2);
  return (
    <span className="flex shrink-0 items-center gap-1" dir="rtl">
      <input inputMode="numeric" placeholder="·" disabled={locked} value={a}
        onChange={(e) => push(clean(e.target.value), b)} className={cls} />
      <span className="text-xs text-slate-600">:</span>
      <input inputMode="numeric" placeholder="·" disabled={locked} value={b}
        onChange={(e) => push(a, clean(e.target.value))} className={cls} />
      {legacy && (
        <span className={"rounded border px-1 font-mono text-xs " + (locked ? "border-emerald-700 text-emerald-300" : "border-slate-700 text-slate-400")}>
          {legacy}
        </span>
      )}
    </span>
  );
}

function PlayerDot({ player, idx }) {
  return (
    <span
      className={
        "inline-flex h-5 w-5 items-center justify-center rounded-full text-xs font-bold text-slate-950 " +
        COLORS[idx % COLORS.length]
      }
      title={player?.name}
    >
      {(player?.name || "?").slice(0, 1)}
    </span>
  );
}

const SaveBar = ({ show, onSave, saving }) =>
  !show ? null : (
    <div className="sticky bottom-3 z-20 mt-4 flex items-center justify-between rounded-2xl border border-amber-500 bg-slate-900 px-4 py-3 shadow-lg">
      <span className="text-sm text-amber-300">יש שינויים שלא נשמרו</span>
      <button
        onClick={onSave}
        disabled={saving}
        className="rounded-xl bg-amber-400 px-4 py-1.5 text-sm font-bold text-slate-950 hover:bg-amber-300 disabled:opacity-50"
      >
        {saving ? "שומר…" : "שמור הימורים"}
      </button>
    </div>
  );

/* ================= SETUP & IDENTITY ================= */

function SetupScreen({ onCreate }) {
  const { t } = useLocale();
  const [names, setNames] = useState(["", "", "", ""]);
  const [leagueName, setLeagueName] = useState(() => t("defaultLeague"));
  const [busy, setBusy] = useState(false);
  const valid = names.map((n) => n.trim()).filter(Boolean);

  return (
    <div className="mx-auto max-w-md py-8">
      <Card className="p-5">
        <h2 className="mb-1 text-lg font-black text-slate-100">{t("setupTitle")}</h2>
        <p className="mb-4 text-sm leading-6 text-slate-400">{t("setupCopy")}</p>
        <label className="mb-1 block text-xs text-slate-500">{t("setupLeagueName")}</label>
        <input
          value={leagueName}
          onChange={(e) => setLeagueName(e.target.value)}
          className="mb-4 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-sky-500"
        />
        <label className="mb-1 block text-xs text-slate-500">{t("setupPlayers")}</label>
        <div className="flex flex-col gap-2">
          {names.map((n, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                value={n}
                placeholder={t("setupPlayerPlaceholder", { n: i + 1 })}
                onChange={(e) => setNames(names.map((x, j) => (j === i ? e.target.value : x)))}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-sky-500"
              />
              {names.length > 2 && (
                <button onClick={() => setNames(names.filter((_, j) => j !== i))} className="text-slate-600 hover:text-rose-400">
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          ))}
        </div>
        <button
          onClick={() => setNames([...names, ""])}
          className="mt-2 flex items-center gap-1 text-sm text-sky-400 hover:text-sky-300"
        >
          <Plus size={14} /> {t("setupAddPlayer")}
        </button>
        <Button
          disabled={valid.length < 2 || busy}
          onClick={async () => {
            setBusy(true);
            await onCreate(leagueName.trim() || t("defaultLeague"), valid);
            setBusy(false);
          }}
          block
          className="mt-5"
        >
          {busy ? t("setupBusy") : t("setupSubmit")}
        </Button>
        <p className="mt-3 text-center text-xs text-slate-500">
          {t("setupExisting")}
        </p>
      </Card>
    </div>
  );
}

function IdentityScreen({ players, onPick }) {
  const { t } = useLocale();
  return (
    <div className="mx-auto max-w-md py-10 text-center">
      <h2 className="mb-1 text-lg font-black text-slate-100">{t("identityTitle")}</h2>
      <p className="mb-5 text-sm text-slate-400">{t("identityCopy")}</p>
      <div className="flex flex-col gap-2">
        {players.map((p, i) => (
          <button
            key={p.id}
            onClick={() => onPick(p.id)}
            className="flex items-center justify-center gap-2 rounded-2xl border border-slate-700 bg-slate-900 py-3 font-bold text-slate-100 hover:border-sky-500"
          >
            <PlayerDot player={p} idx={i} /> {p.name}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ================= LEADERBOARD ================= */

function Leaderboard({ config, scores, meId, eliminatedTeams }) {
  const { t } = useLocale();
  const [openId, setOpenId] = useState(null);
  const locked = config?.locks?.bracket;
  const maxTotal = Math.max(1, ...scores.rows.map((row) => row.total || 0));
  return (
    <div className="flex flex-col gap-2">
      <div className="grid grid-cols-[minmax(0,1.7fr)_repeat(4,minmax(54px,.7fr))] gap-2 px-3 text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">
        <div>{t("lbPlayer")}</div>
        <div className="text-center">{t("lbDraft")}</div>
        <div className="text-center">{t("lbMatches")}</div>
        <div className="text-center">{t("lbBracket")}</div>
        <div className="text-center">{t("lbTotal")}</div>
      </div>
      {scores.rows.map((r, rank) => {
        const pIdx = config.players.findIndex((x) => x.id === r.p.id);
        const isMe = r.p.id === meId;
        const open = openId === r.p.id;
        const leader = rank === 0 && r.total > 0;
        const pct = Math.max(4, Math.round(((r.total || 0) / maxTotal) * 100));
        return (
          <Card key={r.p.id} leader={leader} interactive className="overflow-hidden">
            <button onClick={() => setOpenId(open ? null : r.p.id)} className="grid w-full grid-cols-[minmax(0,1.7fr)_repeat(4,minmax(54px,.7fr))] items-center gap-2 px-3 py-3 text-start">
              <div className="flex min-w-0 items-center gap-2 overflow-hidden">
                <span className={"w-5 shrink-0 font-mono text-xs " + (leader ? "text-amber-300" : "text-slate-500")}>{rank + 1}</span>
                <PlayerDot player={r.p} idx={pIdx} />
                <span className="truncate text-sm font-bold text-slate-100">{r.p.name}</span>
                {isMe && <span className="rounded-full bg-slate-800 px-2 py-0.5 text-xs font-bold text-sky-300">{t("lbMe")}</span>}
              </div>
              <div className="text-center font-mono text-sm text-slate-300">{r.draft}</div>
              <div className="text-center font-mono text-sm text-slate-300">{r.matches}</div>
              <div className="text-center font-mono text-sm text-slate-300">{r.bracket}</div>
              <div>
                <div className={"text-center font-mono text-lg font-black " + (leader ? "text-amber-300" : "text-slate-100")}>
                  {r.total}
                </div>
                <div className="score-meter mt-1" aria-hidden="true">
                  <span style={{ width: `${pct}%` }} />
                </div>
              </div>
            </button>
            {open && (
              <div className="border-t border-slate-800 px-3 py-3 text-sm">
                <div className="mb-1 text-xs text-slate-500">{t("lbDraftTeams")}</div>
                <div className="flex flex-wrap gap-1.5">
                  {r.myTeams.length === 0 && <span className="text-xs text-slate-600">{t("lbNoDraftTeams")}</span>}
                  {r.myTeams.map((teamCode) => (
                    <span
                      key={teamCode}
                      title={eliminatedTeams?.has(teamCode) ? t("statusEliminated") : undefined}
                      className={
                        "flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs " +
                        (eliminatedTeams?.has(teamCode)
                          ? "border-rose-800 bg-rose-950 bg-opacity-40 text-rose-300"
                          : "border-slate-700 text-slate-300")
                      }
                    >
                      <Flag code={teamCode} /><TName code={teamCode} />
                      {eliminatedTeams?.has(teamCode) && <ShieldX size={12} className="text-rose-300" />}
                    </span>
                  ))}
                </div>
                {locked && (
                  <div className="mt-3 text-xs text-slate-400">
                    <span className="text-slate-500">{t("lbChampionPick")} </span>
                    {r.p.id && (config && true) ? <BracketPeek pid={r.p.id} /> : null}
                  </div>
                )}
                <ScoreBreakdownDetails row={r} />
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
}

function TeamStatusBadge({ row }) {
  const { t } = useLocale();
  if (row.eliminated) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-rose-800 bg-rose-950 bg-opacity-50 px-2 py-0.5 text-[11px] font-bold text-rose-300">
        <ShieldX size={11} /> {t("statusEliminated")}
      </span>
    );
  }
  if (!row.canScoreMore) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-amber-700 bg-amber-950 bg-opacity-40 px-2 py-0.5 text-[11px] font-bold text-amber-300">
        <Check size={11} /> {t("statusFinal")}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-emerald-800 bg-emerald-950 bg-opacity-40 px-2 py-0.5 text-[11px] font-bold text-emerald-300">
      <Check size={11} /> {t("statusActive")}
    </span>
  );
}

function TeamsTab({ config, rows }) {
  const { t } = useLocale();
  const playerIndex = (id) => config.players.findIndex((player) => player.id === id);
  const activeCount = rows.filter((row) => row.canScoreMore).length;
  const eliminatedCount = rows.filter((row) => row.eliminated).length;

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-3 gap-2">
        <StatCard label={t("teamsActive")} value={activeCount} tone="emerald" className="p-3" />
        <StatCard label={t("teamsEliminated")} value={eliminatedCount} tone="rose" className="p-3" />
        <StatCard label={t("teamsTotal")} value={rows.length} tone="sky" className="p-3" />
      </div>

      <div className="grid grid-cols-12 px-3 text-[11px] font-bold text-slate-500">
        <div className="col-span-1">#</div>
        <div className="col-span-5">{t("teamsTeam")}</div>
        <div className="col-span-3">{t("teamsOwner")}</div>
        <div className="col-span-1 text-center">{t("teamsGroup")}</div>
        <div className="col-span-2 text-end">{t("teamsPoints")}</div>
      </div>

      <div className="flex flex-col gap-1.5">
        {rows.map((row, rank) => {
          const ownerIdx = row.ownerId ? playerIndex(row.ownerId) : -1;
          return (
            <div
              key={row.team}
              className={
                "grid grid-cols-12 items-center gap-2 rounded-2xl border px-3 py-2.5 " +
                (row.eliminated
                  ? "border-rose-900 bg-rose-950 bg-opacity-25"
                  : !row.canScoreMore
                    ? "border-amber-900 bg-amber-950 bg-opacity-20"
                    : "border-slate-800 bg-slate-900")
              }
            >
              <div className={"col-span-1 font-mono text-xs " + (rank === 0 && row.points > 0 ? "text-amber-300" : "text-slate-500")}>
                {rank + 1}
              </div>
              <div className="col-span-5 flex min-w-0 items-center gap-1.5">
                <Flag code={row.team} />
                <span className={"truncate text-sm font-bold " + (row.eliminated ? "text-rose-200" : "text-slate-100")}>
                  <TName code={row.team} />
                </span>
                {row.eliminated && <ShieldX size={13} className="shrink-0 text-rose-300" />}
                <span className="hidden shrink-0 sm:inline-flex">
                  <TeamStatusBadge row={row} />
                </span>
              </div>
              <div className="col-span-3 flex min-w-0 items-center gap-1.5 text-xs text-slate-300">
                {row.ownerId && ownerIdx >= 0 ? (
                  <>
                    <PlayerDot player={config.players[ownerIdx]} idx={ownerIdx} />
                    <span className="truncate">{row.ownerName}</span>
                  </>
                ) : (
                  <span className="truncate text-slate-600">{t("teamsUnassigned")}</span>
                )}
              </div>
              <div className="col-span-1 text-center font-mono text-xs text-slate-500">{row.group}</div>
              <div className={"col-span-2 text-end font-mono text-base font-black " + (row.eliminated ? "text-rose-200" : "text-slate-100")}>
                {fmtPts(row.points)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ScoreBreakdownDetails({ row }) {
  const { t } = useLocale();
  const [mode, setMode] = useState("type");
  const typeRows = row.breakdown?.typeRows || [];
  const teamRows = row.breakdown?.teamRows || [];
  const rows = mode === "team" ? teamRows : typeRows;

  return (
    <div className="mt-3 rounded-xl border border-slate-800 bg-slate-950 p-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <div>
          <div className="text-xs font-bold text-slate-300">{t("scoreBreakdown")}</div>
          <div className="text-[11px] text-slate-500">{t("scoreBreakdownMeta", { group: row.mGroup, ko: row.mKo })}</div>
        </div>
        <div className="flex rounded-full border border-slate-800 bg-slate-900 p-0.5 text-[11px]">
          <button
            type="button"
            onClick={() => setMode("type")}
            className={"rounded-full px-2 py-1 " + (mode === "type" ? "bg-sky-500 text-white" : "text-slate-400")}
          >
            {t("byType")}
          </button>
          <button
            type="button"
            onClick={() => setMode("team")}
            className={"rounded-full px-2 py-1 " + (mode === "team" ? "bg-sky-500 text-white" : "text-slate-400")}
          >
            {t("byTeam")}
          </button>
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="text-xs text-slate-600">{t("noBreakdown")}</div>
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

export default function App() {
  return (
    <LocaleProvider>
      <AppContent />
    </LocaleProvider>
  );
}

// peeks at another player's champion pick (only rendered after bracket lock)
const BracketPeekCtx = React.createContext({});
function BracketPeek({ pid }) {
  const betsAll = React.useContext(BracketPeekCtx);
  const w = betsAll?.[pid]?.br?.win?.[0];
  if (!w) return <span className="text-slate-600">—</span>;
  return (
    <span className="inline-flex items-center gap-1 text-slate-200">
      <Flag code={w} /><TName code={w} />
    </span>
  );
}

/* ================= MY BETS: BRACKET ================= */

function BracketEditor({ draft, setDraft, locked, reach, hasAnyBracketReach, eliminatedTeams = new Set() }) {
  const toggle = (tierIdx, team) => {
    if (locked) return;
    setDraft((prev) => {
      const br = { ...(prev.br || {}) };
      const tier = TIERS[tierIdx];
      const cur = br[tier.k] || [];
      if (cur.includes(team)) {
        for (let j = tierIdx; j < TIERS.length; j++) {
          br[TIERS[j].k] = (br[TIERS[j].k] || []).filter((x) => x !== team);
        }
      } else {
        if (cur.length >= tier.size) return prev;
        br[tier.k] = [...cur, team];
      }
      return { ...prev, br };
    });
  };

  const br = draft.br || EMPTY_BETS.br;

  return (
    <div className="flex flex-col gap-3">
      {!locked && (
        <p className="text-xs text-slate-400">
          בוחרים מהשלב הרחב אל הצר — כל שלב נבחר רק מתוך הבחירות של השלב הקודם, ולכן הניקוד מצטבר אוטומטית.
        </p>
      )}
      {TIERS.map((tier, ti) => {
        const picks = br[tier.k] || [];
        const pool = ti === 0 ? null : Array.from(new Set([...(br[TIERS[ti - 1].k] || []), ...picks]));
        return (
          <div key={tier.k} className="rounded-xl border border-slate-800 bg-slate-950 p-3">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-bold text-slate-200">
                {tier.n} <span className="text-xs font-normal text-slate-500">({tier.pts} נק׳ לפגיעה)</span>
              </span>
              <span className={"font-mono text-xs " + (picks.length === tier.size ? "text-emerald-400" : "text-slate-500")}>
                {picks.length}/{tier.size}
              </span>
            </div>
            {ti === 0 ? (
              <div className="flex flex-col gap-2">
                {GROUP_KEYS.map((g) => (
                  <div key={g} className="flex flex-wrap items-center gap-1.5">
                    <span className="w-5 font-mono text-xs text-slate-600">{g}</span>
                    {GROUPS[g].map((t) => (
                      <TeamChip
                        key={t} code={t}
                        on={picks.includes(t)}
                        disabled={locked}
                        onClick={() => toggle(ti, t)}
                        eliminated={eliminatedTeams.has(t)}
                        mark={hasAnyBracketReach && picks.includes(t) ? (reach[tier.k].has(t) ? "hit" : undefined) : undefined}
                      />
                    ))}
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {(pool.length === 0) && <span className="text-xs text-slate-600">קודם בחרו בשלב הקודם</span>}
                {pool.map((t) => (
                  <TeamChip
                    key={t} code={t}
                    on={picks.includes(t)}
                    disabled={locked}
                    onClick={() => toggle(ti, t)}
                    eliminated={eliminatedTeams.has(t)}
                    mark={picks.includes(t) && reach[tier.k].has(t) ? "hit" : undefined}
                  />
                ))}
              </div>
            )}
          </div>
        );
      })}
      {locked && (
        <p className="flex items-center gap-1 text-xs text-slate-500">
          <Lock size={12} /> ניחושי העולות נעולים — ✓ ירוק מסמן פגיעה שכבר אושרה בתוצאות
        </p>
      )}
    </div>
  );
}

/* ================= MY BETS: GROUP STAGE ================= */

function MatchBetRow({ fix, res, pick, onPick, others, locked }) {
  const done = !!res || !!locked;
  const resOut = outcomeOf(res);
  const sc = scoreOf(res);
  const Opt = ({ val, label }) => {
    const selected = pick === val;
    const isResult = done && resOut === val;
    return (
      <button
        onClick={() => !done && onPick(selected ? null : val)}
        disabled={done}
        className={
          "min-w-0 flex-1 truncate rounded-lg border px-1 py-1.5 text-xs transition-colors " +
          (isResult
            ? "border-emerald-500 bg-emerald-500 bg-opacity-20 text-emerald-300"
            : selected
              ? "border-sky-400 bg-sky-500 bg-opacity-20 text-sky-200"
              : "border-slate-700 text-slate-400" + (done ? "" : " hover:border-slate-500"))
        }
      >
        {label}
      </button>
    );
  };
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950 p-2">
      <div className="mb-1.5 flex items-center justify-between text-sm text-slate-200">
        <span className="flex items-center gap-1.5 font-medium"><Flag code={fix.t1} /><TName code={fix.t1} /></span>
        {sc ? (
          <span className="flex items-center gap-1 px-2 font-mono text-sm font-bold text-emerald-300" dir="rtl">
            <span>{sc[0]}</span><span className="text-slate-600">:</span><span>{sc[1]}</span>
          </span>
        ) : (
          <span className="px-2 text-xs text-slate-600">נגד</span>
        )}
        <span className="flex items-center gap-1.5 font-medium"><TName code={fix.t2} /><Flag code={fix.t2} /></span>
      </div>
      <div className="flex items-center gap-1.5">
        <Opt val="1" label={"נצחון " + (T[fix.t1]?.[0] || "")} />
        <Opt val="X" label="תיקו" />
        <Opt val="2" label={"נצחון " + (T[fix.t2]?.[0] || "")} />
        {done && (
          pick ? (pick === resOut
            ? <Check size={18} className="shrink-0 text-emerald-400" />
            : <X size={18} className="shrink-0 text-rose-400" />)
            : <span className="shrink-0 text-xs text-slate-600">לא הימרת</span>
        )}
      </div>
      {done && others && others.length > 0 && (
        <div className="mt-1.5 flex flex-wrap gap-x-2 text-xs text-slate-500">
          {others.map((o) => (
            <span key={o.name} className={o.hit ? "text-emerald-400" : "text-slate-600"}>
              {o.name} {o.hit ? "✓" : "✗"}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function GroupBets({ draft, setDraft, results, othersFor, locked }) {
  return (
    <div className="flex flex-col gap-2">
      {GROUP_KEYS.map((g) => {
        const fixes = groupFixtures(g);
        const myCount = fixes.filter((f) => draft.g && draft.g[f.id]).length;
        const doneCount = fixes.filter((f) => results.g && results.g[f.id]).length;
        return (
          <Section key={g} title={"בית " + g} badge={`${myCount}/6 הימורים`} sub={doneCount ? `${doneCount}/6 שוחקו` : undefined}>
            <div className="flex flex-col gap-2">
              {fixes.map((f) => (
                <MatchBetRow
                  key={f.id}
                  fix={f}
                  res={results.g && results.g[f.id]}
                  pick={draft.g && draft.g[f.id]}
                  onPick={(v) =>
                    setDraft((prev) => {
                      const ng = { ...(prev.g || {}) };
                      if (v) ng[f.id] = v; else delete ng[f.id];
                      return { ...prev, g: ng };
                    })
                  }
                  others={othersFor(f.id)}
                  locked={locked}
                />
              ))}
            </div>
          </Section>
        );
      })}
    </div>
  );
}

/* ================= MY BETS: KNOCKOUT ================= */

function KoBets({ draft, setDraft, results, othersForKo, koLocks }) {
  const koByRound = useMemo(() => {
    const map = {};
    buildBettableKnockoutSchedule(results).forEach((match) => {
      (map[match.round] = map[match.round] || []).push(match);
    });
    Object.values(map).forEach((arr) =>
      arr.sort((a, b) => (a.matchNo || 999) - (b.matchNo || 999) || a.id.localeCompare(b.id))
    );
    return map;
  }, [results]);

  const anyMatches = Object.values(koByRound).some((matches) => matches.length > 0);

  if (!anyMatches)
    return (
      <div className="rounded-xl border border-dashed border-slate-700 p-4 text-center text-sm text-slate-500">
        עדיין אין משחקי נוקאאוט מוכנים להימור. ברגע שהעולות או מנצחות הסיבוב ייקבעו, המשחקים יופיעו כאן אוטומטית.
      </div>
    );

  return (
    <div className="flex flex-col gap-2">
      {KO_ROUNDS.filter((r) => koByRound[r.k]).map((r) => {
        const roundLocked = !!(koLocks && koLocks[r.k]);
        return (
          <Section key={r.k} title={r.n} defaultOpen badge={koByRound[r.k].length + " משחקים"} sub={roundLocked ? "נעול 🔒" : undefined}>
            <div className="flex flex-col gap-2">
              {koByRound[r.k].map((m) => {
                const b = (draft.ko || {})[m.id] || {};
                const done = !!m.w || roundLocked;
                const canBet = !!(m.t1 && m.t2);
                const setB = (patch) =>
                  setDraft((prev) => {
                    if (!canBet || done) return prev;
                    const nko = { ...(prev.ko || {}) };
                    const cur = { ...(nko[m.id] || {}), ...patch };
                    if (!cur.t && !cur.p) delete nko[m.id]; else nko[m.id] = cur;
                    return { ...prev, ko: nko };
                  });
                const TeamBtn = ({ competitor }) => {
                  const t = competitor.team;
                  return (
                  <button
                    disabled={done || !t}
                    onClick={() => setB({ t: b.t === t ? null : t })}
                    className={
                      "flex flex-1 items-center justify-center gap-1.5 truncate rounded-lg border px-2 py-1.5 text-xs " +
                      (!t
                        ? "cursor-default border-slate-800 text-slate-500"
                        : done && m.w === t
                        ? "border-emerald-500 bg-emerald-500 bg-opacity-20 text-emerald-300"
                        : b.t === t
                          ? "border-sky-400 bg-sky-500 bg-opacity-20 text-sky-200"
                          : "border-slate-700 text-slate-300" + (done ? "" : " hover:border-slate-500"))
                    }
                  >
                    <CompetitorName competitor={competitor} />
                  </button>
                  );
                };
                const PerBtn = ({ v, label }) => (
                  <button
                    disabled={done || !canBet}
                    onClick={() => setB({ p: b.p === v ? null : v })}
                    className={
                      "flex-1 rounded-lg border px-2 py-1 text-xs " +
                      (done && m.p === v && m.w
                        ? "border-emerald-600 text-emerald-300"
                        : b.p === v
                          ? "border-sky-400 bg-sky-500 bg-opacity-20 text-sky-200"
                          : "border-slate-700 text-slate-400" + (done ? "" : " hover:border-slate-500"))
                    }
                  >
                    {label}
                  </button>
                );
                let earned = null;
                if (done && b.t) earned = b.t === m.w ? (m.p && b.p === m.p ? 2 : 1) : 0;
                return (
                  <div key={m.id} className="rounded-xl border border-slate-800 bg-slate-950 p-2">
                    <div className="flex items-center gap-1.5">
                      <TeamBtn competitor={m.a} />
                      <span className="text-xs text-slate-600">נגד</span>
                      <TeamBtn competitor={m.b} />
                    </div>
                    <div className="mt-1.5 flex items-center gap-1.5">
                      <span className="text-xs text-slate-500">עולה:</span>
                      <PerBtn v="90" label="ב־90 דק׳" />
                      <PerBtn v="et" label="הארכה/פנדלים" />
                      {earned != null && (
                        <span className={"shrink-0 font-mono text-sm font-bold " + (earned > 0 ? "text-emerald-400" : "text-rose-400")}>
                          +{earned}
                        </span>
                      )}
                    </div>
                    {done && othersForKo(m).length > 0 && (
                      <div className="mt-1.5 flex flex-wrap gap-x-2 text-xs">
                        {othersForKo(m).map((o) => (
                          <span key={o.name} className={o.pts > 0 ? "text-emerald-400" : "text-slate-600"}>
                            {o.name} +{o.pts}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </Section>
        );
      })}
    </div>
  );
}

/* ================= MY BETS (wrapper) ================= */

function MyBets({ me, config, results, betsAll, reach, eliminatedTeams, onSaveBets }) {
  const saved = betsAll[me] || EMPTY_BETS;
  const [draftState, setDraftState] = useState(() => ({ playerId: me, saved, draft: saved }));
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    setDraftState((current) => syncBetsDraft(current, me, saved));
  }, [me, saved]);

  const draft = draftState.draft;
  const setDraft = (update) =>
    setDraftState((current) => ({
      ...current,
      draft: typeof update === "function" ? update(current.draft) : update,
    }));

  const dirty = JSON.stringify(draft) !== JSON.stringify(saved);
  const locked = !!config?.locks?.bracket;
  const groupsLocked = !!config?.locks?.groups;
  const koLocks = config?.locks?.ko || {};
  const players = config.players;
  const bettableKoCount = useMemo(() => buildBettableKnockoutSchedule(results).length, [results]);
  const hasAnyBracketReach = Object.values(reach || {}).some((tier) => tier?.size > 0);

  const othersFor = (fid) => {
    const o = outcomeOf(results.g?.[fid]);
    if (!o) return [];
    return players
      .filter((p) => p.id !== me && betsAll[p.id]?.g?.[fid])
      .map((p) => ({ name: p.name, hit: betsAll[p.id].g[fid] === o }));
  };
  const othersForKo = (m) =>
    players
      .filter((p) => p.id !== me && betsAll[p.id]?.ko?.[m.id])
      .map((p) => {
        const b = betsAll[p.id].ko[m.id];
        return { name: p.name, pts: b.t === m.w ? (m.p && b.p === m.p ? 2 : 1) : 0 };
      });

  return (
    <div className="flex flex-col gap-3">
      <Section title="ניחושי עולות" sub={locked ? "נעול 🔒" : "לנעול לפני פתיחת הטורניר!"} defaultOpen={!locked}>
        <BracketEditor
          draft={draft}
          setDraft={setDraft}
          locked={locked}
          reach={reach}
          hasAnyBracketReach={hasAnyBracketReach}
          eliminatedTeams={eliminatedTeams}
        />
      </Section>
      <Section title="הימורי שלב הבתים" sub={groupsLocked ? "נעול 🔒" : "נק׳ אחת לכל פגיעה"}>
        <GroupBets draft={draft} setDraft={setDraft} results={results} othersFor={othersFor} locked={groupsLocked} />
      </Section>
      <Section title="הימורי נוקאאוט" sub="עולה נכונה 1 + בונוס דרך 1" defaultOpen={bettableKoCount > 0} badge={bettableKoCount || undefined}>
        <KoBets draft={draft} setDraft={setDraft} results={results} othersForKo={othersForKo} koLocks={koLocks} />
      </Section>
      <SaveBar
        show={dirty}
        saving={saving}
        onSave={async () => {
          setSaving(true);
          await onSaveBets(draft);
          setSaving(false);
        }}
      />
    </div>
  );
}

/* ================= DRAFT TAB ================= */

function DraftTab({ config, meId, onSaveConfig, onTxConfig }) {
  const players = config.players;
  const assign = config.assign || {};
  const draft = config.draft || null;
  const [editMode, setEditMode] = useState(false);
  const [editFor, setEditFor] = useState(players[0]?.id);

  // --- setup state (before draft starts) ---
  const [order, setOrder] = useState(players.map((p) => p.id));
  useEffect(() => { setOrder(players.map((p) => p.id)); }, [players.length]); // eslint-disable-line
  const nOk = DRAFT_NS.includes(players.length);
  const perPlayer = players.length > 0 ? Math.floor(48 / players.length) : 0;

  const pName = (id) => players.find((p) => p.id === id)?.name || "?";
  const pIdx = (id) => players.findIndex((p) => p.id === id);
  const taken = Object.keys(assign);

  const startDraft = () =>
    onSaveConfig({ ...config, draft: { order, perPlayer, picks: [], active: true } });

  const totalPicks = draft ? draft.order.length * draft.perPlayer : 0;
  const pickNo = draft ? draft.picks.length : 0;
  const liveRounds = useMemo(
    () => (draft ? buildDraftRounds(draft.order.length, draft.perPlayer) : null),
    [draft]
  );
  const pickerAt = (no) => {
    if (!draft || !liveRounds || no >= totalPicks) return null;
    const n = draft.order.length;
    return draft.order[liveRounds[Math.floor(no / n)][no % n]];
  };
  const currentPicker = draft && draft.active ? pickerAt(pickNo) : null;
  const nextPicker = draft && draft.active ? pickerAt(pickNo + 1) : null;

  /* picks run as RTDB transactions — two friends tapping at once can't grab
     the same team or pick out of turn; the mutator re-validates on fresh data */
  const pickTeam = (t) => {
    if (!currentPicker || assign[t]) return;
    onTxConfig((cfg) => {
      if (!cfg || !cfg.draft || !cfg.draft.active || cfg.assign[t]) return undefined;
      const n = cfg.draft.order.length;
      const total = n * cfg.draft.perPlayer;
      const no = cfg.draft.picks.length;
      if (no >= total) return undefined;
      const rounds = buildDraftRounds(n, cfg.draft.perPlayer);
      const picker = cfg.draft.order[rounds[Math.floor(no / n)][no % n]];
      const picks = [...cfg.draft.picks, { p: picker, t }];
      return {
        ...cfg,
        assign: { ...cfg.assign, [t]: picker },
        draft: { ...cfg.draft, picks, active: picks.length < total },
      };
    });
  };

  const undo = () => {
    if (!draft || draft.picks.length === 0) return;
    onTxConfig((cfg) => {
      if (!cfg || !cfg.draft || cfg.draft.picks.length === 0) return undefined;
      const last = cfg.draft.picks[cfg.draft.picks.length - 1];
      const nAssign = { ...cfg.assign };
      delete nAssign[last.t];
      return { ...cfg, assign: nAssign, draft: { ...cfg.draft, picks: cfg.draft.picks.slice(0, -1), active: true } };
    });
  };

  const manualToggle = (t) => {
    const nAssign = { ...assign };
    if (nAssign[t] === editFor) delete nAssign[t];
    else nAssign[t] = editFor;
    onSaveConfig({ ...config, assign: nAssign });
  };

  const TeamGrid = ({ onTeam, highlightFree }) => (
    <div className="flex flex-col gap-2">
      {GROUP_KEYS.map((g) => (
        <div key={g} className="flex flex-wrap items-center gap-1.5">
          <span className="w-5 font-mono text-xs text-slate-600">{g}</span>
          {GROUPS[g].map((t) => {
            const owner = assign[t];
            return (
              <button
                key={t}
                onClick={() => onTeam(t)}
                className={
                  "flex items-center gap-1 rounded-full border px-2 py-1 text-xs " +
                  (owner
                    ? "border-slate-800 bg-slate-900 text-slate-400"
                    : highlightFree
                      ? "border-emerald-600 text-slate-200 hover:bg-emerald-500 hover:bg-opacity-10"
                      : "border-slate-700 text-slate-300 hover:border-slate-500")
                }
              >
                <Flag code={t} /><TName code={t} />
                {owner && <PlayerDot player={players[pIdx(owner)]} idx={pIdx(owner)} />}
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );

  // ---------- render ----------
  if (editMode)
    return (
      <div className="flex flex-col gap-3">
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
          <div className="mb-2 flex items-center justify-between">
            <span className="font-bold text-slate-100">שיבוץ ידני</span>
            <button onClick={() => setEditMode(false)} className="text-xs text-sky-400">סיום עריכה</button>
          </div>
          <div className="mb-3 flex flex-wrap gap-1.5">
            {players.map((p, i) => (
              <button
                key={p.id}
                onClick={() => setEditFor(p.id)}
                className={
                  "flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs " +
                  (editFor === p.id ? "border-sky-400 text-sky-200" : "border-slate-700 text-slate-400")
                }
              >
                <PlayerDot player={p} idx={i} /> {p.name}
              </button>
            ))}
          </div>
          <p className="mb-2 text-xs text-slate-500">לחיצה על נבחרת משבצת/מסירה אותה מהשחקן המסומן</p>
          <TeamGrid onTeam={manualToggle} />
        </div>
      </div>
    );

  if (!draft && taken.length === 0)
    return (
      <div className="flex flex-col gap-3">
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
          <h3 className="mb-1 font-bold text-slate-100">הגדרת הדראפט</h3>
          <p className="mb-3 text-xs text-slate-400">
            קובעים את סדר השחקנים — הבחירה רצה לפי סדר מאוזן (הדפוס מהחוקים המקוריים, מותאם ל־48 נבחרות): כל שחקן עובר בכל מקום בסבב, וסכום מיקומי הבחירה זהה לכולם.
          </p>
          <div className="mb-3 flex flex-col gap-1.5">
            {order.map((id, i) => (
              <div key={id} className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-950 px-3 py-1.5">
                <span className="w-4 font-mono text-xs text-slate-500">{i + 1}</span>
                <PlayerDot player={players[pIdx(id)]} idx={pIdx(id)} />
                <span className="flex-1 text-sm text-slate-200">{pName(id)}</span>
                <button
                  disabled={i === 0}
                  onClick={() => setOrder((o) => { const n = [...o];[n[i - 1], n[i]] = [n[i], n[i - 1]]; return n; })}
                  className="text-slate-500 disabled:opacity-20"
                >▲</button>
                <button
                  disabled={i === order.length - 1}
                  onClick={() => setOrder((o) => { const n = [...o];[n[i + 1], n[i]] = [n[i], n[i + 1]]; return n; })}
                  className="text-slate-500 disabled:opacity-20"
                >▼</button>
              </div>
            ))}
          </div>
          {nOk && (
            <>
              <div className="mb-3 rounded-xl border border-slate-800 bg-slate-950 p-3">
                <p className="mb-1.5 text-xs font-bold text-slate-300">סדר הבחירה — {perPlayer} סבבים</p>
                <div className="flex flex-wrap gap-1.5 font-mono text-xs" dir="ltr">
                  {buildDraftRounds(players.length, perPlayer).map((r, i) => (
                    <span key={i} className="rounded-md border border-slate-800 px-1.5 py-0.5 text-slate-400">
                      {r.map((x) => x + 1).join(" ")}
                    </span>
                  ))}
                </div>
                <p className="mt-1.5 text-xs text-slate-500">המספרים לפי הרשימה שלמעלה.</p>
              </div>
              <div className="mb-4 flex items-center gap-2 text-sm text-slate-300">
                <span>נבחרות לכל שחקן:</span>
                <span className="font-mono font-bold text-slate-100">{perPlayer}</span>
                <span className="text-xs text-slate-500">(כל 48 הנבחרות מתחלקות בין {players.length} שחקנים)</span>
              </div>
            </>
          )}
          {nOk ? (
            <div className="flex gap-2">
              <button onClick={startDraft} className="flex-1 rounded-xl bg-emerald-500 py-2 font-bold text-slate-950 hover:bg-emerald-400">
                התחל דראפט חי ⚖️
              </button>
              <button onClick={() => setEditMode(true)} className="rounded-xl border border-slate-700 px-4 text-sm text-slate-300 hover:border-slate-500">
                שיבוץ ידני
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <p className="rounded-xl border border-amber-600 bg-amber-500 bg-opacity-10 px-3 py-2 text-xs text-amber-300">
                הדראפט תומך ב־3, 4 או 6 שחקנים בלבד, כדי ש־48 הנבחרות יתחלקו שווה בשווה (16 / 12 / 8 לכל אחד). אפשר לעדכן שחקנים בלשונית הניהול.
              </p>
              <button onClick={() => setEditMode(true)} className="rounded-xl border border-slate-700 px-4 py-2 text-sm text-slate-300 hover:border-slate-500">
                שיבוץ ידני
              </button>
            </div>
          )}
        </div>
      </div>
    );

  // live draft / summary
  return (
    <div className="flex flex-col gap-3">
      {draft && draft.active && currentPicker && (
        <div className="flex items-center justify-between rounded-2xl border border-emerald-600 bg-slate-900 px-4 py-3">
          <div className="flex items-center gap-2">
            <PlayerDot player={players[pIdx(currentPicker)]} idx={pIdx(currentPicker)} />
            <span className="font-bold text-slate-100">תור: {pName(currentPicker)}</span>
            <span className="font-mono text-xs text-slate-500">
              בחירה {pickNo + 1}/{totalPicks} · סבב {Math.floor(pickNo / draft.order.length) + 1}
            </span>
            {nextPicker && <span className="text-xs text-slate-500">· הבא: {pName(nextPicker)}</span>}
          </div>
          <button onClick={undo} disabled={pickNo === 0} className="flex items-center gap-1 text-xs text-slate-400 hover:text-amber-300 disabled:opacity-30">
            <Undo2 size={14} /> בטל אחרון
          </button>
        </div>
      )}
      {draft && !draft.active && (
        <div className="flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-900 px-4 py-3">
          <span className="text-sm font-bold text-emerald-400">הדראפט הושלם ✓</span>
          <button onClick={() => setEditMode(true)} className="flex items-center gap-1 text-xs text-slate-400 hover:text-sky-300">
            <Pencil size={12} /> עריכה ידנית
          </button>
        </div>
      )}
      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
        <TeamGrid onTeam={draft && draft.active ? pickTeam : () => { }} highlightFree={!!(draft && draft.active)} />
      </div>
      {taken.length > 0 && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
          <h3 className="mb-2 text-sm font-bold text-slate-200">הסגלים</h3>
          <div className="flex flex-col gap-2">
            {players.map((p, i) => (
              <div key={p.id} className="flex flex-wrap items-center gap-1.5">
                <span className="flex w-24 shrink-0 items-center gap-1.5 text-sm text-slate-300">
                  <PlayerDot player={p} idx={i} /> {p.name}
                </span>
                {Object.keys(assign).filter((t) => assign[t] === p.id).map((t) => (
                  <span key={t} className="flex items-center gap-1 rounded-full border border-slate-800 px-2 py-0.5 text-xs text-slate-300">
                    <Flag code={t} /><TName code={t} />
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ================= MANAGE TAB ================= */

function ManageTab({
  config,
  results,
  liveMeta,
  onSaveConfig,
  onSaveResults,
  onClearManualOverride,
  onResetAll,
  betKeys,
}) {
  const [resDraft, setResDraft] = useState(results);
  useEffect(() => setResDraft(results), [results]);
  const dirty = JSON.stringify(resDraft) !== JSON.stringify(results);
  const [saving, setSaving] = useState(false);
  const [newName, setNewName] = useState("");
  const [confirmReset, setConfirmReset] = useState(0);
  const [newKo, setNewKo] = useState({ round: "r32", t1: "", t2: "" });
  const knockoutSchedule = useMemo(() => buildKnockoutSchedule(resDraft), [resDraft]);

  const setGroupRes = (fid, v) =>
    setResDraft((prev) => {
      const g = { ...(prev.g || {}) };
      if (v) g[fid] = v; else delete g[fid];
      return { ...prev, g };
    });

  const addKo = () => {
    if (!newKo.t1 || !newKo.t2 || newKo.t1 === newKo.t2) return;
    const count = Object.keys(resDraft.ko || {}).filter((id) => id.startsWith(newKo.round)).length;
    const id = `${newKo.round}-${String(count + 1).padStart(2, "0")}-${Date.now().toString(36).slice(-3)}`;
    setResDraft((prev) => ({
      ...prev,
      ko: { ...(prev.ko || {}), [id]: { round: newKo.round, t1: newKo.t1, t2: newKo.t2, w: null, p: null } },
    }));
    setNewKo({ round: newKo.round, t1: "", t2: "" });
  };

  const patchKo = (matchOrId, patch) => {
    const id = typeof matchOrId === "string" ? matchOrId : matchOrId.id;
    const base = typeof matchOrId === "string"
      ? {}
      : {
        round: matchOrId.round,
        matchNo: matchOrId.matchNo,
        scheduled: matchOrId.scheduled,
        t1: matchOrId.t1,
        t2: matchOrId.t2,
      };
    setResDraft((prev) => ({ ...prev, ko: { ...prev.ko, [id]: { ...base, ...prev.ko[id], ...patch } } }));
  };
  const delKo = (id) =>
    setResDraft((prev) => {
      const ko = { ...prev.ko }; delete ko[id]; return { ...prev, ko };
    });

  const TeamSelect = ({ value, onChange }) => (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-lg border border-slate-700 bg-slate-950 px-2 py-1.5 text-xs text-slate-200"
    >
      <option value="">— נבחרת —</option>
      {GROUP_KEYS.map((g) => (
        <optgroup key={g} label={"בית " + g}>
          {GROUPS[g].map((t) => (
            <option key={t} value={t}>{T[t][1]} {T[t][0]}</option>
          ))}
        </optgroup>
      ))}
    </select>
  );

  return (
    <div className="flex flex-col gap-3">
      <p className="flex items-center gap-1.5 text-xs text-slate-500">
        <AlertTriangle size={13} className="text-amber-400" />
        מסך זה פתוח לכולם — מומלץ שרק מנהל הליגה יזין כאן תוצאות.
      </p>

      <Section title="נעילת ניחושי העולות" defaultOpen>
        <div className="flex items-center justify-between">
          <p className="text-xs text-slate-400">נועלים ברגע שהטורניר מתחיל — אחרי הנעילה כולם רואים את הניחושים של כולם.</p>
          <button
            onClick={() => onSaveConfig({ ...config, locks: { ...(config.locks || {}), bracket: !config?.locks?.bracket } })}
            className={
              "flex shrink-0 items-center gap-1.5 rounded-xl border px-3 py-1.5 text-sm font-bold " +
              (config?.locks?.bracket ? "border-amber-400 text-amber-300" : "border-slate-600 text-slate-300")
            }
          >
            {config?.locks?.bracket ? <><Lock size={14} /> נעול</> : <><Unlock size={14} /> פתוח</>}
          </button>
        </div>
      </Section>

      <Section title="נעילת הימורי שלב הבתים" defaultOpen>
        <div className="flex items-center justify-between">
          <p className="text-xs text-slate-400">נועלים לפני תחילת שלב הבתים — אחרי הנעילה לא ניתן לשנות הימורים.</p>
          <button
            onClick={() => onSaveConfig({ ...config, locks: { ...(config.locks || {}), groups: !config?.locks?.groups } })}
            className={
              "flex shrink-0 items-center gap-1.5 rounded-xl border px-3 py-1.5 text-sm font-bold " +
              (config?.locks?.groups ? "border-amber-400 text-amber-300" : "border-slate-600 text-slate-300")
            }
          >
            {config?.locks?.groups ? <><Lock size={14} /> נעול</> : <><Unlock size={14} /> פתוח</>}
          </button>
        </div>
      </Section>

      <Section title="נעילת הימורי נוקאאוט" defaultOpen>
        <div className="flex flex-col gap-2">
          <p className="text-xs text-slate-400">נועלים כל שלב לפני תחילת המשחקים שלו.</p>
          {KO_ROUNDS.map((r) => {
            const isLocked = !!(config?.locks?.ko?.[r.k]);
            return (
              <div key={r.k} className="flex items-center justify-between">
                <span className="text-sm text-slate-300">{r.n}</span>
                <button
                  onClick={() => onSaveConfig({
                    ...config,
                    locks: {
                      ...(config.locks || {}),
                      ko: { ...(config.locks?.ko || {}), [r.k]: !isLocked },
                    },
                  })}
                  className={
                    "flex shrink-0 items-center gap-1.5 rounded-xl border px-3 py-1.5 text-sm font-bold " +
                    (isLocked ? "border-amber-400 text-amber-300" : "border-slate-600 text-slate-300")
                  }
                >
                  {isLocked ? <><Lock size={14} /> נעול</> : <><Unlock size={14} /> פתוח</>}
                </button>
              </div>
            );
          })}
        </div>
      </Section>

      <Section title="תוצאות שלב הבתים" sub="מזינים תוצאה מדויקת — קובעת הימורים ושוברי שוויון">
        <div className="flex flex-col gap-2">
          {GROUP_KEYS.map((g) => {
            const fixes = groupFixtures(g);
            const done = fixes.filter((f) => resDraft.g && resDraft.g[f.id]).length;
            return (
              <Section key={g} title={"בית " + g} badge={`${done}/6`}>
                <div className="flex flex-col gap-2">
                  {fixes.map((f) => {
                    const meta = liveMeta?.[f.id];
                    return (
                      <div key={f.id} className="flex items-center justify-between gap-2 text-xs">
                        <span className="flex min-w-0 flex-1 items-center gap-1 text-slate-300"><Flag code={f.t1} /><TName code={f.t1} /></span>
                        <div className="flex shrink-0 flex-col items-center gap-1">
                          <ScoreCell
                            value={resDraft.g && resDraft.g[f.id]}
                            onCommit={(v) => setGroupRes(f.id, v)}
                          />
                          {meta?.manualOverride ? (
                            <button
                              onClick={() => onClearManualOverride(f.id)}
                              className="rounded-full border border-amber-700 px-2 py-0.5 text-[10px] font-bold text-amber-300 hover:border-amber-500"
                              title="הציון נשמר ידנית ולא יידרס על ידי העדכון החי"
                            >
                              MANUAL · החזר לאוטומטי
                            </button>
                          ) : meta?.status === "live" ? (
                            <span className="rounded-full border border-emerald-600 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
                              LIVE
                            </span>
                          ) : meta?.status === "finished" ? (
                            <span className="rounded-full border border-slate-700 px-2 py-0.5 text-[10px] font-bold text-slate-400">
                              FINAL
                            </span>
                          ) : null}
                        </div>
                        <span className="flex min-w-0 flex-1 items-center justify-end gap-1 text-slate-300"><TName code={f.t2} /><Flag code={f.t2} /></span>
                      </div>
                    );
                  })}
                </div>
              </Section>
            );
          })}
        </div>
      </Section>

      <Section title="משחקי נוקאאוט ותוצאות">
        <div className="mb-3 rounded-xl border border-slate-800 bg-slate-950 p-3">
          <div className="mb-2 text-xs font-bold text-slate-300">כל משחקי הנוקאאוט מוצגים מראש</div>
          <p className="mb-3 text-xs text-slate-500">
            מקומות שעוד לא נקבעו מופיעים כ־Winner Group / 3rd Group / Winner Match. אחרי שהנבחרות ידועות אפשר לבחור מנצחת ולשמור תוצאה אמיתית.
          </p>
          <div className="mb-2 text-xs font-bold text-slate-400">הוספת משחק ידני</div>
          <div className="flex flex-col gap-1.5">
            <select
              value={newKo.round}
              onChange={(e) => setNewKo({ ...newKo, round: e.target.value })}
              className="rounded-lg border border-slate-700 bg-slate-950 px-2 py-1.5 text-xs text-slate-200"
            >
              {KO_ROUNDS.map((r) => <option key={r.k} value={r.k}>{r.n}</option>)}
            </select>
            <div className="flex gap-1.5">
              <TeamSelect value={newKo.t1} onChange={(v) => setNewKo({ ...newKo, t1: v })} />
              <TeamSelect value={newKo.t2} onChange={(v) => setNewKo({ ...newKo, t2: v })} />
            </div>
            <button onClick={addKo} className="rounded-lg bg-sky-500 py-1.5 text-xs font-bold text-slate-950 hover:bg-sky-400">
              <Plus size={12} className="inline" /> הוסף משחק
            </button>
          </div>
        </div>
        <div className="flex flex-col gap-2">
          {KO_ROUNDS.map((r) => {
            const ms = knockoutSchedule
              .filter((m) => m.round === r.k)
              .sort((a, b) => (a.matchNo || 999) - (b.matchNo || 999) || a.id.localeCompare(b.id));
            if (ms.length === 0) return null;
            return (
              <div key={r.k}>
                <div className="mb-1 text-xs font-bold text-slate-400">{r.n}</div>
                <div className="flex flex-col gap-1.5">
                  {ms.map((m) => (
                    <div key={m.id} className="rounded-xl border border-slate-800 bg-slate-950 p-2">
                      <div className="mb-1.5 flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-500">
                          {m.matchNo ? <span className="font-mono">Match {m.matchNo}</span> : "משחק ידני"}
                          {m.scheduled
                            ? <span className="mr-1.5 text-sky-400">· מסלול רשמי</span>
                            : <span className="mr-1.5 text-slate-500">· ידני</span>}
                        </span>
                        {!m.scheduled && (
                          <button onClick={() => delKo(m.id)} className="shrink-0 text-slate-600 hover:text-rose-400"><Trash2 size={14} /></button>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5">
                        {[
                          { side: "t1", competitor: m.a },
                          { side: "t2", competitor: m.b },
                        ].map(({ side, competitor }) => {
                          const t = competitor.team;
                          return (
                            <button
                              key={side}
                              disabled={!t}
                              onClick={() => patchKo(m, { w: m.w === t ? null : t })}
                              className={
                                "flex flex-1 items-center justify-center gap-1 truncate rounded-lg border px-2 py-1.5 text-xs " +
                                (!t
                                  ? "cursor-default border-slate-800 text-slate-500"
                                  : m.w === t
                                    ? "border-emerald-500 bg-emerald-500 bg-opacity-20 text-emerald-300"
                                    : "border-slate-700 text-slate-300 hover:border-slate-500")
                              }
                            >
                              <CompetitorName competitor={competitor} /> {t && m.w === t && "🏆"}
                            </button>
                          );
                        })}
                      </div>
                      <div className="mt-1.5 flex items-center gap-1.5">
                        <span className="text-xs text-slate-500">הוכרע:</span>
                        {[["90", "ב־90 דק׳"], ["et", "הארכה/פנדלים"]].map(([v, label]) => (
                          <button
                            key={v}
                            disabled={!m.w}
                            onClick={() => patchKo(m, { p: m.p === v ? null : v })}
                            className={
                              "flex-1 rounded-lg border px-2 py-1 text-xs " +
                              (m.p === v
                                ? "border-emerald-500 text-emerald-300"
                                : !m.w
                                  ? "border-slate-800 text-slate-700"
                                  : "border-slate-700 text-slate-400 hover:border-slate-500")
                            }
                          >{label}</button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </Section>

      <Section title="שחקנים">
        <p className="mb-2 text-xs text-slate-500">לדראפט נדרשים 3, 4 או 6 שחקנים (16 / 12 / 8 נבחרות לכל אחד).</p>
        <div className="flex flex-col gap-1.5">
          {config.players.map((p, i) => (
            <div key={p.id} className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-950 px-3 py-1.5">
              <PlayerDot player={p} idx={i} />
              <span className="flex-1 text-sm text-slate-200">{p.name}</span>
              <button
                onClick={() => {
                  if (!window.confirm || window.confirm(`להסיר את ${p.name}? ההימורים שלו יימחקו מהחישוב.`))
                    onSaveConfig({
                      ...config,
                      players: config.players.filter((x) => x.id !== p.id),
                      assign: Object.fromEntries(Object.entries(config.assign || {}).filter(([, pid]) => pid !== p.id)),
                    });
                }}
                className="text-slate-600 hover:text-rose-400"
              ><Trash2 size={14} /></button>
            </div>
          ))}
          <div className="flex gap-1.5">
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="שם שחקן חדש"
              className="flex-1 rounded-xl border border-slate-700 bg-slate-950 px-3 py-1.5 text-sm text-slate-100 outline-none focus:border-sky-500"
            />
            <button
              onClick={() => {
                const n = newName.trim();
                if (!n) return;
                onSaveConfig({ ...config, players: [...config.players, { id: "p" + Date.now().toString(36), name: n }] });
                setNewName("");
              }}
              className="rounded-xl bg-slate-700 px-3 text-sm text-slate-100 hover:bg-slate-600"
            ><Plus size={14} /></button>
          </div>
        </div>
      </Section>

      <Section title="יועץ AI">
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-400">מאפשר לשחקנים לשאול AI שאלות על הטורניר, קבוצות והימורים.</p>
            <button
              onClick={() => onSaveConfig({ ...config, ai: { ...(config.ai || {}), enabled: !config?.ai?.enabled } })}
              className={
                "flex shrink-0 items-center gap-1.5 rounded-xl border px-3 py-1.5 text-sm font-bold " +
                (config?.ai?.enabled ? "border-sky-400 text-sky-300" : "border-slate-600 text-slate-300")
              }
            >
              <Bot size={14} /> {config?.ai?.enabled ? "פעיל" : "כבוי"}
            </button>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-slate-400">כתובת Worker (מ-Cloudflare) — נדרש גם GEMINI_API_KEY כ-secret</label>
            <input
              type="url"
              value={config?.ai?.workerUrl || ""}
              onChange={(e) => onSaveConfig({ ...config, ai: { ...(config.ai || {}), workerUrl: e.target.value } })}
              placeholder="https://mundial-live-scores.xxx.workers.dev"
              className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs text-slate-200 placeholder-slate-600 outline-none focus:border-sky-600"
              dir="ltr"
            />
          </div>
        </div>
      </Section>

      <Section title="אזור מסוכן">
        <button
          onClick={async () => {
            if (confirmReset < 2) { setConfirmReset(confirmReset + 1); return; }
            await onResetAll();
            setConfirmReset(0);
          }}
          className="w-full rounded-xl border border-rose-600 py-2 text-sm font-bold text-rose-400 hover:bg-rose-500 hover:bg-opacity-10"
        >
          {confirmReset === 0 ? "איפוס מלא של הליגה" : confirmReset === 1 ? "בטוחים? כל הנתונים יימחקו" : "לחיצה אחרונה — מחיקה סופית!"}
        </button>
      </Section>

      <SaveBar
        show={dirty}
        saving={saving}
        onSave={async () => { setSaving(true); await onSaveResults(resDraft); setSaving(false); }}
      />
    </div>
  );
}

/* ================= RULES TAB ================= */

function RulesTab() {
  const Card = ({ title, children }) => (
    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
      <h3 className="mb-2 font-bold text-slate-100">{title}</h3>
      <div className="flex flex-col gap-1.5 text-sm leading-relaxed text-slate-300">{children}</div>
    </div>
  );
  const Pt = ({ n }) => <span className="font-mono font-bold text-amber-300">{n}</span>;
  return (
    <div className="flex flex-col gap-3">
      <Card title="חלק 1 · דראפט נבחרות">
        <p>משחקים 3, 4 או 6 שחקנים, וכל 48 הנבחרות מתחלקות שווה בשווה (16 / 12 / 8 לכל אחד). הבחירה רצה לפי סדר מאוזן — הדפוס מהחוקים המקוריים מותאם ל־48 נבחרות, כך שכל שחקן עובר בכל מקום בסבב וסכום מיקומי הבחירה זהה לכולם. הנבחרות שלך מזכות אותך בכל משחק שלהן:</p>
        <p>נצחון (כולל בהארכה/פנדלים) — <Pt n="3" /> נק׳ · תיקו או הפסד בהארכה/פנדלים — <Pt n="1" /> נק׳ · הפסד ב־90 דק׳ — <Pt n="0" />.</p>
      </Card>
      <Card title="חלק 2א · הימור על משחקי הבתים">
        <p>בכל משחק בשלב הבתים מהמרים מי מנצחת או תיקו. כל פגיעה — <Pt n="1" /> נק׳.</p>
      </Card>
      <Card title="חלק 2ב · הימורי נוקאאוט">
        <p>לפני כל סיבוב (שלב ה־32, שמינית, רבע, חצי, גמר) מהמרים מי עולה, והאם ההכרעה ב־90 דק׳ או בהארכה/פנדלים.</p>
        <p>עולה נכונה — <Pt n="1" /> נק׳. דרך עלייה נכונה — בונוס של עוד <Pt n="1" /> נק׳.</p>
        <p className="text-xs text-slate-500">
          שימו לב: הבונוס הוא רק תוספת. אם הימרתם "אנגליה בהארכה" וצרפת עלתה בהארכה — אפס נקודות.
        </p>
      </Card>
      <Card title="חלק 3 · ניחושי עולות (לפני הטורניר)">
        <p>מנחשים מראש: 32 עולות משלב הבתים, 16 לשמינית, 8 לרבע, 4 לחצי, 2 פיינליסטיות ואלופה.</p>
        <p>
          פגיעה בשלב ה־32 — <Pt n="0.5" /> · שמינית — <Pt n="1" /> · רבע — <Pt n="2" /> · חצי — <Pt n="3" /> · פיינליסטית — <Pt n="4" /> · אלופה — <Pt n="5" />.
        </p>
        <p className="text-xs text-slate-500">
          הניקוד מצטבר: אלופה שניחשתם נכון מההתחלה שווה 0.5+1+2+3+4+5 = 15.5 נק׳. באפליקציה כל שלב נבחר מתוך השלב הקודם, אז ההצטברות אוטומטית.
        </p>
      </Card>
      <Card title="הערות לפורמט 2026">
        <p>48 נבחרות, 12 בתים, ושלב נוקאאוט חדש של 32 קבוצות (עולות: שתי הראשונות מכל בית + 8 השלישיות הטובות).</p>
        <p className="text-xs text-slate-500">
          מנהל הליגה מזין תוצאות מדויקות במסך הניהול — ההימור נבחן לפי הכיוון (1/X/2) והשערים משמשים לשוברי שוויון בסימולציה. משחק המקום השלישי נספר לדראפט ולהימורי נוקאאוט. לשונית הסימולציה היא מגרש משחקים מקומי — תרחישים שם לא נשמרים ולא משפיעים על הליגה.
        </p>
      </Card>
    </div>
  );
}

/* ================= SIMULATION PLAYGROUND ================= */

const cloneResults = (r) => ({
  g: { ...(r?.g || {}) },
  ko: Object.fromEntries(Object.entries(r?.ko || {}).map(([id, m]) => [id, { ...m }])),
});
function mergeRealIntoSim(real, sim) {
  const g = { ...sim.g, ...(real?.g || {}) };
  const ko = Object.fromEntries(Object.entries(sim.ko).map(([id, m]) => [id, { ...m }]));
  Object.entries(real?.ko || {}).forEach(([id, m]) => {
    ko[id] = {
      ...(ko[id] || {}), round: m.round, t1: m.t1, t2: m.t2,
      w: m.w || ko[id]?.w || null,
      p: m.w ? m.p || null : ko[id]?.p || m.p || null,
    };
  });
  return { g, ko };
}
const fmtPts = (x) => (Number.isInteger(x) ? String(x) : x.toFixed(1));

/* ---- group standings: points → goal diff → goals scored → head-to-head → wins → draw order ---- */
function groupStandings(g, gRes) {
  const teams = GROUPS[g];
  const pts = {}, wins = {}, gd = {}, gf = {};
  teams.forEach((t) => { pts[t] = 0; wins[t] = 0; gd[t] = 0; gf[t] = 0; });
  groupFixtures(g).forEach((f) => {
    const r = gRes[f.id];
    if (!r) return;
    const sc = scoreOf(r), o = outcomeOf(r);
    if (sc) {
      gf[f.t1] += sc[0]; gd[f.t1] += sc[0] - sc[1];
      gf[f.t2] += sc[1]; gd[f.t2] += sc[1] - sc[0];
    }
    if (o === "1") { pts[f.t1] += 3; wins[f.t1]++; }
    else if (o === "2") { pts[f.t2] += 3; wins[f.t2]++; }
    else { pts[f.t1]++; pts[f.t2]++; }
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
      const mp = Object.fromEntries(tied.map((t) => [t, 0]));
      groupFixtures(g).forEach((f) => {
        if (!tied.includes(f.t1) || !tied.includes(f.t2)) return;
        const o = outcomeOf(gRes[f.id]);
        if (!o) return;
        if (o === "1") mp[f.t1] += 3; else if (o === "2") mp[f.t2] += 3; else { mp[f.t1]++; mp[f.t2]++; }
      });
      tied.sort((a, b) => mp[b] - mp[a] || wins[b] - wins[a] || teams.indexOf(a) - teams.indexOf(b));
    }
    out.push(...tied);
    i = j;
  }
  return { order: out, pts, wins, gd, gf };
}

function computeQualification(gRes) {
  const st = {};
  GROUP_KEYS.forEach((g) => { st[g] = groupStandings(g, gRes); });
  const thirdsRanked = GROUP_KEYS
    .map((g) => ({ g, t: st[g].order[2] }))
    .sort((a, b) =>
      st[b.g].pts[b.t] - st[a.g].pts[a.t] ||
      st[b.g].gd[b.t] - st[a.g].gd[a.t] ||
      st[b.g].gf[b.t] - st[a.g].gf[a.t] ||
      st[b.g].wins[b.t] - st[a.g].wins[a.t] ||
      a.g.localeCompare(b.g));
  const filled = ALL_GROUP_FIXTURES.filter((f) => gRes[f.id]).length;
  return {
    st, thirdsRanked,
    q8: new Set(thirdsRanked.slice(0, 8).map((x) => x.g)),
    complete: filled === ALL_GROUP_FIXTURES.length,
    filled,
  };
}

/* ================= TREE CHART ================= */

function CompetitorName({ competitor, className = "" }) {
  if (competitor?.team) {
    return (
      <>
        <Flag code={competitor.team} />
        <span className={"truncate " + className}><TName code={competitor.team} /></span>
      </>
    );
  }
  return <span className={"truncate text-slate-500 " + className} dir="ltr">{competitor?.label || "TBD"}</span>;
}

function TreeChart({ schedule, realKo, patchKo }) {
  const byMatchNo = useMemo(() => new Map(schedule.map((match) => [match.matchNo, match])), [schedule]);
  const fMatch = byMatchNo.get(104);
  const champion = fMatch && fMatch.w ? fMatch.w : null;
  const Card = ({ matchNo }) => {
    const mm = byMatchNo.get(matchNo);
    if (!mm) {
      const fd = FEED[matchNo];
      return (
        <div className="flex w-28 flex-col items-center justify-center rounded-lg border border-dashed border-slate-800 px-1.5 py-1.5 text-xs text-slate-700">
          <span>מנצחות</span>
          <span className="font-mono" dir="ltr">{fd ? `${fd[0]} · ${fd[1]}` : "—"}</span>
        </div>
      );
    }
    const locked = !!realKo[mm.id]?.w;
    return (
      <div className="w-28 overflow-hidden rounded-lg border border-slate-800 bg-slate-950">
        {[
          { side: "t1", competitor: mm.a },
          { side: "t2", competitor: mm.b },
        ].map(({ side, competitor }) => {
          const t = competitor.team;
          const disabled = locked || !t;
          return (
          <button
            key={side}
            disabled={disabled}
            onClick={() => patchKo(mm, { w: mm.w === t ? null : t })}
            className={
              "flex w-full items-center gap-1 px-1.5 py-0.5 text-right text-xs " +
              (!t
                ? "cursor-default text-slate-500"
                : mm.w === t
                ? locked
                  ? "bg-emerald-500 bg-opacity-20 font-bold text-emerald-200"
                  : "bg-sky-500 bg-opacity-20 font-bold text-sky-100"
                : mm.w ? "text-slate-600" : "text-slate-300 hover:bg-slate-800")
            }
          >
            <CompetitorName competitor={competitor} />
          </button>
          );
        })}
      </div>
    );
  };
  return (
    <div>
      {champion && (
        <div className="mb-3 flex items-center justify-center gap-2 rounded-xl border border-amber-500 bg-amber-500 bg-opacity-10 px-3 py-2 text-sm font-bold text-amber-300">
          🏆 אלופת העולם בתרחיש: <Flag code={champion} lg /> {T[champion][0]}
        </div>
      )}
      <div className="overflow-x-auto pb-1">
        <div className="flex min-w-max items-stretch gap-3" dir="rtl">
          {TREE_COLS.map((col) => (
            <div key={col.k} className="flex flex-col">
              <div className="mb-1.5 text-center text-xs font-bold text-slate-500">{col.n}</div>
              <div className="flex flex-1 flex-col justify-around gap-2">
                {col.ms.map((m) => <Card key={m} matchNo={m} />)}
              </div>
              {col.k === "f" && (
                <div className="pt-3">
                  <div className="mb-1 text-center text-xs text-slate-600">מקום שלישי</div>
                  <Card matchNo={103} />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
      <p className="mt-2 text-xs text-slate-500">
        לחיצה על נבחרת מסמנת אותה כמנצחת והסיבוב הבא מתעדכן · משחקים אמיתיים שהוכרעו נעולים בירוק · דרך ההכרעה (90׳/הארכה) נקבעת ברשימה למטה.
      </p>
    </div>
  );
}

function SimTab({ config, results, betsAll, meId }) {
  const [sim, setSim] = useState(() => cloneResults(results));
  useEffect(() => { setSim((s) => mergeRealIntoSim(results, s)); }, [results]);
  useEffect(() => {
    setSim((s) => {
      const ko = buildScheduledBracketKo(s);
      return JSON.stringify(ko) === JSON.stringify(s.ko) ? s : { ...s, ko };
    });
  }, [sim]);
  const [newKo, setNewKo] = useState({ round: "r32", t1: "", t2: "" });
  const qual = useMemo(() => computeQualification(sim.g), [sim.g]);
  const knockoutSchedule = useMemo(() => buildKnockoutSchedule(sim), [sim]);

  const realG = results?.g || {};
  const realKo = results?.ko || {};
  const players = config.players;
  const pIdx = (id) => players.findIndex((p) => p.id === id);

  const simScores = useMemo(() => computeScores(config, sim, betsAll), [config, sim, betsAll]);
  const realScores = useMemo(() => computeScores(config, results, betsAll), [config, results, betsAll]);
  const realTotal = useMemo(() => Object.fromEntries(realScores.rows.map((r) => [r.p.id, r.total])), [realScores]);

  const setG = (id, v) => {
    if (realG[id]) return;
    setSim((s) => { const g = { ...s.g }; if (v == null) delete g[id]; else g[id] = v; return { ...s, g }; });
  };
  const patchKo = (matchOrId, patch) => {
    const id = typeof matchOrId === "string" ? matchOrId : matchOrId.id;
    if (realKo[id]?.w) return;
    const base = typeof matchOrId === "string"
      ? {}
      : {
        round: matchOrId.round,
        matchNo: matchOrId.matchNo,
        scheduled: matchOrId.scheduled,
        t1: matchOrId.t1,
        t2: matchOrId.t2,
      };
    setSim((s) => ({ ...s, ko: { ...s.ko, [id]: { ...base, ...s.ko[id], ...patch } } }));
  };
  const addKo = () => {
    if (!newKo.t1 || !newKo.t2 || newKo.t1 === newKo.t2) return;
    const id = "sim-" + Date.now();
    setSim((s) => ({ ...s, ko: { ...s.ko, [id]: { round: newKo.round, t1: newKo.t1, t2: newKo.t2, w: null, p: null } } }));
    setNewKo((k) => ({ ...k, t1: "", t2: "" }));
  };
  const delKo = (id) => {
    if (realKo[id]) return;
    setSim((s) => { const ko = { ...s.ko }; delete ko[id]; return { ...s, ko }; });
  };
  const reset = () => setSim(cloneResults(results));
  const fillFromMyBets = () => {
    const my = meId ? betsAll[meId] : null;
    if (!my) return;
    setSim((s) => {
      const g = { ...s.g };
      ALL_GROUP_FIXTURES.forEach((f) => { if (!realG[f.id] && my.g?.[f.id]) g[f.id] = my.g[f.id]; });
      const ko = Object.fromEntries(Object.entries(s.ko).map(([id, m]) => [id, { ...m }]));
      Object.entries(ko).forEach(([id, m]) => {
        const b = my.ko?.[id];
        if (!realKo[id]?.w && b?.t && (b.t === m.t1 || b.t === m.t2)) ko[id] = { ...m, w: b.t, p: b.p || m.p };
      });
      return { g, ko };
    });
  };

  const koList = [...knockoutSchedule];
  const roundOrder = Object.fromEntries(KO_ROUNDS.map((r, i) => [r.k, i]));
  koList.sort((a, b) =>
    (roundOrder[a.round] ?? 9) - (roundOrder[b.round] ?? 9) ||
    (a.matchNo || 999) - (b.matchNo || 999) ||
    a.id.localeCompare(b.id));
  const roundName = (k) => KO_ROUNDS.find((r) => r.k === k)?.n || k;

  return (
    <div className="flex flex-col gap-3">
      <div className="rounded-2xl border border-sky-700 bg-slate-900 p-4">
        <div className="mb-1 flex items-center gap-2">
          <FlaskConical size={16} className="text-sky-400" />
          <h3 className="font-bold text-slate-100">מגרש משחקים</h3>
        </div>
        <p className="mb-3 text-xs text-slate-400">
          תוצאות אמיתיות שכבר הוזנו נעולות (בירוק). כל השאר אפשר למלא כרצונכם ולראות איך הטבלה משתנה לפי ההימורים של כולם. עץ הנוקאאוט מוצג מראש לפי המסלול הרשמי — מקומות שעוד לא נקבעו מופיעים כ־Winner Group / 3rd Group / Winner Match. הסימולציה מקומית בלבד — לא נשמרת ולא משפיעה על הליגה.
        </p>
        <div className="flex flex-wrap gap-2">
          {meId && betsAll[meId] && (
            <button onClick={fillFromMyBets} className="flex items-center gap-1.5 rounded-xl border border-sky-600 px-3 py-1.5 text-xs text-sky-300 hover:bg-sky-500 hover:bg-opacity-10">
              <Target size={13} /> מלא לפי ההימורים שלי
            </button>
          )}
          <button onClick={reset} className="flex items-center gap-1.5 rounded-xl border border-slate-700 px-3 py-1.5 text-xs text-slate-300 hover:border-slate-500">
            <RefreshCw size={13} /> אפס למצב האמיתי
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
        <h3 className="mb-2 text-sm font-bold text-slate-200">הטבלה בתרחיש הזה</h3>
        <div className="flex flex-col gap-1.5">
          {simScores.rows.map((r, i) => {
            const d = r.total - (realTotal[r.p.id] || 0);
            return (
              <div key={r.p.id} className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-950 px-3 py-1.5">
                <span className="w-4 font-mono text-xs text-slate-500">{i + 1}</span>
                <PlayerDot player={r.p} idx={pIdx(r.p.id)} />
                <span className="flex-1 truncate text-sm text-slate-200">{r.p.name}</span>
                <span className="hidden font-mono text-xs text-slate-500 sm:inline">
                  ד {fmtPts(r.draft)} · מ {fmtPts(r.matches)} · ע {fmtPts(r.bracket)}
                </span>
                <span className={"font-mono text-xs " + (d > 0 ? "text-emerald-400" : d < 0 ? "text-rose-400" : "text-slate-600")}>
                  {d > 0 ? "+" + fmtPts(d) : d < 0 ? "−" + fmtPts(-d) : "±0"}
                </span>
                <span className="w-12 text-left font-mono text-base font-bold text-slate-100">{fmtPts(r.total)}</span>
              </div>
            );
          })}
        </div>
      </div>

      <Section title="שלב הבתים — תרחיש" sub="מזינים תוצאה מדויקת לכל משחק">
        <div className="flex flex-col gap-2">
          {GROUP_KEYS.map((g) => (
            <Section key={g} title={`בית ${g}`}>
              <div className="flex flex-col gap-1.5">
                {groupFixtures(g).map((f) => {
                  const locked = !!realG[f.id];
                  return (
                    <div key={f.id} className="flex items-center justify-between gap-2 rounded-xl border border-slate-800 bg-slate-950 px-2.5 py-1.5 text-xs">
                      <span className="flex min-w-0 flex-1 items-center gap-1.5 text-slate-200"><Flag code={f.t1} /><TName code={f.t1} /></span>
                      <ScoreCell value={sim.g[f.id]} locked={locked} onCommit={(v) => setG(f.id, v)} />
                      <span className="flex min-w-0 flex-1 items-center justify-end gap-1.5 text-slate-200"><TName code={f.t2} /><Flag code={f.t2} /></span>
                      {locked && <Lock size={11} className="shrink-0 text-emerald-500" />}
                    </div>
                  );
                })}
              </div>
            </Section>
          ))}
        </div>
      </Section>

      <Section title="טבלאות הבתים — מי עולה" defaultOpen badge={`${qual.filled}/72`}>
        {!qual.complete && (
          <p className="mb-2 rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-400">
            עץ הנוקאאוט כבר מוצג למטה עם שמות המקומות הצפויים. ברגע שבתים או משחקים קודמים מוכרעים, המקומות מתחלפים אוטומטית לנבחרות האמיתיות.
          </p>
        )}
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {GROUP_KEYS.map((g) => {
            const s = qual.st[g];
            return (
              <div key={g} className="rounded-xl border border-slate-800 bg-slate-950 p-2">
                <div className="mb-1 font-mono text-xs text-slate-500">בית {g}</div>
                {s.order.map((t, i) => {
                  const cls =
                    i <= 1 ? "text-emerald-300"
                      : i === 2 ? (qual.q8.has(g) ? "text-amber-300" : "text-slate-500")
                        : "text-slate-600";
                  return (
                    <div key={t} className={"flex items-center gap-1.5 py-0.5 text-xs " + cls}>
                      <span className="w-3 font-mono">{i + 1}</span>
                      <Flag code={t} />
                      <span className="flex-1 truncate"><TName code={t} /></span>
                      <span className="w-6 text-left font-mono text-slate-600" dir="ltr">{s.gd[t] > 0 ? "+" + s.gd[t] : s.gd[t]}</span>
                      <span className="font-mono">{s.pts[t]}</span>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
        <p className="mt-2 text-xs text-slate-500">
          ירוק — שתי הראשונות עולות · צהוב — שלישית מתוך 8 הטובות · שוויון נשבר לפי הפרש שערים, שערי זכות ואז מפגש ישיר (תוצאות ישנות בלי שער מדויק נספרות כנקודות בלבד).
        </p>
      </Section>

      <Section title="עץ הטורניר — תרחיש" defaultOpen sub="לחיצה על נבחרת קובעת מנצחת">
        <TreeChart schedule={knockoutSchedule} realKo={realKo} patchKo={patchKo} />
      </Section>

      <Section title="נוקאאוט — תרחיש" sub="העץ נבנה לבד מהבתים; בחרו מנצחת והסיבוב הבא ייווצר" defaultOpen>
        <div className="flex flex-col gap-2">
          {koList.map((m) => {
            const isReal = !!realKo[m.id];
            const isAuto = !!m.scheduled;
            const locked = !!realKo[m.id]?.w;
            return (
              <div key={m.id} className="rounded-xl border border-slate-800 bg-slate-950 p-2.5">
                <div className="mb-1.5 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-400">
                    {roundName(m.round)}
                    {m.matchNo && <span className="mr-1.5 font-mono text-slate-600">· משחק {m.matchNo}</span>}
                    {isReal
                      ? <span className="mr-1.5 text-emerald-500">· אמיתי</span>
                      : isAuto
                        ? <span className="mr-1.5 text-sky-400">· מסלול</span>
                        : <span className="mr-1.5 text-sky-400">· ידני</span>}
                  </span>
                  {locked
                    ? <Lock size={11} className="text-emerald-500" />
                    : !isReal && !isAuto && (
                      <button onClick={() => delKo(m.id)} className="text-slate-600 hover:text-rose-400"><Trash2 size={13} /></button>
                    )}
                </div>
                <div className="mb-1.5 flex flex-wrap items-center gap-1.5">
                  {[
                    { side: "t1", competitor: m.a },
                    { side: "t2", competitor: m.b },
                  ].map(({ side, competitor }) => {
                    const t = competitor.team;
                    const disabled = locked || !t;
                    return (
                    <button
                      key={side}
                      disabled={disabled}
                      onClick={() => patchKo(m, { w: m.w === t ? null : t })}
                      className={
                        "flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs " +
                        (!t
                          ? "cursor-default border-slate-800 text-slate-500"
                          : m.w === t
                          ? locked
                            ? "border-emerald-500 bg-emerald-500 bg-opacity-20 text-emerald-200"
                            : "border-sky-400 bg-sky-500 bg-opacity-20 text-sky-100"
                          : locked ? "border-slate-800 text-slate-600" : "border-slate-700 text-slate-300 hover:border-slate-500")
                      }
                    >
                      <CompetitorName competitor={competitor} /> {t && m.w === t && "🏆"}
                    </button>
                    );
                  })}
                </div>
                <div className="flex items-center gap-1.5">
                  {[["90", "ב־90 דק׳"], ["et", "הארכה/פנדלים"]].map(([v, n]) => (
                    <button
                      key={v} disabled={locked || !m.w}
                      onClick={() => patchKo(m, { p: m.p === v ? null : v })}
                      className={
                        "rounded-lg border px-2 py-0.5 text-xs " +
                        (m.p === v
                          ? locked
                            ? "border-emerald-500 text-emerald-300"
                            : "border-sky-400 text-sky-200"
                          : locked || !m.w ? "border-slate-800 text-slate-700" : "border-slate-700 text-slate-400 hover:border-slate-500")
                      }
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
          <div className="flex flex-wrap items-center gap-1.5 rounded-xl border border-dashed border-slate-700 p-2.5">
            <select
              value={newKo.round}
              onChange={(e) => setNewKo((k) => ({ ...k, round: e.target.value }))}
              className="rounded-lg border border-slate-700 bg-slate-950 px-2 py-1 text-xs text-slate-200"
            >
              {KO_ROUNDS.map((r) => <option key={r.k} value={r.k}>{r.n}</option>)}
            </select>
            {["t1", "t2"].map((f) => (
              <select
                key={f} value={newKo[f]}
                onChange={(e) => setNewKo((k) => ({ ...k, [f]: e.target.value }))}
                className="w-32 rounded-lg border border-slate-700 bg-slate-950 px-2 py-1 text-xs text-slate-200"
              >
                <option value="">— נבחרת —</option>
                {ALL_TEAMS.map((t) => <option key={t} value={t}>{T[t][0]}</option>)}
              </select>
            ))}
            <button onClick={addKo} className="flex items-center gap-1 rounded-lg border border-sky-600 px-2.5 py-1 text-xs text-sky-300 hover:bg-sky-500 hover:bg-opacity-10">
              <Plus size={12} /> הוסף משחק
            </button>
          </div>
        </div>
      </Section>
    </div>
  );
}

/* ================= AI CHAT ================= */

const AI_GENERAL_QS = [
  { label: "🏆 מי המועדף לגביע?", q: "מי המועדף לזכות בגביע העולם 2026 ולמה? תן ניתוח קצר." },
  { label: "⚡ מי בכושר עכשיו?", q: "אילו קבוצות נמצאות בכושר הטוב ביותר כרגע בטורניר?" },
  { label: "🎯 עצה להימור הבא", q: "בהתבסס על הימוריי הנוכחיים, על מה כדאי לי לשים לב?" },
  { label: "😱 הפתעות הטורניר", q: "מה ההפתעות הגדולות עד כה בגביע העולם 2026?" },
];

const AI_GAME_QS = [
  { label: "מי ינצח?", build: (t1, t2) => `מי לדעתך ינצח במשחק ${t1} נגד ${t2}? תן המלצת הימור מפורטת.` },
  { label: "1 / X / 2?", build: (t1, t2) => `מהי ההמלצה שלך להימור 1 / X / 2 על ${t1} נגד ${t2}?` },
  { label: "ניתוח כוחות", build: (t1, t2) => `נתח את נקודות החוזק והחולשה של ${t1} ו-${t2} לקראת המשחק ביניהן.` },
];

function AiChat({ config, results, betsAll, me, liveMeta }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedGame, setSelectedGame] = useState(null);
  const [teamInsights, setTeamInsights] = useState(null);
  const [insightsLoading, setInsightsLoading] = useState(false);
  const bottomRef = useRef(null);

  const workerUrl = resolveAiWorkerUrl(config?.ai?.workerUrl);

  // Fetch ESPN news whenever chat opens
  useEffect(() => {
    if (!open || !workerUrl) return;
    setInsightsLoading(true);
    fetch(`${workerUrl}/team-insights`)
      .then((r) => r.json())
      .then((data) => setTeamInsights(data))
      .catch(() => setTeamInsights(null))
      .finally(() => setInsightsLoading(false));
  }, [open, workerUrl]);

  // Upcoming group fixtures (no result yet) shown first, then ones with results
  const gameChips = useMemo(() => {
    const upcoming = ALL_GROUP_FIXTURES.filter((f) => !results.g?.[f.id]);
    const done = ALL_GROUP_FIXTURES.filter((f) => results.g?.[f.id]);
    const koAll = Object.entries(results.ko || {}).map(([id, m]) => ({ id, t1: m.t1, t2: m.t2, isKo: true, done: !!m.w }));
    return [
      ...upcoming.map((f) => ({ id: f.id, t1: f.t1, t2: f.t2, done: false })),
      ...koAll,
      ...done.map((f) => ({ id: f.id, t1: f.t1, t2: f.t2, done: true })),
    ].slice(0, 20);
  }, [results]);

  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  const buildSystemPrompt = () => {
    // --- group standings ---
    const standings = computeGroupStandings(results.g);

    // --- KO bracket ---
    const koEntries = Object.entries(results.ko || {});
    const koText = koEntries.length
      ? koEntries.map(([, m]) => {
        const round = KO_ROUNDS.find((r) => r.k === m.round)?.n || m.round;
        const winner = m.w ? ` → ${T[m.w]?.[0] || m.w}${m.p === "et" ? " (הארכה)" : ""}` : " (טרם שוחק)";
        return `${round}: ${T[m.t1]?.[0] || m.t1} vs ${T[m.t2]?.[0] || m.t2}${winner}`;
      }).join("\n")
      : "אין עדיין";

    // --- live matches ---
    const liveMatches = ALL_GROUP_FIXTURES.filter((f) => liveMeta?.[f.id]?.status === "live");
    const liveText = liveMatches.length
      ? liveMatches.map((f) => {
        const meta = liveMeta[f.id];
        const score = results.g?.[f.id] ? ` (${results.g[f.id]})` : "";
        const clock = meta.displayClock ? ` [${meta.displayClock}]` : "";
        return `${T[f.t1]?.[0] || f.t1} vs ${T[f.t2]?.[0] || f.t2}${score}${clock}`;
      }).join("; ")
      : null;

    // --- upcoming matches with kickoff times ---
    const upcoming = ALL_GROUP_FIXTURES
      .filter((f) => !results.g?.[f.id] && liveMeta?.[f.id]?.kickoff)
      .slice(0, 12)
      .map((f) => {
        const kick = new Date(liveMeta[f.id].kickoff).toLocaleString("he-IL", {
          month: "short", day: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Jerusalem",
        });
        return `${f.id}: ${T[f.t1]?.[0] || f.t1} vs ${T[f.t2]?.[0] || f.t2} — ${kick}`;
      });

    // --- my bets ---
    const myBets = betsAll[me] || EMPTY_BETS;
    const myGroupBets = Object.entries(myBets.g || {})
      .map(([id, v]) => `${id}:${v}`).join(", ") || "אין";
    const myKoBets = Object.entries(myBets.ko || {})
      .map(([id, b]) => `${id}: ${T[b.t]?.[0] || b.t || "?"}${b.p ? ` (${b.p === "et" ? "הארכה" : "90"})` : ""}`).join(", ") || "אין";
    const myBracket = TIERS.map((t) =>
      `${t.n}: ${(myBets.br?.[t.k] || []).map((c) => T[c]?.[0] || c).join(", ") || "אין"}`
    ).join(" | ");

    // --- my draft teams ---
    const myTeams = Object.entries(config?.assign || {})
      .filter(([, pid]) => pid === me)
      .map(([tc]) => T[tc]?.[0] || tc);

    // --- league consensus (how other players bet on each upcoming fixture) ---
    const players = config?.players || [];
    const consensusLines = ALL_GROUP_FIXTURES
      .filter((f) => !results.g?.[f.id])
      .slice(0, 15)
      .map((f) => {
        const votes = { "1": 0, "X": 0, "2": 0 };
        players.forEach((p) => { const v = betsAll[p.id]?.g?.[f.id]; if (v) votes[v]++; });
        const total = votes["1"] + votes["X"] + votes["2"];
        if (total === 0) return null;
        const myVote = myBets.g?.[f.id];
        const summary = Object.entries(votes).filter(([, c]) => c > 0)
          .map(([k, c]) => `${k}:${c}`).join(", ");
        return `${f.id} (${T[f.t1]?.[0] || f.t1} vs ${T[f.t2]?.[0] || f.t2}): ${summary}${myVote ? ` — הימורי: ${myVote}` : " — לא הימרתי"}`;
      }).filter(Boolean);

    return [
      AI_STATIC_CONTEXT,
      "",
      "=== מצב הטורניר כרגע ===",
      "טבלאות שלב הבתים:",
      standings,
      "",
      "שלב הנוקאאוט:",
      koText,
      liveText ? `\n🔴 עכשיו חי: ${liveText}` : "",
      upcoming.length ? `\nמשחקים קרובים:\n${upcoming.join("\n")}` : "",
      "",
      "=== הפרופיל שלי בליגה ===",
      `נבחרות הדראפט שלי: ${myTeams.length ? myTeams.join(", ") : "אין עדיין"}`,
      `הימורי שלב הבתים: ${myGroupBets}`,
      `הימורי נוקאאוט: ${myKoBets}`,
      `ניחושי עולות: ${myBracket}`,
      "",
      consensusLines.length ? `=== דעת הליגה על משחקים קרובים ===\n${consensusLines.join("\n")}` : "",
      "",
      // --- team form (computed from existing results) ---
      (() => {
        const form = computeTeamForm(results.g);
        return form ? `=== כושר קבוצות בטורניר ===\n${form}` : "";
      })(),
      // --- ESPN news (fetched on open) ---
      (() => {
        const articles = teamInsights?.articles;
        if (!articles?.length) return "";
        const ts = teamInsights.updatedAt
          ? `(עדכון: ${new Date(teamInsights.updatedAt).toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit" })})`
          : "";
        const lines = articles.map((a) => {
          const teams = a.teams?.length ? ` [${a.teams.join(", ")}]` : "";
          return `• ${a.headline}${teams}${a.summary ? ": " + a.summary : ""}`;
        }).join("\n");
        return `=== חדשות ועדכוני שחקנים מ-ESPN ${ts} ===\n${lines}`;
      })(),
    ].filter((l) => l !== null && l !== "").join("\n");
  };

  const sendMsg = async (text) => {
    const msg = (text ?? input).trim();
    if (!msg || loading || !workerUrl) return;
    const userMsg = { role: "user", content: msg };
    const updated = [...messages, userMsg];
    setMessages(updated);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch(`${workerUrl}/ai-chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: updated, systemPrompt: buildSystemPrompt() }),
      });
      const data = await res.json();
      setMessages([...updated, { role: "assistant", content: data.content || "שגיאה בתשובה." }]);
    } catch {
      setMessages([...updated, { role: "assistant", content: "שגיאה בתקשורת עם השרת." }]);
    } finally {
      setLoading(false);
    }
  };

  const tName = (code) => T[code]?.[0] || code;
  const tFlag = (code) => T[code]?.[1] || "🏳️";

  const Chip = ({ label, active, onClick, muted }) => (
    <button
      onClick={onClick}
      className={
        "shrink-0 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors " +
        (active
          ? "border-sky-400 bg-sky-500 bg-opacity-20 text-sky-200"
          : muted
            ? "border-slate-700 text-slate-500 hover:border-slate-500 hover:text-slate-300"
            : "border-slate-600 text-slate-300 hover:border-slate-400 hover:text-slate-100")
      }
    >
      {label}
    </button>
  );

  return (
    <>
      <button
        onClick={() => setOpen((o) => !o)}
        title="יועץ AI"
        className={
          "fixed bottom-4 right-4 z-50 flex h-12 w-12 items-center justify-center rounded-full shadow-lg transition-colors " +
          (open ? "bg-sky-400 text-slate-950" : "bg-sky-500 text-white hover:bg-sky-400")
        }
      >
        {open ? <X size={20} /> : <Bot size={22} />}
      </button>

      {open && (
        <div
          className="fixed bottom-20 right-4 z-40 flex w-80 max-w-[calc(100vw-2rem)] flex-col rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl"
          style={{ height: "68vh" }}
        >
          {/* Header */}
          <div className="flex items-center gap-2 border-b border-slate-700 px-4 py-3">
            <Bot size={16} className="text-sky-400" />
            <span className="flex-1 font-bold text-slate-100">יועץ AI</span>
            {insightsLoading && (
              <span className="text-[10px] text-slate-500 animate-pulse">טוען חדשות...</span>
            )}
            {!insightsLoading && teamInsights?.articles?.length > 0 && (
              <span title={`${teamInsights.articles.length} כתבות ESPN נטענו`} className="text-[10px] text-emerald-500">
                ✓ ESPN
              </span>
            )}
            <button
              onClick={() => { setMessages([]); setSelectedGame(null); }}
              title="נקה שיחה"
              className="text-slate-500 hover:text-slate-300"
            >
              <RefreshCw size={14} />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2" dir="rtl">
            {messages.length === 0 && (
              <p className="mt-4 text-center text-sm text-slate-500">
                בחר משחק למטה, לחץ על שאלה מהירה, או כתוב שאלה חופשית 🏆
              </p>
            )}
            {messages.map((m, i) => (
              <div
                key={i}
                className={
                  "max-w-[90%] rounded-xl px-3 py-2 text-sm whitespace-pre-wrap " +
                  (m.role === "user"
                    ? "self-start bg-sky-500 bg-opacity-20 text-sky-100"
                    : "self-end bg-slate-800 text-slate-200")
                }
              >
                {m.content}
              </div>
            ))}
            {loading && (
              <div className="self-end animate-pulse rounded-xl bg-slate-800 px-3 py-2 text-sm text-slate-400">
                ⏳ חושב...
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Game reference chips */}
          {gameChips.length > 0 && (
            <div className="border-t border-slate-700 px-3 pt-2 pb-1">
              <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wide text-slate-500">📅 משחקים</p>
              <div className="no-scrollbar flex gap-1.5 overflow-x-auto pb-1" dir="ltr">
                {gameChips.map((g) => (
                  <Chip
                    key={g.id}
                    label={`${tFlag(g.t1)} ${tFlag(g.t2)}`}
                    active={selectedGame?.id === g.id}
                    muted={g.done}
                    onClick={() => setSelectedGame(selectedGame?.id === g.id ? null : g)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Contextual question chips */}
          <div className="border-t border-slate-700 px-3 pt-2 pb-1">
            {selectedGame ? (
              <>
                <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wide text-sky-500">
                  {tFlag(selectedGame.t1)} {tName(selectedGame.t1)} נגד {tName(selectedGame.t2)} {tFlag(selectedGame.t2)}
                </p>
                <div className="no-scrollbar flex gap-1.5 overflow-x-auto pb-1" dir="rtl">
                  {AI_GAME_QS.map((q) => (
                    <Chip
                      key={q.label}
                      label={q.label}
                      onClick={() => sendMsg(q.build(tName(selectedGame.t1), tName(selectedGame.t2)))}
                    />
                  ))}
                </div>
              </>
            ) : (
              <>
                <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wide text-slate-500">💬 שאלות מהירות</p>
                <div className="no-scrollbar flex gap-1.5 overflow-x-auto pb-1" dir="rtl">
                  {AI_GENERAL_QS.map((q) => (
                    <Chip key={q.label} label={q.label} onClick={() => sendMsg(q.q)} />
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Input */}
          <div className="flex items-center gap-2 border-t border-slate-700 p-3">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMsg()}
              placeholder={selectedGame ? `שאל על ${tName(selectedGame.t1)} vs ${tName(selectedGame.t2)}…` : "שאל שאלה…"}
              disabled={loading}
              className="flex-1 rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 outline-none focus:border-sky-500 disabled:opacity-50"
              dir="rtl"
            />
            <button
              onClick={() => sendMsg()}
              disabled={loading || !input.trim() || !workerUrl}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-sky-500 text-slate-950 hover:bg-sky-400 disabled:opacity-40"
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}

/* ================= APP ================= */

const TABS = [
  { k: "table", labelKey: "tabTable", icon: Trophy },
  { k: "teams", labelKey: "tabTeams", icon: ListOrdered },
  { k: "bets", labelKey: "tabBets", icon: Target },
  { k: "draft", labelKey: "tabDraft", icon: Shuffle },
  { k: "sim", labelKey: "tabSim", icon: FlaskConical },
  { k: "manage", labelKey: "tabManage", icon: Settings },
  { k: "rules", labelKey: "tabRules", icon: BookOpen },
];

function LanguageToggle() {
  const { locale, locales, setLocale, t } = useLocale();
  return (
    <div className="flex items-center gap-1 rounded-full border border-slate-700 bg-slate-950/70 p-1" aria-label={t("language")}>
      <Languages size={14} className="mx-1 text-slate-500" />
      {Object.entries(locales).map(([key, info]) => (
        <button
          key={key}
          type="button"
          onClick={() => setLocale(key)}
          className={
            "rounded-full px-2 py-1 text-[11px] font-black transition-colors " +
            (locale === key ? "bg-sky-500 text-slate-950" : "text-slate-400 hover:text-slate-100")
          }
        >
          {info.short}
        </button>
      ))}
    </div>
  );
}

function DashboardOverview({ config, scores, teamRows, liveMatches, me }) {
  const { t } = useLocale();
  const leader = scores?.rows?.[0];
  const meRow = scores?.rows?.find((row) => row.p.id === me);
  const activeTeams = teamRows.filter((row) => row.canScoreMore).length;

  return (
    <div className="grid gap-3 md:grid-cols-4">
      <StatCard
        label={t("overviewLeader")}
        value={leader && leader.total > 0 ? leader.p.name : t("overviewLeaderFallback")}
        detail={leader && leader.total > 0 ? `${leader.total} ${t("lbTotal").toLowerCase()}` : undefined}
        tone="amber"
        icon={<Trophy size={18} />}
      />
      <StatCard
        label={t("overviewPlayers")}
        value={config.players.length}
        tone="sky"
        icon={<Users size={18} />}
      />
      <StatCard
        label={t("overviewActiveTeams")}
        value={activeTeams}
        detail={`${teamRows.length} ${t("teamsTotal").toLowerCase()}`}
        tone="emerald"
        icon={<ListOrdered size={18} />}
      />
      <StatCard
        label={t("overviewMyScore")}
        value={meRow ? meRow.total : "—"}
        detail={liveMatches.length ? `${liveMatches.length} ${t("overviewLive").toLowerCase()}` : t("noLiveMatches")}
        tone={liveMatches.length ? "emerald" : "slate"}
        icon={<Target size={18} />}
      />
    </div>
  );
}

function AppContent() {
  const { dir, locale, t } = useLocale();
  const [leagueId, setLeagueId] = useState(() =>
    typeof location !== "undefined" ? decodeURIComponent(location.hash.replace(/^#\/?/, "")) || null : null
  );
  const [loading, setLoading] = useState(true);
  const [config, setConfig] = useState(null);
  const [results, setResults] = useState({ g: {}, ko: {} });
  const [liveMeta, setLiveMeta] = useState({});
  const [betsAll, setBetsAll] = useState({});
  const [me, setMe] = useState(null);
  const [tab, setTab] = useState("table");
  const [connected, setConnected] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const onHash = () => setLeagueId(decodeURIComponent(location.hash.replace(/^#\/?/, "")) || null);
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  useEffect(() => subscribeConnected(setConnected), []);

  /* live subscriptions — everyone sees config, results and bets the moment they change */
  useEffect(() => {
    setConfig(null); setResults({ g: {}, ko: {} }); setLiveMeta({}); setBetsAll({}); setMe(null); setTab("table");
    if (!leagueId || !dbReady) { setLoading(false); return; }
    setLoading(true);
    const P = LP(leagueId);
    let first = false;
    const u1 = subscribe(P.config, (v) => {
      setConfig(normConfig(v));
      if (!first) { first = true; setLoading(false); }
    });
    const u2 = subscribe(P.results, (v) => setResults(normResults(v)));
    const u3 = subscribe(P.bets, (v) => {
      const o = {};
      Object.entries(v || {}).forEach(([pid, b]) => { o[pid] = normBets(b); });
      setBetsAll(o);
    });
    const u4 = subscribe(P.liveMeta, (v) => setLiveMeta(v || {}));
    setMe(localStorage.getItem(ME_KEY(leagueId)) || null);
    return () => { u1(); u2(); u3(); u4(); };
  }, [leagueId]);

  /* drop a stale identity if the player list changed */
  useEffect(() => {
    if (config && me && !config.players.some((p) => p.id === me)) setMe(null);
  }, [config, me]);

  const P = leagueId ? LP(leagueId) : null;
  const saveConfig = async (cfg) => { setConfig(normConfig(cfg)); await sSet(P.config, cfg); };
  const txConfig = (mutate) =>
    sTx(P.config, (raw) => {
      const next = mutate(normConfig(raw));
      return next === undefined ? undefined : next;
    });
  const saveResults = async (res) => {
    const nextMeta = applyManualOverrides({
      previousResults: results,
      nextResults: res,
      liveMeta,
      now: Date.now(),
    });
    setResults(res);
    setLiveMeta(nextMeta);
    await sUpdate(`leagues/${leagueId}`, {
      results: res,
      "liveMeta/g": nextMeta,
    });
  };
  const clearResultOverride = async (fixtureId) => {
    const nextMeta = clearManualOverride(liveMeta, fixtureId, Date.now());
    setLiveMeta(nextMeta);
    await sSet(`${P.liveMeta}/${fixtureId}`, nextMeta[fixtureId]);
  };
  const saveMyBets = async (bets) => {
    if (!me) return;
    setBetsAll((prev) => ({ ...prev, [me]: bets }));
    await sSet(P.bet(me), bets);
  };

  const createLeague = async (name, names) => {
    if (!dbReady) return;
    const lid = newLeagueId();
    const players = names.map((n, i) => ({ id: "p" + i + Date.now().toString(36), name: n }));
    const cfg = { name, players, assign: {}, draft: null, locks: { bracket: false }, created: Date.now() };
    await sSet(LP(lid).config, cfg);
    location.hash = lid;
  };

  const pickMe = (pid) => {
    setMe(pid);
    if (!leagueId) return;
    if (pid) localStorage.setItem(ME_KEY(leagueId), pid);
    else localStorage.removeItem(ME_KEY(leagueId));
  };

  const resetAll = async () => {
    if (leagueId) {
      await sDel(`leagues/${leagueId}`);
      localStorage.removeItem(ME_KEY(leagueId));
    }
    location.hash = "";
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch (e) {
      /* clipboard unavailable — the address bar still has the link */
    }
  };

  const scores = useMemo(() => (config ? computeScores(config, results, betsAll) : null), [config, results, betsAll]);
  const teamRows = useMemo(() => (config ? buildTeamTournamentRows(config, results) : []), [config, results]);
  const eliminatedTeams = useMemo(
    () => new Set(teamRows.filter((row) => row.eliminated).map((row) => row.team)),
    [teamRows],
  );
  const liveMatches = useMemo(
    () => selectLiveMatches({ results, liveMeta }),
    [results, liveMeta],
  );

  const meName = config?.players?.find((p) => p.id === me)?.name;

  useEffect(() => {
    if (typeof document === "undefined") return;
    document.title = config?.name ? `${config.name} · ${t("appTitleSuffix")}` : t("appTitle");
  }, [config?.name, locale, t]);

  return (
    <div dir={dir} className="app-matchday-bg min-h-screen pb-10 text-slate-100" style={{ fontFamily: "var(--font-sans)" }}>
      {/* host tricolor */}
      <div className="flex h-1">
        <div className="flex-1 bg-emerald-500" /><div className="flex-1 bg-rose-500" /><div className="flex-1 bg-sky-500" />
      </div>

      <header className="app-shell pb-3 pt-4">
        <Card className="hero-panel p-4 md:p-5">
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
            <div className="flex min-w-0 items-center gap-3">
              <HostMark />
              <div className="min-w-0">
                <Pill tone="sky" className="mb-2">{t("productKicker")}</Pill>
                <h1 className="truncate text-2xl font-black tracking-tight text-slate-50 md:text-3xl">
                  {config?.name || t("defaultLeague")}
                </h1>
                <HostFlags className="mt-2" />
                <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-400">{t("heroCopy")}</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-start gap-2 lg:justify-end">
              <LanguageToggle />
              {meName && (
                <button
                  onClick={() => pickMe(null)}
                  title={t("switchPlayer")}
                  className="flex items-center gap-1.5 rounded-full border border-slate-700 bg-slate-950/70 px-2.5 py-1.5 text-xs text-slate-300 transition-colors hover:border-slate-500"
                >
                  <Users size={12} /> {meName}
                </button>
              )}
              {leagueId && config && (
                <button
                  onClick={copyLink}
                  title={t("copyLeagueLink")}
                  className="flex items-center gap-1.5 rounded-full border border-slate-700 bg-slate-950/70 px-2.5 py-1.5 text-xs text-slate-300 transition-colors hover:border-slate-500"
                >
                  {copied ? <Check size={12} className="text-emerald-400" /> : <Link2 size={12} />}
                  {copied ? t("copied") : t("friendsLink")}
                </button>
              )}
              <span
                title={connected ? t("syncedLive") : t("disconnected")}
                className={"inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-xs font-bold " + (connected ? "border-emerald-800 bg-emerald-950/70 text-emerald-300" : "border-slate-800 bg-slate-950/70 text-slate-500")}
              >
                <span className="relative flex h-2 w-2 shrink-0">
                  {connected && <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />}
                  <span className={"relative inline-flex h-2 w-2 rounded-full " + (connected ? "bg-emerald-400" : "bg-slate-600")} />
                </span>
                {connected ? t("syncedLive") : t("disconnected")}
              </span>
            </div>
          </div>

          <div className="mt-4 overflow-x-auto pb-1">
            {liveMatches.length ? (
              <LiveMatchPills matches={liveMatches} className="flex w-max flex-row" />
            ) : (
              <Pill tone="slate">{t("noLiveMatches")}</Pill>
            )}
          </div>
        </Card>
      </header>

      {!dbReady && (
        <div className="app-shell mb-2">
          <div className="rounded-xl border border-amber-600 bg-amber-500 bg-opacity-10 px-3 py-2 text-xs text-amber-300">
            ⚠️ {t("firebaseMissing")}
          </div>
        </div>
      )}

      <main className="app-shell">
        {loading ? (
          <EmptyState title={t("loadingLeague")} />
        ) : !leagueId ? (
          <SetupScreen onCreate={createLeague} />
        ) : !config ? (
          <EmptyState
            title={t("openNewLeague")}
            body={t("leagueMissing")}
            action={<Button onClick={() => { location.hash = ""; }}>{t("openNewLeague")}</Button>}
          />
        ) : !me ? (
          <IdentityScreen players={config.players} onPick={pickMe} />
        ) : (
          <>
            {scores && (
              <div className="mb-4">
                <DashboardOverview
                  config={config}
                  scores={scores}
                  teamRows={teamRows}
                  liveMatches={liveMatches}
                  me={me}
                />
              </div>
            )}

            <nav className="mb-4 mt-2 flex gap-1 overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/85 p-1 shadow-[0_18px_60px_rgba(2,6,23,0.24)] backdrop-blur">
              {TABS.map((tabInfo) => (
                <button
                  key={tabInfo.k}
                  onClick={() => setTab(tabInfo.k)}
                  className={
                    "flex flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-xl px-2 py-2 text-xs font-bold transition-colors " +
                    (tab === tabInfo.k ? "bg-slate-700 text-slate-50" : "text-slate-400 hover:text-slate-200")
                  }
                >
                  <tabInfo.icon size={14} /> {t(tabInfo.labelKey)}
                </button>
              ))}
            </nav>

            <BracketPeekCtx.Provider value={betsAll}>
              <div className={tab === "table" ? "" : "hidden"}>
                {scores && <Leaderboard config={config} scores={scores} meId={me} eliminatedTeams={eliminatedTeams} />}
              </div>
            </BracketPeekCtx.Provider>
            <div className={tab === "teams" ? "" : "hidden"}>
              <TeamsTab config={config} rows={teamRows} />
            </div>
            <div className={tab === "bets" ? "" : "hidden"}>
              {scores && (
                <MyBets
                  me={me}
                  config={config}
                  results={results}
                  betsAll={betsAll}
                  reach={scores.reach}
                  eliminatedTeams={eliminatedTeams}
                  onSaveBets={saveMyBets}
                />
              )}
            </div>
            <div className={tab === "draft" ? "" : "hidden"}>
              <DraftTab config={config} meId={me} onSaveConfig={saveConfig} onTxConfig={txConfig} />
            </div>
            <div className={tab === "sim" ? "" : "hidden"}>
              <SimTab config={config} results={results} betsAll={betsAll} meId={me} />
            </div>
            <div className={tab === "manage" ? "" : "hidden"}>
              <ManageTab
                config={config} results={results} liveMeta={liveMeta}
                onSaveConfig={saveConfig} onSaveResults={saveResults}
                onClearManualOverride={clearResultOverride} onResetAll={resetAll}
              />
            </div>
            <div className={tab === "rules" ? "" : "hidden"}>
              <RulesTab />
            </div>
          </>
        )}
      </main>
      {config?.ai?.enabled && me && (
        <AiChat config={config} results={results} betsAll={betsAll} me={me} liveMeta={liveMeta} />
      )}
    </div>
  );
}
