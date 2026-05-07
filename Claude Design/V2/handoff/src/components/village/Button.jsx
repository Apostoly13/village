import { cn } from '../../lib/cn';

/**
 * Button — the only button in the product.
 * variants:
 *   primary  → espresso fill on day, paper fill on night
 *   ghost    → transparent, subtle hover
 *   link     → text only, underline on hover
 *   accent   → accent red fill, paper text (use ONCE per screen max)
 * sizes:
 *   sm  h-8  px-3   text-micro
 *   md  h-10 px-5   text-label
 *   lg  h-12 px-6   text-body
 */
export default function Button({
  variant = 'primary',
  size = 'md',
  className = '',
  children,
  ...rest
}) {
  const base =
    'inline-flex items-center justify-center gap-2 rounded-lg font-ui transition-all duration-150 ' +
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:ring-offset-2 focus-visible:ring-offset-paper ' +
    'disabled:opacity-50 disabled:cursor-not-allowed';

  const variants = {
    primary: 'bg-button text-button-ink hover:opacity-90 hover:-translate-y-[0.5px] shadow-soft',
    ghost:   'bg-transparent text-ink hover:bg-line-soft',
    link:    'bg-transparent text-ink hover:text-accent underline-offset-4 hover:underline px-0',
    accent:  'bg-accent text-white hover:opacity-90 hover:-translate-y-[0.5px] shadow-soft',
    outline: 'bg-transparent text-ink border border-line hover:bg-card hover:border-ink-faint',
  };

  const sizes = {
    sm: 'h-8 px-3 text-micro',
    md: 'h-10 px-5 text-label',
    lg: 'h-12 px-6 text-body',
    icon: 'h-10 w-10 px-0',
  };

  return (
    <button className={cn(base, variants[variant], sizes[size], className)} {...rest}>
      {children}
    </button>
  );
}
