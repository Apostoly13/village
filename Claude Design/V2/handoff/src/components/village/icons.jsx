/**
 * Village Icons — extended pack
 * ─────────────────────────────────────────────────────
 * Custom icons that Lucide doesn't ship, in the same line-art /
 * stroke-1.5 / 24px / currentColor style. Drop-in replacement
 * for any Lucide icon: same API (size, strokeWidth, className).
 *
 *   import { ThreeAmMoon, LocalCircle, Pram } from '@/components/village/icons';
 *   <ThreeAmMoon className="h-5 w-5" />
 *
 * All icons:
 *   - 24×24 viewBox
 *   - stroke="currentColor", strokeWidth default 1.5
 *   - strokeLinecap="round", strokeLinejoin="round"
 *   - fill="none" by default; a few use currentColor accents
 */
import React from 'react';

const Base = React.forwardRef(function Base(
  { size = 24, strokeWidth = 1.5, className = '', children, ...rest },
  ref
) {
  return (
    <svg
      ref={ref}
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      {...rest}
    >
      {children}
    </svg>
  );
});

// ─── 3am Club — crescent moon over a small star ──────────
export const ThreeAmMoon = (props) => (
  <Base {...props}>
    <path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5Z" />
    <path d="M5 6.5l.7 1.4 1.4.4-1.4.7L5 10.5l-.7-1.5-1.4-.4 1.4-.7Z" />
  </Base>
);

// ─── Local Circle — concentric house + heart pin ─────────
export const LocalCircle = (props) => (
  <Base {...props}>
    <circle cx="12" cy="12" r="9" />
    <circle cx="12" cy="12" r="5" />
    <path d="M12 9.5l-1.5 1.7c-.7.8-.5 2 .5 2.5.5.2 1 .2 1.5 0 1-.5 1.2-1.7.5-2.5L12 9.5Z" fill="currentColor" />
  </Base>
);

// ─── Pram / Stroller ─────────────────────────────────────
export const Pram = (props) => (
  <Base {...props}>
    <path d="M3 8h6.5L13 14" />
    <path d="M3 8a8 8 0 0 1 8 8" />
    <circle cx="7.5" cy="19" r="1.6" />
    <circle cx="15.5" cy="19" r="1.6" />
    <path d="M9.5 8 8 5.5a2 2 0 0 1 .8-2.7l1.5-.7" />
    <path d="M21 9v3l-3 4" />
  </Base>
);

// ─── Parent + Child — two figures, one taller ────────────
export const ParentChild = (props) => (
  <Base {...props}>
    <circle cx="9" cy="6" r="2.2" />
    <path d="M5.5 21v-6.5a3.5 3.5 0 0 1 7 0V21" />
    <circle cx="17" cy="10" r="1.6" />
    <path d="M14.5 21v-4.5a2.5 2.5 0 0 1 5 0V21" />
    <path d="M11 14.5h1" />
  </Base>
);

// ─── Support Hand — open palm with heart ─────────────────
export const SupportHand = (props) => (
  <Base {...props}>
    <path d="M5 14V8a1.5 1.5 0 0 1 3 0v4" />
    <path d="M8 12V6a1.5 1.5 0 0 1 3 0v6" />
    <path d="M11 12V7a1.5 1.5 0 0 1 3 0v5" />
    <path d="M14 12v-3a1.5 1.5 0 0 1 3 0v8a4 4 0 0 1-4 4H9a4 4 0 0 1-4-4v-2" />
  </Base>
);

// ─── Whisper — speech bubble with quiet dots ─────────────
export const Whisper = (props) => (
  <Base {...props}>
    <path d="M21 11.5a8.5 8.5 0 0 1-12.7 7.4L4 20l1.1-3.6A8.5 8.5 0 1 1 21 11.5Z" />
    <circle cx="9"  cy="11.5" r=".7" fill="currentColor" stroke="none" />
    <circle cx="12" cy="11.5" r=".7" fill="currentColor" stroke="none" />
    <circle cx="15" cy="11.5" r=".7" fill="currentColor" stroke="none" />
  </Base>
);

// ─── Mug / Cuppa — steam rising ──────────────────────────
export const Mug = (props) => (
  <Base {...props}>
    <path d="M4 9h12v6a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4V9Z" />
    <path d="M16 11h2a2.5 2.5 0 0 1 0 5h-2" />
    <path d="M7 5c0 1 1 1 1 2s-1 1-1 2" />
    <path d="M11 4c0 1 1 1 1 2s-1 1-1 2" />
  </Base>
);

// ─── Anonymous — circle with soft mask ───────────────────
export const Anonymous = (props) => (
  <Base {...props}>
    <circle cx="12" cy="12" r="9" />
    <path d="M7.5 13c1 1.5 2.5 2.5 4.5 2.5s3.5-1 4.5-2.5" />
    <path d="M5 10.5h4" />
    <path d="M15 10.5h4" />
  </Base>
);

// ─── Village — three little rooftops ─────────────────────
export const Village = (props) => (
  <Base {...props}>
    <path d="M2 20V12l3.5-3 3.5 3v8" />
    <path d="M9 20v-9l4-3.5L17 11v9" />
    <path d="M17 20v-7l2.5-2L22 13v7" />
    <path d="M2 20h20" />
  </Base>
);

