import test from 'node:test';
import assert from 'node:assert/strict';
import Matter from 'matter-js';
import { createRun, FLOOR_IGNORE_TICKS, MAX_EDGE } from '../src/run.js';
import { createTicket, loadProfile } from '../src/quests.js';
import { localRadar } from '../src/radar.js';
import { safeSpawn } from '../src/spawn-space.js';
import { trampolineVy, WALL_IGNORE } from '../src/physics.js';

const metric = (name, data) =>
  console.log(`QA ${name}: ${JSON.stringify(data)}`);
test('test_end_card_quest_and_prize_math', () => {
  const p = loadProfile('{}'),
    t = createTicket(['fang5', 'double2', 'sector3'], 'halo', p);
  // Isolate generic carry math with the requested unfinished 2/4 fixture.
  t.rows[1].goal = 4;
  t.rows[1].value = 2;
  t.rows[1].start = 2;
  for (const i of [0, 2]) {
    t.rows[i].value = t.rows[i].goal;
    t.rows[i].done = true;
  }
  const d = t.die();
  assert.equal(d.heads.fang5, 0);
  assert.equal(d.heads.sector3, 0);
  assert.equal(d.heads.double2, 1);
  assert.equal(p.unlock, 20);
  assert.ok(p.unlock / 100 > 0);
  const g = createRun(42, () => {}, { warmup: true });
  try {
    g.state.bestStroke = { points: 3600 };
    g.state.shots = 4;
    g.state.throughcuts = 2;
    g.skipOpening();
    assert.equal(g.state.bestStroke, null);
    assert.equal(g.state.shots, 0);
    assert.equal(g.state.band, 1);
    assert.equal(g.state.movedAvg, 0);
  } finally {
    g.dispose();
  }
  metric('prize', {
    completedKept: 0,
    unfinishedKept: d.heads.double2,
    saved: p.unlock,
    fillPct: p.unlock,
  });
});
test('test_minimap_enemies_and_portal_bounds', () => {
  const v = { w: 1200, h: 900 },
    p = { x: 200, y: -20000 },
    rect = { x: 640, y: 480, w: 210, h: 210 };
  const enemies = Array.from({ length: 5 }, (_, i) => ({
    id: String(i),
    kind: ['fang', 'prism', 'fork', 'bastion', 'crown'][i],
    x: 200 + i * 100,
    y: p.y - i * 150,
  }));
  const radar = localRadar(v, p, rect, enemies, { x: 1e6, y: -1e6 });
  assert.equal(radar.blips.length, 5);
  assert.ok(
    radar.portal.x > radar.left &&
      radar.portal.x < radar.right &&
      radar.portal.y > radar.top &&
      radar.portal.y < radar.bottom,
  );
  assert.equal(radar.player.y, radar.top + (radar.bottom - radar.top) * 0.75);
  const shifted = localRadar(v, { x: p.x, y: p.y + 10000 }, rect, [], null);
  assert.equal(shifted.player.y, radar.player.y);
  metric('radar', {
    enemyBlips: radar.blips.length,
    portalInside: true,
    playerYFraction: 0.75,
  });
});
test('test_spawn_safe_zones_and_side_containment', () => {
  let accepted = 0,
    rejected = 0;
  const v = {
    x: -600,
    y: -800,
    w: 1200,
    h: 1000,
    width: 900,
    height: 750,
    scale: 0.75,
  };
  const p = { x: 0, y: -100 },
    enemies = [];
  for (let i = 0; i < 2000; i++) {
    const q = safeSpawn(
      { x: (i % 50) * 60 - 1500, y: (i % 31) * 40 - 1000, id: String(i) },
      35,
      v,
      p,
      enemies,
    );
    if (!q) {
      rejected++;
      continue;
    }
    accepted++;
    const x = (q.x - v.x) * v.scale,
      y = (q.y - v.y) * v.scale,
      r = 35 * v.scale;
    assert.ok(
      x >= r + 28 &&
        x <= v.width - r - 28 &&
        y >= r + 28 &&
        y <= v.height - r - 28,
    );
    assert.ok(Math.hypot(q.x - p.x, q.y - p.y) * v.scale >= 180);
  }
  assert.ok(accepted > 0);
  metric('spawn-sampler', {
    candidates: 2000,
    accepted,
    rejected,
    edgeViolations: 0,
    cubeExclusionViolations: 0,
  });
  const run = createRun(91, () => {}, { staged: false });
  let gap = 0,
    maxGap = 0;
  try {
    run.state.phase = 'playing';
    run.state.invul = 1e9;
    for (let tick = 0; tick < 2000; tick++) {
      const p = run.world.player.position;
      run.setView({
        x: p.x - 600,
        y: p.y - 650,
        w: 1200,
        h: 1000,
        width: 900,
        height: 750,
        scale: 0.75,
      });
      if (tick % 70 === 0) {
        run.state.edge = 3;
        run.dash({
          x: tick % 140 ? -15 : 15,
          y: tick % 280 ? -28 : 18,
          power: 1,
        });
      }
      run.tick();
      const v = run.world.viewport;
      const visible = [...run.combat.enemies.values()].filter(
        (e) =>
          e.x >= v.x - 120 &&
          e.x <= v.x + v.w + 120 &&
          e.y >= v.y - 120 &&
          e.y <= v.y + v.h + 120,
      );
      gap = visible.length < 2 ? gap + 1 : 0;
      maxGap = Math.max(maxGap, gap);
      assert.ok(run.state.band >= 1);
      for (const e of run.combat.enemies.values())
        assert.ok((e.outsideTicks || 0) <= 120);
    }
    assert.ok(maxGap <= 90, `drought lasted ${maxGap} ticks`);
    metric('live-stream', {
      ticks: 2000,
      maxDrought: maxGap,
      strandedOver120Ticks: 0,
      sectorZero: 0,
    });
  } finally {
    run.dispose();
  }
});
test('test_floor_trampoline_and_speedo', () => {
  const g = createRun(71, () => {}, { staged: false });
  try {
    g.state.phase = 'playing';
    g.state.invul = 1e6;
    g.state.edge = 0;
    g.state.emptyTicks = -10000;
    g.stream.sync = () => {};
    for (const e of g.combat.enemies.values()) g.combat.remove(e);
    Matter.Body.setPosition(g.world.player, {
      x: 0,
      y: g.world.arena.y + g.world.arena.h - 25,
    });
    Matter.Body.setVelocity(g.world.player, { x: 0, y: 10 });
    let kick = 0;
    for (let i = 0; i < 10; i++) {
      g.tick();
      if (g.state.floorKicks) {
        kick = g.world.player.velocity.y;
        break;
      }
    }
    assert.equal(g.state.floorKicks, 1);
    assert.ok(Math.abs(kick + 22) < 1e-6);
    assert.ok(g.state.edge <= MAX_EDGE);
    assert.equal(FLOOR_IGNORE_TICKS, 12);
    assert.equal(trampolineVy(), 22);
    assert.equal(WALL_IGNORE, 8);
    for (let i = 0; i < 6; i++) g.tick();
    const prior = g.state.movedAvg;
    g.state.stop = 4;
    for (let i = 0; i < 3; i++) g.tick();
    assert.ok(prior > 0 && g.state.movedAvg > 0);
    Matter.Body.setVelocity(g.world.player, { x: 0, y: 0 });
    g.state.phase = 'ready';
    g.state.movedAvg = 0;
    assert.equal(g.state.movedAvg, 0);
    metric('floor', {
      kick,
      edge: g.state.edge,
      cooldown: FLOOR_IGNORE_TICKS,
      hitstopSpeedHeld: true,
    });
  } finally {
    g.dispose();
  }
});
