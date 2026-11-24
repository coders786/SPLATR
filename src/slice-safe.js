/**
 * CHUNK 2 — "SAFE TO SLICE", DRAWN FROM THE BLADE THAT WILL ACTUALLY SWING.
 *
 * The report asks for a visible "this is cuttable" state on the things the
 * player can cut. The trap in that ask is a marker that promises a cut the
 * blade does not deliver: the sweep is a ray of a specific span and width,
 * scaled by the sword's reach, the head's cut width, the temporary reach buff
 * and the current RUSH state. A pair of green brackets drawn from `enemy.r + 10`
 * would be a lie the frame after any of those changed.
 *
 * So the geometry is not re-invented here. `sweepGeometry` is the ONE definition
 * of the blade's forward ray (span, half-width, the radial tolerance), it is
 * consumed by `slasher.js`'s `sweepBlade` for the real hit test, and this file
 * uses the same numbers to answer the pure question "would a swing from here,
 * along this bearing, with these multipliers, reach that body?".
 *
 * The result is a per-body state the painter renders and a player can learn:
 *
 *   reachable  the blade would pass through it right now  → green bracket
 *   shielded   reachable, but it wears plates (Bastion, Crown, Landlord) →
 *              green bracket plus a red plate notch: you can cut it, it will
 *              not die, and that difference has to be visible before the swing
 *   lethal     it is winding up or rushing → red, never green
 *   far        out of the blade's reach, or no blade at all → nothing
 *
 * Pure: no canvas, no DOM, no clock, no Matter import past the geometry helper.
 */

/**
 * The blade's forward ray, in world px.
 *
 * `span` is the length from the cube's centre to the tip. `halfWidth` is the
 * lateral half-width of the ray; the sweep's own radial tolerance around the
 * cube's body is applied separately by the caller (`sweepBlade`), because that
 * one is measured from the body centre rather than the ray.
 *
 * @param {{reach?:number,width?:number,closeWidth?:number}} opts
 */
export function sweepGeometry({ reach = 1, width = 1, closeWidth = 1 } = {}) {
  const PLAYER_HALF = 23; // PLAYER_SIZE / 2 — kept local: this file stays pure.
  const r = PLAYER_HALF;
  return Object.freeze({
    span: 3.6 * r * reach,
    halfWidth: r * 0.95 * reach * width,
    /** The short radial tolerance around the cube (the "brush past" rule). */
    closeRadius: 100 * closeWidth,
    closeWidth,
  });
}

/**
 * Would a swing along `angle` from `player` reach `body`?
 *
 * The test is circle-against-capsule, because that is the shape `sweepBlade`'s
 * `Matter.Query.ray(…, halfWidth)` actually asks about: a segment of length
 * `span` inflated by the blade's half-width. A first version used "the body's
 * far scrap must fall inside the span", which was STRICTER than the real query
 * at the tip — it refused to mark a plate the blade genuinely cuts. A marker
 * that under-promises is safe but it teaches the wrong rule, so the geometry
 * follows the query, with a 2px margin so the mark never claims a pixel-perfect
 * grazing hit either.
 *
 * @param {{x:number,y:number}} player
 * @param {number} angle bearing of the swing
 * @param {{x:number,y:number,r:number}} body
 * @param {{span:number,halfWidth:number,closeRadius:number}} geo from `sweepGeometry`
 * @param {{blade?:number}} [state] live blade remaining, in ticks
 * @returns {{ok:boolean,along:number,across:number,bracket:number}} `bracket`
 *   is the distance the body's CENTRE lies beyond the blade's tip (negative
 *   means inside the span) — reported so a caller can fade a mark that is only
 *   just in reach.
 */
export function sweepCovers(player, angle, body, geo, state = {}) {
  const out = { ok: false, along: 0, across: 0, bracket: 0 };
  if (!player || !body || !geo) return out;
  const blade = state.blade === undefined ? 1 : Number(state.blade);
  if (!(blade > 0)) return out; // no blade, nothing is cuttable
  const dx = body.x - player.x, dy = body.y - player.y;
  const ux = Math.cos(angle), uy = Math.sin(angle);
  const along = dx * ux + dy * uy;
  const across = Math.abs(-dx * uy + dy * ux);
  const margin = 2;
  const bracket = along - geo.span; // how far the body's centre lies past the tip
  const ok =
    across <= body.r + geo.halfWidth - margin &&
    bracket <= body.r - margin &&
    along >= -(body.r - margin);
  return { ok, along, across, bracket };
}

