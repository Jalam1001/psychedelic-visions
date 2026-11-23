/**
 * Mandala renderers, rich-imagery version (draft 4). Original procedural designs in the general vocabulary of
 * Hindu lotus mandalas, Tibetan sand mandalas and the Sri Yantra. No deities are depicted; no artwork is copied.
 */
import type { DrawCtx, DrawFn } from '../views/CanvasView';
import { blit, cached, glow, noisePattern, petalPath, rgba, rng, smooth, starPath, polyPath, TAU } from './rich';
import { sriYantraTriangles, SY_BINDU_UNITS } from './sriyantra';

const coverR = (W: number, H: number) => Math.hypot(W, H) / 2;
const JEWEL = [
  ['#5a0d3a', '#e0457b'], ['#13235e', '#4f8cf0'], ['#0d4a3c', '#36c79a'], ['#5c1a06', '#f08a2a'],
  ['#3a0d5e', '#b067f0'], ['#5e4a06', '#f5cf3d'], ['#061f4a', '#2fc4e8'], ['#5e0a0a', '#ef4b3b'],
];
const GOLD = '#f2c75c';

function bindu(ctx: CanvasRenderingContext2D, r: number, pulse: number) {
  const g = ctx.createRadialGradient(0, 0, 0, 0, 0, r * (2.2 + pulse));
  g.addColorStop(0, 'rgba(255,255,240,1)'); g.addColorStop(0.25, 'rgba(255,220,120,0.9)'); g.addColorStop(1, 'rgba(255,140,40,0)');
  ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, r * (2.2 + pulse), 0, TAU); ctx.fill(); ctx.restore();
}

/** Shaded petal ring: one radial gradient per ring, gold outline. */
function petalRing(ctx: CanvasRenderingContext2D, n: number, r0: number, r1: number, rot: number, cols: string[], hwk = 1.05, belly = 0.55, line = 1) {
  const p = new Path2D();
  for (let i = 0; i < n; i++) petalPath(p, r0, r1, rot + (i * TAU) / n, (Math.PI / n) * hwk, belly);
  const g = ctx.createRadialGradient(0, 0, Math.max(0, r0), 0, 0, Math.max(r0 + 1, r1));
  g.addColorStop(0, cols[0]); g.addColorStop(0.65, cols[1]); g.addColorStop(1, '#fff3d6');
  ctx.fillStyle = g; ctx.fill(p);
  ctx.strokeStyle = GOLD; ctx.lineWidth = line; ctx.stroke(p);
  // inner vein
  if (r1 - r0 > 14) {
    const v = new Path2D();
    for (let i = 0; i < n; i++) petalPath(v, r0 + (r1 - r0) * 0.18, r0 + (r1 - r0) * 0.8, rot + (i * TAU) / n, (Math.PI / n) * hwk * 0.45, belly);
    ctx.strokeStyle = 'rgba(255,240,200,0.55)'; ctx.lineWidth = line * 0.7; ctx.stroke(v);
  }
}
function dotRing(ctx: CanvasRenderingContext2D, n: number, r: number, s: number, rot: number, col: string) {
  if (s < 0.6) return;
  const p = new Path2D();
  for (let i = 0; i < n; i++) { const a = rot + (i * TAU) / n; p.moveTo(Math.cos(a) * r + s, Math.sin(a) * r); p.arc(Math.cos(a) * r, Math.sin(a) * r, s, 0, TAU); }
  ctx.fillStyle = col; ctx.fill(p);
}

