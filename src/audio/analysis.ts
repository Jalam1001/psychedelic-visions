import { audio, audioStore, MusicEvent } from './engine';
import { uiStore } from '../state/params';

export interface AVState {
  bass: number;    // 0..1 smoothed
  mid: number;
  high: number;
  energy: number;
  pulse: number;   // 0..1 gentle decaying beat pulse
  hue: number;     // slowly drifting palette offset driven by harmonic (chord) changes
  spectrum: Float32Array; // 0..1 per bin (linear, auto-gained)
}

/**
 * FFT band analysis + beat detection shared by every visual engine.
 * - band energies are auto-gained (slow peak follower) so quiet ambient music still drives visuals
 * - attack/release smoothing prevents jitter; the beat pulse decays over ~0.5 s (no strobing)
 */
class AVSync {
  state: AVState = { bass: 0, mid: 0, high: 0, energy: 0, pulse: 0, hue: 0, spectrum: new Float32Array(512) };
  private peaks = [1e-3, 1e-3, 1e-3];
  private bassAvg = 0;
  private lastBeat = 0;
  private targetHue = 0;
  private lastT = 0;
  private lastFrame = -1;

  constructor() {
    audio.on((e: MusicEvent) => this.onEvent(e));
  }

  private onEvent(e: MusicEvent) {
    if (e.type === 'chord') this.targetHue += 0.07 + (e.index % 3) * 0.03;
    if (e.type === 'beat' || e.type === 'bowl') this.kick(e.strength * (e.type === 'bowl' ? 0.6 : 0.5));
  }

  private kick(s: number) {
    this.state.pulse = Math.min(1, Math.max(this.state.pulse, s));
  }

  /** Call once per animation frame (idempotent per timestamp). */
  update(now: number): AVState {
    if (now === this.lastFrame) return this.state;
    this.lastFrame = now;
    const dt = Math.min(0.1, this.lastT ? (now - this.lastT) / 1000 : 0.016);
    this.lastT = now;
    const s = this.state;
    const running = audioStore.get().running && audio.isBuilt;
    let b = 0, m = 0, h = 0;
    if (running) {
      const vals = audio.fft.getValue() as Float32Array;
      const sr = audio.sampleRate;
      const binHz = sr / 2 / vals.length;
      let nb = 0, nm = 0, nh = 0;
      for (let i = 1; i < vals.length; i++) {
        const f = i * binHz;
        const lin = Math.pow(10, vals[i] / 20);
        if (i < s.spectrum.length) s.spectrum[i] = s.spectrum[i] * 0.6 + Math.min(1, lin * 12) * 0.4;
        if (f < 250) { b += lin; nb++; } else if (f < 2000) { m += lin; nm++; } else if (f < 10000) { h += lin; nh++; }
      }
      b /= Math.max(1, nb); m /= Math.max(1, nm); h /= Math.max(1, nh);
    } else {
      for (let i = 0; i < s.spectrum.length; i++) s.spectrum[i] *= 0.9;
    }
    const raw = [b, m, h];
    const norm = raw.map((v, i) => {
      this.peaks[i] = Math.max(v, this.peaks[i] * (1 - dt * 0.15), 1e-4);
      return Math.min(1, v / this.peaks[i]);
    });
    const smooth = (cur: number, target: number) => cur + (target - cur) * (target > cur ? Math.min(1, dt * 6) : Math.min(1, dt * 1.5));
    s.bass = smooth(s.bass, running ? norm[0] : 0);
    s.mid = smooth(s.mid, running ? norm[1] : 0);
    s.high = smooth(s.high, running ? norm[2] : 0);
    s.energy = (s.bass + s.mid + s.high) / 3;
    // spectral-flux style beat detection on bass
    if (running) {
      const flux = norm[0] - this.bassAvg;
      this.bassAvg += (norm[0] - this.bassAvg) * Math.min(1, dt * 2);
      if (flux > 0.22 && now - this.lastBeat > 350) { this.lastBeat = now; this.kick(0.6); }
    }
    s.pulse *= Math.exp(-dt / 0.45);
    s.hue += (this.targetHue - s.hue) * Math.min(1, dt * 0.25);
    return s;
  }

  /** Reactive values scaled by user reactivity; reduced-motion halves movement and removes pulses. */
  scaled(reactivity: number) {
    const s = this.state;
    const rm = uiStore.get().reducedMotion;
    const k = reactivity * (rm ? 0.4 : 1);
    return { bass: s.bass * k, mid: s.mid * k, high: s.high * k, pulse: rm ? 0 : s.pulse * k, hue: s.hue * (rm ? 0.3 : 1), energy: s.energy * k };
  }
}

export const avSync = new AVSync();
