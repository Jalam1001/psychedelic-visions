/**
 * Islamic geometry, rich-imagery renderers (draft 4). Original procedural designs using the vocabulary of
 * zellige (Alhambra / Fez), Persian tile domes (Isfahan, Shiraz), Iznik tile panels and Anatolian / Persian carpets.
 * No artwork is copied; motifs follow the general construction of 8-, 12-, 16- and 24-fold star rosettes.
 */
import type { DrawCtx, DrawFn } from '../views/CanvasView';
import { art, blit, cached, glow, imageDisc, noisePattern, petalPath, polyPath, rgba, rng, smooth, starPath, TAU } from './rich';

// glaze colours (zellige / Isfahan / Iznik)
const Z = { cobalt: '#1d4aa6', turq: '#16a3a3', saffron: '#e7a91d', white: '#f3eee2', terra: '#b4502b', green: '#2c7c4e', black: '#17161a', navy: '#0e2357', gold: '#e2b54a' };
const PALS = [
  { bg: Z.white, star: Z.cobalt, oct: Z.saffron, cross: Z.turq, rose: Z.terra },
  { bg: Z.black, star: Z.turq, oct: Z.white, cross: Z.cobalt, rose: Z.saffron },
  { bg: Z.white, star: Z.green, oct: Z.terra, cross: Z.cobalt, rose: Z.saffron },
  { bg: Z.navy, star: Z.saffron, oct: Z.turq, cross: Z.white, rose: Z.terra },
];
const coverR = (W: number, H: number) => Math.hypot(W, H) / 2;

function sheen(ctx: CanvasRenderingContext2D, W: number, H: number, t: number, a = 0.13) {
  const R = coverR(W, H); const x = ((t * 0.08) % 2 - 1) * R * 2;
  const g = ctx.createLinearGradient(x - R * 0.4, -R, x + R * 0.4, R);
  g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(0.5, `rgba(255,255,255,${a})`); g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = g; ctx.fillRect(-R, -R, 2 * R, 2 * R); ctx.restore();
}

/** 16-fold rosette (Moroccan / Andalusian type): star, petal ring, inner star. */
function rosette16(ctx: CanvasRenderingContext2D, r: number, rot: number, p: typeof PALS[0], k = 1) {
  if (r < 4) return;
  ctx.save(); ctx.rotate(rot);
  const s1 = new Path2D(); starPath(s1, 16, r, r * 0.78); ctx.fillStyle = p.star; ctx.fill(s1);
  const pet = new Path2D(); for (let i = 0; i < 16; i++) petalPath(pet, r * 0.32, r * 0.74, (i + 0.5) * TAU / 16, 0.16); ctx.fillStyle = p.oct; ctx.fill(pet);
  const s2 = new Path2D(); starPath(s2, 8, r * 0.36, r * 0.2, Math.PI / 8); ctx.fillStyle = p.rose; ctx.fill(s2);
  const c = new Path2D(); c.arc(0, 0, r * 0.1, 0, TAU); ctx.fillStyle = p.bg; ctx.fill(c);
  ctx.strokeStyle = Z.black; ctx.lineWidth = Math.max(2, r * 0.035); ctx.stroke(s1); ctx.stroke(s2);
  ctx.strokeStyle = Z.gold; ctx.lineWidth = Math.max(1.2, r * 0.018 * k); ctx.stroke(s1); ctx.stroke(pet); ctx.stroke(s2);
  ctx.restore();
}

