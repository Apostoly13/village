# The Village — Visual Overhaul Handoff

Drop-in replacement package for the entire frontend. Everything is pixel-precise and preserves your existing data layer — state, hooks, API calls, props, event handlers — only the JSX and classNames change.

---

## What's in this package

```
handoff/
├── README.md                     ← you are here
├── DESIGN-LANGUAGE.md            ← source of truth for EVERY new page you build
├── install/
│   ├── tailwind.config.js        ← theme preset (paper / ink / accent / etc.)
│   ├── tokens.css                ← day + night CSS variables
│   ├── globals.css               ← base styles, typography, animations
│   └── fonts.html                ← <link> tags to paste in public/index.html
├── src/
│   ├── lib/
│   │   └── cn.js                 ← classnames helper (every component uses this)
│   ├── components/
│   │   ├── Navigation.jsx        ← LEFT RAIL (desktop) + top bar (mobile)
│   │   ├── ThemeToggle.jsx
│   │   ├── AppFooter.jsx
│   │   └── village/              ← design-system primitives (re-exported via index.js)
│   │       ├── index.js
│   │       ├── Wordmark.jsx
│   │       ├── TrialBanner.jsx
│   │       ├── GreetingBlock.jsx
│   │       ├── ModeTabs.jsx
│   │       ├── SearchBar.jsx
│   │       ├── FilterChip.jsx
│   │       ├── PostCard.jsx
│   │       ├── SideCard.jsx
│   │       ├── LiveDot.jsx
│   │       ├── RoomRow.jsx
│   │       ├── EventDateChip.jsx
│   │       ├── Avatar.jsx
│   │       ├── Pill.jsx
│   │       ├── SectionHeading.jsx
│   │       ├── Button.jsx
│   │       ├── Input.jsx
│   │       ├── IconButton.jsx
│   │       ├── Badge.jsx
│   │       └── icons.jsx          ← VILLAGE-SPECIFIC ICON PACK (19 custom icons)
│   └── pages/    (16 page files — drop-in replacements)
│       ├── Landing.jsx           ChatRooms.jsx
│       ├── Login.jsx             ChatRoom.jsx
│       ├── Register.jsx          Events.jsx
│       ├── Onboarding.jsx        Messages.jsx
│       ├── Dashboard.jsx         Profile.jsx
│       ├── Forums.jsx            Settings.jsx
│       ├── ForumPost.jsx         Friends.jsx
│       ├── Saved.jsx
│       └── Stalls.jsx            ← MARKETPLACE (premium-gated)
```

---

## Install order — top to bottom, verify between each step

### 1 · Fonts
Paste the `<link>` tags from `install/fonts.html` into `public/index.html` inside `<head>`. Three families:

- **Fraunces** — display serif (italic 'Village' wordmark, greetings, section titles)
- **Inter** — UI sans (body, labels, buttons)
- **JetBrains Mono** — eyebrow labels only (e.g. `FRIDAY · 4:36 PM`)

### 2 · Tokens & globals
- `install/tokens.css`         → `frontend/src/tokens.css`            (new file)
- `install/globals.css`        → replaces `frontend/src/index.css`
- `install/tailwind.config.js` → replaces `frontend/tailwind.config.js`

After this, run `yarn start` — the page will look broken (no components yet) but Tailwind should compile without errors.

### 3 · The `cn` helper + village primitives
- `handoff/src/lib/cn.js` → `frontend/src/lib/cn.js`
- Copy **every file** from `handoff/src/components/village/` to `frontend/src/components/village/`. These are imported by every page below.

### 4 · Navigation + shell
- `Navigation.jsx`  → `frontend/src/components/Navigation.jsx`  (replaces existing)
- `AppFooter.jsx`   → `frontend/src/components/AppFooter.jsx`
- `ThemeToggle.jsx` → `frontend/src/components/ThemeToggle.jsx`

### 5 · Pages — one at a time, verify between
Replace in this order so the core flow is testable first:

| # | File | What to verify before next |
|---|---|---|
| 1 | `Landing.jsx`     | Marketing page renders, CTAs route to `/register` and `/login` |
| 2 | `Login.jsx`       | Sign-in works, redirects to `/dashboard` |
| 3 | `Register.jsx`    | New account flow lands on `/onboarding` |
| 4 | `Onboarding.jsx`  | All 7 steps progress, final submit hits `PUT /api/users/profile` |
| 5 | `Dashboard.jsx`   | **The big one.** Greeting renders, feed loads, side rail shows nearby events + community |
| 6 | `Forums.jsx`      | Categories list filtered by tab, search works |
| 7 | `ForumPost.jsx`   | Single post + replies + reply composer + bookmark |
| 8 | `ChatRooms.jsx`   | Live rooms, local circle, friends-only sections all populate |
| 9 | `ChatRoom.jsx`    | Live message stream, send works, autoscroll behaves |
| 10 | `Events.jsx`     | List view + calendar view, RSVP button toggles state |
| 11 | `Messages.jsx`   | Conversations list + thread, send works |
| 12 | `Profile.jsx`    | Own profile + other-user profile both render, friend action works |
| 13 | `Settings.jsx`   | All 6 sections render, save calls `PUT /api/users/profile` |
| 14 | `Friends.jsx`    | Tabs work, accept/decline calls hit the right endpoints |
| 15 | `Saved.jsx`      | Bookmarks list filtered by kind |

