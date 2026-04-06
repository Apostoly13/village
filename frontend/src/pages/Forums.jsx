import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Button } from "../components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import Navigation from "../components/Navigation";
import { TrendingUp, Users, Clock, MessageCircle, Heart, Eye, Flame, HelpCircle, BookOpen, Crown, Plus } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

const API_URL = process.env.REACT_APP_BACKEND_URL;

export default function Forums({ user }) {
  const [categories, setCategories] = useState([]);
  const [trendingPosts, setTrendingPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showGuidelines, setShowGuidelines] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [catRes, trendingRes] = await Promise.all([
        fetch(`${API_URL}/api/forums/categories`, { credentials: "include" }),
        fetch(`${API_URL}/api/forums/posts/trending?limit=5`, { credentials: "include" })
      ]);
      
      if (catRes.ok) setCategories(await catRes.json());
      if (trendingRes.ok) setTrendingPosts(await trendingRes.json());
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch {
      return "recently";
    }
  };

  const topicCategories = categories.filter(c => c.category_type === 'topic');
  const ageCategories = categories.filter(c => c.category_type === 'age_group');
  const communities = categories.filter(c => c.category_type === 'community');
  const isPremium = user?.subscription_tier === "premium" || user?.role === "admin";

  const CategoryCard = ({ category, index }) => (
    <Link
      to={`/forums/${category.category_id}`}
      className="block"
      data-testid={`category-card-${index}`}
    >
      <div className="bg-card rounded-xl px-4 py-3 border border-border/50 hover:border-primary/30 transition-all flex items-center gap-3">
        <span className="text-2xl flex-shrink-0">{category.icon}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-semibold text-sm text-foreground truncate">{category.name}</h3>
            <div className="flex items-center gap-2 text-xs text-muted-foreground shrink-0">
              <span className="flex items-center gap-0.5">
                <MessageCircle className="h-3 w-3" />{category.post_count || 0}
              </span>
              {category.active_users > 0 && (
                <span className="flex items-center gap-0.5 text-green-600 dark:text-green-400">
                  <Users className="h-3 w-3" />{category.active_users}
                </span>
              )}
            </div>
          </div>
          <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{category.description}</p>
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
      <div className="bg-card rounded-xl px-4 py-3 border-l-2 border-l-primary/50 border border-border/50 hover:border-primary/30 transition-all flex items-center gap-3">
        <span className="text-2xl flex-shrink-0">{community.icon}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-semibold text-sm text-foreground truncate">{community.name}</h3>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground shrink-0">
              {community.created_by_name && (
                <span className="flex items-center gap-0.5">
                  <Crown className="h-3 w-3 text-amber-500" />{community.created_by_name}
                </span>
              )}
              <span className="flex items-center gap-0.5">
                <MessageCircle className="h-3 w-3" />{community.post_count || 0}
              </span>
            </div>
          </div>
          <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{community.description}</p>
        </div>
      </div>
    </Link>
  );

  const TrendingPostCard = ({ post, index }) => (
    <Link 
      to={`/forums/post/${post.post_id}`}
      className="flex items-start gap-3 p-3 rounded-xl hover:bg-secondary/50 transition-colors"
      data-testid={`trending-post-${index}`}
    >
      <span className="text-xl font-bold text-primary/60">#{index + 1}</span>
      <div className="flex-1 min-w-0">
        <h4 className="font-medium text-foreground text-sm line-clamp-1">{post.title}</h4>
        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
          <span>{post.category_icon}</span>
          <span>{post.category_name}</span>
          <span>•</span>
          <Heart className="h-3 w-3" />
          <span>{post.like_count || 0}</span>
          <MessageCircle className="h-3 w-3" />
          <span>{post.reply_count || 0}</span>
        </div>
      </div>
    </Link>
  );

  return (
    <div className="min-h-screen bg-background pb-20 lg:pb-0">
      <Navigation user={user} />
      
      <main className="max-w-6xl mx-auto px-4 pt-20 lg:pt-24">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Main Content */}
          <div className="flex-1">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="font-heading text-2xl sm:text-3xl font-bold text-foreground mb-2">Support Spaces</h1>
                <p className="text-muted-foreground">Find discussions by topic or your child's age</p>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setShowGuidelines(true)}
                className="rounded-full"
                data-testid="guidelines-btn"
              >
                <BookOpen className="h-4 w-4 mr-2" />
                Guidelines
              </Button>
            </div>

            <Tabs defaultValue="topics" className="w-full">
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

              <TabsContent value="topics" className="mt-0">
                {loading ? (
                  <div className="space-y-2">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="bg-card rounded-xl px-4 py-3 border border-border/50 animate-pulse flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-muted flex-shrink-0"></div>
                        <div className="flex-1 space-y-1.5">
                          <div className="w-3/4 h-4 bg-muted rounded"></div>
                          <div className="w-full h-3 bg-muted rounded"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : topicCategories.length === 0 ? (
                  <div className="text-center py-12 bg-card rounded-2xl border border-border/50">
                    <span className="text-4xl mb-3 block">📁</span>
                    <h3 className="font-heading font-semibold text-foreground mb-1">No categories yet</h3>
                    <p className="text-sm text-muted-foreground">Check back soon!</p>
                  </div>
                ) : (
                  <>
                    {/* Featured: Dad Circle */}
                    {(() => {
                      const dadCircle = topicCategories.find(c => c.name === "Dad Circle");
                      return dadCircle ? (
                        <Link to={`/forums/${dadCircle.category_id}`} className="block mb-4">
                          <div className="rounded-2xl p-5 bg-blue-500/10 border border-blue-500/30 hover:border-blue-500/50 transition-all card-hover flex items-center gap-4">
                            <span className="text-4xl">👨</span>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-0.5">
                                <span className="text-xs font-semibold uppercase tracking-wide text-blue-500">Featured</span>
                              </div>
                              <h3 className="font-heading font-bold text-foreground">{dadCircle.name}</h3>
                              <p className="text-sm text-muted-foreground">{dadCircle.description}</p>
                            </div>
                          </div>
                        </Link>
                      ) : null;
                    })()}
                    <div className="space-y-2">
                      {topicCategories.map((category, idx) => (
                        <CategoryCard key={category.category_id} category={category} index={idx} />
                      ))}
                    </div>
                  </>
                )}
              </TabsContent>

              <TabsContent value="age" className="mt-0">
                {loading ? (
                  <div className="space-y-2">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="bg-card rounded-xl px-4 py-3 border border-border/50 animate-pulse flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-muted flex-shrink-0"></div>
                        <div className="flex-1 space-y-1.5">
                          <div className="w-3/4 h-4 bg-muted rounded"></div>
                          <div className="w-full h-3 bg-muted rounded"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : ageCategories.length === 0 ? (
                  <div className="text-center py-12 bg-card rounded-2xl border border-border/50">
                    <span className="text-4xl mb-3 block">👶</span>
                    <h3 className="font-heading font-semibold text-foreground mb-1">No age groups yet</h3>
                    <p className="text-sm text-muted-foreground">Check back soon!</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {ageCategories.map((category, idx) => (
                      <CategoryCard key={category.category_id} category={category} index={idx} />
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="communities" className="mt-0">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm text-muted-foreground">Member-created communities</p>
                  {isPremium ? (
                    <Link to="/create-community">
                      <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full" data-testid="create-community-btn">
                        <Plus className="h-4 w-4 mr-2" />
                        Create Community
                      </Button>
                    </Link>
                  ) : (
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Crown className="h-3 w-3 text-amber-500" />
                      Upgrade to Premium to create your own community
                    </span>
                  )}
                </div>
                {loading ? (
                  <div className="space-y-2">
                    {[1, 2].map((i) => (
                      <div key={i} className="bg-card rounded-xl px-4 py-3 border border-border/50 animate-pulse flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-muted flex-shrink-0"></div>
                        <div className="flex-1 space-y-1.5">
                          <div className="w-3/4 h-4 bg-muted rounded"></div>
                          <div className="w-full h-3 bg-muted rounded"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : communities.length === 0 ? (
                  <div className="text-center py-12 bg-card rounded-2xl border border-border/50">
                    <span className="text-4xl mb-3 block">🏡</span>
                    <h3 className="font-heading font-semibold text-foreground mb-1">No communities yet</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Premium members can create their own topic communities.
                    </p>
                    {isPremium && (
                      <Link to="/create-community">
                        <Button className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full" data-testid="empty-create-community-btn">
                          <Plus className="h-4 w-4 mr-2" />
                          Create First Community
                        </Button>
                      </Link>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {communities.map((community, idx) => (
                      <CommunityCard key={community.category_id} community={community} index={idx} />
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar - Trending */}
          <div className="lg:w-80">
            <div className="bg-card rounded-2xl border border-border/50 p-4 sticky top-24">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-orange-500/20 flex items-center justify-center">
                  <Flame className="h-4 w-4 text-orange-500" />
                </div>
                <h3 className="font-heading font-bold text-foreground">Trending Now</h3>
              </div>
              
              {loading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="animate-pulse flex gap-3">
                      <div className="w-6 h-6 bg-muted rounded"></div>
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-muted rounded w-full"></div>
                        <div className="h-3 bg-muted rounded w-2/3"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : trendingPosts.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No trending posts yet</p>
              ) : (
                <div className="space-y-1">
                  {trendingPosts.map((post, idx) => (
                    <TrendingPostCard key={post.post_id} post={post} index={idx} />
                  ))}
                </div>
              )}

              {/* Quick Links */}
              <div className="mt-6 pt-4 border-t border-border/50">
                <h4 className="font-medium text-sm text-muted-foreground mb-3">Quick Access</h4>
                <div className="space-y-2">
                  <Link 
                    to="/forums?filter=unanswered"
                    className="flex items-center gap-2 text-sm text-foreground hover:text-primary transition-colors"
                  >
                    <HelpCircle className="h-4 w-4" />
                    Unanswered Posts
                  </Link>
                  <Link
                    to="/saved"
                    className="flex items-center gap-2 text-sm text-foreground hover:text-primary transition-colors"
                  >
                    <BookOpen className="h-4 w-4" />
                    Saved Posts
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
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
