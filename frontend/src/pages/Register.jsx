import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { toast } from "sonner";
import { ArrowLeft, Eye, EyeOff, Check, Stethoscope } from "lucide-react";
import { Checkbox } from "../components/ui/checkbox";
import { parseApiError } from "../utils/apiError";
import { Wordmark } from "../components/Wordmark";

const API_URL = process.env.REACT_APP_BACKEND_URL;
const GOOGLE_CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID;

const PROFESSIONAL_TYPES = [
  "General Practitioner (GP)",
  "Paediatrician",
  "Obstetrician / Gynaecologist",
  "Midwife",
  "Child & Family Health Nurse",
  "Lactation Consultant",
  "Psychologist",
  "Psychiatrist",
  "Social Worker",
  "Occupational Therapist",
  "Speech Pathologist",
  "Physiotherapist",
  "Dietitian / Nutritionist",
  "Pharmacist",
  "Nurse Practitioner",
  "Other Healthcare Professional",
];

function calculateAge(dobString) {
  if (!dobString) return null;
  const dob = new Date(dobString);
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
  return age;
}

// Maximum date allowed for DOB input: must be at least 18 years ago
function maxDobDate() {
  const d = new Date();
  d.setFullYear(d.getFullYear() - 18);
  return d.toISOString().split("T")[0];
}

