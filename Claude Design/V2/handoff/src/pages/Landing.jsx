/**
 * Landing.jsx — The Village, design refresh
 * ─────────────────────────────────────────────────────
 * KEEP:
 *   - useEffect that redirects to /dashboard if logged in
 *   - useEffect that pokes /api/seed
 *   - demoTab state
 *
 * REPLACE: entire JSX return + DEMO data stays but re-rendered through
 *          village primitives.
 * ─────────────────────────────────────────────────────
 */
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, ChevronRight } from 'lucide-react';

import Wordmark    from '../components/village/Wordmark';
import Button      from '../components/village/Button';
import Avatar      from '../components/village/Avatar';
import Pill        from '../components/village/Pill';
import LiveDot     from '../components/village/LiveDot';
import EventDateChip from '../components/village/EventDateChip';
import ThemeToggle from '../components/ThemeToggle';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const DEMO_POSTS = [
  { id: 1, author: 'Sarah M.',  category: 'BABY SLEEP',        time: '2H AGO',
    content: 'My 4-month-old suddenly stopped sleeping through the night. We had 6 weeks of 5-hour stretches and now we\'re back to every 2 hours. Is this the 4-month regression everyone talks about?',
    replies: 14, likes: 23 },
  { id: 2, author: 'Anonymous', category: 'PARENT WELLBEING',  time: '5H AGO', isAnon: true,
    content: 'I love my kids but I genuinely miss my old life sometimes. Is that terrible? I don\'t have anyone I can say this to without being judged.',
    replies: 31, likes: 87 },
  { id: 3, author: 'James R.',  category: 'DADS',              time: 'YESTERDAY',
    content: 'First time taking my toddler to the park solo and honestly loved every second. We stayed for 2 hours. He ate sand twice but I think that\'s fine.',
    replies: 8, likes: 45 },
];

const DEMO_EVENTS = [
  { id: 1, title: 'Morning Playgroup — Newborns & Babies', day: 10, month: 'APR', venue: 'Centennial Park, Paddington', distance: '1.2km' },
  { id: 2, title: 'Mums Coffee Morning',                   day: 12, month: 'APR', venue: 'The Grounds, Alexandria',     distance: '2.4km' },
  { id: 3, title: 'Dad & Toddler Catch-up',                day: 13, month: 'APR', venue: 'Bicentennial Park, Homebush', distance: '5.1km' },
];

