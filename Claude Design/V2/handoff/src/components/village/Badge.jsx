import { cn } from '../../lib/cn';

/**
 * Badge — small numeric indicator (e.g. unread count on nav).
 * <Badge count={3} />  → accent red circle with "3"
 * <Badge dot />        → 8×8 dot with live pulse
 */
export default function Badge({ count, dot, className = '' }) {
  if (dot) {
    return (
      <span className={cn('inline-block h-2 w-2 rounded-full bg-accent animate-live-pulse', className)} />
    );
  }
  if (!count) return null;
  return (
    <span
      className={cn(
        'inline-flex items-center justify-center min-w-[18px] h-[18px] px-1',
        'rounded-full bg-accent text-white text-[10px] font-ui font-semibold',
        className
      )}
    >
      {count > 99 ? '99+' : count}
    </span>
  );
}
