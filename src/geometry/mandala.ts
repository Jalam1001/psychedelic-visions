import type { DrawCtx } from '../views/CanvasView';
import { cosPal, withAlpha } from '../state/palettes';
import { TAU, petalPath, polyPath, reveal, rosettePath, smooth, starK, starPath, caption } from './draw';
import { SY_LINES, chordHalf, sriYantraTriangles, SY_RUB } from './sriyantra';

/* A. Infinite lotus mandala — petal layers continuously emerge from the centre and unfold outward. */
export function drawLotus(d: DrawCtx) {
  const { ctx, R, f, p, pal, av } = d;
  const L = Math.max(3, Math.round(p.layers));
  const n0 = Math.max(4, Math.round(p.petals));
  const flow = f.t * 0.07;
  const F = Math.floor(flow), fr = flow - F;
  const depth = Math.min(3, Math.max(1, Math.round(p.depth / 2)));
  for (let k = L - 1; k >= 0; k--) {
    const s = k + fr;                       // radial position in layer units
    const id = k - F;                       // stable identity for colour & count
    const n = n0 * (((id % 2) + 2) % 2 === 0 ? 1 : 2);
    const r1 = R * 0.95 * Math.pow(s / L, 0.8) * (1 + 0.04 * av.bass);
    const r0 = r1 * 0.45;
    const open = smooth(s / 1.4);
    const alpha = smooth(s / 0.6) * smooth((L - s) / 0.9);
    if (alpha <= 0.01 || r1 < 2) continue;
    const rot = (id % 2 ? 0.5 : 0) * (TAU / n) + f.t * 0.015 * p.rotation * (id % 2 ? -1 : 1) + av.mid * 0.05;
    const w = (TAU / n) * 0.5 * (0.4 + 0.6 * open);
    const c = cosPal(pal, id * 0.11 + 0.05, av.hue);
    const c2 = cosPal(pal, id * 0.11 + 0.35, av.hue);
    for (let i = 0; i < n; i++) {
      const ang = rot + (i / n) * TAU;
      ctx.globalAlpha = alpha;
      petalPath(ctx, ang, r0, r1, w); ctx.fillStyle = c; ctx.fill();
      ctx.strokeStyle = withAlpha('#ffffff', 0.35); ctx.lineWidth = 0.8; ctx.stroke();
      // recursive inner petals
      let rr0 = r0, rr1 = r1, ww = w;
      for (let q = 1; q <= depth; q++) {
        rr1 = rr0 + (rr1 - rr0) * 0.68; ww *= 0.62;
        petalPath(ctx, ang, rr0, rr1, ww);
        ctx.fillStyle = q % 2 ? c2 : c; ctx.globalAlpha = alpha * (0.85 - q * 0.1); ctx.fill();
      }
    }
    // dotted ring at the base of the layer
    ctx.globalAlpha = alpha * 0.7;
    ctx.fillStyle = c2;
    for (let i = 0; i < n * 2; i++) { const a = rot + (i / (n * 2)) * TAU; ctx.beginPath(); ctx.arc(Math.cos(a) * r0, Math.sin(a) * r0, Math.max(0.6, r1 * 0.012), 0, TAU); ctx.fill(); }
  }
  ctx.globalAlpha = 1;
  ctx.beginPath(); ctx.arc(0, 0, R * 0.04 * (1 + 0.4 * av.pulse), 0, TAU); ctx.fillStyle = pal.swatch[4] ?? '#fff'; ctx.fill();
}

function gatedSquarePath(ctx: CanvasRenderingContext2D, s: number, g: number, e: number) {
  ctx.beginPath();
  for (let side = 0; side < 4; side++) {
    const pts: [number, number][] = [[-s, -s], [-g, -s], [-g, -s - e], [-g - e * 0.6, -s - e], [-g - e * 0.6, -s - 2 * e], [g + e * 0.6, -s - 2 * e], [g + e * 0.6, -s - e], [g, -s - e], [g, -s]];
    const a = side * Math.PI / 2, ca = Math.cos(a), sa = Math.sin(a);
    pts.forEach(([x, y], i) => {
      const X = x * ca - y * sa, Y = x * sa + y * ca;
      side === 0 && i === 0 ? ctx.moveTo(X, Y) : ctx.lineTo(X, Y);
    });
  }
  ctx.closePath();
}

