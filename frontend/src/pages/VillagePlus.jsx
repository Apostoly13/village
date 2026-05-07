import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Crown, Check, ArrowRight, Loader2, ExternalLink, CreditCard, XCircle, Settings, CheckCircle2 } from "lucide-react";
import { Button } from "../components/ui/button";
import Navigation from "../components/Navigation";
import AppFooter from "../components/AppFooter";

const API_URL = process.env.REACT_APP_BACKEND_URL;

const PRICE_MONTHLY = 9.99;
const PRICE_ANNUAL_MONTHLY = 7.99; // per month
const PRICE_ANNUAL_TOTAL = 95.88;  // billed annually

const FREE_FEATURES = [
  { label: "5 support space posts per week" },
  { label: "5 support space replies per week" },
  { label: "10 chat messages per day" },
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
  { label: "The Village Stall — buy, sell & swap locally" },
];

const COMPARISON = [
  { feature: "Support space posts",     free: "5/week",    plus: "Unlimited" },
  { feature: "Support space replies",   free: "5/week",    plus: "Unlimited" },
  { feature: "Chat messages",            free: "10/day",    plus: "Unlimited" },
  { feature: "Direct messages",         free: "—",         plus: "Unlimited" },
  { feature: "View events",             free: "—",         plus: "✓" },
  { feature: "Create events",           free: "—",         plus: "✓" },
  { feature: "Create communities",      free: "—",         plus: "✓" },
  { feature: "Anonymous posting",       free: "✓",         plus: "✓" },
  { feature: "Read all posts",          free: "✓",         plus: "✓" },
  { feature: "Crown badge",             free: "—",         plus: "✓" },
  { feature: "The Village Stall",        free: "—",         plus: "✓" },
];

