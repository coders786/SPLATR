/**
 * ══════════════════════════════════════════════════════════════════════════
 *  THE DEED BOOK — 120 authored quests, each with a stated reason to exist.
 * ══════════════════════════════════════════════════════════════════════════
 *
 * ── WHY THIS FILE EXISTS ─────────────────────────────────────────────────
 *
 * The board before this had ~15 contracts, and they were the same deed in
 * different clothes: "slice N things", where N and the species changed. You saw
 * the whole catalogue in two sessions and learned nothing from any of it.
 *
 * The idea here, written down so it cannot drift back:
 *
 *   A quest is a HYPOTHESIS about how to play, and a reward for proving it.
 *
 * Every deed therefore carries three authored fields, and they are required —
 * the test suite refuses a deed without them:
 *
 *   · `lead`  the affordance, in the game's own voice. One line. What to try.
 *   · `why`   THE ARGUMENT. Why this drill exists, what it does to the player's
 *             hands, and why the thing it asks for matters in THIS game (a
 *             momentum fighter where velocity is the weapon and your only
 *             defence is your launch).
 *   · `pays`  what the player keeps afterwards. Usually a habit.
 *
 * The old board's failure was not that its numbers were wrong. It was that
 * nobody could answer "why this quest and not another one". Now that answer is
 * a required field.
 *
 * ── THE GRAMMAR (four axes, not one ladder) ─────────────────────────────
 *
 *   LANE   one of five ways the game is actually played. Each has a colour:
 *          CUT     where the blade lands and what it goes through
 *          MOTION  launches, banks, ceilings, never landing
 *          RHYTHM  pace held, chains kept, pressure sustained
 *          HUNT    which shape you take first, and why order matters
 *          DEPTH   distance, seals and what the stack throws at you
 *
 *   TIER   0 warm-up · 1 a real skill · 2 a run-defining performance.
 *
 *   AXIS   volume  cumulative forever; nothing is wasted
 *          peak    best value this run reached
 *          streak  consecutive actions without a break
 *          moment  a boolean state you got to (Hyper, a flawless clear)
 *
 *   METRIC a key in `DEED_METRICS`, which mirrors counters src/run.js actually
 *          emits. A deed cannot ask for something the game does not observe —
 *          that is how the previous system ended up with an uncompletable row.
 *
 * ── DEALING ─────────────────────────────────────────────────────────────
 *
 * `dealDeeds` is not "pick 3 of 120". It filters to what is completable, never
 * repeats what you already hold, spreads the three slots across DISTINCT lanes
 * and DISTINCT axes (so a board is three different questions), and leans toward
 * the lane you finish least often, so the board teaches instead of flattering.
 * Seeded: a board is stable until it is swept or rerolled.
 *
 * ── PURITY ──────────────────────────────────────────────────────────────
 *
 * No DOM, no canvas, no clock, no storage.
 */

/* ══════════════════════════════════════════════════════════════════════════
   THE LANES
   ══════════════════════════════════════════════════════════════════════════ */

export const LANES = Object.freeze([
  Object.freeze({ id: 'CUT', tag: '/// CUT', accent: '#ff3366', belief: 'Your blade is the only thing the field respects.', teaches: 'Where the cut lands, how wide it is, what it goes through.' }),
  Object.freeze({ id: 'MOTION', tag: '/// MOTION', accent: '#00f0ff', belief: 'You are not standing on ground. You are spending it.', teaches: 'Launches, banks, ceilings, and never landing.' }),
  Object.freeze({ id: 'RHYTHM', tag: '/// RHYTHM', accent: '#dfff00', belief: 'Pace held is power banked.', teaches: 'Keeping speed and chain alive between kills.' }),
  Object.freeze({ id: 'HUNT', tag: '/// HUNT', accent: '#ff9f1c', belief: 'Every shape has one job. Take that job away.', teaches: 'Which enemy dies first, and why order is the weapon.' }),
  Object.freeze({ id: 'DEPTH', tag: '/// DEPTH', accent: '#b388ff', belief: 'The field gets worse. You get better.', teaches: 'Distance, wave clears, and what the field throws at you.' }),
]);

export const LANE_BY_ID = Object.freeze(Object.fromEntries(LANES.map((l) => [l.id, l])));

/**
 * HOW a deed is solved, derived from the metric it reads.
 *
 *   volume  lifetime totals — nothing is wasted, solved by playing
 *   streak  consecutive behaviour without a break (a chain, a stretch)
 *   moment  a boolean state you reached (Hyper, a pristine climb, a rescue)
 *   peak    a best value inside one run — solved by one good run
 *
 * Deriving it means a board can promise "three different questions" and mean
 * it: the dealer never puts three `peak` deeds side by side.
 */
/* THE FOUR AXES — what KIND of question a deed asks, derived from the metric.
   Never authored, or the card's promise and the deed's arithmetic drift apart.

     volume   the long game: a lifetime tally. Play more, and it is nearer.
     streak   an unbroken run. One mistake and the count resets.
     moment   one deliberate stroke or window: an angle you chose, a window you
              hit, a formation you read. Nothing accumulates; you either did
              the thing or you did not.
     peak     a best-in-run tally: how much of it you can fit into one run.

   The dealer promises a board of three DIFFERENT axes, which is only a promise
   the book can keep if each lane offers a spread at every tier — so positional
   and single-stroke deeds are `moment`, not another `peak`. */
const AXIS_OF = Object.freeze({
  /* volume — lifetime */
  cutsTotal: 'volume', dashesTotal: 'volume', paceTotal: 'volume', sealsTotal: 'volume',
  bigKillTotal: 'volume', deepRuns3: 'volume', deepRuns4: 'volume', sectorsEntered: 'volume',
  monoliths: 'volume', flawless: 'volume',
  /* streak — unbroken */
  bankChain: 'streak', airTicks: 'streak', hyperTicks: 'streak', quietTicks: 'streak',
  powerStreak: 'streak', chain: 'streak', airKills: 'streak', paceTicks: 'streak',
  /* moment — one stroke, one window, one choice of angle */
  hyper: 'moment', overdrives: 'moment', monolithSector: 'moment', apex: 'moment',
  runClean: 'moment', hyperApexKills: 'moment', hyperPeak: 'moment',
  doubles: 'moment', triples: 'moment', quads: 'moment', throughcuts: 'moment',
  wideCut: 'moment', upCut: 'moment', heights: 'moment', speciesPair: 'moment',
  /* peak — best-in-run tallies of the ordinary business */
  kills: 'peak', armor: 'peak', marks: 'peak', fang: 'peak', prism: 'peak',
  fork: 'peak', bastion: 'peak', crown: 'peak', bigKill: 'peak', heirKill: 'peak',
  seals: 'peak', sector: 'peak', fastKills: 'peak', powerCuts: 'peak', dashes: 'peak',
  banks: 'peak', cleanBanks: 'peak', bankCuts: 'peak', floorKicks: 'peak',
  lowCut: 'peak', highCut: 'peak', hits: 'peak',
});

/** Pay by lane and tier. HUNT and DEPTH pay most: they cost the most to learn. */
export const DEED_PAY = Object.freeze({
  CUT: Object.freeze([22, 34, 52]),
  MOTION: Object.freeze([24, 36, 54]),
  RHYTHM: Object.freeze([26, 38, 56]),
  HUNT: Object.freeze([26, 40, 58]),
  DEPTH: Object.freeze([28, 42, 60]),
});

/* ══════════════════════════════════════════════════════════════════════════
   THE METRICS CONTRACT

   Each key is a counter src/run.js emits, or a value derived from it in one
   place (`deedMetrics`). A deed may only name a key from this table.
   ══════════════════════════════════════════════════════════════════════════ */

