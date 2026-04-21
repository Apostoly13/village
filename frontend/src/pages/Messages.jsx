import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import Navigation from "../components/Navigation";
import { Send, ArrowLeft, MessagesSquare, Search, UserPlus, X, ImageIcon, Users, Lock } from "lucide-react";
import { Crown } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { parseApiError } from "../utils/apiError";
import AppFooter from "../components/AppFooter";

const API_URL = process.env.REACT_APP_BACKEND_URL;

function playDing() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 880;
    osc.type = "sine";
    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.4);
  } catch {}
}

function formatTime(dateString) {
  try { return formatDistanceToNow(new Date(dateString), { addSuffix: true }); }
  catch { return ""; }
}

// ── User search panel ─────────────────────────────────────────────────────────
function UserSearchPanel({ onClose, onStartChat }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [friendRequests, setFriendRequests] = useState({});

  const search = useCallback(async (q) => {
    if (q.length < 2) { setResults([]); return; }
    setSearching(true);
    try {
      const res = await fetch(`${API_URL}/api/users/search?q=${encodeURIComponent(q)}`, { credentials: "include" });
      if (res.ok) setResults(await res.json());
    } catch {}
    finally { setSearching(false); }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => search(query), 300);
    return () => clearTimeout(t);
  }, [query, search]);

  const sendFriendRequest = async (userId) => {
    try {
      const res = await fetch(`${API_URL}/api/friends/request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ to_user_id: userId }),
      });
      if (res.ok) {
        setFriendRequests(prev => ({ ...prev, [userId]: true }));
        toast.success("Friend request sent!");
      } else {
        const err = await res.json();
        toast.info(parseApiError(err.detail, "Request already sent"));
      }
    } catch { toast.error("Something went wrong"); }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border/50">
        <div className="flex-1 flex items-center gap-2 bg-secondary/50 rounded-full px-3 py-2">
          <Search className="h-4 w-4 text-muted-foreground shrink-0" />
          <input
            autoFocus
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search parents by name..."
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
          />
          {query && <button onClick={() => { setQuery(""); setResults([]); }}><X className="h-3.5 w-3.5 text-muted-foreground" /></button>}
        </div>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-xs">Cancel</button>
      </div>
      <div className="flex-1 overflow-y-auto">
        {searching && (
          <div className="p-4 space-y-3">
            {[1,2,3].map(i => <div key={i} className="flex items-center gap-3 animate-pulse"><div className="w-10 h-10 rounded-full bg-muted shrink-0" /><div className="flex-1 h-4 bg-muted rounded" /></div>)}
          </div>
        )}
        {!searching && query.length >= 2 && results.length === 0 && (
          <div className="p-6 text-center text-sm text-muted-foreground">No parents found for "{query}"</div>
        )}
        {!searching && query.length < 2 && (
          <div className="p-6 text-center text-sm text-muted-foreground">Type at least 2 characters to search</div>
        )}
        {results.map(u => (
          <div key={u.user_id} className="flex items-center gap-3 px-4 py-3 hover:bg-secondary/30">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-sm font-semibold text-primary overflow-hidden shrink-0">
              {u.picture ? <img src={u.picture} alt="" className="w-full h-full object-cover" /> : (u.nickname || u.name)?.[0]?.toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{u.nickname || u.name}</p>
              <p className="text-xs text-muted-foreground">{u.is_online ? "Online" : "Parent"}</p>
            </div>
            <div className="flex gap-2 shrink-0">
              <Button size="sm" variant="outline" className="rounded-full h-8 text-xs px-3" onClick={() => onStartChat(u)}>
                Message
              </Button>
              <Button
                size="sm"
                className="rounded-full h-8 text-xs px-3"
                disabled={!!friendRequests[u.user_id]}
                onClick={() => sendFriendRequest(u.user_id)}
              >
                {friendRequests[u.user_id] ? "Sent ✓" : <><UserPlus className="h-3 w-3 mr-1" />Add</>}
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Avatar helper ─────────────────────────────────────────────────────────────
function UserAvatar({ picture, name, nickname, isOnline, size = "md" }) {
  const sz = size === "sm" ? "w-9 h-9 text-sm" : "w-10 h-10 text-sm";
  return (
    <div className="relative shrink-0">
      <div className={`${sz} rounded-full bg-primary/20 flex items-center justify-center font-semibold text-primary overflow-hidden`}>
        {picture ? <img src={picture} alt="" className="w-full h-full object-cover" /> : (nickname || name)?.[0]?.toUpperCase()}
      </div>
      <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-card ${isOnline ? "bg-green-500" : "bg-muted-foreground/40"}`} />
    </div>
  );
}

