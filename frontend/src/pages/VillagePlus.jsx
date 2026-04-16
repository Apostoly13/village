import { Link } from "react-router-dom";
import { Crown, Check, MessageCircle, PenSquare, Users, Calendar, MessageSquare, ArrowRight, ShoppingBag } from "lucide-react";
import { Button } from "../components/ui/button";
import Navigation from "../components/Navigation";
import AppFooter from "../components/AppFooter";

const PRICE_MONTHLY = 9.99;
const PRICE_ANNUAL  = 7.99; // per month billed annually

const FREE_FEATURES = [
  { label: "5 support space posts per week" },
  { label: "5 support space replies per week" },
  { label: "10 chat circle messages per day" },
  { label: "Anonymous posting — always" },
  { label: "Read all posts and comments" },
];

const PREMIUM_FEATURES = [
  { label: "Unlimited posts, replies & messages" },
  { label: "Create & manage community spaces" },
  { label: "Create & RSVP to local events" },
  { label: "Unlimited direct messages" },
  { label: "Crown badge on your profile" },
  { label: "Priority support & early feature access" },
  { label: <>Buy &amp; Swap marketplace — <em>Coming Soon *</em></> },
];

const COMPARISON = [
  { feature: "Support space posts",       free: "5/week",    plus: "Unlimited" },
  { feature: "Support space replies",     free: "5/week",    plus: "Unlimited" },
  { feature: "Chat circle messages",      free: "10/day",    plus: "Unlimited" },
  { feature: "Direct messages",          free: "—",         plus: "Unlimited" },
  { feature: "View events",              free: "—",         plus: "✓" },
  { feature: "Create events",            free: "—",         plus: "✓" },
  { feature: "Create communities",       free: "—",         plus: "✓" },
  { feature: "Anonymous posting",        free: "✓",         plus: "✓" },
  { feature: "Read all posts",           free: "✓",         plus: "✓" },
  { feature: "Crown badge",              free: "—",         plus: "✓" },
  { feature: "Buy & Swap marketplace",   free: "—",         plus: "Coming Soon" },
];

