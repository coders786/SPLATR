import test from 'node:test';
import assert from 'node:assert/strict';
import Matter from 'matter-js';
import { createRun } from '../src/run.js';
import {
  ARC,
  arcPath,
  magnetize,
  panicScale,
  panicWindow,
  predictAim,
  speedBand,
  speedInk,
  speedRgb,
  threatAhead,
} from '../src/aim.js';
import { MAX_SPEED, RELEASE_GRAVITY, projectilePoint } from '../src/physics.js';
import { PLAYER_SIZE } from '../src/levels.js';

const advance = (g, n) => {
  for (let i = 0; i < n; i++) g.tick();
};
const enemy = (id, kind, x, y, extra = {}) => ({ id, kind, x, y, r: 34, hp: 1, px: x, py: y, vx: 0, vy: 0, ...extra });
const stand = (foes = [], extra = {}) => ({
  enemies: new Map(foes.map((e) => [e.id, e])),
  hazards: [],
  links: [],
  ...extra,
});

test('the release parabola is the real ballistic curve and stops at the first surface', () => {
  const start = { x: 0, y: 0 },
    v = { x: 13, y: -27, power: 27 / MAX_SPEED },
    open = arcPath(start, v, { geometry: [], line: 9000 });
  assert.equal(open.end, null);
  const t = 40,
    q = projectilePoint(start, v, t),
    want = { x: v.x * t, y: v.y * t + 0.5 * RELEASE_GRAVITY * t * t };
  assert.ok(Math.abs(q.x - want.x) < 1e-9 && Math.abs(q.y - want.y) < 1e-9);
  assert.ok(open.points.some((p) => Math.abs(p.x - want.x) < 1e-9 && Math.abs(p.y - want.y) < 1e-9));
  // A wall the cube's inscribed half-width would hit stops the arc AT it.
  const wall = { x: -200, y: -300, w: 400, h: 20 },
    blocked = arcPath(start, v, { geometry: [wall], line: 9000 });
  assert.equal(blocked.end.kind, 'wall');
  // Rising into the underside: contact is on the padded bottom face, and it
  // is the FIRST such contact, not a point already inside the slab.
  assert.ok(blocked.end.y > wall.y && blocked.end.y <= wall.y + wall.h + PLAYER_SIZE / 2 + 1e-6);
  assert.deepEqual(blocked.points.at(-1), { x: blocked.end.x, y: blocked.end.y });
  const side = arcPath(start, { x: 30, y: 0, power: 1 }, { geometry: [{ x: 120, y: -60, w: 30, h: 120 }], line: 9000 });
  assert.equal(side.end.kind, 'wall');
  assert.ok(Math.abs(side.end.x - (120 - PLAYER_SIZE / 2)) < 1e-6);
  const tide = arcPath(start, v, { geometry: [], line: -420 });
  assert.equal(tide.end.kind, 'tide');
  assert.ok(tide.end.y <= -420);
  assert.equal(arcPath(start, { x: 0, y: 0, power: 0 }, {}).points.length, 0);
  assert.ok(open.points.length * ARC.step <= ARC.maxTicks, 'preview is bounded');
});

test('speed reads cyan to crimson to white, in three named bands, without a legend', () => {
  const cool = speedRgb(0),
    mid = speedRgb(0.45),
    hot = speedRgb(0.7),
    max = speedRgb(1);
  assert.ok(cool[1] > cool[0] && cool[2] > cool[0], 'low speed is cyan: green/blue dominate');
  assert.ok(hot[0] > hot[1] && hot[0] > hot[2], 'high speed is crimson: red dominates');
  assert.ok(max.every((v) => v >= 235) && max[1] > hot[1] + 60, 'terminal velocity adds white');
  assert.ok(mid[0] > cool[0] && mid[2] < cool[2], 'the middle of the pull has already left cyan');
  assert.equal(new Set([speedInk(0), speedInk(0.4), speedInk(1)]).size, 3);
  assert.deepEqual([0.1, 0.5, 0.9].map(speedBand), ['easy', 'strong', 'lethal']);
  assert.equal(speedInk(-1), speedInk(0));
  assert.equal(speedInk(4), speedInk(1));
});

