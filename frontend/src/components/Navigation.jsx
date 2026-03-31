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
import { Home, MessageSquare, Users, Mail, User, LogOut, Menu, X, Moon, Sun, UserPlus, Bell, Bookmark } from "lucide-react";
import { toast } from "sonner";

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

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [friendsRes, notifCountRes] = await Promise.all([
          fetch(`${API_URL}/api/friends/requests`, { credentials: "include" }),
          fetch(`${API_URL}/api/notifications/unread-count`, { credentials: "include" })
        ]);
        
        if (friendsRes.ok) {
          const data = await friendsRes.json();
          setFriendRequestCount(data.length);
        }
        if (notifCountRes.ok) {
          const data = await notifCountRes.json();
          setUnreadCount(data.count);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
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

  const navItems = [
    { icon: Home, label: "Home", href: "/dashboard", testId: "nav-home" },
    { icon: MessageSquare, label: "Forums", href: "/forums", testId: "nav-forums" },
    { icon: Users, label: "Chat", href: "/chat", testId: "nav-chat" },
    { icon: Mail, label: "Messages", href: "/messages", testId: "nav-messages" },
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
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/dashboard" className="flex items-center gap-2" data-testid="nav-logo">
            <span className="text-2xl">🏡</span>
            <span className="font-heading font-bold text-xl text-foreground">The Village</span>
          </Link>

          <div className="flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = location.pathname === item.href || location.pathname.startsWith(item.href + '/');
              return (
                <Link key={item.href} to={item.href} data-testid={item.testId}>
                  <Button 
                    variant="ghost" 
                    className={`rounded-full px-4 ${isActive ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                  >
                    <item.icon className="h-4 w-4 mr-2" />
                    {item.label}
                  </Button>
                </Link>
              );
            })}
          </div>

          <div className="flex items-center gap-2">
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
                      <div
                        key={notif.notification_id}
                        onClick={() => handleNotificationClick(notif)}
                        className={`p-3 cursor-pointer hover:bg-secondary/50 border-b border-border/30 ${!notif.is_read ? 'bg-primary/5' : ''}`}
                      >
                        <p className="text-sm font-medium text-foreground">{notif.title}</p>
                        <p className="text-xs text-muted-foreground line-clamp-2">{notif.message}</p>
                      </div>
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
                      {user?.name?.[0]?.toUpperCase() || 'U'}
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
                  <Link to="/bookmarks" className="cursor-pointer" data-testid="dropdown-bookmarks">
                    <Bookmark className="h-4 w-4 mr-2" />
                    Saved Posts
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
          <Link to="/dashboard" className="flex items-center gap-2">
            <span className="text-xl">🏡</span>
            <span className="font-heading font-bold text-lg text-foreground">The Village</span>
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
                  {user?.name?.[0]?.toUpperCase() || 'U'}
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
        <div className="flex items-center justify-around h-16">
          {navItems.map((item) => {
            const isActive = location.pathname === item.href || location.pathname.startsWith(item.href + '/');
            return (
              <Link 
                key={item.href} 
                to={item.href}
                className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-colors ${isActive ? 'text-primary' : 'text-muted-foreground'}`}
                data-testid={`mobile-${item.testId}`}
              >
                <item.icon className="h-5 w-5" />
                <span className="text-xs">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
