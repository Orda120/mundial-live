import React from "react";

export interface ConnectionDotProps {
  /** @default true */
  connected?: boolean;
  /** Diameter in px. @default 8 */
  size?: number;
  /** Animate a soft live pulse when connected. @default false */
  pulse?: boolean;
  style?: React.CSSProperties;
}

/** The header live-sync dot: emerald when connected, slate when not. */
export function ConnectionDot(props: ConnectionDotProps): JSX.Element;
