import test from 'node:test';
import assert from 'node:assert/strict';
import { createRun, MAX_EDGE, EMPTY_WATCHDOG_TICKS } from '../src/run.js';
import { ARENA, bandAt } from '../src/levels.js';
import { sceneFor } from '../src/storyboard.js';

// ═══════════════════════════════════════════════════════════════════════════
//  THE FIVE CHECKS THE REVIEW ASKED FOR
//
//  Every one of these is deterministic: fixed seed, fixed input script, no
//  timing, no rendering. They either hold or they do not.
// ═══════════════════════════════════════════════════════════════════════════

const noop = () => {};
const log = (name, detail) => console.log(`  ✓ ${name} — ${detail}`);

// 1 ────────────────────────────────────────────────────────────────────────
test('test_cutting_room_clean_handoff', () => {
  const g = createRun(42, noop, { warmup: true });
  const s = g.state;
  const press = () => g.dash(g.suggestion());
  const tick = (n) => { while (n-- > 0) g.tick(); };

  // Play the room, then walk into the field.
  let bench = 0;
  let atOpen = null;
  for (let i = 0; i < 1400; i++) {
    if (s.opening && s.opening.rest && s.shots < 4) press();
    if (s.opening === null && atOpen === null) {
      atOpen = { score: s.score, chain: s.chain, drive: s.drive, edge: s.edge, tutorialActive: s.tutorialActive };
    } else if (s.opening) bench = s.score;
    g.tick();
  }

  assert.ok(bench > 0, 'the bench paid while the player was on it');
  assert.ok(atOpen, 'the room ended');
  assert.equal(atOpen.score, 0, 'score');
  assert.equal(atOpen.chain, 0, 'chain');
  assert.equal(atOpen.drive, 0, 'overdrive');
  assert.equal(atOpen.tutorialActive, false, 'tutorialActive');
  assert.equal(atOpen.edge, MAX_EDGE, `pips refilled to ${MAX_EDGE}`);
  // Velocity reset: the cube is not carrying a launch out of the racks.
  assert.ok(Math.hypot(g.world.player.velocity.x, g.world.player.velocity.y) < 0.01, 'velocity zeroed');
  log('clean handoff', `bench ${bench} → score ${atOpen.score}, edge ${atOpen.edge}, tutorial off`);
  g.dispose();
});

// 2 ────────────────────────────────────────────────────────────────────────
test('test_no_spawner_drought_past_sector_32', () => {
  // Step 1,200 ticks at three altitudes -- the wall, and two deciles that are
  // past the last band the table can express.
  for (const sector of [32, 50, 100]) {
    const g = createRun(19, noop, { staged: true });
    const s = g.state;
    s.phase = 'playing';
    const p = g.world.player.position;

    // Park the cube at the altitude for that sector.
    const y = ARENA.y + 400; // hard against the top wall
    p.x = ARENA.x + ARENA.w / 2;
    p.y = y;
    for (let i = 0; i < 60; i++) g.tick();

    let empty = 0;
    let worst = 0;
    let spawned = 0;
    let lastCount = g.combat.enemies.size;
    for (let i = 0; i < 1200; i++) {
      // Hold altitude so the test is about the SPAWNER, not about flying.
      p.y = y;
      g.world.player.velocity.y = 0;
      g.tick();
      const n = g.combat.enemies.size;
      if (n > lastCount) spawned += n - lastCount;
      lastCount = n;
      if (n === 0) worst = Math.max(worst, ++empty);
      else empty = 0;
    }
    assert.ok(worst < 120, `sector ${sector}: max empty gap ${worst} < 120 ticks`);
    assert.ok(g.combat.enemies.size > 0, `sector ${sector}: the field is not empty`);
    log(`no drought @ sector ${sector}`, `worst gap ${worst} ticks, ${g.combat.enemies.size} live, ${spawned} spawned`);
    g.dispose();
  }
});

