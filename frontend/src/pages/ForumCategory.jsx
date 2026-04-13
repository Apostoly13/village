import { useState, useEffect } from "react";
import { Link, useParams, useSearchParams, useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Label } from "../components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "../components/ui/dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";
import Navigation from "../components/Navigation";
import AppFooter from "../components/AppFooter";
import { toast } from "sonner";
import { ArrowLeft, Plus, MessageCircle, Heart, Eye, Clock, Filter, ChevronLeft, ChevronRight, HelpCircle, MapPin, Compass, Crown, MoreVertical, Edit2, Trash2, Pin, Lock, Users } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

import { getSpaceName } from "../config/spaces";

const API_URL = process.env.REACT_APP_BACKEND_URL;

export default function ForumCategory({ user }) {
  const { categoryId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const [category, setCategory] = useState(null);
  const [posts, setPosts] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const [sortBy, setSortBy] = useState(searchParams.get("sort") || "newest");
  const [filterType, setFilterType] = useState(searchParams.get("filter") || "all");
  const [distanceKm, setDistanceKm] = useState(searchParams.get("distance") || "25");
  const [currentPage, setCurrentPage] = useState(1);
  const postsPerPage = 10;

  // Community management state
  const [editDialog, setEditDialog] = useState(false);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editIcon, setEditIcon] = useState("");
  const [editLoading, setEditLoading] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [isMember, setIsMember] = useState(false);
  const [memberCount, setMemberCount] = useState(0);
  const [joinLoading, setJoinLoading] = useState(false);

  const DISTANCE_OPTIONS = [
    { id: "5", label: "5km" },
    { id: "10", label: "10km" },
    { id: "25", label: "25km" },
    { id: "50", label: "50km" },
    { id: "100", label: "100km" },
  ];

  useEffect(() => {
    fetchData();
  }, [categoryId, sortBy, filterType, currentPage, distanceKm]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const skip = (currentPage - 1) * postsPerPage;
      const filterParam = filterType !== "all" ? `&filter_type=${filterType}` : "";

      const catRes = await fetch(`${API_URL}/api/forums/categories/${categoryId}`, { credentials: "include" });
      let catData = null;
      if (catRes.ok) {
        catData = await catRes.json();
        setCategory(catData);
        if (catData?.is_user_created) {
          setIsMember(catData.is_member || false);
          setMemberCount(catData.member_count || 0);
        }
      }

      // Build posts URL with location params for location-aware categories
      let postsUrl = `${API_URL}/api/forums/posts?category_id=${categoryId}&sort=${catData?.is_location_aware ? "nearest" : sortBy}&limit=${postsPerPage}&skip=${skip}${filterParam}`;

      if (catData?.is_location_aware && user?.latitude && user?.longitude) {
        postsUrl += `&lat=${user.latitude}&lon=${user.longitude}&distance_km=${distanceKm}`;
      }

      const postsRes = await fetch(postsUrl, { credentials: "include" });
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

  const handleDistanceChange = (value) => {
    setDistanceKm(value);
    setCurrentPage(1);
  };

  const totalPages = Math.ceil(total / postsPerPage);

  const isCommunityCreator = category?.is_user_created && category?.created_by === user?.user_id;
  const isAdminOrMod = user?.role === "admin" || user?.role === "moderator";
  const canManageCommunity = isCommunityCreator || isAdminOrMod;

  const openEditDialog = () => {
    setEditName(category.name);
    setEditDescription(category.description);
    setEditIcon(category.icon);
    setEditDialog(true);
  };

  const handleEditCommunity = async () => {
    setEditLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/forums/communities/${categoryId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name: editName.trim(), description: editDescription.trim(), icon: editIcon }),
      });
      if (res.ok) {
        const updated = await res.json();
        setCategory(updated);
        setEditDialog(false);
        toast.success("Community updated");
      } else {
        const err = await res.json();
        toast.error(err.detail || "Failed to update community");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setEditLoading(false);
    }
  };

  const handleDeleteCommunity = async () => {
    setDeleteLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/forums/communities/${categoryId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (res.ok) {
        toast.success("Community deleted");
        navigate("/forums");
      } else {
        const err = await res.json();
        toast.error(err.detail || "Failed to delete community");
        setDeleteDialog(false);
      }
    } catch {
      toast.error("Something went wrong");
      setDeleteDialog(false);
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleJoinLeave = async () => {
    if (!user) { toast.error("Sign in to join communities"); return; }
    setJoinLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/forums/communities/${categoryId}/${isMember ? "leave" : "join"}`, {
        method: "POST",
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        setIsMember(data.is_member);
        setMemberCount(data.member_count);
        toast.success(isMember ? "Left community" : "Joined community");
      } else {
        const err = await res.json();
        toast.error(err.detail || "Something went wrong");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setJoinLoading(false);
    }
  };

  const handlePinPost = async (postId, currentPinned) => {
    try {
      const res = await fetch(`${API_URL}/api/forums/posts/${postId}/pin`, {
        method: "POST",
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        setPosts(prev => prev.map(p => p.post_id === postId ? { ...p, is_pinned: data.pinned } : p));
        toast.success(data.pinned ? "Post pinned" : "Post unpinned");
      }
    } catch {
      toast.error("Failed to pin post");
    }
  };

  const formatDate = (dateString) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch {
      return "recently";
    }
  };

  const PostCard = ({ post, index }) => (
    <article
      className="bg-card rounded-2xl px-4 py-3 border border-border/40 card-elevated border-l-2 border-l-primary/20 hover:border-primary/30 hover:shadow-md hover:border-l-primary/40 transition-all"
      data-testid={`post-card-${index}`}
    >
      {/* Top row: badges */}
      {(post.is_pinned || post.is_anonymous || post.reply_count === 0) && (
        <div className="flex items-center gap-1.5 mb-1.5">
          {post.is_pinned && <span className="text-xs px-1.5 py-0 rounded-full bg-primary/15 text-primary font-medium">📌 Pinned</span>}
          {post.is_anonymous && <span className="text-xs px-1.5 py-0 rounded-full bg-secondary text-muted-foreground">Anonymous</span>}
          {post.reply_count === 0 && (
            <span className="text-xs px-1.5 py-0 rounded-full bg-orange-500/10 text-orange-600 dark:text-orange-400">Needs reply</span>
          )}
        </div>
      )}

      {/* Title */}
      <Link to={`/forums/post/${post.post_id}`} className="block group">
        <h3 className="font-semibold text-sm text-foreground mb-1 group-hover:text-primary transition-colors leading-snug">{post.title}</h3>
        <p className="text-xs text-muted-foreground line-clamp-1 leading-relaxed mb-2">{post.content}</p>
      </Link>

      {/* Meta row */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          {post.author_id !== "anonymous" ? (
            <Link to={`/profile/${post.author_id}`} onClick={e => e.stopPropagation()} className="flex items-center gap-1.5 min-w-0">
              <Avatar className="h-5 w-5 flex-shrink-0">
                <AvatarImage src={post.author_picture} />
                <AvatarFallback className="bg-primary/20 text-primary text-xs">{post.author_name?.[0]?.toUpperCase() || '?'}</AvatarFallback>
              </Avatar>
              <span className="text-xs text-muted-foreground truncate hover:text-foreground transition-colors">
                {post.author_name}
                {post.author_subscription_tier === "premium" && !post.is_anonymous && <Crown className="h-2.5 w-2.5 text-amber-500 inline ml-0.5" />}
              </span>
            </Link>
          ) : (
            <span className="text-xs text-muted-foreground">Anonymous</span>
          )}
          <span className="text-xs text-muted-foreground flex items-center gap-0.5 shrink-0">
            <Clock className="h-3 w-3" />{formatDate(post.created_at)}
          </span>
          {(post.suburb || post.postcode) && (
            <span className="text-xs text-muted-foreground hidden sm:flex items-center gap-0.5 shrink-0">
              <MapPin className="h-3 w-3" />{post.suburb}{post.distance_km !== undefined ? ` · ${post.distance_km}km` : ""}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2.5 text-xs text-muted-foreground shrink-0">
          <span className="flex items-center gap-0.5"><Heart className="h-3 w-3" />{post.like_count || 0}</span>
          <span className="flex items-center gap-0.5"><MessageCircle className="h-3 w-3" />{post.reply_count || 0}</span>
          <span className="flex items-center gap-0.5"><Eye className="h-3 w-3" />{post.views || 0}</span>
          {canManageCommunity && (
            <button
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); handlePinPost(post.post_id, post.is_pinned); }}
              className="text-xs text-muted-foreground hover:text-primary transition-colors"
              title={post.is_pinned ? "Unpin" : "Pin"}
            >
              <Pin className="h-3 w-3" />
            </button>
          )}
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
          Back to Support Spaces
        </Link>

        {loading && !category ? (
          <div className="animate-pulse space-y-6">
            <div className="h-8 w-48 bg-muted rounded"></div>
            <div className="h-4 w-64 bg-muted rounded"></div>
          </div>
        ) : category ? (
          <>
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-4">
              <div className="flex items-center gap-4">
                {/* Icon — uploaded image or emoji */}
                <div className="w-16 h-16 rounded-2xl overflow-hidden flex-shrink-0 flex items-center justify-center bg-secondary">
                  {category.icon_url
                    ? <img src={category.icon_url} alt={category.name} className="w-full h-full object-cover" />
                    : <span className="text-4xl">{category.icon}</span>}
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="font-heading text-2xl sm:text-3xl font-bold text-foreground">{getSpaceName(category.name)}</h1>
                    {category.is_private && <Lock className="h-5 w-5 text-muted-foreground" />}
                    {category.community_subtype === "local" && (
                      <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary font-medium">Local</span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-0.5">{category.description}</p>
                  <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                    {category.is_user_created && category.created_by_name && (
                      <span className="flex items-center gap-1">
                        <Crown className="h-3 w-3 text-amber-500" />
                        <Link to={`/profile/${category.created_by}`} className="hover:underline text-foreground">
                          {category.created_by_name}
                        </Link>
                      </span>
                    )}
                    {category.is_user_created && (
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />{memberCount} members
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {/* Join/Leave button for community pages */}
                {category.is_user_created && user && !isCommunityCreator && (
                  <Button
                    variant={isMember ? "outline" : "default"}
                    size="sm"
                    onClick={handleJoinLeave}
                    disabled={joinLoading}
                    className={`rounded-xl ${isMember ? "border-border/50" : "bg-primary text-primary-foreground hover:bg-primary/90"}`}
                  >
                    {joinLoading ? "…" : isMember ? "Leave" : "Join Community"}
                  </Button>
                )}
                {canManageCommunity && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" className="rounded-full">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-card border-border/50">
                      <DropdownMenuItem onClick={openEditDialog} className="cursor-pointer">
                        <Edit2 className="h-4 w-4 mr-2" />
                        Edit Community
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => setDeleteDialog(true)}
                        className="text-destructive cursor-pointer"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete Community
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
                <Link to={`/create-post?category=${categoryId}`}>
                  <Button className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl shadow-[0_0_15px_rgba(245,197,66,0.3)]" data-testid="create-post-btn">
                    <Plus className="h-4 w-4 mr-2" />
                    New Post
                  </Button>
                </Link>
              </div>
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
              
              {category?.is_location_aware && (
                <div className="flex items-center gap-2">
                  <Compass className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Within:</span>
                  <Select value={distanceKm} onValueChange={handleDistanceChange}>
                    <SelectTrigger className="w-24 h-9 rounded-lg bg-secondary/50 border-transparent" data-testid="distance-select">
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

              <span className="text-sm text-muted-foreground ml-auto">
                {total} {total === 1 ? 'post' : 'posts'}
              </span>
            </div>

            {loading ? (
              <div className="space-y-2">
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} className="bg-card rounded-2xl px-4 py-3 border border-border/40 animate-pulse">
                    <div className="w-3/4 h-4 bg-muted rounded mb-2"></div>
                    <div className="w-full h-3 bg-muted rounded mb-2"></div>
                    <div className="flex gap-3">
                      <div className="w-16 h-3 bg-muted rounded"></div>
                      <div className="w-20 h-3 bg-muted rounded"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : posts.length === 0 ? (
              <div className="text-center py-12 bg-card rounded-2xl border border-border/50">
                <span className="text-4xl mb-3 block">💬</span>
                <h3 className="font-heading font-semibold text-foreground mb-1">
                  {filterType === "unanswered" ? "No unanswered posts" : "No posts yet"}
                </h3>
                <p className="text-muted-foreground mb-4">
                  {filterType === "unanswered" 
                    ? "All posts have been answered! 🎉" 
                    : "Be the first to start a conversation!"}
                </p>
                {filterType === "all" && (
                  <Link to={`/create-post?category=${categoryId}`}>
                    <Button className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl" data-testid="empty-create-post-btn">
                      Create First Post
                    </Button>
                  </Link>
                )}
              </div>
            ) : (
              <>
                <div className="space-y-2">
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
          <div className="text-center py-12 bg-card rounded-2xl border border-border/50">
            <span className="text-4xl mb-3 block">🔍</span>
            <h3 className="font-heading font-semibold text-foreground">Category not found</h3>
            <p className="text-sm text-muted-foreground mt-1 mb-4">This space may have been removed.</p>
            <Link to="/forums">
              <Button variant="outline" className="rounded-xl">Back to Support Spaces</Button>
            </Link>
          </div>
        )}
      </main>
      <AppFooter />

      {/* Edit Community Dialog */}
      <Dialog open={editDialog} onOpenChange={setEditDialog}>
        <DialogContent className="bg-card border-border/50">
          <DialogHeader>
            <DialogTitle>Edit Community</DialogTitle>
            <DialogDescription>Update your community details.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1">
              <Label className="text-foreground">Icon</Label>
              <Input
                value={editIcon}
                onChange={(e) => setEditIcon(e.target.value.slice(0, 4))}
                className="h-10 w-20 rounded-lg bg-secondary/50 border-transparent text-center text-lg"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-foreground">Name</Label>
              <Input
                value={editName}
                onChange={(e) => setEditName(e.target.value.slice(0, 60))}
                className="h-10 rounded-lg bg-secondary/50 border-transparent"
                maxLength={60}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-foreground">Description</Label>
              <Textarea
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value.slice(0, 200))}
                className="rounded-lg bg-secondary/50 border-transparent resize-none"
                maxLength={200}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialog(false)}>Cancel</Button>
            <Button
              onClick={handleEditCommunity}
              disabled={editLoading}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {editLoading ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Community Dialog */}
      <Dialog open={deleteDialog} onOpenChange={setDeleteDialog}>
        <DialogContent className="bg-card border-border/50">
          <DialogHeader>
            <DialogTitle>Delete Community</DialogTitle>
            <DialogDescription>
              This will permanently delete "{category?.name}" and all its posts and replies. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialog(false)}>Cancel</Button>
            <Button
              variant="destructive"
              onClick={handleDeleteCommunity}
              disabled={deleteLoading}
            >
              {deleteLoading ? "Deleting..." : "Delete Community"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
