import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import Navigation from "../components/Navigation";
import { ArrowLeft, BookOpen, Eye, Clock, Tag, Trash2 } from "lucide-react";
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

// Very basic markdown renderer: bold, italic, headings, bullets, line breaks
function renderMarkdown(md = "") {
  const lines = md.split("\n");
  const elements = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (line.startsWith("## ")) {
      elements.push(
        <h2 key={i} className="font-heading font-bold text-xl text-foreground mt-6 mb-2">
          {inlineFormat(line.slice(3))}
        </h2>
      );
    } else if (line.startsWith("### ")) {
      elements.push(
        <h3 key={i} className="font-heading font-semibold text-lg text-foreground mt-5 mb-2">
          {inlineFormat(line.slice(4))}
        </h3>
      );
    } else if (line.startsWith("# ")) {
      elements.push(
        <h1 key={i} className="font-heading font-bold text-2xl text-foreground mt-6 mb-3">
          {inlineFormat(line.slice(2))}
        </h1>
      );
    } else if (line.startsWith("- ") || line.startsWith("* ")) {
      // Collect bullet list
      const bullets = [];
      while (i < lines.length && (lines[i].startsWith("- ") || lines[i].startsWith("* "))) {
        bullets.push(
          <li key={i} className="text-foreground/90 leading-relaxed">
            {inlineFormat(lines[i].slice(2))}
          </li>
        );
        i++;
      }
      elements.push(
        <ul key={`ul-${i}`} className="list-disc list-inside space-y-1 my-3 ml-2">
          {bullets}
        </ul>
      );
      continue;
    } else if (line.trim() === "") {
      elements.push(<div key={i} className="h-2" />);
    } else {
      elements.push(
        <p key={i} className="text-foreground/90 leading-relaxed">
          {inlineFormat(line)}
        </p>
      );
    }

    i++;
  }

  return elements;
}

function inlineFormat(text) {
  // Handle **bold** and *italic*
  const parts = [];
  const regex = /(\*\*(.+?)\*\*|\*(.+?)\*)/g;
  let last = 0;
  let match;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > last) parts.push(text.slice(last, match.index));
    if (match[0].startsWith("**")) {
      parts.push(<strong key={match.index}>{match[2]}</strong>);
    } else {
      parts.push(<em key={match.index}>{match[3]}</em>);
    }
    last = match.index + match[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts.length > 0 ? parts : text;
}

export default function BlogPost({ user }) {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  const isAdmin = user?.role === "admin" || user?.role === "moderator";

  useEffect(() => {
    fetchPost();
  }, [slug]);

  const fetchPost = async () => {
    try {
      const res = await fetch(`${API_URL}/api/blog/${slug}`, { credentials: "include" });
      if (res.ok) {
        setPost(await res.json());
      } else {
        navigate("/blog");
      }
    } catch {
      navigate("/blog");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Delete this blog post?")) return;
    setDeleting(true);
    try {
      const res = await fetch(`${API_URL}/api/blog/${post.blog_id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (res.ok) {
        toast.success("Post deleted");
        navigate("/blog");
      } else {
        toast.error("Failed to delete");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20 lg:pb-0">
      <Navigation user={user} />

      <main className="max-w-3xl mx-auto px-4 pt-20 lg:pt-24">
        <div className="mb-6">
          <Link to="/blog">
            <Button variant="ghost" size="sm" className="rounded-full -ml-2 text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to Blog
            </Button>
          </Link>
        </div>

        {loading ? (
          <div className="space-y-4 animate-pulse">
            <div className="h-8 bg-muted rounded w-3/4" />
            <div className="h-4 bg-muted rounded w-full" />
            <div className="h-4 bg-muted rounded w-2/3" />
          </div>
        ) : post ? (
          <>
            {/* Post header */}
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <BookOpen className="h-5 w-5 text-primary" />
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
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
              </div>

              <h1 className="font-heading font-bold text-2xl sm:text-3xl text-foreground leading-tight mb-3">
                {post.title}
              </h1>
              <p className="text-muted-foreground text-base leading-relaxed mb-4">{post.summary}</p>

              {post.tags?.length > 0 && (
                <div className="flex items-center gap-2 flex-wrap">
                  <Tag className="h-3.5 w-3.5 text-muted-foreground" />
                  {post.tags.map(tag => (
                    <span key={tag} className="text-xs px-2.5 py-1 rounded-full bg-secondary text-muted-foreground">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Post content */}
            <div className="bg-card rounded-2xl p-6 sm:p-8 border border-border/50 mb-6 space-y-1">
              {renderMarkdown(post.content)}
            </div>

            {/* Source topics (admin only) */}
            {isAdmin && post.source_topics?.length > 0 && (
              <div className="bg-secondary/30 rounded-xl p-4 mb-6 text-sm">
                <p className="font-medium text-foreground mb-1">Source topics (community trending)</p>
                <ul className="list-disc list-inside text-muted-foreground space-y-0.5">
                  {post.source_topics.map((t, i) => <li key={i}>{t}</li>)}
                </ul>
              </div>
            )}

            {/* Admin actions */}
            {isAdmin && (
              <div className="flex justify-end mb-8">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDelete}
                  disabled={deleting}
                  className="text-destructive hover:text-destructive hover:bg-destructive/10 rounded-full"
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  {deleting ? "Deleting…" : "Delete Post"}
                </Button>
              </div>
            )}
          </>
        ) : null}
      </main>
    </div>
  );
}
