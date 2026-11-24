/**
 * CHUNK 6A: THE CUTSCENE DRIVER.
 *
 * Pure reducer — no canvas, no DOM, no run import. The shell (main.js) owns
 * an instance, ticks it from the frame loop, mirrors its minimal render
 * state onto `run.state.cutscene`, and applies the input lock. The art
 * lives in the engine (keyed off `s.cutscene.beatId`); this file owns time.
 *
 * A beat is: `{ id, ticks, lockInput?, chip?: { text, at } }`
 *
 * Guarantees under test:
 *  - beats advance on tick counts only; the last beat finishing calls
 *    `onDone` exactly once;
 *  - `skip()` is ignored until at least MIN_SKIP ticks have ELAPSED IN THE
 *    CUTSCENE (0.5s at 60 ticks/s — the reduced-motion clock still counts
 *    scaled ticks, so the gate stays honest);
 *  - `lockInput` is true only while a beat that declares it is live;
 *  - reducedMotion scales every beat's tick count ×0.6 (round, ≥1 tick);
 *  - chips are exposed, never fired implicitly — the shell decides when to
 *    reveal them (it owns the DOM);
 *  - the driver writes NO world state. Ever.
 */

export const CUTSCENE_TPS = 60;
export const MIN_SKIP_TICKS = 30; // 0.5s at 60 ticks/s
export const REDUCED_MOTION_SCALE = 0.6;

export function scaledTicks(ticks, reducedMotion) {
  const t = Math.max(1, Math.round(ticks));
  return reducedMotion ? Math.max(1, Math.round(t * REDUCED_MOTION_SCALE)) : t;
}

export function beatTotalTicks(beats, reducedMotion = false) {
  return beats.reduce((sum, b) => sum + scaledTicks(b.ticks, reducedMotion), 0);
}

/** One-shot gate for things that must fire exactly once per session. */
export function coldOpenOnce() {
  let shown = false;
  return {
    /** True exactly once per session, then never again. */
    should() {
      if (shown) return false;
      shown = true;
      return true;
    },
    /** True once the open has been offered (shown or skipped). */
    get shown() {
      return shown;
    },
  };
}

/**
 * createCutscene({
 *   beats,          // ordered array of beat descriptors (objects are frozen by the driver)
 *   onDone,         // () => void — called exactly once when the last beat completes or is skipped
 *   reducedMotion,  // boolean — scales beat ticks ×0.6
 *   onSkip,         // optional () => void — called instead of onDone when skip() lands before the end
 * })
 */
export function createCutscene({ beats, onDone = () => {}, reducedMotion = false, onSkip = null } = {}) {
  if (!Array.isArray(beats) || beats.length === 0)
    throw new RangeError('a cutscene needs at least one beat');
  for (const [i, b] of beats.entries()) {
    if (!b || typeof b.id !== 'string' || !b.id)
      throw new TypeError(`beat ${i} needs a non-empty string id`);
    if (!Number.isFinite(b.ticks) || b.ticks < 1)
      throw new RangeError(`beat ${b.id} needs ticks ≥ 1`);
  }

  // Freeze the descriptors so a caller cannot mutate a live cutscene.
  const table = beats.map((b) => Object.freeze({ ...b, ticks: scaledTicks(b.ticks, reducedMotion) }));
  const totalTicks = table.reduce((sum, b) => sum + b.ticks, 0);

  let beatIndex = 0;
  let beatElapsed = 0;
  let elapsedTotal = 0;
  let done = false;
  let skipped = false;

  const snapshot = () => {
    const beat = table[beatIndex];
    return {
      phase: done ? (skipped ? 'skipped' : 'done') : 'playing',
      playing: !done,
      finished: done && !skipped,
      skipped,
      beatIndex,
      beatId: beat.id,
      /** 0..1 progress through the current beat. */
      t: beat.ticks > 0 ? Math.min(1, beatElapsed / beat.ticks) : 1,
      /** Whole ticks left in the current beat. */
      ticksLeft: Math.max(0, beat.ticks - beatElapsed),
      /** Whole ticks elapsed across the whole cutscene. */
      elapsedTotal,
      /** Sum of scaled ticks across all beats. */
      totalTicks,
      /** True only while a beat that declares lockInput is live. */
      lockInput: !done && !!beat.lockInput,
      /** The chip descriptor for the live beat, or null. */
      chip: !done && beat.chip ? beat.chip : null,
      reducedMotion: !!reducedMotion,
    };
  };

  const finish = (wasSkipped) => {
    if (done) return;
    done = true;
    skipped = wasSkipped;
    if (wasSkipped && onSkip) onSkip();
    else onDone();
  };

  return {
    table,
    snapshot,
    /** Advance n ticks (usually 1). Returns the fresh snapshot. */
    tick(dt = 1) {
      if (done) return snapshot();
      let steps = Math.max(0, Math.round(dt));
      while (steps-- > 0 && !done) {
        elapsedTotal++;
        beatElapsed++;
        if (beatElapsed >= table[beatIndex].ticks) {
          beatIndex++;
          beatElapsed = 0;
          if (beatIndex >= table.length) {
            beatIndex = table.length - 1;
            finish(false);
            return snapshot();
          }
        }
      }
      return snapshot();
    },
    /** End the cutscene now. Ignored during the first MIN_SKIP_TICKS. */
    skip() {
      if (done) return snapshot();
      if (elapsedTotal < MIN_SKIP_TICKS) return snapshot();
      finish(true);
      return snapshot();
    },
    /** Is skip currently allowed? (Drives the shell's skip affordance.) */
    get skippable() {
      return !done && elapsedTotal >= MIN_SKIP_TICKS;
    },
  };
}
