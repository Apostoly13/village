/**
 * Profile.jsx — The Village, design refresh
 * ─────────────────────────────────────────────────────
 * KEEP from frontend/src/pages/Profile.jsx:
 *   - useState (profile, posts, friends, isOwn, friendStatus, editing)
 *   - useParams userId (or fallback to logged-in user)
 *   - useEffect that loads /api/users/:id, /api/users/:id/posts, /api/users/:id/friends
 *   - handleAddFriend, handleRemoveFriend, handleAcceptFriend, handleMessage
 *   - The "edit cover photo" / "edit profile picture" handlers
 *
 * REPLACE entirely:
 *   - Cover with quiet wash (no aggressive gradient)
 *   - Identity strip — avatar (large) + name + meta + actions
 *   - Tabs: Posts / About / Friends
 *   - Empty states are warm + serif
 * ─────────────────────────────────────────────────────
 */
import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { MessageCircle, UserPlus, UserCheck, MapPin, Calendar, Edit3, Heart, Bookmark } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';

import Navigation from '../components/Navigation';
import AppFooter  from '../components/AppFooter';
import {
  Button, Avatar, Pill, SectionHeading, FilterChip, IconButton, SideCard,
} from '../components/village';
import { cn } from '../lib/cn';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const TABS = [
  { id: 'posts',   label: 'Posts' },
  { id: 'about',   label: 'About' },
  { id: 'friends', label: 'Friends' },
];

