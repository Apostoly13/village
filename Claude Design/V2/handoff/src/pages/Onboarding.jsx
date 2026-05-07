/**
 * Onboarding.jsx — The Village, design refresh
 * ─────────────────────────────────────────────────────
 * KEEP entirely from frontend/src/pages/Onboarding.jsx:
 *   - All useState (step, formData, geocodeResults, suggestions…)
 *   - All step constants (PARENTING_STAGES, AGE_RANGES, INTERESTS, GENDER_OPTIONS, CONNECT_OPTIONS, AUSTRALIAN_STATES)
 *   - handleNext, handleBack, handleSkip, handleSubmit
 *   - Geocoding handlers, debounced lookups
 *   - The "complete onboarding" PUT call
 *
 * REPLACE entirely:
 *   - Step shell (header, progress, footer buttons)
 *   - Inside-step JSX — every option becomes a <Choice> tile
 *   - Color/font/spacing tokens
 *
 * NOTE: This file shows the SHELL + the first step verbatim. For each remaining
 * step, replace the existing JSX by composing <Choice>, <ChoiceGrid>, <Input>,
 * <SectionHeading> — the data and validation logic does NOT change.
 * ─────────────────────────────────────────────────────
 */
import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react';

import Wordmark      from '../components/village/Wordmark';
import Button        from '../components/village/Button';
import Input         from '../components/village/Input';
import SectionHeading from '../components/village/SectionHeading';
import { cn } from '../lib/cn';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const TOTAL_STEPS = 7;

// ─── KEEP these constants verbatim from the original file ─────────────────
const PARENTING_STAGES = [
  { id: 'expecting',  label: 'Expecting',     hint: 'Pregnant or partner is' },
  { id: 'newborn',    label: 'Newborn',       hint: '0 – 3 months' },
  { id: 'infant',     label: 'Infant',        hint: '3 – 12 months' },
  { id: 'toddler',    label: 'Toddler',       hint: '1 – 3 years' },
  { id: 'preschool',  label: 'Preschool',     hint: '3 – 5 years' },
  { id: 'school_age', label: 'School age',    hint: '5 – 12 years' },
  { id: 'teenager',   label: 'Teen',          hint: '13+' },
  { id: 'mixed',      label: 'Mixed ages',    hint: 'A few different stages' },
];
const INTERESTS = [
  'Sleep & Settling','Feeding','Breastfeeding','Sleep Training','Toddler Activities',
  'School Age','Mental Health','Dad Talk','Local Events','Development Milestones',
  'Buy & Swap','Relationships','Single Parenting',
];
const GENDER_OPTIONS  = [{id:'female',label:'Female'},{id:'male',label:'Male'},{id:'prefer-not-say',label:'Prefer not to say'}];
const CONNECT_OPTIONS = [
  { id: 'all',            label: 'Everyone' },
  { id: 'mums',           label: 'Mums' },
  { id: 'dads',           label: 'Dads' },
  { id: 'single-parents', label: 'Single parents' },
  { id: 'same',           label: 'Same parenting stage as me' },
];
const AUSTRALIAN_STATES = ['NSW','VIC','QLD','WA','SA','TAS','ACT','NT'];
const REACH_OPTIONS = [
  { id: '2km',   label: 'Super local',  hint: 'Within 2km' },
  { id: '5km',   label: 'Local',        hint: 'Within 5km' },
  { id: '10km',  label: 'Nearby',       hint: 'Within 10km' },
  { id: '25km',  label: '25km' },
  { id: '50km',  label: '50km' },
  { id: '100km', label: '100km' },
  { id: 'state', label: 'My state' },
  { id: 'all',   label: 'All Australia' },
];

