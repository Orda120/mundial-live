**ScoreInput** — exact-score entry (two mono numeric wells split by ":"). The league manager uses it to enter results on the Manage screen.

```jsx
<ScoreInput a={a} b={b} onChange={([x, y]) => setScore(x, y)} />
<ScoreInput a="2" b="1" locked />   {/* confirmed — emerald border */}
```

- Always renders LTR (scores read 2:1) even inside an RTL page.
- `locked` confirms the result: emerald border + text, inputs disabled.
