# PSYCHEDELIC VISIONS — Living Geometry & Generative Music

**Live site:** https://jalam1001.github.io/psychedelic-visions/
**Source:** https://github.com/Jalam1001/psychedelic-visions

An interactive audiovisual instrument: kaleidoscopes, fractals, Islamic star lattices, a living
Seljuk-style carpet, Christopher-Alexander-inspired recursive centres and living mandalas that
continuously unfold while real-time generative music shapes their motion.

> Generative art and music for enjoyment and relaxation — **not** a medical treatment.
> Cultural motifs are original procedural interpretations *inspired by* the traditions named,
> not authentic reproductions.

---

## 1. Project purpose

To explore *living geometry*: patterns that emerge, unfold, rotate and regenerate, coupled to music
through FFT analysis. Nine experiences share one rendering, audio, sync and control architecture:

| # | Experience | Route | Status |
|---|---|---|---|
| 1 | Amazonian Visions | `#/amazonian` | **Complete (simpler)** — 4 shader modes: kené-inspired lattice, vine mandala, visionary forest, serpent river; generational emergence waves |
| 2 | Psychedelic Kaleidoscope | `#/kaleidoscope` | **Complete** — 4/6/8/12/16/24 segments, 3 counter-rotating fractal layers, 3 modes, zoom/pan |
| 3 | Fractal Journey | `#/fractal` | **Complete** — GPU Mandelbrot/Julia (smooth colouring, orbit traps, Julia presets, auto deep zoom ≈10⁵×), fractal tunnel, recursive log-spiral, kaleidoscopic IFS |
| 4 | Sacred Geometry | `#/sacred` | **Complete (simpler)** — Flower of Life, Fibonacci/phyllotaxis/golden spiral, Metatron's Cube, interlocking polygons, Pythagoras tree; maths vs. symbolism explained |
| 5 | Islamic Recursive Geometry & Living Carpets | `#/islamic` | **Complete** — Living Turkish carpet, infinite tessellation, Alexander's recursive centres, Persian garden, Sufi meditation |
| 6 | Sound & Vision Laboratory | `#/lab` | **Complete** — frequency generator, waveforms, harmonic series, binaural/monaural/isochronic beats, scale player, bowl, log-frequency spectrum + oscilloscope, 3 visual mappings |
| 7 | Meditation & Relaxation | `#/meditation` | **Complete** — breathing-paced rosette (4 patterns), session timer with bowl chime, nature sounds, intensity control, minimal UI |
| 8 | Infinite Psychedelic Journey | `#/journey` | **Complete** — 5 worlds in one shader, smoothstep cross-fades, automatic or manual world choice (worlds are simplified versions of the other experiences) |
| 9 | Living Mandalas | `#/mandala` | **Complete** — Infinite lotus, Tibetan-inspired (construct → hold → dissolve), Sri Yantra traditional static + animated interpretation, psychedelic shader mandala, Alexander's living mandala |

Plus `#/learn` (research & references) and 18 named presets.

## 2. Technologies used

- **React 18 + TypeScript + Vite 5**, `HashRouter` so every experience has a direct link on GitHub Pages
- **Raw WebGL 1 / GLSL ES 1.00** fragment shaders (chosen over Three.js/React Three Fiber because every
  visual is a full-screen procedural shader or 2-D vector construction; this keeps the bundle small and
  runs on older mobile GPUs). Three.js/R3F remain an option for future 3-D scenes.
- **Canvas 2D** for exact geometric constructions (carpets, star lattices, mandalas, Sri Yantra, sacred geometry)
- **Tone.js 15 / Web Audio API** for synthesis, scheduling, effects and FFT analysis

## 3. Installation & local development

```bash
git clone https://github.com/Jalam1001/psychedelic-visions.git
cd psychedelic-visions
npm ci            # or npm install
npm run dev       # http://localhost:5173/psychedelic-visions/
npm run build     # type-check (tsc --noEmit) + production build into dist/
npm run preview   # serve dist/ at http://localhost:4173/psychedelic-visions/
```

**Testing.** `npm run typecheck` and `npm run build` must pass with zero errors. Manual test checklist:
open every route, switch every mode (keys 1–6), start music, move the reactivity slider and watch the
meters, save a preset, copy a share link and open it in a new tab, toggle reduced motion, resize to a
phone width. Headless screenshots were produced with Playwright + Chromium (SwiftShader WebGL).

## 4. Visual rendering architecture

