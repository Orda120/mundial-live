/* @ds-bundle: {"format":3,"namespace":"Mundial2026LeagueDesignSystem_4cb07a","components":[{"name":"Badge","sourcePath":"components/core/Badge.jsx"},{"name":"Button","sourcePath":"components/core/Button.jsx"},{"name":"Card","sourcePath":"components/core/Card.jsx"},{"name":"ConnectionDot","sourcePath":"components/core/ConnectionDot.jsx"},{"name":"TEAMS","sourcePath":"components/core/Flag.jsx"},{"name":"Flag","sourcePath":"components/core/Flag.jsx"},{"name":"Pill","sourcePath":"components/core/Pill.jsx"},{"name":"PLAYER_COLORS","sourcePath":"components/core/PlayerDot.jsx"},{"name":"PlayerDot","sourcePath":"components/core/PlayerDot.jsx"},{"name":"ScoreInput","sourcePath":"components/forms/ScoreInput.jsx"},{"name":"TextField","sourcePath":"components/forms/TextField.jsx"},{"name":"Section","sourcePath":"components/navigation/Section.jsx"},{"name":"TabBar","sourcePath":"components/navigation/TabBar.jsx"}],"sourceHashes":{"components/core/Badge.jsx":"a379fa5cb462","components/core/Button.jsx":"319b2f079f77","components/core/Card.jsx":"358ab66007ca","components/core/ConnectionDot.jsx":"6c65476431a7","components/core/Flag.jsx":"2bd70dc3b82a","components/core/Pill.jsx":"6ee81c537ee0","components/core/PlayerDot.jsx":"f901bf7b2dd9","components/forms/ScoreInput.jsx":"e9df0aa369f3","components/forms/TextField.jsx":"7a9b38300d1a","components/navigation/Section.jsx":"0d39f4c055af","components/navigation/TabBar.jsx":"4f1c0547e59e","ui_kits/league-app/data.js":"b215eee88108","ui_kits/league-app/screens.jsx":"8e98b7f0d7a1"},"inlinedExternals":[],"unexposedExports":[]} */

