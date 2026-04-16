import { useState, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "../components/ui/button";
import Navigation from "../components/Navigation";
import { ArrowLeft, ArrowRight, Camera, X, Tag, ArrowLeftRight, Heart, Search, Check, ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { parseApiError } from "../utils/apiError";

const API_URL = process.env.REACT_APP_BACKEND_URL;

const INPUT_CLASS = "w-full rounded-xl border border-border bg-card text-foreground px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 placeholder:text-muted-foreground";

const LISTING_TYPES = [
  { id: "sell",      label: "Selling",      desc: "Set a price for your item",           icon: Tag,            color: "emerald" },
  { id: "swap",      label: "Swapping",     desc: "Exchange for something you need",     icon: ArrowLeftRight, color: "sky" },
  { id: "give_away", label: "Giving Away",  desc: "Pass it on to a local family",        icon: Heart,          color: "amber" },
  { id: "wanted",    label: "Wanted",       desc: "Looking for something specific",      icon: Search,         color: "violet" },
];

const COLOR_CLASSES = {
  emerald: { bg: "bg-emerald-500/10", border: "border-emerald-500/40", text: "text-emerald-700 dark:text-emerald-400", check: "bg-emerald-500" },
  sky:     { bg: "bg-sky-500/10",     border: "border-sky-500/40",     text: "text-sky-700 dark:text-sky-400",         check: "bg-sky-500" },
  amber:   { bg: "bg-amber-500/10",   border: "border-amber-500/40",   text: "text-amber-700 dark:text-amber-400",     check: "bg-amber-500" },
  violet:  { bg: "bg-violet-500/10",  border: "border-violet-500/40",  text: "text-violet-700 dark:text-violet-400",   check: "bg-violet-500" },
};

const CATEGORIES = [
  { id: "clothing",  label: "Clothing",          emoji: "👕" },
  { id: "gear",      label: "Gear & Equipment",   emoji: "🛒" },
  { id: "toys",      label: "Toys",               emoji: "🧸" },
  { id: "books",     label: "Books",              emoji: "📚" },
  { id: "furniture", label: "Furniture",          emoji: "🪑" },
  { id: "feeding",   label: "Feeding",            emoji: "🍼" },
  { id: "safety",    label: "Safety",             emoji: "🔒" },
  { id: "other",     label: "Other",              emoji: "📦" },
];

const AGE_GROUPS = [
  "Newborn", "0–6 months", "6–12 months", "1–2 years", "3–4 years", "5+ years", "All ages"
];

const CONDITIONS = [
  { id: "like_new",  label: "Like new",    desc: "Barely used, as good as new" },
  { id: "good",      label: "Good",        desc: "Light wear, works perfectly" },
  { id: "fair",      label: "Fair",        desc: "Noticeable wear but fully functional" },
  { id: "well_loved",label: "Well loved",  desc: "Lots of character, still useful" },
];

const TOTAL_STEPS = 5;

export default function CreateStallListing({ user }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const groupId = searchParams.get("group");

  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef(null);

  // Form state
  const [images, setImages] = useState([]); // array of data URLs
  const [uploadingImage, setUploadingImage] = useState(false);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [ageGroup, setAgeGroup] = useState("");
  const [listingType, setListingType] = useState("");
  const [price, setPrice] = useState("");
  const [makeOffer, setMakeOffer] = useState(false);
  const [swapFor, setSwapFor] = useState("");
  const [condition, setCondition] = useState("");
  const [suburb, setSuburb] = useState(user?.suburb || "");
  const [postageAvailable, setPostageAvailable] = useState(false);
  const [description, setDescription] = useState("");

  // ── Image upload ─────────────────────────────────────────────────────────
  const handleImageSelect = async (e) => {
    const files = Array.from(e.target.files || []);
    if (images.length + files.length > 4) { toast.error("Maximum 4 photos"); return; }
    setUploadingImage(true);
    for (const file of files) {
      if (!file.type.startsWith("image/")) { toast.error("Images only"); continue; }
      if (file.size > 5 * 1024 * 1024) { toast.error("Max 5MB per image"); continue; }
      const formData = new FormData();
      formData.append("file", file);
      try {
        const res = await fetch(`${API_URL}/api/upload/image`, { method: "POST", credentials: "include", body: formData });
        if (res.ok) { const data = await res.json(); setImages(prev => [...prev, data.image_url]); }
        else toast.error("Upload failed");
      } catch { toast.error("Upload failed"); }
    }
    setUploadingImage(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeImage = (idx) => setImages(prev => prev.filter((_, i) => i !== idx));

  // ── Validation per step ──────────────────────────────────────────────────
  const canProceed = () => {
    if (step === 1) return true; // photos optional
    if (step === 2) return title.trim().length >= 3 && category && listingType;
    if (step === 3) {
      if (listingType === "sell") return makeOffer || price !== "";
      if (listingType === "swap") return true;
      if (listingType === "give_away") return condition !== "";
      return true; // wanted
    }
    if (step === 4) return suburb.trim().length >= 2;
    return true;
  };

  // ── Submit ───────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const payload = {
        title: title.trim(),
        description: description.trim() || null,
        listing_type: listingType,
        category,
        age_group: ageGroup || null,
        images,
        suburb: suburb.trim() || null,
        postcode: user?.postcode || null,
        state: user?.state || null,
        latitude: user?.latitude || null,
        longitude: user?.longitude || null,
        postage_available: postageAvailable,
        donation_group_id: groupId || null,
        make_offer: makeOffer,
      };
      if (listingType === "sell" && !makeOffer && price) payload.price = parseFloat(price);
      if (listingType === "swap") payload.swap_for = swapFor.trim() || null;
      if (["give_away", "sell", "swap"].includes(listingType)) payload.condition = condition || null;

      const res = await fetch(`${API_URL}/api/stall/listings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const data = await res.json();
        toast.success("Listing posted!");
        navigate(`/stall/listing/${data.listing_id}`);
      } else {
        const err = await res.json();
        toast.error(parseApiError(err.detail, "Failed to post listing"));
      }
    } catch { toast.error("Something went wrong"); }
    finally { setSubmitting(false); }
  };

  // ── Step renderer ─────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background pb-20 lg:pb-0">
      <Navigation user={user} />

      <main className="max-w-xl mx-auto px-4 pt-20 lg:pt-24 pb-16">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6 mt-2">
          <button onClick={() => step > 1 ? setStep(s => s - 1) : navigate("/stall")} className="p-2 rounded-xl hover:bg-secondary/50 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="font-heading font-bold text-lg text-foreground">Post a listing</h1>
            <p className="text-xs text-muted-foreground">Step {step} of {TOTAL_STEPS}</p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="flex gap-1 mb-8">
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
            <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-300 ${i < step ? "bg-primary" : "bg-secondary"}`} />
          ))}
        </div>

        {/* ── Step 1: Photos ── */}
        {step === 1 && (
          <div className="space-y-4">
            <div>
              <h2 className="font-heading font-bold text-xl text-foreground mb-1">Add photos</h2>
              <p className="text-sm text-muted-foreground">Up to 4 photos. Listings with photos get more enquiries.</p>
            </div>

            <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleImageSelect} />

            {/* Photo grid */}
            <div className="grid grid-cols-2 gap-3">
              {images.map((img, idx) => (
                <div key={idx} className="relative aspect-square rounded-2xl overflow-hidden border border-border/50">
                  <img src={img} alt="" className="w-full h-full object-cover" />
                  <button onClick={() => removeImage(idx)} className="absolute top-2 right-2 w-6 h-6 rounded-full bg-card/80 backdrop-blur-sm flex items-center justify-center">
                    <X className="h-3.5 w-3.5 text-foreground" />
                  </button>
                  {idx === 0 && <span className="absolute bottom-2 left-2 text-[10px] font-semibold bg-card/80 backdrop-blur-sm px-1.5 py-0.5 rounded text-foreground">Cover</span>}
                </div>
              ))}
              {images.length < 4 && (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingImage}
                  className="aspect-square rounded-2xl border-2 border-dashed border-border/50 flex flex-col items-center justify-center gap-2 hover:border-primary/40 hover:bg-primary/5 transition-colors text-muted-foreground"
                >
                  {uploadingImage ? (
                    <div className="w-5 h-5 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
                  ) : (
                    <>
                      <Camera className="h-7 w-7" />
                      <span className="text-xs font-medium">Add photo</span>
                    </>
                  )}
                </button>
              )}
            </div>
            <p className="text-xs text-muted-foreground">Tip: avoid photos showing your home address or interior.</p>
          </div>
        )}

        {/* ── Step 2: What is it? ── */}
        {step === 2 && (
          <div className="space-y-5">
            <div>
              <h2 className="font-heading font-bold text-xl text-foreground mb-1">What are you listing?</h2>
            </div>

            {/* Title */}
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Title <span className="text-destructive">*</span></label>
              <input
                value={title}
                onChange={e => setTitle(e.target.value.slice(0, 60))}
                placeholder="e.g. Ergobaby carrier, size 0–6m play mat"
                className={INPUT_CLASS}
                autoFocus
              />
              <p className="text-xs text-muted-foreground mt-1">{title.length}/60</p>
            </div>

            {/* Category */}
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">Category <span className="text-destructive">*</span></label>
              <div className="grid grid-cols-4 gap-2">
                {CATEGORIES.map(c => (
                  <button
                    key={c.id}
                    onClick={() => setCategory(c.id)}
                    className={`flex flex-col items-center gap-1 p-2.5 rounded-xl border text-xs font-medium transition-colors ${category === c.id ? "bg-primary/10 border-primary/30 text-primary" : "bg-card border-border/50 text-muted-foreground hover:text-foreground"}`}
                  >
                    <span className="text-xl">{c.emoji}</span>
                    <span className="text-[10px] text-center leading-tight">{c.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Age group */}
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">Age group <span className="text-xs text-muted-foreground font-normal">(optional)</span></label>
              <div className="flex flex-wrap gap-2">
                {AGE_GROUPS.map(a => (
                  <button
                    key={a}
                    onClick={() => setAgeGroup(ageGroup === a ? "" : a)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${ageGroup === a ? "bg-primary/10 border-primary/30 text-primary" : "bg-card border-border/50 text-muted-foreground hover:text-foreground"}`}
                  >
                    {a}
                  </button>
                ))}
              </div>
            </div>

            {/* Listing type */}
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">Listing type <span className="text-destructive">*</span></label>
              <div className="space-y-2">
                {LISTING_TYPES.map(t => {
                  const cls = COLOR_CLASSES[t.color];
                  const isSelected = listingType === t.id;
                  return (
                    <button
                      key={t.id}
                      onClick={() => setListingType(t.id)}
                      className={`w-full flex items-center gap-3 p-3.5 rounded-xl border text-left transition-colors ${isSelected ? `${cls.bg} ${cls.border}` : "bg-card border-border/50 hover:bg-secondary/30"}`}
                    >
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${isSelected ? cls.bg : "bg-secondary/50"}`}>
                        <t.icon className={`h-4.5 w-4.5 ${isSelected ? cls.text : "text-muted-foreground"}`} />
                      </div>
                      <div className="flex-1">
                        <p className={`text-sm font-semibold ${isSelected ? cls.text : "text-foreground"}`}>{t.label}</p>
                        <p className="text-xs text-muted-foreground">{t.desc}</p>
                      </div>
                      {isSelected && (
                        <div className={`w-5 h-5 rounded-full ${cls.check} flex items-center justify-center shrink-0`}>
                          <Check className="h-3 w-3 text-white" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ── Step 3: Details ── */}
        {step === 3 && (
          <div className="space-y-5">
            <h2 className="font-heading font-bold text-xl text-foreground mb-1">
              {listingType === "sell" ? "Pricing" : listingType === "swap" ? "What you're after" : listingType === "give_away" ? "Condition" : "Budget (optional)"}
            </h2>

            {/* Sell — price */}
            {listingType === "sell" && (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={makeOffer} onChange={e => setMakeOffer(e.target.checked)} className="rounded" />
                    <span className="text-sm text-foreground font-medium">Make an offer</span>
                  </label>
                </div>
                {!makeOffer && (
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1.5 block">Price (AUD) <span className="text-destructive">*</span></label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-medium">$</span>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={price}
                        onChange={e => setPrice(e.target.value)}
                        placeholder="0"
                        className={`${INPUT_CLASS} pl-7`}
                        autoFocus
                      />
                    </div>
                    {parseFloat(price) > 500 && (
                      <p className="text-xs text-amber-600 mt-1.5">⚠️ Listings over $500 are unusual for The Village Stall. Double-check this is correct.</p>
                    )}
                  </div>
                )}
                {/* Condition for sell */}
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">Condition <span className="text-destructive">*</span></label>
                  <div className="space-y-2">
                    {CONDITIONS.map(c => (
                      <button key={c.id} onClick={() => setCondition(c.id)} className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-colors ${condition === c.id ? "bg-primary/10 border-primary/30" : "bg-card border-border/50 hover:bg-secondary/30"}`}>
                        <div className="flex-1">
                          <p className={`text-sm font-medium ${condition === c.id ? "text-primary" : "text-foreground"}`}>{c.label}</p>
                          <p className="text-xs text-muted-foreground">{c.desc}</p>
                        </div>
                        {condition === c.id && <Check className="h-4 w-4 text-primary shrink-0" />}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Swap */}
            {listingType === "swap" && (
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">What are you looking for in return?</label>
                  <textarea
                    value={swapFor}
                    onChange={e => setSwapFor(e.target.value.slice(0, 200))}
                    placeholder="e.g. Size 1 nappies, baby monitor, anything useful for a 6-month-old…"
                    rows={3}
                    className={INPUT_CLASS}
                    autoFocus
                  />
                  <p className="text-xs text-muted-foreground mt-1">{swapFor.length}/200</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">Condition</label>
                  <div className="space-y-2">
                    {CONDITIONS.map(c => (
                      <button key={c.id} onClick={() => setCondition(c.id)} className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-colors ${condition === c.id ? "bg-primary/10 border-primary/30" : "bg-card border-border/50 hover:bg-secondary/30"}`}>
                        <div className="flex-1">
                          <p className={`text-sm font-medium ${condition === c.id ? "text-primary" : "text-foreground"}`}>{c.label}</p>
                          <p className="text-xs text-muted-foreground">{c.desc}</p>
                        </div>
                        {condition === c.id && <Check className="h-4 w-4 text-primary shrink-0" />}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Give away */}
            {listingType === "give_away" && (
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">Condition <span className="text-destructive">*</span></label>
                <div className="space-y-2">
                  {CONDITIONS.map(c => (
                    <button key={c.id} onClick={() => setCondition(c.id)} className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-colors ${condition === c.id ? "bg-primary/10 border-primary/30" : "bg-card border-border/50 hover:bg-secondary/30"}`}>
                      <div className="flex-1">
                        <p className={`text-sm font-medium ${condition === c.id ? "text-primary" : "text-foreground"}`}>{c.label}</p>
                        <p className="text-xs text-muted-foreground">{c.desc}</p>
                      </div>
                      {condition === c.id && <Check className="h-4 w-4 text-primary shrink-0" />}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Wanted — budget */}
            {listingType === "wanted" && (
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Budget (optional)</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-medium">$</span>
                  <input
                    type="number"
                    min="0"
                    value={price}
                    onChange={e => setPrice(e.target.value)}
                    placeholder="up to…"
                    className={`${INPUT_CLASS} pl-7`}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Step 4: Location ── */}
        {step === 4 && (
          <div className="space-y-5">
            <div>
              <h2 className="font-heading font-bold text-xl text-foreground mb-1">Location</h2>
              <p className="text-sm text-muted-foreground">Help local parents find your listing.</p>
            </div>

            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Suburb <span className="text-destructive">*</span></label>
              <input
                value={suburb}
                onChange={e => setSuburb(e.target.value)}
                placeholder="e.g. Newtown"
                className={INPUT_CLASS}
                autoFocus
              />
            </div>

            <label className="flex items-start gap-3 cursor-pointer p-3.5 bg-card rounded-xl border border-border/50 hover:bg-secondary/30 transition-colors">
              <input type="checkbox" checked={postageAvailable} onChange={e => setPostageAvailable(e.target.checked)} className="mt-0.5 rounded shrink-0" />
              <div>
                <p className="text-sm font-medium text-foreground">Postage available</p>
                <p className="text-xs text-muted-foreground">You're willing to ship this item — buyer covers postage cost</p>
              </div>
            </label>

            <div className="p-3.5 bg-amber-500/5 border border-amber-500/20 rounded-xl text-xs text-amber-700 dark:text-amber-400 leading-relaxed">
              🤝 <strong>Safety tip:</strong> Meet in a public place — a café, library, or shopping centre. Avoid inviting strangers into your home.
            </div>
          </div>
        )}

        {/* ── Step 5: Description + review ── */}
        {step === 5 && (
          <div className="space-y-5">
            <div>
              <h2 className="font-heading font-bold text-xl text-foreground mb-1">Final details</h2>
            </div>

            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Description <span className="text-xs text-muted-foreground font-normal">(optional)</span></label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value.slice(0, 300))}
                placeholder="Add any details — condition notes, size info, reason for selling…"
                rows={4}
                className={INPUT_CLASS}
                autoFocus
              />
              <p className="text-xs text-muted-foreground mt-1">{description.length}/300</p>
            </div>

            {/* Summary card */}
            <div className="bg-card border border-border/50 rounded-2xl p-4 space-y-3">
              <h3 className="text-sm font-semibold text-foreground">Review your listing</h3>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                <div><span className="text-muted-foreground">Title</span><p className="text-foreground font-medium truncate">{title}</p></div>
                <div><span className="text-muted-foreground">Type</span><p className="text-foreground font-medium capitalize">{listingType?.replace("_", " ")}</p></div>
                <div><span className="text-muted-foreground">Category</span><p className="text-foreground font-medium capitalize">{category}</p></div>
                {suburb && <div><span className="text-muted-foreground">Suburb</span><p className="text-foreground font-medium">{suburb}</p></div>}
                {images.length > 0 && <div><span className="text-muted-foreground">Photos</span><p className="text-foreground font-medium">{images.length} added</p></div>}
                {listingType === "sell" && !makeOffer && price && <div><span className="text-muted-foreground">Price</span><p className="text-foreground font-medium">${parseFloat(price).toFixed(0)}</p></div>}
                {makeOffer && <div><span className="text-muted-foreground">Price</span><p className="text-foreground font-medium">Make an offer</p></div>}
              </div>
            </div>

            <div className="text-xs text-muted-foreground leading-relaxed p-3 bg-secondary/30 rounded-xl">
              By posting you agree to The Village Stall community guidelines: honest descriptions, public meetups, and no on-platform payments.
            </div>
          </div>
        )}

        {/* Navigation buttons */}
        <div className="flex gap-3 mt-8">
          {step > 1 && (
            <Button variant="outline" className="flex-1 rounded-xl" onClick={() => setStep(s => s - 1)}>
              <ArrowLeft className="h-4 w-4 mr-1.5" /> Back
            </Button>
          )}
          {step < TOTAL_STEPS ? (
            <Button
              className="flex-1 rounded-xl"
              disabled={!canProceed()}
              onClick={() => setStep(s => s + 1)}
            >
              Next <ArrowRight className="h-4 w-4 ml-1.5" />
            </Button>
          ) : (
            <Button
              className="flex-1 rounded-xl shadow-lg shadow-primary/25"
              disabled={submitting || !canProceed()}
              onClick={handleSubmit}
            >
              {submitting ? "Posting…" : "Post listing"}
            </Button>
          )}
        </div>

        {step === 1 && (
          <button className="w-full text-center text-sm text-muted-foreground mt-3 hover:text-foreground" onClick={() => setStep(2)}>
            Skip photos →
          </button>
        )}
      </main>
    </div>
  );
}
