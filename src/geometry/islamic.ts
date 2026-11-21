import type { DrawCtx } from '../views/CanvasView';
import { withAlpha } from '../state/palettes';
import { TAU, caption, polyPath, reveal, rosettePath, starInner, starK, starLines, starPath, steppedDiamond, visibleRect } from './draw';

/* ------------------------------------------------------------------ *
 * A. Living Turkish carpet — medallions, borders, nested motifs that
 *    unfold level by level (Alexander: levels of scale, alternating
 *    repetition, strong centres, boundaries, roughness/abrash).
 * ------------------------------------------------------------------ */
/** Cached "wool" grain: thousands of tiny offset knots, so the carpet reads as textile, not flat vector. */
let woolTile: HTMLCanvasElement | null = null;
function woolPattern(ctx: CanvasRenderingContext2D) {
  if (!woolTile) {
    woolTile = document.createElement('canvas');
    woolTile.width = woolTile.height = 120;
    const g = woolTile.getContext('2d')!;
    let seed = 7;
    const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
    for (let y = 0; y < 120; y += 3) for (let x = 0; x < 120; x += 2.5) {
      const v = rnd();
      g.fillStyle = v > 0.5 ? `rgba(255,240,220,${(v - 0.5) * 0.35})` : `rgba(0,0,0,${(0.5 - v) * 0.5})`;
      g.beginPath(); g.ellipse(x + rnd(), y + rnd(), 1.1, 1.6, 0.3, 0, TAU); g.fill();
    }
  }
  return ctx.createPattern(woolTile, 'repeat');
}

/** Lotto-style arabesque: a cruciform palmette lattice drawn as gold ribbons with dark outlines. */
function lottoCell(ctx: CanvasRenderingContext2D, cx: number, cy: number, s: number, gold: string, dark: string, lw: number, grow: number, wob: number) {
  const ribbon = (draw: () => void) => {
    ctx.strokeStyle = dark; ctx.lineWidth = lw * 1.9; draw(); ctx.stroke();
    ctx.strokeStyle = gold; ctx.lineWidth = lw; draw(); ctx.stroke();
  };
  ctx.save();
  ctx.setLineDash([s * 4 * grow, s * 8]);
  for (let q = 0; q < 4; q++) {
    const a = q * TAU / 4;
    const c = Math.cos(a), sn = Math.sin(a);
    const P = (x: number, y: number): [number, number] => [cx + x * c - y * sn, cy + x * sn + y * c];
    ribbon(() => {
      ctx.beginPath();
      const [x1, y1] = P(0, 0); const [x2, y2] = P(s * 0.5, -s * (0.32 + wob)); const [x3, y3] = P(s, 0);
      const [x4, y4] = P(s * 0.5, s * (0.32 + wob));
      ctx.moveTo(x1, y1); ctx.quadraticCurveTo(x2, y2, x3, y3); ctx.quadraticCurveTo(x4, y4, x1, y1);
    });
    // palmette tip
    ribbon(() => {
      ctx.beginPath();
      const [a1, b1] = P(s * 0.55, 0); const [a2, b2] = P(s * 0.78, -s * 0.12); const [a3, b3] = P(s * 0.78, s * 0.12);
      ctx.moveTo(a1, b1); ctx.lineTo(a2, b2); ctx.lineTo(a3, b3); ctx.closePath();
    });
  }
  ctx.restore();
}

/** Interlaced 8-point "Holbein" star knot: two squares woven over/under, outlined. */
function holbeinKnot(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, rot: number, fill: string, line: string, inner: string) {
  ctx.lineJoin = 'round';
  for (let k = 0; k < 2; k++) {
    polyPath(ctx, cx, cy, r, 4, rot + k * Math.PI / 4);
    ctx.fillStyle = fill; ctx.fill();
    ctx.strokeStyle = line; ctx.lineWidth = r * 0.09; ctx.stroke();
  }
  polyPath(ctx, cx, cy, r * 0.62, 8, rot + Math.PI / 8);
  ctx.strokeStyle = line; ctx.lineWidth = r * 0.07; ctx.stroke();
  rosettePath(ctx, cx, cy, r * 0.5, r * 0.26, 8, -rot);
  ctx.fillStyle = inner; ctx.fill();
  ctx.beginPath(); ctx.arc(cx, cy, r * 0.12, 0, TAU); ctx.fillStyle = line; ctx.fill();
}

