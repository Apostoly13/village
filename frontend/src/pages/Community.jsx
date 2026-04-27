import React, { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  ArrowLeft, Users, Crown, Lock, Globe, Plus, ChevronDown, ChevronUp,
  Send, MessageSquare, MessageCircle, X, Check, BarChart2, HelpCircle,
  Star, Sparkles, Settings, Calendar, MapPin, Trash2, Pencil, Image,
  Shield, ChevronRight,
} from "lucide-react";
import Navigation from "../components/Navigation";
import AppFooter from "../components/AppFooter";
import POST_TYPES from "../utils/postTypes";
import { timeAgo, formatMeetupDate as formatDate } from "../utils/dateHelpers";
import { toast } from "sonner";

const API_URL = process.env.REACT_APP_BACKEND_URL || "";

const REACTIONS = ["❤️", "🤣", "😮", "💪", "🌟"];

// ==================== HELPERS ====================

// (timeAgo and formatDate are imported from utils/dateHelpers)

function Avatar({ picture, name, size = "sm" }) {
  const cls =
    size === "xs" ? "w-6 h-6 text-[10px]"
    : size === "sm" ? "w-8 h-8 text-xs"
    : size === "md" ? "w-10 h-10 text-sm"
    : "w-14 h-14 text-xl";
  const initials = (name || "?")
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();
  if (picture)
    return <img src={picture} alt={name} className={`${cls} rounded-full object-cover shrink-0`} />;
  return (
    <div
      className={`${cls} rounded-full bg-gradient-to-br from-primary/60 to-primary flex items-center justify-center text-white font-semibold shrink-0`}
    >
      {initials}
    </div>
  );
}

// ==================== POLL OPTION ====================

function PollOption({ option, index, pollVotes, totalVotes, userVote, onVote }) {
  const count = (pollVotes?.[String(index)] || []).length;
  const pct = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
  const isMyVote = userVote === index;
  const hasVoted = userVote !== null && userVote !== undefined;

  return (
    <button
      onClick={() => !hasVoted && onVote(index)}
      disabled={hasVoted}
      className={`w-full text-left rounded-xl border-2 overflow-hidden transition-all ${
        isMyVote
          ? "border-primary"
          : hasVoted
          ? "border-border/40"
          : "border-border/50 hover:border-primary/50"
      } ${hasVoted ? "cursor-default" : "cursor-pointer"}`}
    >
      <div className="relative px-4 py-2.5 min-h-[2.5rem]">
        {hasVoted && (
          <div
            className={`absolute inset-0 transition-all duration-700 ease-out ${
              isMyVote ? "bg-primary/15" : "bg-muted/60"
            }`}
            style={{ width: `${Math.max(pct, 2)}%` }}
          />
        )}
        <div className="relative flex items-center justify-between gap-2">
          <span className="text-sm font-medium">{option}</span>
          {hasVoted && (
            <div className="flex items-center gap-1.5 shrink-0">
              {isMyVote && <Check className="h-3.5 w-3.5 text-primary" />}
              <span className="text-xs text-muted-foreground font-semibold">{pct}%</span>
            </div>
          )}
        </div>
      </div>
    </button>
  );
}

// ==================== REACTIONS ROW ====================

