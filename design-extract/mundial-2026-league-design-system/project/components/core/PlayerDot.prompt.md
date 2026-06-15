**PlayerDot** — a coloured identity token (filled circle + player's initial) used wherever a person appears: leaderboard, identity picker, draft. Colour comes from the fixed 12-colour ramp by the player's index.

```jsx
<PlayerDot name="דניאל" idx={0} />            {/* sky */}
<PlayerDot name="Maya" idx={4} size={28} />   {/* violet, larger */}
```

- `idx` maps into `PLAYER_COLORS` (sky, rose, emerald, amber, violet, cyan, …); wraps past 12.
- Dark slate-950 letter on the bright fill — same on-accent rule as primary buttons.
