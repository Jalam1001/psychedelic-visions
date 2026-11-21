import { createStore } from '../state/store';
import TRACK_LIST from './tracks.json';

/**
 * Recorded-soundtrack player — the DEFAULT sound path.
 * Plain HTMLAudioElements (no Web Audio): play() is called directly inside the tap handler, which is the most
 * reliable way to get sound on Android Chrome / stock browsers and iOS. Visual reactivity comes from a
 * pre-computed per-clip band envelope (bass/mid/high every 30 ms) read at audio.currentTime, so the elements
 * are never routed through createMediaElementSource (a suspended AudioContext would silence them).
 *
 * Gapless looping: each file is the loop (L seconds) plus a 3 s tail identical to its first 3 s. Two elements
 * alternate: when the active one passes L we start the other at (t − L) and cross-fade for 0.35 s. `loop=true`
 * stays on as a fallback if timers are throttled.
 */
export interface Track { id: string; title: string; desc: string; loop: number }
export const TRACKS = TRACK_LIST as Track[];
export const trackById = (id: string) => TRACKS.find((t) => t.id === id) ?? TRACKS[0];

/** Audio-preset id → soundtrack id */
export const PRESET_TRACK: Record<string, string> = {
  himalayan: 'himalayan-bowls', tanpura: 'tanpura-bansuri', amazon: 'amazon-night', cosmic: 'kaleido-bloom',
  sufi: 'sufi-ney-daf', persian: 'persian-garden', relax: 'deep-relaxation', harmonic: 'harmonic-choir',
  fractal: 'fractal-depths', golden: 'harmonic-choir', journey: 'cosmic-journey', insen: 'kaleido-bloom',
};

export type ClipState = 'idle' | 'loading' | 'playing' | 'blocked' | 'error';
export interface ClipStore { state: ClipState; trackId: string; volume: number; error: string | null; format: string }
const savedVol = (() => { try { return Number(localStorage.getItem('pv.vol') ?? '0.9'); } catch { return 0.9; } })();
export const clipStore = createStore<ClipStore>({ state: 'idle', trackId: 'kaleido-bloom', volume: isFinite(savedVol) ? savedVol : 0.9, error: null, format: '' });

interface Env { hop: number; frames: number; loop: number; bands: Uint8Array; beats: number[] }
const envCache = new Map<string, Env | 'loading'>();
function loadEnv(id: string) {
  if (envCache.has(id)) return;
  envCache.set(id, 'loading');
  fetch(`${import.meta.env.BASE_URL}audio/${id}.env.json`).then((r) => r.json()).then((j) => {
    const bin = atob(j.bands); const b = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) b[i] = bin.charCodeAt(i);
    envCache.set(id, { hop: j.hop, frames: j.frames, loop: j.loop, bands: b, beats: j.beats });
  }).catch(() => envCache.delete(id));
}

class ClipPlayer {
  private els: HTMLAudioElement[] = [];
  private cur = 0;
  private timer: number | undefined;
  private fade: { from: HTMLAudioElement | null; to: HTMLAudioElement; t0: number; dur: number; stopFrom: boolean } | null = null;
  private stopping = false;
  private lastT = 0;
  private ext = '';

  private pickExt() {
    if (this.ext) return this.ext;
    const a = document.createElement('audio');
    this.ext = a.canPlayType('audio/mp4; codecs="mp4a.40.2"') ? 'm4a' : a.canPlayType('audio/mpeg') ? 'mp3' : 'm4a';
    clipStore.set({ format: this.ext });
    return this.ext;
  }
  private el(i: number) {
    if (!this.els[i]) {
      const a = new Audio();
      a.preload = 'auto';
      a.loop = true;
      a.setAttribute('playsinline', '');
      a.setAttribute('webkit-playsinline', '');
      a.addEventListener('error', () => {
        // m4a not decodable here → fall back to mp3 once
        if (this.ext === 'm4a') { this.ext = 'mp3'; clipStore.set({ format: 'mp3' }); const tr = clipStore.get().trackId; if (clipStore.get().state !== 'idle') { this.load(a, tr); void a.play().catch(() => undefined); } }
        else clipStore.set({ state: 'error', error: 'Could not load the soundtrack file.' });
      });
      a.addEventListener('playing', () => { if (!this.stopping) clipStore.set({ state: 'playing', error: null }); });
      this.els[i] = a;
    }
    return this.els[i];
  }
  private url(id: string) { return `${import.meta.env.BASE_URL}audio/${id}.${this.pickExt()}`; }
  private load(a: HTMLAudioElement, id: string) {
    const u = this.url(id);
    if (!a.src.endsWith(u)) { a.src = u; a.dataset.track = id; }
  }

