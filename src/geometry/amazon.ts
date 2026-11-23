/**
 * Amazonian Visions — procedural patterns *inspired by* (not copied from) Shipibo-Konibo kené and the
 * Peruvian Amazonian visionary painting of Pablo Amaringo and the Usko-Ayar school. Nothing here is traced
 * from an artwork; the generators follow published descriptions of the design logic:
 *  - kené are 'paths' (kano): bold primary lines (xao / cánoa kené: straight, orthogonal and stepped) organised
 *    around focal crosses (kurús kené) with bilateral / four-fold symmetry, the spaces between filled with
 *    fine meandering secondary lines; maya kené uses curved, circular / rhomboid line-work;
 *  - Amaringo's visions: luminous serpents (Sachamama / Yakumama / Huairamama), radiating coloured halos
 *    ('tingunas'), spirit lights and a dense jungle canopy, in saturated jewel tones on a night ground.
 * Palettes: cloth / ceramic colours sampled from CC0 photographs on Wikimedia Commons (see CREDITS.md).
 */
import type { DrawCtx, DrawFn } from '../views/CanvasView';

type Pt = [number, number];
const rng = (seed: number) => () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };

export interface KeneStyle { ground: string; bold: string; fine: string; accent: string; glow: string; radius: number; border: boolean; threads?: string[] }
export const KENE_PAINTED: KeneStyle = { ground: '#e6e0d0', bold: '#26211c', fine: '#3b352c', accent: '#7a2f22', glow: '255,206,120', radius: 0.18, border: true };
export const KENE_EMBROIDERY: KeneStyle = { ground: '#151719', bold: '#f1eee4', fine: '#9fb7ae', accent: '#c4416e', glow: '120,255,220', radius: 0.3, border: true,
  threads: ['#f1eee4', '#f2c641', '#e5527d', '#43c6b4', '#7fd35a', '#f08a3b'] };
export const KENE_MAYA: KeneStyle = { ground: '#d9bfa5', bold: '#2a2022', fine: '#4a3a35', accent: '#84404f', glow: '255,190,140', radius: 0.95, border: false };

interface Design { bold: Pt[][]; fine: Pt[][]; g: number; nx: number; ny: number; rings: Pt[]; cache?: HTMLCanvasElement; key: string }

/** Build one kené design on a grid (cell g px) for the quadrant x>=0,y>=0; mirrored at draw time. */
function makeDesign(seed: number, W: number, H: number, complexity: number, maya: boolean): Design {
  const r = rng(seed);
  const g = Math.max(11, Math.min(W, H) / (17 + complexity * 14));
  const nx = Math.ceil(W / 2 / g) + 1, ny = Math.ceil(H / 2 / g) + 1;
  const occ = new Uint8Array((nx + 2) * (ny + 2));
  const id = (x: number, y: number) => (y + 1) * (nx + 2) + (x + 1);
  const free = (x: number, y: number) => x >= 0 && y >= 0 && x <= nx && y <= ny && !occ[id(x, y)];
  const mark = (pts: Pt[]) => { for (let i = 1; i < pts.length; i++) { const [x0, y0] = pts[i - 1], [x1, y1] = pts[i]; const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)); for (let k = 0; k <= n; k++) { const x = Math.round(x0 + (x1 - x0) * k / (n || 1)), y = Math.round(y0 + (y1 - y0) * k / (n || 1)); if (x >= -1 && y >= -1 && x <= nx && y <= ny) occ[id(x, y)] = 1; } } };
  const bold: Pt[][] = [];
  const add = (pts: Pt[]) => { bold.push(pts); mark(pts); };
  const rings: Pt[] = [];
  // focal centre: kurús (stepped cross) inside a stepped rhombus
  const c1 = 2 + Math.floor(r() * 2);
  add([[0, c1 + 1], [1, c1 + 1], [1, 1], [c1 + 1, 1], [c1 + 1, 0]]);
  const s = c1 + 3;
  add([[0, s + 1], [1, s + 1], [1, s], [2, s], [2, s - 1], [3, s - 1], [3, s - 2], [s - 2, 3], [s - 1, 3], [s - 1, 2], [s, 2], [s, 1], [s + 1, 1], [s + 1, 0]].filter(([x, y]) => x >= 0 && y >= 0) as Pt[]);
  rings.push([0, 0]);
  // secondary centres on a diamond lattice: small crosses
  const P = 7 + Math.floor(r() * 3);
  for (let j = 0; j * P <= ny + P; j++) for (let i = 0; i * P <= nx + P; i++) {
    if (i === 0 && j === 0) continue;
    if ((i + j) % 2) continue;
    const cx = i * P, cy = j * P;
    if (cx > nx + 2 || cy > ny + 2) continue;
    const a = 1 + Math.floor(r() * 2);
    const cross: Pt[] = [[cx - a, cy - a - 1], [cx - a, cy - a], [cx - a - 1, cy - a], [cx - a - 1, cy + a], [cx - a, cy + a], [cx - a, cy + a + 1], [cx + a, cy + a + 1], [cx + a, cy + a], [cx + a + 1, cy + a], [cx + a + 1, cy - a], [cx + a, cy - a], [cx + a, cy - a - 1], [cx - a, cy - a - 1]];
    add(cross); rings.push([cx, cy]);
  }
  // labyrinth paths: orthogonal walks with long straight runs, ending in square hooks
  const walks = Math.round(14 + complexity * 22 + (nx * ny) / 30);
  const dirs: Pt[] = [[1, 0], [0, 1], [-1, 0], [0, -1]];
  for (let w = 0; w < walks; w++) {
    let x = Math.floor(r() * (nx + 1)), y = Math.floor(r() * (ny + 1));
    if (!free(x, y)) continue;
    let d = Math.floor(r() * 4);
    const pts: Pt[] = [[x, y]];
    let steps = 0, run = 0;
    const maxSteps = 8 + Math.floor(r() * 26);
    while (steps < maxSteps) {
      if (run >= 2 + Math.floor(r() * 4) || !free(x + dirs[d][0], y + dirs[d][1])) {
        const turn = r() < 0.5 ? 1 : 3; const nd = (d + turn) % 4, od = (d + 4 - turn) % 4;
        if (free(x + dirs[nd][0], y + dirs[nd][1])) d = nd; else if (free(x + dirs[od][0], y + dirs[od][1])) d = od; else break;
        pts.push([x, y]); run = 0;
      }
      occ[id(x, y)] = 1; x += dirs[d][0]; y += dirs[d][1]; steps++; run++;
    }
    pts.push([x, y]);
    // hook: one tight inward square turn, as at the ends of many kené lines
    const hd = (d + 1) % 4; const hx = x + dirs[hd][0], hy = y + dirs[hd][1];
    if (free(hx, hy)) { pts.push([hx, hy]); const bx = hx - dirs[d][0], by = hy - dirs[d][1]; if (free(bx, by)) pts.push([bx, by]); }
    if (pts.length >= 3) { bold.push(pts); mark(pts); }
  }
  // fine filler lines: short, dense meanders in the free space between bold paths (sub-grid g/3)
  const fine: Pt[][] = [];
  const fs = 4, fx = (nx + 1) * fs, fy = (ny + 1) * fs;
  const focc = new Uint8Array((fx + 1) * (fy + 1));
  const near = (u: number, v: number) => occ[id(Math.round(u / fs), Math.round(v / fs))] && (u % fs === 0 || v % fs === 0);
  const ffree = (u: number, v: number) => u >= 0 && v >= 0 && u <= fx && v <= fy && !focc[v * (fx + 1) + u] && !near(u, v);
  for (let tries = 0; tries < fx * fy * 3; tries++) {
    let u = Math.floor(r() * fx), v = Math.floor(r() * fy);
    if (!ffree(u, v)) continue;
    let d = Math.floor(r() * 4); const pts: Pt[] = [[u / fs, v / fs]];
    let n = 0; const L = 10 + Math.floor(r() * 40);
    while (n < L) {
      focc[v * (fx + 1) + u] = 1;
      if (r() < (maya ? 0.25 : 0.45)) { const nd = (d + (r() < 0.5 ? 1 : 3)) % 4; if (ffree(u + dirs[nd][0], v + dirs[nd][1])) { d = nd; pts.push([u / fs, v / fs]); } }
      if (!ffree(u + dirs[d][0], v + dirs[d][1])) break;
      u += dirs[d][0]; v += dirs[d][1]; n++;
    }
    pts.push([u / fs, v / fs]);
    if (n >= 2) fine.push(pts);
  }
  return { bold, fine, g, nx, ny, rings, key: '' };
}