test('the magnetic corridor catches a near miss and bends the release toward the centre, once', () => {
  const start = { x: 0, y: 0 },
    v = { x: 0, y: -30, power: 30 / MAX_SPEED },
    e = enemy('a', 'prism', 14, -300),
    c = stand([e]);
  // Straight up, 14 px to the side of a 34 px target: inside the corridor.
  const caught = magnetize(start, v, c, {});
  assert.equal(caught.lock.id, 'a');
  assert.ok(Math.abs(Math.hypot(caught.x, caught.y) - 30) < 1e-6, 'speed is preserved');
  assert.ok(caught.x > 0.2 && Math.abs(caught.x) < Math.hypot(caught.x, caught.y) * 0.4);
  assert.ok(caught.x < 14, 'the bend is a nudge toward centre, not a teleport to it');
  // Far outside it, nothing happens and no lock is reported.
  // Corridor radius (19) + target radius (34): 48 px off-axis is still in.
  const wide = magnetize(start, v, stand([enemy('b', 'prism', 54, -300)]), {});
  assert.equal(wide.lock, null);
  assert.deepEqual([wide.x, wide.y], [v.x, v.y]);
  // Behind the player is never a lock.
  assert.equal(magnetize(start, v, stand([enemy('c', 'prism', 0, 240)]), {}).lock, null);
  // Two shapes on the corridor: the NEAREST honest surface is the lock, so
  // a plate in front of a Prism never advertises the Prism behind it.
  const front = enemy('f', 'bastion', 0, -160, { hp: 2 }),
    behind = enemy('g', 'prism', 0, -320),
    blocked = magnetize(start, v, stand([front, behind]), {});
  assert.equal(blocked.lock.id, 'f');
  // Focus widens the corridor; small fork offspring never magnetise.
  assert.equal(magnetize(start, v, stand([enemy('s', 'fang', 30, -300, { small: true })]), {}).lock, null);
  const edge = enemy('e', 'prism', 22, -300);
  assert.equal(magnetize(start, v, stand([edge]), {}).lock.id, 'e');
});

test('a locked aim reports a real first surface; clear sky reports nothing', () => {
  const g = createRun(19),
    target = g.nearest();
  try {
    const aim = g.aimAt(target),
      before = predictAim(g, aim, {}),
      shot = magnetize(g.world.player.position, aim, g.combat, {});
    assert.equal(shot.lock.id, target.id);
    const after = predictAim(g, { ...shot }, {});
    assert.equal(after.lock.id, target.id);
    assert.equal(after.reach, ARC.reach);
    assert.ok(after.power > 0 && after.power <= 1);
    assert.ok(after.path.length > 4);
    // Skyward: no target, no lock, and therefore no free extra reach. The
    // Redline is still a real first surface and is reported as such.
    const sky = predictAim(g, { x: 2, y: -31, power: 31 / MAX_SPEED }, {});
    assert.equal(sky.lock, null);
    assert.equal(sky.reach, 0);
    assert.ok(!sky.end || sky.end.kind === 'tide');
    assert.equal(sky.hit, null);
    assert.ok(before.path.length > 0);
  } finally {
    g.dispose();
  }
});

test('the panic ray only fires for a fast, untouched cube pointed at a hazard or a wall', () => {
  const w = {
    player: { position: { x: 0, y: 0 }, velocity: { x: 0, y: -30 } },
    grounded: false,
    geometry: []
  };
  assert.ok(threatAhead(w, stand([enemy('t', 'fang', 0, -90)]), w.player.velocity));
  assert.equal(threatAhead({ ...w, player: { ...w.player, velocity: { x: 0, y: -12 } } }, stand(), { x: 0, y: -12 }), null);
  // 200 ms at 60 Hz is a 12-tick ray: 30 px/tick sees 360 px ahead, so a
  // deck 300 px away is already imminent but one 500 px away is not.
  const wall = threatAhead({ ...w, geometry: [{ x: -300, y: -330, w: 600, h: 20 }] }, stand(), w.player.velocity);
  assert.equal(wall.kind, 'wall');
  assert.ok(wall.ticks <= ARC.ray + 1e-9, 'it is a 200 ms look-ahead, not a homing radar');
  assert.ok(wall.d <= 30 * ARC.ray + PLAYER_SIZE / 2 + 1e-9);
  assert.equal(
    threatAhead({ ...w, geometry: [{ x: -300, y: -560, w: 600, h: 20 }] }, stand(), w.player.velocity),
    null,
    'beyond 200 ms is not an emergency yet',
  );
  assert.equal(threatAhead(w, stand([enemy('away', 'fang', 0, 300)]), w.player.velocity), null);
    const needle = stand([], {
    hazards: [{ kind: 'needle', x: 0, y: -70, px: 0, py: -64, vx: 0, vy: 4, age: 3, life: 90, angle: 1.5 }],
  });
  assert.equal(threatAhead(w, needle, w.player.velocity).kind, 'needle');
  const spent = stand([], {
    hazards: [{ kind: 'ring', x: 0, y: -70, radius: 60, previousRadius: 56, spent: true }],
  });
  assert.equal(threatAhead(w, spent, w.player.velocity), null);
});

