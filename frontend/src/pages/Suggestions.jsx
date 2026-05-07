import { useState } from "react";
import { Link } from "react-router-dom";
import Navigation from "../components/Navigation";
import AppFooter from "../components/AppFooter";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { ArrowLeft, Lightbulb } from "lucide-react";
import { toast } from "sonner";

const CATEGORIES = [
  "New Feature",
  "Improvement",
  "Bug Report",
  "Content Request",
  "Other",
];

const PRIORITIES = [
  { value: "nice", label: "Nice to have", description: "Would be a lovely addition" },
  { value: "helpful", label: "Would really help", description: "Makes a real difference to how I use The Village" },
  { value: "essential", label: "Essential", description: "I really need this — it's blocking me or others" },
];

const CHAR_LIMIT = 1000;

const EMPTY_FORM = {
  title: "",
  category: "New Feature",
  description: "",
  priority: "nice",
};

export default function Suggestions({ user }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);

  function handleChange(e) {
    const { name, value } = e.target;
    if (name === "description" && value.length > CHAR_LIMIT) return;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!form.title.trim() || !form.description.trim()) return;
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      setForm(EMPTY_FORM);
      toast.success("Thank you — your suggestion has been noted.");
    }, 1000);
  }

  const charsLeft = CHAR_LIMIT - form.description.length;

  return (
    <div className="min-h-screen bg-background pb-20 lg:pl-60 lg:pb-0">
      <Navigation user={user} />

      <main className="max-w-3xl mx-auto px-4 pt-16 lg:pt-8">
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Link>

        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center">
            <Lightbulb className="h-5 w-5 text-primary" />
          </div>
          <h1 className="font-heading text-3xl font-bold text-foreground">Shape the Village</h1>
        </div>
        <p className="text-muted-foreground mb-8">
          Your ideas make The Village better. Tell us what you'd love to see.
        </p>

        <form onSubmit={handleSubmit} className="bg-card rounded-2xl p-6 border border-border/50 space-y-6">
          {/* Feature title */}
          <div className="space-y-1.5">
            <label htmlFor="title" className="text-sm font-medium text-foreground">
              Feature title
            </label>
            <Input
              id="title"
              name="title"
              placeholder="Give your idea a short name…"
              value={form.title}
              onChange={handleChange}
              required
            />
          </div>

          {/* Category */}
          <div className="space-y-1.5">
            <label htmlFor="category" className="text-sm font-medium text-foreground">
              Category
            </label>
            <select
              id="category"
              name="category"
              value={form.category}
              onChange={handleChange}
              className="w-full rounded-lg border border-border/50 bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label htmlFor="description" className="text-sm font-medium text-foreground">
              Description
            </label>
            <Textarea
              id="description"
              name="description"
              placeholder="Describe your idea in as much detail as you like. Why would it help? Who would benefit?"
              rows={6}
              value={form.description}
              onChange={handleChange}
              required
            />
            <p className={`text-xs text-right ${charsLeft < 100 ? "text-amber-500" : "text-muted-foreground"}`}>
              {charsLeft} characters remaining
            </p>
          </div>

          {/* Priority */}
          <div className="space-y-2">
            <p className="text-sm font-medium text-foreground">How important is this to you?</p>
            <div className="space-y-2">
              {PRIORITIES.map((p) => (
                <label
                  key={p.value}
                  className={`flex items-start gap-3 rounded-xl border p-3.5 cursor-pointer transition-colors ${
                    form.priority === p.value
                      ? "border-primary/50 bg-primary/5"
                      : "border-border/50 bg-background hover:border-border"
                  }`}
                >
                  <input
                    type="radio"
                    name="priority"
                    value={p.value}
                    checked={form.priority === p.value}
                    onChange={handleChange}
                    className="mt-0.5 accent-primary"
                  />
                  <div>
                    <p className="text-sm font-medium text-foreground">{p.label}</p>
                    <p className="text-xs text-muted-foreground">{p.description}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div className="pt-1">
            <Button type="submit" disabled={submitting} className="w-full sm:w-auto">
              {submitting ? "Submitting…" : "Submit suggestion"}
            </Button>
          </div>
        </form>

        {/* Community guidelines callout */}
        <div className="mt-6 bg-card rounded-2xl p-5 border border-border/50 flex items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            Have a suggestion about <span className="text-foreground font-medium">Community Guidelines</span>?
          </p>
          <Link
            to="/community-guidelines"
            className="text-sm font-medium text-primary hover:underline underline-offset-2 shrink-0"
          >
            View guidelines →
          </Link>
        </div>
      </main>
      <AppFooter />
    </div>
  );
}
