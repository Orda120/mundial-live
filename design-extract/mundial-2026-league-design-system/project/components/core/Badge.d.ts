import React from "react";

export interface BadgeProps {
  children?: React.ReactNode;
  /** @default "neutral" */
  tone?: "neutral" | "sky" | "emerald" | "amber" | "rose";
  /** Use the monospace face — for counts/numbers. @default false */
  mono?: boolean;
  style?: React.CSSProperties;
}

/** Small rounded-full inset chip: section counts, the "me" tag, status flags. */
export function Badge(props: BadgeProps): JSX.Element;
