**TabBar** — the app's main navigation rail (Table / Bets / Draft / Sim / Manage / Rules). Equal-width tabs in a slate rounded-2xl rail; the active tab is a slate-700 pill.

```jsx
<TabBar
  active={tab}
  onChange={setTab}
  tabs={[
    { key: "table", label: "טבלה", icon: <Trophy size={14} /> },
    { key: "bets",  label: "ההימורים שלי", icon: <Target size={14} /> },
  ]}
/>
```

- Pass Lucide icons at size 14. The rail scrolls horizontally if tabs overflow.
- Inactive tabs are muted slate that lightens on hover; no underline.
