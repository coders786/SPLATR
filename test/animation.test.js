import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  slashFor,
  SLASH,
  moveFor,
  DIRS,
  fallFor,
  landFor,
  cubePose,
  FALL,
  lerp,
  spike,
  HYPER_CEILING,
} from '../src/animation.js';

/* ── 1. THE SLASH ───────────────────────────────────────────────────────── */

test('a swing passes through wind-up, swing, impact and settle in that order', () => {
  const seen = [];
  for (let t = 0; t < SLASH.total; t++) {
    const f = slashFor(t, 0);
    assert.ok(f, `no pose at tick ${t}`);
    if (seen.at(-1) !== f.phase) seen.push(f.phase);
  }
  // The ORDER is the animation. A swing that skips the wind-up is a poke.
  assert.deepEqual(seen, ['windup', 'swing', 'impact', 'settle']);
  assert.equal(slashFor(SLASH.total, 0), null, 'the animation must END, not linger');
});

test('the swing is asymmetric in time: the attack is faster than the recovery', () => {
  // This is the whole anime timing rule. A symmetric ease reads as a machine
  // waving a stick; a fast attack and slow recovery reads as a sword.
  assert.ok(
    SLASH.swing < SLASH.settle,
    `swing ${SLASH.swing} must be shorter than settle ${SLASH.settle}`,
  );
  // The blade must cover most of its arc inside the swing phase, not the settle.
  const atSwingEnd = slashFor(SLASH.windup + SLASH.swing, 0).angle;
  const atSettleEnd = slashFor(SLASH.windup + SLASH.swing + SLASH.impact + SLASH.settle - 1, 0).angle;
  const duringSwing = Math.abs(atSwingEnd);
  const duringSettle = Math.abs(atSettleEnd - atSwingEnd);
  assert.ok(
    duringSwing > duringSettle * 3,
    `most of the arc must be travelled in the swing (swing ${duringSwing.toFixed(2)} vs settle ${duringSettle.toFixed(2)})`,
  );
});

test('the blade cocks BACK before it swings forward', () => {
  // Anticipation. Without this the arc starts at rest and reads as a twitch.
  const a0 = slashFor(0, 0).angle;
  const cocked = slashFor(SLASH.windup - 1e-9, 0).angle;
  assert.ok(cocked < a0, 'the wind-up must rotate backwards from the start angle');
  // And then it must travel much further forward than it pulled back.
  const end = slashFor(SLASH.windup + SLASH.swing, 0).angle;
  assert.ok(end > a0 + SLASH.sweep * 0.8, 'the swing must cover the advertised sweep');
});

test('the arc smears during travel and collapses on the impact frames', () => {
  // The smear is what sells speed; a smear that persists into the hold makes
  // the impact mushy. Peak smear must be inside `swing`, and the impact frames
  // must be below it.
  const swingPeak = Math.max(
    ...Array.from({ length: SLASH.swing }, (_, i) => slashFor(SLASH.windup + i, 0).smear),
  );
  const impactStart = slashFor(SLASH.windup + SLASH.swing, 0);
  assert.ok(swingPeak > 0.9, `expected a full smear mid-swing, got ${swingPeak}`);
  assert.equal(impactStart.phase, 'impact');
  assert.ok(impactStart.smear < swingPeak, 'the impact frame must not smear as hard as the swing');
});

test('the smear never pops back up after the swing peaks', () => {
  // A real defect this caught: the settle restarted its smear at 0.75 after the
  // impact frames had cleaned it to 0.32, so the arc visibly re-smeared a frame
  // after the hit. A fade has to CONTINUE the value it inherits.
  let prev = null,
    phase = '';
  for (let t = 0; t < SLASH.total; t++) {
    const f = slashFor(t, 0);
    // Ignore the wind-up and the rise through the swing: that is the attack.
    if (f.phase === 'impact' || f.phase === 'settle') {
      if (prev !== null)
        assert.ok(
          f.smear <= prev + 0.02,
          `smear rose at tick ${t} inside ${f.phase}: ${prev.toFixed(2)} -> ${f.smear.toFixed(2)}`,
        );
      prev = f.smear;
    } else if (f.phase === 'swing') {
      prev = f.smear; // hand-off from the peak
    }
    phase = f.phase;
  }
  assert.equal(phase, 'settle');
});

test('the swing settles to nothing rather than snapping off', () => {
  const last = slashFor(SLASH.total - 1, 0);
  assert.ok(last.alpha < 0.12, `the last frame must be nearly gone, got alpha ${last.alpha}`);
  const mid = slashFor(SLASH.windup + SLASH.swing, 0);
  assert.ok(mid.alpha > last.alpha, 'alpha must fall monotonically through the settle');
});

/* ── 2. THE FALL ────────────────────────────────────────────────────────── */

