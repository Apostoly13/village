/**
 * Community post type configuration — single source of truth.
 * Import this wherever post types need to be rendered, filtered, or labelled.
 *
 * Fields:
 *   id          — value stored in the database (post_type field)
 *   label       — display name
 *   icon        — emoji shown in pills, badges and cards
 *   placeholder — textarea placeholder inside the create form
 *   titlePlaceholder — title input placeholder
 *   activeCls   — Tailwind classes applied to the selected type pill in the create form
 *   badgeCls    — Tailwind classes applied to the type badge on a rendered post card
 *   description — short description shown in the sidebar "Post types" guide
 */
const POST_TYPES = [
  {
    id: "discussion",
    label: "Discussion",
    icon: "💬",
    placeholder: "What's on your mind?",
    titlePlaceholder: "Give your post a title (optional)",
    activeCls: "bg-blue-500/10 text-blue-600 border-blue-300 dark:border-blue-700",
    badgeCls:  "bg-blue-500/10 text-blue-600 border-blue-200 dark:border-blue-800",
    description: "Share thoughts, stories & updates",
  },
  {
    id: "general",
    label: "General",
    icon: "💭",
    placeholder: "Share anything with the community...",
    titlePlaceholder: "Title (optional)",
    activeCls: "bg-slate-500/10 text-slate-600 border-slate-300 dark:border-slate-700",
    badgeCls:  "bg-slate-500/10 text-slate-600 border-slate-200 dark:border-slate-800",
    description: "Anything goes — no label needed",
  },
  {
    id: "question",
    label: "Question",
    icon: "❓",
    placeholder: "Describe your question in detail...",
    titlePlaceholder: "What's your question?",
    activeCls: "bg-green-500/10 text-green-600 border-green-300 dark:border-green-700",
    badgeCls:  "bg-green-500/10 text-green-600 border-green-200 dark:border-green-800",
    description: "Ask the community anything",
  },
  {
    id: "milestone",
    label: "Milestone",
    icon: "🌟",
    placeholder: "Share your milestone! What are you celebrating? ✨",
    titlePlaceholder: "Name your milestone",
    activeCls: "bg-amber-500/10 text-amber-600 border-amber-300 dark:border-amber-700",
    badgeCls:  "bg-amber-500/10 text-amber-600 border-amber-200 dark:border-amber-800",
    description: "Celebrate a parenting moment ✨",
  },
  {
    id: "meetup",
    label: "Meetup",
    icon: "📍",
    placeholder: "Tell people about this meetup — what's happening?",
    titlePlaceholder: "Meetup title",
    activeCls: "bg-rose-500/10 text-rose-600 border-rose-300 dark:border-rose-700",
    badgeCls:  "bg-rose-500/10 text-rose-600 border-rose-200 dark:border-rose-800",
    description: "Organise a local get-together 📍",
  },
  {
    id: "poll",
    label: "Poll",
    icon: "📊",
    placeholder: "Optional context for your poll...",
    titlePlaceholder: "What are you asking? (optional)",
    activeCls: "bg-purple-500/10 text-purple-600 border-purple-300 dark:border-purple-700",
    badgeCls:  "bg-purple-500/10 text-purple-600 border-purple-200 dark:border-purple-800",
    description: "Get everyone's opinion with a vote",
  },
];

/**
 * Look up a single post type config by id.
 * Falls back to the first entry (discussion) if the id is unknown.
 *
 * @param {string} id
 * @returns {Object} post type config
 */
export function getPostTypeConfig(id) {
  return POST_TYPES.find((t) => t.id === id) ?? POST_TYPES[0];
}

export default POST_TYPES;
