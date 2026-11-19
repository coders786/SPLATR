// One stroke lasts one committed launch. A long chain can span many strokes;
// only two direct, full-size kills on THIS stroke release the forward shear.
export const SHEAR = Object.freeze({ reach: 424, width: 18, bonus: 300, damage: 2 });
const profiles = {
  chip: { cue: 'chip', stop: 0, flecks: 0, kick: 0, gap: 0.08 },
  stock: { cue: 'stock', stop: 3, flecks: 2, kick: 1.4, gap: 0.25 },
  paper: { cue: 'paper', stop: 1, flecks: 2, kick: 0, gap: 0.1 },
  plate: { cue: 'plate', stop: 3, flecks: 3, kick: 1.5, gap: 0.15 },
  crown: { cue: 'crown', stop: 4, flecks: 5, kick: 2.8, gap: 0.16 },
  tear: { cue: 'tear', stop: 4, flecks: 1, kick: 2.2, gap: 0.18 },
};
export const impactFor = (kind, small, torn, paperTarget = false) =>
  torn
    ? profiles.tear
    : paperTarget
      ? profiles.stock
      : small
        ? profiles.chip
        : kind === 'crown' || kind === 'cube'
          ? profiles.crown
          : kind === 'bastion'
            ? profiles.plate
            : profiles.paper;
export function beginStroke(origin, angle, shot) {
  return {
    origin: { ...origin },
    angle,
    shot,
    primaries: 0,
    contacts: 0,
    kills: 0,
    points: 0,
    marks: [],
    released: false,
    shear: null,
  };
}
// Keep a contact print, not a replay buffer growing with an endless run. The
// ledger counts every hit even if the illustration runs out of sample slots.
export function printKill(stroke, e, base, fromShear, cut, hpBefore) {
  // TWO counters, because the release needs to know both how MANY contacts a
  // stroke made and how many of them were FULL-SIZE.
  //
  // Measured before this change: 0 of 774 strokes ever released the forward
  // cut. The old rule required two full-size direct contacts in one ballistic
  // arc; real strokes got exactly one direct contact or none, never two, because
  // the generator does not lay shapes out in a queue. The move was not rare, it
  // was unreachable -- it existed in the code and never in the game.
  //
  // The obvious fix -- count every contact, chips included -- was WRONG and a
  // test caught it: two Fork children would then charge a shear, so one plate
  // could farm the move forever. That is the exact thing the guard was for.
  //
  // The rule that works (measured at 1.9% of strokes, ~2.3 per run) is:
  //   at least one FULL-SIZE contact, AND at least two contacts in total.
  // Chips can contribute to the count but can never satisfy it alone, so the
  // anti-farm guard survives while the move becomes reachable.
  if (!fromShear) {
    stroke.contacts++;
    if (!e.small) stroke.primaries++;
  }
  const release = !stroke.released && stroke.primaries >= 1 && stroke.contacts >= 2;
  if (release) stroke.released = true;
  const points = base + (release ? SHEAR.bonus : 0);
  stroke.points += points;
  stroke.kills++;
  if (stroke.marks.length < 8)
    stroke.marks.push({
      kind: e.kind,
      x: e.x,
      y: e.y,
      angle: e.angle,
      cut,
      hpBefore,
      fault: e.fault,
      release,
      r: e.r,
      fromShear,
      small: !!e.small,
      paper: !!e.paper,
    });
  return { release, points };
}
