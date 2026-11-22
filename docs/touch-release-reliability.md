# Touch release reliability

Prioritized controls before additional visual effects. Found a second dropped-input cause: a latched pull could relax just below its acquisition threshold and be classified as cancelled. The launch-speed floor from the prior chunk does not solve that classifier failure.

## Change

`readGesture` now uses hysteresis: acquisition remains 14 CSS pixels for mouse and 20 for touch; deliberate cancellation requires returning inside half that radius. Once latched, the gesture never falls back to a target tap. The visible gesture ring contracts to show the actual cancellation boundary. Tap jitter, primary-pointer ownership, native pointer cancellation, blur/reset guards and resource rules remain.

## Validation

- 529/529 Node tests pass, including angular threshold sweeps for both pointer types and release/preview agreement after relaxation.
- New `scripts/touch-release-browser-qa.mjs`: 12 browser-native CDP touch cases across 390×680, 550×720 and 860×440. Uses production input, run and physics; confirms actual cube motion after a relaxed short pull, no launch after intentional return, no delayed launch after native touchCancel, and no hijack/double launch by a second finger.
- Existing captured mouse short-pull checks pass at three sizes.
- Required chooser regression passes at three sizes: repeated real Escape, outside click, unexpected-close recovery and valid-selection advancement.
- Single-file build passes, 726.58 kB / gzip 285.79 kB.

Browser touch simulation is not physical touchscreen testing. No claim that all device/browser gesture failures are eliminated. Logs: `.arena/icons/touch-reliability-*.log`.
