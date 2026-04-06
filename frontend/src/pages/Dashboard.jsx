import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import Navigation from "../components/Navigation";
import OnboardingModal from "../components/OnboardingModal";
import { Search, Plus, MessageCircle, Heart, Eye, Users, MapPin, Crown, TrendingUp, Calendar, Bookmark } from "lucide-react";
import RecommendedSpaces from "../components/RecommendedSpaces";
import { formatDistanceToNow } from "date-fns";

const API_URL = process.env.REACT_APP_BACKEND_URL;

export default function Dashboard({ user }) {
  const [posts, setPosts] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [nearbyEvents, setNearbyEvents] = useState([]);
  const [nearbyCircles, setNearbyCircles] = useState([]);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [todaysPosts, setTodaysPosts] = useState([]);

  useEffect(() => {
    fetchFeed();
    fetchNearbyEvents();
    fetchNearbyCircles();
    fetchTodaysPosts();

    if (user && !user.onboarding_complete && !sessionStorage.getItem("onboarding_dismissed")) {
      setShowOnboarding(true);
    }
  }, [user]);

  const fetchFeed = async () => {
    try {
      const response = await fetch(`${API_URL}/api/feed`, { credentials: "include" });
      if (response.ok) setPosts(await response.json());
    } catch (error) {
      console.error("Error fetching feed:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTodaysPosts = async () => {
    try {
      const response = await fetch(`${API_URL}/api/forums/posts/trending?limit=4`, { credentials: "include" });
      if (response.ok) setTodaysPosts(await response.json());
    } catch {}
  };

  const fetchNearbyEvents = async () => {
    try {
      const response = await fetch(`${API_URL}/api/events?distance_km=25&limit=3`, { credentials: "include" });
      if (response.ok) setNearbyEvents(await response.json());
    } catch {}
  };

  const fetchNearbyCircles = async () => {
    try {
      const response = await fetch(`${API_URL}/api/chat/rooms/nearby?distance_km=25`, { credentials: "include" });
      if (response.ok) {
        const data = await response.json();
        setNearbyCircles((data.rooms || []).slice(0, 3));
      }
    } catch {}
  };

  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
    sessionStorage.setItem("onboarding_dismissed", "true");
    const stored = localStorage.getItem("user");
    if (stored) {
      const updated = { ...JSON.parse(stored), onboarding_complete: true };
      localStorage.setItem("user", JSON.stringify(updated));
    }
    fetchNearbyUsers();
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) { fetchFeed(); return; }
    try {
      const response = await fetch(`${API_URL}/api/search?q=${encodeURIComponent(searchQuery)}`, { credentials: "include" });
      if (response.ok) setPosts(await response.json());
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

  const firstName = user?.nickname || user?.name?.split(" ")[0] || "there";

  return (
    <div className="min-h-screen bg-background pb-20 lg:pb-8">
      <Navigation user={user} />

      {showOnboarding && (
        <OnboardingModal
          user={user}
          onComplete={handleOnboardingComplete}
          onSkip={handleOnboardingComplete}
        />
      )}

      <main className="max-w-6xl mx-auto px-4 pt-20 lg:pt-24">
        {/* Header */}
        <div className="mb-6">
          <h1 className="font-heading text-2xl sm:text-3xl font-bold text-foreground mb-1">
            Welcome back, {firstName} 👋
          </h1>
          <p className="text-muted-foreground text-sm">
            See what's happening in your village
          </p>
        </div>

        {/* Search & Create */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <form onSubmit={handleSearch} className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search posts..."
              className="pl-11 h-11 rounded-xl bg-card border-border/50 focus:border-primary"
              data-testid="search-input"
            />
          </form>
          <Link to="/create-post">
            <Button
              className="h-11 px-6 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 whitespace-nowrap"
              data-testid="create-post-btn"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Post
            </Button>
          </Link>
        </div>

        {/* Three-column layout (desktop) */}
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left column — identity + quick links + recommended */}
          <div className="lg:w-64 xl:w-72 shrink-0 space-y-4">
            {/* Identity card */}
            {user && (
              <Link to="/profile" className="block group">
                <div className="bg-card rounded-2xl p-4 border border-border/50 group-hover:border-primary/30 transition-all">
                  {/* Avatar + name + badge */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-sm font-bold text-primary overflow-hidden shrink-0">
                        {user.picture ? (
                          <img src={user.picture} alt="" className="w-full h-full object-cover rounded-full" />
                        ) : (
                          (user.nickname || user.name)?.[0]?.toUpperCase()
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-foreground text-sm truncate">{user.nickname || user.name?.split(" ")[0]}</p>
                        {user.parenting_stage && (
                          <p className="text-xs text-muted-foreground capitalize">{user.parenting_stage.replace("_", " ")} parent</p>
                        )}
                      </div>
                    </div>
                    {(user.trusted_parent_badge || user.verified_professional || user.night_owl_badge || user.local_parent_badge) && (
                      <div className="flex flex-wrap gap-1 justify-end flex-shrink-0">
                        {user.trusted_parent_badge && <span className="text-xs px-1.5 py-0.5 rounded-full bg-green-500/15 text-green-600 dark:text-green-400 font-medium">Trusted</span>}
                        {user.verified_professional && <span className="text-xs px-1.5 py-0.5 rounded-full bg-blue-500/15 text-blue-600 font-medium">Pro</span>}
                        {user.night_owl_badge && <span className="text-xs" title="Night Owl">🦉</span>}
                        {user.local_parent_badge && <span className="text-xs" title="Local Parent">📍</span>}
                      </div>
                    )}
                  </div>

                  {/* Key info pills */}
                  <div className="space-y-1.5 mb-3">
                    {(user.suburb || user.state) && (
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3 shrink-0 text-primary/60" />
                        <span className="truncate">{[user.suburb, user.state].filter(Boolean).join(", ")}</span>
                      </div>
                    )}
                    {user.number_of_kids > 0 && (
                      <div className="text-xs text-muted-foreground flex items-center gap-1.5">
                        <span className="text-sm leading-none">👶</span>
                        <span>
                          {user.number_of_kids} {user.number_of_kids === 1 ? "child" : "children"}
                          {user.kids_ages?.length > 0 && ` · ${user.kids_ages.slice(0, 2).join(", ")}`}
                        </span>
                      </div>
                    )}
                    {user.is_single_parent && (
                      <div className="text-xs text-muted-foreground flex items-center gap-1.5">
                        <span className="text-sm leading-none">💪</span>
                        <span>Single parent</span>
                      </div>
                    )}
                  </div>

                  {/* Interests */}
                  {user.interests?.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {user.interests.slice(0, 3).map((interest) => (
                        <span key={interest} className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                          {interest}
                        </span>
                      ))}
                      {user.interests.length > 3 && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">
                          +{user.interests.length - 3}
                        </span>
                      )}
                    </div>
                  ) : (
                    <p className="text-xs text-primary hover:underline">Complete your profile →</p>
                  )}
                </div>
              </Link>
            )}

            {/* Quick Links */}
            <div className="grid grid-cols-3 gap-2 lg:hidden">
              {[
                { icon: "🌙", label: "Circles", href: "/chat", testId: "quick-chat-link" },
                { icon: "💬", label: "Spaces", href: "/forums", testId: "quick-forums-link" },
                { icon: "✉️", label: "Messages", href: "/messages", testId: "quick-messages-link" },
                { icon: "👤", label: "Profile", href: "/profile", testId: "quick-profile-link" },
                { icon: "🔖", label: "Saved", href: "/saved", testId: "quick-saved-link" },
                { icon: "📅", label: "Events", href: "/events", testId: "quick-events-link" },
              ].map((item, idx) => (
                <Link
                  key={idx}
                  to={item.href}
                  className="flex items-center gap-2 p-2.5 rounded-xl bg-card border border-border/50 hover:border-primary/30 transition-colors"
                  data-testid={item.testId}
                >
                  <span className="text-base">{item.icon}</span>
                  <span className="font-medium text-xs text-foreground">{item.label}</span>
                </Link>
              ))}
            </div>
            <div className="hidden lg:flex flex-col gap-2">
              {[
                { icon: "🌙", label: "Circles", href: "/chat", testId: "quick-chat-link-desktop" },
                { icon: "💬", label: "Support Spaces", href: "/forums", testId: "quick-forums-link-desktop" },
                { icon: "✉️", label: "Messages", href: "/messages", testId: "quick-messages-link-desktop" },
                { icon: "👤", label: "Profile", href: "/profile", testId: "quick-profile-link-desktop" },
                { icon: "🔖", label: "Saved", href: "/saved", testId: "quick-saved-link-desktop" },
                { icon: "📅", label: "Events", href: "/events", testId: "quick-events-link-desktop" },
              ].map((item, idx) => (
                <Link
                  key={idx}
                  to={item.href}
                  className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border/50 hover:border-primary/30 transition-colors"
                  data-testid={item.testId}
                >
                  <span className="text-lg">{item.icon}</span>
                  <span className="font-medium text-sm text-foreground">{item.label}</span>
                </Link>
              ))}
            </div>

            {/* Recommended Circles */}
            <div className="hidden lg:block">
              <h3 className="font-heading font-semibold text-foreground text-sm mb-2 px-1">Recommended for you</h3>
              <RecommendedSpaces user={user} />
            </div>
          </div>

          {/* Centre column — feed */}
          <div className="flex-1 min-w-0">

            {/* Feed */}
        <div className="space-y-4 pb-4">
          <h2 className="font-heading text-base font-semibold text-foreground">Latest in your village</h2>

          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-card rounded-2xl p-6 border border-border/50 animate-pulse">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-muted" />
                    <div className="space-y-2">
                      <div className="w-32 h-4 bg-muted rounded" />
                      <div className="w-20 h-3 bg-muted rounded" />
                    </div>
                  </div>
                  <div className="w-3/4 h-5 bg-muted rounded mb-3" />
                  <div className="w-full h-4 bg-muted rounded" />
                </div>
              ))}
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-12 bg-card rounded-2xl border border-border/50">
              <span className="text-4xl mb-3 block">📝</span>
              <h3 className="font-heading font-semibold text-foreground mb-1">Nothing here yet</h3>
              <p className="text-sm text-muted-foreground mb-4">Be the first to share something with the village.</p>
              <Link to="/create-post">
                <Button className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full" data-testid="empty-create-post-btn">
                  Create a post
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {posts.map((post, idx) => (
                <article
                  key={post.post_id}
                  className="bg-card rounded-xl px-4 py-3 border border-border/50 hover:border-primary/30 transition-all"
                  data-testid={`post-card-${idx}`}
                >
                  {/* Author row */}
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {post.author_id !== "anonymous" ? (
                        <Link to={`/profile/${post.author_id}`} onClick={(e) => e.stopPropagation()}>
                          <Avatar className="h-7 w-7 cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all">
                            <AvatarImage src={post.author_picture} />
                            <AvatarFallback className="bg-primary/20 text-primary text-xs">
                              {post.author_name?.[0]?.toUpperCase() || "?"}
                            </AvatarFallback>
                          </Avatar>
                        </Link>
                      ) : (
                        <Avatar className="h-7 w-7">
                          <AvatarFallback className="bg-muted text-muted-foreground text-xs">?</AvatarFallback>
                        </Avatar>
                      )}
                      <div>
                        <div className="flex items-center gap-1.5">
                          {post.author_id !== "anonymous" ? (
                            <Link
                              to={`/profile/${post.author_id}`}
                              className="font-medium text-sm text-foreground hover:text-primary transition-colors"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {post.author_name}
                            </Link>
                          ) : (
                            <span className="font-medium text-sm text-muted-foreground">Anonymous</span>
                          )}
                          {post.author_subscription_tier === "premium" && !post.is_anonymous && (
                            <Crown className="h-3 w-3 text-amber-500 shrink-0" />
                          )}
                        </div>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <span>{post.category_icon}</span>
                          <span>{post.category_name}</span>
                          <span>·</span>
                          <span>{formatDate(post.created_at)}</span>
                          {post.is_anonymous && <span className="ml-1 px-1.5 py-0 rounded-full bg-secondary text-muted-foreground">Anon</span>}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Post content */}
                  <Link to={`/forums/post/${post.post_id}`} className="block">
                    <h3 className="text-sm font-semibold text-foreground mb-1 hover:text-primary transition-colors leading-snug">
                      {post.title}
                    </h3>
                    <p className="text-xs text-muted-foreground line-clamp-1 leading-relaxed">
                      {post.content}
                    </p>
                  </Link>

                  {/* Action row */}
                  <div className="flex items-center gap-3 text-xs text-muted-foreground mt-2">
                    <span className="flex items-center gap-1">
                      <Heart className="h-3 w-3" />
                      {post.like_count || 0}
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageCircle className="h-3 w-3" />
                      {post.reply_count || 0}
                    </span>
                    <span className="flex items-center gap-1">
                      <Eye className="h-3 w-3" />
                      {post.views || 0}
                    </span>
                  </div>
                </article>
              ))}
            </div>
          )}
          </div> {/* end feed */}
          </div> {/* end centre column */}

          {/* Right column — local events + circles (desktop only) */}
          <div className="hidden lg:block lg:w-64 xl:w-72 shrink-0 space-y-4">
            {/* Nearby Events */}
            <div className="bg-card rounded-2xl p-4 border border-border/50">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-primary/15 flex items-center justify-center shrink-0">
                    <Calendar className="h-3.5 w-3.5 text-primary" />
                  </div>
                  <h3 className="font-heading font-semibold text-foreground text-sm">Near You</h3>
                </div>
                <Link to="/events" className="text-xs text-primary hover:underline">All →</Link>
              </div>
              {nearbyEvents.length === 0 ? (
                <div className="text-center py-3">
                  <p className="text-xs text-muted-foreground mb-2">No events nearby yet</p>
                  <Link to="/events" className="text-xs text-primary hover:underline">Browse all events →</Link>
                </div>
              ) : (
                <div className="space-y-2">
                  {nearbyEvents.map(ev => {
                    const [,, day] = (ev.date || "").split("-");
                    const dateObj = ev.date ? new Date(...ev.date.split("-").map((v,i) => i===1 ? +v-1 : +v)) : null;
                    const mon = dateObj ? dateObj.toLocaleString("en-AU", { month: "short" }) : "";
                    return (
                      <Link key={ev.event_id} to="/events" className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-secondary/50 transition-colors group">
                        <div className="w-9 h-9 rounded-lg bg-primary/15 text-primary flex flex-col items-center justify-center flex-shrink-0">
                          <span className="text-xs font-bold leading-none">{day}</span>
                          <span className="text-[9px] uppercase">{mon}</span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-medium text-foreground truncate group-hover:text-primary transition-colors">{ev.title}</p>
                          <p className="text-xs text-muted-foreground truncate">{ev.suburb ? `${ev.suburb}${ev.state ? `, ${ev.state}` : ""}` : ev.state || ""}</p>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Nearby Circles */}
            {nearbyCircles.length > 0 && (
              <div className="bg-card rounded-2xl p-4 border border-border/50">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-green-500/15 flex items-center justify-center shrink-0">
                      <MapPin className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
                    </div>
                    <h3 className="font-heading font-semibold text-foreground text-sm">Local Circles</h3>
                  </div>
                  <Link to="/chat" className="text-xs text-primary hover:underline">All →</Link>
                </div>
                <div className="space-y-2">
                  {nearbyCircles.map((room, idx) => (
                    <Link key={room.room_id || idx} to={`/chat/${room.room_id}`} className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-secondary/50 transition-colors group">
                      <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center flex-shrink-0 text-base">
                        {room.icon || "🏘️"}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium text-foreground truncate group-hover:text-primary transition-colors">{room.name}</p>
                        <p className="text-xs text-muted-foreground">{room.distance_km ? `${room.distance_km}km away` : "Local"}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Today in your Village */}
            <div className="bg-card rounded-2xl border border-border/50 p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 rounded-lg bg-primary/15 flex items-center justify-center shrink-0">
                  <TrendingUp className="h-3.5 w-3.5 text-primary" />
                </div>
                <h3 className="font-heading font-semibold text-foreground text-sm">Today in your village</h3>
              </div>
              {todaysPosts.length === 0 ? (
                <p className="text-xs text-muted-foreground py-2">Nothing trending yet — be the first to post something today!</p>
              ) : (
                <div className="space-y-3">
                  {todaysPosts.map((post) => (
                    <Link
                      key={post.post_id}
                      to={`/forums/post/${post.post_id}`}
                      className="block group"
                    >
                      <div className="rounded-xl p-3 hover:bg-secondary/50 transition-colors -mx-1">
                        <p className="text-xs font-medium text-foreground group-hover:text-primary transition-colors line-clamp-2 leading-snug mb-1.5">
                          {post.title}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>{post.category_icon}</span>
                          <span className="truncate flex-1">{post.category_name}</span>
                          <span className="flex items-center gap-0.5 shrink-0">
                            <Heart className="h-3 w-3" />{post.like_count || 0}
                          </span>
                          <span className="flex items-center gap-0.5 shrink-0">
                            <MessageCircle className="h-3 w-3" />{post.reply_count || 0}
                          </span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
              <Link to="/forums" className="block text-center text-xs text-primary hover:underline mt-2 pt-2 border-t border-border/30">
                Browse all Support Spaces →
              </Link>
            </div>
          </div>
        </div> {/* end three-column layout */}

        {/* Mobile near you — events + circles (below feed) */}
        {(nearbyEvents.length > 0 || nearbyCircles.length > 0) && (
          <div className="mt-6 mb-4 lg:hidden">
            {nearbyEvents.length > 0 && (
              <div className="p-4 rounded-2xl bg-card border border-border/50 mb-3">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center shrink-0">
                      <Calendar className="h-4 w-4 text-primary" />
                    </div>
                    <h3 className="font-heading font-semibold text-foreground text-sm">Events Near You</h3>
                  </div>
                  <Link to="/events" className="text-xs text-primary hover:underline">See all →</Link>
                </div>
                <div className="flex gap-3 overflow-x-auto pb-1 hide-scrollbar">
                  {nearbyEvents.map(ev => {
                    const dateObj = ev.date ? new Date(...ev.date.split("-").map((v,i) => i===1 ? +v-1 : +v)) : null;
                    const day = dateObj ? dateObj.getDate() : "?";
                    const mon = dateObj ? dateObj.toLocaleString("en-AU", { month: "short" }) : "";
                    return (
                      <Link key={ev.event_id} to="/events" className="flex-shrink-0 w-36 p-3 rounded-xl bg-secondary/50 hover:bg-secondary/80 transition-colors">
                        <div className="w-8 h-8 rounded-lg bg-primary/15 text-primary flex flex-col items-center justify-center mb-2">
                          <span className="text-xs font-bold leading-none">{day}</span>
                          <span className="text-[9px] uppercase">{mon}</span>
                        </div>
                        <p className="text-xs font-medium text-foreground line-clamp-2 mb-1">{ev.title}</p>
                        <p className="text-xs text-muted-foreground truncate">{ev.suburb || ev.state || ""}</p>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}
            {nearbyCircles.length > 0 && (
              <div className="p-4 rounded-2xl bg-card border border-border/50">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-green-500/15 flex items-center justify-center shrink-0">
                      <MapPin className="h-4 w-4 text-green-600 dark:text-green-400" />
                    </div>
                    <h3 className="font-heading font-semibold text-foreground text-sm">Local Circles</h3>
                  </div>
                  <Link to="/chat" className="text-xs text-primary hover:underline">See all →</Link>
                </div>
                <div className="flex gap-3 overflow-x-auto pb-1 hide-scrollbar">
                  {nearbyCircles.map((room, idx) => (
                    <Link key={room.room_id || idx} to={`/chat/${room.room_id}`} className="flex-shrink-0 flex flex-col items-center gap-1.5 p-2 rounded-xl hover:bg-secondary/50 transition-colors">
                      <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center text-xl">{room.icon || "🏘️"}</div>
                      <span className="text-xs font-medium text-foreground truncate max-w-[72px] text-center">{room.name}</span>
                      {room.distance_km && <span className="text-xs text-muted-foreground">{room.distance_km}km</span>}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