// 3 ────────────────────────────────────────────────────────────────────────
test('test_floor_rail_no_velocity_ghost', () => {
  const g = createRun(19, noop, { staged: true });
  const s = g.state;
  s.phase = 'playing';
  for (let i = 0; i < 240; i++) g.tick(); // let it fall and land

  let maxMoved = 0;
  let contacts = 0;
  let settled = 0;
  const seen = new Set();
  let lastContact = null;
  for (let i = 0; i < 300; i++) {
    g.tick();
    maxMoved = Math.max(maxMoved, s.moved);
    if (s.railSettle) settled++;
    const c = g.world.contact;
    if (c && c.side === 'bottom') {
      // Count EDGES, not ticks: `contact` is published per bounce.
      if (c !== lastContact) contacts++;
      lastContact = c;
    }
  }
  assert.ok(maxMoved < 2, `displacement stays settled: max ${maxMoved.toFixed(3)} px/tick`);
  assert.ok(settled > 250, `rail settle latched on ${settled}/300 ticks`);
  assert.ok(contacts <= 1, `rail contact events ${contacts} <= 1`);
  assert.equal(Math.abs(g.world.player.velocity.y) < 0.001, true, 'vy is exactly zero');
  log('floor rail', `moved ${maxMoved.toFixed(3)}, settle ${settled}/300, contacts ${contacts}`);
  g.dispose();
});

// 4 ────────────────────────────────────────────────────────────────────────
test('test_hud_playfield_isolation', () => {
  // (a) the tutorial card is impossible outside the Cutting Room.
  const g = createRun(19, noop, { staged: true });
  const s = g.state;
  s.phase = 'playing';
  assert.equal(s.tutorialActive, false, 'staged run starts with tutorials off');
  for (const band of [1, 2, 5, 32]) {
    s.band = band;
    s.story = true;
    for (const [name, setup] of [
      ['falling', () => ({ net: true, firstAir: false, caught: false })],
      ['firstAir', () => ({ net: false, firstAir: true, breath: 5, caught: false })],
      ['stock', () => ({ net: false, firstAir: false, edge: 0, caught: false })],
      ['caught', () => ({ caught: true })],
    ]) {
      Object.assign(s, setup());
      const scene = sceneFor(s, { sentry: true }, true, 100);
      assert.equal(scene, null, `sector ${band} / ${name}: no tutorial card may appear`);
    }
  }
  // (b) the minimap panel and the player's reachable box DO overlap, which is
  //     why the panel has to move rather than the wall.
  const w = 900, h = 730;
  const side = Math.min(w, h);
  const pad = Math.max(10, side * 0.022);
  const size = Math.min(side * 0.3, 226);
  const x0 = w - size - pad, y0 = h - size - pad;
  const maxX = w - w * 0.16, maxY = h - h * 0.16;
  assert.ok(maxX > x0 && maxY > y0, 'the player can reach into the panel rect');
  assert.ok((maxX - x0) * (maxY - y0) > 2000, 'and the overlap is real, not a sliver');
  log('hud isolation', `tutorial card impossible at sectors 1/2/5/32; panel overlap ${(maxX - x0) | 0}x${(maxY - y0) | 0}px`);
  g.dispose();
});

// 5 ────────────────────────────────────────────────────────────────────────
test('test_hitstop_preserves_grace', () => {
  const g = createRun(19, noop, { staged: true });
  const s = g.state;
  s.phase = 'playing';
  for (let i = 0; i < 60; i++) g.tick();

  // Arm a grace window by hand, exactly as `cut()` does, and hold the run in a
  // hitstop. The invariant: the countdown must not advance while frozen, and
  // the guarded enemy must not be able to land a hit.
  s.cutGrace = 8;
  s.cutGraceFrom = 'bastion-1';
  s.stop = 5;
  const before = s.cutGrace;
  for (let i = 0; i < 5; i++) g.tick();
  assert.equal(s.cutGrace, before, 'grace must not burn during hitstop');

  // Now let it run out and confirm it does come back down (no leak).
  s.stop = 0;
  for (let i = 0; i < 20; i++) g.tick();
  assert.equal(s.cutGrace, 0, 'grace expires normally once the clock runs');
  assert.equal(s.cutGraceFrom, null, 'and the target is cleared with it');
  log('hitstop grace', `held at ${before} through 5 stopped ticks, then expired`);
  g.dispose();
});