export function drawCarpet(d: DrawCtx) {
  const { ctx, W, H, f, p, pal, av } = d;
  const S = pal.swatch;
  const t = f.t;
  const levels = Math.round(p.depth) + 1;
  const u = (t * 0.55 + 1.2) % (levels + 6); // unfold in a few seconds, hold, then re-weave
  const landscape = W > H;
  let cw: number, ch: number;
  if (landscape) { ch = H * 0.9; cw = Math.min(W * 0.94, ch * 1.55); } else { cw = W * 0.92; ch = Math.min(H * 0.9, cw * 1.6); }
  const x0 = -cw / 2, y0 = -ch / 2;
  const bw = Math.min(cw, ch) * 0.1;
  const ground = S[1], gold = S[2], ivory = S[3], green = S[4], indigo = S[5], plum = S[6] ?? S[1];
  const dark = S[0];

  // ground with abrash (natural dye-lot colour bands) and a radial glow
  ctx.fillStyle = ground; ctx.fillRect(x0, y0, cw, ch);
  for (let i = 0; i < 22; i++) {
    const v = Math.sin(i * 12.9898) * 43758.5453; const r = v - Math.floor(v);
    ctx.fillStyle = withAlpha(r > 0.5 ? '#000000' : '#ffd0a0', 0.03 + r * 0.05);
    ctx.fillRect(x0, y0 + (i / 22) * ch, cw, ch / 22 + 1);
  }
  const rg = ctx.createRadialGradient(0, 0, 0, 0, 0, Math.max(cw, ch) * 0.6);
  rg.addColorStop(0, withAlpha('#ffb070', 0.18 + 0.12 * av.bass)); rg.addColorStop(1, 'rgba(0,0,0,0.25)');
  ctx.fillStyle = rg; ctx.fillRect(x0, y0, cw, ch);

  // field: Lotto arabesque lattice in gold, growing in
  const fx0 = x0 + bw * 1.25, fy0 = y0 + bw * 1.25, fw = cw - bw * 2.5, fh = ch - bw * 2.5;
  const shortN = 2 + Math.round(p.complexity * 2);
  const cols = landscape ? Math.round(shortN * (fw / fh)) : shortN;
  const rows = landscape ? shortN : Math.round(shortN * (fh / fw));
  const cwid = fw / cols, chei = fh / rows;
  const m = Math.min(cwid, chei) * 0.5;
  ctx.save();
  ctx.beginPath(); ctx.rect(fx0, fy0, fw, fh); ctx.clip();
  const latA = reveal(u, 1);
  if (latA > 0) {
    ctx.globalAlpha = Math.min(1, latA * 1.2);
    const grow = Math.min(1, Math.max(0.02, (u - 1) / 2.5));
    for (let i = 0; i <= cols; i++) for (let j = 0; j <= rows; j++) {
      const wob = 0.06 * Math.sin(t * 0.8 + i * 1.3 + j * 0.7) + 0.05 * av.mid;
      lottoCell(ctx, fx0 + i * cwid, fy0 + j * chei, m * 0.95, gold, dark, m * 0.075, grow, wob);
    }
  }
  // medallions: Holbein star knots alternating with stepped octagon gul
  const rotI = t * 0.12 * (0.4 + p.rotation) + av.mid * 0.3;
  for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) {
    const cx = fx0 + (i + 0.5) * cwid, cy = fy0 + (j + 0.5) * chei;
    const jitter = Math.sin((i * 7 + j * 13) * 1.7) * 0.15;
    const a2 = reveal(u, 2.2 + jitter + (Math.abs(i - (cols - 1) / 2) + Math.abs(j - (rows - 1) / 2)) * 0.35);
    if (a2 <= 0) continue;
    ctx.globalAlpha = a2;
    const sc = (0.55 + 0.45 * a2) * (1 + 0.06 * av.bass + 0.02 * av.pulse);
    const mr = m * 0.62 * sc;
    const dir = (i + j) % 2 === 0 ? 1 : -1;
    // glow halo
    const hg = ctx.createRadialGradient(cx, cy, mr * 0.2, cx, cy, mr * 1.5);
    hg.addColorStop(0, withAlpha(gold, 0.35 + 0.2 * av.bass)); hg.addColorStop(1, withAlpha(gold, 0));
    ctx.fillStyle = hg; ctx.beginPath(); ctx.arc(cx, cy, mr * 1.5, 0, TAU); ctx.fill();
    if ((i + j) % 2 === 0) {
      polyPath(ctx, cx, cy, mr * 1.08, 8, Math.PI / 8); ctx.fillStyle = indigo; ctx.fill();
      ctx.strokeStyle = ivory; ctx.lineWidth = mr * 0.06; ctx.stroke();
      holbeinKnot(ctx, cx, cy, mr * 0.9, rotI * dir, plum, ivory, gold);
    } else {
      steppedDiamond(ctx, cx, cy, mr * 1.05, mr * 1.05, 5); ctx.fillStyle = green; ctx.fill();
      ctx.strokeStyle = gold; ctx.lineWidth = mr * 0.05; ctx.stroke();
      starPath(ctx, cx, cy, mr * 0.78, 8, 3, rotI * dir); ctx.fillStyle = ivory; ctx.fill();
      starPath(ctx, cx, cy, mr * 0.55, 8, 3, -rotI * dir + Math.PI / 8); ctx.fillStyle = ground; ctx.fill();
      rosettePath(ctx, cx, cy, mr * 0.32, mr * 0.18, 8, rotI); ctx.fillStyle = gold; ctx.fill();
    }
  }
  ctx.restore();
  ctx.globalAlpha = 1;

  // borders: guard stripes + pseudo-kufic interlace band with a colour wave running around it
  const a0 = reveal(u, 0);
  if (a0 > 0) {
    ctx.globalAlpha = a0;
    ctx.fillStyle = dark;
    ctx.beginPath(); ctx.rect(x0, y0, cw, ch); ctx.rect(x0 + bw * 1.25, y0 + bw * 1.25, cw - bw * 2.5, ch - bw * 2.5); ctx.fill('evenodd');
    ctx.fillStyle = indigo;
    ctx.beginPath(); ctx.rect(x0 + bw * 0.22, y0 + bw * 0.22, cw - bw * 0.44, ch - bw * 0.44); ctx.rect(x0 + bw * 1.05, y0 + bw * 1.05, cw - bw * 2.1, ch - bw * 2.1); ctx.fill('evenodd');
    // kufic stems
    const inset = bw * 0.63;
    const step = bw * 0.42;
    const sides: [number, number, number, number][] = [[x0 + inset, y0 + inset, 1, 0], [x0 + cw - inset, y0 + inset, 0, 1], [x0 + cw - inset, y0 + ch - inset, -1, 0], [x0 + inset, y0 + ch - inset, 0, -1]];
    let k = 0;
    sides.forEach(([sx, sy, dx, dy], si) => {
      const len = si % 2 === 0 ? cw - 2 * inset : ch - 2 * inset;
      const n = Math.floor(len / step);
      for (let q = 0; q < n; q++, k++) {
        const x = sx + dx * (q + 0.5) * step, y = sy + dy * (q + 0.5) * step;
        const wave = 0.5 + 0.5 * Math.sin(k * 0.35 - t * 2.2);
        const nx = -dy, ny = dx; // inward normal
        const tall = q % 3 === 1 ? 0.36 : 0.2;
        ctx.strokeStyle = wave > 0.75 ? ivory : gold;
        ctx.lineWidth = step * 0.32; ctx.lineCap = 'square';
        ctx.beginPath(); ctx.moveTo(x - nx * bw * 0.28, y - ny * bw * 0.28); ctx.lineTo(x + nx * bw * tall, y + ny * bw * tall); ctx.stroke();
        if (q % 3 === 1) { ctx.beginPath(); ctx.moveTo(x + nx * bw * tall - dx * step * 0.5, y + ny * bw * tall - dy * step * 0.5); ctx.lineTo(x + nx * bw * tall + dx * step * 0.5, y + ny * bw * tall + dy * step * 0.5); ctx.stroke(); }
        if (q % 6 === 4) { ctx.fillStyle = withAlpha(S[1], 1); starPath(ctx, x, y, step * 0.45, 8, 3, t * 0.5); ctx.fill(); }
      }
    });
    // inner guard: running-dog wave
    ctx.strokeStyle = ivory; ctx.lineWidth = bw * 0.05;
    ctx.beginPath();
    const gy = bw * 1.15;
    for (let x = x0 + gy; x <= x0 + cw - gy; x += bw * 0.1) {
      const yy = Math.sin((x - x0) / (bw * 0.3) - t * 1.5) * bw * 0.05;
      if (x === x0 + gy) ctx.moveTo(x, y0 + gy + yy); else ctx.lineTo(x, y0 + gy + yy);
    }
    ctx.stroke();
    ctx.beginPath();
    for (let x = x0 + gy; x <= x0 + cw - gy; x += bw * 0.1) {
      const yy = Math.sin((x - x0) / (bw * 0.3) + t * 1.5) * bw * 0.05;
      if (x === x0 + gy) ctx.moveTo(x, y0 + ch - gy + yy); else ctx.lineTo(x, y0 + ch - gy + yy);
    }
    ctx.stroke();
    ctx.globalAlpha = 1;
  }

  // wool grain + travelling silk sheen
  const pat = woolPattern(ctx);
  if (pat) { ctx.save(); ctx.globalAlpha = 0.55; ctx.fillStyle = pat; ctx.fillRect(x0, y0, cw, ch); ctx.restore(); }
  const sx = ((t * 0.12) % 1.6 - 0.3) * (cw + ch);
  const lg = ctx.createLinearGradient(x0 + sx - ch, y0, x0 + sx, y0 + ch);
  lg.addColorStop(0, 'rgba(255,255,255,0)'); lg.addColorStop(0.5, `rgba(255,235,200,${0.1 + 0.08 * av.high})`); lg.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = lg; ctx.fillRect(x0, y0, cw, ch); ctx.restore();
}

