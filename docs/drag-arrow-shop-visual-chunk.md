# Drag arrow and Shop elemental preview chunk

## Drag arrow

Replaced the basic single-stroke arrow with a separated dashed pull tether, cancellation ring, tapered launch shaft, filled directional head and restrained elemental accents. Arrow length follows the existing resolved pull power; orientation stays pull-back/release-forward. No clock-driven animation, glow/filter, particles, resource changes or input-state changes.

Seven variants derive from the same `dashElement(equipment,sword)` resolver as gameplay: ink, fire, lightning, ice, echo, void and water. Differences include jagged lightning shaft, fire tooth, ice fork and unequal echo/void/water accents. These are build-driven, not new separately purchasable arrow inventory. The SVG overlay is pointer-transparent and hides on release/cancellation. Shared pure geometry lives in the art engine; the input adapter only assigns SVG attributes.

## Shop

Added a Preview type selector with ITEM STORY, ELEMENTAL SLASH and DRAG ARROW. Slash tab automatically uses the elemental demonstration while the default selector remains item-story, so other slots retain their equipment stories. Explicitly selecting a mode keeps that preview while inspecting different pieces. Arrow preview is static and disables the irrelevant Pause control; slash mode uses the existing loop/pause/reduced-motion controls. Grid portraits remain still.

Elemental slash demonstration combines the selected slash finish with the existing elemental movement renderer and hero/target silhouettes. A held result retains a short cut illustration rather than becoming a blank canvas. Shop receives the resolved sword profile as well as preview equipment, avoiding mismatched hybrid elemental priority. Previewing remains free and does not equip/purchase or award anything.

## Validation

- 561/561 full Node tests passed.
- Three new tests: all seven arrow geometries distinct, direction/power bounds; deterministic/context-safe Shop previews; distinct selected slash finishes.
- scripts/arrow-shop-browser-qa.mjs: 15 cases = slash/arrow preview at four sizes, plus seven native mouse-arrow variants with exactly one real launch each. No Shop dialog overflow. Desktop slash preview and lightning arrow captures inspected. Captures .arena/arrow-shop/.
- Four-size Shop purchase/equip/discovery browser regression passed.
- Twelve browser-native touch cases passed, preserving relaxed release/cancel/secondary-finger protection.
- Existing loop/pause/resume/reduced-motion Shop check passed.
- Eight production-renderer zero-cut deck-release regressions passed.
- Production single-file build passed: 740.77 kB / gzip 289.66 kB.
- Logs .arena/icons/arrow-shop-{focused,tests,build,browser,discovery,touch,pull}.log.

Physical touchscreen performance/comfort remains unverified. This requested customization chunk does not implement roadmap Chunk D (Release Cut / underlying-world reveal / Settling World), which remains separate.
