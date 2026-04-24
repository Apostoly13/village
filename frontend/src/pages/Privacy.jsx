import { Link } from "react-router-dom";
import PublicNav from "../components/PublicNav";
import AppFooter from "../components/AppFooter";
import { ArrowLeft, ShieldCheck } from "lucide-react";

const TLDR = [
  "We only collect what we need — your name, email, date of birth, and location.",
  "We do not sell your personal information — not ever, not to anyone.",
  "Anonymous posts are designed to hide your identity from other members. We do not log a link between you and anonymous posts.",
  "Your location is used only to suggest local events and nearby circles.",
  "You can access, correct, or delete your data at any time. Account deletion triggers full removal within 30 days.",
  "We aim to store data in Australia where reasonably available. We comply with the Australian Privacy Principles.",
];

const SECTIONS = [
  {
    title: "1. Who We Are",
    content: [
      "The Village is operated by The Village AU Pty Ltd, an Australian company. This Privacy Policy explains how we collect, use, store, and disclose your personal information in accordance with the Australian Privacy Act 1988 (Cth) and the Australian Privacy Principles ('APPs').",
      "Our Privacy Officer can be reached at privacy@ourlittlevillage.com.au.",
    ],
  },
  {
    title: "2. What We Collect",
    content: [
      "We collect the following personal information when you register and use The Village:",
      "• Name (first and last) — used to create your account and, if you choose, your display name",
      "• Email address — used for authentication, notifications you opt into, and account recovery",
      "• Date of birth — collected to verify you are 18 or older, as required by our Terms",
      "• Location (suburb/postcode) — used to suggest local circles and nearby events. You control whether this is shown on your profile",
      "• Parenting stage and interests — used to personalise your feed and circle recommendations",
      "• Profile photo — optional, uploaded by you",
      "• Content you post — forum threads, replies, messages, and resources",
      "We may also collect technical information (device type, browser, IP address) for security and service-improvement purposes.",
    ],
  },
  {
    title: "3. How We Use Your Information",
    content: [
      "We use your personal information only for the following purposes:",
      "• To provide and operate The Village platform",
      "• To personalise your experience (feed, circle suggestions, event recommendations)",
      "• To send you notifications you have opted into (replies, friend requests, event reminders)",
      "• To verify your age and maintain account security",
      "• To respond to your support or safety enquiries",
      "• To comply with our legal obligations",
      "We will not use your information for any purpose that is incompatible with these purposes without your consent.",
    ],
  },
  {
    title: "4. Disclosure to Third Parties",
    content: [
      "We do not sell your personal information. We do not share it with third parties for their marketing or advertising purposes.",
      "We may share your information with:",
      "• Service providers who assist us in operating the platform (e.g. email delivery, cloud hosting) — only under strict confidentiality obligations and only to the extent necessary",
      "• Payment processors for Village+ subscription billing — we do not see or store your payment card details",
      "• Law enforcement or government agencies, where required by a valid court order or Australian law",
      "We require all third-party service providers to handle your personal information in accordance with the APPs.",
    ],
  },
  {
    title: "5. Anonymous Posting",
    highlight: true,
    content: [
      "Anonymous posting is a core feature of The Village and we treat it with the utmost seriousness.",
      "When you choose to post anonymously, your display name and profile are hidden from other members in the normal platform experience. The platform is designed so this anonymity is maintained by default.",
      "Important: Anonymous posting is designed to hide your identity from other members. It is not a guarantee of absolute anonymity in all technical or legal circumstances.",
      "We do not intentionally log or retain a link between your account and your anonymous posts. We will not attempt to identify anonymous posters and will not respond to requests to unmask anonymous posts except where required by a valid court order or Australian law in cases of serious harm.",
    ],
  },
  {
    title: "6. Data Storage & Security",
    content: [
      "We aim to store your personal information on servers located in Australia where reasonably available. Some third-party service providers may store or process data outside Australia — where this occurs, we take reasonable steps to ensure those providers protect your information to a standard comparable to the APPs.",
      "We implement industry-standard security measures including encrypted storage, secure HTTPS connections, and access controls to protect your personal information from unauthorised access, disclosure, or loss.",
      "No method of transmission over the internet is completely secure. While we take reasonable precautions, we cannot guarantee absolute security.",
    ],
  },
  {
    title: "7. Data Retention",
    content: [
      "We retain your personal information for as long as your account is active or as needed to provide the service.",
      "If you delete your account:",
      "• Your profile, posts, and messages are permanently removed within 30 days",
      "• Anonymous posts are not linked to your account by design — there is nothing specifically tied to you to remove",
      "• We may retain anonymised, aggregated data (e.g. platform usage statistics) that cannot be traced back to you",
      "We may retain certain records for longer where required by law (e.g. financial records for taxation purposes).",
    ],
  },
  {
    title: "8. Your Rights",
    content: [
      "Under the Australian Privacy Act, you have the right to:",
      "• Access the personal information we hold about you — request a copy by emailing privacy@ourlittlevillage.com.au",
      "• Correct inaccurate or out-of-date information — update most details directly in your Profile Settings, or contact us",
      "• Delete your account and associated personal information — available in Profile Settings",
      "• Opt out of non-essential notifications — managed in your Notification Settings",
      "• Make a privacy complaint (see section 10)",
      "We will respond to access and correction requests within 30 days. There is no charge for making a request.",
    ],
  },
  {
    title: "9. Notifiable Data Breaches",
    content: [
      "We comply with the Notifiable Data Breaches (NDB) scheme under the Privacy Act. If we become aware of a data breach that is likely to result in serious harm to any affected individuals, we will:",
      "• Notify the affected individuals as soon as practicable",
      "• Report the breach to the Office of the Australian Information Commissioner (OAIC)",
      "We take all reasonable steps to prevent data breaches and to respond swiftly if one occurs.",
    ],
  },
  {
    title: "10. Cookies & Tracking",
    content: [
      "The Village uses cookies and similar technologies to keep you logged in and to remember your preferences. We do not use tracking cookies for advertising or third-party analytics that identify you personally.",
      "You can manage cookie preferences in your browser settings. Disabling cookies may affect your ability to log in or use certain platform features.",
    ],
  },
  {
    title: "11. Changes to This Policy",
    content: [
      "We may update this Privacy Policy from time to time. When we make material changes, we will notify you by email and/or in-app notification before the changes take effect.",
      "The date below reflects the most recent update. Continuing to use The Village after that date means you accept the updated policy.",
    ],
  },
  {
    title: "12. Complaints & Contact",
    content: [
      "If you have a concern about how we handle your personal information, please contact us first — we'd like the opportunity to resolve it directly.",
      "Privacy Officer: privacy@ourlittlevillage.com.au",
      "General enquiries: hello@ourlittlevillage.com.au",
      "Safety concerns: safety@ourlittlevillage.com.au",
      "If you are not satisfied with our response, you may lodge a complaint with the Office of the Australian Information Commissioner (OAIC) at www.oaic.gov.au.",
      "Legal entity: Our Little Village — Parenting Assistance Platform | ABN: [YOUR ABN]",
    ],
  },
];

