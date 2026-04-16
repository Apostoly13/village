import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { toast } from "sonner";
import { ChevronRight, Crown, Check } from "lucide-react";

const API_URL = process.env.REACT_APP_BACKEND_URL;

const AUSTRALIAN_STATES = ["NSW", "VIC", "QLD", "WA", "SA", "TAS", "ACT", "NT"];

const PARENTING_STAGES = [
  { id: "expecting", emoji: "🤰", label: "Expecting" },
  { id: "baby",      emoji: "👶", label: "Baby (0–1)" },
  { id: "toddler",   emoji: "🧒", label: "Toddler (2–4)" },
  { id: "school_age",emoji: "👦", label: "School age (5–12)" },
  { id: "teenager",  emoji: "🧑", label: "Teenager (13+)" },
  { id: "twins",     emoji: "👶👶", label: "Twins or more" },
  { id: "mixed",     emoji: "👪", label: "Mixed ages" },
];

const DISTANCE_OPTIONS = [
  { id: "2km",  label: "Super Local", sub: "Within 2 km" },
  { id: "5km",  label: "Local",       sub: "Within 5 km" },
  { id: "10km", label: "Nearby",      sub: "Within 10 km" },
  { id: "25km", label: "Wider area",  sub: "Within 25 km" },
  { id: "50km", label: "Regional",    sub: "Within 50 km" },
  { id: "all",  label: "All Australia", sub: "No distance limit" },
];

const INTEREST_OPTIONS = [
  "Sleep & Settling",
  "Feeding",
  "Toddler Activities",
  "School Age",
  "Mental Health",
  "Dad Talk",
  "Mum Talk",
  "Local Events",
  "Recipes & Nutrition",
  "Development Milestones",
  "Raising Multiples",
];

const TOTAL_STEPS = 7;

