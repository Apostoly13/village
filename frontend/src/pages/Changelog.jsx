import { Link } from "react-router-dom";
import Navigation from "../components/Navigation";
import { ArrowLeft, ScrollText } from "lucide-react";

const CHANGELOG = [
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
    version: "v2.3",
    title: "Buy & Swap Marketplace",
    entries: [
      { tag: "Planned", text: "List baby gear, clothing, and equipment for sale or swap — browse-only for free members, listing for premium" },
      { tag: "Planned", text: "Contact sellers via private DM — no in-platform payments, just genuine community connections" },
      { tag: "Planned", text: "Category filters: clothing, gear, toys, feeding, nursery & more" },
    ],
  },
  {
    version: "v2.4",
    title: "Dark / Light Mode & Settings",
    entries: [
      { tag: "Planned", text: "Dark/light mode toggle — the tokens are ready, the switch is coming" },
      { tag: "Planned", text: "Notification preferences — control exactly what you hear about and when" },
    ],
  },
  {
    version: "Future",
    title: "On the Horizon",
    entries: [
      { tag: "Planned", text: "Native iOS & Android apps" },
      { tag: "Planned", text: "Blog bookmarking — save articles to your Saved Resources hub" },
      { tag: "Planned", text: "Event photos — share photos from meetups you attended" },
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
    <div className={`bg-card rounded-2xl border p-6 ${muted ? "border-border/30 opacity-80" : "border-border/50"}`}>
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <span className={`text-xs font-mono px-2.5 py-1 rounded-full font-semibold ${muted ? "bg-muted text-muted-foreground" : "bg-primary/15 text-primary"}`}>
          v{version}
        </span>
        {date && <span className="text-xs text-muted-foreground">{date}</span>}
        <h3 className="font-heading font-semibold text-foreground">{title}</h3>
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
          <h2 className="font-heading text-lg font-semibold text-foreground">Release History</h2>
          {CHANGELOG.map((v) => (
            <VersionCard key={v.version} {...v} />
          ))}
        </section>

        {/* Roadmap */}
        <section className="space-y-4">
          <h2 className="font-heading text-lg font-semibold text-foreground">Coming Up</h2>
          {ROADMAP.map((v) => (
            <VersionCard key={v.version} {...v} muted />
          ))}
        </section>
      </main>
    </div>
  );
}