/** Infinite lotus: self-similar rings of shaded petals that bloom outward forever. */
export const drawLotus2: DrawFn = ({ ctx, W, H, f, av }) => {
  const CR = coverR(W, H); const q = 1.32; const s = f.t * 0.11; const fr = s - Math.floor(s); const base = Math.floor(s);
  const bg = ctx.createRadialGradient(0, 0, 0, 0, 0, CR);
  bg.addColorStop(0, '#3a0a3a'); bg.addColorStop(0.6, '#160a36'); bg.addColorStop(1, '#07061a');
  ctx.fillStyle = bg; ctx.fillRect(-CR, -CR, 2 * CR, 2 * CR);
  const r0 = 3;
  let kmax = Math.ceil(Math.log(CR * 1.4 / r0) / Math.log(q));
  for (let k = kmax; k >= 0; k--) {
    const r = r0 * Math.pow(q, k + fr); if (r < 6) break;
    const j = k - base; const cols = JEWEL[((j % 8) + 8) % 8];
    const n = [16, 24, 32][((j % 3) + 3) % 3]; const dir = j % 2 ? 1 : -1;
    const rot = dir * f.t * 0.04 + j * 0.37;
    const rin = r / q;
    const alpha = smooth(6, 30, r);
    ctx.globalAlpha = alpha;
    // back layer (offset, darker) then front petals
    petalRing(ctx, n, rin * 0.92, r * 1.06, rot + Math.PI / n, [cols[0], cols[0]], 1.1, 0.5, Math.max(0.6, r * 0.006));
    petalRing(ctx, n, rin * 0.9, r * (0.98 + 0.03 * av.pulse), rot, cols, 0.95, 0.55, Math.max(0.7, r * 0.008));
    dotRing(ctx, n, rin * 0.96, Math.max(0.8, r * 0.012), rot + Math.PI / n, '#ffe9a8');
    ctx.globalAlpha = 1;
  }
  // centre jewel
  const cr = r0 * Math.pow(q, 3);
  ctx.save(); ctx.rotate(f.t * 0.2);
  const st = new Path2D(); starPath(st, 8, cr, cr * 0.55); ctx.fillStyle = '#e0457b'; ctx.fill(st); glow(ctx, st, GOLD, 1.2, 0.8);
  ctx.restore();
  bindu(ctx, cr * 0.5, av.pulse);
  // drifting gold motes
  ctx.save(); ctx.globalCompositeOperation = 'lighter'; const R2 = rng(9);
  for (let i = 0; i < 70; i++) {
    const a = R2() * TAU + f.t * 0.03 * (R2() - 0.5); const d = ((R2() + f.t * 0.02 * (0.5 + R2())) % 1) * CR;
    ctx.fillStyle = `rgba(255,220,140,${0.5 * (1 - d / CR)})`; ctx.beginPath(); ctx.arc(Math.cos(a) * d, Math.sin(a) * d, 1.2 + R2() * 1.8, 0, TAU); ctx.fill();
  }
  ctx.restore();
};

// ---------------- Tibetan sand mandala ----------------
const SAND = { white: '#f1ece0', yellow: '#f2c230', red: '#d8342c', green: '#2f9a4a', blue: '#2a5fc4', black: '#141018', ochre: '#c99a5b', dark: '#1c1a3a', orange: '#f07a22' };