  /** Call synchronously from a tap/click handler. */
  play(trackId = clipStore.get().trackId) {
    this.stopping = false;
    loadEnv(trackId);
    const prev = clipStore.get().trackId;
    clipStore.set({ trackId, state: clipStore.get().state === 'playing' ? 'playing' : 'loading' });
    const a = this.el(this.cur);
    const b = this.el(1 - this.cur);
    const vol = clipStore.get().volume;
    if (!a.paused && a.dataset.track === trackId) { a.volume = vol; return; }
    if (!a.paused && prev !== trackId) {
      // cross-fade into a new track on the idle element
      this.load(b, trackId); b.currentTime = 0; b.volume = 0;
      const p = b.play();
      p?.catch((e) => this.blocked(e));
      this.fade = { from: a, to: b, t0: performance.now(), dur: 1200, stopFrom: true };
      this.cur = 1 - this.cur;
    } else {
      this.load(a, trackId);
      if (a.dataset.track !== trackId) a.currentTime = 0;
      a.volume = vol;
      const p = a.play();               // ← direct play() inside the gesture
      p?.catch((e) => this.blocked(e));
      // prime the partner element in the same gesture (needed on iOS for the gapless swap later)
      this.load(b, trackId);
      b.muted = true;
      b.play()?.then(() => { if (this.els[this.cur] !== b) { b.pause(); b.currentTime = 0; } b.muted = false; }).catch(() => { b.muted = false; });
    }
    this.ensureTimer();
  }
  private blocked(e: unknown) {
    const name = (e as { name?: string })?.name;
    if (name === 'AbortError') return;     // superseded by another load — harmless
    clipStore.set({ state: name === 'NotAllowedError' ? 'blocked' : 'error', error: String(e) });
  }
  stop() {
    this.stopping = true;
    const a = this.els[this.cur];
    if (a && !a.paused) this.fade = { from: a, to: a, t0: performance.now(), dur: 500, stopFrom: true };
    else this.els.forEach((x) => x.pause());
    clipStore.set({ state: 'idle' });
  }
  setVolume(v: number) {
    clipStore.set({ volume: v });
    try { localStorage.setItem('pv.vol', String(v)); } catch { /* ignore */ }
    if (!this.fade) { const a = this.els[this.cur]; if (a) a.volume = v; }
  }
  private ensureTimer() {
    if (this.timer) return;
    this.timer = window.setInterval(() => this.tick(), 50);
  }
  private tick() {
    const vol = clipStore.get().volume;
    const now = performance.now();
    if (this.fade) {
      const f = this.fade; const k = Math.min(1, (now - f.t0) / f.dur);
      if (f.from === f.to) { f.from.volume = vol * (1 - k); if (k >= 1) { this.els.forEach((x) => x.pause()); this.fade = null; } }
      else {
        f.to.volume = vol * k; if (f.from) f.from.volume = vol * (1 - k);
        if (k >= 1) { if (f.from && f.stopFrom) f.from.pause(); f.to.volume = vol; this.fade = null; }
      }
    }
    if (this.stopping) return;
    const a = this.els[this.cur]; if (!a || a.paused) return;
    const tr = trackById(a.dataset.track ?? '');
    if (!this.fade && a.currentTime >= tr.loop && a.currentTime < tr.loop + 2.8) {
      const b = this.el(1 - this.cur);
      this.load(b, tr.id);
      b.currentTime = a.currentTime - tr.loop;
      b.volume = 0;
      void b.play().catch(() => undefined);
      this.fade = { from: a, to: b, t0: now, dur: 350, stopFrom: true };
      this.cur = 1 - this.cur;
    }
  }
  get active() { const a = this.els[this.cur]; return !!a && !a.paused && !this.stopping; }
  /** Position inside the loop, seconds. */
  position() { const a = this.els[this.cur]; if (!a) return 0; const tr = trackById(a.dataset.track ?? ''); return a.currentTime % tr.loop; }
  /** Pre-computed band levels (0..1) at the current playback position, plus whether a beat passed since last call. */
  sample(): { bass: number; mid: number; high: number; beat: boolean } | null {
    const a = this.els[this.cur]; if (!a || a.paused) return null;
    const env = envCache.get(a.dataset.track ?? '');
    if (!env || env === 'loading') return null;
    const t = this.position();
    const i = Math.min(env.frames - 1, Math.floor(t / env.hop)) * 3;
    const b = env.bands;
    let beat = false;
    const last = this.lastT; this.lastT = t;
    if (t >= last && t - last < 0.5) { for (const bt of env.beats) if (bt > last && bt <= t) { beat = true; break; } }
    return { bass: b[i] / 255, mid: b[i + 1] / 255, high: b[i + 2] / 255, beat };
  }
  debug() { return this.els.map((e) => ({ paused: e.paused, t: e.currentTime, src: e.currentSrc, vol: e.volume, ready: e.readyState })); }
}

export const clips = new ClipPlayer();
