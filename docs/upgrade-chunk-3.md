# Chunk 3 — speed upgrades belong to the equipped world

## Art research and decisions
Read Christina Wun (Riot VFX lead), interviewed by CG Channel, *Why 2D art skills help you create better 3D VFX*: https://www.cgchannel.com/2015/10/why-2d-art-skills-help-you-create-better-3d-vfx/
The interview emphasizes color, value, saturation, shape language, hierarchy and timing; an effect should communicate gameplay and retain thematic nuance. Applied as a shared drawing grammar rather than generic extra spectacle. No claim that these principles alone validate SPLATR's player comprehension.

Also consulted search summaries of Riot's VFX style guide (https://gdad.wiki/wiki/sources/source-lol-vfx-style-guide): primary gameplay cue vs secondary flavor, analogous palettes, readable silhouettes, nonlinear timing, subdued dissipation. This is a secondary summary, not a personally reviewed original Riot PDF. We adopt the narrow applicable principles, not that game's exact palette/factions.

## Executed
### Two choices, two meanings
- Fleet remains FASTER DASH: speed +15%, unchanged reach.
- Comet is now SHORT-BLADE RUSH: speed +25%, reach −15%. Catalogue mechanics, IDs and saves untouched. Visible/accessible/HUD names inherit the same presentation catalogue.

### One effect owner, not effect stacking
`resolveDashTreatment` derives element and material from existing equipment/build construction. Fleet/Comet keep the original ink/fire/lightning/ice/water/void/echo geometry. They modify its envelope and decay rather than spawning a generic speed wedge/crescent alongside it.
- Fleet: 1.08 longitudinal stretch, .88 transverse compression, .25 decay coefficient.
- Rush: 1.18 stretch, .72 compression, .30 decay coefficient.
These are visual parameters, NOT hidden movement multipliers. Real velocity remains the input. Real speed benefits remain exactly 1.15 / 1.25.

Colors retain element identity but borrow a restrained 23% of existing core energy. Highlights blend with construction light, rather than each speed buff imposing a cyan palette. Charcoal outlines, cel faces, broken contours and tapered shapes stay consistent with the character art. No full-screen flashes, extra camera shake, extra trail particles or idle effects.

### Weapon integration
Both upgrades retain equipped weapon family, signature, charge details and silhouette. Root binding/seam is paper-folded, furnace-heated or spectral-resolved via existing construction. Rush adds a short compression crease and visibly retracts idle weapon to 85%; active reach is supplied by the actual effective weapon profile, not applied twice. Fleet leaves reach untouched. No unrelated thrusters/costume plates added.

### Comparisons
Use the equipped body, core, element and weapon, not a generic demonstration actor. During requested playback the shared elemental renderer illustrates movement. The frozen endpoint shows travel gain AND blade reach. Normal and Rush use equal relative reach-check distance; normal cuts the far target, Rush leaves it intact with a short gap cue. Fleet preserves equal cutting reach while increasing travel. These are authored comparisons, not simulated combat; moving reach-check targets are illustrative local measurements and do not represent homing or live encounter layouts.

## Inspection and validation
- Inspected 21 reference combinations (7 elements × base/fleet/rush), six weapon-aware comparisons, and a real-renderer furnace/Rush frame.
- Added four deterministic tests: distinct names/exact rule multipliers; element/material/palette preservation; three different envelopes for every element; motion suppression/context restoration/frozen inputs.
- Updated composed-accent test: speed effects now live in shared dash + weapon rendering, not obsolete generic overlay. Still verifies eleven distinct complete presentations.
- Full tests: 510/510 PASS, 227.0s.
- Speed browser QA: 21 element references, six comparisons and 36 actual-renderer speed fixtures over three sizes; no JS errors. Fixed initial fixture ResizeObserver/screenshot ordering; redraw/nonblank assertion now runs after the initial resize settles. This was a QA fixture issue, not a game change.
- All eleven choice offers across 16 physical-rest fixtures/four sizes PASS: no scroll, accessible names, motion suppression, frozen pixels, no idle draws.
- 33 active-HUD/expiry/spent-ward fixtures PASS.
- Master browser: three sizes, end-card/buttons fit, retry, no scroll/errors PASS.
- Build: 713.95 kB, gzip 281.98 kB; self-contained HTML.

Files: `src/art/splatr-art-engine.js`, `src/buff-presentation.js`, `test/speed-upgrade-harmony.test.js`, `scripts/speed-harmony-browser-qa.mjs`.
Screenshots: `.arena/speed-harmony/element-build-matrix.png`, `speed-comparisons.png`, `rush-live.png`.

## Next chunk
Longer Slash and Safer Cuts: use actual active-blade and cut-grace windows; clearly separate persistence from genuine echo/pulse follow-ups. Other upgrade groups keep their existing treatment until their own pass. No native-device comfort/performance or human comprehension results claimed.
