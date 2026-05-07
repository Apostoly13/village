/**
 * Stalls.jsx — The Village marketplace, design refresh
 * ─────────────────────────────────────────────────────
 * KEEP from frontend/src/pages/Stalls.jsx (or your existing marketplace file):
 *   - useState (listings, filters, search, category, distance, condition,
 *     savedListings, loading, page)
 *   - useEffect that loads /api/stalls/listings (with filter params)
 *   - useEffect that loads saved-listings + my-listings
 *   - handleSaveListing, handleUnsaveListing, handleContactSeller
 *   - handleCreateListing → navigate('/stalls/new') (premium-gated)
 *   - The premium-gate logic: if !user.is_premium, render <PremiumGate />
 *
 * REPLACE entire JSX:
 *   - Hero with eyebrow + serif title
 *   - Filter row: category pills + sort + map toggle
 *   - 2 / 3 / 4-col grid of <ListingCard> at sm / md / lg
 *   - Side rail: my listings + saved + safety tips
 *   - Premium gate becomes a calm card, not a flashy paywall
 *
 * NEW imports: village/* + village/icons (Stall, LocalCircle, Sparkle)
 * ─────────────────────────────────────────────────────
 */
import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Plus, Heart, MapPin, Filter, MessageCircle, Lock, Map, Grid3X3,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';

import Navigation from '../components/Navigation';
import AppFooter  from '../components/AppFooter';
import {
  Button, Pill, FilterChip, SearchBar, SectionHeading, SideCard, Avatar,
} from '../components/village';
import { Stall, LocalCircle, Sparkle } from '../components/village/icons';
import { cn } from '../lib/cn';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const CATEGORIES = [
  { id: 'all',         label: 'All' },
  { id: 'baby',        label: 'Baby gear' },
  { id: 'clothing',    label: 'Clothing' },
  { id: 'toys',        label: 'Toys & books' },
  { id: 'furniture',   label: 'Furniture' },
  { id: 'maternity',   label: 'Maternity' },
  { id: 'feeding',     label: 'Feeding' },
  { id: 'sleep',       label: 'Sleep' },
  { id: 'free',        label: 'Free' },
  { id: 'wanted',      label: 'Wanted' },
];

const CONDITIONS = [
  { id: 'all',  label: 'Any' },
  { id: 'new',  label: 'New' },
  { id: 'good', label: 'Good' },
  { id: 'fair', label: 'Used' },
];

