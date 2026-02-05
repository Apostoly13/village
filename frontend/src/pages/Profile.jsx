import { useState, useEffect } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Label } from "../components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Badge } from "../components/ui/badge";
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
  const [parentingStage, setParentingStage] = useState("");
  const [childAges, setChildAges] = useState([]);
  const [userInterests, setUserInterests] = useState([]);
  const [userLocation, setUserLocation] = useState("");

  const parentingStages = [
    { id: "expecting", text: "Expecting" },
    { id: "newborn", text: "Newborn (0-3 months)" },
    { id: "infant", text: "Infant (3-12 months)" },
    { id: "toddler", text: "Toddler (1-3 years)" },
    { id: "preschool", text: "Preschool (3-5 years)" },
    { id: "school-age", text: "School-age (5+ years)" },
  ];

  const ageOptions = [
    { id: "newborn", text: "Newborn" },
    { id: "infant", text: "Infant" },
    { id: "toddler", text: "Toddler" },
    { id: "preschool", text: "Preschool" },
    { id: "school-age", text: "School-age" },
  ];

  const interestOptions = [
    "Breastfeeding", "Sleep Training", "Baby-led Weaning", "Montessori",
    "Gentle Parenting", "Working Parent", "Stay-at-home", "Single Parent",
    "Twins/Multiples", "NICU Parent", "Special Needs", "Cloth Diapering",
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
          setParentingStage(data.parenting_stage || "");
          setChildAges(data.child_age_ranges || []);
          setUserInterests(data.interests || []);
          setUserLocation(data.location || "");
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
          parenting_stage: parentingStage,
          child_age_ranges: childAges,
          interests: userInterests,
          location: userLocation
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

  const handleAgeToggle = (ageId) => {
    const newAges = childAges.includes(ageId)
      ? childAges.filter(a => a !== ageId)
      : [...childAges, ageId];
    setChildAges(newAges);
  };

  const handleInterestToggle = (interest) => {
    const newInterests = userInterests.includes(interest)
      ? userInterests.filter(i => i !== interest)
      : [...userInterests, interest];
    setUserInterests(newInterests);
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

  const currentStage = parentingStages.find(s => s.id === profile.parenting_stage);

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
                  {profile.name ? profile.name[0].toUpperCase() : '?'}
                </AvatarFallback>
              </Avatar>
              <div>
                <h1 className="font-heading text-2xl font-bold text-foreground">
                  {profile.nickname || profile.name}
                </h1>
                {currentStage && (
                  <p className="text-muted-foreground">{currentStage.text}</p>
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
                <Label className="text-foreground">Parenting Stage</Label>
                <Select value={parentingStage} onValueChange={setParentingStage}>
                  <SelectTrigger className="h-12 rounded-xl bg-secondary/50 border-transparent" data-testid="stage-select">
                    <SelectValue placeholder="Select your stage" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border/50">
                    {parentingStages.map((stageItem) => (
                      <SelectItem key={stageItem.id} value={stageItem.id}>
                        {stageItem.text}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-foreground">Children's Age Ranges</Label>
                <div className="flex flex-wrap gap-2">
                  {ageOptions.map((ageItem) => (
                    <Badge 
                      key={ageItem.id}
                      variant={childAges.includes(ageItem.id) ? "default" : "outline"}
                      className={`cursor-pointer transition-colors ${
                        childAges.includes(ageItem.id)
                          ? 'bg-primary text-primary-foreground'
                          : 'hover:bg-secondary'
                      }`}
                      onClick={() => handleAgeToggle(ageItem.id)}
                      data-testid={"age-" + ageItem.id}
                    >
                      {ageItem.text}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-foreground">Interests</Label>
                <div className="flex flex-wrap gap-2">
                  {interestOptions.map((interestItem) => (
                    <Badge 
                      key={interestItem}
                      variant={userInterests.includes(interestItem) ? "default" : "outline"}
                      className={`cursor-pointer transition-colors ${
                        userInterests.includes(interestItem)
                          ? 'bg-primary text-primary-foreground'
                          : 'hover:bg-secondary'
                      }`}
                      onClick={() => handleInterestToggle(interestItem)}
                    >
                      {interestItem}
                    </Badge>
                  ))}
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
              {profile.bio && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">About</h3>
                  <p className="text-foreground">{profile.bio}</p>
                </div>
              )}

              {profile.child_age_ranges && profile.child_age_ranges.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">Children's Ages</h3>
                  <div className="flex flex-wrap gap-2">
                    {profile.child_age_ranges.map((ageId) => {
                      const ageOption = ageOptions.find(a => a.id === ageId);
                      return (
                        <Badge key={ageId} variant="secondary">
                          {ageOption ? ageOption.text : ageId}
                        </Badge>
                      );
                    })}
                  </div>
                </div>
              )}

              {profile.interests && profile.interests.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">Interests</h3>
                  <div className="flex flex-wrap gap-2">
                    {profile.interests.map((interestItem) => (
                      <Badge key={interestItem} variant="outline">{interestItem}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {!profile.bio && (!profile.child_age_ranges || profile.child_age_ranges.length === 0) && isOwnProfile && (
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-4">Complete your profile to help other parents connect with you!</p>
                  <Button onClick={() => setEditing(true)} className="rounded-full" data-testid="complete-profile-btn">
                    <Edit2 className="h-4 w-4 mr-2" />
                    Complete Profile
                  </Button>
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