/**
 * The best swing bearing for this player, as the game would actually launch it.
 * The live slash angle when a blade is out; otherwise the bearing the cube is
 * travelling along (which is what `sweepBlade` uses on the tick after a bank).
 *
 * @param {{slashAngle?:number,velocity?:{x:number,y:number}}} state
 */
export function swingBearing(state = {}, fallback = 0) {
  if (Number.isFinite(state.slashAngle)) return state.slashAngle;
  const v = state.velocity;
  if (v && Number.isFinite(v.x) && Number.isFinite(v.y) && (v.x || v.y)) return Math.atan2(v.y, v.x);
  return fallback;
}

/**
 * Per-body slice state for the whole field.
 *
 * Deterministic and bounded: it reads the enemy map once, does no allocation
 * per enemy beyond one small object, and returns at most `limit` entries so a
 * crowded wave cannot turn the marker into a paragraph.
 *
 * @param {Object} q
 * @param {{x:number,y:number}} q.player
 * @param {Iterable<{id:any,kind:string,x:number,y:number,r:number,mode?:string,hp?:number}>} q.enemies
 * @param {{blade?:number,slashAngle?:number,velocity?:{x:number,y:number}}} [q.state]
 * @param {ReturnType<typeof sweepGeometry>} [q.geometry]
 * @param {number} [q.limit=8]
 * @returns {Array<{id:any,kind:string,x:number,y:number,r:number,state:string,
 *   armed:boolean,shielded:boolean,along:number,across:number}>}
 */
export function sliceStates({ player, enemies, state = {}, geometry = sweepGeometry(), limit = 8 } = {}) {
  if (!player || !enemies) return [];
  const out = [];
  const blade = Number(state.blade) || 0;
  if (blade <= 0) return out;
  const angle = swingBearing(state);
  for (const e of enemies) {
    if (!e || !Number.isFinite(e.x) || !Number.isFinite(e.y)) continue;
    if (e.kind === 'monolith' && e.mode === 'dead') continue;
    const cover = sweepCovers(player, angle, { x: e.x, y: e.y, r: e.r || 20 }, geometry, { blade });
    if (!cover.ok) continue;
    // A body that is mid-attack is never offered as a safe target: the law has
    // exactly one meaning for red.
    const lethal = e.mode === 'tell' || e.mode === 'rush';
    const shielded = ['bastion', 'crown', 'monolith'].includes(e.kind);
    // Gold belongs to the bodies that PAY, not to the armoured ones. Under the
    // law those are different sentences: "you can cut it but it will not die"
    // (a red plate notch) and "cutting it rewards you" (a gold chevron).
    const reward = e.kind === 'crown';
    out.push({
      id: e.id,
      kind: e.kind,
      x: e.x,
      y: e.y,
      r: e.r || 20,
      state: lethal ? 'lethal' : 'reachable',
      armed: cover.across <= e.r + geometry.halfWidth,
      shielded,
      reward,
      along: cover.along,
      across: cover.across,
    });
  }
  // Priority, not just distance: a body in reach that is NOT mid-attack is the
  // one the player should be reading, so the marks that can actually become a
  // cut win over the ones that are only shouting. Distance breaks the tie.
  const rank = (s) => (s.state === 'lethal' ? 1 : 0);
  out.sort((a, b) => rank(a) - rank(b) || a.along - b.along);
  return out.slice(0, Math.max(0, limit));
}

/**
 * One line of teaching for the bottom-edge ticker, tied to what is actually in
 * front of the player instead of a static legend. Returns null when there is
 * nothing honest to say.
 */
export function sliceHint(slices = []) {
  const open = slices.filter((s) => s.state === 'reachable' && s.armed);
  if (!open.length) return null;
  const shielded = open.find((s) => s.shielded);
  if (shielded) return 'GREEN = CUT · PLATES STOP A KILL';
  return `GREEN = CUT · ${open.length} IN REACH`;
}
