import { useRef, useState, useEffect } from 'react';
import { Experience } from '../ui/Experience';
import { ShaderView } from '../views/ShaderView';
import { JOURNEY_FRAG } from '../shaders/journey';

const WORLDS = ['Kaleidoscope', 'Amazonian visions', 'Fractal tunnel', 'Islamic star lattice', 'Lotus mandala'];
const MODES = [{ id: 'auto', label: 'Automatic' }, ...WORLDS.map((w, i) => ({ id: 'w' + i, label: w }))];
const SEG = 22, FADE = 9; // seconds of artistic time

export default function Journey() {
  const st = useRef({ cur: 0, next: 0, tStart: 0, w: [1, 0, 0, 0, 0] });
  const [label, setLabel] = useState(WORLDS[0]);
  const labelRef = useRef(label);
  useEffect(() => { labelRef.current = label; }, [label]);
  return (
    <Experience id="journey" route="/journey" title="Infinite Psychedelic Journey" subtitle="Endless, smoothly cross-faded worlds" modes={MODES} defaultPreset="infinite-psychedelic-journey"
      controls={['speed', 'complexity', 'symmetry', 'rotation', 'zoom', 'brightness', 'intensity']}
      about={<>
        <h2>One continuous voyage</h2>
        <p>Five visual worlds — kaleidoscope, Amazonian-inspired lattice with vines, fractal tunnel, Islamic star lattice with infinite zoom, and lotus mandala — live in a single shader. Weights computed with smoothstep envelopes blend them over ~9 seconds, so there are never hard cuts. In Automatic mode the next world is chosen at random every ~22 seconds of animation time; pick a world to glide to it manually.</p>
      </>}>
      {(mode) => <>
        <ShaderView frag={JOURNEY_FRAG} extraUniforms={(f) => {
          const s = st.current;
          const manual = mode !== 'auto' ? parseInt(mode.slice(1), 10) : -1;
          if (manual >= 0 && manual !== s.next) { s.cur = s.next; s.next = manual; s.tStart = f.t; }
          if (manual < 0 && f.t - s.tStart > SEG) {
            s.cur = s.next;
            let n = s.cur; while (n === s.cur) n = Math.floor(Math.random() * WORLDS.length);
            s.next = n; s.tStart = f.t;
          }
          const k = Math.min(1, Math.max(0, (f.t - s.tStart) / FADE));
          const e = k * k * (3 - 2 * k);
          const w = [0, 0, 0, 0, 0];
          w[s.cur] += 1 - e; w[s.next] += e;
          if (s.cur === s.next) { w.fill(0); w[s.cur] = 1; }
          const lab = WORLDS[e > 0.5 ? s.next : s.cur];
          if (lab !== labelRef.current) { labelRef.current = lab; setTimeout(() => setLabel(lab), 0); }
          return { uW: [w[0], w[1], w[2], w[3]], uW4: w[4], uSeed: f.t * 0.01 };
        }} />
        <div className="world-label no-pan" aria-live="polite">{label}</div>
      </>}
    </Experience>
  );
}
