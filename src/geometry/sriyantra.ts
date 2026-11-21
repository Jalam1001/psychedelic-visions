/**
 * Sri Yantra — inward (samhāra-krama) construction attributed to Kaivalyāśrama's commentary
 * (Saubhāgyavardhanī) on the Saundaryalaharī, as documented at
 *   https://ccat.sas.upenn.edu/george/yantra.html
 * 1. Vertical diameter of a circle divided into 48 equal units.
 * 2. Nine horizontal chords at 6, 12, 17, 20, 23, 27, 30, 36, 42 units from the top.
 * 3. Shorten chords 1, 2, 4, 5, 6, 8, 9 at both ends by 3, 5, 16, 18, 16, 4, 3 units.
 * 4. Join the chord ends to points on the axis:
 *    1→mid of 6, 2→mid of 9, 3→bottom of circle, 4→mid of 8, 5→mid of 7   (5 downward "Śakti" triangles)
 *    6→mid of 2, 7→top of circle, 8→mid of 1, 9→mid of 3                 (4 upward "Śiva" triangles)
 * This classical recipe is known to leave small errors at some triple intersections (marmas);
 * we draw it faithfully rather than "correcting" it.
 */
export const SY_LINES = [6, 12, 17, 20, 23, 27, 30, 36, 42];
const RUB = [3, 5, 0, 16, 18, 16, 0, 4, 3];
// apex for each chord: index of target chord (0-based) or 'top'/'bottom'
const APEX: (number | 'top' | 'bottom')[] = [5, 8, 'bottom', 7, 6, 1, 'top', 0, 2];

export interface SYTriangle { base: number; y: number; half: number; apexY: number; down: boolean }

/** Geometry in "units" with the circle centre at (0,0), radius 24, y pointing down. */
export function sriYantraTriangles(): SYTriangle[] {
  return SY_LINES.map((d, i) => {
    const y = d - 24;
    const full = Math.sqrt(24 * 24 - y * y);
    const half = full - RUB[i];
    const a = APEX[i];
    const apexY = a === 'top' ? -24 : a === 'bottom' ? 24 : SY_LINES[a] - 24;
    return { base: i, y, half, apexY, down: apexY > y };
  });
}

export function chordHalf(i: number) { const y = SY_LINES[i] - 24; return Math.sqrt(24 * 24 - y * y); }
export const SY_RUB = RUB;
/** Bindu: placed at the centroid of the innermost (5th) downward triangle, y = (23+23+30)/3 units. */
export const SY_BINDU_UNITS = (23 + 23 + 30) / 3;