export const DEED_METRICS = Object.freeze({
  /* CUT */
  kills: 'Objects cut this run.',
  cutsTotal: 'Objects cut across every run ever.',
  throughcuts: 'Cuts that carried on past their first victim (shear).',
  armor: 'Plates stripped off bastions and crowns.',
  marks: 'Distinct species cut this run.',
  wideCut: 'Cuts landed within 25° of horizontal.',
  upCut: 'Cuts landed within 25° of vertical.',
  lowCut: 'Cuts landed in the bottom third of the arena.',
  highCut: 'Cuts landed in the top third of the arena.',
  heights: 'How many of high / mid / low you cut in this run (0-3).',
  /* MOTION */
  dashes: 'Launches made this run.',
  dashesTotal: 'Launches made across every run.',
  powerCuts: 'Cuts landed on a 75%+ pull.',
  powerStreak: 'Longest run of consecutive 75%+ pulls.',
  banks: 'Wall contacts that gave speed back.',
  cleanBanks: 'Certified clean banks (at pace, away from the wall first).',
  bankChain: 'Longest run of certified bank-to-bank bounces.',
  bankCuts: 'Cuts landed soon after a bank.',
  hyper: 'Hyper entries this run.',
  hyperTicks: 'Ticks spent inside Hyper.',
  hyperPeak: 'Peak speed recorded inside Hyper.',
  hyperApexKills: 'Cuts landed above 470 speed.',
  airTicks: 'Longest stretch off the floor, in ticks.',
  airKills: 'Cuts landed in one airborne streak.',
  floorKicks: 'Bounces taken off the bottom rail.',
  /* RHYTHM */
  chain: 'Best kill chain this run.',
  paceTicks: 'Longest stretch at or above the pace target.',
  paceTotal: 'Ticks at pace across every run.',
  doubles: 'Launches that took two shapes.',
  triples: 'Launches that took three shapes.',
  quads: 'Launches that took four or more shapes.',
  overdrives: 'Overdrive entries this run.',
  fastKills: 'Kills landed within 20 ticks of the previous kill.',
  quietTicks: 'Longest stretch survived without a kill.',
  /* HUNT */
  fang: 'Fangs cut this run.',
  prism: 'Prisms cut this run.',
  fork: 'Forks cut this run.',
  bastion: 'Bastions broken this run.',
  crown: 'Crowns cut this run.',
  bigKill: 'Armoured shapes (bastions and crowns) cut this run.',
  bigKillTotal: 'Armoured shapes cut across every run.',
  heirKill: 'Fork halves cut this run.',
  monoliths: 'Monoliths felled this run.',
  hits: 'Hits taken this run — used by one deed, whose point is learning from a hit.',
  speciesPair: 'Species pairs completed this run (see deed).',
  /* DEPTH */
  sector: 'Highest sector reached this run.',
  seals: 'Waves cleared this run.',
  sealsTotal: 'Waves cleared across every run.',
  flawless: 'Waves cleared without a hit this run.',
  sectorsEntered: 'Sectors entered this run.',
  deepRuns3: 'Runs that reached sector 3.',
  deepRuns4: 'Runs that reached sector 4.',
  monolithSector: 'Reached a sector containing a monolith (see deed).',
  runClean: 'Highest sector reached WITH NO HITS TAKEN this run (0 if hit).',
  apex: 'Reach sector 7 with flawless waves (see deed).',
});

/* ══════════════════════════════════════════════════════════════════════════
   THE DEEDS — 24 per lane
   ══════════════════════════════════════════════════════════════════════════ */

const d = (id, lane, tier, title, metric, target, lead, why, pays) =>
  Object.freeze({
    id, lane, tier,
    axis: AXIS_OF[metric] || 'peak',
    title, lead, why, pays, metric, target,
    pay: DEED_PAY[lane][tier],
  });