function strokePoly(ctx: CanvasRenderingContext2D, pts: Pt[], g: number, sx: number, sy: number, radius: number) {
  ctx.moveTo(pts[0][0] * g * sx, pts[0][1] * g * sy);
  if (radius <= 0.01) { for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0] * g * sx, pts[i][1] * g * sy); return; }
  for (let i = 1; i < pts.length - 1; i++) ctx.arcTo(pts[i][0] * g * sx, pts[i][1] * g * sy, pts[i + 1][0] * g * sx, pts[i + 1][1] * g * sy, g * radius);
  const l = pts[pts.length - 1]; ctx.lineTo(l[0] * g * sx, l[1] * g * sy);
}
const MIRRORS: Pt[] = [[1, 1], [-1, 1], [1, -1], [-1, -1]];

/** Render the static cloth (ground, fine lines, halos) into an offscreen canvas. */
function renderCloth(d: Design, st: KeneStyle, W: number, H: number, dpr: number) {
  const c = document.createElement('canvas'); c.width = Math.ceil(W * dpr); c.height = Math.ceil(H * dpr);
  const x = c.getContext('2d')!; x.setTransform(dpr, 0, 0, dpr, W * dpr / 2, H * dpr / 2);
  x.fillStyle = st.ground; x.fillRect(-W / 2, -H / 2, W, H);
  // subtle weave texture
  x.globalAlpha = 0.06; x.fillStyle = st.bold;
  for (let yy = -H / 2; yy < H / 2; yy += 3) x.fillRect(-W / 2, yy, W, 1);
  x.globalAlpha = 1; x.lineCap = 'round'; x.lineJoin = 'round';
  const g = d.g;
  // fine filler
  const fw = Math.max(0.9, g * 0.085);
  if (st.threads) {
    d.fine.forEach((pts, i) => { x.strokeStyle = st.threads![1 + (i % (st.threads!.length - 1))]; x.lineWidth = fw * 1.2; x.beginPath(); for (const [sx, sy] of MIRRORS) strokePoly(x, pts, g, sx, sy, st.radius * 0.33); x.stroke(); });
  } else {
    x.strokeStyle = st.fine; x.lineWidth = fw; x.beginPath();
    for (const pts of d.fine) for (const [sx, sy] of MIRRORS) strokePoly(x, pts, g, sx, sy, st.radius * 0.33);
    x.stroke();
  }
  // halos: clear ground around bold lines so they read as separate paths
  x.strokeStyle = st.ground; x.lineWidth = g * 0.55; x.beginPath();
  for (const pts of d.bold) for (const [sx, sy] of MIRRORS) strokePoly(x, pts, g, sx, sy, st.radius);
  x.stroke();
  // accent: painted cloth often has a second, red-brown line colour inside focal motifs
  x.strokeStyle = st.accent; x.lineWidth = g * 0.12; x.beginPath();
  for (const [cx, cy] of d.rings) for (const [sx, sy] of MIRRORS) { const X = cx * g * sx, Y = cy * g * sy; x.moveTo(X, Y - g * 0.35); x.lineTo(X + g * 0.35, Y); x.lineTo(X, Y + g * 0.35); x.lineTo(X - g * 0.35, Y); x.closePath(); }
  x.stroke();
  if (st.border) {
    const m = Math.min(W, H) * 0.035, bw = m * 1.1;
    x.lineWidth = bw; x.strokeStyle = st.bold; x.strokeRect(-W / 2 + m, -H / 2 + m, W - 2 * m, H - 2 * m);
  }
  return c;
}

