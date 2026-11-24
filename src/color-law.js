/**
 * CHUNK 2 — THE THREE-COLOUR LAW.
 *
 * The report's second complaint, in the player's words: "I cannot tell what is
 * dangerous and what is a target. Everything is pink." That is literally true
 * of the old field — the enemy palette was eight warm hues between rose and
 * amber, the hazard marks were the same hues at a different opacity, the
 * reward shapes were the same hues again, and the one acid green in the game
 * was used for decoration (background seams, the pad, the reticle).
 *
 * So the law this file encodes is deliberately narrow, and deliberately
 * exclusive:
 *
 *   GREEN  = you may cut this, with the blade you are holding RIGHT NOW.
 *   RED    = this will hurt you. Wind-ups, live hazards, landed hits.
 *   GOLD   = this pays you. Health, credits, a wave reward.
 *
 * Nothing else is allowed to speak in those three voices. In particular an
 * enemy BODY may never be green: green means "safe to touch", and no enemy is
 * safe to touch. `ENEMY_HUES` below is the frozen enemy palette, and the test
 * suite re-reads the art engine's own literals against it, so a future colour
 * tweak cannot quietly hand the safe signal to a body.
 *
 * Pure: no canvas, no DOM, no clock. Geometry lives in `slice-safe.js`; this
 * file only answers "what does this colour mean?".
 */

/** The only three marks the game may use to speak about the field. */
export const LAW = Object.freeze({
  /** Safe to cut. Aligned with the acid green the game already uses. */
  safe: '#ddff89',
  /** Lethal. The rose the hit line and the damage rim already use. */
  lethal: '#ff2b4a',
  /** Reward. Warm gold, the colour of the pad's "LAND / UPGRADE" rule. */
  reward: '#ffd166',
});

/** Secondary inks for the same three voices, when a mark needs a core/halo
 *  pair (the halo's inner pip, the rim's inner wash). Never a fourth voice. */
export const LAW_INK = Object.freeze({
  safe: Object.freeze({ core: '#f4ffd0', edge: '#9dc94a' }),
  lethal: Object.freeze({ core: '#ffd0d8', edge: '#7d0018' }),
  reward: Object.freeze({ core: '#fff1c4', edge: '#b47b18' }),
});

/** The pips inside a mark, in the STRONG voice of the role. `LAW_INK.*.core`
 *  is a pale highlight (a stroke on a dark field), which is deliberately too
 *  desaturated to be read as a colour signal on its own — so the fill that
 *  carries meaning does not use it. */
export const LAW_PIP = Object.freeze({ safe: '#ddff89', lethal: '#ff2b4a', reward: '#ffd166' });

/**
 * The enemy body palette, frozen here as the reference the law is checked
 * against. These are the values the art engine paints (`COLORS` and the
 * `TYPES` species colours); `test/chunk2-slice.test.js` reads the engine's own
 * literals and fails if the two ever disagree. Duplicated deliberately: the
 * art engine has no imports by contract, so the copy lives here and the test
 * is the lock.
 *
 *  Note what is NOT here: gold. The Bastion's body used to be #ffba52,
 *  which sits at hue 39 -- inside the reward band, in a species that pays
 *  nothing. Under the three-colour law that is a lie, so the body moved to
 *  a hot rust (#ff6b3d, 15) and gold is left to the Crown, the pad and the
 *  drops: the only things in the game that actually pay.
 */
export const ENEMY_HUES = Object.freeze({
  fang: '#ff507b',
  pulse: '#e178ed',
  prism: '#b28cff',
  fork: '#ffa54d',
  bastion: '#ff6b3d',
  crown: '#ffd166',
  rift: '#ff4277',
  well: '#928bff',
  monolith: '#ff8f4d',
});

/** Enemy bodies that pay the player back when they break. Gold is theirs. */
export const REWARD_KINDS = Object.freeze(['crown']);

