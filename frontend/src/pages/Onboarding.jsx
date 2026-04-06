import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Label } from "../components/ui/label";
import { toast } from "sonner";
import { ArrowRight, ArrowLeft, MapPin, Check, MessageCircle, Users, BookOpen, Heart, Sparkles } from "lucide-react";

const API_URL = process.env.REACT_APP_BACKEND_URL;

const INTEREST_OPTIONS = [
  { label: "Sleep & Settling", emoji: "🌙" },
  { label: "Feeding", emoji: "🍼" },
  { label: "Toddler Activities", emoji: "🧸" },
  { label: "School Age", emoji: "🎒" },
  { label: "Mental Health", emoji: "💚" },
  { label: "Dad Talk", emoji: "👨" },
  { label: "Local Events", emoji: "📍" },
  { label: "Buy & Swap", emoji: "🔄" },
  { label: "Recipes & Nutrition", emoji: "🥦" },
  { label: "Development Milestones", emoji: "⭐" },
];

const PARENTING_STAGES = [
  { id: "expecting", label: "Expecting", emoji: "🤰", desc: "Baby on the way" },
  { id: "newborn", label: "Newborn", emoji: "👶", desc: "0 – 3 months" },
  { id: "infant", label: "Infant", emoji: "🧒", desc: "3 – 12 months" },
  { id: "toddler", label: "Toddler", emoji: "🚶", desc: "1 – 3 years" },
  { id: "school_age", label: "School Age", emoji: "🎒", desc: "5 – 12 years" },
  { id: "teenager", label: "Teenager", emoji: "🧑", desc: "13+ years" },
  { id: "mixed", label: "Mixed ages", emoji: "👨‍👩‍👧‍👦", desc: "Multiple kids" },
];

