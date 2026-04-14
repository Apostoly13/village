import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Label } from "../components/ui/label";
import Navigation from "../components/Navigation";
import AppFooter from "../components/AppFooter";
import { toast } from "sonner";
import { ArrowLeft, Crown, Users, Search, Upload, X, Lock, Globe, MapPin, Eye, EyeOff, ChevronDown, ChevronUp } from "lucide-react";
import { Link } from "react-router-dom";

const API_URL = process.env.REACT_APP_BACKEND_URL;

// ── Large emoji library with search keywords ─────────────────────────────────
const EMOJI_DATA = [
  // People & Family
  { e: "👶", k: "baby infant newborn child" },
  { e: "🤱", k: "breastfeed nursing baby mother feed" },
  { e: "🧒", k: "child kid young" },
  { e: "👧", k: "girl child daughter" },
  { e: "👦", k: "boy child son" },
  { e: "👩", k: "woman mother mum" },
  { e: "👨", k: "man father dad" },
  { e: "🤰", k: "pregnant expecting bump" },
  { e: "👪", k: "family parents children" },
  { e: "👨‍👩‍👦", k: "family parents son" },
  { e: "👨‍👩‍👧", k: "family parents daughter" },
  { e: "👨‍👩‍👧‍👦", k: "family parents children" },
  { e: "🧑‍🍼", k: "baby bottle feeding parent" },
  { e: "👼", k: "angel baby cherub" },
  { e: "🫂", k: "hug embrace support" },
  { e: "🤝", k: "handshake support together community" },
  { e: "👋", k: "wave hello greeting" },
  { e: "🙏", k: "pray thanks grateful" },
  { e: "💪", k: "strong muscle support" },
  // Hearts & Feelings
  { e: "❤️", k: "heart love red" },
  { e: "🧡", k: "heart love orange" },
  { e: "💛", k: "heart love yellow" },
  { e: "💚", k: "heart love green" },
  { e: "💙", k: "heart love blue" },
  { e: "💜", k: "heart love purple" },
  { e: "🤍", k: "heart love white" },
  { e: "💕", k: "hearts love two" },
  { e: "💗", k: "heart pink growing" },
  { e: "💞", k: "hearts revolving love" },
  { e: "💓", k: "heart beating" },
  { e: "🥰", k: "love happy smiling face" },
  { e: "😊", k: "smile happy face" },
  { e: "😴", k: "sleep tired night" },
  { e: "🥱", k: "yawn tired sleepy" },
  { e: "😰", k: "anxious worried stress" },
  // Nature & Plants
  { e: "🌿", k: "plant nature green leaf" },
  { e: "🍃", k: "leaf green nature" },
  { e: "🌱", k: "seedling plant grow" },
  { e: "🌸", k: "blossom flower spring pink" },
  { e: "🌺", k: "flower hibiscus" },
  { e: "🌻", k: "sunflower yellow flower" },
  { e: "🌈", k: "rainbow colour hope" },
  { e: "☀️", k: "sun sunshine warm" },
  { e: "🌙", k: "moon night sleep" },
  { e: "⭐", k: "star night sky" },
  { e: "🌟", k: "star glowing shine" },
  { e: "✨", k: "sparkle shine glitter" },
  { e: "🌊", k: "wave ocean sea water" },
  { e: "🏔️", k: "mountain peak high" },
  { e: "🌲", k: "tree forest nature" },
  { e: "🌴", k: "palm tree tropical beach" },
  { e: "🍀", k: "clover luck four leaf" },
  { e: "🦋", k: "butterfly nature pretty" },
  { e: "🐝", k: "bee honey busy" },
  { e: "🌞", k: "sun happy warm" },
  // Food & Drink
  { e: "🍼", k: "bottle baby milk feed" },
  { e: "🥛", k: "milk drink white" },
  { e: "🍵", k: "tea cup warm drink" },
  { e: "☕", k: "coffee hot drink caffeine" },
  { e: "🍎", k: "apple fruit red" },
  { e: "🥦", k: "broccoli vegetable green" },
  { e: "🥕", k: "carrot vegetable orange" },
  { e: "🍓", k: "strawberry fruit red" },
  { e: "🥝", k: "kiwi fruit green" },
  { e: "🌽", k: "corn vegetable yellow" },
  { e: "🥗", k: "salad healthy green" },
  { e: "🍳", k: "egg cook breakfast" },
  { e: "🥞", k: "pancake breakfast" },
  { e: "🧁", k: "cupcake cake sweet birthday" },
  { e: "🎂", k: "cake birthday celebration" },
  { e: "🍕", k: "pizza food" },
  { e: "🍿", k: "popcorn movies snack" },
  // Home & Life
  { e: "🏡", k: "house home family" },
  { e: "🏠", k: "house home" },
  { e: "🛋️", k: "sofa couch home lounge" },
  { e: "🛁", k: "bath tub clean" },
  { e: "🧸", k: "teddy bear toy baby soft" },
  { e: "🪆", k: "toy doll matryoshka" },
  { e: "🧩", k: "puzzle game play" },
  { e: "📚", k: "books read learn study" },
  { e: "📖", k: "book read open" },
  { e: "✏️", k: "pencil write draw" },
  { e: "🎨", k: "art paint colour creative" },
  { e: "🧶", k: "yarn knit craft wool" },
  { e: "🧹", k: "broom clean sweep" },
  { e: "🪴", k: "plant pot home garden" },
  // Activities & Sport
  { e: "⚽", k: "soccer football sport" },
  { e: "🏊", k: "swim pool water sport" },
  { e: "🚴", k: "cycle bike sport" },
  { e: "🧘", k: "yoga meditate calm wellness" },
  { e: "🎮", k: "game controller video play" },
  { e: "🎯", k: "target goal dart aim" },
  { e: "🎸", k: "guitar music rock" },
  { e: "🎵", k: "music note sing" },
  { e: "🎭", k: "theatre drama performance" },
  { e: "🎪", k: "circus tent fun" },
  { e: "🏋️", k: "weights gym fitness strong" },
  { e: "🤸", k: "gymnastics flexible sport" },
  { e: "🎉", k: "party celebrate confetti" },
  { e: "🎊", k: "celebration confetti party" },
  { e: "🎈", k: "balloon party birthday" },
  // Local & Community
  { e: "📍", k: "pin location map local place" },
  { e: "🗺️", k: "map travel place explore" },
  { e: "🏙️", k: "city urban buildings" },
  { e: "🌆", k: "cityscape evening" },
  { e: "🏖️", k: "beach sea sand summer" },
  { e: "🏕️", k: "camping tent outdoors nature" },
  { e: "🛝", k: "playground slide children park" },
  { e: "🌏", k: "earth globe world australia" },
  { e: "🇦🇺", k: "australia flag aussie" },
  // Support & Wellness
  { e: "🛡️", k: "shield protect safe" },
  { e: "⚕️", k: "medical health care" },
  { e: "🩺", k: "doctor stethoscope health" },
  { e: "🧠", k: "brain mind mental health think" },
  { e: "💭", k: "thought bubble think mental" },
  { e: "💬", k: "chat talk message" },
  { e: "🗣️", k: "speak talk voice" },
  { e: "👁️", k: "eye see watch" },
  { e: "🌐", k: "globe internet world connect" },
  // Symbols & Misc
  { e: "🌠", k: "shooting star wish night" },
  { e: "🎆", k: "fireworks celebrate" },
  { e: "🏆", k: "trophy win award" },
  { e: "🥇", k: "gold medal first win" },
  { e: "🎁", k: "gift present surprise" },
  { e: "🔑", k: "key unlock access" },
  { e: "💡", k: "idea light bulb bright" },
  { e: "🔔", k: "bell notification alert" },
  { e: "📣", k: "megaphone announce loud" },
  { e: "🤫", k: "quiet secret shh" },
  { e: "🦸", k: "superhero hero" },
  { e: "🦄", k: "unicorn magic rainbow" },
  { e: "🐨", k: "koala australia cute" },
  { e: "🐸", k: "frog green cute" },
  { e: "🐧", k: "penguin cute bird" },
  { e: "🐶", k: "dog puppy pet" },
  { e: "🐱", k: "cat kitten pet" },
  { e: "🌍", k: "earth nature environment" },
];

