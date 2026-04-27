import { useState, useEffect, useRef, useCallback } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "../components/ui/button";
import Navigation from "../components/Navigation";
import AppFooter from "../components/AppFooter";
import { Crown, Plus, Tag, ArrowLeftRight, Heart, Search as SearchIcon, MapPin, Clock, Bookmark, BookmarkCheck, ShoppingBag, Users, Filter, X, MessageCircle, Send, ArrowLeft } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { parseApiError } from "../utils/apiError";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";

const API_URL = process.env.REACT_APP_BACKEND_URL;

const LISTING_TYPES = [
  { id: "all",       label: "All",          icon: ShoppingBag,   color: "text-foreground" },
  { id: "sell",      label: "Selling",      icon: Tag,           color: "text-emerald-600 dark:text-emerald-400" },
  { id: "swap",      label: "Swapping",     icon: ArrowLeftRight, color: "text-sky-600 dark:text-sky-400" },
  { id: "give_away", label: "Giving Away",  icon: Heart,         color: "text-amber-600 dark:text-amber-400" },
  { id: "wanted",    label: "Wanted",       icon: SearchIcon,    color: "text-violet-600 dark:text-violet-400" },
];

const CATEGORIES = [
  { id: "clothing",  label: "Clothing" },
  { id: "gear",      label: "Gear & Equipment" },
  { id: "toys",      label: "Toys" },
  { id: "books",     label: "Books" },
  { id: "furniture", label: "Furniture" },
  { id: "feeding",   label: "Feeding" },
  { id: "safety",    label: "Safety" },
  { id: "other",     label: "Other" },
];

const TYPE_STYLES = {
  sell:      "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  swap:      "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20",
  give_away: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
  wanted:    "bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20",
};

const TYPE_LABELS = { sell: "Selling", swap: "Swapping", give_away: "Giving Away", wanted: "Wanted" };

const fmtTime = (d) => { try { return formatDistanceToNow(new Date(d), { addSuffix: true }); } catch { return ""; } };

// ── ListingCard ───────────────────────────────────────────────────────────────

