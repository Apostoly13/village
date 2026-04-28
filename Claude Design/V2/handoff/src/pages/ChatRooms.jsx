/**
 * ChatRooms.jsx — The Village, design refresh
 * ─────────────────────────────────────────────────────
 * KEEP from frontend/src/pages/ChatRooms.jsx:
 *   - All useState (rooms, mySuburb, friendsRooms, loading, search, activeFilter)
 *   - useEffect that loads /api/chat/rooms
 *   - handleCreateSuburb / handleCreateFriendsRoom
 *   - handleJoinRoom navigation
 *   - Polling for active_users counts
 *
 * REPLACE entire JSX:
 *   - Three sections: Live now (top), All Australia, Local circles, Friends-only
 *   - Each row uses RoomRow with online dot + active count
 * ─────────────────────────────────────────────────────
 */
import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Plus, Search, MapPin, Users, Lock } from 'lucide-react';
import { toast } from 'sonner';

import Navigation     from '../components/Navigation';
import AppFooter      from '../components/AppFooter';
import {
  Button, Pill, SectionHeading, SearchBar, FilterChip, SideCard, LiveDot, Avatar,
} from '../components/village';
import { cn } from '../lib/cn';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const FILTERS = [
  { id: 'all',     label: 'All' },
  { id: 'live',    label: 'Live now' },
  { id: 'local',   label: 'Local' },
  { id: 'friends', label: 'Friends only' },
];

