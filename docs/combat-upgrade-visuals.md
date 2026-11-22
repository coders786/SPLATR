# Dash, slash and wave-upgrade feedback

## Implemented
- Pure `drawCombatAccent` in the standalone art engine, integrated into the player rendering pass. No imports, DOM dependencies, gameplay writes or unbounded effect collections.
- Launch-age-driven three-wedge propulsion wake, decaying over 16 simulation ticks and aligned to the outgoing slash angle.
- Closed tapered slash crescent sweeps across the forward plane, with a bright leading edge. Bounded to the first 24 ticks and only shown while the blade is active. Existing sword/equipment artwork remains intact.
- Seven temporary upgrade treatments: cyan propulsion fins (fleet), extended lime brackets (reach), orange breaker notches, violet layered edge echoes (linger), gold bounty diamonds, mint guard chevrons and the existing shield plus lime ward brackets. A spent ward removes the shield accent.
- Persistent icon + numerical-stat badge in the wave HUD; color matches selection and player effect. Spent ward becomes a dim dashed SPENT badge. Badge disappears when the modifier expires. Selection says NEXT WAVE; accessible descriptions explain duration and exact effect.
- No stacking or balance changes: existing physical rest and one-wave replacement lifecycle remain authoritative.
- Reduced motion suppresses the propulsion wake and freezes the slash shape rather than sweeping it. CSS arrival animation honors prefers-reduced-motion.

## Validation
- Full suite: 481 passing, zero failures. Three new tests cover deterministic animation, snapshot purity, age expiry, modifier distinctions, spent ward, reduced motion and canvas-state restoration.
- Production self-contained build: 670.13 kB, gzip 267.96 kB.
- New `scripts/combat-upgrade-browser-qa.mjs`: 21 fixtures (seven upgrades × desktop/mobile/landscape), visible badges and icons, spent ward and expiry removal, no browser errors. Fixture states intentionally injected to inspect every visual; this is not earned gameplay progression testing.
- Rest-choice layout: 15 fixtures across five sizes, all three options fit without dialog scrolling.
- Native aim direction: 16 gestures, jitter/cancel checks pass.
- Native sword-family direction: 96 gestures pass.
- Wordless first-play: four sizes pass, automatic clean wave-one transition and reward isolation preserved.
- Inspected the rendered 390px fleet screenshot: visible player/wake, matching cyan upgrade badge and unobstructed upgrade stat. Initial QA fixture omitted the run-screen dataset and hid the arena; corrected fixture and reran successfully before inspection.

Artifacts are in ignored `.arena/combat-upgrades/` and `.arena/icons/`. Native-device performance and human readability remain unmeasured; no long soak was run for this change.
