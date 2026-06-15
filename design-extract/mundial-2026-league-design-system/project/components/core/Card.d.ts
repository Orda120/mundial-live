import React from "react";

export interface CardProps {
  children?: React.ReactNode;
  /** Highlight as the #1 / leader card — border turns amber. @default false */
  leader?: boolean;
  /** Apply default 16px padding. @default true */
  padded?: boolean;
  as?: keyof JSX.IntrinsicElements;
  style?: React.CSSProperties;
}

/**
 * Flat slate panel (slate-900 fill, slate-800 hairline, rounded-2xl, no shadow).
 * The container for leaderboard rows, forms, and rules.
 *
 * @startingPoint section="Core" subtitle="Flat slate card surface" viewport="700x140"
 */
export function Card(props: CardProps): JSX.Element;
