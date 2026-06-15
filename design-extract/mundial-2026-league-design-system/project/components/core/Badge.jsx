import React from "react";

/**
 * Badge — a small inset chip. Two flavours used in the app: a neutral
 * slate count badge (mono, e.g. a tally next to a section title) and a
 * tinted "me"/status tag. Numbers render in mono per the brand rule.
 */
export function Badge({ children, tone = "neutral", mono = false, style, ...rest }) {
  const TONES = {
    neutral: { bg: "var(--surface-inset)", color: "var(--text-body)" },
    sky: { bg: "var(--surface-inset)", color: "var(--sky-300)" },
    emerald: { bg: "var(--tint-success)", color: "var(--emerald-300)" },
    amber: { bg: "var(--tint-leader)", color: "var(--amber-300)" },
    rose: { bg: "var(--tint-select)", color: "var(--rose-300)" },
  };
  const t = TONES[tone] || TONES.neutral;
  return (
    <span
      style={{
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
        ...style,
      }}
      {...rest}
    >
      {children}
    </span>
  );
}
