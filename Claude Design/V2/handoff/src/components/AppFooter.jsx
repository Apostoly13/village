import { Link } from 'react-router-dom';
import Wordmark from './village/Wordmark';

export default function AppFooter() {
  return (
    <footer className="mt-16 pt-8 pb-6 border-t border-line-soft">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <Wordmark size="sm" />
        <div className="flex items-center gap-5 text-body-sm text-ink-faint">
          <Link to="/community-guidelines" className="hover:text-ink transition-colors">Guidelines</Link>
          <Link to="/privacy"  className="hover:text-ink transition-colors">Privacy</Link>
          <Link to="/terms"    className="hover:text-ink transition-colors">Terms</Link>
          <Link to="/contact"  className="hover:text-ink transition-colors">Contact</Link>
        </div>
        <p className="text-micro text-ink-faint">© {new Date().getFullYear()} The Village</p>
      </div>
    </footer>
  );
}
