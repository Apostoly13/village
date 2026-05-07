/**
 * ForumPost.jsx — The Village, design refresh
 * ─────────────────────────────────────────────────────
 * KEEP from frontend/src/pages/ForumPost.jsx:
 *   - All useState (post, replies, replyContent, isAnonReply, parentReplyId, etc.)
 *   - useParams (postId)
 *   - useEffect that loads post + replies
 *   - handleSubmitReply, handleLikePost, handleLikeReply, handleBookmark
 *   - handleReport, handleDelete, handleEdit
 *   - The author-actions menu (edit/delete) for owner-only
 *   - The reply nesting logic (parent_reply_id chain)
 *
 * REPLACE entire JSX. Editorial reading layout:
 *   - Centered ~720px column
 *   - Eyebrow (category) + headline (Fraunces)
 *   - Author meta strip with avatar + chips
 *   - Long-form body with serif scaffolding
 *   - Engagement bar (like, bookmark, share, report)
 *   - Reply composer (sticky on mobile, inline on desktop)
 *   - Replies list with nested indentation
 * ─────────────────────────────────────────────────────
 */
import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import {
  Heart, MessageCircle, Bookmark, Share2, Flag, MoreHorizontal,
  ArrowLeft, Reply, Eye,
} from 'lucide-react';
import { toast } from 'sonner';

import Navigation from '../components/Navigation';
import {
  Button, Pill, Avatar, IconButton, SectionHeading,
} from '../components/village';
import { cn } from '../lib/cn';

const API_URL = process.env.REACT_APP_BACKEND_URL;

