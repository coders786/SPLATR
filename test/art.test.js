import test from 'node:test';
import assert from 'node:assert/strict';
import { TYPES, CUBE, bisect, pose, bodyPose } from '../src/shapes.js';
import { createCamera, toScreen } from '../src/camera.js';
const area = (p) =>
  p.reduce((sum, [x, y], i) => {
    const [a, b] = p[(i + 1) % p.length];
    return sum + x * b - y * a;
  }, 0) / 2;
for (const [name, p] of [['cube', CUBE], ...Object.entries(TYPES).map(([k, t]) => [k, t.outline])])
  test(`flat ${name} sprite splits along the cut without losing its area`, () => {
    for (const a of [-1.2, 0.16, 2.51]) {
      const halves = bisect(p, a);
      assert.ok(halves.every((h) => h.length >= 3 && area(h) > 0));
      assert.ok(Math.abs(halves.map(area).reduce((a, b) => a + b) - area(p)) < 1e-7);
    }
  });
test('actors and Matter bodies use the fractional render alpha without altering either snapshot', () => {
  const a = pose({ px: 5, py: 2, pa: 1, x: 15, y: 22, angle: 3 }, 0.3);
  assert.deepEqual(a, { x: 8, y: 8, angle: 1.6 });
  assert.deepEqual(
    bodyPose(
      { position: { x: 15, y: 22 }, angle: 3, plugin: { previous: { x: 5, y: 2, angle: 1 } } },
      0.3,
    ),
    a,
  );
});
for (const [w, h] of [
  [1440, 900],
  [390, 844],
  [844, 390],
])
  test(`camera interpolates and follows across thousands of units at ${w}×${h}`, () => {
    const cam = createCamera();
    cam.resize(w, h);
    cam.reset({ x: 0, y: 0 });
    let p = { x: 0, y: 0 };
    for (let i = 0; i < 470; i++) {
      const v = { x: i < 230 ? 24 : -18, y: -24 };
      p = { x: p.x + v.x, y: p.y + v.y };
      cam.tick(p, v, false);
      const a = cam.view(0),
        b = cam.view(1),
        mid = cam.view(0.5);
      assert.ok(Math.abs(mid.x - (a.x + b.x) / 2) < 1e-8);
      const q = toScreen(b, p);
      assert.ok(q.x > 0 && q.x < w && q.y > 0 && q.y < h);
    }
    assert.ok(cam.view().y < -10000);
    cam.resize(h, w);
    assert.equal(cam.view().width, h);
  });
