/**
 * Messages.jsx — The Village, design refresh
 * ─────────────────────────────────────────────────────
 * KEEP from frontend/src/pages/Messages.jsx:
 *   - All useState (conversations, activeConvo, messages, input, search)
 *   - useEffect that loads /api/messages/conversations
 *   - useEffect that loads thread on activeConvo change
 *   - sendMessage, markRead, deleteConvo
 *   - The unread badge logic
 *
 * REPLACE entirely:
 *   - Two-pane layout: list (left, 320px) | thread (right, fluid)
 *   - List rows are quiet, no avatars-with-noise, with thin unread dot
 *   - Thread mirrors ChatRoom bubble style
 * ─────────────────────────────────────────────────────
 */
import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Send, ArrowLeft, MoreHorizontal } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';

import Navigation from '../components/Navigation';
import {
  Avatar, IconButton, SearchBar, SectionHeading,
} from '../components/village';
import { cn } from '../lib/cn';

const API_URL = process.env.REACT_APP_BACKEND_URL;

export default function Messages({ user }) {
  const navigate = useNavigate();
  const scrollRef = useRef(null);

  const [conversations, setConversations] = useState([]);
  const [activeConvo, setActiveConvo]     = useState(null);
  const [thread, setThread]               = useState([]);
  const [input, setInput]                 = useState('');
  const [search, setSearch]               = useState('');
  const [loading, setLoading]             = useState(true);

  useEffect(() => {
    fetchConversations();
    const id = setInterval(fetchConversations, 30000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (activeConvo) fetchThread(activeConvo.other_user_id);
  }, [activeConvo]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [thread]);

  async function fetchConversations() {
    try {
      const r = await fetch(`${API_URL}/api/messages/conversations`, { credentials: 'include' });
      if (r.ok) setConversations(await r.json());
    } catch {} finally { setLoading(false); }
  }
  async function fetchThread(otherUserId) {
    try {
      const r = await fetch(`${API_URL}/api/messages/${otherUserId}`, { credentials: 'include' });
      if (r.ok) setThread(await r.json());
    } catch {}
  }
  async function sendMessage(e) {
    e.preventDefault();
    if (!input.trim() || !activeConvo) return;
    const content = input; setInput('');
    try {
      const r = await fetch(`${API_URL}/api/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ receiver_id: activeConvo.other_user_id, content }),
      });
      if (r.ok) {
        const newMsg = await r.json();
        setThread(t => [...t, newMsg]);
        fetchConversations();
      }
    } catch {}
  }

  const filtered = conversations.filter(c =>
    !search.trim() ||
    c.other_user_name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="h-screen bg-paper flex flex-col lg:pl-[240px]">
      <Navigation user={user} />

      <main className="flex-1 grid grid-cols-1 lg:grid-cols-[320px_1fr] overflow-hidden pt-14 lg:pt-0">

        {/* ─── LIST ─── */}
        <aside className={cn(
          'border-r border-line flex flex-col',
          activeConvo && 'hidden lg:flex'
        )}>
          <header className="px-5 py-5 border-b border-line-soft">
            <h1 className="font-display text-card-title text-ink mb-3">Messages</h1>
            <SearchBar
              value={search} onChange={setSearch}
              placeholder="Search messages…" hideNewPost size="sm"
            />
          </header>

          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="p-5 space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="flex items-center gap-3 animate-pulse">
                    <div className="h-10 w-10 rounded-full bg-line-soft" />
                    <div className="flex-1 space-y-1.5">
                      <div className="h-3 bg-line-soft rounded w-2/3" />
                      <div className="h-2.5 bg-line-soft rounded w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="p-8 text-center">
                <p className="font-display italic text-ink mb-1">No messages yet.</p>
                <p className="text-body-sm text-ink-muted">Start a conversation from a profile or post.</p>
              </div>
            ) : (
              <ul>
                {filtered.map(c => (
                  <li key={c.conversation_id}>
                    <button
                      onClick={() => setActiveConvo(c)}
                      className={cn(
                        'w-full flex items-center gap-3 px-5 py-4 hover:bg-line-soft transition-colors text-left',
                        activeConvo?.conversation_id === c.conversation_id && 'bg-line-soft'
                      )}
                    >
                      <Avatar name={c.other_user_name} src={c.other_user_picture} size="md" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline justify-between gap-2">
                          <p className={cn('text-body-sm truncate', c.unread_count > 0 ? 'font-semibold text-ink' : 'text-ink')}>
                            {c.other_user_name}
                          </p>
                          <span className="font-mono text-eyebrow uppercase text-ink-faint shrink-0">
                            {fmtTime(c.last_message_time)}
                          </span>
                        </div>
                        <p className={cn('text-body-sm truncate', c.unread_count > 0 ? 'text-ink' : 'text-ink-muted')}>
                          {c.last_message}
                        </p>
                      </div>
                      {c.unread_count > 0 && (
                        <span className="h-2 w-2 rounded-full bg-accent shrink-0" />
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </aside>

        {/* ─── THREAD ─── */}
        {activeConvo ? (
          <section className="flex flex-col overflow-hidden">
            <header className="border-b border-line bg-paper px-4 sm:px-6 lg:px-10 py-4 flex items-center gap-4">
              <button onClick={() => setActiveConvo(null)} className="text-ink-muted hover:text-ink lg:hidden">
                <ArrowLeft className="h-5 w-5" strokeWidth={1.5} />
              </button>
              <Link to={`/profile/${activeConvo.other_user_id}`} className="flex items-center gap-3 flex-1 min-w-0 hover:opacity-80">
                <Avatar name={activeConvo.other_user_name} src={activeConvo.other_user_picture} size="md" />
                <div className="min-w-0">
                  <p className="text-body font-medium text-ink truncate">{activeConvo.other_user_name}</p>
                  <p className="text-micro text-ink-faint">View profile</p>
                </div>
              </Link>
              <IconButton icon={MoreHorizontal} label="Options" />
            </header>

            <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-10 py-6">
              <div className="max-w-[680px] mx-auto space-y-2">
                {thread.length === 0 && (
                  <div className="text-center py-20">
                    <p className="font-display italic text-ink mb-1">No messages yet.</p>
                    <p className="text-body-sm text-ink-muted">Say hi — break the ice gently.</p>
                  </div>
                )}
                {thread.map(m => {
                  const own = m.sender_id === user?.user_id;
                  return (
                    <div key={m.message_id} className={cn('flex', own && 'justify-end')}>
                      <div
                        className={cn(
                          'max-w-[78%] px-4 py-2.5 text-body leading-relaxed text-wrap-pretty rounded-2xl',
                          own
                            ? 'bg-button text-button-ink rounded-tr-md'
                            : 'bg-card border border-line-soft text-ink rounded-tl-md'
                        )}
                      >
                        {m.content}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <form onSubmit={sendMessage} className="border-t border-line bg-paper px-4 sm:px-6 lg:px-10 py-4 shrink-0">
              <div className="max-w-[680px] mx-auto flex items-end gap-3">
                <div className="flex-1 village-card flex items-end gap-2 px-4 py-2.5 focus-within:ring-1 focus-within:ring-accent/40">
                  <textarea
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(e); } }}
                    placeholder={`Message ${activeConvo.other_user_name?.split(' ')[0] || ''}…`}
                    rows={1}
                    className="flex-1 bg-transparent text-body text-ink placeholder:text-ink-faint resize-none focus:outline-none max-h-32"
                  />
                  <button
                    type="submit"
                    disabled={!input.trim()}
                    className="h-9 w-9 rounded-full bg-button text-button-ink hover:bg-button-hover disabled:opacity-40 transition-colors flex items-center justify-center"
                    aria-label="Send"
                  >
                    <Send className="h-4 w-4" strokeWidth={1.5} />
                  </button>
                </div>
              </div>
            </form>
          </section>
        ) : (
          <section className="hidden lg:flex flex-col items-center justify-center text-center px-8">
            <p className="font-mono text-eyebrow uppercase text-ink-faint mb-3">Direct messages</p>
            <p className="font-display italic text-section text-ink mb-2">Pick a conversation.</p>
            <p className="text-body text-ink-muted max-w-[360px]">
              Or start one from a parent's profile. Messages are private and never indexed.
            </p>
          </section>
        )}
      </main>
    </div>
  );
}

function fmtTime(d) {
  if (!d) return '';
  try {
    const ago = (Date.now() - new Date(d).getTime()) / (60 * 1000);
    if (ago < 60)        return formatDistanceToNow(new Date(d), { addSuffix: false });
    if (ago < 60 * 24)   return format(new Date(d), 'h:mma').toLowerCase();
    return format(new Date(d), 'd MMM');
  } catch { return ''; }
}
