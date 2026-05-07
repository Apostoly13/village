/**
 * Saved.jsx — The Village, design refresh
 * ─────────────────────────────────────────────────────
 * KEEP from frontend/src/pages/Saved.jsx:
 *   - useState (saved, filter, loading)
 *   - useEffect → /api/users/me/bookmarks
 *   - handleRemoveBookmark
 *
 * REPLACE entirely:
 *   - Tabs: All / Posts / Events / Rooms
 *   - List uses PostCard / EventDateChip variants
 * ─────────────────────────────────────────────────────
 */
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Bookmark, Heart, MessageCircle, Calendar } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';

import Navigation from '../components/Navigation';
import AppFooter  from '../components/AppFooter';
import {
  Button, FilterChip, SectionHeading, EventDateChip, Pill, Avatar,
} from '../components/village';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const TABS = [
  { id: 'all',    label: 'All' },
  { id: 'post',   label: 'Posts' },
  { id: 'event',  label: 'Events' },
  { id: 'room',   label: 'Rooms' },
];

export default function Saved({ user }) {
  const [items, setItems]     = useState([]);
  const [tab, setTab]         = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchSaved(); }, []);

  async function fetchSaved() {
    try {
      const r = await fetch(`${API_URL}/api/users/me/bookmarks`, { credentials: 'include' });
      if (r.ok) setItems(await r.json());
    } catch {} finally { setLoading(false); }
  }

  async function handleRemove(id, kind) {
    try {
      await fetch(`${API_URL}/api/${kind}s/${id}/bookmark`, { method: 'DELETE', credentials: 'include' });
      setItems(p => p.filter(x => !(x.item_id === id && x.kind === kind)));
    } catch {}
  }

  const filtered = tab === 'all' ? items : items.filter(i => i.kind === tab);

  return (
    <div className="min-h-screen bg-paper">
      <Navigation user={user} />

      <main className="lg:pl-[240px] pt-14 lg:pt-0">
        <div className="max-w-shell mx-auto px-4 sm:px-6 lg:px-10 py-6 lg:py-10">

          <header className="mb-7">
            <p className="font-mono text-eyebrow uppercase text-ink-faint mb-2">Saved</p>
            <h1 className="font-display text-section text-ink">Things you wanted to come back to.</h1>
            <p className="text-body text-ink-muted mt-1 max-w-[520px]">
              Posts, events, and rooms you bookmarked. Tap the bookmark to remove.
            </p>
          </header>

          <div className="space-y-5">
            <div className="flex items-center gap-2">
              {TABS.map(t => (
                <FilterChip key={t.id} active={tab === t.id} onClick={() => setTab(t.id)}>
                  {t.label}
                </FilterChip>
              ))}
            </div>

            {loading ? <Skel /> : filtered.length === 0 ? (
              <div className="village-card px-8 py-12 text-center">
                <Bookmark className="h-6 w-6 text-ink-faint mx-auto mb-3" strokeWidth={1.5} />
                <p className="font-display italic text-section text-ink mb-2">Nothing saved yet.</p>
                <p className="text-body text-ink-muted">Bookmark posts, events, and rooms to find them again here.</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {filtered.map(item => (
                  <SavedItem
                    key={`${item.kind}-${item.item_id}`}
                    item={item}
                    onRemove={() => handleRemove(item.item_id, item.kind)}
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

function SavedItem({ item, onRemove }) {
  if (item.kind === 'event') {
    const d = item.date ? new Date(item.date) : null;
    return (
      <Link to={`/events/${item.item_id}`} className="village-card village-card-hover p-4 flex items-center gap-4 group">
        <EventDateChip
          day={d ? d.getDate() : '?'}
          month={d ? format(d, 'MMM').toUpperCase() : ''}
        />
        <div className="flex-1 min-w-0">
          <h3 className="text-body font-medium text-ink truncate group-hover:text-accent transition-colors">
            {item.title}
          </h3>
          <p className="text-body-sm text-ink-muted truncate">
            {d && format(d, 'EEE d MMM, h:mma').toLowerCase()} · {item.suburb}
          </p>
        </div>
        <BookmarkBtn onClick={onRemove} />
      </Link>
    );
  }

  if (item.kind === 'room') {
    return (
      <Link to={`/chat/${item.item_id}`} className="village-card village-card-hover px-5 py-4 flex items-center gap-4 group">
        <div className="h-11 w-11 rounded-lg bg-accent-soft flex items-center justify-center text-[20px] shrink-0">
          {item.icon || '💬'}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-body font-medium text-ink truncate group-hover:text-accent transition-colors">{item.title}</h3>
          <p className="text-body-sm text-ink-muted truncate">{item.description}</p>
        </div>
        <BookmarkBtn onClick={onRemove} />
      </Link>
    );
  }

  // Post
  return (
    <Link to={`/forums/post/${item.item_id}`} className="village-card village-card-hover px-5 py-4 block group">
      <div className="flex items-start justify-between gap-3 mb-1.5">
        <p className="font-mono text-eyebrow uppercase text-ink-faint">
          {item.category_name || 'POST'} · {fmt(item.created_at)}
        </p>
        <BookmarkBtn onClick={(e) => { e.preventDefault(); onRemove(); }} />
      </div>
      <h3 className="text-body font-medium text-ink leading-snug group-hover:text-accent transition-colors mb-1">
        {item.title}
      </h3>
      {item.preview && <p className="text-body-sm text-ink-muted line-clamp-2">{item.preview}</p>}
      <div className="flex items-center gap-3 mt-2 text-micro text-ink-faint">
        <span className="inline-flex items-center gap-1"><Heart className="h-3 w-3" strokeWidth={1.5} /> {item.like_count || 0}</span>
        <span>·</span>
        <span className="inline-flex items-center gap-1"><MessageCircle className="h-3 w-3" strokeWidth={1.5} /> {item.reply_count || 0}</span>
        {item.author_name && <><span>·</span><span>{item.author_name}</span></>}
      </div>
    </Link>
  );
}

function BookmarkBtn({ onClick }) {
  return (
    <button
      onClick={onClick}
      className="h-8 w-8 rounded-full text-accent hover:bg-accent-soft transition-colors flex items-center justify-center shrink-0"
      aria-label="Remove bookmark"
    >
      <Bookmark className="h-4 w-4 fill-current" strokeWidth={1.5} />
    </button>
  );
}

function Skel() {
  return (
    <div className="space-y-2.5">
      {[1, 2, 3].map(i => (
        <div key={i} className="village-card px-5 py-4 animate-pulse">
          <div className="h-2.5 bg-line-soft rounded w-32 mb-3" />
          <div className="h-4 bg-line-soft rounded w-2/3 mb-2" />
          <div className="h-3 bg-line-soft rounded w-full" />
        </div>
      ))}
    </div>
  );
}

function fmt(d) { try { return formatDistanceToNow(new Date(d), { addSuffix: true }).toUpperCase(); } catch { return ''; } }
