# Chunk 1 — Understandable speed foundation

## Scope

Implements the first chunk of the unified speed/mastery plan: measured movement speed, a rising minimum target, recoverable pace practice, and preservation of immediate retry/direct aiming. This is a foundation, not the completed dimension-shattering mode.

**Pace practice is not a wave-clear requirement in this chunk.** Finite combat still clears when all real enemies and Fork children are defeated. This deliberately avoids shipping an uncalibrated speed gate or a last-enemy softlock. Hyper/Sonic transitions, breach mechanics, dimensional VFX, speed-dependent kill rewards and the proposed per-enemy currency overhaul are not implemented here. Existing systems remain intact.

## Rules

- New pure, import-free `src/speed-pace.js` returns copied state and never writes physics, equipment or storage.
- Wave one target: 18 pixels per nominal simulation tick (1080 px/s). Each wave raises the target by 1.5 px/tick (90 px/s), capped at 30 px/tick (1800 px/s). These are prototype tuning values, not human-calibrated thresholds. The default maximum launch remains 42 px/tick; no movement-speed or aiming contract was changed.
- Live sampling uses actual post-integration displacement, normalised by simulation time, bounded by current velocity magnitude. A non-moving body with a velocity value cannot earn pace credit from that value alone.
- Numeric display uses short simulation-time exponential smoothing (~0.1 seconds). The eligibility comparison uses the unsmoothed sample, so a fading display cannot generate phantom progress. Units are px/s, not fictional km/h or literal light speed.
- Pace practice requires 180 accumulated above-target simulation ticks (three simulation seconds). A dip preserves progress for 45 simulation ticks. Beyond that, unfinished progress drains at 0.35 ticks per below-target tick, not an instant reset. Resuming pace resumes progress. Continuous/recoverable sequence best is recorded separately.
- A completed practice milestone stays completed for that wave; the next wave starts fresh at its higher target. It is not currency or permanent power.
- Holding aim cannot earn progress and eventually drains unfinished progress after the same grace window. Slow time advances the model proportionally, not in wall-clock time. Inactive calls freeze state; actual game pause/backgrounding must not call live simulation. Entry grace, tutorials, ready/death states, rest and reward selection cannot earn pace progress.

## UI

- Existing compact wave panel now includes an actual-speed marker, a distinct amber target tick, contrasting above-target track, numeric speed, target label, status and practice percentage.
- Statuses: Release to Build Speed, Get Ready, Build Speed, Hold the Pace, Recover Your Pace, Pace Held.
- The legacy speed dial is hidden in wave mode to avoid conflicting speed units and duplicate gauges. Non-wave mode retains it.
- Track scale is fixed, so the target does not jump as the player accelerates. Out-of-scale speeds retain an honest numeric value while the marker saturates. Accessible meter text reports the actual displayed speed and target.
- Clear report records pace best alongside existing cuts/launches/time/damage information. Completed practice does not replace the actual combat-clear condition.
- No animated meter transitions or new camera effects. Reduced-motion gameplay information is unchanged.

## Verification

- Full Node suite: **437 passed, zero failures**, 83.2 seconds.
- Five new deterministic tests cover target escalation/cap, immutable model updates, actual versus smoothed speed, brief-dip grace, gradual drain/recovery, retained milestone, focus no-credit, inactive freeze, slow-time equivalence, invalid numeric inputs, real-run sampling, rest no-credit, fresh next-wave state, and clear without pace completion.
- `scripts/speed-foundation-browser-qa.mjs` passes against the real app at 1280×720, 960×640, 550×720, 390×680 and 860×440: HUD visibility/bounds, no horizontal overflow, no duplicate legacy dial, Space starts, correct target and zero JavaScript errors. A production-module fixture also verifies an actual left launch earns measured progress and fresh retry state starts at zero.
- `scripts/master-browser-qa.mjs`: real-browser results/buttons/retry checks pass at desktop, phone and landscape, zero panel scrolling and JavaScript errors.
- `scripts/rest-choice-layout-browser-qa.mjs`: fifteen fixtures across five sizes still pass, including narrow phone, ward, long receipts and milestone roster.
- Screenshots visually inspected: live desktop, narrow phone and landscape. Player and threats remain visible; speed panel shows numeric units and the target band. Target/needle shapes were differentiated further after this review.
- Production build before final marker-only CSS polish: 608.14 kB / gzip 249.39 kB; self-contained single file 593.9 KiB. Final build command output is authoritative.

Reproducible scripts/tests and this document are durable. Scratch screenshots/logs are in `.arena/speed-foundation/` and excluded from durable snapshots.

## Next validation / next chunk

Test unfamiliar players on identifying the target, deliberately changing speed and recovering after a dip. Automated tests do not prove comprehension, enjoyment, fair difficulty, or retention. No human learnability study, native-device run, or new long soak is claimed.

Next implementation chunk: clean-bank detection/steering and feedback, then environmental reactions, followed by a calibrated five-wave breakthrough condition. Do not make pace mandatory until the finish path remains possible after the last enemy and unprotected play demonstrates the target is fair.
