import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Label } from "../components/ui/label";
import { toast } from "sonner";
import { ArrowRight, ArrowLeft, MapPin, Check, MessageCircle, Users, Heart, EyeOff, Calendar } from "lucide-react";

const API_URL = process.env.REACT_APP_BACKEND_URL;

const INTEREST_OPTIONS = [
  { label: "Sleep & Settling", emoji: "🌙" },
  { label: "Feeding", emoji: "🍼" },
  { label: "Toddler Activities", emoji: "🧸" },
  { label: "School Age", emoji: "🎒" },
  { label: "Mental Health", emoji: "💚" },
  { label: "Dad Talk", emoji: "👨" },
  { label: "Mum Talk", emoji: "👩" },
  { label: "Local Events", emoji: "📍" },
  { label: "Recipes & Nutrition", emoji: "🥦" },
  { label: "Development Milestones", emoji: "⭐" },
  { label: "Raising Multiples", emoji: "👶👶" },
];

const PARENTING_STAGES = [
  { id: "expecting", label: "Expecting", emoji: "🤰", desc: "Baby on the way" },
  { id: "newborn", label: "Newborn", emoji: "👶", desc: "0 – 3 months" },
  { id: "infant", label: "Infant", emoji: "🧒", desc: "3 – 12 months" },
  { id: "toddler", label: "Toddler", emoji: "🚶", desc: "1 – 3 years" },
  { id: "school_age", label: "School Age", emoji: "🎒", desc: "5 – 12 years" },
  { id: "teenager", label: "Teenager", emoji: "🧑", desc: "13+ years" },
  { id: "multiples", label: "Twins/Triplets", emoji: "👶👶", desc: "Two or more!" },
  { id: "mixed", label: "Mixed ages", emoji: "👨‍👩‍👧‍👦", desc: "Multiple kids" },
];

const AUSTRALIAN_STATES = ["NSW", "VIC", "QLD", "WA", "SA", "TAS", "ACT", "NT"];

const TOTAL_STEPS = 6;

const GENDER_OPTIONS = [
  { id: "female", label: "Female", emoji: "👩" },
  { id: "male", label: "Male", emoji: "👨" },
  { id: "prefer_not_say", label: "Prefer not to say", emoji: "🤐" },
];

function ProgressBar({ step }) {
  return (
    <div className="w-full bg-secondary/50 rounded-full h-1.5">
      <div
        className="bg-primary h-1.5 rounded-full transition-all duration-500"
        style={{ width: `${(step / TOTAL_STEPS) * 100}%` }}
      />
    </div>
  );
}

