# Fix round — status

## Customization chunk 3 — completed catalog and art pass

**Latest: 343/343 tests pass; build 461.16 kB (gzip 202.21 kB).**
The full 49-item catalog plus empty head, all five achievable hybrids, challenge
rewards, collection badges, six worlds, seven slash styles and larger BEST STROKE
build stamps are implemented. One unified server remains on **port 3000**.

See [the complete implementation and verification report](customization-chunk-3-complete.md).
Real Chromium verifies all five builds at three sizes, all 50 rendered choices,
five actual seeded stroke prints, and existing purchase/end-card/retry flows.
No JavaScript errors; `git diff --check` clean. Shop clipping and Manga HUD contrast
found by screenshot review were fixed. Chunk 4 shop extras/transaction hardening
and human usability/audio approval remain separate work.

Earlier sections below are historical snapshots, not the current test count.

## Unified-server continuation — prize receipts and diagnostics

**Latest verification: 308/308 tests pass. Build 410.88 kB (gzip 183.04 kB).**
**One unified Vite server is running on port 3000**; the earlier shutdown note
below is historical. No second preview or backend server was started.

This pass adds a pure prize-settlement calculator (`src/prize-settlement.js`).
Its immutable receipt records previous/earned/saved points, the selected-prize
unlock, wallet delta, next-meter baseline, and rollover stages. The UI commits
once and ignores duplicate over events. Animation never changes balances.
Tests cover 52+20, 92+20→Halo+12 toward Wings, chest payouts, large overflow,
zero earnings and invalid fractional/negative inputs. Actual quest-row-to-meter
particles replace arbitrary falling sparks; reduced motion omits the transfer.
Unlock text and carried progress remain explicit. Intermediate rollover stages
are captured in data; a sequential multi-track cinematographic fill is not
claimed. Prices and quest selection semantics remain unchanged.

Quick peek supports tapping Q to toggle and holding Q then releasing to close,
as well as the pip button. Escape closes peek without pausing; blur clears held
state. Modifier shortcuts are not intercepted. Real Chromium verifies these
inputs and populated result layouts at 1280×720, 550×720 and 860×440.

A separate isolated browser fixture uses the real HTML/CSS/quest controller with
synthetic progress (not earned gameplay). It exposed clipping with two DONE
badges plus a rollover receipt at 860×440. Compact spacing was corrected without
shrinking text. The test now checks footer bounds against the dialog itself,
not only the viewport. All three populated rollover fixtures pass with zero
scroll, correct carry, feedback particles and idempotent settlement. Completed
quest counters no longer animate through partial values underneath DONE labels.

Opt-in local diagnostics (`src/combat-trace.js`, `createRun(...,{combatTrace})`)
provide a bounded immutable ring and JSON export: contact batches, cut contacts,
real damage and blocked damage attempts. No network upload, user IDs or renderer
hooks. Ordering is within simulation ticks, not a fabricated substep TOI.

Python/Pillow camera image verification still passes: unchanged actor world
position, visible in both images, projection error 0.035px. The prior 400-tick
paired-AI camera regression remains green. `git diff --check` is clean.

Reproduce the new browser fixture with an installed Chromium and the unified
server running:

```
CHROME_BIN=/path/to/chromium node scripts/prize-browser-qa.mjs
```

Optional alternative STYLE balancing, real starter-credit experiments, full
native-pointer portal playthrough and human usability/retention studies remain
separate; no fake progress or silent auto-swapping was introduced.

## Camera independence correction and core-loop UX

**Current: 301/301 tests pass; build 408.14 kB; all dev servers STOPPED.**

The camera was mutating existing enemies through viewport clamps, first-entry
recycling, offscreen expiry and viewport-based AI destinations. Those paths are
removed. New 400-tick paired-world regression verifies camera-independent AI.
The previous first-entry recycling acceptance was incorrect and is superseded.