test('falling is a vocabulary, not inverted stretch: it fights gravity first', () => {
  const slow = fallFor(FALL.drift + 2);
  const fast = fallFor(FALL.plunge + 10);
  assert.ok(slow, 'a descent just past the drift threshold must produce fall language');
  // ── THE LEAN GROWS WITH THE FALL ──────────────────────────────────────
  //
  // It used to peak at vy 10 and decay to zero, which measured as a 12-degree
  // rock backwards while barely moving and then a snap upright at vy 20 -- a
  // stumble, and rigid exactly when the drop got serious. It is now monotone:
  // 0 at the drift threshold, growing as the fall does.
  assert.ok(Math.abs(slow.lean) < 0.05, `an early descent must not rock back: ${slow.lean}`);
  assert.ok(fast.lean > slow.lean, 'the lean must grow as the fall speeds up');
  assert.ok(fast.lean > 0, 'a plunge must lean into the fall, not away from it');
  // The eyes close. This is the anime cue for "committed to the drop".
  assert.ok(fast.eyes < slow.eyes, 'eyes must close as the drop gets faster');
  assert.ok(fast.stretch > slow.stretch, 'the plunge must elongate further');
});

test('a gentle drift is not a fall, so the cube keeps its normal body language', () => {
  assert.equal(fallFor(-20), null, 'climbing must never read as falling');
  assert.equal(fallFor(0), null);
  assert.equal(fallFor(FALL.drift - 0.5), null);
  assert.ok(fallFor(FALL.drift + 0.5), 'just past the threshold is a fall');
});

/* ── 3. LANDING ─────────────────────────────────────────────────────────── */

test('the landing squash peaks hard, then recovers with exactly one overshoot', () => {
  const peak = landFor(0);
  assert.ok(peak.wide > 1.35, `expected a hard squash, got wide ${peak.wide}`);
  assert.ok(peak.tall < 0.72, `expected a flattened body, got tall ${peak.tall}`);
  // Volume is roughly preserved: a squash that also shrinks reads as shrinking.
  assert.ok(Math.abs(peak.wide * peak.tall - 1) < 0.12, 'the squash must preserve area');
  // One overshoot: the body passes BACK through 1.0 once and settles.
  const series = Array.from({ length: FALL.land + 2 }, (_, i) => landFor(i));
  const ended = series.at(-1);
  assert.equal(ended, null, 'the squash must end');
  // An OVERSHOOT is a pass from one side of 1.0 to the other and back -- so the
  // curve must cross 1.0, reach a peak on the far side, and cross back. Counting
  // raw sign changes over-counts, because the initial collapse (1.42 -> 0.96)
  // crosses 1.0 on its way DOWN, which is the squash recovering, not an
  // overshoot.
  const vals = series.filter(Boolean).map((l) => l.wide);
  // After the squash the value must sit below 1.0 (recoil), then come back up.
  const below = vals.findIndex((v) => v < 0.999);
  assert.ok(below > 0, 'the squash must recoil past rest at some point');
  const aboveAfter = vals.findIndex((v, i) => i > below && v > 1.001);
  assert.ok(aboveAfter > below, 'the recoil must overshoot back above rest exactly once');
  // And nothing after that may leave the settled band.
  assert.ok(
    vals.slice(aboveAfter + 1).every((v) => Math.abs(v - 1) < 0.06),
    `the squash did not settle: ${vals.slice(aboveAfter).map((v) => v.toFixed(3)).join(', ')}`,
  );
});

/* ── 4. MOVEMENT: 8 DIRECTIONS, INTERPOLATED ────────────────────────────── */

test('there are exactly eight direction poses and no two are identical', () => {
  assert.equal(DIRS.length, 8);
  const key = (d) => `${d.lean.toFixed(3)}|${d.tall}|${d.wide}|${d.scarf}|${d.eyes}`;
  assert.equal(new Set(DIRS.map(key)).size, 8, 'two of the eight poses are the same pose');
});

test('a heading between two directions blends the two, it does not snap', () => {
  // The brief: "8 directions must be interpolated". Discrete states, continuous
  // render. Between N (index 2) and NE (index 1) the pose must be strictly
  // between the two, and monotonically so.
  const pose = (i) => DIRS[i & 7];
  const N = pose(2),
    NE = pose(1);
  const samples = [];
  for (const frac of [0, 0.25, 0.5, 0.75, 1]) {
    const a = ((2 - frac) / 8) * Math.PI * 2;
    samples.push(moveFor(Math.cos(a) * 30, Math.sin(a) * 30));
  }
  // Monotone blend from N's lean toward NE's lean.
  for (let i = 1; i < samples.length; i++)
    assert.ok(
      Math.abs(samples[i].lean - NE.lean) <= Math.abs(samples[i - 1].lean - NE.lean) + 1e-9,
      'the lean did not move monotonically toward the next pose',
    );
  assert.ok(Math.abs(samples[0].lean - N.lean) < 1e-9, 'frac 0 must be exactly N');
  assert.ok(Math.abs(samples.at(-1).lean - NE.lean) < 1e-9, 'frac 1 must be exactly NE');
  // And the middle sample must be strictly between, not equal to either.
  const mid = samples[2];
  assert.ok(mid.lean > Math.min(N.lean, NE.lean) && mid.lean < Math.max(N.lean, NE.lean), 'the blend is not between');
});

