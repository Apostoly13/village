import { useState } from "react";
import { Link } from "react-router-dom";
import Navigation from "../components/Navigation";
import { ArrowLeft, ScrollText, Search, X } from "lucide-react";
import AppFooter from "../components/AppFooter";

// ── Full technical changelog (admin-only view) ────────────────────────────────
const CHANGELOG = [
  {
    version: "3.16.0",
    date: "April 2026",
    title: "Google OAuth, Nav Dropdown Fixes & Changelog Overhaul",
    entries: [
      { tag: "Added",    text: "Google Sign-In — 'Continue with Google' on Login and Register now works end-to-end. Frontend uses Google Identity Services (GIS) to obtain a credential token; backend verifies it with google.oauth2.id_token.verify_oauth2_token(), then creates or updates the user and issues a JWT session cookie. New Google users receive the standard 7-day trial." },
      { tag: "Added",    text: "GOOGLE_CLIENT_ID env var added to backend .env and .env.example. REACT_APP_GOOGLE_CLIENT_ID added to frontend .env. Google Identity Services script loaded via index.html async defer." },
      { tag: "Fixed",    text: "All nav dropdown sub-item hrefs now navigate to real destinations — Events ?action=create opens the create dialog on load, Events ?tab=rsvp activates the Going filter, Friends ?tab=requests and ?tab=sent open the correct tab via URL param, Stall ?tab=mine corrected to ?tab=my." },
      { tag: "Improved", text: "What's New page now shows two different views: admins see the full technical changelog with a live search bar and tag filter pills (All, Added, Fixed, Security, Design, etc.); all other users see a curated plain-English release history with no implementation detail." },
      { tag: "Improved", text: "TAG_STYLES expanded — Security, Performance, Architecture, Confirmed, Legal, Updated, Redesign all now have distinct colour chips in the admin changelog view." },
    ],
  },
  {
    version: "3.15.0",
    date: "April 2026",
    title: "Admin & Mod Portal Overhaul, Navigation Restructure, Contextual Notifications",
    entries: [
      { tag: "Improved", text: "Admin Portal — tab bar now sectioned into Insights (read-only analytics: Overview, Engagement, Leaderboards, Revenue, Content) and Actions (Users, Moderation, Communities, Professionals, Announcements, Blog). Clearer at a glance what is information vs what causes consequences." },
      { tag: "Improved", text: "Admin Users tab — filter bar expanded from 3 to 9 options: All, Free, Trial, Village+, Moderators, Admins, Professionals, Auto-suspended, Banned." },
      { tag: "Added",    text: "Admin Professionals tab — new Approved sub-tab lists all verified clinicians with their type badge, workplace, a Credentials link (to their submitted URL), and a Profile link. Pending applications are unchanged." },
      { tag: "Improved", text: "Moderator Dashboard — tabs sectioned into Information (Unanswered posts) and Actions (Reports, Browse Posts, Stall, Professionals). Dashboard now lands on Unanswered so moderators see what needs attention first." },
      { tag: "Improved", text: "Navigation — Communities is now a standalone sidebar item between Chat Rooms and Events, with its own dropdown (Browse, Create). Events, Stall, Friends all have working sub-item dropdowns." },
      { tag: "Added",    text: "Navigation dropdowns for Events (Browse, Create Event, My RSVPs), Stall (Browse, Sell Something, My Listings, Donation Groups), Friends (My Friends, Friend Requests with badge, Sent Requests), and Communities (Browse, Create)." },
      { tag: "Fixed",    text: "All nav dropdown hrefs now point to real routes. Stall ?tab=mine corrected to ?tab=my. Events ?action=create and ?tab=rsvp now handled by Events page. Friends ?tab=requests and ?tab=sent now handled by Friends page." },
      { tag: "Added",    text: "Contextual toast notifications — when new notifications arrive, a toast shows what it's about (new reply, new message, friend request, stall enquiry) with a View action that navigates directly to the relevant page." },
    ],
  },
  {
    version: "3.14.0",
    date: "April 2026",
    title: "Stage 1 Closed Beta — Moderation & Mobile Readiness",
    entries: [
      { tag: "Added",    text: "Stall Listings tab in Moderator Dashboard — moderators can now browse all listings (including removed ones), search by keyword, view any listing, and remove it with one click. Removed listings notify the seller." },
      { tag: "Added",    text: "Admin browse endpoint for Stall — GET /admin/stall/listings returns all listings regardless of status, for moderator review only." },
      { tag: "Added",    text: "Admin remove endpoint for Stall — POST /admin/stall/listings/:id/remove lets admins and moderators remove a listing directly, with seller notification." },
      { tag: "Improved", text: "Report queue — 'View reported content' link now appears for forum posts, replies, and Stall listings. Link navigates directly to the content so moderators can review in context before acting." },
      { tag: "Improved", text: "Rate limit added to report submission — users can submit at most 5 reports per 10 minutes, preventing report flooding and auto-ban abuse." },
      { tag: "Fixed",    text: "Messages chat area now uses dynamic viewport height (100dvh) — on iOS Safari, the composer input is no longer hidden behind the keyboard when typing." },
    ],
  },
  {
    version: "3.13.0",
    date: "April 2026",
    title: "Email Verification & Distributed Rate Limiting",
    entries: [
      { tag: "Added",    text: "Email verification — new accounts created with email and password receive a verification email. A banner prompts unverified users to confirm their address, with a one-click resend option. Google OAuth accounts are verified automatically." },
      { tag: "Added",    text: "Verify email page (/verify-email) — clicking the link in the email lands on a dedicated page that confirms verification and redirects to the dashboard." },
      { tag: "Improved", text: "Rate limiter upgraded to optional Redis backend — when REDIS_URL is configured, rate limits persist across server restarts and work correctly across multiple instances. Falls back to in-memory if Redis is not configured." },
      { tag: "Confirmed", text: "Dark mode audit — all UI colours use CSS variable tokens from theme.css and respond correctly to light/dark mode. The only hardcoded hex values are intentional (VillagePlus premium hero section, Google/Facebook SVG brand logos)." },
      { tag: "Confirmed", text: "Mobile bottom nav tap targets — all 5 bottom nav items are 58×75px, well above the 44×44px minimum for thumb accessibility." },
    ],
  },
  {
    version: "3.12.0",
    date: "April 2026",
    title: "Safety, Security & Report Coverage",
    entries: [
      { tag: "Added",    text: "Report button on Direct Messages — flag messages from other users directly from your DM thread. Report is reviewed by the moderation team." },
      { tag: "Added",    text: "Report button on Stall Messages — flag messages from a seller or buyer in a Village Stall conversation." },
      { tag: "Fixed",    text: "Admin and Moderator report queue now shows content for all report types — chat messages, Stall listings, Stall messages, and direct messages are now enriched and visible alongside forum reports." },
      { tag: "Improved", text: "Block system extended — messages from blocked users are now hidden in Chat Rooms, and blocked users cannot send you a direct message." },
      { tag: "Fixed",    text: "Self-reporting prevented — users can no longer report their own content." },
      { tag: "Improved", text: "Auto-ban threshold raised — now requires 10 reports from at least 3 distinct users in 30 days (was 5 reports from any number of reporters), reducing the risk of coordinated false reports." },
      { tag: "Improved", text: "Village Stall — precise GPS coordinates (lat/lon) are no longer included in listing API responses. Suburb, postcode, and state are sufficient for display." },
      { tag: "Improved", text: "Village Stall — listing fields now have server-side length limits: title 3–120 chars, description up to 2,000 chars, price $0–$100,000, max 10 images per listing." },
      { tag: "Improved", text: "Rate limits added to forum post creation (5 per 5 minutes), forum replies (10 per 5 minutes), and Stall listing creation (5 per hour)." },
      { tag: "Improved", text: "Startup now logs a warning if required environment variables (Stripe keys, secret key) are missing — prevents silent failures in production." },
    ],
  },
  {
    version: "3.11.0",
    date: "April 2026",
    title: "Bug Fixes, Design Polish & Community Meetup RSVPs",
    entries: [
      { tag: "Fixed",    text: "Edit/Delete Community menu no longer appears inside regular Spaces — it is now restricted to community owners only (admins/mods can still moderate content but not rename or delete spaces from this UI)." },
      { tag: "Fixed",    text: "Gender filter enforced on direct URL access — navigating directly to Mum Circle as a male user (or Dad Circle as a female user) now redirects to the Spaces page." },
      { tag: "Fixed",    text: "Dashboard stat chips now say 'spaces active' instead of 'circles active' — aligns with the platform's current language." },
      { tag: "Fixed",    text: "Back button in a Space thread now reads 'Back to [Space Name]' and navigates directly to that space — no more generic 'Back' label." },
      { tag: "Fixed",    text: "Spaces page: added frontend deduplication guard to prevent duplicate category entries from sessionStorage/API timing edge cases." },
      { tag: "Fixed",    text: "Night Owl hours: the 3am Club no longer appears three times — the bottom promo card is now hidden when Night Owl mode is active since it's already featured prominently." },
      { tag: "Improved", text: "Dashboard action cards (Talk in a Group Chat, Post Anonymously, Ask a Question) now use clean icon badges in palette colors instead of emojis." },
      { tag: "Improved", text: "Verified badge now shows professional occupation — e.g. 'Verified Midwife', 'Verified GP', 'Verified Psychologist' — instead of the generic 'Verified' label." },
      { tag: "Improved", text: "Event date chips are now colored by event category — Playgroups use sage green, Meetups use clay/terracotta, Workshops use honey amber, Support events use dusk purple, consistent with the V2 palette." },
      { tag: "Improved", text: "Communities page: 'Your Communities' (communities you own) are now shown in their own section at the top, followed by all other communities." },
      { tag: "Added",    text: "Community Meetup RSVPs — meetup posts inside communities now have an 'I'll be there' RSVP button. Attendee count and up to 4 avatar previews shown. RSVPs are community-only and separate from the public Events system." },
      { tag: "Added",    text: "Open chat room auto-purge — group chat rooms now automatically clear messages older than 7 days (national rooms) or 14 days (local suburb rooms). Rooms with more than 500 messages trim to the latest 400. Private DMs and community posts are never affected. Runs nightly at 3am AEST." },
      { tag: "Improved", text: "Chat Rooms 'How it works' sidebar updated to explain the 7-day / 14-day rolling message window." },
    ],
  },
  {
    version: "3.10.0",
    date: "April 2026",
    title: "V3 Design — Icon Pack, Communities Split & Navigation Polish",
    entries: [
      { tag: "Improved", text: "V2 custom icon pack (Village, Stall, Sparkle, Quill, ParentChild, Pram, ThreeAmMoon and more) integrated platform-wide — replacing Lucide placeholders and emoji with handcrafted line-art icons consistent with the Village visual language." },
      { tag: "Improved", text: "Communities promoted to its own nav section — removed from the Spaces tab strip and given a dedicated sidebar item with the Village icon (three rooftops). Active state is correctly isolated so Spaces and Communities never highlight simultaneously." },
      { tag: "Improved", text: "The Village Stall is now a full Village+ feature — 'Coming Soon' copy and footnote removed from the Plus page. The Stall row in the comparison table now shows ✓ like all other active features." },
      { tag: "Improved", text: "Village+ moved from AppFooter into the desktop sidebar bottom section — shown as a nav row with the Sparkle icon, accent-coloured for free users and muted for subscribers. Removed from the footer to reduce clutter." },
      { tag: "Improved", text: "Spaces tiles now show a green 'Open' indicator alongside the post count — consistent with the Open filter language in Communities." },
      { tag: "Improved", text: "Nav sub-item labels cleaned up — emoji prefixes (📖 ✏️ 💾 🇦🇺 📍 👥) removed from all Spaces and Chat Rooms dropdown items." },
      { tag: "Improved", text: "Theme toggle now uses the ThreeAmMoon custom icon (crescent + star) instead of Lucide Moon. Settings icon uses the Lucide Cog (toothed gear) to distinguish from the sun-ray-style custom cog." },
      { tag: "Improved", text: "Forums empty states replaced — 👶 replaced with Pram icon, 🏡 replaced with Village icon, 🔍 replaced with Search icon." },
      { tag: "Fixed",    text: "Village+ sidebar Village+ link no longer highlights Spaces when navigating to Communities (/forums?tab=communities)." },
    ],
  },
  {
    version: "3.9.1",
    date: "April 2026",
    title: "Mobile menu sign-out fix",
    entries: [
      { tag: "Fixed", text: "Mobile hamburger menu now fills the full screen between the top and bottom bars. Sign Out is pinned at the bottom and always visible without scrolling — the menu items scroll above it." },
    ],
  },
  {
    version: "3.9.0",
    date: "April 2026",
    title: "Automated Test Harness & Messaging Improvements",
    entries: [
      { tag: "Added",     text: "Full automated test harness — 114-test pytest API suite covering auth, forums, marketplace, events, messages, admin, security, and notifications. Tests run against the live DEV environment and serve as a permanent regression gate." },
      { tag: "Added",     text: "Playwright E2E tests — 30 browser-based tests covering auth flows, mobile responsiveness, marketplace access, and security boundaries (CSP, CORS, secrets exposure)." },
      { tag: "Added",     text: "Load smoke test — 5-user concurrent load runner with realistic think time, per-endpoint timing, and auto-saved performance-summary.json report." },
      { tag: "Added",     text: "Messages: auto-scroll lock — the conversation feed no longer snaps to the bottom when you've scrolled up to read history. New messages only auto-scroll when you're already at the bottom." },
      { tag: "Added",     text: "Messages: loading state — switching conversations now shows a spinner briefly instead of flashing blank content." },
      { tag: "Improved",  text: "Messages polling reduced from 3 s to 1.5 s for the active conversation — new messages appear faster without requiring a refresh." },
      { tag: "Added",     text: "Notification ding — a soft Web Audio API tone plays once when a new inbound DM arrives. Your own sent messages do not trigger the sound." },
      { tag: "Added",     text: "Unread DM badge on the Messages nav icon — a red count badge appears on both desktop and mobile when there are unread direct messages (premium users only)." },
      { tag: "Added",     text: "New backend endpoint GET /messages/unread-count — powers the nav badge with a lightweight direct-messages query." },
      { tag: "Fixed",     text: "Accepting a friend request now marks the friend_request notification as read, and sends a friend_accept notification to the original requester." },
      { tag: "Fixed",     text: "Dashboard 'caught up' view — interacting with a notification now immediately removes it from the unread list without requiring a page refresh." },
      { tag: "Improved",  text: "MongoDB indexes added for notifications and direct_messages collections — dramatically faster queries for unread counts and conversation loads on the hosted database." },
    ],
  },
  {
    version: "3.8.0",
    date: "April 2026",
    title: "Security Hardening, Edit Listings & SEO",
    entries: [
      { tag: "Security",   text: "Stall message receiver is now validated server-side — the receiver must be the listing seller, or the sender must be the seller. Prevents arbitrary users being messaged via a listing reference (IDOR-adjacent)." },
      { tag: "Security",   text: "Image uploads now validated by magic bytes (file signature), not just the user-supplied Content-Type header. Prevents disguised non-image files from being uploaded." },
      { tag: "Security",   text: "Moderators can no longer change user roles or subscription tiers — those admin-only endpoints now require full admin role. Moderators retain ban, unban, and report-action access." },
      { tag: "Security",   text: "/api/seed endpoint is now protected by an X-Seed-Secret header (must match ADMIN_PASSWORD). Previously unauthenticated." },
      { tag: "Security",   text: "Trial email background loop now starts reliably at server startup via FastAPI's startup event, not only when /api/seed is called." },
      { tag: "Security",   text: "Security response headers added to all API responses: X-Content-Type-Options: nosniff, X-Frame-Options: DENY, Referrer-Policy: strict-origin-when-cross-origin, Permissions-Policy." },
      { tag: "Security",   text: "Password field now enforces a maximum length of 128 characters, preventing bcrypt 72-byte silent truncation." },
      { tag: "Fixed",      text: "Deleting a stall listing now correctly decrements the donation group's item_count. Previously only creation incremented the count, leaving stale tallies after removals." },
      { tag: "Fixed",      text: "Account deletion now cascades to all stall listings, saved listings, stall messages, direct messages, and friendships. Previously these records were left orphaned." },
      { tag: "Fixed",      text: "StallThreadView height changed from 100dvh to 100vh fallback for broader browser compatibility." },
      { tag: "Added",      text: "Edit Listing page — sellers can now edit their stall listing (photos, title, category, condition, price, suburb, description, status) from the listing detail page via a dedicated /stall/listing/:id/edit route." },
      { tag: "Added",      text: "Open Graph image tag added to index.html — sharing The Village URL on social platforms now renders the app icon instead of a blank card." },
      { tag: "Added",      text: "Twitter Card meta tags added — summary card with title, description and image when sharing on X/Twitter." },
      { tag: "Added",      text: "public/robots.txt — guides search engine crawlers to index public marketing pages while blocking authenticated/private app routes." },
      { tag: "Added",      text: "public/sitemap.xml — standard sitemap covering all public-facing pages, linked from robots.txt." },
    ],
  },
  {
    version: "3.7.0",
    date: "April 2026",
    title: "Stall Messaging Overhaul",
    entries: [
      { tag: "Improved",  text: "Stall listing detail 'Message seller' now opens a full-screen threaded chat panel instead of a one-shot message form. Shows full conversation history, polls every 3 seconds for new messages, supports multi-turn threads, and auto-scrolls to the latest message." },
      { tag: "Added",     text: "Stall Messages tab — a new 5th tab in The Village Stall shows all your Stall conversations in one inbox. Lists each conversation with listing thumbnail, other user's name, last message preview, timestamp, and unread badge." },
      { tag: "Added",     text: "Inline thread view within the Messages tab — click any conversation to open the full chat thread right inside the Stall section, with real-time polling, message bubbles, and an auto-resizing input bar." },
      { tag: "Added",     text: "Unread message count badge on the Messages tab — red pill badge appears on the tab whenever there are unread Stall messages, and updates automatically when messages are read." },
      { tag: "Improved",  text: "Own listing CTA changed from 'Manage' to 'View enquiries' — takes the seller directly to the Messages tab so they can respond to buyers without hunting for the right conversation." },
      { tag: "Improved",  text: "Chat panel correctly offsets for the desktop sidebar (lg:left-60), so the sidebar remains visible and the chat fills only the content area on desktop." },
      { tag: "Improved",  text: "Timestamp grouping in chat threads — consecutive messages within 10 minutes are grouped without repeated timestamps; larger gaps show a relative time label between messages." },
    ],
  },
  {
    version: "3.6.0",
    date: "April 2026",
    title: "Village Stall, Pro Verification & UX Polish",
    entries: [
      { tag: "Added",     text: "Village Stall (marketplace) fully integrated — buy, sell, swap and give away baby gear locally. Available to Village+ and trial subscribers. Accessible from a new dedicated 'Stall' nav item on desktop sidebar and mobile menu." },
      { tag: "Added",     text: "Stall listing creation: 5-step wizard — photos, item details, pricing/condition, location, and review. Supports selling, swapping, giving away, and 'wanted' listings with up to 4 photos." },
      { tag: "Added",     text: "Donation Groups: community giving pools for families to share items. Village+ members can create and join groups, post items into a group, and browse groups near them." },
      { tag: "Added",     text: "Stall listing save/bookmark: save any listing to revisit later. Saved listings visible in the 'Saved' tab within the Stall section." },
      { tag: "Added",     text: "In-app Stall messaging: enquire about any listing with a direct message to the seller. Enquiry count tracked per listing." },
      { tag: "Added",     text: "Trial expiry auto-pause: when a trial subscription expires, all active Stall listings are automatically paused with a notice to the seller. Paused listings are permanently deleted after 7 days if not reinstated." },
      { tag: "Added",     text: "Professional verification form now inline on the registration page — healthcare professionals can fill in their full verification application (type, workplace, credentials, services URL) during sign-up, not just after." },
      { tag: "Improved",  text: "Professional verification form (on Profile) now requires all four fields — professional type, workplace/organisation, credentials, and professional services URL. All fields are mandatory before submitting." },
      { tag: "Improved",  text: "Trial banner on Dashboard no longer shows specific counts (posts/messages per week). Now says 'limited functionality' with a 'See what's included' link to the Village+ comparison page." },
      { tag: "Improved",  text: "Your Communities dashboard widget now always shows for Village+ subscribers — even with 0 communities joined, shows an 'Explore communities' prompt instead of hiding completely." },
      { tag: "Improved",  text: "Your Communities data is now fetched immediately on dashboard load for premium users, not deferred inside the subscription status callback." },
      { tag: "Performance", text: "MongoDB indexes added for Stall collections: stall_listings (seller_id, status, listing_type/category), stall_saves (listing_id + user_id unique), stall_messages (thread lookup, unread count), donation_groups (status + date)." },
      { tag: "Fixed",     text: "Tooltip must be used within TooltipProvider crash — Navigation sidebar locked-item tooltips now wrap each Tooltip in its own TooltipProvider, preventing the runtime error that blocked sign-in." },
      { tag: "Fixed",     text: "All Stall pages (Stall, listing detail, create listing, donation group detail, create donation group) now have correct lg:pl-60 sidebar offset and pt-16 lg:pt-8 top padding, matching all other pages in the app." },
    ],
  },
  {
    version: "3.5.0",
    date: "April 2026",
    title: "Messaging Improvements, Landing Mobile Experience & UX Fixes",
    entries: [
      { tag: "Fixed",     text: "Events modal now shows exactly one close button — removed duplicate X caused by shadcn DialogContent auto-rendering its own close button alongside the custom header button." },
      { tag: "Fixed",     text: "Messages auto-scroll no longer yanks the view back to the bottom when a new message arrives while the user is scrolled up reading history. Scroll only fires when already at the bottom." },
      { tag: "Fixed",     text: "Messages page now shows a brief spinner when switching conversations instead of flashing an empty state." },
      { tag: "Fixed",     text: "Settings dark mode toggle now uses the shared useTheme hook — Day / Night / Auto pill replaces the broken binary switch that was writing to the wrong localStorage key." },
      { tag: "Fixed",     text: "Landing page mobile layout (sliding sections) no longer bleeds through onto desktop — inline display:flex style was overriding the lg:hidden Tailwind class." },
      { tag: "Fixed",     text: "Dashboard catch-up panel now only shows unread notifications — read items are removed immediately on click rather than remaining in a dimmed state." },
      { tag: "Improved",  text: "Messages polling interval reduced from 3s to 1.5s — new messages and friend chats appear roughly twice as fast without page refresh." },
      { tag: "Improved",  text: "Navigation polling interval reduced from 45s to 20s — friend requests and notification badges update more promptly." },
      { tag: "Improved",  text: "Soft audio ding plays when a new direct message arrives from another user. Uses Web Audio API — no audio files required." },
      { tag: "Improved",  text: "Unread message count badge added to the Messages nav item on both desktop sidebar and mobile bottom bar. Badge respects Village+ gating (not shown for free-tier users)." },
      { tag: "Improved",  text: "Accepting a friend request now marks the friend_request notification as read and sends the original requester a friend_accept notification." },
      { tag: "Added",     text: "Landing page mobile experience: full-screen sliding section layout (Hero → Features → Live Preview → Pricing → Privacy → Join) with dot-pagination and Next/Back navigation. Desktop layout unchanged." },
      { tag: "Added",     text: "Professional verification moved from Settings to Profile — the apply form now lives on your own profile page where it is more discoverable." },
      { tag: "Added",     text: "Registration step now includes an optional 'I am a healthcare professional' checkbox — flags the account for verification follow-up after onboarding." },
      { tag: "Added",     text: "Your Communities widget on Dashboard is now gated to Village+ subscribers only — free and trial users no longer see the section." },
      { tag: "Added",     text: "Backend /messages/unread-count endpoint counts unread direct messages for the current user — powers the Messages nav badge." },
      { tag: "Performance", text: "Additional MongoDB indexes added for notifications and direct_messages collections covering unread-count queries and sender/receiver conversation lookups." },
    ],
  },
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
      { tag: "Design",   text: "Events page header: 'What's on · near you.' with serif italic accent." },
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
      { tag: "Added",        text: "Navigation header now has dropdown sub-menus — Spaces (▾) shows All Spaces, Communities, Create Post, Saved; Group Chats (▾) shows All Australia, Local Spaces, Friends. Main label still navigates directly on click." },
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
      { tag: "Improved",  text: "Gender change in Profile Settings now instantly unlocks Mum/Dad spaces and chats across the platform without page reload." },
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
      { tag: "Design",   text: "CSS design tokens added to index.css — typography scale (--text-xs through --text-4xl), spacing scale (--space-1 through --space-12), border radius scale, and animation duration variables." },
      { tag: "Improved", text: "Profile edit form on mobile now collapses into accordion sections (About You, Parenting Stage, Location, Preferences, Interests, Notifications, Appearance) — no more endless scroll on small screens." },
      { tag: "Improved", text: "Locked nav items (Events, Messages for free users) now show a tooltip on hover — 'Village+ feature — upgrade to unlock' — with a link to the upgrade page." },
      { tag: "Improved", text: "Error toasts on Events, Community posts, and Messages conversations now include a Retry button that re-runs the failed fetch." },
      { tag: "Fixed",    text: "Community posts page now imports toast for error handling — previously failed silently on network errors." },
      { tag: "Security", text: "All MongoDB regex queries now use re.escape() to prevent ReDoS injection — user search, post search, admin user search, nickname check, event suburb filter." },
      { tag: "Security", text: "In-memory rate limiter added (no external deps) — login limited to 10 requests/min per IP, search endpoints to 30 requests/min per IP. Returns HTTP 429 with friendly message." },
      { tag: "Security", text: "CORS configuration tightened — explicit method whitelist (GET/POST/PUT/PATCH/DELETE/OPTIONS) and header whitelist instead of allow_methods='*' / allow_headers='*'. Preflight cache set to 10 minutes." },
      { tag: "Improved", text: "All email notification links now use FRONTEND_URL env var instead of hardcoded 'http://localhost:3000' — set FRONTEND_URL=https://app.ourlittlevillage.com.au in production .env." },
      { tag: "Performance", text: "Admin reports endpoint N+1 eliminated — reporter and content now fetched in batch queries instead of one DB call per report." },
      { tag: "Performance", text: "Location-based post filtering now uses a lat/lon bounding box pre-filter in MongoDB before Haversine exact check — reduces documents loaded from up to 500 to only those within the geographic window." },
      { tag: "Architecture", text: "services/ package created in backend — geo.py (calculate_distance, bounding_box, geocode_address), rate_limiter.py, and tasks.py (fire_and_forget) extracted as reusable modules." },
    ],
  },
  {
    version: "2.8.0",
    date: "April 2026",
    title: "Homepage Redesign, Scroll Fixes & Clinician Page",
    entries: [
      { tag: "Redesign",  text: "Landing page rebuilt — new hero headline, crisis support band (PANDA/Lifeline/Beyond Blue) above the fold, 9-feature grid, Verified Partner section, Village+ pricing comparison, For Clinicians strip, Privacy TL;DR cards, and updated footer." },
      { tag: "Added",     text: "Crisis resources band on landing page — PANDA 1300 726 306, Lifeline 13 11 14, Beyond Blue 1300 22 4636 with tap-to-call links, visible before logging in." },
      { tag: "Added",     text: "Village+ pricing section on landing page — transparent free vs. Village+ comparison with feature checklist." },
      { tag: "Fixed",     text: "Chat popout auto-scroll to bottom — was scrolling to bottom on every 5s poll even when user had scrolled up to read history. Now respects scroll position." },
      { tag: "Fixed",     text: "Messages page auto-scroll — swapped non-standard behavior: instant for behavior: auto so conversation-switch jump works correctly across all browsers." },
    ],
  },
  {
    version: "2.7.0",
    date: "April 2026",
    title: "Simplified UX, PWA, Health-Sector Readiness & Dashboard Modes",
    entries: [
      { tag: "Design",   text: "Dashboard now has three intent-driven modes — I need help, Browse, Catch up — so the first thing you see matches why you opened the app." },
      { tag: "Added",    text: "PWA support — install The Village to your home screen on any device. iOS: Tap Share → Add to Home Screen. Android/Chrome: tap Install when prompted." },
      { tag: "Added",    text: "Mobile bottom nav redesigned with labels and a Me tab — Home, Spaces, Events, Messages, Me." },
      { tag: "Improved", text: "Onboarding rebuilt as 5 focused steps: Welcome → About You → Location → What brings you here? → You're in! Interests are now auto-set from your parenting stage." },
      { tag: "Added",    text: "Crisis support banner in mental health Spaces — PANDA, Lifeline, and Beyond Blue numbers surface automatically with tap-to-call links." },
      { tag: "Added",    text: "Verified Partner badge — healthcare professionals (midwives, GPs, psychologists) can receive a verified badge shown on their posts and profile." },
    ],
  },
  {
    version: "2.6.0",
    date: "April 2026",
    title: "Village+ Tiers, Feature Gates & Onboarding Polish",
    entries: [
      { tag: "Changed", text: "Events, Direct Messages, and Community Spaces are now Village+ features — free users see a clear upgrade path from the dashboard and nav. Trial users retain full access during their 7 days." },
      { tag: "Added",   text: "Trial countdown on the dashboard now changes day-by-day at midnight rather than anchoring to the hour of sign-up." },
      { tag: "Added",   text: "One-time downgrade notice — on first login after your trial expires, a card explains exactly what you've retained and what's now locked, with an upgrade option." },
      { tag: "Added",   text: "Lock indicators on nav items (Events, Messages) for free users — small lock icon so it's clear before clicking." },
    ],
  },
  {
    version: "2.4.0",
    date: "April 2026",
    title: "Mum & Dad Circles, Chat Overhaul, Dark Mode & Private Posts",
    entries: [
      { tag: "Added", text: "Mum Circle and Dad Circle — dedicated spaces for mums and dads, featured prominently at the top of Village Circles." },
      { tag: "Added", text: "Private posts — choose 'Only me' when posting to save a private draft. Edit and change visibility before sharing with the community." },
      { tag: "Added", text: "Messages page — full-screen private chat with friends, unified with the chat popout system." },
      { tag: "Added", text: "Terms & Conditions, Privacy Policy, Community Guidelines, Contact, and Suggestions pages." },
      { tag: "Changed", text: "Dark mode is now the default for new users." },
    ],
  },
  {
    version: "2.2.0",
    date: "April 2026",
    title: "Events & Saved Resources",
    entries: [
      { tag: "Added", text: "Events page — browse and create local meetups, playgroups, workshops and support events near you." },
      { tag: "Added", text: "RSVP to events with one tap — see who's going and how many spots are left." },
      { tag: "Added", text: "Add to Calendar — download any event as an .ics file for Apple Calendar, Google Calendar, or Outlook." },
      { tag: "Added", text: "Saved Resources hub — one place for your saved posts, chat messages, and RSVPd events." },
    ],
  },
  {
    version: "2.0.0",
    date: "May 2026",
    title: "Circles, Support Spaces & Visual Overhaul",
    entries: [
      { tag: "Changed", text: "Forums renamed to Support Spaces — a warmer, more intentional name for the discussion areas." },
      { tag: "Added",   text: "New Circle categories: Sleep, Feeding, Toddler, Newborn, School Age, Teenager, Single Parent, Mental Health." },
      { tag: "Added",   text: "Homepage three-column layout — identity card, activity feed, and local/nearby parents panel." },
      { tag: "Added",   text: "Trust badges — Trusted Parent, Night Owl, Local Parent, and Verified Professional earned by community activity." },
    ],
  },
  {
    version: "1.0.0",
    date: "March 2026",
    title: "Foundation Launch",
    entries: [
      { tag: "Added", text: "Core forum with topic and age-group categories, threaded replies, likes, bookmarks." },
      { tag: "Added", text: "Suburb & postcode chat rooms — created on-demand, lazily archived when idle." },
      { tag: "Added", text: "Freemium model: 5 forum posts per week and 20 chat messages per day for free accounts." },
      { tag: "Added", text: "7-day free trial for new members with full access." },
      { tag: "Added", text: "Admin dashboard with user analytics, moderation queue, and content removal tools." },
      { tag: "Added", text: "Google OAuth and email/password sign-in." },
      { tag: "Added", text: "Profile pages with parenting stage, interests, location, and avatar upload." },
      { tag: "Added", text: "Friend requests, direct messages, and online-friend list." },
      { tag: "Added", text: "Anonymous posting option in all forum categories." },
    ],
  },
];

