# Movement and procedural-contract system

## Design and implementation plan

This is a controlled revision of the existing physics system, not a replacement of Matter or an untested increase of every speed constant. Implemented the following ownership model:

1. **Input intent** — `src/input.js`: captured primary pointer, direct steering, display-space power, return-to-origin cancellation, final assisted vector, 140 ms refusal buffer. Input owns intent; it does not move bodies.
2. **Movement contract** — new `src/movement-model.js`: immutable fixed step, speed/pull/gravity, collision travel budget, launch commitment, ordinary flight envelope, focus, floor, walls, and recharge parameters.
3. **Integration** — `src/physics.js`: Matter normalized velocities, adaptive collision substeps, swept guards, analytic rail contacts, upright body, one gravity application. Imports the shared parameters instead of independently tuning them.
4. **Run controller** — `src/run.js`: spends/refills edges, applies equipment factors, owns launch commitment and post-integration flight envelope, retains existing floor/rail/hyper exemptions and reward gates. Tutorial/field resets clear launch commitment.
5. **Prediction** — pure standalone art engine: simulates the same commitment interval and safety limits, reading the run's immutable flight contract without importing gameplay modules or mutating the run. Keeps the engine's no-import API contract.
6. **Presentation** — actual displacement still drives the speed readout and motion effects; reaction windows and visual effects never grant hidden velocity or score.
7. **Contract ledger and board** — `src/quests.js` / `src/quest-ui.js`: seeded template selection, stable quest IDs, explicit techniques and point rewards, live progress, optional participation and one-shot settlement.

### Movement parameters now centralized

| Rule | Value / behavior |
| --- | --- |
| Simulation step | 60 Hz; monitor refresh does not alter simulation |
| Normal launch ceiling | 42 px/nominal tick |
| Power travel | 176 normalized input units; existing power curve |
| Dead zone | 7 normalized units; direct pointer steering retained |
| Gravity | Matter scale .001, Y 1.35 |
| Collision sample travel | At most 5 px per corner sample |
| Launch commitment | **8 complete physics ticks** before ordinary vertical limits apply |
| Ordinary ascent / fall | −26 / +10 after commitment |
| Held focus | .1 simulation floor; existing easing retained |
| Floor rescue | Upward kick 22; 12-tick ignore window; existing anti-farm logic |
| Wall rebound | .85 keep, 4 hop, 8 ignore; existing earned-boost gates |
| Air recharge | 76 units; floor cooldown/contact exclusion retained |

The concrete speed defect was that a full-power vertical release could be truncated from approximately 42 to 26 upward, or 10 downward, after only one simulation tick. The new commitment window lets the launch visibly happen before ordinary safety limits resume. It does **not** remove collision checks, grant invulnerability, mint an edge, modify enemy speed, or permit infinite bank acceleration. It is measured in simulation ticks, so hitstop does not consume movement time.

Preview must model a *newly requested shot*, therefore it starts with the full commitment window, not the remaining grace of the player's previous shot. Older standalone callers without `flightRules` retain their existing predictor defaults. The physical model and predictor share runtime parameters through run state; default constants inside the self-contained art engine remain compatibility defaults, not a second new gameplay tuning module.

Renamed the options label from **Game speed** to **Reaction pace**, with an explicit description. That setting already controlled automatic reaction windows rather than launch power; pretending it changed velocity obscured the actual behavior.

## Reward-feedback audit

These are implementation-grounded design hypotheses, **not measured dopamine responses or proven retention improvements**:

| Weak point | Observation | Implemented response |
| --- | --- | --- |
| Intent → motion | Immediate vertical limiting weakened a full-power release | Eight-tick commitment and matching prediction |
| Action → progress | Quest toast generally waited until late progress | First-increment and halfway eligibility, existing throttle, visible live goal counter |
| Progress → value | Credits only appeared in the death receipt | Live **ROUND +N CREDITS** forecast; money still settles once at round end |
| Choice → novelty | Several tier/category pools had a single template | Expanded from 14 to 29 stable templates, seeded selection, recent-history avoidance, technique diversity |
| Choice → comprehension | Board emphasized category/tier but hid how to do a task | Selected technique description, accessible instructions on every card, explicit bonus-point labels |
| Completion → payoff | Reward remained implicit until all three were done | Completion toast names the earned bonus, all-done HUD says VAULT OPEN; existing portal/Force payoff retained |

