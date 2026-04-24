import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Crown, CheckCircle2, Loader2, CreditCard, XCircle, Settings } from "lucide-react";
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
    <div className="min-h-screen bg-background pb-20 lg:pl-60 lg:pb-0">
      <Navigation user={user} />

      <main className="max-w-lg mx-auto px-4 pt-24 pb-16">

        {/* Success header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 rounded-full bg-primary/15 border border-primary/30 flex items-center justify-center mb-6 mx-auto shadow-lg shadow-primary/10">
            {verified ? (
              <CheckCircle2 className="h-10 w-10 text-primary" />
            ) : (
              <Loader2 className="h-8 w-8 text-primary animate-spin" />
            )}
          </div>

          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 mb-4">
            <Crown className="h-3.5 w-3.5 text-primary" />
            <span className="text-xs font-bold text-primary tracking-wide">Village+</span>
          </div>

          <h1 className="font-heading text-3xl font-bold text-foreground mb-3">
            Welcome to Village+!
          </h1>
          <p className="text-muted-foreground leading-relaxed">
            Your subscription is confirmed. Every limit has been lifted — post, chat, and connect freely.
          </p>
        </div>

        {/* What's unlocked */}
        <div className="bg-card border border-border/50 rounded-2xl p-5 mb-5">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4">What's now unlocked</p>
          <div className="space-y-3">
            {[
              "Unlimited posts, replies & messages",
              "Create & manage community spaces",
              "Create & RSVP to local events",
              "Unlimited direct messages",
              "Crown badge on your profile",
              "Priority support & early feature access",
            ].map((item) => (
              <div key={item} className="flex items-center gap-3 text-sm text-foreground">
                <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="h-3 w-3 text-primary" />
                </div>
                {item}
              </div>
            ))}
          </div>
        </div>

        {/* Manage subscription card */}
        <div className="bg-card border border-border/50 rounded-2xl p-5 mb-5">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1">Manage your subscription</p>
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
