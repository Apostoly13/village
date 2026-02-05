import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { ScrollArea } from "../components/ui/scroll-area";
import Navigation from "../components/Navigation";
import { Search, Plus, MessageCircle, Heart, Eye, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

const API_URL = process.env.REACT_APP_BACKEND_URL;

export default function Dashboard({ user }) {
  const [posts, setPosts] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFeed();
  }, []);

  const fetchFeed = async () => {
    try {
      const response = await fetch(`${API_URL}/api/feed`, {
        credentials: "include"
      });
      if (response.ok) {
        const data = await response.json();
        setPosts(data);
      }
    } catch (error) {
      console.error("Error fetching feed:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      fetchFeed();
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/search?q=${encodeURIComponent(searchQuery)}`, {
        credentials: "include"
      });
      if (response.ok) {
        const data = await response.json();
        setPosts(data);
      }
    } catch (error) {
      console.error("Error searching:", error);
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
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-heading text-2xl sm:text-3xl font-bold text-foreground mb-2">
            Welcome back, {user?.nickname || user?.name?.split(' ')[0] || 'Parent'} 👋
          </h1>
          <p className="text-muted-foreground">See what's happening in your community</p>
        </div>

        {/* Search & Create */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <form onSubmit={handleSearch} className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search posts..."
              className="pl-12 h-12 rounded-xl bg-card border-border/50 focus:border-primary"
              data-testid="search-input"
            />
          </form>
          <Link to="/create-post">
            <Button className="h-12 px-6 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_0_15px_rgba(245,197,66,0.3)] whitespace-nowrap" data-testid="create-post-btn">
              <Plus className="h-5 w-5 mr-2" />
              New Post
            </Button>
          </Link>
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          {[
            { icon: "🌙", label: "3am Club", href: "/chat", testId: "quick-chat-link" },
            { icon: "💬", label: "Forums", href: "/forums", testId: "quick-forums-link" },
            { icon: "✉️", label: "Messages", href: "/messages", testId: "quick-messages-link" },
            { icon: "👤", label: "Profile", href: "/profile", testId: "quick-profile-link" }
          ].map((item, idx) => (
            <Link 
              key={idx} 
              to={item.href}
              className="flex items-center gap-3 p-4 rounded-xl bg-card border border-border/50 hover:border-primary/30 transition-colors"
              data-testid={item.testId}
            >
              <span className="text-2xl">{item.icon}</span>
              <span className="font-medium text-foreground">{item.label}</span>
            </Link>
          ))}
        </div>

        {/* Feed */}
        <div className="space-y-4">
          <h2 className="font-heading text-xl font-bold text-foreground">Recent Posts</h2>
          
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-card rounded-2xl p-6 border border-border/50 animate-pulse">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-muted"></div>
                    <div className="space-y-2">
                      <div className="w-32 h-4 bg-muted rounded"></div>
                      <div className="w-20 h-3 bg-muted rounded"></div>
                    </div>
                  </div>
                  <div className="w-3/4 h-5 bg-muted rounded mb-3"></div>
                  <div className="w-full h-4 bg-muted rounded"></div>
                </div>
              ))}
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-12 bg-card rounded-2xl border border-border/50">
              <span className="text-5xl mb-4 block">📝</span>
              <h3 className="font-heading text-xl font-bold text-foreground mb-2">No posts yet</h3>
              <p className="text-muted-foreground mb-4">Be the first to share something!</p>
              <Link to="/create-post">
                <Button className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full" data-testid="empty-create-post-btn">
                  Create First Post
                </Button>
              </Link>
            </div>
          ) : (
            <ScrollArea className="h-[calc(100vh-400px)]">
              <div className="space-y-4 pr-4">
                {posts.map((post, idx) => (
                  <Link 
                    key={post.post_id} 
                    to={`/forums/post/${post.post_id}`}
                    className="block"
                    data-testid={`post-card-${idx}`}
                  >
                    <article className="bg-card rounded-2xl p-6 border border-border/50 hover:border-primary/30 transition-all card-hover">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={post.author_picture} />
                            <AvatarFallback className="bg-primary/20 text-primary">
                              {post.author_name?.[0]?.toUpperCase() || '?'}
                            </AvatarFallback>
                          </Avatar>
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
                        {post.is_anonymous && (
                          <span className="text-xs px-2 py-1 rounded-full bg-secondary text-muted-foreground">
                            Anonymous
                          </span>
                        )}
                      </div>

                      <h3 className="font-heading font-bold text-lg text-foreground mb-2">{post.title}</h3>
                      <p className="text-muted-foreground line-clamp-2 mb-4">{post.content}</p>

                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Heart className="h-4 w-4" />
                          <span>{post.like_count || 0}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <MessageCircle className="h-4 w-4" />
                          <span>{post.reply_count || 0}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Eye className="h-4 w-4" />
                          <span>{post.views || 0}</span>
                        </div>
                      </div>
                    </article>
                  </Link>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>
      </main>
    </div>
  );
}
