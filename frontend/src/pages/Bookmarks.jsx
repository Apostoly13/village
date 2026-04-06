import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import Navigation from "../components/Navigation";
import { Bookmark, ArrowLeft, Heart, MessageCircle, Eye, Clock, Trash2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

const API_URL = process.env.REACT_APP_BACKEND_URL;

export default function Bookmarks({ user }) {
  const [bookmarks, setBookmarks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBookmarks();
  }, []);

  const fetchBookmarks = async () => {
    try {
      const response = await fetch(`${API_URL}/api/bookmarks`, { credentials: "include" });
      if (response.ok) {
        setBookmarks(await response.json());
      }
    } catch (error) {
      console.error("Error fetching bookmarks:", error);
    } finally {
      setLoading(false);
    }
  };

  const removeBookmark = async (postId) => {
    try {
      const response = await fetch(`${API_URL}/api/forums/posts/${postId}/bookmark`, {
        method: "POST",
        credentials: "include"
      });
      if (response.ok) {
        setBookmarks(prev => prev.filter(b => b.post_id !== postId));
        toast.success("Bookmark removed");
      }
    } catch (error) {
      toast.error("Failed to remove bookmark");
    }
  };

  const formatDate = (dateString) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch {
      return "recently";
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20 lg:pb-0">
      <Navigation user={user} />
      
      <main className="max-w-4xl mx-auto px-4 pt-20 lg:pt-24">
        <Link to="/forums" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors">
          <ArrowLeft className="h-4 w-4" />
          Back to Forums
        </Link>

        <div className="mb-8">
          <h1 className="font-heading text-2xl sm:text-3xl font-bold text-foreground mb-1">Saved posts</h1>
          <p className="text-sm text-muted-foreground">Posts you've bookmarked for later</p>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-card rounded-2xl p-6 border border-border/50 animate-pulse">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-muted"></div>
                  <div className="space-y-2">
                    <div className="w-32 h-4 bg-muted rounded"></div>
                    <div className="w-20 h-3 bg-muted rounded"></div>
                  </div>
                </div>
                <div className="w-3/4 h-5 bg-muted rounded mb-2"></div>
                <div className="w-full h-4 bg-muted rounded"></div>
              </div>
            ))}
          </div>
        ) : bookmarks.length === 0 ? (
          <div className="text-center py-12 bg-card rounded-2xl border border-border/50">
            <span className="text-4xl mb-3 block">🔖</span>
            <h3 className="font-heading font-semibold text-foreground mb-1">Nothing saved yet</h3>
            <p className="text-sm text-muted-foreground mb-4">Tap the bookmark icon on any post to save it here.</p>
            <Link to="/forums">
              <Button className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90">
                Browse forums
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {bookmarks.map((post, idx) => (
              <article 
                key={post.post_id}
                className="bg-card rounded-2xl p-6 border border-border/50 hover:border-primary/30 transition-all"
                data-testid={`bookmark-${idx}`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    {post.author_id !== "anonymous" ? (
                      <Link to={`/profile/${post.author_id}`}>
                        <Avatar className="h-10 w-10 cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all">
                          <AvatarImage src={post.author_picture} />
                          <AvatarFallback className="bg-primary/20 text-primary">
                            {post.author_name?.[0]?.toUpperCase() || '?'}
                          </AvatarFallback>
                        </Avatar>
                      </Link>
                    ) : (
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-primary/20 text-primary">?</AvatarFallback>
                      </Avatar>
                    )}
                    <div>
                      <p className="font-medium text-foreground">{post.author_name}</p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>{post.category_icon}</span>
                        <span>{post.category_name}</span>
                        <span>•</span>
                        <Clock className="h-3 w-3" />
                        <span>{formatDate(post.created_at)}</span>
                      </div>
                    </div>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => removeBookmark(post.post_id)}
                    className="text-muted-foreground hover:text-destructive rounded-full"
                    data-testid={`remove-bookmark-${idx}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                <Link to={`/forums/post/${post.post_id}`}>
                  <h3 className="font-heading font-bold text-lg text-foreground mb-2 hover:text-primary transition-colors">{post.title}</h3>
                  <p className="text-muted-foreground line-clamp-2 mb-4">{post.content}</p>
                </Link>

                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Heart className="h-3.5 w-3.5" />
                    {post.like_count || 0}
                  </span>
                  <span className="flex items-center gap-1">
                    <MessageCircle className="h-3.5 w-3.5" />
                    {post.reply_count || 0}
                  </span>
                  <span className="flex items-center gap-1">
                    <Eye className="h-3.5 w-3.5" />
                    {post.views || 0}
                  </span>
                  <span className="ml-auto">Saved {formatDate(post.bookmarked_at)}</span>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
