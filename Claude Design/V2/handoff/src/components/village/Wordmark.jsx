import { cn } from '../../lib/cn';

/**
 * Wordmark — "The Village"
 * "The" Söhne 500, "Village" Fraunces italic accent red.
 * Sizes:  sm=18px label,  md=24px header,  lg=32px hero.
 */
export default function Wordmark({ size = 'md', className = '' }) {
  const sizes = {
    sm: 'text-[18px] leading-[22px]',
    md: 'text-[24px] leading-[28px]',
    lg: 'text-wordmark',
  };
  return (
    <span
      className={cn(
        'font-ui font-medium text-ink inline-flex items-baseline gap-[0.25em]',
        sizes[size],
        className
      )}
    >
      The
      <span className="font-display italic text-accent font-normal">Village</span>
    </span>
  );
}
