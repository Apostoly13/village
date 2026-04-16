import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Label } from "../components/ui/label";
import { Checkbox } from "../components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import Navigation from "../components/Navigation";
import AppFooter from "../components/AppFooter";
import { toast } from "sonner";
import { ArrowLeft, Image, X, Upload, Crown, MapPin, ArrowRight } from "lucide-react";
import { parseApiError } from "../utils/apiError";

const API_URL = process.env.REACT_APP_BACKEND_URL;
const MAX_CONTENT_LENGTH = 5000;

export default function CreatePost({ user }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedCategory = searchParams.get('category');
  const fileInputRef = useRef(null);

  const [categories, setCategories] = useState([]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [categoryId, setCategoryId] = useState(preselectedCategory || "");
  const [isAnonymous, setIsAnonymous] = useState(user?.anonymous_by_default || false);
  const [loading, setLoading] = useState(false);
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [subscription, setSubscription] = useState(null);
  const [postSuburb, setPostSuburb] = useState(user?.suburb || "");
  const [postPostcode, setPostPostcode] = useState(user?.postcode || "");
  const [postLatitude, setPostLatitude] = useState(user?.latitude || null);
  const [postLongitude, setPostLongitude] = useState(user?.longitude || null);
  const [postState, setPostState] = useState(user?.state || "");
  const [visibility, setVisibility] = useState("public");

  useEffect(() => {
    fetchCategories();
    fetchSubscription();
  }, []);

  const fetchSubscription = async () => {
    try {
      const response = await fetch(`${API_URL}/api/subscription/status`, {
        credentials: "include"
      });
      if (response.ok) {
        setSubscription(await response.json());
      }
    } catch (error) {
      console.error("Error fetching subscription:", error);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch(`${API_URL}/api/forums/categories`, {
        credentials: "include"
      });
      if (response.ok) {
        const data = await response.json();
        setCategories(data);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const handleImageSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Please select a valid image (JPEG, PNG, GIF, or WebP)");
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be less than 5MB");
      return;
    }

    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`${API_URL}/api/upload/image`, {
        method: 'POST',
        credentials: 'include',
        body: formData
      });

      if (response.ok) {
        const data = await response.json();
        setImage(data.image_url);
        setImagePreview(data.image_url);
        toast.success("Image uploaded!");
      } else {
        const error = await response.json();
        toast.error(parseApiError(error.detail, "Failed to upload image"));
      }
    } catch (error) {
      toast.error("Failed to upload image");
    } finally {
      setUploadingImage(false);
    }
  };

  const selectedCategory = categories.find(c => c.category_id === categoryId);
  const isLocationAware = selectedCategory?.is_location_aware || false;

  const removeImage = () => {
    setImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!title.trim() || !content.trim() || !categoryId) {
      toast.error("Please fill in all fields");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/forums/posts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          title,
          content,
          category_id: categoryId,
          is_anonymous: isAnonymous,
          image: image,
          visibility: visibility,
          ...(isLocationAware ? {
            latitude: postLatitude,
            longitude: postLongitude,
            suburb: postSuburb,
            postcode: postPostcode,
            state: postState,
          } : {})
        })
      });

      if (response.ok) {
        const post = await response.json();
        toast.success("Post created successfully!");
        navigate(`/forums/post/${post.post_id}`);
      } else if (response.status === 429) {
        const error = await response.json();
        toast.error(parseApiError(error.detail, "Monthly post limit reached"));
        fetchSubscription();
      } else {
        const error = await response.json();
        toast.error(parseApiError(error.detail, "Failed to create post"));
      }
    } catch (error) {
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20 lg:pb-0">
      <Navigation user={user} />
      
      <main className="max-w-2xl mx-auto px-4 pt-20 lg:pt-24">
        <button 
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
          data-testid="back-btn"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>

        <div className="bg-card rounded-2xl p-6 border border-border/40 card-elevated">
          <h1 className="font-heading text-2xl font-bold text-foreground mb-6">Create a Post</h1>

          {subscription && subscription.limits_apply && subscription.forum_posts && (() => {
            const remaining = Math.max(0, subscription.forum_posts.limit - subscription.forum_posts.used);
            return (
              <div className={`rounded-xl p-4 mb-6 flex items-center gap-3 ${
                remaining === 0
                  ? 'bg-red-500/10 border border-red-500/30'
                  : remaining <= 2
                    ? 'bg-amber-500/10 border border-amber-500/30'
                    : 'bg-secondary/50 border border-border/30'
              }`} data-testid="post-limit-banner">
                {remaining === 0 ? (
                  <Link to="/plus" className="flex items-center gap-3 w-full group">
                    <Crown className="h-5 w-5 text-amber-500 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="font-medium text-foreground text-sm">Monthly post limit reached</p>
                      <p className="text-xs text-muted-foreground">Upgrade to Village+ for unlimited posts</p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-amber-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Link>
                ) : (
                  <>
                    <div className="flex-1">
                      <p className="text-sm text-foreground">
                        <span className="font-medium">{remaining}</span> of {subscription.forum_posts.limit} posts remaining this month
                      </p>
                    </div>
                    {remaining <= 2 && (
                      <Crown className="h-4 w-4 text-amber-500 flex-shrink-0" />
                    )}
                  </>
                )}
              </div>
            );
          })()}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="category" className="text-foreground">Category</Label>
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger className="h-12 rounded-xl bg-secondary/50 border-transparent" data-testid="category-select">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border/50">
                  {categories.map((cat) => (
                    <SelectItem key={cat.category_id} value={cat.category_id}>
                      <span className="flex items-center gap-2">
                        <span>{cat.icon}</span>
                        <span>{cat.name}</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedCategory && (selectedCategory.name?.includes("Meetup") || selectedCategory.name?.includes("Local")) && (
                <p className="text-xs text-muted-foreground">
                  📅 Have a date in mind? You can also{" "}
                  <Link to="/events" className="text-primary hover:underline">create an event →</Link>
                  {" "}to let people RSVP.
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="title" className="text-foreground">Title</Label>
              <Input 
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value.slice(0, 200))}
                placeholder="What's on your mind?"
                className="h-12 rounded-xl bg-secondary/50 border-transparent focus:border-primary"
                maxLength={200}
                data-testid="title-input"
              />
              <p className="text-xs text-muted-foreground text-right">{title.length}/200</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="content" className="text-foreground">Content</Label>
              <Textarea 
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value.slice(0, MAX_CONTENT_LENGTH))}
                placeholder="Share your thoughts, questions, or experiences..."
                className="min-h-[200px] rounded-xl bg-secondary/50 border-transparent focus:border-primary resize-none"
                data-testid="content-input"
              />
              <p className="text-xs text-muted-foreground text-right">{content.length}/{MAX_CONTENT_LENGTH}</p>
            </div>

            {/* Image Upload */}
            <div className="space-y-2">
              <Label className="text-foreground">Image (optional)</Label>
              
              {imagePreview ? (
                <div className="relative rounded-xl overflow-hidden border border-border/50">
                  <img 
                    src={imagePreview} 
                    alt="Preview" 
                    className="w-full max-h-64 object-cover"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={removeImage}
                    className="absolute top-2 right-2 rounded-full w-8 h-8 p-0"
                    data-testid="remove-image-btn"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-border/50 rounded-xl p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/gif,image/webp"
                    onChange={handleImageSelect}
                    className="hidden"
                    data-testid="image-input"
                  />
                  {uploadingImage ? (
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                      <span className="text-sm text-muted-foreground">Uploading...</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center">
                        <Image className="h-6 w-6 text-muted-foreground" />
                      </div>
                      <span className="text-sm text-muted-foreground">Click to add an image</span>
                      <span className="text-xs text-muted-foreground">JPEG, PNG, GIF, WebP (max 5MB)</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Location Section - for location-aware categories */}
            {isLocationAware && (
              <div className="p-4 rounded-xl bg-secondary/30 border border-border/30 space-y-3">
                <div className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-primary" />
                  <Label className="font-medium text-foreground">Meetup Location</Label>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Suburb</Label>
                    <Input
                      value={postSuburb}
                      onChange={(e) => setPostSuburb(e.target.value)}
                      placeholder="e.g. Bondi"
                      className="h-10 rounded-lg bg-secondary/50 border-transparent"
                      data-testid="post-suburb-input"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Postcode</Label>
                    <Input
                      value={postPostcode}
                      onChange={(e) => setPostPostcode(e.target.value)}
                      placeholder="e.g. 2026"
                      className="h-10 rounded-lg bg-secondary/50 border-transparent"
                      data-testid="post-postcode-input"
                    />
                  </div>
                </div>
                {postSuburb && postPostcode && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    This meetup will show as: {postSuburb}, {postPostcode}
                  </p>
                )}
              </div>
            )}

            {/* Audience / Visibility */}
            <div className="space-y-2">
              <Label className="text-foreground font-medium">Who can see this?</Label>
              <div className="grid grid-cols-1 gap-2">
                {[
                  { id: "public", icon: "🌐", label: "Everyone", desc: "Visible to all members" },
                  { id: "friends", icon: "👥", label: "Friends only", desc: "Only your friends can see this" },
                  { id: "only_me", icon: "🔒", label: "Only me", desc: "Save privately — edit later before sharing" },
                ].map(opt => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setVisibility(opt.id)}
                    className={`flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all ${
                      visibility === opt.id ? "border-primary bg-primary/10" : "border-border/50 bg-card hover:border-primary/40"
                    }`}
                  >
                    <span className="text-lg flex-shrink-0">{opt.icon}</span>
                    <div>
                      <p className={`text-sm font-medium ${visibility === opt.id ? "text-primary" : "text-foreground"}`}>{opt.label}</p>
                      <p className="text-xs text-muted-foreground">{opt.desc}</p>
                    </div>
                    {visibility === opt.id && (
                      <div className="ml-auto w-4 h-4 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                        <span className="text-primary-foreground text-xs">✓</span>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 rounded-xl bg-secondary/30 border border-border/30">
              <Checkbox
                id="anonymous"
                checked={isAnonymous}
                onCheckedChange={(checked) => setIsAnonymous(checked)}
                data-testid="anonymous-checkbox"
              />
              <div className="flex-1">
                <Label htmlFor="anonymous" className="font-medium text-foreground cursor-pointer">
                  Post anonymously
                </Label>
                <p className="text-xs text-muted-foreground">This post won't show your name or avatar</p>
              </div>
            </div>

            <div className="flex gap-4">
              <Button 
                type="button"
                variant="outline"
                onClick={() => navigate(-1)}
                className="flex-1 h-12 rounded-xl"
                data-testid="cancel-btn"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading || uploadingImage || (subscription?.limits_apply && subscription?.forum_posts && !subscription.forum_posts.allowed)}
                className="flex-1 h-12 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_0_15px_rgba(245,197,66,0.3)]"
                data-testid="submit-btn"
              >
                {loading ? "Posting..." : "Post"}
              </Button>
            </div>
          </form>
        </div>
      </main>
      <AppFooter />
    </div>
  );
}