/* B. Tibetan-inspired geometric mandala — constructed stage by stage, held, then gently dissolved
 *    (an allusion to the impermanence of sand mandalas). Not a ritual-accurate depiction of any deity mandala. */
export function drawTibetan(d: DrawCtx) {
  const { ctx, R, f, p, pal, av } = d;
  const S = pal.swatch;
  const cycle = 14;
  const u = (f.t * 0.25 + 3) % cycle;
  const dissolve = u > 11.5 ? 1 - smooth((u - 11.5) / 2.2) : 1;
  const rot = f.t * 0.006 * p.rotation;
  ctx.save(); ctx.rotate(rot);
  const A = (lvl: number) => reveal(u, lvl) * dissolve;
  // 0 fire ring
  ctx.globalAlpha = A(0);
  const fireCols = [S[6] ?? S[3], S[3], S[4], S[2]];
  fireCols.forEach((c, i) => {
    ctx.beginPath();
    for (let j = 0; j <= 240; j++) {
      const a = (j / 240) * TAU;
      const r = R * (0.97 - i * 0.025) + R * 0.018 * Math.sin(a * 48 + f.t * (1.5 + i * 0.3) * (i % 2 ? -1 : 1)) * (1 + av.high * 0.5);
      j === 0 ? ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r) : ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
    }
    ctx.closePath(); ctx.fillStyle = c; ctx.fill();
  });
  ctx.beginPath(); ctx.arc(0, 0, R * 0.88, 0, TAU); ctx.fillStyle = S[0]; ctx.fill();
  // 1 vajra ring
  ctx.globalAlpha = A(1);
  ctx.beginPath(); ctx.arc(0, 0, R * 0.87, 0, TAU); ctx.arc(0, 0, R * 0.8, 0, TAU, true); ctx.fillStyle = S[5]; ctx.fill();
  for (let i = 0; i < 40; i++) {
    const a = (i / 40) * TAU; const r = R * 0.835;
    ctx.save(); ctx.translate(Math.cos(a) * r, Math.sin(a) * r); ctx.rotate(a);
    ctx.fillStyle = S[2]; ctx.beginPath(); ctx.moveTo(0, -R * 0.03); ctx.lineTo(R * 0.012, 0); ctx.lineTo(0, R * 0.03); ctx.lineTo(-R * 0.012, 0); ctx.closePath(); ctx.fill();
    ctx.restore();
  }
  // 2 lotus ring
  ctx.globalAlpha = A(2);
  for (let i = 0; i < 32; i++) { petalPath(ctx, (i / 32) * TAU, R * 0.68, R * 0.79, TAU / 64 * 0.95); ctx.fillStyle = i % 2 ? S[3] : S[1]; ctx.fill(); }
  // 3 circle boundary
  ctx.globalAlpha = A(3);
  ctx.beginPath(); ctx.arc(0, 0, R * 0.68, 0, TAU); ctx.fillStyle = S[0]; ctx.fill();
  ctx.lineWidth = R * 0.01; ctx.strokeStyle = S[2]; ctx.stroke();
  // 4 palace walls with quadrant colours (east at bottom: white/blue, south left: yellow, west top: red, north right: green)
  const s = R * 0.4, g = R * 0.07, e = R * 0.06;
  const quadCols = [S[6] ?? S[5], S[1], S[2], S[4]]; // right, bottom, left, top after rotation order
  ctx.globalAlpha = A(4);
  ctx.save();
  gatedSquarePath(ctx, s, g, e); ctx.clip();
  for (let q = 0; q < 4; q++) {
    ctx.beginPath(); ctx.moveTo(0, 0);
    const a0 = q * Math.PI / 2 - Math.PI / 4, a1 = a0 + Math.PI / 2;
    ctx.lineTo(Math.cos(a0) * R, Math.sin(a0) * R); ctx.lineTo(Math.cos(a1) * R, Math.sin(a1) * R); ctx.closePath();
    ctx.fillStyle = quadCols[q]; ctx.fill();
  }
  ctx.restore();
  // 5 wall bands & gateways
  ctx.globalAlpha = A(5);
  [1, 0.93, 0.86].forEach((k, i) => { gatedSquarePath(ctx, s * k, g * k, e * k); ctx.strokeStyle = [S[3], S[2], S[4]][i]; ctx.lineWidth = R * 0.012; ctx.stroke(); });
  // 6 inner circle with 8-petal lotus
  ctx.globalAlpha = A(6);
  ctx.beginPath(); ctx.arc(0, 0, R * 0.3, 0, TAU); ctx.fillStyle = S[0]; ctx.fill(); ctx.strokeStyle = S[2]; ctx.lineWidth = R * 0.008; ctx.stroke();
  for (let i = 0; i < 8; i++) { petalPath(ctx, (i / 8) * TAU + Math.PI / 8, R * 0.11, R * 0.29, TAU / 16 * 0.9); ctx.fillStyle = [S[1], S[2], S[3], S[4]][i % 4]; ctx.fill(); ctx.strokeStyle = S[2]; ctx.lineWidth = 1; ctx.stroke(); }
  // 7 centre
  ctx.globalAlpha = A(7);
  ctx.beginPath(); ctx.arc(0, 0, R * 0.1, 0, TAU); ctx.fillStyle = S[5]; ctx.fill();
  ctx.fillStyle = S[2]; starPath(ctx, 0, 0, R * 0.075, 8, 3, -rot * 3); ctx.fill();
  ctx.beginPath(); ctx.arc(0, 0, R * 0.02 * (1 + av.pulse * 0.5), 0, TAU); ctx.fillStyle = S[1]; ctx.fill();
  ctx.restore();
  ctx.globalAlpha = 1;
}

