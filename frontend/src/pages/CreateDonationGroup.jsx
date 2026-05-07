import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Navigation from "../components/Navigation";
import { Button } from "../components/ui/button";
import { ArrowLeft, Upload, X, Users, Calendar, MapPin, Heart, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import AppFooter from "../components/AppFooter";

const API_URL = process.env.REACT_APP_BACKEND_URL;

export default function CreateDonationGroup({ user }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const returnTo = searchParams.get("returnTo");

  const [submitting, setSubmitting] = useState(false);
  const [coverPreview, setCoverPreview] = useState(null);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [coverFile, setCoverFile] = useState(null);

  const [form, setForm] = useState({
    name: "",
    description: "",
    suburb: "",
    end_date: "",
  });

  const [errors, setErrors] = useState({});

  const set = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: null }));
  };

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = "Group name is required";
    else if (form.name.trim().length < 5) e.name = "Name must be at least 5 characters";
    if (!form.description.trim()) e.description = "Description is required";
    else if (form.description.trim().length < 20) e.description = "Description must be at least 20 characters";
    if (!form.suburb.trim()) e.suburb = "Suburb is required";
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

      const payload = {
        name: form.name.trim(),
        description: form.description.trim(),
        suburb: form.suburb.trim(),
        cover_image,
        end_date: form.end_date || null,
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
          {/* Cover Image */}
          <div className="village-card p-5">
            <h2 className="font-semibold text-foreground mb-1">Cover Image</h2>
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
              <label className="flex flex-col items-center justify-center gap-2 aspect-video rounded-xl border-2 border-dashed border-border/50 cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-colors">
                <Upload className="h-8 w-8 text-muted-foreground/50" />
                <span className="text-sm text-muted-foreground">Click to upload a cover photo</span>
                <span className="text-xs text-muted-foreground/60">PNG, JPG up to 5MB</span>
                <input type="file" accept="image/*" className="hidden" onChange={handleCoverSelect} />
              </label>
            )}
          </div>

          {/* Group Details */}
          <div className="village-card p-5 space-y-4">
            <h2 className="font-semibold text-foreground">Group Details</h2>

            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Group Name <span className="text-destructive">*</span>
              </label>
              <input
                value={form.name}
                onChange={e => set("name", e.target.value.slice(0, 80))}
                placeholder="e.g. Winter Warmth Drive — Bondi Mums"
                className={`w-full bg-background border rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/30 transition ${errors.name ? "border-destructive" : "border-border/50"}`}
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
                rows={4}
                placeholder="Tell people what this group is for, who benefits, and what items you're collecting…"
                className={`w-full bg-background border rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/30 transition resize-none ${errors.description ? "border-destructive" : "border-border/50"}`}
              />
              <div className="flex items-center justify-between mt-1">
                {errors.description
                  ? <p className="text-xs text-destructive flex items-center gap-1"><AlertCircle className="h-3 w-3" />{errors.description}</p>
                  : <span />}
                <span className="text-xs text-muted-foreground">{form.description.length}/500</span>
              </div>
            </div>
          </div>

          {/* Location & Timing */}
          <div className="village-card p-5 space-y-4">
            <h2 className="font-semibold text-foreground">Location & Timing</h2>

            {/* Suburb */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                <MapPin className="h-3.5 w-3.5 inline mr-1 text-muted-foreground" />
                Suburb <span className="text-destructive">*</span>
              </label>
              <input
                value={form.suburb}
                onChange={e => set("suburb", e.target.value.slice(0, 60))}
                placeholder="e.g. Bondi Beach, NSW"
                className={`w-full bg-background border rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/30 transition ${errors.suburb ? "border-destructive" : "border-border/50"}`}
              />
              {errors.suburb && (
                <p className="text-xs text-destructive mt-1 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />{errors.suburb}
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
                className={`w-full bg-background border rounded-xl px-4 py-2.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/30 transition ${errors.end_date ? "border-destructive" : "border-border/50"}`}
              />
              {errors.end_date && (
                <p className="text-xs text-destructive mt-1 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />{errors.end_date}
                </p>
              )}
              <p className="text-xs text-muted-foreground mt-1">Leave blank for an ongoing group</p>
            </div>
          </div>

          {/* Community Guidelines blurb */}
          <div className="flex items-start gap-3 p-4 rounded-xl bg-secondary/50 border border-border/30">
            <Users className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
            <p className="text-xs text-muted-foreground leading-relaxed">
              Donation groups are community-run. As organiser you're responsible for coordinating collections respectfully and keeping the group description accurate. Items listed under this group remain subject to The Village's{" "}
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
                ? <><div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />Creating…</>
                : <><Heart className="h-4 w-4" />Create Group</>}
            </Button>
          </div>
        </form>

        <AppFooter />
      </main>
    </div>
  );
}
