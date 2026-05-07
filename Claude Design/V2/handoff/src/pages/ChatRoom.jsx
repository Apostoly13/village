/**
 * ChatRoom.jsx — The Village, design refresh
 * ─────────────────────────────────────────────────────
 * KEEP from frontend/src/pages/ChatRoom.jsx:
 *   - All useState (room, messages, input, isAtBottom, members, online)
 *   - useParams roomId
 *   - WebSocket / polling effect for live messages
 *   - sendMessage, handleScroll, autoscroll behavior
 *   - leaveRoom, reportMessage handlers
 *
 * REPLACE entirely:
 *   - Three-pane shell: header (room meta + members) / message stream / composer
 *   - Editorial bubble style — no emoji junk, soft watercolor tints
 *   - Online avatars row at top (clickable for profile)
 *
 * Layout: keep the existing scroll + autoscroll logic. The wrapper div with
 * ref={scrollRef} stays — only its className changes.
 * ─────────────────────────────────────────────────────
 */
import { useState, useEffect, useRef } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Send, Users, MoreHorizontal, MapPin } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';

import Navigation from '../components/Navigation';
import {
  Button, Avatar, IconButton, LiveDot, Pill,
} from '../components/village';
import { cn } from '../lib/cn';

const API_URL = process.env.REACT_APP_BACKEND_URL;

