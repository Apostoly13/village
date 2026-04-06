import { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import { Crown, X, MessagesSquare, Send } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

const API_URL = process.env.REACT_APP_BACKEND_URL;
const STORAGE_KEY = "chatPopout";

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {}
}

function formatTime(dateString) {
  try {
    return formatDistanceToNow(new Date(dateString), { addSuffix: true });
  } catch {
    return "";
  }
}

export default function ChatPopout({ user }) {
  const saved = loadState();

  const [open, setOpen] = useState(saved?.open ?? false);
  const [roomId, setRoomId] = useState(saved?.roomId ?? null);
  const [room, setRoom] = useState(null);
  const [friends, setFriends] = useState([]);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [view, setView] = useState(saved?.roomId ? "chat" : "friends"); // "friends" | "chat"
  const [unreadCount, setUnreadCount] = useState(0);
  const [loadingFriends, setLoadingFriends] = useState(false);
  const [openingChat, setOpeningChat] = useState(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const lastSeenMsgIdRef = useRef(null);
  const openRef = useRef(open);

  // Keep openRef in sync for use inside interval callbacks
  useEffect(() => {
    openRef.current = open;
  }, [open]);

  // Persist open/roomId changes
  useEffect(() => {
    saveState({ open, roomId });
  }, [open, roomId]);

  // Fetch friends list when popout opens on friends view
  useEffect(() => {
    if (open && view === "friends") {
      fetchFriends();
    }
  }, [open, view]);

  // Fetch room info + messages when roomId set
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!roomId) return;
    fetchRoom();
    fetchMessages(true);
  }, [roomId]);

  // Foreground poll: fast (5s) when open in chat view
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!open || view !== "chat" || !roomId) return;
    const interval = setInterval(() => fetchMessages(false), 5000);
    return () => clearInterval(interval);
  }, [open, view, roomId]);

  // Background poll: slow (30s) when closed and a room is selected
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!roomId) return;
    const interval = setInterval(() => {
      if (!openRef.current) {
        fetchMessages(false, true);
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [roomId]);

  // Scroll to bottom on new messages when open
  useEffect(() => {
    if (open && view === "chat") {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, open, view]);

  // Track last seen message ID whenever popout is open and in chat view
  useEffect(() => {
    if (open && view === "chat" && messages.length > 0) {
      lastSeenMsgIdRef.current = messages[messages.length - 1].message_id;
    }
  }, [messages, open, view]);

  const fetchFriends = async () => {
    setLoadingFriends(true);
    try {
      const res = await fetch(`${API_URL}/api/friends`, { credentials: "include" });
      if (res.ok) setFriends(await res.json());
    } catch {}
    finally { setLoadingFriends(false); }
  };

  const fetchRoom = async () => {
    try {
      const res = await fetch(`${API_URL}/api/chat/rooms/${roomId}`, { credentials: "include" });
      if (res.ok) setRoom(await res.json());
    } catch {}
  };

  // isBackground=true means we're polling while closed and should notify on new messages
  const fetchMessages = async (isInitial = false, isBackground = false) => {
    if (!roomId) return;
    try {
      const res = await fetch(`${API_URL}/api/chat/rooms/${roomId}/messages?limit=30`, { credentials: "include" });
      if (!res.ok) return;
      const data = await res.json();
      setMessages(data);

      if (isInitial && data.length > 0) {
        // Set baseline so we don't notify on existing messages
        lastSeenMsgIdRef.current = data[data.length - 1].message_id;
        return;
      }

      if (isBackground && data.length > 0 && lastSeenMsgIdRef.current) {
        const latestMsg = data[data.length - 1];
        if (latestMsg.message_id !== lastSeenMsgIdRef.current) {
          // Find messages after the last seen one
          const lastIdx = data.findIndex(m => m.message_id === lastSeenMsgIdRef.current);
          const newMsgs = lastIdx >= 0 ? data.slice(lastIdx + 1) : data;
          const newFromOthers = newMsgs.filter(m => m.author_id !== user?.user_id);
          if (newFromOthers.length > 0) {
            setUnreadCount(prev => prev + newFromOthers.length);
            const latest = newFromOthers[newFromOthers.length - 1];
            const preview = latest.content.length > 50 ? latest.content.slice(0, 50) + "…" : latest.content;
            toast(`💬 ${latest.author_name}: ${preview}`, {
              duration: 5000,
              action: { label: "Open", onClick: () => setOpen(true) },
            });
          }
        }
      }
    } catch {}
  };

  const openFriendChat = async (friendId) => {
    setOpeningChat(friendId);
    try {
      const res = await fetch(`${API_URL}/api/chat/rooms/friends`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ friend_id: friendId }),
      });
      if (res.ok) {
        const r = await res.json();
        setRoomId(r.room_id);
        setRoom(r);
        setMessages([]);
        lastSeenMsgIdRef.current = null;
        setView("chat");
      }
    } catch {}
    finally { setOpeningChat(null); }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    const content = newMessage.trim();
    if (!content || !roomId || sending) return;
    setSending(true);
    setNewMessage("");
    try {
      const res = await fetch(`${API_URL}/api/chat/rooms/${roomId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ content }),
      });
      if (res.ok) {
        const msg = await res.json();
        setMessages(prev => [...prev, msg]);
        lastSeenMsgIdRef.current = msg.message_id;
      }
    } catch {}
    finally { setSending(false); }
  };

  const handleOpen = () => {
    setOpen(true);
    setUnreadCount(0);
  };

  const handleClose = () => {
    setOpen(false);
  };

  return (
    <div className="fixed bottom-20 right-4 lg:bottom-4 z-[100]">
      {open ? (
        <div className="w-80 max-h-[480px] bg-card border border-border/50 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-border/50 bg-card shrink-0">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
              <MessagesSquare className="h-4 w-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              {view === "chat" && room ? (
                <>
                  <p className="font-medium text-foreground text-sm truncate">
                    {room.room_type === "friends_only" ? "Private Chat" : room.name}
                  </p>
                  <button
                    onClick={() => setView("friends")}
                    className="text-xs text-muted-foreground hover:text-primary transition-colors"
                  >
                    ← Switch friend
                  </button>
                </>
              ) : (
                <p className="font-medium text-foreground text-sm">Friends Chat</p>
              )}
            </div>
            <button onClick={handleClose} className="text-muted-foreground hover:text-foreground transition-colors p-1">
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Friends list view */}
          {view === "friends" && (
            <div className="flex-1 overflow-y-auto">
              {loadingFriends ? (
                <div className="p-4 space-y-3">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="flex items-center gap-3 animate-pulse">
                      <div className="w-9 h-9 rounded-full bg-muted shrink-0" />
                      <div className="flex-1 h-4 bg-muted rounded" />
                    </div>
                  ))}
                </div>
              ) : friends.length === 0 ? (
                <div className="p-6 text-center">
                  <p className="text-sm text-muted-foreground">No friends yet.</p>
                  <Link to="/friends" onClick={handleClose} className="text-xs text-primary hover:underline mt-1 block">
                    Add friends →
                  </Link>
                </div>
              ) : (
                <div className="divide-y divide-border/30">
                  {friends.map(friend => (
                    <button
                      key={friend.user_id}
                      onClick={() => openFriendChat(friend.user_id)}
                      disabled={openingChat === friend.user_id}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-secondary/50 transition-colors text-left"
                    >
                      <div className="relative shrink-0">
                        <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center text-sm font-semibold text-primary overflow-hidden">
                          {friend.picture ? (
                            <img src={friend.picture} alt="" className="w-full h-full object-cover" />
                          ) : (
                            (friend.nickname || friend.name)?.[0]?.toUpperCase()
                          )}
                        </div>
                        <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-card ${
                          friend.is_online ? "bg-green-500" : "bg-muted-foreground/40"
                        }`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{friend.nickname || friend.name}</p>
                        <p className={`text-xs ${friend.is_online ? "text-green-500" : "text-muted-foreground"}`}>
                          {friend.is_online ? "Online" : "Offline"}
                        </p>
                      </div>
                      {openingChat === friend.user_id && (
                        <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin shrink-0" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Chat view */}
          {view === "chat" && (
            <>
              <div className="flex-1 overflow-y-auto p-3 space-y-3 min-h-0">
                {messages.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-4">No messages yet. Say hi!</p>
                )}
                {messages.map(msg => {
                  const isOwn = msg.author_id === user?.user_id;
                  return (
                    <div key={msg.message_id} className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
                      <div className="max-w-[85%]">
                        {!isOwn && (
                          <p className="text-xs text-muted-foreground mb-1 ml-1 flex items-center gap-1">
                            {msg.author_name}
                            {msg.author_subscription_tier === "premium" && <Crown className="h-2.5 w-2.5 text-amber-500" />}
                          </p>
                        )}
                        <div className={`rounded-2xl px-3 py-2 text-sm ${
                          isOwn
                            ? "bg-primary text-primary-foreground rounded-br-sm"
                            : "bg-secondary text-foreground rounded-bl-sm"
                        }`}>
                          {msg.content}
                        </div>
                        <p className={`text-xs text-muted-foreground mt-0.5 ${isOwn ? "text-right mr-1" : "ml-1"}`}>
                          {formatTime(msg.created_at)}
                        </p>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              <form onSubmit={handleSend} className="flex gap-2 p-3 border-t border-border/50 shrink-0">
                <input
                  ref={inputRef}
                  value={newMessage}
                  onChange={e => setNewMessage(e.target.value)}
                  placeholder="Message..."
                  className="flex-1 bg-secondary/50 rounded-full px-4 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/30"
                  disabled={sending}
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim() || sending}
                  className="w-9 h-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center disabled:opacity-50 shrink-0"
                >
                  <Send className="h-4 w-4" />
                </button>
              </form>
            </>
          )}
        </div>
      ) : (
        /* Collapsed bubble */
        <button
          onClick={handleOpen}
          className="w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-[0_0_20px_rgba(245,197,66,0.4)] flex items-center justify-center relative hover:scale-105 transition-transform"
          data-testid="chat-popout-bubble"
        >
          <MessagesSquare className="h-6 w-6" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-medium">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>
      )}
    </div>
  );
}