(() => {

const __ds_ns = (window.Mundial2026LeagueDesignSystem_4cb07a = window.Mundial2026LeagueDesignSystem_4cb07a || {});

const __ds_scope = {};

(__ds_ns.__errors = __ds_ns.__errors || []);

// components/core/Badge.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Badge — a small inset chip. Two flavours used in the app: a neutral
 * slate count badge (mono, e.g. a tally next to a section title) and a
 * tinted "me"/status tag. Numbers render in mono per the brand rule.
 */
function Badge({
  children,
  tone = "neutral",
  mono = false,
  style,
  ...rest
}) {
  const TONES = {
    neutral: {
      bg: "var(--surface-inset)",
      color: "var(--text-body)"
    },
    sky: {
      bg: "var(--surface-inset)",
      color: "var(--sky-300)"
    },
    emerald: {
      bg: "var(--tint-success)",
      color: "var(--emerald-300)"
    },
    amber: {
      bg: "var(--tint-leader)",
      color: "var(--amber-300)"
    },
    rose: {
      bg: "var(--tint-select)",
      color: "var(--rose-300)"
    }
  };
  const t = TONES[tone] || TONES.neutral;
  return /*#__PURE__*/React.createElement("span", _extends({
    style: {
      display: "inline-flex",
      alignItems: "center",
      padding: "1px 8px",
      borderRadius: "var(--radius-full)",
      background: t.bg,
      color: t.color,
      fontSize: "var(--text-xs)",
      fontFamily: mono ? "var(--font-mono)" : "var(--font-sans)",
      fontWeight: "var(--weight-bold)",
      lineHeight: 1.4,
      ...style
    }
  }, rest), children);
}
Object.assign(__ds_scope, { Badge });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Badge.jsx", error: String((e && e.message) || e) }); }

// components/core/Button.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Button — the league's primary action control.
 * Solid accent fill with dark (slate-950) text is the signature primary;
 * `ghost` is a transparent slate-bordered secondary. Hover lightens the
 * fill (solid) or the border (ghost); press has no transform.
 */
function Button({
  children,
  variant = "primary",
  tone = "sky",
  size = "md",
  block = false,
  disabled = false,
  icon = null,
  type = "button",
  onClick,
  style,
  ...rest
}) {
  const TONES = {
    sky: {
      base: "var(--sky-500)",
      hover: "var(--sky-400)"
    },
    emerald: {
      base: "var(--emerald-500)",
      hover: "var(--emerald-400)"
    },
    amber: {
      base: "var(--amber-400)",
      hover: "var(--amber-300)"
    },
    rose: {
      base: "var(--rose-500)",
      hover: "var(--rose-400)"
    }
  };
  const t = TONES[tone] || TONES.sky;
  const SIZES = {
    sm: {
      padding: "6px 12px",
      font: "var(--text-xs)",
      radius: "var(--radius-lg)"
    },
    md: {
      padding: "10px 16px",
      font: "var(--text-sm)",
      radius: "var(--radius-xl)"
    },
    lg: {
      padding: "12px 20px",
      font: "var(--text-base)",
      radius: "var(--radius-xl)"
    }
  };
  const s = SIZES[size] || SIZES.md;
  const [hover, setHover] = React.useState(false);
  const isSolid = variant === "primary";
  const base = {
    display: block ? "flex" : "inline-flex",
    width: block ? "100%" : undefined,
    alignItems: "center",
    justifyContent: "center",
    gap: "6px",
    padding: s.padding,
    fontSize: s.font,
    fontWeight: "var(--weight-bold)",
    fontFamily: "var(--font-sans)",
    lineHeight: 1,
    borderRadius: s.radius,
    cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.4 : 1,
    transition: "var(--transition-colors)",
    whiteSpace: "nowrap",
    border: isSolid ? "1px solid transparent" : "1px solid var(--border-default)",
    background: isSolid ? hover && !disabled ? t.hover : t.base : "transparent",
    color: isSolid ? "var(--text-on-accent)" : "var(--text-body)",
    ...(isSolid ? {} : {
      borderColor: hover && !disabled ? "var(--border-strong)" : "var(--border-default)"
    }),
    ...style
  };
  return /*#__PURE__*/React.createElement("button", _extends({
    type: type,
    disabled: disabled,
    onClick: onClick,
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => setHover(false),
    style: base
  }, rest), icon, children);
}
Object.assign(__ds_scope, { Button });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Button.jsx", error: String((e && e.message) || e) }); }

// components/core/Card.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Card — the flat slate panel that holds nearly everything: leaderboard rows,
 * setup forms, rules cards. Slate-900 fill, 1px slate-800 hairline border,
 * rounded-2xl, no drop shadow. `leader` swaps the border to amber.
 */
function Card({
  children,
  leader = false,
  padded = true,
  as = "div",
  style,
  ...rest
}) {
  const Tag = as;
  return /*#__PURE__*/React.createElement(Tag, _extends({
    style: {
      background: "var(--surface-card)",
      border: "1px solid",
      borderColor: leader ? "var(--state-leader)" : "var(--border-subtle)",
      borderRadius: "var(--radius-2xl)",
      padding: padded ? "var(--pad-card)" : 0,
      color: "var(--text-body)",
      fontFamily: "var(--font-sans)",
      ...style
    }
  }, rest), children);
}
Object.assign(__ds_scope, { Card });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Card.jsx", error: String((e && e.message) || e) }); }

// components/core/ConnectionDot.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * ConnectionDot — the tiny live-sync indicator from the header. A 8px dot:
 * emerald-400 when connected ("מסונכרן חי"), slate-600 when not. Optionally
 * pulses while live.
 */
function ConnectionDot({
  connected = true,
  size = 8,
  pulse = false,
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("span", _extends({
    title: connected ? "מסונכרן חי" : "מנותק",
    style: {
      display: "inline-block",
      flexShrink: 0,
      width: size,
      height: size,
      borderRadius: "var(--radius-full)",
      background: connected ? "var(--state-live)" : "var(--slate-600)",
      boxShadow: connected && pulse ? "0 0 0 0 rgba(52,211,153,.5)" : "none",
      animation: connected && pulse ? "ds-live-pulse 1.8s var(--ease-standard) infinite" : "none",
      ...style
    }
  }, rest));
}
Object.assign(__ds_scope, { ConnectionDot });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/ConnectionDot.jsx", error: String((e && e.message) || e) }); }

// components/core/Flag.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Team code → [Hebrew name, emoji flag] for the 48 World Cup 2026 finalists.
 * Mirrors the `T` map in the source app.
 */
const TEAMS = {
  MEX: ["מקסיקו", "🇲🇽"],
  KOR: ["דרום קוריאה", "🇰🇷"],
  CZE: ["צ׳כיה", "🇨🇿"],
  RSA: ["דרום אפריקה", "🇿🇦"],
  SUI: ["שווייץ", "🇨🇭"],
  CAN: ["קנדה", "🇨🇦"],
  QAT: ["קטאר", "🇶🇦"],
  BIH: ["בוסניה", "🇧🇦"],
  BRA: ["ברזיל", "🇧🇷"],
  MAR: ["מרוקו", "🇲🇦"],
  HAI: ["האיטי", "🇭🇹"],
  SCO: ["סקוטלנד", "🏴󠁧󠁢󠁳󠁣󠁴󠁿"],
  USA: ["ארה״ב", "🇺🇸"],
  TUR: ["טורקיה", "🇹🇷"],
  AUS: ["אוסטרליה", "🇦🇺"],
  PAR: ["פרגוואי", "🇵🇾"],
  GER: ["גרמניה", "🇩🇪"],
  ECU: ["אקוודור", "🇪🇨"],
  CIV: ["חוף השנהב", "🇨🇮"],
  CUW: ["קוראסאו", "🇨🇼"],
  NED: ["הולנד", "🇳🇱"],
  JPN: ["יפן", "🇯🇵"],
  SWE: ["שוודיה", "🇸🇪"],
  TUN: ["טוניסיה", "🇹🇳"],
  BEL: ["בלגיה", "🇧🇪"],
  EGY: ["מצרים", "🇪🇬"],
  IRN: ["איראן", "🇮🇷"],
  NZL: ["ניו זילנד", "🇳🇿"],
  ESP: ["ספרד", "🇪🇸"],
  CPV: ["כף ורדה", "🇨🇻"],
  KSA: ["ערב הסעודית", "🇸🇦"],
  URU: ["אורוגוואי", "🇺🇾"],
  FRA: ["צרפת", "🇫🇷"],
  SEN: ["סנגל", "🇸🇳"],
  IRQ: ["עיראק", "🇮🇶"],
  NOR: ["נורווגיה", "🇳🇴"],
  ARG: ["ארגנטינה", "🇦🇷"],
  ALG: ["אלג׳יריה", "🇩🇿"],
  AUT: ["אוסטריה", "🇦🇹"],
  JOR: ["ירדן", "🇯🇴"],
  POR: ["פורטוגל", "🇵🇹"],
  COD: ["קונגו", "🇨🇩"],
  UZB: ["אוזבקיסטן", "🇺🇿"],
  COL: ["קולומביה", "🇨🇴"],
  ENG: ["אנגליה", "🏴󠁧󠁢󠁥󠁮󠁧󠁿"],
  CRO: ["קרואטיה", "🇭🇷"],
  GHA: ["גאנה", "🇬🇭"],
  PAN: ["פנמה", "🇵🇦"]
};

/**
 * Flag — a team's identity glyph. Renders the emoji flag inside a rounded-sm
 * box with the brand hairline ring. Optionally shows the Hebrew team name.
 * Emoji flags are the portable fallback the app uses everywhere alongside its
 * bespoke inline-SVG flags.
 */
function Flag({
  code,
  lg = false,
  withName = false,
  style,
  ...rest
}) {
  const entry = TEAMS[code] || [code, "🏳️"];
  const box = lg ? 24 : 16;
  const glyph = /*#__PURE__*/React.createElement("span", _extends({
    "aria-label": entry[0],
    style: {
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      width: box,
      height: Math.round(box * 0.7),
      flexShrink: 0,
      fontSize: lg ? "18px" : "13px",
      lineHeight: 1,
      borderRadius: "var(--radius-sm)",
      boxShadow: "var(--shadow-hairline)",
      overflow: "hidden",
      ...style
    }
  }, rest), entry[1]);
  if (!withName) return glyph;
  return /*#__PURE__*/React.createElement("span", {
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: "6px"
    }
  }, glyph, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: lg ? "var(--text-sm)" : "var(--text-xs)",
      color: "var(--text-body)"
    }
  }, entry[0]));
}
Object.assign(__ds_scope, { TEAMS, Flag });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Flag.jsx", error: String((e && e.message) || e) }); }

