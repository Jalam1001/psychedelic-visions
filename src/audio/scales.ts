/** Scales expressed as semitone offsets from the root. Raga/maqam names are loose, equal-tempered approximations. */
export const SCALES: Record<string, { name: string; steps: number[] }> = {
  majorPent: { name: 'Major pentatonic (≈ Bhupali)', steps: [0, 2, 4, 7, 9] },
  minorPent: { name: 'Minor pentatonic', steps: [0, 3, 5, 7, 10] },
  dorian: { name: 'Dorian', steps: [0, 2, 3, 5, 7, 9, 10] },
  lydian: { name: 'Lydian (≈ Yaman)', steps: [0, 2, 4, 6, 7, 9, 11] },
  phrygian: { name: 'Phrygian', steps: [0, 1, 3, 5, 7, 8, 10] },
  hijaz: { name: 'Hijaz-like (Phrygian dominant)', steps: [0, 1, 4, 5, 7, 8, 10] },
  bhairav: { name: 'Bhairav-like', steps: [0, 1, 4, 5, 7, 8, 11] },
  harmonicMinor: { name: 'Harmonic minor', steps: [0, 2, 3, 5, 7, 8, 11] },
  wholeTone: { name: 'Whole tone', steps: [0, 2, 4, 6, 8, 10] },
  inSen: { name: 'In-sen (Japanese)', steps: [0, 1, 5, 7, 10] },
};

export function degreeToFreq(root: number, steps: number[], degree: number): number {
  const n = steps.length;
  const oct = Math.floor(degree / n);
  const idx = ((degree % n) + n) % n;
  return root * Math.pow(2, oct + steps[idx] / 12);
}
