import React from "react";

/**
 * Team code → [Hebrew name, emoji flag] for the 48 World Cup 2026 finalists.
 * Mirrors the `T` map in the source app.
 */
export const TEAMS = {
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

/**
 * Flag — a team's identity glyph. Renders the emoji flag inside a rounded-sm
 * box with the brand hairline ring. Optionally shows the Hebrew team name.
 * Emoji flags are the portable fallback the app uses everywhere alongside its
 * bespoke inline-SVG flags.
 */
export function Flag({ code, lg = false, withName = false, style, ...rest }) {
  const entry = TEAMS[code] || [code, "🏳️"];
  const box = lg ? 24 : 16;
  const glyph = (
    <span
      aria-label={entry[0]}
      style={{
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
        ...style,
      }}
      {...rest}
    >
      {entry[1]}
    </span>
  );
  if (!withName) return glyph;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
      {glyph}
      <span style={{ fontSize: lg ? "var(--text-sm)" : "var(--text-xs)", color: "var(--text-body)" }}>
        {entry[0]}
      </span>
    </span>
  );
}
