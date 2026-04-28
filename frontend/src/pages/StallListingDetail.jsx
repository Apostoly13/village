import { useState, useEffect, useLayoutEffect, useRef, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Button } from "../components/ui/button";
import Navigation from "../components/Navigation";
import AppFooter from "../components/AppFooter";
import { ArrowLeft, MapPin, Clock, Bookmark, BookmarkCheck, Tag, ArrowLeftRight, Heart, Search, MessageCircle, Crown, ChevronLeft, ChevronRight, Send, X, ShoppingBag, Check, Flag } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "../components/ui/dialog";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { parseApiError } from "../utils/apiError";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";

const API_URL = process.env.REACT_APP_BACKEND_URL;

const TYPE_STYLES = {
  sell:      { label: "Selling",     bg: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20" },
  swap:      { label: "Swapping",    bg: "bg-sky-500/10 text-sky-700 dark:text-sky-400 border-sky-500/20" },
  give_away: { label: "Giving Away", bg: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20" },
  wanted:    { label: "Wanted",      bg: "bg-violet-500/10 text-violet-700 dark:text-violet-400 border-violet-500/20" },
};

const CONDITION_LABELS = {
  like_new: "Like new", good: "Good", fair: "Fair", well_loved: "Well loved",
};

const fmtTime = (d) => { try { return formatDistanceToNow(new Date(d), { addSuffix: true }); } catch { return ""; } };

// ── StallChatPanel ─────────────────────────────────────────────────────────────
// Full-screen threaded chat overlay. Opens over the listing detail page.

function StallChatPanel({ listing, user, onClose }) {
  const [messages, setMessages] = useState([]);
  const [newMsg, setNewMsg]     = useState("");
  const [sending, setSending]   = useState(false);
  const [loading, setLoading]   = useState(true);
  const bottomRef      = useRef(null);
  const scrollAreaRef  = useRef(null);
  const intervalRef    = useRef(null);
  const textareaRef    = useRef(null);
  const isAtBottom     = useRef(true);

  // Report state
  const [reportMsg, setReportMsg]         = useState(null);
  const [reportReason, setReportReason]   = useState("");
  const [reportDetails, setReportDetails] = useState("");
  const [reportSubmitting, setReportSubmitting] = useState(false);

  const submitReport = async () => {
    if (!reportReason || !reportMsg) return;
    setReportSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/api/reports`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          content_type: "stall_message",
          content_id: reportMsg.message_id,
          reason: reportReason,
          details: reportDetails,
        }),
      });
      if (res.ok) {
        toast.success("Report submitted. Our team will review it.");
        setReportMsg(null);
      } else {
        const d = await res.json();
        toast.error(d.detail || "Could not submit report");
      }
    } catch {
      toast.error("Could not submit report");
    } finally {
      setReportSubmitting(false);
    }
  };

  const otherUserId = listing.seller_id;

  const fetchMessages = useCallback(async () => {
    try {
      const res = await fetch(
        `${API_URL}/api/stall/messages/${listing.listing_id}/${otherUserId}`,
        { credentials: "include" }
      );
      if (res.ok) setMessages(await res.json());
    } catch {}
    finally { setLoading(false); }
  }, [listing.listing_id, otherUserId]);

  // Lock body scroll synchronously before first paint — prevents window scroll gap
  useLayoutEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  useEffect(() => {
    fetchMessages();
    intervalRef.current = setInterval(fetchMessages, 3000);
    return () => { clearInterval(intervalRef.current); };
  }, [fetchMessages]);

  const handleScroll = () => {
    const el = scrollAreaRef.current;
    if (!el) return;
    isAtBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 60;
  };

  const scrollToBottom = useCallback(() => {
    const el = scrollAreaRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, []);

  // Auto-scroll only when user is already at the bottom, or on initial load
  useEffect(() => {
    if (!loading && isAtBottom.current) {
      scrollToBottom();
    }
  }, [messages, loading, scrollToBottom]);

  const handleSend = async () => {
    const text = newMsg.trim();
    if (!text || sending) return;
    setNewMsg("");
    if (textareaRef.current) { textareaRef.current.style.height = "auto"; }
    setSending(true);
    try {
      const res = await fetch(`${API_URL}/api/stall/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          listing_id: listing.listing_id,
          receiver_id: otherUserId,
          content: text,
        }),
      });
      if (res.ok) fetchMessages();
      else { const e = await res.json(); toast.error(parseApiError(e.detail, "Failed to send")); }
    } catch { toast.error("Something went wrong"); }
    finally { setSending(false); }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const autoResize = (el) => {
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 120) + "px";
  };

  return (
    <div className="fixed inset-0 lg:left-60 z-50 flex flex-col bg-background">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border/40 bg-card shrink-0">
        <button
          onClick={onClose}
          className="p-1.5 -ml-1 rounded-lg text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>

        {listing.images?.[0]
          ? <img src={listing.images[0]} alt="" className="w-9 h-9 rounded-lg object-cover shrink-0" />
          : <div className="w-9 h-9 rounded-lg bg-secondary/50 flex items-center justify-center shrink-0">
              <ShoppingBag className="h-4 w-4 text-muted-foreground/40" />
            </div>
        }

        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-foreground line-clamp-1">{listing.title}</p>
          <p className="text-xs text-muted-foreground">with {listing.seller_name}</p>
        </div>

        <button onClick={onClose} className="text-xs text-primary hover:underline shrink-0">
          Back to listing
        </button>
      </div>

      {/* Messages area */}
      <div ref={scrollAreaRef} onScroll={handleScroll} className="flex-1 overflow-y-auto px-4 py-4" style={{ overscrollBehavior: "contain" }}>
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="w-5 h-5 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-center pb-12">
            <MessageCircle className="h-12 w-12 text-muted-foreground/20" />
            <div>
              <p className="font-semibold text-foreground text-sm">Start the conversation</p>
              <p className="text-xs text-muted-foreground mt-1">
                Ask {listing.seller_name} about this listing.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-1.5">
            {messages.map((msg, i) => {
              const isMe = msg.sender_id === user?.user_id;
              const prev = messages[i - 1];
              const showTimestamp = i === 0 ||
                (prev && new Date(msg.created_at) - new Date(prev.created_at) > 10 * 60 * 1000);

              return (
                <div key={msg.message_id || i} className="group">
                  {showTimestamp && i > 0 && (
                    <p className="text-center text-[10px] text-muted-foreground/50 py-2">
                      {fmtTime(msg.created_at)}
                    </p>
                  )}
                  <div className={`flex items-end gap-1 ${isMe ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[78%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed break-words ${
                      isMe
                        ? "bg-primary text-primary-foreground rounded-br-md"
                        : "bg-card border border-border/60 text-foreground rounded-bl-md"
                    }`}>
                      {msg.content}
                    </div>
                    {!isMe && (
                      <button
                        onClick={() => { setReportMsg(msg); setReportReason(""); setReportDetails(""); }}
                        className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mb-1 p-1 rounded text-muted-foreground hover:text-destructive"
                        title="Report message"
                      >
                        <Flag className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* Input bar */}
      <div className="px-4 py-3 border-t border-border/40 bg-card shrink-0 flex items-end gap-2">
        <textarea
          ref={textareaRef}
          value={newMsg}
          onChange={e => { setNewMsg(e.target.value.slice(0, 500)); autoResize(e.target); }}
          onKeyDown={handleKeyDown}
          placeholder="Message…"
          rows={1}
          className="flex-1 resize-none bg-background border border-border rounded-2xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/60 outline-none focus:ring-2 focus:ring-primary/30 transition overflow-hidden"
        />
        <button
          onClick={handleSend}
          disabled={!newMsg.trim() || sending}
          className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center disabled:opacity-40 hover:opacity-90 active:scale-95 transition-all shrink-0 mb-px"
        >
          {sending
            ? <div className="w-4 h-4 rounded-full border-2 border-primary-foreground/40 border-t-primary-foreground animate-spin" />
            : <Send className="h-4 w-4" />
          }
        </button>
      </div>

      {/* Report Stall Message Dialog */}
      <Dialog open={!!reportMsg} onOpenChange={(o) => !o && setReportMsg(null)}>
        <DialogContent className="bg-card border-border/50 max-w-md [&>button]:hidden">
          <DialogHeader>
            <DialogTitle>Report Message</DialogTitle>
            <DialogDescription>
              This report will be reviewed by our moderation team. Please only report genuine concerns.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Reason</Label>
              <Select value={reportReason} onValueChange={setReportReason}>
                <SelectTrigger className="bg-secondary/50 border-border/50">
                  <SelectValue placeholder="Select a reason…" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="harassment">Harassment or bullying</SelectItem>
                  <SelectItem value="spam">Spam</SelectItem>
                  <SelectItem value="inappropriate">Inappropriate content</SelectItem>
                  <SelectItem value="hate_speech">Hate speech or discrimination</SelectItem>
                  <SelectItem value="unsafe">Unsafe or dangerous content</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Additional details <span className="text-muted-foreground font-normal">(optional)</span></Label>
              <Textarea
                value={reportDetails}
                onChange={e => setReportDetails(e.target.value.slice(0, 500))}
                placeholder="Tell us more about what happened…"
                className="bg-secondary/50 border-border/50 resize-none text-sm"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={() => setReportMsg(null)}>Cancel</Button>
            <Button
              variant="destructive"
              onClick={submitReport}
              disabled={!reportReason || reportSubmitting}
            >
              {reportSubmitting ? "Submitting…" : "Submit Report"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function StallListingDetail({ user }) {
  const { listingId } = useParams();
  const navigate = useNavigate();
  const [listing, setListing]       = useState(null);
  const [loading, setLoading]       = useState(true);
  const [photoIdx, setPhotoIdx]     = useState(0);
  const [saved, setSaved]           = useState(false);
  const [showChat, setShowChat]     = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason]   = useState("");
  const [reportDetails, setReportDetails] = useState("");

  const isAdmin   = user?.role === "admin" || user?.role === "moderator";
  const isPremium = user?.subscription_tier === "premium" || user?.subscription_tier === "trial" || isAdmin;

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API_URL}/api/stall/listings/${listingId}`, { credentials: "include" });
        if (res.ok) {
          const data = await res.json();
          setListing(data);
          setSaved(data.user_saved || false);
        } else navigate("/stall");
      } catch { navigate("/stall"); }
      finally { setLoading(false); }
    })();
  }, [listingId]);

  const toggleSave = async () => {
    if (!isPremium) { navigate("/plus"); return; }
    try {
      const res = await fetch(`${API_URL}/api/stall/listings/${listingId}/save`, {
        method: "POST",
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        setSaved(data.saved);
        toast.success(data.saved ? "Saved!" : "Removed from saved");
      }
    } catch {}
  };

  const handleReportListing = async () => {
    if (!reportReason || !listing) return;
    try {
      const res = await fetch(`${API_URL}/api/reports`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          content_type: "listing",
          content_id: listing.listing_id,
          reason: reportReason,
          details: reportDetails,
        }),
      });
      if (res.ok) {
        toast.success("Listing reported. Our team will review it shortly.");
      } else {
        const err = await res.json();
        toast.error(err.detail || "Failed to submit report");
      }
    } catch {
      toast.error("Something went wrong");
    }
    setReportOpen(false);
    setReportReason("");
    setReportDetails("");
  };

  if (loading) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="w-6 h-6 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
    </div>
  );

  if (!listing) return null;

  const typeStyle = TYPE_STYLES[listing.listing_type] || TYPE_STYLES.sell;
  const photos    = listing.images || [];
  const isOwn     = listing.is_own_listing;
  const isActive  = listing.status === "active";

  return (
    <div className="min-h-screen bg-background pb-32 lg:pl-60 lg:pb-0">
      <Navigation user={user} />

      {/* Full-screen chat panel */}
      {showChat && (
        <StallChatPanel
          listing={listing}
          user={user}
          onClose={() => setShowChat(false)}
        />
      )}

      <main className="max-w-3xl mx-auto px-4 pt-16 lg:pt-8 pb-8">
        {/* Back */}
        <button
          onClick={() => navigate("/stall")}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4 mt-2 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Stall
        </button>

        <div className="lg:grid lg:grid-cols-2 lg:gap-8">
          {/* Left — photos */}
          <div className="mb-5 lg:mb-0">
            <div className="relative rounded-2xl overflow-hidden bg-secondary/30 aspect-[4/3]">
              {photos.length > 0 ? (
                <>
                  <img src={photos[photoIdx]} alt={listing.title} className="w-full h-full object-cover" />
                  {photos.length > 1 && (
                    <>
                      <button
                        onClick={() => setPhotoIdx(i => (i - 1 + photos.length) % photos.length)}
                        className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-card/80 backdrop-blur-sm flex items-center justify-center hover:bg-card transition-colors"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setPhotoIdx(i => (i + 1) % photos.length)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-card/80 backdrop-blur-sm flex items-center justify-center hover:bg-card transition-colors"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </button>
                      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                        {photos.map((_, i) => (
                          <div key={i} className={`w-1.5 h-1.5 rounded-full transition-colors ${i === photoIdx ? "bg-white" : "bg-white/50"}`} />
                        ))}
                      </div>
                    </>
                  )}
                </>
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground/30">
                  <ShoppingBag className="h-16 w-16" />
                </div>
              )}

              {/* Status overlay */}
              {!isActive && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <span className="bg-card px-4 py-2 rounded-full font-semibold text-foreground capitalize">
                    {listing.status}
                  </span>
                </div>
              )}
            </div>

            {/* Thumbnail strip */}
            {photos.length > 1 && (
              <div className="flex gap-2 mt-2">
                {photos.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setPhotoIdx(i)}
                    className={`w-16 h-16 rounded-xl overflow-hidden border-2 transition-colors ${i === photoIdx ? "border-primary" : "border-transparent"}`}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right — details */}
          <div className="space-y-4">
            {/* Type + save */}
            <div className="flex items-start justify-between gap-2">
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${typeStyle.bg}`}>
                {typeStyle.label}
              </span>
              <button
                onClick={toggleSave}
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                {saved ? <BookmarkCheck className="h-4 w-4 text-primary" /> : <Bookmark className="h-4 w-4" />}
                {saved ? "Saved" : "Save"}
              </button>
            </div>

            {/* Title */}
            <h1 className="font-heading text-2xl font-bold text-foreground leading-tight">{listing.title}</h1>

            {/* Price */}
            <div className="text-3xl font-bold font-heading">
              {listing.listing_type === "give_away" && <span className="text-amber-600 dark:text-amber-400">Free</span>}
              {listing.listing_type === "sell" && (
                listing.make_offer
                  ? <span className="text-emerald-600 dark:text-emerald-400 text-2xl">Make an offer</span>
                  : listing.price != null
                    ? <span className="text-emerald-600 dark:text-emerald-400">${listing.price.toFixed(0)}</span>
                    : <span className="text-muted-foreground text-xl">POA</span>
              )}
              {listing.listing_type === "swap" && <span className="text-sky-600 dark:text-sky-400 text-2xl">Swap</span>}
              {listing.listing_type === "wanted" && (
                listing.price
                  ? <span className="text-violet-600 dark:text-violet-400">Up to ${listing.price.toFixed(0)}</span>
                  : <span className="text-violet-600 dark:text-violet-400 text-2xl">Wanted</span>
              )}
            </div>

            {/* Chips */}
            <div className="flex flex-wrap gap-2 text-xs">
              {listing.condition && <span className="px-2.5 py-1 rounded-full bg-secondary border border-border/50 text-muted-foreground">{CONDITION_LABELS[listing.condition] || listing.condition}</span>}
              {listing.category  && <span className="px-2.5 py-1 rounded-full bg-secondary border border-border/50 text-muted-foreground capitalize">{listing.category}</span>}
              {listing.age_group && <span className="px-2.5 py-1 rounded-full bg-secondary border border-border/50 text-muted-foreground">{listing.age_group}</span>}
              {listing.postage_available && <span className="px-2.5 py-1 rounded-full bg-secondary border border-border/50 text-muted-foreground">📦 Postage available</span>}
            </div>

            {/* Swap for */}
            {listing.listing_type === "swap" && listing.swap_for && (
              <div className="p-3 bg-sky-500/5 border border-sky-500/20 rounded-xl text-sm">
                <span className="font-medium text-sky-700 dark:text-sky-400">Looking for:</span>{" "}
                <span className="text-foreground">{listing.swap_for}</span>
              </div>
            )}

            {/* Description */}
            {listing.description && (
              <p className="text-sm text-foreground leading-relaxed">{listing.description}</p>
            )}

            {/* Location + time */}
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              {listing.suburb && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" />
                  {listing.suburb}{listing.state ? `, ${listing.state}` : ""}
                </span>
              )}
              <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{fmtTime(listing.created_at)}</span>
              {listing.views > 0 && <span className="ml-auto">{listing.views} views</span>}
            </div>

            {/* Seller card */}
            <div className="bg-card border border-border/50 rounded-2xl p-3.5 flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={listing.seller_picture} />
                <AvatarFallback className="bg-primary/20 text-primary text-sm">
                  {listing.seller_name?.[0]?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground flex items-center gap-1">
                  {listing.seller_name}
                  <Crown className="h-3 w-3 text-amber-500" />
                </p>
                <p className="text-xs text-muted-foreground">Village+ member</p>
              </div>
              <Link to={`/profile/${listing.seller_id}`} className="text-xs text-primary hover:underline">
                View profile
              </Link>
            </div>

            {/* Safety + payment disclaimer */}
            <div className="text-xs text-muted-foreground bg-secondary/30 rounded-xl p-3.5 leading-relaxed space-y-1.5">
              <p className="font-medium text-foreground/80">🤝 User-to-user transaction</p>
              <p>The Village Stall connects buyers and sellers — we don't process payments, handle disputes, or take responsibility for transactions. All deals are between you and the other party.</p>
              <p>💡 Meet in a public place · Use PayID, cash or bank transfer · Never pay in advance for postage without verification.</p>
            </div>

            {/* Report listing link — not own listing */}
            {!isOwn && (
              <button
                onClick={() => setReportOpen(true)}
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-destructive transition-colors"
              >
                <Flag className="h-3.5 w-3.5" />
                Report this listing
              </button>
            )}
          </div>
        </div>
      </main>

      {/* Sticky CTA — not own listing, active */}
      {!isOwn && isActive && (
        <div className="fixed bottom-16 left-0 right-0 lg:bottom-0 lg:left-60 z-40 p-4 bg-background/80 backdrop-blur-md border-t border-border/40">
          <div className="max-w-3xl mx-auto flex gap-3">
            <Button variant="outline" className="flex-1 rounded-xl" onClick={toggleSave}>
              {saved
                ? <><BookmarkCheck className="h-4 w-4 mr-1.5" />Saved</>
                : <><Bookmark className="h-4 w-4 mr-1.5" />Save</>
              }
            </Button>
            {isPremium ? (
              <Button
                className="flex-1 rounded-xl shadow-lg shadow-primary/20"
                onClick={() => setShowChat(true)}
              >
                <MessageCircle className="h-4 w-4 mr-1.5" />
                Message seller
              </Button>
            ) : (
              <Button className="flex-1 rounded-xl" onClick={() => navigate("/plus")}>
                <Crown className="h-4 w-4 mr-1.5" />
                Upgrade to message
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Own listing actions */}
      {isOwn && (
        <div className="fixed bottom-16 left-0 right-0 lg:bottom-0 lg:left-60 z-40 p-4 bg-background/80 backdrop-blur-md border-t border-border/40">
          <div className="max-w-3xl mx-auto flex gap-3">
            <Button
              variant="outline"
              className="flex-1 rounded-xl"
              onClick={() => navigate(`/stall/listing/${listingId}/edit`)}
            >
              Edit listing
            </Button>
            {isActive && (
              <Button
                className="flex-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white"
                onClick={() => navigate("/stall?tab=messages")}
              >
                <MessageCircle className="h-4 w-4 mr-1.5" />
                View enquiries
              </Button>
            )}
          </div>
        </div>
      )}

      <AppFooter />

      {/* Report Listing Dialog */}
      <Dialog open={reportOpen} onOpenChange={(open) => { if (!open) { setReportOpen(false); setReportReason(""); setReportDetails(""); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Report Listing</DialogTitle>
            <DialogDescription>
              Help us keep The Village Stall safe. Our moderation team will review this report.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Reason for reporting</Label>
              <Select value={reportReason} onValueChange={setReportReason}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a reason" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="misleading">Misleading or inaccurate description</SelectItem>
                  <SelectItem value="scam">Suspected scam</SelectItem>
                  <SelectItem value="prohibited">Prohibited or unsafe item</SelectItem>
                  <SelectItem value="spam">Spam or duplicate listing</SelectItem>
                  <SelectItem value="inappropriate">Inappropriate content</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Additional details <span className="text-muted-foreground font-normal">(optional)</span></Label>
              <Textarea
                value={reportDetails}
                onChange={(e) => setReportDetails(e.target.value)}
                placeholder="Provide any additional context..."
                className="min-h-[80px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setReportOpen(false); setReportReason(""); setReportDetails(""); }}>Cancel</Button>
            <Button onClick={handleReportListing} disabled={!reportReason}>Submit Report</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
