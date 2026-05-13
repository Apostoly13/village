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
import MarkdownContent from "../components/MarkdownContent";
import MarkdownToolbar from "../components/MarkdownToolbar";
import { CrisisSupportBanner } from "../components/village/CrisisSupportBanner";
import { toast } from "sonner";
import { ArrowLeft, Heart, MessageCircle, Eye, Clock, Bookmark, BookmarkCheck, MoreVertical, Edit2, Trash2, Reply, MapPin, Sparkles, X, SearchX } from "lucide-react";
import { SendIcon, ReportIcon, EditIcon, DeleteIcon } from "../components/village/VillageLineIcons";
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
  // Bottom (top-level) reply form state
  const [replyContent, setReplyContent] = useState("");
  const replyTextareaRef = useRef(null);
  // Inline (threaded) reply form state — separate so bottom box stays accessible when a thread is collapsed
  const [inlineReplyContent, setInlineReplyContent] = useState("");
  const inlineReplyRef = useRef(null);
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

  // Collapsible threads
  const [collapsedThreads, setCollapsedThreads] = useState(new Set());
  const toggleCollapse = (replyId) => setCollapsedThreads(prev => {
    const next = new Set(prev);
    next.has(replyId) ? next.delete(replyId) : next.add(replyId);
    return next;
  });

  // Modal states
  const [deletePostModal, setDeletePostModal] = useState(false);
  const [deleteReplyId, setDeleteReplyId] = useState(null);
  const [lightboxImage, setLightboxImage] = useState(null);
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

  // Auto-continue list items when pressing Enter inside a bullet or numbered list
  const handleListKeyDown = (e, value, setValue) => {
    if (e.key !== "Enter" || e.shiftKey) return;
    const el = e.target;
    const cursor = el.selectionStart;
    const lineStart = value.lastIndexOf("\n", cursor - 1) + 1;
    const lineText = value.slice(lineStart, cursor);
    const bulletMatch = lineText.match(/^(\s*)([-*]|\d+\.) /);
    if (!bulletMatch) return;
    e.preventDefault();
    const [full, indent, marker] = bulletMatch;
    const afterPrefix = lineText.slice(full.length);
    if (!afterPrefix.trim()) {
      // Empty bullet — exit the list
      const newValue = value.slice(0, lineStart) + "\n" + value.slice(cursor);
      setValue(newValue.slice(0, MAX_CONTENT_LENGTH));
      setTimeout(() => { el.setSelectionRange(lineStart + 1, lineStart + 1); }, 0);
    } else {
      // Continue the list with the next item
      const nextMarker = /\d+\./.test(marker) ? `${parseInt(marker) + 1}.` : marker;
      const insert = `\n${indent}${nextMarker} `;
      const newValue = value.slice(0, cursor) + insert + value.slice(el.selectionEnd);
      setValue(newValue.slice(0, MAX_CONTENT_LENGTH));
      setTimeout(() => { el.setSelectionRange(cursor + insert.length, cursor + insert.length); }, 0);
    }
  };

  // Shared post-reply logic to avoid duplication
  const _postReply = async (content, parentReplyId, onSuccess) => {
    setSubmitting(true);
    try {
      const response = await fetch(`${API_URL}/api/forums/posts/${postId}/replies`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          content,
          is_anonymous: isAnonymous,
          parent_reply_id: parentReplyId || null
        })
      });

      if (response.ok) {
        const newReply = await response.json();
        // Server doesn't enrich create-reply response with is_own_reply, so set it here
        newReply.is_own_reply = true;
        setReplies(prev => [...prev, newReply]);
        setPost(prev => ({ ...prev, reply_count: (prev.reply_count || 0) + 1 }));
        setSubscription(prev => prev ? {
          ...prev,
          usage: { ...prev.usage, replies_this_week: (prev.usage?.replies_this_week || 0) + 1 }
        } : prev);
        onSuccess?.();
        toast.success("Reply posted!");
      } else if (response.status === 429) {
        const err = await response.json();
        toast.error(err.detail?.message || "Daily reply limit reached");
        fetchSubscription();
      } else {
        toast.error("Failed to post reply");
      }
    } catch (error) {
      toast.error("Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  // Bottom form — always top-level (parent_reply_id: null)
  const handleReply = async (e) => {
    e.preventDefault();
    if (!replyContent.trim()) return;
    await _postReply(replyContent, null, () => {
      setReplyContent("");
      setIsAnonymous(false);
      if (replyTextareaRef.current) replyTextareaRef.current.style.height = '';
    });
  };

  // Inline form — threaded reply to a specific reply
  const handleInlineReply = async (e) => {
    e.preventDefault();
    if (!inlineReplyContent.trim()) return;
    await _postReply(inlineReplyContent, replyingTo?.reply_id, () => {
      setInlineReplyContent("");
      setIsAnonymous(false);
      setReplyingTo(null);
      if (inlineReplyRef.current) inlineReplyRef.current.style.height = '';
    });
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
    const isCollapsed = collapsedThreads.has(reply.reply_id);

    // Use global position in the flat replies array so every reply alternates reliably
    const globalIndex = replies.findIndex(r => r.reply_id === reply.reply_id);
    const isEven = globalIndex % 2 === 0;
    const bgClass = isEven ? 'bg-card' : 'bg-secondary dark:bg-secondary/80';

    return (
      <div key={reply.reply_id} className={depth > 0 ? 'ml-4 border-l-2 border-[var(--line)] pl-3' : 'pl-3 rounded-l-sm'}>
        <div
          className={`${bgClass} rounded-[18px] p-4 border mb-3 ${isEven ? 'border-border/40' : 'border-[var(--line)]'}`}
          data-testid={`reply-${reply.reply_id}`}
        >
          <div className="flex items-start gap-3">
            {reply.author_id !== "anonymous" ? (
              <Link to={`/profile/${reply.author_id}`}>
                <Avatar className="h-10 w-10 cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all">
                  <AvatarImage src={reply.author_picture} />
                  <AvatarFallback>
                    {reply.author_name?.[0]?.toUpperCase() || '?'}
                  </AvatarFallback>
                </Avatar>
              </Link>
            ) : (
              <Avatar className="h-10 w-10">
                <AvatarFallback>?</AvatarFallback>
              </Avatar>
            )}
            <div className="flex-1 min-w-0 overflow-hidden">
              {/* Header row — always visible, tappable on mobile to collapse */}
              <div
                className="flex items-center justify-between mb-2 cursor-pointer sm:cursor-default"
                onClick={() => { if (window.innerWidth < 640) toggleCollapse(reply.reply_id); }}
              >
                <div className="flex items-center gap-2 flex-wrap">
                  {/* Desktop collapse toggle */}
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); toggleCollapse(reply.reply_id); }}
                    className="hidden sm:inline-flex items-center justify-center w-4 h-4 rounded text-[10px] font-bold leading-none text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors select-none shrink-0"
                    title={isCollapsed ? "Expand thread" : "Collapse thread"}
                  >
                    {isCollapsed ? '+' : '−'}
                  </button>
                  {reply.author_id !== "anonymous" ? (
                    <Link to={`/profile/${reply.author_id}`} className="hover:underline flex items-center gap-1 flex-wrap" onClick={e => e.stopPropagation()}>
                      <span className="font-medium text-foreground hover:text-foreground transition-colors">{reply.author_name}</span>
                      {reply.author_subscription_tier === "premium" && !reply.is_anonymous && <Sparkles className="h-3 w-3" style={{ color: "hsl(var(--accent))" }} />}
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
                  {isCollapsed && childReplies.length > 0 && (
                    <span className="text-xs text-muted-foreground ml-1">· {childReplies.length} {childReplies.length === 1 ? 'reply' : 'replies'} hidden</span>
                  )}
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
                      <ReportIcon size={16} className="mr-2" />
                      Report
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              
              {!isCollapsed && (isEditing ? (
                <div className="space-y-3">
                  <Textarea
                    value={editReplyContent}
                    onChange={(e) => setEditReplyContent(e.target.value)}
                    className="min-h-[80px] bg-secondary/50 border-transparent focus:border-[var(--line-2)] rounded-xl"
                  />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => handleEditReply(reply.reply_id)} className="rounded-xl">Save</Button>
                    <Button size="sm" variant="outline" onClick={() => setEditingReplyId(null)} className="rounded-xl">Cancel</Button>
                  </div>
                </div>
              ) : (
                <MarkdownContent content={reply.content} className="text-sm" />
              ))}
              
              {!isCollapsed && (
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
                        setInlineReplyContent("");
                        if (inlineReplyRef.current) inlineReplyRef.current.style.height = '';
                      } else {
                        setReplyingTo(reply);
                        setInlineReplyContent("");
                      }
                    }}
                    className={`rounded-full h-8 px-3 ${replyingTo?.reply_id === reply.reply_id ? 'text-primary' : 'text-muted-foreground'}`}
                  >
                    <Reply className="h-4 w-4 mr-1" />
                    {replyingTo?.reply_id === reply.reply_id ? 'Cancel' : 'Reply'}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Inline reply form — appears directly below this reply, uses own state so bottom box stays accessible */}
        {!isCollapsed && replyingTo?.reply_id === reply.reply_id && (
          <div className="mt-1 mb-3 ml-4 pl-3 border-l-2 border-[var(--line)]">
            <form onSubmit={handleInlineReply} className="village-card overflow-hidden p-0 space-y-0">
              <MarkdownToolbar textareaRef={inlineReplyRef} value={inlineReplyContent} onChange={(v) => setInlineReplyContent(v.slice(0, MAX_CONTENT_LENGTH))} />
              <div className="relative p-4 pb-3">
                <Textarea
                  ref={inlineReplyRef}
                  value={inlineReplyContent}
                  onChange={(e) => {
                    setInlineReplyContent(e.target.value.slice(0, MAX_CONTENT_LENGTH));
                    const el = e.target;
                    el.style.height = 'auto';
                    el.style.height = el.scrollHeight + 'px';
                  }}
                  onKeyDown={(e) => handleListKeyDown(e, inlineReplyContent, setInlineReplyContent)}
                  placeholder={`Reply to ${reply.author_name}...`}
                  className="min-h-[44px] bg-transparent border-transparent focus:border-transparent shadow-none text-sm resize-none"
                  style={{ overflow: 'hidden', resize: 'none' }}
                  autoFocus
                />
                <span className="absolute bottom-2 right-4 text-xs text-muted-foreground">{inlineReplyContent.length}/{MAX_CONTENT_LENGTH}</span>
              </div>
              {subscription?.limits_apply && subscription?.forum_replies && (
                <Link to="/plus" className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors mb-1">
                  <Sparkles className="h-3 w-3" style={{ color: "hsl(var(--accent))" }} />
                  {subscription.forum_replies.limit - subscription.forum_replies.used}/{subscription.forum_replies.limit} replies today
                </Link>
              )}
              <div className="flex items-center justify-between px-4 pb-4">
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
                  disabled={submitting || !inlineReplyContent.trim() || (subscription?.limits_apply && subscription?.forum_replies && !subscription.forum_replies.allowed)}
                  className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl h-8 text-xs"
                >
                  {submitting ? "Posting..." : <><SendIcon size={12} className="mr-1" />Post Reply</>}
                </Button>
              </div>
            </form>
          </div>
        )}

        {!isCollapsed && childReplies.map(child => renderReply(child, depth + 1))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background  lg:pl-60 lg:pb-0">
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
      <div className="min-h-screen bg-background  lg:pl-60 lg:pb-0">
        <Navigation user={user} />
        <main className="max-w-4xl mx-auto px-4 pt-16 lg:pt-8">
          <div className="text-center py-16 village-card">
            <SearchX size={28} style={{ color: "var(--ink-3)", margin: "0 auto 12px" }} />
            <h1 className="font-heading text-xl font-bold mb-2" style={{ color: "var(--ink)" }}>Post not found</h1>
            <p className="mb-6" style={{ fontFamily: "var(--serif)", fontStyle: "italic", fontSize: 13, color: "var(--ink-3)" }}>This post may have been removed or the link is incorrect.</p>
            <Link to="/forums">
              <Button className="rounded-xl">Back to Spaces</Button>
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background  lg:pl-60 lg:pb-0">
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
          return <CrisisSupportBanner onDismiss={() => setCrisisDismissed(true)} />;
        })()}

        {/* Main Post */}
        <article className="village-card p-6 mb-6" data-testid="post-content">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              {post.author_id !== "anonymous" ? (
                <Link to={`/profile/${post.author_id}`}>
                  <Avatar className="h-12 w-12 cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all">
                    <AvatarImage src={post.author_picture} />
                    <AvatarFallback className="text-lg">
                      {post.author_name?.[0]?.toUpperCase() || '?'}
                    </AvatarFallback>
                  </Avatar>
                </Link>
              ) : (
                <Avatar className="h-12 w-12">
                  <AvatarFallback className="text-lg">?</AvatarFallback>
                </Avatar>
              )}
              <div>
                {post.author_id !== "anonymous" ? (
                  <Link to={`/profile/${post.author_id}`} className="hover:underline">
                    <p className="font-medium text-foreground hover:text-foreground transition-colors flex items-center gap-1 flex-wrap">
                      {post.author_name}
                      {post.author_subscription_tier === "premium" && !post.is_anonymous && <Sparkles className="h-3 w-3" style={{ color: "hsl(var(--accent))" }} />}
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
                    <ReportIcon size={16} className="mr-2" />
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
                className="text-xl font-bold bg-secondary/50 border-transparent focus:border-[var(--line-2)]"
                placeholder="Post title"
              />
              <div className="relative">
                <Textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value.slice(0, MAX_CONTENT_LENGTH))}
                  className="min-h-[150px] bg-secondary/50 border-transparent focus:border-[var(--line-2)] rounded-xl"
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
              <MarkdownContent content={post.content} className="mb-4" />
              {post.image && (
                <div className="mb-6 rounded-xl overflow-hidden border border-border/50">
                  <img 
                    src={post.image} 
                    alt="Post attachment" 
                    className="w-full max-h-96 object-cover cursor-zoom-in hover:opacity-90 transition-opacity"
                    onClick={() => setLightboxImage(post.image)}
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
              <MessageCircle size={28} style={{ color: "var(--ink-3)", margin: "0 auto 12px" }} />
              <h3 className="font-heading font-semibold mb-1" style={{ color: "var(--ink)" }}>No replies yet</h3>
              <p style={{ fontFamily: "var(--serif)", fontStyle: "italic", fontSize: 13, color: "var(--ink-3)" }}>Be the first to share your thoughts or support.</p>
            </div>
          ) : (
            topLevelReplies.map(reply => renderReply(reply))
          )}
        </div>

        {/* Bottom reply form — only for top-level replies (not replying to a specific reply) */}
        <div className="village-card p-6 mb-8" data-testid="reply-form">
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
                onKeyDown={(e) => handleListKeyDown(e, replyContent, setReplyContent)}
                placeholder="Share your thoughts or support..."
                className="min-h-[44px] bg-secondary/50 border-transparent focus:border-[var(--line-2)] rounded-xl"
                style={{ overflow: 'hidden', resize: 'none' }}
                data-testid="reply-input"
              />
              <span className="absolute bottom-2 right-2 text-xs text-muted-foreground">
                {replyContent.length}/{MAX_CONTENT_LENGTH}
              </span>
            </div>
            {subscription?.limits_apply && subscription?.forum_replies && (
              <Link to="/plus" className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors -mt-1">
                <Sparkles className="h-3 w-3" style={{ color: "hsl(var(--accent))" }} />
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
                    <SendIcon size={16} className="mr-2" />
                    Reply
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
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

      {/* Lightbox */}
      {lightboxImage && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center cursor-zoom-out p-4"
          onClick={() => setLightboxImage(null)}
        >
          <img
            src={lightboxImage}
            alt="Full size"
            className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
            onClick={e => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
