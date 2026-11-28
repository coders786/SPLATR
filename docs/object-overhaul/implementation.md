# Live object overhaul

## Scope and actual changes

This is an additive **production gameplay** pass, not another customization scene. Exact scope is [122 catalogued identities](coverage.md), not an invented round number of 100. Existing attacks, bodies, cloth, 17-build harmony, shop stories and mechanics are retained.

- **73 equipment items:** recognizable item construction fragments accompany real actions for up to 2.5 seconds. Slash, dash and core get stronger emphasis. Other equipped parts remain quieter, at distinct body-relative positions. Slash/dash/core also leave world-space launch fragments for 2 seconds. Equipped dash construction shapes form a 1.5-second wake during actual movement.
- **40 run cards:** individually authored contours (comet wedge, cleaver head, hourglass, tally, crown, key, stitched seam, phase steps, etc.). A card's real `upgradeApplied` event creates a 2.5-second acquisition echo. Owned cards also join the post-action player accents. These marks communicate **ownership/style**, NOT a false claim that a conditional mechanic has procced. Up to six appear simultaneously; larger inventories rotate in groups.
- **9 enemy species:** body-local material glow and small silhouette-shaped flecks. Real `cut` / `armor` receipts leave species-shaped fragments for 3 seconds. Armor uses lower intensity. Decorative broken seams do not pretend to be hitboxes.
- **6 worlds:** low-opacity screen-space climate, using the equipped world shape. Tokyo slants downward; Foundry rises; Void draws inward; Manga drifts; Synth steps on a grid; Twilight floats.

All geometry is canvas/vector; no downloaded image assets. Equipment contours reuse the existing authored item construction paths, now wired into gameplay. Cards/enemies have newly authored paths. Motion families are shared deliberately; this is **not 122 separately coded animation engines or 122 new powers**.

## Research used

1. [Riot's League VFX discipline guide](https://f.rpghq.org/F9aMk130UkIq.pdf?n=League+of+Legends+Riot+Games+-+Spell+visual+effects+color+art+guide.pdf) — read both extracted chunks. Primary silhouette/value communicates action, secondary effects stay quieter; contrast has an importance hierarchy; silhouettes matter more than excess detail; opposing colors should not compete equally. Applied as brief existing impact signals over longer, lower-value residue **beneath actors and hazards**. Duration does not extend damage.
2. [Juice it or lose it — Martin Jonasson & Petri Purho, 2012](https://www.youtube.com/watch?v=Fy0aCDmgnxg) — fetched description and opening transcript. Demonstrates layering easing, rotation, scale and response without changing rules. Applied as several action-linked layers, decelerating/fading fragments and item-correlated silhouettes rather than extra health/damage or blanket screen shake. This is a design reference, not empirical evidence that the implementation feels better to players.

## Runtime safeguards

- Renderer-owned state only. No ownership, prices, inventory, hit detection, scoring, damage, cooldown or save changes.
- Tick-owned ages; drawing cannot spawn particles or advance their clocks. World climate reads interpolated simulation time, not wall-clock time.
- Hard caps: 24 contact/launch echoes stored, **8 visible echoes drawn**, 28 trail marks, 6 owned-card action marks. Weather is 18 tiny marks. Enemy flecks are limited to 3 per already visible enemy.
- World-space echoes are view-culled. Debris is drawn before enemies/hazards; effects are not additive full-screen flashes. Canvas state is restored.
- Renderer reset and field transition clear residues. A new run reference clears previous identities. Reduced motion clears lingering trails/echoes and suppresses player/weather motion; enemy material retains a static tint. Existing reduced-motion combat cues remain.
- Strongest equipment layers are slash/dash/core. Accessory fragments use lower opacity. Ordinary action accents fade over 150 simulation ticks; launch fragments 120, acquisition 150, enemy fragments 180, wake 90.

## Evidence and reproduction

- `gameplay-results.json`, `actual-gameplay-1280.webm`, `actual-gameplay-390.webm`: **ordinary main.js Start Run**, real pointer/Space input, free starter equipment, no run-state/enemy/renderer injection. Tutorial-completion preference is seeded only to enter normal play. Bot reads draw trace for aiming. This proves live integration, not human playtesting or device FPS.
- `fixture-results.json`, `fixture-*.jpg`: **controlled native createRun/createRenderer** scenarios across the full catalog. Gear is seeded in run options. Card offers are test fixtures, admitted through real `chooseWaveBuff` / `upgradeApplied`. Native dash and combat contact are used. Presentation ticks are deliberately sampled after the hit. Do not describe these as ordinary progression or ownership unlocks.
- `test/live-object-overhaul.test.js`: catalog coverage, distinct immutable contours, visible dissipation after one second, finite expiry, deterministic draw, all state/event projections, caps, resets, reduced motion, read-only authority, native dash/cut → production effects.
- Reproduce normal play: `QA_OUT_DIR=docs/object-overhaul LD_LIBRARY_PATH=/tmp/al2023/lib node scripts/live-combat-play-qa.mjs`
- Reproduce catalog fixtures: `LD_LIBRARY_PATH=/tmp/al2023/lib node scripts/live-object-overhaul-qa.mjs`

Pixel differences and catalog counts are regression checks, **not proof a player can identify all 122 objects at combat speed**. A fresh human readability pass remains useful. No mobile hardware frame-rate certification is claimed. C64 Tide's separate mechanical migration remains outside this presentation pass.