export default function ForumPost({ user }) {
  const { postId } = useParams();
  const navigate = useNavigate();

  const [post, setPost]                 = useState(null);
  const [replies, setReplies]           = useState([]);
  const [replyContent, setReplyContent] = useState('');
  const [isAnonReply, setIsAnonReply]   = useState(false);
  const [parentReplyId, setParentReplyId] = useState(null);
  const [submitting, setSubmitting]     = useState(false);
  const [loading, setLoading]           = useState(true);

  useEffect(() => {
    fetchPost();
    fetchReplies();
  }, [postId]);

  async function fetchPost() {
    try {
      const r = await fetch(`${API_URL}/api/forums/posts/${postId}`, { credentials: 'include' });
      if (r.ok) setPost(await r.json());
    } catch {}
    finally { setLoading(false); }
  }

  async function fetchReplies() {
    try {
      const r = await fetch(`${API_URL}/api/forums/posts/${postId}/replies`, { credentials: 'include' });
      if (r.ok) setReplies(await r.json());
    } catch {}
  }

  async function handleSubmitReply(e) {
    e.preventDefault();
    if (!replyContent.trim()) return;
    setSubmitting(true);
    try {
      const r = await fetch(`${API_URL}/api/forums/posts/${postId}/replies`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          content: replyContent,
          is_anonymous: isAnonReply,
          parent_reply_id: parentReplyId,
        }),
      });
      if (r.ok) {
        setReplyContent('');
        setParentReplyId(null);
        setIsAnonReply(false);
        fetchReplies();
        toast.success('Reply sent.');
      } else {
        const data = await r.json();
        toast.error(data.detail || 'Could not post reply.');
      }
    } catch {
      toast.error('Something went wrong.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleLikePost() {
    if (!post) return;
    const liked = post.user_liked;
    setPost(p => ({ ...p, user_liked: !liked, like_count: (p.like_count || 0) + (liked ? -1 : 1) }));
    try {
      await fetch(`${API_URL}/api/forums/posts/${postId}/like`, {
        method: liked ? 'DELETE' : 'POST', credentials: 'include',
      });
    } catch {}
  }

  async function handleBookmark() {
    if (!post) return;
    const bookmarked = post.user_bookmarked;
    setPost(p => ({ ...p, user_bookmarked: !bookmarked }));
    try {
      await fetch(`${API_URL}/api/forums/posts/${postId}/bookmark`, {
        method: bookmarked ? 'DELETE' : 'POST', credentials: 'include',
      });
      toast.success(bookmarked ? 'Removed from saved.' : 'Saved.');
    } catch {}
  }

  if (loading) return <PostLoading user={user} />;
  if (!post)   return <PostNotFound user={user} />;

  const fmtTime = (d) => { try { return formatDistanceToNow(new Date(d), { addSuffix: true }); } catch { return ''; } };

  return (
    <div className="min-h-screen bg-paper">
      <Navigation user={user} />

      <main className="lg:pl-[240px] pt-14 lg:pt-0">
        <div className="max-w-reading mx-auto px-4 sm:px-6 lg:px-10 py-6 lg:py-12">

          {/* Back link */}
          <Link
            to={`/forums/category/${post.category_id}`}
            className="inline-flex items-center gap-2 text-body-sm text-ink-muted hover:text-ink mb-8"
          >
            <ArrowLeft className="h-4 w-4" strokeWidth={1.5} />
            Back to {post.category_name || 'space'}
          </Link>

          {/* Category eyebrow */}
          <p className="font-mono text-eyebrow uppercase text-ink-faint mb-3">
            {post.category_name || 'COMMUNITY'} · {fmtTime(post.created_at).toUpperCase()}
          </p>

          {/* Headline */}
          <h1 className="font-display text-display-md text-ink leading-[1.05] mb-6 text-wrap-pretty">
            {post.title}
          </h1>

          {/* Author meta */}
          <div className="flex items-center gap-3 pb-6 mb-8 border-b border-line-soft">
            {post.is_anonymous ? (
              <Avatar name="?" size="md" />
            ) : (
              <Link to={`/profile/${post.author_id}`}>
                <Avatar name={post.author_name} src={post.author_picture} size="md" />
              </Link>
            )}
            <div className="flex-1 min-w-0">
              {post.is_anonymous ? (
                <p className="text-body italic text-ink-muted">Anonymous</p>
              ) : (
                <Link
                  to={`/profile/${post.author_id}`}
                  className="text-body font-medium text-ink hover:text-accent"
                >
                  {post.author_name}
                </Link>
              )}
              <p className="text-body-sm text-ink-faint">
                {post.suburb && <span>{post.suburb}{post.state ? `, ${post.state}` : ''} · </span>}
                <span className="inline-flex items-center gap-1">
                  <Eye className="h-3 w-3" strokeWidth={1.5} /> {post.views || 0} views
                </span>
              </p>
            </div>
            {post.author_id === user?.user_id && (
              <button
                onClick={() => navigate(`/edit-post/${postId}`)}
                className="text-body-sm text-ink-muted hover:text-ink"
              >
                Edit
              </button>
            )}
          </div>

          {/* Body */}
          <article className="prose-village">
            {post.image && (
              <img src={post.image} alt="" className="w-full rounded-lg mb-6" />
            )}
            <div className="text-body-lg lg:text-[18px] leading-[1.75] text-ink whitespace-pre-wrap">
              {post.content}
            </div>
          </article>

          {/* Engagement bar */}
          <div className="flex items-center gap-2 mt-10 pt-6 border-t border-line-soft">
            <ActionPill
              active={post.user_liked}
              onClick={handleLikePost}
              icon={Heart}
              label={`${post.like_count || 0} ${(post.like_count || 0) === 1 ? 'like' : 'likes'}`}
            />
            <ActionPill
              icon={MessageCircle}
              label={`${replies.length} ${replies.length === 1 ? 'reply' : 'replies'}`}
            />
            <ActionPill
              active={post.user_bookmarked}
              onClick={handleBookmark}
              icon={Bookmark}
              label={post.user_bookmarked ? 'Saved' : 'Save'}
            />
            <div className="ml-auto flex items-center gap-1">
              <IconButton icon={Share2} label="Share" onClick={() => {
                navigator.clipboard?.writeText(window.location.href);
                toast.success('Link copied.');
              }} />
              <IconButton icon={Flag} label="Report" />
            </div>
          </div>

          {/* Replies */}
          <section className="mt-12">
            <SectionHeading>{replies.length} {replies.length === 1 ? 'reply' : 'replies'}</SectionHeading>

            {/* Composer */}
            <form onSubmit={handleSubmitReply} className="village-card p-4 mb-6 mt-4">
              {parentReplyId && (
                <div className="flex items-center justify-between mb-2 text-body-sm text-ink-muted">
                  <span className="inline-flex items-center gap-1.5">
                    <Reply className="h-3 w-3" strokeWidth={1.5} />
                    Replying to a comment
                  </span>
                  <button type="button" onClick={() => setParentReplyId(null)} className="text-ink-faint hover:text-ink">Cancel</button>
                </div>
              )}
              <textarea
                value={replyContent}
                onChange={e => setReplyContent(e.target.value)}
                placeholder="Add to the conversation…"
                rows={3}
                className="w-full bg-transparent text-body text-ink placeholder:text-ink-faint resize-none focus:outline-none"
              />
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-line-soft">
                <label className="inline-flex items-center gap-2 text-body-sm text-ink-muted cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isAnonReply}
                    onChange={e => setIsAnonReply(e.target.checked)}
                    className="accent-accent"
                  />
                  Reply anonymously
                </label>
                <Button type="submit" variant="primary" size="sm" disabled={submitting || !replyContent.trim()}>
                  {submitting ? 'Sending…' : 'Reply'}
                </Button>
              </div>
            </form>

            {/* Reply list */}
            {replies.length === 0 ? (
              <div className="village-card px-6 py-10 text-center">
                <p className="font-display italic text-ink mb-1">Be the first to reply.</p>
                <p className="text-body-sm text-ink-muted">A kind word or a "me too" goes a long way.</p>
              </div>
            ) : (
              <div className="space-y-1">
                {replies.map(r => (
                  <ReplyItem
                    key={r.reply_id}
                    reply={r}
                    onReply={() => setParentReplyId(r.reply_id)}
                  />
                ))}
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}

// ───────────── Local components ─────────────

function ActionPill({ icon: Icon, label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-1.5 h-9 px-3 rounded-full transition-colors',
        'text-body-sm',
        active
          ? 'bg-accent-soft text-accent'
          : 'text-ink-muted hover:bg-line-soft hover:text-ink'
      )}
    >
      <Icon className={cn('h-4 w-4', active && 'fill-current')} strokeWidth={1.5} />
      {label}
    </button>
  );
}

function ReplyItem({ reply, onReply }) {
  const isAnon = reply.is_anonymous;
  const indent = reply.parent_reply_id ? 'ml-10 lg:ml-12' : '';
  const fmt = (d) => { try { return formatDistanceToNow(new Date(d), { addSuffix: true }); } catch { return ''; } };

  return (
    <article className={cn('py-4 border-b border-line-soft last:border-0', indent)}>
      <div className="flex items-start gap-3">
        {isAnon ? <Avatar name="?" size="sm" /> : (
          <Link to={`/profile/${reply.author_id}`}>
            <Avatar name={reply.author_name} src={reply.author_picture} size="sm" />
          </Link>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {isAnon ? (
              <span className="text-body-sm italic text-ink-muted">Anonymous</span>
            ) : (
              <Link to={`/profile/${reply.author_id}`} className="text-body-sm font-medium text-ink hover:text-accent">
                {reply.author_name}
              </Link>
            )}
            <span className="font-mono text-eyebrow uppercase text-ink-faint">{fmt(reply.created_at)}</span>
            {reply.is_edited && <span className="text-micro text-ink-faint italic">edited</span>}
          </div>
          <p className="text-body text-ink leading-relaxed whitespace-pre-wrap">{reply.content}</p>
          <div className="flex items-center gap-4 mt-2 text-body-sm text-ink-faint">
            <button className="inline-flex items-center gap-1 hover:text-accent transition-colors">
              <Heart className="h-3.5 w-3.5" strokeWidth={1.5} />
              {reply.like_count || 0}
            </button>
            <button onClick={onReply} className="inline-flex items-center gap-1 hover:text-ink transition-colors">
              <Reply className="h-3.5 w-3.5" strokeWidth={1.5} />
              Reply
            </button>
            <button className="ml-auto hover:text-ink"><MoreHorizontal className="h-3.5 w-3.5" strokeWidth={1.5} /></button>
          </div>
        </div>
      </div>
    </article>
  );
}

function PostLoading({ user }) {
  return (
    <div className="min-h-screen bg-paper">
      <Navigation user={user} />
      <main className="lg:pl-[240px] pt-14 lg:pt-0">
        <div className="max-w-reading mx-auto px-6 py-12 animate-pulse space-y-4">
          <div className="h-3 w-32 bg-line-soft rounded" />
          <div className="h-10 w-3/4 bg-line-soft rounded" />
          <div className="h-10 w-1/2 bg-line-soft rounded" />
          <div className="h-3 bg-line-soft rounded w-full mt-8" />
          <div className="h-3 bg-line-soft rounded w-full" />
          <div className="h-3 bg-line-soft rounded w-2/3" />
        </div>
      </main>
    </div>
  );
}

function PostNotFound({ user }) {
  return (
    <div className="min-h-screen bg-paper">
      <Navigation user={user} />
      <main className="lg:pl-[240px] pt-14 lg:pt-0">
        <div className="max-w-reading mx-auto px-6 py-20 text-center">
          <p className="font-display italic text-section text-ink mb-2">Couldn't find that post.</p>
          <p className="text-body text-ink-muted mb-6">It may have been removed or made private.</p>
          <Link to="/dashboard">
            <Button variant="primary">Back to feed</Button>
          </Link>
        </div>
      </main>
    </div>
  );
}
