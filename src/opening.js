import { hash, openingFacing, randomSource } from './levels.js';
import { stopPlayer, placePlayer, setBulletTime, projectilePoint } from './physics.js';

// The ticket is punched on Start, not on success. A player who retires or
// skips the first scene still gets a clean field on their very next run.
export function firstStart(storage) {
  // Some hosts deny localStorage. The ticket still works for this visit.
  let used=false;
  return function start(mix='gradual') {
    const played=used || storage.get('started','0')==='1' || Number(storage.get('rackClears',0))>0 || Number(storage.get('best',0))>0;
    const staged=mix!=='full';
    used=true;
    storage.set('started',1);
    return {staged,warmup:staged && !played};
  };
}

// A real stroke, then a rest. The next row doesn't exist during the stroke
// that cleared the last one. Mashing Space can't cancel the first rip or fly
// off the bench; immediately redirecting becomes a choice in the live field.
export function createOpening(seed,world,combat) {
  const o = {
    row: 0,
    rest: true,
    racks: [],
    free: true,
    reach: 1,
    returning: 0,
    finishing: 0,
    misses: 0,
    anchor: { ...world.player.position },
  };
  const face = openingFacing(seed);
  let travel = 0,
    hit = false,
    brake = null,
    from = null;
  function rack(row) {
    o.row = row;
    o.misses = 0;
    o.free = row<2;
    o.reach=o.free?1.9:1;
    const rand=randomSource(hash(seed,38,row)),sign=row===1?-face:face;
    const angle=row===1?1.13+rand()*.09:.94+rand()*.09;
    const v={x:sign*31.7*Math.cos(angle),y:-31.7*Math.sin(angle)},count=[3,2,1][row];
    const pegs=[], places=Array.from({length:count},(_,i)=>projectilePoint(o.anchor,v,6.1+i*7.5));
    const end=places.at(-1),slope=count===1?-.12:Math.atan((end.y-places[0].y)/(end.x-places[0].x));
    for(let i=0;i<count;i++){
      const e=combat.add({kind:row===2?'bastion':'fang',...places[i],
        id: `rack-${row}/${i}`,
        home: 'paper',
        slot: -1,
        pinned: true,
        paper: row < 2,
        size: row === 2 ? 1.28 : 1.22 + i * 0.13,
        angle: row === 2 ? 0 : slope + Math.PI / 2 + sign * (i - 1) * 0.044,
      });
      pegs.push({ x: e.x, y: e.y, r: e.r, id: e.id });
    }
    o.racks.push(pegs);
  }
  rack(0);
  function launch() {
    o.rest = false;
    hit = false;
    travel = 0;
    brake = null;
  }
  function contact(armor) {
    hit = true;
    if (armor) brake = 0;
  }
  function hold(s) {
    stopPlayer(world);
    setBulletTime(world, false, true);
    s.held = s.depleted = false;
    s.blade = s.parry = 0;
  }
  function park(s) {
    hold(s);
    o.rest = true;
    o.anchor = { ...world.player.position };
  }
  function parkedTick(s) {
    if (!o.rest && !o.returning) return false;
    const p = world.player;
    Object.assign(p.plugin.previous, p.position, { angle: p.angle });
    if (o.returning) {
      const t = 1 - --o.returning / 16,
        f = t * t * (3 - 2 * t);
      placePlayer(world, {
        x: from.x + (o.anchor.x - from.x) * f,
        y: from.y + (o.anchor.y - from.y) * f,
      });
      if (!o.returning) park(s);
    }
    world.previousClock = world.clock;
    world.clock++;
    for (const e of combat.enemies.values()) e.flash = Math.max(0, e.flash - 1);
    return true;
  }
  function advance(s, dt) {
    travel += dt;
    if (o.row === 2 && !combat.enemies.size) {
      hold(s);
      o.finishing = 20;
      return true;
    }
    if (!combat.enemies.size && brake === null) brake = 5;
    if (brake !== null) brake -= dt;
    if (travel < 25 && (brake === null || brake > 0)) return false;
    if (hit) {
      park(s);
      if (!combat.enemies.size) {
        rack(o.row + 1);
      }
    } else {
      o.misses++;
      from = { ...world.player.position };
      o.returning = 16;
      hold(s);
    }
    return false;
  }
  return { state: o, launch, hit: contact, advance, parkedTick };
}
