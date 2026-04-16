import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Button } from "../components/ui/button";
import Navigation from "../components/Navigation";
import AppFooter from "../components/AppFooter";
import { ArrowLeft, MapPin, Clock, Bookmark, BookmarkCheck, Tag, ArrowLeftRight, Heart, Search, MessageCircle, Crown, ChevronLeft, ChevronRight, Send, X, AlertTriangle, ShoppingBag, Check } from "lucide-react";
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

function MessageModal({ listing, user, onClose }) {
  const [message, setMessage] = useState(
    `Hi! I'm interested in your "${listing.title}". Is it still available?`
  );
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSend = async () => {
    if (!message.trim()) return;
    setSending(true);
    try {
      const res = await fetch(`${API_URL}/api/stall/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          listing_id: listing.listing_id,
          receiver_id: listing.seller_id,
          content: message.trim(),
        }),
      });
      if (res.ok) {
        setSent(true);
        toast.success("Message sent!");
      } else {
        const err = await res.json();
        toast.error(parseApiError(err.detail, "Failed to send message"));
      }
    } catch { toast.error("Something went wrong"); }
    finally { setSending(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4">
      <div className="bg-card rounded-2xl w-full max-w-md p-5 space-y-4 shadow-xl">
        {/* Listing preview */}
        <div className="flex items-center gap-3 pb-3 border-b border-border/40">
          {listing.images?.[0]
            ? <img src={listing.images[0]} alt="" className="w-12 h-12 rounded-xl object-cover shrink-0" />
            : <div className="w-12 h-12 rounded-xl bg-secondary/50 flex items-center justify-center shrink-0"><ShoppingBag className="h-5 w-5 text-muted-foreground" /></div>
          }
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground line-clamp-1">{listing.title}</p>
            <p className="text-xs text-muted-foreground">to {listing.seller_name}</p>
          </div>
          <button onClick={onClose} className="ml-auto p-1 text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
        </div>

        {sent ? (
          <div className="text-center py-4 space-y-2">
            <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto">
              <Check className="h-6 w-6 text-emerald-600" />
            </div>
            <p className="font-semibold text-foreground">Message sent!</p>
            <p className="text-xs text-muted-foreground">You can continue the conversation in your Stall Messages inbox.</p>
            <Button variant="outline" className="rounded-full w-full mt-2" onClick={onClose}>Done</Button>
          </div>
        ) : (
          <>
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Your message</label>
              <textarea
                value={message}
                onChange={e => setMessage(e.target.value.slice(0, 500))}
                rows={4}
                className="w-full rounded-xl border border-border bg-card text-foreground px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                autoFocus
              />
              <p className="text-xs text-muted-foreground mt-1">{message.length}/500</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1 rounded-xl" onClick={onClose}>Cancel</Button>
              <Button className="flex-1 rounded-xl" disabled={sending || !message.trim()} onClick={handleSend}>
                <Send className="h-4 w-4 mr-1.5" />
                {sending ? "Sending…" : "Send"}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function StallListingDetail({ user }) {
  const { listingId } = useParams();
  const navigate = useNavigate();
  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [photoIdx, setPhotoIdx] = useState(0);
  const [saved, setSaved] = useState(false);
  const [showMessage, setShowMessage] = useState(false);

  const isAdmin = user?.role === "admin" || user?.role === "moderator";
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
      const res = await fetch(`${API_URL}/api/stall/listings/${listingId}/save`, { method: "POST", credentials: "include" });
      if (res.ok) { const data = await res.json(); setSaved(data.saved); toast.success(data.saved ? "Saved!" : "Removed from saved"); }
    } catch {}
  };

  if (loading) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="w-6 h-6 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
    </div>
  );

  if (!listing) return null;

  const typeStyle = TYPE_STYLES[listing.listing_type] || TYPE_STYLES.sell;
  const photos = listing.images || [];
  const isOwn = listing.is_own_listing;
  const isActive = listing.status === "active";

  const formatTime = (d) => { try { return formatDistanceToNow(new Date(d), { addSuffix: true }); } catch { return ""; } };

  return (
    <div className="min-h-screen bg-background pb-32 lg:pb-0">
      <Navigation user={user} />
      {showMessage && <MessageModal listing={listing} user={user} onClose={() => setShowMessage(false)} />}

      <main className="max-w-3xl mx-auto px-4 pt-20 lg:pt-24 pb-8">
        {/* Back */}
        <button onClick={() => navigate("/stall")} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4 mt-2 transition-colors">
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
                      <button onClick={() => setPhotoIdx(i => (i - 1 + photos.length) % photos.length)} className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-card/80 backdrop-blur-sm flex items-center justify-center hover:bg-card transition-colors">
                        <ChevronLeft className="h-4 w-4" />
                      </button>
                      <button onClick={() => setPhotoIdx(i => (i + 1) % photos.length)} className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-card/80 backdrop-blur-sm flex items-center justify-center hover:bg-card transition-colors">
                        <ChevronRight className="h-4 w-4" />
                      </button>
                      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                        {photos.map((_, i) => <div key={i} className={`w-1.5 h-1.5 rounded-full transition-colors ${i === photoIdx ? "bg-white" : "bg-white/50"}`} />)}
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
                  <span className="bg-card px-4 py-2 rounded-full font-semibold text-foreground capitalize">{listing.status}</span>
                </div>
              )}
            </div>

            {/* Thumbnail strip */}
            {photos.length > 1 && (
              <div className="flex gap-2 mt-2">
                {photos.map((img, i) => (
                  <button key={i} onClick={() => setPhotoIdx(i)} className={`w-16 h-16 rounded-xl overflow-hidden border-2 transition-colors ${i === photoIdx ? "border-primary" : "border-transparent"}`}>
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
              <button onClick={toggleSave} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
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
                listing.make_offer ? <span className="text-emerald-600 dark:text-emerald-400 text-2xl">Make an offer</span>
                : listing.price != null ? <span className="text-emerald-600 dark:text-emerald-400">${listing.price.toFixed(0)}</span>
                : <span className="text-muted-foreground text-xl">POA</span>
              )}
              {listing.listing_type === "swap" && <span className="text-sky-600 dark:text-sky-400 text-2xl">Swap</span>}
              {listing.listing_type === "wanted" && (
                listing.price ? <span className="text-violet-600 dark:text-violet-400">Up to ${listing.price.toFixed(0)}</span>
                : <span className="text-violet-600 dark:text-violet-400 text-2xl">Wanted</span>
              )}
            </div>

            {/* Chips */}
            <div className="flex flex-wrap gap-2 text-xs">
              {listing.condition && <span className="px-2.5 py-1 rounded-full bg-secondary border border-border/50 text-muted-foreground">{CONDITION_LABELS[listing.condition] || listing.condition}</span>}
              {listing.category && <span className="px-2.5 py-1 rounded-full bg-secondary border border-border/50 text-muted-foreground capitalize">{listing.category}</span>}
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
              {listing.suburb && <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{listing.suburb}{listing.state ? `, ${listing.state}` : ""}</span>}
              <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{formatTime(listing.created_at)}</span>
              {listing.views > 0 && <span className="ml-auto">{listing.views} views</span>}
            </div>

            {/* Seller card */}
            <div className="bg-card border border-border/50 rounded-2xl p-3.5 flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={listing.seller_picture} />
                <AvatarFallback className="bg-primary/20 text-primary text-sm">{listing.seller_name?.[0]?.toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground flex items-center gap-1">
                  {listing.seller_name}
                  <Crown className="h-3 w-3 text-amber-500" />
                </p>
                <p className="text-xs text-muted-foreground">Village+ member</p>
              </div>
              <Link to={`/profile/${listing.seller_id}`} className="text-xs text-primary hover:underline">View profile</Link>
            </div>

            {/* Safety tip */}
            <div className="text-xs text-muted-foreground bg-secondary/30 rounded-xl p-3 leading-relaxed">
              💡 Meet in a public place. Cash or PayID only — The Village doesn't handle payments.
            </div>
          </div>
        </div>
      </main>

      {/* Sticky CTA (not own listing, active listing) */}
      {!isOwn && isActive && (
        <div className="fixed bottom-16 left-0 right-0 lg:bottom-0 z-40 p-4 bg-background/80 backdrop-blur-md border-t border-border/40">
          <div className="max-w-3xl mx-auto flex gap-3">
            <Button variant="outline" className="flex-1 rounded-xl" onClick={toggleSave}>
              {saved ? <><BookmarkCheck className="h-4 w-4 mr-1.5" />Saved</> : <><Bookmark className="h-4 w-4 mr-1.5" />Save</>}
            </Button>
            {isPremium ? (
              <Button className="flex-1 rounded-xl shadow-lg shadow-primary/20" onClick={() => setShowMessage(true)}>
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
        <div className="fixed bottom-16 left-0 right-0 lg:bottom-0 z-40 p-4 bg-background/80 backdrop-blur-md border-t border-border/40">
          <div className="max-w-3xl mx-auto flex gap-3">
            <Button variant="outline" className="flex-1 rounded-xl" onClick={() => navigate(`/stall/listing/${listingId}/edit`)}>
              Edit listing
            </Button>
            {isActive && (
              <Button className="flex-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => navigate("/stall?tab=my")}>
                Manage
              </Button>
            )}
          </div>
        </div>
      )}

      <AppFooter />
    </div>
  );
}
