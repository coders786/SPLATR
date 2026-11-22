# Chunk 6 — safe control practice and truthful skill-state cues

## Player-facing scope

Added **Learn → Control Practice** and **Pause → Control Practice**. Neither requires quests to be enabled, currency, an unlock, or a selected hybrid. This optional arena uses the real run/physics/input/art stack, with a clearly labelled Field Kit and no enemies or damage.

Three choices:

1. **Full Route:** start without charge, earn pace, launch Hyper, clean-bank for Sonic, make a deliberate fresh launch through the breach, then physically land on the rest platform.
2. **Bank Drill:** Hyper is explicitly precharged for practice. Launch and bank during its real window. A missed window must recharge through moving at target pace.
3. **Breach Drill:** Sonic is explicitly preloaded for practice. Make a fresh launch through the real visible gate and land. Completion is labelled BREACH COMPLETE, not a claim that the whole route was earned.

The arena stays still until the first successful launch. Waiting cannot accumulate gravity-driven pace. Once launched, the normal simulation and recognition rules apply. Holding aim does not earn pace/recharge. Completion freezes the lesson; restart creates a fresh session. No artificial success timer, target teleport, or synthetic success event.

Guidance is outside the canvas, one current action at a time, with live speed/target and charge/window feedback. Drill setup remains visible, especially the two preloads. Native keyboard and pointer controls are the actual createInput implementation, not a practice-only gesture model. Shake is off; reduced visual motion does not disable the simulation.

## Normal-run correction

The fifth-wave HUD previously said BANK DURING HYPER whenever pace was charged, even after a missed surge. Shared `controlCue` now distinguishes:

- building charge;
- next-launch Hyper readiness;
- an active bank window, with simulation seconds remaining;
- moving recharge after a miss, with percentage;
- persistent Sonic and the fresh breach launch;
- platform landing and completion.

Ordinary waves remain ungated by pace. This does not change the breakthrough thresholds, bank validation, speed factors, economy or hybrid recipes.

## Isolation and lifecycle

- New `controlPractice` run/director option creates a zero-enemy fifth-wave practice setup without clearing a fake encounter budget. Ordinary runs still start at wave one with the real enemy budget.
- Practice has no kill ledger, storage object, quest ticket, wallet callback, or reference to the active real run.
- `roundReward` explicitly returns all zeros for practice, and the quest UI rejects practice events defensively.
- Drill preloads live only in the session's run. A new real run starts with no Sonic, shatters or pace charge.
- Opening from Pause leaves the same real run frozen. Closing returns to the same pause dialog; Resume continues that run without a leaked launch.
- `createInput.dispose()` removes all owned window/canvas listeners, cancels capture/buffering/focus, and is idempotent. Each practice restart/close also disposes physics and the renderer's ResizeObserver, cancels its RAF, and resets its clock.
- Visibility changes cancel held/buffered input and reset simulation debt. The practice frame does not advance while hidden.

## Visual issue found and fixed by inspection

Initial screenshots showed the cube clipped in a completed scene and absent in a recharge scene. The session had frozen before the easing camera caught up. Added a practice-only visual framing recovery if the cube leaves safe canvas bounds or falls underneath the radar. It snaps the camera, never the player/gate/physics. Browser assertions now check the projected cube is on-screen with margins and outside the radar. Re-inspected the corrected 550px completion and 860px recharge captures.

The modal's readout is below, not on top of, the arena. At all checked sizes the canvas is at least 260×170, the modal has no scroll, Back remains in bounds, and the action/readout fits. Mobile idle, reduced-motion recharge, route completion, touch shatter and short-landscape pause screenshots were inspected.

## Validation

### Unit and simulation

Final full `npm test`: **471 passing, zero failing** (161.3 seconds with browser suites running concurrently).

`test/control-practice.test.js` covers all cue states; honest missed-window guidance; each isolated preload; no enemies or rewards; no idle farm; default regular wave-one behavior; real default-kit full-route pace/Hyper/Sonic/shatter; one shatter; actual physical rest contact; completion freeze; repeated disposal; and no hold-to-recharge shortcut. The physical-rest fixture places the cube above the real platform and lets physics/contact dwell finish; it is not a test of an unfamiliar player's landing skill.

`test/input.test.js` adds twelve ownership/disposal cycles: every listener removed, refused-shot buffer cancelled, post-disposal fire rejected, repeat disposal harmless.

### Browser gates

- `scripts/control-practice-browser-qa.mjs`: **eight journeys**, 1280×720, 550×720, 390×680, 860×440, full/reduced visual motion. Reduced-motion fixtures also have optional quests OFF. Native direct mouse drag, native arrows/Space, repeated restarts, synthetic document visibility freeze, real production-module full-route simulation, physical platform landing, frozen completion, explicit isolated preloads, actual native tap through a visible breach, missed-surge recharge wording, captured Escape, localStorage equality, no preload carryover into a real run, and native Pause→Practice→Pause→Resume preservation. Modal/canvas/readout/actor/radar bounds and zero JS errors checked.
- The long full-route skill trace in that script is deterministic module-driven simulation, not a human or native-input-only playthrough. Native pointer/keyboard segments are checked separately. Test-only closure access is injected into fetched Vite responses; no production debug hook ships.
- `scripts/control-practice-touch-qa.mjs`: **two Chromium touch-emulation journeys**, 390×680 and 860×440. Native menu taps, OS touchCancel with no launch, direct touch drag, native tap/shatter through the gate, clean close, unchanged saves and zero errors. Not native-device validation.

During fixture development, a post-launch velocity-direction assertion proved timing-sensitive under concurrent CPU load: the cube could have already rebounded. The gate now checks the actual emitted launch angle instead of treating a later velocity sign as the launch direction. Native dialog-close assertions also wait for its asynchronous close lifecycle. No production gameplay rules were weakened to accommodate either fixture.

### Regressions rerun

- Master browser: three sizes, result/button bounds, zero result-panel scroll, retry and zero errors.
- Rest choice: 15 fixtures/five sizes, every choice visible without dialog scrolling.
- Breach input: eight real-app journeys/four sizes, held input/skip/reward/fresh launch safety.
- Breakthrough: eight real-simulation journeys/four sizes/full+reduced, deliberate shatter/rest/cycle reset.
- Discovery Shop: four sizes, hidden unknown recipes, purchase distinct from equip, genuine discovery persistence.
- Speed: five-size HUD, real launch, inactive freeze and fresh retry.
- Clean banks: eight physics scenes/four sizes.
- Build trial chamber: eight full-app journeys/four sizes/full+reduced, comparison/mode isolation, cancellation, no save writes.
- Protected combat audit: 150/150 combat clears; milestone shatters deliberately skipped. Not human skill/balance evidence.

Production single-file build: **651.97 kB, 262.55 kB gzip**; bundle verification passes.

Logs/screenshots regenerate in ignored `.arena/control-practice`, `.arena/control-practice-touch` and the regression-specific folders. No generated captures or build output added to Git. Browser scripts use CHROME_BIN or /tmp/chromium; this workspace also needs LD_LIBRARY_PATH=/tmp/splatr-chrome-libs/lib.

## Limits

No unfamiliar-player study, native touch-device run, new extended soak, retention claim, or frame-time benchmark. The new teaching flow still needs people to demonstrate that its cues are understood, that manual pace/bank/landing success is achievable without developer knowledge, and that leaving practice transfers to normal combat. The automated traces establish operability and isolation, not those human outcomes.
