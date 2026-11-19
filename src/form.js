/** Reading a run's FORM.
 *
 *  The mastery thesis, in one line: a master converts one contact into many
 *  kills under tempo and is never touched. This module measures that, and turns
 *  the measurement into a name.
 *
 *  WHY THIS EXISTS
 *  Every signal below was already being tracked and every one of them was
 *  collapsed into `score`. Two runs with the same score could be entirely
 *  different games -- one a precision weave, one a rail rally -- and the game
 *  could not tell them apart, because there was exactly one ruler and it only
 *  measured output. That is the mechanical reason mastery felt generic.
 *
 *  Four axes, all derived from things the run already counts:
 *
 *    weave  throughcuts per dash   you cut LINES through the field
 *    bank   banks per dash         you use the table as a weapon
 *    tempo  kills per second       you never stop
 *    yield  kills per dash         every launch pays
 *
 *  The dominant axis is the form; its magnitude is the grade. This is a READ,
 *  not a reward: nothing here changes what the player can do. Per the design
 *  decision, mastery buys feedback, not power.
 *
 *  PURE. No DOM, no engine, no imports from run.js. Takes a plain object of
 *  numbers and returns a plain object. That makes it safe to call every frame
 *  for the live HUD readout and trivial to unit test.
 */

/** Thresholds at which each axis reaches "grade I" (the 1.0 line).
 *
 *  SET BY RANK, NOT BY FEEL.
 *  The first pass used invented numbers (weave 0.045, bank 2.2) and the
 *  separation gate failed: 17 of 20 runs read TEMPO. The reason was that the
 *  four thresholds sat at wildly different percentiles of their own axes --
 *  weave's was near its p75, so it almost never cleared; bank's was above its
 *  maximum, so it could never clear.
 *
 *  These values are each the p60 of that axis's measured distribution across 36
 *  runs (6 playstyles x 6 seeds). Setting them at the SAME RANK is what makes
 *  the axes comparable: each one has a fair chance to lead, so which axis wins
 *  is a fact about the run rather than an artefact of how the constants were
 *  chosen.
 *
 *    axis    p50     p60 (= threshold)   p90
 *    weave   0.011   0.016               0.104
 *    bank    0.600   0.900               2.716
 *    tempo   1.600   2.200               3.000
 *    yield   0.660   0.710               1.030
 *
 *  If the distributions shift (a balance change, a new mechanic) these should be
 *  re-derived the same way. They are measurements, not preferences.
 */
export const FORM_THRESHOLDS = Object.freeze({
  weave: 0.016,
  bank: 0.9,
  tempo: 2.2,
  yield: 0.71,
});

/** Grade boundaries, as a multiple of the axis threshold.
 *
 *  A run at 1.0x threshold is grade I, 1.7x is II, 2.8x is III. Graded rather
 *  than pass/fail because "everybody gets a name, strength varies" was the
 *  decision: a weak Weaver is still a Weaver.
 *
 *  These lines are set from the measured distribution of the LEADING axis
 *  across 24 runs (6 playstyles x 4 seeds): p25 1.38, p50 2.38, p75 4.00. The
 *  first pass used 1.8/3.0 with a hard cap of 4.0, and a third of all runs
 *  pinned to the cap -- which made grade III mean nothing because so much of
 *  the field reached it. Lines at 1.7 and 2.8 put III at roughly the p70, so it
 *  is uncommon without being rare.
 */
export const GRADE_AT = Object.freeze([1.0, 1.7, 2.8]);

/** How much evidence an axis needs before its ratio is trusted at all.
 *
 *  A RATIO IS NOT A MEASUREMENT when its denominator is tiny. Two kills off one
 *  dash is a yield of 2.0; that is not a masterful conversion rate, it is two
 *  events. Gating on a minimum sample is what stops the live readout from
 *  announcing a form the player has not actually played.
 */
export const MIN_SAMPLE = Object.freeze({ dashes: 3, seconds: 6 });

export const FORMS = Object.freeze({
  weave: 'WEAVER',
  bank: 'BANKER',
  tempo: 'EDGE',
  yield: 'BUTCHER',
  ghost: 'GHOST',
  unformed: 'UNFORMED',
});

/** Guarded division. A run with no dashes, or a tick-zero elapsed, must not
 *  produce NaN -- NaN would silently win every comparison and poison the form. */
const ratio = (a, b) => (b > 0 ? a / b : 0);

/** Normalise one axis against its threshold, capped so one absurd run cannot
 *  dominate: a 40x outlier and a 4x run should both read "grade III". */
