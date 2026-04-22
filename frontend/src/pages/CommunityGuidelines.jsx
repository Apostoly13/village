import { Link } from "react-router-dom";
import PublicNav from "../components/PublicNav";
import AppFooter from "../components/AppFooter";
import { ArrowLeft } from "lucide-react";

const GUIDELINES = [
  {
    emoji: "🤝",
    title: "Be kind and respectful",
    description:
      "Parenting is hard enough. Offer support, not judgment. You're welcome to hold a different view — just express it with respect. Remember there's a real person behind every post, navigating the same chaos you are. A moment of empathy can change someone's whole day.",
  },
  {
    emoji: "🔒",
    title: "Protect each other's privacy",
    description:
      "What's shared in The Village stays here. Never share another parent's personal details, photos, location, or posts outside the platform — not in a screenshot, not in a group chat, not anywhere. Trust is the foundation of this community. Protect it.",
  },
  {
    emoji: "🤫",
    title: "Anonymous posting is sacred",
    description:
      "Never attempt to identify, speculate about, or expose anonymous posters. When someone posts without their name, that decision is theirs alone. Trying to unmask or hint at who posted anonymously — even indirectly — is a serious violation and will result in immediate account suspension with no appeal.",
  },
  {
    emoji: "🛡️",
    title: "Zero tolerance for harmful content",
    description:
      "There is no place in The Village for harassment, hate speech, abuse, threats, or content that puts children or families at risk. This includes: discriminatory language based on race, religion, gender, sexuality, disability, or parenting choices; any sexual content involving minors; and targeted campaigns against individual members. Zero tolerance means zero exceptions.",
  },
  {
    emoji: "🚫",
    title: "No spam or unsolicited promotion",
    description:
      "The Village is not a marketplace or advertising platform. Do not post unsolicited commercial content, MLM promotions, referral codes, or repeated links to external sites. Sharing a genuine recommendation in context is fine — bulk promotion is not. Repeated violations will result in account removal.",
  },
  {
    emoji: "📢",
    title: "Post in the right space",
    description:
      "Each circle and forum exists for a reason. Sleep questions go in Sleep Support. Local event ideas go in Local Meetups. Feeding questions go in Feeding Circle. Keeping posts on topic makes The Village genuinely useful — not just for you, but for every parent who comes looking for help later.",
  },
  {
    emoji: "🏥",
    title: "Medical and professional information",
    description:
      "You can share your own experiences, but please don't present personal opinions as medical or professional advice. Always encourage others to consult a qualified health professional for medical decisions. Our For Clinicians section is for verified professionals — impersonating a clinician is a serious breach.",
  },
  {
    emoji: "⚠️",
    title: "Safeguarding — child and family safety",
    description:
      "If you see content that suggests a child or parent is in immediate danger, contact emergency services first. Then report the content immediately using the ⋯ menu on any post or message. Every report is reviewed by a real person. Our safeguarding responsibility extends to every family in this community — do not hesitate to report.",
  },
];

const CONSEQUENCES = [
  { level: "First violation", action: "Content removed + warning issued" },
  { level: "Repeated violations", action: "Temporary suspension" },
  { level: "Serious violation", action: "Immediate permanent removal" },
  { level: "Safeguarding breach", action: "Immediate removal + possible referral to authorities" },
];

export default function CommunityGuidelines() {
  return (
    <div className="min-h-screen bg-background pb-20 lg:pb-0">
      <PublicNav />

      <main className="max-w-3xl mx-auto px-4 pt-20 lg:pt-24">
        <button
          type="button"
          onClick={() => window.history.length > 1 ? window.history.back() : window.location.assign("/")}
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>

        <div className="mb-2">
          <h1 className="font-heading text-3xl font-bold text-foreground mb-3">Community Guidelines</h1>
          <p className="text-muted-foreground leading-relaxed">
            The Village is a place of safety, honesty, and kindness. These guidelines protect every parent here — including you.
          </p>
          <p className="text-xs text-muted-foreground mt-2">Last updated: April 2026</p>
        </div>

        {/* Quick links */}
        <div className="mt-4 mb-8 flex flex-wrap gap-2">
          {["Terms & Conditions", "Privacy Policy", "Contact"].map((label) => {
            const to = label === "Terms & Conditions" ? "/terms" : label === "Privacy Policy" ? "/privacy" : "/contact";
            return (
              <Link key={label} to={to} className="px-3 py-1 rounded-full bg-secondary/50 text-xs text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors border border-border/40">
                {label}
              </Link>
            );
          })}
        </div>

        {/* Guidelines */}
        <div className="space-y-4">
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

        {/* Consequences */}
        <div className="mt-8 bg-card rounded-2xl p-6 border border-border/50">
          <h2 className="font-heading text-lg font-semibold text-foreground mb-4">Consequences of violations</h2>
          <div className="space-y-3">
            {CONSEQUENCES.map((row) => (
              <div key={row.level} className="flex items-start gap-4 text-sm">
                <span className="font-medium text-foreground min-w-[160px] shrink-0">{row.level}</span>
                <span className="text-muted-foreground">{row.action}</span>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-4">
            Moderators exercise judgment based on context and history. In ambiguous situations we err toward the member; in safety situations we err toward protection.
          </p>
        </div>

        {/* Reporting */}
        <div className="mt-4 bg-amber-500/10 border border-amber-500/25 rounded-2xl p-6">
          <h2 className="font-heading text-lg font-semibold text-foreground mb-2">See something wrong?</h2>
          <p className="text-muted-foreground leading-relaxed">
            Tap the <span className="font-semibold text-foreground">⋯</span> menu on any post or message and select{" "}
            <span className="font-semibold text-foreground">Report</span>. Every report is reviewed by a real person. You can
            report anonymously — we will never reveal who submitted a report. For urgent safety concerns, email{" "}
            <a href="mailto:safety@ourlittlevillage.au" className="text-primary underline underline-offset-2">
              safety@ourlittlevillage.au
            </a>{" "}
            directly.
          </p>
        </div>

        {/* Appeals */}
        <div className="mt-4 bg-card rounded-2xl p-6 border border-border/50">
          <h2 className="font-heading text-lg font-semibold text-foreground mb-2">Appeals</h2>
          <p className="text-muted-foreground leading-relaxed">
            If you believe a moderation decision was made in error, you can appeal within 14 days by contacting us at{" "}
            <a href="mailto:hello@ourlittlevillage.au" className="text-primary underline underline-offset-2">
              hello@ourlittlevillage.au
            </a>
            . Please include the content in question and the reason you believe the decision was incorrect. We review all appeals
            and respond within 14 days.
          </p>
          <p className="text-muted-foreground leading-relaxed mt-3">
            Appeals are not available for safeguarding violations or permanent bans issued for zero-tolerance breaches.
          </p>
        </div>

        {/* Moderators */}
        <div className="mt-4 bg-card rounded-2xl p-6 border border-border/50">
          <h2 className="font-heading text-lg font-semibold text-foreground mb-2">Our moderators</h2>
          <p className="text-muted-foreground leading-relaxed">
            Our moderation team are parents themselves. They act with empathy, consistency, and care — holding the line
            on these guidelines while remembering that the person behind every post is a real human being, doing their best.
          </p>
          <p className="text-muted-foreground leading-relaxed mt-3">
            Moderators never act on anonymous identity. They evaluate content — not the person behind it.
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
