import React from "react";

/** The fixed 12-colour player identity ramp (by index). */
export const PLAYER_COLORS = [
  "var(--player-1)", "var(--player-2)", "var(--player-3)", "var(--player-4)",
  "var(--player-5)", "var(--player-6)", "var(--player-7)", "var(--player-8)",
  "var(--player-9)", "var(--player-10)", "var(--player-11)", "var(--player-12)",
];

/**
 * PlayerDot — a coloured identity token: a filled circle (colour chosen by
 * the player's index in the league) showing the first letter of their name
 * in dark, bold text. Used in the leaderboard, identity screen, and draft.
 */
export function PlayerDot({ name = "", idx = 0, size = 20, style, ...rest }) {
  const bg = PLAYER_COLORS[idx % PLAYER_COLORS.length];
  const letter = (name.trim()[0] || "?").toUpperCase();
  return (
    <span
      style={{
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
        ...style,
      }}
      {...rest}
    >
      {letter}
    </span>
  );
}
