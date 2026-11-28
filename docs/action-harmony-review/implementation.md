# Slash, dash & core harmony

## What changed in this pass

- **Slashes:** a secondary peeled ribbon follows the existing crescent, with thin offset bindings and six staggered fragments that detach along the sweep. They disappear during recovery rather than pooling at the endpoint. Pixel retains its block-built edge instead of inheriting a smooth ribbon.
- **Actual equipped swords:** a short laminated wake and four small core-shaped marks follow the existing blade-release age. Resting blade construction, weapon families and reach remain intact. Fired sword receipts receive the same equipment context; pending attack guides do not emit fragments.
- **Dashes:** two tapered rear laminations, unequal side seams and at most seven small fragments add a shared launch language. This decoration runs before the specialized Volt, Reprise, Void, Frost and Ember branches as well as the generic Ink/Water paths. It stays behind the cube and expires within ten simulation steps.
- **Core harmony:** seven small mark grammars—paired strokes, curls, angular cuts, calibration slits, facets, opposed strokes and offset brackets. Core color, spacing and curl modestly vary the accents. The power's own leading silhouette/color is not replaced.
- **Core response:** tiny fitted chamber seams react to the existing release/dash gesture, clipped inside the opaque chamber. This is not a charge gauge, stored attack, shield or new power state.
- **Actual contacts:** equipment context now reaches the existing gameplay/practice impact renderer. Three of the existing twelve shards carry a core mark; a swing endpoint alone still never creates an impact burst.
- **Shop/practice:** common production renderers are used by slash/dash studies; direct specialized wordless power scenes route through the same decorator. Shop chamber poses receive release context without adding idle breathing.

This pass changes rendering only in `src/art/splatr-art-engine.js`. Pre-existing work elsewhere in the repository is retained. No physics, damage, hit area, range, cooldown, charge or purchase rules were changed by this pass. No random sampling, retained emitter, global particle pool, extra camera shake or screen flash was added.

## Review

- `index.html`: visual review, genuine before/after studies, native gameplay examples and motion recording.
- `playground.html`: live production-art workbench. Run through the development server so `/src/` imports resolve. Select a core, dash and slash; pause or choose a still illustration. This is explicitly an art workbench, not a second combat simulation.
- `core-signatures.webm`: 12.6-second canvas recording cycling through all seven cores, using the production artwork on its real animation clock.
- Seven core JPG comparisons: identical equipment, age and camera through the genuine pre-pass and current renderers; top before, bottom now.
- `all-dashes.jpg`: all seven dash silhouettes, top before/bottom now, same Time core.
- `slash-sequence.jpg`: six reproducible slash phases.
- `live-*.jpg`: 21 controlled launches from the actual run, physics and game renderer, across desktop/mobile/mobile motion-off.

The first comparison showed the accents were too faint, so the rear laminations, peeled slash ribbon and fragment visibility were strengthened. Core influence deliberately remains subordinate to the equipped attack.

## Verification

- Full regression run: **1,420 passed / 0 failed**. This includes the first nine new action-harmony tests.
- Final focused action-FX run: **10 passed / 0 failed**, including the additional actual-sword/motion-gate test added after the full run began.
- Final affected-path run after shop/practice context refinements: **26 passed / 0 failed** across action FX, slash integration, cube smear, shop dash and all 73 wordless products.
- Genuine-baseline pixel checks: **49/49 leading dash silhouettes unchanged**, **56/56 motion-off slash illustrations unchanged**, **7/7 idle core constructions unchanged**.
- New rendering tests: all 49 dash/core and 56 slash/core combinations deterministic/distinct; seven distinct monochrome particle geometries; immutable equipment; transform/alpha/style restoration; finite lifetimes; rear-only wake bounds; motion-off suppression; explicit contact receipts; stable shop stills.
- Browser QA: **21 real-run frames**, seven core workbench captures, mobile no-horizontal-overflow/still stability, seven-core recording, **zero page errors**.
- Existing native shop flow rechecked at 390×844, 320×568, 640×360 and reduced-motion 390×844: optional rules, manual holds, buy-then-equip, wallet persistence and stills passed. This rerun reused the previous 48-stage manifest; those 48 older product-stage images were **not** recaptured or counted as new evidence here.
- Production build passed: single-file **1,227.1 KiB** bundle. `git diff --check` passed.

## Reproduce

```sh
npm run dev -- --port 5192 --strictPort
node --test test/action-harmony-fx.test.js
npm test
npm run build
# Genuine old renderer is required; it must not be regenerated from new code.
QA_BEFORE_ART=/path/to/genuine-pre-pass-art.js node scripts/action-harmony-audit.mjs
LD_LIBRARY_PATH=/tmp/al2023/lib node scripts/action-harmony-browser-qa.mjs
```

The default audit baseline is the session-local `.arena/action-harmony/art-before.js`; `.arena` is scratch storage, so durable review outputs are checked into the working tree under this directory instead. Supply a genuine baseline explicitly in another environment.

These are scripted renderer/browser checks, not a human comprehension study, physical-device test, audio review or measured frame-rate claim. No commit or push was made.
