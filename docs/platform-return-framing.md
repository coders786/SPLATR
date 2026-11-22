# Platform return readability chunk

Follow-up to platform magnet. The previous phone overshoot capture showed the deck partly outside the player-follow camera despite a valid magnetic capture. Fixed presentation rather than increasing magnetic force or teleporting the player.

## Changes

- Return/choose phases now apply fixed-scale camera framing for the actor plus full platform, pole cues and label. Correction only runs where both can fit; otherwise ordinary actor tracking remains. Uses the existing per-tick translation caps. No zoom/dolly, scale change or gameplay mutation. Ordinary combat frameRun is tested exactly equal to its previous camera path.
- Radar shows a small stationary deck-shaped destination during return. The existing safe offscreen pointer can target the platform center if it is still outside the view while the capped camera catches up. No additional permanent overlay.
- Return HUD reads MAGNET / LANDING while capture is active; otherwise retains the existing land-on-platform instruction. Required chooser remains the only path into the next wave.

## Validation

- 549/549 full Node tests passed.
- Three new camera tests: full-deck/actor fit across four sizes and both approach sides at unchanged scale, bounded per-tick translation, exact combat camera equivalence.
- 16 production-art/real-physics browser scenes: overshoot, below deck, left/right arena edges at four sizes. Asserts the entire landed deck/label and actor are within the view, three offers ready, no shot/reward/auto-choice and zero page errors. Script scripts/platform-return-framing-browser-qa.mjs. Captures .arena/platform-return-framing/.
- Phone approach and landed screenshots inspected: both deck ends and hero visible, with stationary destination glyph on radar during approach.
- Three-size required-choice regression and eight zero-cut mouse/touch release regressions passed.
- Single-file build passed: 732.10 kB / gzip 287.42 kB.
- Logs .arena/icons/platform-framing-{focused,tests,build,choice,pull}.log.

Captures use deterministic QA states, not live-user traces. Physical-device performance/motion comfort remains unverified. Framing is bounded and may take several ticks to catch up; very distant player/deck pairs cannot both fit at fixed scale.