function paintSandMandala(x: CanvasRenderingContext2D, W: number, H: number, M: number) {
  const CR = coverR(W, H);
  // ground outside the circle: ochre sand with a faint grid
  x.fillStyle = '#8f5a2a'; x.fillRect(-CR, -CR, 2 * CR, 2 * CR);
  // outer rainbow edge + fire ring zone background
  const rings: [number, string][] = [[1.0, SAND.blue], [0.985, SAND.green], [0.97, SAND.yellow], [0.955, SAND.red], [0.94, SAND.white]];
  for (const [k, c] of rings) { x.fillStyle = c; x.beginPath(); x.arc(0, 0, M * k, 0, TAU); x.fill(); }
  x.fillStyle = '#3b0c08'; x.beginPath(); x.arc(0, 0, M * 0.925, 0, TAU); x.fill(); // fire ring ground (flames drawn live)
  // vajra ring
  x.fillStyle = SAND.dark; x.beginPath(); x.arc(0, 0, M * 0.84, 0, TAU); x.fill();
  const nv = 36;
  for (let i = 0; i < nv; i++) {
    x.save(); x.rotate((i * TAU) / nv);
    const r = M * 0.8, h = M * 0.032; x.fillStyle = SAND.yellow;
    x.beginPath(); x.ellipse(r, 0, h * 0.55, h * 1.5, 0, 0, TAU); x.fill();
    x.fillStyle = SAND.blue; x.beginPath(); x.arc(r, 0, h * 0.35, 0, TAU); x.fill();
    x.restore();
  }
  // lotus ring
  x.fillStyle = SAND.white; x.beginPath(); x.arc(0, 0, M * 0.765, 0, TAU); x.fill();
  const lp = new Path2D(); for (let i = 0; i < 48; i++) petalPath(lp, M * 0.68, M * 0.76, (i * TAU) / 48, Math.PI / 48, 0.5);
  const lg = x.createRadialGradient(0, 0, M * 0.68, 0, 0, M * 0.76); lg.addColorStop(0, '#f5d84a'); lg.addColorStop(0.5, '#ef6a3a'); lg.addColorStop(1, '#d8342c');
  x.fillStyle = lg; x.fill(lp); x.strokeStyle = '#7a1410'; x.lineWidth = 0.8; x.stroke(lp);
  // dark ground between palace and lotus ring (offering ground)
  x.fillStyle = '#121a40'; x.beginPath(); x.arc(0, 0, M * 0.68, 0, TAU); x.fill();
  // palace square with quadrant colours: bottom blue (east), left yellow (south), top red (west), right green (north)
  const S = M * 0.47;
  const quad = [SAND.blue, SAND.yellow, SAND.red, SAND.green]; // bottom, left, top, right
  const tri = (c: string, a: number) => { x.save(); x.rotate(a); x.fillStyle = c; x.beginPath(); x.moveTo(0, 0); x.lineTo(-S, S); x.lineTo(S, S); x.closePath(); x.fill(); x.restore(); };
  quad.forEach((c, i) => tri(c, (i * Math.PI) / 2));
  // T-shaped gates on each side
  for (let i = 0; i < 4; i++) {
    x.save(); x.rotate((i * Math.PI) / 2);
    const gw = S * 0.34, gd = S * 0.18;
    x.fillStyle = quad[i];
    x.fillRect(-gw / 2, S, gw, gd); x.fillRect(-gw * 0.85, S + gd * 0.6, gw * 1.7, gd * 0.55);
    x.strokeStyle = SAND.white; x.lineWidth = 1.5; x.strokeRect(-gw / 2, S, gw, gd); x.strokeRect(-gw * 0.85, S + gd * 0.6, gw * 1.7, gd * 0.55);
    // gate ornaments: small dharma-wheel circles
    x.fillStyle = SAND.yellow; x.beginPath(); x.arc(0, S + gd * 1.45, gd * 0.35, 0, TAU); x.fill();
    x.restore();
  }
  // five coloured wall bands
  const bands = [SAND.white, SAND.yellow, SAND.red, SAND.green, SAND.blue];
  bands.forEach((c, i) => { x.strokeStyle = c; x.lineWidth = S * 0.028; const s = S * (1 - 0.03 * i) - S * 0.014; x.strokeRect(-s, -s, 2 * s, 2 * s); });
  // garlands inside the walls
  const gp = new Path2D(); const n = 10;
  for (let side = 0; side < 4; side++) for (let i = 0; i < n; i++) {
    const a = (side * Math.PI) / 2; const u = -S * 0.82 + (i + 0.5) * (S * 1.64) / n; const v = S * 0.8;
    const c = Math.cos(a), s = Math.sin(a); const px = u * c - v * s, py = u * s + v * c;
    gp.moveTo(px + S * 0.025, py); gp.arc(px, py, S * 0.025, 0, TAU);
  }
  x.fillStyle = SAND.white; x.fill(gp);
  // inner circles: vajra-cross ring, lotus, jewel centre
  x.fillStyle = SAND.white; x.beginPath(); x.arc(0, 0, S * 0.62, 0, TAU); x.fill();
  x.fillStyle = SAND.dark; x.beginPath(); x.arc(0, 0, S * 0.58, 0, TAU); x.fill();
  for (let i = 0; i < 24; i++) { x.save(); x.rotate((i * TAU) / 24); x.fillStyle = i % 2 ? SAND.orange : SAND.yellow; x.beginPath(); x.ellipse(S * 0.53, 0, S * 0.03, S * 0.012, 0, 0, TAU); x.fill(); x.restore(); }
  const p8 = new Path2D(); for (let i = 0; i < 8; i++) petalPath(p8, S * 0.12, S * 0.48, (i * TAU) / 8 + Math.PI / 8, Math.PI / 8, 0.55);
  const pg = x.createRadialGradient(0, 0, S * 0.1, 0, 0, S * 0.48); pg.addColorStop(0, '#f7f2e4'); pg.addColorStop(0.5, '#f29ab8'); pg.addColorStop(1, '#d8342c');
  x.fillStyle = pg; x.fill(p8); x.strokeStyle = SAND.yellow; x.lineWidth = 2; x.stroke(p8);
  const p8b = new Path2D(); for (let i = 0; i < 8; i++) petalPath(p8b, S * 0.1, S * 0.36, (i * TAU) / 8, Math.PI / 9, 0.55);
  x.fillStyle = '#2fb0a0'; x.fill(p8b); x.stroke(p8b);
  x.fillStyle = SAND.yellow; x.beginPath(); x.arc(0, 0, S * 0.13, 0, TAU); x.fill();
  const j = new Path2D(); starPath(j, 8, S * 0.11, S * 0.06); x.fillStyle = SAND.blue; x.fill(j);
  x.fillStyle = SAND.white; x.beginPath(); x.arc(0, 0, S * 0.035, 0, TAU); x.fill();
  // sand grain texture
  x.save(); x.globalCompositeOperation = 'overlay'; x.globalAlpha = 0.55; x.fillStyle = noisePattern(x); x.fillRect(-CR, -CR, 2 * CR, 2 * CR); x.restore();
  x.save(); x.globalCompositeOperation = 'multiply'; x.globalAlpha = 0.25; x.fillStyle = noisePattern(x); x.scale(2, 2); x.fillRect(-CR, -CR, CR, CR * 2); x.restore();
}

