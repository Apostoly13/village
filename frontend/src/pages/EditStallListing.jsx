import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "../components/ui/button";
import Navigation from "../components/Navigation";
import AppFooter from "../components/AppFooter";
import { ArrowLeft, Camera, X, ImageIcon, AlertCircle } from "lucide-react";
import { toast } from "sonner";

const API_URL = process.env.REACT_APP_BACKEND_URL;

const INPUT_CLASS =
  "w-full rounded-xl border border-border bg-card text-foreground px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 placeholder:text-muted-foreground";

const CATEGORIES = [
  { id: "clothing",  label: "Clothing",         emoji: "👕" },
  { id: "gear",      label: "Gear & Equipment",  emoji: "🛒" },
  { id: "toys",      label: "Toys",              emoji: "🧸" },
  { id: "books",     label: "Books",             emoji: "📚" },
  { id: "furniture", label: "Furniture",         emoji: "🪑" },
  { id: "feeding",   label: "Feeding",           emoji: "🍼" },
  { id: "safety",    label: "Safety",            emoji: "🔒" },
  { id: "other",     label: "Other",             emoji: "📦" },
];

const AGE_GROUPS = [
  "Newborn", "0–6 months", "6–12 months", "1–2 years", "3–4 years", "5+ years", "All ages",
];

const CONDITIONS = [
  { id: "like_new",   label: "Like new",   desc: "Barely used, as good as new" },
  { id: "good",       label: "Good",       desc: "Light wear, works perfectly" },
  { id: "fair",       label: "Fair",       desc: "Noticeable wear but fully functional" },
  { id: "well_loved", label: "Well loved", desc: "Lots of character, still useful" },
];

