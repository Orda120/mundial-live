import React from "react";

export interface PillProps {
  children?: React.ReactNode;
  /** Selected fills with an accent tint + border + light text. @default false */
  selected?: boolean;
  /** @default "sky" — `emerald` is the confirmed-result look, `amber` the leader look. */
  tone?: "sky" | "emerald" | "amber";
  /** @default false */
  disabled?: boolean;
  /** Stretch to share row width (flex:1). @default false */
  block?: boolean;
  /** Trailing correctness mark. @default null */
  mark?: "hit" | "miss" | null;
  /** Optional leading node (flag, icon). */
  icon?: React.ReactNode;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  style?: React.CSSProperties;
}

/**
 * Selectable toggle chip — the app's main choice control (1/X/2 bets, team
 * toggles, knockout picks). Unselected = slate ghost; selected = tinted accent.
 *
 * @startingPoint section="Core" subtitle="Selectable toggle / bet chips" viewport="700x120"
 */
export function Pill(props: PillProps): JSX.Element;
