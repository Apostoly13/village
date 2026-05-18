import { Link } from "react-router-dom";
import { ShieldCheck, Heart, Download, ArrowRight, Moon, Sun, Stethoscope } from "lucide-react";
import { Button } from "../components/ui/button";
import Navigation from "../components/Navigation";
import { useTheme } from "../useTheme";

const WHY_RECOMMEND = [
  {
    icon: "🕐",
    title: "24/7, no waitlist",
    body: "Peer support available at 3am when your patient can't sleep and has no one to call. No appointment needed.",
  },
  {
    icon: "🙈",
    title: "Anonymous posting",
    body: "Patients can share what they're really feeling without their name attached — reducing the barrier of stigma.",
  },
  {
    icon: "🛡️",
    title: "Moderated, safe space",
    body: "All content is moderated. Crisis resources are surfaced in mental health spaces. Community guidelines are strictly enforced.",
  },
  {
    icon: "👩‍👧",
    title: "Peer wisdom, not advice",
    body: "Parents support parents — a complement to clinical care, not a replacement for it. We actively encourage users to follow their healthcare provider's guidance.",
  },
  {
    icon: "📍",
    title: "Local and national",
    body: "Local area-based Chat Rooms, local events and meetups, and national spaces for topics like postnatal anxiety, feeding, and sleep.",
  },
  {
    icon: "🆓",
    title: "Free to try",
    body: "Every new member gets a 7-day free trial with full access. The free tier keeps core features — posting, reading, group chats, anonymous sharing — available at no cost.",
  },
];

const CRISIS_LINES = [
  { name: "PANDA", desc: "Perinatal anxiety & depression", number: "1300 726 306" },
  { name: "Lifeline", desc: "24/7 crisis support", number: "13 11 14" },
  { name: "Beyond Blue", desc: "Mental health support", number: "1300 22 4636" },
];

