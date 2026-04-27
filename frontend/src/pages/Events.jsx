import React, { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Crown } from "lucide-react";
import Navigation from "../components/Navigation";
import LocationButton from "../components/LocationButton";
import { Calendar, MapPin, Clock, Users, Plus, Download, Check, Pencil, UserPlus, X, Send, MessageCircle, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { parseApiError } from "../utils/apiError";
import AppFooter from "../components/AppFooter";
import { EVENT_CATEGORIES, CATEGORY_STYLES, CATEGORY_LABELS } from "../utils/eventCategories";
import { formatEventDate, timeAgoVerbose } from "../utils/dateHelpers";

const API_URL = process.env.REACT_APP_BACKEND_URL;

// Re-export as CATEGORIES for backward compat within this file
const CATEGORIES = EVENT_CATEGORIES;

const AU_STATES = ["NSW", "VIC", "QLD", "WA", "SA", "TAS", "ACT", "NT"];

const INPUT_CLASS = "w-full rounded-xl border border-border bg-card text-foreground px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 dark:[color-scheme:dark]";

// formatEventDate imported from utils/dateHelpers

function EditEventDialog({ event, onUpdated, onClose }) {
  const [form, setForm] = useState({
    title: event.title || "",
    description: event.description || "",
    venue_name: event.venue_name || "",
    suburb: event.suburb || "",
    state: event.state || "",
    date: event.date || "",
    time_start: event.time_start || "",
    time_end: event.time_end || "",
    category: event.category || "general",
    rsvp_limit: event.rsvp_limit || "",
    is_private: event.is_private || false,
  });
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!form.title.trim()) e.title = "Title is required";
    if (!form.date) e.date = "Date is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const payload = { ...form, rsvp_limit: form.rsvp_limit ? Number(form.rsvp_limit) : null };
      const res = await fetch(`${API_URL}/api/events/${event.event_id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const updated = await res.json();
        toast.success("Event updated");
        onUpdated(updated);
        onClose();
      } else {
        const err = await res.json();
        toast.error(parseApiError(err.detail, "Failed to update event"));
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4 py-2">
      <div>
        <label className="text-sm font-medium text-foreground block mb-1">Title <span className="text-destructive">*</span></label>
        <input
          className={`${INPUT_CLASS} ${errors.title ? "border-destructive/60 focus:ring-destructive/50" : ""}`}
          value={form.title}
          onChange={e => { setForm(f => ({...f, title: e.target.value})); if (errors.title) setErrors(v => ({...v, title: ""})); }}
        />
        {errors.title && <p className="text-xs text-destructive mt-1">{errors.title}</p>}
      </div>
      <div>
        <label className="text-sm font-medium text-foreground block mb-1">Description</label>
        <textarea className={INPUT_CLASS} rows={3} value={form.description} onChange={e => setForm(f => ({...f, description: e.target.value}))} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-sm font-medium text-foreground block mb-1">Date <span className="text-destructive">*</span></label>
          <input
            type="date"
            className={`${INPUT_CLASS} ${errors.date ? "border-destructive/60 focus:ring-destructive/50" : ""}`}
            value={form.date}
            onChange={e => { setForm(f => ({...f, date: e.target.value})); if (errors.date) setErrors(v => ({...v, date: ""})); }}
          />
          {errors.date && <p className="text-xs text-destructive mt-1">{errors.date}</p>}
        </div>
        <div>
          <label className="text-sm font-medium text-foreground block mb-1">Category</label>
          <select className={INPUT_CLASS} value={form.category} onChange={e => setForm(f => ({...f, category: e.target.value}))}>
            {["general","playgroup","meetup","workshop","support"].map(c => (
              <option key={c} value={c}>{c.charAt(0).toUpperCase()+c.slice(1)}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-sm font-medium text-foreground block mb-1">Start time</label>
          <input type="time" className={INPUT_CLASS} value={form.time_start} onChange={e => setForm(f => ({...f, time_start: e.target.value}))} />
        </div>
        <div>
          <label className="text-sm font-medium text-foreground block mb-1">End time</label>
          <input type="time" className={INPUT_CLASS} value={form.time_end} onChange={e => setForm(f => ({...f, time_end: e.target.value}))} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-sm font-medium text-foreground block mb-1">Venue / Location</label>
          <input className={INPUT_CLASS} placeholder="Venue name" value={form.venue_name} onChange={e => setForm(f => ({...f, venue_name: e.target.value}))} />
        </div>
        <div>
          <label className="text-sm font-medium text-foreground block mb-1">Suburb</label>
          <input className={INPUT_CLASS} value={form.suburb} onChange={e => setForm(f => ({...f, suburb: e.target.value}))} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-sm font-medium text-foreground block mb-1">State</label>
          <select className={INPUT_CLASS} value={form.state} onChange={e => setForm(f => ({...f, state: e.target.value}))}>
            <option value="">Select state</option>
            {AU_STATES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label className="text-sm font-medium text-foreground block mb-1">RSVP limit</label>
          <input type="number" className={INPUT_CLASS} placeholder="No limit" value={form.rsvp_limit} onChange={e => setForm(f => ({...f, rsvp_limit: e.target.value}))} />
        </div>
      </div>
      <label className="flex items-center gap-2 cursor-pointer">
        <input type="checkbox" checked={form.is_private} onChange={e => setForm(f => ({...f, is_private: e.target.checked}))} className="rounded" />
        <span className="text-sm text-foreground">Private event</span>
      </label>
      <div className="flex gap-2 pt-2">
        <Button variant="outline" className="flex-1 rounded-xl" onClick={onClose}>Cancel</Button>
        <Button className="flex-1 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90" onClick={handleSave} disabled={saving}>
          {saving ? "Saving..." : "Save changes"}
        </Button>
      </div>
    </div>
  );
}

function ManageModeratorsDialog({ event, onClose }) {
  const [moderators, setModerators] = useState([]);
  const [searchEmail, setSearchEmail] = useState("");
  const [searchResult, setSearchResult] = useState(null);
  const [searching, setSearching] = useState(false);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    const fetchMods = async () => {
      try {
        const res = await fetch(`${API_URL}/api/events/${event.event_id}/moderators`, { credentials: "include" });
        if (res.ok) setModerators(await res.json());
      } catch {}
    };
    fetchMods();
  }, [event.event_id]);

  const handleSearch = async () => {
    if (!searchEmail.trim()) return;
    setSearching(true);
    setSearchResult(null);
    try {
      const res = await fetch(`${API_URL}/api/users/search?q=${encodeURIComponent(searchEmail)}`, { credentials: "include" });
      if (res.ok) {
        const users = await res.json();
        setSearchResult(users[0] || null);
        if (!users[0]) toast.error("No user found with that email");
      }
    } catch {
      toast.error("Search failed");
    } finally {
      setSearching(false);
    }
  };

  const handleAdd = async (userId) => {
    setAdding(true);
    try {
      const res = await fetch(`${API_URL}/api/events/${event.event_id}/moderators`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ action: "add", user_id: userId }),
      });
      if (res.ok) {
        toast.success("Moderator added");
        setModerators(prev => [...prev, searchResult]);
        setSearchResult(null);
        setSearchEmail("");
      }
    } catch {
      toast.error("Failed to add moderator");
    } finally {
      setAdding(false);
    }
  };

  const handleRemove = async (userId) => {
    try {
      await fetch(`${API_URL}/api/events/${event.event_id}/moderators`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ action: "remove", user_id: userId }),
      });
      setModerators(prev => prev.filter(m => m.user_id !== userId));
      toast.success("Moderator removed");
    } catch {
      toast.error("Failed to remove moderator");
    }
  };

  return (
    <div className="space-y-4 py-2">
      <p className="text-sm text-muted-foreground">Moderators can edit and cancel this event.</p>
      {moderators.length > 0 && (
        <div className="space-y-2">
          {moderators.map(mod => (
            <div key={mod.user_id} className="flex items-center justify-between py-2 px-3 bg-secondary/50 rounded-xl">
              <span className="text-sm text-foreground">{mod.nickname || mod.name}</span>
              <button onClick={() => handleRemove(mod.user_id)} className="text-destructive hover:text-destructive/80 transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
      <div className="flex gap-2">
        <input
          className={INPUT_CLASS}
          placeholder="Search by email or name"
          value={searchEmail}
          onChange={e => setSearchEmail(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handleSearch()}
        />
        <Button variant="outline" className="rounded-xl flex-shrink-0" onClick={handleSearch} disabled={searching}>
          {searching ? "..." : "Find"}
        </Button>
      </div>
      {searchResult && (
        <div className="flex items-center justify-between py-2 px-3 bg-card border border-border/50 rounded-xl">
          <span className="text-sm text-foreground">{searchResult.nickname || searchResult.name}</span>
          <Button size="sm" className="rounded-lg h-7 text-xs bg-primary text-primary-foreground" onClick={() => handleAdd(searchResult.user_id)} disabled={adding}>
            Add
          </Button>
        </div>
      )}
      <Button variant="outline" className="w-full rounded-xl" onClick={onClose}>Done</Button>
    </div>
  );
}

function EventCard({ event, onRsvp, onUpdated, user, onOpenDetail }) {
  const [rsvping, setRsvping] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [modsOpen, setModsOpen] = useState(false);
  const dateInfo = formatEventDate(event.date);
  const catStyle = CATEGORY_STYLES[event.category] || CATEGORY_STYLES.general;
  const catLabel = CATEGORY_LABELS[event.category] || event.category;

  const isOrganiser = user && event.organiser_user_id === user.user_id;
  const isModerator = user && Array.isArray(event.moderator_ids) && event.moderator_ids.includes(user.user_id);

  const handleRsvp = async () => {
    if (!user) {
      toast.error("Sign in to RSVP to events");
      return;
    }
    setRsvping(true);
    try {
      const res = await fetch(`${API_URL}/api/events/${event.event_id}/rsvp`, {
        method: "POST",
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        onRsvp(event.event_id, data.rsvped, data.rsvp_count);
        toast.success(data.rsvped ? "You're going!" : "RSVP removed");
      } else {
        const err = await res.json();
        toast.error(parseApiError(err.detail, "Failed to RSVP"));
      }
    } catch {
      toast.error("Failed to RSVP");
    } finally {
      setRsvping(false);
    }
  };

  const icalHref = `${API_URL}/api/events/${event.event_id}/ical`;

  return (
    <article
      className="village-card village-card-hover border-l-2 border-l-primary/20 p-5 flex gap-4 cursor-pointer"
      onClick={() => onOpenDetail && onOpenDetail(event)}
    >
      {/* Date chip */}
      <div className="flex-shrink-0 w-14 h-14 rounded-xl bg-primary/15 text-primary flex flex-col items-center justify-center">
        <span className="text-xl font-bold leading-none">{dateInfo.day}</span>
        <span className="text-xs font-medium uppercase">{dateInfo.month}</span>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 mb-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${catStyle}`}>{catLabel}</span>
            {event.is_private && (
              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600">🔒 Private</span>
            )}
          </div>
        </div>

        <h3 className="font-heading font-bold text-foreground mb-1 leading-snug">{event.title}</h3>

        {(event.venue_name || event.venue_address || event.suburb) && (
          <p className="text-xs text-muted-foreground flex items-center gap-1 mb-1">
            <MapPin className="h-3 w-3 flex-shrink-0" />
            <span className="truncate">
              {event.venue_name
                ? `${event.venue_name}${event.suburb ? ` · ${event.suburb}` : ""}${event.state ? `, ${event.state}` : ""}`
                : `${event.suburb || ""}${event.state ? `, ${event.state}` : ""}`}
            </span>
          </p>
        )}

        {(event.time_start || event.time_end) && (
          <p className="text-xs text-muted-foreground flex items-center gap-1 mb-2">
            <Clock className="h-3 w-3" />
            {event.time_start}{event.time_end ? ` – ${event.time_end}` : ""}
          </p>
        )}

        {/* Organiser row */}
        <div className="flex items-center gap-2 mb-3">
          <Avatar className="h-5 w-5">
            <AvatarImage src={event.organiser_picture} />
            <AvatarFallback className="bg-primary/20 text-primary text-xs">
              {event.organiser_name?.[0]?.toUpperCase() || "?"}
            </AvatarFallback>
          </Avatar>
          <span className="text-xs text-muted-foreground">{event.organiser_name}</span>
        </div>

        {/* Actions row */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <Users className="h-3 w-3" />
            {event.rsvp_count} going
            {event.rsvp_limit ? ` / ${event.rsvp_limit}` : ""}
          </span>

          <Button
            variant={event.user_has_rsvp ? "default" : "outline"}
            size="sm"
            onClick={(e) => { e.stopPropagation(); handleRsvp(); }}
            disabled={rsvping}
            className={`rounded-xl h-7 text-xs ml-auto ${event.user_has_rsvp ? "bg-primary text-primary-foreground hover:bg-primary/90" : ""}`}
          >
            {event.user_has_rsvp ? (
              <><Check className="h-3 w-3 mr-1" /> Going</>
            ) : (
              "RSVP"
            )}
          </Button>

          <a
            href={icalHref}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors rounded-lg px-2 py-1 hover:bg-secondary/50"
            title="Add to Calendar"
          >
            <Download className="h-3 w-3" />
            <span className="hidden sm:inline">Calendar</span>
          </a>

          {(isOrganiser || isModerator) && (
            <button
              onClick={(e) => { e.stopPropagation(); setEditOpen(true); }}
              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors rounded-lg px-2 py-1 hover:bg-secondary/50"
              title="Edit event"
            >
              <Pencil className="h-3 w-3" />
              <span className="hidden sm:inline">Edit</span>
            </button>
          )}

          {isOrganiser && (
            <button
              onClick={(e) => { e.stopPropagation(); setModsOpen(true); }}
              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors rounded-lg px-2 py-1 hover:bg-secondary/50"
              title="Manage moderators"
            >
              <UserPlus className="h-3 w-3" />
              <span className="hidden sm:inline">Mods</span>
            </button>
          )}
        </div>
      </div>

      {/* Edit dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="bg-card border-border/50 max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-heading font-bold">Edit Event</DialogTitle>
          </DialogHeader>
          <EditEventDialog event={event} onUpdated={onUpdated} onClose={() => setEditOpen(false)} />
        </DialogContent>
      </Dialog>

      {/* Moderators dialog */}
      <Dialog open={modsOpen} onOpenChange={setModsOpen}>
        <DialogContent className="bg-card border-border/50 max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-heading font-bold">Event Moderators</DialogTitle>
          </DialogHeader>
          <ManageModeratorsDialog event={event} onClose={() => setModsOpen(false)} />
        </DialogContent>
      </Dialog>
    </article>
  );
}