// ── Premium management view ────────────────────────────────────────────────────
function PremiumManagement({ user, onPortal, portalLoading, error }) {
  return (
    <div className="max-w-lg mx-auto px-4 pt-16 lg:pt-8 pb-16">

      {/* Status */}
      <div className="text-center mb-8">
        <div className="w-16 h-16 rounded-full bg-primary/15 border border-primary/30 flex items-center justify-center mb-4 mx-auto">
          <Crown className="h-8 w-8 text-primary" />
        </div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 mb-3">
          <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
          <span className="text-xs font-bold text-primary">Active subscription</span>
        </div>
        <h1 className="font-heading text-2xl font-bold text-foreground mb-1">You're on Village+</h1>
        <p className="text-sm text-muted-foreground">All limits lifted. Thank you for supporting The Village.</p>
      </div>

      {/* What's included */}
      <div className="bg-card border border-border/50 rounded-2xl p-5 mb-4">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4">Your plan includes</p>
        <div className="space-y-2.5">
          {PREMIUM_FEATURES.map(({ label }, i) => (
            <div key={i} className="flex items-center gap-3 text-sm text-foreground">
              <div className="w-4 h-4 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                <Check className="h-2.5 w-2.5 text-primary" />
              </div>
              {label}
            </div>
          ))}
        </div>
      </div>

      {/* Manage billing */}
      <div className="bg-card border border-border/50 rounded-2xl p-5 mb-4">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1">Manage your subscription</p>
        <p className="text-sm text-muted-foreground mb-4">Update payment details, view invoices, or cancel — all managed securely through Stripe.</p>

        {error && (
          <div className="mb-3 rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
            {error}
          </div>
        )}

        <div className="space-y-2">
          <Button variant="outline" className="w-full rounded-xl justify-start gap-3" onClick={onPortal} disabled={portalLoading}>
            {portalLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4" />}
            Update payment method
          </Button>
          <Button variant="outline" className="w-full rounded-xl justify-start gap-3" onClick={onPortal} disabled={portalLoading}>
            <Settings className="h-4 w-4" />
            View invoices & billing history
          </Button>
          <Button variant="outline" className="w-full rounded-xl justify-start gap-3 text-destructive border-destructive/30 hover:bg-destructive/5" onClick={onPortal} disabled={portalLoading}>
            <XCircle className="h-4 w-4" />
            Cancel subscription
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-3 text-center">
          Cancelling keeps Village+ active until the end of your billing period.
        </p>
      </div>

      <Button asChild className="w-full rounded-xl">
        <Link to="/dashboard">Back to Dashboard</Link>
      </Button>
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────
export default function VillagePlus({ user }) {
  const [billing, setBilling] = useState("monthly"); // "monthly" | "annual"
  const [loading, setLoading] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const isPremium = user?.subscription_tier === "premium";
  const isTrial   = user?.subscription_tier === "trial";

  const handleUpgrade = async () => {
    if (!user) { navigate("/register"); return; }
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_URL}/api/stripe/create-checkout-session`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: billing }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Something went wrong");
      window.location.href = data.url; // redirect to Stripe Checkout
    } catch (e) {
      setError(e.message);
      setLoading(false);
    }
  };

  const handleManageBilling = async () => {
    setPortalLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_URL}/api/stripe/customer-portal`, {
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Something went wrong");
      window.location.href = data.url;
    } catch (e) {
      setError(e.message);
      setPortalLoading(false);
    }
  };

  // Premium users get the management view, not the upsell page
  if (isPremium) {
    return (
      <div className="min-h-screen bg-background pb-20 lg:pl-60 lg:pb-0">
        <Navigation user={user} />
        <PremiumManagement user={user} onPortal={handleManageBilling} portalLoading={portalLoading} error={error} />
        <AppFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20 lg:pl-60 lg:pb-0">
      <Navigation user={user} />

      <main className="max-w-3xl mx-auto px-4 pt-16 lg:pt-8 pb-16">

        {/* Hero — always dark regardless of theme, so colours are hardcoded */}
        <div
          className="relative text-center mb-12 rounded-3xl overflow-hidden py-14 px-6"
          style={{ background: "#2a1f17" }}
        >
          {/* Honey glow overlay */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ background: "radial-gradient(ellipse at 30% 40%, rgba(245,197,66,0.18) 0%, transparent 65%)" }}
          />
          <div className="relative z-10">
            <div
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6"
              style={{ background: "rgba(245,197,66,0.15)", border: "1px solid rgba(245,197,66,0.35)" }}
            >
              <Crown className="h-4 w-4" style={{ color: "#f5c542" }} />
              <span className="text-sm font-bold tracking-wide" style={{ color: "#f5c542" }}>Village+</span>
            </div>
            <h1
              className="text-4xl sm:text-5xl font-medium leading-tight mb-4"
              style={{ fontFamily: "var(--serif)", letterSpacing: "-0.03em", color: "#f5e6d0" }}
            >
              Support{" "}
              <em style={{ fontStyle: "italic", color: "#f5c542" }}>without limits</em>
            </h1>
            <p className="text-lg max-w-xl mx-auto leading-relaxed mb-6" style={{ color: "rgba(245,230,208,0.75)" }}>
              The Village is built for parents. Village+ removes every limit so you can connect, post, and support freely — any time of day.
            </p>
            <div
              className="inline-flex items-start gap-3 rounded-2xl px-5 py-4 mb-4 max-w-md mx-auto text-left"
              style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(245,197,66,0.20)" }}
            >
              <span className="text-2xl shrink-0">🏡</span>
              <div>
                <p className="text-sm font-semibold mb-1" style={{ color: "#f5e6d0" }}>A family-run platform</p>
                <p className="text-xs leading-relaxed" style={{ color: "rgba(245,230,208,0.65)" }}>
                  The Village is independent and family-run — not a corporation. Your subscription directly funds the servers, development, and moderation that keep this community safe and growing.
                </p>
              </div>
            </div>
            {isTrial && (
              <p className="text-xs font-medium" style={{ color: "#f5c542" }}>
                You're on a free trial — upgrade now to keep full access when it ends.
              </p>
            )}
          </div>
        </div>

        {/* Billing toggle */}
        {!isPremium && (
          <div className="flex justify-center mb-8">
            <div className="inline-flex items-center bg-secondary/60 border border-border/50 rounded-full p-1 gap-1">
              <button
                onClick={() => setBilling("monthly")}
                className={`px-5 py-2 rounded-full text-sm font-semibold transition-all ${
                  billing === "monthly"
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBilling("annual")}
                className={`px-5 py-2 rounded-full text-sm font-semibold transition-all flex items-center gap-2 ${
                  billing === "annual"
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Annual
                <span className="text-[10px] font-bold bg-primary text-primary-foreground px-1.5 py-0.5 rounded-full">
                  Save 20%
                </span>
              </button>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mb-6 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive text-center">
            {error}
          </div>
        )}

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
              {billing === "annual" ? (
                <>
                  <div className="flex items-end gap-2">
                    <p className="font-heading text-4xl font-bold text-foreground">${PRICE_ANNUAL_MONTHLY}</p>
                    <p className="text-sm text-muted-foreground mb-1.5">/mo</p>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    <span className="text-foreground font-medium">A${PRICE_ANNUAL_TOTAL}</span> billed once per year
                  </p>
                  <p className="text-xs text-primary font-medium mt-1">You save A$23.88 vs monthly</p>
                </>
              ) : (
                <>
                  <div className="flex items-end gap-2">
                    <p className="font-heading text-4xl font-bold text-foreground">${PRICE_MONTHLY}</p>
                    <p className="text-sm text-muted-foreground mb-1.5">/month</p>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    or <span className="text-foreground font-medium">${PRICE_ANNUAL_MONTHLY}/mo</span> billed annually
                  </p>
                </>
              )}
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
            <div className="relative z-10 space-y-3">
              {isPremium ? (
                <>
                  <div className="flex items-center justify-center gap-2 py-2.5 bg-primary/10 rounded-xl text-primary font-semibold text-sm border border-primary/20 mb-2">
                    <Check className="h-4 w-4" />
                    You're on Village+
                  </div>
                  <Button
                    variant="outline"
                    className="w-full rounded-xl justify-center gap-2"
                    onClick={handleManageBilling}
                    disabled={portalLoading}
                  >
                    {portalLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <ExternalLink className="h-4 w-4" />
                    )}
                    Update card / Cancel subscription
                  </Button>
                  <p className="text-xs text-muted-foreground text-center mt-2">
                    Manage your billing, view invoices, or cancel any time
                  </p>
                </>
              ) : (
                <Button
                  className="w-full rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all"
                  onClick={handleUpgrade}
                  disabled={loading}
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <ArrowRight className="ml-2 h-4 w-4" />
                  )}
                  {loading ? "Redirecting…" : `Get Village+ — ${billing === "annual" ? `A$${PRICE_ANNUAL_TOTAL}/yr` : `A$${PRICE_MONTHLY}/mo`}`}
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
              <span className={`text-center font-semibold ${row.plus === "—" ? "text-muted-foreground/50" : "text-primary"}`}>
                {row.plus}
              </span>
            </div>
          ))}
        </div>


        {/* Trust / FAQ */}
        <div className="text-center py-6 px-6 rounded-2xl bg-secondary/30 border border-border/30 space-y-2 text-sm text-muted-foreground">
          <p className="font-medium text-foreground">Cancel any time. No lock-in, no nonsense.</p>
          <p>Payments are processed securely by Stripe. We never store your card details.</p>
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
