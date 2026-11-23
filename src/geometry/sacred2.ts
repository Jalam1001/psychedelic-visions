/**
 * Sacred geometry, rich-imagery renderers (draft 4): glowing gold-on-indigo line art with translucent fills,
 * depth, particles and continuous transformation. All constructions are exact mathematics drawn procedurally.
 */
import type { DrawCtx, DrawFn } from '../views/CanvasView';
import { art, cached, glow, rgba, rng, smooth, TAU } from './rich';

const coverR = (W: number, H: number) => Math.hypot(W, H) / 2;
const PHI = (1 + Math.sqrt(5)) / 2;
const GOLD = '#f5c96a';
const HUES = ['#ffcf6a', '#ff8a3d', '#ff4f8b', '#b45cff', '#4f8dff', '#2fd6c8'];

function background(d: DrawCtx) {
  const { ctx, W, H, dpr } = d; const neb = art('helix-nebula');
  const c = cached('sacred-bg' + (neb ? 'n' : ''), W, H, Math.min(dpr, 1.25), (x) => {
    const CR = coverR(W, H);
    const g = x.createRadialGradient(0, 0, 0, 0, 0, CR); g.addColorStop(0, '#2a1a6e'); g.addColorStop(0.55, '#140c44'); g.addColorStop(1, '#05041a');
    x.fillStyle = g; x.fillRect(-CR, -CR, 2 * CR, 2 * CR);
    if (neb) { // NASA Helix Nebula photo (public domain), cover-fit, blended softly
      const s = Math.max(W / neb.naturalWidth, H / neb.naturalHeight) * 1.1;
      x.globalAlpha = 0.32; x.globalCompositeOperation = 'screen';
      x.drawImage(neb, (-neb.naturalWidth * s) / 2, (-neb.naturalHeight * s) / 2, neb.naturalWidth * s, neb.naturalHeight * s);
      x.globalAlpha = 1; x.globalCompositeOperation = 'source-over';
    }
    const r = rng(3);
    for (let i = 0; i < 420; i++) { x.fillStyle = `rgba(255,${200 + r() * 55},${180 + r() * 75},${0.2 + r() * 0.7})`; x.beginPath(); x.arc((r() - 0.5) * W, (r() - 0.5) * H, r() * 1.3 + 0.2, 0, TAU); x.fill(); }
  });
  ctx.drawImage(c, -W / 2, -H / 2, W, H);
}
function particles(ctx: CanvasRenderingContext2D, W: number, H: number, t: number, n = 90, seed = 7) {
  const CR = coverR(W, H); const r = rng(seed);
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < n; i++) {
    const a0 = r() * TAU, sp = 0.03 + r() * 0.05, d = ((r() + t * sp * 0.4) % 1) * CR; const a = a0 + t * sp * (r() > 0.5 ? 1 : -1);
    const s = 0.8 + r() * 2; ctx.fillStyle = rgba(HUES[i % 6], 0.55 * (0.4 + 0.6 * Math.sin(t * 2 + i) ** 2));
    ctx.beginPath(); ctx.arc(Math.cos(a) * d, Math.sin(a) * d, s, 0, TAU); ctx.fill();
  }
  ctx.restore();
}
function orb(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, col: string, a = 1) {
  const g = ctx.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, `rgba(255,255,240,${a})`); g.addColorStop(0.3, rgba(col, 0.8 * a)); g.addColorStop(1, rgba(col, 0));
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
}

// ---------- 3D helpers ----------
type V = [number, number, number];
const rot3 = ([x, y, z]: V, ax: number, ay: number, az: number): V => {
  let c = Math.cos(ax), s = Math.sin(ax); [y, z] = [y * c - z * s, y * s + z * c];
  c = Math.cos(ay); s = Math.sin(ay); [x, z] = [x * c + z * s, -x * s + z * c];
  c = Math.cos(az); s = Math.sin(az); [x, y] = [x * c - y * s, x * s + y * c];
  return [x, y, z];
};
const proj = ([x, y, z]: V, S: number, dist = 4): [number, number, number] => { const k = dist / (dist - z); return [x * S * k, y * S * k, z]; };