/* C. Sri Yantra — static traditional construction, or an animated artistic interpretation. */
export function drawSriYantra(d: DrawCtx, animated: boolean) {
  const { ctx, R, f, pal, av } = d;
  const S = pal.swatch;
  const k = (R * 0.4) / 24; // units → px
  const tris = sriYantraTriangles();
  const t = f.t;
  const u = animated ? (t * 0.55 + 0.5) % 22 : 99;
  const A = (lvl: number) => (animated ? reveal(u, lvl) : 1);
  // bhupura (3 gated squares) and outer field
  ctx.globalAlpha = A(15);
  gatedSquarePath(ctx, R * 0.86, R * 0.12, R * 0.05); ctx.fillStyle = withAlpha(S[4], 0.35); ctx.fill();
  [0.86, 0.81, 0.76].forEach((s, i) => { gatedSquarePath(ctx, R * s, R * 0.12 * s / 0.86, R * 0.05); ctx.strokeStyle = [S[4], S[3], S[2]][i]; ctx.lineWidth = R * 0.008; ctx.stroke(); });
  // three circles
  ctx.globalAlpha = A(14);
  [0.71, 0.69, 0.67].forEach((r) => { ctx.beginPath(); ctx.arc(0, 0, R * r, 0, TAU); ctx.strokeStyle = S[2]; ctx.lineWidth = 1.2; ctx.stroke(); });
  // 16 petals then 8 petals
  ctx.globalAlpha = A(13);
  for (let i = 0; i < 16; i++) { petalPath(ctx, (i / 16) * TAU - Math.PI / 2, R * 0.53, R * 0.665, TAU / 32 * 0.98); ctx.fillStyle = withAlpha(S[1], 0.85); ctx.fill(); ctx.strokeStyle = S[2]; ctx.lineWidth = 1; ctx.stroke(); }
  ctx.globalAlpha = A(12);
  ctx.beginPath(); ctx.arc(0, 0, R * 0.53, 0, TAU); ctx.fillStyle = S[0]; ctx.fill();
  for (let i = 0; i < 8; i++) { petalPath(ctx, (i / 8) * TAU - Math.PI / 2 + Math.PI / 8, R * 0.4, R * 0.525, TAU / 16 * 0.98); ctx.fillStyle = withAlpha(S[3], 0.9); ctx.fill(); ctx.strokeStyle = S[2]; ctx.lineWidth = 1; ctx.stroke(); }
  ctx.globalAlpha = 1;
  ctx.beginPath(); ctx.arc(0, 0, R * 0.4, 0, TAU); ctx.fillStyle = S[0]; ctx.fill();
  ctx.strokeStyle = S[2]; ctx.lineWidth = 1.5; ctx.stroke();
  // construction guides (animated): axis + 48 ticks + nine chords, then rub-offs
  if (animated && u < 12.5) {
    const ga = A(0) * (1 - smooth(u - 11.5));
    ctx.globalAlpha = ga * 0.7; ctx.strokeStyle = S[3]; ctx.lineWidth = 0.8;
    ctx.beginPath(); ctx.moveTo(0, -24 * k); ctx.lineTo(0, 24 * k); ctx.stroke();
    for (let i = 0; i <= 48; i++) { const y = (i - 24) * k; ctx.beginPath(); ctx.moveTo(-2, y); ctx.lineTo(2, y); ctx.stroke(); }
    SY_LINES.forEach((dd, i) => {
      const a = A(0.5 + i * 0.15);
      const y = (dd - 24) * k;
      const full = chordHalf(i);
      const rub = smooth(u - 2.5) * SY_RUB[i];
      ctx.globalAlpha = a * ga * 0.8;
      ctx.beginPath(); ctx.moveTo(-(full - rub) * k, y); ctx.lineTo((full - rub) * k, y); ctx.stroke();
    });
  }
  // nine triangles: drawn in the traditional order of importance (largest pair first)
  const order = [2, 6, 0, 7, 1, 3, 4, 8, 5];
  // even-odd fill reveals the 43 small triangles as alternating regions
  const fillA = animated ? reveal(u, 11) : 1;
  if (fillA > 0) {
    ctx.save();
    ctx.beginPath();
    tris.forEach((tr) => { ctx.moveTo(-tr.half * k, tr.y * k); ctx.lineTo(tr.half * k, tr.y * k); ctx.lineTo(0, tr.apexY * k); ctx.closePath(); });
    ctx.globalAlpha = fillA * 0.9;
    ctx.fillStyle = animated ? cosPal(pal, t * 0.03 + 0.1, av.hue) : S[1];
    ctx.fill('evenodd');
    ctx.restore();
  }
  order.forEach((ti, j) => {
    const tr = tris[ti];
    const a = animated ? reveal(u, 3 + j * 0.85) : 1;
    if (a <= 0) return;
    ctx.globalAlpha = a;
    ctx.beginPath(); ctx.moveTo(-tr.half * k, tr.y * k); ctx.lineTo(tr.half * k, tr.y * k); ctx.lineTo(0, tr.apexY * k); ctx.closePath();
    ctx.strokeStyle = animated ? cosPal(pal, j * 0.08 + t * 0.02, av.hue) : S[2];
    ctx.lineWidth = animated ? 1.6 + av.high : 1.6;
    ctx.stroke();
  });
  // bindu
  ctx.globalAlpha = animated ? reveal(u, 11.5) : 1;
  const by = ((23 + 23 + 30) / 3 - 24) * k;
  ctx.beginPath(); ctx.arc(0, by, Math.max(2, R * 0.012) * (animated ? 1 + 0.6 * av.pulse + 0.2 * Math.sin(t) : 1), 0, TAU);
  ctx.fillStyle = S[1] === S[2] ? '#fff' : S[3]; ctx.fill();
  ctx.globalAlpha = 1;
  if (!animated) caption(d, [{ text: 'Traditional construction (Kaivalyāśrama, 48-unit method) — static', alpha: 0.75 }]);
  else caption(d, [{ text: 'Animated artistic interpretation — construction, then colour', alpha: 0.75 }]);
}

