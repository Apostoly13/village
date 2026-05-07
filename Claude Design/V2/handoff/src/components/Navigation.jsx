import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Home, LifeBuoy, MessageCircle, Calendar, Mail, Users, Bookmark,
  Bell, Moon, Sun, Settings, LogOut, Menu, X, Crown, Shield, ChevronDown,
} from 'lucide-react';
import Wordmark  from './village/Wordmark';
import Avatar    from './village/Avatar';
import Badge     from './village/Badge';
import IconButton from './village/IconButton';

const API_URL = process.env.REACT_APP_BACKEND_URL;

/**
 * Navigation.jsx — LEFT RAIL (desktop) + top bar (mobile).
 *
 * KEEP from old file:
 *   - Polling loop for friend requests + unread count
 *   - handleLogout, toggleTheme
 *   - notifications fetch + markAllRead handlers
 *
 * REPLACE:
 *   - All visual structure
 *   - Desktop is now a fixed left rail, not a top bar
 *   - Mobile bottom tab bar is REMOVED
 */

const NAV_ITEMS = [
  { icon: Home,         label: 'Home',      href: '/dashboard', testId: 'nav-home' },
  { icon: LifeBuoy,     label: 'Spaces',    href: '/forums',    testId: 'nav-forums',   expandable: true },
  { icon: MessageCircle,label: 'Chats',     href: '/chat',      testId: 'nav-chat',     expandable: true },
  { icon: Calendar,     label: 'Events',    href: '/events',    testId: 'nav-events' },
  { icon: Mail,         label: 'Messages',  href: '/messages',  testId: 'nav-messages' },
  { icon: Users,        label: 'Friends',   href: '/friends',   testId: 'nav-friends' },
  { icon: Bookmark,     label: 'Saved',     href: '/saved',     testId: 'nav-saved' },
];

