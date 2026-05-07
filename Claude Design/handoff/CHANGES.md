# CHANGES — page-by-page edits for Claude Code

Apply these after dropping in `theme.css`, `useTheme.jsx`, and `Wordmark.jsx`.
Order matters: earlier items unlock later ones.

---

## 0 · Global setup

- [ ] `frontend/public/index.html` — add Fraunces + Inter Tight + JetBrains Mono via Google Fonts `<link>`.
- [ ] `frontend/src/index.js` — `import "./theme.css";` (before App.css).
- [ ] `frontend/src/App.js` — restore real routes (currently only renders `ComingSoon`). Wrap in `<useTheme />` initialiser from `./useTheme`.
- [ ] `frontend/tailwind.config.js` — extend `fontFamily`:
  ```js
  fontFamily: {
    sans:    ['Inter Tight', 'Inter', 'DM Sans', 'sans-serif'],
    heading: ['Fraunces', 'Nunito', 'serif'],
    mono:    ['JetBrains Mono', 'monospace'],
  }
  ```
- [ ] `frontend/src/index.css` — keep but remove hard-coded color rules that conflict with
      the new `[data-theme]` vars. Specifically any `body { background: ... }` or
      `html.dark { ... }` blocks.

## 1 · Navigation (`components/Navigation.jsx`)

- [ ] Replace `<img src="/BG Removed- Main Logo.png" />` with `<Wordmark size={22} />`.
- [ ] Background: `bg-[var(--paper)]` with `border-b border-[var(--line-2)]`.
- [ ] Active tab underline colour: `var(--accent)`.
- [ ] Right-side cluster: search icon, notifications bell, avatar — all using
      `var(--ink-2)` at rest, `var(--ink)` on hover.

## 2 · Landing page (`pages/Landing.jsx`)

- [ ] Hero section:
  - Background: `var(--paper)` with `.tv-paper-noise` class on an absolute overlay (opacity 0.5).
  - Eyebrow (mono, uppercase): `FOR AUSTRALIAN PARENTS · INVITE-ONLY`.
  - H1 with Fraunces, size `clamp(42px, 6vw, 84px)`, letter-spacing `-0.03em`. Italicise the
    key phrase ("your village"), colour `var(--accent)`.
  - Single CTA button — rounded pill, `bg-[var(--ink)] text-[var(--paper)]`.
- [ ] Swap out all emoji feature cards (🌙, 👥, etc) for the custom icon set.
      (Copy from `src/icons.jsx` in the design project.)
- [ ] Replace the big pastel gradient hero background with a muted cream + a single
      watercolour blob SVG top-right.
- [ ] Add a quiet proverb block between sections: centred, serif italic, 32px,
      `var(--ink-2)`. "Raising a child was never meant to be done alone."
- [ ] Footer — keep two-column but set to `bg-[var(--ink)] text-[var(--brand-cream)]`.

## 3 · Login / Register (`pages/Login.jsx`, `pages/Register.jsx`)

- [ ] Background: split-screen. Left 40% paper with a watercolour blob + Wordmark,
      right 60% form on `var(--paper-2)`.
- [ ] Inputs: 44px tall, `bg-[var(--paper)]`, `border border-[var(--line)]`,
      focus ring `var(--accent)`.
- [ ] Primary button: `bg-[var(--ink)] text-[var(--paper)] rounded-full px-6 h-11`.

## 4 · Onboarding (`pages/Onboarding.jsx`)

- [ ] Replace the current step indicator with the dot + serif-numeral pattern from the
      design (see Onboarding artboards: "01 / 05", Fraunces italic numbers).
- [ ] Step 1 copy: "Before we begin, a few quiet questions." — serif, italic accent on
      "quiet".
- [ ] Each question screen should use one big serif prompt + sans helper text + input.
      Avoid stacking 4 questions on one screen.

## 5 · Dashboard (`pages/Dashboard.jsx`)

- [ ] Greeting at top: `Tuesday · 9:42` mono eyebrow + "Morning, Jess." serif H1.
- [ ] Quick chip row: spaces you're in + nearby. The "3 am Club" chip when active gets
      `bg-[var(--accent)] text-[var(--primary-fg)]` and `shadow-[var(--glow)]`.
- [ ] Post cards: rounded-2xl, `bg-[var(--paper-2)] border border-[var(--line)]`.
      Metadata line (CATEGORY · TIME) in mono uppercase.
- [ ] Verified-clinician replies pinned on top with `bg-[var(--dusk-wash)]` and a
      shield pill.

## 6 · ChatRoom / 3 am Club (`pages/ChatRoom.jsx`)

- [ ] At night (`data-theme="night"`) this is the hero screen — make sure the amber
      pulse on primary / glow looks right.
- [ ] Own messages: `bg-[var(--accent)] text-[var(--primary-fg)]`.
- [ ] Others: `bg-[var(--paper-2)] border border-[var(--line)]`.
- [ ] Verified clinician replies: special dusk-wash bubble with shield pill + job title.
- [ ] Composer: pill input, 44px, with an anonymous-toggle mask icon on the left.
- [ ] Date separators in mono uppercase: "02:47 AM · TUESDAY".

## 7 · Events (`pages/Events.jsx`)

- [ ] Page header: "What's on · near you." — split H1, second line italic accent.
- [ ] Event date chip: 60×68 rounded-xl with day-number in Fraunces 24px and month
      abbreviation in mono 9px. Colour rotates by category (sage/clay/honey/dusk).
- [ ] Category row: horizontal-scrolling pills. Active pill solid `var(--ink)`.

## 8 · Profile (`pages/Profile.jsx`)

- [ ] Header: 72px avatar overlapping a watercolour blob top-right of the card.
- [ ] Append an "Appearance" section before "Settings" with `<ThemeToggle />`.
      Remove the current `darkMode` useState + document.classList toggle logic —
      `useTheme()` owns this now.
- [ ] Tags: pills in the four accent tones. Click to edit.

## 9 · Forum post (`pages/ForumPost.jsx`)

- [ ] H1 post title: Fraunces 26–32px.
- [ ] Pin verified replies above all others with a "Verified midwife reply · pinned"
      mono eyebrow.
- [ ] Anonymous replies: italic name label "Anonymous", dimmer avatar (paper-2 bg).

## 10 · Village+ / upgrade (`pages/VillagePlus.jsx`)

- [ ] Hero: dark paper (`var(--ink)`) with warm honey accents — the one place honey leads.
- [ ] Price card: 2xl rounded, subtle glow in night mode.

---

## Things to intentionally **remove**

- [ ] Any `@fontsource/nunito` / `@fontsource/dm-sans` imports (replaced by Fraunces +
      Inter Tight). Keep Nunito listed as fallback in tailwind only for safety.
- [ ] Emoji in component source (🌙 💬 ❤️ etc.). Replace with the custom icon set.
- [ ] The amber "pulse-glow" keyframe used on all buttons — keep it only for the
      primary CTA in night mode.
- [ ] Hard-coded `bg-black/40` or `bg-white/5` utility soup — replace with the
      `--paper`/`--ink`/`--line` tokens.

## Things to intentionally **keep**

- [ ] All existing routes, state machines, forms, and data shapes.
- [ ] The anonymous-post toggle + verified-clinician badging logic.
- [ ] NightOwl amber (`#F5C542`) — preserved as the `--honey` / `--primary` token in
      night mode for brand continuity.
- [ ] Your existing shadcn/ui components — `theme.css` bridges to their hsl vars so
      they inherit the new palette without code changes.