// components/core/Pill.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Pill — a selectable toggle chip. This is the workhorse choice control of
 * the app: 1/X/2 picks, team toggles, knockout selections. Unselected is a
 * slate-bordered ghost; selected fills with a ~20% accent tint, an accent
 * border and light accent text. `tone="emerald"` is the confirmed-result look.
 */
function Pill({
  children,
  selected = false,
  tone = "sky",
  disabled = false,
  block = false,
  mark = null,
  // "hit" | "miss" | null
  icon = null,
  onClick,
  style,
  ...rest
}) {
  const TONES = {
    sky: {
      border: "var(--sky-400)",
      text: "var(--sky-200)",
      tint: "var(--tint-select)"
    },
    emerald: {
      border: "var(--emerald-500)",
      text: "var(--emerald-300)",
      tint: "var(--tint-success)"
    },
    amber: {
      border: "var(--amber-400)",
      text: "var(--amber-300)",
      tint: "var(--tint-leader)"
    }
  };
  const t = TONES[tone] || TONES.sky;
  const [hover, setHover] = React.useState(false);
  const wrap = {
    display: block ? "flex" : "inline-flex",
    flex: block ? "1" : undefined,
    alignItems: "center",
    justifyContent: "center",
    gap: "4px",
    minWidth: 0,
    padding: "6px 10px",
    fontSize: "var(--text-xs)",
    fontWeight: selected ? "var(--weight-bold)" : "var(--weight-normal)",
    fontFamily: "var(--font-sans)",
    lineHeight: 1.1,
    borderRadius: "var(--radius-lg)",
    border: "1px solid",
    cursor: disabled ? "default" : "pointer",
    transition: "var(--transition-colors)",
    background: selected ? t.tint : "transparent",
    borderColor: selected ? t.border : disabled ? "var(--border-subtle)" : hover ? "var(--border-strong)" : "var(--border-default)",
    color: selected ? t.text : disabled ? "var(--text-faint)" : "var(--text-body)",
    ...style
  };
  return /*#__PURE__*/React.createElement("button", _extends({
    type: "button",
    disabled: disabled,
    onClick: onClick,
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => setHover(false),
    style: wrap
  }, rest), icon, /*#__PURE__*/React.createElement("span", {
    style: {
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap"
    }
  }, children), mark === "hit" && /*#__PURE__*/React.createElement("span", {
    style: {
      color: "var(--emerald-400)",
      fontWeight: 700
    }
  }, "\u2713"), mark === "miss" && /*#__PURE__*/React.createElement("span", {
    style: {
      color: "var(--rose-400)",
      fontWeight: 700
    }
  }, "\u2715"));
}
Object.assign(__ds_scope, { Pill });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Pill.jsx", error: String((e && e.message) || e) }); }

// components/core/PlayerDot.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/** The fixed 12-colour player identity ramp (by index). */
const PLAYER_COLORS = ["var(--player-1)", "var(--player-2)", "var(--player-3)", "var(--player-4)", "var(--player-5)", "var(--player-6)", "var(--player-7)", "var(--player-8)", "var(--player-9)", "var(--player-10)", "var(--player-11)", "var(--player-12)"];

/**
 * PlayerDot — a coloured identity token: a filled circle (colour chosen by
 * the player's index in the league) showing the first letter of their name
 * in dark, bold text. Used in the leaderboard, identity screen, and draft.
 */
function PlayerDot({
  name = "",
  idx = 0,
  size = 20,
  style,
  ...rest
}) {
  const bg = PLAYER_COLORS[idx % PLAYER_COLORS.length];
  const letter = (name.trim()[0] || "?").toUpperCase();
  return /*#__PURE__*/React.createElement("span", _extends({
    style: {
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      flexShrink: 0,
      width: size,
      height: size,
      borderRadius: "var(--radius-full)",
      background: bg,
      color: "var(--text-on-accent)",
      fontFamily: "var(--font-sans)",
      fontSize: Math.round(size * 0.55),
      fontWeight: "var(--weight-bold)",
      lineHeight: 1,
      ...style
    }
  }, rest), letter);
}
Object.assign(__ds_scope, { PLAYER_COLORS, PlayerDot });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/PlayerDot.jsx", error: String((e && e.message) || e) }); }

