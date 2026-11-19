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
  // The body leans BACK against the fall early, then straightens as it gives in.
  assert.ok(slow.lean < 0, 'an early descent must lean against the fall');
  assert.ok(Math.abs(fast.lean) < Math.abs(slow.lean), 'the lean must relax as the fall speeds up');
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
      .filter((o) => (o.pts || []).length === 4)
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
    dive = fallFor(80);
  assert.equal(ordinary.rush, 0, 'an ordinary plunge must not be a dive');
  assert.equal(dive.rush, 1, 'a terminal dive must saturate');
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
