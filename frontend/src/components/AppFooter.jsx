import { Link } from "react-router-dom";

export default function AppFooter() {
  return (
    <footer className="border-t border-border/30 mt-12 py-8 px-4 pb-24 lg:pb-8">
      <div className="max-w-3xl mx-auto flex flex-col items-center gap-4">
        <img src="/BG Removed- Main Logo - ps edit.png" alt="The Village" className="h-32 w-auto opacity-80" />
        <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
          <Link to="/terms" className="hover:text-foreground transition-colors">Terms</Link>
          <Link to="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
          <Link to="/community-guidelines" className="hover:text-foreground transition-colors">Community Guidelines</Link>
          <Link to="/contact" className="hover:text-foreground transition-colors">Contact</Link>
          <Link to="/for-clinicians" className="hover:text-foreground transition-colors">For Clinicians</Link>
        </div>
        <p className="text-xs text-muted-foreground">
          &copy; {new Date().getFullYear()} The Village — built for Australian parents
        </p>
      </div>
    </footer>
  );
}
