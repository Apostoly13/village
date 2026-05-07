/**
 * Safely extracts a human-readable error string from a FastAPI / Pydantic v2
 * response body. Pydantic v2 returns `detail` as an array of objects:
 *   [{ type, loc, msg, input, url }, ...]
 * This helper converts that to a plain string so it can be passed to
 * toast.error() without causing "Objects are not valid as a React child".
 *
 * @param {any}    detail   – the `detail` field from the parsed JSON response
 * @param {string} fallback – message to use if detail is empty / unrecognised
 * @returns {string}
 */
export function parseApiError(detail, fallback = "Something went wrong") {
  if (!detail) return fallback;
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) {
    const msgs = detail
      .map((e) => (typeof e === "object" && e !== null ? e.msg : String(e)))
      .filter(Boolean);
    return msgs.length ? msgs.join(". ") : fallback;
  }
  return fallback;
}