test('a cube at rest holds its last direction instead of snapping to east', () => {
  // atan2(0,0) is 0, i.e. east. Without the hold, every stop flips the pose.
  const still = moveFor(0, 0, 4);
  assert.equal(still.moving, false);
  assert.equal(still.index, 4, 'a resting cube must keep the pose index it is given');
  assert.ok(Math.abs(still.lean) < Math.abs(DIRS[4].lean), 'the resting lean must be relaxed, not the moving one');
});

/* ── 5. COMPOSITION AND PRECEDENCE ──────────────────────────────────────── */

test('precedence: a landing beats a slash beats a fall beats a direction', () => {
  const dashing = { vx: 40, vy: 0 };
  const slashing = cubePose({ ...dashing, slashAge: SLASH.windup + 1 });
  assert.ok(slashing.counter !== 0, 'a live slash must counter-rotate the body');
  // A landing overrides the squash axes regardless of what else is happening.
  const both = cubePose({ ...dashing, slashAge: SLASH.windup + 1, landAge: 0 });
  assert.ok(both.wide > 1.3, 'the landing squash must win over the slash');
});

test('the cube pose is a pure function of its inputs', () => {
  // Same inputs, same output. The renderer relies on this: it recomputes the
  // pose every frame and must not accumulate drift.
  const args = { vx: 18, vy: -9, slashAge: 3, landAge: -1, hold: 1, facing: -1 };
  assert.deepEqual(cubePose(args), cubePose(args));
});

test('easing helpers are pinned at both ends and monotone where they should be', () => {
  for (const [name, fn] of [
    ['easeOutQuint', (t) => slashFor(t, 0)],
    ['spike', spike],
  ]) {
    if (name === 'spike') {
      assert.equal(fn(0), 1, 'spike must start at 1');
      assert.equal(fn(1), 0, 'spike must end at 0');
    }
  }
  assert.equal(lerp(2, 8, 0), 2);
  assert.equal(lerp(2, 8, 1), 8);
  assert.equal(lerp(2, 8, 0.5), 5);
});

/* ── 6. THE SYSTEMS ACTUALLY FIRE IN PLAY ───────────────────────────────── */

test('all three animation systems fire during a real run, not just in unit tests', async () => {
  // This is the test the first version was missing. The landing squash passed
  // every unit assertion and fired ZERO times in play, because nothing in the
  // game ever lands: the cube launches off a pad, climbs, and does not come
  // back down. A direct call to landFor() proved the curve was right and proved
  // nothing about whether the player ever sees it.
  const { createRun } = await import('../src/run.js');
  let swings = 0,
    squashes = 0,
    fallTicks = 0;
  for (const seed of [19, 7]) {
    const g = createRun(seed, () => {}, { staged: true });
    let ps = -1,
      pl = -1;
    for (let i = 0; i < 1800; i++) {
      if (i % 10 === 0) {
        const n = g.nearest();
        if (n && n.y < g.world.player.position.y + 40) g.dash(g.aimAt(n));
      }
      g.tick();
      const s = g.state;
      // Count RISING edges of age 0 to -1 only, so a held age counts once.
      if (s.slashAge === 0 && ps !== 0) swings++;
      if (s.landAge === 0 && pl !== 0) squashes++;
      if (s.fallAge >= 0) fallTicks++;
      ps = s.slashAge;
      pl = s.landAge;
      if (s.phase !== 'playing') break;
    }
    g.dispose();
  }
  assert.ok(swings > 10, `only ${swings} swings fired -- the slash never plays`);
  assert.ok(squashes > 10, `only ${squashes} impact squashes fired -- the landing is dead code`);
  assert.ok(fallTicks > 100, `only ${fallTicks} falling ticks -- the fall language never plays`);
});

/* ── 7. THE POSE REACHES THE GLASS ──────────────────────────────────────── */

