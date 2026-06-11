import { useState } from "react";
import { Link } from "react-router-dom";
import Navigation from "../components/Navigation";
import { ArrowLeft, ScrollText, Search, X } from "lucide-react";
import AppFooter from "../components/AppFooter";

// ── Full technical changelog (admin-only view) ────────────────────────────────
const CHANGELOG = [
  {
    version: "3.38.0",
    date: "June 2026",
    title: "Notification Chimes, Brand Refresh, Security & Polish Pass",
    entries: [
      { tag: "Added",    text: "Notification & message chimes: a soft, generated Web Audio chime now plays when a new notification or message arrives (Navigation poll, ChatRoom, ChatPopout, Messages all wired through a single utils/sounds.js helper). Two distinct tones — a gentle rising two-note for messages, a single warm note for notifications. Debounced so overlapping pollers can't double-chime, and a DM that bumps both counters plays only the message tone." },
      { tag: "Added",    text: "Settings: 'Notification sounds' toggle added to the Notifications section, 'Message sounds' moved to default-on with refreshed copy. Both are device-local, default ON, and play a one-off preview chime when switched on. New pref keys: notificationSounds, messageSounds (village_prefs)." },
      { tag: "Security", text: "Auth: banned users signing in via the Google OAuth session path are now rejected with 403 'Account suspended'. Previously the ban check existed only on the JWT path, so a banned Google user kept full access until their session expired." },
      { tag: "Improved", text: "Brand refresh — every remaining old-logo PNG replaced with the typographic Wordmark/Monogram lockup: app footer, public nav bar, Coming Soon gate page, and the PWA install banner. No more legacy raster logo anywhere in the UI." },
      { tag: "Improved", text: "App icons regenerated as the brand monogram (warm brown rounded square, cream italic serif 'V'): logo.png (512), logo192.png, apple-touch-icon.png and a proper multi-size favicon.ico. manifest theme/background colours and the HTML theme-color meta updated from the old amber #F5C542 to brand brown #2a1f17." },
      { tag: "Fixed",    text: "Chat Rooms: room grid was cramped into two columns at laptop widths (~1000–1280px) where the right rail is present. Grid now drops to a single column at lg and only returns to two columns at xl — applied to Live now, Quiet/All Australia and featured gender-room grids." },
      { tag: "Fixed",    text: "Chat Room: messages now anchor to the bottom of the scroll area (flex flex-col + mt-auto) so a room with only a few messages no longer leaves a dead gap above the composer." },
      { tag: "Fixed",    text: "Moderator dashboard tab bar: added scrollbar-none so the horizontal tab strip no longer shows a native scrollbar on mobile." },
      { tag: "Fixed",    text: "Dashboard feed filter pills: added negative-margin bleed + right padding so the row scrolls edge-to-edge on mobile without the last pill clipping." },
      { tag: "Improved", text: "Backend: requirements.txt slimmed by 26 packages that were installed on every Railway deploy but never imported (boto3/botocore, black/flake8/isort/mypy + linters, google-generativeai/google-genai/litellm, numpy/pandas, huggingface/tokenizers/tiktoken, pillow, pytest, s5cmd). Faster, lighter production builds; no runtime imports affected." },
      { tag: "Removed",  text: "Deleted a stray '=2.0.0' file from the repo root (a pip install artifact accidentally committed)." },
      { tag: "Fixed",    text: "Onboarding: added the missing IconPin import that caused a white-screen crash on the location step for every new email signup." },
      { tag: "Fixed",    text: "Events: state filter now defaults to the user's profile state, normalising full state names ('New South Wales') to the abbreviations the event data uses ('NSW'). The 'Hosting an event' button for free users now opens the Village+ upsell instead of doing nothing." },
      { tag: "Fixed",    text: "API: creating a forum post with a non-existent category_id now returns 404 instead of silently creating an orphaned, unviewable post." },
      { tag: "Fixed",    text: "Backend: startup environment validation was checking the wrong variable names (SECRET_KEY/MONGODB_URL) and so never validated the real secrets — corrected to JWT_SECRET/MONGO_URL plus the Stripe keys. .env.example updated to document IS_PRODUCTION (controls Secure cookies) and FRONTEND_URL." },
      { tag: "Tested",   text: "Full platform simulation sweep run against two live accounts (free + premium): event create/RSVP gating, Stall listing/enquiry/report gating, community create gating, block/unblock + DM enforcement, weekly post cap (429), chat usage tracking, admin authz, login brute-force rate limit, XSS render safety (react-markdown v10, no rehype-raw), and anonymous-post masking — all behaving correctly." },
    ],
  },
  {
    version: "3.37.0",
    date: "June 2026",
    title: "Trust Integrity, API Privacy Hardening & Freemium Rebalance",
    entries: [
      { tag: "Fixed",    text: "Onboarding: hardcoded '247 Australian parents online' badge replaced with the real count from /api/stats/online. Badge only renders when 5+ parents are online — never shows a fabricated or empty-feeling number." },
      { tag: "Improved", text: "Landing: 'LIVE PREVIEW / See what's happening right now' relabelled to 'A peek inside / What it looks like inside' with honest subcopy — sample posts are now clearly examples, not presented as live data. Hero chip 'Be the first parent online today' replaced with 'Now welcoming founding members'." },
      { tag: "Fixed",    text: "Landing privacy card: 'stored on Australian servers' overstated reality (Railway/Vercel process offshore). Now reads 'protected under the Australian Privacy Principles, with primary storage in Australia' — matching the hedged Privacy Policy wording." },
      { tag: "Improved", text: "Landing pricing table rewritten for marketing-product parity: free-tier fair-use limits disclosed, 'Ad-free forever' removed (no ads exist), The Village Stall added to both columns, 'Browse & RSVP to events' now true (see Events unlock below)." },
      { tag: "Security", text: "API: forum reads (posts, trending, categories, category detail), /feed, /search, /events (+detail, +ical), /stall/listings (+detail), /stall/groups (+detail), /chat/rooms/all and /users/{id} now require authentication. Previously these returned author names, suburbs, postcodes and coordinates to unauthenticated callers." },
      { tag: "Security", text: "API: raw latitude/longitude stripped from all forum post/reply payloads via mask_anonymous_post (distance_km computed server-side where needed). Profile API never returns coordinates even with location opt-in. Donation groups return member_count instead of the raw member_ids list; forum categories no longer expose member_ids. Private friends-room detail now 403s for non-participants." },
      { tag: "Security", text: "API: coordinates rounded to 2 decimal places (~1.1 km) at write time for forum posts, stall listings and donation groups — device-GPS precision can never reach the database. Event venue coordinates intentionally untouched (public meeting places need accurate map pins)." },
      { tag: "Improved", text: "Events unlocked for free users: browse and RSVP are now free; hosting events remains Village+ (backend 403 + gentle inline card: 'Hosting events is part of Village+ — browsing and RSVPing are always free.'). Nav lock removed on desktop, mobile overlay and bottom nav." },
      { tag: "Improved", text: "Chat limits rebalanced: DAILY_CHAT_LIMIT_FREE raised 10 → 40. The 3am Club (room_3am_club) is fully exempt — no counter, no wall, driven by daily_limit_applies from the API. Counter turns amber at ≤5 remaining with 'resets at midnight'. Wall copy now warm and informative: 'You've used today's free messages / They reset at midnight.'" },
      { tag: "Improved", text: "Reply limits rebalanced: WEEKLY_REPLY_LIMIT_FREE raised 5 → 30, and replies on your own posts never count against or get blocked by the limit — a parent can always respond in her own thread. Post limit stays 5/week with a quiet remaining-count line in CreatePost and 'resets Monday' messaging." },
      { tag: "Improved", text: "Mobile bottom nav: free users now get a Friends tab (with request badge) instead of the locked Messages paywall tab. Premium/trial users keep Messages. VillagePlus comparison table updated to match new server constants (5/week posts, 30/week replies, 40/day chat)." },
      { tag: "Improved", text: "Register: last name now optional (label, validation and backend model updated; full-name construction handles empty last name cleanly). Subtitle 'find your parenting tribe' → 'find your village.'" },
      { tag: "Improved", text: "Stall safety copy: payment guidance rewritten around the real scam vector — 'Meet in a public place and pay in person at handover — never transfer money in advance.' PayID/bank-transfer phrasing removed from CreateStallListing and StallListingDetail." },
    ],
  },
  {
    version: "3.36.2",
    date: "May 2026",
    title: "Mobile Sign Out",
    entries: [
      { tag: "Added", text: "Profile page: Sign out button added above Danger Zone, visible to own-profile viewers only. On mobile the bottom nav 'Me' tab leads here, making sign out reachable without the hamburger overlay. Desktop already had sign out in the avatar dropdown — button is shown there too for consistency." },
    ],
  },
  {
    version: "3.36.1",
    date: "May 2026",
    title: "Post Timestamps, Location Button Fix & Display Name Availability Check",
    entries: [
      { tag: "Fixed",    text: "Backend: create_reply now bumps updated_at on the parent post. Previously updated_at was never written after post creation, so timestamps were always the original post date even after many replies." },
      { tag: "Improved", text: "Dashboard feed + ForumCategory: post cards now show 'last reply X ago' (using updated_at) when the post has replies, and 'X ago' (created_at) for posts with no replies yet. Surfaces live conversations correctly." },
      { tag: "Fixed",    text: "LocationButton: hover state no longer goes white. Shadcn outline variant was overriding hover text with accent-foreground (near-white). Fixed with !important modifiers on hover:text and hover:bg classes." },
      { tag: "Added",    text: "Profile: Display Name field now shows real-time availability feedback as you type — debounced 500ms check against GET /api/users/check-nickname. Shows: ✓ Available (green), ✗ Already taken (red with border tint), spinner while checking, 'must be 2+ chars' for short input. Status resets to idle when value matches saved name or after successful save." },
      { tag: "Improved", text: "Dashboard greeting: now uses first_name from user profile before falling back to name split, avoiding full names from Google OAuth appearing in the greeting." },
    ],
  },
  {
    version: "3.36.0",
    date: "May 2026",
    title: "Dashboard Redesign, UI Consistency & Navigation Cleanup",
    entries: [
      { tag: "Improved", text: "Dashboard: replaced 3-mode switcher (I need help / Browse / Catch up) with a unified at-a-glance overview layout. Left column: Quick Actions, Recent in Spaces preview, search/filter pills, feed. Right rail (desktop): Activity notifications, Events Near You, Live Chat Rooms, My Shortcuts." },
      { tag: "Added",    text: "Dashboard: Quick Actions row — New Post, Join a Chat, Browse Stall (lock icon + /plus for free users). Stall action now uses the Stall SVG icon instead of an emoji." },
      { tag: "Added",    text: "Dashboard: personalised header shows good morning/afternoon/evening greeting, parenting stage, suburb, and live stats (parents online + active rooms). Online count polls every 30s. Rooms pill links to /chat." },
      { tag: "Added",    text: "Dashboard: Activity widget in right rail — recent notifications with smart navigation per type (reply→post, friend_request→/friends, dm→/messages, like→mark-read). 'See all' dispatches village:open-notifications event to open nav panel." },
      { tag: "Added",    text: "Dashboard: My Shortcuts widget — users can pin up to 8 links (communities, chat rooms, events, static pages) stored in localStorage. Edit/Done toggle, ✕ to remove, suggestions pool to add from." },
      { tag: "Added",    text: "Navigation: village:open-notifications event listener added to open the notifications panel from any page." },
      { tag: "Improved", text: "Navigation: heartbeat sent immediately on mount and every 3rd poll tick (was every 6th), keeping online count accurate while the user is active." },
      { tag: "Improved", text: "Night mode: village-card-hover and village-card-selected now use --clay (terracotta) border instead of --honey (amber/yellow). Consistent warm accent across day and night mode." },
      { tag: "Improved", text: "Post cards: ForumCategory, Community, and Dashboard feed post cards now all use village-card village-card-hover for consistent clay hover border in day mode and terracotta in night mode." },
      { tag: "Fixed",    text: "Dashboard filter pill row: removed marginBlock:-12px hack that was blocking pointer events on all surrounding cards. Replaced with py-2 padding. Hover highlights restored across the entire page." },
      { tag: "Fixed",    text: "Dashboard filter pill row: added pl-0.5 to inner flex container so the first pill (Latest) is not clipped against the scroll container edge." },
      { tag: "Removed",  text: "Events page: removed 'Discuss events in Spaces' callout block from the top of the event feed." },
      { tag: "Removed",  text: "Forums/Spaces page: removed Chat Rooms mobile shortcut card (was visible on mobile only via flex lg:hidden). Chat Rooms is accessible via the mobile bottom nav and overlay menu." },
    ],
  },
  {
    version: "3.35.0",
    date: "May 2026",
    title: "Brand Rename, Privacy Hardening, Donation Groups Privacy & ForClinicians Overhaul",
    entries: [
      { tag: "Improved", text: "Brand rename: platform name updated to 'Our Little Village' across all user-facing copy — CTAs, welcome messages, onboarding, footers, install prompts, VillagePlus upsell, ForClinicians, Settings, Register, App.js, ComingSoon, PWAInstallBanner, Suggestions, Landing. Sub-brand 'The Village Stall', tier name 'Village+', and legal entity 'The Village AU Pty Ltd' unchanged." },
      { tag: "Fixed",    text: "Profile location privacy: location fields (suburb, postcode, latitude, longitude, local_area) are now stripped from the GET /users/{user_id} API response for non-owners when show_location_on_profile is not explicitly true. Previously hiding was UI-only; the raw data was still visible in the API response." },
      { tag: "Improved", text: "Profile location now hidden by default (opt-in). useState default changed from true to false; data load check changed from !== false to === true. Toggle label updated to 'Hidden by default — only you can see it'." },
      { tag: "Improved", text: "DonationGroupDetail: postcode range labels now resolve to human-readable area names at display time. Old 'Postcodes 3030–3038' format is parsed with regex and resolved via /api/location/postcode/{n} to 'Brimbank to Melbourne City, VIC (3030–3038)'. resolvedCoverage state updated on group load." },
      { tag: "Added",    text: "DonationGroupDetail: non-members can now contact the organiser before joining via an inline message form with the organiser's first name shown in the button label." },
      { tag: "Improved", text: "ForClinicians page overhauled: logged-in users now get the full Navigation sidebar (lg:pl-60); logged-out users get a slim public nav with 'Our Little Village · For Clinicians' text + Sign In + Join Free. Dark mode toggle fixed — now uses useTheme() hook (sets data-theme attribute) instead of raw classList manipulation. Logo removed from nav header. Hero made more compact. Feature grid expanded to 6 tiles (added Communities and The Stall). 'Suburb-based circles' copy updated to 'local area-based Chat Rooms'. Footer image removed, replaced with text link." },
      { tag: "Fixed",    text: "ForClinicians dark mode toggle: was using legacy localStorage 'theme' key and classList only; now uses useTheme() which correctly sets data-theme on html element, matching the rest of the app." },
      { tag: "Fixed",    text: "Frontend .env: REACT_APP_BACKEND_URL restored to http://localhost:8000 (was temporarily changed to 8001 during a previous session's server workaround)." },
    ],
  },
  {
    version: "3.34.2",
    date: "May 2026",
    title: "Donation Groups: Edit Page, Suburb Multi-Add Fix, Navigation & Workflow Improvements",
    entries: [
      { tag: "Added",    text: "EditDonationGroup.jsx: new edit page for donation groups. Organiser and moderators can edit name, description, purpose type, area coverage (multi-suburb), cover image, accepted/not-accepted items, rules, end date, and open/closed status. Organiser can also add and remove moderators from this page." },
      { tag: "Added",    text: "App.js: /stall/groups/:groupId/edit route added, lazy-loaded, protected." },
      { tag: "Fixed",    text: "SuburbSearch: added onSelect and clearAfterSelect props. CreateDonationGroup suburb search now uses onSelect (fires only on dropdown pick) instead of onChange (fires every keystroke) — prevents a suburb chip being created for every typed character." },
      { tag: "Improved", text: "DonationGroupDetail: 'Donate to this group' navigates to /stall/new?group=<id>. 'Request support' renamed to 'Contact organiser' and navigates to /messages/<organiser_id>. Edit button navigates to /stall/groups/<id>/edit." },
      { tag: "Improved", text: "DonationGroupDetail: joining a group no longer requires Village+. All users can join to track and donate to groups." },
      { tag: "Improved", text: "DonationGroupDetail: organiser can add/remove mods inline via a manage panel. Mods can send a cancel request. Organiser sees approve/decline cancel request banner when a mod has requested cancellation." },
      { tag: "Improved", text: "Stall.jsx: Donation Groups tab splits into 'My Groups' (organiser or member) and 'Browse All' sections using is_member/is_organiser flags from backend. Limit increased to 50." },
      { tag: "Improved", text: "Backend: browse_donation_groups annotates each group with is_member and is_organiser flags from JWT. New endpoints: POST /stall/groups/{id}/end, POST /stall/groups/{id}/request-cancel, POST /stall/groups/{id}/approve-cancel, POST /stall/groups/{id}/decline-cancel, POST/DELETE /stall/groups/{id}/moderators." },
      { tag: "Improved", text: "CreateDonationGroup: 9 new purpose types (Baby Clothes, Kids Clothes, School Uniform Exchange, Toys & Games, Baby Gear, Maternity & Feeding, Nappies & Essentials, Books & Learning, General Donations). Rich field placeholders with drop-off examples. Multi-suburb search with chip display." },
    ],
  },
  {
    version: "3.34.0",
    date: "May 2026",
    title: "Mobile Nav, Auth Persistence, Donation Groups Overhaul & UX Fixes",
    entries: [
      { tag: "Added",    text: "Mobile bottom nav bar restored: fixed 5-tab bar (Home, Spaces, Chats, Messages, Me) visible on mobile only (lg:hidden). Active tab shows top indicator bar. Messages badge shows unread count for Village+ users." },
      { tag: "Improved", text: "Theme toggle redesigned: replaced single icon with a pill toggle showing both Sun and Moon, active mode highlighted in ink/paper. Visible on both desktop sidebar and mobile top bar. No more ambiguity about current setting." },
      { tag: "Improved", text: "Auth persistence: Contact, Terms, Privacy, and Community Guidelines pages now render the full app Navigation when a user is logged in, instead of always showing the pre-login PublicNav. Logged-in users stay in the app experience." },
      { tag: "Improved", text: "Message button on profiles now opens a direct conversation with that user immediately — no longer just opens the Messages inbox requiring manual search." },
      { tag: "Improved", text: "ChatRooms Night Owl banner: removed '3AM Club' specific reference. Now reads 'Late-night support is open. You're not alone tonight.'" },
      { tag: "Improved", text: "Donation Groups — dedicated group flow: CreateDonationGroup now collects group type (Baby Clothes, School Uniforms, Toy Drive, Newborn Essentials, Emergency Support, General Donations, Other), accepted items, not accepted items, group rules, open/closed status, and area coverage. All fields sent to backend." },
      { tag: "Improved", text: "DonationGroupDetail: members see 'Donate to this group' and 'Request support' action buttons. Group type badge, accepted/not-accepted items, and rules now displayed in dedicated sections. Paused groups show a 'Temporarily paused' banner." },
      { tag: "Improved", text: "Stall Giving Away filter: added contextual callout distinguishing quick free listings from structured Donation Groups, with a direct link to the groups tab." },
      { tag: "Improved", text: "Backend: DonationGroup and DonationGroupCreate models updated with area_coverage, purpose_type, accepted_items, not_accepted, rules, and is_open fields." },
      { tag: "Fixed",    text: "Global mobile padding: pages now reserve 80px at bottom on mobile for the restored bottom nav bar." },
    ],
  },
  {
    version: "3.33.0",
    date: "May 2026",
    title: "Filter Design System, Badge Overhaul, Email Improvements & UI Cleanup",
    entries: [
      { tag: "Improved", text: "Filter design system consistency pass across all pages: primary filters (Browse/Help, mode selectors) now use ink/paper pill container; content sub-filters use sage-wash with night-mode glow; underline tabs (Stall/Saved) use border-b-2 pattern. Affected: ChatRooms, Dashboard, Events, Stall, Forums, ModeratorDashboard, AdminDashboard, SavedResources." },
      { tag: "Added",    text: "index.css: sage-pill-active utility class — applies a soft green glow (rgba 154,201,158 / 28%) in night mode only, so active content filters are visually distinct without being harsh." },
      { tag: "Improved", text: "ChatRooms: primary All/Local filters in ink/paper container; Live now pill always shows border (var(--line)) and turns sage on active — retains its unique identity while remaining visible when inactive." },
      { tag: "Improved", text: "Forums Communities layout: Create Community button moved adjacent to the search input; filter pills (All/Local/Joined/Open) and sort control moved to a row below search. Description text moved above search to reduce vertical crowding." },
      { tag: "Added",    text: "Email verification hard gate: unverified users are redirected to /verify-email on every protected route. VerifyEmailPage handles both token verification (from email link) and a holding/resend page for users who haven't verified yet. Dismissible banner removed." },
      { tag: "Improved", text: "Badge system refactor: extracted _compute_badges_for_user() as a standalone async function. Badges now auto-recompute via fire_and_forget after forum post creation, forum reply creation, and friend request acceptance (for both users). Previously only recomputed on profile visit." },
      { tag: "Added",    text: "9 new badges: First Post (🌱), Conversationalist (💬, 25+ posts), Helper (🤗, 50+ replies), Liked by The Village (❤️, 20+ likes), 1 Month Member (🏡), 1 Year Member (🎂), Stall Seller (🛒), Village Friend (🤝, 5+ friends), 3AM Club (🌙, 10+ late-night sessions). All shown in Profile badge grid with earned/unearned state." },
      { tag: "Improved", text: "Profile.jsx: removed non-functional 'I want to connect with' dropdown (stored in DB but not used by any query). Removed 'Weekly digest' toggle (email preference exists but no scheduler was configured). Both fields preserved on backend harmlessly." },
      { tag: "Added",    text: "Stall enquiry and follow-up message emails: listing owner now receives an email when someone sends a stall enquiry (first message) or a follow-up stall message. Uses notify_dms preference. Templates include listing title, sender name, and link to messages." },
      { tag: "Improved", text: "All email templates: branding updated from 'The Village' to 'Our Little Village — Parenting Assistance Platform'. Support email in all footers changed to support@ourlittlevillage.com.au. 'hello@ourlittlevillage.com.au' removed from templates." },
      { tag: "Fixed",    text: "Professional verification email: fixed typo in recipient address (ourliitlevillage → ourlittlevillage), fixed capitalisation (Professionals@ → professionals@). Email now includes a direct Approve button linking to the admin portal professionals tab." },
      { tag: "Fixed",    text: "subscription_cancelled email: 'Share Feedback' button now links to /suggestions instead of a dead URL. Support email address added as plain-text fallback." },
      { tag: "Added",    text: "Backend: SUPPORT_EMAIL and SUGGESTIONS_EMAIL env vars. POST /api/suggestions endpoint — stores suggestion in db.suggestions collection and emails to SUGGESTIONS_EMAIL. Suggestions.jsx wired to real API (was previously a fake timeout)." },
      { tag: "Improved", text: "Settings.jsx: email change help text now includes a mailto link to support@ourlittlevillage.com.au. Legal section: Contact Support row added with mailto link." },
    ],
  },
  {
    version: "3.32.0",
    date: "May 2026",
    title: "Chat Popout Glow, Larger Bubble & Coming Soon Bypass Gate",
    entries: [
      { tag: "Improved", text: "ChatPopout minimised bubble is now larger on both free and Village+ — bigger padding, larger icon (h-5 w-5), semibold text-sm label, and a bigger unread badge (h-5 min-w-[20px])." },
      { tag: "Added",    text: "ChatPopout Village+ bubble now shows a soft glowing border using primary colour box-shadows — three-layer glow (ring + inner bloom + outer bloom) that intensifies when there are unread messages." },
      { tag: "Added",    text: "ComingSoonPublic.jsx — standalone public-facing gate page (warm branded design, no app navigation) shown on main when REACT_APP_COMING_SOON=true." },
      { tag: "Added",    text: "App.js: ComingSoonGate component wraps the full app. Reads REACT_APP_COMING_SOON and REACT_APP_PREVIEW_SECRET env vars. If coming soon mode is active and no bypass is set, renders ComingSoonPublic. Bypass: visit /?preview=<secret> to set localStorage flag and unlock the full app for that browser." },
    ],
  },
  {
    version: "3.31.0",
    date: "May 2026",
    title: "Instant Notifications, Real-time Read Sync & Landing Page Stall",
    entries: [
      { tag: "Added",    text: "Backend: POST /notifications/mark-dm-read — marks all dm and message_request notifications as read for the current user. Called when any DM conversation is opened." },
      { tag: "Added",    text: "DM notifications now store from_user_id on creation, enabling future per-sender mark-read precision." },
      { tag: "Improved", text: "Reading a DM in the chat popout or Messages page now instantly clears: the notification bell count, the notification panel list (dm/message_request entries), the Dashboard 'things to check' section, and the Messages page conversation unread badges — all without a page refresh." },
      { tag: "Improved", text: "Navigation: village:dm-read event handler now decrements unreadCount by the exact number of unread DM notifications in local state (inside setNotifications updater for synchronous state access), then re-polls the server to correct any drift." },
      { tag: "Improved", text: "Dashboard: listens for village:dm-read and immediately marks dm/message_request activity entries as read in local state." },
      { tag: "Improved", text: "Messages.jsx: listens for village:dm-read and clears all conversation unread counts in local state when a DM is read in the popout." },
      { tag: "Improved", text: "ChatPopout: fetches conversations on mount (not just when opened) so the bubble unread count is correct immediately after login. Piggbacks on Navigation's village:nav-poll event every 20s to stay in sync without a separate poll loop." },
      { tag: "Improved", text: "ChatPopout: fixed size — Village+ 340×540px, free 340×500px. Consistent readable height regardless of content instead of collapsing with short lists." },
      { tag: "Improved", text: "ChatPopout: free user view now shows a 'Private Messages' section label with a 'Message anyone' Village+ link. Village+ inbox tab renamed from 'Inbox' to 'Messages' with a 'Private Messages' section header above filter pills." },
      { tag: "Added",    text: "Landing page: The Village Stall added to the 'What's inside' feature grid and as a 4th tab in the 'See what's happening' demo section (Spaces / Chat Rooms / Events / Stall) on both mobile and desktop." },
    ],
  },
  {
    version: "3.30.0",
    date: "May 2026",
    title: "Friends Overhaul, Find Parents Search & DM Improvements",
    entries: [
      { tag: "Added",    text: "Friends page: 'Find Parents' tab — search by name or suburb, see online status and location, send friend requests directly from results. Debounced search (300ms) with loading skeleton." },
      { tag: "Added",    text: "Friends page: 'Sent Requests' tab — shows who you've sent a friend request to (with avatar, name, suburb), plus a Cancel button. Cancelling deletes the request and removes the unread notification from the recipient." },
      { tag: "Added",    text: "Backend: GET /friends/sent now returns full recipient profile (avatar, name, suburb, online status) alongside each pending request." },
      { tag: "Added",    text: "Backend: DELETE /friends/request/{request_id} — cancels an outgoing friend request and removes the associated unread notification from the recipient." },
      { tag: "Improved", text: "Messages.jsx: Friends tab now shows all friends in a unified view — friends with existing DM history show conversation preview and unread badge; friends with no history show 'Tap to chat'. Sorted by last message time, contact-only friends sorted last." },
      { tag: "Improved", text: "Messages.jsx: DM conversations are re-categorised based on current relationship — a message thread started before a friendship now appears under Friends instead of under Private Messages." },
      { tag: "Improved", text: "ChatPopout.jsx: free users now see their existing DM conversations and can reply. The full upgrade gate is removed — only initiating new chats with non-friends requires Village+. Bubble shows live unread count instead of a lock icon." },
    ],
  },
  {
    version: "3.29.0",
    date: "May 2026",
    title: "Stall Enhancements, Events Dialog Fix & Chat Auto-Throttle",
    entries: [
      { tag: "Added",    text: "Auto-throttle slow mode in Chat Rooms — backend tracks message frequency per room using a sliding 60-second window. Rooms hitting 10/20/40/80 messages/min automatically apply a 5/10/20/30s cooldown. Manual admin floor still applies alongside auto throttle; effective cooldown = max(auto, manual, 3s)." },
      { tag: "Added",    text: "Chat send button cooldown — instead of bouncing a 429, the send button is disabled with a live countdown for the exact cooldown duration. A 'Room is busy' explanation appears when cooldown > 5s." },
      { tag: "Added",    text: "GET /admin/chat/rooms now returns auto_slow_mode_seconds and effective_slow_mode_seconds per room alongside the manual floor. Admin UI shows both badges." },
      { tag: "Added",    text: "SuburbSearch component — debounced suburb autocomplete backed by /api/location/search, used in Create and Edit Stall Listing flows. Replaces plain free-text suburb input." },
      { tag: "Fixed",    text: "Edit Stall Listing: updating a listing's suburb now correctly saves state and postcode alongside suburb text. Previously only the suburb string was tracked, leaving old state/postcode values on the listing." },
      { tag: "Fixed",    text: "Events.jsx: Edit and Mods dialogs moved outside the <article onClick> element to a React fragment sibling. Previously, clicking the dialog overlay bubbled to the article's onOpenDetail handler, opening the event detail instead of the dialog." },
      { tag: "Added",    text: "Stall listing 'Pending' status — sellers can mark a listing as in-negotiation from both the My Listings quick actions and the Edit Listing page. Pending listings remain visible to buyers in browse with a amber badge on the card." },
      { tag: "Fixed",    text: "Stall browse query now includes status: pending alongside active — previously pending listings were filtered out of browse results." },
      { tag: "Added",    text: "Stall listing card photo carousel — multiple photos can be scrolled via left/right chevron arrows on desktop and touch swipe on mobile (40px threshold)." },
      { tag: "Added",    text: "Listing card description preview — up to 2 lines of description shown on the card. Image aspect ratio reduced from 4/3 to 16/10 to make room without increasing card height." },
      { tag: "Improved", text: "Stall tab bar changed from overflow-x-auto/scrollbar-none to flex-wrap — eliminates scrollbar bleed-through on the right edge." },
      { tag: "Improved", text: "ChatRooms.jsx: live tab no longer persisted to URL — live rooms are time-sensitive and should not be the default landing tab on revisit." },
    ],
  },
  {
    version: "3.28.0",
    date: "May 2026",
    title: "Session Persistence, Slow Mode, Chat Popout Filters & Nav Fixes",
    entries: [
      { tag: "Added",    text: "Session persistence: JWT expiry extended to 30 days with a sliding window — token is silently renewed when fewer than 7 days remain. Authenticated users are no longer logged out after a week of activity." },
      { tag: "Added",    text: "SlidingSessionMiddleware (FastAPI BaseHTTPMiddleware) — runs on every authenticated response, decodes the JWT, checks remaining TTL, and issues a fresh cookie when below the renewal threshold." },
      { tag: "Added",    text: "Admin Chat Rooms tab — admins can view all chat rooms sorted by message volume, see live slow mode status per room (amber badge when active), set slow_mode_seconds via a number input, and save per-room." },
      { tag: "Added",    text: "Backend: POST /admin/chat/rooms/:roomId/slow-mode and GET /admin/chat/rooms endpoints. Slow mode is stored on the room document (slow_mode_seconds field). Rate limiter reads this field on every message send — defaults to 3s per-room cooldown if slow mode is off, applies slow_mode_seconds cooldown if set." },
      { tag: "Added",    text: "ChatRoom.jsx: slow mode indicator (🐢 + seconds) displayed above the message input when slow_mode_seconds > 0." },
      { tag: "Added",    text: "ChatPopout: Inbox tab renamed from 'Messages'; filter pills added — All, Friends, Stall, Events. Stall and Events filters navigate to the full Messages page with the correct tab pre-selected. PopoutDmRow updated with type badges (amber Stall, blue Event) and contextual subtitles (listing title for Stall, event title for Events)." },
      { tag: "Improved", text: "Messages.jsx: filter pills changed from overflow-x-auto / fixed-padding to flex-1 equal-width layout — all 5 pills fit without horizontal scrolling at normal mobile widths." },
      { tag: "Improved", text: "Forums.jsx, ChatRooms.jsx, Friends.jsx, Stall.jsx: active tab now synced to the URL via setSearchParams({ tab }, { replace: true }). Browser back button restores the correct tab instead of resetting to the section homepage." },
      { tag: "Improved", text: "ChatRooms.jsx: 'National rooms' renamed to 'All Australia rooms' throughout. Sidebar copy expanded — explains rooms are open to all parents with no location required. Standalone 3am Club daytime callout card removed; its content merged into the Quiet Hours sidebar section." },
      { tag: "Improved", text: "ChatRooms.jsx: 'Friends chats' line removed from the How Chat Works sidebar — it described a feature not currently active in this area." },
      { tag: "Improved", text: "Forums.jsx: age group spaces in the By Age Group tab sorted youngest-to-oldest using AGE_ORDER array (Pregnancy & Expecting → Newborns → Babies → Toddlers → Preschool & Kinder → Primary School → Teenagers)." },
    ],
  },
  {
    version: "3.27.0",
    date: "May 2026",
    title: "Age Group Renames + Stable Category IDs for All Spaces",
    entries: [
      { tag: "Renamed",  text: "Preschoolers → Preschool & Kinder (3–5 years). School Age → Primary School (5–12 years). Both renamed in cats_to_seed, CATEGORY_RENAMES, _AGE_GROUP_CANONICAL, and admin dedup endpoint." },
      { tag: "Added",    text: "Stable category_ids for all previously random-ID spaces: cat-feeding (Feeding), cat-sleep-settling (Sleep & Settling), cat-wellbeing (Parent Wellbeing), cat-solo-parents (Solo Parents), cat-family-rel (Family & Relationships), cat-real-talk (Real Talk), cat-local-village (Local Village), cat-age-pregnancy (Pregnancy & Expecting), cat-age-newborns (Newborns), cat-age-babies (Babies), cat-age-toddlers (Toddlers), cat-age-primary (Primary School), cat-age-teenagers (Teenagers)." },
      { tag: "Fixed",    text: "Startup dedup now prefers stable IDs (cat-*, mum-space, dad-space) over random-ID legacy entries regardless of post count. Posts are migrated from the dropped entry to the winner before deletion. This permanently fixes dev≠local differences caused by random-ID entries winning dedup." },
      { tag: "Fixed",    text: "Per-category dedup in cats_to_seed loop now also migrates posts before deleting the random-ID duplicate." },
      { tag: "Fixed",    text: "CATEGORY_RENAMES merge logic updated to prefer stable IDs. Added 'Preschoolers' → 'Preschool & Kinder' and 'School Age' → 'Primary School' to both startup and admin dedup CATEGORY_RENAMES lists." },
      { tag: "Fixed",    text: "Second dedup pass also updated to prefer stable IDs." },
      { tag: "Added",    text: "Forums.jsx: Pregnancy & Expecting now appears in BOTH the By Topic tab and the By Age Group tab." },
      { tag: "Improved", text: "Forums.jsx: AGE_FILTER_MATCH updated — toddler filter matches 'preschool' and 'kinder'; school filter matches 'primary school' and 'teen'. AGE_FILTERS labels updated to 'Toddler & Kinder' and 'Primary & Teens'." },
      { tag: "Improved", text: "Forums.jsx: TOPIC_FILTER_MATCH updated — Parenting now includes 'feeding' and 'sleep'; Family Life includes 'expecting'." },
    ],
  },
  {
    version: "3.26.0",
    date: "May 2026",
    title: "New Spaces & Chat Rooms",
    entries: [
      { tag: "Added", text: "4 new forum Spaces: Postnatal Recovery, Blended & Co-Parenting, Working Parents, Baby Gear & Reviews — all seeded with stable category_ids in startup." },
      { tag: "Added", text: "4 new Chat Rooms: Playgroup & Activities, Working Parents Chat, Screen Time & Tech, Pregnancy Chat — all seeded with stable room_ids in startup." },
      { tag: "Improved", text: "Forums.jsx TOPIC_FILTER_MATCH updated: Support includes Postnatal Recovery; Parenting includes Working Parents, Baby Gear & Reviews; Family Life includes Blended & Co-Parenting and Working Parents; Ask & Share includes Baby Gear & Reviews." },
      { tag: "Improved", text: "ChatRooms.jsx ROOM_TYPE_KEYWORDS updated: Support includes Pregnancy Chat; Parenting includes Working Parents Chat, Screen Time & Tech, Playgroup & Activities; Social includes Playgroup & Activities." },
      { tag: "Improved", text: "/seed endpoint updated to include all new rooms and spaces for consistent fresh-DB seeding." },
    ],
  },
  {
    version: "3.25.0",
    date: "May 2026",
    title: "Spaces & Chat Rooms Overhaul",
    entries: [
      { tag: "Improved", text: "All space and chat room names reviewed and updated for clarity, warmth, and Australian tone. No emojis in descriptions." },
      { tag: "Renamed",  text: "Spaces: Mums Space → Mums of The Village, Dad Space → Dads of The Village, Just Venting → Real Talk, Mental Health Space → Parent Wellbeing, Single Parents Space → Solo Parents, Relationships → Family & Relationships, Local Meetups → Local Village, Feeding Space → Feeding, Sleep Space → Sleep & Settling, Newborn Space → Newborns, Infant Space → Babies, Toddler Space → Toddlers, School Age Space → School Age, Teenager Space → Teenagers, Expecting Space → Pregnancy & Expecting." },
      { tag: "Renamed",  text: "Chat Rooms: 3am Club → The 3am Club, Single Parents Lounge → Solo Parents Chat, Vent Room → Real Talk." },
      { tag: "Added",    text: "9 new stable-ID forum spaces: Ask The Village, New Parents, Neurodiverse Families, Childcare & School, Family Budget, Local Recommendations, Village Wins, Preschoolers (age group), all seeded via startup with stable category_ids." },
      { tag: "Added",    text: "2 new chat rooms: Ask The Village and Recommendations — both seeded in startup with stable room_ids." },
      { tag: "Added",    text: "Backend CATEGORY_RENAMES migration — runs on every startup. Renames legacy /seed category names to canonical names in-place; merges posts and deletes duplicate if both old and new names exist." },
      { tag: "Added",    text: "Backend OLD_ROOM_NAME_MAP cleanup — on startup, deletes old-named /seed rooms (3am Club, Single Parents Lounge, Vent Room) once stable-ID replacements exist." },
      { tag: "Added",    text: "Forums.jsx: topic filter pill bar — All, Support, Parenting, Family Life, Local, Ask & Share, Wellbeing. Filters topic space cards by keyword matching." },
      { tag: "Added",    text: "Forums.jsx: age filter pill bar — All ages, Expecting, Baby (0–12m), Toddler & Preschooler, School Age+. Filters age group cards by keyword matching." },
      { tag: "Fixed",    text: "Forums.jsx: isMum/isDad regex updated to match plural forms (Mums, Dads). isMumSpace/isDadSpace category_id fixed from mum-circle/dad-circle to mum-space/dad-space." },
      { tag: "Added",    text: "ChatRooms.jsx: secondary room type filter chips — All rooms, Support, Parenting, Social, Ask & Share. Hidden when Local tab is active. Applied to both Live now and All Australia grids." },
      { tag: "Fixed",    text: "ChatRooms.jsx: 3am Club daytime callout converted from clickable Link to informational-only callout — no longer creates a visual duplicate of the room tile. Arrow and hover styling removed." },
      { tag: "Improved", text: "ChatRooms.jsx: page h1 updated from 'Drop in. Chat live.' to 'Chat Rooms' with a clearer subtitle." },
      { tag: "Improved", text: "spaces.js SPACE_NAME_MAP expanded to cover all legacy Circle names, Space names, and chat room names for correct display via getSpaceName()." },
    ],
  },
  {
    version: "3.24.0",
    date: "May 2026",
    title: "Inbox Deep-Links, Profile Links & Add Friend from DM",
    entries: [
      { tag: "Fixed",    text: "GET /events/my-chats was shadowed by GET /events/{event_id} due to FastAPI route ordering — moved my-chats before the parameterised route so it resolves correctly." },
      { tag: "Added",    text: "DM chat header: avatar and name are now clickable links to /profile/{user_id}. Replaces the static 'Direct Message' badge with a contextual Add Friend button (or 'Sent ✓' / 'Friends ✓' states)." },
      { tag: "Added",    text: "Add Friend button in DM header — sends POST /api/friends/request from inside the chat. Resets to default state when switching conversations. Shows 'Sent ✓' (green) after sending, 'Friends ✓' if already friends, 'Request Pending' (amber) if request is outgoing." },
      { tag: "Improved", text: "Non-friend DM rows in the sidebar now show a faint lock icon before the last message preview — visually distinguishes them from friend chats without adding another tab." },
      { tag: "Added",    text: "View Listing button in Stall chat header — navigates to /stall/listing/{listing_id}. Avatar and name are also clickable. Previously navigated to /stall (the section home)." },
      { tag: "Added",    text: "View Event button in Event chat header — navigates to /events?event={event_id}, which auto-fetches and opens that event's detail modal. Avatar and name are also clickable." },
      { tag: "Added",    text: "Events.jsx: ?event=EVENT_ID deep-link support — useEffect fetches GET /api/events/{event_id} and opens the EventDetailModal on mount. Works alongside existing ?action=create and ?tab=rsvp params." },
    ],
  },
  {
    version: "3.23.0",
    date: "May 2026",
    title: "Events Tab in Unified Inbox",
    entries: [
      { tag: "Added",    text: "Events tab in the Messages inbox — event group chats now appear as a fifth filter tab alongside All / Unread / Friends / Stall." },
      { tag: "Added",    text: "fetchEventConversations() calls GET /api/events/my-chats on mount and after sending. Returns events the user RSVPed to, organised, or messaged in, each with last message, last_message_time, title, date, category, and image_url." },
      { tag: "Added",    text: "Event rows in the sidebar show a rounded calendar-icon thumbnail (or the event cover photo), event title, and formatted date + last message preview as a sub-label." },
      { tag: "Added",    text: "Event chat panel: header shows event cover photo/Calendar icon, event title, formatted date (weekday + day + month), and a blue Event badge. Composer placeholder reads 'Chat in [event name]...'." },
      { tag: "Added",    text: "fetchEventMessages() polls GET /api/events/{event_id}/chat at 2s interval when an event chat is active. Sends via POST /api/events/{event_id}/chat. Ding fires when a new message arrives from another author." },
      { tag: "Added",    text: "openEventChat() clears all other active chat state (stall, friend room, DM) before opening the event chat panel." },
      { tag: "Improved", text: "clearChat() now also clears activeEventConv. hasActiveChat includes activeEventConv. activeUser is null for both stall and event modes (no 1:1 partner)." },
      { tag: "Improved", text: "Composer placeholder is now mode-aware: event → 'Chat in [title]...', stall → 'Message about [listing]...', DM → 'Message [name]...' — fixes a potential crash where stall mode had activeUser=null." },
      { tag: "Improved", text: "Empty state for Events tab: '📅 No event chats yet. RSVP to an event to join its group chat.' Event conversations included in recentConversations with unread_count: 0 (no per-message read tracking on event chats yet)." },
    ],
  },
  {
    version: "3.22.0",
    date: "May 2026",
    title: "Unified Messenger Inbox + Filter Tabs",
    entries: [
      { tag: "Improved", text: "Messages page is now a unified inbox — DMs, friend chats, and Stall enquiries all appear in a single chronologically sorted list with filter tabs: All / Unread / Friends / Stall. Previously Stall messages were only accessible from the Stall page." },
      { tag: "Added",    text: "Filter tab bar (Messenger-style) at the top of the sidebar. Each tab shows a red badge when there are unread messages in that category. Unread tab shows only conversations with unread messages. Stall tab shows only Stall enquiries. Friends tab shows only friend conversations + contacts." },
      { tag: "Added",    text: "Stall conversations in the unified sidebar show the listing thumbnail (or ShoppingBag fallback), the other user's name, and the listing title as a sub-label with a 🛒 Stall badge." },
      { tag: "Added",    text: "Stall chat panel: header shows listing image + title + user name. Sending works via POST /api/stall/messages. Polling at 2s interval matches existing stall thread behaviour." },
      { tag: "Improved", text: "Friends with no conversation history are grouped at the bottom as a 'Friends' contact section, only shown when there are no recent messages with them." },
      { tag: "Improved", text: "fetchStallConversations() called on mount alongside fetchFriends and fetchConversations. Stall conversations refresh after sending a stall message." },
    ],
  },
  {
    version: "3.21.0",
    date: "May 2026",
    title: "Message Requests",
    entries: [
      { tag: "Added",    text: "Message requests — when a Village+ user messages someone they're not friends with for the first time, the message arrives as a request instead of landing straight in the inbox. The recipient sees Accept / Decline buttons with a preview of the first message." },
      { tag: "Added",    text: "Backend: is_request flag on DirectMessage model. send_direct_message checks friendship (db.friendships), established conversation (non-request messages exist), and pending request (already sent one). Sets is_request=True only for genuine first-contact non-friends." },
      { tag: "Added",    text: "Backend: POST /messages/{other_user_id}/accept-request — clears is_request flag on pending messages and marks them read. POST /messages/{other_user_id}/decline-request — deletes the pending request messages." },
      { tag: "Improved", text: "Conversations endpoint now includes is_pending_request, is_outgoing_request, and request_preview per conversation, derived from a single aggregation pipeline with no N+1 queries." },
      { tag: "Improved", text: "Chat panel shows a 'Request Pending' badge and amber banner for outgoing requests. Trying to send a second message before acceptance returns a clear toast." },
      { tag: "Improved", text: "Notification type 'message_request' added to Navigation.jsx toast MAP. Unread count excludes is_request messages (not counted until accepted)." },
    ],
  },
  {
    version: "3.20.0",
    date: "May 2026",
    title: "Event Cover Photos",
    entries: [
      { tag: "Added", text: "Events can now have a cover photo. An image upload section appears in the Create Event form — supports JPEG, PNG, GIF, WebP up to 5MB. Photo is uploaded to /api/upload/image (base64, magic-byte validated) and stored as image_url on the event document." },
      { tag: "Added", text: "Event detail modal shows the cover photo as a full-width banner between the title block and the event details (time, location, organiser, description)." },
      { tag: "Added", text: "Event cards show a small thumbnail on the right side when the event has a cover photo." },
    ],
  },
  {
    version: "3.19.0",
    date: "May 2026",
    title: "Reply UX Overhaul, Auto-Bullet Lists & Toolbar Polish",
    entries: [
      { tag: "Fixed",    text: "Edit / Delete options now appear on your own reply immediately after posting — server doesn't return is_own_reply on create, so it's set client-side when appending the new reply to state." },
      { tag: "Improved", text: "Inline reply form and bottom reply box are now fully independent — separate state (inlineReplyContent / replyContent) so typing in one doesn't affect the other." },
      { tag: "Improved", text: "Bottom 'Add a Reply' box is now always visible, even when an inline reply form is open. Previously it was hidden whenever replyingTo was set, making it unreachable if the target thread was collapsed." },
      { tag: "Improved", text: "Pressing Enter inside a bullet list (- or *) or numbered list auto-adds the next bullet / increments the number. Pressing Enter on an empty bullet exits the list. Works in all reply forms and the post composer." },
      { tag: "Fixed",    text: "Removed 'Inline code' button from the Markdown toolbar — the Code import was also cleaned up. Remaining toolbar: Bold, Italic, Strikethrough, Quote, Bullet list, Link." },
    ],
  },
  {
    version: "3.18.0",
    date: "May 2026",
    title: "Bug Fixes, Markdown Formatting & Message Photo Lightbox",
    entries: [
      { tag: "Fixed",       text: "Report a post was broken — _check_rate_limit was called with wrong keyword arguments (limit=, window=) causing a TypeError on every report attempt. Fixed to use correct positional args." },
      { tag: "Fixed",       text: "Sending a photo in DMs failed with 'message failed to send' — DirectMessageCreate had max_length=2000 which rejected base64 image data URLs (which can exceed 100k characters). Raised to 2,000,000 to accommodate encoded images." },
      { tag: "Fixed",       text: "Clicking a photo in Spaces went to about:blank — window.open() with a data URL is blocked by browsers. Replaced with an inline lightbox overlay in ForumPost.jsx." },
      { tag: "Fixed",       text: "Same lightbox fix applied to photo messages in Messages.jsx." },
      { tag: "Added",       text: "Markdown formatting in Spaces — posts and replies now render full markdown: bold, italic, strikethrough, inline code, code blocks, blockquotes, bullet and numbered lists, links, tables (GFM). Shared MarkdownContent component with Village-scoped styles." },
      { tag: "Added",       text: "Markdown toolbar in post composer (CreatePost) and reply composer (ForumPost) — Bold, Italic, Strikethrough, Inline Code, Quote, List, Link buttons. Wraps selected text or inserts at cursor. Uses onMouseDown to avoid blur." },
      { tag: "Improved",    text: "Messages popout minimised button made larger — increased padding, icon size (h-5 w-5), text size (text-sm font-semibold), badge size, and corner radius for better visibility on web." },
      { tag: "Fixed",       text: "Live Now threshold reduced from 4 hours → 45 minutes. Rooms only appear as live if a message was sent in the last 45 minutes. Both backend endpoint and frontend card indicators use the same threshold." },
    ],
  },
  {
    version: "3.17.0",
    date: "May 2026",
    title: "Chat Rooms Live Fix, Performance, Mobile Landing & Privacy Copy",
    entries: [
      { tag: "Fixed",       text: "Live Now tab — was always empty because it relied on the active_users counter, which was never updated by real usage. Replaced with last_activity_at signal: rooms are live if a message was sent in the last 45 minutes. Threshold reduced from 4 hours → 45 minutes on both backend and frontend card indicators." },
      { tag: "Fixed",       text: "All Australia section — rooms that appear in Live Now are now hidden from the All Australia grid to prevent duplicates. Section heading changes to 'Quiet right now — drop in anytime' when rooms are live elsewhere." },
      { tag: "Fixed",       text: "Live Now only showed 2 rooms even when others were active — frontend was limited to rooms already fetched for the user's area. New /api/chat/rooms/live endpoint queries all room types by last_activity_at regardless of area, returning the full live set." },
      { tag: "Fixed",       text: "Dashboard 'X Live' badge and 'X spaces active' greeting were always hardcoded to 5. Now fetches real counts from /api/stats/online — shows genuine online user count and active room count." },
      { tag: "Added",       text: "Room cards show a pulsing 'Active now' dot and 'Drop in' badge when last_activity_at is within 45 minutes. Quiet rooms show member count and 'Open' as before." },
      { tag: "Improved",    text: "Admin Dashboard tab bar replaced single horizontal scrolling row with two stacked rows: Insights (Overview, Engagement, Leaderboards, Revenue, Content) and Actions (Users, Moderation, Communities, Professionals, Announcements, Blog). No more horizontal scroll on smaller screens." },
      { tag: "Improved",    text: "Mobile landing page — removed section-by-section pagination (Next/Back buttons and dots). All sections now scroll naturally like desktop, matching expected mobile behaviour." },
      { tag: "Fixed",       text: "Navigation — 'My Communities' link now correctly opens the Communities tab with the joined filter applied (/forums?tab=communities&filter=joined). Forums page reads the ?filter= URL param and initialises communityFilter state from it." },
      { tag: "Performance", text: "Route-based code splitting with React.lazy — 30 non-critical pages now load on demand. Core routes (Landing, Login, Register, Dashboard, Forums, ChatRooms) remain static. Reduces initial bundle size significantly." },
      { tag: "Performance", text: "Backend feed query parallelised with asyncio.gather — inaccessible communities, blocked users (out/in), categories, likes, and memberships now fetched concurrently instead of sequentially." },
      { tag: "Performance", text: "Area room lookup converted from per-area find_one loop to a single batch find query, eliminating N+1 pattern." },
      { tag: "Legal",       text: "Removed false 'Hosted in Australia' and 'Australian servers' claims from Landing page and Privacy policy. Accurate copy: data is stored in Australia (MongoDB Atlas, AWS Sydney); backend processing and CDN use overseas providers. All covered by Australian Privacy Principles compliance." },
    ],
  },
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
    version: "3.38.0",
    date: "June 2026",
    title: "Gentle Chimes, a Fresh Look & Behind-the-Scenes Fixes",
    entries: [
      "New: a soft chime now plays when you get a new message or notification — so you don't miss a reply while you're elsewhere on the page. You can turn message and notification sounds on or off any time in Settings.",
      "A refreshed look: the Our Little Village wordmark and a new app icon now appear consistently everywhere — the footer, sign-in pages, and when you add the app to your home screen.",
      "Chat Rooms now lay out more comfortably on laptop screens, and rooms with just a few messages no longer leave an awkward empty gap.",
      "Fixed a crash some new members hit on the location step while setting up their profile.",
      "Events now open to your own state automatically, and the 'Host an event' button now clearly leads to Village+ for free members.",
      "A range of smaller reliability and safety fixes behind the scenes, plus a full end-to-end test pass across posting, chat, events, the Stall, messaging and privacy.",
    ],
  },
  {
    version: "3.37.0",
    date: "June 2026",
    title: "Events Free for Everyone, Bigger Chat Limits & Stronger Privacy",
    entries: [
      "Events are now free for everyone — browse what's on near you and RSVP without Village+. Hosting your own event is a Village+ feature.",
      "Free chat limits got a lot more generous: 40 messages a day (up from 10), and The 3am Club has no limit at all — late-night support should never get cut off mid-conversation.",
      "Reply limits went from 5 to 30 per week, and replying on your own posts never counts — you can always respond to the parents helping you out.",
      "Privacy got stronger behind the scenes: your posts, profile and listings can no longer be viewed without being signed in, and precise location coordinates never leave our servers — other members only ever see your suburb.",
      "On mobile, free members now see a Friends tab in the bottom bar instead of a locked Messages tab.",
      "Signing up is a little quicker — last name is now optional.",
      "Clearer safety guidance on The Village Stall: meet in a public place and pay in person at handover — never transfer money in advance.",
    ],
  },
  {
    version: "3.36.2",
    date: "May 2026",
    title: "Sign Out Now Accessible on Mobile",
    entries: [
      "You can now sign out directly from your Profile page — no need to find the menu. Scroll to the bottom of your profile and tap Sign out.",
    ],
  },
  {
    version: "3.36.1",
    date: "May 2026",
    title: "Smarter Timestamps, Location Fix & Username Checker",
    entries: [
      "Posts with replies now show 'last reply X ago' so you can see which conversations are still active, not just when they were first posted.",
      "The 'Use my location' button in onboarding no longer goes white on hover.",
      "When changing your display name, you now see instantly whether the name is available or already taken as you type.",
    ],
  },
  {
    version: "3.36.0",
    date: "May 2026",
    title: "New Dashboard, Cleaner Spaces & Better Highlights",
    entries: [
      "Your dashboard now shows everything at a glance — recent posts, live chat rooms, upcoming events, and quick actions — without any mode switching.",
      "New Quick Actions row: create a post, jump into a chat room, or browse the Stall in one tap.",
      "Your dashboard shows how many parents are online right now, updated live.",
      "New My Shortcuts widget: pin your favourite communities, rooms, and pages to the dashboard for quick access.",
      "Activity notifications now take you directly to the relevant post, message, or friend request.",
      "Cards across Spaces and Communities now highlight with a warm terracotta border when you hover over them — consistent across day and night mode.",
      "Removed the 'Discuss events in Spaces' callout from the Events page to reduce clutter.",
      "Removed the duplicate Chat Rooms shortcut from the Spaces page on mobile — it's still accessible from the bottom nav.",
    ],
  },
  {
    version: "3.35.0",
    date: "May 2026",
    title: "Our Little Village — Brand, Privacy & Platform Updates",
    entries: [
"We're now officially Our Little Village — you'll see the updated name across the app, sign-up pages, and footers.",
"Your location is now hidden on your profile by default. You can choose to show your suburb in your profile settings if you'd like.",
"Donation Group pages now show readable area names (e.g. 'Brimbank to Melbourne City, VIC') instead of raw postcode ranges.",
"You can now message the organiser of a Donation Group before you've joined — handy if you have questions first.",
"The For Clinicians page now works correctly for both signed-in and signed-out visitors, with dark mode fixed.",
    ],
  },
  {
    version: "3.34.2",
    date: "May 2026",
    title: "Donation Groups — Edit, Multi-Suburb & Workflow Improvements",
    entries: [
"You can now edit your Donation Group — update the description, accepted items, area coverage, cover photo, end date, and more.",
"Area coverage now supports multiple suburbs — search and add as many areas as you need, each shown as a removable chip.",
"Joining a Donation Group is now free for all users — track groups and donate across multiple drives without needing Village+.",
"'Donate to this group' now takes you directly to create a listing linked to that group. 'Request support' is now 'Contact organiser' and opens a direct message.",
"Organisers can add and remove moderators at any time from the group detail page.",
"Moderators can request to close a group — the organiser will see the request and choose to approve or decline.",
    ],
  },
  {
    version: "3.34.0",
    date: "May 2026",
    title: "Mobile Nav, Donation Groups & Lots of Improvements",
    entries: [
"The bottom navigation bar is back on mobile — tap Home, Spaces, Chats, Messages, or Me directly from the bottom of the screen.",
"The day/night mode toggle now shows both icons with the active mode clearly highlighted, so you always know which mode you're in.",
"Pages like Contact, Terms, and Community Guidelines now keep you inside the app if you're already signed in.",
"Tapping 'Message' on someone's profile now opens a conversation with them directly — no more landing on the messages homepage.",
"The Night Owl banner no longer mentions the 3AM Club specifically.",
"Donation Groups now have a dedicated setup flow: group type, accepted items, items we don't accept, group rules, and open/closed status.",
"Inside a Donation Group, members can now tap 'Donate to this group' or 'Request support' directly.",
"Free item listings now have a clear link to Donation Groups so it's easy to find the right place.",
    ],
  },
  {
    version: "3.33.0",
    date: "May 2026",
    title: "Badges, Email Improvements & Filter Design Polish",
    entries: [
"Badges now update automatically as you use the platform — no need to visit your profile to see newly earned badges.",
"9 new badges to earn: First Post, Conversationalist, Helper, Liked by The Village, 1 Month Member, 1 Year Member, Stall Seller, Village Friend, and the 3AM Club for those late-night parenting sessions.",
"You now receive an email when someone sends an enquiry or follow-up message on one of your Stall listings.",
"Email notifications from the platform are now branded as Our Little Village with a consistent support email address.",
"Submitting a suggestion on the Shape the Village page now sends your feedback directly to the team.",
"Filters and tabs are now visually consistent across every page — active filters are clearer and easier to spot in both day and night mode.",
"Removed the Weekly Digest and 'I want to connect with' options from your profile — these weren't active and have been tidied up to avoid confusion.",
"Email verification is now required before using the platform — you'll be asked to verify your email if you haven't already.",
    ],
  },
  {
    version: "3.32.0",
    date: "May 2026",
    title: "Bigger Chat Bubble & Visual Polish",
    entries: [
"The messages chat bubble in the corner is now larger and easier to tap — bigger icon, badge, and text.",
"The Village+ chat bubble now glows softly when you have unread messages.",
    ],
  },
  {
    version: "3.31.0",
    date: "May 2026",
    title: "Instant Read Sync & The Village Stall on Homepage",
    entries: [
"Reading a message in the chat popout or Messages page now instantly clears the notification from the bell, the dashboard, and everywhere else on the platform — no refresh needed.",
"The messages popout now shows the correct unread count as soon as you log in, instead of only after opening it.",
"The messages popout opens to a consistent readable size instead of adjusting based on how much content is inside.",
"The Village Stall is now featured on the homepage — browse sample listings in the 'See what's happening' section alongside Spaces, Chat Rooms, and Events.",
    ],
  },
  {
    version: "3.30.0",
    date: "May 2026",
    title: "Find Parents, Sent Requests & Smarter Messages",
    entries: [
"A new 'Find Parents' tab on the Friends page lets you search by name or suburb and send friend requests directly from results.",
"You can now see all the friend requests you've sent — with the option to cancel a request, which also removes it from the other person's notifications.",
"The Messages Friends tab now shows all your friends in one view — those you've chatted with show a message preview, and those you haven't can be tapped to start a chat.",
"Messages from before you were friends now appear under Friends rather than Private Messages, keeping everything in the right place.",
"Free users can now reply to existing private message conversations from the chat popout — only starting new chats with non-friends requires Village+.",
    ],
  },
  {
    version: "3.29.0",
    date: "May 2026",
    title: "The Village Stall Improvements & Chat Updates",
    entries: [
"Stall listings now show a description preview on the card — no need to click in to see what the item is.",
"Listing photos can be swiped through directly on the browse page — swipe on mobile or use the arrows on desktop.",
"New 'Pending' status for listings — mark a listing as in negotiation so other buyers know a deal is in progress, while the listing stays visible.",
"Chat rooms now automatically slow down during busy periods so everyone can keep up. A countdown on the send button shows how long to wait.",
"Suburb search in listing forms now uses autocomplete — start typing a suburb and pick from suggestions.",
"Fixed a bug where clicking the Mods button on an event was opening the event detail page instead of the moderators panel.",
    ],
  },
  {
    version: "3.28.0",
    date: "May 2026",
    title: "Stay Signed In, Smarter Chat & Better Navigation",
    entries: [
"You'll stay signed in for up to 30 days — no more being logged out after a week. Your session renews automatically while you're active.",
"Chat Rooms now support slow mode — admins can set a cooldown between messages in busy rooms to keep conversations easier to follow.",
"The chat popout now has inbox filter tabs: All, Friends, Stall, and Events — so you can find the right conversation quickly.",
"All Australia rooms sidebar updated — clearer explanation of what they are and who can join.",
"Going back in your browser now returns you to the same tab you were on in Forums, Chat Rooms, Friends, and The Stall.",
"Age group Spaces now appear youngest to oldest in the By Age Group tab.",
"Message filter pills no longer require scrolling — all five fit on screen.",
    ],
  },
  {
    version: "3.27.0",
    date: "May 2026",
    title: "Updated Age Groups & Consistent Spaces",
    entries: [
"Age group Spaces have been renamed: Preschoolers is now Preschool & Kinder (3–5 years), and School Age is now Primary School (5–12 years).",
"Pregnancy & Expecting now appears in both the By Topic and By Age Group tabs.",
"All Spaces now have consistent, stable identifiers — dev and local environments will stay in sync going forward.",
"Topic and age filter chips updated to match the new Space names.",
    ],
  },
  {
    version: "3.26.0",
    date: "May 2026",
    title: "More Spaces & Chat Rooms",
    entries: [
"Four new Spaces added: Postnatal Recovery, Blended & Co-Parenting, Working Parents, and Baby Gear & Reviews.",
"Four new Chat Rooms added: Playgroup & Activities, Working Parents Chat, Screen Time & Tech, and Pregnancy Chat.",
"All new rooms and spaces are wired into the topic and type filter chips so you can find them straight away.",
    ],
  },
  {
    version: "3.25.0",
    date: "May 2026",
    title: "Better Spaces & Chat Rooms",
    entries: [
"Spaces and Chat Rooms have been renamed and reorganised for clarity — warmer names, cleaner descriptions.",
"Nine new Spaces added: Ask The Village, New Parents, Neurodiverse Families, Childcare & School, Family Budget, Local Recommendations, Village Wins, Preschoolers, and more.",
"Two new Chat Rooms: Ask The Village and Recommendations.",
"Filter pills added to Spaces — browse by topic type (Support, Parenting, Family Life, Local) or age group (Baby, Toddler, School Age).",
"Filter chips added to Chat Rooms — narrow rooms by type (Support, Parenting, Social, Ask & Share).",
"The 3am Club daytime info card is now informational only — no longer appears as a second room tile.",
    ],
  },
  {
    version: "3.24.0",
    date: "May 2026",
    title: "Smarter Message Headers & Deep Links",
    entries: [
"In a private message, tap the person's name or photo to view their profile.",
"If you're messaging someone who isn't a friend yet, an Add Friend button now appears in the chat header.",
"Stall enquiry chats now have a View Listing button — tap it to go straight to the listing.",
"Event chats now have a View Event button — tap it to open the event details.",
    ],
  },
  {
    version: "3.23.0",
    date: "May 2026",
    title: "Event Chats in Your Inbox",
    entries: [
"Event group chats now appear in your Messages inbox under a new Events tab.",
"You'll see every event you've RSVPed to, organised, or chatted in — with the event name, date, and last message shown.",
"Tap an event to open the group chat and chat with everyone attending.",
"A new Events tab sits alongside All, Unread, Friends, and Stall in the inbox filter bar.",
    ],
  },
  {
    version: "3.22.0",
    date: "May 2026",
    title: "Unified Messages Inbox",
    entries: [
"Your Messages page now shows everything in one place — direct messages, friend chats, and Stall enquiries all in a single sorted list.",
"Four tabs at the top let you filter by All, Unread, Friends, or Stall — similar to Facebook Messenger.",
"Each tab shows a red badge when there are unread messages in that category.",
"Stall enquiries appear in your main inbox — no more hunting in the Stall tab to find a conversation.",
    ],
  },
  {
    version: "3.21.0",
    date: "May 2026",
    title: "Message Requests",
    entries: [
"When someone outside your friends list messages you for the first time, it arrives as a message request — not straight into your inbox.",
"You'll see their name and a preview of their message, then choose to Accept or Decline.",
"Accepting opens the conversation as normal. Declining removes the request.",
"If you send a message to someone new, they'll receive it as a request. You'll see a 'Request Pending' indicator in the chat while you wait.",
    ],
  },
  {
    version: "3.20.0",
    date: "May 2026",
    title: "Event Cover Photos",
    entries: [
"You can now add a cover photo when creating an event — it shows as a banner in the event details and as a thumbnail in the event list.",
    ],
  },
  {
    version: "3.19.0",
    date: "May 2026",
    title: "Smarter Replies & Formatting Improvements",
    entries: [
"Replies you post now immediately show Edit and Delete options — no refresh needed.",
"The main reply box at the bottom of a post is now always visible, even when you're replying to a specific comment.",
"Pressing Enter inside a bullet list automatically starts the next bullet. Pressing Enter on an empty bullet exits the list.",
"The Code button has been removed from the formatting toolbar — it was rarely needed and cluttered the bar.",
    ],
  },
  {
    version: "3.18.0",
    date: "May 2026",
    title: "Markdown Formatting, Bug Fixes & Photo Improvements",
    entries: [
"Spaces posts and replies now support markdown formatting — bold, italic, code, quotes, lists, links and more.",
"A formatting toolbar now appears above the post and reply composer — tap Bold, Italic, Quote etc to format selected text.",
"Tapping a photo in Spaces now opens it full-screen in an overlay instead of navigating away.",
"Sending photos in messages is now fixed.",
"Reporting a post is now fixed.",
"The Messages button in the bottom-right corner is larger and easier to tap.",
    ],
  },
  {
    version: "3.17.0",
    date: "May 2026",
    title: "Live Chat Rooms, Faster Platform & Privacy Updates",
    entries: [
"Chat Rooms now shows accurate Live Now rooms — only rooms with a message in the last 45 minutes appear as live.",
"Room cards show a live indicator and 'Drop in' badge when a room is currently active.",
"The dashboard now shows your real online count instead of a placeholder.",
"The platform loads faster overall — pages now load on demand and backend queries run more efficiently.",
"Privacy page updated with accurate information about where your data is stored.",
    ],
  },
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
  Added:"bg-green-500/15 text-green-600 dark:text-green-400",
  Changed:"bg-amber-500/15 text-amber-600 dark:text-amber-400",
  Updated:"bg-amber-500/15 text-amber-600 dark:text-amber-400",
  Improved:"bg-[var(--honey-wash)] text-[var(--honey)]",
  Fixed:"bg-blue-500/15 text-blue-500 dark:text-blue-400",
  Design:"bg-purple-500/15 text-purple-600 dark:text-purple-400",
  Redesign:"bg-purple-500/15 text-purple-600 dark:text-purple-400",
  Removed:"bg-red-500/15 text-red-600 dark:text-red-400",
  Security:"bg-red-500/15 text-red-700 dark:text-red-400",
  Performance:"bg-orange-500/15 text-orange-600 dark:text-orange-400",
  Architecture: "bg-slate-500/15 text-slate-600 dark:text-slate-400",
  Confirmed:"bg-teal-500/15 text-teal-600 dark:text-teal-400",
  Legal:"bg-violet-500/15 text-violet-600 dark:text-violet-400",
  Planned:"bg-muted text-muted-foreground",
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
        <span className={`text-xs font-mono px-2.5 py-1 rounded-lg font-bold tracking-tight ${muted ? "bg-muted text-muted-foreground" : "bg-[var(--honey-wash)] text-[var(--honey)]"}`}>
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
        <span className="text-xs font-mono px-2.5 py-1 rounded-lg font-bold tracking-tight bg-[var(--honey-wash)] text-[var(--honey)]">
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
    <div className="min-h-screen bg-background  lg:pl-60 lg:pb-0">
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
          <div className="w-10 h-10 rounded-xl bg-[var(--honey-wash)] flex items-center justify-center">
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
          <p className="tv-mono">
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
          <p className="tv-mono">Coming Up</p>
          {ROADMAP.map(v => (
            <VersionCard key={v.version} {...v} muted />
          ))}
        </section>

        <AppFooter />
      </main>
    </div>
  );
}
