/**
 * CHUNK 6C — THE REWARD.
 *
 * The run upgrade catalogue is deliberately data-first. A card is a real
 * record, not a string in the chooser: its tier gates its availability, its
 * trade-off is parseable, and its comparison bars come from the same numeric
 * fields that the card advertises.
 *
 * The old eleven wave modifiers remain exported by waves.js for compatibility
 * with the shipped wave tests and the existing short-lived effects. This is
 * the larger run-length catalogue used by the new chooser path.
 */

export const UPGRADE_TRACKS = Object.freeze([
  'MOMENTUM',
  'CUT',
  'STAKES',
  'REBIRTH',
  'DIMENSION',
]);

export const UPGRADE_TIERS = Object.freeze({
  C: Object.freeze({ id: 'C', weight: 1, label: 'COMMON' }),
  R: Object.freeze({ id: 'R', weight: 0.35, label: 'RARE' }),
  D: Object.freeze({ id: 'D', weight: 0.12, label: 'DIMENSION' }),
});

const CATEGORY = Object.freeze({
  MOMENTUM: 'HANDLING',
  CUT: 'ATTACK',
  STAKES: 'STAKES',
  REBIRTH: 'REBIRTH',
  DIMENSION: 'DIMENSION',
});

const comparison = (label, before, after, min, max, unit, key = 'value') => Object.freeze({
  key,
  label,
  before,
  after,
  min,
  max,
  unit,
});

const card = (id, title, track, tier, effect, {
  cost = '',
  gate = '',
  fields = {},
  comparisons = [],
  stat = '',
  legacy = false,
} = {}) => Object.freeze({
  id,
  title,
  name: title,
  track,
  category: CATEGORY[track],
  tier,
  effect,
  cost,
  gate,
  fields: Object.freeze({ ...fields }),
  comparisons: Object.freeze(comparisons),
  stat: stat || effect,
  legacy,
  // A card is catalogued once. The chooser may clone it with lucky values,
  // but the source table itself must never be mutated by a roll.
});

const SPEED = (before, after) => comparison('DASH SPEED', before, after, 0, 90, 'px/tick', 'speed');
const REACH = (before, after) => comparison('CUT REACH', before, after, 40, 180, 'px', 'reach');
const WINDOW = (before, after) => comparison('BLADE WINDOW', before, after, 0, 30, 'ticks', 'blade');
const ARMOR = (before, after) => comparison('PLATE STRIP', before, after, 0, 4, 'plates', 'armor');
const SCORE = (before, after) => comparison('SCORE', before, after, 1, 2, '×', 'score');
const EXIT = (before, after) => comparison('EXIT WINDOW', before, after, 0, 36, 'ticks', 'guard');
const WIDTH = (before, after) => comparison('CUT WIDTH', before, after, 0.4, 1.2, '×', 'width');
const SHIELD = (before, after) => comparison('WARDS / WAVE', before, after, 0, 3, 'blocks', 'shield');
const FRACTURE = (before, after) => comparison('FRACTURE / CLEAR', before, after, 0, 12, 'points', 'fracture');
const CREDITS = (before, after) => comparison('CREDITS', before, after, 1, 2, '×', 'credits');

