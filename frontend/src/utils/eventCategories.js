/**
 * Event category configuration — single source of truth.
 * Import this wherever event categories need to be rendered, filtered, or labelled.
 */

/** Filter tabs shown at the top of the Events page */
export const EVENT_CATEGORIES = [
  { id: "all",       label: "All" },
  { id: "playgroup", label: "Playgroups" },
  { id: "meetup",    label: "Meetups" },
  { id: "workshop",  label: "Workshops" },
  { id: "support",   label: "Support" },
  { id: "general",   label: "General" },
];

/**
 * Inline style objects for each event category badge.
 * Mirrors the DATE_CHIP_STYLES pattern — uses CSS var() tokens, not Tailwind.
 * Keys match the `category` field stored in the database.
 */
export const CATEGORY_STYLES = {
  general:   { background: "var(--paper-3)",    color: "var(--ink-3)" },
  playgroup: { background: "var(--sage-wash)",   color: "var(--sage-deep)" },
  meetup:    { background: "var(--clay-wash)",   color: "var(--clay-deep)" },
  workshop:  { background: "var(--honey-wash)",  color: "var(--honey)" },
  support:   { background: "var(--dusk-wash)",   color: "var(--dusk)" },
};

/**
 * Date chip colors — used for the day/month badge on event cards.
 * Maps each category to inline CSS variable colors from the palette.
 */
export const DATE_CHIP_STYLES = {
  general:   { background: "var(--paper-2)",    color: "var(--ink-2)" },
  playgroup: { background: "var(--sage-wash)",   color: "var(--sage-deep)" },
  meetup:    { background: "var(--clay-wash)",   color: "var(--clay-deep)" },
  workshop:  { background: "var(--honey-wash)",  color: "var(--clay-deep)" },
  support:   { background: "var(--dusk-wash)",   color: "var(--dusk)" },
};

/** Human-readable labels for each category id */
export const CATEGORY_LABELS = {
  general:   "General",
  playgroup: "Playgroup",
  meetup:    "Meetup",
  workshop:  "Workshop",
  support:   "Support",
};

/**
 * Get the badge style object for a given category id.
 * Falls back to the "general" style if the id is unknown.
 *
 * @param {string} categoryId
 * @returns {{ background: string, color: string }} inline style object
 */
export function getCategoryStyle(categoryId) {
  return CATEGORY_STYLES[categoryId] ?? CATEGORY_STYLES.general;
}

/**
 * Get the human-readable label for a given category id.
 *
 * @param {string} categoryId
 * @returns {string}
 */
export function getCategoryLabel(categoryId) {
  return CATEGORY_LABELS[categoryId] ?? categoryId;
}

/**
 * Get the date chip inline style for a given category id.
 * Falls back to the "general" style if the id is unknown.
 *
 * @param {string} categoryId
 * @returns {{ background: string, color: string }}
 */
export function getDateChipStyle(categoryId) {
  return DATE_CHIP_STYLES[categoryId] ?? DATE_CHIP_STYLES.general;
}
