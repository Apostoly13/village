import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { toast } from "sonner";
import { ChevronRight, X } from "lucide-react";

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

export default function OnboardingModal({ user, onComplete, onSkip: onSkipProp }) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Step 1 — parenting stage
  const [parentingStage, setParentingStage] = useState("");

  // Step 2 — location
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [state, setState] = useState("");

  // Step 3 — distance
  const [preferredReach, setPreferredReach] = useState("25km");

  const TOTAL_STEPS = 3;

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

  const handleComplete = async () => {
    setLoading(true);
    try {
      const updateData = {
        state,
        preferred_reach: preferredReach,
        onboarding_complete: true,
      };

      if (parentingStage) updateData.parenting_stage = parentingStage;

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
        onComplete();
      } else {
        toast.error("Failed to save. Please try again.");
      }
    } catch (error) {
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const canAdvance = step === 1
    ? !!parentingStage
    : step === 2
      ? !!state
      : true;

  const firstName = user?.nickname || user?.name?.split(" ")[0] || "there";

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-2xl max-w-md w-full shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 pt-6 pb-4">
          <div className="flex items-start justify-between mb-1">
            <div>
              <p className="text-xs text-muted-foreground font-medium mb-1">Step {step} of {TOTAL_STEPS}</p>
              <h2 className="font-heading text-xl font-bold text-foreground">
                {step === 1 && `Welcome, ${firstName} 🌿`}
                {step === 2 && "Where are you?"}
                {step === 3 && "How far do you reach?"}
              </h2>
              <p className="text-sm text-muted-foreground mt-0.5">
                {step === 1 && "Tell us about your parenting journey."}
                {step === 2 && "We use this to find local chat rooms and meetups near you."}
                {step === 3 && "Your default distance for finding parents and events."}
              </p>
            </div>
            <button onClick={onSkip} className="text-muted-foreground hover:text-foreground p-1 transition-colors shrink-0">
              <X className="h-4 w-4" />
            </button>
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
        <div className="px-6 pb-2">
          {/* Step 1 — Parenting stage */}
          {step === 1 && (
            <div className="grid grid-cols-2 gap-2.5 py-2">
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
                  <span className="text-2xl">{stage.emoji}</span>
                  <span className={`text-sm font-medium leading-tight ${
                    parentingStage === stage.id ? "text-primary" : "text-foreground"
                  }`}>
                    {stage.label}
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* Step 2 — Location */}
          {step === 2 && (
            <div className="space-y-4 py-2">
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
            </div>
          )}

          {/* Step 3 — Distance */}
          {step === 3 && (
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
        </div>

        {/* Footer */}
        <div className="px-6 py-5 flex items-center justify-between border-t border-border/30 mt-2">
          {step > 1 ? (
            <Button variant="outline" size="sm" onClick={() => setStep(step - 1)} className="rounded-full">
              Back
            </Button>
          ) : (
            <Button variant="ghost" size="sm" onClick={onSkip} className="rounded-full text-muted-foreground text-xs">
              Skip setup
            </Button>
          )}

          {step < TOTAL_STEPS ? (
            <Button
              onClick={() => setStep(step + 1)}
              disabled={!canAdvance}
              className="rounded-full bg-primary text-primary-foreground"
            >
              Continue
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          ) : (
            <Button
              onClick={handleComplete}
              disabled={loading}
              className="rounded-full bg-primary text-primary-foreground"
            >
              {loading ? "Saving..." : "Enter the village 🌿"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