export default function ForClinicians({ user }) {
  const [, setThemeSetting, themeResolved] = useTheme();
  const darkMode = themeResolved === "night";
  const toggleTheme = () => setThemeSetting(darkMode ? "day" : "night");

  return (
    <div className={`min-h-screen bg-background ${user ? "lg:pl-60 lg:pb-0" : ""}`}>

      {/* ── Navigation: logged-in users get the full sidebar ── */}
      {user ? (
        <Navigation user={user} />
      ) : (
        /* ── Slim public nav for guests ── */
        <nav className="sticky top-0 z-50 border-b border-border/50 bg-background/95 backdrop-blur">
          <div className="max-w-5xl mx-auto px-5 py-3 flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2">
              <Stethoscope className="h-4 w-4 text-primary" />
              <span className="font-heading font-bold text-sm text-foreground">Our Little Village</span>
              <span className="hidden sm:inline text-xs text-muted-foreground">· For Clinicians</span>
            </Link>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={toggleTheme} className="rounded-full h-8 w-8">
                {darkMode ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
              </Button>
              <Link to="/login">
                <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground text-xs h-8 px-3">
                  Sign In
                </Button>
              </Link>
              <Link to="/register">
                <Button size="sm" className="rounded-full text-xs h-8 px-4">
                  Join Free
                </Button>
              </Link>
            </div>
          </div>
        </nav>
      )}

      <main className="max-w-4xl mx-auto px-4 pt-10 pb-16">

        {/* Hero */}
        <div className="mb-10 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-600 dark:text-sky-400 text-xs font-semibold mb-4">
            <ShieldCheck className="h-3.5 w-3.5" />
            For healthcare professionals
          </div>
          <h1 className="font-heading text-2xl sm:text-3xl font-bold text-foreground mb-3 leading-tight">
            Recommend Our Little Village to your patients
          </h1>
          <p className="text-sm text-muted-foreground max-w-xl mx-auto leading-relaxed">
            A moderated, 24/7 peer-support community for Australian parents — built as a complement to clinical care, not a replacement for it.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-6">
            <a
              href="/The-Village-Clinician-OnePageR.pdf"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors"
            >
              <Download className="h-4 w-4" />
              Download one-pager (PDF)
            </a>
            <Link
              to="/register"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-border/60 text-foreground text-sm font-medium hover:border-border hover:bg-muted/30 transition-colors"
            >
              Try it yourself
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        {/* What it is */}
        <div className="mb-8 village-card p-6">
          <h2 className="font-heading font-bold text-lg text-foreground mb-3">What is Our Little Village?</h2>
          <p className="text-sm text-muted-foreground leading-relaxed mb-4">
            Our Little Village is a judgment-free community for Australian parents — from expectant mothers through to parents of teenagers. Members post questions, share experiences, and support each other around the clock, in topic-based Spaces, live Group Chats, Village+ Communities, and a local-area community marketplace.
          </p>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
            {[
              { emoji: "💬", label: "Group Chats", sub: "Real-time support" },
              { emoji: "🗣️", label: "Spaces", sub: "Topic discussions" },
              { emoji: "🏘️", label: "Communities", sub: "Village+ groups" },
              { emoji: "📍", label: "Local Events", sub: "In-person meetups" },
              { emoji: "🛍️", label: "The Stall", sub: "Community marketplace" },
              { emoji: "🙈", label: "Anonymous", sub: "No stigma barrier" },
            ].map(({ emoji, label, sub }) => (
              <div key={label} className="bg-secondary/40 rounded-xl p-3 text-center">
                <span className="text-2xl block mb-1">{emoji}</span>
                <p className="text-xs font-semibold text-foreground">{label}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">{sub}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Why recommend */}
        <h2 className="font-heading font-bold text-lg text-foreground mb-4">Why clinicians recommend it</h2>
        <div className="grid sm:grid-cols-2 gap-4 mb-8">
          {WHY_RECOMMEND.map(({ icon, title, body }) => (
            <div key={title} className="village-card p-5 flex gap-4">
              <span className="text-2xl shrink-0">{icon}</span>
              <div>
                <p className="font-heading font-semibold text-sm text-foreground mb-1">{title}</p>
                <p className="text-xs text-muted-foreground leading-relaxed">{body}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Crisis resources baked in */}
        <div className="mb-8 bg-sky-500/5 border border-sky-500/20 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <Heart className="h-4 w-4 text-sky-600 dark:text-sky-400 shrink-0" />
            <h2 className="font-heading font-semibold text-sm text-foreground">Crisis resources are built in</h2>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed mb-4">
            In mental-health Spaces, the following crisis lines are surfaced automatically. Members are never left without a path to professional support.
          </p>
          <div className="space-y-2">
            {CRISIS_LINES.map(({ name, desc, number }) => (
              <div key={name} className="flex items-center justify-between gap-3 py-2 border-b border-sky-500/10 last:border-0">
                <div>
                  <p className="text-sm font-semibold text-foreground">{name}</p>
                  <p className="text-xs text-muted-foreground">{desc}</p>
                </div>
                <a
                  href={`tel:${number.replace(/\s/g, "")}`}
                  className="text-sm font-semibold text-sky-600 dark:text-sky-400 hover:underline shrink-0"
                >
                  {number}
                </a>
              </div>
            ))}
          </div>
        </div>

        {/* How to refer */}
        <div className="mb-8 village-card p-6">
          <h2 className="font-heading font-bold text-lg text-foreground mb-3">How to refer a patient</h2>
          <p className="text-sm text-muted-foreground leading-relaxed mb-4">
            No formal referral process needed. Simply share the link or mention it during a consultation:
          </p>
          <div className="space-y-3">
            {[
              { step: "1", text: "Direct your patient to ourlittlevillage.com.au" },
              { step: "2", text: "They register with an email address — takes under 2 minutes" },
              { step: "3", text: "A 7-day full-access trial starts automatically, then a free tier kicks in" },
            ].map(({ step, text }) => (
              <div key={step} className="flex items-center gap-4">
                <div className="w-7 h-7 rounded-full bg-[var(--honey-wash)] text-[var(--honey)] text-xs font-bold flex items-center justify-center shrink-0">{step}</div>
                <p className="text-sm text-foreground">{text}</p>
              </div>
            ))}
          </div>
          <div className="mt-5 p-4 bg-secondary/40 rounded-xl">
            <p className="text-xs text-muted-foreground mb-1 font-medium">Shareable link</p>
            <p className="text-sm font-semibold text-foreground">ourlittlevillage.com.au</p>
          </div>
        </div>

        {/* Contact */}
        <div className="mb-8 bg-[var(--paper-3)] border border-[var(--sage)]/15 rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4 justify-between">
          <div>
            <h2 className="font-heading font-semibold text-sm text-foreground mb-1">Want to partner with us?</h2>
            <p className="text-xs text-muted-foreground leading-relaxed">
              We work with hospitals, maternal health clinics, and PANDA-affiliated services. Reach out to discuss verified partner status, co-branded materials, or bulk referral programs.
            </p>
          </div>
          <a
            href="mailto:partners@ourlittlevillage.com.au"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors whitespace-nowrap shrink-0"
          >
            Get in touch
          </a>
        </div>

        {/* Footer */}
        <div className="mt-12 pt-8 border-t border-border/50 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <Link to="/" className="font-semibold text-foreground hover:text-primary transition-colors">
            Our Little Village
          </Link>
          <div className="flex items-center gap-4">
            <Link to="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
            <Link to="/terms" className="hover:text-foreground transition-colors">Terms</Link>
            <Link to="/contact" className="hover:text-foreground transition-colors">Contact</Link>
            <Link to="/" className="hover:text-foreground transition-colors">← Back to home</Link>
          </div>
          <p>&copy; {new Date().getFullYear()} Our Little Village · Made in Australia</p>
        </div>
      </main>
    </div>
  );
}