// ---------- Flower of Life ----------
export const drawFlower2: DrawFn = (d) => {
  const { ctx, W, H, R, f, av } = d; background(d);
  const CR = coverR(W, H); const r = R * 0.3; const t = f.t;
  ctx.save(); ctx.rotate(t * 0.03);
  // faint full-screen lattice of circles
  const lat = new Path2D(); const hx = r, hy = r * Math.sqrt(3) / 2; const nx = Math.ceil(CR / hx) + 1, ny = Math.ceil(CR / hy) + 1;
  for (let j = -ny; j <= ny; j++) for (let i = -nx; i <= nx; i++) { const x = (i + (j & 1) * 0.5) * hx, y = j * hy; if (Math.hypot(x, y) > CR + r) continue; lat.moveTo(x + r, y); lat.arc(x, y, r, 0, TAU); }
  ctx.strokeStyle = 'rgba(140,160,255,0.16)'; ctx.lineWidth = 1; ctx.stroke(lat);
  // growth: seed of life (7) -> flower of life (19) -> fruit ring (37) over a 30 s cycle
  const centres: [number, number, number][] = [[0, 0, 0]];
  for (let ring = 1; ring <= 3; ring++) for (let s = 0; s < 6; s++) for (let k = 0; k < ring; k++) {
    const a = (s * Math.PI) / 3, b = ((s + 2) * Math.PI) / 3;
    centres.push([(Math.cos(a) * ring + Math.cos(b) * k) * r, (Math.sin(a) * ring + Math.sin(b) * k) * r, ring]);
  }
  const cyc = 30, ph = ((t % cyc) + cyc) % cyc;
  const shown = Math.min(centres.length, 1 + Math.floor(smooth(0, 20, ph) * (centres.length - 1) + 0.0001)) * (1 - smooth(27, 30, ph)) + smooth(27, 30, ph) * 7;
  const breath = 1 + 0.03 * Math.sin(t * 0.8) + 0.03 * av.pulse;
  ctx.scale(breath, breath);
  const op = ctx.globalCompositeOperation; ctx.globalCompositeOperation = 'lighter';
  const lines = new Path2D();
  centres.forEach(([x, y, ring], i) => {
    const a = Math.max(0, Math.min(1, shown - i)); if (a <= 0) return;
    ctx.fillStyle = rgba(HUES[(i + ring) % 6], 0.07 * a); ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
    lines.moveTo(x + r * a, y); lines.arc(x, y, r * a, 0, TAU);
  });
  ctx.globalCompositeOperation = op;
  glow(ctx, lines, GOLD, 1.4, 0.75);
  // enclosing circles
  const enc = new Path2D(); enc.arc(0, 0, r * 3, 0, TAU); enc.moveTo(r * 3.15, 0); enc.arc(0, 0, r * 3.15, 0, TAU);
  glow(ctx, enc, '#9fb4ff', 1.2, smooth(8, 20, ph));
  // pulsing vesica piscis highlight that rotates around the centre
  const va = Math.floor(t / 3) % 6 * (Math.PI / 3); const vk = Math.sin(((t % 3) / 3) * Math.PI);
  ctx.save(); ctx.rotate(va); ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.clip(); ctx.beginPath(); ctx.arc(r, 0, r, 0, TAU);
  ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = `rgba(255,190,90,${0.35 * vk})`; ctx.fill(); ctx.restore();
  ctx.restore();
  particles(ctx, W, H, t);
};

