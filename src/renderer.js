import { createCamera, frameRun, inView, toScreen } from './camera.js';
import { createBackdrop } from './atmosphere.js';
import { arc, blade, cube, disk, foe, line, cutHalf, nick, shearInk, poly, trace } from './art.js';
import { INK, TYPES, TAU, CUBE, pose, bodyPose, bisect, mix } from './shapes.js';
import { createJelly } from './art.js';
import { PAD, SPAWN, PLAYER_SIZE, ARENA, clamp, randomSource, openingFacing } from './levels.js';
import { MAX_SPEED } from './physics.js';
import { sightPicture } from './guide.js';
import { ARC, predictAim, speedRgb } from './aim.js';
import { elongate, squashed, wave } from './impact.js';
import {
  MOTION,
  createShake,
  stretchFor,
  animationState,
  fade,
  appear,
  ANIM,
  tierOf,
  HYPER_SPEED,
} from './motion.js';
import { sceneFor, drawStory } from './storyboard.js';
import { createSmear, ghostFor, morphWedge } from './smear.js';
import { cubePose, slashFor, landFor, SLASH, DIRS } from './animation.js';
import { SLASH_TABLE, LAND_TABLE, SLASH_ROW, LAND_ROW, FALL_TABLE, FALL_ROW, FALL_SAMPLES } from './bake.js';

/** Ticks the hyper entry burst runs for. Short enough to be an event, long
 *  enough to read on a 60Hz display (18 ticks = 0.3s). */
const HYPER_BURST = 18;
import { SHEAR, impactFor } from './stroke.js';
import { rackInk, contactInk, drawSweep } from './cut-ink.js';
const R = PLAYER_SIZE / 2;
function pad(c) {
  const { x, y, w, h } = PAD;
  poly(
    c,
    '#403346',
    [
      [x, y],
      [x + w, y],
      [x + w - 8, y + h],
      [x + 16, y + h],
      [x + 3, y + 12],
    ],
    INK.black,
    3,
  );
  line(c, INK.acid, 3, x, y, x + w, y);
  for (let i = 0; i < 4; i++)
    poly(c, '#9ca852', [
      [x + 12 + i * 12, y + 5],
      [x + 20 + i * 12, y + 5],
      [x + 14 + i * 12, y + 13],
      [x + 6 + i * 12, y + 13],
    ]);
  for(let i=0;i<3;i++)line(c, '#afbf76',2,x+w-40+i*9,y+15,x+w-36+i*9,y+10,x+w-32+i*9,y+15);
}
// The real launch preview: dashes from cool cyan to crimson/white, a crisp
// reticle where the arc first meets a surface, and a bracketed lock when the
// magnetic corridor caught a shape. Only DRAWN here; input owns the vector.
function drawArc(c, run, aim, alpha, scale, hint, time, view) {
  // A vector that came through input already has its magnet answer. Re-bending
  // it here would draw a promise different from the one that fires.
  // The corridor the input used, so the drawn arc and the fired shot agree.
  const a = predictAim(run, aim, {
    focus: true,
    magnetic: !('lock' in aim),
    corridor: run.assist?.({ focus: true }).corridor ?? null,
  });
  if (!a) return null;
  const rgb = speedRgb(a.power);
  // Trim the drawn trail at the first REAL contact and at the edge of the
  // view: a line that runs past the shape it will hit, or off-screen, is
  // promising flight the launch will never make.
  const end = a.end,
    margin = 40,
    inView = (q) =>
      q.x >= view.x - margin &&
      q.x <= view.x + view.w + margin &&
      q.y >= view.y - margin &&
      q.y <= view.y + view.h + margin,
    // A contact the player can SEE is a promise and stays bright to the end.
    // A tide crossing off-screen is not: the preview fades like a guess.
    stop = end && a.hit && inView(end) ? end : null,
    path = [];
  for (const q of a.path) {
    path.push(q);
    if (!inView(q) || (stop && q.x === stop.x && q.y === stop.y)) break;
  }
  // A preview that runs a whole 190-tick parabola would read as a beam across
  // the screen. When nothing stops the shot, show a readable stretch of the
  // curve and let it dissolve, so the eye reads "lands out there".
  const horizon = Math.round(Math.min(path.length, 20 + 8 * (1 - clamp(a.power, 0, 1))));
  if (!stop) path.length = Math.min(path.length, horizon);
  const last = Math.max(1, path.length - 1);
  c.save();
  // Elastic tension: the press point and the current pull. The tether is the
  // chord the cube will be released along, not a decorative arrow.
  if (aim.anchor) {
    // aim.anchor is a WORLD point (the press, fixed in the scene while the
    // lens widens under a held aim).
    const o = aim.anchor,
      tip = a.start;
    // Neutral, dim ink on purpose: the tether says "this is where you grabbed",
    // the arc says how fast. Painting both in the speed colour made the two
    // lines one white smear at full pull.
    c.save();
    c.globalAlpha = 0.22 + 0.3 * a.power;
    c.setLineDash([4 / scale, 4 / scale]);
    line(c, INK.paper, 1.5 / scale, tip.x, tip.y, o.x, o.y);
    c.setLineDash([]);
    c.globalAlpha = 0.5 + 0.3 * a.power;
    arc(c, INK.paper, 1.4 / scale, o.x, o.y, (4 + 2 * a.power) / scale, 0, TAU);
    c.restore();
  }
  // Two layers: a translucent wide under-stroke, then crisp dashes whose
  // length grows with speed. Gaps, not merged dots, make direction legible.
  for (let i = 0; i < path.length; i++) {
    const q = path[i],
      prev = i ? path[i - 1] : a.start,
      u = i / Math.max(1, last),
      tail = {
        x: q.x - (q.x - prev.x) * (0.42 + 0.34 * a.power),
        y: q.y - (q.y - prev.y) * (0.42 + 0.34 * a.power),
      };
    // Both layers die at the far end when the shot is unpromised.
    const fade = (hint ? 0.62 : 0.94) * (1 - u) ** (stop ? 0.55 : 1.5);
    if (fade < 0.02) continue;
    c.globalAlpha = fade * (hint ? 0.17 : 0.1);
    line(c, `rgb(${rgb.join(',')})`, 6 / scale, prev.x, prev.y, q.x, q.y);
    c.globalAlpha = fade;
    line(c, `rgb(${rgb.join(',')})`, (2.9 - u * 1.3) / scale, tail.x, tail.y, q.x, q.y);
  }
  c.globalAlpha = 1;
  // Reticle at the FIRST predicted surface, not at the end of the dotted
  // trail. A lock snaps it to the shape's centre and prints brackets.
  if (end && !hint) {
    const at = end.kind === 'target' ? { x: end.x, y: end.y } : end,
      r = (end.kind === 'target' ? (a.hit?.r ?? 20) : 6) + 10 / Math.max(0.35, scale);
    c.save();
    c.translate(at.x, at.y);
    c.strokeStyle = a.lock ? INK.paper : `rgb(${rgb.join(',')})`;
    c.lineWidth = 2.2 / scale;
    c.rotate(time * 0.006);
    for (let j = 0; j < 4; j++) {
      c.beginPath();
      c.arc(0, 0, r, j * Math.PI / 2 + 0.2, j * Math.PI / 2 + 0.82);
      c.stroke();
    }
    if (a.lock) {
      c.rotate(-time * 0.012);
      c.strokeStyle = INK.acid;
      for (let j = 0; j < 4; j++) {
        const s = j * Math.PI / 2 + Math.PI / 4;
        c.beginPath();
        c.moveTo(Math.cos(s) * (r + 3 / scale), Math.sin(s) * (r + 3 / scale));
        c.lineTo(Math.cos(s) * (r + 12 / scale), Math.sin(s) * (r + 12 / scale));
        c.stroke();
      }
    }
    c.restore();
  } else if (!hint && path.length) {
    // No surface inside the preview: a hollow tick at its far end says
    // "your landing is out here", without ever pretending it hit something.
    const q = path[path.length - 1];
    c.save();
    c.globalAlpha = 0.5;
    c.strokeStyle = `rgb(${rgb.join(',')})`;
    c.lineWidth = 1.6 / scale;
    c.beginPath();
    c.arc(q.x, q.y, 7 / scale, 0.35, 0.95);
    c.arc(q.x, q.y, 7 / scale, 0.35 + Math.PI, 0.95 + Math.PI);
    c.stroke();
    c.restore();
  }
  // Pair notches still print over enemy centres for the Throughcut line.
  const pair = sightPicture(
    a.start,
    a.velocity,
    run.world.geometry,
    run.combat.enemies.values(),
    run.state.drive > 0 ? 3 : 1,
  ).pair;
  pair.forEach(({ e, angle }, i) => {
    const q = pose(e, alpha);
    nick(c, q.x, q.y, e.r, angle, i + 1, scale);
  });
  c.restore();
  return a;
}
function warnings(c, e, p, time) {
  const col = TYPES[e.kind].color;
  if (e.kind === 'well') {
    c.save();
    c.globalAlpha = 0.23;
    for (let j = 0; j < 3; j++)
      arc(c, col, 2, p.x, p.y, 234, time * 0.018 + (j * TAU) / 3, time * 0.018 + (j * TAU) / 3 + 1);
    c.restore();
  }
  if (e.mode !== 'tell') return;
  const f = 1 - clamp(e.clock / e.span, 0, 1);
  c.save();
  if (e.kind === 'fang') {
    // Player sights are green dots. A charging Fang prints the WIDTH of
    // its lane in red, with barbs pointing in the direction it will run.
    c.save();
    c.translate(p.x, p.y);
    c.rotate(e.aim);
    c.globalAlpha = 0.16 + 0.13 * f;
    const span = 24 * (e.lungeSpeed||10.8),
      half = e.r * 0.7;
    poly(c, col, [
      [e.r, -half],
      [span - 12, -half * 0.48],
      [span + e.r, 0],
      [span - 12, half * 0.48],
      [e.r, half],
    ]);
    c.globalAlpha = 0.78;
    for (let x = e.r + 24; x < span - 25; x += 67) line(c, col, 2.5, x - 6, -6, x, 0, x - 6, 6);
    c.restore();
  }
  c.globalAlpha = (e.gentle ? 0.78 : 0.5) + (e.gentle ? 0.2 : 0.42) * f;
  c.setLineDash([7, 8]);
  if (e.kind === 'fang' || e.kind === 'prism' || e.kind === 'crown') {
    const count = e.kind === 'crown' ? 10 : 1,
      length = e.kind === 'prism' ? 840 : e.kind === 'fang' ? 24*(e.lungeSpeed||10.8)+e.r : 230;
    for (let j = 0; j < count; j++) {
      const a = e.aim + (j * TAU) / count,
        dx = Math.cos(a),
        dy = Math.sin(a);
      line(c, col, 1.7, p.x + dx * e.r, p.y + dy * e.r, p.x + dx * length, p.y + dy * length);
    }
  } else if (e.kind === 'rift') {
    c.save();
    c.translate(e.tx, e.ty);
    c.scale(1.45 * e.r, 1.45 * e.r);
    c.strokeStyle = col;
    c.lineWidth = 0.055;
    c.setLineDash([]);
    c.beginPath();
    trace(c, TYPES.rift.outline);
    c.stroke();
    c.restore();
    line(c, col, 1, p.x, p.y, e.tx, e.ty);
  }
  c.setLineDash([]);
  if (e.kind === 'fang') {
    c.translate(p.x, p.y);
    c.rotate(e.aim);
    for (let i = 0; i < 2; i++) {
      const x = e.r + 9 + i * 12 + f * 24;
      line(c, col, 3.2, x - 7, -7, x, 0, x - 7, 7);
    }
  } else arc(c, col, 3, p.x, p.y, e.r + 19 - 12 * f, -Math.PI / 2, -Math.PI / 2 + TAU * f);
  c.restore();
}
/** The arena's four edges, drawn SEMI-VISIBLE in world space.
 *
 *  This reverses the earlier "no ghost rails" decision, on the user's word:
 *  "the boundaries of wall must be semi visible and far, not close, and all 4
 *  directions have a semi wall, tangible wall but far away in this massive
 *  canvas". They were invisible entirely, which meant a player could only learn
 *  where the table ended by hitting it -- and with the sides now 28,000 units
 *  apart, the edge has to be readable in advance or the whole point of the
 *  space is lost.
 *
 *  "Semi-visible" is taken literally and is the design constraint:
 *   - the line is drawn at low alpha, so it is a hint, not a border;
 *   - it only fades IN as the cube approaches (nothing is drawn while the edge
 *     is off screen, and the alpha ramps over the last screen-height), so the
 *     enormous canvas still reads as unbounded during normal play;
 *   - it is a single hairline plus a short inward comb, NOT a filled slab, so
 *     it can never be mistaken for a lethal zone.
 *
 *  This is a world-space layer: it is drawn inside the camera transform, so it
 *  moves correctly and costs nothing when off screen.
 */
