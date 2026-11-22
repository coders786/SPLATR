# Distinct temporary buff variations

Expanded the wave modifier pool from seven to eleven, preserving deterministic three-choice offers (one ATTACK, one HANDLING, one STAKES), physical rest, one-wave expiry and non-stacking equipment independence.

New mechanically active trade-offs:
- COMET DRIVE: dash +25%, reach −15%; rocket pictogram, swept blue fins.
- HEAVY CLEAVER: armor damage +2, blade window −4 ticks; hammer pictogram, orange wedge plate.
- GLASS EDGE: score +50%, post-cut grace −4 ticks; cracked-glass pictogram, pink diamond outriggers.
- TWIN WARD: block two otherwise damaging hits, dash −10%; overlapping-shields pictogram, blue armor rails and second ward bracket. Live badge counts remaining blocks. No healing.

Existing buffs also receive solid outlined silhouette mounts in the pure art renderer: propulsion fins, reach tip, breaker teeth, linger spine, bounty crest and guard rails. Ward brackets disappear when spent. Shapes supplement—not replace—the equipped character/sword art and never change collision geometry. Upgrade colors/icons agree between cards and active HUD. Both gains and costs stay visible in compact cards. The extra options participate in tactical recommendations.

Validation:
- Full suite: 483 passing, zero failures (115.7s).
- New tests verify all eleven unique icons, seeded offer coverage/category balance, actual rest selection and expiry for all four additions, two-hit ward consumption and equipment independence.
- Expanded deterministic renderer tests cover all eleven modifier visuals.
- Chromium active-upgrade QA: 33 fixtures across desktop, phone and landscape, visible icon badges, spent ward and removal, no page errors.
- Rest layout browser QA: 15 fixtures across five sizes, three choices fit without dialog scrolling.
- Inspected 390px Comet and Twin Ward field screenshots plus the 390px rest screenshot with Heavy Cleaver/Comet trade-off cards. Both trade-off halves visible; physical mounts and matching HUD icons present.
- Production single-file build: 673.42 kB, gzip 268.97 kB.

Visual browser fixtures inject modifier states intentionally; real selection/expiry is separately exercised in simulation tests. No native-device or human-balance/playtest claim. Art engine remains import-free with no DOM/storage/physics writes.
