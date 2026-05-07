import { cn } from '../../lib/cn';

/**
 * Avatar — circular, warm fallback.
 * Fallback: initial on bg-accent-soft text-accent.
 * Sizes:  xs=24, sm=28, md=32, lg=40, xl=56
 */
export default function Avatar({ name = '', src, size = 'md', className = '' }) {
  const sizes = {
    xs: 'h-6 w-6 text-[10px]',
    sm: 'h-7 w-7 text-[11px]',
    md: 'h-8 w-8 text-[12px]',
    lg: 'h-10 w-10 text-[14px]',
    xl: 'h-14 w-14 text-[18px]',
  };
  const initial = name?.trim()?.[0]?.toUpperCase() || '•';
  return (
    <span
      className={cn(
        'inline-flex items-center justify-center rounded-full overflow-hidden shrink-0',
        'bg-accent-soft text-accent font-ui font-medium',
        sizes[size],
        className
      )}
    >
      {src ? (
        <img src={src} alt={name} className="h-full w-full object-cover" />
      ) : (
        <span>{initial}</span>
      )}
    </span>
  );
}
