import React from "react";

export interface PlayerDotProps {
  /** Player name — the first letter is shown. */
  name?: string;
  /** Index in the league — selects the colour from the 12-colour ramp. @default 0 */
  idx?: number;
  /** Diameter in px. @default 20 */
  size?: number;
  style?: React.CSSProperties;
}

/** Coloured identity token: a filled circle with the player's initial. Colour is by league index. */
export function PlayerDot(props: PlayerDotProps): JSX.Element;

/** The fixed 12-colour player ramp (CSS var references), indexed by player order. */
export const PLAYER_COLORS: string[];