```
src/
  engine/gl.ts         full-screen-triangle WebGL renderer, uniform cache, context-loss handling
  engine/loop.ts       shared rAF loop: artistic time (pause/speed/reduced motion), adaptive quality, screenshot registry
  shaders/*.ts         GLSL programs (common helpers, kaleidoscope, fractal, amazonian, mandala, journey, meditation, lab)
  geometry/*.ts        Canvas-2D algorithms (star polygons, lattices, carpet, recursive centres, mandalas, Sri Yantra, sacred)
  views/ShaderView     binds shared parameters + audio bands to shader uniforms
  views/CanvasView     centred, pan/zoomed 2-D canvas with background, brightness and vignette passes
  views/usePanZoom     mouse drag/wheel and touch drag/pinch
  audio/engine.ts      generative music engine           audio/analysis.ts  FFT bands, beat detection, sync
  state/               tiny external store, palettes, visual params, 18 presets, localStorage + share URLs
  ui/                  Experience shell, control panel, audio controls, meters, safety gate
  pages/               nine experiences + Home + Learn
  content/references   verified reference URLs
```

Every frame the loop reads the parameter store directly (no React re-render), so sliders and audio
update visuals at full frame rate. **Adaptive quality** measures frame time and scales the render
resolution between 35 % and 100 % (Low/Medium/High overrides available). If WebGL is missing or a
shader fails to compile, a CSS fallback and explanation are shown; Canvas experiences keep working.

## 5. Mathematical foundations

- **Kaleidoscope:** polar fold θ' = |(θ mod 2π/n) − π/n| (dihedral group Dₙ); texture from the “kali”
  escape-time fold z → |z|/|z|² − c, fBm value noise and domain warping.
- **Mandelbrot/Julia:** z → z² + c, smooth iteration count ν = n − log₂(log₂|z|²) + 4, orbit traps;
  single-precision limits sharp zoom to ≈10⁵×.
- **Tunnels & spirals:** inverse-radius depth (1/r) and log-polar coordinates (scaling ↔ translation).
- **IFS:** per-pixel kaleidoscopic iterated function system (fold, rotate, scale).
- **Star polygons {n/k}:** inner radius R·cos(πk/n)/cos(π(k−1)/n); square (star-and-cross) and hexagonal lattices;
  infinite zoom by cross-fading lattices an octave apart.
- **Alexander's centres:** recursive placement of heterogeneous centres (motif type alternates per level),
  boundaries as annuli, voids at cores, progressive level-by-level reveal — explicitly *not* strict self-similarity.
- **Sri Yantra:** Kaivalyāśrama 48-unit construction (chords at 6, 12, 17, 20, 23, 27, 30, 36, 42; shortened by
  3, 5, 16, 18, 16, 4, 3), drawn faithfully including its known small intersection errors; even-odd fill reveals the 43 triangles.
- **Sacred geometry:** golden angle 137.508°, Vogel phyllotaxis r ∝ √n, golden-rectangle subdivision,
  Flower of Life hexagonal lattice, 78 segments of Metatron's Cube, Pythagoras tree.

## 6. Audio synthesis & synchronization

**Engine (Tone.js, v2):** one shared AudioContext (`latencyHint: 'playback'`). Drones on root, fifth,
octave and twelfth (pitched so phone speakers reproduce them) through an LFO-swept low-pass; chorus-widened
pad with a bass note playing a chord every bar; eighth-note random-walk melody with a dotted-eighth echo;
singing-bowl voice (partials ×1, 2.76, 5.40 plus a slowly beating twin); frame-drum / tabla-like / shaker
percussion; synthesised nature beds; binaural beat (hard-panned, dry). Chain: bus → widener → reverb →
master → compressor → make-up gain → −1 dB limiter → speakers; FFT + waveform analysers tap the limiter.

**Starting sound reliably (Android Chrome, iOS Safari, desktop):** `unlockAudio()` runs synchronously in
the tap/click handler before any `await` — it resumes the context, plays a one-sample silent buffer, sets
`navigator.audioSession.type = 'playback'` (iOS) and starts a looping silent `<audio>` element on mobile.
The graph is built synchronously (the reverb impulse renders in the background), so the first notes play
in the same gesture. A capture-phase pointerdown/touchend/click/keydown listener re-unlocks if the browser
suspends audio, and `visibilitychange` resumes after tab switches. The top-bar pill shows the real
AudioContext state and a live level meter; a **Test sound** button plays a plain beep on a brand-new
AudioContext to tell device mute apart from an app problem. *Tip: on Android, media volume is separate from
ringer volume — press volume-up while music plays.* `window.__pv.rms()` exposes output RMS for automated tests
(`pv-audiotest.py` / `pv-androidtest.py` in the build notes).

