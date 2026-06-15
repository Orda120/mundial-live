**TextField** — the standard labelled text input (league name, player names).

```jsx
<TextField label="שם הליגה" value={name} onChange={e => setName(e.target.value)} />
```

- Slate-950 well, slate-700 hairline that turns sky-500 on focus, `rounded-xl`.
- Label is small slate-500 above the field. Omit `label` for a bare input.
