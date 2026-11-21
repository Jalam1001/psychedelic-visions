import { useStore } from '../state/store';
import { uiStore } from '../state/params';

export function SafetyGate() {
  const ui = useStore(uiStore);
  if (ui.safetyAccepted) return null;
  return (
    <div className="safety" role="dialog" aria-modal="true" aria-labelledby="safety-title">
      <div className="safety-card">
        <h2 id="safety-title">Photosensitivity notice</h2>
        <p>This site shows continuously moving, high-contrast, colourful patterns. It avoids intentional flashing or strobing (brightness pulses are limited to a few percent and are smoothed), but if you have photosensitive epilepsy or are sensitive to motion, please use <strong>reduced-motion mode</strong> and stop if you feel discomfort.</p>
        <p>The sound is original music (pre-rendered soundtracks plus an optional live synth) for enjoyment and relaxation. Nothing here is a medical treatment. Keep volume moderate; audio only starts when you press a button.</p>
        <div className="row">
          <button className="btn primary" onClick={() => uiStore.set({ safetyAccepted: true })} autoFocus>Enter</button>
          <button className="btn" onClick={() => uiStore.set({ safetyAccepted: true, reducedMotion: true })}>Enter with reduced motion</button>
        </div>
      </div>
    </div>
  );
}
