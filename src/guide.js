import { projectilePoint, sweptHit, MAX_SPEED } from './physics.js';
import { clamp, PLAYER_SIZE } from './levels.js';

// A sight picture, not an aim bot. Sample the same parabolic release as the
// controls; notch the first two cuttable CENTRES close to that arc. The marks
// never steer the shot, model future enemy AI or promise a collision.
export function sightPicture(p, v, geometry, enemies, damage = 1) {
  const path = [],
    pair = [];
  if (!v?.power) return { path, pair };
  const speed = Math.hypot(v.x, v.y),
    step = clamp(20 / speed, 0.6, 2.6),
    candidates = [];
  let limit = 16 + 15 * Math.min(1,speed/MAX_SPEED);
  for (const e of enemies) {
    if (!e.small && e.hp <= damage && Math.hypot(e.x - p.x, e.y - p.y) < 1180) candidates.push(e);
  }
  let last = p;
  for (let i = 1; i <= 57 && i * step <= limit; i++) {
    const q = projectilePoint(p, v, i * step);
    if (
      geometry.some((r) =>
        sweptHit(last.x, last.y, q.x - last.x, q.y - last.y, r, PLAYER_SIZE * 0.38),
      )
    )
      break;
    if (Math.hypot(q.x - p.x, q.y - p.y) > PLAYER_SIZE * 0.86) path.push(q);
    if (pair.length < 2)
      for (const e of candidates) {
        if (pair.some((n) => n.e === e) || Math.hypot(e.x - q.x, e.y - q.y) > e.r * 0.8 + 6)
          continue;
        // The first successful cut really extends the live stroke by seven
        // simulation ticks. Distant pairs should not disappear from sight.
        if(!pair.length)limit+=7;
        pair.push({ e, angle: Math.atan2(q.y - last.y, q.x - last.x) });
        if (pair.length === 2) break;
      }
    last = q;
  }
  // A lone target isn't a throughcut opportunity.
  return { path, pair: pair.length === 2 ? pair : [] };
}
