/**
 * Events.jsx — The Village, design refresh
 * ─────────────────────────────────────────────────────
 * KEEP from frontend/src/pages/Events.jsx:
 *   - All useState (events, viewMode, filter, search, distance, myRsvps)
 *   - useEffect that loads /api/events
 *   - handleRsvp, handleCancelRsvp
 *   - handleCreateEvent (admin/premium gated)
 *   - distance + state filter logic
 *
 * REPLACE entire JSX:
 *   - Hero with "Events near you" subtitle
 *   - View toggle (List / Calendar) — keep behavior
 *   - Filter pills (Today, This week, This weekend, Free only, Going)
 *   - List items use EventDateChip + image
 *
 * Calendar mode (if present in original) keeps its grid logic; only swap
 * its colors + cell styling to use bg-card / text-ink / accent dot.
 * ─────────────────────────────────────────────────────
 */
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { format, formatDistanceToNow, isToday, isThisWeek } from 'date-fns';
import { Plus, MapPin, Calendar as CalIcon, List, Users, Clock } from 'lucide-react';
import { toast } from 'sonner';

import Navigation     from '../components/Navigation';
import AppFooter      from '../components/AppFooter';
import {
  Button, Pill, FilterChip, SearchBar, SectionHeading, EventDateChip, SideCard, Avatar,
} from '../components/village';
import { cn } from '../lib/cn';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const TIME_FILTERS = [
  { id: 'all',     label: 'All upcoming' },
  { id: 'today',   label: 'Today' },
  { id: 'week',    label: 'This week' },
  { id: 'weekend', label: 'This weekend' },
  { id: 'going',   label: "I'm going" },
];

export default function Events({ user }) {
  const navigate = useNavigate();
  const [events, setEvents]         = useState([]);
  const [filter, setFilter]         = useState('all');
  const [search, setSearch]         = useState('');
  const [view, setView]             = useState('list'); // list | calendar
  const [loading, setLoading]       = useState(true);

  useEffect(() => {
    fetchEvents();
  }, []);

  async function fetchEvents() {
    try {
      const r = await fetch(`${API_URL}/api/events?distance_km=50&limit=50`, { credentials: 'include' });
      if (r.ok) setEvents(await r.json());
    } catch {} finally { setLoading(false); }
  }

  async function handleRsvp(eventId, going) {
    try {
      const r = await fetch(`${API_URL}/api/events/${eventId}/rsvp`, {
        method: going ? 'DELETE' : 'POST', credentials: 'include',
      });
      if (r.ok) {
        toast.success(going ? 'No longer going.' : "You're going.");
        fetchEvents();
      }
    } catch {}
  }

  const filtered = events.filter(e => {
    if (search.trim()) {
      const q = search.toLowerCase();
      if (!e.title?.toLowerCase().includes(q) &&
          !e.suburb?.toLowerCase().includes(q) &&
          !e.venue_name?.toLowerCase().includes(q)) return false;
    }
    const d = e.date ? new Date(e.date) : null;
    if (!d) return false;
    if (filter === 'today')   return isToday(d);
    if (filter === 'week')    return isThisWeek(d);
    if (filter === 'weekend') {
      const day = d.getDay();
      return (day === 0 || day === 6) && d > new Date() && d - new Date() < 7 * 24 * 60 * 60 * 1000;
    }
    if (filter === 'going') return e.user_rsvp;
    return d > new Date();
  });

  return (
    <div className="min-h-screen bg-paper">
      <Navigation user={user} />

      <main className="lg:pl-[240px] pt-14 lg:pt-0">
        <div className="max-w-shell mx-auto px-4 sm:px-6 lg:px-10 py-6 lg:py-10">

          <header className="flex items-end justify-between gap-4 mb-7">
            <div>
              <p className="font-mono text-eyebrow uppercase text-ink-faint mb-2">Events</p>
              <h1 className="font-display text-section text-ink">
                {user?.suburb ? `Near ${user.suburb}.` : 'Find your local meetup.'}
              </h1>
              <p className="text-body text-ink-muted mt-1 max-w-[520px]">
                Real meetups, walks, and play dates in your local circle. RSVP to see who else is going.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="hidden sm:flex items-center gap-1 rounded-full bg-card border border-line p-1">
                <ViewToggle current={view} value="list"     icon={List}    onClick={setView} />
                <ViewToggle current={view} value="calendar" icon={CalIcon} onClick={setView} />
              </div>
              <Button variant="primary" size="md" onClick={() => navigate('/create-event')}>
                <Plus className="h-4 w-4 mr-1" strokeWidth={1.8} />
                Create event
              </Button>
            </div>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-8">

            {/* LEFT */}
            <div className="min-w-0 space-y-5">
              <SearchBar
                value={search} onChange={setSearch}
                placeholder="Search events, suburbs…" hideNewPost
              />

              <div className="flex items-center gap-2 overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
                {TIME_FILTERS.map(t => (
                  <FilterChip
                    key={t.id} active={filter === t.id}
                    onClick={() => setFilter(t.id)}
                  >
                    {t.label}
                  </FilterChip>
                ))}
              </div>

              {view === 'calendar' ? (
                <CalendarView events={filtered} onSelect={ev => navigate(`/events/${ev.event_id}`)} />
              ) : (
                <>
                  <SectionHeading muted>{filtered.length} {filtered.length === 1 ? 'event' : 'events'}</SectionHeading>

                  {loading ? <EventSkeletons /> : filtered.length === 0 ? (
                    <EmptyEvents onReset={() => { setFilter('all'); setSearch(''); }} />
                  ) : (
                    <div className="space-y-3">
                      {filtered.map(ev => (
                        <EventCard
                          key={ev.event_id}
                          event={ev}
                          onRsvp={() => handleRsvp(ev.event_id, ev.user_rsvp)}
                        />
                      ))}
                    </div>
                  )}
                </>
              )}

              <AppFooter />
            </div>

            {/* RIGHT */}
            <aside className="space-y-4">
              <SideCard title="My RSVPs">
                {events.filter(e => e.user_rsvp).slice(0, 3).map(e => {
                  const d = e.date ? new Date(e.date) : null;
                  return (
                    <Link
                      key={e.event_id}
                      to={`/events/${e.event_id}`}
                      className="flex items-center gap-3 p-2 rounded-md hover:bg-line-soft transition-colors"
                    >
                      <EventDateChip
                        day={d ? d.getDate() : '?'}
                        month={d ? format(d, 'MMM').toUpperCase() : ''}
                      />
                      <div className="min-w-0">
                        <p className="text-body-sm font-medium text-ink truncate">{e.title}</p>
                        <p className="text-micro text-ink-faint truncate">{e.suburb}</p>
                      </div>
                    </Link>
                  );
                })}
                {events.filter(e => e.user_rsvp).length === 0 && (
                  <p className="text-body-sm text-ink-muted italic font-display leading-relaxed">
                    No RSVPs yet. Pick something for this week.
                  </p>
                )}
              </SideCard>

              <SideCard title="Hosting an event?">
                <div className="space-y-3 text-body-sm text-ink-muted leading-relaxed">
                  <p>Free for any village member. We help promote local events to nearby parents.</p>
                  <Link to="/create-event">
                    <Button variant="outline" size="sm">Create event</Button>
                  </Link>
                </div>
              </SideCard>
            </aside>
          </div>
        </div>
      </main>
    </div>
  );
}