// ---------- Fibonacci / golden spiral ----------
export const drawFibonacci2: DrawFn = (d) => {
  const { ctx, W, H, R, f, av } = d; background(d);
  const CR = coverR(W, H); const t = f.t;
  // sunflower phyllotaxis (Vogel): r = c*sqrt(n), theta = n * golden angle
  const ga = Math.PI * (3 - Math.sqrt(5)); const c = R * 0.045; const N = Math.min(5000, Math.ceil((CR / c) ** 2));
  const buckets: Path2D[] = Array.from({ length: 21 }, () => new Path2D());
  const rotS = t * 0.04; const wave = t * 1.2;
  for (let n = 1; n < N; n++) {
    const rr = c * Math.sqrt(n); const a = n * ga + rotS; const x = Math.cos(a) * rr, y = Math.sin(a) * rr;
    const s = c * (0.32 + 0.12 * Math.sin(Math.sqrt(n) * 0.9 - wave)); const p = buckets[n % 21];
    p.moveTo(x + s, y); p.arc(x, y, s, 0, TAU);
  }
  buckets.forEach((p, i) => { const k = 1 - Math.abs(i / 10.5 - 1); ctx.fillStyle = `rgba(255,${Math.round(220 - 160 * k)},${Math.round(90 + 120 * k)},${0.85 - 0.25 * k})`; ctx.fill(p); });
  // golden spiral with nautilus chambers, infinite zoom by phi per quarter turn
  const b = Math.log(PHI) / (Math.PI / 2); const z = (t * 0.12) % 1; const scale = Math.pow(PHI, z * 4);
  ctx.save(); ctx.rotate(-z * TAU + t * 0.0); ctx.scale(scale, scale);
  const a0 = R * 0.012; const th0 = -6 * Math.PI, th1 = 3 * Math.PI;
  const rs = (th: number) => a0 * Math.exp(b * (th + 6 * Math.PI));
  // chambers: regions between whorl th and th-2π, split by septa every 30°
  const op = ctx.globalCompositeOperation; ctx.globalCompositeOperation = 'lighter';
  const sep = Math.PI / 6;
  ctx.save(); ctx.beginPath(); ctx.arc(0, 0, R * 0.95 / scale, 0, TAU); ctx.clip();
  for (let th = th0 + TAU; th < th1; th += sep) {
    const p = new Path2D(); const steps = 6;
    for (let k = 0; k <= steps; k++) { const u = th + (sep * k) / steps; const r = rs(u); k ? p.lineTo(Math.cos(u) * r, Math.sin(u) * r) : p.moveTo(Math.cos(u) * r, Math.sin(u) * r); }
    for (let k = steps; k >= 0; k--) { const u = th + (sep * k) / steps - TAU; const r = rs(u); p.lineTo(Math.cos(u) * r, Math.sin(u) * r); }
    p.closePath(); const i = Math.round((th - th0) / sep);
    ctx.fillStyle = rgba(HUES[i % 6], 0.2); ctx.fill(p);
  }
  ctx.restore();
  ctx.globalCompositeOperation = op;
  const sp = new Path2D(); const septa = new Path2D();
  for (let th = th0, k = 0; th <= th1; th += 0.05, k++) { const r = rs(th); k ? sp.lineTo(Math.cos(th) * r, Math.sin(th) * r) : sp.moveTo(Math.cos(th) * r, Math.sin(th) * r); }
  for (let th = th0 + TAU; th < th1; th += sep) { const r1 = rs(th), r2 = rs(th - TAU); const m = (r1 + r2) / 2; const ax = Math.cos(th), ay = Math.sin(th);
    septa.moveTo(ax * r2, ay * r2); septa.quadraticCurveTo(Math.cos(th + 0.25) * m, Math.sin(th + 0.25) * m, ax * r1, ay * r1); }
  glow(ctx, sp, GOLD, (1.8 + av.pulse) / scale, 0.95);
  ctx.restore();
  // phi label & glow at the pole
  orb(ctx, 0, 0, R * 0.08 * (1 + 0.3 * Math.sin(t * 2)), '#ffcf6a');
  particles(ctx, W, H, t, 60, 11);
};

// ---------- Metatron's cube in 3D ----------
const CUBE: V[] = [-1, 1].flatMap((x) => [-1, 1].flatMap((y) => [-1, 1].map((z) => [x, y, z] as V)));
const OCTA: V[] = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]];
const edgesOf = (vs: V[]) => { let md = Infinity; const e: [number, number][] = [];
  for (let i = 0; i < vs.length; i++) for (let j = i + 1; j < vs.length; j++) md = Math.min(md, Math.hypot(vs[i][0] - vs[j][0], vs[i][1] - vs[j][1], vs[i][2] - vs[j][2]));
  for (let i = 0; i < vs.length; i++) for (let j = i + 1; j < vs.length; j++) if (Math.hypot(vs[i][0] - vs[j][0], vs[i][1] - vs[j][1], vs[i][2] - vs[j][2]) < md * 1.01) e.push([i, j]);
  return e; };
