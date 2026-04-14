import { Link } from "react-router-dom";
import Navigation from "../components/Navigation";
import AppFooter from "../components/AppFooter";
import { Button } from "../components/ui/button";

const FEATURES = [
  {
    emoji: "🛍️",
    title: "Marketplace — Buy & Swap",
    description:
      "List and browse baby gear, clothing, toys, and equipment. Genuine connections, no in-platform fees.",
  },
  {
    emoji: "👩‍⚕️",
    title: "Professional Hub — Connect with Experts",
    description:
      "Find verified midwives, lactation consultants, sleep specialists, and child psychologists near you.",
  },
  {
    emoji: "📱",
    title: "Mobile App — The Village in Your Pocket",
    description:
      "Native iOS and Android apps so The Village is always with you, from the delivery room to the school gate.",
  },
];

export default function ComingSoon({ user }) {
  return (
    <div className="min-h-screen bg-background pb-20 lg:pb-0">
      <Navigation user={user} />

      <main className="max-w-3xl mx-auto px-4 pt-20 lg:pt-24">
        {/* Hero */}
        <div className="text-center py-12">
          <div className="text-6xl mb-6">🚀</div>
          <h1 className="font-heading text-4xl font-bold text-foreground mb-4">Coming Soon</h1>
          <p className="text-muted-foreground text-lg leading-relaxed max-w-md mx-auto">
            We're building something great for The Village. Stay tuned.
          </p>
        </div>

        {/* Feature teasers */}
        <div className="space-y-4 mb-12">
          {FEATURES.map((feature) => (
            <div
              key={feature.title}
              className="bg-card rounded-2xl p-6 border border-border/50 flex items-start gap-5"
            >
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-2xl shrink-0">
                {feature.emoji}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-3 mb-1.5">
                  <h2 className="font-heading text-lg font-semibold text-foreground">{feature.title}</h2>
                  <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-primary/10 text-primary whitespace-nowrap">
                    Coming in a future release
                  </span>
                </div>
                <p className="text-muted-foreground leading-relaxed text-sm">{feature.description}</p>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center pb-4">
          <Button asChild size="lg">
            <Link to="/dashboard">Back to the Village</Link>
          </Button>
        </div>
      </main>
      <AppFooter />
    </div>
  );
}