// components/forms/ScoreInput.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * ScoreInput — the exact-score entry from the Manage screen: two small
 * numeric wells with a ":" separator, mono digits. Locked state turns the
 * border emerald. Values are 0–2-digit strings; onChange gets [a, b].
 */
function ScoreInput({
  a = "",
  b = "",
  onChange,
  locked = false,
  style,
  ...rest
}) {
  const clean = v => v.replace(/\D/g, "").slice(0, 2);
  const cell = {
    width: 30,
    height: 30,
    textAlign: "center",
    padding: 0,
    fontSize: "var(--text-sm)",
    fontFamily: "var(--font-mono)",
    fontWeight: "var(--weight-bold)",
    color: locked ? "var(--emerald-300)" : "var(--text-strong)",
    background: "var(--surface-field)",
    border: "1px solid",
    borderColor: locked ? "var(--emerald-600)" : "var(--border-default)",
    borderRadius: "var(--radius-lg)",
    outline: "none"
  };
  return /*#__PURE__*/React.createElement("span", _extends({
    dir: "ltr",
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: "4px",
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("input", {
    inputMode: "numeric",
    placeholder: "\xB7",
    disabled: locked,
    value: a,
    onChange: e => onChange && onChange([clean(e.target.value), b]),
    style: cell
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: "var(--text-xs)",
      color: "var(--slate-600)"
    }
  }, ":"), /*#__PURE__*/React.createElement("input", {
    inputMode: "numeric",
    placeholder: "\xB7",
    disabled: locked,
    value: b,
    onChange: e => onChange && onChange([a, clean(e.target.value)]),
    style: cell
  }));
}
Object.assign(__ds_scope, { ScoreInput });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/ScoreInput.jsx", error: String((e && e.message) || e) }); }

// components/forms/TextField.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * TextField — the standard text input. Slate-950 well, slate-700 hairline,
 * rounded-xl, with a small slate-500 label above. Border turns sky on focus.
 */
function TextField({
  label,
  value,
  onChange,
  placeholder,
  disabled = false,
  type = "text",
  style,
  inputStyle,
  ...rest
}) {
  const [focus, setFocus] = React.useState(false);
  return /*#__PURE__*/React.createElement("label", {
    style: {
      display: "block",
      fontFamily: "var(--font-sans)",
      ...style
    }
  }, label && /*#__PURE__*/React.createElement("span", {
    style: {
      display: "block",
      marginBottom: "4px",
      fontSize: "var(--text-xs)",
      color: "var(--text-meta)"
    }
  }, label), /*#__PURE__*/React.createElement("input", _extends({
    type: type,
    value: value,
    onChange: onChange,
    placeholder: placeholder,
    disabled: disabled,
    onFocus: () => setFocus(true),
    onBlur: () => setFocus(false),
    style: {
      width: "100%",
      boxSizing: "border-box",
      padding: "8px 12px",
      fontSize: "var(--text-sm)",
      fontFamily: "var(--font-sans)",
      color: "var(--text-strong)",
      background: "var(--surface-field)",
      border: "1px solid",
      borderColor: focus ? "var(--border-focus)" : "var(--border-default)",
      borderRadius: "var(--radius-xl)",
      outline: "none",
      transition: "var(--transition-colors)",
      opacity: disabled ? 0.5 : 1,
      ...inputStyle
    }
  }, rest)));
}
Object.assign(__ds_scope, { TextField });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/TextField.jsx", error: String((e && e.message) || e) }); }

// components/navigation/Section.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Section — a collapsible card. Shares the Card shell (slate-900, slate-800
 * hairline, rounded-2xl). A full-width header row toggles open/closed; the
 * chevron rotates 180° when open. Optional mono count badge and right-side
 * sub label, matching the group/draft sections in the app.
 */
function Section({
  title,
  badge = null,
  sub = null,
  defaultOpen = false,
  children,
  style,
  ...rest
}) {
  const [open, setOpen] = React.useState(defaultOpen);
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      background: "var(--surface-card)",
      border: "1px solid var(--border-subtle)",
      borderRadius: "var(--radius-2xl)",
      fontFamily: "var(--font-sans)",
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: () => setOpen(!open),
    style: {
      display: "flex",
      width: "100%",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "12px 16px",
      background: "transparent",
      border: "none",
      cursor: "pointer",
      textAlign: "right"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: "8px"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontWeight: "var(--weight-bold)",
      color: "var(--text-strong)"
    }
  }, title), badge != null && /*#__PURE__*/React.createElement("span", {
    style: {
      padding: "1px 8px",
      borderRadius: "var(--radius-full)",
      background: "var(--surface-inset)",
      color: "var(--text-body)",
      fontFamily: "var(--font-mono)",
      fontSize: "var(--text-xs)"
    }
  }, badge)), /*#__PURE__*/React.createElement("span", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: "8px"
    }
  }, sub && /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: "var(--text-xs)",
      color: "var(--text-meta)"
    }
  }, sub), /*#__PURE__*/React.createElement("span", {
    style: {
      display: "inline-block",
      color: "var(--text-meta)",
      transition: "transform var(--dur-base) var(--ease-standard)",
      transform: open ? "rotate(180deg)" : "rotate(0deg)"
    }
  }, "\u25BE"))), open && /*#__PURE__*/React.createElement("div", {
    style: {
      borderTop: "1px solid var(--border-subtle)",
      padding: "12px 16px"
    }
  }, children));
}
Object.assign(__ds_scope, { Section });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/Section.jsx", error: String((e && e.message) || e) }); }