// ------------------------------------------------------------------ zellige star-and-cross tessellation
function paintZellige(ctx: CanvasRenderingContext2D, ext: number, s: number, pal: typeof PALS[0]) {
  const n = Math.ceil(ext / s);
  ctx.fillStyle = pal.cross; ctx.fillRect(-ext, -ext, ext * 2, ext * 2);
  const grout = new Path2D(), strap = new Path2D(), oct = new Path2D(), oin = new Path2D(), star = new Path2D(), ocn = new Path2D(), rose = new Path2D();
  for (let j = -n; j <= n; j++) for (let i = -n; i <= n; i++) {
    const cx = i * s, cy = j * s, ox = cx + s / 2, oy = cy + s / 2;
    polyPath(oct, 8, s * 0.3, Math.PI / 8, ox, oy); polyPath(grout, 8, s * 0.3, Math.PI / 8, ox, oy); polyPath(strap, 8, s * 0.3, Math.PI / 8, ox, oy);
    starPath(oin, 4, s * 0.18, s * 0.09, Math.PI / 4, ox, oy);
    starPath(star, 8, s * 0.5, s * 0.27, 0, cx, cy); starPath(grout, 8, s * 0.5, s * 0.27, 0, cx, cy); starPath(strap, 8, s * 0.5, s * 0.27, 0, cx, cy);
    polyPath(ocn, 8, s * 0.22, Math.PI / 8, cx, cy); polyPath(grout, 8, s * 0.22, Math.PI / 8, cx, cy);
    for (let k = 0; k < 8; k++) { const a0 = (k * TAU) / 8 + Math.PI / 8; const r0 = s * 0.03, r1 = s * 0.19, rm = r0 + (r1 - r0) * 0.55;
      rose.moveTo(cx + Math.cos(a0) * r0, cy + Math.sin(a0) * r0);
      rose.quadraticCurveTo(cx + Math.cos(a0 - 0.32) * rm, cy + Math.sin(a0 - 0.32) * rm, cx + Math.cos(a0) * r1, cy + Math.sin(a0) * r1);
      rose.quadraticCurveTo(cx + Math.cos(a0 + 0.32) * rm, cy + Math.sin(a0 + 0.32) * rm, cx + Math.cos(a0) * r0, cy + Math.sin(a0) * r0); }
  }
  ctx.fillStyle = pal.oct; ctx.fill(oct); ctx.fillStyle = pal.bg; ctx.fill(oin);
  ctx.fillStyle = pal.star; ctx.fill(star); ctx.fillStyle = pal.bg; ctx.fill(ocn); ctx.fillStyle = pal.rose; ctx.fill(rose);
  ctx.strokeStyle = 'rgba(245,240,228,0.9)'; ctx.lineWidth = Math.max(1.2, s * 0.02); ctx.stroke(grout);
  ctx.strokeStyle = Z.black; ctx.lineWidth = Math.max(3, s * 0.07); ctx.stroke(strap);
  ctx.strokeStyle = Z.gold; ctx.lineWidth = Math.max(1.5, s * 0.035); ctx.stroke(strap);
  // glaze grain
  ctx.save(); ctx.globalCompositeOperation = 'overlay'; ctx.globalAlpha = 0.12; ctx.fillStyle = noisePattern(ctx); ctx.fillRect(-ext, -ext, ext * 2, ext * 2); ctx.restore();
}

export const drawZellige: DrawFn = ({ ctx, W, H, dpr, f, p, av }: DrawCtx) => {
  const t = f.t; const R = coverR(W, H);
  const cyc = 18; const gen = Math.max(0, Math.floor(t / cyc)) || 0; const ph = Math.max(0, (t % cyc) / cyc);
  const ia = gen % PALS.length, ib = (gen + 1) % PALS.length; const B = PALS[ib];
  const wave = smooth(0.15, 0.85, ph) * R * 1.15;
  const sc = 1 + 0.22 * Math.sin(t * 0.045) + av.bass * 0.03;
  const s = Math.max(64, Math.min(W, H) / (4.2 + p.complexity * 3));
  // static tile fields are cached per palette (snapped to whole tiles so they line up), then rotated, zoomed and revealed
  const ext = Math.ceil((R / 0.75 + s) / s) * s; const D = ext * 2; const cd = Math.min(dpr, 1.5);
  const key = (i: number) => `zel${i}-${Math.round(s)}`;
  const la = cached(key(ia), D, D, cd, (x) => paintZellige(x, ext, s, PALS[ia]));
  const lb = cached(key(ib), D, D, cd, (x) => paintZellige(x, ext, s, PALS[ib]));
  ctx.save(); ctx.rotate(t * 0.012); ctx.scale(sc, sc);
  ctx.drawImage(la, -ext, -ext, D, D);
  if (wave > 1) { ctx.save(); ctx.beginPath(); ctx.arc(0, 0, wave / sc, 0, TAU); ctx.clip(); ctx.drawImage(lb, -ext, -ext, D, D); ctx.restore(); }
  ctx.restore();
  // wave front: a glint of fresh glaze where the new colours are flooding in
  ctx.restore();
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  const g = ctx.createRadialGradient(0, 0, Math.max(0, wave - s), 0, 0, wave + s * 0.3);
  g.addColorStop(0, 'rgba(255,240,200,0)'); g.addColorStop(0.75, 'rgba(255,240,200,0.18)'); g.addColorStop(1, 'rgba(255,240,200,0)');
  ctx.fillStyle = g; ctx.fillRect(-R, -R, 2 * R, 2 * R); ctx.restore();
  // central 16-fold rosette blooming over the field
  const grow = smooth(0, 0.35, ph) * (1 - smooth(0.9, 1, ph) * 0.3);
  rosette16(ctx, Math.min(W, H) * 0.34 * grow * (1 + av.bass * 0.04), -t * 0.03, B);
  sheen(ctx, W, H, t);
};