test('a touched cube is never panicked, a press ends the grace, and one launch grants at most two beats', () => {
  const g = createRun(42),
    s = g.state;
  try {
    // Fake the exact situation: airborne, untouched, aimed at a wall.
    g.world.geometry.push({ x: -400, y: -190, w: 800, h: 24 });
    g.dash({ x: 0, y: -31, power: 31 / MAX_SPEED });
    for (const e of g.combat.enemies.values()) g.combat.remove(e);
    for (let i = 0; i < 5 && !s.panic; i++) g.tick();
    assert.ok(s.panic, 'the forward wall starts a grace');
    assert.equal(s.panic.kind, 'wall');
    assert.equal(s.panicTicks, ARC.slowTicks);
    assert.equal(panicScale(s), 1, 'a first beat starts without a snap');
    advance(g, 5);
    assert.ok(panicScale(s) < 0.35, 'five ticks in, the grip is nearly full');
    assert.ok(g.world.engine.timing.timeScale < 0.5, 'time really slows');
    const focusBefore = s.focus;
    advance(g, 10);
    assert.equal(s.focus, focusBefore, 'automatic grace spends no focus meter');
    // Half a second of wall ticks, then back to the committed parabola.
    advance(g, ARC.slowTicks);
    assert.equal(s.panicTicks, 0);
    assert.equal(s.panic, null);
    assert.equal(panicScale(s), 1);
    // At most two threats per launch.
    s.panicGrants = ['wall:a', 'wall:b'];
    g.tick();
    assert.equal(s.panicTicks, 0);
    // A press ends an active grace immediately.
    s.panicGrants = [];
    s.panicTicks = 12;
    s.panic = { kind: 'wall', x: 0, y: -100, ux: 0, uy: -1, ticks: 12, born: 0 };
    g.focus(true);
    assert.equal(s.panicTicks, 0, 'a press is the escape');
    assert.equal(s.panic, null);
  } finally {
    g.dispose();
  }
  // An opened lens is requested by the state the camera reads.
  const k = createRun(42);
  try {
    k.world.geometry.push({ x: -400, y: -190, w: 800, h: 24 });
    k.dash({ x: 0, y: -31, power: 31 / MAX_SPEED });
    for (const e of k.combat.enemies.values()) k.combat.remove(e);
    k.tick();
    assert.ok(panicWindow(k, true) === null);
    assert.equal(k.state.panicTicks, 0);
  } finally {
    k.dispose();
  }
});

test('the tide itself is a forward threat, but a shape the blade still reaches is not', () => {
  const w = {
    player: { position: { x: 0, y: 0 }, velocity: { x: 0, y: 18 } },
    grounded: false,
    geometry: [],
  };
  // 30 px/tick covers the 73 px gap to the padded stripe in 2.4 ticks, well
  // inside the 200 ms window; 18 px/tick would take 3.8 and misses the ray.
  const fast = { ...w, player: w.player },
    quick = { ...fast, player: { ...w.player, velocity: { x: 0, y: 30 } } };
  const falling = threatAhead(quick, stand(), quick.player.velocity, { line: 89 });
  assert.equal(falling.kind, 'tide');
  assert.ok(falling.ticks <= 6 && falling.ticks > 0);
  assert.equal(
    threatAhead({ ...quick, player: { ...quick.player, velocity: { x: 0, y: 12 } } }, stand(), { x: 0, y: 12 }, { line: 200 }),
    null,
    'far below is not imminent, and neither is a gentle drift',
  );
  assert.equal(threatAhead(w, stand(), w.player.velocity, { line: 84 }), null, 'slow fall is not a panic');
  // A shape inside the forward ray is a crash unless the blade outlives the
  // flight to it. 70 px at 32 px/tick is 2.2 ticks of travel.
  const ahead = enemy('near', 'fang', 0, -70),
    diving = { world: { ...w, player: { ...w.player, velocity: { x: 0, y: -32 } } } };
  diving.state = 'shape';
  assert.equal(
    threatAhead(diving.world, stand([ahead]), diving.world.player.velocity, { blade: 14 }),
    null,
    'a live blade cuts it',
  );
  assert.equal(
    threatAhead(diving.world, stand([ahead]), diving.world.player.velocity, { blade: 1 }).kind,
    'shape',
  );
  // Rising away: a shape below the cube is not in front of it.
  assert.equal(
    threatAhead(w, stand([enemy('under', 'fang', 0, 80)]), w.player.velocity, { blade: 0 }),
    null,
  );
});