export default function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);

  // KEEP — formData shape unchanged from existing Onboarding
  const [formData, setFormData] = useState({
    nickname: '', parenting_stage: '', child_age_ranges: [], interests: [],
    gender: '', connect_with: 'all', is_single_parent: false,
    suburb: '', state: '', postcode: '', latitude: null, longitude: null,
    preferred_reach: '10km',
  });

  const update = (patch) => setFormData(prev => ({ ...prev, ...patch }));
  const toggleArr = (key, value) => {
    setFormData(prev => ({
      ...prev,
      [key]: prev[key].includes(value) ? prev[key].filter(v => v !== value) : [...prev[key], value],
    }));
  };

  const handleNext = () => setStep(s => Math.min(s + 1, TOTAL_STEPS - 1));
  const handleBack = () => setStep(s => Math.max(s - 1, 0));
  const handleSkip = () => navigate('/dashboard');

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const r = await fetch(`${API_URL}/api/users/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ ...formData, onboarding_complete: true }),
      });
      if (!r.ok) throw new Error();
      const stored = JSON.parse(localStorage.getItem('user') || '{}');
      localStorage.setItem('user', JSON.stringify({ ...stored, onboarding_complete: true }));
      toast.success("You're in. Welcome.");
      navigate('/dashboard');
    } catch {
      toast.error('Could not save your profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-paper text-ink flex flex-col">

      {/* ─── Header ─── */}
      <header className="px-6 lg:px-10 h-16 flex items-center justify-between border-b border-line-soft">
        <Wordmark size="md" />
        <button onClick={handleSkip} className="text-body-sm text-ink-muted hover:text-ink">
          Skip for now
        </button>
      </header>

      {/* ─── Progress ─── */}
      <div className="px-6 lg:px-10 pt-6">
        <div className="max-w-[640px] mx-auto">
          <div className="flex items-center justify-between mb-2">
            <p className="font-mono text-eyebrow uppercase text-ink-faint">
              Step {step + 1} of {TOTAL_STEPS}
            </p>
            <p className="font-mono text-eyebrow uppercase text-ink-faint">
              {Math.round(((step + 1) / TOTAL_STEPS) * 100)}%
            </p>
          </div>
          <div className="h-[3px] rounded-full bg-line-soft overflow-hidden">
            <div
              className="h-full bg-accent transition-all duration-500 ease-out"
              style={{ width: `${((step + 1) / TOTAL_STEPS) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* ─── Step body ─── */}
      <main className="flex-1 px-6 lg:px-10 py-10 lg:py-14">
        <div className="max-w-[640px] mx-auto">

          {step === 0 && (
            <Step
              eyebrow="Step one"
              title="What should we call you?"
              hint="Your nickname appears on your posts. You can change it later."
            >
              <div className="space-y-2">
                <label htmlFor="nickname" className="block text-label text-ink">Display name</label>
                <Input
                  id="nickname" value={formData.nickname}
                  onChange={e => update({ nickname: e.target.value })}
                  placeholder="Sarah" variant="large" autoFocus
                  data-testid="nickname-input"
                />
                <p className="text-micro text-ink-faint">First name is fine. Doesn't have to be your real one.</p>
              </div>
            </Step>
          )}

          {step === 1 && (
            <Step
              eyebrow="Step two"
              title="Where are you in parenting?"
              hint="Pick the closest match. We'll use this to suggest spaces and people."
            >
              <ChoiceGrid cols={2}>
                {PARENTING_STAGES.map(s => (
                  <Choice
                    key={s.id}
                    selected={formData.parenting_stage === s.id}
                    onClick={() => update({ parenting_stage: s.id })}
                    label={s.label}
                    hint={s.hint}
                  />
                ))}
              </ChoiceGrid>
            </Step>
          )}

          {step === 2 && (
            <Step
              eyebrow="Step three"
              title="What are you here for?"
              hint="Pick a few — we'll show you spaces that match."
            >
              <div className="flex flex-wrap gap-2">
                {INTERESTS.map(i => {
                  const on = formData.interests.includes(i);
                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={() => toggleArr('interests', i)}
                      className={cn(
                        'h-10 px-4 rounded-full border text-body-sm transition-colors',
                        on
                          ? 'bg-button text-button-ink border-button'
                          : 'bg-card border-line text-ink-muted hover:border-ink-faint hover:text-ink'
                      )}
                    >
                      {on && <Check className="inline h-3.5 w-3.5 mr-1.5 -mt-0.5" strokeWidth={2} />}
                      {i}
                    </button>
                  );
                })}
              </div>
            </Step>
          )}

          {step === 3 && (
            <Step
              eyebrow="Step four"
              title="Who would you like to connect with?"
              hint="You can change this anytime in settings."
            >
              <ChoiceGrid cols={2}>
                {CONNECT_OPTIONS.map(c => (
                  <Choice
                    key={c.id}
                    selected={formData.connect_with === c.id}
                    onClick={() => update({ connect_with: c.id })}
                    label={c.label}
                  />
                ))}
              </ChoiceGrid>

              <div className="mt-8 pt-6 border-t border-line-soft">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_single_parent}
                    onChange={e => update({ is_single_parent: e.target.checked })}
                    className="mt-1 accent-accent"
                  />
                  <div>
                    <p className="text-label text-ink">I'm a single parent</p>
                    <p className="text-micro text-ink-faint">We'll surface single-parent circles and people for you.</p>
                  </div>
                </label>
              </div>
            </Step>
          )}

          {step === 4 && (
            <Step
              eyebrow="Step five"
              title="A bit about you"
              hint="Optional. Skip what you'd rather not share."
            >
              <div className="space-y-6">
                <div>
                  <p className="text-label text-ink mb-2">Gender</p>
                  <ChoiceGrid cols={3}>
                    {GENDER_OPTIONS.map(g => (
                      <Choice
                        key={g.id}
                        selected={formData.gender === g.id}
                        onClick={() => update({ gender: g.id })}
                        label={g.label}
                      />
                    ))}
                  </ChoiceGrid>
                </div>
              </div>
            </Step>
          )}

          {step === 5 && (
            <Step
              eyebrow="Step six"
              title="Where in Australia?"
              hint="We use this to find your local circle and nearby events."
            >
              <div className="space-y-5">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <label className="block text-label text-ink">Suburb</label>
                    <Input
                      value={formData.suburb}
                      onChange={e => update({ suburb: e.target.value })}
                      placeholder="Bondi" variant="large"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-label text-ink">Postcode</label>
                    <Input
                      value={formData.postcode}
                      onChange={e => update({ postcode: e.target.value })}
                      placeholder="2026" variant="large"
                    />
                  </div>
                </div>
                <div>
                  <p className="text-label text-ink mb-2">State</p>
                  <div className="flex flex-wrap gap-2">
                    {AUSTRALIAN_STATES.map(s => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => update({ state: s })}
                        className={cn(
                          'h-9 px-4 rounded-full border text-body-sm transition-colors',
                          formData.state === s
                            ? 'bg-button text-button-ink border-button'
                            : 'bg-card border-line text-ink-muted hover:border-ink-faint hover:text-ink'
                        )}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-label text-ink mb-2">How far should we reach?</p>
                  <ChoiceGrid cols={2}>
                    {REACH_OPTIONS.map(r => (
                      <Choice
                        key={r.id}
                        selected={formData.preferred_reach === r.id}
                        onClick={() => update({ preferred_reach: r.id })}
                        label={r.label}
                        hint={r.hint}
                      />
                    ))}
                  </ChoiceGrid>
                </div>
              </div>
            </Step>
          )}

          {step === 6 && (
            <Step
              eyebrow="Last step"
              title={`Ready when you are${formData.nickname ? `, ${formData.nickname}` : ''}.`}
              hint="We'll set up your dashboard with circles and events that match what you told us. Nothing's permanent — change everything from your profile anytime."
            >
              <div className="village-card px-6 py-6 space-y-3">
                <Row label="Stage"     value={PARENTING_STAGES.find(s => s.id === formData.parenting_stage)?.label || '—'} />
                <Row label="Interests" value={formData.interests.length ? formData.interests.join(', ') : '—'} />
                <Row label="Connect"   value={CONNECT_OPTIONS.find(c => c.id === formData.connect_with)?.label || 'Everyone'} />
                <Row label="Suburb"    value={[formData.suburb, formData.state].filter(Boolean).join(', ') || '—'} />
                <Row label="Reach"     value={REACH_OPTIONS.find(r => r.id === formData.preferred_reach)?.label || '—'} />
              </div>
            </Step>
          )}

        </div>
      </main>

      {/* ─── Footer ─── */}
      <footer className="border-t border-line-soft px-6 lg:px-10 py-5">
        <div className="max-w-[640px] mx-auto flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={handleBack}
            disabled={step === 0}
            className={cn(step === 0 && 'opacity-0 pointer-events-none')}
          >
            <ArrowLeft className="h-4 w-4 mr-1" strokeWidth={1.5} />
            Back
          </Button>

          {step < TOTAL_STEPS - 1 ? (
            <Button variant="primary" onClick={handleNext}>
              Continue
              <ArrowRight className="h-4 w-4 ml-1" strokeWidth={1.5} />
            </Button>
          ) : (
            <Button variant="primary" onClick={handleSubmit} disabled={loading}>
              {loading ? 'Setting up…' : 'Enter the village'}
            </Button>
          )}
        </div>
      </footer>
    </div>
  );
}

