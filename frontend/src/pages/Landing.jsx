import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Moon, Sun, MessageCircle, Users, Shield, Heart, ArrowRight, Clock, MapPin, Calendar, ChevronRight } from "lucide-react";

const API_URL = process.env.REACT_APP_BACKEND_URL;

// ── Demo data ─────────────────────────────────────────────────────────────────
const DEMO_POSTS = [
  {
    id: 1,
    author: "Sarah M.",
    avatar: "S",
    stage: "Baby (0–12 months)",
    time: "2 hours ago",
    category: "Baby Sleep",
    content: "My 4-month-old suddenly stopped sleeping through the night 😩 We had 6 weeks of 5-hour stretches and now we're back to every 2 hours. Is this the 4-month regression everyone talks about?",
    replies: 14,
    likes: 23,
  },
  {
    id: 2,
    author: "Anonymous",
    avatar: "?",
    stage: null,
    time: "5 hours ago",
    category: "Parent Wellbeing",
    content: "I love my kids but I genuinely miss my old life sometimes. Is that terrible? I don't have anyone I can say this to without being judged.",
    replies: 31,
    likes: 87,
    isAnon: true,
  },
  {
    id: 3,
    author: "James R.",
    avatar: "J",
    stage: "Toddler (1–3 years)",
    time: "Yesterday",
    category: "Dads",
    content: "First time taking my toddler to the park solo and honestly loved every second. We stayed for 2 hours. He ate sand twice but I think that's fine.",
    replies: 8,
    likes: 45,
  },
];

const DEMO_CHAT = [
  { id: 1, author: "Mia", avatar: "M", time: "11:42 PM", content: "anyone else's toddler just... not sleeping at all tonight?", isOwn: false },
  { id: 2, author: "You", avatar: "Y", time: "11:43 PM", content: "yes!! we're on hour 3 of attempting bedtime 😭", isOwn: true },
  { id: 3, author: "TomD", avatar: "T", time: "11:43 PM", content: "solidarity. my 8 month old is going through something", isOwn: false },
  { id: 4, author: "Mia", avatar: "M", time: "11:44 PM", content: "at least we're all awake together lol. that's why I love this club", isOwn: false },
  { id: 5, author: "You", avatar: "Y", time: "11:45 PM", content: "honestly this chat is the only thing keeping me sane rn", isOwn: true },
];

const DEMO_EVENTS = [
  {
    id: 1,
    title: "Morning Playgroup — Newborns & Babies",
    date: "Thu 10 Apr",
    time: "9:30 AM",
    venue: "Centennial Park, Paddington",
    distance: "1.2km away",
    organiser: "Sarah M.",
    rsvp: 8,
    limit: 15,
    category: "Playgroup",
    emoji: "👶",
  },
  {
    id: 2,
    title: "Mums Coffee Morning",
    date: "Sat 12 Apr",
    time: "10:00 AM",
    venue: "The Grounds, Alexandria",
    distance: "2.4km away",
    organiser: "Emma L.",
    rsvp: 12,
    limit: 20,
    category: "Social",
    emoji: "☕",
  },
  {
    id: 3,
    title: "Dad & Toddler Catch-up",
    date: "Sun 13 Apr",
    time: "8:00 AM",
    venue: "Bicentennial Park, Homebush",
    distance: "5.1km away",
    organiser: "James R.",
    rsvp: 5,
    limit: 10,
    category: "Dad Group",
    emoji: "👨",
  },
];

