import { createCamera, frameRun, inView, toScreen } from './camera.js';
import { createBackdrop } from './atmosphere.js';
import { arc, blade, cube, disk, foe, line, cutHalf, nick, shearInk, poly, trace } from './art.js';
import { INK, TYPES, TAU, CUBE, pose, bodyPose, bisect, mix } from './shapes.js';
import { PAD, SPAWN, PLAYER_SIZE, clamp, randomSource, openingFacing } from './levels.js';
import { sightPicture } from './guide.js';
import { ARC, predictAim, speedRgb } from './aim.js';
import { elongate, squashed, wave } from './impact.js';
import { MOTION, createShake, stretchFor, animationState, fade, appear, ANIM } from './motion.js';
import {sceneFor,drawStory} from './storyboard.js';
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
function tide(c, v, y, t) {
  if (y > v.y + v.h + 60) return;
  const l = v.x - 4,
    r = v.x + v.w + 4;
  c.fillStyle = '#74253f';
  c.fillRect(l, y, r - l, Math.max(0, v.y + v.h - y + 12));
  c.fillStyle = INK.rose;
  c.fillRect(l, y, r - l, 4);
  const off = Math.floor(l / 40) * 40;
  for (let x = off; x < r; x += 40)
    poly(c, '#40192d', [
      [x, y + 7],
      [x + 20, y + 7],
      [x + 8, y + 22],
      [x - 12, y + 22],
    ]);
  c.font = 'bold 13px Mono,monospace';
  c.fillStyle = '#ff9aa9';
  c.textAlign = 'center';
  c.fillText('R E D L I N E', v.x + v.w * 0.5, y + 42);
}
function streak(c, trail, p, live) {
  if (trail.length < 3) return;
  // A decaying ribbon of afterimages: each older sample is thinner, dimmer and
  // shifted further toward the cold end of the speed ramp. A single flat
  // polygon read as one solid smear at terminal speed.
  for (let i = 1; i < trail.length; i++) {
    const q = i === trail.length - 1 ? p : trail[i],
      prev = trail[i - 1],
      dx = q.x - prev.x,
      dy = q.y - prev.y,
      n = Math.hypot(dx, dy) || 1,
      u = i / (trail.length - 1),
      half = (live ? 14 : 6) * u ** 1.3,
      col = speedRgb(0.18 + 0.82 * u ** 1.6);
    if (half < 0.7) continue;
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
  function tick(run, motion) {
    const { state: s, world } = run;
    syncScene(run,s.story?run.nearest():null);
    if(scene)sceneTicks++;
    frameRun(camera,run,motion);
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
    if (motion && s.phase === 'playing' && dt) {
      trail.push({ ...world.player.position });
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
  function draw(run, alpha, aim, motion, device='mouse') {
    transform();
    const { world, state: s, combat } = run,
      v = (lastView = camera.view(alpha)),
      p = bodyPose(world.player, alpha),
      nearest = run.nearest(),
      time = mix(world.previousClock, world.clock, alpha);
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
      tide(c, v, mix(s.oldLine, s.line, alpha), time);
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
      // Motion streaks, as geometry: a genuinely fast cube is pulled along its
      // own travel and thinned across it, so the eye tracks a line instead of
      // a flickering square. Airborne only — a resting cube gets no stretch.
      if (motion && !world.grounded) {
        const vx = world.player.velocity.x,
          vy = world.player.velocity.y,
          speed = Math.hypot(vx, vy),
          e = stretchFor(speed);
        if (e.along > 1.001) {
          const along = Math.atan2(vy, vx);
          c.rotate(along);
          c.scale(e.along, e.across);
          c.rotate(-along);
        }
      }
      // Contact squash: compress along the surface normal, swell along the
      // tangent, and ring back through a damped spring. Only a real contact
      // recorded by the physics step can start one.
      if (motion && s.impact) {
        const q = squashed(s.impact.speed ?? 0, s.impact.nx, s.impact.ny, s.impactAge);
        if (q) {
          c.rotate(q.axis - p.angle);
          c.scale(q.along, q.across);
          c.rotate(p.angle - q.axis);
        }
      }
      if (nearest && (s.phase === 'ready' || s.opening?.rest)) {
        const toward =
          (nearest.x - p.x) * Math.cos(p.angle) + (nearest.y - p.y) * Math.sin(p.angle);
        facing = Math.sign(toward) || facing;
      }
      // Real motion blur, as a short smear of the cube's own silhouette
      // dragged along its travel. This is the ONE thing in the frame that is
      // allowed to blur: the player owns this motion, so it reads as their
      // speed. Enemies below are never blurred (see MOTION.enemyBlur).
      if (motion && !world.grounded) {
        const vx = world.player.velocity.x,
          vy = world.player.velocity.y,
          speed = Math.hypot(vx, vy),
          smear = stretchFor(speed).blur;
        if (smear > 1) {
          const along = Math.atan2(vy, vx),
            steps = smear > 12 ? 3 : 2;
          c.save();
          c.rotate(along - p.angle);
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
      cube(c, 0, 0, R, p.angle, motion ? time : 0, facing);
      c.restore();
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
      const ux = 1 / v.scale;
      if (!s.opening?.free && s.phase !== 'ready')
        for (let i = 0; i < 3; i++) {
          const x = p.x + (i - 1) * 9 * ux,
            y = p.y + R * Math.SQRT2 + 9 * ux;
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
    c.restore();
    if ((s.phase === 'playing' || s.caught) && !s.opening?.finishing) pointer(c, v, p, nearest);
    if(s.warning>0 && s.phase==='playing'){
      // The tide's own teeth, a fixed 20 px inside the bottom edge, so the
      // hazard is legible before the world line reaches this viewport.
      c.save();c.globalAlpha=.32+s.warning*.58;
      const base=h-20,h0=4+s.warning*8;
      for(let x=-14;x<w;x+=28)poly(c,INK.rose,[[x,base],[x+8,base-h0],[x+21,base-h0],[x+13,base]]);
      c.restore();
    }
    if (s.panic && s.panicTicks > 0 && s.phase === 'playing') {
      // Red directional warning between the cube and the imminent surface,
      // plus a contracting ring around it: press to aim away. World-space.
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
        poly(c, INK.rose, [
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
      arc(c, INK.rose, 1.6 / v.scale, p.x, p.y, R + 6 + 52 * (1 - burn) ** 1.6);
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
