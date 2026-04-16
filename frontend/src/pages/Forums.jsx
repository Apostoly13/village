import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Button } from "../components/ui/button";
import Navigation from "../components/Navigation";
import { MessageCircle, Users, BookOpen, Crown, Plus, Clock, Lock, MapPin, UserCheck, UserPlus, Search, X } from "lucide-react";
import { toast } from "sonner";
import { parseApiError } from "../utils/apiError";
import { formatDistanceToNow } from "date-fns";
import AppFooter from "../components/AppFooter";
import { getSpaceName } from "../config/spaces";

const API_URL = process.env.REACT_APP_BACKEND_URL;

export default function Forums({ user }) {
  const [searchParams] = useSearchParams();
  const defaultTab = ["topics", "age", "communities"].includes(searchParams.get("tab")) ? searchParams.get("tab") : "topics";
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showGuidelines, setShowGuidelines] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  // Gender filter: hide gender-specific spaces until gender is set; then filter by gender
  const applyGenderFilter = (cats) => {
    const g = user?.gender;
    const isMumSpace = (c) => (c.name || "").toLowerCase().includes("mum") || c.category_id === "mum-circle";
    const isDadSpace = (c) => (c.name || "").toLowerCase().includes("dad") || c.category_id === "dad-circle";

    if (!g) {
      // Gender not set — hide all gender-specific spaces until profile is complete
      return cats.filter(c => !isMumSpace(c) && !isDadSpace(c));
    }
    if (g === "male")   return cats.filter(c => !isMumSpace(c));
    if (g === "female") return cats.filter(c => !isDadSpace(c));
    return cats; // "other" / "prefer-not-say" — show all
  };

  const fetchData = async () => {
    // Show cached categories immediately while fetching fresh data
    try {
      const cached = sessionStorage.getItem("village_categories_cache");
      if (cached) { setCategories(applyGenderFilter(JSON.parse(cached))); setLoading(false); }
    } catch {}
    try {
      const res = await fetch(`${API_URL}/api/forums/categories`, { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setCategories(applyGenderFilter(data));
        try { sessionStorage.setItem("village_categories_cache", JSON.stringify(data)); } catch {}
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
    } finally {
      setLoading(false);
    }
  };

  const searchPosts = async (q) => {
    if (!q || q.trim().length < 2) { setSearchResults([]); return; }
    setSearching(true);
    try {
      const res = await fetch(`${API_URL}/api/forums/posts?search=${encodeURIComponent(q.trim())}&limit=20`, { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setSearchResults(Array.isArray(data) ? data : (data.posts || []));
      }
    } catch {}
    finally { setSearching(false); }
  };

  // Debounced search
  useEffect(() => {
    const t = setTimeout(() => { if (searchQuery) searchPosts(searchQuery); else setSearchResults([]); }, 400);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]);

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

  const formatLast = (dateString) => {
    if (!dateString) return null;
    try { return formatDistanceToNow(new Date(dateString), { addSuffix: true }); }
    catch { return null; }
  };

  const topicCategories = categories.filter(c => c.category_type === "topic");
  const ageCategories = categories.filter(c => c.category_type === "age_group");
  const communities = categories.filter(c => c.category_type === "community");
  const isPremium = user?.subscription_tier === "premium" || user?.role === "admin";

  // Support Spaces differentiator: circular icon container in warm secondary tint
  // vs Chat Circles: square rounded-xl in primary tint
  const CategoryCard = ({ category, index, accent }) => (
    <Link
      to={`/forums/${category.category_id}`}
      className="block"
      data-testid={`category-card-${index}`}
    >
      <div className={`bg-card rounded-2xl p-5 border border-border/50 border-l-2 border-l-primary/20 hover:border-primary/30 hover:border-l-primary/40 transition-all h-full card-hover ${accent ? accent : ""}`}>
        <div className="flex items-start gap-4">
          {/* Circular icon — key differentiator from Chat Circles (square) */}
          <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center text-2xl flex-shrink-0">
            {category.icon}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-heading font-bold text-base text-foreground mb-1">{getSpaceName(category.name)}</h3>
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
      <div className={`${colorClass} rounded-2xl p-5 border ${borderClass} border-l-4 hover:opacity-90 transition-all h-full card-hover`}>
        <div className="flex items-start gap-4">
          <div className={`w-12 h-12 rounded-full ${iconBg} flex items-center justify-center text-2xl flex-shrink-0`}>
            {icon}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <h3 className="font-heading font-bold text-base text-foreground">{getSpaceName(category.name)}</h3>
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
      to={`/forums/${community.category_id}`}
      className="block"
      data-testid={`community-card-${index}`}
    >
      <div className="bg-card rounded-2xl p-5 border-l-4 border-l-primary/50 border border-border/50 hover:border-primary/30 transition-all h-full card-hover">
        <div className="flex items-start gap-4">
          {/* Icon — image or emoji */}
          <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center text-2xl flex-shrink-0 overflow-hidden">
            {community.icon_url
              ? <img src={community.icon_url} alt={community.name} className="w-full h-full object-cover" />
              : community.icon}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <h3 className="font-heading font-bold text-base text-foreground">{community.name}</h3>
              {community.is_private && <Lock className="h-3.5 w-3.5 text-muted-foreground" />}
              {community.community_subtype === "local" && (
                <span className="text-xs px-1.5 py-0.5 rounded-full bg-primary/10 text-primary font-medium">Local</span>
              )}
              {community.is_member && (
                <span className="text-xs px-1.5 py-0.5 rounded-full bg-green-500/15 text-green-600 dark:text-green-400 font-medium flex items-center gap-1">
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
                  <Crown className="h-3.5 w-3.5 text-amber-500" />{community.created_by_name}
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
                className={`mt-3 w-full flex items-center justify-center gap-1.5 text-sm py-2 rounded-xl font-medium transition-colors ${
                  community.is_member
                    ? "bg-secondary text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                    : "bg-primary/10 text-primary hover:bg-primary/20"
                }`}
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
        <div key={i} className="bg-card rounded-2xl p-5 border border-border/50 animate-pulse">
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

  const isMum = (c) => /\bmum\b/i.test(c.name);
  const isDad = (c) => /\bdad\b/i.test(c.name);

  return (
    <div className="min-h-screen bg-background pb-20 lg:pb-0">
      <Navigation user={user} />

      <main className="max-w-5xl mx-auto px-4 pt-20 lg:pt-24">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-heading text-2xl sm:text-3xl font-bold text-foreground mb-1">Support Spaces</h1>
            <p className="text-sm text-muted-foreground">Discussion threads by topic and age group — post, reply, and connect</p>
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

        {/* Search bar */}
        <div className="relative mb-6">
          <div className="flex items-center gap-2 bg-card border border-border/50 rounded-2xl px-4 py-3">
            <Search className="h-4 w-4 text-muted-foreground shrink-0" />
            <input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onKeyDown={e => e.key === "Enter" && e.preventDefault()}
              placeholder="Search posts and topics..."
              className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
            />
            {searchQuery && (
              <button onClick={() => { setSearchQuery(""); setSearchResults([]); }} className="text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          {/* Search results dropdown */}
          {searchQuery.length >= 2 && (
            <div className="absolute top-full left-0 right-0 z-50 mt-2 bg-card border border-border/50 rounded-2xl shadow-lg overflow-hidden">
              {searching && (
                <div className="p-4 text-center text-sm text-muted-foreground">Searching...</div>
              )}
              {!searching && searchResults.length === 0 && searchQuery.length >= 2 && (
                <div className="p-4 text-center text-sm text-muted-foreground">No posts found for "{searchQuery}"</div>
              )}
              {!searching && searchResults.filter(post => post?.post_id).map(post => (
                <Link
                  key={post.post_id}
                  to={`/forums/post/${post.post_id}`}
                  onClick={() => { setSearchQuery(""); setSearchResults([]); }}
                  className="flex items-start gap-3 px-4 py-3 hover:bg-secondary/50 border-b border-border/30 last:border-0 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground line-clamp-1">{post.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{post.body?.substring(0, 80)}</p>
                  </div>
                  <span className="text-xs text-muted-foreground shrink-0 mt-0.5">{post.reply_count} replies</span>
                </Link>
              ))}
            </div>
          )}
        </div>

        <Tabs defaultValue={defaultTab} className="w-full">
          <TabsList className="w-full bg-card border border-border/50 rounded-xl p-1 mb-6">
            <TabsTrigger
              value="topics"
              className="flex-1 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              data-testid="tab-topics"
            >
              By Topic
            </TabsTrigger>
            <TabsTrigger
              value="age"
              className="flex-1 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              data-testid="tab-age"
            >
              By Age Group
            </TabsTrigger>
            <TabsTrigger
              value="communities"
              className="flex-1 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              data-testid="tab-communities"
            >
              Communities
            </TabsTrigger>
          </TabsList>

          {/* TOPICS */}
          <TabsContent value="topics" className="mt-0">
            {loading ? (
              <SkeletonGrid count={6} />
            ) : topicCategories.length === 0 ? (
              <div className="text-center py-12 bg-card rounded-2xl border border-border/50">
                <span className="text-4xl mb-3 block">📁</span>
                <h3 className="font-heading font-semibold text-foreground mb-1">No categories yet</h3>
                <p className="text-sm text-muted-foreground">Check back soon!</p>
              </div>
            ) : (
              <>
                {/* Featured: Mum Circle / Dad Circle — gender filtered, full-width when only one */}
                {(() => {
                  const g = user?.gender;
                  // Males don't see Mum Circle; females don't see Dad Circle
                  const mumSpace = g !== "male"   ? topicCategories.find(isMum) : null;
                  const dadSpace = g !== "female" ? topicCategories.find(isDad) : null;
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

                {/* Remaining topics — 3-col grid on large screens */}
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {topicCategories
                    .filter(c => !isMum(c) && !isDad(c))
                    .map((category, idx) => (
                      <CategoryCard key={category.category_id} category={category} index={idx} />
                    ))}
                </div>
              </>
            )}
          </TabsContent>

          {/* AGE GROUPS */}
          <TabsContent value="age" className="mt-0">
            {loading ? (
              <SkeletonGrid count={4} />
            ) : ageCategories.length === 0 ? (
              <div className="text-center py-12 bg-card rounded-2xl border border-border/50">
                <span className="text-4xl mb-3 block">👶</span>
                <h3 className="font-heading font-semibold text-foreground mb-1">No age groups yet</h3>
                <p className="text-sm text-muted-foreground">Check back soon!</p>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {ageCategories.map((category, idx) => (
                  <CategoryCard key={category.category_id} category={category} index={idx} />
                ))}
              </div>
            )}
          </TabsContent>

          {/* COMMUNITIES */}
          <TabsContent value="communities" className="mt-0">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-muted-foreground">
                {isPremium ? "Browse and join member-created communities" : "Member communities — Village+ feature"}
              </p>
              {isPremium && (
                <Link to="/create-community">
                  <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl" data-testid="create-community-btn">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Community
                  </Button>
                </Link>
              )}
            </div>

            {!isPremium ? (
              /* Village+ upgrade wall */
              <div className="rounded-2xl border border-border/50 bg-card overflow-hidden">
                {/* Blurred preview of what's behind the gate */}
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
                  {/* Overlay */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-card/80 backdrop-blur-[2px] p-8 text-center">
                    <div className="w-14 h-14 rounded-full bg-amber-500/10 flex items-center justify-center mb-4">
                      <Crown className="h-7 w-7 text-amber-500" />
                    </div>
                    <h3 className="font-heading font-bold text-xl text-foreground mb-2">Communities are a Village+ feature</h3>
                    <p className="text-sm text-muted-foreground mb-1 max-w-sm">
                      Create and join member communities — local, topic-based, private or open. Up to 3 communities per Village+ member.
                    </p>
                    <p className="text-xs text-muted-foreground mb-6">Free members can browse Support Spaces and Chat Circles.</p>
                    <Link to="/premium">
                      <Button className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full px-8">
                        <Crown className="h-4 w-4 mr-2" />
                        Upgrade to Village+
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            ) : loading ? (
              <SkeletonGrid count={2} />
            ) : communities.length === 0 ? (
              <div className="text-center py-12 bg-card rounded-2xl border border-border/50">
                <span className="text-4xl mb-3 block">🏡</span>
                <h3 className="font-heading font-semibold text-foreground mb-1">No communities yet</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Village+ members can create topic or local communities.
                </p>
                {isPremium && (
                  <Link to="/create-community">
                    <Button className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl" data-testid="empty-create-community-btn">
                      <Plus className="h-4 w-4 mr-2" />
                      Create First Community
                    </Button>
                  </Link>
                )}
              </div>
            ) : (
              <>
                {/* Local Communities */}
                {communities.filter(c => c.community_subtype === "local").length > 0 && (
                  <div className="mb-8">
                    <div className="flex items-center gap-2 mb-4">
                      <MapPin className="h-4 w-4 text-primary" />
                      <h2 className="font-heading font-semibold text-foreground">Local Communities</h2>
                      <span className="text-xs text-muted-foreground">({communities.filter(c => c.community_subtype === "local").length})</span>
                    </div>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {communities
                        .filter(c => c.community_subtype === "local")
                        .map((community, idx) => (
                          <CommunityCard key={community.category_id} community={community} index={`local-${idx}`} />
                        ))}
                    </div>
                  </div>
                )}

                {/* General Communities */}
                {communities.filter(c => c.community_subtype !== "local").length > 0 && (
                  <div>
                    {communities.filter(c => c.community_subtype === "local").length > 0 && (
                      <div className="flex items-center gap-2 mb-4">
                        <Users className="h-4 w-4 text-primary" />
                        <h2 className="font-heading font-semibold text-foreground">General Communities</h2>
                        <span className="text-xs text-muted-foreground">({communities.filter(c => c.community_subtype !== "local").length})</span>
                      </div>
                    )}
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {communities
                        .filter(c => c.community_subtype !== "local")
                        .map((community, idx) => (
                          <CommunityCard key={community.category_id} community={community} index={idx} />
                        ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </TabsContent>
        </Tabs>

        <AppFooter />
      </main>

      {/* Community Guidelines Modal */}
      {showGuidelines && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowGuidelines(false)}>
          <div className="bg-card rounded-2xl max-w-lg w-full max-h-[80vh] overflow-y-auto p-6" onClick={e => e.stopPropagation()}>
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
                <h3 className="font-semibold mb-2">🔒 Protect Privacy</h3>
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
