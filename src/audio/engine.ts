import * as Tone from 'tone';
import { createStore } from '../state/store';
import { AUDIO_PRESETS, AudioParams, DEFAULT_AUDIO, NatureType, PadTimbre } from './presets';
import { SCALES, degreeToFreq } from './scales';

export type MusicEvent = { type: 'beat' | 'chord' | 'bowl'; strength: number; index: number };
export type BeatMode = 'off' | 'binaural' | 'monaural' | 'isochronic';

export interface LabState {
  toneOn: boolean;
  freq: number;
  wave: 'sine' | 'triangle' | 'square' | 'sawtooth';
  harmonics: number;
  level: number;
  beatMode: BeatMode;
  beatHz: number;
  carrier: number;
  beatLevel: number;
}

export type CtxState = 'not-created' | 'suspended' | 'running' | 'interrupted' | 'closed';

export interface AudioState {
  running: boolean;     // user wants music on
  muted: boolean;
  ready: boolean;       // graph built
  ctxState: CtxState;   // actual AudioContext state
  presetId: string;
  params: AudioParams;
  lab: LabState;
  error: string | null;
}

export const DEFAULT_LAB: LabState = {
  toneOn: false, freq: 220, wave: 'sine', harmonics: 1, level: 0.5,
  beatMode: 'off', beatHz: 6, carrier: 200, beatLevel: 0.5,
};

export const audioStore = createStore<AudioState>({
  running: false, muted: false, ready: false, ctxState: 'not-created', presetId: 'cosmic',
  params: { ...DEFAULT_AUDIO }, lab: { ...DEFAULT_LAB }, error: null,
});

/*
 * ONE AudioContext for the whole app, created up-front with a playback latency hint
 * (fewer crackles on Android). It starts "suspended" until a user gesture resumes it.
 */
let ctxReady = false;
function trackState() {
  const raw = Tone.getContext().rawContext as unknown as AudioContext;
  const sync = () => audioStore.set({ ctxState: (raw.state as CtxState) ?? 'suspended' });
  sync();
  try { raw.addEventListener('statechange', sync); } catch { /* old browsers */ }
}
/**
 * Creates the synth's AudioContext. Must run inside a user gesture: a brand-new native AudioContext is created
 * and resumed right in the tap — exactly like the Test-sound beep, which is proven to work on Android — and
 * handed to Tone. (v2 created Tone's context at page load and resumed it later; on some Android devices that
 * pre-created context stayed silent.)
 */
function ensureContext() {
  if (ctxReady) return;
  ctxReady = true;
  try {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const raw = new AC({ latencyHint: 'interactive' });
    void raw.resume();
    Tone.setContext(new Tone.Context(raw as unknown as AudioContext));
  } catch (e) {
    console.warn('[audio] fresh context failed, using Tone default', e);
  }
  trackState();
}

let silentEl: HTMLAudioElement | null = null;
/**
 * MUST be called synchronously inside a user-gesture handler (click / pointerup / keydown),
 * before any `await`. Resumes the shared context and works around iOS's ring/silent switch.
 */
export function unlockAudio() {
  ensureContext();
  try {
    // iOS 16.4+: treat Web Audio as media playback so the silent switch doesn't mute it
    const nav = navigator as Navigator & { audioSession?: { type: string } };
    if (nav.audioSession) nav.audioSession.type = 'playback';
  } catch { /* ignore */ }
  try {
    const raw = Tone.getContext().rawContext as unknown as AudioContext;
    if (raw.state !== 'running') void raw.resume();
    // play one silent sample — the classic Safari unlock
    const b = raw.createBuffer(1, 1, raw.sampleRate);
    const src = raw.createBufferSource();
    src.buffer = b; src.connect(raw.destination); src.start(0);
  } catch (e) { console.warn('[audio] unlock', e); }
  void Tone.start().catch(() => undefined);
  if (/iPhone|iPad|iPod/i.test(navigator.userAgent) && !silentEl) {
    // iOS only: a looping silent <audio> element keeps the "playback" audio session (ignores the mute switch)
    silentEl = new Audio('data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=');
    silentEl.loop = true;
    silentEl.setAttribute('playsinline', '');
    void silentEl.play().catch(() => undefined);
  }
}

