import { Experience } from '../ui/Experience';
import { CanvasView, DrawFn } from '../views/CanvasView';
import { drawFibonacci2, drawFlower2, drawMetatron2, drawPlatonic, drawTorus } from '../geometry/sacred2';

const MODES = [
  { id: 'flower', label: 'Flower of Life' },
  { id: 'fibonacci', label: 'Golden spiral & sunflower' },
  { id: 'metatron', label: "Metatron's Cube (3D)" },
  { id: 'polygons', label: 'Platonic solids' },
  { id: 'recursive', label: 'Torus' },
];
const DRAW: Record<string, DrawFn> = { flower: drawFlower2, fibonacci: drawFibonacci2, metatron: drawMetatron2, polygons: drawPlatonic, recursive: drawTorus };

export default function Sacred() {
  return (
    <Experience artKeys={['afklint-no7', 'afklint-no3', 'kandinsky-several-circles', 'haeckel-stephoidea', 'romanesco', 'helix-nebula']} id="sacred" route="/sacred" title="Sacred Geometry" subtitle="Mathematical constructions, explained" modes={MODES} defaultPreset="golden-geometry"
      controls={['speed', 'complexity', 'depth', 'layers', 'rotation', 'zoom', 'brightness']}
      about={<>
        <h2>Mathematics first</h2>
        <p><strong>Mathematical facts.</strong> The golden ratio φ = (1+√5)/2 ≈ 1.618034 satisfies φ² = φ + 1; ratios of consecutive Fibonacci numbers converge to φ. Placing seeds at successive multiples of the golden angle (≈137.508°) with radius ∝ √n (Vogel's model) packs them evenly, as in sunflower heads. The Flower of Life is a hexagonal lattice of equal overlapping circles. Joining the 13 centres of the “Fruit of Life” gives 78 segments in which 2-D projections of several Platonic solids can be traced. The five Platonic solids (tetrahedron, cube, octahedron, dodecahedron, icosahedron) are the only convex polyhedra whose faces are identical regular polygons with the same number meeting at every vertex; they are drawn here as true 3-D rotations with depth-sorted faces. The torus is the surface swept by a circle revolving around an axis; the moving lights follow a (1,3) torus knot. The background uses NASA's Helix Nebula photograph (public domain).</p>
        <p><strong>Symbolic interpretations</strong> (separate from the mathematics): these figures appear in many religious and esoteric traditions and in modern “sacred geometry” movements. Claims that they carry energies or healing properties are beliefs, not scientific findings.</p>
      </>}>
      {(mode) => <CanvasView draw={DRAW[mode] ?? drawFlower2} pixelCap={1.75} />}
    </Experience>
  );
}