function ListingCard({ listing, onSaveToggle, savedIds }) {
  const navigate  = useNavigate();
  const isSaved   = savedIds.has(listing.listing_id);
  const firstImage = listing.images?.[0];

  const handleSave = async (e) => {
    e.stopPropagation();
    await onSaveToggle(listing.listing_id);
  };

  return (
    <article
      onClick={() => navigate(`/stall/listing/${listing.listing_id}`)}
      className="village-card village-card-hover overflow-hidden flex flex-col"
    >
      <div className="relative aspect-[4/3] bg-secondary/40 shrink-0">
        {firstImage ? (
          <img src={firstImage} alt={listing.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground/30">
            <ShoppingBag className="h-10 w-10" />
          </div>
        )}
        <span className={`absolute top-2 left-2 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${TYPE_STYLES[listing.listing_type] || ""}`}>
          {TYPE_LABELS[listing.listing_type] || listing.listing_type}
        </span>
        <button
          onClick={handleSave}
          className="absolute top-2 right-2 w-7 h-7 rounded-full bg-card/80 backdrop-blur-sm flex items-center justify-center hover:bg-card transition-colors"
        >
          {isSaved
            ? <BookmarkCheck className="h-3.5 w-3.5 text-primary" />
            : <Bookmark className="h-3.5 w-3.5 text-muted-foreground" />}
        </button>
      </div>

      <div className="p-3 flex flex-col gap-1.5 flex-1">
        <h3 className="font-heading font-bold text-[14px] leading-snug line-clamp-2 text-foreground">
          {listing.title}
        </h3>
        <p className="text-base font-bold text-foreground">
          {listing.listing_type === "give_away" && <span className="text-amber-600 dark:text-amber-400">Free</span>}
          {listing.listing_type === "sell" && (
            listing.make_offer ? <span className="text-emerald-600 dark:text-emerald-400">Make an offer</span>
              : listing.price != null ? <span className="text-emerald-600 dark:text-emerald-400">${listing.price.toFixed(0)}</span>
              : <span className="text-muted-foreground text-sm">POA</span>
          )}
          {listing.listing_type === "swap" && <span className="text-sky-600 dark:text-sky-400">Swap</span>}
          {listing.listing_type === "wanted" && <span className="text-violet-600 dark:text-violet-400">Wanted</span>}
        </p>
        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground mt-auto">
          {listing.suburb && (
            <span className="flex items-center gap-0.5 truncate">
              <MapPin className="h-3 w-3 shrink-0" />
              {listing.distance_km != null ? `${listing.distance_km}km` : listing.suburb}
            </span>
          )}
          <span className="ml-auto shrink-0 flex items-center gap-0.5">
            <Clock className="h-3 w-3" />
            {fmtTime(listing.created_at)}
          </span>
        </div>
      </div>
    </article>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function Stall({ user }) {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const isAdmin   = user?.role === "admin" || user?.role === "moderator";
  const isPremium = user?.subscription_tier === "premium" || user?.subscription_tier === "trial" || isAdmin;

  const [activeType,     setActiveType]     = useState(searchParams.get("type") || "all");
  const [activeCategory, setActiveCategory] = useState(searchParams.get("category") || "");
  const [search,         setSearch]         = useState(searchParams.get("q") || "");
  const [searchInput,    setSearchInput]    = useState(search);
  const [listings,       setListings]       = useState([]);
  const [total,          setTotal]          = useState(0);
  const [loading,        setLoading]        = useState(true);
  const [savedIds,       setSavedIds]       = useState(new Set());
  const [showFilters,    setShowFilters]    = useState(false);
  const [activeTab,      setActiveTab]      = useState(searchParams.get("tab") || "browse");
  const [unreadMsgCount, setUnreadMsgCount] = useState(0);

  const fetchListings = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: "24", sort: "newest" });
      if (activeType !== "all") params.set("listing_type", activeType);
      if (activeCategory) params.set("category", activeCategory);
      if (search) params.set("search", search);
      if (user?.latitude && user?.longitude) {
        params.set("lat", user.latitude);
        params.set("lon", user.longitude);
        params.set("distance_km", "50");
        params.set("sort", "nearest");
      }
      const res = await fetch(`${API_URL}/api/stall/listings?${params}`, { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setListings(data.listings || data);
        setTotal(data.total || 0);
      }
    } catch {}
    finally { setLoading(false); }
  }, [activeType, activeCategory, search, user?.latitude, user?.longitude]);

  const fetchSaved = useCallback(async () => {
    if (!isPremium) return;
    try {
      const res = await fetch(`${API_URL}/api/stall/listings/saved`, { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setSavedIds(new Set(data.map(l => l.listing_id)));
      }
    } catch {}
  }, [isPremium]);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/stall/messages/unread-count`, { credentials: "include" });
      if (res.ok) { const d = await res.json(); setUnreadMsgCount(d.count || 0); }
    } catch {}
  }, []);

  useEffect(() => {
    fetchListings();
    fetchSaved();
    fetchUnreadCount();
  }, [fetchListings, fetchSaved, fetchUnreadCount]);

  // Refresh unread count when switching to messages tab
  useEffect(() => {
    if (activeTab === "messages") fetchUnreadCount();
  }, [activeTab, fetchUnreadCount]);

  const handleSaveToggle = async (listingId) => {
    if (!isPremium) { navigate("/plus"); return; }
    try {
      const res = await fetch(`${API_URL}/api/stall/listings/${listingId}/save`, { method: "POST", credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setSavedIds(prev => {
          const next = new Set(prev);
          if (data.saved) next.add(listingId); else next.delete(listingId);
          return next;
        });
      }
    } catch {}
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setSearch(searchInput);
  };

  // Free user gate
  if (!isPremium) {
    return (
      <div className="min-h-screen bg-background pb-20 lg:pl-60 lg:pb-0">
        <Navigation user={user} />
        <main className="max-w-2xl mx-auto px-4 pt-16 lg:pt-8 pb-16 flex flex-col items-center text-center gap-6 py-20">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
            <ShoppingBag className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h1 className="font-heading text-2xl font-bold text-foreground mb-2">The Village Stall</h1>
            <p className="text-muted-foreground leading-relaxed max-w-sm mx-auto">
              Buy, swap, give away, and find baby gear from local parents. A Village+ exclusive feature.
            </p>
          </div>
          <Button className="rounded-full shadow-lg shadow-primary/25" onClick={() => navigate("/plus")}>
            <Crown className="h-4 w-4 mr-2" />
            Unlock with Village+
          </Button>
          <p className="text-xs text-muted-foreground">From $7.99/month</p>
        </main>
        <AppFooter />
      </div>
    );
  }

  const TABS = [
    { id: "browse",   label: "Browse" },
    { id: "groups",   label: "Donation Groups" },
    { id: "saved",    label: "Saved" },
    { id: "my",       label: "My Listings" },
    { id: "messages", label: "Messages", badge: unreadMsgCount },
  ];

  return (
    <div className="min-h-screen bg-background pb-20 lg:pl-60 lg:pb-0">
      <Navigation user={user} />

      <main className="max-w-5xl mx-auto px-4 pt-16 lg:pt-8 pb-16">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 mt-2">
          <div>
            <h1 className="font-heading text-2xl font-bold text-foreground flex items-center gap-2">
              <ShoppingBag className="h-6 w-6 text-primary" />
              The Village Stall
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">Buy, swap, give away — local parenting gear</p>
          </div>
          <Button className="rounded-full shadow-sm shadow-primary/20" onClick={() => navigate("/stall/new")}>
            <Plus className="h-4 w-4 mr-1.5" />
            Post a listing
          </Button>
        </div>

        {/* Tab bar */}
        <div className="flex items-center gap-1 mb-5 border-b border-border/40 overflow-x-auto scrollbar-none pb-0">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px whitespace-nowrap shrink-0 ${
                activeTab === tab.id
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
              {tab.badge > 0 && (
                <span className="w-4 h-4 rounded-full bg-primary text-primary-foreground text-[9px] flex items-center justify-center font-bold">
                  {tab.badge > 9 ? "9+" : tab.badge}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Browse tab */}
        {activeTab === "browse" && (
          <>
            {/* Search + filter bar */}
            <div className="flex gap-2 mb-4">
              <form onSubmit={handleSearch} className="flex-1 flex items-center gap-2 bg-card border border-border/50 rounded-full px-4 py-2">
                <SearchIcon className="h-4 w-4 text-muted-foreground shrink-0" />
                <input
                  value={searchInput}
                  onChange={e => setSearchInput(e.target.value)}
                  placeholder="Search listings…"
                  className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
                />
                {searchInput && (
                  <button type="button" onClick={() => { setSearchInput(""); setSearch(""); }}>
                    <X className="h-3.5 w-3.5 text-muted-foreground" />
                  </button>
                )}
              </form>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-full border text-sm font-medium transition-colors ${
                  showFilters || activeCategory
                    ? "bg-primary/10 border-primary/30 text-primary"
                    : "bg-card border-border/50 text-muted-foreground hover:text-foreground"
                }`}
              >
                <Filter className="h-4 w-4" />
                Filter
              </button>
            </div>

            {/* Type pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 mb-4 scrollbar-none">
              {LISTING_TYPES.map(t => (
                <button
                  key={t.id}
                  onClick={() => setActiveType(t.id)}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium border whitespace-nowrap transition-colors ${
                    activeType === t.id
                      ? "bg-primary/10 border-primary/30 text-primary"
                      : "bg-card border-border/50 text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <t.icon className="h-3.5 w-3.5" />
                  {t.label}
                </button>
              ))}
            </div>

            {/* Category filter */}
            {showFilters && (
              <div className="flex flex-wrap gap-2 mb-4 p-3 village-card">
                <button
                  onClick={() => setActiveCategory("")}
                  className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                    !activeCategory ? "bg-primary/10 border-primary/30 text-primary" : "border-border/50 text-muted-foreground hover:text-foreground"
                  }`}
                >
                  All categories
                </button>
                {CATEGORIES.map(c => (
                  <button
                    key={c.id}
                    onClick={() => setActiveCategory(activeCategory === c.id ? "" : c.id)}
                    className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                      activeCategory === c.id ? "bg-primary/10 border-primary/30 text-primary" : "border-border/50 text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            )}

            {/* Grid */}
            {loading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="village-card overflow-hidden animate-pulse">
                    <div className="aspect-[4/3] bg-secondary/50" />
                    <div className="p-3 space-y-2">
                      <div className="h-4 bg-secondary/50 rounded w-3/4" />
                      <div className="h-3 bg-secondary/50 rounded w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : listings.length === 0 ? (
              <div className="text-center py-16">
                <ShoppingBag className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                <p className="font-heading font-semibold text-foreground text-sm mb-1">No listings yet</p>
                <p className="text-xs text-muted-foreground mb-4">Be the first to post something in your area.</p>
                <Button variant="outline" className="rounded-full" onClick={() => navigate("/stall/new")}>
                  Post a listing
                </Button>
              </div>
            ) : (
              <>
                <p className="text-xs text-muted-foreground mb-3">{total} listing{total !== 1 ? "s" : ""}</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {listings.map(l => (
                    <ListingCard key={l.listing_id} listing={l} onSaveToggle={handleSaveToggle} savedIds={savedIds} />
                  ))}
                </div>
              </>
            )}
          </>
        )}

        {/* Donation Groups tab */}
        {activeTab === "groups" && <DonationGroupsTab user={user} navigate={navigate} />}

        {/* Saved tab */}
        {activeTab === "saved" && <SavedTab user={user} navigate={navigate} onSaveToggle={handleSaveToggle} savedIds={savedIds} />}

        {/* My Listings tab */}
        {activeTab === "my" && <MyListingsTab user={user} navigate={navigate} />}

        {/* Messages tab */}
        {activeTab === "messages" && (
          <MessagesTab
            user={user}
            onUnreadChange={setUnreadMsgCount}
          />
        )}
      </main>

      <AppFooter />
    </div>
  );
}

// ── Donation Groups Tab ───────────────────────────────────────────────────────

function DonationGroupsTab({ user, navigate }) {
  const [groups,  setGroups]  = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const params = new URLSearchParams({ limit: "20" });
        if (user?.latitude && user?.longitude) {
          params.set("lat", user.latitude);
          params.set("lon", user.longitude);
        }
        const res = await fetch(`${API_URL}/api/stall/groups?${params}`, { credentials: "include" });
        if (res.ok) { const data = await res.json(); setGroups(data.groups || []); }
      } catch {}
      finally { setLoading(false); }
    })();
  }, [user]);

  const GROUP_CATEGORY_COLORS = {
    clothing:  "bg-pink-500/10 text-pink-600",
    equipment: "bg-sky-500/10 text-sky-600",
    food:      "bg-orange-500/10 text-orange-600",
    books:     "bg-violet-500/10 text-violet-600",
    general:   "bg-secondary text-muted-foreground",
  };

  if (loading) return (
    <div className="grid sm:grid-cols-2 gap-4">
      {[1,2,3,4].map(i => <div key={i} className="h-36 village-card animate-pulse" />)}
    </div>
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-muted-foreground">{groups.length} active group{groups.length !== 1 ? "s" : ""} near you</p>
        <Button variant="outline" className="rounded-full text-xs h-8" onClick={() => navigate("/stall/groups/new")}>
          <Plus className="h-3.5 w-3.5 mr-1" />
          Create group
        </Button>
      </div>

      {groups.length === 0 ? (
        <div className="text-center py-16">
          <Heart className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="font-heading font-semibold text-foreground text-sm mb-1">No donation groups yet</p>
          <p className="text-xs text-muted-foreground mb-4">Start a community giving group for families in your area.</p>
          <Button variant="outline" className="rounded-full" onClick={() => navigate("/stall/groups/new")}>
            Start a group
          </Button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {groups.map(g => (
            <Link
              key={g.group_id}
              to={`/stall/groups/${g.group_id}`}
              className="village-card village-card-hover p-4 flex flex-col gap-2"
            >
              <div className="flex items-start gap-3">
                {g.cover_image
                  ? <img src={g.cover_image} alt="" className="w-12 h-12 rounded-xl object-cover shrink-0" />
                  : <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0 text-2xl">🤝</div>
                }
                <div className="min-w-0 flex-1">
                  <h3 className="font-heading font-semibold text-sm text-foreground line-clamp-1">{g.name}</h3>
                  <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{g.description}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${GROUP_CATEGORY_COLORS[g.category] || GROUP_CATEGORY_COLORS.general}`}>
                  {g.category}
                </span>
                <span className="flex items-center gap-0.5"><Users className="h-3 w-3" /> {g.member_ids?.length || 0}</span>
                <span className="flex items-center gap-0.5"><ShoppingBag className="h-3 w-3" /> {g.item_count || 0} items</span>
                {g.suburb && <span className="ml-auto flex items-center gap-0.5 truncate"><MapPin className="h-3 w-3" /> {g.suburb}</span>}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Saved Tab ────────────────────────────────────────────────────────────────

