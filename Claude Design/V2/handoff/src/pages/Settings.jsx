/**
 * Settings.jsx — The Village, design refresh
 * ─────────────────────────────────────────────────────
 * KEEP from frontend/src/pages/Settings.jsx:
 *   - All useState (formData, notifications, privacy, password, deleting)
 *   - useEffect that loads current settings
 *   - handleSave, handlePasswordChange, handleDelete, handleLogout
 *   - Image upload handlers (cover, picture)
 *   - Subscription / billing handlers if present
 *
 * REPLACE entirely:
 *   - Two-pane layout: vertical section nav (left, sticky) + content (right)
 *   - Sections: Profile, Account, Notifications, Privacy, Subscription, Danger zone
 *   - Forms use grouped Field rows
 * ─────────────────────────────────────────────────────
 */
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  User, AtSign, Bell, Lock, CreditCard, AlertTriangle, LogOut, Camera,
} from 'lucide-react';
import { toast } from 'sonner';

import Navigation from '../components/Navigation';
import {
  Button, Input, Avatar, SectionHeading, Pill, IconButton,
} from '../components/village';
import { cn } from '../lib/cn';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const SECTIONS = [
  { id: 'profile',       label: 'Profile',      icon: User },
  { id: 'account',       label: 'Account',      icon: AtSign },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'privacy',       label: 'Privacy',      icon: Lock },
  { id: 'subscription',  label: 'Subscription', icon: CreditCard },
  { id: 'danger',        label: 'Danger zone',  icon: AlertTriangle },
];

