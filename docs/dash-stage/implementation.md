# Elemental dash response stage

A substantial production rendering expansion following the dash play-review. This does **not** add new powers, replace authoritative elemental mechanics, or rebuild the store.

## Production hooks

`createElementalDashStage()` is constructed inside the real arena renderer. Actual `event()` receipts feed its bounded admission queue; actual `tick()` updates material motion; `draw()` adds the local layer **under actors, attack warnings and hazards**. Both renderer reset and field transition clear the stage. `effectState().dashStage` exposes copied diagnostic state for tests.

The art engine remains standalone: no imports, new dependencies, assets, browser globals, storage, network calls, game-body writes or collision/target selection logic were introduced.

## Material vocabulary

| Element | Moving particles | Local launch / contact marks | Dissipation |
|---|---|---|---|
| Ink / Adaptive | Dragged brush laminations, split grain and dark backing | Unequal dry-brush cuts | Slows, settles, thins |
| Ember | Warm, bright-cored cinders; buoyant vertical motion with mild curl | Unequal furnace fan tongues | Lifts and darkens through opacity decay |
| Volt | Forked strokes, discrete three-tick shape changes | Broken contact prongs | Fast drag and short lifetime, no permanent wire |
| Frost | Rotating two-face facets with an internal light edge | Cleft crystals, not ice bullets | Ballistic rime fragments, longest material life |
| Tide | Curved droplets with a reflected highlight | Paired open swells | Gravity-driven fall and mild lateral meander |
| Void | Folded splinters | Paired inward strokes, no closed danger ring | Local decorative return toward the particle's own origin |
| Echo | Paired partial record brackets, staggered admission | Offset record strokes | Four-tick stepping and staged erasure, no fake body copies |

Motion profiles have separate drag, gravity, spin and lifetime values. This is not seven recolors of the same particle physics.

## Truthful admission

- **Launch:** real `dash` event. A shot-counter change by itself is not sufficient to create this stage's exhaust.
- **Moving exhaust:** short window after that receipt, actual measured displacement of at least 9 units, and no jump of 90 units or more. Ambient fall/drift cannot emit it.
- **Wall contact:** real `bank`, requiring a finite inward normal. Mark geometry lies on the playable side. Particles crossing that specific contact plane are retired. This is cosmetic plane clipping, not a new collision detector.
- **Primary contact:** real `cut` / `armor`, excluding secondary or small-fragment receipts. Per-shot/target/type cosmetic deduplication limits repeated decoration. Existing damage and armor visuals remain authoritative.
- **Ember/Frost procs:** real `emberIgnite` / `frostContact` with nonempty accepted-target receipts.
- **Volt:** real `voltContact` accepted link endpoints only. Empty conduction creates **no** proc accent. This stage never draws an invented linking arc.
- **Void:** real `voidCollapse` with positive hit count. No fake payoff when the field misses.
- **Echo:** real `repriseFired` accepted-hit positions only. No predicted extra victim or extra replay lane.
- **Thaw:** real `frostThaw` produces only a quiet pair of fragments.

Native tests encountered a legitimate empty-conduction case with obstructed/repositioned actors. The assertion checks the real receipt's admission rather than forcing an impressive-looking proc where none happened. Accepted nonempty conduction is separately tested with exact endpoint projections.

## Pooling, priority and crowd handling

- 96 preallocated particle slots, reused rather than unbounded retained emitters.
- 12 local marks; queue capped at 24 primitive-copy receipts; contact ledger capped at 32.
- Higher-priority confirmed responses can replace older, lower-priority decorative work. Ordinary flow cannot evict an entire pool of higher-priority contacts.
- At most 64 particle draws and 8 local marks; portrait caps particle draws at 44 and lowers secondary opacity/emission.
- Busy pressure is derived read-only from enemy count, hazard count and current contact accents. Dense fights cap draws at **28 particles / 4 marks**, halve admission counts and slow exhaust cadence.
- Draw selection prefers higher priority, then recency, without sorting the caller's pool in place.
- View culling and a quiet zone around the hero suppress old motes that would sit over the face/blade footprint. All effects are still layered below actors and warnings.
- Per-material maximum particle lifetime is 66 + at most 6 variation ticks, plus an Echo delay of at most 6. Marks are at most 72 ticks. Queued/active effects clear on reduced motion, dead/nonplaying phase, run replacement, reset or field transition.
- Integration uses simulation-presentation ticks. Display interpolation uses copied previous/current particle coordinates without advancing age or changing the game. Repeated draws at any display frequency are read only.
- Deterministic scalar noise never calls `Math.random`; the renderer's call order cannot change the emission pattern.

## Test and visual evidence

`test/elemental-dash-stage.test.js` covers material distinction, finite dissipation, deterministic rendering, launch-only admission, secondary suppression, all supported proc receipt shapes, immutable projection, different material motion, four wall normals for all materials, 10,000-event saturation, priority/crowd budgets, reduced motion, resets, culling, canvas-state restoration, malformed inputs, native run → renderer admission and interpolation.

- `ordinary/`: normal main.js **Start Run**, free starter equipment, real browser pointer input, read-only debug/trace for timing/aim. No gameplay state or renderer injection. Desktop and portrait canvas recordings and timed frames. DOM HUD overlays are not composited into the canvas videos. Automated browser play plus frame review, not a human playtest.
- `elements/`: 32 **controlled native run/physics/renderer** scenarios across eight dash choices, desktop/portrait and both motion modes. Safe setup/equipment are fixtures. Native launch and simulation remain real. Verifies stage capacity, reduced-motion suppression, launch marks, read-only draw and cleanup alongside the prior wake checks. Not ordinary store progression.
- `validation.json`: executed test/build/browser results and limitations.

The previous self-roast and pre-stage baseline remain under `docs/dash-review/`. Ordinary runs are timing-dependent, so different kill totals are **not** evidence of improved balance or performance. Budgets and unit stress checks are not a mobile hardware FPS certification. A human at-speed readability test is still valuable; more code does not prove better game feel.

## Reproduce

```sh
node --test test/elemental-dash-stage.test.js test/dash-wake.test.js test/live-object-overhaul.test.js test/live-combat-presentation.test.js
QA_OUT_DIR=docs/dash-stage/ordinary LD_LIBRARY_PATH=/tmp/al2023/lib node scripts/dash-player-review.mjs
QA_OUT_DIR=docs/dash-stage/elements LD_LIBRARY_PATH=/tmp/al2023/lib node scripts/dash-elements-browser-qa.mjs
npm test
npm run build
```

The browser scripts default to the existing Vite preview on port 5201 and require the test Chromium binary. Paths are environment-specific; they are QA dependencies, not runtime dependencies of the delivered game.
