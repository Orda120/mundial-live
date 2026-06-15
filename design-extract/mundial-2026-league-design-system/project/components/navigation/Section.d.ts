import React from "react";

export interface SectionProps {
  title: React.ReactNode;
  /** Mono count chip beside the title (e.g. team count). */
  badge?: React.ReactNode;
  /** Muted right-aligned sub label. */
  sub?: React.ReactNode;
  /** @default false */
  defaultOpen?: boolean;
  children?: React.ReactNode;
  style?: React.CSSProperties;
}

/** Collapsible card: header row toggles the body; chevron rotates when open. Used for groups, draft sections. */
export function Section(props: SectionProps): JSX.Element;
