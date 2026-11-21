import { useEffect, useRef, useState } from 'react';
import { Experience } from '../ui/Experience';
import { ShaderView } from '../views/ShaderView';
import { MEDITATION_FRAG } from '../shaders/meditation';
import { audio, audioStore } from '../audio/engine';
import { useStore } from '../state/store';
import { visualStore } from '../state/params';
import { Select, Slider } from '../ui/Slider';
import { AudioControls } from '../ui/AudioControls';

type Phase = { label: string; secs: number; from: number; to: number };
const PATTERNS: Record<string, { name: string; phases: Phase[] }> = {
  coherent: { name: 'Slow even breathing (5.5 s in / 5.5 s out)', phases: [{ label: 'Breathe in', secs: 5.5, from: 0, to: 1 }, { label: 'Breathe out', secs: 5.5, from: 1, to: 0 }] },
  box: { name: 'Box breathing (4-4-4-4)', phases: [{ label: 'Breathe in', secs: 4, from: 0, to: 1 }, { label: 'Hold', secs: 4, from: 1, to: 1 }, { label: 'Breathe out', secs: 4, from: 1, to: 0 }, { label: 'Hold', secs: 4, from: 0, to: 0 }] },
  r478: { name: '4-7-8', phases: [{ label: 'Breathe in', secs: 4, from: 0, to: 1 }, { label: 'Hold', secs: 7, from: 1, to: 1 }, { label: 'Breathe out', secs: 8, from: 1, to: 0 }] },
  free: { name: 'No breathing guide', phases: [{ label: '', secs: 30, from: 0.5, to: 0.5 }] },
};

function breathAt(pattern: string, secs: number) {
  const ph = PATTERNS[pattern].phases;
  const total = ph.reduce((s, p) => s + p.secs, 0);
  let t = secs % total;
  for (const p of ph) {
    if (t < p.secs) { const k = t / p.secs; const e = 0.5 - 0.5 * Math.cos(Math.PI * k); return { value: p.from + (p.to - p.from) * e, label: p.label, remain: p.secs - t }; }
    t -= p.secs;
  }
  return { value: 0, label: '', remain: 0 };
}

export default function Meditation() {
  const [pattern, setPattern] = useState('coherent');
  const [minutes, setMinutes] = useState(10);
  const [session, setSession] = useState<{ start: number; end: number } | null>(null);
  const [, force] = useState(0);
  const a = useStore(audioStore);
  const v = useStore(visualStore);
  const start0 = useRef(performance.now());
  const patRef = useRef(pattern); patRef.current = pattern;

  useEffect(() => { const id = window.setInterval(() => force((x) => x + 1), 250); return () => clearInterval(id); }, []);
  useEffect(() => {
    if (session && performance.now() >= session.end) { audio.strikeBowl(196); setSession(null); }
  });

  const b = breathAt(pattern, (performance.now() - start0.current) / 1000);
  const left = session ? Math.max(0, session.end - performance.now()) / 1000 : minutes * 60;
  const mm = Math.floor(left / 60), ss = Math.floor(left % 60);

  return (
    <Experience id="meditation" route="/meditation" title="Meditation & Relaxation" subtitle="Slow geometry · breathing guide · session timer" modes={[{ id: 'rosette', label: 'Rosette' }]}
      defaultPreset="deep-relaxation" minimal controls={['speed', 'petals', 'layers', 'brightness', 'intensity']}
      extraPanel={<details open><summary>Session</summary>
        <Select label="Breathing pattern" value={pattern} options={Object.entries(PATTERNS).map(([k, p]) => ({ value: k, label: p.name }))} onChange={(x) => { setPattern(x); start0.current = performance.now(); }} />
        <Slider label="Session length" value={minutes} min={1} max={60} step={1} onChange={(x) => setMinutes(Math.round(x))} format={(x) => Math.round(x) + ' min'} />
        <Slider label="Visual intensity" value={v.intensity} min={0} max={1} onChange={(x) => visualStore.set({ intensity: x })} />
        <AudioControls compact />
      </details>}
      about={<>
        <h2>A quiet space</h2>
        <p>Slow, regular breathing and calm music are widely used for relaxation, and studies of music listening report reductions in self-reported stress and anxiety on average (see Learn for references and their limits). This page is for comfort and enjoyment — it is not a treatment for any condition.</p>
        <p>The breathing guide gently expands the rosette while you breathe in and contracts it as you breathe out. If any pattern makes you light-headed, return to normal breathing.</p>
      </>}>
      {() => <>
        <ShaderView frag={MEDITATION_FRAG} panZoom={false} extraUniforms={(f) => ({ uBreath: breathAt(patRef.current, (f.now - start0.current) / 1000).value })} />
        <div className="meditation-overlay no-pan">
          {b.label && <div className="breath-label" aria-live="polite">{b.label}</div>}
          <div className="timer">{String(mm).padStart(2, '0')}:{String(ss).padStart(2, '0')}</div>
          <div className="row center">
            {!session ? (
              <button className="btn primary" onClick={() => { if (!a.running) void audio.start(); start0.current = performance.now(); setSession({ start: performance.now(), end: performance.now() + minutes * 60000 }); audio.strikeBowl(196); }}>Begin session</button>
            ) : (
              <button className="btn" onClick={() => setSession(null)}>End session</button>
            )}
          </div>
        </div>
      </>}
    </Experience>
  );
}
