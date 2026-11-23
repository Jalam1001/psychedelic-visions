import { artWithTag } from '../ui/SourceArt';
import { Experience } from '../ui/Experience';
import { ShaderView } from '../views/ShaderView';
import { CanvasView, DrawFn } from '../views/CanvasView';
import { AMAZONIAN_FRAG } from '../shaders/amazonian';
import { drawKeneEmbroidery, drawKeneMaya, drawKenePainted, drawVisions } from '../geometry/amazon';

const MODES = [
  { id: 'kene', label: 'Kené labyrinth (painted cloth)' },
  { id: 'embroidery', label: 'Kené embroidery' },
  { id: 'maya', label: 'Maya kené (curved)' },
  { id: 'visions', label: 'Visionary serpents' },
  { id: 'forest', label: 'Luminous forest (shader)' },
];
const DRAW: Record<string, DrawFn> = { kene: drawKenePainted, embroidery: drawKeneEmbroidery, maya: drawKeneMaya, visions: drawVisions };

export default function Amazonian() {
  return (
    <Experience artKeys={[...artWithTag('amazon', 'amazonian')]} id="amazonian" route="/amazonian" title="Amazonian Visions" subtitle="Patterns inspired by Shipibo-Konibo kené and Peruvian Amazonian visionary painting"
      modes={MODES} defaultPreset="amazonian-dream"
      about={<>
        <h2>Inspired by — not reproducing</h2>
        <p>Shipibo-Konibo <em>kené</em> is a living Indigenous design system from the Peruvian Amazon (Ucayali), declared Cultural Heritage of the Nation by Peru's Ministry of Culture in 2008. Real kené is made by Shipibo-Konibo artists — mostly women — and carries meanings this website does not claim to know or represent.</p>
        <p><strong>Kené labyrinth, embroidery and maya modes</strong> are original procedural patterns built from published descriptions of kené's design logic: bold primary “paths” (<em>xao / cánoa kené</em>: straight, stepped lines) organised around focal crosses (<em>kurús</em>) with mirror symmetry, the spaces filled with fine meandering secondary lines, and <em>maya kené</em>'s curved, circular line-work. Lines “draw themselves in” from the centre, and a soft light travels along them with the music — a nod to the association between kené and sung <em>íkaros</em>, which anthropologists describe as poetic and therapeutic rather than a code. Cloth and ceramic colours were sampled from CC0 photographs of Shipibo textiles and pottery.</p>
        <p><strong>Visionary serpents</strong> is inspired by the visionary paintings of Pablo Amaringo and the Usko-Ayar school: luminous serpents (Sachamama, Yakumama, Huairamama), radiating rings of coloured light (“tingunas”), spirit lights and a jungle canopy. No artwork is copied or traced; to see the real art, follow the links on the <a href="#/learn">Learn page</a>.</p>
      </>}>
      {(mode) => mode === 'forest'
        ? <ShaderView frag={AMAZONIAN_FRAG} modeIndex={2} texture="heliconia" backdrop={0.5} />
        : <CanvasView draw={DRAW[mode] ?? drawKenePainted} />}
    </Experience>
  );
}