export const drawMetatron2: DrawFn = (d) => {
  const { ctx, W, H, R, f, av } = d; background(d); const t = f.t;
  const s = R * 0.36;
  const pts: V[] = [[0, 0, 0]];
  for (let k = 0; k < 6; k++) { const a = (k * Math.PI) / 3 + Math.PI / 6; pts.push([Math.cos(a), Math.sin(a), 0]); }
  for (let k = 0; k < 6; k++) { const a = (k * Math.PI) / 3 + Math.PI / 6; pts.push([2 * Math.cos(a), 2 * Math.sin(a), 0]); }
  const ax = 0.55 * Math.sin(t * 0.21), ay = 0.6 * Math.sin(t * 0.17), az = t * 0.06;
  const P = pts.map((p) => proj(rot3(p, ax, ay, az), s, 6));
  // 78 lines
  const L = new Path2D();
  for (let i = 0; i < 13; i++) for (let j = i + 1; j < 13; j++) { L.moveTo(P[i][0], P[i][1]); L.lineTo(P[j][0], P[j][1]); }
  // translucent hexagram fills
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  for (const set of [[7, 9, 11], [8, 10, 12], [1, 3, 5], [2, 4, 6]]) { ctx.beginPath(); set.forEach((k, i) => (i ? ctx.lineTo(P[k][0], P[k][1]) : ctx.moveTo(P[k][0], P[k][1]))); ctx.closePath(); ctx.fillStyle = rgba(HUES[set[0] % 6], 0.09); ctx.fill(); }
  ctx.restore();
  glow(ctx, L, GOLD, 0.9 + 0.4 * av.pulse, 0.6);
  // circles (Fruit of Life) as ellipses under the same tilt: approximate with projected polylines
  const C = new Path2D();
  for (const p of pts) { for (let k = 0; k <= 32; k++) { const a = (k / 32) * TAU; const q = proj(rot3([p[0] + Math.cos(a) * 0.5, p[1] + Math.sin(a) * 0.5, 0], ax, ay, az), s, 6); k ? C.lineTo(q[0], q[1]) : C.moveTo(q[0], q[1]); } }
  glow(ctx, C, '#8fb0ff', 1.0, 0.55);
  // nested cube and octahedron rotating in true 3D
  const solids: [V[], number, string, number][] = [[CUBE, 0.62, '#2fd6c8', 1], [OCTA, 1.0, '#ff4f8b', -1.4]];
  for (const [vs, sc, col, sp] of solids) {
    const Q = vs.map((v) => proj(rot3([v[0] * sc, v[1] * sc, v[2] * sc], t * 0.4 * sp, t * 0.3 * sp, t * 0.1), s, 6));
    const E = new Path2D(); for (const [i, j] of edgesOf(vs)) { E.moveTo(Q[i][0], Q[i][1]); E.lineTo(Q[j][0], Q[j][1]); }
    glow(ctx, E, col, 1.3, 0.9);
  }
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  P.forEach((p, i) => orb(ctx, p[0], p[1], s * (0.16 + 0.04 * Math.sin(t * 2 + i)) * (1 + p[2] * 0.05), HUES[i % 6]));
  ctx.restore();
  particles(ctx, W, H, t, 90, 5);
};

