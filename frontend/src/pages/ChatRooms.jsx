import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import Navigation from "../components/Navigation";
import { Users, MapPin, Map, Compass, AlertCircle } from "lucide-react";

const API_URL = process.env.REACT_APP_BACKEND_URL;

export default function ChatRooms({ user }) {
  const [localRooms, setLocalRooms] = useState([]);
  const [stateRooms, setStateRooms] = useState([]);
  const [allAustraliaRooms, setAllAustraliaRooms] = useState([]);
  const [userState, setUserState] = useState(user?.state || "");
  const [preferredReach, setPreferredReach] = useState(user?.preferred_reach || "state");
  const [distanceOptions, setDistanceOptions] = useState([]);
  const [availableStates, setAvailableStates] = useState([]);
  const [hasLocation, setHasLocation] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("state");

  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    try {
      const response = await fetch(`${API_URL}/api/chat/rooms`, { credentials: "include" });
      if (response.ok) {
        const data = await response.json();
        setLocalRooms(data.local_rooms || []);
        setStateRooms(data.state_rooms || []);
        setAllAustraliaRooms(data.all_australia_rooms || []);
        setUserState(data.user_state || "");
        setPreferredReach(data.preferred_reach || "state");
        setDistanceOptions(data.distance_options || []);
        setAvailableStates(data.available_states || []);
        setHasLocation(data.has_location || false);
        
        // Set initial tab based on user's setup
        if (data.has_location && data.local_rooms?.length > 0) {
          setActiveTab("local");
        } else if (data.user_state && data.state_rooms?.length > 0) {
          setActiveTab("state");
        } else {
          setActiveTab("australia");
        }
      }
    } catch (error) {
      console.error("Error fetching rooms:", error);
    } finally {
      setLoading(false);
    }
  };

  const RoomCard = ({ room, idx, showDistance = false }) => (
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
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <h3 className="font-heading font-bold text-lg text-foreground">{room.name}</h3>
              {showDistance && room.distance_km !== undefined && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/20 text-green-600 dark:text-green-400 flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {room.distance_km}km away
                </span>
              )}
            </div>
            <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{room.description}</p>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                {room.active_users || 0} online
              </span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );

  const LocationPrompt = () => (
    <div className="bg-primary/5 border border-primary/20 rounded-2xl p-6 mb-6">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
          <MapPin className="h-6 w-6 text-primary" />
        </div>
        <div className="flex-1">
          <h3 className="font-heading font-bold text-foreground mb-1">Set your location to connect locally</h3>
          <p className="text-sm text-muted-foreground mb-3">
            Add your suburb or postcode in your profile to see local parents and nearby chat rooms.
          </p>
          <Link to="/profile">
            <Button size="sm" className="rounded-full bg-primary text-primary-foreground">
              Update Profile
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );

  const StatePrompt = () => (
    <div className="bg-secondary/50 border border-border/50 rounded-2xl p-6 mb-6">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center">
          <Map className="h-6 w-6 text-muted-foreground" />
        </div>
        <div className="flex-1">
          <h3 className="font-heading font-bold text-foreground mb-1">Select your state</h3>
          <p className="text-sm text-muted-foreground mb-3">
            Set your state in your profile to see state-specific chat rooms.
          </p>
          <Link to="/profile">
            <Button size="sm" variant="outline" className="rounded-full">
              Update Profile
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background pb-20 lg:pb-0">
      <Navigation user={user} />
      
      <main className="max-w-4xl mx-auto px-4 pt-20 lg:pt-24">
        <div className="mb-8">
          <h1 className="font-heading text-2xl sm:text-3xl font-bold text-foreground mb-2">Chat Rooms</h1>
          <p className="text-muted-foreground">Connect with Aussie parents in real-time</p>
        </div>

        {!hasLocation && <LocationPrompt />}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full bg-card border border-border/50 rounded-xl p-1 mb-6">
            <TabsTrigger 
              value="local" 
              className="flex-1 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              data-testid="tab-local"
              disabled={!hasLocation}
            >
              <Compass className="h-4 w-4 mr-2" />
              Nearby
            </TabsTrigger>
            <TabsTrigger 
              value="state" 
              className="flex-1 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              data-testid="tab-state"
            >
              <Map className="h-4 w-4 mr-2" />
              {userState || "State"}
            </TabsTrigger>
            <TabsTrigger 
              value="australia" 
              className="flex-1 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              data-testid="tab-australia"
            >
              🇦🇺 All Australia
            </TabsTrigger>
          </TabsList>

          {/* Nearby/Local Tab */}
          <TabsContent value="local" className="mt-0">
            {!hasLocation ? (
              <div className="text-center py-12 bg-card rounded-2xl border border-border/50">
                <span className="text-5xl mb-4 block">📍</span>
                <h3 className="font-heading text-xl font-bold text-foreground mb-2">Location not set</h3>
                <p className="text-muted-foreground mb-4">Update your profile with your location to see nearby rooms</p>
                <Link to="/profile">
                  <Button className="rounded-full bg-primary text-primary-foreground">Set Location</Button>
                </Link>
              </div>
            ) : loading ? (
              <div className="grid sm:grid-cols-2 gap-4">
                {[1, 2].map((i) => (
                  <div key={i} className="bg-card rounded-2xl p-6 border border-border/50 animate-pulse">
                    <div className="flex items-start gap-4">
                      <div className="w-14 h-14 rounded-xl bg-muted"></div>
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
                <span className="text-5xl mb-4 block">🔍</span>
                <h3 className="font-heading text-xl font-bold text-foreground mb-2">No nearby rooms yet</h3>
                <p className="text-muted-foreground mb-4">
                  Try expanding your reach in profile settings, or check the state and Australia-wide rooms.
                </p>
                <Button onClick={() => setActiveTab("state")} className="rounded-full">
                  View State Rooms
                </Button>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 gap-4">
                {localRooms.map((room, idx) => (
                  <RoomCard key={room.room_id} room={room} idx={idx} showDistance />
                ))}
              </div>
            )}
          </TabsContent>

          {/* State Tab */}
          <TabsContent value="state" className="mt-0">
            {!userState && <StatePrompt />}
            
            {loading ? (
              <div className="grid sm:grid-cols-2 gap-4">
                {[1, 2].map((i) => (
                  <div key={i} className="bg-card rounded-2xl p-6 border border-border/50 animate-pulse">
                    <div className="flex items-start gap-4">
                      <div className="w-14 h-14 rounded-xl bg-muted"></div>
                      <div className="flex-1 space-y-2">
                        <div className="w-3/4 h-5 bg-muted rounded"></div>
                        <div className="w-full h-4 bg-muted rounded"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : stateRooms.length === 0 ? (
              <div className="text-center py-12 bg-card rounded-2xl border border-border/50">
                <span className="text-5xl mb-4 block">🏙️</span>
                <h3 className="font-heading text-xl font-bold text-foreground mb-2">
                  {userState ? `No rooms for ${userState} yet` : "Select your state"}
                </h3>
                <p className="text-muted-foreground mb-4">
                  {userState 
                    ? "Check out the Australia-wide rooms while we grow!" 
                    : "Set your state in your profile to see local state rooms"}
                </p>
                {!userState ? (
                  <Link to="/profile">
                    <Button className="rounded-full">Update Profile</Button>
                  </Link>
                ) : (
                  <Button onClick={() => setActiveTab("australia")} className="rounded-full">
                    View All Australia
                  </Button>
                )}
              </div>
            ) : (
              <>
                {userState && (
                  <div className="mb-4 p-3 rounded-xl bg-secondary/30 border border-border/30">
                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                      <Map className="h-4 w-4" />
                      Showing rooms for <strong className="text-foreground">{userState}</strong>
                    </p>
                  </div>
                )}
                <div className="grid sm:grid-cols-2 gap-4">
                  {stateRooms.map((room, idx) => (
                    <RoomCard key={room.room_id} room={room} idx={idx} />
                  ))}
                </div>
              </>
            )}
          </TabsContent>

          {/* All Australia Tab */}
          <TabsContent value="australia" className="mt-0">
            {loading ? (
              <div className="grid sm:grid-cols-2 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="bg-card rounded-2xl p-6 border border-border/50 animate-pulse">
                    <div className="flex items-start gap-4">
                      <div className="w-14 h-14 rounded-xl bg-muted"></div>
                      <div className="flex-1 space-y-2">
                        <div className="w-3/4 h-5 bg-muted rounded"></div>
                        <div className="w-full h-4 bg-muted rounded"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : allAustraliaRooms.length === 0 ? (
              <div className="text-center py-12 bg-card rounded-2xl border border-border/50">
                <span className="text-5xl mb-4 block">🇦🇺</span>
                <h3 className="font-heading text-xl font-bold text-foreground mb-2">No rooms available</h3>
                <p className="text-muted-foreground">Check back soon!</p>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 gap-4">
                {allAustraliaRooms.map((room, idx) => (
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
                The "3am Club" room is most active between 10pm and 4am AEST. 
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
