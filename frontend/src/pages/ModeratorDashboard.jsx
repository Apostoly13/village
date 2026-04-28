import { useState, useEffect, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import Navigation from "../components/Navigation";
import { toast } from "sonner";
import {
  Flag, Shield, Search, Eye, Check, X, MessageSquare,
  AlertTriangle, Clock, Users, EyeOff, Ban, ChevronRight,
  ExternalLink, RefreshCw, Stethoscope,
} from "lucide-react";
import { timeAgoVerbose } from "../utils/dateHelpers";

const API_URL = process.env.REACT_APP_BACKEND_URL;

export default function ModeratorDashboard({ user }) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("reports");

  const [reports, setReports] = useState([]);
  const [reportStatus, setReportStatus] = useState("pending");
  const [reportPage, setReportPage] = useState(1);
  const [reportPages, setReportPages] = useState(1);
  const [selectedReport, setSelectedReport] = useState(null);
  const [reportLoading, setReportLoading] = useState(false);

  const [unansweredPosts, setUnansweredPosts] = useState([]);
  const [recentPosts, setRecentPosts] = useState([]);
  const [postSearch, setPostSearch] = useState("");
  const [postsLoading, setPostsLoading] = useState(false);

  const [professionalApplications, setProfessionalApplications] = useState([]);
  const [proLoading, setProLoading] = useState(false);

  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);

  const isMod = user?.role === "moderator" || user?.role === "admin";

  useEffect(() => {
    if (!isMod) { navigate("/dashboard"); return; }
    fetchOverview();
    fetchReports();
  }, [user, navigate]);

  const apiFetch = useCallback(async (url, options = {}) => {
    const res = await fetch(`${API_URL}${url}`, { credentials: "include", ...options });
    if (res.status === 403) { toast.error("Access denied"); navigate("/dashboard"); return null; }
    return res;
  }, [navigate]);

  const fetchOverview = async () => {
    try {
      const res = await apiFetch("/api/admin/analytics");
      if (res?.ok) {
        const data = await res.json();
        setOverview(data?.moderation || null);
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const fetchReports = async (status = reportStatus, page = 1) => {
    setReportLoading(true);
    try {
      const res = await apiFetch(`/api/admin/reports?status=${status}&page=${page}`);
      if (res?.ok) {
        const data = await res.json();
        setReports(data.reports || []);
        setReportPage(data.page || 1);
        setReportPages(data.pages || 1);
      }
    } catch (e) { console.error(e); }
    finally { setReportLoading(false); }
  };

  const fetchUnanswered = async () => {
    setPostsLoading(true);
    try {
      const res = await apiFetch("/api/admin/drilldown?type=unanswered");
      if (res?.ok) {
        const data = await res.json();
        setUnansweredPosts(data.posts || []);
      }
    } catch (e) { console.error(e); }
    finally { setPostsLoading(false); }
  };

  const fetchRecentPosts = async (q = "") => {
    setPostsLoading(true);
    try {
      const url = q
        ? `/api/search?q=${encodeURIComponent(q)}&limit=20`
        : `/api/feed?limit=20`;
      const res = await apiFetch(url);
      if (res?.ok) setRecentPosts(await res.json());
    } catch (e) { console.error(e); }
    finally { setPostsLoading(false); }
  };

  const fetchProfessionalApps = async () => {
    setProLoading(true);
    try {
      const res = await apiFetch("/api/admin/professional-applications");
      if (res?.ok) setProfessionalApplications(await res.json());
    } catch (e) { console.error(e); }
    finally { setProLoading(false); }
  };

  const handleReportAction = async (reportId, action) => {
    try {
      const res = await apiFetch(`/api/admin/reports/${reportId}/action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (res?.ok) {
        toast.success(action === "dismiss" ? "Report dismissed" : action === "remove" ? "Content removed" : "Action taken");
        setSelectedReport(null);
        fetchReports(reportStatus, reportPage);
        fetchOverview();
      }
    } catch { toast.error("Action failed"); }
  };

  const handleProAction = async (userId, action) => {
    try {
      const res = await apiFetch(`/api/admin/professional-applications/${userId}/${action}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (res?.ok) {
        toast.success(action === "approve" ? "Professional status approved" : "Application rejected");
        fetchProfessionalApps();
      }
    } catch { toast.error("Action failed"); }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === "unanswered") fetchUnanswered();
    if (tab === "posts") fetchRecentPosts();
    if (tab === "professionals") fetchProfessionalApps();
  };

  const fmtDate = timeAgoVerbose;

  const PROFESSIONAL_TYPE_LABELS = {
    midwife: "Midwife", doctor: "Doctor (GP)", obstetrician: "Obstetrician",
    nurse: "Nurse", psychologist: "Psychologist/Counsellor",
    lactation_consultant: "Lactation Consultant", pediatrician: "Paediatrician",
    social_worker: "Social Worker", physiotherapist: "Physiotherapist", other: "Other Health Professional",
  };

  if (!isMod) return null;

  return (
    <div className="min-h-screen bg-background pb-20 lg:pl-60 lg:pb-8">
      <Navigation user={user} />

      <main className="max-w-5xl mx-auto px-4 pt-16 lg:pt-8">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "hsl(var(--accent)/0.12)" }}>
                <Shield className="h-5 w-5" style={{ color: "hsl(var(--accent))" }} />
              </div>
              <h1 className="text-2xl font-medium" style={{ fontFamily: "var(--serif)", color: "var(--ink)" }}>
                Moderator Dashboard
              </h1>
            </div>
            <p className="text-sm" style={{ color: "var(--ink-3)" }}>
              Keep the village kind, safe, and supportive.
            </p>
          </div>
          <button
            onClick={() => { fetchOverview(); fetchReports(reportStatus, reportPage); }}
            className="p-2 rounded-lg transition-colors"
            style={{ color: "var(--ink-2)" }}
            onMouseEnter={e => e.currentTarget.style.background = "var(--paper-2)"}
            onMouseLeave={e => e.currentTarget.style.background = "transparent"}
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>

        {/* Quick stat strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[
            { icon: Flag,          label: "Pending Reports",    value: overview?.reported_issues ?? (loading ? "—" : 0), color: "text-red-500",    bg: "bg-red-500/10" },
            { icon: AlertTriangle, label: "Unanswered (24h)",   value: overview?.unanswered_tonight ?? (loading ? "—" : 0), color: "text-amber-500", bg: "bg-amber-500/10" },
            { icon: Shield,        label: "Kindness Health",    value: overview ? `${overview.kindness_health ?? 100}%` : "—", color: "text-green-500",  bg: "bg-green-500/10" },
            { icon: Users,         label: "New This Week",      value: overview ? `+${overview.space_growth ?? 0}` : "—", color: "text-primary",   bg: "bg-primary/10" },
          ].map(({ icon: Icon, label, value, color, bg }) => (
            <div key={label} className="rounded-2xl p-4 border" style={{ background: "var(--paper-2)", borderColor: "var(--line)" }}>
              <div className={`w-8 h-8 rounded-xl ${bg} flex items-center justify-center mb-2`}>
                <Icon className={`h-4 w-4 ${color}`} />
              </div>
              <p className="text-xl font-bold" style={{ color: "var(--ink)" }}>{value}</p>
              <p className="text-xs" style={{ color: "var(--ink-3)" }}>{label}</p>
            </div>
          ))}
        </div>

        <Tabs value={activeTab} onValueChange={handleTabChange}>
          <div className="overflow-x-auto pb-1 mb-5">
            <TabsList className="bg-card border border-border/50 rounded-xl p-1 flex gap-1 min-w-max">
              {[
                { value: "reports",       icon: Flag,          label: "Reports",     badge: overview?.reported_issues },
                { value: "unanswered",    icon: Clock,         label: "Unanswered",  badge: overview?.unanswered_tonight },
                { value: "posts",         icon: MessageSquare, label: "Browse Posts" },
                { value: "professionals", icon: Stethoscope,   label: "Professionals" },
              ].map(t => (
                <TabsTrigger key={t.value} value={t.value}
                  className="rounded-lg px-3 py-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground flex items-center gap-1.5 whitespace-nowrap text-sm"
                >
                  <t.icon className="h-4 w-4" />
                  {t.label}
                  {t.badge > 0 && (
                    <span className="ml-1 bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 min-w-[18px] text-center leading-none">{t.badge}</span>
                  )}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          {/* ── REPORTS TAB ── */}
          <TabsContent value="reports" className="mt-0">
            <div className="flex gap-2 mb-4 flex-wrap">
              {["pending", "reviewed", "dismissed"].map(s => (
                <button key={s}
                  onClick={() => { setReportStatus(s); fetchReports(s, 1); }}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors capitalize ${
                    reportStatus === s
                      ? "bg-primary text-primary-foreground"
                      : "bg-card border border-border/50 text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>

            {reportLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-5 h-5 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
              </div>
            ) : reports.length === 0 ? (
              <div className="text-center py-12 rounded-2xl border" style={{ background: "var(--paper-2)", borderColor: "var(--line)" }}>
                <Shield className="h-10 w-10 mx-auto mb-3 opacity-30" />
                <p className="font-medium" style={{ color: "var(--ink)" }}>No {reportStatus} reports</p>
                <p className="text-sm mt-1" style={{ color: "var(--ink-3)" }}>The village is looking kind today.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {reports.map(report => (
                  <div key={report.report_id}
                    className="rounded-2xl border p-4 cursor-pointer transition-all hover:shadow-md"
                    style={{ background: "var(--paper-2)", borderColor: "var(--line)" }}
                    onClick={() => setSelectedReport(selectedReport?.report_id === report.report_id ? null : report)}
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-xl bg-red-500/10 flex items-center justify-center shrink-0 mt-0.5">
                        <Flag className="h-4 w-4 text-red-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-semibold" style={{ color: "var(--ink)" }}>
                            {{
                              post: "Forum post",
                              reply: "Forum reply",
                              chat_message: "Chat message",
                              direct_message: "Direct message",
                              listing: "Stall listing",
                              stall_message: "Stall message",
                            }[report.content_type] || report.content_type} reported
                          </span>
                          {report.content?.is_anonymous && (
                            <Badge variant="outline" className="text-xs">Anonymous post</Badge>
                          )}
                          <Badge variant="outline" className="text-xs capitalize">{report.reason || "General"}</Badge>
                          <span className="text-xs ml-auto" style={{ color: "var(--ink-3)" }}>{fmtDate(report.created_at)}</span>
                        </div>
                        <p className="text-xs mt-1 line-clamp-2" style={{ color: "var(--ink-2)" }}>
                          {/* Pull preview from enriched content object */}
                          {report.content
                            ? (report.content.title || report.content.content || "—")
                            : (report.content_preview || report.notes || "Content no longer available")}
                        </p>
                        {report.details && (
                          <p className="text-xs mt-0.5 italic" style={{ color: "var(--ink-3)" }}>
                            Reporter note: {report.details}
                          </p>
                        )}
                      </div>
                      <ChevronRight className={`h-4 w-4 shrink-0 transition-transform ${selectedReport?.report_id === report.report_id ? "rotate-90" : ""}`} style={{ color: "var(--ink-3)" }} />
                    </div>

                    {/* Expanded actions */}
                    {selectedReport?.report_id === report.report_id && (
                      <div className="mt-4 pt-4 border-t" style={{ borderColor: "var(--line)" }}>
                        {report.content_url && (
                          <Link
                            to={report.content_url}
                            onClick={e => e.stopPropagation()}
                            className="inline-flex items-center gap-1.5 text-xs mb-3 underline underline-offset-2"
                            style={{ color: "hsl(var(--accent))" }}
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                            View reported content
                          </Link>
                        )}
                        <div className="flex flex-wrap gap-2">
                          <Button size="sm" variant="destructive" className="h-8 text-xs rounded-xl"
                            onClick={e => { e.stopPropagation(); handleReportAction(report.report_id, "remove"); }}
                          >
                            <EyeOff className="h-3.5 w-3.5 mr-1.5" />Remove Content
                          </Button>
                          <Button size="sm" variant="outline" className="h-8 text-xs rounded-xl"
                            onClick={e => { e.stopPropagation(); handleReportAction(report.report_id, "warn"); }}
                          >
                            <AlertTriangle className="h-3.5 w-3.5 mr-1.5" />Warn User
                          </Button>
                          <Button size="sm" variant="outline" className="h-8 text-xs rounded-xl"
                            onClick={e => { e.stopPropagation(); handleReportAction(report.report_id, "dismiss"); }}
                          >
                            <Check className="h-3.5 w-3.5 mr-1.5" />Dismiss
                          </Button>
                          {user?.role === "admin" && (
                            <Button size="sm" variant="outline" className="h-8 text-xs rounded-xl border-red-500/30 text-red-500 hover:bg-red-500/10"
                              onClick={e => { e.stopPropagation(); handleReportAction(report.report_id, "ban"); }}
                            >
                              <Ban className="h-3.5 w-3.5 mr-1.5" />Ban User
                            </Button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}

                {/* Pagination */}
                {reportPages > 1 && (
                  <div className="flex items-center justify-center gap-2 pt-2">
                    <Button size="sm" variant="outline" disabled={reportPage <= 1}
                      onClick={() => { const p = reportPage - 1; setReportPage(p); fetchReports(reportStatus, p); }}
                    >
                      Previous
                    </Button>
                    <span className="text-sm" style={{ color: "var(--ink-3)" }}>{reportPage} / {reportPages}</span>
                    <Button size="sm" variant="outline" disabled={reportPage >= reportPages}
                      onClick={() => { const p = reportPage + 1; setReportPage(p); fetchReports(reportStatus, p); }}
                    >
                      Next
                    </Button>
                  </div>
                )}
              </div>
            )}
          </TabsContent>

          {/* ── UNANSWERED TAB ── */}
          <TabsContent value="unanswered" className="mt-0">
            <div className="mb-4 p-4 rounded-2xl border" style={{ background: "hsl(var(--accent)/0.06)", borderColor: "hsl(var(--accent)/0.2)" }}>
              <p className="text-sm font-medium" style={{ color: "hsl(var(--accent))" }}>
                💛 These posts have had no replies in 24 hours. A single kind response can make someone's day.
              </p>
            </div>

            {postsLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-5 h-5 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
              </div>
            ) : unansweredPosts.length === 0 ? (
              <div className="text-center py-12 rounded-2xl border" style={{ background: "var(--paper-2)", borderColor: "var(--line)" }}>
                <Clock className="h-10 w-10 mx-auto mb-3 opacity-30" />
                <p className="font-medium" style={{ color: "var(--ink)" }}>No unanswered posts</p>
                <p className="text-sm mt-1" style={{ color: "var(--ink-3)" }}>The community is looking after each other.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {unansweredPosts.map(post => (
                  <Link key={post.post_id} to={`/forums/post/${post.post_id}`}
                    className="block rounded-2xl border p-4 transition-all hover:shadow-md hover:-translate-y-px"
                    style={{ background: "var(--paper-2)", borderColor: "var(--line)" }}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                      <span className="font-mono text-[9px] uppercase tracking-[0.12em]" style={{ color: "var(--ink-3)" }}>
                        {post.category_name} · {fmtDate(post.created_at)} ago
                      </span>
                    </div>
                    <h3 className="font-medium leading-snug line-clamp-2" style={{ color: "var(--ink)" }}>{post.title}</h3>
                    {post.content && (
                      <p className="text-sm mt-1 line-clamp-2" style={{ color: "var(--ink-2)" }}>{post.content}</p>
                    )}
                  </Link>
                ))}
              </div>
            )}
          </TabsContent>

          {/* ── BROWSE POSTS TAB ── */}
          <TabsContent value="posts" className="mt-0">
            <div className="flex gap-2 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={postSearch}
                  onChange={e => setPostSearch(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && fetchRecentPosts(postSearch)}
                  placeholder="Search posts..."
                  className="pl-9 rounded-xl"
                  style={{ height: 40, background: "var(--paper)", border: "1px solid var(--line)" }}
                />
              </div>
              <Button size="sm" onClick={() => fetchRecentPosts(postSearch)} className="rounded-xl">Search</Button>
            </div>

            {postsLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-5 h-5 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
              </div>
            ) : (
              <div className="space-y-3">
                {recentPosts.map(post => (
                  <div key={post.post_id} className="rounded-2xl border p-4" style={{ background: "var(--paper-2)", borderColor: "var(--line)" }}>
                    <div className="flex items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="font-mono text-[9px] uppercase tracking-[0.12em]" style={{ color: "var(--ink-3)" }}>
                            {post.category_name} · {fmtDate(post.created_at)}
                          </span>
                          {post.is_anonymous && <Badge variant="outline" className="text-xs">Anon</Badge>}
                        </div>
                        <h3 className="font-medium leading-snug line-clamp-2 mb-1" style={{ color: "var(--ink)" }}>{post.title}</h3>
                        {post.content && (
                          <p className="text-sm line-clamp-2" style={{ color: "var(--ink-2)" }}>{post.content}</p>
                        )}
                      </div>
                      <div className="flex flex-col gap-1 shrink-0">
                        <Link to={`/forums/post/${post.post_id}`}>
                          <Button size="sm" variant="outline" className="h-7 text-xs rounded-lg w-full">
                            <Eye className="h-3 w-3 mr-1" />View
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* ── PROFESSIONAL APPLICATIONS TAB ── */}
          <TabsContent value="professionals" className="mt-0">
            {proLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-5 h-5 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
              </div>
            ) : professionalApplications.length === 0 ? (
              <div className="text-center py-12 rounded-2xl border" style={{ background: "var(--paper-2)", borderColor: "var(--line)" }}>
                <Stethoscope className="h-10 w-10 mx-auto mb-3 opacity-30" />
                <p className="font-medium" style={{ color: "var(--ink)" }}>No pending applications</p>
                <p className="text-sm mt-1" style={{ color: "var(--ink-3)" }}>Professional verification requests will appear here.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {professionalApplications.map(app => (
                  <div key={app.user_id} className="rounded-2xl border p-5" style={{ background: "var(--paper-2)", borderColor: "var(--line)" }}>
                    <div className="flex items-start gap-4">
                      <Avatar className="h-10 w-10 shrink-0">
                        <AvatarImage src={app.picture} />
                        <AvatarFallback className="bg-primary/20 text-primary text-sm">
                          {(app.nickname || app.name || "?")[0].toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <p className="font-semibold" style={{ color: "var(--ink)" }}>{app.nickname || app.name}</p>
                          <Badge variant="outline" className="text-xs" style={{ borderColor: "hsl(var(--accent)/0.4)", color: "hsl(var(--accent))" }}>
                            {PROFESSIONAL_TYPE_LABELS[app.professional_type] || app.professional_type}
                          </Badge>
                        </div>
                        <p className="text-sm" style={{ color: "var(--ink-3)" }}>{app.email}</p>
                        {app.professional_credentials && (
                          <div className="mt-2 p-3 rounded-xl text-sm" style={{ background: "var(--paper-3)", color: "var(--ink-2)" }}>
                            <p className="font-medium text-xs mb-1" style={{ color: "var(--ink-3)" }}>Submitted credentials:</p>
                            <p className="whitespace-pre-wrap">{app.professional_credentials}</p>
                          </div>
                        )}
                        {app.professional_workplace && (
                          <p className="text-sm mt-1" style={{ color: "var(--ink-2)" }}>
                            <span className="font-medium">Workplace:</span> {app.professional_workplace}
                          </p>
                        )}
                        <p className="text-xs mt-2" style={{ color: "var(--ink-3)" }}>
                          Applied {fmtDate(app.professional_applied_at)}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-4 pt-4 border-t" style={{ borderColor: "var(--line)" }}>
                      <Button size="sm" className="rounded-xl h-8 text-xs"
                        style={{ background: "var(--ink)", color: "var(--paper)" }}
                        onClick={() => handleProAction(app.user_id, "approve")}
                      >
                        <Check className="h-3.5 w-3.5 mr-1.5" />Approve
                      </Button>
                      <Button size="sm" variant="outline" className="rounded-xl h-8 text-xs"
                        onClick={() => handleProAction(app.user_id, "reject")}
                      >
                        <X className="h-3.5 w-3.5 mr-1.5" />Reject
                      </Button>
                      <Link to={`/profile/${app.user_id}`} className="ml-auto">
                        <Button size="sm" variant="ghost" className="rounded-xl h-8 text-xs">
                          <ExternalLink className="h-3.5 w-3.5 mr-1.5" />View Profile
                        </Button>
                      </Link>
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
