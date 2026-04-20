import { Link } from "react-router-dom";
import { ShieldCheck, Heart, Clock, Users, MessageCircle, Download, ArrowRight, MapPin } from "lucide-react";
import { Button } from "../components/ui/button";
import Navigation from "../components/Navigation";
import AppFooter from "../components/AppFooter";

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
    body: "Parents support parents — not a replacement for clinical care, but a complement to it. We encourage users to follow their healthcare provider's guidance.",
  },
  {
    icon: "📍",
    title: "Local and national",
    body: "Local events, suburb-based circles, and national spaces for topics like postnatal anxiety, feeding, and sleep.",
  },
  {
    icon: "🆓",
    title: "Free to try",
    body: "Every new member gets a 7-day free trial with full access. The free tier keeps core features — posting, reading, anonymous sharing — available at no cost.",
  },
];

const CRISIS_LINES = [
  { name: "PANDA", desc: "Perinatal anxiety & depression", number: "1300 726 306" },
  { name: "Lifeline", desc: "24/7 crisis support", number: "13 11 14" },
  { name: "Beyond Blue", desc: "Mental health support", number: "1300 22 4636" },
];

export default function ForClinicians({ user }) {
  return (
    <div className="min-h-screen bg-background pb-20 lg:pb-0">
      <Navigation user={user} />

      <main className="max-w-4xl mx-auto px-4 pt-20 lg:pt-24">

        {/* Hero */}
        <div className="mb-10 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-600 dark:text-sky-400 text-xs font-semibold mb-4">
            <ShieldCheck className="h-3.5 w-3.5" />
            For healthcare professionals
          </div>
          <h1 className="font-heading text-3xl sm:text-4xl font-bold text-foreground mb-4 leading-tight">
            Recommend The Village<br className="hidden sm:block" /> to your patients
          </h1>
          <p className="text-base text-muted-foreground max-w-xl mx-auto leading-relaxed">
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
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-border/60 text-foreground text-sm font-medium hover:border-primary/40 hover:bg-primary/5 transition-colors"
            >
              Try it yourself
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        {/* What it is */}
        <div className="mb-8 bg-card rounded-2xl border border-border/50 p-6">
          <h2 className="font-heading font-bold text-lg text-foreground mb-3">What is The Village?</h2>
          <p className="text-sm text-muted-foreground leading-relaxed mb-4">
            The Village is a judgment-free community for Australian parents — from expectant mothers through to parents of teenagers. Members post questions, share experiences, and support each other around the clock, in topic-based Spaces and live Group Chats.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { emoji: "💬", label: "Group Chats", sub: "Real-time support" },
              { emoji: "🗣️", label: "Spaces", sub: "Topic discussions" },
              { emoji: "📍", label: "Local events", sub: "In-person meetups" },
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
            <div key={title} className="bg-card rounded-2xl border border-border/50 p-5 flex gap-4">
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
        <div className="mb-8 bg-card rounded-2xl border border-border/50 p-6">
          <h2 className="font-heading font-bold text-lg text-foreground mb-3">How to refer a patient</h2>
          <p className="text-sm text-muted-foreground leading-relaxed mb-4">
            No formal referral process needed. Simply share the link or mention it during a consultation:
          </p>
          <div className="space-y-3">
            {[
              { step: "1", text: "Direct your patient to ourlittlevillage.au" },
              { step: "2", text: "They register with an email address — takes under 2 minutes" },
              { step: "3", text: "A 7-day full-access trial starts automatically, then a free tier" },
            ].map(({ step, text }) => (
              <div key={step} className="flex items-center gap-4">
                <div className="w-7 h-7 rounded-full bg-primary/15 text-primary text-xs font-bold flex items-center justify-center shrink-0">{step}</div>
                <p className="text-sm text-foreground">{text}</p>
              </div>
            ))}
          </div>
          <div className="mt-5 p-4 bg-secondary/40 rounded-xl">
            <p className="text-xs text-muted-foreground mb-1 font-medium">Shareable link</p>
            <p className="text-sm font-semibold text-foreground">ourlittlevillage.au</p>
          </div>
        </div>

        {/* Contact */}
        <div className="mb-8 bg-primary/5 border border-primary/15 rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4 justify-between">
          <div>
            <h2 className="font-heading font-semibold text-sm text-foreground mb-1">Want to partner with us?</h2>
            <p className="text-xs text-muted-foreground leading-relaxed">
              We work with hospitals, maternal health clinics, and PANDA-affiliated services. Reach out to discuss verified partner status, co-branded materials, or bulk referral programs.
            </p>
          </div>
          <a
            href="mailto:partners@thevillage.com.au"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors whitespace-nowrap shrink-0"
          >
            Get in touch
          </a>
        </div>

        <AppFooter />
      </main>
    </div>
  );
}