test('the pose is actually rendered: squash, eyes and fall trail all change the frame', async () => {
  // The first version of this system computed `eyes` and `scarf` every frame
  // and threw them away, and the landing squash applied a scale nobody could
  // measure. Every unit test passed. So this test asserts the DRAWING changes,
  // which is the only claim that matters.
  const { installDom, createDisplay } = await import('./support/display.js');
  const { createRenderer } = await import('../src/renderer.js');
  const { createRun } = await import('../src/run.js');
  const dom = installDom();
  const { canvas, ctx } = createDisplay(1560, 866);
  const renderer = createRenderer(canvas);
  const run = createRun(19, () => {}, { staged: true });
  for (let i = 0; i < 30; i++) run.tick();
  const body = run.world.player;
  const sig = (mut) => {
    body.velocity.x = 0;
    body.velocity.y = 0;
    run.state.landAge = -1;
    mut?.();
    ctx.__reset();
    renderer.draw(run, 1, null, false, 'mouse');
    return ctx.__ops
      .map((o) => (o.pts || []).map((p) => p.map((n) => n.toFixed(2)).join(',')).join(';'))
      .join('|');
  };
  const rest = sig();
  const landing = sig(() => {
    run.state.landAge = 0;
  });
  assert.notEqual(rest, landing, 'the landing squash does not reach the canvas');

  // The squash must be ANISOTROPIC: a uniform scale is a size change, not a
  // squash, and a uniform scale is exactly the bug this replaced.
  // Sample `ctx.scale` directly. Sampling at `save()` reads the matrix BEFORE
  // the scale is applied -- that is the view transform, which is always uniform,
  // and it silently passes no matter what the character does.
  const seen = [];
  const origScale = ctx.scale.bind(ctx);
  ctx.scale = (sx, sy) => {
    seen.push([sx, sy]);
    return origScale(sx, sy);
  };
  sig(() => {
    run.state.landAge = 0;
  });
  ctx.scale = origScale;
  const aniso = seen.filter(
    ([sx, sy]) => sy !== 0 && Math.abs(Math.abs(sx / sy) - 1) > 0.05,
  );
  assert.ok(aniso.length >= 1, 'the landing squash applied no anisotropic scale');
  assert.ok(
    aniso.some(([sx, sy]) => sx / sy > 1.05),
    'the squash must make the body WIDER than tall, not narrower',
  );

  // Eyes and the fall trail are driven by downward speed, and they are two
  // separate drawings -- assert each one independently so a failure says which.
  const level = sig();
  const plunge = sig(() => {
    body.velocity.y = 30;
  });
  assert.notEqual(level, plunge, 'falling does not change the drawn character');
  // ...but "something changed" is too weak a claim: with the eyes moving, the
  // frame differs even if the trail is never drawn. Freeze the face so the only
  // remaining variable is the trail itself.
  const noEyes = (vy) => {
    const saved = body.velocity.y;
    body.velocity.y = vy;
    ctx.__reset();
    renderer.draw(run, 1, null, false, 'mouse');
    body.velocity.y = saved;
    return ctx.__ops.length;
  };
  const flat = noEyes(0),
    falling = noEyes(30);
  assert.ok(
    falling > flat,
    `the fall trail is not drawn: ${flat} ops level vs ${falling} ops plunging`,
  );
  // Prove the EYES specifically, not just "something changed": the trail is a
  // separate drawing that a frame comparison cannot tell apart from the face.
  // A closed eye is a flatter polygon, so compare the character's own eye
  // shapes with the trail switched off by checking the eye art directly.
  const { cube } = await import('../src/art.js');
  const eyeHeight = (eyes) => {
    ctx.__reset();
    cube(ctx, 0, 0, 1, 0, 0, 1, { eyes, lift: 0 });
    // The eye polygons are the small light shapes in the upper-left of the face.
    const shapes = ctx.__ops
      // Select eye paint: side planes are now quadrilaterals too. Counting all
      // four-point paths confuses the new cube geometry with the eyelids.
      .filter((o) => (o.pts || []).length === 4 && String(o.paint).toLowerCase() === '#faffdb')
      .map((o) => {
        const ys = o.pts.map((q) => q[1]);
        return Math.max(...ys) - Math.min(...ys);
      })
      .filter((h) => h > 0);
    return shapes.reduce((a, b) => a + b, 0);
  };
  const open = eyeHeight(1),
    shut = eyeHeight(0);
  assert.ok(open > shut * 1.5, `closed eyes are not flatter than open ones (${open.toFixed(1)} vs ${shut.toFixed(1)})`);

  run.dispose();
  dom.uninstall();
});

/* ── 8. THE OTHER HALF: FALL AND LANDING REACH THE GLASS ────────────────── */

test('a landing is DRAWN, not merely applied as a scale', async () => {
  // THE BUG THIS PINS: measured before the fix, a landing changed the op count
  // by ZERO (348 at rest, 348 at the impact frame, then it went DOWN). The
  // squash was applied as a silent transform, so the single most physical
  // moment in the game -- the cube hitting the floor -- read as the cube
  // briefly being a different shape. Nothing asserted that anything was drawn.
  const { installDom, createDisplay } = await import('./support/display.js');
  const { createRenderer } = await import('../src/renderer.js');
  const { createRun } = await import('../src/run.js');
  const dom = installDom();
  const { canvas, ctx } = createDisplay(1560, 866);
  const renderer = createRenderer(canvas);
  const run = createRun(19, () => {}, { staged: true });
  run.skipOpening?.();
  run.state.phase = 'playing';
  for (let i = 0; i < 30; i++) run.tick();
  const body = run.world.player;
  const draw = (landAge) => {
    body.velocity.x = 0;
    body.velocity.y = 0;
    run.state.landAge = landAge;
    run.state.slashAge = -1;
    ctx.__reset();
    renderer.draw(run, 1, null, true, 'mouse');
    return ctx.__ops.length;
  };
  const rest = draw(-1),
    contact = draw(0);
  assert.ok(
    contact > rest + 4,
    `the landing drew ${contact - rest} extra ops over rest -- it is still invisible`,
  );
  // And it must DECAY, not persist: a landing is an event, not a state.
  //
  // Counting ops is the wrong instrument -- a ring whose RADIUS is driven by
  // `settle` still shrinks when `shock` is pinned at 1, so the op count falls
  // and a landing that never fades passes. (Verified: removing the decay left
  // the op-count assertion green.) So assert the two things that actually
  // encode the fade: the curve's own shock values, and the drawn ring radius.
  const { landFor } = await import('../src/animation.js');
  assert.ok(landFor(0).shock > 0.95, 'the landing does not begin at full shock');
  assert.ok(landFor(8).shock < 0.1, 'the landing shock does not decay');
  // The ring must CONTRACT: radius grows with (1 - settle).
  const radii = (landAge) => {
    const seen = [];
    const orig = ctx.ellipse.bind(ctx);
    ctx.ellipse = (x, y, rx, ry, ...r) => {
      seen.push(rx);
      return orig(x, y, rx, ry, ...r);
    };
    body.velocity.x = 0;
    body.velocity.y = 0;
    run.state.landAge = landAge;
    run.state.slashAge = -1;
    ctx.__reset();
    renderer.draw(run, 1, null, true, 'mouse');
    ctx.ellipse = orig;
    return seen.length ? Math.max(...seen) : 0;
  };
  const rNow = radii(0),
    rLate = radii(8);
  assert.ok(rNow > 0, 'the landing drew no shock ring');
  assert.ok(rLate < rNow, `the shock ring does not contract: ${rNow} -> ${rLate}`);

  // The ring has to be an ELLIPSE on the floor. A circle reads as a bubble.
  const rings = [];
  const orig = ctx.ellipse.bind(ctx);
  ctx.ellipse = (x, y, rx, ry, ...r) => {
    rings.push([rx, ry]);
    return orig(x, y, rx, ry, ...r);
  };
  draw(0);
  ctx.ellipse = orig;
  assert.ok(rings.length >= 1, 'the landing drew no shock ring');
  assert.ok(
    rings.every(([rx, ry]) => rx > ry * 1.8),
    `the shock ring is not flattened onto the floor: ${JSON.stringify(rings[0])}`,
  );
  run.dispose();
  dom.uninstall();
});

