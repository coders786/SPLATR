import test from 'node:test';
import assert from 'node:assert/strict';
import { createRun } from '../src/run.js';
import { sightPicture } from '../src/guide.js';
import { beginStroke, printKill, impactFor, SHEAR } from '../src/stroke.js';
import { openingFacing } from '../src/levels.js';
import { createCamera, toScreen } from '../src/camera.js';

const step = (g, n) => {
  for (let i = 0; i < n; i++) g.tick();
};
function emptyRun(t) {
  const events = [],
    g = createRun(42, (type, d) => events.push({ type, ...d }));
  t.after(() => g.dispose());
  for (const e of g.combat.enemies.values()) g.combat.remove(e);
  let next = 0;
  const add = (kind, x, y, extra = {}) =>
    g.combat.add({
      kind,
      x,
      y,
      id: `print-${++next}`,
      home: 'field',
      slot: -1,
      phase: 0,
      delay: 999,
      ...extra,
    });
  return { g, events, add };
}

// Exercise real launch/collisions and charges, not just a threshold function.
test('one launch can turn two direct contacts into a paid forward cut; redirecting after the first cannot', (t) => {
  const left = createRun(42),
    right = createRun(42);
  t.after(() => {
    left.dispose();
    right.dispose();
  });
  for (const g of [left, right]) {
    g.dash(g.suggestion());
    step(g, 39);
    assert.equal(g.state.kills, 1);
  }
  right.dash(right.aimAt(right.combat.enemies.get('0:0/1')));
  for (const g of [left, right]) step(g, 100);
  const s = left.state,
    r = right.state;
  assert.deepEqual([s.shots, s.kills, s.score, s.throughcuts, s.edge, s.hp], [1, 3, 1660, 1, 3, 3]);
  assert.deepEqual([r.shots, r.kills, r.chain, r.score, r.throughcuts], [2, 2, 2, 460, 0]);
  assert.equal(right.combat.enemies.get('0:0/2').hp, 1);
  assert.deepEqual(
    s.bestStroke.marks.map((m) => [m.kind, m.fromShear]),
    [
      ['fang', false],
      ['prism', false],
      ['bastion', true],
    ],
  );
  assert.equal(s.bestStroke.points, 100 + 360 + SHEAR.bonus + 900);
  const snap = structuredClone(s.bestStroke);
  left.dash({ x: 0, y: -12, power: 0.35 });
  step(left, 3);
  assert.deepEqual(s.bestStroke, snap, 'a new empty stroke must not overwrite the printed route');
});

test('120 fresh openings keep both notched shapes on screen and a real two-plate target on the shear', () => {
  const sides = new Set(),
    routes = new Set();
  for (let seed = 0; seed < 120; seed++) {
    const g = createRun(seed);
    try {
      const first = g.suggestion(),
        p = g.world.player.position,
        facing = openingFacing(seed);
      const { pair } = sightPicture(p, first, g.world.geometry, g.combat.enemies.values());
      assert.deepEqual(
        pair.map((n) => n.e.id),
        ['0:0/0', '0:0/1'],
      );
      routes.add(pair.map((n) => n.e.kind).join('-'));
      sides.add(facing);
      for (const [w, h] of [
        [320, 568],
        [880, 710],
        [844, 390],
      ]) {
        const cam = createCamera();
        cam.resize(w, h);
        cam.reset(p, facing);
        for (const { e } of pair) {
          const v = cam.view(1),
            q = toScreen(v, e),
            r = e.r * v.scale;
          assert.ok(
            q.x >= r && q.x <= w - r && q.y >= r && q.y <= h - r,
            `seed ${seed}, ${w}x${h}`,
          );
        }
      }
      g.dash(first);
      step(g, 85);
      assert.equal(g.state.throughcuts, 1);
      assert.equal(g.state.hp, 3);
      assert.equal(g.state.bestStroke.marks[2].kind, 'bastion');
      assert.equal(g.state.bestStroke.marks[2].fromShear, true);
    } finally {
      g.dispose();
    }
  }
  assert.equal(sides.size, 2);
  assert.ok(routes.size >= 4);
});

test('the shear hits forward sensor shapes, not a radius blast; it damages two plates once per launch', (t) => {
  const { g, events, add } = emptyRun(t);
  add('fang', 0, -64);
  add('prism', 0, -153);
  const crown = add('crown', 0, -312),
    side = add('bastion', 85, -275),
    far = add('well', 0, -622);
  const behind = add('bastion', 0, 180);
  const v = { x: 0, y: -19, power: 19 / 35 };
  g.dash(v);
  step(g, 25);
  const wave = events.filter((e) => e.type === 'shear');
  assert.equal(wave.length, 1);
  assert.ok(
    Math.abs(Math.hypot(wave[0].end.x - wave[0].x, wave[0].end.y - wave[0].y) - SHEAR.reach) < 1e-8,
  );
  assert.deepEqual([crown.hp, side.hp, far.hp, behind.hp], [1, 2, 1, 2]);
  assert.equal(crown.lastSlash, 1);
  assert.ok(Number.isFinite(crown.fault));
  assert.equal(g.state.score, 760);
  assert.equal(events.filter((e) => e.type === 'armor').length, 1);
});