function axis(value, threshold) {
  if (!Number.isFinite(value) || value <= 0) return 0;
  // Cap raised from 4 to 6. At 4, a third of all measured runs clamped and the
  // top grade stopped discriminating; the clamp should be a guard against an
  // absurd outlier, not the thing that decides who gets a III.
  return Math.min(6, value / threshold);
}

/** Grade 0-3 from a normalised axis value. */
export function gradeOf(normalised) {
  if (!Number.isFinite(normalised)) return 0;
  let g = 0;
  for (let i = 0; i < GRADE_AT.length; i++) if (normalised >= GRADE_AT[i]) g = i + 1;
  return g;
}

/**
 * Read a run's form.
 *
 * Accepts the live `run.state` shape directly, and also works on a partial
 * object so the live HUD can call it mid-run before every field exists.
 *
 * @param {{throughcuts?:number, banks?:number, kills?:number, shots?:number,
 *          dashes?:number, elapsed?:number, hp?:number}} input
 * @returns {{form:string, key:string, grade:number, axes:object, lead:string|null}}
 */
export function readForm(input = {}) {
  const kills = input.kills | 0,
    dashes = Math.max(input.dashes | 0, input.shots | 0),
    // `elapsed` IS A TICK COUNT, not milliseconds.
    //
    // run.js does `s.elapsed++` once per tick, so a 1800-tick run reports 1800.
    // Dividing by 1000 the way one would for a millisecond clock reported 1.8
    // seconds for a run that lasted thirty, inflating tempo by roughly 30x --
    // which made GHOST's tempo gate fire on every single run, and the first
    // separation trial read GHOST for all 20 seeds. The unit is named in the
    // parameter and converted once, here, so no caller can get it wrong.
    seconds = ratio(input.elapsedTicks ?? input.elapsed ?? 0, 60);

  const axes = {
    weave: axis(ratio(input.throughcuts | 0, dashes), FORM_THRESHOLDS.weave),
    bank: axis(ratio(input.banks | 0, dashes), FORM_THRESHOLDS.bank),
    tempo: axis(ratio(kills, seconds), FORM_THRESHOLDS.tempo),
    yield: axis(ratio(kills, dashes), FORM_THRESHOLDS.yield),
  };

  // ── SAMPLE GATE ─────────────────────────────────────────────────────────
  //
  // A form must be DEMONSTRATED, not inferred from three lucky kills.
  //
  // Without this, a run that lands two kills off its first dash reports yield
  // 2.0 -- three times the threshold -- and stamps itself GHOST grade III two
  // seconds into a run. Small denominators make ratios look like mastery, and
  // the live readout then announces a legend that has not happened yet.
  //
  // Every axis needs enough actual events behind it to mean anything. The
  // thresholds are deliberately low (a real run clears them in the first few
  // seconds) -- this is a noise guard, not a difficulty gate.
  const readings = {
    dash: dashes >= MIN_SAMPLE.dashes,
    time: seconds >= MIN_SAMPLE.seconds,
  };

  // Which axis leads. Ties go to the earlier key in this list, which is a
  // stable order rather than an accident of object iteration.
  const order = ['weave', 'bank', 'tempo', 'yield'];
  let lead = null,
    best = 0;
  for (const k of order)
    if (axes[k] > best) {
      best = axes[k];
      lead = k;
    }

  // GHOST is the only form that is not simply "the leading axis". It is the
  // untouchable read: you converted hard AND you were never hit. It must be
  // earned explicitly, or every good run would be a GHOST and the name would
  // stop meaning anything.
  //
  // It additionally requires both a sample of dashes and some elapsed time --
  // "untouched" is trivially true in the first second of a run, and trivially
  // true of a run that did nothing at all.
  const untouched = (input.hp ?? 3) >= 3,
    ghost =
      untouched &&
      readings.dash &&
      readings.time &&
      (axes.yield >= GRADE_AT[1] || axes.tempo >= GRADE_AT[1]);
  if (ghost && best >= GRADE_AT[0]) {
    return { form: FORMS.ghost, key: 'ghost', grade: gradeOf(best), axes, lead };
  }

  // Nothing cleared grade I, or there is not yet enough evidence to say: the
  // run happened but has no shape YET. Unformed is not a failure -- it is what
  // every run is before it commits to something.
  if (!lead || best < GRADE_AT[0] || !readings.dash || !readings.time) {
    return { form: FORMS.unformed, key: 'unformed', grade: 0, axes, lead };
  }

  return { form: FORMS[lead], key: lead, grade: gradeOf(best), axes, lead };
}

