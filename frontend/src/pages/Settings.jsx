import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navigation from "../components/Navigation";
import AppFooter from "../components/AppFooter";
import { Switch } from "../components/ui/switch";
import { Label } from "../components/ui/label";
import { Button } from "../components/ui/button";
import {
  Moon, Sun, MessageSquare, Bell, Eye, Mail, Users, Heart,
  Sliders, RotateCcw, User, CreditCard, AlertTriangle, LogOut,
  AtSign, Lock, ChevronRight, Crown,
} from "lucide-react";
import { toast } from "sonner";
import { useTheme, ThemeToggle } from "../useTheme";

const API_URL = process.env.REACT_APP_BACKEND_URL;
const PREFS_KEY = "village_prefs";

function loadPrefs() {
  try { return JSON.parse(localStorage.getItem(PREFS_KEY) || "{}"); }
  catch { return {}; }
}
function savePrefs(prefs) {
  localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
}

async function syncToBackend(patch) {
  try {
    await fetch(`${API_URL}/api/users/profile`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(patch),
    });
  } catch {}
}

// ── Section nav definition ──────────────────────────────────────

const SECTIONS = [
  { id: "appearance",    label: "Appearance",     icon: Sun },
  { id: "chat",         label: "Chat & Messaging", icon: MessageSquare },
  { id: "notifications", label: "Notifications",   icon: Bell },
  { id: "privacy",      label: "Privacy",          icon: Eye },
  { id: "account",      label: "Account",          icon: User },
  { id: "subscription", label: "Subscription",     icon: CreditCard },
  { id: "legal",        label: "Legal",            icon: Sliders },
];

// ── Radio group component ───────────────────────────────────────

function RadioGroup({ value, onChange, options }) {
  return (
    <div className="space-y-2">
      {options.map(o => (
        <button
          key={o.id}
          type="button"
          onClick={() => onChange(o.id)}
          className={`w-full text-left px-4 py-3 rounded-xl border transition-colors flex items-start gap-3 ${
            value === o.id
              ? "border-primary/50 bg-primary/5"
              : "border-border/50 hover:border-primary/20 bg-card"
          }`}
        >
          <span className={`h-4 w-4 rounded-full border-2 mt-0.5 shrink-0 flex items-center justify-center ${
            value === o.id ? "border-primary" : "border-muted-foreground/40"
          }`}>
            {value === o.id && <span className="w-2 h-2 rounded-full bg-primary block" />}
          </span>
          <div>
            <p className="text-sm font-medium text-foreground">{o.label}</p>
            {o.hint && <p className="text-xs text-muted-foreground mt-0.5">{o.hint}</p>}
          </div>
        </button>
      ))}
    </div>
  );
}

// ── Toggle row ──────────────────────────────────────────────────

function ToggleRow({ icon: Icon, label, desc, checked, onChange }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex items-start gap-3">
        {Icon && <Icon className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />}
        <div>
          <Label className="text-sm font-medium text-foreground">{label}</Label>
          {desc && <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>}
        </div>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}

// ── Main component ──────────────────────────────────────────────

