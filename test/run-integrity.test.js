import test from 'node:test';
import assert from 'node:assert/strict';
import { createRun } from '../src/run.js';
import { ARENA, bandAt } from '../src/levels.js';

// ── REGRESSIONS FROM A FRAME-BY-FRAME REVIEW OF A REAL RECORDING ─────────────
//
// Both of these were reproducible in a headless sim before they were fixed,
// and both were reported from watching the recording rather than from a test.
// That is the whole point of them being here now.

const noop = () => {};

test('the Cutting Room does not pay into Sector 01', () => {
  // A warmup run: the Cutting Room is live, points/chain/Overdrive accumulate
  // while slicing stationary racks, and then the field opens.
  const g = createRun(42, noop, { warmup: true });
  const s = g.state;
  const tick = (n) => { while (n-- > 0) g.tick(); };
  const press = () => g.dash(g.suggestion());

  // Play the room the way a player does, and watch the hand-off frame.
  let benchPoints = 0;
  let atOpen = null;
  for (let i = 0; i < 1400; i++) {
    if (s.opening && s.opening.rest && s.shots < 4) press();
    // Sample the FIRST tick after the room ends, before the field can pay for
    // anything: that is the hand-off.
    if (s.opening === null && atOpen === null) atOpen = { ...ms() };
    else if (s.opening) benchPoints = s.score;
    g.tick();
  }

  function ms() { return { score: s.score, chain: s.chain, drive: s.drive, hyper: s.hyper, band: s.band }; }

  assert.ok(benchPoints > 0, 'the bench paid while the player was on it');
  assert.ok(atOpen, 'the room ended and the field opened');
  assert.equal(atOpen.score, 0, 'no bench points carried in');
  assert.equal(atOpen.chain, 0, 'no free multiplier');
  assert.equal(atOpen.drive, 0, 'no free Overdrive');
  assert.equal(atOpen.hyper, false, 'and not in hyper');
  assert.equal(atOpen.band, 0, 'the sector counter starts at the bottom');

  g.dispose();
});

test('parking against the top wall does not extinguish the field', () => {
  // The table is finite, so the last row of cells sits at the top rail. This
  // used to skip any cell past the wall, which meant a player who climbed to
  // the top and stayed there watched the enemy count go to zero and STAY
  // there -- a soft-lock in a run-based arcade game.
  const g = createRun(19, noop, { staged: true });
  const s = g.state;
  s.phase = 'playing';

  // Climb to the wall.
  let f = 0;
  for (; f < 4000; f++) {
    if (g.world.clock % 20 < 1) g.dash(g.suggestion());
    g.tick();
    if (g.world.player.position.y < ARENA.y + 900) break;
  }
  assert.ok(g.world.player.position.y < ARENA.y + 900, 'reached the wall');

  // Park there, only poking occasionally, the way a resting player does.
  let longestEmpty = 0;
  let empty = 0;
  for (let i = 0; i < 1800; i++, f++) {
    if (i % 90 === 0) g.dash(g.nearest() ?? g.suggestion());
    g.tick();
    if (g.combat.enemies.size === 0) longestEmpty = Math.max(longestEmpty, ++empty);
    else empty = 0;
  }

  assert.ok(
    longestEmpty < 120,
    `the field must never go dead for 2s (longest empty stretch: ${longestEmpty} frames)`,
  );
  assert.ok(g.combat.enemies.size > 0, 'and there must be something to fight');

  g.dispose();
});

test('the top of the table is sector 32, and that is where the wall is', () => {
  // "DEAD CHANNEL" was Sector 32 precisely because that is the highest band the
  // table can express: the wall sits at -78,000 and a band is 2,480. That is
  // also why the observed soft-lock happened there -- the wall was the last
  // place with cells, and past it there was nothing.
  //
  // `bandAt` is a plain function of altitude and does NOT clamp; the wall is
  // what bounds it in play. Both facts are asserted so a future change to
  // either one is caught.
  assert.equal(bandAt(ARENA.y + 1), 32, 'the wall is the last sector');
  assert.equal(bandAt(-1000), 1, 'and the floor is the first');
  assert.ok(bandAt(-1e9) > 32, 'bandAt itself is unbounded; the WALL bounds it');
});

test('the minimap rect and the "cube can reach it" rect actually overlap', () => {
  // This is the geometry behind the HUD-overlap bug. It is asserted rather
  // than eyeballed because the two rects are computed in two different files
  // (levels.js lays out the arena, renderer.js lays out the panel), and it is
  // entirely possible to change one and not notice that the panel has become
  // unreachable -- or that it suddenly covers half the screen.
  const w = 900, h = 730;
  const side = Math.min(w, h);
  const pad = Math.max(10, side * 0.022);
  const box = Math.min(side * 0.3, 226);
  const x0 = w - box - pad, y0 = h - box - pad;
  // The camera keeps the cube within a 16% margin of the viewport.
  const maxX = w - w * 0.16, maxY = h - h * 0.16;
  const overlapW = maxX - x0, overlapH = maxY - y0;
  assert.ok(overlapW > 0 && overlapH > 0, 'the cube can enter the panel rect');
  assert.ok(
    overlapW * overlapH > 2000,
    `the overlap is real (${overlapW.toFixed(0)}x${overlapH.toFixed(0)}px), not a sliver`,
  );
});