export default function Register() {
  const navigate = useNavigate();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [dob, setDob] = useState("");
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [isHealthcarePro, setIsHealthcarePro] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const googleReady = useRef(false);

  useEffect(() => {
    const initGoogle = () => {
      if (googleReady.current || !window.google?.accounts?.id || !GOOGLE_CLIENT_ID) return;
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        auto_select: false,
        callback: async ({ credential }) => {
          setGoogleLoading(true);
          try {
            const res = await fetch(`${API_URL}/api/auth/session`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              credentials: "include",
              body: JSON.stringify({ credential }),
            });
            const data = await res.json();
            if (res.ok) {
              localStorage.setItem("user", JSON.stringify(data));
              toast.success("Welcome to The Village!");
              navigate(data.onboarding_complete ? "/dashboard" : "/onboarding");
            } else {
              toast.error(data.detail || "Google sign-in failed. Please try again.");
            }
          } catch {
            toast.error("Something went wrong. Please try again.");
          } finally {
            setGoogleLoading(false);
          }
        },
      });
      googleReady.current = true;
    };
    initGoogle();
    const script = document.querySelector('script[src*="accounts.google.com/gsi/client"]');
    script?.addEventListener("load", initGoogle);
    return () => script?.removeEventListener("load", initGoogle);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Professional verification fields (shown inline when isHealthcarePro is checked)
  const [proType, setProType] = useState("");
  const [proWorkplace, setProWorkplace] = useState("");
  const [proCredentials, setProCredentials] = useState("");
  const [proServicesUrl, setProServicesUrl] = useState("");

  const passwordRequirements = [
    { label: "At least 8 characters",  met: password.length >= 8 },
    { label: "One uppercase letter",    met: /[A-Z]/.test(password) },
    { label: "One number",             met: /[0-9]/.test(password) },
  ];

  const passwordValid = passwordRequirements.every((r) => r.met);
  const age = calculateAge(dob);
  const dobValid = age !== null && age >= 18;

  const proFormValid = !isHealthcarePro || (
    proType && proWorkplace.trim() && proCredentials.trim() && proServicesUrl.trim()
  );

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!firstName.trim()) {
      toast.error("First name is required");
      return;
    }
    if (!lastName.trim()) {
      toast.error("Last name is required");
      return;
    }
    if (!email.trim()) {
      toast.error("Email is required");
      return;
    }
    if (!dob) {
      toast.error("Date of birth is required");
      return;
    }
    if (!dobValid) {
      toast.error("You must be 18 or older to join The Village");
      return;
    }
    if (!passwordValid) {
      toast.error("Password must be at least 8 characters with an uppercase letter and a number");
      return;
    }
    if (!agreedToTerms) {
      toast.error("Please accept the Terms & Conditions and Privacy Policy to continue");
      return;
    }
    if (isHealthcarePro) {
      if (!proType) { toast.error("Please select your professional type"); return; }
      if (!proWorkplace.trim()) { toast.error("Please enter your workplace or organisation"); return; }
      if (!proCredentials.trim()) { toast.error("Please describe your credentials"); return; }
      if (!proServicesUrl.trim()) { toast.error("Please provide a link to your professional services page"); return; }
    }

    setLoading(true);

    const payload = {
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      email: email.trim(),
      password,
      date_of_birth: dob,
    };

    try {
      const response = await fetch(`${API_URL}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem("user", JSON.stringify(data));

        // If they filled out the professional verification form, submit it now
        if (isHealthcarePro && proType && proWorkplace.trim() && proCredentials.trim() && proServicesUrl.trim()) {
          try {
            await fetch(`${API_URL}/api/users/professional-apply`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              credentials: "include",
              body: JSON.stringify({
                professional_type: proType,
                professional_credentials: proCredentials.trim(),
                professional_workplace: proWorkplace.trim(),
                professional_services_url: proServicesUrl.trim(),
              }),
            });
            // Don't block registration even if this fails — user can resubmit from profile
          } catch {
            // Silently fail — they can apply from profile
          }
        }

        navigate("/onboarding");
      } else {
        toast.error(parseApiError(data.detail, "Registration failed"));
      }
    } catch (error) {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    if (!googleReady.current || !window.google?.accounts?.id) {
      toast.error("Google sign-in is loading — please try again in a moment.");
      return;
    }
    window.google.accounts.id.prompt((notification) => {
      if (notification.isNotDisplayed()) {
        toast.error("Google sign-in couldn't open. Try disabling any pop-up blockers.");
      }
    });
  };

  const canSubmit = !loading && passwordValid && firstName.trim() && lastName.trim() && dobValid && agreedToTerms && proFormValid;

  return (
    <div className="min-h-screen flex" style={{ background: "var(--paper)" }}>

      {/* Left panel — 40% design panel */}
      <div
        className="hidden lg:flex lg:w-[40%] flex-col justify-between relative overflow-hidden px-12 py-10"
        style={{ background: "var(--paper)" }}
      >
        {/* Watercolour blob */}
        <svg className="absolute top-0 right-0 w-full opacity-40 pointer-events-none" viewBox="0 0 480 520" fill="none" aria-hidden="true">
          <ellipse cx="360" cy="160" rx="200" ry="180" fill="hsl(var(--accent))" fillOpacity="0.20" />
          <ellipse cx="420" cy="80" rx="140" ry="110" fill="hsl(var(--accent))" fillOpacity="0.14" />
          <ellipse cx="260" cy="240" rx="160" ry="120" fill="var(--honey)" fillOpacity="0.10" />
        </svg>
        <div className="relative z-10"><Wordmark size={26} /></div>
        <div className="relative z-10 mb-8">
          <p style={{ fontFamily: "var(--serif)", fontSize: "clamp(18px,2vw,24px)", fontStyle: "italic", fontWeight: 400, letterSpacing: "-0.02em", lineHeight: 1.5, color: "var(--ink)" }}>
            "The support here is incredible"
          </p>
          <p className="mt-2 text-sm" style={{ color: "var(--ink-3)" }}>— Mike, dad of two</p>
        </div>
      </div>

      {/* Right panel — 60% form */}
      <div className="flex-1 flex flex-col justify-center px-8 py-12 lg:px-14 overflow-y-auto" style={{ background: "var(--paper-2)" }}>
        <Link to="/" className="inline-flex items-center gap-2 mb-6 transition-opacity opacity-60 hover:opacity-100 text-sm" style={{ color: "var(--ink)" }}>
          <ArrowLeft className="h-4 w-4" />
          Back to home
        </Link>

        <div className="max-w-md w-full mx-auto">
          <div className="lg:hidden mb-6"><Wordmark size={22} /></div>

          <h1 className="text-3xl font-medium mb-1" style={{ fontFamily: "var(--serif)", color: "var(--ink)" }}>Join the community</h1>
          <p className="mb-6 text-sm" style={{ color: "var(--ink-2)" }}>Create your account and find your parenting tribe</p>

          {/* Google Signup */}
          <Button
            type="button"
            variant="outline"
            className="w-full rounded-full border-[var(--line)] hover:bg-[var(--paper)] mb-6"
            style={{ height: 44, color: "var(--ink)", background: "var(--paper)" }}
            onClick={handleGoogleLogin}
            disabled={googleLoading}
            data-testid="google-register-btn"
          >
            <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            {googleLoading ? "Signing in…" : "Continue with Google"}
          </Button>

          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t" style={{ borderColor: "var(--line)" }} />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-4 text-[var(--ink-3)]" style={{ background: "var(--paper-2)" }}>or sign up with email</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Name */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="first_name" className="text-foreground">First name</Label>
                <Input
                  id="first_name"
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Jane"
                  className="rounded-xl"
                  style={{ height: 44, background: "var(--paper)", border: "1px solid var(--line)", color: "var(--ink)" }}
                  required
                  data-testid="first-name-input"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="last_name" className="text-foreground">Last name</Label>
                <Input
                  id="last_name"
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Smith"
                  className="rounded-xl"
                  style={{ height: 44, background: "var(--paper)", border: "1px solid var(--line)", color: "var(--ink)" }}
                  required
                  data-testid="last-name-input"
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground -mt-1">
              Your real name is kept private. You'll choose a display name in the next step.
            </p>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-foreground">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="rounded-xl"
                style={{ height: 44, background: "var(--paper)", border: "1px solid var(--line)", color: "var(--ink)" }}
                required
                data-testid="email-input"
              />
            </div>

            {/* Date of Birth */}
            <div className="space-y-2">
              <Label htmlFor="dob" className="text-foreground">Date of birth</Label>
              <Input
                id="dob"
                type="date"
                value={dob}
                onChange={(e) => setDob(e.target.value)}
                max={maxDobDate()}
                className="rounded-xl"
                style={{ height: 44, background: "var(--paper)", border: "1px solid var(--line)", color: "var(--ink)" }}
                required
                data-testid="dob-input"
              />
              {dob && !dobValid && (
                <p className="text-xs text-red-500 mt-1">
                  You must be 18 or older to join The Village.
                </p>
              )}
              {!dob && (
                <p className="text-xs text-muted-foreground">
                  The Village is for adults 18+. We collect your date of birth to verify eligibility.
                </p>
              )}
            </div>

            {/* Password */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-foreground">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="rounded-xl pr-10"
                  style={{ height: 44, background: "var(--paper)", border: "1px solid var(--line)", color: "var(--ink)" }}
                  required
                  data-testid="password-input"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>

              <div className="mt-2 space-y-1">
                {passwordRequirements.map((req, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-sm">
                    <div className={`w-4 h-4 rounded-full flex items-center justify-center ${req.met ? 'bg-green-500/20 text-green-500' : 'bg-muted text-muted-foreground'}`}>
                      {req.met && <Check className="h-3 w-3" />}
                    </div>
                    <span className={req.met ? 'text-green-500' : 'text-muted-foreground'}>{req.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Legal acceptance */}
            <div className="rounded-xl border border-border/50 bg-secondary/20 p-4">
              <div className="flex items-start gap-3">
                <Checkbox
                  id="terms-check"
                  checked={agreedToTerms}
                  onCheckedChange={(checked) => setAgreedToTerms(!!checked)}
                  className="mt-0.5 h-5 w-5 shrink-0"
                  data-testid="terms-checkbox"
                />
                <label
                  htmlFor="terms-check"
                  className="text-sm text-muted-foreground leading-relaxed cursor-pointer select-none"
                >
                  I am 18 or older and I agree to The Village{" "}
                  <Link
                    to="/terms"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary underline underline-offset-2 hover:text-primary/80"
                    onClick={(e) => e.stopPropagation()}
                  >
                    Terms &amp; Conditions
                  </Link>
                  {", "}
                  <Link
                    to="/privacy"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary underline underline-offset-2 hover:text-primary/80"
                    onClick={(e) => e.stopPropagation()}
                  >
                    Privacy Policy
                  </Link>
                  {", and "}
                  <Link
                    to="/community-guidelines"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary underline underline-offset-2 hover:text-primary/80"
                    onClick={(e) => e.stopPropagation()}
                  >
                    Community Guidelines
                  </Link>
                  .
                </label>
              </div>
            </div>

            {/* Healthcare professional opt-in + inline form */}
            <div className="rounded-xl border border-sky-500/30 bg-sky-500/5 overflow-hidden">
              <div className="flex items-start gap-3 px-4 py-3.5">
                <Checkbox
                  id="hcp-check"
                  checked={isHealthcarePro}
                  onCheckedChange={(checked) => setIsHealthcarePro(!!checked)}
                  className="mt-0.5 h-5 w-5 shrink-0"
                />
                <label htmlFor="hcp-check" className="text-sm text-muted-foreground leading-relaxed cursor-pointer select-none">
                  I'm a <span className="font-medium text-foreground">healthcare professional</span> — I'd like to apply for a verified badge.
                </label>
              </div>

              {isHealthcarePro && (
                <div className="border-t border-sky-500/20 px-4 pb-4 pt-3 space-y-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Stethoscope className="h-4 w-4 text-sky-500" />
                    <p className="text-xs font-medium text-sky-600 dark:text-sky-400">Professional verification application</p>
                  </div>
                  <p className="text-xs text-muted-foreground">Your application will be reviewed by our team. Your verified badge will appear once approved.</p>

                  {/* Professional type */}
                  <div>
                    <label className="text-xs font-medium text-foreground mb-1.5 block">Professional type</label>
                    <Select value={proType} onValueChange={setProType}>
                      <SelectTrigger className="rounded-xl text-sm" style={{ height: 40, background: "var(--paper)", border: "1px solid var(--line)" }}>
                        <SelectValue placeholder="Select your role…" />
                      </SelectTrigger>
                      <SelectContent>
                        {PROFESSIONAL_TYPES.map(t => (
                          <SelectItem key={t} value={t}>{t}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Workplace */}
                  <div>
                    <label className="text-xs font-medium text-foreground mb-1.5 block">Workplace / Organisation</label>
                    <Input
                      value={proWorkplace}
                      onChange={e => setProWorkplace(e.target.value)}
                      placeholder="e.g. Royal Hospital for Women, private practice"
                      className="rounded-xl text-sm"
                      style={{ height: 40, background: "var(--paper)", border: "1px solid var(--line)", color: "var(--ink)" }}
                    />
                  </div>

                  {/* Credentials */}
                  <div>
                    <label className="text-xs font-medium text-foreground mb-1.5 block">Credentials &amp; experience</label>
                    <Textarea
                      value={proCredentials}
                      onChange={e => setProCredentials(e.target.value)}
                      placeholder="Describe your qualifications, registration number, years of experience."
                      className="rounded-xl resize-none text-sm"
                      rows={3}
                      maxLength={2000}
                      style={{ background: "var(--paper)", border: "1px solid var(--line)", color: "var(--ink)" }}
                    />
                    <p className="text-xs text-muted-foreground mt-1 text-right">{proCredentials.length}/2000</p>
                  </div>

                  {/* Services URL */}
                  <div>
                    <label className="text-xs font-medium text-foreground mb-1.5 block">Professional services link</label>
                    <Input
                      value={proServicesUrl}
                      onChange={e => setProServicesUrl(e.target.value)}
                      placeholder="e.g. https://yourwebsite.com.au, hospital profile, LinkedIn"
                      className="rounded-xl text-sm"
                      style={{ height: 40, background: "var(--paper)", border: "1px solid var(--line)", color: "var(--ink)" }}
                    />
                    <p className="text-xs text-muted-foreground mt-1">Link to your website, clinic profile, or professional directory listing.</p>
                  </div>
                </div>
              )}
            </div>

            <Button
              type="submit"
              className="w-full rounded-full"
              style={{ height: 44, background: "var(--ink)", color: "var(--paper)" }}
              disabled={!canSubmit}
              data-testid="register-submit-btn"
            >
              {loading ? "Creating account..." : "Create Account"}
            </Button>
          </form>

          <p className="text-center mt-6 text-sm" style={{ color: "var(--ink-2)" }}>
            Already have an account?{" "}
            <Link to="/login" className="font-medium hover:underline" style={{ color: "hsl(var(--accent))" }} data-testid="login-link">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