/** The complete 5 × 8 table from §13.1. */
export const UPGRADE_CATALOG = Object.freeze([
  // THE MOMENTUM TRACK
  card('fleet', 'SWIFT EDGE', 'MOMENTUM', 'C', 'Dash speed 42 → 48 px/tick.', {
    fields: { speed: 48 / 42 }, comparisons: [SPEED(42, 48)], legacy: true,
  }),
  card('comet', 'COMET DRIVE', 'MOMENTUM', 'R', 'Dash faster, cut closer.', {
    cost: 'SHORT BLADE', fields: { speed: 53 / 42, reach: .85 },
    comparisons: [SPEED(42, 53), REACH(100, 85)], legacy: true,
  }),
  card('guard', 'SAFE EDGE', 'MOMENTUM', 'C', 'More time to leave a cut target.', {
    fields: { guard: 8 }, comparisons: [EXIT(8, 16)], legacy: true,
  }),
  card('afterburn', 'AFTERBURN', 'MOMENTUM', 'R', '+8% rebound per wall bank, capped at +24%.', {
    fields: { reboundBonus: .08, reboundCap: .24 },
    comparisons: [comparison('BANK REBOUND', 1, 1.08, 1, 1.28, '×', 'rebound')],
  }),
  card('slashback', 'SLASHBACK', 'MOMENTUM', 'R', 'A cut in Hyper refunds 0.35 seconds.', {
    fields: { hyperRefund: 21 },
    comparisons: [comparison('HYPER TIME', 0, 21, 0, 120, 'ticks', 'hyperRefund')],
  }),
  card('secondwind', 'SECOND WIND', 'MOMENTUM', 'R', 'Hold pace for 4 seconds to earn one edge pip.', {
    fields: { pacePip: 240 },
    comparisons: [comparison('PACE STREAK', 0, 240, 0, 360, 'ticks', 'pacePip')],
  }),
  card('bankloop', 'BANK LOOP', 'MOMENTUM', 'C', 'Wall rebound 1.00 → 1.12×, capped at 1.28×.', {
    fields: { reboundMultiplier: 1.12, reboundCap: 1.28 },
    comparisons: [comparison('BANK REBOUND', 1, 1.12, 1, 1.28, '×', 'rebound')],
  }),
  card('poise', 'POISE', 'MOMENTUM', 'C', 'Held-aim gravity keep 0.10 → 0.35 while falling.', {
    fields: { aimFallGravity: .35 },
    comparisons: [comparison('FALL VELOCITY KEPT', .10, .35, 0, 1, '×', 'aimGravity')],
  }),

  // THE CUT TRACK
  card('cleaver', 'HEAVY CLEAVER', 'CUT', 'R', 'Break more armor with a shorter blade window.', {
    cost: 'SHORTER WINDOW', fields: { armor: 2, blade: -4 },
    comparisons: [ARMOR(1, 3), WINDOW(14, 10)], legacy: true,
  }),
  card('reach', 'LONG EDGE', 'CUT', 'C', 'Reach 20% farther along the cutting line.', {
    fields: { reach: 1.2 }, comparisons: [REACH(100, 120)], legacy: true,
  }),
  card('breaker', 'ARMOR BREAK', 'CUT', 'C', 'Remove one extra armor plate.', {
    fields: { armor: 1 }, comparisons: [ARMOR(1, 2)], legacy: true,
  }),
  card('linger', 'LASTING EDGE', 'CUT', 'R', 'Keep cutting for eight more ticks.', {
    fields: { blade: 8 }, comparisons: [WINDOW(14, 22)], legacy: true,
  }),
  card('thinedge', 'THIN EDGE', 'CUT', 'R', 'A narrower line reaches 60% farther.', {
    cost: 'RAZOR-LINE', fields: { width: .75, reach: 1.6 },
    comparisons: [WIDTH(1, .75), REACH(100, 160)],
  }),
  card('doublejoint', 'DOUBLE JOINT', 'CUT', 'R', 'A second shape in one slash takes double damage.', {
    fields: { secondTargetDamage: 2 },
    comparisons: [comparison('SECOND TARGET DAMAGE', 1, 2, 0, 3, '×', 'secondDamage')],
  }),
  card('restlessedge', 'RESTLESS EDGE', 'CUT', 'C', 'Blade decay is 30% slower.', {
    fields: { bladeDecay: .7 },
    comparisons: [comparison('BLADE DECAY', 1, .7, 0, 1, '×', 'decay')],
  }),
  card('executioner', 'EXECUTIONER', 'CUT', 'R', 'Shapes below 20% health take 1.5× damage.', {
    fields: { executeThreshold: .2, executeMultiplier: 1.5 },
    comparisons: [comparison('LOW-HP DAMAGE', 1, 1.5, 1, 2, '×', 'execute')],
  }),

  // THE STAKES TRACK
  card('duelist', 'GLASS EDGE', 'STAKES', 'R', 'More score, less time to escape contact.', {
    cost: 'FRAGILITY', fields: { score: 1.5, guard: -4 },
    comparisons: [SCORE(1, 1.5), EXIT(14, 10)], legacy: true,
  }),
  card('bounty', 'BOUNTY EDGE', 'STAKES', 'C', 'Earn 25% more score from cuts.', {
    fields: { score: 1.25 }, comparisons: [SCORE(1, 1.25)], legacy: true,
  }),
  card('bastion', 'TWIN WARD', 'STAKES', 'C', 'Two wards block otherwise damaging hits each wave.', {
    cost: 'SLOWER DASH', fields: { shield: 2, speed: .9 },
    comparisons: [SHIELD(0, 2), SPEED(42, 38)], legacy: true,
  }),
  card('barrier', 'ONE-HIT WARD', 'STAKES', 'C', 'One ward blocks an otherwise damaging hit each wave.', {
    fields: { shield: 1 }, comparisons: [SHIELD(0, 1)], legacy: true,
  }),
  card('glassorbit', 'GLASS ORBIT', 'STAKES', 'R', 'Score ×1.35, but maximum hull becomes two.', {
    cost: 'BREAKABLE', fields: { score: 1.35, healthMax: 2 },
    comparisons: [SCORE(1, 1.35), comparison('MAX HULL', 3, 2, 1, 3, 'hull', 'health')],
  }),
  card('ironnerve', 'IRON NERVE', 'STAKES', 'C', 'The first hit each wave deals zero damage.', {
    fields: { firstHitBlock: true }, comparisons: [comparison('FIRST HIT', 1, 0, 0, 1, 'damage', 'firstHit')],
  }),
  card('hollowbonus', 'HOLLOW BONUS', 'STAKES', 'R', 'A flawless wave pays 60% more score.', {
    fields: { flawlessScore: 1.6 }, comparisons: [SCORE(1, 1.6)],
  }),
  card('debtsettlement', 'DEBT SETTLEMENT', 'STAKES', 'R', 'Fracture per clear 2.5 → 6.0.', {
    fields: { fractureClear: 3.5 }, comparisons: [FRACTURE(2.5, 6)],
  }),

  // THE REBIRTH TRACK
  card('memoryofseams', 'MEMORY OF SEAMS', 'REBIRTH', 'R', 'Each run starts with 10% fracture.', {
    fields: { startFracture: 10 }, comparisons: [comparison('START FRACTURE', 0, 10, 0, 100, '%', 'startFracture')],
  }),
  card('stampedsteel', 'STAMPED STEEL', 'REBIRTH', 'C', 'Bastions always spawn with one fewer plate.', {
    fields: { bastionArmor: -1 }, comparisons: [ARMOR(3, 2)],
  }),
  card('embertax', 'EMBER TAX', 'REBIRTH', 'C', 'Credits earned are multiplied by 1.10.', {
    fields: { credits: 1.1 }, comparisons: [CREDITS(1, 1.1)],
  }),
  card('covenant', 'COVENANT', 'REBIRTH', 'R', 'A flawless clear adds 2 fracture.', {
    fields: { flawlessFracture: 2 }, comparisons: [FRACTURE(0, 2)],
  }),
  card('ashreader', 'ASH READER', 'REBIRTH', 'C', 'Lucky rolls reveal their boosted number before you pick.', {
    fields: { revealLucky: true }, comparisons: [comparison('LUCKY ROLL', 0, 1, 0, 1, 'shown', 'lucky')],
  }),
  card('sharddividend', 'SHARD DIVIDEND', 'REBIRTH', 'R', 'A Shatter pays 12 fracture instead of 6.', {
    fields: { shatterFracture: 12 }, comparisons: [FRACTURE(6, 12)],
  }),
  card('gambler', 'GAMBLER', 'REBIRTH', 'R', 'Every fourth card is a free lucky roll.', {
    fields: { luckyEvery: 4 }, comparisons: [comparison('LUCKY CARD', 0, 1, 0, 1, 'chance', 'lucky')],
  }),
  // D-adjacent: the plan keeps this in Rebirth but gates the rule on the first
  // Shatter. It is not a D-tier roll, so the pre-Shatter D filter stays honest.
  card('kingmaker', 'KINGMAKER', 'REBIRTH', 'R', 'The Monolith grants three permanent max-hull points.', {
    gate: 'shatter', fields: { monolithMaxHp: 3 },
    comparisons: [comparison('MAX HULL', 3, 6, 1, 6, 'hull', 'health')],
  }),

  // THE DIMENSION TRACK — unavailable before the first Shatter
  card('godsmother', 'GODSMOTHER', 'DIMENSION', 'D', 'After Shatter, borders hold 1.35× for 12 seconds.', {
    gate: 'shatter', fields: { shatteredRail: 1.35, shatteredRailTicks: 720 },
    comparisons: [comparison('SHATTER RAILS', 1, 1.35, 1, 1.5, '×', 'rail')],
  }),
  card('tearborn', 'TEARBORN', 'DIMENSION', 'D', 'Shatter grants one extra max-hull point this run.', {
    gate: 'shatter', fields: { shatterMaxHp: 1 },
    comparisons: [comparison('SHATTER HULL', 0, 1, 0, 2, 'hull', 'health')],
  }),
  card('phaseline', 'PHASELINE', 'DIMENSION', 'D', 'The assisted cut line shows for two seconds after Shatter.', {
    gate: 'shatter', fields: { phaseLineTicks: 120 },
    comparisons: [comparison('ASSISTED LINE', 0, 120, 0, 240, 'ticks', 'phaseLine')],
  }),
  card('ghostlash', 'GHOST LASH', 'DIMENSION', 'D', 'Every third slash echoes one free damage.', {
    gate: 'shatter', fields: { slashEchoEvery: 3, slashEchoDamage: 1 },
    comparisons: [comparison('ECHO CADENCE', 0, 3, 0, 6, 'slashes', 'echo')],
  }),
  card('crowncinders', 'CROWN OF CINDERS', 'DIMENSION', 'D', 'Pace above 140 for a wave pays fracture and credits.', {
    gate: 'shatter', fields: { crownPace: 140, crownFracture: 1, crownCredits: 1.5 },
    comparisons: [comparison('PACE REWARD', 0, 1, 0, 2, 'fracture', 'paceReward')],
  }),
  card('landlordskey', "LANDLORD'S KEY", 'DIMENSION', 'D', 'OVERCHARGED cuts deal double Monolith plate damage.', {
    gate: 'shatter', fields: { monolithDamage: 2 },
    comparisons: [comparison('MONOLITH DAMAGE', 1, 2, 1, 3, '×', 'monolith')],
  }),
  card('wheelofwatcher', 'WHEEL OF THE WATCHER', 'DIMENSION', 'D', 'A lucky roll can roll twice.', {
    gate: 'shatter', fields: { luckyTwice: true }, comparisons: [comparison('LUCKY ROLLS', 1, 2, 0, 3, '×', 'lucky')],
  }),
  card('theending', 'THE ENDING', 'DIMENSION', 'D', 'Final wave at full hull doubles the wave multiplier.', {
    gate: 'shatter', fields: { finalMultiplier: 2 }, comparisons: [SCORE(1, 2)],
  }),
].map(Object.freeze));

