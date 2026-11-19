import test from 'node:test';
import assert from 'node:assert/strict';
import { createRun, HYPER } from '../src/run.js';
import { HYPER_SPEED, MOTION, TIERS, speedReadout, stretchFor } from '../src/motion.js';
import { MAX_SPEED } from '../src/physics.js';
import Matter from 'matter-js';

const { Body } = Matter;
const advance = (g, n) => {
  for (let i = 0; i < n; i++) g.tick();
};

// A run with the cube already in flight, so the entry gate can be opened by
// hand. `dash()` refuses while the opening lesson is teaching, so we leave the
// tutorial with one real launch and then set the counters we care about.
const airborne = () => {
  const g = createRun(19),
    s = g.state;
  g.dash(g.suggestion());
  return { g, s };
};

/** Open the entry gate exactly as a perfect player would: seven links, few dashes. */
const openGate = (s, { chain = HYPER.chain, shots = 5 } = {}) => {
  s.chain = chain;
  s.chainTime = 96;
  s.shots = shots;
  s.phase = 'playing';
  // The field must be empty for a boundary test: a stray kill on the first tick
  // increments the chain again and pushes 6 -> 7, which reads exactly like an
  // off-by-one in the gate and is not one.
  s.chainTime = 96;
};

/** Empty the field so a boundary test is measuring the gate, not a stray kill. */
const clear = (g) => {
  for (const e of g.combat.enemies.values()) g.combat.enemies.delete(e.id);
};

test('HYPER fires after seven consecutive cuts inside the dash budget', () => {
  const { g, s } = airborne();
  assert.equal(s.hyper, false, 'hyper must not be live before the gate opens');
  openGate(s);
  advance(g, 1);
  assert.equal(s.hyper, true, 'seven links inside fourteen dashes did not promote');
  assert.equal(s.hyperCount, 1);
  assert.ok(g.world.playerCeiling >= HYPER.speed, `ceiling ${g.world.playerCeiling} below hyper`);
  assert.ok(
    g.world.player.speed > MAX_SPEED * 2,
    `speed ${g.world.player.speed.toFixed(1)} never left the normal limit`,
  );
});

test('the promotion is a velocity boost, not a direction reset', () => {
  const { g, s } = airborne();
  // Wipe the forward component by hand so the heading is unambiguous: straight
  // up, which is the only direction that matters here.
  Body.setVelocity(g.world.player, { x: 0, y: -20 });
  const angleBefore = Math.atan2(g.world.player.velocity.y, g.world.player.velocity.x);
  openGate(s);
  advance(g, 1);
  assert.equal(s.hyper, true);
  const v = g.world.player.velocity,
    angleAfter = Math.atan2(v.y, v.x);
  // Gravity bends it slightly across one tick, but the launch heading must
  // survive. A reset would repoint it along some default axis.
  assert.ok(
    Math.abs(angleAfter - angleBefore) < 0.35,
    `heading swung ${((angleAfter - angleBefore) * 57.3).toFixed(1)} degrees: the boost reset the vector`,
  );
  assert.ok(Math.hypot(v.x, v.y) > 200, `boost only reached ${Math.hypot(v.x, v.y).toFixed(0)}`);
});

test('six links are not enough, and a late seventh is not either', () => {
  const a = airborne();
  clear(a.g);
  openGate(a.s, { chain: HYPER.chain - 1 });
  advance(a.g, 4);
  assert.equal(a.s.hyper, false, 'six links promoted: the gate is off by one');

  const b = airborne();
  clear(b.g);
  openGate(b.s, { shots: HYPER.dashes + 1 });
  advance(b.g, 4);
  assert.equal(b.s.hyper, false, 'a seventh link past the dash budget still promoted');
});

test('the dash budget is inclusive at its edge', () => {
  const { g, s } = airborne();
  openGate(s, { shots: HYPER.dashes });
  advance(g, 1);
  assert.equal(s.hyper, true, `dash ${HYPER.dashes} is inside the budget and must promote`);
});