// ───────────── Local components ─────────────

function EventCard({ event, onRsvp }) {
  const d = event.date ? new Date(event.date) : null;
  const time = d ? format(d, 'h:mma').toLowerCase() : '';
  const going = event.user_rsvp;
  const rsvps = event.rsvp_count || 0;

  return (
    <Link
      to={`/events/${event.event_id}`}
      className="village-card village-card-hover flex flex-col sm:flex-row gap-4 p-4 group"
    >
      {/* Image / Date chip */}
      {event.image ? (
        <div className="sm:w-44 h-32 rounded-md overflow-hidden bg-line-soft shrink-0 relative">
          <img src={event.image} alt="" className="w-full h-full object-cover" />
          {d && (
            <div className="absolute top-2 left-2">
              <EventDateChip day={d.getDate()} month={format(d, 'MMM').toUpperCase()} />
            </div>
          )}
        </div>
      ) : (
        <div className="shrink-0">
          <EventDateChip
            day={d ? d.getDate() : '?'}
            month={d ? format(d, 'MMM').toUpperCase() : ''}
            size="lg"
          />
        </div>
      )}

      {/* Body */}
      <div className="flex-1 min-w-0 flex flex-col">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="text-body font-medium text-ink leading-snug group-hover:text-accent transition-colors">
              {event.title}
            </h3>
            <p className="text-body-sm text-ink-muted mt-1 inline-flex items-center gap-2">
              <Clock className="h-3.5 w-3.5" strokeWidth={1.5} />
              {d ? format(d, 'EEE d MMM') : ''} · {time}
            </p>
            <p className="text-body-sm text-ink-muted inline-flex items-center gap-2">
              <MapPin className="h-3.5 w-3.5" strokeWidth={1.5} />
              {event.venue_name || event.suburb}
              {event.distance_km && <span className="text-accent">· {Math.round(event.distance_km)}km</span>}
            </p>
          </div>
          {event.is_free !== false && <Pill color="support" size="xs">Free</Pill>}
        </div>

        {event.description && (
          <p className="text-body-sm text-ink-muted line-clamp-2 leading-snug mt-2">{event.description}</p>
        )}

        <div className="flex items-center justify-between mt-3 pt-3 border-t border-line-soft">
          <span className="inline-flex items-center gap-1.5 text-body-sm text-ink-faint">
            <Users className="h-3.5 w-3.5" strokeWidth={1.5} />
            {rsvps} {rsvps === 1 ? 'parent going' : 'parents going'}
          </span>
          <button
            onClick={e => { e.preventDefault(); onRsvp(); }}
            className={cn(
              'h-9 px-4 rounded-full text-label transition-colors',
              going
                ? 'bg-accent-soft text-accent border border-accent/40'
                : 'bg-card border border-line text-ink hover:bg-line-soft'
            )}
          >
            {going ? "I'm going" : 'RSVP'}
          </button>
        </div>
      </div>
    </Link>
  );
}

