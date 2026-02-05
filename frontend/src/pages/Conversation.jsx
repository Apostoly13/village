import { useState, useEffect, useRef } from "react";
import { Link, useParams } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { ScrollArea } from "../components/ui/scroll-area";
import Navigation from "../components/Navigation";
import { toast } from "sonner";
import { ArrowLeft, Send } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

const API_URL = process.env.REACT_APP_BACKEND_URL;

export default function Conversation({ user }) {
  const { userId: otherUserId } = useParams();
  const [otherUser, setOtherUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    fetchData();
    // Poll for new messages
    const interval = setInterval(fetchMessages, 3000);
    return () => clearInterval(interval);
  }, [otherUserId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchData = async () => {
    try {
      const [userRes, messagesRes] = await Promise.all([
        fetch(`${API_URL}/api/users/${otherUserId}`, { credentials: "include" }),
        fetch(`${API_URL}/api/messages/${otherUserId}`, { credentials: "include" })
      ]);

      if (userRes.ok) setOtherUser(await userRes.json());
      if (messagesRes.ok) setMessages(await messagesRes.json());
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async () => {
    try {
      const response = await fetch(`${API_URL}/api/messages/${otherUserId}`, {
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
      const response = await fetch(`${API_URL}/api/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          receiver_id: otherUserId,
          content: newMessage
        })
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

  const isOwnMessage = (msg) => msg.sender_id === user?.user_id;

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

  if (!otherUser) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation user={user} />
        <main className="max-w-4xl mx-auto px-4 pt-20 lg:pt-24 text-center">
          <h1 className="font-heading text-2xl font-bold text-foreground">User not found</h1>
          <Link to="/messages">
            <Button className="mt-4">Back to Messages</Button>
          </Link>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navigation user={user} />
      
      <main className="flex-1 flex flex-col max-w-4xl mx-auto w-full px-4 pt-20 lg:pt-24 pb-20 lg:pb-4">
        {/* Header */}
        <div className="flex items-center gap-4 mb-4">
          <Link to="/messages" className="text-muted-foreground hover:text-foreground" data-testid="back-link">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <Link to={`/profile/${otherUserId}`} className="flex items-center gap-3" data-testid="user-profile-link">
            <Avatar className="h-10 w-10">
              <AvatarImage src={otherUser.picture} />
              <AvatarFallback className="bg-primary/20 text-primary">
                {otherUser.name?.[0]?.toUpperCase() || '?'}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="font-heading font-bold text-lg text-foreground">{otherUser.nickname || otherUser.name}</h1>
              <p className="text-xs text-muted-foreground">Tap to view profile</p>
            </div>
          </Link>
        </div>

        {/* Messages Area */}
        <div className="flex-1 bg-card rounded-2xl border border-border/50 flex flex-col overflow-hidden">
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {messages.length === 0 ? (
                <div className="text-center py-12">
                  <span className="text-4xl mb-4 block">👋</span>
                  <p className="text-muted-foreground">Start a conversation with {otherUser.nickname || otherUser.name}</p>
                </div>
              ) : (
                messages.map((msg, idx) => (
                  <div 
                    key={msg.message_id} 
                    className={`flex ${isOwnMessage(msg) ? 'justify-end' : 'justify-start'}`}
                    data-testid={`message-${idx}`}
                  >
                    <div className={`max-w-[80%]`}>
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
