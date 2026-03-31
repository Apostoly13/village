import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { toast } from "sonner";
import { MapPin, Users, Compass, ChevronRight, X, Search } from "lucide-react";

const API_URL = process.env.REACT_APP_BACKEND_URL;

const AUSTRALIAN_STATES = ["NSW", "VIC", "QLD", "WA", "SA", "TAS", "ACT", "NT"];
const DISTANCE_OPTIONS = [
  { id: "2km", label: "Super Local (2km)" },
  { id: "5km", label: "Local (5km)" },
  { id: "10km", label: "Nearby (10km)" },
  { id: "25km", label: "25km" },
  { id: "50km", label: "50km" },
  { id: "100km", label: "100km" },
  { id: "state", label: "My State" },
  { id: "all", label: "All Australia" },
];

export default function OnboardingModal({ user, onComplete, onSkip }) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  
  // Location
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [state, setState] = useState("");
  
  // Preferences
  const [preferredReach, setPreferredReach] = useState("25km");
  const [numberOfKids, setNumberOfKids] = useState("");
  const [kidsAges, setKidsAges] = useState("");

  // Search for location
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
      // Map full state name to abbreviation
      const stateMap = {
        "New South Wales": "NSW",
        "Victoria": "VIC",
        "Queensland": "QLD",
        "Western Australia": "WA",
        "South Australia": "SA",
        "Tasmania": "TAS",
        "Australian Capital Territory": "ACT",
        "Northern Territory": "NT"
      };
      setState(stateMap[location.state] || location.state);
    }
  };

  const handleComplete = async () => {
    setLoading(true);
    try {
      const updateData = {
        state: state,
        preferred_reach: preferredReach,
        onboarding_complete: true
      };
      
      if (selectedLocation) {
        updateData.suburb = selectedLocation.suburb || searchQuery;
        updateData.postcode = selectedLocation.postcode;
        updateData.latitude = selectedLocation.lat;
        updateData.longitude = selectedLocation.lon;
        updateData.location = selectedLocation.suburb || searchQuery;
      }
      
      if (numberOfKids) {
        updateData.number_of_kids = parseInt(numberOfKids);
      }
      
      if (kidsAges) {
        updateData.kids_ages = kidsAges.split(",").map(a => a.trim());
      }

      const response = await fetch(`${API_URL}/api/users/profile`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(updateData)
      });

      if (response.ok) {
        toast.success("Profile updated! You're all set.");
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

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="p-6 border-b border-border/50">
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-heading text-xl font-bold text-foreground">Welcome to The Village! 🏡</h2>
            <Button variant="ghost" size="sm" onClick={onSkip} className="text-muted-foreground">
              <X className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            Let's set up your profile to help you connect with parents near you.
          </p>
          
          {/* Progress */}
          <div className="flex gap-2 mt-4">
            {[1, 2, 3].map((s) => (
              <div 
                key={s}
                className={`h-1 flex-1 rounded-full transition-colors ${
                  s <= step ? 'bg-primary' : 'bg-secondary'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {step === 1 && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <MapPin className="h-8 w-8 text-primary" />
                </div>
                <h3 className="font-heading text-lg font-bold text-foreground">Where are you located?</h3>
                <p className="text-sm text-muted-foreground">This helps us connect you with local parents</p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-foreground">State</Label>
                  <Select value={state} onValueChange={setState}>
                    <SelectTrigger className="h-12 rounded-xl bg-secondary/50 border-transparent">
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
                  <Label className="text-foreground">Suburb or Postcode</Label>
                  <div className="relative">
                    <Input
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="e.g., Bondi, 2026"
                      className="h-12 rounded-xl bg-secondary/50 border-transparent pr-10"
                    />
                    {searching && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                      </div>
                    )}
                  </div>
                  
                  {/* Search Results */}
                  {searchResults.length > 0 && (
                    <div className="bg-card border border-border/50 rounded-xl overflow-hidden max-h-48 overflow-y-auto">
                      {searchResults.map((result, idx) => (
                        <button
                          key={idx}
                          onClick={() => selectLocation(result)}
                          className="w-full px-4 py-3 text-left hover:bg-secondary/50 transition-colors border-b border-border/30 last:border-0"
                        >
                          <p className="text-sm font-medium text-foreground">{result.suburb || result.display_name.split(",")[0]}</p>
                          <p className="text-xs text-muted-foreground truncate">{result.display_name}</p>
                        </button>
                      ))}
                    </div>
                  )}
                  
                  {selectedLocation && (
                    <p className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                      ✓ Location set: {selectedLocation.suburb || searchQuery}
                      {selectedLocation.postcode && `, ${selectedLocation.postcode}`}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <Compass className="h-8 w-8 text-primary" />
                </div>
                <h3 className="font-heading text-lg font-bold text-foreground">How far do you want to reach?</h3>
                <p className="text-sm text-muted-foreground">Your default distance for finding parents and chat rooms</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {DISTANCE_OPTIONS.map((option) => (
                  <button
                    key={option.id}
                    onClick={() => setPreferredReach(option.id)}
                    className={`p-4 rounded-xl border-2 transition-all text-left ${
                      preferredReach === option.id
                        ? 'border-primary bg-primary/10'
                        : 'border-border/50 hover:border-primary/50'
                    }`}
                  >
                    <span className={`text-sm font-medium ${
                      preferredReach === option.id ? 'text-primary' : 'text-foreground'
                    }`}>
                      {option.label}
                    </span>
                  </button>
                ))}
              </div>
              
              <p className="text-xs text-muted-foreground text-center">
                You can change this anytime in your profile settings
              </p>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <Users className="h-8 w-8 text-primary" />
                </div>
                <h3 className="font-heading text-lg font-bold text-foreground">Tell us about your family</h3>
                <p className="text-sm text-muted-foreground">Optional - helps us personalize your experience</p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-foreground">Number of kids</Label>
                  <Select value={numberOfKids} onValueChange={setNumberOfKids}>
                    <SelectTrigger className="h-12 rounded-xl bg-secondary/50 border-transparent">
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1</SelectItem>
                      <SelectItem value="2">2</SelectItem>
                      <SelectItem value="3">3</SelectItem>
                      <SelectItem value="4">4</SelectItem>
                      <SelectItem value="5">5+</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-foreground">Kids' ages (optional)</Label>
                  <Input
                    value={kidsAges}
                    onChange={(e) => setKidsAges(e.target.value)}
                    placeholder="e.g., 2, 5, newborn"
                    className="h-12 rounded-xl bg-secondary/50 border-transparent"
                  />
                  <p className="text-xs text-muted-foreground">Separate multiple ages with commas</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-border/50 flex justify-between">
          {step > 1 ? (
            <Button variant="outline" onClick={() => setStep(step - 1)} className="rounded-full">
              Back
            </Button>
          ) : (
            <Button variant="ghost" onClick={onSkip} className="rounded-full text-muted-foreground">
              Skip for now
            </Button>
          )}
          
          {step < 3 ? (
            <Button 
              onClick={() => setStep(step + 1)} 
              className="rounded-full bg-primary text-primary-foreground"
              disabled={step === 1 && !state}
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
              {loading ? "Saving..." : "Get Started"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