// components/navigation/TabBar.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * TabBar — the app's main navigation: a slate-900 rounded-2xl rail holding
 * equal-width tabs. The active tab is a slate-700 pill; inactive tabs are
 * muted slate text that lightens on hover. Each tab can carry a small icon.
 */
function TabBar({
  tabs = [],
  active,
  onChange,
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("nav", _extends({
    style: {
      display: "flex",
      gap: "4px",
      padding: "4px",
      background: "var(--surface-card)",
      border: "1px solid var(--border-subtle)",
      borderRadius: "var(--radius-2xl)",
      overflowX: "auto",
      fontFamily: "var(--font-sans)",
      ...style
    }
  }, rest), tabs.map(t => {
    const on = t.key === active;
    return /*#__PURE__*/React.createElement(TabButton, {
      key: t.key,
      tab: t,
      on: on,
      onClick: () => onChange && onChange(t.key)
    });
  }));
}
function TabButton({
  tab,
  on,
  onClick
}) {
  const [hover, setHover] = React.useState(false);
  return /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: onClick,
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => setHover(false),
    style: {
      flex: 1,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: "6px",
      whiteSpace: "nowrap",
      padding: "8px",
      fontSize: "var(--text-xs)",
      fontWeight: "var(--weight-bold)",
      borderRadius: "var(--radius-xl)",
      border: "none",
      cursor: "pointer",
      transition: "var(--transition-colors)",
      background: on ? "var(--surface-raised)" : "transparent",
      color: on ? "var(--slate-50)" : hover ? "var(--slate-200)" : "var(--text-muted)"
    }
  }, tab.icon, tab.label);
}
Object.assign(__ds_scope, { TabBar });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/TabBar.jsx", error: String((e && e.message) || e) }); }

// ui_kits/league-app/data.js
try { (() => {
// Demo data for the Mundial 2026 League UI kit. Fake but realistic.
// Loaded as a plain script; attaches LEAGUE to window.

window.LEAGUE = function () {
  const players = [{
    id: "p0",
    name: "דניאל",
    idx: 0
  }, {
    id: "p1",
    name: "מאיה",
    idx: 1
  }, {
    id: "p2",
    name: "יוסי",
    idx: 2
  }, {
    id: "p3",
    name: "נועה",
    idx: 3
  }];

  // leaderboard rows (sorted desc by total)
  const rows = [{
    p: players[2],
    draft: 11,
    matches: 6,
    bracket: 7.5,
    total: 24.5
  }, {
    p: players[0],
    draft: 9,
    matches: 8,
    bracket: 6,
    total: 23
  }, {
    p: players[1],
    draft: 8,
    matches: 5,
    bracket: 5.5,
    total: 18.5
  }, {
    p: players[3],
    draft: 7,
    matches: 4,
    bracket: 4,
    total: 15
  }];

  // a few group fixtures for the bets screen (group A)
  const groupA = {
    key: "A",
    fixtures: [{
      id: "A-0",
      t1: "MEX",
      t2: "KOR",
      result: "2-1",
      bet: "1"
    }, {
      id: "A-1",
      t1: "CZE",
      t2: "RSA",
      result: "1-1",
      bet: "X"
    }, {
      id: "A-2",
      t1: "MEX",
      t2: "CZE",
      result: null,
      bet: "1"
    }, {
      id: "A-3",
      t1: "RSA",
      t2: "KOR",
      result: null,
      bet: null
    }, {
      id: "A-4",
      t1: "MEX",
      t2: "RSA",
      result: null,
      bet: null
    }, {
      id: "A-5",
      t1: "KOR",
      t2: "CZE",
      result: null,
      bet: "2"
    }]
  };

  // draft pools — who owns which teams (subset for display)
  const draft = {
    order: ["p2", "p0", "p1", "p3"],
    current: "p0",
    pool: ["BRA", "ARG", "FRA", "ESP", "GER", "POR", "NED", "ENG", "BEL", "CRO", "URU", "JPN"],
    owned: {
      p2: ["BRA", "POR"],
      p0: ["ARG", "NED"],
      p1: ["FRA", "ENG"],
      p3: ["ESP", "GER"]
    }
  };
  return {
    name: "ליגת החברים",
    players,
    rows,
    groupA,
    draft
  };
}();
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/league-app/data.js", error: String((e && e.message) || e) }); }

// ui_kits/league-app/screens.jsx
try { (() => {
/* Mundial 2026 League — UI kit screens. Loaded as a Babel script.
   Reads design-system primitives from the compiled bundle namespace and
   exports screen components to window for index.html to compose. */

const DS = window.Mundial2026LeagueDesignSystem_4cb07a;
const {
  Button,
  Pill,
  Card,
  Badge,
  PlayerDot,
  Flag,
  ConnectionDot,
  TextField,
  ScoreInput,
  TabBar,
  Section
} = DS;
const {
  TEAMS
} = DS;

/* ---- Lucide icon helper ---- */
function Icon({
  name,
  size = 14,
  color = "currentColor"
}) {
  const ref = React.useRef(null);
  React.useEffect(() => {
    if (!ref.current || !window.lucide || !window.lucide[name]) return;
    ref.current.innerHTML = "";
    const el = window.lucide.createElement(window.lucide[name]);
    el.setAttribute("width", size);
    el.setAttribute("height", size);
    el.setAttribute("stroke", color);
    ref.current.appendChild(el);
  }, [name, size, color]);
  return /*#__PURE__*/React.createElement("span", {
    ref: ref,
    style: {
      display: "inline-flex",
      alignItems: "center"
    }
  });
}

/* ---- Header ---- */
function Header({
  name,
  meName,
  onSwitch,
  connected
}) {
  const [copied, setCopied] = React.useState(false);
  return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      height: 4
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      background: "var(--host-1)"
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      background: "var(--host-2)"
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      background: "var(--host-3)"
    }
  })), /*#__PURE__*/React.createElement("header", {
    style: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "16px 16px 8px"
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h1", {
    style: {
      margin: 0,
      fontSize: "var(--text-xl)",
      fontWeight: 900,
      letterSpacing: "-.02em",
      color: "var(--text-heading)"
    }
  }, name, " ", /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 15
    }
  }, "\uD83C\uDDFA\uD83C\uDDF8\uD83C\uDDE8\uD83C\uDDE6\uD83C\uDDF2\uD83C\uDDFD")), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: "2px 0 0",
      fontSize: "var(--text-xs)",
      color: "var(--text-meta)"
    }
  }, "\u05DC\u05D9\u05D2\u05EA \u05D4\u05D9\u05DE\u05D5\u05E8\u05D9\u05DD \xB7 \u05DE\u05D5\u05E0\u05D3\u05D9\u05D0\u05DC 2026")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 8
    }
  }, meName && /*#__PURE__*/React.createElement("button", {
    onClick: onSwitch,
    className: "ghost-pill"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "Users",
    size: 12
  }), " ", meName), /*#__PURE__*/React.createElement("button", {
    onClick: () => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    },
    className: "ghost-pill"
  }, copied ? /*#__PURE__*/React.createElement(Icon, {
    name: "Check",
    size: 12,
    color: "var(--emerald-400)"
  }) : /*#__PURE__*/React.createElement(Icon, {
    name: "Link2",
    size: 12
  }), copied ? "הועתק!" : "קישור לחברים"), /*#__PURE__*/React.createElement(ConnectionDot, {
    connected: connected,
    pulse: connected
  }))));
}

