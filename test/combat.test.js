import test from 'node:test';
import assert from 'node:assert/strict';
import Matter from 'matter-js';
import { createCombat, hazardHits, sweepDistance } from '../src/slasher.js';
import { createPhysics, destroyPhysics, launch } from '../src/physics.js';
import { createRun } from '../src/run.js';
import { TYPES } from '../src/shapes.js';

function field(t) {
  const w = createPhysics({ spawn: { x: 0, y: 0 } }),
    c = createCombat(w);
  t.after(() => {
    c.dispose();
    destroyPhysics(w);
  });
  return {
    w,
    c,
    add: (kind, x = 220, y = 0) =>
      c.add({ kind, x, y, id: kind, slot: 0, home: 'lab', phase: 0, delay: 0 }),
  };
}
for (const [kind, expected] of [
  ['prism', 1],
  ['pulse', 1],
  ['crown', 10],
  ['fang', 0],
  ['rift', 0],
])
  test(`${kind} warns before its specific attack and commits to the advertised aim`, (t) => {
    const { c, w, add } = field(t),
      e = add(kind);
    c.move(1, 2);
    assert.equal(e.mode, 'tell');
    const { aim, span, tx, ty } = e;
    assert.ok(span>=66, 'a committed special gives at least 1.1 seconds at full speed');
    Matter.Body.setPosition(w.player, { x: 105, y: 180 });
    for (let i = 1; i < span; i++) c.move(1, 2);
    assert.equal(e.mode, 'tell');
    assert.equal(c.hazards.length, 0);
    c.move(1, 2);
    assert.equal(c.hazards.length, expected);
    if (kind === 'fang') {
      assert.equal(e.mode, 'rush');
      const { x, y } = e;
      c.move(1, 2);
      assert.ok(Math.abs(Math.atan2(e.y - y, e.x - x) - aim) < 1e-6);
    }
    if (kind === 'rift') {
      assert.equal(e.x, tx);
      assert.equal(e.py, ty);
      assert.equal(e.px, e.x, 'teleport must not lerp through the old position');
    }
    if (kind === 'pulse') {
      const h = c.hazards[0],
        r = h.radius;
      c.attacks(0.15, () => {});
      assert.ok(h.radius > r && h.radius < r + 1);
    }
    if (kind === 'prism') assert.equal(c.hazards[0].angle, aim);
    if (kind === 'crown') assert.equal(new Set(c.hazards.map((h) => h.angle)).size, 10);
  });
test('Well pulls an airborne cube inside its drawn field, not a distant one', (t) => {
  const { w, c, add } = field(t);
  add('well', 150);
  launch(w, { x: 0, y: -1 });
  c.move(1, 1);
  assert.ok(w.player.velocity.x > 0);
  Matter.Body.setPosition(w.player, { x: -400, y: 0 });
  const vx = w.player.velocity.x;
  c.move(1, 1);
  assert.equal(w.player.velocity.x, vx);
});
test('rings have a safe interior; needle and beam sweeps catch inter-tick crossings', () => {
  const origin = { x: 0, y: 0 };
  const ring = { kind: 'ring', px: 0, py: 0, x: 0, y: 0, radius: 164, previousRadius: 160 };
  assert.equal(hazardHits(ring, origin, origin), false);
  assert.ok(hazardHits(ring, { x: 190, y: 0 }, { x: 130, y: 0 }));
  assert.equal(
    hazardHits(ring, { x: 205, y: 0 }, { x: 185, y: 0 }),
    false,
    'already outside and outrunning the front',
  );
  assert.ok(hazardHits({ kind: 'needle', px: 80, py: 0, x: -80, y: 0 }, origin, origin));
  assert.equal(
    sweepDistance({ x: 0, y: -50 }, { x: 0, y: 50 }, { x: -300, y: 0 }, { x: 300, y: 0 }),
    0,
  );
  assert.equal(
    sweepDistance({ x: 60, y: 52 }, { x: 70, y: 60 }, { x: -300, y: 0 }, { x: 300, y: 0 }),
    52,
  );
});
test('linked Prisms have a full nonlethal tell, one hit per discharge and no beam after either endpoint dies', (t) => {
  const { c, add } = field(t),
    a = add('prism', -170),
    b = c.add({ kind: 'prism', x: 170, y: 0, id: 'second', home: 'lab', slot: 1 });
  let hits = 0;
  const cells = new Map([['lab', { link: { a: a.id, b: b.id, period: 176 } }]]);
  const tick = () => c.linkAttacks(cells, 1, () => hits++);
  for (let i = 0; i < 39; i++) tick();
  assert.equal(c.links[0].mode, 'tell');
  for (let i = 0; i < 77; i++) tick();
  assert.equal(hits, 0);
  tick();
  assert.equal(c.links[0].mode, 'live');
  assert.equal(hits, 1);
  tick();
  assert.equal(hits, 1);
  c.remove(a);
  tick();
  assert.equal(c.links.length, 0);
  for (let i = 0; i < 180; i++) tick();
  assert.equal(hits, 1);
});

