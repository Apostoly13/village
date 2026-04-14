import { useState } from "react";
import { Link } from "react-router-dom";
import Navigation from "../components/Navigation";
import AppFooter from "../components/AppFooter";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { ArrowLeft, Mail } from "lucide-react";
import { toast } from "sonner";

const SUBJECTS = [
  "General Enquiry",
  "Report a Bug",
  "Partnership",
  "Press",
  "Other",
];

const EMPTY_FORM = { name: "", email: "", subject: "General Enquiry", message: "" };

export default function Contact({ user }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [sending, setSending] = useState(false);

  function handleChange(e) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) return;
    setSending(true);
    setTimeout(() => {
      setSending(false);
      setForm(EMPTY_FORM);
      toast.success("Message sent — we'll be in touch soon.");
    }, 1200);
  }

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
            <Mail className="h-5 w-5 text-primary" />
          </div>
          <h1 className="font-heading text-3xl font-bold text-foreground">Get in touch</h1>
        </div>
        <p className="text-muted-foreground mb-8">
          We'd love to hear from you. Fill in the form below and we'll get back to you within 2 business days.
        </p>

        {/* Safety callout */}
        <div className="bg-red-500/10 border border-red-500/25 rounded-2xl p-4 mb-8 flex items-start gap-3">
          <span className="text-lg mt-0.5">🛡️</span>
          <p className="text-sm text-foreground leading-relaxed">
            <span className="font-semibold">For urgent safety concerns</span>, please email us directly at{" "}
            <a
              href="mailto:safety@thevillage.com.au"
              className="text-primary underline underline-offset-2 font-medium"
            >
              safety@thevillage.com.au
            </a>{" "}
            — we monitor this address around the clock.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-card rounded-2xl p-6 border border-border/50 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label htmlFor="name" className="text-sm font-medium text-foreground">
                Name
              </label>
              <Input
                id="name"
                name="name"
                placeholder="Your name"
                value={form.name}
                onChange={handleChange}
                required
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="email" className="text-sm font-medium text-foreground">
                Email
              </label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="subject" className="text-sm font-medium text-foreground">
              Subject
            </label>
            <select
              id="subject"
              name="subject"
              value={form.subject}
              onChange={handleChange}
              className="w-full rounded-lg border border-border/50 bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition"
            >
              {SUBJECTS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="message" className="text-sm font-medium text-foreground">
              Message
            </label>
            <Textarea
              id="message"
              name="message"
              placeholder="Tell us what's on your mind…"
              rows={5}
              value={form.message}
              onChange={handleChange}
              required
            />
          </div>

          <div className="flex items-center justify-between pt-1">
            <p className="text-xs text-muted-foreground">We aim to respond within 2 business days.</p>
            <Button type="submit" disabled={sending}>
              {sending ? "Sending…" : "Send message"}
            </Button>
          </div>
        </form>
      </main>
      <AppFooter />
    </div>
  );
}
