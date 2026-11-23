import {safeSpawn,inViewport} from './spawn-space.js';
import Matter from 'matter-js';
import { TYPES, TAU } from './shapes.js';
import { clamp, PLAYER_SIZE, ARENA as DEFAULT_ARENA } from './levels.js';
import {enemyAttackZone} from './art/splatr-art-engine.js';
const { Bodies, Body, Composite, Events, Vertices } = Matter;
const E_OPTIONS = {
  isSensor: true,
  isStatic: true,
  label: 'hostile',
  collisionFilter: { category: 2, mask: 1 },
};

function sensor(e) {
  const t = TYPES[e.kind],
    vs = t.outline.map(([x, y]) => ({ x: x * e.r, y: y * e.r }));
  if (!t.concave) return Bodies.fromVertices(e.x, e.y, vs, E_OPTIONS);
  // A star / cross is NOT its convex hull. A fan of convex sensor pieces
  // preserves its notches; the parent is removed/scored once, not per piece.
  const parts = vs.map((v, i) => {
    const tri = [{ x: 0, y: 0 }, v, vs[(i + 1) % vs.length]],
      m = Vertices.centre(tri);
    return Bodies.fromVertices(e.x + m.x, e.y + m.y, tri, E_OPTIONS);
  });
  return Body.create({ ...E_OPTIONS, parts });
}
// Closest point on a relative sweep, also used against fast needles.
export function closest(ax, ay, bx, by) {
  const dx = bx - ax,
    dy = by - ay,
    t = clamp(-(ax * dx + ay * dy) / (dx * dx + dy * dy || 1), 0, 1);
  return Math.hypot(ax + t * dx, ay + t * dy);
}
export function hazardHits(h, p, prev) {
  const ax = prev.x - h.px,
    ay = prev.y - h.py,
    bx = p.x - h.x,
    by = p.y - h.y,
    r = PLAYER_SIZE * 0.44;
  if (h.kind === 'needle') return closest(ax, ay, bx, by) <= r + 5;
  if (h.kind === 'zone') return zoneHits(h.zone,p,prev,r);
  // Moving circle versus expanding annulus. Check both sides of the wave;
  // being inside a pulse that has ALREADY passed is safe.
  const pad = r + 3,
    r0 = h.previousRadius,
    dr = h.radius - r0;
  if (Math.hypot(ax, ay) < r0 - pad && Math.hypot(bx, by) < h.radius - pad) return false;
  // Test the outer radius at the SAME time as the swept player, not just at
  // the end: a cube already outside and outrunning a wave must stay safe.
  const u = bx - ax,
    v = by - ay,
    s = r0 + pad,
    aa = u * u + v * v - dr * dr,
    bb = 2 * (ax * u + ay * v - s * dr),
    cc = ax * ax + ay * ay - s * s;
  const t = aa > 0 ? clamp(-bb / (2 * aa), 0, 1) : aa + bb < 0 ? 1 : 0;
  return (aa * t + bb) * t + cc <= 0;
}
// Minimum distance between two closed 2D segments, including a crossing
// that occurs strictly between the player's previous and current positions.
export function sweepDistance(a, b, c, d) {
  const u = b.x - a.x,
    v = b.y - a.y,
    w = d.x - c.x,
    z = d.y - c.y,
    k = u * z - v * w;
  if (k) {
    const dx = c.x - a.x,
      dy = c.y - a.y,
      t = (dx * z - dy * w) / k,
      s = (dx * v - dy * u) / k;
    if (t >= 0 && t <= 1 && s >= 0 && s <= 1) return 0;
  }
  return Math.min(
    closest(a.x - c.x, a.y - c.y, b.x - c.x, b.y - c.y),
    closest(a.x - d.x, a.y - d.y, b.x - d.x, b.y - d.y),
    closest(c.x - a.x, c.y - a.y, d.x - a.x, d.y - a.y),
    closest(c.x - b.x, c.y - b.y, d.x - b.x, d.y - b.y),
  );
}
/** Swept cube center against the exact warned zone, expanded by cube radius. */
export function zoneHits(zone,p,prev,pad=PLAYER_SIZE*.44){
 if(!zone)return false;
 if(zone.radius&&closest(prev.x-zone.x,prev.y-zone.y,p.x-zone.x,p.y-zone.y)<=zone.radius+pad)return true;
 const inside=(q,poly)=>{let yes=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++){
  const a=poly[i],b=poly[j];if((a.y>q.y)!==(b.y>q.y)&&q.x<(b.x-a.x)*(q.y-a.y)/(b.y-a.y)+a.x)yes=!yes;
 }return yes;};
 for(const poly of zone.polygons||[]){
  if(inside(p,poly)||inside(prev,poly))return true;
  for(let i=0;i<poly.length;i++)if(sweepDistance(prev,p,poly[i],poly[(i+1)%poly.length])<=pad)return true;
 }
 return false;
}
export function createCombat(world, tell = () => {}) {
  const ARENA=world.arena||DEFAULT_ARENA;
  const enemies = new Map(),
    contacts = new Set(),
    rushContacts = new Set(),
    hazards = [],
    links = [];
  let serial = 0, attackSerial=0, beat=0, slots=1, cadence=70, beamWaiting=false, lastWasBeam=false;
  // Even late combinations enter on different beats. A Prism link shares a
  // turn with the actors; generating a new cell never starts a volley.
  function takeTurn(beam=false) {
    if(beat>0 || slots<=0 || (!beam && beamWaiting && !lastWasBeam)) return false;
    beat=cadence; slots--; lastWasBeam=beam;return true;
  }
  function crownPost(p, side, self) {
    let best, room=-Infinity;
    // Posts are offsets from the PLAYER, so near a rail every candidate lands
    // outside the table and the Crown would relocate through the wall -- it was
    // the last enemy still escaping (measured: 109 samples outside after every
    // other path was contained). Clamping each candidate BEFORE the clearance
    // test means the picked post is always playable, and the spacing check still
    // compares real positions rather than pre-clamp ones.
    const cr = TYPES.crown.r,
      lo = { x: ARENA.x + cr, y: ARENA.y + cr },
      hi = { x: ARENA.x + ARENA.w - cr, y: ARENA.y + ARENA.h - cr };
    for(const [x,y] of [[260,-530],[-260,-530],[0,-680],[400,-390],[-400,-390],[150,-740],[-150,-740]]){
      const q={x:clamp(p.x+x*side,lo.x,hi.x),y:clamp(p.y+y,lo.y,hi.y)}; let gap=Infinity;
      for(const e of enemies.values()) if(e!==self) gap=Math.min(gap,Math.hypot(e.x-q.x,e.y-q.y)-e.r-cr);
      if(gap>room){best=q;room=gap;}
      if(room>=310)break;
    }
    return best;
  }
  function add(spec) {
    // Portal doorway protection applies to every producer (stream, split, rescue).
    const door=world.questDoor;
    if(door && Math.hypot(spec.x-door.x,spec.y-door.y)<door.r+260) {
      const angle=Math.atan2(ARENA.y+ARENA.h/2-door.y,ARENA.x+ARENA.w/2-door.x);
      spec={...spec,x:door.x+Math.cos(angle)*(door.r+300),y:door.y+Math.sin(angle)*(door.r+300)};
    }
    if (enemies.has(spec.id)) return enemies.get(spec.id);
    const viewport=world.viewport;
    if(viewport && !spec.pinned && !spec.wavePlaced && inViewport(spec,viewport)) {
      const radius=(TYPES[spec.kind]?.r||32)*(spec.size||(spec.small?.6:1));
      const point=safeSpawn(spec,radius,viewport,world.player.position,[...enemies.values()],!!spec.wave);
      if(!point)return null;
      spec={...spec,...point};
    }
    const t = TYPES[spec.kind],
      a = spec.angle ?? (spec.kind === 'fang' ? Math.atan2(-spec.y, -spec.x) : 0);
    // ── THE LAST PLACE AN ENEMY CAN BE BORN ────────────────────────────────
    //
    // `run.js` clamps everything it places, but that is not the only door into
    // this collection: `kids()` below calls `add()` directly, and a Fork's two
    // children are offset 94px sideways from a parent that may already be
    // sitting against a rail. One such child was the only enemy left outside
    // the table after every other path was contained.
    //
    // So the clamp lives here as well, by the body's own radius, computed from
    // the same `size`/`small` rule used for `r` below. Anything born in this
    // game is born inside the walls, whatever called for it.
    const bornR = (t?.r ?? 32) * (spec.size ?? (spec.small ? 0.6 : 1));
    const bornX = clamp(spec.x, ARENA.x + bornR, ARENA.x + ARENA.w - bornR),
      bornY = clamp(spec.y, ARENA.y + bornR, ARENA.y + ARENA.h - bornR);
    const e = {
      ...spec,
      x: bornX,
      y: bornY,
      postX: bornX, postY: bornY,
      r: t.r * (spec.size ?? (spec.small ? 0.6 : 1)),
      hp: t.hp,
      enteredViewport: !!spec.pinned || (viewport ? inViewport({x:bornX,y:bornY},viewport) : true),
      x: bornX,
      y: bornY,
      px: bornX,
      py: bornY,
      angle: a,
      pa: a,
      age: 0,
      cool: spec.delay ?? 80,
      mode: 'idle',
      clock: 0,
      span: 1,
      aim: a,
      tx: spec.x,
      ty: spec.y,
      vx: 0,
      vy: 0,
      flash: 0,
      lastSlash: -1,
    };
    e.body = sensor(e);
    Body.setAngle(e.body, a);
    e.body.plugin.enemy = e;
    Composite.add(world.engine.world, e.body);
    enemies.set(e.id, e);
    if (e.sentry) {
      wind(e, e.kind, world.player.position, { x: 0, y: 0 }, false);
      e.angle = e.pa = e.aim;
      Body.setAngle(e.body, e.angle);
    }
    return e;
  }
  function remove(e) {
    if (!enemies.delete(e.id)) return;
    Composite.remove(world.engine.world, e.body);
    contacts.delete(e);rushContacts.delete(e);
    // The new close-range zones belong to their source and cannot linger after a cut.
    for(let i=hazards.length-1;i>=0;i--)if(hazards[i].kind==='zone'&&hazards[i].sourceId===e.id)hazards.splice(i,1);
  }
  function interrupt(e){
    if(!['fork','bastion','rift','well'].includes(e.kind))return;
    if(e.mode==='tell'||e.mode==='recover'){e.mode='idle';e.cool=Math.max(e.cool,100);e.attackZone=null;}
    for(let i=hazards.length-1;i>=0;i--)if(hazards[i].kind==='zone'&&hazards[i].sourceId===e.id)hazards.splice(i,1);
  }
  const detect = ({ pairs }) => {
    for (const pair of pairs) {
      const { parentA: a, parentB: b } = pair.collision;
      const t = a === world.player ? b : b === world.player ? a : null;
      if (t?.plugin.enemy) {const enemy=t.plugin.enemy;contacts.add(enemy);if(enemy.kind==='fang'&&enemy.mode==='rush')rushContacts.add(enemy);}
    }
  };
  Events.on(world.engine, 'collisionStart', detect);
  Events.on(world.engine, 'collisionActive', detect);
  function fire(e, angle, speed) {
    if (hazards.length >= 72) return;
    const x = e.x + Math.cos(angle) * e.r,
      y = e.y + Math.sin(angle) * e.r;
    hazards.push({
      kind: 'needle',
      source: e.kind,
      sourceId:e.id,attackId:e.attackId,
      x,
      y,
      px: x,
      py: y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      angle,
      life: 110,
      age: 0,
    });
  }
  function pulse(e) {
    if (hazards.length < 72)
      hazards.push({
        kind: 'ring',
        source: 'pulse',
        sourceId:e.id,attackId:e.attackId,
        x: e.x,
        y: e.y,
        px: e.x,
        py: e.y,
        age: 0,
        life: 87,
        radius: e.r,
        previousRadius: e.r,
      });
  }
  function wind(e, kind, p, v, announce = true) {
    e.mode = 'tell';
    const lead = kind === 'prism' ? 9 : kind === 'fang' ? 5 : 0;
    e.aim = Math.atan2(p.y + v.y * lead - e.y, p.x + v.x * lead - e.x);
    e.span = kind === 'rift' || kind === 'well' ? 90 : kind === 'crown' || kind === 'bastion' ? 84 : kind === 'fork' ? 78 : kind === 'fang' ? 66 : 76;
    if (e.gentle) e.span += 24;
    // The training Rift targets the present position and gives a novice time
    // to see the real warning and respond. Normal combat keeps predictive aim.
    if (e.tutorialTargetPlayer) e.span = 165;
    e.clock = e.span;
    const leadTime = e.tutorialTargetPlayer ? 0 : 16;
    const dx = p.x + v.x * leadTime - e.x,
      dy = p.y + v.y * leadTime - e.y,
      k = Math.min(1, 610 / (Math.hypot(dx, dy) || 1));
    e.tx = e.x + dx * k;
    e.ty = e.y + dy * k;
    // A telegraphed destination belongs to world space, never the camera.
    const attackBounds=world.tutorialEnemyBounds||ARENA;
    e.tx=clamp(e.tx,attackBounds.x+e.r,attackBounds.x+attackBounds.w-e.r);
    e.ty=clamp(e.ty,attackBounds.y+e.r,attackBounds.y+attackBounds.h-e.r);
    e.attackId=`${e.id}:${++attackSerial}`;
    e.attackZone=enemyAttackZone(kind,kind==='rift'?e.tx:e.x,kind==='rift'?e.ty:e.y,kind==='fork'?e.angle:e.aim,e.r);
    if (announce) tell(e);
  }
  function move(dt, difficulty) {
    const player=world.player,p=player.position,m=Math.min(1.38,1+(difficulty-1)*.055);
    cadence=difficulty<=2?76:54; beat=Math.max(0,beat-dt);
    // Count an attack once across its tell, active projectile(s) and recovery.
    // A Crown's ten needles are one volley, not ten independent turns.
    const threats=new Set();
    for(const e of enemies.values())if(e.mode!=='idle'&&Math.hypot(e.x-p.x,e.y-p.y)<1120)threats.add(e.attackId||`enemy:${e.id}`);
    for(const h of hazards)if(!h.spent&&Math.hypot(h.x-p.x,h.y-p.y)<1120)threats.add(h.attackId||`hazard:${h.sourceId||h.source}`);
    for(const link of links)threats.add(`link:${link.a.id}:${link.b.id}`);
    slots=(difficulty<=2?1:2)-threats.size;
    for (const e of enemies.values()) {
      e.px = e.x;
      e.py = e.y;
      e.pa = e.angle;
      e.flash = Math.max(0, e.flash - dt);
      e.age += dt;
      if (e.pinned) continue;
      // Camera position affects rendering and NEW spawn presentation only.
      // Existing entities must not be deleted or repositioned by a pan/zoom.
      const dx = p.x - e.x,
        dy = p.y - e.y,
        dist = Math.hypot(dx, dy) || 1,
        nx = dx / dist,
        ny = dy / dist;
      if (e.kind === 'crown' && dist > 1160) {
        const desired=crownPost(p, Math.cos(e.age)<0?-1:1,e);
        const q=desired;
        e.x = e.px = clamp(q.x, ARENA.x + (e.r||0), ARENA.x + ARENA.w - (e.r||0));
        e.y = e.py = clamp(q.y, ARENA.y + (e.r||0), ARENA.y + ARENA.h - (e.r||0));
        e.mode = 'idle';
        e.cool = 35;
        Body.setPosition(e.body, e);
        continue;
      }
      if (dist > 1120 && e.kind !== 'crown') {
        e.vx = e.vy = 0;
        if(e.mode!=='idle'){e.mode='idle';e.cool=55;}
        continue;
      }
      const k = e.kind;
      e.cool -= dt;
      if (e.mode === 'rush') {
        // A lunge is a straight line and does not know about rails. Held to the
        // table here so a Fang cannot finish its rush on the far side of a wall
        // -- it commits, hits the boundary and stops there, which also reads
        // correctly: the rail is solid for everything on the table.
        const er0 = e.r || 0;
        e.x = clamp(e.x + Math.cos(e.aim) * (e.lungeSpeed||10.8) * dt, ARENA.x + er0, ARENA.x + ARENA.w - er0);
        e.y = clamp(e.y + Math.sin(e.aim) * (e.lungeSpeed||10.8) * dt, ARENA.y + er0, ARENA.y + ARENA.h - er0);
        if ((e.clock -= dt) <= 0) {
          e.mode = 'idle';
          e.cool = 92;
        }
      } else if (e.mode === 'recover') {
        if((e.clock-=dt)<=0){e.mode='idle';e.attackZone=null;}
      } else if (e.mode === 'tell') {
        if ((e.clock -= dt) <= 0) {
          e.mode = 'idle';
          e.cool = (130 + (e.phase || 0) * 7) / m;
          if (k === 'fang') {
            e.mode = 'rush';
            e.clock = 24;
          } else if (k === 'pulse') pulse(e);
          else if (k === 'prism') fire(e, e.aim, 6.8 * m);
          else if (['fork','bastion','rift','well'].includes(k)) {
            if(k==='rift'){e.x=e.px=e.tx;e.y=e.py=e.ty;}
            if(hazards.length<72&&e.attackZone)hazards.push({kind:'zone',source:k,sourceId:e.id,attackId:e.attackId,zone:e.attackZone,x:e.attackZone.x,y:e.attackZone.y,px:e.attackZone.x,py:e.attackZone.y,angle:e.aim,age:0,life:14});
            e.mode='recover';e.clock=38;e.cool=145;
          } else if (k === 'crown') {
            for (let j = 0; j < 10; j++) fire(e, e.aim + (j * TAU) / 10, 5.4 * m);
            e.cool = 112;
          }
        }
      } else {
        const speed =
          (k === 'bastion'
            ? 1.85
            : k === 'fork'
              ? 1.35
              : k === 'crown'
                ? 2.2
                : k === 'fang'
                  ? e.small
                    ? 2.9
                    : 1.5
                  : 0.6) * m;
        // Slow tracking between explicit attacks lets a player read each tell.
        const sway = Math.sin(e.age * 0.038 + (e.phase || 0)) * (k === 'fork' ? 1.55 : 0.2);
        // Guard a post rather than vacuuming the whole cell into one pile.
        // A lunge/blink is allowed out; the actor walks back, never snaps.
        let vx=nx*speed-ny*sway,vy=ny*speed+nx*sway;
        if(k!=='crown'){
          const hx=e.postX-e.x,hy=e.postY-e.y,d=Math.hypot(hx,hy),
            home=clamp((d-(e.small?52:78))/46,0,1);
          if(home){ vx=vx*(1-home)+hx/d*speed*home;vy=vy*(1-home)+hy/d*speed*home; }
        }
        // CLOSING PRESSURE.
        //
        // Every shape used to guard a fixed post and only ever chase within
        // 440px, while measuring a real run showed the nearest enemy sits a
        // median 480px from the cube AT LAUNCH TIME -- so the player was
        // permanently launching into empty space and the game read as cube
        // steering rather than slashing. 14 of 60 launches had a target inside
        // 300px; the rest were travel with no decision in them.
        //
        // A slashing game needs a supply of things to slash. Shapes inside
        // this radius now drift toward the player instead of holding station,
        // which keeps the field populated with live targets without adding a
        // single new hazard. The drift is deliberately slower than the cube:
        // they gather where the player is heading, they do not chase the cube
        // down, so the player still chooses every engagement.
        // CLOSING PRESSURE, bounded by the post.
        //
        // Every shape guards a post and only chased inside 440px, while the
        // nearest enemy measured a median 480px from the cube AT LAUNCH -- so
        // most launches were travel with nothing to cut. Shapes now lean toward
        // the player, which keeps live targets near the cube.
        //
        // The lean is capped by how far the shape already is from its post.
        // An unbounded pull dragged actors up to 780px off their station, which
        // broke the guarantee that idle actors stay within ~130px of where the
        // cell put them (a test caught it, correctly: without that bound the
        // whole field slowly funnels into a single pile on the player, which is
        // the "idle actors pile up at the cube" failure). So the pull fades to
        // zero as the shape approaches the edge of its leash.
        const CLOSING = 780,
          LEASH = 110;
        if (k !== 'crown' && dist < CLOSING && dist > 90) {
          const pull = 1 - dist / CLOSING, // strongest nearby, zero at the edge
            home = Math.hypot(e.x - e.postX, e.y - e.postY),
            slack = clamp(1 - home / LEASH, 0, 1),
            inflate = k === 'fang' ? 2 : k === 'bastion' ? 0.7 : 1,
            force = pull * inflate * 2.0 * slack;
          vx += nx * force;
          vy += ny * force;
        }
        e.x+=vx*dt;e.y+=vy*dt;
        if (
          e.cool <= 0 &&
          dist < (k === 'fang' ? 10.8*m*24+e.r+PLAYER_SIZE*.5-20 : k === 'pulse' ? 410 : k === 'fork' ? 260 : k === 'bastion' ? 290 : k === 'well' ? 230 : 820) &&
          ['fang', 'pulse', 'prism', 'fork', 'bastion', 'rift', 'well', 'crown'].includes(k) &&
          takeTurn()
        ) {
          e.lungeSpeed=10.8*m;
          wind(e, k, p, player.velocity);
        }
      }
      if (k === 'fang') {
        const target = e.mode === 'idle' ? Math.atan2(ny, nx) : e.aim;
        e.angle +=
          Math.atan2(Math.sin(target - e.angle), Math.cos(target - e.angle)) *
          Math.min(1, dt * 0.26);
      } else if (k === 'bastion' && e.mode === 'tell') {
        const target=e.aim-Math.PI/2;
        e.angle+=Math.atan2(Math.sin(target-e.angle),Math.cos(target-e.angle))*Math.min(1,dt*.24);
      } else if (k === 'well' || k === 'rift' || (k === 'fork' && e.mode === 'idle'))
        e.angle += (k === 'well' ? 0.017 : 0.008) * dt;
      if (k === 'well' && dist < 234 && world.launched) {
        const f = (1 - dist / 234) * 0.92 * dt;
        Body.setVelocity(player, { x: player.velocity.x - nx * f, y: player.velocity.y - ny * f });
      }
      // ── CONTAINMENT ─────────────────────────────────────────────────────
      //
      // Nothing above this point knows where the walls are, and three of the
      // movement paths can put a shape outside them: a `crown` is repositioned
      // relative to the PLAYER (crownPost), a lunge is a straight line that does
      // not stop at a rail, and the closing lean is unconstrained. Measured
      // after spawns were fixed: a crown drifting out through the top wall and
      // staying there, unreachable, on screen, forever.
      //
      // One clamp for every enemy, by its own radius, at the single point where
      // a position is committed. The leash that walks it home is upstream and
      // untouched -- this only refuses to let it leave the table.
      const lim = world.tutorialEnemyBounds||ARENA,
        er = e.r || 0;
      const cxq = clamp(e.x, lim.x + er, lim.x + lim.w - er),
        cyq = clamp(e.y, lim.y + er, lim.y + lim.h - er);
      if (cxq !== e.x || cyq !== e.y) {
        e.x = e.px = cxq;
        e.y = e.py = cyq;
        // A shape pinned against a rail should not keep reporting velocity into
        // it; that would read as a lunge that never lands.
        e.vx = 0;
        e.vy = 0;
      }
      e.vx = (e.x - e.px) / dt;
      e.vy = (e.y - e.py) / dt;
      Body.setPosition(e.body, e);
      Body.setAngle(e.body, e.angle);
    }
  }
  function attacks(dt, onHit, {freezeZones=false}={}) {
    for (let i = hazards.length - 1; i >= 0; i--) {
      const h = hazards[i];
      if(freezeZones&&h.kind==='zone')continue;
      h.px = h.x;
      h.py = h.y;
      h.age += dt;
      h.life -= dt;
      if (h.kind === 'needle') {
        h.x += h.vx * dt;
        h.y += h.vy * dt;
      } else if(h.kind==='ring') {
        h.previousRadius = h.radius;
        h.radius += 3.45 * dt;
      }
      if (h.life <= 0) {
        hazards.splice(i, 1);
        continue;
      }
      if (hazardHits(h, world.player.position, world.player.plugin.previous)) {
        if (!h.spent) {
          h.spent = true;
          onHit(h);
        }
        if (h.kind === 'needle') hazards.splice(i, 1);
      }
    }
  }
  // The link only exists while BOTH actual sentries are alive. A new cell has
  // no pre-fired beam. Count down locally and always display its full wind-up.
  function linkAttacks(cells, dt, hit) {
    links.length = 0;beamWaiting=false;
    const p = world.player.position,
      prev = world.player.plugin.previous;
    for (const cell of cells.values()) {
      if (!cell.link) continue;
      const l = cell.link,
        a = enemies.get(l.a),
        b = enemies.get(l.b);
      if (!a || !b) continue;
      if (closest(a.x - p.x, a.y - p.y, b.x - p.x, b.y - p.y) > 940) {
        l.age = 0;
        continue;
      }
      const old=l.age||0;
      l.age = (old+dt) % l.period;
      if(old<39 && l.age>=39 && !takeTurn(true)) {l.age=38.99;beamWaiting=true;continue;}
      const mode=l.age<39?'off':l.age<117?'tell':l.age<139?'live':'off';
      if(mode!=='off') links.push({a,b,mode,f:(l.age-39)/78});
      if (mode !== 'live') {
        l.spent = false;
        continue;
      }
      if (!l.spent && sweepDistance(prev, p, a, b) < PLAYER_SIZE * 0.48) {
        l.spent = true;
        hit({a,b});
      }
    }
  }
  /** The blade sweep.
   *
   *  This is the single most important function in the game and it was tuned
   *  far too tight. It used a ray `r * 0.22` wide (~5 px) fired from the cube
   *  to a tip 2.88r (~66 px) away, which means a cut only landed if a shape sat
   *  almost exactly on the aim line. Measured over a real run: 0.71 kills per
   *  launch, i.e. roughly two out of every three committed launches were
   *  travel with no slash at all. That is why the game read as "steering a cube
   *  around" instead of "slashing geometry".
   *
   *  A slashing game should reward a DECISION, not a pixel. The blade is now a
   *  wide arc: a fatter ray at a longer reach, plus a short radial tolerance
   *  around the cube itself so a shape the cube actually brushes past is cut
   *  rather than counted as a collision. Misses still exist -- the arc points
   *  where you aimed, so aiming away from a shape still misses it -- but the
   *  window is now a swipe, not a needle.
   *
   *  Deliberately NOT done: cutting everything on screen, or auto-aiming the
   *  sweep. Chaos is only fun while it still answers to the player's input; a
   *  blade that swings itself is a cutscene.
   */
  function sweepBlade(angle, reach = 1, width = 1, closeWidth = 1) {
    const p = world.player.position,
      r = PLAYER_SIZE / 2,
      span = 3.6 * r * reach,
      candidates = [];
    for (const e of enemies.values())
      if (Math.abs(e.x - p.x) < e.r + span && Math.abs(e.y - p.y) < e.r + span)
        candidates.push(e.body);
    if (!candidates.length) return;
    const tip = {
      x: p.x + span * Math.cos(angle),
      y: p.y + span * Math.sin(angle),
    };
    // Wide ray: the arc of the swing.
    for (const hit of Matter.Query.ray(candidates, p, tip, r * 0.95 * reach * width)) {
      const e = hit.body.parent.plugin.enemy;
      if (e) contacts.add(e);
    }
    if(closeWidth>1) for(const hit of Matter.Query.ray(candidates,p,tip,r*.95*reach*width*closeWidth)) {
      const e=hit.body.parent.plugin.enemy;
      if(e && Math.hypot(e.x-p.x,e.y-p.y)<=100)contacts.add(e);
    }
    // NOTE: there is deliberately NO radial "brushing" term here.
    //
    // I added one while widening the blade, reasoning that a shape the cube
    // flies directly into should be cut rather than counted as a hazard. A test
    // rejected it and was right to: a radial add turns the sweep into a
    // proximity blast, and it silently made the player damage shapes they had
    // not aimed at -- including ones behind the swing. The blade is a FORWARD
    // ray, and a shape the cube collides with while the blade is out is handled
    // by the contact path in run.js, which already distinguishes a cut from a
    // hurt by whether the blade window is open.
  }
  // Use the same convex sensor parts as direct cuts, not a radius/AABB kill.
  // Resolve nearer intersections first so chain awards don't depend on which
  // neighbouring cell happened to be loaded first.
  function forwardHits(start, end, width) {
    const dx = end.x - start.x,
      dy = end.y - start.y,
      along = (e) => (e.x - start.x) * dx + (e.y - start.y) * dy;
    const bodies = [...enemies.values()].filter((e) => along(e) > 0).map((e) => e.body);
    return Matter.Query.ray(bodies, start, end, width)
      .map((hit) => hit.body.parent.plugin.enemy)
      .sort((a, b) => along(a) - along(b) || (a.id < b.id ? -1 : Number(a.id > b.id)));
  }
  function kids(e) {
    for (const sign of [-1, 1])
      add({
        kind: 'fang',
        small: true,
        x: e.x + sign * 94,
        y: e.y + sign * 46,
        home: e.home,
        slot: -1,
        id: `kid-${++serial}`,
        phase: e.phase,
        delay: 65,
      });
  }
  return {
    enemies,
    contacts,
    rushContacts,
    hazards,
    links,
    linkAttacks,
    crownPost,
    add,
    remove,
    interrupt,
    kids,
    move,
    attacks,
    sweepBlade,
    forwardHits,
    leave(home) {
      for (const e of enemies.values()) if (e.home === home) remove(e);
    },
    dispose() {
      Events.off(world.engine, 'collisionStart', detect);
      Events.off(world.engine, 'collisionActive', detect);
      contacts.clear();rushContacts.clear();
      enemies.clear();
      hazards.length = links.length = 0;
    },
  };
}
