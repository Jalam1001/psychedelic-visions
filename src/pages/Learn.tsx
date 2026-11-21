import { Link } from 'react-router-dom';
import { REFS, Ref } from '../content/references';
import { ArtCredits } from '../ui/SourceArt';

const RefList = ({ refs }: { refs: Ref[] }) => (
  <ul className="refs">{refs.map((r) => <li key={r.url}><a href={r.url} target="_blank" rel="noreferrer">{r.label}</a> <span className={`tag ${r.kind}`}>{r.kind}</span></li>)}</ul>
);

export default function Learn() {
  return (
    <main className="page learn">
      <nav className="crumbs"><Link to="/">← Psychedelic Visions</Link></nav>
      <h1>Research & Learning</h1>
      <p className="lede">This page separates four kinds of statement: <span className="tag science">scientific findings</span>, <span className="tag tradition">historical & religious traditions</span>, <span className="tag math">mathematics</span>, and <strong>modern generative artwork</strong> (everything this site renders). Nothing here is medical advice, and the site does not treat or cure any condition.</p>
      <nav className="toc" aria-label="Contents">
        {['fractals', 'recursion', 'kaleidoscopes', 'islamic', 'alexander', 'mandalas', 'amazon', 'music', 'fourier', 'research', 'safety', 'art'].map((id) => <a key={id} href={`#${id}`} onClick={(e) => { e.preventDefault(); document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' }); }}>{id}</a>)}
      </nav>

      <section id="fractals"><h2>Fractal mathematics</h2>
        <p>A fractal is a shape with structure at every scale, often self-similar. The Mandelbrot set is the set of complex numbers c for which iterating z → z² + c from z = 0 never escapes to infinity; its boundary is infinitely detailed. Julia sets fix c and vary the starting point. Iterated function systems (IFS) build fractals as the attractor of a few contracting maps (e.g. the Sierpiński triangle). Escape-time rendering colours each pixel by how fast the orbit leaves a disc of radius 2; smooth colouring uses ν = n − log₂(log₂|z|²) + 4.</p>
        <RefList refs={REFS.math.slice(0, 4)} />
      </section>

      <section id="recursion"><h2>Recursive geometry</h2>
        <p>Recursion defines a figure in terms of smaller copies of itself: subdivision (a square split into squares), growth (Pythagoras tree, L-systems), or nesting (stars inside stars). Log-polar coordinates convert scaling into translation, which is how the site produces endless zooms and spirals. Fractal Brownian motion (sums of noise at doubling frequencies) adds natural, organic texture.</p>
        <RefList refs={REFS.math.slice(3, 5)} />
      </section>

      <section id="kaleidoscopes"><h2>Kaleidoscopic transformations</h2>
        <p>A kaleidoscope with mirrors at angle π/n produces the dihedral symmetry group D<sub>n</sub>: n rotations and n reflections. In a shader we compute the angle θ of each pixel, reduce it modulo 2π/n and reflect it about the wedge centre: θ' = |(θ mod 2π/n) − π/n|. Any texture sampled at the folded coordinates becomes perfectly symmetric.</p>
        <RefList refs={[REFS.math[5], REFS.math[10], REFS.math[11]]} />
      </section>

      <section id="islamic"><h2>Islamic geometric construction</h2>
        <p><span className="tag tradition">tradition</span> Islamic geometric ornament, developed across the Abbasid, Seljuk, Persian, Mamluk, Moorish and Ottoman worlds, is built from compass-and-straightedge constructions: star polygons, rosettes and interlacing straps arranged on periodic lattices (square, hexagonal) and, in some medieval works, girih tile sets with five-fold symmetry. <span className="tag math">math</span> A regular star polygon {'{'}n/k{'}'} joins every k-th of n points on a circle; its inner vertices lie at radius R·cos(πk/n)/cos(π(k−1)/n). <strong>Our renderers are modern generative interpretations</strong>, not reconstructions of specific monuments.</p>
        <RefList refs={REFS.islamic} />
      </section>

      <section id="alexander"><h2>Christopher Alexander's theory of centres</h2>
        <p>In <em>A Foreshadowing of 21st Century Art</em> (1993) Alexander analysed very early Turkish carpets, arguing that their “wholeness” arises from <strong>centres</strong> — zones of coherence that are intensified by other centres. In <em>The Nature of Order, Book 1: The Phenomenon of Life</em> (2002) he named fifteen structural properties: levels of scale, strong centres, boundaries, alternating repetition, positive space, good shape, local symmetries, deep interlock and ambiguity, contrast, gradients, roughness, echoes, the void, simplicity and inner calm, and not-separateness.</p>
        <p><strong>How this differs from fractals:</strong> strict self-similarity copies one shape across scales. Alexander's centres are heterogeneous — each level has its own shapes and colours — and what recurs is the relation of mutual support between scales. The carpet, recursive-centre and living-mandala modes animate this by revealing one level at a time and changing motif type per level. Alexander's ideas are an influential theory of design, not an experimentally established scientific law.</p>
        <RefList refs={REFS.alexander} />
      </section>

      <section id="mandalas"><h2>Hindu and Tibetan mandala geometry</h2>
        <p><span className="tag tradition">tradition</span> Hindu yantras and Buddhist mandalas are sacred diagrams for ritual and meditation. Typical structure: a central point (bindu) or deity seat; interlocking triangles (in yantras); lotus rings of 8 and 16 petals; concentric circles; and a square enclosure (bhūpura or palace) with four gates facing the cardinal directions. Tibetan sand mandalas (e.g. Kālacakra) are built over days and ritually dissolved.</p>
        <p><span className="tag math">math</span> The Sri Yantra construction used here (Kaivalyāśrama): a 48-unit vertical diameter, nine chords at 6, 12, 17, 20, 23, 27, 30, 36, 42 units, seven of them shortened by 3, 5, 16, 18, 16, 4, 3 units, and their ends joined to points on the axis — giving 4 upward and 5 downward triangles and 43 small triangles. Researchers have noted that traditional recipes leave small mismatches at some triple intersections.</p>
        <RefList refs={REFS.mandala} />
      </section>

      <section id="amazon"><h2>Peruvian Amazonian art — respectful framing</h2>
        <p>Shipibo-Konibo kené designs are an Indigenous art form from the Peruvian Amazon, painted and embroidered mostly by women on textiles, ceramics and the body, and recognised by Peru's Ministry of Culture as Cultural Heritage of the Nation. Visionary paintings associated with ayahuasca ceremonies (e.g. the Pucallpa school) are a separate, contemporary art movement. This site does <strong>not</strong> reproduce kené designs or claim to know their meanings; its Amazonian Visions page contains original procedural patterns <em>inspired by</em> general visual features (diagonal lattices, thick and thin lines, stepped diamonds, botanical forms).</p>
        <p>The photographs of Shipibo-Konibo textiles and ceramics in the Source art section below (CC0 photos on Wikimedia Commons) are shown as respectful reference only; the “Shipibo-Konibo (palette only)” colour scheme borrows their colours, not their designs, and they are never distorted into shader textures.</p>
        <RefList refs={REFS.amazon} />
      </section>

      <section id="music"><h2>Soundtracks & live synth</h2>
        <p>By default each experience plays one of ten <strong>original soundtrack loops</strong> (Amazonian night, kaleidoscope bloom, fractal depths, Sufi ney &amp; daf, Persian santur garden, Himalayan bowls, tanpura &amp; bansuri, harmonic choir, deep relaxation, cosmic journey). They were synthesised offline for this project — no samples or existing melodies — and loop seamlessly; the visuals follow a precomputed bass/mid/high envelope of each clip. The style labels describe general flavour only.</p>
        <p>The optional <strong>Live synth</strong> (Tone.js on the Web Audio API, also used in the Sound Lab) never plays a recording: drones on the root, fifth and octave pass through a slowly sweeping filter; a chorus-widened pad plays a four-chord progression built from the chosen scale; a sparse melody follows a random walk; singing-bowl-like tones use inharmonic partials (×1, ×2.76, ×5.40, ×8.93) with detuned twins that beat slowly; soft percussion follows a probabilistic pattern; nature textures are filtered noise. A compressor and a −2 dB limiter prevent clipping, and every level change is ramped.</p>
        <RefList refs={REFS.audio.slice(3, 6)} />
      </section>

      <section id="fourier"><h2>Fourier analysis & spectrum visualisation</h2>
        <p>The Fast Fourier Transform decomposes a short window of sound into energy per frequency. Each frame, the site reads a 1024-point FFT, averages energy in bass (&lt;250 Hz), mid (250–2000 Hz) and high (2–10 kHz) bands, normalises each with a slowly decaying peak follower, smooths them (fast attack, slow release) and detects beats as sudden rises in bass energy. These drive expansion, rotation, detail and a gentle pulse. These mappings are artistic choices, not physical cymatics.</p>
        <RefList refs={REFS.audio.slice(0, 3)} />
      </section>

      <section id="research"><h2>Music, relaxation & “healing frequencies” — what the evidence says</h2>
        <table className="evidence">
          <thead><tr><th>Claim</th><th>Status</th><th>Summary</th></tr></thead>
          <tbody>
            <tr><td>Music listening reduces stress</td><td><span className="tag science">moderate evidence</span></td><td>Meta-analyses (de Witte 2020; Cochrane review by Bradt 2013) report small-to-moderate average reductions in self-reported stress/anxiety and some physiological measures, with heterogeneous study quality.</td></tr>
            <tr><td>Binaural beats affect anxiety or cognition</td><td><span className="tag">mixed / preliminary</span></td><td>A 2019 meta-analysis found some effects on anxiety and pain; a 2023 systematic review found inconsistent evidence that binaural beats entrain brain oscillations.</td></tr>
            <tr><td>Singing bowl sound meditation improves mood</td><td><span className="tag">preliminary</span></td><td>Observational study without a control group (Goldsby 2017); cannot establish cause.</td></tr>
            <tr><td>432 Hz tuning is healthier than 440 Hz</td><td><span className="tag">weak / unsupported</span></td><td>One small pilot study (Calamassi 2019, 33 participants) reported slight differences; there is no robust evidence. 432 Hz is a historical/alternative tuning, not a medical frequency.</td></tr>
            <tr><td>528 Hz “repairs DNA” / Solfeggio frequencies heal</td><td><span className="tag">unsupported</span></td><td>No credible peer-reviewed evidence supports these claims. The site lets you choose any root frequency purely as a musical choice.</td></tr>
          </tbody>
        </table>
        <RefList refs={REFS.science} />
      </section>

      <section id="safety"><h2>Accessibility & safety</h2>
        <p>Visuals avoid intentional flashing: beat pulses change brightness by at most ~6% and decay over ~0.5 s, well within WCAG guidance on flashes. Reduced-motion mode slows animation and disables pulses; it defaults on when your system requests reduced motion. Audio only starts after you press a button, fades in, and is limited to prevent clipping. Binaural beats require headphones; keep volume moderate.</p>
        <RefList refs={REFS.safety} />
        <h3>Technology</h3>
        <RefList refs={REFS.tech} />
      </section>

      <section id="art"><h2>Source art & image credits</h2>
        <p>Colours and textures in several experiences come from real historical works. Only images that are <strong>public domain, CC0, CC BY or CC BY-SA</strong> are used — The Met and Rijksmuseum open-access works, Ernst Haeckel, Hilma af Klint, Kandinsky, Mucha, NASA/ESA (JWST, Hubble) and Wikimedia Commons photographers, credited by name. Each licence was verified on Wikimedia Commons. Textures and backdrops derived from CC BY-SA images are shared under the same licence. Copyrighted visionary art (for example Pablo Amaringo's paintings) is not reproduced. Full table: <a href="https://github.com/Jalam1001/psychedelic-visions/blob/main/CREDITS.md" target="_blank" rel="noreferrer">CREDITS.md</a>.</p>
        <ArtCredits />
      </section>
    </main>
  );
}
