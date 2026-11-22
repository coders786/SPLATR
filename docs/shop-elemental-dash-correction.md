# Shop elemental DASH correction and detailed preview chunk

User clarified that “elemental slash” meant elemental dash. Corrected the feature, not just its menu text.

## User-visible changes

- Shop now opens with ELEMENTAL DASH selected. ITEM STORY and DRAG ARROW remain available in the preview selector. The existing Slash equipment slot stays a cosmetic weapon-finish slot; it is not renamed or repurposed as a dash inventory.
- Dedicated dash study contains load, travel and held-reference beats. Quiet start/end registration marks make displacement legible. There is no cut enemy, sweep arc or splitting target to confuse this with a slash demonstration.
- Samples the same drawElementalDash geometry and dashElement(equipment,sword) identity resolver used in gameplay. Seven treatments: ink, fire, lightning, ice, echo, void and water. Selected/hovered parts update the free preview without purchase/equip/save mutation.
- Hero face stays clean; carried sword is idle, not attacking. Element name and current study phase label the preview. No extra particles, fullscreen flash or camera motion.
- The reference hold deliberately freezes an early readable production dash frame rather than allowing the treatment to vanish during the long result hold. Playback samples the early-release geometry for inspection, not a claimed real-time physics trajectory.
- Pause/resume still freeze/continue the actual preview. Reduced motion uses a fully stationary reference composition with fixed hero placement and fixed dash age. drawElementalDash is evaluated at that fixed age to render a still illustration; no animated alternative is played under reduced motion.

## Shared identity bug found

The old resolver checked the laser slash fallback before the explicitly named Glacier build, so Glacier could incorrectly show lightning despite its named ice case. Moved the explicit Glacier check ahead of that fallback. This corrects visual identity in Shop, gameplay dash and drag-arrow projections together; no ability, damage, movement, resource or reward changes.

## Validation

- 567/567 full Node tests passed.
- Three new tests: load/travel/held pose and invariant reduced reference; seven distinct dash studies plus Glacier priority; deterministic/context-safe drawing with immutable input.
- scripts/shop-element-dash-browser-qa.mjs: 28 real Shop free previews = seven elements × four sizes; actual slot/item inspection, correct element, no dialog overflow, no equipment-save mutation, stable reduced-motion pixels, disabled irrelevant playback and no page errors. Desktop fire preview inspected.
- Existing side loop/pause/resume/reduced-motion browser test passed.
- Updated arrow/Shop test passed: eight dash/arrow mode views plus seven actual native mouse-arrow releases, one launch per release.
- Production single-file build passed: 743.71 kB / gzip 290.67 kB.
- Captures .arena/shop-element-dash/; logs .arena/icons/shop-element-dash-{focused,tests,build,browser,loop,arrow}.log.

Earlier slash-demo helper remains portable and tested but is no longer offered as the elemental preview. No new purchasable dash slot or standalone element unlock is implied. Physical-device comfort/performance remains unverified.