export default function Profile({ user }) {
  const { userId } = useParams();
  const navigate = useNavigate();

  const [profile, setProfile]     = useState(null);
  const [posts, setPosts]         = useState([]);
  const [friends, setFriends]     = useState([]);
  const [tab, setTab]             = useState('posts');
  const [loading, setLoading]     = useState(true);

  const isOwn = !userId || userId === user?.user_id;

  useEffect(() => {
    fetchAll();
  }, [userId]);

  async function fetchAll() {
    setLoading(true);
    try {
      const id = userId || user?.user_id;
      const [pRes, postsRes, frRes] = await Promise.all([
        fetch(`${API_URL}/api/users/${id}`, { credentials: 'include' }),
        fetch(`${API_URL}/api/users/${id}/posts`, { credentials: 'include' }),
        fetch(`${API_URL}/api/users/${id}/friends`, { credentials: 'include' }),
      ]);
      if (pRes.ok)     setProfile(await pRes.json());
      if (postsRes.ok) setPosts(await postsRes.json());
      if (frRes.ok)    setFriends(await frRes.json());
    } catch {} finally { setLoading(false); }
  }

  async function handleFriendAction() {
    if (!profile) return;
    const status = profile.friend_status; // 'none' | 'pending' | 'accepted'
    try {
      if (status === 'accepted') {
        await fetch(`${API_URL}/api/friends/${profile.user_id}`, { method: 'DELETE', credentials: 'include' });
      } else {
        await fetch(`${API_URL}/api/friends/${profile.user_id}`, { method: 'POST', credentials: 'include' });
      }
      fetchAll();
    } catch {}
  }

  if (loading || !profile) return <ProfileLoading user={user} />;

  return (
    <div className="min-h-screen bg-paper">
      <Navigation user={user} />

      <main className="lg:pl-[240px] pt-14 lg:pt-0">

        {/* COVER */}
        <div className="relative h-44 sm:h-56 bg-accent-soft overflow-hidden">
          {profile.cover_photo && (
            <img src={profile.cover_photo} alt="" className="w-full h-full object-cover" />
          )}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-paper/40" />
          {isOwn && (
            <button className="absolute top-4 right-4 inline-flex items-center gap-1.5 h-9 px-3 rounded-full bg-paper/90 backdrop-blur text-body-sm text-ink hover:bg-paper">
              <Edit3 className="h-3.5 w-3.5" strokeWidth={1.5} />
              Edit cover
            </button>
          )}
        </div>

        <div className="max-w-shell mx-auto px-4 sm:px-6 lg:px-10">

          {/* IDENTITY */}
          <section className="-mt-12 sm:-mt-16 pb-6 border-b border-line-soft">
            <div className="flex flex-col sm:flex-row sm:items-end gap-4">
              <Avatar
                name={profile.name} src={profile.picture}
                size="3xl"
                className="ring-4 ring-paper shadow-soft shrink-0"
              />
              <div className="flex-1 sm:pb-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="font-display text-card-title text-ink">{profile.name}</h1>
                  {profile.is_premium && <Pill color="accent" size="xs">Village+</Pill>}
                  {profile.is_3am_member && <Pill color="neutral" size="xs">3am Club</Pill>}
                </div>
                <div className="flex items-center gap-3 text-body-sm text-ink-muted mt-1 flex-wrap">
                  {profile.parenting_stage && <span>{prettyStage(profile.parenting_stage)}</span>}
                  {profile.suburb && (
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" strokeWidth={1.5} />
                      {profile.suburb}{profile.state ? `, ${profile.state}` : ''}
                    </span>
                  )}
                  {profile.member_since && (
                    <span className="inline-flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" strokeWidth={1.5} />
                      Since {format(new Date(profile.member_since), 'MMM yyyy')}
                    </span>
                  )}
                </div>
              </div>
              {!isOwn && (
                <div className="flex items-center gap-2 sm:pb-2">
                  <Button variant="primary" size="md" onClick={() => navigate(`/messages/${profile.user_id}`)}>
                    <MessageCircle className="h-4 w-4 mr-1" strokeWidth={1.5} />
                    Message
                  </Button>
                  <Button
                    variant={profile.friend_status === 'accepted' ? 'outline' : 'outline'}
                    size="md"
                    onClick={handleFriendAction}
                  >
                    {profile.friend_status === 'accepted' ? (
                      <><UserCheck className="h-4 w-4 mr-1" strokeWidth={1.5} /> Friends</>
                    ) : profile.friend_status === 'pending' ? (
                      'Requested'
                    ) : (
                      <><UserPlus className="h-4 w-4 mr-1" strokeWidth={1.5} /> Add friend</>
                    )}
                  </Button>
                </div>
              )}
              {isOwn && (
                <div className="sm:pb-2">
                  <Link to="/settings">
                    <Button variant="outline" size="md">
                      <Edit3 className="h-4 w-4 mr-1" strokeWidth={1.5} />
                      Edit profile
                    </Button>
                  </Link>
                </div>
              )}
            </div>

            {profile.bio && (
              <p className="text-body text-ink-muted leading-relaxed mt-4 max-w-[600px] text-wrap-pretty">
                {profile.bio}
              </p>
            )}
          </section>

          {/* TABS */}
          <div className="flex items-center gap-2 py-5 border-b border-line-soft overflow-x-auto">
            {TABS.map(t => (
              <FilterChip key={t.id} active={tab === t.id} onClick={() => setTab(t.id)}>
                {t.label}
                {t.id === 'posts'   && ` · ${posts.length}`}
                {t.id === 'friends' && ` · ${friends.length}`}
              </FilterChip>
            ))}
          </div>

          {/* CONTENT */}
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-8 py-7">
            <div className="min-w-0">
              {tab === 'posts'   && <PostsTab posts={posts} isOwn={isOwn} />}
              {tab === 'about'   && <AboutTab profile={profile} />}
              {tab === 'friends' && <FriendsTab friends={friends} />}
            </div>
            <aside className="space-y-4">
              <SideCard title="Stats">
                <div className="grid grid-cols-3 gap-3 text-center">
                  <Stat n={posts.length} label="Posts" />
                  <Stat n={friends.length} label="Friends" />
                  <Stat n={profile.helpful_count || 0} label="Thanks" />
                </div>
              </SideCard>
              {profile.interests?.length > 0 && (
                <SideCard title="Talks about">
                  <div className="flex flex-wrap gap-1.5">
                    {profile.interests.map(i => (
                      <Pill key={i} color="neutral" size="xs">{i}</Pill>
                    ))}
                  </div>
                </SideCard>
              )}
            </aside>
          </div>

          <AppFooter />
        </div>
      </main>
    </div>
  );
}

