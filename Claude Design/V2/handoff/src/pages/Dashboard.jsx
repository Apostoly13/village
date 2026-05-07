/**
 * Dashboard.jsx — The Village, design refresh
 * ─────────────────────────────────────────────────────
 * KEEP from old file (copy these verbatim from frontend/src/pages/Dashboard.jsx):
 *   - All useState/useEffect/useMemo hooks
 *   - fetchFeed, fetchNearbyEvents, fetchTodaysPosts, fetchSubscription,
 *     fetchBusyChatRooms, fetchUserCommunities, fetchRecentActivity,
 *     markNotificationRead, handleOnboardingComplete, handleSearch, handleLikePost
 *   - heroContent useMemo (for the greeting subtitle)
 *   - filteredPosts useMemo (feed filter logic)
 *   - getTopBadge helper
 *   - QuickThreadView + QuickReplyBox sub-components (unchanged)
 *   - The OnboardingModal render
 *
 * REPLACE:
 *   - The JSX return, classNames, sub-structure
 *
 * ADD new imports from ./components/village (see below)
 * ─────────────────────────────────────────────────────
 */

import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { MapPin, Crown } from 'lucide-react';

import Navigation       from '../components/Navigation';
import AppFooter        from '../components/AppFooter';
import OnboardingModal  from '../components/OnboardingModal';
import RecommendedSpaces from '../components/RecommendedSpaces';

import {
  TrialBanner, GreetingBlock, ModeTabs, SearchBar,
  FilterChip, PostCard, SideCard, RoomRow, EventDateChip,
  SectionHeading, Button, Avatar,
} from '../components/village';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const FEED_FILTERS = [
  { id: 'latest',   label: 'Latest' },
  { id: 'nearby',   label: 'Nearby' },
  { id: 'unread',   label: 'Unread' },
  { id: 'trending', label: 'Trending' },
  { id: 'support',  label: 'Support needed' },
];

function fmtRelative(dateStr) {
  try { return formatDistanceToNow(new Date(dateStr), { addSuffix: true }).toUpperCase(); }
  catch { return ''; }
}

function typeEmoji(type) {
  return ({ reply: '💬', like: '❤️', friend_request: '👋', friend_accept: '✅', moderation: '🛡️' })[type] || '🔔';
}

