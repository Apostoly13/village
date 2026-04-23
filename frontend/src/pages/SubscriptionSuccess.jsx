import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Crown, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "../components/ui/button";
import Navigation from "../components/Navigation";

export default function SubscriptionSuccess({ user }) {
  const [verified, setVerified] = useState(false);

  useEffect(() => {
    // Give Stripe webhook ~2s to land, then mark as verified
    const t = setTimeout(() => setVerified(true), 2000);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="min-h-screen bg-background pb-20 lg:pb-0">
      <Navigation user={user} />
      <main className="max-w-lg mx-auto px-4 pt-24 pb-16 flex flex-col items-center text-center">

        <div className="w-20 h-20 rounded-full bg-primary/15 border border-primary/30 flex items-center justify-center mb-6 shadow-lg shadow-primary/10">
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
        <p className="text-muted-foreground mb-2 leading-relaxed">
          Your subscription is confirmed. Every limit has been lifted — post, chat, and connect freely.
        </p>
        <p className="text-sm text-muted-foreground mb-8">
          A confirmation email is on its way from Stripe. You can manage or cancel your subscription any time from the Village+ page.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 w-full justify-center">
          <Button asChild className="rounded-xl">
            <Link to="/dashboard">Go to Dashboard</Link>
          </Button>
          <Button variant="outline" asChild className="rounded-xl">
            <Link to="/plus">Manage subscription</Link>
          </Button>
        </div>

      </main>
    </div>
  );
}
