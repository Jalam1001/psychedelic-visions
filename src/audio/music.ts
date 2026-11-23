import { createStore } from '../state/store';
import { audio, audioStore, unlockAudio } from './engine';
import { clips, clipStore, PRESET_TRACK } from './clips';

/** Which sound source is active: pre-rendered soundtrack clips (default) or the live Tone.js synth. */
export type MusicSource = 'clips' | 'synth';
export interface MusicState { on: boolean; source: MusicSource; held: boolean }
export const musicStore = createStore<MusicState>({ on: false, source: 'clips', held: false });

export const music = {
  /** Synchronous: safe to call first thing in a tap handler. */
  start() {
    const { source } = musicStore.get();
    musicStore.set({ on: true, held: false });
    if (source === 'clips') clips.play();
    else void audio.start();
  },
  stop() {
    musicStore.set({ on: false, held: false });
    clips.stop();
    if (audioStore.get().running) audio.stop();
  },
  /** Pause button: fade the music out but remember it was on (clips keep their position). */
  hold() {
    const s = musicStore.get();
    if (!s.on || s.held) return;
    musicStore.set({ held: true });
    if (s.source === 'clips') clips.stop(); else if (audioStore.get().running) audio.stop();
  },
  /** Resume after hold(); synchronous so play() runs inside the tap. */
  release() {
    const s = musicStore.get();
    if (!s.held) return;
    musicStore.set({ held: false });
    if (s.on) { if (s.source === 'clips') clips.play(); else void audio.start(); }
  },
  toggle() { if (musicStore.get().on) music.stop(); else music.start(); },
  /** Re-enable after the browser blocked playback (call from a tap). */
  retry() { if (musicStore.get().source === 'clips') clips.play(); else unlockAudio(); },
  setSource(src: MusicSource) {
    const wasOn = musicStore.get().on;
    if (wasOn) music.stop();
    musicStore.set({ source: src });
    if (wasOn) music.start();
  },
  setTrack(id: string) {
    if (musicStore.get().on && musicStore.get().source === 'clips') clips.play(id);
    else clipStore.set({ trackId: id });
  },
  /** Called when a preset changes the audio preset: pick the matching soundtrack. */
  onAudioPreset(audioPresetId: string) {
    const id = PRESET_TRACK[audioPresetId];
    if (id) music.setTrack(id);
  },
};

if (typeof window !== 'undefined') {
  const w = window as unknown as { __pv?: Record<string, unknown> };
  w.__pv = { ...(w.__pv ?? {}), music, musicStore, clips, clipStore, clipDebug: () => clips.debug() };
}
