# The Village — Design Language

This is the source of truth. Every page, every component, every new screen you ever build follows this. If something isn't in here, it doesn't exist yet — add it here first, then build.

---

## 1. Brand position

The Village is a **warm, editorial, quietly-premium** space for Australian parents. Not clinical. Not cute. Not corporate. Think: a well-made paperback, a linen-covered journal, late-afternoon light through a kitchen window.

### Three words
**Warm. Considered. Quiet.**

### What we are NOT
- Not a social network (no likes-chasing, no algorithmic feed anxiety)
- Not a parenting magazine (no stock photos, no "10 tips for better sleep")
- Not a wellness app (no gradients, no hot-pink, no breathing animations)
- Not Facebook (no blue, no square avatars, no ads)

---

## 2. Colors

All colors live as CSS variables in `tokens.css` and as Tailwind utilities in `tailwind.config.js`. **Never use hex values in JSX.**

### Day theme — "Paper"

| Role | Token | Hex | Usage |
|------|-------|-----|-------|
| Paper | `bg-paper` | `#F6F1E7` | Page background. Warm cream, like unbleached book paper. |
| Card | `bg-card` | `#FFFBF2` | Raised surfaces — cards, side panels, modal bodies. One step brighter than paper. |
| Ink | `text-ink` | `#2B2418` | Primary text. Dark cocoa brown, not black. |
| Ink-muted | `text-ink-muted` | `#6E6552` | Secondary text, meta lines, timestamps. |
| Ink-faint | `text-ink-faint` | `#A39A86` | Captions, dividers as text, disabled states. |
| Line | `border-line` | `#E7DDC9` | All borders, 1px. |
| Line-soft | `border-line-soft` | `#EFE7D5` | Interior dividers (inside cards). |
| Accent | `text-accent` / `bg-accent` | `#B4462B` | The **italic Village** red. Hero wordmark, firstName in greeting, link hover, "live" indicators. Use sparingly. |
| Accent-soft | `bg-accent-soft` | `#F3E1D8` | Tinted backgrounds for accent contexts only. |
| Banner | `bg-banner` | `#F1E4C6` | Trial banner, announcement strips. Soft buttery yellow. |
| Button | `bg-button` | `#1E1812` | Primary button fill. Near-black espresso. |
| Button-ink | `text-button-ink` | `#F6F1E7` | Text on primary button. |
| Success | `text-support` | `#5E7A4C` | "Verified parent", RSVP confirmation. Sage green. |
| Warn | `text-warn` | `#A87524` | "Needs support", trial-expiring warnings. Honey. |

### Night theme — "Candlelight"

Same semantic tokens, different values. Auto-swaps when `<html class="dark">`.

| Role | Token | Hex |
|------|-------|-----|
| Paper | `bg-paper` | `#1C1814` |
| Card | `bg-card` | `#24201A` |
| Ink | `text-ink` | `#EFE6D4` |
| Ink-muted | `text-ink-muted` | `#A9A08B` |
| Ink-faint | `text-ink-faint` | `#6B6452` |
| Line | `border-line` | `#34302A` |
| Line-soft | `border-line-soft` | `#2B2822` |
| Accent | `text-accent` | `#E78A6F` |
| Accent-soft | `bg-accent-soft` | `#3A241C` |
| Banner | `bg-banner` | `#3B3220` |
| Button | `bg-button` | `#EFE6D4` |
| Button-ink | `text-button-ink` | `#1C1814` |
| Success | `text-support` | `#9CB585` |
| Warn | `text-warn` | `#D9A860` |

### Color rules
1. **One accent per screen.** The red is precious. Use on wordmark + firstName in greeting + 1 other touch point max.
2. **No gradients** except the hero paper-to-cream background wash on Landing (2% opacity at most).
3. **No shadow colors.** All shadows use `rgba(43, 36, 24, 0.06)` in day and `rgba(0, 0, 0, 0.3)` in night — defined as `shadow-soft`, `shadow-card`, `shadow-float` utilities.

---

## 3. Typography

Three families. No exceptions.

### Families

```css
--font-display: 'Fraunces', 'Times New Roman', serif;
--font-ui: 'Söhne', 'Inter', -apple-system, system-ui, sans-serif;
--font-mono: 'JetBrains Mono', 'SF Mono', Menlo, monospace;
```

### Type scale

Every size has a Tailwind utility. Line-height and tracking baked in.