/* ------------------------------------------------------------------ *
 * B. Infinite Islamic tessellation — star-and-cross (square lattice) or
 *    hexagonal rosette lattice with interlaced straps; infinite zoom by
 *    cross-fading two lattice scales an octave apart.
 * ------------------------------------------------------------------ */
function latticeLayer(d: DrawCtx, L: number, alpha: number, rot: number) {
  const { ctx, p, pal, av } = d;
  const S = pal.swatch;
  const sym = Math.round(p.symmetry);
  const hex = sym % 6 === 0;
  const n = hex ? (sym >= 12 ? 12 : 6) : (sym >= 16 ? 16 : 8);
  const k = starK(n);
  const vr = visibleRect(d);
  const pad = L * 1.5;
  const rad = Math.hypot(vr.x1 - vr.x0, vr.y1 - vr.y0) / 2 + pad;
  const cxv = (vr.x0 + vr.x1) / 2, cyv = (vr.y0 + vr.y1) / 2;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = S[2];
  ctx.fillRect(vr.x0 - 2, vr.y0 - 2, vr.x1 - vr.x0 + 4, vr.y1 - vr.y0 + 4);
  ctx.rotate(rot);
  const dy = hex ? L * Math.sqrt(3) / 2 : L;
  const j0 = Math.floor((cyv - rad) / dy), j1 = Math.ceil((cyv + rad) / dy);
  const i0 = Math.floor((cxv - rad) / L) - 1, i1 = Math.ceil((cxv + rad) / L) + 1;
  const Rs = L * 0.5;
  const strap = L * (0.055 + 0.015 * av.bass);
  const detail = p.complexity;
  for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) {
    const x = i * L + (hex && j % 2 !== 0 ? L / 2 : 0), y = j * dy;
    if (Math.hypot(x - cxv, y - cyv) > rad) continue;
    starPath(ctx, x, y, Rs, n, k, Math.PI / n * (hex ? 1 : 0) + (hex ? Math.PI / 6 : 0));
    ctx.fillStyle = S[1]; ctx.fill();
    ctx.strokeStyle = S[3]; ctx.lineWidth = strap; ctx.stroke();
    ctx.strokeStyle = withAlpha(S[0], 0.85); ctx.lineWidth = strap * 0.28; ctx.stroke();
    if (detail > 0.25) {
      ctx.fillStyle = S[4]; rosettePath(ctx, x, y, Rs * 0.48, Rs * 0.48 * starInner(n, k), n, Math.PI / n); ctx.fill();
    }
    if (detail > 0.55) {
      ctx.strokeStyle = withAlpha(S[3], 0.7 + 0.3 * av.high); ctx.lineWidth = strap * 0.35;
      starLines(ctx, x, y, Rs * 0.3, n, k); ctx.stroke();
    }
    if (!hex) { // supporting centre in the cross
      ctx.fillStyle = S[5]; starPath(ctx, x + L / 2, y + L / 2, Rs * 0.2, 8, 3, Math.PI / 8); ctx.fill();
    }
  }
  ctx.restore();
}