test('the grip eases in and out and never overshoots a committed launch', () => {
  const g = createRun(42),
    s = g.state;
  try {
    g.world.geometry.push({ x: -400, y: -190, w: 800, h: 24 });
    g.dash({ x: 0, y: -31, power: 31 / MAX_SPEED });
    for (const e of g.combat.enemies.values()) g.combat.remove(e);
    for (let i = 0; i < 8 && !s.panic; i++) g.tick();
    const grips = [s.panicWarm];
    for (let i = 0; i < 6; i++) {
      g.tick();
      grips.push(s.panicWarm);
    }
    assert.ok(grips[0] <= 2 && grips[5] >= 5, 'the beat eases in');
    assert.ok(g.state.panicTicks <= ARC.slowTicks);
  } finally {
    g.dispose();
  }
});

test('panic never arms in the cutting room, on the ground, or with motion off', () => {
  const room = createRun(42, () => {}, { warmup: true });
  try {
    room.dash(room.suggestion());
    for (let i = 0; i < 20; i++) room.tick();
    assert.equal(room.state.panicTicks, 0);
    assert.equal(panicWindow(room, false, true), null);
  } finally {
    room.dispose();
  }
  const w = {
      player: { position: { x: 0, y: 0 }, velocity: { x: 0, y: -30 } },
      grounded: true,
      geometry: [{ x: -300, y: -120, w: 600, h: 20 }],
    },
    grounded = { world: w, state: { phase: 'playing', opening: null, held: false, panic: null, panicTicks: 0, panicGrants: [] }, combat: stand() };
  assert.equal(panicWindow(grounded, false, true), null);
  w.grounded = false;
  assert.ok(panicWindow(grounded, false, true));
  grounded.state.panicGrants = [];
  assert.equal(panicWindow(grounded, false, false), null, 'reduced motion opts out of automatic slow time');
});

test('Matter owns the real impulse: the arc only promises what the launch can deliver', () => {
  const g = createRun(19),
    target = g.nearest(),
    aim = magnetize(g.world.player.position, g.aimAt(target), g.combat, {});
  try {
    const before = g.world.player.position,
      beforeTick = g.world.clock,
      wasSlow = g.world.slow;
    assert.ok(g.dash({ ...aim, lock: 'fake' }));
    assert.ok(Math.abs(g.world.clock - beforeTick) < 1e-9);
    assert.equal(g.world.slow, wasSlow);
    assert.ok(Math.abs(Math.hypot(g.world.player.velocity.x, g.world.player.velocity.y) - Math.hypot(aim.x, aim.y)) < 1e-6);
    assert.ok(Math.abs(g.world.player.velocity.x - aim.x) < 0.7);
    // Lock reach is real but modest, and stays with THIS launch only.
    advance(g, 2);
    assert.ok(g.state.reach > 1 && g.state.reach < 1.2);
    Matter.Body.setVelocity(g.world.player, { x: 0, y: 0 });
    for (let i = 0; i < 40; i++) g.tick();
    assert.equal(g.state.reach, 1.12, 'the wider blade is a property of this launch');
    // The next, unassisted launch starts at ordinary reach again.
    g.dash({ x: 0, y: -30, power: 30 / MAX_SPEED });
    g.tick();
    assert.equal(g.state.reach, 1);
    assert.ok(g.world.player.position.x >= before.x - 40);
  } finally {
    g.dispose();
  }
});