| Utility | Family | Size / LH | Weight | Use |
|---------|--------|-----------|--------|-----|
| `text-wordmark` | Display | 32 / 36 | 400 italic | The Village logo |
| `text-display-lg` | Display | 56 / 60 | 400 | Landing hero (desktop) |
| `text-display-md` | Display | 40 / 44 | 400 | Landing hero (mobile), CTA sections |
| `text-greeting` | Display | 44 / 48 | 400 | `Afternoon, {firstName}.` — "Afternoon," is regular; firstName is italic accent-colored |
| `text-section` | Display | 28 / 32 | 400 | Section titles within a page |
| `text-card-title` | UI | 17 / 24 | 600 | Post titles in feed cards |
| `text-body` | UI | 15 / 22 | 400 | Body copy, reply text |
| `text-body-sm` | UI | 13 / 20 | 400 | Meta lines, side-card copy |
| `text-label` | UI | 13 / 16 | 500 | Button labels, nav items |
| `text-micro` | UI | 11 / 14 | 500 | Counts, badges |
| `text-eyebrow` | Mono | 11 / 14 | 500 uppercase letter-spacing-wider | `FRIDAY · 4:36 PM`, section eyebrows |
| `text-quote` | Display | 22 / 30 | 400 italic | Pull quotes on Landing |

### Typography rules
1. **Fraunces italic is precious.** Use for: wordmark, firstName in greeting, pull quotes. Nowhere else.
2. **Fraunces regular (upright serif)** for all display-sized headings otherwise.
3. **No tight letter-spacing on Fraunces.** It's designed with its own tracking. Leave `tracking-normal`.
4. **Never bold Fraunces.** Use weight 400 (regular) or weight 600 (semibold) at most. The cut handles its own emphasis.
5. **Söhne 500** for buttons and nav. Never 700.
6. **Line-height is tighter on display, looser on body.** `leading-tight` for headings, `leading-relaxed` for 2+ line body.
7. **Wrap with `text-wrap: pretty`** on all headings to avoid orphans.

### Greeting format (hardcoded pattern)

```jsx
<p className="text-eyebrow text-ink-faint">FRIDAY · 4:36 PM</p>
<h1 className="text-greeting text-ink mt-2">
  Afternoon, <span className="italic text-accent">{firstName}</span>.
</h1>
<p className="text-body text-ink-muted mt-2">
  5 circles are active right now — good time to join.
</p>
```

**The period at the end of the firstName is mandatory.** The comma after "Afternoon" is mandatory. Fraunces italic reads calm with this punctuation; without it, it reads chirpy.

---

## 4. Spacing

Tailwind's default scale with these preferred stops:

```
0.5 (2px)   ← hairlines
1   (4px)   ← icon gaps inside tight pills
1.5 (6px)   ← between avatar + metadata
2   (8px)   ← inside-card element gap
3   (12px)  ← card padding-x on mobile
4   (16px)  ← card padding-x on desktop, vertical rhythm between sibling cards
5   (20px)  ← card padding-y
6   (24px)  ← between sections on a page
8   (32px)  ← between major blocks (hero → feed)
10  (40px)  ← top margin below navigation on desktop
12  (48px)  ← rarely — only between hero and page body on Landing
```

### Containers
- **Desktop main column:** `max-w-[720px]` on Dashboard, `max-w-[960px]` on Landing, `max-w-[640px]` on Messages/ChatRoom.
- **Side rail:** `w-[280px]`, `space-y-3` between side cards.
- **Left nav rail:** `w-[240px]`.
- **Page padding:** `px-4 sm:px-6 lg:px-0` (outer padding on mobile, centered on desktop with nav rail handling left edge).

---

## 5. Radii

```js
rounded: '6px',          // inputs, small chips
rounded-md: '10px',      // filter pills, avatars as squircles (rare)
rounded-lg: '14px',      // buttons
rounded-xl: '18px',      // ** PRIMARY card radius **
rounded-2xl: '24px',     // hero blocks, modal shells
rounded-full: '999px',   // mode tabs, filter chips, avatars, badges
```

**Post cards, side cards, and every content card use `rounded-xl` (18px).** This is the Village's shape signature — softer than shadcn's 12px, sharper than a pillow.

---

## 6. Shadows

```js
shadow-soft:  '0 1px 2px rgba(43,36,24,0.04)',
shadow-card:  '0 2px 8px rgba(43,36,24,0.05), 0 1px 2px rgba(43,36,24,0.04)',
shadow-float: '0 12px 32px rgba(43,36,24,0.08), 0 2px 6px rgba(43,36,24,0.04)',
```

