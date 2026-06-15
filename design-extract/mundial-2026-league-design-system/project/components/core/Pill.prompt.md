**Pill** — a selectable toggle chip; the app's workhorse choice control for 1/X/2 group bets, live team toggles, and knockout picks. Unselected is a slate-bordered ghost; selected fills with a ~20% accent tint.

```jsx
<Pill selected tone="sky">תיקו</Pill>
<Pill tone="emerald" selected mark="hit" icon={<Flag code="BRA" />}>ברזיל</Pill>
<Pill block>1</Pill>
```

- `tone`: `sky` (your selection), `emerald` (confirmed result / locked), `amber` (leader).
- `block` makes pills share a row equally (`flex:1`) — the standard 1/X/2 row.
- `mark="hit" | "miss"` appends a ✓/✕ for scored bets.
- Put a `<Flag>` or Lucide icon in `icon`. Disabled dims to faint slate.
