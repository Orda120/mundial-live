import React from "react";

/**
 * ConnectionDot — the tiny live-sync indicator from the header. A 8px dot:
 * emerald-400 when connected ("מסונכרן חי"), slate-600 when not. Optionally
 * pulses while live.
 */
export function ConnectionDot({ connected = true, size = 8, pulse = false, style, ...rest }) {
  return (
    <span
      title={connected ? "מסונכרן חי" : "מנותק"}
      style={{
        display: "inline-block",
        flexShrink: 0,
        width: size,
        height: size,
        borderRadius: "var(--radius-full)",
        background: connected ? "var(--state-live)" : "var(--slate-600)",
        boxShadow: connected && pulse ? "0 0 0 0 rgba(52,211,153,.5)" : "none",
        animation: connected && pulse ? "ds-live-pulse 1.8s var(--ease-standard) infinite" : "none",
        ...style,
      }}
      {...rest}
    />
  );
}
