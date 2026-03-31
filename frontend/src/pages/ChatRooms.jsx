import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import Navigation from "../components/Navigation";
import { Users, MapPin, Globe, Zap } from "lucide-react";

const API_URL = process.env.REACT_APP_BACKEND_URL;

export default function ChatRooms({ user }) {
  const [localRooms, setLocalRooms] = useState([]);
  const [globalRooms, setGlobalRooms] = useState([]);
  const [userRegion, setUserRegion] = useState(user?.region || "");
  const [availableRegions, setAvailableRegions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("local");

  useEffect(() => {
    fetchRooms();
  }, [userRegion]);

  const fetchRooms = async () => {
    try {
      const url = userRegion 
        ? `${API_URL}/api/chat/rooms?region=${userRegion}`
        : `${API_URL}/api/chat/rooms`;
      
      const response = await fetch(url, { credentials: "include" });
      if (response.ok) {
        const data = await response.json();
        setLocalRooms(data.local_rooms || []);
        setGlobalRooms(data.global_rooms || []);
        setAvailableRegions(data.available_regions || []);
        if (!userRegion && data.user_region) {
          setUserRegion(data.user_region);
        }
        
        // If no local rooms available, default to global tab
        if ((!data.local_rooms || data.local_rooms.length === 0) && activeTab === "local") {
          setActiveTab("global");
        }
      }
    } catch (error) {
      console.error("Error fetching rooms:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRegionChange = (region) => {
    setUserRegion(region);
    setActiveTab("local");
  };

  const RoomCard = ({ room, idx, isLocal = false }) => (
    <Link 
      key={room.room_id} 
      to={`/chat/${room.room_id}`}
      className="block"
      data-testid={`room-card-${idx}`}
    >
      <div className={`bg-card rounded-2xl p-6 border border-border/50 hover:border-primary/30 transition-all card-hover h-full ${isLocal ? 'ring-1 ring-primary/20' : ''}`}>
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center text-3xl flex-shrink-0">
            {room.icon}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-heading font-bold text-lg text-foreground">{room.name}</h3>
              {room.room_type === "local" && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-primary/20 text-primary flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  Local
                </span>
              )}
              {room.room_type === "overflow" && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-600 dark:text-orange-400 flex items-center gap-1">
                  <Zap className="h-3 w-3" />
                  Active
                </span>
              )}
            </div>
            <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{room.description}</p>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                {room.active_users || 0} online
              </span>
              {room.active_users > 40 && (
                <span className="text-orange-500 flex items-center gap-1">
                  <Zap className="h-3 w-3" />
                  Busy
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );

  return (
    <div className="min-h-screen bg-background pb-20 lg:pb-0">
      <Navigation user={user} />
      
      <main className="max-w-4xl mx-auto px-4 pt-20 lg:pt-24">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="font-heading text-2xl sm:text-3xl font-bold text-foreground mb-2">Chat Rooms</h1>
            <p className="text-muted-foreground">Connect with parents in real-time</p>
          </div>
          
          {/* Region Selector */}
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <Select value={userRegion} onValueChange={handleRegionChange}>
              <SelectTrigger className="w-40 h-9 rounded-lg bg-secondary/50 border-transparent" data-testid="region-select">
                <SelectValue placeholder="Select region" />
              </SelectTrigger>
              <SelectContent>
                {availableRegions.map((region) => (
                  <SelectItem key={region} value={region}>{region}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full bg-card border border-border/50 rounded-xl p-1 mb-6">
            <TabsTrigger 
              value="local" 
              className="flex-1 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              data-testid="tab-local"
              disabled={!userRegion}
            >
              <MapPin className="h-4 w-4 mr-2" />
              Local ({localRooms.length})
            </TabsTrigger>
            <TabsTrigger 
              value="global" 
              className="flex-1 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              data-testid="tab-global"
            >
              <Globe className="h-4 w-4 mr-2" />
              Global ({globalRooms.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="local" className="mt-0">
            {!userRegion ? (
              <div className="text-center py-12 bg-card rounded-2xl border border-border/50">
                <span className="text-5xl mb-4 block">📍</span>
                <h3 className="font-heading text-xl font-bold text-foreground mb-2">Select your region</h3>
                <p className="text-muted-foreground mb-4">Choose your region above to see local chat rooms</p>
              </div>
            ) : loading ? (
              <div className="grid sm:grid-cols-2 gap-4">
                {[1, 2].map((i) => (
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
            ) : localRooms.length === 0 ? (
              <div className="text-center py-12 bg-card rounded-2xl border border-border/50">
                <span className="text-5xl mb-4 block">🏡</span>
                <h3 className="font-heading text-xl font-bold text-foreground mb-2">No local rooms for {userRegion}</h3>
                <p className="text-muted-foreground mb-4">Try the global rooms or select a different region</p>
                <Button onClick={() => setActiveTab("global")} className="rounded-full">
                  View Global Rooms
                </Button>
              </div>
            ) : (
              <>
                <div className="mb-4 p-4 rounded-xl bg-primary/5 border border-primary/20">
                  <p className="text-sm text-foreground flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-primary" />
                    Showing rooms for <strong>{userRegion}</strong> - Connect with parents in your timezone!
                  </p>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  {localRooms.map((room, idx) => (
                    <RoomCard key={room.room_id} room={room} idx={idx} isLocal />
                  ))}
                </div>
              </>
            )}
          </TabsContent>

          <TabsContent value="global" className="mt-0">
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
            ) : globalRooms.length === 0 ? (
              <div className="text-center py-12 bg-card rounded-2xl border border-border/50">
                <span className="text-5xl mb-4 block">💬</span>
                <h3 className="font-heading text-xl font-bold text-foreground mb-2">No global rooms available</h3>
                <p className="text-muted-foreground">Check back soon!</p>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 gap-4">
                {globalRooms.map((room, idx) => (
                  <RoomCard key={room.room_id} room={room} idx={idx} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Info Box */}
        <div className="mt-8 p-6 rounded-2xl bg-primary/5 border border-primary/20">
          <div className="flex items-start gap-4">
            <span className="text-3xl">🌙</span>
            <div>
              <h3 className="font-heading font-bold text-foreground mb-1">Night Owl Tip</h3>
              <p className="text-sm text-muted-foreground">
                The "3am Club" room is most active between 10pm and 4am. 
                Perfect for those late-night feeds when you need someone to talk to! 
                Active night owls get a 🦉 badge on their profile.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
