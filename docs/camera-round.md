# The camera round

Five changes to stop the frame moving under the player. Every number below is
from a headless assertion in `test/verification.test.js`; **none of it is a
visual claim.** No browser render was performed, so anything about how it
*looks* is still unverified.

## What was wrong

Three separate faults, and only one of them was the camera.

**The old shake was a shove, not a shake.** It stored a `bearing` and the
renderer translated the world along it by a scalar amount for the effect's whole
life. Nothing about it oscillated. Any claim that a shake "looks wrong" has to
check whether the offset changes direction over time, not merely whether its
magnitude looks plausible.

**The safety net was the loudest thing in the frame.** It assigned
`x = p.x - mx` outright — a whole correction in one tick, unbounded by any cap
above it. Measured on a five-dash chain: 3.37px per tick sideways against a
documented `maxStepXPx` of 2.2. The follow obeyed its cap, then the net added
its own on top. A cap that several rules can each spend is not a cap.

**Two cameras were being composed per tick.** `desired()` was called once by
`tick()` for the framing target and again by `view()` for the `panX/panY`
readout, and it advanced the lead on every call — at double rate, with the
`view()` copy easing toward a target computed from a *stationary* cube. The
result was a frame that drifted 0.19px per tick forever, 600 ticks after the
cube had stopped.

## What changed

| | |
| :-- | :-- |
| Deadzone | 5% of the viewport horizontally, 10% vertically |
| Follow | scaled by the simulation clock (`aimK`), so slow motion slows the lens too |
| Horizontal cap | 18px/tick, applied **once** per tick on actual displacement |
| Vertical cap | 30px/tick (`maxCamStepY`) |
| Fall look-ahead | 60px, squared onset at 40px/tick, downward only |
| Safety net | moves at the cube's own pace, never snaps |
| Shake | trauma², 7px / 0.6°, 0.38s decay, 6-tick cooldown |
| Speed lines | real displacement > 65% of max, ≤ 8 lines, alpha ≤ 0.12, viewport-anchored |
| Minimap | pinned bottom-right, fades to 0.08 in 117ms |
| Zoom | locked at exactly 1.0 (inside the 0.97–1.03 band) |
| Parallax | 0.08 / 0.13 / 0.18 |

### Why 18 and not 2

A 2px/tick horizontal cap does stop the skyline whipping — and it breaks the
frame. The cube outruns the view by 40px/tick, so it slides across the screen
and every dash visibly stutters: measured p95/p50 traced travel of **1.90**
against a 1.8 threshold. 18 is the value at which the skyline stops whipping
*and* the frame still reads as a glide. It is the honest number, not the
aspirational one.

The same tension appears in the safety net. No calm budget can keep a 42px/tick
cube on screen, and losing the player's own cube is not an option. So the calm
budget governs the ordinary follow, and the net — which only engages once the
cube is already 16% from the edge — is allowed to match the cube. That is not a
compromise; a camera that moves exactly as fast as the cube can neither lose it
nor be the fastest thing on screen.

## Verified

```
✓ camera max step        ΔcamX 18.43px · ΔcamY 1.77px · shake 2.56px · roll 0.120°
✓ camera steady on aim   drift 0.00px · path 0.00px over 60 ticks at timeScale 0.35
✓ speed lines on rail    speedLineAlpha 0 · maxMoved 0.050px < 27.3px gate · cameraMove 0
✓ minimap fade           0.92 -> 0.08 in 7 ticks (117ms), back in 7
✓ pinned hyper           3.9% worst one-frame move (was 4.2% before this round)
```

240 tests pass.

## Not verified

- Anything rendered. `#speedo` wiring and the `#speedo`/`.score-lock` nesting
  were confirmed by reading the source (it reads `s.moved ?? hypot(vel)` and is
  outside `.score-lock`); the minimap fade is confirmed as arithmetic only.
- The OFF/LOW/FULL control has been seen in the built HTML (`Screen shake
  <b>Full</b>`), but its click behaviour has not been exercised in a browser.
- Multi-frame canvas/HUD interactions remain outside what a headless suite can
  assert. A green suite is not proof for a HUD claim.

## Pre-existing bugs found and left alone

- **The safety net could never catch a laterally-moving cube.** It only
  intervenes once the *view rectangle* is breached, and the cube is not a
  point: a sustained 24px/tick lateral run put the cube at screen x 1445 on a
  1440px viewport, still walking outward. Fixed as part of the net rewrite
  above, but it was not on the list.
