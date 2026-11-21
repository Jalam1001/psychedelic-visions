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
  harmonics: number; // 1..16 partials of the harmonic series (1/n amplitudes)
  level: number;
  beatMode: BeatMode;
  beatHz: number;
  carrier: number;
  beatLevel: number;
}

export interface AudioState {
  running: boolean;
  muted: boolean;
  ready: boolean;
  presetId: string;
  params: AudioParams;
  lab: LabState;
}

export const DEFAULT_LAB: LabState = {
  toneOn: false, freq: 220, wave: 'sine', harmonics: 1, level: 0.35,
  beatMode: 'off', beatHz: 6, carrier: 200, beatLevel: 0.4,
};

export const audioStore = createStore<AudioState>({
  running: false, muted: false, ready: false, presetId: 'cosmic', params: { ...DEFAULT_AUDIO }, lab: { ...DEFAULT_LAB },
});

const DRONE_TYPES: Record<PadTimbre, Tone.ToneOscillatorType> = { warm: 'triangle', glass: 'sine', choir: 'triangle', string: 'sawtooth' };
const PAD_TYPES: Record<PadTimbre, string> = { warm: 'fattriangle', glass: 'fatsine', choir: 'fatsawtooth', string: 'fatsawtooth' };
const PAD_CUTOFF: Record<PadTimbre, number> = { warm: 1400, glass: 2600, choir: 1100, string: 1700 };