// ── DM row ────────────────────────────────────────────────────────────────────
function DmRow({ conv, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-secondary/50 transition-colors text-left ${active ? "bg-primary/10" : ""}`}
    >
      <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-sm font-semibold text-primary overflow-hidden shrink-0">
        {conv.other_user_picture
          ? <img src={conv.other_user_picture} alt="" className="w-full h-full object-cover" />
          : conv.other_user_name?.[0]?.toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-1">
          <p className="text-sm font-medium text-foreground truncate">{conv.other_user_name}</p>
          {conv.unread_count > 0 && (
            <span className="shrink-0 min-w-[18px] h-[18px] rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-bold px-1">
              {conv.unread_count}
            </span>
          )}
        </div>
        <p className="text-xs text-muted-foreground truncate">
          {conv.last_message?.startsWith("data:image/") ? "📷 Photo" : conv.last_message}
        </p>
      </div>
    </button>
  );
}

// ── Message bubble ─────────────────────────────────────────────────────────────
function MessageBubble({ msg, isOwn, activeUser }) {
  const isImage = msg.content?.startsWith("data:image/");
  return (
    <div className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
      <div className="max-w-[75%] min-w-0 overflow-hidden">
        {!isOwn && (
          <p className="text-xs text-muted-foreground mb-1 ml-1 flex items-center gap-1">
            {msg.author_name || activeUser?.nickname || activeUser?.name}
            {msg.author_subscription_tier === "premium" && <Crown className="h-2.5 w-2.5 text-amber-500" />}
          </p>
        )}
        {isImage ? (
          <div className={`overflow-hidden shadow-sm rounded-2xl`}>
            <img
              src={msg.content}
              alt="Shared photo"
              className="max-w-full max-h-64 object-contain cursor-pointer"
              onClick={() => window.open(msg.content, "_blank")}
            />
          </div>
        ) : (
          <div className={`px-4 py-2.5 text-sm shadow-sm break-words overflow-hidden rounded-2xl ${isOwn ? "bg-primary text-primary-foreground" : "bg-card border border-border/50 text-foreground"}`}>
            {msg.content}
          </div>
        )}
        <p className={`text-xs text-muted-foreground mt-1 ${isOwn ? "text-right mr-1" : "ml-1"}`}>
          {formatTime(msg.created_at)}
        </p>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function Messages({ user }) {
  const navigate = useNavigate();

  const [showSearch, setShowSearch] = useState(false);

  const [friends, setFriends] = useState([]);
  const [loadingFriends, setLoadingFriends] = useState(true);

  const [conversations, setConversations] = useState([]);
  const [loadingConvs, setLoadingConvs] = useState(true);

  const [chatMode, setChatMode] = useState(null); // "friend" | "dm"
  const [activeRoomId, setActiveRoomId] = useState(null);
  const [activeFriend, setActiveFriend] = useState(null);
  const [activeDmUser, setActiveDmUser] = useState(null);

  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [openingChat, setOpeningChat] = useState(null);

  // Photo upload
  const [imagePreview, setImagePreview] = useState(null); // data URL
  const [imageFile, setImageFile] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  const [loadingMessages, setLoadingMessages] = useState(false);

  const messagesEndRef = useRef(null);
  const scrollContainerRef = useRef(null);
  const isAtBottom = useRef(true);
  const prevMsgCount = useRef(0);
  const inputRef = useRef(null);
  const imageInputRef = useRef(null);

  useEffect(() => { fetchFriends(); fetchConversations(); }, []);

  useEffect(() => {
    if (activeRoomId && chatMode === "friend") {
      fetchRoomMessages();
      const interval = setInterval(fetchRoomMessages, 1500);
      return () => clearInterval(interval);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeRoomId, chatMode]);

  useEffect(() => {
    if (activeDmUser && chatMode === "dm") {
      fetchDmMessages();
      const interval = setInterval(fetchDmMessages, 1500);
      return () => clearInterval(interval);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeDmUser, chatMode]);

  // Auto-scroll only when user is already at the bottom
  // Use scrollTop directly on the container — scrollIntoView can bubble up and scroll the page
  useEffect(() => {
    if (isAtBottom.current) {
      const el = scrollContainerRef.current;
      if (el) el.scrollTop = el.scrollHeight;
    }
  }, [messages]);

  // Force scroll to bottom when switching conversations
  useEffect(() => {
    isAtBottom.current = true;
    prevMsgCount.current = 0;
    setTimeout(() => {
      const el = scrollContainerRef.current;
      if (el) el.scrollTop = el.scrollHeight;
    }, 0);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeRoomId, activeDmUser]);

  const fetchFriends = async () => {
    setLoadingFriends(true);
    try {
      const res = await fetch(`${API_URL}/api/friends`, { credentials: "include" });
      if (res.ok) setFriends(await res.json());
    } catch {}
    finally { setLoadingFriends(false); }
  };

  const fetchConversations = async () => {
    setLoadingConvs(true);
    try {
      const res = await fetch(`${API_URL}/api/messages/conversations`, { credentials: "include" });
      if (res.ok) setConversations(await res.json());
    } catch {}
    finally { setLoadingConvs(false); }
  };

  const fetchRoomMessages = async () => {
    if (!activeRoomId) return;
    try {
      const res = await fetch(`${API_URL}/api/chat/rooms/${activeRoomId}/messages?limit=50`, { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        if (prevMsgCount.current > 0 && data.length > prevMsgCount.current) {
          const lastMsg = data[data.length - 1];
          if (lastMsg && (lastMsg.author_id || lastMsg.sender_id) !== user?.user_id) playDing();
        }
        prevMsgCount.current = data.length;
        setMessages(data);
      }
    } catch {}
    finally { setLoadingMessages(false); }
  };

  const fetchDmMessages = async () => {
    if (!activeDmUser) return;
    try {
      const res = await fetch(`${API_URL}/api/messages/${activeDmUser.user_id}`, { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        if (prevMsgCount.current > 0 && data.length > prevMsgCount.current) {
          const lastMsg = data[data.length - 1];
          if (lastMsg && lastMsg.sender_id !== user?.user_id) playDing();
        }
        prevMsgCount.current = data.length;
        setMessages(data);
      }
    } catch {}
    finally { setLoadingMessages(false); }
  };

  const openFriendChat = async (friend) => {
    setOpeningChat(friend.user_id);
    try {
      const res = await fetch(`${API_URL}/api/chat/rooms/friends`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ friend_id: friend.user_id }),
      });
      if (res.ok) {
        const room = await res.json();
        setLoadingMessages(true);
        prevMsgCount.current = 0;
        setActiveRoomId(room.room_id);
        setActiveFriend(friend);
        setActiveDmUser(null);
        setChatMode("friend");
        setMessages([]);
        clearImageState();
        setTimeout(() => inputRef.current?.focus(), 100);
      } else toast.error("Could not open chat");
    } catch { toast.error("Something went wrong"); }
    finally { setOpeningChat(null); }
  };

  const openDmChat = async (dmUser) => {
    setLoadingMessages(true);
    prevMsgCount.current = 0;
    setActiveDmUser(dmUser);
    setActiveRoomId(null);
    setActiveFriend(null);
    setChatMode("dm");
    setMessages([]);
    clearImageState();
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const handleSearchStartChat = (u) => {
    setShowSearch(false);
    openDmChat({ user_id: u.user_id, name: u.name, nickname: u.nickname, picture: u.picture, is_online: u.is_online });
  };

  // ── Image handling ──────────────────────────────────────────────────────────
  const clearImageState = () => {
    setImagePreview(null);
    setImageFile(null);
    if (imageInputRef.current) imageInputRef.current.value = "";
  };

  const handleImageSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { toast.error("Please select an image file"); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error("Image must be under 5MB"); return; }
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setImagePreview(ev.target.result);
    reader.readAsDataURL(file);
  };

  const uploadImage = async () => {
    if (!imageFile) return null;
    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append("file", imageFile);
      const res = await fetch(`${API_URL}/api/upload/image`, {
        method: "POST",
        credentials: "include",
        body: formData,
      });
      if (res.ok) {
        const data = await res.json();
        return data.image_url;
      }
      toast.error("Image upload failed");
      return null;
    } catch {
      toast.error("Image upload failed");
      return null;
    } finally {
      setUploadingImage(false);
    }
  };

  // ── Send message ────────────────────────────────────────────────────────────
  const handleSend = async (e) => {
    e.preventDefault();
    const textContent = newMessage.trim();
    if (!textContent && !imageFile) return;
    if (sending || uploadingImage) return;
    setSending(true);

    let content = textContent;

    // Upload image first if one is selected
    if (imageFile) {
      const imageUrl = await uploadImage();
      if (!imageUrl) { setSending(false); return; }
      content = imageUrl; // image-only message
    }

    // Optimistic: show message immediately
    const tempId = `temp_${Date.now()}`;
    const optimisticMsg = {
      message_id: tempId,
      sender_id: user?.user_id,
      author_id: user?.user_id,
      author_name: user?.nickname || user?.name,
      author_picture: user?.picture,
      content,
      created_at: new Date().toISOString(),
    };
    setMessages(prev => [...prev, optimisticMsg]);
    setNewMessage("");
    clearImageState();

    if (chatMode === "friend" && activeRoomId) {
      try {
        const res = await fetch(`${API_URL}/api/chat/rooms/${activeRoomId}/messages`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ content }),
        });
        if (res.ok) {
          const msg = await res.json();
          setMessages(prev => prev.map(m => m.message_id === tempId ? msg : m));
        } else {
          setMessages(prev => prev.filter(m => m.message_id !== tempId));
          setNewMessage(textContent);
        }
      } catch {
        setMessages(prev => prev.filter(m => m.message_id !== tempId));
        setNewMessage(textContent);
      }
    } else if (chatMode === "dm" && activeDmUser) {
      try {
        const res = await fetch(`${API_URL}/api/messages`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ receiver_id: activeDmUser.user_id, content }),
        });
        if (res.ok) {
          const msg = await res.json();
          setMessages(prev => prev.map(m => m.message_id === tempId ? msg : m));
          fetchConversations();
        } else {
          setMessages(prev => prev.filter(m => m.message_id !== tempId));
          setNewMessage(textContent);
        }
      } catch {
        setMessages(prev => prev.filter(m => m.message_id !== tempId));
        setNewMessage(textContent);
      }
    }
    setSending(false);
  };

  const clearChat = () => {
    setActiveRoomId(null);
    setActiveFriend(null);
    setActiveDmUser(null);
    setChatMode(null);
    setMessages([]);
    clearImageState();
  };

  const activeUser = chatMode === "friend" ? activeFriend : activeDmUser;
  const hasActiveChat = !!(chatMode && (activeRoomId || activeDmUser));

  const friendIds = new Set(friends.map(f => f.user_id));
  const dmFromFriends = conversations.filter(c => friendIds.has(c.other_user_id));
  const dmRequests = conversations.filter(c => !friendIds.has(c.other_user_id));

  return (
    <div className="min-h-screen bg-background pb-20 lg:pb-0">
      <Navigation user={user} />

      <main className="max-w-5xl mx-auto px-4 pt-20 lg:pt-24">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-5 transition-colors text-sm"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h1 className="font-heading text-2xl sm:text-3xl font-bold text-foreground mb-1">Messages</h1>
            <p className="text-sm text-muted-foreground">Your conversations</p>
          </div>
          <Button size="sm" variant="outline" className="rounded-full gap-2" onClick={() => setShowSearch(true)}>
            <Search className="h-4 w-4" />
            Find a parent
          </Button>
        </div>

        <div className="flex gap-4 h-[calc(100vh-200px)]">

          {/* ── Sidebar ─────────────────────────────────────────────────────── */}
          <div className={`${hasActiveChat ? "hidden lg:flex" : "flex"} flex-col w-full lg:w-72 shrink-0`}>
            <div className="bg-card rounded-2xl border border-border/50 flex flex-col h-full overflow-hidden">

              {showSearch ? (
                <UserSearchPanel onClose={() => setShowSearch(false)} onStartChat={handleSearchStartChat} />
              ) : (
                <div className="flex-1 overflow-y-auto">
                  {(loadingFriends && loadingConvs) ? (
                    <div className="p-4 space-y-3">
                      {[1,2,3].map(i => <div key={i} className="flex items-center gap-3 animate-pulse"><div className="w-10 h-10 rounded-full bg-muted shrink-0" /><div className="flex-1 h-4 bg-muted rounded" /></div>)}
                    </div>
                  ) : (
                    <>
                      {/* Message Requests — people outside your friends list who messaged you */}
                      {dmRequests.length > 0 && (
                        <>
                          <div className="px-4 py-2 bg-amber-500/5 border-b border-amber-500/20 flex items-center gap-2">
                            <span className="text-xs font-semibold text-amber-600 uppercase tracking-wide">Message Requests</span>
                            <span className="text-xs bg-amber-500/10 text-amber-600 rounded-full px-1.5">{dmRequests.length}</span>
                          </div>
                          <div className="divide-y divide-border/30">
                            {dmRequests.map(conv => (
                              <DmRow
                                key={conv.other_user_id}
                                conv={conv}
                                active={activeDmUser?.user_id === conv.other_user_id}
                                onClick={() => openDmChat({ user_id: conv.other_user_id, name: conv.other_user_name, nickname: null, picture: conv.other_user_picture })}
                              />
                            ))}
                          </div>
                        </>
                      )}

                      {/* Friends — with DM history shown as conversation, without shown as contact */}
                      {friends.length > 0 && (
                        <>
                          <div className="px-4 py-2 bg-secondary/30 border-b border-border/30">
                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Friends</p>
                          </div>
                          <div className="divide-y divide-border/30">
                            {friends.map(friend => {
                              const conv = dmFromFriends.find(c => c.other_user_id === friend.user_id);
                              if (conv) {
                                // Has DM history — show as conversation row with last message
                                return (
                                  <DmRow
                                    key={friend.user_id}
                                    conv={{ ...conv, other_user_picture: friend.picture || conv.other_user_picture }}
                                    active={activeDmUser?.user_id === friend.user_id}
                                    onClick={() => openDmChat({ user_id: friend.user_id, name: conv.other_user_name, nickname: friend.nickname, picture: friend.picture || conv.other_user_picture, is_online: friend.is_online })}
                                  />
                                );
                              }
                              // No DM history — show as contact, opens live chat
                              return (
                                <button
                                  key={friend.user_id}
                                  onClick={() => openFriendChat(friend)}
                                  disabled={openingChat === friend.user_id}
                                  className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-secondary/50 transition-colors text-left ${activeFriend?.user_id === friend.user_id ? "bg-primary/10" : ""}`}
                                >
                                  <UserAvatar {...friend} isOnline={friend.is_online} />
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-foreground truncate">{friend.nickname || friend.name}</p>
                                    <p className={`text-xs ${friend.is_online ? "text-green-500" : "text-muted-foreground"}`}>
                                      {friend.is_online ? "Active now" : "Tap to chat"}
                                    </p>
                                  </div>
                                  {openingChat === friend.user_id && <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin shrink-0" />}
                                </button>
                              );
                            })}
                          </div>
                        </>
                      )}

                      {/* Empty state */}
                      {friends.length === 0 && conversations.length === 0 && (
                        <div className="p-6 text-center">
                          <span className="text-3xl block mb-2">💬</span>
                          <p className="text-sm text-muted-foreground mb-2">No conversations yet.</p>
                          <button onClick={() => setShowSearch(true)} className="text-xs text-primary hover:underline">
                            Find parents to connect with →
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* ── Chat panel ──────────────────────────────────────────────────── */}
          <div className={`${hasActiveChat ? "flex" : "hidden lg:flex"} flex-1 flex-col min-w-0`}>
            <div className="bg-card rounded-2xl border border-border/50 flex flex-col h-full overflow-hidden">
              {hasActiveChat && activeUser ? (
                <>
                  {/* Chat header */}
                  <div className="flex items-center gap-3 px-4 py-3 border-b border-border/50 shrink-0">
                    <button onClick={clearChat} className="lg:hidden p-1 text-muted-foreground hover:text-foreground">
                      <ArrowLeft className="h-5 w-5" />
                    </button>
                    <UserAvatar picture={activeUser.picture} name={activeUser.name} nickname={activeUser.nickname} isOnline={activeUser.is_online} />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground text-sm">{activeUser.nickname || activeUser.name}</p>
                      <p className={`text-xs ${activeUser.is_online ? "text-green-500" : "text-muted-foreground"}`}>
                        {chatMode === "friend" ? (activeUser.is_online ? "Active now" : "Offline") : "Private message"}
                      </p>
                    </div>
                    {/* Chat type badge */}
                    {chatMode === "friend" ? (
                      <span className="flex items-center gap-1 text-xs bg-primary/10 text-primary border border-primary/20 rounded-full px-2.5 py-1 font-medium shrink-0">
                        <Users className="h-3 w-3" /> Friend Chat
                      </span>
                    ) : (
                      <span className={`flex items-center gap-1 text-xs rounded-full px-2.5 py-1 font-medium shrink-0 border ${friendIds.has(activeUser.user_id) ? "bg-primary/10 text-primary border-primary/20" : "bg-amber-500/10 text-amber-600 border-amber-500/20"}`}>
                        <Lock className="h-3 w-3" />
                        {friendIds.has(activeUser.user_id) ? "Private" : "Message Request"}
                      </span>
                    )}
                  </div>

                  {/* Messages */}
                  <div
                    ref={scrollContainerRef}
                    onScroll={() => {
                      const el = scrollContainerRef.current;
                      if (el) isAtBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 60;
                    }}
                    className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0"
                  >
                    {loadingMessages ? (
                      <div className="flex items-center justify-center py-12">
                        <div className="w-5 h-5 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
                      </div>
                    ) : (
                      <>
                        {messages.length === 0 && (
                          <div className="text-center py-8">
                            <MessagesSquare className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
                            <p className="text-sm text-muted-foreground">No messages yet. Say hi!</p>
                          </div>
                        )}
                        {messages.map((msg, idx) => {
                          const isOwn = (msg.author_id || msg.sender_id) === user?.user_id;
                          return (
                            <MessageBubble
                              key={msg.message_id || msg.dm_id || idx}
                              msg={msg}
                              isOwn={isOwn}
                              activeUser={activeUser}
                            />
                          );
                        })}
                        <div ref={messagesEndRef} />
                      </>
                    )}
                  </div>

                  {/* Image preview */}
                  {imagePreview && (
                    <div className="px-3 pt-2 shrink-0">
                      <div className="relative inline-block">
                        <img src={imagePreview} alt="Preview" className="h-24 rounded-xl object-cover border border-border/50" />
                        <button
                          onClick={clearImageState}
                          className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-card border border-border flex items-center justify-center hover:bg-secondary"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Composer */}
                  <form onSubmit={handleSend} className="flex items-center gap-2 bg-card border-t border-border/50 px-4 py-3 shrink-0">
                    {/* Hidden file input */}
                    <input
                      ref={imageInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageSelect}
                    />
                    {/* Photo button */}
                    <button
                      type="button"
                      onClick={() => imageInputRef.current?.click()}
                      className="w-10 h-10 rounded-full flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors shrink-0"
                      title="Send a photo"
                    >
                      <ImageIcon className="h-5 w-5" />
                    </button>
                    <input
                      ref={inputRef}
                      value={newMessage}
                      onChange={e => setNewMessage(e.target.value.slice(0, 1000))}
                      placeholder={imageFile ? "Add a caption (optional)..." : `Message ${activeUser.nickname || activeUser.name}...`}
                      className="flex-1 bg-secondary/50 rounded-full px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/30"
                      maxLength={1000}
                      disabled={sending || uploadingImage}
                    />
                    <button
                      type="submit"
                      disabled={(!newMessage.trim() && !imageFile) || sending || uploadingImage}
                      className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center disabled:opacity-50 shrink-0"
                    >
                      {sending || uploadingImage
                        ? <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                        : <Send className="h-4 w-4" />
                      }
                    </button>
                  </form>
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                  <MessagesSquare className="h-12 w-12 text-muted-foreground/30 mb-4" />
                  <h3 className="font-heading font-semibold text-foreground mb-1">Select a conversation</h3>
                  <p className="text-sm text-muted-foreground max-w-xs mb-6">
                    Choose a friend from the list, or find someone new to connect with.
                  </p>
                  <Button size="sm" variant="outline" className="rounded-full gap-2" onClick={() => setShowSearch(true)}>
                    <Search className="h-4 w-4" />
                    Find a parent
                  </Button>
                </div>
              )}
            </div>
          </div>

        </div>
        <AppFooter />
      </main>
    </div>
  );
}
