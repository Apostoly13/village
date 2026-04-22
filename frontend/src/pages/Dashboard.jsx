import { useState, useEffect, useMemo } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import Navigation from "../components/Navigation";
// OnboardingModal removed — onboarding is now a standalone page at /onboarding
import { Search, Plus, MessageCircle, Heart, Eye, Crown, X } from "lucide-react";
import RecommendedSpaces from "../components/RecommendedSpaces";
import AppFooter from "../components/AppFooter";
import { timeAgoVerbose } from "../utils/dateHelpers";

const API_URL = process.env.REACT_APP_BACKEND_URL;

// ── Helpers ───────────────────────────────────────────────────────────────────

function typeEmoji(type) {
  const map = { reply: "💬", like: "❤️", friend_request: "👋", friend_accept: "✅", moderation: "🛡️" };
  return map[type] || "🔔";
}

const fmtRelative = timeAgoVerbose;

// ── QuickThreadView ───────────────────────────────────────────────────────────

function QuickThreadView({ post, liked, likeCount, onLike, onClose, onReplied, apiUrl, user }) {
  const [replies, setReplies] = useState([]);
  const [loadingReplies, setLoadingReplies] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`${apiUrl}/api/forums/posts/${post.post_id}/replies`, { credentials: "include" });
        if (res.ok) setReplies(await res.json());
      } catch {}
      setLoadingReplies(false);
    };
    load();
  }, [post.post_id, apiUrl]);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative bg-card w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl border border-border/40 shadow-xl flex flex-col max-h-[90vh] sm:max-h-[80vh]"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-border/30 shrink-0">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>{post.category_icon}</span>
            <span>{post.category_name}</span>
            <span>·</span>
            <span>{post.reply_count || 0} replies</span>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to={`/forums/post/${post.post_id}`}
              onClick={onClose}
              className="text-xs text-primary font-medium hover:underline px-2 py-1 rounded-lg hover:bg-primary/10 transition-colors"
            >
              Open post →
            </Link>
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground p-1 rounded-lg hover:bg-secondary transition-colors">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="overflow-y-auto flex-1 px-4 py-4 space-y-4">
          {/* Original post */}
          <div className="pb-4 border-b border-border/30">
            <div className="flex items-center gap-2 mb-2">
              <Avatar className="h-7 w-7">
                <AvatarImage src={post.author_picture} />
                <AvatarFallback className="bg-primary/20 text-primary text-xs">
                  {post.is_anonymous ? "?" : post.author_name?.[0]?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-xs font-medium text-foreground">{post.is_anonymous ? "Anonymous" : post.author_name}</p>
                <p className="text-xs text-muted-foreground">{post.category_name}</p>
              </div>
            </div>
            <h2 className="font-heading font-bold text-sm text-foreground mb-2 leading-snug">{post.title}</h2>
            <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{post.content}</p>
            {post.image && <img src={post.image} alt="" className="w-full rounded-xl mt-3 max-h-48 object-cover" />}
            <div className="mt-3">
              <button
                onClick={onLike}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs transition-all ${
                  liked
                    ? "border-rose-500/40 bg-rose-500/10 text-rose-500"
                    : "border-border/50 text-muted-foreground hover:border-rose-500/40 hover:text-rose-500"
                }`}
              >
                <Heart className={`h-3.5 w-3.5 ${liked ? "fill-rose-500" : ""}`} />
                {likeCount} Likes
              </button>
            </div>
          </div>

          {/* Replies */}
          {loadingReplies ? (
            <div className="space-y-3">
              {[1, 2].map(i => (
                <div key={i} className="animate-pulse flex gap-2">
                  <div className="w-7 h-7 rounded-full bg-muted shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3 bg-muted rounded w-24" />
                    <div className="h-3 bg-muted rounded w-full" />
                    <div className="h-3 bg-muted rounded w-3/4" />
                  </div>
                </div>
              ))}
            </div>
          ) : replies.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-4">No replies yet — be the first to respond.</p>
          ) : (
            <div className="space-y-3">
              {replies.map((reply, idx) => (
                <div key={reply.reply_id || idx} className={`flex gap-2.5 ${reply.depth > 0 ? "ml-6 pl-3 border-l-2 border-primary/30" : ""}`}>
                  <Avatar className="h-6 w-6 shrink-0 mt-0.5">
                    <AvatarImage src={reply.author_picture} />
                    <AvatarFallback className="bg-secondary text-muted-foreground text-xs">
                      {reply.is_anonymous ? "?" : reply.author_name?.[0]?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-foreground mb-0.5">{reply.is_anonymous ? "Anonymous" : reply.author_name}</p>
                    <p className="text-xs text-muted-foreground leading-relaxed">{reply.content}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <QuickReplyBox
          postId={post.post_id}
          onDone={(sent) => {
            if (sent) {
              onReplied?.();
              setReplies(prev => [...prev, {
                content: sent,
                author_name: user?.nickname || user?.name,
                author_picture: user?.picture,
                is_anonymous: false,
                depth: 0,
                reply_id: Date.now().toString(),
              }]);
            }
          }}
          apiUrl={apiUrl}
        />
      </div>
    </div>
  );
}

function QuickReplyBox({ postId, onDone, apiUrl }) {
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    if (!text.trim()) return;
    setSending(true);
    try {
      const res = await fetch(`${apiUrl}/api/forums/posts/${postId}/replies`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ content: text.trim() }),
      });
      if (res.ok) { const sent = text.trim(); setText(""); onDone(sent); }
    } catch {}
    setSending(false);
  };

  return (
    <div className="border-t border-border/30 px-4 py-3 shrink-0 flex gap-2">
      <input
        value={text}
        onChange={e => setText(e.target.value)}
        onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
        placeholder="Write a quick reply..."
        className="flex-1 bg-secondary/50 rounded-xl px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary/30 border border-transparent focus:border-primary/30"
      />
      <button
        onClick={handleSend}
        disabled={!text.trim() || sending}
        className="px-3 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50 hover:bg-primary/90 transition-colors shrink-0"
      >
        {sending ? "..." : "Send"}
      </button>
    </div>
  );
}

// ── Feed filters ──────────────────────────────────────────────────────────────

const FEED_FILTERS = [
  { id: "latest",   label: "Latest" },
  { id: "nearby",   label: "Nearby" },
  { id: "unread",   label: "Unread" },
  { id: "trending", label: "Trending" },
  { id: "support",  label: "Support needed" },
];

// ── Dashboard modes ───────────────────────────────────────────────────────────

const DASH_MODES = [
  { id: "need-help", emoji: "💙", label: "I need help" },
  { id: "browse",    emoji: "🏘️", label: "Browse"      },
  { id: "catch-up",  emoji: "🔔", label: "Catch up"    },
];

// ── Main component ────────────────────────────────────────────────────────────

function isNightOwlTime() {
  const now = new Date();
  const aestMs = now.getTime() + 10 * 60 * 60 * 1000;
  const h = new Date(aestMs).getUTCHours();
  return h >= 22 || h < 4;
}

export default function Dashboard({ user }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [posts, setPosts]               = useState([]);
  const [loading, setLoading]           = useState(true);
  const [feedFilter, setFeedFilter]     = useState("latest");
  const [searchQuery, setSearchQuery]   = useState("");
  const [nearbyEvents, setNearbyEvents] = useState([]);
  const [todaysPosts, setTodaysPosts]   = useState([]);
  const [visibleCount, setVisibleCount] = useState(8);
  const [subscription, setSubscription] = useState(null);
  const [selectedPost, setSelectedPost] = useState(null);
  const [postLikes, setPostLikes]       = useState({});
  const [busyChatRooms, setBusyChatRooms] = useState([]);
  const [namedRooms, setNamedRooms] = useState([]);
  const [nightOwl3amRoom, setNightOwl3amRoom] = useState(null);
  const [recentActivity, setRecentActivity] = useState([]);
  const [userCommunities, setUserCommunities] = useState([]);
  const [showDowngradeNotice, setShowDowngradeNotice] = useState(false);
  // Live gender — starts from prop, updates instantly when profile is saved
  const [liveGender, setLiveGender] = useState(user?.gender);

  // ── Dashboard mode — always resets to Browse on page load ────────────────
  const [dashMode, setDashMode] = useState("browse");

  const switchMode = (id) => setDashMode(id);

  // ── One-time downgrade notice ─────────────────────────────────────────────
  useEffect(() => {
    if (user?.just_downgraded) setShowDowngradeNotice(true);
  }, [user?.just_downgraded]);

  // ── Derived: filtered feed ─────────────────────────────────────────────────
  const filteredPosts = useMemo(() => {
    switch (feedFilter) {
      case "trending":
        return [...posts].sort((a, b) =>
          ((b.like_count || 0) * 2 + (b.reply_count || 0)) -
          ((a.like_count || 0) * 2 + (a.reply_count || 0))
        );
      case "nearby":
        return posts.filter(p =>
          user?.suburb && (p.suburb === user.suburb || p.state === user.state)
        );
      case "support":
        return posts.filter(p =>
          p.needs_support ||
          p.category_name?.toLowerCase().includes("support") ||
          p.category_name?.toLowerCase().includes("wellbeing") ||
          p.category_name?.toLowerCase().includes("mental health")
        );
      case "unread":
        return posts.filter(p => !p.viewed);
      default:
        return posts;
    }
  }, [posts, feedFilter, user]);

  // ── Derived: hero content (warm sentence + optional secondary chips) ────────
  const heroContent = useMemo(() => {
    const unread  = recentActivity.filter(n => !n.is_read);
    const replies  = unread.filter(n => n.type === "reply");
    const likes    = unread.filter(n => n.type === "like");
    const friends  = unread.filter(n => n.type === "friend_request");
    const suburb   = user?.suburb || "you";

    let sentence = "";
    const chips  = [];

    if (replies.length && nearbyEvents.length) {
      sentence = `${replies.length === 1 ? "Someone replied to your post" : `${replies.length} parents replied to your posts`} and there ${nearbyEvents.length === 1 ? "is" : "are"} ${nearbyEvents.length} ${nearbyEvents.length === 1 ? "event" : "events"} near ${suburb}.`;
      if (busyChatRooms.length) chips.push({ emoji: "🌿", text: `${busyChatRooms.length} circles active now` });
    } else if (replies.length) {
      sentence = replies.length === 1 ? "Someone replied to your post — check in when you're ready." : `${replies.length} parents replied to your posts. Check in when you're ready.`;
      if (nearbyEvents.length)  chips.push({ emoji: "📅", text: `${nearbyEvents.length} events near ${suburb}` });
      if (busyChatRooms.length) chips.push({ emoji: "🌿", text: `${busyChatRooms.length} circles active now` });
    } else if (likes.length) {
      sentence = `${likes.length} ${likes.length === 1 ? "parent found" : "parents found"} your posts helpful recently.`;
      if (nearbyEvents.length)  chips.push({ emoji: "📅", text: `${nearbyEvents.length} events near ${suburb}` });
      if (busyChatRooms.length) chips.push({ emoji: "🌿", text: `${busyChatRooms.length} circles active now` });
    } else if (friends.length) {
      sentence = `You have ${friends.length} friend ${friends.length === 1 ? "request" : "requests"} from the village.`;
      if (busyChatRooms.length) chips.push({ emoji: "🌿", text: `${busyChatRooms.length} circles active now` });
    } else if (busyChatRooms.length && nearbyEvents.length) {
      sentence = `${busyChatRooms.length} ${busyChatRooms.length === 1 ? "circle is" : "circles are"} active and ${nearbyEvents.length} ${nearbyEvents.length === 1 ? "event" : "events"} near ${suburb}.`;
    } else if (busyChatRooms.length) {
      sentence = `${busyChatRooms.length} ${busyChatRooms.length === 1 ? "circle is" : "circles are"} active right now — good time to join.`;
    } else if (nearbyEvents.length) {
      sentence = `There ${nearbyEvents.length === 1 ? "is" : "are"} ${nearbyEvents.length} ${nearbyEvents.length === 1 ? "event" : "events"} near ${suburb} coming up.`;
    }

    return { sentence, chips: chips.slice(0, 2) };
  }, [recentActivity, nearbyEvents, busyChatRooms, user]);

  // ── Post badges (max 1 per card) ───────────────────────────────────────────
  const getTopBadge = (post) => {
    const needsSupport =
      post.needs_support ||
      post.category_name?.toLowerCase().includes("support") ||
      post.category_name?.toLowerCase().includes("wellbeing");
    const isNearby  = user?.suburb && post.suburb === user.suburb;
    const isActive  = (post.reply_count || 0) >= 8;

    if (needsSupport) return { label: "Needs support",  cls: "bg-amber-500/15 text-amber-600 dark:text-amber-400" };
    if (isNearby)     return { label: "Near you",        cls: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" };
    if (isActive)     return { label: "Parents are responding", cls: "bg-sky-500/10 text-sky-500" };
    return null;
  };

  // ── Data fetching ──────────────────────────────────────────────────────────
  useEffect(() => {
    // Fire all independent fetches in parallel — avoids sequential round-trips
    Promise.all([
      fetchFeed(),
      fetchNearbyEvents(),
      fetchTodaysPosts(),
      fetchSubscription(),
      fetchBusyChatRooms(),
      fetchRecentActivity(),
    ]);
    // Onboarding is now a standalone page (/onboarding) — ProtectedRoute handles the redirect

    // Listen for profile updates — re-apply gender filter on rooms instantly
    const handleProfileUpdate = (e) => {
      if (e.detail?.gender !== undefined) {
        setLiveGender(e.detail.gender);
        fetchBusyChatRooms(e.detail.gender);
      }
    };
    window.addEventListener("village:profileUpdated", handleProfileUpdate);
    return () => window.removeEventListener("village:profileUpdated", handleProfileUpdate);
  }, [user]);

  const fetchFeed = async () => {
    // Stale-while-revalidate: show cached data instantly, refresh in background
    try {
      const cached = sessionStorage.getItem("village_feed_cache");
      if (cached) {
        setPosts(JSON.parse(cached));
        setLoading(false);
      }
    } catch {}
    try {
      const res = await fetch(`${API_URL}/api/feed`, { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setPosts(data);
        try { sessionStorage.setItem("village_feed_cache", JSON.stringify(data)); } catch {}
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const fetchTodaysPosts = async () => {
    try {
      const cached = sessionStorage.getItem("village_trending_cache");
      if (cached) setTodaysPosts(JSON.parse(cached));
    } catch {}
    try {
      const res = await fetch(`${API_URL}/api/forums/posts/trending?limit=3`, { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setTodaysPosts(data);
        try { sessionStorage.setItem("village_trending_cache", JSON.stringify(data)); } catch {}
      }
    } catch {}
  };

  const fetchNearbyEvents = async () => {
    try {
      const cached = sessionStorage.getItem("village_events_cache");
      if (cached) setNearbyEvents(JSON.parse(cached));
    } catch {}
    try {
      const res = await fetch(`${API_URL}/api/events?distance_km=25&limit=2`, { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setNearbyEvents(data);
        try { sessionStorage.setItem("village_events_cache", JSON.stringify(data)); } catch {}
      }
    } catch {}
  };

  const fetchSubscription = async () => {
    try {
      const res = await fetch(`${API_URL}/api/subscription/status`, { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setSubscription(data);
        if (data?.tier === "premium") fetchUserCommunities();
      }
    } catch {}
  };

  const fetchBusyChatRooms = async (genderOverride) => {
    try {
      const res = await fetch(`${API_URL}/api/chat/rooms`, { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        const allRooms = [
          ...(data.all_australia_rooms || []),
          ...(data.nearby_rooms || []),
          ...(data.my_suburb_room ? [data.my_suburb_room] : []),
        ];

        // Filter out gender-restricted rooms — only exact gender match sees restricted rooms
        // genderOverride is passed when triggered by a profile update event (avoids stale closure)
        const g = genderOverride !== undefined ? genderOverride : (liveGender ?? user?.gender);
        const accessible = allRooms.filter(r => {
          const restriction = r.gender_restriction;
          if (!restriction) return true;
          if (restriction === "female" && g !== "female") return false;
          if (restriction === "male"   && g !== "male")   return false;
          return true;
        });

        // Deduplicate by name — catches legacy duplicates with different room_ids
        const seen = new Set();
        const unique = accessible.filter(r => {
          const key = (r.name || r.room_id).toLowerCase();
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });

        // Sort: rooms with recent activity first, then by active_users
        unique.sort((a, b) => {
          const aTime = a.last_activity_at || a.created_at || "";
          const bTime = b.last_activity_at || b.created_at || "";
          if (bTime > aTime) return 1;
          if (aTime > bTime) return -1;
          return (b.active_users || 0) - (a.active_users || 0);
        });

        setBusyChatRooms(unique.slice(0, 5));

        // During night owl hours, surface the 3am Club as a hero banner
        const nightOwlActive = isNightOwlTime();
        const clubRoom = nightOwlActive ? unique.find(r => r.name?.toLowerCase().includes("3am")) : null;
        setNightOwl3amRoom(clubRoom ? {
          name: clubRoom.name,
          href: `/chat/${clubRoom.room_id}`,
          icon: clubRoom.icon || "🌙",
        } : null);

        // Build Live Now — exclude 3am during night owl (shown separately at top of page)
        const liveRooms = unique
          .filter(r => !(nightOwlActive && r.name?.toLowerCase().includes("3am")))
          .slice(0, 5)
          .map(r => ({
            name:  r.name,
            icon:  r.icon || "💬",
            href:  `/chat/${r.room_id}`,
            count: r.active_users || null,
          }));
        setNamedRooms(liveRooms);
      }
    } catch {}
  };

  const fetchUserCommunities = async () => {
    try {
      const res = await fetch(`${API_URL}/api/forums/categories`, { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        const all = data.categories || data;
        const mine = all.filter(c =>
          c.category_type === "community" &&
          (c.is_member || c.is_creator || c.created_by === user?.user_id)
        );
        setUserCommunities(mine);
      }
    } catch {}
  };

  const fetchRecentActivity = async () => {
    try {
      const res = await fetch(`${API_URL}/api/notifications?limit=6`, { credentials: "include" });
      if (res.ok) setRecentActivity(await res.json());
    } catch {}
  };

  const markNotificationRead = async (notificationId) => {
    // Optimistically clear it from unread state
    setRecentActivity(prev =>
      prev.map(n => n.notification_id === notificationId ? { ...n, is_read: true } : n)
    );
    try {
      await fetch(`${API_URL}/api/notifications/${notificationId}/read`, {
        method: "POST",
        credentials: "include",
      });
    } catch {}
  };


  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) { fetchFeed(); return; }
    try {
      const res = await fetch(`${API_URL}/api/search?q=${encodeURIComponent(searchQuery)}`, { credentials: "include" });
      if (res.ok) setPosts(await res.json());
    } catch (e) { console.error(e); }
  };

  const handleLikePost = async (e, post) => {
    e.preventDefault();
    e.stopPropagation();
    const liked = postLikes[post.post_id]?.liked ?? post.user_liked;
    setPostLikes(prev => ({
      ...prev,
      [post.post_id]: {
        liked: !liked,
        count: (prev[post.post_id]?.count ?? post.like_count ?? 0) + (liked ? -1 : 1),
      },
    }));
    try {
      await fetch(`${API_URL}/api/forums/posts/${post.post_id}/like`, {
        method: liked ? "DELETE" : "POST",
        credentials: "include",
      });
    } catch {}
  };

  const firstName = user?.nickname || user?.name?.split(" ")[0] || "there";
  const unreadActivity = recentActivity.filter(n => !n.is_read);
  const isFree = user?.subscription_tier === "free";

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background pb-20 lg:pb-8">
      <Navigation user={user} />

      <main className="max-w-5xl mx-auto px-4 pt-20 lg:pt-24">

        {/* ── Downgrade notice (one-time, shown on first login after trial expires) ── */}
        {showDowngradeNotice && (
          <div className="mb-5 rounded-2xl p-5 bg-card border border-border/50 shadow-sm">
            <div className="flex items-start gap-3">
              <span className="text-2xl shrink-0">👋</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground mb-1">Your free trial has ended — you're now on the free tier</p>
                <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                  Some features from your trial are no longer available. Here's what's changed:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                  <div className="rounded-xl bg-secondary/40 p-3">
                    <p className="text-xs font-semibold text-foreground mb-1.5">Still with you ✓</p>
                    <ul className="space-y-1 text-xs text-muted-foreground">
                      <li>• 5 Space posts per week</li>
                      <li>• 5 Space replies per week</li>
                      <li>• 10 Group Chat messages per day</li>
                      <li>• Anonymous posting — always free</li>
                      <li>• Reading all posts and comments</li>
                    </ul>
                  </div>
                  <div className="rounded-xl bg-secondary/40 p-3">
                    <p className="text-xs font-semibold text-foreground mb-1.5">Now locked 🔒</p>
                    <ul className="space-y-1 text-xs text-muted-foreground">
                      <li>• Events — view &amp; RSVP</li>
                      <li>• Direct messages</li>
                      <li>• Community spaces</li>
                      <li>• Unlimited posts &amp; replies</li>
                    </ul>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Link to="/plus" className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors">
                    Upgrade to Village+ — $9.99/month
                  </Link>
                  <button
                    onClick={() => setShowDowngradeNotice(false)}
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Free trial banner ── */}
        {(() => {
          if (user?.subscription_tier !== "trial" || !user?.trial_ends_at) return null;
          const trialEnd = new Date(user.trial_ends_at);
          if (trialEnd <= new Date()) return null;
          const today = new Date(); today.setHours(0, 0, 0, 0);
          const endDay = new Date(trialEnd); endDay.setHours(0, 0, 0, 0);
          const daysLeft = Math.round((endDay - today) / (1000 * 60 * 60 * 24));
          return (
            <div className="mb-5 rounded-2xl p-4 bg-amber-500/10 border border-amber-500/25 flex items-start gap-3">
              <span className="text-xl shrink-0 mt-0.5">⏳</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground">
                  {daysLeft <= 1 ? "Your free trial ends tomorrow" : `${daysLeft} days left on your free trial`}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                  After your trial you'll move to the free tier — 5 posts/week, 5 replies/week, 10 chats/day, no Events, Communities or Direct Messages.{" "}
                  <Link to="/plus" className="text-primary underline">Upgrade to Village+</Link> to keep full access and support the community.
                </p>
              </div>
            </div>
          );
        })()}

        {/* ── Hero ── */}
        <div className="mb-5 rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-primary/15 px-5 py-4">
          <h1 className="font-heading text-xl sm:text-2xl font-bold text-foreground mb-1 leading-tight">
            Welcome back, {firstName} 👋
          </h1>
          {heroContent.sentence ? (
            <p className="text-sm text-foreground/70 leading-relaxed">
              {heroContent.sentence}
            </p>
          ) : (
            <p className="text-sm text-foreground/70 leading-relaxed">
              Your village is here whenever you need it 🌿
            </p>
          )}
        </div>

        {/* ── Night Owl 3am Club banner ── */}
        {nightOwl3amRoom && (
          <Link to={nightOwl3amRoom.href} className="block mb-5">
            <div className="rounded-2xl p-4 bg-primary/10 border border-primary/25 hover:border-primary/40 hover:bg-primary/15 transition-all flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center text-2xl shrink-0">🌙</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse shrink-0" />
                  <span className="text-xs font-semibold text-primary uppercase tracking-wide">Night Owl hours · Active now</span>
                </div>
                <p className="font-heading font-bold text-foreground text-sm">The 3am Club is active</p>
                <p className="text-xs text-muted-foreground">Late-night company for those who can't sleep. You're not alone.</p>
              </div>
              <span className="text-muted-foreground shrink-0">→</span>
            </div>
          </Link>
        )}

        {/* ── Mode switcher ── */}
        <div className="mb-5 flex bg-card rounded-2xl border border-border/50 p-1 gap-1">
          {DASH_MODES.map(({ id, emoji, label }) => (
            <button
              key={id}
              onClick={() => switchMode(id)}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 ${
                dashMode === id
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <span className="text-base leading-none">{emoji}</span>
              <span>{label}</span>
            </button>
          ))}
        </div>

        {/* ════════════════════════════════════════════════════════════
            MODE: I need help
        ════════════════════════════════════════════════════════════ */}
        {dashMode === "need-help" && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground text-center leading-relaxed">
              We're here — choose how you'd like to connect 💙
            </p>

            {/* 3 big action cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Link
                to="/chat"
                className="bg-card rounded-2xl border border-border/50 p-5 hover:border-primary/40 hover:bg-primary/5 transition-all text-center group"
              >
                <span className="text-3xl block mb-2">💬</span>
                <p className="font-heading font-semibold text-sm text-foreground group-hover:text-primary transition-colors">
                  Talk in a Group Chat
                </p>
                <p className="text-xs text-muted-foreground mt-1.5 leading-snug">
                  Join a live conversation with other parents right now
                </p>
              </Link>

              <Link
                to="/create-post"
                className="bg-card rounded-2xl border border-border/50 p-5 hover:border-primary/40 hover:bg-primary/5 transition-all text-center group"
              >
                <span className="text-3xl block mb-2">🙈</span>
                <p className="font-heading font-semibold text-sm text-foreground group-hover:text-primary transition-colors">
                  Post anonymously
                </p>
                <p className="text-xs text-muted-foreground mt-1.5 leading-snug">
                  Share what's on your mind — no name attached
                </p>
              </Link>

              <Link
                to="/create-post"
                className="bg-card rounded-2xl border border-border/50 p-5 hover:border-primary/40 hover:bg-primary/5 transition-all text-center group"
              >
                <span className="text-3xl block mb-2">🙋</span>
                <p className="font-heading font-semibold text-sm text-foreground group-hover:text-primary transition-colors">
                  Ask a question
                </p>
                <p className="text-xs text-muted-foreground mt-1.5 leading-snug">
                  Get advice from parents who've been there
                </p>
              </Link>
            </div>

            {/* Active Group Chats */}
            {namedRooms.length > 0 && (
              <div className="bg-card rounded-2xl border border-border/40 p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-heading font-semibold text-sm text-foreground flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse inline-block shrink-0" />
                    Active right now
                  </h3>
                  <Link to="/chat" className="text-[11px] text-muted-foreground hover:text-foreground transition-colors">See all</Link>
                </div>
                <div className="space-y-1">
                  {namedRooms.map(r => (
                    <Link key={r.href} to={r.href} className="flex items-center gap-2.5 p-2.5 rounded-xl hover:bg-secondary/50 transition-colors group">
                      <span className="text-base w-7 text-center shrink-0">{r.icon}</span>
                      <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors flex-1 truncate">{r.name}</p>
                      {r.count > 0 ? (
                        <span className="text-xs text-muted-foreground shrink-0">{r.count} online</span>
                      ) : (
                        <span className="flex items-center gap-1 text-xs text-green-500 shrink-0">
                          <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                          Active
                        </span>
                      )}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Support spaces */}
            <div className="bg-card rounded-2xl border border-border/40 p-4">
              <h3 className="font-heading font-semibold text-sm text-foreground mb-3">Support spaces</h3>
              <RecommendedSpaces user={user} />
              <Link to="/forums" className="block text-center text-xs text-primary font-medium mt-3 hover:underline">
                Browse all spaces →
              </Link>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════
            MODE: Browse community
        ════════════════════════════════════════════════════════════ */}
        {dashMode === "browse" && (
          <>
            {/* Search + action bar */}
            <div className="mb-6 space-y-3">
              <div className="flex gap-2.5">
                <form onSubmit={handleSearch} className="flex-1 relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Search posts and spaces..."
                    className="pl-11 h-11 rounded-xl bg-card border-border/50 focus:border-primary"
                    data-testid="search-input"
                  />
                </form>
                <Link to="/create-post">
                  <Button
                    className="h-11 px-5 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 whitespace-nowrap"
                    data-testid="create-post-btn"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    New Post
                  </Button>
                </Link>
              </div>

              {/* Feed filter pills */}
              <div className="flex gap-2 overflow-x-auto pb-0.5 scrollbar-none">
                {FEED_FILTERS.map(f => (
                  <button
                    key={f.id}
                    onClick={() => { setFeedFilter(f.id); setVisibleCount(8); }}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 ${
                      feedFilter === f.id
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "bg-card border border-border/50 text-muted-foreground hover:text-foreground hover:border-primary/30"
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Mobile-only quick-access highlights strip */}
            <div className="flex gap-2 mb-4 lg:hidden">
              {unreadActivity.length > 0 && (
                <button
                  onClick={() => switchMode("catch-up")}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-primary/10 border border-primary/20 text-primary text-xs font-medium hover:bg-primary/15 transition-colors"
                >
                  <span>🔔</span>
                  {unreadActivity.length} new
                </button>
              )}
              {namedRooms.length > 0 && (
                <Link
                  to="/chat"
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-green-500/10 border border-green-500/20 text-green-700 dark:text-green-400 text-xs font-medium hover:bg-green-500/15 transition-colors"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse inline-block" />
                  {namedRooms.length} live
                </Link>
              )}
              <Link
                to="/forums"
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-card border border-border/50 text-muted-foreground text-xs font-medium hover:text-foreground hover:border-primary/30 transition-colors ml-auto"
              >
                Spaces →
              </Link>
            </div>

            {/* Two-column layout */}
            <div className="flex flex-col lg:flex-row gap-5">

              {/* CENTER: feed */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-heading font-semibold text-foreground text-base">
                    {feedFilter === "latest"   && "Latest conversations"}
                    {feedFilter === "trending" && "Trending discussions"}
                    {feedFilter === "nearby"   && "Near you"}
                    {feedFilter === "support"  && "Support needed"}
                    {feedFilter === "unread"   && "Unread"}
                  </h2>
                  {feedFilter !== "latest" && (
                    <button
                      onClick={() => { setFeedFilter("latest"); setVisibleCount(8); }}
                      className="text-xs text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:underline"
                    >
                      Clear filter
                    </button>
                  )}
                </div>

                {loading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="bg-card rounded-2xl px-4 py-3.5 border border-border/40 card-elevated animate-pulse">
                        <div className="flex items-center gap-2 mb-3">
                          <div className="w-7 h-7 rounded-full bg-muted shrink-0" />
                          <div className="h-3 bg-muted rounded w-32" />
                          <div className="h-3 bg-muted rounded w-16 ml-auto" />
                        </div>
                        <div className="h-4 bg-muted rounded w-3/4 mb-2" />
                        <div className="h-3 bg-muted rounded w-full mb-1" />
                        <div className="h-3 bg-muted rounded w-2/3" />
                      </div>
                    ))}
                  </div>
                ) : filteredPosts.length === 0 ? (
                  <div className="text-center py-12 bg-card rounded-2xl border border-border/40 card-elevated">
                    <span className="text-4xl mb-3 block">📝</span>
                    <h3 className="font-heading font-semibold text-foreground mb-1">
                      {feedFilter !== "latest" ? "Nothing here right now" : "Nothing here yet"}
                    </h3>
                    <p className="text-xs text-muted-foreground mb-4">
                      {feedFilter !== "latest"
                        ? "Try a different filter or check back later."
                        : "Be the first to share something with the village."}
                    </p>
                    {feedFilter === "latest" && (
                      <Link to="/create-post">
                        <Button className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl" data-testid="empty-create-post-btn">
                          Create a post
                        </Button>
                      </Link>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {filteredPosts.slice(0, visibleCount).map((post, idx) => {
                      const liked     = postLikes[post.post_id]?.liked ?? post.user_liked;
                      const likeCount = postLikes[post.post_id]?.count ?? post.like_count ?? 0;
                      const badge     = getTopBadge(post);
                      const isAnon    = post.is_anonymous;

                      return (
                        <article
                          key={post.post_id}
                          onClick={() => navigate(`/forums/post/${post.post_id}`)}
                          role="button"
                          tabIndex={0}
                          onKeyDown={e => e.key === "Enter" && navigate(`/forums/post/${post.post_id}`)}
                          aria-label={`Open post: ${post.title}`}
                          className="bg-card rounded-2xl px-4 py-3.5 border border-border/40 cursor-pointer hover:shadow-md hover:-translate-y-px transition-all duration-200 card-elevated focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                          data-testid={`post-card-${idx}`}
                        >
                          {/* Row 1: Author + meta */}
                          <div className="flex items-center gap-2 mb-2.5">
                            {isAnon ? (
                              <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center shrink-0">
                                <span className="text-xs text-muted-foreground">?</span>
                              </div>
                            ) : (
                              <Link
                                to={`/profile/${post.author_id}`}
                                onClick={e => e.stopPropagation()}
                              >
                                <Avatar className="h-7 w-7 hover:ring-2 hover:ring-primary/40 transition-all">
                                  <AvatarImage src={post.author_picture} />
                                  <AvatarFallback className="bg-primary/20 text-primary text-xs">
                                    {post.author_name?.[0]?.toUpperCase() || "?"}
                                  </AvatarFallback>
                                </Avatar>
                              </Link>
                            )}
                            <div className="flex items-center gap-1.5 min-w-0 flex-1">
                              {isAnon ? (
                                <span className="text-sm text-muted-foreground">Anonymous</span>
                              ) : (
                                <Link
                                  to={`/profile/${post.author_id}`}
                                  className="text-sm font-medium text-foreground hover:text-primary transition-colors truncate"
                                  onClick={e => e.stopPropagation()}
                                >
                                  {post.author_name}
                                </Link>
                              )}
                              {post.author_subscription_tier === "premium" && !isAnon && (
                                <Crown className="h-3 w-3 text-amber-500 shrink-0" />
                              )}
                              <span className="text-xs text-muted-foreground/60 shrink-0">·</span>
                              <span className="text-xs text-muted-foreground truncate flex items-center gap-1 shrink-0">
                                <span>{post.category_icon}</span>
                                <span className="truncate">{post.category_name}</span>
                              </span>
                              <span className="text-xs text-muted-foreground/60 shrink-0 hidden sm:inline">·</span>
                              <span className="text-xs text-muted-foreground/60 shrink-0 hidden sm:inline whitespace-nowrap">
                                {fmtRelative(post.created_at)}
                              </span>
                            </div>
                            <span className="text-xs text-muted-foreground/60 shrink-0 ml-auto sm:hidden">
                              {fmtRelative(post.created_at)}
                            </span>
                          </div>

                          {/* Row 2: Title + optional badge */}
                          <div className="mb-2">
                            <h3 className="font-heading font-bold text-base text-foreground leading-snug line-clamp-2">
                              {post.title}
                            </h3>
                            {badge && (
                              <span className={`inline-block mt-2 px-2 py-0.5 text-xs rounded-full font-medium ${badge.cls}`}>
                                {badge.label}
                              </span>
                            )}
                          </div>

                          {/* Row 3: Preview */}
                          {post.content?.trim() && (
                            <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                              {post.content}
                            </p>
                          )}

                          {/* Row 4: Engagement */}
                          <div className="flex items-center gap-3 text-xs text-muted-foreground mt-2.5 pt-2.5 border-t border-border/20">
                            <button
                              onClick={e => handleLikePost(e, post)}
                              aria-label={liked ? "Unlike post" : "Like post"}
                              className={`flex items-center gap-1.5 hover:text-rose-500 transition-colors rounded focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-rose-400 ${liked ? "text-rose-500" : ""}`}
                            >
                              <Heart className={`h-3.5 w-3.5 ${liked ? "fill-rose-500 text-rose-500" : ""}`} />
                              {likeCount}
                            </button>
                            <button
                              onClick={e => { e.stopPropagation(); setSelectedPost(post); }}
                              aria-label="View replies"
                              className="flex items-center gap-1.5 hover:text-primary transition-colors rounded focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary/40"
                            >
                              <MessageCircle className="h-3.5 w-3.5" />
                              {post.reply_count || 0}
                            </button>
                            <span className="flex items-center gap-1.5">
                              <Eye className="h-3.5 w-3.5" />
                              {post.views || 0}
                            </span>
                          </div>
                        </article>
                      );
                    })}

                    {filteredPosts.length > visibleCount && (
                      <button
                        onClick={() => setVisibleCount(c => c + 8)}
                        className="w-full py-3 text-sm text-muted-foreground hover:text-foreground font-medium transition-colors"
                      >
                        Load more
                      </button>
                    )}
                    {filteredPosts.length > 0 && visibleCount >= filteredPosts.length && (
                      <p className="text-center text-xs text-muted-foreground py-3">You're all caught up 🌿</p>
                    )}
                  </div>
                )}
              </div>

              {/* RIGHT RAIL — desktop only, 3 focused widgets */}
              <div className="hidden lg:block lg:w-64 shrink-0 space-y-4">

                {/* 1. Notifications */}
                <div className="bg-card rounded-2xl border border-border/40 p-4 card-elevated">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-heading font-semibold text-sm text-foreground">Activity</h3>
                    {unreadActivity.length > 0 && (
                      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-primary/15 text-primary">
                        {unreadActivity.length} new
                      </span>
                    )}
                  </div>
                  {unreadActivity.length > 0 ? (
                    <div className="space-y-1.5">
                      {unreadActivity.slice(0, 3).map((n, i) => (
                        <Link
                          key={n.notification_id || i}
                          to={n.link || "#"}
                          onClick={() => n.notification_id && markNotificationRead(n.notification_id)}
                          className="flex items-start gap-2.5 p-2.5 rounded-xl bg-primary/5 border border-primary/10 hover:bg-primary/10 transition-colors group"
                        >
                          <span className="text-sm shrink-0 mt-0.5">{typeEmoji(n.type)}</span>
                          <p className="text-xs text-foreground line-clamp-2 flex-1 leading-relaxed group-hover:text-primary transition-colors">{n.message}</p>
                        </Link>
                      ))}
                      {unreadActivity.length > 3 && (
                        <button onClick={() => switchMode("catch-up")} className="text-xs text-primary font-medium hover:underline block px-2 pt-1">
                          See all {unreadActivity.length} →
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground px-1 py-2">
                      <span className="text-green-500">✓</span>
                      <span>You're all caught up</span>
                    </div>
                  )}
                </div>

                {/* 2. Live now */}
                <div className="bg-card rounded-2xl border border-border/40 p-4 card-elevated">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-heading font-semibold text-sm text-foreground flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse inline-block shrink-0" />
                      Live now
                    </h3>
                    <Link to="/chat" className="text-[11px] text-muted-foreground hover:text-foreground transition-colors">See all</Link>
                  </div>
                  <div className="space-y-1">
                    {namedRooms.length === 0 ? (
                      <p className="text-xs text-muted-foreground px-1 py-2">Quiet right now — check back soon 🌿</p>
                    ) : namedRooms.slice(0, 3).map(r => (
                      <Link key={r.href} to={r.href} className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-secondary/50 transition-colors group">
                        <span className="text-base w-7 text-center shrink-0">{r.icon}</span>
                        <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors flex-1 truncate">{r.name}</p>
                        {r.count > 0 ? (
                          <span className="text-xs text-muted-foreground shrink-0">{r.count}</span>
                        ) : (
                          <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse shrink-0" />
                        )}
                      </Link>
                    ))}
                  </div>
                </div>

                {/* 3. Suggested spaces */}
                <div className="bg-card rounded-2xl border border-border/40 p-4 card-elevated">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-heading font-semibold text-sm text-foreground">Spaces for you</h3>
                    <Link to="/forums" className="text-[11px] text-muted-foreground hover:text-foreground transition-colors">Browse</Link>
                  </div>
                  <RecommendedSpaces user={user} />
                </div>

              </div>
            </div>
          </>
        )}

        {/* ════════════════════════════════════════════════════════════
            MODE: Catch up
        ════════════════════════════════════════════════════════════ */}
        {dashMode === "catch-up" && (
          <div className="space-y-4">

            {/* Notifications */}
            <div className="bg-card rounded-2xl border border-border/40 p-4">
              <h3 className="font-heading font-semibold text-sm text-foreground mb-3">
                {unreadActivity.length > 0
                  ? `${unreadActivity.length} thing${unreadActivity.length === 1 ? "" : "s"} to check`
                  : "You're all caught up ✓"}
              </h3>

              {recentActivity.length === 0 ? (
                <div className="py-4 space-y-2">
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Replies, likes, and friend requests will show up here as you get involved.
                  </p>
                  <Link to="/create-post" className="text-xs text-primary font-medium hover:underline block">
                    Post something to get the ball rolling →
                  </Link>
                </div>
              ) : (
                <div className="space-y-1.5">
                  {recentActivity.slice(0, 6).map((n, i) => (
                    <Link
                      key={n.notification_id || i}
                      to={n.link || "#"}
                      onClick={() => n.notification_id && !n.is_read && markNotificationRead(n.notification_id)}
                      className={`flex items-start gap-2.5 p-2.5 rounded-xl transition-colors group ${
                        !n.is_read
                          ? "bg-primary/5 border border-primary/10 hover:bg-primary/10"
                          : "hover:bg-secondary/50"
                      }`}
                    >
                      <span className={`text-sm shrink-0 mt-0.5 ${n.is_read ? "opacity-50" : ""}`}>{typeEmoji(n.type)}</span>
                      <p className={`text-xs line-clamp-2 flex-1 leading-relaxed group-hover:text-foreground transition-colors ${n.is_read ? "text-foreground/60" : "text-foreground"}`}>
                        {n.message}
                      </p>
                      <span className="text-[10px] text-muted-foreground/60 shrink-0 whitespace-nowrap mt-0.5">{fmtRelative(n.created_at)}</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* What parents are talking about */}
            {todaysPosts.length > 0 && (
              <div className="bg-card rounded-2xl border border-border/40 p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-heading font-semibold text-sm text-foreground">What parents are talking about</h3>
                  <Link to="/forums" className="text-[11px] text-muted-foreground hover:text-foreground transition-colors">Browse spaces</Link>
                </div>
                <div className="space-y-1">
                  {todaysPosts.map((post, i) => (
                    <Link key={post.post_id} to={`/forums/post/${post.post_id}`} className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-secondary/50 transition-colors group">
                      <span className="text-sm font-bold text-muted-foreground/30 shrink-0 mt-0.5 w-4 text-right">{i + 1}</span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors line-clamp-2 leading-snug">
                          {post.title}
                        </p>
                        <div className="flex items-center gap-2 mt-1 text-[11px] text-muted-foreground">
                          <span>{post.category_icon} {post.category_name}</span>
                          <span>·</span>
                          <span>{post.reply_count || 0} replies</span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Events */}
            {!isFree && (
              <div className="bg-card rounded-2xl border border-border/40 p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-heading font-semibold text-sm text-foreground">Coming up near you</h3>
                  <Link to="/events" className="text-[11px] text-muted-foreground hover:text-foreground transition-colors">See all</Link>
                </div>
                {nearbyEvents.length === 0 ? (
                  <Link to="/events" className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-secondary/50 transition-colors group">
                    <span className="text-xl shrink-0">📅</span>
                    <p className="text-xs text-muted-foreground group-hover:text-foreground transition-colors">Browse events near you</p>
                  </Link>
                ) : (
                  <div className="space-y-1">
                    {nearbyEvents.slice(0, 3).map((ev, i) => {
                      const dateObj = ev.date ? new Date(...ev.date.split("-").map((v, j) => j === 1 ? +v - 1 : +v)) : null;
                      const day = dateObj ? dateObj.getDate() : "?";
                      const mon = dateObj ? dateObj.toLocaleString("en-AU", { month: "short" }) : "";
                      return (
                        <Link key={ev.event_id || i} to="/events" className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-secondary/50 transition-colors group">
                          <div className="w-9 h-9 rounded-lg bg-primary/15 text-primary flex flex-col items-center justify-center shrink-0">
                            <span className="text-xs font-bold leading-none">{day}</span>
                            <span className="text-[9px] uppercase">{mon}</span>
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">{ev.title}</p>
                            <p className="text-xs text-muted-foreground truncate">
                              {ev.suburb || ev.venue_name || ""}{ev.distance_km ? ` · ${Math.round(ev.distance_km)} km away` : ""}
                            </p>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Communities quick jump */}
            {userCommunities.length > 0 && (
              <div className="bg-card rounded-2xl border border-border/40 p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-heading font-semibold text-sm text-foreground">Your communities</h3>
                  <Link to="/forums?tab=communities" className="text-[11px] text-muted-foreground hover:text-foreground transition-colors">See all</Link>
                </div>
                <div className="space-y-1">
                  {userCommunities.slice(0, 4).map(c => (
                    <Link key={c.category_id} to={`/community/${c.category_id}`} className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-secondary/50 transition-colors group">
                      <span className="text-base w-7 text-center shrink-0">{c.icon || "💬"}</span>
                      <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors flex-1 truncate">{c.name}</p>
                      {c.member_count > 0 && (
                        <span className="text-xs text-muted-foreground shrink-0">{c.member_count} members</span>
                      )}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Active chats */}
            {namedRooms.length > 0 && (
              <div className="bg-card rounded-2xl border border-border/40 p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-heading font-semibold text-sm text-foreground flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse inline-block shrink-0" />
                    Group Chats — live now
                  </h3>
                  <Link to="/chat" className="text-[11px] text-muted-foreground hover:text-foreground transition-colors">See all</Link>
                </div>
                <div className="space-y-1">
                  {namedRooms.slice(0, 3).map(r => (
                    <Link key={r.href} to={r.href} className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-secondary/50 transition-colors group">
                      <span className="text-base w-7 text-center shrink-0">{r.icon}</span>
                      <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors flex-1 truncate">{r.name}</p>
                      {r.count > 0 ? (
                        <span className="text-xs text-muted-foreground shrink-0">{r.count} online</span>
                      ) : (
                        <span className="flex items-center gap-1 text-xs text-green-500 shrink-0">
                          <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                          Active
                        </span>
                      )}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <AppFooter />
      </main>

      {/* Quick-view thread modal */}
      {selectedPost && (
        <QuickThreadView
          post={selectedPost}
          liked={postLikes[selectedPost.post_id]?.liked ?? selectedPost.user_liked}
          likeCount={postLikes[selectedPost.post_id]?.count ?? selectedPost.like_count ?? 0}
          onLike={e => handleLikePost(e, selectedPost)}
          onClose={() => setSelectedPost(null)}
          onReplied={() => {
            setPosts(prev => prev.map(p =>
              p.post_id === selectedPost.post_id
                ? { ...p, reply_count: (p.reply_count || 0) + 1 }
                : p
            ));
          }}
          apiUrl={API_URL}
          user={user}
        />
      )}
    </div>
  );
}
