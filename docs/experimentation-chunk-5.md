# Experimentation, measured feedback, and input safety

## What changed

### A real, controlled practice destination
Shop → select a part → PRACTICE now opens a manual-first trial, without buying or equipping the part. The player can select TRYING ON or EQUIPPED and run three fixed scenarios:

- CUT LANE: aligned light targets for reach and blade duration.
- ARMOR LINE: two armored targets for repeated passes and plate breaking.
- SPLIT LANE: separated heights for coverage rather than raw reach.

Every reset creates a new real run with the same seed, target positions and starting player pose. A trial starts only on the first successful launch and ends after 240 simulation ticks or all targets are defeated. Each practice launch refills edge and clears blade recovery; targets are stationary and incoming player damage is disabled. These practice accommodations are disclosed, not presented as ordinary combat balance.

Results count actual target removals, HP removed, successful launches and simulation duration. Partial armor damage is not called a kill. No fabricated overall power grade or recommended shopping recipe. The comparison keeps only the latest completed result per scenario/loadout/mode for this visit. Manual and automatic trials are separate; partial resets do not overwrite completed results. Closing the chamber discards its results.

The optional auto mode is explicitly a scripted demo, not optimal play. It runs real combat even with reduced visual motion, and never starts automatically on opening. Comparing manual trials does not control for the human's aim or timing; the UI says so.

### Literal loadout tradeoffs
The chamber identifies which selected part is being tried and displays unconditional primary stats: dash, width, reach, blade-window modifier, armor damage, edge, hull and score multiplier. Conditional horizontal/close-range coverage remains explicitly conditional rather than inflating baseline width. Strength and tradeoff are separate. The existing part INFO destination still describes individual powers.

Unknown recipes stay secret. Trials never buy, equip, award credits, advance quests, mark discoveries or change presets. Shop purchases still require a separate equip action. The existing discovery journal only reveals found combinations.

### Useful, evidence-based advice
A pure `runCoaching` model replaces the wave-run debrief's generic cut count with one observation and one practice action. It uses actual launch/kill counts, best pace, clean banks, charge/Sonic/shatter state or sword behavior, not a guessed diagnosis of player intent. No recipe or purchase pressure. Normal waves remain explicitly ungated by Hyper practice.

Rest recommendations can now cite previous hull loss or launches/cuts when suggesting cut grace or a longer window. A one-hull ward and an upcoming armor counter retain higher priority. The LONG EDGE note now describes forward reach instead of incorrectly promising wider contact. Run-wide clean-bank totals/best chains are tracked, including saving the final unfinished wave's best chain on defeat.

## Layout and interaction fixes
- Initial desktop trial comparisons were below the fold. Moved results to the top of the desktop sidebar; mobile puts them immediately after the stage controls.
- Short-landscape canvas is resized proportionally, not object-fit letterboxed, keeping pointer coordinates aligned with the drawing. Browser QA requires at least 260×170 actual canvas bounds.
- Camera follows out-of-lane practice movement in both directions so the cube cannot silently disappear.
- Target HP labels scale to remain legible on the narrow canvas. Inspected the final 390px reduced-motion manual screenshot with surviving targets.
- Optional test/privacy details are disclosures, leaving strength/tradeoff more prominent.
- Completion has a polite screen-reader announcement updated once per finish, not on every animation frame.
- Captured pointers cancel on pointercancel, lost capture, blur and close. Escape during a held practice gesture cannot fire on reopen.
- A new longer reach description exposed five pixels of mobile rest overflow; tightened small-screen footer spacing and reran all rest fixtures.

## Validation on the final implementation

Full `npm test`: **466 passing, zero failing**, 148.0 seconds while browser suites ran concurrently. `npm run build`: **640.80 kB / 259.88 kB gzip**, single-file verification passes.

### Durable new gates
- `test/practice-trials.test.js`: fixed/frozen fixtures, immutable observations, HP vs kills, comparison compatibility, invalid telemetry; real deterministic combat across default plus all 17 signature builds and all three scenarios (54 build/scenario combinations).
- `test/run-coach.test.js`: advice branches, finite telemetry, bounded copy, no purchase/recipe pressure, previous-wave recommendation evidence and safety priorities.
- `test/power-readout.test.js`: literal part/style costs and separate conditional bonuses.
- `scripts/practice-trials-browser-qa.mjs`: **eight full-app journeys**, four sizes (1280×720, 550×720, 390×680, 860×440), full/reduced motion. Opens real Shop, selects an unowned part, tests both loadouts, checks real HP/launch receipts, scenario/mode isolation, no initial demo, pointer cancellation, Escape with captured aim, fresh reopen, visible actors, canvas/dialog/comparison bounds and exact localStorage preservation. Zero page errors.
- `scripts/breach-input-browser-qa.mjs`: **eight full-app input journeys** across four sizes, pointer/keyboard skip. Clears fixture enemies to reach wave five, then checks cancellation of a held arena gesture at clear, dragging away from skip, safe Space/pointer skip, preserved credits/no shatter, held-Space rejection on rest, upgrade-click swallowing and a fresh arena Space launch. Only this test response appends closure access to the Vite-served main module; no debug hook ships in production. Player placement is used to control the physical rest transition.

The initial input fixture raced normal automatic platform landing on the keyboard-skip route. Fixed the fixture by moving the player above the platform immediately after skip before testing a held key into rest; did not weaken production guards or reinterpret a legitimate fresh selection as a game bug.

### Regression gates rerun
- Discovery Shop: four sizes, unknown-combination secrecy, purchase != equip, genuine equipped-mix discovery saved, journal and zero errors.
- Master browser: three sizes, results/buttons in bounds, zero panel scrolling, retry and zero errors.
- Rest layouts: 15 fixtures/five sizes, no dialog scrolling; all choices visible.
- Breakthrough: eight real-simulation journeys/four sizes/full+reduced, actual pace/Hyper/bank, deliberate shatter, physical rest and wave-six reset.
- Speed: five sizes; HUD, Space start, frozen inactive pace and fresh retry.
- Clean banks: eight real-physics scenes/four sizes.
- Protected encounter audit: 150/150 combat clears, no stalls. Milestone breaches deliberately skipped; not evidence of human shatter success.

Screenshots inspected: desktop and short-landscape comparisons; narrow mobile comparison/manual scenes; final reduced-motion mobile HP labels. Logs/screenshots regenerate in ignored `.arena/practice-trials`, `.arena/breach-input` and regression-specific folders. No generated datasets or build output added to Git.

## Limits and next work
No native touch-device test, fresh extended soak, human comprehension/balance/retention study or frame-time benchmark. Manual comparison results are observations, not controlled player experiments. Automated trial scripts do not prove practical usefulness of any build. The next meaningful validation is watching unfamiliar players choose a part, understand its cost, complete a trial and return to combat without recipe guidance.
