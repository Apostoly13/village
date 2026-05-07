import { Link } from "react-router-dom";
import { Crown, ArrowLeft } from "lucide-react";
import { Button } from "../components/ui/button";
import Navigation from "../components/Navigation";

export default function SubscriptionCancel({ user }) {
  return (
    <div className="min-h-screen bg-background pb-20 lg:pl-60 lg:pb-0">
      <Navigation user={user} />
      <main className="max-w-lg mx-auto px-4 pt-24 pb-16 flex flex-col items-center text-center">

        <div className="w-20 h-20 rounded-full bg-secondary flex items-center justify-center mb-6">
          <Crown className="h-10 w-10 text-muted-foreground" />
        </div>

        <h1 className="font-heading text-3xl font-bold text-foreground mb-3">
          No worries
        </h1>
        <p className="text-muted-foreground mb-8 leading-relaxed">
          You cancelled before completing checkout — nothing was charged. Your account stays exactly as it was.
          Whenever you're ready, Village+ will be right here.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 w-full justify-center">
          <Button asChild className="rounded-xl">
            <Link to="/plus">
              <Crown className="h-4 w-4 mr-2" />
              Back to Village+
            </Link>
          </Button>
          <Button variant="outline" asChild className="rounded-xl">
            <Link to="/dashboard">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Dashboard
            </Link>
          </Button>
        </div>

      </main>
    </div>
  );
}
