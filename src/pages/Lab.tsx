import { useEffect, useRef, useState } from 'react';
import { Experience } from '../ui/Experience';
import { ShaderView } from '../views/ShaderView';
import { LAB_FRAG } from '../shaders/lab';
import { audio, audioStore, BeatMode, LabState } from '../audio/engine';
import { music, musicStore } from '../audio/music';
import { avSync } from '../audio/analysis';
import { SCALES } from '../audio/scales';
import { useStore } from '../state/store';
import { Select, Slider, Toggle } from '../ui/Slider';

const MODES = [{ id: 'chladni', label: 'Standing-wave figure' }, { id: 'harmonics', label: 'Harmonic series' }, { id: 'fractal', label: 'Audio-reactive fractal' }];

function Spectrum() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    let raf = 0;
    const draw = (now: number) => {
      const c = ref.current;
      if (c) {
        const w = (c.width = c.clientWidth * devicePixelRatio), h = (c.height = c.clientHeight * devicePixelRatio);
        const ctx = c.getContext('2d')!;
        ctx.clearRect(0, 0, w, h);
        const s = avSync.update(now).spectrum;
        const sr = audio.isBuilt ? audio.sampleRate : 48000;
        const binHz = sr / 2 / 512;
        // log-frequency axis 20 Hz – 12 kHz
        ctx.beginPath();
        for (let x = 0; x < w; x++) {
          const fHz = 20 * Math.pow(600, x / w);
          const v = s[Math.min(511, Math.round(fHz / binHz))] || 0;
          const y = h - v * h * 0.9;
          x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }
        ctx.strokeStyle = 'rgba(122,252,255,0.9)'; ctx.lineWidth = 1.5 * devicePixelRatio; ctx.stroke();
        ctx.fillStyle = 'rgba(255,255,255,0.45)'; ctx.font = `${10 * devicePixelRatio}px system-ui`;
        [50, 100, 200, 500, 1000, 2000, 5000, 10000].forEach((fHz) => { const x = (Math.log(fHz / 20) / Math.log(600)) * w; ctx.fillRect(x, h - 6, 1, 6); ctx.fillText(fHz >= 1000 ? fHz / 1000 + 'k' : String(fHz), x + 2, h - 8); });
        // oscilloscope
        if (audio.isBuilt && audioStore.get().running) {
          const wv = audio.wave.getValue() as Float32Array;
          ctx.beginPath();
          for (let i = 0; i < wv.length; i++) { const x = (i / wv.length) * w; const y = h * 0.3 - wv[i] * h * 0.25; i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y); }
          ctx.strokeStyle = 'rgba(255,209,102,0.7)'; ctx.stroke();
        }
      }
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, []);
  return <canvas ref={ref} className="spectrum no-pan" aria-label="Spectrum analyser (log frequency) and oscilloscope" />;
}

function LabPanel() {
  const a = useStore(audioStore);
  const l = a.lab;
  const set = (p: Partial<LabState>) => audio.setLab(p);
  const [scale, setScale] = useState('majorPent');
  // The Sound Lab needs the live synth (Web Audio) — switch to it inside the tap.
  const ensure = () => { if (musicStore.get().source !== 'synth') music.setSource('synth'); if (!musicStore.get().on) music.start(); };
  return (
    <details open>
      <summary>Sound laboratory</summary>
      <Toggle label="Frequency generator on" checked={l.toneOn} onChange={async (x) => { await ensure(); set({ toneOn: x }); }} />
      <Slider label="Frequency" value={l.freq} min={40} max={2000} log onChange={(v) => set({ freq: v })} format={(v) => v.toFixed(1) + ' Hz'} />
      <Select label="Waveform" value={l.wave} options={['sine', 'triangle', 'square', 'sawtooth'].map((w) => ({ value: w as LabState['wave'], label: w }))} onChange={(v) => set({ wave: v })} />
      <Slider label="Harmonic series partials (sine)" value={l.harmonics} min={1} max={16} step={1} onChange={(v) => set({ harmonics: Math.round(v) })} />
      <Slider label="Tone level" value={l.level} min={0} max={1} onChange={(v) => set({ level: v })} />
      <Select<BeatMode> label="Beat type" value={l.beatMode} options={[{ value: 'off', label: 'Off' }, { value: 'binaural', label: 'Binaural (headphones)' }, { value: 'monaural', label: 'Monaural' }, { value: 'isochronic', label: 'Isochronic' }]} onChange={async (v) => { await ensure(); set({ beatMode: v }); }} />
      <Slider label="Beat frequency" value={l.beatHz} min={1} max={40} step={0.5} onChange={(v) => set({ beatHz: v })} format={(v) => v.toFixed(1) + ' Hz'} />
      <Slider label="Carrier" value={l.carrier} min={80} max={600} step={1} onChange={(v) => set({ carrier: v })} format={(v) => Math.round(v) + ' Hz'} />
      <Slider label="Beat level" value={l.beatLevel} min={0} max={1} onChange={(v) => set({ beatLevel: v })} />
      <div className="row">
        <Select label="Scale" value={scale} options={Object.entries(SCALES).map(([k, v]) => ({ value: k, label: v.name }))} onChange={setScale} />
        <button className="btn" onClick={async () => { await ensure(); audio.playScale(scale, l.freq); }}>Play scale</button>
        <button className="btn" onClick={async () => { await ensure(); audio.strikeBowl(l.freq); }}>Strike bowl</button>
      </div>
      <p className="note"><strong>Binaural</strong>: different tones in each ear; the “beat” is created by the brain (needs headphones). <strong>Monaural</strong>: two tones mixed acoustically, so the beat exists in the air. <strong>Isochronic</strong>: one tone switched on and off. Mapping sound to pictures here is artistic; it is not a physical cymatics simulation.</p>
    </details>
  );
}

export default function Lab() {
  return (
    <Experience artKeys={['hubble-pillars', 'kandinsky-composition-vii', 'afklint-no3']} id="lab" route="/lab" title="Sound & Vision Laboratory" subtitle="Hear a parameter, see a parameter" modes={MODES} defaultPreset="harmonic-resonance"
      controls={['speed', 'complexity', 'rotation', 'zoom', 'brightness', 'intensity']} extraPanel={<LabPanel />}
      about={<>
        <h2>What you are seeing</h2>
        <p><strong>Standing-wave figure</strong>: the nodal lines of cos(nπx)cos(mπy) − cos(mπx)cos(nπy), the classic idealised square-plate (Chladni) mode shape. Here (n, m) are derived from the generator frequency by an <em>artistic</em> mapping — a real plate's modes depend on its material, size and boundary conditions.</p>
        <p><strong>Harmonic series</strong>: partials at f, 2f, 3f… drawn as rings with radius ∝ 1/k. <strong>Audio-reactive fractal</strong>: a Julia set whose constant c is steered by bass and mid energy from the FFT.</p>
        <p>The spectrum analyser shows a 1024-point FFT on a logarithmic frequency axis (Web Audio AnalyserNode via Tone.js), with an oscilloscope trace above it.</p>
      </>}>
      {(mode) => <>
        <ShaderView frag={LAB_FRAG} texture="hubble-pillars" backdrop={0.35} modeIndex={MODES.findIndex((m) => m.id === mode)} extraUniforms={() => {
          const l = audioStore.get().lab;
          return { uFreq: l.toneOn ? l.freq : audioStore.get().params.root * 2, uHarm: l.toneOn ? Math.max(l.harmonics, 3) : 8, uBeat: l.beatMode === 'off' ? 0.5 : l.beatHz };
        }} />
        <Spectrum />
      </>}
    </Experience>
  );
}
