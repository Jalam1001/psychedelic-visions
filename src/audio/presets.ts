export type PadTimbre = 'warm' | 'glass' | 'choir' | 'string';
export type NatureType = 'none' | 'wind' | 'rain' | 'stream' | 'night';

export interface AudioParams {
  name: string;
  root: number;          // Hz (fundamental of the drone)
  scale: string;         // key into SCALES
  tempo: number;         // BPM — governs chord changes & percussion
  volume: number;        // 0..1 master
  drone: number;         // 0..1 levels
  pad: number;
  bowl: number;
  perc: number;
  nature: number;
  natureType: NatureType;
  timbre: PadTimbre;
  binaural: number;      // 0..1 level (0 = off)
  beatHz: number;        // binaural beat frequency
  carrier: number;       // binaural carrier (left ear) Hz
  reverb: number;        // 0..1 wet
  width: number;         // 0..1 stereo width
  progression: number[]; // scale degrees for chord roots
}

const base: AudioParams = {
  name: 'Custom', root: 110, scale: 'majorPent', tempo: 90, volume: 0.85, drone: 0.6, pad: 0.5, bowl: 0.4, perc: 0.0,
  nature: 0.0, natureType: 'none', timbre: 'warm', binaural: 0, beatHz: 6, carrier: 200, reverb: 0.55, width: 0.6,
  progression: [0, 3, 4, 2],
};

const mk = (o: Partial<AudioParams>): AudioParams => ({ ...base, ...o });

export const AUDIO_PRESETS: Record<string, AudioParams> = {
  himalayan: mk({ name: 'Himalayan Singing Bowls', root: 98, scale: 'majorPent', tempo: 60, drone: 0.5, pad: 0.3, bowl: 0.8, nature: 0.25, natureType: 'wind', timbre: 'glass', reverb: 0.7, progression: [0, 2, 3, 1] }),
  tanpura: mk({ name: 'Indian Drone (tanpura-like)', root: 130.81, scale: 'bhairav', tempo: 70, drone: 0.85, pad: 0.35, bowl: 0.2, timbre: 'string', reverb: 0.5, progression: [0, 4, 3, 0] }),
  amazon: mk({ name: 'Amazon Night', root: 87.31, scale: 'dorian', tempo: 82, drone: 0.5, pad: 0.45, bowl: 0.2, perc: 0.35, nature: 0.45, natureType: 'night', timbre: 'warm', reverb: 0.55, progression: [0, 3, 5, 4] }),
  cosmic: mk({ name: 'Cosmic Pads', root: 110, scale: 'lydian', tempo: 90, drone: 0.45, pad: 0.7, bowl: 0.25, perc: 0.2, timbre: 'glass', reverb: 0.75, width: 0.9, progression: [0, 4, 1, 5] }),
  sufi: mk({ name: 'Sufi Contemplation (maqam-inspired)', root: 146.83, scale: 'hijaz', tempo: 65, drone: 0.75, pad: 0.4, bowl: 0.15, perc: 0.15, timbre: 'choir', reverb: 0.65, progression: [0, 3, 4, 0] }),
  persian: mk({ name: 'Persian Garden', root: 123.47, scale: 'harmonicMinor', tempo: 77, drone: 0.5, pad: 0.55, bowl: 0.3, nature: 0.3, natureType: 'stream', timbre: 'string', reverb: 0.6, progression: [0, 3, 4, 5] }),
  relax: mk({ name: 'Deep Relaxation', root: 82.41, scale: 'majorPent', tempo: 50, volume: 0.75, drone: 0.55, pad: 0.45, bowl: 0.35, nature: 0.35, natureType: 'rain', timbre: 'warm', binaural: 0.25, beatHz: 6, carrier: 180, reverb: 0.7, progression: [0, 2, 3, 2] }),
  harmonic: mk({ name: 'Harmonic Resonance', root: 110, scale: 'lydian', tempo: 75, drone: 0.7, pad: 0.5, bowl: 0.5, timbre: 'glass', reverb: 0.6, progression: [0, 2, 4, 1] }),
  fractal: mk({ name: 'Fractal Meditation', root: 103.83, scale: 'wholeTone', tempo: 67, drone: 0.5, pad: 0.6, bowl: 0.35, perc: 0.1, timbre: 'glass', reverb: 0.7, width: 0.85, progression: [0, 2, 4, 1] }),
  golden: mk({ name: 'Golden Geometry', root: 116.54, scale: 'majorPent', tempo: 80, drone: 0.5, pad: 0.6, bowl: 0.45, perc: 0.2, timbre: 'warm', reverb: 0.6, progression: [0, 3, 1, 4] }),
  journey: mk({ name: 'Infinite Journey', root: 92.5, scale: 'dorian', tempo: 87, drone: 0.5, pad: 0.6, bowl: 0.35, perc: 0.3, nature: 0.15, natureType: 'wind', timbre: 'choir', reverb: 0.65, width: 0.85, progression: [0, 5, 3, 4] }),
  insen: mk({ name: 'Zen Garden (in-sen)', root: 110, scale: 'inSen', tempo: 62, drone: 0.4, pad: 0.4, bowl: 0.6, nature: 0.3, natureType: 'stream', timbre: 'glass', reverb: 0.7, progression: [0, 2, 3, 1] }),
};

export const DEFAULT_AUDIO = AUDIO_PRESETS.cosmic;
