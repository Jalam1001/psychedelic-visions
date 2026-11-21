import { Experience } from '../ui/Experience';
import { ShaderView } from '../views/ShaderView';
import { AMAZONIAN_FRAG } from '../shaders/amazonian';

const MODES = [{ id: 'kene', label: 'Kené-inspired lattice' }, { id: 'vines', label: 'Vine mandala' }, { id: 'forest', label: 'Visionary forest' }, { id: 'river', label: 'Serpent river' }];

export default function Amazonian() {
  return (
    <Experience id="amazonian" route="/amazonian" title="Amazonian Visions" subtitle="Original patterns inspired by Peruvian Amazonian visual culture"
      modes={MODES} defaultPreset="amazonian-dream"
      about={<>
        <h2>Inspired by — not reproducing</h2>
        <p>Shipibo-Konibo <em>kené</em> is a living Indigenous design system from the Peruvian Amazon (Ucayali), recognised by Peru's Ministry of Culture as Cultural Heritage of the Nation. Real kené designs are made by Shipibo-Konibo artists — mostly women — and carry meanings this website does not claim to know or represent.</p>
        <p>The patterns here are <strong>original procedural interpretations</strong> of general visual principles: a diagonal lattice, thick primary lines with thin parallel infill lines, stepped diamonds and crosses, continuous meandering paths, combined with vines, leaves and luminous colour associated with contemporary visionary art. They are not authentic kené and should not be presented as such.</p>
        <p>New generations of the pattern emerge from the centre in soft noisy waves so structures transition gradually rather than cutting.</p>
      </>}>
      {(mode) => <ShaderView frag={AMAZONIAN_FRAG} modeIndex={MODES.findIndex((m) => m.id === mode)} />}
    </Experience>
  );
}