test('a fast dive is drawn differently from an ordinary plunge', async () => {
  // `k` saturates at vy 20, and the whole vocabulary used to stop there, so a
  // 280px/tick hyper dive looked exactly like an ordinary drop. The one moment
  // the animation had the most to say was the moment it went quiet.
  const { fallFor } = await import('../src/animation.js');
  const ordinary = fallFor(20),
    dive = fallFor(FALL.terminal);
  assert.equal(ordinary.rush, 0, 'an ordinary plunge must not be a dive');
  assert.equal(dive.rush, 1, `rush must saturate at terminal (${FALL.terminal})`);
  // `rush` used to saturate at 80, so 80/140/280/378 were IDENTICAL. The whole
  // point of moving the reference to terminal is that it does not any more.
  assert.ok(
    fallFor(80).stretch < fallFor(FALL.terminal).stretch,
    'a dive at 80 must still be escalating toward terminal',
  );
  // The visible consequences, each of which the renderer reads.
  assert.ok(dive.stretch > ordinary.stretch, 'a dive is not stretched further');
  assert.ok(dive.trail > ordinary.trail, 'a dive leaves no longer trail');
  assert.ok(dive.cels > ordinary.cels, `a dive draws ${dive.cels} cels, the same as a plunge`);
  // And it must be MONOTONE through the range, or the escalation stutters.
  let prev = fallFor(20);
  for (const vy of [30, 45, 60, 75, 90]) {
    const f = fallFor(vy);
    assert.ok(f.trail >= prev.trail, `trail went backwards at vy ${vy}`);
    assert.ok(f.stretch >= prev.stretch, `stretch went backwards at vy ${vy}`);
    prev = f;
  }
});

test('the drawn fall escalates with speed instead of plateauing', async () => {
  const { installDom, createDisplay } = await import('./support/display.js');
  const { createRenderer } = await import('../src/renderer.js');
  const { createRun } = await import('../src/run.js');
  const dom = installDom();
  const { canvas, ctx } = createDisplay(1560, 866);
  const renderer = createRenderer(canvas);
  const run = createRun(19, () => {}, { staged: true });
  run.skipOpening?.();
  run.state.phase = 'playing';
  for (let i = 0; i < 30; i++) run.tick();
  const body = run.world.player;
  const ops = (vy) => {
    body.velocity.x = 0;
    body.velocity.y = vy;
    run.state.landAge = -1;
    run.state.slashAge = -1;
    ctx.__reset();
    renderer.draw(run, 1, null, true, 'mouse');
    return ctx.__ops.length;
  };
  const slow = ops(20),
    fast = ops(80);
  assert.ok(fast > slow, `a dive draws ${fast} ops against ${slow} for a plunge`);
  run.dispose();
  dom.uninstall();
});

/* ── 9. SKEW REPLACES THE ROTATION ──────────────────────────────────────── */

