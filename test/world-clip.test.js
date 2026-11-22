import test from 'node:test';
import assert from 'node:assert/strict';
import { createCanvas } from '@napi-rs/canvas';
import { clipWorldToHUD } from '../src/world-clip.js';

for (const [w, h] of [
  [900, 730],
  [860, 440],
  [1568, 882],
  [1106, 720],
  [550, 720],
]) {
  test(`live actors remain visible in ALL HUD corners at ${w}x${h}`, () => {
    for (const [x, y, scale] of [
      [0, 0, 1],
      [-650, -5000, 0.6],
      [12000, 11000, 1.4],
      [-1000, -68000, 0.8],
    ]) {
      const c = createCanvas(w, h).getContext('2d');
      c.save();
      clipWorldToHUD(c, w, h, 16, 20);
      c.scale(scale, scale);
      c.translate(-x, -y);
      // Centre-only checks missed the screenshot bug: the HUD used to punch
      // enormous invisible collision zones out of three viewport corners.
      const points = [
        [40, 40],
        [40, 100],
        [w - 40, 100],
        [w - 40, h - 40],
        [w - 150, h - 150],
        [w / 2, h / 2],
      ];
      c.fillStyle = '#ff0000';
      for (const [px, py] of points)
        c.fillRect(
          x + (px - 8) / scale,
          y + (py - 8) / scale,
          16 / scale,
          16 / scale,
        );
      c.restore();
      for (const [px, py] of points)
        assert.ok(
          c.getImageData(Math.floor(px), Math.floor(py), 1, 1).data[0] > 200,
          `invisible actor at ${px},${py}; camera ${x},${y},${scale}`,
        );
    }
  });
}
