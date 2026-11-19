import test from 'node:test';
import assert from 'node:assert/strict';
import {
  MOTION,
  speedRamp,
  stretchFor,
  leanFor,
  dampedTarget,
  createShake,
  speedReadout,
  enemyIsSharp,
  HYPER_SPEED,
} from '../src/motion.js';
import { MAX_SPEED } from '../src/physics.js';
import { createCamera } from '../src/camera.js';

// --- the guarantee that matters most ---------------------------------------
test('enemies are never blurred, at any speed', () => {
  // This is the one property the whole motion system exists to protect: a
  // blurred enemy is a missed tell, and a missed tell is a lost run.
  assert.equal(MOTION.enemyBlur, 0);
  assert.equal(enemyIsSharp(true), true);
  assert.equal(enemyIsSharp(false), true);
});

test('the player stretches and blurs with speed, monotonically and capped', () => {
  let prevBlur = -1;
  for (let s = 0; s <= MAX_SPEED * 1.5; s += 1) {
    const e = stretchFor(s);
    assert.ok(e.blur >= prevBlur, `blur fell at speed ${s}`);
    // ── THE CAP IS NOT `blurMax` ────────────────────────────────────────────
    //
    // This used to assert `blur <= MOTION.blurMax`, and that assertion was
    // ENCODING THE BUG rather than a limit: before this change everything above
    // 42px/tick sat on exactly 19, so 42 and 120 blurred identically. The cap
    // now lives where it belongs -- a bounded extension past the normal limit,
    // because motion smear is the one channel where more really is nauseating.
    assert.ok(
      e.blur <= MOTION.blurMax * 1.8,
      `blur past its hard ceiling at ${s}: ${e.blur}`,
    );
    // The ceiling rose with the "more juice at higher speed" pass: the cube
    // now reaches 1.52 along at REDLINE instead of 1.34, so the last stretch
    // of speed is visible rather than a rounded-off constant. `across` narrows
    // further to match, but must never reach 0 (a zero-width cube cannot be
    // aimed).
    assert.ok(e.along >= 1 && e.along <= 1.55, `along out of range at ${s}`);
    assert.ok(e.across > 0.7 && e.across <= 1, `across out of range at ${s}`);
    prevBlur = e.blur;
  }
  // A resting cube is completely still: no stretch, no smear.
  const still = stretchFor(0);
  assert.equal(still.blur, 0);
  assert.equal(still.along, 1);
  assert.equal(still.across, 1);
  assert.equal(speedRamp(0), 0);
  assert.equal(speedRamp(MAX_SPEED), 1);
});

// --- camera calm ----------------------------------------------------------
test('the camera ignores motion inside its dead zone and leans only when committed', () => {
  // Inside the dead zone the ideal target is returned unchanged apart from the
  // dead-zone subtraction, so a jittery thumb cannot drag the world.
  const view = 1000;
  const still = dampedTarget({ x: 5, y: 5 }, { x: 0, y: 0 }, view, view);
  assert.equal(still.x, 0, 'a 5px wobble must not move the camera');
  assert.equal(still.y, 0);
  // Well outside it, the camera does follow.
  const far = dampedTarget({ x: 900, y: 0 }, { x: 0, y: 0 }, view, view);
  assert.ok(far.x > 700, 'a real move is followed');
  // Lean is exactly zero below the committed threshold.
  assert.deepEqual(leanFor(0, 0), { x: 0, y: 0 });
  assert.deepEqual(leanFor(MAX_SPEED * MOTION.leanFrom * 0.5, 0), { x: 0, y: 0 });
  const hard = leanFor(MAX_SPEED, 0);
  assert.ok(hard.x > 0 && hard.x <= MOTION.leanMax + 1e-9, `lean ${hard.x}`);
});

test('the camera comes to rest and does not creep', () => {
  // Calm is not the follow rate: a loose follow lets the cube outrun the lens
  // and costs visible targets (measured: 30 kills -> 22 at follow 0.062).
  // What must be true is that a stationary cube gives a stationary camera.
  assert.ok(MOTION.follow <= 0.2, 'follow must not be a snap');
  const cam = createCamera();
  cam.resize(880, 710);
  cam.reset({ x: 0, y: 0 }, 1);
  const p = { x: 0, y: 0 };
  // Hold a still cube: the camera must come to rest, not creep.
  for (let i = 0; i < 400; i++) cam.tick(p, { x: 0, y: 0 }, false, true, null, 0);
  const a = cam.view(1);
  for (let i = 0; i < 60; i++) cam.tick(p, { x: 0, y: 0 }, false, true, null, 0);
  const b = cam.view(1);
  assert.ok(Math.abs(a.x - b.x) < 0.6 && Math.abs(a.y - b.y) < 0.6, 'camera drifts at rest');
});