export function drawTessellation(d: DrawCtx) {
  const { R, f, p } = d;
  const z = f.t * 0.05;
  const phase = z - Math.floor(z);
  const base = R * 0.5 * Math.pow(2, phase);
  const rot = f.t * 0.02 * p.rotation + d.av.mid * 0.1;
  latticeLayer(d, base, 1, rot);
  if (phase > 0.01) latticeLayer(d, base / 2, phase * phase * (3 - 2 * phase), rot);
}

/* ------------------------------------------------------------------ *
 * C. Alexander's recursive centres — a centre is strengthened by
 *    supporting centres at smaller scales; the field unfolds level by level.
 * ------------------------------------------------------------------ */
const PROPS = ['Strong centres', 'Boundaries', 'Levels of scale', 'Alternating repetition', 'Local symmetries', 'Echoes', 'Deep interlock', 'The void', 'Not-separateness'];

function centre(d: DrawCtx, x: number, y: number, r: number, level: number, maxL: number, u: number, n: number, rot: number) {
  const { ctx, pal, av } = d;
  const S = pal.swatch;
  const a = reveal(u, level);
  if (a <= 0.01 || r < 1.6) return;
  const c1 = S[1 + (level % 5)], c2 = S[1 + ((level + 2) % 5)], c3 = S[1 + ((level + 3) % 5)];
  ctx.globalAlpha = a;
  // boundary: an annulus that both separates and joins (not-separateness)
  ctx.beginPath(); ctx.arc(x, y, r * 1.18, 0, TAU); ctx.arc(x, y, r, 0, TAU, true); ctx.fillStyle = withAlpha(c2, 0.55); ctx.fill();
  // body alternates star / polygon / rosette by level (alternating repetition)
  const kind = level % 3;
  ctx.fillStyle = c1;
  if (kind === 0) starPath(ctx, x, y, r, n, starK(n), rot);
  else if (kind === 1) polyPath(ctx, x, y, r * 0.95, n, rot + Math.PI / n);
  else rosettePath(ctx, x, y, r, r * 0.72, n, rot);
  ctx.fill();
  ctx.strokeStyle = withAlpha(S[3], 0.8); ctx.lineWidth = Math.max(0.5, r * 0.04); ctx.stroke();
  // the void: calm empty core
  ctx.beginPath(); ctx.arc(x, y, r * (0.28 + 0.04 * av.bass), 0, TAU); ctx.fillStyle = S[0]; ctx.fill();
  ctx.beginPath(); ctx.arc(x, y, r * 0.1, 0, TAU); ctx.fillStyle = c3; ctx.fill();
  if (level >= maxL) return;
  // nested inner centre + supporting outer centres
  centre(d, x, y, r * 0.5, level + 1, maxL, u, n, -rot);
  const k = level === 0 ? n : 4;
  for (let i = 0; i < k; i++) {
    const ang = rot + (i / k) * TAU + (level % 2 ? Math.PI / k : 0);
    centre(d, x + Math.cos(ang) * r * 1.6, y + Math.sin(ang) * r * 1.6, r * 0.36, level + 1, maxL, u, level === 0 ? 8 : 6, rot * 1.3);
  }
}

