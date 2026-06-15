import React from "react";

export interface ButtonProps {
  /** Button label / content. */
  children?: React.ReactNode;
  /** `primary` = solid accent fill with dark text; `ghost` = transparent, slate-bordered. @default "primary" */
  variant?: "primary" | "ghost";
  /** Accent colour for fill (primary) or text (ghost). @default "sky" */
  tone?: "sky" | "emerald" | "amber" | "rose";
  /** @default "md" */
  size?: "sm" | "md" | "lg";
  /** Stretch to full container width. @default false */
  block?: boolean;
  /** @default false */
  disabled?: boolean;
  /** Optional leading icon node (e.g. a Lucide icon at size 12–16). */
  icon?: React.ReactNode;
  type?: "button" | "submit" | "reset";
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  style?: React.CSSProperties;
}

/**
 * The league's primary action control: solid accent fill with slate-950 text,
 * or a transparent ghost. Used for "create league", "save bets", "start draft".
 *
 * @startingPoint section="Core" subtitle="Primary & ghost action buttons" viewport="700x120"
 */
export function Button(props: ButtonProps): JSX.Element;
