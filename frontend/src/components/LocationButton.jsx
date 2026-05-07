import { useState } from "react";
import { MapPin, Loader2 } from "lucide-react";
import { Button } from "./ui/button";
import { toast } from "sonner";

// Maps full Australian state names from Nominatim to abbreviations
const AU_STATE_MAP = {
  "New South Wales": "NSW",
  "Victoria": "VIC",
  "Queensland": "QLD",
  "Western Australia": "WA",
  "South Australia": "SA",
  "Tasmania": "TAS",
  "Australian Capital Territory": "ACT",
  "Northern Territory": "NT",
};

/**
 * LocationButton — browser geolocation → Australian reverse geocode → callback
 *
 * Props:
 *   onLocation({ suburb, postcode, state, latitude, longitude }) — called on success
 *   className — optional extra classes
 *   size — "sm" | "default"
 */
export default function LocationButton({ onLocation, className = "", size = "sm" }) {
  const [loading, setLoading] = useState(false);

  const handleClick = () => {
    if (!navigator.geolocation) {
      toast.error("Your browser doesn't support location detection.");
      return;
    }

    setLoading(true);

    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        try {
          const { latitude, longitude } = coords;
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1&countrycodes=au`,
            { headers: { "Accept-Language": "en", "User-Agent": "TheVillage/1.0" } }
          );
          if (!res.ok) throw new Error("Reverse geocode failed");
          const data = await res.json();

          if (data.error || !data.address) {
            toast.error("We couldn't find an Australian suburb at your location. Please search manually.");
            return;
          }

          const addr = data.address;

          // Validate the result is in Australia
          if (addr.country_code && addr.country_code !== "au") {
            toast.error("Location appears to be outside Australia. Please search manually.");
            return;
          }

          const suburb =
            addr.suburb ||
            addr.town ||
            addr.city_district ||
            addr.village ||
            addr.municipality ||
            addr.county ||
            "";
          const postcode = addr.postcode || "";
          const stateRaw = addr.state || "";
          const state = AU_STATE_MAP[stateRaw] || stateRaw;

          if (!suburb && !postcode) {
            toast.error("Couldn't identify your suburb — please search manually.");
            return;
          }

          onLocation({ suburb, postcode, state, latitude, longitude });
        } catch {
          toast.error("Couldn't get your location details — please search manually.");
        } finally {
          setLoading(false);
        }
      },
      (err) => {
        setLoading(false);
        if (err.code === 1 /* PERMISSION_DENIED */) {
          toast.error("Location access denied. You can enable it in your browser settings, or search for your suburb manually.");
        } else {
          toast.error("Couldn't get your location — please search manually.");
        }
      },
      { timeout: 10000, maximumAge: 60000 }
    );
  };

  return (
    <Button
      type="button"
      variant="outline"
      size={size}
      className={`rounded-xl gap-1.5 text-xs font-medium border-primary/30 text-primary hover:bg-primary/5 hover:border-primary/50 ${className}`}
      onClick={handleClick}
      disabled={loading}
    >
      {loading ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : (
        <MapPin className="h-3.5 w-3.5" />
      )}
      {loading ? "Detecting…" : "Use my location"}
    </Button>
  );
}
