import test from 'node:test';
import assert from 'node:assert/strict';
import {
  localRadar,
  radarRect,
  overlapsHUD,
  overlayPoint,
} from '../src/radar.js';

test('radar stays compact and onscreen in preview and phone sizes', () => {
  for (const [w, h] of [
    [960, 720],
    [550, 720],
    [320, 568],
    [1280, 720],
    [860, 440],
  ]) {
    const r = radarRect(w, h);
    assert.ok(
      r.w <= 160 &&
        r.w === r.h &&
        r.x >= 0 &&
        r.y >= 0 &&
        r.x + r.w < w &&
        r.y + r.h < h,
    );
    assert.ok(r.w <= w * 0.34, 'radar consumes too much horizontal space');
  }
});
test('radar camera footprint and contact styles distinguish visible from offscreen enemies', () => {
  const view = { x: -500, y: -400, w: 1000, h: 800, scale: 1 },
    player = { x: 0, y: 200 };
  const rect = radarRect(960, 720);
  const radar = localRadar(
    view,
    player,
    rect,
    [
      { id: 'shield', kind: 'bastion', x: 50, y: 0 },
      { id: 'above', kind: 'fang', x: 0, y: -900 },
      { id: 'far', kind: 'fang', x: 0, y: -9000 },
    ],
    { x: 1e6, y: -1e6 },
  );
  assert.equal(radar.blips.length, 2);
  assert.equal(radar.blips[0].onScreen, true);
  assert.equal(radar.blips[0].kind, 'bastion');
  assert.equal(radar.blips[1].onScreen, false);
  const v = radar.viewport;
  assert.ok(
    v.w > 0 &&
      v.h > 0 &&
      v.x >= radar.left &&
      v.y >= radar.top &&
      v.x + v.w <= radar.right &&
      v.y + v.h <= radar.bottom,
  );
  assert.ok(
    radar.player.x >= v.x &&
      radar.player.x <= v.x + v.w &&
      radar.player.y >= v.y &&
      radar.player.y <= v.y + v.h,
  );
  assert.ok(radar.portal.x <= radar.right && radar.portal.y >= radar.top);
});
test('HUD overlap follows world camera and actor radius, not fixed corners', () => {
  const view = { x: 1000, y: -6000, scale: 0.5 },
    r = { x: 700, y: 100, w: 120, h: 120 };
  assert.equal(overlapsHUD(view, r, { x: 2500, y: -5700 }, 30), true);
  assert.equal(overlapsHUD(view, r, { x: 1000, y: -6000 }, 30), false);
  assert.equal(overlapsHUD(view, r, { x: 2370, y: -5700 }, 30), true);
});

test('transient labels avoid score, speed dial, sector stamp and radar', () => {
  for (const [w, h] of [
    [1280, 720],
    [550, 720],
    [860, 440],
  ]) {
    for (const p of [
      { x: 30, y: 60 },
      { x: w - 30, y: 100 },
      { x: w - 30, y: h - 30 },
      { x: 40, y: h - 20 },
    ]) {
      const q = overlayPoint(w, h, p, { radius: 20 });
      assert.ok(q.x >= 20 && q.y >= 20 && q.x <= w - 20 && q.y <= h - 20);
      const radar = radarRect(w, h);
      assert.ok(
        !overlapsHUD({ x: 0, y: 0, scale: 1 }, radar, q, 8),
        'label overlaps radar',
      );
      if (q.y < 282)
        assert.ok(
          q.x - 20 >= 20 + Math.min(w * 0.34, 300) &&
            q.x + 20 <= w - 20 - Math.min(w * 0.34, 300),
          'label overlaps top HUD',
        );
    }
  }
});
