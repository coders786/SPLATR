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
// Shapes are placed by hand so this measures the SHEAR RULE rather than how
// far one stream spawn happens to sit from the cube at the current tempo.
test('one launch can turn two direct contacts into a paid forward cut; redirecting after the first cannot', (t) => {
  const build = () => {
    const g = createRun(42);
    for (const e of g.combat.enemies.values()) g.combat.remove(e);
    const add = (kind, x, y) =>
      g.combat.add({
        kind,
        x,
        y,
        id: `shear-${kind}-${y}`,
        home: 'field',
        slot: -1,
        phase: 0,
        delay: 999,
      });
    // Two direct contacts on the launch line, then a plate inside the shear.
    add('fang', 0, -64);
    add('prism', 0, -150);
    const plate = add('bastion', 0, -305),
      aside = add('bastion', 96, -268);
    return { g, plate, aside };
  };
  const { g: left } = build(),
    { g: right } = build();
  t.after(() => {
    left.dispose();
    right.dispose();
  });
  // One launch: fang, prism, then the plate behind them is sheared forward.
  left.dash({ x: 0, y: -26, power: 26 / 35 });
  step(left, 40);
  const s = left.state;
  assert.equal(s.shots, 1, 'the shear is earned inside ONE launch');
  assert.ok(s.throughcuts >= 1, 'two direct contacts release the forward shear');
  assert.deepEqual(
    s.bestStroke.marks.slice(0, 2).map((m) => m.kind),
    ['fang', 'prism'],
    'the first two paid marks are the direct contacts',
  );
  assert.ok(
    s.bestStroke.marks.some((m) => m.fromShear),
    'the paid wave reaches at least one shape the blade never touched',
  );

  // A second launch on the same stroke must NOT earn a second shear: the
  // forward cut is one per stroke, however fast the game runs.
  // Two ticks after launch only the first shape has been reached, so the
  // stroke has one direct contact and no shear yet.
  right.dash({ x: 0, y: -26, power: 26 / 35 });
  step(right, 2);
  assert.equal(right.state.throughcuts, 0, 'one direct contact is not enough');
  right.dash({ x: 0, y: -26, power: 26 / 35 });
  step(right, 60);
  const r = right.state;
  assert.equal(r.shots, 2);
  assert.ok(r.throughcuts <= 1, 'a redirect cannot re-earn the shear on the same stroke');

  // A new empty stroke never overwrites the printed route.
  const snap = structuredClone(s.bestStroke);
  left.dash({ x: 0, y: -12, power: 0.35 });
  step(left, 3);
  assert.deepEqual(left.state.bestStroke, snap);
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
      // Run until the shear has landed or world time runs out. Measuring in
      // WALL ticks would be measuring the tempo change: the same flight now
      // resolves in about half the frames.
      const clockAtLaunch = g.world.clock;
      while (!g.state.throughcuts && g.world.clock - clockAtLaunch < 70) g.tick();
      assert.equal(g.state.throughcuts, 1, `seed ${seed}: no shear inside 70 ticks of flight`);
      // The shear pays a plate the blade never touched. With the short
      // decision beat the wave can also catch a third shape, so look for ANY
      // sheared plate rather than a fixed index.
      const sheared = g.state.bestStroke.marks.filter((m) => m.fromShear);
      assert.ok(sheared.length >= 1, `seed ${seed}: no sheared plate`);
      assert.ok(sheared.some((m) => m.kind === 'bastion'), `seed ${seed}: shear missed the plate`);
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

test('charging needs one full-size contact plus a second of any kind; chips alone can never charge it, and a wave never charges itself', () => {
  const stroke = beginStroke({ x: 9, y: 2 }, -0.67, 1),
    e = { kind: 'fang', small: true, x: 1, y: 2, r: 19, angle: 0 };
  // THE GUARD: chips alone can never charge the shear, however many you cut.
  // A Fork's two children must not farm the move for one plate.
  for (let i = 0; i < 3; i++) assert.equal(printKill(stroke, e, 45, false, -0.4, 1).release, false);
  // A wave victim never counts toward charging a wave.
  e.small = false;
  assert.equal(printKill(stroke, e, 100, true, -0.4, 1).release, false);
  // One full-size contact is not enough on its own -- it needs a second contact.
  assert.equal(printKill(stroke, e, 100, false, -0.4, 1).release, true);
  // ...which the three chips above supplied, so this fires ONCE and never again:
  // the latch is one release per stroke.
  for (let i = 0; i < 40; i++)
    assert.equal(printKill(stroke, e, 100, false, -0.4, 1).release, false);
  // 3 chips (135) + 42 full-size (4200) + one release bonus (300) = 4635.
  // The old rule released on the 43rd full-size kill; this one releases on the
  // 42nd because the chips contribute to the contact count. Kills are 45 either
  // way (42 full + 3 chips, with the wave victim scoring separately).
  assert.equal(stroke.points, 3 * 45 + 42 * 100 + SHEAR.bonus);
  assert.equal(stroke.marks.length, 8);
  assert.equal(stroke.kills, 45);
  e.x = 10000;
  assert.equal(stroke.marks[0].x, 1, 'print samples are values, not live actor refs');
});

test('the shear stays unreachable if a stroke never lands a full-size contact', () => {
  // The other half of the guard: no amount of chip-cutting can substitute for
  // a real hit. This is what stops one plate farming the move.
  const stroke = beginStroke({ x: 0, y: 0 }, 0, 1),
    e = { kind: 'fang', small: true, x: 1, y: 2, r: 19, angle: 0 };
  for (let i = 0; i < 50; i++) assert.equal(printKill(stroke, e, 45, false, 0, 1).release, false);
  assert.equal(stroke.released, false);
  assert.equal(stroke.contacts, 50);
  assert.equal(stroke.primaries, 0);
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
