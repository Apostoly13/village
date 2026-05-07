import { cn } from '../../lib/cn';
import { Link } from 'react-router-dom';
import { Heart, MessageCircle, Eye } from 'lucide-react';
import Avatar from './Avatar';
import Pill from './Pill';

/**
 * PostCard — the feed card. Structure is fixed; see DESIGN-LANGUAGE.md §7.
 *
 * <PostCard
 *   post={{ post_id, title, content, author_name, author_picture, author_id,
 *           category_name, category_icon, created_at, reply_count, like_count,
 *           views, user_liked, is_anonymous, is_admin, is_verified }}
 *   liked={true|false}
 *   likeCount={n}
 *   onOpen={() => nav(...)}
 *   onLike={e => ...}
 *   onReply={() => ...}
 *   badge={{ label: 'Needs support', color: 'warn' }}  // optional
 * />
 */
export default function PostCard({
  post,
  liked,
  likeCount,
  onOpen,
  onLike,
  onReply,
  badge,
  timeAgo,
}) {
  const isAnon = post.is_anonymous;
  const authorName = isAnon ? 'Anonymous' : post.author_name;
  const categoryLabel = post.category_name?.toUpperCase() || 'COMMUNITY';

  return (
    <article
      onClick={onOpen}
      role="button"
      tabIndex={0}
      onKeyDown={e => e.key === 'Enter' && onOpen?.()}
      aria-label={`Open post: ${post.title}`}
      className={cn(
        'village-card village-card-hover village-focus',
        'px-5 py-4 cursor-pointer'
      )}
    >
      {/* Meta row */}
      <div className="flex items-center gap-2.5 mb-3">
        {isAnon ? (
          <Avatar name="?" size="sm" />
        ) : (
          <Link
            to={`/profile/${post.author_id}`}
            onClick={e => e.stopPropagation()}
          >
            <Avatar name={post.author_name} src={post.author_picture} size="sm" />
          </Link>
        )}
        <div className="flex items-center gap-2 min-w-0 flex-1 text-body-sm">
          {isAnon ? (
            <span className="text-ink-muted italic">Anonymous</span>
          ) : (
            <Link
              to={`/profile/${post.author_id}`}
              onClick={e => e.stopPropagation()}
              className="font-medium text-ink hover:text-accent transition-colors truncate"
            >
              {authorName}
            </Link>
          )}
          <span className="font-mono text-eyebrow uppercase text-ink-faint shrink-0">
            {categoryLabel}
          </span>
          {timeAgo && (
            <>
              <span className="text-ink-faint/60 shrink-0">·</span>
              <span className="font-mono text-eyebrow uppercase text-ink-faint shrink-0">
                {timeAgo}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Title */}
      <h3 className="font-ui text-card-title text-ink leading-snug mb-2 text-wrap-pretty">
        {post.title}
      </h3>

      {/* Preview */}
      {post.content?.trim() && (
        <p className="text-body-sm text-ink-muted line-clamp-2 leading-relaxed">
          {post.content}
        </p>
      )}

      {/* Badge (optional) */}
      {badge && (
        <div className="mt-3">
          <Pill color={badge.color || 'neutral'}>{badge.label}</Pill>
        </div>
      )}

      {/* Engagement row */}
      <div className="flex items-center gap-5 mt-4 pt-3 border-t border-line-soft">
        <button
          onClick={e => { e.stopPropagation(); onLike?.(e); }}
          aria-label={liked ? 'Unlike post' : 'Like post'}
          className={cn(
            'inline-flex items-center gap-1.5 text-body-sm transition-colors',
            'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent/40 rounded',
            liked ? 'text-accent' : 'text-ink-muted hover:text-accent'
          )}
        >
          <Heart className={cn('h-[14px] w-[14px]', liked && 'fill-current')} strokeWidth={1.5} />
          <span>{likeCount ?? post.like_count ?? 0}</span>
        </button>
        <button
          onClick={e => { e.stopPropagation(); onReply?.(); }}
          aria-label="View replies"
          className="inline-flex items-center gap-1.5 text-body-sm text-ink-muted hover:text-ink transition-colors"
        >
          <MessageCircle className="h-[14px] w-[14px]" strokeWidth={1.5} />
          <span>{post.reply_count ?? 0}</span>
        </button>
        <span className="inline-flex items-center gap-1.5 text-body-sm text-ink-faint">
          <Eye className="h-[14px] w-[14px]" strokeWidth={1.5} />
          <span>{post.views ?? 0}</span>
        </span>
      </div>
    </article>
  );
}
