import { cn } from '../../lib/cn';
import { LifeBuoy, Compass, Coffee } from 'lucide-react';

/**
 * ModeTabs — the "I need help / Browse / Catch up" selector.
 * <ModeTabs value={mode} onChange={setMode} />
 *
 * Fixed option set, because this sits at the top of Dashboard and never changes.
 * If you need a different set, pass `options`.
 */
const DEFAULT_OPTIONS = [
  { id: 'help',   label: 'I need help',  icon: LifeBuoy },
  { id: 'browse', label: 'Browse',       icon: Compass  },
  { id: 'catch',  label: 'Catch up',     icon: Coffee   },
];

export default function ModeTabs({ value = 'browse', onChange, options = DEFAULT_OPTIONS, className = '' }) {
  return (
    <div className={cn(
      'inline-flex items-center gap-1 rounded-full bg-card border border-line p-1',
      'w-full sm:w-auto',
      className
    )}>
      {options.map(opt => {
        const Icon = opt.icon;
        const active = value === opt.id;
        return (
          <button
            key={opt.id}
            onClick={() => onChange?.(opt.id)}
            className={cn(
              'inline-flex items-center justify-center gap-2 rounded-full h-10 px-5',
              'flex-1 sm:flex-initial text-label transition-all duration-150',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30',
              active
                ? 'bg-button text-button-ink shadow-soft'
                : 'text-ink-muted hover:text-ink'
            )}
          >
            {Icon && <Icon className="h-[15px] w-[15px]" strokeWidth={1.5} />}
            <span>{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
}
