# Shatter Arc 6D–6F as-built report

**Validation date:** 2026-11-23 UTC
**Branch:** `arena/875ca01c-splatr`
**Scope:** earned speed, THE WATCH rehearsal, balance/tuning review, and QA evidence.

This is an implementation report, not a claim that the game has been user-tested. The numbers below are the rules currently in the repository.

## 6D — earned speed

### MOMENTUM ledger

- `src/momentum.js` owns a pure three-pip ledger.
- A qualifying enemy cut is measured at `>= 60%` of `MOVEMENT.maxSpeed` (`25.2 px/tick`).
- A qualifying bank is a `cleanBank` certified by `src/clean-banks.js`: a launched, separated, retained rail arrival at or above `wave.pace.target`.
- No floor touch, ordinary rail contact, slow cut, focus frame, practice action, or catalogue action grants a pip.
- The ledger caps at three pips, resets its 840-tick inactivity clock on a fill, and withers one pip per 14 seconds of active silence. Hitstop does not advance the decay clock.
- Two pips hold the ordinary ceiling floor at `1.25 × MAX_SPEED`; three pips relax the Hyper chain gate from 7 to 5. Pips are permission, not free velocity, and are not spent on Hyper entry.

The HUD already exposes the ledger as three diamonds beneath the speed dial. Cut and bank telemetry now carries `speed`/`arrivalSpeed`, `paceTarget`, `paceQualified`, and `momentumEarned` where those fields are meaningful. `cleanBank` additionally reports incoming and exit speed and retention.

### Rebound and steering

- The first Hyper rail boom reads `hitSurface.incomingX/incomingY`, not the already-reflected outgoing vector.
- `diminishingRebound()` pays the full `1.35×` multiplier through 160 px/tick, then uses `1 + 0.35 × (160 / arrival)` above that speed. The result remains capped by the Hyper ceiling.
- Later Hyper bounces do not multiply speed; the one-shot boom is the spectacle and the Hyper budget remains finite.
- Normal focus retains the 0.1 timing floor. At over-speed (`>168 px/tick`) held steering uses the 0.55 floor. Hyper steering retains 1.05 through 75 degrees and no less than 0.90 at a full reversal.
- The physics event contract is split: `world.struck` is the current rail event, while `world.contact` remains debounce memory. This prevents a parked cube from earning or drawing a bank repeatedly.

## 6E — THE WATCH

The shipped teaching dialog (`src/teaching-ui.js`) uses `createTeachingSession({rehearsal:true})`. The compatibility guided adapter remains available to old callers and tests, but the browser lesson surface no longer creates `.teaching-step-*` elements or a NEXT-STEP flow.

Each rehearsal runs a real isolated wave encounter:

- real slasher tells, hazards, links, collisions, blade contacts, and Monolith reach;
- one short phase chip: `WATCH IT.`, `WAIT…`, `NOW.`, `IT MISSED.`, `IT FOUND YOU.`, `CUT IT.`, `REACH IT.`, or `CLEAR.`;
- telegraph dilation at `world.slowScale = 0.32`; reduced-motion rehearsal uses `0.6` and removes the chip transition;
- an actual action changes the live state rather than advancing a script;
- death completes the normal run death path, then silently rebuilds the same encounter;
- `TRY AT SPEED` is exposed only after a real cut or Monolith reach and restarts at 1.0×;
- `controlPractice:true` keeps the session out of kill ledgers, fracture, catalogue upgrades, profile progression, and momentum rewards.

The Monolith rehearsal is intentionally a reach lesson: it uses the SHATTERED arena and ends on the real face distance without granting a boss kill or progression.

## 6F — validation and limitations

### Automated gates run in this branch

- Syntax checks: `src/run.js`, `src/momentum.js`, `src/physics.js`, `src/teaching.js`, `src/teaching-ui.js`, `src/clean-banks.js`, and the new rehearsal test.
- Focused 6D/6E/enemy/physics tests: **46/46 passed** in the latest focused run (including the new `test/watch-rehearsal.test.js` assertions).
- Full `npm test` after the final working-tree edits: **777/777 passed**.
- Production `npm run build` is the remaining final gate after the final focused-test and speed-retry assertions.

The focused coverage includes:

- three-pip cap, decay, retention, relaxed Hyper entry, slow floors, steering retention, real qualified cuts and banks;
- measured-arrival diminishing Hyper rebound;
- real tell/resolve/missed/cut/reach chips;
- `.32` and `.6` telegraph dilation;
- automatic repeat-on-death;
- speed retry;
- Monolith reach;
- no training fracture, momentum, catalogue, or kill-ledger rewards;
- removed step/NEXT-STEP UI source audit.

### Browser-QA limitation

Stable Chromium is not installed at the previously used path (`/opt/google/google/chrome/chrome`) in this environment. No new headed desktop, mobile-landscape, or OS reduced-motion screenshots are being presented as reproduced evidence for this slice. Existing files under `qa-browser/` are historical captures and scripts; they are not current proof of the migrated teaching dialog.

The current evidence therefore proves simulation state, DOM/source wiring, reduced-motion values, input/retry transitions, and regression behavior—not visual comfort, touch ergonomics, frame pacing on a device, or whether a first-time player understands the chips. Those remain explicit browser and playtest follow-ups rather than implied successes.

## Tuning revisit list

1. Recheck `reboundAt=160`, `reboundBonus=0.35`, and the 0.55 over-speed focus floor with headed play.
2. Recheck the 60% cut threshold and wave pace target against real device displacement, especially on slow mobile hardware.
3. Recheck the 14-second pip decay window and whether a player reads the ledger refresh before it withers.
4. Verify the lesson camera/spotlight and chip placement at desktop, narrow mobile, landscape-short, and reduced-motion sizes once Chromium is available.
5. Keep ordinary runs opt-in for catalogue rewards: `createRun` defaults `catalogRewards:false`; training remains no-stakes.