/** Independent diagnostic beep on a brand-new native AudioContext (bypasses Tone and the app graph). */
export function testBeep(): Promise<string> {
  const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  if (!AC) return Promise.resolve('Web Audio is not supported in this browser.');
  const ctx = new AC();
  const resumed = ctx.resume();
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.value = 660;
  const t = ctx.currentTime + 0.02;
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(0.35, t + 0.03);
  g.gain.setValueAtTime(0.35, t + 0.45);
  g.gain.linearRampToValueAtTime(0, t + 0.6);
  osc.frequency.setValueAtTime(660, t);
  osc.frequency.setValueAtTime(880, t + 0.3);
  osc.connect(g).connect(ctx.destination);
  osc.start(t); osc.stop(t + 0.65);
  return resumed.then(() => new Promise<string>((res) => setTimeout(() => {
    const st = ctx.state;
    void ctx.close();
    res(st === 'running' ? 'Beep played. Heard nothing? Press your phone’s volume-up key while sound is playing (Android media volume is separate from ringer volume), check the silent switch, Bluetooth, and the browser’s site sound setting.' : `Browser kept audio ${st}. Tap again or check site sound permissions.`);
  }, 800)), (e) => `Could not start audio: ${e}`);
}

const PAD_TYPES: Record<PadTimbre, string> = { warm: 'fattriangle', glass: 'fatsine', choir: 'fatsawtooth', string: 'fatsawtooth' };
const PAD_CUTOFF: Record<PadTimbre, number> = { warm: 2200, glass: 3200, choir: 1600, string: 2400 };
const DRONE_TYPES: Record<PadTimbre, 'sine' | 'triangle' | 'sawtooth'> = { warm: 'triangle', glass: 'sine', choir: 'triangle', string: 'sawtooth' };
const DRONE_RATIOS = [1, 1.5, 2, 3];
const DRONE_LEVELS = [0.5, 0.32, 0.3, 0.12];

/**
 * Generative music engine. Signal flow:
 *   instruments → music bus → widener → reverb(+dry) → master → compressor → makeup → limiter(−1 dB) → speakers
 *   binaural / lab tones → master (dry)            limiter → FFT + waveform analysers (audio-visual sync)
 */
class AudioEngine {
  private built = false;
  private listeners = new Set<(e: MusicEvent) => void>();
  fft!: Tone.FFT;
  wave!: Tone.Waveform;
  private master!: Tone.Gain;
  private bus!: Tone.Gain;
  private widener!: Tone.StereoWidener;
  private reverb!: Tone.Reverb;
  private droneGain!: Tone.Gain; private droneFilter!: Tone.Filter;
  private drones: Tone.FatOscillator[] = [];
  private padGain!: Tone.Gain; private padFilter!: Tone.Filter; private pad!: Tone.PolySynth;
  private melody!: Tone.Synth; private melodyGain!: Tone.Gain;
  private bowlGain!: Tone.Gain; private bowl!: Tone.PolySynth;
  private percGain!: Tone.Gain; private drum!: Tone.MembraneSynth; private tabla!: Tone.MembraneSynth; private shaker!: Tone.NoiseSynth;
  private natureGain!: Tone.Gain; private noise!: Tone.Noise; private natureFilter!: Tone.Filter; private natureAuto!: Tone.AutoFilter;
  private cricketGain!: Tone.Gain;
  private binGain!: Tone.Gain; private binL!: Tone.Oscillator; private binR!: Tone.Oscillator;
  private labGain!: Tone.Gain; private labOsc!: Tone.Oscillator;
  private monoGain!: Tone.Gain; private monoA!: Tone.Oscillator; private monoB!: Tone.Oscillator;
  private isoGain!: Tone.Gain; private isoOsc!: Tone.Oscillator; private isoTrem!: Tone.Tremolo;
  private chordIdx = 0;
  private melodyDeg = 7;
  private stopTimer: number | undefined;
  private timbre: PadTimbre | null = null;
  private natureType: NatureType | null = null;

