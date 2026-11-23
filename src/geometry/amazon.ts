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
const JEWEL = ['#19c37d', '#2fd6e0', '#ffcf3f', '#ff3fa4', '#3f7bff', '#b45cff', '#ff7a2f'];
let canopy: { key: string; c: HTMLCanvasElement } | null = null;
function renderCanopy(W: number, H: number, dpr: number) {
  const c = document.createElement('canvas'); c.width = Math.ceil(W * dpr); c.height = Math.ceil(H * dpr);
  const x = c.getContext('2d')!; x.setTransform(dpr, 0, 0, dpr, 0, 0);
  const r = rng(42);
  const leaf = (px: number, py: number, len: number, ang: number, col: string) => {
    x.save(); x.translate(px, py); x.rotate(ang); x.fillStyle = col; x.beginPath(); x.moveTo(0, 0);
    x.quadraticCurveTo(len * 0.5, -len * 0.28, len, 0); x.quadraticCurveTo(len * 0.5, len * 0.28, 0, 0); x.fill();
    x.strokeStyle = 'rgba(120,255,190,0.25)'; x.lineWidth = 1; x.beginPath(); x.moveTo(0, 0); x.lineTo(len, 0); x.stroke(); x.restore();
  };
  for (let i = 0; i < 70; i++) {
    const top = i % 2 === 0; const px = r() * W; const py = top ? r() * H * 0.16 - 10 : H - r() * H * 0.16 + 10;
    const len = 40 + r() * 90; const ang = (top ? Math.PI / 2 : -Math.PI / 2) + (r() - 0.5) * 2.2;
    leaf(px, py, len, ang, `hsl(${140 + r() * 40},${55 + r() * 30}%,${8 + r() * 12}%)`);
  }
  return c;
}

