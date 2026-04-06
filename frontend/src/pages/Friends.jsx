import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Badge } from "../components/ui/badge";
import Navigation from "../components/Navigation";
import { toast } from "sonner";
import { Users, UserPlus, Clock, Check, X, MessageCircle, Heart, MessagesSquare } from "lucide-react";

const API_URL = process.env.REACT_APP_BACKEND_URL;

export default function FriendsPage({ user }) {
  const navigate = useNavigate();
  const [friends, setFriends] = useState([]);
  const [requests, setRequests] = useState([]);
  const [sentRequests, setSentRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState({});
  const [chatLoading, setChatLoading] = useState({});

  useEffect(() => {
    fetchAllData();
  }, []);

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

  const FriendCard = ({ friend, showRemove = false }) => (
    <div className="bg-card rounded-2xl p-4 border border-border/50 hover:border-primary/30 transition-colors" data-testid={`friend-card-${friend.user_id}`}>
      <div className="flex items-center gap-4">
        <Link to={`/profile/${friend.user_id}`} className="relative shrink-0">
          <Avatar className="h-14 w-14 cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all">
            <AvatarImage src={friend.picture} />
            <AvatarFallback className="bg-primary/20 text-primary text-lg">
              {friend.name?.[0]?.toUpperCase() || '?'}
            </AvatarFallback>
          </Avatar>
          {/* Online indicator */}
          <span className={`absolute bottom-0.5 right-0.5 w-3.5 h-3.5 rounded-full border-2 border-card ${
            friend.is_online ? "bg-green-500" : "bg-muted-foreground/40"
          }`} title={friend.is_online ? "Online" : "Offline"} />
        </Link>
        <div className="flex-1 min-w-0">
          <Link to={`/profile/${friend.user_id}`} className="hover:underline">
            <h3 className="font-medium text-foreground truncate">{friend.nickname || friend.name}</h3>
          </Link>
          {friend.is_online ? (
            <p className="text-xs text-green-500 font-medium">Online</p>
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
    <div className="bg-card rounded-2xl p-4 border border-border/50" data-testid={`request-card-${request.request_id}`}>
      <div className="flex items-center gap-4">
        <Link to={`/profile/${request.from_user?.user_id}`}>
          <Avatar className="h-14 w-14 cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all">
            <AvatarImage src={request.from_user?.picture} />
            <AvatarFallback className="bg-primary/20 text-primary text-lg">
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
    <div className="min-h-screen bg-background pb-20 lg:pb-0">
      <Navigation user={user} />
      
      <main className="max-w-4xl mx-auto px-4 pt-20 lg:pt-24">
        <div className="mb-8">
          <h1 className="font-heading text-2xl sm:text-3xl font-bold text-foreground mb-1">Your friends</h1>
          <p className="text-sm text-muted-foreground">Connect with parents in the village</p>
        </div>

        <Tabs defaultValue="friends" className="w-full">
          <TabsList className="w-full bg-card border border-border/50 rounded-xl p-1 mb-6">
            <TabsTrigger value="friends" className="flex-1 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground" data-testid="tab-friends">
              Friends ({friends.length})
            </TabsTrigger>
            <TabsTrigger value="requests" className="flex-1 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground relative" data-testid="tab-requests">
              Requests
              {requests.length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">
                  {requests.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="sent" className="flex-1 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground" data-testid="tab-sent">
              Sent ({sentRequests.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="friends" className="mt-0">
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="bg-card rounded-2xl p-4 border border-border/50 animate-pulse">
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
              <div className="text-center py-12 bg-card rounded-2xl border border-border/50">
                <span className="text-4xl mb-3 block">👋</span>
                <h3 className="font-heading font-semibold text-foreground mb-1">Your village is waiting</h3>
                <p className="text-sm text-muted-foreground mb-4">Add people you meet in the forums or chat rooms.</p>
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
                  <div key={i} className="bg-card rounded-2xl p-4 border border-border/50 animate-pulse">
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
              <div className="text-center py-12 bg-card rounded-2xl border border-border/50">
                <span className="text-4xl mb-3 block">📭</span>
                <h3 className="font-heading font-semibold text-foreground mb-1">No pending requests</h3>
                <p className="text-sm text-muted-foreground">When someone wants to connect, you'll see it here.</p>
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
                  <div key={i} className="bg-card rounded-2xl p-4 border border-border/50 animate-pulse">
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
              <div className="text-center py-12 bg-card rounded-2xl border border-border/50">
                <span className="text-4xl mb-3 block">✉️</span>
                <h3 className="font-heading font-semibold text-foreground mb-1">No sent requests</h3>
                <p className="text-sm text-muted-foreground">Friend requests you send will appear here.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {sentRequests.map(request => (
                  <div key={request.request_id} className="bg-card rounded-2xl p-4 border border-border/50" data-testid={`sent-${request.request_id}`}>
                    <div className="flex items-center gap-4">
                      <Avatar className="h-14 w-14">
                        <AvatarFallback className="bg-secondary text-muted-foreground">
                          <Clock className="h-6 w-6" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <h3 className="font-medium text-foreground">Request sent</h3>
                        <p className="text-sm text-muted-foreground">Waiting for response...</p>
                      </div>
                      <Badge variant="outline" className="rounded-full">
                        <Clock className="h-3 w-3 mr-1" />
                        Pending
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
