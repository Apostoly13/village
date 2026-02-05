import { useState, useEffect, useRef } from "react";
import { Link, useParams } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { ScrollArea } from "../components/ui/scroll-area";
import Navigation from "../components/Navigation";
import { toast } from "sonner";
import { ArrowLeft, Send, Users } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

const API_URL = process.env.REACT_APP_BACKEND_URL;

export default function ChatRoom({ user }) {
  const { roomId } = useParams();
  const [room, setRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);
  const scrollAreaRef = useRef(null);

  useEffect(() => {
    fetchData();
    // Poll for new messages every 3 seconds
    const interval = setInterval(fetchMessages, 3000);
    return () => clearInterval(interval);
  }, [roomId]);

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
          <div className="flex items-center gap-3">
            <span className="text-2xl">{room.icon}</span>
            <div>
              <h1 className="font-heading font-bold text-xl text-foreground">{room.name}</h1>
              <p className="text-sm text-muted-foreground">{room.description}</p>
            </div>
          </div>
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
                    className={`flex ${isOwnMessage(msg) ? 'justify-end' : 'justify-start'}`}
                    data-testid={`message-${idx}`}
                  >
                    <div className={`flex items-end gap-2 max-w-[80%] ${isOwnMessage(msg) ? 'flex-row-reverse' : ''}`}>
                      {!isOwnMessage(msg) && (
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={msg.author_picture} />
                          <AvatarFallback className="bg-primary/20 text-primary text-sm">
                            {msg.author_name?.[0]?.toUpperCase() || '?'}
                          </AvatarFallback>
                        </Avatar>
                      )}
                      <div>
                        {!isOwnMessage(msg) && (
                          <p className="text-xs text-muted-foreground mb-1 ml-1">{msg.author_name}</p>
                        )}
                        <div className={`rounded-2xl px-4 py-2 ${
                          isOwnMessage(msg) 
                            ? 'bg-primary text-primary-foreground rounded-br-md' 
                            : 'bg-secondary text-foreground rounded-bl-md'
                        }`}>
                          <p className="text-sm">{msg.content}</p>
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
          <form onSubmit={handleSend} className="p-4 border-t border-border/50 flex gap-3" data-testid="message-form">
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
          </form>
        </div>
      </main>
    </div>
  );
}
