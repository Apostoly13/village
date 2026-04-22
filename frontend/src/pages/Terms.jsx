import { Link } from "react-router-dom";
import PublicNav from "../components/PublicNav";
import AppFooter from "../components/AppFooter";
import { ArrowLeft, ScrollText } from "lucide-react";

const SECTIONS = [
  {
    title: "1. About These Terms",
    content: [
      "These Terms & Conditions ('Terms') govern your access to and use of The Village, operated by The Village AU Pty Ltd ('we', 'us', 'our'). By creating an account or using The Village, you agree to these Terms.",
      "If you do not agree, please do not use the platform. If we update these Terms, we will notify you by email or in-app notification before the changes take effect. Continuing to use The Village after that date means you accept the updated Terms.",
      "These Terms are governed by the laws of Victoria, Australia.",
    ],
  },
  {
    title: "2. Eligibility",
    content: [
      "You must be at least 18 years old to create an account on The Village. By registering, you confirm that you are 18 or older.",
      "The Village is a community space intended for parents, caregivers, and professionals who support families. It is not designed for, or directed at, children.",
      "We reserve the right to close accounts where there is reasonable evidence that the account holder is under 18.",
    ],
  },
  {
    title: "3. Your Account",
    content: [
      "You are responsible for keeping your login credentials secure and for all activity that occurs under your account.",
      "You must provide accurate information when registering. Using a false identity or impersonating another person is a breach of these Terms.",
      "Notify us immediately at hello@ourlittlevillage.au if you become aware of any unauthorised use of your account.",
    ],
  },
  {
    title: "4. Use of the Platform",
    content: [
      "You agree to use The Village honestly, respectfully, and in a way that supports the community it was built for. Specifically, you must not:",
      "• Harass, bully, threaten, or abuse other members",
      "• Post content that is defamatory, sexually explicit, or illegal under Australian law",
      "• Attempt to identify anonymous posters or circumvent anonymity features",
      "• Use the platform for commercial purposes (spam, MLM, unsolicited advertising) without our written consent",
      "• Attempt to access, disrupt, or damage the platform's systems or data",
      "• Scrape, copy, or redistribute platform content without permission",
      "Violation of these rules may result in suspension or permanent removal of your account.",
    ],
  },
  {
    title: "5. User Content",
    content: [
      "You retain ownership of all content you post on The Village — forum threads, replies, chat messages, resources, and photos ('User Content').",
      "By posting User Content, you grant The Village a non-exclusive, royalty-free, worldwide licence to display, store, and distribute that content within the platform as necessary to operate the service.",
      "We do not claim ownership of your content and we do not sell it. We will not use your content for advertising or share it with third parties for their commercial benefit.",
      "You are responsible for ensuring your User Content does not infringe the intellectual property, privacy, or other legal rights of any third party.",
    ],
  },
  {
    title: "6. Anonymous Posting",
    highlight: true,
    content: [
      "The Village supports anonymous posting as a core feature, designed to help parents share openly without fear of judgment.",
      "When you post anonymously, your display name and profile are hidden from other members in the normal platform experience. The platform is built so that this anonymity is maintained by design.",
      "Important limitation: Anonymous posting is designed to hide your identity from other members. It is not a guarantee of absolute anonymity in all circumstances — for example, where we are required by law to disclose information, or in the event of a technical failure we could not foresee.",
      "We will not attempt to identify anonymous posters and will not respond to requests to unmask anonymous posts except where required by a valid court order or Australian law in cases of serious harm.",
      "Attempting to identify, speculate about, or expose anonymous posters is a serious breach of these Terms and our Community Guidelines, and will result in immediate account suspension.",
    ],
  },
  {
    title: "7. Village+ Subscriptions",
    content: [
      "Village+ is our optional paid subscription tier that unlocks additional features. Subscriptions are billed monthly or annually as selected at purchase.",
      "You may cancel your subscription at any time from your account settings. Cancellation takes effect at the end of your current billing period — you retain access to Village+ features until then.",
      "We do not offer refunds for partial billing periods except where required by the Australian Consumer Law ('ACL') or other applicable law.",
      "Nothing in these Terms limits any rights you may have under the ACL, including consumer guarantees that cannot be excluded.",
    ],
  },
  {
    title: "8. Moderation",
    content: [
      "Our moderation team reviews reports and removes content that violates our Community Guidelines. Moderators act with empathy and consistency.",
      "For minor violations, we may remove content and issue a warning. For serious or repeated violations, we may suspend or permanently close your account.",
      "If your account is suspended, we will tell you why unless doing so would compromise the safety or privacy of another member.",
      "You may appeal a moderation decision by contacting us at hello@ourlittlevillage.au. We will review your appeal and respond within 14 days.",
    ],
  },
  {
    title: "9. Termination",
    content: [
      "You can delete your account at any time from your Profile Settings. Once deleted, your personal data will be permanently removed within 30 days in accordance with our Privacy Policy.",
      "We may suspend or terminate your account if you seriously or repeatedly breach these Terms. We will notify you where it is safe to do so.",
      "If your account is terminated for a breach, you agree not to re-register without our consent.",
    ],
  },
  {
    title: "10. Limitation of Liability",
    content: [
      "The Village is provided 'as is'. While we work hard to keep it available and accurate, we do not guarantee uninterrupted access or that all content is error-free.",
      "To the maximum extent permitted by law, we are not liable for any indirect, incidental, or consequential loss arising from your use of The Village.",
      "Nothing in these Terms excludes, restricts, or modifies any right or remedy you may have under the ACL, including any consumer guarantees that cannot lawfully be excluded.",
      "Our total liability to you for any claim arising under these Terms is limited to the amount you paid us in the 12 months preceding the event giving rise to the claim.",
    ],
  },
  {
    title: "11. Privacy",
    content: [
      "Your privacy is fundamental to how we built this platform. We collect only what we need, we do not sell your data, and you can delete your account and all associated data at any time.",
      "Full details are in our Privacy Policy. By using The Village, you agree to our collection and use of your personal information as described there.",
    ],
  },
  {
    title: "12. Changes to These Terms",
    content: [
      "We may update these Terms as the platform grows. When we do, we will notify you by email and/or an in-app notification at least 14 days before the changes take effect.",
      "The date below reflects the most recent update. For material changes, we will ask you to actively re-accept the updated Terms.",
    ],
  },
  {
    title: "13. Contact & Complaints",
    content: [
      "Questions about these Terms? We're happy to talk it through.",
      "General enquiries: hello@ourlittlevillage.au",
      "Safety concerns: safety@ourlittlevillage.au",
      "Privacy matters: privacy@ourlittlevillage.au",
      "You can also reach us through the Contact page. We aim to respond to all enquiries within 5 business days.",
    ],
  },
];

