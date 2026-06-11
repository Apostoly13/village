// Shared chime utility — generated with Web Audio, no asset files.
// Respects device-local prefs in localStorage ("village_prefs"):
//   messageSounds      !== false → message chime allowed (default on)
//   notificationSounds !== false → notification chime allowed (default on)

const PREFS_KEY = "village_prefs";

let ctx = null;
const lastPlayed = {};

function getCtx() {
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  if (!ctx) ctx = new AC();
  // Browsers suspend audio until the first user gesture — resume quietly
  if (ctx.state === "suspended") ctx.resume().catch(() => {});
  return ctx;
}

function prefs() {
  try { return JSON.parse(localStorage.getItem(PREFS_KEY) || "{}"); }
  catch { return {}; }
}

function tone(c, freq, start, dur, peak) {
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.connect(gain);
  gain.connect(c.destination);
  osc.type = "sine";
  osc.frequency.value = freq;
  // exponentialRamp cannot start from 0 — use a near-zero floor
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(peak, start + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + dur);
  osc.start(start);
  osc.stop(start + dur + 0.05);
}

// kind: "message" | "notification". force bypasses prefs + debounce (settings preview).
export function playChime(kind = "notification", { force = false } = {}) {
  if (!force) {
    const p = prefs();
    if (kind === "message" && p.messageSounds === false) return;
    if (kind === "notification" && p.notificationSounds === false) return;
    // Several pollers can detect the same event — only chime once per burst
    const now = Date.now();
    if (lastPlayed[kind] && now - lastPlayed[kind] < 1500) return;
    lastPlayed[kind] = now;
  }
  try {
    const c = getCtx();
    if (!c) return;
    const t = c.currentTime;
    if (kind === "message") {
      // Gentle rising two-note (E5 → A5)
      tone(c, 659.25, t, 0.28, 0.08);
      tone(c, 880, t + 0.11, 0.34, 0.07);
    } else {
      // Single warm note with a soft octave shimmer, slightly quieter
      tone(c, 880, t, 0.3, 0.06);
      tone(c, 1318.5, t + 0.04, 0.22, 0.025);
    }
  } catch {}
}