/**
 * Generative music engine. Signal flow:
 *   instruments → music bus → stereo widener → reverb → master gain → compressor → limiter(-2 dB) → speakers
 *   binaural / lab tones → master (dry, hard-panned, never widened)
 *   limiter output → FFT + waveform analysers (audio-visual sync)
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
  private droneGain!: Tone.Gain; private droneFilter!: Tone.Filter; private droneLfo!: Tone.LFO;
  private drones: Tone.FatOscillator[] = [];
  private padGain!: Tone.Gain; private padFilter!: Tone.Filter; private pad!: Tone.PolySynth;
  private melody!: Tone.Synth; private melodyGain!: Tone.Gain;
  private bowlGain!: Tone.Gain; private bowl!: Tone.PolySynth;
  private percGain!: Tone.Gain; private kick!: Tone.MembraneSynth; private shaker!: Tone.NoiseSynth;
  private natureGain!: Tone.Gain; private noise!: Tone.Noise; private natureFilter!: Tone.Filter; private natureAuto!: Tone.AutoFilter;
  private cricket!: Tone.Oscillator; private cricketGain!: Tone.Gain; private cricketTrem!: Tone.Tremolo; private cricketTrem2!: Tone.Tremolo;
  private binGain!: Tone.Gain; private binL!: Tone.Oscillator; private binR!: Tone.Oscillator;
  private labGain!: Tone.Gain; private labOsc!: Tone.Oscillator;
  private monoGain!: Tone.Gain; private monoA!: Tone.Oscillator; private monoB!: Tone.Oscillator;
  private isoGain!: Tone.Gain; private isoOsc!: Tone.Oscillator; private isoTrem!: Tone.Tremolo;
  private chordIdx = 0;
  private melodyDeg = 7;
  private stopTimer: number | undefined;

  on(fn: (e: MusicEvent) => void) { this.listeners.add(fn); return () => { this.listeners.delete(fn); }; }
  private emit(e: MusicEvent, time: number) {
    Tone.getDraw().schedule(() => this.listeners.forEach((f) => f(e)), time);
  }

  get context() { return Tone.getContext(); }

  private async build() {
    this.master = new Tone.Gain(0);
    const comp = new Tone.Compressor({ threshold: -20, ratio: 3, attack: 0.05, release: 0.4 });
    const limiter = new Tone.Limiter(-2);
    this.master.chain(comp, limiter, Tone.getDestination());
    this.fft = new Tone.FFT({ size: 1024, smoothing: 0.75 });
    this.wave = new Tone.Waveform(1024);
    limiter.connect(this.fft);
    limiter.connect(this.wave);

    this.reverb = new Tone.Reverb({ decay: 9, preDelay: 0.04, wet: 0.55 });
    this.reverb.connect(this.master);
    this.widener = new Tone.StereoWidener(0.6).connect(this.reverb);
    this.bus = new Tone.Gain(1).connect(this.widener);

    // Drone: root, fifth and octave with slowly breathing low-pass filter
    this.droneFilter = new Tone.Filter({ type: 'lowpass', frequency: 700, Q: 0.7 }).connect(this.bus);
    this.droneGain = new Tone.Gain(0).connect(this.droneFilter);
    this.droneLfo = new Tone.LFO({ frequency: 0.04, min: 250, max: 1300 }).connect(this.droneFilter.frequency).start();
    const ratios = [1, 1.5, 2, 0.5];
    const levels = [0.5, 0.25, 0.18, 0.3];
    ratios.forEach((r, i) => {
      const g = new Tone.Gain(levels[i]).connect(this.droneGain);
      const o = new Tone.FatOscillator({ frequency: 110 * r, type: 'triangle', spread: 14 + i * 6, count: 3 }).connect(g);
      o.start();
      this.drones.push(o);
    });

    // Harmonic pad with chorus
    const chorus = new Tone.Chorus({ frequency: 0.25, delayTime: 4, depth: 0.6, wet: 0.5 }).start();
    this.padFilter = new Tone.Filter({ type: 'lowpass', frequency: 1600, Q: 0.5 });
    this.padGain = new Tone.Gain(0);
    this.padGain.chain(this.padFilter, chorus, this.bus);
    this.pad = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: 'fattriangle', count: 3, spread: 24 } as never,
      envelope: { attack: 3.5, decay: 2, sustain: 0.7, release: 6 },
      volume: -14,
    }).connect(this.padGain);
    this.pad.maxPolyphony = 16;

    // Sparse melodic voice (sine bell)
    this.melodyGain = new Tone.Gain(0).connect(this.bus);
    this.melody = new Tone.Synth({ oscillator: { type: 'sine' }, envelope: { attack: 0.02, decay: 1.6, sustain: 0.05, release: 2.5 }, volume: -16 }).connect(this.melodyGain);

    // Singing-bowl-like voice: inharmonic sine partials with long decays + detuned twins for beating
    this.bowlGain = new Tone.Gain(0).connect(this.bus);
    this.bowl = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: 'sine' }, envelope: { attack: 0.008, decay: 9, sustain: 0, release: 7 }, volume: -18,
    }).connect(this.bowlGain);
    this.bowl.maxPolyphony = 32;

    // Soft percussion
    this.percGain = new Tone.Gain(0).connect(this.bus);
    const percFilter = new Tone.Filter({ type: 'lowpass', frequency: 900 }).connect(this.percGain);
    this.kick = new Tone.MembraneSynth({ pitchDecay: 0.06, octaves: 3, envelope: { attack: 0.003, decay: 0.7, sustain: 0, release: 0.4 }, volume: -14 }).connect(percFilter);
    const shakerFilter = new Tone.Filter({ type: 'highpass', frequency: 5000 }).connect(this.percGain);
    this.shaker = new Tone.NoiseSynth({ noise: { type: 'pink' }, envelope: { attack: 0.004, decay: 0.07, sustain: 0 }, volume: -30 }).connect(shakerFilter);

    // Nature soundscape (synthesised: filtered noise + insect-like tremolo tone)
    this.natureGain = new Tone.Gain(0).connect(this.widener);
    this.natureAuto = new Tone.AutoFilter({ frequency: 0.07, depth: 0.8, baseFrequency: 200, octaves: 3 }).connect(this.natureGain).start();
    this.natureFilter = new Tone.Filter({ type: 'lowpass', frequency: 1200 }).connect(this.natureAuto);
    this.noise = new Tone.Noise('pink').connect(this.natureFilter);
    this.noise.start();
    this.cricketGain = new Tone.Gain(0).connect(this.natureGain);
    this.cricketTrem2 = new Tone.Tremolo({ frequency: 0.6, depth: 0.95 }).connect(this.cricketGain).start();
    this.cricketTrem = new Tone.Tremolo({ frequency: 27, depth: 1 }).connect(this.cricketTrem2).start();
    this.cricket = new Tone.Oscillator(4300, 'sine').connect(this.cricketTrem);
    this.cricket.start();

    // Binaural beat: left ear carrier, right ear carrier + beat. Bypasses widener & reverb.
    this.binGain = new Tone.Gain(0).connect(this.master);
    this.binL = new Tone.Oscillator(200, 'sine').connect(new Tone.Panner(-1).connect(this.binGain));
    this.binR = new Tone.Oscillator(206, 'sine').connect(new Tone.Panner(1).connect(this.binGain));
    this.binL.start(); this.binR.start();

    // Sound & Vision Lab sources
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
    try { await this.reverb.ready; } catch { /* reverb IR generation failed; dry signal still works */ }
    this.built = true;
    audioStore.set({ ready: true });
  }

  private schedule() {
    const T = Tone.getTransport();
    // Chord progression: every two bars
    new Tone.Loop((time) => {
      const p = audioStore.get().params;
      const steps = SCALES[p.scale]?.steps ?? SCALES.majorPent.steps;
      const deg = p.progression[this.chordIdx % p.progression.length];
      const n = steps.length;
      const notes = [deg, deg + 2, deg + 4, deg + (n >= 7 ? 6 : 5)].map((d) => degreeToFreq(p.root * 2, steps, d));
      if (p.pad > 0.001) this.pad.triggerAttackRelease(notes, T.toSeconds('2m') * 0.92, time, 0.45);
      this.emit({ type: 'chord', strength: 1, index: this.chordIdx }, time);
      this.chordIdx++;
    }, '2m').start(0);

    // Sparse melody (random walk over the scale)
    new Tone.Loop((time) => {
      const p = audioStore.get().params;
      if (p.pad < 0.05 || Math.random() > 0.35) return;
      const steps = SCALES[p.scale]?.steps ?? SCALES.majorPent.steps;
      this.melodyDeg += Math.round((Math.random() - 0.5) * 4);
      this.melodyDeg = Math.max(steps.length, Math.min(steps.length * 3, this.melodyDeg));
      this.melody.triggerAttackRelease(degreeToFreq(p.root * 2, steps, this.melodyDeg), '4n', time, 0.4 + Math.random() * 0.3);
    }, '4n').start('1m');

    // Singing bowl strikes
    new Tone.Loop((time) => {
      const p = audioStore.get().params;
      if (p.bowl < 0.01 || Math.random() > 0.35 + p.bowl * 0.4) return;
      const steps = SCALES[p.scale]?.steps ?? SCALES.majorPent.steps;
      const f = degreeToFreq(p.root * 2, steps, Math.floor(Math.random() * steps.length));
      const partials = [1, 2.76, 5.4, 8.93];
      const vels = [0.9, 0.42, 0.2, 0.09];
      const fs: number[] = []; const vs: number[] = [];
      partials.forEach((r, i) => { fs.push(f * r, f * r * 1.0035); vs.push(vels[i], vels[i] * 0.6); });
      fs.forEach((fr, i) => this.bowl.triggerAttackRelease(fr, 6, time + i * 0.002, vs[i]));
      this.emit({ type: 'bowl', strength: 0.8, index: 0 }, time);
    }, '1m').start('2n');

    // Soft percussion pattern (eighth notes, probabilistic)
    const pattern = [1, 0, 0.25, 0, 0.6, 0, 0.3, 0.15];
    let step = 0;
    new Tone.Loop((time) => {
      const p = audioStore.get().params;
      const s = step++ % pattern.length;
      if (p.perc < 0.01) return;
      if (Math.random() < pattern[s]) {
        const steps = SCALES[p.scale]?.steps ?? SCALES.majorPent.steps;
        this.kick.triggerAttackRelease(degreeToFreq(p.root / 2, steps, s === 0 ? 0 : 4), '8n', time, s === 0 ? 0.8 : 0.4);
        this.emit({ type: 'beat', strength: s === 0 ? 1 : 0.5, index: s }, time);
      }
      if (Math.random() < 0.35) this.shaker.triggerAttackRelease('16n', time, 0.3 + Math.random() * 0.3);
    }, '8n').start(0);
  }

  async start() {
    await Tone.start();
    if (!this.built) await this.build();
    window.clearTimeout(this.stopTimer);
    const T = Tone.getTransport();
    if (T.state !== 'started') T.start('+0.05');
    audioStore.set({ running: true });
    this.apply(audioStore.get().params, true);
    this.applyLab(audioStore.get().lab);
  }

  stop() {
    if (!this.built) { audioStore.set({ running: false }); return; }
    this.master.gain.rampTo(0, 1.2);
    audioStore.set({ running: false });
    this.stopTimer = window.setTimeout(() => Tone.getTransport().pause(), 1400);
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

  /** Apply parameters with smooth ramps (no abrupt jumps or loud transients). */
  apply(p: AudioParams, fadeIn = false) {
    if (!this.built) return;
    const { running, muted } = audioStore.get();
    const ramp = 0.8;
    const vol = running && !muted ? Math.pow(p.volume, 1.6) * 0.9 : 0;
    this.master.gain.rampTo(vol, fadeIn ? 2.5 : 0.4);
    Tone.getTransport().bpm.rampTo(p.tempo, 2);
    this.reverb.wet.rampTo(p.reverb, ramp);
    this.widener.width.rampTo(p.width, ramp);
    this.droneGain.gain.rampTo(p.drone * 0.22, ramp);
    this.padGain.gain.rampTo(p.pad * 0.9, ramp);
    this.melodyGain.gain.rampTo(p.pad * 0.5, ramp);
    this.bowlGain.gain.rampTo(p.bowl * 0.9, ramp);
    this.percGain.gain.rampTo(p.perc * 0.9, ramp);
    this.binGain.gain.rampTo(p.binaural * 0.12, ramp);
    this.binL.frequency.rampTo(p.carrier, ramp);
    this.binR.frequency.rampTo(p.carrier + p.beatHz, ramp);
    this.drones.forEach((o, i) => {
      o.frequency.rampTo(p.root * [1, 1.5, 2, 0.5][i], 2.5);
      if (o.type !== DRONE_TYPES[p.timbre]) o.type = DRONE_TYPES[p.timbre] as never;
    });
    this.padFilter.frequency.rampTo(PAD_CUTOFF[p.timbre], ramp);
    this.pad.set({ oscillator: { type: PAD_TYPES[p.timbre] } as never });
    this.setNature(p.natureType, p.nature);
  }

  private natureType: NatureType | null = null;
  private setNature(type: NatureType, level: number) {
    const lvl = type === 'none' ? 0 : level;
    this.natureGain.gain.rampTo(lvl * 0.35, 1.5);
    if (type === this.natureType) return;
    this.natureType = type;
    const n = this.noise, f = this.natureFilter, a = this.natureAuto;
    this.cricketGain.gain.rampTo(type === 'night' ? 0.035 : 0, 2);
    switch (type) {
      case 'wind': n.type = 'pink'; f.type = 'lowpass'; f.frequency.rampTo(1200, 1); a.frequency.rampTo(0.07, 1); a.depth.rampTo(0.85, 1); a.baseFrequency = 180; break;
      case 'rain': n.type = 'white'; f.type = 'bandpass'; f.frequency.rampTo(2800, 1); f.Q.value = 0.4; a.frequency.rampTo(0.25, 1); a.depth.rampTo(0.2, 1); a.baseFrequency = 1500; break;
      case 'stream': n.type = 'pink'; f.type = 'bandpass'; f.frequency.rampTo(900, 1); f.Q.value = 0.9; a.frequency.rampTo(0.9, 1); a.depth.rampTo(0.5, 1); a.baseFrequency = 500; break;
      case 'night': n.type = 'brown'; f.type = 'lowpass'; f.frequency.rampTo(600, 1); a.frequency.rampTo(0.05, 1); a.depth.rampTo(0.6, 1); a.baseFrequency = 120; break;
      default: break;
    }
  }

  applyLab(l: LabState) {
    if (!this.built) return;
    const r = 0.3;
    const partials = Array.from({ length: Math.max(1, Math.round(l.harmonics)) }, (_, i) => 1 / (i + 1));
    if (l.wave === 'sine' && l.harmonics > 1) {
      this.labOsc.partials = partials;
    } else {
      this.labOsc.type = l.wave;
    }
    this.labOsc.frequency.rampTo(l.freq, 0.15);
    this.labGain.gain.rampTo(l.toneOn ? l.level * 0.25 : 0, r);
    const bl = l.beatLevel * 0.2;
    this.binGain.gain.rampTo(l.beatMode === 'binaural' ? bl : audioStore.get().params.binaural * 0.12, r);
    if (l.beatMode === 'binaural') { this.binL.frequency.rampTo(l.carrier, r); this.binR.frequency.rampTo(l.carrier + l.beatHz, r); }
    this.monoGain.gain.rampTo(l.beatMode === 'monaural' ? bl * 0.5 : 0, r);
    this.monoA.frequency.rampTo(l.carrier, r); this.monoB.frequency.rampTo(l.carrier + l.beatHz, r);
    this.isoGain.gain.rampTo(l.beatMode === 'isochronic' ? bl : 0, r);
    this.isoOsc.frequency.rampTo(l.carrier, r); this.isoTrem.frequency.rampTo(l.beatHz, r);
  }

  /** Play a scale once (Lab) */
  playScale(scale: string, root: number) {
    if (!this.built) return;
    const steps = SCALES[scale]?.steps ?? SCALES.majorPent.steps;
    const now = Tone.now();
    for (let i = 0; i <= steps.length; i++) {
      this.melody.triggerAttackRelease(degreeToFreq(root, steps, i), 0.35, now + i * 0.38, 0.6);
    }
  }

  strikeBowl(freq = 220) {
    if (!this.built) return;
    const partials = [1, 2.76, 5.4, 8.93];
    const vels = [0.9, 0.42, 0.2, 0.09];
    const now = Tone.now();
    partials.forEach((r, i) => { this.bowl.triggerAttackRelease(freq * r, 6, now, vels[i]); this.bowl.triggerAttackRelease(freq * r * 1.0035, 6, now, vels[i] * 0.6); });
    this.listeners.forEach((f) => f({ type: 'bowl', strength: 1, index: 0 }));
  }

  get sampleRate() { return Tone.getContext().sampleRate; }
  get isBuilt() { return this.built; }
}

export const audio = new AudioEngine();
