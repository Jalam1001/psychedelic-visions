import { useEffect, useRef, useState } from 'react';
import { ShaderRenderer, UniformValue } from '../engine/gl';
import { canvasRegistry, FrameInfo, quality, useRenderLoop } from '../engine/loop';
import { avSync } from '../audio/analysis';
import { visualStore, VisualParams } from '../state/params';
import { hexToRgb, paletteById } from '../state/palettes';
import { usePanZoom } from './usePanZoom';

export interface ShaderViewProps {
  frag: string;
  modeIndex?: number;
  extraUniforms?: (f: FrameInfo, p: VisualParams) => Record<string, UniformValue>;
  pixelCap?: number;
  panZoom?: boolean;
  maxZoom?: number;
  className?: string;
  /** Source-art texture key (public/art/tex/<key>.jpg) or null. */
  texture?: string | null;
}

/** Full-screen GLSL view wired to the shared visual parameters and audio analysis. */
export function ShaderView({ frag, modeIndex = 0, extraUniforms, pixelCap = 2, panZoom = true, maxZoom, className, texture = null }: ShaderViewProps) {
  const wrap = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const renderer = useRef<ShaderRenderer | null>(null);
  const [failed, setFailed] = useState<string | null>(null);
  const modeRef = useRef(modeIndex); modeRef.current = modeIndex;
  const extraRef = useRef(extraUniforms); extraRef.current = extraUniforms;
  usePanZoom(wrap, { enabled: panZoom, maxZoom });
  const [texReady, setTexReady] = useState(0);
  const texOn = useRef(0);

  // Load the source-art texture (base-path safe URL) and upload it once the renderer exists.
  useEffect(() => {
    texOn.current = 0;
    if (!texture) { renderer.current?.setTexture(null); return; }
    let alive = true;
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => {
      if (!alive) return;
      const r = renderer.current;
      if (!r) { setTexReady((x) => x + 1); return; }
      r.setTexture(img); texOn.current = 1;
    };
    img.onerror = () => console.warn('[art] texture failed', texture);
    img.src = `${import.meta.env.BASE_URL}art/tex/${texture}.jpg`;
    return () => { alive = false; };
  }, [texture, frag, texReady]);

  useEffect(() => {
    const c = canvas.current!;
    const r = ShaderRenderer.create(c, frag);
    if (!r) { setFailed('WebGL is not available on this device or browser.'); return; }
    if (r.error) { setFailed('This graphics hardware could not compile the shader. ' + r.error.slice(0, 160)); }
    renderer.current = r;
    canvasRegistry.current = c;
    const lost = (e: Event) => { e.preventDefault(); setFailed('The graphics context was lost (GPU reset). Reload the page to continue.'); };
    c.addEventListener('webglcontextlost', lost);
    return () => { c.removeEventListener('webglcontextlost', lost); r.dispose(); renderer.current = null; if (canvasRegistry.current === c) canvasRegistry.current = null; };
  }, [frag]);

  useRenderLoop((f) => {
    const r = renderer.current; const c = canvas.current;
    if (!r || !c || !wrap.current) return;
    const dpr = quality.pixelRatio(pixelCap);
    const w = Math.max(2, Math.round(wrap.current.clientWidth * dpr));
    const h = Math.max(2, Math.round(wrap.current.clientHeight * dpr));
    if (c.width !== w || c.height !== h) { c.width = w; c.height = h; }
    const p = visualStore.get();
    const pal = paletteById(p.palette);
    const av = avSync.scaled(p.reactivity);
    const u: Record<string, UniformValue> = {
      uRes: [w, h], uTime: f.t, uSym: p.symmetry, uComplex: p.complexity, uDepth: p.depth, uRot: p.rotation,
      uZoom: p.zoom, uPan: [p.panX, p.panY], uBright: p.brightness, uIntensity: p.intensity, uMode: modeRef.current,
      uHue: av.hue, uBg: hexToRgb(p.bg), uPA: pal.a, uPB: pal.b, uPC: pal.c, uPD: pal.d,
      uBass: av.bass, uMid: av.mid, uHigh: av.high, uPulse: av.pulse, uPetals: p.petals, uLayers: p.layers,
      uSw: swatchCache(pal.id, pal.swatch), uSwMix: 0.72, uTexOn: texOn.current,
    };
    u.uHue = (u.uHue as number) + f.t*0.01;               // continuous slow colour cycling
    if (extraRef.current) Object.assign(u, extraRef.current(f, p));
    r.render(w, h, u);
  });

  return (
    <div ref={wrap} className={`view ${className ?? ''}`} role="img" aria-label="Generative animated artwork">
      <canvas ref={canvas} className="view-canvas" />
      {failed && <GraphicsFallback message={failed} />}
    </div>
  );
}

const swCache = new Map<string, Float32Array>();
function swatchCache(id: string, sw: string[]) {
  let a = swCache.get(id);
  if (!a) { a = new Float32Array(18); for (let i = 0; i < 6; i++) a.set(hexToRgb(sw[1 + (i % (sw.length - 1))]), i*3); swCache.set(id, a); }
  return a;
}

export function GraphicsFallback({ message }: { message: string }) {
  return (
    <div className="fallback">
      <div className="fallback-art" aria-hidden />
      <div className="fallback-msg">
        <strong>Simplified mode</strong>
        <p>{message}</p>
        <p>The Canvas-based experiences (Islamic Geometry, Living Mandalas, Sacred Geometry) still work without WebGL.</p>
      </div>
    </div>
  );
}
