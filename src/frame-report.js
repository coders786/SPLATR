/**
 * ══════════════════════════════════════════════════════════════════════════
 *  THE FRAME-ERROR REPORT
 * ══════════════════════════════════════════════════════════════════════════
 *
 * §3.4 of the chunk-7 plan: "the fault line should be copyable — seed, run
 * state, the frame-error table, the last few console lines."
 *
 * The reasoning is blunt. Chunk 7 made frame errors VISIBLE (`dataset.frameFault`,
 * a line on the pause screen) but not ACTIONABLE: a player who hits a repeating
 * throw can tell us it is happening and nothing else. A bug report that says
 * "it froze" costs a round of questions; a bug report that says "seed 4417,
 * sector 4, 45 failures, `hud.draw :: x is not a function` 43 times" is a fix.
 *
 * Why it is a separate module: `src/main.js` is a browser shell (canvas, audio
 * context, module-level DOM reads) and cannot be imported by a test. Everything
 * that DECIDES something here is therefore pure, and the shell only wires it to
 * the clipboard.
 */

/** How many recent `[SPLATR]` console lines the report carries. */
export const CONSOLE_LINES = 5;

/**
 * A tiny ring buffer over the console.
 *
 * Only lines the game itself printed are kept (`[SPLATR]`), because the browser
 * mixes in extension noise and analytics chatter that has nothing to do with the
 * fault. Wrapping is idempotent so a hot-reload or a second call cannot stack
 * wrappers and double-report every line.
 */
export function createConsoleRing(limit = CONSOLE_LINES) {
  const lines = [];
  return {
    push(line) {
      lines.push(String(line).slice(0, 200));
      while (lines.length > limit) lines.shift();
    },
    lines: () => [...lines],
    clear: () => lines.splice(0, lines.length),
  };
}

/** Wrap `console.info/warn/error` so `[SPLATR]` output is remembered. */
export function captureConsole(ring, target = console) {
  if (target.__splatrRing) return target.__splatrRing;
  for (const level of ['info', 'warn', 'error']) {
    const original = target[level]?.bind(target);
    if (!original) continue;
    target[level] = (...args) => {
      try {
        const first = typeof args[0] === 'string' ? args[0] : '';
        if (first.startsWith('[SPLATR]')) ring.push(first);
      } catch {
        // A console that cannot be read is not a reason to stop logging.
      }
      return original(...args);
    };
  }
  Object.defineProperty(target, '__splatrRing', { value: ring, configurable: true });
  return ring;
}

const oneLine = (value) => String(value ?? '').replace(/\s+/g, ' ').trim();

/**
 * The report, as plain text. Pure: same input, same output (except the clock).
 *
 * The order is the order a reader needs it: what happened, when, on what seed,
 * in what state, then the evidence.
 */
export function frameReport({
  now = new Date(),
  seed = 0,
  page = 'title',
  run = null,
  failures = 0,
  errors = [],
  deeds = [],
  consoleLines = [],
  url = '',
} = {}) {
  const lines = ['SPLATR frame-error report'];
  lines.push(`when: ${now instanceof Date ? now.toISOString() : String(now)}`);
  within(lines, 'seed', seed);
  within(lines, 'page', page);
  if (url) within(lines, 'url', url);
  if (run && run.state) {
    const s = run.state;
    lines.push(`run: phase ${oneLine(s.phase)}, sector ${oneLine(s.band)}, score ${oneLine(s.score)}`);
    lines.push(`state: kills ${oneLine(s.kills)}, hp ${oneLine(s.hp)}/${oneLine(s.hpMax)}`);
    if (s.wave) lines.push(`wave: ${oneLine(s.wave.phase)} ${oneLine(s.wave.number)} (${oneLine(s.wave.cleared)} cleared)`);
    else if (s.opening) lines.push('wave: cutting room');
  } else {
    lines.push('run: none');
  }
  lines.push(`frame failures: ${oneLine(failures)}`);
  if (errors.length) {
    lines.push('errors:');
    for (const [key, count] of errors) lines.push(`  ${oneLine(count)}x ${oneLine(key)}`);
  } else {
    lines.push('errors: none recorded');
  }
  if (deeds.length) {
    const held = deeds.map((d) => `${oneLine(d.lane)} ${oneLine(d.title)} ${oneLine(d.label)}`).join(' | ');
    lines.push(`deeds: ${held}`);
  }
  if (consoleLines.length) {
    lines.push(`console (last ${consoleLines.length}):`);
    for (const line of consoleLines) lines.push(`  ${oneLine(line)}`);
  }
  return lines.join('\n');
}

function within(lines, label, value) {
  // Whitespace in a single line keeps the report one-per-row, which is what
  // makes it readable when it is pasted into an issue.
  lines.push(`${label}: ${oneLine(value)}`);
}
