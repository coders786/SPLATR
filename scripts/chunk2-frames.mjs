#!/usr/bin/env node
// ── CHUNK 2 FRAME CHECK (NO BROWSER) ───────────────────────────────────────
//
// Rasterises the REAL createRun + createRenderer against a real Skia surface so
// the three-colour pass can be inspected without Chromium:
//
//   1. "safe to slice" — green brackets on exactly the bodies the live blade
//      reaches, gold on the bounty that pays, red on the ones mid-attack
//   2. the same frame with the blade spent: NO brackets, because nothing is
//      cuttable            (the honesty check for the marker)
//   3. the killer pointer — the hit line, the attacker's name at its own body,
//      and the compass word when it is off the viewport
//   4. the damage slow window — the arena drawn while `hitPace` holds the clock
//      at a seventh of real time (the frame is a still, not a stutter)
//   5. reduced motion with marks on: no pulse, marks still present
//
// The DOM HUD (#law-hint, #health-bar) is HTML/CSS and is NOT in these images.
//
// Run: node scripts/chunk2-frames.mjs
import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync } from 'node:fs';

const require = createRequire(import.meta.url);
const { createCanvas } = require('@napi-rs/canvas');

const W = 960, H = 540;
const SEED = 19;
const OUT = process.env.CAPTURE_DIR || '.arena/chunk2';

globalThis.window = {
  addEventListener() {}, removeEventListener() {}, devicePixelRatio: 1,
  matchMedia: () => ({ matches: false, addEventListener() {} }),
};
globalThis.document = {
  createElement: () => createCanvas(1, 1),
  documentElement: { style: {} },
  addEventListener() {}, body: { appendChild() {} }, querySelector: () => null,
};
globalThis.ResizeObserver = class { observe() { } disconnect() { } };
globalThis.devicePixelRatio = 1;
globalThis.requestAnimationFrame = () => 0;
globalThis.cancelAnimationFrame = () => {};

const surface = createCanvas(W, H);
const ctx = surface.getContext('2d');
const canvas = {
  width: W, height: H, style: {}, dataset: {},
  getContext: () => ctx,
  getBoundingClientRect: () => ({ left: 0, top: 0, width: W, height: H, right: W, bottom: H }),
};

const { createRenderer } = await import('../src/renderer.js');
const { createRun } = await import('../src/run.js');
const { damageFeedback, hitPace, HIT_FREEZE_TICKS } = await import('../src/damage-feedback.js');
const { sliceStates, sweepGeometry } = await import('../src/slice-safe.js');

const renderer = createRenderer(canvas);
const run = createRun(SEED, (type, d) => renderer.event(type, d, true), { waveMode: true });
run.skipOpening();
run.state.phase = 'playing';

mkdirSync(OUT, { recursive: true });
const save = (name) => {
  writeFileSync(`${OUT}/${name}.png`, surface.toBuffer('image/png'));
  console.log('wrote', `${OUT}/${name}.png`);
};

for (let i = 0; i < 240; i++) { run.tick(); renderer.tick(run, true); }

const player = run.world.player.position;
const geo = sweepGeometry({ reach: 1, width: 1 });

// ── 1. SAFE TO SLICE ──────────────────────────────────────────────────────
// Point the live blade straight at the field so the brackets have something
// real to land on, and put a Bastion (plates) and a Crown (bounty) in reach so
// the two other voices are in the same frame.
{
  const base = run.world.player.position;
  run.combat.add({ kind: 'bastion', id: 'frame/plate', x: base.x + 150, y: base.y - 40, home: 'lab', delay: 0, wavePlaced: true });
  run.combat.add({ kind: 'crown', id: 'frame/bounty', x: base.x + 96, y: base.y + 44, home: 'lab', delay: 0, wavePlaced: true });
  run.state.blade = 20;
  run.state.slashAngle = Math.atan2(-40, 150);
  const slices = sliceStates({
    player: run.world.player.position,
    enemies: run.combat.enemies.values(),
    state: run.state,
    geometry: geo,
    limit: 8,
  });
  renderer.setAimFeedback({ hit: null, slices });
  renderer.draw(run, 1, null, true, 'mouse');
  save('01-safe-to-slice');
  console.log('marks', JSON.stringify(slices.map((s) => ({ kind: s.kind, state: s.state, shielded: s.shielded }))));
}

// ── 2. THE SAME FRAME, NO BLADE ───────────────────────────────────────────
// The honesty check: with no blade there is nothing cuttable, so there must be
// no green on the field at all.
{
  run.state.blade = 0;
  const slices = sliceStates({
    player: run.world.player.position,
    enemies: run.combat.enemies.values(),
    state: run.state,
    geometry: geo,
  });
  renderer.setAimFeedback({ hit: null, slices });
  renderer.draw(run, 1, null, true, 'mouse');
  save('02-no-blade-no-promise');
  console.log('marks with no blade:', slices.length);
  run.state.blade = 20;
}

// ── 3. THE KILLER POINTER ─────────────────────────────────────────────────
// One near attacker (line + name at its body) and the compass word for an
// attacker that is off the viewport.
{
  const bodies = [...run.combat.enemies.values()].filter((e) => !e.small);
  const source = bodies[0] || null;
  if (source) {
    const near = damageFeedback({ age: 5, player, source: { x: source.x, y: source.y }, cause: source.kind });
    renderer.setAimFeedback({ hit: near, slices: [] });
    renderer.draw(run, 1, null, true, 'mouse');
    save('03-killer-pointer');
    console.log('near hit', JSON.stringify({ label: near.label, bearing: near.bearing, distance: Math.round(near.direction.distance) }));

    const far = damageFeedback({
      age: 5,
      player,
      source: { x: player.x - 4000, y: player.y - 4000 },
      cause: 'Crown',
    });
    renderer.setAimFeedback({ hit: far, slices: [] });
    renderer.draw(run, 1, null, true, 'mouse');
    save('04-offscreen-attacker');
    console.log('off-screen hit', JSON.stringify({ label: far.label, bearing: far.bearing }));
  }
}

// ── 4. THE DAMAGE SLOW WINDOW ─────────────────────────────────────────────
// The frame the player reads at a seventh of real time. Nothing is skipped:
// this is the same draw with the clock where `hitPace` puts it.
{
  const age = HIT_FREEZE_TICKS + 3;
  renderer.setAimFeedback({
    hit: damageFeedback({ age, player, source: [...run.combat.enemies.values()][0], cause: 'Fang' }),
    slices: [],
  });
  renderer.draw(run, 1, null, true, 'mouse');
  save('05-slow-window');
  console.log('slow window', JSON.stringify({ age, pace: +hitPace(age).toFixed(3), timeScale: +run.world.engine.timing.timeScale.toFixed(3) }));
}

// ── 5. REDUCED MOTION ─────────────────────────────────────────────────────
// Marks must still teach; they simply stop breathing.
{
  const slices = sliceStates({
    player: run.world.player.position,
    enemies: run.combat.enemies.values(),
    state: run.state,
    geometry: geo,
  });
  renderer.setAimFeedback({ hit: null, slices });
  renderer.draw(run, 1, null, false, 'mouse');
  save('06-reduced-motion-marks');
  console.log('reduced-motion marks:', slices.length);
}

run.dispose();
console.log(`\nscore ${run.state.score} · kills ${run.state.kills}`);
