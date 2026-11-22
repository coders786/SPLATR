# Recessed CORE and engaged eyes

## Implemented

Removed the CORE's generic rectangular mounting backplate and bright enclosing border. The mechanism now sits inside an asymmetric cut into the BODY, with an undercut shadow, material-colored lower lip, connecting shell seams/conduits, internal leads and fixed ribs occluding the moving energy. The energy mechanism breathes subtly and responds to aim/speed; each CORE retains its own geometry and palette.

All seven eye styles now have localized movement and aim/attack compression while the face socket remains fixed. Eye motion includes small gaze shifts and moving highlights, Visor scan/engagement marks, rotating Hypno highlights, stepped Glitch separation, rotating Sniper reticle marks, and Blaze flicker. Existing blink and falling-expression channels remain in place. Actual gameplay blade lifetime and lab cut state supply attack engagement; no combat state is modified.

No catalogue, recipes, prices, physics or input changes. The standalone engine remains import-free and owns all drawing. Reduced motion freezes the animation clock and retains static identities.

## Verification

- Final full suite: **377 passed / 0 failed**, 80.63 seconds.
- Single-file production build: **517.96 kB**, gzip **222.63 kB**, bundle verification passed.
- Dedicated Chromium study: **39 renders**, no page errors or Canvas state leaks. Directly inspected both eye/core studies, then regenerated the eye study with the same BODY across all states to avoid confusing material changes with eye expression changes; directly inspected final result.
- 630-render recipe/world/action matrix passed.
- Development and single-file production layout gates passed, including compact viewports.
- Manual, live-game and Best-Stroke adapter browser checks passed.
- Reduced-motion, native pointer cuts, Space, cancellation, focus and try-on checks passed.

`test/face-core.test.js` samples only the eye pixels when asserting eye movement; animation elsewhere cannot satisfy those checks. It verifies each of seven styles changes with time, aim and attack. Separate CORE-region tests cover all six non-default CORE mechanisms and reduced-motion stability. Canvas state and frozen inputs are checked throughout.

Reproduce the visual study against the existing port-3000 server:

`CHROME_BIN=/path/to/chromium node scripts/face-core-browser-qa.mjs`

Ignored outputs: `.arena/face-core/eyes.png` and `.arena/face-core/core.png`.

Authoritative complete source: `src/art/splatr-art-engine.js`.