// ── Curated user-facing changelog (non-admin view) ────────────────────────────
// Plain readable summaries — no technical tags or implementation details.
const USER_CHANGELOG = [
  {
    version: "3.16.0",
    date: "April 2026",
    title: "Sign in with Google",
    entries: [
      "You can now sign in or join with your Google account — just tap 'Continue with Google' on the login or sign-up page.",
      "New Google sign-ups get the same 7-day free trial as email registrations.",
    ],
  },
  {
    version: "3.15.0",
    date: "April 2026",
    title: "Navigation & Notifications",
    entries: [
      "Dropdown menus added to Events, Stall, Friends, and Communities in the sidebar — jump straight to Browse, Create, My Listings, and more without extra clicks.",
      "Notification alerts now tell you exactly what arrived — a reply, message, friend request, or Stall enquiry — and take you straight there when you tap.",
    ],
  },
  {
    version: "3.14.0",
    date: "April 2026",
    title: "Platform Safety & Reliability",
    entries: [
      "Moderation tools improved — Stall listings can now be reviewed and removed by the mod team if needed, with sellers notified.",
      "Fixed an issue on iOS where the message composer was hidden behind the keyboard when typing.",
    ],
  },
  {
    version: "3.13.0",
    date: "April 2026",
    title: "Email Verification",
    entries: [
      "New accounts now receive a verification email — click the link to confirm your address and you're good to go.",
      "Google sign-in accounts are verified automatically. No email needed.",
    ],
  },
  {
    version: "3.12.0",
    date: "April 2026",
    title: "Safety & Reporting",
    entries: [
      "You can now report messages in Direct Messages and Village Stall conversations — tap the flag icon in any conversation.",
      "Blocking a user now hides their messages in Group Chats too, not just direct messages.",
    ],
  },
  {
    version: "3.11.0",
    date: "April 2026",
    title: "Community Meetups & Improvements",
    entries: [
      "RSVP to meetups posted inside your communities — see who else is going with attendee previews.",
      "Verified professional badges now show the person's role — Verified Midwife, Verified GP, Verified Psychologist, and so on.",
      "Various fixes and polish across Spaces, Events, and Group Chats.",
    ],
  },
  {
    version: "3.10.0",
    date: "April 2026",
    title: "Design Refresh & Communities Navigation",
    entries: [
      "Communities now has its own dedicated spot in the sidebar with a custom icon — easier to find and separate from Spaces.",
      "New handcrafted icons across the platform for a more polished, consistent look.",
    ],
  },
  {
    version: "3.9.0",
    date: "April 2026",
    title: "Faster Messages & Smarter Notifications",
    entries: [
      "New direct messages appear faster — less waiting for replies to show up.",
      "A soft sound plays when a new message arrives from another user.",
      "Unread message count badge added to the Messages icon on desktop and mobile.",
    ],
  },
  {
    version: "3.8.0",
    date: "April 2026",
    title: "Edit Your Stall Listings",
    entries: [
      "You can now edit your Village Stall listings after posting — update photos, price, description, and availability at any time from the listing page.",
    ],
  },
  {
    version: "3.7.0",
    date: "April 2026",
    title: "Village Stall Conversations",
    entries: [
      "Stall enquiries are now full message threads — see your complete conversation history with buyers and sellers in one place.",
      "A new Messages tab inside the Stall shows all your Stall conversations in one inbox, with unread badges.",
    ],
  },
  {
    version: "3.6.0",
    date: "April 2026",
    title: "Village Stall & Professional Verification",
    entries: [
      "The Village Stall is now live — list items for sale, swap, or donation, or browse baby gear from parents nearby.",
      "Donation Groups let your community pool and share items together.",
      "Healthcare professionals can now apply for their verified badge directly during sign-up.",
    ],
  },
  {
    version: "3.5.0",
    date: "April 2026",
    title: "Mobile & Messaging",
    entries: [
      "Improved mobile experience on the landing page with a full-screen guided tour for new visitors.",
      "Messages and notifications are faster and more reliable throughout the app.",
    ],
  },
  {
    version: "3.4.0",
    date: "April 2026",
    title: "New Desktop Layout",
    entries: [
      "Redesigned desktop navigation — a fixed sidebar on the left makes it easier to move between sections at a glance.",
    ],
  },
  {
    version: "3.3.0",
    date: "April 2026",
    title: "Warmer Design & Typography",
    entries: [
      "Warmer colour palette in both day and night mode — softer, calmer, more like a community and less like a tech app.",
      "New serif headings for a cleaner, more refined feel throughout.",
    ],
  },
  {
    version: "3.2.0",
    date: "April 2026",
    title: "Location & Profile Improvements",
    entries: [
      "'Use My Location' is now available when browsing Group Chats, creating events, and updating your profile.",
      "Profile view mode now shows your parenting stage, interests, and connection preferences as readable chips.",
    ],
  },
  {
    version: "3.1.0",
    date: "April 2026",
    title: "Village+ Subscriptions",
    entries: [
      "Village+ subscriptions are now available — subscribe monthly or annually through secure checkout.",
      "Manage, update, or cancel your subscription at any time from the Village+ page.",
    ],
  },
  {
    version: "3.0.0",
    date: "April 2026",
    title: "Legal, Privacy & Age Verification",
    entries: [
      "Updated Terms & Conditions and Privacy Policy aligned with Australian privacy law.",
      "18+ age verification now required at sign-up.",
      "Mum and Dad Spaces now correctly show only to the right audience based on your profile.",
    ],
  },
  {
    version: "2.7.0",
    date: "April 2026",
    title: "Home Screen App & Dashboard",
    entries: [
      "Install The Village on your home screen — works like a native app on iOS and Android.",
      "Dashboard now has focused modes: get help, browse, or catch up on what's happened since you last visited.",
    ],
  },
  {
    version: "2.6.0",
    date: "April 2026",
    title: "Village+ Features",
    entries: [
      "Events, Direct Messages, and Communities are Village+ features. New members get a 7-day free trial with full access.",
      "Lock icons on nav items make it clear what's included before you click.",
    ],
  },
  {
    version: "2.4.0",
    date: "April 2026",
    title: "Mum & Dad Circles, Private Posts",
    entries: [
      "Mum Circle and Dad Circle — dedicated safe spaces for mums and dads.",
      "Private posts — save a draft visible only to you before deciding whether to share.",
    ],
  },
  {
    version: "2.2.0",
    date: "April 2026",
    title: "Events & Saved Resources",
    entries: [
      "Browse and RSVP to local events — playgroups, meetups, workshops, and support events near you.",
      "Saved Resources — all your saved posts and RSVPs in one place.",
    ],
  },
  {
    version: "2.0.0",
    date: "April 2026",
    title: "The Village Takes Shape",
    entries: [
      "Support Spaces and Circles launched — the heart of the Village community.",
      "New themed chat rooms: Sleep, Feeding, Toddler, Mental Health, Single Parent, and more.",
      "Trust badges introduced — Night Owl, Local Parent, Trusted Parent, Verified Professional.",
    ],
  },
  {
    version: "1.0.0",
    date: "March 2026",
    title: "Welcome to The Village",
    entries: [
      "The Village opened — forums, group chat rooms, friend connections, local events, and profiles all live.",
      "Anonymous posting, free trial, and Village+ premium all available from day one.",
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
    ],
  },
];

