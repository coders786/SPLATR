// Pure quest ledger. Only live simulation events may advance a ticket.
export const POINTS = [10, 25, 60];
const q = (id, category, tier, label, goal, kind, target) =>
  Object.freeze({
    id,
    category,
    tier,
    label,
    goal,
    kind,
    target,
    points: POINTS[tier],
  });
// Small, stable grammar: each lesson has seeded goal variants, not random prose.
const LESSONS = [
 ['SMASH','any','FIRST CUTS','Tap a triangle. Pull back for a stronger launch.',[2,3,4]],
 ['STYLE','power','COMMIT YOUR CUT','Pull farther back, then release through an enemy.',[1,2,3]],
 ['CLIMB','waveClear','CLEAR A WAVE','Cut every enemy. The glowing rest platform appears after the last one.',[1,1,1]],
 ['SMASH','cut','BREAK THE LINK','Cut either purple Prism to switch off its connecting beam.',[1,1,2],'prism'],
 ['STYLE','cleanBank','CLEAN BANK','Launch into a wall at pace. Aim inward before contact to steer your rebound.',[1,2,2]],
 // CHUNK 4: this lesson used to be 'USE THE REST' (kind `waveRest`), which the
 // shipped mode can never emit — the rest chooser was removed from continuous
 // play, so the row was uncompletable and one of nine tutorials was a dead end.
 // It is now the thing a clear actually means here: breaking the sector seal.
 // `waveClear` fires on every seal break and on the Monolith's fall.
 ['CLIMB','waveClear','BREAK THE SEAL','Cut all three anchors, then launch up through the open seam.',[1,1,1]],
 ['SMASH','any','PLAN YOUR LANE','Choose a clear path through enemies instead of releasing into a crowd.',[6,8,10]],
 ['STYLE','paceHeld','HOLD YOUR PACE','Stay above the speed target to charge Hyper. Brief dips allow recovery.',[1,1,1]],
 ['CLIMB','dimensionBreak','BREAK THROUGH','In a break wave, bank during Hyper, then launch through the ready breach.',[1,1,1]],
];
/**
 * CHUNK 5: what a lesson pays.
 *
 * It was 3. Nine lessons — the whole learning ladder — could therefore pay 27
 * credits against a first cosmetic priced at 100, so a player could finish the
 * entire tutorial and own nothing. A lesson is the single most expensive thing
 * to ask of a new player (it is a stranger telling them how to play), and it
 * was priced at 3% of a hat. One board of three lessons now pays close to a
 * cosmetic on its own.
 */
export const LESSON_POINTS = 30;
const learningQuests=LESSONS.flatMap(([category,kind,label,instruction,goals,target],step)=>goals.map((goal,variant)=>Object.freeze({id:`learn-${step}-${variant}`,category,tier:0,label,instruction,goal,kind,target,points:LESSON_POINTS,lesson:true,step:Math.floor(step/3)})));
export const QUESTS = Object.freeze([
  ...learningQuests,
  q('fang5', 'SMASH', 0, '5 FANGS', 5, 'cut', 'fang'),
  q('prism4', 'SMASH', 1, '4 PRISMS', 4, 'cut', 'prism'),
  q('fork2', 'SMASH', 1, '2 FORKS', 2, 'cut', 'fork'),
  q('bastion2', 'SMASH', 2, '2 BASTIONS', 2, 'cut', 'bastion'),
  q('crown1', 'SMASH', 2, '1 CROWN', 1, 'cut', 'crown'),
  q('double2', 'STYLE', 0, '2 DOUBLE CUTS', 2, 'double'),
  q('triple1', 'STYLE', 1, '1 TRIPLE CUT', 1, 'triple'),
  q('drive1', 'STYLE', 2, 'REACH OVERDRIVE', 1, 'drive'),
  q('bounce2', 'STYLE', 2, '2 BOUNCE CUTS', 2, 'bounce'),
  q('sector3', 'CLIMB', 0, 'SECTOR 03', 3, 'sector'),
  q('sector5', 'CLIMB', 1, 'SECTOR 05', 5, 'sector'),
  q('air20', 'CLIMB', 1, '20 SECONDS AIR', 1200, 'air'),
  q('sector7', 'CLIMB', 2, 'SECTOR 07', 7, 'sector'),
  q('clean2', 'CLIMB', 2, '2 CLEAN SECTORS', 2, 'clean'),
  q('cut8', 'SMASH', 0, 'CUT 8 SHAPES', 8, 'any'),
  q('cut18', 'SMASH', 1, 'CUT 18 SHAPES', 18, 'any'),
  q('cut35', 'SMASH', 2, 'CUT 35 SHAPES', 35, 'any'),
  q('prism2', 'SMASH', 0, '2 PRISMS', 2, 'cut', 'prism'),
  q('fang12', 'SMASH', 1, '12 FANGS', 12, 'cut', 'fang'),
  q('fork4', 'SMASH', 2, '4 FORKS', 4, 'cut', 'fork'),
  q('fast3', 'STYLE', 0, '3 POWER CUTS', 3, 'power'),
  q('fast7', 'STYLE', 1, '7 POWER CUTS', 7, 'power'),
  q('fast15', 'STYLE', 2, '15 POWER CUTS', 15, 'power'),
  q('double4', 'STYLE', 1, '4 DOUBLE CUTS', 4, 'double'),
  q('triple3', 'STYLE', 2, '3 TRIPLE CUTS', 3, 'triple'),
  q('air8', 'CLIMB', 0, '8 SECONDS AIR', 480, 'air'),
  q('air12', 'CLIMB', 1, '12 SECONDS AIR', 720, 'air'),
  q('air30', 'CLIMB', 2, '30 SECONDS AIR', 1800, 'air'),
  q('sector2', 'CLIMB', 0, 'SECTOR 02', 2, 'sector'),
]);
/**
 * CHUNK 5: the ladder pays for the ladder.
 *
 * These were 100 / 150 / 200. The first hat cost more than the entire learning
 * ladder could earn (9 lessons x 3 points = 27), so the reward screen's whole
 * promise was unpayable without grinding rounds forever. A full board of
 * lessons now pays ~90, so the first cosmetic lands in about one run and the
 * set is complete in a short session. The shop is still a place to save for —
 * it is just no longer a place to stare at.
 */
