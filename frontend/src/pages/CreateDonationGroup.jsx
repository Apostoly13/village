import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Navigation from "../components/Navigation";
import SuburbSearch from "../components/SuburbSearch";
import { Button } from "../components/ui/button";
import { ArrowLeft, Upload, X, Users, Calendar, MapPin, Heart, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import AppFooter from "../components/AppFooter";

const API_URL = process.env.REACT_APP_BACKEND_URL;

const PURPOSE_OPTIONS = [
  { value: "baby_clothes",       label: "Baby Clothes" },
  { value: "kids_clothes",       label: "Kids Clothes" },
  { value: "school_uniforms",    label: "School Uniform Exchange" },
  { value: "toys_games",         label: "Toys & Games" },
  { value: "baby_gear",          label: "Baby Gear" },
  { value: "maternity_feeding",  label: "Maternity & Feeding" },
  { value: "nappies_essentials", label: "Nappies & Essentials" },
  { value: "books_learning",     label: "Books & Learning" },
  { value: "general_donations",  label: "General Donations" },
];

export default function CreateDonationGroup({ user }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const returnTo = searchParams.get("returnTo");

  const [submitting, setSubmitting] = useState(false);
  const [coverPreview, setCoverPreview] = useState(null);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [coverFile, setCoverFile] = useState(null);

  // Multi-suburb area coverage
  const [areas, setAreas] = useState([]); // [{ suburb, state, postcode }]

  const [form, setForm] = useState({
    name: "",
    description: "",
    end_date: "",
    purpose_type: "baby_clothes",
    accepted_items: "",
    not_accepted: "",
    rules: "",
    is_open: true,
  });

  const [errors, setErrors] = useState({});

  const set = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: null }));
  };

  // Add a suburb from SuburbSearch (ignore duplicates)
  const addArea = (suburb, state, postcode) => {
    if (!suburb.trim()) return;
    const label = [suburb, state].filter(Boolean).join(", ");
    setAreas(prev => {
      if (prev.some(a => a.label === label)) return prev;
      return [...prev, { suburb, state, postcode, label }];
    });
    if (errors.areas) setErrors(prev => ({ ...prev, areas: null }));
  };

  const removeArea = (label) => setAreas(prev => prev.filter(a => a.label !== label));

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = "Group name is required";
    else if (form.name.trim().length < 5) e.name = "Name must be at least 5 characters";
    if (!form.description.trim()) e.description = "Description is required";
    else if (form.description.trim().length < 20) e.description = "Description must be at least 20 characters";
    if (areas.length === 0) e.areas = "Add at least one suburb or area";
    if (form.end_date) {
      const d = new Date(form.end_date);
      if (d <= new Date()) e.end_date = "End date must be in the future";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleCoverSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { toast.error("Please select an image file"); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error("Image must be under 5MB"); return; }
    setCoverFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setCoverPreview(ev.target.result);
    reader.readAsDataURL(file);
  };

  const uploadCover = async () => {
    if (!coverFile) return null;
    setUploadingCover(true);
    try {
      const formData = new FormData();
      formData.append("file", coverFile);
      const res = await fetch(`${API_URL}/api/upload/image`, {
        method: "POST",
        credentials: "include",
        body: formData,
      });
      if (res.ok) {
        const data = await res.json();
        return data.image_url;
      }
      toast.error("Cover image upload failed");
      return null;
    } catch {
      toast.error("Cover image upload failed");
      return null;
    } finally {
      setUploadingCover(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      let cover_image = null;
      if (coverFile) {
        cover_image = await uploadCover();
        if (!cover_image) { setSubmitting(false); return; }
      }

      const areaCoverageStr = areas.map(a => a.label).join(", ");

      const payload = {
        name: form.name.trim(),
        description: form.description.trim(),
        suburb: areas[0]?.suburb || areaCoverageStr,
        area_coverage: areaCoverageStr,
        areas: areas,
        cover_image,
        end_date: form.end_date || null,
        purpose_type: form.purpose_type,
        accepted_items: form.accepted_items.trim(),
        not_accepted: form.not_accepted.trim(),
        rules: form.rules.trim(),
        is_open: form.is_open,
      };

      const res = await fetch(`${API_URL}/api/stall/groups`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const group = await res.json();
        toast.success("Donation group created!");
        navigate(returnTo || `/stall/groups/${group.group_id}`);
      } else if (res.status === 403) {
        toast.error("Village+ required to create donation groups");
        navigate("/plus");
      } else {
        const err = await res.json();
        toast.error(err.detail || "Failed to create group");
      }
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-24 lg:pl-60 lg:pb-8">
      <Navigation user={user} />

      <main className="max-w-2xl mx-auto px-4 pt-16 lg:pt-8">
        {/* Back */}
        <button
          onClick={() => navigate(returnTo || "/stall")}
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors text-sm"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to The Stall
        </button>

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-2xl bg-pink-500/10 flex items-center justify-center">
              <Heart className="h-5 w-5 text-pink-500" />
            </div>
            <div>
              <h1 className="font-heading text-2xl font-bold text-foreground">Create a Donation Group</h1>
              <p className="text-sm text-muted-foreground">Organise a giving drive for your community</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Group Type */}
          <div className="village-card p-5 space-y-4">
            <div>
              <h2 className="font-semibold text-foreground mb-0.5">Group Type</h2>
              <p className="text-xs text-muted-foreground">What kind of items is this group collecting?</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Purpose <span className="text-destructive">*</span>
              </label>
              <select
                value={form.purpose_type}
                onChange={e => set("purpose_type", e.target.value)}
                className="w-full bg-background border border-border/50 rounded-xl px-4 py-2.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-border/50 transition"
              >
                {PURPOSE_OPTIONS.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Group Details */}
          <div className="village-card p-5 space-y-4">
            <div>
              <h2 className="font-semibold text-foreground mb-0.5">Group Details</h2>
              <p className="text-xs text-muted-foreground">Give your group a clear name and tell people what it's for.</p>
            </div>

            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Group Name <span className="text-destructive">*</span>
              </label>
              <input
                value={form.name}
                onChange={e => set("name", e.target.value.slice(0, 80))}
                placeholder="e.g. Inner West Baby Clothes Drive"
                className={`w-full bg-background border rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-border/50 transition ${errors.name ? "border-destructive" : "border-border/50"}`}
              />
              <div className="flex items-center justify-between mt-1">
                {errors.name
                  ? <p className="text-xs text-destructive flex items-center gap-1"><AlertCircle className="h-3 w-3" />{errors.name}</p>
                  : <span />}
                <span className="text-xs text-muted-foreground">{form.name.length}/80</span>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Description <span className="text-destructive">*</span>
              </label>
              <textarea
                value={form.description}
                onChange={e => set("description", e.target.value.slice(0, 500))}
                rows={5}
                placeholder={"Describe what you're collecting, who it helps, and how donations work.\n\ne.g. Collecting clean baby clothes sizes 000–2 for families in the Inner West. Drop-offs welcome at Newtown Community Centre on Saturdays 9am–12pm. Contact Sarah before dropping off anything larger than a pram."}
                className={`w-full bg-background border rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-border/50 transition resize-none ${errors.description ? "border-destructive" : "border-border/50"}`}
              />
              <div className="flex items-center justify-between mt-1">
                {errors.description
                  ? <p className="text-xs text-destructive flex items-center gap-1"><AlertCircle className="h-3 w-3" />{errors.description}</p>
                  : <span />}
                <span className="text-xs text-muted-foreground">{form.description.length}/500</span>
              </div>
            </div>
          </div>

          {/* Cover Image */}
          <div className="village-card p-5">
            <h2 className="font-semibold text-foreground mb-0.5">Cover Image</h2>
            <p className="text-xs text-muted-foreground mb-4">Optional — a photo that represents your group</p>

            {coverPreview ? (
              <div className="relative rounded-xl overflow-hidden aspect-video bg-muted">
                <img src={coverPreview} alt="Cover preview" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => { setCoverPreview(null); setCoverFile(null); }}
                  className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center gap-2 aspect-video rounded-xl border-2 border-dashed border-border/50 cursor-pointer hover:border-border hover:bg-muted/30 transition-colors">
                <Upload className="h-8 w-8 text-muted-foreground/50" />
                <span className="text-sm text-muted-foreground">Click to upload a cover photo</span>
                <span className="text-xs text-muted-foreground/60">PNG, JPG up to 5MB</span>
                <input type="file" accept="image/*" className="hidden" onChange={handleCoverSelect} />
              </label>
            )}
          </div>

          {/* Location & Timing */}
          <div className="village-card p-5 space-y-4">
            <div>
              <h2 className="font-semibold text-foreground mb-0.5">Location & Timing</h2>
              <p className="text-xs text-muted-foreground">Which suburbs or areas does this group serve?</p>
            </div>

            {/* Multi-suburb area coverage */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                <MapPin className="h-3.5 w-3.5 inline mr-1 text-muted-foreground" />
                Suburbs / Areas <span className="text-destructive">*</span>
              </label>

              {/* Selected areas as chips */}
              {areas.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-2">
                  {areas.map(a => (
                    <span
                      key={a.label}
                      className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full"
                      style={{ background: "var(--sage-wash)", color: "var(--sage-deep)", border: "1px solid var(--sage)" }}
                    >
                      <MapPin className="h-3 w-3" />
                      {a.label}
                      <button
                        type="button"
                        onClick={() => removeArea(a.label)}
                        className="ml-0.5 opacity-60 hover:opacity-100 transition-opacity"
                        aria-label={`Remove ${a.label}`}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}

              <SuburbSearch
                value=""
                onChange={(suburb, state, postcode) => {
                  if (suburb) addArea(suburb, state, postcode);
                }}
                placeholder="Search for a suburb to add…"
                error={errors.areas}
              />
              <p className="text-xs text-muted-foreground mt-1.5">
                Search and add as many suburbs or areas as needed. Donors will use this to find your group.
              </p>
              {errors.areas && (
                <p className="text-xs text-destructive mt-1 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />{errors.areas}
                </p>
              )}
            </div>

            {/* End Date */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                <Calendar className="h-3.5 w-3.5 inline mr-1 text-muted-foreground" />
                End Date <span className="text-muted-foreground text-xs font-normal">(optional)</span>
              </label>
              <input
                type="date"
                value={form.end_date}
                onChange={e => set("end_date", e.target.value)}
                min={new Date(Date.now() + 86400000).toISOString().split("T")[0]}
                className={`w-full bg-background border rounded-xl px-4 py-2.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-border/50 transition ${errors.end_date ? "border-destructive" : "border-border/50"}`}
              />
              {errors.end_date && (
                <p className="text-xs text-destructive mt-1 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />{errors.end_date}
                </p>
              )}
              <p className="text-xs text-muted-foreground mt-1">Leave blank for an ongoing group</p>
            </div>
          </div>

          {/* Items & Rules */}
          <div className="village-card p-5 space-y-4">
            <div>
              <h2 className="font-semibold text-foreground mb-0.5">Items &amp; Rules</h2>
              <p className="text-xs text-muted-foreground">Help donors know exactly what to bring and how the group works.</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">What we accept</label>
              <textarea
                value={form.accepted_items}
                onChange={e => set("accepted_items", e.target.value.slice(0, 400))}
                rows={3}
                placeholder={"e.g.\n• Baby clothes sizes 000–2 (clean, no stains)\n• Muslin wraps and swaddles\n• Soft toys and baby books in good condition\n• Bouncer seats and play mats"}
                className="w-full bg-background border border-border/50 rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-border/50 transition resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">What we don't accept</label>
              <textarea
                value={form.not_accepted}
                onChange={e => set("not_accepted", e.target.value.slice(0, 400))}
                rows={3}
                placeholder={"e.g.\n• No car seats (safety reasons)\n• No electrical items\n• No damaged, stained, or worn-out clothing\n• No formula or opened food items"}
                className="w-full bg-background border border-border/50 rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-border/50 transition resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Group rules & drop-off info</label>
              <textarea
                value={form.rules}
                onChange={e => set("rules", e.target.value.slice(0, 500))}
                rows={4}
                placeholder={"e.g.\n• Items must be clean and in good condition\n• Message the organiser before dropping anything off\n• Drop-offs: Saturdays 9am–12pm, Newtown Community Centre\n• No drop-offs without prior contact — thank you!"}
                className="w-full bg-background border border-border/50 rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-border/50 transition resize-none"
              />
              <p className="text-xs text-muted-foreground mt-1">Include drop-off location, times, and any conditions donors should know about.</p>
            </div>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={form.is_open}
                onChange={e => set("is_open", e.target.checked)}
                className="accent-primary w-4 h-4"
              />
              <div>
                <p className="text-sm font-medium text-foreground">Group is open</p>
                <p className="text-xs text-muted-foreground">Uncheck to temporarily pause new donations</p>
              </div>
            </label>
          </div>

          {/* Community Guidelines blurb */}
          <div className="flex items-start gap-3 p-4 rounded-xl bg-secondary/50 border border-border/30">
            <Users className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
            <p className="text-xs text-muted-foreground leading-relaxed">
              Donation groups are community-run. As organiser you're responsible for coordinating collections respectfully and keeping the group description accurate. All activity remains subject to The Village's{" "}
              <a href="/community-guidelines" className="text-primary hover:underline">Community Guidelines</a>.
            </p>
          </div>

          {/* Submit */}
          <div className="flex gap-3 pb-6">
            <Button
              type="button"
              variant="outline"
              className="flex-1 rounded-xl"
              onClick={() => navigate(returnTo || "/stall")}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={submitting || uploadingCover}
              className="flex-1 rounded-xl gap-2"
            >
              {submitting || uploadingCover
                ? <><div className="w-4 h-4 border-2 border-[var(--paper)] border-t-transparent rounded-full animate-spin" />Creating…</>
                : <><Heart className="h-4 w-4" />Create Group</>}
            </Button>
          </div>
        </form>

        <AppFooter />
      </main>
    </div>
  );
}