// ── Tag styles ────────────────────────────────────────────────────────────────
const TAG_STYLES = {
  Added:        "bg-green-500/15 text-green-600 dark:text-green-400",
  Changed:      "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  Updated:      "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  Improved:     "bg-primary/15 text-primary",
  Fixed:        "bg-blue-500/15 text-blue-500 dark:text-blue-400",
  Design:       "bg-purple-500/15 text-purple-600 dark:text-purple-400",
  Redesign:     "bg-purple-500/15 text-purple-600 dark:text-purple-400",
  Removed:      "bg-red-500/15 text-red-600 dark:text-red-400",
  Security:     "bg-red-500/15 text-red-700 dark:text-red-400",
  Performance:  "bg-orange-500/15 text-orange-600 dark:text-orange-400",
  Architecture: "bg-slate-500/15 text-slate-600 dark:text-slate-400",
  Confirmed:    "bg-teal-500/15 text-teal-600 dark:text-teal-400",
  Legal:        "bg-violet-500/15 text-violet-600 dark:text-violet-400",
  Planned:      "bg-muted text-muted-foreground",
};

const ALL_TAGS = ["All", "Added", "Improved", "Fixed", "Security", "Design", "Performance", "Changed", "Legal", "Removed"];

// ── Admin version card (full technical detail) ────────────────────────────────
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

