# Chunk 4: less costume, more readable action

## Corrected the actual meaning first
Code inspection confirms cutGrace protects against cutGraceFrom only, not the field. CUT_GRACE is 15 ticks (an old nearby comment still mentions 133ms); guard adds 8, while armor applies a separate longer floor. Replaced player-facing generic protection wording with “More time to exit the cut target / Exit window +0.13s.” No balance changes.

## Longer Slash
- No longer replaces every equipped sword with the echo family.
- Keeps all seven existing weapon silhouettes, signatures and charge details.
- Small paired root etches use the existing material palette rather than an attached outfit.
- Actual live edge appears on the existing blade while active, fades toward expiry from the real bladeRemaining value and stops with the blade. No independently orbiting/echo blade or extra damage event.
- Removed redundant generic buff rim/wake/crescent. Genuine echo/pulse attacks remain separate and unchanged.

## Safer Cuts
- Removed the generic always-present arc/rim/wake.
- Added an open directional exit contour facing only the contacted source: folded paper, furnace brackets, broken spectral flanks.
- Cue requires real remaining grace and matching enemy ID. Surviving source follows actual enemy position; defeated source uses last contact position. Secondary hits do not overwrite the tracked primary source.
- Cut events now include enemy identity for that presentation linkage. No physics writes.
- Grace expiry hides the cue immediately; no independently ticking animation could outlive it. Reduced motion keeps a stationary contour rather than orbiting motion.
- Preview demonstrates a scoped cut/exit interval, not a general shield. Uses 15 versus 23 ticks for the ordinary-cut illustration.

## Clutter and correctness fixes found during inspection
- Actual phone capture showed an airborne cut triggering the floor-style landing ring. Ground shock rings now require actual grounded state; contact squash/impact feedback remains. This removes a misleading area-shield-looking ring around Safer Cuts.
- Fixed variable shadow in ward fracture: a local numeric distance had hidden the construction descriptor, so intended material shapes/colors were not being used. Regression test now distinguishes all three fragments.

## Validation
- Five new tests: all seven equipped weapon silhouettes preserved (alpha masks), exit source/expiry/direction/context checks, construction-specific ward fragments, exact +8 actual blade duration/no fabricated follow-ups, real source IDs and scoped grace (14 vs 22 ticks after the contact tick consumes one).
- Full suite 515/515 PASS, 234.0s.
- 18 real simulated gameplay fixtures: three materials × guard/linger × desktop/phone/landscape. Assert actual cut source and grace, late blade activity, no spawned follow-ups, visible frames, no JS errors. Inspected phone guard capture before and after removing the airborne floor ring.
- All eleven choice offers across 16 physical-rest fixtures/four sizes PASS (idle stability, settled cache, reduced motion, accessibility, no scrolling/errors).
- 33 active-upgrade HUD/spent/expiry fixtures PASS.
- Four-size first-play checks PASS.
- Build PASS 715.41 kB, gzip 282.41 kB; self-contained HTML.

## Honest limits / next decisions
These are meaningful action cues, not a full redesign of the cube silhouette or camera. At full arena scale the actor remains small; fine etch details are secondary, not claimed as the primary readability solution.
Safer Cuts' existing design has limited visible utility when the source dies, and armor's longer grace floor can mask its +8 bonus. This needs a separate balance decision/playtest, not a silent art-driven buff. No claim of global invulnerability, native-device comfort/performance, or proven novice comprehension.
Remaining planned group: score/risk, Break Armor and Twin Ward. Prioritize actual gameplay consequences over more decorative geometry.