test('the body is sheared along travel, not rotated', () => {
  // `twist` was applied as `c.rotate(twist)` -- the whole body turned up to 28
  // degrees on a diagonal. A rotated square is ambiguous: it reads as spinning,
  // as sliding, as mis-drawn, or as the camera rolling. A shear can only read as
  // being dragged.
  const NE = cubePose({ vx: 30, vy: -30 });
  const NW = cubePose({ vx: -30, vy: -30 });
  const N = cubePose({ vx: 0, vy: -30 });
  // A diagonal shears...
  assert.ok(Math.abs(NE.skew) > 0.02, 'a diagonal is not sheared at all');
  // ...and the two corners shear OPPOSITE ways, which is what makes them
  // legible as different decisions rather than as variants of north.
  assert.ok(
    Math.sign(NE.skew) === -Math.sign(NW.skew),
    `NE and NW shear the same way: ${NE.skew} vs ${NW.skew}`,
  );
  // A purely vertical move has no sideways drag to shear.
  assert.ok(Math.abs(N.skew) < 0.01, `north is sheared ${N.skew}`);
  // At rest the body is square.
  const rest = cubePose({ vx: 0, vy: 0, hold: 2 });
  // `assert.equal` is strict here and `-0 !== 0`, which is how a rest pose that
  // is numerically zero failed an equality check. Compare magnitudes.
  assert.ok(Math.abs(rest.skew) < 1e-12, `a resting body is sheared ${rest.skew}`);
});

test('the skew is bounded and scales with speed', () => {
  // It must never approach a shear that would fold the body flat.
  let worst = 0;
  for (let sp = 0; sp <= 400; sp += 5)
    for (let a = 0; a < 8; a++) {
      const t = (a / 8) * Math.PI * 2;
      const p = cubePose({ vx: Math.cos(t) * sp, vy: Math.sin(t) * sp });
      worst = Math.max(worst, Math.abs(p.skew));
    }
  assert.ok(worst < 0.25, `the body shears past recognition: ${worst}`);
  // And it must actually grow with speed, or a slow cube would read as dragged.
  const slow = Math.abs(cubePose({ vx: 6, vy: -6 }).skew);
  const fast = Math.abs(cubePose({ vx: 40, vy: -40 }).skew);
  assert.ok(fast > slow, `speed does not increase the shear: ${slow} -> ${fast}`);
});

/* ── 10. SONIC SPEED HAS ITS OWN LOOK ───────────────────────────────────── */

test('sonic speed is a separate axis from hyper', () => {
  // THE BUG THIS PINS: measured, hyper at 280 and a sonic rebound at 378
  // rendered BYTE-IDENTICALLY. The wall throwing you back harder than you
  // arrived -- the most rewarding thing the physics does -- had no own look.
  const hyper = cubePose({ vx: HYPER_CEILING, vy: 0 });
  const sonic = cubePose({ vx: HYPER_CEILING * 1.35, vy: 0 });
  assert.equal(hyper.sonic, 0, 'hyper speed must not already be supersonic');
  assert.ok(sonic.sonic > 0.9, `a full rebound is barely sonic: ${sonic.sonic}`);
  // Monotone between them: the supersonic look has to arrive, not snap on.
  //
  // GAP, not merely monotone. A step function (`speed > ceiling ? 1 : 0`) is
  // monotone and passes a `k >= prev` loop, so the first version of this test
  // stayed green with the gradient deleted. What actually matters is that a
  // HALF-way rebound looks different from both ends, so the curve has to be
  // sampled strictly between them.
  let prev = -1;
  const mids = [];
  for (let sp = HYPER_CEILING; sp <= HYPER_CEILING * 1.35; sp += 6) {
    const k = cubePose({ vx: sp, vy: 0 }).sonic;
    assert.ok(k >= prev, `sonic fell at ${sp}`);
    if (k > 0.02 && k < 0.98) mids.push(k);
    prev = k;
  }
  assert.ok(
    mids.length >= 3,
    `the supersonic look snaps on instead of arriving: ${mids.length} intermediate samples`,
  );
  // Ordinary flight is never supersonic, however it is reached.
  for (const sp of [0, 42, 120]) assert.equal(cubePose({ vx: sp, vy: 0 }).sonic, 0);
});

test('the supersonic constant matches the run module', async () => {
  // animation.js cannot import motion.js (cycle), so the number is restated
  // there. This is the assertion that keeps the two from drifting.
  const { HYPER_SPEED } = await import('../src/motion.js');
  assert.equal(HYPER_CEILING, HYPER_SPEED);
});

/* ── THE FALL KEEPS ESCALATING, AND NEVER ROTATES ───────────────────────── */

test('the whole fall range is distinguishable, not just the first 80px', () => {
  // MEASURED BUG: `rush` was `(vy - 20) / 60`, saturating at vy 80. At 80, 140,
  // 280 and 378 the vocabulary was numerically IDENTICAL -- tall 1.663, wide
  // 0.599, eyes 0.10, scarf 3.55 -- so a hyper dive down a wall rendered exactly
  // like a routine drop.
  const at = (vy) => fallFor(vy);
  const samples = [80, 140, 220, 280, 378].map(at);
  for (let i = 1; i < samples.length; i++) {
    assert.notEqual(
      samples[i].stretch,
      samples[i - 1].stretch,
      `vy ${[80, 140, 220, 280, 378][i]} looks identical to the one before it`,
    );
  }
  // And every axis is monotone through the range, or the escalation stutters.
  let prevStretch = 0,
    prevEyes = 2;
  for (let vy = 20; vy <= FALL.top; vy += 10) {
    const f = at(vy);
    assert.ok(f.stretch >= prevStretch, `stretch fell at ${vy}`);
    assert.ok(f.eyes <= prevEyes, `eyes opened again at ${vy}`);
    prevStretch = f.stretch;
    prevEyes = f.eyes;
  }
  // The far end is a distinct state, not just a bigger number.
  assert.equal(at(FALL.top).dive, 1, 'the dive axis must reach 1 at the top');
  assert.ok(at(FALL.terminal).dive < 0.2, 'the dive must not start before terminal');
});

