import { Link } from "react-router-dom";
import Navigation from "../components/Navigation";
import { ArrowLeft, ScrollText } from "lucide-react";
import AppFooter from "../components/AppFooter";

const CHANGELOG = [
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
    <div className="min-h-screen bg-background pb-20 lg:pb-0">
      <Navigation user={user} />

      <main className="max-w-3xl mx-auto px-4 pt-20 lg:pt-24">
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
