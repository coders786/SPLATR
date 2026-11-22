# Dimension finish / hit-feedback polish

## Release assessment
Not a polished public release yet. Automated regression/build coverage supports continued beta development, not novice comprehension, low-end phone frame pacing, motion comfort, long-session reliability or production-host correctness. Do not turn passing checks into a release percentage.

## Diagnosis
Previous screen mixed pace, Hyper, Sonic, breach, bank feedback, cycle markers and active equipment. The seam was a generic polygon with cryptic instructions; unsuccessful contact gave no cause; completion was thin radial lines and repeated zone/clear audio. Decorative dimension-field strain could be mistaken for an unlock meter even though it does not unlock the seam.

## Implemented sequence
The existing contract is unchanged: hold target speed, launch Hyper, bank within its window to earn Sonic, then perform a fresh above-target-speed launch through the ready seam. Fifth-wave milestone, swept crossing, refill/safe finish, permanent reachable seam, rest/platform and skip logic remain.

`breachCue` is a pure factual view:
1. BUILD SPEED (or recharge speed).
2. DASH TO A WALL, then HIT A WALL during the bank window.
3. RELEASE AIM if held, otherwise DASH THROUGH.

The actual mechanical requirements are not reduced to three independent button presses; this is progressive presentation of the same skills.

## Simplified HUD
During the seam finish, hide competing active-upgrade and cycle readouts, retain one action and STEP n/3, a real speed marker and a short contextual line. Bank state shows remaining simulation time; other stages show actual skill progress/readiness. Explicit SKIP TO REST remains reachable. On earned completion, HUD reads SHATTERED / LAND ON PLATFORM, not generic clear.

## Seam and contact
- Three small cuts indicate skill stage, based on actual breakthrough/pace state, NOT decorative field strain.
- Sealed pane becomes a visibly open jagged seam when ready. Removed repeated floating world instructions and scar-to-seam spiderweb lines.
- Failed physical crossings give a short local contact notch and factual next-action label (BUILD SPEED / HIT A WALL / NEW DASH / MORE SPEED).
- Feedback requires real swept crossing, movement, a shot and no held aim; once per launch. It expires over 24 active simulation ticks. No damage, progress grant, score or extra shatter.
- Successful passage preserves crossing angle/speed for the presentation snapshot.

## Shatter art
The same local pane splits along its jagged seam into six unequal polygon pieces. Pieces peel away from the passage direction, with dark cel faces, restrained realm/core edge colors and short interior fracture lines. Brief local cut line, then dissipation over the existing 64-tick lifetime. No full-screen flash, color inversion, random particle cloud, extra camera shake or gameplay lock.

Reduced motion shows displaced but non-travelling pane pieces and static local contact geometry; event opacity can settle with simulation age. No idle loops or forced replay. This is a local dimension seam fracture, not a full arena/background replacement.

## Completion sound
Added quiet procedural seam-contact tick and a distinct short shatter cluster using existing mute/audio gates. Removed duplicate zone/clear sound on a shattered wave and replaced generic CLEAR callout with SHATTERED. No sound added to card previews.

## Validation
- Three new tests: stage projection ignores decorative strain; bounded deterministic directional pane rendering/context restoration; real slow crossing yields exactly one MORE SPEED response without damage/reward/shatter and skip remains valid.
- Full suite: 518/518 PASS, 201.9s. Existing earned-through-movement breakthrough/floor/portal rules remain covered by the full suite.
- 48 browser stage fixtures over four sizes/full+reduced: real seam opening, deterministic stage setups, actor/seam/HUD/skip in bounds, no JS errors. These stage setups are not novice traces or proof of earned progression.
- Eight existing browser practice journeys PASS: real pointer/keyboard, four sizes/full+reduced, deterministic earned route through pace/bank/seam/rest, native visible gate click, isolated practice preloads, reset/escape/pause/resume/save safety.
- 32 real dimension-field browser scenes PASS: wakes, normal/fast hits, clean-bank scars, immutable drawing, visible actors and reduced/full effects.
- Inspected phone ready state and desktop shatter. Initial regular triangular shards/overlapping title were revised to unequal pieces and a clear label.
- Build: 718.62 kB, gzip 283.45 kB; self-contained HTML.

## Still required before polished release
Observe unfamiliar players completing this sequence without explaining Hyper/Sonic; measure mistakes/requests for help. Check actual phone frame pacing and comfort. Check production hosting, long session/save/background-resume behavior. Audio was implemented procedurally but not evaluated by a human listening study. Automated stage screenshots do not establish intuitive comprehension.