// ---------- Platonic solids ----------
type Solid = { name: string; v: V[]; faces: number[][] };
function hull(v: V[]): number[][] { // faces of a convex polyhedron whose vertices lie on a sphere
  const faces: number[][] = []; const seen = new Set<string>(); const n = v.length;
  const sub = (a: V, b: V): V => [a[0] - b[0], a[1] - b[1], a[2] - b[2]]; const cr = (a: V, b: V): V => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]; const dot = (a: V, b: V) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) for (let k = j + 1; k < n; k++) {
    let nr = cr(sub(v[j], v[i]), sub(v[k], v[i])); const L = Math.hypot(...nr); if (L < 1e-9) continue; nr = [nr[0] / L, nr[1] / L, nr[2] / L];
    let dd = dot(nr, v[i]); if (dd < 0) { nr = [-nr[0], -nr[1], -nr[2]]; dd = -dd; }
    if (v.some((p) => dot(nr, p) > dd + 1e-6)) continue;
    const on = v.map((p, m) => (Math.abs(dot(nr, p) - dd) < 1e-6 ? m : -1)).filter((m) => m >= 0); const key = on.join(','); if (seen.has(key)) continue; seen.add(key);
    const c: V = [0, 0, 0]; on.forEach((m) => { c[0] += v[m][0] / on.length; c[1] += v[m][1] / on.length; c[2] += v[m][2] / on.length; });
    const u = sub(v[on[0]], c); const w = cr(nr, u);
    on.sort((a, b) => { const pa = sub(v[a], c), pb = sub(v[b], c); return Math.atan2(dot(pa, w), dot(pa, u)) - Math.atan2(dot(pb, w), dot(pb, u)); });
    faces.push(on);
  }
  return faces;
}
const nrm = (vs: V[]) => vs.map((p) => { const l = Math.hypot(...p); return [p[0] / l, p[1] / l, p[2] / l] as V; });
const ICO: V[] = nrm([[-1, PHI, 0], [1, PHI, 0], [-1, -PHI, 0], [1, -PHI, 0], [0, -1, PHI], [0, 1, PHI], [0, -1, -PHI], [0, 1, -PHI], [PHI, 0, -1], [PHI, 0, 1], [-PHI, 0, -1], [-PHI, 0, 1]]);
const DOD: V[] = nrm([...CUBE, ...[-1, 1].flatMap((a) => [-1, 1].flatMap((b) => [[0, a / PHI, b * PHI], [a / PHI, b * PHI, 0], [a * PHI, 0, b / PHI]] as V[]))]);
const SOLIDS: Solid[] = [
  { name: 'Tetrahedron', v: nrm([[1, 1, 1], [1, -1, -1], [-1, 1, -1], [-1, -1, 1]]) },
  { name: 'Cube', v: nrm(CUBE) }, { name: 'Octahedron', v: OCTA }, { name: 'Dodecahedron', v: DOD }, { name: 'Icosahedron', v: ICO },
].map((s) => ({ ...s, faces: hull(s.v) }));

function drawSolid(ctx: CanvasRenderingContext2D, s: Solid, S: number, ax: number, ay: number, az: number, hue0: number, lw: number, alpha = 1) {
  const P = s.v.map((p) => rot3(p, ax, ay, az)); const Q = P.map((p) => proj(p, S, 3.5));
  const fs = s.faces.map((fc, i) => ({ fc, i, z: fc.reduce((a, m) => a + P[m][2], 0) / fc.length })).sort((a, b) => a.z - b.z);
  for (const { fc, i, z } of fs) {
    ctx.beginPath(); fc.forEach((m, k) => (k ? ctx.lineTo(Q[m][0], Q[m][1]) : ctx.moveTo(Q[m][0], Q[m][1]))); ctx.closePath();
    ctx.fillStyle = rgba(HUES[(i + hue0) % 6], (0.14 + 0.16 * (z + 1) / 2) * alpha); ctx.fill();
  }
  const E = new Path2D(); for (const fc of s.faces) fc.forEach((m, k) => { const nx = fc[(k + 1) % fc.length]; E.moveTo(Q[m][0], Q[m][1]); E.lineTo(Q[nx][0], Q[nx][1]); });
  glow(ctx, E, GOLD, lw, 0.85 * alpha);
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  Q.forEach((q) => orb(ctx, q[0], q[1], lw * 5 * (1 + q[2] * 0.3), '#ffd27a', alpha)); ctx.restore();
}
export const drawPlatonic: DrawFn = (d) => {
  const { ctx, W, H, R, f, av } = d; background(d); const t = f.t;
  const cyc = 9; const idx = Math.floor(t / cyc); const ph = t - idx * cyc; const cur = SOLIDS[((idx % 5) + 5) % 5];
  const k = smooth(0, 1.2, ph) * (1 - smooth(cyc - 1, cyc, ph));
  // orbiting ring of all five solids (ellipse matches the screen shape so phones are filled top to bottom)
  const rx = W * 0.36, ry = H * 0.37;
  for (let i = 0; i < 5; i++) { const a = (i * TAU) / 5 + t * 0.08 - Math.PI / 2; const x = Math.cos(a) * rx, y = Math.sin(a) * ry;
    ctx.save(); ctx.translate(x, y); drawSolid(ctx, SOLIDS[i], R * 0.2, t * 0.5 + i, t * 0.4, i, i, 0.9, 0.85); ctx.restore(); }
  ctx.save(); const sc = R * 0.62 * (0.6 + 0.4 * k) * (1 + 0.03 * av.pulse);
  drawSolid(ctx, cur, sc, t * 0.33, t * 0.47, t * 0.11, idx, 1.8, Math.max(0.05, k));
  ctx.restore();
  // connecting circle
  const c = new Path2D(); c.ellipse(0, 0, rx, ry, 0, 0, TAU); glow(ctx, c, '#8fb0ff', 0.8, 0.4);
  particles(ctx, W, H, t, 70, 13);
};

