/**
 * Wordmark — typographic lockup for The Village.
 * Uses Fraunces (loaded via Google Fonts in index.html).
 * Drop-in replacement for the logo PNG in Navigation, Footer, Landing hero.
 *
 * Props:
 *   size    : font-size in px (default 20)
 *   color   : override color for "The" (default: var(--ink))
 *   accent  : override color for italic "Village" (default: hsl(var(--accent)))
 *   invert  : if true, flips to cream text — use on dark panels / footers
 *   style   : extra inline styles
 */
export function Wordmark({ size = 20, color, accent, invert = false, style, ...rest }) {
  const c1 = color || (invert ? "var(--brand-cream)" : "var(--ink)");
  const c2 = accent || (invert ? "var(--peach)" : "hsl(var(--accent))");
  return (
    <span
      style={{
        fontFamily: "var(--serif)",
        fontSize: size,
        fontWeight: 500,
        letterSpacing: "-0.02em",
        display: "inline-flex",
        alignItems: "baseline",
        gap: `${size * 0.22}px`,
        lineHeight: 1,
        color: c1,
        ...style,
      }}
      {...rest}
    >
      <span>The</span>
      <span style={{ fontStyle: "italic", color: c2 }}>Village</span>
    </span>
  );
}

/**
 * Monogram — single italic "V" chip.
 * Use for favicons, avatar placeholders, watermark corners.
 */
export function Monogram({ size = 36, invert = false, style }) {
  const bg = invert ? "var(--paper)" : "var(--ink)";
  const fg = invert ? "var(--ink)"   : "var(--paper)";
  return (
    <span
      aria-label="The Village"
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: size,
        height: size,
        borderRadius: size * 0.25,
        background: bg,
        color: fg,
        fontFamily: "var(--serif)",
        fontWeight: 500,
        fontStyle: "italic",
        fontSize: size * 0.58,
        letterSpacing: "-0.04em",
        lineHeight: 1,
        flexShrink: 0,
        ...style,
      }}
    >
      V
    </span>
  );
}
