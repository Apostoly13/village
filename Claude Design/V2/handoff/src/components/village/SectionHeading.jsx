import { cn } from '../../lib/cn';

/**
 * SectionHeading — page-level section start.
 *   <SectionHeading eyebrow="THIS WEEK" title="Latest conversations" action={...} />
 */
export default function SectionHeading({ eyebrow, title, action, className = '' }) {
  return (
    <div className={cn('flex items-end justify-between gap-4', className)}>
      <div>
        {eyebrow && (
          <p className="text-eyebrow font-mono uppercase text-ink-faint mb-2">{eyebrow}</p>
        )}
        <h2 className="font-display text-section text-ink">{title}</h2>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