// ------------------------------------------------------------------ tile dome (Isfahan / Shiraz), infinite zoom
const DOME = ['#16a3b5', '#1d3f9a', '#e3a21a', '#f4efe2', '#0d1f55', '#3a8d5c', '#c8576f'];
function domeRing(ctx: CanvasRenderingContext2D, type: number, r0: number, r1: number, n: number, rot: number, k: number) {
  const P = (r: number, a: number): [number, number] => [Math.cos(a) * r, Math.sin(a) * r];
  const c = (i: number) => DOME[(i + k * 3) % DOME.length];
  const band = new Path2D(); band.arc(0, 0, r1, 0, TAU); band.arc(0, 0, r0, 0, TAU, true);
  ctx.fillStyle = type === 2 ? '#1d3f9a' : type === 1 ? '#0d1f55' : '#f4efe2'; ctx.fill(band, 'evenodd');
  const lw = Math.max(1, (r1 - r0) * 0.03);
  if (type === 0) { // band of 8-point stars and kites
    const stars = new Path2D(), kites = new Path2D();
    for (let i = 0; i < n; i++) {
      const a = rot + (i * TAU) / n; const rm = (r0 + r1) / 2; const sz = Math.min((r1 - r0) * 0.48, (rm * TAU) / n * 0.48);
      const [x, y] = P(rm, a); starPath(stars, 8, sz, sz * 0.55, a, x, y);
      const a2 = a + Math.PI / n; const [x1, y1] = P(r0, a2), [x2, y2] = P(rm, a2 - (Math.PI / n) * 0.45), [x3, y3] = P(r1, a2), [x4, y4] = P(rm, a2 + (Math.PI / n) * 0.45);
      kites.moveTo(x1, y1); kites.lineTo(x2, y2); kites.lineTo(x3, y3); kites.lineTo(x4, y4); kites.closePath();
    }
    ctx.fillStyle = c(0); ctx.fill(kites); ctx.fillStyle = c(2); ctx.fill(stars);
    ctx.strokeStyle = Z.gold; ctx.lineWidth = lw; ctx.stroke(stars); ctx.stroke(kites);
  } else if (type === 1) { // muqarnas-like pointed cells in two tiers, shaded for depth
    for (let tier = 0; tier < 2; tier++) {
      const ra = r0 + (r1 - r0) * tier * 0.5, rb = r0 + (r1 - r0) * (tier * 0.5 + 0.5);
      const off = tier ? Math.PI / n : 0;
      for (let i = 0; i < n; i++) {
        const a = rot + off + (i * TAU) / n; const hw = (Math.PI / n) * 0.92;
        const cell = new Path2D(); const [ax, ay] = P(ra, a - hw), [bx, by] = P(ra, a + hw), [tx, ty] = P(rb, a), [m1x, m1y] = P(ra + (rb - ra) * 0.55, a - hw * 0.95), [m2x, m2y] = P(ra + (rb - ra) * 0.55, a + hw * 0.95);
        cell.moveTo(ax, ay); cell.lineTo(m1x, m1y); cell.quadraticCurveTo(...P(rb * 0.98, a - hw * 0.4), tx, ty); cell.quadraticCurveTo(...P(rb * 0.98, a + hw * 0.4), m2x, m2y); cell.lineTo(bx, by); cell.closePath();
        const g = ctx.createLinearGradient(...P(ra, a), ...P(rb, a)); g.addColorStop(0, '#08143d'); g.addColorStop(0.6, c(i % 2 ? 0 : 5)); g.addColorStop(1, '#f4efe2');
        ctx.fillStyle = g; ctx.fill(cell); ctx.strokeStyle = 'rgba(226,181,74,0.9)'; ctx.lineWidth = lw; ctx.stroke(cell);
      }
    }
  } else { // arabesque band: white/turquoise spiral scrolls on cobalt with small blossoms
    const scroll = new Path2D(), dots = new Path2D();
    for (let i = 0; i < n; i++) {
      const a = rot + (i * TAU) / n; const rm = (r0 + r1) / 2; const amp = (r1 - r0) * 0.32;
      for (let s = 0; s <= 12; s++) { const u = s / 12; const aa = a + (u * TAU) / n; const rr = rm + Math.sin(u * TAU) * amp; const [x, y] = P(rr, aa); if (s) scroll.lineTo(x, y); else scroll.moveTo(x, y); }
      const [cx, cy] = P(rm + amp * 0.6, a + (TAU / n) * 0.25);
      for (let s = 0; s < 14; s++) { const th = s * 0.55; const rr = (r1 - r0) * 0.2 * (1 - s / 14); const x = cx + Math.cos(th + a) * rr, y = cy + Math.sin(th + a) * rr; if (s) scroll.lineTo(x, y); else scroll.moveTo(x, y); }
      const [dx, dy] = P(rm - amp * 0.7, a + (TAU / n) * 0.75); dots.moveTo(dx + (r1 - r0) * 0.08, dy); dots.arc(dx, dy, (r1 - r0) * 0.08, 0, TAU);
    }
    ctx.strokeStyle = '#f4efe2'; ctx.lineWidth = Math.max(1.4, (r1 - r0) * 0.07); ctx.stroke(scroll);
    ctx.strokeStyle = '#16a3b5'; ctx.lineWidth = Math.max(0.8, (r1 - r0) * 0.03); ctx.stroke(scroll);
    ctx.fillStyle = '#e3a21a'; ctx.fill(dots);
  }
  const sep = new Path2D(); sep.arc(0, 0, r1, 0, TAU);
  ctx.strokeStyle = Z.black; ctx.lineWidth = lw * 3; ctx.stroke(sep); ctx.strokeStyle = Z.gold; ctx.lineWidth = lw * 1.4; ctx.stroke(sep);
}
export const drawTileDome: DrawFn = ({ ctx, W, H, f, av }: DrawCtx) => {
  const t = f.t; const R = coverR(W, H);
  const q = 1.42, n = 24; const z = t * 0.06; const k0 = Math.floor(z), fr = z - k0;
  const r0 = Math.min(W, H) * 0.09;
  ctx.fillStyle = '#0d1f55'; ctx.fillRect(-R, -R, 2 * R, 2 * R);
  let inner = 0;
  for (let k = -12; k < 14; k++) {
    const ra = r0 * Math.pow(q, k + fr), rb = ra * q;
    if (rb < 3) continue; if (ra > R) break;
    if (!inner) inner = ra;
    const kk = k - k0 * 0; const type = ((k - k0) % 3 + 3) % 3;
    domeRing(ctx, type, ra, rb, n, (k % 2 ? 1 : -1) * t * 0.015 + k * 0.13, ((k - k0) % 7 + 7) % 7 + kk * 0);
  }
  rosette16(ctx, Math.max(inner, 4) * 1.02, t * 0.04, PALS[0], 1);
  ctx.save(); ctx.globalCompositeOperation = 'lighter'; const g = ctx.createRadialGradient(0, 0, 0, 0, 0, R * 0.6);
  g.addColorStop(0, `rgba(255,236,170,${0.25 + av.pulse * 0.2})`); g.addColorStop(1, 'rgba(255,236,170,0)'); ctx.fillStyle = g; ctx.fillRect(-R, -R, 2 * R, 2 * R); ctx.restore();
};