export default function VillagePlus({ user }) {
  const isPremium = user?.subscription_tier === "premium";
  const isTrial   = user?.subscription_tier === "trial";

  return (
    <div className="min-h-screen bg-background pb-20 lg:pb-0">
      <Navigation user={user} />

      <main className="max-w-3xl mx-auto px-4 pt-20 lg:pt-24 pb-16">

        {/* Hero */}
        <div className="relative text-center mb-12 rounded-3xl overflow-hidden py-12 px-6">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-500/15 via-primary/5 to-transparent pointer-events-none" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent pointer-events-none" />

          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/15 border border-primary/30 mb-6 shadow-sm">
              <Crown className="h-4 w-4 text-primary" />
              <span className="text-sm font-bold text-primary tracking-wide">Village+</span>
            </div>
            <h1 className="font-heading text-4xl sm:text-5xl font-bold text-foreground mb-4 leading-tight">
              Support without limits
            </h1>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed mb-4">
              The Village is built for parents. Village+ removes every limit so you can connect, post, and support freely — any time of day.
            </p>
            <div className="inline-flex items-start gap-3 bg-card/60 border border-border/50 rounded-2xl px-5 py-4 mb-4 max-w-md mx-auto text-left shadow-sm">
              <span className="text-2xl shrink-0">🏡</span>
              <div>
                <p className="text-sm font-semibold text-foreground mb-1">A family-run platform</p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  The Village is independent and family-run — not a corporation. Your subscription directly funds the servers, development, and moderation that keep this community safe and growing.
                </p>
              </div>
            </div>
            {isTrial && (
              <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">
                You're on a free trial — upgrade now to keep full access when it ends.
              </p>
            )}
          </div>
        </div>

        {/* Pricing cards */}
        <div className="grid sm:grid-cols-2 gap-6 mb-12">

          {/* Free */}
          <div className="bg-card border border-border/50 shadow-sm rounded-2xl p-6 flex flex-col">
            <div className="mb-5">
              <p className="font-heading font-semibold text-xs uppercase tracking-widest text-muted-foreground mb-2">Free</p>
              <p className="font-heading text-4xl font-bold text-foreground">$0</p>
              <p className="text-sm text-muted-foreground mt-1">Always free, forever</p>
            </div>
            <ul className="space-y-3 mb-6 flex-1">
              {FREE_FEATURES.map(({ label }, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-foreground">
                  <div className="w-5 h-5 rounded-full bg-secondary flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="h-3 w-3 text-muted-foreground" />
                  </div>
                  {label}
                </li>
              ))}
            </ul>
            {isPremium ? (
              <p className="text-sm text-muted-foreground text-center py-2">Your previous plan</p>
            ) : !isTrial && user?.subscription_tier === "free" ? (
              <div className="flex items-center justify-center gap-2 py-2.5 bg-secondary/60 rounded-xl text-muted-foreground font-semibold text-sm border border-border/40">
                <Check className="h-4 w-4" />
                Your current plan
              </div>
            ) : (
              <Button variant="outline" className="w-full rounded-xl" asChild>
                <Link to="/dashboard">Go to Dashboard</Link>
              </Button>
            )}
          </div>

          {/* Village+ */}
          <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border-2 border-primary/40 rounded-2xl p-6 relative overflow-hidden flex flex-col shadow-md">
            <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-primary/20 blur-2xl pointer-events-none" />
            <div className="absolute top-4 right-4 z-10">
              <span className="text-xs font-bold bg-primary text-primary-foreground px-2.5 py-1 rounded-full shadow-sm">
                Most popular
              </span>
            </div>
            <div className="mb-5 relative z-10">
              <p className="font-heading font-semibold text-xs uppercase tracking-widest text-primary mb-2 flex items-center gap-1.5">
                <Crown className="h-3.5 w-3.5" /> Village+
              </p>
              <div className="flex items-end gap-2">
                <p className="font-heading text-4xl font-bold text-foreground">${PRICE_MONTHLY}</p>
                <p className="text-sm text-muted-foreground mb-1.5">/month</p>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                or <span className="text-foreground font-medium">${PRICE_ANNUAL}/mo</span> billed annually
              </p>
            </div>
            <ul className="space-y-3 mb-6 flex-1 relative z-10">
              {PREMIUM_FEATURES.map(({ label }, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-foreground">
                  <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center shrink-0 mt-0.5">
                    <Crown className="h-3 w-3 text-primary" />
                  </div>
                  {label}
                </li>
              ))}
            </ul>
            <div className="relative z-10">
              {isPremium ? (
                <div className="flex items-center justify-center gap-2 py-2.5 bg-primary/10 rounded-xl text-primary font-semibold text-sm border border-primary/20">
                  <Check className="h-4 w-4" />
                  You're on Village+
                </div>
              ) : (
                <Button className="w-full rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all" asChild>
                  <Link to="/contact">
                    Get Village+
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Comparison table */}
        <div className="mb-4">
          <p className="font-heading font-semibold text-xs uppercase tracking-widest text-muted-foreground mb-4">Compare plans</p>
        </div>
        <div className="bg-card border border-border/50 shadow-sm rounded-2xl overflow-hidden mb-6">
          <div className="grid grid-cols-3 bg-secondary/60 px-6 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-widest border-b border-border/40">
            <span>Feature</span>
            <span className="text-center">Free</span>
            <span className="text-center text-primary flex items-center justify-center gap-1">
              <Crown className="h-3 w-3" /> Village+
            </span>
          </div>
          {COMPARISON.map((row, i) => (
            <div
              key={row.feature}
              className={`grid grid-cols-3 px-6 py-3.5 text-sm border-t border-border/40 transition-colors hover:bg-secondary/10 ${i % 2 === 0 ? "" : "bg-secondary/20"}`}
            >
              <span className="text-foreground font-medium">{row.feature}</span>
              <span className="text-center text-muted-foreground">{row.free}</span>
              <span className={`text-center font-semibold ${row.plus === "—" ? "text-muted-foreground/50" : row.plus === "Coming Soon" ? "text-muted-foreground italic text-xs" : "text-primary"}`}>
                {row.plus}
              </span>
            </div>
          ))}
        </div>

        {/* Buy & Swap footnote */}
        <p className="text-xs text-muted-foreground italic px-1 mb-8">
          * Buy &amp; Swap marketplace is in development and will be available to Village+ members when it launches.
        </p>

        {/* FAQ / trust */}
        <div className="text-center py-6 px-6 rounded-2xl bg-secondary/30 border border-border/30 space-y-2 text-sm text-muted-foreground">
          <p className="font-medium text-foreground">Cancel any time. No lock-in, no nonsense.</p>
          <p>
            Questions?{" "}
            <Link to="/contact" className="text-primary hover:underline underline-offset-2 font-medium">
              Get in touch
            </Link>
          </p>
        </div>
      </main>

      <AppFooter />
    </div>
  );
}
