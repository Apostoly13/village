import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import Navigation from "../components/Navigation";
import { Calendar, MapPin, Clock, Users, Plus, Download, Check, Pencil, UserPlus, X } from "lucide-react";
import { toast } from "sonner";
import AppFooter from "../components/AppFooter";

const API_URL = process.env.REACT_APP_BACKEND_URL;

const CATEGORIES = [
  { id: "all", label: "All" },
  { id: "playgroup", label: "Playgroups" },
  { id: "meetup", label: "Meetups" },
  { id: "workshop", label: "Workshops" },
  { id: "support", label: "Support" },
  { id: "general", label: "General" },
];

const AU_STATES = ["NSW", "VIC", "QLD", "WA", "SA", "TAS", "ACT", "NT"];

const CATEGORY_STYLES = {
  general: "bg-secondary text-secondary-foreground",
  playgroup: "bg-green-500/10 text-green-600",
  meetup: "bg-blue-500/10 text-blue-600",
  workshop: "bg-purple-500/10 text-purple-600",
  support: "bg-pink-500/10 text-pink-600",
};

const CATEGORY_LABELS = {
  general: "General",
  playgroup: "Playgroup",
  meetup: "Meetup",
  workshop: "Workshop",
  support: "Support",
};

const INPUT_CLASS = "w-full rounded-xl border border-border bg-card text-foreground px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 dark:[color-scheme:dark]";

function formatEventDate(dateStr) {
  try {
    const [year, month, day] = dateStr.split("-").map(Number);
    const d = new Date(year, month - 1, day);
    return {
      day: d.getDate(),
      month: d.toLocaleString("en-AU", { month: "short" }),
      full: d.toLocaleDateString("en-AU", { weekday: "long", day: "numeric", month: "long", year: "numeric" }),
    };
  } catch {
    return { day: "?", month: "???", full: dateStr };
  }
}

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

  const handleSave = async () => {
    if (!form.title.trim() || !form.date) {
      toast.error("Title and date are required");
      return;
    }
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
        toast.error(err.detail || "Failed to update event");
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
        <label className="text-sm font-medium text-foreground block mb-1">Title</label>
        <input className={INPUT_CLASS} value={form.title} onChange={e => setForm(f => ({...f, title: e.target.value}))} />
      </div>
      <div>
        <label className="text-sm font-medium text-foreground block mb-1">Description</label>
        <textarea className={INPUT_CLASS} rows={3} value={form.description} onChange={e => setForm(f => ({...f, description: e.target.value}))} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-sm font-medium text-foreground block mb-1">Date</label>
          <input type="date" className={INPUT_CLASS} value={form.date} onChange={e => setForm(f => ({...f, date: e.target.value}))} />
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

function EventCard({ event, onRsvp, onUpdated, user }) {
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
        toast.error(err.detail || "Failed to RSVP");
      }
    } catch {
      toast.error("Failed to RSVP");
    } finally {
      setRsvping(false);
    }
  };

  const icalHref = `${API_URL}/api/events/${event.event_id}/ical`;

  return (
    <article className="bg-card border border-border/40 card-elevated border-l-2 border-l-primary/20 rounded-2xl p-5 hover:border-primary/30 hover:shadow-md hover:border-l-primary/40 transition-all flex gap-4">
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
            onClick={handleRsvp}
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
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors rounded-lg px-2 py-1 hover:bg-secondary/50"
            title="Add to Calendar"
          >
            <Download className="h-3 w-3" />
            <span className="hidden sm:inline">Calendar</span>
          </a>

          {(isOrganiser || isModerator) && (
            <button
              onClick={() => setEditOpen(true)}
              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors rounded-lg px-2 py-1 hover:bg-secondary/50"
              title="Edit event"
            >
              <Pencil className="h-3 w-3" />
              <span className="hidden sm:inline">Edit</span>
            </button>
          )}

          {isOrganiser && (
            <button
              onClick={() => setModsOpen(true)}
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
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q + " Australia")}&limit=5&addressdetails=1`,
          { headers: { "Accept-Language": "en" } }
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
        toast.error(err.detail || "Failed to create event");
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
        <label className="text-sm font-medium text-foreground block mb-1">Address or location *</label>
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
    </form>
  );
}

export default function Events({ user }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("all");
  const [stateFilter, setStateFilter] = useState("all");
  const [distanceFilter, setDistanceFilter] = useState("any");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [localMeetupsId, setLocalMeetupsId] = useState(null);

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
      }
    } catch (err) {
      console.error("Error fetching events:", err);
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

  return (
    <div className="min-h-screen bg-background pb-20 lg:pb-8">
      <Navigation user={user} />

      <main className="max-w-4xl mx-auto px-4 pt-20 lg:pt-24">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="font-heading text-2xl sm:text-3xl font-bold text-foreground mb-1">
              Events near you
            </h1>
            <p className="text-sm text-muted-foreground">
              Find meetups, playgroups and local events for parents in your area.
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

        {/* Forum callout */}
        <div className="mb-6 p-4 rounded-2xl bg-secondary/50 border border-border/30 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl">📍</span>
            <div>
              <p className="text-sm font-medium text-foreground">Discuss meetups in Support Spaces</p>
              <p className="text-xs text-muted-foreground">Share your experience or find others going to the same event</p>
            </div>
          </div>
          <Link
            to={localMeetupsId ? `/forums/${localMeetupsId}` : "/forums"}
            className="text-xs text-primary hover:underline whitespace-nowrap"
          >
            Open Support Space →
          </Link>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 mb-6 flex-wrap">
          {/* Category pills */}
          <div className="flex items-center gap-2 flex-wrap">
            {CATEGORIES.map(cat => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  activeCategory === cat.id
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* State + Distance filters */}
          <div className="ml-auto flex items-center gap-2">
            <Select value={distanceFilter} onValueChange={setDistanceFilter}>
              <SelectTrigger className="rounded-xl border-border h-9 text-sm min-w-[120px]">
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
              <SelectTrigger className="rounded-xl border-border h-9 text-sm min-w-[100px]">
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

        {/* Content */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-card border border-border/50 rounded-2xl p-5 animate-pulse flex gap-4">
                <div className="w-14 h-14 rounded-xl bg-muted flex-shrink-0"></div>
                <div className="flex-1 space-y-2">
                  <div className="w-24 h-4 bg-muted rounded"></div>
                  <div className="w-3/4 h-5 bg-muted rounded"></div>
                  <div className="w-1/2 h-4 bg-muted rounded"></div>
                </div>
              </div>
            ))}
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-16 bg-card border border-border/50 rounded-2xl">
            <span className="text-5xl mb-4 block">📅</span>
            <h3 className="font-heading font-bold text-lg text-foreground mb-2">No events yet</h3>
            <p className="text-sm text-muted-foreground mb-6">
              Be the first to organise something in your area
            </p>
            <Button
              onClick={() => setDialogOpen(true)}
              className="rounded-xl bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Event
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {events.map(event => (
              <EventCard
                key={event.event_id}
                event={event}
                onRsvp={handleRsvp}
                onUpdated={handleUpdated}
                user={user}
              />
            ))}
          </div>
        )}
        <AppFooter />
      </main>
    </div>
  );
}