// --- shake budget ---------------------------------------------------------
test('shake is capped by a regenerating budget, so it can never vibrate forever', () => {
  const sh = createShake();
  // Ask for far more than the budget, many times in a row.
  for (let i = 0; i < 40; i++) sh.ask(50, 0);
  assert.ok(sh.amount <= MOTION.shakeBudget + 1e-9, `amount ${sh.amount}`);
  // It decays back to rest.
  for (let i = 0; i < 200; i++) sh.tick(1);
  assert.equal(sh.amount, 0);
  // And a spent bank grants nothing until it regenerates.
  const spent = createShake();
  spent.ask(50, 0);
  const before = spent.amount;
  spent.tick(1);
  const after = spent.amount;
  assert.ok(after < before, 'shake must decay');
  assert.ok(spent.ask(0.0001, 0) === 0, 'a drained bank grants no new shake');
});

test('a high refresh rate cannot buy more shake than a low one', () => {
  // Two frames at dt=0.5 must leave the same amount as one frame at dt=1.
  const a = createShake(),
    b = createShake();
  a.ask(2, 0);
  b.ask(2, 0);
  a.tick(0.5);
  a.tick(0.5);
  b.tick(1);
  assert.ok(Math.abs(a.amount - b.amount) < 1e-9, `${a.amount} vs ${b.amount}`);
});

// --- speedometer ----------------------------------------------------------
test('the speedometer is monotonic, in range and names a band', () => {
  let prev = -1;
  for (let s = 0; s <= MAX_SPEED; s += 0.5) {
    const r = speedReadout(s);
    assert.ok(r.kmh >= prev, 'readout must not go backwards');
    assert.ok(r.kmh >= 0 && r.kmh <= 100, `kmh ${r.kmh}`);
    assert.ok(['DRIFT', 'CRUISE', 'SURGE', 'EDGE'].includes(r.band));
    prev = r.kmh;
  }
  assert.equal(speedReadout(0).kmh, 0);
  assert.equal(speedReadout(0).band, 'DRIFT');
  // ── THE DIAL RUNS TO THE REAL CEILING, NOT TO MAX_SPEED ──────────────────
  //
  // This used to assert `speedReadout(MAX_SPEED).kmh === 100`, which pinned the
  // exact calibration that made the HUD useless: measured ordinary flight sat
  // at p50 42.0 / p90 42.0 / p99 42.0 against MAX_SPEED 42, so the needle was
  // pegged for the whole game and "HYPER" was the only thing left to say. The
  // dial now spans the speed the game can actually reach.
  // An ordinary top-speed launch fills the first ~70% of the sweep: enough that
  // the needle MOVES through normal play (v2 of this dial left it at -20deg,
  // inert for the whole game), and still short of the top so hyper has room.
  const ordinaryFill = speedReadout(MAX_SPEED).kmh;
  assert.ok(
    ordinaryFill >= 60 && ordinaryFill <= 78,
    `an ordinary top-speed launch fills ${ordinaryFill}% of the dial`,
  );
  // And every speed past the limit must read HIGHER than the limit, not equal.
  let cruise = ordinaryFill;
  for (const sp of [60, 100, 180, 280, 378]) {
    const now = speedReadout(sp, MAX_SPEED, HYPER_SPEED, true).kmh;
    assert.ok(now >= cruise, `the dial went backwards at ${sp}: ${cruise} -> ${now}`);
    cruise = now;
  }
  assert.ok(cruise > ordinaryFill + 20, 'hyper barely moves the dial past ordinary speed');
  // 280 is hyper's CEILING, but the physics can go past it -- a wall rebound at
  // full hyper returns up to 1.35x, which is 378. The dial's last 7 points
  // belong to that supersonic range, so hyper's ceiling reads 93 and only a full
  // sonic rebound fills the gauge.
  assert.ok(
    speedReadout(HYPER_SPEED).kmh >= 90 && speedReadout(HYPER_SPEED).kmh < 100,
    `hyper's ceiling should nearly fill the dial, got ${speedReadout(HYPER_SPEED).kmh}`,
  );
  assert.equal(speedReadout(HYPER_SPEED * 1.35, MAX_SPEED, HYPER_SPEED, true).kmh, 100);
  // The bands still climb in order, which is the property that matters.
  const ladder = [0, MAX_SPEED * 0.6, MAX_SPEED * 1.3, MAX_SPEED * 2.2].map(
    (v) => speedReadout(v).kmh,
  );
  assert.deepEqual([...ladder].sort((a, b) => a - b), ladder, 'the bands are not ordered');
});