// ── Demo Tab Components ───────────────────────────────────────────────────────
function DemoSupportSpaces() {
  return (
    <div className="space-y-3">
      {DEMO_POSTS.map((post) => (
        <div key={post.id} className="bg-card border border-border/50 rounded-2xl p-4">
          <div className="flex items-start gap-3 mb-3">
            <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
              post.isAnon ? "bg-muted text-muted-foreground" : "bg-primary/20 text-primary"
            }`}>
              {post.avatar}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`text-sm font-medium ${post.isAnon ? "text-muted-foreground italic" : "text-foreground"}`}>
                  {post.author}
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">{post.category}</span>
              </div>
              <p className="text-xs text-muted-foreground">{post.time}</p>
            </div>
          </div>
          <p className="text-sm text-foreground leading-relaxed mb-3">{post.content}</p>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span>💬 {post.replies} replies</span>
            <span>❤️ {post.likes}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function DemoChatCircles() {
  return (
    <div className="flex flex-col gap-3">
      {/* Room header */}
      <div className="bg-card border border-border/50 rounded-2xl px-4 py-3 flex items-center gap-3">
        <span className="text-xl">🌙</span>
        <div>
          <p className="font-medium text-foreground text-sm">3am Club</p>
          <p className="text-xs text-green-500">12 parents online now</p>
        </div>
      </div>
      {/* Messages */}
      <div className="bg-card border border-border/50 rounded-2xl p-4 space-y-3">
        {DEMO_CHAT.map((msg) => (
          <div key={msg.id} className={`flex ${msg.isOwn ? "justify-end" : "justify-start"} gap-2`}>
            {!msg.isOwn && (
              <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary shrink-0 mt-0.5">
                {msg.avatar}
              </div>
            )}
            <div className="max-w-[80%]">
              {!msg.isOwn && <p className="text-xs text-muted-foreground mb-1 ml-1">{msg.author}</p>}
              <div className={`rounded-2xl px-3 py-2 text-sm shadow-sm ${
                msg.isOwn ? "bg-primary text-primary-foreground" : "bg-secondary/60 text-foreground"
              }`}>
                {msg.content}
              </div>
              <p className={`text-xs text-muted-foreground mt-0.5 ${msg.isOwn ? "text-right mr-1" : "ml-1"}`}>{msg.time}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="bg-card border border-border/50 rounded-2xl px-4 py-3 flex items-center gap-3">
        <div className="flex-1 bg-secondary/50 rounded-full px-4 py-2 text-sm text-muted-foreground">
          Join to chat...
        </div>
        <Link to="/register">
          <Button size="sm" className="rounded-full bg-primary text-primary-foreground text-xs px-4">
            Join free
          </Button>
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
          <div className="shrink-0 text-center">
            <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
              <span className="text-xl">{event.emoji}</span>
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-1">
              <p className="font-medium text-foreground text-sm leading-snug">{event.title}</p>
              <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium shrink-0">{event.category}</span>
            </div>
            <p className="text-xs text-muted-foreground mb-1">📅 {event.date} · {event.time}</p>
            <p className="text-xs text-muted-foreground mb-2">📍 {event.venue} · <span className="text-primary">{event.distance}</span></p>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">{event.rsvp}/{event.limit} going</span>
              <Link to="/register">
                <Button size="sm" variant="outline" className="rounded-full text-xs h-7 px-3">
                  RSVP
                </Button>
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
  const [darkMode, setDarkMode] = useState(
    document.documentElement.classList.contains("dark")
  );
  const [demoTab, setDemoTab] = useState("spaces");

  useEffect(() => {
    fetch(`${API_URL}/api/seed`, { method: "POST" }).catch(() => {});
    const user = localStorage.getItem("user");
    if (user) navigate("/dashboard");
  }, [navigate]);

  const toggleTheme = () => {
    const next = !darkMode;
    setDarkMode(next);
    if (next) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  };

  const features = [
    {
      emoji: "🌙",
      title: "Chat Circles",
      description: "Real-time chat grouped by suburb, parenting stage, and national rooms. The 3am Club is always open."
    },
    {
      emoji: "💬",
      title: "Support Spaces",
      description: "Topic-based forums for real conversations — sleep, feeding, mental health, and everything in between."
    },
    {
      emoji: "🔒",
      title: "Choose Your Privacy",
      description: "Post with your name by default. Switch to anonymous on any post when you need to — no name, no avatar shown."
    },
    {
      emoji: "📍",
      title: "Local Community",
      description: "Connect with parents in your suburb. Find your Local Circle and see who's nearby in your area."
    },
    {
      emoji: "📅",
      title: "Events",
      description: "Browse and RSVP to local playgroups, meetups, and parent events. Create your own with one tap."
    },
    {
      emoji: "👥",
      title: "Private Messaging",
      description: "Build real friendships and message privately. One community, genuine connections."
    }
  ];

  const DEMO_TABS = [
    { id: "spaces", label: "Support Spaces", emoji: "💬" },
    { id: "circles", label: "Chat Circles", emoji: "🌙" },
    { id: "events", label: "Events", emoji: "📅" },
  ];

  return (
    <div className="min-h-screen bg-background transition-colors duration-300">

      {/* ── Hero ───────────────────────────────────── */}
      <div className="relative overflow-hidden">
        <div className="hero-gradient absolute inset-0"></div>

        {/* Nav */}
        <nav className="relative z-10 px-6 py-4 flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center">
            <img src="/BG Removed- Main Logo.png" alt="The Village" className="h-48 w-auto" />
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={toggleTheme} className="rounded-full" data-testid="theme-toggle">
              {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>
            <Link to="/login">
              <Button variant="ghost" className="text-muted-foreground hover:text-foreground" data-testid="nav-login-btn">
                Sign In
              </Button>
            </Link>
            <Link to="/register">
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full px-6 shadow-[0_0_15px_hsl(var(--primary)/0.3)]" data-testid="nav-register-btn">
                Join Free
              </Button>
            </Link>
          </div>
        </nav>

        {/* Hero content */}
        <div className="relative z-10 px-6 pt-16 pb-24 max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                </span>
                <span className="text-sm text-muted-foreground">Parents online right now</span>
              </div>

              <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground leading-tight">
                You're not alone on this <span className="text-primary">journey</span>
              </h1>

              <p className="text-lg text-muted-foreground max-lg">
                Whether it's 3am and you're breastfeeding, or you just need someone who gets it —
                The Village is here. Real Australian parents, real conversations, day and night.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <Link to="/register">
                  <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full px-8 h-14 text-lg shadow-[0_0_20px_hsl(var(--primary)/0.3)] btn-shine group" data-testid="hero-join-btn">
                    Join The Village
                    <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
                <Link to="/login">
                  <Button variant="outline" size="lg" className="rounded-full px-8 h-14 text-lg border-border hover:bg-secondary" data-testid="hero-signin-btn">
                    I Have an Account
                  </Button>
                </Link>
              </div>

              <div className="flex items-center gap-6 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5"><span className="text-primary">✓</span> Free to join</span>
                <span className="flex items-center gap-1.5"><span className="text-primary">✓</span> Australian parents</span>
                <span className="flex items-center gap-1.5"><span className="text-primary">✓</span> You control your privacy</span>
              </div>

              <p className="text-sm text-muted-foreground italic">
                "It takes a village to raise a child" — African Proverb
              </p>
            </div>

            {/* Hero image + floating card */}
            <div className="relative hidden lg:block">
              <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent z-10"></div>
              <div className="rounded-3xl overflow-hidden border border-border/30 shadow-2xl">
                <img
                  src="https://images.unsplash.com/photo-1476703993599-0035a21b17a9?w=600&h=500&fit=crop"
                  alt="Family together"
                  className="w-full h-[500px] object-cover"
                />
              </div>
              <div className="absolute -bottom-6 -left-6 bg-card p-4 rounded-2xl border border-border/50 shadow-lg z-20">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                    <Heart className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">Emily just posted</p>
                    <p className="text-xs text-muted-foreground">"Finally got 4 hours of sleep! 🎉"</p>
                  </div>
                </div>
              </div>
              <div className="absolute -top-4 -right-4 bg-card px-4 py-2 rounded-full border border-border/50 shadow-lg z-20 text-sm font-medium text-foreground">
                🌙 3am Club is live
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Features ───────────────────────────────── */}
      <section className="px-6 py-24 bg-secondary/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-heading text-3xl sm:text-4xl font-bold text-foreground mb-4">
              Everything a parent needs
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              From 3am feeds to school gate friendships — The Village has a space for every moment of your parenting journey.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <div
                key={index}
                className="bg-card p-6 rounded-2xl border border-border/50 hover:border-primary/30 transition-all card-hover animate-fade-in"
                style={{ animationDelay: `${index * 0.08}s`, background: `radial-gradient(ellipse at top left, hsl(var(--primary)/0.06) 0%, transparent 60%), hsl(var(--card))` }}
              >
                <div className="text-3xl mb-4">{feature.emoji}</div>
                <h3 className="font-heading font-bold text-lg text-foreground mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Interactive Demo ────────────────────────── */}
      <section className="px-6 py-24">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <span className="text-xs font-semibold uppercase tracking-widest text-primary">Live Preview</span>
            <h2 className="font-heading text-3xl sm:text-4xl font-bold text-foreground mt-2 mb-3">
              See what's happening right now
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Browse a snapshot of the community before you sign up — no account needed.
            </p>
          </div>

          {/* Tab bar */}
          <div className="flex items-center gap-2 mb-6 bg-secondary/50 rounded-2xl p-1.5 max-w-sm mx-auto">
            {DEMO_TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setDemoTab(tab.id)}
                className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                  demoTab === tab.id
                    ? "bg-card text-foreground shadow-sm border border-border/50"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <span>{tab.emoji}</span>
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Demo content */}
          <div className="relative">
            <div className="max-w-2xl mx-auto">
              {demoTab === "spaces" && <DemoSupportSpaces />}
              {demoTab === "circles" && <DemoChatCircles />}
              {demoTab === "events" && <DemoEvents />}
            </div>

            {/* Bottom fade + join overlay */}
            <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent pointer-events-none" />
            <div className="absolute bottom-0 left-0 right-0 flex justify-center pb-2">
              <Link to="/register">
                <Button className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full px-8 h-11 shadow-[0_0_20px_hsl(var(--primary)/0.3)]">
                  Join free
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Chat Circles preview ───────────────────── */}
      <section className="px-6 py-24 bg-secondary/30">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <span className="text-xs font-semibold uppercase tracking-widest text-primary">Chat Circles</span>
              <h2 className="font-heading text-3xl sm:text-4xl font-bold text-foreground">
                A chat room for every moment
              </h2>
              <p className="text-muted-foreground">
                National circles, local suburb rooms, and stage-specific spaces. Find your people wherever you are in your parenting journey.
              </p>

              <div className="space-y-3">
                {[
                  { icon: "🌙", name: "3am Club", desc: "For those late-night moments — always someone awake", featured: true },
                  { icon: "👩", name: "Mum Chat", desc: "A dedicated space just for mums" },
                  { icon: "👨", name: "Dad Chat", desc: "Real talk for dads, no judgment" },
                  { icon: "📍", name: "Your Local Circle", desc: "Chat with parents in your suburb" },
                ].map((room, idx) => (
                  <div key={idx} className={`flex items-center gap-4 p-4 rounded-xl border transition-colors ${room.featured ? "bg-primary/5 border-primary/30" : "bg-card border-border/50 hover:border-primary/30"}`}>
                    <span className="text-2xl">{room.icon}</span>
                    <div className="flex-1">
                      <p className="font-medium text-foreground text-sm">{room.name}</p>
                      <p className="text-xs text-muted-foreground">{room.desc}</p>
                    </div>
                    {room.featured && <span className="text-xs text-primary font-semibold">Live now</span>}
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="rounded-3xl overflow-hidden border border-border/30">
                <img
                  src="https://images.unsplash.com/photo-1491013516836-7db643ee125a?w=600&h=450&fit=crop"
                  alt="Parent with baby"
                  className="w-full h-[450px] object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Privacy trust section ───────────────────── */}
      <section className="px-6 py-16 bg-primary/5 border-y border-primary/15">
        <div className="max-w-4xl mx-auto text-center">
          <div className="text-4xl mb-4">🔒</div>
          <h2 className="font-heading text-2xl sm:text-3xl font-bold text-foreground mb-4">
            Your privacy, your choice
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto mb-8">
            Posts are named by default so your community knows you. When you need privacy,
            you can switch any post or reply to anonymous — no name, no avatar, no trace.
            You choose, every time.
          </p>
          <div className="flex flex-wrap justify-center gap-6 text-sm">
            {["No data selling", "No advertising profiles", "Anonymous posting is an option", "Australian parents only"].map(t => (
              <span key={t} className="flex items-center gap-1.5 text-foreground font-medium">
                <span className="text-primary">✓</span> {t}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ────────────────────────────────────── */}
      <section className="px-6 py-24 bg-gradient-to-b from-secondary/50 to-background">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="font-heading text-3xl sm:text-4xl font-bold text-foreground mb-4">
            Ready to find your village?
          </h2>
          <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
            Join thousands of Australian parents supporting each other through the beautiful, exhausting, rewarding chaos of parenthood.
          </p>
          <Link to="/register">
            <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full px-12 h-14 text-lg shadow-[0_0_25px_hsl(var(--primary)/0.4)]" data-testid="cta-join-btn">
              Join The Village
            </Button>
          </Link>
          <p className="text-xs text-muted-foreground mt-4">No credit card. No commitment. Cancel any time.</p>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────── */}
      <footer className="px-6 py-8 border-t border-border/50">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center">
            <img src="/the_village_wordmark_light.png" alt="The Village" className="h-16 w-auto opacity-80" />
          </div>
          <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap justify-center">
            <Link to="/terms" className="hover:text-foreground transition-colors">Terms</Link>
            <Link to="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
            <Link to="/community-guidelines" className="hover:text-foreground transition-colors">Community Guidelines</Link>
            <Link to="/contact" className="hover:text-foreground transition-colors">Contact</Link>
          </div>
          <p className="text-xs text-muted-foreground">&copy; {new Date().getFullYear()} The Village</p>
        </div>
      </footer>
    </div>
  );
}