// ------------------------------------------------------------------ living carpet (Persian / Anatolian)
const WAYS = [
  { field: '#8a1c1c', field2: '#7a1616', border: '#13284f', guard: '#e8dcc0', med: ['#13284f', '#e8dcc0', '#d9a441', '#2f6b4f'], motif: ['#e8dcc0', '#13284f', '#d9a441'] },
  { field: '#14284d', field2: '#102142', border: '#8a1c1c', guard: '#e8dcc0', med: ['#8a1c1c', '#e8dcc0', '#d9a441', '#3d7f86'], motif: ['#d9a441', '#e8dcc0', '#8a1c1c'] },
  { field: '#e9dfc6', field2: '#dfd3b6', border: '#8a1c1c', guard: '#13284f', med: ['#13284f', '#8a1c1c', '#d9a441', '#2f6b4f'], motif: ['#8a1c1c', '#13284f', '#2f6b4f'] },
];
function paintCarpet(x: CanvasRenderingContext2D, W: number, H: number, w: typeof WAYS[0], seed: number) {
  const r = rng(seed); const m = Math.min(W, H);
  const hw = W / 2, hh = H / 2; const b = m * 0.12;
  // field with abrash (natural dye variation in horizontal bands)
  x.fillStyle = w.field; x.fillRect(-hw, -hh, W, H);
  for (let y = -hh; y < hh; y += 6 + r() * 14) { x.fillStyle = r() < 0.5 ? w.field2 : w.field; x.globalAlpha = 0.5; x.fillRect(-hw, y, W, 4 + r() * 10); }
  x.globalAlpha = 1;
  // field lattice of small rosettes and palmettes
  const fs = m / 6.5;
  for (let j = -Math.ceil(hh / fs); j <= Math.ceil(hh / fs); j++) for (let i = -Math.ceil(hw / fs); i <= Math.ceil(hw / fs); i++) {
    const cx = i * fs + (j % 2 ? fs / 2 : 0), cy = j * fs;
    if (Math.abs(cx) > hw - b - fs * 0.3 || Math.abs(cy) > hh - b - fs * 0.3) continue;
    const pp = new Path2D(); for (let k = 0; k < 8; k++) petalPath(pp, fs * 0.04, fs * 0.22, (k * TAU) / 8, 0.35, 0.5);
    x.save(); x.translate(cx, cy); x.fillStyle = w.motif[(i + j + 30) % 3]; x.fill(pp);
    const c = new Path2D(); c.arc(0, 0, fs * 0.06, 0, TAU); x.fillStyle = w.motif[(i + j + 31) % 3]; x.fill(c);
    // palmette leaves between rosettes
    const lf = new Path2D(); petalPath(lf, fs * 0.28, fs * 0.5, -Math.PI / 4, 0.25); petalPath(lf, fs * 0.28, fs * 0.5, (3 * Math.PI) / 4, 0.25);
    x.fillStyle = w.motif[(i + j + 32) % 3]; x.globalAlpha = 0.85; x.fill(lf); x.globalAlpha = 1;
    x.restore();
  }
  // spandrels: quarter medallions in the field corners with arabesque scrolls
  const sp = m * 0.3;
  for (const [sx, sy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
    const cx = sx * (hw - b), cy = sy * (hh - b);
    x.save(); x.translate(cx, cy);
    const q = new Path2D(); q.arc(0, 0, sp, 0, TAU); x.save(); x.beginPath(); x.rect(sx < 0 ? 0 : -sp, sy < 0 ? 0 : -sp, sp, sp); x.clip();
    x.fillStyle = w.med[0]; x.fill(q); x.strokeStyle = w.med[2]; x.lineWidth = 2; x.stroke(q);
    const sc = new Path2D(); for (let k = 0; k < 6; k++) { const a = (k / 6) * TAU; for (let s = 0; s < 18; s++) { const th = a + s * 0.35, rr = sp * (0.85 - s * 0.035); const px = Math.cos(th) * rr * 0.6, py = Math.sin(th) * rr * 0.6; if (s) sc.lineTo(px, py); else sc.moveTo(px, py); } }
    x.strokeStyle = w.med[1]; x.lineWidth = 1.6; x.stroke(sc); x.restore(); x.restore();
  }
  // borders: outer guard, main border with flowing vine, inner guard
  const guard = (inset: number, width: number) => {
    x.fillStyle = w.guard; x.beginPath(); x.rect(-hw + inset, -hh + inset, W - 2 * inset, H - 2 * inset); x.rect(-hw + inset + width, -hh + inset + width, W - 2 * (inset + width), H - 2 * (inset + width)); x.fill('evenodd');
    // reciprocal triangles
    x.fillStyle = w.field; const step = width * 1.2; const zig = new Path2D();
    for (const side of [0, 1, 2, 3]) {
      const L = side % 2 ? H - 2 * inset : W - 2 * inset;
      for (let s = 0; s < L; s += step) {
        const pts: [number, number][] = [[s, 0], [s + step / 2, width * 0.8], [s + step, 0]];
        pts.forEach(([u, v], i) => { let X = 0, Y = 0; if (side === 0) { X = -hw + inset + u; Y = -hh + inset + v; } else if (side === 2) { X = hw - inset - u; Y = hh - inset - v; } else if (side === 1) { X = hw - inset - v; Y = -hh + inset + u; } else { X = -hw + inset + v; Y = hh - inset - u; } if (i) zig.lineTo(X, Y); else zig.moveTo(X, Y); });
        zig.closePath();
      }
    }
    x.fill(zig);
  };
  x.fillStyle = w.border; x.beginPath(); x.rect(-hw, -hh, W, H); x.rect(-hw + b, -hh + b, W - 2 * b, H - 2 * b); x.fill('evenodd');
  guard(0, b * 0.16); guard(b * 0.84, b * 0.16);
  // vine: sinuous stem with leaves and rosettes along the main border
  const mid = b * 0.5; const amp = b * 0.2; const vine = new Path2D(); const leaves = new Path2D(); const roses: [number, number][] = [];
  const per = (u: number): [number, number, number] => { // perimeter param -> point & inward normal angle
    const Wm = W - 2 * mid, Hm = H - 2 * mid, P = 2 * (Wm + Hm); let s = ((u % P) + P) % P;
    if (s < Wm) return [-hw + mid + s, -hh + mid, Math.PI / 2]; s -= Wm;
    if (s < Hm) return [hw - mid, -hh + mid + s, Math.PI]; s -= Hm;
    if (s < Wm) return [hw - mid - s, hh - mid, -Math.PI / 2]; s -= Wm;
    return [-hw + mid, hh - mid - s, 0];
  };
  const Ptot = 2 * (W + H - 4 * mid); const wl = b * 1.6;
  for (let u = 0; u <= Ptot; u += 3) {
    const [px, py, na] = per(u); const o = Math.sin((u / wl) * TAU) * amp;
    const X = px + Math.cos(na) * o, Y = py + Math.sin(na) * o; if (u) vine.lineTo(X, Y); else vine.moveTo(X, Y);
  }
  for (let u = wl / 4; u < Ptot; u += wl / 2) { const [px, py, na] = per(u); const o = Math.sin((u / wl) * TAU) * amp; roses.push([px + Math.cos(na) * o, py + Math.sin(na) * o]); const [qx, qy] = per(u + wl / 4); leaves.moveTo(qx, qy); petalPath(leaves, 0, 0, 0, 0); }
  x.strokeStyle = w.guard; x.lineWidth = Math.max(1.5, b * 0.05); x.stroke(vine);
  for (const [cx, cy] of roses) { x.save(); x.translate(cx, cy); const rp = new Path2D(); for (let k = 0; k < 8; k++) petalPath(rp, b * 0.02, b * 0.17, (k * TAU) / 8, 0.4); x.fillStyle = w.med[2]; x.fill(rp); const c = new Path2D(); c.arc(0, 0, b * 0.05, 0, TAU); x.fillStyle = w.field; x.fill(c); x.restore(); }
  // wool texture + knot grid
  x.save(); x.globalCompositeOperation = 'multiply'; x.globalAlpha = 0.22; x.fillStyle = noisePattern(x); x.fillRect(-hw, -hh, W, H); x.restore();
  x.save(); x.globalAlpha = 0.07; x.strokeStyle = '#000'; x.lineWidth = 1; x.beginPath(); for (let y = -hh; y < hh; y += 3) { x.moveTo(-hw, y); x.lineTo(hw, y); } x.stroke(); x.restore();
}
function medallion(ctx: CanvasRenderingContext2D, r: number, w: typeof WAYS[0], t: number, grow: number, av: { pulse: number }) {
  const g = Math.max(0.001, grow);
  const s1 = new Path2D(); starPath(s1, 16, r * g, r * 0.84 * g, t * 0.01); ctx.fillStyle = w.med[0]; ctx.fill(s1); ctx.strokeStyle = w.med[2]; ctx.lineWidth = 2; ctx.stroke(s1);
  const lob = new Path2D(); for (let k = 0; k < 16; k++) { const a = (k * TAU) / 16 + t * 0.01; lob.moveTo(Math.cos(a) * r * 0.86 * g + r * 0.1 * g, Math.sin(a) * r * 0.86 * g); lob.arc(Math.cos(a) * r * 0.86 * g, Math.sin(a) * r * 0.86 * g, r * 0.1 * g, 0, TAU); }
  ctx.fillStyle = w.med[1]; ctx.fill(lob);
  const p2 = new Path2D(); for (let k = 0; k < 12; k++) petalPath(p2, r * 0.18 * g, r * 0.7 * g, (k * TAU) / 12 - t * 0.015, 0.2);
  ctx.fillStyle = w.med[3]; ctx.fill(p2); ctx.strokeStyle = w.med[1]; ctx.lineWidth = 1.4; ctx.stroke(p2);
  const s2 = new Path2D(); starPath(s2, 8, r * 0.34 * g, r * 0.2 * g, t * 0.02); ctx.fillStyle = w.med[2]; ctx.fill(s2); ctx.strokeStyle = w.med[0]; ctx.stroke(s2);
  const c = new Path2D(); c.arc(0, 0, r * 0.11 * g, 0, TAU); ctx.fillStyle = w.med[1]; ctx.fill(c);
  ctx.save(); ctx.globalCompositeOperation = 'multiply'; ctx.globalAlpha = 0.2; ctx.fillStyle = noisePattern(ctx); ctx.fill(s1); ctx.restore();
  if (av.pulse > 0.05) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = av.pulse * 0.25; ctx.fillStyle = w.med[2]; ctx.fill(s2); ctx.restore(); }
}
export const drawCarpet2: DrawFn = ({ ctx, W, H, dpr, f, av }: DrawCtx) => {
  const t = f.t; const cyc = 36; const gen = Math.max(0, Math.floor(t / cyc)) || 0; const ph = Math.max(0, t - gen * cyc);
  const dd = Math.min(dpr, 2);
  const cur = cached(`carpet${gen % 3}`, W, H, dd, (x) => paintCarpet(x, W, H, WAYS[gen % 3], 11 + (gen % 3)));
  const prev = cached(`carpet${(gen + 2) % 3}`, W, H, dd, (x) => paintCarpet(x, W, H, WAYS[(gen + 2) % 3], 11 + ((gen + 2) % 3)));
  const weave = smooth(0, 7, ph);
  blit(ctx, prev, W, H);
  ctx.save(); ctx.beginPath(); ctx.rect(-W / 2, H / 2 - H * weave, W, H * weave); ctx.clip(); blit(ctx, cur, W, H); ctx.restore();
  // weaving line
  if (weave < 1) { ctx.fillStyle = 'rgba(255,240,200,0.5)'; ctx.fillRect(-W / 2, H / 2 - H * weave - 1.5, W, 3); }
  const m = Math.min(W, H); const stretch = Math.min(1.7, Math.max(1, (H / W) * 0.9));
  ctx.save(); ctx.scale(1, stretch);
  medallion(ctx, m * 0.3, WAYS[(weave > 0.5 ? gen : gen + 2) % 3], t, smooth(0, 1, weave > 0.5 ? (ph - 3.5) / 5 : 1), av);
  ctx.restore();
};

