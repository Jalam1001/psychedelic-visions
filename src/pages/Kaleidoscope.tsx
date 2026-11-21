import { Experience } from '../ui/Experience';
import { ShaderView } from '../views/ShaderView';
import { KALEIDOSCOPE_FRAG } from '../shaders/kaleidoscope';

const MODES = [{ id: 'crystal', label: 'Crystal' }, { id: 'nebula', label: 'Nebula' }, { id: 'jewel', label: 'Jewel facets' }];

export default function Kaleidoscope() {
  return (
    <Experience id="kaleidoscope" route="/kaleidoscope" title="Psychedelic Kaleidoscope" subtitle="Mirror symmetry · counter-rotating fractal layers"
      modes={MODES} defaultPreset="cosmic-kaleidoscope"
      about={<>
        <h2>How the kaleidoscope works</h2>
        <p>Every pixel's position is converted to polar coordinates and folded into a single wedge of angle 2π/n, then mirrored — exactly the reflection group of a physical kaleidoscope with n mirrored segments (choose 4–24).</p>
        <p>Three layers rotate in alternating directions. Each is textured by an escape-time “kali” fold, <code>z → |z|/|z|² − c</code>, whose parameter c drifts slowly, plus fractal Brownian-motion noise (domain-warped value noise) and concentric rings.</p>
        <p>Audio: bass expands the geometry, midrange nudges rotation, high frequencies sharpen detail, beats add a ≤6% brightness swell (no strobing).</p>
      </>}>
      {(mode) => <ShaderView frag={KALEIDOSCOPE_FRAG} modeIndex={MODES.findIndex((m) => m.id === mode)} />}
    </Experience>
  );
}
