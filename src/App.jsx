import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  Trophy, RefreshCw, Check, X, Plus, Trash2, ChevronDown, ChevronLeft,
  Lock, Unlock, Users, Target, Shuffle, Settings, BookOpen, Undo2, AlertTriangle, Pencil, FlaskConical, Link2,
  Bot, Send, MessageSquare,
} from "lucide-react";
import { dbReady, sSet, sUpdate, sDel, sTx, subscribe, subscribeConnected } from "./db";
import { syncBetsDraft } from "./betsDraft";
import { selectLiveMatches } from "./liveHeader";
import { applyManualOverrides, clearManualOverride } from "./liveResults";
import {
  ALL_GROUP_FIXTURES,
  ALL_TEAMS,
  GROUP_KEYS,
  GROUPS,
  groupFixtures,
} from "./worldCupData";

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
          workerUrl: c.ai?.workerUrl || "",
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
  const koArr = Object.entries(results?.ko || {}).map(([id, m]) => ({ id, ...m }));

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

    // ---- part 1: draft ----
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
    });

    // ---- part 2a: group-stage match bets ----
    let mGroup = 0;
    Object.entries(gRes).forEach(([id, r]) => {
      if (my.g && my.g[id] === outcomeOf(r)) mGroup += 1;
    });

    // ---- part 2b: knockout bets ----
    let mKo = 0;
    koArr.forEach((m) => {
      if (!m.w) return;
      const b = my.ko && my.ko[m.id];
      if (b && b.t === m.w) {
        mKo += 1;
        if (m.p && b.p === m.p) mKo += 1; // bonus only if the team was right too
      }
    });

    // ---- part 3: bracket predictions (cumulative by construction) ----
    let bracket = 0;
    const tierHits = {};
    TIERS.forEach((tier) => {
      const picks = (my.br && my.br[tier.k]) || [];
      const hits = picks.filter((t) => reach[tier.k].has(t)).length;
      tierHits[tier.k] = hits;
      bracket += hits * tier.pts;
    });

    return {
      p, myTeams, draft, mGroup, mKo,
      matches: mGroup + mKo, bracket, tierHits,
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
const TName = ({ code }) => <span>{T[code]?.[0] || code}</span>;

function LiveMatchPills({ matches, className = "" }) {
  if (!matches.length) return null;

  return (
    <div
      className={"gap-1.5 " + className}
      role="status"
      aria-live="polite"
      aria-label="משחקים חיים"
    >
      {matches.map((match) => (
        <div
          key={match.id}
          className="flex shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-full border border-emerald-800 bg-emerald-950 px-2.5 py-1 text-[10px] shadow-sm shadow-emerald-950"
        >
          <span className="flex items-center gap-1 font-black text-emerald-300">
            <span className="h-1.5 w-1.5 rounded-full bg-red-500 shadow-sm shadow-red-500" />
            {match.displayClock ? `LIVE · ${match.displayClock}` : "LIVE"}
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

function TeamChip({ code, on, off, onClick, disabled, mark }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={
        "flex items-center gap-1 rounded-full border px-2 py-1 text-xs transition-colors " +
        (on
          ? "border-sky-400 bg-sky-500 bg-opacity-20 text-sky-200"
          : off
            ? "border-slate-800 text-slate-600"
            : "border-slate-700 text-slate-300 hover:border-slate-500") +
        (disabled ? " cursor-default" : "")
      }
    >
      <Flag code={code} />
      <TName code={code} />
      {mark === "hit" && <Check size={12} className="text-emerald-400" />}
      {mark === "miss" && <X size={12} className="text-rose-400" />}
    </button>
  );
}

function Section({ title, sub, children, defaultOpen = false, badge }) {
  const [open, setOpen] = useState(defaultOpen);
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
  const [names, setNames] = useState(["", "", "", ""]);
  const [leagueName, setLeagueName] = useState("ליגת החברים");
  const [busy, setBusy] = useState(false);
  const valid = names.map((n) => n.trim()).filter(Boolean);

  return (
    <div className="mx-auto max-w-md py-8">
      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
        <h2 className="mb-1 text-lg font-black text-slate-100">פתיחת ליגה חדשה</h2>
        <p className="mb-4 text-sm text-slate-400">
          מוסיפים את כל החברים פעם אחת — וכל אחד שייכנס לאפליקציה יבחר מי הוא.
        </p>
        <label className="mb-1 block text-xs text-slate-500">שם הליגה</label>
        <input
          value={leagueName}
          onChange={(e) => setLeagueName(e.target.value)}
          className="mb-4 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-sky-500"
        />
        <label className="mb-1 block text-xs text-slate-500">שחקנים</label>
        <div className="flex flex-col gap-2">
          {names.map((n, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                value={n}
                placeholder={"שחקן " + (i + 1)}
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
          <Plus size={14} /> עוד שחקן
        </button>
        <button
          disabled={valid.length < 2 || busy}
          onClick={async () => {
            setBusy(true);
            await onCreate(leagueName.trim() || "ליגת החברים", valid);
            setBusy(false);
          }}
          className="mt-5 w-full rounded-xl bg-sky-500 py-2.5 font-bold text-slate-950 hover:bg-sky-400 disabled:opacity-40"
        >
          {busy ? "יוצר…" : "צא לדרך ⚽"}
        </button>
        <p className="mt-3 text-center text-xs text-slate-500">
          יש לכם כבר ליגה? פתחו את הקישור ששותף בקבוצה — הוא מכיל את קוד הליגה.
        </p>
      </div>
    </div>
  );
}

function IdentityScreen({ players, onPick }) {
  return (
    <div className="mx-auto max-w-md py-10 text-center">
      <h2 className="mb-1 text-lg font-black text-slate-100">מי אתה?</h2>
      <p className="mb-5 text-sm text-slate-400">הבחירה נשמרת רק במכשיר שלך</p>
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

function Leaderboard({ config, scores, meId }) {
  const [openId, setOpenId] = useState(null);
  const locked = config?.locks?.bracket;
  return (
    <div className="flex flex-col gap-2">
      <div className="grid grid-cols-12 px-3 text-xs text-slate-500">
        <div className="col-span-4">שחקן</div>
        <div className="col-span-2 text-center">דראפט</div>
        <div className="col-span-2 text-center">משחקים</div>
        <div className="col-span-2 text-center">עולות</div>
        <div className="col-span-2 text-center">סה״כ</div>
      </div>
      {scores.rows.map((r, rank) => {
        const pIdx = config.players.findIndex((x) => x.id === r.p.id);
        const isMe = r.p.id === meId;
        const open = openId === r.p.id;
        return (
          <div key={r.p.id} className={"rounded-2xl border bg-slate-900 " + (rank === 0 && r.total > 0 ? "border-amber-400" : "border-slate-800")}>
            <button onClick={() => setOpenId(open ? null : r.p.id)} className="grid w-full grid-cols-12 items-center px-3 py-3 text-right">
              <div className="col-span-4 flex items-center gap-2 overflow-hidden">
                <span className={"w-4 font-mono text-xs " + (rank === 0 && r.total > 0 ? "text-amber-300" : "text-slate-500")}>{rank + 1}</span>
                <PlayerDot player={r.p} idx={pIdx} />
                <span className="truncate text-sm font-bold text-slate-100">{r.p.name}</span>
                {isMe && <span className="rounded-full bg-slate-800 px-2 py-0.5 text-xs font-bold text-sky-300">אני</span>}
              </div>
              <div className="col-span-2 text-center font-mono text-sm text-slate-300">{r.draft}</div>
              <div className="col-span-2 text-center font-mono text-sm text-slate-300">{r.matches}</div>
              <div className="col-span-2 text-center font-mono text-sm text-slate-300">{r.bracket}</div>
              <div className={"col-span-2 text-center font-mono text-lg font-bold " + (rank === 0 && r.total > 0 ? "text-amber-300" : "text-slate-100")}>
                {r.total}
              </div>
            </button>
            {open && (
              <div className="border-t border-slate-800 px-3 py-3 text-sm">
                <div className="mb-1 text-xs text-slate-500">הנבחרות בדראפט:</div>
                <div className="flex flex-wrap gap-1.5">
                  {r.myTeams.length === 0 && <span className="text-xs text-slate-600">עוד לא שובצו נבחרות</span>}
                  {r.myTeams.map((t) => (
                    <span key={t} className="flex items-center gap-1 rounded-full border border-slate-700 px-2 py-0.5 text-xs text-slate-300">
                      <Flag code={t} /><TName code={t} />
                    </span>
                  ))}
                </div>
                {locked && (
                  <div className="mt-3 text-xs text-slate-400">
                    <span className="text-slate-500">ניחוש אלופה: </span>
                    {r.p.id && (config && true) ? <BracketPeek pid={r.p.id} /> : null}
                  </div>
                )}
                <div className="mt-2 text-xs text-slate-500">
                  פירוט משחקים: {r.mGroup} נק׳ בתים · {r.mKo} נק׳ נוקאאוט
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
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

function BracketEditor({ draft, setDraft, locked, reach, hasAnyKoResults }) {
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
                        mark={hasAnyKoResults && picks.includes(t) ? (reach[tier.k].has(t) ? "hit" : undefined) : undefined}
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
    Object.entries(results.ko || {}).forEach(([id, m]) => {
      (map[m.round] = map[m.round] || []).push({ id, ...m });
    });
    Object.values(map).forEach((arr) => arr.sort((a, b) => a.id.localeCompare(b.id)));
    return map;
  }, [results]);

  const anyMatches = Object.keys(results.ko || {}).length > 0;

  if (!anyMatches)
    return (
      <div className="rounded-xl border border-dashed border-slate-700 p-4 text-center text-sm text-slate-500">
        עדיין אין משחקי נוקאאוט. ברגע שההצלבות ייקבעו, מנהל הליגה יוסיף אותם במסך הניהול — וכאן תוכלו להמר מי עולה ואיך.
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
              const setB = (patch) =>
                setDraft((prev) => {
                  const nko = { ...(prev.ko || {}) };
                  const cur = { ...(nko[m.id] || {}), ...patch };
                  if (!cur.t && !cur.p) delete nko[m.id]; else nko[m.id] = cur;
                  return { ...prev, ko: nko };
                });
              const TeamBtn = ({ t }) => (
                <button
                  disabled={done}
                  onClick={() => setB({ t: b.t === t ? null : t })}
                  className={
                    "flex flex-1 items-center justify-center gap-1.5 truncate rounded-lg border px-2 py-1.5 text-xs " +
                    (done && m.w === t
                      ? "border-emerald-500 bg-emerald-500 bg-opacity-20 text-emerald-300"
                      : b.t === t
                        ? "border-sky-400 bg-sky-500 bg-opacity-20 text-sky-200"
                        : "border-slate-700 text-slate-300" + (done ? "" : " hover:border-slate-500"))
                  }
                >
                  <Flag code={t} /><TName code={t} />
                </button>
              );
              const PerBtn = ({ v, label }) => (
                <button
                  disabled={done}
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
                    <TeamBtn t={m.t1} />
                    <span className="text-xs text-slate-600">⚔️</span>
                    <TeamBtn t={m.t2} />
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

function MyBets({ me, config, results, betsAll, reach, onSaveBets }) {
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
  const hasAnyKoResults = Object.values(results.ko || {}).some((m) => m.w);

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
        <BracketEditor draft={draft} setDraft={setDraft} locked={locked} reach={reach} hasAnyKoResults={hasAnyKoResults} />
      </Section>
      <Section title="הימורי שלב הבתים" sub={groupsLocked ? "נעול 🔒" : "נק׳ אחת לכל פגיעה"}>
        <GroupBets draft={draft} setDraft={setDraft} results={results} othersFor={othersFor} locked={groupsLocked} />
      </Section>
      <Section title="הימורי נוקאאוט" sub="עולה נכונה 1 + בונוס דרך 1" defaultOpen={Object.keys(results.ko || {}).length > 0}>
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
                  onClick={() => setOrder((o) => { const n = [...o]; [n[i - 1], n[i]] = [n[i], n[i - 1]]; return n; })}
                  className="text-slate-500 disabled:opacity-20"
                >▲</button>
                <button
                  disabled={i === order.length - 1}
                  onClick={() => setOrder((o) => { const n = [...o]; [n[i + 1], n[i]] = [n[i], n[i + 1]]; return n; })}
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
        <TeamGrid onTeam={draft && draft.active ? pickTeam : () => {}} highlightFree={!!(draft && draft.active)} />
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

  const patchKo = (id, patch) =>
    setResDraft((prev) => ({ ...prev, ko: { ...prev.ko, [id]: { ...prev.ko[id], ...patch } } }));
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
          <div className="mb-2 text-xs font-bold text-slate-300">הוספת משחק (כשההצלבה נקבעת)</div>
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
            const ms = Object.entries(resDraft.ko || {}).filter(([, m]) => m.round === r.k).sort((a, b) => a[0].localeCompare(b[0]));
            if (ms.length === 0) return null;
            return (
              <div key={r.k}>
                <div className="mb-1 text-xs font-bold text-slate-400">{r.n}</div>
                <div className="flex flex-col gap-1.5">
                  {ms.map(([id, m]) => (
                    <div key={id} className="rounded-xl border border-slate-800 bg-slate-950 p-2">
                      <div className="flex items-center gap-1.5">
                        {[m.t1, m.t2].map((t) => (
                          <button
                            key={t}
                            onClick={() => patchKo(id, { w: m.w === t ? null : t })}
                            className={
                              "flex flex-1 items-center justify-center gap-1 truncate rounded-lg border px-2 py-1.5 text-xs " +
                              (m.w === t ? "border-emerald-500 bg-emerald-500 bg-opacity-20 text-emerald-300" : "border-slate-700 text-slate-300 hover:border-slate-500")
                            }
                          >
                            <Flag code={t} /><TName code={t} /> {m.w === t && "🏆"}
                          </button>
                        ))}
                        <button onClick={() => delKo(id)} className="shrink-0 text-slate-600 hover:text-rose-400"><Trash2 size={14} /></button>
                      </div>
                      <div className="mt-1.5 flex items-center gap-1.5">
                        <span className="text-xs text-slate-500">הוכרע:</span>
                        {[["90", "ב־90 דק׳"], ["et", "הארכה/פנדלים"]].map(([v, label]) => (
                          <button
                            key={v}
                            onClick={() => patchKo(id, { p: m.p === v ? null : v })}
                            className={
                              "flex-1 rounded-lg border px-2 py-1 text-xs " +
                              (m.p === v ? "border-emerald-500 text-emerald-300" : "border-slate-700 text-slate-400 hover:border-slate-500")
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
            <label className="text-xs text-slate-400">כתובת Worker (מ-Cloudflare) — נדרש גם ANTHROPIC_API_KEY כ-secret</label>
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

/* ---- official FIFA 2026 bracket (match numbers 73–104) ---- */
const R32_SLOTS = [
  { m: 73, a: "2A", b: "2B" }, { m: 74, a: "1E", b: "3ABCDF" },
  { m: 75, a: "1F", b: "2C" }, { m: 76, a: "1C", b: "2F" },
  { m: 77, a: "1I", b: "3CDFGH" }, { m: 78, a: "2E", b: "2I" },
  { m: 79, a: "1A", b: "3CEFHI" }, { m: 80, a: "1L", b: "3EHIJK" },
  { m: 81, a: "1D", b: "3BEFIJ" }, { m: 82, a: "1G", b: "3AEHIJ" },
  { m: 83, a: "2K", b: "2L" }, { m: 84, a: "1H", b: "2J" },
  { m: 85, a: "1B", b: "3EFGIJ" }, { m: 86, a: "1J", b: "2H" },
  { m: 87, a: "1K", b: "3DEIJL" }, { m: 88, a: "2D", b: "2G" },
];
const NEXT_ROUNDS = [
  { k: "r16", slots: [{ m: 89, a: 74, b: 77 }, { m: 90, a: 73, b: 75 }, { m: 91, a: 76, b: 78 }, { m: 92, a: 79, b: 80 }, { m: 93, a: 83, b: 84 }, { m: 94, a: 81, b: 82 }, { m: 95, a: 86, b: 88 }, { m: 96, a: 85, b: 87 }] },
  { k: "qf", slots: [{ m: 97, a: 89, b: 90 }, { m: 98, a: 93, b: 94 }, { m: 99, a: 91, b: 92 }, { m: 100, a: 95, b: 96 }] },
  { k: "sf", slots: [{ m: 101, a: 97, b: 98 }, { m: 102, a: 99, b: 100 }] },
];

/* qualified thirds → third slots, respecting each slot's allowed groups (augmenting-path matching) */
function assignThirds(qualified, slots) {
  const taken = Array(slots.length).fill(null);
  const tryAssign = (grp, visited) => {
    for (let s = 0; s < slots.length; s++) {
      if (visited.has(s) || !slots[s].allowed.includes(grp)) continue;
      visited.add(s);
      if (taken[s] == null || tryAssign(taken[s], visited)) { taken[s] = grp; return true; }
    }
    return false;
  };
  qualified.forEach((grp) => tryAssign(grp, new Set()));
  const map = {};
  taken.forEach((grp, s) => { if (grp) map[slots[s].m] = grp; });
  return map;
}

const sameM = (x, y) =>
  x.round === y.round && x.t1 === y.t1 && x.t2 === y.t2 &&
  (x.w || null) === (y.w || null) && (x.p || null) === (y.p || null);
const koEqual = (a, b) => {
  const ka = Object.keys(a).sort(), kb = Object.keys(b).sort();
  return ka.length === kb.length && ka.every((k, i) => kb[i] === k && sameM(a[k], b[k]));
};

/* (re)derive the scenario's knockout tree from group standings + chosen winners.
   real / manually-added matches are adopted into slots when they fit; only sim-b-* ids are managed. */
function deriveBracket(sim) {
  const baseKo = {};
  Object.entries(sim.ko).forEach(([id, m]) => { if (!id.startsWith("sim-b-")) baseKo[id] = { ...m }; });
  const qual = computeQualification(sim.g);
  if (!qual.complete) {
    return { ko: koEqual(baseKo, sim.ko) ? sim.ko : baseKo, refs: {} };
  }

  const thirdSlots = R32_SLOTS.filter((s) => s.b[0] === "3").map((s) => ({ m: s.m, allowed: s.b.slice(1).split("") }));
  const thirdMap = assignThirds(qual.thirdsRanked.slice(0, 8).map((x) => x.g), thirdSlots);
  const teamOf = (tok, m) =>
    tok[0] === "1" ? qual.st[tok[1]].order[0]
      : tok[0] === "2" ? qual.st[tok[1]].order[1]
        : thirdMap[m] ? qual.st[thirdMap[m]].order[2] : null;

  const out = { ...baseKo };
  const refOf = {};
  const findExisting = (rk, tA, tB) => {
    const es = Object.entries(baseKo).filter(([, m]) => m.round === rk);
    const used = new Set(Object.values(refOf));
    const setEq = es.find(([id, m]) => !used.has(id) && ((m.t1 === tA && m.t2 === tB) || (m.t1 === tB && m.t2 === tA)));
    if (setEq) return setEq[0];
    const anchor = es.find(([id, m]) => !used.has(id) && (m.t1 === tA || m.t2 === tA || m.t1 === tB || m.t2 === tB));
    return anchor ? anchor[0] : null;
  };
  const ensure = (rk, m, tA, tB) => {
    if (!tA || !tB) return;
    const existing = findExisting(rk, tA, tB);
    if (existing) { refOf[m] = existing; return; }
    const id = "sim-b-" + m;
    const prev = sim.ko[id];
    out[id] = prev && ((prev.t1 === tA && prev.t2 === tB) || (prev.t1 === tB && prev.t2 === tA))
      ? { ...prev }
      : { round: rk, t1: tA, t2: tB, w: null, p: null };
    refOf[m] = id;
  };
  const winnerOf = (m) => { const mm = refOf[m] && out[refOf[m]]; return mm && mm.w ? mm.w : null; };
  const loserOf = (m) => { const mm = refOf[m] && out[refOf[m]]; return mm && mm.w ? (mm.w === mm.t1 ? mm.t2 : mm.t1) : null; };

  R32_SLOTS.forEach((s) => ensure("r32", s.m, teamOf(s.a, s.m), teamOf(s.b, s.m)));
  NEXT_ROUNDS.forEach(({ k, slots }) => slots.forEach((s) => ensure(k, s.m, winnerOf(s.a), winnerOf(s.b))));
  ensure("f", 104, winnerOf(101), winnerOf(102));
  ensure("p3", 103, loserOf(101), loserOf(102));

  return { ko: koEqual(out, sim.ko) ? sim.ko : out, refs: refOf };
}
function buildBracketKo(sim) { return deriveBracket(sim).ko; }

/* tree-chart layout: column order follows the official progression so siblings sit adjacent */
const TREE_COLS = [
  { k: "r32", n: "שלב ה־32", ms: [74, 77, 73, 75, 83, 84, 81, 82, 76, 78, 79, 80, 86, 88, 85, 87] },
  { k: "r16", n: "שמינית", ms: [89, 90, 93, 94, 91, 92, 95, 96] },
  { k: "qf", n: "רבע גמר", ms: [97, 98, 99, 100] },
  { k: "sf", n: "חצי גמר", ms: [101, 102] },
  { k: "f", n: "הגמר", ms: [104] },
];
const FEED = {
  89: [74, 77], 90: [73, 75], 91: [76, 78], 92: [79, 80],
  93: [83, 84], 94: [81, 82], 95: [86, 88], 96: [85, 87],
  97: [89, 90], 98: [93, 94], 99: [91, 92], 100: [95, 96],
  101: [97, 98], 102: [99, 100], 104: [101, 102], 103: [101, 102],
};

/* ================= TREE CHART ================= */

function TreeChart({ sim, refs, realKo, patchKo }) {
  const fMatch = refs[104] && sim.ko[refs[104]];
  const champion = fMatch && fMatch.w ? fMatch.w : null;
  const Card = ({ m }) => {
    const id = refs[m];
    const mm = id && sim.ko[id];
    if (!mm) {
      const fd = FEED[m];
      return (
        <div className="flex w-28 flex-col items-center justify-center rounded-lg border border-dashed border-slate-800 px-1.5 py-1.5 text-xs text-slate-700">
          <span>מנצחות</span>
          <span className="font-mono" dir="ltr">{fd ? `${fd[0]} · ${fd[1]}` : "—"}</span>
        </div>
      );
    }
    const locked = !!realKo[id]?.w;
    return (
      <div className="w-28 overflow-hidden rounded-lg border border-slate-800 bg-slate-950">
        {[mm.t1, mm.t2].map((t) => (
          <button
            key={t} disabled={locked}
            onClick={() => patchKo(id, { w: mm.w === t ? null : t })}
            className={
              "flex w-full items-center gap-1 px-1.5 py-0.5 text-right text-xs " +
              (mm.w === t
                ? locked
                  ? "bg-emerald-500 bg-opacity-20 font-bold text-emerald-200"
                  : "bg-sky-500 bg-opacity-20 font-bold text-sky-100"
                : mm.w ? "text-slate-600" : "text-slate-300 hover:bg-slate-800")
            }
          >
            <Flag code={t} /><span className="truncate">{T[t][0]}</span>
          </button>
        ))}
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
                {col.ms.map((m) => <Card key={m} m={m} />)}
              </div>
              {col.k === "f" && (
                <div className="pt-3">
                  <div className="mb-1 text-center text-xs text-slate-600">מקום שלישי</div>
                  <Card m={103} />
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
      const ko = buildBracketKo(s);
      return ko === s.ko ? s : { ...s, ko };
    });
  }, [sim]);
  const [newKo, setNewKo] = useState({ round: "r32", t1: "", t2: "" });
  const qual = useMemo(() => computeQualification(sim.g), [sim.g]);
  const bracketRefs = useMemo(() => deriveBracket(sim).refs, [sim]);

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
  const patchKo = (id, patch) => {
    if (realKo[id]?.w) return;
    setSim((s) => ({ ...s, ko: { ...s.ko, [id]: { ...s.ko[id], ...patch } } }));
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

  const koList = Object.entries(sim.ko).map(([id, m]) => ({ id, ...m }));
  const roundOrder = Object.fromEntries(KO_ROUNDS.map((r, i) => [r.k, i]));
  const mNum = (id) => (id.startsWith("sim-b-") ? +id.slice(6) : 999);
  koList.sort((a, b) =>
    (roundOrder[a.round] ?? 9) - (roundOrder[b.round] ?? 9) ||
    mNum(a.id) - mNum(b.id) ||
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
          תוצאות אמיתיות שכבר הוזנו נעולות (בירוק). כל השאר אפשר למלא כרצונכם ולראות איך הטבלה משתנה לפי ההימורים של כולם. כשכל הבתים מלאים, נבנה אוטומטית עץ נוקאאוט שלם לפי המסלול הרשמי — מי עולה מכל בית, השלישיות הטובות, ומשחק אחר משחק עד הגמר. הסימולציה מקומית בלבד — לא נשמרת ולא משפיעה על הליגה.
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
            עץ הנוקאאוט ייבנה אוטומטית לפי המסלול הרשמי ברגע שכל 72 משחקי הבתים ימולאו — "מלא לפי ההימורים שלי" עושה את רוב העבודה.
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
        {!qual.complete ? (
          <p className="text-xs text-slate-600">העץ יופיע כשכל 72 משחקי הבתים ימולאו.</p>
        ) : (
          <TreeChart sim={sim} refs={bracketRefs} realKo={realKo} patchKo={patchKo} />
        )}
      </Section>

      <Section title="נוקאאוט — תרחיש" sub="העץ נבנה לבד מהבתים; בחרו מנצחת והסיבוב הבא ייווצר" defaultOpen>
        <div className="flex flex-col gap-2">
          {koList.length === 0 && (
            <p className="text-xs text-slate-600">
              עדיין אין משחקי נוקאאוט בתרחיש — מלאו את כל הבתים והעץ יופיע כאן, או הוסיפו משחק ידנית למטה.
            </p>
          )}
          {koList.map((m) => {
            const isReal = !!realKo[m.id];
            const isAuto = m.id.startsWith("sim-b-");
            const locked = !!realKo[m.id]?.w;
            return (
              <div key={m.id} className="rounded-xl border border-slate-800 bg-slate-950 p-2.5">
                <div className="mb-1.5 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-400">
                    {roundName(m.round)}
                    {isAuto && <span className="mr-1.5 font-mono text-slate-600">· משחק {m.id.slice(6)}</span>}
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
                  {[m.t1, m.t2].map((t) => (
                    <button
                      key={t} disabled={locked}
                      onClick={() => patchKo(m.id, { w: m.w === t ? null : t })}
                      className={
                        "flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs " +
                        (m.w === t
                          ? locked
                            ? "border-emerald-500 bg-emerald-500 bg-opacity-20 text-emerald-200"
                            : "border-sky-400 bg-sky-500 bg-opacity-20 text-sky-100"
                          : locked ? "border-slate-800 text-slate-600" : "border-slate-700 text-slate-300 hover:border-slate-500")
                      }
                    >
                      <Flag code={t} /><TName code={t} /> {m.w === t && "🏆"}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-1.5">
                  {[["90", "ב־90 דק׳"], ["et", "הארכה/פנדלים"]].map(([v, n]) => (
                    <button
                      key={v} disabled={locked}
                      onClick={() => patchKo(m.id, { p: m.p === v ? null : v })}
                      className={
                        "rounded-lg border px-2 py-0.5 text-xs " +
                        (m.p === v
                          ? locked
                            ? "border-emerald-500 text-emerald-300"
                            : "border-sky-400 text-sky-200"
                          : locked ? "border-slate-800 text-slate-700" : "border-slate-700 text-slate-400 hover:border-slate-500")
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

function AiChat({ config, results, betsAll, me }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedGame, setSelectedGame] = useState(null);
  const bottomRef = useRef(null);

  const workerUrl = config?.ai?.workerUrl?.replace(/\/+$/, "");

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
    const groupResults = Object.entries(results.g || {})
      .map(([id, score]) => `${id}:${score}`)
      .join(", ") || "טרם שוחקו";
    const koResults = Object.entries(results.ko || {})
      .map(([, m]) => `${m.t1} vs ${m.t2}${m.w ? ` → ${m.w}` : ""}`)
      .join(", ") || "אין עדיין";
    const myBetsStr = Object.entries(betsAll[me]?.g || {})
      .map(([id, v]) => `${id}:${v}`)
      .join(", ") || "אין הימורים";

    return `אתה יועץ הימורים מקצועי לגביע העולם 2026. ענה תמיד בעברית.

נתוני הטורניר:
• תוצאות שלב הבתים: ${groupResults}
• נוקאאוט: ${koResults}
• הימורי השחקן: ${myBetsStr}

כשנשאלים על משחק ספציפי, ענה תמיד במבנה הבא:
🎯 המלצה: [1 / תיקו / 2 או שם הקבוצה]
💪 נימוקים:
• [נימוק 1]
• [נימוק 2]
• [נימוק 3 אם רלוונטי]
⚠️ רמת ביטחון: גבוה / בינוני / נמוך
💡 טיפ: [מידע נוסף חשוב]

לשאלות כלליות — תמציתי, עם נקודות ענייניות.`;
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
  { k: "table", n: "טבלה", icon: Trophy },
  { k: "bets", n: "ההימורים שלי", icon: Target },
  { k: "draft", n: "דראפט", icon: Shuffle },
  { k: "sim", n: "סימולציה", icon: FlaskConical },
  { k: "manage", n: "ניהול", icon: Settings },
  { k: "rules", n: "חוקים", icon: BookOpen },
];

export default function App() {
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
  const liveMatches = useMemo(
    () => selectLiveMatches({ results, liveMeta }),
    [results, liveMeta],
  );

  const meName = config?.players?.find((p) => p.id === me)?.name;

  return (
    <div dir="rtl" className="min-h-screen bg-slate-950 pb-10 text-slate-100" style={{ fontFamily: "system-ui, -apple-system, 'Segoe UI', sans-serif" }}>
      {/* host tricolor */}
      <div className="flex h-1">
        <div className="flex-1 bg-emerald-500" /><div className="flex-1 bg-rose-500" /><div className="flex-1 bg-sky-500" />
      </div>

      <header className="mx-auto max-w-3xl px-4 pb-2 pt-4">
        <div className="flex items-center justify-between gap-3 md:grid md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]">
          <div className="min-w-0">
            <h1 className="truncate text-xl font-black tracking-tight text-slate-50">
              {config?.name || "מונדיאל 2026"} <span className="text-base">🇺🇸🇨🇦🇲🇽</span>
            </h1>
            <p className="text-xs text-slate-500">ליגת הימורים · מונדיאל 2026</p>
          </div>

          <LiveMatchPills
            matches={liveMatches}
            className="hidden max-w-xs flex-col md:flex"
          />

          <div className="flex items-center justify-end gap-2">
            {meName && (
              <button
                onClick={() => pickMe(null)}
                title="החלפת שחקן"
                className="flex items-center gap-1.5 rounded-full border border-slate-700 px-2.5 py-1 text-xs text-slate-300 hover:border-slate-500"
              >
                <Users size={12} /> {meName}
              </button>
            )}
            {leagueId && config && (
              <button
                onClick={copyLink}
                title="העתקת קישור הליגה"
                className="flex items-center gap-1.5 rounded-full border border-slate-700 px-2.5 py-1 text-xs text-slate-300 hover:border-slate-500"
              >
                {copied ? <Check size={12} className="text-emerald-400" /> : <Link2 size={12} />}
                {copied ? "הועתק!" : "קישור לחברים"}
              </button>
            )}
            {connected ? (
              <span title="מסונכרן חי" className="relative flex h-2 w-2 shrink-0">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
              </span>
            ) : (
              <span title="מנותק" className="h-2 w-2 shrink-0 rounded-full bg-slate-600" />
            )}
          </div>
        </div>

        <div className="-mx-1 mt-2 overflow-x-auto px-1 pb-1 md:hidden">
          <LiveMatchPills matches={liveMatches} className="flex w-max flex-row" />
        </div>
      </header>

      {!dbReady && (
        <div className="mx-auto mb-2 max-w-3xl px-4">
          <div className="rounded-xl border border-amber-600 bg-amber-500 bg-opacity-10 px-3 py-2 text-xs text-amber-300">
            ⚠️ חסרה הגדרת Firebase — מלאו את קובץ ‎.env‎ לפי ההוראות ב־README והפעילו מחדש.
          </div>
        </div>
      )}

      <main className="mx-auto max-w-3xl px-4">
        {loading ? (
          <div className="py-20 text-center text-slate-500">טוען את הליגה…</div>
        ) : !leagueId ? (
          <SetupScreen onCreate={createLeague} />
        ) : !config ? (
          <div className="mx-auto max-w-md py-16 text-center">
            <p className="mb-4 text-sm text-slate-400">הליגה לא נמצאה — ייתכן שהקישור שגוי או שהיא אופסה.</p>
            <button
              onClick={() => { location.hash = ""; }}
              className="rounded-xl bg-sky-500 px-5 py-2 font-bold text-slate-950 hover:bg-sky-400"
            >
              פתיחת ליגה חדשה
            </button>
          </div>
        ) : !me ? (
          <IdentityScreen players={config.players} onPick={pickMe} />
        ) : (
          <>
            <nav className="mb-4 mt-2 flex gap-1 overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900 p-1">
              {TABS.map((t) => (
                <button
                  key={t.k}
                  onClick={() => setTab(t.k)}
                  className={
                    "flex flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-xl px-2 py-2 text-xs font-bold transition-colors " +
                    (tab === t.k ? "bg-slate-700 text-slate-50" : "text-slate-400 hover:text-slate-200")
                  }
                >
                  <t.icon size={14} /> {t.n}
                </button>
              ))}
            </nav>

            <BracketPeekCtx.Provider value={betsAll}>
              <div className={tab === "table" ? "" : "hidden"}>
                {scores && <Leaderboard config={config} scores={scores} meId={me} />}
              </div>
            </BracketPeekCtx.Provider>
            <div className={tab === "bets" ? "" : "hidden"}>
              {scores && (
                <MyBets me={me} config={config} results={results} betsAll={betsAll} reach={scores.reach} onSaveBets={saveMyBets} />
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
        <AiChat config={config} results={results} betsAll={betsAll} me={me} />
      )}
    </div>
  );
}
