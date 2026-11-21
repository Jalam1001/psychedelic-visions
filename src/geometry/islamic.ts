import type { DrawCtx } from '../views/CanvasView';
import { withAlpha } from '../state/palettes';
import { TAU, caption, polyPath, reveal, rosettePath, starInner, starK, starLines, starPath, steppedDiamond, visibleRect } from './draw';

/* ------------------------------------------------------------------ *
 * A. Living Turkish carpet — medallions, borders, nested motifs that
 *    unfold level by level (Alexander: levels of scale, alternating
 *    repetition, strong centres, boundaries, roughness/abrash).
 * ------------------------------------------------------------------ */
export function drawCarpet(d: DrawCtx) {
  const { ctx, W, H, f, p, pal, av } = d;
  const S = pal.swatch;
  const t = f.t;
  const levels = Math.round(p.depth) + 1;
  const u = (t * 0.3 + 1.6) % (levels + 4); // unfold, then hold, then restart
  const landscape = W > H;
  let cw: number, ch: number;
  if (landscape) { ch = H * 0.88; cw = Math.min(W * 0.92, ch * 1.5); } else { cw = W * 0.9; ch = Math.min(H * 0.9, cw * 1.5); }
  const x0 = -cw / 2, y0 = -ch / 2;
  const bw = Math.min(cw, ch) * 0.085;

  // ground with abrash (natural dye-lot colour variation)
  ctx.fillStyle = S[1];
  ctx.fillRect(x0, y0, cw, ch);
  const bands = 18;
  for (let i = 0; i < bands; i++) {
    const v = Math.sin(i * 12.9898) * 43758.5453; const r = v - Math.floor(v);
    ctx.fillStyle = withAlpha(r > 0.5 ? '#000000' : '#ffffff', 0.025 + r * 0.03);
    ctx.fillRect(x0, y0 + (i / bands) * ch, cw, ch / bands + 1);
  }

  // borders (level 0)
  const a0 = reveal(u, 0);
  ctx.globalAlpha = a0;
  ctx.fillStyle = S[3]; ctx.fillRect(x0, y0, cw, ch);
  ctx.fillStyle = S[2]; ctx.fillRect(x0 + bw * 0.18, y0 + bw * 0.18, cw - bw * 0.36, ch - bw * 0.36);
  ctx.fillStyle = S[3]; ctx.fillRect(x0 + bw * 1.05, y0 + bw * 1.05, cw - bw * 2.1, ch - bw * 2.1);
  ctx.fillStyle = S[1]; ctx.fillRect(x0 + bw * 1.2, y0 + bw * 1.2, cw - bw * 2.4, ch - bw * 2.4);
  ctx.globalAlpha = 1;

  // border motifs (level 1): alternating 8-stars and stepped diamonds around the perimeter
  const a1 = reveal(u, 1);
  if (a1 > 0) {
    const inset = bw * 0.62;
    const perim: [number, number][] = [];
    const nx = Math.max(4, Math.round((cw - 2 * inset) / bw)), ny = Math.max(4, Math.round((ch - 2 * inset) / bw));
    for (let i = 0; i < nx; i++) { const x = x0 + inset + (i + 0.5) * ((cw - 2 * inset) / nx); perim.push([x, y0 + inset], [x, y0 + ch - inset]); }
    for (let j = 0; j < ny; j++) { const y = y0 + inset + (j + 0.5) * ((ch - 2 * inset) / ny); perim.push([x0 + inset, y], [x0 + cw - inset, y]); }
    perim.forEach(([x, y], i) => {
      ctx.globalAlpha = a1;
      if (i % 4 < 2) {
        ctx.fillStyle = S[4]; starPath(ctx, x, y, bw * 0.34, 8, 3, Math.PI / 8); ctx.fill();
        ctx.fillStyle = S[1]; polyPath(ctx, x, y, bw * 0.1, 4, Math.PI / 4); ctx.fill();
      } else {
        ctx.fillStyle = S[5]; steppedDiamond(ctx, x, y, bw * 0.3, bw * 0.3, 3); ctx.fill();
        ctx.fillStyle = S[3]; steppedDiamond(ctx, x, y, bw * 0.12, bw * 0.12, 2); ctx.fill();
      }
    });
    ctx.globalAlpha = 1;
  }

  // field medallions
  const fx0 = x0 + bw * 1.3, fy0 = y0 + bw * 1.3, fw = cw - bw * 2.6, fh = ch - bw * 2.6;
  const shortN = 2 + Math.round(p.complexity * 2);
  const cols = landscape ? Math.round(shortN * (fw / fh)) : shortN;
  const rows = landscape ? shortN : Math.round(shortN * (fh / fw));
  const cwid = fw / cols, chei = fh / rows;
  const m = Math.min(cwid, chei) * 0.5 * (1 + 0.05 * av.bass + 0.02 * av.pulse);
  const rotI = t * 0.05 * p.rotation + av.mid * 0.2;
  for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) {
    const cx = fx0 + (i + 0.5) * cwid, cy = fy0 + (j + 0.5) * chei;
    const typeA = (i + j) % 2 === 0; // alternating repetition
    const jitter = Math.sin((i * 7 + j * 13) * 1.7) * 0.06; // roughness: hand-knotted irregularity
    const a2 = reveal(u, 2 + jitter);
    if (a2 <= 0) continue;
    ctx.globalAlpha = a2;
    if (typeA) {
      ctx.fillStyle = S[3]; polyPath(ctx, cx, cy, m * 0.92, 8, Math.PI / 8); ctx.fill();
      ctx.strokeStyle = S[2]; ctx.lineWidth = m * 0.06; ctx.stroke();
      ctx.globalAlpha = reveal(u, 3 + jitter);
      ctx.fillStyle = S[2]; starPath(ctx, cx, cy, m * 0.78, 8, 3, rotI); ctx.fill();
      ctx.globalAlpha = reveal(u, 4 + jitter);
      ctx.fillStyle = S[4]; rosettePath(ctx, cx, cy, m * 0.42, m * 0.25, 8, -rotI + Math.PI / 8); ctx.fill();
      ctx.globalAlpha = reveal(u, 5 + jitter);
      ctx.fillStyle = S[1]; polyPath(ctx, cx, cy, m * 0.14, 8, rotI); ctx.fill();
    } else {
      ctx.fillStyle = S[5]; steppedDiamond(ctx, cx, cy, m * 0.9, m * 0.9, 6); ctx.fill();
      ctx.globalAlpha = reveal(u, 3 + jitter);
      ctx.fillStyle = S[3]; steppedDiamond(ctx, cx, cy, m * 0.62, m * 0.62, 4); ctx.fill();
      ctx.globalAlpha = reveal(u, 4 + jitter);
      ctx.fillStyle = S[1]; steppedDiamond(ctx, cx, cy, m * 0.38, m * 0.38, 3); ctx.fill();
      // latch hooks
      ctx.strokeStyle = S[3]; ctx.lineWidth = m * 0.06;
      for (let q = 0; q < 4; q++) {
        const a = q * (TAU / 4) + TAU / 8;
        const hx = cx + Math.cos(a) * m * 0.64, hy = cy + Math.sin(a) * m * 0.64;
        ctx.beginPath(); ctx.moveTo(hx, hy); ctx.lineTo(hx + Math.cos(a) * m * 0.22, hy + Math.sin(a) * m * 0.22);
        ctx.lineTo(hx + Math.cos(a) * m * 0.22 + Math.cos(a + 1.57) * m * 0.12, hy + Math.sin(a) * m * 0.22 + Math.sin(a + 1.57) * m * 0.12);
        ctx.stroke();
      }
      ctx.globalAlpha = reveal(u, 5 + jitter);
      ctx.fillStyle = S[4]; starPath(ctx, cx, cy, m * 0.2, 8, 3, rotI); ctx.fill();
    }
    // supporting centres at cell corners
    const a3 = reveal(u, 4 + jitter);
    if (a3 > 0 && i < cols - 1 && j < rows - 1) {
      ctx.globalAlpha = a3;
      const sx = cx + cwid / 2, sy = cy + chei / 2;
      ctx.fillStyle = S[4]; starPath(ctx, sx, sy, m * 0.24, 8, 3, Math.PI / 8); ctx.fill();
      ctx.fillStyle = S[2]; polyPath(ctx, sx, sy, m * 0.08, 4, 0); ctx.fill();
    }
    // fine echoes (small dots along cell edges)
    const a4 = reveal(u, 6 + jitter);
    if (a4 > 0 && levels >= 6) {
      ctx.globalAlpha = a4 * 0.9;
      ctx.fillStyle = S[3];
      for (let q = 0; q < 4; q++) { const a = q * TAU / 4; ctx.beginPath(); ctx.arc(cx + Math.cos(a) * m * 1.0, cy + Math.sin(a) * m * 1.0, m * 0.035, 0, TAU); ctx.fill(); }
    }
  }
  ctx.globalAlpha = 1;
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
