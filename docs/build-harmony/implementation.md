# Completed-build harmony

## Delivered

All **17 completed named recipes** now share a build-owned visual language across **summoning, dash, primary attack, power release and confirmed kill**. It layers on top of the previous item-specific slash/dash/core work rather than replacing each ingredient with one generic aura.

`resolveBuildHarmony` uses the same completed-recipe selection and specificity priority as combat. Mixed/incomplete loadouts have no named-build layer. Nested motif geometry is frozen. The recipe color leads; one smaller core-colored inlay connects the build back to its installed core.

| Build | Shape and choreography |
|---|---|
| Laser Wyrm | Segmented zig fins on serpentine paths |
| Ink Ronin | Unequal brush fragments, diagonal movement and falling paper |
| Void King | Crown teeth, inward-sinking fragments |
| Cyber Phantom | Offset projection brackets, quantized phase displacement |
| Mecha Reaper | Hook-shaped fragments on a scything turn |
| Star Eater | Asymmetric star fragments contracting inward |
| Apex Sun | Outward-facing ray wedges and gold fragments |
| Glacier Crown | Hourglass facets, separated cool crystal fans |
| Spectral Briar | Branching thorn forks and curling paths |
| Arc Sentinel | Square rail fragments, two organized channels |
| Arcade Sovereign | Pixel crowns and grid-snapped movement |
| Storm Conductor | Forked bolts with angular lateral displacement |
| Furnace Regent | Filled heavy slag plates, ballistic falling motion |
| Chrono Wraith | Hooked clock traces on reverse-turning paths |
| Rescue Paladin | Shield-shaped plate fragments in an ordered release, not a new shield |
| Glass Shogun | Narrow triangular needles in a precise fan |
| Prism Oracle | Prismatic crescents moving on elliptical paths |

The incoming summon and outgoing kill treatments use each build's trajectory language, not just a differently colored radial spray. The dash is rear-owned; attack accents follow the actual weapon. Power release stays close to its source rather than inventing a new screen-wide attack.

## Production event ownership

- **Dash:** called by the shared elemental dash renderer with existing committed launch angle, age, motion gate and equipment.
- **Primary attack / release:** called by the actual active sword, using the existing blade/release age. No idle charge or aim-only power is inferred.
- **Secondary power:** called only inside `drawSwordAttack`'s already-fired branch. Pending Echo/Pulse telegraphs do not gain a fired-power burst.
- **Kill:** uses the existing bounded renderer `contactBursts` entries of type `cut`, with the equipment/sword snapshot carried by that confirmed cut event. Armor contact, damage to the player, a missed slash and a broken ward do not trigger this layer.
- **Summon:** a renderer-only arrival clock initializes per run or changed completed recipe, waits through ready/opening/tutorial screens, and advances only in play. It expires after 36 renderer ticks, resets with the renderer and does not advance on draw. Shop forging also uses the completed recipe's assembly motif.

No run/gameplay module was changed for this continuation. There are no new damage, source, target, collider, resource, power, shield, charge, price, unlock, save or preset fields. New cosmetic debris is disabled in reduced motion; existing truthful static ability readouts remain. **C64 Tide bank/pressure and other deferred mechanical migrations remain pending.**

## Boundedness

No RNG, offscreen effect surface, retained emitter or timer per fragment. Each event is seekable and finite: dash16, attack12, kill18, summon36, power14 presentation ticks. At most six motif pieces for dash/attack/power, eight for summon, ten for kill. Kill receipts reuse the existing contact cap of twelve. Renderer arrival state is local, resettable and read-only to consumers. No build particles choose targets or recursively generate more particles.

## Screenshot-led refinement

1. Captured the genuine pre-edit renderer before changing production source; compressed copy and its hash are retained with this review.
2. Initial monochrome tests caught an envelope that reached zero too early for the attack-study frame. Corrected the actual fade envelope instead of weakening the test.
3. The first native review showed build signatures too small and kill/summon movement too similar across several recipes. Increased motif sizes modestly and added all seventeen explicit material trajectories.
4. Initial arrival captures were black because a pending ResizeObserver resized and cleared the newly inserted test canvas after its first draw. The harness now waits for the real browser layout frames, redraws without aging the effect, and asserts the canvas is painted before capture. Final screenshots are from that corrected run.
5. Added the ready-screen lifecycle check so summoning cannot expire before the player starts. No visual clock was added to simulation state.
6. Final inspected production-art views include Wyrm dash, Ronin attack, King summon/kill, Furnace kill and Arcade summon. Final native views include desktop Wyrm/Furnace and portrait Sun arrival/kill. The review and recording explicitly distinguish art studies from actual run evidence.

## Evidence

- Six new tests: combat-priority/frozen descriptors; all17×5 stages geometrically distinct in monochrome; finite expiry/motion/invalid-input gates; deterministic Canvas-state-safe read-only drawing; actual dash/blade integration; tick-owned summon lifecycle and confirmed-cut-only kill receipts.
- Final focused26 tests PASS (9772.948339ms); the final ready-screen lifecycle addition also passes all six build tests.
- **34 controlled native run cases:**17 completed builds×desktop/portrait. Accepted dash, real admitted Fang kill through the production resolver, matching event build snapshot, renderer arrival state, read-only draws and reduced mode all checked. These are not an uncontrolled playthrough or a device-FPS benchmark.
- **110 native live JPGs:** summon/dash/kill at both viewports, plus eight reduced-motion captures.
- **85 explicitly labeled production-art study captures:**17 builds×five event stages. They are not gameplay screenshots.
- **24-second WebM:**six builds×five treatments, recorded from the same labeled production-art study.
- The final full-suite/build/shop gate is recorded in `validation.json`.

## Reproduction

- `node --test test/build-harmony.test.js test/upgrade-juice.test.js test/action-harmony-fx.test.js test/dimension-impact.test.js`
- `LD_LIBRARY_PATH=/tmp/al2023/lib node scripts/build-harmony-live-qa.mjs`
- `LD_LIBRARY_PATH=/tmp/al2023/lib node scripts/build-harmony-motion-qa.mjs`
- `npm test`; `npm run build`; `git diff --check`.

Browser scripts use `/tmp/chromium`, accept `PREVIEW_URL` and default to port5192. Open `docs/build-harmony/index.html` through Vite for the interactive production-art study; the WebM is independently playable. No commit or push requested or performed.

## Final release gate

**1448/1448 tests PASS**,0 failures,372368.769686ms on final production source. Six new build tests; focused26 PASS. Native34 build cases,85 labeled art-study frames and24-second recording PASS. Existing shop7 layout/motion +22 shelves +3 separate Buy/Equip flows PASS, no save mutation or browser errors. Build/single-file**1261.8KiB PASS** and `git diff --check` PASS. Source/baseline hashes and paths: `validation.json`.