---

## Rules Claude Code must follow

### Do not invent
- Every color comes from `tailwind.config.js` (`bg-paper`, `text-ink`, `border-line`, `text-accent`, etc.). **Never hex codes in JSX.**
- Every font-size has a utility (`text-display-lg`, `text-greeting`, `text-section`, `text-card-title`, `text-body`, `text-body-sm`, `text-label`, `text-eyebrow`, `text-micro`).
- Every shadow, radius, and spacing increment is in the config.

### Preserve all data
Every `useState`, `useEffect`, `fetch`, prop, and handler in the **existing** page files stays. Only the return JSX and `className=` strings change. Each handoff page file starts with a `KEEP / REPLACE` header — read it before editing.

If a hook or function is named in `KEEP`, it stays exactly as-is. If it's not in the handoff file at all, copy it across from the old file unchanged.

### Icon rules
- **Lucide** for everything generic (Search, Heart, Bell, MessageCircle, Plus, MapPin…). Already installed.
- **Village icons** for Village-specific concepts that Lucide doesn't ship — same API as Lucide:
  ```js
  import { ThreeAmMoon, LocalCircle, Pram, ParentChild, SupportHand, Whisper,
           Mug, Anonymous, Village, Bottle, CalendarSparkle, Stall, Sleep,
           HeartPulse, Cake, GlobeAu, Quill, Cuddle, Sparkle } from '@/components/village/icons';
  ```
- Sizes: 12–14 (micro/inline), 16 (buttons), 18 (nav), 20+ (section leads).
- Stroke width: **1.5** everywhere (set on each `<Icon strokeWidth={1.5} />`).
- **No emoji in UI chrome.** Emoji only appear in user-generated content (post bodies, reply bodies) and explicitly-approved spots (category emojis served from DB).

### Voice & copy
The copy in each handoff page file **is** the final copy. Don't rewrite greetings, empty states, or CTA labels. The italic-serif `firstName` in `Afternoon, {firstName}.` is intentional — keep that structure.

---

## Per-page header pattern

Every page file starts with a block like this. Read it before editing:

```jsx
/**
 * Dashboard.jsx
 * ─────────────────────────────────────────────────────
 * KEEP from frontend/src/pages/Dashboard.jsx:
 *   - All useState hooks
 *   - fetchFeed, fetchNearbyEvents, fetchTodaysPosts, etc.
 *   - handleLikePost, handleSearch, markNotificationRead
 *   - heroContent useMemo
 *
 * REPLACE entirely:
 *   - The JSX inside return ( ... )
 *   - All className values
 *
 * NEW imports:
 *   - Components from ./components/village/*
 *   - (drop the old <Button>, <Input>, <Avatar> imports — use village versions)
 * ─────────────────────────────────────────────────────
 */
```

---

## When something doesn't fit

If a page in your codebase has a feature **not** mentioned in the handoff file (e.g. a custom modal, a sub-route, an admin-only widget), keep that feature working. Wrap its JSX in the handoff's design vocabulary:

- Containers → `village-card` (defined in globals.css) or `bg-card border border-line rounded-md`
- Buttons → `<Button variant="primary|outline|ghost" size="sm|md|lg">` from `components/village`
- Inputs → `<Input>` from `components/village`
- Section labels → `font-mono text-eyebrow uppercase text-ink-faint`
- Headings → `font-display text-section text-ink`

Never style with raw colors or one-off CSS. If you genuinely need something new, add it to `DESIGN-LANGUAGE.md` first, then build.

---

## Theme toggle

`ThemeToggle.jsx` flips `data-theme="day"` / `data-theme="night"` on `<html>`. The token file `tokens.css` defines both palettes — every Tailwind utility resolves to the right one. **Do not** hard-code dark-mode classes (`dark:bg-...`) anywhere; the tokens handle it.

---

## Smoke test before shipping

After all 15 pages are in:

1. `/` — Landing renders, CTAs go to `/register`
2. `/register` → `/onboarding` → `/dashboard` (full new-user flow)
3. `/dashboard` — feed loads, greeting reflects time of day
4. `/forums` — list renders, click into one space → `/forums/category/:id`
5. `/forums/post/:id` — post + replies, reply works
6. `/chat` → `/chat/:roomId` — drop into a live room, send a message
7. `/events` — list + calendar view
8. `/messages` — list + thread
9. `/profile` — own profile (with edit button), other profile (with add-friend button)
10. `/settings` — every section opens, save works
11. Theme toggle — flip day ↔ night on Dashboard, verify all surfaces invert correctly

If anything breaks, the failure is almost always **one of**:
- A `KEEP` hook was accidentally removed (re-add from the old file)
- A `village/*` component wasn't copied across (check imports)
- `tokens.css` wasn't imported in `globals.css` (`@import './tokens.css';`)

---

## When you add a new page

Open `DESIGN-LANGUAGE.md`. Compose it from the primitives. Never write a new card style, new button variant, new font-size — the system covers every case.
