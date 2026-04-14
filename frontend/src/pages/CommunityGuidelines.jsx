import { Link } from "react-router-dom";
import Navigation from "../components/Navigation";
import AppFooter from "../components/AppFooter";
import { ArrowLeft } from "lucide-react";

const GUIDELINES = [
  {
    emoji: "🤝",
    title: "Be kind",
    description:
      "Parenting is hard enough. Offer support, not judgment. You're welcome to disagree with someone — just do it respectfully. A moment of empathy can change a parent's whole day.",
  },
  {
    emoji: "🔒",
    title: "Respect privacy",
    description:
      "What's shared in The Village stays here. Never share another parent's personal details, photos, or posts outside the platform. Trust is the foundation of this community — let's protect it.",
  },
  {
    emoji: "🤫",
    title: "Anonymous is sacred",
    description:
      "Never try to identify anonymous posters. When someone chooses to post without their name, that decision belongs to them alone. Attempting to unmask or speculate about who posted anonymously is a serious violation and will result in immediate removal.",
  },
  {
    emoji: "🛡️",
    title: "No harmful content",
    description:
      "There is no place in The Village for harassment, abuse, hate speech, or content that could put children or families at risk. This includes discriminatory language, threats, and any content that sexualises minors. Zero tolerance, no exceptions.",
  },
  {
    emoji: "📢",
    title: "Stay on topic",
    description:
      "Post in the right Support Space. Sleep questions go in Sleep Circle, local event ideas go in Local Meetups, feeding questions go in Feeding Circle. This keeps the platform useful and easy to navigate for everyone.",
  },
  {
    emoji: "🏥",
    title: "Safeguarding",
    description:
      "If you see content that suggests a child or parent is in danger, do not wait — report it immediately using the ⋯ menu on the post or message. Our team reviews every report. The safety of every family in The Village is our highest priority.",
  },
];

export default function CommunityGuidelines({ user }) {
  return (
    <div className="min-h-screen bg-background pb-20 lg:pb-0">
      <Navigation user={user} />

      <main className="max-w-3xl mx-auto px-4 pt-20 lg:pt-24">
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Link>

        <div className="mb-2">
          <h1 className="font-heading text-3xl font-bold text-foreground mb-3">Community Guidelines</h1>
          <p className="text-muted-foreground leading-relaxed">
            The Village is a place of safety, honesty, and kindness. These guidelines help keep it that way for every parent here.
          </p>
        </div>

        {/* Guidelines */}
        <div className="space-y-4 mt-8">
          {GUIDELINES.map((guideline) => (
            <div key={guideline.title} className="bg-card rounded-2xl p-6 border border-border/50 flex items-start gap-5">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-2xl shrink-0">
                {guideline.emoji}
              </div>
              <div>
                <h2 className="font-heading text-lg font-semibold text-foreground mb-1.5">{guideline.title}</h2>
                <p className="text-muted-foreground leading-relaxed">{guideline.description}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Reporting section */}
        <div className="mt-8 bg-amber-500/10 border border-amber-500/25 rounded-2xl p-6">
          <h2 className="font-heading text-lg font-semibold text-foreground mb-2">See something wrong?</h2>
          <p className="text-muted-foreground leading-relaxed">
            Tap the <span className="font-semibold text-foreground">⋯</span> menu on any post or message and select{" "}
            <span className="font-semibold text-foreground">Report</span>. Every report is reviewed by a real person. You can
            report anonymously — we will never reveal who submitted a report.
          </p>
        </div>

        {/* Moderator principles */}
        <div className="mt-4 bg-card rounded-2xl p-6 border border-border/50">
          <h2 className="font-heading text-lg font-semibold text-foreground mb-2">Our moderators</h2>
          <p className="text-muted-foreground leading-relaxed">
            Our moderators are volunteers and parents themselves. They act with empathy, consistency, and care — holding the line
            on these guidelines while remembering that the person behind every post is a real human being, doing their best.
          </p>
          <p className="text-muted-foreground leading-relaxed mt-3">
            If you believe a moderation decision was made in error, you can appeal by contacting us at{" "}
            <a
              href="mailto:hello@thevillage.com.au"
              className="text-primary underline underline-offset-2"
            >
              hello@thevillage.com.au
            </a>
            .
          </p>
        </div>

        {/* Links */}
        <div className="mt-6 flex flex-wrap gap-4 text-sm text-muted-foreground pb-4">
          <span>
            Have a suggestion about these guidelines?{" "}
            <Link to="/suggestions" className="text-primary hover:underline underline-offset-2">
              Let us know →
            </Link>
          </span>
        </div>
      </main>
      <AppFooter />
    </div>
  );
}
