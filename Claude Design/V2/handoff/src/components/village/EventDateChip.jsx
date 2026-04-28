import { cn } from '../../lib/cn';

/**
 * EventDateChip — 44×44 date square.
 *   <EventDateChip day={12} month="APR" />
 * Day in Fraunces 22px, month in mono 10px uppercase.
 */
export default function EventDateChip({ day, month, className = '' }) {
  return (
    <div className={cn(
      'w-11 h-11 rounded-lg bg-accent-soft text-accent',
      'flex flex-col items-center justify-center shrink-0',
      className
    )}>
      <span className="font-display text-[20px] leading-none font-normal">{day}</span>
      <span className="font-mono text-[9px] uppercase tracking-wider mt-0.5">{month}</span>
    </div>
  );
}
