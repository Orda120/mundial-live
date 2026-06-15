**Flag** — a team's identity glyph (emoji flag in a hairline-ringed box), the product's stand-in for imagery. Comes with the full 48-team `TEAMS` map.

```jsx
<Flag code="BRA" />
<Flag code="ARG" lg withName />   {/* 🇦🇷 ארגנטינה */}
```

- `code` is the 3-letter team code; `TEAMS[code]` gives `[hebrewName, emoji]`.
- `withName` appends the Hebrew name; `lg` enlarges. Unknown codes fall back to 🏳️.
- Use inside `<Pill icon={<Flag code="BRA" />}>` for team toggles and bet chips.
