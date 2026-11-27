/**
 * CHUNK 7 — THE FRAME LOOP MUST NOT BE KILLABLE.
 *
 * The report was "the scene is hanging and auto-pausing in the main game". Both
 * symptoms have one cause: `frame()` rescheduled itself as its LAST statement
 * and nothing in it was guarded. One throw anywhere inside — a HUD update, a
 * render, an art helper — ended the animation permanently: no ticks, a frozen
 * canvas, a working pause key, and a Resume that repainted exactly one frame
 * (`else if (redraw)`) before dying again.
 *
 * No headless suite can run `src/main.js` (it is a browser shell with a canvas
 * and an audio context), so these tests pin the SHAPE of the loop by reading
 * the source, plus the one concrete throw that was findable:
 * `wave-ui.js`'s sword strip on a `choose` phase with no run-owned sword.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const main = readFileSync(new URL('../src/main.js', import.meta.url), 'utf8');

/** The `frame` function's body, by brace matching from its declaration. */
function frameBody() {
  // CHUNK 8 added a delta clamp, so the signature is `frame(realNow)`.
  let start = main.indexOf('function frame(realNow) {');
  if (start < 0) start = main.indexOf('function frame(now) {');
  assert.ok(start > 0, 'frame() exists');
  let depth = 0, i = main.indexOf('{', start);
  const from = i;
  for (; i < main.length; i++) {
    if (main[i] === '{') depth++;
    else if (main[i] === '}') { depth--; if (depth === 0) break; }
  }
  return main.slice(from, i + 1);
}

test('the frame loop reschedules inside finally, so a throw cannot end it', () => {
  const body = frameBody();
  const finallyAt = body.lastIndexOf('finally');
  const rescheduleAt = body.lastIndexOf('requestAnimationFrame(frame)');
  assert.ok(finallyAt > 0, 'frame() has a finally block');
  assert.ok(rescheduleAt > finallyAt, 'the reschedule is inside finally, not before it');
  // And nothing after it in the body can skip it.
  const after = body.slice(rescheduleAt + 'requestAnimationFrame(frame)'.length).trim();
  assert.ok(/^[;\s}]*$/.test(after), 'no code runs after the reschedule inside finally');
});

test('a throw can no longer leave the frame slot set (which broke visibility recovery)', () => {
  const body = frameBody();
  // `raf = 0` must come before anything that can throw.
  const clearAt = body.indexOf('raf = 0');
  const firstUiAt = body.indexOf('waveUI?.update');
  const firstTryAt = body.indexOf('try {');
  assert.ok(clearAt > 0, 'the slot is cleared');
  assert.ok(clearAt < firstTryAt, 'raf is cleared before the guarded work');
  assert.ok(firstUiAt > clearAt, 'the UI update happens AFTER the slot is cleared');
});