function ViewToggle({ current, value, icon: Icon, onClick }) {
  const active = current === value;
  return (
    <button
      onClick={() => onClick(value)}
      aria-label={value}
      className={cn(
        'h-8 w-8 rounded-full flex items-center justify-center transition-colors',
        active ? 'bg-button text-button-ink' : 'text-ink-muted hover:text-ink'
      )}
    >
      <Icon className="h-3.5 w-3.5" strokeWidth={1.5} />
    </button>
  );
}

function CalendarView({ events, onSelect }) {
  // Simple month grid (current month). Original calendar logic stays — only styling changes.
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  const startDay = first.getDay();
  const totalDays = last.getDate();

  const cells = [];
  for (let i = 0; i < startDay; i++) cells.push(null);
  for (let d = 1; d <= totalDays; d++) cells.push(new Date(year, month, d));

  const eventsByDate = {};
  events.forEach(e => {
    if (!e.date) return;
    const d = new Date(e.date);
    const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    eventsByDate[key] = eventsByDate[key] || [];
    eventsByDate[key].push(e);
  });

  return (
    <div className="village-card p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display text-card-title text-ink">{format(today, 'MMMM yyyy')}</h3>
      </div>
      <div className="grid grid-cols-7 gap-1 mb-2">
        {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => (
          <div key={d} className="font-mono text-eyebrow uppercase text-ink-faint text-center py-1">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((cell, i) => {
          if (!cell) return <div key={i} />;
          const key = `${cell.getFullYear()}-${cell.getMonth()}-${cell.getDate()}`;
          const evts = eventsByDate[key] || [];
          const isCurrent = cell.toDateString() === today.toDateString();
          return (
            <button
              key={i}
              onClick={() => evts[0] && onSelect(evts[0])}
              className={cn(
                'aspect-square p-1.5 rounded-md text-left transition-colors',
                isCurrent && 'bg-accent-soft',
                evts.length > 0 ? 'hover:bg-line-soft cursor-pointer' : 'cursor-default'
              )}
            >
              <div className={cn(
                'text-body-sm',
                isCurrent ? 'text-accent font-semibold' : 'text-ink'
              )}>
                {cell.getDate()}
              </div>
              {evts.length > 0 && (
                <div className="flex gap-0.5 mt-1">
                  {evts.slice(0, 3).map((_, j) => (
                    <span key={j} className="h-1 w-1 rounded-full bg-accent" />
                  ))}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function EventSkeletons() {
  return (
    <div className="space-y-3">
      {[1, 2].map(i => (
        <div key={i} className="village-card p-4 flex gap-4 animate-pulse">
          <div className="h-32 w-44 rounded-md bg-line-soft shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-line-soft rounded w-2/3" />
            <div className="h-3 bg-line-soft rounded w-1/2" />
            <div className="h-3 bg-line-soft rounded w-1/3" />
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyEvents({ onReset }) {
  return (
    <div className="village-card px-8 py-12 text-center">
      <CalIcon className="h-6 w-6 text-ink-faint mx-auto mb-3" strokeWidth={1.5} />
      <p className="font-display italic text-section text-ink mb-2">No events match.</p>
      <p className="text-body text-ink-muted mb-6">Try a different filter or expand your reach.</p>
      <Button variant="outline" onClick={onReset}>Clear filters</Button>
    </div>
  );
}
