/**
 * Community post type configuration — single source of truth.
 * Import this wherever post types need to be rendered, filtered, or labelled.
 *
 * Fields:
 *   id               — value stored in the database (post_type field)
 *   label            — display name
 *   Icon             — Lucide React component (replaces emoji `icon` field)
 *   placeholder      — textarea placeholder inside the create form
 *   titlePlaceholder — title input placeholder
 *   activeCls        — inline style object for selected type pill in create form
 *   badgeCls         — inline style object for type badge on a rendered post card
 *   description      — short description shown in sidebar "Post types" guide
 */
import { MessageSquare, Pencil, HelpCircle, Sparkles, MapPin, BarChart2 } from "lucide-react";

const POST_TYPES = [
  {
    id: "discussion",
    label: "Discussion",
    Icon: MessageSquare,
    placeholder: "What's on your mind?",
    titlePlaceholder: "Give your post a title (optional)",
    activeCls: { background: "var(--dusk-wash)", color: "var(--dusk)", borderColor: "var(--dusk)" },
    badgeCls:  { background: "var(--dusk-wash)", color: "var(--dusk)" },
    description: "Share thoughts, stories & updates",
  },
  {
    id: "general",
    label: "General",
    Icon: Pencil,
    placeholder: "Share anything with the community...",
    titlePlaceholder: "Title (optional)",
    activeCls: { background: "var(--paper-3)", color: "var(--ink-2)", borderColor: "var(--line-2)" },
    badgeCls:  { background: "var(--paper-3)", color: "var(--ink-3)" },
    description: "Anything goes — no label needed",
  },
  {
    id: "question",
    label: "Question",
    Icon: HelpCircle,
    placeholder: "Describe your question in detail...",
    titlePlaceholder: "What's your question?",
    activeCls: { background: "var(--sage-wash)", color: "var(--sage-deep)", borderColor: "var(--sage)" },
    badgeCls:  { background: "var(--sage-wash)", color: "var(--sage-deep)" },
    description: "Ask the community anything",
  },
  {
    id: "milestone",
    label: "Milestone",
    Icon: Sparkles,
    placeholder: "Share your milestone! What are you celebrating?",
    titlePlaceholder: "Name your milestone",
    activeCls: { background: "var(--honey-wash)", color: "var(--honey)", borderColor: "var(--honey)" },
    badgeCls:  { background: "var(--honey-wash)", color: "var(--honey)" },
    description: "Celebrate a parenting moment",
  },
  {
    id: "meetup",
    label: "Meetup",
    Icon: MapPin,
    placeholder: "Tell people about this meetup — what's happening?",
    titlePlaceholder: "Meetup title",
    activeCls: { background: "var(--clay-wash)", color: "var(--clay-deep)", borderColor: "var(--clay)" },
    badgeCls:  { background: "var(--clay-wash)", color: "var(--clay-deep)" },
    description: "Organise a local get-together",
  },
  {
    id: "poll",
    label: "Poll",
    Icon: BarChart2,
    placeholder: "Optional context for your poll...",
    titlePlaceholder: "What are you asking? (optional)",
    activeCls: { background: "var(--dusk-wash)", color: "var(--dusk)", borderColor: "var(--dusk)" },
    badgeCls:  { background: "var(--dusk-wash)", color: "var(--dusk)" },
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