const AUSTRALIAN_STATES = ["NSW", "VIC", "QLD", "WA", "SA", "TAS", "ACT", "NT"];

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
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);

  // Step 2 — About You
  const [nickname, setNickname] = useState(user?.name || "");
  const [bio, setBio] = useState("");
  const [parentingStage, setParentingStage] = useState("");
  const [mixedAgeGroups, setMixedAgeGroups] = useState([]);
  const [isSingleParent, setIsSingleParent] = useState(false);

  const toggleMixedAgeGroup = (id) => {
    setMixedAgeGroups(prev =>
      prev.includes(id) ? prev.filter(g => g !== id) : [...prev, id]
    );
  };

  // Step 3 — Location
  const [locationSearch, setLocationSearch] = useState("");
  const [locationResults, setLocationResults] = useState([]);
  const [searchingLocation, setSearchingLocation] = useState(false);
  const [suburb, setSuburb] = useState("");
  const [postcode, setPostcode] = useState("");
  const [selectedState, setSelectedState] = useState("");
  const [latitude, setLatitude] = useState(null);
  const [longitude, setLongitude] = useState(null);

  // Step 4 — Interests
  const [interests, setInterests] = useState([]);

  const toggleInterest = (label) => {
    setInterests(prev =>
      prev.includes(label) ? prev.filter(i => i !== label) : [...prev, label]
    );
  };

  const searchLocation = async (q) => {
    setLocationSearch(q);
    if (q.length < 2) { setLocationResults([]); return; }
    setSearchingLocation(true);
    try {
      const res = await fetch(`${API_URL}/api/location/search?q=${encodeURIComponent(q)}`, { credentials: "include" });
      if (res.ok) setLocationResults(await res.json());
    } catch {}
    finally { setSearchingLocation(false); }
  };

  const selectLocation = (loc) => {
    setSuburb(loc.suburb || loc.name || "");
    setPostcode(loc.postcode || "");
    setSelectedState(loc.state || "");
    setLatitude(loc.latitude || null);
    setLongitude(loc.longitude || null);
    setLocationSearch(`${loc.suburb || loc.name}${loc.postcode ? ", " + loc.postcode : ""}`);
    setLocationResults([]);
  };

  const saveAndFinish = async () => {
    setSaving(true);
    try {
      await fetch(`${API_URL}/api/users/profile`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          nickname: nickname.trim() || user?.name,
          bio: bio.trim(),
          parenting_stage: parentingStage,
          is_single_parent: isSingleParent,
          suburb: suburb,
          postcode: postcode,
          state: selectedState,
          location: suburb,
          latitude: latitude,
          longitude: longitude,
          interests: interests,
          mixed_age_groups: parentingStage === "mixed" ? mixedAgeGroups : [],
          onboarding_complete: true,
        }),
      });
      // Update localStorage user
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

  const handleDone = () => { window.location.href = "/dashboard"; };

  // ── Step renderers ────────────────────────────────────────────

  const StepWelcome = () => (
    <div className="text-center animate-fade-in">
      <div className="text-7xl mb-6">🏡</div>
      <h1 className="font-heading text-3xl sm:text-4xl font-bold text-foreground mb-3">
        Welcome to The Village,<br />
        <span className="text-primary">{user?.name?.split(" ")[0] || "friend"}!</span>
      </h1>
      <p className="text-muted-foreground text-lg mb-10 max-w-md mx-auto leading-relaxed">
        A judgment-free community for Australian parents — whether you're expecting,
        up at 3am, or just need someone who gets it.
      </p>

      <div className="grid sm:grid-cols-3 gap-4 mb-10 text-left max-w-xl mx-auto">
        {[
          { icon: MessageCircle, emoji: "💬", title: "Support Spaces", desc: "Discuss topics from feeding to mental health with parents who understand." },
          { icon: Users, emoji: "👥", title: "Chat Circles", desc: "Real-time chat rooms for your area and every stage of parenting." },
          { icon: Heart, emoji: "💛", title: "Real Connection", desc: "Make friends, share wins, and get support when you need it most." },
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
  );

  const StepAboutYou = () => (
    <div className="animate-fade-in max-w-lg mx-auto w-full">
      <h2 className="font-heading text-2xl font-bold text-foreground mb-1">About you</h2>
      <p className="text-muted-foreground mb-6">This is what other parents will see. Keep it real — that's what we're about.</p>

      <div className="space-y-5">
        {/* Nickname */}
        <div className="space-y-1.5">
          <Label className="text-foreground font-medium">Display name</Label>
          <Input
            value={nickname}
            onChange={e => setNickname(e.target.value)}
            placeholder="What should we call you?"
            className="h-12 rounded-xl bg-secondary/50 border-transparent focus:border-primary"
          />
          <p className="text-xs text-muted-foreground">You can use a nickname — no judgement here.</p>
        </div>

        {/* Bio */}
        <div className="space-y-1.5">
          <Label className="text-foreground font-medium">A little about you <span className="text-muted-foreground font-normal">(optional)</span></Label>
          <Textarea
            value={bio}
            onChange={e => setBio(e.target.value)}
            placeholder="e.g. Mum to a 4-month-old, surviving on coffee and love ☕"
            className="rounded-xl bg-secondary/50 border-transparent focus:border-primary resize-none"
            rows={3}
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

        {/* Mixed ages sub-selection */}
        {parentingStage === "mixed" && (
          <div className="space-y-2 pl-1 border-l-2 border-primary/30 ml-1">
            <Label className="text-foreground font-medium text-sm">Which age groups do you have? <span className="text-muted-foreground font-normal">(select all that apply)</span></Label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {PARENTING_STAGES.filter(s => s.id !== "mixed").map(stage => {
                const active = mixedAgeGroups.includes(stage.id);
                return (
                  <button
                    key={stage.id}
                    onClick={() => toggleMixedAgeGroup(stage.id)}
                    className={`rounded-xl p-2.5 text-left border-2 transition-all flex items-center gap-2 ${
                      active
                        ? "border-primary bg-primary/10"
                        : "border-border/50 bg-card hover:border-primary/40"
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
          </div>
        )}

        {/* Single parent toggle */}
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
  );

  const StepLocation = () => (
    <div className="animate-fade-in max-w-lg mx-auto w-full">
      <h2 className="font-heading text-2xl font-bold text-foreground mb-1">Your location</h2>
      <p className="text-muted-foreground mb-2">
        Connect with parents near you — in your suburb, postcode, or state.
      </p>
      <div className="flex items-center gap-2 mb-6 text-xs text-muted-foreground bg-secondary/50 rounded-xl px-3 py-2">
        <MapPin className="h-3.5 w-3.5 text-primary flex-shrink-0" />
        Your location is never shared publicly. It's only used to find local rooms and parents.
      </div>

      <div className="space-y-4">
        {/* Suburb search */}
        <div className="space-y-1.5 relative">
          <Label className="text-foreground font-medium">Suburb or postcode</Label>
          <Input
            value={locationSearch}
            onChange={e => searchLocation(e.target.value)}
            placeholder="e.g. Bondi, 2026, Fitzroy..."
            className="h-12 rounded-xl bg-secondary/50 border-transparent focus:border-primary"
          />
          {searchingLocation && (
            <p className="text-xs text-muted-foreground px-1 mt-1">Searching...</p>
          )}
          {locationResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 z-50 bg-card border border-border/50 rounded-xl shadow-lg mt-1 overflow-hidden">
              {locationResults.slice(0, 5).map((loc, i) => (
                <button
                  key={i}
                  onClick={() => selectLocation(loc)}
                  className="w-full px-4 py-3 text-left hover:bg-secondary/50 border-b border-border/30 last:border-0 transition-colors"
                >
                  <span className="font-medium text-foreground text-sm">{loc.suburb || loc.name}</span>
                  <span className="text-muted-foreground text-xs ml-2">{loc.postcode} · {loc.state}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* State fallback */}
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
  );

  const StepInterests = () => (
    <div className="animate-fade-in max-w-lg mx-auto w-full">
      <h2 className="font-heading text-2xl font-bold text-foreground mb-1">Your interests</h2>
      <p className="text-muted-foreground mb-6">
        Pick what matters to you — we'll recommend the best Support Spaces and Chat Circles.
      </p>
      <div className="grid grid-cols-2 gap-2">
        {INTEREST_OPTIONS.map(({ label, emoji }) => {
          const active = interests.includes(label);
          return (
            <button
              key={label}
              onClick={() => toggleInterest(label)}
              className={`rounded-xl px-4 py-3 text-left border-2 flex items-center gap-3 transition-all ${
                active
                  ? "border-primary bg-primary/10"
                  : "border-border/50 bg-card hover:border-primary/40"
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
  );

  const StepTour = () => (
    <div className="animate-fade-in text-center max-w-lg mx-auto w-full">
      <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
        <Sparkles className="h-8 w-8 text-primary" />
      </div>
      <h2 className="font-heading text-2xl font-bold text-foreground mb-2">You're all set!</h2>
      <p className="text-muted-foreground mb-8">Here's how to make the most of The Village.</p>

      <div className="space-y-3 text-left mb-8">
        {[
          {
            emoji: "💬",
            title: "Support Spaces",
            tips: [
              "Browse by topic (Feeding Circle, Mental Health Circle, Dad Circle…) or age group",
              "Post anonymously if you're sharing something sensitive",
              "React and reply — every response helps someone feel less alone",
            ],
          },
          {
            emoji: "🗣️",
            title: "Chat Circles",
            tips: [
              "Join the 3am Club for late-night company during feeds",
              "Find your local suburb room to meet parents nearby",
              "Dad Chat is available for dads who want a space of their own",
            ],
          },
          {
            emoji: "👥",
            title: "Friends & Private Chat",
            tips: [
              "Send a friend request from anyone's profile",
              "Once you're friends, open a private chat from Chat Circles → Friends tab",
              "Your chat popout lets you message friends from anywhere on the platform",
            ],
          },
          {
            emoji: "🏅",
            title: "Trust Badges",
            tips: [
              "Earn the Night Owl badge 🦉 by being active in the 3am Club",
              "Get the Local Parent badge 📍 after your first month on the platform",
              "Trusted Parent 🤝 is earned when others appreciate your replies",
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
        onClick={handleDone}
        size="lg"
        className="w-full rounded-full bg-primary text-primary-foreground shadow-[0_0_20px_rgba(245,197,66,0.3)]"
        disabled={saving}
      >
        {saving ? "Saving your profile..." : "Take me to my village 🏡"}
      </Button>
    </div>
  );

  const steps = [StepWelcome, StepAboutYou, StepLocation, StepInterests, StepTour];
  const StepComponent = steps[step - 1];

  const canProceed = () => {
    if (step === 2) return nickname.trim().length > 0 && parentingStage !== "";
    return true;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-sm border-b border-border/30 px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center gap-4">
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xl">🏡</span>
            <span className="font-heading font-bold text-foreground hidden sm:block">The Village</span>
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
          <StepComponent />
        </div>
      </div>

      {/* Footer nav */}
      <div className="fixed bottom-0 left-0 right-0 bg-background/90 backdrop-blur-sm border-t border-border/30 px-4 py-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between gap-3">
          {step > 1 && step < 5 ? (
            <Button variant="ghost" onClick={handleBack} className="rounded-full">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
          ) : (
            <div />
          )}

          {step < 5 && (
            <div className="flex items-center gap-2 ml-auto">
              {/* Location and interests can be skipped */}
              {(step === 3 || step === 4) && (
                <Button variant="ghost" onClick={handleNext} className="rounded-full text-muted-foreground">
                  Skip for now
                </Button>
              )}
              <Button
                onClick={handleNext}
                disabled={!canProceed() || saving}
                className="rounded-full bg-primary text-primary-foreground px-6"
              >
                {saving ? "Saving..." : step === 4 ? "Finish setup" : "Continue"}
                {!saving && <ArrowRight className="h-4 w-4 ml-1" />}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
