import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Button } from "../components/ui/button";
import Navigation from "../components/Navigation";
import { MessageCircle, Users, BookOpen, Sparkles, Plus, Clock, Lock, MapPin, UserCheck, UserPlus, Search, X } from "lucide-react";
import { IconPin, IconCheck, IconLock } from "../icons";
import { Village, Pram } from "../components/village/icons";
import { toast } from "sonner";
import { parseApiError } from "../utils/apiError";
import AppFooter from "../components/AppFooter";
import { timeAgoVerbose } from "../utils/dateHelpers";
import { getSpaceName } from "../config/spaces";

const API_URL = process.env.REACT_APP_BACKEND_URL;

export default function Forums({ user }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get("tab");
  const showCommunities = tabParam === "communities";
  const defaultTab = ["topics", "age"].includes(tabParam) ? tabParam : "topics";
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showGuidelines, setShowGuidelines] = useState(false);
  // Live gender — starts from prop, updates instantly when profile is saved
  const [liveGender, setLiveGender] = useState(user?.gender);

  useEffect(() => {
    fetchData();

    // Listen for profile updates — update gender instantly without page reload
    const handleProfileUpdate = (e) => {
      if (e.detail?.gender !== undefined) setLiveGender(e.detail.gender);
    };
    window.addEventListener("village:profileUpdated", handleProfileUpdate);
    return () => window.removeEventListener("village:profileUpdated", handleProfileUpdate);
  }, []);

  // Gender filter: hide gender-specific spaces until gender is set; then filter by gender
  const applyGenderFilter = (cats) => {
    const g = liveGender;
    const isMumSpace = (c) => (c.name || "").toLowerCase().includes("mum") || c.category_id === "mum-space";
    const isDadSpace = (c) => (c.name || "").toLowerCase().includes("dad") || c.category_id === "dad-space";

    // Only females see Mum Space; only males see Dad Space; everyone else sees neither
    if (g === "female") return cats.filter(c => !isDadSpace(c));
    if (g === "male")   return cats.filter(c => !isMumSpace(c));
    return cats.filter(c => !isMumSpace(c) && !isDadSpace(c)); // undisclosed / other — show neither
  };

  const fetchData = async () => {
    // Show cached categories immediately while fetching fresh data
    // Note: cache is name-deduped on write, so stale duplicates won't re-appear
    try {
      const cached = sessionStorage.getItem("village_categories_cache");
      if (cached) { setCategories(applyGenderFilter(JSON.parse(cached))); setLoading(false); }
    } catch {}
    try {
      const res = await fetch(`${API_URL}/api/forums/categories`, { credentials: "include" });
      if (res.ok) {
        const raw = await res.json();
        // Deduplicate by category_id first, then by normalised name (catches DB-level name dupes)
        const seenId = new Set();
        const seenName = new Set();
        const data = raw
          .sort((a, b) => (b.post_count || 0) - (a.post_count || 0)) // keep the one with most posts
          .filter(c => {
            if (seenId.has(c.category_id)) return false;
            seenId.add(c.category_id);
            const key = (c.name || "").toLowerCase().trim();
            if (seenName.has(key)) return false;
            seenName.add(key);
            return true;
          });
        setCategories(applyGenderFilter(data));
        try { sessionStorage.setItem("village_categories_cache", JSON.stringify(data)); } catch {}
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinLeave = async (e, community) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) { toast.error("Sign in to join communities"); return; }
    const isJoined = community.is_member;
    try {
      const res = await fetch(`${API_URL}/api/forums/communities/${community.category_id}/${isJoined ? "leave" : "join"}`, {
        method: "POST",
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        setCategories(prev => prev.map(c =>
          c.category_id === community.category_id
            ? { ...c, is_member: data.is_member, member_count: data.member_count }
            : c
        ));
        toast.success(isJoined ? "Left community" : "Joined community");
      } else {
        const err = await res.json();
        toast.error(parseApiError(err.detail, "Something went wrong"));
      }
    } catch {
      toast.error("Something went wrong");
    }
  };

  const formatLast = (dateString) => dateString ? timeAgoVerbose(dateString) : null;

  // Pregnancy & Expecting appears in BOTH tabs (it's an age_group but also a topic)
  const topicCategories = categories.filter(c => c.category_type === "topic" || c.name === "Pregnancy & Expecting");
  const ageCategories = categories.filter(c => c.category_type === "age_group");
  const communities = categories.filter(c => c.category_type === "community");
  const isPremium = user?.subscription_tier === "premium" || user?.role === "admin";

  // Support Spaces differentiator: circular icon container in warm secondary tint
  // vs Chat Spaces: square rounded-xl in primary tint
  const CategoryCard = ({ category, index, accent }) => (
    <Link
      to={`/forums/${category.category_id}`}
      className="block"
      data-testid={`category-card-${index}`}
    >
      <div className={`village-card village-card-hover p-5 h-full ${accent ? accent : ""}`}>
        <div className="flex items-start gap-4">
          {/* Circular icon — key differentiator from Chat Spaces (square) */}
          <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center text-2xl flex-shrink-0">
            {category.icon}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-heading font-medium text-base text-foreground mb-1">{getSpaceName(category.name)}</h3>
            <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{category.description}</p>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <MessageCircle className="h-3.5 w-3.5" />{category.post_count || 0} posts
              </span>
              {category.last_post_at && (
                <span className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />{formatLast(category.last_post_at)}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );

  const FeaturedCard = ({ category, colorClass, borderClass, iconBg, label, labelColor, icon }) => (
    <Link to={`/forums/${category.category_id}`} className="block">
      <div className={`${colorClass} rounded-xl p-5 border ${borderClass} border-l-4 hover:opacity-90 village-card-hover h-full`}>
        <div className="flex items-start gap-4">
          <div className={`w-12 h-12 rounded-full ${iconBg} flex items-center justify-center text-2xl flex-shrink-0`}>
            {icon}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <h3 className="font-heading font-medium text-base text-foreground">{getSpaceName(category.name)}</h3>
              <span className={`text-xs font-semibold ${labelColor}`}>{label}</span>
            </div>
            <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{category.description}</p>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <MessageCircle className="h-3.5 w-3.5" />{category.post_count || 0} posts
              </span>
              {category.last_post_at && (
                <span className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />{formatLast(category.last_post_at)}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );

  const CommunityCard = ({ community, index }) => (
    <Link
      to={`/community/${community.category_id}`}
      className="block"
      data-testid={`community-card-${index}`}
    >
      <div className="village-card village-card-hover p-5 h-full">
        <div className="flex items-start gap-4">
          {/* Icon — image or emoji */}
          <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center text-2xl flex-shrink-0 overflow-hidden">
            {community.icon_url
              ? <img src={community.icon_url} alt={community.name} className="w-full h-full object-cover" />
              : community.icon}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <h3 className="font-heading font-medium text-base text-foreground">{community.name}</h3>
              {community.is_private && <Lock className="h-3.5 w-3.5 text-muted-foreground" />}
              {community.community_subtype === "local" && (
                <span className="text-xs px-1.5 py-0.5 rounded-full font-medium" style={{ background: "var(--clay-wash)", color: "var(--clay-deep)" }}>Local</span>
              )}
              {community.is_member && (
                <span className="text-xs px-1.5 py-0.5 rounded-full font-medium flex items-center gap-1" style={{ background: "var(--sage-wash)", color: "var(--sage-deep)" }}>
                  <UserCheck className="h-3 w-3" />Joined
                </span>
              )}
            </div>
            <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{community.description}</p>
            {community.community_subtype === "local" && community.postcodes?.length > 0 && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
                <MapPin className="h-3 w-3" />
                {community.postcodes.slice(0, 3).join(", ")}{community.postcodes.length > 3 ? ` +${community.postcodes.length - 3}` : ""}
              </div>
            )}
            <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
              {community.created_by_name && (
                <span className="flex items-center gap-1">
                  <Sparkles className="h-3.5 w-3.5" style={{ color: "hsl(var(--accent))" }} />{community.created_by_name}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Users className="h-3.5 w-3.5" />{community.member_count || 0} members
              </span>
              <span className="flex items-center gap-1">
                <MessageCircle className="h-3.5 w-3.5" />{community.post_count || 0} posts
              </span>
            </div>
            {/* Join/Leave button — full width below stats, always inside the card */}
            {user && community.created_by !== user?.user_id && (
              <button
                onClick={(e) => handleJoinLeave(e, community)}
                className={`mt-3 w-full flex items-center justify-center gap-1.5 text-sm py-2 rounded-xl font-medium transition-all ${
                  community.is_member
                    ? "bg-secondary text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                    : ""
                }`}
                style={!community.is_member ? { background: "var(--paper-3)", color: "var(--ink-2)", border: "1px solid var(--line)" } : {}}
              >
                {community.is_member
                  ? <><UserCheck className="h-4 w-4" />Leave community</>
                  : <><UserPlus className="h-4 w-4" />Join community</>}
              </button>
            )}
          </div>
        </div>
      </div>
    </Link>
  );

  const SkeletonGrid = ({ count = 4 }) => (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="village-card p-5 animate-pulse">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-muted flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="w-3/4 h-5 bg-muted rounded" />
              <div className="w-full h-4 bg-muted rounded" />
              <div className="w-2/3 h-3 bg-muted rounded" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  // Match "Mum", "Mums", "Mum Chat" etc.
  const isMum = (c) => /\bmums?\b/i.test(c.name);
  const isDad = (c) => /\bdads?\b/i.test(c.name);

  // Topic filter pills
  const [topicFilter, setTopicFilter] = useState("all");
  const TOPIC_FILTERS = [
    { id: "all",        label: "All" },
    { id: "support",    label: "Support" },
    { id: "parenting",  label: "Parenting" },
    { id: "family",     label: "Family Life" },
    { id: "local",      label: "Local" },
    { id: "ask",        label: "Ask & Share" },
    { id: "wellbeing",  label: "Wellbeing" },
  ];

  const TOPIC_FILTER_MATCH = {
    support:   ["real talk", "parent wellbeing", "solo parents", "mums of the village", "dads of the village", "postnatal recovery"],
    parenting: ["development", "milestones", "health", "wellness", "raising multiples", "neurodiverse", "childcare", "school", "working parents", "screen time", "baby gear", "feeding", "sleep"],
    family:    ["family", "relationships", "family budget", "new parents", "pregnancy", "expecting", "blended", "co-parenting", "working parents"],
    local:     ["local village", "local recommendations"],
    ask:       ["ask the village", "village wins", "baby gear", "recommendations"],
    wellbeing: ["parent wellbeing", "real talk", "solo parents", "postnatal recovery"],
  };

  const applyTopicFilter = (cats) => {
    if (topicFilter === "all") return cats;
    const keywords = TOPIC_FILTER_MATCH[topicFilter] || [];
    return cats.filter(c => {
      if (c.is_location_aware && topicFilter === "local") return true;
      const name = (c.name || "").toLowerCase();
      return keywords.some(kw => name.includes(kw));
    });
  };

  // Age group sort order — youngest to oldest
  const AGE_ORDER = [
"Pregnancy & Expecting",
"Newborns",
"Babies",
"Toddlers",
"Preschool & Kinder",
"Primary School",
"Teenagers",
  ];
  const sortByAge = (cats) =>
    [...cats].sort((a, b) => {
      const ai = AGE_ORDER.indexOf(a.name);
      const bi = AGE_ORDER.indexOf(b.name);
      // Known ages sort by index; unknown ages go to the end
      return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
    });

  // Age filter pills
  const [ageFilter, setAgeFilter] = useState("all");
  const AGE_FILTERS = [
    { id: "all",       label: "All ages" },
    { id: "expecting", label: "Expecting" },
    { id: "baby",      label: "Baby (0–12m)" },
    { id: "toddler",   label: "Toddler & Kinder" },
    { id: "school",    label: "Primary & Teens" },
  ];

  const AGE_FILTER_MATCH = {
    expecting: ["pregnancy", "expecting"],
    baby:      ["newborn", "babies", "baby"],
    toddler:   ["toddler", "preschool", "kinder"],
    school:    ["primary school", "teen"],
  };

  const applyAgeFilter = (cats) => {
    if (ageFilter === "all") return cats;
    const keywords = AGE_FILTER_MATCH[ageFilter] || [];
    return cats.filter(c => {
      const name = (c.name || "").toLowerCase();
      return keywords.some(kw => name.includes(kw));
    });
  };

  // Community search + sort state
  const [communitySearch, setCommunitySearch] = useState("");
  const [communitySort, setCommunitySort] = useState("popular");   // popular | newest | members | posts
  const filterParam = searchParams.get("filter");
  const [communityFilter, setCommunityFilter] = useState(
    ["all", "local", "joined", "open", "private"].includes(filterParam) ? filterParam : "all"
  );   // all | local | joined | open | private

  const filteredCommunities = communities
    .filter(c => {
      if (communitySearch.trim()) {
        const q = communitySearch.toLowerCase();
        return c.name?.toLowerCase().includes(q) || c.description?.toLowerCase().includes(q);
      }
      return true;
    })
    .filter(c => {
      if (communityFilter === "local")   return c.community_subtype === "local";
      if (communityFilter === "joined")  return c.is_member;
      if (communityFilter === "open")    return !c.is_private;
      if (communityFilter === "private") return c.is_private;
      return true;
    })
    .sort((a, b) => {
      if (communitySort === "newest")  return new Date(b.created_at || 0) - new Date(a.created_at || 0);
      if (communitySort === "members") return (b.member_count || 0) - (a.member_count || 0);
      if (communitySort === "posts")   return (b.post_count || 0) - (a.post_count || 0);
      // popular: weighted score
      return ((b.member_count || 0) * 2 + (b.post_count || 0)) - ((a.member_count || 0) * 2 + (a.post_count || 0));
    });

  return (
    <div className="min-h-screen bg-background  lg:pl-60 lg:pb-0">
      <Navigation user={user} />

      <main className="max-w-5xl mx-auto px-4 pt-16 lg:pt-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            {showCommunities ? (
              <>
                <h1 className="font-heading text-2xl sm:text-3xl font-bold text-foreground mb-1">Communities</h1>
                <p className="text-sm text-muted-foreground">Member-created groups — local, topic-based, open or private</p>
              </>
            ) : (
              <>
                <h1 className="font-heading text-2xl sm:text-3xl font-bold text-foreground mb-1">Spaces</h1>
                <p className="text-sm text-muted-foreground">Discussion threads by topic and age group — post, reply, and support each other</p>
              </>
            )}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowGuidelines(true)}
            className="rounded-xl"
            data-testid="guidelines-btn"
          >
            <BookOpen className="h-4 w-4 mr-2" />
            Guidelines
          </Button>
        </div>

        {showCommunities ? (
          /* ── Communities standalone section ───────────────────────────── */
          <div className="w-full">
            <p className="text-sm text-muted-foreground mb-4">
              {isPremium ? "Browse and join member-created communities" : "Village+ members can create and join communities"}
            </p>

            {/* Search bar + Create Community */}
            {isPremium && !loading && (
              <div className="space-y-3 mb-5">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                      value={communitySearch}
                      onChange={e => setCommunitySearch(e.target.value)}
                      placeholder="Search communities…"
                      className="w-full pl-9 pr-3 py-2 text-sm rounded-xl bg-card border border-border/50 text-foreground placeholder:text-muted-foreground outline-none"
                      style={{ height: 38 }}
                    />
                    {communitySearch && (
                      <button onClick={() => setCommunitySearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                        <X className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                  <Link to="/create-community">
                    <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl h-[38px]" data-testid="create-community-btn">
                      <Plus className="h-4 w-4 mr-1.5" />
                      Create
                    </Button>
                  </Link>
                </div>

                {/* Filter pills + sort — below search */}
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="flex gap-1.5 flex-wrap flex-1">
                    {[
                      { id: "all",    label: "All" },
                      { id: "local",  label: <><IconPin size={12} className="inline mr-0.5" />Local</> },
                      { id: "joined", label: <><IconCheck size={12} className="inline mr-0.5" />Joined</> },
                      { id: "open",   label: "Open" },
                    ].map(f => (
                      <button key={f.id} onClick={() => setCommunityFilter(f.id)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors border ${communityFilter === f.id ? "border-[var(--sage)]/30 sage-pill-active" : "border-transparent text-[var(--ink-3)] hover:text-[var(--ink)]"}`}
                        style={communityFilter === f.id ? { background: "var(--sage-wash)", color: "var(--sage-deep)" } : {}}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                  <select
                    value={communitySort}
                    onChange={e => setCommunitySort(e.target.value)}
                    className="px-3 py-1.5 rounded-xl text-xs font-medium bg-card border border-border/50 text-foreground outline-none cursor-pointer shrink-0"
                    style={{ height: 32 }}
                  >
                    <option value="popular">Most popular</option>
                    <option value="newest">Newest</option>
                    <option value="members">Most members</option>
                    <option value="posts">Most active</option>
                  </select>
                </div>
              </div>
            )}

            {!isPremium ? (
              <div className="village-card overflow-hidden">
                <div className="relative">
                  <div className="p-6 space-y-3 blur-sm pointer-events-none select-none opacity-60">
                    {[1,2,3].map(i => (
                      <div key={i} className="flex items-start gap-4 p-4 rounded-xl bg-secondary/30">
                        <div className="w-10 h-10 rounded-full bg-secondary flex-shrink-0" />
                        <div className="flex-1 space-y-2">
                          <div className="h-4 bg-muted rounded w-1/3" />
                          <div className="h-3 bg-muted rounded w-2/3" />
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-card/80 backdrop-blur-[2px] p-8 text-center">
                    <div className="w-14 h-14 rounded-full bg-[var(--paper-3)] flex items-center justify-center mb-4">
                      <Sparkles className="h-7 w-7" style={{ color: "hsl(var(--accent))" }} />
                    </div>
                    <h3 className="font-heading font-medium text-xl text-foreground mb-2">Communities are a Village+ feature</h3>
                    <p className="text-sm text-muted-foreground mb-1 max-w-sm">
                      Create and join member communities — local, topic-based, private or open.
                    </p>
                    <p className="text-xs text-muted-foreground mb-6">Free members can browse Spaces and Group Chats.</p>
                    <Link to="/plus">
                      <Button className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full px-8">
                        <Sparkles className="h-4 w-4 mr-2" style={{ color: "hsl(var(--accent))" }} />
                        Upgrade to Village+
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            ) : loading ? (
              <SkeletonGrid count={2} />
            ) : communities.length === 0 ? (
              <div className="text-center py-12 village-card">
                <div className="flex justify-center mb-3 text-muted-foreground/40"><Village size={40} /></div>
                <h3 className="font-heading font-semibold text-foreground mb-1">No communities yet</h3>
                <p className="text-sm text-muted-foreground mb-4">Be the first to create one.</p>
                <Link to="/create-community">
                  <Button className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl" data-testid="empty-create-community-btn">
                    <Plus className="h-4 w-4 mr-2" />
                    Create First Community
                  </Button>
                </Link>
              </div>
            ) : filteredCommunities.length === 0 ? (
              <div className="text-center py-12 village-card">
                <div className="flex justify-center mb-3 text-muted-foreground/40"><Search size={40} /></div>
                <h3 className="font-heading font-semibold text-foreground mb-1">No communities match</h3>
                <p className="text-sm text-muted-foreground">Try a different search or filter.</p>
                <button onClick={() => { setCommunitySearch(""); setCommunityFilter("all"); }}
                  className="mt-3 text-xs text-primary underline underline-offset-2">Clear filters</button>
              </div>
            ) : (() => {
              const myCommunities    = filteredCommunities.filter(c => c.is_member);
              const otherCommunities = filteredCommunities.filter(c => !c.is_member);
              return (
                <>
                  {(communitySearch || communityFilter !== "all") && (
                    <p className="text-xs mb-3" style={{ color: "var(--ink-3)" }}>
                      {filteredCommunities.length} of {communities.length} communities
                    </p>
                  )}

                  {/* My Communities */}
                  {myCommunities.length > 0 ? (
                    <div className="mb-8">
                      <div className="flex items-center gap-2 mb-3">
                        <h3 className="font-heading font-semibold text-sm" style={{ color: "var(--ink)" }}>My Communities</h3>
                        <span className="text-[11px] font-medium px-1.5 py-0.5 rounded-full" style={{ background: "var(--sage-wash)", color: "var(--sage-deep)" }}>
                          {myCommunities.length}
                        </span>
                      </div>
                      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {myCommunities.map((community, idx) => (
                          <CommunityCard key={community.category_id} community={community} index={idx} />
                        ))}
                      </div>
                    </div>
                  ) : !communitySearch && communityFilter === "all" ? (
                    <div className="mb-8 rounded-2xl p-5 text-center" style={{ background: "var(--paper-3)", border: "1px solid var(--line)" }}>
                      <p className="text-sm font-medium mb-1" style={{ color: "var(--ink)" }}>You haven't joined any communities yet</p>
                      <p className="text-xs" style={{ color: "var(--ink-3)" }}>Browse below and join one to get started.</p>
                    </div>
                  ) : null}

                  {/* Discover other communities */}
                  {otherCommunities.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <h3 className="font-heading font-semibold text-sm" style={{ color: "var(--ink)" }}>
                          {myCommunities.length > 0 ? "Discover More" : "All Communities"}
                        </h3>
                        <span className="text-[11px] font-medium px-1.5 py-0.5 rounded-full" style={{ background: "var(--paper-2)", color: "var(--ink-3)", border: "1px solid var(--line)" }}>
                          {otherCommunities.length}
                        </span>
                      </div>
                      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {otherCommunities.map((community, idx) => (
                          <CommunityCard key={community.category_id} community={community} index={idx} />
                        ))}
                      </div>
                    </div>
                  )}
                </>
              );
            })()}
          </div>
        ) : (
          /* ── Spaces: By Topic + By Age Group ─────────────────────────── */
          <Tabs defaultValue={defaultTab} onValueChange={(v) => setSearchParams({ tab: v }, { replace: true })} className="w-full">
            <TabsList className="w-full rounded-xl p-1 mb-6" style={{ background: "var(--paper-3)", border: "1px solid var(--line)" }}>
              <TabsTrigger
                value="topics"
                className="flex-1 rounded-lg data-[state=active]:bg-[var(--ink)] data-[state=active]:text-[var(--paper)] data-[state=active]:shadow-sm"
                data-testid="tab-topics"
              >
                By Topic
              </TabsTrigger>
              <TabsTrigger
                value="age"
                className="flex-1 rounded-lg data-[state=active]:bg-[var(--ink)] data-[state=active]:text-[var(--paper)] data-[state=active]:shadow-sm"
                data-testid="tab-age"
              >
                By Age Group
              </TabsTrigger>
            </TabsList>

            {/* TOPICS */}
            <TabsContent value="topics" className="mt-0">
              {/* Topic filter pills */}
              {!loading && topicCategories.length > 0 && (
                <div className="flex gap-1.5 flex-wrap mb-5">
                  {TOPIC_FILTERS.map(f => (
                    <button
                      key={f.id}
                      onClick={() => setTopicFilter(f.id)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors border ${
                        topicFilter === f.id
                          ? "border-[var(--sage)]/30 sage-pill-active"
                          : "border-transparent text-[var(--ink-3)] hover:text-[var(--ink)]"
                      }`}
                      style={topicFilter === f.id ? { background: "var(--sage-wash)", color: "var(--sage-deep)" } : {}}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              )}
              {loading ? (
                <SkeletonGrid count={6} />
              ) : topicCategories.length === 0 ? (
                <div className="text-center py-12 village-card">
                  <div className="flex justify-center mb-3 text-muted-foreground/40"><Search size={40} /></div>
                  <h3 className="font-heading font-semibold text-foreground mb-1">No categories yet</h3>
                  <p className="text-sm text-muted-foreground">Check back soon!</p>
                </div>
              ) : (
                <>
                  {/* Featured gender-specific spaces — only shown when filter is "all" or matches */}
                  {topicFilter === "all" && (() => {
                    const mumSpace = liveGender === "female" ? topicCategories.find(isMum) : null;
                    const dadSpace = liveGender === "male"? topicCategories.find(isDad) : null;
                    if (!mumSpace && !dadSpace) return null;
                    const isSingle = !mumSpace || !dadSpace;
                    return (
                      <div className={`grid gap-4 mb-4 ${isSingle ? "" : "sm:grid-cols-2"}`}>
                        {mumSpace && (
                          <FeaturedCard
                            category={mumSpace}
                            colorClass="bg-pink-500/8 dark:bg-pink-500/10"
                            borderClass="border-pink-400/30 hover:border-pink-400/50"
                            iconBg="bg-pink-500/20"
                            icon="👩"
                            label="Featured"
                            labelColor="text-pink-500"
                          />
                        )}
                        {dadSpace && (
                          <FeaturedCard
                            category={dadSpace}
                            colorClass="bg-blue-500/8 dark:bg-blue-500/10"
                            borderClass="border-blue-400/30 hover:border-blue-400/50"
                            iconBg="bg-blue-500/20"
                            icon="👨"
                            label="Featured"
                            labelColor="text-blue-500"
                          />
                        )}
                      </div>
                    );
                  })()}
                  {(() => {
                    const filtered = applyTopicFilter(
                      topicCategories.filter(c => topicFilter === "all" ? (!isMum(c) && !isDad(c)) : true)
                    );
                    if (filtered.length === 0) {
                      return (
                        <div className="text-center py-10 village-card">
                          <p className="text-sm text-muted-foreground">No spaces match this filter.</p>
                          <button onClick={() => setTopicFilter("all")}
                            className="mt-2 text-xs text-primary underline underline-offset-2">Show all</button>
                        </div>
                      );
                    }
                    return (
                      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filtered.map((category, idx) => (
                          <CategoryCard key={category.category_id} category={category} index={idx} />
                        ))}
                      </div>
                    );
                  })()}
                </>
              )}
            </TabsContent>

            {/* AGE GROUPS */}
            <TabsContent value="age" className="mt-0">
              {/* Age filter pills */}
              {!loading && ageCategories.length > 0 && (
                <div className="flex gap-1.5 flex-wrap mb-5">
                  {AGE_FILTERS.map(f => (
                    <button
                      key={f.id}
                      onClick={() => setAgeFilter(f.id)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors border ${
                        ageFilter === f.id
                          ? "border-[var(--sage)]/30 sage-pill-active"
                          : "border-transparent text-[var(--ink-3)] hover:text-[var(--ink)]"
                      }`}
                      style={ageFilter === f.id ? { background: "var(--sage-wash)", color: "var(--sage-deep)" } : {}}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              )}
              {loading ? (
                <SkeletonGrid count={4} />
              ) : ageCategories.length === 0 ? (
                <div className="text-center py-12 village-card">
                  <div className="flex justify-center mb-3 text-muted-foreground/40"><Pram size={40} /></div>
                  <h3 className="font-heading font-semibold text-foreground mb-1">No age groups yet</h3>
                  <p className="text-sm text-muted-foreground">Check back soon!</p>
                </div>
              ) : (() => {
                const filtered = sortByAge(applyAgeFilter(ageCategories));
                if (filtered.length === 0) {
                  return (
                    <div className="text-center py-10 village-card">
                      <p className="text-sm text-muted-foreground">No age groups match this filter.</p>
                      <button onClick={() => setAgeFilter("all")}
                        className="mt-2 text-xs text-primary underline underline-offset-2">Show all</button>
                    </div>
                  );
                }
                return (
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filtered.map((category, idx) => (
                      <CategoryCard key={category.category_id} category={category} index={idx} />
                    ))}
                  </div>
                );
              })()}
            </TabsContent>
          </Tabs>
        )}

        <AppFooter />
      </main>

      {/* Community Guidelines Modal */}
      {showGuidelines && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowGuidelines(false)}>
          <div className="village-card max-w-lg w-full max-h-[80vh] overflow-y-auto p-6" onClick={e => e.stopPropagation()}>
            <h2 className="font-heading text-xl font-bold text-foreground mb-4 flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              Community Guidelines
            </h2>
            <div className="space-y-4 text-sm text-foreground">
              <div>
                <h3 className="font-semibold mb-2">🤝 Be Respectful</h3>
                <p className="text-muted-foreground">Treat others with kindness. We're all here to support each other through the challenges of parenting.</p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">💚 Share Thoughtfully</h3>
                <p className="text-muted-foreground">Remember that everyone's parenting journey is different. Avoid judgment and focus on sharing experiences, not telling others what to do.</p>
              </div>
              <div>
                <h3 className="font-semibold mb-2 flex items-center gap-1"><IconLock size={14} /> Protect Privacy</h3>
                <p className="text-muted-foreground">Don't share personal information about others. Use the anonymous posting feature if you need to discuss sensitive topics.</p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">⚕️ Seek Professional Help</h3>
                <p className="text-muted-foreground">For medical, legal, or mental health concerns, always consult a professional. Our community offers support, not professional advice.</p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">🚫 Zero Tolerance</h3>
                <p className="text-muted-foreground">Harassment, hate speech, spam, or any form of abuse will result in immediate removal from the community.</p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">🚩 Report Concerns</h3>
                <p className="text-muted-foreground">If you see something that violates our guidelines, please use the report feature. Together, we keep The Village safe.</p>
              </div>
            </div>
            <Button
              onClick={() => setShowGuidelines(false)}
              className="w-full mt-6 rounded-full bg-primary text-primary-foreground"
            >
              I Understand
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
