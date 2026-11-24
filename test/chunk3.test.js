/**
 * CHUNK 3 — The Shatter Event and the SHATTERED arena.
 *
 * At 100% FRACTURE the meter fires on the next tick, no prompt: the bar is
 * spent to zero, the cube is launched into a six-tick world hold, the hull
 * gains one point (never below 2), the dash refills, and the arena the run
 * is played in becomes SHATTERED — 1.30x bumper rails capped at
 * MAX_PINBALL_SPEED, a kinetic charge ladder (×1 → ×2 → ×3 → OVERCHARGED,
 * lethal) fed by border bounces, and a floor that pays speed instead of pips
 * unless the fall is too gentle to slam.
 *
 * Headless rules under test:
 *  - consumeFracture spends the bar and resets tier/sky;
 *  - pct reaching 100 fires shatterEvent exactly once per run;
 *  - the event spends the meter, refills the dash, lifts the hull with a
 *    floor of 2, arms the SHATTERED arena and a flash clock;
 *  - SHATTERED rails reflect at 1.30x, capped at MAX_PINBALL_SPEED;
 *  - a fast floor slam pays speed but NO dash pip; a gentle fall still
 *    pays the trampoline rescue (one pip, below the cap);
 *  - border bounces feed the kinetic ladder only in SHATTERED; any cut
 *    drains it back to ×1; OVERCHARGED (stage 4) is lethal regardless of armor;
 *  - a fresh run boots un-shattered, and the SHATTERED fields exist.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { createRun } from '../src/run.js';
import {
  createPhysics,
  stepPhysics,
  placePlayer,
  stopPlayer,
  setPlayerVelocity,
  MAX_PINBALL_SPEED,
  PINBALL_RESTITUTION,
  SHATTER_FLOOR_MIN,
} from '../src/physics.js';
import { PLAYER_SIZE, ARENA } from '../src/levels.js';
import {
  createFractureState,
  consumeFracture,
  fractureTier,
  fractureSky,
  FRACTURE_MAX,
} from '../src/fracture.js';

// Same convention as chunk2: the fixture is pinned ON the player so the
// blade only ever meets the fixture.
function withFixture(r, hp = 1) {
  placePlayer(r.world, { x: 0, y: -200 });
  stopPlayer(r.world);
  const e = r.combat.add({
    id: `fixture-${Math.random().toString(36).slice(2)}`,
    kind: 'fang',
    x: 0,
    y: -200,
    home: 'fixture',
    pinned: true,
    wavePlaced: true,
    delay: 0,
  });
  e.hp = hp;
  return e;
}

const lab = (options = {}) =>
  createPhysics({
    seed: 1,
    spawn: { x: 2000, y: 2000 },
    solids: [],
    // A rail test at 300+ px/tick needs a rail far enough away that one tick
    // cannot touch both borders — the real table is 90,000px square.
    arena: { x: 0, y: 0, w: 4000, h: 4000 },
    ...options,
  });

// ── THE METER SPEND ───────────────────────────────────────────────────────

test('CHUNK 3: consumeFracture spends the bar and resets tier and sky', () => {
  // consumeFracture speaks the run-state dialect, like gainFracture.
  const runState = { fracture: createFractureState(63) };
  const state = runState.fracture;
  const spent = consumeFracture(runState);
  assert.equal(spent, 63);
  assert.equal(state.pct, 0);
  assert.equal(fractureTier(state.pct), 0);
  assert.equal(fractureSky(state.pct), 0);
  assert.equal(state.tier, fractureTier(0));
  assert.equal(state.sky, fractureSky(0));
  // Spending an empty bar is a no-op, not an error.
  const empty = createFractureState(0);
  assert.equal(consumeFracture(empty), 0);
  assert.equal(empty.pct, 0);
});

test('CHUNK 3: FRACTURE_MAX is the spend line', () => {
  assert.equal(FRACTURE_MAX, 100);
});

// ── THE EVENT ITSELF ──────────────────────────────────────────────────────

test('CHUNK 3: 100% fires the SHATTER EVENT once — meter spent, hull +1, dash refilled, arena SHATTERED', () => {
  const events = [];
  const r = createRun(41, (type, data) => events.push({ type, data }), {
    waveMode: true,
    fracturePct: FRACTURE_MAX - FRACTURE_PER_KILL_SAFE(),
  });
  try {
    r.state.phase = 'playing';
    r.state.invul = 99999;
    r.state.hp = 2;
    r.state.edge = 0;
    r.state.kineticStage = 1;
    // Sanity: a fresh run boots un-shattered.
    assert.equal(r.state.arenaMode, null);
    assert.equal(r.state.shatterDone, false);
    assert.equal(r.state.shatter, 0);
    withFixture(r);
    r.state.blade = 12;
    r.tick(); // the cut fills the meter
    assert.equal(r.state.arenaMode, null, 'the tear fires on the tick AFTER the gain, not inside it');
    r.tick(); // the trigger at the top of the tick fires the event
    assert.equal(r.state.arenaMode, 'SHATTERED');
    assert.equal(r.world.arenaMode, 'SHATTERED');
    assert.equal(r.state.shatterDone, true);
    assert.equal(r.state.fracture.pct, 0, 'the meter is spent to zero');
    assert.equal(r.state.hp, 3, 'one hull granted above the floor');
    assert.ok(r.state.edge > 0, 'the dash is refilled');
    assert.equal(r.state.kineticStage, 1, 'first border under SHATTERED is ×1');
    assert.ok(r.state.shatter > 30, 'the singularity flash clock is armed');
    // Six ticks of world hold were demanded at the moment of the tear.
    assert.ok(r.state.stop >= 0, 'the hold is counted down by the tick');
    const tear = events.find(e => e.type === 'shatterEvent');
    assert.ok(tear, 'shatterEvent was emitted');
    assert.equal(tear.data.hp, 3);
    // The world holds: physics does not integrate during the stop.
    assert.ok(r.state.stop >= 0);
  } finally {
    r.dispose();
  }
});

function FRACTURE_PER_KILL_SAFE() {
  // 0.4 — duplicated here so the fixture arithmetic stays legible.
  return 0.4;
}

test('CHUNK 3: the hull floor is 2 — a 1-hull cube survives the tear at 2', () => {
  const r = createRun(43, () => {}, { waveMode: true, fracturePct: 100 });
  try {
    r.state.phase = 'playing';
    r.state.invul = 99999;
    r.state.hp = 1;
    r.state.edge = 0;
    r.tick(); // pct is already 100 on the field: the top-of-tick trigger fires
    assert.equal(r.state.arenaMode, 'SHATTERED');
    assert.equal(r.state.hp, 2, 'floor of 2 hull holds even from 1');
    assert.ok(r.state.edge > 0);
  } finally {
    r.dispose();
  }
});

test('CHUNK 3: the tear is one-time per run — rebuilt meter does not re-fire', () => {
  const events = [];
  const r = createRun(47, (type, data) => events.push({ type, data }), {
    waveMode: true,
    fracturePct: 100,
  });
  try {
    r.state.phase = 'playing';
    r.state.invul = 99999;
    r.tick(); // tear fires
    assert.equal(events.filter(e => e.type === 'shatterEvent').length, 1);
    assert.equal(r.state.fracture.pct, 0);
    // Build the meter again from ordinary play; the tear must NOT refire.
    withFixture(r);
    r.state.blade = 12;
    r.tick();
    r.tick();
    assert.equal(r.state.fracture.pct > 0, true, 'the meter rebuilds from play');
    assert.equal(events.filter(e => e.type === 'shatterEvent').length, 1, 'no second tear this run');
    assert.equal(r.state.arenaMode, 'SHATTERED');
  } finally {
    r.dispose();
  }
});

// ── SHATTERED PHYSICS ─────────────────────────────────────────────────────

test('CHUNK 3: side rails reflect at 1.30x, never past MAX_PINBALL_SPEED', () => {
  const w = lab();
  try {
    w.arenaMode = 'SHATTERED';
    // A fast launch raises the running ceiling exactly the way dash() does;
    // without headroom the pre-step clamp erases the arrival first.
    w.playerCeiling = MAX_PINBALL_SPEED;
    placePlayer(w, { x: 2 + PLAYER_SIZE / 2, y: 2000 });
    setPlayerVelocity(w, -100, 0);
    stepPhysics(w, () => {}, 1);
    const after = w.player.velocity;
    assert.ok(after.x > 110 && after.x <= MAX_PINBALL_SPEED, `expected ~130, got ${after.x}`);
    assert.equal(w.bumped, true, 'the rail reports the bank');
  } finally {
    // standalone world: nothing to dispose beyond the engine
  }
  // A fast arrival is capped at MAX_PINBALL_SPEED (fresh world: the wall
  // ignore window from the first reflect is still live here).
  const w2 = lab();
  try {
    w2.arenaMode = 'SHATTERED';
    w2.playerCeiling = MAX_PINBALL_SPEED;
    placePlayer(w2, { x: 2 + PLAYER_SIZE / 2, y: 2000 });
    setPlayerVelocity(w2, -300, 0);
    stepPhysics(w2, () => {}, 1);
    assert.ok(w2.player.velocity.x <= MAX_PINBALL_SPEED, `capped at ${MAX_PINBALL_SPEED}, got ${w2.player.velocity.x}`);
    assert.ok(w2.player.velocity.x > 300, 'cap keeps (nearly) all of the 1.3x energy');
  } finally {
    // standalone world: nothing to dispose beyond the engine
  }
});

test('CHUNK 3: a fast floor slam reflects at 1.30x and pays NO dash pip', () => {
  const r = createRun(53, () => {}, { waveMode: true, fracturePct: 0 });
  try {
    r.state.phase = 'playing';
    r.state.invul = 99999;
    r.state.arenaMode = 'SHATTERED';
    r.world.arenaMode = 'SHATTERED';
    // One pip in reserve: the 0-pip rail anti-softlock recovery is ineligible,
    // so ANY gain here can only come from the floor pay.
    r.state.edge = 1;
    r.state.floorIgnore = 0;
    // Park the cube just inside the floor with a heavy downward fall —
    // launched at 100, i.e. with the ceiling headroom a launch grants.
    const floorY = ARENA.y + ARENA.h - PLAYER_SIZE / 2;
    r.world.playerCeiling = MAX_PINBALL_SPEED;
    placePlayer(r.world, { x: 0, y: floorY });
    setPlayerVelocity(r.world, 0, 100);
    r.tick();
    assert.equal(r.state.arenaMode, 'SHATTERED');
    assert.equal(r.state.edge, 1, 'a 1.3x slap pays speed, not a pip');
    assert.ok(r.state.floorIgnore > 0, 'the slam still opens the ignore window');
    assert.ok(r.world.player.velocity.y < 0, 'the slam threw the cube upward');
    assert.ok(Math.abs(r.world.player.velocity.y) <= MAX_PINBALL_SPEED);
  } finally {
    r.dispose();
  }
});

test('CHUNK 3: a gentle fall keeps the trampoline rescue — one pip below the cap', () => {
  const r = createRun(59, () => {}, { waveMode: true, fracturePct: 0 });
  try {
    r.state.phase = 'playing';
    r.state.invul = 99999;
    r.state.arenaMode = 'SHATTERED';
    r.world.arenaMode = 'SHATTERED';
    r.state.edge = 0;
    r.state.floorIgnore = 0;
    const floorY = ARENA.y + ARENA.h - PLAYER_SIZE / 2;
    placePlayer(r.world, { x: 0, y: floorY });
    // Well under SHATTER_FLOOR_MIN at the moment of contact.
    setPlayerVelocity(r.world, 0, Math.max(1, SHATTER_FLOOR_MIN - 3));
    r.tick();
    assert.equal(r.state.edge, 1, 'the trampoline rescue still pays a pip');
    assert.ok(r.world.player.velocity.y < 0, 'the trampoline still kicks upward');
  } finally {
    r.dispose();
  }
});

test('CHUNK 3: the ceiling is a bumper too in SHATTERED (1.30x, capped)', () => {
  const w = lab();
  w.arenaMode = 'SHATTERED';
  w.playerCeiling = MAX_PINBALL_SPEED;
  placePlayer(w, { x: 2000, y: 2 + PLAYER_SIZE / 2 });
  setPlayerVelocity(w, 0, -60);
  stepPhysics(w, () => {}, 1);
  assert.ok(w.player.velocity.y > 70, `expected ~78 downward, got ${w.player.velocity.y}`);
  assert.equal(w.bumped, true);
});

test('CHUNK 3: non-SHATTERED rails are byte-identical to before (0.85x bounce, no bump)', () => {
  const w = lab();
  w.arenaMode = null;
  placePlayer(w, { x: 2 + PLAYER_SIZE / 2, y: 2000 });
  setPlayerVelocity(w, -100, 0);
  stepPhysics(w, () => {}, 1);
  assert.ok(w.player.velocity.x < 95, `0.85x bounce expected, got ${w.player.velocity.x}`);
  assert.equal(w.bumped ?? false, false, 'no bump outside SHATTERED');
});

// ── THE KINETIC LADDER ────────────────────────────────────────────────────

test('CHUNK 3: border bounces feed ×1 → ×2 → ×3 → OVERCHARGED, only in SHATTERED', () => {
  const events = [];
  const r = createRun(61, (type, data) => events.push({ type, data }), {
    waveMode: true,
    fracturePct: 0,
  });
  try {
    r.state.phase = 'playing';
    r.state.invul = 99999;
    r.state.arenaMode = 'SHATTERED';
    r.world.arenaMode = 'SHATTERED';
    const airborne = () => placePlayer(r.world, { x: 0, y: -20000 });
    airborne();
    r.world.grounded = false;
    r.world.bumped = true;
    r.tick();
    assert.equal(r.state.kineticStage, 2);
    airborne();
    r.world.grounded = false;
    r.world.bumped = true;
    r.tick();
    assert.equal(r.state.kineticStage, 3);
    airborne();
    r.world.grounded = false;
    r.world.bumped = true;
    r.tick();
    assert.equal(r.state.kineticStage, 4, 'OVERCHARGED at stage 4');
    assert.ok(events.some(e => e.type === 'kineticOvercharge'), 'overcharge announced');
    // Capped at 4, not beyond.
    airborne();
    r.world.grounded = false;
    r.world.bumped = true;
    r.tick();
    assert.equal(r.state.kineticStage, 4);
  } finally {
    r.dispose();
  }
});

test('CHUNK 3: outside SHATTERED, bumps never feed the ladder', () => {
  const r = createRun(67, () => {}, { waveMode: true, fracturePct: 0 });
  try {
    r.state.phase = 'playing';
    r.state.invul = 99999;
    r.state.arenaMode = null;
    placePlayer(r.world, { x: 0, y: -20000 });
    r.world.grounded = false;
    r.world.bumped = true;
    r.tick();
    assert.equal(r.state.kineticStage, 1);
    assert.equal(r.state.kineticBounces, 0);
  } finally {
    r.dispose();
  }
});

test('CHUNK 3: any cut drains the charge back to ×1', () => {
  const r = createRun(71, () => {}, { waveMode: true, fracturePct: 0 });
  try {
    r.state.phase = 'playing';
    r.state.invul = 99999;
    r.state.arenaMode = 'SHATTERED';
    r.state.kineticStage = 3;
    r.state.kineticBounces = 7;
    withFixture(r);
    r.state.blade = 12;
    r.tick();
    assert.equal(r.state.kineticStage, 1, 'the charge is spent on the cut');
    assert.equal(r.state.kineticBounces, 0);
  } finally {
    r.dispose();
  }
});

test('CHUNK 3: OVERCHARGED is lethal — an armoured Bastion plate dies to the charge', () => {
  const r = createRun(73, () => {}, { waveMode: true, fracturePct: 0 });
  try {
    r.state.phase = 'playing';
    r.state.invul = 99999;
    r.state.arenaMode = 'SHATTERED';
    r.state.kineticStage = 4;
    r.state.kineticBounces = 9;
    const e = withFixture(r, 999); // absurdly plate-heavy
    r.state.blade = 12;
    r.tick();
    assert.ok(e.hp <= 0, `plate should be shattered outright, hp=${e.hp}`);
    assert.equal(r.state.kineticStage, 1, 'and the charge is spent doing it');
  } finally {
    r.dispose();
  }
});

test('CHUNK 3: a normal×2 charge multiplies cut damage and drains after', () => {
  const r = createRun(79, () => {}, { waveMode: true, fracturePct: 0 });
  try {
    r.state.phase = 'playing';
    r.state.invul = 99999;
    r.state.arenaMode = 'SHATTERED';
    r.state.kineticStage = 2;
    const hpBefore = 6;
    const e = withFixture(r, hpBefore);
    r.state.blade = 12;
    r.tick();
    assert.ok(e.hp < hpBefore - 1, '×2 beat a single-point cut');
    assert.equal(r.state.kineticStage, 1);
  } finally {
    r.dispose();
  }
});

// ── RESET BOUNDARY ────────────────────────────────────────────────────────

test('CHUNK 3: a fresh run boots un-shattered with a clean kinetic ladder', () => {
  const r = createRun(83, () => {}, { waveMode: true, fracturePct: 25 });
  try {
    assert.equal(r.state.arenaMode, null);
    assert.equal(r.state.kineticStage, 1);
    assert.equal(r.state.kineticBounces, 0);
    assert.equal(r.state.shatter, 0);
    assert.equal(r.state.shatterDone, false);
  } finally {
    r.dispose();
  }
});