test('hyper has no timer: it lives while the cube is fast and dies with the speed', () => {
  const { g, s } = airborne();
  openGate(s);
  advance(g, 1);
  assert.equal(s.hyper, true);
  // There is no duration field to wait out. The only exit is physical, so the
  // state must survive while the cube is held above the limit...
  for (let i = 0; i < 60; i++) {
    Body.setVelocity(g.world.player, { x: 0, y: -HYPER.speed });
    g.tick();
  }
  assert.equal(s.hyper, true, 'hyper expired on a clock instead of on speed');
  // ...and end the moment it falls back under the normal limit.
  s.hyperPeak = 250;
  Body.setVelocity(g.world.player, { x: 0, y: -MAX_SPEED });
  g.tick();
  assert.equal(s.hyper, false, 'hyper survived below the normal limit');
});

test('the blade is permanent under hyper and decays again afterwards', () => {
  const { g, s } = airborne();
  openGate(s);
  advance(g, 1);
  assert.equal(s.hyper, true);
  // Long past any normal blade life, hyper keeps it out.
  for (let i = 0; i < 90; i++) {
    Body.setVelocity(g.world.player, { x: 0, y: -HYPER.speed });
    g.tick();
    assert.ok(s.blade > 0, `tick ${i}: the blade lapsed under hyper`);
  }
  // Outside hyper the same clock is allowed to take it. This has to be measured
  // on a tick where NOTHING WAS CUT: every kill re-grants seven blade ticks, and
  // the stream keeps placing shapes during the tick, so a busy tick tops the
  // blade back up for a reason that has nothing to do with hyper. Filter for
  // quiet ticks instead of pretending the field is ever empty.
  s.hyper = false;
  g.world.playerCeiling = MAX_SPEED;
  Body.setVelocity(g.world.player, { x: 0, y: -MAX_SPEED });
  let sawDecay = false;
  for (let i = 0; i < 300 && !sawDecay; i++) {
    const kills = s.kills,
      before = s.blade;
    clear(g);
    g.tick();
    if (s.kills === kills && before > 1) {
      assert.ok(
        s.blade < before,
        `quiet tick ${i}: blade held at ${before} with hyper off -- the hold is not gated on the state`,
      );
      sawDecay = true;
    }
  }
  assert.ok(sawDecay, 'never observed a quiet tick to measure decay on');
});

test('the hyper bounce scales with impact speed and is capped against runaway', () => {
  // The bounce payoff is the point of the state: a wall at hyper speed throws
  // you back harder than you arrived. The gain is a function of impact speed,
  // so "enter near the wall and bounce" needs no special case -- it falls out.
  // The cap is what stops a corner from stacking two rebounds into a speed the
  // integrator cannot step.
  const gain = (speed) => Math.min(HYPER.reboundCap, 1 + (speed / HYPER.speed) * HYPER.bankGain);
  assert.ok(gain(MAX_SPEED) > 1, 'a normal-speed bounce must still give something back');
  assert.ok(gain(HYPER.speed) > gain(MAX_SPEED), 'the bounce does not scale with impact speed');
  assert.ok(gain(HYPER.speed) <= HYPER.reboundCap, 'the cap is not applied');
  assert.ok(HYPER.reboundCap <= 1.5, `cap ${HYPER.reboundCap} admits runaway compounding`);
  // The ceiling must be raised with the boost, or capVelocity erases both.
  assert.ok(HYPER.speed * HYPER.reboundCap > HYPER.speed, 'no headroom above hyper speed');
});