export const DEEDS = Object.freeze([
  /* ═══ CUT · 8 warm-ups ═══ */
  d('cut-firstblood', 'CUT', 0, 'FIRST BLOOD', 'kills', 3,
    'Cut three shapes in the opening sector.',
    'The first three cuts are where a player learns the only rule that matters: the blade leaves on the line you launched on, so aiming and attacking are one decision. Every combo in this game is that rule applied at speed.',
    'Everything after this is an extension of a line you already understand.'),
  d('cut-uptown', 'CUT', 0, 'UPPER TOWN', 'highCut', 5,
    'Land five cuts in the top third of the arena.',
    'High cuts mean you chose to go up, which means you already know that an edge spent on height buys position. New players stay near the floor and never see the open field above them, where the camera has room and the crowds are thinner.',
    'You start reading the top of the screen as a place you can go.'),
  d('cut-downtown', 'CUT', 0, 'DOWNTOWN', 'lowCut', 5,
    'Land five cuts in the bottom third of the arena.',
    'This is the mirror test. Falling is not a failure state here — gravity is the cheapest acceleration in the game, and the bottom third is where a launch costs least.',
    'You stop treating the floor as damage and start treating it as fuel.'),
  d('cut-flatline', 'CUT', 0, 'FLAT LINE', 'wideCut', 4,
    'Land four cuts within 25° of horizontal.',
    'A flat launch is the widest stroke available: the blade sweeps a long axis of the arena and the shear keeps travelling past the first contact. Vertical launches FEEL faster and cut far narrower.',
    'Your default angle changes, and your kills per launch climbs.'),
  d('cut-pillar', 'CUT', 0, 'PILLAR WORK', 'upCut', 4,
    'Land four cuts within 25° of vertical.',
    'Vertical strokes are the answer to a crowd stacked on a ledge: the blade covers the whole column and the release carries upward into whatever stands behind the front shape. Nothing else in the kit reaches a shape that is standing on top of another shape, which is why the field builds ledges.',
    'You gain the one tool horizontal cutting cannot give you.'),
  d('cut-through', 'CUT', 0, 'PASS THROUGH', 'doubles', 2,
    'Take two shapes with one launch.',
    'A double is the first time the game proves the blade is a LINE and not a point. Until it happens you cut by choosing an enemy; after it happens you cut by choosing a direction.',
    'Dense crowds stop being a wall and become a queue.'),
  d('cut-platework', 'CUT', 0, 'PLATE WORK', 'armor', 5,
    'Strip five plates off bastions.',
    'A plate is a two-step plan inside a one-second window: survive the approach, break the guard, then kill. Bastions exist to teach that a single perfect strike is sometimes not enough.',
    'Armour stops being a barrier and becomes a checklist.'),
  d('cut-seam', 'CUT', 0, 'FIRST CLEAR', 'seals', 1,
    'Clear an arcade wave.',
    'Every enemy must fall before the next wave begins. Learn to read the entire field, choose safe attack lanes and finish each target before moving on.',
    'You understand what closing a sector actually requires.'),
  /* ═══ CUT · 10 skills ═══ */
  d('cut-shear', 'CUT', 1, 'SHEAR LINE', 'throughcuts', 4,
    'Land four cuts that carry on past their first victim.',
    'The shear is this game’s hidden multiplier: a released cut continues in a straight line behind the shape it killed. Most players never notice because they aim at one enemy; a player who aims THROUGH the front shape doubles their damage without moving differently.',
    'Aim shifts from "the enemy" to "the line the enemy is standing on".'),
  d('cut-broadside', 'CUT', 1, 'BROADSIDE', 'wideCut', 6,
    'Land six horizontal cuts.',
    'Six flat cuts is not a big number, but it means choosing the angle that also hits, repeatedly, in a field pushing you the other way. Flat is the shot that pays; everything else is the shot that feels fast.',
    'The flat launch becomes your default rather than your lucky one.'),
  d('cut-column', 'CUT', 1, 'COLUMN BREAKER', 'upCut', 6,
    'Land six vertical cuts.',
    'Vertical cutting is the hardest angle to hold because gravity fights it the whole way. Six of them means you can make the arena do something it does not want to do, on purpose, without losing the run doing it.',
    'You gain control of the axis, not just the moment.'),
  d('cut-quad', 'CUT', 1, 'QUAD LINE', 'quads', 1,
    'Take four shapes with one launch.',
    'A quad is not four cuts; it is proof you read a formation and committed to the one line through it. The field builds crowds in lines on purpose, and this is where you start seeing those lines before they finish forming.',
    'Crowds read as geometry instead of danger.'),
  d('cut-platesmith', 'CUT', 1, 'PLATESMITH', 'armor', 12,
    'Strip twelve plates in one run.',
    'Twelve plates is arithmetic rather than luck: reach the armoured shapes repeatedly, land through the guard, survive the return trip. It is the deed that turns "avoid the big ones" into "budget for the big ones".',
    'Armoured enemies become income rather than a tax.'),
  d('cut-museum', 'CUT', 1, 'MUSEUM PIECE', 'marks', 5,
    'Cut five different species in one run.',
    'Every species punishes a different lazy habit — fangs punish standing still, prisms punish ignoring geometry, forks punish single-target thinking. Five in one run means you answered five different problems while moving.',
    'Your play becomes adaptive rather than routine.'),
  d('cut-reaper', 'CUT', 1, 'REAPER LINE', 'throughcuts', 8,
    'Land eight shears in one run.',
    'Eight shears is no longer an accident: it means you aimed into the space behind the enemy every single time, and the field rewarded it with double kills.',
    'The shear becomes your default, and your kill rate roughly doubles.'),
  d('cut-ceiling', 'CUT', 1, 'HIGH COUNTRY', 'highCut', 10,
    'Land ten cuts in the top third of the arena.',
    'Ten high cuts means the upper field is somewhere you work, not somewhere you pass through. Up there the camera is open, shapes are spread out, and the way down is a decision you get to make.',
    'You start using the whole arena instead of the floor.'),
  d('cut-gutter', 'CUT', 1, 'THE GUTTER', 'lowCut', 10,
    'Land ten cuts in the bottom third of the arena.',
    'The bottom third is where the game tries to kill you: floor close, shapes crowding, every mistake ending in a kick you did not plan. Cutting there ten times is learning to fight in the worst real estate on the map.',
    'You fight confidently where the field is most dangerous.'),
  d('cut-airmaster', 'CUT', 1, 'AIR MASTER', 'airKills', 8,
    'Land eight cuts without touching the floor.',
    'Eight cuts in one airborne streak is the first flow deed: a launch that keeps giving, a line you can re-aim mid-air, and the discipline not to land between. It is the closest thing here to a combo.',
    'You learn to treat a launch as a sequence, not a blow.'),
  /* ═══ CUT · 6 performances ═══ */
  d('cut-legend', 'CUT', 2, 'LEGEND LINE', 'quads', 2,
    'Take five shapes with one launch, twice.',
    'Five-wide is the ceiling of the stroke system: it needs a known formation, a line through all five, and enough speed that the shear has not decayed by the last one. There is no luck in it.',
    'You can end a wave with a single decision.'),
  d('cut-sweep', 'CUT', 2, 'BLADE SWEEP', 'kills', 20,
    'Cut twenty shapes in one run.',
    'Twenty cuts in a run is a claim about consistency rather than a good wave. It also forces the player past dying early, because twenty cuts do not fit inside a short run.',
    'Your floor rises permanently.'),
  d('cut-armory', 'CUT', 2, 'FULL ARMOURY', 'armor', 30,
    'Strip thirty plates in one run.',
    'Thirty plates means the run went long and you treated every bastion as a target rather than an obstacle. Most runs end with fewer than ten.',
    'You can farm the hardest shapes in the game for score.'),
  d('cut-diamond', 'CUT', 2, 'DIAMOND CUT', 'heights', 3,
    'Cut a shape high, middle and low in one run.',
    'A composition deed: three launch geometries in one run means you are choosing your line rather than repeating a favourite. No bigger number can ask for that.',
    'You stop having a signature angle and start having a toolkit.'),
  d('cut-shearstorm', 'CUT', 2, 'SHEARSTORM', 'throughcuts', 16,
    'Land sixteen shears in one run.',
    'Sixteen is what it looks like when the line is fully internalised: nearly every kill also kills something else. It is the largest damage upgrade in the game and it is not an item.',
    'Your effective kill rate doubles with no upgrade at all.'),
  d('cut-thousand', 'CUT', 2, 'THE THOUSAND', 'cutsTotal', 400,
    'Reach 400 lifetime cuts.',
    'Four hundred is where the book stops being a tutorial and starts being a record. Everything the CUT lane can ask afterwards assumes this vocabulary, and a player who has it can read any board and pick the two deeds that fit their hands.',
    'The lane opens: harder cut deeds become fair to deal.'),
  /* ═══ MOTION · 8 warm-ups ═══ */
  d('motion-firstlaunch', 'MOTION', 0, 'FIRST LAUNCH', 'dashes', 10,
    'Launch ten times in one run.',
    'The cube cannot walk. Every movement is a slash that costs an edge, so the first lesson is that movement and attack are the same verb. Ten launches is the minimum sample for that to stop being confusing.',
    'You stop looking for a run button. There is not one.'),
  d('motion-wall', 'MOTION', 0, 'OFF THE WALL', 'banks', 1,
    'Bounce off a wall and keep your speed.',
    'A wall does not stop you, it redirects you and gives speed back on contact. New players flinch away from walls; the field is built so the wall is where speed comes from.',
    'You start aiming AT walls instead of avoiding them.'),
  d('motion-fullpull', 'MOTION', 0, 'FULL PULL', 'powerCuts', 5,
    'Land five cuts on a full-pull launch.',
    'Pull distance is your only real control over power, and a full pull is the difference between crossing the field and dying halfway across it. Five of them installs the long pull as a habit.',
    'Your default pull lengthens, and your reach doubles.'),
  d('motion-hop', 'MOTION', 0, 'HOPS', 'airTicks', 120,
    'Stay off the floor for two seconds.',
    'Two seconds is short and it is the whole lesson: leaving the floor costs an edge, and every second airborne is a second the field cannot corner you. Most deaths happen to a player who was standing still.',
    'You learn that standing still is the most expensive move.'),
  d('motion-kick', 'MOTION', 0, 'KICK OFF', 'floorKicks', 3,
    'Take three floor kicks.',
    'The bottom rail is a spring, not a wall. A floor kick is a launch that costs no edge — the most underused mechanic in the game, precisely because it looks like a mistake when it happens.',
    'You gain a movement option that costs nothing.'),
  d('motion-streak', 'MOTION', 0, 'MOMENTUM STREAK', 'banks', 2,
    'Bounce off two walls without landing.',
    'Two bounces in a row is when the arena becomes propulsion: you leave each wall faster than you hit it, so the second arrives sooner than the first. That acceleration curve is the whole movement idea.',
    'You learn speed is built rather than given.'),
  d('motion-aircut', 'MOTION', 0, 'CUT ON THE FLY', 'airKills', 4,
    'Land four cuts while airborne.',
    'Cutting in the air is where the two verbs merge: you are moving because you cut, and cutting because you are moving. A player who only cuts from the floor is playing half the game.',
    'You start cutting during travel instead of at the end of it.'),
  d('motion-coupe', 'MOTION', 0, 'COUPE', 'bankCuts', 3,
    'Cut something within a beat of bouncing off a wall.',
    'Bank-then-cut is the basic combination: the wall returns speed, the cut spends it. Landing the cut while the extra speed is still in the cube is what makes taking the wall worth it at all.',
    'Every bounce becomes a setup instead of an escape.'),
  /* ═══ MOTION · 10 skills ═══ */
  d('motion-hyper', 'MOTION', 1, 'HYPER', 'hyper', 1,
    'Enter Hyper and hold the pace.',
    'Hyper is the game’s thesis: hold your speed above the pace target long enough and the ceiling opens. It is not a pickup, it is a performance you sustain. Entering once rewires what "fast" means.',
    'You learn the pace target is a door, not a score.'),
  d('motion-clean', 'MOTION', 1, 'CLEAN RECOVERY', 'cleanBanks', 3,
    'Land three certified clean banks in one run.',
    'A clean bank is a bank that was not scraped: you separated from the wall, travelled at pace, and arrived with the angle already set. Most wall contacts are panic; these are choices.',
    'Your bounces start arriving where you wanted them.'),
  d('motion-rainmaker', 'MOTION', 1, 'RAINMAKER', 'bankChain', 4,
    'Chain four clean banks without landing.',
    'Four certified bounces in a chain is a rhythm skill: each must retain enough speed to qualify for the next, so the chain dies the instant you choose a bad angle.',
    'You learn to bank for the NEXT wall, not the current one.'),
  d('motion-altitude', 'MOTION', 1, 'ALTITUDE', 'airTicks', 480,
    'Stay off the floor for eight seconds.',
    'Eight seconds is a full commitment: it takes a chain of launches, not one good shot. It also means eight seconds of not being cornered, which is why long-air players take so few hits.',
    'You stop needing the floor.'),
  d('motion-pull', 'MOTION', 1, 'PULL ARTIST', 'powerStreak', 8,
    'Make eight full-pull launches in a row.',
    'A full-pull streak is discipline, not power: the temptation is to panic-dash at half pull and escape something. Eight in a row means you stopped panicking.',
    'Your escapes get as long as your attacks.'),
  d('motion-kicker', 'MOTION', 1, 'FLOOR GAME', 'floorKicks', 10,
    'Take ten floor kicks in one run.',
    'Ten kicks means you are actively using the cheapest movement available. It is also a survival technique: an edge-free launch is always there, so a dry cube is never actually stuck.',
    'Out-of-edge stops being death.'),
  d('motion-pendulum', 'MOTION', 1, 'PENDULUM', 'bankChain', 4,
    'Bounce between walls four times without cutting.',
    'Four bounces with no cut between is pure movement, harder than it sounds: every bounce raises your speed, so the fourth arrives before you have decided what to do with the third.',
    'You can plan a bounce ahead of the one you are in.'),
  d('motion-hypersustain', 'MOTION', 1, 'HYPER SUSTAIN', 'hyperTicks', 120,
    'Spend two seconds inside Hyper.',
    'Entering Hyper is a decision; staying is a discipline. Bounces add speed and quiet moments bleed it, so two seconds inside means you kept feeding the state instead of coasting through it.',
    'Hyper becomes a place you stay rather than a spike you visit.'),
  d('motion-kickstorm', 'MOTION', 1, 'KICKSTORM', 'floorKicks', 15,
    'Take fifteen floor kicks in one run.',
    'Fifteen kicks means you made the bottom rail your engine and fought from a position most players never occupy: just above the floor, moving constantly, paying nothing for it.',
    'You can hold the most dangerous ground indefinitely.'),
  d('motion-marathon', 'MOTION', 1, 'MARATHON', 'dashesTotal', 400,
    'Reach 400 lifetime launches.',
    'Four hundred launches is hours of instinct compressed into a number. At that point pull length, angle and timing are not decisions any more, which frees attention for the fight instead of the controls.',
    'The controls stop costing you attention.'),
  /* ═══ MOTION · 6 performances ═══ */
  d('motion-velocity', 'MOTION', 2, 'VELOCITY', 'hyperPeak', 400,
    'Record a Hyper speed of 400.',
    'Speed above the normal ceiling only exists inside Hyper and only if you keep feeding it. A 400 peak means the player strung bounces together inside the state — the highest expression of the movement system.',
    'You know exactly how fast this game goes and how to get there.'),
  d('motion-skyline', 'MOTION', 2, 'SKYLINE', 'airTicks', 900,
    'Stay off the floor for fifteen seconds.',
    'Fifteen seconds airborne is a whole sector without a reset. It requires replacing the floor entirely with walls and launches — the difference between playing the game and piloting it.',
    'The floor becomes optional.'),
  d('motion-perpetual', 'MOTION', 2, 'PERPETUAL', 'bankChain', 6,
    'Chain six clean banks without landing.',
    'Six certified bounces is the edge of what the wall system allows: every one must retain speed, at the right angle, with a real separation before the next. There is no way to fake it.',
    'You can cross the whole arena without touching down.'),
  d('motion-hyperstorm', 'MOTION', 2, 'HYPERSTORM', 'hyper', 3,
    'Enter Hyper three times in one run.',
    'Three entries means the performance is repeatable. Most players reach Hyper once, by accident, on their best run and never again. Three turns a lucky peak into a skill.',
    'You can call Hyper on demand.'),
  d('motion-apex', 'MOTION', 2, 'APEX', 'hyperApexKills', 1,
    'Cut something at 470+ speed.',
    'Peak speed is not the goal; cutting at it is. At that speed one launch crosses a sector, so the cut becomes a reading test: can you see the line in time to take it?',
    'The fastest thing in the game is now something you aim.'),
  d('motion-thousandmiles', 'MOTION', 2, 'THOUSAND MILES', 'dashesTotal', 1200,
    'Reach 1200 lifetime launches.',
    'Twelve hundred launches is a player who has made the movement system their own. Everything the MOTION lane can ask is fair to ask at this point.',
    'The MOTION lane is open, permanently.'),
  /* ═══ RHYTHM · 8 warm-ups ═══ */
  d('rhythm-held', 'RHYTHM', 0, 'HOLD THE PACE', 'paceTicks', 120,
    'Stay at or above the pace target for two seconds.',
    'The pace target is printed on screen and most players ignore it, which is a shame: it gates Hyper, gates the clean-bank recogniser, and is what the run is actually scored against. Two seconds is enough to feel it working.',
    'You start reading the pace number as a status, not a score.'),
  d('rhythm-double', 'RHYTHM', 0, 'DOUBLE TAKE', 'doubles', 3,
    'Land three double cuts in one run.',
    'A double is the first measurable efficiency in the game: one launch, two kills. Three of them means you are aiming through crowds instead of at them.',
    'Kills per launch starts climbing.'),
  d('rhythm-chain', 'RHYTHM', 0, 'CHAIN FOUR', 'chain', 4,
    'Reach a kill chain of four.',
    'The chain timer is the game’s patience test: it holds only while you keep cutting, so four means four kills close enough together to be one idea.',
    'You learn downtime costs momentum, not just time.'),
  d('rhythm-overdrive', 'RHYTHM', 0, 'OVERDRIVE', 'overdrives', 1,
    'Reach Overdrive.',
    'Overdrive is what a chain becomes when it does not stop: kills inside the window stack until the state flips and every cut is lethal for a while. It rewards sustained pressure over bursts.',
    'You learn what sustained aggression actually buys.'),
  d('rhythm-quick', 'RHYTHM', 0, 'QUICK WORK', 'fastKills', 3,
    'Land three kills within a fifth of a second of each other.',
    'Fast kills are a different skill from many kills: the second target must already be in the blade line when the first dies. That is pre-planning.',
    'You start seeing the next target before the current one dies.'),
  d('rhythm-triple', 'RHYTHM', 0, 'TRIPLE', 'triples', 1,
    'Take three shapes with one launch.',
    'The triple is where the blade first feels like an area instead of a point: three shapes cannot line up in one stroke by accident, and the field builds exactly that line on purpose.',
    'You notice formations before they close on you.'),
  d('rhythm-silence', 'RHYTHM', 0, 'SILENCE', 'quietTicks', 240,
    'Survive four seconds without cutting anything.',
    'Deliberately counter-intuitive: the game rewards pace and chains, so the instinct is to never stop cutting. But a dry launch into a crowd of prisms is how runs end. Four seconds of restraint is the lesson that patience is a skill.',
    'You stop taking shots that cannot work.'),
  d('rhythm-pacework', 'RHYTHM', 0, 'PACE WORK', 'paceTotal', 300,
    'Spend 300 lifetime ticks at pace.',
    'Lifetime pace is the only cumulative metric that measures quality rather than volume: how often you were actually playing the intended state instead of surviving below it.',
    'The board can start assuming you know what pace feels like.'),
  /* ═══ RHYTHM · 10 skills ═══ */
  d('rhythm-chain8', 'RHYTHM', 1, 'CHAIN EIGHT', 'chain', 8,
    'Reach a kill chain of eight.',
    'Eight kills inside one chain window is sustained: at that length you are not finding targets, the targets are arriving into a line you already chose. It is what the field looks like when it is losing.',
    'You can hold a fight open by yourself.'),
  d('rhythm-fastlane', 'RHYTHM', 1, 'FAST LANE', 'fastKills', 10,
    'Land ten fast kills in one run.',
    'Ten kills in quick succession is a pacing skill, not a volume one: it forces you to spend launches early, before the target moves, which is the opposite of the careful approach most new players use.',
    'Your in-fight reaction time improves measurably.'),
  d('rhythm-pace10', 'RHYTHM', 1, 'TEN SECONDS AT PACE', 'paceTicks', 600,
    'Stay at or above the pace target for ten seconds.',
    'Ten seconds above target is the practical gate for Hyper, and it is harder than it sounds: the target rises with the sector, so holding it means growing your speed as the field gets heavier.',
    'Hyper stops being a lucky accident.'),
  d('rhythm-doubledozen', 'RHYTHM', 1, 'DOUBLE DOZEN', 'doubles', 12,
    'Land twelve double cuts in one run.',
    'Twelve doubles means crowd-cutting is fully installed: nearly every launch takes two instead of one, doubling the run’s output without changing how it looks.',
    'Your kill rate is permanently higher than it was.'),
  d('rhythm-overclock', 'RHYTHM', 1, 'OVERCLOCK', 'overdrives', 2,
    'Reach Overdrive twice in one run.',
    'Two Overdrives is a claim about pressure: the state requires sustained killing and it expires, so a second one means you rebuilt the whole engine from scratch mid-run.',
    'You can rebuild momentum from nothing.'),
  d('rhythm-triplethreat', 'RHYTHM', 1, 'TRIPLE THREAT', 'triples', 4,
    'Land four triple cuts in one run.',
    'Four triples is where three-wide strokes stop being lucky. Most triples are one direct cut and two releases, so this also teaches you to aim the line behind yourself.',
    'Your strokes cover crowds instead of touching them.'),
  d('rhythm-patient', 'RHYTHM', 1, 'THE PATIENT HAND', 'quietTicks', 900,
    'Survive fifteen seconds without cutting anything.',
    'Fifteen seconds is a long time in a game this fast, and doing it on purpose is the hardest restraint deed in the book. It also fixes the most common cause of death here: launching into a crowd you cannot cut through.',
    'You gain a brake, which most players never have.'),
  d('rhythm-quadcut', 'RHYTHM', 1, 'QUAD CUT', 'quads', 1,
    'Land a four-wide stroke inside one chain window.',
    'The difference between a four-wide stroke and a four-wide stroke INSIDE a chain is timing: the chain clock is already running, so the crowd has to be read before the previous launch lands. This is the deed that turns reading a formation into reading the next one.',
    'You start planning two strokes ahead instead of one.'),
  d('rhythm-fastline', 'RHYTHM', 1, 'FAST LINE', 'fastKills', 16,
    'Land sixteen fast kills in one run.',
    'Sixteen quick kills is what a run looks like when every launch is spent into a crowd that is already there, rather than chased. It is a decision about where to stand.',
    'You stop chasing targets and start waiting for them.'),
  d('rhythm-marathon', 'RHYTHM', 1, 'RHYTHM MARATHON', 'paceTotal', 1800,
    'Spend 1800 lifetime ticks at pace.',
    'Thirty seconds of lifetime pace sounds small until you measure it: most runs spend the majority of their time below target. Cumulative pace is the most honest skill metric in the game.',
    'The board knows you can hold the state, not just touch it.'),
  /* ═══ RHYTHM · 6 performances ═══ */
  d('rhythm-chain12', 'RHYTHM', 2, 'CHAIN TWELVE', 'chain', 12,
    'Reach a kill chain of twelve.',
    'Twelve kills in one unbroken chain is the field losing control: at that length there is nothing left to react to, every launch is already aimed where the crowd will be.',
    'You can end a wave faster than the field can build one.'),
  d('rhythm-pace30', 'RHYTHM', 2, 'THIRTY AT PACE', 'paceTicks', 1800,
    'Stay at or above the pace target for thirty seconds.',
    'Thirty seconds above a target that keeps rising is Hyper as a lifestyle. Very few runs contain this, and the ones that do are the ones players talk about.',
    'You can hold the fastest state in the game for a whole sector.'),
  d('rhythm-quadmaster', 'RHYTHM', 2, 'QUAD MASTER', 'quads', 3,
    'Land three four-wide strokes in one run.',
    'Three separate four-wide strokes is a different claim from one lucky one: you can build the line on demand, in whatever formation the field offers.',
    'Crowd control stops depending on the crowd.'),
  d('rhythm-tripledigits', 'RHYTHM', 2, 'TRIPLE DIGITS', 'doubles', 20,
    'Land twenty double cuts in one run.',
    'Twenty doubles is a whole sector played at double efficiency — the clearest single evidence that your aim moved from targets to lines.',
    'Your output is double what the field was built for.'),
  d('rhythm-stoic', 'RHYTHM', 2, 'STOIC', 'quietTicks', 1800,
    'Survive thirty seconds without cutting anything.',
    'Thirty seconds without a cut is nearly a sector of deliberate restraint, and the only way to survive it is to be able to dodge without attacking — which means you learned the launch is a movement tool first.',
    'You choose when to attack instead of needing to.'),
  d('rhythm-tempo', 'RHYTHM', 2, 'TEMPO', 'paceTotal', 4000,
    'Spend 4000 lifetime ticks at pace.',
    'Over a minute of lifetime pace. At this point the pace target is not a challenge the player meets, it is the state they live in — which means every other deed in the lane can assume it rather than teach it.',
    'The whole RHYTHM lane is open, permanently.'),
  /* ═══ HUNT · 8 warm-ups ═══ */
  d('hunt-fang', 'HUNT', 0, 'FANG WORK', 'fang', 4,
    'Cut four fangs.',
    'Fangs wind up, then charge, and the charge is faster than reacting. Cutting them means interrupting the wind-up — attacking a threat before it becomes one.',
    'You learn to kill the thing that is about to move.'),
  d('hunt-prism', 'HUNT', 0, 'PRISM WORK', 'prism', 3,
    'Cut three prisms.',
    'Prisms are geometry, not damage: they hold beams that reshape the space you can move through, so cutting them changes the arena itself.',
    'You start treating enemies as terrain.'),
  d('hunt-fork', 'HUNT', 0, 'FORK WORK', 'fork', 3,
    'Cut three forks.',
    'Forks split when they die, so killing one badly makes two problems. Cutting a fork is really positioning: place the split somewhere you can clean up.',
    'You stop making more enemies by killing one.'),
  d('hunt-bastion', 'HUNT', 0, 'BASTION WORK', 'bastion', 1,
    'Break a bastion.',
    'A bastion has a plate: one hit to strip it, another to kill it, both inside a window where it is not attacking. The first enemy that demands a two-step plan.',
    'Armoured targets become routine rather than hazard.'),
  d('hunt-mulch', 'HUNT', 0, 'MULCH', 'monoliths', 1,
    'Defeat the Monolith.',
    'The Monolith holds its ground behind heavy plates. Patient cuts and well-timed banks let you break its defenses without running into its attacks.',
    'You learn to slow down inside a fast game, on purpose.'),
  d('hunt-splitter', 'HUNT', 0, 'SPLIT DECISION', 'heirKill', 2,
    'Cut two fork halves.',
    'Halves are the consequence of the kill, and dealing with them is the difference between efficiency and churn. Skipping them is why fields feel endless.',
    'You start finishing what you start.'),
  d('hunt-ledger', 'HUNT', 0, 'FULL LEDGER', 'marks', 4,
    'Cut four different species in one run.',
    'It is easy to play a whole session against two kinds of enemy and never meet the rest. Four species forces you to fight the field as it is rather than as you remember it.',
    'You know every shape’s answer before it appears.'),
  d('hunt-orders', 'HUNT', 0, 'TARGET ORDER', 'speciesPair', 1,
    'Cut a prism and a fang in the same run.',
    'Two species, two different answers: one wants you to close and interrupt, the other wants you to change the shape of the arena. Doing both means reading the field rather than repeating an opening.',
    'Your opening stops being a habit.'),
  /* ═══ HUNT · 10 skills ═══ */
  d('hunt-fangpack', 'HUNT', 1, 'FANG PACK', 'fang', 12,
    'Cut twelve fangs in one run.',
    'Twelve fangs is a sustained answer to the most aggressive enemy in the game. At that count you are no longer interrupting charges, you are farming the thing that used to scare you.',
    'Fangs stop being a reason to run.'),
  d('hunt-prismweb', 'HUNT', 1, 'PRISM WEB', 'prism', 8,
    'Cut eight prisms in one run.',
    'Eight prisms means the run was spent continuously dismantling the arena’s geometry. Every beam removed is a route opened and a hazard closed.',
    'You can take a sector apart instead of fighting inside it.'),
  d('hunt-forklift', 'HUNT', 1, 'FORKLIFT', 'fork', 8,
    'Cut eight forks in one run.',
    'Eight forks is sixteen halves if you are careless and eight clean kills if you are not. Getting through eight means the position-first habit is installed.',
    'Splits stop being a problem and become free kills.'),
  d('hunt-plateglass', 'HUNT', 1, 'PLATE GLASS', 'bastion', 4,
    'Break four bastions in one run.',
    'Four bastions means armour is a checklist now: strip, kill, move on. It is also where the plate economy clicks, since every plate is score.',
    'You start seeking armoured shapes out.'),
  d('hunt-bounty', 'HUNT', 1, 'BOUNTY', 'crown', 1,
    'Cut a crown boss.',
    'Crowns have two plates, a slow telegraphed attack and repair your health on death. Killing one is the first real boss question: do you have the edge to get in twice, and the nerve to leave when the wind-up starts?',
    'You no longer route around the biggest thing on the field.'),
  d('hunt-zoologist', 'HUNT', 1, 'ZOOLOGIST', 'marks', 6,
    'Cut six different species in one run.',
    'Six species is nearly the whole roster. This cannot be done by playing well at one thing: the run has to be long and varied enough to meet everything the stack throws.',
    'You are never surprised by a new shape again.'),
  d('hunt-heir', 'HUNT', 1, 'THE HEIR', 'heirKill', 6,
    'Cut six fork halves in one run.',
    'Halves are small, fast and worth little, which is exactly why players skip them. Six halves is the deed that teaches follow-through.',
    'You clear a field completely instead of mostly.'),
  d('hunt-order', 'HUNT', 1, 'ORDER OF OPERATIONS', 'speciesPair', 2,
    'Cut a prism and a bastion in the same run.',
    'The prism weakens the ground the bastion stands on. Doing both teaches priority: take the thing that changes the fight before the thing that endures it.',
    'You plan a fight instead of joining one.'),
  d('hunt-monolith', 'HUNT', 1, 'LANDLORD', 'monoliths', 1,
    'Fell a monolith.',
    'A monolith is immovable, it slams, and it does not chase you — a pure patience encounter inside a game about speed. Felling one means you can slow down when the situation asks.',
    'You can fight a war of attrition, not just a blitz.'),
  d('hunt-rescue', 'HUNT', 1, 'SECOND WIND', 'hits', 1,
    'Have a rescue charge save you.',
    'The one deed that pays for failing, deliberately. Taking a hit is the cheapest lesson this game offers: it tells you exactly which telegraph you stopped reading. A player who treats the hit as information stops taking it within a run or two.',
    'You learn from the hit that should have killed you.'),
  /* ═══ HUNT · 6 performances ═══ */
  d('hunt-crownwork', 'HUNT', 2, 'CROWN WORK', 'crown', 3,
    'Cut three crowns in one run.',
    'Three crowns requires the nerve to keep returning to the biggest thing on the field and the edge to survive each two-plate approach. Crowns heal you, so this is a run that sustains itself.',
    'You learn to use the boss as a resource.'),
  d('hunt-completionist', 'HUNT', 2, 'COMPLETIONIST', 'marks', 8,
    'Cut eight different species in one run.',
    'Eight species in a single life means you met, recognised and answered nearly everything in the game without dying. It cannot be done with a favourite opening.',
    'You play the field, not a plan.'),
  d('hunt-armada', 'HUNT', 2, 'ARMADA', 'bigKill', 25,
    'Cut twenty-five armoured shapes in one run.',
    'Twenty-five armoured kills means armour is simply the terrain you fight on. Players who reach this are running sectors by the time most runs end.',
    'The heaviest shapes in the game are your routine.'),
  d('hunt-fangwall', 'HUNT', 2, 'FANG WALL', 'fang', 25,
    'Cut twenty-five fangs in one run.',
    'Twenty-five fangs is sustained dominance over the enemy designed to punish standing still: meeting charges with counter-charges for a whole sector.',
    'Nothing on the field moves faster than your decision to hit it.'),
  d('hunt-demolition', 'HUNT', 2, 'DEMOLITION RUN', 'monoliths', 2,
    'Fell two monoliths in one run.',
    'Two patience encounters inside a speed game, both won. It requires switching tempo deliberately, twice, without losing the run to the switch.',
    'You can change pace on purpose — the mark of a complete player.'),
  d('hunt-menagerie', 'HUNT', 2, 'THE MENAGERIE', 'bigKillTotal', 150,
    'Reach 150 lifetime armoured kills.',
    'A hundred and fifty deliberate choices of the hardest target available. There is no speedrun shortcut and no luck in the number.',
    'The hunt ladder is complete.'),
  /* ═══ DEPTH · 8 warm-ups ═══ */
  d('depth-sector2', 'DEPTH', 0, 'SECTOR TWO', 'sector', 2,
    'Reach sector 2.',
    'Sector one is a warm-up you cannot fail out of. Sector two is the first field built against a player who already knows the verbs, and it is where most runs actually begin.',
    'The stack stops being a corridor and starts being a climb.'),
  d('depth-seal2', 'DEPTH', 0, 'WAVE TWO', 'seals', 2,
    'Clear two sectors in one run.',
    'Two complete waves in one life show that your movement and attacks can hold up against changing enemy formations rather than just one lucky opening.',
    'You understand the loop well enough to plan a run around it.'),
  d('depth-notouch', 'DEPTH', 0, 'NOT A SCRATCH', 'sectorsEntered', 5,
    'Enter five sectors in one run.',
    'A distance deed with no brilliance in it: just not dying, five times, which is its own skill. It is also the point where the board can start assuming you can survive a long field.',
    'You have a survivable baseline to build a run on.'),
  d('depth-sweep', 'DEPTH', 0, 'CLEAN RUN', 'seals', 3,
    'Clear three sectors in one run.',
    'Three clears is a run with a shape to it. Most runs end inside the first two, which means three requires a strategy that survives contact with a changing field.',
    'Your runs have a middle and an end, not just a start.'),
  d('depth-into', 'DEPTH', 0, 'INTO THE STACK', 'monolithSector', 1,
    'Reach a sector with a monolith in it.',
    'Monoliths appear when the field decides the player is surviving too comfortably, so reaching one is the game keeping its side of the bargain: it gets harder because the player got better, not because time passed.',
    'You know the stack is responding to how you play.'),
  d('depth-lifetime', 'DEPTH', 0, 'DEEP LEDGER', 'deepRuns3', 5,
    'Reach sector 3 on five separate runs.',
    'Depth that repeats is the difference between a lucky run and a player. Five trips to sector 3 means the strategy is portable.',
    'Bad runs stop being throwaway.'),
  d('depth-quiet', 'DEPTH', 0, 'QUIET CLIMB', 'runClean', 3,
    'Reach sector 3 with no hits taken.',
    'A clean climb is a different deed from a deep one: every sector you clear untouched tightens what the field is allowed to do to you. It is also the honest test of whether you are reading the telegraphs or just out-running them.',
    'You learn that survival is a plan, not a streak of luck.'),
  d('depth-monolithfield', 'DEPTH', 0, 'MONOLITH FIELD', 'monoliths', 1,
    'Defeat the Monolith.',
    'The Monolith waits behind heavy plates and attacks where you were. Learn its timing, find a clear approach and defeat it to continue the arcade run.',
    'You learn that the way forward is sometimes a fight you start.'),
  /* ═══ DEPTH · 10 skills ═══ */
  d('depth-sector3', 'DEPTH', 1, 'SECTOR THREE', 'sector', 3,
    'Reach sector 3.',
    'Sector three combines problems: mixed species, tighter spacing, and a pace target that outruns a cautious player. Reaching it means you have an answer to more than one kind of pressure.',
    'You have a strategy, not a habit.'),
  d('depth-seal4', 'DEPTH', 1, 'WAVE FOUR', 'seals', 4,
    'Clear four sectors in one run.',
    'Four clears is a long run in a game that punishes standing still: it needs you to keep pace through a sector made of the things that hurt you most.',
    'You can carry a run past where it used to end.'),
  d('depth-flawless2', 'DEPTH', 1, 'THREE CLEAN', 'flawless', 3,
    'Clear three sectors without taking a hit.',
    'Three flawless clears in one run makes the reading skill permanent: at this point you can name what killed you before, which means those deaths are now avoidable.',
    'The difficulty curve bends in your favour.'),
  d('depth-sector5', 'DEPTH', 1, 'SECTOR FIVE', 'sector', 5,
    'Reach sector 5.',
    'Sector five is the first real wall: pace target, density and enemy mix all move at once, and a run that reaches it has survived a genuinely hostile field for a long time.',
    'You have finished the game’s opening act.'),
  d('depth-cleanclimb', 'DEPTH', 1, 'CLEAN CLIMB', 'runClean', 5,
    'Reach sector 5 with no hits taken.',
    'Five sectors untouched is where damage avoidance stops being a reflex and becomes a route: you are choosing which crowds to enter, not just how to leave them.',
    'You start planning around the fights you can skip.'),
  d('depth-untouched', 'DEPTH', 1, 'UNTOUCHED', 'flawless', 2,
    'Clear two sectors without taking a hit.',
    'Two flawless clears is a stronger claim than one: it means the reading habit held across two different enemy mixes, not just a lucky sector.',
    'Your survival stops depending on the sector.'),
  d('depth-deepruns', 'DEPTH', 1, 'DEEP HABIT', 'deepRuns4', 8,
    'Reach sector 4 on eight separate runs.',
    'Eight runs to sector 4 proves depth is a strategy rather than a streak. A player with this can lose three in a row and not care, because the fourth goes far.',
    'Your worst runs stop being short.'),
  d('depth-fiftyseals', 'DEPTH', 1, 'FIFTY WAVES', 'sealsTotal', 50,
    'Reach 50 lifetime clears.',
    'Fifty clears is an honest record of time spent in the loop, and the volume at which the board can start asking for performance instead of survival.',
    'Harder depth deeds become fair to deal.'),
  d('depth-hundredhits', 'DEPTH', 1, 'ONE HUNDRED', 'sector', 4,
    'Reach sector 4.',
    'Sector four is where a clean player and a lucky player stop looking the same: the field has enough density that avoiding damage has to be a plan rather than a reflex.',
    'You can read a crowded sector before entering it.'),
  d('depth-cleanstack', 'DEPTH', 1, 'CLEAN STACK', 'flawless', 4,
    'Clear four sectors without taking a hit.',
    'Four flawless clears means the telegraph language is fluent: you are reacting to wind-ups before they resolve, in a sector designed to catch exactly that habit slipping.',
    'Hits become something that happens to other players.'),
  /* ═══ DEPTH · 6 performances ═══ */
  d('depth-sector7', 'DEPTH', 2, 'SECTOR SEVEN', 'sector', 7,
    'Reach sector 7.',
    'Sector seven is beyond what most players ever see. Every system in the game is running against a player who has survived long enough that the field has stopped holding back.',
    'You have played the whole game.'),
  d('depth-seal8', 'DEPTH', 2, 'WAVE SIX', 'seals', 6,
    'Clear six sectors in one run.',
    'Six clears in one life is a run with no wasted stretches: six complete cycles under a rising pace target. Very few runs contain this.',
    'You can hold a run together for as long as it asks.'),
  d('depth-flawless5', 'DEPTH', 2, 'FIVE CLEAN', 'flawless', 5,
    'Clear five sectors without taking a hit.',
    'The survival system’s apex: every telegraph read correctly for the length of a full session’s play, inside one life. Five sectors is long enough that no single lucky sector can account for it.',
    'Nothing in the early stack can touch you.'),
  d('depth-untouchable', 'DEPTH', 2, 'UNTOUCHABLE', 'runClean', 7,
    'Reach sector 7 with no hits taken.',
    'Seven sectors without a scratch is the survival system’s closed book: at that depth the field is dense, the pace target is high, and every telegraph has a follow-up. Doing it clean means you read all of it.',
    'Hits become something that used to happen to you.'),
  d('depth-longroad', 'DEPTH', 2, 'THE LONG ROAD', 'sealsTotal', 150,
    'Reach 150 lifetime clears.',
    'The book’s long record. It cannot be rushed, bought or shortcut — it is the number a player is quietly proud of when they read their own ledger.',
    'The ladder is complete, and the ledger is yours.'),
  d('depth-apex', 'DEPTH', 2, 'THE APEX', 'apex', 1,
    'Reach sector 7 with five flawless clears in the same run.',
    'The hardest deed in the book: survival skill, depth skill and the stamina to hold both for the length of a full climb, at once.',
    'You have done the thing the game is for.'),
]);

