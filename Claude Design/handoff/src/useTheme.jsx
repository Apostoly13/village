import { useEffect, useState, useCallback } from "react";

const STORAGE_KEY = "village.theme";

function systemPrefersDark() {
  return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
}

function resolveTheme(setting) {
  if (setting === "day" || setting === "night") return setting;
  return systemPrefersDark() ? "night" : "day";
}

function applyTheme(theme) {
  document.body.setAttribute("data-theme", theme);
  // Keep Tailwind's dark: variants working in parallel with your existing code
  document.documentElement.classList.toggle("dark", theme === "night");
}

/**
 * useTheme — day / night / auto
 * Returns [setting, setSetting, resolved]
 *   setting  : "day" | "night" | "auto"  (what the user chose)
 *   resolved : "day" | "night"           (what is actually applied)
 */
export function useTheme() {
  const [setting, _set] = useState(() => localStorage.getItem(STORAGE_KEY) || "auto");
  const [resolved, setResolved] = useState(() => resolveTheme(setting));

  // Re-apply when setting changes
  useEffect(() => {
    const r = resolveTheme(setting);
    setResolved(r);
    applyTheme(r);
    localStorage.setItem(STORAGE_KEY, setting);
  }, [setting]);

  // Listen to system changes when in auto
  useEffect(() => {
    if (setting !== "auto") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const h = () => { const r = resolveTheme("auto"); setResolved(r); applyTheme(r); };
    mq.addEventListener("change", h);
    return () => mq.removeEventListener("change", h);
  }, [setting]);

  const setTheme = useCallback((next) => _set(next), []);
  return [setting, setTheme, resolved];
}

/** Small presentational toggle — Day / Night / Auto pill. */
export function ThemeToggle() {
  const [setting, setTheme] = useTheme();
  const options = [
    { id: "day",   label: "Day" },
    { id: "night", label: "Night" },
    { id: "auto",  label: "Auto" },
  ];
  return (
    <div
      role="radiogroup"
      aria-label="Appearance"
      style={{
        display: "inline-flex", gap: 4, padding: 4,
        background: "var(--paper-2)", border: "1px solid var(--line)", borderRadius: 999,
      }}
    >
      {options.map(o => {
        const active = setting === o.id;
        return (
          <button
            key={o.id}
            role="radio"
            aria-checked={active}
            onClick={() => setTheme(o.id)}
            style={{
              padding: "6px 14px", borderRadius: 999, border: "none",
              background: active ? "var(--paper)" : "transparent",
              color: active ? "var(--ink)" : "var(--ink-3)",
              fontSize: 12.5, fontWeight: active ? 600 : 500,
              boxShadow: active ? "var(--shadow-sm)" : "none",
              cursor: "pointer",
            }}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