export function drawRecursiveCentres(d: DrawCtx) {
  const { ctx, R, W, H, f, p, pal } = d;
  const maxL = Math.round(p.depth);
  const u = (f.t * 0.22 + 1.5) % (maxL + 5);
  const n = Math.max(4, Math.min(16, Math.round(p.symmetry)));
  const rot = f.t * 0.03 * p.rotation;
  // frame boundary
  ctx.globalAlpha = reveal(u, 1) * 0.8;
  ctx.strokeStyle = pal.swatch[3]; ctx.lineWidth = R * 0.012;
  ctx.strokeRect(-W / 2 + R * 0.08, -H / 2 + R * 0.08, W - R * 0.16, H - R * 0.16);
  // local symmetries in the corners
  const cx = W / 2 - R * 0.32, cy = H / 2 - R * 0.32;
  [[-1, -1], [1, -1], [1, 1], [-1, 1]].forEach(([sx, sy]) => centre(d, sx * cx, sy * cy, R * 0.12, 2, Math.min(maxL, 4), u, 8, -rot));
  centre(d, 0, 0, R * 0.33, 0, maxL, u, n, rot);
  ctx.globalAlpha = 1;
  caption(d, PROPS.slice(0, Math.min(PROPS.length, Math.floor(u) + 1)).map((s, i) => ({ text: `${i + 1}. ${s}`, alpha: reveal(u, i) * 0.85 })));
}

