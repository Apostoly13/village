import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import Navigation from "../components/Navigation";
import { toast } from "sonner";
import { Shield, Users, MessageSquare, Flag, Crown, Ban, Search, ChevronLeft, ChevronRight, BarChart3, Eye, UserCheck, Heart, HelpCircle, TrendingUp, BookOpen, Check, X } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

const API_URL = process.env.REACT_APP_BACKEND_URL;

export default function AdminDashboard({ user }) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");
  const [analytics, setAnalytics] = useState(null);
  const [growth, setGrowth] = useState([]);
  const [users, setUsers] = useState([]);
  const [userSearch, setUserSearch] = useState("");
  const [userPage, setUserPage] = useState(1);
  const [userPages, setUserPages] = useState(1);
  const [userTotal, setUserTotal] = useState(0);
  const [reports, setReports] = useState([]);
  const [reportStatus, setReportStatus] = useState("pending");
  const [reportPage, setReportPage] = useState(1);
  const [reportPages, setReportPages] = useState(1);
  const [pendingBlogPosts, setPendingBlogPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.role !== "admin" && user?.role !== "moderator") {
      navigate("/dashboard");
      return;
    }
    fetchAnalytics();
    fetchGrowth();
  }, [user, navigate]);

  const apiFetch = async (url, options = {}) => {
    const res = await fetch(`${API_URL}${url}`, { credentials: "include", ...options });
    if (res.status === 403) {
      toast.error("Admin access required");
      navigate("/dashboard");
      return null;
    }
    return res;
  };

  const fetchAnalytics = async () => {
    try {
      const res = await apiFetch("/api/admin/analytics");
      if (res?.ok) setAnalytics(await res.json());
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const fetchGrowth = async () => {
    try {
      const res = await apiFetch("/api/admin/analytics/growth?days=14");
      if (res?.ok) setGrowth(await res.json());
    } catch (e) { console.error(e); }
  };

  const fetchUsers = async (page = 1, search = "") => {
    try {
      const qs = search ? `&search=${encodeURIComponent(search)}` : "";
      const res = await apiFetch(`/api/admin/users?page=${page}&limit=15${qs}`);
      if (res?.ok) {
        const data = await res.json();
        setUsers(data.users);
        setUserPage(data.page);
        setUserPages(data.pages);
        setUserTotal(data.total);
      }
    } catch (e) { console.error(e); }
  };

  const fetchReports = async (status = "pending", page = 1) => {
    try {
      const res = await apiFetch(`/api/admin/reports?status=${status}&page=${page}`);
      if (res?.ok) {
        const data = await res.json();
        setReports(data.reports);
        setReportPage(data.page);
        setReportPages(data.pages);
      }
    } catch (e) { console.error(e); }
  };

  const handleUserAction = async (userId, action, body = {}) => {
    try {
      const res = await apiFetch(`/api/admin/users/${userId}/${action}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
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
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action })
      });
      if (res?.ok) {
        toast.success((await res.json()).message);
        fetchReports(reportStatus, reportPage);
        fetchAnalytics();
      }
    } catch (e) { toast.error("Action failed"); }
  };

  const fetchPendingBlogPosts = async () => {
    try {
      const res = await apiFetch("/api/blog/pending");
      if (res?.ok) setPendingBlogPosts(await res.json());
    } catch (e) { console.error(e); }
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
  };

  const StatCard = ({ label, value, icon: Icon, color = "primary" }) => (
    <div className="bg-card rounded-2xl p-5 border border-border/50">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-muted-foreground">{label}</span>
        <Icon className={`h-5 w-5 text-${color}`} />
      </div>
      <p className="text-2xl font-bold text-foreground">{value ?? "—"}</p>
    </div>
  );

  const roleBadge = (role) => {
    if (role === "admin") return <Badge className="bg-red-500/20 text-red-600 dark:text-red-400 border-red-500/30">Admin</Badge>;
    if (role === "moderator") return <Badge className="bg-blue-500/20 text-blue-600 dark:text-blue-400 border-blue-500/30">Mod</Badge>;
    return <Badge variant="outline" className="text-muted-foreground">User</Badge>;
  };

  const tierBadge = (tier) => {
    if (tier === "premium") return <Badge className="bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/30"><Crown className="h-3 w-3 mr-1" />Premium</Badge>;
    if (tier === "trial") return <Badge className="bg-green-500/20 text-green-600 dark:text-green-400 border-green-500/30">Trial</Badge>;
    return <Badge variant="outline" className="text-muted-foreground">Free</Badge>;
  };

  const maxSignups = Math.max(...growth.map(d => d.signups), 1);

  if (loading) {
    return (
      <div className="min-h-screen bg-background pb-20 lg:pb-0">
        <Navigation user={user} />
        <main className="max-w-6xl mx-auto px-4 pt-20 lg:pt-24">
          <div className="flex items-center justify-center py-20">
            <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20 lg:pb-0">
      <Navigation user={user} />

      <main className="max-w-6xl mx-auto px-4 pt-20 lg:pt-24">
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="w-full bg-card border border-border/50 rounded-xl p-1 mb-6">
            <TabsTrigger value="overview" className="flex-1 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <BarChart3 className="h-4 w-4 mr-2" />Overview
            </TabsTrigger>
            <TabsTrigger value="users" className="flex-1 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Users className="h-4 w-4 mr-2" />Users
            </TabsTrigger>
            <TabsTrigger value="moderation" className="flex-1 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Flag className="h-4 w-4 mr-2" />Moderation
              {analytics?.content?.pending_reports > 0 && (
                <span className="ml-2 bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 min-w-[20px] text-center">
                  {analytics.content.pending_reports}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="blog" className="flex-1 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <BookOpen className="h-4 w-4 mr-2" />Blog
            </TabsTrigger>
          </TabsList>

          {/* ==================== OVERVIEW TAB ==================== */}
          <TabsContent value="overview" className="mt-0 space-y-6">
            {/* Hero Card */}
            <div className="bg-card rounded-2xl p-6 border border-border/50 flex flex-col lg:flex-row gap-6">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/15 flex items-center justify-center shrink-0">
                    <Shield className="h-5 w-5 text-blue-500" />
                  </div>
                  <div>
                    <h1 className="font-heading text-xl font-bold text-foreground">Protect the tone of the village</h1>
                    <p className="text-sm text-muted-foreground">Every post, reply, and message shapes the community.</p>
                  </div>
                </div>
                {/* Moderation stat tiles */}
                <div className="grid grid-cols-2 gap-3 mt-4">
                  <div className="bg-secondary/50 rounded-xl p-4 border border-border/30">
                    <div className="flex items-center gap-2 mb-1">
                      <Heart className="h-4 w-4 text-green-500" />
                      <span className="text-xs text-muted-foreground font-medium">Kindness health</span>
                    </div>
                    <p className="text-2xl font-bold font-heading text-foreground">
                      {analytics?.moderation?.kindness_health ?? 100}%
                    </p>
                  </div>
                  <div className="bg-secondary/50 rounded-xl p-4 border border-border/30">
                    <div className="flex items-center gap-2 mb-1">
                      <HelpCircle className="h-4 w-4 text-amber-500" />
                      <span className="text-xs text-muted-foreground font-medium">Unanswered tonight</span>
                    </div>
                    <p className="text-2xl font-bold font-heading text-foreground">
                      {analytics?.moderation?.unanswered_tonight ?? 0}
                    </p>
                  </div>
                  <div className="bg-secondary/50 rounded-xl p-4 border border-border/30">
                    <div className="flex items-center gap-2 mb-1">
                      <Flag className="h-4 w-4 text-red-500" />
                      <span className="text-xs text-muted-foreground font-medium">Reported issues</span>
                    </div>
                    <p className="text-2xl font-bold font-heading text-foreground">
                      {analytics?.moderation?.reported_issues ?? 0}
                    </p>
                  </div>
                  <div className="bg-secondary/50 rounded-xl p-4 border border-border/30">
                    <div className="flex items-center gap-2 mb-1">
                      <TrendingUp className="h-4 w-4 text-primary" />
                      <span className="text-xs text-muted-foreground font-medium">Circle growth</span>
                    </div>
                    <p className="text-2xl font-bold font-heading text-foreground">
                      +{analytics?.moderation?.circle_growth ?? 0}
                    </p>
                  </div>
                </div>
              </div>
              {/* Moderator principles sidebar */}
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

            {/* Platform Stat Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard label="Total Users" value={analytics?.users?.total} icon={Users} />
              <StatCard label="DAU / WAU / MAU" value={`${analytics?.active_users?.dau || 0} / ${analytics?.active_users?.wau || 0} / ${analytics?.active_users?.mau || 0}`} icon={Eye} />
              <StatCard label="Total Posts" value={analytics?.content?.total_posts} icon={MessageSquare} />
              <StatCard label="Pending Reports" value={analytics?.content?.pending_reports} icon={Flag} />
            </div>

            {/* Subscription Breakdown */}
            <div className="bg-card rounded-2xl p-6 border border-border/50">
              <h3 className="font-heading font-bold text-foreground mb-4">Subscription Breakdown</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="text-center p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
                  <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{analytics?.users?.premium || 0}</p>
                  <p className="text-sm text-muted-foreground">Premium</p>
                </div>
                <div className="text-center p-4 rounded-xl bg-green-500/10 border border-green-500/20">
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">{analytics?.users?.trial || 0}</p>
                  <p className="text-sm text-muted-foreground">Trial</p>
                </div>
                <div className="text-center p-4 rounded-xl bg-secondary/50 border border-border/30">
                  <p className="text-2xl font-bold text-foreground">{analytics?.users?.free || 0}</p>
                  <p className="text-sm text-muted-foreground">Free</p>
                </div>
                <div className="text-center p-4 rounded-xl bg-red-500/10 border border-red-500/20">
                  <p className="text-2xl font-bold text-red-600 dark:text-red-400">{analytics?.users?.banned || 0}</p>
                  <p className="text-sm text-muted-foreground">Banned</p>
                </div>
              </div>
            </div>

            {/* User Growth Chart */}
            <div className="bg-card rounded-2xl p-6 border border-border/50">
              <h3 className="font-heading font-bold text-foreground mb-4">User Growth (14 days)</h3>
              <div className="space-y-2">
                {growth.map(day => (
                  <div key={day.date} className="flex items-center gap-3 text-sm">
                    <span className="w-16 text-muted-foreground font-mono text-xs">{day.date.slice(5)}</span>
                    <div className="flex-1 bg-muted rounded-full h-6">
                      <div
                        className="bg-primary rounded-full h-6 flex items-center justify-end px-2 text-xs text-primary-foreground font-medium transition-all"
                        style={{ width: `${Math.max((day.signups / maxSignups) * 100, day.signups > 0 ? 12 : 0)}%` }}
                      >
                        {day.signups > 0 ? day.signups : ""}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Content Stats */}
            <div className="grid sm:grid-cols-2 gap-6">
              <div className="bg-card rounded-2xl p-6 border border-border/50">
                <h3 className="font-heading font-bold text-foreground mb-4">Content Stats</h3>
                <div className="space-y-3">
                  <div className="flex justify-between"><span className="text-muted-foreground">Forum Posts</span><span className="font-bold">{analytics?.content?.total_posts || 0}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Replies</span><span className="font-bold">{analytics?.content?.total_replies || 0}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Chat Messages</span><span className="font-bold">{analytics?.content?.total_chat_messages || 0}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Direct Messages</span><span className="font-bold">{analytics?.content?.total_dms || 0}</span></div>
                </div>
              </div>
              <div className="bg-card rounded-2xl p-6 border border-border/50">
                <h3 className="font-heading font-bold text-foreground mb-4">New Users</h3>
                <div className="space-y-3">
                  <div className="flex justify-between"><span className="text-muted-foreground">Today</span><span className="font-bold">{analytics?.users?.new_today || 0}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">This Week</span><span className="font-bold">{analytics?.users?.new_this_week || 0}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">This Month</span><span className="font-bold">{analytics?.users?.new_this_month || 0}</span></div>
                </div>
              </div>
            </div>

            {/* Top Categories */}
            {analytics?.categories?.length > 0 && (
              <div className="bg-card rounded-2xl p-6 border border-border/50">
                <h3 className="font-heading font-bold text-foreground mb-4">Forum Categories</h3>
                <div className="space-y-2">
                  {analytics.categories.map(cat => (
                    <div key={cat.category_id} className="flex items-center gap-3">
                      <span className="text-xl w-8">{cat.icon}</span>
                      <span className="flex-1 text-sm text-foreground">{cat.name}</span>
                      <span className="text-sm text-muted-foreground">{cat.post_count || 0} posts</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>

          {/* ==================== USERS TAB ==================== */}
          <TabsContent value="users" className="mt-0 space-y-4">
            <div className="flex gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && fetchUsers(1, userSearch)}
                  placeholder="Search by name or email..."
                  className="pl-10 rounded-xl"
                />
              </div>
              <Button onClick={() => fetchUsers(1, userSearch)} className="rounded-xl">Search</Button>
            </div>

            <p className="text-sm text-muted-foreground">{userTotal} users total</p>

            <div className="space-y-3">
              {users.map(u => (
                <div key={u.user_id} className="bg-card rounded-2xl p-4 border border-border/50 flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="font-bold text-foreground">{u.nickname || u.name}</span>
                      {roleBadge(u.role)}
                      {tierBadge(u.subscription_tier)}
                      {u.is_banned && <Badge className="bg-red-500/20 text-red-600 border-red-500/30"><Ban className="h-3 w-3 mr-1" />Banned</Badge>}
                    </div>
                    <p className="text-sm text-muted-foreground truncate">{u.email}</p>
                    <p className="text-xs text-muted-foreground">
                      Joined {u.created_at ? formatDistanceToNow(new Date(u.created_at), { addSuffix: true }) : "unknown"}
                      {u.state && ` · ${u.state}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Role */}
                    <Select
                      value={u.role || "user"}
                      onValueChange={(role) => handleUserAction(u.user_id, "role", { role })}
                    >
                      <SelectTrigger className="w-[110px] h-8 rounded-lg text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="user">User</SelectItem>
                        <SelectItem value="moderator">Moderator</SelectItem>
                        {user?.role === "admin" && <SelectItem value="admin">Admin</SelectItem>}
                      </SelectContent>
                    </Select>
                    {/* Subscription */}
                    <Select
                      value={u.subscription_tier || "free"}
                      onValueChange={(tier) => handleUserAction(u.user_id, "subscription", { tier })}
                    >
                      <SelectTrigger className="w-[100px] h-8 rounded-lg text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="free">Free</SelectItem>
                        <SelectItem value="trial">Trial</SelectItem>
                        <SelectItem value="premium">Premium</SelectItem>
                      </SelectContent>
                    </Select>
                    {/* Ban/Unban */}
                    {u.role !== "admin" && (
                      u.is_banned ? (
                        <Button size="sm" variant="outline" className="h-8 rounded-lg text-xs" onClick={() => handleUserAction(u.user_id, "unban")}>
                          Unban
                        </Button>
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

            {/* Pagination */}
            {userPages > 1 && (
              <div className="flex items-center justify-center gap-4 pt-4">
                <Button variant="outline" size="sm" disabled={userPage <= 1} onClick={() => fetchUsers(userPage - 1, userSearch)} className="rounded-lg">
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm text-muted-foreground">Page {userPage} of {userPages}</span>
                <Button variant="outline" size="sm" disabled={userPage >= userPages} onClick={() => fetchUsers(userPage + 1, userSearch)} className="rounded-lg">
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </TabsContent>

          {/* ==================== MODERATION TAB ==================== */}
          <TabsContent value="moderation" className="mt-0 space-y-4">
            <div className="flex gap-2">
              {["pending", "resolved", "dismissed"].map(s => (
                <Button
                  key={s}
                  variant={reportStatus === s ? "default" : "outline"}
                  size="sm"
                  className="rounded-full capitalize"
                  onClick={() => { setReportStatus(s); fetchReports(s, 1); }}
                >
                  {s}
                </Button>
              ))}
            </div>

            {reports.length === 0 ? (
              <div className="text-center py-12 bg-card rounded-2xl border border-border/50">
                <Flag className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                <h3 className="font-heading text-lg font-bold text-foreground mb-1">No {reportStatus} reports</h3>
                <p className="text-sm text-muted-foreground">
                  {reportStatus === "pending" ? "All clear! No content needs review." : `No ${reportStatus} reports to show.`}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {reports.map(report => (
                  <div key={report.report_id} className="bg-card rounded-2xl p-5 border border-border/50">
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {report.content_type === "post" ? "Reported Post" : "Reported Reply"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Reported by {report.reporter?.nickname || report.reporter?.name || "Unknown"} · {report.reason || "No reason given"}
                        </p>
                        {report.created_at && (
                          <p className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(report.created_at), { addSuffix: true })}
                          </p>
                        )}
                      </div>
                    </div>

                    {report.content && (
                      <div className="bg-secondary/50 rounded-xl p-4 mb-3">
                        {report.content.title && <p className="font-medium text-foreground mb-1">{report.content.title}</p>}
                        <p className="text-sm text-muted-foreground line-clamp-3">{report.content.content}</p>
                        <p className="text-xs text-muted-foreground mt-2">
                          By: {report.content.author_name || "Unknown"}
                        </p>
                      </div>
                    )}

                    {reportStatus === "pending" && (
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" className="rounded-lg" onClick={() => handleReportAction(report.report_id, "dismiss")}>
                          Dismiss
                        </Button>
                        <Button size="sm" variant="outline" className="rounded-lg text-red-600 border-red-500/30" onClick={() => handleReportAction(report.report_id, "remove_content")}>
                          Remove Content
                        </Button>
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
                <Button variant="outline" size="sm" disabled={reportPage <= 1} onClick={() => fetchReports(reportStatus, reportPage - 1)} className="rounded-lg">
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm text-muted-foreground">Page {reportPage} of {reportPages}</span>
                <Button variant="outline" size="sm" disabled={reportPage >= reportPages} onClick={() => fetchReports(reportStatus, reportPage + 1)} className="rounded-lg">
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </TabsContent>

          {/* ==================== BLOG TAB ==================== */}
          <TabsContent value="blog" className="mt-0 space-y-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="font-heading font-bold text-foreground text-lg">Blog Queue</h2>
              <Button variant="outline" size="sm" className="rounded-lg" onClick={fetchPendingBlogPosts}>
                Refresh
              </Button>
            </div>

            {pendingBlogPosts.length === 0 ? (
              <div className="text-center py-12 bg-card rounded-2xl border border-border/50">
                <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                <h3 className="font-heading text-lg font-bold text-foreground mb-1">No posts pending review</h3>
                <p className="text-sm text-muted-foreground">Community submissions will appear here.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {pendingBlogPosts.map(post => (
                  <div key={post.blog_id} className="bg-card rounded-2xl p-5 border border-border/50">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <h3 className="font-heading font-semibold text-foreground leading-snug">{post.title}</h3>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 font-medium shrink-0">Pending</span>
                    </div>
                    {post.summary && (
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-2">{post.summary}</p>
                    )}
                    <p className="text-xs text-muted-foreground mb-3">
                      By {post.author_name || "Unknown"} · {post.created_at ? formatDistanceToNow(new Date(post.created_at), { addSuffix: true }) : "recently"}
                    </p>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        className="rounded-lg bg-green-600 hover:bg-green-700 text-white"
                        onClick={() => handleBlogAction(post.blog_id, "approve")}
                      >
                        <Check className="h-3 w-3 mr-1" />Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="rounded-lg text-red-600 border-red-500/30 hover:bg-red-500/10"
                        onClick={() => handleBlogAction(post.blog_id, "reject")}
                      >
                        <X className="h-3 w-3 mr-1" />Reject
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
