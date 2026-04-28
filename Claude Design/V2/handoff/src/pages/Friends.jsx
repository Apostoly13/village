/**
 * Friends.jsx — The Village, design refresh
 * ─────────────────────────────────────────────────────
 * KEEP from frontend/src/pages/Friends.jsx:
 *   - useState (friends, requests, suggested, search, tab)
 *   - useEffect → /api/friends, /api/friends/requests, /api/users/suggested
 *   - handleAccept, handleDecline, handleAdd, handleRemove
 *
 * REPLACE entirely:
 *   - Tabs: Friends / Requests / Suggested
 *   - Cards: avatar, name, suburb/stage, primary action
 * ─────────────────────────────────────────────────────
 */
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserPlus, MessageCircle, X, Users, Check } from 'lucide-react';
import { toast } from 'sonner';

import Navigation from '../components/Navigation';
import AppFooter  from '../components/AppFooter';
import {
  Button, Avatar, FilterChip, SearchBar, SectionHeading, Pill,
} from '../components/village';
import { cn } from '../lib/cn';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const TABS = [
  { id: 'friends',   label: 'Friends' },
  { id: 'requests',  label: 'Requests' },
  { id: 'suggested', label: 'Suggested' },
];

export default function Friends({ user }) {
  const navigate = useNavigate();
  const [friends, setFriends]     = useState([]);
  const [requests, setRequests]   = useState([]);
  const [suggested, setSuggested] = useState([]);
  const [tab, setTab]             = useState('friends');
  const [search, setSearch]       = useState('');
  const [loading, setLoading]     = useState(true);

  useEffect(() => { fetchAll(); }, []);

  async function fetchAll() {
    setLoading(true);
    try {
      const [fr, rq, sg] = await Promise.all([
        fetch(`${API_URL}/api/friends`, { credentials: 'include' }),
        fetch(`${API_URL}/api/friends/requests`, { credentials: 'include' }),
        fetch(`${API_URL}/api/users/suggested?limit=12`, { credentials: 'include' }),
      ]);
      if (fr.ok) setFriends(await fr.json());
      if (rq.ok) setRequests(await rq.json());
      if (sg.ok) setSuggested(await sg.json());
    } catch {} finally { setLoading(false); }
  }

  async function handleAccept(userId) {
    try {
      await fetch(`${API_URL}/api/friends/${userId}/accept`, { method: 'POST', credentials: 'include' });
      toast.success("You're connected.");
      fetchAll();
    } catch {}
  }
  async function handleDecline(userId) {
    try {
      await fetch(`${API_URL}/api/friends/${userId}`, { method: 'DELETE', credentials: 'include' });
      fetchAll();
    } catch {}
  }
  async function handleAdd(userId) {
    try {
      await fetch(`${API_URL}/api/friends/${userId}`, { method: 'POST', credentials: 'include' });
      toast.success('Request sent.');
      fetchAll();
    } catch {}
  }

  const list = tab === 'friends' ? friends : tab === 'requests' ? requests : suggested;
  const filtered = list.filter(p =>
    !search.trim() || p.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-paper">
      <Navigation user={user} />

      <main className="lg:pl-[240px] pt-14 lg:pt-0">
        <div className="max-w-shell mx-auto px-4 sm:px-6 lg:px-10 py-6 lg:py-10">

          <header className="mb-7">
            <p className="font-mono text-eyebrow uppercase text-ink-faint mb-2">Friends</p>
            <h1 className="font-display text-section text-ink">Your circle.</h1>
            <p className="text-body text-ink-muted mt-1 max-w-[520px]">
              Friends see your posts first, can DM you, and join your friends-only chat rooms.
            </p>
          </header>

          <div className="space-y-5">
            <SearchBar value={search} onChange={setSearch} placeholder="Search by name…" hideNewPost />

            <div className="flex items-center gap-2">
              {TABS.map(t => (
                <FilterChip key={t.id} active={tab === t.id} onClick={() => setTab(t.id)}>
                  {t.label}
                  {t.id === 'friends'   && ` · ${friends.length}`}
                  {t.id === 'requests'  && requests.length > 0 && ` · ${requests.length}`}
                </FilterChip>
              ))}
            </div>

            {loading ? <ListSkeletons /> : filtered.length === 0 ? (
              <Empty tab={tab} />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {filtered.map(p => (
                  <PersonCard
                    key={p.user_id}
                    person={p}
                    tab={tab}
                    onAccept={() => handleAccept(p.user_id)}
                    onDecline={() => handleDecline(p.user_id)}
                    onAdd={() => handleAdd(p.user_id)}
                    onMessage={() => navigate(`/messages/${p.user_id}`)}
                  />
                ))}
              </div>
            )}

            <AppFooter />
          </div>
        </div>
      </main>
    </div>
  );
}

