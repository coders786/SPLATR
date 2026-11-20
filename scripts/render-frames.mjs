#!/usr/bin/env node
// ── FRAME CAPTURE WITHOUT A BROWSER ────────────────────────────────────────
//
// The renderer is plain canvas 2D, so it can be rasterised headlessly against
// a real Skia surface (@napi-rs/canvas) instead of a DOM canvas. That is what
// this does: it drives the REAL createRun + createRenderer from a seeded bot
// run and writes PNGs at the moments the new feedback systems are on screen.
//
// WHAT THIS IS NOT:
//   * not a browser. The DOM HUD (#score, #speedo, #next-rank, the RUN ENDED
//     page) is HTML/CSS and is NOT in these images.
//   * not a pixel-for-pixel browser match. @napi-rs/canvas rejects some font
//     syntax that Chromium also rejects, but they may not reject the SAME
//     things -- that divergence is exactly what surfaced the `var()` font bug.
//
// Run: node scripts/render-frames.mjs        (needs @napi-rs/canvas installed)
import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync } from 'node:fs';

const require = createRequire(import.meta.url);
const { createCanvas } = require('@napi-rs/canvas');

const W = 900, H = 730;
const SEED = 19;
const OUT = 'docs/review-frames';

// ── the slice of DOM the renderer touches ─────────────────────────────────
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

const renderer = createRenderer(canvas);

let FRAME = 0;
let cutFrame = -999;
let cutPoints = 0;
const run = createRun(SEED, (type, d) => {
  // THE ESSENTIAL BIT: every run event goes to the renderer, exactly as
  // main.js does it. A harness that forgets this renders a world with no
  // beams, no popups and no imprint ink, and looks like a code bug.
  renderer.event(type, d, true);
  if (type === 'cut' && d.points > 0) { cutFrame = FRAME; cutPoints = d.points; }
}, { staged: true });

run.skipOpening();
run.state.phase = 'playing';

mkdirSync(OUT, { recursive: true });
const got = new Set();
const save = (name) => {
  if (got.has(name)) return;
  writeFileSync(`${OUT}/${name}.png`, surface.toBuffer('image/png'));
  got.add(name);
  console.log('wrote', name);
};

for (let i = 0; i < 6000; i++) {
  if (run.world.clock % 45 < 1) run.dash(run.suggestion());
  FRAME = i;
  run.tick();
  if (run.state.phase === 'over') { save('12-death'); break; }
  renderer.tick(run, true);
  renderer.draw(run, 1, null, true, 'mouse');

  const s = run.state;
  if (cutPoints >= 300 && i - cutFrame === 3) save('11-cut-beam');
  if (s.hyper && s.chain >= 4) save('05-chain');
  if (s.hp === 1 && s.wave >= 2) save('06-low-hp');
}

run.dispose();
console.log(`\nscore ${run.state.score} · kills ${run.state.kills} · frames ${FRAME}`);
