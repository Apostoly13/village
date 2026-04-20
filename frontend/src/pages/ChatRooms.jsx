import { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import Navigation from "../components/Navigation";
import AppFooter from "../components/AppFooter";
import { toast } from "sonner";
import { Users, MapPin, Compass, Search, Plus, MessagesSquare } from "lucide-react";

const API_URL = process.env.REACT_APP_BACKEND_URL;

const DISTANCE_OPTIONS = [
  { id: "2km", label: "Super Local (2km)" },
  { id: "5km", label: "Local (5km)" },
  { id: "10km", label: "Nearby (10km)" },
  { id: "25km", label: "25km" },
  { id: "50km", label: "50km" },
  { id: "100km", label: "100km" },
];

// Returns the AEST hour (UTC+10, no DST adjustment)
function getAESTHour() {
  const now = new Date();
  const aestMs = now.getTime() + 10 * 60 * 60 * 1000;
  return new Date(aestMs).getUTCHours();
}

function isNightOwlTime() {
  const h = getAESTHour();
  return h >= 22 || h < 4;
}

export default function ChatRooms({ user }) {
  const navigate = useNavigate();
  const [mySuburbRoom, setMySuburbRoom] = useState(null);
  const [nearbyRooms, setNearbyRooms] = useState([]);
  const [allAustraliaRooms, setAllAustraliaRooms] = useState([]);
  const [userSuburb, setUserSuburb] = useState("");
  const [userPostcode, setUserPostcode] = useState("");
  const [preferredReach, setPreferredReach] = useState(user?.preferred_reach || "25km");
  const [hasLocation, setHasLocation] = useState(false);
  const [loading, setLoading] = useState(true);
  // Default to "village" (All Australia) tab
  const [activeTab, setActiveTab] = useState("village");
  const [creatingRoom, setCreatingRoom] = useState(false);

  // Local Circles search state (replaces the separate Search tab)
  const [localSearch, setLocalSearch] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searchCanCreate, setSearchCanCreate] = useState(false);
  const [searchPostcode, setSearchPostcode] = useState(null);
  const [searching, setSearching] = useState(false);

  // Friends state
  const [friends, setFriends] = useState([]);
  const [friendsLoading, setFriendsLoading] = useState(false);
  const [openingChat, setOpeningChat] = useState({});

  const nightOwl = isNightOwlTime();

  useEffect(() => {
    fetchRooms();
    fetchFriends();
  }, []);

  const fetchFriends = async () => {
    setFriendsLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/friends`, { credentials: "include" });
      if (res.ok) setFriends(await res.json());
    } catch (error) {
      console.error("Error fetching friends:", error);
    } finally {
      setFriendsLoading(false);
    }
  };

  const openFriendChat = async (friendId) => {
    setOpeningChat(prev => ({ ...prev, [friendId]: true }));
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
      setOpeningChat(prev => ({ ...prev, [friendId]: false }));
    }
  };

  const fetchRooms = async (reachOverride) => {
    try {
      const params = new URLSearchParams();
      if (reachOverride) params.set("preferred_reach", reachOverride);
      const qs = params.toString() ? `?${params.toString()}` : "";
      const response = await fetch(`${API_URL}/api/chat/rooms${qs}`, { credentials: "include" });
      if (response.ok) {
        const data = await response.json();
        setMySuburbRoom(data.my_suburb_room);
        setNearbyRooms(data.nearby_rooms || []);
        // Client-side dedup by name — catches duplicates with different room_ids (legacy DB entries)
        const raw = data.all_australia_rooms || [];
        const seenNames = new Set();
        const deduped = raw.filter(r => {
          const key = (r.name || r.room_id).toLowerCase();
          if (seenNames.has(key)) return false;
          seenNames.add(key);
          return true;
        });
        setAllAustraliaRooms(deduped);
        setUserSuburb(data.user_suburb || "");
        setUserPostcode(data.user_postcode || "");
        setPreferredReach(data.preferred_reach || "25km");
        setHasLocation(data.has_location || false);
      }
    } catch (error) {
      console.error("Error fetching rooms:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleReachChange = (newReach) => {
    setPreferredReach(newReach);
    setLoading(true);
    fetchRooms(newReach);
  };

  const createSuburbRoom = async (postcode, suburb) => {
    setCreatingRoom(true);
    try {
      const body = { postcode };
      if (suburb) body.suburb = suburb;
      const response = await fetch(`${API_URL}/api/chat/rooms/suburb`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });
      if (response.ok) {
        const room = await response.json();
        toast.success(`Room created for ${room.suburb || postcode}!`);
        navigate(`/chat/${room.room_id}`);
      } else {
        toast.error("Failed to create room");
      }
    } catch (error) {
      toast.error("Something went wrong");
    } finally {
      setCreatingRoom(false);
    }
  };

  // Debounced search within Local Circles tab
  useEffect(() => {
    if (activeTab !== "local" || localSearch.length < 2) {
      setSearchResults([]);
      setSearchCanCreate(false);
      setSearchPostcode(null);
      return;
    }
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const response = await fetch(
          `${API_URL}/api/chat/rooms/search?q=${encodeURIComponent(localSearch)}`,
          { credentials: "include" }
        );
        if (response.ok) {
          const data = await response.json();
          setSearchResults(data.rooms || []);
          setSearchCanCreate(data.can_create || false);
          setSearchPostcode(data.search_postcode || null);
        }
      } catch (error) {
        console.error("Search error:", error);
      } finally {
        setSearching(false);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [localSearch, activeTab]);

  const RoomCard = ({ room, idx, showDistance = false }) => (
    <Link key={room.room_id} to={`/chat/${room.room_id}`} className="block" data-testid={`room-card-${idx}`}>
      <div className="bg-card rounded-2xl p-5 border border-border/40 card-elevated border-l-2 border-l-primary/20 transition-all h-full hover:border-primary/30 hover:shadow-md hover:border-l-primary/40">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center text-3xl flex-shrink-0">
            {room.icon}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <h3 className="font-heading font-bold text-lg text-foreground">{room.name}</h3>
              {showDistance && room.distance_km !== undefined && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/20 text-green-600 dark:text-green-400 flex items-center gap-1">
                  <MapPin className="h-3 w-3" />{room.distance_km}km
                </span>
              )}
              {room.postcode && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">{room.postcode}</span>
              )}
            </div>
            <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{room.description}</p>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Users className="h-4 w-4" />{room.active_users || 0} online
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
            Add your suburb or postcode in your profile to see local group chats.
          </p>
          <Link to="/profile">
            <Button size="sm" className="rounded-full bg-primary text-primary-foreground">Update Profile</Button>
          </Link>
        </div>
      </div>
    </div>
  );

  const LoadingSkeleton = ({ count = 2 }) => (
    <div className="grid sm:grid-cols-2 gap-4">
      {Array.from({ length: count }).map((_, i) => (
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
  );

  return (
    <div className="min-h-screen bg-background pb-20 lg:pb-0">
      <Navigation user={user} />

      <main className="max-w-4xl mx-auto px-4 pt-20 lg:pt-24">
        <div className="mb-6">
          <h1 className="font-heading text-2xl sm:text-3xl font-bold text-foreground mb-1">Group Chats</h1>
          <p className="text-sm text-muted-foreground">Real-time chat — national, local, and friends</p>
        </div>

        {!hasLocation && <LocationPrompt />}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full bg-card border border-border/50 rounded-xl p-1 mb-6">
            <TabsTrigger
              value="village"
              className="flex-1 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              data-testid="tab-village"
            >
              🇦🇺 All Australia
            </TabsTrigger>
            <TabsTrigger
              value="local"
              className="flex-1 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              data-testid="tab-local"
            >
              Local
            </TabsTrigger>
            <TabsTrigger
              value="friends"
              className="flex-1 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              data-testid="tab-friends"
            >
              Friends
            </TabsTrigger>
          </TabsList>

          {/* ── Village Circles (All Australia) ── */}
          <TabsContent value="village" className="mt-0">
            {/* Night Owl banner — only on this tab */}
            {nightOwl && (
              <div className="mb-4 p-4 rounded-2xl bg-primary/10 border border-primary/20 flex items-center gap-3">
                <span className="text-2xl">🌙</span>
                <div>
                  <p className="text-sm font-medium text-foreground">Night Owl hours — you're not alone</p>
                  <p className="text-xs text-muted-foreground">The 3am Club is active right now. Join for late-night company.</p>
                </div>
              </div>
            )}
            {loading ? (
              <LoadingSkeleton count={4} />
            ) : allAustraliaRooms.length === 0 ? (
              <div className="text-center py-12 bg-card rounded-2xl border border-border/50">
                <span className="text-4xl mb-3 block">🇦🇺</span>
                <h3 className="font-heading font-semibold text-foreground mb-1">No rooms available</h3>
                <p className="text-muted-foreground">Check back soon!</p>
              </div>
            ) : (
              <>
                {/* Night Owl 3am Club feature */}
                {nightOwl && (() => {
                  const club = allAustraliaRooms.find(r => r.name?.toLowerCase().includes("3am"));
                  return club ? (
                    <Link to={`/chat/${club.room_id}`} className="block mb-4">
                      <div className="rounded-2xl p-5 bg-primary/10 border border-primary/30 hover:border-primary/50 transition-all card-hover flex items-center gap-4">
                        <div className="w-14 h-14 rounded-xl bg-primary/20 flex items-center justify-center text-3xl shrink-0">🌙</div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="text-xs font-semibold uppercase tracking-wide text-primary">Active now · Night Owl hours</span>
                          </div>
                          <h3 className="font-heading font-bold text-foreground">{club.name}</h3>
                          <p className="text-sm text-muted-foreground">{club.description}</p>
                        </div>
                      </div>
                    </Link>
                  ) : null;
                })()}

                {/* Featured: Mum Chat + Dad Chat — full-width when only one is visible */}
                {(() => {
                  const gender = user?.gender;
                  // Only show gender-specific featured rooms if gender is explicitly set
                  const mumChat = (gender === "female" || gender === "other" || gender === "prefer-not-say") ? allAustraliaRooms.find(r => r.name === "Mum Chat" || r.name === "Mum Circle") : null;
                  const dadChat = (gender === "male" || gender === "other" || gender === "prefer-not-say") ? allAustraliaRooms.find(r => r.name === "Dad Chat" || r.name === "Dad Circle") : null;
                  if (!mumChat && !dadChat) return null;
                  const isSingle = !mumChat || !dadChat; // only one card to show
                  return (
                    <div className={`grid gap-4 mb-4 ${isSingle ? "" : "sm:grid-cols-2"}`}>
                      {mumChat && (
                        <Link to={`/chat/${mumChat.room_id}`} className="block">
                          <div className="rounded-2xl p-5 bg-pink-500/8 dark:bg-pink-500/10 border border-pink-400/30 border-l-4 border-l-pink-400/60 hover:border-pink-400/50 hover:opacity-90 transition-all h-full card-hover">
                            <div className="flex items-start gap-4">
                              <div className="w-14 h-14 rounded-full bg-pink-500/20 flex items-center justify-center text-3xl flex-shrink-0">👩</div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1 flex-wrap">
                                  <h3 className="font-heading font-bold text-base text-foreground">{mumChat.name}</h3>
                                  <span className="text-xs font-semibold text-pink-500">Featured</span>
                                </div>
                                <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{mumChat.description}</p>
                                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                  <span className="flex items-center gap-1">
                                    <Users className="h-3.5 w-3.5" />{mumChat.active_users || 0} online
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </Link>
                      )}
                      {dadChat && (
                        <Link to={`/chat/${dadChat.room_id}`} className="block">
                          <div className="rounded-2xl p-5 bg-blue-500/8 dark:bg-blue-500/10 border border-blue-400/30 border-l-4 border-l-blue-400/60 hover:border-blue-400/50 hover:opacity-90 transition-all h-full card-hover">
                            <div className="flex items-start gap-4">
                              <div className="w-14 h-14 rounded-full bg-blue-500/20 flex items-center justify-center text-3xl flex-shrink-0">👨</div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1 flex-wrap">
                                  <h3 className="font-heading font-bold text-base text-foreground">{dadChat.name}</h3>
                                  <span className="text-xs font-semibold text-blue-500">Featured</span>
                                </div>
                                <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{dadChat.description}</p>
                                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                  <span className="flex items-center gap-1">
                                    <Users className="h-3.5 w-3.5" />{dadChat.active_users || 0} online
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </Link>
                      )}
                    </div>
                  );
                })()}

                <div className="grid sm:grid-cols-2 gap-4">
                  {allAustraliaRooms
                    .filter(r => {
                      const gender = user?.gender;
                      // Always exclude gender-specific featured rooms from main grid
                      if (["Mum Chat", "Mum Circle", "Dad Chat", "Dad Circle"].includes(r.name)) return false;
                      // During night owl hours, exclude 3am Club from grid (shown in featured highlight above)
                      if (nightOwl && r.name?.toLowerCase().includes("3am")) return false;
                      // Filter gender-restricted rooms — hide all if gender not set
                      if (r.gender_restriction) {
                        if (!gender) return false; // hide gender-restricted rooms until profile complete
                        if (gender === "male" && r.gender_restriction === "female") return false;
                        if (gender === "female" && r.gender_restriction === "male") return false;
                      }
                      return true;
                    })
                    .map((room, idx) => (
                      <RoomCard key={room.room_id} room={room} idx={idx} />
                    ))}
                </div>

                {/* 3am Club info — always visible in Village Circles, links to the room */}
                {(() => {
                  const club = allAustraliaRooms.find(r => r.name?.toLowerCase().includes("3am"));
                  const href = club ? `/chat/${club.room_id}` : "/chat";
                  return (
                    <Link to={href} className="block mt-4">
                      <div className="p-5 rounded-2xl bg-primary/5 border border-primary/20 hover:border-primary/40 hover:bg-primary/8 transition-colors flex items-start gap-4">
                        <span className="text-3xl shrink-0">🌙</span>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-heading font-bold text-foreground mb-1">The 3am Club</h3>
                          <p className="text-sm text-muted-foreground">
                            Most active 10pm–4am AEST — for those late-night feeds when you need company.
                            Active night owls earn the 🦉 Night Owl badge.
                          </p>
                        </div>
                        <span className="text-muted-foreground shrink-0 self-center text-lg">→</span>
                      </div>
                    </Link>
                  );
                })()}
              </>
            )}
          </TabsContent>

          {/* ── Local Circles (My Area + search) ── */}
          <TabsContent value="local" className="mt-0">
            {/* Search bar always visible in Local Circles */}
            <div className="mb-5">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  value={localSearch}
                  onChange={(e) => setLocalSearch(e.target.value)}
                  placeholder="Search by postcode or suburb..."
                  className="h-12 pl-12 rounded-xl bg-secondary/50 border-transparent focus:border-primary"
                  data-testid="local-search-input"
                />
              </div>
            </div>

            {localSearch.length >= 2 ? (
              /* Search mode */
              searching ? <LoadingSkeleton /> : (
                <div className="space-y-4">
                  {searchResults.length > 0 ? (
                    <div className="grid sm:grid-cols-2 gap-4">
                      {searchResults.map((room, idx) => (
                        <RoomCard key={room.room_id} room={room} idx={`search-${idx}`} showDistance />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 bg-card rounded-2xl border border-border/50">
                      <span className="text-4xl mb-3 block">📭</span>
                      <p className="text-muted-foreground">No active rooms found for "{localSearch}"</p>
                    </div>
                  )}
                  {searchCanCreate && searchPostcode && (
                    <div className="bg-primary/5 border border-primary/20 rounded-2xl p-6 text-center">
                      <p className="text-foreground mb-3">No room exists for postcode <strong>{searchPostcode}</strong></p>
                      <Button
                        onClick={() => createSuburbRoom(searchPostcode)}
                        disabled={creatingRoom}
                        className="rounded-full bg-primary text-primary-foreground"
                        data-testid="create-search-room"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        {creatingRoom ? "Creating..." : `Create Room for ${searchPostcode}`}
                      </Button>
                    </div>
                  )}
                </div>
              )
            ) : !hasLocation ? (
              <div className="text-center py-12 bg-card rounded-2xl border border-border/50">
                <span className="text-4xl mb-3 block">📍</span>
                <h3 className="font-heading font-semibold text-foreground mb-1">Location not set</h3>
                <p className="text-sm text-muted-foreground mb-4">Update your profile with your suburb, or search above for any area.</p>
                <Link to="/profile">
                  <Button className="rounded-full bg-primary text-primary-foreground">Set Location</Button>
                </Link>
              </div>
            ) : loading ? (
              <LoadingSkeleton />
            ) : (
              <div className="space-y-6">
                {hasLocation && (
                  <div className="p-3 rounded-xl bg-secondary/30 border border-border/30 flex items-center justify-between gap-3 flex-wrap">
                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                      <Compass className="h-4 w-4" />
                      Showing rooms within
                    </p>
                    <Select value={preferredReach} onValueChange={handleReachChange}>
                      <SelectTrigger className="w-[180px] h-9 rounded-lg bg-card border-border/50">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {DISTANCE_OPTIONS.map((opt) => (
                          <SelectItem key={opt.id} value={opt.id}>{opt.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {mySuburbRoom ? (
                  <div>
                    <h3 className="font-heading text-sm font-bold text-muted-foreground uppercase tracking-wide mb-3">Your Suburb</h3>
                    <RoomCard room={mySuburbRoom} idx="my-suburb" />
                  </div>
                ) : userPostcode ? (
                  <div className="bg-card rounded-2xl p-6 border border-border/50 text-center">
                    <span className="text-4xl mb-3 block">🏘️</span>
                    <h3 className="font-heading text-lg font-bold text-foreground mb-2">
                      No room for {userSuburb || userPostcode} yet
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4">Be the first to start chatting in your area!</p>
                    <Button
                      onClick={() => createSuburbRoom(userPostcode, userSuburb)}
                      disabled={creatingRoom}
                      className="rounded-full bg-primary text-primary-foreground"
                      data-testid="create-my-suburb-room"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      {creatingRoom ? "Creating..." : `Start ${userSuburb || userPostcode} Room`}
                    </Button>
                  </div>
                ) : null}

                {nearbyRooms.length > 0 && (
                  <div>
                    <h3 className="font-heading text-sm font-bold text-muted-foreground uppercase tracking-wide mb-3">Nearby</h3>
                    <div className="grid sm:grid-cols-2 gap-4">
                      {nearbyRooms.map((room, idx) => (
                        <RoomCard key={room.room_id} room={room} idx={idx} showDistance />
                      ))}
                    </div>
                  </div>
                )}

                {!mySuburbRoom && nearbyRooms.length === 0 && !userPostcode && (
                  <div className="text-center py-12 bg-card rounded-2xl border border-border/50">
                    <span className="text-4xl mb-3 block">🔍</span>
                    <h3 className="font-heading font-semibold text-foreground mb-1">No nearby rooms yet</h3>
                    <p className="text-sm text-muted-foreground mb-4">Try expanding your reach above, or search for a suburb.</p>
                  </div>
                )}
              </div>
            )}
          </TabsContent>

          {/* ── Friends ── */}
          <TabsContent value="friends" className="mt-0">
            {friendsLoading ? (
              <LoadingSkeleton />
            ) : friends.length === 0 ? (
              <div className="text-center py-12 bg-card rounded-2xl border border-border/50">
                <span className="text-4xl mb-3 block">💛</span>
                <h3 className="font-heading font-semibold text-foreground mb-1">No friends yet</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Connect with parents in Spaces first, then start a private chat here.
                </p>
                <Link to="/friends">
                  <Button className="rounded-full bg-primary text-primary-foreground">Find friends</Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground mb-4">Start a private real-time chat with any of your friends.</p>
                {friends.map((friend) => (
                  <div key={friend.user_id} className="bg-card rounded-2xl p-4 border border-border/50 flex items-center gap-4">
                    <div className="relative shrink-0">
                      <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-lg font-semibold text-primary overflow-hidden">
                        {friend.picture ? (
                          <img src={friend.picture} alt="" className="w-full h-full object-cover" />
                        ) : (
                          (friend.nickname || friend.name)?.[0]?.toUpperCase()
                        )}
                      </div>
                      <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-card ${
                        friend.is_online ? "bg-green-500" : "bg-muted-foreground/40"
                      }`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground truncate">{friend.nickname || friend.name}</p>
                      <p className={`text-xs ${friend.is_online ? "text-green-500" : "text-muted-foreground"}`}>
                        {friend.is_online ? "Active now" : "Offline"}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => openFriendChat(friend.user_id)}
                      disabled={openingChat[friend.user_id]}
                      className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90 shrink-0"
                      data-testid={`open-chat-${friend.user_id}`}
                    >
                      <MessagesSquare className="h-4 w-4 mr-2" />
                      {openingChat[friend.user_id] ? "Opening..." : "Chat"}
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

      </main>
      <AppFooter />
    </div>
  );
}
