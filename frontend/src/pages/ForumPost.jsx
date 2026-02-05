import { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { Textarea } from "../components/ui/textarea";
import { Checkbox } from "../components/ui/checkbox";
import { Label } from "../components/ui/label";
import Navigation from "../components/Navigation";
import { toast } from "sonner";
import { ArrowLeft, Heart, MessageCircle, Eye, Clock, Send } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

const API_URL = process.env.REACT_APP_BACKEND_URL;

export default function ForumPost({ user }) {
  const { postId } = useParams();
  const [post, setPost] = useState(null);
  const [replies, setReplies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [replyContent, setReplyContent] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [liked, setLiked] = useState(false);

  useEffect(() => {
    fetchData();
  }, [postId]);

  const fetchData = async () => {
    try {
      const [postRes, repliesRes] = await Promise.all([
        fetch(`${API_URL}/api/forums/posts/${postId}`, { credentials: "include" }),
        fetch(`${API_URL}/api/forums/posts/${postId}/replies`, { credentials: "include" })
      ]);

      if (postRes.ok) setPost(await postRes.json());
      if (repliesRes.ok) setReplies(await repliesRes.json());
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async () => {
    try {
      const response = await fetch(`${API_URL}/api/forums/posts/${postId}/like`, {
        method: "POST",
        credentials: "include"
      });
      if (response.ok) {
        const data = await response.json();
        setLiked(data.liked);
        setPost(prev => ({
          ...prev,
          like_count: data.liked ? (prev.like_count || 0) + 1 : (prev.like_count || 1) - 1
        }));
      }
    } catch (error) {
      console.error("Error liking post:", error);
    }
  };

  const handleReply = async (e) => {
    e.preventDefault();
    if (!replyContent.trim()) return;

    setSubmitting(true);
    try {
      const response = await fetch(`${API_URL}/api/forums/posts/${postId}/replies`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          content: replyContent,
          is_anonymous: isAnonymous
        })
      });

      if (response.ok) {
        const newReply = await response.json();
        setReplies(prev => [...prev, newReply]);
        setReplyContent("");
        setIsAnonymous(false);
        setPost(prev => ({ ...prev, reply_count: (prev.reply_count || 0) + 1 }));
        toast.success("Reply posted!");
      } else {
        toast.error("Failed to post reply");
      }
    } catch (error) {
      toast.error("Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateString) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch {
      return "recently";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background pb-20 lg:pb-0">
        <Navigation user={user} />
        <main className="max-w-4xl mx-auto px-4 pt-20 lg:pt-24">
          <div className="animate-pulse space-y-6">
            <div className="h-6 w-32 bg-muted rounded"></div>
            <div className="bg-card rounded-2xl p-6 border border-border/50 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-muted"></div>
                <div className="space-y-2">
                  <div className="w-32 h-4 bg-muted rounded"></div>
                  <div className="w-20 h-3 bg-muted rounded"></div>
                </div>
              </div>
              <div className="w-3/4 h-6 bg-muted rounded"></div>
              <div className="w-full h-20 bg-muted rounded"></div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-background pb-20 lg:pb-0">
        <Navigation user={user} />
        <main className="max-w-4xl mx-auto px-4 pt-20 lg:pt-24 text-center">
          <h1 className="font-heading text-2xl font-bold text-foreground">Post not found</h1>
          <Link to="/forums">
            <Button className="mt-4">Back to Forums</Button>
          </Link>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20 lg:pb-0">
      <Navigation user={user} />
      
      <main className="max-w-4xl mx-auto px-4 pt-20 lg:pt-24">
        <Link to="/forums" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors" data-testid="back-link">
          <ArrowLeft className="h-4 w-4" />
          Back to Forums
        </Link>

        {/* Main Post */}
        <article className="bg-card rounded-2xl p-6 border border-border/50 mb-6" data-testid="post-content">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <Avatar className="h-12 w-12">
                <AvatarImage src={post.author_picture} />
                <AvatarFallback className="bg-primary/20 text-primary text-lg">
                  {post.author_name?.[0]?.toUpperCase() || '?'}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium text-foreground">{post.author_name}</p>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  <span>{formatDate(post.created_at)}</span>
                </div>
              </div>
            </div>
            {post.is_anonymous && (
              <span className="text-xs px-2 py-1 rounded-full bg-secondary text-muted-foreground">
                Anonymous
              </span>
            )}
          </div>

          <h1 className="font-heading text-2xl font-bold text-foreground mb-4">{post.title}</h1>
          <p className="text-foreground whitespace-pre-wrap mb-6">{post.content}</p>

          <div className="flex items-center gap-4 pt-4 border-t border-border/50">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleLike}
              className={`rounded-full ${liked ? 'text-red-500' : 'text-muted-foreground'}`}
              data-testid="like-btn"
            >
              <Heart className={`h-4 w-4 mr-1 ${liked ? 'fill-current' : ''}`} />
              {post.like_count || 0}
            </Button>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <MessageCircle className="h-4 w-4" />
              <span>{post.reply_count || 0} replies</span>
            </div>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Eye className="h-4 w-4" />
              <span>{post.views || 0} views</span>
            </div>
          </div>
        </article>

        {/* Replies */}
        <div className="space-y-4 mb-6">
          <h2 className="font-heading text-xl font-bold text-foreground">
            {replies.length} {replies.length === 1 ? 'Reply' : 'Replies'}
          </h2>
          
          {replies.length === 0 ? (
            <div className="text-center py-8 bg-card rounded-2xl border border-border/50">
              <p className="text-muted-foreground">No replies yet. Be the first to respond!</p>
            </div>
          ) : (
            replies.map((reply, idx) => (
              <div 
                key={reply.reply_id} 
                className="bg-card rounded-2xl p-5 border border-border/50"
                data-testid={`reply-${idx}`}
              >
                <div className="flex items-start gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={reply.author_picture} />
                    <AvatarFallback className="bg-primary/20 text-primary">
                      {reply.author_name?.[0]?.toUpperCase() || '?'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-medium text-foreground">{reply.author_name}</span>
                      {reply.is_anonymous && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">
                          Anonymous
                        </span>
                      )}
                      <span className="text-xs text-muted-foreground">•</span>
                      <span className="text-xs text-muted-foreground">{formatDate(reply.created_at)}</span>
                    </div>
                    <p className="text-foreground whitespace-pre-wrap">{reply.content}</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Reply Form */}
        <div className="bg-card rounded-2xl p-6 border border-border/50 mb-8" data-testid="reply-form">
          <h3 className="font-heading font-bold text-lg text-foreground mb-4">Add a Reply</h3>
          <form onSubmit={handleReply} className="space-y-4">
            <Textarea 
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              placeholder="Share your thoughts or support..."
              className="min-h-[100px] bg-secondary/50 border-transparent focus:border-primary rounded-xl resize-none"
              data-testid="reply-input"
            />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Checkbox 
                  id="anonymous" 
                  checked={isAnonymous}
                  onCheckedChange={(checked) => setIsAnonymous(checked)}
                  data-testid="anonymous-checkbox"
                />
                <Label htmlFor="anonymous" className="text-sm text-muted-foreground cursor-pointer">
                  Post anonymously
                </Label>
              </div>
              <Button 
                type="submit" 
                disabled={submitting || !replyContent.trim()}
                className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full"
                data-testid="submit-reply-btn"
              >
                {submitting ? "Posting..." : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Reply
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
