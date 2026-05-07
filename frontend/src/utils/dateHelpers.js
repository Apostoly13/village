/**
 * Date / time formatting utilities — single source of truth.
 *
 * All helpers are null-safe and return a sensible fallback on bad input.
 * Import from here instead of calling date-fns or writing inline wrappers.
 */

import { formatDistanceToNow } from "date-fns";

/**
 * Compact relative time — "just now", "3m ago", "2h ago", "5d ago", "12 Apr".
 * Used on community posts, replies, notifications.
 *
 * @param {string|Date} dateStr
 * @returns {string}
 */
export function timeAgo(dateStr) {
  if (!dateStr) return "";
  try {
    const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
    if (diff < 60) return "just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
    return new Date(dateStr).toLocaleDateString("en-AU", { day: "numeric", month: "short" });
  } catch {
    return "";
  }
}

/**
 * Verbose relative time — "about 2 hours ago", "3 days ago".
 * Wraps date-fns formatDistanceToNow. Used in forums, bookmarks, blog.
 *
 * @param {string|Date} dateStr
 * @returns {string}
 */
export function timeAgoVerbose(dateStr) {
  if (!dateStr) return "";
  try {
    return formatDistanceToNow(new Date(dateStr), { addSuffix: true });
  } catch {
    return "";
  }
}

/**
 * Short time string for chat messages — "3:42 PM".
 * Used in Messages, ChatRoom, ChatPopout.
 *
 * @param {string|Date} dateStr
 * @returns {string}
 */
export function formatTime(dateStr) {
  if (!dateStr) return "";
  try {
    return new Date(dateStr).toLocaleTimeString("en-AU", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  } catch {
    return "";
  }
}

/**
 * General date — "21 Apr 2026".
 * Used in blog posts, saved resources, profile.
 *
 * @param {string|Date} dateStr
 * @returns {string}
 */
export function formatDate(dateStr) {
  if (!dateStr) return "";
  try {
    return new Date(dateStr).toLocaleDateString("en-AU", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

/**
 * Full date for event cards — returns { day, month, full }.
 *   day   — "21"
 *   month — "Apr"
 *   full  — "Tuesday, 21 April 2026"
 *
 * Accepts either a YYYY-MM-DD date string or a full ISO timestamp.
 *
 * @param {string} dateStr
 * @returns {{ day: string|number, month: string, full: string }}
 */
export function formatEventDate(dateStr) {
  if (!dateStr) return { day: "?", month: "???", full: "" };
  try {
    // If it's a plain date (YYYY-MM-DD) parse without timezone shift
    const isPlainDate = /^\d{4}-\d{2}-\d{2}$/.test(dateStr);
    const d = isPlainDate
      ? (() => { const [y, m, day] = dateStr.split("-").map(Number); return new Date(y, m - 1, day); })()
      : new Date(dateStr);
    return {
      day: d.getDate(),
      month: d.toLocaleString("en-AU", { month: "short" }),
      full: d.toLocaleDateString("en-AU", { weekday: "long", day: "numeric", month: "long", year: "numeric" }),
    };
  } catch {
    return { day: "?", month: "???", full: dateStr };
  }
}

/**
 * Full datetime for meetup posts — "Thu, 10 Apr 2026 at 2:30 PM".
 *
 * @param {string|Date} dateStr
 * @returns {string}
 */
export function formatMeetupDate(dateStr) {
  if (!dateStr) return "";
  try {
    return new Date(dateStr).toLocaleDateString("en-AU", {
      weekday: "short",
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  } catch {
    return dateStr;
  }
}
