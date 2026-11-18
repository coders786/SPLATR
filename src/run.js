import {
  createPhysics,
  stopPlayer,
  stepPhysics,
  launch,
  setBulletTime,
  destroyPhysics,
  MAX_SPEED,
  RELEASE_GRAVITY,
} from './physics.js';
import { SPAWN, PAD, createStream, bandAt, district, clamp } from './levels.js';
import { createCombat } from './slasher.js';
import { TYPES } from './shapes.js';
import { createOpening } from './opening.js';
import { beginStroke, printKill, impactFor, SHEAR } from './stroke.js';

export const MAX_EDGE = 3,
  CHAIN_TIME = 144,
  DRIVE_REACH = 1.38;
export function ballisticAim(from, to, speed) {
  const dx = to.x - from.x,
    dy = to.y - from.y,
    d2 = dx * dx + dy * dy,
    b = speed * speed + RELEASE_GRAVITY * dy,
    disc = b * b - RELEASE_GRAVITY ** 2 * d2;
  if (d2 < 1 || disc < 0 || b <= 0) return null;
  const t = Math.sqrt((2 * d2) / (b + Math.sqrt(disc)));
  return { x: dx / t, y: dy / t - 0.5 * RELEASE_GRAVITY * t, power: speed / MAX_SPEED };
}
export function createRun(
  seed,
  emit = () => {},
  { warmup = false, staged = warmup } = {},
) {
  // Stream the normal neighbourhood, but keep its other bodies off the
  // Hold the rest of the stream until the first live Fang is cut (or the
  // player leaves it). A strong launch gets one short decision beat after it
  // crosses empty sky. That is not a phantom hit: no score, freeze or refund.
  let solo = staged,
    glideAt = Infinity;
  const waiting = [];
  const world = createPhysics({ seed, spawn: SPAWN, pad: PAD }),
    origin = { ...SPAWN },
    combat = createCombat(world, (e) => emit('tell', e)),
    place = (spec) => combat.add({ ...spec, x: spec.x + origin.x, y: spec.y + origin.y }),
    stream = createStream(
      seed,
      (spec) => (solo && !spec.sentry ? waiting.push(spec) : place(spec)),
      combat.leave,
      staged,
    ),
    lesson = warmup ? createOpening(seed,world,combat) : null;
  const s = {
    phase: 'ready',
    opening: lesson?.state ?? null,
    staged,
    net: false,
    caught: false,
    reach: 1,
    breath:0,
    story:warmup,
    firstAir:false,
    warning:0,
    swingStart: 0,
    seed: seed >>> 0,
    hp: 3,
    score: 0,
    kills: 0,
    chain: 0,
    maxChain: 0,
    chainTime: 0,
    shots: 0,
    blade: 0,
    parry: 0,
    edge: 3,
    recharge: 0,
    focus: 1,
    held: false,
    depleted: false,
    invul: 0,
    stop: 0,
    drive: 0,
    elapsed: 0,
    peak: 0,
    band: 1,
    line: 650,
    oldLine: 650,
    death: 0,
    cause: '',
    previousSlash: -0.65,
    slashAngle: -0.65,
    stroke: null,
    bestStroke: null,
    throughcuts: 0,
  };
  if (!lesson) stream.sync(SPAWN, s.line);
  function nearest() {
    const p = world.player.position;
    let best = null,
      rank = Infinity;
    for (const e of combat.enemies.values()) {
      if (!s.opening && (e.y > s.line - 50 || (s.caught && e.y > p.y - 70))) continue;
      const dx = e.x - p.x,
        dy = e.y - p.y,
        d = Math.hypot(dx, dy) + (dy > 65 ? 560 + dy : 0);
      if (d < rank) {
        best = e;
        rank = d;
      }
    }
    return best;
  }
  function solution(to, speed) {
    const p = world.player.position,
      lead = clamp(Math.hypot(to.x - p.x, to.y - p.y) / speed, 0, 11),
      q = { x: to.x + (to.vx || 0) * lead, y: to.y + (to.vy || 0) * lead };
    const v = ballisticAim(p, q, speed);
    if (v) return v;
    const a = Math.atan2(q.y - p.y - 40, q.x - p.x);
    return { x: Math.cos(a) * speed, y: Math.sin(a) * speed, power: speed / MAX_SPEED };
  }
  function suggestion() {
    return solution(
      nearest() || { x: world.player.position.x + 90, y: world.player.position.y - 240 },
      31.7,
    );
  }
  function aimAt(q, assist = true) {
    let to = q,
      best = 82;
    if (assist)
      for (const e of combat.enemies.values()) {
        const d = Math.hypot(e.x - q.x, e.y - q.y);
        if (d < best) {
          to = e;
          best = d;
        }
      }
    return { ...solution(to, 31.7), target: to.id };
  }
  function adjust(v, assist = true) {
    if (!v?.power) return v;
    const speed = Math.hypot(v.x, v.y);
    if (s.phase === 'ready' && v.y > -speed * 0.13) {
      const y = -Math.max(Math.abs(v.y), speed * 0.22);
      v = { ...v, x: Math.sign(v.x) * Math.sqrt(Math.max(0, speed * speed - y * y)), y };
    }
    if (!assist) return v;
    let best = v,
      cos = 0.9945;
    const p = world.player.position;
    for (const e of combat.enemies.values()) {
      if (Math.hypot(e.x - p.x, e.y - p.y) > 740) continue;
      const a = solution(e, speed),
        dot = (a.x * v.x + a.y * v.y) / (speed * speed);
      if (dot > cos) {
        cos = dot;
        best = { ...a, target: e.id };
      }
    }
    return best;
  }
  function focus(on) {
    s.held =
      !!on &&
      !s.opening?.rest &&
      !s.opening?.returning &&
      !s.opening?.finishing &&
      s.phase === 'playing' &&
      !world.grounded;
    if (!on) s.depleted = false;
    setBulletTime(world, s.held && !s.depleted && s.focus > 0.01, !on);
  }
  function dash(v) {
    if (
      !['ready', 'playing'].includes(s.phase) ||
      !v ||
      (s.opening && !s.opening.rest) ||
      (!s.opening?.free && s.edge <= 0) ||
      !launch(world, v)
    )
      return false;
    s.phase = 'playing';
    s.caught = false;
    s.held = s.depleted = false;
    s.shots++;
    s.breath = 0;
    s.firstAir = false;
    s.warning = 0;
    glideAt = !s.opening && Math.hypot(v.x, v.y) > 22 ? world.clock + 13 : Infinity;
    s.parry = 10;
    if (!s.opening?.free) s.edge--;
    if (s.opening) lesson.launch();
    s.reach = s.opening?.reach ?? (s.drive > 0 ? DRIVE_REACH : 1);
    s.swingStart = world.clock;
    s.blade = 16 + 15 * Math.min(1, Math.hypot(v.x, v.y) / MAX_SPEED);
    s.previousSlash = s.slashAngle = Math.atan2(v.y, v.x);
    s.stroke = beginStroke(world.player.position, s.slashAngle, s.shots);
    emit('dash', {
      ...world.player.position,
      angle: s.slashAngle,
      power: Math.min(1, Math.hypot(v.x, v.y) / MAX_SPEED),
    });
    return true;
  }
  function end(cause) {
    if (s.phase !== 'playing') return;
    s.cause = cause;
    s.phase = 'dying';
    focus(false);
    s.death = 27;
    s.hp = 0;
    s.stop = 0;
    s.blade = 0;
    emit('break', { ...world.player.position, angle: world.player.angle });
  }
  function hurt(cause) {
    if (s.opening || s.phase !== 'playing' || s.invul > 0) return false;
    s.hp--;
    s.invul = 92;
    s.chain = s.chainTime = s.drive = s.blade = s.parry = s.breath = 0;
    s.edge = Math.max(1, s.edge);
    s.stop = Math.max(s.stop, 3);
    if (s.hp <= 0) end(cause);
    else emit('hurt', { ...world.player.position, cause });
    return true;
  }
  function cut(e, fromShear = false) {
    if (e.lastSlash === s.shots) return;
    e.lastSlash = s.shots;
    glideAt = Infinity;
    const hpBefore = e.hp;
    e.hp -= s.drive > 0 ? 3 : fromShear ? SHEAR.damage : 1;
    e.flash = 16;
    s.swingStart = world.clock;
    if (s.opening) lesson.hit(e.hp > 0);
    if (e.hp > 0) {
      if (!s.opening)s.breath=Math.max(s.breath,48);
      s.stop = Math.max(e.pinned ? 5 : 2, s.stop);
      e.fault = s.slashAngle - e.angle;
      emit('armor', { x: e.x, y: e.y, r: e.r, cut: s.slashAngle, hp: e.hp, kind: e.kind });
      return;
    }
    combat.remove(e);
    stream.mark(e);
    s.kills++;
    s.chain = s.chainTime > 0 ? s.chain + 1 : 1;
    s.maxChain = Math.max(s.maxChain, s.chain);
    s.chainTime = CHAIN_TIME;
    if (s.chain % 6 === 0) {
      const fresh = s.drive <= 0;
      s.drive = 175;
      if (fresh) emit('drive', {});
    }
    const mult = Math.min(8, s.chain) * (s.drive > 0 ? 2 : 1),
      base = (e.small ? 45 : TYPES[e.kind].points) * mult,
      stroke = s.stroke,
      { points, release } = printKill(stroke, e, base, fromShear, s.slashAngle, hpBefore);
    // A small kill is still an impact: a short beat, never a free full
    // launch. A full-size kill buys a real choice, longer on the first one.
    if (!s.opening && !fromShear && e.small) s.breath = Math.max(s.breath, 42);
    if (!s.opening && !e.small && !fromShear) {
      if (e.sentry && s.story) s.firstAir = true;
      s.breath = s.firstAir ? 124 : s.band < 3 ? 64 : 52;
    }
    if (!s.bestStroke || stroke.points > s.bestStroke.points) s.bestStroke = stroke;
    s.score += points;
    s.edge = Math.min(MAX_EDGE, s.edge + 1);
    s.focus = 1;
    s.blade = Math.min(38, s.blade + 7);
    const impact = impactFor(e.kind, e.small, release, e.paper);
    s.stop = Math.max(s.stop, impact.stop);
    emit('cut', {
      x: e.x,
      y: e.y,
      angle: e.angle,
      r: e.r,
      kind: e.kind,
      cut: s.slashAngle,
      hpBefore,
      fault: e.fault,
      small: !!e.small,
      paper: !!e.paper,
      impact,
      release,
      fromShear,
      throughcut: stroke.released,
      strokePoints: stroke.points,
      strokeKills: stroke.kills,
      points,
      chain: s.chain,
    });
    if (release) {
      s.throughcuts++;
      const dx = Math.cos(s.slashAngle),
        dy = Math.sin(s.slashAngle),
        end = { x: e.x + dx * SHEAR.reach, y: e.y + dy * SHEAR.reach };
      stroke.shear = { x: e.x, y: e.y, end, angle: s.slashAngle };
      emit('shear', stroke.shear);
      // Snapshot the victims before spawning children. A wave never spawns a
      // second wave or hits a surviving plate twice on the same launch.
      for (const victim of combat.forwardHits(e, end, SHEAR.width)) cut(victim, true);
    }
    if (e.kind === 'fork') combat.kids(e);
    if (e.kind === 'crown' && s.hp < 3) {
      s.hp++;
      emit('repair', {});
    }
  }
  function freezePoses() {
    s.previousSlash = s.slashAngle;
    world.previousClock = world.clock;
    const b = world.player;
    Object.assign(b.plugin.previous, b.position, { angle: b.angle });
    for (const e of combat.enemies.values()) {
      e.px = e.x;
      e.py = e.y;
      e.pa = e.angle;
    }
    for (const h of combat.hazards) {
      h.px = h.x;
      h.py = h.y;
      h.previousRadius = h.radius;
    }
    s.oldLine = s.line;
  }
  function recharge(dt) {
    if (s.edge < MAX_EDGE) {
      s.recharge += dt;
      if (s.recharge >= 76) {
        s.edge++;
        s.recharge = 0;
      }
    } else s.recharge = 0;
  }
  function enterField(cleared) {
    if (!s.opening || (!cleared && s.opening.finishing) || !['ready', 'playing'].includes(s.phase))
      return false;
    for (const e of combat.enemies.values()) combat.remove(e);
    s.opening = null;
    s.net = cleared;
    s.story=cleared;
    focus(false);
    stopPlayer(world);
    freezePoses();
    Object.assign(origin, world.player.position);
    s.line = s.oldLine = origin.y + 650;
    s.peak = 0;
    s.reach = s.drive > 0 ? DRIVE_REACH : 1;
    s.edge = MAX_EDGE;
    s.recharge = 0;
    s.focus = 1;
    s.blade = s.parry = s.stop = 0;
    // Let the player actually see the first live opponent before the tide
    // starts. Keep the score, including the Overdrive they may just have earned.
    s.phase = 'ready';
    stream.sync(SPAWN, s.line - origin.y);
    emit('field', { cleared });
    return true;
  }
  function tick() {
    if (s.phase === 'ready' || s.phase === 'over') return;
    if (s.phase === 'dying') {
      freezePoses();
      if (--s.death === 0) {
        s.phase = 'over';
        emit('over', {});
      }
      return;
    }
    s.elapsed++;
    if (s.stop > 0) {
      s.stop--;
      freezePoses();
      return;
    }
    if (s.opening?.finishing) {
      freezePoses();
      if (!--s.opening.finishing) enterField(true);
      return;
    }
    if (s.opening && lesson.parkedTick(s)) {
      recharge(1);
      return;
    }
    if (s.held && !s.depleted) {
      s.focus = Math.max(0, s.focus - 1 / 165);
      if (s.focus < 0.0001) {
        s.depleted = true;
        setBulletTime(world, false);
      }
    } else if (!s.held) s.focus = Math.min(1, s.focus + 1 / 250);
    // One beat to choose the next line. A new launch is always immediate.
    if (world.clock >= glideAt) {
      glideAt = Infinity;
      // Also leave a short beat after crossing empty space. No phantom
      // impact, refund or freeze for missing the target.
      if (!world.grounded) s.breath = 42;
    }
    // The lethal stripe should not first enter view a tenth of a second
    // before impact. Telegraph a descent and give it a readable final beat.
    const gap=s.line-world.player.position.y;
    s.warning = s.opening
      ? 0
      : clamp((840 - gap) / 220, 0, 1) * clamp((world.player.velocity.y - 3) / 11, 0, 1);
    const pace=Math.min(1-.64*s.warning, s.breath ? .24+.76*Math.max(0,1-s.breath/12) : 1);
    if(s.breath) s.breath--;
    stepPhysics(world, (dt) => combat.move(dt, s.band),pace);
    const dt = world.engine.timing.timeScale;
    s.previousSlash = s.slashAngle;
    if (!s.opening) s.reach = s.drive > 0 ? DRIVE_REACH : 1;
    if (s.blade > 0) {
      s.slashAngle = Math.atan2(world.player.velocity.y, world.player.velocity.x);
      combat.sweepBlade(s.slashAngle, s.reach);
    }
    for (const e of combat.contacts) {
      if (!combat.enemies.has(e.id) || s.phase !== 'playing') continue;
      if (s.blade > 0) cut(e);
      else hurt(TYPES[e.kind].name);
    }
    combat.contacts.clear();
    combat.attacks(dt, (h) => {
      const facing = h.kind === 'needle' && Math.cos(s.slashAngle - h.angle) < -0.2;
      if (s.blade <= 0 || !(facing || s.parry > 0))
        hurt(h.kind === 'ring' ? 'Pulse wave' : `${TYPES[h.source].name} needle`);
      else if (h.kind === 'needle') emit('parry', { x: h.x, y: h.y, angle: h.angle });
    });
    combat.linkAttacks(stream.live, dt, () => {
      if (s.parry <= 0) hurt('Prism link');
    });
    if (s.phase !== 'playing') return;
    s.blade = Math.max(0, s.blade - dt);
    s.parry = Math.max(0, s.parry - dt);
    s.invul = Math.max(0, s.invul - dt);
    s.drive = Math.max(0, s.drive - dt);
    recharge(world.focusScale);
    if (s.opening) {
      if (lesson.advance(s, dt)) emit('racksCleared', {});
      return;
    }
    if (
      solo &&
      (!combat.enemies.has('0:0/0') ||
        Math.hypot(world.player.position.x - origin.x, world.player.position.y - origin.y) > 410)
    ) {
      solo = false;
      for (const spec of waiting) if (stream.live.has(spec.home)) place(spec);
      waiting.length = 0;
      emit('leaveLane', {});
    }
    s.chainTime = Math.max(0, s.chainTime - dt);
    if (!s.chainTime) s.chain = 0;
    const p = world.player.position;
    s.peak = Math.max(s.peak, origin.y - p.y);
    s.oldLine = s.line;
    s.line = Math.min(s.line - dt * (0.38 + Math.min(6, s.band) * 0.07), origin.y - s.peak + 1180);
    // One safety net after a cleared cutting room. Catch before the lethal
    // line, with enough headroom to see it. This is a resting place, not a
    // fresh run: spent enemies stay dead and points don't get paid twice.
    if (s.net && p.y + 112 >= s.line && world.player.velocity.y >= 0) {
      s.net = false;
      s.caught = true;
      s.phase = 'ready';
      focus(false);
      stopPlayer(world);
      freezePoses();
      s.edge = MAX_EDGE;
      s.stop = s.recharge = s.blade = s.parry = s.breath = 0;
      s.firstAir = false;
      glideAt = Infinity;
      s.warning = 0;
      emit('catch', {});
      return;
    }
    if (p.y + 18 >= s.line) {
      end('Redline');
      return;
    }
    stream.sync({ x: p.x - origin.x, y: p.y - origin.y }, s.line - origin.y);
    const band = bandAt(-s.peak);
    if (band > s.band) {
      s.band = band;
      s.edge = 3;
      s.focus = 1;
      emit('sector', { band, name: district(seed, band) });
      if (band % 3 === 0) {
        for (const e of combat.enemies.values()) if (e.kind === 'crown') combat.remove(e);
        combat.add({
          kind: 'crown',
          ...combat.crownPost(p,band%2?1:-1),
          id: `crown-${band}`,
          home: 'hunter',
          slot: -1,
          phase: 0,
          delay: 65,
        });
      }
    }
  }
  function retire() {
    if (!['ready', 'playing'].includes(s.phase)) return;
    s.phase = 'over';
    s.cause = 'Retired';
    focus(false);
    emit('over', {});
  }
  return {
    world,
    combat,
    stream,
    state: s,
    tick,
    dash,
    hurt,
    focus,
    adjust,
    aimAt,
    nearest,
    suggestion,
    skipOpening: () => enterField(false),
    retire,
    dispose() {
      combat.dispose();
      destroyPhysics(world);
    },
  };
}
