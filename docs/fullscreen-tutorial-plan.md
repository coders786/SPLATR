# Visual first-run course

The course opens on the first **Start Run**, not at boot. It uses one isolated real run and viewport-filling canvas, with a Skip pill and one short contextual instruction at the screen edge. Learn replays it directly. Existing `riot.started` profiles bypass the first-run course; the first presentation is consumed on entry, so Retry and interrupted reloads do not force it again. Learn and the manual still allow replay. When browser storage is unavailable, this can only be remembered for the current page session. Neither route awards normal run rewards. Completion and skip create a fresh Sector 01 run and reveal the HUD.

Four adjoining rooms occupy a single, continuous physical arena. Solid dividers leave doorways fitted with gates. Each objective unlocks its gate; a real blade collision breaks it, and progression waits until the cube physically crosses the doorway. A shutter closes behind the cube to prevent gravity from stranding the player in an earlier room. The rooms contain a stationary diagonal Fang rack, a real highlighted right rail, live Fang and Rift opponents, and a three-hit Crown. The last gate leads into an exit alcove and a diagonal white split before the clean handoff.

In the Fang/Rift room, the Rift cannot be cut until the player is inside a real Rift landing warning, launches during that warning, and is outside its collision zone when the attack resolves without a bump or parry. A failed attempt cannot complete the checkpoint. After a successful escape the Fang appears and both can be cut. Tutorial collisions never reduce health, and an empty Edge slowly recovers even on a room wall to avoid a dead end. Contextual, in-world demonstrations replace the former training dialogs, static wall diagrams and quest detour.

## Verification

`node --test test/visual-tutorial.test.js` exercises real cuts, right-wall banking, physical dividers and gated crossings, successful and failed real Rift attacks, isolated warning before the Fang appears, premature cuts, Crown armor, tutorial invulnerability, replay isolation, the same-tick cut guard and canvas state. `scripts/pure-tutorial-browser-qa.mjs` covers Chromium at 1280×720, 390×680 and 860×440, with and without reduced motion: first start, interrupted reload, a real mouse or touch pull, a native touch dodge of a real warning, simulated subsequent combat inputs, completion, returning start, Retry, Learn, skip, manual and legacy-profile migration. `scripts/tutorial-retry-browser-qa.mjs` also checks first presentation, Retry and Learn with storage blocked for the current session. Run with `PREVIEW_BASE`, `CHROME_BIN` and any library path needed by the local Chromium installation. Screenshots under `.arena/` are local, disposable QA artifacts.

The browser bot does not establish unfamiliar-player comprehension, real-device touch behavior, or a particular completion time. Older first-play and fullscreen-lesson browser scripts describe the superseded UI and are not acceptance tests for this course.

## Contextual guidance revision

The old faint, static wall pictograms are no longer drawn in the course. The
next instruction is derived from the live tutorial state: the rack, highlighted
right rail, real Rift tell, surviving enemy, unlocked gate or opening. A
screen-space, non-interactive demonstration shows a recognizable finger or
mouse cursor pressing, pulling **away** from the destination and releasing; a
translucent ghost Cube and outgoing arrow then show the opposite travel. The
target remains visible; the escape diamond is drawn above the scene so it cannot be hidden by the warning. The
keyboard variant shows the relevant directional key and spacebar. Long-distance
objectives retain an edge locator.

In the Rift room the live warning is the only danger ring. It targets the player's
current position and provides extra reading time, while normal Rift combat keeps
predictive targeting. A green diamond appears outside the real warning: tap or
click it, or use its indicated arrow key plus Space. Aim assist is suppressed
for this one escape so it cannot pull the shot back toward the protected Rift.
Once a launch genuinely leaves the threatened zone, the real strike resolves
promptly to avoid an unfair wall bounce back into the warning; the result still
requires the player to remain outside at impact, with no bump or parry. Contact
with the protected Rift during the tell is not itself treated as a failed bump.
A miss is reported and the next warning remains interactive. Success explicitly
advances to the live remaining-enemy count, then the physical gate and crossing.

Guidance runs on the tutorial clock even before the first launch. It hides during
pointer/keyboard input and returns after roughly 100 inactive simulation ticks;
new objectives and actual Rift danger get immediate guidance; the escape diamond remains visible while aiming. Reduced motion
uses a static gesture and ghost result, without playing the moving preview.
The same phase changes publish concise descriptions to the existing visually
hidden screen-reader status; each room displays a short current action and real progress at the screen edge, without a modal.

`test/tutorial-guidance.test.js` covers objective selection, a real Rift zone,
ready-state animation, idle recovery, input suppression, drawing state and the
reduced-motion frame. `scripts/tutorial-guidance-browser-qa.mjs` checks native
mouse/touch input, long holds and cancellation, idle recovery and screenshots
at desktop, phone and landscape sizes, with and without reduced motion. The
full course browser regression checks live objective cues and the actual touch
dodge. The latest validation passed all 660 node tests, the production build, and the tutorial, Retry and marked-escape browser regressions. These automated checks cannot establish that unfamiliar people
understand the cues; a human playtest and physical-device testing remain needed.

`scripts/rift-guidance-browser-qa.mjs` tests tapping/clicking the actual diamond and using keyboard arrows and Space from several positions, including room corners and reduced motion. It checks the real strike, progress text and screen-reader announcement. Automated play is not a substitute for novice usability testing.
