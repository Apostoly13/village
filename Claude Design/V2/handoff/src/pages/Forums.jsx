/**
 * Forums.jsx — The Village, design refresh
 * ─────────────────────────────────────────────────────
 * KEEP from frontend/src/pages/Forums.jsx:
 *   - All useState (categories, communities, search, activeTab, sort, loading)
 *   - useEffect that loads /api/forums/categories
 *   - useEffect that loads /api/forums/posts/trending for the side rail
 *   - filteredCategories useMemo + sort logic
 *   - handleJoin / handleLeave (POST/DELETE /api/forums/categories/:id/members)
 *   - The "create community" modal trigger (navigate to /create-community)
 *
 * REPLACE: entire JSX. Layout becomes 3-zone:
 *   1. Hero — page title + sub
 *   2. Tabs — Topics / Age groups / Communities
 *   3. Two-col content: list (left) + Trending today rail (right, hidden < lg)
 *
 * NEW imports from village/*: Button, Pill, SectionHeading, SearchBar, FilterChip, SideCard
 * ─────────────────────────────────────────────────────
 */
import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Users, MessageCircle, Sparkles, ChevronRight } from 'lucide-react';

import Navigation     from '../components/Navigation';
import AppFooter      from '../components/AppFooter';
import {
  Button, Pill, SectionHeading, SearchBar, FilterChip, SideCard, Avatar,
} from '../components/village';
import { cn } from '../lib/cn';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const TABS = [
  { id: 'all',         label: 'All' },
  { id: 'topic',       label: 'Topics' },
  { id: 'age_group',   label: 'Age groups' },
  { id: 'community',   label: 'Communities' },
];

const SORT_OPTIONS = [
  { id: 'active',  label: 'Most active' },
  { id: 'newest',  label: 'Newest' },
  { id: 'biggest', label: 'Biggest' },
];