export default function ChatRooms({ user }) {
  const navigate = useNavigate();
  const [rooms, setRooms]     = useState({ all_australia_rooms: [], nearby_rooms: [], friends_rooms: [], my_suburb_room: null });
  const [search, setSearch]   = useState('');
  const [filter, setFilter]   = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRooms();
    const id = setInterval(fetchRooms, 30000);
    return () => clearInterval(id);
  }, []);

  async function fetchRooms() {
    try {
      const r = await fetch(`${API_URL}/api/chat/rooms`, { credentials: 'include' });
      if (r.ok) setRooms(await r.json());
    } catch {} finally { setLoading(false); }
  }

  async function handleCreateSuburb() {
    if (!user?.suburb || !user?.postcode) {
      toast.error('Add your suburb in your profile first.');
      return;
    }
    try {
      const r = await fetch(`${API_URL}/api/chat/rooms/suburb`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ postcode: user.postcode, suburb: user.suburb }),
      });
      if (r.ok) {
        const data = await r.json();
        navigate(`/chat/${data.room_id}`);
      } else {
        toast.error('Could not open your local circle.');
      }
    } catch {}
  }

  const filterRooms = (list) => {
    let out = [...list];
    if (search.trim()) {
      const q = search.toLowerCase();
      out = out.filter(r =>
        r.name?.toLowerCase().includes(q) ||
        r.description?.toLowerCase().includes(q) ||
        r.suburb?.toLowerCase().includes(q)
      );
    }
    return out;
  };

  const liveRooms = [
    ...filterRooms(rooms.all_australia_rooms || []),
    ...filterRooms(rooms.nearby_rooms || []),
  ].filter(r => (r.active_users || 0) > 0).sort((a, b) => (b.active_users || 0) - (a.active_users || 0));

  return (
    <div className="min-h-screen bg-paper">
      <Navigation user={user} />

      <main className="lg:pl-[240px] pt-14 lg:pt-0">
        <div className="max-w-shell mx-auto px-4 sm:px-6 lg:px-10 py-6 lg:py-10">

          {/* Hero */}
          <header className="flex items-end justify-between gap-4 mb-7">
            <div>
              <p className="font-mono text-eyebrow uppercase text-ink-faint mb-2">Chat circles</p>
              <h1 className="font-display text-section text-ink">Drop in. Chat live.</h1>
              <p className="text-body text-ink-muted mt-1 max-w-[520px]">
                Real-time circles for parents who need company right now. National rooms, your local circle, friends-only.
              </p>
            </div>
            <div className="hidden sm:flex items-center gap-2">
              {!rooms.my_suburb_room && user?.suburb && (
                <Button variant="outline" size="md" onClick={handleCreateSuburb}>
                  <MapPin className="h-4 w-4 mr-1" strokeWidth={1.5} />
                  My local circle
                </Button>
              )}
            </div>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-8">

            {/* LEFT */}
            <div className="min-w-0 space-y-6">

              <SearchBar
                value={search} onChange={setSearch}
                placeholder="Search rooms, suburbs…" hideNewPost
              />

              <div className="flex items-center gap-2">
                {FILTERS.map(f => (
                  <FilterChip
                    key={f.id} active={filter === f.id}
                    onClick={() => setFilter(f.id)}
                  >
                    {f.label === 'Live now' && <span className="mr-1.5"><LiveDot /></span>}
                    {f.label}
                  </FilterChip>
                ))}
              </div>

              {/* Live now */}
              {(filter === 'all' || filter === 'live') && liveRooms.length > 0 && (
                <section>
                  <SectionHeading>
                    <span className="inline-flex items-center gap-2"><LiveDot /> Live now</span>
                  </SectionHeading>
                  <div className="space-y-2 mt-3">
                    {liveRooms.slice(0, 5).map(r => (
                      <RoomCard key={r.room_id} room={r} live />
                    ))}
                  </div>
                </section>
              )}

              {/* All Australia */}
              {(filter === 'all') && (
                <section>
                  <SectionHeading>All Australia</SectionHeading>
                  <p className="text-body-sm text-ink-muted mt-1 mb-3">Open to every parent on the platform.</p>
                  <div className="space-y-2">
                    {loading ? <RoomSkeletons /> : filterRooms(rooms.all_australia_rooms || []).map(r => (
                      <RoomCard key={r.room_id} room={r} />
                    ))}
                  </div>
                </section>
              )}

              {/* Local */}
              {(filter === 'all' || filter === 'local') && (
                <section>
                  <SectionHeading>Local circles</SectionHeading>
                  <p className="text-body-sm text-ink-muted mt-1 mb-3">
                    Quieter rooms by suburb. Yours is private by default.
                  </p>
                  {rooms.my_suburb_room ? (
                    <div className="space-y-2">
                      <RoomCard room={rooms.my_suburb_room} mySuburb />
                      {filterRooms(rooms.nearby_rooms || []).slice(0, 6).map(r => (
                        <RoomCard key={r.room_id} room={r} />
                      ))}
                    </div>
                  ) : (
                    <div className="village-card px-6 py-8 text-center">
                      <MapPin className="h-5 w-5 text-ink-faint mx-auto mb-2" strokeWidth={1.5} />
                      <p className="font-display italic text-ink mb-1">Open your local circle.</p>
                      <p className="text-body-sm text-ink-muted mb-4">
                        {user?.suburb ? `For parents in ${user.suburb}` : 'Add your suburb to your profile to start one.'}
                      </p>
                      {user?.suburb ? (
                        <Button variant="primary" size="sm" onClick={handleCreateSuburb}>Open my local circle</Button>
                      ) : (
                        <Link to="/profile"><Button variant="outline" size="sm">Add my suburb</Button></Link>
                      )}
                    </div>
                  )}
                </section>
              )}

              {/* Friends only */}
              {(filter === 'all' || filter === 'friends') && (
                <section>
                  <SectionHeading>Friends only</SectionHeading>
                  <p className="text-body-sm text-ink-muted mt-1 mb-3">Private rooms with parents you've added.</p>
                  {(rooms.friends_rooms || []).length > 0 ? (
                    <div className="space-y-2">
                      {filterRooms(rooms.friends_rooms || []).map(r => (
                        <RoomCard key={r.room_id} room={r} privateRoom />
                      ))}
                    </div>
                  ) : (
                    <div className="village-card px-6 py-8 text-center">
                      <Lock className="h-5 w-5 text-ink-faint mx-auto mb-2" strokeWidth={1.5} />
                      <p className="font-display italic text-ink mb-1">No friends-only rooms yet.</p>
                      <p className="text-body-sm text-ink-muted mb-4">
                        Add a friend, then start a private chat.
                      </p>
                      <Link to="/friends"><Button variant="outline" size="sm">Find friends</Button></Link>
                    </div>
                  )}
                </section>
              )}

              <AppFooter />
            </div>

            {/* RIGHT */}
            <aside className="space-y-4">
              <SideCard title="How chat works">
                <div className="space-y-3 text-body-sm text-ink-muted leading-relaxed">
                  <p><strong className="text-ink">National rooms</strong> are always open — busiest at night.</p>
                  <p><strong className="text-ink">Local circles</strong> stay quiet — under 50 people, your suburb only.</p>
                  <p><strong className="text-ink">Friends-only</strong> rooms are invite-only and don't appear in search.</p>
                </div>
              </SideCard>

              <SideCard title="Quiet hours">
                <div className="text-body-sm text-ink-muted leading-relaxed space-y-2">
                  <p>Our 3am Club is busiest from 10pm–4am AEDT.</p>
                  <p>Mute notifications by suburb in <Link to="/settings" className="text-accent hover:underline">Settings</Link>.</p>
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

function RoomCard({ room, live, mySuburb, privateRoom }) {
  const active = room.active_users || 0;
  const members = room.member_count || 0;

  return (
    <Link
      to={`/chat/${room.room_id}`}
      className="village-card village-card-hover px-5 py-4 flex items-center gap-4 group"
    >
      <div className="h-11 w-11 rounded-lg bg-accent-soft flex items-center justify-center text-[20px] shrink-0">
        <span>{room.icon || '💬'}</span>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <h3 className="text-body font-medium text-ink truncate group-hover:text-accent transition-colors">
            {room.name}
          </h3>
          {mySuburb && <Pill color="support" size="xs">Your circle</Pill>}
          {privateRoom && <Pill color="neutral" size="xs">Private</Pill>}
        </div>
        {room.description && (
          <p className="text-body-sm text-ink-muted line-clamp-1">{room.description}</p>
        )}
        <div className="flex items-center gap-3 mt-1.5 text-micro text-ink-faint">
          {active > 0 ? (
            <span className="inline-flex items-center gap-1.5 text-support">
              <LiveDot /> {active} online now
            </span>
          ) : (
            <span className="inline-flex items-center gap-1">
              <Users className="h-3 w-3" strokeWidth={1.5} /> {members} member{members === 1 ? '' : 's'}
            </span>
          )}
          {room.suburb && (
            <>
              <span className="text-ink-faint/60">·</span>
              <span>{room.suburb}{room.state ? `, ${room.state}` : ''}</span>
            </>
          )}
        </div>
      </div>

      <Button variant={live ? 'primary' : 'outline'} size="sm">
        {live ? 'Drop in' : 'Open'}
      </Button>
    </Link>
  );
}

function RoomSkeletons() {
  return (
    <>
      {[1, 2, 3].map(i => (
        <div key={i} className="village-card px-5 py-4 flex items-center gap-4 animate-pulse">
          <div className="h-11 w-11 rounded-lg bg-line-soft shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-3.5 bg-line-soft rounded w-1/3" />
            <div className="h-3 bg-line-soft rounded w-2/3" />
          </div>
        </div>
      ))}
    </>
  );
}
