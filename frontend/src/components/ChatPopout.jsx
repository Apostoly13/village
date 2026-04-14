import { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import { Crown, X, MessagesSquare, Send, Search, UserPlus } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

const API_URL = process.env.REACT_APP_BACKEND_URL;
const STORAGE_KEY = "chatPopout";

function loadState() {
  try { const raw = localStorage.getItem(STORAGE_KEY); return raw ? JSON.parse(raw) : null; }
  catch { return null; }
}
function saveState(state) { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch {} }
function formatTime(d) { try { return formatDistanceToNow(new Date(d), { addSuffix: true }); } catch { return ""; } }
function getPrefs() { try { return JSON.parse(localStorage.getItem("village_prefs") || "{}"); } catch { return {}; } }

export default function ChatPopout({ user }) {
  const saved = loadState();

  const [open, setOpen] = useState(saved?.open ?? false);
  const [unreadCount, setUnreadCount] = useState(0);

  // view: "list" | "chat"  listTab: "friends" | "dms" | "search"
  const [view, setView] = useState("list");
  const [listTab, setListTab] = useState("friends");

  // Friends list
  const [friends, setFriends] = useState([]);
  const [loadingFriends, setLoadingFriends] = useState(false);

  // DM conversations
  const [conversations, setConversations] = useState([]);
  const [loadingConvs, setLoadingConvs] = useState(false);

  // User search
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [friendRequests, setFriendRequests] = useState({});

  // Active chat — either a friend room or a DM
  const [chatMode, setChatMode] = useState(null); // "friend" | "dm"
  const [roomId, setRoomId] = useState(saved?.roomId ?? null);
  const [room, setRoom] = useState(null);
  const [activeDmUser, setActiveDmUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [openingChat, setOpeningChat] = useState(null);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const lastSeenMsgIdRef = useRef(null);
  const openRef = useRef(open);

  useEffect(() => { openRef.current = open; }, [open]);
  useEffect(() => { saveState({ open, roomId }); }, [open, roomId]);

  // Load lists when popout opens
  useEffect(() => {
    if (open && view === "list") {
      fetchFriends();
      fetchConversations();
    }
  }, [open, view]);

  // Load room + messages when room selected
  useEffect(() => {
    if (!roomId || chatMode !== "friend") return;
    fetchRoom();
    fetchMessages(true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId]);

  // Load DM messages
  useEffect(() => {
    if (!activeDmUser || chatMode !== "dm") return;
    fetchDmMessages(true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeDmUser]);

  // Foreground poll (friend room)
  useEffect(() => {
    if (!open || view !== "chat" || !roomId || chatMode !== "friend") return;
    const iv = setInterval(() => fetchMessages(false), 5000);
    return () => clearInterval(iv);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, view, roomId, chatMode]);

  // Foreground poll (dm)
  useEffect(() => {
    if (!open || view !== "chat" || !activeDmUser || chatMode !== "dm") return;
    const iv = setInterval(() => fetchDmMessages(false), 5000);
    return () => clearInterval(iv);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, view, activeDmUser, chatMode]);

  // Background poll (friend room only — for toast notifications)
  useEffect(() => {
    if (!roomId) return;
    const iv = setInterval(() => { if (!openRef.current) fetchMessages(false, true); }, 30000);
    return () => clearInterval(iv);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId]);

  useEffect(() => {
    if (open && view === "chat") messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open, view]);

  useEffect(() => {
    if (open && view === "chat" && messages.length > 0)
      lastSeenMsgIdRef.current = messages[messages.length - 1].message_id;
  }, [messages, open, view]);

  // User search debounce
  useEffect(() => {
    if (listTab !== "search") return;
    const t = setTimeout(() => runSearch(searchQuery), 300);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, listTab]);

  const fetchFriends = async () => {
    setLoadingFriends(true);
    try { const r = await fetch(`${API_URL}/api/friends`, { credentials: "include" }); if (r.ok) setFriends(await r.json()); }
    catch {} finally { setLoadingFriends(false); }
  };

  const fetchConversations = async () => {
    setLoadingConvs(true);
    try { const r = await fetch(`${API_URL}/api/messages/conversations`, { credentials: "include" }); if (r.ok) setConversations(await r.json()); }
    catch {} finally { setLoadingConvs(false); }
  };

  const runSearch = async (q) => {
    if (q.length < 2) { setSearchResults([]); return; }
    setSearching(true);
    try { const r = await fetch(`${API_URL}/api/users/search?q=${encodeURIComponent(q)}`, { credentials: "include" }); if (r.ok) setSearchResults(await r.json()); }
    catch {} finally { setSearching(false); }
  };

  const sendFriendRequest = async (userId) => {
    try {
      const r = await fetch(`${API_URL}/api/friends/request`, {
        method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include",
        body: JSON.stringify({ to_user_id: userId }),
      });
      if (r.ok) { setFriendRequests(p => ({ ...p, [userId]: true })); toast.success("Friend request sent!"); }
      else { const e = await r.json(); toast.info(e.detail || "Already sent"); }
    } catch { toast.error("Something went wrong"); }
  };

  const fetchRoom = async () => {
    try { const r = await fetch(`${API_URL}/api/chat/rooms/${roomId}`, { credentials: "include" }); if (r.ok) setRoom(await r.json()); }
    catch {}
  };

  const fetchMessages = async (isInitial = false, isBackground = false) => {
    if (!roomId) return;
    try {
      const r = await fetch(`${API_URL}/api/chat/rooms/${roomId}/messages?limit=30`, { credentials: "include" });
      if (!r.ok) return;
      const data = await r.json();
      if (isInitial) {
        setMessages(data);
        if (data.length > 0) { lastSeenMsgIdRef.current = data[data.length - 1].message_id; return; }
        return;
      }
      // Merge to preserve locally-added messages not yet returned by server (race condition fix)
      setMessages(prev => {
        const serverIds = new Set(data.map(m => m.message_id));
        const localOnly = prev.filter(m => !serverIds.has(m.message_id));
        const merged = [...data, ...localOnly];
        merged.sort((a, b) => (a.created_at > b.created_at ? 1 : -1));
        return merged;
      });
      if (isBackground && data.length > 0 && lastSeenMsgIdRef.current) {
        const latest = data[data.length - 1];
        if (latest.message_id !== lastSeenMsgIdRef.current) {
          const lastIdx = data.findIndex(m => m.message_id === lastSeenMsgIdRef.current);
          const newMsgs = lastIdx >= 0 ? data.slice(lastIdx + 1) : data;
          const fromOthers = newMsgs.filter(m => m.author_id !== user?.user_id);
          if (fromOthers.length > 0) {
            setUnreadCount(p => p + fromOthers.length);
            if (getPrefs().messageToast !== false) {
              const l = fromOthers[fromOthers.length - 1];
              const name = l.author_nickname || l.author_name || "Someone";
              const preview = l.content.length > 60 ? l.content.slice(0, 60) + "…" : l.content;
              toast(`💬 ${name}: ${preview}`, { duration: 5000, action: { label: "Reply", onClick: () => { setOpen(true); setView("chat"); } } });
            }
          }
        }
      }
    } catch {}
  };

  const fetchDmMessages = async (isInitial = false) => {
    if (!activeDmUser) return;
    try {
      const r = await fetch(`${API_URL}/api/messages/${activeDmUser.user_id}`, { credentials: "include" });
      if (r.ok) setMessages(await r.json());
    } catch {}
  };

  const openFriendChat = async (friendId) => {
    setOpeningChat(friendId);
    try {
      const r = await fetch(`${API_URL}/api/chat/rooms/friends`, {
        method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include",
        body: JSON.stringify({ friend_id: friendId }),
      });
      if (r.ok) {
        const rm = await r.json();
        setRoomId(rm.room_id); setRoom(rm); setMessages([]); lastSeenMsgIdRef.current = null;
        setActiveDmUser(null); setChatMode("friend"); setView("chat");
      }
    } catch {} finally { setOpeningChat(null); }
  };

  const openDmChat = (dmUser) => {
    setActiveDmUser(dmUser); setRoomId(null); setRoom(null); setMessages([]);
    setChatMode("dm"); setView("chat");
    setListTab("search"); setSearchQuery(""); setSearchResults([]);
  };

  const handleSend = async (e) => {
    e.preventDefault();
    const content = newMessage.trim();
    if (!content || sending) return;

    // Optimistic update — show message immediately, swap with server version on confirm
    const tempId = `temp_${Date.now()}`;
    const optimisticMsg = {
      message_id: tempId,
      author_id: user?.user_id,
      author_name: user?.nickname || user?.name,
      author_picture: user?.picture,
      content,
      created_at: new Date().toISOString(),
    };
    setMessages(p => [...p, optimisticMsg]);
    setNewMessage("");
    setSending(true);

    if (chatMode === "friend" && roomId) {
      try {
        const r = await fetch(`${API_URL}/api/chat/rooms/${roomId}/messages`, {
          method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include",
          body: JSON.stringify({ content }),
        });
        if (r.ok) {
          const msg = await r.json();
          setMessages(p => p.map(m => m.message_id === tempId ? msg : m));
          lastSeenMsgIdRef.current = msg.message_id;
        } else {
          setMessages(p => p.filter(m => m.message_id !== tempId));
          setNewMessage(content);
        }
      } catch {
        setMessages(p => p.filter(m => m.message_id !== tempId));
        setNewMessage(content);
      }
    } else if (chatMode === "dm" && activeDmUser) {
      try {
        const r = await fetch(`${API_URL}/api/messages`, {
          method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include",
          body: JSON.stringify({ receiver_id: activeDmUser.user_id, content }),
        });
        if (r.ok) {
          const msg = await r.json();
          setMessages(p => p.map(m => m.message_id === tempId ? msg : m));
        } else {
          setMessages(p => p.filter(m => m.message_id !== tempId));
          setNewMessage(content);
        }
      } catch {
        setMessages(p => p.filter(m => m.message_id !== tempId));
        setNewMessage(content);
      }
    }
    setSending(false);
  };

  const handleOpen = () => { setOpen(true); setUnreadCount(0); };
  const handleClose = () => setOpen(false);

  const activeUser = chatMode === "friend" ? (room ? { name: room.name } : null) : activeDmUser;
  const friendIds = new Set(friends.map(f => f.user_id));
  const dmRequests = conversations.filter(c => !friendIds.has(c.other_user_id));
  const totalUnread = conversations.reduce((a, c) => a + (c.unread_count || 0), 0) + unreadCount;

  return (
    <div className="fixed bottom-20 right-0 lg:bottom-8 z-[100] flex flex-col items-end">
      {open ? (
        <div className="mb-2 max-h-[460px] bg-card border border-border/40 border-r-0 rounded-l-2xl shadow-xl flex flex-col overflow-hidden lg:border-r lg:rounded-2xl lg:mr-4" style={{width:"288px"}}>

          {/* Header — minimal, no icon circle */}
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-border/30 bg-card/95 shrink-0">
            {view === "chat" ? (
              <>
                <button
                  onClick={() => { setView("list"); setListTab(chatMode === "dm" ? "dms" : "friends"); }}
                  className="text-xs text-muted-foreground hover:text-primary transition-colors flex items-center gap-1"
                >
                  ← Back
                </button>
                <p className="font-medium text-foreground text-sm truncate mx-3 flex-1 text-center">
                  {chatMode === "friend" ? (room?.room_type === "friends_only" ? "Friend chat" : room?.name) : (activeDmUser?.nickname || activeDmUser?.name)}
                </p>
              </>
            ) : (
              <>
                <div className="flex items-center gap-1.5">
                  <MessagesSquare className="h-3.5 w-3.5 text-muted-foreground" />
                  <p className="font-medium text-foreground text-sm">Messages</p>
                  {totalUnread > 0 && (
                    <span className="min-w-[16px] h-4 rounded-full bg-primary text-primary-foreground text-[10px] flex items-center justify-center font-bold px-1">
                      {totalUnread > 9 ? "9+" : totalUnread}
                    </span>
                  )}
                </div>
                <Link to="/messages" onClick={handleClose} className="text-[11px] text-muted-foreground hover:text-foreground transition-colors">Full view</Link>
              </>
            )}
            <button onClick={handleClose} className="text-muted-foreground hover:text-foreground p-1 ml-2 shrink-0">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* List view */}
          {view === "list" && (
            <div className="flex flex-col flex-1 min-h-0">
              {/* Sub-tab bar */}
              <div className="flex border-b border-border/40 shrink-0">
                <button onClick={() => setListTab("friends")} className={`flex-1 py-2 text-xs font-medium transition-colors ${listTab === "friends" ? "text-primary border-b-2 border-primary" : "text-muted-foreground hover:text-foreground"}`}>
                  Friends
                </button>
                <button onClick={() => setListTab("dms")} className={`flex-1 py-2 text-xs font-medium relative transition-colors ${listTab === "dms" ? "text-primary border-b-2 border-primary" : "text-muted-foreground hover:text-foreground"}`}>
                  Messages
                  {dmRequests.some(c => c.unread_count > 0) && <span className="absolute top-1.5 right-3 w-1.5 h-1.5 rounded-full bg-red-500" />}
                </button>
                <button onClick={() => setListTab("search")} className={`flex-1 py-2 text-xs font-medium transition-colors ${listTab === "search" ? "text-primary border-b-2 border-primary" : "text-muted-foreground hover:text-foreground"}`}>
                  Search
                </button>
              </div>

              <div className="flex-1 overflow-y-auto">
                {/* Friends tab */}
                {listTab === "friends" && (
                  loadingFriends ? (
                    <div className="p-3 space-y-3">{[1,2,3].map(i => <div key={i} className="flex items-center gap-3 animate-pulse"><div className="w-8 h-8 rounded-full bg-muted shrink-0" /><div className="flex-1 h-3 bg-muted rounded" /></div>)}</div>
                  ) : friends.length === 0 ? (
                    <div className="p-5 text-center">
                      <p className="text-sm text-muted-foreground">No friends yet.</p>
                      <button onClick={() => setListTab("search")} className="text-xs text-primary hover:underline mt-1 block mx-auto">Search for parents →</button>
                    </div>
                  ) : (
                    <div className="divide-y divide-border/30">
                      {friends.map(friend => (
                        <button key={friend.user_id} onClick={() => openFriendChat(friend.user_id)} disabled={openingChat === friend.user_id}
                          className="w-full flex items-center gap-3 px-4 py-3 hover:bg-secondary/50 transition-colors text-left">
                          <div className="relative shrink-0">
                            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-semibold text-primary overflow-hidden">
                              {friend.picture ? <img src={friend.picture} alt="" className="w-full h-full object-cover" /> : (friend.nickname || friend.name)?.[0]?.toUpperCase()}
                            </div>
                            <span className={`absolute bottom-0 right-0 w-2 h-2 rounded-full border border-card ${friend.is_online ? "bg-green-500" : "bg-muted-foreground/40"}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">{friend.nickname || friend.name}</p>
                            <p className={`text-xs ${friend.is_online ? "text-green-500" : "text-muted-foreground"}`}>{friend.is_online ? "Online" : "Offline"}</p>
                          </div>
                          {openingChat === friend.user_id && <div className="w-3.5 h-3.5 border-2 border-primary border-t-transparent rounded-full animate-spin shrink-0" />}
                        </button>
                      ))}
                    </div>
                  )
                )}

                {/* DMs tab */}
                {listTab === "dms" && (
                  loadingConvs ? (
                    <div className="p-3 space-y-3">{[1,2,3].map(i => <div key={i} className="flex items-center gap-3 animate-pulse"><div className="w-8 h-8 rounded-full bg-muted shrink-0" /><div className="flex-1 h-3 bg-muted rounded" /></div>)}</div>
                  ) : conversations.length === 0 ? (
                    <div className="p-5 text-center">
                      <p className="text-sm text-muted-foreground">No messages yet.</p>
                      <button onClick={() => setListTab("search")} className="text-xs text-primary hover:underline mt-1 block mx-auto">Message someone →</button>
                    </div>
                  ) : (
                    <div className="divide-y divide-border/30">
                      {dmRequests.length > 0 && (
                        <div className="px-3 py-1.5 bg-secondary/40">
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Message Requests</p>
                        </div>
                      )}
                      {dmRequests.map(conv => (
                        <PopoutDmRow key={conv.other_user_id} conv={conv} onClick={() => openDmChat({ user_id: conv.other_user_id, name: conv.other_user_name, nickname: null, picture: conv.other_user_picture })} />
                      ))}
                      {dmRequests.length > 0 && conversations.some(c => friendIds.has(c.other_user_id)) && (
                        <div className="px-3 py-1.5 bg-secondary/40">
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">From Friends</p>
                        </div>
                      )}
                      {conversations.filter(c => friendIds.has(c.other_user_id)).map(conv => (
                        <PopoutDmRow key={conv.other_user_id} conv={conv} onClick={() => openDmChat({ user_id: conv.other_user_id, name: conv.other_user_name, nickname: null, picture: conv.other_user_picture })} />
                      ))}
                    </div>
                  )
                )}

                {/* Search tab */}
                {listTab === "search" && (
                  <div className="flex flex-col h-full">
                    <div className="px-3 py-2 border-b border-border/30">
                      <div className="flex items-center gap-2 bg-secondary/50 rounded-full px-3 py-1.5">
                        <Search className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        <input autoFocus value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                          placeholder="Search parents..." className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none" />
                      </div>
                    </div>
                    {searching && <div className="p-3 space-y-3">{[1,2].map(i => <div key={i} className="flex items-center gap-3 animate-pulse"><div className="w-8 h-8 rounded-full bg-muted shrink-0" /><div className="flex-1 h-3 bg-muted rounded" /></div>)}</div>}
                    {!searching && searchQuery.length < 2 && <p className="text-xs text-muted-foreground text-center py-4">Type to search</p>}
                    {!searching && searchQuery.length >= 2 && searchResults.length === 0 && <p className="text-xs text-muted-foreground text-center py-4">No results</p>}
                    <div className="divide-y divide-border/30">
                      {searchResults.map(u => (
                        <div key={u.user_id} className="flex items-center gap-2 px-3 py-2.5">
                          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-semibold text-primary overflow-hidden shrink-0">
                            {u.picture ? <img src={u.picture} alt="" className="w-full h-full object-cover" /> : (u.nickname || u.name)?.[0]?.toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-foreground truncate">{u.nickname || u.name}</p>
                          </div>
                          <div className="flex gap-1 shrink-0">
                            <button onClick={() => openDmChat(u)} className="text-xs bg-secondary hover:bg-secondary/70 rounded-full px-2 py-1 text-foreground">
                              Msg
                            </button>
                            <button onClick={() => sendFriendRequest(u.user_id)} disabled={!!friendRequests[u.user_id]}
                              className="text-xs bg-primary/10 hover:bg-primary/20 text-primary rounded-full px-2 py-1 disabled:opacity-50">
                              {friendRequests[u.user_id] ? "✓" : <UserPlus className="h-3 w-3" />}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Chat view */}
          {view === "chat" && (
            <>
              <div className="flex-1 overflow-y-auto p-3 space-y-3 min-h-0">
                {messages.length === 0 && <p className="text-xs text-muted-foreground text-center py-4">No messages yet. Say hi!</p>}
                {messages.map((msg, idx) => {
                  const isOwn = (msg.author_id || msg.sender_id) === user?.user_id;
                  return (
                    <div key={msg.message_id || msg.dm_id || idx} className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
                      <div className="max-w-[85%]">
                        {!isOwn && (
                          <p className="text-xs text-muted-foreground mb-1 ml-1 flex items-center gap-1">
                            {msg.author_name || activeDmUser?.name}
                            {msg.author_subscription_tier === "premium" && <Crown className="h-2.5 w-2.5 text-amber-500" />}
                          </p>
                        )}
                        <div className={`rounded-2xl px-3 py-2 text-sm shadow-sm break-all whitespace-pre-wrap ${isOwn ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground"}`}>
                          {msg.content}
                        </div>
                        <p className={`text-xs text-muted-foreground mt-0.5 ${isOwn ? "text-right mr-1" : "ml-1"}`}>{formatTime(msg.created_at)}</p>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
              <form onSubmit={handleSend} className="flex gap-2 p-3 border-t border-border/40 shrink-0">
                <input ref={inputRef} value={newMessage} onChange={e => setNewMessage(e.target.value.slice(0, 1000))}
                  placeholder="Message..." disabled={sending} maxLength={1000}
                  className="flex-1 bg-secondary/50 rounded-full px-4 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/30" />
                <button type="submit" disabled={!newMessage.trim() || sending}
                  className="w-9 h-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center disabled:opacity-50 shrink-0">
                  <Send className="h-4 w-4" />
                </button>
              </form>
            </>
          )}
        </div>
      ) : (
        <button
          onClick={handleOpen}
          aria-label={totalUnread > 0 ? `Messages — ${totalUnread} unread` : "Messages"}
          className="flex items-center gap-2 pl-3 pr-4 py-2 bg-card border border-border/40 border-r-0 rounded-l-xl text-muted-foreground shadow-md hover:text-foreground hover:border-border/70 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
          data-testid="chat-popout-bubble"
        >
          <MessagesSquare className="h-4 w-4 shrink-0" />
          <span className="text-xs font-medium">Messages</span>
          {totalUnread > 0 && (
            <span className="min-w-[16px] h-4 rounded-full bg-primary text-primary-foreground text-[10px] flex items-center justify-center font-bold px-1">
              {totalUnread > 9 ? "9+" : totalUnread}
            </span>
          )}
        </button>
      )}
    </div>
  );
}

function PopoutDmRow({ conv, onClick }) {
  return (
    <button onClick={onClick} className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-secondary/50 transition-colors text-left">
      <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-semibold text-primary overflow-hidden shrink-0">
        {conv.other_user_picture ? <img src={conv.other_user_picture} alt="" className="w-full h-full object-cover" /> : conv.other_user_name?.[0]?.toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-1">
          <p className="text-sm font-medium text-foreground truncate">{conv.other_user_name}</p>
          {conv.unread_count > 0 && (
            <span className="shrink-0 min-w-[16px] h-4 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-bold px-1">
              {conv.unread_count}
            </span>
          )}
        </div>
        <p className="text-xs text-muted-foreground truncate">{conv.last_message}</p>
      </div>
    </button>
  );
}
