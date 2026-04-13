import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Label } from "../components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../components/ui/dialog";
import Navigation from "../components/Navigation";
import AppFooter from "../components/AppFooter";
import { BookOpen, Sparkles, Eye, Clock, Tag, PenLine } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

const API_URL = process.env.REACT_APP_BACKEND_URL;

function readTime(content = "") {
  const words = content.split(/\s+/).length;
  return Math.max(1, Math.round(words / 200));
}

function formatDate(dateString) {
  try {
    return formatDistanceToNow(new Date(dateString), { addSuffix: true });
  } catch {
    return "recently";
  }
}

function WriteArticleDialog({ onSubmitted }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [tagsRaw, setTagsRaw] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      toast.error("Title and content are required");
      return;
    }
    setSubmitting(true);
    try {
      const tags = tagsRaw.split(",").map(t => t.trim()).filter(Boolean);
      const res = await fetch(`${API_URL}/api/blog/submit`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, content, excerpt, tags }),
      });
      if (res.ok) {
        toast.success("Your article has been submitted for review 🎉");
        setOpen(false);
        setTitle(""); setContent(""); setExcerpt(""); setTagsRaw("");
        if (onSubmitted) onSubmitted();
      } else {
        const err = await res.json();
        toast.error(err.detail || "Submission failed");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="rounded-full border-primary text-primary hover:bg-primary/10">
          <PenLine className="h-4 w-4 mr-2" />
          Write for the Village
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-card border-border/50 max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-heading font-bold">Write an Article</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-1">
            <Label className="text-foreground">Title *</Label>
            <Input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Give your article a compelling headline"
              className="rounded-xl bg-secondary/50 border-transparent"
              maxLength={200}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-foreground">Short description</Label>
            <Input
              value={excerpt}
              onChange={e => setExcerpt(e.target.value.slice(0, 200))}
              placeholder="1–2 sentences summarising the article (max 200 chars)"
              className="rounded-xl bg-secondary/50 border-transparent"
              maxLength={200}
            />
            <p className="text-xs text-muted-foreground text-right">{excerpt.length}/200</p>
          </div>
          <div className="space-y-1">
            <Label className="text-foreground">Content *</Label>
            <Textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder="Write your article here. Markdown is supported."
              className="min-h-[200px] rounded-xl bg-secondary/50 border-transparent resize-none"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-foreground">Tags (comma-separated)</Label>
            <Input
              value={tagsRaw}
              onChange={e => setTagsRaw(e.target.value)}
              placeholder="e.g. sleep, newborns, mental health"
              className="rounded-xl bg-secondary/50 border-transparent"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} className="flex-1 rounded-xl" disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" className="flex-1 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90" disabled={submitting}>
              {submitting ? "Submitting..." : "Submit for Review"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function Blog({ user }) {
  const [posts, setPosts] = useState([]);
  const [ownDrafts, setOwnDrafts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  const isAdmin = user?.role === "admin" || user?.role === "moderator";

  useEffect(() => {
    fetchPosts();
  }, [user]);

  const fetchPosts = async () => {
    try {
      const url = user ? `${API_URL}/api/blog?include_own=true` : `${API_URL}/api/blog`;
      const res = await fetch(url, { credentials: "include" });
      if (res.ok) {
        const all = await res.json();
        // Separate published from user's own drafts
        const published = all.filter(p => p.is_published);
        const drafts = user ? all.filter(p => !p.is_published && p.author_user_id === user.user_id) : [];
        setPosts(published);
        setOwnDrafts(drafts);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const generatePost = async () => {
    setGenerating(true);
    try {
      const res = await fetch(`${API_URL}/api/blog/generate`, {
        method: "POST",
        credentials: "include",
      });
      if (res.ok) {
        const post = await res.json();
        setPosts(prev => [post, ...prev]);
        toast.success("New blog post generated!");
      } else {
        const err = await res.json();
        toast.error(err.detail || "Generation failed");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setGenerating(false);
    }
  };

  const statusBadge = (status) => {
    if (status === "pending_review") return <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 font-medium">Pending review</span>;
    if (status === "rejected") return <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/10 text-red-600 font-medium">Rejected</span>;
    return <span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">{status}</span>;
  };

  return (
    <div className="min-h-screen bg-background pb-20 lg:pb-0">
      <Navigation user={user} />

      <main className="max-w-4xl mx-auto px-4 pt-20 lg:pt-24">
        {/* Header */}
        <div className="mb-8 flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="font-heading text-2xl sm:text-3xl font-bold text-foreground mb-1">Village Blog</h1>
            <p className="text-sm text-muted-foreground">Evidence-based insights for Australian parents</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {user && (
              <WriteArticleDialog onSubmitted={fetchPosts} />
            )}
            {isAdmin && (
              <Button
                onClick={generatePost}
                disabled={generating}
                className="rounded-full bg-primary text-primary-foreground"
              >
                <Sparkles className="h-4 w-4 mr-2" />
                {generating ? "Generating…" : "Generate Post"}
              </Button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-card rounded-2xl p-6 border border-border/50 animate-pulse">
                <div className="w-3/4 h-6 bg-muted rounded mb-3" />
                <div className="w-full h-4 bg-muted rounded mb-2" />
                <div className="w-2/3 h-4 bg-muted rounded" />
              </div>
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-16 bg-card rounded-2xl border border-border/50">
            <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-heading font-semibold text-foreground mb-2">No posts yet</h3>
            <p className="text-sm text-muted-foreground mb-4">
              {isAdmin
                ? "Generate your first AI-powered blog post based on what's trending in the community."
                : "Check back soon for parenting insights and tips."}
            </p>
            {isAdmin && (
              <Button onClick={generatePost} disabled={generating} className="rounded-full bg-primary text-primary-foreground">
                <Sparkles className="h-4 w-4 mr-2" />
                {generating ? "Generating…" : "Generate First Post"}
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map((post, idx) => (
              <Link key={post.blog_id || idx} to={`/blog/${post.slug}`} className="block">
                {idx === 0 ? (
                  /* Featured / hero card for the first post */
                  <article className="bg-card rounded-2xl border border-border/40 card-elevated border-l-4 border-l-primary/60 hover:shadow-md hover:border-l-primary transition-all overflow-hidden">
                    <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent px-6 py-5">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-xs font-semibold uppercase tracking-widest text-primary/80">Featured</span>
                        <span className="w-1 h-1 rounded-full bg-primary/30" />
                        <span className="text-xs text-muted-foreground">{formatDate(post.created_at)}</span>
                      </div>
                      <h2 className="font-heading font-bold text-xl sm:text-2xl text-foreground mb-2 leading-snug">
                        {post.title}
                      </h2>
                      <p className="text-sm text-muted-foreground line-clamp-3 mb-4">{post.summary}</p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {readTime(post.content)} min read
                        </span>
                        <span className="flex items-center gap-1">
                          <Eye className="h-3 w-3" />
                          {post.view_count || 0} views
                        </span>
                      </div>
                      {post.tags?.length > 0 && (
                        <div className="flex items-center gap-1.5 mt-3 flex-wrap">
                          {post.tags.map(tag => (
                            <span key={tag} className="text-xs px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 font-medium">
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </article>
                ) : (
                  /* Standard post card */
                  <article className="bg-card rounded-2xl p-5 border border-border/40 card-elevated border-l-2 border-l-primary/20 hover:shadow-md hover:border-l-primary/40 transition-all">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                        <BookOpen className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h2 className="font-heading font-bold text-base text-foreground mb-1 leading-snug">
                          {post.title}
                        </h2>
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{post.summary}</p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {readTime(post.content)} min read
                          </span>
                          <span className="flex items-center gap-1">
                            <Eye className="h-3 w-3" />
                            {post.view_count || 0} views
                          </span>
                          <span>{formatDate(post.created_at)}</span>
                        </div>
                        {post.tags?.length > 0 && (
                          <div className="flex items-center gap-1.5 mt-3 flex-wrap">
                            {post.tags.map(tag => (
                              <span key={tag} className="text-xs px-2.5 py-0.5 rounded-full bg-secondary text-muted-foreground border border-border/40">
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </article>
                )}
              </Link>
            ))}
          </div>
        )}

        {/* My submissions section */}
        {ownDrafts.length > 0 && (
          <div className="mt-10">
            <p className="font-heading font-semibold text-xs uppercase tracking-widest text-muted-foreground mb-4">My submissions</p>
            <div className="space-y-3">
              {ownDrafts.map((post, idx) => (
                <div key={post.blog_id || idx} className="bg-card rounded-2xl p-5 border border-border/50 border-l-2 border-l-primary/20 shadow-sm">
                  <div className="flex items-start justify-between gap-3 mb-1">
                    <h3 className="font-heading font-semibold text-foreground leading-snug">{post.title}</h3>
                    {statusBadge(post.status)}
                  </div>
                  {post.summary && (
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-2">{post.summary}</p>
                  )}
                  <p className="text-xs text-muted-foreground">Submitted {formatDate(post.created_at)}</p>
                  {post.reject_reason && (
                    <p className="text-xs text-red-600 mt-2">Reason: {post.reject_reason}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Info card */}
        {posts.length > 0 && (
          <div className="mt-8 p-5 rounded-2xl bg-primary/5 border border-primary/20">
            <div className="flex items-start gap-3">
              <Sparkles className="h-5 w-5 text-primary mt-0.5 shrink-0" />
              <p className="text-sm text-muted-foreground">
                Village Blog posts are generated by AI using real parenting research and inspired by what's trending in our community — always fact-based, never fabricated.
              </p>
            </div>
          </div>
        )}
      </main>
      <AppFooter />
    </div>
  );
}
