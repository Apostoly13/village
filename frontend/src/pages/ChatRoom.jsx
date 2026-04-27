import { useState, useEffect, useRef } from "react";
import { Link, useParams } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import Navigation from "../components/Navigation";
import { toast } from "sonner";
import { ArrowLeft, Send, Users, Crown, Bookmark, ArrowRight } from "lucide-react";
import { timeAgoVerbose } from "../utils/dateHelpers";

const API_URL = process.env.REACT_APP_BACKEND_URL;

export default function ChatRoom({ user }) {
  const { roomId } = useParams();
  const [room, setRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [subscription, setSubscription] = useState(null);
  const [savedMessageIds, setSavedMessageIds] = useState(new Set());
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [friendProfile, setFriendProfile] = useState(null);
  const messagesEndRef = useRef(null);
  const scrollAreaRef = useRef(null);
  const isAtBottom = useRef(true);
  const MESSAGE_LIMIT = 50;

  useEffect(() => {
    fetchData();
    fetchSubscription();
    fetchSavedMessageIds();
    // Poll for new messages every 3 seconds
    const interval = setInterval(fetchMessages, 3000);
    return () => clearInterval(interval);
  }, [roomId]);

  // Once room loads, fetch the friend's profile for friends_only rooms
  useEffect(() => {
    if (room?.room_type === "friends_only" && user) {
      const friendId = room.participant_ids?.find(id => id !== user.user_id);
      // Use participants array from server if available
      if (room.participants) {
        const fp = room.participants.find(p => p.user_id !== user.user_id);
        if (fp) { setFriendProfile(fp); return; }
      }
      if (friendId) {
        fetch(`${API_URL}/api/users/${friendId}`, { credentials: "include" })
          .then(r => r.ok ? r.json() : null)
          .then(data => { if (data) setFriendProfile(data); })
          .catch(() => {});
      }
    }
  }, [room, user]);

  const fetchSubscription = async () => {
    try {
      const response = await fetch(`${API_URL}/api/subscription/status`, { credentials: "include" });
      if (response.ok) {
        setSubscription(await response.json());
      }
    } catch (error) {
      console.error("Error fetching subscription:", error);
    }
  };

  // Scroll to bottom only when the user is already near the bottom
  // (i.e. don't yank them down while they're reading history)
  useEffect(() => {
    if (isAtBottom.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Force-scroll on room change — always land at the bottom of a new conversation
  useEffect(() => {
    isAtBottom.current = true;
    messagesEndRef.current?.scrollIntoView({ behavior: "instant" });
  }, [roomId]);

  const handleScroll = () => {
    const el = scrollAreaRef.current;
    if (!el) return;
    isAtBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
  };

  const fetchData = async () => {
    try {
      const [roomRes, messagesRes] = await Promise.all([
        fetch(`${API_URL}/api/chat/rooms/${roomId}`, { credentials: "include" }),
        fetch(`${API_URL}/api/chat/rooms/${roomId}/messages?limit=${MESSAGE_LIMIT}`, { credentials: "include" })
      ]);

      if (roomRes.ok) setRoom(await roomRes.json());
      if (messagesRes.ok) {
        const data = await messagesRes.json();
        setMessages(data);
        setHasMore(data.length === MESSAGE_LIMIT);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async () => {
    try {
      const response = await fetch(`${API_URL}/api/chat/rooms/${roomId}/messages?limit=${MESSAGE_LIMIT}`, {
        credentials: "include"
      });
      if (response.ok) {
        const data = await response.json();
        // Merge: preserve any locally-added messages not yet returned by the server
        // (race condition: GET response can arrive before the POST is committed)
        setMessages(prev => {
          const serverIds = new Set(data.map(m => m.message_id));
          const localOnly = prev.filter(m => !serverIds.has(m.message_id));
          const merged = [...data, ...localOnly];
          merged.sort((a, b) => (a.created_at > b.created_at ? 1 : -1));
          return merged;
        });
        setHasMore(data.length === MESSAGE_LIMIT);
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
  };

  const loadOlderMessages = async () => {
    if (!messages.length || loadingMore) return;
    setLoadingMore(true);
    try {
      const oldest = messages[0].created_at;
      const response = await fetch(
        `${API_URL}/api/chat/rooms/${roomId}/messages?limit=${MESSAGE_LIMIT}&before=${encodeURIComponent(oldest)}`,
        { credentials: "include" }
      );
      if (response.ok) {
        const older = await response.json();
        setMessages(prev => [...older, ...prev]);
        setHasMore(older.length === MESSAGE_LIMIT);
      }
    } catch (error) {
      console.error("Error loading older messages:", error);
    } finally {
      setLoadingMore(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSend = async (e) => {
    e.preventDefault();
    const content = newMessage.trim();
    if (!content || sending) return;

    // Optimistic update: add message immediately with a temp ID so it
    // appears at once and is never wiped by a concurrent polling response
    const tempId = `temp_${Date.now()}`;
    const optimisticMsg = {
      message_id: tempId,
      room_id: roomId,
      author_id: user?.user_id,
      author_name: user?.nickname || user?.name,
      author_picture: user?.picture,
      author_subscription_tier: user?.subscription_tier || "free",
      content,
      created_at: new Date().toISOString(),
    };
    isAtBottom.current = true; // always scroll when you send
    setMessages(prev => [...prev, optimisticMsg]);
    setNewMessage("");
    setSending(true);

    try {
      const response = await fetch(`${API_URL}/api/chat/rooms/${roomId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ content })
      });

      if (response.ok) {
        const message = await response.json();
        // Swap temp placeholder with the confirmed server message
        setMessages(prev => prev.map(m => m.message_id === tempId ? message : m));
        fetchSubscription();
      } else if (response.status === 429) {
        // Limit reached — remove optimistic message and restore input
        setMessages(prev => prev.filter(m => m.message_id !== tempId));
        setNewMessage(content);
        const error = await response.json();
        toast.error(error.detail?.message || "Daily message limit reached");
        fetchSubscription();
      } else {
        // Generic error — remove optimistic message and restore input
        setMessages(prev => prev.filter(m => m.message_id !== tempId));
        setNewMessage(content);
        let errMsg = `Failed to send (${response.status})`;
        try {
          const errBody = await response.text();
          console.error("Chat send error:", response.status, errBody);
          const err = JSON.parse(errBody);
          if (err.detail) errMsg = typeof err.detail === "string" ? err.detail : err.detail?.message || errMsg;
        } catch {}
        toast.error(errMsg);
      }
    } catch (error) {
      // Network error — remove optimistic message and restore input
      setMessages(prev => prev.filter(m => m.message_id !== tempId));
      setNewMessage(content);
      console.error("Chat send exception:", error);
      toast.error("Could not reach server — check your connection");
    } finally {
      setSending(false);
    }
  };

  const formatTime = timeAgoVerbose;

  const fetchSavedMessageIds = async () => {
    try {
      const res = await fetch(`${API_URL}/api/users/saved-messages`, { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setSavedMessageIds(new Set(data.map(m => m.message_id)));
      }
    } catch {}
  };

  const handleSaveMessage = async (msg) => {
    const isSaved = savedMessageIds.has(msg.message_id);
    try {
      const res = await fetch(`${API_URL}/api/chat/messages/${msg.message_id}/save`, {
        method: isSaved ? "DELETE" : "POST",
        credentials: "include"
      });
      if (res.ok) {
        setSavedMessageIds(prev => {
          const next = new Set(prev);
          isSaved ? next.delete(msg.message_id) : next.add(msg.message_id);
          return next;
        });
        toast.success(isSaved ? "Message unsaved" : "Message saved");
      }
    } catch {
      toast.error("Something went wrong");
    }
  };

  const isOwnMessage = (msg) => msg.author_id === user?.user_id;

  if (loading) {
    return (
      <div className="min-h-screen bg-background lg:pl-60">
        <Navigation user={user} />
        <main className="max-w-4xl mx-auto px-4 pt-16 lg:pt-8">
          <div className="animate-pulse space-y-4">
            <div className="h-6 w-32 bg-muted rounded"></div>
            <div className="village-card h-[60vh]"></div>
          </div>
        </main>
      </div>
    );
  }

  if (!room) {
    return (
      <div className="min-h-screen bg-background lg:pl-60">
        <Navigation user={user} />
        <main className="max-w-4xl mx-auto px-4 pt-16 lg:pt-8 text-center">
          <h1 className="font-heading text-2xl font-bold text-foreground">Room not found</h1>
          <Link to="/chat">
            <Button className="mt-4">Back to Chat Rooms</Button>
          </Link>
        </main>
      </div>
    );
  }

  return (
    <div className="h-[100dvh] bg-background flex flex-col overflow-hidden lg:pl-60">
      <Navigation user={user} />

      <main className="flex-1 flex flex-col max-w-4xl mx-auto w-full px-4 pt-16 lg:pt-8 pb-[72px] lg:pb-4 min-h-0">
        {/* Room Header */}
        <div className="flex items-center gap-4 mb-4">
          <Link to="/chat" className="text-muted-foreground hover:text-foreground" data-testid="back-link">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          {room.room_type === "friends_only" ? (
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-sm font-semibold text-primary overflow-hidden">
                  {friendProfile?.picture
                    ? <img src={friendProfile.picture} alt="" className="w-full h-full object-cover" />
                    : (friendProfile?.nickname || friendProfile?.name || "💬")?.[0]?.toUpperCase()}
                </div>
                <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-card ${friendProfile?.is_online ? "bg-green-500" : "bg-muted-foreground/40"}`} />
              </div>
              <div>
                <h1 className="font-heading font-bold text-xl text-foreground">
                  {friendProfile ? (friendProfile.nickname || friendProfile.name) : "Private Chat"}
                </h1>
                <p className={`text-sm flex items-center gap-1 ${friendProfile?.is_online ? "text-green-500" : "text-muted-foreground"}`}>
                  {friendProfile?.is_online ? "Active now" : "Private chat"}
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <span className="text-2xl">{room.icon}</span>
              <div>
                <h1 className="font-heading font-bold text-xl text-foreground">{room.name}</h1>
                <p className="text-sm text-muted-foreground">{room.description}</p>
              </div>
            </div>
          )}
        </div>

        {/* Gender restriction banner */}
        {room.is_gender_restricted && !room.user_can_access && (
          <div className="mb-4 p-4 bg-amber-500/10 border border-amber-500/30 rounded-[18px] flex items-center gap-3">
            <span className="text-2xl">{room.icon}</span>
            <div>
              <p className="font-medium text-foreground text-sm">This space is for {room.gender_restriction === "female" ? "mums" : "dads"} only</p>
              <p className="text-xs text-muted-foreground">You can read messages but cannot post in this space.</p>
            </div>
          </div>
        )}

        {/* Messages Area */}
        <div className="village-card flex-1 min-h-0 flex flex-col">
          <div className="flex-1 min-h-0 overflow-y-auto p-4" ref={scrollAreaRef} onScroll={handleScroll}>
            <div className="space-y-4">
              {hasMore && (
                <div className="text-center pb-2">
                  <button
                    onClick={loadOlderMessages}
                    disabled={loadingMore}
                    className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors disabled:opacity-50"
                  >
                    {loadingMore ? "Loading..." : "Load older messages"}
                  </button>
                </div>
              )}
              {messages.length === 0 ? (
                <div className="text-center py-12">
                  <span className="text-4xl mb-4 block">💬</span>
                  <p className="text-muted-foreground">No messages yet. Start the conversation!</p>
                </div>
              ) : (
                messages.map((msg, idx) => (
                  <div
                    key={msg.message_id}
                    className={`flex group ${isOwnMessage(msg) ? 'justify-end' : 'justify-start'}`}
                    data-testid={`message-${idx}`}
                  >
                    <div className={`flex items-end gap-2 max-w-[80%] min-w-0 ${isOwnMessage(msg) ? 'flex-row-reverse' : ''}`}>
                      {!isOwnMessage(msg) && (
                        <Link to={`/profile/${msg.author_id}`} className="flex-shrink-0">
                          <Avatar className="h-8 w-8 cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all">
                            <AvatarImage src={msg.author_picture} />
                            <AvatarFallback className="bg-primary/20 text-primary text-sm">
                              {msg.author_name?.[0]?.toUpperCase() || '?'}
                            </AvatarFallback>
                          </Avatar>
                        </Link>
                      )}
                      <div className="min-w-0">
                        {!isOwnMessage(msg) && (
                          <Link to={`/profile/${msg.author_id}`} className="hover:underline">
                            <p className="text-xs text-muted-foreground mb-1 ml-1 cursor-pointer hover:text-primary transition-colors flex items-center gap-1">
                              {msg.author_name}
                              {msg.author_subscription_tier === "premium" && <Crown className="h-3 w-3 text-amber-500" />}
                            </p>
                          </Link>
                        )}
                        <div className={`flex items-start gap-1 ${isOwnMessage(msg) ? 'flex-row-reverse' : ''}`}>
                          <div
                            className="rounded-2xl px-4 py-2 shadow-sm"
                            style={isOwnMessage(msg)
                              ? { background: "hsl(var(--accent))", color: "var(--tv-primary-fg, #f7f2e9)" }
                              : { background: "var(--paper-2)", border: "1px solid var(--line)", color: "var(--ink)" }
                            }
                          >
                            <p className="text-sm break-all whitespace-pre-wrap">{msg.content}</p>
                          </div>
                          <button
                            onClick={() => handleSaveMessage(msg)}
                            className={`opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-lg hover:bg-muted flex-shrink-0 ${
                              savedMessageIds.has(msg.message_id) ? 'opacity-100 text-primary' : 'text-muted-foreground'
                            }`}
                            title={savedMessageIds.has(msg.message_id) ? "Unsave message" : "Save message"}
                          >
                            <Bookmark className={`h-3.5 w-3.5 ${savedMessageIds.has(msg.message_id) ? 'fill-current' : ''}`} />
                          </button>
                        </div>
                        <p className={`text-xs text-muted-foreground mt-1 ${isOwnMessage(msg) ? 'text-right mr-1' : 'ml-1'}`}>
                          {formatTime(msg.created_at)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Message Input — shrink-0 keeps it pinned to the bottom of the card */}
          {room.room_type !== "friends_only" && subscription?.limits_apply && subscription?.chat_messages && !subscription.chat_messages.allowed ? (
            <div className="shrink-0 p-4 border-t border-border/50">
              <Link to="/plus" className="flex items-center gap-3 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 hover:bg-amber-500/15 transition-colors group">
                <Crown className="h-5 w-5 text-amber-500 flex-shrink-0" />
                <div className="flex-1">
                  <p className="font-medium text-foreground text-sm">Daily message limit reached</p>
                  <p className="text-xs text-muted-foreground">Upgrade to Village+ for unlimited chat</p>
                </div>
                <ArrowRight className="h-4 w-4 text-amber-500 opacity-0 group-hover:opacity-100 transition-opacity" />
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSend} className="shrink-0 p-4 border-t border-border/50" data-testid="message-form">
              {subscription?.limits_apply && subscription?.chat_messages && (
                <p className="text-xs text-muted-foreground mb-2" data-testid="chat-limit-counter">
                  {subscription.chat_messages.limit - subscription.chat_messages.used}/{subscription.chat_messages.limit} messages today
                </p>
              )}
              <div className="flex gap-2">
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value.slice(0, 1000))}
                  placeholder="Type a message..."
                  className="flex-1 rounded-full"
                  style={{ height: 44, background: "var(--paper)", border: "1px solid var(--line)", color: "var(--ink)" }}
                  maxLength={1000}
                  data-testid="message-input"
                />
                <Button
                  type="submit"
                  disabled={sending || !newMessage.trim()}
                  className="rounded-full p-0 shrink-0"
                  style={{ height: 44, width: 44, background: "var(--ink)", color: "var(--paper)" }}
                  data-testid="send-btn"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
              {newMessage.length > 800 && (
                <p className={`text-xs mt-1.5 text-right ${newMessage.length >= 1000 ? 'text-destructive' : 'text-muted-foreground'}`}>
                  {newMessage.length}/1000
                </p>
              )}
            </form>
          )}
        </div>
      </main>
    </div>
  );
}
