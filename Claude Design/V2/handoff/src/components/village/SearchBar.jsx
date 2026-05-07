import { cn } from '../../lib/cn';
import { Search, Plus } from 'lucide-react';

/**
 * SearchBar — the combined search + new-post bar on Dashboard / Forums.
 *
 * <SearchBar value={q} onChange={setQ} onSubmit={...} onNewPost={() => nav('/create-post')} />
 *
 * Pass `newPostLabel={null}` to hide the attached button.
 */
export default function SearchBar({
  value, onChange, onSubmit, onNewPost,
  placeholder = 'Search posts and spaces…',
  newPostLabel = 'New Post',
  className = ''
}) {
  return (
    <form
      onSubmit={e => { e.preventDefault(); onSubmit?.(value); }}
      className={cn('flex items-center gap-2', className)}
    >
      <div className="relative flex-1">
        <Search
          className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-faint pointer-events-none"
          strokeWidth={1.5}
        />
        <input
          type="search"
          value={value}
          onChange={e => onChange?.(e.target.value)}
          placeholder={placeholder}
          className={cn(
            'w-full h-12 pl-11 pr-5 rounded-full',
            'bg-card border border-line text-ink placeholder:text-ink-faint font-ui text-body',
            'focus:outline-none focus:border-ink-muted focus-visible:ring-2 focus-visible:ring-accent/30 transition-colors'
          )}
        />
      </div>
      {newPostLabel && (
        <button
          type="button"
          onClick={onNewPost}
          className={cn(
            'inline-flex items-center gap-2 h-12 px-5 rounded-full shrink-0',
            'bg-button text-button-ink text-label',
            'hover:opacity-90 hover:-translate-y-[0.5px] transition-all shadow-soft',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30'
          )}
        >
          <Plus className="h-4 w-4" strokeWidth={1.8} />
          {newPostLabel}
        </button>
      )}
    </form>
  );
}
