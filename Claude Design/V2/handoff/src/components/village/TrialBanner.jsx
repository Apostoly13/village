import { cn } from '../../lib/cn';
import { Link } from 'react-router-dom';

/**
 * TrialBanner — the buttery-yellow strip above the greeting.
 * <TrialBanner daysLeft={6} />
 *
 * Kettle glyph uses a small styled span; swap for an <img> if you have a brand icon.
 */
export default function TrialBanner({ daysLeft, className = '' }) {
  if (daysLeft == null) return null;
  return (
    <div className={cn(
      'flex items-start gap-3 bg-banner rounded-xl px-5 py-4',
      'border border-transparent',
      className
    )}>
      <span
        aria-hidden="true"
        className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-ink/5 shrink-0 mt-0.5"
      >
        <span className="text-[14px]">🫖</span>
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-body text-ink">
          <strong className="font-semibold">{daysLeft} days left on your free trial</strong>
        </p>
        <p className="text-body-sm text-ink-muted mt-1 leading-relaxed">
          After your trial you'll move to the free tier — 5 posts/week, 5 replies/week, 10 chats/day,
          no Events, Communities or Direct Messages.{' '}
          <Link to="/plus" className="text-accent font-medium hover:underline underline-offset-2">
            Upgrade to Village+
          </Link>{' '}
          to keep full access and support the community.
        </p>
      </div>
    </div>
  );
}