function PersonCard({ person, tab, onAccept, onDecline, onAdd, onMessage }) {
  return (
    <div className="village-card p-4 flex items-start gap-3">
      <Link to={`/profile/${person.user_id}`}>
        <Avatar name={person.name} src={person.picture} size="lg" />
      </Link>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <Link to={`/profile/${person.user_id}`} className="text-body font-medium text-ink hover:text-accent truncate">
            {person.name}
          </Link>
          {person.is_premium && <Pill color="accent" size="xs">+</Pill>}
        </div>
        <p className="text-body-sm text-ink-muted truncate">
          {person.suburb || person.parenting_stage || 'Australia'}
        </p>
        {person.mutual_count > 0 && (
          <p className="text-micro text-ink-faint mt-0.5">
            {person.mutual_count} mutual {person.mutual_count === 1 ? 'friend' : 'friends'}
          </p>
        )}

        <div className="flex items-center gap-2 mt-3">
          {tab === 'friends' && (
            <>
              <Button variant="outline" size="sm" onClick={onMessage}>
                <MessageCircle className="h-3.5 w-3.5 mr-1" strokeWidth={1.5} />
                Message
              </Button>
            </>
          )}
          {tab === 'requests' && (
            <>
              <Button variant="primary" size="sm" onClick={onAccept}>
                <Check className="h-3.5 w-3.5 mr-1" strokeWidth={1.8} />
                Accept
              </Button>
              <Button variant="ghost" size="sm" onClick={onDecline}>
                Decline
              </Button>
            </>
          )}
          {tab === 'suggested' && (
            <Button variant="outline" size="sm" onClick={onAdd}>
              <UserPlus className="h-3.5 w-3.5 mr-1" strokeWidth={1.5} />
              Add friend
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function Empty({ tab }) {
  const copy = {
    friends:   { t: 'No friends yet.',           s: 'Connect from chat rooms, comments, or events.' },
    requests:  { t: 'No pending requests.',      s: 'Requests will appear here when someone wants to connect.' },
    suggested: { t: 'No suggestions right now.', s: 'Update your interests and suburb to find more parents.' },
  }[tab];
  return (
    <div className="village-card px-8 py-12 text-center">
      <Users className="h-6 w-6 text-ink-faint mx-auto mb-3" strokeWidth={1.5} />
      <p className="font-display italic text-section text-ink mb-2">{copy.t}</p>
      <p className="text-body text-ink-muted">{copy.s}</p>
    </div>
  );
}

function ListSkeletons() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {[1, 2, 3, 4].map(i => (
        <div key={i} className="village-card p-4 flex items-start gap-3 animate-pulse">
          <div className="h-12 w-12 rounded-full bg-line-soft" />
          <div className="flex-1 space-y-2">
            <div className="h-3.5 bg-line-soft rounded w-1/2" />
            <div className="h-3 bg-line-soft rounded w-2/3" />
            <div className="h-7 bg-line-soft rounded-full w-24 mt-2" />
          </div>
        </div>
      ))}
    </div>
  );
}
