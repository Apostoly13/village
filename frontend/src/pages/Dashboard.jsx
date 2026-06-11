import { useState, useEffect, useMemo } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import Navigation from "../components/Navigation";
// OnboardingModal removed — onboarding is now a standalone page at /onboarding
import { Search, Plus, MessageCircle, Heart, Eye, Sparkles, X, Bell, Moon, ChevronRight, Pencil, Check } from "lucide-react";
import { IconCheck, IconLock, IconShield, IconChat, IconCal } from "../icons";
import { Stall as StallIcon } from "../components/village/icons";
import RecommendedSpaces from "../components/RecommendedSpaces";
import AppFooter from "../components/AppFooter";
import { timeAgoVerbose } from "../utils/dateHelpers";

const API_URL = process.env.REACT_APP_BACKEND_URL;

// ── Helpers ───────────────────────────────────────────────────────────────────

function typeIcon(type) {
  if (type === "reply")          return <IconChat size={14} />;
  if (type === "like")           return <span style={{ fontSize: 14 }}>♥</span>;
  if (type === "friend_request") return <span style={{ fontSize: 14 }}>👋</span>;
  if (type === "friend_accept")  return <IconCheck size={14} />;
  if (type === "moderation")     return <IconShield size={14} />;
  return <Bell className="h-3.5 w-3.5" />;
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
              className="text-xs font-medium hover:underline px-2 py-1 rounded-lg hover:bg-muted/50 transition-colors" style={{ color: "var(--clay)" }}
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
                <AvatarFallback className="text-xs">
                  {post.is_anonymous ? "?" : post.author_name?.[0]?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-xs font-medium text-foreground">{post.is_anonymous ? "Anonymous" : post.author_name}</p>
                <p className="text-xs text-muted-foreground">{post.category_name}</p>
              </div>
            </div>
            <h2 className="font-heading font-medium text-sm text-foreground mb-2 leading-snug">{post.title}</h2>
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
                <div key={reply.reply_id || idx} className={`flex gap-2.5 ${reply.depth > 0 ? "ml-6 pl-3 border-l-2 border-[var(--line)]" : ""}`}>
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
        className="flex-1 bg-secondary/50 rounded-xl px-3 py-2 text-sm outline-none border border-transparent"
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
  const [onlineCount, setOnlineCount] = useState(null);
  const [activeRoomsCount, setActiveRoomsCount] = useState(null);
  const [nightOwl3amRoom, setNightOwl3amRoom] = useState(null);
  const [recentActivity, setRecentActivity] = useState([]);
  const [userCommunities, setUserCommunities] = useState([]);
  const [showDowngradeNotice, setShowDowngradeNotice] = useState(false);
  const [pinnedAnnouncements, setPinnedAnnouncements] = useState([]);
  const [dismissedAnnouncements, setDismissedAnnouncements] = useState(() => {
    try { return JSON.parse(localStorage.getItem("village_dismissed_announcements") || "[]"); } catch { return []; }
  });
  // Live gender — starts from prop, updates instantly when profile is saved
  const [liveGender, setLiveGender] = useState(user?.gender);

  // ── Custom shortcuts (localStorage, per device) ───────────────────────────
  const [shortcuts, setShortcuts] = useState(() => {
    try { return JSON.parse(localStorage.getItem("village_shortcuts") || "[]"); } catch { return []; }
  });
  const [editingShortcuts, setEditingShortcuts] = useState(false);

  const saveShortcuts = (updated) => {
    setShortcuts(updated);
    try { localStorage.setItem("village_shortcuts", JSON.stringify(updated)); } catch {}
  };
  const addShortcut = (s) => {
    if (shortcuts.some(x => x.href === s.href)) return; // no dupes
    if (shortcuts.length >= 8) return; // max 8
    saveShortcuts([...shortcuts, s]);
  };
  const removeShortcut = (href) => saveShortcuts(shortcuts.filter(s => s.href !== href));

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

    const activeRooms = activeRoomsCount || 0;
    if (replies.length && nearbyEvents.length) {
      sentence = `${replies.length === 1 ? "Someone replied to your post" : `${replies.length} parents replied to your posts`} and there ${nearbyEvents.length === 1 ? "is" : "are"} ${nearbyEvents.length} ${nearbyEvents.length === 1 ? "event" : "events"} near ${suburb}.`;
      if (activeRooms) chips.push({ emoji: "🌿", text: `${activeRooms} chat ${activeRooms === 1 ? "room" : "rooms"} active now` });
    } else if (replies.length) {
      sentence = replies.length === 1 ? "Someone replied to your post — check in when you're ready." : `${replies.length} parents replied to your posts. Check in when you're ready.`;
      if (nearbyEvents.length) chips.push({ emoji: "📅", text: `${nearbyEvents.length} events near ${suburb}` });
      if (activeRooms) chips.push({ emoji: "🌿", text: `${activeRooms} chat ${activeRooms === 1 ? "room" : "rooms"} active now` });
    } else if (likes.length) {
      sentence = `${likes.length} ${likes.length === 1 ? "parent found" : "parents found"} your posts helpful recently.`;
      if (nearbyEvents.length) chips.push({ emoji: "📅", text: `${nearbyEvents.length} events near ${suburb}` });
      if (activeRooms) chips.push({ emoji: "🌿", text: `${activeRooms} chat ${activeRooms === 1 ? "room" : "rooms"} active now` });
    } else if (friends.length) {
      sentence = `You have ${friends.length} friend ${friends.length === 1 ? "request" : "requests"} from the village.`;
      if (activeRooms) chips.push({ emoji: "🌿", text: `${activeRooms} chat ${activeRooms === 1 ? "room" : "rooms"} active now` });
    } else if (activeRooms && nearbyEvents.length) {
      sentence = `${activeRooms} chat ${activeRooms === 1 ? "room is" : "rooms are"} active and ${nearbyEvents.length} ${nearbyEvents.length === 1 ? "event" : "events"} near ${suburb}.`;
    } else if (activeRooms) {
      sentence = `${activeRooms} chat ${activeRooms === 1 ? "room is" : "rooms are"} active right now — good time to join.`;
    } else if (nearbyEvents.length) {
      sentence = `There ${nearbyEvents.length === 1 ? "is" : "are"} ${nearbyEvents.length} ${nearbyEvents.length === 1 ? "event" : "events"} near ${suburb} coming up.`;
    }

    return { sentence, chips: chips.slice(0, 2) };
  }, [recentActivity, nearbyEvents, busyChatRooms, activeRoomsCount, user]);

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
      fetchPinnedAnnouncements(),
      fetchOnlineCount(),
      ...(user?.subscription_tier === "premium" ? [fetchUserCommunities()] : []),
    ]);
    // Refresh online/room count every 30s so it stays live while the user browses
    // (heartbeat to keep the user counted runs in Navigation.jsx via the 20s poll)
    const onlineInterval = setInterval(() => {
      if (!document.hidden) fetchOnlineCount();
    }, 30000);

    // Listen for profile updates — re-apply gender filter on rooms instantly
    const handleProfileUpdate = (e) => {
      if (e.detail?.gender !== undefined) {
        setLiveGender(e.detail.gender);
        fetchBusyChatRooms(e.detail.gender);
      }
    };
    window.addEventListener("village:profileUpdated", handleProfileUpdate);

    // When a DM is read anywhere (popout, Messages page), instantly clear dm/message_request
    // entries from the dashboard "things to check" section without requiring a refresh
    const handleDmRead = () => {
      setRecentActivity(prev =>
        prev.map(n =>
          n.type === "dm" || n.type === "message_request" ? { ...n, is_read: true } : n
        )
      );
    };
    window.addEventListener("village:dm-read", handleDmRead);

    return () => {
      clearInterval(onlineInterval);
      window.removeEventListener("village:profileUpdated", handleProfileUpdate);
      window.removeEventListener("village:dm-read", handleDmRead);
    };
  }, [user]);

  // Cache TTL: 5 minutes — skip revalidation for fresh caches
  const CACHE_TTL_MS = 5 * 60 * 1000;
  const readCache = (key) => {
    try {
      const raw = sessionStorage.getItem(key);
      if (!raw) return null;
      const { data, ts } = JSON.parse(raw);
      if (Date.now() - ts > CACHE_TTL_MS) return null; // expired
      return data;
    } catch { return null; }
  };
  const writeCache = (key, data) => {
    try { sessionStorage.setItem(key, JSON.stringify({ data, ts: Date.now() })); } catch {}
  };

  const fetchFeed = async () => {
    // Stale-while-revalidate: show cached data instantly, refresh in background
    const cached = readCache("village_feed_cache");
    if (cached) { setPosts(cached); setLoading(false); }
    try {
      const res = await fetch(`${API_URL}/api/feed`, { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setPosts(data);
        writeCache("village_feed_cache", data);
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const fetchTodaysPosts = async () => {
    const cached = readCache("village_trending_cache");
    if (cached) { setTodaysPosts(cached); return; } // fresh — skip fetch
    try {
      const res = await fetch(`${API_URL}/api/forums/posts/trending?limit=3`, { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setTodaysPosts(data);
        writeCache("village_trending_cache", data);
      }
    } catch {}
  };

  const fetchNearbyEvents = async () => {
    const cached = readCache("village_events_cache");
    if (cached) { setNearbyEvents(cached); return; } // fresh — skip fetch
    try {
      const res = await fetch(`${API_URL}/api/events?distance_km=25&limit=2`, { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setNearbyEvents(data);
        writeCache("village_events_cache", data);
      }
    } catch {}
  };

  const fetchSubscription = async () => {
    try {
      const res = await fetch(`${API_URL}/api/subscription/status`, { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setSubscription(data);
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
          ...(data.my_area_room ? [data.my_area_room] : []),
          ...(data.my_suburb_room ? [data.my_suburb_room] : []),
        ];

        // Filter out gender-restricted rooms — only exact gender match sees restricted rooms
        // genderOverride is passed when triggered by a profile update event (avoids stale closure)
        const g = genderOverride !== undefined ? genderOverride : (liveGender ?? user?.gender);
        const accessible = allRooms.filter(r => {
          const restriction = r.gender_restriction;
          if (!restriction) return true;
          if (restriction === "female" && g !== "female") return false;
          if (restriction === "male"&& g !== "male")   return false;
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

  const fetchPinnedAnnouncements = async () => {
    try {
      const res = await fetch(`${API_URL}/api/announcements/active`, { credentials: "include" });
      if (res.ok) setPinnedAnnouncements(await res.json());
    } catch {}
  };

  const fetchOnlineCount = async () => {
    try {
      const res = await fetch(`${API_URL}/api/stats/online`);
      if (res.ok) {
        const data = await res.json();
        setOnlineCount(data.online_now ?? null);
        setActiveRoomsCount(data.active_rooms ?? null);
      }
    } catch {}
  };

  const dismissAnnouncement = (id) => {
    const updated = [...dismissedAnnouncements, id];
    setDismissedAnnouncements(updated);
    try { localStorage.setItem("village_dismissed_announcements", JSON.stringify(updated)); } catch {}
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

  const firstName = user?.nickname || user?.first_name || user?.name?.split(" ")[0] || "there";
  const unreadActivity = recentActivity.filter(n => !n.is_read);
  const isFree = user?.subscription_tier === "free";

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background lg:pl-60 lg:pb-8" style={{ backgroundImage: "var(--ambient-bg)" }}>
      <Navigation user={user} />

      <main className="max-w-5xl mx-auto px-4 pt-16 lg:pt-8">

        {/* ── Pinned admin announcements ── */}
        {pinnedAnnouncements
          .filter(a => !dismissedAnnouncements.includes(a.announcement_id))
          .map(a => (
            <div key={a.announcement_id} className="mb-4 rounded-2xl p-4 bg-[var(--paper-3)] border border-[var(--line)] shadow-sm">
              <div className="flex items-start gap-3">
                <span className="text-xl shrink-0">📢</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground leading-snug">{a.title}</p>
                  <p className="text-sm text-muted-foreground leading-relaxed mt-0.5">{a.message}</p>
                  <div className="flex items-center gap-3 mt-2">
                    {a.link && (
                      <a
                        href={a.link.startsWith("http") ? a.link : a.link}
                        {...(a.link.startsWith("http") ? { target: "_blank", rel: "noreferrer" } : {})}
                        className="text-xs font-medium hover:underline" style={{ color: "var(--clay)" }}
                      >
                        Learn more →
                      </a>
                    )}
                    <button
                      onClick={() => dismissAnnouncement(a.announcement_id)}
                      className="text-xs text-muted-foreground hover:text-foreground transition-colors ml-auto flex items-center gap-1"
                    >
                      <X className="h-3 w-3" />Dismiss
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        }

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
                    <p className="text-xs font-semibold text-foreground mb-1.5 flex items-center gap-1">Still with you <IconCheck size={12} /></p>
                    <ul className="space-y-1 text-xs text-muted-foreground">
                      <li>• 5 Space posts per week</li>
                      <li>• 5 Space replies per week</li>
                      <li>• 10 Group Chat messages per day</li>
                      <li>• Anonymous posting — always free</li>
                      <li>• Reading all posts and comments</li>
                    </ul>
                  </div>
                  <div className="rounded-xl bg-secondary/40 p-3">
                    <p className="text-xs font-semibold text-foreground mb-1.5 flex items-center gap-1">Now locked <IconLock size={12} /></p>
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
                  After your trial you'll have limited functionality.{" "}
                  <Link to="/plus" className="text-primary underline">See what's included</Link> or{" "}
                  <Link to="/plus" className="text-primary underline font-medium">upgrade to Village+</Link> to keep full access.
                </p>
              </div>
            </div>
          );
        })()}

        {/* ── Hero ── */}
        <div className="mb-5 px-1">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <p className="tv-mono mb-1.5" style={{ color: "var(--ink-3)" }}>
                {new Date().toLocaleDateString("en-AU", { weekday: "long" })} · {new Date().toLocaleTimeString("en-AU", { hour: "numeric", minute: "2-digit" })}
              </p>
              <h1
                className="text-2xl sm:text-3xl font-medium leading-tight mb-1"
                style={{ fontFamily: "var(--serif)", letterSpacing: "-0.02em", color: "var(--ink)" }}
              >
                {(() => {
                  const h = new Date().getHours();
                  const greeting = h < 12 ? "Morning" : h < 17 ? "Afternoon" : "Evening";
                  return <>{greeting}, <em style={{ fontStyle: "italic", color: "hsl(var(--accent))" }}>{firstName}</em>.</>;
                })()}
              </h1>
              {/* Parenting stage + location subtitle */}
              {(() => {
                const STAGE_LABELS = {
                  expecting: "Expecting", newborn: "Newborn", infant: "Baby (0–12 months)",
                  toddler: "Toddler", school_age: "School Age", teenager: "Teenager",
                  multiples: "Twins/Multiples", mixed: "Mixed Ages",
                };
                const stage = user?.parenting_stage ? STAGE_LABELS[user.parenting_stage] : null;
                const location = user?.suburb || null;
                const hasContext = stage || location;
                return hasContext ? (
                  <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                    {stage && (
                      <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full" style={{ background: "var(--paper-3)", border: "1px solid var(--line)", color: "var(--ink-3)" }}>
                        <span style={{ fontSize: "10px" }}>👶</span> {stage}
                      </span>
                    )}
                    {location && (
                      <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full" style={{ background: "var(--paper-3)", border: "1px solid var(--line)", color: "var(--ink-3)" }}>
                        <span style={{ fontSize: "10px" }}>📍</span> {location}
                      </span>
                    )}
                  </div>
                ) : (
                  <p className="text-sm mt-1" style={{ color: "var(--ink-3)" }}>Your village is here whenever you need it.</p>
                );
              })()}
            </div>
            {/* Live stats — right-aligned */}
            {(onlineCount > 0 || activeRoomsCount > 0) && (
              <div className="flex flex-col items-end gap-1.5 shrink-0 pt-5">
                {onlineCount > 0 && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] rounded-[8px]" style={{ background: "var(--paper-3)", border: "1px solid var(--line)", color: "var(--ink-2)" }}>
                    <span className="w-1.5 h-1.5 rounded-full shrink-0 animate-pulse" style={{ background: "#4ade80", boxShadow: "0 0 5px rgba(74,222,128,0.5)" }} />
                    {onlineCount} online
                  </span>
                )}
                {activeRoomsCount > 0 && (
                  <Link to="/chat" className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] rounded-[8px] hover:opacity-80 transition-opacity" style={{ background: "var(--paper-3)", border: "1px solid var(--line)", color: "var(--ink-2)" }}>
                    <IconChat size={11} style={{ color: "var(--clay)", flexShrink: 0 }} />
                    {activeRoomsCount} {activeRoomsCount === 1 ? "room" : "rooms"} active
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ── Night Owl 3am Club banner ── */}
        {nightOwl3amRoom && (
          <Link to={nightOwl3amRoom.href} className="block mb-5">
            <div
              className="rounded-2xl p-4 flex items-center gap-4 transition-all"
              style={{
                background: "var(--honey-wash)",
                border: "1px solid rgba(217,161,91,0.35)",
                boxShadow: "var(--glow, none)",
              }}
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: "rgba(217,161,91,0.18)" }}
              >
                <Moon size={22} style={{ color: "var(--honey)" }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="w-1.5 h-1.5 rounded-full animate-pulse shrink-0" style={{ background: "var(--honey)" }} />
                  <span className="tv-mono" style={{ color: "var(--honey)" }}>Night Owl hours · Active now</span>
                </div>
                <p className="font-heading font-semibold text-sm" style={{ color: "var(--ink)" }}>The 3am Club is active</p>
                <p className="text-xs" style={{ color: "var(--ink-2)" }}>Late-night company for those who can't sleep. You're not alone.</p>
              </div>
              <ChevronRight size={16} style={{ color: "var(--honey)", flexShrink: 0 }} />
            </div>
          </Link>
        )}

        {/* ══ Unified 2-column layout ══════════════════════════════════
            Left: all primary content (actions → spaces preview → feed)
            Right: persistent contextual rail (rooms, events, activity)
        ══════════════════════════════════════════════════════════════ */}
        <div className="flex flex-col lg:flex-row gap-5">

          {/* ─── LEFT COLUMN ───────────────────────────────────────────── */}
          <div className="flex-1 min-w-0 space-y-4">

            {/* Quick Actions */}
            <div className="grid grid-cols-3 gap-3">
              <Link to="/create-post" className="village-card village-card-hover p-4 flex flex-col items-center gap-2 text-center">
                <span className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ background: "var(--clay-wash)", color: "var(--clay)" }}>
                  <Plus className="h-4 w-4" />
                </span>
                <p className="text-xs font-semibold" style={{ color: "var(--ink)" }}>New Post</p>
              </Link>
              <Link to="/chat" className="village-card village-card-hover p-4 flex flex-col items-center gap-2 text-center">
                <span className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ background: "var(--sage-wash)", color: "var(--sage-deep)" }}>
                  <IconChat size={18} />
                </span>
                <p className="text-xs font-semibold" style={{ color: "var(--ink)" }}>Join a Chat</p>
              </Link>
              {isFree ? (
                <Link to="/plus" className="village-card village-card-hover p-4 flex flex-col items-center gap-2 text-center relative">
                  <span className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ background: "var(--honey-wash)", color: "var(--clay)" }}>
                    <StallIcon size={18} strokeWidth={1.5} />
                  </span>
                  <p className="text-xs font-semibold" style={{ color: "var(--ink)" }}>Village Stall</p>
                  <IconLock size={10} className="absolute top-2.5 right-2.5" style={{ color: "var(--ink-3)" }} />
                </Link>
              ) : (
                <Link to="/stall" className="village-card village-card-hover p-4 flex flex-col items-center gap-2 text-center">
                  <span className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ background: "var(--honey-wash)", color: "var(--clay)" }}>
                    <StallIcon size={18} strokeWidth={1.5} />
                  </span>
                  <p className="text-xs font-semibold" style={{ color: "var(--ink)" }}>Browse Stall</p>
                </Link>
              )}
            </div>

            {/* Recent in Spaces — compact preview above the feed */}
            <div className="village-card p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-heading font-semibold text-sm" style={{ color: "var(--ink)" }}>Recent in Spaces</h3>
                <Link to="/forums" className="text-[11px] text-muted-foreground hover:text-foreground transition-colors">See all →</Link>
              </div>
              {posts.length === 0 ? (
                <div className="space-y-2">
                  {[1,2,3].map(i => <div key={i} className="h-13 rounded-xl bg-[var(--paper-3)] animate-pulse" />)}
                </div>
              ) : (
                <div className="divide-y" style={{ borderColor: "var(--line)" }}>
                  {posts.slice(0, 3).map((post) => (
                    <Link
                      key={post.post_id}
                      to={`/forums/post/${post.post_id}`}
                      className="flex items-start gap-3 py-2.5 first:pt-0 last:pb-0 hover:opacity-75 transition-opacity group"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span className="text-[11px] truncate" style={{ color: "var(--ink-3)" }}>
                            {post.category_icon} {post.category_name}
                          </span>
                          <span className="text-[10px] ml-auto shrink-0" style={{ color: "var(--ink-3)" }}>
                            {fmtRelative(post.updated_at && post.updated_at !== post.created_at ? post.updated_at : post.created_at)}
                          </span>
                        </div>
                        <p className="text-sm font-medium line-clamp-1 leading-snug" style={{ color: "var(--ink)" }}>{post.title}</p>
                      </div>
                      <div className="flex items-center gap-2.5 shrink-0 pt-0.5">
                        <span className="flex items-center gap-1 text-[11px]" style={{ color: "var(--ink-3)" }}>
                          <MessageCircle className="h-3 w-3" />{post.reply_count || 0}
                        </span>
                        <span className="flex items-center gap-1 text-[11px]" style={{ color: "var(--ink-3)" }}>
                          <Heart className="h-3 w-3" />{post.like_count || 0}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Search + filter pills */}
            <div className="space-y-3">
              <div className="flex gap-2.5 overflow-visible">
                <form onSubmit={handleSearch} className="flex-1 relative overflow-visible">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Search posts and spaces..."
                    className="pl-11 h-11 rounded-xl bg-card border-border/50"
                    data-testid="search-input"
                  />
                </form>
                <Link to="/create-post">
                  <Button className="h-11 px-5 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 whitespace-nowrap" data-testid="create-post-btn">
                    <Plus className="h-4 w-4 mr-2" />New Post
                  </Button>
                </Link>
              </div>
              <div className="overflow-x-auto scrollbar-none py-2 -mx-4 px-4 sm:mx-0 sm:px-0">
                <div className="flex gap-1 min-w-max pl-0.5 pr-4 sm:pr-0">
                  {FEED_FILTERS.map(f => (
                    <button
                      key={f.id}
                      onClick={() => { setFeedFilter(f.id); setVisibleCount(8); }}
                      className={`px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors shrink-0 focus-visible:outline-none border ${
                        feedFilter === f.id
                          ? "border-[var(--sage)]/30 sage-pill-active"
                          : "border-transparent text-[var(--ink-3)] hover:text-[var(--ink)]"
                      }`}
                      style={feedFilter === f.id ? { background: "var(--sage-wash)", color: "var(--sage-deep)" } : {}}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>


            {/* Feed */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-heading font-semibold text-foreground text-base">
                  {feedFilter === "latest"   && "Latest conversations"}
                  {feedFilter === "trending" && "Trending discussions"}
                  {feedFilter === "nearby"   && "Near you"}
                  {feedFilter === "support"  && "Support needed"}
                  {feedFilter === "unread"   && "Unread"}
                </h2>
                {feedFilter !== "latest" ? (
                  <button onClick={() => { setFeedFilter("latest"); setVisibleCount(8); }} className="text-xs text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:underline">
                    Clear filter
                  </button>
                ) : (
                  <Link to="/forums" className="text-[11px] text-muted-foreground hover:text-foreground transition-colors">Browse all →</Link>
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
                  <div className="text-center py-12 village-card">
                    <MessageCircle size={28} style={{ color: "var(--ink-3)", margin: "0 auto 12px" }} />
                    <h3 className="font-heading font-semibold mb-1" style={{ color: "var(--ink)" }}>
                      {feedFilter !== "latest" ? "Nothing here right now" : "Nothing here yet"}
                    </h3>
                    <p className="mb-4" style={{ fontFamily: "var(--serif)", fontStyle: "italic", fontSize: 13, color: "var(--ink-3)" }}>
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
                          className="village-card village-card-hover !rounded-2xl px-4 py-3.5 cursor-pointer focus-visible:outline-none"
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
                                  <AvatarFallback className="text-xs">
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
                                  className="text-sm font-medium text-foreground hover:text-foreground transition-colors truncate"
                                  onClick={e => e.stopPropagation()}
                                >
                                  {post.author_name}
                                </Link>
                              )}
                              {post.author_subscription_tier === "premium" && !isAnon && (
                                <Sparkles className="h-3 w-3 shrink-0" style={{ color: "hsl(var(--accent))" }} />
                              )}
                              <span
                                className="tv-mono shrink-0 hidden sm:inline"
                                style={{ color: "var(--ink-3)" }}
                              >
                                {post.is_community_post && (
                                  <span className="inline-flex items-center gap-0.5 mr-1.5 px-1.5 py-0.5 rounded-full text-[8px] font-semibold uppercase tracking-wide" style={{ background: "hsl(var(--accent)/0.12)", color: "hsl(var(--accent))" }}>
                                    Community
                                  </span>
                                )}
                                {post.category_name} · {(() => {
                                  const hasActivity = post.reply_count > 0 && post.updated_at && post.updated_at !== post.created_at;
                                  return hasActivity
                                    ? <span>last reply {fmtRelative(post.updated_at)}</span>
                                    : fmtRelative(post.created_at);
                                })()}
                              </span>
                            </div>
                            <span
                              className="tv-mono shrink-0 ml-auto sm:hidden"
                              style={{ color: "var(--ink-3)" }}
                            >
                              {post.reply_count > 0 && post.updated_at && post.updated_at !== post.created_at
                                ? fmtRelative(post.updated_at)
                                : fmtRelative(post.created_at)}
                            </span>
                          </div>

                          {/* Row 2: Title + optional badge */}
                          <div className="mb-2">
                            <h3 className="font-heading font-medium text-base text-foreground leading-snug line-clamp-2">
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
                              className="flex items-center gap-1.5 hover:text-foreground transition-colors rounded focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary/40"
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
            {/* end feed */}

          </div>
          {/* end left column */}

          {/* ─── RIGHT RAIL — desktop only ─────────────────────────────── */}
          <div className="hidden lg:flex lg:flex-col lg:w-72 shrink-0 gap-4">

            {/* 1. Activity — top priority */}
            <div className="village-card p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-heading font-semibold text-sm text-foreground">Activity</h3>
                {unreadActivity.length > 0 && (
                  <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full" style={{ background: "var(--honey-wash)", color: "var(--honey)" }}>
                    {unreadActivity.length} new
                  </span>
                )}
              </div>
              {unreadActivity.length > 0 ? (
                <div className="space-y-1.5">
                  {unreadActivity.slice(0, 3).map((n, i) => {
                    // Resolve the best destination for each notification type
                    const dest = n.link || (
                      n.type === "friend_request" || n.type === "friend_accept" ? "/friends" :
                      n.type === "dm" || n.type === "message_request" ? "/messages" : null
                    );
                    const inner = (
                      <>
                        <span className="shrink-0 mt-0.5 flex items-center">{typeIcon(n.type)}</span>
                        <p className="text-xs text-foreground line-clamp-2 flex-1 leading-relaxed">{n.message}</p>
                      </>
                    );
                    const cls = "flex items-start gap-2.5 p-2.5 rounded-xl hover:bg-muted/50 transition-colors cursor-pointer";
                    const style = { background: "var(--paper-3)", border: "1px solid rgba(74,113,85,0.08)" };
                    return dest ? (
                      <Link
                        key={n.notification_id || i}
                        to={dest}
                        onClick={() => n.notification_id && markNotificationRead(n.notification_id)}
                        className={cls}
                        style={style}
                      >
                        {inner}
                      </Link>
                    ) : (
                      <button
                        key={n.notification_id || i}
                        onClick={() => n.notification_id && markNotificationRead(n.notification_id)}
                        className={`${cls} w-full text-left`}
                        style={style}
                      >
                        {inner}
                      </button>
                    );
                  })}
                  {unreadActivity.length > 3 && (
                    <button
                      onClick={() => window.dispatchEvent(new CustomEvent("village:open-notifications"))}
                      className="text-xs font-medium hover:underline block px-2 pt-1" style={{ color: "var(--clay)" }}
                    >
                      See all {unreadActivity.length} →
                    </button>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground px-1 py-2">
                  <IconCheck size={14} style={{ color: "var(--status-online)" }} />
                  <span>You're all caught up</span>
                </div>
              )}
            </div>

            {/* 2. Events near you */}
            <div className="village-card p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-heading font-semibold text-sm text-foreground">Events near you</h3>
                <Link to="/events" className="text-[11px] text-muted-foreground hover:text-foreground transition-colors">See all</Link>
              </div>
              {!user?.suburb && !user?.state ? (
                <Link to="/profile" className="flex items-start gap-2 p-2 rounded-xl hover:bg-secondary/50 transition-colors group">
                  <IconCal size={15} className="shrink-0 mt-0.5" style={{ color: "var(--ink-3)" }} />
                  <p className="text-xs leading-relaxed text-muted-foreground group-hover:text-foreground transition-colors">Add your location to see local events</p>
                </Link>
              ) : nearbyEvents.length === 0 ? (
                <Link to="/events" className="flex items-center gap-2 p-2 rounded-xl hover:bg-secondary/50 transition-colors group">
                  <IconCal size={15} className="shrink-0" style={{ color: "var(--ink-3)" }} />
                  <p className="text-xs text-muted-foreground group-hover:text-foreground transition-colors">Browse events near you</p>
                </Link>
              ) : (
                <div className="space-y-0.5">
                  {nearbyEvents.slice(0, 3).map((ev, i) => {
                    const dateObj = ev.date ? new Date(...ev.date.split("-").map((v, j) => j === 1 ? +v - 1 : +v)) : null;
                    const day = dateObj ? dateObj.getDate() : "?";
                    const mon = dateObj ? dateObj.toLocaleString("en-AU", { month: "short" }) : "";
                    return (
                      <Link key={ev.event_id || i} to="/events" className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-secondary/50 transition-colors group">
                        <div className="w-9 h-9 rounded-lg flex flex-col items-center justify-center shrink-0" style={{ background: "var(--honey-wash)", color: "var(--honey)" }}>
                          <span className="text-xs font-bold leading-none">{day}</span>
                          <span className="text-[9px] uppercase">{mon}</span>
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate group-hover:text-foreground transition-colors" style={{ color: "var(--ink)" }}>{ev.title}</p>
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

            {/* 3. Live chat rooms */}
            <div className="village-card p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-heading font-semibold text-sm text-foreground flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full animate-pulse inline-block shrink-0" style={{ background: "var(--status-online)" }} />
                  Live chat rooms
                </h3>
                <Link to="/chat" className="text-[11px] text-muted-foreground hover:text-foreground transition-colors">All rooms</Link>
              </div>
              <div className="space-y-0.5">
                {namedRooms.length === 0 ? (
                  <p className="text-xs text-muted-foreground px-1 py-2">Quiet right now — check back soon 🌿</p>
                ) : namedRooms.slice(0, 4).map(r => (
                  <Link key={r.href} to={r.href} className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-secondary/50 transition-colors group">
                    <span className="text-base w-7 text-center shrink-0">{r.icon}</span>
                    <p className="text-sm font-medium text-foreground group-hover:text-foreground transition-colors flex-1 truncate">{r.name}</p>
                    {r.count > 0 ? (
                      <span className="text-xs text-muted-foreground shrink-0">{r.count}</span>
                    ) : (
                      <span className="w-1.5 h-1.5 rounded-full animate-pulse shrink-0" style={{ background: "var(--status-online)" }} />
                    )}
                  </Link>
                ))}
              </div>
            </div>

            {/* 4. My shortcuts */}
            {/* ── My shortcuts — pinnable by every user ── */}
            {(() => {
              // Build the pool of things they can pin — drawn from data already fetched
              const STATIC = [
                { label: "Browse Spaces",  href: "/forums",                     icon: "🌿" },
                { label: "Events",         href: "/events",                      icon: "📅" },
                { label: "Friends",        href: "/friends",                     icon: "👋" },
                { label: "Messages",       href: "/messages",                    icon: "💬" },
                { label: "Village Stall",  href: isFree ? "/plus" : "/stall",   icon: "🛍️" },
                { label: "Saved posts",    href: "/saved",                       icon: "🔖" },
                { label: "My profile",     href: "/profile",                     icon: "👤" },
              ];
              const fromRooms = namedRooms.slice(0, 3).map(r => ({
                label: r.name, href: r.href, icon: r.icon,
              }));
              const fromCommunities = userCommunities.slice(0, 4).map(c => ({
                label: c.name, href: `/community/${c.category_id}`, icon: c.icon || "💬",
              }));
              const pool = [
                ...STATIC,
                ...fromRooms.map(r => ({ ...r, _group: "Chat rooms" })),
                ...fromCommunities.map(c => ({ ...c, _group: "Your communities" })),
              ].filter(s => !shortcuts.some(x => x.href === s.href));

              return (
                <div className="village-card p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-heading font-semibold text-sm text-foreground">My shortcuts</h3>
                    <button
                      onClick={() => setEditingShortcuts(e => !e)}
                      className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none"
                    >
                      {editingShortcuts
                        ? <><Check className="h-3 w-3" /> Done</>
                        : <><Pencil className="h-3 w-3" /> Edit</>
                      }
                    </button>
                  </div>

                  {/* Pinned shortcuts */}
                  {shortcuts.length > 0 && (
                    <div className="space-y-0.5 mb-3">
                      {shortcuts.map((s) => (
                        <div key={s.href} className="flex items-center gap-1">
                          {editingShortcuts && (
                            <button
                              onClick={() => removeShortcut(s.href)}
                              className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 hover:bg-red-100 dark:hover:bg-red-900/30 text-muted-foreground hover:text-red-500 transition-colors focus-visible:outline-none"
                              aria-label={`Remove ${s.label}`}
                            >
                              <X className="h-3 w-3" />
                            </button>
                          )}
                          <Link to={s.href} className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-secondary/50 transition-colors group flex-1 min-w-0">
                            <span className="text-base w-6 text-center shrink-0">{s.icon}</span>
                            <p className="text-sm font-medium text-foreground group-hover:text-foreground transition-colors truncate">{s.label}</p>
                          </Link>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Empty state */}
                  {shortcuts.length === 0 && !editingShortcuts && (
                    <button
                      onClick={() => setEditingShortcuts(true)}
                      className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors py-3 border border-dashed rounded-xl hover:border-foreground/30 focus-visible:outline-none"
                      style={{ borderColor: "var(--line)" }}
                    >
                      + Add your first shortcut
                    </button>
                  )}

                  {/* Add suggestions (edit mode) */}
                  {editingShortcuts && shortcuts.length < 8 && pool.length > 0 && (
                    <div>
                      <p className="tv-mono mb-2 px-1" style={{ color: "var(--ink-3)" }}>
                        Add a shortcut
                      </p>
                      <div className="space-y-0.5 max-h-52 overflow-y-auto">
                        {pool.map((s) => (
                          <button
                            key={s.href}
                            onClick={() => addShortcut({ label: s.label, href: s.href, icon: s.icon })}
                            className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-secondary/50 transition-colors group w-full text-left focus-visible:outline-none"
                          >
                            <span className="text-base w-6 text-center shrink-0">{s.icon}</span>
                            <p className="text-sm text-foreground group-hover:text-foreground transition-colors flex-1 truncate">{s.label}</p>
                            <Plus className="h-3.5 w-3.5 shrink-0 text-muted-foreground group-hover:text-foreground transition-colors" />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  {editingShortcuts && shortcuts.length >= 8 && (
                    <p className="text-[11px] text-muted-foreground text-center py-1">Max 8 shortcuts reached</p>
                  )}
                </div>
              );
            })()}

          </div>
          {/* end right rail */}

        </div>
        {/* end unified layout */}

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
