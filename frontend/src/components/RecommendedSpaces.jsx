import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { MessageCircle, ChevronRight } from "lucide-react";

const API_URL = process.env.REACT_APP_BACKEND_URL;

/**
 * RecommendedSpaces — shows 3 personalised circle recommendations
 * based on parenting_stage + interests from /api/users/recommended-circles
 */
export default function RecommendedSpaces({ user }) {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRecommendations();
  }, []);

  const fetchRecommendations = async () => {
    try {
      const res = await fetch(`${API_URL}/api/users/recommended-circles`, {
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        setRecommendations(data);
      }
    } catch (error) {
      console.error("Error fetching recommendations:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-card rounded-xl p-3 border border-border/50 animate-pulse flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-muted shrink-0" />
            <div className="flex-1 space-y-1">
              <div className="w-3/4 h-3 bg-muted rounded" />
              <div className="w-1/2 h-3 bg-muted rounded" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (recommendations.length === 0) return null;

  return (
    <div className="space-y-2">
      {recommendations.map((circle) => (
        <Link
          key={circle.category_id}
          to={`/forums/${circle.category_id}`}
          className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border/50 hover:border-primary/30 transition-all group"
        >
          <span className="text-xl shrink-0">{circle.icon}</span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">{circle.name}</p>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <MessageCircle className="h-3 w-3" />
              {circle.post_count || 0} posts
            </p>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
        </Link>
      ))}
    </div>
  );
}