export const PARTS = Object.freeze([
  { id: 'halo', label: 'GOLD HALO', cost: 40 },
  { id: 'wings', label: 'PRISM WINGS', cost: 75 },
  { id: 'crown', label: 'CUBE CROWN', cost: 120 },
]);
export function loadProfile(raw) {
  let p;
  try {
    p = JSON.parse(raw);
  } catch {
    p = {};
  }
  const n = (v) => (Number.isFinite(v) ? Math.max(0, Math.floor(v)) : 0);
  return {
    rounds: n(p?.rounds),
    records:{paceTicks:n(p?.records?.paceTicks),banks:n(p?.records?.banks),shatters:n(p?.records?.shatters)},
    learned: Object.fromEntries(['SMASH','STYLE','CLIMB'].map(c=>[c,Math.min(3,n(p?.learned?.[c]))])),
    bestBand: Math.max(1,n(p?.bestBand)),
    recent: Array.isArray(p?.recent)?p.recent.filter(id=>QUESTS.some(q=>q.id===id)).slice(-9):[],
    coins: n(p?.coins),
    unlock: n(p?.unlock),
    // CHUNK 6: durable per-species kill tally. Still read, so a profile from the
    // contract era does not lose its kills when it becomes a deed ledger.
    tally: Object.fromEntries(
      ['kills', 'fang', 'prism', 'fork', 'bastion', 'crown', 'monoliths'].map((k) => [k, n(p?.tally?.[k])]),
    ),
    // CHUNK 8: THE DEED LEDGER — the only lifetime numbers the book reads.
    // `cutsTotal` and `dashesTotal` are seeded from the old tally the first time
    // this profile is loaded, so an existing player does not start from zero on
    // a board that is meant to respect what they have already done.
    total: {
      cutsTotal: n(p?.total?.cutsTotal ?? p?.tally?.kills),
      dashesTotal: n(p?.total?.dashesTotal),
      paceTotal: n(p?.total?.paceTotal),
      seals: n(p?.total?.seals),
      bigKillTotal: n(p?.total?.bigKillTotal ?? (n(p?.tally?.bastion) + n(p?.tally?.crown))),
      deepRuns3: n(p?.total?.deepRuns3),
      deepRuns4: n(p?.total?.deepRuns4),
      monolithsTotal: n(p?.total?.monolithsTotal ?? p?.tally?.monoliths),
    },
    // CHUNK 8: what has been finished, ever. This gates the unlock ladder (a
    // tier 2 deed is not asked of someone who has finished nothing), and it is
    // the book's own record — the reason 120 deeds read as a book and not as a
    // rotating pile of numbers.
    doneIds: Array.isArray(p?.doneIds) ? p.doneIds.filter((id) => typeof id === 'string').slice(0, 240) : [],
    // CHUNK 8: THE BOARD — which three deeds are posted, which have been
    // claimed, how many times the board has been swept, and how the player has
    // done per lane (which is what `focusLanes` leans the next deal toward).
    board: {
      grid: Array.isArray(p?.board?.grid) ? p.board.grid.filter((id) => typeof id === 'string').slice(0, 3) : [],
      board: n(p?.board?.board),
      sweeps: n(p?.board?.sweeps),
      rerolls: n(p?.board?.rerolls),
      claimed: Array.isArray(p?.board?.claimed) ? p.board.claimed.filter((id) => typeof id === 'string').slice(0, 3) : [],
      lanes: Object.fromEntries(
        ['CUT', 'MOTION', 'RHYTHM', 'HUNT', 'DEPTH'].map((l) => [l, { dealt: n(p?.board?.lanes?.[l]?.dealt), done: n(p?.board?.lanes?.[l]?.done) }]),
      ),
    },
    // CHUNK 6: carried-over progress is per-contract (the board's own `claimed`
    // list and the durable tally), not a streak. `streak` is deliberately not
    // loaded any more: sweeps replaced it as the long-term hook.
    owned: PARTS.filter((x) => p?.owned?.includes(x.id)).map((x) => x.id),
    heads: Object.fromEntries(
      QUESTS.map((x) => [
        x.id,
        Math.min(Math.floor(x.goal / 2), n(p?.heads?.[x.id])),
      ]),
    ),
  };
}
export function offers(random = Math.random) {
  return ['SMASH', 'STYLE', 'CLIMB'].map((c) =>
    [0, 1, 2].map((t) => {
      const pool = QUESTS.filter((q) => !q.lesson && q.category === c && q.tier === t);
      return pool[
        Math.min(pool.length - 1, Math.floor(random() * pool.length))
      ];
    }),
  );
}
/** Seeded template grammar: stable IDs preserve per-contract Head Starts.
 * Offers vary goal, target and technique, not just decorative wording. Recent
 * contracts are deprioritized; unavailable late species are gated by mastery.
 * All tiers remain selectable; difficulty never rises because of purchases. */
