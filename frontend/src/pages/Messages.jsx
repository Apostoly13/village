import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import Navigation from "../components/Navigation";
import { formatDistanceToNow } from "date-fns";

const API_URL = process.env.REACT_APP_BACKEND_URL;

export default function Messages({ user }) {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchConversations();
  }, []);

  const fetchConversations = async () => {
    try {
      const response = await fetch(`${API_URL}/api/messages/conversations`, {
        credentials: "include"
      });
      if (response.ok) {
        const data = await response.json();
        setConversations(data);
      }
    } catch (error) {
      console.error("Error fetching conversations:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (dateString) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch {
      return "";
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20 lg:pb-0">
      <Navigation user={user} />
      
      <main className="max-w-4xl mx-auto px-4 pt-20 lg:pt-24">
        <div className="mb-8">
          <h1 className="font-heading text-2xl sm:text-3xl font-bold text-foreground mb-1">Messages</h1>
          <p className="text-sm text-muted-foreground">Your private conversations</p>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-card rounded-2xl p-4 border border-border/50 animate-pulse">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-muted"></div>
                  <div className="flex-1 space-y-2">
                    <div className="w-32 h-4 bg-muted rounded"></div>
                    <div className="w-48 h-3 bg-muted rounded"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : conversations.length === 0 ? (
          <div className="text-center py-12 bg-card rounded-2xl border border-border/50">
            <span className="text-4xl mb-3 block">✉️</span>
            <h3 className="font-heading font-semibold text-foreground mb-1">No messages yet</h3>
            <p className="text-sm text-muted-foreground mb-4">Start a conversation from someone's profile.</p>
            <Link to="/forums" className="text-sm text-primary hover:underline">Browse forums</Link>
          </div>
        ) : (
          <div className="space-y-3">
            {conversations.map((conv, idx) => (
              <Link 
                key={conv.conversation_id} 
                to={`/messages/${conv.other_user_id}`}
                className="block"
                data-testid={`conversation-${idx}`}
              >
                <div className="bg-card rounded-2xl p-4 border border-border/50 hover:border-primary/30 transition-all">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={conv.other_user_picture} />
                        <AvatarFallback className="bg-primary/20 text-primary">
                          {conv.other_user_name?.[0]?.toUpperCase() || '?'}
                        </AvatarFallback>
                      </Avatar>
                      {conv.unread_count > 0 && (
                        <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-bold">
                          {conv.unread_count}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium text-foreground">{conv.other_user_name}</h3>
                        <span className="text-xs text-muted-foreground">{formatTime(conv.last_message_time)}</span>
                      </div>
                      <p className="text-sm text-muted-foreground truncate">{conv.last_message}</p>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Info Box */}
        <div className="mt-8 p-6 rounded-2xl bg-secondary/30 border border-border/30">
          <div className="flex items-start gap-4">
            <span className="text-2xl">💡</span>
            <div>
              <h3 className="font-heading font-bold text-foreground mb-1">Tip</h3>
              <p className="text-sm text-muted-foreground">
                To start a new conversation, visit a parent's profile from a forum post and send them a message.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
