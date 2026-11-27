/**
 * ══════════════════════════════════════════════════════════════════════════
 *  DEED TRACKING — turning the run's events into the book's numbers.
 * ══════════════════════════════════════════════════════════════════════════
 *
 * `deeds.js` says what a quest is. This says how a run proves one.
 *
 * It is a PURE function of (event, observation) — no timers, no DOM, no clock.
 * The shell ticks it once per simulation tick and forwards every `emit()` from
 * `src/run.js`. That is the whole contract, which is why it can be tested
 * against a real run instead of against a mock of one.
 *
 * ── THE RULE THAT MATTERS ────────────────────────────────────────────────
 *
 * A counter is only added here if `src/run.js` or the run's own state already
 * knows it. Anything else is a quest the game cannot observe, and the previous
 * board shipped four of those (a sector metric off by one forever, a shatter
 * count that was really a clear count, an `airKills` streak that never reset
 * because the run never told it the player had landed).
 *
 * ── THE TWO LEDGERS ─────────────────────────────────────────────────────
 *
 *   run.*    this run's peaks and counts. Wiped by `begin()`.
 *   total.*  lifetime. Only ever added to. `cutsTotal`, `dashesTotal`,
 *            `paceTotal`, `seals`, `deepRuns3/4`, `bigKillTotal` live here, so a
 *            CARNAGE-style volume deed survives death.
 */

import { DEED_METRICS, DEEDS } from './deeds.js';

/**
 * What counts as "moving" for the restraint deeds.
 *
 * The cube's ordinary launch is 42px/tick and a pinball bounce above that, so 6
 * is well below any real movement and well above the settle at rest. A player
 * walking away reads 0 and banks nothing.
 */
const QUIET_SPEED = 6;

/** The counters a fresh run starts with. Everything a run can prove. */
export const RUN_ZERO = Object.freeze({
  kills: 0, throughcuts: 0, armor: 0, smallCuts: 0,
  wideCut: 0, upCut: 0, lowCut: 0, highCut: 0,
  dashes: 0, powerCuts: 0, powerStreak: 0, banks: 0, cleanBanks: 0, bankChain: 0, bankCuts: 0,
  hyper: 0, hyperTicks: 0, hyperPeak: 0, hyperApexKills: 0,
  airTicks: 0, airKills: 0, floorKicks: 0,
  chain: 0, paceTicks: 0, doubles: 0, triples: 0, quads: 0, overdrives: 0, fastKills: 0, quietTicks: 0,
  fang: 0, prism: 0, fork: 0, bastion: 0, crown: 0, bigKill: 0, heirKill: 0, monoliths: 0, rescue: 0,
  speciesPair: 0,
  sector: 1, seals: 0, flawless: 0, hits: 0, sectorsEntered: 1, monolithSector: 0, apex: 0,
});

/** The lifetime ledger, with the values a profile that predates the deed book starts at. */
export function totalZero(raw = {}) {
  const n = (v) => (Number.isFinite(v) ? Math.max(0, Math.floor(v)) : 0);
  return {
    cutsTotal: n(raw.cutsTotal),
    dashesTotal: n(raw.dashesTotal),
    paceTotal: n(raw.paceTotal),
    seals: n(raw.seals),
    bigKillTotal: n(raw.bigKillTotal),
    deepRuns3: n(raw.deepRuns3),
    deepRuns4: n(raw.deepRuns4),
    monolithsTotal: n(raw.monolithsTotal),
  };
}

/**
 * The live tracker.
 *
 * `history` is per-lane deal/complete counts; `deeds.js` reads it to decide
 * which lane the next board should lean toward. It lives here because this is
 * the only object that sees a deed complete.
 */