export function proceduralOffers({seed=1,bestBand=1,recent=[],onboarding=false}={}) {
  if(onboarding)return [['fang5','prism4','bastion2'],['double2','triple1','drive1'],['sector3','sector5','sector7']].map(ids=>ids.map(id=>QUESTS.find(q=>q.id===id)));
  let state=Number(seed)>>>0;
  const random=()=>{state=(Math.imul(state,1664525)+1013904223)>>>0;return state/4294967296;};
  return ['SMASH','STYLE','CLIMB'].map(category=>{const used=new Set();return [0,1,2].map(tier=>{
    const pool=QUESTS.filter(q=>!q.lesson&&q.category===category&&q.tier===tier&&!(bestBand<3&&['crown','fork'].includes(q.target)));
    const fresh=pool.filter(q=>!recent.includes(q.id)),eligible=fresh.length?fresh:pool;
    const technique=q=>q.kind==='cut'?`cut:${q.target}`:q.kind;
    const varied=eligible.filter(q=>!used.has(technique(q))),pool2=varied.length?varied:eligible;
    const picked=pool2[Math.floor(random()*pool2.length)];used.add(technique(picked));return picked;
  });});
}
/** Three automatically selected lessons, matched to demonstrated skills.
 * Re-roll changes practice quantity, never skips an unlearned technique. */
