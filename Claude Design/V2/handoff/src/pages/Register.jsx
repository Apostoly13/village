/**
 * Register.jsx — The Village, design refresh
 * ─────────────────────────────────────────────────────
 * KEEP from frontend/src/pages/Register.jsx:
 *   - email, password, confirmPassword, name, showPassword, loading state
 *   - validation (passwords match, length ≥ 8)
 *   - handleSubmit (POST /api/auth/register → localStorage → navigate /onboarding)
 *   - Google/Facebook stubs
 *
 * REPLACE: entire JSX — same shell as Login (split editorial panel + form).
 * ─────────────────────────────────────────────────────
 */
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { ArrowLeft, Eye, EyeOff } from 'lucide-react';

import Wordmark from '../components/village/Wordmark';
import Button   from '../components/village/Button';
import Input    from '../components/village/Input';

const API_URL = process.env.REACT_APP_BACKEND_URL;

export default function Register() {
  const navigate = useNavigate();
  const [name, setName]                       = useState('');
  const [email, setEmail]                     = useState('');
  const [password, setPassword]               = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword]       = useState(false);
  const [loading, setLoading]                 = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password.length < 8)         return toast.error('Password must be at least 8 characters.');
    if (password !== confirmPassword) return toast.error('Passwords don\'t match.');

    setLoading(true);
    try {
      const r = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name, email, password }),
      });
      const data = await r.json();
      if (r.ok) {
        localStorage.setItem('user', JSON.stringify(data));
        toast.success('Welcome to the village.');
        navigate('/onboarding');
      } else {
        toast.error(data.detail || 'Could not create account.');
      }
    } catch {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-paper text-ink flex">
      {/* LEFT — editorial */}
      <div className="hidden lg:flex lg:w-1/2 bg-card border-r border-line">
        <div className="relative w-full h-full flex flex-col justify-between p-14">
          <Wordmark size="md" />
          <div className="max-w-[460px] space-y-6">
            <p className="font-display italic text-[36px] leading-[42px] text-ink text-wrap-pretty">
              You'll find your people here.
            </p>
            <p className="text-body text-ink-muted leading-relaxed">
              The Village is a quiet, private space for Australian parents — to ask the questions you can't say out loud, find your local circle, and feel a little less alone at 3am.
            </p>
            <ul className="space-y-2 text-body-sm text-ink-muted">
              <li className="flex items-start gap-2"><span className="text-support pt-0.5">✓</span> Free to join — Village+ is optional</li>
              <li className="flex items-start gap-2"><span className="text-support pt-0.5">✓</span> Your privacy, your call. Anonymous when you need it.</li>
              <li className="flex items-start gap-2"><span className="text-support pt-0.5">✓</span> Built by parents, in Australia.</li>
            </ul>
          </div>
          <p className="font-mono text-eyebrow uppercase text-ink-faint">14-day Village+ trial · cancel anytime</p>
        </div>
      </div>

      {/* RIGHT — form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-6 py-10 lg:px-16">
        <Link to="/" className="inline-flex items-center gap-2 text-body-sm text-ink-muted hover:text-ink mb-10">
          <ArrowLeft className="h-4 w-4" strokeWidth={1.5} />
          Back to home
        </Link>

        <div className="max-w-[400px] w-full mx-auto">
          <div className="lg:hidden mb-8 flex justify-center"><Wordmark size="lg" /></div>

          <h1 className="font-display text-section text-ink mb-2">Join the village.</h1>
          <p className="text-body text-ink-muted mb-8">A few details and you're in.</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label htmlFor="name" className="block text-label text-ink">Your name</label>
              <Input
                id="name" type="text" value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Sarah" variant="large" required
                data-testid="name-input"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="email" className="block text-label text-ink">Email</label>
              <Input
                id="email" type="email" value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com" variant="large" required
                data-testid="email-input"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="block text-label text-ink">Password</label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  variant="large" required
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

            <div className="space-y-2">
              <label htmlFor="confirm" className="block text-label text-ink">Confirm password</label>
              <Input
                id="confirm"
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="••••••••" variant="large" required
                data-testid="confirm-input"
              />
            </div>

            <Button
              type="submit" variant="primary" size="lg"
              disabled={loading} className="w-full"
              data-testid="register-submit-btn"
            >
              {loading ? 'Creating your account…' : 'Create account'}
            </Button>

            <p className="text-micro text-ink-faint text-center leading-relaxed">
              By joining, you agree to our{' '}
              <Link to="/terms" className="text-ink hover:underline">Terms</Link>{' '}and{' '}
              <Link to="/privacy" className="text-ink hover:underline">Privacy Policy</Link>.
            </p>
          </form>

          <p className="text-center text-body-sm text-ink-muted mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-accent hover:underline font-medium">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
