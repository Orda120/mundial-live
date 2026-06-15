import React from "react";

/**
 * Button — the league's primary action control.
 * Solid accent fill with dark (slate-950) text is the signature primary;
 * `ghost` is a transparent slate-bordered secondary. Hover lightens the
 * fill (solid) or the border (ghost); press has no transform.
 */
export function Button({
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
    sky: { base: "var(--sky-500)", hover: "var(--sky-400)" },
    emerald: { base: "var(--emerald-500)", hover: "var(--emerald-400)" },
    amber: { base: "var(--amber-400)", hover: "var(--amber-300)" },
    rose: { base: "var(--rose-500)", hover: "var(--rose-400)" },
  };
  const t = TONES[tone] || TONES.sky;

  const SIZES = {
    sm: { padding: "6px 12px", font: "var(--text-xs)", radius: "var(--radius-lg)" },
    md: { padding: "10px 16px", font: "var(--text-sm)", radius: "var(--radius-xl)" },
    lg: { padding: "12px 20px", font: "var(--text-base)", radius: "var(--radius-xl)" },
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
    background: isSolid ? (hover && !disabled ? t.hover : t.base) : "transparent",
    color: isSolid ? "var(--text-on-accent)" : "var(--text-body)",
    ...(isSolid
      ? {}
      : { borderColor: hover && !disabled ? "var(--border-strong)" : "var(--border-default)" }),
    ...style,
  };

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={base}
      {...rest}
    >
      {icon}
      {children}
    </button>
  );
}