/** Roman numeral for a grade, for the debrief stamp. */
export const GRADE_MARK = Object.freeze(['', 'I', 'II', 'III']);

/** One-line human summary, used by the live HUD ("WEAVING") and the debrief
 *  ("WEAVER II"). Present continuous while a run is live, the noun once it is
 *  over -- the tense is doing real work: a forming identity is not yet a fact. */
const VERB = Object.freeze({
  weave: 'WEAVING',
  bank: 'BANKING',
  tempo: 'REDLINING',
  yield: 'BUTCHERING',
  ghost: 'UNTOUCHED',
  unformed: '',
});

export function formLabel(read, { live = false } = {}) {
  if (!read || read.key === 'unformed') return '';
  if (live) return VERB[read.key] || read.form;
  return `${read.form} ${GRADE_MARK[read.grade] || ''}`.trim();
}

/** ── HOW CLOSE WAS THE NEXT RANK? ───────────────────────────────────────────
 *
 *  A debrief that says "WEAVER II" and nothing else is a verdict. The player
 *  has no idea whether they were one throughcut away from III or nowhere near
 *  it, and the difference between those two is the difference between "run it
 *  back" and "close the tab".
 *
 *  So this answers the only question worth answering: given the axes this run
 *  actually earned, what is the CHEAPEST remaining step to the next grade, and
 *  how much of it is missing? "Cheapest" is measured in the axis's own units,
 *  then normalised, because a bank is not comparable to a kill until both are
 *  expressed as a fraction of their thresholds.
 *
 *  Returns null when there is nothing to nudge: unformed runs (no identity to
 *  promote), failed sample gates (the answer would be noise), and the top
 *  grade (there is no next).
 *
 *  Pure, like everything else in this module -- it reads a `readForm` result
 *  and returns a sentence's worth of numbers.
 *
 *  @param {object} read  the object `readForm` returned
 *  @param {object} input the same input `readForm` was given, for the counts
 *  @returns {{axis:string, to:number, need:string, gap:number, progress:number}|null}
 */
export function nextRank(read, input = {}) {
  if (!read || !read.lead || read.key === 'unformed') return null;
  const grade = read.grade | 0;
  if (grade >= GRADE_AT.length) return null; // already III
  const target = GRADE_AT[grade]; // the line this run is short of
  const dashes = Math.max(input.dashes | 0, input.shots | 0),
    seconds = ratio(input.elapsedTicks ?? input.elapsed ?? 0, 60);
  // The counts behind each axis, so the gap can be spoken in real units.
  const have = {
      weave: dashes ? ratio(input.throughcuts | 0, dashes) : 0,
      bank: dashes ? ratio(input.banks | 0, dashes) : 0,
      tempo: seconds ? ratio(input.kills | 0, seconds) : 0,
      yield: dashes ? ratio(input.kills | 0, dashes) : 0,
    },
    // One more of the thing, in this axis's units.
    oneMore = {
      weave: dashes ? 1 / dashes : 1,
      bank: dashes ? 1 / dashes : 1,
      // Tempo is per second and cannot be re-run, so its nearest step is not
      // "one more kill" but "the same kills, sooner" -- expressed as the
      // fraction a single kill adds.
      tempo: seconds ? 1 / seconds : 1,
      yield: dashes ? 1 / dashes : 1,
    };
  let best = null;
  for (const k of ['weave', 'bank', 'tempo', 'yield']) {
    const gap = target - have[k];
    if (gap <= 0) continue; // this axis already clears the line
    const steps = Math.max(1, Math.ceil(gap / Math.max(1e-9, oneMore[k])));
    if (!best || steps < best.steps || (steps === best.steps && gap < best.gap))
      best = { axis: k, steps, gap };
  }
  if (!best) return null;
  // Progress toward the line, 0..1, from the axis that is closest.
  const progress = clamp01(have[best.axis] / target);
  const unit = best.axis === 'tempo' ? 'kill' : best.axis === 'bank' ? 'bank' : best.axis === 'weave' ? 'throughcut' : 'cut';
  return {
    axis: best.axis,
    to: grade + 1,
    gap: best.gap,
    steps: best.steps,
    // Spoken form: "1 more bank", "2 more cuts". Deliberately pluralised here
    // rather than at the call site so both channels say the same thing.
    need: `${best.steps} more ${unit}${best.steps === 1 ? '' : 's'}`,
    progress,
  };
}
const clamp01 = (v) => (Number.isFinite(v) ? Math.max(0, Math.min(1, v)) : 0);