export const drawVisions: DrawFn = ({ ctx, W, H, dpr, f, p, av }) => {
  const t = f.t;
  ctx.save(); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const bg = ctx.createRadialGradient(W / 2, H * 0.45, 0, W / 2, H / 2, Math.max(W, H) * 0.75);
  bg.addColorStop(0, '#2a1060'); bg.addColorStop(0.55, '#120830'); bg.addColorStop(1, '#04020c');
  ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H); ctx.restore();
  const R = Math.min(W, H) / 2;
  // tingunas: radiating rings of coloured dots around the central vision, pulsing with the music
  ctx.globalCompositeOperation = 'lighter';
  const rings = 7 + Math.round(p.complexity * 6);
  for (let i = 0; i < rings; i++) {
    const rr = R * (0.12 + i * 0.075) * (1 + av.bass * 0.05);
    const n = 24 + i * 10; const col = JEWEL[i % JEWEL.length];
    ctx.fillStyle = col; ctx.globalAlpha = 0.55 - i * 0.03 + av.pulse * 0.2;
    for (let j = 0; j < n; j++) {
      const a = (j / n) * Math.PI * 2 + t * (i % 2 ? 0.05 : -0.04);
      const wob = 1 + 0.05 * Math.sin(a * 6 + t * 0.8);
      ctx.beginPath(); ctx.arc(Math.cos(a) * rr * wob, Math.sin(a) * rr * wob, 1.6 + (i % 3) * 1.1, 0, Math.PI * 2); ctx.fill();
    }
  }
  // central kené mandala in fine luminous lines (Shipibo lines often frame Amaringo's visionary circles)
  ctx.globalAlpha = 0.7; ctx.lineWidth = 1.4; ctx.strokeStyle = '#ffe9a8';
  ctx.beginPath();
  for (let q = 0; q < 8; q++) {
    const s = R * 0.09 * (1 + q * 0.42); const step = s / 3;
    for (const [sx, sy] of MIRRORS) { ctx.moveTo(0, s * sy); ctx.lineTo(step * sx, s * sy); ctx.lineTo(step * sx, 2 * step * sy); ctx.lineTo(2 * step * sx, 2 * step * sy); ctx.lineTo(2 * step * sx, step * sy); ctx.lineTo(s * sx, step * sy); ctx.lineTo(s * sx, 0); }
  }
  ctx.save(); ctx.rotate(t * 0.03); ctx.stroke(); ctx.restore();
  // serpents: Sachamama (earth), Yakumama (water), Huairamama (air) — sinuous luminous bodies with scale patterns
  const serp = 4;
  for (let sI = 0; sI < serp; sI++) {
    const pts: Pt[] = [];
    const N = 90; const ph = t * (0.18 + sI * 0.04) + sI * 2.1;
    for (let i = 0; i < N; i++) {
      const u = i / (N - 1);
      const x0 = (u - 0.5) * W * 1.3;
      const y0 = Math.sin(u * Math.PI * (2 + sI * 0.6) + ph) * R * (0.32 + sI * 0.12) + (sI - 1) * R * 0.55;
      const rot = sI * 1.05 + 0.25;
      pts.push([x0 * Math.cos(rot) - y0 * Math.sin(rot), x0 * Math.sin(rot) + y0 * Math.cos(rot)]);
    }
    const col = [JEWEL[(sI * 2) % JEWEL.length], JEWEL[(sI * 2 + 1) % JEWEL.length], JEWEL[(sI * 2 + 3) % JEWEL.length]];
    const bodyW = R * (0.075 + sI * 0.012);
    const path = () => { ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < N; i++) ctx.lineTo(pts[i][0], pts[i][1]); };
    // glow halo
    ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.16 + av.bass * 0.12; ctx.strokeStyle = col[0]; ctx.lineWidth = bodyW * 2.6; path(); ctx.stroke();
    ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
    ctx.strokeStyle = '#0a0418'; ctx.lineWidth = bodyW * 1.15; path(); ctx.stroke();
    ctx.strokeStyle = col[0]; ctx.lineWidth = bodyW; path(); ctx.stroke();
    // diamond scale pattern (kené-like) along the body, flowing toward the head
    ctx.lineWidth = bodyW * 0.5; ctx.strokeStyle = col[1];
    ctx.setLineDash([bodyW * 0.55, bodyW * 0.55]); ctx.lineDashOffset = -t * bodyW * 1.5; path(); ctx.stroke();
    ctx.lineWidth = bodyW * 0.16; ctx.strokeStyle = col[2]; ctx.setLineDash([bodyW * 0.3, bodyW * 0.8]); path(); ctx.stroke();
    ctx.setLineDash([]); ctx.lineDashOffset = 0;
    // head
    const [hx, hy] = pts[N - 1], [px, py] = pts[N - 3]; const a = Math.atan2(hy - py, hx - px);
    ctx.save(); ctx.translate(hx, hy); ctx.rotate(a); ctx.fillStyle = col[0];
    ctx.beginPath(); ctx.ellipse(bodyW * 0.4, 0, bodyW * 1.0, bodyW * 0.7, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fff6c0'; ctx.beginPath(); ctx.arc(bodyW * 0.7, -bodyW * 0.3, bodyW * 0.14, 0, Math.PI * 2); ctx.arc(bodyW * 0.7, bodyW * 0.3, bodyW * 0.14, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }
  // spirit lights / sparkles
  ctx.globalCompositeOperation = 'lighter';
  const r = rng(7);
  for (let i = 0; i < 140; i++) {
    const x = (r() - 0.5) * W, y0 = (r() - 0.5) * H; const sp = 0.02 + r() * 0.05;
    const y = ((y0 + H / 2 - t * sp * H * 0.3) % H + H) % H - H / 2;
    const tw = 0.5 + 0.5 * Math.sin(t * (1 + r() * 2) + i);
    ctx.globalAlpha = 0.25 + tw * 0.6 + av.high * 0.3; ctx.fillStyle = i % 5 === 0 ? JEWEL[i % JEWEL.length] : '#fffbe6';
    ctx.beginPath(); ctx.arc(x, y, 0.8 + tw * 1.6, 0, Math.PI * 2); ctx.fill();
  }
  ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
  // jungle canopy framing (screen-space)
  const key = `${Math.round(W)}x${Math.round(H)}`;
  if (!canopy || canopy.key !== key) canopy = { key, c: renderCanopy(W, H, Math.min(dpr, 2)) };
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(canopy.c, 0, 0, ctx.canvas.width, ctx.canvas.height); ctx.restore();
};

export const drawKenePainted = makeKeneDraw(KENE_PAINTED, 'painted');
export const drawKeneEmbroidery = makeKeneDraw(KENE_EMBROIDERY, 'embroidery');
export const drawKeneMaya = makeKeneDraw(KENE_MAYA, 'maya', true);
