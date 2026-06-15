import React from "react";

/**
 * TabBar — the app's main navigation: a slate-900 rounded-2xl rail holding
 * equal-width tabs. The active tab is a slate-700 pill; inactive tabs are
 * muted slate text that lightens on hover. Each tab can carry a small icon.
 */
export function TabBar({ tabs = [], active, onChange, style, ...rest }) {
  return (
    <nav
      style={{
        display: "flex",
        gap: "4px",
        padding: "4px",
        background: "var(--surface-card)",
        border: "1px solid var(--border-subtle)",
        borderRadius: "var(--radius-2xl)",
        overflowX: "auto",
        fontFamily: "var(--font-sans)",
        ...style,
      }}
      {...rest}
    >
      {tabs.map((t) => {
        const on = t.key === active;
        return <TabButton key={t.key} tab={t} on={on} onClick={() => onChange && onChange(t.key)} />;
      })}
    </nav>
  );
}

function TabButton({ tab, on, onClick }) {
  const [hover, setHover] = React.useState(false);
  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
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
        color: on ? "var(--slate-50)" : hover ? "var(--slate-200)" : "var(--text-muted)",
      }}
    >
      {tab.icon}
      {tab.label}
    </button>
  );
}
