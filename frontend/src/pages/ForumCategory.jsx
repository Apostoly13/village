import { useState, useEffect } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import Navigation from "../components/Navigation";
import { ArrowLeft, Plus, MessageCircle, Heart, Eye, Clock, Filter, ChevronLeft, ChevronRight, HelpCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

const API_URL = process.env.REACT_APP_BACKEND_URL;

export default function ForumCategory({ user }) {
  const { categoryId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [category, setCategory] = useState(null);
  const [posts, setPosts] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  
  const [sortBy, setSortBy] = useState(searchParams.get("sort") || "newest");
  const [filterType, setFilterType] = useState(searchParams.get("filter") || "all");
  const [currentPage, setCurrentPage] = useState(1);
  const postsPerPage = 10;

  useEffect(() => {
    fetchData();
  }, [categoryId, sortBy, filterType, currentPage]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const skip = (currentPage - 1) * postsPerPage;
      const filterParam = filterType !== "all" ? `&filter_type=${filterType}` : "";
      
      const [catRes, postsRes] = await Promise.all([
        fetch(`${API_URL}/api/forums/categories/${categoryId}`, { credentials: "include" }),
        fetch(`${API_URL}/api/forums/posts?category_id=${categoryId}&sort=${sortBy}&limit=${postsPerPage}&skip=${skip}${filterParam}`, { credentials: "include" })
      ]);

      if (catRes.ok) setCategory(await catRes.json());
      if (postsRes.ok) {
        const data = await postsRes.json();
        setPosts(data.posts || data);
        setTotal(data.total || (data.posts ? data.posts.length : data.length));
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSortChange = (value) => {
    setSortBy(value);
    setCurrentPage(1);
    setSearchParams({ sort: value, filter: filterType });
  };

  const handleFilterChange = (value) => {
    setFilterType(value);
    setCurrentPage(1);
    setSearchParams({ sort: sortBy, filter: value });
  };

  const totalPages = Math.ceil(total / postsPerPage);

  const formatDate = (dateString) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch {
      return "recently";
    }
  };

  const PostCard = ({ post, index }) => (
    <article 
      className="bg-card rounded-2xl p-6 border border-border/50 hover:border-primary/30 transition-all card-hover"
      data-testid={`post-card-${index}`}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          {post.author_id !== "anonymous" ? (
            <Link to={`/profile/${post.author_id}`} onClick={e => e.stopPropagation()}>
              <Avatar className="h-10 w-10 cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all">
                <AvatarImage src={post.author_picture} />
                <AvatarFallback className="bg-primary/20 text-primary">
                  {post.author_name?.[0]?.toUpperCase() || '?'}
                </AvatarFallback>
              </Avatar>
            </Link>
          ) : (
            <Avatar className="h-10 w-10">
              <AvatarFallback className="bg-primary/20 text-primary">?</AvatarFallback>
            </Avatar>
          )}
          <div>
            {post.author_id !== "anonymous" ? (
              <Link to={`/profile/${post.author_id}`} className="hover:underline" onClick={e => e.stopPropagation()}>
                <p className="font-medium text-foreground hover:text-primary transition-colors">{post.author_name}</p>
              </Link>
            ) : (
              <p className="font-medium text-foreground">{post.author_name}</p>
            )}
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span>{formatDate(post.created_at)}</span>
              {post.is_edited && <span className="text-xs">(edited)</span>}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {post.is_pinned && (
            <span className="text-xs px-2 py-1 rounded-full bg-primary/20 text-primary">Pinned</span>
          )}
          {post.is_anonymous && (
            <span className="text-xs px-2 py-1 rounded-full bg-secondary text-muted-foreground">Anonymous</span>
          )}
          {post.reply_count === 0 && (
            <span className="text-xs px-2 py-1 rounded-full bg-orange-500/10 text-orange-600 dark:text-orange-400 flex items-center gap-1">
              <HelpCircle className="h-3 w-3" />
              Needs Reply
            </span>
          )}
        </div>
      </div>

      <Link to={`/forums/post/${post.post_id}`}>
        <h3 className="font-heading font-bold text-lg text-foreground mb-2 hover:text-primary transition-colors">{post.title}</h3>
        <p className="text-muted-foreground line-clamp-2 mb-4">{post.content}</p>
      </Link>

      <div className="flex items-center gap-4 text-sm text-muted-foreground">
        <div className="flex items-center gap-1">
          <Heart className="h-4 w-4" />
          <span>{post.like_count || 0}</span>
        </div>
        <div className="flex items-center gap-1">
          <MessageCircle className="h-4 w-4" />
          <span>{post.reply_count || 0}</span>
        </div>
        <div className="flex items-center gap-1">
          <Eye className="h-4 w-4" />
          <span>{post.views || 0}</span>
        </div>
      </div>
    </article>
  );

  return (
    <div className="min-h-screen bg-background pb-20 lg:pb-0">
      <Navigation user={user} />
      
      <main className="max-w-4xl mx-auto px-4 pt-20 lg:pt-24">
        <Link to="/forums" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors" data-testid="back-link">
          <ArrowLeft className="h-4 w-4" />
          Back to Forums
        </Link>

        {loading && !category ? (
          <div className="animate-pulse space-y-6">
            <div className="h-8 w-48 bg-muted rounded"></div>
            <div className="h-4 w-64 bg-muted rounded"></div>
          </div>
        ) : category ? (
          <>
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
              <div className="flex items-center gap-4">
                <span className="text-4xl">{category.icon}</span>
                <div>
                  <h1 className="font-heading text-2xl sm:text-3xl font-bold text-foreground">{category.name}</h1>
                  <p className="text-muted-foreground">{category.description}</p>
                </div>
              </div>
              <Link to={`/create-post?category=${categoryId}`}>
                <Button className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full shadow-[0_0_15px_rgba(245,197,66,0.3)]" data-testid="create-post-btn">
                  <Plus className="h-4 w-4 mr-2" />
                  New Post
                </Button>
              </Link>
            </div>

            {/* Filters & Sorting */}
            <div className="flex flex-wrap items-center gap-3 mb-6 p-4 bg-card rounded-xl border border-border/50">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Sort:</span>
                <Select value={sortBy} onValueChange={handleSortChange}>
                  <SelectTrigger className="w-36 h-9 rounded-lg bg-secondary/50 border-transparent" data-testid="sort-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Newest</SelectItem>
                    <SelectItem value="oldest">Oldest</SelectItem>
                    <SelectItem value="popular">Most Popular</SelectItem>
                    <SelectItem value="most_replies">Most Replies</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Filter:</span>
                <Select value={filterType} onValueChange={handleFilterChange}>
                  <SelectTrigger className="w-36 h-9 rounded-lg bg-secondary/50 border-transparent" data-testid="filter-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Posts</SelectItem>
                    <SelectItem value="unanswered">Unanswered</SelectItem>
                    <SelectItem value="trending">Trending</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <span className="text-sm text-muted-foreground ml-auto">
                {total} {total === 1 ? 'post' : 'posts'}
              </span>
            </div>

            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="bg-card rounded-2xl p-6 border border-border/50 animate-pulse">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-full bg-muted"></div>
                      <div className="space-y-2">
                        <div className="w-32 h-4 bg-muted rounded"></div>
                        <div className="w-20 h-3 bg-muted rounded"></div>
                      </div>
                    </div>
                    <div className="w-3/4 h-5 bg-muted rounded mb-2"></div>
                    <div className="w-full h-4 bg-muted rounded"></div>
                  </div>
                ))}
              </div>
            ) : posts.length === 0 ? (
              <div className="text-center py-12 bg-card rounded-2xl border border-border/50">
                <span className="text-5xl mb-4 block">💬</span>
                <h3 className="font-heading text-xl font-bold text-foreground mb-2">
                  {filterType === "unanswered" ? "No unanswered posts" : "No posts yet"}
                </h3>
                <p className="text-muted-foreground mb-4">
                  {filterType === "unanswered" 
                    ? "All posts have been answered! 🎉" 
                    : "Be the first to start a conversation!"}
                </p>
                {filterType === "all" && (
                  <Link to={`/create-post?category=${categoryId}`}>
                    <Button className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full" data-testid="empty-create-post-btn">
                      Create First Post
                    </Button>
                  </Link>
                )}
              </div>
            ) : (
              <>
                <div className="space-y-4">
                  {posts.map((post, idx) => (
                    <PostCard key={post.post_id} post={post} index={idx} />
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-8">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="rounded-full"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    
                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum;
                        if (totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (currentPage <= 3) {
                          pageNum = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                          pageNum = totalPages - 4 + i;
                        } else {
                          pageNum = currentPage - 2 + i;
                        }
                        
                        return (
                          <Button
                            key={pageNum}
                            variant={currentPage === pageNum ? "default" : "outline"}
                            size="sm"
                            onClick={() => setCurrentPage(pageNum)}
                            className={`rounded-full w-9 h-9 ${currentPage === pageNum ? 'bg-primary text-primary-foreground' : ''}`}
                          >
                            {pageNum}
                          </Button>
                        );
                      })}
                    </div>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="rounded-full"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </>
            )}
          </>
        ) : (
          <div className="text-center py-12">
            <h3 className="font-heading text-xl font-bold text-foreground">Category not found</h3>
          </div>
        )}
      </main>
    </div>
  );
}
