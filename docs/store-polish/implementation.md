# Armory material and elemental polish

Follow-up to the all-73-item motion pass. Changes are in the actual production store, not an alternate review gallery.

## Visible upgrades
- Eight more legible dash wakes: layered warm flame tongues, forked cyan lightning, faceted ice needles, broad translucent water ribbons, inward void crescents, offset echo brackets, adaptive slip streaks, and dark ink slabs. Existing native leading/contact drawings are preserved separately; the shared green core lamination no longer obscures the item-only dash illustration.
- Metal/crystal shells have sweeping specular highlights. Gold is warm, iron/segmented have small fasteners, hologram has fine scan lines, lava has warm fissure highlights, and paper deliberately does not receive a metal shine.
- Core windows have a controlled glass reflection and edge gleams. Eye mounts have a bevel, recessed lower edge and two small fasteners.
- Large surrounding wireframe outlines are replaced with short open light trails, leaving the item as the focal point. All 73 unique particle silhouettes and three-beat performances remain.
- Soft localized stage lighting, an item-colored floor light pool, quieter card depth, refined selected-card emphasis, and a dark mobile purchase strip bring the presentation together.
- Stage lighting fades to the canvas base at its edges so contained desktop/phone previews do not acquire hard rectangular gradient letterboxes.

## Boundaries
Store-only illustration layers. No combat, prices, ownership, recipe, save or damage changes. Shared material/trajectory helpers are reused deliberately; these are not 73 entirely rewritten models. Pause, fixed rail steps, reduced motion, viewport culling and the 30fps drawing cap remain. Optional Compare and Practice still use their established fitted-loadout views. C64 Tide mechanical migration is not part of this pass.

## Evidence and reproduction
- `actual-store-motion.webm` records the actual Armory selected canvas, 16.8 seconds: Ember Dash → Tide Dash → Gold Foil. It is not gameplay footage.
- `native/` contains screenshots of the actual store on desktop and mobile.
- `items/` contains the 73 × 3 held selected-canvas crops obtained by clicking the real store controls.
- `baseline/art-before.js.gz` is the genuine renderer before this polish pass.
- `STORE_QA_OUT=docs/store-polish LD_LIBRARY_PATH=/tmp/al2023/lib node scripts/store-performances-qa.mjs`
- `LD_LIBRARY_PATH=/tmp/al2023/lib node scripts/store-polish-motion-qa.mjs`
- `node --test test/store-performances.test.js test/store-polish.test.js test/airy-art.test.js test/head-hardware.test.js test/build-harmony.test.js test/upgrade-juice.test.js`

Automated UI coverage is not recruited-player approval or physical-device FPS certification. See `validation.json` for final results.
