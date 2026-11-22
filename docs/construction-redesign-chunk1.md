# Unified art redesign — Chunk 1: construction and subtraction

## Scope

Implemented the first of the three planned chunks: static construction, material identity and visual-noise reduction. This does **not** claim completion of the coordinated animation/leading-edge slash work (Chunk 2) or the hybrid/world-wide art-direction pass (Chunk 3).

No new items, recipes, prices, save fields, collision shapes, movement rules or combat modifiers. Existing seven-tab layout retained. All drawing stays in the standalone engine.

## Structural changes

- Added pure `resolveBodyConstruction(body)` returning deeply frozen descriptors for all ten BODY items. Each descriptor owns a material language, structural light/shadow and a distinct CORE cutaway contour. Unknown ordinary IDs fall back to paper.
- Replaced the universal zig-zag black mask with separate eye recesses for expressive eyes, or a continuous inset for Visor/Sniper. BODY construction determines folded, plated, beveled, faceted or cut edges.
- Left a BODY-colored bridge and cheeks rather than covering the front in a generic black sticker. Paper receives a broad folded brow; plate materials use overlapping brow edges; faceted materials use a deliberate plane.
- Removed the universal neon forehead stripe, repeated chevrons and fasteners, duplicate corner glows, duplicate halftone wallpaper and decorative iron brackets/gold corner bolts from the hero render path. Legacy drawing APIs remain available.
- Reduced halftone to the paper shadow plane. WORLD contributes a short selected reflected edge rather than another luminous frame.
- CORE openings now use BODY-specific contours and visible internal walls, without a universal bright outline or surface wires. Shifted the opening into the lower-right construction so it no longer reads as a central mouth badge.
- Attachment roots tuck behind the side plane. Removed universal socket badges/studs; plate bodies use a facing lip and horn roots sit under the top-plane edge.
- Visor/Sniper retain a minimum readable display height during blinking. This corrects an almost-empty-slit issue caught in the production layout screenshots.

## API

Additive export: `resolveBodyConstruction(body)`.

Optional `HeroSpec.pose.emission` in [0,1] controls CORE internal emission only. Zero exposes the underlying opening and internal walls; it does not remove eyes, material reflections, or recipe effects. Default is one. It exists for low-emission construction inspection and does not affect gameplay.

## Evidence and verification

Final source:
- `npm test`: **381 passed, 0 failed**, 75.18 seconds.
- Production build: **518.06 kB**, gzip **222.78 kB**; single-file bundle verification passed.
- Final Chromium development and single-file production layout gates passed: seven tabs, two complete rows, live preview sizes, sidebar/footer fit and compact viewport bounds.
- Construction study: **40 renders across 10 BODY items**, with pre-change/current/grayscale/CORE-unlit columns and both close-up and 46-pixel body diameter. Zero page errors or Canvas state leaks.

Additional browser checks during this chunk:
- 630-render mutation/world/action matrix passed.
- Manual, live game and Best Stroke fixture passed.
- Harmony/Codex/native-cut checks passed; wallet unchanged.
- Reduced motion, Space, cancellation, focus and try-on checks passed.

Directly inspected initial face studies, same-build before/after construction studies, production BODY-tab layout and live-game screenshot. The initial centered CORE still looked mouth-like, so it was offset before final review. Inspected the final complete ten-BODY comparison, including grayscale, emission-off and gameplay-size specimens.

Focused tests in `test/body-construction.test.js` verify frozen per-BODY descriptors, distinct contours, low-emission material distinction, all 70 BODY/eye combinations, Canvas state restoration and unchanged cosmetic-profile equipment rules. Existing eye-region animation and reduced-motion tests still pass.

## Reproduce

With the single dev server on port 3000:

`CHROME_BIN=/path/to/chromium node scripts/construction-browser-qa.mjs`

Optional `ART_BASELINE=/path/to/pre-change-engine.js` enables a same-build pre-change column. Baseline is intercepted into the browser as a module rather than changing the authoritative source. Ignored outputs are written under `.arena/construction/`.

Authoritative complete source: `src/art/splatr-art-engine.js`.
