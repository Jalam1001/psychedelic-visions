import { useEffect, useRef } from 'react';
import { canvasRegistry, FrameInfo, quality, useRenderLoop } from '../engine/loop';
import { avSync } from '../audio/analysis';
import { visualStore, VisualParams } from '../state/params';
import { paletteById, Palette } from '../state/palettes';
import { usePanZoom } from './usePanZoom';

export interface DrawCtx {
  ctx: CanvasRenderingContext2D;
  W: number; H: number; R: number;  // CSS pixel size; R = min(W,H)/2
  dpr: number;
  f: FrameInfo;
  p: VisualParams;
  pal: Palette;
  av: { bass: number; mid: number; high: number; pulse: number; hue: number; energy: number };
}

export type DrawFn = (d: DrawCtx) => void;

/** 2D canvas view: clears to the background colour, centres the origin and applies pan/zoom. */
export function CanvasView({ draw, pixelCap = 2 }: { draw: DrawFn; pixelCap?: number }) {
  const wrap = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const drawRef = useRef(draw); drawRef.current = draw;
  usePanZoom(wrap);
  useEffect(() => {
    canvasRegistry.current = canvas.current;
    return () => { if (canvasRegistry.current === canvas.current) canvasRegistry.current = null; };
  }, []);
  useRenderLoop((f) => {
    const c = canvas.current; const w = wrap.current;
    if (!c || !w) return;
    const dpr = quality.pixelRatio(pixelCap);
    const W = w.clientWidth, H = w.clientHeight;
    const pw = Math.max(2, Math.round(W * dpr)), ph = Math.max(2, Math.round(H * dpr));
    if (c.width !== pw || c.height !== ph) { c.width = pw; c.height = ph; }
    const ctx = c.getContext('2d');
    if (!ctx) return;
    const p = visualStore.get();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = p.bg;
    ctx.fillRect(0, 0, pw, ph);
    const R = Math.min(W, H) / 2;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.translate(W / 2, H / 2);
    ctx.scale(p.zoom, p.zoom);
    ctx.translate(p.panX * R * 2, -p.panY * R * 2);
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    drawRef.current({ ctx, W, H, R, dpr, f, p, pal: paletteById(p.palette), av: avSync.scaled(p.reactivity) });
    // gentle brightness / vignette pass
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    if (p.brightness < 0.99) { ctx.fillStyle = `rgba(0,0,0,${(1 - p.brightness) * 0.85})`; ctx.fillRect(0, 0, pw, ph); }
    else if (p.brightness > 1.01) { ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = `rgba(255,255,255,${(p.brightness - 1) * 0.12})`; ctx.fillRect(0, 0, pw, ph); ctx.globalCompositeOperation = 'source-over'; }
    const g = ctx.createRadialGradient(pw / 2, ph / 2, Math.min(pw, ph) * 0.35, pw / 2, ph / 2, Math.max(pw, ph) * 0.75);
    g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,0.45)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, pw, ph);
  });
  return (
    <div ref={wrap} className="view" role="img" aria-label="Generative animated geometry">
      <canvas ref={canvas} className="view-canvas" />
    </div>
  );
}
