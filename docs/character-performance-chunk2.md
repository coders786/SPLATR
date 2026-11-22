# Unified redesign — Chunk 2: character performance and progressive cuts

## Scope

Continues Chunk 1's construction redesign. This chunk coordinates presentation from existing state; it does not add gameplay state, collision geometry, attack reach, damage rules, recipes, prices or save fields. Chunk 3 (hybrid/world-wide art-direction cleanup) remains separate.

## Shared performance

Added import-free, pure `resolveCharacterPerformance(input, time)` returning a frozen descriptor for idle, aim, release and recovery. It derives focus, charge, release, recovery, CORE compression, contact response and secondary-motion lag from existing aim, speed and normalized attack lifetime. Contact is explicit, never inferred from a slash endpoint.

- Gameplay supplies existing blade lifetime and existing surface-contact records.
- Lab supplies existing cut/impact age and dummy contact records.
- Legacy `attack` poses remain supported.
- Eyes and CORE consume the same resolved performance; secondary tails receive the same release/recovery lag.
- Reduced motion suppresses release/lag/contact accents while keeping static aiming intent.

Eyes concentrate during aim/release and ease back during recovery. Idle scan/reticle/glitch behavior is restrained. COREs no longer share a universal rotor: Grav orbits, Magnet keeps fixed poles with a moving internal field, Time advances in steps, Riot compresses/releases, Echo follows recovery, Glass uses restrained facet movement. CORE housing remains fixed. Cloth trails release; chain oscillation and wing breathing are reduced; thruster response is concentrated around action.

## Progressive slash

Added pure `resolveSlashSweep(progress, style, reducedMotion)` exposing the visible head/tail interval and width independently of opacity.

- The head advances on the original quadratic path.
- Recovery trims the tail and reduces thickness instead of fading a complete duplicate.
- Katana reveals faster; Laser remains narrow; Blood uses an offset secondary ribbon; Pixel uses quantized visible fragments; Glitch uses short sweep-bound offsets.
- A moving leading-edge mark is not an impact burst.
- Removed automatic endpoint bursts and Katana endpoint specks. Optional explicit `contact: {x,y}` draws an impact at a supplied real point only. Existing actual-contact effects remain in their original callers.
- Automatic lab impact particles are gated until the scripted dummy contact, rather than appearing during the early sweep.
- Unspecified progress uses a complete static cut, preserving old card/Best-Stroke/legacy calls; explicit gameplay/lab progress animates the interval.

`drawSlashEffect` accepts the optional contact point; existing arguments still work. `HeroSpec.pose.attackProgress` is normalized existing lifetime, with -1 meaning no active attack. No new clocks, physics writes, DOM access or imports were introduced.

## Verification

- Final `npm test`: **385 passed, 0 failed**, 77.58 seconds.
- Final single-file production build: **519.59 kB**, gzip **223.46 kB**; bundle verification passed.
- Final Chromium dev + single-file production layout gates passed, including compact viewport bounds.
- Dedicated Chromium sequence: **40 frames × 4 styles**, covering idle, aim, release and recovery; no page errors or Canvas state leaks. Captured as PNG frames and an animated GIF in ignored `.arena/performance/`.
- Directly inspected aim, early-release and late-recovery captures; the late remnant is visibly shorter and thinner, and the miss has no endpoint explosion.
- During this chunk: 630-render recipe/world/action matrix, reduced-motion/native pointer/Space/cancellation/focus/try-on, harmony/Codex/wallet, Manual/live-game/Best-Stroke checks all passed.

`test/character-performance.test.js` checks frozen deterministic state, distinct aim/release/recovery signals, explicit-only contact, monotonic advancing head/trimming tail for all eight styles, zero remaining interval at the end, reduced-motion stability and Canvas state preservation. Existing localized eye-motion, material construction, gameplay and save tests continue to pass.

## Reproduce

Against the existing port-3000 dev server:

`CHROME_BIN=/path/to/chromium node scripts/character-performance-browser-qa.mjs`

Optional GIF assembly with ImageMagick:

`convert -delay 7 -loop 0 .arena/performance/frames/*.png .arena/performance/performance.gif`

The sequence is a deterministic art study, not a claim of a recorded live gameplay hit. Actual native-input and game-surface checks are listed separately above.

Authoritative complete source: `src/art/splatr-art-engine.js`.
