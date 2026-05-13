/**
 * CrisisSupportBanner — shared crisis support callout.
 * Extracted from ForumCategory.jsx and ForumPost.jsx.
 *
 * Props:
 *   onDismiss — callback fired when the × button is clicked
 */
import { LifeBuoy, X } from "lucide-react";

export function CrisisSupportBanner({ onDismiss }) {
  return (
    <div
      className="mb-5 rounded-2xl p-4 flex items-start gap-3"
      style={{ background: "var(--dusk-wash)", border: "1px solid var(--dusk)" }}
    >
      <LifeBuoy
        size={18}
        style={{ color: "var(--dusk)", flexShrink: 0, marginTop: 1 }}
      />

      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold mb-1" style={{ color: "var(--ink)" }}>
          Support is available — you're not alone
        </p>
        <p className="text-xs leading-relaxed mb-3" style={{ color: "var(--ink-3)" }}>
          If you're in crisis or need to talk to someone right now, these free
          services are available 24/7:
        </p>
        <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs">
          <a
            href="tel:1300726306"
            className="font-semibold hover:underline"
            style={{ color: "var(--dusk)" }}
          >
            PANDA — 1300 726 306
          </a>
          <a
            href="tel:131114"
            className="font-semibold hover:underline"
            style={{ color: "var(--dusk)" }}
          >
            Lifeline — 13 11 14
          </a>
          <a
            href="tel:1300224636"
            className="font-semibold hover:underline"
            style={{ color: "var(--dusk)" }}
          >
            Beyond Blue — 1300 22 4636
          </a>
        </div>
      </div>

      <button
        onClick={onDismiss}
        className="shrink-0 p-0.5 rounded transition-colors hover:bg-black/5"
        style={{ color: "var(--ink-3)" }}
        aria-label="Dismiss crisis support banner"
      >
        <X size={16} />
      </button>
    </div>
  );
}

export default CrisisSupportBanner;
