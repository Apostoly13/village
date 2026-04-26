import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";

import { getSpaceName } from "../config/spaces";

const API_URL = process.env.REACT_APP_BACKEND_URL;

// Returns a warm, contextual subtitle for a support space
function getSpaceContext(name = "", postCount = 0) {
  const n = name.toLowerCase();
  if (n.includes("sleep") || n.includes("settling"))       return "Tips from parents who've been there";
  if (n.includes("feed") || n.includes("breast") || n.includes("bottle")) return "Real experiences, real advice";
  if (n.includes("mental") || n.includes("wellbeing") || n.includes("anxiet")) return "A safe space to talk";
  if (n.includes("toddler") || n.includes("activit"))      return "Ideas for busy little ones";
  if (n.includes("school") || n.includes("teen"))          return "School-age parenting support";
  if (n.includes("single"))                                return "You're not doing this alone";
  if (n.includes("dad"))                                   return "For the dads holding it together";
  if (n.includes("mum") || n.includes("mom"))              return "For mums who need their people";
  if (n.includes("3am") || n.includes("night") || n.includes("owl")) return "Always open, always there";
  if (n.includes("multiple") || n.includes("twin"))        return "For families with multiples";
  if (n.includes("local") || n.includes("suburb"))         return "Parents in your area";
  if (n.includes("development") || n.includes("milestone")) return "Watch them grow together";
  if (n.includes("recipe") || n.includes("nutrition"))     return "Food ideas for the whole family";
  if (postCount > 80) return "Very active right now";
  if (postCount > 30) return "Lots of conversations happening";
  return "Join the conversation";
}

export default function RecommendedSpaces({ user }) {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRecommendations();
  }, []);

  const fetchRecommendations = async () => {
    try {
      const res = await fetch(`${API_URL}/api/users/recommended-spaces`, { credentials: "include" });
      if (res.ok) setRecommendations(await res.json());
    } catch {}
    finally { setLoading(false); }
  };

  if (loading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map(i => (
          <div key={i} className="rounded-xl p-2.5 animate-pulse flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-muted shrink-0" />
            <div className="flex-1 space-y-1.5">
              <div className="w-3/4 h-3 bg-muted rounded" />
              <div className="w-1/2 h-2.5 bg-muted rounded" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (recommendations.length === 0) return null;

  return (
    <div className="space-y-1">
      {recommendations.map(item => {
        const displayName = getSpaceName(item.name);
        const context     = getSpaceContext(item.name, item.post_count);
        return (
          <Link
            key={item.category_id}
            to={`/forums/${item.category_id}`}
            className="flex items-center gap-3 px-2 py-2.5 rounded-xl hover:bg-secondary/50 transition-colors group"
          >
            <span className="text-xl shrink-0 leading-none">{item.icon}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">
                {displayName}
              </p>
              <p className="text-xs text-muted-foreground leading-snug mt-0.5">{context}</p>
            </div>
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/50 group-hover:text-primary transition-colors shrink-0" />
          </Link>
        );
      })}
    </div>
  );
}
