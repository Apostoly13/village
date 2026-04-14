import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import Navigation from "../components/Navigation";
import { Bookmark, Heart, MessageCircle, Eye, Clock, Trash2, MessageSquare, Calendar, BookOpen, MapPin, Users, Check } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import AppFooter from "../components/AppFooter";

const API_URL = process.env.REACT_APP_BACKEND_URL;

const TABS = [
  { id: "posts", label: "Posts" },
  { id: "messages", label: "Chat Messages" },
  { id: "events", label: "Events" },
];

const CATEGORY_STYLES = {
  general: "bg-secondary text-secondary-foreground",
  playgroup: "bg-green-500/10 text-green-600",
  meetup: "bg-blue-500/10 text-blue-600",
  workshop: "bg-purple-500/10 text-purple-600",
  support: "bg-pink-500/10 text-pink-600",
};

const CATEGORY_LABELS = {
  general: "General",
  playgroup: "Playgroup",
  meetup: "Meetup",
  workshop: "Workshop",
  support: "Support",
};

function formatDate(dateString) {
  try {
    return formatDistanceToNow(new Date(dateString), { addSuffix: true });
  } catch {
    return "recently";
  }
}

function formatEventDate(dateStr) {
  try {
    const [year, month, day] = dateStr.split("-").map(Number);
    const d = new Date(year, month - 1, day);
    return {
      day: d.getDate(),
      month: d.toLocaleString("en-AU", { month: "short" }),
    };
  } catch {
    return { day: "?", month: "???" };
  }
}

