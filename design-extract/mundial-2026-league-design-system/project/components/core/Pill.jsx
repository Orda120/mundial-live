import React from "react";

/**
 * Pill — a selectable toggle chip. This is the workhorse choice control of
 * the app: 1/X/2 picks, team toggles, knockout selections. Unselected is a
 * slate-bordered ghost; selected fills with a ~20% accent tint, an accent
 * border and light accent text. `tone="emerald"` is the confirmed-result look.
 */
export function Pill({
  children,
  selected = false,
  tone = "sky",
  disabled = false,
  block = false,
  mark = null, // "hit" | "miss" | null
  icon = null,
  onClick,
  style,
  ...rest
}) {
  const TONES = {
    sky: { border: "var(--sky-400)", text: "var(--sky-200)", tint: "var(--tint-select)" },
    emerald: { border: "var(--emerald-500)", text: "var(--emerald-300)", tint: "var(--tint-success)" },
    amber: { border: "var(--amber-400)", text: "var(--amber-300)", tint: "var(--tint-leader)" },
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
    borderColor: selected
      ? t.border
      : disabled
      ? "var(--border-subtle)"
      : hover
      ? "var(--border-strong)"
      : "var(--border-default)",
    color: selected ? t.text : disabled ? "var(--text-faint)" : "var(--text-body)",
    ...style,
  };

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={wrap}
      {...rest}
    >
      {icon}
      <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
        {children}
      </span>
      {mark === "hit" && <span style={{ color: "var(--emerald-400)", fontWeight: 700 }}>✓</span>}
      {mark === "miss" && <span style={{ color: "var(--rose-400)", fontWeight: 700 }}>✕</span>}
    </button>
  );
}