function isolated(t) {
  const events = [],
    g = createRun(774, (k, d) => events.push([k, d]));
  t.after(() => g.dispose());
  for (const e of g.combat.enemies.values()) g.combat.remove(e);
  return {
    g,
    s: g.state,
    events,
    spawn: (kind, x = 0, y = -50) =>
      g.combat.add({ kind, x, y, phase: 0, delay: 999, id: `test-${kind}`, slot: -1, home: 'lab' }),
  };
}
const up = { x: 0, y: -8, power: 8 / 35 };
test('one rush only removes one plate, even with blade + body and sustained contact; second cut scores once', (t) => {
  const { g, s, spawn, events } = isolated(t),
    b = spawn('bastion');
  g.dash(up);
  g.tick();
  assert.equal(b.hp, 1);
  for (let i = 0; i < 5; i++) g.tick();
  assert.equal(b.hp, 1);
  assert.equal(s.kills, 0);
  assert.equal(s.score, 0);
  g.dash(up);
  g.tick();
  assert.equal(s.kills, 1);
  assert.equal(s.score, TYPES.bastion.points);
  assert.equal(events.filter(([k]) => k === 'cut').length, 1);
  assert.ok(!g.combat.enemies.has(b.id));
});
test('a blade reaching past the cube splits a concave Fork once, yielding two real smaller Fangs', (t) => {
  const { g, spawn, s } = isolated(t),
    fork = spawn('fork', 0, -87);
  assert.ok(fork.body.parts.length > 2);
  g.dash(up);
  g.tick();
  assert.equal(s.kills, 1);
  assert.equal(s.edge, 3);
  assert.ok(!g.combat.enemies.has(fork.id));
  const kids = [...g.combat.enemies.values()];
  assert.equal(kids.length, 2);
  assert.ok(kids.every((e) => e.kind === 'fang' && e.small && e.r < TYPES.fang.r));
});
test('Overdrive pierces a three-plate Crown, pays its doubled score and repairs a damaged hull', (t) => {
  const { g, spawn, s, events } = isolated(t);
  s.drive = 50;
  s.hp = 1;
  spawn('crown');
  g.dash(up);
  g.tick();
  assert.equal(s.hp, 2);
  assert.equal(s.score, 2 * TYPES.crown.points);
  assert.ok(events.some(([k]) => k === 'repair'));
});
for (const [label, age, angle, expectHit] of [
  ['new dash', 0, -Math.PI / 2, false],
  ['cut into needle', 16, Math.PI / 2, false],
  ['running with needle', 16, -Math.PI / 2, true],
])
  test(`needle counter: ${label}`, (t) => {
    const { g, s, events } = isolated(t);
    g.dash(up);
    s.parry = Math.max(0, 10 - age);
    g.combat.hazards.push({
      kind: 'needle',
      source: 'prism',
      x: 0,
      y: -8,
      px: 0,
      py: -8,
      angle,
      vx: 0,
      vy: Math.sin(angle) * 3,
      age: 0,
      life: 60,
    });
    g.tick();
    assert.equal(s.hp, expectHit ? 2 : 3);
    assert.ok(events.some(([k]) => k === (expectHit ? 'hurt' : 'parry')));
  });
test('unarmed contact breaks the chain and grants temporary hull immunity; three separate hits end the run once', (t) => {
  const { g, s, events, spawn } = isolated(t);
  spawn('bastion', 0, -8);
  g.dash(up);
  s.blade = 0;
  s.chain = 4;
  s.chainTime = 90;
  g.tick();
  assert.equal(s.hp, 2);
  assert.equal(s.chain, 0);
  assert.ok(!g.hurt('Bastion'));
  s.invul = 0;
  g.hurt('Pulse wave');
  assert.equal(s.hp, 1);
  s.invul = 0;
  g.hurt('Red needle');
  assert.equal(s.phase, 'dying');
  for (let i = 0; i < 90; i++) g.tick();
  assert.equal(s.phase, 'over');
  assert.equal(s.cause, 'Red needle');
  assert.equal(events.filter(([k]) => k === 'over').length, 1);
  assert.equal(g.dash(up), false);
});

test('during the first staged sector, nearby Fangs take turns telling and lunging', (t) => {
  const { c } = field(t);
  for (let i = 0; i < 3; i++)
    c.add({ id: `early-${i}`, kind: 'fang', x: 110 + i * 40, y: -85, gentle: true, delay: 0 });
  const turns = new Set();
  for (let i = 0; i < 280; i++) {
    c.move(1, 1);
    const engaged = [...c.enemies.values()].filter((e) => e.mode !== 'idle');
    assert.ok(engaged.length <= 1);
    if (engaged.length) {
      turns.add(engaged[0].id);
      assert.ok(engaged[0].span >= 50);
    }
  }
  assert.ok(turns.size >= 2);
});