// Posts tab
function PostsTab() {
  const [bookmarks, setBookmarks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBookmarks();
  }, []);

  const fetchBookmarks = async () => {
    try {
      const res = await fetch(`${API_URL}/api/bookmarks`, { credentials: "include" });
      if (res.ok) setBookmarks(await res.json());
    } catch (err) {
      console.error("Error fetching bookmarks:", err);
    } finally {
      setLoading(false);
    }
  };

  const removeBookmark = async (postId) => {
    try {
      const res = await fetch(`${API_URL}/api/forums/posts/${postId}/bookmark`, {
        method: "POST",
        credentials: "include",
      });
      if (res.ok) {
        setBookmarks(prev => prev.filter(b => b.post_id !== postId));
        toast.success("Bookmark removed");
      }
    } catch {
      toast.error("Failed to remove bookmark");
    }
  };

  if (loading) {
    return (
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
    );
  }

  if (bookmarks.length === 0) {
    return (
      <div className="text-center py-16 bg-card border border-border/50 rounded-2xl">
        <span className="text-5xl mb-4 block">🔖</span>
        <h3 className="font-heading font-bold text-lg text-foreground mb-2">Nothing saved yet</h3>
        <p className="text-sm text-muted-foreground mb-6">Tap the bookmark icon on any post to save it here.</p>
        <Link to="/forums">
          <Button className="rounded-xl bg-primary text-primary-foreground hover:bg-primary/90">Browse forums</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {bookmarks.map((post, idx) => (
        <article key={post.post_id} className="bg-card rounded-2xl p-6 border border-border/50 shadow-sm border-l-2 border-l-primary/20 hover:border-primary/30 hover:shadow hover:border-l-primary/40 transition-all">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              {post.author_id !== "anonymous" ? (
                <Link to={`/profile/${post.author_id}`}>
                  <Avatar className="h-10 w-10 cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all">
                    <AvatarImage src={post.author_picture} />
                    <AvatarFallback className="bg-primary/20 text-primary">
                      {post.author_name?.[0]?.toUpperCase() || "?"}
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
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>

          <Link to={`/forums/post/${post.post_id}`}>
            <h3 className="font-heading font-bold text-lg text-foreground mb-2 hover:text-primary transition-colors">{post.title}</h3>
            <p className="text-muted-foreground line-clamp-2 mb-4">{post.content}</p>
          </Link>

          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><Heart className="h-3.5 w-3.5" />{post.like_count || 0}</span>
            <span className="flex items-center gap-1"><MessageCircle className="h-3.5 w-3.5" />{post.reply_count || 0}</span>
            <span className="flex items-center gap-1"><Eye className="h-3.5 w-3.5" />{post.views || 0}</span>
            <span className="ml-auto">Saved {formatDate(post.bookmarked_at)}</span>
          </div>
        </article>
      ))}
    </div>
  );
}

// Chat Messages tab
function ChatMessagesTab() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMessages();
  }, []);

  const fetchMessages = async () => {
    try {
      const res = await fetch(`${API_URL}/api/users/saved-messages`, { credentials: "include" });
      if (res.ok) setMessages(await res.json());
    } catch (err) {
      console.error("Error fetching saved messages:", err);
    } finally {
      setLoading(false);
    }
  };

  const unsave = async (messageId) => {
    try {
      const res = await fetch(`${API_URL}/api/chat/messages/${messageId}/save`, {
        method: "DELETE",
        credentials: "include",
      });
      if (res.ok) {
        setMessages(prev => prev.filter(m => m.message_id !== messageId));
        toast.success("Message removed from saved");
      }
    } catch {
      toast.error("Failed to unsave message");
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-card rounded-2xl p-5 border border-border/50 animate-pulse">
            <div className="w-full h-4 bg-muted rounded mb-2"></div>
            <div className="w-3/4 h-4 bg-muted rounded mb-2"></div>
            <div className="w-1/3 h-3 bg-muted rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="text-center py-16 bg-card border border-border/50 rounded-2xl">
        <span className="text-5xl mb-4 block">💬</span>
        <h3 className="font-heading font-bold text-lg text-foreground mb-2">No saved messages</h3>
        <p className="text-sm text-muted-foreground mb-6">Save helpful chat messages to find them here later.</p>
        <Link to="/chat">
          <Button className="rounded-xl bg-primary text-primary-foreground hover:bg-primary/90">Browse Circles</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {messages.map((msg) => (
        <div key={msg.id} className="bg-card rounded-2xl p-5 border border-border/50 shadow-sm border-l-2 border-l-primary/20 hover:border-primary/30 hover:shadow hover:border-l-primary/40 transition-all">
          <div className="flex items-start gap-3">
            <MessageSquare className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-foreground line-clamp-3 mb-2">{msg.message_content}</p>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs bg-secondary/80 text-secondary-foreground px-2 py-0.5 rounded-full">
                  In {msg.room_name}
                </span>
                <span className="text-xs text-muted-foreground">by {msg.author_name}</span>
                <span className="text-xs text-muted-foreground">{formatDate(msg.saved_at)}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => unsave(msg.message_id)}
                  className="ml-auto text-muted-foreground hover:text-destructive rounded-full h-7 px-2"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// Events tab (RSVPd events)
function EventsTab({ user }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRsvpdEvents();
  }, []);

  const fetchRsvpdEvents = async () => {
    try {
      const res = await fetch(`${API_URL}/api/events?rsvped_only=true&limit=40`, { credentials: "include" });
      if (res.ok) setEvents(await res.json());
    } catch (err) {
      console.error("Error fetching RSVPd events:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleRsvp = async (eventId) => {
    try {
      const res = await fetch(`${API_URL}/api/events/${eventId}/rsvp`, {
        method: "POST",
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        if (!data.rsvped) {
          setEvents(prev => prev.filter(e => e.event_id !== eventId));
          toast.success("RSVP removed");
        }
      }
    } catch {
      toast.error("Failed to update RSVP");
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2].map(i => (
          <div key={i} className="bg-card rounded-2xl p-5 border border-border/50 animate-pulse flex gap-4">
            <div className="w-14 h-14 rounded-xl bg-muted flex-shrink-0"></div>
            <div className="flex-1 space-y-2">
              <div className="w-24 h-4 bg-muted rounded"></div>
              <div className="w-3/4 h-5 bg-muted rounded"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="text-center py-16 bg-card border border-border/50 rounded-2xl">
        <span className="text-5xl mb-4 block">📅</span>
        <h3 className="font-heading font-bold text-lg text-foreground mb-2">No upcoming events</h3>
        <p className="text-sm text-muted-foreground mb-6">RSVP to events to see them here.</p>
        <Link to="/events">
          <Button className="rounded-xl bg-primary text-primary-foreground hover:bg-primary/90">Browse Events</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {events.map(event => {
        const dateInfo = formatEventDate(event.date);
        const catStyle = CATEGORY_STYLES[event.category] || CATEGORY_STYLES.general;
        const catLabel = CATEGORY_LABELS[event.category] || event.category;
        return (
          <article key={event.event_id} className="bg-card border border-border/50 rounded-2xl p-5 shadow-sm border-l-2 border-l-primary/20 hover:border-primary/30 hover:shadow hover:border-l-primary/40 transition-all flex gap-4">
            <div className="flex-shrink-0 w-14 h-14 rounded-xl bg-primary/15 text-primary flex flex-col items-center justify-center">
              <span className="text-xl font-bold leading-none">{dateInfo.day}</span>
              <span className="text-xs font-medium uppercase">{dateInfo.month}</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${catStyle}`}>{catLabel}</span>
                {event.suburb && (
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {event.suburb}{event.state ? `, ${event.state}` : ""}
                  </span>
                )}
              </div>
              <h3 className="font-heading font-bold text-foreground mb-1">{event.title}</h3>
              {event.time_start && (
                <p className="text-xs text-muted-foreground flex items-center gap-1 mb-2">
                  <Clock className="h-3 w-3" />
                  {event.time_start}{event.time_end ? ` – ${event.time_end}` : ""}
                </p>
              )}
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  {event.rsvp_count} going
                </span>
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => handleRsvp(event.event_id)}
                  className="ml-auto rounded-xl h-7 text-xs bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  <Check className="h-3 w-3 mr-1" /> Going
                </Button>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}

// Blog placeholder tab
function BlogTab() {
  return (
    <div className="text-center py-16 bg-card border border-border/50 rounded-2xl">
      <span className="text-5xl mb-4 block">📖</span>
      <h3 className="font-heading font-bold text-lg text-foreground mb-2">Blog bookmarking coming soon</h3>
      <p className="text-sm text-muted-foreground mb-6">
        For now, browse the full blog.
      </p>
      <Link to="/blog">
        <Button className="rounded-xl bg-primary text-primary-foreground hover:bg-primary/90">
          <BookOpen className="h-4 w-4 mr-2" />
          Go to Blog
        </Button>
      </Link>
    </div>
  );
}

export default function SavedResources({ user }) {
  const [activeTab, setActiveTab] = useState("posts");

  return (
    <div className="min-h-screen bg-background pb-20 lg:pb-8">
      <Navigation user={user} />

      <main className="max-w-4xl mx-auto px-4 pt-20 lg:pt-24">
        {/* Header */}
        <div className="mb-6">
          <h1 className="font-heading text-2xl sm:text-3xl font-bold text-foreground mb-1 flex items-center gap-2">
            <Bookmark className="h-7 w-7" />
            Saved
          </h1>
          <p className="text-sm text-muted-foreground">Your saved posts, messages, and events in one place.</p>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 mb-6 border-b border-border/50">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2.5 text-sm font-medium transition-colors relative ${
                activeTab === tab.id
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
              {activeTab === tab.id && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-t-full" />
              )}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {activeTab === "posts" && <PostsTab />}
        {activeTab === "messages" && <ChatMessagesTab />}
        {activeTab === "events" && <EventsTab user={user} />}
        {activeTab === "blog" && <BlogTab />}
        <AppFooter />
      </main>
    </div>
  );
}
