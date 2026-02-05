import { useState, useEffect, useCallback } from "react";
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

const PARENTING_STAGES = [
  { value: "expecting", label: "Expecting" },
  { value: "newborn", label: "Newborn (0-3 months)" },
  { value: "infant", label: "Infant (3-12 months)" },
  { value: "toddler", label: "Toddler (1-3 years)" },
  { value: "preschool", label: "Preschool (3-5 years)" },
  { value: "school-age", label: "School-age (5+ years)" },
];

const AGE_RANGES = [
  { value: "newborn", label: "Newborn" },
  { value: "infant", label: "Infant" },
  { value: "toddler", label: "Toddler" },
  { value: "preschool", label: "Preschool" },
  { value: "school-age", label: "School-age" },
];

const INTERESTS = [
  "Breastfeeding", "Sleep Training", "Baby-led Weaning", "Montessori",
  "Gentle Parenting", "Working Parent", "Stay-at-home", "Single Parent",
  "Twins/Multiples", "NICU Parent", "Special Needs", "Cloth Diapering",
];

function ProfilePage({ user }) {
  const { userId } = useParams();
  const navigate = useNavigate();
  const isOwnProfile = !userId || userId === user?.user_id;
  
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const [nickname, setNickname] = useState("");
  const [bio, setBio] = useState("");
  const [parentingStage, setParentingStage] = useState("");
  const [childAgeRanges, setChildAgeRanges] = useState([]);
  const [interests, setInterests] = useState([]);
  const [location, setLocation] = useState("");

  const fetchProfile = useCallback(async () => {
    const profileId = userId || user?.user_id;
    if (!profileId) return;

    try {
      const response = await fetch(`${API_URL}/api/users/${profileId}`, {
        credentials: "include"
      });
      if (response.ok) {
        const data = await response.json();
        setProfile(data);
        setNickname(data.nickname || "");
        setBio(data.bio || "");
        setParentingStage(data.parenting_stage || "");
        setChildAgeRanges(data.child_age_ranges || []);
        setInterests(data.interests || []);
        setLocation(data.location || "");
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    } finally {
      setLoading(false);
    }
  }, [userId, user?.user_id]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch(`${API_URL}/api/users/profile`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          nickname: nickname,
          bio: bio,
          parenting_stage: parentingStage,
          child_age_ranges: childAgeRanges,
          interests: interests,
          location: location
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

  const toggleAgeRange = (value) => {
    if (childAgeRanges.includes(value)) {
      setChildAgeRanges(childAgeRanges.filter(v => v !== value));
    } else {
      setChildAgeRanges([...childAgeRanges, value]);
    }
  };

  const toggleInterest = (value) => {
    if (interests.includes(value)) {
      setInterests(interests.filter(v => v !== value));
    } else {
      setInterests([...interests, value]);
    }
  };

  const goBack = () => {
    navigate(-1);
  };

  const toggleEditing = () => {
    setEditing(!editing);
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

  const stageLabel = PARENTING_STAGES.find(s => s.value === profile.parenting_stage)?.label;

  return (
    <div className="min-h-screen bg-background pb-20 lg:pb-0">
      <Navigation user={user} />
      
      <main className="max-w-2xl mx-auto px-4 pt-20 lg:pt-24">
        {!isOwnProfile && (
          <button 
            onClick={goBack}
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
                  {profile.name?.[0]?.toUpperCase() || '?'}
                </AvatarFallback>
              </Avatar>
              <div>
                <h1 className="font-heading text-2xl font-bold text-foreground">
                  {profile.nickname || profile.name}
                </h1>
                {stageLabel && (
                  <p className="text-muted-foreground">{stageLabel}</p>
                )}
                {profile.location && (
                  <p className="text-sm text-muted-foreground">📍 {profile.location}</p>
                )}
              </div>
            </div>

            {isOwnProfile && (
              <Button 
                variant={editing ? "ghost" : "outline"}
                size="sm"
                onClick={toggleEditing}
                className="rounded-full"
                data-testid="edit-profile-btn"
              >
                {editing ? <X className="h-4 w-4" /> : <Edit2 className="h-4 w-4" />}
              </Button>
            )}

            {!isOwnProfile && (
              <Link to={`/messages/${profile.user_id}`}>
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
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
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
                    {PARENTING_STAGES.map((stage) => (
                      <SelectItem key={stage.value} value={stage.value}>
                        {stage.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-foreground">Children's Age Ranges</Label>
                <div className="flex flex-wrap gap-2">
                  {AGE_RANGES.map((age) => {
                    const isSelected = childAgeRanges.includes(age.value);
                    return (
                      <Badge 
                        key={age.value}
                        variant={isSelected ? "default" : "outline"}
                        className={`cursor-pointer transition-colors ${
                          isSelected
                            ? 'bg-primary text-primary-foreground'
                            : 'hover:bg-secondary'
                        }`}
                        onClick={() => toggleAgeRange(age.value)}
                        data-testid={`age-${age.value}`}
                      >
                        {age.label}
                      </Badge>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-foreground">Interests</Label>
                <div className="flex flex-wrap gap-2">
                  {INTERESTS.map((interest) => {
                    const isSelected = interests.includes(interest);
                    return (
                      <Badge 
                        key={interest}
                        variant={isSelected ? "default" : "outline"}
                        className={`cursor-pointer transition-colors ${
                          isSelected
                            ? 'bg-primary text-primary-foreground'
                            : 'hover:bg-secondary'
                        }`}
                        onClick={() => toggleInterest(interest)}
                      >
                        {interest}
                      </Badge>
                    );
                  })}
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <Button 
                  variant="outline" 
                  onClick={toggleEditing}
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
                    {profile.child_age_ranges.map((age) => {
                      const ageLabel = AGE_RANGES.find(a => a.value === age)?.label || age;
                      return (
                        <Badge key={age} variant="secondary">{ageLabel}</Badge>
                      );
                    })}
                  </div>
                </div>
              )}

              {profile.interests && profile.interests.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">Interests</h3>
                  <div className="flex flex-wrap gap-2">
                    {profile.interests.map((interest) => (
                      <Badge key={interest} variant="outline">{interest}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {!profile.bio && (!profile.child_age_ranges || profile.child_age_ranges.length === 0) && isOwnProfile && (
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-4">Complete your profile to help other parents connect with you!</p>
                  <Button onClick={toggleEditing} className="rounded-full" data-testid="complete-profile-btn">
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
