/**
 * CHUNK 1 — Bigger Arena + 1.0s Auto-Reload + Clear Wave Progression.
 *
 * Headless verification for the fundamentals the Dimension Shatter build
 * stands on: the enlarged arena, the fixed one-second pip reload that does not
 * depend on touching a wall or the floor, walls that no longer refund cuts,
 * and waves that advance 01 -> 02 -> 03 with no empty-field droughts.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import {createRun} from '../src/run.js';
import {WAVE_ARENA} from '../src/waves.js';
import {planEncounter} from '../src/encounters.js';
import {placePlayer,stopPlayer,setPlayerVelocity} from '../src/physics.js';
import {MOVEMENT} from '../src/movement-model.js';
function pinMidAir(r) {
  // Deadliness check: nowhere near a rail, floor or pad.
  placePlayer(r.world, {x: 0, y: -800});
  stopPlayer(r.world);
}

test('CHUNK 6B: the arena grew for the landlord, floor line unchanged', () => {
  assert.equal(WAVE_ARENA.w, 3200, 'arena width grew ~37% toward the landlord fight');
  assert.equal(WAVE_ARENA.h, 2600, 'arena height grew ~29% toward the landlord fight');
  // The floor stays at y + h = +300 so spawn, pad and trampoline keep their
  // measured heights; the new room comes from the sides and the headroom.
  assert.equal(WAVE_ARENA.y + WAVE_ARENA.h, 300);
  // The spawn formation spreads across the new space instead of huddling in
  // the old band, and every planned spawn stays inside the rails.
  const plan = planEncounter(131, 1, {x: 0, y: 0});
  for (const spec of plan.specs) {
    assert.ok(spec.x >= WAVE_ARENA.x + 60 && spec.x <= WAVE_ARENA.x + WAVE_ARENA.w - 60, `spawn x ${spec.x} inside rails`);
    assert.ok(spec.y >= WAVE_ARENA.y + 60 && spec.y <= WAVE_ARENA.y + WAVE_ARENA.h - 60, `spawn y ${spec.y} inside rails`);
  }
});

test('CHUNK 1: a missing cut refills in exactly 60 ticks, hovering mid-air, no wall or floor', () => {
  assert.equal(MOVEMENT.recharge, 60, 'the reload timer is one real second');
  const r = createRun(131, () => {}, {waveMode: true});
  try {
    r.state.phase = 'playing';
    r.state.invul = 99999;
    r.state.edge = 0;
    r.state.recharge = 0;
    r.state.stop = 0;
    let touchedRail = false;
    for (let i = 0; i < 60; i++) {
      pinMidAir(r);
      r.tick();
      if (r.world.struck?.surface === 'rail' || r.world.grounded) touchedRail = true;
    }
    assert.equal(touchedRail, false, 'the test never touches a rail — the reload must not need one');
    assert.equal(r.state.edge, 1, 'exactly one pip after 60 ticks');
    assert.equal(r.state.recharge, 0, 'the timer resets when the pip lands');
    // And a full stock never refills or leaks.
    r.state.edge = 3;
    r.state.recharge = 0;
    for (let i = 0; i < 120; i++) { pinMidAir(r); r.tick(); }
    assert.equal(r.state.edge, 3);
    assert.equal(r.state.recharge, 0, 'a full rack owes nothing');
  } finally {
    r.dispose();
  }
});

test('CHUNK 1: bouncing off a wall does NOT refund a cut', () => {
  const r = createRun(131, () => {}, {waveMode: true});
  try {
    r.state.phase = 'playing';
    r.state.invul = 99999;
    assert.equal(r.dash({x: -1, y: 0, power: 1}), true, 'dash consumes a pip');
    const afterDash = r.state.edge;
    assert.ok(afterDash < 3);
    // Throw the cube straight into the left rail.
    placePlayer(r.world, {x: WAVE_ARENA.x + 40, y: -800});
    setPlayerVelocity(r.world, -25, 0);
    let touched = false;
    for (let i = 0; i < 40 && !touched; i++) {
      r.tick();
      if (r.world.struck?.surface === 'rail') touched = true;
    }
    assert.equal(touched, true, 'the cube must actually reach the rail');
    // 40 ticks < the 60-tick reload, so any pip here came from the wall — which must not pay.
    assert.equal(r.state.edge, afterDash, 'a wall-bounce no longer refunds a cut');
  } finally {
    r.dispose();
  }
});

test('CHUNK 1: waves advance 01 -> 02 -> 03 with zero empty ticks during combat', () => {
  const r = createRun(131, () => {}, {waveMode: true});
  try {
    r.state.phase = 'playing';
    r.state.invul = 99999;
    for (let w = 1; w <= 3; w++) {
      assert.equal(r.state.wave.number, w, `wave ${w} is live`);
      assert.equal(r.state.wave.phase, 'combat');
      // A full assault phase with live bodies on the field: never empty.
      let emptyTicks = 0;
      for (let i = 0; i < 90; i++) {
        r.tick();
        if (r.state.wave.phase === 'combat' && r.combat.enemies.size === 0) emptyTicks++;
      }
      assert.equal(emptyTicks, 0, `wave ${w} never showed an empty field`);
      // Clear the wave the way the game does: no live shapes left gates the rest.
      for (const e of [...r.combat.enemies.values()]) r.combat.remove(e);
      r.state.stop = 0;
      r.tick();
      assert.equal(r.state.wave.phase, 'return', 'wave clear opens the breather');
      assert.equal(r.state.wave.cleared, w);
      assert.equal(r.state.waveMult, w, `+${w} wave-clear score bonus banked after wave ${w}`);
      const q = r.state.wave.platform;
      assert.ok(q, 'a rest platform appears for the breather');
      placePlayer(r.world, {x: q.x + q.w / 2, y: q.y - 23});
      stopPlayer(r.world);
      for (let i = 0; i < 25 && r.state.wave.phase !== 'choose'; i++) { r.state.stop = 0; r.tick(); }
      assert.equal(r.state.wave.phase, 'choose');
      const buff = r.state.wave.offers[0];
      assert.equal(r.chooseWaveBuff(buff.id), true);
      assert.equal(r.state.wave.number, w + 1);
      assert.equal(r.state.wave.phase, 'combat');
      assert.ok(r.combat.enemies.size > 0, `wave ${w + 1} launched with bodies on the field`);
    }
  } finally {
    r.dispose();
  }
});