- `shadow-card` on post cards, side cards, buttons in hover state.
- `shadow-float` on modals, toasts, dropdown menus.
- Night mode uses same shadows (absolute values); the low-contrast background hides them appropriately.

---

## 7. Component anatomy

Each primitive lives in `components/village/`. Import and compose — never hand-roll these.

### `<Wordmark size="sm|md|lg" />`
`The Village` — "The" in Söhne 500, space, "Village" in Fraunces italic accent red. Sizes: sm=18px, md=24px, lg=32px.

### `<Button variant="primary|ghost|link" size="sm|md|lg" />`
Primary: `bg-button text-button-ink rounded-lg h-10 px-5 text-label`. Ghost: transparent, ink text, hover `bg-line-soft`. Link: underline on hover.

### `<IconButton />`
40×40 square with rounded-lg. Ghost by default. For nav actions, theme toggle, notification bell.

### `<Avatar name src size="sm|md|lg" />`
Circular. Sizes: sm=28, md=32, lg=40. Fallback is initial on `bg-accent-soft text-accent` — **not** the generic grey you had.

### `<Pill color="neutral|support|warn|accent">Label</Pill>`
Rounded-full, 11px mono letters — **NO**, scratch that — 12px Söhne 500 tracking-wide. `neutral` is line border + ink-muted. `support` is sage. `warn` is honey. `accent` is red.

### `<Badge count={n} />`
6×6 dot on avatars when online, or 16px circle with number for notifications. Accent red.

### `<SectionHeading eyebrow={optional} title />`
Eyebrow mono uppercase if provided, then `text-section` Fraunces title. Used for page-level section starts.

### `<TrialBanner daysLeft={n} />`
Full-width banner, `bg-banner text-ink`, `rounded-xl px-5 py-4`, kettle emoji on left, body copy, `Upgrade to Village+` as accent link. **This is the ONLY horizontal banner in the product.**

### `<GreetingBlock firstName />`
The eyebrow + greeting + subtitle block described in section 3.

### `<ModeTabs options activeId onChange />`
The `I need help / Browse / Catch up` tab set. Pill container `bg-card border-line rounded-full p-1`. Active tab `bg-button text-button-ink rounded-full`. Inactive `text-ink-muted`. Each tab has a lucide icon on the left.

### `<SearchBar />`
Input `bg-card border-line rounded-full h-12 px-5 text-body`. Search icon left, `+ New Post` button attached right as a primary button (rounded-full, not rounded-lg — only exception).

### `<FilterChip active>Label</FilterChip>`
`rounded-full px-3 h-7 text-micro`. Active: `bg-button text-button-ink`. Inactive: `border-line text-ink-muted`. `+ 5 Live` variant has the live dot prefix.

### `<PostCard post />`
The feed card. Specific structure:

```
┌─────────────────────────────────────────┐
│ [Avatar] Name · CATEGORY · 3 DAYS AGO   │  ← 32px avatar, Söhne 500 name, mono eyebrow category, ink-faint time
│                                         │
│ Post title in Söhne 600 17/24           │  ← text-card-title
│                                         │
│ Preview body in text-body-sm ink-muted  │  ← max 2 lines, line-clamp-2
│                                         │
│ ♡ 0   💬 0   👁 4                       │  ← 13px counts, lucide icons 14px, gap-4
└─────────────────────────────────────────┘

Card: bg-card rounded-xl border-line shadow-card px-5 py-4 space-y-3
Hover: -translate-y-px shadow-float transition-all duration-200
```

### `<SideCard title action={<Link>See all</Link>} children />`
The repeating side-rail card. Header row: Söhne 600 13px title, optional "See all" link in ink-faint. Body varies.

### `<RoomRow icon name count />`
Row inside "Live now" side card. 24px emoji/icon slot, name ink Söhne 500, count ink-faint right-aligned. Hover: `bg-line-soft` across row, `rounded-md`.

### `<EventDateChip date />`
40×40 chip: top line "12" in Fraunces 22px, bottom line "APR" in mono 10px uppercase. `bg-accent-soft text-accent rounded-lg`.

---

## 8. Navigation

### Desktop — Left Rail (240px)

