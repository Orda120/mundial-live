import React from "react";

/**
 * ScoreInput — the exact-score entry from the Manage screen: two small
 * numeric wells with a ":" separator, mono digits. Locked state turns the
 * border emerald. Values are 0–2-digit strings; onChange gets [a, b].
 */
export function ScoreInput({ a = "", b = "", onChange, locked = false, style, ...rest }) {
  const clean = (v) => v.replace(/\D/g, "").slice(0, 2);
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
    outline: "none",
  };
  return (
    <span
      dir="ltr"
      style={{ display: "inline-flex", alignItems: "center", gap: "4px", ...style }}
      {...rest}
    >
      <input
        inputMode="numeric"
        placeholder="·"
        disabled={locked}
        value={a}
        onChange={(e) => onChange && onChange([clean(e.target.value), b])}
        style={cell}
      />
      <span style={{ fontSize: "var(--text-xs)", color: "var(--slate-600)" }}>:</span>
      <input
        inputMode="numeric"
        placeholder="·"
        disabled={locked}
        value={b}
        onChange={(e) => onChange && onChange([a, clean(e.target.value)])}
        style={cell}
      />
    </span>
  );
}
