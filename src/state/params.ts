import { createStore } from './store';

export interface VisualParams {
  mode: string;
  speed: number;        // 0..3 animation speed multiplier
  complexity: number;   // 0..1 pattern complexity
  symmetry: number;     // 4..24 mirrored segments / radial order
  depth: number;        // 1..8 recursion depth
  rotation: number;     // -1..1 rotation speed & direction
  zoom: number;         // 0.25..16
  panX: number;
  panY: number;
  palette: string;      // palette id
  bg: string;           // background colour hex
  brightness: number;   // 0.3..1.6
  intensity: number;    // 0..1 visual intensity (saturation / contrast / motion amplitude)
  reactivity: number;   // 0..1 audio reactivity
  petals: number;       // 4..32
  layers: number;       // 1..12
  art: string;          // source-art texture key ('' = none)
}

export const DEFAULT_VISUAL: VisualParams = {
  mode: '',
  speed: 1,
  complexity: 0.6,
  symmetry: 8,
  depth: 5,
  rotation: 0.3,
  zoom: 1,
  panX: 0,
  panY: 0,
  palette: 'cosmic',
  bg: '#05030a',
  brightness: 1,
  intensity: 0.9,
  reactivity: 0.75,
  petals: 12,
  layers: 7,
  art: 'hevajra-mandala',
};

export const SYMMETRIES = [4, 6, 8, 12, 16, 24];

export const visualStore = createStore<VisualParams>({ ...DEFAULT_VISUAL });

export interface UIState {
  paused: boolean;
  controlsHidden: boolean;
  reducedMotion: boolean;
  quality: 'auto' | 'low' | 'medium' | 'high';
  safetyAccepted: boolean;
  fps: number;
  renderScale: number;
  calm: boolean;        // set by calm pages (Meditation): no motion boost
}

const prefersReduced = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
const saved = (() => {
  try { return JSON.parse(localStorage.getItem('pv.ui') || '{}'); } catch { return {}; }
})();

export const uiStore = createStore<UIState>({
  paused: false,
  controlsHidden: false,
  reducedMotion: saved.reducedMotion ?? !!prefersReduced,
  quality: saved.quality ?? 'auto',
  safetyAccepted: saved.safetyAccepted ?? false,
  fps: 60,
  renderScale: 1,
  calm: false,
});

uiStore.subscribe(() => {
  const s = uiStore.get();
  try {
    localStorage.setItem('pv.ui', JSON.stringify({ reducedMotion: s.reducedMotion, quality: s.quality, safetyAccepted: s.safetyAccepted }));
  } catch { /* storage may be unavailable */ }
});

export function clamp(v: number, a: number, b: number) { return Math.max(a, Math.min(b, v)); }
