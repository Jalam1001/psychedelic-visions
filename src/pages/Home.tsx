import { Link, useNavigate } from 'react-router-dom';
import { ShaderView } from '../views/ShaderView';
import { KALEIDOSCOPE_FRAG } from '../shaders/kaleidoscope';
import { PRESETS } from '../state/presets';
import { webglAvailable } from '../engine/gl';
import { useEffect, useState } from 'react';
import { visualStore, DEFAULT_VISUAL } from '../state/params';

const EXPERIENCES = [
  { to: '/amazonian', n: 1, title: 'Amazonian Visions', text: 'Kené-inspired lattices, vines and luminous jungle geometry, emerging in waves.' },
  { to: '/kaleidoscope', n: 2, title: 'Psychedelic Kaleidoscope', text: '4–24 mirrored segments, counter-rotating fractal layers, zoom and pan.' },
  { to: '/fractal', n: 3, title: 'Fractal Journey', text: 'GPU Mandelbrot & Julia sets with deep zoom, tunnels, spirals and IFS.' },
  { to: '/sacred', n: 4, title: 'Sacred Geometry', text: 'Flower of Life, golden ratio, Metatron’s Cube — the maths explained.' },
  { to: '/islamic', n: 5, title: 'Islamic Geometry & Living Carpets', text: 'Star lattices, a living Seljuk-style carpet and Alexander’s recursive centres.' },
  { to: '/lab', n: 6, title: 'Sound & Vision Lab', text: 'Frequency generator, harmonics, binaural/monaural/isochronic beats, spectrum.' },
  { to: '/meditation', n: 7, title: 'Meditation & Relaxation', text: 'Breathing-paced rosette, drones, bowls, nature sounds and a session timer.' },
  { to: '/journey', n: 8, title: 'Infinite Psychedelic Journey', text: 'Endless smooth cross-fades through every visual world.' },
  { to: '/mandala', n: 9, title: 'Living Mandalas', text: 'Infinite lotus, Tibetan-inspired, Sri Yantra, psychedelic and Alexander modes.' },
];

export default function Home() {
  const nav = useNavigate();
  const [gl] = useState(webglAvailable);
  useEffect(() => { visualStore.replace({ ...DEFAULT_VISUAL, palette: 'cosmic', symmetry: 12, speed: 0.6, complexity: 0.5, depth: 5, brightness: 0.55, intensity: 0.8, reactivity: 0.4 }); }, []);
  return (
    <main className="home">
      <div className="hero-bg" aria-hidden>{gl && <ShaderView frag={KALEIDOSCOPE_FRAG} panZoom={false} pixelCap={1} />}</div>
      <section className="hero">
        <h1>Psychedelic Visions</h1>
        <p className="tag-line">Living Geometry &amp; Generative Music</p>
        <p className="intro">An interactive audiovisual instrument: kaleidoscopes, fractals, Islamic star lattices, living carpets and mandalas that continuously unfold while real-time generative music shapes their motion.</p>
        <div className="row center">
          <Link className="btn primary big" to="/kaleidoscope">Enter the kaleidoscope</Link>
          <Link className="btn big" to="/journey">Start the infinite journey</Link>
        </div>
      </section>
      <section className="grid" aria-label="Experiences">
        {EXPERIENCES.map((e) => (
          <Link key={e.to} to={e.to} className="card">
            <span className="num">{e.n}</span>
            <h2>{e.title}</h2>
            <p>{e.text}</p>
          </Link>
        ))}
      </section>
      <section className="presets-home">
        <h2>Presets</h2>
        <div className="chips wrap">
          {PRESETS.map((p) => <button key={p.id} className="chip" title={p.description} onClick={() => nav(`${p.route}?preset=${p.id}`)}>{p.name}</button>)}
        </div>
      </section>
      <footer className="foot">
        <Link to="/learn">Research, references &amp; how it works</Link> · <a href="https://github.com/Jalam1001/psychedelic-visions" target="_blank" rel="noreferrer">Source on GitHub</a> · MIT licensed
        <p className="note">Generative art and music for enjoyment and relaxation — not a medical treatment. Motifs are original interpretations “inspired by” the traditions named, not authentic reproductions.</p>
      </footer>
    </main>
  );
}
