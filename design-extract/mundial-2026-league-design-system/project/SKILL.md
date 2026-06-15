---
name: mundial2026-design
description: Use this skill to generate well-branded interfaces and assets for the Mundial 2026 League (מונדיאל 2026 · ליגת החברים) — a Hebrew, RTL, dark-mode World Cup betting-league app — either for production or throwaway prototypes/mocks/etc. Contains essential design guidelines, colors, type, fonts, assets, and UI kit components for prototyping.
user-invocable: true
---

Read the `README.md` file within this skill, and explore the other available files.

If creating visual artifacts (slides, mocks, throwaway prototypes, etc), copy assets out and create static HTML files for the user to view. If working on production code, you can copy assets and read the rules here to become an expert in designing with this brand.

If the user invokes this skill without any other guidance, ask them what they want to build or design, ask some questions, and act as an expert designer who outputs HTML artifacts _or_ production code, depending on the need.

## Quick orientation

- **Brand in one line:** a near-black "stadium at night" canvas, slate surface ladder, hairline borders (no heavy shadows), sky-blue primary, accents that always *mean* a state (emerald = live/result, amber = leader/save, rose = danger). Hebrew, right-to-left, mobile-first, information-dense. System fonts; numerals always monospace.
- **Always set `dir="rtl"`** and lay out accordingly.
- `styles.css` is the single entry point — link it and use the CSS custom properties (`--surface-card`, `--text-body`, `--action-bg`, the `--player-*` ramp, etc).
- Icons: **Lucide** (line icons, 12–16px). Flags: **emoji flags** in hairline-ringed boxes (the product's stand-in for imagery). Emoji used sparingly as trailing accents (⚽ ⚖️ 🇺🇸🇨🇦🇲🇽).
- Components live in `components/` (Button, Pill, Card, Badge, PlayerDot, Flag, ConnectionDot, TextField, ScoreInput, TabBar, Section). A full interactive recreation is in `ui_kits/league-app/`.
- The launcher mark is `assets/app-icon.png` (soccer ball over the host tricolor).

See `README.md` for the full content, visual, and iconography guidelines.