// ------------------------------------------------------------------ Iznik garden tiles (tulips, carnations, saz leaves)
const IZ = { ground: '#f4f1ea', cobalt: '#1f3f99', turq: '#1b9aa0', red: '#c7362b', green: '#2f7d47', outline: '#1d2a55' };
function iznikTile(ctx: CanvasRenderingContext2D, s: number, t: number, phase: number, mirror: number) {
  const sway = Math.sin(t * 0.6 + phase) * 0.05; const bloom = 0.9 + 0.12 * Math.sin(t * 0.5 + phase * 1.7);
  ctx.save(); ctx.scale(mirror, 1);
  ctx.fillStyle = IZ.ground; ctx.fillRect(-s / 2, -s / 2, s, s);
  const g = ctx.createRadialGradient(-s * 0.2, -s * 0.25, 0, 0, 0, s * 0.8); g.addColorStop(0, 'rgba(255,255,255,0.5)'); g.addColorStop(1, 'rgba(200,195,180,0.15)'); ctx.fillStyle = g; ctx.fillRect(-s / 2, -s / 2, s, s);
  ctx.rotate(sway);
  const stem = new Path2D(); stem.moveTo(0, s * 0.5); stem.bezierCurveTo(s * 0.08, s * 0.2, -s * 0.06, -s * 0.05, 0, -s * 0.22);
  stem.moveTo(0, s * 0.12); stem.quadraticCurveTo(-s * 0.18, s * 0.02, -s * 0.28, -s * 0.12); stem.moveTo(0, s * 0.18); stem.quadraticCurveTo(s * 0.18, s * 0.08, s * 0.29, -s * 0.06);
  ctx.strokeStyle = IZ.green; ctx.lineWidth = Math.max(1.5, s * 0.022); ctx.stroke(stem);
  // saz leaves: long serrated curved leaves
  for (const sd of [-1, 1]) {
    const lf = new Path2D(); const L = s * 0.46; lf.moveTo(0, s * 0.42);
    lf.bezierCurveTo(sd * s * 0.3, s * 0.38, sd * s * 0.42, s * 0.12, sd * L, -s * 0.02);
    for (let k = 8; k >= 0; k--) { const u = k / 8; lf.lineTo(sd * (s * 0.06 + (L - s * 0.06) * u) - sd * s * 0.04 * (k % 2), s * 0.42 - (s * 0.44) * u + s * 0.05); }
    lf.closePath(); ctx.fillStyle = IZ.turq; ctx.fill(lf); ctx.strokeStyle = IZ.outline; ctx.lineWidth = 1; ctx.stroke(lf);
  }
  // tulip on top
  ctx.save(); ctx.translate(0, -s * 0.24); ctx.scale(bloom, bloom);
  const tu = new Path2D(); tu.moveTo(0, s * 0.05); tu.bezierCurveTo(-s * 0.14, s * 0.03, -s * 0.12, -s * 0.12, -s * 0.06, -s * 0.2); tu.lineTo(-s * 0.02, -s * 0.08); tu.lineTo(0, -s * 0.22); tu.lineTo(s * 0.02, -s * 0.08); tu.lineTo(s * 0.06, -s * 0.2); tu.bezierCurveTo(s * 0.12, -s * 0.12, s * 0.14, s * 0.03, 0, s * 0.05);
  ctx.fillStyle = IZ.red; ctx.fill(tu); ctx.strokeStyle = IZ.outline; ctx.lineWidth = 1.2; ctx.stroke(tu);
  const tu2 = new Path2D(); tu2.moveTo(0, s * 0.02); tu2.quadraticCurveTo(-s * 0.05, -s * 0.06, 0, -s * 0.14); tu2.quadraticCurveTo(s * 0.05, -s * 0.06, 0, s * 0.02); ctx.fillStyle = IZ.cobalt; ctx.fill(tu2);
  ctx.restore();
  // carnations on the side branches: fan of serrated petals
  for (const [cx, cy, a] of [[-s * 0.29, -s * 0.13, -0.6], [s * 0.3, -s * 0.07, 0.6]] as [number, number, number][]) {
    ctx.save(); ctx.translate(cx, cy); ctx.rotate(a); ctx.scale(bloom, bloom);
    const fan = new Path2D(); fan.moveTo(0, s * 0.04);
    for (let k = 0; k <= 10; k++) { const an = -Math.PI * 0.85 + (k / 10) * Math.PI * 0.7; const rr = s * (k % 2 ? 0.11 : 0.14); fan.lineTo(Math.cos(an) * rr, Math.sin(an) * rr); }
    fan.closePath(); ctx.fillStyle = IZ.red; ctx.fill(fan); ctx.strokeStyle = IZ.outline; ctx.lineWidth = 1; ctx.stroke(fan);
    const cal = new Path2D(); cal.moveTo(-s * 0.04, s * 0.0); cal.lineTo(0, s * 0.07); cal.lineTo(s * 0.04, 0); cal.closePath(); ctx.fillStyle = IZ.green; ctx.fill(cal);
    ctx.restore();
  }
  // small cobalt rosettes and buds
  for (const [cx, cy] of [[-s * 0.34, s * 0.3], [s * 0.34, s * 0.3], [-s * 0.36, -s * 0.38], [s * 0.36, -s * 0.38]] as [number, number][]) {
    const rp = new Path2D(); for (let k = 0; k < 6; k++) petalPath(rp, 0, s * 0.06 * bloom, (k * TAU) / 6, 0.5, 0.5);
    ctx.save(); ctx.translate(cx, cy); ctx.fillStyle = IZ.cobalt; ctx.fill(rp); const c = new Path2D(); c.arc(0, 0, s * 0.015, 0, TAU); ctx.fillStyle = IZ.red; ctx.fill(c); ctx.restore();
  }
  ctx.restore();
  ctx.strokeStyle = 'rgba(120,120,130,0.55)'; ctx.lineWidth = 1.2; ctx.strokeRect(-s / 2, -s / 2, s, s);
}
export const drawIznik: DrawFn = ({ ctx, W, H, f, p }: DrawCtx) => {
  const t = f.t; const s = Math.max(110, Math.min(W, H) / (2.6 + p.complexity * 1.6));
  const nx = Math.ceil(W / 2 / s) + 1, ny = Math.ceil(H / 2 / s) + 1;
  const drift = (t * 6) % s;
  ctx.save(); ctx.translate(0, drift);
  for (let j = -ny - 1; j <= ny; j++) for (let i = -nx; i <= nx; i++) {
    ctx.save(); ctx.translate(i * s, j * s); iznikTile(ctx, s, t, i * 0.7 + j * 1.3, (i % 2) ? -1 : 1); ctx.restore();
  }
  ctx.restore();
  // cobalt border band with white cloud scrolls framing the panel
  const b = Math.min(W, H) * 0.06; ctx.fillStyle = IZ.cobalt; ctx.beginPath(); ctx.rect(-W / 2, -H / 2, W, H); ctx.rect(-W / 2 + b, -H / 2 + b, W - 2 * b, H - 2 * b); ctx.fill('evenodd');
  const cl = new Path2D(); for (let x = -W / 2; x < W / 2; x += b * 1.4) { for (const y of [-H / 2 + b / 2, H / 2 - b / 2]) { cl.moveTo(x + b * 0.5, y); cl.bezierCurveTo(x + b * 0.7, y - b * 0.3, x + b * 1.0, y + b * 0.3, x + b * 1.2, y); } }
  for (let y = -H / 2; y < H / 2; y += b * 1.4) { for (const x of [-W / 2 + b / 2, W / 2 - b / 2]) { cl.moveTo(x, y + b * 0.5); cl.bezierCurveTo(x - b * 0.3, y + b * 0.7, x + b * 0.3, y + b * 1.0, x, y + b * 1.2); } }
  ctx.strokeStyle = '#f4f1ea'; ctx.lineWidth = Math.max(1.5, b * 0.12); ctx.stroke(cl);
  sheen(ctx, W, H, t, 0.16);
};

