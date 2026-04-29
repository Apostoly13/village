import { useState, useEffect, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import Navigation from "../components/Navigation";
import { toast } from "sonner";
import {
  Shield, Users, MessageSquare, Flag, Crown, Ban, Search,
  ChevronLeft, ChevronRight, BarChart3, Eye, UserCheck, Heart,
  HelpCircle, TrendingUp, BookOpen, Check, X, Activity,
  Trophy, RefreshCw, MessageCircle, Repeat2,
  Radio, Megaphone, Sliders, AlertTriangle, BellRing, ToggleLeft, ToggleRight,
} from "lucide-react";

const Chevron = ChevronRight;
import { formatDistanceToNow } from "date-fns";

const API_URL = process.env.REACT_APP_BACKEND_URL;

const TIME_PERIODS = [
  { label: "All time", value: "all" },
  { label: "Today",    value: "today" },
  { label: "This week",  value: "week" },
  { label: "This month", value: "month" },
  { label: "This year",  value: "year" },
];

function TimePeriodToggle({ value, onChange }) {
  return (
    <div className="flex gap-1 flex-wrap">
      {TIME_PERIODS.map(p => (
        <button
          key={p.value}
          onClick={() => onChange(p.value)}
          className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
            value === p.value
              ? "bg-primary text-primary-foreground"
              : "bg-secondary text-muted-foreground hover:text-foreground hover:bg-secondary/80"
          }`}
        >
          {p.label}
        </button>
      ))}
    </div>
  );
}

export default function AdminDashboard({ user }) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");

  // Data
  const [analytics, setAnalytics] = useState(null);
  const [growth, setGrowth] = useState([]);
  const [retention, setRetention] = useState(null);
  const [leaderboards, setLeaderboards] = useState(null);
  const [users, setUsers] = useState([]);
  const [reports, setReports] = useState([]);
  const [pendingBlogPosts, setPendingBlogPosts] = useState([]);

  // Drilldown modal
  const [drilldown, setDrilldown] = useState({ open: false, label: "", users: [], posts: [], items: [] });
  const [drilldownLoading, setDrilldownLoading] = useState(false);

  // User list state
  const [userSearch, setUserSearch] = useState("");
  const [userPage, setUserPage] = useState(1);
  const [userPages, setUserPages] = useState(1);
  const [userTotal, setUserTotal] = useState(0);
  const [userFilter, setUserFilter] = useState("");

  // Report state
  const [reportStatus, setReportStatus] = useState("pending");
  const [reportPage, setReportPage] = useState(1);
  const [reportPages, setReportPages] = useState(1);
  const [selectedReport, setSelectedReport] = useState(null);

  // Period toggles
  const [leaderboardPeriod, setLeaderboardPeriod] = useState("all");
  const [overviewPeriod, setOverviewPeriod] = useState("all");

  // Platform remote-control state
  const [platform, setPlatform] = useState(null);
  const [platformSaving, setPlatformSaving] = useState(false);
  const [broadcastMsg, setBroadcastMsg] = useState("");
  const [broadcastSending, setBroadcastSending] = useState(false);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.role !== "admin" && user?.role !== "moderator") {
      navigate("/dashboard");
      return;
    }
    fetchAnalytics();
    fetchGrowth();
  }, [user, navigate]);

  const apiFetch = useCallback(async (url, options = {}) => {
    const res = await fetch(`${API_URL}${url}`, { credentials: "include", ...options });
    if (res.status === 403) { toast.error("Admin access required"); navigate("/dashboard"); return null; }
    return res;
  }, [navigate]);

  const fetchAnalytics = async () => {
    try {
      const res = await apiFetch("/api/admin/analytics");
      if (res?.ok) setAnalytics(await res.json());
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const fetchGrowth = async () => {
    try {
      const res = await apiFetch("/api/admin/analytics/growth?days=30");
      if (res?.ok) setGrowth(await res.json());
    } catch (e) { console.error(e); }
  };

  const fetchRetention = async () => {
    try {
      const res = await apiFetch("/api/admin/analytics/retention");
      if (res?.ok) setRetention(await res.json());
      else setRetention({ daily_retention: 0, weekly_retention: 0, monthly_retention: 0, daily_activity: [], counts: {} });
    } catch (e) {
      console.error(e);
      setRetention({ daily_retention: 0, weekly_retention: 0, monthly_retention: 0, daily_activity: [], counts: {} });
    }
  };

  const fetchLeaderboards = async (period = "all") => {
    try {
      const res = await apiFetch(`/api/admin/analytics/leaderboards?period=${period}`);
      if (res?.ok) setLeaderboards(await res.json());
      else setLeaderboards({ top_posters: [], top_repliers: [], top_chatters: [], top_community_creators: [], top_liked_posts: [], top_replied_posts: [] });
    } catch (e) {
      console.error(e);
      setLeaderboards({ top_posters: [], top_repliers: [], top_chatters: [], top_community_creators: [], top_liked_posts: [], top_replied_posts: [] });
    }
  };

  const fetchUsers = async (page = 1, search = "", filter = userFilter) => {
    try {
      const qs = search ? `&search=${encodeURIComponent(search)}` : "";
      const fqs = filter ? `&filter=${encodeURIComponent(filter)}` : "";
      const res = await apiFetch(`/api/admin/users?page=${page}&limit=15${qs}${fqs}`);
      if (res?.ok) {
        const data = await res.json();
        setUsers(data.users); setUserPage(data.page);
        setUserPages(data.pages); setUserTotal(data.total);
      }
    } catch (e) { console.error(e); }
  };

  const fetchReports = async (status = "pending", page = 1) => {
    try {
      const res = await apiFetch(`/api/admin/reports?status=${status}&page=${page}`);
      if (res?.ok) {
        const data = await res.json();
        setReports(data.reports); setReportPage(data.page); setReportPages(data.pages);
      }
    } catch (e) { console.error(e); }
  };

  const fetchPendingBlogPosts = async () => {
    try {
      const res = await apiFetch("/api/blog/pending");
      if (res?.ok) setPendingBlogPosts(await res.json());
    } catch (e) { console.error(e); }
  };

  const fetchPlatform = async () => {
    try {
      const res = await apiFetch("/api/admin/platform");
      if (res?.ok) setPlatform(await res.json());
    } catch (e) { console.error(e); }
  };

  const savePlatform = async (patch) => {
    setPlatformSaving(true);
    try {
      const res = await apiFetch("/api/admin/platform", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      if (res?.ok) {
        const data = await res.json();
        setPlatform(data.settings);
        toast.success("Settings saved");
      }
    } catch (e) { toast.error("Failed to save"); }
    finally { setPlatformSaving(false); }
  };

  const sendBroadcast = async () => {
    if (!broadcastMsg.trim()) return;
    setBroadcastSending(true);
    try {
      const res = await apiFetch("/api/admin/broadcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: broadcastMsg }),
      });
      if (res?.ok) {
        const data = await res.json();
        toast.success(data.message);
        setBroadcastMsg("");
      }
    } catch (e) { toast.error("Failed to send broadcast"); }
    finally { setBroadcastSending(false); }
  };

  const openDrilldown = async (type) => {
    setDrilldown({ open: true, label: "Loading...", users: [], posts: [], items: [] });
    setDrilldownLoading(true);
    try {
      const res = await apiFetch(`/api/admin/drilldown?type=${type}`);
      if (res?.ok) {
        const data = await res.json();
        setDrilldown({ open: true, label: data.label, users: data.users || [], posts: data.posts || [], items: data.items || [] });
      } else {
        setDrilldown(d => ({ ...d, label: "No data available" }));
      }
    } catch (e) {
      console.error(e);
      setDrilldown(d => ({ ...d, label: "Failed to load" }));
    }
    finally { setDrilldownLoading(false); }
  };

  const handleUserAction = async (userId, action, body = {}) => {
    try {
      const res = await apiFetch(`/api/admin/users/${userId}/${action}`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body)
      });
      if (res?.ok) {
        toast.success((await res.json()).message);
        fetchUsers(userPage, userSearch);
        fetchAnalytics();
      }
    } catch (e) { toast.error("Action failed"); }
  };

  const handleReportAction = async (reportId, action) => {
    try {
      const res = await apiFetch(`/api/admin/reports/${reportId}/action`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action })
      });
      if (res?.ok) {
        toast.success((await res.json()).message);
        fetchReports(reportStatus, reportPage);
        fetchAnalytics();
      }
    } catch (e) { toast.error("Action failed"); }
  };

  const handleBlogAction = async (blogId, action) => {
    try {
      const res = await apiFetch(`/api/blog/${blogId}/${action}`, { method: "POST" });
      if (res?.ok) {
        toast.success(action === "approve" ? "Published!" : "Rejected");
        setPendingBlogPosts(prev => prev.filter(p => p.blog_id !== blogId));
      }
    } catch (e) { toast.error("Action failed"); }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === "users" && users.length === 0) fetchUsers();
    if (tab === "moderation" && reports.length === 0) fetchReports();
    if (tab === "blog") fetchPendingBlogPosts();
    if (tab === "engagement" && !retention) fetchRetention();
    if (tab === "leaderboards" && !leaderboards) fetchLeaderboards(leaderboardPeriod);
    if (tab === "controls" && !platform) fetchPlatform();
  };

  // ── Helpers ──────────────────────────────────────────────────────────────
  const roleBadge = (role) => {
    if (role === "admin") return <Badge className="bg-red-500/20 text-red-600 dark:text-red-400 border-red-500/30">Admin</Badge>;
    if (role === "moderator") return <Badge className="bg-blue-500/20 text-blue-600 dark:text-blue-400 border-blue-500/30">Mod</Badge>;
    return <Badge variant="outline" className="text-muted-foreground">User</Badge>;
  };

  const tierBadge = (tier) => {
    if (tier === "premium") return <Badge className="bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/30"><Crown className="h-3 w-3 mr-1" />Village+</Badge>;
    if (tier === "trial") return <Badge className="bg-green-500/20 text-green-600 dark:text-green-400 border-green-500/30">Trial</Badge>;
    return <Badge variant="outline" className="text-muted-foreground">Free</Badge>;
  };

  const fmtDate = (s) => {
    try { return formatDistanceToNow(new Date(s), { addSuffix: true }); } catch { return "—"; }
  };

  // Clickable stat card
  const StatCard = ({ label, value, icon: Icon, color = "text-primary", drilldownType, sub }) => (
    <div
      className={`bg-card rounded-2xl p-5 border border-border/40 card-elevated border-l-2 border-l-primary/20 ${drilldownType ? "cursor-pointer hover:border-primary/40 hover:shadow hover:border-l-primary/40 transition-all group" : ""}`}
      onClick={drilldownType ? () => openDrilldown(drilldownType) : undefined}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-muted-foreground">{label}</span>
        <div className="flex items-center gap-1">
          <Icon className={`h-5 w-5 ${color}`} />
          {drilldownType && <Chevron className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />}
        </div>
      </div>
      <p className="text-2xl font-bold text-foreground">{value ?? "—"}</p>
      {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
    </div>
  );

  // Retention bar
  const RetentionBar = ({ label, value, color, tooltip }) => (
    <div>
      <div className="flex justify-between items-center mb-1.5">
        <div>
          <span className="text-sm font-medium text-foreground">{label}</span>
          {tooltip && <span className="text-xs text-muted-foreground ml-2">— {tooltip}</span>}
        </div>
        <span className={`text-sm font-bold ${value >= 50 ? "text-green-500" : value >= 25 ? "text-amber-500" : "text-red-400"}`}>{value}%</span>
      </div>
      <div className="h-3 bg-muted rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${Math.max(value, 2)}%` }} />
      </div>
    </div>
  );

  // Leaderboard row
  const LeaderRow = ({ rank, user: u, count, label }) => (
    <div className="flex items-center gap-3 py-2 border-b border-border/30 last:border-0">
      <span className={`w-6 text-center text-sm font-bold ${rank === 1 ? "text-amber-500" : rank === 2 ? "text-slate-400" : rank === 3 ? "text-amber-700" : "text-muted-foreground"}`}>
        {rank <= 3 ? ["🥇","🥈","🥉"][rank-1] : rank}
      </span>
      <Avatar className="h-8 w-8 shrink-0">
        <AvatarImage src={u?.picture} />
        <AvatarFallback className="bg-primary/20 text-primary text-xs">{u?.name?.[0]?.toUpperCase() || "?"}</AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">{u?.nickname || u?.name || "Deleted"}</p>
        {u?.subscription_tier === "premium" && <span className="text-xs text-amber-500">Village+</span>}
      </div>
      <span className="text-sm font-bold text-foreground">{count}</span>
      <span className="text-xs text-muted-foreground hidden sm:block">{label}</span>
    </div>
  );

  const maxSignups = Math.max(...growth.map(d => d.signups), 1);
  const maxActivity = retention ? Math.max(...retention.daily_activity.map(d => d.active_users), 1) : 1;

  if (loading) {
    return (
      <div className="min-h-screen bg-background pb-20 lg:pb-0">
        <Navigation user={user} />
        <main className="max-w-6xl mx-auto px-4 pt-20 lg:pt-24 flex items-center justify-center py-20">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20 lg:pb-0">
      <Navigation user={user} />

      <main className="max-w-6xl mx-auto px-4 pt-20 lg:pt-24">
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">

          {/* Tab bar — scrollable on mobile */}
          <div className="overflow-x-auto pb-1 mb-6">
            <TabsList className="bg-card border border-border/50 rounded-xl p-1 flex gap-1 min-w-max">
              {[
                { value: "overview",     icon: BarChart3,      label: "Overview" },
                { value: "engagement",   icon: Activity,       label: "Engagement" },
                { value: "leaderboards", icon: Trophy,         label: "Leaderboards" },
                { value: "users",        icon: Users,          label: "Users" },
                { value: "moderation",   icon: Flag,           label: "Moderation", badge: analytics?.content?.pending_reports },
                { value: "blog",         icon: BookOpen,       label: "Blog" },
                ...(user?.role === "admin" ? [{ value: "controls", icon: Radio, label: "Controls" }] : []),
              ].map(t => (
                <TabsTrigger key={t.value} value={t.value} className="rounded-lg px-3 py-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground flex items-center gap-1.5 whitespace-nowrap text-sm">
                  <t.icon className="h-4 w-4" />
                  {t.label}
                  {t.badge > 0 && (
                    <span className="ml-1 bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 min-w-[18px] text-center leading-none">{t.badge}</span>
                  )}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          {/* ══════════ OVERVIEW TAB ══════════ */}
          <TabsContent value="overview" className="mt-0 space-y-6">

            {/* Moderation hero */}
            <div className="bg-card rounded-2xl p-6 border border-border/40 card-elevated border-l-2 border-l-primary/20 flex flex-col lg:flex-row gap-6">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/15 flex items-center justify-center shrink-0">
                    <Shield className="h-5 w-5 text-blue-500" />
                  </div>
                  <div>
                    <h1 className="font-heading text-xl font-bold text-foreground">Protect the tone of the village</h1>
                    <p className="text-sm text-muted-foreground">Every post, reply, and message shapes the community.</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-secondary/50 rounded-xl p-4 border border-border/30">
                    <div className="flex items-center gap-2 mb-1"><Heart className="h-4 w-4 text-green-500" /><span className="text-xs text-muted-foreground font-medium">Kindness health</span></div>
                    <p className="text-2xl font-bold font-heading text-foreground">{analytics?.moderation?.kindness_health ?? 100}%</p>
                  </div>
                  <div
                    className="bg-secondary/50 rounded-xl p-4 border border-border/30 cursor-pointer hover:border-primary/40 transition-colors group"
                    onClick={() => openDrilldown("unanswered")}
                  >
                    <div className="flex items-center gap-2 mb-1"><HelpCircle className="h-4 w-4 text-amber-500" /><span className="text-xs text-muted-foreground font-medium">Unanswered (24h)</span><Chevron className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 ml-auto" /></div>
                    <p className="text-2xl font-bold font-heading text-foreground">{analytics?.moderation?.unanswered_tonight ?? 0}</p>
                  </div>
                  <div
                    className="bg-secondary/50 rounded-xl p-4 border border-border/30 cursor-pointer hover:border-primary/40 transition-colors group"
                    onClick={() => openDrilldown("reported")}
                  >
                    <div className="flex items-center gap-2 mb-1"><Flag className="h-4 w-4 text-red-500" /><span className="text-xs text-muted-foreground font-medium">Pending reports</span><Chevron className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 ml-auto" /></div>
                    <p className="text-2xl font-bold font-heading text-foreground">{analytics?.moderation?.reported_issues ?? 0}</p>
                  </div>
                  <div className="bg-secondary/50 rounded-xl p-4 border border-border/30">
                    <div className="flex items-center gap-2 mb-1"><TrendingUp className="h-4 w-4 text-primary" /><span className="text-xs text-muted-foreground font-medium">New this week</span></div>
                    <p className="text-2xl font-bold font-heading text-foreground">+{analytics?.moderation?.circle_growth ?? 0}</p>
                  </div>
                </div>
              </div>
              <div className="lg:w-64 bg-secondary/30 rounded-xl p-4 border border-border/30 space-y-3">
                <h3 className="font-heading font-semibold text-foreground text-sm mb-2">Moderator principles</h3>
                {[
                  { icon: "💛", title: "Kindness-first signals", text: "Look for tone, not just content." },
                  { icon: "🔁", title: "Fast routing for unanswered posts", text: "No support post should go unanswered overnight." },
                  { icon: "🤫", title: "Visible but calm moderation", text: "Act with care — this is someone's safe space." },
                ].map((p, i) => (
                  <div key={i} className="flex items-start gap-2.5">
                    <span className="text-base shrink-0 mt-0.5">{p.icon}</span>
                    <div>
                      <p className="text-xs font-semibold text-foreground">{p.title}</p>
                      <p className="text-xs text-muted-foreground leading-relaxed">{p.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Platform stats — all clickable */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard label="Total Users" value={analytics?.users?.total} icon={Users} drilldownType="mau" sub="click to view all active" />
              <div className="bg-card rounded-2xl p-5 border border-border/40 card-elevated border-l-2 border-l-primary/20">
                <p className="text-sm text-muted-foreground mb-2">DAU / WAU / MAU</p>
                <div className="flex gap-2 items-end">
                  <button onClick={() => openDrilldown("dau")} className="text-center hover:text-primary transition-colors cursor-pointer">
                    <p className="text-xl font-bold">{analytics?.active_users?.dau || 0}</p>
                    <p className="text-xs text-muted-foreground">Day</p>
                  </button>
                  <span className="text-muted-foreground mb-1">/</span>
                  <button onClick={() => openDrilldown("wau")} className="text-center hover:text-primary transition-colors cursor-pointer">
                    <p className="text-xl font-bold">{analytics?.active_users?.wau || 0}</p>
                    <p className="text-xs text-muted-foreground">Week</p>
                  </button>
                  <span className="text-muted-foreground mb-1">/</span>
                  <button onClick={() => openDrilldown("mau")} className="text-center hover:text-primary transition-colors cursor-pointer">
                    <p className="text-xl font-bold">{analytics?.active_users?.mau || 0}</p>
                    <p className="text-xs text-muted-foreground">Month</p>
                  </button>
                </div>
                <p className="text-xs text-muted-foreground mt-2">Unique active users — click any to see who</p>
              </div>
              <StatCard label="Forum Posts" value={analytics?.content?.total_posts} icon={MessageSquare} drilldownType="posts" />
              <StatCard label="Pending Reports" value={analytics?.content?.pending_reports} icon={Flag} color="text-red-500" drilldownType="reported" />
            </div>

            {/* Subscription breakdown — clickable tiles */}
            <div className="bg-card rounded-2xl p-6 border border-border/40 card-elevated border-l-2 border-l-primary/20">
              <h3 className="font-heading font-bold text-foreground mb-4">Subscription Breakdown <span className="text-xs text-muted-foreground font-normal ml-2">click to see members</span></h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                  { type: "premium", label: "Village+", value: analytics?.users?.premium || 0, cls: "bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400" },
                  { type: "trial",   label: "Trial",    value: analytics?.users?.trial || 0,   cls: "bg-green-500/10 border-green-500/20 text-green-600 dark:text-green-400" },
                  { type: "free",    label: "Free",     value: analytics?.users?.free || 0,    cls: "bg-secondary/50 border-border/30 text-foreground" },
                  { type: "banned",  label: "Banned",   value: analytics?.users?.banned || 0,  cls: "bg-red-500/10 border-red-500/20 text-red-600 dark:text-red-400" },
                ].map(t => (
                  <div key={t.type} className={`text-center p-4 rounded-xl border cursor-pointer hover:scale-[1.02] transition-transform ${t.cls}`} onClick={() => openDrilldown(t.type)}>
                    <p className="text-2xl font-bold">{t.value}</p>
                    <p className="text-sm text-muted-foreground">{t.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* New users + Content volume — with period filter */}
            <div className="flex items-center justify-between">
              <h3 className="font-heading font-bold text-foreground">Activity Breakdown</h3>
              <TimePeriodToggle value={overviewPeriod} onChange={setOverviewPeriod} />
            </div>
            <div className="grid sm:grid-cols-2 gap-6">
              <div className="bg-card rounded-2xl p-6 border border-border/40 card-elevated">
                <h3 className="font-heading font-bold text-foreground mb-4">New Signups <span className="text-xs text-muted-foreground font-normal ml-2">click to see users</span></h3>
                <div className="space-y-3">
                  {[
                    { label: "Today",      value: analytics?.users?.new_today || 0,      type: "new_today" },
                    { label: "This Week",  value: analytics?.users?.new_this_week || 0,  type: "new_week" },
                    { label: "This Month", value: analytics?.users?.new_this_month || 0, type: "new_month" },
                  ].map(r => (
                    <div key={r.type} className="flex items-center justify-between cursor-pointer hover:text-primary transition-colors group" onClick={() => openDrilldown(r.type)}>
                      <span className="text-muted-foreground">{r.label}</span>
                      <div className="flex items-center gap-1">
                        <span className="font-bold text-foreground group-hover:text-primary">{r.value}</span>
                        <Chevron className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-card rounded-2xl p-6 border border-border/40 card-elevated">
                <h3 className="font-heading font-bold text-foreground mb-4">Content Volume <span className="text-xs text-muted-foreground font-normal ml-2">click to inspect</span></h3>
                <div className="space-y-3">
                  {[
                    { label: "Forum Posts",    value: analytics?.content?.total_posts || 0,         type: "posts" },
                    { label: "Replies",        value: analytics?.content?.total_replies || 0,        type: "replies" },
                    { label: "Chat Messages",  value: analytics?.content?.total_chat_messages || 0,  type: "chat_messages" },
                    { label: "Direct Messages",value: analytics?.content?.total_dms || 0,            type: "dms" },
                  ].map(r => (
                    <div key={r.type} className="flex items-center justify-between cursor-pointer hover:text-primary transition-colors group" onClick={() => openDrilldown(r.type)}>
                      <span className="text-muted-foreground">{r.label}</span>
                      <div className="flex items-center gap-1">
                        <span className="font-bold text-foreground group-hover:text-primary">{r.value}</span>
                        <Chevron className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* User growth chart — 30 days */}
            <div className="bg-card rounded-2xl p-6 border border-border/40 card-elevated border-l-2 border-l-primary/20">
              <h3 className="font-heading font-bold text-foreground mb-4">Signup Growth (30 days)</h3>
              <div className="space-y-1.5">
                {growth.slice(-14).map(day => (
                  <div key={day.date} className="flex items-center gap-3 text-sm">
                    <span className="w-12 text-muted-foreground font-mono text-xs shrink-0">{day.date.slice(5)}</span>
                    <div className="flex-1 bg-muted rounded-full h-5">
                      <div className="bg-primary rounded-full h-5 flex items-center justify-end px-2 text-xs text-primary-foreground font-medium transition-all"
                        style={{ width: `${Math.max((day.signups / maxSignups) * 100, day.signups > 0 ? 10 : 0)}%` }}>
                        {day.signups > 0 ? day.signups : ""}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Top forum categories */}
            {analytics?.categories?.length > 0 && (
              <div className="bg-card rounded-2xl p-6 border border-border/40 card-elevated border-l-2 border-l-primary/20">
                <h3 className="font-heading font-bold text-foreground mb-4">Forum Categories by Activity</h3>
                <div className="space-y-2">
                  {analytics.categories.slice(0, 10).map(cat => {
                    const max = analytics.categories[0]?.post_count || 1;
                    return (
                      <div key={cat.category_id} className="flex items-center gap-3">
                        <span className="text-xl w-8 shrink-0">{cat.icon}</span>
                        <span className="w-40 text-sm text-foreground truncate shrink-0">{cat.name}</span>
                        <div className="flex-1 bg-muted rounded-full h-4">
                          <div className="bg-primary/60 rounded-full h-4" style={{ width: `${Math.max((cat.post_count / max) * 100, cat.post_count > 0 ? 5 : 0)}%` }} />
                        </div>
                        <span className="text-xs text-muted-foreground w-16 text-right shrink-0">{cat.post_count || 0} posts</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </TabsContent>

          {/* ══════════ ENGAGEMENT TAB ══════════ */}
          <TabsContent value="engagement" className="mt-0 space-y-6">

            {/* What DAU/WAU/MAU means */}
            <div className="bg-card rounded-2xl p-6 border border-border/40 card-elevated border-l-2 border-l-primary/20">
              <h3 className="font-heading font-bold text-foreground mb-4">Active User Metrics</h3>
              <p className="text-sm text-muted-foreground mb-4">These measure how many unique users performed <em>any</em> action (post, reply, message) in each time window. Click a number to see who they are.</p>
              <div className="grid grid-cols-3 gap-4">
                {[
                  { abbr: "DAU", full: "Daily Active Users", desc: "Unique users active today", value: retention?.counts?.dau ?? analytics?.active_users?.dau ?? 0, type: "dau", color: "bg-blue-500/10 border-blue-500/20 text-blue-600" },
                  { abbr: "WAU", full: "Weekly Active Users", desc: "Unique users active in last 7 days", value: retention?.counts?.wau ?? analytics?.active_users?.wau ?? 0, type: "wau", color: "bg-primary/10 border-primary/20 text-primary" },
                  { abbr: "MAU", full: "Monthly Active Users", desc: "Unique users active in last 30 days", value: retention?.counts?.mau ?? analytics?.active_users?.mau ?? 0, type: "mau", color: "bg-amber-500/10 border-amber-500/20 text-amber-600" },
                ].map(m => (
                  <div key={m.type} className={`rounded-xl p-4 border cursor-pointer hover:scale-[1.02] transition-transform ${m.color}`} onClick={() => openDrilldown(m.type)}>
                    <p className="text-3xl font-bold">{m.value}</p>
                    <p className="text-base font-semibold mt-1">{m.abbr}</p>
                    <p className="text-xs opacity-70 mt-0.5">{m.full}</p>
                    <p className="text-xs opacity-60 mt-1">{m.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Retention rates */}
            {!retention ? (
              <div className="text-center py-8 text-muted-foreground">
                <RefreshCw className="h-8 w-8 mx-auto mb-2 animate-spin" />
                Loading retention data...
              </div>
            ) : (
              <>
                <div className="bg-card rounded-2xl p-6 border border-border/40 card-elevated border-l-2 border-l-primary/20">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-heading font-bold text-foreground">Retention Rates</h3>
                    <button onClick={fetchRetention} className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"><RefreshCw className="h-3 w-3" />Refresh</button>
                  </div>
                  <p className="text-sm text-muted-foreground mb-5">% of users from the prior period who came back in the current period.</p>
                  <div className="space-y-5">
                    <RetentionBar
                      label="Daily Retention"
                      value={retention.daily_retention}
                      color="bg-blue-500"
                      tooltip="Yesterday's actives who are also active today"
                    />
                    <RetentionBar
                      label="Weekly Retention"
                      value={retention.weekly_retention}
                      color="bg-primary"
                      tooltip="Last week's actives who came back this week"
                    />
                    <RetentionBar
                      label="Monthly Retention"
                      value={retention.monthly_retention}
                      color="bg-amber-500"
                      tooltip="Last month's actives who came back this month"
                    />
                  </div>
                  <div className="mt-5 pt-4 border-t border-border/30">
                    <p className="text-xs text-muted-foreground">
                      <strong>Benchmark:</strong> Good SaaS apps aim for 40%+ weekly, 25%+ monthly. Early-stage communities are typically 15–30%.
                    </p>
                  </div>
                </div>

                {/* Daily activity chart — 30 days */}
                <div className="bg-card rounded-2xl p-6 border border-border/40 card-elevated border-l-2 border-l-primary/20">
                  <h3 className="font-heading font-bold text-foreground mb-4">Daily Active Users (30 days)</h3>
                  <div className="space-y-1.5">
                    {retention.daily_activity.slice(-14).map(day => (
                      <div key={day.date} className="flex items-center gap-3 text-sm">
                        <span className="w-12 text-muted-foreground font-mono text-xs shrink-0">{day.date.slice(5)}</span>
                        <div className="flex-1 bg-muted rounded-full h-5">
                          <div className="bg-primary/70 rounded-full h-5 flex items-center justify-end px-2 text-xs text-primary-foreground font-medium transition-all"
                            style={{ width: `${Math.max((day.active_users / maxActivity) * 100, day.active_users > 0 ? 8 : 0)}%` }}>
                            {day.active_users > 0 ? day.active_users : ""}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </TabsContent>

          {/* ══════════ LEADERBOARDS TAB ══════════ */}
          <TabsContent value="leaderboards" className="mt-0 space-y-6">
            {/* Period toggle */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-heading font-bold text-foreground">Leaderboards</h2>
                <p className="text-xs text-muted-foreground mt-0.5">Filter by time period to see who's most active</p>
              </div>
              <div className="flex items-center gap-2">
                <TimePeriodToggle
                  value={leaderboardPeriod}
                  onChange={(p) => {
                    setLeaderboardPeriod(p);
                    setLeaderboards(null);
                    fetchLeaderboards(p);
                  }}
                />
                <button
                  onClick={() => { setLeaderboards(null); fetchLeaderboards(leaderboardPeriod); }}
                  className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                  title="Refresh"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {!leaderboards ? (
              <div className="text-center py-12 text-muted-foreground">
                <RefreshCw className="h-8 w-8 mx-auto mb-2 animate-spin" />
                Building leaderboards...
              </div>
            ) : (
              <>
                <div className="grid sm:grid-cols-2 gap-6">
                  {/* Top Posters */}
                  <div className="bg-card rounded-2xl p-6 border border-border/40 card-elevated border-l-2 border-l-primary/20">
                    <div className="flex items-center gap-2 mb-4">
                      <MessageSquare className="h-5 w-5 text-primary" />
                      <h3 className="font-heading font-bold text-foreground">Top Support Space Posters</h3>
                    </div>
                    {leaderboards.top_posters.length === 0
                      ? <p className="text-sm text-muted-foreground">No posts yet.</p>
                      : leaderboards.top_posters.map((item, i) => (
                          <LeaderRow key={i} rank={i + 1} user={item.user} count={item.count} label="posts" />
                        ))
                    }
                  </div>

                  {/* Top Repliers */}
                  <div className="bg-card rounded-2xl p-6 border border-border/40 card-elevated border-l-2 border-l-primary/20">
                    <div className="flex items-center gap-2 mb-4">
                      <Repeat2 className="h-5 w-5 text-primary" />
                      <h3 className="font-heading font-bold text-foreground">Most Thread Replies</h3>
                    </div>
                    {leaderboards.top_repliers.length === 0
                      ? <p className="text-sm text-muted-foreground">No replies yet.</p>
                      : leaderboards.top_repliers.map((item, i) => (
                          <LeaderRow key={i} rank={i + 1} user={item.user} count={item.count} label="replies" />
                        ))
                    }
                  </div>

                  {/* Top Chatters */}
                  <div className="bg-card rounded-2xl p-6 border border-border/40 card-elevated border-l-2 border-l-primary/20">
                    <div className="flex items-center gap-2 mb-4">
                      <MessageCircle className="h-5 w-5 text-primary" />
                      <h3 className="font-heading font-bold text-foreground">Most Chat Messages</h3>
                    </div>
                    {leaderboards.top_chatters.length === 0
                      ? <p className="text-sm text-muted-foreground">No chat messages yet.</p>
                      : leaderboards.top_chatters.map((item, i) => (
                          <LeaderRow key={i} rank={i + 1} user={item.user} count={item.count} label="messages" />
                        ))
                    }
                  </div>

                  {/* Top Community Creators */}
                  <div className="bg-card rounded-2xl p-6 border border-border/40 card-elevated border-l-2 border-l-primary/20">
                    <div className="flex items-center gap-2 mb-4">
                      <Users className="h-5 w-5 text-primary" />
                      <h3 className="font-heading font-bold text-foreground">Most Communities Created</h3>
                    </div>
                    {leaderboards.top_community_creators.length === 0
                      ? <p className="text-sm text-muted-foreground">No communities yet.</p>
                      : leaderboards.top_community_creators.map((item, i) => (
                          <LeaderRow key={i} rank={i + 1} user={item.user} count={item.count} label="communities" />
                        ))
                    }
                  </div>
                </div>

                {/* Most liked & replied posts */}
                <div className="grid sm:grid-cols-2 gap-6">
                  <div className="bg-card rounded-2xl p-6 border border-border/40 card-elevated border-l-2 border-l-primary/20">
                    <div className="flex items-center gap-2 mb-4">
                      <Heart className="h-5 w-5 text-red-500" />
                      <h3 className="font-heading font-bold text-foreground">Most Liked Posts</h3>
                    </div>
                    {leaderboards.top_liked_posts.length === 0
                      ? <p className="text-sm text-muted-foreground">No likes yet.</p>
                      : leaderboards.top_liked_posts.map((post, i) => (
                          <div key={post.post_id} className="flex items-start gap-2 py-2 border-b border-border/30 last:border-0">
                            <span className="text-sm text-muted-foreground w-5 shrink-0">{i + 1}.</span>
                            <div className="flex-1 min-w-0">
                              <Link to={`/forums/post/${post.post_id}`} className="text-sm font-medium text-foreground hover:text-primary line-clamp-1">{post.title}</Link>
                              <p className="text-xs text-muted-foreground">by {post.author_name} · {fmtDate(post.created_at)}</p>
                            </div>
                            <div className="flex items-center gap-1 shrink-0 text-red-500">
                              <Heart className="h-3.5 w-3.5" />
                              <span className="text-sm font-bold">{post.like_count}</span>
                            </div>
                          </div>
                        ))
                    }
                  </div>

                  <div className="bg-card rounded-2xl p-6 border border-border/40 card-elevated border-l-2 border-l-primary/20">
                    <div className="flex items-center gap-2 mb-4">
                      <MessageSquare className="h-5 w-5 text-primary" />
                      <h3 className="font-heading font-bold text-foreground">Most Replied Posts</h3>
                    </div>
                    {leaderboards.top_replied_posts.length === 0
                      ? <p className="text-sm text-muted-foreground">No replies yet.</p>
                      : leaderboards.top_replied_posts.map((post, i) => (
                          <div key={post.post_id} className="flex items-start gap-2 py-2 border-b border-border/30 last:border-0">
                            <span className="text-sm text-muted-foreground w-5 shrink-0">{i + 1}.</span>
                            <div className="flex-1 min-w-0">
                              <Link to={`/forums/post/${post.post_id}`} className="text-sm font-medium text-foreground hover:text-primary line-clamp-1">{post.title}</Link>
                              <p className="text-xs text-muted-foreground">by {post.author_name} · {fmtDate(post.created_at)}</p>
                            </div>
                            <div className="flex items-center gap-1 shrink-0 text-primary">
                              <MessageSquare className="h-3.5 w-3.5" />
                              <span className="text-sm font-bold">{post.reply_count}</span>
                            </div>
                          </div>
                        ))
                    }
                  </div>
                </div>

              </>
            )}
          </TabsContent>

          {/* ══════════ USERS TAB ══════════ */}
          <TabsContent value="users" className="mt-0 space-y-4">
            <div className="flex gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input value={userSearch} onChange={(e) => setUserSearch(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && fetchUsers(1, userSearch)}
                  placeholder="Search by name or email..." className="pl-10 rounded-xl" />
              </div>
              <Button onClick={() => { setUserFilter(""); fetchUsers(1, userSearch, ""); }} className="rounded-xl">Search</Button>
            </div>

            <div className="flex gap-2 flex-wrap">
              {[
                { label: "All", value: "" },
                { label: "Auto-suspended", value: "auto_suspended" },
                { label: "Banned", value: "banned" },
              ].map(f => (
                <Button key={f.value} size="sm" variant={userFilter === f.value ? "default" : "outline"} className="rounded-full text-xs h-7"
                  onClick={() => { setUserFilter(f.value); fetchUsers(1, userSearch, f.value); }}>{f.label}</Button>
              ))}
            </div>

            <p className="text-sm text-muted-foreground">{userTotal} users total</p>

            <div className="space-y-3">
              {users.map(u => (
                <div key={u.user_id} className="bg-card rounded-2xl p-4 border border-border/40 card-elevated border-l-2 border-l-primary/20 hover:shadow hover:border-l-primary/40 transition-all flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <Avatar className="h-10 w-10 shrink-0">
                      <AvatarImage src={u.picture} />
                      <AvatarFallback className="bg-primary/20 text-primary">{u.name?.[0]?.toUpperCase() || "?"}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="font-bold text-foreground">{u.nickname || u.name}</span>
                        {roleBadge(u.role)}
                        {tierBadge(u.subscription_tier)}
                        {u.is_banned && u.auto_suspended && <Badge className="bg-orange-500/20 text-orange-600 border-orange-500/30"><Ban className="h-3 w-3 mr-1" />Auto-suspended</Badge>}
                        {u.is_banned && !u.auto_suspended && <Badge className="bg-red-500/20 text-red-600 border-red-500/30"><Ban className="h-3 w-3 mr-1" />Banned</Badge>}
                      </div>
                      <p className="text-sm text-muted-foreground truncate">{u.email}</p>
                      <p className="text-xs text-muted-foreground">Joined {fmtDate(u.created_at)}{u.state ? ` · ${u.state}` : ""}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Select value={u.role || "user"} onValueChange={(role) => handleUserAction(u.user_id, "role", { role })}>
                      <SelectTrigger className="w-[110px] h-8 rounded-lg text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="user">User</SelectItem>
                        <SelectItem value="moderator">Moderator</SelectItem>
                        {user?.role === "admin" && <SelectItem value="admin">Admin</SelectItem>}
                      </SelectContent>
                    </Select>
                    <Select value={u.subscription_tier || "free"} onValueChange={(tier) => handleUserAction(u.user_id, "subscription", { tier })}>
                      <SelectTrigger className="w-[110px] h-8 rounded-lg text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="free">Free</SelectItem>
                        <SelectItem value="trial">Trial</SelectItem>
                        <SelectItem value="premium">Village+</SelectItem>
                      </SelectContent>
                    </Select>
                    {u.role !== "admin" && (
                      u.is_banned ? (
                        <Button size="sm" variant="outline" className="h-8 rounded-lg text-xs" onClick={() => handleUserAction(u.user_id, "unban")}>Unban</Button>
                      ) : (
                        <Button size="sm" variant="outline" className="h-8 rounded-lg text-xs text-red-600 border-red-500/30 hover:bg-red-500/10" onClick={() => handleUserAction(u.user_id, "ban", { reason: "Admin action" })}>
                          <Ban className="h-3 w-3 mr-1" />Ban
                        </Button>
                      )
                    )}
                  </div>
                </div>
              ))}
            </div>

            {userPages > 1 && (
              <div className="flex items-center justify-center gap-4 pt-4">
                <Button variant="outline" size="sm" disabled={userPage <= 1} onClick={() => fetchUsers(userPage - 1, userSearch)} className="rounded-lg"><ChevronLeft className="h-4 w-4" /></Button>
                <span className="text-sm text-muted-foreground">Page {userPage} of {userPages}</span>
                <Button variant="outline" size="sm" disabled={userPage >= userPages} onClick={() => fetchUsers(userPage + 1, userSearch)} className="rounded-lg"><ChevronRight className="h-4 w-4" /></Button>
              </div>
            )}
          </TabsContent>

          {/* ══════════ MODERATION TAB ══════════ */}
          <TabsContent value="moderation" className="mt-0 space-y-4">
            <div className="flex gap-2 flex-wrap">
              {[
                { value: "pending",   label: "Pending",   cls: "border-amber-500/30 data-active:bg-amber-500" },
                { value: "resolved",  label: "Resolved" },
                { value: "dismissed", label: "Dismissed" },
              ].map(s => (
                <Button
                  key={s.value}
                  variant={reportStatus === s.value ? "default" : "outline"}
                  size="sm"
                  className="rounded-full"
                  onClick={() => { setReportStatus(s.value); fetchReports(s.value, 1); }}
                >
                  {s.label}
                  {s.value === "pending" && (analytics?.content?.pending_reports > 0) && (
                    <span className="ml-1.5 bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 min-w-[18px] text-center leading-none">
                      {analytics.content.pending_reports}
                    </span>
                  )}
                </Button>
              ))}
            </div>

            {reports.length === 0 ? (
              <div className="text-center py-12 bg-card rounded-2xl border border-border/40 card-elevated">
                <Flag className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                <h3 className="font-heading text-lg font-bold text-foreground mb-1">No {reportStatus} reports</h3>
                <p className="text-sm text-muted-foreground">{reportStatus === "pending" ? "All clear! The village is calm." : `No ${reportStatus} reports to show.`}</p>
              </div>
            ) : (
              <div className="space-y-4">
                {reports.map(report => (
                  <div
                    key={report.report_id}
                    className={`bg-card rounded-2xl p-5 border border-border/40 card-elevated border-l-2 transition-all ${
                      reportStatus === "pending"   ? "border-l-amber-500/50" :
                      reportStatus === "resolved"  ? "border-l-green-500/40" :
                      "border-l-muted"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <p className="text-sm font-medium text-foreground">
                            {report.content_type === "post" ? "Reported Post" : "Reported Reply"}
                          </p>
                          {reportStatus !== "pending" && (
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                              reportStatus === "resolved"
                                ? "bg-green-500/15 text-green-600 dark:text-green-400"
                                : "bg-secondary text-muted-foreground"
                            }`}>
                              {reportStatus === "resolved" ? "✓ Resolved" : "Dismissed"}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Reported by {report.reporter?.nickname || report.reporter?.name || "Unknown"} · {report.reason || "No reason given"}
                        </p>
                        {report.created_at && (
                          <p className="text-xs text-muted-foreground">{fmtDate(report.created_at)}</p>
                        )}
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="rounded-lg shrink-0"
                        onClick={() => setSelectedReport(report)}
                      >
                        <Eye className="h-3 w-3 mr-1" />View
                      </Button>
                    </div>
                    {report.content && (
                      <div className="bg-secondary/50 rounded-xl p-4 mb-3">
                        {report.content.title && (
                          <p className="font-medium text-foreground mb-1 line-clamp-1">{report.content.title}</p>
                        )}
                        <p className="text-sm text-muted-foreground line-clamp-3 whitespace-pre-wrap">{report.content.content}</p>
                        <p className="text-xs text-muted-foreground mt-2">By: {report.content.author_name || "Unknown"}</p>
                      </div>
                    )}
                    {reportStatus === "pending" && (
                      <div className="flex gap-2 flex-wrap">
                        <Button size="sm" variant="outline" className="rounded-lg" onClick={() => handleReportAction(report.report_id, "dismiss")}>Dismiss</Button>
                        <Button size="sm" variant="outline" className="rounded-lg text-red-600 border-red-500/30" onClick={() => handleReportAction(report.report_id, "remove_content")}>Remove Content</Button>
                        <Button size="sm" className="rounded-lg bg-red-600 hover:bg-red-700 text-white" onClick={() => handleReportAction(report.report_id, "ban_user")}>
                          <Ban className="h-3 w-3 mr-1" />Ban User
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {reportPages > 1 && (
              <div className="flex items-center justify-center gap-4 pt-4">
                <Button variant="outline" size="sm" disabled={reportPage <= 1} onClick={() => fetchReports(reportStatus, reportPage - 1)} className="rounded-lg"><ChevronLeft className="h-4 w-4" /></Button>
                <span className="text-sm text-muted-foreground">Page {reportPage} of {reportPages}</span>
                <Button variant="outline" size="sm" disabled={reportPage >= reportPages} onClick={() => fetchReports(reportStatus, reportPage + 1)} className="rounded-lg"><ChevronRight className="h-4 w-4" /></Button>
              </div>
            )}
          </TabsContent>

          {/* ══════════ BLOG TAB ══════════ */}
          <TabsContent value="blog" className="mt-0 space-y-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="font-heading font-bold text-foreground text-lg">Blog Queue</h2>
              <Button variant="outline" size="sm" className="rounded-lg" onClick={fetchPendingBlogPosts}>Refresh</Button>
            </div>
            {pendingBlogPosts.length === 0 ? (
              <div className="text-center py-12 bg-card rounded-2xl border border-border/40 card-elevated">
                <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                <h3 className="font-heading text-lg font-bold text-foreground mb-1">No posts pending review</h3>
                <p className="text-sm text-muted-foreground">Community submissions will appear here.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {pendingBlogPosts.map(post => (
                  <div key={post.blog_id} className="bg-card rounded-2xl p-5 border border-border/40 card-elevated border-l-2 border-l-primary/20">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <h3 className="font-heading font-semibold text-foreground leading-snug">{post.title}</h3>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 font-medium shrink-0">Pending</span>
                    </div>
                    {post.summary && <p className="text-sm text-muted-foreground line-clamp-2 mb-2">{post.summary}</p>}
                    <p className="text-xs text-muted-foreground mb-3">By {post.author_name || "Unknown"} · {fmtDate(post.created_at)}</p>
                    <div className="flex gap-2">
                      <Button size="sm" className="rounded-lg bg-green-600 hover:bg-green-700 text-white" onClick={() => handleBlogAction(post.blog_id, "approve")}><Check className="h-3 w-3 mr-1" />Approve</Button>
                      <Button size="sm" variant="outline" className="rounded-lg text-red-600 border-red-500/30 hover:bg-red-500/10" onClick={() => handleBlogAction(post.blog_id, "reject")}><X className="h-3 w-3 mr-1" />Reject</Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
          {/* ══════════ CONTROLS TAB ══════════ */}
          <TabsContent value="controls" className="mt-0 space-y-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
                <Radio className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h1 className="font-heading text-xl font-bold text-foreground">Remote Control</h1>
                <p className="text-sm text-muted-foreground">Manage platform-wide settings in real time.</p>
              </div>
            </div>

            {!platform ? (
              <div className="flex items-center justify-center py-20">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <>
                {/* ── Announcement Banner ── */}
                <div className="bg-card rounded-2xl p-6 border border-border/40 card-elevated border-l-2 border-l-primary/20 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Megaphone className="h-5 w-5 text-primary" />
                      <h2 className="font-heading font-bold text-foreground">Platform Announcement</h2>
                    </div>
                    <button
                      onClick={() => savePlatform({ announcement_enabled: !platform.announcement_enabled })}
                      className="flex items-center gap-2 text-sm font-medium transition-colors"
                      disabled={platformSaving}
                    >
                      {platform.announcement_enabled
                        ? <ToggleRight className="h-7 w-7 text-primary" />
                        : <ToggleLeft className="h-7 w-7 text-muted-foreground" />}
                      <span className={platform.announcement_enabled ? "text-primary" : "text-muted-foreground"}>
                        {platform.announcement_enabled ? "Live" : "Hidden"}
                      </span>
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground">This banner appears at the top of every page for all logged-in users.</p>

                  <div className="flex gap-2 flex-wrap">
                    {["info", "warning", "success"].map(t => (
                      <button
                        key={t}
                        onClick={() => savePlatform({ announcement_type: t })}
                        className={`px-3 py-1 rounded-full text-xs font-medium capitalize transition-colors ${
                          platform.announcement_type === t
                            ? t === "info" ? "bg-blue-500/20 text-blue-400 border border-blue-500/40"
                              : t === "warning" ? "bg-amber-500/20 text-amber-400 border border-amber-500/40"
                              : "bg-green-500/20 text-green-400 border border-green-500/40"
                            : "bg-secondary text-muted-foreground border border-border/40"
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>

                  <textarea
                    className="w-full bg-secondary/60 border border-border/40 rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-1 focus:ring-primary/50"
                    rows={3}
                    placeholder="Announcement text shown to all users..."
                    value={platform.announcement_text || ""}
                    onChange={e => setPlatform(p => ({ ...p, announcement_text: e.target.value }))}
                  />
                  <Button
                    size="sm"
                    className="rounded-xl"
                    disabled={platformSaving}
                    onClick={() => savePlatform({ announcement_text: platform.announcement_text, announcement_type: platform.announcement_type })}
                  >
                    Save Announcement
                  </Button>
                </div>

                {/* ── Maintenance Mode ── */}
                <div className="bg-card rounded-2xl p-6 border border-border/40 card-elevated border-l-2 border-l-amber-500/30 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-amber-500" />
                      <h2 className="font-heading font-bold text-foreground">Maintenance Mode</h2>
                    </div>
                    <button
                      onClick={() => savePlatform({ maintenance_mode: !platform.maintenance_mode })}
                      className="flex items-center gap-2 text-sm font-medium transition-colors"
                      disabled={platformSaving}
                    >
                      {platform.maintenance_mode
                        ? <ToggleRight className="h-7 w-7 text-amber-500" />
                        : <ToggleLeft className="h-7 w-7 text-muted-foreground" />}
                      <span className={platform.maintenance_mode ? "text-amber-500" : "text-muted-foreground"}>
                        {platform.maintenance_mode ? "Active" : "Off"}
                      </span>
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground">When active, non-admin users see the maintenance message instead of the app.</p>
                  <textarea
                    className="w-full bg-secondary/60 border border-border/40 rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-1 focus:ring-primary/50"
                    rows={2}
                    placeholder="Maintenance message..."
                    value={platform.maintenance_message || ""}
                    onChange={e => setPlatform(p => ({ ...p, maintenance_message: e.target.value }))}
                  />
                  <Button
                    size="sm"
                    className="rounded-xl"
                    disabled={platformSaving}
                    onClick={() => savePlatform({ maintenance_message: platform.maintenance_message })}
                  >
                    Save Message
                  </Button>
                </div>

                {/* ── Freemium Limits ── */}
                <div className="bg-card rounded-2xl p-6 border border-border/40 card-elevated border-l-2 border-l-primary/20 space-y-5">
                  <div className="flex items-center gap-2 mb-1">
                    <Sliders className="h-5 w-5 text-primary" />
                    <h2 className="font-heading font-bold text-foreground">Freemium Limits</h2>
                  </div>
                  <p className="text-xs text-muted-foreground">Adjust the usage caps for free-tier users. Changes take effect immediately.</p>

                  {[
                    { label: "Monthly post limit (free)", key: "monthly_post_limit_free", min: 1, max: 50 },
                    { label: "Daily reply limit (free)", key: "daily_reply_limit_free", min: 1, max: 100 },
                    { label: "Daily chat limit (free)", key: "daily_chat_limit_free", min: 1, max: 100 },
                  ].map(({ label, key, min, max }) => (
                    <div key={key} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-foreground font-medium">{label}</span>
                        <span className="font-bold text-primary w-8 text-right">{platform[key] ?? "—"}</span>
                      </div>
                      <input
                        type="range"
                        min={min}
                        max={max}
                        value={platform[key] ?? min}
                        onChange={e => setPlatform(p => ({ ...p, [key]: Number(e.target.value) }))}
                        className="w-full accent-primary"
                      />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{min}</span><span>{max}</span>
                      </div>
                    </div>
                  ))}

                  <Button
                    size="sm"
                    className="rounded-xl"
                    disabled={platformSaving}
                    onClick={() => savePlatform({
                      monthly_post_limit_free: platform.monthly_post_limit_free,
                      daily_reply_limit_free: platform.daily_reply_limit_free,
                      daily_chat_limit_free: platform.daily_chat_limit_free,
                    })}
                  >
                    Save Limits
                  </Button>
                </div>

                {/* ── Broadcast Notification ── */}
                <div className="bg-card rounded-2xl p-6 border border-border/40 card-elevated border-l-2 border-l-primary/20 space-y-4">
                  <div className="flex items-center gap-2 mb-1">
                    <BellRing className="h-5 w-5 text-primary" />
                    <h2 className="font-heading font-bold text-foreground">Broadcast Notification</h2>
                  </div>
                  <p className="text-xs text-muted-foreground">Send an in-app notification to every non-banned user immediately.</p>
                  <textarea
                    className="w-full bg-secondary/60 border border-border/40 rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-1 focus:ring-primary/50"
                    rows={3}
                    placeholder="Write your message to all users..."
                    value={broadcastMsg}
                    onChange={e => setBroadcastMsg(e.target.value)}
                  />
                  <Button
                    size="sm"
                    className="rounded-xl"
                    disabled={broadcastSending || !broadcastMsg.trim()}
                    onClick={sendBroadcast}
                  >
                    {broadcastSending ? "Sending..." : "Send to All Users"}
                  </Button>
                </div>
              </>
            )}
          </TabsContent>

        </Tabs>
      </main>

      {/* ══════════ REPORT DETAIL MODAL ══════════ */}
      <Dialog open={!!selectedReport} onOpenChange={o => !o && setSelectedReport(null)}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-heading flex items-center gap-2">
              <Flag className="h-4 w-4 text-red-500" />
              Report Details
              {selectedReport && (
                <span className={`ml-2 text-xs px-2 py-0.5 rounded-full font-medium ${
                  reportStatus === "pending"   ? "bg-amber-500/15 text-amber-600" :
                  reportStatus === "resolved"  ? "bg-green-500/15 text-green-600 dark:text-green-400" :
                  "bg-secondary text-muted-foreground"
                }`}>
                  {reportStatus === "pending" ? "Pending review" : reportStatus === "resolved" ? "Resolved" : "Dismissed"}
                </span>
              )}
            </DialogTitle>
          </DialogHeader>
          {selectedReport && (
            <div className="space-y-4 mt-2">
              {/* Report metadata */}
              <div className="bg-secondary/40 rounded-xl p-4 border border-border/30 space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Content type</span>
                  <span className="font-medium text-foreground capitalize">{selectedReport.content_type || "—"}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Reason</span>
                  <span className="font-medium text-foreground">{selectedReport.reason || "Not specified"}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Reported by</span>
                  <span className="font-medium text-foreground">
                    {selectedReport.reporter?.nickname || selectedReport.reporter?.name || "Unknown"}
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Reported</span>
                  <span className="font-medium text-foreground">{fmtDate(selectedReport.created_at)}</span>
                </div>
                {selectedReport.resolved_at && (
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Resolved</span>
                    <span className="font-medium text-foreground">{fmtDate(selectedReport.resolved_at)}</span>
                  </div>
                )}
                {selectedReport.resolved_by && (
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Action taken by</span>
                    <span className="font-medium text-foreground">{selectedReport.resolved_by}</span>
                  </div>
                )}
              </div>

              {/* Reported content */}
              {selectedReport.content && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Reported content</p>
                  <div className="bg-secondary/50 rounded-xl p-4 border border-border/30 space-y-2">
                    {selectedReport.content.title && (
                      <p className="font-semibold text-foreground">{selectedReport.content.title}</p>
                    )}
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                      {selectedReport.content.content}
                    </p>
                    <div className="pt-2 border-t border-border/30 flex items-center justify-between text-xs text-muted-foreground">
                      <span>By: {selectedReport.content.author_name || "Unknown"}</span>
                      {selectedReport.content.post_id && (
                        <Link
                          to={`/forums/post/${selectedReport.content.post_id}`}
                          className="text-primary hover:underline"
                          onClick={() => setSelectedReport(null)}
                        >
                          View post →
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Actions for pending reports */}
              {reportStatus === "pending" && (
                <div className="flex gap-2 flex-wrap pt-2 border-t border-border/30">
                  <Button
                    size="sm"
                    variant="outline"
                    className="rounded-lg"
                    onClick={() => { handleReportAction(selectedReport.report_id, "dismiss"); setSelectedReport(null); }}
                  >
                    Dismiss
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="rounded-lg text-red-600 border-red-500/30"
                    onClick={() => { handleReportAction(selectedReport.report_id, "remove_content"); setSelectedReport(null); }}
                  >
                    Remove Content
                  </Button>
                  <Button
                    size="sm"
                    className="rounded-lg bg-red-600 hover:bg-red-700 text-white"
                    onClick={() => { handleReportAction(selectedReport.report_id, "ban_user"); setSelectedReport(null); }}
                  >
                    <Ban className="h-3 w-3 mr-1" />Ban User
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ══════════ DRILLDOWN MODAL ══════════ */}
      <Dialog open={drilldown.open} onOpenChange={(o) => !o && setDrilldown(d => ({ ...d, open: false }))}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-heading">{drilldown.label}</DialogTitle>
          </DialogHeader>

          {drilldownLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div className="space-y-2 mt-2">

              {/* Users list */}
              {drilldown.users.length > 0 && drilldown.users.map(u => (
                <div key={u.user_id} className="flex items-center gap-3 p-3 rounded-xl bg-secondary/40 border border-border/30">
                  <Avatar className="h-9 w-9 shrink-0">
                    <AvatarImage src={u.picture} />
                    <AvatarFallback className="bg-primary/20 text-primary text-sm">{u.name?.[0]?.toUpperCase() || "?"}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-foreground text-sm">{u.nickname || u.name}</span>
                      {roleBadge(u.role)}
                      {tierBadge(u.subscription_tier)}
                      {u.is_banned && <Badge className="bg-red-500/20 text-red-600 border-red-500/30 text-xs"><Ban className="h-3 w-3 mr-1" />Banned</Badge>}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                    <p className="text-xs text-muted-foreground">Joined {fmtDate(u.created_at)}{u.state ? ` · ${u.state}` : ""}</p>
                  </div>
                </div>
              ))}

              {/* Posts list */}
              {drilldown.posts.length > 0 && drilldown.posts.map(p => (
                <div key={p.post_id || p.report_id} className="p-3 rounded-xl bg-secondary/40 border border-border/30">
                  {p.title && (
                    <Link to={p.post_id ? `/forums/post/${p.post_id}` : "#"} className="font-medium text-foreground text-sm hover:text-primary line-clamp-1">{p.title}</Link>
                  )}
                  {p.content && <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{p.content}</p>}
                  <p className="text-xs text-muted-foreground mt-1">
                    {p.author_name || p.reporter_id || "Unknown"} · {fmtDate(p.created_at)} · {p.reply_count ?? 0} replies · {p.like_count ?? 0} likes
                  </p>
                </div>
              ))}

              {/* Generic items list */}
              {drilldown.items.length > 0 && drilldown.items.map((item, i) => (
                <div key={item.message_id || item.report_id || i} className="p-3 rounded-xl bg-secondary/40 border border-border/30">
                  <p className="text-sm text-foreground line-clamp-2">{item.content || item.reason || JSON.stringify(item).slice(0, 100)}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {item.author_name || item.reporter_id || "—"} · {fmtDate(item.created_at)}
                  </p>
                </div>
              ))}

              {drilldown.users.length === 0 && drilldown.posts.length === 0 && drilldown.items.length === 0 && (
                <p className="text-center text-muted-foreground py-8 text-sm">No data to show.</p>
              )}

              <p className="text-xs text-muted-foreground text-right pt-2">
                Showing up to {Math.max(drilldown.users.length, drilldown.posts.length, drilldown.items.length)} records
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
