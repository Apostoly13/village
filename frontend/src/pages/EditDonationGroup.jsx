import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navigation from "../components/Navigation";
import SuburbSearch from "../components/SuburbSearch";
import { Button } from "../components/ui/button";
import { ArrowLeft, Upload, X, Heart, Search, Shield, Loader2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
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

export default function EditDonationGroup({ user }) {
  const { groupId } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [group, setGroup] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [coverPreview, setCoverPreview] = useState(null);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [coverFile, setCoverFile] = useState(null);

  // Multi-suburb area coverage
  const [areas, setAreas] = useState([]);
  const [rangeFrom, setRangeFrom] = useState("");
  const [rangeTo, setRangeTo]     = useState("");
  const [rangeError, setRangeError] = useState("");

  // Moderator search (for adding new mods)
  const [modQuery, setModQuery] = useState("");
  const [modResults, setModResults] = useState([]);
  const [modLoading, setModLoading] = useState(false);
  const [moderators, setModerators] = useState([]);
  const [removingMod, setRemovingMod] = useState(null);
  const [addingMod, setAddingMod] = useState(null);

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

  const isAdmin = user?.role === "admin" || user?.role === "moderator";
  const isOrganiser = group?.organiser_id === user?.user_id;
  const isMod = group?.moderator_ids?.includes(user?.user_id);
  const canManage = isOrganiser || isMod || isAdmin;

  // Load group data
  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`${API_URL}/api/stall/groups/${groupId}`, { credentials: "include" });
        if (!res.ok) { toast.error("Group not found"); navigate("/stall?tab=groups"); return; }
        const data = await res.json();
        setGroup(data);

        // Populate form
        setForm({
          name: data.name || "",
          description: data.description || "",
          end_date: data.end_date ? data.end_date.slice(0, 10) : "",
          purpose_type: data.purpose_type || "general_donations",
          accepted_items: data.accepted_items || "",
          not_accepted: data.not_accepted || "",
          rules: data.rules || "",
          is_open: data.is_open !== false,
        });

        // Populate areas
        if (data.areas?.length) {
          setAreas(data.areas);
        } else if (data.area_coverage) {
          // Legacy: split by comma
          const parsed = data.area_coverage.split(",").map(s => s.trim()).filter(Boolean).map(label => ({ label, suburb: label, state: "", postcode: "" }));
          setAreas(parsed);
        }

        // Populate moderators from moderators_detail if available
        if (data.moderators_detail?.length) {
          setModerators(data.moderators_detail);
        } else if (data.moderator_ids?.length) {
          // Try to fetch each mod's basic info
          const modProfiles = await Promise.all(
            data.moderator_ids.map(async (mid) => {
              try {
                const r = await fetch(`${API_URL}/api/users/${mid}/profile`, { credentials: "include" });
                if (r.ok) return await r.json();
                return { user_id: mid, name: "Member", nickname: "", picture: "" };
              } catch {
                return { user_id: mid, name: "Member", nickname: "", picture: "" };
              }
            })
          );
          setModerators(modProfiles);
        }

        if (data.cover_image) setCoverPreview(data.cover_image);
      } catch {
        toast.error("Failed to load group");
        navigate("/stall?tab=groups");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [groupId, navigate]);

  // Debounced mod user search
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

  const set = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: null }));
  };

  const addArea = (loc) => {
    const suburb = loc.suburb || loc.display_name?.split(",")[0] || "";
    if (!suburb.trim()) return;
    const state = loc.state || "";
    const postcode = loc.postcode || "";
    const label = [suburb, state].filter(Boolean).join(", ");
    setAreas(prev => {
      if (prev.some(a => a.label === label)) return prev;
      return [...prev, { suburb, state, postcode, label }];
    });
    if (errors.areas) setErrors(prev => ({ ...prev, areas: null }));
  };

  const removeArea = (label) => setAreas(prev => prev.filter(a => a.label !== label));

  const addRange = async () => {
    setRangeError("");
    const from = rangeFrom.trim();
    const to   = rangeTo.trim();
    if (!/^\d{4}$/.test(from) || !/^\d{4}$/.test(to)) {
      setRangeError("Enter two valid 4-digit Australian postcodes");
      return;
    }
    const lo = Math.min(Number(from), Number(to));
    const hi = Math.max(Number(from), Number(to));
    if (lo === hi) {
      setRangeError("Postcodes must be different — for a single postcode, use the suburb search above");
      return;
    }
    // Resolve area names + state for both ends of the range
    let label = `Postcodes ${lo}–${hi}`;
    try {
      const [resLo, resHi] = await Promise.all([
        fetch(`${API_URL}/api/location/postcode/${lo}`, { credentials: "include" }).then(r => r.ok ? r.json() : null),
        fetch(`${API_URL}/api/location/postcode/${hi}`, { credentials: "include" }).then(r => r.ok ? r.json() : null),
      ]);
      const state = resLo?.state || resHi?.state || "";
      const areaLo = resLo?.area;
      const areaHi = resHi?.area;
      if (areaLo && areaHi && areaLo !== areaHi) {
        label = `${areaLo} to ${areaHi}${state ? `, ${state}` : ""} (${lo}–${hi})`;
      } else if (areaLo || areaHi) {
        label = `${areaLo || areaHi}${state ? `, ${state}` : ""} (${lo}–${hi})`;
      } else if (state) {
        label = `Postcodes ${lo}–${hi}, ${state}`;
      }
    } catch {}
    setAreas(prev => {
      if (prev.some(a => a.postcode === `${lo}-${hi}`)) return prev;
      return [...prev, { suburb: "", state: "", postcode: `${lo}-${hi}`, label }];
    });
    setRangeFrom("");
    setRangeTo("");
  };

  // Add moderator via API (if group exists)
  const handleAddMod = async (u) => {
    if (moderators.some(m => m.user_id === u.user_id)) {
      setModQuery(""); setModResults([]); return;
    }
    setAddingMod(u.user_id);
    try {
      const res = await fetch(`${API_URL}/api/stall/groups/${groupId}/moderators`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ user_id: u.user_id }),
      });
      if (res.ok) {
        setModerators(prev => [...prev, u]);
        toast.success(`${u.nickname || u.name} added as moderator`);
      } else {
        const err = await res.json();
        toast.error(err.detail || "Failed to add moderator");
      }
    } catch { toast.error("Failed to add moderator"); }
    finally { setAddingMod(null); setModQuery(""); setModResults([]); }
  };

  // Remove moderator via API
  const handleRemoveMod = async (userId) => {
    setRemovingMod(userId);
    try {
      const res = await fetch(`${API_URL}/api/stall/groups/${groupId}/moderators/${userId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (res.ok) {
        setModerators(prev => prev.filter(m => m.user_id !== userId));
        toast.success("Moderator removed");
      } else {
        const err = await res.json();
        toast.error(err.detail || "Failed to remove moderator");
      }
    } catch { toast.error("Failed to remove moderator"); }
    finally { setRemovingMod(null); }
  };

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
      let cover_image = group?.cover_image || null;
      if (coverFile) {
        const uploaded = await uploadCover();
        if (!uploaded) { setSubmitting(false); return; }
        cover_image = uploaded;
      }

      const areaCoverageStr = areas.map(a => a.label).join(", ");

      const payload = {
        name: form.name.trim(),
        description: form.description.trim(),
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

      const res = await fetch(`${API_URL}/api/stall/groups/${groupId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        toast.success("Group updated!");
        navigate(`/stall/groups/${groupId}`);
      } else {
        const err = await res.json();
        toast.error(err.detail || "Failed to update group");
      }
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background lg:pl-60">
        <Navigation user={user} />
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (!canManage) {
    return (
      <div className="min-h-screen bg-background lg:pl-60">
        <Navigation user={user} />
        <div className="max-w-2xl mx-auto px-4 pt-16 lg:pt-8">
          <p className="text-muted-foreground">You don't have permission to edit this group.</p>
          <Button variant="outline" className="mt-4 rounded-full" onClick={() => navigate(`/stall/groups/${groupId}`)}>
            Back to Group
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24 lg:pl-60 lg:pb-8">
      <Navigation user={user} />

      <main className="max-w-2xl mx-auto px-4 pt-16 lg:pt-8">
        {/* Back */}
        <button
          onClick={() => navigate(`/stall/groups/${groupId}`)}
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors text-sm"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Group
        </button>

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-2xl bg-pink-500/10 flex items-center justify-center">
              <Heart className="h-5 w-5 text-pink-500" />
            </div>
            <div>
              <h1 className="font-heading text-2xl font-bold text-foreground">Edit Donation Group</h1>
              <p className="text-sm text-muted-foreground">Update your group's details</p>
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
              <label className="block text-sm font-medium text-foreground mb-1.5">Purpose</label>
              <select
                value={form.purpose_type}
                onChange={e => set("purpose_type", e.target.value)}
                className="w-full bg-background border border-border/50 rounded-xl px-4 py-2.5 text-sm text-foreground outline-none transition"
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
              <p className="text-xs text-muted-foreground">Give your group a clear name and description.</p>
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
                className={`w-full bg-background border rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none transition ${errors.name ? "border-destructive" : "border-border/50"}`}
              />
              <div className="flex items-center justify-between mt-1">
                {errors.name
                  ? <p className="text-xs text-destructive">{errors.name}</p>
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
                onChange={e => set("description", e.target.value.slice(0, 600))}
                rows={4}
                placeholder={`Tell people what this group is about.\n\nInclude:\n• What you're collecting and why\n• Where and when to drop off (e.g. 42 Smith St, Saturdays 9–11am)\n• How long the drive runs\n• Who to contact with questions`}
                className={`w-full bg-background border rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none transition resize-none ${errors.description ? "border-destructive" : "border-border/50"}`}
              />
              <div className="flex items-center justify-between mt-1">
                {errors.description
                  ? <p className="text-xs text-destructive">{errors.description}</p>
                  : <span />}
                <span className="text-xs text-muted-foreground">{form.description.length}/600</span>
              </div>
            </div>
          </div>

          {/* Cover Image */}
          <div className="village-card p-5 space-y-4">
            <div>
              <h2 className="font-semibold text-foreground mb-0.5">Cover Image</h2>
              <p className="text-xs text-muted-foreground">Optional — a photo helps your group stand out.</p>
            </div>
            <div className="relative">
              {coverPreview ? (
                <div className="relative rounded-xl overflow-hidden aspect-[2/1]">
                  <img src={coverPreview} alt="Cover" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => { setCoverPreview(null); setCoverFile(null); }}
                    className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 transition"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-border/50 rounded-xl p-8 cursor-pointer hover:border-border transition text-center">
                  <Upload className="h-6 w-6 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Click to upload a cover photo</span>
                  <span className="text-xs text-muted-foreground">JPG, PNG or WebP — max 5MB</span>
                  <input type="file" accept="image/*" className="hidden" onChange={handleCoverSelect} />
                </label>
              )}
            </div>
          </div>

          {/* Area Coverage */}
          <div className="village-card p-5 space-y-4">
            <div>
              <h2 className="font-semibold text-foreground mb-0.5">Area Coverage</h2>
              <p className="text-xs text-muted-foreground">Which suburbs or areas does this group serve?</p>
            </div>

            {/* Existing chips */}
            {areas.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {areas.map((a) => (
                  <span
                    key={a.label}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border"
                    style={{ background: "var(--sage-wash)", color: "var(--sage-deep)", borderColor: "color-mix(in srgb, var(--sage) 30%, transparent)" }}
                  >
                    {a.label}
                    <button type="button" onClick={() => removeArea(a.label)} className="hover:opacity-70 transition">
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}

            <SuburbSearch
              value=""
              onSelect={addArea}
              clearAfterSelect
              placeholder="Search suburb or postcode (e.g. Newtown or 3050)…"
              error={errors.areas}
            />

            {/* Postcode range */}
            <div className="mt-3">
              <p className="text-xs text-muted-foreground mb-2">Or add a postcode range:</p>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={4}
                  value={rangeFrom}
                  onChange={e => { setRangeFrom(e.target.value.replace(/\D/g, "")); setRangeError(""); }}
                  placeholder="From"
                  className="w-24 bg-background border border-border/50 rounded-xl px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none transition text-center"
                />
                <span className="text-xs text-muted-foreground shrink-0">to</span>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={4}
                  value={rangeTo}
                  onChange={e => { setRangeTo(e.target.value.replace(/\D/g, "")); setRangeError(""); }}
                  placeholder="To"
                  className="w-24 bg-background border border-border/50 rounded-xl px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none transition text-center"
                />
                <button
                  type="button"
                  onClick={addRange}
                  disabled={!rangeFrom || !rangeTo}
                  className="px-3 py-2 rounded-xl text-xs font-medium border border-border/50 hover:bg-secondary/60 transition disabled:opacity-40 shrink-0"
                  style={{ color: "var(--ink-2)" }}
                >
                  Add range
                </button>
              </div>
              {rangeError && <p className="text-xs text-destructive mt-1">{rangeError}</p>}
            </div>
          </div>

          {/* What's Accepted */}
          <div className="village-card p-5 space-y-4">
            <div>
              <h2 className="font-semibold text-foreground mb-0.5">Accepted Items</h2>
              <p className="text-xs text-muted-foreground">Help donors know what to bring — be specific.</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">What we accept</label>
              <textarea
                value={form.accepted_items}
                onChange={e => set("accepted_items", e.target.value.slice(0, 400))}
                rows={3}
                placeholder={`e.g.\n• Baby clothes sizes 000–2\n• Clean, good condition only\n• Folded and in bags please\n• Bibs, wraps, and onesies welcome`}
                className="w-full bg-background border border-border/50 rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none transition resize-none"
              />
              <p className="text-xs text-muted-foreground mt-1 text-right">{form.accepted_items.length}/400</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">What we don't accept</label>
              <textarea
                value={form.not_accepted}
                onChange={e => set("not_accepted", e.target.value.slice(0, 300))}
                rows={2}
                placeholder={`e.g.\n• Stained or damaged items\n• Car seats or cots\n• Items without labels`}
                className="w-full bg-background border border-border/50 rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none transition resize-none"
              />
              <p className="text-xs text-muted-foreground mt-1 text-right">{form.not_accepted.length}/300</p>
            </div>
          </div>

          {/* Rules */}
          <div className="village-card p-5 space-y-4">
            <div>
              <h2 className="font-semibold text-foreground mb-0.5">Group Rules</h2>
              <p className="text-xs text-muted-foreground">Any guidelines for members — optional but helpful.</p>
            </div>
            <textarea
              value={form.rules}
              onChange={e => set("rules", e.target.value.slice(0, 400))}
              rows={3}
              placeholder={`e.g.\n• All items are donated freely — no selling within this group\n• Contact the organiser before dropping off\n• Please don't request specific items`}
              className="w-full bg-background border border-border/50 rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none transition resize-none"
            />
            <p className="text-xs text-muted-foreground text-right">{form.rules.length}/400</p>
          </div>

          {/* End Date */}
          <div className="village-card p-5 space-y-4">
            <div>
              <h2 className="font-semibold text-foreground mb-0.5">End Date</h2>
              <p className="text-xs text-muted-foreground">Set a closing date, or leave blank for an ongoing group.</p>
            </div>
            <div>
              <input
                type="date"
                value={form.end_date}
                onChange={e => set("end_date", e.target.value)}
                min={new Date().toISOString().slice(0, 10)}
                className={`w-full bg-background border rounded-xl px-4 py-2.5 text-sm text-foreground outline-none transition ${errors.end_date ? "border-destructive" : "border-border/50"}`}
              />
              {errors.end_date && <p className="text-xs text-destructive mt-1">{errors.end_date}</p>}
              {form.end_date && (
                <button type="button" onClick={() => set("end_date", "")} className="mt-1 text-xs text-muted-foreground hover:text-foreground transition">
                  Clear date (make ongoing)
                </button>
              )}
            </div>
          </div>

          {/* Open / Closed toggle */}
          <div className="village-card p-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="font-semibold text-foreground mb-0.5">Accepting Donations</h2>
                <p className="text-xs text-muted-foreground">Pause donations if you need a break or are at capacity.</p>
              </div>
              <button
                type="button"
                onClick={() => set("is_open", !form.is_open)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${form.is_open ? "bg-emerald-500" : "bg-muted"}`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${form.is_open ? "translate-x-6" : "translate-x-1"}`} />
              </button>
            </div>
            <p className="text-xs mt-2" style={{ color: form.is_open ? "var(--sage-deep)" : "var(--ink-3)" }}>
              {form.is_open ? "Group is open and accepting donations" : "Group is paused — not accepting donations right now"}
            </p>
          </div>

          {/* Moderators — organiser only */}
          {isOrganiser && (
            <div className="village-card p-5 space-y-4">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-muted-foreground" />
                <div>
                  <h2 className="font-semibold text-foreground mb-0">Moderators</h2>
                  <p className="text-xs text-muted-foreground">Moderators can help manage the group and respond to members.</p>
                </div>
              </div>

              {/* Current mods */}
              {moderators.length > 0 && (
                <div className="space-y-2">
                  {moderators.map((m) => (
                    <div key={m.user_id} className="flex items-center justify-between gap-3 py-1">
                      <div className="flex items-center gap-2.5">
                        <Avatar className="h-7 w-7">
                          <AvatarImage src={m.picture} />
                          <AvatarFallback className="text-[10px]">{(m.nickname || m.name || "M").charAt(0).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <span className="text-sm text-foreground">{m.nickname || m.name}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveMod(m.user_id)}
                        disabled={removingMod === m.user_id}
                        className="text-xs text-muted-foreground hover:text-destructive transition"
                      >
                        {removingMod === m.user_id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Remove"}
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Add mod search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <input
                  value={modQuery}
                  onChange={e => setModQuery(e.target.value)}
                  placeholder="Search for a member to add as moderator…"
                  className="w-full bg-background border border-border/50 rounded-xl pl-9 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none"
                />
                {modLoading && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
                  </div>
                )}
              </div>
              {modResults.length > 0 && (
                <div className="border border-border/50 rounded-xl overflow-hidden divide-y divide-border/30">
                  {modResults.map((u) => {
                    const alreadyMod = moderators.some(m => m.user_id === u.user_id);
                    return (
                      <button
                        key={u.user_id}
                        type="button"
                        onClick={() => handleAddMod(u)}
                        disabled={alreadyMod || addingMod === u.user_id}
                        className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-secondary/60 transition-colors text-left disabled:opacity-50"
                      >
                        <Avatar className="h-7 w-7 shrink-0">
                          <AvatarImage src={u.picture} />
                          <AvatarFallback className="text-[10px]">{(u.nickname || u.name || "?").charAt(0).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-foreground truncate">{u.nickname || u.name}</p>
                          {u.suburb && <p className="text-xs text-muted-foreground">{u.suburb}</p>}
                        </div>
                        {addingMod === u.user_id
                          ? <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground shrink-0" />
                          : alreadyMod
                            ? <span className="text-xs text-muted-foreground shrink-0">Already added</span>
                            : <span className="text-xs" style={{ color: "var(--sage-deep)" }}>Add</span>
                        }
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Save button */}
          <div className="flex gap-3 pb-8">
            <Button
              type="button"
              variant="outline"
              className="flex-1 rounded-full"
              onClick={() => navigate(`/stall/groups/${groupId}`)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={submitting || uploadingCover}
              className="flex-1 rounded-full font-semibold"
              style={{ background: "var(--ink)", color: "var(--paper)" }}
            >
              {submitting ? (
                <span className="flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Saving…</span>
              ) : "Save Changes"}
            </Button>
          </div>
        </form>
      </main>
      <AppFooter />
    </div>
  );
}
