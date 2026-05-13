/**
 * VillageAvatar — standardised avatar component using brand tokens.
 * Replaces the `bg-[var(--honey-wash)] text-[var(--honey)]` inline fallback pattern.
 *
 * Props:
 *   src    — image URL (optional)
 *   name   — display name (used for initials fallback)
 *   size   — pixel size (default 32)
 *   online — boolean or undefined. If provided, shows a presence dot.
 */
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";

export function VillageAvatar({ src, name, size = 32, online }) {
  const initials = (name || "?")
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();

  const dim = { width: size, height: size };

  return (
    <div className="relative inline-block shrink-0">
      <Avatar style={dim} className="shrink-0">
        <AvatarImage src={src} />
        <AvatarFallback
          style={{
            ...dim,
            background: "var(--paper-2)",
            color: "var(--ink-2)",
            fontSize: Math.max(10, size * 0.35),
            fontWeight: 600,
          }}
        >
          {initials}
        </AvatarFallback>
      </Avatar>

      {online !== undefined && (
        <span
          className="absolute bottom-0 right-0 rounded-full border-2"
          style={{
            width:  Math.max(8, Math.round(size * 0.28)),
            height: Math.max(8, Math.round(size * 0.28)),
            background:  online ? "var(--status-online)": "var(--status-offline)",
            borderColor: "var(--paper)",
          }}
        />
      )}
    </div>
  );
}

export default VillageAvatar;