/* E. Alexander's living mandala — rings of centres, each supported by smaller centres and boundaries. */
export function drawAlexanderMandala(d: DrawCtx) {
  const { ctx, R, f, p, pal, av } = d;
  const S = pal.swatch;
  const rings = Math.max(3, Math.min(10, Math.round(p.layers)));
  const u = (f.t * 0.3 + 2.2) % (rings + 5);
  const n0 = Math.max(4, Math.round(p.symmetry));
  const rot0 = f.t * 0.01 * p.rotation;
  // central strong centre
  const c0 = R * 0.12;
  ctx.globalAlpha = reveal(u, 0);
  ctx.fillStyle = S[1]; starPath(ctx, 0, 0, c0 * (1 + 0.06 * av.bass), n0, starK(n0), rot0); ctx.fill();
  ctx.fillStyle = S[0]; ctx.beginPath(); ctx.arc(0, 0, c0 * 0.4, 0, TAU); ctx.fill(); // the void
  ctx.fillStyle = S[3]; ctx.beginPath(); ctx.arc(0, 0, c0 * 0.12, 0, TAU); ctx.fill();
  for (let j = 1; j <= rings; j++) {
    const a = reveal(u, j);
    if (a <= 0) continue;
    const rj = c0 + (R * 0.92 - c0) * (j / rings);
    const step = (R * 0.92 - c0) / rings;
    const n = Math.min(96, n0 * Math.pow(2, Math.floor((j - 1) / 2)));
    const rot = rot0 * (j % 2 ? -1 : 1) + (j % 2 ? Math.PI / n : 0);
    // boundary band between rings (deep interlock: band colour echoes the centres it joins)
    ctx.globalAlpha = a * 0.6;
    ctx.beginPath(); ctx.arc(0, 0, rj - step * 0.5, 0, TAU); ctx.lineWidth = step * 0.12; ctx.strokeStyle = S[2 + (j % 3)]; ctx.stroke();
    const size = Math.min(step * 0.42, (TAU * rj / n) * 0.42);
    for (let i = 0; i < n; i++) {
      const ang = rot + (i / n) * TAU;
      const x = Math.cos(ang) * rj, y = Math.sin(ang) * rj;
      ctx.globalAlpha = a;
      const kind = (j + (i % 2)) % 3; // alternating repetition
      ctx.fillStyle = S[1 + ((j + i % 2) % 5)];
      if (kind === 0) starPath(ctx, x, y, size, 8, 3, ang);
      else if (kind === 1) polyPath(ctx, x, y, size * 0.9, 6, ang);
      else rosettePath(ctx, x, y, size, size * 0.6, 6, ang);
      ctx.fill();
      // nested supporting centre (levels of scale)
      if (p.depth >= 3 && size > 4) { ctx.fillStyle = S[0]; ctx.beginPath(); ctx.arc(x, y, size * 0.35, 0, TAU); ctx.fill(); }
      if (p.depth >= 5 && size > 7) { ctx.fillStyle = S[3]; polyPath(ctx, x, y, size * 0.16, 4, ang); ctx.fill(); }
    }
  }
  ctx.globalAlpha = 1;
  const labels = ['Strong centre', 'Boundaries', 'Levels of scale', 'Alternating repetition', 'Echoes', 'Gradients', 'Not-separateness'];
  caption(d, labels.slice(0, Math.min(labels.length, Math.floor(u) + 1)).map((s, i) => ({ text: s, alpha: reveal(u, i) * 0.8 })));
}
