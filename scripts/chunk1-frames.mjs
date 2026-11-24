#!/usr/bin/env node
// ── CHUNK 1 FRAME CHECK (NO BROWSER) ───────────────────────────────────────
//
// Rasterises the REAL createRun + createRenderer against a real Skia surface so
// the three new canvas-side reads can be inspected without Chromium:
//
//   1. the cut-charge arc under the cube, empty (red, pulsing) and charged
//   2. the "what hit me" line from the cube to the body that hit it
//   3. the same arena with the damage reaction expired (nothing lingering)
//
// The DOM HUD (#health-bar, #reticle) is HTML/CSS and is NOT in these images;
// it is checked by test/chunk1.test.js and by the browser suite.
//
// Run: node scripts/chunk1-frames.mjs
import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync } from 'node:fs';

const require = createRequire(import.meta.url);
const { createCanvas } = require('@napi-rs/canvas');

const W = 960, H = 540;
const SEED = 19;
const OUT = process.env.CAPTURE_DIR || '.arena/chunk1';

globalThis.window = {
  addEventListener() {}, removeEventListener() {}, devicePixelRatio: 1,
  matchMedia: () => ({ matches: false, addEventListener() {} }),
};
globalThis.document = {
  createElement: () => createCanvas(1, 1),
  documentElement: { style: {} },
  addEventListener() {}, body: { appendChild() {} }, querySelector: () => null,
};
globalThis.ResizeObserver = class { observe() {} disconnect() {} };
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
const { damageFeedback, hitDirection } = await import('../src/damage-feedback.js');

const renderer = createRenderer(canvas);
// `waveMode` is what main.js uses; a staged run is the Cutting Room and has no
// enemies, so the "what hit me" frame would have nothing honest to point at.
const run = createRun(SEED, (type, d) => renderer.event(type, d, true), { waveMode: true });
run.skipOpening();
run.state.phase = 'playing';

mkdirSync(OUT, { recursive: true });
const save = (name) => {
  writeFileSync(`${OUT}/${name}.png`, surface.toBuffer('image/png'));
  console.log('wrote', `${OUT}/${name}.png`);
};

// Let the field populate, then park the cube on the floor with all charges.
for (let i = 0; i < 240; i++) { run.tick(); renderer.tick(run, true); }

// 1. THE CUT ARC, CHARGED — three lime segments under the cube.
run.state.edge = run.state.edgeMax;
renderer.draw(run, 1, null, true, 'mouse');
save('01-cut-arc-charged');

// ── WHAT THE SCORE IS SAYING ──────────────────────────────────────────────
// A diagnostic strip: the cube's screen position and the live charge, so the
// frames can be read without opening the DOM. Printed, never drawn.
{
  const p = run.world.player.position, v = renderer.questView();
  console.log('cube at screen', {
    x: Math.round((p.x - v.x) * v.scale),
    y: Math.round((p.y - v.y) * v.scale),
    scale: +v.scale.toFixed(2),
    R: 24,
  });
}

// 2. THE CUT ARC, EMPTY — the same arc in red, pulsing, with a recharge fill.
run.state.edge = 0;
run.state.recharge = 24;
renderer.draw(run, 1, null, true, 'mouse');
save('02-cut-arc-empty');

// 3. WHAT HIT ME — a real body as the source, four ticks into the reaction.
const bodies = [...run.combat.enemies.values()].filter((e) => !e.small);
const source = bodies[0] || null;
if (source) {
  const player = run.world.player.position;
  const dir = hitDirection(player, { x: source.x, y: source.y });
  const feedback = damageFeedback({ age: 4, player, source: { x: source.x, y: source.y }, cause: source.kind });
  renderer.setAimFeedback({ hit: feedback });
  renderer.draw(run, 1, null, true, 'mouse');
  save('03-what-hit-me');
  console.log('hit line', JSON.stringify({ cause: feedback.label, dir: dir && { angle: +dir.angle.toFixed(2), distance: Math.round(dir.distance) } }));
}

// 4. THE SAME ARENA, REACTION EXPIRED — nothing may linger.
renderer.setAimFeedback({ hit: damageFeedback({ age: 99, player: run.world.player.position, source, cause: 'Fang' }) });
renderer.draw(run, 1, null, true, 'mouse');
save('04-clean-afterwards');

// 5. Reduced motion: the same empty arc must not pulse.
run.state.edge = 0;
renderer.draw(run, 1, null, false, 'mouse');
save('05-reduced-motion-empty');

run.dispose();
console.log(`\nscore ${run.state.score} · kills ${run.state.kills} · charge ${run.state.edge}/${run.state.edgeMax}`);
