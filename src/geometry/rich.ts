/** Shared helpers for the 'rich imagery' renderers (Islamic, mandala, sacred geometry). */
export type Pt = [number, number];
export const TAU = Math.PI * 2;
export const rng = (seed: number) => () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
export const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
export const smooth = (a: number, b: number, x: number) => { const t = clamp01((x - a) / (b - a)); return t * t * (3 - 2 * t); };
export const rgba = (hex: string, a: number) => { const n = parseInt(hex.slice(1), 16); return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`; };
export const mix = (h1: string, h2: string, k: number) => {
  const a = parseInt(h1.slice(1), 16), b = parseInt(h2.slice(1), 16);
  const c = (s: number) => Math.round(((a >> s) & 255) * (1 - k) + ((b >> s) & 255) * k);
  return `rgb(${c(16)},${c(8)},${c(0)})`;
};

/** Images from public/art (already licence-checked, see CREDITS.md). */
const imgs = new Map<string, HTMLImageElement>();
export function art(key: string): HTMLImageElement | null {
  let i = imgs.get(key);
  if (!i) { i = new Image(); i.decoding = 'async'; i.src = `${import.meta.env.BASE_URL}art/${key}.webp`; imgs.set(key, i); }
  return i.complete && i.naturalWidth ? i : null;
}

/** Offscreen layer cache keyed by name + size. */
const layers = new Map<string, HTMLCanvasElement>();
export function cached(key: string, W: number, H: number, dpr: number, paint: (x: CanvasRenderingContext2D) => void) {
  const k = `${key}:${Math.round(W)}x${Math.round(H)}@${dpr.toFixed(2)}`;
  let c = layers.get(k);
  if (!c) {
    c = document.createElement('canvas'); c.width = Math.max(2, Math.ceil(W * dpr)); c.height = Math.max(2, Math.ceil(H * dpr));
    const x = c.getContext('2d')!; x.setTransform(dpr, 0, 0, dpr, (W * dpr) / 2, (H * dpr) / 2); x.lineJoin = 'round'; x.lineCap = 'round';
    paint(x);
    for (const kk of layers.keys()) if (kk.startsWith(key + ':')) layers.delete(kk);
    layers.set(k, c);
  }
  return c;
}
/** Draw a cached layer (painted in centred coordinates) under the current transform. */
export function blit(ctx: CanvasRenderingContext2D, c: HTMLCanvasElement, W: number, H: number) { ctx.drawImage(c, -W / 2, -H / 2, W, H); }

/** Luminous line: soft wide halo + bright core. */
export function glow(ctx: CanvasRenderingContext2D, path: Path2D, col: string, w: number, a = 1) {
  const op = ctx.globalCompositeOperation;
  ctx.globalCompositeOperation = 'lighter';
  ctx.strokeStyle = rgba(col, 0.16 * a); ctx.lineWidth = w * 5; ctx.stroke(path);
  ctx.strokeStyle = rgba(col, 0.35 * a); ctx.lineWidth = w * 2.2; ctx.stroke(path);
  ctx.strokeStyle = rgba('#fff8e0', 0.9 * a); ctx.lineWidth = Math.max(0.8, w * 0.7); ctx.stroke(path);
  ctx.globalCompositeOperation = op;
}

/** Star polygon {n/k}-like outline with outer radius r and inner radius ri, rotated by a. */
export function starPath(p: Path2D | CanvasRenderingContext2D, n: number, r: number, ri: number, a = 0, cx = 0, cy = 0) {
  for (let i = 0; i < n * 2; i++) {
    const rr = i % 2 ? ri : r; const an = a + (i * Math.PI) / n;
    const x = cx + Math.cos(an) * rr, y = cy + Math.sin(an) * rr;
    if (i) p.lineTo(x, y); else p.moveTo(x, y);
  }
  p.closePath();
}
export function polyPath(p: Path2D | CanvasRenderingContext2D, n: number, r: number, a = 0, cx = 0, cy = 0) {
  for (let i = 0; i < n; i++) { const an = a + (i * TAU) / n; const x = cx + Math.cos(an) * r, y = cy + Math.sin(an) * r; if (i) p.lineTo(x, y); else p.moveTo(x, y); }
  p.closePath();
}
/** Pointed petal from radius r0 to r1 with angular half-width hw (radians), centred on angle a. */
export function petalPath(p: Path2D | CanvasRenderingContext2D, r0: number, r1: number, a: number, hw: number, belly = 0.55) {
  const rm = r0 + (r1 - r0) * belly;
  const ax = Math.cos(a), ay = Math.sin(a);
  const l = [Math.cos(a - hw) * rm, Math.sin(a - hw) * rm], rr = [Math.cos(a + hw) * rm, Math.sin(a + hw) * rm];
  p.moveTo(ax * r0, ay * r0);
  p.quadraticCurveTo(l[0], l[1], ax * r1, ay * r1);
  p.quadraticCurveTo(rr[0], rr[1], ax * r0, ay * r0);
}
/** Grain / sand / wool noise tile (cached) used as a pattern. */
let noiseTile: HTMLCanvasElement | null = null;
export function noisePattern(ctx: CanvasRenderingContext2D) {
  if (!noiseTile) {
    noiseTile = document.createElement('canvas'); noiseTile.width = noiseTile.height = 128;
    const x = noiseTile.getContext('2d')!; const d = x.createImageData(128, 128); const r = rng(5);
    for (let i = 0; i < d.data.length; i += 4) { const v = Math.floor(r() * 255); d.data[i] = d.data[i + 1] = d.data[i + 2] = v; d.data[i + 3] = 255; }
    x.putImageData(d, 0, 0);
  }
  return ctx.createPattern(noiseTile, 'repeat')!;
}
/** Draw an image cover-fit inside a circle, rotated. */
export function imageDisc(ctx: CanvasRenderingContext2D, im: HTMLImageElement, r: number, rot: number, alpha = 1) {
  ctx.save(); ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.clip(); ctx.rotate(rot); ctx.globalAlpha = alpha;
  const s = (2 * r) / Math.min(im.naturalWidth, im.naturalHeight);
  ctx.drawImage(im, (-im.naturalWidth * s) / 2, (-im.naturalHeight * s) / 2, im.naturalWidth * s, im.naturalHeight * s);
  ctx.restore();
}