test('the effect curve only reads hyper when hyper is actually live', () => {
  // THE BUG THIS PINS: speedReadout/stretchFor clamped to the normal max, so a
  // hyper shot rendered identically to an ordinary redline shot. They now take
  // a ceiling -- but passing it unconditionally would make ordinary top speed
  // read as DRIFT with zero stretch, the opposite error.
  const normal = speedReadout(MAX_SPEED, MAX_SPEED, MAX_SPEED),
    hyper = speedReadout(HYPER.speed, MAX_SPEED, HYPER.speed),
    flat = stretchFor(MAX_SPEED, MAX_SPEED, MAX_SPEED),
    stretched = stretchFor(HYPER.speed, MAX_SPEED, HYPER.speed);
  assert.equal(normal.band, 'REDLINE');
  assert.equal(normal.over, false);
  assert.equal(hyper.band, 'HYPER');
  assert.equal(hyper.over, true);
  // 100 -> 667. The dial reads past its own maximum rather than saturating, so
  // "off the scale" is a number the player can watch climb, not a pinned 100.
  assert.ok(hyper.kmh > normal.kmh * 5, `dial barely moved: ${normal.kmh} -> ${hyper.kmh}`);

  // And the gate that matters: ordinary top speed must render IDENTICALLY
  // whether or not a hyper ceiling is in scope. An earlier draft normalised the
  // whole curve by the ceiling, which collapsed a normal 42 to DRIFT with zero
  // stretch the moment hyper was live anywhere in the codebase -- the state
  // would have made every ordinary flight in the game look dead.
  const misread = speedReadout(MAX_SPEED, MAX_SPEED, HYPER.speed),
    unchanged = stretchFor(MAX_SPEED, MAX_SPEED, HYPER.speed);
  assert.equal(misread.band, 'REDLINE', 'a lifted ceiling changed how normal speed reads');
  assert.equal(misread.kmh, normal.kmh);
  assert.deepEqual(unchanged, flat, 'a lifted ceiling changed how normal speed renders');

  // Above the limit the curve must keep climbing rather than pinning at full:
  // mid-hyper has to be visibly stronger than redline and weaker than full.
  const mid = stretchFor((MAX_SPEED + HYPER.speed) / 2, MAX_SPEED, HYPER.speed);
  assert.ok(mid.along > flat.along, 'mid-hyper did not exceed the normal maximum');
  assert.ok(mid.along < stretched.along, 'mid-hyper already saturated the hyper scale');
  assert.ok(mid.blur > flat.blur && mid.blur < stretched.blur, 'blur does not scale through hyper');

  // On its own scale, normal top speed is at FULL effect -- that must not change.
  assert.equal(flat.blur, MOTION.blurMax, 'normal top speed lost its own smear');
  // 1.36, not 1.52: the whole stretch curve was pulled down after the sensory
  // report (see MOTION.blurMax in motion.js). Normal flight still visibly
  // lengthens the cube; it stops turning it into a streak.
  assert.equal(+flat.along.toFixed(2), 1.36);
  // Hyper OVERSHOOTS the shipped curve rather than pinning at it -- that is the
  // difference between "the loudest state in the game" and "a redline shot".
  assert.ok(stretched.blur > MOTION.blurMax, 'hyper pinned at the normal maximum blur');
  assert.ok(stretched.along > flat.along, 'hyper did not stretch further than redline');
  assert.ok(stretched.across < flat.across, 'hyper did not thin the cube further than redline');
  // Thinner, but never a line: the cube must stay readable at any speed.
  assert.ok(stretched.across > 0.4, 'hyper squashed the cube past recognition');
});

test('every band the readout can return maps to a real, ordered tier', () => {
  // THE BUG THIS PINS: the HUD looked its tier up with
  // `TIERS.find(t => t.label === band)` and then read `tier.index`. Only
  // `tierOf` ever stamps an `index`, so the lookup returned a tier whose index
  // was undefined -- and `i <= undefined` is false for every pip, so all five
  // went DARK at the moment hyper fired. The index has to come from the array
  // position, and every band has to exist or the pips silently fall back to
  // DRIFT (the lowest tier) for the highest speed in the game.
  const bands = ['DRIFT', 'CRUISE', 'SURGE', 'REDLINE', 'HYPER'];
  for (const b of bands) assert.ok(TIERS.findIndex((t) => t.label === b) >= 0, `no tier for ${b}`);
  // Ordered, monotonic, and HYPER last: pips light left to right.
  const idx = bands.map((b) => TIERS.findIndex((t) => t.label === b));
  assert.deepEqual(idx, [0, 1, 2, 3, 4]);
  // The readout must actually reach the top tier at hyper speed.
  assert.equal(speedReadout(HYPER.speed, MAX_SPEED, HYPER.speed).band, 'HYPER');
  assert.equal(speedReadout(MAX_SPEED, MAX_SPEED, HYPER.speed).band, 'REDLINE');
});

test('the renderer constant matches the run constant', () => {
  // motion.js cannot import run.js without closing a cycle, so the number is
  // restated there. This is the assertion that keeps them from drifting.
  assert.equal(HYPER_SPEED, HYPER.speed);
});
