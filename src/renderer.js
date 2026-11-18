import { createCamera, frameRun, inView, toScreen } from './camera.js';
import { createBackdrop } from './atmosphere.js';
import { arc, blade, cube, disk, foe, line, cutHalf, nick, shearInk, poly, trace } from './art.js';
import { INK, TYPES, TAU, CUBE, pose, bodyPose, bisect, mix } from './shapes.js';
import { PAD, SPAWN, PLAYER_SIZE, clamp, randomSource, openingFacing } from './levels.js';
import { sightPicture } from './guide.js';
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
function drawGuide(c, run, p, v, alpha, scale, hint) {
  const { path, pair } = sightPicture(
    p,
    v,
    run.world.geometry,
    run.combat.enemies.values(),
    run.state.drive > 0 ? 3 : 1,
  );
  c.save();
  // Don't carry an idle guide past the second contact. In focus the full
  // dotted parabola is useful for choosing an escape instead of the pair.
  let count = hint
    ? Math.min(
        path.length,
        pair.length ? Math.ceil(Math.hypot(pair[1].e.x - p.x, pair[1].e.y - p.y) / 20) : 10,
      )
    : path.length;
  if(run.state.opening?.row===2){
    const shell=run.nearest(),i=shell?path.findIndex(q=>Math.hypot(q.x-shell.x,q.y-shell.y)<shell.r+10):-1;
    if(i>=0)count=Math.min(count,i);
  }
  for (let i = 0; i < count; i++) {
    c.globalAlpha = (hint ? 0.65 : 0.92) * (1 - i / 62);
    disk(c, INK.acid, path[i].x, path[i].y, 3.4 - i * 0.046);
  }
  c.globalAlpha = 1;
  pair.forEach(({ e, angle }, i) => {
    const q = pose(e, alpha);
    nick(c, q.x, q.y, e.r, angle, i + 1, scale);
  });
  c.restore();
  return pair;
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
  const a = [],
    b = [];
  for (let i = 0; i < trail.length; i++) {
    const q = i === trail.length - 1 ? p : trail[i],
      prev = trail[Math.max(0, i - 1)],
      dx = q.x - prev.x,
      dy = q.y - prev.y,
      n = Math.hypot(dx, dy) || 1,
      half = (live ? 14 : 6) * (i / (trail.length - 1)) ** 1.3;
    a.push([q.x - (half * dy) / n, q.y + (half * dx) / n]);
    b.push([q.x + (half * dy) / n, q.y - (half * dx) / n]);
  }
  c.save();
  c.globalAlpha = live ? 0.75 : 0.28;
  poly(c, live ? INK.acid : '#d0c6d6', [...a, ...b.reverse()]);
  c.restore();
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
    kick = 0,
    bearing = 0,
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
    kick = stain = 0;
    trail.length = shards.length = imprints.length = sparks.length = 0;
  }
  function event(type, d, motion) {
    if (type === 'armor' && motion && kick < 2.1) {
      kick = 2.1;
      bearing = d.cut;
    }
    if (type === 'armor' || (type === 'cut' && !d.small && !d.fromShear)) {
      imprints.push({ ...d, type, life: type === 'armor' ? 16 : 9 });
      if (imprints.length > 8) imprints.shift();
    }
    if (type === 'shear' || type === 'parry') {
      imprints.push({ ...d, type, life: type === 'shear' ? 18 : 13 });
      if (imprints.length > 8) imprints.shift();
      return;
    }
    const recoil = (force, angle) => {
      if (motion && force > kick) {
        kick = force;
        bearing = angle;
      }
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
    if (shards.length > 32) shards.splice(0, shards.length - 32);
    if (sparks.length > 36) sparks.splice(0, sparks.length - 36);
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
    const dt = s.phase === 'dying' ? 1 : s.stop ? 0 : world.engine.timing.timeScale;
    kick = Math.max(0, kick - 0.48);
    const b = world.player,
      forward = b.velocity.x * Math.cos(b.angle) + b.velocity.y * Math.sin(b.angle);
    if (s.phase === 'playing' && Math.abs(forward) > 3) facing = Math.sign(forward);
    stain = Math.max(0, stain - 0.045);
    if (motion && s.phase === 'playing' && dt) {
      trail.push({ ...world.player.position });
      if (trail.length > 14) trail.shift();
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
    c.save();
    if (motion && kick > 0) c.translate(-Math.cos(bearing) * kick, -Math.sin(bearing) * kick);
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
        c.globalAlpha = clamp(e.life / 14, 0, 1);
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
          c.globalAlpha = clamp(e.life / 10, 0, 1);
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
      c.globalAlpha = clamp(m.life / 9, 0, 1);
      if (m.type === 'cut' || m.type === 'armor') contactInk(c, m, clamp(m.life / 6, 0, 1), motion);
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
      const pair = drawGuide(
        c,
        run,
        p,
        aim?.power ? aim : run.suggestion(),
        alpha,
        v.scale,
        !aim?.power,
      );
      if (
        aim?.target &&
        !pair.some((n) => n.e.id === aim.target) &&
        combat.enemies.has(aim.target)
      ) {
        const e = combat.enemies.get(aim.target),
          q = pose(e, alpha);
        for (let i = 0; i < 2; i++)
          arc(c, INK.acid, 2 / v.scale, q.x, q.y, e.r + 6, -0.44 + i * Math.PI, 0.44 + i * Math.PI);
      }
    }
    for (const e of combat.enemies.values()) {
      if (!inView(v, e, 100)) continue;
      const q = pose(e, alpha);
      foe(c, e.kind, q.x, q.y, e.r, q.angle, {
        hp: e.hp,
        paper: e.paper,
        flash: e.flash > 13,
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
            clamp(1 - (time - s.swingStart) / 8, 0, 1),
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
      if (motion && s.blade > 0) {
        const snap = 0.105 * clamp(1 - (time - s.swingStart) / 6, 0, 1);
        c.rotate(s.slashAngle);
        c.scale(1 + snap, 1 - snap * 0.72);
        c.rotate(-s.slashAngle);
      }
      if (nearest && (s.phase === 'ready' || s.opening?.rest)) {
        const toward =
          (nearest.x - p.x) * Math.cos(p.angle) + (nearest.y - p.y) * Math.sin(p.angle);
        facing = Math.sign(toward) || facing;
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
    dispose() {
      ro.disconnect();
    },
  };
}
