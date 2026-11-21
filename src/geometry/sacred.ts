import type { DrawCtx } from '../views/CanvasView';
import { cosPal, withAlpha } from '../state/palettes';
import { TAU, caption, polyPath, reveal, smooth, starLines } from './draw';

const PHI = (1 + Math.sqrt(5)) / 2;
const GOLDEN_ANGLE = TAU * (1 - 1 / PHI); // ≈ 137.5077°

/* Flower of Life: 19 equal circles on a hexagonal lattice (2 rings) inside a bounding circle. */
export function drawFlowerOfLife(d: DrawCtx) {
  const { ctx, R, f, p, pal, av } = d;
  const r = R * 0.28 * (1 + 0.03 * av.bass);
  const centres: [number, number, number][] = [[0, 0, 0]];
  const rings = p.complexity > 0.7 ? 3 : 2;
  for (let ring = 1; ring <= rings; ring++) {
    for (let side = 0; side < 6; side++) {
      for (let s = 0; s < ring; s++) {
        const a0 = side * TAU / 6, a1 = (side + 1) * TAU / 6;
        const x = ring * r * Math.cos(a0) + s * r * (Math.cos(a1) - Math.cos(a0));
        const y = ring * r * Math.sin(a0) + s * r * (Math.sin(a1) - Math.sin(a0));
        centres.push([x, y, ring]);
      }
    }
  }
  const rot = f.t * 0.02 * p.rotation;
  const u = (f.t * 0.6) % (centres.length + 8);
  ctx.save(); ctx.rotate(rot);
  centres.forEach(([x, y, ring], i) => {
    const a = reveal(u, i * 0.9);
    if (a <= 0) return;
    ctx.globalAlpha = 0.85;
    ctx.beginPath(); ctx.arc(x, y, r, -Math.PI / 2, -Math.PI / 2 + TAU * a);
    ctx.strokeStyle = cosPal(pal, ring * 0.18 + i * 0.01 + f.t * 0.01, av.hue);
    ctx.lineWidth = 1.6 + av.high * 1.5; ctx.stroke();
  });
  ctx.globalAlpha = reveal(u, centres.length * 0.9);
  ctx.beginPath(); ctx.arc(0, 0, r * (rings + 1), 0, TAU); ctx.strokeStyle = pal.swatch[3]; ctx.lineWidth = 2; ctx.stroke();
  ctx.restore(); ctx.globalAlpha = 1;
  caption(d, [{ text: 'Flower of Life: equal circles, each centre on the circumference of its neighbours (hexagonal lattice).', alpha: 0.7 }]);
}

/* Fibonacci & golden ratio: golden-rectangle squares with quarter-circle spiral + phyllotaxis. */
export function drawFibonacci(d: DrawCtx) {
  const { ctx, R, f, p, pal, av } = d;
  const N = Math.round(300 + p.complexity * 1500);
  const grow = 0.35 + 0.65 * smooth(((f.t * 0.08) % 1.4) / 1.0);
  const count = Math.floor(N * grow);
  const c = (R * 0.92) / Math.sqrt(N);
  const rot = f.t * 0.03 * p.rotation;
  for (let i = 0; i < count; i++) {
    const a = i * GOLDEN_ANGLE + rot;
    const rr = c * Math.sqrt(i) * (1 + 0.03 * av.bass);
    ctx.fillStyle = cosPal(pal, i / N * 0.8 + f.t * 0.01, av.hue);
    ctx.beginPath(); ctx.arc(Math.cos(a) * rr, Math.sin(a) * rr, Math.max(0.8, c * 0.42 * (0.6 + 0.4 * i / N)), 0, TAU); ctx.fill();
  }
  // golden rectangle subdivided into squares, with quarter-circle arcs (approximate golden spiral)
  ctx.save(); ctx.rotate(-rot * 0.5);
  let w = R * 1.7, h = w / PHI, x = -w / 2, y = -h / 2;
  ctx.lineWidth = 1.4;
  for (let i = 0; i < 12 && w > 1 && h > 1; i++) {
    const dir = i % 4;
    let sx = x, sy = y, s = 0, cx = 0, cy = 0, a0 = 0;
    if (dir === 0) { s = h; sx = x; sy = y; cx = x + h; cy = y + h; a0 = Math.PI; x += h; w -= h; }
    else if (dir === 1) { s = w; sx = x; sy = y; cx = x; cy = y + w; a0 = Math.PI * 1.5; y += w; h -= w; }
    else if (dir === 2) { s = h; sx = x + w - h; sy = y; cx = x + w - h; cy = y; a0 = 0; w -= h; }
    else { s = w; sx = x; sy = y + h - w; cx = x + w; cy = y + h - w; a0 = Math.PI / 2; h -= w; }
    ctx.globalAlpha = 0.5; ctx.strokeStyle = pal.swatch[3]; ctx.strokeRect(sx, sy, s, s);
    ctx.globalAlpha = 0.95; ctx.strokeStyle = pal.swatch[4];
    ctx.beginPath(); ctx.arc(cx, cy, s, a0, a0 + Math.PI / 2); ctx.stroke();
  }
  ctx.restore(); ctx.globalAlpha = 1;
  caption(d, [{ text: `Phyllotaxis: n=${count} seeds at the golden angle 137.508°, r ∝ √n (Vogel's model). φ = ${PHI.toFixed(6)}.`, alpha: 0.7 }]);
}

