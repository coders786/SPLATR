// Real Skia canvas renders; Python independently checks the resulting pixels.
import { createCanvas } from '@napi-rs/canvas';
import { mkdirSync, writeFileSync } from 'node:fs';
import Matter from 'matter-js';
import { createRun } from '../src/run.js';
import { createRenderer } from '../src/renderer.js';
globalThis.window = {
  addEventListener() {},
  removeEventListener() {},
  devicePixelRatio: 1,
  matchMedia: () => ({ matches: false, addEventListener() {} }),
};
globalThis.document = {
  createElement: () => createCanvas(1, 1),
  documentElement: { style: {} },
  addEventListener() {},
  body: { appendChild() {} },
  querySelector: () => null,
};
globalThis.ResizeObserver = class {
  observe() {}
  disconnect() {}
};
globalThis.devicePixelRatio = 1;
const width = 960,
  height = 720,
  surface = createCanvas(width, height);
const canvas = {
  width,
  height,
  style: {},
  dataset: {},
  getContext: () => surface.getContext('2d'),
  getBoundingClientRect: () => ({
    left: 0,
    top: 0,
    width,
    height,
    right: width,
    bottom: height,
  }),
};
const renderer = createRenderer(canvas),
  run = createRun(19, () => {}, { staged: false });
const dir = '.arena/camera-qa';
mkdirSync(dir, { recursive: true });
try {
  run.state.phase = 'playing';
  run.state.invul = 0;
  for (const e of run.combat.enemies.values()) run.combat.remove(e);
  Matter.Body.setPosition(run.world.player, { x: 0, y: 0 });
  const enemy = run.combat.add({
    id: 'image-fang',
    kind: 'fang',
    x: 140,
    y: -180,
    home: 'image',
    slot: -1,
  });
  const metadata = [];
  for (const [name, origin] of [
    ['before', { x: 0, y: 0 }],
    ['after', { x: 120, y: 0 }],
  ]) {
    renderer.field(origin, 1);
    renderer.draw(run, 1, null, false);
    const view = renderer.questView();
    writeFileSync(`${dir}/${name}.png`, surface.toBuffer('image/png'));
    metadata.push({
      name,
      world: { x: enemy.x, y: enemy.y },
      screen: {
        x: (enemy.x - view.x) * view.scale,
        y: (enemy.y - view.y) * view.scale,
      },
      scale: view.scale,
    });
  }
  writeFileSync(`${dir}/metadata.json`, JSON.stringify(metadata, null, 2));
  console.log(
    'Wrote real rendered camera-pan frames and world/screen coordinates.',
  );
} finally {
  renderer.dispose();
  run.dispose();
}
