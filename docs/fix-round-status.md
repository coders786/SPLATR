# Fix round — status

Branch `arena/ba6cdf01-splatr`. HEAD `39b9cfb`. **260 tests pass, 0 fail.** Build: `dist/index.html`, 365.9 KiB, one file.

## What the honest verification story is

No real browser render was performed at any point in this round. Every claim below is
from headless Node simulation, source reading, or stylesheet parsing. `docs/review-frames/`
are Skia renders that **exclude the HTML HUD**, so anything about the HUD, the minimap,
the CSS layout or the meter's *appearance* is read-only + computed verification, not eyes-on.
Where a fix could not be proven, that is said so below instead of being rounded up.

## Closed

| # | Bug | Fix | Evidence |
|---|---|---|---|
| 1 | Cube twisted into a diamond, spiky hair | Removed the `dipX*(1-y)` shear from `jelly`, deleted launch spin, clamped dash stretch to 1.25/0.80 | corners **90.00°** across lean × scale × grip; worst corner error 0.0; physics spin 0.000000 rad over 1,200 ticks |
| 1 | Two "needles" out of head and butt | One tapered 12-vertex ribbon, 40×7px, attached 20px from centre | replaced 8 polygons / two 40-wide spikes |
| 2 | Meter → 0 on a slice | 12-tick mean window; hitstop is entity-only | meter tests 10–13 |
| 3 | Meter 61 while still | same window | — |
| 5 | Stuck white aim/trail lines | `imprint` 34→20 ticks, `shard` 32→20 (333 ms, under the 0.4 s ceiling) | `MARKS` allowlist asserts every mark row < 400 ms |
| 6 | Sector 07 empty | watchdogs | test 15 |
| 7 | Pop-ups over the speed numbers | `#callout` moved to `top: var(--top)+165px` = 6px under the dial's 159px bottom | test 22 parses both rules from `style.css` |
| 8 | Warning art over the HUD | world pass clipped to the play area, cut-outs derived from `--top`/`--gutter` | test 25 |
| 10 | RIFT star read as a coin | `#ffa47b` → `#e0123a` (12.4× red-dominant) + outward barbs | test 24 |
| — | Screen shake OFF left lines flashing | OFF now also disables the renderer's motion layer | test 23 (mutation-tested) |
| — | Fullscreen shown as "UNAVAILABLE" | row hidden outright when unsupported | test 23 |
| — | BEST STROKE card said "3 SHAPES", drew 1 | label counts `marks` (what is drawn), not `kills` | test 23 |
| — | Pause-quit said "You banked this run" | "Run ended early." | test 23 |
| — | `world.viewH` never published | renderer exposes `onViewport`, main wires it to `run.setViewport` | kick vy 13.47 (fallback) → 14.20 at 800px |
| — | `s.floorFlash` had no renderer | drawn as a bright pad under the cube | test 29 |
| — | `floorKick` had no sound | `audio.spring()`, upward sweep + thump | test 29 |
| — | Ghosts spaced by a constant | one echo per half-cube of **actual travel** | test 27 |
| — | Armoured hit had no consequence | shove back along the cut + 30 ticks (≈500 ms) grace | test 28 |

## Still open, and known

**A dash out of a fast fall still barely rises.** Measured with the cube falling at
60 px/tick: the launch is written at −40 and Matter's own `Body.update` reduces it to
−4.4 on the next substep. The floor branch, the clamp and `kickHold` were each
instrumented and **none of them fire** — this is solver contact resolution against a
floor the body is still touching, not any of the code paths previously suspected.
Rise measured: **66 px**, against 1040–1273 px from every other starting state.
Test 26 records the bound and will announce it the day it is fixed.

Three earlier guesses at this bug (a depth guard, an ignore-window guard, a clamp
change) were written, measured, and **reverted when they changed nothing** — the
early "fast fall 1273px" result was an artefact of a shared fixture, and was thrown
away once each case was measured in a fresh run.

## Reported, not real

The "name unification" item (SKIRMISH/PINHOLE/PULSE vs FANG/PRISM/FORK/BASTION/RIFT/
CROWN) does not exist in the source — the shapes are already consistently
FANG/PRISM/FORK/BASTION/RIFT/CROWN, and "nick marks" is a real renderer concept with
its own drawing code. The tutorial copy matches the implementation. These were errors
in the review notes, not in the game.
