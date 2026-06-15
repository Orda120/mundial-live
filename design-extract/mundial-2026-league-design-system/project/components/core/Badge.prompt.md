**Badge** — a small `rounded-full` inset chip for counts, the "אני" (me) tag, and inline status.

```jsx
<Badge mono>16</Badge>          {/* slate count next to a section title */}
<Badge tone="sky">אני</Badge>   {/* marks your own leaderboard row */}
<Badge tone="emerald">נעול</Badge>
```

- `tone`: `neutral` (slate count), `sky`/`emerald`/`amber`/`rose` (tinted status).
- Set `mono` for any numeric badge — numerals are always monospace in this brand.
