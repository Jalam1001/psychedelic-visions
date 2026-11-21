import { Experience } from '../ui/Experience';
import { CanvasView, DrawFn } from '../views/CanvasView';
import { drawCarpet, drawPersianGarden, drawRecursiveCentres, drawSufi, drawTessellation } from '../geometry/islamic';

const MODES = [
  { id: 'carpet', label: 'Living Turkish carpet' },
  { id: 'tessellation', label: 'Infinite tessellation' },
  { id: 'centres', label: "Alexander's recursive centres" },
  { id: 'garden', label: 'Persian garden' },
  { id: 'sufi', label: 'Sufi meditation' },
];
const DRAW: Record<string, DrawFn> = { carpet: drawCarpet, tessellation: drawTessellation, centres: drawRecursiveCentres, garden: drawPersianGarden, sufi: drawSufi };

export default function Islamic() {
  return (
    <Experience id="islamic" route="/islamic" title="Islamic Recursive Geometry & Living Carpets" subtitle="Star polygons · girih-style lattices · nested centres"
      modes={MODES} defaultPreset="living-seljuk-carpet" controls={['speed', 'complexity', 'symmetry', 'depth', 'layers', 'rotation', 'zoom', 'brightness']}
      about={<>
        <h2>Centres at many scales</h2>
        <p>In <em>A Foreshadowing of 21st Century Art</em> (1993) Christopher Alexander studied very early Turkish (Anatolian) carpets and argued their power comes from <strong>centres</strong>: coherent zones that are made stronger by other, smaller centres around and within them. <em>The Nature of Order, Book 1</em> (2002) generalises this to fifteen properties — levels of scale, strong centres, boundaries, alternating repetition, positive space, good shape, local symmetries, deep interlock and ambiguity, contrast, gradients, roughness, echoes, the void, simplicity and inner calm, not-separateness.</p>
        <p><strong>Centres are not fractals.</strong> Mathematical self-similarity repeats the <em>same</em> shape at every scale. Alexander's centres differ in shape, colour and role at each level; what recurs is the <em>relationship</em> of mutual support. The renderers here therefore change motif type per level (star → polygon → rosette), add boundaries and voids, and let levels appear one at a time so you can watch coherence build.</p>
        <p>Star patterns use regular star polygons {'{'}n/k{'}'} with inner radius ratio cos(πk/n)/cos(π(k−1)/n), placed on square (star-and-cross) or hexagonal lattices with interlaced straps — modern generative interpretations of historical girih-style construction, not copies of specific monuments. The carpet's slight colour banding imitates <em>abrash</em>, the natural variation of hand-dyed wool.</p>
      </>}>
      {(mode) => <CanvasView draw={DRAW[mode] ?? drawCarpet} />}
    </Experience>
  );
}
