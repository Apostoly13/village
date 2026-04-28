import { cn } from '../../lib/cn';

/**
 * Pill — small labelled tag.
 * Colors: neutral | support | warn | accent | ghost
 */
export default function Pill({ color = 'neutral', className = '', children, icon: Icon }) {
  const colors = {
    neutral: 'bg-card border border-line text-ink-muted',
    support: 'bg-card border border-line text-support',
    warn:    'bg-banner text-warn',
    accent:  'bg-accent-soft text-accent',
    ghost:   'text-ink-muted',
  };
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 h-[22px]',
        'text-micro font-ui tracking-wide',
        colors[color],
        className
      )}
    >
      {Icon && <Icon className="h-3 w-3" strokeWidth={1.5} />}
      {children}
    </span>
  );
}
