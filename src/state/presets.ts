import { AUDIO_PRESETS, AudioParams } from '../audio/presets';
import { audio, audioStore } from '../audio/engine';
import { music } from '../audio/music';
import { DEFAULT_VISUAL, SYMMETRIES, VisualParams, visualStore } from './params';
import { PALETTES } from './palettes';

export interface Preset {
  id: string;
  name: string;
  route: string;
  description: string;
  visual: Partial<VisualParams> & { mode: string };
  audio: string;                       // audio preset id
  audioOverrides?: Partial<AudioParams>;
}

/** The 18 named presets — each specifies both visual and audio parameters. */
export const PRESETS: Preset[] = [
  { id: 'amazonian-dream', name: 'Amazonian Dream', route: '/amazonian', description: 'Kené-inspired lattice with weaving vines emerging in waves.',
    visual: { mode: 'kene', palette: 'amazon', speed: 0.8, complexity: 0.45, symmetry: 6, depth: 5, rotation: 0.2, bg: '#020a05', intensity: 0.85 }, audio: 'amazon' },
  { id: 'cosmic-kaleidoscope', name: 'Cosmic Kaleidoscope', route: '/kaleidoscope', description: '12-fold counter-rotating fractal kaleidoscope.',
    visual: { mode: 'art', art: 'nasir-al-mulk', palette: 'thangka', symmetry: 12, complexity: 0.6, depth: 6, rotation: 0.45, speed: 1.1 }, audio: 'cosmic' },
  { id: 'fractal-meditation', name: 'Fractal Meditation', route: '/fractal', description: 'A slowly breathing Julia set.',
    visual: { mode: 'julia', palette: 'ocean', speed: 0.5, complexity: 0.4, depth: 4, rotation: 0.1 }, audio: 'fractal' },
  { id: 'golden-geometry', name: 'Golden Geometry', route: '/sacred', description: 'Phyllotaxis and the golden spiral.',
    visual: { mode: 'fibonacci', palette: 'golden', complexity: 0.6, rotation: 0.3, speed: 0.8, bg: '#080502' }, audio: 'golden' },
  { id: 'living-seljuk-carpet', name: 'Living Seljuk Carpet', route: '/islamic', description: 'An early-Anatolian-style carpet unfolding centre by centre.',
    visual: { mode: 'carpet', palette: 'anatolian', complexity: 0.5, depth: 6, rotation: 0.3, speed: 1, bg: '#120404' }, audio: 'sufi', audioOverrides: { tempo: 58, pad: 0.45 } },
  { id: 'infinite-islamic-geometry', name: 'Infinite Islamic Geometry', route: '/islamic', description: 'Endless zoom through an interlaced star-and-cross lattice.',
    visual: { mode: 'tessellation', palette: 'iznik', symmetry: 8, complexity: 0.8, rotation: 0.2, speed: 1 }, audio: 'harmonic' },
  { id: 'alexanders-recursive-centres', name: "Alexander's Recursive Centers", route: '/islamic', description: 'A single centre gathers supporting centres at many scales.',
    visual: { mode: 'centres', palette: 'kashan', symmetry: 8, depth: 5, rotation: 0.15, speed: 1 }, audio: 'harmonic', audioOverrides: { scale: 'dorian' } },
  { id: 'persian-garden', name: 'Persian Garden', route: '/islamic', description: 'Chahar-bagh garden with arabesques and flowing channels.',
    visual: { mode: 'garden', palette: 'persian', depth: 5, rotation: 0.3, speed: 1 }, audio: 'persian' },
  { id: 'sufi-geometric-meditation', name: 'Sufi Geometric Meditation', route: '/islamic', description: 'Slowly drawn 12- and 24-fold star rosettes.',
    visual: { mode: 'sufi', palette: 'golden', layers: 8, complexity: 0.6, rotation: 0.3, speed: 0.7, bg: '#05040b' }, audio: 'sufi' },
  { id: 'harmonic-resonance', name: 'Harmonic Resonance', route: '/lab', description: 'Harmonic series rings and standing-wave figures.',
    visual: { mode: 'harmonics', palette: 'cosmic', speed: 0.8 }, audio: 'harmonic' },
  { id: 'deep-relaxation', name: 'Deep Relaxation', route: '/meditation', description: 'Breathing rosette, rain and a low drone.',
    visual: { mode: 'rosette', palette: 'calm', speed: 0.5, intensity: 0.5, brightness: 0.8, petals: 8, layers: 6, reactivity: 0.3 }, audio: 'relax' },
  { id: 'infinite-psychedelic-journey', name: 'Infinite Psychedelic Journey', route: '/journey', description: 'Endless cross-fading voyage through every world.',
    visual: { mode: 'auto', palette: 'psyche', symmetry: 8, speed: 1, complexity: 0.6 }, audio: 'journey' },
  { id: 'infinite-lotus', name: 'Infinite Lotus', route: '/mandala', description: 'Petal layers unfolding forever from the centre.',
    visual: { mode: 'lotus', palette: 'lotus', petals: 10, layers: 7, depth: 4, rotation: 0.3, speed: 1, bg: '#0e0410' }, audio: 'tanpura' },
  { id: 'tibetan-cosmic-mandala', name: 'Tibetan Cosmic Mandala', route: '/mandala', description: 'Palace, gateways, lotus and fire ring built stage by stage.',
    visual: { mode: 'tibetan', palette: 'thangka', rotation: 0.3, speed: 1, bg: '#05050c' }, audio: 'himalayan' },
  { id: 'sri-yantra', name: 'Sri Yantra', route: '/mandala', description: 'Nine interlocking triangles — traditional construction and animation.',
    visual: { mode: 'sri-animated', palette: 'ember', speed: 1, bg: '#0a0302' }, audio: 'tanpura', audioOverrides: { scale: 'majorPent' } },
  { id: 'psychedelic-mandala', name: 'Psychedelic Mandala', route: '/mandala', description: 'Fractal petals flowing outward in luminous colour.',
    visual: { mode: 'psychedelic', palette: 'psyche', petals: 8, layers: 6, symmetry: 12, depth: 5, rotation: 0.4, speed: 1 }, audio: 'cosmic' },
  { id: 'alexanders-living-mandala', name: "Alexander's Living Mandala", route: '/mandala', description: 'Rings of centres growing into a coherent whole.',
    visual: { mode: 'alexander', palette: 'kashan', symmetry: 8, layers: 7, depth: 5, rotation: 0.2, speed: 1 }, audio: 'harmonic', audioOverrides: { scale: 'majorPent' } },
  { id: 'himalayan-meditation', name: 'Himalayan Meditation', route: '/meditation', description: 'Singing bowls, wind and a slow breathing mandala.',
    visual: { mode: 'rosette', palette: 'tibetan', speed: 0.5, intensity: 0.55, brightness: 0.85, petals: 12, layers: 7, reactivity: 0.35 }, audio: 'himalayan' },
];

