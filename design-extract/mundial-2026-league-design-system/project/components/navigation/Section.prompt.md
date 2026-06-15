**Section** — a collapsible card used to group dense content (group fixtures, draft pools, rules). Shares the Card shell; the header toggles the body and the chevron rotates 180°.

```jsx
<Section title="בית A" badge={6} sub="3 ננעלו" defaultOpen>
  …fixtures…
</Section>
```

- `badge` is a mono count chip; `sub` is muted right-aligned meta.
- Stack several with `gap` to build the bets / draft / manage screens.
