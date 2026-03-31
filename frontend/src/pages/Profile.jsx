import { useState, useEffect, useRef } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Label } from "../components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Switch } from "../components/ui/switch";
import { Badge } from "../components/ui/badge";
import Navigation from "../components/Navigation";
import { toast } from "sonner";
import { ArrowLeft, Edit2, MessageCircle, Save, X, Heart, UserPlus, UserCheck, Clock, Users, ChevronRight, MapPin, Bell, Camera } from "lucide-react";

const API_URL = process.env.REACT_APP_BACKEND_URL;
const REGIONS = ["UK", "US", "Australia", "Europe", "Asia", "Other"];

function ProfilePage({ user }) {
  const params = useParams();
  const navigate = useNavigate();
  const profileUserId = params.userId;
  const isOwnProfile = !profileUserId || profileUserId === user?.user_id;
  const fileInputRef = useRef(null);
  
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [friendStatus, setFriendStatus] = useState(null);
  const [friendActionLoading, setFriendActionLoading] = useState(false);
  const [friends, setFriends] = useState([]);
  const [uploadingPicture, setUploadingPicture] = useState(false);
  
  const [nickname, setNickname] = useState("");
  const [bio, setBio] = useState("");
  const [userLocation, setUserLocation] = useState("");
  const [region, setRegion] = useState("");
  const [gender, setGender] = useState("");
  const [connectWith, setConnectWith] = useState("");
  const [isSingleParent, setIsSingleParent] = useState(false);
  const [picture, setPicture] = useState("");
  const [emailPrefs, setEmailPrefs] = useState({
    notify_replies: true,
    notify_dms: true,
    notify_friend_requests: true,
    weekly_digest: true
  });

  const genderOptions = [
    { id: "female", text: "Female" },
    { id: "male", text: "Male" },
    { id: "prefer-not-say", text: "Prefer not to say" },
  ];

  const connectWithOptions = [
    { id: "all", text: "All parents" },
    { id: "mums", text: "Mums only" },
    { id: "dads", text: "Dads only" },
    { id: "single-parents", text: "Single parents" },
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
          setRegion(data.region || "");
          setGender(data.gender || "");
          setConnectWith(data.connect_with || "all");
          setIsSingleParent(data.is_single_parent || false);
          setPicture(data.picture || "");
          setEmailPrefs(data.email_preferences || {
            notify_replies: true,
            notify_dms: true,
            notify_friend_requests: true,
            weekly_digest: true
          });
        }
      } catch (error) {
        console.error("Error:", error);
      } finally {
        setLoading(false);
      }
    };
    
    const fetchFriendStatus = async () => {
      if (!profileUserId || profileUserId === user?.user_id) return;
      
      try {
        const response = await fetch(API_URL + "/api/friends/status/" + profileUserId, {
          credentials: "include"
        });
        if (response.ok) {
          const data = await response.json();
          setFriendStatus(data);
        }
      } catch (error) {
        console.error("Error fetching friend status:", error);
      }
    };
    
    const fetchFriends = async () => {
      if (!isOwnProfile) return;
      try {
        const response = await fetch(API_URL + "/api/friends", {
          credentials: "include"
        });
        if (response.ok) {
          const data = await response.json();
          setFriends(data);
        }
      } catch (error) {
        console.error("Error fetching friends:", error);
      }
    };
    
    fetchProfile();
    fetchFriendStatus();
    fetchFriends();
  }, [profileUserId, user?.user_id, isOwnProfile]);

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
          region: region,
          gender: gender,
          connect_with: connectWith,
          is_single_parent: isSingleParent,
          picture: picture,
          email_preferences: emailPrefs
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

  const handlePictureUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Please select a valid image");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be less than 5MB");
      return;
    }

    setUploadingPicture(true);
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
        setPicture(data.image_url);
        toast.success("Picture uploaded! Don't forget to save.");
      } else {
        toast.error("Failed to upload picture");
      }
    } catch (error) {
      toast.error("Failed to upload picture");
    } finally {
      setUploadingPicture(false);
    }
  };

  const handleSendFriendRequest = async () => {
    setFriendActionLoading(true);
    try {
      const response = await fetch(API_URL + "/api/friends/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ to_user_id: profileUserId })
      });
      
      if (response.ok) {
        toast.success("Friend request sent!");
        setFriendStatus({ status: "request_sent" });
      } else {
        const error = await response.json();
        toast.error(error.detail || "Failed to send request");
      }
    } catch (error) {
      toast.error("Something went wrong");
    } finally {
      setFriendActionLoading(false);
    }
  };

  const handleAcceptRequest = async () => {
    if (!friendStatus?.request_id) return;
    setFriendActionLoading(true);
    try {
      const response = await fetch(API_URL + "/api/friends/request/" + friendStatus.request_id + "/accept", {
        method: "POST",
        credentials: "include"
      });
      
      if (response.ok) {
        toast.success("Friend request accepted!");
        setFriendStatus({ status: "friends" });
      } else {
        toast.error("Failed to accept request");
      }
    } catch (error) {
      toast.error("Something went wrong");
    } finally {
      setFriendActionLoading(false);
    }
  };

  const handleDeclineRequest = async () => {
    if (!friendStatus?.request_id) return;
    setFriendActionLoading(true);
    try {
      const response = await fetch(API_URL + "/api/friends/request/" + friendStatus.request_id + "/decline", {
        method: "POST",
        credentials: "include"
      });
      
      if (response.ok) {
        toast.success("Friend request declined");
        setFriendStatus({ status: "none" });
      } else {
        toast.error("Failed to decline request");
      }
    } catch (error) {
      toast.error("Something went wrong");
    } finally {
      setFriendActionLoading(false);
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

  const renderFriendButton = () => {
    if (!friendStatus) return null;
    
    switch (friendStatus.status) {
      case "friends":
        return (
          <Button variant="outline" className="rounded-full border-green-500/30 text-green-600 dark:text-green-400" disabled>
            <UserCheck className="h-4 w-4 mr-2" />
            Friends
          </Button>
        );
      case "request_sent":
        return (
          <Button variant="outline" className="rounded-full" disabled>
            <Clock className="h-4 w-4 mr-2" />
            Request Sent
          </Button>
        );
      case "request_received":
        return (
          <div className="flex gap-2">
            <Button 
              onClick={handleAcceptRequest}
              disabled={friendActionLoading}
              className="rounded-full bg-green-600 hover:bg-green-700 text-white"
            >
              Accept
            </Button>
            <Button 
              variant="outline"
              onClick={handleDeclineRequest}
              disabled={friendActionLoading}
              className="rounded-full"
            >
              Decline
            </Button>
          </div>
        );
      default:
        return (
          <Button 
            variant="outline"
            onClick={handleSendFriendRequest}
            disabled={friendActionLoading}
            className="rounded-full"
            data-testid="add-friend-btn"
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Add Friend
          </Button>
        );
    }
  };

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
              <div className="relative">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={editing ? (picture || profile.picture) : profile.picture} />
                  <AvatarFallback className="bg-primary/20 text-primary text-2xl">
                    {avatarInitial}
                  </AvatarFallback>
                </Avatar>
                {editing && isOwnProfile && (
                  <>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/gif,image/webp"
                      onChange={handlePictureUpload}
                      className="hidden"
                    />
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingPicture}
                      className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full p-0 bg-primary text-primary-foreground"
                    >
                      {uploadingPicture ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <Camera className="h-4 w-4" />
                      )}
                    </Button>
                  </>
                )}
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="font-heading text-2xl font-bold text-foreground">{displayName}</h1>
                  {hasNightOwlBadge() && (
                    <span className="night-owl-badge active" data-testid="night-owl-badge">
                      🦉 Night Owl
                    </span>
                  )}
                  {profile.is_single_parent && (
                    <Badge variant="secondary" className="bg-pink-500/10 text-pink-600 dark:text-pink-400 border-pink-500/20">
                      <Heart className="h-3 w-3 mr-1" />
                      Single Parent
                    </Badge>
                  )}
                  {friendStatus?.status === "friends" && (
                    <Badge variant="secondary" className="bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20">
                      <Users className="h-3 w-3 mr-1" />
                      Friend
                    </Badge>
                  )}
                </div>
                {genderLabel && (
                  <p className="text-muted-foreground">{genderLabel}</p>
                )}
                {profile.location && (
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <MapPin className="h-3 w-3" /> {profile.location}
                    {profile.region && <span className="text-xs">({profile.region})</span>}
                  </p>
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
              <div className="flex flex-col gap-2 items-end">
                {renderFriendButton()}
                <Link to={"/messages/" + profile.user_id}>
                  <Button className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90" data-testid="message-btn">
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Message
                  </Button>
                </Link>
              </div>
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

              <div className="flex items-center justify-between p-4 rounded-xl bg-pink-500/5 border border-pink-500/20">
                <div className="flex items-center gap-3">
                  <Heart className="h-5 w-5 text-pink-500" />
                  <div>
                    <Label htmlFor="single-parent" className="font-medium text-foreground cursor-pointer">I'm a single parent</Label>
                    <p className="text-xs text-muted-foreground">Connect with other single parents in our community</p>
                  </div>
                </div>
                <Switch 
                  id="single-parent"
                  checked={isSingleParent}
                  onCheckedChange={setIsSingleParent}
                  data-testid="single-parent-toggle"
                />
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

              <div className="space-y-2">
                <Label className="text-foreground flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Region (for local chat rooms)
                </Label>
                <Select value={region} onValueChange={setRegion}>
                  <SelectTrigger className="h-12 rounded-xl bg-secondary/50 border-transparent" data-testid="region-select">
                    <SelectValue placeholder="Select your region" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border/50">
                    {REGIONS.map((r) => (
                      <SelectItem key={r} value={r}>
                        {r}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  This helps you connect with local parents and shows you local chat rooms
                </p>
              </div>

              {/* Email Notification Preferences */}
              <div className="p-4 rounded-xl bg-secondary/30 border border-border/30 space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <Bell className="h-5 w-5 text-primary" />
                  <Label className="font-medium text-foreground">Email Notifications</Label>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="notify-replies" className="text-sm text-foreground cursor-pointer">New replies to my posts</Label>
                  </div>
                  <Switch 
                    id="notify-replies"
                    checked={emailPrefs.notify_replies}
                    onCheckedChange={(checked) => setEmailPrefs(prev => ({ ...prev, notify_replies: checked }))}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="notify-dms" className="text-sm text-foreground cursor-pointer">New direct messages</Label>
                  </div>
                  <Switch 
                    id="notify-dms"
                    checked={emailPrefs.notify_dms}
                    onCheckedChange={(checked) => setEmailPrefs(prev => ({ ...prev, notify_dms: checked }))}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="notify-friends" className="text-sm text-foreground cursor-pointer">Friend requests</Label>
                  </div>
                  <Switch 
                    id="notify-friends"
                    checked={emailPrefs.notify_friend_requests}
                    onCheckedChange={(checked) => setEmailPrefs(prev => ({ ...prev, notify_friend_requests: checked }))}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="notify-digest" className="text-sm text-foreground cursor-pointer">Weekly digest</Label>
                    <p className="text-xs text-muted-foreground">Summary of activity in your community</p>
                  </div>
                  <Switch 
                    id="notify-digest"
                    checked={emailPrefs.weekly_digest}
                    onCheckedChange={(checked) => setEmailPrefs(prev => ({ ...prev, weekly_digest: checked }))}
                  />
                </div>
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

        {/* Friends Section - Only show on own profile */}
        {isOwnProfile && (
          <div className="bg-card rounded-2xl p-6 border border-border/50">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-heading font-bold text-lg text-foreground flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                Friends ({friends.length})
              </h2>
              <Link to="/friends">
                <Button variant="ghost" size="sm" className="rounded-full text-primary" data-testid="view-all-friends">
                  View All
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </Link>
            </div>
            
            {friends.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-muted-foreground mb-3">No friends yet. Connect with other parents!</p>
                <Link to="/chat">
                  <Button variant="outline" size="sm" className="rounded-full">
                    Join a Chat Room
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="flex flex-wrap gap-3">
                {friends.slice(0, 6).map((friend) => (
                  <Link 
                    key={friend.user_id} 
                    to={`/profile/${friend.user_id}`}
                    className="flex flex-col items-center gap-2 p-2 rounded-xl hover:bg-secondary/50 transition-colors"
                    data-testid={`friend-preview-${friend.user_id}`}
                  >
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={friend.picture} />
                      <AvatarFallback className="bg-primary/20 text-primary">
                        {friend.name?.[0]?.toUpperCase() || '?'}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm text-foreground truncate max-w-[70px]">
                      {friend.nickname || friend.name?.split(' ')[0]}
                    </span>
                  </Link>
                ))}
                {friends.length > 6 && (
                  <Link 
                    to="/friends"
                    className="flex flex-col items-center justify-center gap-2 p-2 rounded-xl hover:bg-secondary/50 transition-colors"
                  >
                    <div className="h-12 w-12 rounded-full bg-secondary flex items-center justify-center">
                      <span className="text-sm font-bold text-muted-foreground">+{friends.length - 6}</span>
                    </div>
                    <span className="text-sm text-muted-foreground">more</span>
                  </Link>
                )}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default ProfilePage;