export const drawTibetan2: DrawFn = ({ ctx, W, H, dpr, f, av }) => {
  const M = 0.46 * Math.max(W, H) * (W > H ? 0.62 : 0.72);
  const layer = cached('sand', W, H, Math.min(dpr, 1.5), (x) => paintSandMandala(x, W, H, M));
  const CR = coverR(W, H);
  const cyc = 44; const ph = (((f.t + 7) % cyc) + cyc) % cyc;
  const build = smooth(0, 22, ph); const dissolve = smooth(34, 43, ph);
  // sand ground always visible
  ctx.fillStyle = '#8f5a2a'; ctx.fillRect(-CR, -CR, 2 * CR, 2 * CR);
  const rev = Math.max(0.001, build * CR * 1.05) * (1 - dissolve);
  ctx.save();
  if (dissolve > 0) ctx.rotate(dissolve * dissolve * 2.5);
  ctx.beginPath(); ctx.arc(0, 0, rev, 0, TAU); ctx.clip();
  blit(ctx, layer, W, H);
  // live fire ring (flickering flames)
  if (rev > M * 0.85) {
    const fp = new Path2D(); const nf = 40;
    for (let i = 0; i < nf; i++) {
      const a = (i * TAU) / nf + f.t * 0.05; const h = M * (0.05 + 0.025 * Math.sin(f.t * 5 + i * 1.7) + 0.02 * av.pulse);
      petalPath(fp, M * 0.85, M * 0.85 + h + M * 0.02, a, Math.PI / nf * 0.9, 0.35);
    }
    const fg = ctx.createRadialGradient(0, 0, M * 0.85, 0, 0, M * 0.93);
    fg.addColorStop(0, '#ffe066'); fg.addColorStop(0.5, '#ff7a1a'); fg.addColorStop(1, '#d8202c');
    ctx.fillStyle = fg; ctx.fill(fp);
  }
  ctx.restore();
  // sand streams at the building / dissolving edge: falling coloured grains
  const edge = rev; const act = build < 1 ? 1 : dissolve > 0 && dissolve < 1 ? 1 : 0;
  if (act && edge < CR) {
    const R2 = rng(Math.floor(f.t * 20)); const cols = ['#f2c230', '#d8342c', '#2f9a4a', '#2a5fc4', '#f1ece0'];
    for (let i = 0; i < 160; i++) {
      const a = R2() * TAU; const d = edge + (R2() - 0.5) * 10;
      ctx.fillStyle = cols[i % 5]; ctx.fillRect(Math.cos(a) * d, Math.sin(a) * d, 1.6, 1.6);
    }
  }
  // gentle breathing glow at the centre
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  const g = ctx.createRadialGradient(0, 0, 0, 0, 0, M * 0.35);
  g.addColorStop(0, `rgba(255,230,160,${0.18 + 0.12 * Math.sin(f.t * 1.2) + 0.1 * av.pulse})`); g.addColorStop(1, 'rgba(255,230,160,0)');
  ctx.fillStyle = g; ctx.fillRect(-M, -M, 2 * M, 2 * M); ctx.restore();
};

