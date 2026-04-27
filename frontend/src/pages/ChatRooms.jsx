import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import Navigation from "../components/Navigation";
import AppFooter from "../components/AppFooter";
import { toast } from "sonner";
import { Users, MapPin, Compass, Search, Plus } from "lucide-react";
import LocationButton from "../components/LocationButton";

const API_URL = process.env.REACT_APP_BACKEND_URL;

const DISTANCE_OPTIONS = [
  { id: "2km", label: "Super Local (2km)" },
  { id: "5km", label: "Local (5km)" },
  { id: "10km", label: "Nearby (10km)" },
  { id: "25km", label: "25km" },
  { id: "50km", label: "50km" },
  { id: "100km", label: "100km" },
];

function getAESTHour() {
  const now = new Date();
  const aestMs = now.getTime() + 10 * 60 * 60 * 1000;
  return new Date(aestMs).getUTCHours();
}

function isNightOwlTime() {
  const h = getAESTHour();
  return h >= 22 || h < 4;
}

const FILTERS = [
  { id: "all",   label: "All" },
  { id: "live",  label: "Live now" },
  { id: "local", label: "Local" },
];

export default function ChatRooms({ user }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [mySuburbRoom, setMySuburbRoom]       = useState(null);
  const [nearbyRooms, setNearbyRooms]         = useState([]);
  const [allAustraliaRooms, setAllAustraliaRooms] = useState([]);
  const [userSuburb, setUserSuburb]           = useState("");
  const [userPostcode, setUserPostcode]       = useState("");
  const [preferredReach, setPreferredReach]   = useState(user?.preferred_reach || "25km");
  const [hasLocation, setHasLocation]         = useState(false);
  const [loading, setLoading]                 = useState(true);
  const [creatingRoom, setCreatingRoom]       = useState(false);

  // Filter chip state — "all" | "live" | "local"
  const [activeFilter, setActiveFilter] = useState(() => {
    const t = searchParams.get("tab");
    if (t === "local") return "local";
    if (t === "live")  return "live";
    return "all";
  });

  // Live gender — updates instantly when profile is saved
  const [liveGender, setLiveGender] = useState(user?.gender);

  // Local search state
  const [localSearch, setLocalSearch]         = useState("");
  const [searchResults, setSearchResults]     = useState([]);
  const [searchCanCreate, setSearchCanCreate] = useState(false);
  const [searchPostcode, setSearchPostcode]   = useState(null);
  const [searching, setSearching]             = useState(false);

  const nightOwl = isNightOwlTime();

  useEffect(() => {
    fetchRooms();
    const handleProfileUpdate = (e) => {
      if (e.detail?.gender !== undefined) setLiveGender(e.detail.gender);
    };
    window.addEventListener("village:profileUpdated", handleProfileUpdate);
    return () => window.removeEventListener("village:profileUpdated", handleProfileUpdate);
  }, []);

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
        // Deduplicate by name (catches legacy duplicate DB entries)
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
    } catch {
      toast.error("Something went wrong");
    } finally {
      setCreatingRoom(false);
    }
  };

  const saveLocation = async ({ suburb, postcode, state, latitude, longitude }) => {
    try {
      const res = await fetch(`${API_URL}/api/users/profile`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ suburb, postcode, state, latitude, longitude, location: suburb }),
      });
      if (res.ok) {
        setUserSuburb(suburb);
        setUserPostcode(postcode);
        setHasLocation(true);
        toast.success(`Location set to ${suburb || postcode}!`);
        fetchRooms();
      } else {
        toast.error("Couldn't save location — please update your profile.");
      }
    } catch {
      toast.error("Couldn't save location — please update your profile.");
    }
  };

  // Debounced search within Local filter
  useEffect(() => {
    if (activeFilter !== "local" || localSearch.length < 2) {
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
  }, [localSearch, activeFilter]);

  // Rooms with active users — for "Live now" filter
  const liveRooms = [...allAustraliaRooms, ...nearbyRooms]
    .filter(r => (r.active_users || 0) > 0)
    .sort((a, b) => (b.active_users || 0) - (a.active_users || 0));

  // ── Sub-components ────────────────────────────────────────────

  const RoomCard = ({ room, idx, showDistance = false }) => (
    <Link to={`/chat/${room.room_id}`} className="block" data-testid={`room-card-${idx}`}>
      <div className="village-card village-card-hover p-4 border-l-2 border-l-primary/20 h-full">
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-2xl flex-shrink-0">
            {room.icon}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                  <h3 className="font-heading font-bold text-base text-foreground">{room.name}</h3>
                  {showDistance && room.distance_km !== undefined && (
                    <span className="text-xs px-1.5 py-0.5 rounded-full bg-green-500/20 text-green-600 dark:text-green-400 flex items-center gap-1">
                      <MapPin className="h-2.5 w-2.5" />{room.distance_km}km
                    </span>
                  )}
                  {room.postcode && (
                    <span className="text-xs px-1.5 py-0.5 rounded-full bg-secondary text-muted-foreground">{room.postcode}</span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{room.description}</p>
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Users className="h-3.5 w-3.5" />{room.active_users || 0} online
                </span>
              </div>
              <span className={`shrink-0 text-xs font-medium px-2.5 py-1 rounded-full whitespace-nowrap mt-0.5 ${
                (room.active_users || 0) > 0
                  ? "bg-green-500/15 text-green-700 dark:text-green-400"
                  : "bg-primary/10 text-primary"
              }`}>
                {(room.active_users || 0) > 0 ? "Drop in" : "Open"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );

  const LoadingSkeleton = ({ count = 2 }) => (
    <div className="grid sm:grid-cols-2 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="village-card p-4 animate-pulse">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-xl bg-muted" />
            <div className="flex-1 space-y-2">
              <div className="w-3/4 h-4 bg-muted rounded" />
              <div className="w-full h-3 bg-muted rounded" />
              <div className="w-1/3 h-3 bg-muted rounded" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  // ── Featured gender-specific card (Mum Chat / Dad Chat) ──────

  const FeaturedGenderCard = ({ room, gender }) => {
    const isMum = gender === "female";
    const colorBg    = isMum ? "bg-pink-500/8 dark:bg-pink-500/10" : "bg-blue-500/8 dark:bg-blue-500/10";
    const colorBorder = isMum ? "border-pink-400/30 border-l-4 border-l-pink-400/60 hover:border-pink-400/50" : "border-blue-400/30 border-l-4 border-l-blue-400/60 hover:border-blue-400/50";
    const colorLabel  = isMum ? "text-pink-500" : "text-blue-500";
    const dropInBg    = isMum ? "bg-pink-500/10 text-pink-600" : "bg-blue-500/10 text-blue-600";
    const emoji       = isMum ? "👩" : "👨";
    const avatarBg    = isMum ? "bg-pink-500/20" : "bg-blue-500/20";

    return (
      <Link to={`/chat/${room.room_id}`} className="block">
        <div className={`rounded-[18px] p-4 ${colorBg} border ${colorBorder} hover:opacity-90 village-card-hover h-full`}>
          <div className="flex items-start gap-3">
            <div className={`w-12 h-12 rounded-full ${avatarBg} flex items-center justify-center text-2xl flex-shrink-0`}>{emoji}</div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <h3 className="font-heading font-bold text-base text-foreground">{room.name}</h3>
                    <span className={`text-xs font-semibold ${colorLabel}`}>Featured</span>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{room.description}</p>
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Users className="h-3.5 w-3.5" />{room.active_users || 0} online
                  </span>
                </div>
                <span className={`shrink-0 text-xs font-medium px-2.5 py-1 rounded-full whitespace-nowrap mt-0.5 ${
                  (room.active_users || 0) > 0 ? "bg-green-500/15 text-green-700 dark:text-green-400" : dropInBg
                }`}>
                  {(room.active_users || 0) > 0 ? "Drop in" : "Open"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </Link>
    );
  };

  // ── Render ────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-background pb-20 lg:pl-60 lg:pb-0">
      <Navigation user={user} />

      <main className="max-w-5xl mx-auto px-4 pt-16 lg:pt-8">

        {/* Header */}
        <div className="mb-6">
          <h1 className="font-heading text-2xl sm:text-3xl font-bold text-foreground mb-1">Drop in. Chat live.</h1>
          <p className="text-sm text-muted-foreground">Real-time chat rooms for parents who need company right now. National rooms, Local rooms.</p>
        </div>

        <div className="grid lg:grid-cols-[1fr_272px] gap-8">

          {/* ── Main content ────────────────────────── */}
          <div className="min-w-0 space-y-6">

            {/* Filter chips */}
            <div className="flex items-center gap-2 flex-wrap">
              {FILTERS.map(f => (
                <button
                  key={f.id}
                  onClick={() => setActiveFilter(f.id)}
                  data-testid={`filter-${f.id}`}
                  className={`inline-flex items-center gap-1.5 h-8 px-4 rounded-full text-sm font-medium transition-colors ${
                    activeFilter === f.id
                      ? "bg-primary text-primary-foreground"
                      : "bg-card border border-border/50 text-muted-foreground hover:text-foreground hover:border-primary/30"
                  }`}
                >
                  {f.id === "live" && (
                    <span className={`w-1.5 h-1.5 rounded-full ${activeFilter === "live" ? "bg-green-400" : "bg-green-500"} animate-pulse`} />
                  )}
                  {f.label}
                </button>
              ))}
            </div>

            {/* Night Owl banner */}
            {nightOwl && (activeFilter === "all" || activeFilter === "live") && (
              <div className="p-4 rounded-[18px] bg-primary/10 border border-primary/20 flex items-center gap-3">
                <span className="text-2xl">🌙</span>
                <div>
                  <p className="text-sm font-medium text-foreground">Night Owl hours — you're not alone</p>
                  <p className="text-xs text-muted-foreground">The 3am Club is active right now. Join for late-night company.</p>
                </div>
              </div>
            )}

            {/* ── Live now ── */}
            {(activeFilter === "all" || activeFilter === "live") && (
              loading ? <LoadingSkeleton count={2} /> :
              liveRooms.length > 0 ? (
                <section>
                  <h2 className="font-heading text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                    Live now
                  </h2>
                  <div className="grid sm:grid-cols-2 gap-4">
                    {liveRooms.slice(0, 6).map((room, idx) => (
                      <RoomCard key={room.room_id} room={room} idx={`live-${idx}`} />
                    ))}
                  </div>
                </section>
              ) : activeFilter === "live" ? (
                <div className="text-center py-12 village-card">
                  <span className="text-4xl mb-3 block">💬</span>
                  <h3 className="font-heading font-semibold text-foreground mb-1">No rooms live right now</h3>
                  <p className="text-sm text-muted-foreground">Most rooms are active evenings and weekends. Check back soon!</p>
                </div>
              ) : null
            )}

            {/* ── All Australia ── */}
            {activeFilter === "all" && (
              <section>
                <h2 className="font-heading text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">All Australia</h2>
                {loading ? (
                  <LoadingSkeleton count={4} />
                ) : allAustraliaRooms.length === 0 ? (
                  <div className="text-center py-12 village-card">
                    <span className="text-4xl mb-3 block">🇦🇺</span>
                    <h3 className="font-heading font-semibold text-foreground mb-1">No rooms available</h3>
                    <p className="text-sm text-muted-foreground">Check back soon!</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Featured gender-specific rooms */}
                    {(() => {
                      const mumChat = liveGender === "female"
                        ? allAustraliaRooms.find(r => r.name === "Mum Chat" || r.name === "Mum Circle")
                        : null;
                      const dadChat = liveGender === "male"
                        ? allAustraliaRooms.find(r => r.name === "Dad Chat" || r.name === "Dad Circle")
                        : null;
                      if (!mumChat && !dadChat) return null;
                      const isSingle = !mumChat || !dadChat;
                      return (
                        <div className={`grid gap-4 ${isSingle ? "" : "sm:grid-cols-2"}`}>
                          {mumChat && <FeaturedGenderCard room={mumChat} gender="female" />}
                          {dadChat  && <FeaturedGenderCard room={dadChat}  gender="male"   />}
                        </div>
                      );
                    })()}

                    {/* Night Owl 3am Club highlight */}
                    {nightOwl && (() => {
                      const club = allAustraliaRooms.find(r => r.name?.toLowerCase().includes("3am"));
                      return club ? (
                        <Link to={`/chat/${club.room_id}`} className="block">
                          <div className="rounded-[18px] p-4 bg-primary/10 border border-primary/30 hover:border-primary/50 village-card-hover flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center text-2xl shrink-0">🌙</div>
                            <div className="flex-1 min-w-0">
                              <span className="text-xs font-semibold uppercase tracking-wide text-primary block mb-0.5">Active now · Night Owl hours</span>
                              <h3 className="font-heading font-bold text-foreground">{club.name}</h3>
                              <p className="text-xs text-muted-foreground">{club.description}</p>
                            </div>
                            <span className="shrink-0 text-xs font-medium px-2.5 py-1 rounded-full bg-green-500/15 text-green-700 dark:text-green-400">Drop in</span>
                          </div>
                        </Link>
                      ) : null;
                    })()}

                    {/* Main grid — filter gender-restricted + featured rooms */}
                    <div className="grid sm:grid-cols-2 gap-4">
                      {allAustraliaRooms
                        .filter(r => {
                          if (["Mum Chat", "Mum Circle", "Dad Chat", "Dad Circle"].includes(r.name)) return false;
                          if (nightOwl && r.name?.toLowerCase().includes("3am")) return false;
                          if (r.gender_restriction) {
                            if (liveGender !== "female" && r.gender_restriction === "female") return false;
                            if (liveGender !== "male"   && r.gender_restriction === "male")   return false;
                          }
                          return true;
                        })
                        .map((room, idx) => (
                          <RoomCard key={room.room_id} room={room} idx={idx} />
                        ))}
                    </div>

                    {/* 3am Club promo — always visible */}
                    {(() => {
                      const club = allAustraliaRooms.find(r => r.name?.toLowerCase().includes("3am"));
                      const href = club ? `/chat/${club.room_id}` : "/chat";
                      return (
                        <Link to={href} className="block">
                          <div className="p-4 rounded-[18px] bg-primary/5 border border-primary/20 hover:border-primary/40 village-card-hover flex items-start gap-4">
                            <span className="text-2xl shrink-0">🌙</span>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-heading font-bold text-foreground mb-0.5">The 3am Club</h3>
                              <p className="text-xs text-muted-foreground">Most active 10pm–4am AEST — for those late-night feeds when you need company. Active night owls earn the 🦉 Night Owl badge.</p>
                            </div>
                            <span className="text-muted-foreground shrink-0 self-center">→</span>
                          </div>
                        </Link>
                      );
                    })()}
                  </div>
                )}
              </section>
            )}

            {/* ── Local rooms ── */}
            {(activeFilter === "all" || activeFilter === "local") && (
              <section>
                <h2 className="font-heading text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">Local Rooms</h2>

                {/* Search bar */}
                <div className="mb-4 relative">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={localSearch}
                    onChange={(e) => setLocalSearch(e.target.value)}
                    placeholder="Search by postcode or suburb..."
                    className="h-10 pl-10 rounded-xl bg-secondary/50 border-transparent focus:border-primary"
                    data-testid="local-search-input"
                  />
                </div>

                {localSearch.length >= 2 ? (
                  /* Search results mode */
                  searching ? <LoadingSkeleton /> : (
                    <div className="space-y-4">
                      {searchResults.length > 0 ? (
                        <div className="grid sm:grid-cols-2 gap-4">
                          {searchResults.map((room, idx) => (
                            <RoomCard key={room.room_id} room={room} idx={`search-${idx}`} showDistance />
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8 village-card">
                          <span className="text-4xl mb-3 block">📭</span>
                          <p className="text-sm text-muted-foreground">No rooms found for "{localSearch}"</p>
                        </div>
                      )}
                      {searchCanCreate && searchPostcode && (
                        <div className="bg-primary/5 border border-primary/20 rounded-[18px] p-5 text-center">
                          <p className="text-sm text-foreground mb-3">No room exists for <strong>{searchPostcode}</strong> yet</p>
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
                  /* No location set */
                  <div className="text-center py-10 village-card">
                    <span className="text-4xl mb-3 block">📍</span>
                    <h3 className="font-heading font-semibold text-foreground mb-1">Create or Search for a Local room</h3>
                    <p className="text-sm text-muted-foreground mb-4">Set your location to see nearby rooms, or search above for any suburb or postcode.</p>
                    <div className="flex flex-wrap gap-2 justify-center">
                      <LocationButton onLocation={saveLocation} size="default" />
                      <Link to="/profile">
                        <Button variant="outline" className="rounded-full border-border/50">Set Manually</Button>
                      </Link>
                    </div>
                  </div>
                ) : loading ? (
                  <LoadingSkeleton />
                ) : (
                  <div className="space-y-5">
                    {/* Distance selector */}
                    <div className="p-3 rounded-xl bg-secondary/30 border border-border/30 flex items-center justify-between gap-3 flex-wrap">
                      <p className="text-sm text-muted-foreground flex items-center gap-2">
                        <Compass className="h-4 w-4" />Showing rooms within
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

                    {/* My suburb room */}
                    {mySuburbRoom ? (
                      <div>
                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2">Your Suburb</p>
                        <RoomCard room={mySuburbRoom} idx="my-suburb" />
                      </div>
                    ) : userPostcode ? (
                      <div className="village-card p-5 text-center">
                        <span className="text-4xl mb-3 block">🏘️</span>
                        <h3 className="font-heading text-base font-bold text-foreground mb-1">
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

                    {/* Nearby rooms */}
                    {nearbyRooms.length > 0 && (
                      <div>
                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2">Nearby</p>
                        <div className="grid sm:grid-cols-2 gap-4">
                          {nearbyRooms.map((room, idx) => (
                            <RoomCard key={room.room_id} room={room} idx={idx} showDistance />
                          ))}
                        </div>
                      </div>
                    )}

                    {!mySuburbRoom && nearbyRooms.length === 0 && !userPostcode && (
                      <div className="text-center py-10 village-card">
                        <span className="text-4xl mb-3 block">🔍</span>
                        <h3 className="font-heading font-semibold text-foreground mb-1">Create or Search for a Local room</h3>
                        <p className="text-sm text-muted-foreground">Try expanding your reach above, or search for a suburb.</p>
                      </div>
                    )}
                  </div>
                )}
              </section>
            )}

          </div>

          {/* ── Sidebar ─────────────────────────────── */}
          <aside className="hidden lg:block space-y-4 self-start sticky top-8">
            <div className="village-card p-5">
              <h3 className="font-heading font-semibold text-foreground mb-3">How chat works</h3>
              <div className="space-y-3 text-sm text-muted-foreground leading-relaxed">
                <p><strong className="text-foreground font-medium">National rooms</strong> are always open — busiest in the evenings.</p>
                <p><strong className="text-foreground font-medium">Local rooms</strong> are suburb-based — only parents near you.</p>
                <p><strong className="text-foreground font-medium">Friends chats</strong> can be started from your <Link to="/friends" className="text-primary hover:underline">Friends page</Link>.</p>
              </div>
            </div>
            <div className="village-card p-5">
              <h3 className="font-heading font-semibold text-foreground mb-3">Quiet hours</h3>
              <div className="text-sm text-muted-foreground leading-relaxed space-y-2">
                <p>The 3am Club is most active 10pm–4am AEST.</p>
                <p>Mute notifications in <Link to="/settings" className="text-primary hover:underline">Settings</Link>.</p>
              </div>
            </div>
          </aside>

        </div>
        <AppFooter />
      </main>
    </div>
  );
}
