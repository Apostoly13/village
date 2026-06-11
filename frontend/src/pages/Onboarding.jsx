import { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { toast } from "sonner";
import { ArrowRight, ArrowLeft } from "lucide-react";
import LocationButton from "../components/LocationButton";
import { Wordmark } from "../components/Wordmark";
import {
  IconChat, IconCal, IconSpaces, IconHome, IconCheck, IconLock, IconShield, IconSpark, IconPeople, IconPin
} from "../icons";

const API_URL = process.env.REACT_APP_BACKEND_URL;

const PARENTING_STAGES = [
  { id: "expecting",  label: "Expecting",        desc: "Baby on the way",  age: "Due soon" },
  { id: "newborn",    label: "Newborn",           desc: "0 – 3 months",     age: "0–3m"    },
  { id: "infant",     label: "Infant",            desc: "3 – 12 months",    age: "3–12m"   },
  { id: "toddler",    label: "Toddler",           desc: "1 – 4 years",      age: "1–4yr"   },
  { id: "school_age", label: "School Age",        desc: "5 – 12 years",     age: "5–12yr"  },
  { id: "teenager",   label: "Teenager",          desc: "13+ years",        age: "13+"     },
  { id: "multiples",  label: "Twins / Multiples", desc: "Two or more",      age: "×2+"     },
  { id: "mixed",      label: "Mixed ages",        desc: "Multiple kids",    age: "Multi"   },
];

const AUSTRALIAN_STATES = ["NSW", "VIC", "QLD", "WA", "SA", "TAS", "ACT", "NT"];

const GENDER_OPTIONS = [
  { id: "female",         label: "Mum"              },
  { id: "male",           label: "Dad"              },
  { id: "prefer_not_say", label: "Prefer not to say" },
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


export default function Onboarding({ user }) {
  const [saving, setSaving] = useState(false);
  const [onlineCount, setOnlineCount] = useState(null);

  useEffect(() => {
    fetch(`${API_URL}/api/stats/online`)
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data) setOnlineCount(data.online_now ?? null); })
      .catch(() => {});
  }, []);

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
      <div className="fixed top-0 left-0 right-0 z-50 backdrop-blur-sm border-b px-4 h-14 flex items-center" style={{ background: "var(--paper)", borderColor: "var(--line-2)" }}>
        <div className="max-w-2xl mx-auto w-full flex items-center justify-between gap-4">
          <Wordmark size={18} />
          {/* Progress segments */}
          <div className="flex items-center gap-1.5 flex-1 justify-center">
            {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
              <div key={i} className="h-[3px] rounded-full transition-all" style={{
                width: i < step ? 40 : 28,
                background: i < step ? "var(--clay)" : "var(--line)",
              }} />
            ))}
          </div>
          <span className="font-mono text-xs shrink-0" style={{ color: "var(--ink-3)", letterSpacing: "0.08em" }}>
            {String(step).padStart(2, "0")}/{String(TOTAL_STEPS).padStart(2, "0")}
          </span>
        </div>
      </div>

      {/* ── Content ───────────────────────────────────────────────────────────── */}
      <div className="pt-20 pb-28 px-4">
        <div className="max-w-2xl mx-auto">

          {/* ── Step 1: Welcome ───────────────────────────────────────────────── */}
          {step === 1 && (
            <div className="text-center animate-fade-in">
              {/* Live badge — only shown when count is real and >= 5 */}
              {onlineCount !== null && onlineCount >= 5 && (
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border mb-8" style={{ background: "var(--paper-2)", borderColor: "var(--line)" }}>
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
                  </span>
                  <span className="text-sm" style={{ color: "var(--ink-2)" }}>{onlineCount} Australian parent{onlineCount === 1 ? "" : "s"} online right now</span>
                </div>
              )}

              <h1 className="font-heading font-medium mb-4" style={{ fontFamily: "var(--serif)", fontSize: "clamp(28px,6vw,42px)", letterSpacing: "-0.03em", lineHeight: 1.15, color: "var(--ink)" }}>
                Welcome to Our Little{" "}
                <em style={{ fontStyle: "italic", color: "hsl(var(--accent))" }}>Village</em>
                {user?.name ? `, ${user.name.split(" ")[0]}` : ""}
              </h1>
              <p className="mb-8 max-w-md mx-auto leading-relaxed" style={{ fontSize: 15.5, lineHeight: 1.72, color: "var(--ink-2)" }}>
                A judgement-free community for Australian parents — whether you're expecting,
                up at 3am, or just need someone who gets it.
              </p>

              {/* Privacy note */}
              <div className="flex items-start gap-3 p-4 rounded-[8px] border mb-8 max-w-md mx-auto text-left" style={{ background: "var(--paper-2)", borderColor: "var(--line)" }}>
                <IconLock size={16} style={{ color: "var(--clay)", flexShrink: 0, marginTop: 2 }} />
                <div>
                  <p className="text-sm font-medium" style={{ color: "var(--ink)" }}>You control your privacy</p>
                  <p className="text-xs leading-relaxed" style={{ color: "var(--ink-3)" }}>Post or chat anonymously any time — no name, no avatar shown to anyone.</p>
                </div>
              </div>

              {/* Feature cards */}
              <div className="grid sm:grid-cols-3 gap-3 mb-10 text-left max-w-xl mx-auto">
                {[
                  { Icon: IconChat,   title: "Group Chats",        desc: "The 3am Club is always open. Local, national, and stage-based rooms." },
                  { Icon: IconSpaces, title: "Spaces",             desc: "Topic discussions for the real stuff — sleep, feeding, mental health." },
                  { Icon: IconShield, title: "Verified clinicians", desc: "Midwives, paeds, and mental-health clinicians — clearly marked." },
                ].map(({ Icon, title, desc }) => (
                  <div key={title} className="rounded-[8px] p-4 border text-left" style={{ background: "var(--paper-2)", borderColor: "var(--line)" }}>
                    <Icon size={18} style={{ color: "var(--clay)", marginBottom: 10 }} />
                    <h3 className="font-medium text-sm mb-1" style={{ color: "var(--ink)" }}>{title}</h3>
                    <p className="text-xs leading-relaxed" style={{ color: "var(--ink-3)" }}>{desc}</p>
                  </div>
                ))}
              </div>

              <Button
                onClick={handleNext}
                size="lg"
                className="rounded-[8px] px-8 h-11"
                style={{ background: "var(--ink)", color: "var(--paper)" }}
              >
                Set up my profile
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          )}

          {/* ── Step 2: About You ─────────────────────────────────────────────── */}
          {step === 2 && (
            <div className="animate-fade-in max-w-lg mx-auto w-full">
              <p className="tv-mono mb-2" style={{ color: "var(--clay)" }}>Step 2</p>
              <h2 className="font-heading font-medium text-2xl mb-1" style={{ color: "var(--ink)" }}>Tell us about you</h2>
              <p className="mb-6 text-sm" style={{ color: "var(--ink-3)" }}>A nickname is fine — many parents prefer it for privacy.</p>

              <div className="space-y-5">

                {/* Display name */}
                <div className="space-y-1.5">
                  <Label className="text-foreground font-medium text-sm">Display name</Label>
                  <Input
                    value={nickname}
                    onChange={e => setNickname(e.target.value)}
                    placeholder="What should we call you?"
                    className="h-11 rounded-[8px]"
                    style={{ background: "var(--paper)", border: "1px solid var(--line)", color: "var(--ink)" }}
                  />
                </div>

                {/* Parenting stage */}
                <div className="space-y-2">
                  <Label className="text-foreground font-medium text-sm">Where are you at?</Label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {PARENTING_STAGES.map(stage => (
                      <button
                        key={stage.id}
                        onClick={() => setParentingStage(stage.id)}
                        className={`rounded-[8px] p-3 text-left border-2 transition-all relative ${
                          parentingStage === stage.id
                            ? "border-[var(--clay)] bg-[var(--paper-3)]"
                            : "border-border/50 bg-card hover:border-border"
                        }`}
                      >
                        {parentingStage === stage.id && (
                          <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-[var(--clay)] flex items-center justify-center">
                            <IconCheck size={9} style={{ color: "white" }} />
                          </div>
                        )}
                        <span className="font-mono text-[10px] block mb-1" style={{ color: parentingStage === stage.id ? "var(--clay)" : "var(--ink-3)", letterSpacing: "0.04em" }}>{stage.age}</span>
                        <span className="text-sm font-medium text-foreground block">{stage.label}</span>
                        <span className="text-xs text-muted-foreground">{stage.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Mixed / multiples sub-picker */}
                {(parentingStage === "mixed" || parentingStage === "multiples") && (
                  <div className="space-y-2 pl-1 border-l-2 border-[var(--line)] ml-1">
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
                            className={`rounded-[8px] p-2.5 text-left border-2 transition-all flex items-center gap-2 ${
                              active ? "border-[var(--clay)] bg-[var(--paper-3)]" : "border-border/50 bg-card hover:border-border"
                            }`}
                          >
                            <span className="font-mono text-[10px]" style={{ color: "var(--ink-3)" }}>{stage.age}</span>
                            <div className="flex-1">
                              <span className="text-xs font-medium text-foreground block">{stage.label}</span>
                              <span className="text-xs text-muted-foreground">{stage.desc}</span>
                            </div>
                            {active && <IconCheck size={14} style={{ color: "var(--clay)", flexShrink: 0 }} />}
                          </button>
                        );
                      })}
                    </div>
                    {parentingStage === "mixed" && (
                      <button
                        onClick={() => setIsMultipleBirth(p => !p)}
                        className={`w-full rounded-[8px] px-3 py-2.5 border-2 flex items-center gap-3 transition-all text-left ${
                          isMultipleBirth ? "border-[var(--clay)] bg-[var(--paper-3)]" : "border-border/50 bg-card hover:border-border"
                        }`}
                      >
                        <span className="text-xs font-medium text-foreground flex-1">Some of these include twins or triplets</span>
                        {isMultipleBirth && <IconCheck size={14} style={{ color: "var(--clay)", flexShrink: 0 }} />}
                      </button>
                    )}
                  </div>
                )}

                {/* Gender — optional, folded into this step */}
                <div className="space-y-2 pt-1">
                  <Label className="text-foreground font-medium text-sm">
                    I am a… <span className="text-muted-foreground font-normal">(optional)</span>
                  </Label>
                  <div className="flex gap-2">
                    {GENDER_OPTIONS.map(opt => (
                      <button
                        key={opt.id}
                        onClick={() => setGender(gender === opt.id ? "" : opt.id)}
                        className={`flex-1 rounded-[8px] py-2.5 px-2 text-center border-2 transition-all text-sm ${
                          gender === opt.id
                            ? "border-[var(--clay)] bg-[var(--paper-3)] font-semibold"
                            : "border-border/50 bg-card hover:border-border font-normal"
                        }`}
                        style={{ color: gender === opt.id ? "var(--ink)" : "var(--ink-2)" }}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">Helps us personalise your spaces — you can skip or change this any time.</p>
                </div>

                {/* Single parent */}
                <button
                  onClick={() => setIsSingleParent(p => !p)}
                  className={`w-full rounded-[8px] p-4 border-2 flex items-center gap-3 transition-all text-left ${
                    isSingleParent ? "border-[var(--sage)] bg-[var(--paper-3)]" : "border-border/50 bg-card hover:border-border"
                  }`}
                >
                  <div className={`w-5 h-5 rounded-[4px] border-2 flex items-center justify-center flex-shrink-0 ${
                    isSingleParent ? "border-[var(--sage)] bg-[var(--sage)]" : "border-border"
                  }`}>
                    {isSingleParent && <IconCheck size={10} style={{ color: "white" }} />}
                  </div>
                  <div>
                    <p className="font-medium text-foreground text-sm">I'm a single parent</p>
                    <p className="text-xs text-muted-foreground">We'll connect you with others who understand the unique journey</p>
                  </div>
                </button>

              </div>
            </div>
          )}

          {/* ── Step 3: Location ──────────────────────────────────────────────── */}
          {step === 3 && (
            <div className="animate-fade-in max-w-lg mx-auto w-full">
              <p className="tv-mono mb-2" style={{ color: "var(--clay)" }}>Step 3</p>
              <h2 className="font-heading font-medium text-2xl mb-1" style={{ color: "var(--ink)" }}>Where in Australia?</h2>
              <p className="text-sm mb-2" style={{ color: "var(--ink-3)" }}>Find parents near you and see local group chats and events.</p>
              <div className="flex items-center gap-2 mb-6 text-xs rounded-[8px] px-3 py-2" style={{ color: "var(--ink-3)", background: "var(--paper-2)", border: "1px solid var(--line)" }}>
                <IconPin size={14} style={{ color: "var(--clay)", flexShrink: 0 }} />
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
                    className="h-11 rounded-[8px]"
                    style={{ background: "var(--paper)", border: "1px solid var(--line)", color: "var(--ink)" }}
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
                    <p className="text-xs px-1 mt-1 flex items-center gap-1" style={{ color: "var(--sage)" }}>
                      <IconCheck size={12} style={{ color: "var(--sage)" }} />
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
                        className={`rounded-[8px] py-2.5 text-sm font-medium border-2 transition-all ${
                          selectedState === s
                            ? "border-[var(--clay)] bg-[var(--paper-3)] text-primary"
                            : "border-border/50 bg-card hover:border-border text-foreground"
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
              <p className="tv-mono mb-2" style={{ color: "var(--clay)" }}>Step 4</p>
              <h2 className="font-heading font-medium text-2xl mb-2" style={{ color: "var(--ink)" }}>What brings you here today?</h2>
              <p className="text-sm mb-8" style={{ color: "var(--ink-3)" }}>We'll take you straight there when you're done.</p>

              <div className="space-y-3">
                {[
                  { id: "vent",     Icon: IconChat,   title: "I need to talk or vent",  desc: "Find a real-time group chat or support space with other parents right now." },
                  { id: "question", Icon: IconSpaces, title: "I have a question",        desc: "Post to a topic-based space and get answers from parents who've been there." },
                  { id: "browse",   Icon: IconHome,   title: "I'm just exploring",       desc: "Have a look around and see what Our Little Village has for you." },
                ].map(({ id, Icon, title, desc }) => (
                  <button
                    key={id}
                    onClick={() => setImmediateNeed(id)}
                    className={`w-full rounded-[8px] p-5 text-left border-2 flex items-start gap-4 transition-all ${
                      immediateNeed === id
                        ? "border-[var(--clay)] bg-[var(--paper-3)]"
                        : "border-border/50 bg-card hover:border-border"
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-[8px] flex items-center justify-center flex-shrink-0 border ${
                      immediateNeed === id ? "bg-[var(--clay-wash)] border-[var(--clay)]/30" : "bg-[var(--paper-3)] border-[var(--line)]"
                    }`}>
                      <Icon size={18} style={{ color: immediateNeed === id ? "var(--clay)" : "var(--ink-3)" }} />
                    </div>
                    <div className="flex-1">
                      <p className={`font-semibold text-base mb-1 ${immediateNeed === id ? "text-foreground" : "text-foreground"}`}>
                        {title}
                      </p>
                      <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
                    </div>
                    {immediateNeed === id && (
                      <div className="w-5 h-5 rounded-full bg-[var(--clay)] flex items-center justify-center shrink-0 mt-1">
                        <IconCheck size={10} style={{ color: "white" }} />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── Step 5: You're in! — explainer + destination ──────────────────── */}
          {step === 5 && (
            <div className="animate-fade-in text-center max-w-lg mx-auto w-full">
              {/* Check mark in circle */}
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5" style={{ background: "var(--sage-wash)", border: "1px solid rgba(120,152,120,0.3)" }}>
                <IconCheck size={28} style={{ color: "var(--sage)" }} />
              </div>
              <h2 className="font-heading font-medium text-3xl mb-2" style={{ color: "var(--ink)" }}>You're all set!</h2>
              <p className="mb-8 text-sm" style={{ color: "var(--ink-3)" }}>Welcome to Our Little Village. Here's what you have access to.</p>

              {/* Free / Trial / Premium explainer — no upsell language, just plain info */}
              <div className="village-card p-5 mb-6 text-left">
                {isTrial && (
                  <>
                    <div className="flex items-center gap-2 mb-3">
                      <IconSpark size={16} style={{ color: "var(--honey)" }} />
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
                          <IconCheck size={14} style={{ color: "var(--sage)", flexShrink: 0 }} />
                          {item}
                        </div>
                      ))}
                    </div>
                  </>
                )}

                {isFree && (
                  <>
                    <div className="flex items-center gap-2 mb-3">
                      <IconCheck size={16} style={{ color: "var(--sage)" }} />
                      <p className="font-semibold text-foreground">Free plan — always included</p>
                    </div>
                    <div className="space-y-2 mb-4">
                      {[
"Spaces — topic-based discussions",
"Group Chats — real-time local and national",
"Post, reply, and react — no weekly cap on chats",
                      ].map(item => (
                        <div key={item} className="flex items-center gap-2 text-sm text-foreground">
                          <IconCheck size={14} style={{ color: "var(--sage)", flexShrink: 0 }} />
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
                      <IconSpark size={16} style={{ color: "var(--honey)" }} />
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
                          <IconCheck size={14} style={{ color: "var(--sage)", flexShrink: 0 }} />
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
                className="w-full rounded-[8px] h-12"
                style={{ background: "var(--ink)", color: "var(--paper)" }}
                disabled={saving}
              >
                {saving ? "Setting up your village…" : getDestinationLabel()}
                {!saving && <ArrowRight className="h-5 w-5 ml-2" />}
              </Button>

              {immediateNeed !== "browse" && (
                <button
                  onClick={() => { window.location.href = "/dashboard"; }}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors mt-3 block mx-auto"
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
            <Button variant="ghost" onClick={handleBack} className="rounded-[8px]">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
          ) : <div />}

          {/* Forward — steps 2-4 only (step 1 + step 5 have in-page CTAs) */}
          {step >= 2 && step < 5 && (
            <div className="flex items-center gap-2 ml-auto">
              {/* Location can be skipped; the needs step cannot */}
              {step === 3 && (
                <Button variant="ghost" onClick={handleNext} className="rounded-[8px] text-muted-foreground">
                  Skip for now
                </Button>
              )}
              <Button
                onClick={handleNext}
                disabled={!canProceed() || saving}
                className="rounded-[8px] bg-primary text-primary-foreground px-6"
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
