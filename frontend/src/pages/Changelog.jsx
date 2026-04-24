import { Link } from "react-router-dom";
import Navigation from "../components/Navigation";
import { ArrowLeft, ScrollText } from "lucide-react";
import AppFooter from "../components/AppFooter";

const CHANGELOG = [
  {
    version: "3.4.0",
    date: "April 2026",
    title: "Design Handoff — Left Sidebar, Custom Icons & Full Layout Overhaul",
    entries: [
      { tag: "Design",   text: "Desktop navigation converted from top bar to fixed left sidebar (w-60). Wordmark at top, primary nav with custom SVG icons, Village+ promo strip, and user/notifications footer row. All page content offset with lg:pl-60." },
      { tag: "Design",   text: "Custom icon pack (icons.jsx) now used throughout the sidebar: IconHome, IconChat, IconMoon, IconCal, IconMail, IconPeople, IconHeart, IconShield, IconCog — hand-drawn 24×24 SVGs with 1.5px stroke." },
      { tag: "Design",   text: "Sidebar active item: paper-2 background with accent-coloured icon. Hover state uses inline onMouseEnter/Leave for CSS-variable-aware colour without Tailwind conflicts." },
      { tag: "Design",   text: "Sidebar dropdown sub-menus (Spaces, Chats) open to the right (side='right') with paper-2 background and var(--line) border, replacing the old top-bar hover menus." },
      { tag: "Design",   text: "All 30+ authenticated pages updated: outer wrapper gains lg:pl-60 for sidebar offset; main element changes from pt-20 lg:pt-24 to pt-16 lg:pt-8 (no top bar on desktop)." },
      { tag: "Design",   text: "Login and Register pages: warm split-screen layout — 40% left panel with watercolour blob SVG, Wordmark, and italic testimonial quote; 60% right panel form on paper-2 background. All inputs 44px height with var(--line) borders." },
      { tag: "Design",   text: "Landing page: paper-cream hero with noise overlay, Fraunces heading with italic accent on 'your village', single dark-ink CTA, custom icon feature cards on paper-2, proverb block in serif italic, dark-ink footer with inverted Wordmark." },
      { tag: "Design",   text: "Dashboard greeting: mono eyebrow (weekday · time in 10px uppercase), serif h1 with italic accent on first name, replacing old gradient card header." },
      { tag: "Design",   text: "Events page header: 'What\u2019s on · near you.' with serif italic accent." },
      { tag: "Design",   text: "CSS cascade fix: html[data-theme='day/night'] selector specificity raised to (0,1,1) — prevents any .dark class or :root block from overriding the warm palette. All colour tokens moved exclusively to theme.css." },
      { tag: "Fixed",    text: "index.js import order fixed: theme.css loaded before index.css so design tokens are always available on first paint." },
      { tag: "Fixed",    text: "index.css stripped of all colour token definitions (:root colour block and .dark block removed) — eliminates warm/cold palette conflict in dark mode." },
    ],
  },
  {
    version: "3.3.0",
    date: "April 2026",
    title: "Design System — Warm Theme, Fraunces Typography & Wordmark",
    entries: [
      { tag: "Design",     text: "New day/night token sheet (theme.css) — warm paper-cream day palette (#f7f2e9 base) and candlelight-warm night palette (#17120e base). Full shadcn bridge so all existing components inherit the new palette without code changes." },
      { tag: "Design",     text: "Typography upgraded: Fraunces (editorial serif) for all headings and the wordmark, Inter Tight for body text, JetBrains Mono for metadata labels. Loaded via Google Fonts with preconnect hints." },
      { tag: "Design",     text: "Typographic wordmark component (Wordmark.jsx) — 'The Village' rendered in Fraunces with italic accent on 'Village'. Replaces logo PNG in Navigation header (desktop and mobile). Monogram variant available for avatars and watermark corners." },
      { tag: "Design",     text: "Custom icon set (icons.jsx) — 20 hand-drawn-feel SVG icons (IconHome, IconChat, IconMoon, IconHand, IconPin, IconShield, IconMask, etc.) for use in place of emojis in feature sections." },
      { tag: "Added",      text: "useTheme hook + ThemeToggle component — Day / Night / Auto pill. Replaces the old binary dark/light Switch in Profile. Auto mode follows system preference. Writes to 'village.theme' key with legacy 'theme' key kept in sync." },
      { tag: "Improved",   text: "Theme initialisation in index.html updated — reads 'village.theme' first, falls back to old 'theme' key for migration. Sets data-theme attribute on <html> before first paint to prevent flash." },
      { tag: "Improved",   text: "Navigation theme toggle now uses useTheme() — no more direct DOM classList manipulation. Both desktop Sun/Moon button and Profile ThemeToggle stay in sync via localStorage." },
      { tag: "Improved",   text: "Profile Appearance section upgraded from binary dark/light Switch to Day / Night / Auto ThemeToggle pill." },
    ],
  },
  {
    version: "3.2.0",
    date: "April 2026",
    title: "Security Hardening, Performance, Location Detection & UX Polish",
    entries: [
      { tag: "Security",     text: "Stripe webhook now requires a valid STRIPE_WEBHOOK_SECRET — unsigned webhook events are rejected with HTTP 503. Previously any POST to /webhook could trigger a free premium upgrade." },
      { tag: "Security",     text: "Stripe webhook validates user_id from checkout metadata against the database before upgrading subscription_tier — prevents spoofed checkout metadata from upgrading arbitrary accounts." },
      { tag: "Security",     text: "Rate limiting added to registration (5/hr per IP), password reset (5/hr per IP), chat messages (60/min per user), direct messages (30/min per user), friend requests (20/hr per user), and image uploads (10/min per user)." },
      { tag: "Security",     text: "Email templates now HTML-escape all dynamic data (display_name, post titles, etc.) — prevents HTML injection in notification emails." },
      { tag: "Security",     text: "Public profile endpoint now strips sensitive fields (password_hash, email, DOB, reset tokens, stripe IDs, billing info) from non-owner/non-admin responses." },
      { tag: "Security",     text: "Private community posts now return HTTP 403 for non-members — previously the API returned posts from communities the requesting user had not joined." },
      { tag: "Security",     text: "Cookie flags (Secure, SameSite) now driven by IS_PRODUCTION env var rather than heuristics — set IS_PRODUCTION=true in Railway production environment." },
      { tag: "Performance",  text: "20+ MongoDB indexes added on startup — covers users (user_id, email, stripe_customer_id), friendships, friend_requests, events, chat_messages, notifications, direct_messages, and user_blocks. Dramatically reduces query time on hosted DB." },
      { tag: "Performance",  text: "N+1 query eliminated on friend requests endpoint — sender profiles now fetched in a single $in batch query instead of one DB call per request." },
      { tag: "Performance",  text: "N+1 query eliminated on DM conversations endpoint — conversation partner profiles now fetched in a single $in batch query." },
      { tag: "Performance",  text: "Pydantic v2 max_length validation added to ForumPost (title 300, content 10,000), ForumReply (2,000), DirectMessage (2,000), and UserProfile (nickname 50, bio 500) — prevents outsized documents hitting the DB." },
      { tag: "Performance",  text: "Dashboard data now cached in sessionStorage with 5-minute TTL — repeated page visits within the same session skip redundant API calls." },
      { tag: "Performance",  text: "Navigation polling pauses automatically when the browser tab is hidden (Page Visibility API) — reduces server load by ~50% for backgrounded tabs." },
      { tag: "Added",        text: "Use My Location button — browser geolocation → Australian reverse geocode via Nominatim. Available on Onboarding, Profile, Group Chats Local tab, and Event creation. All location searches locked to Australia (countrycodes=au)." },
      { tag: "Added",        text: "Group Chats local tab now saves GPS-detected location directly to your profile — no need to navigate to Settings first." },
      { tag: "Added",        text: "Navigation header now has dropdown sub-menus — Spaces (▾) shows All Spaces, Communities, Create Post, Saved; Group Chats (▾) shows All Australia, Local Circles, Friends. Main label still navigates directly on click." },
      { tag: "Added",        text: "Dashboard feed now shows a live '🟢 X Live' pill in the filter row alongside Latest, Nearby, Unread, Trending — visible on desktop and mobile. Links directly to Group Chats." },
      { tag: "Added",        text: "Unread messages badge on the Messages nav item (desktop and mobile bottom bar) — shows red count for unread DMs. Hidden for free users." },
      { tag: "Added",        text: "GET /api/messages/unread-count endpoint — returns count of unread direct messages for the current user." },
      { tag: "Fixed",        text: "Events detail modal had two X close buttons — one from shadcn DialogContent auto-render and one custom header button. Shadcn's auto-X now suppressed via [&>button]:hidden." },
      { tag: "Fixed",        text: "Forums upgrade link pointed to /premium (404) — corrected to /plus." },
      { tag: "Improved",     text: "Profile edit form now uses collapsible accordion sections on all screen sizes — previously all sections force-expanded on desktop making the form very long." },
      { tag: "Improved",     text: "Profile edit now has a sticky Save/Cancel bar at the top — always visible without scrolling to the bottom." },
      { tag: "Improved",     text: "Profile view mode now shows parenting stage, single parent status, connection preference, and interests as readable chips — previously only bio was displayed." },
      { tag: "Improved",     text: "Notification items in the bell dropdown are now keyboard-accessible <button> elements with focus-visible ring — previously non-interactive divs." },
      { tag: "Improved",     text: "Logout and delete-account endpoints now use consistent cookie flags matching the login endpoint." },
    ],
  },
  {
    version: "3.1.0",
    date: "April 2026",
    title: "Stripe Payments — Village+ Subscriptions",
    entries: [
      { tag: "Added",    text: "Stripe subscription checkout — Village+ pricing ($9.99/mo or $95.88/yr) wired to real Stripe Checkout Sessions. Users are redirected to Stripe's hosted checkout page; no card data ever touches our servers." },
      { tag: "Added",    text: "Billing period toggle on Village+ page — switch between Monthly and Annual before checkout. Annual shows 20% saving badge and calculates A$23.88 saved vs monthly." },
      { tag: "Added",    text: "Stripe webhook handler — listens for checkout.session.completed, customer.subscription.updated, customer.subscription.deleted, and invoice.payment_failed. Automatically upgrades/downgrades subscription_tier in the database." },
      { tag: "Added",    text: "Stripe Billing Portal — Village+ subscribers can manage, update payment details, or cancel their subscription via Stripe's hosted portal. Accessible via 'Manage billing' button on the Village+ page." },
      { tag: "Added",    text: "Subscription success page (/subscription/success) — shown after successful checkout with confirmation message and links to Dashboard and billing management." },
      { tag: "Added",    text: "Subscription cancel page (/subscription/cancel) — shown if user exits Stripe checkout without completing. Reassures user nothing was charged." },
      { tag: "Added",    text: "Stripe product/price auto-creation at server startup — Village+ product and both prices (monthly $9.99 AUD, annual $95.88 AUD) are created in Stripe automatically if they don't exist. No manual dashboard setup required." },
      { tag: "Added",    text: "Payment failed notification — when Stripe invoice.payment_failed fires, the user receives an in-app notification prompting them to update their payment details." },
      { tag: "Updated",  text: "Domain updated from ourlittlevillage.au to ourlittlevillage.com.au across all files — emails, CORS origins, API docs, env examples, stress tests." },
      { tag: "Legal",    text: "Business entity name and ABN placeholder added to Terms & Conditions and Privacy Policy contact sections as required by Australian Consumer Law." },
    ],
  },
  {
    version: "3.0.1",
    date: "April 2026",
    title: "Domain Update & Business Name Display",
    entries: [
      { tag: "Updated",  text: "All platform references updated from ourlittlevillage.au to ourlittlevillage.com.au — email addresses (hello, safety, privacy), website URLs, CORS origins, .env examples, and stress test base URL." },
      { tag: "Legal",    text: "Legal entity name and ABN placeholder added to Terms & Conditions and Privacy Policy contact sections — 'Our Little Village — Parenting Assistance Platform | ABN: [YOUR ABN]' — required display under Australian Consumer Law and Business Names Registration Act." },
    ],
  },
  {
    version: "3.0.0",
    date: "April 2026",
    title: "Legal & Compliance, Age Verification, Gender-Aware Spaces & Public Pages",
    entries: [
      { tag: "Legal",     text: "Terms & Conditions fully rewritten — 13 sections covering eligibility (18+), anonymous posting with accurate legal framing, Village+ subscription terms, Australian Consumer Law preservation clause, governing law (Victoria), appeals process, and updated contact emails (ourlittlevillage.com.au)." },
      { tag: "Legal",     text: "Privacy Policy fully rewritten to comply with the Australian Privacy Act 1988 and Australian Privacy Principles — 12 sections including NDB scheme, OAIC complaints pathway, data storage statement, and updated TL;DR summary." },
      { tag: "Legal",     text: "Community Guidelines expanded — 8 guidelines with explicit zero-tolerance section, spam/MLM rule, medical info disclaimer, safeguarding detail, consequences table, and appeals process." },
      { tag: "Added",     text: "Date of birth field added to registration — 18+ age verification enforced on both frontend (date picker with max date) and backend (ISO date parse + exact age calculation). DOB stored on user record." },
      { tag: "Added",     text: "Legal acceptance checkbox on registration — users must confirm they are 18+ and agree to Terms & Conditions, Privacy Policy, and Community Guidelines before creating an account. Uses shadcn Checkbox for reliable click handling." },
      { tag: "Added",     text: "PublicNav component — a minimal auth-free navigation bar for public pages (Terms, Privacy, Community Guidelines, Contact). No API calls, no redirects, just logo → landing, theme toggle, Sign In and Join Free links." },
      { tag: "Fixed",     text: "Terms, Privacy, Community Guidelines, and Contact pages now use PublicNav instead of the authenticated Navigation — previously these pages made backend API calls and could redirect unauthenticated visitors to /login." },
      { tag: "Fixed",     text: "Back buttons on all public legal pages now use window.history.back() — previously pointed to /dashboard which required auth and redirected unregistered users to login." },
      { tag: "Fixed",     text: "Legal document links on the registration form (Terms, Privacy, Guidelines) now open in a new tab as fully self-contained public pages with zero backend calls." },
      { tag: "Fixed",     text: "Registration checkbox click area — replaced broken custom implementation (sr-only input + separate onClick div with misaligned hit areas) with shadcn Checkbox + htmlFor label. Links inside label use stopPropagation so clicking them opens the doc without toggling the checkbox." },
      { tag: "Fixed",     text: "Gender filtering — Mum Space/Chat now only visible to users with gender=female; Dad Space/Chat only visible to gender=male. Users who select 'Prefer not to say', 'Other', or have not disclosed gender see neither. Applies to Forums (featured cards + applyGenderFilter), ChatRooms (featured cards + grid filter), and Dashboard (room list)." },
      { tag: "Fixed",     text: "Landing page demo content was showing Mum Chat and Dad Chat to all visitors before sign-up. Replaced with gender-neutral rooms (Mental Health, Sleep & Settling) and neutral events (Parents Coffee Morning, Toddler Playgroup)." },
      { tag: "Improved",  text: "Gender change in Profile Settings now instantly unlocks Mum/Dad spaces and chats across the platform without page reload. Profile dispatches a village:profileUpdated CustomEvent; ChatRooms, Forums, and Dashboard listen for it and update liveGender state immediately — no re-login, no refresh required." },
      { tag: "Improved",  text: "Anonymous posting description updated to accurate legal framing — 'Your name and avatar are hidden from other members. Anonymous posts are not linked to your account by design.' (removed 'truly anonymous' claim)." },
      { tag: "Improved",  text: "Event creation form now shows a safety notice — 'For in-person meetups, always meet in a public place and trust your instincts.' Event detail modal shows the notice when the event has a physical venue." },
      { tag: "Improved",  text: "Settings page now has a Legal section — direct links to Terms, Privacy Policy, and Community Guidelines, plus an account deletion reminder with 30-day data removal notice." },
      { tag: "Removed",   text: "Suggestions link removed from AppFooter — it required authentication and was appearing on public pages (Terms, Privacy, Guidelines) accessible before registration." },
    ],
  },
  {
    version: "2.9.0",
    date: "April 2026",
    title: "Design System, Security Hardening & Platform-Wide Polish",
    entries: [
      { tag: "Design",   text: "CSS design tokens added to index.css — typography scale (--text-xs through --text-4xl), spacing scale (--space-1 through --space-12), border radius scale, and animation duration variables. All body/heading font references now use token variables." },
      { tag: "Improved", text: "Profile edit form on mobile now collapses into accordion sections (About You, Parenting Stage, Location, Preferences, Interests, Notifications, Appearance) — no more endless scroll on small screens." },
      { tag: "Improved", text: "Locked nav items (Events, Messages for free users) now show a tooltip on hover — 'Village+ feature — upgrade to unlock' — with a link to the upgrade page." },
      { tag: "Improved", text: "Error toasts on Events, Community posts, and Messages conversations now include a Retry button that re-runs the failed fetch." },
      { tag: "Fixed",    text: "Community posts page now imports toast for error handling — previously failed silently on network errors." },
      { tag: "Security", text: "All MongoDB regex queries now use re.escape() to prevent ReDoS injection — user search, post search, admin user search, nickname check, event suburb filter." },
      { tag: "Security", text: "In-memory rate limiter added (no external deps) — login limited to 10 requests/min per IP, search endpoints to 30 requests/min per IP. Returns HTTP 429 with friendly message." },
      { tag: "Security", text: "CORS configuration tightened — explicit method whitelist (GET/POST/PUT/PATCH/DELETE/OPTIONS) and header whitelist instead of allow_methods='*' / allow_headers='*'. Preflight cache set to 10 minutes." },
      { tag: "Improved", text: "All email notification links now use FRONTEND_URL env var instead of hardcoded 'http://localhost:3000' — set FRONTEND_URL=https://app.ourlittlevillage.com.au in production .env." },
      { tag: "Performance", text: "Admin reports endpoint N+1 eliminated — reporter and content now fetched in batch queries (one query each for posts, replies, reporters) instead of one DB call per report." },
      { tag: "Performance", text: "Location-based post filtering now uses a lat/lon bounding box pre-filter in MongoDB before Haversine exact check — reduces documents loaded from up to 500 to only those within the geographic window." },
      { tag: "Improved", text: "Pagination parameters on /forums/posts and /feed now validated with Query(ge=1, le=100) — prevents clients requesting unlimited results in a single call." },
      { tag: "Improved", text: "Anonymous post masking extracted to reusable mask_anonymous_post() helper — replaced 7 identical 3-line blocks across the codebase." },
      { tag: "Improved", text: "Background email tasks now use fire_and_forget() wrapper with done-callback error logging — exceptions no longer swallowed silently, appear in server logs as ERROR entries." },
      { tag: "Architecture", text: "services/ package created in backend — geo.py (calculate_distance, bounding_box, geocode_address), rate_limiter.py, and tasks.py (fire_and_forget) extracted as reusable modules." },
    ],
  },
  {
    version: "2.8.3",
    date: "April 2026",
    title: "Scroll Fix — Messages No Longer Hijacks the Page",
    entries: [
      { tag: "Fixed", text: "Messages page and chat popout were scrolling the entire browser page to the bottom when new messages arrived. Switched from scrollIntoView() (which bubbles up to the page) to direct scrollTop assignment on the messages container — only the chat scrolls now." },
    ],
  },
  {
    version: "2.8.2",
    date: "April 2026",
    title: "Infrastructure Tuning, Seed Data & Test Suite",
    entries: [
      { tag: "Improved", text: "MongoDB connection pool tuned — maxPoolSize 50, minPoolSize 5, idle timeout 30s, connect timeout 5s. Reduces latency spikes under concurrent load on the hosted DB." },
      { tag: "Improved", text: "uvicorn now runs with 4 workers and uvloop event loop on Railway — meaningfully higher throughput for concurrent API requests" },
      { tag: "Added",    text: "Seed endpoint now seeds 4 sample events (Morning Playgroup, Mums Coffee Morning, Dad & Toddler Catch-up, Online Q&A Webinar) and 3 communities (Bondi Beach Mums, Sydney Dads Network, NICU & Premmie Parents) if collections are empty" },
      { tag: "Fixed",    text: "Events modal had two close buttons — shadcn DialogContent auto-renders its own X plus the header had a custom one. Suppressed the shadcn auto-X via [&>button]:hidden." },
      { tag: "Improved", text: "Comprehensive test suite now accepts --url flag so it can run against any environment: python test_comprehensive.py --url https://backend.railway.app/api" },
      { tag: "Improved", text: "Test suite events and communities creation now uses the premium user session — avoids false 403 failures from tier-gating in those sections" },
      { tag: "Added",    text: "MongoDB indexes added for notifications and direct_messages collections — (user_id, is_read), (user_id, created_at), (receiver_id, sender_id, created_at) — dramatically faster queries on hosted DB" },
    ],
  },
  {
    version: "2.8.1",
    date: "April 2026",
    title: "Backend Fixes & Live Online Count",
    entries: [
      { tag: "Fixed",   text: "verified_partner role now accepted by admin endpoint — admins can assign clinician badge to healthcare professionals" },
      { tag: "Fixed",   text: "GET /users/blocked returning 404 — route was shadowed by the wildcard /users/{user_id} pattern. Moved to correct position." },
      { tag: "Added",   text: "GET /stats/online — new public endpoint returning live online_now count (users active in last 5 min) and active_rooms (rooms with messages in last hour)" },
      { tag: "Improved", text: "Landing page hero badge now shows live count — '12 Australian parents online right now'. Refreshes every 60s. Shows 0 if empty, falls back to static label if API unreachable." },
    ],
  },
  {
    version: "2.8.0",
    date: "April 2026",
    title: "Homepage Redesign, Scroll Fixes & Clinician Page",
    entries: [
      { tag: "Redesign",  text: "Landing page rebuilt end-to-end — new hero headline focused on Australian mums in need, crisis support band (PANDA/Lifeline/Beyond Blue) above the fold, 9-feature grid, Verified Partner section, Village+ pricing comparison, For Clinicians strip, Privacy TL;DR cards, and updated footer with Made in Australia" },
      { tag: "Added",     text: "Crisis resources band on landing page — PANDA 1300 726 306, Lifeline 13 11 14, Beyond Blue 1300 22 4636 with tap-to-call links, visible before logging in" },
      { tag: "Added",     text: "Village+ pricing section on landing page — transparent free vs. Village+ comparison with feature checklist" },
      { tag: "Added",     text: "Verified Partners section on landing page — badge explainer, midwife image, link to /for-clinicians" },
      { tag: "Improved",  text: "/for-clinicians page now has its own standalone public nav and footer — no longer loads the internal app navigation when accessed pre-login" },
      { tag: "Fixed",     text: "Chat popout auto-scroll to bottom — was scrolling to bottom on every 5s poll even when user had scrolled up to read history. Now respects scroll position." },
      { tag: "Fixed",     text: "Messages page auto-scroll — swapped non-standard behavior: instant for behavior: auto so conversation-switch jump works correctly across all browsers" },
      { tag: "Added",     text: "For Clinicians link in landing page nav (desktop) and both hero CTAs" },
    ],
  },
  {
    version: "2.7.0",
    date: "April 2026",
    title: "Simplified UX, PWA, Health-Sector Readiness & Dashboard Modes",
    entries: [
      { tag: "Design",   text: "Dashboard now has three intent-driven modes — 💙 I need help, 🏘️ Browse, 🔔 Catch up — so the first thing you see matches why you opened the app" },
      { tag: "Improved", text: "Browse mode right rail trimmed to 3 focused widgets (Activity, Live now, Spaces for you) — the rest is in Catch up where it belongs" },
      { tag: "Changed",  text: "Dashboard always opens on Browse on every visit — no more remembering your last mode" },
      { tag: "Changed",  text: "New posts now default to Anonymous — you choose to attach your name, not the other way around" },
      { tag: "Changed",  text: "\"Support Spaces\" renamed to \"Spaces\" everywhere, \"Chat Circles\" renamed to \"Group Chats\", Friend Chats + Private Messages unified into one Direct Messages list" },
      { tag: "Added",    text: "PWA support — install The Village to your home screen on any device. iOS: Tap Share → Add to Home Screen. Android/Chrome: tap Install when prompted" },
      { tag: "Added",    text: "\"Add to Home Screen\" nudge appears after your second visit on supported browsers" },
      { tag: "Added",    text: "Group Chats shortcut on the Spaces page for mobile users" },
      { tag: "Added",    text: "Mobile bottom nav redesigned with labels and a Me tab — Home, Spaces, Events, Messages, Me" },
      { tag: "Improved", text: "Onboarding rebuilt as 5 focused steps: Welcome → About You → Location → What brings you here? → You're in! Interests are now auto-set from your parenting stage" },
      { tag: "Added",    text: "\"What brings you here?\" step in onboarding routes you directly to the right part of the app — vent, ask a question, or just browse" },
      { tag: "Added",    text: "Crisis support banner in mental health Spaces — PANDA, Lifeline, and Beyond Blue numbers surface automatically with tap-to-call links" },
      { tag: "Added",    text: "Verified Partner badge — healthcare professionals (midwives, GPs, psychologists) can receive a verified badge shown on their posts and profile" },
      { tag: "Added",    text: "/for-clinicians page — referral resource for healthcare professionals to recommend The Village to patients" },
      { tag: "Added",    text: "Privacy Policy now has a plain-language TL;DR card — six bullet points covering what actually matters, before the legal detail" },
      { tag: "Added",    text: "\"For Clinicians\" link in the app footer" },
    ],
  },
  {
    version: "2.6.0",
    date: "April 2026",
    title: "Village+ Tiers, Feature Gates & Onboarding Polish",
    entries: [
      { tag: "Changed", text: "Free tier limits updated — 5 support space posts per week, 5 replies per week, 10 chat messages per day (previously mixed daily/monthly caps)" },
      { tag: "Changed", text: "Events are now a Village+ feature — free users see a clear upgrade path from the dashboard and nav. Trial users retain full access during their 7 days" },
      { tag: "Changed", text: "Direct messages are now Village+ only — free users see the upgrade prompt in the chat popout and Messages nav item" },
      { tag: "Changed", text: "Community Spaces are now Village+ only — free users see a consistent upgrade tile on the dashboard" },
      { tag: "Added", text: "Trial countdown on the dashboard now changes day-by-day at midnight rather than anchoring to the hour of sign-up" },
      { tag: "Added", text: "One-time downgrade notice — on first login after your trial expires, a card explains exactly what you've retained and what's now locked, with an upgrade option" },
      { tag: "Added", text: "Lock indicators on nav items (Events, Messages) for free users — small lock icon so it's clear before clicking" },
      { tag: "Added", text: "\"Twins or more\" option added to both the main parenting stage selector and the mixed age sub-selection in onboarding" },
      { tag: "Improved", text: "Support Spaces tour icon replaced with The Village logo; Chat Circles icon updated to a chat bubble — more accurate and on-brand" },
      { tag: "Fixed", text: "\"Start exploring\" at the end of onboarding now correctly navigates to the dashboard instead of looping back to step 1" },
      { tag: "Fixed", text: "Password requirements (8+ characters, uppercase, number) now enforced at registration with live visual feedback" },
      { tag: "Improved", text: "Village+ page updated with accurate tier descriptions, weekly limits, and Coming Soon marker on Buy & Swap" },
    ],
  },
  {
    version: "2.5.0",
    date: "April 2026",
    title: "Visual Redesign & UX Polish",
    entries: [
      { tag: "Design", text: "Chat bubbles fully rounded on all sides across Chat Circles, Messages, and the chat popout — cleaner and more modern" },
      { tag: "Design", text: "Mobile bottom navigation simplified to icon-only with an active-tab pill indicator — less visual noise, more thumb space" },
      { tag: "Design", text: "Threaded replies in Support Spaces now use a warm sage left border and subtle tint — easier to follow conversations at a glance" },
      { tag: "Design", text: "Feature cards on the landing page have a subtle radial gradient accent for depth" },
      { tag: "Design", text: "Support Spaces page narrowed to a focused reading width — long posts are easier to read" },
      { tag: "Improved", text: "Reply box in Support Spaces now auto-expands as you type — no more text spilling outside the input" },
      { tag: "Fixed", text: "Messages page bubble colours now consistent with Chat Circles" },
    ],
  },
  {
    version: "2.4.0",
    date: "April 2026",
    title: "Mum & Dad Circles, Chat Overhaul, Dark Mode & Private Posts",
    entries: [
      { tag: "Added", text: "Mum Circle — a dedicated Support Space for mums, featured prominently in both Chat Circles and Support Spaces" },
      { tag: "Added", text: "Dad Circle — a dedicated space for dads alongside Mum Circle, both featured at the top of Village Circles" },
      { tag: "Added", text: "Village Circles tab — browse all themed, national chat circles (Mum, Dad, 3am Club, mental health, and more) from one place" },
      { tag: "Added", text: "Local Circles tab — search integrated directly into your local area; no separate search needed" },
      { tag: "Added", text: "3am Club auto-featured — the 3am Club card moves to the top of Village Circles automatically between 10pm and 4am AEST" },
      { tag: "Added", text: "Private posts — choose 'Only me' when posting to save a private draft. Edit and change visibility before sharing with the community" },
      { tag: "Added", text: "Messages page — full-screen private chat with friends, unified with the chat popout system. Same rooms, same history" },
      { tag: "Added", text: "Terms & Conditions, Privacy Policy, Community Guidelines, Contact, and Suggestions pages — accessible from the profile menu and app footer" },
      { tag: "Added", text: "App footer — quick links to Terms, Privacy, Community Guidelines, Contact, and Suggestions on all informational pages" },
      { tag: "Changed", text: "Dark mode is now the default for new users — The Village looks great at night, and most parents are up at night" },
      { tag: "Changed", text: "'Buy & Swap' removed from interests — replaced with 'Mum Talk' in onboarding and profile settings" },
      { tag: "Improved", text: "Onboarding no longer loses focus when typing your name or suburb — a persistent bug is now fixed" },
      { tag: "Improved", text: "Suburb search in onboarding now uses a dropdown with real Australian locations — no more free-text guessing" },
      { tag: "Improved", text: "Returning users resume onboarding from where they left off rather than starting from scratch" },
      { tag: "Improved", text: "Homepage feed capped at 7 posts for a less overwhelming first view" },
    ],
  },
  {
    version: "2.3.0",
    date: "April 2026",
    title: "Events Overhaul, Homepage Near You & Blog Submissions",
    entries: [
      { tag: "Added", text: "Venue search in events — find parks, cafés, libraries, community centres via address autocomplete (powered by OpenStreetMap)" },
      { tag: "Added", text: "Homepage 'Near You' now shows upcoming local events and suburb chat circles instead of user profiles" },
      { tag: "Added", text: "Saved Resources hub shortcut added to homepage quick links (desktop and mobile)" },
      { tag: "Added", text: "Anyone can now submit blog articles — moderators and admins approve before publishing" },
      { tag: "Added", text: "Blog moderation queue in Admin dashboard — approve or reject submissions with one tap" },
      { tag: "Added", text: "Post visibility — choose who sees your post: Everyone, Friends only, or This circle only" },
      { tag: "Added", text: "Private events — mark events as private, only visible to the organiser until invites are sent" },
      { tag: "Added", text: "Distance filter on Events page — filter by 5km, 10km, 25km or 50km from your suburb" },
      { tag: "Improved", text: "Event date and time pickers now work correctly in dark mode" },
      { tag: "Removed", text: "Removed 'Single Parents in The Village' section from homepage — it was surfacing user profiles without consent" },
    ],
  },
  {
    version: "2.2.0",
    date: "April 2026",
    title: "Events & Saved Resources",
    entries: [
      { tag: "Added", text: "Events page — browse and create local meetups, playgroups, workshops and support events near you" },
      { tag: "Added", text: "RSVP to events with one tap — see who's going and how many spots are left" },
      { tag: "Added", text: "Add to Calendar — download any event as an .ics file for Apple Calendar, Google Calendar, or Outlook" },
      { tag: "Added", text: "Saved Resources hub — one place for your saved posts, chat messages, and RSVPd events" },
      { tag: "Added", text: "Save chat messages — tap the bookmark icon on any chat message to save it for later" },
      { tag: "Changed", text: "Bookmarks renamed to Saved — old bookmarks link redirects automatically" },
    ],
  },
  {
    version: "2.1.0",
    date: "April 2026",
    title: "Onboarding, Today in your Village & Mixed Age Groups",
    entries: [
      { tag: "Added", text: "\"Today in your village\" panel on the homepage — shows trending posts from the past 7 days at a glance" },
      { tag: "Added", text: "Mixed age group sub-selection in onboarding — parents with kids across multiple stages can now specify each age group they have" },
      { tag: "Improved", text: "Homepage right column now surfaces what's happening today, replacing the second Recommended panel" },
      { tag: "Improved", text: "Onboarding flow now saves mixed_age_groups alongside parenting stage for more accurate circle recommendations" },
    ],
  },
  {
    version: "2.0.0",
    date: "May 2026",
    title: "Circles, Support Spaces & Visual Overhaul",
    entries: [
      { tag: "Changed", text: "Forums renamed to Support Spaces — a warmer, more intentional name for the discussion areas" },
      { tag: "Changed", text: "Chat Rooms renamed to Circles — local and themed chat spaces now have a consistent identity" },
      { tag: "Added", text: "Dad Circle — a dedicated space just for dads. No judgment, just real talk." },
      { tag: "Added", text: "New Circle categories: Sleep Circle, Feeding Circle, Toddler Circle, Newborn Circle, School Age Circle, Teenager Circle, Single Parent Circle, Mental Health Circle" },
      { tag: "Added", text: "Homepage three-column layout — identity card, activity feed, and local/nearby parents panel" },
      { tag: "Added", text: "Parent Identity widget — see and edit your interest tags from the dashboard" },
      { tag: "Added", text: "Recommended Circles — personalised circle suggestions based on your parenting stage and interests" },
      { tag: "Added", text: "Trust badges — Trusted Parent, Night Owl, Local Parent, and Verified Professional earned by community activity" },
      { tag: "Design", text: "Admin/Moderator dashboard redesigned with Kindness Health metric, unanswered support posts, and Moderator principles" },
    ],
  },
  {
    version: "1.3.0",
    date: "April 2026",
    title: "UI Polish & Design System",
    entries: [
      { tag: "Design", text: "Consistent card surfaces and spacing rhythm across every page" },
      { tag: "Design", text: "Warm, helpful empty states with emoji, heading, and a clear next step — no more dead ends" },
      { tag: "Design", text: "New onboarding flow — tappable parenting-stage cards and a proper welcome moment" },
      { tag: "Fixed", text: "Chat popout now hides when you're already inside a chat room" },
      { tag: "Design", text: "Unified form style — consistent focus rings and character counters on all text inputs" },
      { tag: "Design", text: "Admin dashboard now shares the same card system as the rest of the app" },
    ],
  },
  {
    version: "1.2.0",
    date: "April 2026",
    title: "Friends Chat, Online Status & Chat Popout",
    entries: [
      { tag: "Added", text: "Private 1-on-1 chat rooms for friends — no daily message limit" },
      { tag: "Added", text: "Online presence indicator — green dot on friend avatars when they're active" },
      { tag: "Added", text: "Friends tab in Chat Rooms — see who's online and jump straight into a private chat" },
      { tag: "Added", text: "Private Chat button on the Friends page" },
      { tag: "Added", text: "Floating chat popout — stays open while you browse, remembers your last conversation" },
    ],
  },
  {
    version: "1.1.0",
    date: "April 2026",
    title: "Communities & Premium Perks",
    entries: [
      { tag: "Added", text: "Reddit-style user communities — premium members can create up to 3 sub-communities" },
      { tag: "Added", text: "Crown badge next to premium member names in posts, replies, and chat messages" },
      { tag: "Added", text: "Community creator tools — edit community details, delete community, and pin posts" },
      { tag: "Added", text: "This changelog & roadmap page" },
    ],
  },
  {
    version: "1.0.0",
    date: "March 2026",
    title: "Foundation Launch",
    entries: [
      { tag: "Added", text: "Core forum with topic and age-group categories, threaded replies, likes, bookmarks" },
      { tag: "Added", text: "Suburb & postcode chat rooms — created on-demand, lazily archived when idle" },
      { tag: "Added", text: "Local Meetups forum category with distance filtering" },
      { tag: "Added", text: "Freemium model: 5 forum posts per week and 20 chat messages per day for free accounts" },
      { tag: "Added", text: "7-day free trial for new members with full access" },
      { tag: "Added", text: "Admin dashboard with user analytics, moderation queue, and content removal tools" },
      { tag: "Added", text: "Admin can ban users, remove posts/replies, and send notifications to affected members" },
      { tag: "Added", text: "Google OAuth and email/password sign-in" },
      { tag: "Added", text: "Profile pages with parenting stage, interests, location, and avatar upload" },
      { tag: "Added", text: "Friend requests, direct messages, and online-friend list" },
      { tag: "Added", text: "Anonymous posting option in all forum categories" },
      { tag: "Added", text: "Image attachments on forum posts (JPEG, PNG, GIF, WebP up to 5 MB)" },
    ],
  },
];

