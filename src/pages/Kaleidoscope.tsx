import { Experience } from '../ui/Experience';
import { ShaderView } from '../views/ShaderView';
import { KALEIDOSCOPE_FRAG } from '../shaders/kaleidoscope';
import { useStore } from '../state/store';
import { visualStore } from '../state/params';
import { Select } from '../ui/Slider';
import { ArtCaption, artByKey, SourceArtStrip, TEXTURE_ART } from '../ui/SourceArt';

const MODES = [{ id: 'art', label: 'Sacred art' }, { id: 'crystal', label: 'Crystal' }, { id: 'nebula', label: 'Nebula' }, { id: 'jewel', label: 'Jewel facets' }];
const SHADER_MODE: Record<string, number> = { crystal: 0, nebula: 1, jewel: 2, art: 3 };

export default function Kaleidoscope() {
  const v = useStore(visualStore);
  const art = artByKey(v.art) ?? TEXTURE_ART[0];
  return (
    <Experience id="kaleidoscope" route="/kaleidoscope" title="Psychedelic Kaleidoscope" subtitle="Mirror symmetry · counter-rotating fractal layers · real sacred art"
      modes={MODES} defaultPreset="cosmic-kaleidoscope"
      extraPanel={<details open><summary>Source artwork</summary>
        <Select label="Artwork in the mirrors (Sacred art mode)" value={art.key} options={TEXTURE_ART.map((a) => ({ value: a.key, label: a.title }))} onChange={(x) => visualStore.set({ art: x, mode: 'art' })} />
        <ArtCaption a={art} />
        <SourceArtStrip keys={TEXTURE_ART.map((a) => a.key)} />
      </details>}
      about={<>
        <h2>How the kaleidoscope works</h2>
        <p>Every pixel's position is converted to polar coordinates and folded into a single wedge of angle 2π/n, then mirrored — exactly the reflection group of a physical kaleidoscope with n mirrored segments (choose 4–24).</p>
        <p><strong>Sacred art</strong> mode places a real public-domain artwork between the mirrors — Tibetan and Nepalese thangka mandalas, Iznik tiles and Anatolian carpets from The Metropolitan Museum of Art and the Rijksmuseum (CC0) — so their original pigments become the kaleidoscope's colours.</p>
        <p>Three layers rotate in alternating directions. Each is textured by an escape-time “kali” fold, <code>z → |z|/|z|² − c</code>, whose parameter c drifts, plus fractal Brownian-motion noise, a flowing log-zoom warp and concentric light ripples.</p>
        <p>Audio: bass expands the geometry, midrange nudges rotation, high frequencies sharpen detail, beats add a ≤6% brightness swell (no strobing).</p>
      </>}>
      {(mode) => <ShaderView frag={KALEIDOSCOPE_FRAG} modeIndex={SHADER_MODE[mode] ?? 0} texture={mode === 'art' ? art.key : null} />}
    </Experience>
  );
}