test('the HUD may only say HYPER when hyper is actually live', () => {
  // THE BUG THIS PINS: the band was `speed > max ? 'HYPER' : ...`, so a single
  // wall bounce carrying the cube to 44px/tick earned the banner. Measured over
  // a real run: 27% of every HYPER label was false, and the fastest speed it
  // mislabelled was 106.7px/tick against a true hyper of 280. The word is a
  // reward for seven consecutive links, so the STATE has to decide it.
  for (const sp of [44, 60, 108, 150, 200, 279]) {
    assert.notEqual(
      speedReadout(sp, MAX_SPEED, HYPER_SPEED, false).band,
      'HYPER',
      `${sp}px/tick outside the hyper state read as HYPER`,
    );
  }
  assert.equal(speedReadout(MAX_SPEED, MAX_SPEED, HYPER_SPEED, true).band, 'HYPER');
  // A hyper that has bled down to ordinary speed still wears the name while the
  // state is live -- it is a state, not a speed threshold.
  assert.equal(speedReadout(MAX_SPEED, MAX_SPEED, HYPER_SPEED, true).band, 'HYPER');
  // And the effect flag must follow the same rule.
  assert.equal(speedReadout(150, MAX_SPEED, HYPER_SPEED, false).over, false);
  assert.equal(speedReadout(150, MAX_SPEED, HYPER_SPEED, true).over, true);
});

/* ── THE CAMERA MUST NOT TELEPORT INTO THE PIN ──────────────────────────── */

test('the camera eases into its hyper pin instead of teleporting', () => {
  // THE BUG THIS PINS: the pin was `speed > MAX_SPEED` -> hard-set x/y. Measured
  // on a falling cube: screen-y 0.827 at 42px/tick, then 0.560 at 48 -- a 231px
  // jump in ONE frame, 27% of the viewport. It fired on every fall through the
  // line, which is exactly the "camera lags and jitters" report.
  const cam = createCamera();
  cam.resize(1560, 866);
  cam.reset({ x: 0, y: 0 }, 1, false);
  cam.snap({ x: 0, y: 0 }, true);
  const p = { x: 0, y: 0 };
  let vy = 30,
    prevUy = null,
    worst = 0,
    worstVy = 0;
  for (let i = 0; i < 80; i++) {
    vy += 5;
    p.y += vy;
    cam.tick({ ...p }, { x: 0, y: vy }, false, true, null, 0);
    const v = cam.view(1);
    const uy = (p.y - v.y) * v.scale / 866;
    if (prevUy !== null) {
      const d = Math.abs(uy - prevUy);
      if (d > worst) {
        worst = d;
        worstVy = vy;
      }
    }
    prevUy = uy;
  }
  // 12% of the viewport in a single frame is generous; the old cliff was 27%.
  assert.ok(
    worst < 0.12,
    `camera jumped ${(worst * 100).toFixed(1)}% of the viewport in one frame at ${worstVy}px/tick`,
  );
  // And it must still ARRIVE: the pin has to actually take effect at hyper.
  for (let i = 0; i < 30; i++) {
    p.y += 280;
    cam.tick({ ...p }, { x: 0, y: 280 }, false, true, null, 0);
  }
  const v = cam.view(1);
  const uy = (p.y - v.y) * v.scale / 866;
  assert.ok(Math.abs(uy - 0.56) < 0.02, `hyper is not pinned: cube at ${uy.toFixed(3)}`);
});

test('ordinary flight is not pinned, and hyper is', () => {
  const cam = createCamera();
  cam.resize(1560, 866);
  cam.reset({ x: 0, y: 500 }, 1, false);
  cam.snap({ x: 0, y: 500 }, true);
  // A normal full-power launch must still get ordinary framing (the follow is
  // allowed to lead), or the pin silently became the default view.
  const p = { x: 0, y: 500 };
  for (let i = 0; i < 20; i++) {
    p.y -= 42;
    cam.tick({ ...p }, { x: 0, y: -42 }, false, true, null, 0);
  }
  const normal = (p.y - cam.view(1).y) * cam.view(1).scale / 866;
  assert.ok(
    Math.abs(normal - 0.56) > 0.02,
    `ordinary flight is pinned at ${normal.toFixed(3)} -- the pin is always on`,
  );
});
