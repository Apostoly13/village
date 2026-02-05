import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { toast } from "sonner";
import { ArrowLeft, Eye, EyeOff } from "lucide-react";

const API_URL = process.env.REACT_APP_BACKEND_URL;

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

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
        toast.error(data.detail || "Invalid credentials");
      }
    } catch (error) {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    // REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
    const redirectUrl = window.location.origin + '/dashboard';
    window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left side - Image */}
      <div className="hidden lg:flex lg:w-1/2 relative">
        <div className="absolute inset-0 bg-gradient-to-r from-background via-transparent to-transparent z-10"></div>
        <img 
          src="https://images.unsplash.com/photo-1766393030567-2204662b0be2?w=800&h=1200&fit=crop" 
          alt="Cozy atmosphere"
          className="w-full h-full object-cover"
        />
        <div className="absolute bottom-12 left-12 z-20 max-w-md">
          <p className="text-2xl font-heading font-bold text-foreground mb-2">
            "Finally found my village at 3am"
          </p>
          <p className="text-muted-foreground">— Sarah, mom of twins</p>
        </div>
      </div>

      {/* Right side - Form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-8 py-12 lg:px-16">
        <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8 transition-colors">
          <ArrowLeft className="h-4 w-4" />
          Back to home
        </Link>

        <div className="max-w-md w-full mx-auto">
          <div className="flex items-center gap-2 mb-8">
            <span className="text-3xl">🏡</span>
            <span className="font-heading font-bold text-2xl text-foreground">The Village</span>
          </div>

          <h1 className="font-heading text-3xl font-bold text-foreground mb-2">Welcome back</h1>
          <p className="text-muted-foreground mb-8">Sign in to continue to your community</p>

          {/* Google Login */}
          <Button 
            type="button"
            variant="outline" 
            className="w-full h-12 rounded-xl border-border/50 hover:bg-secondary mb-6"
            onClick={handleGoogleLogin}
            data-testid="google-login-btn"
          >
            <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </Button>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border/50"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-background text-muted-foreground">or sign in with email</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-foreground">Email</Label>
              <Input 
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="h-12 rounded-xl bg-secondary/50 border-transparent focus:border-primary"
                required
                data-testid="email-input"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-foreground">Password</Label>
              </div>
              <div className="relative">
                <Input 
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="h-12 rounded-xl bg-secondary/50 border-transparent focus:border-primary pr-10"
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
            </div>

            <Button 
              type="submit" 
              className="w-full h-12 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_0_15px_rgba(245,197,66,0.3)]"
              disabled={loading}
              data-testid="login-submit-btn"
            >
              {loading ? "Signing in..." : "Sign In"}
            </Button>
          </form>

          <p className="text-center text-muted-foreground mt-6">
            Don't have an account?{" "}
            <Link to="/register" className="text-primary hover:underline font-medium" data-testid="register-link">
              Join free
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