const designs = new Map<string, { cur: Design; prev?: Design; born: number }>();

export function makeKeneDraw(st: KeneStyle, name: string, maya = false): DrawFn {
  return ({ ctx, W, H, dpr, f, p, av }: DrawCtx) => {
    const PERIOD = 26; // artistic seconds per design
    const gen = Math.floor(f.t / PERIOD);
    const k = `${name}:${Math.round(W)}x${Math.round(H)}:${Math.round(p.complexity * 10)}`;
    let slot = designs.get(name);
    if (!slot || slot.cur.key !== `${k}:${gen}`) {
      const nd = makeDesign(1000 + gen * 7919 + (maya ? 17 : 0) + (st.threads ? 3 : 0), W, H, p.complexity, maya);
      nd.key = `${k}:${gen}`;
      nd.cache = renderCloth(nd, st, W, H, Math.min(dpr, 2));
      const resized = slot && !slot.cur.key.startsWith(k);
      slot = { cur: nd, prev: resized ? undefined : slot?.cur, born: f.t };
      designs.set(name, slot);
    }
    const age = f.t - slot.born;
    const reveal = Math.min(1, age / 9);
    const g = slot.cur.g;
    const breathe = 1 + 0.012 * Math.sin(f.t * 0.6) + av.bass * 0.02;
    ctx.save(); ctx.scale(breathe, breathe);
    if (slot.prev?.cache && reveal < 1) { ctx.globalAlpha = 1; ctx.drawImage(slot.prev.cache, -W / 2, -H / 2, W, H); }
    ctx.globalAlpha = slot.prev ? Math.min(1, age / 3) : 1;
    ctx.drawImage(slot.cur.cache!, -W / 2, -H / 2, W, H);
    ctx.globalAlpha = 1;
    // bold primary lines 'drawn in' like a design being sung / embroidered, growing out from the centre
    const lw = g * (0.3 + av.bass * 0.05);
    const total = g * 70;
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.setLineDash([total * reveal, total]);
    if (st.threads) {
      slot.cur.bold.forEach((pts, i) => { ctx.strokeStyle = i < 2 ? st.threads![0] : st.threads![i % st.threads!.length]; ctx.lineWidth = lw; ctx.beginPath(); for (const [sx, sy] of MIRRORS) strokePoly(ctx, pts, g, sx, sy, st.radius); ctx.stroke(); });
    } else {
      ctx.strokeStyle = st.bold; ctx.lineWidth = lw; ctx.beginPath();
      for (const pts of slot.cur.bold) for (const [sx, sy] of MIRRORS) strokePoly(ctx, pts, g, sx, sy, st.radius);
      ctx.stroke();
    }
    // the 'song' travelling along the paths: soft light pulses following the bold lines (music-driven)
    ctx.globalCompositeOperation = st.threads ? 'lighter' : 'source-over';
    ctx.setLineDash([g * 0.9, g * 7]);
    ctx.lineDashOffset = -f.t * g * 2.2;
    ctx.strokeStyle = `rgba(${st.glow},${(st.threads ? 0.5 : 0.35) + av.pulse * 0.4})`;
    ctx.lineWidth = lw * (st.threads ? 1.9 : 0.55);
    ctx.beginPath();
    for (const pts of slot.cur.bold) for (const [sx, sy] of MIRRORS) strokePoly(ctx, pts, g, sx, sy, st.radius);
    ctx.stroke();
    ctx.setLineDash([]); ctx.lineDashOffset = 0; ctx.globalCompositeOperation = 'source-over';
    ctx.restore();
  };
}