export const UPGRADES = UPGRADE_CATALOG;
export const UPGRADE_POOL = UPGRADE_CATALOG;

const byId = new Map(UPGRADE_CATALOG.map(x => [x.id, x]));

/** Parse the short human trade-off language into a stable object. */
export function parseUpgradeCost(cost = '') {
  if (cost && typeof cost === 'object') return Object.freeze({
    text: String(cost.text || ''), lane: String(cost.lane || 'tradeoff'), value: Number(cost.value) || 0,
  });
  const text = String(cost || '').trim();
  if (!text || text === '—' || text === '-') return Object.freeze({ text: '—', lane: 'none', value: 0 });
  const lane = /window|blade|line|reach/i.test(text) ? 'handling' : /score|fragility|damage/i.test(text) ? 'stakes' : 'tradeoff';
  const percent = text.match(/([+-]?\d+(?:\.\d+)?)\s*%/);
  return Object.freeze({ text, lane, value: percent ? Number(percent[1]) / 100 : 1 });
}

const number = value => Number.isFinite(Number(value)) ? Number(value) : 0;
const fmt = value => {
  const n = number(value);
  return Number.isInteger(n) ? String(n) : n.toFixed(2).replace(/0+$/, '').replace(/\.$/, '');
};

/**
 * Derive the card's before/after bars. `context` can provide the currently
 * equipped baseline (`speed`, `reach`, `blade`, ...); absent values fall back
 * to the documented baseline in the catalogue. No bar is authored separately
 * from the numeric comparison record.
 */