/* ------------------------------------------------------------------ *
 * D. Persian garden of geometry — chahar-bagh layout, water channels,
 *    central pool medallion and spiral arabesques.
 * ------------------------------------------------------------------ */
function arabesque(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, ang: number, dir: number, depth: number, col: string, leaf: string, grow: number) {
  if (depth < 0 || r < 3) return;
  const turns = 1.25 * grow;
  const steps = 26;
  ctx.beginPath();
  let px = x, py = y;
  const pts: [number, number, number][] = [];
  for (let i = 0; i <= steps; i++) {
    const s = i / steps;
    const a = ang + dir * s * turns * TAU;
    const rr = r * Math.exp(-s * 1.6);
    px = x + Math.cos(a) * rr; py = y + Math.sin(a) * rr;
    pts.push([px, py, a]);
    i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
  }
  ctx.strokeStyle = col; ctx.lineWidth = Math.max(0.8, r * 0.05); ctx.stroke();
  for (let i = 4; i < pts.length - 2; i += 6) {
    const [lx, ly, a] = pts[i];
    ctx.save(); ctx.translate(lx, ly); ctx.rotate(a + dir * 1.2);
    ctx.beginPath(); ctx.ellipse(r * 0.12, 0, r * 0.13, r * 0.045, 0, 0, TAU); ctx.fillStyle = leaf; ctx.fill(); ctx.restore();
    if (depth > 0) arabesque(ctx, lx, ly, r * 0.38, a + Math.PI / 2 * dir, -dir, depth - 1, col, leaf, grow);
  }
  // palmette bud at the end
  ctx.beginPath(); ctx.arc(px, py, r * 0.06, 0, TAU); ctx.fillStyle = leaf; ctx.fill();
}

export function drawPersianGarden(d: DrawCtx) {
  const { ctx, R, f, p, pal, av } = d;
  const S = pal.swatch;
  const t = f.t;
  const G = R * 1.8;
  const u = (t * 0.2 + 1.5) % (p.depth + 6);
  // outer border
  ctx.fillStyle = S[4]; ctx.fillRect(-G / 2 - R * 0.06, -G / 2 - R * 0.06, G + R * 0.12, G + R * 0.12);
  ctx.fillStyle = S[0]; ctx.fillRect(-G / 2, -G / 2, G, G);
  // cartouches along the border
  const nb = 12;
  ctx.globalAlpha = reveal(u, 0);
  for (let s = 0; s < 4; s++) {
    ctx.save(); ctx.rotate(s * Math.PI / 2);
    for (let i = 0; i < nb; i++) {
      const x = -G / 2 + (i + 0.5) * (G / nb), y = -G / 2 + G * 0.035;
      if (i % 2 === 0) { ctx.fillStyle = S[1]; ctx.beginPath(); ctx.ellipse(x, y, G / nb * 0.38, G * 0.018, 0, 0, TAU); ctx.fill(); }
      else { ctx.fillStyle = S[5]; rosettePath(ctx, x, y, G * 0.02, G * 0.009, 6, t * 0.1); ctx.fill(); }
    }
    ctx.restore();
  }
  // quadrants with arabesques (bilateral + 4-fold symmetry)
  const q = G * 0.43;
  ctx.globalAlpha = reveal(u, 1);
  for (let s = 0; s < 4; s++) {
    ctx.save(); ctx.rotate(s * Math.PI / 2);
    ctx.fillStyle = withAlpha(S[6], 0.55);
    ctx.fillRect(G * 0.04, G * 0.04, q, q);
    for (const mir of [1, -1]) {
      ctx.save();
      ctx.translate(G * 0.04 + q / 2, G * 0.04 + q / 2);
      if (mir < 0) ctx.transform(0, 1, 1, 0, 0, 0); // mirror across the quadrant diagonal
      ctx.globalAlpha = reveal(u, 2);
      arabesque(ctx, -q * 0.08, -q * 0.08, q * 0.42, Math.PI * 1.25 + Math.sin(t * 0.2) * 0.05, 1, Math.min(2, Math.round(p.depth / 2)), S[4], S[3], 0.4 + 0.6 * Math.min(1, (u - 1.5) / 2));
      ctx.restore();
    }
    ctx.globalAlpha = reveal(u, 3);
    ctx.fillStyle = S[5]; rosettePath(ctx, G * 0.04 + q * 0.82, G * 0.04 + q * 0.82, q * 0.09, q * 0.04, 8, -t * 0.1); ctx.fill();
    ctx.restore();
  }
  // water channels with flowing ripples
  ctx.globalAlpha = 1;
  const cw = G * 0.06;
  ctx.fillStyle = S[1];
  ctx.fillRect(-G / 2, -cw / 2, G, cw); ctx.fillRect(-cw / 2, -G / 2, cw, G);
  ctx.strokeStyle = withAlpha(S[2], 0.8); ctx.lineWidth = 1.2;
  ctx.setLineDash([G * 0.02, G * 0.03]); ctx.lineDashOffset = -t * 20;
  for (const o of [-0.25, 0.25]) {
    ctx.beginPath(); ctx.moveTo(-G / 2, cw * o); ctx.lineTo(G / 2, cw * o); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cw * o, -G / 2); ctx.lineTo(cw * o, G / 2); ctx.stroke();
  }
  ctx.setLineDash([]);
  // central pool medallion
  const pr = G * (0.13 + 0.01 * av.bass);
  ctx.fillStyle = S[3]; polyPath(ctx, 0, 0, pr * 1.15, 8, Math.PI / 8); ctx.fill();
  ctx.fillStyle = S[1]; polyPath(ctx, 0, 0, pr, 8, Math.PI / 8); ctx.fill();
  ctx.globalAlpha = reveal(u, 2);
  ctx.fillStyle = S[4]; starPath(ctx, 0, 0, pr * 0.85, 16, 6, t * 0.05 * p.rotation); ctx.fill();
  ctx.fillStyle = S[5]; rosettePath(ctx, 0, 0, pr * 0.45, pr * 0.28, 8, -t * 0.08); ctx.fill();
  ctx.fillStyle = S[3]; ctx.beginPath(); ctx.arc(0, 0, pr * 0.12, 0, TAU); ctx.fill();
  ctx.globalAlpha = 1;
}

