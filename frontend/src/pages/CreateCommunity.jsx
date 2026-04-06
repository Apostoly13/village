import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Label } from "../components/ui/label";
import Navigation from "../components/Navigation";
import { toast } from "sonner";
import { ArrowLeft, Crown, Users } from "lucide-react";

const API_URL = process.env.REACT_APP_BACKEND_URL;

const SUGGESTED_ICONS = ["🌟", "💬", "🏡", "🌿", "🎉", "🤝", "💪", "🧡", "🌈", "📚", "🍃", "🎈"];

export default function CreateCommunity({ user }) {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [icon, setIcon] = useState("🌟");
  const [loading, setLoading] = useState(false);
  const [existingCount, setExistingCount] = useState(0);
  const [loadingCount, setLoadingCount] = useState(true);

  const isPremium = user?.subscription_tier === "premium" || user?.role === "admin";

  useEffect(() => {
    fetchExistingCount();
  }, []);

  const fetchExistingCount = async () => {
    try {
      const res = await fetch(`${API_URL}/api/forums/categories`, { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        const mine = data.filter(
          (c) => c.is_user_created && c.created_by === user?.user_id
        ).length;
        setExistingCount(mine);
      }
    } catch (error) {
      console.error("Error fetching communities:", error);
    } finally {
      setLoadingCount(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (name.trim().length < 3) {
      toast.error("Community name must be at least 3 characters");
      return;
    }
    if (description.trim().length < 10) {
      toast.error("Description must be at least 10 characters");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/forums/communities`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name: name.trim(), description: description.trim(), icon }),
      });

      if (res.ok) {
        const community = await res.json();
        toast.success("Community created!");
        navigate(`/forums/${community.category_id}`);
      } else if (res.status === 403) {
        toast.error("Premium subscription required to create communities");
      } else if (res.status === 429) {
        toast.error("You can only create up to 3 communities");
      } else if (res.status === 409) {
        toast.error("A community with that name already exists");
      } else {
        const err = await res.json();
        toast.error(err.detail || "Failed to create community");
      }
    } catch (error) {
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  if (!isPremium) {
    return (
      <div className="min-h-screen bg-background pb-20 lg:pb-0">
        <Navigation user={user} />
        <main className="max-w-2xl mx-auto px-4 pt-20 lg:pt-24">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
          <div className="bg-card rounded-2xl p-8 border border-border/50 text-center">
            <div className="w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center mx-auto mb-4">
              <Crown className="h-8 w-8 text-amber-500" />
            </div>
            <h2 className="font-heading text-2xl font-bold text-foreground mb-2">Premium Feature</h2>
            <p className="text-muted-foreground mb-6">
              Creating your own community is a Premium perk. Upgrade to create up to 3 sub-communities
              and become their moderator.
            </p>
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full shadow-[0_0_15px_rgba(245,197,66,0.3)]">
              Upgrade to Premium
            </Button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20 lg:pb-0">
      <Navigation user={user} />

      <main className="max-w-2xl mx-auto px-4 pt-20 lg:pt-24">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>

        <div className="bg-card rounded-2xl p-6 border border-border/50">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="font-heading text-2xl font-bold text-foreground">Create Community</h1>
              {!loadingCount && (
                <p className="text-xs text-muted-foreground">{existingCount}/3 communities used</p>
              )}
            </div>
          </div>

          {existingCount >= 3 ? (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-center">
              <p className="font-medium text-foreground mb-1">Community limit reached</p>
              <p className="text-sm text-muted-foreground">
                You've created 3 communities. Delete one to create another.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Icon picker */}
              <div className="space-y-2">
                <Label className="text-foreground">Community Icon</Label>
                <div className="flex flex-wrap gap-2">
                  {SUGGESTED_ICONS.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => setIcon(emoji)}
                      className={`text-2xl p-2 rounded-xl transition-all ${
                        icon === emoji
                          ? "bg-primary/20 ring-2 ring-primary scale-110"
                          : "bg-secondary/50 hover:bg-secondary"
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <Label className="text-xs text-muted-foreground shrink-0">Custom emoji:</Label>
                  <Input
                    value={icon}
                    onChange={(e) => setIcon(e.target.value.slice(0, 4))}
                    className="h-9 w-20 rounded-lg bg-secondary/50 border-transparent text-center text-lg"
                    placeholder="🏡"
                  />
                </div>
              </div>

              {/* Name */}
              <div className="space-y-2">
                <Label htmlFor="name" className="text-foreground">Community Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value.slice(0, 60))}
                  placeholder="e.g. Aussie Veggie Parents"
                  className="h-12 rounded-xl bg-secondary/50 border-transparent focus:border-primary"
                  maxLength={60}
                />
                <p className="text-xs text-muted-foreground text-right">{name.length}/60</p>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description" className="text-foreground">Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value.slice(0, 200))}
                  placeholder="What is this community about?"
                  className="min-h-[100px] rounded-xl bg-secondary/50 border-transparent focus:border-primary resize-none"
                  maxLength={200}
                />
                <p className="text-xs text-muted-foreground text-right">{description.length}/200</p>
              </div>

              {/* Preview */}
              {name.trim() && (
                <div className="p-4 rounded-xl bg-secondary/30 border border-border/30">
                  <p className="text-xs text-muted-foreground mb-2">Preview</p>
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{icon}</span>
                    <div>
                      <p className="font-heading font-bold text-foreground">{name.trim() || "Community name"}</p>
                      <p className="text-sm text-muted-foreground line-clamp-1">{description.trim() || "Description"}</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate(-1)}
                  className="flex-1 h-12 rounded-xl"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  className="flex-1 h-12 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_0_15px_rgba(245,197,66,0.3)]"
                >
                  {loading ? "Creating..." : "Create Community"}
                </Button>
              </div>
            </form>
          )}
        </div>
      </main>
    </div>
  );
}
