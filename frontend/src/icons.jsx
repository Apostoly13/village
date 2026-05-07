/* The Village — custom icon set
   Consistent 24×24 viewBox, 1.5px stroke, rounded joins, handmade feel.
   Use in place of emojis for feature sections and UI chrome. */

const iconBase = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round",
  strokeLinejoin: "round",
};

function SvgIcon({ size = 22, children, style, ...rest }) {
  return (
    <svg {...iconBase} width={size} height={size} style={{ flexShrink: 0, ...style }} {...rest}>
      {children}
    </svg>
  );
}

// Home / village — little roof with chimney
export const IconHome = (p) => <SvgIcon {...p}><path d="M3.5 11.2 12 4l8.5 7.2" /><path d="M5.5 10v9.5h13V10" /><path d="M10 19.5v-5h4v5" /></SvgIcon>;

// Two people side by side
export const IconPeople = (p) => <SvgIcon {...p}><circle cx="8.5" cy="8" r="2.6" /><circle cx="15.5" cy="8" r="2.6" /><path d="M3.5 19c.8-2.8 2.8-4 5-4s4.2 1.2 5 4" /><path d="M11.5 19c.8-2.8 2.8-4 5-4s4.2 1.2 5 4" /></SvgIcon>;

// Speech — two overlapping bubbles for discussion
export const IconChat = (p) => <SvgIcon {...p}><path d="M4 6.5c0-1.1.9-2 2-2h8c1.1 0 2 .9 2 2v5c0 1.1-.9 2-2 2H9l-3 2.5V13.5H6c-1.1 0-2-.9-2-2z" /><path d="M18 9h1c1.1 0 2 .9 2 2v4.5c0 1.1-.9 2-2 2h-1l-2 1.5V17.5" /></SvgIcon>;

// Crescent moon — for 3am club / night mode
export const IconMoon = (p) => <SvgIcon {...p}><path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z" /></SvgIcon>;

// Hand / support — open palm
export const IconHand = (p) => <SvgIcon {...p}><path d="M9 12V5.5a1.5 1.5 0 1 1 3 0V11" /><path d="M12 10V4.5a1.5 1.5 0 1 1 3 0V11" /><path d="M15 10V5.5a1.5 1.5 0 1 1 3 0V13" /><path d="M9 11V8.5a1.5 1.5 0 1 0-3 0v6c0 3.3 2.7 6 6 6h1.5c3 0 5.5-2.5 5.5-5.5V12" /></SvgIcon>;

// Pin — location
export const IconPin = (p) => <SvgIcon {...p}><path d="M12 21s-6.5-6-6.5-11a6.5 6.5 0 1 1 13 0c0 5-6.5 11-6.5 11z" /><circle cx="12" cy="10" r="2.3" /></SvgIcon>;

// Calendar
export const IconCal = (p) => <SvgIcon {...p}><rect x="3.5" y="5" width="17" height="15" rx="2.5" /><path d="M3.5 10h17" /><path d="M8 3.5v3M16 3.5v3" /></SvgIcon>;

// Shield with tick — verified clinician
export const IconShield = (p) => <SvgIcon {...p}><path d="M12 3 4.5 6v6c0 4.5 3 7.5 7.5 9 4.5-1.5 7.5-4.5 7.5-9V6L12 3z" /><path d="M8.5 12l2.5 2.5L15.5 10" /></SvgIcon>;

// Lock — privacy
export const IconLock = (p) => <SvgIcon {...p}><rect x="5" y="11" width="14" height="9.5" rx="2" /><path d="M8 11V8a4 4 0 1 1 8 0v3" /></SvgIcon>;

// Mask / anonymous — simple face mask
export const IconMask = (p) => <SvgIcon {...p}><path d="M4 8c2-1.5 5-2 8-2s6 .5 8 2c-.5 5-2.5 8-8 8s-7.5-3-8-8z" /><circle cx="9" cy="10.5" r=".7" fill="currentColor" /><circle cx="15" cy="10.5" r=".7" fill="currentColor" /></SvgIcon>;

// Heart — love / care
export const IconHeart = (p) => <SvgIcon {...p}><path d="M12 20s-7-4.3-7-10a4 4 0 0 1 7-2.7A4 4 0 0 1 19 10c0 5.7-7 10-7 10z" /></SvgIcon>;

// Stethoscope — clinicians
export const IconSteth = (p) => <SvgIcon {...p}><path d="M6 3v6a4 4 0 0 0 8 0V3" /><circle cx="18" cy="15" r="2.5" /><path d="M10 13v2a5 5 0 0 0 5.5 5" /></SvgIcon>;

// Sparkle / star — Village+ tier
export const IconSpark = (p) => <SvgIcon {...p}><path d="M12 4v4M12 16v4M4 12h4M16 12h4M6.5 6.5l2.8 2.8M14.7 14.7l2.8 2.8M17.5 6.5l-2.8 2.8M9.3 14.7l-2.8 2.8" /></SvgIcon>;

// Arrow right — general nav
export const IconArrow = (p) => <SvgIcon {...p}><path d="M5 12h14" /><path d="M13 6l6 6-6 6" /></SvgIcon>;

// Tea cup — warm moment / coffee meetup
export const IconCup = (p) => <SvgIcon {...p}><path d="M5 8h12v6a5 5 0 0 1-5 5h-2a5 5 0 0 1-5-5V8z" /><path d="M17 10h2a2.5 2.5 0 0 1 0 5h-2" /><path d="M8 4c0 1 1 1 1 2M11 3c0 1 1 1 1 2M14 4c0 1 1 1 1 2" /></SvgIcon>;

// Phone — crisis support
export const IconPhone = (p) => <SvgIcon {...p}><path d="M5 4.5h3.5l1.5 4-2 1.5a11 11 0 0 0 6 6l1.5-2 4 1.5V19a2 2 0 0 1-2 2A15 15 0 0 1 3 6.5a2 2 0 0 1 2-2z" /></SvgIcon>;

// Bed — sleep
export const IconBed = (p) => <SvgIcon {...p}><path d="M3 18V8" /><path d="M3 12h18v6" /><path d="M21 18V14" /><circle cx="7.5" cy="12" r="2.2" /></SvgIcon>;

// Minimal sun — hopeful / AU
export const IconSun = (p) => <SvgIcon {...p}><circle cx="12" cy="12" r="4" /><path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.5 5.5l1.4 1.4M17.1 17.1l1.4 1.4M5.5 18.5l1.4-1.4M17.1 6.9l1.4-1.4" /></SvgIcon>;

// Envelope — messages
export const IconMail = (p) => <SvgIcon {...p}><rect x="3" y="5.5" width="18" height="13" rx="2" /><path d="M4 7l8 6 8-6" /></SvgIcon>;

// Check — simple tick
export const IconCheck = (p) => <SvgIcon {...p}><path d="M5 12.5l4.5 4.5L19 7" /></SvgIcon>;

// Cog — settings
export const IconCog = (p) => <SvgIcon {...p}><circle cx="12" cy="12" r="2.8" /><path d="M12 3v2.5M12 18.5V21M3 12h2.5M18.5 12H21M5.6 5.6l1.8 1.8M16.6 16.6l1.8 1.8M5.6 18.4l1.8-1.8M16.6 7.4l1.8-1.8" /></SvgIcon>;

// Spaces / Forums — panel with header bar and topic rows
export const IconSpaces = (p) => <SvgIcon {...p}><rect x="3" y="3.5" width="18" height="17" rx="2.5" /><path d="M3 8.5h18" /><path d="M7.5 12.5h9M7.5 16h6" /></SvgIcon>;
