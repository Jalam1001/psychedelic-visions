/**
 * Palettes are defined twice: as Inigo Quilez cosine-palette coefficients for shaders
 * (color(t) = a + b*cos(2π(c*t + d))) and as discrete swatches for Canvas/SVG geometry.
 * Reference: https://iquilezles.org/articles/palettes/
 */
export type Vec3 = [number, number, number];
export interface Palette {
  id: string;
  name: string;
  a: Vec3; b: Vec3; c: Vec3; d: Vec3;
  swatch: string[]; // 6+ colours, [0] is a deep ground colour
}

export const PALETTES: Palette[] = [
  { id: 'cosmic', name: 'Cosmic Nebula', a: [0.5, 0.5, 0.5], b: [0.5, 0.5, 0.5], c: [1, 1, 1], d: [0.0, 0.1, 0.2],
    swatch: ['#0b0620', '#3a1c71', '#d76d77', '#ffaf7b', '#7afcff', '#f4f1ff', '#9b5de5'] },
  { id: 'amazon', name: 'Amazonian Luminous', a: [0.45, 0.5, 0.35], b: [0.45, 0.45, 0.45], c: [1.0, 1.0, 0.8], d: [0.3, 0.55, 0.8],
    swatch: ['#06140c', '#0f5c3a', '#2ee59d', '#ff3f8e', '#ffd23f', '#7b2cbf', '#f7fff7'] },
  { id: 'seljuk', name: 'Seljuk Carpet', a: [0.55, 0.35, 0.3], b: [0.35, 0.3, 0.3], c: [1.0, 0.8, 0.6], d: [0.0, 0.1, 0.25],
    swatch: ['#2a0a0a', '#9e1b1b', '#1d3a6b', '#e8d9b0', '#d9a441', '#2f6b4f', '#5a2a1a'] },
  { id: 'persian', name: 'Persian Garden', a: [0.4, 0.45, 0.5], b: [0.4, 0.35, 0.4], c: [1.0, 1.0, 1.0], d: [0.6, 0.45, 0.2],
    swatch: ['#0c1a2b', '#14527a', '#2fa4b7', '#f2e3bc', '#c0392b', '#d4a017', '#3b7d3b'] },
  { id: 'lotus', name: 'Lotus Dawn', a: [0.6, 0.45, 0.5], b: [0.4, 0.35, 0.4], c: [1.0, 1.0, 1.0], d: [0.0, 0.15, 0.3],
    swatch: ['#1a0716', '#ff6fa8', '#ffc2d4', '#ffd166', '#f78c6b', '#7f2b5b', '#fff3e6'] },
  { id: 'tibetan', name: 'Tibetan Mineral', a: [0.5, 0.45, 0.4], b: [0.5, 0.45, 0.45], c: [1.0, 1.0, 1.0], d: [0.05, 0.33, 0.67],
    swatch: ['#0a0a14', '#f5f0e6', '#f2c230', '#c8102e', '#2e8b57', '#1f4fa3', '#e07b24'] },
  { id: 'golden', name: 'Golden Ratio', a: [0.55, 0.45, 0.3], b: [0.45, 0.4, 0.3], c: [1.0, 1.0, 1.0], d: [0.0, 0.08, 0.2],
    swatch: ['#0d0904', '#8a5a00', '#d4a017', '#ffe08a', '#fff8e1', '#5c3d00', '#ffb347'] },
  { id: 'ocean', name: 'Deep Ocean', a: [0.3, 0.5, 0.6], b: [0.3, 0.4, 0.4], c: [1.0, 1.0, 1.0], d: [0.55, 0.6, 0.7],
    swatch: ['#020b16', '#04395e', '#00a6a6', '#70e1f5', '#bbf1fa', '#1b2a49', '#e0fbfc'] },
  { id: 'ember', name: 'Ember & Saffron', a: [0.6, 0.35, 0.25], b: [0.4, 0.35, 0.25], c: [1.0, 1.0, 1.0], d: [0.0, 0.1, 0.15],
    swatch: ['#140402', '#7a1c06', '#e85d04', '#faa307', '#ffe5b4', '#370617', '#ffba08'] },
  { id: 'calm', name: 'Moonlit Calm', a: [0.4, 0.42, 0.5], b: [0.25, 0.25, 0.3], c: [1.0, 1.0, 1.0], d: [0.6, 0.62, 0.68],
    swatch: ['#05060d', '#2b2d42', '#5c6b9c', '#a3b1e0', '#e2e7f5', '#3d405b', '#c9ada7'] },
  { id: 'psyche', name: 'Psychedelic Spectrum', a: [0.5, 0.5, 0.5], b: [0.5, 0.5, 0.5], c: [2.0, 1.0, 0.0], d: [0.5, 0.2, 0.25],
    swatch: ['#09000f', '#ff00a0', '#00f0ff', '#fffb00', '#7c00ff', '#00ff6a', '#ff6a00'] },
];

export const paletteById = (id: string) => PALETTES.find((p) => p.id === id) ?? PALETTES[0];
export const paletteIndex = (i: number) => PALETTES[((Math.round(i) % PALETTES.length) + PALETTES.length) % PALETTES.length];

/** Evaluate cosine palette in JS (for canvas gradients). */
export function cosPal(p: Palette, t: number, hue = 0): string {
  const ch = (k: 0 | 1 | 2) => {
    const v = p.a[k] + p.b[k] * Math.cos(6.28318 * (p.c[k] * t + p.d[k] + hue));
    return Math.max(0, Math.min(255, Math.round(v * 255)));
  };
  return `rgb(${ch(0)},${ch(1)},${ch(2)})`;
}

export function hexToRgb(hex: string): Vec3 {
  const h = hex.replace('#', '');
  const n = parseInt(h.length === 3 ? h.split('').map((c) => c + c).join('') : h, 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}

export function withAlpha(hex: string, a: number): string {
  const [r, g, b] = hexToRgb(hex);
  return `rgba(${Math.round(r * 255)},${Math.round(g * 255)},${Math.round(b * 255)},${Math.max(0, Math.min(1, a)).toFixed(3)})`;
}
