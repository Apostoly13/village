import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "../components/ui/button";
import Navigation from "../components/Navigation";
import { ArrowLeft, MessagesSquare, Search, UserPlus, X, ImageIcon, Users, Lock, ShoppingBag, Calendar, ExternalLink } from "lucide-react";
import { SendIcon, ReportIcon } from "../components/village/VillageLineIcons";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "../components/ui/dialog";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Sparkles, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import { timeAgoVerbose } from "../utils/dateHelpers";
import { parseApiError } from "../utils/apiError";
import { playChime } from "../utils/sounds";
import AppFooter from "../components/AppFooter";

const API_URL = process.env.REACT_APP_BACKEND_URL;

const playDing = () => playChime("message");

const formatTime = timeAgoVerbose;

// ── User search panel ─────────────────────────────────────────────────────────
function UserSearchPanel({ onClose, onStartChat, isFree }) {
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
            <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold overflow-hidden shrink-0" style={{ background: "var(--paper-2)", color: "var(--ink-2)" }}>
              {u.picture ? <img src={u.picture} alt="" className="w-full h-full object-cover" /> : (u.nickname || u.name)?.[0]?.toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{u.nickname || u.name}</p>
              <p className="text-xs text-muted-foreground">{u.is_online ? "Online" : "Parent"}</p>
            </div>
            <div className="flex gap-2 shrink-0">
              {!isFree && (
                <Button size="sm" variant="outline" className="rounded-full h-8 text-xs px-3" onClick={() => onStartChat(u)}>
                  Message
                </Button>
              )}
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
      <div className={`${sz} rounded-full flex items-center justify-center font-semibold overflow-hidden`} style={{ background: "var(--paper-2)", color: "var(--ink-2)" }}>
        {picture ? <img src={picture} alt="" className="w-full h-full object-cover" /> : (nickname || name)?.[0]?.toUpperCase()}
      </div>
      <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-card ${isOnline ? "" : "bg-muted-foreground/40"}`} style={isOnline ? { background: "var(--status-online)" } : {}} />
    </div>
  );
}

// ── DM row ────────────────────────────────────────────────────────────────────
function DmRow({ conv, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-secondary/50 transition-colors text-left ${active ? "bg-[var(--paper-3)]" : ""}`}
    >
      <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold overflow-hidden shrink-0" style={{ background: "var(--paper-2)", color: "var(--ink-2)" }}>
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
function MessageBubble({ msg, isOwn, activeUser, onReport }) {
  const isImage = msg.content?.startsWith("data:image/");
  return (
    <div className={`flex group ${isOwn ? "justify-end" : "justify-start"}`}>
      <div className="max-w-[75%] min-w-0 overflow-hidden">
        {!isOwn && (
          <p className="text-xs text-muted-foreground mb-1 ml-1 flex items-center gap-1">
            {msg.author_name || activeUser?.nickname || activeUser?.name}
            {msg.author_subscription_tier === "premium" && <Sparkles className="h-2.5 w-2.5" style={{ color: "hsl(var(--accent))" }} />}
          </p>
        )}
        <div className={`flex items-end gap-1 ${isOwn ? "flex-row-reverse" : "flex-row"}`}>
          {isImage ? (
            <div className={`overflow-hidden shadow-sm rounded-2xl`}>
              <img
                src={msg.content}
                alt="Shared photo"
                className="max-w-full max-h-64 object-contain cursor-zoom-in"
                onClick={() => setLightboxImage(msg.content)}
              />
            </div>
          ) : (
            <div className={`px-4 py-2.5 text-sm shadow-sm break-words overflow-hidden rounded-2xl ${isOwn ? "bg-primary text-primary-foreground" : "bg-card border border-border/50 text-foreground"}`}>
              {msg.content}
            </div>
          )}
          {!isOwn && onReport && (
            <button
              onClick={() => onReport(msg)}
              className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mb-1 p-1 rounded text-muted-foreground hover:text-destructive"
              title="Report message"
            >
              <ReportIcon size={12} />
            </button>
          )}
        </div>
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
  const { userId: targetUserId } = useParams();

  const [showSearch, setShowSearch] = useState(false);
  const [inboxTab, setInboxTab] = useState("all"); // "all" | "unread" | "friends" | "stall"

  const [friends, setFriends] = useState([]);
  const [loadingFriends, setLoadingFriends] = useState(true);

  const [conversations, setConversations] = useState([]);
  const [messageRequests, setMessageRequests] = useState([]);
  const [loadingConvs, setLoadingConvs] = useState(true);

  const [stallConversations, setStallConversations] = useState([]);
  const [eventConversations, setEventConversations] = useState([]);

  const [chatMode, setChatMode] = useState(null); // "friend" | "dm" | "stall" | "event"
  const [activeRoomId, setActiveRoomId] = useState(null);
  const [activeFriend, setActiveFriend] = useState(null);
  const [activeDmUser, setActiveDmUser] = useState(null);
  const [activeStallConv, setActiveStallConv] = useState(null);
  const [activeEventConv, setActiveEventConv] = useState(null);

  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [openingChat, setOpeningChat] = useState(null);

  // Add friend from DM header
  const [friendRequestSent, setFriendRequestSent] = useState(false);

  // Photo upload
  const [imagePreview, setImagePreview] = useState(null); // data URL
  const [imageFile, setImageFile] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [lightboxImage, setLightboxImage] = useState(null);

  const [loadingMessages, setLoadingMessages] = useState(false);

  // Report flow
  const [reportTarget, setReportTarget] = useState(null); // { msg, contentType }
  const [reportReason, setReportReason] = useState("");
  const [reportDetails, setReportDetails] = useState("");
  const [reportSubmitting, setReportSubmitting] = useState(false);

  const messagesEndRef = useRef(null);
  const scrollContainerRef = useRef(null);
  const isAtBottom = useRef(true);
  const prevMsgCount = useRef(0);
  const inputRef = useRef(null);
  const imageInputRef = useRef(null);

  useEffect(() => {
    fetchFriends();
    fetchConversations();
    fetchStallConversations();
    fetchEventConversations();
    if (targetUserId && user) {
      setTimeout(async () => {
        try {
          const res = await fetch(`${API_URL}/api/users/${targetUserId}/profile`, { credentials: "include" });
          if (res.ok) {
            const profile = await res.json();
            openDmChat({ user_id: profile.user_id, name: profile.name, nickname: profile.nickname, picture: profile.picture, is_online: profile.is_online });
          }
        } catch {}
      }, 100);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // When a DM is read in the popout, instantly clear unread counts in this page's list too
  useEffect(() => {
    const onDmRead = () => {
      setConversations(prev => prev.map(c => ({ ...c, unread_count: 0 })));
    };
    window.addEventListener("village:dm-read", onDmRead);
    return () => window.removeEventListener("village:dm-read", onDmRead);
  }, []);

  useEffect(() => {
    if (activeRoomId && chatMode === "friend") {
      fetchRoomMessages();
      const interval = setInterval(fetchRoomMessages, 1500);
      return () => clearInterval(interval);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeRoomId, chatMode]);

  useEffect(() => {
    if (activeStallConv && chatMode === "stall") {
      fetchStallMessages();
      const interval = setInterval(fetchStallMessages, 2000);
      return () => clearInterval(interval);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeStallConv, chatMode]);

  useEffect(() => {
    if (activeEventConv && chatMode === "event") {
      fetchEventMessages();
      const interval = setInterval(fetchEventMessages, 2000);
      return () => clearInterval(interval);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeEventConv, chatMode]);

  useEffect(() => {
    setFriendRequestSent(false);
    if (activeDmUser && chatMode === "dm") {
      fetchDmMessages(true);
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
      if (res.ok) {
        const all = await res.json();
        setMessageRequests(all.filter(c => c.is_pending_request));
        setConversations(all.filter(c => !c.is_pending_request));
      } else {
        toast.error("Failed to load conversations", { action: { label: "Retry", onClick: fetchConversations } });
      }
    } catch {
      toast.error("Couldn't reach the server", { action: { label: "Retry", onClick: fetchConversations } });
    }
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

  const fetchDmMessages = async (isInitial = false) => {
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
        // Clear unread count for this conversation immediately in local state
        setConversations(prev =>
          prev.map(c => c.other_user_id === activeDmUser.user_id ? { ...c, unread_count: 0 } : c)
        );
        if (isInitial) {
          // Mark DM notifications as read so the bell clears immediately
          fetch(`${API_URL}/api/notifications/mark-dm-read`, { method: "POST", credentials: "include" }).catch(() => {});
          // Tell Navigation to re-poll its unread badge right away
          window.dispatchEvent(new Event("village:dm-read"));
        }
      }
    } catch {}
    finally { setLoadingMessages(false); }
  };

  const fetchStallConversations = async () => {
    try {
      const res = await fetch(`${API_URL}/api/stall/messages/conversations`, { credentials: "include" });
      if (res.ok) setStallConversations(await res.json());
    } catch {}
  };

  const fetchEventConversations = async () => {
    try {
      const res = await fetch(`${API_URL}/api/events/my-chats`, { credentials: "include" });
      if (res.ok) setEventConversations(await res.json());
    } catch {}
  };

  const fetchStallMessages = async () => {
    if (!activeStallConv) return;
    try {
      const res = await fetch(
        `${API_URL}/api/stall/messages/${activeStallConv.listing_id}/${activeStallConv.other_user_id}`,
        { credentials: "include" }
      );
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

  const fetchEventMessages = async () => {
    if (!activeEventConv) return;
    try {
      const res = await fetch(`${API_URL}/api/events/${activeEventConv.event_id}/chat`, { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        if (prevMsgCount.current > 0 && data.length > prevMsgCount.current) {
          const lastMsg = data[data.length - 1];
          if (lastMsg && lastMsg.author_id !== user?.user_id) playDing();
        }
        prevMsgCount.current = data.length;
        setMessages(data);
      }
    } catch {}
    finally { setLoadingMessages(false); }
  };

  const openStallChat = (conv) => {
    setLoadingMessages(true);
    prevMsgCount.current = 0;
    setActiveStallConv(conv);
    setActiveEventConv(null);
    setActiveRoomId(null);
    setActiveFriend(null);
    setActiveDmUser(null);
    setChatMode("stall");
    setMessages([]);
    clearImageState();
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const openEventChat = (conv) => {
    setLoadingMessages(true);
    prevMsgCount.current = 0;
    setActiveEventConv(conv);
    setActiveStallConv(null);
    setActiveRoomId(null);
    setActiveFriend(null);
    setActiveDmUser(null);
    setChatMode("event");
    setMessages([]);
    clearImageState();
    setTimeout(() => inputRef.current?.focus(), 100);
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

  const handleAcceptRequest = async (req) => {
    try {
      const res = await fetch(`${API_URL}/api/messages/${req.other_user_id}/accept-request`, {
        method: "POST", credentials: "include",
      });
      if (res.ok) {
        setMessageRequests(prev => prev.filter(r => r.other_user_id !== req.other_user_id));
        setConversations(prev => [{ ...req, is_pending_request: false, is_outgoing_request: false }, ...prev]);
        openDmChat({ user_id: req.other_user_id, name: req.other_user_name, picture: req.other_user_picture });
        toast.success("Request accepted");
      }
    } catch { toast.error("Something went wrong"); }
  };

  const handleDeclineRequest = async (req) => {
    try {
      const res = await fetch(`${API_URL}/api/messages/${req.other_user_id}/decline-request`, {
        method: "POST", credentials: "include",
      });
      if (res.ok) {
        setMessageRequests(prev => prev.filter(r => r.other_user_id !== req.other_user_id));
        toast.success("Request declined");
      }
    } catch { toast.error("Something went wrong"); }
  };

  const sendFriendRequestFromChat = async () => {
    if (!activeDmUser) return;
    try {
      const res = await fetch(`${API_URL}/api/friends/request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ to_user_id: activeDmUser.user_id }),
      });
      if (res.ok) {
        setFriendRequestSent(true);
        toast.success("Friend request sent!");
      } else {
        const err = await res.json();
        toast.info(parseApiError(err.detail, "Request already sent"));
        setFriendRequestSent(true); // treat as sent regardless
      }
    } catch { toast.error("Something went wrong"); }
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

  // ── Report message ──────────────────────────────────────────────────────────
  const handleReportMessage = (msg) => {
    const contentType = chatMode === "dm" ? "direct_message" : "chat_message";
    setReportTarget({ msg, contentType });
    setReportReason("");
    setReportDetails("");
  };

  const submitReport = async () => {
    if (!reportReason || !reportTarget) return;
    setReportSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/api/reports`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          content_type: reportTarget.contentType,
          content_id: reportTarget.msg.message_id || reportTarget.msg.dm_id,
          reason: reportReason,
          details: reportDetails,
        }),
      });
      if (res.ok) {
        toast.success("Report submitted. Our team will review it.");
        setReportTarget(null);
      } else {
        const d = await res.json();
        toast.error(d.detail || "Could not submit report");
      }
    } catch {
      toast.error("Could not submit report");
    } finally {
      setReportSubmitting(false);
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
          try {
            const err = await res.json();
            const detail = err.detail || {};
            if (detail.error === "daily_chat_limit") {
              toast.error(`You've used today's free messages — they reset at midnight. Village+ chats without limits.`, {
                action: { label: "Upgrade", onClick: () => navigate("/plus") },
              });
            } else if (detail.error === "village_plus_required") {
              toast.error("Village+ is required to start new conversations.", {
                action: { label: "Upgrade", onClick: () => navigate("/plus") },
              });
            } else if (detail.error === "request_pending") {
              toast.info("Your message request is waiting. You'll be able to send more once they accept.");
            } else {
              toast.error("Message failed to send. Please try again.");
            }
          } catch {
            toast.error("Message failed to send. Please try again.");
          }
        }
      } catch {
        setMessages(prev => prev.filter(m => m.message_id !== tempId));
        setNewMessage(textContent);
        toast.error("Message failed to send. Please try again.");
      }
    } else if (chatMode === "stall" && activeStallConv) {
      try {
        const res = await fetch(`${API_URL}/api/stall/messages`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            listing_id: activeStallConv.listing_id,
            receiver_id: activeStallConv.other_user_id,
            content,
          }),
        });
        if (res.ok) {
          const msg = await res.json();
          setMessages(prev => prev.map(m => m.message_id === tempId ? msg : m));
          fetchStallConversations();
        } else {
          setMessages(prev => prev.filter(m => m.message_id !== tempId));
          setNewMessage(textContent);
          toast.error("Message failed to send.");
        }
      } catch {
        setMessages(prev => prev.filter(m => m.message_id !== tempId));
        setNewMessage(textContent);
        toast.error("Message failed to send. Please try again.");
      }
    } else if (chatMode === "event" && activeEventConv) {
      try {
        const res = await fetch(`${API_URL}/api/events/${activeEventConv.event_id}/chat`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ content }),
        });
        if (res.ok) {
          const msg = await res.json();
          setMessages(prev => prev.map(m => m.message_id === tempId ? msg : m));
          fetchEventConversations();
        } else {
          setMessages(prev => prev.filter(m => m.message_id !== tempId));
          setNewMessage(textContent);
          toast.error("Message failed to send.");
        }
      } catch {
        setMessages(prev => prev.filter(m => m.message_id !== tempId));
        setNewMessage(textContent);
        toast.error("Message failed to send. Please try again.");
      }
    }
    setSending(false);
  };

  const clearChat = () => {
    setActiveRoomId(null);
    setActiveFriend(null);
    setActiveDmUser(null);
    setActiveStallConv(null);
    setActiveEventConv(null);
    setChatMode(null);
    setMessages([]);
    clearImageState();
  };

  const activeUser = chatMode === "friend" ? activeFriend : (chatMode === "stall" || chatMode === "event") ? null : activeDmUser;
  const hasActiveChat = !!(chatMode && (activeRoomId || activeDmUser || activeStallConv || activeEventConv));

  const isFree = user?.subscription_tier === "free";
  const friendIds = new Set(friends.map(f => f.user_id));
  // conversations state is already filtered (no pending requests) by fetchConversations
  const dmFromFriends = conversations.filter(c => friendIds.has(c.other_user_id));
  // Established DMs from non-friends (accepted conversations, not pending requests)
  const dmEstablished = conversations.filter(c => !friendIds.has(c.other_user_id));
  // Is the active DM an outgoing request that's still pending?
  const activeDmIsOutgoingRequest = chatMode === "dm" && activeDmUser &&
    conversations.some(c => c.other_user_id === activeDmUser.user_id && c.is_outgoing_request);

  // Unified "Recent" list — DMs (friend + non-friend) + Stall + Events, sorted by last message time
  const friendDmConvIds = new Set(dmFromFriends.map(c => c.other_user_id));
  const recentConversations = [
    ...dmFromFriends.map(c => ({ ...c, _type: "friend_dm" })),
    ...dmEstablished.map(c => ({ ...c, _type: "dm" })),
    ...stallConversations.map(c => ({ ...c, _type: "stall", _key: `${c.listing_id}_${c.other_user_id}` })),
    ...eventConversations.map(c => ({ ...c, _type: "event", _key: `event_${c.event_id}`, unread_count: 0 })),
  ].sort((a, b) => (b.last_message_time || "").localeCompare(a.last_message_time || ""));

  // Friends with no conversation history at all (no DMs, no stall thread)
  const friendsContactOnly = friends.filter(
    f => !friendDmConvIds.has(f.user_id) && !dmEstablished.some(c => c.other_user_id === f.user_id)
  );

  // Tab-filtered conversation list
  const filteredRecent = recentConversations.filter(c => {
    if (inboxTab === "unread")  return (c.unread_count || 0) > 0;
    if (inboxTab === "friends") return c._type === "friend_dm";
    if (inboxTab === "stall")   return c._type === "stall";
    if (inboxTab === "events")  return c._type === "event";
    return true; // "all"
  });
  const showContactsSection = inboxTab === "all";

  // Unread badge counts per tab
  const unreadTotal = recentConversations.reduce((n, c) => n + (c.unread_count || 0), 0) + messageRequests.length;
  const unreadFriends = recentConversations.filter(c => c._type === "friend_dm").reduce((n, c) => n + (c.unread_count || 0), 0);
  const unreadStall = stallConversations.reduce((n, c) => n + (c.unread_count || 0), 0);
  // Events have no per-message read tracking yet — badge omitted
  const unreadEvents = 0;

  return (
    <div className="min-h-screen bg-background  lg:pl-60 lg:pb-0">
      <Navigation user={user} />

      <main className="max-w-5xl mx-auto px-4 pt-16 lg:pt-8">
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

        <div className="flex gap-4 h-[calc(100dvh-200px)]">

          {/* ── Sidebar ─────────────────────────────────────────────────────── */}
          <div className={`${hasActiveChat ? "hidden lg:flex" : "flex"} flex-col w-full lg:w-72 shrink-0`}>
            <div className="village-card flex flex-col h-full overflow-hidden">

              {/* ── Tab filter bar ── */}
              {!showSearch && (
                <div className="flex items-center gap-1 px-2 py-2.5 border-b border-border/30 shrink-0">
                  {[
                    { id: "all",     label: "All",     badge: unreadTotal },
                    { id: "unread",  label: "Unread",  badge: unreadTotal },
                    { id: "friends", label: "Friends", badge: unreadFriends },
                    { id: "stall",   label: "Stall",   badge: unreadStall },
                    { id: "events",  label: "Events",  badge: unreadEvents },
                  ].map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setInboxTab(tab.id)}
                      className={`relative flex-1 flex items-center justify-center gap-1 py-1.5 rounded-full text-[11px] font-semibold transition-colors ${
                        inboxTab === tab.id ? "" : "text-muted-foreground hover:text-foreground"
                      }`}
                      style={inboxTab === tab.id ? { background: "var(--ink)", color: "var(--paper)" } : {}}
                    >
                      {tab.label}
                      {tab.badge > 0 && inboxTab !== tab.id && (
                        <span className="min-w-[14px] h-3.5 rounded-full text-white text-[9px] flex items-center justify-center px-0.5 font-bold" style={{ background: "var(--badge-danger)" }}>
                          {tab.badge > 9 ? "9+" : tab.badge}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              )}

              {showSearch ? (
                <UserSearchPanel onClose={() => setShowSearch(false)} onStartChat={handleSearchStartChat} isFree={isFree} />
              ) : (
                <div className="flex-1 overflow-y-auto">
                  {(loadingFriends && loadingConvs) ? (
                    <div className="p-3 space-y-1">
                      {[1, 2, 3, 4, 5].map(i => (
                        <div key={i} className="flex items-center gap-3 px-2 py-3 animate-pulse">
                          <div className="w-10 h-10 rounded-full bg-muted shrink-0" />
                          <div className="flex-1 min-w-0 space-y-1.5">
                            <div className="flex items-center justify-between gap-2">
                              <div className="h-3 bg-muted rounded w-28" />
                              <div className="h-2.5 bg-muted rounded w-10 shrink-0" />
                            </div>
                            <div className="h-2.5 bg-muted rounded w-4/5" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <>
                      {/* Pending message requests — Accept / Decline (All and Unread tabs only) */}
                      {messageRequests.length > 0 && (inboxTab === "all" || inboxTab === "unread") && (
                        <>
                          <div className="px-4 py-2 border-b border-amber-500/20 flex items-center gap-2" style={{ background: "var(--honey-wash)" }}>
                            <span className="tv-mono" style={{ color: "var(--honey-deep, #a07820)" }}>Message Requests</span>
                            <span className="text-xs rounded-full px-1.5 font-semibold" style={{ background: "rgba(245,197,66,0.15)", color: "var(--honey-deep, #a07820)" }}>{messageRequests.length}</span>
                          </div>
                          <div className="divide-y divide-border/30">
                            {messageRequests.map(req => (
                              <div key={req.other_user_id} className="px-4 py-3">
                                <div className="flex items-center gap-3 mb-2">
                                  <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold overflow-hidden shrink-0" style={{ background: "var(--paper-2)", color: "var(--ink-2)" }}>
                                    {req.other_user_picture
                                      ? <img src={req.other_user_picture} alt="" className="w-full h-full object-cover" />
                                      : req.other_user_name?.[0]?.toUpperCase()}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-foreground truncate">{req.other_user_name}</p>
                                    <p className="text-xs text-muted-foreground truncate">
                                      {req.request_preview?.startsWith("data:image/") ? "📷 Photo" : req.request_preview}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => handleAcceptRequest(req)}
                                    className="flex-1 text-xs font-medium py-1.5 rounded-xl hover:opacity-90 transition-opacity" style={{ background: "var(--ink)", color: "var(--paper)" }}
                                  >
                                    Accept
                                  </button>
                                  <button
                                    onClick={() => handleDeclineRequest(req)}
                                    className="flex-1 text-xs font-medium py-1.5 rounded-xl bg-secondary text-foreground hover:bg-secondary/70 transition-colors"
                                  >
                                    Decline
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </>
                      )}

                      {inboxTab === "friends" ? (
                        // Unified friends view — all friends under one section
                        (() => {
                          const allFriendItems = [
                            // Friends with conversation history
                            ...dmFromFriends.map(c => {
                              const friend = friends.find(f => f.user_id === c.other_user_id);
                              return { type: "conv", conv: c, friend, sortKey: c.last_message_time || "" };
                            }),
                            // Friends with no conversation history
                            ...friendsContactOnly.map(f => ({ type: "contact", friend: f, sortKey: "" })),
                          ].sort((a, b) => b.sortKey.localeCompare(a.sortKey));

                          if (allFriendItems.length === 0) return (
                            <div className="p-6 text-center">
                              <UserPlus size={28} style={{ color: "var(--ink-3)", margin: "0 auto 12px" }} />
                              <p style={{ fontFamily: "var(--serif)", fontStyle: "italic", fontSize: 13, color: "var(--ink-3)" }}>No friends yet. Add friends to chat privately.</p>
                            </div>
                          );

                          return (
                            <>
                              <div className="px-4 py-2">
                                <p className="tv-mono" style={{ color: "var(--ink-3)" }}>Friends</p>
                              </div>
                              <div className="divide-y divide-border/30">
                                {allFriendItems.map(item => {
                                  if (item.type === "conv") {
                                    const { conv, friend } = item;
                                    const pic = friend?.picture || conv.other_user_picture;
                                    const name = friend?.nickname || conv.other_user_name;
                                    return (
                                      <button
                                        key={conv.other_user_id}
                                        onClick={() => openDmChat({ user_id: conv.other_user_id, name: conv.other_user_name, nickname: friend?.nickname, picture: pic, is_online: friend?.is_online })}
                                        className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-secondary/50 transition-colors text-left ${activeDmUser?.user_id === conv.other_user_id ? "bg-[var(--paper-3)]" : ""}`}
                                      >
                                        <div className="relative shrink-0">
                                          <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold overflow-hidden" style={{ background: "var(--paper-2)", color: "var(--ink-2)" }}>
                                            {pic ? <img src={pic} alt="" className="w-full h-full object-cover" /> : name?.[0]?.toUpperCase()}
                                          </div>
                                          {friend?.is_online && <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-card" style={{ background: "var(--status-online)" }} />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                          <div className="flex items-center justify-between gap-1">
                                            <p className="text-sm font-medium text-foreground truncate">{name}</p>
                                            {conv.unread_count > 0 && (
                                              <span className="shrink-0 min-w-[18px] h-[18px] rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-bold px-1">{conv.unread_count}</span>
                                            )}
                                          </div>
                                          <p className="text-xs text-muted-foreground truncate">
                                            {conv.last_message?.startsWith("data:image/") ? "📷 Photo" : conv.last_message}
                                          </p>
                                        </div>
                                      </button>
                                    );
                                  } else {
                                    const { friend } = item;
                                    return (
                                      <button
                                        key={friend.user_id}
                                        onClick={() => openFriendChat(friend)}
                                        disabled={openingChat === friend.user_id}
                                        className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-secondary/50 transition-colors text-left ${activeFriend?.user_id === friend.user_id ? "bg-[var(--paper-3)]" : ""}`}
                                      >
                                        <UserAvatar {...friend} isOnline={friend.is_online} />
                                        <div className="flex-1 min-w-0">
                                          <p className="text-sm font-medium text-foreground truncate">{friend.nickname || friend.name}</p>
                                          <p className="text-xs text-muted-foreground" style={friend.is_online ? { color: "var(--status-online)" } : {}}>
                                            {friend.is_online ? "Active now" : "Tap to chat"}
                                          </p>
                                        </div>
                                        {openingChat === friend.user_id && <div className="w-4 h-4 border-2 border-[var(--ink-2)] border-t-transparent rounded-full animate-spin shrink-0" />}
                                      </button>
                                    );
                                  }
                                })}
                              </div>
                            </>
                          );
                        })()
                      ) : (
                        // All other tabs — existing rendering
                        <>
                          {/* ── Filtered conversations ── */}
                          {filteredRecent.length > 0 && (
                            <>
                              {filteredRecent.map(conv => {
                                const key = conv._key || conv.other_user_id;
                                if (conv._type === "event") {
                                  const isActive = chatMode === "event" && activeEventConv?.event_id === conv.event_id;
                                  const eventDate = conv.date ? new Date(conv.date).toLocaleDateString("en-AU", { day: "numeric", month: "short" }) : null;
                                  return (
                                    <button
                                      key={key}
                                      onClick={() => openEventChat(conv)}
                                      className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-secondary/50 transition-colors text-left ${isActive ? "bg-[var(--paper-3)]" : ""}`}
                                    >
                                      <div className="relative shrink-0">
                                        <div className="w-10 h-10 rounded-xl flex items-center justify-center overflow-hidden" style={{ background: "var(--paper-3)" }}>
                                          {conv.image_url
                                            ? <img src={conv.image_url} alt="" className="w-full h-full object-cover" />
                                            : <Calendar className="h-4 w-4 text-primary" />}
                                        </div>
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-foreground truncate">{conv.title}</p>
                                        <p className="text-xs text-muted-foreground truncate flex items-center gap-1">
                                          <Calendar className="h-2.5 w-2.5 shrink-0" />
                                          {eventDate ? eventDate : "Event chat"}
                                          {conv.last_message && <span className="truncate"> · {conv.last_message}</span>}
                                        </p>
                                      </div>
                                    </button>
                                  );
                                }
                                if (conv._type === "stall") {
                                  const isActive = chatMode === "stall" && activeStallConv?.listing_id === conv.listing_id && activeStallConv?.other_user_id === conv.other_user_id;
                                  return (
                                    <button
                                      key={key}
                                      onClick={() => openStallChat(conv)}
                                      className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-secondary/50 transition-colors text-left ${isActive ? "bg-[var(--paper-3)]" : ""}`}
                                    >
                                      <div className="relative shrink-0">
                                        <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center overflow-hidden">
                                          {conv.listing_image
                                            ? <img src={conv.listing_image} alt="" className="w-full h-full object-cover" />
                                            : <ShoppingBag className="h-4 w-4 text-muted-foreground" />}
                                        </div>
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between gap-1">
                                          <p className="text-sm font-medium text-foreground truncate">{conv.other_user_name}</p>
                                          {conv.unread_count > 0 && (
                                            <span className="shrink-0 min-w-[18px] h-[18px] rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-bold px-1">{conv.unread_count}</span>
                                          )}
                                        </div>
                                        <p className="text-xs text-muted-foreground truncate flex items-center gap-1">
                                          <ShoppingBag className="h-2.5 w-2.5 shrink-0" />
                                          {conv.listing_title || "Stall enquiry"}
                                        </p>
                                      </div>
                                    </button>
                                  );
                                }
                                // DM or friend DM
                                const friend = conv._type === "friend_dm" ? friends.find(f => f.user_id === conv.other_user_id) : null;
                                const pic = friend?.picture || conv.other_user_picture;
                                const name = friend?.nickname || conv.other_user_name;
                                return (
                                  <button
                                    key={key}
                                    onClick={() => conv._type === "friend_dm" && friend
                                      ? openDmChat({ user_id: conv.other_user_id, name: conv.other_user_name, nickname: friend.nickname, picture: pic, is_online: friend.is_online })
                                      : openDmChat({ user_id: conv.other_user_id, name: conv.other_user_name, nickname: null, picture: pic })}
                                    className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-secondary/50 transition-colors text-left ${activeDmUser?.user_id === conv.other_user_id ? "bg-[var(--paper-3)]" : ""}`}
                                  >
                                    <div className="relative shrink-0">
                                      <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold overflow-hidden" style={{ background: "var(--paper-2)", color: "var(--ink-2)" }}>
                                        {pic ? <img src={pic} alt="" className="w-full h-full object-cover" /> : name?.[0]?.toUpperCase()}
                                      </div>
                                      {friend?.is_online && <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-card" style={{ background: "var(--status-online)" }} />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center justify-between gap-1">
                                        <p className="text-sm font-medium text-foreground truncate">{name}</p>
                                        {conv.unread_count > 0 && (
                                          <span className="shrink-0 min-w-[18px] h-[18px] rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-bold px-1">{conv.unread_count}</span>
                                        )}
                                      </div>
                                      <p className="text-xs text-muted-foreground truncate flex items-center gap-1">
                                        {conv._type === "dm" && <Lock className="h-2.5 w-2.5 shrink-0 opacity-50" />}
                                        {conv.last_message?.startsWith("data:image/") ? "📷 Photo" : conv.last_message || (conv._type === "dm" ? "Private message" : "")}
                                      </p>
                                    </div>
                                  </button>
                                );
                              })}
                            </>
                          )}

                          {/* Friends with no conversation history — contact-only row */}
                          {showContactsSection && friendsContactOnly.length > 0 && (
                            <>
                              {filteredRecent.length > 0 && <div className="h-px bg-border/30 mx-4" />}
                              <div className="px-4 py-2">
                                <p className="tv-mono" style={{ color: "var(--ink-3)" }}>Friends</p>
                              </div>
                              <div className="divide-y divide-border/30">
                                {friendsContactOnly.map(friend => (
                                  <button
                                    key={friend.user_id}
                                    onClick={() => openFriendChat(friend)}
                                    disabled={openingChat === friend.user_id}
                                    className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-secondary/50 transition-colors text-left ${activeFriend?.user_id === friend.user_id ? "bg-[var(--paper-3)]" : ""}`}
                                  >
                                    <UserAvatar {...friend} isOnline={friend.is_online} />
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm font-medium text-foreground truncate">{friend.nickname || friend.name}</p>
                                      <p className={`text-xs ${friend.is_online ? "text-green-500" : "text-muted-foreground"}`}>
                                        {friend.is_online ? "Active now" : "Tap to chat"}
                                      </p>
                                    </div>
                                    {openingChat === friend.user_id && <div className="w-4 h-4 border-2 border-[var(--ink-2)] border-t-transparent rounded-full animate-spin shrink-0" />}
                                  </button>
                                ))}
                              </div>
                            </>
                          )}

                          {/* Empty state — tab-aware */}
                          {filteredRecent.length === 0 && !(showContactsSection && friendsContactOnly.length > 0) && !(inboxTab === "all" && messageRequests.length > 0) && (
                            <div className="p-6 text-center">
                              {inboxTab === "stall" ? <ShoppingBag size={28} style={{ color: "var(--ink-3)", margin: "0 auto 12px" }} /> : inboxTab === "events" ? <Calendar size={28} style={{ color: "var(--ink-3)", margin: "0 auto 12px" }} /> : <MessageSquare size={28} style={{ color: "var(--ink-3)", margin: "0 auto 12px" }} />}
                              {inboxTab === "unread" && <p style={{ fontFamily: "var(--serif)", fontStyle: "italic", fontSize: 13, color: "var(--ink-3)" }}>All caught up!</p>}
                              {inboxTab === "stall" && <p style={{ fontFamily: "var(--serif)", fontStyle: "italic", fontSize: 13, color: "var(--ink-3)" }}>No Stall enquiries yet. Browse the Stall and message a seller to get started.</p>}
                              {inboxTab === "events" && <p style={{ fontFamily: "var(--serif)", fontStyle: "italic", fontSize: 13, color: "var(--ink-3)" }}>No event chats yet. RSVP to an event to join its group chat.</p>}
                              {inboxTab === "all" && friends.length === 0 && conversations.length === 0 && messageRequests.length === 0 && stallConversations.length === 0 && (
                                isFree ? (
                                  <>
                                    <p className="text-sm text-muted-foreground mb-1">No messages yet.</p>
                                    <p className="text-xs text-muted-foreground mb-3">When another parent messages you, you can reply here for free.</p>
                                    <button onClick={() => navigate("/plus")} className="text-xs hover:underline" style={{ color: "var(--clay)" }}>Upgrade to Village+ to message anyone →</button>
                                  </>
                                ) : (
                                  <>
                                    <p className="text-sm text-muted-foreground mb-2">No conversations yet.</p>
                                    <button onClick={() => setShowSearch(true)} className="text-xs hover:underline" style={{ color: "var(--clay)" }}>Find parents to connect with →</button>
                                  </>
                                )
                              )}
                            </div>
                          )}
                        </>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* ── Chat panel ──────────────────────────────────────────────────── */}
          <div className={`${hasActiveChat ? "flex" : "hidden lg:flex"} flex-1 flex-col min-w-0`}>
            <div className="village-card flex flex-col h-full overflow-hidden">
              {hasActiveChat && (chatMode === "stall" ? activeStallConv : chatMode === "event" ? activeEventConv : activeUser) ? (
                <>
                  {/* Chat header */}
                  <div className="flex items-center gap-3 px-4 py-3 border-b border-border/50 shrink-0">
                    <button onClick={clearChat} className="lg:hidden p-1 text-muted-foreground hover:text-foreground">
                      <ArrowLeft className="h-5 w-5" />
                    </button>
                    {chatMode === "event" ? (
                      <>
                        <button
                          onClick={() => navigate(`/events?event=${activeEventConv?.event_id}`)}
                          className="w-10 h-10 rounded-xl flex items-center justify-center overflow-hidden shrink-0 hover:opacity-80 transition-opacity" style={{ background: "var(--paper-3)" }}
                          title="View event"
                        >
                          {activeEventConv?.image_url
                            ? <img src={activeEventConv.image_url} alt="" className="w-full h-full object-cover" />
                            : <Calendar className="h-4 w-4 text-primary" />}
                        </button>
                        <button onClick={() => navigate(`/events?event=${activeEventConv?.event_id}`)} className="flex-1 min-w-0 text-left group">
                          <p className="font-medium text-foreground text-sm truncate group-hover:underline">{activeEventConv?.title}</p>
                          <p className="text-xs text-muted-foreground truncate">
                            {activeEventConv?.date ? new Date(activeEventConv.date).toLocaleDateString("en-AU", { weekday: "short", day: "numeric", month: "short" }) : "Event chat"}
                          </p>
                        </button>
                        <button
                          onClick={() => navigate(`/events?event=${activeEventConv?.event_id}`)}
                          className="flex items-center gap-1 text-xs rounded-full px-2.5 py-1 font-medium hover:opacity-80 transition-opacity shrink-0"
                          style={{ background: "var(--paper-3)", color: "var(--ink-2)", border: "1px solid var(--line)" }}
                          title="View event"
                        >
                          <ExternalLink className="h-3 w-3" /> View Event
                        </button>
                      </>
                    ) : chatMode === "stall" ? (
                      <>
                        <button
                          onClick={() => navigate(`/stall/listing/${activeStallConv.listing_id}`)}
                          className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center overflow-hidden shrink-0 hover:opacity-80 transition-opacity"
                          title="View listing"
                        >
                          {activeStallConv.listing_image
                            ? <img src={activeStallConv.listing_image} alt="" className="w-full h-full object-cover" />
                            : <ShoppingBag className="h-4 w-4 text-muted-foreground" />}
                        </button>
                        <button onClick={() => navigate(`/stall/listing/${activeStallConv.listing_id}`)} className="flex-1 min-w-0 text-left group">
                          <p className="font-medium text-foreground text-sm truncate group-hover:underline">{activeStallConv.other_user_name}</p>
                          <p className="text-xs text-muted-foreground truncate">{activeStallConv.listing_title || "Stall enquiry"}</p>
                        </button>
                        <button
                          onClick={() => navigate(`/stall/listing/${activeStallConv.listing_id}`)}
                          className="flex items-center gap-1 text-xs bg-secondary text-muted-foreground border border-border/50 rounded-full px-2.5 py-1 font-medium hover:bg-secondary/70 transition-colors shrink-0"
                          title="View listing"
                        >
                          <ExternalLink className="h-3 w-3" /> View Listing
                        </button>
                      </>
                    ) : (
                      <>
                        {/* Clickable avatar → profile */}
                        <button onClick={() => navigate(`/profile/${activeUser.user_id}`)} className="shrink-0 rounded-full focus:outline-none">
                          <UserAvatar picture={activeUser.picture} name={activeUser.name} nickname={activeUser.nickname} isOnline={activeUser.is_online} />
                        </button>
                        {/* Clickable name → profile */}
                        <button onClick={() => navigate(`/profile/${activeUser.user_id}`)} className="flex-1 min-w-0 text-left group">
                          <p className="font-medium text-foreground text-sm group-hover:underline truncate">{activeUser.nickname || activeUser.name}</p>
                          <p className="text-xs text-muted-foreground" style={activeUser.is_online ? { color: "var(--status-online)" } : {}}>
                            {chatMode === "friend" ? (activeUser.is_online ? "Active now" : "Offline") : "Private message"}
                          </p>
                        </button>
                        {/* Right side: badge or Add Friend button */}
                        {chatMode === "friend" || friendIds.has(activeUser.user_id) ? (
                          <span className="flex items-center gap-1 text-xs rounded-full px-2.5 py-1 font-medium shrink-0" style={{ background: "var(--sage-wash)", color: "var(--sage-deep)", border: "1px solid rgba(74,113,85,0.2)" }}>
                            <Users className="h-3 w-3" /> {chatMode === "friend" ? "Friend Chat" : "Friends"}
                          </span>
                        ) : activeDmIsOutgoingRequest ? (
                          <span className="flex items-center gap-1 text-xs bg-amber-500/10 text-amber-600 border border-amber-500/20 rounded-full px-2.5 py-1 font-medium shrink-0">
                            <Lock className="h-3 w-3" /> Request Pending
                          </span>
                        ) : friendRequestSent ? (
                          <span className="flex items-center gap-1 text-xs rounded-full px-2.5 py-1 font-medium shrink-0" style={{ background: "var(--sage-wash)", color: "var(--sage-deep)", border: "1px solid rgba(74,113,85,0.2)" }}>
                            <UserPlus className="h-3 w-3" /> Sent ✓
                          </span>
                        ) : (
                          <button
                            onClick={sendFriendRequestFromChat}
                            className="flex items-center gap-1 text-xs rounded-full px-3 py-1.5 font-medium hover:opacity-90 transition-opacity shrink-0"
                            style={{ background: "var(--ink)", color: "var(--paper)" }}
                          >
                            <UserPlus className="h-3 w-3" /> Add Friend
                          </button>
                        )}
                      </>
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
                        <div className="w-5 h-5 rounded-full border-2 border-[var(--line)] border-t-[var(--ink-2)] animate-spin" />
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
                              onReport={handleReportMessage}
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

                  {/* Outgoing request pending banner */}
                  {activeDmIsOutgoingRequest && (
                    <div className="px-4 py-2.5 border-t border-amber-500/20 shrink-0 text-center" style={{ background: "var(--honey-wash)" }}>
                      <p className="text-xs font-medium" style={{ color: "var(--honey-deep, #a07820)" }}>Message request sent · waiting for them to accept</p>
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
                      className="w-10 h-10 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors shrink-0"
                      title="Send a photo"
                    >
                      <ImageIcon className="h-5 w-5" />
                    </button>
                    <input
                      ref={inputRef}
                      value={newMessage}
                      onChange={e => setNewMessage(e.target.value.slice(0, 1000))}
                      placeholder={
                        imageFile ? "Add a caption (optional)..." :
                        chatMode === "event" ? `Chat in ${activeEventConv?.title || "this event"}...` :
                        chatMode === "stall" ? `Message about ${activeStallConv?.listing_title || "this listing"}...` :
                        `Message ${activeUser?.nickname || activeUser?.name}...`
                      }
                      className="flex-1 bg-secondary/50 rounded-full px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none"
                      maxLength={1000}
                      disabled={sending || uploadingImage}
                    />
                    <button
                      type="submit"
                      disabled={(!newMessage.trim() && !imageFile) || sending || uploadingImage}
                      className="w-10 h-10 rounded-full flex items-center justify-center disabled:opacity-50 shrink-0" style={{ background: "var(--ink)", color: "var(--paper)" }}
                    >
                      {sending || uploadingImage
                        ? <div className="w-4 h-4 border-2 border-[var(--paper)] border-t-transparent rounded-full animate-spin" />
                        : <SendIcon size={16} />
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

      {/* Report Message Dialog */}
      <Dialog open={!!reportTarget} onOpenChange={(o) => !o && setReportTarget(null)}>
        <DialogContent className="bg-card border-border/50 max-w-md [&>button]:hidden">
          <DialogHeader>
            <DialogTitle>Report Message</DialogTitle>
            <DialogDescription>
              This report will be reviewed by our moderation team. Please only report genuine concerns.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Reason</Label>
              <Select value={reportReason} onValueChange={setReportReason}>
                <SelectTrigger className="bg-secondary/50 border-border/50">
                  <SelectValue placeholder="Select a reason…" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="harassment">Harassment or bullying</SelectItem>
                  <SelectItem value="spam">Spam</SelectItem>
                  <SelectItem value="inappropriate">Inappropriate content</SelectItem>
                  <SelectItem value="hate_speech">Hate speech or discrimination</SelectItem>
                  <SelectItem value="unsafe">Unsafe or dangerous content</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Additional details <span className="text-muted-foreground font-normal">(optional)</span></Label>
              <Textarea
                value={reportDetails}
                onChange={e => setReportDetails(e.target.value.slice(0, 500))}
                placeholder="Tell us more about what happened…"
                className="bg-secondary/50 border-border/50 resize-none text-sm"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={() => setReportTarget(null)}>Cancel</Button>
            <Button
              variant="destructive"
              onClick={submitReport}
              disabled={!reportReason || reportSubmitting}
            >
              {reportSubmitting ? "Submitting…" : "Submit Report"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Image lightbox */}
      {lightboxImage && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center cursor-zoom-out p-4"
          onClick={() => setLightboxImage(null)}
        >
          <img
            src={lightboxImage}
            alt="Full size"
            className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
            onClick={e => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
