# Mundial 2026 League — Design System

A design system reverse-engineered from **מונדיאל 2026 · ליגת החברים** ("Mundial 2026 · The Friends League") — a private, real-time betting-league app for the FIFA World Cup 2026. It is Hebrew-first, right-to-left, dark-mode, and unapologetically mobile. Friends open one shared link, draft national teams live, place 1/X/2 and knockout bets, and watch a shared scoreboard update in real time.

This system captures that app's visual language so you can design new screens, marketing, slides, and prototypes that look like they belong to the same product.

## Sources

Everything here was lifted from the product's own source code, not from screenshots:

- **GitHub — primary source:** [`Orda120/mundial-live`](https://github.com/Orda120/mundial-live) (`main`). The entire UI lives in one file, `src/App.jsx` (~2,200 lines of React + Tailwind), with Firebase Realtime Database wiring in `src/db.js`. The app icon set is in `public/icon-*.png`.
  - Explore that repo further to recreate flows faithfully — the draft engine, scoring math, and bracket simulator are all in `App.jsx`.
- **Stack:** Vite + React 18, Tailwind CSS 3 (default theme, no custom config), `lucide-react` icons, Firebase RTDB for live sync. No webfonts — the app uses the native system UI stack.

The system is **derived**, not official: there is no published brand guide. Tokens, names, and component APIs here are an interpretation of the code's consistent patterns.

---

## What this product is

A throwaway-friendly, link-is-the-league betting game for a friend group during the World Cup. No accounts, no passwords — whoever has the link is in ("honor system between friends"). Each device remembers who you are. A green dot means you're synced live. The app has six tabs:

| Tab | Hebrew | Purpose |
|---|---|---|
| Table | טבלה | The leaderboard — rank, draft/match/advancement points, total |
| My Bets | ההימורים שלי | Place 1/X/2 group bets + knockout predictions |
| Draft | דראפט | Live snake-draft of all 48 national teams |
| Sim | סימולציה | Local "what-if" scenario sandbox with an auto-built bracket |
| Manage | ניהול | Enter exact scores, lock rounds, reset (open to all — honor system) |
| Rules | חוקים | Scoring reference |

It is functional, dense, and fast — a tool for friends, not a polished consumer launch. The design follows from that: information-dense, dark, tap-friendly, zero chrome.

---

## CONTENT FUNDAMENTALS

**Language & direction.** Hebrew, right-to-left (`dir="rtl"`). Latin appears only in team codes, scores, and the year "2026". Any recreation must set RTL and lay out accordingly (the host tricolor, nav, and tables all mirror).

**Voice — warm, casual, friends-group WhatsApp energy.** The copy talks to a group of friends, not users. It's direct and a little playful, never corporate.
- Casing/tone is conversational. Calls to action are short and fun: the create-league button literally reads **"צא לדרך ⚽"** ("Hit the road ⚢").
- Plural "you" (אתם/מהמרים) for instructions — addressing the whole group — but singular "you" for personal moments: **"מי אתה?"** ("Who are you?") on the identity screen, **"הבחירה נשמרת רק במכשיר שלך"** ("Your choice is saved only on your device").
- Honesty about how scrappy it is: rules call it **"שיטת כבוד בין חברים"** ("honor system between friends"). The link-sharing button is **"קישור לחברים"** ("link for the friends").

**Microcopy patterns.**
- Status as plain speech: **"מסונכרן חי"** (synced live) / **"מנותק"** (disconnected); **"יש שינויים שלא נשמרו"** (you have unsaved changes); **"הועתק!"** (copied!) after copying the link.
- Loading/empty states are one quiet line: **"טוען את הליגה…"** (loading the league…), **"הליגה לא נמצאה…"** (league not found…).
- Numbers carry meaning and are always called out in **monospace amber** inline, e.g. "נצחון — **3** נק׳" (win — 3 pts). "נק׳" is the standard abbreviation for points.

**Emoji — yes, used deliberately and sparingly.** Emoji are part of the brand, not decoration-for-decoration's-sake:
- **Flag emoji** are the fallback team identity (🇧🇷 🇦🇷 🇫🇷…) when an inline SVG flag isn't drawn.
- A small set of **action/section emoji** punctuate copy: ⚽ (the league), ⚖️ ("start live draft"), ⚠️ (config warning), 🇺🇸🇨🇦🇲🇽 (the three host nations, appended to the app title).
- Rule: one emoji as a trailing accent on a heading or button, never mid-sentence clutter. Match the app — don't sprinkle.

**Examples to reuse verbatim:**
- App subtitle: `ליגת הימורים · מונדיאל 2026`
- Setup helper: `מוסיפים את כל החברים פעם אחת — וכל אחד שייכנס לאפליקציה יבחר מי הוא.`
- "אני" ("me") chip marks your own row in the table.

---

## VISUAL FOUNDATIONS

**Overall feel.** A near-black "stadium at night" canvas with a single thin host-nation tricolor at the very top. Depth is built almost entirely from a **slate surface ladder** (950 canvas → 900 cards → 800 insets) and **hairline borders**, not from shadows or gradients. Accent colour is rationed and always *means* something (selection, result, leader, live, danger).

**Colour.**
- **Canvas:** slate-950 `#020617`. **Cards/nav/panels:** slate-900 `#0f172a` with slate-800 `#1e293b` hairline borders. **Insets/chips:** slate-800.
- **Primary / selection:** sky — `sky-500 #0ea5e9` fills, `sky-400` hover & selected border, `sky-200/300` selected text. Primary buttons are solid sky with **slate-950 text** (dark text on bright fill is the signature).
- **Success / live / locked:** emerald — `emerald-500` confirmed results & the "start draft" button, `emerald-400` the live connection dot and "hit" checkmarks.
- **Leader / unsaved / warning:** amber — `amber-400` highlights the #1 row and the save button, `amber-300` leader text and inline point values.
- **Danger:** rose — `rose-400` for delete hovers and "miss" marks.
- **Player identity:** a fixed 12-colour ramp (sky, rose, emerald, amber, violet, cyan, orange, lime, fuchsia, teal, red, indigo) assigned by index to colour each player's dot.
- **Selected/active fills** are the accent at ~20% opacity over the dark surface (`bg-{accent}-500/20`) plus a matching border and light text — a recurring "tinted chip" pattern for any chosen option.

**Imagery.** There is essentially no photography. The visual content is **flags** — rendered as compact inline SVGs (a tiny custom flag renderer in `App.jsx`) with **emoji flags as the universal fallback**, plus the app icon (a flat white soccer ball over the tricolor). Treat flags as the product's "imagery." Everything reads cool/dark; the only warmth is the amber leader accent.

**Typography.** No webfonts — native `system-ui` stack so Hebrew, Latin, and emoji all render with the device's own fonts. Hierarchy comes from **weight, not family**: `font-black` (900) for headings and the league name, `font-bold` (700) for labels, pill text and table cells. Every **numeral, score, rank and team code is monospace** — this is a strong, consistent rule. Sizes are small and dense (12px is the workhorse; 20px the app title).

**Spacing & layout.** A 4px scale, tight by default (`gap-1`/`gap-2` everywhere). One narrow centred column: `max-w-3xl` (≈768px) for the app, `max-w-md` (≈448px) for setup/identity, with `px-4` gutters. The header and bottom-ish nav are part of one scrolling page — no fixed chrome except the **sticky save bar** that floats up when you have unsaved bets.

**Corners & borders.** Generous, consistent rounding: cards/nav/panels `rounded-2xl` (16px), buttons/inputs `rounded-xl` (12px), small toggle buttons `rounded-lg` (8px), pills & dots `rounded-full`, flags `rounded-sm`. Borders are always **1px hairlines**; the only thick rule is the **4px host tricolor bar** at the top of the page.

**Cards.** Flat: slate-900 fill, 1px slate-800 border, `rounded-2xl`, **no drop shadow**. The leader card swaps its border to amber-400. Collapsible sections share this shell with a chevron that rotates 180° when open.

**Shadows & elevation.** Minimal. The app leans on the surface ladder + borders. The one real shadow is `shadow-lg` on the sticky unsaved-changes bar. Flags get a 1px `rgba(148,163,184,.35)` ring instead of a shadow.

**Buttons & interactive states.**
- **Primary:** solid accent fill (sky / emerald / amber), slate-950 text, `font-bold`, `rounded-xl`; hover = one step lighter (`-400`/`-300`); disabled = `opacity-40/50`.
- **Secondary / ghost:** transparent with slate-700 border; hover lightens the **border** to slate-500 (not the fill).
- **Toggle/选 chips:** unselected = slate-700 border, slate-300/400 text; selected = accent border + accent-500/20 tinted fill + light accent text; confirmed-result = emerald variant.
- **Hover** is communicated by colour/border lightening; **press** has no scale/shrink — it's all colour. Transitions are short `transition-colors` (~150ms), no bounces, no big motion. The chevron rotation is the only transform.

**Transparency & blur.** Used lightly: the ~20% accent tints on selected chips and a 10% amber wash on warning banners. No backdrop-blur, no glassmorphism.

**Motion.** Restrained. Colour fades on hover/selection, a rotating chevron, and *live data* arriving (the realtime feel comes from values changing, not animation). No looping decorative animation.

---

## ICONOGRAPHY

- **Icon library: [Lucide](https://lucide.dev) (`lucide-react`).** This is the single icon system — clean, consistent 1.5–2px stroke line icons, no fills. They're rendered small and inline (size **12–16px**), tinted to the current text colour, and paired with a label inside buttons/tabs. Recreations should load Lucide (it's on CDN) and **match stroke weight and size** — never hand-draw replacements.
  - Icons in active use: `Trophy` (table), `Target` (bets), `Shuffle` (draft), `FlaskConical` (sim), `Settings` (manage), `BookOpen` (rules), `Link2`/`Check` (copy link), `Users` (switch player), `Lock`/`Unlock` (locked rounds), `Plus`/`Trash2` (add/remove), `ChevronDown`/`ChevronLeft` (disclosure), `RefreshCw`, `Undo2`, `AlertTriangle`, `Pencil`.
- **Flags** are their own "icon" system: tiny inline SVGs drawn by a custom mini-renderer in `App.jsx`, with **emoji flags (🇧🇷, 🇦🇷, …) as the cross-platform fallback**. For new work, prefer emoji flags or a flag-SVG set; don't redraw them by hand unless matching the app's simplified style.
- **Emoji as icons:** a small, intentional set — ⚽ ⚖️ ⚠️ and the host trio 🇺🇸🇨🇦🇲🇽. Used as trailing accents, not inline decoration.
- **No icon font, no PNG icon sprites** beyond the app launcher icon (`assets/app-icon*.png`). Unicode "·" (middle dot) is used heavily as an inline separator in meta text.

---

## Index / manifest

**Root**
- `styles.css` — the entry point consumers link (an `@import` manifest only).
- `README.md` — this guide.
- `SKILL.md` — Agent-Skills-compatible front matter for use in Claude Code.

**`tokens/`** — CSS custom properties (`@import`ed by `styles.css`)
- `colors.css` — slate ladder, accent ramps, 12-colour player palette, host tricolor.
- `typography.css` — system-font families, weight & size scale (mono for numerals).
- `spacing.css` — 4px scale, container widths, component insets.
- `effects.css` — radii, border widths, the few shadows, motion tokens.
- `semantic.css` — role aliases (`--surface-card`, `--text-body`, `--action-bg`, tinted-selection fills…). **Prefer these in components.**

**`assets/`** — `app-icon.png` (512), `app-icon-192.png`, `app-icon-180.png` — the soccer-ball-over-tricolor launcher mark.

**`components/`** — reusable React primitives (see each `*.prompt.md`)
- `core/` — `Button`, `Pill` (toggle/select chip), `Card`, `Badge`, `PlayerDot`, `Flag`, `ConnectionDot`.
- `forms/` — `TextField`, `ScoreInput`.
- `navigation/` — `TabBar`, `Section` (collapsible).

**`ui_kits/league-app/`** — a high-fidelity, click-through recreation of the app (setup → identity → table/bets/draft). `index.html` is the interactive demo.

**Foundation cards** (`*.card.html`, scattered next to what they document) — the small specimens that populate the Design System tab: colour swatches, type specimens, spacing, radii, the player ramp, flags, and component states.

---

## Caveats

- **No official brand guide exists** — this is reverse-engineered from one open-source repo. Names and APIs are interpretive.
- **Fonts are system fonts by design.** There are no font files to ship; do not substitute a webfont unless you intend to change the product's feel.
- **Flags** in the app are a bespoke simplified-SVG set; this system standardises on emoji flags for portability. If you need the exact SVG flags, copy them from `App.jsx` in the source repo.
