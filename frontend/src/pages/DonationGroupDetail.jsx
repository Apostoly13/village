import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Button } from "../components/ui/button";
import Navigation from "../components/Navigation";
import AppFooter from "../components/AppFooter";
import { ArrowLeft, MapPin, Users, ShoppingBag, Heart, Plus, Calendar } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";

const API_URL = process.env.REACT_APP_BACKEND_URL;

const TYPE_STYLES = {
  sell:      "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20",
  swap:      "bg-sky-500/10 text-sky-700 dark:text-sky-400 border-sky-500/20",
  give_away: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20",
  wanted:    "bg-violet-500/10 text-violet-700 dark:text-violet-400 border-violet-500/20",
};

export default function DonationGroupDetail({ user }) {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const [group, setGroup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);

  const isAdmin = user?.role === "admin" || user?.role === "moderator";
  const isPremium = user?.subscription_tier === "premium" || user?.subscription_tier === "trial" || isAdmin;

  const fetchGroup = async () => {
    try {
      const res = await fetch(`${API_URL}/api/stall/groups/${groupId}`, { credentials: "include" });
      if (res.ok) setGroup(await res.json());
      else navigate("/stall");
    } catch { navigate("/stall"); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchGroup(); }, [groupId]);

  const handleJoinLeave = async () => {
    if (!isPremium) { navigate("/plus"); return; }
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

  if (loading) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="w-6 h-6 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
    </div>
  );

  if (!group) return null;

  const items = group.items || [];
  const formatTime = (d) => { try { return formatDistanceToNow(new Date(d), { addSuffix: true }); } catch { return ""; } };

  return (
    <div className="min-h-screen bg-background pb-20 lg:pl-60 lg:pb-0">
      <Navigation user={user} />

      <main className="max-w-3xl mx-auto px-4 pt-16 lg:pt-8 pb-16">
        {/* Back */}
        <button onClick={() => navigate("/stall")} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4 mt-2 transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back to Stall
        </button>

        {/* Hero card */}
        <div className="village-card overflow-hidden mb-6">
          {group.cover_image && (
            <img src={group.cover_image} alt={group.name} className="w-full h-40 object-cover" />
          )}
          <div className="p-5">
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
              <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" />{group.member_ids?.length || 0} members</span>
              <span className="flex items-center gap-1"><ShoppingBag className="h-3.5 w-3.5" />{group.item_count || 0} items donated</span>
              {group.suburb && <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{group.suburb}</span>}
              {group.end_date && <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />Closes {new Date(group.end_date).toLocaleDateString("en-AU", { day: "numeric", month: "long" })}</span>}
            </div>

            {/* Organiser */}
            <div className="flex items-center gap-2 mt-4 pt-4 border-t border-border/30">
              <Avatar className="h-7 w-7">
                <AvatarImage src={group.organiser_picture} />
                <AvatarFallback className="bg-primary/20 text-primary text-xs">{group.organiser_name?.[0]}</AvatarFallback>
              </Avatar>
              <span className="text-xs text-muted-foreground">Organised by <span className="text-foreground font-medium">{group.organiser_name}</span></span>

              {/* Join / Leave */}
              <div className="ml-auto flex gap-2">
                {group.is_organiser ? (
                  <span className="text-xs text-primary font-medium">You're the organiser</span>
                ) : (
                  <Button
                    size="sm"
                    variant={group.is_member ? "outline" : "default"}
                    className="rounded-full h-8 text-xs"
                    disabled={joining}
                    onClick={handleJoinLeave}
                  >
                    {joining ? "…" : group.is_member ? "Leave group" : "Join group"}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Donate into group CTA */}
        {group.is_member && group.status === "active" && (
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-heading font-semibold text-sm text-foreground">Items in this group</h2>
            <Button variant="outline" size="sm" className="rounded-full h-8 text-xs" onClick={() => navigate(`/stall/new?group=${groupId}`)}>
              <Plus className="h-3.5 w-3.5 mr-1" /> Donate an item
            </Button>
          </div>
        )}

        {!group.is_member && (
          <div className="mb-4">
            <h2 className="font-heading font-semibold text-sm text-foreground mb-1">Items in this group</h2>
          </div>
        )}

        {/* Items grid */}
        {items.length === 0 ? (
          <div className="text-center py-12">
            <Heart className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="font-heading font-semibold text-foreground text-sm mb-1">No items yet</p>
            <p className="text-xs text-muted-foreground">
              {group.is_member ? "Be the first to donate something to this group." : "Join the group to donate items."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {items.map(item => {
              const firstImage = item.images?.[0];
              return (
                <Link key={item.listing_id} to={`/stall/listing/${item.listing_id}`} className="village-card village-card-hover overflow-hidden flex flex-col">
                  <div className="aspect-[4/3] bg-secondary/30 relative">
                    {firstImage
                      ? <img src={firstImage} alt={item.title} className="w-full h-full object-cover" />
                      : <div className="w-full h-full flex items-center justify-center text-muted-foreground/30"><ShoppingBag className="h-8 w-8" /></div>
                    }
                    <span className={`absolute top-2 left-2 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${TYPE_STYLES[item.listing_type] || ""}`}>
                      Free
                    </span>
                  </div>
                  <div className="p-3">
                    <h3 className="font-semibold text-[13px] leading-snug line-clamp-2 text-foreground">{item.title}</h3>
                    <p className="text-[11px] text-muted-foreground mt-1">{formatTime(item.created_at)}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>

      <AppFooter />
    </div>
  );
}
