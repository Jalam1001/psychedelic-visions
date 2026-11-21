import type { DrawCtx } from '../views/CanvasView';

export const TAU = Math.PI * 2;
export const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
export const smooth = (x: number) => { const c = clamp01(x); return c * c * (3 - 2 * c); };
/** Progressive-unfolding helper: 0 before `level`, eases to 1 over one unit of `u`. */
export const reveal = (u: number, level: number) => smooth(u - level);

export function polyPath(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, n: number, rot = 0) {
  ctx.beginPath();
  for (let i = 0; i <= n; i++) {
    const a = rot + (i / n) * TAU;
    const x = cx + r * Math.cos(a), y = cy + r * Math.sin(a);
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  }
  ctx.closePath();
}

/** Inner radius ratio of a regular star polygon {n/k}: cos(πk/n)/cos(π(k−1)/n). */
export const starInner = (n: number, k: number) => Math.cos((Math.PI * k) / n) / Math.cos((Math.PI * (k - 1)) / n);
export const starK = (n: number) => Math.max(2, Math.round(n / 3));

/** Outline of the star polygon {n/k} (alternating outer/inner vertices). */
export function starPath(ctx: CanvasRenderingContext2D, cx: number, cy: number, R: number, n: number, k = starK(n), rot = 0) {
  const r = R * starInner(n, k);
  ctx.beginPath();
  for (let i = 0; i <= 2 * n; i++) {
    const a = rot + (i / (2 * n)) * TAU;
    const rr = i % 2 === 0 ? R : r;
    const x = cx + rr * Math.cos(a), y = cy + rr * Math.sin(a);
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  }
  ctx.closePath();
}

/** True star polygon lines: vertex i joined to vertex i+k (shows the interior interlace). */
export function starLines(ctx: CanvasRenderingContext2D, cx: number, cy: number, R: number, n: number, k: number, rot = 0) {
  ctx.beginPath();
  for (let i = 0; i < n; i++) {
    const a1 = rot + (i / n) * TAU, a2 = rot + (((i + k) % n) / n) * TAU;
    ctx.moveTo(cx + R * Math.cos(a1), cy + R * Math.sin(a1));
    ctx.lineTo(cx + R * Math.cos(a2), cy + R * Math.sin(a2));
  }
}

export function rosettePath(ctx: CanvasRenderingContext2D, cx: number, cy: number, R: number, r: number, n: number, rot = 0) {
  ctx.beginPath();
  for (let i = 0; i <= 2 * n; i++) {
    const a = rot + (i / (2 * n)) * TAU;
    const rr = i % 2 === 0 ? R : r;
    i === 0 ? ctx.moveTo(cx + rr * Math.cos(a), cy + rr * Math.sin(a)) : ctx.lineTo(cx + rr * Math.cos(a), cy + rr * Math.sin(a));
  }
  ctx.closePath();
}

/** Lotus petal from radius r0 to r1 centred on angle `ang`, half-width angle `w`. */
export function petalPath(ctx: CanvasRenderingContext2D, ang: number, r0: number, r1: number, w: number) {
  const c = Math.cos(ang), s = Math.sin(ang);
  const P = (r: number, da: number) => [r * Math.cos(ang + da), r * Math.sin(ang + da)] as const;
  const [bx1, by1] = P(r0, -w * 0.6);
  const [bx2, by2] = P(r0, w * 0.6);
  const mid = r0 + (r1 - r0) * 0.55;
  const [c1x, c1y] = P(mid, -w * 1.25);
  const [c2x, c2y] = P(mid, w * 1.25);
  ctx.beginPath();
  ctx.moveTo(bx1, by1);
  ctx.quadraticCurveTo(c1x, c1y, r1 * c, r1 * s);
  ctx.quadraticCurveTo(c2x, c2y, bx2, by2);
  ctx.closePath();
}

export function steppedDiamond(ctx: CanvasRenderingContext2D, cx: number, cy: number, w: number, h: number, steps: number) {
  ctx.beginPath();
  const sx = w / steps, sy = h / steps;
  const pts: [number, number][] = [];
  for (let i = 0; i < steps; i++) { pts.push([cx + i * sx, cy - h + i * sy]); pts.push([cx + (i + 1) * sx, cy - h + i * sy]); }
  for (let i = 0; i < steps; i++) { pts.push([cx + w - i * sx, cy + i * sy]); pts.push([cx + w - i * sx, cy + (i + 1) * sy]); }
  for (let i = 0; i < steps; i++) { pts.push([cx - i * sx, cy + h - i * sy]); pts.push([cx - (i + 1) * sx, cy + h - i * sy]); }
  for (let i = 0; i < steps; i++) { pts.push([cx - w + i * sx, cy - i * sy]); pts.push([cx - w + i * sx, cy - (i + 1) * sy]); }
  pts.forEach(([x, y], i) => (i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)));
  ctx.closePath();
}

/** Visible local-coordinate rectangle given the current pan/zoom transform. */
export function visibleRect(d: DrawCtx) {
  const { W, H, R, p } = d;
  const hw = W / 2 / p.zoom, hh = H / 2 / p.zoom;
  const ox = -p.panX * R * 2, oy = p.panY * R * 2;
  return { x0: ox - hw, x1: ox + hw, y0: oy - hh, y1: oy + hh };
}

/** Draw a small caption in screen space (bottom-left), used for educational overlays. */
export function caption(d: DrawCtx, lines: { text: string; alpha: number; color?: string }[]) {
  const { ctx, dpr, H } = d;
  ctx.save();
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.font = '500 12px "Inter", system-ui, sans-serif';
  ctx.textBaseline = 'bottom';
  lines.forEach((l, i) => {
    ctx.globalAlpha = l.alpha;
    ctx.fillStyle = l.color ?? '#f1e9ff';
    ctx.fillText(l.text, 18, H - 18 - (lines.length - 1 - i) * 17);
  });
  ctx.restore();
}
