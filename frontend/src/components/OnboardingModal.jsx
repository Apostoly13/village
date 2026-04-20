import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { toast } from "sonner";
import { ChevronRight, Crown, Check } from "lucide-react";

const API_URL = process.env.REACT_APP_BACKEND_URL;

const AUSTRALIAN_STATES = ["NSW", "VIC", "QLD", "WA", "SA", "TAS", "ACT", "NT"];

const PARENTING_STAGES = [
  { id: "expecting", emoji: "🤰", label: "Expecting" },
  { id: "baby", emoji: "👶", label: "Baby (0–1)" },
  { id: "toddler", emoji: "🧒", label: "Toddler (2–4)" },
  { id: "school_age", emoji: "👦", label: "School age (5–12)" },
  { id: "teenager", emoji: "🧑", label: "Teenager (13+)" },
  { id: "mixed", emoji: "👪", label: "Mixed ages" },
];

const DISTANCE_OPTIONS = [
  { id: "2km", label: "Super Local", sub: "2km" },
  { id: "5km", label: "Local", sub: "5km" },
  { id: "10km", label: "Nearby", sub: "10km" },
  { id: "25km", label: "Wider area", sub: "25km" },
  { id: "50km", label: "Regional", sub: "50km" },
  { id: "all", label: "All Australia", sub: "no limit" },
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

export default function OnboardingModal({ user, onComplete, onSkip: onSkipProp }) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Step 1 — display name + gender
  const [displayName, setDisplayName] = useState("");
  const [gender, setGender] = useState("");

  // Step 2 — parenting stage + mixed age groups
  const [parentingStage, setParentingStage] = useState("");
  const [mixedAgeGroups, setMixedAgeGroups] = useState([]);

  const toggleMixedAge = (id) => {
    setMixedAgeGroups(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  // Step 3 — location
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [state, setState] = useState("");

  // Step 4 — distance
  const [preferredReach, setPreferredReach] = useState("25km");

  // Step 3 — location visibility (off by default — user must opt in)
  const [showLocationOnProfile, setShowLocationOnProfile] = useState(false);

  // Step 5 — interests
  const [interests, setInterests] = useState([]);

  const TOTAL_STEPS = 7;

  const toggleInterest = (interest) => {
    setInterests(prev =>
      prev.includes(interest)
        ? prev.filter(i => i !== interest)
        : [...prev, interest]
    );
  };

  const onSkip = async () => {
    try {
      await fetch(`${API_URL}/api/users/profile`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ onboarding_complete: true }),
      });
    } catch (e) {}
    onSkipProp();
  };

  const searchLocation = async () => {
    if (searchQuery.length < 2) return;
    setSearching(true);
    try {
      const stateParam = state ? `&state=${state}` : "";
      const response = await fetch(
        `${API_URL}/api/location/search?q=${encodeURIComponent(searchQuery)}${stateParam}`,
        { credentials: "include" }
      );
      if (response.ok) {
        const data = await response.json();
        setSearchResults(data.results || []);
      }
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setSearching(false);
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.length >= 2) {
        searchLocation();
      } else {
        setSearchResults([]);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, state]);

  const selectLocation = (location) => {
    setSelectedLocation(location);
    setSearchQuery(location.suburb || location.display_name.split(",")[0]);
    setSearchResults([]);
    if (location.state) {
      const stateMap = {
        "New South Wales": "NSW",
        Victoria: "VIC",
        Queensland: "QLD",
        "Western Australia": "WA",
        "South Australia": "SA",
        Tasmania: "TAS",
        "Australian Capital Territory": "ACT",
        "Northern Territory": "NT",
      };
      setState(stateMap[location.state] || location.state);
    }
  };

  const handleComplete = async (finalize = true) => {
    setLoading(true);
    try {
      const updateData = {
        preferred_reach: preferredReach,
        onboarding_complete: true,
      };

      if (displayName.trim()) updateData.nickname = displayName.trim();
      if (gender) updateData.gender = gender;
      if (parentingStage) updateData.parenting_stage = parentingStage;
      if (parentingStage === "mixed" && mixedAgeGroups.length > 0) updateData.mixed_age_groups = mixedAgeGroups;
      if (interests.length > 0) updateData.interests = interests;
      if (state) updateData.state = state;

      updateData.show_location_on_profile = showLocationOnProfile;

      if (selectedLocation) {
        updateData.suburb = selectedLocation.suburb || searchQuery;
        updateData.postcode = selectedLocation.postcode;
        updateData.latitude = selectedLocation.lat;
        updateData.longitude = selectedLocation.lon;
        updateData.location = selectedLocation.suburb || searchQuery;
      }

      const response = await fetch(`${API_URL}/api/users/profile`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(updateData),
      });

      if (response.ok) {
        if (finalize) {
          onComplete();
        } else {
          // Profile saved — advance to the Village+ features step
          setStep(6);
        }
      } else {
        toast.error("Failed to save. Please try again.");
      }
    } catch (error) {
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const canAdvance =
    step === 1 ? (!!gender && displayName.trim().length >= 2) :
    step === 2 ? !!parentingStage :
    step === 3 ? true :           // location is optional
    step === 5 ? interests.length >= 1 :
    true;                          // steps 4, 6, 7 always advanceable

  const firstName = user?.nickname || user?.name?.split(" ")[0] || "there";

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-2xl max-w-md w-full shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 pt-6 pb-4">
          <div className="mb-1">
            <p className="text-xs text-muted-foreground font-medium mb-1">Step {step} of {TOTAL_STEPS}</p>
            <h2 className="font-heading text-xl font-bold text-foreground">
              {step === 1 && `Welcome, ${firstName} 🌿`}
              {step === 2 && "Your parenting journey"}
              {step === 3 && "Where are you?"}
              {step === 4 && "How far do you reach?"}
              {step === 5 && "What matters to you?"}
              {step === 6 && "Village+ — what you get ✨"}
              {step === 7 && "You're all set 🌿"}
            </h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              {step === 1 && "Choose a display name and tell us who you are — this personalises your experience."}
              {step === 2 && "Tell us about your parenting journey — select all that apply."}
              {step === 3 && "Your location is not shown on your profile unless you choose to share it."}
              {step === 4 && "Your default distance for finding parents and events."}
              {step === 5 && "Pick at least one topic you care about — we'll show you relevant support spaces."}
              {step === 6 && "You're on a free trial for 7 days. Here's what it includes and what changes after."}
              {step === 7 && "Here's where to find everything in your village."}
            </p>
          </div>

          {/* Step dots */}
          <div className="flex gap-1.5 mt-4">
            {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
              <div
                key={i}
                className={`h-1 flex-1 rounded-full transition-all ${
                  i + 1 <= step ? "bg-primary" : "bg-secondary"
                }`}
              />
            ))}
          </div>
        </div>

        {/* Body */}
        <div className="px-6 pb-2 overflow-y-auto max-h-[65vh]">
          {/* Step 1 — Display name + Gender */}
          {step === 1 && (
            <div className="py-2 space-y-4">
              {/* Display name — required */}
              <div className="space-y-1.5">
                <Label className="text-sm font-medium text-foreground">
                  Display name <span className="text-destructive">*</span>
                </Label>
                <Input
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="e.g., Sarah, DadOfTwo, Mama Bear"
                  maxLength={30}
                  className="h-11 rounded-xl bg-secondary/50 border-transparent focus:ring-primary/30"
                />
                <p className="text-xs text-muted-foreground">
                  This is how others in the village will see you. You can change it anytime.
                </p>
              </div>

              {/* Gender — required */}
              <div className="space-y-1.5">
                <Label className="text-sm font-medium text-foreground">
                  I am a… <span className="text-destructive">*</span>
                </Label>
                <div className="grid grid-cols-1 gap-2.5">
                  {[
                    { id: "female", emoji: "👩", label: "Mum", sub: "I'm a mother or primary carer" },
                    { id: "male",   emoji: "👨", label: "Dad", sub: "I'm a father or primary carer" },
                    { id: "other",  emoji: "👤", label: "Prefer not to say", sub: "Everyone is welcome here" },
                  ].map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => setGender(opt.id)}
                      className={`flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all ${
                        gender === opt.id
                          ? "border-primary bg-primary/10"
                          : "border-border/50 hover:border-primary/40 hover:bg-secondary/50"
                      }`}
                    >
                      <span className="text-3xl shrink-0">{opt.emoji}</span>
                      <div>
                        <p className={`text-sm font-semibold leading-tight ${gender === opt.id ? "text-primary" : "text-foreground"}`}>
                          {opt.label}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">{opt.sub}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Mum/Dad access note */}
              <div className="rounded-xl bg-secondary/50 border border-border/30 p-3">
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Selecting <strong className="text-foreground">Mum</strong> or <strong className="text-foreground">Dad</strong> gives you access to gender-specific chat circles and support spaces. You can update this in your profile at any time — only then will it unlock or remove those areas.
                </p>
              </div>

              {/* Validation hint */}
              {(!gender || displayName.trim().length < 2) && (
                <p className="text-xs text-muted-foreground pt-1">
                  {!displayName.trim() ? "Enter a display name to continue." :
                   displayName.trim().length < 2 ? "Display name must be at least 2 characters." :
                   !gender ? "Select who you are to continue." : ""}
                </p>
              )}
            </div>
          )}

          {/* Step 2 — Parenting stage */}
          {step === 2 && (
            <div className="py-2 space-y-3">
              <div className="grid grid-cols-2 gap-2">
                {PARENTING_STAGES.map((stage) => (
                  <button
                    key={stage.id}
                    onClick={() => setParentingStage(stage.id)}
                    className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl border-2 text-left transition-all ${
                      parentingStage === stage.id
                        ? "border-primary bg-primary/10"
                        : "border-border/50 hover:border-primary/40 hover:bg-secondary/50"
                    }`}
                  >
                    <span className="text-xl shrink-0">{stage.emoji}</span>
                    <span className={`text-xs font-medium leading-tight ${
                      parentingStage === stage.id ? "text-primary" : "text-foreground"
                    }`}>
                      {stage.label}
                    </span>
                  </button>
                ))}
              </div>

              {/* Mixed ages sub-selection */}
              {parentingStage === "mixed" && (
                <div className="pl-3 border-l-2 border-primary/30 space-y-2">
                  <p className="text-xs text-muted-foreground font-medium">Which age groups do you have? <span className="font-normal">(select all)</span></p>
                  <div className="grid grid-cols-2 gap-1.5">
                    {[
                      { id: "baby", label: "Baby (0–1)", emoji: "👶" },
                      { id: "toddler", label: "Toddler (2–4)", emoji: "🧒" },
                      { id: "school_age", label: "School age (5–12)", emoji: "👦" },
                      { id: "teenager", label: "Teenager (13+)", emoji: "🧑" },
                      { id: "expecting", label: "Expecting another", emoji: "🤰" },
                    ].map(ag => {
                      const sel = mixedAgeGroups.includes(ag.id);
                      return (
                        <button
                          key={ag.id}
                          onClick={() => toggleMixedAge(ag.id)}
                          className={`flex items-center gap-2 px-2.5 py-2 rounded-lg border text-left transition-all text-xs ${
                            sel ? "border-primary bg-primary/10 text-primary" : "border-border/40 hover:border-primary/40 hover:bg-secondary/50 text-foreground"
                          }`}
                        >
                          <span>{ag.emoji}</span>
                          <span className="font-medium leading-tight flex-1">{ag.label}</span>
                          {sel && <Check className="h-3 w-3 shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 3 — Location */}
          {step === 3 && (
            <div className="space-y-4 py-2">
              {/* Privacy note */}
              <div className="rounded-xl bg-secondary/50 border border-border/30 p-3">
                <p className="text-xs text-muted-foreground leading-relaxed">
                  🔒 Your location is <strong className="text-foreground">not shown on your profile</strong> unless you choose to share your area below. We use it internally to connect you with nearby parents and local chat rooms — it is never shared publicly.
                </p>
              </div>

              <div className="space-y-1.5">
                <Label className="text-sm text-foreground">State</Label>
                <Select value={state} onValueChange={setState}>
                  <SelectTrigger className="h-11 rounded-xl bg-secondary/50 border-transparent focus:ring-primary/30">
                    <SelectValue placeholder="Select your state" />
                  </SelectTrigger>
                  <SelectContent>
                    {AUSTRALIAN_STATES.map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-sm text-foreground">Suburb or postcode</Label>
                <div className="relative">
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="e.g., Bondi, 2026"
                    className="h-11 rounded-xl bg-secondary/50 border-transparent focus:ring-primary/30 pr-10"
                  />
                  {searching && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    </div>
                  )}
                </div>

                {searchResults.length > 0 && (
                  <div className="bg-card border border-border/50 rounded-xl overflow-hidden max-h-40 overflow-y-auto">
                    {searchResults.map((result, idx) => (
                      <button
                        key={idx}
                        onClick={() => selectLocation(result)}
                        className="w-full px-4 py-2.5 text-left hover:bg-secondary/50 transition-colors border-b border-border/30 last:border-0"
                      >
                        <p className="text-sm font-medium text-foreground">{result.suburb || result.display_name.split(",")[0]}</p>
                        <p className="text-xs text-muted-foreground truncate">{result.display_name}</p>
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
                onClick={() => setShowLocationOnProfile(prev => !prev)}
                className={`w-full flex items-center justify-between p-3 rounded-xl border-2 text-left transition-all ${
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
                      : "Hidden — only used internally to find local content for you"}
                  </p>
                </div>
                <div className={`w-10 h-5.5 rounded-full border-2 flex items-center shrink-0 ml-3 transition-all ${
                  showLocationOnProfile ? "bg-primary border-primary justify-end" : "bg-secondary border-border/50 justify-start"
                }`}>
                  <div className="w-4 h-4 rounded-full bg-white shadow-sm mx-0.5" />
                </div>
              </button>
              <p className="text-xs text-muted-foreground -mt-2 px-1">You can change this later in your profile settings.</p>
            </div>
          )}

          {/* Step 4 — Distance */}
          {step === 4 && (
            <div className="grid grid-cols-2 gap-2.5 py-2">
              {DISTANCE_OPTIONS.map((option) => (
                <button
                  key={option.id}
                  onClick={() => setPreferredReach(option.id)}
                  className={`p-4 rounded-xl border-2 text-left transition-all ${
                    preferredReach === option.id
                      ? "border-primary bg-primary/10"
                      : "border-border/50 hover:border-primary/40 hover:bg-secondary/50"
                  }`}
                >
                  <p className={`text-sm font-medium ${preferredReach === option.id ? "text-primary" : "text-foreground"}`}>
                    {option.label}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">{option.sub}</p>
                </button>
              ))}
            </div>
          )}

          {/* Step 5 — Interests */}
          {step === 5 && (
            <div className="py-2">
              <div className="flex flex-wrap gap-2">
                {INTEREST_OPTIONS.map((interest) => {
                  const selected = interests.includes(interest);
                  return (
                    <button
                      key={interest}
                      onClick={() => toggleInterest(interest)}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${
                        selected
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
                <p className="text-xs text-amber-600 dark:text-amber-400 mt-4 font-medium">
                  Select at least one interest to continue.
                </p>
              ) : (
                <p className="text-xs text-green-600 dark:text-green-400 mt-4">
                  ✓ {interests.length} selected — you can add more any time.
                </p>
              )}
            </div>
          )}

          {/* Step 6 — Trial vs Free comparison */}
          {step === 6 && (
            <div className="py-2 space-y-3">
              {/* Anonymous posting — always free */}
              <div className="rounded-xl border border-green-500/30 bg-green-500/8 p-3">
                <p className="text-xs text-green-700 dark:text-green-400 font-medium">
                  🎭 Anonymous posting is <strong>free for everyone, always</strong> — post without your name or avatar whenever you need to.
                </p>
              </div>

              {/* Trial access */}
              <div className="rounded-xl border border-amber-500/40 bg-amber-500/8 p-3.5">
                <p className="text-xs font-semibold text-amber-600 dark:text-amber-400 mb-2">
                  Your first 7 days — full access trial
                </p>
                <div className="space-y-1.5">
                  {[
                    "Unlimited posts every week",
                    "Pin important posts in spaces",
                    "Reply as much as you like",
                  ].map(item => (
                    <p key={item} className="text-xs text-foreground flex items-center gap-2">
                      <Check className="h-3 w-3 text-amber-500 shrink-0" />{item}
                    </p>
                  ))}
                </div>
              </div>

              {/* Free tier after trial */}
              <div className="rounded-xl border border-border/40 bg-secondary/30 p-3.5">
                <p className="text-xs font-semibold text-muted-foreground mb-2">
                  After 7 days — free tier
                </p>
                <div className="space-y-1.5">
                  {[
                    "5 posts per week",
                    "10 replies per day",
                    "No pin access",
                  ].map(item => (
                    <p key={item} className="text-xs text-muted-foreground">• {item}</p>
                  ))}
                </div>
              </div>

              {/* Village+ paid plan */}
              <div className="rounded-xl border border-primary/30 bg-primary/5 p-3.5">
                <div className="flex items-center gap-2 mb-2">
                  <Crown className="h-4 w-4 text-primary shrink-0" />
                  <p className="text-xs font-semibold text-primary">Village+ — $9.99/month</p>
                </div>
                <p className="text-xs text-muted-foreground mb-2 leading-relaxed">
                  Keep full access after your trial and directly support the community — an independent, family-run platform with no ads.
                </p>
                <div className="space-y-1.5">
                  {[
                    "Unlimited posts, replies, and pins",
                    "Create your own community spaces",
                    "Priority support & early access to new features",
                  ].map(item => (
                    <p key={item} className="text-xs text-foreground flex items-center gap-2">
                      <Check className="h-3 w-3 text-primary shrink-0" />{item}
                    </p>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 7 — Platform map / quick tour */}
          {step === 7 && (
            <div className="py-2 space-y-2">
              <p className="text-xs text-muted-foreground mb-3">Tap any section below to explore when you're ready.</p>
              {[
                {
                  emoji: "🏠",
                  label: "Home",
                  desc: "Your activity feed — local posts, circles active now, and events near you",
                },
                {
                  emoji: "💬",
                  label: "Spaces",
                  desc: "Topic-based discussions — Baby Sleep, Feeding, Mental Health, and more",
                },
                {
                  emoji: "🌿",
                  label: "Group Chats",
                  desc: "Live chat rooms — national groups, your suburb room, Mum Chat, Dad Chat",
                },
                {
                  emoji: "📅",
                  label: "Events",
                  desc: "Local meetups, online events, and playdates — RSVP and add to calendar",
                },
                {
                  emoji: "👥",
                  label: "Friends",
                  desc: "Connect with parents you meet here — private messages and chat",
                },
                {
                  emoji: "🔖",
                  label: "Saved",
                  desc: "Bookmark posts, events, and chat messages to find them later",
                },
              ].map(({ emoji, label, desc }) => (
                <div key={label} className="flex items-start gap-3 p-3 rounded-xl border border-border/30 hover:bg-secondary/30 transition-colors">
                  <span className="text-xl shrink-0 mt-0.5">{emoji}</span>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{label}</p>
                    <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-5 flex items-center justify-between border-t border-border/30 mt-2">
          {step > 1 ? (
            <Button variant="outline" size="sm" onClick={() => setStep(step - 1)} className="rounded-full">
              Back
            </Button>
          ) : (
            <div /> /* Step 1 — no back/skip, setup is mandatory */
          )}

          {step < TOTAL_STEPS ? (
            <Button
              onClick={() => {
                // Save profile data on step 5 completion, then advance to Village+ features step
                if (step === 5) { handleComplete(false); } else { setStep(step + 1); }
              }}
              disabled={!canAdvance || loading}
              className="rounded-full bg-primary text-primary-foreground"
            >
              {loading ? "Saving..." : step === 5 ? "Save & continue →" : "Continue"}
              {!loading && step !== 5 && <ChevronRight className="h-4 w-4 ml-1" />}
            </Button>
          ) : (
            <Button
              onClick={onComplete}
              className="rounded-full bg-primary text-primary-foreground px-5"
            >
              Start exploring 🌿
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