const CATEGORY_LABELS = [
  { label: "People & Family", emojis: ["👶","🤱","🧒","👧","👦","👩","👨","🤰","👪","👨‍👩‍👦","👨‍👩‍👧","👨‍👩‍👧‍👦","🧑‍🍼","👼","🫂","🤝","👋","🙏","💪"] },
  { label: "Hearts & Feelings", emojis: ["❤️","🧡","💛","💚","💙","💜","🤍","💕","💗","💞","💓","🥰","😊","😴","🥱","😰"] },
  { label: "Nature", emojis: ["🌿","🍃","🌱","🌸","🌺","🌻","🌈","☀️","🌙","⭐","🌟","✨","🌊","🏔️","🌲","🌴","🍀","🦋","🐝","🌞"] },
  { label: "Food & Drink", emojis: ["🍼","🥛","🍵","☕","🍎","🥦","🥕","🍓","🥝","🌽","🥗","🍳","🥞","🧁","🎂","🍕","🍿"] },
  { label: "Home & Life", emojis: ["🏡","🏠","🛋️","🛁","🧸","🪆","🧩","📚","📖","✏️","🎨","🧶","🧹","🪴"] },
  { label: "Activities", emojis: ["⚽","🏊","🚴","🧘","🎮","🎯","🎸","🎵","🎭","🎪","🏋️","🤸","🎉","🎊","🎈"] },
  { label: "Local & Community", emojis: ["📍","🗺️","🏙️","🌆","🏖️","🏕️","🛝","🌏","🇦🇺"] },
  { label: "Support & Wellness", emojis: ["🛡️","⚕️","🩺","🧠","💭","💬","🗣️","👁️","🌐"] },
  { label: "Symbols", emojis: ["🌠","🎆","🏆","🥇","🎁","🔑","💡","🔔","📣","🤫","🦸","🦄","🐨","🐸","🐧","🐶","🐱","🌍"] },
];

