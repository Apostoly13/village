import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Navigation from "../components/Navigation";
import AppFooter from "../components/AppFooter";
import { Switch } from "../components/ui/switch";
import { Label } from "../components/ui/label";
import { Button } from "../components/ui/button";
import { ArrowLeft, Moon, Sun, MessageSquare, Bell, Eye, Mail, Users, Heart, Sliders, RotateCcw } from "lucide-react";
import { toast } from "sonner";

const API_URL = process.env.REACT_APP_BACKEND_URL;
const PREFS_KEY = "village_prefs";

function loadPrefs() {
  try {
    return JSON.parse(localStorage.getItem(PREFS_KEY) || "{}");
  } catch {
    return {};
  }
}

function savePrefs(prefs) {
  localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
}

// Sync backend-relevant preferences (privacy + notifications) to the server
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

export default function Settings({ user }) {
  // Seed initial values from user object (server state) then override with localStorage
  const [prefs, setPrefs] = useState(() => {
    const local = loadPrefs();
    return {
      showOnline: user?.show_online ?? true,
      allowFriendRequests: user?.allow_friend_requests ?? true,
      notifications: {
        replies: user?.email_preferences?.notify_replies ?? true,
        messages: user?.email_preferences?.notify_dms ?? true,
        friendRequests: user?.email_preferences?.notify_friend_requests ?? true,
        likes: user?.email_preferences?.notify_likes ?? true,
      },
      ...local,
    };
  });
  const [darkMode, setDarkMode] = useState(
    document.documentElement.classList.contains("dark")
  );

  // Persist every change to localStorage
  useEffect(() => {
    savePrefs(prefs);
  }, [prefs]);

  function set(key, value) {
    setPrefs(p => ({ ...p, [key]: value }));
  }

  function setNotif(key, value) {
    setPrefs(p => ({ ...p, notifications: { ...(p.notifications || {}), [key]: value } }));
    // Sync notification preferences to backend
    const keyMap = { replies: "notify_replies", messages: "notify_dms", friendRequests: "notify_friend_requests", likes: "notify_likes" };
    if (keyMap[key]) {
      syncToBackend({ email_preferences: { ...((user?.email_preferences) || {}), [keyMap[key]]: value } });
    }
  }

  function setPrivacy(key, value) {
    set(key, value);
    const backendKey = key === "showOnline" ? "show_online" : key === "allowFriendRequests" ? "allow_friend_requests" : null;
    if (backendKey) syncToBackend({ [backendKey]: value });
  }

  function toggleDark(checked) {
    setDarkMode(checked);
    if (checked) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
    set("theme", checked ? "dark" : "light");
    toast.success(checked ? "Dark mode on" : "Light mode on");
  }

  const notif = prefs.notifications || {};

  return (
    <div className="min-h-screen bg-background pb-20 lg:pb-0">
      <Navigation user={user} />

      <main className="max-w-2xl mx-auto px-4 pt-20 lg:pt-24">
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Link>

        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center">
            <Sliders className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="font-heading text-2xl font-bold text-foreground">Settings</h1>
            <p className="text-sm text-muted-foreground">Customise how The Village works for you</p>
          </div>
        </div>

        <div className="space-y-4">

          {/* ── Appearance ────────────────────────────── */}
          <section className="bg-card rounded-2xl border border-border/50 p-5 space-y-4">
            <div className="flex items-center gap-2 mb-1">
              {darkMode ? <Moon className="h-4 w-4 text-primary" /> : <Sun className="h-4 w-4 text-primary" />}
              <h2 className="font-heading font-semibold text-foreground">Appearance</h2>
            </div>

            <div className="flex items-center justify-between gap-4">
              <div>
                <Label className="text-sm font-medium text-foreground">Dark mode</Label>
                <p className="text-xs text-muted-foreground mt-0.5">Easier on the eyes — especially at 3am</p>
              </div>
              <Switch checked={darkMode} onCheckedChange={toggleDark} />
            </div>
          </section>

          {/* ── Chat & Messaging ──────────────────────── */}
          <section className="bg-card rounded-2xl border border-border/50 p-5 space-y-4">
            <div className="flex items-center gap-2 mb-1">
              <MessageSquare className="h-4 w-4 text-primary" />
              <h2 className="font-heading font-semibold text-foreground">Chat & Messaging</h2>
            </div>

            <div className="flex items-center justify-between gap-4">
              <div>
                <Label className="text-sm font-medium text-foreground">Floating chat bubble</Label>
                <p className="text-xs text-muted-foreground mt-0.5">Show the quick-access chat button while browsing</p>
              </div>
              <Switch
                checked={prefs.chatBubble !== false}
                onCheckedChange={v => set("chatBubble", v)}
              />
            </div>

            <div className="flex items-center justify-between gap-4">
              <div>
                <Label className="text-sm font-medium text-foreground">Message preview pop-ups</Label>
                <p className="text-xs text-muted-foreground mt-0.5">Show a brief preview when a new message arrives</p>
              </div>
              <Switch
                checked={prefs.messageToast !== false}
                onCheckedChange={v => set("messageToast", v)}
              />
            </div>

            <div className="flex items-center justify-between gap-4">
              <div>
                <Label className="text-sm font-medium text-foreground">Message sounds</Label>
                <p className="text-xs text-muted-foreground mt-0.5">Play a soft sound when messages arrive</p>
              </div>
              <Switch
                checked={prefs.messageSounds === true}
                onCheckedChange={v => set("messageSounds", v)}
              />
            </div>
          </section>

          {/* ── Notifications ─────────────────────────── */}
          <section className="bg-card rounded-2xl border border-border/50 p-5 space-y-4">
            <div className="flex items-center gap-2 mb-1">
              <Bell className="h-4 w-4 text-primary" />
              <h2 className="font-heading font-semibold text-foreground">Notifications</h2>
            </div>

            {[
              { key: "replies", icon: MessageSquare, label: "Replies to my posts", desc: "When someone replies to a forum post you made" },
              { key: "messages", icon: Mail, label: "Private messages", desc: "When a friend or member sends you a direct message" },
              { key: "friendRequests", icon: Users, label: "Friend requests", desc: "When someone sends you a friend request" },
              { key: "likes", icon: Heart, label: "Post likes", desc: "When someone likes one of your posts" },
            ].map(({ key, icon: Icon, label, desc }) => (
              <div key={key} className="flex items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <Icon className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                  <div>
                    <Label className="text-sm font-medium text-foreground">{label}</Label>
                    <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
                  </div>
                </div>
                <Switch
                  checked={notif[key] !== false}
                  onCheckedChange={v => setNotif(key, v)}
                />
              </div>
            ))}
          </section>

          {/* ── Privacy ───────────────────────────────── */}
          <section className="bg-card rounded-2xl border border-border/50 p-5 space-y-4">
            <div className="flex items-center gap-2 mb-1">
              <Eye className="h-4 w-4 text-primary" />
              <h2 className="font-heading font-semibold text-foreground">Privacy & Visibility</h2>
            </div>

            <div className="flex items-center justify-between gap-4">
              <div>
                <Label className="text-sm font-medium text-foreground">Show online status</Label>
                <p className="text-xs text-muted-foreground mt-0.5">Let friends see when you're active</p>
              </div>
              <Switch
                checked={prefs.showOnline !== false}
                onCheckedChange={v => setPrivacy("showOnline", v)}
              />
            </div>

            <div className="flex items-center justify-between gap-4">
              <div>
                <Label className="text-sm font-medium text-foreground">Allow friend requests</Label>
                <p className="text-xs text-muted-foreground mt-0.5">Other members can send you friend requests</p>
              </div>
              <Switch
                checked={prefs.allowFriendRequests !== false}
                onCheckedChange={v => setPrivacy("allowFriendRequests", v)}
              />
            </div>
          </section>

          {/* ── Legal ──────────────────────────────────────── */}
          <section className="bg-card rounded-2xl border border-border/50 p-5">
            <div className="flex items-center gap-2 mb-3">
              <Sliders className="h-4 w-4 text-primary" />
              <h2 className="font-heading font-semibold text-foreground">Legal</h2>
            </div>
            <div className="flex flex-wrap gap-3 text-sm">
              <Link to="/terms" className="text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors">Terms &amp; Conditions</Link>
              <Link to="/privacy" className="text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors">Privacy Policy</Link>
              <Link to="/community-guidelines" className="text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors">Community Guidelines</Link>
            </div>
            <p className="text-xs text-muted-foreground mt-3">To delete your account and all associated data, visit your <Link to="/profile" className="underline underline-offset-2 hover:text-foreground">Profile Settings</Link>. Data is removed within 30 days of deletion.</p>
          </section>

          <div className="flex items-center justify-between pt-2 pb-6 flex-wrap gap-3">
            <p className="text-xs text-muted-foreground">Appearance &amp; chat saved on this device. Privacy &amp; notifications sync across all devices.</p>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground text-xs rounded-xl"
                onClick={() => {
                  setPrefs({});
                  const isDark = document.documentElement.classList.contains("dark");
                  setDarkMode(isDark);
                  toast.success("Settings reset to defaults");
                }}
              >
                <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
                Reset defaults
              </Button>
              <Button variant="outline" size="sm" className="rounded-xl" asChild>
                <Link to="/profile">Edit Profile</Link>
              </Button>
            </div>
          </div>
        </div>
      </main>
      <AppFooter />
    </div>
  );
}
