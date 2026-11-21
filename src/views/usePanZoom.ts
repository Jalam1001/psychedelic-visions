import { useEffect } from 'react';
import { visualStore, clamp } from '../state/params';

/** Mouse drag / wheel and touch drag / pinch → pan & zoom on the shared visual store. */
export function usePanZoom(ref: React.RefObject<HTMLElement>, opts: { maxZoom?: number; enabled?: boolean } = {}) {
  const { maxZoom = 64, enabled = true } = opts;
  useEffect(() => {
    const el = ref.current;
    if (!el || !enabled) return;
    const pts = new Map<number, { x: number; y: number }>();
    let pinchDist = 0;
    const minDim = () => Math.min(el.clientWidth, el.clientHeight) || 1;
    const down = (e: PointerEvent) => {
      if ((e.target as HTMLElement).closest('.no-pan')) return;
      el.setPointerCapture(e.pointerId);
      pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (pts.size === 2) { const [a, b] = [...pts.values()]; pinchDist = Math.hypot(a.x - b.x, a.y - b.y); }
    };
    const move = (e: PointerEvent) => {
      const prev = pts.get(e.pointerId);
      if (!prev) return;
      const cur = { x: e.clientX, y: e.clientY };
      pts.set(e.pointerId, cur);
      const s = visualStore.get();
      if (pts.size === 1) {
        const k = 1 / (minDim() * s.zoom);
        visualStore.set({ panX: s.panX + (cur.x - prev.x) * k, panY: s.panY - (cur.y - prev.y) * k });
      } else if (pts.size === 2) {
        const [a, b] = [...pts.values()];
        const d = Math.hypot(a.x - b.x, a.y - b.y);
        if (pinchDist > 0) visualStore.set({ zoom: clamp(s.zoom * (d / pinchDist), 0.2, maxZoom) });
        pinchDist = d;
      }
    };
    const up = (e: PointerEvent) => { pts.delete(e.pointerId); if (pts.size < 2) pinchDist = 0; };
    const wheel = (e: WheelEvent) => {
      e.preventDefault();
      const s = visualStore.get();
      visualStore.set({ zoom: clamp(s.zoom * Math.exp(-e.deltaY * 0.0012), 0.2, maxZoom) });
    };
    el.addEventListener('pointerdown', down);
    el.addEventListener('pointermove', move);
    el.addEventListener('pointerup', up);
    el.addEventListener('pointercancel', up);
    el.addEventListener('wheel', wheel, { passive: false });
    return () => {
      el.removeEventListener('pointerdown', down);
      el.removeEventListener('pointermove', move);
      el.removeEventListener('pointerup', up);
      el.removeEventListener('pointercancel', up);
      el.removeEventListener('wheel', wheel);
    };
  }, [ref, maxZoom, enabled]);
}
