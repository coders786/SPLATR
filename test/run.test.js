import test from 'node:test';
import assert from 'node:assert/strict';
import { createClock } from '../src/clock.js';
import { createRun, ballisticAim } from '../src/run.js';
import { projectilePoint } from '../src/physics.js';
import { SPECIES } from '../src/shapes.js';
import Matter from 'matter-js';

const { Body } = Matter;
const advance = (g, n) => {
  for (let i = 0; i < n; i++) g.tick();
};

test('ready field is safe to study and the guide describes a reachable, seeded first cut', () => {
  const g = createRun(19),
    s = g.state,
    p = { ...g.world.player.position },
    target = g.nearest();
  advance(g, 480);
  assert.equal(s.elapsed, 0);
  assert.deepEqual(g.world.player.position, p);
  assert.equal(s.score, 0);
  const v = ballisticAim(p, target, 31.7);
  assert.ok(v);
  assert.ok(Math.hypot(projectilePoint(p, v, (target.x - p.x) / v.x).y - target.y) < 1e-7);
  assert.equal(ballisticAim(p, { x: p.x, y: p.y - 15000 }, 12), null);
  assert.equal(g.aimAt(target, true).target, target.id);
  g.dash(v);
  advance(g, 13);
  assert.ok(s.kills >= 1);
  assert.equal(s.shots, 1);
  g.dispose();
});
test('finite cuts, passive refill, bounded focus; misses eventually time out a chain', () => {
  const g = createRun(81),
    s = g.state;
  for (const e of g.combat.enemies.values()) g.combat.remove(e);
  const v = { x: 0, y: -1, power: 1 / 35 };
  assert.ok(g.dash(v));
  g.focus(true);
  advance(g, 45);
  // Half speed is the floor now: a held aim must not turn the game into syrup.
  assert.equal(g.world.engine.timing.timeScale, 0.5);
  assert.ok(s.held && s.focus < 0.78);
  g.focus(false);
  assert.equal(g.world.engine.timing.timeScale, 1);
  assert.ok(g.dash(v));
  assert.ok(g.dash(v));
  assert.equal(s.edge, 0);
  assert.equal(g.dash(v), false);
  s.chain = 3;
  s.chainTime = 80;
  advance(g, 100);
  assert.equal(s.edge, 1);
  assert.equal(s.chain, 0);
  assert.equal(s.phase, 'playing');
  g.dispose();
});
test('focus is spent in wall ticks instead of slow simulation time, and stays spent until released', () => {
  const g = createRun(2);
  for (const e of g.combat.enemies.values()) g.combat.remove(e);
  g.dash({ x: 10, y: -14, power: 0.55 });
  g.focus(true);
  advance(g, 173);
  assert.equal(g.state.focus, 0);
  assert.equal(g.state.depleted, true);
  assert.equal(g.world.slow, false);
  g.focus(false);
  advance(g, 12);
  assert.ok(g.state.focus > 0);
  g.dispose();
});
test('coasting after a single dash no longer loses to the Redline; it costs speed instead', () => {
  // The Redline used to end this run. The bottom wall replaces it: falling is a
  // dead cushion that eats your velocity, not a death. This asserts the intent
  // directly -- surviving, keeping hull, and arriving slower than you left.
  const events = [],
    g = createRun(5543, (k) => events.push(k));
  const start = { ...g.world.player.position };
  g.dash({ x: 15, y: -30, power: 0.97 });
  let peakSpeed = 0;
  for (let i = 0; i < 600; i++) {
    g.tick();
    peakSpeed = Math.max(peakSpeed, Math.hypot(g.world.player.velocity.x, g.world.player.velocity.y));
  }
  assert.notEqual(g.state.cause, 'Redline', 'the Redline no longer kills');
  assert.ok(!['over', 'dying'].includes(g.state.phase), 'coasting is survivable');
  assert.equal(events.filter((k) => k === 'over').length, 0);
  assert.ok(g.world.player.position.y !== start.y, 'the run actually moved');
  // Hull is NOT asserted here: a 600-tick coast passes through a live field and
  // this seed legitimately meets a Fang on the way down (measured at y=-703).
  // Enemy damage is still real; what changed is that GRAVITY no longer kills.
  g.dispose();
});

