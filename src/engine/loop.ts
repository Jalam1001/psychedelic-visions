import { useEffect, useRef } from 'react';
import { uiStore, visualStore } from '../state/params';
import { avSync } from '../audio/analysis';

const isMobile = typeof navigator !== 'undefined' && /Android|iPhone|iPad|Mobi/i.test(navigator.userAgent);

/** Adaptive quality: keeps a rolling frame-time average and nudges the render scale. */
class Quality {
  scale = isMobile ? 0.7 : 1;
  private acc = 0; private n = 0; private lastAdjust = 0;
  frame(dtMs: number, now: number) {
    this.acc += dtMs; this.n++;
    if (now - this.lastAdjust < 1500 || this.n < 30) return;
    const avg = this.acc / this.n;
    this.acc = 0; this.n = 0; this.lastAdjust = now;
    const q = uiStore.get().quality;
    if (q === 'auto') {
      if (avg > 24) this.scale = Math.max(0.35, this.scale - 0.12);
      else if (avg < 17.5) this.scale = Math.min(1, this.scale + 0.05);
    } else {
      this.scale = q === 'low' ? 0.45 : q === 'medium' ? 0.7 : 1;
    }
    uiStore.set({ fps: Math.round(1000 / avg), renderScale: this.scale });
  }
  pixelRatio(cap = 2) {
    return Math.max(0.35, Math.min(window.devicePixelRatio || 1, cap) * this.scale);
  }
}
export const quality = new Quality();

export interface FrameInfo { t: number; dt: number; now: number }

/** Shared animation loop: accumulates "artistic time" respecting pause / speed / reduced motion. */
export function useRenderLoop(cb: (f: FrameInfo) => void) {
  const cbRef = useRef(cb);
  cbRef.current = cb;
  useEffect(() => {
    let raf = 0; let last = performance.now(); let t = 0;
    const tick = (now: number) => {
      const dtMs = Math.min(100, now - last);
      last = now;
      quality.frame(dtMs, now);
      avSync.update(now);
      const ui = uiStore.get();
      const speed = visualStore.get().speed * (ui.reducedMotion ? 0.35 : 1);
      const dt = ui.paused ? 0 : (dtMs / 1000) * speed;
      t += dt;
      cbRef.current({ t, dt, now });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);
}

/** Registry so the control panel can screenshot whichever canvas is active. */
export const canvasRegistry: { current: HTMLCanvasElement | null } = { current: null };

export function takeScreenshot(name = 'psychedelic-visions') {
  const c = canvasRegistry.current;
  if (!c) return;
  c.toBlob((blob) => {
    if (!blob) return;
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${name}-${new Date().toISOString().replace(/[:.]/g, '-')}.png`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  }, 'image/png');
}
