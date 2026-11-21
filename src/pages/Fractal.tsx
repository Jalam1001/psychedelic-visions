import { useRef, useState } from 'react';
import { Experience } from '../ui/Experience';
import { ShaderView } from '../views/ShaderView';
import { FRACTAL_FRAG } from '../shaders/fractal';
import { quality } from '../engine/loop';
import { Select, Toggle } from '../ui/Slider';

const MODES = [{ id: 'mandelbrot', label: 'Mandelbrot' }, { id: 'julia', label: 'Julia' }, { id: 'tunnel', label: 'Fractal tunnel' }, { id: 'spiral', label: 'Recursive spiral' }, { id: 'ifs', label: 'Kaleidoscopic IFS' }];
const TARGETS: Record<string, { label: string; c: [number, number] }> = {
  seahorse: { label: 'Seahorse valley', c: [-0.743643887037151, 0.13182590420533] },
  wiki: { label: 'Spiral arm (−0.77568, 0.13647)', c: [-0.77568377, 0.13646737] },
};
const JULIAS: Record<string, { label: string; c: [number, number] | null }> = {
  animated: { label: 'Animated (|c| = 0.7885)', c: null },
  rabbit: { label: "Douady's rabbit", c: [-0.123, 0.745] },
  dendrite: { label: 'Dendrite (c = i)', c: [0, 1] },
  sanmarco: { label: 'San Marco (c = −0.75)', c: [-0.75, 0] },
  siegel: { label: 'Siegel disk', c: [-0.391, -0.587] },
};

export default function Fractal() {
  const [deep, setDeep] = useState(false);
  const [target, setTarget] = useState('seahorse');
  const [julia, setJulia] = useState('animated');
  const deepT = useRef(0);
  const opts = useRef({ deep, target, julia }); opts.current = { deep, target, julia };
  return (
    <Experience id="fractal" route="/fractal" title="Fractal Journey" subtitle="GPU escape-time fractals · infinite zoom" maxZoom={100000}
      modes={MODES} defaultPreset="fractal-meditation" controls={['speed', 'complexity', 'symmetry', 'depth', 'rotation', 'zoom', 'brightness', 'intensity']}
      extraPanel={<details open><summary>Fractal</summary>
        <Toggle label="Automatic deep zoom (Mandelbrot)" checked={deep} onChange={setDeep} />
        <Select label="Zoom target" value={target} options={Object.entries(TARGETS).map(([k, v]) => ({ value: k, label: v.label }))} onChange={setTarget} />
        <Select label="Julia constant c" value={julia} options={Object.entries(JULIAS).map(([k, v]) => ({ value: k, label: v.label }))} onChange={setJulia} />
        <p className="note">Recursion depth controls iteration count. Single-precision GPU floats limit sharp zoom to about 10⁵×; the auto-zoom eases back out before pixels break up.</p>
      </details>}
      about={<>
        <h2>The mathematics</h2>
        <p><strong>Mandelbrot set</strong>: the set of complex c for which z<sub>n+1</sub> = z<sub>n</sub>² + c, starting at z<sub>0</sub> = 0, stays bounded. Points escaping |z| &gt; 2 are coloured by a smooth iteration count ν = n − log₂(log₂|z|²) + 4, which removes colour banding.</p>
        <p><strong>Julia sets</strong> use the same iteration but fix c and vary the starting point z<sub>0</sub>. Each c gives a different set; c inside the Mandelbrot set gives a connected Julia set.</p>
        <p><strong>Fractal tunnel</strong>: inverse-radius depth (1/r) turns the screen into an infinite corridor, textured by repeated absolute-value folds. <strong>Recursive spiral</strong>: in log-polar coordinates, scaling becomes translation, so a repeated tile becomes a self-similar logarithmic spiral. <strong>Kaleidoscopic IFS</strong>: an iterated function system of folds, rotations and scalings (Sierpiński/Koch family) evaluated per pixel.</p>
        <p>Drag to pan and scroll/pinch to zoom; everything runs on the GPU in a fragment shader.</p>
      </>}>
      {(mode) => <ShaderView frag={FRACTAL_FRAG} modeIndex={MODES.findIndex((m) => m.id === mode)} maxZoom={100000} pixelCap={1.5}
        extraUniforms={(f, p) => {
          const o = opts.current;
          const isM = mode === 'mandelbrot';
          let zoom = p.zoom;
          let center: [number, number] = isM ? [-0.6 - 3 * p.panX, -3 * p.panY] : [-3 * p.panX, -3 * p.panY];
          if (isM && o.deep) {
            deepT.current += f.dt * 0.35;
            const cyc = (deepT.current % 24) / 12; // 0..2 ping-pong in log space
            const k = cyc < 1 ? cyc : 2 - cyc;
            const s = k * k * (3 - 2 * k);
            zoom = Math.pow(10, s * 5);
            const tc = TARGETS[o.target].c;
            const blend = Math.min(1, s * 6);
            center = [-0.6 + (tc[0] + 0.6) * blend, tc[1] * blend];
          }
          const jc = JULIAS[o.julia].c;
          const ja = 2.3 + f.t * 0.05;
          const juliaC: [number, number] = jc ?? [0.7885 * Math.cos(ja), 0.7885 * Math.sin(ja)];
          const baseIter = 70 + p.depth * 35;
          const iter = Math.min(900, baseIter * (1 + Math.log10(Math.max(1, zoom)) * 0.45) * (0.6 + 0.4 * quality.scale));
          return { uCenter: center, uScale: 3 / zoom, uJulia: juliaC, uIter: Math.round(iter) };
        }} />}
    </Experience>
  );
}
