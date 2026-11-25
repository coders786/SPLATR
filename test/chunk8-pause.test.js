/**
 * ══════════════════════════════════════════════════════════════════════════
 *  CHUNK 8 — §3 OF THE CHUNK-7 PLAN: THE PAUSE, HONESTLY.
 * ══════════════════════════════════════════════════════════════════════════
 *
 * Three complaints, one screen:
 *
 *   1. "It auto-pauses at random."          → the pause must say who asked.
 *   2. "Alt-tabbing is a free shopping trip." → an interruption is a dismissal,
 *                                              not a menu.
 *   3. "Everything teleports while I'm in  →  the first frame back is clamped,
 *      another window."                        and a glance never pauses at all.
 *
 * `src/main.js` is a browser shell and cannot be imported, so (as with the
 * chunk-7 frame suite) the shell-level rules are pinned by reading the source,
 * while the one piece that is genuinely a decision — the report — lives in
 * `src/frame-report.js` and is tested by behaviour.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { frameReport, createConsoleRing, captureConsole, CONSOLE_LINES } from '../src/frame-report.js';

const main = readFileSync(new URL('../src/main.js', import.meta.url), 'utf8');
const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const css = readFileSync(new URL('../src/style.css', import.meta.url), 'utf8');

/* ══ §3.5 — A GLANCE IS NOT AN INTERRUPTION ═══════════════════════════════ */

