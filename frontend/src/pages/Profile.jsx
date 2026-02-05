import { useState, useEffect } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Label } from "../components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import Navigation from "../components/Navigation";
import { toast } from "sonner";
import { ArrowLeft, Edit2, MessageCircle, Save, X } from "lucide-react";

const API_URL = process.env.REACT_APP_BACKEND_URL;

function ProfilePage({ user }) {
  const params = useParams();
  const navigate = useNavigate();
  const profileUserId = params.userId;
  const isOwnProfile = !profileUserId || profileUserId === user?.user_id;
  
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const [nickname, setNickname] = useState("");
  const [bio, setBio] = useState("");
  const [userLocation, setUserLocation] = useState("");
  const [gender, setGender] = useState("");
  const [connectWith, setConnectWith] = useState("");

  const genderOptions = [
    { id: "female", text: "Female" },
    { id: "male", text: "Male" },
    { id: "non-binary", text: "Non-binary" },
    { id: "prefer-not-say", text: "Prefer not to say" },
  ];

  const connectWithOptions = [
    { id: "all", text: "All parents" },
    { id: "mums", text: "Mums only" },
    { id: "dads", text: "Dads only" },
    { id: "same", text: "Same gender" },
  ];

  useEffect(() => {
    const fetchProfile = async () => {
      const id = profileUserId || user?.user_id;
      if (!id) return;

      try {
        const response = await fetch(API_URL + "/api/users/" + id, {
          credentials: "include"
        });
        if (response.ok) {
          const data = await response.json();
          setProfile(data);
          setNickname(data.nickname || "");
          setBio(data.bio || "");
          setUserLocation(data.location || "");
          setGender(data.gender || "");
          setConnectWith(data.connect_with || "all");
        }
      } catch (error) {
        console.error("Error:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [profileUserId, user?.user_id]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch(API_URL + "/api/users/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          nickname: nickname,
          bio: bio,
          location: userLocation,
          gender: gender,
          connect_with: connectWith
        })
      });

      if (response.ok) {
        const updated = await response.json();
        setProfile(updated);
        setEditing(false);
        toast.success("Profile updated!");
      } else {
        toast.error("Failed to update profile");
      }
    } catch (error) {
      toast.error("Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  // Check if this user has night owl badge (active at night)
  const hasNightOwlBadge = () => {
    const hour = new Date().getHours();
    return hour >= 22 || hour < 4;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background pb-20 lg:pb-0">
        <Navigation user={user} />
        <main className="max-w-2xl mx-auto px-4 pt-20 lg:pt-24">
          <div className="animate-pulse space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-full bg-muted"></div>
              <div className="space-y-2">
                <div className="w-32 h-6 bg-muted rounded"></div>
                <div className="w-48 h-4 bg-muted rounded"></div>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background pb-20 lg:pb-0">
        <Navigation user={user} />
        <main className="max-w-2xl mx-auto px-4 pt-20 lg:pt-24 text-center">
          <h1 className="font-heading text-2xl font-bold text-foreground">Profile not found</h1>
        </main>
      </div>
    );
  }

  const displayName = profile.nickname || profile.name;
  const avatarInitial = profile.name ? profile.name.charAt(0).toUpperCase() : '?';
  const genderLabel = genderOptions.find(g => g.id === profile.gender)?.text;

  return (
    <div className="min-h-screen bg-background pb-20 lg:pb-0">
      <Navigation user={user} />
      
      <main className="max-w-2xl mx-auto px-4 pt-20 lg:pt-24">
        {!isOwnProfile && (
          <button 
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
            data-testid="back-btn"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
        )}

        <div className="bg-card rounded-2xl p-6 border border-border/50 mb-6">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-4">
              <Avatar className="h-20 w-20">
                <AvatarImage src={profile.picture} />
                <AvatarFallback className="bg-primary/20 text-primary text-2xl">
                  {avatarInitial}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="font-heading text-2xl font-bold text-foreground">{displayName}</h1>
                  {hasNightOwlBadge() && (
                    <span className="night-owl-badge active" data-testid="night-owl-badge">
                      🦉 Night Owl
                    </span>
                  )}
                </div>
                {genderLabel && (
                  <p className="text-muted-foreground">{genderLabel}</p>
                )}
                {profile.location && (
                  <p className="text-sm text-muted-foreground">📍 {profile.location}</p>
                )}
              </div>
            </div>

            {isOwnProfile ? (
              <Button 
                variant={editing ? "ghost" : "outline"}
                size="sm"
                onClick={() => setEditing(!editing)}
                className="rounded-full"
                data-testid="edit-profile-btn"
              >
                {editing ? <X className="h-4 w-4" /> : <Edit2 className="h-4 w-4" />}
              </Button>
            ) : (
              <Link to={"/messages/" + profile.user_id}>
                <Button className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90" data-testid="message-btn">
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Message
                </Button>
              </Link>
            )}
          </div>

          {editing ? (
            <div className="space-y-6">
              <div className="space-y-2">
                <Label className="text-foreground">Display Name</Label>
                <Input 
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder="How should we call you?"
                  className="h-12 rounded-xl bg-secondary/50 border-transparent focus:border-primary"
                  data-testid="nickname-input"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-foreground">Bio</Label>
                <Textarea 
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Tell other parents about yourself..."
                  className="min-h-[100px] rounded-xl bg-secondary/50 border-transparent focus:border-primary resize-none"
                  data-testid="bio-input"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-foreground">Location</Label>
                <Input 
                  value={userLocation}
                  onChange={(e) => setUserLocation(e.target.value)}
                  placeholder="City, Country"
                  className="h-12 rounded-xl bg-secondary/50 border-transparent focus:border-primary"
                  data-testid="location-input"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-foreground">I am a</Label>
                <Select value={gender} onValueChange={setGender}>
                  <SelectTrigger className="h-12 rounded-xl bg-secondary/50 border-transparent" data-testid="gender-select">
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border/50">
                    {genderOptions.map((opt) => (
                      <SelectItem key={opt.id} value={opt.id}>
                        {opt.text}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-foreground">I want to connect with</Label>
                <Select value={connectWith} onValueChange={setConnectWith}>
                  <SelectTrigger className="h-12 rounded-xl bg-secondary/50 border-transparent" data-testid="connect-with-select">
                    <SelectValue placeholder="Select preference" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border/50">
                    {connectWithOptions.map((opt) => (
                      <SelectItem key={opt.id} value={opt.id}>
                        {opt.text}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  This helps filter who you see in chat rooms and can message you
                </p>
              </div>

              <div className="flex gap-4 pt-4">
                <Button 
                  variant="outline" 
                  onClick={() => setEditing(false)}
                  className="flex-1 h-12 rounded-xl"
                  data-testid="cancel-btn"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 h-12 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90"
                  data-testid="save-btn"
                >
                  {saving ? "Saving..." : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {profile.bio ? (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">About</h3>
                  <p className="text-foreground">{profile.bio}</p>
                </div>
              ) : isOwnProfile ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-4">Complete your profile to help other parents connect with you!</p>
                  <Button onClick={() => setEditing(true)} className="rounded-full" data-testid="complete-profile-btn">
                    <Edit2 className="h-4 w-4 mr-2" />
                    Complete Profile
                  </Button>
                </div>
              ) : null}

              {profile.connect_with && profile.connect_with !== "all" && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">Connection Preference</h3>
                  <p className="text-foreground">{connectWithOptions.find(o => o.id === profile.connect_with)?.text}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default ProfilePage;
