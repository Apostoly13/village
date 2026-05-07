import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "./ui/button";
import { Moon, Sun } from "lucide-react";

/**
 * Minimal navigation bar for public (unauthenticated) pages —
 * Terms, Privacy Policy, Community Guidelines, Contact, etc.
 * No API calls, no auth dependency, no redirects.
 */
export default function PublicNav() {
  const [darkMode, setDarkMode] = useState(
    document.documentElement.classList.contains("dark")
  );

  const toggleTheme = () => {
    const next = !darkMode;
    setDarkMode(next);
    if (next) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-border/30">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Logo → landing page (no auth required) */}
        <Link to="/" className="flex items-center shrink-0">
          <img
            src="/BG Removed- Main Logo - ps edit.png"
            alt="The Village"
            className="h-12 w-auto"
          />
        </Link>

        {/* Right: theme toggle + auth links */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={toggleTheme}
            className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
            aria-label="Toggle theme"
          >
            {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
          <Button variant="ghost" size="sm" className="rounded-xl text-muted-foreground hover:text-foreground" asChild>
            <Link to="/login">Sign in</Link>
          </Button>
          <Button size="sm" className="rounded-xl bg-primary text-primary-foreground hover:bg-primary/90" asChild>
            <Link to="/register">Join free</Link>
          </Button>
        </div>
      </div>
    </nav>
  );
}
