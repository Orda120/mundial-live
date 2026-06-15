import React from "react";

export interface FlagProps {
  /** 3-letter team code, e.g. "BRA", "ARG", "USA". */
  code: string;
  /** Larger size. @default false */
  lg?: boolean;
  /** Append the Hebrew team name beside the flag. @default false */
  withName?: boolean;
  style?: React.CSSProperties;
}

/** A team identity glyph: emoji flag in a hairline-ringed box, optionally with the Hebrew name. */
export function Flag(props: FlagProps): JSX.Element;

/** Team code → [Hebrew name, emoji flag] for all 48 World Cup 2026 finalists. */
export const TEAMS: Record<string, [string, string]>;
