import React from "react";

/**
 * Card — the flat slate panel that holds nearly everything: leaderboard rows,
 * setup forms, rules cards. Slate-900 fill, 1px slate-800 hairline border,
 * rounded-2xl, no drop shadow. `leader` swaps the border to amber.
 */
export function Card({ children, leader = false, padded = true, as = "div", style, ...rest }) {
  const Tag = as;
  return (
    <Tag
      style={{
        background: "var(--surface-card)",
        border: "1px solid",
        borderColor: leader ? "var(--state-leader)" : "var(--border-subtle)",
        borderRadius: "var(--radius-2xl)",
        padding: padded ? "var(--pad-card)" : 0,
        color: "var(--text-body)",
        fontFamily: "var(--font-sans)",
        ...style,
      }}
      {...rest}
    >
      {children}
    </Tag>
  );
}