// ── User-facing version card (clean, no tags) ─────────────────────────────────
function UserVersionCard({ version, date, title, entries }) {
  return (
    <div className="bg-card rounded-2xl border border-border/50 border-l-4 border-l-primary/40 shadow-sm p-6 hover:shadow hover:border-l-primary/70 transition-all">
      <div className="flex flex-wrap items-center gap-2.5 mb-3">
        <span className="text-xs font-mono px-2.5 py-1 rounded-lg font-bold tracking-tight bg-primary/15 text-primary">
          v{version}
        </span>
        {date && (
          <span className="text-xs text-muted-foreground bg-secondary/60 px-2 py-0.5 rounded-md">
            {date}
          </span>
        )}
        <h3 className="font-heading font-semibold text-foreground leading-snug">{title}</h3>
      </div>
      <ul className="space-y-1.5">
        {entries.map((text, i) => (
          <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground leading-relaxed">
            <span className="mt-1.5 w-1 h-1 rounded-full bg-primary/50 shrink-0" />
            {text}
          </li>
        ))}
      </ul>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function Changelog({ user }) {
  const isAdmin = user?.role === "admin";
  const [search, setSearch] = useState("");
  const [tagFilter, setTagFilter] = useState("All");

  // Admin: filter changelog by search text + tag
  const searchQ = search.toLowerCase().trim();
  const filteredChangelog = CHANGELOG.map(v => {
    let entries = tagFilter === "All" ? v.entries : v.entries.filter(e => e.tag === tagFilter);
    if (searchQ) {
      const titleMatch = v.title.toLowerCase().includes(searchQ) || v.version.includes(searchQ) || (v.date || "").toLowerCase().includes(searchQ);
      if (!titleMatch) {
        entries = entries.filter(e => e.text.toLowerCase().includes(searchQ) || e.tag.toLowerCase().includes(searchQ));
      }
    }
    return entries.length > 0 ? { ...v, entries } : null;
  }).filter(Boolean);

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
          {isAdmin ? "Full release history and technical changelog." : "Feature updates and improvements to The Village."}
        </p>

        {/* ── Admin: search + tag filter ── */}
        {isAdmin && (
          <div className="space-y-3 mb-6">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <input
                type="text"
                placeholder="Search releases, features, fixes…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-9 py-2.5 rounded-xl text-sm border bg-card"
                style={{ borderColor: "var(--line)", color: "var(--ink)", outline: "none" }}
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
            {/* Tag filter pills */}
            <div className="flex flex-wrap gap-1.5">
              {ALL_TAGS.map(tag => (
                <button
                  key={tag}
                  onClick={() => setTagFilter(tag)}
                  className={`text-xs px-3 py-1 rounded-full font-medium transition-all ${
                    tagFilter === tag
                      ? "bg-primary text-primary-foreground"
                      : "bg-card border text-muted-foreground hover:text-foreground"
                  }`}
                  style={tagFilter !== tag ? { borderColor: "var(--line)" } : {}}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Release history ── */}
        <section className="space-y-4 mb-12">
          <p className="font-heading font-semibold text-xs uppercase tracking-widest text-muted-foreground">
            Release History
            {isAdmin && (searchQ || tagFilter !== "All") && (
              <span className="ml-2 normal-case font-normal text-muted-foreground/70">
                — {filteredChangelog.length} {filteredChangelog.length === 1 ? "release" : "releases"} shown
              </span>
            )}
          </p>

          {isAdmin ? (
            filteredChangelog.length > 0 ? (
              filteredChangelog.map(v => <VersionCard key={v.version} {...v} />)
            ) : (
              <div className="text-center py-12 text-muted-foreground text-sm">
                No releases match your search.{" "}
                <button onClick={() => { setSearch(""); setTagFilter("All"); }} className="underline">
                  Clear filters
                </button>
              </div>
            )
          ) : (
            USER_CHANGELOG.map(v => <UserVersionCard key={v.version} {...v} />)
          )}
        </section>

        {/* ── Roadmap ── */}
        <section className="space-y-4">
          <p className="font-heading font-semibold text-xs uppercase tracking-widest text-muted-foreground">Coming Up</p>
          {ROADMAP.map(v => (
            <VersionCard key={v.version} {...v} muted />
          ))}
        </section>

        <AppFooter />
      </main>
    </div>
  );
}