export function upgradePresentation(upgrade, context = {}) {
  const source = typeof upgrade === 'string' ? byId.get(upgrade) : upgrade;
  // Presentation is also a public boundary for legacy/test callers. An object
  // with only an arbitrary id is not a catalog card and must not reach the
  // comparison mapper with an absent `comparisons` array.
  if (!source || !Array.isArray(source.comparisons)) return null;
  const bars = source.comparisons.map(raw => {
    const before = raw.key === 'speed' && Number.isFinite(context.speed) ? context.speed
      : raw.key === 'reach' && Number.isFinite(context.reach) ? context.reach
      : raw.key === 'blade' && Number.isFinite(context.blade) ? context.blade
      : raw.key === 'guard' && Number.isFinite(context.guard) ? context.guard
      : raw.key === 'score' && Number.isFinite(context.score) ? context.score
      : raw.key === 'armor' && Number.isFinite(context.armor) ? context.armor
      : raw.key === 'shield' && Number.isFinite(context.shield) ? context.shield
      : raw.before;
    const ratio = number(raw.before) ? number(raw.after) / number(raw.before) : null;
    const after = Number.isFinite(context[`${raw.key}After`]) ? context[`${raw.key}After`]
      : ratio !== null && ['speed', 'reach', 'score', 'width'].includes(raw.key) ? before * ratio
      : raw.after;
    return Object.freeze({
      ...raw,
      before,
      after,
      beforeText: `${fmt(before)} ${raw.unit}`.trim(),
      afterText: `${fmt(after)} ${raw.unit}`.trim(),
      fillBefore: Math.max(0, Math.min(1, (before - raw.min) / Math.max(.0001, raw.max - raw.min))),
      fillAfter: Math.max(0, Math.min(1, (after - raw.min) / Math.max(.0001, raw.max - raw.min))),
    });
  });
  const cost = parseUpgradeCost(source.cost);
  const stat = bars.map(b => `${b.label} ${b.beforeText} → ${b.afterText}`).join(' / ');
  return Object.freeze({
    id: source.id,
    name: source.name,
    title: source.title,
    effect: source.effect,
    stat,
    cost: cost.text === '—' ? '' : cost.text,
    costText: cost.text,
    costSpec: cost,
    tier: source.tier,
    track: source.track,
    category: source.category,
    gate: source.gate,
    lucky: !!source.lucky,
    comparisons: Object.freeze(bars),
    bars: Object.freeze(bars),
    accessibleName: source.title,
  });
}
export const presentUpgrade = upgradePresentation;
export const deriveUpgradePresentation = upgradePresentation;