export default function ChatRoom({ user }) {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const scrollRef = useRef(null);

  const [room, setRoom]         = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput]       = useState('');
  const [members, setMembers]   = useState([]);
  const [sending, setSending]   = useState(false);
  const [isAtBottom, setIsAtBottom] = useState(true);

  useEffect(() => {
    fetchRoom();
    fetchMessages();
    fetchMembers();
    const id = setInterval(() => { fetchMessages(); fetchMembers(); }, 8000);
    return () => clearInterval(id);
  }, [roomId]);

  useEffect(() => {
    if (isAtBottom && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isAtBottom]);

  async function fetchRoom() {
    try {
      const r = await fetch(`${API_URL}/api/chat/rooms/${roomId}`, { credentials: 'include' });
      if (r.ok) setRoom(await r.json());
    } catch {}
  }
  async function fetchMessages() {
    try {
      const r = await fetch(`${API_URL}/api/chat/rooms/${roomId}/messages?limit=100`, { credentials: 'include' });
      if (r.ok) setMessages(await r.json());
    } catch {}
  }
  async function fetchMembers() {
    try {
      const r = await fetch(`${API_URL}/api/chat/rooms/${roomId}/members`, { credentials: 'include' });
      if (r.ok) setMembers(await r.json());
    } catch {}
  }

  async function sendMessage(e) {
    e.preventDefault();
    if (!input.trim() || sending) return;
    setSending(true);
    const content = input;
    setInput('');
    try {
      const r = await fetch(`${API_URL}/api/chat/rooms/${roomId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ content }),
      });
      if (r.ok) {
        const newMsg = await r.json();
        setMessages(prev => [...prev, newMsg]);
        setIsAtBottom(true);
      } else {
        setInput(content);
      }
    } catch { setInput(content); }
    finally { setSending(false); }
  }

  function handleScroll() {
    const el = scrollRef.current;
    if (!el) return;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 60;
    setIsAtBottom(atBottom);
  }

  if (!room) return <ChatRoomLoading user={user} />;

  // Group messages by author run
  const groups = groupMessages(messages, user?.user_id);
  const activeUsers = (members || []).filter(m => m.is_online);

  return (
    <div className="h-screen bg-paper flex flex-col lg:pl-[240px]">
      <Navigation user={user} />

      <main className="flex-1 flex flex-col overflow-hidden pt-14 lg:pt-0">

        {/* HEADER */}
        <header className="border-b border-line bg-paper px-4 sm:px-6 lg:px-10 py-4 flex items-center gap-4">
          <button onClick={() => navigate('/chat')} className="text-ink-muted hover:text-ink lg:hidden">
            <ArrowLeft className="h-5 w-5" strokeWidth={1.5} />
          </button>
          <div className="h-10 w-10 rounded-lg bg-accent-soft flex items-center justify-center text-[20px] shrink-0">
            {room.icon || '💬'}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-body font-medium text-ink truncate">{room.name}</h1>
              {room.room_type === 'suburb' && <Pill color="support" size="xs">Local</Pill>}
              {room.room_type === 'friends_only' && <Pill color="neutral" size="xs">Private</Pill>}
            </div>
            <p className="text-micro text-ink-faint flex items-center gap-2">
              {activeUsers.length > 0 ? (
                <><LiveDot /> {activeUsers.length} online</>
              ) : (
                <>Quiet right now</>
              )}
              {room.suburb && (
                <>
                  <span className="text-ink-faint/60">·</span>
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="h-3 w-3" strokeWidth={1.5} />
                    {room.suburb}{room.state ? `, ${room.state}` : ''}
                  </span>
                </>
              )}
            </p>
          </div>
          <IconButton icon={Users} label="Members" />
          <IconButton icon={MoreHorizontal} label="Room options" />
        </header>

        {/* ONLINE STRIP */}
        {activeUsers.length > 0 && (
          <div className="border-b border-line-soft px-4 sm:px-6 lg:px-10 py-3 flex items-center gap-3 overflow-x-auto">
            <span className="font-mono text-eyebrow uppercase text-ink-faint shrink-0">Here now</span>
            {activeUsers.slice(0, 12).map(m => (
              <Link key={m.user_id} to={`/profile/${m.user_id}`} className="shrink-0 group">
                <div className="relative">
                  <Avatar name={m.name} src={m.picture} size="sm" />
                  <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-support border-2 border-paper" />
                </div>
                <p className="text-micro text-ink-faint group-hover:text-ink mt-1 text-center max-w-[60px] truncate">
                  {m.name?.split(' ')[0]}
                </p>
              </Link>
            ))}
          </div>
        )}

        {/* MESSAGE STREAM */}
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-10 py-6"
        >
          <div className="max-w-[760px] mx-auto space-y-6">
            {groups.length === 0 && (
              <div className="text-center py-20">
                <p className="font-display italic text-section text-ink mb-2">A quiet room.</p>
                <p className="text-body text-ink-muted">Say hi — see who's around.</p>
              </div>
            )}
            {groups.map((g, i) => <MessageGroup key={i} group={g} userId={user?.user_id} />)}
          </div>
        </div>

        {/* COMPOSER */}
        <form
          onSubmit={sendMessage}
          className="border-t border-line bg-paper px-4 sm:px-6 lg:px-10 py-4 shrink-0"
        >
          <div className="max-w-[760px] mx-auto flex items-end gap-3">
            <Avatar name={user?.name} src={user?.picture} size="sm" />
            <div className="flex-1 village-card flex items-end gap-2 px-4 py-2.5 focus-within:ring-1 focus-within:ring-accent/40">
              <textarea
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault(); sendMessage(e);
                  }
                }}
                placeholder="Say something kind…"
                rows={1}
                className="flex-1 bg-transparent text-body text-ink placeholder:text-ink-faint resize-none focus:outline-none max-h-32"
              />
              <button
                type="submit"
                disabled={!input.trim() || sending}
                className="h-9 w-9 rounded-full bg-button text-button-ink hover:bg-button-hover disabled:opacity-40 transition-colors flex items-center justify-center shrink-0"
                aria-label="Send"
              >
                <Send className="h-4 w-4" strokeWidth={1.5} />
              </button>
            </div>
          </div>
        </form>

      </main>
    </div>
  );
}

// ───────────── Local components ─────────────

function MessageGroup({ group, userId }) {
  const own = group.author_id === userId;
  const isAnon = group.is_anonymous;
  const fmt = (d) => { try { return format(new Date(d), 'h:mm a'); } catch { return ''; } };

  return (
    <div className={cn('flex gap-3', own && 'flex-row-reverse')}>
      {!own && (isAnon ? <Avatar name="?" size="sm" /> : (
        <Link to={`/profile/${group.author_id}`}>
          <Avatar name={group.author_name} src={group.author_picture} size="sm" />
        </Link>
      ))}
      <div className={cn('flex flex-col gap-1 max-w-[78%]', own && 'items-end')}>
        {!own && (
          <div className="flex items-baseline gap-2 px-1">
            {isAnon ? (
              <span className="text-body-sm italic text-ink-muted">Anonymous</span>
            ) : (
              <Link to={`/profile/${group.author_id}`} className="text-body-sm font-medium text-ink hover:text-accent">
                {group.author_name}
              </Link>
            )}
            <span className="font-mono text-eyebrow uppercase text-ink-faint">{fmt(group.first_at)}</span>
          </div>
        )}
        {group.messages.map((m, i) => (
          <div
            key={m.message_id}
            className={cn(
              'px-4 py-2.5 text-body leading-relaxed text-wrap-pretty',
              own
                ? 'bg-button text-button-ink rounded-2xl rounded-tr-md'
                : 'bg-card border border-line-soft text-ink rounded-2xl rounded-tl-md',
              i > 0 && (own ? 'rounded-tr-2xl' : 'rounded-tl-2xl')
            )}
          >
            {m.content}
          </div>
        ))}
        {own && (
          <span className="font-mono text-eyebrow uppercase text-ink-faint px-1">
            {fmt(group.first_at)}
          </span>
        )}
      </div>
    </div>
  );
}

function ChatRoomLoading({ user }) {
  return (
    <div className="h-screen bg-paper lg:pl-[240px]">
      <Navigation user={user} />
      <div className="flex items-center justify-center h-full">
        <p className="text-body text-ink-muted animate-pulse">Loading room…</p>
      </div>
    </div>
  );
}

// Group consecutive messages by same author within 4 mins
function groupMessages(messages, userId) {
  const out = [];
  for (const m of messages) {
    const last = out[out.length - 1];
    const sameAuthor = last && last.author_id === m.author_id && last.is_anonymous === m.is_anonymous;
    const closeInTime = last && (new Date(m.created_at) - new Date(last.last_at)) < 4 * 60 * 1000;
    if (sameAuthor && closeInTime) {
      last.messages.push(m);
      last.last_at = m.created_at;
    } else {
      out.push({
        author_id: m.author_id,
        author_name: m.author_name,
        author_picture: m.author_picture,
        is_anonymous: m.is_anonymous,
        first_at: m.created_at,
        last_at: m.created_at,
        messages: [m],
      });
    }
  }
  return out;
}
