import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { toast } from "sonner";
import { ArrowRight, ArrowLeft, MapPin, Check, EyeOff } from "lucide-react";
import LocationButton from "../components/LocationButton";

const API_URL = process.env.REACT_APP_BACKEND_URL;

const PARENTING_STAGES = [
  { id: "expecting",  label: "Expecting",     emoji: "🤰",        desc: "Baby on the way" },
  { id: "newborn",    label: "Newborn",        emoji: "👶",        desc: "0 – 3 months" },
  { id: "infant",     label: "Infant",         emoji: "🧒",        desc: "3 – 12 months" },
  { id: "toddler",    label: "Toddler",        emoji: "🚶",        desc: "1 – 4 years" },
  { id: "school_age", label: "School Age",     emoji: "🎒",        desc: "5 – 12 years" },
  { id: "teenager",   label: "Teenager",       emoji: "🧑",        desc: "13+ years" },
  { id: "multiples",  label: "Twins/Triplets", emoji: "👶👶",     desc: "Two or more!" },
  { id: "mixed",      label: "Mixed ages",     emoji: "👨‍👩‍👧‍👦", desc: "Multiple kids" },
];

const AUSTRALIAN_STATES = ["NSW", "VIC", "QLD", "WA", "SA", "TAS", "ACT", "NT"];

const GENDER_OPTIONS = [
  { id: "female",         label: "Mum",              emoji: "👩" },
  { id: "male",           label: "Dad",              emoji: "👨" },
  { id: "prefer_not_say", label: "Prefer not to say", emoji: "🤐" },
];

// Auto-assign interests from parenting stage — drives personalisation without an extra step
const AUTO_INTERESTS = {
  expecting:  ["Feeding", "Mental Health"],
  newborn:    ["Sleep & Settling", "Feeding", "Mental Health"],
  infant:     ["Sleep & Settling", "Feeding", "Development Milestones"],
  toddler:    ["Toddler Activities", "Development Milestones"],
  school_age: ["School Age", "Development Milestones"],
  teenager:   ["School Age", "Mental Health"],
  multiples:  ["Raising Multiples", "Sleep & Settling", "Feeding"],
  mixed:      ["Toddler Activities", "School Age"],
};

