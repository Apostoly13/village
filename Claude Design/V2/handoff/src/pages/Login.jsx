/**
 * Login.jsx — The Village, design refresh
 * ─────────────────────────────────────────────────────
 * KEEP:
 *   - email, password, showPassword, loading state
 *   - handleSubmit (POST /api/auth/login → localStorage → navigate)
 *   - handleGoogleLogin / handleFacebookLogin stubs
 *
 * REPLACE: entire JSX, left-image treatment, typography
 * ─────────────────────────────────────────────────────
 */
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { ArrowLeft, Eye, EyeOff } from 'lucide-react';

import Wordmark    from '../components/village/Wordmark';
import Button      from '../components/village/Button';
import Input       from '../components/village/Input';

const API_URL = process.env.REACT_APP_BACKEND_URL;

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail]               = useState('');
  const [password, setPassword]         = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading]           = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const r = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });
      const data = await r.json();
      if (r.ok) {
        localStorage.setItem('user', JSON.stringify(data));
        toast.success('Welcome back');
        navigate('/dashboard');
      } else {
        toast.error(data.detail || 'Invalid credentials');
      }
    } catch {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => toast.error('Google login is not yet configured for local development');
  const handleFacebookLogin = () => toast.info('Facebook login coming soon — use email or Google for now.');

  return (
    <div className="min-h-screen bg-paper text-ink flex">
      {/* LEFT — editorial panel */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-card border-r border-line">
        <div className="relative w-full h-full flex flex-col justify-between p-14">
          <Wordmark size="md" />
          <div className="max-w-[420px]">
            <p className="font-display italic text-[32px] leading-[38px] text-ink mb-4 text-wrap-pretty">
              "Finally found my village at 3am."
            </p>
            <p className="text-body text-ink-muted">— Sarah, mother of twins</p>
          </div>
          <p className="font-mono text-eyebrow uppercase text-ink-faint">
            Real conversations · Australian parents · Day and night
          </p>
        </div>
      </div>

      {/* RIGHT — form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-6 py-10 lg:px-16">
        <Link to="/" className="inline-flex items-center gap-2 text-body-sm text-ink-muted hover:text-ink mb-10">
          <ArrowLeft className="h-4 w-4" strokeWidth={1.5} />
          Back to home
        </Link>

        <div className="max-w-[400px] w-full mx-auto">
          <div className="lg:hidden mb-8 flex justify-center">
            <Wordmark size="lg" />
          </div>

          <h1 className="font-display text-section text-ink mb-2">Welcome back.</h1>
          <p className="text-body text-ink-muted mb-8">Sign in to continue to your community.</p>

          {/* Social */}
          <div className="space-y-3 mb-6">
            <button
              type="button"
              onClick={handleGoogleLogin}
              className="w-full h-12 rounded-lg border border-line bg-card hover:border-ink-faint transition-colors flex items-center justify-center gap-3 text-label text-ink"
              data-testid="google-login-btn"
            >
              <svg className="w-4.5 h-4.5" viewBox="0 0 24 24" width="18" height="18">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </button>
            <button
              type="button"
              onClick={handleFacebookLogin}
              className="w-full h-12 rounded-lg border border-line bg-card hover:border-ink-faint transition-colors flex items-center justify-center gap-3 text-label text-ink"
            >
              <svg className="w-4.5 h-4.5" viewBox="0 0 24 24" fill="#1877F2" width="18" height="18">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
              Continue with Facebook
            </button>
          </div>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-line" /></div>
            <div className="relative flex justify-center"><span className="px-4 bg-paper text-micro uppercase tracking-wider font-mono text-ink-faint">or with email</span></div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label htmlFor="email" className="block text-label text-ink">Email</label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                variant="large"
                required
                data-testid="email-input"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="block text-label text-ink">Password</label>
                <Link to="/forgot" className="text-body-sm text-accent hover:underline">Forgot?</Link>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  variant="large"
                  required
                  data-testid="password-input"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-faint hover:text-ink"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" strokeWidth={1.5} /> : <Eye className="h-4 w-4" strokeWidth={1.5} />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              disabled={loading}
              className="w-full"
              data-testid="login-submit-btn"
            >
              {loading ? 'Signing in…' : 'Sign in'}
            </Button>
          </form>

          <p className="text-center text-body-sm text-ink-muted mt-6">
            New here?{' '}
            <Link to="/register" className="text-accent hover:underline font-medium" data-testid="register-link">
              Join the village
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
