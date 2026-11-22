import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';
import { createCanvas } from '@napi-rs/canvas';
import Matter from 'matter-js';
import { createRun } from '../src/run.js';
import { createRenderer } from '../src/renderer.js';

test('real canvas renderer draws the cube and Fang in tutorial, descent and deep sectors', () => {
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
  const w = 860,
    h = 730;
  for (const [label, y, warmup] of [
    ['tutorial', 0, true],
    ['falling', 4500, false],
    ['floor approach', 11000, false],
    ['sector climb', -16000, false],
  ]) {
    const surface = createCanvas(w, h),
      c = surface.getContext('2d');
    const canvas = {
      width: w,
      height: h,
      style: {},
      dataset: {},
      getContext: () => c,
      getBoundingClientRect: () => ({
        left: 0,
        top: 0,
        width: w,
        height: h,
        right: w,
        bottom: h,
      }),
    };
    const renderer = createRenderer(canvas),
      run = createRun(19, () => {}, { warmup, staged: false });
    try {
      renderer.reset(19, warmup);
      run.state.phase = 'playing';
      run.state.invul = 0;
      Matter.Body.setPosition(run.world.player, { x: 0, y });
      Matter.Body.setVelocity(run.world.player, { x: 0, y: 0 });
      for (const e of run.combat.enemies.values()) run.combat.remove(e);
      const foe = run.combat.add({
        kind: 'fang',
        x: 140,
        y: y - 160,
        id: 'visibility',
        home: 'visibility',
        slot: -1,
      });
      for (let i = 0; i < 1000; i++) renderer.tick(run, false);
      renderer.draw(run, 1, null, false);
      if (process.env.CAPTURE_DIR) {
        mkdirSync(process.env.CAPTURE_DIR, { recursive: true });
        writeFileSync(
          join(process.env.CAPTURE_DIR, label.replaceAll(' ', '-') + '.png'),
          surface.toBuffer('image/png'),
        );
      }
      const v = renderer.questView();
      const pixelsAt = (p, r = 22) => {
        const x = Math.round((p.x - v.x) * v.scale),
          sy = Math.round((p.y - v.y) * v.scale);
        assert.ok(
          x - r >= 0 && x + r < w && sy - r >= 0 && sy + r < h,
          `${label}: sample offscreen ${x},${sy} view ${JSON.stringify(v)}`,
        );
        return c.getImageData(x - r, sy - r, r * 2, r * 2).data;
      };
      const count = (pixels, pred) => {
        let n = 0;
        for (let i = 0; i < pixels.length; i += 4)
          if (pred(pixels[i], pixels[i + 1], pixels[i + 2])) n++;
        return n;
      };
      assert.ok(
        count(
          pixelsAt(run.world.player.position),
          (r, g, b) => r > 190 && g > 190 && b > 170,
        ) > 25,
        `${label}: cube was clipped out`,
      );
      assert.ok(
        count(
          pixelsAt(foe),
          (r, g, b) => r > 160 && r > g * 1.4 && r > b * 1.15,
        ) > 25,
        `${label}: Fang was clipped out`,
      );
      // Regression for the user's screenshot: collidable enemies entering HUD
      // corners must stay visible, not merely the centred actor used above.
      for (const [i, [sx, sy]] of [
        [70, 100],
        [w - 70, 100],
        [w - 70, h - 70],
      ].entries()) {
        const corner = run.combat.add({
          kind: 'fang',
          x: v.x + sx / v.scale,
          y: v.y + sy / v.scale,
          id: `corner-${i}`,
          home: `corner-${i}`,
          slot: -1,
        });
        renderer.draw(run, 1, null, false);
        assert.ok(
          count(
            pixelsAt(corner),
            (r, g, b) => r > 160 && r > g * 1.4 && r > b * 1.15,
          ) > 25,
          `${label}: live Fang invisible in HUD corner ${i}`,
        );
        run.combat.remove(corner);
      }
    } finally {
      renderer.dispose();
      run.dispose();
    }
  }
});