/* Metatron's Cube: 13 circles of the "Fruit of Life" joined by all 78 segments between their centres. */
export function drawMetatron(d: DrawCtx) {
  const { ctx, R, f, p, pal, av } = d;
  const r = R * 0.15;
  const pts: [number, number][] = [[0, 0]];
  for (let i = 0; i < 6; i++) { const a = i * TAU / 6 - Math.PI / 2; pts.push([Math.cos(a) * 2 * r, Math.sin(a) * 2 * r]); }
  for (let i = 0; i < 6; i++) { const a = i * TAU / 6 - Math.PI / 2; pts.push([Math.cos(a) * 4 * r, Math.sin(a) * 4 * r]); }
  const rot = f.t * 0.03 * p.rotation;
  const u = (f.t * 3) % 110;
  ctx.save(); ctx.rotate(rot); ctx.scale(1 + 0.03 * av.bass, 1 + 0.03 * av.bass);
  let idx = 0;
  for (let i = 0; i < pts.length; i++) for (let j = i + 1; j < pts.length; j++) {
    const a = reveal(u, idx * 1.0); idx++;
    if (a <= 0) continue;
    const [x1, y1] = pts[i], [x2, y2] = pts[j];
    ctx.globalAlpha = 0.75;
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x1 + (x2 - x1) * a, y1 + (y2 - y1) * a);
    ctx.strokeStyle = cosPal(pal, idx / 78 + f.t * 0.01, av.hue); ctx.lineWidth = 1.2; ctx.stroke();
  }
  ctx.globalAlpha = 0.9;
  pts.forEach(([x, y], i) => { ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.strokeStyle = i === 0 ? pal.swatch[4] : pal.swatch[3]; ctx.lineWidth = 1.6; ctx.stroke(); });
  ctx.restore(); ctx.globalAlpha = 1;
  caption(d, [{ text: "Metatron's Cube: 13 equal circles; joining all 78 centre pairs reveals 2-D projections of Platonic solids (cube, tetrahedron, octahedron).", alpha: 0.7 }]);
}

/* Interlocking polygons: nested regular polygons and star polygons rotating at harmonic rates. */
export function drawPolygons(d: DrawCtx) {
  const { ctx, R, f, p, pal, av } = d;
  const L = Math.max(3, Math.round(p.layers + 3));
  for (let i = 0; i < L; i++) {
    const n = 3 + i;
    const r = R * 0.92 * Math.pow(0.86, i) * (1 + 0.02 * av.bass);
    const rot = f.t * 0.05 * p.rotation * (i % 2 ? -1 : 1) / (1 + i * 0.3);
    ctx.strokeStyle = cosPal(pal, i / L + f.t * 0.01, av.hue);
    ctx.lineWidth = 1.5;
    polyPath(ctx, 0, 0, r, n, rot); ctx.stroke();
    if (n >= 5 && p.complexity > 0.3) { ctx.globalAlpha = 0.6; starLines(ctx, 0, 0, r, n, Math.floor((n - 1) / 2), rot); ctx.stroke(); ctx.globalAlpha = 1; }
    ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.strokeStyle = withAlpha(pal.swatch[3], 0.15); ctx.stroke();
  }
  caption(d, [{ text: 'Regular n-gons and star polygons {n/k}; rotation rates in simple integer ratios produce periodic alignments.', alpha: 0.7 }]);
}

/* Recursive geometry: an animated Pythagoras tree (each square spawns two at a varying angle). */
export function drawRecursive(d: DrawCtx) {
  const { ctx, R, f, p, pal, av } = d;
  const depth = Math.min(12, Math.round(p.depth) + 5);
  const ang = Math.PI / 4 + Math.sin(f.t * 0.2) * 0.25 * (0.5 + p.complexity) + av.mid * 0.1;
  const s0 = R * 0.32;
  const sq = (x: number, y: number, s: number, a: number, lvl: number) => {
    if (lvl > depth || s < 0.8) return;
    ctx.save(); ctx.translate(x, y); ctx.rotate(a);
    ctx.fillStyle = cosPal(pal, lvl / depth * 0.8 + f.t * 0.01, av.hue);
    ctx.globalAlpha = 0.85; ctx.fillRect(0, -s, s, s);
    ctx.restore();
    const ca = Math.cos(a), sa = Math.sin(a);
    // top-left corner of the square
    const tlx = x + s * sa, tly = y - s * ca;
    const s1 = s * Math.cos(ang), s2 = s * Math.sin(ang);
    sq(tlx, tly, s1, a - ang, lvl + 1);
    const a2 = a - ang + Math.PI / 2;
    sq(tlx + s1 * Math.cos(a - ang), tly + s1 * Math.sin(a - ang), s2, a2, lvl + 1);
  };
  sq(-s0 / 2, R * 0.9, s0, 0, 0);
  ctx.globalAlpha = 1;
  caption(d, [{ text: `Pythagoras tree, depth ${depth}: each square sprouts two whose areas sum to its own (a² = b² + c²).`, alpha: 0.7 }]);
}
