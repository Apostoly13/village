import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "../components/ui/button";
import {
  ArrowRight, ChevronRight, ShieldCheck, Stethoscope,
  Moon, Sun
} from "lucide-react";
import { Wordmark } from "../components/Wordmark";
import { useTheme } from "../useTheme";
import {
  IconMoon, IconChat, IconLock, IconShield, IconPin, IconCal,
  IconPeople, IconPhone, IconSun, IconHand, IconSpark,
  IconGift, IconSwap, IconCheck, IconBed, IconSpaces
} from "../icons";
import { Stall as IconStall } from "../components/village/icons";

const API_URL = process.env.REACT_APP_BACKEND_URL;

// ── Demo data ─────────────────────────────────────────────────────────────────
const DEMO_POSTS = [
  {
    id: 1, author: "Sarah M.", avatar: "S", stage: "Baby (0–12 months)", time: "2 hours ago",
    category: "Baby Sleep",
    content: "My 4-month-old suddenly stopped sleeping through the night 😩 We had 6 weeks of 5-hour stretches and now we're back to every 2 hours. Is this the 4-month regression everyone talks about?",
    replies: 14, likes: 23,
  },
  {
    id: 2, author: "Anonymous", avatar: "?", stage: null, time: "5 hours ago",
    category: "Parent Wellbeing",
    content: "I love my kids but I genuinely miss my old life sometimes. Is that terrible? I don't have anyone I can say this to without being judged.",
    replies: 31, likes: 87, isAnon: true,
  },
  {
    id: 3, author: "Dr. Lena K.", avatar: "L", stage: "Midwife · Verified", time: "Yesterday",
    category: "Baby Sleep",
    content: "Quick note on the 4-month regression — it's a real developmental shift in sleep cycles, not something you've done wrong. Happy to answer questions in the thread below 👇",
    replies: 22, likes: 112, verified: true,
  },
];

const DEMO_CHAT = [
  { id: 1, author: "Mia",  avatar: "M", time: "11:42 PM", content: "anyone else's toddler just... not sleeping at all tonight?", isOwn: false },
  { id: 2, author: "You",  avatar: "Y", time: "11:43 PM", content: "yes!! we're on hour 3 of attempting bedtime 😭", isOwn: true },
  { id: 3, author: "TomD", avatar: "T", time: "11:43 PM", content: "solidarity. my 8 month old is going through something", isOwn: false },
  { id: 4, author: "Mia",  avatar: "M", time: "11:44 PM", content: "at least we're all awake together lol. that's why I love this chat", isOwn: false },
  { id: 5, author: "You",  avatar: "Y", time: "11:45 PM", content: "honestly this chat is the only thing keeping me sane rn", isOwn: true },
];

const DEMO_EVENTS = [
  { id: 1, title: "Morning Playgroup — Newborns & Babies", date: "Thu 10 Apr", time: "9:30 AM", venue: "Centennial Park, Paddington", distance: "1.2km away", rsvp: 8, limit: 15, category: "Playgroup", emoji: "👶" },
  { id: 2, title: "Parents Coffee Morning", date: "Sat 12 Apr", time: "10:00 AM", venue: "The Grounds, Alexandria", distance: "2.4km away", rsvp: 12, limit: 20, category: "Social", emoji: "☕" },
  { id: 3, title: "Toddler Playgroup — Outdoor Fun", date: "Sun 13 Apr", time: "8:00 AM", venue: "Bicentennial Park, Homebush", distance: "5.1km away", rsvp: 5, limit: 10, category: "Playgroup", emoji: "🏃" },
];

