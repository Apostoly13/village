/**
 * Minimal classname combiner — avoids pulling clsx/tailwind-merge unless
 * your project already has it. If you have `cn` already, delete this and
 * change the imports in village/* to your existing helper.
 */
export function cn(...args) {
  return args.filter(Boolean).join(' ');
}
