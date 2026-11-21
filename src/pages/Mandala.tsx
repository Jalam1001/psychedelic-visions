import { Experience } from '../ui/Experience';
import { CanvasView, DrawFn } from '../views/CanvasView';
import { ShaderView } from '../views/ShaderView';
import { MANDALA_FRAG } from '../shaders/mandala';
import { drawAlexanderMandala, drawLotus, drawSriYantra, drawTibetan } from '../geometry/mandala';

const MODES = [
  { id: 'lotus', label: 'Infinite lotus' },
  { id: 'tibetan', label: 'Tibetan geometric' },
  { id: 'sri-static', label: 'Sri Yantra (traditional)' },
  { id: 'sri-animated', label: 'Sri Yantra (animated)' },
  { id: 'psychedelic', label: 'Psychedelic' },
  { id: 'alexander', label: "Alexander's living mandala" },
];
const DRAW: Record<string, DrawFn> = {
  lotus: drawLotus, tibetan: drawTibetan, alexander: drawAlexanderMandala,
  'sri-static': (d) => drawSriYantra(d, false), 'sri-animated': (d) => drawSriYantra(d, true),
};

export default function Mandala() {
  return (
    <Experience id="mandala" route="/mandala" title="Living Mandalas" subtitle="Lotus · Tibetan-inspired · Sri Yantra · psychedelic · Alexander"
      modes={MODES} defaultPreset="infinite-lotus" controls={['speed', 'complexity', 'symmetry', 'depth', 'petals', 'layers', 'rotation', 'zoom', 'brightness', 'intensity']}
      about={<>
        <h2>Mandalas: tradition and interpretation</h2>
        <p>Mandalas and yantras are sacred diagrams in Hindu, Buddhist and Jain traditions, used in ritual and meditation. Their geometry is radial and concentric: a centre (bindu), surrounding lotus rings, circles and a square enclosure with four gates. This page offers <strong>modern animated interpretations</strong>; they are not ritual objects and do not depict specific deities.</p>
        <p><strong>Sri Yantra.</strong> The “traditional” mode draws the inward construction attributed to Kaivalyāśrama's commentary on the Saundaryalaharī: divide the vertical diameter into 48 units, draw nine chords at 6, 12, 17, 20, 23, 27, 30, 36 and 42; shorten seven of them by 3, 5, 16, 18, 16, 4 and 3 units; join their ends to fixed points on the axis. This produces four upward (Śiva) and five downward (Śakti) triangles which interpenetrate to form 43 small triangles, surrounded by 8 and 16 lotus petals, three circles and the bhūpura (square with four gates). Historical constructions contain tiny errors at some triple intersections; we draw the recipe faithfully. The “animated” mode is an artistic reinterpretation of the same geometry.</p>
        <p><strong>Tibetan-inspired mode</strong> builds a palace with four T-shaped gateways and quadrant colours, a lotus ring, a vajra ring and a ring of fire, then gently dissolves — an allusion to the impermanence of sand mandalas.</p>
        <p><strong>Alexander mode</strong> applies the theory of centres: rings of centres support the central one, motif types alternate, boundaries join rings, and nested smaller centres appear at higher recursion depth.</p>
      </>}>
      {(mode) => mode === 'psychedelic' ? <ShaderView frag={MANDALA_FRAG} /> : <CanvasView draw={DRAW[mode] ?? drawLotus} />}
    </Experience>
  );
}
