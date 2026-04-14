import { Link } from "react-router-dom";
import Navigation from "../components/Navigation";
import AppFooter from "../components/AppFooter";
import { ArrowLeft, ShieldCheck } from "lucide-react";

const SECTIONS = [
  {
    title: "What We Collect",
    content: [
      "When you join The Village, we collect the information you give us during sign-up and onboarding:",
      "• Name and email address",
      "• Location — suburb and/or postcode (used to suggest local circles and nearby events)",
      "• Interests and parenting stage (used to personalise your feed and circle recommendations)",
      "We do not collect unnecessary personal information. We only ask for what helps us make the platform work for you.",
    ],
  },
  {
    title: "How We Use It",
    content: [
      "Everything we collect is used solely to improve your experience in The Village:",
      "• Personalise your feed and circle suggestions based on your parenting stage and interests",
      "• Show you local circles, meetups, and events relevant to your suburb",
      "• Send you notifications you've opted into (replies, friend requests, event reminders)",
      "We do not use your data for advertising, profiling beyond the platform, or any purpose you haven't consented to.",
    ],
  },
  {
    title: "What We Don't Do",
    content: [
      "We believe in being explicit about what we won't ever do with your data:",
      "• We do not sell your data — ever, to anyone, for any reason",
      "• We do not share your personal information with third parties for marketing or advertising",
      "• We do not store payment information — any payments are handled entirely by our payment processor",
      "• We do not build advertising profiles or sell behavioural data",
    ],
  },
  {
    title: "Anonymous Posting — Our Strongest Promise",
    highlight: true,
    content: [
      "Anonymous posting is a core feature of The Village, and we treat it with the utmost seriousness.",
      "When you choose to post anonymously, your name is hidden from every other member — including moderators and admins in normal view.",
      "We do not log, store, or retain any link between your account and your anonymous posts. This is enforced at the data level, not just through policy.",
      "We will never attempt to identify anonymous posters, and we will not respond to requests (legal or otherwise) to unmask anonymous posts except where we are required to by Australian law in cases of serious harm.",
    ],
  },
  {
    title: "Data Retention",
    content: [
      "We keep your data for as long as your account is active. If you delete your account:",
      "• Your profile, posts, and messages are permanently removed within 30 days",
      "• Anonymous posts are already unlinked from your account by design — there is nothing to remove",
      "• We may retain anonymised, aggregated usage statistics (e.g., how many posts were made in a circle) that cannot be traced back to you",
    ],
  },
  {
    title: "Your Rights",
    content: [
      "You are in control of your data. At any time you can:",
      "• Delete your account from Profile Settings — this triggers full data removal",
      "• Request an export of your personal data by emailing hello@thevillage.com.au",
      "• Ask us to correct inaccurate personal information",
      "• Opt out of non-essential notifications in your notification settings",
      "We will respond to all data requests within 30 days.",
    ],
  },
  {
    title: "Contact",
    content: [
      "Questions about your privacy or how we handle your data? We're happy to talk.",
      "Email: hello@thevillage.com.au",
      "For urgent safety or data concerns: safety@thevillage.com.au",
      "You can also reach us through the Contact page.",
    ],
  },
];

export default function Privacy({ user }) {
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

        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center">
            <ShieldCheck className="h-5 w-5 text-primary" />
          </div>
          <h1 className="font-heading text-3xl font-bold text-foreground">Privacy Policy</h1>
        </div>
        <p className="text-muted-foreground mb-2">
          Your privacy matters deeply to us. Here is exactly what we collect, what we do with it, and — just as importantly — what we don't.
        </p>
        <p className="text-xs text-muted-foreground mb-8">Last updated: April 2026</p>

        <div className="space-y-4">
          {SECTIONS.map((section) => (
            <div
              key={section.title}
              className={`rounded-2xl p-6 border ${
                section.highlight
                  ? "bg-primary/5 border-primary/30"
                  : "bg-card border-border/50"
              }`}
            >
              <h2 className="font-heading text-lg font-semibold text-foreground mb-3">
                {section.highlight && <span className="mr-2">🔒</span>}
                {section.title}
              </h2>
              <div className="space-y-2">
                {section.content.map((line, i) => (
                  <p
                    key={i}
                    className={`leading-relaxed ${
                      line.startsWith("•")
                        ? "text-muted-foreground pl-2"
                        : i === 0 && section.content.length > 1
                        ? "text-foreground font-medium"
                        : "text-muted-foreground"
                    }`}
                  >
                    {line}
                  </p>
                ))}
              </div>
            </div>
          ))}
        </div>

      </main>
      <AppFooter />
    </div>
  );
}
