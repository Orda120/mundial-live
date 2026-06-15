import React from "react";

/**
 * Section — a collapsible card. Shares the Card shell (slate-900, slate-800
 * hairline, rounded-2xl). A full-width header row toggles open/closed; the
 * chevron rotates 180° when open. Optional mono count badge and right-side
 * sub label, matching the group/draft sections in the app.
 */
export function Section({
  title,
  badge = null,
  sub = null,
  defaultOpen = false,
  children,
  style,
  ...rest
}) {
  const [open, setOpen] = React.useState(defaultOpen);
  return (
    <div
      style={{
        background: "var(--surface-card)",
        border: "1px solid var(--border-subtle)",
        borderRadius: "var(--radius-2xl)",
        fontFamily: "var(--font-sans)",
        ...style,
      }}
      {...rest}
    >
      <button
        type="button"
        onClick={() => setOpen(!open)}
        style={{
          display: "flex",
          width: "100%",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "12px 16px",
          background: "transparent",
          border: "none",
          cursor: "pointer",
          textAlign: "right",
        }}
      >
        <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontWeight: "var(--weight-bold)", color: "var(--text-strong)" }}>
            {title}
          </span>
          {badge != null && (
            <span
              style={{
                padding: "1px 8px",
                borderRadius: "var(--radius-full)",
                background: "var(--surface-inset)",
                color: "var(--text-body)",
                fontFamily: "var(--font-mono)",
                fontSize: "var(--text-xs)",
              }}
            >
              {badge}
            </span>
          )}
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          {sub && (
            <span style={{ fontSize: "var(--text-xs)", color: "var(--text-meta)" }}>{sub}</span>
          )}
          <span
            style={{
              display: "inline-block",
              color: "var(--text-meta)",
              transition: "transform var(--dur-base) var(--ease-standard)",
              transform: open ? "rotate(180deg)" : "rotate(0deg)",
            }}
          >
            ▾
          </span>
        </span>
      </button>
      {open && (
        <div style={{ borderTop: "1px solid var(--border-subtle)", padding: "12px 16px" }}>
          {children}
        </div>
      )}
    </div>
  );
}
