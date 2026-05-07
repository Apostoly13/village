# The Village — Design Handoff

This folder is a drop-in package for the frontend codebase at `Apostoly13/village`. It
contains the new design tokens, a day/night theme system, a typographic wordmark component,
and a checklist of changes to apply across the existing pages.

## What's in here

```
handoff/
├── README.md                       ← this file
├── CHANGES.md                      ← ordered checklist of code edits to make
├── src/
│   ├── theme.css                   ← day + night token sheet, shadcn-compatible
│   ├── useTheme.jsx                ← useTheme() hook + <ThemeToggle /> component
│   └── components/
│       └── Wordmark.jsx            ← typographic wordmark + monogram
└── copywriting.md                  ← landing + onboarding copy, social captions
```

## Quickstart (Claude Code instructions)

1. **Copy files into the repo:**
   - `handoff/src/theme.css`          → `frontend/src/theme.css`
   - `handoff/src/useTheme.jsx`       → `frontend/src/useTheme.jsx`
   - `handoff/src/components/Wordmark.jsx` → `frontend/src/components/Wordmark.jsx`

2. **Wire up the theme CSS.** In `frontend/src/index.js` (or wherever fonts are imported):
   ```js
   import "./theme.css";
   // add the Google Fonts for Fraunces + Inter Tight — either via <link> in public/index.html
   // or via @fontsource/fraunces and @fontsource/inter-tight in package.json
   ```
   In `public/index.html` add:
   ```html
   <link rel="preconnect" href="https://fonts.googleapis.com">
   <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
   <link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,500;1,9..144,400;1,9..144,500&family=Inter+Tight:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
   ```

3. **Restore the real app.** `frontend/src/App.js` currently only renders the `ComingSoon`
   splash. Put the full route tree back (Landing, Dashboard, ChatRoom, Events, Profile, etc).
   Add the theme initialiser at the root so every page respects it:
   ```jsx
   // App.js
   import { useTheme } from "./useTheme";
   function App() {
     useTheme();          // sets data-theme on <body> + syncs with system
     return <BrowserRouter>...routes...</BrowserRouter>;
   }
   ```

4. **Drop the ThemeToggle into Profile / Settings.** There are already `Moon`/`Sun` icon
   imports in `Profile.jsx` — replace that stub with `<ThemeToggle />` from `useTheme.jsx`.
   Remove any hand-rolled dark-mode class-toggling code; `useTheme` owns this now.

5. **Replace logo images with the Wordmark component** in:
   - `Navigation.jsx` (top bar)
   - `AppFooter.jsx`
   - `Landing.jsx` (hero + nav)
   - Any email templates
   ```jsx
   import { Wordmark } from "./components/Wordmark";
   <Wordmark size={22} />        // nav
   <Wordmark size={64} />        // hero
   ```
   Leave the PNGs in `public/` for now — they're still referenced by `ComingSoon.jsx` and
   social OpenGraph images; don't delete them.

6. **Apply the changes in `CHANGES.md`** page-by-page. Start with Landing + Dashboard +
   Profile — those show the biggest uplift.

## Design principles to preserve

- **Editorial serif in headlines, clean sans in body.** Fraunces for H1/H2 (both upright and
  italic — the italic carries brand personality). Inter Tight for everything else.
- **Warm always.** Day mode is paper + brown, night mode is candlelight, never cold.
- **Quiet animation.** Avoid bouncy micro-interactions. Fades and gentle lifts only.
- **Space over density.** Give copy and photography room to breathe.
- **Hand-drawn touches used rarely.** The watercolour blob and hand-underline are accents,
  not textures — use once per screen, max.
- **Mono uppercase for metadata only.** Timestamps, labels, category tags.

## Open questions for the founder

- Logo direction: typographic wordmark (this package) vs existing watercolour PNG vs a new
  simplified monogram derived from it. Currently using the typographic wordmark by default.
- Which voice for social: editorial, parent-to-parent, or a deliberate mix.
- Photography strategy: stock vs real community photos vs illustrated throughout.