const TOTAL_STEPS = 5;

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
  const [saving, setSaving] = useState(false);

  const [step, setStep] = useState(() => {
    if (user?.onboarding_complete) return 5;
    return 1;
  });

  // ── Step 2 — About You ────────────────────────────────────────────────────────
  const [nickname, setNickname] = useState(user?.nickname || user?.name || "");
  const [parentingStage, setParentingStage] = useState(user?.parenting_stage || "");
  const [mixedAgeGroups, setMixedAgeGroups] = useState(user?.mixed_age_groups || []);
  const [isSingleParent, setIsSingleParent] = useState(user?.is_single_parent || false);
  const [isMultipleBirth, setIsMultipleBirth] = useState(user?.is_multiple_birth || false);
  const [gender, setGender] = useState(user?.gender || "");

  const toggleMixedAgeGroup = (id) =>
    setMixedAgeGroups(prev => prev.includes(id) ? prev.filter(g => g !== id) : [...prev, id]);

  // ── Step 3 — Location ─────────────────────────────────────────────────────────
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

  // ── Step 4 — Immediate need ───────────────────────────────────────────────────
  const [immediateNeed, setImmediateNeed] = useState(null); // "vent" | "question" | "browse"

  const searchLocation = useCallback(async (q) => {
    setLocationSearch(q);
    if (q.length < 2) { setLocationResults([]); return; }
    setSearchingLocation(true);
    try {
      const res = await fetch(`${API_URL}/api/location/search?q=${encodeURIComponent(q)}`, { credentials: "include" });
      if (res.ok) setLocationResults((await res.json()).results || []);
    } catch {}
    finally { setSearchingLocation(false); }
  }, []);

  const selectLocation = (loc) => {
    const suburbName = loc.suburb || loc.name || "";
    setSuburb(suburbName);
    setPostcode(loc.postcode || "");
    setSelectedState(loc.state || "");
    setLatitude(loc.lat || loc.latitude || null);
    setLongitude(loc.lon || loc.longitude || null);
    setLocationSearch(`${suburbName}${loc.postcode ? ", " + loc.postcode : ""}`);
    setLocationResults([]);
  };

  const saveAndFinish = async () => {
    setSaving(true);
    const profileData = {
      nickname: nickname.trim() || user?.name,
      parenting_stage: parentingStage,
      gender: gender || undefined,
      is_single_parent: isSingleParent,
      is_multiple_birth: parentingStage === "multiples" || (parentingStage === "mixed" && isMultipleBirth),
      suburb,
      postcode,
      state: selectedState,
      location: suburb,
      latitude,
      longitude,
      interests: AUTO_INTERESTS[parentingStage] || [],
      mixed_age_groups: parentingStage === "mixed" ? mixedAgeGroups : [],
      onboarding_complete: true,
    };
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
    if (step === 4) {
      await saveAndFinish();
      setStep(5);
    } else {
      setStep(s => s + 1);
    }
  };

  const handleBack = () => setStep(s => s - 1);

  const canProceed = () => {
    if (step === 2) return nickname.trim().length > 0 && parentingStage !== "";
    if (step === 4) return immediateNeed !== null;
    return true;
  };

  // Where to send her at the end based on her stated need
  const getDestination = () => {
    if (immediateNeed === "vent")     return "/chat";
    if (immediateNeed === "question") return "/forums";
    return "/dashboard";
  };

  const getDestinationLabel = () => {
    if (immediateNeed === "vent")     return "Take me to Group Chats";
    if (immediateNeed === "question") return "Take me to Spaces";
    return "Take me to my village";
  };

  const isTrial   = user?.subscription_tier === "trial";
  const isFree    = user?.subscription_tier === "free";
  const isPremium = user?.subscription_tier === "premium";

  return (
    <div className="min-h-screen bg-background">

      {/* ── Header / progress ─────────────────────────────────────────────────── */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-sm border-b border-border/30 px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center gap-4">
          <img src="/BG Removed- Main Logo.png" alt="The Village" className="h-16 w-auto shrink-0" />
          <div className="flex-1"><ProgressBar step={step} /></div>
          <span className="text-xs text-muted-foreground shrink-0">{step}/{TOTAL_STEPS}</span>
        </div>
      </div>

      {/* ── Content ───────────────────────────────────────────────────────────── */}
      <div className="pt-20 pb-28 px-4">
        <div className="max-w-2xl mx-auto">

          {/* ── Step 1: Welcome ───────────────────────────────────────────────── */}
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

              <div className="flex items-center gap-3 bg-primary/10 border border-primary/20 rounded-2xl p-4 mb-8 max-w-md mx-auto text-left">
                <EyeOff className="h-5 w-5 text-primary shrink-0" />
                <div>
                  <p className="text-sm font-medium text-foreground">You control your privacy</p>
                  <p className="text-xs text-muted-foreground">Post or chat anonymously any time — no name, no avatar shown.</p>
                </div>
              </div>

              <div className="grid sm:grid-cols-3 gap-4 mb-10 text-left max-w-xl mx-auto">
                {[
                  { emoji: "💬", title: "Spaces",      desc: "Topic-based discussions — sleep, feeding, mental health, and more." },
                  { emoji: "🗣️", title: "Group Chats", desc: "Real-time chat for your suburb, your stage, and Australia-wide." },
                  { emoji: "📅", title: "Events",       desc: "Find local meetups, playgroups, and parent events near you." },
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

          {/* ── Step 2: About You ─────────────────────────────────────────────── */}
          {step === 2 && (
            <div className="animate-fade-in max-w-lg mx-auto w-full">
              <h2 className="font-heading text-2xl font-bold text-foreground mb-1">About you</h2>
              <p className="text-muted-foreground mb-6">A nickname is fine — many parents prefer it for privacy.</p>

              <div className="space-y-5">

                {/* Display name */}
                <div className="space-y-1.5">
                  <Label className="text-foreground font-medium">Display name</Label>
                  <Input
                    value={nickname}
                    onChange={e => setNickname(e.target.value)}
                    placeholder="What should we call you?"
                    className="h-12 rounded-xl bg-secondary/50 border-transparent focus:border-primary"
                  />
                </div>

                {/* Parenting stage */}
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

                {/* Mixed / multiples sub-picker */}
                {(parentingStage === "mixed" || parentingStage === "multiples") && (
                  <div className="space-y-2 pl-1 border-l-2 border-primary/30 ml-1">
                    <Label className="text-foreground font-medium text-sm">
                      {parentingStage === "multiples" ? "How old are your multiples?" : "Which age groups?"}
                      <span className="text-muted-foreground font-normal"> (select all that apply)</span>
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

                {/* Gender — optional, folded into this step */}
                <div className="space-y-2 pt-1">
                  <Label className="text-foreground font-medium text-sm">
                    I am a… <span className="text-muted-foreground font-normal">(optional)</span>
                  </Label>
                  <div className="grid grid-cols-3 gap-2">
                    {GENDER_OPTIONS.map(opt => (
                      <button
                        key={opt.id}
                        onClick={() => setGender(gender === opt.id ? "" : opt.id)}
                        className={`rounded-xl p-3 text-center border-2 flex flex-col items-center gap-1 transition-all ${
                          gender === opt.id ? "border-primary bg-primary/10" : "border-border/50 bg-card hover:border-primary/40"
                        }`}
                      >
                        <span className="text-xl">{opt.emoji}</span>
                        <span className={`text-xs font-medium ${gender === opt.id ? "text-primary" : "text-foreground"}`}>{opt.label}</span>
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">Helps us personalise your spaces — you can skip or change this any time.</p>
                </div>

                {/* Single parent */}
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

          {/* ── Step 3: Location ──────────────────────────────────────────────── */}
          {step === 3 && (
            <div className="animate-fade-in max-w-lg mx-auto w-full">
              <h2 className="font-heading text-2xl font-bold text-foreground mb-1">Where are you based?</h2>
              <p className="text-muted-foreground mb-2">Find parents near you and see local group chats and events.</p>
              <div className="flex items-center gap-2 mb-6 text-xs text-muted-foreground bg-secondary/50 rounded-xl px-3 py-2">
                <MapPin className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                Your location is never shown publicly — only used to surface local chats and nearby events.
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5 relative">
                  <div className="flex items-center justify-between">
                    <Label className="text-foreground font-medium">Suburb or postcode</Label>
                    <LocationButton
                      onLocation={({ suburb, postcode, state, latitude, longitude }) => {
                        setSuburb(suburb);
                        setPostcode(postcode);
                        setSelectedState(state);
                        setLatitude(latitude);
                        setLongitude(longitude);
                        setLocationSearch(`${suburb}${postcode ? ", " + postcode : ""}`);
                        setLocationResults([]);
                      }}
                    />
                  </div>
                  <Input
                    value={locationSearch}
                    onChange={e => searchLocation(e.target.value)}
                    placeholder="e.g. Bondi, 2026, Fitzroy..."
                    className="h-12 rounded-xl bg-secondary/50 border-transparent focus:border-primary"
                    autoComplete="off"
                  />
                  {searchingLocation && <p className="text-xs text-muted-foreground px-1 mt-1">Searching...</p>}
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
                      <Check className="h-3 w-3" />
                      {suburb}{postcode ? `, ${postcode}` : ""}{selectedState ? ` · ${selectedState}` : ""}
                    </p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label className="text-foreground font-medium">
                    State <span className="text-muted-foreground font-normal">(or select manually)</span>
                  </Label>
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

          {/* ── Step 4: What brings you here? ─────────────────────────────────── */}
          {step === 4 && (
            <div className="animate-fade-in max-w-lg mx-auto w-full">
              <h2 className="font-heading text-2xl font-bold text-foreground mb-2">What brings you here today?</h2>
              <p className="text-muted-foreground mb-8">We'll take you straight there when you're done.</p>

              <div className="space-y-3">
                {[
                  {
                    id: "vent",
                    emoji: "💬",
                    title: "I need to talk or vent",
                    desc: "Find a real-time group chat or support space with other parents right now.",
                  },
                  {
                    id: "question",
                    emoji: "🙋",
                    title: "I have a question",
                    desc: "Post to a topic-based space and get answers from parents who've been there.",
                  },
                  {
                    id: "browse",
                    emoji: "👀",
                    title: "I'm just exploring",
                    desc: "Have a look around and see what The Village has for you.",
                  },
                ].map(({ id, emoji, title, desc }) => (
                  <button
                    key={id}
                    onClick={() => setImmediateNeed(id)}
                    className={`w-full rounded-2xl p-5 text-left border-2 flex items-start gap-4 transition-all ${
                      immediateNeed === id
                        ? "border-primary bg-primary/10"
                        : "border-border/50 bg-card hover:border-primary/40"
                    }`}
                  >
                    <span className="text-3xl shrink-0">{emoji}</span>
                    <div className="flex-1">
                      <p className={`font-semibold text-base mb-1 ${immediateNeed === id ? "text-primary" : "text-foreground"}`}>
                        {title}
                      </p>
                      <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
                    </div>
                    {immediateNeed === id && <Check className="h-5 w-5 text-primary shrink-0 mt-1" />}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── Step 5: You're in! — explainer + destination ──────────────────── */}
          {step === 5 && (
            <div className="animate-fade-in text-center max-w-lg mx-auto w-full">
              <div className="text-5xl mb-4">🏡</div>
              <h2 className="font-heading text-2xl font-bold text-foreground mb-2">You're all set!</h2>
              <p className="text-muted-foreground mb-8">Welcome to The Village. Here's what you have access to.</p>

              {/* Free / Trial / Premium explainer — no upsell language, just plain info */}
              <div className="bg-card rounded-2xl border border-border/50 p-5 mb-6 text-left">
                {isTrial && (
                  <>
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-lg">🎉</span>
                      <p className="font-semibold text-foreground">Your 7-day Village+ trial is active</p>
                    </div>
                    <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                      You have full access to everything during your trial — Events, Private Messaging, and Communities included.
                      After 7 days you'll move to the free plan automatically. No charge unless you choose to upgrade.
                    </p>
                    <div className="space-y-2">
                      {[
                        "Spaces — topic-based discussions",
                        "Group Chats — real-time local and national",
                        "Events — find and RSVP to local meetups",
                        "Private Messaging — 1:1 with other parents",
                        "Communities — member-led groups",
                      ].map(item => (
                        <div key={item} className="flex items-center gap-2 text-sm text-foreground">
                          <Check className="h-4 w-4 text-green-500 shrink-0" />
                          {item}
                        </div>
                      ))}
                    </div>
                  </>
                )}

                {isFree && (
                  <>
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-lg">✅</span>
                      <p className="font-semibold text-foreground">Free plan — always included</p>
                    </div>
                    <div className="space-y-2 mb-4">
                      {[
                        "Spaces — topic-based discussions",
                        "Group Chats — real-time local and national",
                        "Post, reply, and react — no weekly cap on chats",
                      ].map(item => (
                        <div key={item} className="flex items-center gap-2 text-sm text-foreground">
                          <Check className="h-4 w-4 text-green-500 shrink-0" />
                          {item}
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground border-t border-border/30 pt-3">
                      Events, Private Messaging, and Communities are available with{" "}
                      <span className="text-primary font-medium">Village+</span>. You can explore and upgrade any time.
                    </p>
                  </>
                )}

                {isPremium && (
                  <>
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-lg">⭐</span>
                      <p className="font-semibold text-foreground">Village+ — full access</p>
                    </div>
                    <div className="space-y-2">
                      {[
                        "Spaces, Group Chats, Events",
                        "Private Messaging",
                        "Communities",
                        "Everything we add in the future",
                      ].map(item => (
                        <div key={item} className="flex items-center gap-2 text-sm text-foreground">
                          <Check className="h-4 w-4 text-green-500 shrink-0" />
                          {item}
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>

              {/* Destination CTA */}
              <Button
                onClick={() => { window.location.href = getDestination(); }}
                size="lg"
                className="w-full rounded-full bg-primary text-primary-foreground shadow-[0_0_20px_rgba(245,197,66,0.3)] mb-3"
                disabled={saving}
              >
                {saving ? "Setting up your village…" : getDestinationLabel()}
                {!saving && <ArrowRight className="h-5 w-5 ml-2" />}
              </Button>

              {immediateNeed !== "browse" && (
                <button
                  onClick={() => { window.location.href = "/dashboard"; }}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Explore the full village first →
                </button>
              )}
            </div>
          )}

        </div>
      </div>

      {/* ── Fixed footer nav ──────────────────────────────────────────────────── */}
      <div className="fixed bottom-0 left-0 right-0 bg-background/90 backdrop-blur-sm border-t border-border/30 px-4 py-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between gap-3">

          {/* Back — steps 2-4 only */}
          {step > 1 && step < 5 ? (
            <Button variant="ghost" onClick={handleBack} className="rounded-full">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
          ) : <div />}

          {/* Forward — steps 2-4 only (step 1 + step 5 have in-page CTAs) */}
          {step >= 2 && step < 5 && (
            <div className="flex items-center gap-2 ml-auto">
              {/* Location can be skipped; the needs step cannot */}
              {step === 3 && (
                <Button variant="ghost" onClick={handleNext} className="rounded-full text-muted-foreground">
                  Skip for now
                </Button>
              )}
              <Button
                onClick={handleNext}
                disabled={!canProceed() || saving}
                className="rounded-full bg-primary text-primary-foreground px-6"
              >
                {saving ? "Saving…" : step === 4 ? "Almost there" : "Continue"}
                {!saving && <ArrowRight className="h-4 w-4 ml-1" />}
              </Button>
            </div>
          )}

        </div>
      </div>

    </div>
  );
}