export default function Settings({ user }) {
  const navigate = useNavigate();
  const [themeSetting, , themeResolved] = useTheme();
  const isDark = themeResolved === "night";
  const [activeSection, setActiveSection] = useState("appearance");

  const [prefs, setPrefs] = useState(() => {
    const local = loadPrefs();
    return {
      // Appearance (device-local)
      // Chat (device-local)
      chatBubble:    true,
      messageToast:  true,
      messageSounds: false,
      // Privacy (synced to backend)
      showOnline:          user?.show_online ?? true,
      allowFriendRequests: user?.allow_friend_requests ?? true,
      profileVisibility:   "members",   // "public" | "members" | "friends"
      whoCanMessage:       "anyone",    // "anyone" | "friends" | "none"
      // Notifications (synced to backend)
      notifications: {
        replies:        user?.email_preferences?.notify_replies ?? true,
        messages:       user?.email_preferences?.notify_dms ?? true,
        friendRequests: user?.email_preferences?.notify_friend_requests ?? true,
        likes:          user?.email_preferences?.notify_likes ?? true,
        trial:          user?.email_preferences?.notify_trial ?? true,
        events:         user?.email_preferences?.notify_events ?? true,
      },
      ...local,
    };
  });

  useEffect(() => { savePrefs(prefs); }, [prefs]);

  function set(key, value) {
    setPrefs(p => ({ ...p, [key]: value }));
  }

  function setNotif(key, value) {
    setPrefs(p => ({ ...p, notifications: { ...(p.notifications || {}), [key]: value } }));
    const keyMap = {
      replies: "notify_replies", messages: "notify_dms",
      friendRequests: "notify_friend_requests", likes: "notify_likes",
      trial: "notify_trial", events: "notify_events",
    };
    if (keyMap[key]) {
      syncToBackend({ email_preferences: { ...((user?.email_preferences) || {}), [keyMap[key]]: value } });
    }
  }

  function setPrivacy(key, value) {
    set(key, value);
    const backendKey = {
      showOnline: "show_online",
      allowFriendRequests: "allow_friend_requests",
      profileVisibility: "profile_visibility",
      whoCanMessage: "who_can_message",
    }[key];
    if (backendKey) syncToBackend({ [backendKey]: value });
  }

  const handleLogout = async () => {
    try {
      await fetch(`${API_URL}/api/auth/logout`, { method: "POST", credentials: "include" });
    } catch {}
    localStorage.removeItem("user");
    toast.success("Logged out");
    navigate("/");
  };

  const notif = prefs.notifications || {};
  const isPremium = user?.subscription_tier === "premium";

  // ── Section content ─────────────────────────────────────────

  const sectionContent = {
    appearance: (
      <div className="space-y-5">
        <div>
          <h2 className="font-heading font-semibold text-foreground mb-0.5">Appearance</h2>
          <p className="text-xs text-muted-foreground">Saved on this device only.</p>
        </div>
        <div className="flex items-center justify-between gap-4">
          <div>
            <Label className="text-sm font-medium text-foreground">Theme</Label>
            <p className="text-xs text-muted-foreground mt-0.5">Day, Night, or follow your device</p>
          </div>
          <ThemeToggle />
        </div>
      </div>
    ),

    chat: (
      <div className="space-y-5">
        <div>
          <h2 className="font-heading font-semibold text-foreground mb-0.5">Chat & Messaging</h2>
          <p className="text-xs text-muted-foreground">Saved on this device only.</p>
        </div>
        <ToggleRow
          icon={MessageSquare}
          label="Floating chat bubble"
          desc="Show the quick-access chat button while browsing"
          checked={prefs.chatBubble !== false}
          onChange={v => set("chatBubble", v)}
        />
        <ToggleRow
          icon={Bell}
          label="Message preview pop-ups"
          desc="Show a brief preview when a new message arrives"
          checked={prefs.messageToast !== false}
          onChange={v => set("messageToast", v)}
        />
        <ToggleRow
          icon={Bell}
          label="Message sounds"
          desc="Play a soft sound when messages arrive"
          checked={prefs.messageSounds === true}
          onChange={v => set("messageSounds", v)}
        />
      </div>
    ),

    notifications: (
      <div className="space-y-6">
        <div>
          <h2 className="font-heading font-semibold text-foreground mb-0.5">Notifications</h2>
          <p className="text-xs text-muted-foreground">Synced across all your devices.</p>
        </div>

        {/* Email notifications */}
        <div>
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">Email</p>
          <div className="space-y-4">
            <ToggleRow
              icon={MessageSquare}
              label="Replies to my posts"
              desc="When someone replies to a post you made"
              checked={notif.replies !== false}
              onChange={v => setNotif("replies", v)}
            />
            <ToggleRow
              icon={Mail}
              label="Private messages"
              desc="When a friend or member sends you a direct message"
              checked={notif.messages !== false}
              onChange={v => setNotif("messages", v)}
            />
            <ToggleRow
              icon={Users}
              label="Friend requests"
              desc="When someone sends you a friend request"
              checked={notif.friendRequests !== false}
              onChange={v => setNotif("friendRequests", v)}
            />
            <ToggleRow
              icon={Heart}
              label="Post likes"
              desc="When someone likes one of your posts"
              checked={notif.likes !== false}
              onChange={v => setNotif("likes", v)}
            />
            <ToggleRow
              icon={Bell}
              label="Events near me"
              desc="New events posted in your area"
              checked={notif.events !== false}
              onChange={v => setNotif("events", v)}
            />
            <ToggleRow
              icon={Bell}
              label="Trial & subscription reminders"
              desc="Reminders before your Village+ trial ends or renews"
              checked={notif.trial !== false}
              onChange={v => setNotif("trial", v)}
            />
          </div>
        </div>
      </div>
    ),

    privacy: (
      <div className="space-y-6">
        <div>
          <h2 className="font-heading font-semibold text-foreground mb-0.5">Privacy & Visibility</h2>
          <p className="text-xs text-muted-foreground">Synced across all your devices.</p>
        </div>

        {/* Online presence */}
        <div className="space-y-4">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Online presence</p>
          <ToggleRow
            label="Show online status"
            desc="Let friends see when you're active"
            checked={prefs.showOnline !== false}
            onChange={v => setPrivacy("showOnline", v)}
          />
          <ToggleRow
            label="Allow friend requests"
            desc="Other members can send you friend requests"
            checked={prefs.allowFriendRequests !== false}
            onChange={v => setPrivacy("allowFriendRequests", v)}
          />
        </div>

        {/* Profile visibility */}
        <div className="space-y-3">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Profile visibility</p>
          <RadioGroup
            value={prefs.profileVisibility || "members"}
            onChange={v => setPrivacy("profileVisibility", v)}
            options={[
              { id: "public",  label: "Public",       hint: "Anyone — including non-members" },
              { id: "members", label: "Members only",  hint: "Recommended — logged-in members only" },
              { id: "friends", label: "Friends only",  hint: "Only people you've connected with" },
            ]}
          />
        </div>

        {/* Who can message */}
        <div className="space-y-3">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Who can message me</p>
          <RadioGroup
            value={prefs.whoCanMessage || "anyone"}
            onChange={v => setPrivacy("whoCanMessage", v)}
            options={[
              { id: "anyone",  label: "Anyone",       hint: "Any logged-in member" },
              { id: "friends", label: "Friends only",  hint: "Only people you've added" },
              { id: "none",    label: "No one",        hint: "Turn off direct messages" },
            ]}
          />
        </div>
      </div>
    ),

    account: (
      <div className="space-y-6">
        <div>
          <h2 className="font-heading font-semibold text-foreground mb-0.5">Account</h2>
          <p className="text-xs text-muted-foreground">Your login and security settings.</p>
        </div>

        <div className="space-y-4">
          <div>
            <Label className="text-sm font-medium text-foreground block mb-1.5">Email address</Label>
            <div className="px-3 py-2.5 rounded-xl bg-secondary/50 border border-border/30 text-sm text-muted-foreground">
              {user?.email || "—"}
            </div>
            <p className="text-xs text-muted-foreground mt-1">To change your email address, contact support.</p>
          </div>

          <div>
            <Label className="text-sm font-medium text-foreground block mb-1.5">Password</Label>
            <Link to="/profile">
              <Button variant="outline" size="sm" className="rounded-xl">
                <Lock className="h-3.5 w-3.5 mr-1.5" />
                Change password
              </Button>
            </Link>
          </div>

          <div>
            <Label className="text-sm font-medium text-foreground block mb-1.5">Profile</Label>
            <Link to="/profile">
              <Button variant="outline" size="sm" className="rounded-xl">
                <User className="h-3.5 w-3.5 mr-1.5" />
                Edit profile
              </Button>
            </Link>
          </div>

          <div className="pt-2 border-t border-border/30">
            <Label className="text-sm font-medium text-foreground block mb-1.5">Sign out</Label>
            <Button
              variant="outline"
              size="sm"
              className="rounded-xl text-destructive border-destructive/30 hover:bg-destructive/5"
              onClick={handleLogout}
            >
              <LogOut className="h-3.5 w-3.5 mr-1.5" />
              Log out
            </Button>
          </div>
        </div>

        {/* Danger zone */}
        <div className="pt-2 border-t border-border/30">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">Danger zone</p>
          <div className="rounded-xl border-2 border-red-500/30 bg-red-500/5 p-4">
            <p className="text-sm font-medium text-foreground mb-1">Delete my account</p>
            <p className="text-xs text-muted-foreground mb-3">
              All your posts, messages, and data will be removed. This can't be undone. Data is removed within 30 days.
            </p>
            <Link to="/profile">
              <Button variant="outline" size="sm" className="rounded-xl text-destructive border-destructive/30 hover:bg-destructive/5">
                Delete account
              </Button>
            </Link>
          </div>
        </div>
      </div>
    ),

    subscription: (
      <div className="space-y-5">
        <div>
          <h2 className="font-heading font-semibold text-foreground mb-0.5">Subscription</h2>
          <p className="text-xs text-muted-foreground">Your Village+ membership.</p>
        </div>

        <div className="rounded-xl border border-border/50 bg-card p-5">
          <div className="flex items-center gap-2 mb-2">
            <Crown className="h-5 w-5 text-primary" />
            <h3 className="font-heading font-bold text-foreground">Village+</h3>
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
              isPremium
                ? "bg-green-500/15 text-green-700 dark:text-green-400"
                : "bg-secondary text-muted-foreground"
            }`}>
              {isPremium ? "Active" : "Free"}
            </span>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed mb-4">
            {isPremium
              ? "You have an active Village+ membership. Thank you for supporting The Village."
              : "Upgrade to Village+ for 1:1 messaging, events, the Stall marketplace, and more."}
          </p>
          <Link to="/plus">
            <Button
              size="sm"
              className={`rounded-xl ${isPremium ? "" : "bg-primary text-primary-foreground hover:bg-primary/90"}`}
              variant={isPremium ? "outline" : "default"}
            >
              {isPremium ? "Manage Village+" : "Upgrade to Village+"}
            </Button>
          </Link>
        </div>
      </div>
    ),

    legal: (
      <div className="space-y-5">
        <div>
          <h2 className="font-heading font-semibold text-foreground mb-0.5">Legal</h2>
          <p className="text-xs text-muted-foreground">Your rights and our responsibilities.</p>
        </div>
        <div className="space-y-2">
          {[
            { label: "Terms & Conditions",    href: "/terms" },
            { label: "Privacy Policy",        href: "/privacy" },
            { label: "Community Guidelines",  href: "/community-guidelines" },
          ].map(({ label, href }) => (
            <Link key={href} to={href} className="flex items-center justify-between p-3 rounded-xl bg-card border border-border/40 hover:border-primary/30 transition-colors group">
              <span className="text-sm text-foreground">{label}</span>
              <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
            </Link>
          ))}
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          To delete your account and all associated data, go to <button onClick={() => setActiveSection("account")} className="underline underline-offset-2 hover:text-foreground">Account settings</button>. Data is removed within 30 days of deletion.
        </p>
      </div>
    ),
  };

  return (
    <div className="min-h-screen bg-background pb-20 lg:pl-60 lg:pb-0">
      <Navigation user={user} />

      <main className="max-w-4xl mx-auto px-4 pt-16 lg:pt-8">
        <div className="mb-8">
          <h1 className="font-heading text-2xl sm:text-3xl font-bold text-foreground mb-1">Settings</h1>
          <p className="text-sm text-muted-foreground">Customise how The Village works for you</p>
        </div>

        <div className="grid lg:grid-cols-[220px_1fr] gap-8">

          {/* ── Left nav ── */}
          <aside className="lg:sticky lg:top-8 self-start">
            <nav className="flex lg:flex-col gap-1 overflow-x-auto -mx-4 px-4 lg:mx-0 lg:px-0 pb-2 lg:pb-0">
              {SECTIONS.map(s => {
                const active = activeSection === s.id;
                return (
                  <button
                    key={s.id}
                    onClick={() => setActiveSection(s.id)}
                    className={`inline-flex items-center gap-2.5 h-10 px-3 rounded-xl text-sm font-medium whitespace-nowrap transition-colors text-left shrink-0 ${
                      active
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
                    }`}
                  >
                    <s.icon className={`h-4 w-4 shrink-0 ${active ? "text-primary" : "text-muted-foreground"}`} />
                    {s.label}
                  </button>
                );
              })}
            </nav>

            {/* Reset — desktop only */}
            <div className="hidden lg:block mt-6 pt-4 border-t border-border/30">
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground text-xs rounded-xl w-full justify-start"
                onClick={() => { setPrefs({}); toast.success("Settings reset to defaults"); }}
              >
                <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
                Reset defaults
              </Button>
            </div>
          </aside>

          {/* ── Section content ── */}
          <div className="village-card p-6 min-w-0">
            {sectionContent[activeSection]}
          </div>

        </div>

        {/* Reset — mobile */}
        <div className="flex justify-end mt-4 lg:hidden">
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground text-xs rounded-xl"
            onClick={() => { setPrefs({}); toast.success("Settings reset to defaults"); }}
          >
            <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
            Reset defaults
          </Button>
        </div>

        <AppFooter />
      </main>
    </div>
  );
}
