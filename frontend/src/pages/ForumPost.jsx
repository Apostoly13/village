import { useState, useEffect, useRef } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { Textarea } from "../components/ui/textarea";
import { Checkbox } from "../components/ui/checkbox";
import { Label } from "../components/ui/label";
import { Input } from "../components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";
import Navigation from "../components/Navigation";
import AppFooter from "../components/AppFooter";
import { toast } from "sonner";
import { ArrowLeft, Heart, MessageCircle, Eye, Clock, Send, Bookmark, BookmarkCheck, MoreVertical, Edit2, Trash2, Flag, Reply, MapPin, Crown, X } from "lucide-react";
import VerifiedBadge from "../components/VerifiedBadge";
import { parseApiError } from "../utils/apiError";
import { timeAgoVerbose } from "../utils/dateHelpers";

const API_URL = process.env.REACT_APP_BACKEND_URL;
const MAX_CONTENT_LENGTH = 5000;

export default function ForumPost({ user }) {
  const { postId } = useParams();
  const navigate = useNavigate();
  
  const [post, setPost] = useState(null);
  const [replies, setReplies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [replyContent, setReplyContent] = useState("");
  const replyTextareaRef = useRef(null);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);
  
  // Edit states
  const [editingPost, setEditingPost] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [editingReplyId, setEditingReplyId] = useState(null);
  const [editReplyContent, setEditReplyContent] = useState("");
  
  const [subscription, setSubscription] = useState(null);
  const [crisisDismissed, setCrisisDismissed] = useState(false);

  // Modal states
  const [deletePostModal, setDeletePostModal] = useState(false);
  const [deleteReplyId, setDeleteReplyId] = useState(null);
  const [reportModal, setReportModal] = useState(false);
  const [reportTarget, setReportTarget] = useState(null);
  const [reportReason, setReportReason] = useState("");
  const [reportDetails, setReportDetails] = useState("");

  useEffect(() => {
    fetchData();
  }, [postId]);

  const fetchSubscription = async () => {
    try {
      const res = await fetch(`${API_URL}/api/subscription/status`, { credentials: "include" });
      if (res.ok) setSubscription(await res.json());
    } catch {}
  };

  const fetchData = async () => {
    try {
      // All three fetches run in parallel
      const [postRes, repliesRes, subRes] = await Promise.all([
        fetch(`${API_URL}/api/forums/posts/${postId}`, { credentials: "include" }),
        fetch(`${API_URL}/api/forums/posts/${postId}/replies`, { credentials: "include" }),
        fetch(`${API_URL}/api/subscription/status`, { credentials: "include" }),
      ]);

      if (postRes.ok) {
        const postData = await postRes.json();
        setPost(postData);
        setEditTitle(postData.title);
        setEditContent(postData.content);
      }
      if (repliesRes.ok) setReplies(await repliesRes.json());
      if (subRes.ok) setSubscription(await subRes.json());
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async () => {
    try {
      const response = await fetch(`${API_URL}/api/forums/posts/${postId}/like`, {
        method: "POST",
        credentials: "include"
      });
      if (response.ok) {
        const data = await response.json();
        setPost(prev => ({
          ...prev,
          user_liked: data.liked,
          like_count: data.liked ? (prev.like_count || 0) + 1 : (prev.like_count || 1) - 1
        }));
      }
    } catch (error) {
      console.error("Error liking post:", error);
    }
  };

  const handleLikeReply = async (replyId) => {
    try {
      const response = await fetch(`${API_URL}/api/forums/replies/${replyId}/like`, {
        method: "POST",
        credentials: "include"
      });
      if (response.ok) {
        const data = await response.json();
        setReplies(prev => prev.map(r => 
          r.reply_id === replyId 
            ? { ...r, user_liked: data.liked, like_count: data.liked ? (r.like_count || 0) + 1 : (r.like_count || 1) - 1 }
            : r
        ));
      }
    } catch (error) {
      console.error("Error liking reply:", error);
    }
  };

  const handleBookmark = async () => {
    try {
      const response = await fetch(`${API_URL}/api/forums/posts/${postId}/bookmark`, {
        method: "POST",
        credentials: "include"
      });
      if (response.ok) {
        const data = await response.json();
        setPost(prev => ({ ...prev, user_bookmarked: data.bookmarked }));
        toast.success(data.bookmarked ? "Post bookmarked!" : "Bookmark removed");
      }
    } catch (error) {
      toast.error("Failed to bookmark");
    }
  };

  const handleReply = async (e) => {
    e.preventDefault();
    if (!replyContent.trim()) return;

    setSubmitting(true);
    try {
      const response = await fetch(`${API_URL}/api/forums/posts/${postId}/replies`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          content: replyContent,
          is_anonymous: isAnonymous,
          parent_reply_id: replyingTo?.reply_id || null
        })
      });

      if (response.ok) {
        const newReply = await response.json();
        setReplies(prev => [...prev, newReply]);
        setReplyContent("");
        if (replyTextareaRef.current) replyTextareaRef.current.style.height = '';
        setIsAnonymous(false);
        setReplyingTo(null);
        setPost(prev => ({ ...prev, reply_count: (prev.reply_count || 0) + 1 }));
        // Optimistically update subscription reply count without a network call
        setSubscription(prev => prev ? {
          ...prev,
          usage: { ...prev.usage, replies_this_week: (prev.usage?.replies_this_week || 0) + 1 }
        } : prev);
        toast.success("Reply posted!");
      } else if (response.status === 429) {
        const err = await response.json();
        toast.error(err.detail?.message || "Daily reply limit reached");
        fetchSubscription(); // Only re-fetch on limit hit to show accurate counts
      } else {
        toast.error("Failed to post reply");
      }
    } catch (error) {
      toast.error("Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditPost = async () => {
    try {
      const response = await fetch(`${API_URL}/api/forums/posts/${postId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ title: editTitle, content: editContent })
      });
      
      if (response.ok) {
        const updated = await response.json();
        setPost(prev => ({ ...prev, ...updated, is_edited: true }));
        setEditingPost(false);
        toast.success("Post updated!");
      } else {
        toast.error("Failed to update post");
      }
    } catch (error) {
      toast.error("Something went wrong");
    }
  };

  const handleDeletePost = async () => {
    try {
      const response = await fetch(`${API_URL}/api/forums/posts/${postId}`, {
        method: "DELETE",
        credentials: "include"
      });
      
      if (response.ok) {
        toast.success("Post deleted");
        navigate("/forums");
      } else {
        toast.error("Failed to delete post");
      }
    } catch (error) {
      toast.error("Something went wrong");
    }
    setDeletePostModal(false);
  };

  const handleEditReply = async (replyId) => {
    try {
      const response = await fetch(`${API_URL}/api/forums/replies/${replyId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ content: editReplyContent })
      });
      
      if (response.ok) {
        setReplies(prev => prev.map(r => 
          r.reply_id === replyId ? { ...r, content: editReplyContent, is_edited: true } : r
        ));
        setEditingReplyId(null);
        toast.success("Reply updated!");
      } else {
        toast.error("Failed to update reply");
      }
    } catch (error) {
      toast.error("Something went wrong");
    }
  };

  const handleDeleteReply = async () => {
    if (!deleteReplyId) return;
    
    try {
      const response = await fetch(`${API_URL}/api/forums/replies/${deleteReplyId}`, {
        method: "DELETE",
        credentials: "include"
      });
      
      if (response.ok) {
        const removedCount = replies.filter(
          r => r.reply_id === deleteReplyId || r.parent_reply_id === deleteReplyId
        ).length;
        setReplies(prev => prev.filter(r => r.reply_id !== deleteReplyId && r.parent_reply_id !== deleteReplyId));
        setPost(prev => ({ ...prev, reply_count: Math.max(0, (prev.reply_count || 0) - removedCount) }));
        toast.success("Reply deleted");
      } else {
        toast.error("Failed to delete reply");
      }
    } catch (error) {
      toast.error("Something went wrong");
    }
    setDeleteReplyId(null);
  };

  const handleReport = async () => {
    if (!reportTarget || !reportReason) return;
    
    try {
      const response = await fetch(`${API_URL}/api/reports`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          content_type: reportTarget.type,
          content_id: reportTarget.id,
          reason: reportReason,
          details: reportDetails
        })
      });
      
      if (response.ok) {
        toast.success("Report submitted. Thank you for helping keep our community safe.");
      } else {
        const error = await response.json();
        toast.error(parseApiError(error.detail, "Failed to submit report"));
      }
    } catch (error) {
      toast.error("Something went wrong");
    }
    setReportModal(false);
    setReportTarget(null);
    setReportReason("");
    setReportDetails("");
  };

  const formatDate = timeAgoVerbose;

  // Organize replies into threads
  const topLevelReplies = replies.filter(r => !r.parent_reply_id);
  const getChildReplies = (parentId) => replies.filter(r => r.parent_reply_id === parentId);

  const renderReply = (reply, depth = 0) => {
    const childReplies = getChildReplies(reply.reply_id);
    const isEditing = editingReplyId === reply.reply_id;

    // Use global position in the flat replies array so every reply alternates reliably
    const globalIndex = replies.findIndex(r => r.reply_id === reply.reply_id);
    const isEven = globalIndex % 2 === 0;
    const bgClass = isEven ? 'bg-card' : 'bg-secondary dark:bg-secondary/80';

    return (
      <div key={reply.reply_id} className={depth > 0 ? 'ml-4 border-l-2 border-primary/40 pl-3' : 'border-l-2 border-l-primary/20 pl-3 rounded-l-sm'}>
        <div
          className={`${bgClass} rounded-[18px] p-4 border mb-3 ${isEven ? 'border-border/40' : 'border-primary/20'}`}
          data-testid={`reply-${reply.reply_id}`}
        >
          <div className="flex items-start gap-3">
            {reply.author_id !== "anonymous" ? (
              <Link to={`/profile/${reply.author_id}`}>
                <Avatar className="h-10 w-10 cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all">
                  <AvatarImage src={reply.author_picture} />
                  <AvatarFallback className="bg-primary/20 text-primary">
                    {reply.author_name?.[0]?.toUpperCase() || '?'}
                  </AvatarFallback>
                </Avatar>
              </Link>
            ) : (
              <Avatar className="h-10 w-10">
                <AvatarFallback className="bg-primary/20 text-primary">?</AvatarFallback>
              </Avatar>
            )}
            <div className="flex-1 min-w-0 overflow-hidden">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 flex-wrap">
                  {reply.author_id !== "anonymous" ? (
                    <Link to={`/profile/${reply.author_id}`} className="hover:underline flex items-center gap-1 flex-wrap">
                      <span className="font-medium text-foreground hover:text-primary transition-colors">{reply.author_name}</span>
                      {reply.author_subscription_tier === "premium" && !reply.is_anonymous && <Crown className="h-3 w-3 text-amber-500" />}
                      {reply.author_is_verified_partner && !reply.is_anonymous && <VerifiedBadge occupation={reply.author_professional_type} />}
                    </Link>
                  ) : (
                    <span className="font-medium text-foreground">{reply.author_name}</span>
                  )}
                  {reply.is_anonymous && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">Anonymous</span>
                  )}
                  <span className="text-xs text-muted-foreground">•</span>
                  <span className="text-xs text-muted-foreground">{formatDate(reply.created_at)}</span>
                  {reply.is_edited && <span className="text-xs text-muted-foreground">(edited)</span>}
                </div>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {reply.is_own_reply && (
                      <>
                        <DropdownMenuItem onClick={() => { setEditingReplyId(reply.reply_id); setEditReplyContent(reply.content); }}>
                          <Edit2 className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setDeleteReplyId(reply.reply_id)} className="text-destructive">
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                      </>
                    )}
                    <DropdownMenuItem onClick={() => { setReportTarget({ type: 'reply', id: reply.reply_id }); setReportModal(true); }}>
                      <Flag className="h-4 w-4 mr-2" />
                      Report
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              
              {isEditing ? (
                <div className="space-y-3">
                  <Textarea
                    value={editReplyContent}
                    onChange={(e) => setEditReplyContent(e.target.value)}
                    className="min-h-[80px] bg-secondary/50 border-transparent focus:border-primary rounded-xl"
                  />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => handleEditReply(reply.reply_id)} className="rounded-xl">Save</Button>
                    <Button size="sm" variant="outline" onClick={() => setEditingReplyId(null)} className="rounded-xl">Cancel</Button>
                  </div>
                </div>
              ) : (
                <p className="text-foreground whitespace-pre-wrap break-words overflow-hidden">{reply.content}</p>
              )}
              
              <div className="flex items-center gap-3 mt-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleLikeReply(reply.reply_id)}
                  className={`rounded-full h-8 px-3 ${reply.user_liked ? 'text-red-500' : 'text-muted-foreground'}`}
                >
                  <Heart className={`h-4 w-4 mr-1 ${reply.user_liked ? 'fill-current' : ''}`} />
                  {reply.like_count || 0}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    if (replyingTo?.reply_id === reply.reply_id) {
                      setReplyingTo(null);
                      setReplyContent("");
                      if (replyTextareaRef.current) replyTextareaRef.current.style.height = '';
                    } else {
                      setReplyingTo(reply);
                      setReplyContent("");
                    }
                  }}
                  className={`rounded-full h-8 px-3 ${replyingTo?.reply_id === reply.reply_id ? 'text-primary' : 'text-muted-foreground'}`}
                >
                  <Reply className="h-4 w-4 mr-1" />
                  {replyingTo?.reply_id === reply.reply_id ? 'Cancel' : 'Reply'}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Inline reply form — appears directly below this reply */}
        {replyingTo?.reply_id === reply.reply_id && (
          <div className="mt-1 mb-3 ml-4 pl-3 border-l-2 border-primary/40">
            <form onSubmit={handleReply} className="village-card p-4 space-y-3">
              <div className="relative">
                <Textarea
                  ref={replyTextareaRef}
                  value={replyContent}
                  onChange={(e) => {
                    setReplyContent(e.target.value.slice(0, MAX_CONTENT_LENGTH));
                    const el = e.target;
                    el.style.height = 'auto';
                    el.style.height = el.scrollHeight + 'px';
                  }}
                  placeholder={`Reply to ${reply.author_name}...`}
                  className="min-h-[44px] bg-secondary/50 border-transparent focus:border-primary rounded-xl text-sm"
                  style={{ overflow: 'hidden', resize: 'none' }}
                  autoFocus
                />
                <span className="absolute bottom-2 right-2 text-xs text-muted-foreground">{replyContent.length}/{MAX_CONTENT_LENGTH}</span>
              </div>
              {subscription?.limits_apply && subscription?.forum_replies && (
                <Link to="/plus" className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors mb-1">
                  <Crown className="h-3 w-3 text-amber-500" />
                  {subscription.forum_replies.limit - subscription.forum_replies.used}/{subscription.forum_replies.limit} replies today
                </Link>
              )}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id={`anon-inline-${reply.reply_id}`}
                    checked={isAnonymous}
                    onCheckedChange={(checked) => setIsAnonymous(checked)}
                  />
                  <Label htmlFor={`anon-inline-${reply.reply_id}`} className="text-xs text-muted-foreground cursor-pointer">Anonymous</Label>
                </div>
                <Button
                  type="submit"
                  size="sm"
                  disabled={submitting || !replyContent.trim() || (subscription?.limits_apply && subscription?.forum_replies && !subscription.forum_replies.allowed)}
                  className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl h-8 text-xs"
                >
                  {submitting ? "Posting..." : <><Send className="h-3 w-3 mr-1" />Post Reply</>}
                </Button>
              </div>
            </form>
          </div>
        )}

        {childReplies.map(child => renderReply(child, depth + 1))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background pb-20 lg:pl-60 lg:pb-0">
        <Navigation user={user} />
        <main className="max-w-4xl mx-auto px-4 pt-16 lg:pt-8">
          <div className="animate-pulse space-y-6">
            <div className="h-6 w-32 bg-muted rounded"></div>
            <div className="village-card p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-muted"></div>
                <div className="space-y-2">
                  <div className="w-32 h-4 bg-muted rounded"></div>
                  <div className="w-20 h-3 bg-muted rounded"></div>
                </div>
              </div>
              <div className="w-3/4 h-6 bg-muted rounded"></div>
              <div className="w-full h-20 bg-muted rounded"></div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-background pb-20 lg:pl-60 lg:pb-0">
        <Navigation user={user} />
        <main className="max-w-4xl mx-auto px-4 pt-16 lg:pt-8">
          <div className="text-center py-16 village-card">
            <span className="text-4xl mb-4 block">🔍</span>
            <h1 className="font-heading text-xl font-bold text-foreground mb-2">Post not found</h1>
            <p className="text-sm text-muted-foreground mb-6">This post may have been removed or the link is incorrect.</p>
            <Link to="/forums">
              <Button className="rounded-xl">Back to Spaces</Button>
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20 lg:pl-60 lg:pb-0">
      <Navigation user={user} />
      
      <main className="max-w-4xl mx-auto px-4 pt-16 lg:pt-8">
        <button
          onClick={() => navigate(post?.category_id ? `/forums/${post.category_id}` : -1)}
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
          data-testid="back-link"
        >
          <ArrowLeft className="h-4 w-4" />
          {post?.category_name ? `Back to ${post.category_name}` : "Back to Spaces"}
        </button>

        {/* ── Crisis support banner (mental-health categories only) ── */}
        {!crisisDismissed && (() => {
          const name = (post.category_name || "").toLowerCase();
          const id   = (post.category_id   || "").toLowerCase();
          const keywords = ["mental health", "wellbeing", "anxiety", "depression", "postnatal", "perinatal", "emotional", "mum", "parent well"];
          if (!keywords.some(kw => name.includes(kw) || id.includes(kw))) return null;
          return (
            <div className="mb-5 rounded-2xl bg-sky-500/5 border border-sky-500/20 p-4 flex items-start gap-3">
              <span className="text-xl shrink-0">💙</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground mb-1">Support is available — you're not alone</p>
                <p className="text-xs text-muted-foreground leading-relaxed mb-3">
                  If you're in crisis or need to talk to someone right now, these free services are available 24/7:
                </p>
                <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs">
                  <a href="tel:1300726306" className="font-semibold text-sky-600 dark:text-sky-400 hover:underline">PANDA — 1300 726 306</a>
                  <a href="tel:131114"     className="font-semibold text-sky-600 dark:text-sky-400 hover:underline">Lifeline — 13 11 14</a>
                  <a href="tel:1300224636" className="font-semibold text-sky-600 dark:text-sky-400 hover:underline">Beyond Blue — 1300 22 4636</a>
                </div>
              </div>
              <button
                onClick={() => setCrisisDismissed(true)}
                className="text-muted-foreground hover:text-foreground shrink-0 p-0.5 transition-colors"
                aria-label="Dismiss"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          );
        })()}

        {/* Main Post */}
        <article className="village-card p-6 border-l-2 border-l-primary/20 mb-6" data-testid="post-content">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              {post.author_id !== "anonymous" ? (
                <Link to={`/profile/${post.author_id}`}>
                  <Avatar className="h-12 w-12 cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all">
                    <AvatarImage src={post.author_picture} />
                    <AvatarFallback className="bg-primary/20 text-primary text-lg">
                      {post.author_name?.[0]?.toUpperCase() || '?'}
                    </AvatarFallback>
                  </Avatar>
                </Link>
              ) : (
                <Avatar className="h-12 w-12">
                  <AvatarFallback className="bg-primary/20 text-primary text-lg">?</AvatarFallback>
                </Avatar>
              )}
              <div>
                {post.author_id !== "anonymous" ? (
                  <Link to={`/profile/${post.author_id}`} className="hover:underline">
                    <p className="font-medium text-foreground hover:text-primary transition-colors flex items-center gap-1 flex-wrap">
                      {post.author_name}
                      {post.author_subscription_tier === "premium" && !post.is_anonymous && <Crown className="h-3 w-3 text-amber-500" />}
                      {post.author_is_verified_partner && !post.is_anonymous && <VerifiedBadge occupation={post.author_professional_type} />}
                    </p>
                  </Link>
                ) : (
                  <p className="font-medium text-foreground">{post.author_name}</p>
                )}
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  <span>{formatDate(post.created_at)}</span>
                  {post.is_edited && <span>(edited)</span>}
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {post.is_anonymous && (
                <span className="text-xs px-2 py-1 rounded-full bg-secondary text-muted-foreground">Anonymous</span>
              )}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {post.is_own_post && (
                    <>
                      <DropdownMenuItem onClick={() => setEditingPost(true)}>
                        <Edit2 className="h-4 w-4 mr-2" />
                        Edit Post
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setDeletePostModal(true)} className="text-destructive">
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete Post
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                    </>
                  )}
                  <DropdownMenuItem onClick={() => { setReportTarget({ type: 'post', id: post.post_id }); setReportModal(true); }}>
                    <Flag className="h-4 w-4 mr-2" />
                    Report Post
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {editingPost ? (
            <div className="space-y-4">
              <Input
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="text-xl font-bold bg-secondary/50 border-transparent focus:border-primary"
                placeholder="Post title"
              />
              <div className="relative">
                <Textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value.slice(0, MAX_CONTENT_LENGTH))}
                  className="min-h-[150px] bg-secondary/50 border-transparent focus:border-primary rounded-xl"
                  placeholder="Post content"
                />
                <span className="absolute bottom-2 right-2 text-xs text-muted-foreground">
                  {editContent.length}/{MAX_CONTENT_LENGTH}
                </span>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleEditPost} className="rounded-xl bg-primary text-primary-foreground">Save Changes</Button>
                <Button variant="outline" onClick={() => setEditingPost(false)} className="rounded-xl">Cancel</Button>
              </div>
            </div>
          ) : (
            <>
              <h1
                className="text-2xl sm:text-3xl font-medium leading-snug mb-4"
                style={{ fontFamily: "var(--serif)", letterSpacing: "-0.025em", color: "var(--ink)" }}
              >
                {post.title}
              </h1>
              {(post.suburb || post.postcode) && (
                <div className="flex items-center gap-1 text-sm text-muted-foreground mb-3" data-testid="post-location-badge">
                  <MapPin className="h-4 w-4 text-primary" />
                  <span>{post.suburb}{post.postcode ? `, ${post.postcode}` : ''}</span>
                  {post.state && <span className="text-xs">({post.state})</span>}
                </div>
              )}
              <p className="text-foreground whitespace-pre-wrap break-words overflow-hidden mb-4">{post.content}</p>
              {post.image && (
                <div className="mb-6 rounded-xl overflow-hidden border border-border/50">
                  <img 
                    src={post.image} 
                    alt="Post attachment" 
                    className="w-full max-h-96 object-cover cursor-pointer hover:opacity-90 transition-opacity"
                    onClick={() => window.open(post.image, '_blank')}
                  />
                </div>
              )}
            </>
          )}

          <div className="flex items-center gap-4 pt-4 border-t border-border/50">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleLike}
              className={`rounded-full ${post.user_liked ? 'text-red-500' : 'text-muted-foreground'}`}
              data-testid="like-btn"
            >
              <Heart className={`h-4 w-4 mr-1 ${post.user_liked ? 'fill-current' : ''}`} />
              {post.like_count || 0}
            </Button>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <MessageCircle className="h-4 w-4" />
              <span>{post.reply_count || 0} replies</span>
            </div>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Eye className="h-4 w-4" />
              <span>{post.views || 0} views</span>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleBookmark}
              className={`rounded-full ml-auto ${post.user_bookmarked ? 'text-primary' : 'text-muted-foreground'}`}
              data-testid="bookmark-btn"
            >
              {post.user_bookmarked ? <BookmarkCheck className="h-4 w-4" /> : <Bookmark className="h-4 w-4" />}
            </Button>
          </div>
        </article>

        {/* Replies */}
        <div className="space-y-4 mb-6">
          <h2 className="font-heading text-xl font-bold text-foreground">
            {replies.length} {replies.length === 1 ? 'Reply' : 'Replies'}
          </h2>
          
          {replies.length === 0 ? (
            <div className="text-center py-10 village-card">
              <span className="text-3xl mb-3 block">💬</span>
              <h3 className="font-heading font-semibold text-foreground mb-1">No replies yet</h3>
              <p className="text-sm text-muted-foreground">Be the first to share your thoughts or support.</p>
            </div>
          ) : (
            topLevelReplies.map(reply => renderReply(reply))
          )}
        </div>

        {/* Bottom reply form — only for top-level replies (not replying to a specific reply) */}
        {!replyingTo && (
        <div className="village-card p-6 border-l-2 border-l-primary/20 mb-8" data-testid="reply-form">
          <h3 className="font-heading font-bold text-lg text-foreground mb-4">Add a Reply</h3>
          <form onSubmit={handleReply} className="space-y-4">
            <div className="relative">
              <Textarea
                ref={replyTextareaRef}
                value={replyContent}
                onChange={(e) => {
                  setReplyContent(e.target.value.slice(0, MAX_CONTENT_LENGTH));
                  const el = e.target;
                  el.style.height = 'auto';
                  el.style.height = el.scrollHeight + 'px';
                }}
                placeholder="Share your thoughts or support..."
                className="min-h-[44px] bg-secondary/50 border-transparent focus:border-primary rounded-xl"
                style={{ overflow: 'hidden', resize: 'none' }}
                data-testid="reply-input"
              />
              <span className="absolute bottom-2 right-2 text-xs text-muted-foreground">
                {replyContent.length}/{MAX_CONTENT_LENGTH}
              </span>
            </div>
            {subscription?.limits_apply && subscription?.forum_replies && (
              <Link to="/plus" className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors -mt-1">
                <Crown className="h-3 w-3 text-amber-500" />
                {subscription.forum_replies.limit - subscription.forum_replies.used}/{subscription.forum_replies.limit} replies today
              </Link>
            )}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="anonymous"
                  checked={isAnonymous}
                  onCheckedChange={(checked) => setIsAnonymous(checked)}
                  data-testid="anonymous-checkbox"
                />
                <Label htmlFor="anonymous" className="text-sm text-muted-foreground cursor-pointer">
                  Post anonymously
                </Label>
              </div>
              <Button
                type="submit"
                disabled={submitting || !replyContent.trim() || (subscription?.limits_apply && subscription?.forum_replies && !subscription.forum_replies.allowed)}
                className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl"
                data-testid="submit-reply-btn"
              >
                {submitting ? "Posting..." : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Reply
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
        )}
      </main>
      <AppFooter />

      {/* Delete Post Modal */}
      <Dialog open={deletePostModal} onOpenChange={setDeletePostModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Post</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this post? This action cannot be undone. All replies will also be deleted.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletePostModal(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDeletePost}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Reply Modal */}
      <Dialog open={!!deleteReplyId} onOpenChange={() => setDeleteReplyId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Reply</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this reply? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteReplyId(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDeleteReply}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Report Modal */}
      <Dialog open={reportModal} onOpenChange={setReportModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Report Content</DialogTitle>
            <DialogDescription>
              Help us keep The Village safe by reporting content that violates our community guidelines.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Reason for reporting</Label>
              <Select value={reportReason} onValueChange={setReportReason}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a reason" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="harassment">Harassment or bullying</SelectItem>
                  <SelectItem value="hate_speech">Hate speech</SelectItem>
                  <SelectItem value="spam">Spam or misleading</SelectItem>
                  <SelectItem value="inappropriate">Inappropriate content</SelectItem>
                  <SelectItem value="misinformation">Dangerous misinformation</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Additional details (optional)</Label>
              <Textarea
                value={reportDetails}
                onChange={(e) => setReportDetails(e.target.value)}
                placeholder="Provide any additional context..."
                className="min-h-[80px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReportModal(false)}>Cancel</Button>
            <Button onClick={handleReport} disabled={!reportReason}>Submit Report</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