Pips/Pause/Q quest disclosure, contextual notifications, readable prize progress,
radar background-only overlap fade, fixed-update dash ghosts, real-time cosmetic
expiry, connected-cut body bounds and contact-batch attack eligibility are now
implemented. Chromium checks ran against the built file with no server.
Python/Pillow verified camera-pan PNGs: actor world position unchanged, actor
visible in both images, projected versus measured screen shift error 0.035px.

See **[camera-core-loop-patch.md](camera-core-loop-patch.md)** for reproduction,
evidence, limits and the explicit remaining optional UX/research work. This
section supersedes older claims below that the port-3000 server is running.

## Full core-plan verification — 2026-11-17

**298/298 tests pass. Production build: 405.28 kB, gzip 181.33 kB.**

The previously blocked browser checks now run successfully: Chromium's missing
NSS/NSPR libraries were unpacked from its existing package. Actual Chromium
checks pass at 1280×720, 550×720 and 860×440: result card/buttons inside viewport,
zero panel scrolling, working Retry, zero page JS errors. Inspected captures
include a visible-stroke/six-digit-score layout stress fixture.

This pass also corrected sector quest AT 00 to AT 01/03, replaced analytic aim
with Matter-order capped integration, enforced real Matter ascent/fall velocity
caps, set deliberate aim to 90% slowdown, added HUD-safe popup/arrow placement,
and recycled unsafe first camera entries without teleporting active enemies.
Dedicated tests cover post-magnet launch agreement, physical caps, entity-only
hitstop and trauma² shake strictly below .6°. Automatic pacing remains separate.

The complete implementation/evidence matrix, reproduction commands and precise
limits are in **[master-qa-checklist.md](master-qa-checklist.md)**. That document
supersedes older browser-blocker and pending-core-work notes below; historical
sections are retained as a change log, not current release status. Optional
DimensionShatter remains deferred. Full native-pointer portal playthrough and
human audio/feel playtesting are not claimed.

## Second screenshot follow-up — radar and HUD readability

User screenshots showed an oversized, unlabelled radar with no visible-camera
reference, a Bastion underneath the speed dial, and a skyline band competing
with actors. These are presentation/occlusion issues; the radar intentionally
includes nearby offscreen contacts, not only objects currently visible.

- Radar geometry is now shared with offscreen arrows. The panel is capped at
  160 CSS px, responsive down to phone/half-preview widths.
- Camera footprint is shaded/outlined; filled contacts are in view and hollow
  contacts are nearby but offscreen. Bastions use squares; Crowns use diamonds.
- Added local-range and contact-key labels. Stationary player uses a dot rather
  than an arbitrary heading; moving player retains its directional marker.
- Proximity fade now uses 48 px clearance instead of 210 px, so the radar does
  not disappear long before the player reaches it.
- The speedometer yields to nearby actor silhouettes using actual DOM bounds
  and camera projection; live actors are not clipped. Reduced-motion users get
  an immediate opacity change, not a transition.
- Midground/ruins gameplay layers now composite at 7% opacity. Title art is
  unchanged, and the skyline no longer forms a high-contrast false platform.

Verification: **292/292 tests pass**; production single-file build **403.42 kB**,
gzip **180.76 kB**; whitespace check clean. New tests cover compact radar geometry,
camera footprint/contact classification, and camera-aware HUD overlap. A fresh
Skia capture (`.arena/radar-fix/falling.png`) was inspected for radar rendering;
it does NOT include the HTML HUD or prove browser layout. Full browser checks
remain outstanding. The only live development server remains port 3000.

## Screenshot follow-up — invisible HUD corners

The screenshot exposed a real renderer bug: HUD exclusion rectangles were being
used as holes in the live-world draw pass. Spawn safety does not stop actors
moving into those rectangles; they stayed collidable while becoming invisible.
**The world now clips only to the viewport.** The radar remains an overlay and
fades near the player; it no longer implies a hidden gameplay exclusion zone.
This supersedes the earlier claim that disjoint HUD clip strips were correct.