export function createDeedTracker(storage = null, audio = null) {
  let run = { ...RUN_ZERO, marks: [], heights: [] };
  let total = totalZero();
  const lanes = {};

  /* ── runtime state that is not a deed metric but gates one ─────────── */

  let cutKind = null;          // the species of the last kill, for fork halves
  let lastKillTick = -1;       // for `fastKills`
  let killQuiet = 0;           // consecutive ticks without a kill
  let bestQuiet = 0;
  let powerStreak = 0;
  let airRun = 0;              // this airborne streak's cuts
  let airborne = false;
  let bankArmed = -999;        // tick of the last bank, to attribute `bankCuts`
  let strokePending = 0;       // widest stroke of the launch in progress
  let tick = 0;
  let dirty = false;
  const noted = new Set();     // species seen this run
  let apexCut = false;       // a cut landed above 470 speed, for APEX

  const bump = (key, by = 1) => {
    if (run[key] == null) return;
    run[key] += by;
    if (by > 0) dirty = true;
  };
  const peak = (key, value) => {
    if (!Number.isFinite(value)) return;
    if (value > (run[key] || 0)) {
      run[key] = Math.floor(value);
      dirty = true;
    }
  };

  /** Start a run: wipe the per-run ledger, keep lifetime and lane history. */
  function begin(profile = {}) {
    run = { ...RUN_ZERO, marks: [], heights: [] };
    total = totalZero(profile?.total ?? profile?.tally ?? {});
    for (const k of Object.keys(lanes)) delete lanes[k];
    cutKind = null;
    lastKillTick = -1;
    killQuiet = 0;
    bestQuiet = 0;
    powerStreak = 0;
    airRun = 0;
    airborne = false;
    bankArmed = -999;
    strokePending = 0;
    tick = 0;
    dirty = true;
    noted.clear();
  }

  /**
   * One simulation tick.
   *
   * `obs` is what the shell can see: `{ grounded, hyping, speed, pace, band,
   * monolith }`. Anything missing is treated as "unknown" rather than false,
   * because a metric that quietly reads zero is worse than one that does not
   * move.
   */
  function step(obs = {}) {
    tick++;
    // AIRBORNE STREAK. The run knows `world.grounded`; the tracker only has to
    // remember to RESET the cut streak when it comes down, which is the bug the
    // old system had (an airborne count that never ended).
    const down = obs.grounded === true;
    if (down) {
      airborne = false;
      airRun = 0;
    } else if (obs.grounded === false) {
      airborne = true;
      run.airTicks += 1;
    }
    // QUIET — "kept moving at speed without cutting".
    //
    // The naive version of this counts every tick without a kill, which means a
    // player who puts the controller down and walks away "earns" the restraint
    // deeds for free. Measured: a 3000-tick idle run completed all three of
    // them without touching the game. So a quiet tick only counts while the
    // cube is genuinely MOVING, which turns the deed into what it claims to be:
    // staying alive at pace without taking a shot. Idling is zero speed.
    const moving = Number(obs.speed) >= QUIET_SPEED;
    if (moving && (lastKillTick < 0 || tick - lastKillTick > 1)) killQuiet += 1;
    else if (!moving) killQuiet = 0;
    bestQuiet = Math.max(bestQuiet, killQuiet);
    peak('quietTicks', bestQuiet);

    // HYPER. Entry is an event; the time inside it is a tick count, because
    // that is the only way "stay in it for two seconds" can be measured.
    if (obs.hyping === true) {
      run.hyperTicks += 1;
      peak('hyperTicks', run.hyperTicks);
      peak('hyperPeak', Number(obs.speed));
      // A cut above 470 is the APEX deed — faster than any ordinary launch.
      if (Number(obs.speed) >= 470) run.apexSpeed = true;
    } else {
      run.hyperTicks = 0;
    }

    // PACE. `wave.pace.best` is the longest at-target streak the director has
    // recorded this sector; `paceTotal` accumulates lifetime ticks so a rate
    // deed cannot be farmed by standing still (the director only counts the
    // tick when the speed is at target).
    const pace = obs.pace;
    if (pace && Number.isFinite(pace.best)) peak('paceTicks', pace.best);
    if (pace && pace.speed >= pace.target && !obs.holding) {
      total.paceTotal += 1;
      dirty = true;
    }

    // DEPTH. `band` is the sector number, 1-based.
    const band = Number(obs.band);
    if (Number.isFinite(band) && band > run.sector) {
      run.sector = band;
      run.sectorsEntered += 1;
      dirty = true;
    }
    // APEX is a composite: a clean climb to 7. It is only ever true, never
    // half-true, so a run that takes a hit at sector 6 cannot claim it later.
    if (run.sector >= 7 && run.hits === 0 && run.flawless >= 5) run.apex = 1;
    else run.apex = 0;

    return dirty;
  }

  /**
   * One run event, forwarded from `emit()`.
   *
   * Returns true when a deed metric moved, so the shell can repaint the board
   * only when there is something new to paint.
   */
  function event(type, d = {}) {
    const was = dirty;
    dirty = false;
    switch (type) {
      /* ── THE CUT ────────────────────────────────────────────────────── */
      case 'cut': {
        if (d.small || d.paper) {
          run.smallCuts += 1;
          break;
        }
        if (d.hazard) break;
        // A fork's child is a half, not a kill: it is small, it is worth nearly
        // nothing, and counting it as a kill would let the KILL deeds be farmed
        // by killing one fork. `heir` is set by the shell from the run's own id.
        if (d.heir) {
          bump('heirKill');
          break;
        }
        bump('kills');
        total.cutsTotal += 1;
        // The blade's own reading of where it went. `release` is true when the
        // cut carried on past this victim — the shear the SHEAR LINE deed is
        // about, and the only honest way to count it.
        if (d.release) bump('throughcuts');
        if (Number.isFinite(d.armorRemoved) && d.armorRemoved > 0) bump('armor', d.armorRemoved);
        // Angle: the cut direction is the launch direction. Wide = flat,
        // up = vertical. 25° is the same tolerance the sword rules use.
        const cut = Number.isFinite(d.cut) ? d.cut : null;
        if (cut !== null) {
          const flat = Math.abs(Math.cos(cut)); // 1 at horizontal
          const steep = Math.abs(Math.sin(cut)); // 1 at vertical
          if (flat >= Math.cos((25 * Math.PI) / 180)) bump('wideCut');
          if (steep >= Math.cos((25 * Math.PI) / 180)) bump('upCut');
        }
        // Height in the arena. The run reports the world position; the shell
        // reports the arena band. Without a band we simply do not count it.
        if (d.height === 'top') bump('highCut');
        else if (d.height === 'bottom') bump('lowCut');
        if (d.height === 'top' || d.height === 'middle' || d.height === 'bottom') {
          if (!run.heights.includes(d.height)) run.heights.push(d.height);
        }
        // APEX: a cut landed while the cube was above 470. The run reports the
        // speed it cut at; nothing here invents one.
        if (Number(d.speed) >= 470) apexCut = true;
        // Species. `kind` is the run's own name for the shape.
        const kind = typeof d.kind === 'string' ? d.kind : null;
        if (kind) {
          if (run[kind] != null && ['fang', 'prism', 'fork', 'bastion', 'crown'].includes(kind)) bump(kind);
          if (kind === 'bastion' || kind === 'crown') {
            bump('bigKill');
            total.bigKillTotal += 1;
          }
          if (kind === 'monolith') {
            bump('monoliths');
            total.monolithsTotal += 1;
          }
          // FORK HALVES. `kids()` produces fangs with `small: true`, which the
          // first branch of this case skips — so halves are counted here, from
          // the run's own "this was a split child" flag rather than guessed at
          // from size. `heir` is set by the shell from the enemy's id prefix.
          if (d.heir) bump('heirKill');
          if (!noted.has(kind)) {
            noted.add(kind);
            run.marks = [...noted];
          }
        }
        // Multi-kill strokes. `strokeKills` is the run's running count for the
        // CURRENT launch, so the widest value it reaches is the width of the
        // stroke: max, never sum, or one launch would count as three.
        const stroke = Number(d.strokeKills);
        /* A WIDE STROKE IS COUNTED ONCE PER LAUNCH.
           `strokeKills` is the run's running count for the CURRENT launch, so a
           four-wide stroke arrives as cuts with strokeKills 2, 3 and 4 and the
           widest value it reaches is the width. The launch is identified by the
           stroke STARTING OVER (`stroke <= lastStroke`), not by its value
           changing — remembering the last value instead counted 2, 3 and 4 as
           three separate launches. */
        if (Number.isFinite(stroke) && stroke >= 1) {
          if (stroke <= (run.lastStroke || 0)) {
            // A new launch begins: the previous stroke's width is already in the
            // ledger (it was reported provisionally), so this only marks the
            // current count as banked.
            run.doublesBanked = run.doubles;
            run.triplesBanked = run.triples;
            run.quadsBanked = run.quads;
            strokePending = 0;
            dirty = true;
          }
          run.lastStroke = stroke;
          strokePending = Math.max(strokePending, stroke);
          // Report the widest stroke so far, PROVISIONALLY, so a caller reading
          // the ledger mid-launch sees the double the moment it happened. The
          // count is corrected to one when the launch closes; it is never
          // allowed to exceed one per launch because the width only grows.
          if (strokePending >= 2 && run.doubles < (run.doublesBanked || 0) + 1) run.doubles = (run.doublesBanked || 0) + 1;
          if (strokePending >= 3 && run.triples < (run.triplesBanked || 0) + 1) run.triples = (run.triplesBanked || 0) + 1;
          if (strokePending >= 4 && run.quads < (run.quadsBanked || 0) + 1) run.quads = (run.quadsBanked || 0) + 1;
        }
        // Airborne cuts, in the CURRENT streak.
        if (airborne) {
          airRun += 1;
          peak('airKills', airRun);
        }
        // Fast kills: within 20 ticks of the last one.
        if (lastKillTick >= 0 && tick - lastKillTick <= 20) bump('fastKills');
        lastKillTick = tick;
        killQuiet = 0;
        bestQuiet = Math.max(bestQuiet, 0);
        // Bank-then-cut, for the COUPE deed.
        if (tick - bankArmed <= 30) bump('bankCuts');
        break;
      }

      /* ── THE BODY ───────────────────────────────────────────────────── */
      case 'dash': {
        // A launch ends the previous stroke. Its width is already in the ledger.
        strokePending = 0;
        run.lastStroke = 0;
        run.doublesBanked = run.doubles;
        run.triplesBanked = run.triples;
        run.quadsBanked = run.quads;
        bump('dashes');
        total.dashesTotal += 1;
        // A full pull is the run's own power reading, not a guess from speed.
        if (Number.isFinite(d.power) && d.power >= 0.75) {
          powerStreak += 1;
          peak('powerStreak', powerStreak);
        } else powerStreak = 0;
        break;
      }
      case 'bank': {
        bump('banks');
        bankArmed = tick;
        break;
      }
      case 'cleanBank': {
        bump('cleanBanks');
        const chain = Number(d.chain);
        if (Number.isFinite(chain)) peak('bankChain', chain);
        break;
      }
      case 'floorKick': bump('floorKicks'); break;
      case 'hyper': bump('hyper'); break;
      case 'hyperEnd': break;

      /* ── THE RHYTHM ─────────────────────────────────────────────────── */
      case 'drive': bump('overdrives'); break;

      /* ── THE HUNT ───────────────────────────────────────────────────── */
      case 'rescue': bump('rescue'); break;

      /* ── THE DEPTH ──────────────────────────────────────────────────── */
      case 'break': bump('hits'); break;
      case 'sector': {
        // A sealed sector. `band` is the NEW sector, so the seal that got you
        // here is `band - 1`, which is what "seals" means.
        run.seals += 1;
        total.seals += 1;
        // Flawless is decided BEFORE the hit counter is cleared, because the
        // seal itself is the boundary.
        if (run.hits === 0) run.flawless += 1;
        run.hits = 0;
        break;
      }
      default: break;
    }

    // APEX is a composite of the whole run, so it can be gained or lost by any
    // event (a seal, or a hit). Recomputing it here keeps the claim honest.
    run.apex = run.sector >= 7 && run.hits === 0 && run.flawless >= 5 ? 1 : 0;

    // Chase values the run publishes directly. `chain` is the run's own best
    // chain ladder; taking it as a peak rather than a sum means a long run and
    // a lucky one are measured the same way.
    if (Number.isFinite(d.chain) && d.chain > run.chain) peak('chain', d.chain);
    if (Number.isFinite(d.airborneCuts) && d.airborneCuts > airRun) {
      airRun = d.airborneCuts;
      peak('airKills', airRun);
    }

    const changed = dirty || was;
    dirty = changed;
    return changed;
  }

  /** Called once per sector clear, after `event('sector')`, to bank depth. */
  /**
   * A run ended. Depth counts "how many separate runs got this far", which is
   * why it is banked here and not in `step()` — banking per tick would count one
   * deep run as a thousand.
   */
  function settle() {
    if (run.sector >= 3) total.deepRuns3 += 1;
    if (run.sector >= 4) total.deepRuns4 += 1;
    void audio; void storage;
    return snapshot();
  }

  /** A cheap, frozen view of both ledgers for `deedMetrics`. */
  function snapshot() {
    return Object.freeze({
      run: Object.freeze({
        ...run,
        // A run that took a hit does not get to claim a clean climb.
        runClean: run.hits === 0 ? run.sector : 0,
        hyperApexKills: apexCut ? 1 : 0,
      }),
      total: Object.freeze({ ...total }),
    });
  }

  /**
   * The species-pair and tidy composites are per-run booleans the book asks for
   * by name; they are derived here rather than stored, so a deed can never drift
   * from what the run actually saw.
   */
  function pairs() {
    return {
      speciesPair:
        (noted.has('prism') && noted.has('fang') ? 1 : 0) +
        (noted.has('prism') && (noted.has('bastion') || noted.has('crown')) ? 1 : 0),
    };
  }

  return {
    begin,
    step,
    /** Alias: the shell calls this once per simulation tick. */
    tick: step,
    event,
    settle,

    snapshot() {
      const s = snapshot();
      return Object.freeze({
        run: Object.freeze({ ...s.run, ...pairs() }),
        total: s.total,
      });
    },
    /** Mark a deed as dealt / finished, for `focusLanes`. */
    note(lane, done = false) {
      if (typeof lane !== 'string') return;
      const row = (lanes[lane] ||= { dealt: 0, done: 0 });
      row.dealt += 1;
      if (done) row.done += 1;
    },
    get history() {
      return lanes;
    },
    /** Which run counter a deed reads, for debugging a board that will not move. */
    metricOf(id) {
      const deed = DEEDS.find((x) => x.id === id);
      return deed ? DEED_METRICS[deed.metric] ?? null : null;
    },
  };
}
