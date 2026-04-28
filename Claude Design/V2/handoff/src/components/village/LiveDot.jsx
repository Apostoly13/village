import { cn } from '../../lib/cn';

/**
 * LiveDot — the pulsing 6px green/accent indicator.
 * Color: 'live' (support green) | 'accent'
 */
export default function LiveDot({ color = 'live', className = '' }) {
  const bg = color === 'accent' ? 'bg-accent' : 'bg-support';
  return (
    <span className={cn('relative inline-flex h-1.5 w-1.5', className)}>
      <span className={cn('absolute inset-0 rounded-full animate-live-pulse', bg)} />
      <span className={cn('relative inline-flex h-1.5 w-1.5 rounded-full', bg)} />
    </span>
  );
}