export default function EditStallListing({ user }) {
  const { listingId } = useParams();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [listing, setListing] = useState(null);

  // Editable fields
  const [images, setImages] = useState([]);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [ageGroup, setAgeGroup] = useState("");
  const [condition, setCondition] = useState("");
  const [price, setPrice] = useState("");
  const [makeOffer, setMakeOffer] = useState(false);
  const [swapFor, setSwapFor] = useState("");
  const [description, setDescription] = useState("");
  const [suburb, setSuburb] = useState("");
  const [postageAvailable, setPostageAvailable] = useState(false);
  const [status, setStatus] = useState("active");

  const [errors, setErrors] = useState({});

  // ── Load listing ──────────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API_URL}/api/stall/listings/${listingId}`, { credentials: "include" });
        if (!res.ok) { navigate("/stall"); return; }
        const data = await res.json();

        // Only the seller (or admin/mod) can edit
        if (!data.is_own_listing && user?.role !== "admin" && user?.role !== "moderator") {
          toast.error("You can only edit your own listings");
          navigate(`/stall/listing/${listingId}`);
          return;
        }

        setListing(data);
        setImages(data.images || []);
        setTitle(data.title || "");
        setCategory(data.category || "");
        setAgeGroup(data.age_group || "");
        setCondition(data.condition || "");
        setPrice(data.price != null ? String(data.price) : "");
        setMakeOffer(data.make_offer || false);
        setSwapFor(data.swap_for || "");
        setDescription(data.description || "");
        setSuburb(data.suburb || "");
        setPostageAvailable(data.postage_available || false);
        setStatus(data.status || "active");
      } catch {
        toast.error("Failed to load listing");
        navigate("/stall");
      } finally {
        setLoading(false);
      }
    })();
  }, [listingId]);

  // ── Image upload ──────────────────────────────────────────────────────────
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
        if (res.ok) { const d = await res.json(); setImages(prev => [...prev, d.image_url]); }
        else toast.error("Upload failed");
      } catch { toast.error("Upload failed"); }
    }
    setUploadingImage(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeImage = (idx) => setImages(prev => prev.filter((_, i) => i !== idx));

  // ── Validation ────────────────────────────────────────────────────────────
  const validate = () => {
    const e = {};
    if (!title.trim() || title.trim().length < 3) e.title = "Title must be at least 3 characters";
    if (!category) e.category = "Please select a category";
    if (listing?.listing_type === "sell" && !makeOffer && !price) e.price = "Enter a price or tick Make Offer";
    if (!suburb.trim() || suburb.trim().length < 2) e.suburb = "Suburb is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      const payload = {
        title: title.trim(),
        description: description.trim() || null,
        category,
        age_group: ageGroup || null,
        images,
        suburb: suburb.trim() || null,
        postage_available: postageAvailable,
        make_offer: makeOffer,
        status,
      };

      if (listing?.listing_type === "sell") {
        payload.price = makeOffer ? null : parseFloat(price) || null;
        if (condition) payload.condition = condition;
      }
      if (listing?.listing_type === "swap") {
        payload.swap_for = swapFor.trim() || null;
        if (condition) payload.condition = condition;
      }
      if (listing?.listing_type === "give_away") {
        if (condition) payload.condition = condition;
      }

      const res = await fetch(`${API_URL}/api/stall/listings/${listingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        toast.success("Listing updated!");
        navigate(`/stall/listing/${listingId}`);
      } else {
        const err = await res.json();
        toast.error(err.detail || "Failed to update listing");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-6 h-6 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
      </div>
    );
  }

  if (!listing) return null;

  const listingType = listing.listing_type;

  return (
    <div className="min-h-screen bg-background pb-24 lg:pl-60 lg:pb-8">
      <Navigation user={user} />

      <main className="max-w-xl mx-auto px-4 pt-16 lg:pt-8 pb-8">
        {/* Back */}
        <button
          onClick={() => navigate(`/stall/listing/${listingId}`)}
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 mt-2 transition-colors text-sm"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to listing
        </button>

        <h1 className="font-heading text-2xl font-bold text-foreground mb-6">Edit Listing</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* ── Photos ── */}
          <section className="bg-card rounded-2xl border border-border/50 p-5">
            <h2 className="font-semibold text-foreground mb-1">Photos</h2>
            <p className="text-xs text-muted-foreground mb-4">Up to 4 photos</p>

            <div className="grid grid-cols-4 gap-2">
              {images.map((img, idx) => (
                <div key={idx} className="relative aspect-square rounded-xl overflow-hidden bg-secondary/30">
                  <img src={img} alt="" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeImage(idx)}
                    className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 transition-colors"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
              {images.length < 4 && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingImage}
                  className="aspect-square rounded-xl border-2 border-dashed border-border/50 flex flex-col items-center justify-center gap-1 hover:border-primary/50 hover:bg-primary/5 transition-colors disabled:opacity-50"
                >
                  {uploadingImage ? (
                    <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                  ) : (
                    <>
                      <Camera className="h-5 w-5 text-muted-foreground/50" />
                      <span className="text-[10px] text-muted-foreground">Add</span>
                    </>
                  )}
                </button>
              )}
              {images.length === 0 && (
                <div className="col-span-3 aspect-[3/1] rounded-xl border-2 border-dashed border-border/30 flex items-center justify-center text-muted-foreground/30">
                  <ImageIcon className="h-8 w-8" />
                </div>
              )}
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleImageSelect} />
          </section>

          {/* ── Details ── */}
          <section className="bg-card rounded-2xl border border-border/50 p-5 space-y-4">
            <h2 className="font-semibold text-foreground">Details</h2>

            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Title <span className="text-destructive">*</span>
              </label>
              <input
                value={title}
                onChange={e => { setTitle(e.target.value.slice(0, 80)); if (errors.title) setErrors(p => ({ ...p, title: null })); }}
                placeholder="What are you listing?"
                className={`${INPUT_CLASS} ${errors.title ? "border-destructive" : ""}`}
              />
              {errors.title && (
                <p className="text-xs text-destructive mt-1 flex items-center gap-1"><AlertCircle className="h-3 w-3" />{errors.title}</p>
              )}
              <p className="text-xs text-muted-foreground text-right mt-0.5">{title.length}/80</p>
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Category <span className="text-destructive">*</span>
              </label>
              <div className="grid grid-cols-4 gap-2">
                {CATEGORIES.map(c => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => { setCategory(c.id); if (errors.category) setErrors(p => ({ ...p, category: null })); }}
                    className={`flex flex-col items-center gap-1 p-2 rounded-xl border text-xs transition-colors ${
                      category === c.id
                        ? "border-primary bg-primary/10 text-primary font-medium"
                        : "border-border/50 text-muted-foreground hover:border-border hover:text-foreground"
                    }`}
                  >
                    <span className="text-lg">{c.emoji}</span>
                    <span className="text-[10px] leading-tight text-center">{c.label}</span>
                  </button>
                ))}
              </div>
              {errors.category && (
                <p className="text-xs text-destructive mt-1 flex items-center gap-1"><AlertCircle className="h-3 w-3" />{errors.category}</p>
              )}
            </div>

            {/* Age group */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Age Group</label>
              <div className="flex flex-wrap gap-2">
                {AGE_GROUPS.map(ag => (
                  <button
                    key={ag}
                    type="button"
                    onClick={() => setAgeGroup(prev => prev === ag ? "" : ag)}
                    className={`px-3 py-1.5 rounded-full text-xs border transition-colors ${
                      ageGroup === ag
                        ? "bg-primary text-primary-foreground border-primary"
                        : "border-border/50 text-muted-foreground hover:border-border hover:text-foreground"
                    }`}
                  >
                    {ag}
                  </button>
                ))}
              </div>
            </div>

            {/* Condition (not for 'wanted') */}
            {listingType !== "wanted" && (
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Condition</label>
                <div className="grid grid-cols-2 gap-2">
                  {CONDITIONS.map(c => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setCondition(prev => prev === c.id ? "" : c.id)}
                      className={`flex flex-col items-start p-3 rounded-xl border text-left transition-colors ${
                        condition === c.id
                          ? "border-primary bg-primary/10"
                          : "border-border/50 hover:border-border"
                      }`}
                    >
                      <span className={`text-sm font-medium ${condition === c.id ? "text-primary" : "text-foreground"}`}>{c.label}</span>
                      <span className="text-xs text-muted-foreground">{c.desc}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Price (sell) */}
            {listingType === "sell" && (
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Price <span className="text-destructive">*</span>
                </label>
                <div className="flex items-center gap-3 mb-2">
                  <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
                    <input
                      type="checkbox"
                      checked={makeOffer}
                      onChange={e => { setMakeOffer(e.target.checked); if (e.target.checked) setPrice(""); }}
                      className="rounded"
                    />
                    Make offer / negotiable
                  </label>
                </div>
                {!makeOffer && (
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={price}
                      onChange={e => { setPrice(e.target.value); if (errors.price) setErrors(p => ({ ...p, price: null })); }}
                      placeholder="0.00"
                      className={`${INPUT_CLASS} pl-7 ${errors.price ? "border-destructive" : ""}`}
                    />
                  </div>
                )}
                {errors.price && (
                  <p className="text-xs text-destructive mt-1 flex items-center gap-1"><AlertCircle className="h-3 w-3" />{errors.price}</p>
                )}
              </div>
            )}

            {/* Swap for */}
            {listingType === "swap" && (
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Looking to swap for</label>
                <input
                  value={swapFor}
                  onChange={e => setSwapFor(e.target.value.slice(0, 120))}
                  placeholder="e.g. Size 1 nappies, board books, anything useful…"
                  className={INPUT_CLASS}
                />
              </div>
            )}
          </section>

          {/* ── Location ── */}
          <section className="bg-card rounded-2xl border border-border/50 p-5 space-y-4">
            <h2 className="font-semibold text-foreground">Location</h2>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Suburb <span className="text-destructive">*</span>
              </label>
              <input
                value={suburb}
                onChange={e => { setSuburb(e.target.value.slice(0, 60)); if (errors.suburb) setErrors(p => ({ ...p, suburb: null })); }}
                placeholder="e.g. Bondi Beach, NSW"
                className={`${INPUT_CLASS} ${errors.suburb ? "border-destructive" : ""}`}
              />
              {errors.suburb && (
                <p className="text-xs text-destructive mt-1 flex items-center gap-1"><AlertCircle className="h-3 w-3" />{errors.suburb}</p>
              )}
            </div>

            <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
              <input
                type="checkbox"
                checked={postageAvailable}
                onChange={e => setPostageAvailable(e.target.checked)}
                className="rounded"
              />
              Postage available
            </label>
          </section>

          {/* ── Description ── */}
          <section className="bg-card rounded-2xl border border-border/50 p-5">
            <h2 className="font-semibold text-foreground mb-3">Description</h2>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value.slice(0, 1000))}
              rows={4}
              placeholder="Add any extra details — brand, size, reason for selling, pickup arrangements…"
              className={`${INPUT_CLASS} resize-none`}
            />
            <p className="text-xs text-muted-foreground text-right mt-1">{description.length}/1000</p>
          </section>

          {/* ── Listing status ── */}
          <section className="bg-card rounded-2xl border border-border/50 p-5">
            <h2 className="font-semibold text-foreground mb-3">Status</h2>
            <div className="flex gap-2">
              {["active", "paused", "sold"].map(s => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setStatus(s)}
                  className={`px-4 py-2 rounded-xl text-sm border transition-colors capitalize ${
                    status === s
                      ? "bg-primary text-primary-foreground border-primary"
                      : "border-border/50 text-muted-foreground hover:border-border hover:text-foreground"
                  }`}
                >
                  {s === "sold" ? "Mark as sold" : s.charAt(0).toUpperCase() + s.slice(1)}
                </button>
              ))}
            </div>
          </section>

          {/* ── Actions ── */}
          <div className="flex gap-3 pb-6">
            <Button
              type="button"
              variant="outline"
              className="flex-1 rounded-xl"
              onClick={() => navigate(`/stall/listing/${listingId}`)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={submitting || uploadingImage}
              className="flex-1 rounded-xl gap-2"
            >
              {submitting ? (
                <><div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />Saving…</>
              ) : "Save changes"}
            </Button>
          </div>
        </form>

        <AppFooter />
      </main>
    </div>
  );
}