// ---------- Torus ----------
export const drawTorus: DrawFn = (d) => {
  const { ctx, W, H, R, f, av } = d; background(d); const t = f.t;
  const S = R * 0.6; const Rm = 1, rm = 0.48;
  const ax = 1.05 + 0.25 * Math.sin(t * 0.2), ay = t * 0.12, az = 0.3 * Math.sin(t * 0.13);
  const pt = (u: number, v: number) => proj(rot3([(Rm + rm * Math.cos(v)) * Math.cos(u), (Rm + rm * Math.cos(v)) * Math.sin(u), rm * Math.sin(v)], ax, ay, az), S, 4);
  const NU = 48, NV = 24; const flow = t * 0.4;
  // meridians coloured by hue band, drawn in depth buckets (back faint, front bright)
  const back: Path2D[] = HUES.map(() => new Path2D()), front: Path2D[] = HUES.map(() => new Path2D());
  for (let i = 0; i < NU; i++) { const u = (i / NU) * TAU + flow * 0.1; let prev: [number, number, number] | null = null;
    for (let k = 0; k <= NV; k++) { const q = pt(u, (k / NV) * TAU + flow); if (prev) { const tgt = (q[2] + prev[2]) / 2 > 0 ? front : back; tgt[i % 6].moveTo(prev[0], prev[1]); tgt[i % 6].lineTo(q[0], q[1]); } prev = q; } }
  const par = new Path2D(), parB = new Path2D();
  for (let k = 0; k < NV; k++) { const v = (k / NV) * TAU + flow; let prev: [number, number, number] | null = null;
    for (let i = 0; i <= NU; i++) { const q = pt((i / NU) * TAU + flow * 0.1, v); if (prev) { const tgt = (q[2] + prev[2]) / 2 > 0 ? par : parB; tgt.moveTo(prev[0], prev[1]); tgt.lineTo(q[0], q[1]); } prev = q; } }
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  back.forEach((p, i) => { ctx.strokeStyle = rgba(HUES[i], 0.22); ctx.lineWidth = 1; ctx.stroke(p); });
  ctx.strokeStyle = 'rgba(160,180,255,0.15)'; ctx.stroke(parB);
  ctx.restore();
  front.forEach((p, i) => glow(ctx, p, HUES[i], 1.0 + 0.4 * av.pulse, 0.65));
  glow(ctx, par, GOLD, 0.7, 0.45);
  // particles flowing around the torus on (1,3) toroidal knots
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 120; i++) { const s = (i / 120) * TAU + t * 0.35; const q = pt(s, 3 * s + i * 0.5); orb(ctx, q[0], q[1], 3 + 2.5 * (q[2] + 1), HUES[i % 6], 0.7 + 0.3 * q[2]); }
  ctx.restore();
  orb(ctx, 0, 0, R * 0.12 * (1 + 0.2 * Math.sin(t * 1.5)), '#ffcf6a');
  particles(ctx, W, H, t, 60, 17);
};
