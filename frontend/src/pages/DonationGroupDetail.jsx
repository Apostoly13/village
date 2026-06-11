import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Button } from "../components/ui/button";
import Navigation from "../components/Navigation";
import AppFooter from "../components/AppFooter";
import { ArrowLeft, MapPin, Users, ShoppingBag, Heart, Plus, Calendar, Edit2, Shield, X, Search, MessageCircle, AlertTriangle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";

const API_URL = process.env.REACT_APP_BACKEND_URL;

const PURPOSE_LABELS = {
  baby_clothes: "Baby Clothes",
  kids_clothes: "Kids Clothes",
  school_uniforms: "School Uniform Exchange",
  toys_games: "Toys & Games",
  baby_gear: "Baby Gear",
  maternity_feeding: "Maternity & Feeding",
  nappies_essentials: "Nappies & Essentials",
  books_learning: "Books & Learning",
  general_donations: "General Donations",
  // legacy values
  toy_drive: "Toy Drive",
  newborn_essentials: "Newborn Essentials",
  emergency_support: "Community Support",
  other: "Other",
};

const TYPE_STYLES = {
  sell:     "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20",
  swap:     "bg-sky-500/10 text-sky-700 dark:text-sky-400 border-sky-500/20",
  give_away:"bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20",
  wanted:   "bg-violet-500/10 text-violet-700 dark:text-violet-400 border-violet-500/20",
};

export default function DonationGroupDetail({ user }) {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const [group, setGroup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [endConfirm, setEndConfirm] = useState(false);
  const [cancelRequesting, setCancelRequesting] = useState(false);

  // Contact organiser
  const [showContact, setShowContact] = useState(false);
  const [contactMsg, setContactMsg] = useState("");
  const [sendingContact, setSendingContact] = useState(false);

  // Mod management
  const [showModPanel, setShowModPanel] = useState(false);
  const [modQuery, setModQuery] = useState("");
  const [modResults, setModResults] = useState([]);
  const [modLoading, setModLoading] = useState(false);
  const [addingMod, setAddingMod] = useState(null);
  const modRef = useRef(null);

  const isAdmin = user?.role === "admin" || user?.role === "moderator";
  const isOrganiser = group?.organiser_id === user?.user_id;
  const isMod = group?.moderator_ids?.includes(user?.user_id);
  const canManage = isOrganiser || isMod || isAdmin;

  const [resolvedCoverage, setResolvedCoverage] = useState("");

  useEffect(() => {
    if (!group?.area_coverage) { setResolvedCoverage(""); return; }
    const resolve = async () => {
      let coverage = group.area_coverage;
      const rangeRegex = /Postcodes?\s+(\d{4})[–\-](\d{4})/gi;
      const matches = [...coverage.matchAll(rangeRegex)];
      for (const match of matches) {
        const lo = match[1], hi = match[2];
        try {
          const [resLo, resHi] = await Promise.all([
            fetch(`${API_URL}/api/location/postcode/${lo}`, { credentials: "include" }).then(r => r.ok ? r.json() : null),
            fetch(`${API_URL}/api/location/postcode/${hi}`, { credentials: "include" }).then(r => r.ok ? r.json() : null),
          ]);
          const state = resLo?.state || resHi?.state || "";
          const areaLo = resLo?.area, areaHi = resHi?.area;
          let replacement;
          if (areaLo && areaHi && areaLo !== areaHi) replacement = `${areaLo} to ${areaHi}${state ? `, ${state}` : ""} (${lo}–${hi})`;
          else if (areaLo || areaHi) replacement = `${areaLo || areaHi}${state ? `, ${state}` : ""} (${lo}–${hi})`;
          else replacement = `Postcodes ${lo}–${hi}${state ? `, ${state}` : ""}`;
          coverage = coverage.replace(match[0], replacement);
        } catch {}
      }
      setResolvedCoverage(coverage);
    };
    resolve();
  }, [group?.area_coverage]);

  const fetchGroup = async () => {
    try {
      const res = await fetch(`${API_URL}/api/stall/groups/${groupId}`, { credentials: "include" });
      if (res.ok) setGroup(await res.json());
      else navigate("/stall?tab=groups");
    } catch { navigate("/stall?tab=groups"); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchGroup(); }, [groupId]);

  // Debounced mod search
  useEffect(() => {
    if (modQuery.trim().length < 2) { setModResults([]); return; }
    const t = setTimeout(async () => {
      setModLoading(true);
      try {
        const res = await fetch(`${API_URL}/api/users/search?q=${encodeURIComponent(modQuery)}&limit=6`, { credentials: "include" });
        if (res.ok) { const data = await res.json(); setModResults(data.users || data || []); }
      } catch {}
      finally { setModLoading(false); }
    }, 300);
    return () => clearTimeout(t);
  }, [modQuery]);

  const handleJoinLeave = async () => {
    setJoining(true);
    try {
      const endpoint = group.is_member ? "leave" : "join";
      const res = await fetch(`${API_URL}/api/stall/groups/${groupId}/${endpoint}`, { method: "POST", credentials: "include" });
      if (res.ok) {
        toast.success(group.is_member ? "Left group" : "Joined group");
        fetchGroup();
      }
    } catch { toast.error("Something went wrong"); }
    finally { setJoining(false); }
  };

  const handleSendContact = async () => {
    if (!contactMsg.trim()) return;
    setSendingContact(true);
    try {
      const res = await fetch(`${API_URL}/api/stall/groups/${groupId}/message`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ content: contactMsg.trim() }),
      });
      if (res.ok) {
        toast.success("Message sent — find the reply in Stall › Messages");
        setContactMsg("");
        setShowContact(false);
      } else {
        const err = await res.json();
        toast.error(err.detail || "Failed to send message");
      }
    } catch { toast.error("Something went wrong"); }
    finally { setSendingContact(false); }
  };

  const handleEnd = async () => {
    try {
      const res = await fetch(`${API_URL}/api/stall/groups/${groupId}/end`, { method: "POST", credentials: "include" });
      if (res.ok) { toast.success("Group ended"); navigate("/stall?tab=groups"); }
      else toast.error("Could not end group");
    } catch { toast.error("Something went wrong"); }
    setEndConfirm(false);
  };

  const handleRequestCancel = async () => {
    setCancelRequesting(true);
    try {
      const res = await fetch(`${API_URL}/api/stall/groups/${groupId}/request-cancel`, { method: "POST", credentials: "include" });
      if (res.ok) { toast.success("Cancellation request sent to the organiser"); fetchGroup(); }
      else toast.error("Could not send request");
    } catch { toast.error("Something went wrong"); }
    finally { setCancelRequesting(false); }
  };

  const handleApproveCancelRequest = async (approve) => {
    try {
      const res = await fetch(`${API_URL}/api/stall/groups/${groupId}/${approve ? "approve-cancel" : "decline-cancel"}`, { method: "POST", credentials: "include" });
      if (res.ok) {
        toast.success(approve ? "Group cancelled" : "Cancellation request declined");
        if (approve) navigate("/stall?tab=groups"); else fetchGroup();
      }
    } catch { toast.error("Something went wrong"); }
  };

  const handleAddMod = async (u) => {
    setAddingMod(u.user_id);
    try {
      const res = await fetch(`${API_URL}/api/stall/groups/${groupId}/moderators`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: u.user_id }),
      });
      if (res.ok) { toast.success(`${u.nickname || u.name} added as moderator`); fetchGroup(); }
      else toast.error("Could not add moderator");
    } catch { toast.error("Something went wrong"); }
    finally { setAddingMod(null); setModQuery(""); setModResults([]); }
  };

  const handleRemoveMod = async (modId) => {
    try {
      const res = await fetch(`${API_URL}/api/stall/groups/${groupId}/moderators/${modId}`, { method: "DELETE", credentials: "include" });
      if (res.ok) { toast.success("Moderator removed"); fetchGroup(); }
    } catch { toast.error("Something went wrong"); }
  };

  if (loading) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="w-6 h-6 rounded-full border-2 border-[var(--line)] border-t-[var(--ink-2)] animate-spin" />
    </div>
  );

  if (!group) return null;

  const items = group.items || [];
  const formatTime = (d) => { try { return formatDistanceToNow(new Date(d), { addSuffix: true }); } catch { return ""; } };
  const isEnded = group.status === "ended" || group.status === "closed";
  const hasCancelRequest = group.status === "cancel_requested";

  return (
    <div className="min-h-screen bg-background lg:pl-60 lg:pb-0">
      <Navigation user={user} />

      <main className="max-w-3xl mx-auto px-4 pt-16 lg:pt-8 pb-24">
        {/* Back + action bar */}
        <div className="flex items-center justify-between mb-4 mt-2">
          <button onClick={() => navigate("/stall?tab=groups")} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" /> Back to Groups
          </button>
          {canManage && !isEnded && (
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" className="rounded-full h-8 text-xs gap-1" onClick={() => navigate(`/stall/groups/${groupId}/edit`)}>
                <Edit2 className="h-3 w-3" /> Edit
              </Button>
              {isOrganiser && (
                <Button size="sm" variant="outline" className="rounded-full h-8 text-xs gap-1" onClick={() => setShowModPanel(p => !p)}>
                  <Shield className="h-3 w-3" /> Mods
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Cancel request banner — shown to organiser */}
        {hasCancelRequest && isOrganiser && (
          <div className="mb-4 p-4 rounded-xl border" style={{ background: "var(--honey-wash)", borderColor: "var(--line)" }}>
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-foreground">A moderator has requested this group be cancelled</p>
                <p className="text-xs text-muted-foreground mt-0.5">Review the request and choose to approve or decline it.</p>
                <div className="flex gap-2 mt-3">
                  <Button size="sm" variant="destructive" className="rounded-full h-7 text-xs" onClick={() => handleApproveCancelRequest(true)}>Approve & cancel group</Button>
                  <Button size="sm" variant="outline" className="rounded-full h-7 text-xs" onClick={() => handleApproveCancelRequest(false)}>Decline request</Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Ended/cancelled banner */}
        {isEnded && (
          <div className="mb-4 p-3 rounded-xl text-sm font-medium text-center" style={{ background: "var(--paper-2)", color: "var(--ink-3)", border: "1px solid var(--line)" }}>
            This group has ended
          </div>
        )}

        {/* Mod management panel */}
        {showModPanel && isOrganiser && (
          <div className="village-card p-5 mb-4 space-y-3">
            <h3 className="font-semibold text-sm text-foreground flex items-center gap-2"><Shield className="h-4 w-4 text-muted-foreground" />Manage Moderators</h3>

            {/* Current mods */}
            {(group.moderator_ids || []).length > 0 ? (
              <div className="space-y-2">
                {(group.moderators_detail || group.moderator_ids.map(id => ({ user_id: id }))).map(m => (
                  <div key={m.user_id} className="flex items-center gap-3 py-1">
                    <Avatar className="h-7 w-7">
                      <AvatarImage src={m.picture} />
                      <AvatarFallback className="text-xs">{(m.nickname || m.name || "M")[0]}</AvatarFallback>
                    </Avatar>
                    <span className="text-sm text-foreground flex-1">{m.nickname || m.name || m.user_id}</span>
                    <Button size="sm" variant="ghost" className="h-6 text-xs text-destructive hover:text-destructive rounded-full px-2" onClick={() => handleRemoveMod(m.user_id)}>
                      Remove
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">No moderators yet.</p>
            )}

            {/* Add mod search */}
            <div className="relative" ref={modRef}>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <input
                  value={modQuery}
                  onChange={e => setModQuery(e.target.value)}
                  placeholder="Search for a member to add as mod…"
                  autoComplete="off"
                  className="w-full bg-background border border-border/50 rounded-xl pl-9 pr-4 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none transition"
                />
                {modLoading && <div className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full border-2 border-[var(--line)] border-t-[var(--ink-2)] animate-spin" />}
              </div>
              {modResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-card border border-border/50 rounded-xl shadow-lg overflow-hidden">
                  {modResults.map(u => (
                    <button
                      key={u.user_id}
                      type="button"
                      disabled={addingMod === u.user_id}
                      onClick={() => handleAddMod(u)}
                      className="w-full flex items-center gap-2.5 px-3 py-2.5 text-left hover:bg-secondary/60 transition-colors border-b border-border/30 last:border-0"
                    >
                      <Avatar className="h-7 w-7 shrink-0">
                        <AvatarImage src={u.picture} />
                        <AvatarFallback className="text-xs">{(u.nickname || u.name || "?")[0]}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground">{u.nickname || u.name}</p>
                        {u.suburb && <p className="text-xs text-muted-foreground">{u.suburb}</p>}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Hero card */}
        <div className="village-card overflow-hidden mb-6">
          {group.cover_image && (
            <img src={group.cover_image} alt={group.name} className="w-full h-40 object-cover" />
          )}
          <div className="p-5">
            {/* Purpose badge */}
            {group.purpose_type && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold mb-3" style={{ background: "var(--honey-wash)", color: "var(--ink-2)", border: "1px solid var(--line)" }}>
                {PURPOSE_LABELS[group.purpose_type] || group.purpose_type}
              </span>
            )}

            <div className="flex items-start gap-4">
              {!group.cover_image && (
                <div className="w-14 h-14 rounded-2xl bg-amber-500/10 flex items-center justify-center text-3xl shrink-0">🤝</div>
              )}
              <div className="flex-1 min-w-0">
                <h1 className="font-heading text-xl font-bold text-foreground leading-tight mb-1">{group.name}</h1>
                <p className="text-sm text-muted-foreground leading-relaxed">{group.description}</p>
              </div>
            </div>

            {/* Stats */}
            <div className="flex flex-wrap gap-4 mt-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" />{group.member_count ?? group.member_ids?.length ?? 0} members</span>
              <span className="flex items-center gap-1"><ShoppingBag className="h-3.5 w-3.5" />{group.item_count || 0} items donated</span>
              {(resolvedCoverage || group.area_coverage || group.suburb) && (
                <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{resolvedCoverage || group.area_coverage || group.suburb}</span>
              )}
              {group.end_date && (
                <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />Closes {new Date(group.end_date).toLocaleDateString("en-AU", { day: "numeric", month: "long" })}</span>
              )}
            </div>

            {/* Organiser row */}
            <div className="flex items-center gap-2 mt-4 pt-4 border-t border-border/30">
              <Avatar className="h-7 w-7">
                <AvatarImage src={group.organiser_picture} />
                <AvatarFallback className="text-xs">{group.organiser_name?.[0]}</AvatarFallback>
              </Avatar>
              <span className="text-xs text-muted-foreground">
                Organised by <span className="text-foreground font-medium">{group.organiser_name}</span>
                {isMod && !isOrganiser && <span className="ml-2 text-primary font-medium">· You're a mod</span>}
              </span>

              {/* Join / Leave */}
              <div className="ml-auto flex gap-2">
                {isOrganiser ? (
                  <span className="text-xs text-primary font-medium">You're the organiser</span>
                ) : (
                  <Button
                    size="sm"
                    variant={group.is_member ? "outline" : "default"}
                    className="rounded-full h-8 text-xs"
                    disabled={joining || isEnded}
                    onClick={handleJoinLeave}
                  >
                    {joining ? "…" : group.is_member ? "Leave group" : isEnded ? "Closed" : "Join group"}
                  </Button>
                )}
              </div>
            </div>

            {/* Paused banner */}
            {group.is_open === false && !isEnded && (
              <div className="mt-4 p-3 rounded-xl text-sm font-medium text-center" style={{ background: "var(--honey-wash)", color: "var(--ink-2)", border: "1px solid var(--line)" }}>
                This group is temporarily paused — new donations aren't being accepted right now.
              </div>
            )}

            {/* Member action buttons */}
            {(group.is_member || isOrganiser) && !isEnded && group.is_open !== false && (
              <>
              <div className="flex gap-3 mt-4">
                <Button
                  className="flex-1 rounded-xl"
                  onClick={() => navigate(`/stall/new?group=${groupId}`)}
                >
                  <Heart className="h-4 w-4 mr-2" />
                  Donate to this group
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 rounded-xl"
                  onClick={() => setShowContact(v => !v)}
                >
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Contact organiser
                </Button>
              </div>

              {/* Inline contact form */}
              {showContact && (
                <div className="mt-3 p-3 rounded-xl border border-border/50 bg-card space-y-2">
                  <p className="text-xs text-muted-foreground">Send a message to the organiser. Their reply will appear in <strong>Stall › Messages</strong>.</p>
                  <textarea
                    value={contactMsg}
                    onChange={e => setContactMsg(e.target.value.slice(0, 500))}
                    rows={3}
                    placeholder="Hi, I'd like to donate some items…"
                    className="w-full bg-background border border-border/50 rounded-xl px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none transition resize-none"
                  />
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs text-muted-foreground">{contactMsg.length}/500</span>
                    <div className="flex gap-2">
                      <Button size="sm" variant="ghost" className="rounded-full h-8 text-xs" onClick={() => { setShowContact(false); setContactMsg(""); }}>Cancel</Button>
                      <Button size="sm" className="rounded-full h-8 text-xs" disabled={!contactMsg.trim() || sendingContact} onClick={handleSendContact}
                        style={{ background: "var(--ink)", color: "var(--paper)" }}>
                        {sendingContact ? "Sending…" : "Send"}
                      </Button>
                    </div>
                  </div>
                </div>
              )}
              </>
            )}

            {/* Not-a-member CTA */}
            {!group.is_member && !isOrganiser && !isEnded && (
              <div className="mt-4 space-y-2">
                <p className="text-xs text-muted-foreground text-center">Join this group to donate items, or message the organiser if you have questions first.</p>
                <Button
                  variant="outline"
                  className="w-full rounded-xl text-sm"
                  onClick={() => setShowContact(v => !v)}
                >
                  <MessageCircle className="h-4 w-4 mr-2" />
                  {showContact ? "Cancel" : `Message ${group.organiser_name?.split(" ")[0] || "organiser"}`}
                </Button>
                {showContact && (
                  <div className="p-3 rounded-xl border border-border/50 bg-card space-y-2">
                    <p className="text-xs text-muted-foreground">Your message will go to the organiser. Their reply will appear in <strong>Stall › Messages</strong>.</p>
                    <textarea
                      value={contactMsg}
                      onChange={e => setContactMsg(e.target.value.slice(0, 500))}
                      rows={3}
                      placeholder="Hi, I have a question about this group…"
                      className="w-full bg-background border border-border/50 rounded-xl px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none transition resize-none"
                    />
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs text-muted-foreground">{contactMsg.length}/500</span>
                      <Button size="sm" className="rounded-full h-8 text-xs" disabled={!contactMsg.trim() || sendingContact} onClick={handleSendContact}
                        style={{ background: "var(--ink)", color: "var(--paper)" }}>
                        {sendingContact ? "Sending…" : "Send"}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Creator end-group controls */}
            {isOrganiser && !isEnded && (
              <div className="mt-4 pt-4 border-t border-border/30 flex items-center gap-2">
                {!endConfirm ? (
                  <Button size="sm" variant="ghost" className="rounded-full h-7 text-xs text-muted-foreground hover:text-destructive" onClick={() => setEndConfirm(true)}>
                    End this group
                  </Button>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">End group permanently?</span>
                    <Button size="sm" variant="destructive" className="rounded-full h-7 text-xs" onClick={handleEnd}>Yes, end it</Button>
                    <Button size="sm" variant="ghost" className="rounded-full h-7 text-xs" onClick={() => setEndConfirm(false)}>Cancel</Button>
                  </div>
                )}
              </div>
            )}

            {/* Mod cancel request */}
            {isMod && !isOrganiser && !isEnded && group.status !== "cancel_requested" && (
              <div className="mt-4 pt-4 border-t border-border/30">
                <Button size="sm" variant="ghost" className="rounded-full h-7 text-xs text-muted-foreground hover:text-destructive" onClick={handleRequestCancel} disabled={cancelRequesting}>
                  {cancelRequesting ? "Sending…" : "Request group cancellation"}
                </Button>
              </div>
            )}
            {isMod && !isOrganiser && group.status === "cancel_requested" && (
              <p className="text-xs text-muted-foreground mt-3 pt-3 border-t border-border/30">Cancellation request sent — awaiting organiser approval.</p>
            )}
          </div>
        </div>

        {/* What we accept / don't / rules */}
        {group.accepted_items && (
          <div className="village-card p-4 mb-4">
            <h3 className="font-semibold text-sm text-foreground mb-2">What we accept</h3>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">{group.accepted_items}</p>
          </div>
        )}
        {group.not_accepted && (
          <div className="village-card p-4 mb-4">
            <h3 className="font-semibold text-sm text-foreground mb-2">What we don't accept</h3>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">{group.not_accepted}</p>
          </div>
        )}
        {group.rules && (
          <div className="village-card p-4 mb-4">
            <h3 className="font-semibold text-sm text-foreground mb-2">Drop-off info &amp; rules</h3>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">{group.rules}</p>
          </div>
        )}

        {/* Items section */}
        <div className="village-card p-4 mb-4">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <ShoppingBag className="h-4 w-4 text-muted-foreground" />
              <span className="font-heading font-semibold text-sm text-foreground">
                {group.item_count || 0} item{(group.item_count || 0) !== 1 ? "s" : ""} donated
              </span>
            </div>
            {(group.is_member || isOrganiser) && !isEnded && group.is_open !== false && (
              <Button variant="outline" size="sm" className="rounded-full h-7 text-xs" onClick={() => navigate(`/stall/new?group=${groupId}`)}>
                <Plus className="h-3 w-3 mr-1" /> Donate
              </Button>
            )}
          </div>
          {!canManage && (
            <p className="text-xs text-muted-foreground mt-1">Item details are visible to the organiser only.</p>
          )}
        </div>

        {/* Donated items list — organiser and mods only */}
        {canManage && (
          <div className="village-card overflow-hidden mb-4">
            <div className="px-4 py-3 border-b border-border/40">
              <h3 className="font-heading font-semibold text-sm text-foreground">Donated items</h3>
              <p className="text-xs text-muted-foreground">Only you can see this list.</p>
            </div>
            {items.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <p className="text-sm text-muted-foreground">No items donated yet.</p>
              </div>
            ) : (
              <div className="divide-y divide-border/40">
                {items.map(item => (
                  <button
                    key={item.listing_id}
                    onClick={() => navigate(`/stall/listing/${item.listing_id}`)}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-secondary/30 transition-colors text-left"
                  >
                    <div className="w-10 h-10 rounded-lg bg-secondary/50 shrink-0 overflow-hidden">
                      {item.images?.[0]
                        ? <img src={item.images[0]} alt={item.title} className="w-full h-full object-cover" />
                        : <div className="w-full h-full flex items-center justify-center"><ShoppingBag className="h-4 w-4 text-muted-foreground/40" /></div>
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{item.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {item.category && <span className="capitalize">{item.category.replace("_", " ")}</span>}
                        {item.condition && <span> · {item.condition.replace("_", " ")}</span>}
                        {item.postal_address && <span> · 📬 {item.postal_address}</span>}
                      </p>
                    </div>
                    <p className="text-[11px] text-muted-foreground shrink-0">{formatTime(item.created_at)}</p>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      <AppFooter />
    </div>
  );
}