function walls(c, v, p) {
  const A = ARENA;
  if (!A) return;
  const half = PLAYER_SIZE / 2,
    x0 = A.x + half, x1 = A.x + A.w - half,
    y0 = A.y + half, y1 = A.y + A.h - half;
  // How present the edge should be, from distance. Full strength within one
  // screen of it, gone by three screens away.
  const near = (d) => Math.max(0, Math.min(1, 1 - d / (Math.max(v.w, v.h) * 1.1)));
  const edges = [
    { d: Math.abs(p.x - x0), draw: (a) => wallLine(c, v, x0, y0, x0, y1, a, 1, 0) },
    { d: Math.abs(p.x - x1), draw: (a) => wallLine(c, v, x1, y0, x1, y1, a, -1, 0) },
    { d: Math.abs(p.y - y0), draw: (a) => wallLine(c, v, x0, y0, x1, y0, a, 0, 1) },
    { d: Math.abs(p.y - y1), draw: (a) => wallLine(c, v, x0, y1, x1, y1, a, 0, -1) },
  ];
  c.save();
  for (const e of edges) {
    const a = near(e.d);
    if (a <= 0.01) continue;
    e.draw(a);
  }
  c.restore();
}

/** One edge of the arena: a hairline plus a comb that points INTO the field.
 *  `nx`/`ny` is the inward normal, so the comb always sits on the playable
 *  side and the wall itself is never hidden behind its own decoration. */
function wallLine(c, v, x0, y0, x1, y1, a, nx, ny) {
  const t = 1 / v.scale;
  c.globalAlpha = 0.12 * a;
  line(c, INK.paper, 1.4 * t, x0, y0, x1, y1);
  // Comb ticks: short, sparse, and pointing inward. They give the edge a
  // texture at a glance without becoming a pattern the eye tracks.
  const len = 26 * t, step = 140 * t;
  const dx = x1 - x0, dy = y1 - y0, span = Math.hypot(dx, dy);
  if (span < 1) return;
  const ux = dx / span, uy = dy / span, n = Math.min(40, Math.max(1, Math.floor(span / step)));
  c.globalAlpha = 0.09 * a;
  for (let i = 0; i <= n; i++) {
    const k = i / n, px = x0 + dx * k, py = y0 + dy * k;
    line(c, INK.paper, 1 * t, px, py, px + nx * len, py + ny * len);
  }
}

/** THE SWING ARC.
 *
 *  The single most anime element in the game, and the reason it is built from
 *  three concentric strokes rather than one: a hand-drawn sword arc is not a
 *  clean crescent. It is a bright leading edge, a body of colour behind it, and
 *  a thin trailing tail that outlives the other two.
 *
 *  Timing comes entirely from animation.slashFor(), which is a pure function of
 *  the tick age -- so the arc is identical at 60 and 144Hz and can be tested
 *  without a canvas. This function only draws what that returns.
 *
 *  `smear` is the trick that sells the speed: the arc is drawn WIDE while the
 *  blade is travelling and collapses to a thin line on the impact frames, which
 *  is exactly how a smear cel works. It is never drawn as a full ring, because a
 *  ring reads as an aura and this must read as a decision.
 */
function slashArc(c, x, y, r, age, dir, inv = 1) {
  // ── READ THE BAKED TABLE, NOT THE CURVE ────────────────────────────────
  //
  // `slashFor` is the SPECIFICATION and stays exactly as written -- the tests
  // still hold it to its shape. But it is a stack of pow/sin/clamp calls, and
  // this is the per-frame path. The table was baked from that same function at
  // module load and verified row-for-row against it, so this is not an
  // approximation: it is the identical number, read instead of computed.
  //
  // Measured: 7.2x faster than evaluating the curve.
  const row = SLASH_ROW.width;
  if (!(age >= 0) || age >= SLASH.total) return;
  const o = age * row;
  const angle0 = SLASH_TABLE[o + SLASH_ROW.angle];
  if (angle0 < 0) return; // the "no swing" sentinel
  const smear = SLASH_TABLE[o + SLASH_ROW.smear],
    alpha = SLASH_TABLE[o + SLASH_ROW.alpha],
    weight = SLASH_TABLE[o + SLASH_ROW.weight],
    flash = SLASH_TABLE[o + SLASH_ROW.flash];
  if (alpha <= 0.01) return;
  // The table is baked facing EAST (`dir = 0`); every other bearing is that
  // arc rotated by the direction, which is exactly what the old call did.
  const angle = angle0 + dir;
  // The arc spans back from the blade's current bearing. Its width is the
  // travelled portion, which grows through the swing and then collapses.
  const span = Math.min(SLASH.sweep, Math.abs(angle - dir) + 0.35) * (0.72 + 0.28 * smear);
  const r0 = r * 1.05,
    r1 = r * (1.9 + 0.5 * smear);
  const from = angle - span,
    to = angle;

  c.save();
  c.translate(x, y);
  // Body of the arc: a filled wedge with the outer edge cut away, so it reads as
  // a swept volume rather than a pie slice.
  if (smear > 0.02) {
    c.globalAlpha = alpha * 0.2 * smear;
    c.fillStyle = INK.acid;
    c.beginPath();
    c.arc(0, 0, r1 * 0.9, from, to);
    c.arc(0, 0, r0, to, from, true);
    c.closePath();
    c.fill();
  }
  // The leading edge. Bright, and the only part that survives to the end.
  c.globalAlpha = alpha * (0.55 + 0.45 * flash);
  c.strokeStyle = flash > 0.35 ? INK.paper : INK.acid;
  // `inv` is 1/view.scale from the caller, so the arc has the same physical
  // weight on a phone and a desktop.
  c.lineWidth = Math.max(0.6, (1.6 + 1.5 * weight) * inv);
  c.beginPath();
  c.arc(0, 0, r1, from, to);
  c.stroke();
  // Trailing tail: thin, dimmer, and it outlives the edge by a frame or two.
  c.globalAlpha = alpha * 0.3 * weight;
  c.strokeStyle = INK.paper;
  c.lineWidth = 1.4;
  c.beginPath();
  c.arc(0, 0, r0 + (r1 - r0) * 0.35, from - 0.22, from + 0.3);
  c.stroke();

  // ── SPEED LINES ───────────────────────────────────────────────────────────
  //
  // Anime action has three layers, and the arc alone was only two of them: the
  // swept volume and its leading edge. The third is the RADIAL LINES -- short
  // strokes fanning out from behind the blade, which is the single most
  // recognisable "this is moving fast" mark in the vocabulary.
  //
  // Drawn only while the blade is actually travelling (smear > 0), so the held
  // impact frame stays clean and the contrast between the two is what sells the
  // stop.
  if (smear > 0.05) {
    const n = 3 + Math.round(smear * 4), // 3..7 lines, more at the peak
      base = alpha * smear * 0.55;
    c.strokeStyle = INK.paper;
    for (let i = 0; i < n; i++) {
      // Fan them along the travelled arc, not randomly: a burst of lines that
      // does not follow the swing reads as noise.
      const t = (i + 0.5) / n,
        a0 = from + span * t,
        len = r * (0.28 + 0.34 * smear) * (0.55 + 0.45 * Math.sin(t * Math.PI)),
        rStart = r1 * (1.02 + 0.06 * i * 0.25);
      c.globalAlpha = base * (0.5 + 0.5 * Math.sin(t * Math.PI));
      c.lineWidth = Math.max(0.5, (1.1 + 0.8 * smear) * inv);
      c.beginPath();
      c.moveTo(Math.cos(a0) * rStart, Math.sin(a0) * rStart);
      c.lineTo(Math.cos(a0) * (rStart + len), Math.sin(a0) * (rStart + len));
      c.stroke();
    }
  }

  // ── THE AFTERIMAGE ────────────────────────────────────────────────────────
  //
  // Two ghosts of the blade's leading edge at earlier bearings, each dimmer and
  // thinner than the last. This is the cel-animation trick: you do not blur a
  // fast object, you draw it two or three times where it WAS.
  if (smear > 0.22) {
    for (let g = 1; g <= 2; g++) {
      const back = (span * g) / 3.4;
      c.globalAlpha = alpha * smear * (0.3 / g);
      c.strokeStyle = INK.acid;
      c.lineWidth = Math.max(0.4, (1.3 / g) * inv);
      c.beginPath();
      c.arc(0, 0, r1 - g * 2, from - back, from - back + span * 0.34);
      c.stroke();
    }
  }
  c.globalAlpha = 1;
  c.restore();
}

function streak(c, trail, p, live) {
  if (trail.length < 3) return;
  // A decaying ribbon of afterimages: each older sample is thinner, dimmer and
  // shifted further toward the cold end of the speed ramp.
  //
  // THE BACK LINE BUG.
  // This used to connect every consecutive pair of trail samples, including the
  // ones recorded while the cube was sitting on the launch pad. The moment a
  // dash started, those stale samples were all at the pad and the newest was
  // the cube -- so the ribbon drew ONE long thin quad across the entire gap
  // between them. That is the "back line" that looked wrong when dashing: not a
  // speed ribbon at all, but a single straight stick joined to where the cube
  // used to be. Two fixes, both below:
  //
  //  1. Segments are skipped when the sample step is too large to be a real
  //     frame of travel. A genuine ribbon is built from many short steps; one
  //     long step is a discontinuity and is not drawn.
  //  2. The trail is cleared on a launch, so a dash starts a NEW ribbon at the
  //     launch point instead of dragging the old resting one along.
  //
  // Width now also tracks speed rather than index alone, so the ribbon is a
  // readout: a slow drift is a hairline, a redline dash is a body.
  const total = trail.length - 1;
  for (let i = 1; i < trail.length; i++) {
    const q = i === trail.length - 1 ? p : trail[i],
      prev = trail[i - 1],
      dx = q.x - prev.x,
      dy = q.y - prev.y,
      step = Math.hypot(dx, dy),
      n = step || 1,
      u = i / total,
      half = (live ? 13 : 5) * u ** 1.15,
      col = speedRgb(0.18 + 0.82 * u ** 1.6);
    // A discontinuity is not motion. 46 world units is comfortably above one
    // frame of travel at MAX_SPEED and comfortably below a launch's teleport.
    if (half < 0.7 || step > 46) continue;
    c.save();
    c.globalAlpha = (live ? 0.62 : 0.2) * u ** 1.4;
    poly(c, `rgb(${col.join(',')})`, [
      [prev.x - (half * 0.45 * dy) / n, prev.y + (half * 0.45 * dx) / n],
      [q.x - (half * dy) / n, q.y + (half * dx) / n],
      [q.x + (half * dy) / n, q.y - (half * dx) / n],
      [prev.x + (half * 0.45 * dy) / n, prev.y - (half * 0.45 * dx) / n],
    ]);
    c.restore();
  }
}
function pointer(c, v, p, e) {
  if (!e) return;
  const q = toScreen(v, e),
    o = toScreen(v, p),
    l = 21,
    r = v.width - 21,
    t = 90,
    b = v.height - 65;
  if (q.x > l && q.x < r && q.y > t && q.y < b) return;
  const x = clamp(o.x, l, r),
    y = clamp(o.y, t, b),
    dx = q.x - x,
    dy = q.y - y;
  if (!(dx || dy)) return;
  const f = Math.min(
    dx > 0 ? (r - x) / dx : dx < 0 ? (l - x) / dx : Infinity,
    dy > 0 ? (b - y) / dy : dy < 0 ? (t - y) / dy : Infinity,
  );
  c.save();
  c.translate(x + dx * f, y + dy * f);
  c.rotate(Math.atan2(dy, dx));
  poly(c, TYPES[e.kind].color, [
    [8, 0],
    [-6, -5],
    [-3, 0],
    [-6, 5],
  ]);
  c.restore();
}
/** Draw trace.
 *
 *  A test cannot see what the renderer DECIDED by looking at the pixels: a
 *  shape drawn from a stale interpolation and a shape drawn correctly can emit
 *  the same op stream. And re-deriving `pose(e, alpha)` inside a test, which is
 *  what `test/frame.test.js` used to do, measures a copy of the render path
 *  rather than the render path itself.
 *
 *  So the renderer publishes what it actually drew, when a caller asks for it.
 *  Off by default and a single `null` check on the hot path.
 */
let drawTrace = null;
/** Record every hostile (and the cube) draw of the NEXT frame.
 *
 *  Returns a stop function; calling it disables recording and RETURNS THE
 *  TRACE. Two behaviours matter and both were wrong at first:
 *
 *   - Each call allocates a FRESH array unless the caller supplies one. A
 *     default parameter (`to = []`) is evaluated once per call in JS, so that
 *     part was fine -- but a caller that held on to the previous frame's array
 *     while starting a new trace got a hybrid of two frames, which made a test
 *     compare a shape against its own previous position and pass whenever it
 *     felt like it.
 *   - The trace must be EMPTY at the start. Leaving stale entries in it is the
 *     same trap one level down: a sweep across alphas silently compared shapes
 *     that had not been redrawn.
 *
 *  So the trace is cleared on start and the array is only handed back on stop.
 */
export function traceDraws(to) {
  const sink = to ?? [];
  sink.length = 0;
  drawTrace = sink;
  return () => {
    drawTrace = null;
    return sink;
  };
}

