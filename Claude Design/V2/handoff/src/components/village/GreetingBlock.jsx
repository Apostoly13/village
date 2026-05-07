import { cn } from '../../lib/cn';

/**
 * GreetingBlock — the hero greeting on Dashboard.
 *   <GreetingBlock firstName="Sarah" subtitle="5 circles are active right now — good time to join." />
 *
 * The eyebrow date/time line is computed here so every page gets the same format.
 * The firstName is ALWAYS Fraunces italic accent-red followed by a period.
 * The comma after "Afternoon" is mandatory. See DESIGN-LANGUAGE.md §3.
 */
export default function GreetingBlock({ firstName = 'there', subtitle, className = '' }) {
  const now = new Date();

  const days = ['SUNDAY','MONDAY','TUESDAY','WEDNESDAY','THURSDAY','FRIDAY','SATURDAY'];
  const day = days[now.getDay()];
  const hours = now.getHours();
  const min = String(now.getMinutes()).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const hr12 = hours % 12 || 12;
  const eyebrow = `${day} · ${hr12}:${min} ${ampm}`;

  const greeting =
    hours < 5  ? 'Still up'  :
    hours < 12 ? 'Morning'   :
    hours < 17 ? 'Afternoon' :
    hours < 21 ? 'Evening'   :
                 'Evening';

  return (
    <div className={cn('space-y-2', className)}>
      <p className="font-mono text-eyebrow uppercase text-ink-faint">{eyebrow}</p>
      <h1 className="font-display text-greeting text-ink">
        {greeting},{' '}
        <span className="italic text-accent">{firstName}</span>
        <span className="text-ink">.</span>
      </h1>
      {subtitle && (
        <p className="text-body text-ink-muted leading-relaxed max-w-xl">
          {subtitle}
        </p>
      )}
    </div>
  );
}
