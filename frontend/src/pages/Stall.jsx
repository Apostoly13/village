import { useState, useEffect, useLayoutEffect, useRef, useCallback } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "../components/ui/button";
import Navigation from "../components/Navigation";
import AppFooter from "../components/AppFooter";
import { Sparkles, Plus, Tag, ArrowLeftRight, Heart, Search as SearchIcon, MapPin, Clock, Bookmark, BookmarkCheck, ShoppingBag, Users, Filter, X, MessageCircle, ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react";
import { SendIcon } from "../components/village/VillageLineIcons";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { parseApiError } from "../utils/apiError";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import SuburbSearch from "../components/SuburbSearch";

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
  sell:"bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  swap:"bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20",
  give_away: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
  wanted:"bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20",
};

const TYPE_LABELS = { sell: "Selling", swap: "Swapping", give_away: "Giving Away", wanted: "Wanted" };

const fmtTime = (d) => { try { return formatDistanceToNow(new Date(d), { addSuffix: true }); } catch { return ""; } };

const CONDITION_SHORT = { like_new: "Like new", good: "Good", fair: "Fair", well_loved: "Well loved" };

// ── ListingCard ───────────────────────────────────────────────────────────────

function ListingCard({ listing, onSaveToggle, savedIds }) {
  const navigate    = useNavigate();
  const isSaved     = savedIds.has(listing.listing_id);
  const images      = listing.images?.length ? listing.images : [];
  const isWanted    = listing.listing_type === "wanted";
  const [imgIdx, setImgIdx] = useState(0);
  const touchStartX = useRef(null);

  const handleSave = async (e) => {
    e.stopPropagation();
    await onSaveToggle(listing.listing_id);
  };

  const prevImg = (e) => {
    e.stopPropagation();
    setImgIdx(i => (i - 1 + images.length) % images.length);
  };
  const nextImg = (e) => {
    e.stopPropagation();
    setImgIdx(i => (i + 1) % images.length);
  };

  const onTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const onTouchEnd = (e) => {
    if (touchStartX.current === null || images.length < 2) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(dx) > 40) {
      dx < 0
        ? setImgIdx(i => (i + 1) % images.length)
        : setImgIdx(i => (i - 1 + images.length) % images.length);
    }
    touchStartX.current = null;
  };

  // Wanted listings get a distinct card — dashed border, violet tint, no photo needed
  if (isWanted) {
    return (
      <article
        onClick={() => navigate(`/stall/listing/${listing.listing_id}`)}
        className="village-card village-card-hover overflow-hidden flex flex-col border border-dashed border-violet-400/40 bg-violet-500/[0.03]"
      >
        <div className="p-3 flex flex-col gap-1.5 flex-1">
          <div className="flex items-center justify-between gap-1">
            <div className="flex items-center gap-1.5">
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${TYPE_STYLES.wanted}`}>
                Wanted
              </span>
              {listing.status === "pending" && (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-600 border border-amber-500/30">
                  🤝 Pending
                </span>
              )}
              {listing.status === "paused" && (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-secondary text-muted-foreground border border-border/50">
                  ⏸ Paused
                </span>
              )}
            </div>
            <button onClick={handleSave} className="w-6 h-6 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
              {isSaved ? <BookmarkCheck className="h-3.5 w-3.5 text-primary" /> : <Bookmark className="h-3.5 w-3.5" />}
            </button>
          </div>

          {/* Search icon + title */}
          <div className="flex items-start gap-2 py-1">
            <SearchIcon className="h-4 w-4 text-violet-500/60 shrink-0 mt-0.5" />
            <h3 className="font-heading font-bold text-[14px] leading-snug line-clamp-2 text-foreground">
              {listing.title}
            </h3>
          </div>

          {listing.description && (
            <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-2">
              {listing.description}
            </p>
          )}

          {listing.price != null && (
            <p className="text-sm font-semibold text-violet-600 dark:text-violet-400">
              Budget up to ${listing.price.toFixed(0)}
            </p>
          )}

          {listing.age_group && (
            <span className="self-start text-[10px] px-2 py-0.5 rounded-full bg-secondary text-muted-foreground border border-border/50">
              {listing.age_group}
            </span>
          )}

          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground mt-auto pt-1">
            {listing.suburb && (
              <span className="flex items-center gap-0.5 truncate">
                <MapPin className="h-3 w-3 shrink-0" />
                {listing.distance_km != null ? `${listing.distance_km}km` : listing.suburb}
              </span>
            )}
            <span className="ml-auto shrink-0 flex items-center gap-0.5">
              <Clock className="h-3 w-3" />{fmtTime(listing.created_at)}
            </span>
          </div>
        </div>
      </article>
    );
  }

  return (
    <article
      onClick={() => navigate(`/stall/listing/${listing.listing_id}`)}
      className="village-card village-card-hover overflow-hidden flex flex-col"
    >
      {/* Photo area — shorter aspect ratio to leave room for description */}
      <div
        className="relative aspect-[16/10] bg-secondary/40 shrink-0 overflow-hidden"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        {images.length > 0 ? (
          <img src={images[imgIdx]} alt={listing.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground/20">
            <ShoppingBag className="h-10 w-10" />
          </div>
        )}

        {/* Prev / next arrows — only when multiple images */}
        {images.length > 1 && (
          <>
            <button
              onClick={prevImg}
              className="absolute left-1.5 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/60 transition-colors"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={nextImg}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/60 transition-colors"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
            {/* Dot indicators */}
            <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 flex gap-1">
              {images.map((_, i) => (
                <span key={i} className={`w-1 h-1 rounded-full transition-colors ${i === imgIdx ? "bg-white" : "bg-white/40"}`} />
              ))}
            </div>
          </>
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
        {listing.postage_available && (
          <span className="absolute bottom-2 right-2 text-[10px] bg-card/85 backdrop-blur-sm px-1.5 py-0.5 rounded-full text-muted-foreground">
            📦 Post
          </span>
        )}
        {listing.status === "pending" && (
          <span className="absolute bottom-2 left-2 text-[10px] font-semibold bg-amber-500/90 text-white px-2 py-0.5 rounded-full backdrop-blur-sm">
            🤝 Pending
          </span>
        )}
        {listing.status === "paused" && (
          <span className="absolute bottom-2 left-2 text-[10px] font-semibold bg-card/85 text-muted-foreground px-2 py-0.5 rounded-full backdrop-blur-sm border border-border/50">
            ⏸ Paused
          </span>
        )}
      </div>

      <div className="p-3 flex flex-col gap-1 flex-1">
        <h3 className="font-heading font-bold text-[14px] leading-snug line-clamp-1 text-foreground">
          {listing.title}
        </h3>

        <p className="text-sm font-bold text-foreground leading-none">
          {listing.listing_type === "give_away" && <span className="text-amber-600 dark:text-amber-400">Free</span>}
          {listing.listing_type === "sell" && (
            listing.make_offer ? <span className="text-emerald-600 dark:text-emerald-400">Make an offer</span>
              : listing.price != null ? <span className="text-emerald-600 dark:text-emerald-400">${listing.price.toFixed(0)}</span>
              : <span className="text-muted-foreground text-sm">POA</span>
          )}
          {listing.listing_type === "swap" && <span className="text-sky-600 dark:text-sky-400">Swap</span>}
        </p>

        {listing.description && (
          <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-2 mt-0.5">
            {listing.description}
          </p>
        )}

        {/* Condition + age group chips */}
        {(listing.condition || listing.age_group) && (
          <div className="flex flex-wrap gap-1 mt-0.5">
            {listing.condition && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-secondary text-muted-foreground border border-border/40">
                {CONDITION_SHORT[listing.condition] || listing.condition}
              </span>
            )}
            {listing.age_group && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-secondary text-muted-foreground border border-border/40">
                {listing.age_group}
              </span>
            )}
          </div>
        )}

        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground mt-auto pt-1">
          {listing.suburb && (
            <span className="flex items-center gap-0.5 truncate">
              <MapPin className="h-3 w-3 shrink-0" />
              {listing.distance_km != null ? `${listing.distance_km}km` : listing.suburb}
            </span>
          )}
          <span className="ml-auto shrink-0 flex items-center gap-0.5">
            <Clock className="h-3 w-3" />{fmtTime(listing.created_at)}
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
  const [sortBy,         setSortBy]         = useState(user?.latitude ? "nearest" : "newest");
  const [locationSuburb, setLocationSuburb] = useState("");
  const [locationLabel,  setLocationLabel]  = useState("");
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
      const params = new URLSearchParams({ limit: "24", sort: sortBy });
      if (activeType !== "all") params.set("listing_type", activeType);
      if (activeCategory) params.set("category", activeCategory);
      if (search) params.set("search", search);
      if (locationSuburb) params.set("suburb", locationSuburb);
      if (sortBy === "nearest" && user?.latitude && user?.longitude) {
        params.set("lat", user.latitude);
        params.set("lon", user.longitude);
        params.set("distance_km", "100");
      }
      const res = await fetch(`${API_URL}/api/stall/listings?${params}`, { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setListings(data.listings || data);
        setTotal(data.total || 0);
      }
    } catch {}
    finally { setLoading(false); }
  }, [activeType, activeCategory, search, locationSuburb, sortBy, user?.latitude, user?.longitude]);

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

  // Free user view — Donation Groups freely visible, everything else locked
  if (!isPremium) {
    return (
      <div className="min-h-screen bg-background lg:pl-60 lg:pb-0">
        <Navigation user={user} />
        <main className="max-w-5xl mx-auto px-4 pt-16 lg:pt-8 pb-16">
          {/* Header */}
          <div className="flex items-center justify-between mb-6 mt-2">
            <div>
              <h1 className="font-heading text-2xl font-bold text-foreground">The Village Stall</h1>
              <p className="text-sm text-muted-foreground mt-0.5">Buy, swap, give away — local parenting gear</p>
            </div>
          </div>

          {/* Village+ locked banner */}
          <div className="village-card p-5 mb-8 flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0" style={{ background: "var(--paper-3)" }}>
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="font-heading font-semibold text-foreground mb-0.5">Village+ unlocks The Village Stall</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Browse and post listings, save items, swap gear, and message sellers. Join local parents buying, swapping, and giving away baby gear.
              </p>
            </div>
            <Button className="rounded-full shadow-sm shadow-primary/20 shrink-0" onClick={() => navigate("/plus")}>
              <Sparkles className="h-4 w-4 mr-1.5" style={{ color: "hsl(var(--accent))" }} />
              Unlock with Village+
            </Button>
          </div>

          {/* Donation Groups — free for all */}
          <div className="mb-4">
            <h2 className="font-heading text-lg font-bold text-foreground mb-0.5">Donation Groups</h2>
            <p className="text-sm text-muted-foreground">Community-organised giving drives — open to everyone.</p>
          </div>
          <DonationGroupsTab user={user} navigate={navigate} isPremium={false} />
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
    <div className="min-h-screen bg-background  lg:pl-60 lg:pb-0">
      <Navigation user={user} />

      <main className="max-w-5xl mx-auto px-4 pt-16 lg:pt-8 pb-16">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 mt-2">
          <div>
            <h1 className="font-heading text-2xl font-bold text-foreground">
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
        <div className="flex items-center gap-1 mb-5 border-b border-border/40 flex-wrap">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); setSearchParams(prev => { const p = new URLSearchParams(prev); p.set("tab", tab.id); return p; }, { replace: true }); }}
              className={`relative flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px whitespace-nowrap shrink-0 ${
                activeTab === tab.id
                  ? "border-[var(--ink)] text-[var(--ink)]"
                  : "border-transparent text-[var(--ink-3)] hover:text-[var(--ink)]"
              }`}
            >
              {tab.label}
              {tab.badge > 0 && (
                <span className="w-4 h-4 rounded-full text-[9px] flex items-center justify-center font-bold text-white" style={{ background: "var(--badge-danger)" }}>
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
                    ? "border-[var(--sage)]/30 sage-pill-active"
                    : "border-[var(--line)] text-[var(--ink-3)] hover:text-[var(--ink)]"
                }`}
                style={showFilters || activeCategory ? { background: "var(--sage-wash)", color: "var(--sage-deep)" } : {}}
              >
                <Filter className="h-4 w-4" />
                Filter
              </button>
            </div>

            {/* Type pills + sort */}
            <div className="flex flex-wrap items-center gap-2 mb-4">
              {LISTING_TYPES.map(t => (
                <button
                  key={t.id}
                  onClick={() => setActiveType(t.id)}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all focus-visible:outline-none border ${
                    activeType === t.id
                      ? "border-[var(--sage)]/30"
                      : "border-transparent text-[var(--ink-3)]"
                  }`}
                  style={activeType === t.id
                    ? { background: "var(--sage-wash)", color: "var(--sage-deep)" }
                    : {}
                  }
                >
                  <t.icon className="h-3.5 w-3.5" />
                  {t.label}
                </button>
              ))}
              {/* Sort toggle — pushed to the right; Nearest only if user has location */}
              <div className="flex items-center gap-1 ml-auto rounded-full p-0.5" style={{ background: "var(--paper-2)", border: "1px solid var(--line)" }}>
                <button
                  onClick={() => setSortBy("newest")}
                  className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors whitespace-nowrap border ${sortBy === "newest" ? "border-[var(--sage)]/30 sage-pill-active" : "border-transparent text-[var(--ink-3)] hover:text-[var(--ink)]"}`}
                  style={sortBy === "newest" ? { background: "var(--sage-wash)", color: "var(--sage-deep)" } : {}}
                >
                  Newest
                </button>
                {user?.latitude && (
                  <button
                    onClick={() => setSortBy("nearest")}
                    className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors whitespace-nowrap border ${sortBy === "nearest" ? "border-[var(--sage)]/30 sage-pill-active" : "border-transparent text-[var(--ink-3)] hover:text-[var(--ink)]"}`}
                    style={sortBy === "nearest" ? { background: "var(--sage-wash)", color: "var(--sage-deep)" } : {}}
                  >
                    Nearest
                  </button>
                )}
              </div>
            </div>

            {/* Active location chip */}
            {locationLabel && (
              <div className="flex items-center gap-2 mb-3">
                <span
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border"
                  style={{ background: "var(--sage-wash)", color: "var(--sage-deep)", borderColor: "color-mix(in srgb, var(--sage) 30%, transparent)" }}
                >
                  <MapPin className="h-3 w-3" />
                  {locationLabel}
                  <button type="button" onClick={() => { setLocationSuburb(""); setLocationLabel(""); }} className="hover:opacity-70 transition ml-0.5">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              </div>
            )}

            {/* Category + location filter panel */}
            {showFilters && (
              <div className="flex flex-col gap-3 mb-4 p-4 village-card">
                {/* Location */}
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1.5">Filter by location</p>
                  <SuburbSearch
                    value={locationLabel}
                    onSelect={(loc) => {
                      const suburb = loc.suburb || loc.display_name?.split(",")[0] || "";
                      const label = [suburb, loc.state].filter(Boolean).join(", ");
                      setLocationSuburb(suburb);
                      setLocationLabel(label);
                      setShowFilters(false);
                    }}
                    onChange={(val) => { if (!val) { setLocationSuburb(""); setLocationLabel(""); } }}
                    placeholder="e.g. Newtown, NSW"
                  />
                </div>
                {/* Categories */}
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1.5">Filter by category</p>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setActiveCategory("")}
                      className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                        !activeCategory ? "border-[var(--sage)]/30 sage-pill-active" : "border-transparent text-[var(--ink-3)] hover:text-[var(--ink)]"
                      }`}
                      style={!activeCategory ? { background: "var(--sage-wash)", color: "var(--sage-deep)" } : {}}
                    >
                      All categories
                    </button>
                    {CATEGORIES.map(c => (
                      <button
                        key={c.id}
                        onClick={() => setActiveCategory(activeCategory === c.id ? "" : c.id)}
                        className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                          activeCategory === c.id ? "border-[var(--sage)]/30 sage-pill-active" : "border-transparent text-[var(--ink-3)] hover:text-[var(--ink)]"
                        }`}
                        style={activeCategory === c.id ? { background: "var(--sage-wash)", color: "var(--sage-deep)" } : {}}
                      >
                        {c.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Giving Away callout */}
            {activeType === "give_away" && (
              <div className="flex items-start gap-2 p-3 rounded-xl mb-4" style={{ background: "var(--honey-wash)", border: "1px solid var(--line)" }}>
                <span className="text-sm">💛</span>
                <p className="text-xs" style={{ color: "var(--ink-2)" }}>
                  <strong>Giving Away</strong> — quick free listings for items you want to pass on.
                  For organised community drives, see{" "}
                  <button onClick={() => { setActiveTab("groups"); setSearchParams(prev => { const p = new URLSearchParams(prev); p.set("tab", "groups"); return p; }, { replace: true }); }} className="underline font-medium" style={{ color: "var(--ink)" }}>Donation Groups</button>.
                </p>
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
                <p className="font-heading font-semibold text-foreground text-sm mb-1">
                  {search || activeType !== "all" || activeCategory ? "No listings match your filters" : "No listings yet"}
                </p>
                <p className="text-xs text-muted-foreground mb-4">
                  {search || activeType !== "all" || activeCategory
                    ? "Try clearing a filter, or be the first to post something in this category."
                    : "Be the first to post something — someone local is probably looking for it."}
                </p>
                <div className="flex gap-2 justify-center flex-wrap">
                  {(search || activeType !== "all" || activeCategory || locationSuburb) && (
                    <Button variant="outline" className="rounded-full" onClick={() => { setSearch(""); setSearchInput(""); setActiveType("all"); setActiveCategory(""); setLocationSuburb(""); setLocationLabel(""); }}>
                      Clear filters
                    </Button>
                  )}
                  <Button variant="outline" className="rounded-full" onClick={() => navigate("/stall/new")}>
                    Post a listing
                  </Button>
                </div>
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
        {activeTab === "groups" && <DonationGroupsTab user={user} navigate={navigate} isPremium={isPremium} />}

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

const PURPOSE_LABELS_STALL = {
  baby_clothes: "Baby Clothes", kids_clothes: "Kids Clothes",
  school_uniforms: "School Uniforms", toys_games: "Toys & Games",
  baby_gear: "Baby Gear", maternity_feeding: "Maternity & Feeding",
  nappies_essentials: "Nappies & Essentials", books_learning: "Books & Learning",
  general_donations: "General Donations", other: "Other",
};

function GroupCard({ g }) {
  const itemCount = g.item_count || 0;
  return (
    <Link to={`/stall/groups/${g.group_id}`} className="village-card village-card-hover p-3.5 flex flex-col gap-3">
      <div className="flex items-start gap-3">
        {g.cover_image
          ? <img src={g.cover_image} alt="" className="w-11 h-11 rounded-xl object-cover shrink-0" />
          : <div className="w-11 h-11 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0 text-xl">🤝</div>
        }
        <div className="min-w-0 flex-1">
          <h3 className="font-heading font-semibold text-sm text-foreground line-clamp-1 leading-snug">{g.name}</h3>
          <p className="text-[11px] text-muted-foreground line-clamp-2 mt-0.5 leading-relaxed">{g.description}</p>
        </div>
      </div>

      {/* Donation count — prominent */}
      <div className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: "var(--sage-wash)" }}>
        <Heart className="h-4 w-4 shrink-0" style={{ color: "var(--sage-deep)" }} />
        <span className="font-heading font-bold text-sm" style={{ color: "var(--sage-deep)" }}>
          {itemCount} item{itemCount !== 1 ? "s" : ""} donated
        </span>
      </div>

      <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground flex-wrap border-t border-border/30 pt-2.5">
        {g.purpose_type && (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-500/10 text-amber-700 dark:text-amber-400">
            {PURPOSE_LABELS_STALL[g.purpose_type] || g.purpose_type}
          </span>
        )}
        {(g.is_organiser || g.is_member) && (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-medium" style={{ background: "var(--sage-wash)", color: "var(--sage-deep)" }}>
            {g.is_organiser ? "Organiser" : "Member"}
          </span>
        )}
        <span className="flex items-center gap-0.5 ml-auto">
          <Users className="h-3 w-3" /> {g.member_ids?.length || 0}
        </span>
        {(g.area_coverage || g.suburb) && (
          <span className="flex items-center gap-0.5 truncate max-w-[120px]">
            <MapPin className="h-3 w-3 shrink-0" />
            <span className="truncate">{g.area_coverage || g.suburb}</span>
          </span>
        )}
      </div>
    </Link>
  );
}

function DonationGroupsTab({ user, navigate, isPremium }) {
  const [groups,         setGroups]         = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [groupSearch,    setGroupSearch]    = useState("");
  const [groupSearchInput, setGroupSearchInput] = useState("");
  const [locationSuburb, setLocationSuburb] = useState("");
  const [locationLabel,  setLocationLabel]  = useState("");

  const fetchGroups = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: "50" });
      if (groupSearch)    params.set("search", groupSearch);
      if (locationSuburb) params.set("suburb", locationSuburb);
      if (user?.latitude && user?.longitude) {
        params.set("lat", user.latitude);
        params.set("lon", user.longitude);
      }
      const res = await fetch(`${API_URL}/api/stall/groups?${params}`, { credentials: "include" });
      if (res.ok) { const data = await res.json(); setGroups(data.groups || []); }
    } catch {}
    finally { setLoading(false); }
  }, [user, groupSearch, locationSuburb]);

  useEffect(() => { fetchGroups(); }, [fetchGroups]);

  if (loading) return (
    <div className="grid sm:grid-cols-2 gap-4">
      {[1,2,3,4].map(i => <div key={i} className="h-36 village-card animate-pulse" />)}
    </div>
  );

  const myGroups    = groups.filter(g => g.is_organiser || g.is_member);
  const otherGroups = groups.filter(g => !g.is_organiser && !g.is_member);

  const hasFilters = groupSearch || locationSuburb;

  return (
    <div>
      {/* Search + location bar */}
      <div className="flex flex-col gap-2 mb-4">
        <div className="flex gap-2 items-center">
          {/* Group name search */}
          <form
            onSubmit={e => { e.preventDefault(); setGroupSearch(groupSearchInput); }}
            className="flex-1 flex items-center gap-1.5 bg-card border border-border/50 rounded-full px-3 py-1.5 min-w-0"
          >
            <SearchIcon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <input
              value={groupSearchInput}
              onChange={e => { setGroupSearchInput(e.target.value); if (!e.target.value) setGroupSearch(""); }}
              onBlur={() => setGroupSearch(groupSearchInput)}
              placeholder="Search groups…"
              className="flex-1 bg-transparent text-xs text-foreground placeholder:text-muted-foreground outline-none min-w-0"
            />
            {groupSearchInput && (
              <button type="button" onClick={() => { setGroupSearchInput(""); setGroupSearch(""); }}>
                <X className="h-3 w-3 text-muted-foreground" />
              </button>
            )}
          </form>

          {/* Location search */}
          <div className="flex-1 min-w-0">
            <SuburbSearch
              value={locationLabel}
              onSelect={(loc) => {
                const suburb = loc.suburb || loc.display_name?.split(",")[0] || "";
                const label = [suburb, loc.state].filter(Boolean).join(", ");
                setLocationSuburb(suburb);
                setLocationLabel(label);
              }}
              onChange={(val) => { if (!val) { setLocationSuburb(""); setLocationLabel(""); } }}
              placeholder="Suburb or area…"
              inputClass="py-1.5 text-xs"
            />
          </div>

          <Button
            variant="outline"
            className="rounded-full text-xs h-8 px-3 shrink-0"
            onClick={() => navigate(isPremium ? "/stall/groups/new" : "/plus")}
          >
            {isPremium ? <Plus className="h-3.5 w-3.5 mr-1" /> : <Sparkles className="h-3.5 w-3.5 mr-1" />}
            {isPremium ? "Create" : "Village+"}
          </Button>
        </div>

        {/* Active filters */}
        {hasFilters && (
          <div className="flex items-center gap-2 flex-wrap">
            {locationLabel && (
              <span
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border"
                style={{ background: "var(--sage-wash)", color: "var(--sage-deep)", borderColor: "color-mix(in srgb, var(--sage) 30%, transparent)" }}
              >
                <MapPin className="h-3 w-3" />{locationLabel}
                <button type="button" onClick={() => { setLocationSuburb(""); setLocationLabel(""); }} className="hover:opacity-70 ml-0.5">
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
            <button
              onClick={() => { setGroupSearch(""); setGroupSearchInput(""); setLocationSuburb(""); setLocationLabel(""); }}
              className="text-xs text-muted-foreground hover:text-foreground transition"
            >
              Clear all
            </button>
          </div>
        )}

        <p className="text-xs text-muted-foreground">{groups.length} active group{groups.length !== 1 ? "s" : ""}</p>
      </div>

      {groups.length === 0 ? (
        <div className="text-center py-16">
          <Heart className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="font-heading font-semibold text-foreground text-sm mb-1">No donation groups yet</p>
          <p className="text-xs text-muted-foreground mb-4">Start a community giving group for families in your area.</p>
          <Button variant="outline" className="rounded-full" onClick={() => navigate(isPremium ? "/stall/groups/new" : "/plus")}>
            {isPremium ? "Start a group" : "Unlock with Village+"}
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* My groups */}
          {myGroups.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "var(--ink-3)" }}>My Groups</h3>
              <div className="grid sm:grid-cols-2 gap-4">
                {myGroups.map(g => <GroupCard key={g.group_id} g={g} />)}
              </div>
            </div>
          )}

          {/* Browse all */}
          {otherGroups.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "var(--ink-3)" }}>
                {myGroups.length > 0 ? "Browse All" : "Donation Groups"}
              </h3>
              <div className="grid sm:grid-cols-2 gap-4">
                {otherGroups.map(g => <GroupCard key={g.group_id} g={g} />)}
              </div>
            </div>
          )}
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
      <div className="w-5 h-5 rounded-full border-2 border-[var(--line)] border-t-[var(--ink-2)] animate-spin mx-auto" />
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

  const STATUS_LABELS = { active: "Active", sold: "Sold", swapped: "Swapped", gone: "Gone", closed: "Closed", paused: "Paused", pending: "Pending" };
  const STATUS_COLORS = {
    active:"text-emerald-600 bg-emerald-500/10",
    sold:"text-muted-foreground bg-secondary",
    swapped: "text-sky-600 bg-sky-500/10",
    gone:"text-amber-600 bg-amber-500/10",
    closed:"text-muted-foreground bg-secondary",
    paused:"text-amber-700 bg-amber-500/10",
    pending: "text-amber-600 bg-amber-500/10",
  };

  if (loading) return (
    <div className="text-center py-12">
      <div className="w-5 h-5 rounded-full border-2 border-[var(--line)] border-t-[var(--ink-2)] animate-spin mx-auto" />
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
                  <button onClick={() => markStatus(l.listing_id, "paused")} className="text-xs text-muted-foreground hover:text-foreground">Pause</button>
                  <button onClick={() => markStatus(l.listing_id, "pending")} className="text-xs text-amber-600 hover:underline">Pending</button>
                  <button onClick={() => deleteListing(l.listing_id)} className="text-xs text-destructive hover:underline ml-auto">Delete</button>
                </div>
              )}
              {l.status === "paused" && (
                l.paused_reason === "trial_expired" ? (
                  <div className="mt-2 p-2 bg-amber-500/10 border border-amber-500/20 rounded-lg text-xs text-amber-700 dark:text-amber-400 leading-relaxed">
                    ⏸️ Paused — your trial expired.{" "}
                    <Link to="/plus" className="underline font-medium">Upgrade to Village+</Link> to reinstate this listing. It will be permanently deleted in 7 days if not reinstated.
                  </div>
                ) : (
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    <button onClick={() => navigate(`/stall/listing/${l.listing_id}`)} className="text-xs text-primary hover:underline">View</button>
                    <button onClick={() => navigate(`/stall/listing/${l.listing_id}/edit`)} className="text-xs text-muted-foreground hover:text-foreground">Edit</button>
                    <button onClick={() => markStatus(l.listing_id, "active")} className="text-xs text-emerald-600 hover:underline">Unpause</button>
                    <button onClick={() => deleteListing(l.listing_id)} className="text-xs text-destructive hover:underline ml-auto">Delete</button>
                  </div>
                )
              )}
              {l.status === "pending" && (
                <div className="mt-2 p-2 bg-amber-500/10 border border-amber-500/20 rounded-lg text-xs text-amber-700 dark:text-amber-400 leading-relaxed flex items-center justify-between gap-2">
                  <span>🤝 In negotiation — still visible to buyers.</span>
                  <div className="flex gap-2 shrink-0">
                    <button onClick={() => markStatus(l.listing_id, "active")} className="text-xs text-emerald-600 hover:underline">Mark active</button>
                    <button onClick={() => deleteListing(l.listing_id)} className="text-xs text-destructive hover:underline">Delete</button>
                  </div>
                </div>
              )}
              {!["active", "paused", "pending"].includes(l.status) && (
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
      <div className="w-5 h-5 rounded-full border-2 border-[var(--line)] border-t-[var(--ink-2)] animate-spin mx-auto" />
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
  const scrollAreaRef = useRef(null);
  const intervalRef   = useRef(null);
  const textareaRef   = useRef(null);
  const isAtBottom    = useRef(true);

  // Lock window scroll while thread is open — prevents scrollIntoView leaking to the page
  useLayoutEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

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

  const handleScroll = () => {
    const el = scrollAreaRef.current;
    if (!el) return;
    isAtBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 60;
  };

  useEffect(() => {
    if (!loading && isAtBottom.current) {
      const el = scrollAreaRef.current;
      if (el) el.scrollTop = el.scrollHeight;
    }
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
      <div ref={scrollAreaRef} onScroll={handleScroll} className="flex-1 overflow-y-auto px-4 py-4 min-h-0" style={{ overscrollBehavior: "contain" }}>
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="w-5 h-5 rounded-full border-2 border-[var(--line)] border-t-[var(--ink-2)] animate-spin" />
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
          className="flex-1 resize-none bg-background border border-border rounded-2xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/60 outline-none focus:ring-2 focus:ring-border/50 transition overflow-hidden"
        />
        <button
          onClick={handleSend}
          disabled={!newMsg.trim() || sending}
          className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center disabled:opacity-40 hover:opacity-90 active:scale-95 transition-all shrink-0 mb-px"
        >
          {sending
            ? <div className="w-4 h-4 rounded-full border-2 border-[var(--sage)]-foreground/40 border-t-primary-foreground animate-spin" />
            : <SendIcon size={16} />
          }
        </button>
      </div>
    </div>
  );
}