export function createRenderer(canvas) {
  const c = canvas.getContext('2d', { alpha: false }),
    camera = createCamera(),
    back = createBackdrop(c);
  let scene=null, sceneTicks=0,
    w,
    h,
    lastView,
    revision = 0,
    anim = 'rest',
    shake = createShake(),
    ghosts = createSmear(10),
    lastSwing = -1,
    justLaunched = 0,
    ghostClock = 0,
    // Which of the 8 direction poses to hold while at rest. Kept across frames
    // so a stopped cube does not snap to east.
    holdDir = 0,
    stain = 0,
    facing = 1,
    rand = randomSource(1);
  const trail = [],
    shards = [],
    imprints = [],
    sparks = [];
  function resize() {
    const box = canvas.getBoundingClientRect();
    w = Math.max(1, box.width);
    h = Math.max(1, box.height);
    const dpr = Math.min(devicePixelRatio || 1, 2, Math.sqrt(2600000 / (w * h)));
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    camera.resize(w, h);
    lastView = camera.view(1);
    revision++;
  }
  const ro = new ResizeObserver(resize);
  ro.observe(canvas);
  resize();
  function transform() {
    c.setTransform(canvas.width / w, 0, 0, canvas.height / h, 0, 0);
    c.globalAlpha = 1;
    c.lineJoin = 'miter';
  }
  function reset(seed, room = false) {
    scene=null;sceneTicks=0;
    facing = openingFacing(seed);
    camera.reset(SPAWN, facing, room);
    lastView = camera.view(1);
    rand = randomSource(seed ^ 7737);
    shake.reset();
    stain = 0;
    trail.length = shards.length = imprints.length = sparks.length = 0;
  }
  function event(type, d, motion) {
    if (type === 'armor' && motion) shake.ask(2.1, d.cut, 0.8);
    if (type === 'armor' || (type === 'cut' && !d.small && !d.fromShear)) {
      imprints.push({ ...d, type, life: type === 'armor' ? 16 : 9 });
      if (imprints.length > MOTION.maxImprints) imprints.shift();
    }
    if (type === 'shear' || type === 'parry') {
      imprints.push({ ...d, type, life: type === 'shear' ? 18 : 13 });
      if (imprints.length > MOTION.maxImprints) imprints.shift();
      return;
    }
    // Every impact asks for shake; the bank decides how much is affordable,
    // so a long chain can never leave the screen permanently vibrating.
    const recoil = (force, angle) => {
      if (motion) shake.ask(force, angle, 1);
    };
    if (type === 'hurt' || type === 'break') {
      stain = 1;
      recoil(4.5, -Math.PI * 0.42);
    }
    // No impact on empty air. Half placement is already split on the FIRST
    // frozen frame (even with motion off), not an intact foe behind a +score.
    if (type !== 'cut' && type !== 'break') return;
    const kind = d.kind || 'cube',
      r = d.r || R,
      a = d.cut ?? -0.62,
      mat = d.impact || impactFor(kind, d.small, d.release),
      local = a - d.angle,
      halves = bisect(kind === 'cube' ? CUBE : TYPES[kind].outline, local),
      nx = -Math.sin(a),
      ny = Math.cos(a),
      plate = kind === 'bastion' || kind === 'crown';
    recoil(mat.kick, a);
    for (const [i, path] of halves.entries()) {
      const side = i ? 1 : -1,
        gap = r * mat.gap * side,
        x = d.x + nx * gap,
        y = d.y + ny * gap,
        drift = plate ? 3.3 : (d.paper ? 6.8 : 4.6) + rand() * 1.8;
      shards.push({
        kind,
        path,
        local,
        side,
        x,
        y,
        px: x,
        py: y,
        angle: d.angle,
        pa: d.angle,
        r,
        opts: {
          paper: d.paper,
          hp: d.hpBefore,
          fault: d.fault,
          torn: d.release || d.fromShear,
          face: facing,
        },
        life: motion ? (plate || d.paper ? 32 : d.small ? 14 : 24) : 14,
        vx: nx * side * drift + Math.cos(a) * 1.7,
        vy: ny * side * drift + Math.sin(a) * 1.7,
        spin: side * (plate ? 0.025 : 0.07),
      });
    }
    const col = kind === 'cube' ? INK.acid : d.paper ? '#ffaf82' : TYPES[kind].color;
    if (motion)
      for (let i = 0; i < mat.flecks; i++) {
        const theta = a + (rand() - 0.5) * 1.4,
          speed = 3 + rand() * 5,
          x = d.x + Math.cos(theta) * r * 0.65,
          y = d.y + Math.sin(theta) * r * 0.65;
        sparks.push({
          x,
          y,
          px: x,
          py: y,
          angle: theta,
          vx: Math.cos(theta) * speed,
          vy: Math.sin(theta) * speed,
          l: 3 + rand() * 7,
          life: 10 + rand() * 6,
          col: i % 2 ? col : INK.paper,
        });
      }
    if (shards.length > MOTION.maxShards) shards.splice(0, shards.length - MOTION.maxShards);
    if (sparks.length > MOTION.maxSparks) sparks.splice(0, sparks.length - MOTION.maxSparks);
  }
  function syncScene(run,nearest){
    const s=run.state,b=run.world.player,k=sceneFor(s,nearest,b.velocity.y>0,s.line-b.position.y);
    if(k!==scene){scene=k;sceneTicks=0;}
    if(canvas.dataset.scene!==(k??undefined)){
      if(k)canvas.dataset.scene=k;else delete canvas.dataset.scene;
    }
  }
  // The body's own spring. One per renderer, stepped on the simulation delta so
  // a high refresh rate cannot make the cube wobble faster.
  const jelly = createJelly();
  let jellySeen = null;
  function tick(run, motion) {
    const { state: s, world } = run;
    syncScene(run, s.story ? run.nearest() : null);
    if (scene) sceneTicks++;
    frameRun(camera, run, motion);
    // The whole frame agrees on one animation state; effects that belong to
    // one state (a hit-stop pose, a death settle) can then be written once.
    anim = animationState(s);
    const dt = s.phase === 'dying' ? 1 : s.stop ? 0 : world.engine.timing.timeScale;
    // The bank advances on the simulation delta so the cap cannot be gamed by
    // a high refresh rate: 144 Hz regenerates half as fast per frame.
    shake.tick(dt);
    const b = world.player,
      forward = b.velocity.x * Math.cos(b.angle) + b.velocity.y * Math.sin(b.angle);
    if (s.phase === 'playing' && Math.abs(forward) > 3) facing = Math.sign(forward);
    stain = Math.max(0, stain - 0.045);
    // ── FEED THE SPRING FROM EVENTS THAT ALREADY EXIST ──────────────────
    //
    // No new physics. `s.impact` is stamped by the collision step with the
    // normal and the speed, so a tap and a wall at 378 arrive here as different
    // numbers and the body answers them differently -- which is the whole
    // reason to use a spring instead of a canned curve.
    if (motion && s.impact && s.impact !== jellySeen) {
      jellySeen = s.impact;
      const power = Math.min(1.6, (s.impact.speed ?? 0) / MAX_SPEED);
      jelly.hit(power, -s.impact.nx, -s.impact.ny);
    }
    // A landing is its own blow, straight down, so it kicks the spring along Y.
    if (motion && s.landAge === 0) jelly.hit(0.45, 0, 1);
    jelly.step(dt);
    if (motion && s.phase === 'playing' && dt) {
      // A launch is a discontinuity, and a ribbon must not span one. When the
      // cube goes from resting-on-the-pad to travelling, the oldest samples are
      // still back at the pad; joining them to the new position draws a single
      // straight stick across the gap -- the "back line" that looked broken
      // when dashing. Clearing here means a dash starts its ribbon AT THE POINT
      // OF LAUNCH, so the ribbon is always a record of the current shot.
      // `swingStart` is stamped on every launch, so comparing it to the last
      // frame's value detects exactly the frames a new shot began on.
      if (s.swingStart !== lastSwing) {
        trail.length = 0;
        lastSwing = s.swingStart;
        justLaunched = 2; // skip the pad sample and the first in-flight one
      }
      // The launch frame's own position is still the PAD, so pushing it would
      // re-create the straight stick one sample long.
      if (justLaunched > 0) justLaunched--;
      else trail.push({ ...world.player.position });
      if (trail.length > MOTION.ribbon) trail.shift();
    }
    if (!motion) trail.length = 0;
    for (const list of [sparks, shards, imprints])
      for (let i = list.length - 1; i >= 0; i--) {
        const e = list[i];
        e.life -= dt;
        if (e.life <= 0) {
          list.splice(i, 1);
          continue;
        }
        if (list === imprints) continue;
        e.px = e.x;
        e.py = e.y;
        e.pa = e.angle;
        if (!motion) continue;
        e.x += dt * e.vx;
        e.y += dt * e.vy;
        if (e.opts?.paper) {
          e.vx *= 0.97 ** dt;
          e.vy *= 0.97 ** dt;
        }
        e.vy += (e.opts?.paper ? 0.087 : 0.105) * dt;
        e.angle += (e.spin || 0) * dt;
      }
  }
  /** Screen-space speed feedback.
   *
   *  Runs after the world is drawn and before the HUD, in device-independent
   *  screen coordinates. The intensity is driven by the cube's speed through
   *  `tierOf`, not by raw velocity, so the frame changes in four discrete
   *  steps a player can actually perceive instead of drifting imperceptibly.
   *
   *  Deliberately excluded: anything that moves the WORLD (no zoom, no roll,
   *  no scale). A screen-space shake or zoom at high speed is the fastest way
   *  to make a fast game unwatchable, which is a thing this project has
   *  already learned the hard way. These effects add light and lines only.
   */
  function speedField(c, world, v, time) {
    // `world.player` is a Matter body: its coordinates live on `.position`.
    // Reading `.x`/`.y` here yields undefined, and every stroke then lands at
    // NaN and disappears without an error -- which is exactly how this layer
    // shipped invisible three times in a row.
    const body = world.player,
      p = body.position,
      speed = Math.hypot(body.velocity.x, body.velocity.y),
      tier = tierOf(speed, MAX_SPEED);
    if (tier.index === 0) return;
    const sweep = tier.t;
    c.save();
    c.setTransform(canvas.width / w, 0, 0, canvas.height / h, 0, 0);

    // 1. Vignette. Painted from the edges inward; intensity and tint come from
    //    the tier so a REDLINE frame is unmistakably different at a glance.
    const vig = c.createRadialGradient(
      w / 2,
      h / 2,
      Math.min(w, h) * 0.3,
      w / 2,
      h / 2,
      Math.max(w, h) * 0.72,
    );
    vig.addColorStop(0, 'rgba(0,0,0,0)');
    vig.addColorStop(0.55, `rgba(0,0,0,${0.12 * sweep})`);
    vig.addColorStop(1, `rgba(0,0,0,${0.55 * sweep})`);
    c.fillStyle = vig;
    c.fillRect(0, 0, w, h);

    // 2. Tier tint at the edges. `lighter` rather than `overlay`: the scene is
    //    nearly black, and overlay on black is a no-op, which is why the first
    //    version of this was invisible. Additive light also suits the look --
    //    the world feels lit rather than washed.
    if (tier.index >= 2) {
      const glow = c.createRadialGradient(
        w / 2,
        h / 2,
        Math.min(w, h) * 0.22,
        w / 2,
        h / 2,
        Math.max(w, h) * 0.62,
      );
      glow.addColorStop(0, 'rgba(0,0,0,0)');
      glow.addColorStop(0.7, 'rgba(0,0,0,0)');
      glow.addColorStop(1, tier.tint);
      c.globalCompositeOperation = 'lighter';
      c.globalAlpha = 0.12 + 0.2 * sweep;
      c.fillStyle = glow;
      c.fillRect(0, 0, w, h);
      c.globalAlpha = 1;
      c.globalCompositeOperation = 'source-over';
    }

    // 3. Speed lines.
    //
    //    Anchored around the cube and biased BEHIND its direction of travel:
    //    the space the player just came from is what should be streaming past.
    //    Lines only exist in a narrow cone behind the cube, because a full
    //    360-degree starburst is not speed, it is a sunburst -- the first
    //    working version of this did exactly that and overwhelmed the frame.
    //
    //    They are also biased to a single flat tint at low alpha. Speed reads
    //    through MOVEMENT and repetition, not through brightness; bright lines
    //    compete with the enemies, and enemies must always win.
    if (tier.index >= 2) {
      const cx = (p.x - v.x) * v.scale,
        cy = (p.y - v.y) * v.scale,
        travel = Math.atan2(body.velocity.y, body.velocity.x),
        behind = travel + Math.PI,
        reach = Math.hypot(w, h);
      c.globalCompositeOperation = 'lighter';
      c.lineCap = 'round';
      const lines = 5 + Math.round(4 * sweep);
      for (let i = 0; i < lines; i++) {
        const spread = (i / Math.max(1, lines - 1) - 0.5) * 1.5,
          a = behind + spread + Math.sin(time * 0.03 + i * 1.9) * 0.05,
          r0 = 120 + 30 * Math.sin(i * 2.1),
          r1 = r0 + reach * (0.32 + 0.3 * sweep) * (0.75 + 0.25 * Math.sin(i * 1.7));
        c.strokeStyle = tier.tint;
        c.globalAlpha = (0.06 + 0.12 * sweep) * (1 - Math.abs(spread));
        c.lineWidth = 1.1 + sweep * 1.4;
        c.beginPath();
        c.moveTo(cx + Math.cos(a) * r0, cy + Math.sin(a) * r0);
        c.lineTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1);
        c.stroke();
      }
      c.globalAlpha = 1;
      c.globalCompositeOperation = 'source-over';
    }
    c.restore();
  }

  /** The minimap.
   *
   *  Placed in the bottom-right corner and sized as a fraction of the smaller
   *  screen dimension so it is the same object on a phone and a desktop.
   *
   *  It answers exactly one question -- "where is everything I cannot see?" --
   *  and it answers it PRECISELY: every live enemy is a dot at its true
   *  position in the arena, the rails are drawn as the table, and the cube is
   *  a bright wedge showing which way it is going. It is not decorative.
   *
   *  This is the direct fix for "enemies are completely out of sight": the
   *  canvas is far larger than the view, and without a map the player is
   *  steering blind toward things they cannot locate. A minimap that is
   *  precisely scaled turns the whole arena into readable space.
   *
   *  Deliberately excluded: enemy kinds, health, or anything that would make
   *  the player read the MAP instead of the field. It is a locator, not a HUD.
   */
  function minimap(c, world, combat, v, state) {
    const A = ARENA;
    if (!A) return;
    // ── THE TACTICAL PANEL ──────────────────────────────────────────────────
    //
    // This used to be a 133x407 sliver. Not a bug in the drawing code -- it was
    // an HONEST scale drawing of a 28,000 x 90,000 arena, and an honest drawing
    // of a shaft is a strip. The arena is now square (see levels.js), so the
    // panel can be square too, and the map finally reads like the room it
    // describes.
    //
    // What it answers, in order of how fast you need it:
    //
    //   1. WHERE AM I relative to all four walls, including how much room is
    //      left in the direction I am travelling. That is the number that
    //      decides whether the next launch is a bank or a wall.
    //   2. WHERE IS EVERYTHING ELSE, at true position: hostiles, the crown,
    //      live hazards, the spawn frontier.
    //   3. WHERE AM I GOING: the aim line, drawn as a ray, so a bounce angle can
    //      be judged before committing to it.
    //
    // It is still a LOCATOR, not a HUD: no health, no kinds, no damage. The
    // difference between this and the old one is that it is drawn to be read at
    // a glance rather than decoded.
    c.setTransform(canvas.width / w, 0, 0, canvas.height / h, 0, 0);
    const side = Math.min(w, h),
      pad = Math.max(10, side * 0.022),
      box = Math.min(side * 0.3, 226), // the panel: square, because the arena is
      plot = box - 14, // inset so the walls sit INSIDE the frame
      x0 = w - box - pad,
      y0 = h - box - pad,
      // One scale for both axes: the arena is square, so this is exact.
      scale = plot / A.w,
      toMap = (x, y) => ({
        x: x0 + 7 + (x - A.x) * scale,
        y: y0 + 7 + (y - A.y) * scale,
      }),
      p = world.player.position;

    c.save();
    // ── plate ─────────────────────────────────────────────────────────────
    c.globalAlpha = 0.92;
    c.fillStyle = '#07050d';
    c.fillRect(x0, y0, box, box);
    c.globalAlpha = 1;
    c.strokeStyle = '#2a1f33';
    c.lineWidth = 1;
    c.strokeRect(x0 + 0.5, y0 + 0.5, box - 1, box - 1);

    // ── the four walls ────────────────────────────────────────────────────
    //
    // Drawn individually so each can say something. The wall you are CLOSEST to
    // brightens: at a glance that is "the next thing I will hit".
    const inset = 7,
      wx0 = x0 + inset,
      wy0 = y0 + inset,
      wx1 = x0 + inset + plot,
      wy1 = y0 + inset + plot,
      // distance to each wall, in world units
      dl = p.x - A.x,
      dr = A.x + A.w - p.x,
      dt = p.y - A.y,
      db = A.y + A.h - p.y,
      near = (d) => {
        // 1 when touching, 0 by a third of the field away.
        return Math.max(0, Math.min(1, 1 - d / (A.w * 0.33)));
      },
      wall = (x1, y1, x2, y2, d) => {
        const k = near(d);
        c.globalAlpha = 0.45 + 0.55 * k;
        c.strokeStyle = k > 0.35 ? '#ff9fb4' : '#6d5470';
        c.lineWidth = 1.5 + 1.5 * k;
        c.beginPath();
        c.moveTo(x1, y1);
        c.lineTo(x2, y2);
        c.stroke();
      };
    wall(wx0, wy0, wx1, wy0, dt); // top
    wall(wx0, wy1, wx1, wy1, db); // floor
    wall(wx0, wy0, wx0, wy1, dl); // left
    wall(wx1, wy0, wx1, wy1, dr); // right
    c.globalAlpha = 1;

    // ── the spawn frontier ────────────────────────────────────────────────
    //
    // `s.line` is the field's lower bound: nothing spawns below it. Showing it
    // explains why the field stops where it does, which was previously
    // invisible. Drawn as a dashed rule, not a hazard.
    const lineY = toMap(A.x, state?.line ?? A.y).y;
    if (lineY > wy0 && lineY < wy1) {
      c.globalAlpha = 0.3;
      c.strokeStyle = '#8c7590';
      c.lineWidth = 1;
      c.setLineDash([3, 4]);
      c.beginPath();
      c.moveTo(wx0, lineY);
      c.lineTo(wx1, lineY);
      c.stroke();
      c.setLineDash([]);
      c.globalAlpha = 1;
    }

    // ── what the camera can see ───────────────────────────────────────────
    //
    // The single most useful overlay, because it separates "the arena" from
    // "my world" at a glance.
    c.strokeStyle = '#fff8ec';
    c.globalAlpha = 0.26;
    c.lineWidth = 1;
    const vw = v.w * scale,
      vh = v.h * scale,
      vx = toMap(v.x, v.y).x,
      vy = toMap(v.x, v.y).y;
    c.beginPath();
    c.rect(
      Math.max(wx0, vx),
      Math.max(wy0, vy),
      Math.min(vw, wx1 - Math.max(wx0, vx)),
      Math.min(vh, wy1 - Math.max(wy0, vy)),
    );
    c.stroke();
    c.globalAlpha = 1;

    // ── live hazards ──────────────────────────────────────────────────────
    //
    // Broken rings and needles are things that can hurt you. They were not on
    // the map at all, so a hazard travelling toward an off-screen player was
    // invisible until it arrived.
    c.fillStyle = '#f67f9c';
    for (const h of combat.hazards || []) {
      const q = toMap(h.x, h.y);
      if (q.x < wx0 || q.x > wx1 || q.y < wy0 || q.y > wy1) continue;
      c.globalAlpha = 0.5;
      c.beginPath();
      c.arc(q.x, q.y, 1.3, 0, TAU);
      c.fill();
    }
    c.globalAlpha = 1;

    // ── hostiles, at true position ────────────────────────────────────────
    for (const e of combat.enemies.values()) {
      const q = toMap(e.x, e.y);
      if (q.x < wx0 - 1 || q.x > wx1 + 1 || q.y < wy0 - 1 || q.y > wy1 + 1) continue;
      const crown = e.kind === 'crown';
      c.fillStyle = crown ? '#ffd166' : e.mode === 'idle' ? '#8c7590' : '#ff507b';
      c.globalAlpha = e.mode === 'idle' ? 0.75 : 1;
      c.beginPath();
      c.arc(q.x, q.y, crown ? 2.8 : 1.6, 0, TAU);
      c.fill();
    }
    c.globalAlpha = 1;

    // ── the shot you are about to take ────────────────────────────────────
    //
    // The aim line as a ray from the cube. On a table this is the difference
    // between guessing an angle and reading one.
    const speed = Math.hypot(world.player.velocity.x, world.player.velocity.y);
    const q = toMap(p.x, p.y);
    if (speed > 2) {
      const a = Math.atan2(world.player.velocity.y, world.player.velocity.x);
      c.strokeStyle = '#deff52';
      c.globalAlpha = 0.5;
      c.lineWidth = 1.2;
      c.beginPath();
      c.moveTo(q.x, q.y);
      c.lineTo(q.x + Math.cos(a) * 16, q.y + Math.sin(a) * 16);
      c.stroke();
      c.globalAlpha = 1;
    }

    // ── the subject ───────────────────────────────────────────────────────
    //
    // A wedge, so heading is readable: on a billiard table which way you point
    // IS the information.
    const ang = Math.atan2(world.player.velocity.y, world.player.velocity.x);
    c.fillStyle = '#deff52';
    c.beginPath();
    c.moveTo(q.x + Math.cos(ang) * 5.4, q.y + Math.sin(ang) * 5.4);
    c.lineTo(q.x + Math.cos(ang + 2.5) * 3.6, q.y + Math.sin(ang + 2.5) * 3.6);
    c.lineTo(q.x + Math.cos(ang - 2.5) * 3.6, q.y + Math.sin(ang - 2.5) * 3.6);
    c.closePath();
    c.fill();
    // A ring so the cube never disappears against a crowded cluster of dots.
    c.strokeStyle = '#07050d';
    c.globalAlpha = 0.9;
    c.lineWidth = 1;
    c.beginPath();
    c.arc(q.x, q.y, 6.2, 0, TAU);
    c.stroke();
    c.globalAlpha = 1;
    c.restore();
  }

  function draw(run, alpha, aim, motion, device='mouse') {
    transform();
    const { world, state: s, combat } = run,
      v = (lastView = camera.view(alpha)),
      p = bodyPose(world.player, alpha),
      nearest = run.nearest(),
      time = mix(world.previousClock, world.clock, alpha);
    // The cube is the object every camera rule is written around, so the draw
    // trace records it alongside the hostiles. Without it a test cannot tell a
    // pinned cube from a cube that merely happens to be near the middle.
    if (drawTrace)
      drawTrace.push({
        id: '@cube',
        kind: 'cube',
        mode: s.phase,
        alpha,
        x: p.x,
        y: p.y,
        ex: world.player.position.x,
        ey: world.player.position.y,
        px: (world.player.plugin.previous ?? world.player.position).x,
        py: (world.player.plugin.previous ?? world.player.position).y,
        sx: (p.x - v.x) * v.scale,
        sy: (p.y - v.y) * v.scale,
        // Where the cube sits in the VIEWPORT, 0..1. This is the number the pin
        // is about: it must not move while the camera is pinned.
        ux: (p.x - v.x) / v.w,
        uy: (p.y - v.y) / v.h,
      });
    syncScene(run,nearest);
    if (s.opening) back.bench(v);
    else back.world(v, s.seed, s.band);
    // Slow-motion frame: darken the BACKDROP and its edges, never the things
    // the player must read. Drawn before targets, arc and cube deliberately.
    if (s.held || (s.panicTicks > 0 && s.phase === 'playing')) {
      const g = c.createRadialGradient(w / 2, h * 0.52, Math.min(w, h) * 0.16, w / 2, h * 0.52, Math.max(w, h) * 0.7);
      g.addColorStop(0, 'rgba(10,8,18,0)');
      g.addColorStop(0.58, 'rgba(10,8,18,0.26)');
      g.addColorStop(1, 'rgba(7,5,12,0.72)');
      c.save();
      c.fillStyle = g;
      c.fillRect(0, 0, w, h);
      c.restore();
    }
    c.save();
    const shakeAmount = motion ? shake.amount : 0;
    if (shakeAmount > 0)
      c.translate(-Math.cos(shake.bearing) * shakeAmount, -Math.sin(shake.bearing) * shakeAmount);
    c.scale(v.scale, v.scale);
    c.translate(-v.x, -v.y);
    if (inView(v, SPAWN, 140)) pad(c);
    if (s.opening) {
      for (const pegs of s.opening.racks) rackInk(c, pegs, combat.enemies);
      if (s.opening.returning) {
        const a = s.opening.anchor;
        c.save();
        c.globalAlpha = 0.65;
        line(c, INK.acid, 2, a.x, a.y, p.x, p.y);
        c.restore();
      }
    } else {
      walls(c, v, p);
      if (s.net || s.caught) {
        const y = s.caught
          ? p.y + R * (Math.abs(Math.cos(p.angle)) + Math.abs(Math.sin(p.angle))) + 2
          : s.line - 85;
        if (y < v.y + v.h + 30) {
          const lip = s.caught ? y - 28 : y;
          c.save();
          c.beginPath();
          c.moveTo(v.x - 8, lip);
          c.quadraticCurveTo((v.x + p.x) / 2, y, p.x, y);
          c.quadraticCurveTo((p.x + v.x + v.w) / 2, y, v.x + v.w + 8, lip);
          c.strokeStyle = '#1c2530';
          c.lineWidth = 11;
          c.stroke();
          c.strokeStyle = '#b7b291';
          c.lineWidth = 6;
          c.stroke();
          c.setLineDash([10, 15]);
          c.strokeStyle = '#4a6158';
          c.lineWidth = 5;
          c.stroke();
          c.restore();
        }
      }
    }
    {
      for (const e of shards) {
        const q = pose(e, alpha);
        c.save();
        // Debris fade, owned by the animation registry: the numerator is
        // the row's life, so retiming a shard cannot desync its alpha.
        c.globalAlpha = fade('shard', ANIM.shard.life - e.life);
        c.translate(q.x, q.y);
        c.rotate(q.angle);
        if (motion && e.opts.paper) {
          const age = 32 - e.life;
          c.rotate(e.local);
          c.scale(1, 1 - 0.4 * Math.sin(age * 0.095) ** 2);
          c.rotate(-e.local);
        }
        c.scale(e.r, e.r);
        cutHalf(c, e.kind, e.path, e.local, e.side, e.opts);
        c.restore();
      }
      if (motion)
        for (const e of sparks) {
          c.save();
          c.globalAlpha = fade('spark', ANIM.spark.life - e.life);
          c.translate(mix(e.px, e.x, alpha), mix(e.py, e.y, alpha));
          c.rotate(e.angle);
          poly(c, e.col, [
            [e.l, 0],
            [-e.l, -2],
            [-e.l * 0.6, 2],
          ]);
          c.restore();
        }
    }
    // ── speed field ────────────────────────────────────────────────────────
    //
    // The cube's own stretch sells speed locally, but a fast game also needs the
    // FRAME to agree. Everything below is a screen-space effect keyed to the
    // cube's speed tier, so climbing the ladder changes the whole image rather
    // than just the player's silhouette:
    //
    //   CRUISE  – a faint warm vignette appears. The image starts to close in.
    //   SURGE   – streak lines radiate from the direction of travel, and the
    //             vignette picks up the tier's tint.
    //   REDLINE – the edges bloom rose and the streaks thicken.
    //
    // All of it is drawn in screen space AFTER the world, and none of it
    // touches enemies: they are drawn before this layer, sharp, always.
    if (motion) speedField(c, world, v, time);
    // Wrapped in save/restore: the minimap sets its own screen transform, and
    // anything drawn after it (the cube) inherits whatever matrix is left
    // behind. Without this the cube was drawn through the map's 0.045 scale
    // matrix and effectively vanished -- 455 acid pixels became 13.
    if (!s.opening) {
      c.save();
      minimap(c, world, combat, v, s);
      c.restore();
    }
    if (motion && s.phase === 'playing') streak(c, trail, p, s.blade > 0);
    // One expanding ring per contact, at the point the silhouettes met. A
    // shockwave is the cheapest honest way to say "something stopped here".
    if (motion && s.impact) {
      const w = wave(s.impactAge);
      if (w) {
        c.save();
        c.globalAlpha = w.alpha * 0.85;
        arc(c, INK.paper, 2.6 / v.scale, s.impact.x, s.impact.y, w.r);
        c.globalAlpha = w.alpha * 0.55;
        arc(c, INK.rose, 1.4 / v.scale, s.impact.x, s.impact.y, w.r * 0.72);
        c.restore();
      }
    }
    // ── THE SONIC BOOM ───────────────────────────────────────────────────────
    //
    // A rail bank at speed is the billiard dopamine hit the brief asked for, so
    // it gets its own effect rather than reusing the ordinary contact ring.
    //
    // What separates it from a normal impact:
    //  * THREE concentric rings at different speeds, not one. A single ring
    //    reads as "something touched"; a stack reads as a sound barrier.
    //  * The rings are elongated along the rail's NORMAL, because that is the
    //    direction the cube just reversed through -- a circular boom would be
    //    directionless and therefore weightless.
    //  * Tapered speed lines fan out ALONG the rail, which is where a real
    //    shockwave would go as the energy travels the wall.
    //  * Everything scales with the speed the cube arrived at, so a gentle
    //    graze is quiet and a redline bank is enormous. If every bank looked
    //    like this the effect would be noise.
    // ── HYPER AURA ─────────────────────────────────────────────────────────
    //
    // A ring of tapered speed lines around the cube while hyper is live, and
    // only while it is live. Intensity is `hyperLevel` (0 at the normal limit,
    // 1 at full hyper), so the effect FADES as gravity takes the state back --
    // the player can literally see hyper running out.
    //
    // Deliberately NOT a screen effect. The brief's standing constraint is no
    // camera zoom/roll/shake, and a full-screen flash at this speed is
    // nauseating. The aura is attached to the cube, which the eye is already
    // tracking, so it reads as the cube heating up rather than the room moving.
    if (motion && s.hyperLevel > 0.02) {
      // ── DELIBERATELY QUIETER THAN IT WAS ─────────────────────────────────
      //
      // First version: nine lines spinning at 6.5 rad/s, flickering their
      // length with sin(), plus a pulsing ring. On its own that is a nice
      // flourish; on top of a cube already stretched, a screen-space speed
      // field, a pulsing speedometer and a permanent blade, it was the straw
      // that made the state unreadable. The complaint was precise -- "more
      // sensory load than before... my brain can't keep up".
      //
      // So: no spin (a rotating element at the edge of vision is the most
      // fatiguing thing on the screen), no flicker (length is fixed per step),
      // six lines instead of nine, at half the opacity, and the pulsing ring
      // is gone. What remains is a static halo that says "hyper is live" and
      // then holds still -- the cube itself is already moving enough.
      const k = s.hyperLevel;
      // ── THE ENTRY BURST ────────────────────────────────────────────────
      //
      // Hyper is the biggest state the game offers and its arrival was a line of
      // HUD text. Every other major event has a drawn mark; this one now has the
      // loudest. A single expanding ring plus one radial volley, both one-shot
      // over 18 ticks, so it can never become the background.
      //
      // One-shot is the whole design: a burst that repeats stops being an event.
      const burst = s.hyperAge >= 0 && s.hyperAge < HYPER_BURST ? s.hyperAge / HYPER_BURST : -1;
      if (burst >= 0) {
        const t = burst,
          ease = 1 - Math.pow(1 - t, 3);
        c.save();
        c.translate(p.x, p.y);
        // The ring: fast out, fading. Drawn as an ellipse along the cube's own
        // bearing so it reads as a shockwave thrown off the direction of travel.
        c.globalAlpha = (1 - t) * 0.85;
        c.strokeStyle = INK.acid;
        c.lineWidth = Math.max(1, (7 - 5 * t) / v.scale);
        c.beginPath();
        c.arc(0, 0, R * (1.4 + 7.5 * ease), 0, TAU);
        c.stroke();
        // A second, tighter ring a beat behind it: the double-ring is what makes
        // an anime impact read as an IMPACT rather than a glow.
        if (t > 0.12) {
          const t2 = (t - 0.12) / 0.88;
          c.globalAlpha = (1 - t2) * 0.5;
          c.lineWidth = Math.max(0.8, 3 * (1 - t2) / v.scale);
          c.beginPath();
          c.arc(0, 0, R * (1.2 + 5.2 * (1 - Math.pow(1 - t2, 3))), 0, TAU);
          c.stroke();
        }
        // The volley: 14 tapered rays, launched together, receding outward.
        c.globalAlpha = (1 - t) * 0.9;
        c.strokeStyle = INK.paper;
        for (let i = 0; i < 14; i++) {
          const a = (i / 14) * TAU + 0.19,
            r0 = R * (1.5 + 6.5 * ease),
            r1 = r0 + R * (1.9 + 2.2 * (1 - t));
          c.lineWidth = Math.max(0.6, (2.6 - 1.8 * t) / v.scale);
          c.beginPath();
          c.moveTo(Math.cos(a) * r0, Math.sin(a) * r0);
          c.lineTo(Math.cos(a) * r1, Math.sin(a) * r1);
          c.stroke();
        }
        c.globalAlpha = 1;
        c.restore();
      }
      // ── THE SUSTAINED AURA, NOW ESCALATING ─────────────────────────────
      //
      // The old version was six static lines at 0.1-0.3 alpha. It was quieted
      // after a "too much sensory load" report -- but that report was about
      // hyper ON TOP of everything else firing at once, and the response made
      // hyper itself nearly invisible. The state you spend seven consecutive
      // links earning should not be the state you can miss.
      //
      // It escalates on `hyperLevel` in three channels at once -- COUNT (6 to
      // 12), LENGTH, and OPACITY -- so the player watches hyper drain as gravity
      // takes the state back. Still no spin and no flicker: those are what made
      // the first version tiring, and neither is needed to read intensity.
      const n = 6 + Math.round(6 * k);
      c.save();
      c.translate(p.x, p.y);
      for (let i = 0; i < n; i++) {
        const a = (i / n) * TAU + 0.26,
          len = R * (1.3 + 1.15 * k);
        c.globalAlpha = 0.12 + 0.42 * k;
        c.strokeStyle = i % 2 ? INK.acid : INK.paper;
        c.lineWidth = (1.3 + 1.5 * k) / v.scale;
        c.beginPath();
        c.moveTo(Math.cos(a) * R * 1.1, Math.sin(a) * R * 1.1);
        c.lineTo(Math.cos(a) * len, Math.sin(a) * len);
        c.stroke();
      }
      // The body's own outline, heated. Without this only the arena decor knows
      // hyper is live; the cube the player is actually watching stays ordinary.
      //
      // This was a `strokeRect` around an axis-aligned box, and the body is not
      // an axis-aligned box: `cube()` draws a tapered quadrilateral that at rest
      // is wider at the bottom than the top. Measured on the glass, the outline
      // hung visibly off the silhouette on every edge, worst along the base. A
      // halo that does not follow the shape it is haloing reads as a UI bug, so
      // this is now a soft glow BURST behind the body -- drawn before `cube()`,
      // so the shape's own dark rim separates it from the body instead of
      // slicing across the face.
      if (k > 0.15) {
        c.globalAlpha = 0.22 + 0.34 * k;
        c.strokeStyle = INK.acid;
        c.lineWidth = (5 + 9 * k) / v.scale;
        c.beginPath();
        c.arc(0, 0, R * 1.02, 0, TAU);
        c.stroke();
      }
      c.globalAlpha = 1;
      c.restore();
    }
    if (motion && s.boom && s.boomAge < 26) {
      const k = 1 - s.boomAge / 26,
        power = clamp(s.boom.speed / MAX_SPEED, 0, 1.4),
        bx = s.boom.x,
        by = s.boom.y,
        // The normal points INTO the table, so the boom travels back out of it.
        a = Math.atan2(s.boom.ny, s.boom.nx);
      c.save();
      for (let i = 0; i < 3; i++) {
        const t = (s.boomAge - i * 2.5) / 26;
        if (t < 0 || t > 1) continue;
        const r = (18 + 120 * power) * t * t,
          al = (1 - t) * (1 - t) * 0.6 * (0.5 + power * 0.5);
        c.globalAlpha = al;
        c.save();
        c.translate(bx, by);
        c.rotate(a);
        c.scale(1, 0.55); // squash across the normal: the ring hugs the rail
        arc(c, INK.acid, 2.4 / v.scale, 0, 0, r);
        c.restore();
      }
      // Tapered speed lines along the rail.
      const tx = -Math.sin(a),
        ty = Math.cos(a);
      for (let i = 0; i < 7; i++) {
        const side = i % 2 ? 1 : -1,
          u = (i - 3) / 3,
          len = (26 + 150 * power) * k,
          sp = 0.3 + 0.7 * Math.abs(u);
        c.globalAlpha = 0.5 * k;
        c.strokeStyle = INK.acid;
        c.lineWidth = (2.2 * k) / v.scale;
        c.beginPath();
        c.moveTo(bx + u * 26 * side, by + u * 26 * side);
        c.lineTo(bx + tx * len * sp * side, by + ty * len * sp * side);
        c.stroke();
      }
      c.globalAlpha = 1;
      c.restore();
    }
    for (const e of combat.enemies.values())
      if (inView(v, e, 870)) warnings(c, e, { ...pose(e, alpha), r: e.r }, time);
    for (const l of combat.links) {
      const a = pose(l.a, alpha),
        b = pose(l.b, alpha);
      c.save();
      if (l.mode === 'tell') {
        c.setLineDash([5, 10]);
        line(c, '#bf7fa7', 1.5, a.x, a.y, b.x, b.y);
        c.setLineDash([]);
        const k = clamp(l.f, 0, 1) * 0.46;
        line(c, '#fba9dc', 3, a.x, a.y, mix(a.x, b.x, k), mix(a.y, b.y, k));
        line(c, '#fba9dc', 3, b.x, b.y, mix(b.x, a.x, k), mix(b.y, a.y, k));
      } else {
        line(c, INK.rose, 9, a.x, a.y, b.x, b.y);
        line(c, '#ffe4ea', 3, a.x, a.y, b.x, b.y);
      }
      c.restore();
    }
    for (const m of imprints) {
      c.save();
      c.globalAlpha = fade('imprint', ANIM.imprint.life - m.life);
      if (m.type === 'cut' || m.type === 'armor')
        contactInk(c, m, fade('imprint', ANIM.imprint.life - m.life), motion);
      else if (m.type === 'shear') {
        shearInk(c, m.x, m.y, m.angle, Math.hypot(m.end.x - m.x, m.end.y - m.y), SHEAR.width);
      } else {
        // The spent needle snaps across its bearing, not a fake reflected shot.
        c.translate(m.x, m.y);
        c.rotate(m.angle);
        const split = motion ? (13 - m.life) * 0.7 : 3;
        poly(c, '#ffa6ce', [
          [-18, -2 - split],
          [-4, -4 - split],
          [-7, 1 - split],
        ]);
        poly(c, INK.paper, [
          [1, 1 + split],
          [12, 3 + split],
          [-2, 6 + split],
        ]);
        line(c, INK.acid, 2.8, -8, 9, 5, -8);
      }
      c.restore();
    }
    // At the handoff, don't draw a green player sight right on top of the
    // first red charge tell. Pressing to aim still shows the actual shot.
    if (aim?.power || (s.story && s.opening?.rest && s.edge>0 && !s.opening.finishing)) {
      const shot = drawArc(
        c,
        run,
        aim?.power ? aim : run.suggestion(),
        alpha,
        v.scale,
        !aim?.power,
        time,
        v,
      );
      // A tap aimed at a particular body, or a magnet catch, gets one bracket
      // on that shape so the target is never ambiguous.
      const marked = aim?.lock?.id || aim?.target;
      if (marked && !shot?.lock && combat.enemies.has(marked)) {
        const e = combat.enemies.get(marked),
          q = pose(e, alpha);
        for (let i = 0; i < 2; i++)
          arc(c, INK.acid, 2 / v.scale, q.x, q.y, e.r + 6, -0.44 + i * Math.PI, 0.44 + i * Math.PI);
      }
    }
    for (const e of combat.enemies.values()) {
      if (!inView(v, e, 100)) continue;
      const q = pose(e, alpha);
      // Sharpness is a guarantee, not a style choice: this is the one draw
      // site for hostile shapes and it must never inherit an alpha or a filter
      // left behind by a passing effect. See MOTION.enemyBlur.
      c.globalAlpha = 1;
      c.filter = 'none';
      // The trace records the DECISION, not the geometry: which shape, where
      // the interpolator put it, and which alpha produced that. A test can then
      // ask the question the player's eye asks -- "did this thing move?" --
      // without re-implementing the interpolation it is trying to check.
      if (drawTrace)
        drawTrace.push({
          id: e.id,
          kind: e.kind,
          mode: e.mode,
          alpha,
          x: q.x,
          y: q.y,
          // The raw pre/post positions, so a test can prove the interpolator
          // actually used them rather than happening to be between them.
          px: e.px,
          py: e.py,
          ex: e.x,
          ey: e.y,
          // Device space: the space the player sees.
          sx: (q.x - v.x) * v.scale,
          sy: (q.y - v.y) * v.scale,
        });
      foe(c, e.kind, q.x, q.y, e.r, q.angle, {
        hp: e.hp,
        paper: e.paper,
        // Eased hit flash. `e.flash` counts DOWN from ANIM.flash.life, so the
        // amount rises as it decays, which is exactly the attack the eye
        // needs: instant white, then a quick settle back to the real colour.
        // A hard boolean here used to pop the whole shape to flat white for
        // two frames, which on a moving target reads as a stutter.
        flash: e.flash > 0 ? fade('flash', ANIM.flash.life - e.flash) : 0,
        fault: e.fault,
        time,
      });
    }
    for (const a of combat.hazards) {
      const x = mix(a.px, a.x, alpha),
        y = mix(a.py, a.y, alpha);
      if (a.kind === 'ring') {
        c.save();
        c.globalAlpha = a.spent ? 0.26 : 1;
        arc(c, '#b93863', 6, x, y, mix(a.previousRadius, a.radius, alpha));
        arc(c, '#ffb7c8', 2, x, y, mix(a.previousRadius, a.radius, alpha));
        c.restore();
      } else {
        c.save();
        c.translate(x, y);
        c.rotate(a.angle);
        poly(
          c,
          '#ffa6ce',
          [
            [10, 0],
            [-9, -4],
            [-18, 0],
            [-9, 4],
          ],
          INK.black,
          1.8,
        );
        c.restore();
      }
    }
    if (!['dying', 'over'].includes(s.phase)) {
      if (s.drive > 0) {
        const a = motion ? time * 0.065 : 0;
        for (let j = 0; j < 3; j++)
          arc(c, INK.acid, 2, p.x, p.y, R * 1.52, a + (j * TAU) / 3, a + (j * TAU) / 3 + 0.65);
      }
      if (s.blade > 0) {
        const da = s.slashAngle - s.previousSlash;
        const bearing = s.previousSlash + alpha * Math.atan2(Math.sin(da), Math.cos(da));
        if (motion)
          drawSweep(
            c,
            p,
            bearing,
            R * s.reach,
            s.shots % 2 ? 1 : -1,
            // Sweep strength, timed by the animation registry rather than a
            // local divisor, so the blade and its snap cannot disagree about
            // how long the cut is readable.
            fade('blade', time - s.swingStart),
          );
        blade(c, p.x, p.y, bearing, R, 1, s.reach);
      } else if ((s.opening?.rest || (s.phase === 'ready' && s.drive > 0)) && nearest) {
        blade(
          c,
          p.x,
          p.y,
          Math.atan2(nearest.y - p.y, nearest.x - p.x),
          R,
          0.94,
          s.opening?.reach ?? s.reach,
        );
      }
      c.save();
      if (s.invul > 0 && motion) c.globalAlpha = 0.61 + 0.39 * Math.abs(Math.sin(s.invul * 0.18));
      c.translate(p.x, p.y);
      // Elastic tension: the cube loads against its launch bearing while the
      // player holds a pull. Pure pose; no collision or physics change.
      if (aim?.power && aim.anchor && !aim.held) {
        const a = Math.atan2(aim.y, aim.x) || 0,
          load = clamp(aim.power, 0, 1) * 0.16;
        c.rotate(a);
        c.scale(1 - load * 0.5, 1 + load * 0.5);
        c.rotate(-a);
      }
      if (motion && s.blade > 0) {
        const snap = 0.105 * fade('blade', (time - s.swingStart) * 1.4);
        c.rotate(s.slashAngle);
        c.scale(1 + snap, 1 - snap * 0.72);
        c.rotate(-s.slashAngle);
      }
      // ── THE ANIMATED POSE ────────────────────────────────────────────────
      //
      // One composed pose for the cube: the 8-direction body language, the
      // falling vocabulary, the swing counter-rotation, and the landing squash,
      // blended in that order by animation.cubePose(). It is applied FIRST so
      // every speed effect below layers on top of it rather than replacing it.
      //
      // `holdDir` is remembered between frames so a cube at rest keeps the pose
      // it settled in instead of snapping to east (atan2(0,0) is 0, which would
      // make it face right every time it stopped).
      const poseAnim = cubePose({
        vx: world.player.velocity.x,
        vy: world.player.velocity.y,
        slashAge: s.slashAge,
        fallAge: s.fallAge,
        landAge: s.landAge,
        hold: holdDir,
        facing,
      });
      if (poseAnim.move.moving) holdDir = poseAnim.move.index;
      if (poseAnim.counter) c.rotate(poseAnim.counter);
      // `wide`/`tall` are direct multipliers on the body: landFor says
      // `wide: 1 + 0.42*q` and documents ">1 = wider than tall", so it must be
      // multiplied in as-is. Inverting it here made every pose read backwards --
      // a landing stretched upward like a pulled spring instead of splatting
      // wide, and a northward lean grew broader instead of taller.
      if (poseAnim.tall !== 1 || poseAnim.wide !== 1)
        c.scale(poseAnim.wide, poseAnim.tall);
      // ── SKEW: the body being DRAGGED, not turned ──────────────────────
      //
      // This was `c.rotate(poseAnim.twist)`, a ±28 degree body rotation. A
      // rotated square is ambiguous -- it reads equally well as spinning, as
      // sliding, as mis-drawn, or as the camera rolling -- and it fights the
      // player's read of direction, because a rotated square and a square
      // travelling diagonally look alike.
      //
      // A shear cannot be misread. Sheared along the direction of travel, the
      // leading edge leads and the trailing edge lags, and the body stays
      // upright so nothing suggests rotation. Applied in the heading's frame:
      // shear along the axis the player is actually moving on.
      //
      // `transform(1, 0, k, 1, 0, 0)` skews X by Y: points further along the
      // body's local Y are pushed along X, which is the trailing/leading axis
      // once the frame is aligned to travel.
      if (Math.abs(poseAnim.skew) > 0.002) {
        const h = poseAnim.heading - p.angle;
        c.rotate(h);
        c.transform(1, 0, poseAnim.skew, 1, 0, 0);
        c.rotate(-h);
      }
      // ── STRETCH ALONG TRAVEL ──────────────────────────────────────────
      //
      // Applied in the heading's own frame: a cube thrown east gets LONGER east
      // and thinner north-south. This is separate from `tall`/`wide` (which are
      // the pose's own proportions) and from the existing speed streak (which
      // only fires airborne) -- this one is the pose system's own answer to
      // "how hard am I being thrown", and it works on the ground too.
      if (poseAnim.stretch > 0.004) {
        // `p.angle`, NOT `bodyAngle`: this block runs before the `lean`
        // rotation below, so the frame here is still only the body's own
        // angle. Using `bodyAngle` here would subtract a rotation that has not
        // been applied yet, and would tilt the stretch by `-lean` -- a bug this
        // file already had once while this comment was being written.
        const k = poseAnim.stretch;
        c.rotate(poseAnim.heading - p.angle);
        c.scale(1 + k * 0.34, 1 - k * 0.2);
        c.rotate(-(poseAnim.heading - p.angle));
      }
      // ── THE BODY FRAME IS ROTATED BY `lean`, NOT BY `p.angle` ──────────
      //
      // MEASURED BUG, and it predates this round. Everything below derives a
      // direction from travel and rotates by `(a - p.angle)`, which assumed the
      // frame had been rotated by `p.angle`. It had not: the line above adds
      // `lean` on top. So the motion blur, the ghost trail, the morph wedge, the
      // impact squash and the supersonic cone were all off-axis by `lean`.
      //
      // Flying EAST `lean` is +19.5 degrees, so a 22px smear was dragged 19.5
      // degrees off the cube's own path -- plainly visible, and it reads as the
      // cube sliding sideways. On a diagonal it is worse: the cube is rotated 45
      // degrees as well, so `a - p.angle` came out as the atan2 of a rotated
      // vector and the effect landed at an arbitrary angle.
      //
      // Declared HERE, after the rotation, and not higher up: a declaration
      // only computes the number, so placing it above `lean` left every reader
      // below using a frame that had not been rotated yet.
      //
      // The stretch block above is deliberately on `p.angle`: it runs before
      // this rotation. `cube()` re-rotates by `p.angle` internally, so the body
      // itself was never tilted -- only its effects were.
      // ── NO ROTATION ────────────────────────────────────────────────────
      //
      // `lean` used to be applied here as `c.rotate(poseAnim.lean)`: a literal
      // body rotation of up to 19.5 degrees (E) that the renderer then undid
      // around `cube()` so the silhouette stayed upright. The shape never
      // turned -- only the deformation did -- so the cost was all of the
      // complexity and almost none of the read.
      //
      // The body does not rotate any more. `lean` is now an EXPRESSION channel:
      // it dips the leading corners (see the jelly field in art.js). The
      // rotation is gone, the information it carried is not.
      //
      // `bodyAngle` stays as a name because every effect below subtracts it,
      // and it is now simply the body's own angle.
      const bodyAngle = p.angle;
      // ── MOVEMENT SPEED LINES ──────────────────────────────────────────
      //
      // The direction poses now deform the body by up to 15.6px, but a shape
      // changing size is not by itself a shape MOVING. These are the marks that
      // say "travelling": short strokes streaming off the trailing edge,
      // counter to the direction of travel.
      //
      // They are drawn behind the body (before it, in this frame) so the
      // silhouette stays crisp, and they scale with `stress` -- the same
      // measured quantity that drives the stretch -- so a crawl gets a hint and
      // a full launch gets a wake. Nothing here fires at rest.
      if (poseAnim.stretch > 0.02) {
        const k = Math.min(1, poseAnim.stretch / 0.2),
          // Local, not world: this frame is rotated by `bodyAngle`, so a raw
          // world bearing would throw the whole wake off by `lean`.
          back = poseAnim.heading - bodyAngle + Math.PI,
          n = 2 + Math.round(k * 4);
        c.save();
        for (let i = 0; i < n; i++) {
          // Fan them across the trailing edge, not in a single line: the wake
          // of a square is as wide as the square.
          const off = (i - (n - 1) / 2) * R * 0.42,
            len = R * (0.55 + 1.5 * k) * (1 - Math.abs(i - (n - 1) / 2) / n),
            slide = R * (0.9 + 0.5 * k);
          const ox = Math.cos(back) * slide + Math.cos(back + Math.PI / 2) * off,
            oy = Math.sin(back) * slide + Math.sin(back + Math.PI / 2) * off;
          c.globalAlpha = 0.42 * k * (0.45 + 0.55 * Math.sin(((i + 0.5) / n) * Math.PI));
          line(
            c,
            i === ((n - 1) >> 1) ? INK.paper : INK.acid,
            Math.max(0.9, (1.8 - 0.3 * Math.abs(i - (n - 1) / 2)) / v.scale),
            ox,
            oy,
            ox + Math.cos(back) * len,
            oy + Math.sin(back) * len,
          );
        }
        c.globalAlpha = 1;
        c.restore();
      }
      // Motion streaks, as geometry: a genuinely fast cube is pulled along its
      // own travel and thinned across it, so the eye tracks a line instead of
      // a flickering square. Airborne only — a resting cube gets no stretch.
      if (motion && !world.grounded) {
        const vx = world.player.velocity.x,
          vy = world.player.velocity.y,
          speed = Math.hypot(vx, vy),
          // Only stretch past the normal curve while hyper is actually live.
          e = stretchFor(speed, MAX_SPEED, s.hyper ? HYPER_SPEED : MAX_SPEED);
        if (e.along > 1.001) {
          const along = Math.atan2(vy, vx);
          c.rotate(along - bodyAngle);
          c.scale(e.along, e.across);
          c.rotate(-(along - bodyAngle));
        }
      }
      // ── SUPERSONIC ─────────────────────────────────────────────────────
      //
      // Everything below fires only past hyper's ceiling, which ordinary play
      // cannot reach: it takes a wall rebound at full hyper. That rarity is the
      // point -- a sonic boom you can see every ten seconds is a texture, not a
      // moment.
      if (poseAnim.sonic > 0.02) {
        const k = poseAnim.sonic,
          h = poseAnim.heading;
        // 1. THE SILHOUETTE is applied to the body itself, further down, where
        //    `cube()` is actually emitted -- see `sonicSquash`. Scaling inside
        //    a save/restore here changed a matrix that was thrown away
        //    immediately: measured, deleting it did not alter a single pixel.
        // 2. THE PRESSURE CONE. Two lines ahead of travel, converging to a point
        //    in front of the body. Nothing else in the game uses this shape, so
        //    it reads as supersonic immediately. Drawn in world space around the
        //    cube's own position, before the body is emitted.
        c.save();
        c.rotate(h - bodyAngle);
        c.globalAlpha = 0.45 + 0.5 * k;
        c.strokeStyle = INK.paper;
        c.lineWidth = Math.max(0.8, 2.2 / v.scale);
        const nose = R * (2.1 + 1.5 * k),
          mouth = R * 1.05;
        for (let i = -1; i <= 1; i += 2) {
          c.beginPath();
          c.moveTo(mouth, i * R * (0.85 + 0.25 * k));
          c.lineTo(nose, i * R * 0.1);
          c.stroke();
        }
        // A short cross-mark at the throat of the cone: the shock plane.
        c.globalAlpha = 0.3 + 0.4 * k;
        c.lineWidth = Math.max(0.6, 1.4 / v.scale);
        c.beginPath();
        c.moveTo(mouth, -R * 0.95);
        c.lineTo(mouth, R * 0.95);
        c.stroke();
        c.restore();
        // 3. THE DETACHED LEADING EDGE. A bright arc ahead of the body, the
        //    classic "the ship is already there" cel: the edge has outrun the
        //    thing making it.
        c.save();
        c.rotate(h - bodyAngle);
        c.globalAlpha = 0.5 + 0.5 * k;
        c.strokeStyle = INK.acid;
        c.lineWidth = Math.max(0.9, (2.6 + 1.8 * k) / v.scale);
        c.beginPath();
        c.arc(R * (0.55 + 0.5 * k), 0, R * 0.82, -Math.PI * 0.62, Math.PI * 0.62);
        c.stroke();
        c.restore();
        c.globalAlpha = 1;
      }
      // Contact squash: compress along the surface normal, swell along the
      // tangent, and ring back through a damped spring. Only a real contact
      // recorded by the physics step can start one.
      if (motion && s.impact) {
        const q = squashed(s.impact.speed ?? 0, s.impact.nx, s.impact.ny, s.impactAge);
        if (q) {
          c.rotate(q.axis - bodyAngle);
          c.scale(q.along, q.across);
          c.rotate(bodyAngle - q.axis);
        }
      }
      if (nearest && (s.phase === 'ready' || s.opening?.rest)) {
        const toward =
          (nearest.x - p.x) * Math.cos(p.angle) + (nearest.y - p.y) * Math.sin(p.angle);
        facing = Math.sign(toward) || facing;
      }
      // ── ANIME GHOST IMAGING ──────────────────────────────────────────────
      //
      // Discrete copies of the cube stamped along its path. Not a blur: a blur
      // averages the frames and reads as a camera artefact, while separate cels
      // read as the object moving too fast to be drawn once. See smear.js for
      // why that distinction is the whole effect.
      //
      // Fed only while the cube is genuinely fast, so the ghosts are a READOUT
      // of speed. An effect that is always on stops carrying information.
      {
        const speed = Math.hypot(world.player.velocity.x, world.player.velocity.y),
          g = ghostFor(speed, MAX_SPEED);
        if (motion && g.count && !world.grounded) {
          // Sample the trail every other frame. Sampling every frame makes the
          // ghosts overlap into a smear; every other frame keeps them as
          // distinct cels, which is the look.
          ghostClock++;
          if (ghostClock % 2 === 0) ghosts.push(p.x, p.y, p.angle, facing);
        }
        ghosts.tick(1 / 60);
        if (motion && g.count) {
          c.save();
          let n = 0;
          ghosts.each((gx, gy, ga, gf, age) => {
            if (n >= g.count) return;
            n++;
            // Older ghosts are dimmer and thinner; the newest copy is nearly
            // solid, so the eye connects the trail back to the real cube.
            const k = 1 - (n - 1) / (g.count + 0.6);
            c.globalAlpha = g.alpha * k;
            // The context is already translated to the cube, so ghosts are
            // placed RELATIVE to it. Translating by their world coords here
            // put them thousands of pixels off screen and, worse, left the
            // frame's transform in a state that dropped the cube itself.
            c.save();
            c.translate(gx - p.x, gy - p.y);
            c.rotate(ga - bodyAngle);
            cube(c, 0, 0, R * (0.86 + 0.14 * k), 0, 0, gf);
            c.restore();
          });
          c.globalAlpha = 1;
          c.restore();
        }
      }
      // ── MORPH SMEAR ──────────────────────────────────────────────────────
      // An impossible shape trailing the cube. Drawn before the cube so the
      // solid form always sits on top of its own distortion.
      {
        const speed = Math.hypot(world.player.velocity.x, world.player.velocity.y),
          // `roar` is how far past ordinary speed the cube actually is, so the
          // wake keeps growing through hyper and sonic instead of hitting the
          // same ceiling as a 60 px/tick cruise.
          m = morphWedge(c, speed, MAX_SPEED, Math.max(s.hyper ? s.hyperLevel : 0, poseAnim.sonic));
        if (motion && m) {
          const a = Math.atan2(world.player.velocity.y, world.player.velocity.x);
          c.save();
          c.rotate(a - bodyAngle);
          c.globalAlpha = m.alpha;
          c.fillStyle = INK.acid;
          c.beginPath();
          c.moveTo(-R * 0.4, -m.width * 0.5);
          c.lineTo(-m.length, 0);
          c.lineTo(-R * 0.4, m.width * 0.5);
          c.closePath();
          c.fill();
          c.globalAlpha = 1;
          c.restore();
        }
      }
      // Real motion blur, as a short smear of the cube's own silhouette
      // dragged along its travel. This is the ONE thing in the frame that is
      // allowed to blur: the player owns this motion, so it reads as their
      // speed. Enemies below are never blurred (see MOTION.enemyBlur).
      if (motion && !world.grounded) {
        const vx = world.player.velocity.x,
          vy = world.player.velocity.y,
          speed = Math.hypot(vx, vy),
          smear = stretchFor(speed, MAX_SPEED, s.hyper ? HYPER_SPEED : MAX_SPEED).blur;
        if (smear > 1) {
          const along = Math.atan2(vy, vx),
            steps = smear > 12 ? 3 : 2;
          c.save();
          c.rotate(along - bodyAngle);
          for (let i = steps; i >= 1; i--) {
            const u = i / (steps + 1);
            c.globalAlpha = 0.3 * (1 - u * 0.6);
            c.translate(-1, 0);
            c.save();
            c.translate(-smear * u, 0);
            c.scale(1, 1 - 0.1 * u);
            cube(c, 0, 0, R, 0, 0, facing);
            c.restore();
            c.globalAlpha = 1;
            c.translate(1, 0);
          }
          c.restore();
        }
      }
      // The supersonic silhouette LIVES HERE, on the body, because this is the
      // only place the body is drawn. Longer and thinner than hyper's own
      // curve allows, so the shape itself says "past the ceiling".
      if (poseAnim.sonic > 0.02) {
        const k = poseAnim.sonic;
        c.save();
        c.rotate(poseAnim.heading - bodyAngle);
        c.scale(1 + 0.3 * k, 1 - 0.16 * k);
        c.rotate(-(poseAnim.heading - bodyAngle));
      }
      // ── THE BODY'S DEFORMATION FIELD ────────────────────────────────────
      //
      // Three things drive it, and they are deliberately different in kind so
      // they never fight: the SPRING (what just hit the cube), the POSE's own
      // squash (tall/wide, already composed above), and the LEAN, which used to
      // be a rotation and is now the corner dip.
      //
      // `grip` rises with speed. A cube being thrown at 280 is stiffer than one
      // standing still -- without that, the spring's own follow-through at
      // hyper speed reads as mush, and the faster the character goes the less
      // solid it would look, which is exactly backwards.
      const speedNow = Math.hypot(world.player.velocity.x, world.player.velocity.y);
      const grip = 0.5 + 0.45 * Math.min(1, speedNow / MAX_SPEED);
      const field = jelly.field(
        grip,
        // `lean` is the cell-animation lead: the leading corner dips. Positive
        // lean means moving toward +x, so the corner at -x lags.
        -poseAnim.lean * 1.6,
        // The fall leans the body back, so the dip runs the other way.
        poseAnim.fall ? -poseAnim.fall.lean * 1.2 : 0,
      );
      // ── FACE AND IDLE LIFE ───────────────────────────────────────────
      //
      // `time` is the frame's own clock, so these are pure functions of it --
      // no per-renderer state to get out of step with a paused or resumed run.
      //
      // The blink is on an irregular cycle. An evenly spaced blink is the
      // single clearest tell that a character is on a loop; two coprime periods
      // summed make the interval uneven without needing randomness (which would
      // make a replayed frame differ from the one the player saw).
      const blinkPhase = Math.sin(time * 0.021) + Math.sin(time * 0.0137);
      // A blink is short: shut for about a fifth of a cycle.
      const blink = blinkPhase > 1.72 ? Math.max(0.05, 1 - (blinkPhase - 1.72) * 7) : 1;
      // Breathing only while it has nothing else to do. A cube at speed is not
      // resting, and a chest pulse on a body being thrown is noise.
      const atRest = !poseAnim.move.moving && !poseAnim.fall;
      const breathe = atRest ? Math.sin(time * 0.045) : 0;
      // Gaze toward the nearest hostile, in the body's own frame.
      let look = null;
      if (nearest) {
        const dx = nearest.x - p.x,
          dy = nearest.y - p.y,
          d = Math.hypot(dx, dy) || 1;
        // Only when it is close enough to be worth watching, and never past the
        // edge of the lid -- a pupil pinned to the corner reads as a bug.
        if (d < 900) {
          const ca = Math.cos(-p.angle),
            sa = Math.sin(-p.angle);
          look = [
            Math.max(-1, Math.min(1, (dx * ca - dy * sa) / d)),
            Math.max(-1, Math.min(1, (dx * sa + dy * ca) / d)),
          ];
        }
      }
      cube(c, 0, 0, R, p.angle, motion ? time : 0, facing, {
        // The two expression channels the pose system computes. `lift` is the
        // falling scarf plus a little air-speed, so the character reads as
        // being pushed by the world it is moving through.
        eyes: poseAnim.eyes,
        lift: (poseAnim.fall?.scarfLift ?? 0) + Math.min(0.5, poseAnim.move.speed / MAX_SPEED) * 0.5,
        blink: motion ? blink : 1,
        breathe: motion ? breathe : 0,
        look,
        field,
      });
      if (poseAnim.sonic > 0.02) c.restore();
      c.restore();
      // ── THE FALL TRAIL ──────────────────────────────────────────────────
      //
      // The air the cube is falling THROUGH, which stays behind it. Drawn
      // before the body so it never covers the face, and pointed UPWARD --
      // opposite the travel -- because a trail that follows the object is a
      // motion blur, while a trail left in the air behind it is a plume.
      //
      // Only while genuinely plunging: fallFor() returns null below the drift
      // threshold, so a gentle drop gets nothing and the effect stays a readout.
      // Read the baked fall row rather than recomputing the vocabulary. Same
      // numbers, one index instead of a stack of pow/sin/exp.
      const fallRow = (() => {
        if (!motion) return null;
        const vy = Math.round(Math.max(0, world.player.velocity.y));
        if (vy > FALL_SAMPLES) return null;
        const o = vy * FALL_ROW.width;
        if (FALL_TABLE[o + FALL_ROW.k] < 0) return null;
        return {
          trail: FALL_TABLE[o + FALL_ROW.trail],
          cels: FALL_TABLE[o + FALL_ROW.cels],
          rush: FALL_TABLE[o + FALL_ROW.rush],
        };
      })();
      if (fallRow && fallRow.trail > 0.05) {
        const k = fallRow.trail,
          // How many cels this fall earns. A drift gets the single plume it
          // always had; a terminal dive gets four, which is the only thing that
          // separates the two on screen.
          cels = fallRow.cels,
          rush = fallRow.rush;
        c.save();
        c.translate(p.x, p.y);
        // THE CEL STACK. Each one is the same plume drawn shorter, dimmer and
        // higher up the trail, so the eye reads a body that has been through
        // here rather than a body with a smear behind it.
        for (let cel = cels - 1; cel >= 0; cel--) {
          const fade = 1 - cel / Math.max(1, cels),
            lift = cel * R * 1.5 * (0.5 + rush),
            scale = 1 - cel * 0.17;
          for (let i = 0; i < 3; i++) {
            const len = R * (1.6 + 2.4 * k) * (1 - i * 0.22) * scale,
              spread = R * 0.9 * (i - 1) * scale;
            c.globalAlpha = 0.16 * k * fade * (1 - i * 0.22);
            line(
              c,
              i === 1 ? INK.paper : INK.acid,
              Math.max(0.8, (2.4 - i * 0.6) / v.scale) * scale,
              spread,
              -R * 0.9 - lift,
              spread * 1.5,
              -R * 0.9 - lift - len,
            );
          }
        }
        // Speed hatching: short cross-strokes through the plume, only on a real
        // dive. This is the anime "the air is being torn" mark.
        if (rush > 0.15) {
          c.globalAlpha = 0.5 * rush;
          c.strokeStyle = INK.paper;
          for (let i = 0; i < 5; i++) {
            const y = -R * (1.4 + i * 1.5) * (0.5 + rush),
              w = R * (0.9 + 0.5 * rush) * (1 - i * 0.14);
            line(c, INK.paper, Math.max(0.6, 1.2 / v.scale), -w, y, w, y);
          }
        }
        c.globalAlpha = 1;
        c.restore();
      }
      // THE SWING. Drawn after the cube's own frame is popped, in world space,
      // so the arc is not clipped by the body rotation -- it is what the cube
      // is DOING, not part of the cube.
      if (motion && s.slashAge >= 0) slashArc(c, p.x, p.y, R, s.slashAge, s.slashAngle, 1 / v.scale);
      if (s.held || aim?.power) {
        const val = s.held ? s.focus : aim.power;
        arc(
          c,
          INK.acid,
          2.4 / v.scale,
          p.x,
          p.y,
          R + 12,
          -Math.PI * 0.94,
          -Math.PI * 0.94 + Math.PI * 0.88 * val,
        );
      }
    }
    // ── THE LANDING ─────────────────────────────────────────────────────────
    //
    // Measured before this: a landing changed the op count by ZERO. The squash
    // was applied as a silent scale and nothing was ever DRAWN for it, so the
    // single most physical moment in the game -- the cube hitting the floor --
    // read as the cube briefly being a different shape.
    //
    // Three marks, all world-space and all fading on `land.settle`:
    //   the ring   an expanding ellipse on the floor, the shock leaving
    //   the scuff  dust thrown sideways along the surface
    //   the crack  two short strokes where the body drove into the floor
    // `poseAnim` is scoped to the cube's own transform block, so the landing is
    // derived here from the same source of truth rather than reaching across.
    // `landFor` is a pure function of the age, so this cannot disagree with the
    // pose the body was drawn with.
    const landAnim = motion ? landFor(s.landAge) : null;
    if (landAnim && landAnim.shock > 0.02) {
      const L = landAnim,
        sh = L.shock,
        // The floor is always below the cube: a landing is a downward contact.
        fy = p.y + R * 0.9;
      c.save();
      // The ring. An ellipse, not a circle, because it is lying on a surface
      // seen from the side -- a circle reads as a bubble, an ellipse as a shock.
      const rw = R * (0.9 + 3.4 * (1 - L.settle)),
        rh = rw * 0.26;
      c.globalAlpha = 0.5 * sh;
      c.strokeStyle = INK.paper;
      c.lineWidth = Math.max(0.8, (3.2 * sh + 0.6) / v.scale);
      c.beginPath();
      c.ellipse(p.x, fy, rw, rh, 0, 0, Math.PI * 2);
      c.stroke();
      c.globalAlpha = 0.34 * sh;
      c.strokeStyle = INK.acid;
      c.lineWidth = Math.max(0.6, 1.4 / v.scale);
      c.beginPath();
      c.ellipse(p.x, fy, rw * 0.62, rh * 0.62, 0, 0, Math.PI * 2);
      c.stroke();
      // The scuff: dust thrown out along the floor, both ways, thinning fast.
      for (let i = 0; i < 4; i++) {
        const t = (i + 0.5) / 4,
          dir = i < 2 ? -1 : 1,
          out = R * (1.1 + 3.6 * (1 - L.settle) * (0.5 + t)),
          up = -R * 0.12 * (1 - t) * sh;
        c.globalAlpha = 0.42 * sh * (1 - t * 0.6);
        line(
          c,
          INK.quiet,
          Math.max(0.7, (1.8 - t) / v.scale),
          p.x + dir * R * 0.5,
          fy - up,
          p.x + dir * out,
          fy - up * 2.4,
        );
      }
      // The crack: two short strokes straight down from the contact, only on
      // the hardest part of the ring.
      if (sh > 0.35) {
        c.globalAlpha = 0.6 * sh;
        for (let i = -1; i <= 1; i += 2) {
          line(
            c,
            INK.paper,
            Math.max(0.7, 1.6 / v.scale),
            p.x + i * R * 0.34,
            fy,
            p.x + i * R * 0.5,
            fy + R * 0.5 * sh,
          );
        }
      }
      c.globalAlpha = 1;
      c.restore();
    }
    // The edge pips are SCREEN-SPACE, drawn after the cube's frame is popped.
    //
    // They used to be emitted inside the cube's translate/rotate block, using
    // p.x/p.y as if that were still screen space. Inside a rotated frame those
    // coordinates are wrong twice over -- the pips swung around the cube and,
    // when the cube was spinning from a slash or a bank, detached into a
    // vertical dark bar beside it. That bar is the "back line" artefact that
    // looked broken whenever the cube was dashing.
    c.restore();
    {
      const ux = 1 / v.scale,
        sp = toScreen(v, p);
      if (!s.opening?.free && s.phase !== 'ready')
        for (let i = 0; i < 3; i++) {
          const x = sp.x + (i - 1) * 9 * ux,
            y = sp.y + (R * Math.SQRT2 + 9) * ux;
          c.fillStyle = INK.black;
          c.fillRect(x - 4.6 * ux, y - ux, 9.2 * ux, 6 * ux);
          c.fillStyle = i < s.edge ? INK.acid : '#766978';
          c.fillRect(x - 3.5 * ux, y, 7 * ux, 3.6 * ux);
          if (i === s.edge) {
            c.fillStyle = INK.paper;
            c.fillRect(x - 3.5 * ux, y, (7 * ux * s.recharge) / 76, 3.6 * ux);
          }
        }
    }
    if ((s.phase === 'playing' || s.caught) && !s.opening?.finishing) pointer(c, v, p, nearest);
    if(s.warning>0 && s.phase==='playing'){
      // ── THE FLOOR'S APPROACH, WITHOUT THE RED LINE ──────────────────────
      //
      // This used to be a row of rose teeth: a red hazard band across the bottom
      // of the screen. It was the last thing in the game still wearing the Red
      // Line's costume -- a lethal stripe you must not cross -- and it is not
      // that any more. The bottom is a WALL, identical to the other three, and
      // touching it costs nothing but a bounce. So the readout is not a hazard
      // any more; it is a MEASUREMENT of how close the floor is.
      //
      // Drawn as a cool, receding rule with tick marks that compress as the
      // floor nears, plus a single amber pip that is the only thing that ever
      // warms. No red, no teeth, no "do not cross" -- the language of a gauge
      // rather than the language of a warning.
      c.save();
      const base = h - 20,
        k = clamp(s.warning, 0, 1),
        gap = 46 - 30 * k,          // ticks crowd together as it arrives
        len = 5 + 9 * k;            // and grow, so the change is legible
      c.globalAlpha = 0.22 + 0.5 * k;
      line(c, '#6f8fa3', 1, 0, base, w, base);
      for (let x = 8; x < w; x += gap) line(c, '#6f8fa3', 1, x, base, x, base - len);
      // The amber pip is the one warm mark, and only in the last stretch.
      if (k > 0.55) {
        c.globalAlpha = 0.35 + 0.5 * ((k - 0.55) / 0.45);
        line(c, INK.acid, 2, 0, base, w, base);
      }
      c.restore();
    }
    if (s.panic && s.panicTicks > 0 && s.phase === 'playing') {
      // ── AN OPPORTUNITY, NOT A HAZARD ────────────────────────────────────
      //
      // This was a RED arrow and a red closing ring: the exact visual grammar of
      // the Red Line -- red means a thing is about to kill you, act now. But the
      // panic beat is the opposite. It is a GRACE: the game is offering you a
      // half-second to redirect before a wall you cannot die on. Painting it as
      // a danger taught the wrong lesson, and it was the last red hazard mark
      // left in the renderer.
      //
      // It now wears the same cool family as the floor gauge, with the amber
      // edge that means "spend this" elsewhere in the HUD. Nothing about it says
      // danger; everything about it says the window is open.
      //
      // The injury flash (`stain`) stays red: that one IS damage, and it is
      // feedback about something that already happened rather than a warning
      // about something that will.
      c.save();
      c.translate(-v.x * v.scale, -v.y * v.scale);
      c.scale(v.scale, v.scale);
      // The grip opens fast and closes slow: urgent at the start of the
      // half-second, still readable when it runs out.
      const burn = clamp(s.panicTicks / ARC.slowTicks, 0, 1),
        pulse = 0.72 + 0.28 * Math.abs(Math.sin(s.panicTicks * 0.42)),
        dx = s.panic.x - p.x,
        dy = s.panic.y - p.y,
        far = Math.hypot(dx, dy) || 1,
        ang = Math.atan2(dy, dx),
        near = R * Math.SQRT2 + 20, // clear of the cube's three pip bars
        span = Math.min(58 + 26 * (1 - burn), far - near); // never past the surface
      if (span > 6) {
        c.save();
        c.translate(p.x + Math.cos(ang) * near, p.y + Math.sin(ang) * near);
        c.rotate(ang);
        c.globalAlpha = (0.5 + 0.45 * burn) * pulse;
        const wide = 8 + 5 * burn,
          tip = Math.max(0, span);
        poly(c, INK.cool, [
          [0, -wide],
          [tip * 0.72, -wide * 0.56],
          [tip, 0],
          [tip * 0.72, wide * 0.56],
          [0, wide],
        ]);
        // Two chevrons inside the wedge point the way out.
        c.globalAlpha = 0.55 + 0.45 * burn;
        for (let i = 0; i < 2; i++) {
          const at = tip * (0.42 + 0.3 * i),
            w = wide * (0.34 - 0.08 * i);
          poly(c, INK.paper, [
            [at - w, -w * 1.5],
            [at + w, 0],
            [at - w, w * 1.5],
            [at - w * 0.35, 0],
          ]);
        }
        c.restore();
      }
      // A ring that visibly closes on the cube, so the beat has a clock.
      c.save();
      c.globalAlpha = 0.32 + 0.5 * burn;
      arc(c, INK.paper, 2.2 / v.scale, p.x, p.y, R + 10 + 30 * (1 - burn));
      c.globalAlpha = 0.6 + 0.4 * burn;
      arc(c, INK.cool, 1.6 / v.scale, p.x, p.y, R + 6 + 52 * (1 - burn) ** 1.6);
      c.restore();
      c.restore();
    }
    if(scene) drawStory(c,{v,p,e:nearest&&{...pose(nearest,alpha),r:nearest.r},shot:run.suggestion(),scene,device,age:sceneTicks+alpha,motion,aim:!!aim?.power});
    if (stain > 0) {
      c.save();
      c.globalAlpha = stain * 0.7;
      c.strokeStyle = INK.rose;
      c.lineWidth = 10;
      c.strokeRect(0, 0, w, h);
      c.restore();
    }
  }
  return {
    reset,
    field(origin, side) {
      camera.reset(origin, side);
      lastView = camera.view(1);
      trail.length = 0;
    },
    event,
    tick,
    draw,
    title(t) {
      transform();
      back.title(w, h, t);
    },

    worldPoint(x, y) {
      const v = lastView;
      return { x: v.x + x / v.scale, y: v.y + y / v.scale };
    },
    get revision() {
      return revision;
    },
    get animationState() {
      return anim;
    },
    dispose() {
      ro.disconnect();
    },
  };
}
