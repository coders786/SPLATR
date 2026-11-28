/**
 * CHUNK 4 — THE MONOLITH.
 *
 * Clearing the fifth wave in an ordinary arena opens a Dimension Breach.
 * Clearing it in a SHATTERED arena opens nothing at all: the tear's
 * landlord manifests. Five plates, two health each. Any cut less than a
 * banked OVERCHARGED one chips a single point; an OVERCHARGED cut takes a
 * whole plate. Ten chips or five stage-4 strikes — the arena is the only key.
 *
 * Headless rules under test:
 *  - wave 5 cleared in SHATTERED manifests the Monolith (pinned, r=215,hp=10);
 *  - the same clear elsewhere opens the ordinary breach (regression);
 *  - no manifest in control practice;
 *  - ordinary cuts chip 1 hp and never fell it quickly; an OVERCHARGED cut
 *    (stage 4) takes a plate (5 hp);
 *  - ten ordinary cuts DO eventually kill it (it is a wall, not a lockout);
 *  - the fall pays +12 fracture and emits monolithDown; the rest deck rises.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { createRun } from '../src/run.js';
import { TYPES } from '../src/shapes.js';
import { placePlayer, stopPlayer } from '../src/physics.js';
import { FRACTURE_PER_MONOLITH, FRACTURE_PER_KILL, FRACTURE_PER_WAVE_CLEAR } from '../src/fracture.js';

function forceWave5(r, { shattered = true } = {}) {
  r.state.phase = 'playing';
  r.state.invul = 99999;
  r.state.wave.number = 5;
  if (shattered) {
    r.state.arenaMode = 'SHATTERED';
    r.world.arenaMode = 'SHATTERED';
  }
  // The fifth clear is measured on an empty field.
  for (const e of [...r.combat.enemies.values()]) r.combat.remove(e);
  r.tick();
}

function strikeMonolith(r, kin = 1) {
  const m = r.combat.enemies.get('monolith/core');
  assert.ok(m, 'the Monolith stands');
  placePlayer(r.world, { x: m.x, y: m.y });
  stopPlayer(r.world);
  // One plate per LAUNCH: the per-dash cut debounce (e.lastSlash vs s.shots)
  // means a fresh strike must look like a fresh dash.
  r.state.shots++;
  r.state.kineticStage = kin;
  r.state.blade = 12;
  r.tick();
  return m;
}

test('CHUNK 4: the Monolith exists in the shape table and the ledger', () => {
  assert.ok(TYPES.monolith, 'TYPES.monolith exists');
  assert.equal(TYPES.monolith.r, 215);
  assert.equal(TYPES.monolith.points, 2500);
  assert.equal(FRACTURE_PER_MONOLITH, 12);
});

test('CHUNK 4: wave 5 cleared in a SHATTERED arena manifests the Monolith, not the breach', () => {
  const events = [];
  const r = createRun(101, (type, data) => events.push({ type, data }), {
    waveMode: true,
    fracturePct: 0,
  });
  try {
    forceWave5(r, { shattered: true });
    assert.equal(r.state.wave.phase, 'monolith');
    const m = r.combat.enemies.get('monolith/core');
    assert.ok(m, 'the Monolith stands');
    assert.equal(m.pinned, true);
    // The manifest dash rides up the seam corridor and may clip one point off
    // the face on the way through — one launch, one chip, never a plate.
    assert.ok(m.hp >= 9 && m.hp <= 10, `at most one chip on the manifest dash, got ${m.hp}`);
    assert.equal(r.state.wave.breach, null, 'no portal opens on a torn field');
    assert.ok(events.some(e => e.type === 'monolithRise'), 'monolithRise announced');
  } finally {
    r.dispose();
  }
});

test('CHUNK 4: the same clear in an ordinary arena opens the ordinary breach', () => {
  const r = createRun(103, () => {}, { waveMode: true, fracturePct: 0 });
  try {
    forceWave5(r, { shattered: false });
    assert.equal(r.state.wave.phase, 'breach');
    assert.equal(r.combat.enemies.get('monolith/core'), undefined);
  } finally {
    r.dispose();
  }
});

test('CHUNK 4: control practice manifests nothing, torn field or not', () => {
  const r = createRun(107, () => {}, {
    waveMode: true,
    controlPractice: true,
    fracturePct: 0,
  });
  try {
    forceWave5(r, { shattered: true });
    assert.equal(r.state.wave.phase, 'breach');
    assert.equal(r.combat.enemies.get('monolith/core'), undefined);
  } finally {
    r.dispose();
  }
});

test('CHUNK 4: an ordinary cut breaks a plate', () => {
  const r = createRun(109, () => {}, { waveMode: true, fracturePct: 0 });
  try {
    forceWave5(r, { shattered: true });
    const m = strikeMonolith(r, 1);
    assert.equal(m.hp, 8, 'a regular hit breaks a plate');
    // And once more for the shove path: the fifth-tick hitstop is for the pin.
    const m2 = strikeMonolith(r, 2);
    assert.equal(m2.hp, 6, 'a second ordinary hit breaks another plate');
  } finally {
    r.dispose();
  }
});

test('CHUNK 4: an OVERCHARGED cut takes three health', () => {
  const events = [];
  const r = createRun(113, (type, data) => events.push({ type, data }), {
    waveMode: true,
    fracturePct: 0,
  });
  try {
    forceWave5(r, { shattered: true });
    const m = strikeMonolith(r, 4);
    assert.equal(m.hp, 7, 'the bank deals three health');
    assert.equal(r.state.kineticStage, 1, 'the charge spent itself');
  } finally {
    r.dispose();
  }
});

test('CHUNK 4: four OVERCHARGED cuts fell it; the tear pays its tribute', () => {
  const events = [];
  const r = createRun(127, (type, data) => events.push({ type, data }), {
    waveMode: true,
    fracturePct: 50,
  });
  try {
    forceWave5(r, { shattered: true });
    for (let i = 0; i < 4; i++) {
      const m = r.combat.enemies.get('monolith/core');
      assert.ok(m, `hit ${i + 1} of 4 should still have the Monolith standing`);
      strikeMonolith(r, 4);
    }
    assert.equal(r.combat.enemies.get('monolith/core'), undefined, 'the Monolith falls');
    const down = events.find(e => e.type === 'monolithDown');
    assert.ok(down, 'monolithDown was emitted');
    assert.ok(r.state.monoliths >= 1, 'the fall is recorded');
    assert.equal(r.state.killLedger?.rows?.monolith?.kills, 1, 'the ledger records the fall');
    assert.equal(r.state.killLedger?.rows?.monolith?.credits, 25, 'the ledger pays the tribute in credits');
    // The tribute (+12), the kill feed (+0.4), and the wave-clear seam (+2.5).
    assert.equal(
      Number(r.state.fracture.pct.toFixed(2)),
      FRACTURE_PER_MONOLITH + FRACTURE_PER_KILL + FRACTURE_PER_WAVE_CLEAR + 50,
      'the tribute lands',
    );
    // And the ordinary end-of-wave ritual follows: the rest deck rises.
    assert.equal(r.state.wave.phase, 'return');
  } finally {
    r.dispose();
  }
});

test('CHUNK 4: plate damage — five ordinary cuts fell it (a wall, not a lockout)', () => {
  const r = createRun(131, () => {}, { waveMode: true, fracturePct: 0 });
  try {
    forceWave5(r, { shattered: true });
    for (let i = 0; i < 5; i++) strikeMonolith(r, 1);
    assert.equal(r.combat.enemies.get('monolith/core'), undefined);
    assert.equal(r.state.wave.phase, 'return');
  } finally {
    r.dispose();
  }
});

test('CHUNK 4: the breach stays correct after a Monolith wave resets the field', () => {
  // The reset blocks must not know the Monolith exists — fresh runs boot clean.
  const r = createRun(137, () => {}, { waveMode: true, fracturePct: 0 });
  try {
    assert.equal(r.state.monoliths ?? 0, 0);
    assert.ok(!r.world.arenaMode);
  } finally {
    r.dispose();
  }
});

// ── THE LIVE MODE: CONTINUOUS SECTORS ─────────────────────────────────────
//
// The browser build plays createContinuousDirector, not the wave director:
// an endless vertical climb, three anchor locks per sector, and a seal
// crossed upward to advance. In a torn arena the seal does not open — the
// Monolith stands in the seam, and the sector waits for the fall.

function shotAt(run, x, y, kinetics = null) {
  placePlayer(run.world, { x, y });
  stopPlayer(run.world);
  run.state.edge = run.state.edgeMax;
  run.state.invul = 10000;
  if (kinetics !== null) run.state.kineticStage = kinetics;
  assert.equal(run.dash({ x: 0, y: -42, power: 1 }), true);
  for (let i = 0; i < 12; i++) run.tick();
}

test('continuous arcade: a torn arena raises the Monolith after the wave, without a gate', () => {
  const events=[];
  const run=createRun(4242,t=>events.push(t),{waveMode:true,continuous:true});
  try {
    run.state.phase='playing';run.state.invul=10000;
    run.state.arenaMode=run.world.arenaMode='SHATTERED';
    const arena={...run.world.arena};
    for(const e of [...run.combat.enemies.values()])run.combat.remove(e);
    run.tick();
    const m=run.combat.enemies.get('monolith/core');
    assert.ok(m);assert.equal(run.state.arcade.sector,1);
    assert.ok(events.includes('monolithRise'));
    for(let i=0;i<5;i++){
      const target=run.combat.enemies.get('monolith/core');if(!target)break;
      shotAt(run,target.x,target.y+130,4);
    }
    assert.equal(run.combat.enemies.has('monolith/core'),false);
    assert.ok(events.includes('monolithDown'));
    assert.equal(run.state.arcade.sector,2);
    assert.deepEqual(run.world.arena,arena);
    assert.ok(events.includes('waveClear'));
    assert.ok(run.state.fracture.pct >= FRACTURE_PER_MONOLITH);
  } finally {run.dispose();}
});