export default function Terms() {
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

        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center">
            <ScrollText className="h-5 w-5 text-primary" />
          </div>
          <h1 className="font-heading text-3xl font-bold text-foreground">Terms &amp; Conditions</h1>
        </div>
        <p className="text-muted-foreground mb-2">
          The Village is a community built on trust. These terms protect every parent here — including you.
        </p>
        <p className="text-xs text-muted-foreground mb-4">Last updated: April 2026 · Governing law: Victoria, Australia</p>

        {/* Quick links */}
        <div className="mb-8 flex flex-wrap gap-2">
          {["Privacy Policy", "Community Guidelines", "Contact"].map((label) => {
            const to = label === "Privacy Policy" ? "/privacy" : label === "Community Guidelines" ? "/community-guidelines" : "/contact";
            return (
              <Link key={label} to={to} className="px-3 py-1 rounded-full bg-secondary/50 text-xs text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors border border-border/40">
                {label}
              </Link>
            );
          })}
        </div>

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
                        ? "text-muted-foreground pl-3"
                        : i === 0 && section.content.length > 1
                        ? "text-foreground"
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

        <p className="text-xs text-muted-foreground mt-8 mb-4">
          These Terms were last reviewed by legal counsel in April 2026. They are governed by the laws of Victoria, Australia. Any disputes are subject to the exclusive jurisdiction of Victorian courts.
        </p>
      </main>
      <AppFooter />
    </div>
  );
}