No streak-loss pressure, paid rerolls, loot odds, fake payouts, manipulative near misses, or daily-obligation system was added. More effects and more speed are not assumed to be better.

## Procedural contracts

- `proceduralOffers({seed,bestBand,recent,onboarding})` generates a deterministic 3-category × 3-tier board.
- Stable templates vary target species, count, technique and survival goal. New examples include full-size any-enemy cuts, power cuts after a 75%+ launch, alternate double/triple-cut goals, and shorter/longer airborne goals.
- Every label is at most four words.
- First-run offers retain the familiar starter selection. Later boards use saved round count plus an in-memory offer nonce. Retries keep the same selected contracts.
- Free **NEW OFFERS** changes the board without spending credits or granting progress.
- Recent contracts are avoided when alternatives exist. Repeated techniques within a column are deprioritized. Late species are gated for beginners; target-specific replenishment remains available during live play.
- Selection, hover and progress have distinct states; selected cards show a check and border.
- Power quests require actual full-size cuts after a sufficiently powered dash. Holding aim, empty launches, fragments, paper targets and tutorial events do not pay.
- Optional quest OFF still disables tracking, special spawns, HUD and portals. Guaranteed round CREDITS remain independent.
- Saved Head Starts retain stable IDs and cannot compound from instant retries. Old wallets and quests load compatibly. New history fields are sanitized on load.
- There is no daily clock or network dependency. The seeded grammar is bounded template generation, not arbitrary text generation.

## Verification

- **409/409** tests pass, including the real-renderer long frame suite, floor/portal loops, quest settlement and earlier direction regressions.
- New `test/movement-contract.test.js`: immutable parameters; committed/bounded/banked/hyper envelope states; four launch vectors × 30 integration ticks with prediction error below 1e−6 px; actual `run.tick()` retains the initial launch and restores its bound afterward.
- New `test/procedural-quests.test.js`: 100-seed determinism/diversity, category/tier coverage, beginner gating, history avoidance, short labels, power-cut anti-credit guards and Head Start anti-farming.
- New `scripts/quest-board-browser-qa.mjs`: board generation, free rerolls, three selected contracts, live goal/payout forecast and viewport bounds at **1280×720, 960×640, 550×720 and 860×440**.
- Native Chromium direction fixture still passes 16 mouse/touch gestures through production input, run dash and Matter velocity.
- Real-game rewards/aim four-size fixture passes with the new movement controller.
- Master result/retry gate passes three sizes, including visible-stroke and six-digit-score stress.
- Comic layout gate passes development and single-file production; 630-render mutation/world/mode matrix passes with zero errors.
- Harmony desktop/compact checks pass. Directly inspected board captures at desktop and compact landscape, plus the portrait gameplay HUD; corrected duplicated selection checks and crowded card rows during visual iteration.
- Production single-file build: **529.46 kB / 226.68 kB gzip**. No second server or runtime service added.

### Evidence boundaries

The trajectory assertion covers controlled free flight. Moving enemies, later banks, hitstop, gravity equipment, wells and future collisions are dynamic events, not outcomes the preview promises. The existing adaptive Matter solver and analytic rebounds were retained and regression-tested, not replaced wholesale. Subjective feel and retention still need human playtesting; no new 20-minute soak or native-device playthrough is claimed.

## Reproduce

Use the existing united port-3000 server.

```sh
node --test test/movement-contract.test.js test/procedural-quests.test.js
npm test
npm run build
CHROME_BIN=/tmp/chromium LD_LIBRARY_PATH=/tmp/splatr-chrome-libs/lib node scripts/quest-board-browser-qa.mjs
CHROME_BIN=/tmp/chromium LD_LIBRARY_PATH=/tmp/splatr-chrome-libs/lib node scripts/aim-direction-browser-qa.mjs
```

Local evidence lives under `.arena/physics-contract/` and is intentionally excluded from source snapshots. Durable code, tests and scripts are tracked with the implementation.