test('charging requires two full-size direct kills, not two chips, armor cracks, or wave victims', () => {
  const stroke = beginStroke({ x: 9, y: 2 }, -0.67, 1),
    e = { kind: 'fang', small: true, x: 1, y: 2, r: 19, angle: 0 };
  for (let i = 0; i < 3; i++) assert.equal(printKill(stroke, e, 45, false, -0.4, 1).release, false);
  e.small = false;
  assert.equal(printKill(stroke, e, 100, false, -0.4, 1).release, false);
  assert.equal(printKill(stroke, e, 100, true, -0.4, 1).release, false);
  assert.equal(printKill(stroke, e, 100, false, -0.4, 1).release, true);
  for (let i = 0; i < 40; i++)
    assert.equal(printKill(stroke, e, 100, false, -0.4, 1).release, false);
  assert.equal(stroke.points, 3 * 45 + 43 * 100 + SHEAR.bonus);
  assert.equal(stroke.marks.length, 8);
  assert.equal(stroke.kills, 46);
  e.x = 10000;
  assert.equal(stroke.marks[0].x, 1, 'print samples are values, not live actor refs');
});

test('a wave can split a Fork but does not immediately shear its children or create a second wave', (t) => {
  const { g, add, events } = emptyRun(t);
  add('fang', 0, -65);
  add('prism', 0, -155);
  add('fork', 0, -296);
  add('well', 0, -360);
  g.dash({ x: 0, y: -19, power: 19 / 35 });
  step(g, 25);
  assert.equal(g.state.throughcuts, 1);
  assert.equal(g.state.kills, 4);
  assert.equal([...g.combat.enemies.values()].filter((e) => e.small).length, 2);
  assert.deepEqual(
    events.filter((e) => e.type === 'cut').map((e) => [e.kind, e.release, e.fromShear]),
    [
      ['fang', false, false],
      ['prism', true, false],
      ['fork', false, true],
      ['well', false, true],
    ],
  );
  assert.equal(g.state.stroke.primaries, 2);
  assert.equal(
    g.state.stroke.points,
    events.filter((e) => e.type === 'cut').reduce((n, e) => n + e.points, 0),
  );
  assert.equal(g.state.stop, 0, 'hit-stop uses the strongest impact, not additive stops');
});

test('a Crown at full hull still pays its score, but never announces a fictitious repair', (t) => {
  const { g, add, events } = emptyRun(t);
  add('crown', 0, -50);
  g.state.drive = 50;
  g.dash({ x: 0, y: -19, power: 19 / 35 });
  g.tick();
  assert.equal(g.state.hp, 3);
  assert.ok(g.state.score > 0);
  assert.equal(events.filter((e) => e.type === 'repair').length, 0);
});

test('sight marks do not predict an armored kill, mark a chip, or read through a solid', () => {
  const p = { x: 0, y: 0 },
    v = { x: 0, y: -30, power: 30 / 35 };
  const e = (y, hp = 1) => ({ x: 0, y, r: 24, hp });
  const foes = [e(-126), { ...e(-210), small: true }, e(-285, 2), { ...e(-312), x: 190 }];
  assert.deepEqual(sightPicture(p, v, [], foes).pair, []);
  assert.deepEqual(
    sightPicture(p, v, [], foes, 3).pair.map((n) => n.e),
    [foes[0], foes[2]],
  );
  const blocked = sightPicture(p, v, [{ x: -100, y: -213, w: 200, h: 15 }], foes, 3);
  assert.deepEqual(blocked.pair, []);
  assert.ok(blocked.path.every((q) => q.y > -213));
});

test('a paper kill, a plate, and a Crown have distinct impact budgets; ordinary contact has no camera kick', () => {
  const chip = impactFor('fang', true),
    paper = impactFor('prism'),
    plate = impactFor('bastion'),
    crown = impactFor('crown'),
    tear = impactFor('pulse', false, true);
  assert.deepEqual([chip.stop, paper.stop, plate.stop, crown.stop], [0, 1, 3, 4]);
  assert.equal(chip.flecks, 0);
  assert.equal(paper.kick, 0);
  assert.ok(plate.kick > paper.kick && crown.kick > plate.kick);
  assert.ok(tear.stop > paper.stop && tear.flecks < paper.flecks);
});