// ── Demo Tab Components ───────────────────────────────────────────────────────
function DemoSupportSpaces() {
  return (
    <div className="space-y-3">
      {DEMO_POSTS.map((post) => (
        <div key={post.id} className="bg-card border border-border/50 rounded-2xl p-4">
          <div className="flex items-start gap-3 mb-3">
            <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${post.isAnon ? "bg-muted text-muted-foreground" : "bg-primary/20 text-primary"}`}>
              {post.avatar}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`text-sm font-medium ${post.isAnon ? "text-muted-foreground italic" : "text-foreground"}`}>{post.author}</span>
                {post.verified && (
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-sky-500/10 text-sky-600 dark:text-sky-400 text-[10px] font-semibold leading-none">
                    <ShieldCheck className="h-3 w-3" />Verified
                  </span>
                )}
                <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{
                  background: post.category === "Baby Sleep" ? "rgba(196,112,90,0.12)" : "rgba(107,148,142,0.12)",
                  color: post.category === "Baby Sleep" ? "var(--clay)" : "var(--sage-deep, var(--sage))"
                }}>{post.category}</span>
              </div>
              <p className="text-xs text-muted-foreground">{post.time}</p>
            </div>
          </div>
          <p className="text-sm text-foreground leading-relaxed mb-3">{post.content}</p>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><IconChat size={12} /> {post.replies} replies</span>
            <span className="flex items-center gap-1">♥ {post.likes}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function DemoChatCircles() {
  return (
    <div className="flex flex-col gap-3">
      <div className="bg-card border border-border/50 rounded-2xl px-4 py-3 flex items-center gap-3">
        <IconMoon size={18} style={{ color: "var(--honey)", flexShrink: 0 }} />
        <div>
          <p className="font-medium text-foreground text-sm">3am Club</p>
          <p className="text-xs" style={{ color: "var(--sage)" }}>12 parents online now</p>
        </div>
      </div>
      <div className="bg-card border border-border/50 rounded-2xl p-4 space-y-3">
        {DEMO_CHAT.map((msg) => (
          <div key={msg.id} className={`flex ${msg.isOwn ? "justify-end" : "justify-start"} gap-2`}>
            {!msg.isOwn && (
              <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary shrink-0 mt-0.5">{msg.avatar}</div>
            )}
            <div className="max-w-[80%]">
              {!msg.isOwn && <p className="text-xs text-muted-foreground mb-1 ml-1">{msg.author}</p>}
              <div className={`rounded-2xl px-3 py-2 text-sm shadow-sm ${msg.isOwn ? "bg-primary text-primary-foreground" : "bg-secondary/60 text-foreground"}`}>
                {msg.content}
              </div>
              <p className={`text-xs text-muted-foreground mt-0.5 ${msg.isOwn ? "text-right mr-1" : "ml-1"}`}>{msg.time}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="bg-card border border-border/50 rounded-2xl px-4 py-3 flex items-center gap-3">
        <div className="flex-1 bg-secondary/50 rounded-full px-4 py-2 text-sm text-muted-foreground">Join to chat...</div>
        <Link to="/register">
          <Button size="sm" className="rounded-[8px] bg-primary text-primary-foreground text-xs px-4">Join free</Button>
        </Link>
      </div>
    </div>
  );
}

function DemoEvents() {
  return (
    <div className="space-y-3">
      {DEMO_EVENTS.map((event) => (
        <div key={event.id} className="bg-card border border-border/50 rounded-2xl p-4 flex gap-4">
          <div className="shrink-0">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: "rgba(107,148,142,0.12)", border: "1px solid rgba(107,148,142,0.25)" }}>
              <IconCal size={20} style={{ color: "var(--sage)" }} />
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-1">
              <p className="font-medium text-foreground text-sm leading-snug">{event.title}</p>
              <span className="text-xs px-2 py-0.5 rounded font-medium shrink-0" style={{
                background: event.category === "Playgroup" ? "rgba(107,148,142,0.12)" : "rgba(196,165,90,0.14)",
                color: event.category === "Playgroup" ? "var(--sage)" : "var(--honey)"
              }}>{event.category}</span>
            </div>
            <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1"><IconCal size={11} /> {event.date} · {event.time}</p>
            <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1"><IconPin size={11} /> {event.venue} · <span style={{ color: "var(--sage)" }}>{event.distance}</span></p>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">{event.rsvp}/{event.limit} going</span>
              <Link to="/register">
                <Button size="sm" variant="outline" className="rounded-[8px] text-xs h-7 px-3">RSVP</Button>
              </Link>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

const DEMO_STALL = [
  { id: 1, title: "ERGO Baby carrier — barely used", price: "$65", type: "sell", location: "Newtown", image: null, badge: "Sell" },
  { id: 2, title: "Toddler bike with balance wheels (18m–3yr)", price: "Free", type: "donate", location: "Manly", image: null, badge: "Donate" },
  { id: 3, title: "Baby clothes bundle 000–00 (girls)", price: "Swap", type: "swap", location: "Richmond", image: null, badge: "Swap" },
];

function DemoStall() {
  return (
    <div className="space-y-3">
      {DEMO_STALL.map((item) => (
        <div key={item.id} className="bg-card border border-border/50 rounded-2xl p-4 flex gap-4">
          <div className={`w-14 h-14 rounded-xl flex items-center justify-center shrink-0 ${
            item.type === "donate" ? "bg-[var(--sage-wash)] border border-[var(--sage)]/20"
            : item.type === "swap"   ? "bg-[var(--honey-wash)] border border-[var(--honey)]/20"
            : "bg-[var(--clay-wash)] border border-[var(--clay)]/20"
          }`}>
            {item.type === "donate"
              ? <IconGift size={22} style={{ color: "var(--sage-deep)" }} />
              : item.type === "swap"
              ? <IconSwap size={22} style={{ color: "var(--honey)" }} />
              : <IconStall size={22} style={{ color: "var(--clay)" }} />
            }
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-1">
              <p className="font-medium text-foreground text-sm leading-snug">{item.title}</p>
              <span className={`text-xs px-2 py-0.5 rounded font-medium shrink-0 ${
                item.type === "donate" ? "bg-[var(--sage-wash)] text-[var(--sage-deep)]"
                : item.type === "swap" ? "bg-[var(--honey-wash)] text-[var(--honey)]"
                : "bg-[var(--clay-wash)] text-[var(--clay)]"
              }`}>{item.badge}</span>
            </div>
            <p className="text-sm font-semibold text-foreground mb-1">{item.price}</p>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground flex items-center gap-1"><IconPin size={11} /> {item.location}</span>
              <Link to="/register">
                <Button size="sm" variant="outline" className="rounded-[8px] text-xs h-7 px-3">Enquire</Button>
              </Link>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function Landing() {
  const navigate = useNavigate();
  const [themeSetting, setThemeSetting, themeResolved] = useTheme();
  const isDark = themeResolved === "night";
  const toggleTheme = () => setThemeSetting(isDark ? "day" : "night");
  const [demoTab, setDemoTab] = useState("spaces");
  const [onlineStats, setOnlineStats] = useState({ online_now: null, active_rooms: 0 });

  useEffect(() => {
    fetch(`${API_URL}/api/seed`, { method: "POST" }).catch(() => {});
    const user = localStorage.getItem("user");
    if (user) navigate("/dashboard");

    const fetchStats = () => {
      fetch(`${API_URL}/api/stats/online`)
        .then(r => r.ok ? r.json() : null)
        .then(d => { if (d) setOnlineStats(d); })
        .catch(() => {});
    };
    fetchStats();
    const interval = setInterval(fetchStats, 60000);
    return () => clearInterval(interval);
  }, [navigate]);

  const features = [
    { Icon: IconMoon,   title: "Group Chats",               description: "Real-time chat by suburb, parenting stage, and national rooms. The 3am Club is always open — someone's always awake." },
    { Icon: IconChat,   title: "Spaces",                    description: "Topic discussions for the real stuff — sleep, feeding, mental health, relationships, and everything in between." },
    { Icon: IconLock,   title: "Anonymous when you need it",description: "Post under your name, or flip to anonymous on any post. No name, no avatar, no trace — your choice, every time." },
    { Icon: IconShield, title: "Verified healthcare voices",description: "Midwives, paediatricians, mental-health clinicians — verified with a badge so you know who you're listening to." },
    { Icon: IconPin,    title: "Local community",           description: "Suburb-based groups and events. Find parents near you and real-life meetups you can actually get to." },
    { Icon: IconCal,    title: "Events & playgroups",       description: "Browse and RSVP to local playgroups, coffee mornings, and dad meetups. Host your own in one tap." },
    { Icon: IconPeople, title: "Private messaging",         description: "Build real friendships and message privately. End-to-end private between you and the parent you're chatting with." },
    { Icon: IconStall,  title: "The Village Stall",         description: "Buy, sell, swap, and donate baby gear with parents near you. Keep good things circulating in your community — no fees, no strangers." },
    { Icon: IconPhone,  title: "Crisis support, built in",  description: "PANDA, Lifeline, and Beyond Blue surfaced on every sensitive space. Help is never more than a tap away." },
    { Icon: IconSun,    title: "Built in Australia",        description: "Australian parents, Australian moderation, Australian community. Made for the way we actually do parenting here." },
  ];

  const DEMO_TABS = [
    { id: "spaces",  label: "Spaces",      Icon: IconSpaces },
    { id: "circles", label: "Group Chats", Icon: IconMoon   },
    { id: "events",  label: "Events",      Icon: IconCal    },
    { id: "stall",   label: "Stall",       Icon: IconStall  },
  ];

  // ── Mobile section definitions ──────────────────────────────────────────────
  const MOBILE_SECTIONS = [
    { id: "hero",     label: "Home"         },
    { id: "features", label: "Features"     },
    { id: "demo",     label: "A Peek Inside" },
    { id: "pricing",  label: "Pricing"      },
    { id: "safe",     label: "Privacy"      },
    { id: "join",     label: "Join"         },
  ];


  // ── Shared nav bar ──────────────────────────────────────────────────────────
  const NavBar = () => (
    <nav
      className="fixed top-0 left-0 right-0 z-50 px-5 py-3 flex items-center justify-between max-w-7xl mx-auto w-full"
      style={{
        background: "var(--paper)",
        borderBottom: "1px solid var(--line-2)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        left: 0,
        right: 0,
      }}
    >
      <Wordmark size={20} />
      <div className="flex items-center gap-2">
        {/* Pill theme toggle */}
        <div className="flex items-center rounded-full p-0.5 border border-[var(--line)] bg-[var(--paper-2)]" data-testid="theme-toggle">
          <button onClick={() => setThemeSetting("day")} aria-label="Day mode"
            className={`flex items-center justify-center w-7 h-7 rounded-full transition-all ${!isDark ? "bg-[var(--paper)] shadow-sm" : "opacity-40 hover:opacity-70"}`}>
            <Sun className="h-3.5 w-3.5" />
          </button>
          <button onClick={() => setThemeSetting("night")} aria-label="Night mode"
            className={`flex items-center justify-center w-7 h-7 rounded-full transition-all ${isDark ? "bg-[var(--paper)] shadow-sm" : "opacity-40 hover:opacity-70"}`}>
            <Moon className="h-3.5 w-3.5" />
          </button>
        </div>
        <Link to="/for-clinicians" className="hidden md:inline-flex">
          <Button variant="ghost" size="sm" className="text-[var(--ink-2)] hover:text-[var(--ink)] gap-1.5 rounded-[8px]">
            <Stethoscope className="h-3.5 w-3.5" />For Clinicians
          </Button>
        </Link>
        <Link to="/login">
          <Button variant="ghost" size="sm" className="text-[var(--ink-2)] hover:text-[var(--ink)] rounded-[8px]" data-testid="nav-login-btn">
            Sign In
          </Button>
        </Link>
        <Link to="/register">
          <Button size="sm" className="rounded-[8px] px-5 h-8 text-sm" style={{ background: "var(--ink)", color: "var(--paper)" }} data-testid="nav-register-btn">
            Join Free
          </Button>
        </Link>
      </div>
    </nav>
  );

  // ── Mobile section renderers ────────────────────────────────────────────────
  const renderMobileSection = (id) => {
    switch (id) {
      case "hero":
        return (
          <div className="flex flex-col justify-center min-h-full px-6 py-10 relative overflow-hidden">
            <div className="relative space-y-6 max-w-sm">
              {/* Founding member chip */}
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--paper-2)] border border-[var(--line)]">
                <span className="text-xs text-[var(--ink-2)]">🌱 Now welcoming founding members</span>
              </div>

              <h1 style={{ fontFamily: "var(--serif)", fontSize: "clamp(36px, 9vw, 52px)", fontWeight: 550, letterSpacing: "-0.04em", lineHeight: 1.1, color: "var(--ink)", fontVariationSettings: "'opsz' 100" }}>
                Find{" "}
                <em style={{ fontStyle: "italic", color: "hsl(var(--accent))" }}>your village</em>
                {" "}— Australian parents who get it.
              </h1>

              <p className="text-base leading-relaxed" style={{ color: "var(--ink-2)" }}>
                The 3am feeds. The second-guessing. The days that are too long and the nights that don't end.
                A private, moderated community built for Australian parents.
              </p>

              <div className="flex flex-col gap-3">
                <Link to="/register">
                  <Button size="lg" className="w-full rounded-[8px] h-11 text-base" style={{ background: "var(--ink)", color: "var(--paper)" }} data-testid="hero-join-btn">
                    Join Our Little Village <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <Link to="/for-clinicians">
                  <Button variant="ghost" size="lg" className="w-full rounded-[8px] h-11 text-sm gap-2 text-[var(--ink)] hover:bg-[var(--paper-2)] hover:text-[var(--ink)]" style={{ border: "1px solid var(--line)" }}>
                    <Stethoscope className="h-4 w-4" />For Clinicians
                  </Button>
                </Link>
              </div>

              <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs" style={{ color: "var(--ink-2)" }}>
                <span className="flex items-center gap-1"><IconCheck size={14} style={{color:"var(--sage)"}} />Free to join</span>
                <span className="flex items-center gap-1"><IconLock size={14} style={{color:"var(--sage)"}} />Anonymous posting</span>
                <span className="flex items-center gap-1"><IconShield size={14} style={{color:"var(--sage)"}} />Moderated 24/7</span>
                <span className="flex items-center gap-1"><IconSun size={14} style={{color:"var(--sage)"}} />Made in Australia</span>
              </div>

              {/* Crisis strip */}
              <div className="mt-2 p-4 rounded-2xl bg-rose-500/5 border border-rose-500/15">
                <div className="flex items-center gap-2 mb-2">
                  <IconPhone size={16} style={{ color: "var(--danger)", flexShrink: 0 }} />
                  <p className="text-xs font-semibold text-foreground">If you're struggling right now</p>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {[{ n: "PANDA", t: "1300 726 306", h: "tel:1300726306" }, { n: "Lifeline", t: "13 11 14", h: "tel:131114" }, { n: "Beyond Blue", t: "1300 22 4636", h: "tel:1300224636" }].map(c => (
                    <a key={c.n} href={c.h} className="px-2.5 py-1 rounded-full bg-card border border-border text-xs font-medium text-foreground">
                      {c.n} · {c.t}
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );

      case "features":
        return (
          <div className="px-5 py-8 overflow-y-auto">
            <div className="mb-7">
              <span className="tv-mono" style={{ color: "hsl(var(--accent))" }}>What's inside</span>
              <h2 className="font-heading text-2xl font-medium mt-2 mb-2" style={{ color: "var(--ink)", letterSpacing: "-0.02em", lineHeight: 1.2 }}>
                Everything a parent needs,{" "}
                <em style={{ fontStyle: "italic", color: "hsl(var(--accent))" }}>in one place.</em>
              </h2>
            </div>
            {(() => {
              const COLOURS = [
                "var(--honey)", "var(--sage)",  "var(--dusk)",  "var(--clay)",
                "var(--honey)", "var(--sage)",  "var(--dusk)",  "var(--clay)",
                "var(--peach)", "var(--brand)",
              ];
              return (
                <div>
                  {features.map((feature, i) => {
                    const colour = COLOURS[i] || "var(--clay)";
                    const num = String(i + 1).padStart(2, "0");
                    return (
                      <div key={i} className="flex gap-4 py-5 border-b" style={{ borderColor: "var(--line)" }}>
                        <div className="shrink-0 flex flex-col items-center pt-0.5" style={{ width: "22px" }}>
                          <span className="font-heading text-[10px] font-medium" style={{ color: "var(--ink-3)" }}>{num}</span>
                          <div className="flex-1 w-px mt-1.5" style={{ background: colour, opacity: 0.45, minHeight: "16px" }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-heading font-medium text-[15px] mb-1.5 leading-snug" style={{ color: "var(--ink)" }}>
                            {feature.title}
                          </h3>
                          <p className="text-xs leading-relaxed" style={{ color: "var(--ink-2)" }}>
                            {feature.description}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
            <div className="mt-8">
              <Link to="/register">
                <Button className="w-full rounded-[8px] h-11" style={{ background: "var(--ink)", color: "var(--paper)" }}>
                  Join free <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        );

      case "demo":
        return (
          <div className="px-5 py-8 overflow-y-auto">
            <div className="text-center mb-5">
              <span className="tv-mono" style={{ color: "hsl(var(--accent))" }}>A PEEK INSIDE</span>
              <h2 className="font-heading text-2xl font-bold text-foreground mt-1 mb-2">What it looks like inside</h2>
              <p className="text-sm text-muted-foreground">Example conversations — this is the kind of support waiting for you.</p>
            </div>
            <div className="flex items-center gap-1 mb-4 bg-secondary/50 rounded-2xl p-1.5 overflow-x-auto">
              {DEMO_TABS.map((tab) => (
                <button key={tab.id} onClick={() => setDemoTab(tab.id)}
                  className={`flex-1 flex items-center justify-center gap-1 px-2 py-2 rounded-[8px] text-xs font-medium transition-all shrink-0 whitespace-nowrap ${demoTab === tab.id ? "bg-card text-foreground shadow-sm border border-border/50" : "text-muted-foreground"}`}
                >
                  <tab.Icon size={14} /><span>{tab.label}</span>
                </button>
              ))}
            </div>
            <div className="relative">
              {demoTab === "spaces"  && <DemoSupportSpaces />}
              {demoTab === "circles" && <DemoChatCircles />}
              {demoTab === "events"  && <DemoEvents />}
              {demoTab === "stall"   && <DemoStall />}
              <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-background to-transparent pointer-events-none" />
              <div className="absolute bottom-1 left-0 right-0 flex justify-center">
                <Link to="/register">
                  <Button className="bg-primary text-primary-foreground rounded-[8px] px-6 shadow-[0_0_20px_hsl(var(--primary)/0.3)]">
                    Join free <ChevronRight className="ml-1 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        );

      case "pricing":
        return (
          <div className="px-5 py-8 overflow-y-auto">
            <div className="mb-6">
              <span className="tv-mono" style={{ color: "hsl(var(--accent))" }}>Simple pricing</span>
              <h2 className="font-heading text-2xl font-medium mt-2 mb-1" style={{ color: "var(--ink)", letterSpacing: "-0.02em" }}>Free forever. Village+ when you want more.</h2>
              <p className="text-sm" style={{ color: "var(--ink-2)" }}>Honest pricing. Cancel any time.</p>
            </div>
            <div className="space-y-4">
              {/* Free — tighter radius */}
              <div className="bg-card border border-border/50 rounded-[10px] p-5" style={{ boxShadow: "var(--shadow-card)" }}>
                <div className="flex items-baseline justify-between mb-4">
                  <h3 className="font-heading font-medium text-lg" style={{ color: "var(--ink)" }}>Village Free</h3>
                  <div className="text-right"><p className="text-2xl font-bold" style={{ color: "var(--ink)" }}>$0</p><p className="text-xs" style={{ color: "var(--ink-3)" }}>forever</p></div>
                </div>
                <ul className="space-y-2 text-sm mb-5" style={{ color: "var(--ink)" }}>
                  {["All Spaces & discussions (fair-use weekly limit)", "Group Chats — national + local (daily fair-use limit)", "Anonymous posting", "Browse & RSVP to events", "Stall donation groups", "Verified clinician replies", "Crisis resources"].map(t => (
                    <li key={t} className="flex items-start gap-2"><IconCheck size={16} style={{color:"var(--sage)",flexShrink:0,marginTop:"2px"}} /><span>{t}</span></li>
                  ))}
                </ul>
                <Link to="/register"><Button variant="outline" className="w-full rounded-[8px]">Join free</Button></Link>
              </div>
              {/* Village+ — generous radius, premium */}
              <div className="relative bg-card rounded-[20px] border-2 p-5" style={{ borderColor: "hsl(var(--primary))", boxShadow: "0 0 0 4px hsl(var(--primary) / 0.08), var(--shadow-md)" }}>
                <span className="absolute -top-3 left-5 px-3 py-1 rounded-[4px] text-[10px] font-semibold uppercase tracking-wide" style={{ background: "hsl(var(--primary))", color: "hsl(var(--primary-foreground))" }}>Most popular</span>
                <div className="flex items-baseline justify-between mb-4">
                  <h3 className="font-heading font-medium text-lg flex items-center gap-1.5" style={{ color: "var(--ink)" }}><IconSpark size={16} style={{color:"hsl(var(--primary))"}} />Village+</h3>
                  <div className="text-right"><p className="text-2xl font-bold" style={{ color: "var(--ink)" }}>$9.99<span className="text-sm font-normal" style={{ color: "var(--ink-3)" }}>/mo</span></p><p className="text-xs" style={{ color: "var(--ink-3)" }}>cancel any time</p></div>
                </div>
                <ul className="space-y-2 text-sm mb-5" style={{ color: "var(--ink)" }}>
                  {["Everything in Free — unlimited", "Private messaging with any parent", "Host your own events", "The Village Stall — buy, sell & swap", "Priority support", "Early access to new features"].map(t => (
                    <li key={t} className="flex items-start gap-2"><IconCheck size={16} style={{color:"var(--sage)",flexShrink:0,marginTop:"2px"}} /><span>{t}</span></li>
                  ))}
                </ul>
                <Link to="/register"><Button className="w-full rounded-[8px]" style={{ background: "hsl(var(--primary))", color: "hsl(var(--primary-foreground))" }}>Start with Village+</Button></Link>
              </div>
            </div>
          </div>
        );

      case "safe":
        return (
          <div className="px-5 py-8 overflow-y-auto">
            <div className="mb-7">
              <span className="tv-mono" style={{ color: "hsl(var(--accent))" }}>Privacy</span>
              <h2 className="font-heading text-2xl font-medium mt-2 mb-2" style={{ color: "var(--ink)", letterSpacing: "-0.02em" }}>Your privacy, in plain English</h2>
              <p className="text-sm" style={{ color: "var(--ink-2)" }}>Because you shouldn't need a law degree to understand what happens to your words.</p>
            </div>
            <div className="mb-6">
              {[
                { title: "Anonymous when you want", desc: "Flip any post to anonymous — no name, no avatar, no trace back to you.", colour: "var(--dusk)" },
                { title: "We don't sell your data", desc: "Not to advertisers, not to brokers, not to anyone. Ever.", colour: "var(--sage)" },
                { title: "Australian privacy law", desc: "Your data is protected under the Australian Privacy Principles, with primary storage in Australia.", colour: "var(--honey)" },
                { title: "Delete anything, any time", desc: "Your account, your posts, your messages — gone when you say so.", colour: "var(--clay)" },
              ].map((item) => (
                <div key={item.title} className="flex gap-4 py-5 border-b" style={{ borderColor: "var(--line)" }}>
                  <div className="shrink-0 w-1 rounded-full" style={{ background: item.colour, opacity: 0.6, alignSelf: "stretch" }} />
                  <div>
                    <p className="font-heading font-medium text-sm mb-1" style={{ color: "var(--ink)" }}>{item.title}</p>
                    <p className="text-xs leading-relaxed" style={{ color: "var(--ink-2)" }}>{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            {/* Verified clinicians callout */}
            <div className="bg-sky-500/5 border border-sky-500/20 rounded-2xl p-4 flex gap-3">
              <ShieldCheck className="h-5 w-5 text-sky-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-foreground mb-1">Verified healthcare professionals</p>
                <p className="text-xs text-muted-foreground">Midwives, paediatricians, and mental-health clinicians carry a sky-blue badge so you always know who you're listening to.</p>
                <Link to="/for-clinicians" className="text-xs text-sky-600 dark:text-sky-400 font-medium mt-1.5 inline-block">For healthcare professionals →</Link>
              </div>
            </div>
          </div>
        );

      case "join":
        return (
          <div className="flex flex-col justify-center min-h-full px-6 py-10 text-center">
            <div className="max-w-sm mx-auto space-y-6">
              <div>
                <p className="tv-mono mb-4" style={{ color: "hsl(var(--accent))" }}>Join today</p>
                <h2 className="font-heading text-3xl font-bold mb-3" style={{ fontFamily: "var(--serif)", color: "var(--ink)" }}>
                  Ready to find your village?
                </h2>
                <p className="text-base" style={{ color: "var(--ink-2)" }}>
                  Join Australian parents supporting each other through the beautiful, exhausting, rewarding chaos of parenthood.
                </p>
              </div>
              <div className="space-y-3">
                <Link to="/register">
                  <Button size="lg" className="w-full rounded-[8px] h-11 text-base" style={{ background: "var(--ink)", color: "var(--paper)" }} data-testid="cta-join-btn">
                    Join Our Little Village
                  </Button>
                </Link>
                <Link to="/login">
                  <Button variant="outline" size="lg" className="w-full rounded-[8px] text-sm border-[var(--line)] text-[var(--ink)]">
                    Sign In
                  </Button>
                </Link>
              </div>
              <p className="text-xs" style={{ color: "var(--ink-3)" }}>Free to join · No credit card · Cancel any time</p>
              <div className="pt-2 border-t border-[var(--line)] flex flex-wrap gap-x-4 gap-y-2 justify-center text-xs" style={{ color: "var(--ink-3)" }}>
                <Link to="/terms" className="hover:text-[var(--ink)]">Terms</Link>
                <Link to="/privacy" className="hover:text-[var(--ink)]">Privacy</Link>
                <Link to="/community-guidelines" className="hover:text-[var(--ink)]">Community Guidelines</Link>
                <Link to="/contact" className="hover:text-[var(--ink)]">Contact</Link>
              </div>
              <p className="text-xs" style={{ color: "var(--ink-3)" }}>&copy; {new Date().getFullYear()} Our Little Village · Made in Australia</p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="bg-[var(--paper)] transition-colors duration-300">

      {/* ── Mobile fixed nav (mobile only — desktop has inline nav in hero) ──── */}
      <div className="lg:hidden">
        <NavBar />
      </div>

      {/* ══════════ MOBILE LAYOUT (< lg) — simple scroll ═══════════════════════ */}
      <div className="lg:hidden" style={{ paddingTop: "53px" }}>
        {MOBILE_SECTIONS.map(s => (
          <div key={s.id}>
            {renderMobileSection(s.id)}
          </div>
        ))}
      </div>

      {/* ══════════ DESKTOP LAYOUT (≥ lg) ════════════════════════════════════════ */}
      <div className="hidden lg:block">

        {/* ── Hero ─────────────────────────────────────────────────────────────── */}
        <div className="relative overflow-hidden bg-[var(--paper)]">
          <div className="tv-paper-noise absolute inset-0 opacity-50 pointer-events-none z-0" />
          {/* Desktop inline nav */}
          <nav className="relative z-10 px-6 py-4 flex items-center justify-between max-w-7xl mx-auto">
            <Wordmark size={22} />
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Pill theme toggle */}
              <div className="flex items-center rounded-full p-0.5 border border-[var(--line)] bg-[var(--paper-2)]">
                <button onClick={() => setThemeSetting("day")} aria-label="Day mode"
                  className={`flex items-center justify-center w-8 h-8 rounded-full transition-all ${!isDark ? "bg-[var(--paper)] shadow-sm" : "opacity-40 hover:opacity-70"}`}>
                  <Sun className="h-4 w-4" />
                </button>
                <button onClick={() => setThemeSetting("night")} aria-label="Night mode"
                  className={`flex items-center justify-center w-8 h-8 rounded-full transition-all ${isDark ? "bg-[var(--paper)] shadow-sm" : "opacity-40 hover:opacity-70"}`}>
                  <Moon className="h-4 w-4" />
                </button>
              </div>
              <Link to="/for-clinicians" className="hidden md:inline-flex">
                <Button variant="ghost" className="text-[var(--ink-2)] hover:text-[var(--ink)] gap-1.5 rounded-[8px]">
                  <Stethoscope className="h-4 w-4" />For Clinicians
                </Button>
              </Link>
              <Link to="/login">
                <Button variant="ghost" className="text-[var(--ink-2)] hover:text-[var(--ink)] rounded-[8px]" data-testid="nav-login-btn">
                  Sign In
                </Button>
              </Link>
              <Link to="/register">
                <Button className="rounded-[8px] px-6 h-10" style={{ background: "var(--ink)", color: "var(--paper)" }} data-testid="nav-register-btn">
                  Join Free
                </Button>
              </Link>
            </div>
          </nav>

          <div className="relative z-10 px-6 pt-16 pb-28 max-w-7xl mx-auto">
            <div className="max-w-2xl space-y-8">
              <p className="tv-mono" style={{ color: "var(--ink-2)" }}>For Australian parents</p>
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[var(--paper-2)] border border-[var(--line)]">
                <span className="text-xs text-[var(--ink-2)]">🌱 Now welcoming founding members</span>
              </div>
              <h1 style={{ fontFamily: "var(--serif)", fontSize: "clamp(42px, 6vw, 84px)", fontWeight: 550, letterSpacing: "-0.045em", lineHeight: 1.05, color: "var(--ink)", fontVariationSettings: "'opsz' 144" }}>
                Find{" "}
                <em style={{ fontStyle: "italic", color: "hsl(var(--accent))" }}>your village</em>
                {" "}—{" "}
                Australian parents who get it.
              </h1>
              <p className="text-lg leading-relaxed" style={{ color: "var(--ink-2)" }}>
                The 3am feeds. The second-guessing. The days that are too long and the nights that don't end.
                Our Little Village is a private, moderated community built for Australian mums and dads —
                with real clinicians in the room and help close by when you need it.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 items-start">
                <Link to="/register">
                  <Button size="lg" className="rounded-[8px] px-8 h-11 text-base group" style={{ background: "var(--ink)", color: "var(--paper)" }} data-testid="hero-join-btn">
                    Join Our Little Village <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
                <Link to="/for-clinicians">
                  <Button variant="ghost" size="lg" className="rounded-[8px] px-8 h-11 text-base gap-2 text-[var(--ink)] hover:bg-[var(--paper-2)] hover:text-[var(--ink)]" style={{ border: "1px solid var(--line)" }}>
                    <Stethoscope className="h-4 w-4" />For Clinicians
                  </Button>
                </Link>
              </div>
              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm" style={{ color: "var(--ink-2)" }}>
                <span className="flex items-center gap-1.5"><IconCheck size={16} style={{color:"var(--sage)"}} />Free to join</span>
                <span className="flex items-center gap-1.5"><IconLock size={16} style={{color:"var(--sage)"}} />Anonymous posting</span>
                <span className="flex items-center gap-1.5"><IconShield size={16} style={{color:"var(--sage)"}} />Moderated 24/7</span>
                <span className="flex items-center gap-1.5"><IconSun size={16} style={{color:"var(--sage)"}} />Made in Australia</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Crisis support band — slim strip ────────────────────────────────── */}
        <div className="border-b border-rose-500/10" style={{ background: "rgba(220,38,38,0.025)" }}>
          <div className="max-w-7xl mx-auto px-6 py-3 flex flex-col sm:flex-row items-center gap-3">
            <div className="flex items-center gap-2 shrink-0">
              <IconPhone size={14} style={{ color: "var(--danger)" }} />
              <span className="text-xs font-medium" style={{ color: "var(--ink-2)" }}>If you're struggling right now —</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {[{ n: "PANDA", t: "1300 726 306", h: "tel:1300726306" }, { n: "Lifeline", t: "13 11 14", h: "tel:131114" }, { n: "Beyond Blue", t: "1300 22 4636", h: "tel:1300224636" }].map(c => (
                <a key={c.n} href={c.h} className="px-3 py-1 rounded-full bg-[var(--paper-2)] border border-[var(--line)] text-xs font-medium hover:border-[var(--clay)]/40 transition-colors" style={{ color: "var(--ink-2)" }}>
                  {c.n} · {c.t}
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* ── Features ─────────────────────────────────────────────────────────── */}
        <section className="px-6 py-24" style={{ background: "var(--paper)" }}>
          <div className="max-w-7xl mx-auto">
            {/* Left-aligned editorial header — not centred */}
            <div className="mb-16 max-w-xl">
              <span className="tv-mono" style={{ color: "hsl(var(--accent))" }}>What's inside</span>
              <h2 className="font-heading text-3xl sm:text-4xl font-semibold mt-3 mb-4" style={{ color: "var(--ink)", letterSpacing: "-0.04em", lineHeight: 1.1, fontVariationSettings: "'opsz' 72" }}>
                Everything a parent needs,{" "}
                <em style={{ fontStyle: "italic", color: "hsl(var(--accent))" }}>in one place.</em>
              </h2>
              <p style={{ color: "var(--ink-2)", fontSize: "15px", lineHeight: 1.7 }}>
                From 3am feeds to the school gate, from questions you'd never ask out loud to a verified midwife's answer.
              </p>
            </div>

            {/* Editorial numbered list — two columns, no card boxes */}
            {(() => {
              const COLOURS = [
                "var(--honey)", "var(--sage)",  "var(--dusk)",  "var(--clay)",
                "var(--honey)", "var(--sage)",  "var(--dusk)",  "var(--clay)",
                "var(--peach)", "var(--brand)",
              ];
              return (
                <div className="grid lg:grid-cols-2 gap-x-16">
                  {features.map((feature, i) => {
                    const colour = COLOURS[i] || "var(--clay)";
                    const num = String(i + 1).padStart(2, "0");
                    return (
                      <div key={i} className="flex gap-6 py-7 border-b" style={{ borderColor: "var(--line)" }}>
                        {/* Number + vertical rule */}
                        <div className="shrink-0 flex flex-col items-center pt-1" style={{ width: "28px" }}>
                          <span className="font-heading text-xs font-medium" style={{ color: "var(--ink-3)", letterSpacing: "0.04em" }}>{num}</span>
                          <div className="flex-1 w-px mt-2" style={{ background: colour, opacity: 0.45, minHeight: "24px" }} />
                        </div>
                        {/* Content — no card, no border, no background */}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-heading font-medium text-[17px] mb-2 leading-snug" style={{ color: "var(--ink)", letterSpacing: "-0.01em" }}>
                            {feature.title}
                          </h3>
                          <p className="text-sm leading-relaxed" style={{ color: "var(--ink-2)" }}>
                            {feature.description}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}

            <div className="mt-14">
              <Link to="/register">
                <Button className="rounded-[8px] px-8 h-11" style={{ background: "var(--ink)", color: "var(--paper)" }}>
                  Join free <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* ── Interactive Demo ──────────────────────────────────────────────────── */}
        <section className="px-6 py-24">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-10">
              <span className="tv-mono" style={{ color: "hsl(var(--accent))" }}>A PEEK INSIDE</span>
              <h2 className="font-heading text-3xl sm:text-4xl font-bold mt-2 mb-3" style={{ color: "var(--ink)", letterSpacing: "-0.04em", lineHeight: 1.1, fontVariationSettings: "'opsz' 72" }}>What it looks like inside</h2>
              <p className="text-muted-foreground max-w-xl mx-auto">Example conversations — this is the kind of support waiting for you.</p>
            </div>
            <div className="flex items-center gap-1.5 mb-6 bg-secondary/50 rounded-2xl p-1.5 max-w-md mx-auto">
              {DEMO_TABS.map((tab) => (
                <button key={tab.id} onClick={() => setDemoTab(tab.id)}
                  className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-[8px] text-sm font-medium transition-all ${demoTab === tab.id ? "bg-card text-foreground shadow-sm border border-border/50" : "text-muted-foreground hover:text-foreground"}`}
                >
                  <tab.Icon size={15} />
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              ))}
            </div>
            <div className="relative">
              <div className="max-w-2xl mx-auto">
                {demoTab === "spaces"  && <DemoSupportSpaces />}
                {demoTab === "circles" && <DemoChatCircles />}
                {demoTab === "events"  && <DemoEvents />}
                {demoTab === "stall"   && <DemoStall />}
              </div>
              <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent pointer-events-none" />
              <div className="absolute bottom-0 left-0 right-0 flex justify-center pb-2">
                <Link to="/register">
                  <Button className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-[8px] px-8 h-11 shadow-[0_0_20px_hsl(var(--primary)/0.3)]">
                    Join free <ChevronRight className="ml-1 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ── Proverb ───────────────────────────────────────────────────────────── */}
        <section className="px-6 py-16">
          <div className="max-w-2xl mx-auto text-center">
            <p style={{ fontFamily: "var(--serif)", fontSize: "clamp(22px, 3vw, 32px)", fontStyle: "italic", fontWeight: 400, letterSpacing: "-0.02em", lineHeight: 1.4, color: "var(--ink-2)" }}>
              "Raising a child was never meant to be done alone."
            </p>
          </div>
        </section>

        {/* ── Verified Partners ─────────────────────────────────────────────────── */}
        <section className="px-6 py-24 bg-secondary/30">
          <div className="max-w-7xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div className="relative order-2 lg:order-1">
                <div className="rounded-3xl overflow-hidden border border-border/30">
                  <img src="https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=600&h=500&fit=crop" alt="Midwife with parent" className="w-full h-[500px] object-cover" />
                </div>
                <div className="absolute bottom-6 left-6 right-6 bg-card/95 backdrop-blur p-4 rounded-2xl border border-border/50 shadow-lg">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-sky-500/10 flex items-center justify-center shrink-0"><ShieldCheck className="h-5 w-5 text-sky-500" /></div>
                    <div>
                      <p className="text-sm font-medium text-foreground flex items-center gap-1.5">Dr. Lena K.<span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-sky-500/10 text-sky-600 dark:text-sky-400 text-[10px] font-semibold"><ShieldCheck className="h-3 w-3" />Verified</span></p>
                      <p className="text-xs text-muted-foreground">Midwife · 12 years' practice</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="space-y-6 order-1 lg:order-2">
                <span className="tv-mono" style={{ color: "hsl(var(--accent))" }}>Verified Partners</span>
                <h2 className="font-heading text-3xl sm:text-4xl font-bold" style={{ color: "var(--ink)", letterSpacing: "-0.04em", lineHeight: 1.1, fontVariationSettings: "'opsz' 72" }}>Real clinicians. Clearly marked.</h2>
                <p className="text-muted-foreground">Midwives, paediatricians, lactation consultants, and perinatal mental-health clinicians can join as Verified Partners. Their posts carry a sky-blue badge so you always know who you're listening to.</p>
                <div className="space-y-3">
                  {["Credentials checked before the badge is issued", "No selling, no sponsored posts — just answers", "Clearly separated from peer-to-peer conversation"].map(t => (
                    <div key={t} className="flex items-start gap-3 text-sm text-foreground"><IconCheck size={16} style={{color:"var(--sage)",flexShrink:0,marginTop:"2px"}} /><span>{t}</span></div>
                  ))}
                </div>
                <Link to="/for-clinicians"><Button variant="outline" className="rounded-[8px] gap-2"><Stethoscope className="h-4 w-4" />For healthcare professionals</Button></Link>
              </div>
            </div>
          </div>
        </section>

        {/* ── Chat Spaces preview ───────────────────────────────────────────────── */}
        <section className="px-6 py-24">
          <div className="max-w-7xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div className="space-y-6">
                <span className="tv-mono" style={{ color: "hsl(var(--accent))" }}>Group Chats</span>
                <h2 className="font-heading text-3xl sm:text-4xl font-bold" style={{ color: "var(--ink)", letterSpacing: "-0.04em", lineHeight: 1.1, fontVariationSettings: "'opsz' 72" }}>A room for every moment</h2>
                <p className="text-muted-foreground">National rooms, local suburb chats, and stage-specific spaces. Your people are here, whatever time it is.</p>
                <div className="space-y-3">
                  {[
                    { Icon: IconMoon,  color: "var(--honey)", name: "3am Club",         desc: "For the late-night moments — always someone awake", featured: true },
                    { Icon: IconHand,  color: "var(--clay)",  name: "Mental Health",     desc: "An open, judgment-free space for the hard days" },
                    { Icon: IconBed,   color: "var(--dusk)",  name: "Sleep & Settling",  desc: "Share what worked — or just commiserate" },
                    { Icon: IconPin,   color: "var(--sage)",  name: "Your Local Group",  desc: "Chat with parents in your suburb" },
                  ].map((room, idx) => (
                    <div key={idx} className={`flex items-center gap-4 p-4 rounded-xl border transition-colors ${room.featured ? "bg-card border-border/50" : "bg-card border-border/50"}`}
                      style={room.featured ? { background: "rgba(196,165,90,0.08)", borderColor: "rgba(196,165,90,0.35)" } : {}}>
                      <room.Icon size={20} style={{ color: room.color, flexShrink: 0 }} />
                      <div className="flex-1"><p className="font-medium text-foreground text-sm">{room.name}</p><p className="text-xs text-muted-foreground">{room.desc}</p></div>
                      {room.featured && <span className="text-xs font-semibold" style={{ color: "var(--honey)" }}>Live now</span>}
                    </div>
                  ))}
                </div>
              </div>
              <div className="relative">
                <div className="rounded-3xl overflow-hidden border border-border/30">
                  <img src="https://images.unsplash.com/photo-1491013516836-7db643ee125a?w=600&h=450&fit=crop" alt="Parent with baby" className="w-full h-[450px] object-cover" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Village+ tier ─────────────────────────────────────────────────────── */}
        <section className="px-6 py-24 bg-secondary/30">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <span className="tv-mono" style={{ color: "hsl(var(--accent))" }}>Simple pricing</span>
              <h2 className="font-heading text-3xl sm:text-4xl font-bold mt-2 mb-3" style={{ color: "var(--ink)", letterSpacing: "-0.04em", lineHeight: 1.1, fontVariationSettings: "'opsz' 72" }}>Free forever. Village+ when you want more.</h2>
              <p className="text-muted-foreground max-w-xl mx-auto">Everything that matters is free. Village+ unlocks the extras — honest pricing, cancel any time.</p>
            </div>
            <div className="grid md:grid-cols-2 gap-6 items-start">
              {/* Free — tighter radius, understated */}
              <div className="bg-card border border-border/50 rounded-[10px] p-7" style={{ boxShadow: "var(--shadow-card)" }}>
                <div className="flex items-baseline justify-between mb-5">
                  <h3 className="font-heading font-medium text-xl" style={{ color: "var(--ink)" }}>Village Free</h3>
                  <div className="text-right"><p className="text-2xl font-bold" style={{ color: "var(--ink)" }}>$0</p><p className="text-xs" style={{ color: "var(--ink-3)" }}>forever</p></div>
                </div>
                <ul className="space-y-3 text-sm mb-7" style={{ color: "var(--ink)" }}>
                  {["All Spaces & discussions (fair-use weekly limit)", "Group Chats — national + local (daily fair-use limit)", "Anonymous posting", "Browse & RSVP to events", "Stall donation groups", "Verified clinician replies", "Crisis resources"].map(t => (
                    <li key={t} className="flex items-start gap-2"><IconCheck size={16} style={{color:"var(--sage)",flexShrink:0,marginTop:"2px"}} /><span>{t}</span></li>
                  ))}
                </ul>
                <Link to="/register" className="block"><Button variant="outline" className="w-full rounded-[8px]">Join free</Button></Link>
              </div>
              {/* Village+ — generous radius, premium feel */}
              <div className="relative bg-card rounded-[20px] border-2 p-7" style={{ borderColor: "hsl(var(--primary))", boxShadow: "0 0 0 4px hsl(var(--primary) / 0.08), var(--shadow-lg)" }}>
                <span className="absolute -top-3 left-6 px-3 py-1 rounded-[4px] text-[11px] font-semibold uppercase tracking-wide" style={{ background: "hsl(var(--primary))", color: "hsl(var(--primary-foreground))" }}>Most popular</span>
                <div className="flex items-baseline justify-between mb-5">
                  <h3 className="font-heading font-medium text-xl flex items-center gap-2" style={{ color: "var(--ink)" }}>
                    <IconSpark size={18} style={{color:"hsl(var(--primary))"}} />Village+
                  </h3>
                  <div className="text-right"><p className="text-2xl font-bold" style={{ color: "var(--ink)" }}>$9.99<span className="text-sm font-normal" style={{ color: "var(--ink-3)" }}>/mo</span></p><p className="text-xs" style={{ color: "var(--ink-3)" }}>cancel any time</p></div>
                </div>
                <ul className="space-y-3 text-sm mb-7" style={{ color: "var(--ink)" }}>
                  {["Everything in Free — unlimited", "Private messaging with any parent", "Host your own events", "The Village Stall — buy, sell & swap", "Priority support", "Early access to new features"].map(t => (
                    <li key={t} className="flex items-start gap-2"><IconCheck size={16} style={{color:"var(--sage)",flexShrink:0,marginTop:"2px"}} /><span>{t}</span></li>
                  ))}
                </ul>
                <Link to="/register" className="block"><Button className="w-full rounded-[8px]" style={{ background: "hsl(var(--primary))", color: "hsl(var(--primary-foreground))" }}>Start with Village+</Button></Link>
              </div>
            </div>
          </div>
        </section>

        {/* ── Privacy TL;DR ─────────────────────────────────────────────────────── */}
        <section className="px-6 py-20" style={{ background: "var(--paper-2)", borderTop: "1px solid var(--line)", borderBottom: "1px solid var(--line)" }}>
          <div className="max-w-4xl mx-auto">
            <div className="mb-12">
              <span className="tv-mono" style={{ color: "hsl(var(--accent))" }}>Privacy</span>
              <h2 className="font-heading text-2xl sm:text-3xl font-medium mt-3 mb-2" style={{ color: "var(--ink)", letterSpacing: "-0.02em" }}>
                Your privacy, in plain English
              </h2>
              <p style={{ color: "var(--ink-2)", fontSize: "15px" }}>Because you shouldn't need a law degree to understand what happens to your words.</p>
            </div>
            {/* Clean borderless rows — no card boxes */}
            <div className="grid sm:grid-cols-2 gap-x-16">
              {[
                { title: "Anonymous when you want", desc: "Flip any post to anonymous — no name, no avatar, no trace back to you.", colour: "var(--dusk)" },
                { title: "We don't sell your data", desc: "Not to advertisers, not to brokers, not to anyone. Ever.", colour: "var(--sage)" },
                { title: "Australian privacy law", desc: "Your data is protected under the Australian Privacy Principles, with primary storage in Australia.", colour: "var(--honey)" },
                { title: "Delete anything, any time", desc: "Your account, your posts, your messages — gone when you say so.", colour: "var(--clay)" },
              ].map((item) => (
                <div key={item.title} className="flex gap-5 py-6 border-b" style={{ borderColor: "var(--line)" }}>
                  <div className="shrink-0 w-1 rounded-full mt-1 self-stretch" style={{ background: item.colour, opacity: 0.6 }} />
                  <div>
                    <p className="font-heading font-medium text-[15px] mb-1.5 leading-snug" style={{ color: "var(--ink)" }}>{item.title}</p>
                    <p className="text-sm leading-relaxed" style={{ color: "var(--ink-2)" }}>{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-8"><Link to="/privacy" className="text-sm hover:underline" style={{ color: "hsl(var(--accent))" }}>Read the full Privacy Policy →</Link></div>
          </div>
        </section>

        {/* ── For Clinicians strip ───────────────────────────────────────────────── */}
        <section className="px-6 py-20">
          <div className="max-w-5xl mx-auto">
            <div className="bg-card rounded-3xl border border-border/50 p-8 sm:p-12 flex flex-col lg:flex-row items-start lg:items-center gap-8 overflow-hidden relative">
              <div className="absolute inset-0 opacity-[0.04] pointer-events-none" style={{ background: `radial-gradient(ellipse at top right, hsl(var(--primary)) 0%, transparent 60%)` }} />
              <div className="relative flex-1">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/20 mb-4"><Stethoscope className="h-4 w-4 text-sky-500" /><span className="text-xs font-semibold text-sky-600 dark:text-sky-400 uppercase tracking-wide">Healthcare professionals</span></div>
                <h2 className="font-heading text-2xl sm:text-3xl font-bold text-foreground mb-3">Somewhere you can safely refer a struggling mum</h2>
                <p className="text-muted-foreground mb-5 max-w-xl">Our Little Village is designed to be referral-ready — moderated, crisis-aware, anonymous-capable, with verified clinician voices and local community on tap.</p>
                <Link to="/for-clinicians"><Button className="rounded-[8px] bg-primary text-primary-foreground hover:bg-primary/90 gap-2"><Stethoscope className="h-4 w-4" />For Clinicians<ArrowRight className="h-4 w-4" /></Button></Link>
              </div>
              <div className="relative hidden lg:flex flex-col gap-3 shrink-0">
                {[{ icon: <ShieldCheck className="h-5 w-5 text-sky-500" />, t: "Verified Partner badge" }, { icon: <IconPhone size={20} style={{color:"var(--danger)"}} />, t: "Crisis resources built in" }, { icon: <IconLock size={20} style={{ color: "var(--dusk)" }} />, t: "Anonymous posting option" }].map(x => (
                  <div key={x.t} className="flex items-center gap-3 bg-secondary/40 rounded-[10px] px-4 py-3 min-w-[240px]">{x.icon}<span className="text-sm font-medium text-foreground">{x.t}</span></div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── Final CTA ─────────────────────────────────────────────────────────── */}
        <section className="px-6 py-24" style={{ background: "var(--paper-2)" }}>
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="font-heading text-3xl sm:text-4xl font-bold mb-4" style={{ color: "var(--ink)", letterSpacing: "-0.04em", lineHeight: 1.1, fontVariationSettings: "'opsz' 100" }}>Ready to find your village?</h2>
            <p className="mb-8 max-w-xl mx-auto" style={{ color: "var(--ink-2)" }}>Join Australian parents supporting each other through the beautiful, exhausting, rewarding chaos of parenthood.</p>
            <Link to="/register">
              <Button size="lg" className="rounded-[8px] px-12 h-12 text-lg" style={{ background: "var(--ink)", color: "var(--paper)" }} data-testid="cta-join-btn">
                Join Our Little Village
              </Button>
            </Link>
            <p className="text-xs mt-4" style={{ color: "var(--ink-3)" }}>Free to join · No credit card · Cancel any time</p>
          </div>
        </section>

        {/* ── Footer ────────────────────────────────────────────────────────────── */}
        <footer className="px-6 py-10" style={{ background: "var(--ink)" }}>
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
            <Wordmark size={20} invert />
            <div className="flex items-center gap-4 text-sm flex-wrap justify-center" style={{ color: "var(--brand-cream)" }}>
              <Link to="/for-clinicians" className="opacity-70 hover:opacity-100 transition-opacity">For Clinicians</Link>
              <Link to="/terms" className="opacity-70 hover:opacity-100 transition-opacity">Terms</Link>
              <Link to="/privacy" className="opacity-70 hover:opacity-100 transition-opacity">Privacy</Link>
              <Link to="/community-guidelines" className="opacity-70 hover:opacity-100 transition-opacity">Community Guidelines</Link>
              <Link to="/contact" className="opacity-70 hover:opacity-100 transition-opacity">Contact</Link>
            </div>
            <p className="text-xs opacity-50" style={{ color: "var(--brand-cream)" }}>&copy; {new Date().getFullYear()} Our Little Village · Made in Australia</p>
          </div>
        </footer>

      </div>{/* end desktop */}

      {/* ── Slide-in animation ─────────────────────────────────────────────────── */}
      <style>{`
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

    </div>
  );
}
