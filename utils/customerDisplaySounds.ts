/**
 * Customer Display — Sound effects
 * Uses Web Audio API to synthesize sounds on-the-fly.
 * No external files needed. Works on all modern browsers.
 *
 * Sounds:
 *  - addItem: pleasant "cha-ching" bell (cart item added)
 *  - removeItem: soft click
 *  - promoChange: cheerful "ta-da" sweep
 *  - tap: button tap
 */

const KEY_MUTED = 'mhxpos_customer_display_muted';

let _ctx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (_ctx) return _ctx;
  try {
    const Ctor = window.AudioContext || (window as any).webkitAudioContext;
    if (!Ctor) return null;
    _ctx = new Ctor();
  } catch {
    return null;
  }
  return _ctx;
}

/** Call this on first user interaction to unlock audio on iOS Safari */
export function unlockAudio() {
  const ctx = getCtx();
  if (ctx && ctx.state === 'suspended') {
    ctx.resume().catch(() => {});
  }
}

export function isMuted(): boolean {
  try { return localStorage.getItem(KEY_MUTED) === '1'; } catch { return false; }
}

export function setMuted(m: boolean) {
  try { localStorage.setItem(KEY_MUTED, m ? '1' : '0'); } catch {}
}

interface ToneSpec {
  freq: number;       // Hz
  duration: number;   // seconds
  type?: OscillatorType;
  attack?: number;
  release?: number;
  volume?: number;    // 0..1
  startAt?: number;   // offset in seconds from now
}

function playTones(tones: ToneSpec[]) {
  if (isMuted()) return;
  const ctx = getCtx();
  if (!ctx) return;
  if (ctx.state === 'suspended') ctx.resume().catch(() => {});

  const master = ctx.createGain();
  master.gain.value = 0.6;
  master.connect(ctx.destination);

  const now = ctx.currentTime;

  for (const t of tones) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = t.type ?? 'sine';
    osc.frequency.setValueAtTime(t.freq, now + (t.startAt ?? 0));

    const vol = t.volume ?? 0.5;
    const att = t.attack ?? 0.005;
    const rel = t.release ?? 0.05;
    const dur = t.duration;
    const t0 = now + (t.startAt ?? 0);

    gain.gain.setValueAtTime(0, t0);
    gain.gain.linearRampToValueAtTime(vol, t0 + att);
    gain.gain.setValueAtTime(vol, t0 + dur - rel);
    gain.gain.linearRampToValueAtTime(0, t0 + dur);

    osc.connect(gain);
    gain.connect(master);
    osc.start(t0);
    osc.stop(t0 + dur + 0.01);
  }
}

/** Pleasant "cha-ching" — C5 then E5 then G5 (C major chord arpeggio) */
export function playAddItem() {
  playTones([
    { freq: 523.25, duration: 0.10, type: 'sine', volume: 0.45, startAt: 0 },
    { freq: 659.25, duration: 0.10, type: 'sine', volume: 0.40, startAt: 0.08 },
    { freq: 783.99, duration: 0.18, type: 'sine', volume: 0.35, startAt: 0.16 },
    { freq: 1046.5, duration: 0.18, type: 'sine', volume: 0.25, startAt: 0.24 },
  ]);
}

/** Soft removal click */
export function playRemoveItem() {
  playTones([
    { freq: 440, duration: 0.06, type: 'triangle', volume: 0.3 },
  ]);
}

/** Promo carousel "ta-da" — ascending major sweep */
export function playPromoChange() {
  playTones([
    { freq: 392, duration: 0.10, type: 'sine', volume: 0.4, startAt: 0 },
    { freq: 523.25, duration: 0.10, type: 'sine', volume: 0.4, startAt: 0.08 },
    { freq: 659.25, duration: 0.10, type: 'sine', volume: 0.4, startAt: 0.16 },
    { freq: 783.99, duration: 0.10, type: 'sine', volume: 0.4, startAt: 0.24 },
    { freq: 1046.5, duration: 0.30, type: 'sine', volume: 0.4, startAt: 0.32 },
  ]);
}

/** Light tap for buttons */
export function playTap() {
  playTones([
    { freq: 800, duration: 0.04, type: 'square', volume: 0.2 },
  ]);
}