test('the guarded work reports failures instead of swallowing them', () => {
  assert.match(main, /function reportFrameError\(/, 'there is a reporter');
  assert.match(main, /console\.error\('\[SPLATR\] frame error/, 'a failure is logged once');
  assert.match(main, /window\.__splatrFrameErrors/, 'and exposed for a bug report');
  // The loop must not swallow: no empty catch anywhere in frame().
  assert.doesNotMatch(frameBody(), /catch\s*\{\s*\}/, 'frame() has no silent catch');
  assert.match(main, /reportFrameError\('waveUI\.update', error\)|safe\(\(\) => waveUI/, 'the UI update is guarded by name');
});

test('the frame step is a separate function, so the guard wraps real work', () => {
  assert.match(main, /function safeStep\(now\) \{/, 'the per-frame work is extractable');
  // The hidden-tab bail lives in frame(), which must never run a step in a
  // background tab; the step itself is wrapped by safe().
  assert.match(frameBody(), /if \(document\.hidden\) return;/, 'frame() bails in a hidden tab');
  assert.match(frameBody(), /safeStep\(now\)/, 'the step is called from the guarded frame');
});

/* ── THE AUTO-PAUSE ─────────────────────────────────────────────────────── */

test('every automatic pause records its cause', () => {
  assert.match(main, /function suspend\(why = 'focus'\)/, 'suspend takes a reason');
  assert.match(main, /pauseCause = why/, 'and records it');
  // The three distinct causes must be distinguishable at the call sites.
  // CHUNK 8 debounced the blur handler (a glance at another window is not an
  // interruption), so the cause is passed at the timer, not at the event.
  assert.match(main, /setTimeout\(\(\) => suspend\('window lost focus'\), BLUR_GRACE_MS\)/);
  assert.match(main, /suspend\('tab hidden'\)/);
  // A deliberate pause says so, rather than inheriting the last cause.
  const deliberate = (main.match(/pauseCause = 'paused'/g) || []).length;
  assert.ok(deliberate >= 2, `the pause button and the P/Esc key both mark it deliberate (found ${deliberate})`);
});

test('repeated failures are rate limited, then surfaced in the UI', () => {
  // A render bug throws 60 times a second; it must not become 60 console lines
  // and 60 spoken lines. It escalates once, marks the shell, and goes quiet.
  assert.match(main, /else if \(seen === 20\)/, 'a recurring error is re-reported once');
  assert.match(main, /if \(frameFailures === 45\)/, 'the escalation fires at a threshold');
  assert.match(main, /game\.dataset\.frameFault = 'true'/, 'and is visible in the DOM');
  assert.match(main, /delete game\.dataset\.frameFault/, 'a new run clears it');
  assert.match(main, /frameFailures = 0;\s*\n\s*frameErrors\.clear\(\);/, 'a new run resets the counters');
});

test('the pause screen prints the cause', () => {
  assert.match(main, /\$\('pause-why'\)/, 'the shell writes the cause');
  assert.match(main, /if \(!automatic\) why\.textContent = 'PAUSED'/, 'a deliberate pause is just PAUSED');
  assert.match(main, /PAUSED — THE TAB LOST FOCUS/, 'a hidden tab is named in player words');
  assert.match(main, /PAUSED — THE WINDOW LOST FOCUS/, 'a lost window is named in player words');
  const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
  assert.match(html, /id="pause-why"/, 'the element exists in the real markup');
  // "Press Enter to get back in" only makes sense for a pause nobody asked for.
  assert.match(html, /id="pause-back"[^>]*hidden/, 'the get-back-in line starts hidden');
  assert.match(html, /id="pause-fault"[^>]*hidden/, 'the fault line starts hidden');
  assert.match(main, /if \(back\) back\.hidden = !automatic/, 'and only an automatic pause reveals it');
  assert.match(main, /fault\.hidden = game\.dataset\.frameFault !== 'true'/, 'the fault line follows the flag');
});

/* ── THE ONE CONCRETE THROW FOUND ───────────────────────────────────────── */

test('wave UI: a choose phase with no run-owned sword does not throw', async () => {
  const { Window } = await import('happy-dom');
  const window = new Window();
  globalThis.document = window.document;
  globalThis.requestAnimationFrame = () => 1;
  window.document.body.innerHTML = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
  window.Element.prototype.animate = () => ({});
  const { createWaveUI } = await import('../src/wave-ui.js');
  const { createRun } = await import('../src/run.js');
  const run = createRun(7, () => {}, { waveMode: true, continuous: true, postRewards: true });
  try {
    const ui = createWaveUI({ getRun: () => run, resetInput: () => {}, motion: () => true });
    run.state.phase = 'playing';
    for (const phase of ['combat', 'breach', 'return', 'monolith', 'choose']) {
      run.state.wave.phase = phase;
      assert.doesNotThrow(() => ui.update(), `wave phase "${phase}" must not throw`);
    }
  } finally {
    run.dispose();
    window.happyDOM.abort();
    delete globalThis.document;
    delete globalThis.requestAnimationFrame;
  }
});
