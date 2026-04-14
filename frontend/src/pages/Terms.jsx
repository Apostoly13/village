import { Link } from "react-router-dom";
import Navigation from "../components/Navigation";
import AppFooter from "../components/AppFooter";
import { ArrowLeft, ScrollText } from "lucide-react";

const SECTIONS = [
  {
    title: "Agreement",
    content:
      "By creating an account and using The Village, you agree to these terms. They're written in plain English because we believe clarity matters. If something changes, we'll let you know — and continuing to use the platform means you accept those changes.",
  },
  {
    title: "Use of the Platform",
    content:
      "The Village is a community space for parents. You agree to use it honestly, kindly, and in the spirit it was built — to support one another. You must be 18 or older to create an account. You're responsible for anything you post, share, or send through the platform.",
  },
  {
    title: "User Content",
    content:
      "Anything you post — forum threads, replies, chat messages, or resources — remains yours. By posting it, you grant The Village a non-exclusive licence to display it to other members as part of the service. We don't sell your content, and we don't claim ownership of it.",
  },
  {
    title: "Anonymous Posting",
    content:
      "The Village supports anonymous posting to help parents share openly without fear of judgment. When you post anonymously, your name is hidden from other members. The platform does not log or store a link between your account and your anonymous posts — this is by design, not just policy.",
  },
  {
    title: "Privacy",
    content:
      "We collect only what we need to make the platform work for you. We do not sell your data. We do not share it with third parties for advertising. Your full privacy details are in our Privacy Policy.",
  },
  {
    title: "Moderation",
    content:
      "Our moderators are volunteers and parents themselves. They remove content that violates our Community Guidelines with empathy and consistency. Repeated serious violations may result in account suspension. If you think a moderation decision was wrong, you can contact us to appeal.",
  },
  {
    title: "Termination",
    content:
      "You can delete your account at any time from your profile settings. We may suspend or close accounts that seriously or repeatedly breach these terms. If that happens, we'll tell you why unless doing so would compromise the safety of another member.",
  },
  {
    title: "Changes to Terms",
    content:
      "We may update these terms from time to time as the platform grows. We'll always give you notice — either by email or a notification inside the app — before changes take effect. The updated date at the bottom of this page reflects the most recent revision.",
  },
  {
    title: "Contact",
    content:
      "Questions about these terms? Reach us at hello@thevillage.com.au or through the Contact page. For urgent safety concerns, please email safety@thevillage.com.au.",
  },
];

export default function Terms({ user }) {
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
            <ScrollText className="h-5 w-5 text-primary" />
          </div>
          <h1 className="font-heading text-3xl font-bold text-foreground">Terms &amp; Conditions</h1>
        </div>
        <p className="text-muted-foreground mb-2">
          The Village is a community built on trust. These terms protect every parent here — including you.
        </p>
        <p className="text-xs text-muted-foreground mb-8">Last updated: April 2026</p>

        <div className="space-y-4">
          {SECTIONS.map((section) => (
            <div key={section.title} className="bg-card rounded-2xl p-6 border border-border/50">
              <h2 className="font-heading text-lg font-semibold text-foreground mb-2">{section.title}</h2>
              <p className="text-muted-foreground leading-relaxed">{section.content}</p>
            </div>
          ))}
        </div>

      </main>
      <AppFooter />
    </div>
  );
}