/** Hue bands (degrees, 0 = red, 120 = green, 240 = blue). */
export const BAND = Object.freeze({
  lethal: Object.freeze({ from: -22, to: 22 }),
  reward: Object.freeze({ from: 30, to: 58 }),
  safe: Object.freeze({ from: 62, to: 105 }),
});

/** Minimum saturation before a colour is allowed to speak. A grey does not
 *  get to mean "safe" or "lethal"; it is scenery. */
export const MIN_CHROMA = 0.28;

/**
 * `#rrggbb` → `{r,g,b}` in 0..255. Tolerates the `#rgb` shorthand and a
 * missing hash; returns null for anything else so a caller can decide.
 */
export function rgbOf(hex) {
  if (typeof hex !== 'string') return null;
  let s = hex.trim().replace(/^#/, '');
  if (s.length === 3) s = s[0] + s[0] + s[1] + s[1] + s[2] + s[2];
  if (!/^[0-9a-f]{6}$/i.test(s)) return null;
  const n = parseInt(s, 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

/** Hue in degrees (0..360), or null. */
export function hueOf(hex) {
  const c = rgbOf(hex);
  if (!c) return null;
  const r = c.r / 255, g = c.g / 255, b = c.b / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min;
  if (d < 1e-6) return 0;
  let h;
  if (max === r) h = ((g - b) / d) % 6;
  else if (max === g) h = (b - r) / d + 2;
  else h = (r - g) / d + 4;
  h *= 60;
  return (h + 360) % 360;
}

/** Chroma (HSV saturation) in 0..1, or 0. */
export function chromaOf(hex) {
  const c = rgbOf(hex);
  if (!c) return 0;
  const max = Math.max(c.r, c.g, c.b), min = Math.min(c.r, c.g, c.b);
  return max === 0 ? 0 : (max - min) / max;
}

function inBand(hue, band) {
  const h = ((hue % 360) + 360) % 360;
  const from = ((band.from % 360) + 360) % 360, to = ((band.to % 360) + 360) % 360;
  return from <= to ? h >= from && h <= to : h >= from || h <= to;
}

/**
 * Which of the three voices a colour speaks in — or `'other'` for scenery.
 * This is the law as a function, and it is what the tests hold the art to.
 *
 * @param {string} hex
 * @returns {'safe'|'lethal'|'reward'|'other'}
 */
export function lawOf(hex) {
  const hue = hueOf(hex);
  if (hue === null) return 'other';
  const chroma = chromaOf(hex);
  if (chroma < MIN_CHROMA) return 'other';
  // Lethal is tested first: the red band straddles 0°, so a rose at 350° must
  // never be mistaken for the start of the gold band.
  if (inBand(hue, BAND.lethal)) return 'lethal';
  if (inBand(hue, BAND.safe)) return 'safe';
  if (inBand(hue, BAND.reward)) return 'reward';
  return 'other';
}

/** True when a colour reads as the safe signal. Used to prove the enemy
 *  palette never borrows it. */
export function readsGreen(hex) {
  return lawOf(hex) === 'safe';
}

/** The mark colour for a thing, by what the thing does to you. */
export function markFor(role) {
  return LAW[role] || LAW.lethal;
}

/** Is this body kind one that pays the player? */
export function isRewardKind(kind) {
  return REWARD_KINDS.includes(kind);
}

/**
 * The law as the player is told it, in the fewest words that still teach it.
 * Shown once, on the bottom-edge ticker, and never again (see `lawHint`).
 */
export const LAW_HINT = 'GREEN CUTS · RED HURTS · GOLD PAYS';
export const LAW_HINT_TICKS = 420;

/** The legend retires after the first few cuts, not on a timer alone: a player
 *  who has cut three things has been taught. */
export function lawHintVisible(cuts = 0, ticksSinceStart = 0) {
  return (Number(cuts) || 0) < 3 && (Number(ticksSinceStart) || 0) < LAW_HINT_TICKS;
}