function ReactionsRow({ reactions, userReactions, postId, onReact, compact = false }) {
  return (
    <div className={`flex flex-wrap gap-1.5 ${compact ? "" : "mt-2"}`}>
      {REACTIONS.map((emoji) => {
        const count = (reactions?.[emoji] || []).length;
        const active = userReactions?.includes(emoji);
        return (
          <button
            key={emoji}
            onClick={() => onReact(postId, emoji)}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-sm border transition-all select-none ${
              active
                ? "border-primary bg-primary/10 font-semibold scale-105"
                : "border-border/40 bg-muted/30 hover:border-primary/40 hover:bg-primary/5 hover:scale-105"
            }`}
          >
            <span className="leading-none">{emoji}</span>
            {count > 0 && (
              <span className={`text-xs leading-none ${active ? "text-primary" : "text-muted-foreground"}`}>
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

// ==================== REPLY SECTION ====================

function ReplySection({ postId, replyCount, currentUser }) {
  const [expanded, setExpanded] = useState(false);
  const [replies, setReplies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchReplies = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/forums/posts/${postId}/replies`, {
        credentials: "include",
      });
      if (res.ok) setReplies(await res.json());
    } catch {}
    setLoading(false);
  }, [postId]);

  const toggle = () => {
    if (!expanded) fetchReplies();
    setExpanded((v) => !v);
  };

  const submit = async () => {
    if (!text.trim() || submitting) return;
    setSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/api/forums/posts/${postId}/replies`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: text.trim() }),
      });
      if (res.ok) {
        setText("");
        await fetchReplies();
        setExpanded(true);
      }
    } catch {}
    setSubmitting(false);
  };

  const liveCount = expanded ? replies.length : replyCount;

  return (
    <div className="border-t border-border/30 pt-3 mt-1">
      <button
        onClick={toggle}
        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        <MessageCircle className="h-3.5 w-3.5" />
        <span>{liveCount} {liveCount === 1 ? "comment" : "comments"}</span>
        {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
      </button>

      {expanded && (
        <div className="mt-3 space-y-3">
          {loading ? (
            <div className="flex justify-center py-4">
              <div className="w-4 h-4 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
            </div>
          ) : (
            replies.map((r) => (
              <div key={r.reply_id} className="flex gap-3 pl-3 border-l-2 border-border/40">
                <Avatar picture={r.author_picture} name={r.author_name} size="sm" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-semibold">{r.author_name || "Anonymous"}</span>
                    <span className="text-xs text-muted-foreground">{timeAgo(r.created_at)}</span>
                  </div>
                  <p className="text-sm text-foreground/85 mt-0.5 leading-relaxed">{r.content}</p>
                </div>
              </div>
            ))
          )}

          {currentUser && (
            <div className="flex gap-2 items-center pt-1">
              <Avatar picture={currentUser.picture} name={currentUser.display_name || currentUser.name} size="sm" />
              <div className="flex-1 flex gap-2">
                <input
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submit(); }
                  }}
                  placeholder="Write a comment..."
                  className="flex-1 text-sm bg-muted/40 border border-border/50 rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary/50 min-w-0"
                />
                <button
                  onClick={submit}
                  disabled={!text.trim() || submitting}
                  className="p-2 rounded-xl bg-primary text-primary-foreground disabled:opacity-40 hover:bg-primary/90 transition-colors shrink-0"
                >
                  <Send className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ==================== POST CARD ====================

function PostCard({ post, currentUser, onReact, onPollVote }) {
  const typeConfig = POST_TYPES.find((t) => t.id === post.post_type) || POST_TYPES[0];
  const isMilestone = post.post_type === "milestone";
  const isPoll = post.post_type === "poll";
  const isMeetup = post.post_type === "meetup";

  const totalPollVotes = Object.values(post.poll_votes || {}).reduce(
    (acc, arr) => acc + (arr?.length || 0),
    0
  );

  const authorName = post.is_anonymous
    ? "Anonymous Parent"
    : post.author_name || "Community Member";
  const authorPic = post.is_anonymous ? null : post.author_picture;

  // ---- Milestone card ----
  if (isMilestone) {
    return (
      <div className="rounded-2xl bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 dark:from-amber-950/40 dark:via-yellow-950/30 dark:to-orange-950/30 border-2 border-amber-300/60 dark:border-amber-700/40 p-5">
        <div className="flex items-start gap-3">
          <div className="text-3xl leading-none mt-0.5">🌟</div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="font-semibold text-sm text-amber-900 dark:text-amber-100">{authorName}</span>
              <span className="text-xs text-amber-700/60 dark:text-amber-300/50">{timeAgo(post.created_at)}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${typeConfig.badgeCls}`}>
                {typeConfig.icon} {typeConfig.label}
              </span>
            </div>
            {post.title && (
              <h3 className="font-bold text-amber-900 dark:text-amber-100 text-base leading-snug">{post.title}</h3>
            )}
            {post.content && (
              <p className="text-sm text-amber-800 dark:text-amber-200 mt-1 leading-relaxed">{post.content}</p>
            )}
            {post.image && (
              <img
                src={post.image}
                alt="Milestone"
                className="mt-3 rounded-xl w-full max-h-72 object-cover border border-amber-300/40"
              />
            )}
          </div>
        </div>
        <div className="mt-3 space-y-2">
          <ReactionsRow
            reactions={post.reactions}
            userReactions={post.user_reactions}
            postId={post.post_id}
            onReact={onReact}
            compact
          />
          <ReplySection postId={post.post_id} replyCount={post.reply_count || 0} currentUser={currentUser} />
        </div>
      </div>
    );
  }

  // ---- Meetup card ----
  if (isMeetup) {
    return (
      <div className="rounded-2xl bg-gradient-to-br from-rose-50 via-pink-50 to-red-50 dark:from-rose-950/40 dark:via-pink-950/30 dark:to-red-950/30 border-2 border-rose-300/60 dark:border-rose-700/40 p-5">
        <div className="flex items-start gap-3">
          <div className="text-3xl leading-none mt-0.5">📍</div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <Avatar picture={authorPic} name={authorName} size="xs" />
              <span className="font-semibold text-sm text-rose-900 dark:text-rose-100">{authorName}</span>
              <span className="text-xs text-rose-700/60 dark:text-rose-300/50">{timeAgo(post.created_at)}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${typeConfig.badgeCls}`}>
                {typeConfig.icon} {typeConfig.label}
              </span>
            </div>
            {post.title && (
              <h3 className="font-bold text-rose-900 dark:text-rose-100 text-base leading-snug">{post.title}</h3>
            )}
            {post.content && (
              <p className="text-sm text-rose-800 dark:text-rose-200 mt-1 leading-relaxed">{post.content}</p>
            )}
            {/* Meetup details */}
            <div className="mt-3 flex flex-wrap gap-3">
              {post.meetup_date && (
                <div className="flex items-center gap-2 bg-rose-100/70 dark:bg-rose-900/30 border border-rose-200/60 dark:border-rose-800/40 rounded-xl px-3 py-2">
                  <Calendar className="h-3.5 w-3.5 text-rose-600 dark:text-rose-400 shrink-0" />
                  <span className="text-xs font-medium text-rose-800 dark:text-rose-200">
                    {formatDate(post.meetup_date)}
                  </span>
                </div>
              )}
              {post.meetup_location && (
                <div className="flex items-center gap-2 bg-rose-100/70 dark:bg-rose-900/30 border border-rose-200/60 dark:border-rose-800/40 rounded-xl px-3 py-2">
                  <MapPin className="h-3.5 w-3.5 text-rose-600 dark:text-rose-400 shrink-0" />
                  <span className="text-xs font-medium text-rose-800 dark:text-rose-200">
                    {post.meetup_location}
                  </span>
                </div>
              )}
            </div>
            {post.image && (
              <img
                src={post.image}
                alt="Meetup"
                className="mt-3 rounded-xl w-full max-h-72 object-cover border border-rose-300/40"
              />
            )}
          </div>
        </div>
        <div className="mt-3 space-y-2">
          <ReactionsRow
            reactions={post.reactions}
            userReactions={post.user_reactions}
            postId={post.post_id}
            onReact={onReact}
            compact
          />
          <ReplySection postId={post.post_id} replyCount={post.reply_count || 0} currentUser={currentUser} />
        </div>
      </div>
    );
  }

  // ---- Standard card (discussion / general / question / poll) ----
  return (
    <div className="rounded-2xl bg-card border border-border/50 hover:border-border/80 transition-colors p-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-3 min-w-0">
          <Avatar picture={authorPic} name={authorName} size="sm" />
          <div className="min-w-0">
            <span className="font-semibold text-sm block leading-tight">{authorName}</span>
            <span className="text-xs text-muted-foreground">{timeAgo(post.created_at)}</span>
          </div>
        </div>
        <span className={`text-xs px-2.5 py-1 rounded-full border font-medium shrink-0 ${typeConfig.badgeCls}`}>
          {typeConfig.icon} {typeConfig.label}
        </span>
      </div>

      {/* Title */}
      {post.title && (
        <h3 className="font-semibold text-foreground leading-snug mb-1">{post.title}</h3>
      )}

      {/* Content */}
      {post.content && (
        <p className="text-sm text-foreground/80 leading-relaxed">{post.content}</p>
      )}

      {/* Image */}
      {post.image && (
        <img
          src={post.image}
          alt="Post"
          className="mt-3 rounded-xl w-full max-h-72 object-cover border border-border/30"
        />
      )}

      {/* Poll options */}
      {isPoll && post.poll_options?.length > 0 && (
        <div className="mt-3 space-y-2">
          {post.poll_options.map((opt, i) => (
            <PollOption
              key={i}
              option={opt}
              index={i}
              pollVotes={post.poll_votes}
              totalVotes={totalPollVotes}
              userVote={post.user_poll_vote}
              onVote={(idx) => onPollVote(post.post_id, idx)}
            />
          ))}
          <p className="text-xs text-muted-foreground pl-1">
            {totalPollVotes} {totalPollVotes === 1 ? "vote" : "votes"}
            {post.user_poll_vote == null && " · tap to vote"}
          </p>
        </div>
      )}

      {/* Answered badge */}
      {post.post_type === "question" && post.is_answered && (
        <div className="mt-3 flex items-center gap-2 text-xs text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg px-3 py-1.5 w-fit">
          <Check className="h-3.5 w-3.5" />
          <span className="font-medium">Answered</span>
        </div>
      )}

      {/* Reactions */}
      <ReactionsRow
        reactions={post.reactions}
        userReactions={post.user_reactions}
        postId={post.post_id}
        onReact={onReact}
      />

      {/* Replies */}
      <ReplySection postId={post.post_id} replyCount={post.reply_count || 0} currentUser={currentUser} />
    </div>
  );
}

// ==================== CREATE POST FORM ====================

function CreatePostForm({ communityId, onPosted }) {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState("discussion");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [pollOptions, setPollOptions] = useState(["", ""]);
  const [anon, setAnon] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Image
  const [imageUrl, setImageUrl] = useState(null);
  const [imageUploading, setImageUploading] = useState(false);
  const imageInputRef = useRef(null);

  // Meetup
  const [meetupDate, setMeetupDate] = useState("");
  const [meetupLocation, setMeetupLocation] = useState("");

  const cfg = POST_TYPES.find((t) => t.id === type);

  const canSubmit =
    !submitting &&
    (type === "poll"
      ? pollOptions.filter((o) => o.trim()).length >= 2
      : content.trim().length > 0 || imageUrl);

  const reset = () => {
    setOpen(false);
    setTitle("");
    setContent("");
    setPollOptions(["", ""]);
    setAnon(false);
    setType("discussion");
    setImageUrl(null);
    setMeetupDate("");
    setMeetupLocation("");
  };

  const handleImageSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch(`${API_URL}/api/upload/image`, {
        method: "POST",
        credentials: "include",
        body: fd,
      });
      if (res.ok) {
        const data = await res.json();
        setImageUrl(data.image_url);
      }
    } catch {}
    setImageUploading(false);
    // Reset input so same file can be re-selected
    if (imageInputRef.current) imageInputRef.current.value = "";
  };

  const submit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      const body = {
        category_id: communityId,
        title: title.trim() || undefined,
        content: content.trim() || (type === "poll" ? "Vote below 👇" : ""),
        post_type: type,
        is_anonymous: anon,
        visibility: "public",
        poll_options: type === "poll" ? pollOptions.filter((o) => o.trim()) : [],
        image: imageUrl || undefined,
        meetup_date: type === "meetup" && meetupDate ? meetupDate : undefined,
        meetup_location: type === "meetup" && meetupLocation.trim() ? meetupLocation.trim() : undefined,
      };
      const res = await fetch(`${API_URL}/api/forums/posts`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) { reset(); onPosted(); }
    } catch {}
    setSubmitting(false);
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full bg-card border border-border/50 hover:border-primary/40 rounded-2xl px-4 py-3.5 flex items-center gap-3 text-left transition-all group"
      >
        <div className="w-9 h-9 rounded-full bg-primary/10 group-hover:bg-primary/20 flex items-center justify-center transition-colors">
          <Plus className="h-4 w-4 text-primary" />
        </div>
        <span className="text-muted-foreground text-sm">Share something with your community...</span>
      </button>
    );
  }

  return (
    <div className="bg-card border border-primary/30 rounded-2xl p-4 shadow-sm space-y-4">
      {/* Post type pills */}
      <div className="flex gap-2 flex-wrap">
        {POST_TYPES.map((pt) => (
          <button
            key={pt.id}
            onClick={() => setType(pt.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
              type === pt.id ? pt.activeCls : "border-border/40 text-muted-foreground hover:border-primary/30"
            }`}
          >
            {pt.icon} {pt.label}
          </button>
        ))}
      </div>

      {/* Title (optional, hidden for milestone only) */}
      {type !== "milestone" && (
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={cfg?.titlePlaceholder || "Title (optional)"}
          className="w-full text-sm bg-muted/30 border border-border/50 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-primary/50"
        />
      )}

      {/* Content textarea (all types except pure poll) */}
      {type !== "poll" && (
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={cfg?.placeholder}
          rows={type === "milestone" ? 3 : 4}
          className="w-full text-sm bg-muted/30 border border-border/50 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-primary/50 resize-none"
        />
      )}

      {/* Meetup fields */}
      {type === "meetup" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5 flex items-center gap-1.5">
              <Calendar className="h-3 w-3" /> Date &amp; time
            </label>
            <input
              type="datetime-local"
              value={meetupDate}
              onChange={(e) => setMeetupDate(e.target.value)}
              className="w-full text-sm bg-muted/30 border border-border/50 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-primary/50"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5 flex items-center gap-1.5">
              <MapPin className="h-3 w-3" /> Location
            </label>
            <input
              type="text"
              value={meetupLocation}
              onChange={(e) => setMeetupLocation(e.target.value)}
              placeholder="e.g. Hyde Park, Sydney"
              className="w-full text-sm bg-muted/30 border border-border/50 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-primary/50"
            />
          </div>
        </div>
      )}

      {/* Poll options */}
      {type === "poll" && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">Poll options (2–5)</p>
          {pollOptions.map((opt, i) => (
            <div key={i} className="flex gap-2">
              <input
                value={opt}
                onChange={(e) =>
                  setPollOptions((prev) => {
                    const next = [...prev];
                    next[i] = e.target.value;
                    return next;
                  })
                }
                placeholder={`Option ${i + 1}`}
                className="flex-1 text-sm bg-muted/30 border border-border/50 rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary/50"
              />
              {pollOptions.length > 2 && (
                <button
                  onClick={() => setPollOptions((prev) => prev.filter((_, idx) => idx !== i))}
                  className="p-2 text-muted-foreground hover:text-destructive transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          ))}
          {pollOptions.length < 5 && (
            <button
              onClick={() => setPollOptions((prev) => [...prev, ""])}
              className="text-xs text-primary hover:underline flex items-center gap-1"
            >
              <Plus className="h-3 w-3" /> Add option
            </button>
          )}
        </div>
      )}

      {/* Image preview + upload */}
      {imageUrl && (
        <div className="relative inline-block">
          <img src={imageUrl} alt="Preview" className="rounded-xl max-h-48 object-cover border border-border/30" />
          <button
            onClick={() => setImageUrl(null)}
            className="absolute top-2 right-2 bg-black/60 hover:bg-black/80 text-white rounded-full p-1 transition-colors"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-3">
          {/* Image upload */}
          <input
            ref={imageInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImageSelect}
          />
          <button
            type="button"
            onClick={() => imageInputRef.current?.click()}
            disabled={imageUploading}
            title="Attach photo"
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground border border-border/40 hover:border-primary/30 px-2.5 py-1.5 rounded-lg transition-colors disabled:opacity-50"
          >
            {imageUploading ? (
              <div className="w-3.5 h-3.5 rounded-full border border-primary/30 border-t-primary animate-spin" />
            ) : (
              <Image className="h-3.5 w-3.5" />
            )}
            Photo
          </button>

          {/* Anonymous */}
          <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer select-none">
            <input
              type="checkbox"
              checked={anon}
              onChange={(e) => setAnon(e.target.checked)}
              className="rounded"
            />
            Anonymous
          </label>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={reset}
            className="text-xs text-muted-foreground hover:text-foreground px-3 py-1.5 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={!canSubmit}
            className="text-xs bg-primary text-primary-foreground px-5 py-1.5 rounded-full font-medium disabled:opacity-40 hover:bg-primary/90 transition-colors"
          >
            {submitting ? "Posting…" : "Post"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ==================== MANAGE COMMUNITY MODAL ====================

function ManageCommunityModal({ communityId, community, posts, user, isOpen, onClose, onReloadCommunity, onReloadPosts }) {
  const [tab, setTab] = useState("settings");
  const [allMembers, setAllMembers] = useState([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [removingMember, setRemovingMember] = useState(null);
  const [deletingPost, setDeletingPost] = useState(null);

  // Settings form
  const [newName, setNewName] = useState(community?.name || "");
  const [newDescription, setNewDescription] = useState(community?.description || "");
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsError, setSettingsError] = useState("");
  const [settingsSuccess, setSettingsSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setNewName(community?.name || "");
      setNewDescription(community?.description || "");
      setSettingsError("");
      setSettingsSuccess(false);
      if (tab === "members") loadMembers();
    }
  }, [isOpen, community]);

  useEffect(() => {
    if (isOpen && tab === "members") loadMembers();
  }, [tab]);

  const loadMembers = async () => {
    setLoadingMembers(true);
    try {
      const res = await fetch(`${API_URL}/api/communities/${communityId}/members`, { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setAllMembers(data.members || []);
      }
    } catch {}
    setLoadingMembers(false);
  };

  const handleSaveSettings = async () => {
    setSettingsError("");
    setSettingsSuccess(false);
    if (newName.trim().length < 3 || newName.trim().length > 60) {
      setSettingsError("Name must be 3–60 characters.");
      return;
    }
    if (newDescription.trim().length < 10 || newDescription.trim().length > 200) {
      setSettingsError("Description must be 10–200 characters.");
      return;
    }
    setSavingSettings(true);
    try {
      const res = await fetch(`${API_URL}/api/forums/communities/${communityId}`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName.trim(), description: newDescription.trim() }),
      });
      if (res.ok) {
        setSettingsSuccess(true);
        onReloadCommunity();
      } else {
        const d = await res.json().catch(() => ({}));
        setSettingsError(d.detail || "Failed to save changes.");
      }
    } catch { setSettingsError("Something went wrong."); }
    setSavingSettings(false);
  };

  const handleRemoveMember = async (memberId) => {
    if (removingMember) return;
    setRemovingMember(memberId);
    try {
      const res = await fetch(`${API_URL}/api/communities/${communityId}/members/${memberId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (res.ok) {
        setAllMembers((prev) => prev.filter((m) => m.user_id !== memberId));
        onReloadCommunity();
      }
    } catch {}
    setRemovingMember(null);
  };

  const handleDeletePost = async (postId) => {
    if (deletingPost) return;
    setDeletingPost(postId);
    try {
      const res = await fetch(`${API_URL}/api/forums/posts/${postId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (res.ok) onReloadPosts();
    } catch {}
    setDeletingPost(null);
  };

  if (!isOpen) return null;

  const TABS = [
    { id: "settings", label: "Settings", icon: <Settings className="h-3.5 w-3.5" /> },
    { id: "members", label: `Members (${community?.total_member_count ?? allMembers.length})`, icon: <Users className="h-3.5 w-3.5" /> },
    { id: "posts", label: `Posts (${posts?.length ?? 0})`, icon: <MessageSquare className="h-3.5 w-3.5" /> },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-card border border-border/50 rounded-3xl shadow-2xl w-full max-w-lg max-h-[85vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/40 shrink-0">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            <h2 className="font-bold text-base">Manage Community</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border/40 px-6 shrink-0">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 text-xs font-medium py-3 px-2 mr-4 border-b-2 transition-all -mb-px ${
                tab === t.id
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="flex-1 overflow-y-auto">

          {/* Settings tab */}
          {tab === "settings" && (
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">Community name</label>
                <input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  maxLength={60}
                  className="w-full text-sm bg-muted/30 border border-border/50 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-primary/50"
                />
                <p className="text-xs text-muted-foreground mt-1 text-right">{newName.length}/60</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">Description</label>
                <textarea
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  maxLength={200}
                  rows={3}
                  className="w-full text-sm bg-muted/30 border border-border/50 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-primary/50 resize-none"
                />
                <p className="text-xs text-muted-foreground mt-1 text-right">{newDescription.length}/200</p>
              </div>
              {settingsError && (
                <p className="text-xs text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2">
                  {settingsError}
                </p>
              )}
              {settingsSuccess && (
                <p className="text-xs text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg px-3 py-2 flex items-center gap-1.5">
                  <Check className="h-3.5 w-3.5" /> Changes saved!
                </p>
              )}
              <button
                onClick={handleSaveSettings}
                disabled={savingSettings}
                className="w-full py-2.5 bg-primary text-primary-foreground text-sm font-medium rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {savingSettings ? "Saving…" : "Save changes"}
              </button>
            </div>
          )}

          {/* Members tab */}
          {tab === "members" && (
            <div className="p-4">
              {loadingMembers ? (
                <div className="flex justify-center py-8">
                  <div className="w-5 h-5 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
                </div>
              ) : allMembers.length === 0 ? (
                <p className="text-center text-sm text-muted-foreground py-8">No members yet</p>
              ) : (
                <div className="space-y-2">
                  {allMembers.map((m) => (
                    <div
                      key={m.user_id}
                      className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-muted/40 transition-colors"
                    >
                      <Avatar picture={m.picture} name={m.display_name} size="sm" />
                      <div className="flex-1 min-w-0">
                        <Link
                          to={`/profile/${m.user_id}`}
                          onClick={onClose}
                          className="text-sm font-medium hover:text-primary transition-colors block truncate"
                        >
                          {m.display_name}
                        </Link>
                        {m.is_creator && (
                          <span className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1">
                            <Crown className="h-2.5 w-2.5" /> Creator
                          </span>
                        )}
                      </div>
                      {!m.is_creator && (
                        <button
                          onClick={() => handleRemoveMember(m.user_id)}
                          disabled={removingMember === m.user_id}
                          title="Remove from community"
                          className="shrink-0 p-1.5 text-muted-foreground hover:text-destructive transition-colors disabled:opacity-50 rounded-lg hover:bg-destructive/10"
                        >
                          {removingMember === m.user_id ? (
                            <div className="w-3.5 h-3.5 rounded-full border border-destructive/30 border-t-destructive animate-spin" />
                          ) : (
                            <X className="h-3.5 w-3.5" />
                          )}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Posts tab */}
          {tab === "posts" && (
            <div className="p-4">
              {!posts || posts.length === 0 ? (
                <p className="text-center text-sm text-muted-foreground py-8">No posts yet</p>
              ) : (
                <div className="space-y-2">
                  {posts.map((p) => {
                    const typeConf = POST_TYPES.find((t) => t.id === p.post_type) || POST_TYPES[0];
                    const authorName = p.is_anonymous ? "Anonymous" : p.author_name || "Member";
                    return (
                      <div
                        key={p.post_id}
                        className="flex items-start gap-3 p-3 rounded-xl hover:bg-muted/40 border border-border/30 transition-colors"
                      >
                        <span className="text-lg leading-none mt-0.5 shrink-0">{typeConf.icon}</span>
                        <div className="flex-1 min-w-0">
                          {p.title ? (
                            <p className="text-sm font-medium truncate">{p.title}</p>
                          ) : (
                            <p className="text-sm text-muted-foreground truncate">{p.content}</p>
                          )}
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {authorName} · {timeAgo(p.created_at)}
                          </p>
                        </div>
                        <button
                          onClick={() => handleDeletePost(p.post_id)}
                          disabled={deletingPost === p.post_id}
                          title="Delete post"
                          className="shrink-0 p-1.5 text-muted-foreground hover:text-destructive transition-colors disabled:opacity-50 rounded-lg hover:bg-destructive/10"
                        >
                          {deletingPost === p.post_id ? (
                            <div className="w-3.5 h-3.5 rounded-full border border-destructive/30 border-t-destructive animate-spin" />
                          ) : (
                            <Trash2 className="h-3.5 w-3.5" />
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ==================== MAIN PAGE ====================

export default function Community() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [community, setCommunity] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loadingCommunity, setLoadingCommunity] = useState(true);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [joining, setJoining] = useState(false);
  const [manageOpen, setManageOpen] = useState(false);

  // Current user
  useEffect(() => {
    fetch(`${API_URL}/api/auth/me`, { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setUser(d))
      .catch(() => {});
  }, []);

  const fetchCommunity = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/communities/${id}`, { credentials: "include" });
      if (res.ok) setCommunity(await res.json());
      else navigate("/forums?tab=communities");
    } catch { navigate("/forums?tab=communities"); }
    setLoadingCommunity(false);
  }, [id, navigate]);

  const fetchPosts = useCallback(async () => {
    setLoadingPosts(true);
    try {
      const res = await fetch(`${API_URL}/api/communities/${id}/posts?limit=40`, {
        credentials: "include",
      });
      if (res.ok) {
        setPosts(await res.json());
      } else {
        toast.error("Failed to load posts", { action: { label: "Retry", onClick: fetchPosts } });
      }
    } catch {
      toast.error("Couldn't reach the server", { action: { label: "Retry", onClick: fetchPosts } });
    }
    setLoadingPosts(false);
  }, [id]);

  useEffect(() => { fetchCommunity(); }, [fetchCommunity]);
  useEffect(() => { fetchPosts(); }, [fetchPosts]);

  const handleJoinLeave = async () => {
    if (!community) return;
    setJoining(true);
    const endpoint = community.is_member ? "leave" : "join";
    try {
      const res = await fetch(`${API_URL}/api/forums/communities/${id}/${endpoint}`, {
        method: "POST",
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        setCommunity((prev) => ({
          ...prev,
          is_member: !prev.is_member,
          member_count: data.member_count,
          total_member_count: data.member_count,
        }));
      }
    } catch {}
    setJoining(false);
  };

  const handleReact = async (postId, emoji) => {
    try {
      const res = await fetch(`${API_URL}/api/forums/posts/${postId}/react`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emoji }),
      });
      if (res.ok) {
        const data = await res.json();
        setPosts((prev) =>
          prev.map((p) =>
            p.post_id === postId
              ? { ...p, reactions: data.reactions, user_reactions: data.user_reactions }
              : p
          )
        );
      }
    } catch {}
  };

  const handlePollVote = async (postId, optionIndex) => {
    try {
      const res = await fetch(`${API_URL}/api/forums/posts/${postId}/poll-vote`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ option_index: optionIndex }),
      });
      if (res.ok) {
        const data = await res.json();
        setPosts((prev) =>
          prev.map((p) =>
            p.post_id === postId
              ? { ...p, poll_votes: data.poll_votes, user_poll_vote: data.user_poll_vote }
              : p
          )
        );
      }
    } catch {}
  };

  // ---- Loading ----
  if (loadingCommunity) {
    return (
      <div className="min-h-screen bg-background lg:pl-60">
        <Navigation user={user} />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="w-8 h-8 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
        </div>
      </div>
    );
  }

  if (!community) return null;

  const canPost = community.is_member || community.is_creator;
  const memberCount = community.total_member_count ?? community.member_count ?? 0;

  return (
    <div className="min-h-screen bg-background lg:pl-60">
      <Navigation user={user} />

      <div className="max-w-5xl mx-auto px-4 pb-20 pt-4">
        {/* Back */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-5 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </button>

        {/* ---- Community Header ---- */}
        <div className="rounded-3xl overflow-hidden border border-border/50 mb-6 bg-card">
          <div className="px-6 py-6">
            <div className="flex flex-col sm:flex-row sm:items-start gap-4">
              {/* Icon */}
              <div className="shrink-0">
                {community.icon_url ? (
                  <img
                    src={community.icon_url}
                    alt={community.name}
                    className="w-20 h-20 rounded-2xl object-cover border-2 border-border/30 shadow-md"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/40 to-primary flex items-center justify-center text-4xl shadow-md border-2 border-border/20">
                    {community.icon || "🏘️"}
                  </div>
                )}
              </div>

              {/* Info + actions */}
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <h1 className="text-xl font-bold text-foreground leading-tight">{community.name}</h1>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full border font-medium flex items-center gap-1 ${
                      community.is_private
                        ? "bg-orange-500/10 text-orange-600 border-orange-200 dark:border-orange-800"
                        : "bg-green-500/10 text-green-600 border-green-200 dark:border-green-800"
                    }`}
                  >
                    {community.is_private ? (
                      <><Lock className="h-2.5 w-2.5" /> Private</>
                    ) : (
                      <><Globe className="h-2.5 w-2.5" /> Public</>
                    )}
                  </span>
                  {community.community_subtype === "local" && (
                    <span className="text-xs px-2 py-0.5 rounded-full border bg-blue-500/10 text-blue-600 border-blue-200 dark:border-blue-800 font-medium">
                      📍 Local
                    </span>
                  )}
                </div>

                <p className="text-sm text-muted-foreground mb-3 leading-relaxed">{community.description}</p>

                <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground mb-4">
                  <span className="flex items-center gap-1.5">
                    <Users className="h-3.5 w-3.5" />
                    <strong className="text-foreground">{memberCount}</strong> members
                  </span>
                  <span className="flex items-center gap-1.5">
                    <MessageSquare className="h-3.5 w-3.5" />
                    <strong className="text-foreground">{community.post_count || 0}</strong> posts
                  </span>
                  {!community.is_anonymous_owner && community.created_by_name && (
                    <span className="flex items-center gap-1.5">
                      <Crown className="h-3.5 w-3.5 text-amber-500" />
                      {community.created_by_name}
                    </span>
                  )}
                  {community.postcodes?.length > 0 && (
                    <span>
                      📍 {community.postcodes.slice(0, 3).join(", ")}
                      {community.postcodes.length > 3 && ` +${community.postcodes.length - 3} more`}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {community.is_creator ? (
                    <button
                      onClick={() => setManageOpen(true)}
                      className="flex items-center gap-1.5 text-xs text-muted-foreground border border-border/50 hover:border-primary/40 hover:text-foreground px-3 py-1.5 rounded-full transition-colors"
                    >
                      <Settings className="h-3 w-3" /> Manage community
                    </button>
                  ) : (
                    <button
                      onClick={handleJoinLeave}
                      disabled={joining}
                      className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
                        community.is_member
                          ? "bg-muted text-muted-foreground hover:bg-destructive/10 hover:text-destructive border border-border/50"
                          : "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm"
                      }`}
                    >
                      {joining ? "…" : community.is_member ? "Leave community" : "✨ Join community"}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ---- Main layout ---- */}
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Feed column */}
          <div className="flex-1 min-w-0 space-y-4">
            {/* Create post */}
            {canPost ? (
              <CreatePostForm communityId={id} onPosted={fetchPosts} />
            ) : (
              <div className="bg-card border border-border/50 rounded-2xl px-4 py-3.5 flex items-center gap-3 text-sm text-muted-foreground">
                <Users className="h-4 w-4 shrink-0 text-primary/60" />
                <span>
                  Join this community to post and interact with members
                </span>
              </div>
            )}

            {/* Posts */}
            {loadingPosts ? (
              <div className="flex justify-center py-16">
                <div className="w-6 h-6 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
              </div>
            ) : posts.length === 0 ? (
              <div className="text-center py-16 village-card">
                <div className="text-5xl mb-4">📭</div>
                <p className="font-semibold text-foreground">No posts yet</p>
                <p className="text-sm text-muted-foreground mt-1.5 max-w-xs mx-auto">
                  {canPost
                    ? "Be the first to post in this community!"
                    : "Join the community to start the conversation 🌟"}
                </p>
              </div>
            ) : (
              posts.map((post) => (
                <PostCard
                  key={post.post_id}
                  post={post}
                  currentUser={user}
                  onReact={handleReact}
                  onPollVote={handlePollVote}
                />
              ))
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:w-72 shrink-0 space-y-4">
            {/* About */}
            <div className="bg-card border border-border/50 rounded-2xl p-4">
              <h3 className="font-semibold text-sm mb-2">About</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">{community.description}</p>
              <div className="mt-4 space-y-2.5 text-xs text-muted-foreground border-t border-border/40 pt-3">
                <div className="flex items-center gap-2.5">
                  <Users className="h-3.5 w-3.5 shrink-0" />
                  <span>
                    <strong className="text-foreground">{memberCount}</strong> members
                  </span>
                </div>
                <div className="flex items-center gap-2.5">
                  <MessageSquare className="h-3.5 w-3.5 shrink-0" />
                  <span>
                    <strong className="text-foreground">{community.post_count || 0}</strong> posts
                  </span>
                </div>
                <div className="flex items-center gap-2.5">
                  {community.is_private ? (
                    <><Lock className="h-3.5 w-3.5 shrink-0" /><span>Private community</span></>
                  ) : (
                    <><Globe className="h-3.5 w-3.5 shrink-0" /><span>Open to everyone</span></>
                  )}
                </div>
                {!community.is_anonymous_owner && community.created_by_name && (
                  <div className="flex items-center gap-2.5">
                    <Crown className="h-3.5 w-3.5 shrink-0 text-amber-500" />
                    <span>Created by <strong className="text-foreground">{community.created_by_name}</strong></span>
                  </div>
                )}
              </div>
            </div>

            {/* Members */}
            {community.members_preview?.length > 0 && (
              <div className="bg-card border border-border/50 rounded-2xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-sm">Members</h3>
                  {community.is_creator && (
                    <button
                      onClick={() => { setManageOpen(true); }}
                      className="text-xs text-primary hover:underline flex items-center gap-1"
                    >
                      Manage <ChevronRight className="h-3 w-3" />
                    </button>
                  )}
                </div>
                <div className="space-y-2">
                  {community.members_preview.slice(0, 8).map((m) => (
                    <Link
                      key={m.user_id}
                      to={`/profile/${m.user_id}`}
                      className="flex items-center gap-2.5 group rounded-xl p-1.5 -mx-1.5 hover:bg-muted/50 transition-colors"
                    >
                      <Avatar picture={m.picture} name={m.display_name} size="sm" />
                      <span className="text-xs font-medium text-foreground group-hover:text-primary transition-colors truncate">
                        {m.display_name}
                      </span>
                      {community.created_by === m.user_id && (
                        <Crown className="h-3 w-3 text-amber-500 shrink-0 ml-auto" />
                      )}
                    </Link>
                  ))}
                </div>
                {memberCount > 8 && (
                  <button
                    onClick={() => setManageOpen(true)}
                    className="mt-2 text-xs text-muted-foreground hover:text-primary transition-colors w-full text-left pl-1"
                  >
                    +{memberCount - 8} more members
                  </button>
                )}
              </div>
            )}

            {/* Post types guide */}
            <div className="bg-card border border-border/50 rounded-2xl p-4">
              <h3 className="font-semibold text-sm mb-3 flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-primary" /> Post types
              </h3>
              <div className="space-y-2.5">
                {POST_TYPES.map((pt) => (
                  <div key={pt.id} className="flex gap-2.5">
                    <span className="text-base leading-none mt-0.5">{pt.icon}</span>
                    <div className="text-xs text-muted-foreground leading-relaxed">
                      <span className="font-medium text-foreground">{pt.label} </span>
                      {pt.description}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Join CTA (only show if not a member yet) */}
            {!canPost && (
              <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4 text-center">
                <div className="text-2xl mb-2">🌟</div>
                <p className="text-xs font-medium text-foreground mb-1">Join to participate</p>
                <p className="text-xs text-muted-foreground mb-3">
                  Post, react, vote on polls and connect with other members
                </p>
                {!community.is_creator && (
                  <button
                    onClick={handleJoinLeave}
                    disabled={joining}
                    className="text-xs bg-primary text-primary-foreground px-4 py-1.5 rounded-full font-medium hover:bg-primary/90 transition-colors"
                  >
                    Join community
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <AppFooter />

      {/* Manage Community Modal */}
      <ManageCommunityModal
        communityId={id}
        community={community}
        posts={posts}
        user={user}
        isOpen={manageOpen}
        onClose={() => setManageOpen(false)}
        onReloadCommunity={() => {
          fetchCommunity();
        }}
        onReloadPosts={() => {
          fetchPosts();
          setManageOpen(false);
        }}
      />
    </div>
  );
}