**Sync:** a 1024-point FFT is split into bass (<250 Hz), mid (250–2000 Hz) and high (2–10 kHz) bands,
auto-gained by slow peak followers and smoothed (fast attack, slow release). Bass flux plus scheduled
musical events (percussion hits, bowl strikes) trigger a pulse that decays over ~0.45 s; chord changes
drift the palette hue. Mapping: bass → expansion, mid → rotation/deformation, high → fine detail,
beat → ≤6 % brightness swell, chords → colour. A reactivity slider scales everything; reduced-motion
mode removes pulses. No intentional strobing.

## 7. Preset customization

Presets live in `src/state/presets.ts`. Each specifies a route, visual parameters (mode, palette,
symmetry, depth, speed, …) and an audio preset id from `src/audio/presets.ts` with optional overrides.
The 18 built-ins: Amazonian Dream, Cosmic Kaleidoscope, Fractal Meditation, Golden Geometry, Living
Seljuk Carpet, Infinite Islamic Geometry, Alexander's Recursive Centers, Persian Garden, Sufi Geometric
Meditation, Harmonic Resonance, Deep Relaxation, Infinite Psychedelic Journey, Infinite Lotus, Tibetan
Cosmic Mandala, Sri Yantra, Psychedelic Mandala, Alexander's Living Mandala, Himalayan Meditation.
In the app: **Presets → Save** stores the full visual + audio state in `localStorage`; **Copy shareable
link** encodes it in the URL (`#/route?s=…`); `#/route?preset=<id>` opens a built-in preset.

## 7b. Source art & image credits

Several experiences use real historical artworks: the Kaleidoscope's **Sacred art** mode folds a chosen
artwork between the mirrors, and the Journey's **Sacred-art tunnel** world flies through one. Palettes
“Iznik Tile”, “Anatolian Carpet”, “Tibetan Thangka”, “Kashan Lustre” and “Shipibo-Konibo (palette only)”
were sampled from these images. Only **public-domain / CC0** images are embedded (The Met Open Access,
Rijksmuseum, Musée Albert-Kahn, CC0 photographs) — each licence verified through the Wikimedia Commons API.
Shipibo-Konibo textile photos appear only as reference images, never as distorted textures. Full list:
[CREDITS.md](CREDITS.md) and the Learn page → *Source art & image credits*.

## 8. Cultural and scientific references

All URLs were checked before publishing; see `src/content/references.ts` and the in-app Learn page.
Key sources: Christopher Alexander CES archive (https://christopher-alexander-ces-archive.org/) and the
*Foreshadowing* book page; Peru Ministry of Culture BDPI — Shipibo-Konibo
(https://bdpi.cultura.gob.pe/pueblos/shipibo-konibo); Kaivalyāśrama's Śrī Cakra construction
(https://ccat.sas.upenn.edu/george/yantra.html); PubMed records 31167611 (de Witte 2020), 24374731
(Bradt 2013, Cochrane), 23940541 (Thoma 2013), 30073406 (Garcia-Argibay 2019), 37205669 (Ingendoh 2023),
26029120 & 28555100 (Chaieb), 27694559 (Goldsby 2017), 31031095 (Calamassi 2019, 432 vs 440 Hz pilot).
**Evidence summary:** music listening shows modest average stress reduction; binaural-beat effects are
mixed; singing-bowl data are preliminary; 432 Hz and 528 Hz “healing frequency” claims lack robust support.
The site makes no medical claims.

**Cultural respect.** Kené is a living Shipibo-Konibo art form; our Amazonian patterns are original
and labelled “inspired by”. Mandala modes are modern interpretations, not ritual objects. Islamic and
carpet modes are generative interpretations, not copies of specific works.

Third-party licences: see `THIRD_PARTY_LICENSES.md`. Original code: MIT (`LICENSE`).

## 9. Deployment

GitHub Actions (`.github/workflows/deploy.yml`) builds on every push to `main` and publishes `dist/`
with `actions/deploy-pages`. Vite's `base` is `/psychedelic-visions/`; hash routing (`#/fractal`) makes
direct links work on static hosting, and `404.html` is a copy of `index.html` as a safety net.
To deploy a fork: push to `main`, then in *Settings → Pages* choose **GitHub Actions** as the source
(or `gh api -X POST repos/<owner>/psychedelic-visions/pages -f build_type=workflow`).

## 10. Future development roadmap

- Double-single (emulated 64-bit) or perturbation rendering for Mandelbrot zooms beyond 10⁵×
- Optional WebGPU path and Three.js / R3F 3-D scenes (sacred solids, fractal tunnels with depth)
- True girih tile sets with 10-fold symmetry and Penrose-like quasi-periodic tilings
- L-system botanical growth and Voronoi cell textures for Amazonian Visions
- More faithful arabesque (islimi) generators and carpet border vocabularies
- MIDI / microphone input as an alternative audio source; recording to video
- Automated visual regression tests (Playwright) in CI; PWA offline mode