// ---------------- Sri Yantra ----------------
const TRIS = sriYantraTriangles();
function triPath(u: number, i: number) {
  const tr = TRIS[i]; const p = new Path2D();
  p.moveTo(-tr.half * u, tr.y * u); p.lineTo(tr.half * u, tr.y * u); p.lineTo(0, tr.apexY * u); p.closePath(); return p;
}
function paintSriBase(x: CanvasRenderingContext2D, W: number, H: number, B: number) {
  const CR = coverR(W, H);
  const bg = x.createRadialGradient(0, 0, B * 0.5, 0, 0, CR); bg.addColorStop(0, '#6e0f1a'); bg.addColorStop(1, '#1f0612');
  x.fillStyle = bg; x.fillRect(-CR, -CR, 2 * CR, 2 * CR);
  // bhupura: three nested squares with four T gates, coloured bands
  const gate = (s: number) => { const p = new Path2D(); const g = s * 0.22, d = s * 0.12;
    const pts: [number, number][] = [];
    for (let side = 0; side < 4; side++) {
      const loc: [number, number][] = [[-s, s], [-g, s], [-g, s + d], [-g * 1.6, s + d], [-g * 1.6, s + d * 2], [g * 1.6, s + d * 2], [g * 1.6, s + d], [g, s + d], [g, s]];
      const a = (side * Math.PI) / 2, c = Math.cos(a), sn = Math.sin(a);
      for (const [px, py] of loc) pts.push([px * c - py * sn, px * sn + py * c]);
    }
    pts.forEach(([px, py], i) => (i ? p.lineTo(px, py) : p.moveTo(px, py))); p.closePath(); return p; };
  const bands: [number, string][] = [[1, '#1f8a4c'], [0.955, '#f2c230'], [0.91, '#d8342c']];
  for (const [k, c] of bands) { const p = gate(B * k); x.fillStyle = c; x.fill(p); x.strokeStyle = '#ffe6a0'; x.lineWidth = 1.5; x.stroke(p); }
  x.fillStyle = '#f6efdc'; x.fillRect(-B * 0.87, -B * 0.87, B * 1.74, B * 1.74);
  const Rc = B * 0.5;
  // three circles
  ([[0.84, '#f2c230'], [0.82, '#d8342c'], [0.8, '#1f8a4c']] as [number, string][]).forEach(([k, c]) => { x.fillStyle = c; x.beginPath(); x.arc(0, 0, B * k, 0, TAU); x.fill(); });
  // 16 petals
  x.fillStyle = '#18307a'; x.beginPath(); x.arc(0, 0, B * 0.78, 0, TAU); x.fill();
  petalRing(x, 16, Rc * 1.22, B * 0.77, -Math.PI / 2, ['#b0174a', '#f07aa8'], 1.0, 0.5, 1.4);
  x.fillStyle = '#18307a'; x.beginPath(); x.arc(0, 0, Rc * 1.24, 0, TAU); x.fill();
  petalRing(x, 8, Rc * 1.0, Rc * 1.24, -Math.PI / 2, ['#c2410c', '#f6b23a'], 1.0, 0.5, 1.4);
  // inner disc
  const ig = x.createRadialGradient(0, 0, 0, 0, 0, Rc); ig.addColorStop(0, '#2a4fb8'); ig.addColorStop(1, '#0e1f5e');
  x.fillStyle = ig; x.beginPath(); x.arc(0, 0, Rc * 1.0, 0, TAU); x.fill();
  x.strokeStyle = GOLD; x.lineWidth = 2; x.stroke();
}
function sriYantra(animated: boolean): DrawFn {
  return ({ ctx, W, H, dpr, f, av }) => {
    const CR = coverR(W, H); const B = Math.min(W, H) * 0.47;
    const Rc = B * 0.5; const u = Rc / 24;
    ctx.drawImage(cached('sri', W, H, Math.min(dpr, 1.75), (x) => paintSriBase(x, W, H, B)), -W / 2, -H / 2, W, H);
    // animated outer field: slow rotating rays and petal rings beyond the bhupura (fills phone screens)
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    const rays = new Path2D(); const nr = 48;
    for (let i = 0; i < nr; i++) petalPath(rays, B * 1.15, CR, (i * TAU) / nr + f.t * 0.02, Math.PI / nr * 0.5, 0.3);
    ctx.fillStyle = `rgba(255,170,60,${0.10 + 0.05 * Math.sin(f.t * 0.7)})`; ctx.fill(rays);
    for (let k = 0; k < 3; k++) {
      const r = B * (1.25 + 0.38 * k) + ((f.t * 6) % (B * 0.38)); const p = new Path2D();
      for (let i = 0; i < 32; i++) petalPath(p, r, r + B * 0.12, (i * TAU) / 32 + (k % 2 ? 1 : -1) * f.t * 0.03, Math.PI / 32, 0.5);
      ctx.strokeStyle = 'rgba(255,200,110,0.35)'; ctx.lineWidth = 1.2; ctx.stroke(p);
    }
    ctx.restore();
    // triangles
    const by = SY_BINDU_UNITS - 24;
    const cyc = 24; const ph = ((f.t % cyc) + cyc) % cyc;
    ctx.save(); ctx.beginPath(); ctx.arc(0, 0, Rc * 0.995, 0, TAU); ctx.clip();
    const order = [6, 2, 0, 5, 1, 7, 3, 8, 4];
    order.forEach((i, n) => {
      const tr = TRIS[i]; const appear = animated ? smooth(n * 1.6, n * 1.6 + 1.6, ph) * (1 - smooth(21, 23.8, ph)) : 1;
      if (appear <= 0) return;
      const p = triPath(u, i);
      ctx.globalAlpha = 0.33 * appear; ctx.fillStyle = tr.down ? '#ff3b30' : '#ffb020'; ctx.fill(p);
      ctx.globalAlpha = 1;
      if (animated && appear < 1) { ctx.setLineDash([2000 * appear, 4000]); }
      glow(ctx, p, '#ffcf5a', 1.3 + 0.6 * av.pulse, 0.55 + 0.3 * (animated ? 0.5 + 0.5 * Math.sin(f.t * 2 - n) : 0.6 + 0.4 * Math.sin(f.t * 0.8)));
      ctx.setLineDash([]);
    });
    ctx.restore();
    // bindu
    ctx.save(); ctx.translate(0, by * u); bindu(ctx, u * 1.1, 0.6 + 0.5 * Math.sin(f.t * 1.5) + av.pulse); ctx.restore();
    if (animated) {
      // pulses of light expanding from the bindu through the rings
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      for (let k = 0; k < 3; k++) {
        const r = ((f.t * 0.25 + k / 3) % 1) * B * 1.1;
        ctx.strokeStyle = `rgba(255,220,140,${0.5 * (1 - r / (B * 1.1))})`; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(0, by * u * (1 - r / B), r, 0, TAU); ctx.stroke();
      }
      ctx.restore();
    }
  };
}
export const drawSriStatic2 = sriYantra(false);
export const drawSriAnimated2 = sriYantra(true);