export default function Privacy() {
  return (
    <div className="min-h-screen bg-background pb-20 lg:pl-60 lg:pb-0">
      <PublicNav />

      <main className="max-w-3xl mx-auto px-4 pt-16 lg:pt-8">
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
            <ShieldCheck className="h-5 w-5 text-primary" />
          </div>
          <h1 className="font-heading text-3xl font-bold text-foreground">Privacy Policy</h1>
        </div>
        <p className="text-xs text-muted-foreground mb-4">Last updated: April 2026 · Compliant with the Australian Privacy Act 1988 and the Australian Privacy Principles</p>

        {/* Quick links */}
        <div className="mb-6 flex flex-wrap gap-2">
          {["Terms & Conditions", "Community Guidelines", "Contact"].map((label) => {
            const to = label === "Terms & Conditions" ? "/terms" : label === "Community Guidelines" ? "/community-guidelines" : "/contact";
            return (
              <Link key={label} to={to} className="px-3 py-1 rounded-full bg-secondary/50 text-xs text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors border border-border/40">
                {label}
              </Link>
            );
          })}
        </div>

        {/* TL;DR */}
        <div className="my-6 bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-5">
          <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wide mb-3">The short version</p>
          <ul className="space-y-2.5">
            {TLDR.map((point, i) => (
              <li key={i} className="flex items-start gap-2.5 text-sm text-foreground">
                <span className="text-emerald-500 shrink-0 mt-0.5 font-bold">✓</span>
                {point}
              </li>
            ))}
          </ul>
          <p className="text-xs text-muted-foreground mt-4 leading-relaxed">
            The full policy below has the legal detail — but these points are what actually matter.
          </p>
        </div>

        <p className="text-muted-foreground mb-8">
          Your privacy matters deeply to us. Here is exactly what we collect, what we do with it, and — just as importantly — what we don't.
        </p>

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
          This Privacy Policy was last reviewed in April 2026. The Village AU Pty Ltd, Victoria, Australia.
        </p>
      </main>
      <AppFooter />
    </div>
  );
}
