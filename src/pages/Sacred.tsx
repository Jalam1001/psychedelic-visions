import { Experience } from '../ui/Experience';
import { CanvasView, DrawFn } from '../views/CanvasView';
import { drawFibonacci, drawFlowerOfLife, drawMetatron, drawPolygons, drawRecursive } from '../geometry/sacred';

const MODES = [
  { id: 'flower', label: 'Flower of Life' },
  { id: 'fibonacci', label: 'Fibonacci & φ' },
  { id: 'metatron', label: "Metatron's Cube" },
  { id: 'polygons', label: 'Interlocking polygons' },
  { id: 'recursive', label: 'Recursive tree' },
];
const DRAW: Record<string, DrawFn> = { flower: drawFlowerOfLife, fibonacci: drawFibonacci, metatron: drawMetatron, polygons: drawPolygons, recursive: drawRecursive };

export default function Sacred() {
  return (
    <Experience id="sacred" route="/sacred" title="Sacred Geometry" subtitle="Mathematical constructions, explained" modes={MODES} defaultPreset="golden-geometry"
      controls={['speed', 'complexity', 'depth', 'layers', 'rotation', 'zoom', 'brightness']}
      about={<>
        <h2>Mathematics first</h2>
        <p><strong>Mathematical facts.</strong> The golden ratio φ = (1+√5)/2 ≈ 1.618034 satisfies φ² = φ + 1; ratios of consecutive Fibonacci numbers converge to φ. Placing seeds at successive multiples of the golden angle (≈137.508°) with radius ∝ √n (Vogel's model) packs them evenly, as in sunflower heads. The Flower of Life is a hexagonal lattice of equal overlapping circles. Joining the 13 centres of the “Fruit of Life” gives 78 segments in which 2-D projections of several Platonic solids can be traced. A Pythagoras tree recursively applies a² = b² + c².</p>
        <p><strong>Symbolic interpretations</strong> (separate from the mathematics): these figures appear in many religious and esoteric traditions and in modern “sacred geometry” movements. Claims that they carry energies or healing properties are beliefs, not scientific findings.</p>
      </>}>
      {(mode) => <CanvasView draw={DRAW[mode] ?? drawFlowerOfLife} />}
    </Experience>
  );
}
