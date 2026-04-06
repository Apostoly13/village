import { Link } from "react-router-dom";
import { MessageCircle, Users } from "lucide-react";

/**
 * CirclesTileGrid — large emoji tile grid for Support Space categories
 * Used on the Support Spaces page and the Dashboard.
 *
 * Props:
 *   categories  — array of category objects from /api/forums/categories
 *   compact     — if true, renders a smaller 2-column version for sidebars
 */
export default function CirclesTileGrid({ categories = [], compact = false }) {
  if (categories.length === 0) return null;

  return (
    <div className={`grid gap-3 ${compact ? "grid-cols-2" : "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4"}`}>
      {categories.map((cat) => (
        <Link
          key={cat.category_id}
          to={`/forums/${cat.category_id}`}
          className="group block"
        >
          <div className={`bg-card rounded-2xl border border-border/50 hover:border-primary/40 transition-all card-hover flex flex-col items-center text-center ${compact ? "p-3 gap-1.5" : "p-5 gap-2"}`}>
            <span className={compact ? "text-2xl" : "text-3xl mb-1"}>{cat.icon}</span>
            <p className={`font-heading font-semibold text-foreground leading-tight ${compact ? "text-xs" : "text-sm"}`}>
              {cat.name}
            </p>
            {!compact && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                <span className="flex items-center gap-0.5">
                  <MessageCircle className="h-3 w-3" />
                  {cat.post_count || 0}
                </span>
                {cat.active_users > 0 && (
                  <span className="flex items-center gap-0.5 text-green-600 dark:text-green-400">
                    <Users className="h-3 w-3" />
                    {cat.active_users}
                  </span>
                )}
              </div>
            )}
          </div>
        </Link>
      ))}
    </div>
  );
}