// ---------------------------------------------------------------- visionary serpents (Amaringo-inspired)
// Original composition in the *spirit* of Amazonian visionary painting: every area is ornamented, serpents carry
// geometric scale patterns with glowing edges, layered foliage and flowers frame the scene, spirit lights radiate.
const JEWEL = ['#29e3a0', '#35d9ff', '#ffd34a', '#ff4fb0', '#5b7cff', '#c06bff', '#ff8a3a', '#9dff5a'];
const rgba = (hex: string, a: number) => { const n = parseInt(hex.slice(1), 16); return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`; };
interface VisionLayers { key: string; ornament: HTMLCanvasElement; far: HTMLCanvasElement; near: HTMLCanvasElement; orb: HTMLCanvasElement }
let layers: VisionLayers | null = null;
const mk = (W: number, H: number, dpr: number) => { const c = document.createElement('canvas'); c.width = Math.ceil(W * dpr); c.height = Math.ceil(H * dpr); const x = c.getContext('2d')!; x.setTransform(dpr, 0, 0, dpr, 0, 0); return { c, x }; };

function leafShape(x: CanvasRenderingContext2D, len: number, wid: number) {
  x.beginPath(); x.moveTo(0, 0); x.bezierCurveTo(len * 0.25, -wid, len * 0.75, -wid * 0.8, len, 0); x.bezierCurveTo(len * 0.75, wid * 0.8, len * 0.25, wid, 0, 0);
}
function drawLeaf(x: CanvasRenderingContext2D, px: number, py: number, len: number, ang: number, hue: number, light: number, r: () => number) {
  x.save(); x.translate(px, py); x.rotate(ang);
  const wid = len * (0.18 + r() * 0.14);
  const g = x.createLinearGradient(0, -wid, 0, wid);
  g.addColorStop(0, `hsl(${hue},70%,${light + 10}%)`); g.addColorStop(0.5, `hsl(${hue + 10},80%,${light}%)`); g.addColorStop(1, `hsl(${hue - 15},65%,${Math.max(3, light - 6)}%)`);
  leafShape(x, len, wid); x.fillStyle = g; x.fill();
  // luminous outline + fine veins (the shimmering detail of visionary leaves)
  x.strokeStyle = `hsla(${hue + 30},100%,70%,0.55)`; x.lineWidth = 0.8; x.stroke();
  x.strokeStyle = `hsla(${hue + 40},100%,75%,0.5)`; x.lineWidth = 0.7; x.beginPath(); x.moveTo(0, 0); x.lineTo(len * 0.97, 0);
  const nv = 6 + Math.floor(len / 18);
  for (let k = 1; k < nv; k++) { const u = k / nv; const w = Math.sin(u * Math.PI) * wid * 0.85; x.moveTo(len * u, 0); x.quadraticCurveTo(len * (u + 0.05), -w * 0.5, len * (u + 0.1), -w); x.moveTo(len * u, 0); x.quadraticCurveTo(len * (u + 0.05), w * 0.5, len * (u + 0.1), w); }
  x.stroke();
  // dotted highlights along the midrib
  x.fillStyle = 'rgba(255,250,200,0.7)';
  for (let k = 1; k < nv; k++) { x.beginPath(); x.arc(len * k / nv, 0, 0.9, 0, Math.PI * 2); x.fill(); }
  x.restore();
}
function drawFlower(x: CanvasRenderingContext2D, px: number, py: number, rad: number, col: string, col2: string) {
  const n = 7 + Math.floor((rad * 13) % 5);
  x.save(); x.translate(px, py);
  const halo = x.createRadialGradient(0, 0, 0, 0, 0, rad * 2.4); halo.addColorStop(0, rgba(col, 0.45)); halo.addColorStop(1, rgba(col, 0));
  x.fillStyle = halo; x.beginPath(); x.arc(0, 0, rad * 2.4, 0, Math.PI * 2); x.fill();
  for (let k = 0; k < n; k++) {
    x.save(); x.rotate((k / n) * Math.PI * 2);
    const g = x.createLinearGradient(0, 0, rad, 0); g.addColorStop(0, col2); g.addColorStop(1, col);
    x.beginPath(); x.moveTo(0, 0); x.bezierCurveTo(rad * 0.4, -rad * 0.38, rad * 0.9, -rad * 0.3, rad, 0); x.bezierCurveTo(rad * 0.9, rad * 0.3, rad * 0.4, rad * 0.38, 0, 0);
    x.fillStyle = g; x.fill(); x.strokeStyle = 'rgba(255,255,220,0.6)'; x.lineWidth = 0.6; x.stroke();
    x.restore();
  }
  x.fillStyle = '#fff6c8'; x.beginPath(); x.arc(0, 0, rad * 0.22, 0, Math.PI * 2); x.fill();
  x.fillStyle = col2; for (let k = 0; k < 10; k++) { const a = k * 0.628; x.beginPath(); x.arc(Math.cos(a) * rad * 0.36, Math.sin(a) * rad * 0.36, rad * 0.05, 0, Math.PI * 2); x.fill(); }
  x.restore();
}
function drawHeliconia(x: CanvasRenderingContext2D, px: number, py: number, len: number, ang: number) {
  x.save(); x.translate(px, py); x.rotate(ang);
  x.strokeStyle = '#2b6b3a'; x.lineWidth = 2; x.beginPath(); x.moveTo(0, 0); x.lineTo(len, 0); x.stroke();
  for (let k = 0; k < 6; k++) {
    const u = 0.15 + k * 0.14, s = k % 2 ? 1 : -1, b = len * (0.22 - k * 0.018);
    x.save(); x.translate(len * u, 0); x.rotate(s * 0.9);
    const g = x.createLinearGradient(0, 0, b, 0); g.addColorStop(0, '#ff3a3a'); g.addColorStop(0.75, '#ffb02e'); g.addColorStop(1, '#fff07a');
    x.beginPath(); x.moveTo(0, 0); x.quadraticCurveTo(b * 0.5, -b * 0.35, b, 0); x.quadraticCurveTo(b * 0.5, b * 0.12, 0, 0); x.fillStyle = g; x.fill();
    x.strokeStyle = 'rgba(255,240,180,0.7)'; x.lineWidth = 0.6; x.stroke(); x.restore();
  }
  x.restore();
}

function buildLayers(W: number, H: number, dpr: number): VisionLayers {
  const r = rng(1234);
  // 1) ornament field: dense luminous line-work and dot patterns covering the whole canvas
  const o = mk(W, H, dpr);
  const cell = Math.max(18, Math.min(W, H) / 22);
  o.x.lineCap = 'round';
  for (let y = -cell; y < H + cell; y += cell) for (let xx = -cell; xx < W + cell; xx += cell) {
    const col = JEWEL[Math.floor(r() * JEWEL.length)];
    const cx = xx + cell / 2 + ((Math.round(y / cell) % 2) * cell) / 2, cy = y + cell / 2;
    o.x.strokeStyle = rgba(col, 0.22 + r() * 0.18); o.x.lineWidth = 0.9;
    const k = r();
    o.x.beginPath();
    if (k < 0.4) { // stepped rhombus (kené-like)
      const s2 = cell * 0.42, st = s2 / 3;
      o.x.moveTo(cx, cy - s2); o.x.lineTo(cx + st, cy - s2); o.x.lineTo(cx + st, cy - 2 * st); o.x.lineTo(cx + 2 * st, cy - 2 * st); o.x.lineTo(cx + 2 * st, cy - st); o.x.lineTo(cx + s2, cy - st); o.x.lineTo(cx + s2, cy);
      o.x.lineTo(cx + s2, cy + st); o.x.lineTo(cx + 2 * st, cy + st); o.x.lineTo(cx + 2 * st, cy + 2 * st); o.x.lineTo(cx + st, cy + 2 * st); o.x.lineTo(cx + st, cy + s2); o.x.lineTo(cx, cy + s2);
      o.x.lineTo(cx - st, cy + s2); o.x.lineTo(cx - st, cy + 2 * st); o.x.lineTo(cx - 2 * st, cy + 2 * st); o.x.lineTo(cx - 2 * st, cy + st); o.x.lineTo(cx - s2, cy + st); o.x.lineTo(cx - s2, cy);
      o.x.lineTo(cx - s2, cy - st); o.x.lineTo(cx - 2 * st, cy - st); o.x.lineTo(cx - 2 * st, cy - 2 * st); o.x.lineTo(cx - st, cy - 2 * st); o.x.lineTo(cx - st, cy - s2); o.x.closePath();
    } else if (k < 0.7) { // spiral curl
      for (let a = 0; a < Math.PI * 4; a += 0.25) { const rr = (a / (Math.PI * 4)) * cell * 0.45; const px = cx + Math.cos(a) * rr, py = cy + Math.sin(a) * rr; if (a === 0) o.x.moveTo(px, py); else o.x.lineTo(px, py); }
    } else { // concentric eye
      o.x.arc(cx, cy, cell * 0.32, 0, Math.PI * 2); o.x.moveTo(cx + cell * 0.18, cy); o.x.arc(cx, cy, cell * 0.18, 0, Math.PI * 2);
    }
    o.x.stroke();
    o.x.fillStyle = rgba(JEWEL[Math.floor(r() * JEWEL.length)], 0.55);
    for (let d = 0; d < 3; d++) { o.x.beginPath(); o.x.arc(xx + r() * cell, y + r() * cell, 0.7 + r() * 0.9, 0, Math.PI * 2); o.x.fill(); }
  }
  // 2) far foliage: dark blue-green layered leaves with faint luminous veins
  const f = mk(W, H, dpr);
  for (let i = 0; i < 90; i++) {
    const side = i % 4; const len = Math.min(W, H) * (0.12 + r() * 0.16);
    let px = 0, py = 0, ang = 0;
    if (side === 0) { px = r() * W; py = -10 + r() * H * 0.12; ang = Math.PI / 2 + (r() - 0.5) * 1.8; }
    else if (side === 1) { px = r() * W; py = H + 10 - r() * H * 0.12; ang = -Math.PI / 2 + (r() - 0.5) * 1.8; }
    else if (side === 2) { px = -10 + r() * W * 0.1; py = r() * H; ang = (r() - 0.5) * 1.6; }
    else { px = W + 10 - r() * W * 0.1; py = r() * H; ang = Math.PI + (r() - 0.5) * 1.6; }
    drawLeaf(f.x, px, py, len, ang, 150 + r() * 50, 9 + r() * 9, r);
  }
  // 3) near foliage + flowers: brighter, more detailed, framing the corners
  const n = mk(W, H, dpr);
  const corners: Pt[] = [[0, 0], [W, 0], [0, H], [W, H]];
  corners.forEach(([cx, cy], ci) => {
    for (let i = 0; i < 16; i++) {
      const base = Math.atan2(H / 2 - cy, W / 2 - cx);
      const ang = base + (r() - 0.5) * 1.6; const len = Math.min(W, H) * (0.14 + r() * 0.2);
      drawLeaf(n.x, cx + (r() - 0.5) * 40, cy + (r() - 0.5) * 40, len, ang, 120 + r() * 60, 16 + r() * 14, r);
    }
    const base = Math.atan2(H / 2 - cy, W / 2 - cx);
    drawHeliconia(n.x, cx, cy, Math.min(W, H) * 0.32, base + (ci % 2 ? 0.35 : -0.35));
    for (let i = 0; i < 5; i++) {
      const d = Math.min(W, H) * (0.08 + r() * 0.2), a = base + (r() - 0.5) * 1.3;
      drawFlower(n.x, cx + Math.cos(a) * d, cy + Math.sin(a) * d, Math.min(W, H) * (0.018 + r() * 0.025), JEWEL[(ci * 2 + i) % JEWEL.length], '#fff2b0');
    }
  });
  // orb sprite
  const ob = document.createElement('canvas'); ob.width = ob.height = 128; const ox = ob.getContext('2d')!;
  const og = ox.createRadialGradient(64, 64, 0, 64, 64, 64);
  og.addColorStop(0, 'rgba(255,255,240,1)'); og.addColorStop(0.12, 'rgba(255,250,210,0.9)'); og.addColorStop(0.3, 'rgba(255,255,255,0.28)'); og.addColorStop(1, 'rgba(255,255,255,0)');
  ox.fillStyle = og; ox.fillRect(0, 0, 128, 128);
  return { key: `${Math.round(W)}x${Math.round(H)}`, ornament: o.c, far: f.c, near: n.c, orb: ob };
}

interface Serpent { pts: Pt[]; nrm: Pt[]; w: number[] }
function serpentPath(W: number, H: number, R: number, t: number, sI: number): Serpent {
  const N = 120; const pts: Pt[] = []; const ph = t * (0.07 + sI * 0.015) + sI * 2.3;
  const rot = sI * 1.37 + 0.4; const amp = R * (0.28 + (sI % 3) * 0.1); const off = (sI - 1.5) * R * 0.42;
  for (let i = 0; i < N; i++) {
    const u = i / (N - 1);
    const x0 = (u * 0.95 - 0.68) * Math.max(W, H) * 1.15; // head ends inside the frame
    const y0 = Math.sin(u * Math.PI * (1.6 + sI * 0.35) + ph) * amp + Math.sin(u * Math.PI * 4.3 - ph * 0.7) * amp * 0.18 + off;
    pts.push([x0 * Math.cos(rot) - y0 * Math.sin(rot), x0 * Math.sin(rot) + y0 * Math.cos(rot)]);
  }
  const nrm: Pt[] = []; const w: number[] = [];
  const bw = (R * 0.7 + Math.max(W, H) * 0.15) * (0.15 + (sI % 2) * 0.03);
  for (let i = 0; i < N; i++) {
    const a = pts[Math.max(0, i - 1)], b = pts[Math.min(N - 1, i + 1)];
    const dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1;
    nrm.push([-dy / l, dx / l]);
    const u = i / (N - 1);
    w.push(bw * Math.min(1, 0.25 + u * 1.6) * (u > 0.93 ? 0.85 : 1)); // tapering tail -> full body -> neck
  }
  return { pts, nrm, w };
}

function drawSerpent(ctx: CanvasRenderingContext2D, s: Serpent, t: number, sI: number, av: { bass: number; pulse: number }) {
  const { pts, nrm, w } = s; const N = pts.length;
  const c0 = JEWEL[(sI * 3) % JEWEL.length], c1 = JEWEL[(sI * 3 + 2) % JEWEL.length], c2 = JEWEL[(sI * 3 + 5) % JEWEL.length];
  const edge = (side: number, scale = 1) => pts.map((p, i) => [p[0] + nrm[i][0] * w[i] * 0.5 * side * scale, p[1] + nrm[i][1] * w[i] * 0.5 * side * scale] as Pt);
  const L = edge(1), Rr = edge(-1);
  const body = () => { ctx.beginPath(); ctx.moveTo(L[0][0], L[0][1]); for (let i = 1; i < N; i++) ctx.lineTo(L[i][0], L[i][1]); for (let i = N - 1; i >= 0; i--) ctx.lineTo(Rr[i][0], Rr[i][1]); ctx.closePath(); };
  // aura
  ctx.globalCompositeOperation = 'lighter';
  for (let k = 3; k >= 1; k--) {
    ctx.strokeStyle = rgba(c0, 0.05 + av.bass * 0.04); ctx.lineWidth = w[Math.floor(N * 0.6)] * (1 + k * 0.9);
    ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < N; i++) ctx.lineTo(pts[i][0], pts[i][1]); ctx.stroke();
  }
  ctx.globalCompositeOperation = 'source-over';
  // body base: dark with a cross-body gradient feel (two fills)
  body(); ctx.fillStyle = '#0b0620'; ctx.fill();
  ctx.save(); body(); ctx.clip();
  // scale lattice: rhombus cells across the body, each with nested kené-like stepped cross and a jewel dot
  const rows = 3; const step = 3;
  const flow = (t * 6) % (step * 2);
  // batched: one path per scale colour, one for outlines, one for inner rhombi, one for dots
  const fills = [new Path2D(), new Path2D(), new Path2D()]; const inner = new Path2D(); const dots = new Path2D(); const outline = new Path2D();
  const P = (j: number, v: number): Pt => { const jj = Math.max(0, Math.min(N - 1, j)); return [pts[jj][0] + nrm[jj][0] * w[jj] * 0.5 * v, pts[jj][1] + nrm[jj][1] * w[jj] * 0.5 * v]; };
  for (let i = 1; i < N - 2; i += step) {
    const ii = Math.min(N - 2, i + Math.floor(flow));
    for (let rI = 0; rI < rows; rI++) {
      const v0 = -1 + (rI / rows) * 2, v1 = -1 + ((rI + 1) / rows) * 2, vm = (v0 + v1) / 2;
      const off = rI % 2 ? 1 : 0;
      const a = P(ii + off, v0), b = P(ii + step + off, vm), c = P(ii + off, v1), d = P(ii - step + off, vm);
      const fp = fills[(Math.floor(i / step) + rI) % 3];
      for (const pa of [fp, outline]) { pa.moveTo(a[0], a[1]); pa.lineTo(b[0], b[1]); pa.lineTo(c[0], c[1]); pa.lineTo(d[0], d[1]); pa.closePath(); }
      const m: Pt = [(a[0] + c[0]) / 2, (a[1] + c[1]) / 2];
      const q = (p: Pt): Pt => [m[0] + (p[0] - m[0]) * 0.5, m[1] + (p[1] - m[1]) * 0.5];
      const a2 = q(a), b2 = q(b), c2_ = q(c), d2 = q(d);
      inner.moveTo(a2[0], a2[1]); inner.lineTo(b2[0], b2[1]); inner.lineTo(c2_[0], c2_[1]); inner.lineTo(d2[0], d2[1]); inner.closePath();
      const dr = Math.max(0.8, w[ii] * 0.035); dots.moveTo(m[0] + dr, m[1]); dots.arc(m[0], m[1], dr, 0, Math.PI * 2);
    }
  }
  [c1, c0, c2].forEach((col, k) => { ctx.fillStyle = col; ctx.fill(fills[k]); });
  ctx.strokeStyle = 'rgba(255,236,160,0.85)'; ctx.lineWidth = 0.9; ctx.stroke(outline);
  ctx.strokeStyle = 'rgba(10,6,30,0.85)'; ctx.lineWidth = 1.1; ctx.stroke(inner);
  ctx.fillStyle = '#fff6d0'; ctx.fill(dots);
  // shading: dark at the flanks, sheen along the spine
  ctx.globalCompositeOperation = 'multiply';
  ctx.strokeStyle = 'rgba(20,10,60,0.55)'; ctx.lineWidth = 3;
  ctx.beginPath(); L.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]))); ctx.stroke();
  ctx.beginPath(); Rr.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]))); ctx.stroke();
  ctx.globalCompositeOperation = 'lighter';
  const spine = edge(1, 0.25);
  ctx.strokeStyle = 'rgba(255,255,230,0.18)'; ctx.lineWidth = 2.5;
  ctx.beginPath(); spine.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]))); ctx.stroke();
  ctx.restore();
  // glowing edges
  ctx.globalCompositeOperation = 'lighter';
  for (const E of [L, Rr]) {
    ctx.strokeStyle = rgba(c0, 0.55 + av.pulse * 0.3); ctx.lineWidth = 3.2;
    ctx.beginPath(); E.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]))); ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,235,0.8)'; ctx.lineWidth = 0.9; ctx.stroke();
  }
  // dotted light running along the outer edge
  ctx.setLineDash([1, 7]); ctx.lineDashOffset = -t * 12; ctx.strokeStyle = 'rgba(255,250,200,0.9)'; ctx.lineWidth = 2;
  const outer = edge(1, 1.35); ctx.beginPath(); outer.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]))); ctx.stroke();
  ctx.setLineDash([]); ctx.lineDashOffset = 0; ctx.globalCompositeOperation = 'source-over';
  // head with crown of light rays and glowing eyes
  const [hx, hy] = pts[N - 1], [px, py] = pts[N - 4]; const a = Math.atan2(hy - py, hx - px); const hw = w[N - 1];
  ctx.save(); ctx.translate(hx, hy); ctx.rotate(a);
  ctx.globalCompositeOperation = 'lighter';
  for (let k = 0; k < 9; k++) { const ra = -1.1 + k * 0.275; ctx.strokeStyle = rgba(JEWEL[k % JEWEL.length], 0.5); ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(hw * 0.2, 0); ctx.lineTo(hw * 0.2 + Math.cos(ra) * hw * 2.2, Math.sin(ra) * hw * 2.2); ctx.stroke(); }
  ctx.globalCompositeOperation = 'source-over';
  ctx.beginPath(); ctx.moveTo(-hw * 0.4, -hw * 0.5); ctx.bezierCurveTo(hw * 0.5, -hw * 0.85, hw * 1.25, -hw * 0.4, hw * 1.35, 0); ctx.bezierCurveTo(hw * 1.25, hw * 0.4, hw * 0.5, hw * 0.85, -hw * 0.4, hw * 0.5); ctx.closePath();
  const hg = ctx.createLinearGradient(-hw * 0.4, 0, hw * 1.35, 0); hg.addColorStop(0, c1); hg.addColorStop(1, c0);
  ctx.fillStyle = hg; ctx.fill(); ctx.strokeStyle = 'rgba(255,240,170,0.9)'; ctx.lineWidth = 1.2; ctx.stroke();
  // kené mark on the head
  ctx.strokeStyle = '#120a2a'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(hw * 0.35, -hw * 0.2); ctx.lineTo(hw * 0.7, 0); ctx.lineTo(hw * 0.35, hw * 0.2); ctx.closePath(); ctx.stroke();
  for (const sy of [-1, 1]) {
    const eg = ctx.createRadialGradient(hw * 0.85, sy * hw * 0.32, 0, hw * 0.85, sy * hw * 0.32, hw * 0.3); eg.addColorStop(0, '#fffbe0'); eg.addColorStop(0.4, '#ffd34a'); eg.addColorStop(1, 'rgba(255,211,74,0)');
    ctx.fillStyle = eg; ctx.beginPath(); ctx.arc(hw * 0.85, sy * hw * 0.32, hw * 0.3, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
}

export const drawVisions: DrawFn = ({ ctx, W, H, dpr, f, p, av }) => {
  const t = f.t * 0.6; // slow, dreamlike motion
  const R = Math.min(W, H) / 2;
  const key = `${Math.round(W)}x${Math.round(H)}`;
  if (!layers || layers.key !== key) layers = buildLayers(W, H, Math.min(dpr, 2));
  // deep night ground
  ctx.save(); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const bg = ctx.createRadialGradient(W / 2, H * 0.48, 0, W / 2, H / 2, Math.max(W, H) * 0.8);
  bg.addColorStop(0, '#3a1a7a'); bg.addColorStop(0.35, '#1b1660'); bg.addColorStop(0.7, '#08233a'); bg.addColorStop(1, '#020611');
  ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H); ctx.restore();
  // ornament field: slowly turning, breathing
  ctx.save(); ctx.rotate(Math.sin(t * 0.05) * 0.04); const sc = 1.08 + 0.03 * Math.sin(t * 0.11);
  ctx.globalAlpha = 0.75 + 0.2 * Math.sin(t * 0.3) + av.mid * 0.15; ctx.drawImage(layers.ornament, -W / 2 * sc, -H / 2 * sc, W * sc, H * sc); ctx.restore(); ctx.globalAlpha = 1;
  // radiating aura (tingunas): concentric rings of jewel dots and fine rays around the centre
  ctx.globalCompositeOperation = 'lighter';
  const rays = 48;
  ctx.lineWidth = 1.2;
  for (let c = 0; c < 4; c++) { ctx.strokeStyle = rgba(JEWEL[c * 2], 0.07 + av.pulse * 0.08); ctx.beginPath(); for (let k = c; k < rays; k += 4) { const a = (k / rays) * Math.PI * 2 + t * 0.02; ctx.moveTo(Math.cos(a) * R * 0.15, Math.sin(a) * R * 0.15); ctx.lineTo(Math.cos(a) * R * 1.5, Math.sin(a) * R * 1.5); } ctx.stroke(); }
  const rings = 8 + Math.round(p.complexity * 6);
  for (let i = 0; i < rings; i++) {
    const rr = R * (0.14 + i * 0.07) * (1 + av.bass * 0.04); const n = 28 + i * 12; const col = JEWEL[i % JEWEL.length];
    ctx.fillStyle = rgba(col, 0.5 - i * 0.025 + av.pulse * 0.2);
    const dr = 1.1 + (i % 3) * 0.8; ctx.beginPath();
    for (let j = 0; j < n; j++) { const a = (j / n) * Math.PI * 2 + t * (i % 2 ? 0.035 : -0.03); const wob = 1 + 0.04 * Math.sin(a * 6 + t * 0.5); const X = Math.cos(a) * rr * wob, Y = Math.sin(a) * rr * wob; ctx.moveTo(X + dr, Y); ctx.arc(X, Y, dr, 0, Math.PI * 2); }
    ctx.fill();
  }
  // central vision: nested stepped crosses in fine gold light with a bright core
  ctx.strokeStyle = 'rgba(255,226,150,0.65)'; ctx.lineWidth = 1.1; ctx.save(); ctx.rotate(t * 0.02); ctx.beginPath();
  for (let q = 0; q < 6; q++) { const s2 = R * 0.06 * (1 + q * 0.55); const st = s2 / 3; for (const [sx, sy] of MIRRORS) { ctx.moveTo(0, s2 * sy); ctx.lineTo(st * sx, s2 * sy); ctx.lineTo(st * sx, 2 * st * sy); ctx.lineTo(2 * st * sx, 2 * st * sy); ctx.lineTo(2 * st * sx, st * sy); ctx.lineTo(s2 * sx, st * sy); ctx.lineTo(s2 * sx, 0); } }
  ctx.stroke(); ctx.restore();
  const core = R * (0.22 + av.bass * 0.05); ctx.drawImage(layers.orb, -core, -core, core * 2, core * 2);
  ctx.globalCompositeOperation = 'source-over';
  // far foliage (parallax sway)
  ctx.save(); ctx.translate(Math.sin(t * 0.13) * 6, Math.cos(t * 0.11) * 4); ctx.globalAlpha = 0.9; ctx.drawImage(layers.far, -W / 2 - 8, -H / 2 - 8, W + 16, H + 16); ctx.restore(); ctx.globalAlpha = 1;
  // serpents
  for (let sI = 0; sI < 3; sI++) drawSerpent(ctx, serpentPath(W, H, R, t, sI), t, sI, av);
  // spirit-light orbs drifting upward with halos
  ctx.globalCompositeOperation = 'lighter';
  const r = rng(99);
  for (let i = 0; i < 26; i++) {
    const x0 = (r() - 0.5) * W, y0 = (r() - 0.5) * H, sp = 0.01 + r() * 0.025, sz = R * (0.025 + r() * 0.06);
    const x = x0 + Math.sin(t * 0.2 + i) * 20; const y = ((y0 + H / 2 - t * sp * H) % H + H) % H - H / 2;
    const tw = 0.6 + 0.4 * Math.sin(t * (0.6 + r()) + i);
    ctx.globalAlpha = tw * 0.9; ctx.drawImage(layers.orb, x - sz, y - sz, sz * 2, sz * 2);
    ctx.strokeStyle = rgba(JEWEL[i % JEWEL.length], 0.35 * tw); ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(x, y, sz * 1.25, 0, Math.PI * 2); ctx.stroke();
  }
  // fine sparkle dust
  const dust = [new Path2D(), new Path2D()];
  for (let i = 0; i < 220; i++) {
    const x = (r() - 0.5) * W, y0 = (r() - 0.5) * H; const y = ((y0 + H / 2 - t * (0.004 + r() * 0.01) * H) % H + H) % H - H / 2;
    const tw = 0.5 + 0.5 * Math.sin(t * (1 + r() * 2) + i); const rad = 0.5 + tw * 1.1;
    const pa = dust[i % 4 === 0 ? 1 : 0]; pa.moveTo(x + rad, y); pa.arc(x, y, rad, 0, Math.PI * 2);
  }
  ctx.globalAlpha = 0.6 + av.high * 0.3; ctx.fillStyle = '#fffbe6'; ctx.fill(dust[0]); ctx.fillStyle = '#ffd34a'; ctx.fill(dust[1]);
  ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
  // near foliage and flowers framing the scene
  ctx.save(); ctx.translate(Math.sin(t * 0.17 + 1) * 5, Math.sin(t * 0.13) * 3); ctx.drawImage(layers.near, -W / 2 - 6, -H / 2 - 6, W + 12, H + 12); ctx.restore();
};

export const drawKenePainted = makeKeneDraw(KENE_PAINTED, 'painted');
export const drawKeneEmbroidery = makeKeneDraw(KENE_EMBROIDERY, 'embroidery');
export const drawKeneMaya = makeKeneDraw(KENE_MAYA, 'maya', true);
