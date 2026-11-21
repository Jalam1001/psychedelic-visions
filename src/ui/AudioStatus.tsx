import { useEffect, useState } from 'react';
import { audio, audioStore, testBeep } from '../audio/engine';
import { clips, clipStore, trackById } from '../audio/clips';
import { music, musicStore } from '../audio/music';
import { useStore } from '../state/store';

/** Live output level (0..1), polled a few times per second while music is on. */
function useLevel(active: boolean, source: string) {
  const [lvl, setLvl] = useState(0);
  useEffect(() => {
    if (!active) { setLvl(0); return; }
    const id = window.setInterval(() => {
      if (source === 'clips') { const s = clips.sample(); setLvl(s ? (s.bass + s.mid + s.high) / 3 : 0); }
      else setLvl(Math.min(1, audio.rms() * 6));
    }, 250);
    return () => window.clearInterval(id);
  }, [active, source]);
  return lvl;
}

export function useAudioStatus() {
  const m = useStore(musicStore);
  const c = useStore(clipStore);
  const a = useStore(audioStore);
  const lvl = useLevel(m.on, m.source);
  const blocked = m.on && (m.source === 'clips' ? c.state === 'blocked' : a.ctxState !== 'running' && a.ctxState !== 'not-created');
  const error = m.on && m.source === 'clips' && c.state === 'error' ? c.error : a.error;
  const playing = m.on && (m.source === 'clips' ? c.state === 'playing' : a.ctxState === 'running');
  const label = !m.on ? 'Sound off' : blocked ? 'Tap to enable sound' : playing ? (m.source === 'clips' ? trackById(c.trackId).title : 'Live synth') : 'Loading…';
  const tone = !m.on ? 'off' : blocked || error ? 'warn' : playing ? 'ok' : 'warn';
  return { m, c, a, lvl, blocked, label, tone, error, playing };
}

/** Small pill for the top bar: real playback state + live level meter. */
export function AudioPill() {
  const { m, lvl, blocked, label, tone } = useAudioStatus();
  return (
    <button className={`audio-pill ${tone}`} onClick={() => { if (blocked) music.retry(); else music.toggle(); }}
      aria-label={`${label}. ${m.on ? 'Click to stop music' : 'Click to start music'}`} title={label}>
      <span className="dot" />
      <span className="lbl">{label}</span>
      <span className="bars" aria-hidden>{[0, 1, 2, 3].map((i) => <i key={i} style={{ transform: `scaleY(${Math.min(1, 0.15 + lvl * (0.6 + i * 0.25))})` }} />)}</span>
    </button>
  );
}

/** Big, obvious call-to-action shown on every experience while music is off, plus a device test beep. */
export function StartAudioCTA({ label = 'Start music', top = false }: { label?: string; top?: boolean }) {
  const { m, blocked, error } = useAudioStatus();
  const [beepMsg, setBeepMsg] = useState('');
  if (m.on && !blocked && !error) return null;
  return (
    <div className={`start-audio-wrap no-pan ${top ? 'top' : ''}`} role="region" aria-label="Sound">
      {blocked ? (
        <button className="start-audio blocked" onClick={() => music.retry()}>🔈 Tap to enable sound</button>
      ) : (
        <button className="start-audio" onClick={() => music.start()}>
          <span className="pulse-ring" aria-hidden />▶ {label}
        </button>
      )}
      <button className="test-sound" onClick={() => { setBeepMsg('Playing test beep…'); void testBeep().then(setBeepMsg); }}>🔔 Test sound</button>
      {beepMsg && <p className="beep-msg" role="status">{beepMsg}</p>}
      {error && <p className="beep-msg err">Audio error: {error}</p>}
    </div>
  );
}