export const DEED_BY_ID = Object.freeze(Object.fromEntries(DEEDS.map((x) => [x.id, x])));

export function deedById(id) {
  const deed = DEED_BY_ID[id];
  if (!deed) return null;
  return { ...deed, accent: LANE_BY_ID[deed.lane].accent, tag: LANE_BY_ID[deed.lane].tag };
}

export function deedPool(lane) {
  return DEEDS.filter((x) => x.lane === lane);
}

/* ══════════════════════════════════════════════════════════════════════════
   METRICS
   ══════════════════════════════════════════════════════════════════════════ */

const num = (v) => (Number.isFinite(v) ? Math.max(0, Math.floor(v)) : 0);

export function deedMetrics({ run = {}, total = {} } = {}) {
  const r = (k) => num(run[k]);
  const t = (k) => num(total[k]);
  const marks = new Set(Array.isArray(run.marks) ? run.marks.filter((x) => typeof x === 'string') : []);
  const heights = new Set(Array.isArray(run.heights) ? run.heights.filter((x) => typeof x === 'string') : []);
  return Object.freeze({
    kills: r('kills'),
    cutsTotal: t('cutsTotal'),
    throughcuts: r('throughcuts'),
    armor: r('armor'),
    marks: marks.size,
    wideCut: r('wideCut'),
    upCut: r('upCut'),
    lowCut: r('lowCut'),
    highCut: r('highCut'),
    heights: heights.size,
    dashes: r('dashes'),
    dashesTotal: t('dashesTotal'),
    powerCuts: r('powerCuts'),
    powerStreak: r('powerStreak'),
    banks: r('banks'),
    cleanBanks: r('cleanBanks'),
    bankChain: r('bankChain'),
    bankCuts: r('bankCuts'),
    hyper: r('hyper'),
    hyperTicks: r('hyperTicks'),
    hyperPeak: r('hyperPeak'),
    hyperApexKills: r('hyperApexKills'),
    airTicks: r('airTicks'),
    airKills: r('airKills'),
    floorKicks: r('floorKicks'),
    chain: r('chain'),
    paceTicks: r('paceTicks'),
    paceTotal: t('paceTotal'),
    doubles: r('doubles'),
    triples: r('triples'),
    quads: r('quads'),
    overdrives: r('overdrives'),
    fastKills: r('fastKills'),
    quietTicks: r('quietTicks'),
    fang: r('fang'),
    prism: r('prism'),
    fork: r('fork'),
    bastion: r('bastion'),
    crown: r('crown'),
    bigKill: r('bigKill'),
    bigKillTotal: t('bigKillTotal'),
    heirKill: r('heirKill'),
    monoliths: r('monoliths'),
    speciesPair: r('speciesPair'),
    sector: r('sector'),
    seals: r('seals'),
    sealsTotal: t('seals'),
    flawless: r('flawless'),
    sectorsEntered: r('sectorsEntered'),
    // Zero hits and N sectors in the same run. A hit ends the claim, which is
    // the point: this cannot be earned by surviving, only by not being touched.
    runClean: num(run.hits) === 0 ? r('sector') : 0,
    deepRuns3: t('deepRuns3'),
    deepRuns4: t('deepRuns4'),
    monolithSector: r('monolithSector'),
    apex: r('apex'),
  });
}

