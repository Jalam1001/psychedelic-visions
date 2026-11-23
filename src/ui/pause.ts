import { uiStore } from '../state/params';
import { music } from '../audio/music';

let lastToggle = 0;
/** Single entry point for pause/resume (button, Space key, menu).
 *  Freezes visuals (loop time, audio-reactive values, backdrops) and pauses the soundtrack; resume continues both
 *  from the same point. Debounced so a touch that also fires a synthetic click/key can't toggle twice. */
export function togglePause(force?: boolean) {
  const now = performance.now();
  if (force === undefined && now - lastToggle < 300) return;
  lastToggle = now;
  const paused = force ?? !uiStore.get().paused;
  if (paused === uiStore.get().paused) return;
  uiStore.set({ paused });
  if (paused) music.hold(); else music.release();   // release() calls play() synchronously, inside the tap
}

// Pause-aware clock (ms): like performance.now() but stands still while paused. Used by the meditation
// breathing guide and session timer so they freeze and resume without a jump.
let pausedTotal = 0; let pausedAt: number | null = null;
uiStore.subscribe(() => {
  const p = uiStore.get().paused; const now = performance.now();
  if (p && pausedAt === null) pausedAt = now;
  if (!p && pausedAt !== null) { pausedTotal += now - pausedAt; pausedAt = null; }
});
export function activeNow() { return (pausedAt ?? performance.now()) - pausedTotal; }