export const presetById = (id: string) => PRESETS.find((p) => p.id === id);

export function applyVisual(v: Partial<VisualParams>) {
  visualStore.replace({ ...DEFAULT_VISUAL, ...v });
}

export function applyPreset(p: Preset, withAudio = true) {
  applyVisual(p.visual);
  if (withAudio) {
    const base = AUDIO_PRESETS[p.audio];
    if (base) {
      audioStore.set({ presetId: p.audio, params: { ...base, ...(p.audioOverrides ?? {}) } });
      audio.apply(audioStore.get().params);
    }
    music.onAudioPreset(p.audio);
  }
}

export function randomVisual(): Partial<VisualParams> {
  const r = Math.random;
  const v = visualStore.get();
  return {
    ...v,
    speed: 0.5 + r() * 1.2,
    complexity: 0.2 + r() * 0.8,
    symmetry: SYMMETRIES[Math.floor(r() * SYMMETRIES.length)],
    depth: 2 + Math.round(r() * 6),
    rotation: (r() - 0.5) * 1.4,
    palette: PALETTES[Math.floor(r() * PALETTES.length)].id,
    petals: 6 + Math.round(r() * 18),
    layers: 4 + Math.round(r() * 7),
    zoom: 1, panX: 0, panY: 0,
  };
}

/* ---------- user presets (localStorage) & shareable URLs ---------- */
export interface UserPreset { id: string; name: string; route: string; visual: VisualParams; audio: AudioParams; savedAt: number }
const KEY = 'pv.userPresets';

export function loadUserPresets(): UserPreset[] {
  try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch { return []; }
}
export function saveUserPreset(name: string, route: string): UserPreset {
  const list = loadUserPresets();
  const p: UserPreset = { id: 'u' + Date.now().toString(36), name: name || 'My preset', route, visual: visualStore.get(), audio: audioStore.get().params, savedAt: Date.now() };
  list.unshift(p);
  localStorage.setItem(KEY, JSON.stringify(list.slice(0, 50)));
  return p;
}
export function deleteUserPreset(id: string) {
  localStorage.setItem(KEY, JSON.stringify(loadUserPresets().filter((p) => p.id !== id)));
}
export function applyUserPreset(p: UserPreset) {
  applyVisual(p.visual);
  audioStore.set({ presetId: 'custom', params: { ...p.audio } });
  audio.apply(audioStore.get().params);
}

const b64e = (s: string) => btoa(unescape(encodeURIComponent(s))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const b64d = (s: string) => decodeURIComponent(escape(atob(s.replace(/-/g, '+').replace(/_/g, '/'))));

export function shareUrl(route: string): string {
  const payload = { v: visualStore.get(), a: audioStore.get().params };
  const base = window.location.href.split('#')[0];
  return `${base}#${route}?s=${b64e(JSON.stringify(payload))}`;
}

export function applyShared(s: string): boolean {
  try {
    const obj = JSON.parse(b64d(s));
    if (obj.v) applyVisual(obj.v);
    if (obj.a) { audioStore.set({ presetId: 'custom', params: { ...AUDIO_PRESETS.cosmic, ...obj.a } }); audio.apply(audioStore.get().params); }
    return true;
  } catch { return false; }
}