function luckyVariant(source) {
  const fields = { ...(source.fields || {}) }, comparisons = source.comparisons.map(raw => ({ ...raw }));
  let changed = false;
  const boost = (key, factor, additive = false) => {
    if (!Number.isFinite(fields[key])) return;
    fields[key] *= factor;
    const bar = comparisons.find(x => x.key === key);
    if (bar) bar.after = additive ? number(bar.before) + (number(bar.after) - number(bar.before)) * factor : number(bar.after) * factor;
    changed = true;
  };
  boost('speed', 1.08);
  boost('reach', 1.08);
  boost('score', 1.08);
  boost('blade', 1.12, true);
  if (!changed) return null;
  return Object.freeze({ ...source, lucky: true, fields: Object.freeze(fields), comparisons: Object.freeze(comparisons), luckyStat: 'LUCKY · boosted roll' });
}

/** Deterministic three-card deal. D cards are impossible before a Shatter. */
export function upgradeOffers(seed = 0, wave = 1, {
  shattered = false,
  owned = [],
  luckyTwice = false,
} = {}) {
  const ownedSet = new Set(owned);
  const available = UPGRADE_CATALOG.filter(u =>
    (u.tier !== 'D' || shattered) && (!u.gate || shattered) && !ownedSet.has(u.id));
  let n = ((Number(seed) >>> 0) ^ Math.imul(Number(wave) | 0, 0x9e3779b9)) >>> 0;
  const random = () => {
    n = (Math.imul(n, 1664525) + 1013904223) >>> 0;
    return n / 4294967296;
  };
  const pool = [...available];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  // Preserve the old chooser's readable rhythm: one attack, one handling,
  // one stakes card whenever the filtered pool can supply it. Rebirth and
  // Dimension cards fill a missing lane rather than creating a fourth card.
  const preferred = ['ATTACK', 'HANDLING', 'STAKES'];
  const result = [];
  for (const category of preferred) {
    const pick = pool.find(u => u.category === category && !result.includes(u));
    if (pick) result.push(pick);
  }
  for (const pick of pool) {
    if (result.length >= 3) break;
    if (!result.includes(pick)) result.push(pick);
  }
  // The jackpot room needs a visible door, not a theoretical filter. Once the
  // first Shatter has happened, roughly one in three deterministic deals
  // replaces the stakes slot with a Dimension card. Before it, this branch is
  // unreachable and D remains absent by construction.
  if (shattered && random() < .34) {
    const dimension = pool.find(u => u.tier === 'D' && !result.includes(u));
    if (dimension) result[result.length - 1] = dimension;
  }
  // Lucky is a deterministic roll, not a second random deal. The chooser can
  // show the boosted before→after bars before the pick; the selected clone's
  // fields are the same numbers the simulation later resolves.
  const dealt=result.slice(0,3).map(card=>{
    const chance=luckyTwice?.44:.22;
    if (random() >= chance) return card;
    return luckyVariant(card) || card;
  });
  return Object.freeze(dealt.map(Object.freeze));
}
export const waveUpgradeOffers = upgradeOffers;

export function upgradeById(id) {
  return byId.get(id) || null;
}

export function upgradeFields(upgrade) {
  const source = typeof upgrade === 'string' ? byId.get(upgrade) : upgrade;
  return source ? Object.freeze({ ...(source.fields || {}) }) : Object.freeze({});
}
