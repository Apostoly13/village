import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Wordmark } from "./Wordmark";
import { useTheme } from "../useTheme";
import { Button } from "./ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { ScrollArea } from "./ui/scroll-area";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip";
import { Mail, User, LogOut, Menu, X, Moon, Sun, UserPlus, Bell, Bookmark, Shield, ScrollText, BookOpen, Calendar, Lock, FileText, Settings, Crown, ChevronDown, Home, ShoppingBag } from "lucide-react";
import { IconHome, IconChat, IconCal, IconPeople, IconHeart, IconMail, IconShield, IconCog, IconSpaces } from "../icons";
import { toast } from "sonner";
import { FEATURES } from "../config/features";

const API_URL = process.env.REACT_APP_BACKEND_URL;

export default function Navigation({ user }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [themeSetting, setThemeSetting, themeResolved] = useTheme();
  const darkMode = themeResolved === "night";
  const [friendRequestCount, setFriendRequestCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [unreadMessages, setUnreadMessages] = useState(0);

  useEffect(() => {
    // Single polling loop: badge counts every 20s + heartbeat piggybacked every 6th tick (120s)
    // Pauses automatically when the browser tab is hidden to reduce server load
    let tickCount = 0;
    const poll = async () => {
      // Skip poll entirely when tab is hidden
      if (document.hidden) return;
      tickCount++;
      try {
        const [friendsRes, notifCountRes, msgRes] = await Promise.all([
          fetch(`${API_URL}/api/friends/requests`, { credentials: "include" }),
          fetch(`${API_URL}/api/notifications/unread-count`, { credentials: "include" }),
          fetch(`${API_URL}/api/messages/unread-count`, { credentials: "include" }),
        ]);
        if (friendsRes.ok) {
          const data = await friendsRes.json();
          setFriendRequestCount(data.length);
        }
        if (notifCountRes.ok) {
          const data = await notifCountRes.json();
          setUnreadCount(data.count);
        }
        if (msgRes.ok) {
          const data = await msgRes.json();
          setUnreadMessages(data.count);
        }
      } catch {}
      // Heartbeat every 6th tick (~120s) — fire-and-forget
      if (tickCount % 6 === 0) {
        fetch(`${API_URL}/api/users/heartbeat`, { method: "POST", credentials: "include" }).catch(() => {});
      }
    };

    // Resume immediately when tab becomes visible again
    const onVisibilityChange = () => { if (!document.hidden) poll(); };
    document.addEventListener("visibilitychange", onVisibilityChange);

    poll();
    const interval = setInterval(poll, 20000);
    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, []);

  const fetchNotifications = async () => {
    try {
      const response = await fetch(`${API_URL}/api/notifications?limit=10`, { credentials: "include" });
      if (response.ok) {
        setNotifications(await response.json());
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
    }
  };

  const handleNotificationsOpen = (open) => {
    setNotificationsOpen(open);
    if (open) {
      fetchNotifications();
    }
  };

  const markAllRead = async () => {
    try {
      await fetch(`${API_URL}/api/notifications/mark-read`, { method: "POST", credentials: "include" });
      setUnreadCount(0);
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch (error) {
      console.error("Error marking notifications read:", error);
    }
  };

  const handleNotificationClick = async (notification) => {
    if (!notification.is_read) {
      await fetch(`${API_URL}/api/notifications/${notification.notification_id}/read`, { 
        method: "POST", 
        credentials: "include" 
      });
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
    if (notification.link) {
      navigate(notification.link);
    }
    setNotificationsOpen(false);
  };

  const isAdmin = user?.role === "admin" || user?.role === "moderator";
  const isFree = user?.subscription_tier === "free" && !isAdmin;

  // Desktop nav — full list including Group Chats
  const navItems = [
    { icon: Home, label: "Home", href: "/dashboard", testId: "nav-home" },
    {
      icon: IconSpaces, label: "Spaces", href: "/forums", testId: "nav-forums",
      subItems: [
        { label: "📖 All Spaces", href: "/forums" },
        { label: "🏘️ Communities", href: "/forums?tab=communities" },
        { label: "✏️ Create Post", href: "/create-post" },
        { label: "💾 Saved Posts", href: "/saved" },
      ],
    },
    {
      icon: IconChat, label: "Group Chats", href: "/chat", testId: "nav-chat",
      subItems: [
        { label: "🇦🇺 All Australia", href: "/chat?tab=village" },
        { label: "📍 Local Chats", href: "/chat?tab=local" },
        { label: "👥 Friends", href: "/chat?tab=friends" },
      ],
    },
    { icon: Calendar, label: "Events", href: isFree ? "/plus" : "/events", testId: "nav-events", locked: isFree },
    { icon: Mail, label: "Messages", href: isFree ? "/plus" : "/messages", testId: "nav-messages", locked: isFree, badge: isFree ? 0 : unreadMessages },
    ...(FEATURES.BLOG ? [{ icon: BookOpen, label: "Blog", href: "/blog", testId: "nav-blog" }] : []),
    ...(isAdmin ? [{ icon: Shield, label: "Admin", href: "/admin", testId: "nav-admin" }] : []),
  ];

  // Mobile bottom tab bar — 5 focused tabs including Group Chats for direct access
  const mobileNavItems = [
    { icon: Home,          label: "Home",     href: "/dashboard",                        testId: "nav-home" },
    { icon: IconSpaces,    label: "Spaces",   href: "/forums",                           testId: "nav-forums" },
    { icon: IconChat,      label: "Chats",    href: "/chat",                             testId: "nav-chat" },
    { icon: Mail,          label: "Messages", href: isFree ? "/plus" : "/messages",      testId: "nav-messages",  locked: isFree, badge: isFree ? 0 : unreadMessages },
    { icon: User,          label: "Me",       href: "/profile",                          testId: "nav-me" },
  ];

  const toggleTheme = () => {
    setThemeSetting(darkMode ? "day" : "night");
  };

  const handleLogout = async () => {
    try {
      await fetch(`${API_URL}/api/auth/logout`, {
        method: "POST",
        credentials: "include"
      });
    } catch (error) {
      console.error("Logout error:", error);
    }
    
    localStorage.removeItem("user");
    toast.success("Logged out successfully");
    navigate("/");
  };

  return (
    <>
      {/* ── Desktop Left Sidebar ─────────────────────────────────── */}
      <aside
        className="hidden lg:flex flex-col fixed left-0 top-0 bottom-0 z-50 w-60"
        style={{ background: "var(--paper)", borderRight: "1px solid var(--line-2)" }}
      >
        {/* Wordmark */}
        <div className="px-6 pt-6 pb-4 shrink-0">
          <Link to="/dashboard" data-testid="nav-logo">
            <Wordmark size={22} />
          </Link>
        </div>

        {/* Primary nav */}
        <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto">
          {[
            { Icon: IconHome,   label: "Home",      href: "/dashboard",                     testId: "nav-home" },
            { Icon: IconSpaces, label: "Spaces",    href: "/forums",                        testId: "nav-forums",   subItems: [
              { label: "All Spaces",    href: "/forums" },
              { label: "Communities",   href: "/forums?tab=communities" },
              { label: "Create Post",   href: "/create-post" },
              { label: "Saved Posts",   href: "/saved" },
            ]},
            { Icon: IconChat,   label: "Chats",     href: "/chat",                          testId: "nav-chat",     subItems: [
              { label: "All Australia", href: "/chat?tab=village" },
              { label: "Local Chats", href: "/chat?tab=local" },
              { label: "Friends",       href: "/chat?tab=friends" },
            ]},
            { Icon: IconCal,    label: "Events",    href: isFree ? "/plus" : "/events",     testId: "nav-events",   locked: isFree },
            { Icon: ShoppingBag, label: "Stall",   href: isFree ? "/plus" : "/stall",      testId: "nav-stall",    locked: isFree },
            { Icon: IconMail,   label: "Messages",  href: isFree ? "/plus" : "/messages",   testId: "nav-messages", locked: isFree, badge: isFree ? 0 : unreadMessages },
            { Icon: IconPeople, label: "Friends",   href: "/friends",                        testId: "nav-friends-link", badge: friendRequestCount },
            { Icon: IconHeart,  label: "Saved",     href: "/saved",                         testId: "nav-saved" },
            ...(FEATURES.BLOG  ? [{ Icon: BookOpen,   label: "Blog",      href: "/blog",      testId: "nav-blog"  }] : []),
            ...(user?.role === "moderator" ? [{ Icon: IconShield, label: "Moderator",  href: "/moderator", testId: "nav-mod"   }] : []),
            ...(user?.role === "admin"     ? [{ Icon: IconShield, label: "Admin",      href: "/admin",     testId: "nav-admin" }] : []),
          ].map((item) => {
            const active = location.pathname === item.href || (item.href !== "/dashboard" && location.pathname.startsWith(item.href.split("?")[0]));
            const itemStyle = active
              ? { background: "var(--paper-2)", color: "var(--ink)" }
              : { color: "var(--ink-2)" };

            const inner = (
              <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors cursor-pointer" style={itemStyle}
                onMouseEnter={e => { if (!active) e.currentTarget.style.background = "var(--paper-2)"; }}
                onMouseLeave={e => { if (!active) e.currentTarget.style.background = "transparent"; }}
              >
                <item.Icon size={18} style={{ color: active ? "hsl(var(--accent))" : "var(--ink-3)", flexShrink: 0 }} />
                <span className="text-sm font-medium flex-1">{item.label}</span>
                {item.locked && <Lock className="h-3 w-3 opacity-40 shrink-0" />}
                {item.badge > 0 && !item.locked && (
                  <span className="min-w-[18px] h-[18px] rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center px-1 font-medium shrink-0">
                    {item.badge > 9 ? "9+" : item.badge}
                  </span>
                )}
              </div>
            );

            if (item.subItems) {
              return (
                <DropdownMenu key={item.testId}>
                  <div className="flex items-center gap-0">
                    <Link to={item.href} data-testid={item.testId} className="flex-1 min-w-0">{inner}</Link>
                    <DropdownMenuTrigger asChild>
                      <button className="p-1.5 rounded-lg opacity-40 hover:opacity-100 transition-opacity" style={{ color: "var(--ink-2)" }}>
                        <ChevronDown className="h-3 w-3" />
                      </button>
                    </DropdownMenuTrigger>
                  </div>
                  <DropdownMenuContent side="right" align="start" className="w-44" style={{ background: "var(--paper-2)", border: "1px solid var(--line)" }}>
                    {item.subItems.map(sub => (
                      <DropdownMenuItem key={sub.href} asChild>
                        <Link to={sub.href} className="cursor-pointer text-sm" style={{ color: "var(--ink)" }}>{sub.label}</Link>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              );
            }
            if (item.locked) {
              return (
                <TooltipProvider key={item.testId} delayDuration={300}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Link to={item.href} data-testid={item.testId} className="block">{inner}</Link>
                    </TooltipTrigger>
                    <TooltipContent side="right" className="text-xs">Village+ feature</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              );
            }
            return <Link key={item.testId} to={item.href} data-testid={item.testId} className="block">{inner}</Link>;
          })}
        </nav>

        {/* Village+ promo (free users) */}
        {isFree && (
          <Link to="/plus" className="mx-3 mb-3 shrink-0">
            <div className="px-4 py-3 rounded-xl transition-colors"
              style={{ background: "var(--paper-2)", border: "1px solid var(--line)" }}
            >
              <p className="text-xs font-semibold mb-0.5" style={{ color: "var(--ink)" }}>✦ Village+</p>
              <p className="text-xs leading-tight" style={{ color: "var(--ink-3)" }}>Unlock 1:1 messaging, host events, ad-free.</p>
            </div>
          </Link>
        )}

        {/* Bottom: notifications + theme + user */}
        <div className="shrink-0 px-3 pb-4 pt-2 space-y-1" style={{ borderTop: "1px solid var(--line-2)" }}>
          <div className="flex items-center gap-1 px-1">
            {/* Notifications */}
            <DropdownMenu open={notificationsOpen} onOpenChange={handleNotificationsOpen}>
              <DropdownMenuTrigger asChild>
                <button className="relative p-2 rounded-lg transition-colors" style={{ color: "var(--ink-2)" }}
                  data-testid="nav-notifications"
                  onMouseEnter={e => e.currentTarget.style.background = "var(--paper-2)"}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                >
                  <Bell className="h-4.5 w-4.5" style={{ width: 18, height: 18 }} />
                  {unreadCount > 0 && (
                    <span className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] flex items-center justify-center font-medium">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="right" align="end" className="w-80" style={{ background: "var(--paper-2)", border: "1px solid var(--line)" }}>
                <div className="flex items-center justify-between px-3 py-2" style={{ borderBottom: "1px solid var(--line)" }}>
                  <span className="font-medium text-sm" style={{ color: "var(--ink)" }}>Notifications</span>
                  {unreadCount > 0 && (
                    <Button variant="ghost" size="sm" onClick={markAllRead} className="text-xs h-7">Mark all read</Button>
                  )}
                </div>
                <ScrollArea className="h-[300px]">
                  {notifications.length === 0 ? (
                    <div className="p-4 text-center text-sm" style={{ color: "var(--ink-3)" }}>No notifications yet</div>
                  ) : (
                    notifications.map((notif) => (
                      <button
                        key={notif.notification_id}
                        onClick={() => handleNotificationClick(notif)}
                        className={`w-full text-left p-3 cursor-pointer transition-colors focus:outline-none ${!notif.is_read ? "bg-primary/5" : ""}`}
                        style={{ borderBottom: "1px solid var(--line-2)" }}
                        onMouseEnter={e => e.currentTarget.style.background = "var(--paper-3)"}
                        onMouseLeave={e => e.currentTarget.style.background = notif.is_read ? "transparent" : ""}
                      >
                        <p className="text-xs font-medium mb-0.5" style={{ color: "var(--ink)" }}>{notif.title}</p>
                        <p className="text-xs line-clamp-2" style={{ color: "var(--ink-3)" }}>{notif.message}</p>
                      </button>
                    ))
                  )}
                </ScrollArea>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Theme toggle */}
            <button className="p-2 rounded-lg transition-colors" style={{ color: "var(--ink-2)" }}
              onClick={toggleTheme} data-testid="theme-toggle-nav"
              onMouseEnter={e => e.currentTarget.style.background = "var(--paper-2)"}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}
            >
              {darkMode ? <Sun style={{ width: 18, height: 18 }} /> : <Moon style={{ width: 18, height: 18 }} />}
            </button>

            {/* Settings — use Lucide Settings (gear with teeth) distinct from sun rays */}
            <Link to="/settings" className="p-2 rounded-lg transition-colors block" style={{ color: "var(--ink-2)" }}
              onMouseEnter={e => e.currentTarget.style.background = "var(--paper-2)"}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}
            >
              <Settings style={{ width: 18, height: 18 }} />
            </Link>
          </div>

          {/* User row */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="w-full flex items-center gap-3 px-2 py-2 rounded-xl transition-colors text-left"
                style={{ color: "var(--ink)" }}
                onMouseEnter={e => e.currentTarget.style.background = "var(--paper-2)"}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                data-testid="nav-profile-dropdown"
              >
                <Avatar className="h-8 w-8 shrink-0">
                  <AvatarImage src={user?.picture} />
                  <AvatarFallback className="bg-primary/20 text-primary text-xs">
                    {(user?.nickname || user?.name || user?.email || "V")[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate" style={{ color: "var(--ink)" }}>{user?.nickname || user?.name}</p>
                  <p className="text-xs truncate" style={{ color: "var(--ink-3)" }}>{user?.email}</p>
                </div>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="right" align="end" className="w-52" style={{ background: "var(--paper-2)", border: "1px solid var(--line)" }}>
              <DropdownMenuItem asChild><Link to="/profile" className="cursor-pointer" data-testid="dropdown-profile"><User className="h-4 w-4 mr-2" />Profile</Link></DropdownMenuItem>
              <DropdownMenuItem asChild><Link to="/settings" className="cursor-pointer"><Settings className="h-4 w-4 mr-2" />Settings</Link></DropdownMenuItem>
              <DropdownMenuItem asChild><Link to="/plus" className="cursor-pointer"><Crown className="h-4 w-4 mr-2 text-primary" />{user?.subscription_tier === "premium" ? "Manage Village+" : "Village+"}</Link></DropdownMenuItem>
              <DropdownMenuItem asChild><Link to="/changelog" className="cursor-pointer" data-testid="dropdown-changelog"><ScrollText className="h-4 w-4 mr-2" />What's New</Link></DropdownMenuItem>
              <DropdownMenuItem asChild><Link to="/suggestions" className="cursor-pointer"><Mail className="h-4 w-4 mr-2" />Suggestions</Link></DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-destructive cursor-pointer" data-testid="dropdown-logout"><LogOut className="h-4 w-4 mr-2" />Log out</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>

      {/* Mobile Navigation - Top Bar */}
      <nav className="fixed top-0 left-0 right-0 z-50 lg:hidden" style={{ background: "var(--paper)", borderBottom: "1px solid var(--line-2)" }}>
        <div className="px-4 h-14 flex items-center justify-between">
          <Link to="/dashboard" className="flex items-center">
            <Wordmark size={20} />
          </Link>

          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={toggleTheme}
              className="rounded-full"
            >
              {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              data-testid="mobile-menu-toggle"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        {mobileMenuOpen && (
          <div className="absolute top-14 left-0 right-0 p-4 space-y-2 animate-fade-in" style={{ background: "var(--paper-2)", borderBottom: "1px solid var(--line)" }}>
            <div className="flex items-center gap-3 p-3 rounded-xl bg-secondary/50">
              <Avatar className="h-10 w-10">
                <AvatarImage src={user?.picture} />
                <AvatarFallback className="bg-primary/20 text-primary">
                  {(user?.nickname || user?.name || user?.email || 'V')[0].toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium text-foreground">{user?.name}</p>
                <p className="text-sm text-muted-foreground truncate">{user?.email}</p>
              </div>
            </div>
            
            <Link 
              to="/profile" 
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-3 p-3 rounded-xl hover:bg-secondary/50 text-foreground"
            >
              <User className="h-5 w-5" />
              Profile
            </Link>
            
            <Link 
              to="/friends" 
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-3 p-3 rounded-xl hover:bg-secondary/50 text-foreground"
            >
              <UserPlus className="h-5 w-5" />
              Friends
              {friendRequestCount > 0 && (
                <span className="ml-auto w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">
                  {friendRequestCount}
                </span>
              )}
            </Link>
            
            <Link
              to={isFree ? "/plus" : "/events"}
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center gap-3 p-3 rounded-xl hover:bg-secondary/50 ${isFree ? "text-muted-foreground/60" : "text-foreground"}`}
            >
              <Calendar className="h-5 w-5" />
              Events
              {isFree && <Lock className="h-3.5 w-3.5 ml-auto opacity-60" />}
            </Link>

            <Link
              to={isFree ? "/plus" : "/stall"}
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center gap-3 p-3 rounded-xl hover:bg-secondary/50 ${isFree ? "text-muted-foreground/60" : "text-foreground"}`}
            >
              <ShoppingBag className="h-5 w-5" />
              Stall
              {isFree && <Lock className="h-3.5 w-3.5 ml-auto opacity-60" />}
            </Link>

            <Link
              to="/saved"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-3 p-3 rounded-xl hover:bg-secondary/50 text-foreground"
            >
              <Bookmark className="h-5 w-5" />
              Saved
            </Link>

            <Link
              to="/settings"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-3 p-3 rounded-xl hover:bg-secondary/50 text-foreground"
            >
              <Settings className="h-5 w-5" />
              Settings
            </Link>

            <Link
              to="/plus"
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center gap-3 p-3 rounded-xl font-medium ${
                user?.subscription_tier === "premium"
                  ? "hover:bg-secondary/50 text-foreground"
                  : "bg-primary/10 border border-primary/20 text-primary"
              }`}
            >
              <Crown className="h-5 w-5" />
              {user?.subscription_tier === "premium" ? "Manage Village+" : "Village+"}
            </Link>

            <Link
              to="/changelog"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-3 p-3 rounded-xl hover:bg-secondary/50 text-foreground"
            >
              <ScrollText className="h-5 w-5" />
              What's New
            </Link>

            {isAdmin && (
              <>
                <div className="border-t border-border/30 my-1" />
                <Link
                  to="/admin"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-secondary/50 text-foreground"
                >
                  <Shield className="h-5 w-5 text-blue-500" />
                  Admin Portal
                </Link>
                {user?.role === "moderator" && (
                  <Link
                    to="/moderator"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-secondary/50 text-foreground"
                  >
                    <Shield className="h-5 w-5 text-purple-500" />
                    Moderator Dashboard
                  </Link>
                )}
              </>
            )}

            <div className="border-t border-border/30 my-1" />

            <Link
              to="/community-guidelines"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-3 p-3 rounded-xl hover:bg-secondary/50 text-foreground"
            >
              <Shield className="h-5 w-5" />
              Community Guidelines
            </Link>

            <Link
              to="/privacy"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-3 p-3 rounded-xl hover:bg-secondary/50 text-muted-foreground text-sm"
            >
              <FileText className="h-4 w-4" />
              Privacy Policy
            </Link>

            <Link
              to="/terms"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-3 p-3 rounded-xl hover:bg-secondary/50 text-muted-foreground text-sm"
            >
              <FileText className="h-4 w-4" />
              Terms of Service
            </Link>

            <div className="border-t border-border/30 my-1" />

            <button
              onClick={handleLogout}
              className="flex items-center gap-3 p-3 rounded-xl hover:bg-secondary/50 text-destructive w-full"
            >
              <LogOut className="h-5 w-5" />
              Log out
            </button>
          </div>
        )}
      </nav>

      {/* Mobile Navigation - Bottom Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 lg:hidden pb-safe" style={{ background: "var(--paper)", borderTop: "1px solid var(--line-2)" }}>
        <div className="flex items-center justify-around h-[58px]">
          {mobileNavItems.map((item) => {
            const isActive = location.pathname === item.href || location.pathname.startsWith(item.href + '/');
            return (
              <Link
                key={item.testId}
                to={item.href}
                className={`flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition-colors ${isActive ? 'text-primary' : item.locked ? 'text-muted-foreground/50' : 'text-muted-foreground'}`}
                data-testid={`mobile-${item.testId}`}
                aria-label={item.label}
              >
                <div className="relative">
                  <item.icon className="h-[22px] w-[22px]" />
                  {item.locked && <Lock className="absolute -bottom-0.5 -right-1 h-2.5 w-2.5 text-muted-foreground/70" />}
                  {item.badge > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[15px] h-[15px] rounded-full bg-red-500 text-white text-[9px] flex items-center justify-center px-1 font-medium">
                      {item.badge > 9 ? '9+' : item.badge}
                    </span>
                  )}
                </div>
                <span className={`text-[10px] font-medium leading-none ${isActive ? 'text-primary' : ''}`}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
