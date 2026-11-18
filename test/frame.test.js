import test from 'node:test';
import assert from 'node:assert/strict';
import { createRun } from '../src/run.js';
import { createCamera, frameRun } from '../src/camera.js';
import { pose } from '../src/shapes.js';
import { STEP_MS } from '../src/physics.js';

/** Enemy motion on the actual glass.
 *
 *  "Enemies jitter when moving" is a claim about what a frame looks like, not
 *  about what a variable is set to, so these tests simulate a real display:
 *  they advance the same 60 Hz simulation and then ask for a render at a
 *  refresh rate that does not divide it (144 Hz is the nasty case -- 2.4 sim
 *  steps per frame).
 *
 *  What they pin down:
 *   - consecutive render frames must not repeat (a duplicate frame IS a hitch)
 *   - per-frame travel must stay within a sane band around its median, because
 *     the eye reads "fast, slow, fast, slow" as jitter even when the average is
 *     right
 *   - a fast-moving enemy must never be drawn at a stale position
 */

const RATES = [60, 120, 144, 240];

function sample(rate, { ticks = 1400, seed = 1 } = {}) {
  const frame = 1000 / rate;
  const run = createRun(seed, () => {}, { staged: true });
  const cam = createCamera();
  cam.resize(880, 710);
  cam.reset(run.world.player.position, 1);
  let debt = 0,
    watched = null,
    prev = null;
  const advance = [];
  for (let f = 0; f < ticks * 4 && run.state.phase !== 'over'; f++) {
    debt += frame;
    let stepped = 0;
    while (debt + 1e-8 >= STEP_MS && stepped < 6) {
      debt -= STEP_MS;
      stepped++;
      run.tick();
      frameRun(cam, run);
    }
    if (run.world.clock % 45 < 1) run.dash(run.suggestion());
    const alpha = Math.min(debt / STEP_MS, 1);
    // Follow one object for as long as it is alive, then move on. Tracking by
    // id would silently jump to a different shape when a slot is reused.
    if (!watched || !run.combat.enemies.has(watched.id)) {
      watched = null;
      prev = null;
      for (const e of run.combat.enemies.values())
        if (e.mode !== 'idle' && e.kind !== 'crown') {
          watched = e;
          break;
        }
    }
    if (!watched || watched.pinned) continue;
    const q = pose(watched, alpha),
      v = cam.view(alpha);
    const sx = (q.x - v.x) * v.scale,
      sy = (q.y - v.y) * v.scale;
    if (prev) advance.push(Math.hypot(sx - prev[0], sy - prev[1]));
    prev = [sx, sy];
  }
  run.dispose();
  const sorted = advance.slice().sort((a, b) => a - b);
  const at = (q) => sorted[Math.floor(q * (sorted.length - 1))] ?? 0;
  const mean = advance.reduce((a, b) => a + b, 0) / (advance.length || 1);
  return {
    n: advance.length,
    mean,
    p50: at(0.5),
    p95: at(0.95),
    duplicates: advance.filter((d) => d < 1e-9).length,
  };
}

test('an enemy is drawn at a fresh position on essentially every render frame', () => {
  for (const rate of RATES) {
    const s = sample(rate);
    assert.ok(s.n > 400, `${rate}Hz produced too few samples (${s.n})`);
    // A duplicate frame means the display showed the same image twice, which
    // is exactly the stutter a player calls "jitter". Allow a negligible few
    // for the frames where a shape genuinely does not move.
    assert.ok(
      s.duplicates / s.n < 0.02,
      `${rate}Hz duplicated ${s.duplicates}/${s.n} frames (${((100 * s.duplicates) / s.n).toFixed(1)}%)`,
    );
  }
});

test('per-frame enemy travel is even, so motion does not read as stuttering', () => {
  for (const rate of RATES) {
    const s = sample(rate);
    // p95/p50 is the shape of the stutter: 1.0 is a perfectly even glide.
    // Above ~1.8 the sprite visibly speeds up and slows down between frames.
    const ratio = s.p95 / s.p50;
    assert.ok(
      ratio < 1.8,
      `${rate}Hz travel was uneven: p50 ${s.p50.toFixed(2)}px, p95 ${s.p95.toFixed(2)}px (ratio ${ratio.toFixed(2)})`,
    );
  }
});

test('render interpolation never shows an enemy at a previous tick position', () => {
  // At alpha=1 the pose must equal the live body exactly; at alpha=0 the
  // previous one. A renderer that ignored alpha would fail both.
  const run = createRun(1, () => {}, { staged: true });
  const cam = createCamera();
  cam.resize(880, 710);
  cam.reset(run.world.player.position, 1);
  for (let i = 0; i < 240; i++) {
    if (i % 45 === 0) run.dash(run.suggestion());
    run.tick();
    frameRun(cam, run);
  }
  const e = [...run.combat.enemies.values()].find((x) => !x.pinned);
  if (e) {
    const now = pose(e, 1),
      before = pose(e, 0);
    assert.equal(now.x, e.x);
    assert.equal(now.y, e.y);
    assert.equal(before.x, e.px);
    assert.equal(before.y, e.py);
  }
  run.dispose();
});
