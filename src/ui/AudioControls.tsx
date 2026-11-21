import { audio, audioStore, testBeep } from '../audio/engine';
import { clips, clipStore, TRACKS } from '../audio/clips';
import { music, musicStore } from '../audio/music';
import { useState } from 'react';
import { AUDIO_PRESETS, NatureType, PadTimbre } from '../audio/presets';
import { SCALES } from '../audio/scales';
import { useStore } from '../state/store';
import { Select, Slider, Toggle } from './Slider';

export function AudioControls({ compact = false }: { compact?: boolean }) {
  const a = useStore(audioStore);
  const m = useStore(musicStore);
  const c = useStore(clipStore);
  const p = a.params;
  const set = audio.setParams.bind(audio);
  const [beep, setBeep] = useState('');
  return (
    <div className="audio-controls">
      <div className="row">
        <button className={`btn ${m.on ? 'on' : 'primary'}`} onClick={() => music.toggle()} aria-pressed={m.on}>
          {m.on ? '■ Stop music' : '▶ Start music'}
        </button>
        <button className="btn" onClick={() => { setBeep('…'); void testBeep().then(setBeep); }}>🔔 Test</button>
      </div>
      {beep && <p className="note">{beep}</p>}
      <div className="chips source-switch" role="radiogroup" aria-label="Sound source">
        <button className={`chip ${m.source === 'clips' ? 'active' : ''}`} onClick={() => music.setSource('clips')} role="radio" aria-checked={m.source === 'clips'}>🎵 Soundtrack</button>
        <button className={`chip ${m.source === 'synth' ? 'active' : ''}`} onClick={() => music.setSource('synth')} role="radio" aria-checked={m.source === 'synth'}>🎛 Live synth</button>
      </div>
      {m.source === 'clips' ? <>
        <Select label="Track" value={c.trackId} options={TRACKS.map((t) => ({ value: t.id, label: `${t.title} (${Math.round(t.loop)} s loop)` }))} onChange={(v) => music.setTrack(v)} />
        <p className="note">{TRACKS.find((t) => t.id === c.trackId)?.desc}. Original music rendered for this site; seamless loop.</p>
        <Slider label="Volume" value={c.volume} min={0} max={1} onChange={(v) => clips.setVolume(v)} format={(v) => Math.round(v * 100) + '%'} />
      </> : <>
        <div className="row"><button className="btn" onClick={() => audio.setMuted(!a.muted)} aria-pressed={a.muted}>{a.muted ? 'Unmute' : 'Mute'}</button></div>
        <p className="note">Live synth engine: {a.ctxState}</p>
      <Select label="Music preset" value={a.presetId in AUDIO_PRESETS ? a.presetId : 'custom'}
        options={[...Object.entries(AUDIO_PRESETS).map(([k, v]) => ({ value: k, label: v.name })), { value: 'custom', label: 'Custom' }]}
        onChange={(v) => v !== 'custom' && audio.loadPreset(v)} />
      <Slider label="Master volume" value={p.volume} min={0} max={1} onChange={(v) => set({ volume: v })} format={(v) => Math.round(v * 100) + '%'} />
      {!compact && <>
        <Slider label="Root frequency" value={p.root} min={55} max={261.63} log onChange={(v) => set({ root: v })} format={(v) => v.toFixed(1) + ' Hz'} />
        <Slider label="Tempo" value={p.tempo} min={30} max={110} step={1} onChange={(v) => set({ tempo: v })} format={(v) => Math.round(v) + ' BPM'} />
        <Select label="Scale" value={p.scale} options={Object.entries(SCALES).map(([k, v]) => ({ value: k, label: v.name }))} onChange={(v) => set({ scale: v })} />
        <Select<PadTimbre> label="Instrument timbre" value={p.timbre} options={[{ value: 'warm', label: 'Warm pad' }, { value: 'glass', label: 'Glass / bell' }, { value: 'choir', label: 'Choir-like' }, { value: 'string', label: 'Bowed string / tanpura-like' }]} onChange={(v) => set({ timbre: v })} />
        <div className="mix">
          <Slider label="Drone" value={p.drone} min={0} max={1} onChange={(v) => set({ drone: v })} />
          <Slider label="Pads & melody" value={p.pad} min={0} max={1} onChange={(v) => set({ pad: v })} />
          <Slider label="Singing bowls" value={p.bowl} min={0} max={1} onChange={(v) => set({ bowl: v })} />
          <Slider label="Soft percussion" value={p.perc} min={0} max={1} onChange={(v) => set({ perc: v })} />
          <Slider label="Nature soundscape" value={p.nature} min={0} max={1} onChange={(v) => set({ nature: v })} />
        </div>
        <Select<NatureType> label="Nature type" value={p.natureType} options={[{ value: 'none', label: 'None' }, { value: 'wind', label: 'Mountain wind' }, { value: 'rain', label: 'Rain' }, { value: 'stream', label: 'Stream' }, { value: 'night', label: 'Rainforest night' }]} onChange={(v) => set({ natureType: v })} />
        <Slider label="Reverb" value={p.reverb} min={0} max={1} onChange={(v) => set({ reverb: v })} />
        <Slider label="Stereo width" value={p.width} min={0} max={1} onChange={(v) => set({ width: v })} />
        <fieldset className="binaural">
          <legend>Binaural beat</legend>
          <Toggle label="Enable" checked={p.binaural > 0} onChange={(on) => set({ binaural: on ? 0.3 : 0 })} />
          {p.binaural > 0 && <>
            <Slider label="Level" value={p.binaural} min={0.05} max={1} onChange={(v) => set({ binaural: v })} />
            <Slider label="Beat frequency" value={p.beatHz} min={1} max={30} step={0.5} onChange={(v) => set({ beatHz: v })} format={(v) => v.toFixed(1) + ' Hz'} />
            <Slider label="Carrier" value={p.carrier} min={100} max={400} step={1} onChange={(v) => set({ carrier: v })} format={(v) => Math.round(v) + ' Hz'} />
          </>}
          <p className="note">🎧 Binaural beats only exist when each ear hears a different tone — use headphones. Evidence for effects on mood or cognition is mixed; see Learn.</p>
        </fieldset>
      </>}
      </>}
      {!m.on && <p className="note">Browsers only allow sound after a tap/click on Start. On phones, turn up media volume (volume-up key while music plays) and (iPhone) the silent switch; “Test sound” plays a plain beep to check your device.</p>}
    </div>
  );
}