// ------------------------------------------------------------------ Sufi whirling rosettes around a real Persian dome
export const drawSufiDome: DrawFn = ({ ctx, W, H, f, av }: DrawCtx) => {
  const t = f.t; const R = coverR(W, H); const m = Math.min(W, H);
  const bg = ctx.createRadialGradient(0, 0, 0, 0, 0, R); bg.addColorStop(0, '#16205a'); bg.addColorStop(1, '#04061a'); ctx.fillStyle = bg; ctx.fillRect(-R, -R, 2 * R, 2 * R);
  // rings of 12-fold rosettes whirling in alternate directions (like the turning of the sema)
  for (let k = 7; k >= 1; k--) {
    const rr = m * 0.14 * Math.pow(1.38, k); if (rr * 0.4 > R * 1.3) continue;
    const n = 12; const dir = k % 2 ? 1 : -1; const rot = dir * t * (0.05 / k + 0.01);
    const sz = (rr * TAU) / n * 0.42;
    const stars = new Path2D(), inner = new Path2D();
    for (let i = 0; i < n; i++) { const a = rot + (i * TAU) / n; const x = Math.cos(a) * rr, y = Math.sin(a) * rr; starPath(stars, 12, sz, sz * 0.62, a, x, y); starPath(inner, 6, sz * 0.5, sz * 0.28, a, x, y); }
    ctx.fillStyle = rgba(DOME[k % DOME.length], 0.85); ctx.fill(stars); ctx.fillStyle = rgba(DOME[(k + 3) % DOME.length], 0.95); ctx.fill(inner);
    ctx.strokeStyle = Z.gold; ctx.lineWidth = Math.max(1.2, sz * 0.05); ctx.stroke(stars); ctx.stroke(inner);
    const ring = new Path2D(); starPath(ring, 24, rr + sz * 1.1, rr + sz * 0.8, -rot);
    glow(ctx, ring, '#ffd27a', 1.4, 0.7);
  }
  // the real dome: Sheikh Lotfollah Mosque ceiling (photo, CC BY-SA 3.0, Phillip Maiwald) slowly turning at the centre
  const im = art('lotfollah-ceiling'); const dr = m * 0.3 * (1 + av.bass * 0.03);
  if (im) imageDisc(ctx, im, dr, t * 0.03); else { rosette16(ctx, dr, t * 0.03, PALS[3]); }
  const rim = new Path2D(); rim.arc(0, 0, dr, 0, TAU); ctx.strokeStyle = Z.black; ctx.lineWidth = 6; ctx.stroke(rim); glow(ctx, rim, '#ffd27a', 2);
  // drifting gold motes
  ctx.save(); ctx.globalCompositeOperation = 'lighter'; const r = rng(3); const motes = new Path2D();
  for (let i = 0; i < 160; i++) { const a = r() * TAU + t * (0.02 + r() * 0.05) * (i % 2 ? 1 : -1); const rad = dr + r() * R; const x = Math.cos(a) * rad, y = Math.sin(a) * rad; const s = 0.6 + r() * 1.6; motes.moveTo(x + s, y); motes.arc(x, y, s, 0, TAU); }
  ctx.fillStyle = 'rgba(255,220,140,0.7)'; ctx.fill(motes); ctx.restore();
};
