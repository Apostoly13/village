import { cn } from '../../lib/cn';

/**
 * Input — the one input style.
 * variant: 'default' (paper rounded-md) or 'search' (card rounded-full h-12)
 */
export default function Input({ variant = 'default', className = '', ...rest }) {
  const base =
    'w-full bg-card border border-line text-ink placeholder:text-ink-faint font-ui ' +
    'focus:outline-none focus:border-ink-muted focus-visible:ring-2 focus-visible:ring-accent/30 transition-colors';
  const variants = {
    default: 'rounded-md h-10 px-3 text-body',
    search:  'rounded-full h-12 px-5 text-body',
    large:   'rounded-lg h-12 px-4 text-body',
  };
  return <input className={cn(base, variants[variant], className)} {...rest} />;
}