const ROADMAP = [
  {
    version: "Next",
    title: "Native App (iOS & Android)",
    entries: [
      { tag: "Planned", text: "iOS App Store and Google Play apps — same codebase, wrapped with Capacitor for a true native shell" },
      { tag: "Planned", text: "Native push notifications — get notified when someone replies to your post, even when the app is closed" },
      { tag: "Planned", text: "Native home screen icon, no browser chrome, offline-capable" },
    ],
  },
  {
    version: "Soon",
    title: "Payments & Subscriptions",
    entries: [
      { tag: "Planned", text: "Stripe-powered Village+ checkout — subscribe directly in-app, no redirect to external page" },
      { tag: "Planned", text: "Automatic tier changes on subscription events — upgrade, downgrade, and cancellation handled seamlessly" },
    ],
  },
  {
    version: "Soon",
    title: "Verified Partner Portal",
    entries: [
      { tag: "Planned", text: "Clinicians can apply for Verified status from the For Clinicians page — name, profession, AHPRA number, clinic" },
      { tag: "Planned", text: "Admin review queue for partner applications — approve with one tap to activate the badge" },
    ],
  },
  {
    version: "Future",
    title: "Hospital & Clinic Pilot",
    entries: [
      { tag: "Planned", text: "Co-branded onboarding for referring hospitals and clinics — patients join with a direct link from their provider" },
      { tag: "Planned", text: "Anonymous aggregate reporting for partners — engagement stats, active users, Space activity (no personal data)" },
      { tag: "Planned", text: "Bulk referral materials and co-branded one-pagers for hospital waiting rooms" },
    ],
  },
  {
    version: "Future",
    title: "Buy & Swap Marketplace",
    entries: [
      { tag: "Planned", text: "List baby gear, clothing, and equipment for sale or swap — browse-only for free members, listing for Village+" },
      { tag: "Planned", text: "Contact sellers via private DM — no in-platform payments, just genuine community connections" },
      { tag: "Planned", text: "Category filters: clothing, gear, toys, feeding, nursery & more" },
    ],
  },
];

