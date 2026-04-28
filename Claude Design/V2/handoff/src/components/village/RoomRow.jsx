import { cn } from '../../lib/cn';

/**
 * RoomRow — row inside "Live now" / "Spaces for you" side cards.
 *   <RoomRow icon="🌙" name="3am Club" right="12 online" />
 *
 * `icon` can be emoji (string) or a lucide icon component.
 * `dot` renders the pulsing live dot on the right instead of text.
 */
export default function RoomRow({ icon, name, right, dot, onClick, href, className = '' }) {
  const IconEl = typeof icon === 'string'
    ? <span className="text-[15px]">{icon}</span>
    : icon ? <icon className="h-4 w-4 text-ink-muted" strokeWidth={1.5} /> : null;

  const content = (
    <div className={cn(
      'flex items-center gap-3 px-2 py-2 rounded-md',
      'hover:bg-line-soft transition-colors duration-150 cursor-pointer',
      'group',
      className
    )}>
      <span className="inline-flex items-center justify-center w-6 h-6 shrink-0">
        {IconEl}
      </span>
      <span className="flex-1 text-body text-ink font-medium truncate group-hover:text-accent transition-colors">
        {name}
      </span>
      {dot ? (
        <span className="inline-flex items-center gap-1.5 text-micro text-support">
          <span className="h-1.5 w-1.5 rounded-full bg-support animate-live-pulse" />
        </span>
      ) : right ? (
        <span className="text-body-sm text-ink-faint shrink-0">{right}</span>
      ) : null}
    </div>
  );

  if (href) return <a href={href} onClick={onClick}>{content}</a>;
  return <button onClick={onClick} className="w-full text-left">{content}</button>;
}
