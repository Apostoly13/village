import { cn } from '../../lib/cn';

/**
 * SideCard — the repeating right-rail panel.
 * <SideCard title="Live now" action={<Link>See all</Link>}>
 *   ...rows...
 * </SideCard>
 */
export default function SideCard({ title, action, children, className = '' }) {
  return (
    <section className={cn('village-card px-4 py-4', className)}>
      <header className="flex items-center justify-between mb-3">
        <h3 className="font-ui font-semibold text-[13px] text-ink">{title}</h3>
        {action && <div className="shrink-0">{action}</div>}
      </header>
      {children}
    </section>
  );
}