export default function Settings({ user, setUser }) {
  const navigate = useNavigate();
  const [section, setSection] = useState('profile');

  const [formData, setFormData] = useState({
    name: user?.name || '',
    nickname: user?.nickname || '',
    bio: user?.bio || '',
    suburb: user?.suburb || '',
    state: user?.state || '',
    postcode: user?.postcode || '',
  });
  const [notifications, setNotifications] = useState({
    email_replies: true, email_messages: true, email_events: true,
    push_replies: true, push_messages: true, push_chat: false,
  });
  const [privacy, setPrivacy] = useState({
    profile_visibility: 'members',
    show_location: true,
    allow_messages: 'friends',
  });

  function update(patch) { setFormData(p => ({ ...p, ...patch })); }
  function updateNotif(k, v) { setNotifications(p => ({ ...p, [k]: v })); }
  function updatePriv(k, v) { setPrivacy(p => ({ ...p, [k]: v })); }

  async function handleSave() {
    try {
      const r = await fetch(`${API_URL}/api/users/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(formData),
      });
      if (r.ok) {
        const updated = await r.json();
        if (setUser) setUser(updated);
        localStorage.setItem('user', JSON.stringify(updated));
        toast.success('Saved.');
      }
    } catch { toast.error('Could not save.'); }
  }

  async function handleLogout() {
    try {
      await fetch(`${API_URL}/api/auth/logout`, { method: 'POST', credentials: 'include' });
      localStorage.removeItem('user');
      navigate('/');
    } catch {}
  }

  return (
    <div className="min-h-screen bg-paper">
      <Navigation user={user} />

      <main className="lg:pl-[240px] pt-14 lg:pt-0">
        <div className="max-w-[960px] mx-auto px-4 sm:px-6 lg:px-10 py-6 lg:py-10">

          <header className="mb-7">
            <p className="font-mono text-eyebrow uppercase text-ink-faint mb-2">Settings</p>
            <h1 className="font-display text-section text-ink">Make it yours.</h1>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-8">

            {/* SIDE NAV */}
            <aside className="lg:sticky lg:top-6 self-start">
              <nav className="flex lg:flex-col gap-1 overflow-x-auto -mx-4 px-4 lg:mx-0 lg:px-0">
                {SECTIONS.map(s => {
                  const active = section === s.id;
                  const danger = s.id === 'danger';
                  return (
                    <button
                      key={s.id}
                      onClick={() => setSection(s.id)}
                      className={cn(
                        'inline-flex items-center gap-3 h-10 px-3 rounded-md text-body-sm whitespace-nowrap transition-colors text-left',
                        active && !danger && 'bg-line-soft text-ink',
                        active && danger && 'bg-warn/10 text-warn',
                        !active && 'text-ink-muted hover:bg-line-soft hover:text-ink'
                      )}
                    >
                      <s.icon className="h-4 w-4" strokeWidth={1.5} />
                      {s.label}
                    </button>
                  );
                })}
              </nav>
            </aside>

            {/* CONTENT */}
            <div className="min-w-0 space-y-6">

              {section === 'profile' && (
                <Section title="Profile" hint="How you appear to other parents.">
                  <Field label="Profile picture">
                    <div className="flex items-center gap-4">
                      <Avatar name={user?.name} src={user?.picture} size="xl" />
                      <Button variant="outline" size="sm">
                        <Camera className="h-4 w-4 mr-1" strokeWidth={1.5} />
                        Change
                      </Button>
                    </div>
                  </Field>
                  <Field label="Display name">
                    <Input value={formData.name} onChange={e => update({ name: e.target.value })} />
                  </Field>
                  <Field label="Bio" hint="A short line — what stage you're in, what you're up to.">
                    <textarea
                      value={formData.bio}
                      onChange={e => update({ bio: e.target.value })}
                      rows={3}
                      className="w-full bg-paper border border-line rounded-md px-3 py-2 text-body text-ink placeholder:text-ink-faint focus:outline-none focus:ring-1 focus:ring-accent/40 focus:border-accent"
                      placeholder="Mum to a 4yo and a 6mo, bondi area, here for the late-night chats."
                    />
                  </Field>
                  <Field label="Suburb">
                    <Input value={formData.suburb} onChange={e => update({ suburb: e.target.value })} />
                  </Field>
                  <SaveBar onSave={handleSave} />
                </Section>
              )}

              {section === 'account' && (
                <Section title="Account" hint="Login details.">
                  <Field label="Email">
                    <Input value={user?.email || ''} disabled />
                  </Field>
                  <Field label="Password">
                    <Button variant="outline" size="sm">Change password</Button>
                  </Field>
                  <Field label="Sign out">
                    <Button variant="outline" size="sm" onClick={handleLogout}>
                      <LogOut className="h-4 w-4 mr-1" strokeWidth={1.5} /> Sign out
                    </Button>
                  </Field>
                </Section>
              )}

              {section === 'notifications' && (
                <Section title="Notifications" hint="What we email you, and what we ping in the app.">
                  <SubGroup title="Email">
                    <Toggle label="Replies to my posts" value={notifications.email_replies} onChange={v => updateNotif('email_replies', v)} />
                    <Toggle label="New messages" value={notifications.email_messages} onChange={v => updateNotif('email_messages', v)} />
                    <Toggle label="Events near me" value={notifications.email_events} onChange={v => updateNotif('email_events', v)} />
                  </SubGroup>
                  <SubGroup title="Push">
                    <Toggle label="Replies" value={notifications.push_replies} onChange={v => updateNotif('push_replies', v)} />
                    <Toggle label="Direct messages" value={notifications.push_messages} onChange={v => updateNotif('push_messages', v)} />
                    <Toggle label="Chat room activity" value={notifications.push_chat} onChange={v => updateNotif('push_chat', v)} />
                  </SubGroup>
                  <SaveBar onSave={() => toast.success('Saved.')} />
                </Section>
              )}

              {section === 'privacy' && (
                <Section title="Privacy" hint="Who sees what.">
                  <Field label="Profile visibility">
                    <RadioGroup
                      value={privacy.profile_visibility}
                      onChange={v => updatePriv('profile_visibility', v)}
                      options={[
                        { id: 'public',  label: 'Public',  hint: 'Anyone on the village' },
                        { id: 'members', label: 'Members', hint: 'Members only — recommended' },
                        { id: 'friends', label: 'Friends', hint: 'Just my friends' },
                      ]}
                    />
                  </Field>
                  <Field label="Show my location">
                    <Toggle label="Display suburb on my profile" value={privacy.show_location} onChange={v => updatePriv('show_location', v)} />
                  </Field>
                  <Field label="Who can message me">
                    <RadioGroup
                      value={privacy.allow_messages}
                      onChange={v => updatePriv('allow_messages', v)}
                      options={[
                        { id: 'anyone',  label: 'Anyone' },
                        { id: 'friends', label: 'Friends only' },
                        { id: 'none',    label: 'No one' },
                      ]}
                    />
                  </Field>
                  <SaveBar onSave={() => toast.success('Saved.')} />
                </Section>
              )}

              {section === 'subscription' && (
                <Section title="Subscription" hint="Village+ unlocks the marketplace, advanced search, and the 3am Club.">
                  <div className="village-card p-6">
                    <div className="flex items-center gap-3 mb-3">
                      <h3 className="font-display text-card-title text-ink">Village+</h3>
                      {user?.is_premium ? (
                        <Pill color="support" size="xs">Active</Pill>
                      ) : (
                        <Pill color="neutral" size="xs">Free trial available</Pill>
                      )}
                    </div>
                    <p className="text-body text-ink-muted leading-relaxed mb-5">
                      $9.99/mo or $79/yr. Cancel anytime. Includes Stalls marketplace, advanced filters, the 3am Club, and Village Voice.
                    </p>
                    {user?.is_premium ? (
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="md">Manage billing</Button>
                        <Button variant="ghost" size="md">Cancel</Button>
                      </div>
                    ) : (
                      <Button variant="primary" size="md">Start 14-day free trial</Button>
                    )}
                  </div>
                </Section>
              )}

              {section === 'danger' && (
                <Section title="Danger zone" hint="Permanent things.">
                  <div className="village-card border-warn/30 bg-warn/5 p-5">
                    <h4 className="text-body font-medium text-ink mb-1">Delete my account</h4>
                    <p className="text-body-sm text-ink-muted mb-4">
                      All your posts, messages, and circles will be removed. This can't be undone.
                    </p>
                    <Button variant="outline" size="sm" className="border-warn text-warn hover:bg-warn hover:text-paper">
                      Delete account
                    </Button>
                  </div>
                </Section>
              )}

            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

// ───────────── Local components ─────────────

function Section({ title, hint, children }) {
  return (
    <section>
      <div className="mb-6">
        <h2 className="font-display text-card-title text-ink">{title}</h2>
        {hint && <p className="text-body-sm text-ink-muted mt-1">{hint}</p>}
      </div>
      <div className="village-card p-6 space-y-5">{children}</div>
    </section>
  );
}

function Field({ label, hint, children }) {
  return (
    <div>
      <p className="text-label text-ink mb-1.5">{label}</p>
      {hint && <p className="text-micro text-ink-faint mb-2">{hint}</p>}
      {children}
    </div>
  );
}

function SubGroup({ title, children }) {
  return (
    <div className="border-t border-line-soft pt-5 first:border-0 first:pt-0">
      <p className="font-mono text-eyebrow uppercase text-ink-faint mb-3">{title}</p>
      <div className="space-y-1">{children}</div>
    </div>
  );
}

function Toggle({ label, value, onChange }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      className="w-full flex items-center justify-between py-2.5 group"
    >
      <span className="text-body text-ink">{label}</span>
      <span
        className={cn(
          'h-6 w-10 rounded-full transition-colors relative',
          value ? 'bg-accent' : 'bg-line'
        )}
      >
        <span
          className={cn(
            'absolute top-0.5 h-5 w-5 rounded-full bg-paper shadow-sm transition-transform',
            value ? 'translate-x-[18px]' : 'translate-x-0.5'
          )}
        />
      </span>
    </button>
  );
}

function RadioGroup({ value, onChange, options }) {
  return (
    <div className="space-y-2">
      {options.map(o => {
        const on = value === o.id;
        return (
          <button
            key={o.id}
            type="button"
            onClick={() => onChange(o.id)}
            className={cn(
              'w-full text-left px-4 py-3 rounded-md border transition-colors flex items-start gap-3',
              on ? 'border-accent bg-accent-soft' : 'border-line hover:border-ink-faint'
            )}
          >
            <span className={cn(
              'h-4 w-4 rounded-full border-2 mt-0.5 shrink-0',
              on ? 'border-accent bg-accent' : 'border-line'
            )} />
            <div>
              <p className="text-label text-ink">{o.label}</p>
              {o.hint && <p className="text-micro text-ink-faint mt-0.5">{o.hint}</p>}
            </div>
          </button>
        );
      })}
    </div>
  );
}

function SaveBar({ onSave }) {
  return (
    <div className="flex justify-end pt-3 border-t border-line-soft">
      <Button variant="primary" size="md" onClick={onSave}>Save changes</Button>
    </div>
  );
}