/* ---- Setup ---- */
function SetupScreen({
  onCreate
}) {
  const [leagueName, setLeagueName] = React.useState("ליגת החברים");
  const [names, setNames] = React.useState(["דניאל", "מאיה", "יוסי", "נועה"]);
  const ok = leagueName.trim() && names.filter(n => n.trim()).length >= 2;
  return /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: "var(--container-form)",
      margin: "0 auto",
      padding: "32px 0"
    }
  }, /*#__PURE__*/React.createElement(Card, {
    padded: true,
    style: {
      padding: 20
    }
  }, /*#__PURE__*/React.createElement("h2", {
    style: {
      margin: "0 0 4px",
      fontSize: "var(--text-lg)",
      fontWeight: 900,
      color: "var(--text-strong)"
    }
  }, "\u05E4\u05EA\u05D9\u05D7\u05EA \u05DC\u05D9\u05D2\u05D4 \u05D7\u05D3\u05E9\u05D4"), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: "0 0 16px",
      fontSize: "var(--text-sm)",
      color: "var(--text-muted)"
    }
  }, "\u05DE\u05D5\u05E1\u05D9\u05E4\u05D9\u05DD \u05D0\u05EA \u05DB\u05DC \u05D4\u05D7\u05D1\u05E8\u05D9\u05DD \u05E4\u05E2\u05DD \u05D0\u05D7\u05EA \u2014 \u05D5\u05DB\u05DC \u05D0\u05D7\u05D3 \u05E9\u05D9\u05D9\u05DB\u05E0\u05E1 \u05DC\u05D0\u05E4\u05DC\u05D9\u05E7\u05E6\u05D9\u05D4 \u05D9\u05D1\u05D7\u05E8 \u05DE\u05D9 \u05D4\u05D5\u05D0."), /*#__PURE__*/React.createElement("div", {
    style: {
      marginBottom: 16
    }
  }, /*#__PURE__*/React.createElement(TextField, {
    label: "\u05E9\u05DD \u05D4\u05DC\u05D9\u05D2\u05D4",
    value: leagueName,
    onChange: e => setLeagueName(e.target.value)
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: "var(--text-xs)",
      color: "var(--text-meta)",
      marginBottom: 4
    }
  }, "\u05E9\u05D7\u05E7\u05E0\u05D9\u05DD"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 8
    }
  }, names.map((n, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      display: "flex",
      alignItems: "center",
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }, /*#__PURE__*/React.createElement(TextField, {
    value: n,
    placeholder: "שחקן " + (i + 1),
    onChange: e => setNames(names.map((x, j) => j === i ? e.target.value : x))
  })), names.length > 2 && /*#__PURE__*/React.createElement("button", {
    className: "icon-btn",
    onClick: () => setNames(names.filter((_, j) => j !== i))
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "Trash2",
    size: 16,
    color: "var(--slate-600)"
  }))))), /*#__PURE__*/React.createElement("button", {
    className: "add-link",
    onClick: () => setNames([...names, ""])
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "Plus",
    size: 14
  }), " \u05E2\u05D5\u05D3 \u05E9\u05D7\u05E7\u05DF"), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 20
    }
  }, /*#__PURE__*/React.createElement(Button, {
    tone: "sky",
    block: true,
    disabled: !ok,
    onClick: () => onCreate(leagueName, names)
  }, "\u05E6\u05D0 \u05DC\u05D3\u05E8\u05DA \u26BD")), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: "12px 0 0",
      textAlign: "center",
      fontSize: "var(--text-xs)",
      color: "var(--text-meta)"
    }
  }, "\u05D9\u05E9 \u05DC\u05DB\u05DD \u05DB\u05D1\u05E8 \u05DC\u05D9\u05D2\u05D4? \u05E4\u05EA\u05D7\u05D5 \u05D0\u05EA \u05D4\u05E7\u05D9\u05E9\u05D5\u05E8 \u05E9\u05E9\u05D5\u05EA\u05E3 \u05D1\u05E7\u05D1\u05D5\u05E6\u05D4.")));
}