/* ------------------------------------------------------------------ *
 * E. Sufi geometric meditation — slowly drawn 12-fold rosette rings.
 * ------------------------------------------------------------------ */
export function drawSufi(d: DrawCtx) {
  const { ctx, R, f, p, pal, av } = d;
  const S = pal.swatch;
  const t = f.t;
  const rings = Math.max(3, Math.round(p.layers));
  const draw = (t * 0.12 + 2.2) % (rings + 4);
  for (let i = 0; i < rings; i++) {
    const a = reveal(draw, i);
    if (a <= 0) continue;
    const r = R * (0.1 + (i / rings) * 0.85) * (1 + 0.02 * av.bass);
    const n = i < 2 ? 12 : 24;
    const k = i < 2 ? 5 : 7 + (i % 3);
    const rot = (i % 2 ? -1 : 1) * t * 0.01 * (1 + i * 0.15) * p.rotation * 2;
    ctx.globalAlpha = a;
    // soft glow pass then crisp line
    ctx.strokeStyle = withAlpha(S[(i % 4) + 2], 0.18); ctx.lineWidth = 6;
    starLines(ctx, 0, 0, r, n, k, rot); ctx.stroke();
    ctx.strokeStyle = S[(i % 4) + 2]; ctx.lineWidth = 1.1;
    starLines(ctx, 0, 0, r, n, k, rot); ctx.stroke();
    ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.strokeStyle = withAlpha(S[3], 0.25); ctx.stroke();
    // small rosettes at the ring vertices
    if (p.complexity > 0.4) for (let j = 0; j < n; j += 2) {
      const ang = rot + (j / n) * TAU;
      ctx.fillStyle = withAlpha(S[4], 0.8);
      rosettePath(ctx, Math.cos(ang) * r, Math.sin(ang) * r, r * 0.035, r * 0.015, 6, -rot); ctx.fill();
    }
  }
  ctx.globalAlpha = 1;
  ctx.beginPath(); ctx.arc(0, 0, R * 0.03 * (1 + 0.3 * av.bass), 0, TAU); ctx.fillStyle = S[4]; ctx.fill();
}