function CreateEventForm({ onCreated, onClose }) {
  const [form, setForm] = useState({
    title: "",
    description: "",
    venue_name: "",
    venue_address: "",
    suburb: "",
    state: "",
    latitude: null,
    longitude: null,
    date: "",
    time_start: "",
    time_end: "",
    category: "general",
    rsvp_limit: "",
    is_private: false,
    invited_emails: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [venueResults, setVenueResults] = useState([]);
  const [searchingVenue, setSearchingVenue] = useState(false);
  const venueSearchTimeout = useRef(null);

  const searchVenue = (q) => {
    handleChange("venue_address", q);
    handleChange("latitude", null);
    handleChange("longitude", null);
    clearTimeout(venueSearchTimeout.current);
    if (q.length < 3) { setVenueResults([]); return; }
    venueSearchTimeout.current = setTimeout(async () => {
      setSearchingVenue(true);
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=5&addressdetails=1&countrycodes=au`,
          { headers: { "Accept-Language": "en", "User-Agent": "TheVillage/1.0" } }
        );
        if (res.ok) setVenueResults(await res.json());
      } catch {}
      finally { setSearchingVenue(false); }
    }, 400);
  };

  const selectVenue = (place) => {
    const addr = place.display_name || "";
    const parts = place.address || {};
    const suburb = parts.suburb || parts.town || parts.city || parts.village || "";
    const state = parts.state || "";
    const stateCode = AU_STATES.find(s =>
      state.toLowerCase().includes(s.toLowerCase()) ||
      state.toLowerCase().includes({ NSW:"new south wales", VIC:"victoria", QLD:"queensland", WA:"western australia", SA:"south australia", TAS:"tasmania", ACT:"australian capital territory", NT:"northern territory" }[s]?.toLowerCase())
    ) || "";
    const venueName = parts.amenity || parts.leisure || parts.building || parts.shop || "";
    setForm(prev => ({
      ...prev,
      venue_address: addr.split(", Australia")[0],
      venue_name: prev.venue_name || venueName,
      suburb: suburb,
      state: stateCode,
      latitude: parseFloat(place.lat),
      longitude: parseFloat(place.lon),
    }));
    setVenueResults([]);
  };

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.description || !form.date) {
      toast.error("Please fill in title, description, and date");
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        title: form.title,
        description: form.description,
        venue_name: form.venue_name || null,
        venue_address: form.venue_address || null,
        suburb: form.suburb || null,
        state: form.state || null,
        latitude: form.latitude || null,
        longitude: form.longitude || null,
        date: form.date,
        time_start: form.time_start || null,
        time_end: form.time_end || null,
        category: form.category,
        rsvp_limit: form.rsvp_limit ? parseInt(form.rsvp_limit, 10) : null,
        is_private: form.is_private,
        invited_notes: form.invited_emails || null,
      };
      const res = await fetch(`${API_URL}/api/events`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const newEvent = await res.json();
        toast.success("Event created!");
        onCreated(newEvent);
        onClose();
      } else {
        const err = await res.json();
        toast.error(parseApiError(err.detail, "Failed to create event"));
      }
    } catch {
      toast.error("Failed to create event");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="text-sm font-medium text-foreground block mb-1">Event title *</label>
        <input
          type="text"
          value={form.title}
          onChange={e => handleChange("title", e.target.value)}
          placeholder="e.g. Toddler Playgroup at the Park"
          className={INPUT_CLASS}
          required
        />
      </div>

      <div>
        <label className="text-sm font-medium text-foreground block mb-1">Description *</label>
        <textarea
          value={form.description}
          onChange={e => handleChange("description", e.target.value)}
          placeholder="Tell parents what to expect..."
          rows={3}
          className={`${INPUT_CLASS} resize-none`}
          required
        />
      </div>

      {/* Venue name */}
      <div>
        <label className="text-sm font-medium text-foreground block mb-1">Venue name <span className="text-muted-foreground font-normal">(optional)</span></label>
        <input
          type="text"
          value={form.venue_name}
          onChange={e => handleChange("venue_name", e.target.value)}
          placeholder="e.g. Bondi Park, Newtown Library, The Coffee Club..."
          className={INPUT_CLASS}
        />
      </div>

      {/* Venue address search */}
      <div className="relative">
        <div className="flex items-center justify-between mb-1">
          <label className="text-sm font-medium text-foreground">Address or location *</label>
          <LocationButton
            onLocation={({ suburb, postcode, state, latitude, longitude }) => {
              setForm(prev => ({
                ...prev,
                suburb,
                state,
                latitude,
                longitude,
                venue_address: prev.venue_address || `${suburb}${postcode ? " " + postcode : ""}${state ? ", " + state : ""}`,
              }));
              setVenueResults([]);
            }}
          />
        </div>
        <input
          type="text"
          value={form.venue_address}
          onChange={e => searchVenue(e.target.value)}
          placeholder="Search for a park, café, library, community centre..."
          className={INPUT_CLASS}
        />
        {searchingVenue && <p className="text-xs text-muted-foreground mt-1">Searching...</p>}
        {venueResults.length > 0 && (
          <div className="absolute top-full left-0 right-0 z-50 bg-card border border-border/50 rounded-xl shadow-lg mt-1 overflow-hidden max-h-52 overflow-y-auto">
            {venueResults.map((place, i) => (
              <button
                key={i}
                type="button"
                onClick={() => selectVenue(place)}
                className="w-full px-4 py-3 text-left hover:bg-secondary/50 border-b border-border/30 last:border-0 transition-colors"
              >
                <span className="text-xs font-medium text-foreground block leading-snug">
                  {place.display_name?.split(", Australia")[0] || place.display_name}
                </span>
                <span className="text-xs text-muted-foreground">{place.type}</span>
              </button>
            ))}
          </div>
        )}
        {form.latitude && form.longitude && (
          <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
            <MapPin className="h-3 w-3" /> Location confirmed — {form.suburb}{form.state ? `, ${form.state}` : ""}
          </p>
        )}
      </div>

      {/* State manual override */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-sm font-medium text-foreground block mb-1">Suburb</label>
          <input
            type="text"
            value={form.suburb}
            onChange={e => handleChange("suburb", e.target.value)}
            placeholder="Auto-filled from address"
            className={INPUT_CLASS}
          />
        </div>
        <div>
          <label className="text-sm font-medium text-foreground block mb-1">State</label>
          <Select value={form.state} onValueChange={v => handleChange("state", v)}>
            <SelectTrigger className="rounded-xl border-border">
              <SelectValue placeholder="State" />
            </SelectTrigger>
            <SelectContent>
              {AU_STATES.map(s => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <label className="text-sm font-medium text-foreground block mb-1">Date *</label>
        <input
          type="date"
          value={form.date}
          onChange={e => handleChange("date", e.target.value)}
          className={INPUT_CLASS}
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-sm font-medium text-foreground block mb-1">Start time</label>
          <input
            type="time"
            value={form.time_start}
            onChange={e => handleChange("time_start", e.target.value)}
            className={INPUT_CLASS}
          />
        </div>
        <div>
          <label className="text-sm font-medium text-foreground block mb-1">End time</label>
          <input
            type="time"
            value={form.time_end}
            onChange={e => handleChange("time_end", e.target.value)}
            className={INPUT_CLASS}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-sm font-medium text-foreground block mb-1">Category</label>
          <Select value={form.category} onValueChange={v => handleChange("category", v)}>
            <SelectTrigger className="rounded-xl border-border">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="general">General</SelectItem>
              <SelectItem value="playgroup">Playgroup</SelectItem>
              <SelectItem value="meetup">Meetup</SelectItem>
              <SelectItem value="workshop">Workshop</SelectItem>
              <SelectItem value="support">Support</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-sm font-medium text-foreground block mb-1">RSVP limit</label>
          <input
            type="number"
            value={form.rsvp_limit}
            onChange={e => handleChange("rsvp_limit", e.target.value)}
            placeholder="No limit"
            min="1"
            className={INPUT_CLASS}
          />
        </div>
      </div>

      {/* Private event toggle */}
      <div className="flex items-center justify-between p-3 rounded-xl border-2 transition-all border-border/50 bg-card">
        <div>
          <p className="text-sm font-medium text-foreground">Private event</p>
          <p className="text-xs text-muted-foreground">Only invited members can see and RSVP</p>
        </div>
        <button
          type="button"
          onClick={() => handleChange("is_private", !form.is_private)}
          className={`w-10 h-6 rounded-full transition-colors ${form.is_private ? "bg-primary" : "bg-muted"}`}
        >
          <span className={`block w-4 h-4 rounded-full bg-white mx-1 transition-transform ${form.is_private ? "translate-x-4" : "translate-x-0"}`} />
        </button>
      </div>

      {form.is_private && (
        <div>
          <label className="text-sm font-medium text-foreground block mb-1">
            Invite by email or username (one per line, optional — you can add after creating)
          </label>
          <textarea
            value={form.invited_emails}
            onChange={e => handleChange("invited_emails", e.target.value)}
            placeholder={"jane@example.com\ncoolgrandma_nsw"}
            rows={3}
            className={`${INPUT_CLASS} resize-none`}
          />
        </div>
      )}

      <div className="flex gap-3 pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={onClose}
          className="flex-1 rounded-xl"
          disabled={submitting}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          className="flex-1 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90"
          disabled={submitting}
        >
          {submitting ? "Creating..." : "Create Event"}
        </Button>
      </div>
      <p className="text-xs text-muted-foreground text-center pt-1">
        By creating an event you agree to our{" "}
        <a href="/community-guidelines" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-foreground">Community Guidelines</a>.
        For in-person meetups, always meet in a public place and trust your instincts.
      </p>
    </form>
  );
}

// ── Event detail modal with integrated event chat ────────────────────────────
function EventDetailModal({ event, user, onClose, onRsvp, onUpdated }) {
  const [messages, setMessages] = useState([]);
  const [newMsg, setNewMsg] = useState("");
  const [sending, setSending] = useState(false);
  const [rsvping, setRsvping] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [localEvent, setLocalEvent] = useState(event);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const dateInfo = formatEventDate(localEvent.date);
  const catStyle = CATEGORY_STYLES[localEvent.category] || CATEGORY_STYLES.general;
  const catLabel = CATEGORY_LABELS[localEvent.category] || localEvent.category;
  const isOrganiser = user && localEvent.organiser_user_id === user.user_id;
  const isModerator = user && Array.isArray(localEvent.moderator_ids) && localEvent.moderator_ids.includes(user.user_id);

  const formatMsgTime = timeAgoVerbose;

  const fetchMessages = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/events/${localEvent.event_id}/chat`, { credentials: "include" });
      if (res.ok) setMessages(await res.json());
    } catch {}
  }, [localEvent.event_id]);

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 3000);
    return () => clearInterval(interval);
  }, [fetchMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    const content = newMsg.trim();
    if (!content || sending) return;
    setSending(true);
    const tempId = `temp_${Date.now()}`;
    const optimistic = {
      msg_id: tempId, event_id: localEvent.event_id,
      author_id: user?.user_id, author_name: user?.nickname || user?.name,
      author_picture: user?.picture,
      author_subscription_tier: user?.subscription_tier || "free",
      content, created_at: new Date().toISOString(),
    };
    setMessages(prev => [...prev, optimistic]);
    setNewMsg("");
    try {
      const res = await fetch(`${API_URL}/api/events/${localEvent.event_id}/chat`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        credentials: "include", body: JSON.stringify({ content }),
      });
      if (res.ok) {
        const saved = await res.json();
        setMessages(prev => prev.map(m => m.msg_id === tempId ? saved : m));
      } else {
        setMessages(prev => prev.filter(m => m.msg_id !== tempId));
        setNewMsg(content);
        toast.error("Failed to send message");
      }
    } catch {
      setMessages(prev => prev.filter(m => m.msg_id !== tempId));
      setNewMsg(content);
    } finally { setSending(false); }
  };

  const handleRsvp = async () => {
    if (!user) { toast.error("Sign in to RSVP"); return; }
    setRsvping(true);
    try {
      const res = await fetch(`${API_URL}/api/events/${localEvent.event_id}/rsvp`, {
        method: "POST", credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        setLocalEvent(prev => ({ ...prev, user_has_rsvp: data.rsvped, rsvp_count: data.rsvp_count }));
        onRsvp(localEvent.event_id, data.rsvped, data.rsvp_count);
        toast.success(data.rsvped ? "You're going! 🎉" : "RSVP removed");
      }
    } catch { toast.error("Failed to RSVP"); }
    finally { setRsvping(false); }
  };

  return (
    <Dialog open onOpenChange={() => onClose()}>
      <DialogContent className="bg-card border-border/50 max-w-4xl w-full max-h-[92vh] p-0 overflow-hidden flex flex-col [&>button]:hidden">
        {/* Header bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/50 shrink-0">
          <div className="flex items-center gap-3">
            <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${catStyle}`}>{catLabel}</span>
            {localEvent.is_private && (
              <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-600">🔒 Private</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {(isOrganiser || isModerator) && (
              <button onClick={() => setEditOpen(true)} className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-secondary/50 transition-colors">
                <Pencil className="h-3.5 w-3.5" /> Edit
              </button>
            )}
            <button onClick={onClose} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="flex-1 flex overflow-hidden min-h-0">
          {/* ── Left: Event details ──────────────────────────────── */}
          <div className="w-full lg:w-[55%] overflow-y-auto p-6 shrink-0 border-r border-border/50">
            {/* Date + Title */}
            <div className="flex gap-4 mb-5">
              <div className="w-16 h-16 rounded-2xl bg-primary/15 text-primary flex flex-col items-center justify-center shrink-0">
                <span className="text-2xl font-bold leading-none">{dateInfo.day}</span>
                <span className="text-xs font-semibold uppercase tracking-wide">{dateInfo.month}</span>
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="font-heading font-bold text-xl text-foreground leading-snug mb-1">{localEvent.title}</h2>
                <p className="text-sm text-muted-foreground">{dateInfo.full}</p>
              </div>
            </div>

            {/* Time */}
            {(localEvent.time_start || localEvent.time_end) && (
              <div className="flex items-center gap-2 mb-3 text-sm text-foreground">
                <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
                <span>{localEvent.time_start}{localEvent.time_end ? ` – ${localEvent.time_end}` : ""}</span>
              </div>
            )}

            {/* Location */}
            {(localEvent.venue_name || localEvent.suburb) && (
              <div className="flex items-start gap-2 mb-3 text-sm text-foreground">
                <MapPin className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                <div>
                  {localEvent.venue_name && <p className="font-medium">{localEvent.venue_name}</p>}
                  {localEvent.venue_address && <p className="text-muted-foreground text-xs mt-0.5">{localEvent.venue_address}</p>}
                  {(localEvent.suburb || localEvent.state) && (
                    <p className="text-muted-foreground text-xs">{[localEvent.suburb, localEvent.state].filter(Boolean).join(", ")}</p>
                  )}
                </div>
              </div>
            )}

            {/* Organiser */}
            <div className="flex items-center gap-2 mb-4 pb-4 border-b border-border/30">
              <Avatar className="h-7 w-7">
                <AvatarImage src={localEvent.organiser_picture} />
                <AvatarFallback className="bg-primary/20 text-primary text-xs">{localEvent.organiser_name?.[0]?.toUpperCase() || "?"}</AvatarFallback>
              </Avatar>
              <span className="text-sm text-muted-foreground">Organised by <span className="text-foreground font-medium">{localEvent.organiser_name}</span></span>
            </div>

            {/* Description */}
            {localEvent.description && (
              <div className="mb-5">
                <h3 className="font-heading font-semibold text-sm text-foreground mb-2">About this event</h3>
                <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{localEvent.description}</p>
              </div>
            )}

            {/* RSVP block */}
            <div className="bg-secondary/40 rounded-2xl p-4 flex items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-1.5 text-sm font-medium text-foreground">
                  <Users className="h-4 w-4 text-primary" />
                  <span>{localEvent.rsvp_count} going</span>
                  {localEvent.rsvp_limit && <span className="text-muted-foreground font-normal">/ {localEvent.rsvp_limit} spots</span>}
                </div>
                {localEvent.rsvp_limit && localEvent.rsvp_count >= localEvent.rsvp_limit && !localEvent.user_has_rsvp && (
                  <p className="text-xs text-amber-600 mt-0.5">Event is full</p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={`${API_URL}/api/events/${localEvent.event_id}/ical`}
                  target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors border border-border/50 rounded-xl px-3 py-2 hover:bg-secondary/50"
                >
                  <Download className="h-3.5 w-3.5" /> Calendar
                </a>
                <Button
                  onClick={handleRsvp}
                  disabled={rsvping || (localEvent.rsvp_limit && localEvent.rsvp_count >= localEvent.rsvp_limit && !localEvent.user_has_rsvp)}
                  className={`rounded-xl h-9 text-sm px-5 ${localEvent.user_has_rsvp ? "bg-green-500/10 text-green-600 border border-green-500/40 hover:bg-green-500/20" : "bg-primary text-primary-foreground hover:bg-primary/90"}`}
                >
                  {localEvent.user_has_rsvp ? <><Check className="h-4 w-4 mr-1.5" /> Going</> : "RSVP"}
                </Button>
              </div>
            </div>
            {/* Safety notice for in-person events */}
            {(localEvent.venue_name || localEvent.venue_address || localEvent.suburb) && (
              <p className="text-xs text-muted-foreground mt-3 pt-3 border-t border-border/20">
                🛡️ For in-person meetups, always meet in a public place and let someone know where you're going. Stay safe.
              </p>
            )}
          </div>

          {/* ── Right: Event chat ────────────────────────────────── */}
          <div className="hidden lg:flex flex-col flex-1 min-w-0 min-h-0">
            <div className="px-4 py-3 border-b border-border/30 shrink-0">
              <h3 className="font-heading font-semibold text-sm text-foreground flex items-center gap-2">
                <MessageCircle className="h-4 w-4 text-primary" />
                Event chat
              </h3>
              <p className="text-xs text-muted-foreground">Chat with others attending this event</p>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
              {messages.length === 0 && (
                <div className="text-center py-8">
                  <span className="text-3xl block mb-2">💬</span>
                  <p className="text-sm text-muted-foreground">No messages yet. Be the first to say hi!</p>
                </div>
              )}
              {messages.map((msg, idx) => {
                const isOwn = msg.author_id === user?.user_id;
                return (
                  <div key={msg.msg_id || idx} className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
                    <div className="max-w-[80%] min-w-0">
                      {!isOwn && (
                        <p className="text-xs text-muted-foreground mb-1 ml-1 flex items-center gap-1">
                          {msg.author_name}
                          {msg.author_subscription_tier === "premium" && <Crown className="h-2.5 w-2.5 text-amber-500" />}
                        </p>
                      )}
                      <div className={`px-3 py-2 text-sm rounded-2xl shadow-sm break-words ${isOwn ? "bg-primary text-primary-foreground" : "bg-secondary/60 text-foreground"}`}>
                        {msg.content}
                      </div>
                      <p className={`text-xs text-muted-foreground mt-1 ${isOwn ? "text-right mr-1" : "ml-1"}`}>
                        {formatMsgTime(msg.created_at)}
                      </p>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Composer */}
            {user ? (
              <form onSubmit={handleSend} className="flex items-center gap-2 px-4 py-3 border-t border-border/30 shrink-0">
                <input
                  ref={inputRef}
                  value={newMsg}
                  onChange={e => setNewMsg(e.target.value.slice(0, 500))}
                  placeholder="Message the group..."
                  className="flex-1 bg-secondary/50 rounded-full px-4 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/30"
                  maxLength={500}
                  disabled={sending}
                />
                <button
                  type="submit"
                  disabled={!newMsg.trim() || sending}
                  className="w-9 h-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center disabled:opacity-50 shrink-0"
                >
                  <Send className="h-4 w-4" />
                </button>
              </form>
            ) : (
              <div className="px-4 py-3 border-t border-border/30 text-center text-xs text-muted-foreground">
                <Link to="/login" className="text-primary hover:underline">Sign in</Link> to join the conversation
              </div>
            )}
          </div>
        </div>

        {/* Mobile chat toggle (shown below detail on small screens) */}
        <div className="lg:hidden border-t border-border/50 p-4 shrink-0">
          <p className="text-xs text-muted-foreground text-center">
            <MessageCircle className="h-3.5 w-3.5 inline mr-1" />
            Event chat is available on desktop
          </p>
        </div>
      </DialogContent>

      {/* Edit dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="bg-card border-border/50 max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-heading font-bold">Edit Event</DialogTitle>
          </DialogHeader>
          <EditEventDialog event={localEvent} onUpdated={(updated) => { setLocalEvent(prev => ({ ...prev, ...updated })); onUpdated(updated); }} onClose={() => setEditOpen(false)} />
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}

export default function Events({ user }) {
  const isFree = user?.subscription_tier === "free";
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("all");
  const [stateFilter, setStateFilter] = useState("all");
  const [distanceFilter, setDistanceFilter] = useState("any");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [localMeetupsId, setLocalMeetupsId] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  // Client-side time filter (server handles category/state/distance)
  const [timeFilter, setTimeFilter] = useState("all");

  useEffect(() => {
    fetchEvents();
  }, [activeCategory, stateFilter, distanceFilter]);

  useEffect(() => {
    // Fetch the Local Meetups forum category ID so "Open Support Space" links directly to it
    fetch(`${API_URL}/api/forums/categories`, { credentials: "include" })
      .then(r => r.ok ? r.json() : [])
      .then(cats => {
        const lm = cats.find(c => c.name === "Local Meetups");
        if (lm) setLocalMeetupsId(lm.category_id);
      })
      .catch(() => {});
  }, []);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: "40" });
      if (activeCategory !== "all") params.set("category", activeCategory);
      if (stateFilter !== "all") params.set("state", stateFilter);
      if (distanceFilter !== "any") params.set("distance_km", distanceFilter);

      const res = await fetch(`${API_URL}/api/events?${params}`, { credentials: "include" });
      if (res.ok) {
        setEvents(await res.json());
      } else {
        toast.error("Failed to load events", { action: { label: "Retry", onClick: fetchEvents } });
      }
    } catch (err) {
      toast.error("Couldn't reach the server", { action: { label: "Retry", onClick: fetchEvents } });
    } finally {
      setLoading(false);
    }
  };

  const handleRsvp = (eventId, rsvped, rsvpCount) => {
    setEvents(prev =>
      prev.map(e =>
        e.event_id === eventId ? { ...e, user_has_rsvp: rsvped, rsvp_count: rsvpCount } : e
      )
    );
  };

  const handleCreated = (newEvent) => {
    newEvent.rsvp_count = 0;
    newEvent.user_has_rsvp = false;
    setEvents(prev => [newEvent, ...prev]);
  };

  const handleUpdated = (updatedEvent) => {
    setEvents(prev => prev.map(e => e.event_id === updatedEvent.event_id ? { ...e, ...updatedEvent } : e));
  };

  const TIME_FILTERS = [
    { id: "all",     label: "All upcoming" },
    { id: "today",   label: "Today" },
    { id: "week",    label: "This week" },
    { id: "month",   label: "This month" },
    { id: "going",   label: "I'm going" },
  ];

  const filteredByTime = events.filter(e => {
    if (timeFilter === "going") return e.user_has_rsvp;
    const d = e.date ? new Date(e.date) : null;
    if (!d) return false;
    const now = new Date();
    if (timeFilter === "today") return d.toDateString() === now.toDateString();
    if (timeFilter === "week") {
      const end = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      return d >= now && d <= end;
    }
    if (timeFilter === "month") {
      const end = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      return d >= now && d <= end;
    }
    return true;
  });

  if (isFree) {
    return (
      <div className="min-h-screen bg-background pb-20 lg:pl-60 lg:pb-0">
        <Navigation user={user} />
        <main className="max-w-lg mx-auto px-4 pt-24 pb-16 text-center">
          <div className="w-16 h-16 rounded-full bg-primary/15 border border-primary/30 flex items-center justify-center mx-auto mb-5">
            <Crown className="h-8 w-8 text-primary" />
          </div>
          <h1 className="font-heading text-2xl font-bold text-foreground mb-2">Events are a Village+ feature</h1>
          <p className="text-muted-foreground text-sm mb-6">
            Find local meetups, playgroups and parent events near you — upgrade to Village+ to browse and create events.
          </p>
          <Link to="/plus">
            <Button className="rounded-xl px-8">
              <Crown className="h-4 w-4 mr-2" />
              Upgrade to Village+
            </Button>
          </Link>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20 lg:pl-60 lg:pb-8">
      <Navigation user={user} />

      <main className="max-w-5xl mx-auto px-4 pt-16 lg:pt-8">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1
              className="text-2xl sm:text-3xl font-medium leading-tight mb-1"
              style={{ fontFamily: "var(--serif)", letterSpacing: "-0.025em", color: "var(--ink)" }}
            >
              {user?.suburb ? (
                <>Near <em style={{ fontStyle: "italic", color: "hsl(var(--accent))" }}>{user.suburb}.</em></>
              ) : (
                <>What's on · <em style={{ fontStyle: "italic", color: "hsl(var(--accent))" }}>near you.</em></>
              )}
            </h1>
            <p className="text-sm" style={{ color: "var(--ink-2)" }}>
              Real meetups, walks, and play dates in your local area. RSVP to see who else is going.
            </p>
          </div>

          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 flex items-center gap-2 flex-shrink-0">
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">Create Event</span>
                <span className="sm:hidden">Create</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-border/50 max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="font-heading font-bold">Create an Event</DialogTitle>
              </DialogHeader>
              <CreateEventForm onCreated={handleCreated} onClose={() => setDialogOpen(false)} />
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid lg:grid-cols-[1fr_272px] gap-8">

          {/* ── Main content ── */}
          <div className="min-w-0 space-y-5">

            {/* Forum callout */}
            <div className="p-4 rounded-[18px] bg-secondary/50 border border-border/30 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="text-xl">📍</span>
                <div>
                  <p className="text-sm font-medium text-foreground">Discuss events in Spaces</p>
                  <p className="text-xs text-muted-foreground">Share your experience or find others going</p>
                </div>
              </div>
              <Link
                to={localMeetupsId ? `/forums/${localMeetupsId}` : "/forums"}
                className="text-xs text-primary hover:underline whitespace-nowrap"
              >
                Open →
              </Link>
            </div>

            {/* Time filter chips */}
            <div className="flex items-center gap-2 flex-wrap">
              {TIME_FILTERS.map(f => (
                <button
                  key={f.id}
                  onClick={() => setTimeFilter(f.id)}
                  className={`h-8 px-4 rounded-full text-sm font-medium transition-colors ${
                    timeFilter === f.id
                      ? "bg-primary text-primary-foreground"
                      : "bg-card border border-border/50 text-muted-foreground hover:text-foreground hover:border-primary/30"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* Category + geographic filters */}
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-2 flex-wrap flex-1 min-w-0">
                {CATEGORIES.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setActiveCategory(cat.id)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                      activeCategory === cat.id
                        ? "bg-primary/15 text-primary border border-primary/30"
                        : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Select value={distanceFilter} onValueChange={setDistanceFilter}>
                  <SelectTrigger className="rounded-xl border-border h-8 text-xs min-w-[110px]">
                    <SelectValue placeholder="Distance" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">Any distance</SelectItem>
                    <SelectItem value="5">Within 5km</SelectItem>
                    <SelectItem value="10">Within 10km</SelectItem>
                    <SelectItem value="25">Within 25km</SelectItem>
                    <SelectItem value="50">Within 50km</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={stateFilter} onValueChange={setStateFilter}>
                  <SelectTrigger className="rounded-xl border-border h-8 text-xs min-w-[90px]">
                    <SelectValue placeholder="State" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All States</SelectItem>
                    {AU_STATES.map(s => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Event list */}
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="village-card p-5 animate-pulse flex gap-4">
                    <div className="w-14 h-14 rounded-xl bg-muted flex-shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="w-24 h-4 bg-muted rounded" />
                      <div className="w-3/4 h-5 bg-muted rounded" />
                      <div className="w-1/2 h-4 bg-muted rounded" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredByTime.length === 0 ? (
              <div className="text-center py-14 village-card">
                <span className="text-5xl mb-4 block">📅</span>
                <h3 className="font-heading font-bold text-lg text-foreground mb-2">
                  {timeFilter === "going" ? "No upcoming RSVPs" : "No events found"}
                </h3>
                <p className="text-sm text-muted-foreground mb-6">
                  {timeFilter === "going"
                    ? "RSVP to an event to see it here."
                    : "Be the first to organise something in your area."}
                </p>
                {timeFilter !== "going" && (
                  <Button
                    onClick={() => setDialogOpen(true)}
                    className="rounded-xl bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create Event
                  </Button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredByTime.map(event => (
                  <EventCard
                    key={event.event_id}
                    event={event}
                    onRsvp={handleRsvp}
                    onUpdated={handleUpdated}
                    user={user}
                    onOpenDetail={setSelectedEvent}
                  />
                ))}
              </div>
            )}

            <AppFooter />
          </div>

          {/* ── Sidebar ── */}
          <aside className="hidden lg:block space-y-4 self-start sticky top-8">
            {/* My RSVPs */}
            <div className="village-card p-5">
              <h3 className="font-heading font-semibold text-foreground mb-3">My RSVPs</h3>
              {events.filter(e => e.user_has_rsvp).length === 0 ? (
                <p className="text-sm text-muted-foreground italic" style={{ fontFamily: "var(--serif)" }}>
                  No RSVPs yet. Pick something for this week.
                </p>
              ) : (
                <div className="space-y-1">
                  {events.filter(e => e.user_has_rsvp).slice(0, 4).map(e => {
                    const d = e.date ? new Date(e.date) : null;
                    return (
                      <button
                        key={e.event_id}
                        onClick={() => setSelectedEvent(e)}
                        className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-secondary/50 transition-colors text-left"
                      >
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex flex-col items-center justify-center shrink-0">
                          <span className="text-sm font-bold text-primary leading-none">{d ? d.getDate() : "?"}</span>
                          <span className="text-[9px] uppercase tracking-wide text-muted-foreground">{d ? d.toLocaleString("en-AU", { month: "short" }) : ""}</span>
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{e.title}</p>
                          <p className="text-xs text-muted-foreground truncate">{e.suburb}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Hosting an event? */}
            <div className="village-card p-5">
              <h3 className="font-heading font-semibold text-foreground mb-2">Hosting an event?</h3>
              <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                Create a local event and invite parents in your area.
              </p>
              <Button
                variant="outline"
                size="sm"
                className="rounded-full w-full"
                onClick={() => setDialogOpen(true)}
              >
                <Plus className="h-3.5 w-3.5 mr-1.5" />
                Create event
              </Button>
            </div>
          </aside>

        </div>

        {selectedEvent && (
          <EventDetailModal
            event={selectedEvent}
            user={user}
            onClose={() => setSelectedEvent(null)}
            onRsvp={(id, rsvped, count) => {
              handleRsvp(id, rsvped, count);
              setSelectedEvent(prev => prev ? { ...prev, user_has_rsvp: rsvped, rsvp_count: count } : prev);
            }}
            onUpdated={(updated) => {
              handleUpdated(updated);
              setSelectedEvent(prev => prev ? { ...prev, ...updated } : prev);
            }}
          />
        )}
      </main>
    </div>
  );
}
