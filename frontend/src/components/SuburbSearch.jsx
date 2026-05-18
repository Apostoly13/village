import { useState, useEffect, useRef } from "react";
import { MapPin, Search } from "lucide-react";

const API_URL = process.env.REACT_APP_BACKEND_URL;

/**
 * SuburbSearch — debounced suburb autocomplete backed by /api/location/search.
 *
 * Props:
 *   value            string   — current suburb text (controlled)
 *   onChange         fn(suburb, state, postcode) — called on every text change AND on selection
 *   onSelect         fn(loc)  — called ONLY when user picks a result from the dropdown
 *   clearAfterSelect boolean  — if true, clears the input after a selection (useful for multi-add)
 *   placeholder      string   — input placeholder
 *   className        string   — extra classes for the outer wrapper
 *   inputClass       string   — classes applied to the <input>
 *   error            string   — show error border + message when set
 */
export default function SuburbSearch({
  value,
  onChange,
  onSelect,
  clearAfterSelect = false,
  placeholder = "e.g. Newtown, NSW",
  className = "",
  inputClass = "",
  error,
}) {
  const [query, setQuery]       = useState(value || "");
  const [results, setResults]   = useState([]);
  const [loading, setLoading]   = useState(false);
  const [open, setOpen]         = useState(false);
  const containerRef            = useRef(null);

  // Keep local query in sync if parent resets value
  useEffect(() => { setQuery(value || ""); }, [value]);

  // Debounced search
  useEffect(() => {
    if (query.length < 2) { setResults([]); setOpen(false); return; }
    const t = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `${API_URL}/api/location/search?q=${encodeURIComponent(query)}`,
          { credentials: "include" }
        );
        if (res.ok) {
          const data = await res.json();
          setResults(data.results || []);
          setOpen((data.results || []).length > 0);
        }
      } catch {}
      finally { setLoading(false); }
    }, 300);
    return () => clearTimeout(t);
  }, [query]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const select = (loc) => {
    const suburb = loc.suburb || loc.display_name?.split(",")[0] || "";
    setOpen(false);
    setResults([]);
    if (clearAfterSelect) {
      setQuery("");
    } else {
      setQuery(suburb);
    }
    if (onChange) onChange(suburb, loc.state || "", loc.postcode || "");
    if (onSelect) onSelect(loc);
  };

  const BASE_INPUT = [
"w-full rounded-xl border bg-card text-foreground px-3 py-2.5 text-sm",
"focus:outline-none focus:ring-2 focus:ring-border/50 placeholder:text-muted-foreground",
    error ? "border-destructive" : "border-border",
    inputClass,
  ].join(" ");

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <input
          value={query}
          onChange={e => { setQuery(e.target.value); if (onChange) onChange(e.target.value, "", ""); }}
          placeholder={placeholder}
          autoComplete="off"
          className={`${BASE_INPUT} pl-9`}
        />
        {loading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full border-2 border-[var(--line)] border-t-[var(--ink-2)] animate-spin" />
        )}
      </div>

      {open && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-card border border-border/50 rounded-xl shadow-lg overflow-hidden">
          {results.slice(0, 6).map((loc, i) => {
            const suburb = loc.suburb || loc.display_name?.split(",")[0] || "";
            const detail = [loc.state, loc.postcode].filter(Boolean).join(" ");
            return (
              <button
                key={i}
                type="button"
                onClick={() => select(loc)}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 text-left hover:bg-secondary/60 transition-colors border-b border-border/30 last:border-0"
              >
                <MapPin className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm text-foreground font-medium truncate">{suburb}</p>
                  {detail && <p className="text-xs text-muted-foreground">{detail}</p>}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {error && <p className="text-xs text-destructive mt-1">{error}</p>}
    </div>
  );
}