  on(fn: (e: MusicEvent) => void) { this.listeners.add(fn); return () => { this.listeners.delete(fn); }; }
  private emit(e: MusicEvent, time: number) {
    Tone.getDraw().schedule(() => this.listeners.forEach((f) => f(e)), time);
  }

  /** Builds the whole graph synchronously (no awaits) so sound can begin in the same gesture. */
  private build() {
    if (this.built) return;
    ensureContext();
    this.master = new Tone.Gain(0);
    const comp = new Tone.Compressor({ threshold: -18, ratio: 3, attack: 0.03, release: 0.3 });
    const makeup = new Tone.Gain(2.0);
    const limiter = new Tone.Limiter(-1);
    this.master.chain(comp, makeup, limiter, Tone.getDestination());
    Tone.getDestination().volume.value = 0;
    Tone.getDestination().mute = false;
    this.fft = new Tone.FFT({ size: 1024, smoothing: 0.7 });
    this.wave = new Tone.Waveform(1024);
    limiter.connect(this.fft);
    limiter.connect(this.wave);

    // Reverb renders its impulse response asynchronously; until then its dry path still sounds.
    this.reverb = new Tone.Reverb({ decay: 5, preDelay: 0.03, wet: 0.4 });
    this.reverb.connect(this.master);
    this.widener = new Tone.StereoWidener(0.6).connect(this.reverb);
    this.bus = new Tone.Gain(1).connect(this.widener);

    // Drone: root, fifth, octave, twelfth — audible on phone speakers, gently breathing filter
    this.droneFilter = new Tone.Filter({ type: 'lowpass', frequency: 1400, Q: 0.6 }).connect(this.bus);
    this.droneGain = new Tone.Gain(0).connect(this.droneFilter);
    new Tone.LFO({ frequency: 0.07, min: 700, max: 2600 }).connect(this.droneFilter.frequency).start();
    DRONE_RATIOS.forEach((r, i) => {
      const g = new Tone.Gain(DRONE_LEVELS[i]).connect(this.droneGain);
      const o = new Tone.FatOscillator({ frequency: 110 * r, type: 'triangle', spread: 12 + i * 4, count: 2 }).connect(g);
      o.start();
      this.drones.push(o);
    });

    // Pad
    const chorus = new Tone.Chorus({ frequency: 0.4, delayTime: 3.5, depth: 0.5, wet: 0.35 }).start();
    this.padFilter = new Tone.Filter({ type: 'lowpass', frequency: 2200, Q: 0.4 });
    this.padGain = new Tone.Gain(0);
    this.padGain.chain(this.padFilter, chorus, this.bus);
    this.pad = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: 'fattriangle', count: 2, spread: 18 } as never,
      envelope: { attack: 1.2, decay: 1.5, sustain: 0.75, release: 3.5 },
      volume: -9,
    }).connect(this.padGain);
    this.pad.maxPolyphony = 16;

    // Melody with dotted-eighth echo
    const echo = new Tone.FeedbackDelay({ delayTime: '8n.', feedback: 0.3, wet: 0.25 }).connect(this.bus);
    this.melodyGain = new Tone.Gain(0).connect(echo);
    this.melody = new Tone.Synth({ oscillator: { type: 'triangle' }, envelope: { attack: 0.01, decay: 0.9, sustain: 0.1, release: 1.4 }, volume: -10 }).connect(this.melodyGain);

    // Singing-bowl-like voice
    this.bowlGain = new Tone.Gain(0).connect(this.bus);
    this.bowl = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: 'sine' }, envelope: { attack: 0.005, decay: 4, sustain: 0, release: 1.5 }, volume: -9,
    }).connect(this.bowlGain);
    this.bowl.maxPolyphony = 32;

    // Soft percussion: frame drum, tabla-like high drum, shaker
    this.percGain = new Tone.Gain(0).connect(this.bus);
    const percFilter = new Tone.Filter({ type: 'lowpass', frequency: 2400 }).connect(this.percGain);
    this.drum = new Tone.MembraneSynth({ pitchDecay: 0.04, octaves: 2, envelope: { attack: 0.002, decay: 0.45, sustain: 0, release: 0.2 }, volume: -6 }).connect(percFilter);
    this.tabla = new Tone.MembraneSynth({ pitchDecay: 0.02, octaves: 1.5, envelope: { attack: 0.001, decay: 0.25, sustain: 0, release: 0.1 }, volume: -10 }).connect(percFilter);
    const shakerFilter = new Tone.Filter({ type: 'highpass', frequency: 5000 }).connect(this.percGain);
    this.shaker = new Tone.NoiseSynth({ noise: { type: 'pink' }, envelope: { attack: 0.003, decay: 0.06, sustain: 0 }, volume: -22 }).connect(shakerFilter);

    // Nature beds
    this.natureGain = new Tone.Gain(0).connect(this.widener);
    this.natureAuto = new Tone.AutoFilter({ frequency: 0.07, depth: 0.8, baseFrequency: 200, octaves: 3 }).connect(this.natureGain).start();
    this.natureFilter = new Tone.Filter({ type: 'lowpass', frequency: 1200 }).connect(this.natureAuto);
    this.noise = new Tone.Noise('pink').connect(this.natureFilter);
    this.noise.start();
    this.cricketGain = new Tone.Gain(0).connect(this.natureGain);
    const t2 = new Tone.Tremolo({ frequency: 0.6, depth: 0.95 }).connect(this.cricketGain).start();
    const t1 = new Tone.Tremolo({ frequency: 27, depth: 1 }).connect(t2).start();
    new Tone.Oscillator(4300, 'sine').connect(t1).start();

    // Binaural (dry, hard-panned)
    this.binGain = new Tone.Gain(0).connect(this.master);
    this.binL = new Tone.Oscillator(200, 'sine').connect(new Tone.Panner(-1).connect(this.binGain));
    this.binR = new Tone.Oscillator(206, 'sine').connect(new Tone.Panner(1).connect(this.binGain));
    this.binL.start(); this.binR.start();

    // Lab
    this.labGain = new Tone.Gain(0).connect(this.master);
    this.labOsc = new Tone.Oscillator(220, 'sine').connect(this.labGain);
    this.labOsc.start();
    this.monoGain = new Tone.Gain(0).connect(this.master);
    this.monoA = new Tone.Oscillator(200, 'sine').connect(this.monoGain);
    this.monoB = new Tone.Oscillator(206, 'sine').connect(this.monoGain);
    this.monoA.start(); this.monoB.start();
    this.isoGain = new Tone.Gain(0).connect(this.master);
    this.isoTrem = new Tone.Tremolo({ frequency: 6, depth: 1, spread: 0 }).connect(this.isoGain).start();
    this.isoOsc = new Tone.Oscillator(200, 'sine').connect(this.isoTrem);
    this.isoOsc.start();

    this.schedule();
    this.built = true;
    audioStore.set({ ready: true });
    this.reverb.ready.catch((e) => console.warn('[audio] reverb IR failed; continuing dry', e));
  }

  private steps() { const p = audioStore.get().params; return SCALES[p.scale]?.steps ?? SCALES.majorPent.steps; }

  private schedule() {
    const T = Tone.getTransport();
    // Chords: every bar (brisker harmonic rhythm), voiced around 2×root
    new Tone.Loop((time) => {
      const p = audioStore.get().params;
      const steps = this.steps();
      const deg = p.progression[this.chordIdx % p.progression.length];
      const n = steps.length;
      const notes = [deg, deg + 2, deg + 4, deg + (n >= 7 ? 6 : 5)].map((d) => degreeToFreq(p.root * 2, steps, d));
      notes.unshift(degreeToFreq(p.root, steps, deg)); // bass note
      if (p.pad > 0.001) this.pad.triggerAttackRelease(notes, T.toSeconds('1m') * 0.95, time, 0.55);
      this.emit({ type: 'chord', strength: 1, index: this.chordIdx }, time);
      this.chordIdx++;
    }, '1m').start(0);

    // Melody: eighth-note grid, phrase-shaped random walk over the scale
    let mStep = 0;
    new Tone.Loop((time) => {
      const p = audioStore.get().params;
      const s = mStep++ % 16;
      const prob = s % 4 === 0 ? 0.7 : s % 2 === 0 ? 0.35 : 0.12;
      if (p.pad < 0.05 || Math.random() > prob) return;
      const steps = this.steps();
      this.melodyDeg += Math.round((Math.random() - 0.5) * 3);
      this.melodyDeg = Math.max(steps.length, Math.min(steps.length * 3, this.melodyDeg));
      this.melody.triggerAttackRelease(degreeToFreq(p.root * 2, steps, this.melodyDeg), '8n', time, 0.5 + Math.random() * 0.4);
      this.emit({ type: 'beat', strength: 0.3, index: s }, time);
    }, '8n').start('1m');

    // Singing bowls: every half bar with probability
    new Tone.Loop((time) => {
      const p = audioStore.get().params;
      if (p.bowl < 0.01 || Math.random() > 0.25 + p.bowl * 0.45) return;
      const steps = this.steps();
      const f = degreeToFreq(p.root * 4, steps, Math.floor(Math.random() * steps.length));
      this.strike(f, time, 0.9);
      this.emit({ type: 'bowl', strength: 0.9, index: 0 }, time);
    }, '2n').start('4n');

    // Percussion: 16-step pattern, frame drum + tabla-like + shaker
    const drumPat = [1, 0, 0, 0.3, 0, 0, 0.8, 0, 0.9, 0, 0.2, 0, 0, 0.4, 0, 0.2];
    const tablaPat = [0, 0, 0.6, 0, 0.5, 0, 0, 0.5, 0, 0.3, 0.7, 0, 0.5, 0, 0.6, 0];
    let step = 0;
    new Tone.Loop((time) => {
      const p = audioStore.get().params;
      const s = step++ % 16;
      if (p.perc < 0.01) return;
      const steps = this.steps();
      if (Math.random() < drumPat[s]) {
        this.drum.triggerAttackRelease(p.root, '8n', time, s === 0 ? 0.9 : 0.55);
        this.emit({ type: 'beat', strength: s === 0 ? 1 : 0.6, index: s }, time);
      }
      if (Math.random() < tablaPat[s]) this.tabla.triggerAttackRelease(degreeToFreq(p.root * 2, steps, s % 3 === 0 ? 4 : 0), '16n', time, 0.5);
      if (Math.random() < 0.45) this.shaker.triggerAttackRelease('32n', time, 0.25 + Math.random() * 0.35);
    }, '16n').start(0);
  }

  private strike(f: number, time: number, vel: number) {
    const partials = [1, 2.76, 5.4];
    const vels = [0.9, 0.35, 0.12];
    partials.forEach((r, i) => this.bowl.triggerAttackRelease(f * r, 4, time, vels[i] * vel));
    this.bowl.triggerAttackRelease(f * 1.004, 4, time, 0.45 * vel); // slow, gentle beating
  }

  /** Start music. Safe to call directly from a click handler: everything before the first await is synchronous. */
  async start() {
    unlockAudio();
    try {
      this.build();
      window.clearTimeout(this.stopTimer);
      audioStore.set({ running: true, error: null });
      const T = Tone.getTransport();
      if (T.state !== 'started') T.start('+0.05');
      this.apply(audioStore.get().params, true);
      this.applyLab(audioStore.get().lab);
      await Tone.start();
    } catch (e) {
      console.error('[audio] start failed', e);
      audioStore.set({ error: String(e) });
    }
  }

  stop() {
    audioStore.set({ running: false });
    if (!this.built) return;
    this.master.gain.rampTo(0, 0.8);
    this.stopTimer = window.setTimeout(() => { if (!audioStore.get().running) Tone.getTransport().pause(); }, 1000);
  }

  toggle() { return audioStore.get().running ? this.stop() : this.start(); }

  setMuted(m: boolean) { audioStore.set({ muted: m }); this.apply(audioStore.get().params); }

  loadPreset(id: string) {
    const p = AUDIO_PRESETS[id];
    if (!p) return;
    audioStore.set({ presetId: id, params: { ...p } });
    this.apply(audioStore.get().params);
  }

  setParams(patch: Partial<AudioParams>) {
    audioStore.set((s) => ({ params: { ...s.params, ...patch }, presetId: 'custom' }));
    this.apply(audioStore.get().params);
  }

  setLab(patch: Partial<LabState>) {
    audioStore.set((s) => ({ lab: { ...s.lab, ...patch } }));
    if (this.built) this.applyLab(audioStore.get().lab);
  }

  apply(p: AudioParams, fadeIn = false) {
    if (!this.built) return;
    const { running, muted } = audioStore.get();
    const ramp = 0.6;
    const vol = running && !muted ? Math.min(1, p.volume) : 0;
    this.master.gain.rampTo(vol, fadeIn ? 1.0 : 0.3);
    Tone.getTransport().bpm.rampTo(p.tempo, 1.5);
    this.reverb.wet.rampTo(p.reverb * 0.75, ramp);
    this.widener.width.rampTo(p.width, ramp);
    this.droneGain.gain.rampTo(p.drone * 0.32, ramp);
    this.padGain.gain.rampTo(p.pad * 0.9, ramp);
    this.melodyGain.gain.rampTo(p.pad * 0.7, ramp);
    this.bowlGain.gain.rampTo(p.bowl * 0.8, ramp);
    this.percGain.gain.rampTo(p.perc * 0.9, ramp);
    const lab = audioStore.get().lab;
    if (lab.beatMode !== 'binaural') {
      this.binGain.gain.rampTo(p.binaural * 0.15, ramp);
      this.binL.frequency.rampTo(p.carrier, ramp);
      this.binR.frequency.rampTo(p.carrier + p.beatHz, ramp);
    }
    this.drones.forEach((o, i) => o.frequency.rampTo(p.root * DRONE_RATIOS[i], 2));
    if (this.timbre !== p.timbre) {
      this.timbre = p.timbre;
      this.drones.forEach((o) => { o.type = DRONE_TYPES[p.timbre]; });
      this.pad.set({ oscillator: { type: PAD_TYPES[p.timbre] } as never });
      this.padFilter.frequency.rampTo(PAD_CUTOFF[p.timbre], ramp);
    }
    this.setNature(p.natureType, p.nature);
  }

  private setNature(type: NatureType, level: number) {
    this.natureGain.gain.rampTo(type === 'none' ? 0 : level * 0.5, 1.2);
    if (type === this.natureType) return;
    this.natureType = type;
    const n = this.noise, f = this.natureFilter, a = this.natureAuto;
    this.cricketGain.gain.rampTo(type === 'night' ? 0.05 : 0, 1.5);
    switch (type) {
      case 'wind': n.type = 'pink'; f.type = 'lowpass'; f.frequency.rampTo(1400, 1); a.frequency.rampTo(0.08, 1); a.depth.rampTo(0.85, 1); a.baseFrequency = 200; break;
      case 'rain': n.type = 'white'; f.type = 'bandpass'; f.frequency.rampTo(3000, 1); f.Q.value = 0.4; a.frequency.rampTo(0.25, 1); a.depth.rampTo(0.2, 1); a.baseFrequency = 1500; break;
      case 'stream': n.type = 'pink'; f.type = 'bandpass'; f.frequency.rampTo(1000, 1); f.Q.value = 0.9; a.frequency.rampTo(0.9, 1); a.depth.rampTo(0.5, 1); a.baseFrequency = 500; break;
      case 'night': n.type = 'brown'; f.type = 'lowpass'; f.frequency.rampTo(700, 1); a.frequency.rampTo(0.05, 1); a.depth.rampTo(0.6, 1); a.baseFrequency = 150; break;
      default: break;
    }
  }

  applyLab(l: LabState) {
    if (!this.built) return;
    const r = 0.2;
    if (l.wave === 'sine' && l.harmonics > 1) this.labOsc.partials = Array.from({ length: Math.round(l.harmonics) }, (_, i) => 1 / (i + 1));
    else this.labOsc.type = l.wave;
    this.labOsc.frequency.rampTo(l.freq, 0.1);
    this.labGain.gain.rampTo(l.toneOn ? l.level * 0.35 : 0, r);
    const bl = l.beatLevel * 0.3;
    if (l.beatMode === 'binaural') { this.binGain.gain.rampTo(bl, r); this.binL.frequency.rampTo(l.carrier, r); this.binR.frequency.rampTo(l.carrier + l.beatHz, r); }
    else this.binGain.gain.rampTo(audioStore.get().params.binaural * 0.15, r);
    this.monoGain.gain.rampTo(l.beatMode === 'monaural' ? bl * 0.6 : 0, r);
    this.monoA.frequency.rampTo(l.carrier, r); this.monoB.frequency.rampTo(l.carrier + l.beatHz, r);
    this.isoGain.gain.rampTo(l.beatMode === 'isochronic' ? bl : 0, r);
    this.isoOsc.frequency.rampTo(l.carrier, r); this.isoTrem.frequency.rampTo(l.beatHz, r);
  }

  playScale(scale: string, root: number) {
    if (!this.built) return;
    const steps = SCALES[scale]?.steps ?? SCALES.majorPent.steps;
    const now = Tone.now();
    for (let i = 0; i <= steps.length; i++) this.melody.triggerAttackRelease(degreeToFreq(root, steps, i), 0.3, now + i * 0.32, 0.8);
  }

  strikeBowl(freq = 220) {
    if (!this.built) return;
    this.strike(freq * 2, Tone.now() + 0.01, 1);
    this.listeners.forEach((f) => f({ type: 'bowl', strength: 1, index: 0 }));
  }

  /** RMS of the post-limiter output (0..1) — used by the status indicator and automated tests. */
  rms(): number {
    if (!this.built) return 0;
    const v = this.wave.getValue() as Float32Array;
    let s = 0;
    for (let i = 0; i < v.length; i++) s += v[i] * v[i];
    return Math.sqrt(s / v.length);
  }

  get sampleRate() { return Tone.getContext().sampleRate; }
  get isBuilt() { return this.built; }
}

export const audio = new AudioEngine();

/* ---- global lifecycle: unlock on first gesture anywhere, recover after tab switches / interruptions ---- */
if (typeof window !== 'undefined') {
  const onGesture = () => {
    const st = audioStore.get();
    if (ctxReady && st.running && st.ctxState !== 'running') unlockAudio();
  };
  ['pointerdown', 'touchend', 'keydown', 'click'].forEach((ev) => window.addEventListener(ev, onGesture, { capture: true, passive: true }));
  document.addEventListener('visibilitychange', () => {
    if (ctxReady && document.visibilityState === 'visible' && audioStore.get().running && audioStore.get().ctxState !== 'running') {
      try { void (Tone.getContext().rawContext as unknown as AudioContext).resume(); } catch { /* ignore */ }
    }
  });
  (window as unknown as { __pv: unknown }).__pv = {
    audio, audioStore, rms: () => audio.rms(), ctxState: () => (ctxReady ? (Tone.getContext().rawContext as unknown as AudioContext).state : 'not-created'),
    presets: () => Object.keys(AUDIO_PRESETS), loadPreset: (id: string) => audio.loadPreset(id),
  };
}