function SavedTab({ user, navigate, onSaveToggle, savedIds }) {
  const [listings, setListings] = useState([]);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API_URL}/api/stall/listings/saved`, { credentials: "include" });
        if (res.ok) setListings(await res.json());
      } catch {}
      finally { setLoading(false); }
    })();
  }, []);

  if (loading) return (
    <div className="text-center py-12">
      <div className="w-5 h-5 rounded-full border-2 border-primary/30 border-t-primary animate-spin mx-auto" />
    </div>
  );

  if (listings.length === 0) return (
    <div className="text-center py-16">
      <Bookmark className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
      <p className="font-heading font-semibold text-foreground text-sm mb-1">Nothing saved yet</p>
      <p className="text-xs text-muted-foreground">Tap the bookmark icon on any listing to save it.</p>
    </div>
  );

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {listings.map(l => (
        <ListingCard key={l.listing_id} listing={l} onSaveToggle={onSaveToggle} savedIds={savedIds} />
      ))}
    </div>
  );
}

// ── My Listings Tab ──────────────────────────────────────────────────────────

function MyListingsTab({ user, navigate }) {
  const [listings, setListings] = useState([]);
  const [loading,  setLoading]  = useState(true);

  const fetchMine = async () => {
    try {
      const res = await fetch(`${API_URL}/api/stall/listings/my`, { credentials: "include" });
      if (res.ok) setListings(await res.json());
    } catch {}
    finally { setLoading(false); }
  };

  useEffect(() => { fetchMine(); }, []);

  const markStatus = async (listingId, status) => {
    try {
      const res = await fetch(`${API_URL}/api/stall/listings/${listingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status }),
      });
      if (res.ok) { toast.success("Listing updated"); fetchMine(); }
    } catch { toast.error("Something went wrong"); }
  };

  const deleteListing = async (listingId) => {
    if (!window.confirm("Delete this listing?")) return;
    try {
      const res = await fetch(`${API_URL}/api/stall/listings/${listingId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (res.ok) { toast.success("Listing deleted"); fetchMine(); }
    } catch { toast.error("Something went wrong"); }
  };

  const STATUS_LABELS = { active: "Active", sold: "Sold", swapped: "Swapped", gone: "Gone", closed: "Closed", paused: "Paused" };
  const STATUS_COLORS = {
    active:  "text-emerald-600 bg-emerald-500/10",
    sold:    "text-muted-foreground bg-secondary",
    swapped: "text-sky-600 bg-sky-500/10",
    gone:    "text-amber-600 bg-amber-500/10",
    closed:  "text-muted-foreground bg-secondary",
    paused:  "text-amber-700 bg-amber-500/10",
  };

  if (loading) return (
    <div className="text-center py-12">
      <div className="w-5 h-5 rounded-full border-2 border-primary/30 border-t-primary animate-spin mx-auto" />
    </div>
  );

  if (listings.length === 0) return (
    <div className="text-center py-16">
      <Tag className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
      <p className="font-heading font-semibold text-foreground text-sm mb-1">No listings yet</p>
      <p className="text-xs text-muted-foreground mb-4">Post an item to get started.</p>
      <Button variant="outline" className="rounded-full" onClick={() => navigate("/stall/new")}>Post a listing</Button>
    </div>
  );

  return (
    <div className="space-y-3">
      {listings.map(l => {
        const firstImage = l.images?.[0];
        return (
          <div key={l.listing_id} className="village-card p-4 flex gap-3 items-start">
            <div className="w-16 h-16 rounded-xl bg-secondary/40 overflow-hidden shrink-0">
              {firstImage
                ? <img src={firstImage} alt={l.title} className="w-full h-full object-cover" />
                : <div className="w-full h-full flex items-center justify-center text-muted-foreground/30"><ShoppingBag className="h-6 w-6" /></div>
              }
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-semibold text-sm text-foreground line-clamp-1">{l.title}</h3>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${STATUS_COLORS[l.status] || STATUS_COLORS.active}`}>
                  {STATUS_LABELS[l.status] || l.status}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {TYPE_LABELS[l.listing_type]} · {l.views || 0} views · {l.enquiry_count || 0} enquiries
              </p>
              {l.status === "active" && (
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  <button onClick={() => navigate(`/stall/listing/${l.listing_id}`)} className="text-xs text-primary hover:underline">View</button>
                  <button onClick={() => navigate(`/stall/listing/${l.listing_id}/edit`)} className="text-xs text-muted-foreground hover:text-foreground">Edit</button>
                  <button
                    onClick={() => markStatus(l.listing_id, l.listing_type === "give_away" ? "gone" : l.listing_type === "swap" ? "swapped" : "sold")}
                    className="text-xs text-emerald-600 hover:underline"
                  >
                    Mark as {l.listing_type === "give_away" ? "gone" : l.listing_type === "swap" ? "swapped" : "sold"}
                  </button>
                  <button onClick={() => deleteListing(l.listing_id)} className="text-xs text-destructive hover:underline ml-auto">Delete</button>
                </div>
              )}
              {l.status === "paused" && l.paused_reason === "trial_expired" && (
                <div className="mt-2 p-2 bg-amber-500/10 border border-amber-500/20 rounded-lg text-xs text-amber-700 dark:text-amber-400 leading-relaxed">
                  ⏸️ Paused — your trial expired.{" "}
                  <Link to="/plus" className="underline font-medium">Upgrade to Village+</Link> to reinstate this listing. It will be permanently deleted in 7 days if not reinstated.
                </div>
              )}
              {l.status !== "active" && l.status !== "paused" && (
                <div className="flex items-center gap-2 mt-2">
                  <button onClick={() => markStatus(l.listing_id, "active")} className="text-xs text-primary hover:underline">Reactivate</button>
                  <button onClick={() => deleteListing(l.listing_id)} className="text-xs text-destructive hover:underline ml-auto">Delete</button>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Messages Tab ─────────────────────────────────────────────────────────────

function MessagesTab({ user, onUnreadChange }) {
  const [conversations, setConversations] = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [activeConv,    setActiveConv]    = useState(null);

  const fetchConversations = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/stall/messages/conversations`, { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setConversations(data);
        const unread = data.reduce((sum, c) => sum + (c.unread_count || 0), 0);
        onUnreadChange(unread);
      }
    } catch {}
    finally { setLoading(false); }
  }, [onUnreadChange]);

  useEffect(() => { fetchConversations(); }, [fetchConversations]);

  if (activeConv) {
    return (
      <StallThreadView
        conv={activeConv}
        user={user}
        onBack={() => {
          setActiveConv(null);
          fetchConversations();
        }}
      />
    );
  }

  if (loading) return (
    <div className="text-center py-12">
      <div className="w-5 h-5 rounded-full border-2 border-primary/30 border-t-primary animate-spin mx-auto" />
    </div>
  );

  if (conversations.length === 0) return (
    <div className="text-center py-16">
      <MessageCircle className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
      <p className="font-heading font-semibold text-foreground text-sm mb-1">No conversations yet</p>
      <p className="text-xs text-muted-foreground">Message a seller about a listing to start a conversation.</p>
    </div>
  );

  return (
    <div className="space-y-2">
      {conversations.map(conv => (
        <button
          key={`${conv.listing_id}-${conv.other_user_id}`}
          onClick={() => setActiveConv(conv)}
          className="w-full village-card village-card-hover p-4 flex items-center gap-3 text-left"
        >
          {/* Listing thumbnail */}
          <div className="w-12 h-12 rounded-xl overflow-hidden bg-secondary/40 shrink-0">
            {conv.listing_image
              ? <img src={conv.listing_image} alt="" className="w-full h-full object-cover" />
              : <div className="w-full h-full flex items-center justify-center"><ShoppingBag className="h-5 w-5 text-muted-foreground/30" /></div>
            }
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline justify-between gap-2 mb-0.5">
              <p className={`text-sm leading-tight ${conv.unread_count > 0 ? "font-bold text-foreground" : "font-semibold text-foreground"}`}>
                {conv.other_user_name}
              </p>
              <span className="text-[10px] text-muted-foreground shrink-0">{fmtTime(conv.last_message_time)}</span>
            </div>
            <p className="text-xs text-muted-foreground truncate">{conv.listing_title}</p>
            <p className={`text-xs truncate mt-0.5 ${conv.unread_count > 0 ? "font-semibold text-foreground" : "text-muted-foreground"}`}>
              {conv.last_message}
            </p>
          </div>

          {/* Unread badge */}
          {conv.unread_count > 0 && (
            <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground text-[10px] flex items-center justify-center font-bold shrink-0">
              {conv.unread_count > 9 ? "9+" : conv.unread_count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

// ── Thread View (inline in Messages tab) ──────────────────────────────────────

function StallThreadView({ conv, user, onBack }) {
  const [messages, setMessages] = useState([]);
  const [newMsg,   setNewMsg]   = useState("");
  const [sending,  setSending]  = useState(false);
  const [loading,  setLoading]  = useState(true);
  const bottomRef   = useRef(null);
  const intervalRef = useRef(null);
  const textareaRef = useRef(null);

  const fetchMessages = useCallback(async () => {
    try {
      const res = await fetch(
        `${API_URL}/api/stall/messages/${conv.listing_id}/${conv.other_user_id}`,
        { credentials: "include" }
      );
      if (res.ok) setMessages(await res.json());
    } catch {}
    finally { setLoading(false); }
  }, [conv.listing_id, conv.other_user_id]);

  useEffect(() => {
    fetchMessages();
    intervalRef.current = setInterval(fetchMessages, 3000);
    return () => clearInterval(intervalRef.current);
  }, [fetchMessages]);

  useEffect(() => {
    if (!loading) bottomRef.current?.scrollIntoView({ behavior: messages.length <= 1 ? "instant" : "smooth" });
  }, [messages, loading]);

  const handleSend = async () => {
    const text = newMsg.trim();
    if (!text || sending) return;
    setNewMsg("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
    setSending(true);
    try {
      const res = await fetch(`${API_URL}/api/stall/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          listing_id: conv.listing_id,
          receiver_id: conv.other_user_id,
          content: text,
        }),
      });
      if (res.ok) fetchMessages();
      else toast.error("Failed to send");
    } catch { toast.error("Something went wrong"); }
    finally { setSending(false); }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const autoResize = (el) => {
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 120) + "px";
  };

  return (
    <div className="village-card flex flex-col overflow-hidden" style={{ height: "calc(100vh - 260px)", minHeight: "420px" }}>
      {/* Thread header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border/40 shrink-0">
        <button onClick={onBack} className="p-1 -ml-1 text-muted-foreground hover:text-foreground rounded-lg transition-colors">
          <ArrowLeft className="h-4 w-4" />
        </button>
        {conv.listing_image
          ? <img src={conv.listing_image} alt="" className="w-9 h-9 rounded-lg object-cover shrink-0" />
          : <div className="w-9 h-9 rounded-lg bg-secondary/50 flex items-center justify-center shrink-0">
              <ShoppingBag className="h-4 w-4 text-muted-foreground/40" />
            </div>
        }
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-foreground line-clamp-1">{conv.listing_title}</p>
          <p className="text-xs text-muted-foreground">with {conv.other_user_name}</p>
        </div>
        <Link
          to={`/stall/listing/${conv.listing_id}`}
          className="text-xs text-primary hover:underline shrink-0"
        >
          View listing
        </Link>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 min-h-0">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="w-5 h-5 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-2 text-center">
            <MessageCircle className="h-10 w-10 text-muted-foreground/20" />
            <p className="text-sm text-muted-foreground">No messages yet</p>
          </div>
        ) : (
          <div className="space-y-1.5">
            {messages.map((msg, i) => {
              const isMe = msg.sender_id === user?.user_id;
              const prev = messages[i - 1];
              const showTimestamp = i === 0 ||
                (prev && new Date(msg.created_at) - new Date(prev.created_at) > 10 * 60 * 1000);

              return (
                <div key={msg.message_id || i}>
                  {showTimestamp && i > 0 && (
                    <p className="text-center text-[10px] text-muted-foreground/50 py-2">
                      {fmtTime(msg.created_at)}
                    </p>
                  )}
                  <div className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[78%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed break-words ${
                      isMe
                        ? "bg-primary text-primary-foreground rounded-br-md"
                        : "bg-background border border-border/60 text-foreground rounded-bl-md"
                    }`}>
                      {msg.content}
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* Input */}
      <div className="px-4 py-3 border-t border-border/40 flex items-end gap-2 shrink-0">
        <textarea
          ref={textareaRef}
          value={newMsg}
          onChange={e => { setNewMsg(e.target.value.slice(0, 500)); autoResize(e.target); }}
          onKeyDown={handleKeyDown}
          placeholder="Message…"
          rows={1}
          className="flex-1 resize-none bg-background border border-border rounded-2xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/60 outline-none focus:ring-2 focus:ring-primary/30 transition overflow-hidden"
        />
        <button
          onClick={handleSend}
          disabled={!newMsg.trim() || sending}
          className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center disabled:opacity-40 hover:opacity-90 active:scale-95 transition-all shrink-0 mb-px"
        >
          {sending
            ? <div className="w-4 h-4 rounded-full border-2 border-primary-foreground/40 border-t-primary-foreground animate-spin" />
            : <Send className="h-4 w-4" />
          }
        </button>
      </div>
    </div>
  );
}