/* ---- Identity ---- */
function IdentityScreen({
  players,
  onPick
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: "var(--container-form)",
      margin: "0 auto",
      padding: "40px 0",
      textAlign: "center"
    }
  }, /*#__PURE__*/React.createElement("h2", {
    style: {
      margin: "0 0 4px",
      fontSize: "var(--text-lg)",
      fontWeight: 900,
      color: "var(--text-strong)"
    }
  }, "\u05DE\u05D9 \u05D0\u05EA\u05D4?"), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: "0 0 20px",
      fontSize: "var(--text-sm)",
      color: "var(--text-muted)"
    }
  }, "\u05D4\u05D1\u05D7\u05D9\u05E8\u05D4 \u05E0\u05E9\u05DE\u05E8\u05EA \u05E8\u05E7 \u05D1\u05DE\u05DB\u05E9\u05D9\u05E8 \u05E9\u05DC\u05DA"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 8
    }
  }, players.map(p => /*#__PURE__*/React.createElement("button", {
    key: p.id,
    className: "identity-btn",
    onClick: () => onPick(p.id)
  }, /*#__PURE__*/React.createElement(PlayerDot, {
    name: p.name,
    idx: p.idx
  }), " ", p.name))));
}

/* ---- Leaderboard ---- */
function Leaderboard({
  rows,
  meId
}) {
  const [open, setOpen] = React.useState(null);
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "minmax(0,4fr) repeat(4, 2fr)",
      padding: "0 12px",
      fontSize: "var(--text-xs)",
      color: "var(--text-meta)"
    }
  }, /*#__PURE__*/React.createElement("div", null, "\u05E9\u05D7\u05E7\u05DF"), /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: "center"
    }
  }, "\u05D3\u05E8\u05D0\u05E4\u05D8"), /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: "center"
    }
  }, "\u05DE\u05E9\u05D7\u05E7\u05D9\u05DD"), /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: "center"
    }
  }, "\u05E2\u05D5\u05DC\u05D5\u05EA"), /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: "center"
    }
  }, "\u05E1\u05D4\u05F4\u05DB")), rows.map((r, rank) => {
    const isLeader = rank === 0;
    const isMe = r.p.id === meId;
    const isOpen = open === r.p.id;
    return /*#__PURE__*/React.createElement(Card, {
      key: r.p.id,
      leader: isLeader,
      padded: false
    }, /*#__PURE__*/React.createElement("button", {
      onClick: () => setOpen(isOpen ? null : r.p.id),
      style: {
        display: "grid",
        width: "100%",
        gridTemplateColumns: "minmax(0,4fr) repeat(4, 2fr)",
        alignItems: "center",
        padding: "12px",
        background: "transparent",
        border: "none",
        cursor: "pointer",
        textAlign: "right"
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        alignItems: "center",
        gap: 8,
        overflow: "hidden"
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        width: 16,
        fontFamily: "var(--font-mono)",
        fontSize: "var(--text-xs)",
        color: isLeader ? "var(--state-leader-text)" : "var(--text-meta)"
      }
    }, rank + 1), /*#__PURE__*/React.createElement(PlayerDot, {
      name: r.p.name,
      idx: r.p.idx
    }), /*#__PURE__*/React.createElement("span", {
      style: {
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
        fontSize: "var(--text-sm)",
        fontWeight: 700,
        color: "var(--text-strong)"
      }
    }, r.p.name), isMe && /*#__PURE__*/React.createElement(Badge, {
      tone: "sky"
    }, "\u05D0\u05E0\u05D9")), /*#__PURE__*/React.createElement(Num, {
      v: r.draft
    }), /*#__PURE__*/React.createElement(Num, {
      v: r.matches
    }), /*#__PURE__*/React.createElement(Num, {
      v: r.bracket
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        textAlign: "center",
        fontFamily: "var(--font-mono)",
        fontSize: "var(--text-base)",
        fontWeight: 900,
        color: isLeader ? "var(--state-leader-text)" : "var(--text-strong)"
      }
    }, r.total)), isOpen && /*#__PURE__*/React.createElement("div", {
      style: {
        borderTop: "1px solid var(--border-subtle)",
        padding: 12,
        fontSize: "var(--text-xs)",
        color: "var(--text-muted)"
      }
    }, "\u05E4\u05D9\u05E8\u05D5\u05D8 \u05E0\u05E7\u05D5\u05D3\u05D5\u05EA \u2014 \u05D3\u05E8\u05D0\u05E4\u05D8 ", r.draft, " \xB7 \u05D4\u05D9\u05DE\u05D5\u05E8\u05D9 \u05DE\u05E9\u05D7\u05E7\u05D9\u05DD ", r.matches, " \xB7 \u05E0\u05D9\u05D7\u05D5\u05E9\u05D9 \u05E2\u05D5\u05DC\u05D5\u05EA ", r.bracket, "."));
  }));
}
function Num({
  v
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: "center",
      fontFamily: "var(--font-mono)",
      fontSize: "var(--text-sm)",
      color: "var(--text-body)"
    }
  }, v);
}