export default function Stalls({ user }) {
  const navigate = useNavigate();

  const [listings, setListings]         = useState([]);
  const [myListings, setMyListings]     = useState([]);
  const [saved, setSaved]               = useState([]);
  const [search, setSearch]             = useState('');
  const [category, setCategory]         = useState('all');
  const [condition, setCondition]       = useState('all');
  const [sort, setSort]                 = useState('newest');
  const [view, setView]                 = useState('grid');
  const [loading, setLoading]           = useState(true);

  useEffect(() => {
    if (user?.is_premium) {
      fetchListings();
      fetchMine();
      fetchSaved();
    }
  }, [user, category, condition, sort]);

  async function fetchListings() {
    try {
      const params = new URLSearchParams({
        category: category === 'all' ? '' : category,
        condition: condition === 'all' ? '' : condition,
        sort,
        limit: '24',
      });
      const r = await fetch(`${API_URL}/api/stalls/listings?${params}`, { credentials: 'include' });
      if (r.ok) setListings(await r.json());
    } catch {} finally { setLoading(false); }
  }
  async function fetchMine() {
    try {
      const r = await fetch(`${API_URL}/api/stalls/listings/me`, { credentials: 'include' });
      if (r.ok) setMyListings(await r.json());
    } catch {}
  }
  async function fetchSaved() {
    try {
      const r = await fetch(`${API_URL}/api/stalls/listings/saved`, { credentials: 'include' });
      if (r.ok) setSaved(await r.json());
    } catch {}
  }

  async function handleSave(id, isSaved) {
    try {
      await fetch(`${API_URL}/api/stalls/listings/${id}/save`, {
        method: isSaved ? 'DELETE' : 'POST', credentials: 'include',
      });
      setListings(p => p.map(l => l.listing_id === id ? { ...l, is_saved: !isSaved } : l));
      toast.success(isSaved ? 'Removed from saved.' : 'Saved.');
    } catch {}
  }

  // ─── Premium gate ───────────────────────────────────────
  if (!user?.is_premium) {
    return <PremiumGate user={user} />;
  }

  const filtered = useMemo(() => {
    if (!search.trim()) return listings;
    const q = search.toLowerCase();
    return listings.filter(l =>
      l.title?.toLowerCase().includes(q) ||
      l.description?.toLowerCase().includes(q) ||
      l.suburb?.toLowerCase().includes(q)
    );
  }, [listings, search]);

  return (
    <div className="min-h-screen bg-paper">
      <Navigation user={user} />

      <main className="lg:pl-[240px] pt-14 lg:pt-0">
        <div className="max-w-shell mx-auto px-4 sm:px-6 lg:px-10 py-6 lg:py-10">

          {/* Hero */}
          <header className="flex items-end justify-between gap-4 mb-7">
            <div>
              <p className="font-mono text-eyebrow uppercase text-ink-faint mb-2 inline-flex items-center gap-2">
                <Stall className="h-3.5 w-3.5" /> Stalls
              </p>
              <h1 className="font-display text-section text-ink">Buy. Swap. Pass on.</h1>
              <p className="text-body text-ink-muted mt-1 max-w-[560px]">
                The village marketplace — pre-loved baby gear, clothes, and gently used everything,
                from parents in your local circle. No fees, no algorithm.
              </p>
            </div>
            <Button variant="primary" size="md" onClick={() => navigate('/stalls/new')}>
              <Plus className="h-4 w-4 mr-1" strokeWidth={1.8} />
              List something
            </Button>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-8">

            {/* LEFT — listings */}
            <div className="min-w-0 space-y-5">

              <SearchBar
                value={search} onChange={setSearch}
                placeholder="Search prams, cots, books…" hideNewPost
              />

              {/* Category pills */}
              <div className="flex items-center gap-2 overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
                {CATEGORIES.map(c => (
                  <FilterChip key={c.id} active={category === c.id} onClick={() => setCategory(c.id)}>
                    {c.label}
                  </FilterChip>
                ))}
              </div>

              {/* Secondary controls */}
              <div className="flex flex-wrap items-center gap-3 justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-eyebrow uppercase text-ink-faint">Condition</span>
                  <select
                    value={condition}
                    onChange={e => setCondition(e.target.value)}
                    className="bg-transparent text-body-sm text-ink-muted hover:text-ink border-0 cursor-pointer focus:outline-none"
                  >
                    {CONDITIONS.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                  </select>
                </div>

                <div className="flex items-center gap-3">
                  <select
                    value={sort}
                    onChange={e => setSort(e.target.value)}
                    className="bg-transparent text-body-sm text-ink-muted hover:text-ink border-0 cursor-pointer focus:outline-none"
                  >
                    <option value="newest">Newest first</option>
                    <option value="nearest">Nearest first</option>
                    <option value="price_low">Price: low to high</option>
                    <option value="price_high">Price: high to low</option>
                  </select>

                  <div className="flex items-center gap-1 rounded-full bg-card border border-line p-1">
                    <ViewToggle current={view} value="grid" icon={Grid3X3} onClick={setView} />
                    <ViewToggle current={view} value="map"  icon={Map}     onClick={setView} />
                  </div>
                </div>
              </div>

              <SectionHeading muted>{filtered.length} listings</SectionHeading>

              {loading ? <ListingsSkeleton /> :
               view === 'map' ? <MapPlaceholder /> :
               filtered.length === 0 ? (
                <Empty onReset={() => { setCategory('all'); setCondition('all'); setSearch(''); }} />
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
                  {filtered.map(l => (
                    <ListingCard
                      key={l.listing_id}
                      listing={l}
                      onSave={() => handleSave(l.listing_id, l.is_saved)}
                    />
                  ))}
                </div>
              )}

              <AppFooter />
            </div>

            {/* RIGHT — rails */}
            <aside className="space-y-4">
              <SideCard
                title="My stall"
                action={
                  myListings.length > 0
                    ? <Link to="/stalls/me" className="text-micro text-ink-faint hover:text-ink">Manage</Link>
                    : null
                }
              >
                {myListings.length === 0 ? (
                  <p className="text-body-sm text-ink-muted italic font-display leading-relaxed">
                    You haven't listed anything yet. Pre-loved gear finds new homes fast here.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {myListings.slice(0, 3).map(l => <MiniListing key={l.listing_id} listing={l} />)}
                  </div>
                )}
              </SideCard>

              <SideCard
                title="Saved"
                action={saved.length > 3 ? <Link to="/saved" className="text-micro text-ink-faint hover:text-ink">All</Link> : null}
              >
                {saved.length === 0 ? (
                  <p className="text-body-sm text-ink-muted italic font-display leading-relaxed">
                    Tap the heart on any listing to come back to it.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {saved.slice(0, 3).map(l => <MiniListing key={l.listing_id} listing={l} />)}
                  </div>
                )}
              </SideCard>

              <SideCard title="Stay safe">
                <ul className="space-y-2 text-body-sm text-ink-muted leading-relaxed">
                  <li>Meet in a public place, ideally during the day.</li>
                  <li>Use the village messages — keep things in-platform.</li>
                  <li>Check second-hand cots & car seats for current safety standards.</li>
                </ul>
                <Link to="/help/safe-meets" className="inline-block text-body-sm text-accent hover:underline mt-3">
                  Read our guide →
                </Link>
              </SideCard>
            </aside>
          </div>
        </div>
      </main>
    </div>
  );
}

// ───────────── Local components ─────────────

function ListingCard({ listing, onSave }) {
  const isFree = listing.is_free || listing.price === 0;
  const isWanted = listing.listing_type === 'wanted';
  const distance = listing.distance_km;

  return (
    <Link
      to={`/stalls/${listing.listing_id}`}
      className="group block"
    >
      {/* Image */}
      <div className="relative aspect-square bg-line-soft rounded-md overflow-hidden border border-line">
        {listing.images?.[0] ? (
          <img
            src={listing.images[0]}
            alt={listing.title}
            className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-ink-faint">
            <Stall className="h-8 w-8" />
          </div>
        )}

        {/* Top-left badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1.5">
          {isWanted   && <Pill color="neutral" size="xs">Wanted</Pill>}
          {isFree     && <Pill color="support" size="xs">Free</Pill>}
        </div>

        {/* Save button */}
        <button
          onClick={e => { e.preventDefault(); onSave(); }}
          className={cn(
            'absolute top-2 right-2 h-8 w-8 rounded-full backdrop-blur flex items-center justify-center transition-colors',
            listing.is_saved
              ? 'bg-paper/90 text-warn'
              : 'bg-paper/70 text-ink hover:bg-paper'
          )}
          aria-label={listing.is_saved ? 'Unsave' : 'Save'}
        >
          <Heart className={cn('h-3.5 w-3.5', listing.is_saved && 'fill-current')} strokeWidth={1.5} />
        </button>
      </div>

      {/* Body */}
      <div className="pt-2.5 px-0.5">
        <div className="flex items-baseline justify-between gap-2">
          <p className="text-body-sm font-medium text-ink line-clamp-1 group-hover:text-accent transition-colors">
            {listing.title}
          </p>
          {!isWanted && (
            <p className="text-body-sm text-ink shrink-0 tabular-nums">
              {isFree ? <span className="text-support">Free</span> : `$${listing.price}`}
            </p>
          )}
        </div>
        <p className="text-micro text-ink-faint mt-0.5 inline-flex items-center gap-1">
          <MapPin className="h-3 w-3" strokeWidth={1.5} />
          {listing.suburb || 'Australia'}
          {distance && <span className="text-accent">· {Math.round(distance)}km</span>}
          <span className="mx-1 text-ink-faint/60">·</span>
          {fmt(listing.created_at)}
        </p>
      </div>
    </Link>
  );
}

function MiniListing({ listing }) {
  return (
    <Link
      to={`/stalls/${listing.listing_id}`}
      className="flex items-center gap-3 p-2 rounded-md hover:bg-line-soft transition-colors"
    >
      <div className="h-12 w-12 rounded-md bg-line-soft overflow-hidden shrink-0">
        {listing.images?.[0]
          ? <img src={listing.images[0]} alt="" className="w-full h-full object-cover" />
          : <div className="w-full h-full flex items-center justify-center text-ink-faint"><Stall className="h-4 w-4" /></div>}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-body-sm text-ink truncate">{listing.title}</p>
        <p className="text-micro text-ink-faint">
          {listing.is_free ? 'Free' : `$${listing.price}`} · {listing.suburb || 'AU'}
        </p>
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

function ListingsSkeleton() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
      {[1,2,3,4,5,6].map(i => (
        <div key={i} className="animate-pulse">
          <div className="aspect-square bg-line-soft rounded-md" />
          <div className="h-3 bg-line-soft rounded w-2/3 mt-3" />
          <div className="h-2.5 bg-line-soft rounded w-1/2 mt-2" />
        </div>
      ))}
    </div>
  );
}

function Empty({ onReset }) {
  return (
    <div className="village-card px-8 py-12 text-center">
      <Stall className="h-6 w-6 text-ink-faint mx-auto mb-3" strokeWidth={1.5} />
      <p className="font-display italic text-section text-ink mb-2">Nothing matches.</p>
      <p className="text-body text-ink-muted mb-6">Try a different category or expand your reach.</p>
      <Button variant="outline" onClick={onReset}>Clear filters</Button>
    </div>
  );
}

function MapPlaceholder() {
  return (
    <div className="village-card aspect-[16/9] flex flex-col items-center justify-center text-center p-8">
      <LocalCircle className="h-8 w-8 text-ink-faint mb-3" strokeWidth={1.5} />
      <p className="font-display italic text-section text-ink mb-1">Map view</p>
      <p className="text-body-sm text-ink-muted max-w-[360px]">
        See listings near you on a map. Pickup-only items show first.
      </p>
    </div>
  );
}

function fmt(d) { try { return formatDistanceToNow(new Date(d), { addSuffix: true }); } catch { return ''; } }

// ─── Premium gate ──────────────────────────────────────
function PremiumGate({ user }) {
  return (
    <div className="min-h-screen bg-paper">
      <Navigation user={user} />
      <main className="lg:pl-[240px] pt-14 lg:pt-0">
        <div className="max-w-[640px] mx-auto px-6 py-16 lg:py-24 text-center">
          <div className="inline-flex h-14 w-14 rounded-full bg-accent-soft text-accent items-center justify-center mb-6">
            <Sparkle className="h-6 w-6" strokeWidth={1.5} />
          </div>
          <p className="font-mono text-eyebrow uppercase text-ink-faint mb-3">VILLAGE+ FEATURE</p>
          <h1 className="font-display text-section text-ink mb-4 text-wrap-pretty">
            Stalls is part of <em className="italic">Village+</em>.
          </h1>
          <p className="text-body-lg text-ink-muted leading-relaxed max-w-[480px] mx-auto mb-8">
            The marketplace, advanced search, the 3am Club, and Village Voice — $9.99/month, or your first 14 days free.
            Cancel anytime.
          </p>
          <div className="flex items-center justify-center gap-3">
            <Link to="/settings#subscription">
              <Button variant="primary" size="lg">Start free trial</Button>
            </Link>
            <Link to="/dashboard">
              <Button variant="ghost" size="lg">Maybe later</Button>
            </Link>
          </div>

          <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-3 text-left">
            <Perk icon={Stall}       title="Buy & sell"    body="Pre-loved baby gear in your local circle." />
            <Perk icon={LocalCircle} title="Local first"   body="Listings ranked by suburb and distance." />
            <Perk icon={Sparkle}     title="No fees"       body="No commissions, no boost ads — just parents." />
          </div>
        </div>
      </main>
    </div>
  );
}

function Perk({ icon: Icon, title, body }) {
  return (
    <div className="village-card p-5">
      <Icon className="h-5 w-5 text-accent mb-2" strokeWidth={1.5} />
      <p className="text-body font-medium text-ink mb-1">{title}</p>
      <p className="text-body-sm text-ink-muted leading-relaxed">{body}</p>
    </div>
  );
}