```
┌────────────────────┐
│                    │
│  The Village       │  ← Wordmark size=lg, pt-8 pl-6
│                    │
│  ⌂  Home           │  ← 16px icon, 14px Söhne 500 label
│  ⊞  Spaces      ⌄  │  ← expandable
│  💬 Chats       ⌄  │
│  📅 Events         │
│  ✉  Messages       │
│  👥 Friends        │
│  🔖 Saved          │
│                    │
│  ...               │
│                    │
│  🔔 ☾ ✦            │  ← icon row: notif, theme, plus
│  [Avatar] Name     │
│  email@...         │
└────────────────────┘
```

- Background: `bg-paper` (same as page — no divider visible; only the right edge of the rail has `border-r border-line`)
- Active item: `bg-card border-line rounded-md` — a soft raised pill, NOT a colored fill
- Hover: `bg-line-soft rounded-md`
- Icons are lucide, stroke-width 1.5, size 16

### Mobile — Top bar only (56px), no bottom bar

Old design had a bottom tab bar. **Remove it.** Replace with:
- Top bar: wordmark left (32px), menu icon right
- Menu icon opens a full-screen drawer from the right with the same nav items as desktop rail

---

## 9. Motion

- **Card hover:** `translate-y-[-1px]` + shadow upgrade, 200ms ease-out
- **Button hover:** opacity 0.9 + `translate-y-[-0.5px]`, 150ms
- **Modal open:** scale 0.97 → 1.0 + opacity 0 → 1, 180ms ease-out
- **Page transitions:** none. Keep it calm.
- **Animated accents:** the 2px live-dot pulses (2s ease-in-out infinite). Nothing else pulses, shimmers, or floats.

---

## 10. Voice & copy

### Rules
- Lowercase first word in UI buttons when they're actions (`join circle`, not `Join Circle`). Sentence case for everything else.
- End greeting lines with a **period**. Never exclamation.
- No emoji in UI chrome. Emoji appear in: chat messages, post content, category icons from DB, the 3am 🌙, the kettle 🫖 on trial banner, the leaf 🌿 in "all caught up" empty state.
- Time formatting: `3 DAYS AGO` (mono uppercase small) for cards; `Just now`, `2h ago`, `Yesterday · 4:32 PM` elsewhere.
- Counts: bare number (`4` not `4 views`) — the icon communicates meaning.

### Empty states
Two-line format. Fraunces italic line 1, ink-muted Söhne line 2.

```
The village is quiet right now.
Be the first to share something today.
```

### Example headers we've approved
- `Afternoon, {firstName}.` / `Morning, {firstName}.` / `Evening, {firstName}.`
- `Latest conversations`
- `Live now` / `Spaces for you` / `Near you` / `Parents talking about`
- `You're all caught up` (with 🌿 at end)

---

## 11. Dark mode

Trigger: `<html class="dark">`. All tokens auto-swap.

- Same layout, same shadows, same weights.
- One subtle difference: `text-accent` shifts from deep red (`#B4462B`) to a warmer coral (`#E78A6F`) — reading a dark red on a dark background is hard.
- **Never** introduce separate dark-mode-only colors. If it's not in the day palette, it's not in the night palette.

---

## 12. Accessibility

- Minimum body size 15px (already enforced via `text-body`).
- Minimum contrast 4.5:1 for body text. All token pairs pass.
- Every interactive element has a focus ring: `focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:ring-offset-2 focus-visible:ring-offset-paper`.
- Every icon button has `aria-label`.
- Avatars without an image use initials, not `?`.
- Disabled buttons: opacity 0.5, `cursor-not-allowed`.

---

## 13. What NOT to do

- ❌ No `bg-primary/10` or any arbitrary opacity colors. Use semantic tokens.
- ❌ No `shadow-lg`, `shadow-xl` etc. — only `shadow-card` and `shadow-float`.
- ❌ No `<Card>` with inner `<CardHeader>`, `<CardContent>` from shadcn. Plain `<div>` with utilities.
- ❌ No `backdrop-blur` except on the trial banner and on modal overlays.
- ❌ No glassmorphism on the nav. The old `.glass` class is dead.
- ❌ No circular progress rings, no badges with inner glows, no animated checkmarks.
- ❌ No "premium" feeling via gold/purple/gradient. Premium here = restraint + material quality.

---

## 14. When you add something new

Before you write a single line of JSX for a new page or component:

1. Can you compose it from existing `components/village/*` primitives? If yes — use them.
2. Is the color, radius, spacing value in this doc? If not — **stop and add it here first.** Commit the doc change, then build.
3. When in doubt, ask "what would a linen-bound journal do?" — usually the answer is "less."

This is a system, not a screen library. Every decision compounds.
