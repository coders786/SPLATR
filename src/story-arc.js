/**
 * THE WATCHER / THE CUTTER — a short story told one room at a time.
 *
 * The Watcher and the Cutter were friends before the tear. When the landlord
 * came to claim their world, the Watcher sealed the Monolith inside and stayed
 * behind. The Cutter returns: fear watches, rage burns, and ambition climbs.
 * The last cut is for the friend still waiting inside. Bring them home.
 *
 * The prose is authored here so the arc stays coherent, but play only exposes
 * a short chip and the matching world image. No wave opens a briefing panel.
 */
export const SHORT_STORY =
  'The Watcher and the Cutter were friends before the tear. When the landlord came to claim their world, the Watcher sealed the Monolith inside and stayed behind. The Cutter returns. Fear watches. Rage burns. Ambition climbs. At the last seal, love—not a crown—guides the blade. Break the landlord. Bring your friend home.';

/** The final confrontation is kept here so the visual and state layers use the
 * same emotional turn instead of inventing a separate boss epilogue. */
export const LANDLORD_STORY = Object.freeze({
  sector: 0,
  id: 'landlord',
  title: 'THE LANDLORD',
  chip: 'THE LANDLORD WAKES.',
  finishChip: 'BRING THEM HOME.',
  line: 'The landlord wants ownership. The bond wants a door.',
  emotion: 'resolve',
});

/**
 * The one mid-wave story set piece. It is deliberately authored around the
 * first real Pulse rather than selected from a catalogue of cinematic verbs:
 * the Watcher holds the expanding wave long enough for the Cutter to learn
 * that the rim is the danger and the space behind it is safe.
 */
export const MID_WAVE_STORY = Object.freeze({
  id: 'hold-the-wave',
  chip: 'LET IT PASS.',
  mechanic: 'pulse',
  lesson: 'Dodge the expanding rim; the space behind it is safe.',
  consequence: 'The Watcher holds the wave so the Cutter can pass.',
  chapter: 'seal',
  emotion: 'friendship',
  wave: 1,
});

export const WAVE_STORY = Object.freeze([
  Object.freeze({
    sector: 1,
    id: 'seal',
    title: 'THE VOW',
    chip: 'WE CUT TOGETHER.',
    line: 'The Watcher stayed behind; an old promise brings the Cutter back.',
    emotion: 'friendship',
    mid: MID_WAVE_STORY,
  }),
  Object.freeze({
    sector: 2,
    id: 'eye',
    title: 'THE FEAR',
    chip: 'FEAR LOOKS BACK.',
    line: 'The Watcher sees the danger—and the friend the Cutter might lose.',
    emotion: 'fear',
  }),
  Object.freeze({
    sector: 3,
    id: 'conduits',
    title: 'THE RAGE',
    chip: 'LET RAGE BURN.',
    line: 'The landlord feeds on anger. Give the fire a direction.',
    emotion: 'rage',
  }),
  Object.freeze({
    sector: 4,
    id: 'seam',
    title: 'THE AMBITION',
    chip: 'CLIMB FOR MORE.',
    line: 'The seam offers a crown. Power is not the same as freedom.',
    emotion: 'ambition',
  }),
  Object.freeze({
    sector: 5,
    id: 'last-seal',
    title: 'THE LAST VOW',
    chip: 'BRING THEM HOME.',
    line: 'The final seal holds the one the Cutter came back for.',
    emotion: 'love',
  }),
]);

export function storyForWave(number = 1) {
  const n = Math.max(1, Math.floor(Number(number) || 1));
  return WAVE_STORY[Math.min(WAVE_STORY.length, n) - 1];
}

export function storyChipForWave(number = 1) {
  return storyForWave(number).chip;
}

/**
 * The first formation owns the only mid-wave story event. Returning null for
 * every later wave makes the one-time contract explicit instead of relying on
 * a caller remembering not to replay a generic lesson selector.
 */
export function storyMomentForWave(number = 1, brief = {}) {
  const n = Math.max(1, Math.floor(Number(number) || 1));
  if (n !== MID_WAVE_STORY.wave || (brief?.counts?.pulse || 0) < 1) return null;
  return MID_WAVE_STORY;
}