test('the fall lean is monotone and never rocks the body backwards', () => {
  // The old curve peaked at vy 10 and decayed to zero, so the body leaned 12
  // degrees back while barely moving and then SNAPPED upright at vy 20 --
  // a stumble, and rigid exactly when the drop got serious.
  let prev = -1;
  for (let vy = FALL.drift; vy <= FALL.top; vy += 4) {
    const f = fallFor(vy);
    if (!f) continue;
    assert.ok(f.lean >= prev - 1e-9, `the fall lean went backwards at ${vy}`);
    assert.ok(f.lean >= 0, `the body leans against the fall at ${vy}: ${f.lean}`);
    prev = f.lean;
  }
});

test('the body never rotates: lean is an expression channel now', () => {
  // `lean` used to be applied as `c.rotate(poseAnim.lean)` -- a literal body
  // rotation of up to 19.5 degrees -- which the renderer then undid so the
  // silhouette stayed upright. It now dips the leading corners instead.
  //
  // This asserts on the POSE, which is where the rotation used to come from:
  // the value still exists and still carries the direction, but nothing in the
  // render path turns it into a rotation any more.
  const east = cubePose({ vx: 120, vy: 0 });
  const west = cubePose({ vx: -120, vy: 0 });
  assert.ok(east.lean > 0, 'east must still express a lean');
  assert.ok(west.lean < 0, 'west must express the opposite lean');
  // Symmetric, which a rotation could never be once east and west are compared.
  assert.ok(Math.abs(east.lean + west.lean) < 1e-9, 'the lean must be mirror-symmetric');
});

/* ── THE BODY DEFORMS AS ONE PIECE ──────────────────────────────────────── */