// ─── Local primitives (file-scoped) ────────────────────

function Step({ eyebrow, title, hint, children }) {
  return (
    <section className="space-y-7">
      <div className="space-y-2">
        <p className="font-mono text-eyebrow uppercase text-ink-faint">{eyebrow}</p>
        <h1 className="font-display text-section text-ink text-wrap-pretty">{title}</h1>
        {hint && <p className="text-body text-ink-muted leading-relaxed max-w-[520px]">{hint}</p>}
      </div>
      <div>{children}</div>
    </section>
  );
}

function ChoiceGrid({ cols = 2, children }) {
  const grid = cols === 3 ? 'grid-cols-2 sm:grid-cols-3' : 'grid-cols-1 sm:grid-cols-2';
  return <div className={cn('grid gap-2.5', grid)}>{children}</div>;
}

function Choice({ selected, onClick, label, hint }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'text-left px-4 py-3.5 rounded-lg border transition-all duration-150',
        'flex items-start justify-between gap-3',
        selected
          ? 'bg-accent-soft border-accent shadow-soft'
          : 'bg-card border-line hover:border-ink-faint'
      )}
    >
      <div className="min-w-0">
        <p className={cn('text-label text-ink', selected && 'font-semibold')}>{label}</p>
        {hint && <p className="text-micro text-ink-faint mt-0.5">{hint}</p>}
      </div>
      {selected && (
        <span className="h-5 w-5 rounded-full bg-accent flex items-center justify-center shrink-0 mt-0.5">
          <Check className="h-3 w-3 text-button-ink" strokeWidth={2.5} />
        </span>
      )}
    </button>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <span className="font-mono text-eyebrow uppercase text-ink-faint shrink-0">{label}</span>
      <span className="text-body-sm text-ink text-right">{value}</span>
    </div>
  );
}