function PostsTab({ posts, isOwn }) {
  if (posts.length === 0) {
    return (
      <div className="village-card px-8 py-12 text-center">
        <p className="font-display italic text-section text-ink mb-2">
          {isOwn ? 'You haven\'t posted yet.' : 'Nothing to show here yet.'}
        </p>
        <p className="text-body text-ink-muted">{isOwn ? 'Share something — even a question. Someone\'s waiting to reply.' : 'They\'re still settling in.'}</p>
      </div>
    );
  }
  return (
    <div className="space-y-3">
      {posts.map(p => (
        <Link
          key={p.post_id}
          to={`/forums/post/${p.post_id}`}
          className="village-card village-card-hover px-5 py-4 block group"
        >
          <p className="font-mono text-eyebrow uppercase text-ink-faint mb-1.5">
            {p.category_name || 'POST'} · {fmtAgo(p.created_at)}
          </p>
          <h3 className="text-body font-medium text-ink leading-snug group-hover:text-accent transition-colors mb-1">
            {p.title}
          </h3>
          <p className="text-body-sm text-ink-muted line-clamp-2">{p.preview || p.content}</p>
          <div className="flex items-center gap-3 mt-2 text-micro text-ink-faint">
            <span className="inline-flex items-center gap-1"><Heart className="h-3 w-3" strokeWidth={1.5} /> {p.like_count || 0}</span>
            <span>·</span>
            <span>{p.reply_count || 0} replies</span>
          </div>
        </Link>
      ))}
    </div>
  );
}

function AboutTab({ profile }) {
  return (
    <div className="village-card p-6 space-y-4">
      <Field label="Bio"        value={profile.bio} />
      <Field label="Stage"      value={prettyStage(profile.parenting_stage)} />
      <Field label="Location"   value={[profile.suburb, profile.state].filter(Boolean).join(', ')} />
      <Field label="Interests"  value={profile.interests?.join(' · ')} />
      <Field label="Member since" value={profile.member_since ? format(new Date(profile.member_since), 'MMMM yyyy') : null} />
    </div>
  );
}

function FriendsTab({ friends }) {
  if (friends.length === 0) {
    return (
      <div className="village-card px-8 py-12 text-center">
        <p className="font-display italic text-section text-ink mb-2">No friends yet.</p>
        <p className="text-body text-ink-muted">Connect from chat rooms, comments, or local events.</p>
      </div>
    );
  }
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {friends.map(f => (
        <Link
          key={f.user_id}
          to={`/profile/${f.user_id}`}
          className="village-card village-card-hover p-4 text-center group"
        >
          <Avatar name={f.name} src={f.picture} size="lg" className="mx-auto" />
          <p className="text-body-sm font-medium text-ink mt-3 truncate group-hover:text-accent transition-colors">{f.name}</p>
          <p className="text-micro text-ink-faint truncate">{f.suburb || prettyStage(f.parenting_stage)}</p>
        </Link>
      ))}
    </div>
  );
}

function Field({ label, value }) {
  if (!value) return null;
  return (
    <div className="border-b border-line-soft pb-3 last:border-0 last:pb-0">
      <p className="font-mono text-eyebrow uppercase text-ink-faint mb-1">{label}</p>
      <p className="text-body text-ink leading-relaxed">{value}</p>
    </div>
  );
}

function Stat({ n, label }) {
  return (
    <div>
      <p className="font-display text-card-title text-ink leading-none">{n}</p>
      <p className="font-mono text-eyebrow uppercase text-ink-faint mt-1.5">{label}</p>
    </div>
  );
}

function prettyStage(s) {
  if (!s) return null;
  const map = {
    expecting: 'Expecting', newborn: 'Newborn parent', infant: 'Infant parent',
    toddler: 'Toddler parent', preschool: 'Preschool parent', school_age: 'School age',
    teenager: 'Teen parent', mixed: 'Mixed ages',
  };
  return map[s] || s;
}

function fmtAgo(d) { try { return formatDistanceToNow(new Date(d), { addSuffix: true }); } catch { return ''; } }

function ProfileLoading({ user }) {
  return (
    <div className="min-h-screen bg-paper">
      <Navigation user={user} />
      <main className="lg:pl-[240px] pt-14 lg:pt-0">
        <div className="h-44 sm:h-56 bg-line-soft animate-pulse" />
        <div className="max-w-shell mx-auto px-6 -mt-12 animate-pulse">
          <div className="h-24 w-24 rounded-full bg-line-soft ring-4 ring-paper" />
          <div className="h-6 w-48 bg-line-soft rounded mt-4" />
          <div className="h-3 w-32 bg-line-soft rounded mt-2" />
        </div>
      </main>
    </div>
  );
}