// ── Emoji Picker Component ────────────────────────────────────────────────────
function EmojiPicker({ value, onChange, onImageUpload, imagePreview, onClearImage }) {
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState(false);
  const fileRef = useRef(null);
  const [uploading, setUploading] = useState(false);

  const filtered = search.trim()
    ? EMOJI_DATA.filter(d => d.e === search || d.k.toLowerCase().includes(search.toLowerCase()))
    : null;

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch(`${API_URL}/api/upload/image`, {
        method: "POST",
        credentials: "include",
        body: formData,
      });
      if (res.ok) {
        const data = await res.json();
        onImageUpload(data.image_url);
      } else {
        toast.error("Failed to upload image");
      }
    } catch {
      toast.error("Upload failed");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  return (
    <div className="space-y-3">
      <Label className="text-foreground">Community Icon</Label>

      {/* Current selection preview */}
      <div className="flex items-center gap-3">
        <div className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center flex-shrink-0 overflow-hidden border border-border/50">
          {imagePreview ? (
            <img src={imagePreview} alt="icon" className="w-full h-full object-cover" />
          ) : (
            <span className="text-3xl">{value}</span>
          )}
        </div>
        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={() => { setExpanded(!expanded); }}
            className="inline-flex items-center gap-1.5 text-sm text-primary hover:text-primary/80 font-medium"
          >
            <Search className="h-3.5 w-3.5" />
            {expanded ? "Hide emoji picker" : "Browse emojis"}
            {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </button>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground font-medium"
          >
            <Upload className="h-3.5 w-3.5" />
            {uploading ? "Uploading…" : "Upload your own image"}
          </button>
          {imagePreview && (
            <button
              type="button"
              onClick={onClearImage}
              className="inline-flex items-center gap-1.5 text-xs text-destructive hover:text-destructive/80"
            >
              <X className="h-3 w-3" />
              Remove image
            </button>
          )}
        </div>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
      </div>

      {/* Expanded picker */}
      {expanded && (
        <div className="rounded-2xl border border-border/50 bg-secondary/30 p-4 space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search emojis (e.g. baby, heart, nature)…"
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-card border border-border/50 text-sm focus:outline-none focus:border-primary"
            />
          </div>

          {/* Search results or category grid */}
          {filtered ? (
            <div>
              {filtered.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No emojis found. Try a different word.</p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {filtered.map(d => (
                    <button
                      key={d.e}
                      type="button"
                      onClick={() => { onChange(d.e); onClearImage(); }}
                      className={`text-2xl p-1.5 rounded-xl transition-all hover:bg-secondary ${value === d.e && !imagePreview ? "bg-primary/20 ring-2 ring-primary" : ""}`}
                    >
                      {d.e}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4 max-h-72 overflow-y-auto">
              {CATEGORY_LABELS.map(cat => (
                <div key={cat.label}>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">{cat.label}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {cat.emojis.map(e => (
                      <button
                        key={e}
                        type="button"
                        onClick={() => { onChange(e); onClearImage(); }}
                        className={`text-2xl p-1.5 rounded-xl transition-all hover:bg-secondary ${value === e && !imagePreview ? "bg-primary/20 ring-2 ring-primary" : ""}`}
                      >
                        {e}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Suburb Search Component ───────────────────────────────────────────────────
function SuburbSearch({ selected, onChange }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    if (query.trim().length < 2) { setResults([]); setShowDropdown(false); return; }
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&countrycodes=au&format=json&addressdetails=1&limit=10`,
          { headers: { "Accept-Language": "en-AU" } }
        );
        if (res.ok) {
          const data = await res.json();
          const parsed = data
            .filter(r => r.address?.postcode)
            .map(r => {
              const addr = r.address;
              const name = addr.suburb || addr.neighbourhood || addr.town || addr.village || addr.city_district || addr.city || r.display_name.split(",")[0];
              const postcode = (addr.postcode || "").replace(/\s/g, "").slice(0, 4);
              const state = addr.state_district || addr.state || "";
              return { name: name.trim(), postcode, state };
            })
            .filter(r => r.postcode && /^\d{4}$/.test(r.postcode))
            .filter((r, i, arr) => arr.findIndex(x => x.postcode === r.postcode) === i);
          setResults(parsed);
          setShowDropdown(true);
        }
      } catch { /* silent */ }
      finally { setSearching(false); }
    }, 400);
    return () => clearTimeout(timer);
  }, [query]);

  const addSuburb = (suburb) => {
    if (!selected.find(s => s.postcode === suburb.postcode)) {
      onChange([...selected, suburb]);
    }
    setQuery(""); setResults([]); setShowDropdown(false);
  };

  const removeSuburb = (postcode) => onChange(selected.filter(s => s.postcode !== postcode));

  return (
    <div className="space-y-3">
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selected.map(s => (
            <span key={s.postcode} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium">
              <MapPin className="h-3 w-3" />{s.name} {s.postcode}
              <button type="button" onClick={() => removeSuburb(s.postcode)} className="ml-0.5 hover:text-destructive transition-colors">
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={e => { setQuery(e.target.value); setShowDropdown(true); }}
          onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
          placeholder="Search suburb or postcode…"
          className="w-full pl-9 pr-20 h-12 rounded-xl bg-secondary/50 border border-transparent focus:border-primary focus:outline-none text-sm text-foreground placeholder:text-muted-foreground"
        />
        {searching && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">Searching…</span>
        )}
        {showDropdown && results.length > 0 && (
          <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-card border border-border/50 rounded-xl shadow-lg overflow-hidden">
            {results.map((r, i) => (
              <button
                key={i}
                type="button"
                onMouseDown={() => addSuburb(r)}
                className="w-full flex items-center justify-between px-4 py-2.5 text-sm hover:bg-secondary/50 transition-colors"
              >
                <span className="text-foreground font-medium">{r.name}</span>
                <span className="text-muted-foreground text-xs">{r.postcode}{r.state ? ` · ${r.state}` : ""}</span>
              </button>
            ))}
          </div>
        )}
      </div>
      <p className="text-xs text-muted-foreground">Add multiple suburbs to capture surrounding neighbourhoods.</p>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function CreateCommunity({ user }) {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [icon, setIcon] = useState("🌟");
  const [iconUrl, setIconUrl] = useState(null);   // uploaded image data URL
  const [communityType, setCommunityType] = useState("general"); // "general" | "local"
  const [selectedSuburbs, setSelectedSuburbs] = useState([]); // [{name, postcode, state}]
  const [isPrivate, setIsPrivate] = useState(false);
  const [inviteOnly, setInviteOnly] = useState(false);
  const [isAnonymous, setIsAnonymous] = useState(false);
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
        const mine = data.filter(c => c.is_user_created && c.created_by === user?.user_id).length;
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
    if (name.trim().length < 3) { toast.error("Community name must be at least 3 characters"); return; }
    if (description.trim().length < 10) { toast.error("Description must be at least 10 characters"); return; }
    if (communityType === "local" && selectedSuburbs.length === 0) { toast.error("Please add at least one suburb for a local community"); return; }

    const parsedPostcodes = communityType === "local"
      ? selectedSuburbs.map(s => `${s.name} ${s.postcode}`)
      : [];

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/forums/communities`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim(),
          icon,
          icon_url: iconUrl || null,
          is_private: isPrivate,
          invite_only: isPrivate ? inviteOnly : false,
          is_anonymous_owner: isAnonymous,
          community_subtype: communityType,
          postcodes: parsedPostcodes,
        }),
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

  // Non-premium: redirect immediately to premium page, no intermediate screen
  useEffect(() => {
    if (user && !isPremium) {
      navigate("/premium", { replace: true });
    }
  }, [user, isPremium, navigate]);

  if (!isPremium) return null;

  return (
    <div className="min-h-screen bg-background pb-20 lg:pb-0">
      <Navigation user={user} />
      <main className="max-w-2xl mx-auto px-4 pt-20 lg:pt-24">
        <button onClick={() => navigate(-1)} className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors">
          <ArrowLeft className="h-4 w-4" />Back
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
              <p className="text-sm text-muted-foreground">You've created 3 communities. Delete one to create another.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">

              {/* Community Type */}
              <div className="space-y-2">
                <Label className="text-foreground">Community Type</Label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setCommunityType("general")}
                    className={`p-4 rounded-xl border text-left transition-all ${communityType === "general" ? "border-primary bg-primary/5" : "border-border/50 bg-secondary/30 hover:bg-secondary/50"}`}
                  >
                    <Globe className={`h-5 w-5 mb-2 ${communityType === "general" ? "text-primary" : "text-muted-foreground"}`} />
                    <p className="font-medium text-sm text-foreground">General</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Open to all parents nationwide</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => setCommunityType("local")}
                    className={`p-4 rounded-xl border text-left transition-all ${communityType === "local" ? "border-primary bg-primary/5" : "border-border/50 bg-secondary/30 hover:bg-secondary/50"}`}
                  >
                    <MapPin className={`h-5 w-5 mb-2 ${communityType === "local" ? "text-primary" : "text-muted-foreground"}`} />
                    <p className="font-medium text-sm text-foreground">Local</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Suburb or area-specific community</p>
                  </button>
                </div>
              </div>

              {/* Suburb search for local communities */}
              {communityType === "local" && (
                <div className="space-y-2">
                  <Label className="text-foreground">Suburbs / Areas</Label>
                  <SuburbSearch selected={selectedSuburbs} onChange={setSelectedSuburbs} />
                </div>
              )}

              {/* Icon picker */}
              <EmojiPicker
                value={icon}
                onChange={setIcon}
                onImageUpload={(url) => setIconUrl(url)}
                imagePreview={iconUrl}
                onClearImage={() => setIconUrl(null)}
              />

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

              {/* Privacy settings */}
              <div className="space-y-3">
                <Label className="text-foreground">Privacy</Label>

                {/* Public / Private toggle */}
                <div
                  className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-all ${isPrivate ? "border-primary/40 bg-primary/5" : "border-border/50 bg-secondary/30"}`}
                  onClick={() => setIsPrivate(!isPrivate)}
                >
                  <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${isPrivate ? "border-primary bg-primary" : "border-border"}`}>
                    {isPrivate && <X className="h-3 w-3 text-primary-foreground" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <Lock className="h-4 w-4 text-muted-foreground" />
                      <p className="font-medium text-sm text-foreground">Private community</p>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">Posts are only visible to members who have joined</p>
                  </div>
                </div>

                {/* Invite-only (only shown when private) */}
                {isPrivate && (
                  <div
                    className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-all ml-6 ${inviteOnly ? "border-primary/40 bg-primary/5" : "border-border/50 bg-secondary/30"}`}
                    onClick={() => setInviteOnly(!inviteOnly)}
                  >
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${inviteOnly ? "border-primary bg-primary" : "border-border"}`}>
                      {inviteOnly && <X className="h-3 w-3 text-primary-foreground" />}
                    </div>
                    <div>
                      <p className="font-medium text-sm text-foreground">Invite only</p>
                      <p className="text-xs text-muted-foreground mt-0.5">New members can only join via direct invitation</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Anonymous ownership */}
              <div
                className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-all ${isAnonymous ? "border-primary/40 bg-primary/5" : "border-border/50 bg-secondary/30"}`}
                onClick={() => setIsAnonymous(!isAnonymous)}
              >
                <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${isAnonymous ? "border-primary bg-primary" : "border-border"}`}>
                  {isAnonymous && <X className="h-3 w-3 text-primary-foreground" />}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    {isAnonymous ? <EyeOff className="h-4 w-4 text-muted-foreground" /> : <Eye className="h-4 w-4 text-muted-foreground" />}
                    <p className="font-medium text-sm text-foreground">Anonymous ownership</p>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {isAnonymous ? "Your name won't be shown as the community owner" : "Your name will be shown as the community owner (default)"}
                  </p>
                </div>
              </div>

              {/* Preview */}
              {name.trim() && (
                <div className="p-4 rounded-xl bg-secondary/30 border border-border/30">
                  <p className="text-xs text-muted-foreground mb-3">Preview</p>
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {iconUrl ? (
                        <img src={iconUrl} alt="icon" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-2xl">{icon}</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-heading font-bold text-foreground text-base">{name.trim()}</p>
                        {isPrivate && <Lock className="h-3.5 w-3.5 text-muted-foreground" />}
                        {communityType === "local" && <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">Local</span>}
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2 mt-0.5">{description.trim() || "Description"}</p>
                      {!isAnonymous && (
                        <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                          <Crown className="h-3 w-3 text-amber-500" />{user?.nickname || user?.name}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <div className="flex gap-4">
                <Button type="button" variant="outline" onClick={() => navigate(-1)} className="flex-1 h-12 rounded-xl">
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  className="flex-1 h-12 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  {loading ? "Creating…" : "Create Community"}
                </Button>
              </div>
            </form>
          )}
        </div>
      </main>
      <AppFooter />
    </div>
  );
}