export function deedValue(deed, metrics = {}) {
  if (!deed) return 0;
  const v = metrics[deed.metric];
  return Number.isFinite(v) ? Math.max(0, Math.floor(v)) : 0;
}

export function deedProgress(deed, metrics = {}) {
  const value = deedValue(deed, metrics);
  const target = Math.max(1, deed?.target || 1);
  return Object.freeze({ value, target, fraction: Math.min(1, value / target), done: value >= target });
}

export function deedLabel(deed, metrics = {}) {
  const p = deedProgress(deed, metrics);
  return `${Math.min(p.value, p.target)} / ${p.target}`;
}

/* ══════════════════════════════════════════════════════════════════════════
   THE UNLOCK LADDER

   A book of 120 deeds is worthless if a brand-new profile is dealt THE APEX —
   and it was, before this existed. The first board asked a first-time player to
   reach sector 7 with five flawless clears. That is not difficulty; that is the
   game introducing itself with an impossible sentence.

   The ladder is deliberately shallow and legible:

     tier 0  always dealable. These teach.
     tier 1  after 2 deeds finished anywhere. These test.
     tier 2  after 6 deeds finished anywhere, AND at least one finished in this
             lane — a lane has to have been visited before it can ask for a
             performance.

   Nothing here is a paywall: every gate is cleared by playing, and none of it
   changes what a deed pays. It only decides what is fair to ask TODAY.
   ══════════════════════════════════════════════════════════════════════════ */

