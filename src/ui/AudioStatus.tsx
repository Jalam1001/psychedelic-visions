import { useEffect, useState } from 'react';
import { audio, audioStore, testBeep, unlockAudio } from '../audio/engine';
import { useStore } from '../state/store';

/** Live output level, polled a few times per second (only while music is on). */
function useLevel(active: boolean) {
  const [lvl, setLvl] = useState(0);
  useEffect(() => {
    if (!active) { setLvl(0); return; }
    const id = window.setInterval(() => setLvl(audio.rms()), 250);
    return () => window.clearInterval(id);
  }, [active]);
  return lvl;
}

export function useAudioStatus() {
  const a = useStore(audioStore);
  const lvl = useLevel(a.running);
  const blocked = a.running && a.ctxState !== 'running';
  const label = !a.running ? 'Sound off' : blocked ? 'Tap to enable sound' : a.muted ? 'Muted' : lvl > 0.003 ? 'Sound on' : 'Starting…';
  const tone = !a.running ? 'off' : blocked ? 'warn' : a.muted ? 'off' : lvl > 0.003 ? 'ok' : 'warn';
  return { a, lvl, blocked, label, tone };
}

/** Small pill for the top bar: shows real context state + live level meter. */
export function AudioPill() {
  const { a, lvl, blocked, label, tone } = useAudioStatus();
  return (
    <button className={`audio-pill ${tone}`} onClick={() => { if (blocked) { unlockAudio(); } else void audio.toggle(); }}
      aria-label={`${label}. ${a.running ? 'Click to stop music' : 'Click to start music'}`} title={`Audio context: ${a.ctxState}`}>
      <span className="dot" />
      <span className="lbl">{label}</span>
      <span className="bars" aria-hidden>{[0, 1, 2, 3].map((i) => <i key={i} style={{ transform: `scaleY(${Math.min(1, 0.15 + lvl * (6 + i * 3))})` }} />)}</span>
    </button>
  );
}

/** Big, obvious call-to-action shown on every experience while music is off, plus a device test beep. */
export function StartAudioCTA({ label = 'Start music', top = false }: { label?: string; top?: boolean }) {
  const { a, blocked } = useAudioStatus();
  const [beepMsg, setBeepMsg] = useState('');
  if (a.running && !blocked) return null;
  return (
    <div className={`start-audio-wrap no-pan ${top ? 'top' : ''}`} role="region" aria-label="Sound">
      {blocked ? (
        <button className="start-audio blocked" onClick={() => unlockAudio()}>🔈 Tap to enable sound</button>
      ) : (
        <button className="start-audio" onClick={() => { void audio.start(); }}>
          <span className="pulse-ring" aria-hidden />▶ {label}
        </button>
      )}
      <button className="test-sound" onClick={() => { setBeepMsg('Playing test beep…'); void testBeep().then(setBeepMsg); }}>🔔 Test sound</button>
      {beepMsg && <p className="beep-msg" role="status">{beepMsg}</p>}
      {a.error && <p className="beep-msg err">Audio error: {a.error}</p>}
    </div>
  );
}