// ---------------- Alexander's living mandala ----------------
/** Rings of small "centres" (mini rosettes and lotuses) that support the main centre and grow outward. */
export const drawAlexander2: DrawFn = ({ ctx, W, H, f, av }) => {
  const CR = coverR(W, H); const q = 1.5; const s = f.t * 0.09; const fr = s - Math.floor(s); const base = Math.floor(s);
  const bg = ctx.createRadialGradient(0, 0, 0, 0, 0, CR); bg.addColorStop(0, '#2b0f3d'); bg.addColorStop(1, '#0a0b24');
  ctx.fillStyle = bg; ctx.fillRect(-CR, -CR, 2 * CR, 2 * CR);
  const r0 = 6; const kmax = Math.ceil(Math.log(CR * 1.3 / r0) / Math.log(q));
  for (let k = kmax; k >= 0; k--) {
    const r = r0 * Math.pow(q, k + fr); if (r < 8) break;
    const j = k - base; const cols = JEWEL[((j % 8) + 8) % 8]; const cols2 = JEWEL[(((j + 3) % 8) + 8) % 8];
    const n = 12; const cr = r * Math.sin(Math.PI / n) * 0.82; const rot = (j % 2 ? 1 : -1) * f.t * 0.05 + j * 0.2;
    ctx.globalAlpha = smooth(8, 40, r);
    // boundary band joining the ring
    ctx.strokeStyle = cols[1]; ctx.lineWidth = Math.max(1, r * 0.035); ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.stroke();
    ctx.strokeStyle = GOLD; ctx.lineWidth = Math.max(0.6, r * 0.008); ctx.beginPath(); ctx.arc(0, 0, r - r * 0.03, 0, TAU); ctx.arc(0, 0, r + r * 0.03, 0, TAU); ctx.stroke();
    for (let i = 0; i < n; i++) {
      const a = rot + (i * TAU) / n; ctx.save(); ctx.translate(Math.cos(a) * r, Math.sin(a) * r); ctx.rotate(a + f.t * 0.3 * (i % 2 ? 1 : -1));
      if ((i + j) % 2) { petalRing(ctx, 8, cr * 0.15, cr, 0, cols2, 1, 0.55, Math.max(0.5, cr * 0.03)); }
      else { const st = new Path2D(); starPath(st, 8, cr, cr * 0.6); ctx.fillStyle = cols[1]; ctx.fill(st); ctx.strokeStyle = GOLD; ctx.lineWidth = Math.max(0.5, cr * 0.04); ctx.stroke(st);
        const in2 = new Path2D(); polyPath(in2, 8, cr * 0.45, Math.PI / 8); ctx.fillStyle = cols2[0]; ctx.fill(in2); }
      ctx.fillStyle = '#fff2c4'; ctx.beginPath(); ctx.arc(0, 0, cr * (0.14 + 0.06 * av.pulse), 0, TAU); ctx.fill();
      ctx.restore();
    }
    ctx.globalAlpha = 1;
  }
  bindu(ctx, 6, av.pulse);
};