export function learningOffers({seed=1,learned={}}={}) {
 let state=Number(seed)>>>0;
 return ['SMASH','STYLE','CLIMB'].map(category=>{
  const step=Math.min(2,Math.max(0,Math.floor(Number(learned[category])||0)));
  state=(Math.imul(state,1664525)+1013904223)>>>0;
  const pool=learningQuests.filter(q=>q.category===category&&q.step===step);
  return [pool[state%pool.length]];
 });
}
export function questInstruction(quest) {
  if(quest.instruction)return quest.instruction;
  return ({any:'Cut full-size enemies',cut:`Cut full-size ${quest.target}s`,power:'Cut after a 75%+ power dash',double:'Cut two enemies in one dash',triple:'Cut three enemies in one dash',bounce:'Cut enemies just after a rebound',drive:'Chain kills to enter Overdrive',sector:'Reach this sector in one round',air:'Stay airborne without touching down',clean:'Clear sectors without taking damage'})[quest.kind] || 'Complete during live play';
}
export function nextPrize(profile) {
  return (
    PARTS.find((x) => !profile.owned.includes(x.id)) || {
      id: 'chest',
      label: 'CREDIT CHEST',
      cost: 0,
    }
  );
}
export function createTicket(ids, prize, profile) {
  const rows = ids.map((id) => {
    const quest = QUESTS.find((q) => q.id === id);
    if (!quest) throw Error('Unknown quest');
    return {
      ...quest,
      value: Math.min(Math.floor(quest.goal / 2), profile.heads[quest.id] || 0),
      done: false,
    };
  });
  if (rows.length !== 3 || new Set(rows.map((q) => q.category)).size !== 3)
    throw Error('One quest per category');
  const multiplier = rows.every((q) => q.tier === 2) ? 2 : 1;
  let dash = 0,
    launchPower = 0,
    doubleDash = -1,
    tripleDash = -1,
    bounce = 0,
    bounceCuts = 0,
    air = 0,
    clean = 0,
    damaged = false,
    band = 1,
    settled = false,
    granted = false;
  const ticket = {
    rows,
    prize,
    points: rows.reduce((n, q) => n + q.points, 0) * multiplier,
    bonus: multiplier === 2,
    opened: false,
    event(type, d = {}, live = true) {
      if (!live || settled || ticket.opened) return [];
      if (type === 'dash') {dash++;launchPower=Number.isFinite(d.power)?d.power:0;}
      if (type === 'bank' || type === 'floorKick') {
        bounce = 30;
        bounceCuts = 0;
      }
      if (type === 'floorKick') air = 0;
      if (type === 'hurt') {
        damaged = true;
        clean = 0;
      }
      if (type === 'sector') {
        if (d.band > band) {
          clean = damaged ? 0 : clean + (d.band - band);
          damaged = false;
          band = d.band;
        }
      }
      const fresh = [];
      for (const row of rows) {
        let add = 0,
          value = row.value;
        if (type === 'cut' && !d.small && !d.paper) {
          if (row.kind === 'cut' && row.target === d.kind) add = 1;
          if (row.kind === 'any') add = 1;
          if (row.kind === 'power' && launchPower >= .75) add = 1;
          if (
            row.kind === 'double' &&
            d.strokeKills >= 2 &&
            doubleDash !== dash
          )
            add = 1;
          if (
            row.kind === 'triple' &&
            d.strokeKills >= 3 &&
            tripleDash !== dash
          )
            add = 1;
          if (row.kind === 'bounce' && bounce > 0)
            value = Math.max(value, row.start + bounceCuts + 1);
        }
        if (row.lesson && ['waveClear','waveRest','cleanBank','paceHeld','dimensionBreak'].includes(row.kind) && type===row.kind) add=1;
        if (type === 'drive' && row.kind === 'drive') add = 1;
        if (type === 'sector' && row.kind === 'sector')
          value = Math.max(value, row.start + d.band);
        if (type === 'sector' && row.kind === 'clean')
          value = Math.max(value, row.start + clean);
        if (type === 'tick' && row.kind === 'air')
          value = Math.max(value, row.start + air);
        row.value = Math.min(row.goal, value + add);
        if (!row.done && row.value >= row.goal) {
          row.done = true;
          if(row.lesson){
            profile.learned ||= {SMASH:0,STYLE:0,CLIMB:0};
            profile.learned[row.category]=Math.max(profile.learned[row.category]||0,row.step+1);
          }
          fresh.push(row.id);
        }
      }
      if (type === 'cut' && !d.small && !d.paper) {
        if (bounce > 0) bounceCuts++;
        if (d.strokeKills >= 2) doubleDash = dash;
        if (d.strokeKills >= 3) tripleDash = dash;
      }
      if (rows.every((q) => q.done)) ticket.opened = true;
      return fresh;
    },
    tick(live, airborne) {
      if (!live || settled || ticket.opened) return [];
      bounce = Math.max(0, bounce - 1);
      air = airborne ? air + 1 : 0;
      return ticket.event('tick');
    },
    die() {
      if (settled || ticket.opened) return { saved: 0, heads: {} };
      settled = true;
      let saved = 0;
      const heads = {};
      for (const q of rows) {
        const head =
          q.value < q.goal && q.value / q.goal >= 0.5
            ? Math.min(
                Math.floor(q.goal / 2),
                Math.max(1, Math.floor(q.value / 2)),
              )
            : 0;
        profile.heads[q.id] =
          q.value >= q.goal ? 0 : Math.max(profile.heads[q.id] || 0, head);
        heads[q.id] = profile.heads[q.id];
        // Only newly earned progress spills; inherited progress cannot be farmed.
        const earned = Math.max(0, q.value - (q.start || 0));
        if (q.value >= q.goal) saved += q.points;
        else if (earned > 0)
          saved += Math.max(1, Math.floor((q.points * earned) / q.goal));
      }
      profile.unlock += saved;
      return { saved, heads };
    },
    grant() {
      if (!ticket.opened || granted) return false;
      granted = true;
      settled = true;
      profile.coins += ticket.points + (ticket.bonus ? 100 : 0);
      if (prize === 'chest') profile.coins += 100;
      else {
        const part = PARTS.find((p) => p.id === prize);
        if (part && !profile.owned.includes(prize)) {
          profile.owned.push(prize);
        }
      }
      for (const q of rows) profile.heads[q.id] = 0;
      return true;
    },
  };
  for (const q of rows) q.start = q.value;
  return ticket;
}
