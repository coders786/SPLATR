/**
 * CHUNK 6B — THE LANDLORD.
 *
 * The Monolith is enormous (r 215), pinned, and active: three telegraphed
 * behaviors, all timed in combat ticks on the enemy itself. Headless rules
 * under test:
 *  - the field manifests it on a torn fifth-clear in BOTH director modes;
 *  - SEISMIC LASH: 0.9s telegraph, then exactly four ballistic debris arcs;
 *    the arcs are needles (parryable with a live blade); the telegraph is
 *    silent — no hazards exist until the countdown lands;
 *  - PLATE SLAM: 0.5s telegraph on the lowest live plate, then a 150px
 *    concussion ring that never hurts — it shoves 220px straight out from
 *    the epicenter and staggers (no mid-air control, 0.35s); a live blade
 *    or parry window walks through; fires only while ≥ 3 plates stand;
 *  - GRAVITY LENS: 0.75s dilation, then 1.5s of 2.1 px/tick² pull toward
 *    the slab, and the plate-doubling window (anything that connects deals
 *    +1 bonus damage while it burns);
 *  - arena 3200×2600 with the floor pinned at +300 (pad/spawn heights kept);
 *  - the boss bar: five cells, one per plate, synced to hp/2 (Minecraft parity).
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { createRun } from '../src/run.js';
import { WAVE_ARENA } from '../src/waves.js';
import { TYPES } from '../src/shapes.js';
import { placePlayer, stopPlayer } from '../src/physics.js';
import { createTeachingSession } from '../src/teaching.js';

function forceMonolith(r) {
  r.state.phase = 'playing';
  r.state.invul = 99999;
  r.state.wave.number = 5;
  r.state.arenaMode = 'SHATTERED';
  r.world.arenaMode = 'SHATTERED';
  for (const e of [...r.combat.enemies.values()]) r.combat.remove(e);
  r.tick();
  r.state.invul = 0;
  r.state.wave.entry = 0;
  const m = r.combat.enemies.get('monolith/core');
  assert.ok(m, 'the landlord manifests');
  return m;
}
function strikeMonolith(r, kin = 1) {
  const m = r.combat.enemies.get('monolith/core');
  placePlayer(r.world, { x: m.x, y: m.y });
  stopPlayer(r.world);
  r.state.shots++;
  r.state.kineticStage = kin;
  r.state.blade = 12;
  r.tick();
  return m;
}

test('CHUNK 6B: the arena grew to 3200×2600 with the floor line pinned at +300', () => {
  assert.equal(WAVE_ARENA.w, 3200);
  assert.equal(WAVE_ARENA.h, 2600);
  assert.equal(WAVE_ARENA.x, -1600);
  assert.equal(WAVE_ARENA.y + WAVE_ARENA.h, 300, 'pad, spawn and trampoline keep their measured heights');
  assert.equal(TYPES.monolith.r, 215, 'the slab cows the frame');
});

test('CHUNK 6B: the Monolith acts in both director modes and the training room stays quiet', () => {
  const r = createRun(313, () => {}, { waveMode: true, fracturePct: 0 });
  try {
    forceMonolith(r);
    const m = r.combat.enemies.get('monolith/core');
    assert.equal(m.home, 'monolith');
    assert.equal(m.pinned, true);
    assert.equal(m.hp, 10);
  } finally { r.dispose(); }
  // The training lesson spawns the same slab with home:'wave' — no behaviors.
  const s = createTeachingSession({ scenario: 'monolith' });
  for (let i = 0; i < 300; i++) s.run.tick();
  const lessonMonolith = [...s.run.combat.enemies.values()].find(e => e.kind === 'monolith');
  if (lessonMonolith) {
    assert.equal(lessonMonolith.lashTell, 0, 'lesson never lashes');
    assert.equal(lessonMonolith.slamTell, 0, 'lesson never slams');
    assert.equal(lessonMonolith.lensT, 0, 'lesson never lenses');
    assert.equal(s.run.combat.hazards.length, 0, 'the door stays a door');
  }
  s.dispose?.();
});

test('CHUNK 6B: SEISMIC LASH — 0.9s telegraph, then exactly four arcs; the telegraph is quiet', () => {
  const r = createRun(41, () => {}, { waveMode: true, fracturePct: 0 });
  try {
    const m = forceMonolith(r);
    m.lashAt = 2;
    m.slamAt = 100000; m.lensAt = 100000;
    r.state.invul = 0;
    // The telegraph opens; no hazards exist during it.
    let telegraphed = -1;
    for (let i = 0; i < 10 && telegraphed < 0; i++) { r.tick(); if (m.lashTell > 0) telegraphed = i; }
    assert.ok(telegraphed >= 0, 'the crack telegraph opens');
    assert.equal(r.combat.hazards.length, 0, 'no hazards during the 0.9s crawl');
    assert.equal(m.lashTell, 54, 'the telegraph is 0.9s of crack-lines');
    // Let it run out.
    for (let i = 0; i < 54; i++) r.tick();
    const debris = r.combat.hazards.filter(h => h.kind === 'needle' && h.source === 'monolith');
    assert.equal(debris.length, 4, 'four debris arcs fan out');
    assert.ok(debris.every(h => h.gravity > 0), 'the arcs fall ballistically');
    assert.ok(debris.every(h => h.y > m.y), 'debris leaves the base, below the plates');
  } finally { r.dispose(); }
});

test('CHUNK 6B: SEISMIC LASH debris is harmless scenery', () => {
  const r = createRun(42, () => {}, { waveMode: true, fracturePct: 0 });
  try {
    const m = forceMonolith(r);
    m.lashAt = 1; m.slamAt = 100000; m.lensAt = 100000;
    r.state.invul = 0;
    m.hp = 10;
    // Park the cube directly under the fan BEFORE the fault fires, so the
    // arc fans out aimed right at it — freeze it there for the whole arc.
    placePlayer(r.world, { x: m.x, y: m.y + 1.5 * m.r + 120 });
    stopPlayer(r.world);
    r.state.blade = 0; r.state.parry = 0;
    for (let i = 0; i < 56; i++) {
      placePlayer(r.world, { x: m.x, y: m.y + 1.5 * m.r + 120 });
      stopPlayer(r.world);
      r.tick();
    }
    assert.equal(r.combat.hazards.filter(h => h.source === 'monolith').length, 4, 'the fan left the slab\'s hands');
    const hpBefore = r.state.hp;
    // Ride the arc down: park the cube on top of a live debris shard and
    // let the normal hazard→hurt pipeline resolve the collision.
    for (let i = 0; i < 120 && r.state.hp === hpBefore; i++) {
      const shard = r.combat.hazards.find(h => h.source === 'monolith');
      if (shard) {
        placePlayer(r.world, { x: shard.x, y: shard.y });
        stopPlayer(r.world);
      }
      r.tick();
    }
    assert.equal(r.state.hp, hpBefore, 'debris never damages hull');
  } finally { r.dispose(); }
});

test('CHUNK 6B: PLATE SLAM — shove 220px straight out + stagger, never damage', () => {
  const r = createRun(43, () => {}, { waveMode: true, fracturePct: 0 });
  try {
    const m = forceMonolith(r);
    m.slamAt = 2; m.lashAt = 100000; m.lensAt = 100000;
    for (let i = 0; i < 5 && m.slamTell === 0; i++) r.tick();
    assert.equal(m.slamTell, 30, 'the white slot is a 0.5s fuse');
    assert.equal(m.slamPlate, 4, 'the LOWEST standing plate slots loose');
    for (let i = 0; i < 30; i++) r.tick();
    const shock = r.combat.hazards.find(h => h.kind === 'shock');
    assert.ok(shock, 'the concussion ring rings out');
    assert.equal(shock.maxRadius, 150, 'the AOE is the 150px the spec walks');
    // Stand due +x of the epicenter, right on the ring.
    const epicenter = { x: shock.x, y: shock.y };
    placePlayer(r.world, { x: epicenter.x + 40, y: epicenter.y });
    stopPlayer(r.world);
    r.state.blade = 0; r.state.parry = 0;
    const hpBefore = r.state.hp;
    for (let i = 0; i < 60 && r.state.stun === 0; i++) {
      stopPlayer(r.world); // stay on the ring line as it grows
      r.tick();
    }
    assert.equal(r.state.hp, hpBefore, 'the slam never takes hull');
    assert.equal(r.state.stun, 20, 'no mid-air control for 0.35s (one tick already spent)');
    const dx = r.world.player.position.x - epicenter.x;
    assert.ok(dx >= 200, `shoved 220px straight out (got ${dx.toFixed(1)})`);
    assert.ok(Math.abs(r.world.player.position.y - epicenter.y) < 60, 'the shove is radial from the base');
    assert.ok(r.world.player.velocity.x > 0, 'the shove throws the cube along the same line');
  } finally { r.dispose(); }
});

test('CHUNK 6B: the slam stagger locks mid-air steering — no corridor widening while it burns', () => {
  const r = createRun(49, () => {}, { waveMode: true, fracturePct: 0 });
  try {
    const m = forceMonolith(r);
    m.slamAt = 2; m.lashAt = 100000; m.lensAt = 100000;
    for (let i = 0; i < 5 && m.slamTell === 0; i++) r.tick();
    for (let i = 0; i < 30; i++) r.tick();
    r.state.invul = 0;
    placePlayer(r.world, { x: m.x + 40, y: m.y + 1.5 * m.r });
    stopPlayer(r.world);
    r.state.blade = 0; r.state.parry = 0;
    for (let i = 0; i < 60 && r.state.stun === 0; i++) { stopPlayer(r.world); r.tick(); }
    assert.ok(r.state.stun > 0, 'the concussion staggered the cube');
    // While the stagger burns, the airborne and focus widenings are inert —
    // the frame is exactly the base tempo corridor.
    const grounded = r.assist({ airborne: false, focus: false }).corridor;
    assert.equal(r.assist({ airborne: true, focus: false }).corridor, grounded, 'no airborne widening');
    assert.equal(r.assist({ focus: true, airborne: false }).corridor, grounded, 'no focus widening');
    assert.equal(r.assist().corridor, grounded, 'the default path is no wider either');
    // Burn out the 0.35s and the help comes back.
    for (let i = 0; i < 25; i++) r.tick();
    assert.equal(r.state.stun, 0, 'the stagger is 0.35s, not a life sentence');
    assert.ok(r.assist({ airborne: true }).corridor > r.assist({ airborne: false }).corridor, 'airborne widening returns');
  } finally { r.dispose(); }
});

test('CHUNK 6B: PLATE SLAM — a live blade walks through the ring untouched', () => {
  const r = createRun(44, () => {}, { waveMode: true, fracturePct: 0 });
  try {
    const m = forceMonolith(r);
    m.slamAt = 2; m.lashAt = 100000; m.lensAt = 100000;
    for (let i = 0; i < 5 && m.slamTell === 0; i++) r.tick();
    for (let i = 0; i < 30; i++) r.tick();
    const shock = r.combat.hazards.find(h => h.kind === 'shock');
    assert.ok(shock);
    placePlayer(r.world, { x: shock.x + 40, y: shock.y });
    stopPlayer(r.world);
    r.state.blade = 12;
    const xBefore = r.world.player.position.x;
    for (let i = 0; i < 30; i++) r.tick();
    assert.equal(r.state.stun, 0, 'no stagger while the blade is live');
    assert.ok(Math.abs(r.world.player.position.x - xBefore) < 200, 'no shove through a live blade');
  } finally { r.dispose(); }
});

test('CHUNK 6B: PLATE SLAM stays holstered with fewer than 3 plates standing', () => {
  const r = createRun(45, () => {}, { waveMode: true, fracturePct: 0 });
  try {
    const m = forceMonolith(r);
    m.hp = 4; // two plates
    m.slamAt = 1; m.lashAt = 100000; m.lensAt = 100000;
    for (let i = 0; i < 400; i++) r.tick();
    assert.equal(m.slamTell, 0, 'the slam waits for a fuller table');
    assert.equal(r.combat.hazards.filter(h => h.kind === 'shock').length, 0);
  } finally { r.dispose(); }
});

test('CHUNK 6B: GRAVITY LENS — pulls the cube toward the slab at 2.1 px/tick²', () => {
  const r = createRun(46, () => {}, { waveMode: true, fracturePct: 0 });
  try {
    const m = forceMonolith(r);
    m.lensAt = 2; m.lashAt = 100000; m.slamAt = 100000;
    // Player due -x of the slab, perfectly level — the pull has one axis.
    placePlayer(r.world, { x: m.x - 300, y: m.y });
    stopPlayer(r.world);
    r.state.invul = 99999;
    // Run through the 0.75s dilation into the burn.
    for (let i = 0; i < 5 && m.lensT === 0; i++) r.tick();
    assert.equal(m.lensTell > 0 || m.lensT > 0, true, 'the iris is opening');
    for (let i = 0; i < 60 && m.lensT === 0; i++) r.tick();
    assert.ok(m.lensT > 0, 'the window burns');
    placePlayer(r.world, { x: m.x - 300, y: m.y });
    stopPlayer(r.world);
    for (let i = 0; i < 10; i++) r.tick();
    const vx = r.world.player.velocity.x;
    assert.ok(Math.abs(vx - 21) < 2, `ten ticks of pull ≈ 21 px/tick toward the slab (got ${vx.toFixed(2)})`);
  } finally { r.dispose(); }
});

test('CHUNK 6B: GRAVITY LENS — the plate-doubling window, +1 damage from anything', () => {
  const r = createRun(47, () => {}, { waveMode: true, fracturePct: 0 });
  try {
    const m = forceMonolith(r);
    // Ordinary cut, no lens: one point.
    strikeMonolith(r, 1);
    assert.equal(m.hp, 8, 'an ordinary cut breaks one plate');
    // Open the window and chip again: bonus damage.
    m.lensT = 60;
    strikeMonolith(r, 1);
    assert.equal(m.hp, 5, 'the lens adds one damage');
    // And an OVERCHARGED plate goes from 2 to 3.
    m.lensT = 60;
    strikeMonolith(r, 4);
    assert.equal(m.hp, 1, 'OVERCHARGED deals three plus the lens bonus');
  } finally { r.dispose(); }
});

test('CHUNK 6B: the boss bar projects plates — five cells, synced to hp/2', async () => {
  const { Window } = await import('happy-dom');
  const { readFileSync } = await import('node:fs');
  const window = new Window();
  globalThis.document = window.document;
  globalThis.requestAnimationFrame = () => 1;
  window.document.body.innerHTML = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
  window.Element.prototype.animate = () => ({});
  const { createWaveUI } = await import('../src/wave-ui.js');
  const events = [];
  const r = createRun(99, (t, d) => events.push(t), { waveMode: true, fracturePct: 0 });
  try {
    const ui = createWaveUI({ getRun: () => r, resetInput: () => {}, motion: () => false });
    forceMonolith(r);
    ui.update();
    const bar = window.document.getElementById('bossbar');
    assert.ok(bar, 'the bar exists in the HUD');
    assert.equal(bar.hidden, false, 'the bar shows while the landlord stands');
    assert.equal(bar.getAttribute('aria-valuemax'), '5');
    assert.equal(bar.getAttribute('aria-valuenow'), '5');
    assert.equal(bar.querySelectorAll('.bossbar-rail i.on').length, 5);
    // One OVERCHARGED plate.
    strikeMonolith(r, 4);
    ui.update();
    assert.equal(bar.getAttribute('aria-valuenow'), '4');
    assert.equal(bar.querySelectorAll('.bossbar-rail i.on').length, 4);
    assert.equal(bar.classList.contains('crack'), true, 'a plate falling pops the rail');
    // Another plate, same check.
    strikeMonolith(r, 4);
    ui.update();
    assert.equal(bar.getAttribute('aria-valuenow'), '2');
    assert.equal(bar.querySelectorAll('.bossbar-rail i.on').length, 2);
    // Fell the slab; the bar hides.
    strikeMonolith(r, 4); strikeMonolith(r, 4);
    ui.update();
    assert.equal(r.combat.enemies.get('monolith/core'), undefined, 'the landlord falls');
    assert.equal(bar.hidden, true, 'the bar goes down with him');
    ui.update();
  } finally {
    r.dispose();
    window.happyDOM.abort();
    delete globalThis.document;
    delete globalThis.requestAnimationFrame;
  }
});

test('CHUNK 6B: when the landlord falls, everything he made falls with him', () => {
  const r = createRun(48, () => {}, { waveMode: true, fracturePct: 0 });
  try {
    const m = forceMonolith(r);
    m.lashAt = 1; m.slamAt = 1; m.lensAt = 100000;
    for (let i = 0; i < 120; i++) r.tick();
    assert.ok(r.combat.hazards.some(h => h.sourceId === m.id), 'his debris and ring are on the field');
    // Fell him with five banked OVERCHARGED cuts.
    for (let i = 0; i < 4; i++) strikeMonolith(r, 4);
    assert.equal(r.combat.enemies.get('monolith/core'), undefined);
    assert.equal(r.combat.hazards.filter(h => h.sourceId === 'monolith/core').length, 0, 'nothing he made outlives him');
  } finally { r.dispose(); }
});
