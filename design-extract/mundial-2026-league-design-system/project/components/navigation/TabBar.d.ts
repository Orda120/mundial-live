import React from "react";

export interface TabItem {
  key: string;
  label: React.ReactNode;
  /** Small leading icon (Lucide at size 14). */
  icon?: React.ReactNode;
}

export interface TabBarProps {
  tabs: TabItem[];
  /** Active tab key. */
  active: string;
  onChange?: (key: string) => void;
  style?: React.CSSProperties;
}

/**
 * Main app navigation: a slate rail of equal-width tabs; active tab is a slate-700 pill.
 *
 * @startingPoint section="Navigation" subtitle="Primary tab navigation rail" viewport="700x80"
 */
export function TabBar(props: TabBarProps): JSX.Element;