Regression coverage now paints actors in all formerly masked corners at five
viewport sizes (including 550×720 and 1106×720) and four camera transforms. The
real renderer pixel test also checks Fang visibility in HUD corners during
tutorial, descent, floor approach and sector climb.

Airborne dash body deformation now uses a single bounded transform, rather than
multiplying speed, dash, sonic, breathing and jelly scales. It caps at 1.25× and
returns to rest within five recovery ticks, even at hyper speed; wall splats and
landing impacts remain separate intentional animations. A drawn-pixel regression
checks cardinal/diagonal high-speed cases (0.1% measurement
tolerance). Cut-chain tones now use C-major pentatonic C–D–E–G–A with a top-note
cap, covered by an audio-unit test.

**Latest verification: 289/289 tests pass; production build 401.77 kB
(gzip 180.28 kB); diff whitespace check clean.** Single dev server: port 3000.
No new real-browser verification was obtained. Remaining checks below still
apply except the airborne dash cap/reset and pentatonic implementation, now
covered above. This is not a claim that every Master checklist item is complete.

## Master QA update — 2026-11-17

This section supersedes older measurements and outstanding-bug notes below.

- Full headless suite: **285 passed, zero failed** (46.2 seconds).
- Production build: **401.88 kB**, gzip **180.33 kB**; single-file verifier passed.
- All five requested named acceptance tests pass, including the real quest UI
  portal → Vault → permanent bestowal/input-reset flow.
- Additional reproducible canvas capture: `node scripts/capture-vault-qa.mjs`.
  It exercises 3/3 → portal → Vault → halo +30 ink → BANK & END and saves
  `.arena/master-qa/vault-bestowal.png`. This is Skia canvas output, not browser
  CSS/layout evidence. Generated captures are ignored by Git.
- Floor kick is now fixed −22, cooldown 12; wall cooldown is 8 simulation ticks
  with absolute expiry. Practice resets history, counters and speed samples.
- Only one development server is intended: port **3000**.

### Evidence limits / remaining QA

Do not interpret passing tests as full completion of the Master checklist.
Zero-scroll 1280×720 and narrow-preview layout remain **unverified in a browser**.
Chromium could not launch (missing `libnspr4.so`); Playwright was not used.
The spawn test covers 2,000 safe-placement candidates and 2,000 live-stream ticks,
but does not prove every actual pinned/offscreen spawn avoids HUD zones.
The combined cube deformation ceiling and under-six-tick square reset still need
correction/verification; individual scale clamps do not bound compounded scales.
Exact preview-versus-launch trajectory agreement, entity-only hitstop,
pentatonic sound and shake-angle limits still need dedicated integration QA.
The optional DimensionShatter remains deferred. Audio/visual polish requires
actual playtesting; no eyes-on browser verification is claimed.

## Correction after the invisible-actors screenshots

The old HUD clip was wrong: it applied CSS-screen rectangles after the world
camera transform. This hid actors while collisions stayed live. The old test
asserted that erroneous ordering. The clip now runs before the camera, with
non-overlapping screen strips so overlapping HUD regions cannot cancel.
Actual Skia pixel tests cover tutorial, falling, floor approach and high sectors;
a mutation moving the clip back after the camera makes those tests fail.

The lower map was also missing: grid row indices were clamped to zero, and an
upward-only frontier suppressed spawning/targeting below a previous peak. Signed
rows now follow descent to the floor in a bounded 3×3 neighbourhood. Nearby clear
masks are retained by distance rather than discarded by an obsolete tide.

**The earlier “66 px solver bug” diagnosis below is superseded.** Its test wrote
`body.position.y` directly, leaving Matter's bounds and previous position stale.
Correct `Body.setPosition` fixtures measure ~1273 px of dash rise in all three
cases and ~240 px of trampoline rise at all three arrival speeds. No solver
patch was needed. The regression now requires useful rise, not merely `> 0`.

The remainder of this document is the historical checkpoint, not current status.

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