/* ---- Bets ---- */
function BetsScreen({
  group,
  onBet
}) {
  const labels = {
    "1": "1",
    X: "X",
    "2": "2"
  };
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 12
    }
  }, /*#__PURE__*/React.createElement(Section, {
    title: "בית " + group.key,
    badge: group.fixtures.length,
    sub: "\u05D4\u05D9\u05DE\u05D5\u05E8\u05D9 1/X/2",
    defaultOpen: true
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 10
    }
  }, group.fixtures.map(f => {
    const done = !!f.result;
    return /*#__PURE__*/React.createElement("div", {
      key: f.id,
      style: {
        display: "flex",
        alignItems: "center",
        gap: 8
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        display: "flex",
        flex: 1,
        minWidth: 0,
        alignItems: "center",
        justifyContent: "flex-start",
        gap: 6,
        fontSize: "var(--text-sm)",
        color: "var(--text-body)"
      }
    }, /*#__PURE__*/React.createElement(Flag, {
      code: f.t1
    }), " ", /*#__PURE__*/React.createElement("span", {
      style: {
        whiteSpace: "nowrap"
      }
    }, TEAMS[f.t1][0])), /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        gap: 4
      }
    }, ["1", "X", "2"].map(opt => {
      const sel = f.bet === opt;
      const hit = done && f.result && resultOutcome(f.result) === opt;
      return /*#__PURE__*/React.createElement(Pill, {
        key: opt,
        selected: sel,
        tone: done ? "emerald" : "sky",
        mark: done ? sel ? hit ? "hit" : "miss" : null : null,
        onClick: () => !done && onBet(f.id, opt),
        style: {
          width: 38
        }
      }, labels[opt]);
    })), /*#__PURE__*/React.createElement("span", {
      style: {
        display: "flex",
        flex: 1,
        minWidth: 0,
        alignItems: "center",
        justifyContent: "flex-end",
        gap: 6,
        fontSize: "var(--text-sm)",
        color: "var(--text-body)"
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        whiteSpace: "nowrap"
      }
    }, TEAMS[f.t2][0]), " ", /*#__PURE__*/React.createElement(Flag, {
      code: f.t2
    })));
  }))));
}
function resultOutcome(r) {
  const m = /^(\d+)-(\d+)$/.exec(r);
  if (!m) return null;
  return +m[1] > +m[2] ? "1" : +m[1] < +m[2] ? "2" : "X";
}

/* ---- Draft ---- */
function DraftScreen({
  draft,
  players,
  onPick
}) {
  const byId = Object.fromEntries(players.map(p => [p.id, p]));
  const current = byId[draft.current];
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 12
    }
  }, /*#__PURE__*/React.createElement(Card, null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 8
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "Shuffle",
    size: 16,
    color: "var(--sky-400)"
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontWeight: 700,
      color: "var(--text-strong)",
      fontSize: "var(--text-sm)"
    }
  }, "\u05EA\u05D5\u05E8 \u05D4\u05D1\u05D7\u05D9\u05E8\u05D4:"), /*#__PURE__*/React.createElement(PlayerDot, {
    name: current.name,
    idx: current.idx,
    size: 18
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontWeight: 700,
      color: "var(--sky-300)",
      fontSize: "var(--text-sm)"
    }
  }, current.name), /*#__PURE__*/React.createElement("span", {
    style: {
      marginInlineStart: "auto",
      fontSize: "var(--text-xs)",
      color: "var(--text-meta)"
    }
  }, "\u05E0\u05D5\u05EA\u05E8\u05D5 ", draft.pool.length, " \u05E0\u05D1\u05D7\u05E8\u05D5\u05EA"))), /*#__PURE__*/React.createElement(Section, {
    title: "\u05D4\u05E0\u05D1\u05D7\u05E8\u05D5\u05EA \u05D4\u05D6\u05DE\u05D9\u05E0\u05D5\u05EA",
    badge: draft.pool.length,
    defaultOpen: true
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 8,
      flexWrap: "wrap"
    }
  }, draft.pool.map(code => /*#__PURE__*/React.createElement(Pill, {
    key: code,
    icon: /*#__PURE__*/React.createElement(Flag, {
      code: code
    }),
    onClick: () => onPick(code)
  }, TEAMS[code][0])))), /*#__PURE__*/React.createElement(Section, {
    title: "\u05DE\u05D9 \u05D1\u05D7\u05E8 \u05DE\u05D4",
    badge: players.length
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 10
    }
  }, players.map(p => /*#__PURE__*/React.createElement("div", {
    key: p.id,
    style: {
      display: "flex",
      alignItems: "center",
      gap: 8,
      flexWrap: "wrap"
    }
  }, /*#__PURE__*/React.createElement(PlayerDot, {
    name: p.name,
    idx: p.idx,
    size: 18
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: "var(--text-xs)",
      fontWeight: 700,
      color: "var(--text-strong)",
      width: 56
    }
  }, p.name), (draft.owned[p.id] || []).map(c => /*#__PURE__*/React.createElement("span", {
    key: c,
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 4,
      fontSize: "var(--text-xs)",
      color: "var(--text-body)"
    }
  }, /*#__PURE__*/React.createElement(Flag, {
    code: c
  }), " ", TEAMS[c][0])))))));
}
Object.assign(window, {
  Icon,
  Header,
  SetupScreen,
  IdentityScreen,
  Leaderboard,
  BetsScreen,
  DraftScreen
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/league-app/screens.jsx", error: String((e && e.message) || e) }); }

__ds_ns.Badge = __ds_scope.Badge;

__ds_ns.Button = __ds_scope.Button;

__ds_ns.Card = __ds_scope.Card;

__ds_ns.ConnectionDot = __ds_scope.ConnectionDot;

__ds_ns.TEAMS = __ds_scope.TEAMS;

__ds_ns.Flag = __ds_scope.Flag;

__ds_ns.Pill = __ds_scope.Pill;

__ds_ns.PLAYER_COLORS = __ds_scope.PLAYER_COLORS;

__ds_ns.PlayerDot = __ds_scope.PlayerDot;

__ds_ns.ScoreInput = __ds_scope.ScoreInput;

__ds_ns.TextField = __ds_scope.TextField;

__ds_ns.Section = __ds_scope.Section;

__ds_ns.TabBar = __ds_scope.TabBar;

})();
