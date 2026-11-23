import { ReactNode, useEffect, useRef, useState } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { useStore } from '../state/store';
import { clamp, SYMMETRIES, uiStore, visualStore, VisualParams } from '../state/params';
import { PALETTES } from '../state/palettes';
import { applyPreset, applyShared, applyUserPreset, deleteUserPreset, loadUserPresets, presetById, PRESETS, randomVisual, saveUserPreset, shareUrl, applyVisual } from '../state/presets';
import { music, musicStore } from '../audio/music';
import { takeScreenshot } from '../engine/loop';
import { AudioControls } from './AudioControls';
import { Meters } from './Meters';
import { AudioPill, StartAudioCTA } from './AudioStatus';
import { SourceArtStrip } from './SourceArt';
import { Select, Slider, Toggle } from './Slider';

export type ControlKey = 'speed' | 'complexity' | 'symmetry' | 'depth' | 'rotation' | 'zoom' | 'petals' | 'layers' | 'brightness' | 'intensity';

export interface ExperienceProps {
  id: string;
  route: string;
  title: string;
  subtitle: string;
  modes: { id: string; label: string }[];
  defaultPreset: string;
  controls?: ControlKey[];
  maxZoom?: number;
  children: (mode: string) => ReactNode;
  about: ReactNode;
  extraPanel?: ReactNode;
  minimal?: boolean;
  /** Source-art records shown in a thumbnail strip with licences. */
  artKeys?: string[];
}

const ALL: ControlKey[] = ['speed', 'complexity', 'symmetry', 'depth', 'rotation', 'zoom', 'brightness', 'intensity'];

