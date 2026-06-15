**Button** — the league's primary action control; use for create-league, save-bets, start-draft and any high-intent tap. Solid accent fill with dark slate-950 text is the signature look; `ghost` is the quiet secondary.

```jsx
<Button tone="sky" onClick={create}>צא לדרך ⚽</Button>
<Button tone="emerald" block icon={<Scale size={14} />}>התחל דראפט חי</Button>
<Button variant="ghost" size="sm">עריכה</Button>
```

- `tone`: `sky` (primary), `emerald` (go / confirm), `amber` (save), `rose` (destructive).
- `variant`: `primary` (solid) or `ghost` (transparent, slate-700 border that lightens on hover).
- `size`: `sm` (12px / rounded-lg), `md` (default), `lg`. Hover lightens fill/border; no press transform.
- Pass Lucide icons via `icon`; RTL layout places the icon on the correct side automatically (flex + gap).
