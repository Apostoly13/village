import { cn } from '../../lib/cn';

/**
 * IconButton — 40×40 square, rounded-lg, ghost by default.
 * Used for: theme toggle, notification bell, kebab menus, close.
 * Always provide aria-label.
 */
export default function IconButton({ icon: Icon, label, className = '', ...rest }) {
  return (
    <button
      aria-label={label}
      className={cn(
        'inline-flex items-center justify-center h-10 w-10 rounded-lg',
        'text-ink-muted hover:text-ink hover:bg-line-soft',
        'transition-colors duration-150',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:ring-offset-2 focus-visible:ring-offset-paper',
        className
      )}
      {...rest}
    >
      <Icon className="h-[18px] w-[18px]" strokeWidth={1.5} />
    </button>
  );
}