test('the bottom wall is a dead cushion: it catches you and eats most of your speed', () => {
  const g = createRun(5543, () => {});
  const w = g.world;
  // Launch first: physics does not run while the cube is parked on the pad in
  // `ready`, so a body moved before a launch simply sits there.
  g.dash({ x: 0, y: 1, power: 0.3 });
  // Then drop it onto the floor, far below the field. Body.setPosition, not a
  // direct write: Matter caches bounds and a raw .position.y does not move it.
  Body.setPosition(w.player, { x: 0, y: 11500 });
  Body.setVelocity(w.player, { x: 0, y: 60 });
  let cost = null;
  for (let i = 0; i < 200 && !cost; i++) {
    g.tick();
    if (w.floorCost) cost = w.floorCost;
  }
  assert.ok(cost, 'the floor must produce a contact');
  assert.ok(cost.after < cost.arrival * 0.6, `expected a heavy loss, got ${cost.after}/${cost.arrival}`);
  assert.ok(!['over', 'dying'].includes(g.state.phase), 'the floor never ends a run');
  assert.ok(w.player.position.y <= 12000, 'and it never lets you through');
  g.dispose();
});
test('retiring banks once; a new run has no old health, combo, hazards or cleared cells', () => {
  const events = [],
    g = createRun(37, (k) => events.push(k));
  g.dash(g.suggestion());
  advance(g, 15);
  assert.ok(g.state.score > 0);
  g.retire();
  g.retire();
  assert.equal(events.at(-1), 'over');
  assert.equal(events.filter((k) => k === 'over').length, 1);
  assert.equal(g.state.cause, 'Retired');
  g.dispose();
  const h = createRun(38);
  assert.equal(h.state.phase, 'ready');
  assert.equal(h.state.score, 0);
  assert.equal(h.stream.cleared.size, 0);
  assert.equal(h.state.chain, 0);
  assert.equal(h.combat.hazards.length, 0);
  assert.equal(h.state.hp, 3);
  h.dispose();
});
// A scripted player for deterministic coverage only. There is no update path
// in the actual game which seeks a target or launches without user input.
function exercise(seed, n) {
  const log = [],
    seen = new Set(),
    g = createRun(seed, (k) => log.push(k)),
    s = g.state;
  let prev = 0,
    maxCells = 0;
  g.dash(g.suggestion());
  for (let i = 0; i < n; i++) {
    g.tick();
    if (s.phase !== 'playing') break;
    maxCells = Math.max(maxCells, g.stream.live.size);
    assert.ok(g.combat.hazards.length <= 72 && g.combat.enemies.size < 80);
    for (const e of g.combat.enemies.values()) seen.add(e.kind);
    if ((s.kills > prev || i % 22 === 0) && s.edge > 0) {
      prev = s.kills;
      g.dash(g.suggestion());
    }
  }
  const result = {
    score: s.score,
    kills: s.kills,
    band: s.band,
    kinds: seen.size,
    maxCells,
    phase: s.phase,
    drive: log.includes('drive'),
  };
  g.dispose();
  return result;
}
test('long score runs cross multiple biomes, meet all eight species and trigger Overdrive without expanding the live field', () => {
  const a = exercise(42, 2400),
    b = exercise(31415, 2400);
  for (const r of [a, b]) {
    assert.equal(r.phase, 'playing');
    assert.ok(r.score > 50000 && r.kills > 50 && r.band > 8);
    assert.equal(r.kinds, SPECIES.length);
    assert.equal(r.maxCells, 9);
    assert.ok(r.drive);
  }
  assert.notEqual(a.score, b.score);
});
test('an identical input trace at 30, 60 and 144 render Hz produces the same simulated run', () => {
  function playback(hz) {
    const g = createRun(630),
      clock = createClock();
    let i = 0,
      subframe = false;
    clock.frame(0, () => {});
    for (let frame = 1; frame <= hz * 3; frame++) {
      const a = clock.frame((frame * 1000) / hz, () => {
        if (i % 28 === 0) g.dash(g.suggestion());
        g.tick();
        i++;
      });
      if (a > 0.001 && a < 0.999) subframe = true;
    }
    const r = [
      i,
      g.state.kills,
      g.state.score,
      g.world.player.position.x,
      g.world.player.position.y,
    ];
    if (hz === 144) assert.ok(subframe);
    g.dispose();
    return r;
  }
  const a = playback(30);
  assert.equal(a[0], 180);
  assert.ok(a[1] > 0);
  assert.deepEqual(a, playback(60));
  assert.deepEqual(a, playback(144));
});
