/**
 * THE WATCHER / THE CUTTER — a short story told one room at a time.
 *
 * The prose is authored here so the arc stays coherent, but play only exposes
 * the short chip and the matching world image. No wave opens a briefing panel.
 */
export const SHORT_STORY =
  'The Watcher seals the dimension. The Cutter breaks the anchors, but each broken lock wakes the thing beneath the seam. When the last seal gives, the Monolith rises. Break the landlord and the world opens.';

export const WAVE_STORY = Object.freeze([
  Object.freeze({
    sector: 1,
    id: 'seal',
    title: 'THE SEAL',
    chip: 'THE WATCHER SEALS.',
    line: 'Three anchors hold the wound shut.',
  }),
  Object.freeze({
    sector: 2,
    id: 'eye',
    title: 'THE EYE',
    chip: 'IT SEES YOU.',
    line: 'The cut wakes the Watcher and its eye turns toward the Cutter.',
  }),
  Object.freeze({
    sector: 3,
    id: 'conduits',
    title: 'THE CONDUITS',
    chip: 'CUT THE LINES.',
    line: 'The conduits feed the seal; break them and the wound can breathe.',
  }),
  Object.freeze({
    sector: 4,
    id: 'seam',
    title: 'THE SEAM',
    chip: 'SOMETHING RISES.',
    line: 'The seam opens upward. Something heavy waits on the other side.',
  }),
  Object.freeze({
    sector: 5,
    id: 'last-seal',
    title: 'THE LAST SEAL',
    chip: 'BREAK THE LAST SEAL.',
    line: 'One final lock keeps the torn dimension from becoming a door.',
  }),
]);

export function storyForWave(number = 1) {
  const n = Math.max(1, Math.floor(Number(number) || 1));
  return WAVE_STORY[Math.min(WAVE_STORY.length, n) - 1];
}

export function storyChipForWave(number = 1) {
  return storyForWave(number).chip;
}