export default function Onboarding({ user }) {
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);

  // Always start at step 1 so users can review/edit their profile in full.
  // Jump to the final "all set" step only if onboarding is already marked complete.
  const [step, setStep] = useState(() => {
    if (user?.onboarding_complete) return 6;
    return 1;
  });

  // Step 2b — Gender
  const [gender, setGender] = useState(user?.gender || "");

  // Step 2 — About You
  const [nickname, setNickname] = useState(user?.nickname || user?.name || "");
  const [bio, setBio] = useState(user?.bio || "");
  const [parentingStage, setParentingStage] = useState(user?.parenting_stage || "");
  const [mixedAgeGroups, setMixedAgeGroups] = useState(user?.mixed_age_groups || []);
  const [isSingleParent, setIsSingleParent] = useState(user?.is_single_parent || false);
  const [isMultipleBirth, setIsMultipleBirth] = useState(user?.is_multiple_birth || false);

  const toggleMixedAgeGroup = (id) => {
    setMixedAgeGroups(prev =>
      prev.includes(id) ? prev.filter(g => g !== id) : [...prev, id]
    );
  };

  // Step 3 — Location
  const [locationSearch, setLocationSearch] = useState(
    user?.suburb ? `${user.suburb}${user.postcode ? ", " + user.postcode : ""}` : ""
  );
  const [locationResults, setLocationResults] = useState([]);
  const [searchingLocation, setSearchingLocation] = useState(false);
  const [suburb, setSuburb] = useState(user?.suburb || "");
  const [postcode, setPostcode] = useState(user?.postcode || "");
  const [selectedState, setSelectedState] = useState(user?.state || "");
  const [latitude, setLatitude] = useState(user?.latitude || null);
  const [longitude, setLongitude] = useState(user?.longitude || null);

  // Step 4 — Interests
  const [interests, setInterests] = useState(user?.interests || []);

  const toggleInterest = (label) => {
    setInterests(prev =>
      prev.includes(label) ? prev.filter(i => i !== label) : [...prev, label]
    );
  };

  // useCallback prevents a new function reference on every render,
  // which was causing the location input to lose focus
  const searchLocation = useCallback(async (q) => {
    setLocationSearch(q);
    if (q.length < 2) { setLocationResults([]); return; }
    setSearchingLocation(true);
    try {
      const res = await fetch(`${API_URL}/api/location/search?q=${encodeURIComponent(q)}`, { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setLocationResults(data.results || []);
      }
    } catch {}
    finally { setSearchingLocation(false); }
  }, []);

  const selectLocation = (loc) => {
    const suburbName = loc.suburb || loc.name || "";
    setSuburb(suburbName);
    setPostcode(loc.postcode || "");
    setSelectedState(loc.state || "");
    // Backend returns lat/lon (OpenStreetMap field names)
    setLatitude(loc.lat || loc.latitude || null);
    setLongitude(loc.lon || loc.longitude || null);
    setLocationSearch(`${suburbName}${loc.postcode ? ", " + loc.postcode : ""}`);
    setLocationResults([]);
  };

  const saveAndFinish = async () => {
    setSaving(true);
    const profileData = {
      nickname: nickname.trim() || user?.name,
      bio: bio.trim(),
      parenting_stage: parentingStage,
      gender: gender || undefined,
      is_single_parent: isSingleParent,
      is_multiple_birth: parentingStage === "multiples" || (parentingStage === "mixed" && isMultipleBirth),
      suburb: suburb,
      postcode: postcode,
      state: selectedState,
      location: suburb,
      latitude: latitude,
      longitude: longitude,
      interests: interests,
      mixed_age_groups: parentingStage === "mixed" ? mixedAgeGroups : [],
      onboarding_complete: true,
    };
    // Optimistically update localStorage so redirect check sees correct data
    const current = JSON.parse(localStorage.getItem("user") || "{}");
    localStorage.setItem("user", JSON.stringify({ ...current, ...profileData }));
    try {
      await fetch(`${API_URL}/api/users/profile`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(profileData),
      });
      const me = await fetch(`${API_URL}/api/auth/me`, { credentials: "include" });
      if (me.ok) localStorage.setItem("user", JSON.stringify(await me.json()));
    } catch {
      toast.error("Couldn't save profile — you can update it later in Settings.");
    } finally {
      setSaving(false);
    }
  };

  const handleNext = async () => {
    if (step === 5) {
      await saveAndFinish();
      setStep(6);
    } else {
      setStep(s => s + 1);
    }
  };

  const handleBack = () => setStep(s => s - 1);
  const handleDone = () => { window.location.href = "/dashboard"; };

  const canProceed = () => {
    if (step === 2) return nickname.trim().length > 0 && parentingStage !== "";
    return true;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-sm border-b border-border/30 px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center gap-4">
          <div className="flex items-center shrink-0">
            <img src="/BG Removed- Main Logo.png" alt="The Village" className="h-16 w-auto" />
          </div>
          <div className="flex-1">
            <ProgressBar step={step} />
          </div>
          <span className="text-xs text-muted-foreground shrink-0">{step}/{TOTAL_STEPS}</span>
        </div>
      </div>

      {/* Content */}
      <div className="pt-20 pb-28 px-4">
        <div className="max-w-2xl mx-auto">

          {/* ── Step 1: Welcome ─────────────────────────────── */}
          {step === 1 && (
            <div className="text-center animate-fade-in">
              <img src="/BG Removed- Main Logo.png" alt="The Village" className="h-72 w-auto mx-auto mb-6" />
              <h1 className="font-heading text-3xl sm:text-4xl font-bold text-foreground mb-3">
                Welcome to The Village,<br />
                <span className="text-primary">{user?.name?.split(" ")[0] || "friend"}!</span>
              </h1>
              <p className="text-muted-foreground text-lg mb-8 max-w-md mx-auto leading-relaxed">
                A judgment-free community for Australian parents — whether you're expecting,
                up at 3am, or just need someone who gets it.
              </p>

              {/* Anonymous callout */}
              <div className="flex items-center gap-3 bg-primary/10 border border-primary/20 rounded-2xl p-4 mb-8 max-w-md mx-auto text-left">
                <EyeOff className="h-5 w-5 text-primary shrink-0" />
                <div>
                  <p className="text-sm font-medium text-foreground">You control your privacy</p>
                  <p className="text-xs text-muted-foreground">Post or chat anonymously any time — no name, no avatar, just honest conversation.</p>
                </div>
              </div>

              <div className="grid sm:grid-cols-3 gap-4 mb-10 text-left max-w-xl mx-auto">
                {[
                  { icon: MessageCircle, emoji: "💬", title: "Support Spaces", desc: "Topic-based forums for real conversations — feeding, sleep, mental health, and more." },
                  { icon: Users, emoji: "🗣️", title: "Chat Circles", desc: "Real-time chat rooms for your suburb, your stage, and Australia-wide." },
                  { icon: Calendar, emoji: "📅", title: "Events", desc: "Find and RSVP to local meetups and playgroups near you." },
                ].map(({ emoji, title, desc }) => (
                  <div key={title} className="bg-card rounded-2xl p-4 border border-border/50">
                    <span className="text-2xl mb-2 block">{emoji}</span>
                    <h3 className="font-heading font-semibold text-foreground text-sm mb-1">{title}</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
                  </div>
                ))}
              </div>

              <Button
                onClick={handleNext}
                size="lg"
                className="rounded-full px-8 bg-primary text-primary-foreground shadow-[0_0_20px_rgba(245,197,66,0.3)] hover:shadow-[0_0_30px_rgba(245,197,66,0.4)]"
              >
                Set up my profile
                <ArrowRight className="h-5 w-5 ml-2" />
              </Button>
            </div>
          )}

          {/* ── Step 2: About You ───────────────────────────── */}
          {step === 2 && (
            <div className="animate-fade-in max-w-lg mx-auto w-full">
              <h2 className="font-heading text-2xl font-bold text-foreground mb-1">About you</h2>
              <p className="text-muted-foreground mb-6">This is what other parents see. You can always use a nickname — no pressure to use your real name.</p>

              <div className="space-y-5">
                <div className="space-y-1.5">
                  <Label className="text-foreground font-medium">Display name</Label>
                  <Input
                    value={nickname}
                    onChange={e => setNickname(e.target.value)}
                    placeholder="What should we call you?"
                    className="h-12 rounded-xl bg-secondary/50 border-transparent focus:border-primary"
                  />
                  <p className="text-xs text-muted-foreground">A nickname works great — many parents prefer it for privacy.</p>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-foreground font-medium">A little about you <span className="text-muted-foreground font-normal">(optional)</span></Label>
                  <Textarea
                    value={bio}
                    onChange={e => setBio(e.target.value)}
                    placeholder="e.g. Mum to a 4-month-old, surviving on coffee and love ☕"
                    className="rounded-xl bg-secondary/50 border-transparent focus:border-primary resize-none"
                    rows={3}
                  />
                  <p className="text-xs text-muted-foreground">You can keep this blank and post anonymously whenever you want.</p>
                </div>

                <div className="space-y-2">
                  <Label className="text-foreground font-medium">Where are you at?</Label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {PARENTING_STAGES.map(stage => (
                      <button
                        key={stage.id}
                        onClick={() => setParentingStage(stage.id)}
                        className={`rounded-xl p-3 text-left border-2 transition-all ${
                          parentingStage === stage.id
                            ? "border-primary bg-primary/10"
                            : "border-border/50 bg-card hover:border-primary/40"
                        }`}
                      >
                        <span className="text-xl block mb-1">{stage.emoji}</span>
                        <span className="text-sm font-medium text-foreground block">{stage.label}</span>
                        <span className="text-xs text-muted-foreground">{stage.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {(parentingStage === "mixed" || parentingStage === "multiples") && (
                  <div className="space-y-2 pl-1 border-l-2 border-primary/30 ml-1">
                    <Label className="text-foreground font-medium text-sm">
                      {parentingStage === "multiples" ? "How old are your multiples?" : "Which age groups?"}{" "}
                      <span className="text-muted-foreground font-normal">(select all that apply)</span>
                    </Label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {PARENTING_STAGES.filter(s => s.id !== "mixed" && s.id !== "multiples").map(stage => {
                        const active = mixedAgeGroups.includes(stage.id);
                        return (
                          <button
                            key={stage.id}
                            onClick={() => toggleMixedAgeGroup(stage.id)}
                            className={`rounded-xl p-2.5 text-left border-2 transition-all flex items-center gap-2 ${
                              active ? "border-primary bg-primary/10" : "border-border/50 bg-card hover:border-primary/40"
                            }`}
                          >
                            <span className="text-lg">{stage.emoji}</span>
                            <div>
                              <span className="text-xs font-medium text-foreground block">{stage.label}</span>
                              <span className="text-xs text-muted-foreground">{stage.desc}</span>
                            </div>
                            {active && <Check className="h-3.5 w-3.5 text-primary ml-auto flex-shrink-0" />}
                          </button>
                        );
                      })}
                    </div>

                    {parentingStage === "mixed" && (
                      <button
                        onClick={() => setIsMultipleBirth(p => !p)}
                        className={`w-full rounded-xl px-3 py-2.5 border-2 flex items-center gap-3 transition-all text-left ${
                          isMultipleBirth ? "border-primary bg-primary/10" : "border-border/50 bg-card hover:border-primary/40"
                        }`}
                      >
                        <span className="text-base">👶👶</span>
                        <span className="text-xs font-medium text-foreground flex-1">Some of these include twins or triplets</span>
                        {isMultipleBirth && <Check className="h-3.5 w-3.5 text-primary flex-shrink-0" />}
                      </button>
                    )}
                  </div>
                )}

                <button
                  onClick={() => setIsSingleParent(p => !p)}
                  className={`w-full rounded-xl p-4 border-2 flex items-center gap-3 transition-all text-left ${
                    isSingleParent ? "border-primary bg-primary/10" : "border-border/50 bg-card hover:border-primary/40"
                  }`}
                >
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                    isSingleParent ? "border-primary bg-primary" : "border-border"
                  }`}>
                    {isSingleParent && <Check className="h-3 w-3 text-primary-foreground" />}
                  </div>
                  <div>
                    <p className="font-medium text-foreground text-sm">I'm a single parent 💪</p>
                    <p className="text-xs text-muted-foreground">We'll connect you with others in the same boat</p>
                  </div>
                </button>

              </div>
            </div>
          )}

          {/* ── Step 3: Gender ──────────────────────────────── */}
          {step === 3 && (
            <div className="animate-fade-in max-w-lg mx-auto w-full">
              <h2 className="font-heading text-2xl font-bold text-foreground mb-1">How do you identify?</h2>
              <p className="text-muted-foreground mb-6">Optional — helps us connect you with the right spaces and communities.</p>

              <div className="grid grid-cols-2 gap-3">
                {GENDER_OPTIONS.map(opt => (
                  <button
                    key={opt.id}
                    onClick={() => setGender(gender === opt.id ? "" : opt.id)}
                    className={`rounded-xl p-4 text-left border-2 flex items-center gap-3 transition-all ${
                      gender === opt.id ? "border-primary bg-primary/10" : "border-border/50 bg-card hover:border-primary/40"
                    }`}
                  >
                    <span className="text-2xl">{opt.emoji}</span>
                    <span className={`text-sm font-medium ${gender === opt.id ? "text-primary" : "text-foreground"}`}>{opt.label}</span>
                    {gender === opt.id && <Check className="h-4 w-4 text-primary ml-auto" />}
                  </button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground text-center mt-4">You can skip this or change it any time in your profile.</p>
            </div>
          )}

          {/* ── Step 4: Location ────────────────────────────── */}
          {step === 4 && (
            <div className="animate-fade-in max-w-lg mx-auto w-full">
              <h2 className="font-heading text-2xl font-bold text-foreground mb-1">Your location</h2>
              <p className="text-muted-foreground mb-2">
                Connect with parents near you — in your suburb, postcode, or state.
              </p>
              <div className="flex items-center gap-2 mb-6 text-xs text-muted-foreground bg-secondary/50 rounded-xl px-3 py-2">
                <MapPin className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                Your location is never shown publicly. It's only used to surface local chat rooms and nearby parents.
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5 relative">
                  <Label className="text-foreground font-medium">Suburb or postcode</Label>
                  <Input
                    value={locationSearch}
                    onChange={e => searchLocation(e.target.value)}
                    placeholder="e.g. Bondi, 2026, Fitzroy..."
                    className="h-12 rounded-xl bg-secondary/50 border-transparent focus:border-primary"
                    autoComplete="off"
                  />
                  {searchingLocation && (
                    <p className="text-xs text-muted-foreground px-1 mt-1">Searching...</p>
                  )}
                  {locationResults.length > 0 && (
                    <div className="absolute top-full left-0 right-0 z-50 bg-card border border-border/50 rounded-xl shadow-lg mt-1 overflow-hidden">
                      {locationResults.slice(0, 6).map((loc, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => selectLocation(loc)}
                          className="w-full px-4 py-3 text-left hover:bg-secondary/50 border-b border-border/30 last:border-0 transition-colors"
                        >
                          <span className="font-medium text-foreground text-sm">{loc.suburb || loc.name}</span>
                          <span className="text-muted-foreground text-xs ml-2">{loc.postcode} · {loc.state}</span>
                        </button>
                      ))}
                    </div>
                  )}
                  {suburb && (
                    <p className="text-xs text-primary px-1 mt-1 flex items-center gap-1">
                      <Check className="h-3 w-3" /> {suburb}{postcode ? `, ${postcode}` : ""}{selectedState ? ` · ${selectedState}` : ""}
                    </p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label className="text-foreground font-medium">State <span className="text-muted-foreground font-normal">(or select manually)</span></Label>
                  <div className="grid grid-cols-4 gap-2">
                    {AUSTRALIAN_STATES.map(s => (
                      <button
                        key={s}
                        onClick={() => setSelectedState(s)}
                        className={`rounded-xl py-2.5 text-sm font-medium border-2 transition-all ${
                          selectedState === s
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border/50 bg-card hover:border-primary/40 text-foreground"
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── Step 5: Interests ───────────────────────────── */}
          {step === 5 && (
            <div className="animate-fade-in max-w-lg mx-auto w-full">
              <h2 className="font-heading text-2xl font-bold text-foreground mb-1">Your interests</h2>
              <p className="text-muted-foreground mb-6">
                Pick what matters to you — we'll personalise your Support Spaces and Chat Circles. You can change these any time in your profile.
              </p>
              <div className="grid grid-cols-2 gap-2">
                {INTEREST_OPTIONS.map(({ label, emoji }) => {
                  const active = interests.includes(label);
                  return (
                    <button
                      key={label}
                      onClick={() => toggleInterest(label)}
                      className={`rounded-xl px-4 py-3 text-left border-2 flex items-center gap-3 transition-all ${
                        active ? "border-primary bg-primary/10" : "border-border/50 bg-card hover:border-primary/40"
                      }`}
                    >
                      <span className="text-xl">{emoji}</span>
                      <span className={`text-sm font-medium ${active ? "text-primary" : "text-foreground"}`}>{label}</span>
                      {active && <Check className="h-4 w-4 text-primary ml-auto" />}
                    </button>
                  );
                })}
              </div>
              {interests.length === 0 && (
                <p className="text-xs text-muted-foreground text-center mt-4">Select at least one to get personalised recommendations</p>
              )}
            </div>
          )}

          {/* ── Step 6: Tour ────────────────────────────────── */}
          {step === 6 && (
            <div className="animate-fade-in text-center max-w-lg mx-auto w-full">
              <div className="flex items-center justify-center mx-auto mb-6">
                <img src="/the_village_wordmark_light.png" alt="The Village" className="h-52 w-auto" />
              </div>
              <h2 className="font-heading text-2xl font-bold text-foreground mb-2">You're all set!</h2>
              <p className="text-muted-foreground mb-8">Here's how to make the most of The Village.</p>

              <div className="space-y-3 text-left mb-8">
                {[
                  {
                    emoji: "💬",
                    title: "Support Spaces",
                    tips: [
                      "Topic-based forums — Feeding, Sleep, Mental Health, Dad Circle, Mum Circle and more",
                      "Post anonymously whenever you want — no name, no avatar shown",
                      "Reply and react — every response helps someone feel less alone",
                    ],
                  },
                  {
                    emoji: "🗣️",
                    title: "Chat Circles",
                    tips: [
                      "Real-time chat grouped by suburb, stage, and national rooms",
                      "The 3am Club is most active between 10pm and 4am — late-night support when you need it",
                      "Chat anonymously — just tap the anon toggle before you type",
                    ],
                  },
                  {
                    emoji: "🔒",
                    title: "Anonymous posting",
                    tips: [
                      "Any post or chat message can be anonymous — your choice, every time",
                      "Anonymous posts show no name or profile picture",
                      "Your identity is never revealed — not to other users, not even to moderators",
                    ],
                  },
                  {
                    emoji: "📅",
                    title: "Events",
                    tips: [
                      "Find local playgroups, meetups, and parent events near you",
                      "RSVP and add events to your calendar with one tap",
                      "Create your own event and invite the village",
                    ],
                  },
                  {
                    emoji: "👥",
                    title: "Friends & Private Chat",
                    tips: [
                      "Send a friend request from anyone's profile",
                      "Once connected, open a private chat from Chat Circles → Friends",
                      "The chat popout lets you message friends from anywhere in the app",
                    ],
                  },
                ].map(({ emoji, title, tips }) => (
                  <div key={title} className="bg-card rounded-2xl border border-border/50 p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xl">{emoji}</span>
                      <h3 className="font-heading font-semibold text-foreground">{title}</h3>
                    </div>
                    <ul className="space-y-1">
                      {tips.map((tip, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                          <span className="text-primary mt-0.5 flex-shrink-0">•</span>
                          {tip}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>

              <Button
                onClick={() => { window.location.href = "/dashboard"; }}
                size="lg"
                className="w-full rounded-full bg-primary text-primary-foreground shadow-[0_0_20px_rgba(245,197,66,0.3)]"
                disabled={saving}
              >
                {saving ? "Saving your profile..." : "Take me to my village 🏡"}
              </Button>
            </div>
          )}

        </div>
      </div>

      {/* Footer nav */}
      <div className="fixed bottom-0 left-0 right-0 bg-background/90 backdrop-blur-sm border-t border-border/30 px-4 py-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between gap-3">
          {step > 1 && step < 6 ? (
            <Button variant="ghost" onClick={handleBack} className="rounded-full">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
          ) : (
            <div />
          )}

          {step < 6 && (
            <div className="flex items-center gap-2 ml-auto">
              {(step === 3 || step === 4 || step === 5) && (
                <Button variant="ghost" onClick={handleNext} className="rounded-full text-muted-foreground">
                  Skip for now
                </Button>
              )}
              <Button
                onClick={handleNext}
                disabled={!canProceed() || saving}
                className="rounded-full bg-primary text-primary-foreground px-6"
              >
                {saving ? "Saving..." : step === 5 ? "Finish setup" : "Continue"}
                {!saving && <ArrowRight className="h-4 w-4 ml-1" />}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