export default function Forums({ user }) {
  const navigate = useNavigate();

  const [categories, setCategories]   = useState([]);
  const [trending, setTrending]       = useState([]);
  const [activeTab, setActiveTab]     = useState('all');
  const [sort, setSort]               = useState('active');
  const [search, setSearch]           = useState('');
  const [loading, setLoading]         = useState(true);

  useEffect(() => {
    fetchCategories();
    fetchTrending();
  }, []);

  async function fetchCategories() {
    try {
      const r = await fetch(`${API_URL}/api/forums/categories`, { credentials: 'include' });
      if (r.ok) setCategories(await r.json());
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  async function fetchTrending() {
    try {
      const r = await fetch(`${API_URL}/api/forums/posts/trending?limit=4`, { credentials: 'include' });
      if (r.ok) setTrending(await r.json());
    } catch {}
  }

  const filteredCategories = useMemo(() => {
    let list = [...categories];
    if (activeTab !== 'all') list = list.filter(c => c.category_type === activeTab);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(c =>
        c.name?.toLowerCase().includes(q) ||
        c.description?.toLowerCase().includes(q)
      );
    }
    if (sort === 'newest')       list.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    else if (sort === 'biggest') list.sort((a, b) => (b.member_count || 0) - (a.member_count || 0));
    else                         list.sort((a, b) => (b.active_users || 0) - (a.active_users || 0));
    return list;
  }, [categories, activeTab, sort, search]);

  async function handleJoin(catId) {
    try {
      await fetch(`${API_URL}/api/forums/categories/${catId}/members`, {
        method: 'POST', credentials: 'include',
      });
      fetchCategories();
    } catch {}
  }

  return (
    <div className="min-h-screen bg-paper">
      <Navigation user={user} />

      <main className="lg:pl-[240px] pt-14 lg:pt-0">
        <div className="max-w-shell mx-auto px-4 sm:px-6 lg:px-10 py-6 lg:py-10">

          {/* Hero */}
          <header className="flex items-end justify-between gap-4 mb-7">
            <div>
              <p className="font-mono text-eyebrow uppercase text-ink-faint mb-2">Spaces</p>
              <h1 className="font-display text-section text-ink">Find your circle.</h1>
              <p className="text-body text-ink-muted mt-1 max-w-[520px]">
                Topic spaces for what you're going through, age-group circles for your kid's stage, and local communities for your suburb.
              </p>
            </div>
            <Button variant="primary" size="md" onClick={() => navigate('/create-community')}>
              <Plus className="h-4 w-4 mr-1" strokeWidth={1.8} />
              New community
            </Button>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-8">

            {/* LEFT — list */}
            <div className="min-w-0 space-y-5">

              <SearchBar
                value={search}
                onChange={setSearch}
                placeholder="Search spaces…"
                hideNewPost
              />

              <div className="flex items-center gap-2 overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
                {TABS.map(t => (
                  <FilterChip
                    key={t.id}
                    active={activeTab === t.id}
                    onClick={() => setActiveTab(t.id)}
                  >
                    {t.label}
                  </FilterChip>
                ))}
              </div>

              <div className="flex items-center justify-between">
                <SectionHeading muted>{filteredCategories.length} spaces</SectionHeading>
                <SortPicker value={sort} onChange={setSort} />
              </div>

              {loading ? (
                <CategorySkeleton />
              ) : filteredCategories.length === 0 ? (
                <EmptyState onReset={() => { setSearch(''); setActiveTab('all'); }} />
              ) : (
                <div className="space-y-2.5">
                  {filteredCategories.map(c => (
                    <CategoryRow
                      key={c.category_id}
                      cat={c}
                      onJoin={() => handleJoin(c.category_id)}
                    />
                  ))}
                </div>
              )}

              <AppFooter />
            </div>

            {/* RIGHT — trending */}
            <aside className="space-y-4">
              <SideCard
                title="Trending today"
                action={<Link to="/dashboard" className="text-micro text-ink-faint hover:text-ink">See feed</Link>}
              >
                {trending.length === 0 ? (
                  <p className="text-body-sm text-ink-muted italic font-display leading-relaxed">
                    Quiet around here. Check back soon.
                  </p>
                ) : (
                  <div className="space-y-1">
                    {trending.map(p => (
                      <Link
                        key={p.post_id}
                        to={`/forums/post/${p.post_id}`}
                        className="block py-2 px-1 rounded-md hover:bg-line-soft transition-colors"
                      >
                        <p className="text-body-sm text-ink line-clamp-2 leading-snug">{p.title}</p>
                        <p className="font-mono text-eyebrow uppercase text-ink-faint mt-1">
                          {p.category_name?.toUpperCase()} · {p.reply_count || 0} replies
                        </p>
                      </Link>
                    ))}
                  </div>
                )}
              </SideCard>

              <SideCard title="How spaces work">
                <div className="space-y-3 text-body-sm text-ink-muted leading-relaxed">
                  <p><strong className="text-ink">Topics</strong> — open discussions on sleep, feeding, mental health and more.</p>
                  <p><strong className="text-ink">Age groups</strong> — circles for your child's current stage.</p>
                  <p><strong className="text-ink">Communities</strong> — created by parents, public or private.</p>
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

function CategoryRow({ cat, onJoin }) {
  const isCommunity = cat.category_type === 'community';
  const memberCount = cat.member_count || 0;
  const activeUsers = cat.active_users || 0;
  const isMember = cat.is_member;

  return (
    <Link
      to={`/forums/category/${cat.category_id}`}
      className="village-card village-card-hover px-5 py-4 flex items-center gap-4 group"
    >
      {/* Icon */}
      <div className="h-12 w-12 rounded-lg bg-accent-soft flex items-center justify-center text-[22px] shrink-0">
        {cat.icon_url
          ? <img src={cat.icon_url} alt="" className="h-full w-full object-cover rounded-lg" />
          : <span>{cat.icon || '💬'}</span>}
      </div>

      {/* Body */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <h3 className="text-body font-medium text-ink truncate group-hover:text-accent transition-colors">
            {cat.name}
          </h3>
          {isCommunity && cat.is_private && <Pill color="neutral" size="xs">Private</Pill>}
          {isCommunity && !cat.is_private && <Pill color="neutral" size="xs">Community</Pill>}
        </div>
        <p className="text-body-sm text-ink-muted line-clamp-1 leading-snug">{cat.description}</p>
        <div className="flex items-center gap-3 mt-1.5 text-micro text-ink-faint">
          <span className="inline-flex items-center gap-1">
            <Users className="h-3 w-3" strokeWidth={1.5} />
            {memberCount} {memberCount === 1 ? 'member' : 'members'}
          </span>
          <span className="text-ink-faint/60">·</span>
          <span className="inline-flex items-center gap-1">
            <MessageCircle className="h-3 w-3" strokeWidth={1.5} />
            {cat.post_count || 0} posts
          </span>
          {activeUsers > 0 && (
            <>
              <span className="text-ink-faint/60">·</span>
              <span className="text-support">{activeUsers} active this week</span>
            </>
          )}
        </div>
      </div>

      {/* Action */}
      <div className="shrink-0">
        {isCommunity && !isMember ? (
          <button
            onClick={e => { e.preventDefault(); onJoin(); }}
            className="h-9 px-4 rounded-full bg-card border border-line text-label text-ink hover:bg-line-soft transition-colors"
          >
            Join
          </button>
        ) : (
          <ChevronRight className="h-5 w-5 text-ink-faint group-hover:text-ink transition-colors" strokeWidth={1.5} />
        )}
      </div>
    </Link>
  );
}

function SortPicker({ value, onChange }) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      className="bg-transparent text-body-sm text-ink-muted hover:text-ink border-0 cursor-pointer focus:outline-none focus:ring-0"
      style={{ backgroundImage: 'none' }}
    >
      {SORT_OPTIONS.map(o => (
        <option key={o.id} value={o.id}>{o.label}</option>
      ))}
    </select>
  );
}

function CategorySkeleton() {
  return (
    <div className="space-y-2.5">
      {[1, 2, 3, 4].map(i => (
        <div key={i} className="village-card px-5 py-4 flex items-center gap-4 animate-pulse">
          <div className="h-12 w-12 rounded-lg bg-line-soft shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-3.5 bg-line-soft rounded w-1/3" />
            <div className="h-3 bg-line-soft rounded w-2/3" />
            <div className="h-2.5 bg-line-soft rounded w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState({ onReset }) {
  return (
    <div className="village-card px-8 py-12 text-center">
      <Sparkles className="h-6 w-6 text-ink-faint mx-auto mb-3" strokeWidth={1.5} />
      <p className="font-display italic text-section text-ink mb-2">Nothing here yet.</p>
      <p className="text-body text-ink-muted mb-6">
        Try a different filter, or start a new community.
      </p>
      <Button variant="outline" onClick={onReset}>Clear filters</Button>
    </div>
  );
}
