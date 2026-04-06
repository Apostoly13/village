import { useState, useEffect, useRef } from "react";
import { Link, useParams } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { ScrollArea } from "../components/ui/scroll-area";
import Navigation from "../components/Navigation";
import { toast } from "sonner";
import { ArrowLeft, Send, Users, Crown, Bookmark } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

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
  const messagesEndRef = useRef(null);
  const scrollAreaRef = useRef(null);

  useEffect(() => {
    fetchData();
    fetchSubscription();
    fetchSavedMessageIds();
    // Poll for new messages every 3 seconds
    const interval = setInterval(fetchMessages, 3000);
    return () => clearInterval(interval);
  }, [roomId]);

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

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchData = async () => {
    try {
      const [roomRes, messagesRes] = await Promise.all([
        fetch(`${API_URL}/api/chat/rooms/${roomId}`, { credentials: "include" }),
        fetch(`${API_URL}/api/chat/rooms/${roomId}/messages`, { credentials: "include" })
      ]);

      if (roomRes.ok) setRoom(await roomRes.json());
      if (messagesRes.ok) setMessages(await messagesRes.json());
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async () => {
    try {
      const response = await fetch(`${API_URL}/api/chat/rooms/${roomId}/messages`, {
        credentials: "include"
      });
      if (response.ok) {
        const data = await response.json();
        setMessages(data);
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;

    setSending(true);
    try {
      const response = await fetch(`${API_URL}/api/chat/rooms/${roomId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ content: newMessage })
      });

      if (response.ok) {
        const message = await response.json();
        setMessages(prev => [...prev, message]);
        setNewMessage("");
        fetchSubscription();
      } else if (response.status === 429) {
        const error = await response.json();
        toast.error(error.detail?.message || "Daily message limit reached");
        fetchSubscription();
      } else {
        toast.error("Failed to send message");
      }
    } catch (error) {
      toast.error("Something went wrong");
    } finally {
      setSending(false);
    }
  };

  const formatTime = (dateString) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch {
      return "";
    }
  };

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
      <div className="min-h-screen bg-background">
        <Navigation user={user} />
        <main className="max-w-4xl mx-auto px-4 pt-20 lg:pt-24">
          <div className="animate-pulse space-y-4">
            <div className="h-6 w-32 bg-muted rounded"></div>
            <div className="bg-card rounded-2xl h-[60vh] border border-border/50"></div>
          </div>
        </main>
      </div>
    );
  }

  if (!room) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation user={user} />
        <main className="max-w-4xl mx-auto px-4 pt-20 lg:pt-24 text-center">
          <h1 className="font-heading text-2xl font-bold text-foreground">Room not found</h1>
          <Link to="/chat">
            <Button className="mt-4">Back to Chat Rooms</Button>
          </Link>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navigation user={user} />
      
      <main className="flex-1 flex flex-col max-w-4xl mx-auto w-full px-4 pt-20 lg:pt-24 pb-20 lg:pb-4">
        {/* Room Header */}
        <div className="flex items-center gap-4 mb-4">
          <Link to="/chat" className="text-muted-foreground hover:text-foreground" data-testid="back-link">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          {room.room_type === "friends_only" ? (
            (() => {
              const friendId = room.participant_ids?.find(id => id !== user?.user_id);
              return (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-lg font-semibold text-primary">
                    💬
                  </div>
                  <div>
                    <h1 className="font-heading font-bold text-xl text-foreground">Private Chat</h1>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-green-500 inline-block"></span>
                      End-to-end private
                    </p>
                  </div>
                </div>
              );
            })()
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

        {/* Messages Area */}
        <div className="flex-1 bg-card rounded-2xl border border-border/50 flex flex-col overflow-hidden">
          <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
            <div className="space-y-4">
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
                    <div className={`flex items-end gap-2 max-w-[80%] ${isOwnMessage(msg) ? 'flex-row-reverse' : ''}`}>
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
                      <div>
                        {!isOwnMessage(msg) && (
                          <Link to={`/profile/${msg.author_id}`} className="hover:underline">
                            <p className="text-xs text-muted-foreground mb-1 ml-1 cursor-pointer hover:text-primary transition-colors flex items-center gap-1">
                              {msg.author_name}
                              {msg.author_subscription_tier === "premium" && <Crown className="h-3 w-3 text-amber-500" />}
                            </p>
                          </Link>
                        )}
                        <div className={`flex items-center gap-1 ${isOwnMessage(msg) ? 'flex-row-reverse' : ''}`}>
                          <div className={`rounded-2xl px-4 py-2 ${
                            isOwnMessage(msg)
                              ? 'bg-primary text-primary-foreground rounded-br-md'
                              : 'bg-secondary text-foreground rounded-bl-md'
                          }`}>
                            <p className="text-sm">{msg.content}</p>
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
          </ScrollArea>

          {/* Message Input */}
          {room.room_type !== "friends_only" && subscription?.limits_apply && subscription?.chat_messages && !subscription.chat_messages.allowed ? (
            <div className="p-4 border-t border-border/50">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30">
                <Crown className="h-5 w-5 text-amber-500 flex-shrink-0" />
                <div className="flex-1">
                  <p className="font-medium text-foreground text-sm">Daily message limit reached</p>
                  <p className="text-xs text-muted-foreground">Upgrade to Premium for unlimited chat</p>
                </div>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSend} className="p-4 border-t border-border/50" data-testid="message-form">
              {subscription?.limits_apply && subscription?.chat_messages && (
                <p className="text-xs text-muted-foreground mb-2" data-testid="chat-limit-counter">
                  {subscription.chat_messages.limit - subscription.chat_messages.used}/{subscription.chat_messages.limit} messages today
                </p>
              )}
              <div className="flex gap-3">
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 h-12 rounded-xl bg-secondary/50 border-transparent focus:border-primary"
                  data-testid="message-input"
                />
                <Button
                  type="submit"
                  disabled={sending || !newMessage.trim()}
                  className="h-12 w-12 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 p-0"
                  data-testid="send-btn"
                >
                  <Send className="h-5 w-5" />
                </Button>
              </div>
            </form>
          )}
        </div>
      </main>
    </div>
  );
}