export function Experience(props: ExperienceProps) {
  const { route, title, subtitle, modes, defaultPreset, controls = ALL, children, about, extraPanel, minimal, maxZoom = 16, artKeys } = props;
  const v = useStore(visualStore);
  const ui = useStore(uiStore);
  const a = useStore(musicStore);
  const [params] = useSearchParams();
  const loc = useLocation();
  const rootRef = useRef<HTMLDivElement>(null);
  const [panel, setPanel] = useState<boolean>(() => window.innerWidth > 900 && !minimal);
  const [showAbout, setShowAbout] = useState(false);
  const [toast, setToast] = useState('');
  const [userPresets, setUserPresets] = useState(loadUserPresets);
  const [presetName, setPresetName] = useState('');

  // Initial parameters: shared link > named preset > experience default
  useEffect(() => {
    const s = params.get('s');
    const pid = params.get('preset');
    if (s && applyShared(s)) return;
    const pr = presetById(pid ?? '') ?? presetById(defaultPreset);
    if (pr) applyPreset(pr, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loc.pathname, loc.search]);

  useEffect(() => { uiStore.set({ calm: !!minimal }); return () => uiStore.set({ calm: false }); }, [minimal]);

  const set = (patch: Partial<VisualParams>) => visualStore.set(patch);
  const flash = (msg: string) => { setToast(msg); window.setTimeout(() => setToast(''), 2200); };

  const fullscreen = () => {
    const el = rootRef.current;
    if (!document.fullscreenElement) el?.requestFullscreen?.().catch(() => flash('Fullscreen not available'));
    else document.exitFullscreen?.();
  };

  const reset = () => { const pr = presetById(defaultPreset); if (pr) applyPreset(pr, false); flash('Reset'); };
  const randomize = () => { applyVisual(randomVisual()); flash('Randomized'); };

  // Keyboard shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') return;
      const s = visualStore.get();
      switch (e.key) {
        case ' ': e.preventDefault(); uiStore.set({ paused: !uiStore.get().paused }); break;
        case 'f': case 'F': fullscreen(); break;
        case 'h': case 'H': uiStore.set({ controlsHidden: !uiStore.get().controlsHidden }); break;
        case 'r': case 'R': randomize(); break;
        case 'm': case 'M': music.toggle(); break;
        case 'p': case 'P': setPanel((x) => !x); break;
        case '+': case '=': set({ zoom: clamp(s.zoom * 1.15, 0.2, maxZoom) }); break;
        case '-': case '_': set({ zoom: clamp(s.zoom / 1.15, 0.2, maxZoom) }); break;
        case 'ArrowLeft': set({ panX: s.panX + 0.05 / s.zoom }); break;
        case 'ArrowRight': set({ panX: s.panX - 0.05 / s.zoom }); break;
        case 'ArrowUp': set({ panY: s.panY - 0.05 / s.zoom }); break;
        case 'ArrowDown': set({ panY: s.panY + 0.05 / s.zoom }); break;
        default: {
          const n = parseInt(e.key, 10);
          if (n >= 1 && n <= modes.length) set({ mode: modes[n - 1].id });
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modes, maxZoom]);

  const mode = modes.some((m) => m.id === v.mode) ? v.mode : modes[0].id;
  const routePresets = PRESETS.filter((p) => p.route === route);
  const hidden = ui.controlsHidden;
  const has = (k: ControlKey) => controls.includes(k);

  return (
    <div ref={rootRef} className={`experience ${hidden ? 'controls-hidden' : ''}`}>
      {children(mode)}

      {hidden ? (
        <button className="btn ghost show-controls" onClick={() => uiStore.set({ controlsHidden: false })} aria-label="Show controls">☰</button>
      ) : (
        <>
          <header className="topbar no-pan">
            <Link to="/" className="brand" aria-label="Home">✺</Link>
            <Link to="/patterns" className="btn ghost essay-link" title="Essay: The Universal Language of Patterns">Patterns</Link>
            <div className="title">
              <h1>{title}</h1>
              <span>{subtitle}</span>
            </div>
            {modes.length > 1 && (
              <nav className="modes" aria-label="Modes">
                {modes.map((m, i) => (
                  <button key={m.id} className={`chip ${m.id === mode ? 'active' : ''}`} onClick={() => set({ mode: m.id })} title={`Key ${i + 1}`}>{m.label}</button>
                ))}
              </nav>
            )}
            <div className="actions">
              <AudioPill />
              <button className="btn icon" onClick={() => uiStore.set({ paused: !ui.paused })} aria-label={ui.paused ? 'Play' : 'Pause'} title="Space">{ui.paused ? '▶' : '❚❚'}</button>
              <button className={`btn icon ${a.on ? 'on' : ''}`} onClick={() => music.toggle()} aria-label={a.on ? 'Stop music' : 'Start music'} title="M">{a.on ? '♫' : '♪'}</button>
              <button className="btn icon" onClick={fullscreen} aria-label="Fullscreen" title="F">⛶</button>
              <button className="btn icon" onClick={() => takeScreenshot(props.id)} aria-label="Screenshot">📷</button>
              <button className="btn icon" onClick={() => setShowAbout((x) => !x)} aria-label="About this experience">ⓘ</button>
              <button className="btn icon" onClick={() => uiStore.set({ controlsHidden: true })} aria-label="Hide controls" title="H">◌</button>
              <button className={`btn icon ${panel ? 'on' : ''}`} onClick={() => setPanel((x) => !x)} aria-label="Toggle control panel" title="P">⚙</button>
            </div>
          </header>

          <StartAudioCTA label={minimal ? 'Start calming music' : 'Start soundtrack'} top={minimal} />

          {panel && (
            <aside className="panel no-pan" aria-label="Controls">
              <details open>
                <summary>Visual</summary>
                {has('speed') && <Slider label="Animation speed" value={v.speed} min={0} max={3} onChange={(x) => set({ speed: x })} />}
                {has('complexity') && <Slider label="Pattern complexity" value={v.complexity} min={0} max={1} onChange={(x) => set({ complexity: x })} />}
                {has('symmetry') && (
                  <div className="sym">
                    <span className="slider-label">Symmetry <em>{v.symmetry}</em></span>
                    <div className="chips">{SYMMETRIES.map((s) => <button key={s} className={`chip ${v.symmetry === s ? 'active' : ''}`} onClick={() => set({ symmetry: s })}>{s}</button>)}</div>
                  </div>
                )}
                {has('depth') && <Slider label="Recursion depth" value={v.depth} min={1} max={8} step={1} onChange={(x) => set({ depth: Math.round(x) })} />}
                {has('petals') && <Slider label="Petal count" value={v.petals} min={4} max={32} step={1} onChange={(x) => set({ petals: Math.round(x) })} />}
                {has('layers') && <Slider label="Concentric layers" value={v.layers} min={2} max={12} step={1} onChange={(x) => set({ layers: Math.round(x) })} />}
                {has('rotation') && <Slider label="Rotation" value={v.rotation} min={-1} max={1} onChange={(x) => set({ rotation: x })} />}
                {has('zoom') && <Slider label="Zoom" value={clamp(v.zoom, 0.25, maxZoom)} min={0.25} max={maxZoom} log onChange={(x) => set({ zoom: x })} format={(x) => x.toFixed(2) + '×'} />}
                <Select label="Colour palette" value={v.palette} options={PALETTES.map((p) => ({ value: p.id, label: p.name }))} onChange={(x) => set({ palette: x })} />
                <label className="select"><span className="slider-label">Background</span><input type="color" value={v.bg} onChange={(e) => set({ bg: e.target.value })} aria-label="Background colour" /></label>
                {has('brightness') && <Slider label="Brightness" value={v.brightness} min={0.3} max={1.6} onChange={(x) => set({ brightness: x })} />}
                {has('intensity') && <Slider label="Visual intensity" value={v.intensity} min={0} max={1} onChange={(x) => set({ intensity: x })} />}
                <div className="row">
                  <button className="btn" onClick={randomize}>🎲 Randomize</button>
                  <button className="btn" onClick={reset}>↺ Reset</button>
                  <button className="btn" onClick={() => set({ zoom: 1, panX: 0, panY: 0 })}>⌖ Recentre</button>
                </div>
              </details>
              {extraPanel}
              {artKeys && artKeys.length > 0 && <SourceArtStrip keys={artKeys} />}
              <details open={!minimal}>
                <summary>Audio-visual sync</summary>
                <Slider label="Audio reactivity" value={v.reactivity} min={0} max={1} onChange={(x) => set({ reactivity: x })} />
                <Meters />
                <p className="note">Bass → expansion · mids → rotation · highs → fine detail · beats → gentle pulse · chord changes → palette drift.</p>
              </details>
              <details>
                <summary>Music {a.on ? '♫' : ''}</summary>
                <AudioControls />
              </details>
              <details>
                <summary>Presets</summary>
                <div className="preset-list">
                  {routePresets.map((p) => <button key={p.id} className="chip" onClick={() => { applyPreset(p); flash(p.name); }}>{p.name}</button>)}
                </div>
                <div className="row">
                  <input className="text" placeholder="Preset name" value={presetName} onChange={(e) => setPresetName(e.target.value)} aria-label="Preset name" />
                  <button className="btn" onClick={() => { saveUserPreset(presetName || title, route); setUserPresets(loadUserPresets()); setPresetName(''); flash('Preset saved'); }}>Save</button>
                </div>
                {userPresets.filter((u) => u.route === route).map((u) => (
                  <div className="row user-preset" key={u.id}>
                    <button className="chip" onClick={() => { applyUserPreset(u); flash(u.name); }}>{u.name}</button>
                    <button className="btn icon small" aria-label={`Delete ${u.name}`} onClick={() => { deleteUserPreset(u.id); setUserPresets(loadUserPresets()); }}>✕</button>
                  </div>
                ))}
                <button className="btn" onClick={async () => {
                  const url = shareUrl(route);
                  try { await navigator.clipboard.writeText(url); flash('Share link copied'); } catch { window.prompt('Copy this link', url); }
                }}>🔗 Copy shareable link</button>
              </details>
              <details>
                <summary>Accessibility & performance</summary>
                <Toggle label="Reduced motion (slower, no pulses)" checked={ui.reducedMotion} onChange={(x) => uiStore.set({ reducedMotion: x })} />
                <Select label="Quality" value={ui.quality} options={[{ value: 'auto', label: 'Adaptive (auto)' }, { value: 'low', label: 'Low (battery saver)' }, { value: 'medium', label: 'Medium' }, { value: 'high', label: 'High' }]} onChange={(x) => uiStore.set({ quality: x })} />
                <p className="note">{ui.fps} fps · render scale {(ui.renderScale * 100).toFixed(0)}%</p>
                <p className="note">Keys: Space pause · F fullscreen · H hide · P panel · R randomize · M music · +/− zoom · arrows pan · 1–{modes.length} modes. Drag to pan, wheel/pinch to zoom.</p>
              </details>
            </aside>
          )}

          {showAbout && (
            <section className="about no-pan" role="dialog" aria-label={`About ${title}`}>
              <button className="btn icon close" onClick={() => setShowAbout(false)} aria-label="Close">✕</button>
              {about}
              <p><Link to="/learn">Read more & references →</Link> · <Link to="/patterns">The Universal Language of Patterns →</Link></p>
            </section>
          )}
        </>
      )}
      {ui.paused && !hidden && <div className="paused-badge">Paused</div>}
      {toast && <div className="toast" role="status">{toast}</div>}
    </div>
  );
}