export default function Landing() {
  const navigate = useNavigate();
  const [demoTab, setDemoTab] = useState('spaces');

  useEffect(() => {
    fetch(`${API_URL}/api/seed`, { method: 'POST' }).catch(() => {});
    if (localStorage.getItem('user')) navigate('/dashboard');
  }, [navigate]);

  return (
    <div className="min-h-screen bg-paper text-ink">

      {/* ─── Nav ─── */}
      <nav className="max-w-shell mx-auto px-6 lg:px-10 h-20 flex items-center justify-between">
        <Wordmark size="md" />
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Link to="/login">
            <Button variant="ghost" size="md">Sign in</Button>
          </Link>
          <Link to="/register">
            <Button variant="primary" size="md">Join the village</Button>
          </Link>
        </div>
      </nav>

      {/* ─── Hero ─── */}
      <section className="max-w-shell mx-auto px-6 lg:px-10 pt-8 pb-24">
        <div className="grid lg:grid-cols-[1.1fr_1fr] gap-14 items-center">

          <div className="space-y-7">
            <div className="inline-flex items-center gap-2 text-body-sm text-ink-muted">
              <LiveDot />
              <span className="font-mono text-eyebrow uppercase tracking-wider">Parents online right now</span>
            </div>

            <h1 className="font-display text-display-md lg:text-display-lg text-ink text-wrap-pretty">
              You're not alone
              <br />
              on <span className="italic text-accent">this journey.</span>
            </h1>

            <p className="text-body lg:text-[17px] leading-relaxed text-ink-muted max-w-[480px]">
              Whether it's 3am and you're breastfeeding, or you just need someone who gets it — The Village is here. Real Australian parents. Real conversations. Day and night.
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <Link to="/register">
                <Button variant="primary" size="lg">
                  Join the village
                  <ArrowRight className="h-4 w-4 ml-1" strokeWidth={1.8} />
                </Button>
              </Link>
              <Link to="/login">
                <Button variant="outline" size="lg">I have an account</Button>
              </Link>
            </div>

            <div className="flex flex-wrap gap-x-6 gap-y-2 text-body-sm text-ink-muted">
              <span className="flex items-center gap-1.5"><span className="text-support">✓</span> Free to join</span>
              <span className="flex items-center gap-1.5"><span className="text-support">✓</span> Australian parents</span>
              <span className="flex items-center gap-1.5"><span className="text-support">✓</span> You control your privacy</span>
            </div>

            <p className="font-display italic text-quote text-ink-muted pt-2">
              "It takes a village to raise a child."
              <span className="block text-body-sm not-italic text-ink-faint mt-1">— African proverb</span>
            </p>
          </div>

          {/* Hero visual — layered cards preview */}
          <div className="relative hidden lg:block">
            <div className="village-card p-5 space-y-4">
              <div className="flex items-center gap-3">
                <span className="text-[18px]">🌙</span>
                <div>
                  <p className="text-body font-medium text-ink">3am Club</p>
                  <p className="text-micro text-support flex items-center gap-1.5">
                    <LiveDot /> 12 parents online now
                  </p>
                </div>
              </div>
              <div className="space-y-3 pt-3 border-t border-line-soft">
                {[
                  { name: 'Mia',  text: "anyone else's toddler just… not sleeping tonight?" },
                  { name: 'You',  text: 'yes!! hour 3 of attempting bedtime', own: true },
                  { name: 'Tom',  text: 'solidarity. my 8 month old is going through something' },
                ].map((m, i) => (
                  <div key={i} className={`flex items-start gap-2 ${m.own ? 'justify-end' : ''}`}>
                    {!m.own && <Avatar name={m.name} size="xs" />}
                    <div className={`max-w-[80%] rounded-xl px-3 py-2 text-body-sm leading-snug ${
                      m.own ? 'bg-button text-button-ink' : 'bg-line-soft text-ink'
                    }`}>
                      {!m.own && <p className="text-micro text-ink-faint mb-0.5">{m.name}</p>}
                      {m.text}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="absolute -bottom-6 -left-8 village-card px-4 py-3 shadow-float">
              <p className="font-mono text-eyebrow uppercase text-ink-faint mb-1">Just posted</p>
              <p className="text-body-sm text-ink">
                <span className="italic font-display text-accent">Emily</span> — finally got 4 hours of sleep
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Demo tabs ─── */}
      <section className="border-t border-line-soft bg-card/60">
        <div className="max-w-shell mx-auto px-6 lg:px-10 py-16">
          <div className="text-center mb-10">
            <p className="font-mono text-eyebrow uppercase text-ink-faint mb-3">Live preview</p>
            <h2 className="font-display text-section text-ink">See what's happening right now</h2>
            <p className="text-body text-ink-muted mt-2">Browse a snapshot of the community before you sign up.</p>
          </div>

          <div className="inline-flex items-center gap-1 rounded-full bg-paper border border-line p-1 mx-auto mb-8 flex">
            {[
              { id: 'spaces',  label: 'Support Spaces' },
              { id: 'circles', label: 'Chat Circles' },
              { id: 'events',  label: 'Events' },
            ].map(t => (
              <button
                key={t.id}
                onClick={() => setDemoTab(t.id)}
                className={`h-9 px-5 rounded-full text-label transition-colors ${
                  demoTab === t.id ? 'bg-button text-button-ink' : 'text-ink-muted hover:text-ink'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="max-w-reading mx-auto">
            {demoTab === 'spaces' && (
              <div className="space-y-3">
                {DEMO_POSTS.map(p => (
                  <article key={p.id} className="village-card px-5 py-4">
                    <div className="flex items-center gap-2.5 mb-3">
                      <Avatar name={p.author} size="sm" />
                      <span className="text-body-sm font-medium text-ink">{p.author}</span>
                      <span className="font-mono text-eyebrow uppercase text-ink-faint">{p.category}</span>
                      <span className="text-ink-faint/60">·</span>
                      <span className="font-mono text-eyebrow uppercase text-ink-faint">{p.time}</span>
                    </div>
                    <p className="text-body text-ink leading-relaxed mb-3">{p.content}</p>
                    <div className="flex items-center gap-5 text-body-sm text-ink-faint pt-3 border-t border-line-soft">
                      <span>♡ {p.likes}</span>
                      <span>💬 {p.replies}</span>
                    </div>
                  </article>
                ))}
              </div>
            )}

            {demoTab === 'circles' && (
              <div className="village-card p-5 space-y-4">
                <div className="flex items-center gap-3 pb-3 border-b border-line-soft">
                  <span className="text-[18px]">🌙</span>
                  <div>
                    <p className="text-body font-medium text-ink">3am Club</p>
                    <p className="text-micro text-support flex items-center gap-1.5"><LiveDot /> 12 online</p>
                  </div>
                </div>
                {[
                  { name: 'Mia',  text: "anyone else's toddler just… not sleeping at all tonight?" },
                  { name: 'You',  text: 'yes!! we\'re on hour 3 of attempting bedtime 😭', own: true },
                  { name: 'Tom',  text: 'solidarity. my 8 month old is going through something' },
                  { name: 'Mia',  text: 'at least we\'re all awake together lol' },
                ].map((m, i) => (
                  <div key={i} className={`flex items-start gap-2 ${m.own ? 'justify-end' : ''}`}>
                    {!m.own && <Avatar name={m.name} size="sm" />}
                    <div className={`max-w-[75%] rounded-xl px-3.5 py-2 text-body leading-snug ${
                      m.own ? 'bg-button text-button-ink' : 'bg-line-soft text-ink'
                    }`}>
                      {!m.own && <p className="text-micro text-ink-faint mb-0.5">{m.name}</p>}
                      {m.text}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {demoTab === 'events' && (
              <div className="space-y-3">
                {DEMO_EVENTS.map(e => (
                  <article key={e.id} className="village-card px-5 py-4 flex items-center gap-4">
                    <EventDateChip day={e.day} month={e.month} />
                    <div className="flex-1 min-w-0">
                      <p className="text-body font-medium text-ink leading-snug">{e.title}</p>
                      <p className="text-body-sm text-ink-muted mt-1">{e.venue} · <span className="text-accent">{e.distance}</span></p>
                    </div>
                    <Button variant="outline" size="sm">RSVP</Button>
                  </article>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-center mt-10">
            <Link to="/register">
              <Button variant="primary" size="lg">
                Join free
                <ChevronRight className="h-4 w-4 ml-1" strokeWidth={1.8} />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ─── Privacy trust ─── */}
      <section className="border-t border-line-soft">
        <div className="max-w-reading mx-auto px-6 lg:px-10 py-20 text-center">
          <p className="font-mono text-eyebrow uppercase text-ink-faint mb-3">Privacy</p>
          <h2 className="font-display text-section text-ink mb-4">Your story, on your terms.</h2>
          <p className="text-body text-ink-muted leading-relaxed max-w-[540px] mx-auto mb-8">
            Posts are named by default so your community knows you. When you need privacy, switch any post or reply to anonymous — no name, no avatar, no trace.
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {['No data selling', 'No advertising profiles', 'Anonymous is a choice', 'Australian parents only'].map(t => (
              <Pill key={t} color="neutral">{t}</Pill>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section className="border-t border-line-soft bg-card/60">
        <div className="max-w-reading mx-auto px-6 lg:px-10 py-24 text-center">
          <h2 className="font-display text-section text-ink mb-4">
            Ready to find <span className="italic text-accent">your village</span>?
          </h2>
          <p className="text-body text-ink-muted mb-8 max-w-[520px] mx-auto">
            Join thousands of Australian parents supporting each other through the beautiful, exhausting, rewarding chaos of parenthood.
          </p>
          <Link to="/register">
            <Button variant="primary" size="lg">Join the village</Button>
          </Link>
          <p className="text-micro text-ink-faint mt-4">Free to join · 14-day Village+ trial · cancel anytime</p>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="border-t border-line-soft">
        <div className="max-w-shell mx-auto px-6 lg:px-10 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <Wordmark size="sm" />
          <div className="flex items-center gap-5 text-body-sm text-ink-faint">
            <Link to="/community-guidelines" className="hover:text-ink">Guidelines</Link>
            <Link to="/privacy" className="hover:text-ink">Privacy</Link>
            <Link to="/terms"   className="hover:text-ink">Terms</Link>
            <Link to="/contact" className="hover:text-ink">Contact</Link>
          </div>
          <p className="text-micro text-ink-faint">© {new Date().getFullYear()} The Village</p>
        </div>
      </footer>
    </div>
  );
}
