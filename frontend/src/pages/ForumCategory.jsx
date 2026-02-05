import { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import Navigation from "../components/Navigation";
import { ArrowLeft, Plus, MessageCircle, Heart, Eye, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

const API_URL = process.env.REACT_APP_BACKEND_URL;

export default function ForumCategory({ user }) {
  const { categoryId } = useParams();
  const [category, setCategory] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [categoryId]);

  const fetchData = async () => {
    try {
      const [catRes, postsRes] = await Promise.all([
        fetch(`${API_URL}/api/forums/categories/${categoryId}`, { credentials: "include" }),
        fetch(`${API_URL}/api/forums/posts?category_id=${categoryId}`, { credentials: "include" })
      ]);

      if (catRes.ok) setCategory(await catRes.json());
      if (postsRes.ok) setPosts(await postsRes.json());
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch {
      return "recently";
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20 lg:pb-0">
      <Navigation user={user} />
      
      <main className="max-w-4xl mx-auto px-4 pt-20 lg:pt-24">
        <Link to="/forums" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors" data-testid="back-link">
          <ArrowLeft className="h-4 w-4" />
          Back to Forums
        </Link>

        {loading ? (
          <div className="animate-pulse space-y-6">
            <div className="h-8 w-48 bg-muted rounded"></div>
            <div className="h-4 w-64 bg-muted rounded"></div>
          </div>
        ) : category ? (
          <>
            <div className="flex items-start justify-between mb-8">
              <div className="flex items-center gap-4">
                <span className="text-4xl">{category.icon}</span>
                <div>
                  <h1 className="font-heading text-2xl sm:text-3xl font-bold text-foreground">{category.name}</h1>
                  <p className="text-muted-foreground">{category.description}</p>
                </div>
              </div>
              <Link to={`/create-post?category=${categoryId}`}>
                <Button className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full shadow-[0_0_15px_rgba(245,197,66,0.3)]" data-testid="create-post-btn">
                  <Plus className="h-4 w-4 mr-2" />
                  New Post
                </Button>
              </Link>
            </div>

            {posts.length === 0 ? (
              <div className="text-center py-12 bg-card rounded-2xl border border-border/50">
                <span className="text-5xl mb-4 block">💬</span>
                <h3 className="font-heading text-xl font-bold text-foreground mb-2">No posts yet</h3>
                <p className="text-muted-foreground mb-4">Be the first to start a conversation!</p>
                <Link to={`/create-post?category=${categoryId}`}>
                  <Button className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full" data-testid="empty-create-post-btn">
                    Create First Post
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {posts.map((post, idx) => (
                  <Link 
                    key={post.post_id} 
                    to={`/forums/post/${post.post_id}`}
                    className="block"
                    data-testid={`post-card-${idx}`}
                  >
                    <article className="bg-card rounded-2xl p-6 border border-border/50 hover:border-primary/30 transition-all card-hover">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={post.author_picture} />
                            <AvatarFallback className="bg-primary/20 text-primary">
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

                      <h3 className="font-heading font-bold text-lg text-foreground mb-2">{post.title}</h3>
                      <p className="text-muted-foreground line-clamp-2 mb-4">{post.content}</p>

                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Heart className="h-4 w-4" />
                          <span>{post.like_count || 0}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <MessageCircle className="h-4 w-4" />
                          <span>{post.reply_count || 0}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Eye className="h-4 w-4" />
                          <span>{post.views || 0}</span>
                        </div>
                      </div>
                    </article>
                  </Link>
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12">
            <h3 className="font-heading text-xl font-bold text-foreground">Category not found</h3>
          </div>
        )}
      </main>
    </div>
  );
}
