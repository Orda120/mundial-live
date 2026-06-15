import React from "react";

export interface ScoreInputProps {
  /** Home goals (0–2 digit string). */
  a?: string;
  /** Away goals (0–2 digit string). */
  b?: string;
  /** Called with the next [a, b] pair on edit. */
  onChange?: (next: [string, string]) => void;
  /** Locked = result confirmed; border turns emerald, inputs disabled. @default false */
  locked?: boolean;
  style?: React.CSSProperties;
}

/** Exact-score entry: two mono numeric wells split by ":". Used on the Manage screen. */
export function ScoreInput(props: ScoreInputProps): JSX.Element;
