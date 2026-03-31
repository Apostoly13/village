import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { ScrollArea } from "../components/ui/scroll-area";
import { Badge } from "../components/ui/badge";
import Navigation from "../components/Navigation";
import OnboardingModal from "../components/OnboardingModal";
import { Search, Plus, MessageCircle, Heart, Eye, Clock, Users, MapPin } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

const API_URL = process.env.REACT_APP_BACKEND_URL;

export default function Dashboard({ user }) {
  const [posts, setPosts] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [singleParents, setSingleParents] = useState([]);
  const [nearbyUsers, setNearbyUsers] = useState([]);
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    fetchFeed();
    fetchSingleParents();
    fetchNearbyUsers();
    
    // Show onboarding if user hasn't completed it and doesn't have location set
    if (user && !user.onboarding_complete && !user.state) {
      setShowOnboarding(true);
    }
  }, [user]);

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

  const fetchSingleParents = async () => {
    try {
      const response = await fetch(`${API_URL}/api/users/single-parents`, {
        credentials: "include"
      });
      if (response.ok) {
        const data = await response.json();
        setSingleParents(data);
      }
    } catch (error) {
      console.error("Error fetching single parents:", error);
    }
  };

  const fetchNearbyUsers = async () => {
    try {
      const response = await fetch(`${API_URL}/api/location/nearby-users?distance_km=25&limit=10`, {
        credentials: "include"
      });
      if (response.ok) {
        const data = await response.json();
        setNearbyUsers(data.users || []);
      }
    } catch (error) {
      console.error("Error fetching nearby users:", error);
    }
  };

  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
    // Refresh data
    fetchNearbyUsers();
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
      
      {/* Onboarding Modal */}
      {showOnboarding && (
        <OnboardingModal 
          user={user}
          onComplete={handleOnboardingComplete}
          onSkip={() => setShowOnboarding(false)}
        />
      )}
      
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

        {/* Single Parents Connection Section */}
        {singleParents.length > 0 && (
          <div className="mb-8 p-6 rounded-2xl bg-pink-500/5 border border-pink-500/20">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-pink-500/20 flex items-center justify-center">
                  <Heart className="h-5 w-5 text-pink-500" />
                </div>
                <div>
                  <h3 className="font-heading font-bold text-foreground">Single Parents in The Village</h3>
                  <p className="text-sm text-muted-foreground">Connect with others who understand your journey</p>
                </div>
              </div>
              <Link to="/chat">
                <Button variant="outline" size="sm" className="rounded-full border-pink-500/30 text-pink-600 dark:text-pink-400 hover:bg-pink-500/10">
                  <Users className="h-4 w-4 mr-2" />
                  Join Chat
                </Button>
              </Link>
            </div>
            <div className="flex items-center gap-3 overflow-x-auto pb-2 hide-scrollbar">
              {singleParents.slice(0, 8).map((parent, idx) => (
                <Link 
                  key={parent.user_id} 
                  to={`/profile/${parent.user_id}`}
                  className="flex-shrink-0 flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-pink-500/10 transition-colors"
                  data-testid={`single-parent-${idx}`}
                >
                  <Avatar className="h-14 w-14 ring-2 ring-pink-500/30">
                    <AvatarImage src={parent.picture} />
                    <AvatarFallback className="bg-pink-500/20 text-pink-600">
                      {parent.name?.[0]?.toUpperCase() || '?'}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium text-foreground truncate max-w-[80px]">
                    {parent.nickname || parent.name?.split(' ')[0]}
                  </span>
                </Link>
              ))}
              {singleParents.length > 8 && (
                <Link 
                  to="/chat"
                  className="flex-shrink-0 flex flex-col items-center justify-center gap-2 p-3 rounded-xl hover:bg-pink-500/10 transition-colors"
                >
                  <div className="h-14 w-14 rounded-full bg-pink-500/20 flex items-center justify-center">
                    <span className="text-sm font-bold text-pink-600">+{singleParents.length - 8}</span>
                  </div>
                  <span className="text-sm text-muted-foreground">more</span>
                </Link>
              )}
            </div>
          </div>
        )}

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
                  <article 
                    key={post.post_id} 
                    className="bg-card rounded-2xl p-6 border border-border/50 hover:border-primary/30 transition-all card-hover"
                    data-testid={`post-card-${idx}`}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        {post.author_id !== "anonymous" ? (
                          <Link to={`/profile/${post.author_id}`} onClick={(e) => e.stopPropagation()}>
                            <Avatar className="h-10 w-10 cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all">
                              <AvatarImage src={post.author_picture} />
                              <AvatarFallback className="bg-primary/20 text-primary">
                                {post.author_name?.[0]?.toUpperCase() || '?'}
                              </AvatarFallback>
                            </Avatar>
                          </Link>
                        ) : (
                          <Avatar className="h-10 w-10">
                            <AvatarFallback className="bg-primary/20 text-primary">
                              {post.author_name?.[0]?.toUpperCase() || '?'}
                            </AvatarFallback>
                          </Avatar>
                        )}
                        <div>
                          {post.author_id !== "anonymous" ? (
                            <Link 
                              to={`/profile/${post.author_id}`} 
                              className="hover:underline"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <p className="font-medium text-foreground hover:text-primary transition-colors">{post.author_name}</p>
                            </Link>
                          ) : (
                            <p className="font-medium text-foreground">{post.author_name}</p>
                          )}
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

                    <Link to={`/forums/post/${post.post_id}`}>
                      <h3 className="font-heading font-bold text-lg text-foreground mb-2 hover:text-primary transition-colors">{post.title}</h3>
                      <p className="text-muted-foreground line-clamp-2 mb-4">{post.content}</p>
                    </Link>

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
                ))}
              </div>
            </ScrollArea>
          )}
        </div>
      </main>
    </div>
  );
}