export default function Dashboard({ user }) {
  const navigate = useNavigate();

  // ──────── STATE (unchanged from original) ────────
  const [posts, setPosts]               = useState([]);
  const [loading, setLoading]           = useState(true);
  const [feedFilter, setFeedFilter]     = useState('latest');
  const [searchQuery, setSearchQuery]   = useState('');
  const [nearbyEvents, setNearbyEvents] = useState([]);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [todaysPosts, setTodaysPosts]   = useState([]);
  const [visibleCount, setVisibleCount] = useState(8);
  const [subscription, setSubscription] = useState(null);
  const [selectedPost, setSelectedPost] = useState(null);
  const [postLikes, setPostLikes]       = useState({});
  const [busyChatRooms, setBusyChatRooms] = useState([]);
  const [namedRooms, setNamedRooms]     = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [userCommunities, setUserCommunities] = useState([]);
  const [mode, setMode]                 = useState('browse');

  // ──────── DERIVED STATE (unchanged logic) ────────
  const filteredPosts = useMemo(() => {
    switch (feedFilter) {
      case 'trending':
        return [...posts].sort((a, b) =>
          ((b.like_count || 0) * 2 + (b.reply_count || 0)) -
          ((a.like_count || 0) * 2 + (a.reply_count || 0)));
      case 'nearby':
        return posts.filter(p => user?.suburb && (p.suburb === user.suburb || p.state === user.state));
      case 'support':
        return posts.filter(p =>
          p.needs_support ||
          p.category_name?.toLowerCase().includes('support') ||
          p.category_name?.toLowerCase().includes('wellbeing'));
      case 'unread':
        return posts.filter(p => !p.viewed);
      default:
        return posts;
    }
  }, [posts, feedFilter, user]);

  const heroSubtitle = useMemo(() => {
    const suburb = user?.suburb || 'you';
    const parts = [];
    if (busyChatRooms.length) parts.push(`${busyChatRooms.length} ${busyChatRooms.length === 1 ? 'circle is' : 'circles are'} active right now`);
    if (nearbyEvents.length)  parts.push(`${nearbyEvents.length} ${nearbyEvents.length === 1 ? 'event' : 'events'} near ${suburb}`);
    if (parts.length === 0) return "Your village is here whenever you need it.";
    return parts.join(' and ') + ' — good time to join.';
  }, [busyChatRooms, nearbyEvents, user]);

  const getTopBadge = (post) => {
    const needsSupport = post.needs_support ||
      post.category_name?.toLowerCase().includes('support') ||
      post.category_name?.toLowerCase().includes('wellbeing');
    const isNearby = user?.suburb && post.suburb === user.suburb;
    const isActive = (post.reply_count || 0) >= 8;
    if (needsSupport) return { label: 'Needs support', color: 'warn' };
    if (isNearby)     return { label: 'Near you',      color: 'support' };
    if (isActive)     return { label: 'Parents are responding', color: 'accent' };
    return null;
  };

  // ──────── FETCH (unchanged from original) ────────
  useEffect(() => {
    fetchFeed();
    fetchNearbyEvents();
    fetchTodaysPosts();
    fetchSubscription();
    fetchBusyChatRooms();
    fetchRecentActivity();
    if (user && !user.onboarding_complete && !sessionStorage.getItem('onboarding_dismissed')) {
      setShowOnboarding(true);
    }
  }, [user]);

  async function fetchFeed() {
    try {
      const r = await fetch(`${API_URL}/api/feed`, { credentials: 'include' });
      if (r.ok) setPosts(await r.json());
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }
  async function fetchTodaysPosts() {
    try { const r = await fetch(`${API_URL}/api/forums/posts/trending?limit=3`, { credentials: 'include' }); if (r.ok) setTodaysPosts(await r.json()); } catch {}
  }
  async function fetchNearbyEvents() {
    try { const r = await fetch(`${API_URL}/api/events?distance_km=25&limit=2`, { credentials: 'include' }); if (r.ok) setNearbyEvents(await r.json()); } catch {}
  }
  async function fetchSubscription() {
    try {
      const r = await fetch(`${API_URL}/api/subscription/status`, { credentials: 'include' });
      if (r.ok) { const data = await r.json(); setSubscription(data); if (data?.tier === 'premium') fetchUserCommunities(); }
    } catch {}
  }
  async function fetchBusyChatRooms() {
    try {
      const r = await fetch(`${API_URL}/api/chat/rooms`, { credentials: 'include' });
      if (r.ok) {
        const data = await r.json();
        const all = [...(data.all_australia_rooms || []), ...(data.nearby_rooms || []), ...(data.my_suburb_room ? [data.my_suburb_room] : [])];
        setBusyChatRooms(all.slice(0, 4));
        const find = pred => all.find(pred);
        const club = find(r => /3\s*am|three am/i.test(r.name || ''));
        const mums = find(r => /mum/i.test(r.name || '') && !/single/i.test(r.name || ''));
        const dads = find(r => /dad/i.test(r.name || '') && !/single/i.test(r.name || ''));
        const found = [club, mums, dads].filter(Boolean).map(r => ({
          name: r.name, icon: r.icon || '💬', href: `/chat/${r.room_id}`,
          count: r.active_users || r.member_count || null,
        }));
        setNamedRooms(found);
      }
    } catch {}
  }
  async function fetchUserCommunities() {
    try {
      const r = await fetch(`${API_URL}/api/forums/categories`, { credentials: 'include' });
      if (r.ok) {
        const data = await r.json();
        const all = data.categories || data;
        setUserCommunities(all.filter(c => c.category_type === 'community' && (c.creator_id === user?.user_id || c.is_member)));
      }
    } catch {}
  }
  async function fetchRecentActivity() {
    try { const r = await fetch(`${API_URL}/api/notifications?limit=6`, { credentials: 'include' }); if (r.ok) setRecentActivity(await r.json()); } catch {}
  }

  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
    sessionStorage.setItem('onboarding_dismissed', 'true');
    const stored = localStorage.getItem('user');
    if (stored) localStorage.setItem('user', JSON.stringify({ ...JSON.parse(stored), onboarding_complete: true }));
  };

  const handleSearch = async (q) => {
    if (!q?.trim()) { fetchFeed(); return; }
    try {
      const r = await fetch(`${API_URL}/api/search?q=${encodeURIComponent(q)}`, { credentials: 'include' });
      if (r.ok) setPosts(await r.json());
    } catch (e) { console.error(e); }
  };

  const handleLikePost = async (e, post) => {
    e.preventDefault(); e.stopPropagation();
    const liked = postLikes[post.post_id]?.liked ?? post.user_liked;
    setPostLikes(prev => ({
      ...prev,
      [post.post_id]: {
        liked: !liked,
        count: (prev[post.post_id]?.count ?? post.like_count ?? 0) + (liked ? -1 : 1),
      },
    }));
    try {
      await fetch(`${API_URL}/api/forums/posts/${post.post_id}/like`, {
        method: liked ? 'DELETE' : 'POST',
        credentials: 'include',
      });
    } catch {}
  };

  const firstName = user?.nickname || user?.name?.split(' ')[0] || 'there';
  const unreadActivity = recentActivity.filter(n => !n.is_read);
  const trialDaysLeft = subscription?.trial_days_remaining ?? null;

  // ──────── RENDER ────────
  return (
    <div className="min-h-screen bg-paper">
      <Navigation user={user} />
      {showOnboarding && <OnboardingModal user={user} onComplete={handleOnboardingComplete} onSkip={handleOnboardingComplete} />}

      <main className="lg:pl-[240px] pt-14 lg:pt-0">
        <div className="max-w-shell mx-auto px-4 sm:px-6 lg:px-10 py-6 lg:py-10">

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-8">

            {/* ─── CENTER COLUMN ─── */}
            <div className="min-w-0 space-y-6">

              {/* Trial banner (only if user is on trial) */}
              {trialDaysLeft != null && <TrialBanner daysLeft={trialDaysLeft} />}

              {/* Greeting */}
              <GreetingBlock firstName={firstName} subtitle={heroSubtitle} />

              {/* Mode tabs */}
              <ModeTabs value={mode} onChange={setMode} />

              {/* Search + new post */}
              <SearchBar
                value={searchQuery}
                onChange={setSearchQuery}
                onSubmit={handleSearch}
                onNewPost={() => navigate('/create-post')}
              />

              {/* Filter chips */}
              <div className="flex items-center gap-2 overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0 pb-1">
                {FEED_FILTERS.map(f => (
                  <FilterChip
                    key={f.id}
                    active={feedFilter === f.id}
                    onClick={() => { setFeedFilter(f.id); setVisibleCount(8); }}
                  >
                    {f.label}
                  </FilterChip>
                ))}
                {busyChatRooms.length > 0 && (
                  <FilterChip live onClick={() => navigate('/chat')}>
                    + {busyChatRooms.length} Live
                  </FilterChip>
                )}
              </div>

              {/* Section header */}
              <div className="pt-2">
                <h2 className="font-ui font-medium text-body text-ink-muted">
                  {feedFilter === 'latest'   && 'Latest conversations'}
                  {feedFilter === 'trending' && 'Trending discussions'}
                  {feedFilter === 'nearby'   && 'Near you'}
                  {feedFilter === 'support'  && 'Support needed'}
                  {feedFilter === 'unread'   && 'Unread'}
                </h2>
              </div>

              {/* Feed */}
              {loading ? (
                <FeedSkeleton />
              ) : filteredPosts.length === 0 ? (
                <EmptyFeed filter={feedFilter} onReset={() => setFeedFilter('latest')} />
              ) : (
                <div className="space-y-3">
                  {filteredPosts.slice(0, visibleCount).map((post, idx) => (
                    <PostCard
                      key={post.post_id}
                      post={post}
                      liked={postLikes[post.post_id]?.liked ?? post.user_liked}
                      likeCount={postLikes[post.post_id]?.count ?? post.like_count ?? 0}
                      timeAgo={fmtRelative(post.created_at)}
                      badge={getTopBadge(post)}
                      onOpen={() => navigate(`/forums/post/${post.post_id}`)}
                      onLike={(e) => handleLikePost(e, post)}
                      onReply={() => setSelectedPost(post)}
                    />
                  ))}
                  {filteredPosts.length > visibleCount && (
                    <button
                      onClick={() => setVisibleCount(c => c + 8)}
                      className="w-full py-4 text-body-sm text-ink-muted hover:text-ink transition-colors"
                    >
                      Load more
                    </button>
                  )}
                  {filteredPosts.length > 0 && visibleCount >= filteredPosts.length && (
                    <p className="text-center text-body-sm text-ink-faint py-4 italic font-display">
                      You're all caught up 🌿
                    </p>
                  )}
                </div>
              )}

              <AppFooter />
            </div>

            {/* ─── RIGHT RAIL ─── */}
            <aside className="space-y-4">

              {/* Activity */}
              <SideCard title="Activity">
                {unreadActivity.length > 0 ? (
                  <div className="space-y-1">
                    {unreadActivity.slice(0, 3).map((n, i) => (
                      <Link
                        key={n.notification_id || i}
                        to={n.link || '#'}
                        className="flex items-start gap-2.5 p-2 rounded-md bg-accent-soft/40 hover:bg-accent-soft transition-colors"
                      >
                        <span className="text-[14px] mt-0.5 shrink-0">{typeEmoji(n.type)}</span>
                        <div className="min-w-0 flex-1">
                          <p className="text-body-sm text-ink line-clamp-2 leading-snug">{n.message}</p>
                          <p className="text-micro text-ink-faint mt-0.5">{fmtRelative(n.created_at)}</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <p className="text-body-sm text-ink-muted italic font-display leading-relaxed px-1">
                    You're all caught up 🌿
                  </p>
                )}
              </SideCard>

              {/* Live now */}
              <SideCard
                title="Live now"
                action={<Link to="/chat" className="text-micro text-ink-faint hover:text-ink">See all</Link>}
              >
                <div className="space-y-0.5">
                  {(namedRooms.length > 0 ? namedRooms : [
                    { icon: '🌙', name: '3am Club',   href: '/chat' },
                    { icon: '☕', name: 'Morning Coffee', href: '/chat' },
                    { icon: '👶', name: 'New Parents Welcome', href: '/chat' },
                  ]).map(r => (
                    <RoomRow
                      key={r.name}
                      icon={r.icon}
                      name={r.name}
                      right={r.count ? `${r.count} online` : undefined}
                      dot={!r.count}
                      href={r.href}
                    />
                  ))}
                </div>
              </SideCard>

              {/* Spaces for you */}
              <SideCard
                title="Spaces for you"
                action={<Link to="/forums" className="text-micro text-ink-faint hover:text-ink">Browse</Link>}
              >
                <RecommendedSpaces user={user} />
              </SideCard>

              {/* Near you */}
              {nearbyEvents.length > 0 && (
                <SideCard
                  title="Near you"
                  action={<Link to="/events" className="text-micro text-ink-faint hover:text-ink">See all</Link>}
                >
                  {user?.suburb && (
                    <p className="flex items-center gap-1 text-micro text-ink-faint mb-2 -mt-2">
                      <MapPin className="h-3 w-3" strokeWidth={1.5} />
                      {user.suburb}{user.state ? `, ${user.state}` : ''}
                    </p>
                  )}
                  <div className="space-y-1">
                    {nearbyEvents.slice(0, 2).map((ev, i) => {
                      const d = ev.date ? new Date(ev.date) : null;
                      return (
                        <Link
                          key={ev.event_id || i}
                          to="/events"
                          className="flex items-center gap-3 p-2 rounded-md hover:bg-line-soft transition-colors"
                        >
                          <EventDateChip
                            day={d ? d.getDate() : '?'}
                            month={d ? d.toLocaleString('en-AU', { month: 'short' }).toUpperCase() : ''}
                          />
                          <div className="min-w-0">
                            <p className="text-body-sm font-medium text-ink truncate">{ev.title}</p>
                            <p className="text-micro text-ink-faint truncate">
                              {ev.suburb || ev.venue_name}{ev.distance_km ? ` · ${Math.round(ev.distance_km)}km` : ''}
                            </p>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </SideCard>
              )}

              {/* Village+ nudge (only if free tier) */}
              {subscription && subscription.tier !== 'premium' && (
                <Link
                  to="/plus"
                  className="flex items-center gap-3 px-4 py-3 rounded-xl border border-line hover:border-accent/40 hover:bg-accent-soft/30 transition-colors group"
                >
                  <Crown className="h-4 w-4 text-accent shrink-0" strokeWidth={1.5} />
                  <div className="min-w-0 flex-1">
                    <p className="text-body-sm font-medium text-ink">Unlock Village+</p>
                    <p className="text-micro text-ink-faint">Support the village · From $7.99/mo</p>
                  </div>
                </Link>
              )}
            </aside>
          </div>
        </div>
      </main>
    </div>
  );
}

// ───────────── Local helpers ─────────────

function FeedSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map(i => (
        <div key={i} className="village-card px-5 py-4 animate-pulse">
          <div className="flex items-center gap-2 mb-3">
            <div className="h-7 w-7 rounded-full bg-line-soft shrink-0" />
            <div className="h-3 bg-line-soft rounded w-32" />
            <div className="h-3 bg-line-soft rounded w-16 ml-auto" />
          </div>
          <div className="h-4 bg-line-soft rounded w-3/4 mb-2" />
          <div className="h-3 bg-line-soft rounded w-full mb-1" />
          <div className="h-3 bg-line-soft rounded w-2/3" />
        </div>
      ))}
    </div>
  );
}

function EmptyFeed({ filter, onReset }) {
  return (
    <div className="village-card px-8 py-12 text-center">
      <p className="font-display italic text-section text-ink mb-2">
        The village is quiet right now.
      </p>
      <p className="text-body text-ink-muted mb-6">
        {filter === 'latest'
          ? 'Be the first to share something today.'
          : 'Try a different filter or check back later.'}
      </p>
      {filter !== 'latest' ? (
        <Button variant="outline" onClick={onReset}>Clear filter</Button>
      ) : (
        <Link to="/create-post">
          <Button variant="primary">Start a conversation</Button>
        </Link>
      )}
    </div>
  );
}
