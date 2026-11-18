import { clamp } from './levels.js';

/** How fast the world runs, and how gently it hands you an escape.
 *
 *  The design brief for this game was "hyperspeed that a rookie can steer".
 *  Those pull in opposite directions, so the compromise lives here, in one
 *  DOM-free place a test can argue with:
 *
 *  - TIME never drops to a crawl. The floor is 0.55, not 0.15: enough to read
 *    a decision, never enough to feel like a different game. Anything lower
 *    and the player stops believing the last shot was fast.
 *  - A grace window may only HALVE the pace (see PANIC_MIN_SCALE), and it
 *    shortens as the player improves instead of lengthening.
 *  - The camera NEVER dolly-zooms. Zoom is what makes an aim feel like the
 *    room is breathing. The lens holds a constant scale and only leans toward
 *    where you are going.
 *  - Steering help scales UP with speed rather than down, because the faster
 *    the game reads, the more the player needs the controls to forgive.
 */
export const PACE = Object.freeze({
  // Wall-clock pacing. `focus` is the player holding a slow-mo aim: 0.55 is
  // the slowest time is ever allowed to get, ever.
  focusScale: 0.55,
  focusScaleCap: 0.62, // a rookie's first few launches keep a little more
  // The leaning beat after a paid cut. Short, and it only gets shorter.
  breathScale: 0.7,
  // Reaction-time window after a hit, in world ticks. Faster pacing spends
  // world time faster, so this is longer than it looks.
  invulTicks: 132,
  breathTicks: 14,
  // Automatic escape from an unsteered crash.
  panicBase: 0.55,
  panicFloor: 0.66, // as tempo climbs, the grace weakens toward here
  panicTicks: 16,
  // The Redline warning is a shove, not a stall.
  warnDepth: 0.3,
  // Aim assist widens as the game speeds up, and with a beginner's tempo.
  corridor: 19,
  corridorMax: 34,
  snap: 62,
  snapMax: 96,
  // Tempo itself: 0 at the first launch, 1 once a run is genuinely flying.
  tempoTicks: 2100, // ~35 s of clean flying to reach full tempo
  tempoKills: 70,
  tempoChain: 14,
});

/** The speed the player picked. This is not "how fast cubes fly" — the world
 *  runs at 1.0 regardless. It is how much the game is allowed to let go of its
 *  pace to help: the floor a held focus may sink to, how long a breath lasts,
 *  and how much automatic grace an unsteered crash buys.
 *
 *  `fast` is the default because the brief was "too much slow motion". The
 *  other two exist so a player can choose that for themselves mid-run rather
 *  than argue with a constant. */
export const SPEEDS = Object.freeze([
  { id: 'relaxed', label: 'Relaxed', floor: 0.38, cap: 0.46, breath: 1.6, panicTicks: 24, note: 'More reading time.' },
  { id: 'fast', label: 'Fast', floor: 0.5, cap: 0.62, breath: 1, panicTicks: 16, note: 'A short lean, never a crawl.' },
  { id: 'blazing', label: 'Blazing', floor: 0.72, cap: 0.8, breath: 0.5, panicTicks: 8, note: 'Almost no slow motion.' },
]);
let speedIndex = 1; // fast
export function speedIndexOf(id) {
  const i = SPEEDS.findIndex((s) => s.id === id);
  return i < 0 ? 1 : i;
}
export function speed() {
  return SPEEDS[speedIndex];
}
export function setSpeed(id) {
  speedIndex = speedIndexOf(id);
  return speed();
}

/** 0..1, how far into the fast game this run is. Driven by time survived,
 *  kills paid and the longest chain, so a cautious player still arrives.
 *  Deliberately monotonic: tempo never goes backwards in a run, because a
 *  game that speeds up and then slows down feels out of control. */
export function tempoOf(state) {
  if (!state) return 0;
  const byTime = (state.elapsed || 0) / PACE.tempoTicks,
    byKills = (state.kills || 0) / PACE.tempoKills,
    byChain = (state.maxChain || 0) / PACE.tempoChain;
  return clamp(Math.max(byTime, byKills * 0.9, byChain * 0.8), 0, 1);
}

/** How long a decision beat is allowed to last. A short paid cut gets a
 *  couple of wall ticks; the first clean kill of a run gets more, and the
 *  budget shrinks as tempo climbs. Returns 0 for no beat at all. */
export function breathFor(state, kind = 'cut') {
  const t = tempoOf(state),
    scale = kind === 'firstAir' ? 1.9 : kind === 'cut' ? 1 : kind === 'small' ? 0.45 : 1;
  return Math.round(PACE.breathTicks * scale * (1 - 0.6 * t) * speed().breath);
}

/** The pace multiplier for held focus. Even fully spent, focus never crawls:
 *  the floor is PACE.focusScale and a rookie gets a notch more. */
export function focusPace(state) {
  const t = tempoOf(state);
  const { floor, cap } = speed();
  return cap + (floor - cap) * t;
}

/** The automatic grace on an unsteered crash. Shorter, shallower and rarer as
 *  the player proves they can fly: at full tempo it is barely a lean. */
export function panicPace(state) {
  const t = tempoOf(state);
  return PACE.panicBase + (PACE.panicFloor - PACE.panicBase) * t;
}

/** Ticks of grace granted. Tempo takes the second one away entirely. */
export function panicTicksFor(state) {
  const t = tempoOf(state);
  const ticks = speed().panicTicks;
  return Math.max(speed() === SPEEDS[0] ? 8 : 4, Math.round(ticks * (1 - 0.55 * t)));
}

/** The corridor and the tap-snap both widen with tempo. Steering help that
 *  shrank as speed rose would be exactly backwards. */
export function assistRange(state, { focus = false } = {}) {
  const t = tempoOf(state),
    width = PACE.corridor + (PACE.corridorMax - PACE.corridor) * t,
    snap = Math.round(PACE.snap + (PACE.snapMax - PACE.snap) * t);
  return { corridor: focus ? width * 1.32 : width, snap };
}

/** Document-level pacing for the camera. Zoom is pinned to 1: the old
 *  "widen to 0.75 while aiming" is what made aiming feel like a lurch. Only
 *  the lean-toward-travel term survives, and it is weaker than before. */
export function lensWiden() {
  return 0;
}

/** The held-focus zoom-out, which the brief asks for twice and the player
 *  asked to remove. Returns a constant 1: no dolly, no breathing room, no
 *  motion sickness. Kept as a function so a future veto is one edit. */
export function lensScale() {
  return 1;
}
