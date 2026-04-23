import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
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
import { Home, MessageSquare, Users, Mail, User, LogOut, Menu, X, Moon, Sun, UserPlus, Bell, Bookmark, Shield, ScrollText, BookOpen, Calendar, Heart, Lock, FileText, Settings, Crown, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { FEATURES } from "../config/features";

const API_URL = process.env.REACT_APP_BACKEND_URL;

export default function Navigation({ user }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(document.documentElement.classList.contains('dark'));
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
      icon: MessageSquare, label: "Spaces", href: "/forums", testId: "nav-forums",
      subItems: [
        { label: "📖 All Spaces", href: "/forums" },
        { label: "🏘️ Communities", href: "/forums?tab=communities" },
        { label: "✏️ Create Post", href: "/create-post" },
        { label: "💾 Saved Posts", href: "/saved" },
      ],
    },
    {
      icon: Users, label: "Group Chats", href: "/chat", testId: "nav-chat",
      subItems: [
        { label: "🇦🇺 All Australia", href: "/chat?tab=village" },
        { label: "📍 Local Circles", href: "/chat?tab=local" },
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
    { icon: MessageSquare, label: "Spaces",   href: "/forums",                           testId: "nav-forums" },
    { icon: Users,         label: "Chats",    href: "/chat",                             testId: "nav-chat" },
    { icon: Mail,          label: "Messages", href: isFree ? "/plus" : "/messages",      testId: "nav-messages",  locked: isFree, badge: isFree ? 0 : unreadMessages },
    { icon: User,          label: "Me",       href: "/profile",                          testId: "nav-me" },
  ];

  const toggleTheme = () => {
    setDarkMode(!darkMode);
    if (!darkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
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
      {/* Desktop Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-border/30 hidden lg:block">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center">
          {/* Left spacer to balance right icons */}
          <div className="flex-1" />

          {/* Center: logo + nav items */}
          <div className="flex items-center gap-3">
            <Link to="/dashboard" className="flex items-center" data-testid="nav-logo">
              <img src="/BG Removed- Main Logo - ps edit.png" alt="The Village" className="h-14 w-auto" />
            </Link>
            <div className="flex items-center gap-1 ml-6">
              <TooltipProvider delayDuration={300}>
                {navItems.map((item) => {
                  const isActive = location.pathname === item.href || location.pathname.startsWith(item.href + '/');
                  const activeClass = isActive ? 'bg-primary/10 text-primary' : item.locked ? 'text-muted-foreground/60 hover:text-foreground' : 'text-muted-foreground hover:text-foreground';

                  // Items with sub-menus: split button (link + chevron dropdown)
                  if (item.subItems) {
                    const mainLink = (
                      <div key={item.testId} className="flex items-center">
                        <Link to={item.href} data-testid={item.testId}>
                          <Button variant="ghost" className={`rounded-l-full rounded-r-none px-4 pr-3 ${activeClass}`}>
                            <item.icon className="h-4 w-4 mr-2" />
                            {item.label}
                          </Button>
                        </Link>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className={`rounded-r-full rounded-l-none px-1.5 h-9 border-l border-border/20 ${activeClass}`}>
                              <ChevronDown className="h-3 w-3" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="start" className="w-44 bg-card border-border/50">
                            {item.subItems.map(sub => (
                              <DropdownMenuItem key={sub.href} asChild>
                                <Link to={sub.href} className="cursor-pointer">{sub.label}</Link>
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    );
                    return mainLink;
                  }

                  // Regular nav items
                  const btn = (
                    <Link key={item.testId} to={item.href} data-testid={item.testId}>
                      <Button variant="ghost" className={`rounded-full px-4 ${activeClass}`}>
                        <item.icon className="h-4 w-4 mr-2" />
                        {item.label}
                        {item.locked && <Lock className="h-3 w-3 ml-1.5 opacity-60" />}
                        {item.badge > 0 && (
                          <span className="ml-1.5 min-w-[18px] h-[18px] rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center px-1 font-medium">
                            {item.badge > 9 ? '9+' : item.badge}
                          </span>
                        )}
                      </Button>
                    </Link>
                  );
                  if (!item.locked) return btn;
                  return (
                    <Tooltip key={item.testId}>
                      <TooltipTrigger asChild>{btn}</TooltipTrigger>
                      <TooltipContent side="bottom" className="text-xs">
                        Village+ feature — <Link to="/plus" className="underline font-medium">upgrade to unlock</Link>
                      </TooltipContent>
                    </Tooltip>
                  );
                })}
              </TooltipProvider>
            </div>
          </div>

          {/* Right: actions */}
          <div className="flex-1 flex justify-end items-center gap-2">
            {/* Notifications */}
            <DropdownMenu open={notificationsOpen} onOpenChange={handleNotificationsOpen}>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon"
                  className="rounded-full relative"
                  data-testid="nav-notifications"
                >
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-medium">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80 bg-card border-border/50">
                <div className="flex items-center justify-between px-3 py-2 border-b border-border/50">
                  <span className="font-medium text-foreground">Notifications</span>
                  {unreadCount > 0 && (
                    <Button variant="ghost" size="sm" onClick={markAllRead} className="text-xs h-7">
                      Mark all read
                    </Button>
                  )}
                </div>
                <ScrollArea className="h-[300px]">
                  {notifications.length === 0 ? (
                    <div className="p-4 text-center text-muted-foreground text-sm">
                      No notifications yet
                    </div>
                  ) : (
                    notifications.map((notif) => (
                      <button
                        key={notif.notification_id}
                        onClick={() => handleNotificationClick(notif)}
                        onKeyDown={(e) => e.key === "Enter" && handleNotificationClick(notif)}
                        className={`w-full text-left p-3 cursor-pointer hover:bg-secondary/50 border-b border-border/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 ${!notif.is_read ? 'bg-primary/5' : ''}`}
                      >
                        <div className="flex items-start gap-2">
                          <span className="text-base mt-0.5 flex-shrink-0" aria-hidden="true">
                            {notif.type === "reply" ? "💬" : notif.type === "like" ? "❤️" : notif.type === "friend_request" || notif.type === "friend_accept" ? "👋" : notif.type === "moderation" ? "🛡️" : "🔔"}
                          </span>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-foreground">{notif.title}</p>
                            <p className="text-xs text-muted-foreground line-clamp-2">{notif.message}</p>
                          </div>
                        </div>
                      </button>
                    ))
                  )}
                </ScrollArea>
              </DropdownMenuContent>
            </DropdownMenu>

            <Link to="/friends" data-testid="nav-friends">
              <Button 
                variant="ghost" 
                size="icon"
                className="rounded-full relative"
              >
                <UserPlus className="h-5 w-5" />
                {friendRequestCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-medium" data-testid="friend-request-badge">
                    {friendRequestCount > 9 ? '9+' : friendRequestCount}
                  </span>
                )}
              </Button>
            </Link>
            <Button 
              variant="ghost" 
              size="icon"
              onClick={toggleTheme}
              className="rounded-full"
              data-testid="theme-toggle-nav"
            >
              {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="rounded-full p-0" data-testid="nav-profile-dropdown">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={user?.picture} />
                    <AvatarFallback className="bg-primary/20 text-primary">
                      {(user?.nickname || user?.name || user?.email || 'V')[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 bg-card border-border/50">
                <div className="px-2 py-1.5">
                  <p className="font-medium text-foreground">{user?.name}</p>
                  <p className="text-sm text-muted-foreground truncate">{user?.email}</p>
                </div>
                <DropdownMenuSeparator className="bg-border/50" />
                <DropdownMenuItem asChild>
                  <Link to="/profile" className="cursor-pointer" data-testid="dropdown-profile">
                    <User className="h-4 w-4 mr-2" />
                    Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/settings" className="cursor-pointer">
                    <Settings className="h-4 w-4 mr-2" />
                    Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/plus" className={`cursor-pointer font-medium ${user?.subscription_tier === "premium" ? "text-foreground" : "text-primary"}`}>
                    <Crown className={`h-4 w-4 mr-2 ${user?.subscription_tier === "premium" ? "text-primary" : "text-primary"}`} />
                    {user?.subscription_tier === "premium" ? "Manage Village+" : "Village+"}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/friends" className="cursor-pointer" data-testid="dropdown-friends">
                    <UserPlus className="h-4 w-4 mr-2" />
                    Friends
                    {friendRequestCount > 0 && (
                      <span className="ml-auto w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">
                        {friendRequestCount}
                      </span>
                    )}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/saved" className="cursor-pointer" data-testid="dropdown-bookmarks">
                    <Bookmark className="h-4 w-4 mr-2" />
                    Saved
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/changelog" className="cursor-pointer" data-testid="dropdown-changelog">
                    <ScrollText className="h-4 w-4 mr-2" />
                    What's New
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/suggestions" className="cursor-pointer">
                    <Heart className="h-4 w-4 mr-2" />
                    Suggestions
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/community-guidelines" className="cursor-pointer">
                    <Shield className="h-4 w-4 mr-2" />
                    Community Guidelines
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/terms" className="cursor-pointer">
                    <FileText className="h-4 w-4 mr-2" />
                    Terms
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/privacy" className="cursor-pointer">
                    <Lock className="h-4 w-4 mr-2" />
                    Privacy
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/contact" className="cursor-pointer">
                    <Mail className="h-4 w-4 mr-2" />
                    Contact
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-border/50" />
                <DropdownMenuItem onClick={handleLogout} className="text-destructive cursor-pointer" data-testid="dropdown-logout">
                  <LogOut className="h-4 w-4 mr-2" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </nav>

      {/* Mobile Navigation - Top Bar */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-border/30 lg:hidden">
        <div className="px-4 h-14 flex items-center justify-between">
          <Link to="/dashboard" className="flex items-center">
            <img src="/BG Removed- Main Logo.png" alt="The Village" className="h-14 w-auto" />
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
          <div className="absolute top-14 left-0 right-0 bg-card border-b border-border/50 p-4 space-y-2 animate-fade-in">
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
      <nav className="fixed bottom-0 left-0 right-0 z-50 glass border-t border-border/30 lg:hidden pb-safe">
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
