import { cn } from '../../lib/cn';

/**
 * FilterChip — rounded-full filter pill.
 * <FilterChip active>Latest</FilterChip>
 * <FilterChip live>Live</FilterChip>   ← shows the pulse dot prefix
 */
export default function FilterChip({ active, live, children, className = '', ...rest }) {
  return (
    <button
      type="button"
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full h-8 px-3.5',
        'text-micro font-ui font-medium whitespace-nowrap transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30',
        active
          ? 'bg-button text-button-ink'
          : 'bg-card border border-line text-ink-muted hover:border-ink-faint hover:text-ink',
        className
      )}
      {...rest}
    >
      {live && <span className="h-1.5 w-1.5 rounded-full bg-support animate-live-pulse" />}
      {children}
    </button>
  );
}
