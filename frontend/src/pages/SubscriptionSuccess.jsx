import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Sparkles, CheckCircle2, Loader2, CreditCard, XCircle, Settings } from "lucide-react";
import { Button } from "../components/ui/button";
import Navigation from "../components/Navigation";

const API_URL = process.env.REACT_APP_BACKEND_URL || "http://localhost:8000";

export default function SubscriptionSuccess({ user }) {
  const [verified, setVerified] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);
  const [portalError, setPortalError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const t = setTimeout(() => setVerified(true), 2000);
    return () => clearTimeout(t);
  }, []);

  const handleManageBilling = async () => {
    setPortalLoading(true);
    setPortalError("");
    try {
      const res = await fetch(`${API_URL}/api/stripe/customer-portal`, {
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Something went wrong");
      window.location.href = data.url;
    } catch (e) {
      setPortalError(e.message);
      setPortalLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background  lg:pl-60 lg:pb-0">
      <Navigation user={user} />

      <main className="max-w-lg mx-auto px-4 pt-24 pb-16">

        {/* Success header */}
        <div className="text-center mb-8">
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center mb-6 mx-auto"
            style={{ background: "var(--sage-wash)", border: "1px solid rgba(74,113,85,0.3)", boxShadow: "var(--shadow-md)" }}
          >
            {verified ? (
              <CheckCircle2 className="h-10 w-10" style={{ color: "var(--sage-deep)" }} />
            ) : (
              <Loader2 className="h-8 w-8 animate-spin" style={{ color: "var(--sage-deep)" }} />
            )}
          </div>

          <div
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-4"
            style={{ background: "var(--honey-wash)", border: "1px solid rgba(217,161,91,0.35)" }}
          >
            <Sparkles className="h-3.5 w-3.5" style={{ color: "var(--honey)" }} />
            <span className="text-xs font-bold tracking-wide" style={{ color: "var(--honey)" }}>Village+</span>
          </div>

          <h1 className="font-heading text-3xl font-bold mb-3" style={{ color: "var(--ink)" }}>
            Welcome to Village+!
          </h1>
          <p className="leading-relaxed" style={{ color: "var(--ink-2)" }}>
            Your subscription is confirmed. Every limit has been lifted — post, chat, and connect freely.
          </p>
        </div>

        {/* What's unlocked */}
        <div className="village-card p-5 mb-5">
          <p className="tv-mono mb-4" style={{ color: "var(--ink-3)" }}>What's now unlocked</p>
          <div className="space-y-3">
            {[
"Unlimited posts, replies & messages",
"Create & manage community spaces",
"Create & RSVP to local events",
"Unlimited direct messages",
"Village+ badge on your profile",
"Priority support & early feature access",
            ].map((item) => (
              <div key={item} className="flex items-center gap-3 text-sm" style={{ color: "var(--ink)" }}>
                <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0" style={{ background: "var(--sage-wash)" }}>
                  <CheckCircle2 className="h-3 w-3" style={{ color: "var(--sage-deep)" }} />
                </div>
                {item}
              </div>
            ))}
          </div>
        </div>

        {/* Manage subscription card */}
        <div className="village-card p-5 mb-5">
          <p className="tv-mono mb-1" style={{ color: "var(--ink-3)" }}>Manage your subscription</p>
          <p className="text-sm text-muted-foreground mb-4">
            Update payment details, view invoices, or cancel any time — no lock-in, no hassle.
          </p>

          {portalError && (
            <div className="mb-3 rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
              {portalError}
            </div>
          )}

          <div className="space-y-2">
            <Button
              variant="outline"
              className="w-full rounded-xl justify-start gap-3"
              onClick={handleManageBilling}
              disabled={portalLoading}
            >
              {portalLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CreditCard className="h-4 w-4" />
              )}
              Update payment method
            </Button>

            <Button
              variant="outline"
              className="w-full rounded-xl justify-start gap-3"
              onClick={handleManageBilling}
              disabled={portalLoading}
            >
              <Settings className="h-4 w-4" />
              View invoices & billing history
            </Button>

            <Button
              variant="outline"
              className="w-full rounded-xl justify-start gap-3 text-destructive border-destructive/30 hover:bg-destructive/5"
              onClick={handleManageBilling}
              disabled={portalLoading}
            >
              <XCircle className="h-4 w-4" />
              Cancel subscription
            </Button>
          </div>

          <p className="text-xs text-muted-foreground mt-3 text-center">
            Cancelling keeps Village+ active until the end of your current billing period.
          </p>
        </div>

        {/* Confirmation note */}
        <p className="text-xs text-muted-foreground text-center mb-6">
          A confirmation email is on its way from Stripe. Questions?{" "}
          <Link to="/contact" className="text-primary underline underline-offset-2">Contact us</Link>
        </p>

        {/* CTA */}
        <Button asChild className="w-full rounded-xl">
          <Link to="/dashboard">Go to Dashboard</Link>
        </Button>

      </main>
    </div>
  );
}
