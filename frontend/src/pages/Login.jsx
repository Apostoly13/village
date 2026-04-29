import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { toast } from "sonner";
import { ArrowLeft, Eye, EyeOff } from "lucide-react";
import { parseApiError } from "../utils/apiError";
import { Wordmark } from "../components/Wordmark";

const API_URL = process.env.REACT_APP_BACKEND_URL;
const GOOGLE_CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID;

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const googleReady = useRef(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem("user", JSON.stringify(data));
        toast.success("Welcome back! 🦉");
        navigate("/dashboard");
      } else {
        toast.error(parseApiError(data.detail, "Invalid credentials"));
      }
    } catch (error) {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

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
              toast.success("Welcome back!");
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

  const handleFacebookLogin = () => {
    toast.info("Facebook login coming soon — use email or Google for now.");
  };

  return (
    <div className="min-h-screen flex" style={{ background: "var(--paper)" }}>
      {/* Left panel — 40% paper + blob + Wordmark */}
      <div
        className="hidden lg:flex lg:w-[40%] flex-col justify-between relative overflow-hidden px-12 py-10"
        style={{ background: "var(--paper)" }}
      >
        {/* Watercolour blob */}
        <svg
          className="absolute top-0 right-0 w-full opacity-40 pointer-events-none"
          viewBox="0 0 480 520" fill="none" aria-hidden="true"
        >
          <ellipse cx="360" cy="160" rx="200" ry="180" fill="hsl(var(--accent))" fillOpacity="0.20" />
          <ellipse cx="420" cy="80" rx="140" ry="110" fill="hsl(var(--accent))" fillOpacity="0.14" />
          <ellipse cx="260" cy="240" rx="160" ry="120" fill="var(--honey)" fillOpacity="0.10" />
        </svg>

        {/* Wordmark */}
        <div className="relative z-10">
          <Wordmark size={26} />
        </div>

        {/* Quote */}
        <div className="relative z-10 mb-8">
          <p
            style={{
              fontFamily: "var(--serif)",
              fontSize: "clamp(18px, 2vw, 24px)",
              fontStyle: "italic",
              fontWeight: 400,
              letterSpacing: "-0.02em",
              lineHeight: 1.5,
              color: "var(--ink)",
            }}
          >
            "Finally found my village at 3am"
          </p>
          <p className="mt-2 text-sm" style={{ color: "var(--ink-3)" }}>— Sarah, mum of twins</p>
        </div>
      </div>

      {/* Right panel — 60% form on paper-2 */}
      <div
        className="flex-1 flex flex-col justify-center px-8 py-12 lg:px-14"
        style={{ background: "var(--paper-2)" }}
      >
        <Link
          to="/"
          className="inline-flex items-center gap-2 mb-8 transition-opacity opacity-60 hover:opacity-100 text-sm"
          style={{ color: "var(--ink)" }}
        >
          <ArrowLeft className="h-4 w-4" />
          Back to home
        </Link>

        <div className="max-w-md w-full mx-auto">
          {/* Mobile wordmark */}
          <div className="lg:hidden mb-8">
            <Wordmark size={22} />
          </div>

          <h1
            className="font-heading text-3xl font-bold mb-1"
            style={{ fontFamily: "var(--serif)", color: "var(--ink)" }}
          >
            Welcome back
          </h1>
          <p className="mb-8 text-sm" style={{ color: "var(--ink-2)" }}>
            Sign in to continue to your community
          </p>

          {/* Social Login */}
          <div className="space-y-3 mb-6">
            <Button
              type="button"
              variant="outline"
              className="w-full rounded-full border-[var(--line)] hover:bg-[var(--paper)]"
              style={{ height: 44, color: "var(--ink)", background: "var(--paper)" }}
              onClick={handleGoogleLogin}
              disabled={googleLoading}
              data-testid="google-login-btn"
            >
              <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              {googleLoading ? "Signing in…" : "Continue with Google"}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="w-full rounded-full border-[var(--line)] hover:bg-[var(--paper)]"
              style={{ height: 44, color: "var(--ink)", background: "var(--paper)" }}
              onClick={handleFacebookLogin}
            >
              <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24" fill="#1877F2">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
              Continue with Facebook
            </Button>
          </div>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t" style={{ borderColor: "var(--line)" }} />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-4 text-[var(--ink-3)]" style={{ background: "var(--paper-2)" }}>
                or sign in with email
              </span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" style={{ color: "var(--ink)" }}>Email</Label>
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

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" style={{ color: "var(--ink)" }}>Password</Label>
                <Link to="/forgot-password" className="text-xs hover:underline" style={{ color: "hsl(var(--accent))" }}>
                  Forgot password?
                </Link>
              </div>
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
                  className="absolute right-3 top-1/2 -translate-y-1/2 opacity-50 hover:opacity-80 transition-opacity"
                  style={{ color: "var(--ink)" }}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full rounded-full"
              style={{ height: 44, background: "var(--ink)", color: "var(--paper)" }}
              disabled={loading}
              data-testid="login-submit-btn"
            >
              {loading ? "Signing in..." : "Sign In"}
            </Button>
          </form>

          <p className="text-center mt-6 text-sm" style={{ color: "var(--ink-2)" }}>
            Don't have an account?{" "}
            <Link to="/register" className="font-medium hover:underline" style={{ color: "hsl(var(--accent))" }} data-testid="register-link">
              Join free
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