test('blur is debounced, so a glance at another window costs no rhythm', () => {
  // The handler must schedule the pause rather than call it, and it must be
  // short enough that a real interruption still pauses promptly.
  assert.match(main, /const BLUR_GRACE_MS = (\d+);/);
  const grace = Number(main.match(/const BLUR_GRACE_MS = (\d+);/)[1]);
  assert.ok(grace >= 200 && grace <= 600, `a grace of ${grace}ms is a beat, not a timeout`);
  const at = main.indexOf("window.addEventListener('blur'");
  assert.ok(at > 0, 'there is a blur handler');
  const body = main.slice(at, main.indexOf('});', at) + 3);
  assert.match(body, /clearTimeout\(/);
  assert.match(body, /setTimeout\(/, 'the pause is scheduled');
  // `suspend` may only appear INSIDE the timer, never as the handler's own call.
  const scheduled = body.slice(body.indexOf('setTimeout('), body.indexOf('BLUR_GRACE_MS)'));
  assert.match(scheduled, /suspend\('window lost focus'\)/, 'the cause is recorded when it fires');
  assert.equal(body.replace(scheduled, '').includes('suspend('), false, 'and not called straight away');
});

test('returning inside the grace window never pauses', () => {
  const at = main.indexOf("window.addEventListener('focus'");
  assert.ok(at > 0, 'there is a focus handler');
  const body = main.slice(at, main.indexOf('});', at));
  assert.match(body, /clearTimeout\(blurTimer\)/, 'the pending pause is cancelled');
  assert.match(body, /clock\.reset\(\)/, 'and the clock does not carry the gap');
  assert.match(body, /requestAnimationFrame\(frame\)/, 'the loop is running again');
});

test('a hidden tab is still paused immediately: hiding is not ambiguous', () => {
  const at = main.indexOf("document.addEventListener('visibilitychange'");
  const body = main.slice(at, main.indexOf('});', at));
  assert.match(body, /if \(document\.hidden\)/);
  assert.match(body, /suspend\('tab hidden'\)/);
  // The pending blur is cleared so it cannot fire later and overwrite the cause.
  assert.match(body, /clearTimeout\(blurTimer\)/);
});

/* ══ §3.3 — THE FIRST DELTA AFTER A RESUME ═══════════════════════════════ */

test('the first frame after a gap is clamped, so nothing teleports', () => {
  const at = main.indexOf('function frame(realNow)');
  assert.ok(at > 0, 'frame() takes the real clock');
  const body = main.slice(at, main.indexOf('function safeStep', at));
  assert.match(body, /MAX_FRAME_GAP_MS/);
  assert.match(body, /lastFrameAt/, 'the gap is measured against the last frame');
  const clamp = Number(main.match(/const MAX_FRAME_GAP_MS = (\d+);/)[1]);
  assert.ok(clamp > 0 && clamp <= 100, `a ${clamp}ms clamp is one frame of slack, not a freeze`);
  // Resuming a hidden tab clears the reference, so the first frame is not
  // computed against a timestamp from before the tab went away.
  assert.match(main, /lastFrameAt = 0;/);
});

/* ══ §3.2 — AN INTERRUPTION IS A DISMISSAL ══════════════════════════════ */

test('an automatic pause hides the menu and offers only Resume and End run', () => {
  assert.match(main, /panel\.dataset\.intrusion = String\(automatic\)/);
  // Every decision is behind a deliberate pause. This is the exploit fix: a
  // pause the game started is not a shop.
  for (const id of ['pause-manual', 'pause-options']) {
    assert.ok(
      main.includes(`for (const id of ['pause-manual', 'pause-options'`) ||
        main.includes(`'${id}'`),
      `${id} is gated on the pause being deliberate`,
    );
  }
  const from = main.indexOf('for (const id of [');
  const gate = main.slice(from, main.indexOf('\n      }', from));
  assert.match(gate, /node\.hidden = automatic/, 'hidden when the game interrupted');
  assert.match(html, /id="pause-page"[^>]*data-intrusion="false"/);
  assert.match(css, /#pause-page\[data-intrusion=true\]/, 'the interruption has its own look');
  // Resume and End run are NOT in that list: they are the only two answers.
  assert.doesNotMatch(gate, /resume-btn|end-btn/);
});

test('a deliberate pause still offers everything', () => {
  // The same gate, inverted: nothing is hidden when the player pressed Escape.
  assert.match(main, /if \(!dialog\.open\) dialog\.showModal\(\)/);
  const at = main.indexOf("next === 'pause'\n      ? 'resume-btn'");
  assert.ok(at > 0, 'resume still gets focus');
});

/* ══ §3.1 — THE PAUSE READS THE RUN ═════════════════════════════════════ */

test('the pause screen shows the three deeds you hold, in the board language', () => {
  assert.match(html, /id="pause-deeds"/, 'there is a container for them');
  assert.match(main, /questUI\?\.pauseRead\?\.\(\)/, 'filled from the live board');
  assert.match(main, /line\.dataset\.lane/, 'each row is a lane');
  assert.match(css, /\.pause-deed\[data-done=true\]/, 'a proven deed reads differently');
  const at = main.indexOf('const held = questUI?.pauseRead?.()');
  assert.ok(at > 0, 'the rows are built from the live board');
});

/* ══ §3.4 — THE REPORT ══════════════════════════════════════════════════ */

test('the report carries the seed, the run state and the error table', () => {
  const report = frameReport({
    now: new Date('2026-01-02T03:04:05Z'),
    seed: 4417,
    page: 'pause',
    run: { state: { phase: 'playing', band: 4, score: 12345, kills: 61, hp: 2, hpMax: 3, wave: { phase: 'combat', number: 6, cleared: 3 } } },
    failures: 45,
    errors: [['hud.draw :: x is not a function', 43], ['hud.draw :: other', 2]],
    deeds: [{ lane: 'CUT', title: 'PILLAR WORK', label: '3 / 4' }],
    consoleLines: ['[SPLATR] frame error in hud.draw'],
  });
  assert.match(report, /^SPLATR frame-error report/);
  assert.match(report, /when: 2026-01-02T03:04:05\.000Z/);
  assert.match(report, /seed: 4417/);
  assert.match(report, /page: pause/);
  assert.match(report, /sector 4/);
  assert.match(report, /kills 61/);
  assert.match(report, /wave: combat 6 \(3 cleared\)/);
  assert.match(report, /frame failures: 45/);
  assert.match(report, /43x hud\.draw :: x is not a function/);
  assert.match(report, /CUT PILLAR WORK 3 \/ 4/);
  assert.match(report, /\[SPLATR\] frame error in hud\.draw/);
  // One row per fact: a pasted report has to be readable, not a wall.
  for (const line of report.split('\n')) assert.ok(line.length < 140, `too long: ${line}`);
});

test('a report with no run says so instead of inventing one', () => {
  const report = frameReport({ seed: 1, page: 'title', run: null, failures: 0, errors: [] });
  assert.match(report, /run: none/);
  assert.match(report, /errors: none recorded/);
  assert.match(report, /frame failures: 0/);
  assert.doesNotMatch(report, /undefined|NaN|\[object/);
});

test('the console ring keeps only the game\'s own last few lines', () => {
  const ring = createConsoleRing(3);
  for (let i = 0; i < 10; i++) ring.push(`[SPLATR] line ${i}`);
  assert.deepEqual(ring.lines(), ['[SPLATR] line 7', '[SPLATR] line 8', '[SPLATR] line 9']);
  assert.equal(CONSOLE_LINES, 5, 'the report carries five, not a log file');
  assert.equal(ring.lines().length <= 3, true, 'the ring never grows');
});

test('capturing the console is idempotent and only keeps [SPLATR] output', () => {
  // A stub console, so the real one is never touched by a test.
  const printed = [];
  const fake = {
    info: (...a) => printed.push(['info', ...a]),
    warn: (...a) => printed.push(['warn', ...a]),
    error: (...a) => printed.push(['error', ...a]),
  };
  const ring = createConsoleRing();
  captureConsole(ring, fake);
  const wrapped = fake.info;
  captureConsole(ring, fake);
  assert.equal(fake.info, wrapped, 'wrapping twice is a no-op');
  fake.info('[SPLATR] kept');
  fake.info('extension noise, not ours');
  fake.error('[SPLATR] kept too');
  assert.deepEqual(ring.lines(), ['[SPLATR] kept', '[SPLATR] kept too']);
  assert.equal(printed.length, 3, 'and every line still reaches the real console');
});

test('the report button exists, is not dev-only, and never throws on refusal', () => {
  assert.match(html, /id="dev-fault"[^>]*hidden>Copy frame-error report/);
  assert.match(main, /copy\.hidden = !\(frameFailures > 0\)/, 'only when there is something to report');
  const at = main.indexOf("$('dev-fault').onclick");
  const body = main.slice(at, at + 700);
  assert.match(body, /try \{/, 'a refused clipboard is caught');
  assert.match(body, /console\.info\(report\)/, 'and the report is still obtainable');
  // Exactly one handler: the first draft registered two and each copied at once.
  assert.equal(main.split("$('dev-fault').onclick").length, 2, 'one handler');
});
