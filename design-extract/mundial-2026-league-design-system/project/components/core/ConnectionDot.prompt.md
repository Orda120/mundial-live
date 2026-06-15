**ConnectionDot** — the tiny realtime-sync indicator in the app header. Emerald means "synced live", slate means disconnected.

```jsx
<ConnectionDot connected pulse />
<ConnectionDot connected={false} />
```

- Pair it with the "קישור לחברים" link button in a header right-cluster.
- `pulse` adds a soft live animation (needs the `ds-live-pulse` keyframes — included in the component card / kit).
