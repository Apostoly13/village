import { useState, useEffect, useCallback } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Badge } from "../components/ui/badge";
import Navigation from "../components/Navigation";
import { toast } from "sonner";
import { Users, UserPlus, Clock, Check, X, MessageCircle, Heart, MessagesSquare, Search, Bell } from "lucide-react";
import AppFooter from "../components/AppFooter";

const API_URL = process.env.REACT_APP_BACKEND_URL;

export default function FriendsPage({ user }) {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [friends, setFriends] = useState([]);
  const [requests, setRequests] = useState([]);
  const [sentRequests, setSentRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState({});
  const [chatLoading, setChatLoading] = useState({});

  // Parent search
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [sentToIds, setSentToIds] = useState(new Set());

  useEffect(() => {
    fetchAllData();
  }, []);

  const runSearch = useCallback(async (q) => {
    if (q.length < 2) { setSearchResults([]); return; }
    setSearching(true);
    try {
      const res = await fetch(`${API_URL}/api/users/search?q=${encodeURIComponent(q)}`, { credentials: "include" });
      if (res.ok) setSearchResults(await res.json());
    } catch {}
    finally { setSearching(false); }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => runSearch(searchQuery), 300);
    return () => clearTimeout(t);
  }, [searchQuery, runSearch]);

  const sendFriendRequest = async (userId) => {
    try {
      const res = await fetch(`${API_URL}/api/friends/request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ to_user_id: userId }),
      });
      if (res.ok) {
        setSentToIds(prev => new Set([...prev, userId]));
        toast.success("Friend request sent!");
      } else {
        const err = await res.json();
        toast.info(err.detail || "Request already sent");
        setSentToIds(prev => new Set([...prev, userId]));
      }
    } catch { toast.error("Something went wrong"); }
  };

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [friendsRes, requestsRes, sentRes] = await Promise.all([
        fetch(`${API_URL}/api/friends`, { credentials: "include" }),
        fetch(`${API_URL}/api/friends/requests`, { credentials: "include" }),
        fetch(`${API_URL}/api/friends/sent`, { credentials: "include" })
      ]);

      if (friendsRes.ok) setFriends(await friendsRes.json());
      if (requestsRes.ok) setRequests(await requestsRes.json());
      if (sentRes.ok) setSentRequests(await sentRes.json());
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (requestId) => {
    setActionLoading(prev => ({ ...prev, [requestId]: true }));
    try {
      const response = await fetch(`${API_URL}/api/friends/request/${requestId}/accept`, {
        method: "POST",
        credentials: "include"
      });

      if (response.ok) {
        toast.success("Friend request accepted!");
        fetchAllData();
      } else {
        toast.error("Failed to accept request");
      }
    } catch (error) {
      toast.error("Something went wrong");
    } finally {
      setActionLoading(prev => ({ ...prev, [requestId]: false }));
    }
  };

  const handleDecline = async (requestId) => {
    setActionLoading(prev => ({ ...prev, [requestId]: true }));
    try {
      const response = await fetch(`${API_URL}/api/friends/request/${requestId}/decline`, {
        method: "POST",
        credentials: "include"
      });

      if (response.ok) {
        toast.success("Friend request declined");
        fetchAllData();
      } else {
        toast.error("Failed to decline request");
      }
    } catch (error) {
      toast.error("Something went wrong");
    } finally {
      setActionLoading(prev => ({ ...prev, [requestId]: false }));
    }
  };

  const handleOpenFriendsChat = async (friendId) => {
    setChatLoading(prev => ({ ...prev, [friendId]: true }));
    try {
      const res = await fetch(`${API_URL}/api/chat/rooms/friends`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ friend_id: friendId }),
      });
      if (res.ok) {
        const room = await res.json();
        navigate(`/chat/${room.room_id}`);
      } else {
        toast.error("Could not open chat");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setChatLoading(prev => ({ ...prev, [friendId]: false }));
    }
  };

  const handleRemoveFriend = async (friendId) => {
    setActionLoading(prev => ({ ...prev, [friendId]: true }));
    try {
      const response = await fetch(`${API_URL}/api/friends/${friendId}`, {
        method: "DELETE",
        credentials: "include"
      });

      if (response.ok) {
        toast.success("Friend removed");
        setFriends(prev => prev.filter(f => f.user_id !== friendId));
      } else {
        toast.error("Failed to remove friend");
      }
    } catch (error) {
      toast.error("Something went wrong");
    } finally {
      setActionLoading(prev => ({ ...prev, [friendId]: false }));
    }
  };

  const handleCancelRequest = async (requestId) => {
    setActionLoading(prev => ({ ...prev, [requestId]: true }));
    try {
      const response = await fetch(`${API_URL}/api/friends/request/${requestId}`, {
        method: "DELETE",
        credentials: "include"
      });
      if (response.ok) {
        toast.success("Request cancelled");
        setSentRequests(prev => prev.filter(r => r.request_id !== requestId));
      } else {
        toast.error("Failed to cancel request");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setActionLoading(prev => ({ ...prev, [requestId]: false }));
    }
  };

  const FriendCard = ({ friend, showRemove = false }) => (
    <div className="village-card village-card-hover p-4" data-testid={`friend-card-${friend.user_id}`}>
      <div className="flex items-center gap-4">
        <Link to={`/profile/${friend.user_id}`} className="relative shrink-0">
          <Avatar className="h-14 w-14 cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all">
            <AvatarImage src={friend.picture} />
            <AvatarFallback className="text-lg">
              {friend.name?.[0]?.toUpperCase() || '?'}
            </AvatarFallback>
          </Avatar>
          {/* Online indicator */}
          <span className={`absolute bottom-0.5 right-0.5 w-3.5 h-3.5 rounded-full border-2 border-card ${friend.is_online ? "" : "bg-muted-foreground/40"}`} style={friend.is_online ? { background: "var(--status-online)" } : {}} title={friend.is_online ? "Online" : "Offline"} />
        </Link>
        <div className="flex-1 min-w-0">
          <Link to={`/profile/${friend.user_id}`} className="hover:underline">
            <h3 className="font-medium text-foreground truncate">{friend.nickname || friend.name}</h3>
          </Link>
          {friend.is_online ? (
            <p className="text-xs font-medium" style={{ color: "var(--status-online)" }}>Online</p>
          ) : (
            friend.bio && <p className="text-sm text-muted-foreground truncate">{friend.bio}</p>
          )}
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            {friend.is_single_parent && (
              <Badge variant="secondary" className="bg-pink-500/10 text-pink-600 dark:text-pink-400 border-pink-500/20 text-xs">
                <Heart className="h-3 w-3 mr-1" />
                Single Parent
              </Badge>
            )}
            {friend.location && (
              <span className="text-xs text-muted-foreground">📍 {friend.location}</span>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="rounded-full"
            onClick={() => handleOpenFriendsChat(friend.user_id)}
            disabled={chatLoading[friend.user_id]}
            title="Private chat"
            data-testid={`chat-${friend.user_id}`}
          >
            <MessagesSquare className="h-4 w-4" />
          </Button>
          <Link to={`/messages/${friend.user_id}`}>
            <Button variant="outline" size="sm" className="rounded-full" data-testid={`message-${friend.user_id}`} title="Direct message">
              <MessageCircle className="h-4 w-4" />
            </Button>
          </Link>
          {showRemove && (
            <Button
              variant="ghost"
              size="sm"
              className="rounded-full text-muted-foreground hover:text-destructive"
              onClick={() => handleRemoveFriend(friend.user_id)}
              disabled={actionLoading[friend.user_id]}
              data-testid={`remove-${friend.user_id}`}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );

  const RequestCard = ({ request }) => (
    <div className="village-card village-card-hover p-4" data-testid={`request-card-${request.request_id}`}>
      <div className="flex items-center gap-4">
        <Link to={`/profile/${request.from_user?.user_id}`}>
          <Avatar className="h-14 w-14 cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all">
            <AvatarImage src={request.from_user?.picture} />
            <AvatarFallback className="text-lg">
              {request.from_user?.name?.[0]?.toUpperCase() || '?'}
            </AvatarFallback>
          </Avatar>
        </Link>
        <div className="flex-1 min-w-0">
          <Link to={`/profile/${request.from_user?.user_id}`} className="hover:underline">
            <h3 className="font-medium text-foreground truncate">{request.from_user?.nickname || request.from_user?.name}</h3>
          </Link>
          {request.from_user?.bio && (
            <p className="text-sm text-muted-foreground truncate">{request.from_user.bio}</p>
          )}
          <p className="text-xs text-muted-foreground mt-1">
            <Clock className="h-3 w-3 inline mr-1" />
            Wants to connect
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            size="sm"
            onClick={() => handleAccept(request.request_id)}
            disabled={actionLoading[request.request_id]}
            className="rounded-full bg-green-600 hover:bg-green-700 text-white"
            data-testid={`accept-${request.request_id}`}
          >
            <Check className="h-4 w-4 mr-1" />
            Accept
          </Button>
          <Button 
            variant="outline"
            size="sm"
            onClick={() => handleDecline(request.request_id)}
            disabled={actionLoading[request.request_id]}
            className="rounded-full"
            data-testid={`decline-${request.request_id}`}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background  lg:pl-60 lg:pb-0">
      <Navigation user={user} />
      
      <main className="max-w-4xl mx-auto px-4 pt-16 lg:pt-8">
        <div className="mb-8">
          <h1 className="font-heading text-2xl sm:text-3xl font-bold text-foreground mb-1">Your friends</h1>
          <p className="text-sm text-muted-foreground">Connect with parents in the village</p>
        </div>

        <Tabs defaultValue={["friends","requests","sent","discover"].includes(searchParams.get("tab")) ? searchParams.get("tab") : "friends"} onValueChange={(v) => setSearchParams({ tab: v }, { replace: true })} className="w-full">
          <TabsList className="w-full bg-card border border-border/50 rounded-xl p-1 mb-6">
            <TabsTrigger value="friends" className="flex-1 rounded-lg data-[state=active]:bg-[var(--ink)] data-[state=active]:text-[var(--paper)]" data-testid="tab-friends">
              Friends ({friends.length})
            </TabsTrigger>
            <TabsTrigger value="requests" className="flex-1 rounded-lg data-[state=active]:bg-[var(--ink)] data-[state=active]:text-[var(--paper)] relative" data-testid="tab-requests">
              Requests
              {requests.length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-white text-xs flex items-center justify-center" style={{ background: "var(--badge-danger)" }}>
                  {requests.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="sent" className="flex-1 rounded-lg data-[state=active]:bg-[var(--ink)] data-[state=active]:text-[var(--paper)]" data-testid="tab-sent">
              Sent ({sentRequests.length})
            </TabsTrigger>
            <TabsTrigger value="discover" className="flex-1 rounded-lg data-[state=active]:bg-[var(--ink)] data-[state=active]:text-[var(--paper)]" data-testid="tab-discover">
              Find Parents
            </TabsTrigger>
          </TabsList>

          <TabsContent value="friends" className="mt-0">
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="village-card p-4 animate-pulse">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-full bg-muted"></div>
                      <div className="flex-1 space-y-2">
                        <div className="w-32 h-4 bg-muted rounded"></div>
                        <div className="w-48 h-3 bg-muted rounded"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : friends.length === 0 ? (
              <div className="text-center py-12 village-card">
                <UserPlus size={28} style={{ color: "var(--ink-3)", margin: "0 auto 12px" }} />
                <h3 className="font-heading font-semibold mb-1" style={{ color: "var(--ink)" }}>Your village is waiting</h3>
                <p className="mb-4" style={{ fontFamily: "var(--serif)", fontStyle: "italic", fontSize: 13, color: "var(--ink-3)" }}>Add people you meet in the forums or chat rooms.</p>
                <Link to="/forums">
                  <Button className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90">
                    Browse forums
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {friends.map(friend => (
                  <FriendCard key={friend.user_id} friend={friend} showRemove />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="requests" className="mt-0">
            {loading ? (
              <div className="space-y-4">
                {[1, 2].map(i => (
                  <div key={i} className="village-card p-4 animate-pulse">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-full bg-muted"></div>
                      <div className="flex-1 space-y-2">
                        <div className="w-32 h-4 bg-muted rounded"></div>
                        <div className="w-48 h-3 bg-muted rounded"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : requests.length === 0 ? (
              <div className="text-center py-12 village-card">
                <Bell size={28} style={{ color: "var(--ink-3)", margin: "0 auto 12px" }} />
                <h3 className="font-heading font-semibold mb-1" style={{ color: "var(--ink)" }}>No pending requests</h3>
                <p style={{ fontFamily: "var(--serif)", fontStyle: "italic", fontSize: 13, color: "var(--ink-3)" }}>When someone wants to connect, you'll see it here.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {requests.map(request => (
                  <RequestCard key={request.request_id} request={request} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="sent" className="mt-0">
            {loading ? (
              <div className="space-y-4">
                {[1, 2].map(i => (
                  <div key={i} className="village-card p-4 animate-pulse">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-full bg-muted"></div>
                      <div className="flex-1 space-y-2">
                        <div className="w-32 h-4 bg-muted rounded"></div>
                        <div className="w-48 h-3 bg-muted rounded"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : sentRequests.length === 0 ? (
              <div className="text-center py-12 village-card">
                <UserPlus size={28} style={{ color: "var(--ink-3)", margin: "0 auto 12px" }} />
                <h3 className="font-heading font-semibold mb-1" style={{ color: "var(--ink)" }}>No sent requests</h3>
                <p style={{ fontFamily: "var(--serif)", fontStyle: "italic", fontSize: 13, color: "var(--ink-3)" }}>Friend requests you send will appear here.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {sentRequests.map(request => (
                  <div key={request.request_id} className="village-card p-4" data-testid={`sent-${request.request_id}`}>
                    <div className="flex items-center gap-4">
                      <Link to={`/profile/${request.to_user?.user_id}`} className="shrink-0">
                        <Avatar className="h-14 w-14 cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all">
                          <AvatarImage src={request.to_user?.picture} />
                          <AvatarFallback className="text-lg">
                            {request.to_user?.name?.[0]?.toUpperCase() || '?'}
                          </AvatarFallback>
                        </Avatar>
                      </Link>
                      <div className="flex-1 min-w-0">
                        <Link to={`/profile/${request.to_user?.user_id}`} className="hover:underline">
                          <h3 className="font-medium text-foreground truncate">
                            {request.to_user?.nickname || request.to_user?.name || "Unknown"}
                          </h3>
                        </Link>
                        <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Waiting for response
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="rounded-full text-muted-foreground hover:text-destructive hover:border-destructive transition-colors shrink-0"
                        onClick={() => handleCancelRequest(request.request_id)}
                        disabled={actionLoading[request.request_id]}
                      >
                        {actionLoading[request.request_id]
                          ? <div className="w-4 h-4 border-2 border-muted border-t-foreground rounded-full animate-spin" />
                          : "Cancel"}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* ── Find Parents tab ── */}
          <TabsContent value="discover" className="mt-0">
            <div className="village-card p-4">
              {/* Search input */}
              <div className="flex items-center gap-2 bg-secondary/50 rounded-full px-4 py-2.5 mb-4">
                <Search className="h-4 w-4 text-muted-foreground shrink-0" />
                <input
                  autoFocus
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search parents by name…"
                  className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
                />
                {searchQuery && (
                  <button onClick={() => { setSearchQuery(""); setSearchResults([]); }}>
                    <X className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
                  </button>
                )}
              </div>

              {/* Results */}
              {searching && (
                <div className="space-y-3 py-2">
                  {[1,2,3].map(i => (
                    <div key={i} className="flex items-center gap-3 animate-pulse">
                      <div className="w-12 h-12 rounded-full bg-muted shrink-0" />
                      <div className="flex-1 space-y-1.5">
                        <div className="h-3.5 bg-muted rounded w-32" />
                        <div className="h-3 bg-muted rounded w-48" />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {!searching && searchQuery.length >= 2 && searchResults.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-sm text-muted-foreground">No parents found for "{searchQuery}"</p>
                </div>
              )}

              {!searching && searchQuery.length < 2 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="h-8 w-8 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">Type at least 2 characters to search</p>
                </div>
              )}

              {searchResults.length > 0 && (
                <div className="space-y-3">
                  {searchResults.map(u => {
                    const isFriend = friends.some(f => f.user_id === u.user_id);
                    const alreadySent = sentToIds.has(u.user_id) || sentRequests.some(r => r.to_user_id === u.user_id);
                    const isSelf = u.user_id === user?.user_id;
                    return (
                      <div key={u.user_id} className="flex items-center gap-3 py-2 border-b border-border/30 last:border-0">
                        <Link to={`/profile/${u.user_id}`} className="shrink-0">
                          <Avatar className="h-12 w-12 hover:ring-2 hover:ring-primary/50 transition-all cursor-pointer">
                            <AvatarImage src={u.picture} />
                            <AvatarFallback>
                              {(u.nickname || u.name)?.[0]?.toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                        </Link>
                        <div className="flex-1 min-w-0">
                          <Link to={`/profile/${u.user_id}`} className="hover:underline">
                            <p className="text-sm font-medium text-foreground truncate">{u.nickname || u.name}</p>
                          </Link>
                          <p className="text-xs text-muted-foreground truncate">
                            {u.is_online ? <span className="text-green-500">Online</span> : "Parent"}
                            {u.location ? ` · ${u.location}` : ""}
                          </p>
                        </div>
                        {!isSelf && (
                          isFriend ? (
                            <span className="text-xs font-medium px-3 py-1 rounded-full shrink-0" style={{ background: "var(--sage-wash)", color: "var(--sage-deep)", border: "1px solid rgba(74,113,85,0.2)" }}>Friends ✓</span>
                          ) : alreadySent ? (
                            <span className="text-xs text-muted-foreground font-medium px-3 py-1 rounded-full bg-secondary shrink-0">Sent ✓</span>
                          ) : (
                            <Button
                              size="sm"
                              className="rounded-full h-8 text-xs px-3 shrink-0"
                              onClick={() => sendFriendRequest(u.user_id)}
                            >
                              <UserPlus className="h-3 w-3 mr-1" />
                              Add
                            </Button>
                          )
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
        <AppFooter />
      </main>
    </div>
  );
}