const TAG_STYLES = {
  Added:    "bg-green-500/15 text-green-600 dark:text-green-400",
  Changed:  "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  Improved: "bg-primary/15 text-primary",
  Fixed:    "bg-blue-500/15 text-blue-500 dark:text-blue-400",
  Design:   "bg-purple-500/15 text-purple-600 dark:text-purple-400",
  Removed:  "bg-red-500/15 text-red-600 dark:text-red-400",
  Planned:  "bg-muted text-muted-foreground",
};

function VersionCard({ version, date, title, entries, muted }) {
  return (
    <div className={`bg-card rounded-2xl border shadow-sm p-6 transition-all ${
      muted
        ? "border-border/30 border-l-4 border-l-muted opacity-75"
        : "border-border/50 border-l-4 border-l-primary/40 hover:shadow hover:border-l-primary/70"
    }`}>
      <div className="flex flex-wrap items-center gap-2.5 mb-4">
        <span className={`text-xs font-mono px-2.5 py-1 rounded-lg font-bold tracking-tight ${muted ? "bg-muted text-muted-foreground" : "bg-primary/15 text-primary"}`}>
          v{version}
        </span>
        {date && (
          <span className="text-xs text-muted-foreground bg-secondary/60 px-2 py-0.5 rounded-md">
            {date}
          </span>
        )}
        <h3 className="font-heading font-semibold text-foreground leading-snug">{title}</h3>
      </div>
      <ul className="space-y-2.5">
        {entries.map((entry, i) => (
          <li key={i} className="flex items-start gap-2.5">
            <span className={`shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full mt-0.5 ${TAG_STYLES[entry.tag] || TAG_STYLES.Added}`}>
              {entry.tag}
            </span>
            <span className="text-sm text-muted-foreground leading-relaxed">{entry.text}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function Changelog({ user }) {
  return (
    <div className="min-h-screen bg-background pb-20 lg:pl-60 lg:pb-0">
      <Navigation user={user} />

      <main className="max-w-3xl mx-auto px-4 pt-16 lg:pt-8">
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Link>

        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center">
            <ScrollText className="h-5 w-5 text-primary" />
          </div>
          <h1 className="font-heading text-3xl font-bold text-foreground">What's New</h1>
        </div>
        <p className="text-muted-foreground mb-8">
          Release history and upcoming features for The Village.
        </p>

        {/* Release history */}
        <section className="space-y-4 mb-12">
          <p className="font-heading font-semibold text-xs uppercase tracking-widest text-muted-foreground">Release History</p>
          {CHANGELOG.map((v) => (
            <VersionCard key={v.version} {...v} />
          ))}
        </section>

        {/* Roadmap */}
        <section className="space-y-4">
          <p className="font-heading font-semibold text-xs uppercase tracking-widest text-muted-foreground">Coming Up</p>
          {ROADMAP.map((v) => (
            <VersionCard key={v.version} {...v} muted />
          ))}
        </section>
        <AppFooter />
      </main>
    </div>
  );
}