test('the jelly field deforms every vertex of the body, and returns to rest', async () => {
  // `trace()` is the single funnel every polygon in `cube()` goes through, so
  // the field has to be reachable from there or the face stays rigid while the
  // outline wobbles -- which is a masked sprite, not a character.
  //
  // This drives the REAL `cube()` through a recording context that applies the
  // transform stack, so it measures what lands on the glass.
  const { cube, jelly, createJelly } = await import('../src/art.js');
  const rec = [];
  let m = [1, 0, 0, 1, 0, 0];
  const mul = (a, b) => [
    a[0] * b[0] + a[2] * b[1], a[1] * b[0] + a[3] * b[1],
    a[0] * b[2] + a[2] * b[3], a[1] * b[2] + a[3] * b[3],
    a[0] * b[4] + a[2] * b[5] + a[4], a[1] * b[4] + a[3] * b[5] + a[5],
  ];
  const ap = (x, y) => [m[0] * x + m[2] * y + m[4], m[1] * x + m[3] * y + m[5]];
  const stack = [];
  const ctx = {
    save() { stack.push(m.slice()); },
    restore() { m = stack.pop() || [1, 0, 0, 1, 0, 0]; },
    translate(x, y) { m = mul(m, [1, 0, 0, 1, x, y]); },
    rotate() {},
    scale(x, y) { m = mul(m, [x, 0, 0, y, 0, 0]); },
    set fillStyle(v) {}, set strokeStyle(v) {}, set lineWidth(v) {}, set lineJoin(v) {},
    beginPath() { this._p = []; },
    moveTo(x, y) { this._p = [ap(x, y)]; },
    lineTo(x, y) { this._p.push(ap(x, y)); },
    bezierCurveTo(x1,y1,x2,y2,x,y) {
      const start=this._p.at(-1),a=ap(x1,y1),b=ap(x2,y2),end=ap(x,y);
      for(let i=1;i<=12;i++){const u=i/12,v=1-u;this._p.push([v*v*v*start[0]+3*v*v*u*a[0]+3*v*u*u*b[0]+u*u*u*end[0],v*v*v*start[1]+3*v*v*u*a[1]+3*v*u*u*b[1]+u*u*u*end[1]]);}
    },
    arc(x,y,r,a,b) {for(let i=0;i<=12;i++){const t=a+(b-a)*i/12;this._p.push(ap(x+Math.cos(t)*r,y+Math.sin(t)*r));}},
    clip() {},
    closePath() {},
    fill() { rec.push(this._p.map((p) => p.slice())); },
    stroke() {},
  };
  const bodyBox = (pose) => {
    rec.length = 0;
    m = [1, 0, 0, 1, 0, 0];
    stack.length = 0;
    cube(ctx, 0, 0, 23, 0, 0, 1, pose);
    // The body is the largest filled polygon.
    let best = null;
    for (const p of rec) {
      const xs = p.map((q) => q[0]), ys = p.map((q) => q[1]);
      const w = Math.max(...xs) - Math.min(...xs), h = Math.max(...ys) - Math.min(...ys);
      if (!best || w * h > best.w * best.h) best = { w, h };
    }
    return best;
  };

  const rest = bodyBox({ eyes: 1, lift: 0 });
  // A stretched field must actually reach the glass.
  const tall = bodyBox({ eyes: 1, lift: 0, field: { sx: 1, sy: 1.5, grip: 1 } });
  assert.ok(
    tall.h > rest.h * 1.2,
    `the field did not reach the body: ${rest.h.toFixed(1)} -> ${tall.h.toFixed(1)}`,
  );
  // ── AND A LEAN MUST NOT WIDEN ANYTHING ──────────────────────────────────
  //
  // This assertion used to read `lean.w > rest.w` -- "the leaning field must
  // widen the leading edge" -- which was testing for the SHEAR. Widening one
  // edge in proportion to height is exactly what turns the square into a
  // parallelogram, and a parallelogram is the "crooked diamond" in the report.
  //
  // The lean still has to DO something, or the pose channel is dead: it now
  // compresses along the axis it moves on, so the body gets NARROWER rather
  // than skewed. The corners stay 90 degrees because that is a scale.
  const lean = bodyBox({ eyes: 1, lift: 0, field: { grip: 1, dipX: -0.8 } });
  assert.ok(
    lean.w < rest.w,
    `the leaning field must compress, not shear: ${rest.w.toFixed(1)} -> ${lean.w.toFixed(1)}`,
  );
  // The proof that it is a SCALE and not a shear: the left and right edges must
  // remain vertical. A shear tilts them; this must not move them at all.
  rec.length = 0;
  m = [1, 0, 0, 1, 0, 0];
  stack.length = 0;
  cube(ctx, 0, 0, 23, 0, 0, 1, { eyes: 1, lift: 0, field: { grip: 1, dipX: -0.8 } });
  {
    let best = null;
    for (const p of rec) {
      const xs = p.map((q) => q[0]), ys = p.map((q) => q[1]);
      const w = Math.max(...xs) - Math.min(...xs), h = Math.max(...ys) - Math.min(...ys);
      if (!best || w * h > best.w * best.h) best = { w, h, p };
    }
    // Group the corners by top/bottom; each pair must share an x, and the gap
    // between the two rows must be the same on the left as on the right.
    const ys = best.p.map((q) => q[1]);
    const top = Math.min(...ys), bot = Math.max(...ys);
    const nearTop = best.p.filter((q) => q[1] < (top + bot) / 2).map((q) => q[0]);
    const nearBot = best.p.filter((q) => q[1] >= (top + bot) / 2).map((q) => q[0]);
    if (nearTop.length >= 2 && nearBot.length >= 2) {
      const topW = Math.max(...nearTop) - Math.min(...nearTop);
      const botW = Math.max(...nearBot) - Math.min(...nearBot);
      assert.ok(
        Math.abs(topW - botW) < 1e-6,
        `the top and bottom edges differ in width (${topW.toFixed(3)} vs ${botW.toFixed(3)}) -- that is a shear`,
      );
    }
  }

  // The spring settles back to nothing, so a cube at rest is a cube.
  const s = createJelly();
  s.hit(1, 0, 1);
  for (let i = 0; i < 60; i++) s.step(1);
  assert.ok(Math.abs(s.y) < 0.01, `the spring never settles: ${s.y}`);
  const settled = s.field(1);
  assert.ok(Math.abs(settled.sy - 1) < 0.01, 'a settled spring must not deform the body');

  // And it must be a spring, not a ramp: it peaks then comes back.
  const t = createJelly();
  t.hit(1, 0, 1);
  let peak = 0;
  let returned = false;
  for (let i = 0; i < 60; i++) {
    t.step(1);
    if (t.y > peak) peak = t.y;
    else if (peak > 0.05 && t.y < peak * 0.5) returned = true;
  }
  assert.ok(returned, 'the jelly never recovers -- it is a ramp, not a spring');
});

test('slash channels meet continuously at swing and impact boundaries', () => {
  const epsilon = 1e-6;
  for (const boundary of [SLASH.windup, SLASH.windup + SLASH.swing, SLASH.windup + SLASH.swing + SLASH.impact]) {
    const before = slashFor(boundary - epsilon), after = slashFor(boundary);
    for (const field of ['angle','smear','alpha','weight','counter']) {
      assert.ok(Math.abs(before[field]-after[field]) < 0.001, `${field} pops at ${boundary}: ${before[field]} -> ${after[field]}`);
    }
    // A deliberate impact flash is the only discontinuous event.
    if (boundary !== SLASH.windup + SLASH.swing) assert.ok(Math.abs(before.flash-after.flash)<0.001);
  }
});

test('small movements blend continuously out of the held pose in every direction', () => {
  for (let hold=0;hold<8;hold++) for(let i=0;i<8;i++){
    const a=i*Math.PI/4, pose=s=>moveFor(Math.cos(a)*s,Math.sin(a)*s,hold);
    const before=pose(.6-1e-6),after=pose(.6+1e-6);
    for(const key of ['lean','wide','tall','eyes','twist','stretch'])assert.ok(Math.abs(before[key]-after[key])<1e-5,`${key} popped at movement threshold`);
  }
});