export default function OnboardingPage({ user }) {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Step 1
  const [displayName, setDisplayName] = useState("");
  const [gender, setGender] = useState("");
  const [nicknameAvailable, setNicknameAvailable] = useState(null); // null=unchecked, true=available, false=taken
  const [checkingNickname, setCheckingNickname] = useState(false);

  // Step 2
  const [parentingStage, setParentingStage] = useState("");
  const [mixedAgeGroups, setMixedAgeGroups] = useState([]);

  // Step 3
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [state, setState] = useState("");
  const [showLocationOnProfile, setShowLocationOnProfile] = useState(false);

  // Step 4
  const [preferredReach, setPreferredReach] = useState("25km");

  // Step 5
  const [interests, setInterests] = useState([]);

  const toggleInterest = (i) =>
    setInterests(prev => prev.includes(i) ? prev.filter(x => x !== i) : [...prev, i]);

  const toggleMixedAge = (id) =>
    setMixedAgeGroups(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  // Nickname availability check
  useEffect(() => {
    const trimmed = displayName.trim();
    if (trimmed.length < 2) { setNicknameAvailable(null); return; }
    setCheckingNickname(true);
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(
          `${API_URL}/api/users/check-nickname?name=${encodeURIComponent(trimmed)}`,
          { credentials: "include" }
        );
        if (res.ok) {
          const data = await res.json();
          setNicknameAvailable(data.available);
        }
      } catch {}
      finally { setCheckingNickname(false); }
    }, 400);
    return () => { clearTimeout(timer); setCheckingNickname(false); };
  }, [displayName]);

  // Location search debounce
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (searchQuery.length < 2) { setSearchResults([]); return; }
      setSearching(true);
      try {
        const stateParam = state ? `&state=${state}` : "";
        const res = await fetch(
          `${API_URL}/api/location/search?q=${encodeURIComponent(searchQuery)}${stateParam}`,
          { credentials: "include" }
        );
        if (res.ok) setSearchResults((await res.json()).results || []);
      } catch {}
      finally { setSearching(false); }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, state]);

  const selectLocation = (loc) => {
    setSelectedLocation(loc);
    setSearchQuery(loc.suburb || loc.display_name.split(",")[0]);
    setSearchResults([]);
    if (loc.state) {
      const map = {
        "New South Wales": "NSW", "Victoria": "VIC", "Queensland": "QLD",
        "Western Australia": "WA", "South Australia": "SA", "Tasmania": "TAS",
        "Australian Capital Territory": "ACT", "Northern Territory": "NT",
      };
      setState(map[loc.state] || loc.state);
    }
  };

  const handleComplete = async (finalize = true) => {
    setLoading(true);
    try {
      const updateData = {
        preferred_reach: preferredReach,
        onboarding_complete: true,
        show_location_on_profile: showLocationOnProfile,
      };
      if (displayName.trim()) updateData.nickname = displayName.trim();
      if (gender) updateData.gender = gender;
      if (parentingStage) updateData.parenting_stage = parentingStage;
      if (parentingStage === "mixed" && mixedAgeGroups.length > 0) updateData.mixed_age_groups = mixedAgeGroups;
      if (interests.length > 0) updateData.interests = interests;
      if (state) updateData.state = state;
      if (selectedLocation) {
        updateData.suburb   = selectedLocation.suburb || searchQuery;
        updateData.postcode = selectedLocation.postcode;
        updateData.latitude = selectedLocation.lat;
        updateData.longitude= selectedLocation.lon;
        updateData.location = selectedLocation.suburb || searchQuery;
      }

      const res = await fetch(`${API_URL}/api/users/profile`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(updateData),
      });

      if (res.ok) {
        if (finalize) {
          // Use the server's confirmed response (has onboarding_complete: true)
          // then do a hard redirect so ProtectedRoute reads fresh localStorage
          // with no race against background /auth/me calls
          const updatedUser = await res.json();
          updatedUser.onboarding_complete = true; // defensive — server should already have it
          localStorage.setItem("user", JSON.stringify(updatedUser));
          window.location.replace("/dashboard");
        } else {
          setStep(6);
        }
      } else {
        toast.error("Failed to save. Please try again.");
      }
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const canAdvance =
    step === 1 ? (!!gender && displayName.trim().length >= 2 && nicknameAvailable === true) :
    step === 2 ? !!parentingStage :
    step === 3 ? true :
    step === 5 ? interests.length >= 1 :
    true;

  const firstName = user?.nickname || user?.name?.split(" ")[0] || "there";

  const STEP_TITLES = [
    `Welcome, ${firstName} 🌿`,
    "Your parenting journey",
    "Where are you?",
    "How far do you reach?",
    "What matters to you?",
    "Village+ — what you get",
    "You're all set!",
  ];

  const STEP_SUBTITLES = [
    "Choose a display name and tell us who you are — this personalises your experience.",
    "Tell us about your parenting journey — select all that apply.",
    "Your location is not shown on your profile unless you choose to share it.",
    "Your default distance for finding local parents and events.",
    "Pick at least one topic you care about — we'll show you relevant support spaces.",
    "You're on a free trial for 7 days. Here's what it includes and what changes after.",
    "Here's where to find everything in your village.",
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">

      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border/30">
        <div className="flex items-center gap-2">
          <img src="/BG Removed- Main Logo.png" alt="The Village" className="h-8 w-auto" />
        </div>
        <p className="text-xs text-muted-foreground font-medium">
          Step {step} of {TOTAL_STEPS}
        </p>
      </div>

      {/* Progress bar */}
      <div className="flex gap-1 px-6 pt-4">
        {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-all duration-300 ${
              i + 1 <= step ? "bg-primary" : "bg-secondary"
            }`}
          />
        ))}
      </div>

      {/* Main content — scrollable */}
      <div className="flex-1 flex flex-col items-center px-4 py-8 overflow-y-auto">
        <div className="w-full max-w-md">

          {/* Step heading */}
          <div className="mb-6">
            <h1 className="font-heading text-2xl font-bold text-foreground mb-1">
              {STEP_TITLES[step - 1]}
            </h1>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {STEP_SUBTITLES[step - 1]}
            </p>
          </div>

          {/* ── Step 1 — Display name + Gender ── */}
          {step === 1 && (
            <div className="space-y-5">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-foreground">
                  Display name <span className="text-destructive">*</span>
                </Label>
                <div className="relative">
                  <Input
                    value={displayName}
                    onChange={(e) => { setDisplayName(e.target.value); setNicknameAvailable(null); }}
                    placeholder="e.g., Sarah, DadOfTwo, Mama Bear"
                    maxLength={30}
                    className="h-12 rounded-xl bg-secondary/50 border-transparent focus:ring-primary/30 pr-10"
                    autoFocus
                  />
                  {checkingNickname && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    </div>
                  )}
                </div>
                {displayName.trim().length >= 2 && !checkingNickname && nicknameAvailable === true && (
                  <p className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                    <Check className="h-3 w-3" /> "{displayName.trim()}" is available
                  </p>
                )}
                {displayName.trim().length >= 2 && !checkingNickname && nicknameAvailable === false && (
                  <p className="text-xs text-destructive flex items-center gap-1">
                    ✗ That name is already taken — try a different one
                  </p>
                )}
                {(nicknameAvailable === null || checkingNickname || displayName.trim().length < 2) && (
                  <p className="text-xs text-muted-foreground">
                    This is how others in the village will see you. You can change it anytime.
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-foreground">
                  I am a… <span className="text-destructive">*</span>
                </Label>
                <div className="space-y-2.5">
                  {[
                    { id: "female", emoji: "👩", label: "Mum", sub: "I'm a mother or primary carer" },
                    { id: "male",   emoji: "👨", label: "Dad", sub: "I'm a father or primary carer" },
                    { id: "other",  emoji: "👤", label: "Prefer not to say", sub: "Everyone is welcome here" },
                  ].map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => setGender(opt.id)}
                      className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all ${
                        gender === opt.id
                          ? "border-primary bg-primary/10"
                          : "border-border/50 hover:border-primary/40 hover:bg-secondary/50"
                      }`}
                    >
                      <span className="text-3xl shrink-0">{opt.emoji}</span>
                      <div>
                        <p className={`text-sm font-semibold ${gender === opt.id ? "text-primary" : "text-foreground"}`}>
                          {opt.label}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">{opt.sub}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-xl bg-secondary/50 border border-border/30 p-4">
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Selecting <strong className="text-foreground">Mum</strong> or <strong className="text-foreground">Dad</strong> gives you access to gender-specific chat circles and support spaces. You can update this in your profile at any time.
                </p>
              </div>

              {(!gender || displayName.trim().length < 2 || nicknameAvailable === false) && (
                <p className="text-xs text-amber-600 dark:text-amber-400">
                  {!displayName.trim()
                    ? "Enter a display name to continue."
                    : displayName.trim().length < 2
                    ? "Display name must be at least 2 characters."
                    : nicknameAvailable === false
                    ? "Choose a different display name — that one is taken."
                    : "Select who you are to continue."}
                </p>
              )}
            </div>
          )}

          {/* ── Step 2 — Parenting stage ── */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                {PARENTING_STAGES.map((stage) => (
                  <button
                    key={stage.id}
                    onClick={() => setParentingStage(stage.id)}
                    className={`flex items-center gap-3 p-4 rounded-xl border-2 text-left transition-all ${
                      parentingStage === stage.id
                        ? "border-primary bg-primary/10"
                        : "border-border/50 hover:border-primary/40 hover:bg-secondary/50"
                    }`}
                  >
                    <span className="text-2xl shrink-0">{stage.emoji}</span>
                    <span className={`text-sm font-medium leading-tight ${
                      parentingStage === stage.id ? "text-primary" : "text-foreground"
                    }`}>{stage.label}</span>
                  </button>
                ))}
              </div>

              {parentingStage === "mixed" && (
                <div className="pl-4 border-l-2 border-primary/30 space-y-3">
                  <p className="text-xs text-muted-foreground font-medium">
                    Which age groups do you have? <span className="font-normal">(select all that apply)</span>
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: "baby",       label: "Baby (0–1)",        emoji: "👶" },
                      { id: "toddler",    label: "Toddler (2–4)",     emoji: "🧒" },
                      { id: "school_age", label: "School age (5–12)", emoji: "👦" },
                      { id: "teenager",   label: "Teenager (13+)",    emoji: "🧑" },
                      { id: "expecting",  label: "Expecting another", emoji: "🤰" },
                      { id: "twins",      label: "Twins or more",     emoji: "👶👶" },
                    ].map(ag => {
                      const sel = mixedAgeGroups.includes(ag.id);
                      return (
                        <button
                          key={ag.id}
                          onClick={() => toggleMixedAge(ag.id)}
                          className={`flex items-center gap-2.5 p-3 rounded-xl border text-left transition-all ${
                            sel
                              ? "border-primary bg-primary/10 text-primary"
                              : "border-border/40 hover:border-primary/40 hover:bg-secondary/50 text-foreground"
                          }`}
                        >
                          <span className="text-lg">{ag.emoji}</span>
                          <span className="text-xs font-medium flex-1 leading-tight">{ag.label}</span>
                          {sel && <Check className="h-3.5 w-3.5 shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Step 3 — Location ── */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="rounded-xl bg-secondary/50 border border-border/30 p-4">
                <p className="text-xs text-muted-foreground leading-relaxed">
                  🔒 Your location is <strong className="text-foreground">never shown publicly</strong>. We use it internally to connect you with nearby parents and local chat rooms. You can choose below whether to display your area on your profile.
                </p>
              </div>

              <div className="space-y-2">
                <Label className="text-sm text-foreground">State</Label>
                <Select value={state} onValueChange={setState}>
                  <SelectTrigger className="h-12 rounded-xl bg-secondary/50 border-transparent focus:ring-primary/30">
                    <SelectValue placeholder="Select your state" />
                  </SelectTrigger>
                  <SelectContent>
                    {AUSTRALIAN_STATES.map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-sm text-foreground">Suburb or postcode</Label>
                <div className="relative">
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="e.g., Bondi, 2026"
                    className="h-12 rounded-xl bg-secondary/50 border-transparent focus:ring-primary/30 pr-10"
                  />
                  {searching && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    </div>
                  )}
                </div>
                {searchResults.length > 0 && (
                  <div className="bg-card border border-border/50 rounded-xl overflow-hidden max-h-44 overflow-y-auto">
                    {searchResults.map((r, idx) => (
                      <button
                        key={idx}
                        onClick={() => selectLocation(r)}
                        className="w-full px-4 py-3 text-left hover:bg-secondary/50 transition-colors border-b border-border/30 last:border-0"
                      >
                        <p className="text-sm font-medium text-foreground">{r.suburb || r.display_name.split(",")[0]}</p>
                        <p className="text-xs text-muted-foreground truncate">{r.display_name}</p>
                      </button>
                    ))}
                  </div>
                )}
                {selectedLocation && (
                  <p className="text-xs text-green-600 dark:text-green-400">
                    ✓ {selectedLocation.suburb || searchQuery}{selectedLocation.postcode ? `, ${selectedLocation.postcode}` : ""}
                  </p>
                )}
              </div>

              {/* Show area on profile toggle */}
              <button
                onClick={() => setShowLocationOnProfile(p => !p)}
                className={`w-full flex items-center justify-between p-4 rounded-xl border-2 text-left transition-all ${
                  showLocationOnProfile
                    ? "border-primary/40 bg-primary/8"
                    : "border-border/40 bg-secondary/30"
                }`}
              >
                <div>
                  <p className="text-sm font-medium text-foreground">Show my area on my profile</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {showLocationOnProfile
                      ? "Your suburb/area will be visible on your profile"
                      : "Hidden — only used internally to show you local content"}
                  </p>
                </div>
                <div className={`w-11 h-6 rounded-full flex items-center shrink-0 ml-4 px-0.5 transition-all ${
                  showLocationOnProfile ? "bg-primary justify-end" : "bg-muted justify-start"
                }`}>
                  <div className="w-5 h-5 rounded-full bg-white shadow-sm" />
                </div>
              </button>
              <p className="text-xs text-muted-foreground px-1">You can change this anytime in your profile settings.</p>
            </div>
          )}

          {/* ── Step 4 — Distance ── */}
          {step === 4 && (
            <div className="grid grid-cols-2 gap-3">
              {DISTANCE_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => setPreferredReach(opt.id)}
                  className={`p-4 rounded-xl border-2 text-left transition-all ${
                    preferredReach === opt.id
                      ? "border-primary bg-primary/10"
                      : "border-border/50 hover:border-primary/40 hover:bg-secondary/50"
                  }`}
                >
                  <p className={`text-sm font-semibold ${preferredReach === opt.id ? "text-primary" : "text-foreground"}`}>
                    {opt.label}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">{opt.sub}</p>
                </button>
              ))}
            </div>
          )}

          {/* ── Step 5 — Interests ── */}
          {step === 5 && (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {INTEREST_OPTIONS.map((interest) => {
                  const sel = interests.includes(interest);
                  return (
                    <button
                      key={interest}
                      onClick={() => toggleInterest(interest)}
                      className={`px-4 py-2 rounded-full text-sm font-medium border transition-all ${
                        sel
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-secondary/50 text-foreground border-border/50 hover:border-primary/40 hover:bg-secondary"
                      }`}
                    >
                      {interest}
                    </button>
                  );
                })}
              </div>
              {interests.length === 0 ? (
                <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">
                  Select at least one interest to continue.
                </p>
              ) : (
                <p className="text-xs text-green-600 dark:text-green-400">
                  ✓ {interests.length} selected — you can add more anytime.
                </p>
              )}
            </div>
          )}

          {/* ── Step 6 — Village+ / Trial vs Free ── */}
          {step === 6 && (
            <div className="space-y-4">
              {/* Always free */}
              <div className="rounded-xl border border-green-500/30 bg-green-500/8 p-4">
                <p className="text-sm text-green-700 dark:text-green-400 font-medium">
                  🎭 Anonymous posting is <strong>free for everyone, always</strong> — post without your name or avatar whenever you need to.
                </p>
              </div>

              {/* 7-day trial */}
              <div className="rounded-xl border border-amber-500/40 bg-amber-500/8 p-4">
                <p className="text-sm font-semibold text-amber-600 dark:text-amber-400 mb-3">
                  Your first 7 days — limited access trial *
                </p>
                <div className="space-y-2">
                  {[
                    "Unlimited posts every week",
                    "Reply as much as you like",
                    "View Events in your area",
                    "Receive and send unlimited direct messages to other villagers",
                  ].map(item => (
                    <p key={item} className="text-sm text-foreground flex items-center gap-2.5">
                      <Check className="h-4 w-4 text-amber-500 shrink-0" />{item}
                    </p>
                  ))}
                  <p className="text-xs text-muted-foreground italic mt-1">
                    * Event creation is locked to Village+ only
                  </p>
                </div>
              </div>

              {/* Free tier */}
              <div className="rounded-xl border border-border/40 bg-secondary/30 p-4">
                <p className="text-sm font-semibold text-muted-foreground mb-3">After 7 days — free tier</p>
                <div className="space-y-2">
                  {[
                    "5 support space posts per week",
                    "5 support space replies per week",
                    "10 chat circle messages per day",
                    "No access to Events",
                    "No access to Community Spaces",
                    "No access to Direct Messaging",
                  ].map(item => (
                    <p key={item} className="text-sm text-muted-foreground flex items-center gap-2.5">
                      <span className="w-1 h-1 rounded-full bg-muted-foreground shrink-0 mt-0.5" />{item}
                    </p>
                  ))}
                </div>
              </div>

              {/* Village+ paid */}
              <div className="rounded-xl border border-primary/30 bg-primary/5 p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Crown className="h-4 w-4 text-primary" />
                    <p className="text-sm font-semibold text-primary">Village+</p>
                  </div>
                  <p className="text-sm font-bold text-primary">$9.99<span className="text-xs font-normal text-muted-foreground">/month</span></p>
                </div>
                <p className="text-xs text-muted-foreground mb-3 leading-relaxed">
                  Keep full access after your trial and directly support the community — an independent, family-run platform with no ads.
                </p>
                <div className="space-y-2">
                  {[
                    "Unlimited posts, replies & messages across the village",
                    "Create, manage & join community spaces",
                    "Create, manage & join local events",
                    "Priority support & early access to new features",
                    "Coming Soon — Family Market Place to donate, swap or trade",
                  ].map(item => (
                    <p key={item} className="text-sm text-foreground flex items-center gap-2.5">
                      <Crown className="h-3.5 w-3.5 text-primary shrink-0" />{item}
                    </p>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── Step 7 — Platform tour ── */}
          {step === 7 && (
            <div className="space-y-2.5">
              <p className="text-sm text-muted-foreground mb-4">Here's where everything lives — you'll get the hang of it quickly.</p>
              {[
                { icon: "🏠", label: "Home",           desc: "Your activity feed — local posts, active circles, and events near you" },
                { icon: <img src="/BG Removed- Main Logo.png" className="h-7 w-auto" alt="Village" />, label: "Support Spaces", desc: "Topic-based forums — Baby Sleep, Feeding, Mental Health, Dad Circle, and more" },
                { icon: "💬", label: "Chat Circles",   desc: "Live chat rooms — national circles, your suburb room, Mum Chat, Dad Chat" },
                { icon: "📅", label: "Events",         desc: "Local meetups, online events, and playdates — RSVP and add to calendar" },
                { icon: "👥", label: "Friends",        desc: "Connect with parents you meet here — private messages and chat" },
                { icon: "🔖", label: "Saved",          desc: "Bookmark posts, events, and chat messages to find them later" },
              ].map(({ icon, label, desc }) => (
                <div key={label} className="flex items-start gap-4 p-4 rounded-xl border border-border/30 hover:bg-secondary/30 transition-colors">
                  <span className="text-2xl shrink-0 mt-0.5 flex items-center">{icon}</span>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{label}</p>
                    <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Footer navigation */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-border/30">
            {step > 1 ? (
              <Button
                variant="outline"
                onClick={() => setStep(step - 1)}
                className="rounded-full"
              >
                Back
              </Button>
            ) : (
              <div />
            )}

            {step < TOTAL_STEPS ? (
              <Button
                onClick={() => {
                  if (step === 5) { handleComplete(false); }
                  else { setStep(step + 1); }
                }}
                disabled={!canAdvance || loading}
                className="rounded-full bg-primary text-primary-foreground min-w-[120px]"
              >
                {loading ? "Saving…" : step === 5 ? "Save & continue" : "Continue"}
                {!loading && step !== 5 && <ChevronRight className="h-4 w-4 ml-1" />}
              </Button>
            ) : (
              <Button
                onClick={() => handleComplete(true)}
                disabled={loading}
                className="rounded-full bg-primary text-primary-foreground px-8 min-w-[160px]"
              >
                {loading ? "Setting up…" : "Start exploring 🌿"}
              </Button>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
