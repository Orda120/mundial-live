import React from "react";

const toneClasses = {
  sky: "border-sky-500 bg-sky-500 text-slate-950 hover:bg-sky-400",
  emerald: "border-emerald-500 bg-emerald-500 text-slate-950 hover:bg-emerald-400",
  amber: "border-amber-400 bg-amber-400 text-slate-950 hover:bg-amber-300",
  rose: "border-rose-500 bg-rose-500 text-white hover:bg-rose-400",
};

export function Button({
  children,
  icon,
  variant = "solid",
  tone = "sky",
  size = "md",
  block = false,
  className = "",
  type = "button",
  ...props
}) {
  const sizes = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-4 py-2 text-sm",
    lg: "px-5 py-2.5 text-base",
  };
  const variantClass = variant === "ghost"
    ? "border-slate-700 bg-transparent text-slate-300 hover:border-slate-500 hover:text-slate-100"
    : toneClasses[tone] || toneClasses.sky;

  return (
    <button
      type={type}
      className={[
        "inline-flex items-center justify-center gap-2 rounded-xl border font-bold transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950",
        "disabled:cursor-not-allowed disabled:opacity-45",
        sizes[size] || sizes.md,
        block ? "w-full" : "",
        variantClass,
        className,
      ].filter(Boolean).join(" ")}
      {...props}
    >
      {icon}
      {children}
    </button>
  );
}

export function Card({ children, leader = false, interactive = false, className = "", as: Tag = "div", ...props }) {
  return (
    <Tag
      className={[
        "rounded-2xl border bg-slate-900/85 text-slate-200 shadow-[0_18px_60px_rgba(2,6,23,0.28)] backdrop-blur",
        leader ? "border-amber-400/90 ring-1 ring-amber-400/25" : "border-slate-800",
        interactive ? "transition-colors hover:border-slate-600" : "",
        className,
      ].filter(Boolean).join(" ")}
      {...props}
    >
      {children}
    </Tag>
  );
}

export function Pill({ children, tone = "slate", className = "", ...props }) {
  const tones = {
    slate: "border-slate-700 bg-slate-900/80 text-slate-300",
    sky: "border-sky-700 bg-sky-950/60 text-sky-200",
    emerald: "border-emerald-800 bg-emerald-950/70 text-emerald-300",
    amber: "border-amber-700 bg-amber-950/50 text-amber-300",
    rose: "border-rose-800 bg-rose-950/60 text-rose-300",
  };
  return (
    <span
      className={[
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-bold",
        tones[tone] || tones.slate,
        className,
      ].filter(Boolean).join(" ")}
      {...props}
    >
      {children}
    </span>
  );
}

export function StatCard({ label, value, detail, tone = "sky", icon, className = "" }) {
  const tones = {
    sky: "text-sky-300",
    emerald: "text-emerald-300",
    amber: "text-amber-300",
    rose: "text-rose-300",
    slate: "text-slate-100",
  };
  return (
    <Card className={["p-4", className].filter(Boolean).join(" ")}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">{label}</div>
          <div className={["mt-2 truncate font-mono text-2xl font-black", tones[tone] || tones.sky].join(" ")}>
            {value}
          </div>
          {detail && <div className="mt-1 truncate text-xs text-slate-500">{detail}</div>}
        </div>
        {icon && <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-2 text-slate-400">{icon}</div>}
      </div>
    </Card>
  );
}

export function EmptyState({ title, body, action }) {
  return (
    <Card className="mx-auto max-w-md p-6 text-center">
      <h2 className="text-lg font-black text-slate-100">{title}</h2>
      {body && <p className="mt-2 text-sm leading-6 text-slate-400">{body}</p>}
      {action && <div className="mt-5">{action}</div>}
    </Card>
  );
}

