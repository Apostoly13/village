import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Navigation from "../components/Navigation";
import { Users } from "lucide-react";

const API_URL = process.env.REACT_APP_BACKEND_URL;

export default function ChatRooms({ user }) {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    try {
      const response = await fetch(`${API_URL}/api/chat/rooms`, {
        credentials: "include"
      });
      if (response.ok) {
        const data = await response.json();
        setRooms(data);
      }
    } catch (error) {
      console.error("Error fetching rooms:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20 lg:pb-0">
      <Navigation user={user} />
      
      <main className="max-w-4xl mx-auto px-4 pt-20 lg:pt-24">
        <div className="mb-8">
          <h1 className="font-heading text-2xl sm:text-3xl font-bold text-foreground mb-2">Chat Rooms</h1>
          <p className="text-muted-foreground">Join a room and connect with other parents in real-time</p>
        </div>

        {loading ? (
          <div className="grid sm:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-card rounded-2xl p-6 border border-border/50 animate-pulse">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-muted"></div>
                  <div className="flex-1 space-y-2">
                    <div className="w-3/4 h-5 bg-muted rounded"></div>
                    <div className="w-full h-4 bg-muted rounded"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : rooms.length === 0 ? (
          <div className="text-center py-12 bg-card rounded-2xl border border-border/50">
            <span className="text-5xl mb-4 block">💬</span>
            <h3 className="font-heading text-xl font-bold text-foreground mb-2">No chat rooms available</h3>
            <p className="text-muted-foreground">Check back soon!</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            {rooms.map((room, idx) => (
              <Link 
                key={room.room_id} 
                to={`/chat/${room.room_id}`}
                className="block"
                data-testid={`room-card-${idx}`}
              >
                <div className="bg-card rounded-2xl p-6 border border-border/50 hover:border-primary/30 transition-all card-hover h-full">
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center text-3xl flex-shrink-0">
                      {room.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-heading font-bold text-lg text-foreground mb-1">{room.name}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{room.description}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Users className="h-4 w-4" />
                        <span>Join the conversation</span>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Info Box */}
        <div className="mt-8 p-6 rounded-2xl bg-primary/5 border border-primary/20">
          <div className="flex items-start gap-4">
            <span className="text-3xl">🦉</span>
            <div>
              <h3 className="font-heading font-bold text-foreground mb-1">Night Owl Tip</h3>
              <p className="text-sm text-muted-foreground">
                The "Night Owl Parents" room is most active between 10pm and 4am. 
                Perfect for those late-night feeds when you need someone to talk to!
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