// ─── Tea / Bottle — for newborn / feeding sections ───────
export const Bottle = (props) => (
  <Base {...props}>
    <path d="M9 3h6" />
    <path d="M9 3v2.5a2 2 0 0 0 .6 1.4l.4.4V19a2 2 0 0 0 2 2h0a2 2 0 0 0 2-2V7.3l.4-.4A2 2 0 0 0 15 5.5V3" />
    <path d="M10 11h4" />
    <path d="M10 14h4" />
  </Base>
);

// ─── Calendar Sparkle — for events highlight ─────────────
export const CalendarSparkle = (props) => (
  <Base {...props}>
    <rect x="3" y="5" width="14" height="15" rx="2" />
    <path d="M3 10h14" />
    <path d="M7 3v4M13 3v4" />
    <path d="M19 4l.6 1.4 1.4.6-1.4.6L19 8l-.6-1.4-1.4-.6 1.4-.6Z" fill="currentColor" stroke="none" />
    <path d="M21 13l.4 1 1 .4-1 .4L21 16l-.4-1.2-1-.4 1-.4Z" fill="currentColor" stroke="none" />
  </Base>
);

// ─── Stall / Marketplace tag ─────────────────────────────
export const Stall = (props) => (
  <Base {...props}>
    <path d="M3 9l1.5-4h15L21 9" />
    <path d="M3 9v11h18V9" />
    <path d="M3 9h18" />
    <path d="M9 9v3a3 3 0 0 0 6 0V9" />
    <path d="M9 14h6v6H9z" />
  </Base>
);

// ─── Sleep — Z's over a pillow line ──────────────────────
export const Sleep = (props) => (
  <Base {...props}>
    <path d="M3 18c2-2 6-2 9-2s7 0 9 2" />
    <path d="M9 9h4l-4 5h4" />
    <path d="M14 5h3l-3 3h3" />
  </Base>
);

// ─── Heart Pulse — health / wellbeing ────────────────────
export const HeartPulse = (props) => (
  <Base {...props}>
    <path d="M3.5 12.5h3l1.5-3 2 5 1.5-2h2" />
    <path d="M13.5 12.5h7" />
    <path d="M20.5 12.5c0-3-2.4-5.5-5.4-5.5-1.4 0-2.7.6-3.6 1.5-.9-.9-2.2-1.5-3.6-1.5C4.9 7 2.5 9.5 2.5 12.5c0 5.5 9 10 9 10s2-1 4-2.7" />
  </Base>
);

// ─── Birthday Cake — milestone ───────────────────────────
export const Cake = (props) => (
  <Base {...props}>
    <path d="M4 21V13h16v8" />
    <path d="M4 17c2 1.5 4 1.5 6 0s4-1.5 6 0 4 1.5 4 0" />
    <path d="M8 13V9" />
    <path d="M12 13V8" />
    <path d="M16 13V9" />
    <path d="M8 6.5l.5 1 1 .3-1 .3L8 9l-.5-.9-1-.3 1-.3Z" fill="currentColor" stroke="none" />
    <path d="M16 6.5l.5 1 1 .3-1 .3L16 9l-.5-.9-1-.3 1-.3Z" fill="currentColor" stroke="none" />
  </Base>
);

// ─── Globe AU — Australia hint ───────────────────────────
export const GlobeAu = (props) => (
  <Base {...props}>
    <circle cx="12" cy="12" r="9" />
    <path d="M3 12h18" />
    <path d="M12 3a13 13 0 0 1 0 18" />
    <path d="M12 3a13 13 0 0 0 0 18" />
    <circle cx="14.5" cy="14.5" r=".7" fill="currentColor" stroke="none" />
    <circle cx="9.5"  cy="10"   r=".7" fill="currentColor" stroke="none" />
  </Base>
);

// ─── Quill — write a post ────────────────────────────────
export const Quill = (props) => (
  <Base {...props}>
    <path d="M20 4c-9 1-13 7-15 14l1.5 1.5c7-2 13-6 14-15Z" />
    <path d="M5 20l4-4" />
    <path d="M11 13l3-3" />
  </Base>
);

// ─── Cuddle — overlapping hearts ─────────────────────────
export const Cuddle = (props) => (
  <Base {...props}>
    <path d="M9 18s-5.5-3.4-5.5-7.5C3.5 8.6 5 7 7 7c1 0 2 .5 2.5 1.5C10 7.5 11 7 12 7c2 0 3.5 1.6 3.5 3.5C15.5 14.6 9 18 9 18Z" />
    <path d="M14.5 19s5-3.1 5-6.8c0-1.7-1.4-3.2-3.2-3.2-.9 0-1.8.4-2.3 1.1" opacity=".7" />
  </Base>
);

// ─── Sparkle Single — for premium / Village+ accents ────
export const Sparkle = (props) => (
  <Base {...props}>
    <path d="M12 3l1.6 5.4L19 10l-5.4 1.6L12 17l-1.6-5.4L5 10l5.4-1.6Z" />
  </Base>
);

// ─── Index export ────────────────────────────────────────
export const VillageIcons = {
  ThreeAmMoon, LocalCircle, Pram, ParentChild, SupportHand, Whisper,
  Mug, Anonymous, Village, Bottle, CalendarSparkle, Stall, Sleep,
  HeartPulse, Cake, GlobeAu, Quill, Cuddle, Sparkle,
};

export default VillageIcons;
