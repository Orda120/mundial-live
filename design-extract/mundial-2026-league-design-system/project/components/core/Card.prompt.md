**Card** — the flat slate panel behind almost everything (leaderboard rows, setup form, rules). No shadow — depth is the border + surface ladder.

```jsx
<Card>…</Card>
<Card leader>{/* #1 row — amber border */}</Card>
<Card padded={false}>{/* manage your own insets */}</Card>
```

- slate-900 fill, 1px slate-800 border, `rounded-2xl` (16px), 16px padding.
- `leader` switches the border to amber-400 for the top-of-table row.
- Set `padded={false}` when the card wraps its own header button + body.