export const UNLOCK = Object.freeze({ skill: 2, performance: 6 });

/** Is this deed fair to ask, given how much of the book the player has finished? */
export function deedUnlocked(deed, progress = {}) {
  if (!deed) return false;
  if (deed.tier === 0) return true;
  const done = Math.max(0, Number(progress.done) || 0);
  const laneDone = Math.max(0, Number(progress.lanes?.[deed.lane]) || 0);
  if (deed.tier === 1) return done >= UNLOCK.skill;
  return done >= UNLOCK.performance && laneDone >= 1;
}

/** How many finished deeds (and per lane) before each tier opens. */
export function unlockLine(deed, progress = {}) {
  if (deedUnlocked(deed, progress)) return '';
  if (deed.tier === 1) return `${UNLOCK.skill - (Number(progress.done) || 0)} more deeds to open skills`;
  return `${Math.max(0, UNLOCK.performance - (Number(progress.done) || 0))} more deeds, one in this lane, to open performances`;
}

/* ══════════════════════════════════════════════════════════════════════════
   DEALING
   ══════════════════════════════════════════════════════════════════════════ */

export function stream(seed = 1) {
  let s = (Number(seed) >>> 0) || 1;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

/**
 * Deal a board of three deeds.
 *
 * The constraints ARE the design:
 *   · distinct lanes — three different questions, never three kill counts
 *   · distinct axes  — three `peak` deeds would be one deed three times
 *   · no repeats    — not held, not recent, not `avoid`
 *   · completable   — a finished deed is never posted again
 *   · weighted      — the softest lane is likelier, so the board teaches
 */
export function dealDeeds({ seed = 1, board = 0, open = [], recent = [], avoid = [], metrics = {}, focus = [], lanes = null, progress = {} } = {}) {
  const random = stream((Math.imul((Number(seed) | 0) + 1, 2654435761) ^ Math.imul((Number(board) | 0) + 1, 0x9e3779b9)) >>> 0);
  const excluded = new Set([...open, ...recent.slice(-12), ...avoid]);
  const usableLanes = (lanes || LANES.map((l) => l.id)).filter((id) => LANE_BY_ID[id]);

  // THE FIRST BOARD IS A WARM-UP. Before anything has been finished, only
  // tier-0 deeds are fair to ask — otherwise a brand-new player is handed
  // "reach sector 7 with five flawless clears" as their opening quest, which is
  // exactly what happened before this rule existed.
  const warmed = Math.max(0, Number(progress.done) || 0) > 0;

  const pick = (lanePool, usedAxes, usedIds) => {
    const pool = lanePool.filter((deed) =>
      !excluded.has(deed.id) && !usedIds.has(deed.id) &&
      (warmed || deed.tier === 0) &&
      deedUnlocked(deed, progress) && !deedProgress(deed, metrics).done);
    if (!pool.length) return null;
    const fresh = pool.filter((deed) => !usedAxes.has(deed.axis));
    const source = fresh.length ? fresh : pool;
    const deep = num(metrics.sector) >= 3 || num(metrics.seals) >= 3;
    const weighted = [];
    for (const deed of source) {
      const weight = deed.tier === 0 ? 3 : deed.tier === 1 ? (deep ? 4 : 2) : deep ? 3 : 1;
      for (let i = 0; i < weight; i++) weighted.push(deed);
    }
    return weighted[Math.floor(random() * weighted.length)] || source[0];
  };

  /* LANE ORDER: the lanes you have finished LEAST in come first, then a
     deterministic shuffle inside each group. A player who has only ever taken
     CUT deeds gets a MOTION/RHYTHM/HUNT board next, which is what makes a book
     of 120 deeds read as five different games rather than one. */
  const order = [...usableLanes];
  const seen = (id) => Math.max(0, Number(progress.lanes?.[id]) || 0);
  const groups = new Map();
  for (const id of order) {
    const key = seen(id);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(id);
  }
  const shuffled = [];
  for (const key of [...groups.keys()].sort((a, b) => a - b)) {
    const group = groups.get(key);
    for (let i = group.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [group[i], group[j]] = [group[j], group[i]];
    }
    shuffled.push(...group);
  }
  order.length = 0;
  order.push(...shuffled);
  for (const id of [...focus].reverse()) {
    const at = order.indexOf(id);
    if (at > 0) {
      order.splice(at, 1);
      order.unshift(id);
    }
  }

  const usedAxes = new Set();
  const usedIds = new Set();
  const out = [];
  const deferred = [];
  /* PASS 1 — lanes that can give a FRESH axis are taken first. A warm-up board
     is mostly `peak` deeds, so the only way to keep the board's promise of
     "three different questions" is to spend the lanes that have a streak, a
     moment or a lifetime deed in them, and leave the all-peak lanes for later. */
  for (const laneId of order) {
    if (out.length === 3) break;
    const pool = deedPool(laneId).filter((deed) =>
      !excluded.has(deed.id) && !usedIds.has(deed.id) &&
      (warmed || deed.tier === 0) &&
      deedUnlocked(deed, progress) && !deedProgress(deed, metrics).done);
    if (!pool.length) continue;
    if (!pool.some((deed) => !usedAxes.has(deed.axis))) {
      deferred.push(laneId);
      continue;
    }
    const deed = pick(pool, usedAxes, usedIds);
    if (!deed) continue;
    usedAxes.add(deed.axis);
    usedIds.add(deed.id);
    out.push(deed);
  }
  for (const laneId of deferred) {
    if (out.length === 3) break;
    const deed = pick(deedPool(laneId), usedAxes, usedIds);
    if (!deed) continue;
    usedAxes.add(deed.axis);
    usedIds.add(deed.id);
    out.push(deed);
  }
  if (out.length < 3) {
    const rest = DEEDS.filter((x) => !usedIds.has(x.id) && !excluded.has(x.id) && deedUnlocked(x, progress) && !deedProgress(x, metrics).done);
    for (const deed of rest) {
      if (out.length === 3) break;
      if (usedAxes.has(deed.axis)) continue;
      usedAxes.add(deed.axis);
      usedIds.add(deed.id);
      out.push(deed);
    }
    for (const deed of rest) {
      if (out.length === 3) break;
      if (usedIds.has(deed.id)) continue;
      usedIds.add(deed.id);
      out.push(deed);
    }
  }
  return out.map((deed) => Object.freeze({ ...deed, accent: LANE_BY_ID[deed.lane].accent, tag: LANE_BY_ID[deed.lane].tag }));
}

/** Reroll one slot, preferring the same lane so the board keeps its balance. */
export function rerollDeed({ lane = null, ...rest } = {}) {
  const dealt = dealDeeds(rest);
  const same = lane ? dealt.find((x) => x.lane === lane) : null;
  return same || dealt[0] || null;
}

/* ══════════════════════════════════════════════════════════════════════════
   BOARD
   ══════════════════════════════════════════════════════════════════════════ */

export const SWEEP_BONUS = 80;
export const REROLL_COST = 10;
export const FREE_REROLLS = 1;
export const EMPTY_BOARD = Object.freeze({ grid: Object.freeze([]), board: 0, sweeps: 0, rerolls: 0, claimed: Object.freeze([]) });

export function boardState(state = EMPTY_BOARD, metrics = {}) {
  const grid = (state.grid || []).map((x) => (typeof x === 'string' ? deedById(x) : x)).filter(Boolean);
  const claimed = new Set(state.claimed || []);
  const progress = grid.map((deed) => ({ deed, ...deedProgress(deed, metrics), claimed: claimed.has(deed.id) }));
  const done = progress.filter((p) => p.done);
  const claimable = done.filter((p) => !p.claimed);
  const sweep = grid.length === 3 && progress.every((p) => p.done);
  return Object.freeze({
    grid,
    progress,
    pips: progress.map((p) => p.done),
    done: done.length,
    total: grid.length,
    claimable,
    sweep,
    owed: claimable.reduce((n, p) => n + (p.deed.pay || 0), 0),
  });
}

export function rerollCost(state = EMPTY_BOARD) {
  const used = Math.max(0, Number(state.rerolls) || 0);
  return used < FREE_REROLLS ? 0 : REROLL_COST;
}

/**
 * Which lanes should the board lean toward? The ones whose deeds the player
 * finishes LEAST often, so the board teaches instead of flattering. An unseen
 * lane counts as a gap, not as an average.
 */
export function focusLanes(history = {}, limit = 2) {
  return LANES.map((lane) => {
    const h = history?.[lane.id] || {};
    const dealt = num(h.dealt);
    const done = num(h.done);
    return { id: lane.id, rate: dealt ? done / dealt : 0, dealt };
  })
    .sort((a, b) => a.rate - b.rate || a.dealt - b.dealt)
    .slice(0, Math.max(0, limit))
    .map((x) => x.id);
}