export default function Navigation({ user }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [darkMode, setDarkMode]     = useState(() => document.documentElement.classList.contains('dark'));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [friendReqs, setFriendReqs] = useState(0);
  const [unread, setUnread]         = useState(0);

  // KEEP: polling loop — unchanged
  useEffect(() => {
    let tick = 0;
    const poll = async () => {
      tick++;
      try {
        const [fr, nc] = await Promise.all([
          fetch(`${API_URL}/api/friends/requests`,           { credentials: 'include' }),
          fetch(`${API_URL}/api/notifications/unread-count`, { credentials: 'include' }),
        ]);
        if (fr.ok) setFriendReqs((await fr.json()).length);
        if (nc.ok) setUnread((await nc.json()).count);
      } catch {}
      if (tick % 3 === 0) {
        fetch(`${API_URL}/api/users/heartbeat`, { method: 'POST', credentials: 'include' }).catch(() => {});
      }
    };
    poll();
    const id = setInterval(poll, 45000);
    return () => clearInterval(id);
  }, []);

  const toggleTheme = () => {
    const next = !darkMode;
    setDarkMode(next);
    document.documentElement.classList.toggle('dark', next);
    localStorage.setItem('theme', next ? 'dark' : 'light');
  };

  const handleLogout = async () => {
    try { await fetch(`${API_URL}/api/auth/logout`, { method: 'POST', credentials: 'include' }); } catch {}
    localStorage.removeItem('user');
    navigate('/');
  };

  const isActive = (href) =>
    location.pathname === href || location.pathname.startsWith(href + '/');

  const NavItem = ({ item }) => {
    const Icon = item.icon;
    const active = isActive(item.href);
    return (
      <Link
        to={item.href}
        data-testid={item.testId}
        className={`
          flex items-center gap-3 h-10 px-3 rounded-md group
          transition-colors duration-150
          ${active
            ? 'bg-card border border-line shadow-soft text-ink'
            : 'text-ink-muted hover:bg-line-soft hover:text-ink'}
        `}
      >
        <Icon className="h-[17px] w-[17px] shrink-0" strokeWidth={1.5} />
        <span className="text-label flex-1">{item.label}</span>
        {item.expandable && (
          <ChevronDown className="h-3.5 w-3.5 text-ink-faint" strokeWidth={1.5} />
        )}
      </Link>
    );
  };

  return (
    <>
      {/* ─── DESKTOP LEFT RAIL ─── */}
      <aside
        className="
          hidden lg:flex lg:flex-col
          fixed top-0 left-0 bottom-0 w-[240px] z-40
          bg-paper border-r border-line
          px-4 pt-7 pb-5
        "
      >
        {/* Wordmark */}
        <Link to="/dashboard" className="pl-2 mb-7">
          <Wordmark size="lg" />
        </Link>

        {/* Primary nav */}
        <nav className="space-y-0.5 flex-1">
          {NAV_ITEMS.map(item => <NavItem key={item.href} item={item} />)}
        </nav>

        {/* Bottom: icon row + user */}
        <div className="pt-4 border-t border-line-soft space-y-3">
          <div className="flex items-center gap-1 px-1">
            <Link to="/notifications" className="relative">
              <IconButton icon={Bell} label="Notifications" />
              {unread > 0 && (
                <span className="absolute -top-0.5 -right-0.5">
                  <Badge count={unread} />
                </span>
              )}
            </Link>
            <IconButton icon={darkMode ? Sun : Moon} label="Toggle theme" onClick={toggleTheme} />
            {user?.subscription_tier !== 'premium' && (
              <Link to="/plus">
                <IconButton icon={Crown} label="Village+" />
              </Link>
            )}
          </div>

          <Link to="/profile" className="flex items-center gap-3 px-1 py-2 rounded-md hover:bg-line-soft transition-colors">
            <Avatar name={user?.name} src={user?.picture} size="md" />
            <div className="min-w-0 flex-1">
              <p className="text-body-sm font-medium text-ink truncate">{user?.nickname || user?.name || 'You'}</p>
              <p className="text-micro text-ink-faint truncate">{user?.email}</p>
            </div>
          </Link>
        </div>
      </aside>

      {/* ─── MOBILE TOP BAR ─── */}
      <nav className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-paper border-b border-line h-14 px-4 flex items-center justify-between">
        <Link to="/dashboard" className="flex items-center">
          <Wordmark size="md" />
        </Link>
        <div className="flex items-center gap-1">
          <IconButton icon={darkMode ? Sun : Moon} label="Toggle theme" onClick={toggleTheme} />
          <div className="relative">
            <IconButton icon={Menu} label="Open menu" onClick={() => setMobileOpen(true)} />
            {(unread + friendReqs) > 0 && (
              <span className="absolute top-1 right-1">
                <Badge dot />
              </span>
            )}
          </div>
        </div>
      </nav>

      {/* ─── MOBILE DRAWER ─── */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-ink/40 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <div className="absolute top-0 right-0 bottom-0 w-[280px] bg-paper border-l border-line flex flex-col animate-in slide-in-from-right duration-200">
            <header className="h-14 px-4 flex items-center justify-between border-b border-line">
              <Wordmark size="md" />
              <IconButton icon={X} label="Close menu" onClick={() => setMobileOpen(false)} />
            </header>
            <div className="p-3 border-b border-line-soft">
              <Link
                to="/profile"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-3 p-2 rounded-md hover:bg-line-soft"
              >
                <Avatar name={user?.name} src={user?.picture} size="lg" />
                <div className="min-w-0">
                  <p className="text-body font-medium text-ink truncate">{user?.nickname || user?.name}</p>
                  <p className="text-body-sm text-ink-faint truncate">{user?.email}</p>
                </div>
              </Link>
            </div>
            <nav className="p-3 space-y-0.5 flex-1 overflow-auto">
              {NAV_ITEMS.map(item => (
                <div key={item.href} onClick={() => setMobileOpen(false)}>
                  <NavItem item={item} />
                </div>
              ))}
              <div className="h-px bg-line-soft my-2" />
              <Link
                to="/settings"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-3 h-10 px-3 rounded-md text-ink-muted hover:bg-line-soft hover:text-ink"
              >
                <Settings className="h-[17px] w-[17px]" strokeWidth={1.5} />
                <span className="text-label">Settings</span>
              </Link>
              {user?.role === 'admin' || user?.role === 'moderator' ? (
                <Link
                  to="/admin"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-3 h-10 px-3 rounded-md text-ink-muted hover:bg-line-soft hover:text-ink"
                >
                  <Shield className="h-[17px] w-[17px]" strokeWidth={1.5} />
                  <span className="text-label">Admin</span>
                </Link>
              ) : null}
              <button
                onClick={() => { handleLogout(); setMobileOpen(false); }}
                className="w-full flex items-center gap-3 h-10 px-3 rounded-md text-ink-muted hover:bg-line-soft hover:text-ink"
              >
                <LogOut className="h-[17px] w-[17px]" strokeWidth={1.5} />
                <span className="text-label">Log out</span>
              </button>
            </nav>
          </div>
        </div>
      )}
    </>
  );
}
