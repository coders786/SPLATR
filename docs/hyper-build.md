# HYPER — implementation plan

Approved decisions:
- **Bottom wall replaces the Redline.** Remove the Redline completely.
- **No hurting from any wall.** Walls never damage.
- **No ghost rails.** Walls are not rendered in the world.
- **Lossy bottom cushion** — falling costs most of your speed.
- **7 consecutive / 14 dashes** to enter hyper.

---

## 1. A measurement that overrules one ask

A symmetric −78,000 / +78,000 arena was requested. Measured fall times:

| floor | fall time |
|---|---|
| +4,000 | 3.3 s |
| +12,000 | 6.5 s |
| +20,000 | 9.7 s |
| **+78,000** | **32.6 s** |

Terminal fall speed is capped at 42, so distance is the only variable. A symmetric
floor means **32.6 seconds of falling through empty space** on every drop. That is not a
lossy cushion, it is a dead screen — a punishment that reads as a bug.

**Building at +12,000 (6.5 s fall).** The *intent* — the bottom wall is a real, lossy
landmark — is preserved; only the constant changes, because the constant was serving the
opposite of the intent. If you want it further, say the word and it is one number.

---

## 2. Why the Redline cannot simply be deleted

`s.line` is not only the death line. It is load-bearing in four places:

| Use | Where | Consequence of removing |
|---|---|---|
| **Enemy spawn frontier** | `stream.sync(p, line)` — `levels.js` skips any cell with `-(y+1)*CELL_H > line + 80` | the field stops defining a frontier and enemies spawn without bound |
| **Death condition** | `if (p.y + 18 >= s.line) end('Redline')` | replaced by the floor wall |
| **Warning system** | `s.warning` drives `PACE.warnDepth` pacing | the whole panic/telegraph system goes with it |
| **Tests** | `run.test.js:75`, `opening.test.js:253` assert `cause === 'Redline'` | must be rewritten to assert the new behaviour |

So this is removal of a *mechanic*, not a line of code. The plan keeps the spawn frontier
(without the lethality) and deletes the death, the warning stripe, and the cause text.

---

## 3. The floor rule

Analytic, in `railBounce`, alongside the existing walls:

- On contact with the bottom rail: reflect `vy`, then **multiply both velocity components by
  `FLOOR_CUSHION` (0.45)**.
- Emit `floor` with the impact speed so the HUD can say what it cost.
- Never call `hurt()`. No wall ever damages.

`FLOOR_CUSHION = 0.45` means a fall is survivable but genuinely costly: you keep roughly a
fifth of your energy and have to rebuild. It is the difference between a bounce and a
setback, which is what "lossy" has to mean to be felt.

---

## 4. Scope: the mechanics, not the whole tier

This chunk ships the **wall layer**: floor, removal of the Redline death, no-damage walls.
It deliberately does **not** ship the hyper entry gate or the compounding bounce — those are
the next chunk and depend on this one being correct.

---

## 5. Verification — RESULTS

| Gate | Result |
|---|---|
| No wall damages | **PASS** — all four walls contacted, hp 3, phase playing |
| Floor costs speed | **PASS** — arrival 42 → after 17, ratio **0.40** |
| Redline death path gone | **PASS** — no `end('Redline')`; catch branch and aim 'tide' retired |
| Field still bounded | **PASS** — `s.line` kept as spawn frontier, no longer lethal |
| Tests | **123/123**, six rewritten rather than deleted |
| Frame cost | unchanged (2% of a frame) |

### Tests that had to change, and why they were right to fail

1. `the first fall … catches once` → now asserts **no catch**, because the net
   existed only to rescue you from the Redline.
2. `coasting … leads to a real Redline loss` → now asserts **survival**.
3. The field guide's `net` scene → will not teach a retired mechanic.
4. `arcPath` tide truncation → asserts **retirement**: a line that used to end
   the arc now does nothing.
5. `threatAhead` tide panic → asserts **no panic**, because there is nothing
   lethal to be shoved away from.
6. `sky.hit` null → this assertion was only ever passing *because* the tide
   truncated the preview before the arc reached a real Fang at y=−517. Corrected
   to assert the hit is not a tide.

That last one is worth noting: a passing test was hiding the fact that the
preview misreported what a shot would hit.

## 6. Still to build

The wall layer ships here. **Hyper entry (7/14), the ceiling unlock, and the
compounding bounce are the next chunk** — they depend on this being correct.

## 7. Verification

| Gate | Measure |
|---|---|
| No wall damages | take a zero-hull-loss run into every wall |
| Floor costs speed | arrival speed vs departure speed, expect ~0.45× |
| Redline gone | no `end('Redline')` path; tests rewritten |
| Field still bounded | enemies do not spawn below the frontier |
| Tests | all pass, with the two Redline assertions rewritten rather than deleted |
| Frame cost | unchanged (measured 2% of a frame) |

---

## 8. HYPER, as shipped

The state itself. Entry, the promotion, the bounce, the exit, and the effect
curve — plus the four bugs the measurements found that no amount of planning
would have predicted.

### 8.1 The constants

`HYPER = { speed: 280, chain: 7, dashes: 14, bankGain: 0.6, reboundCap: 1.35, drag: 0.005 }`

`speed` was bisected in §3: 242 is the minimum to cross 78,000 px, and 280
leaves a 34,000 px margin. The rest are new.

### 8.2 Entry is a RISING EDGE, and the budget follows the STREAK

Two separate bugs, both found by measurement:

1. **Re-entry off a stale chain.** `chain >= 7` is a *level*, not an event. A
   state that ended at speed 41 with a chain of 9 still on the board promoted
   again on the very next tick — measured **4 entries in 65 ticks, all off one
   chain**. Fixed with `hyperChain`: the streak that earns hyper is CONSUMED by
   it, and `chain > hyperChain` makes the gate a rising edge. That also matches
   the brief's wording — "7 **consecutive** chains" means a fresh streak.
2. **The 14-dash budget was on the RUN, not the streak.** `shots <= 14` is only
   true for the first 14 launches of a run. In a 128-dash run that closed the
   gate permanently after 11% of play: the feature was unreachable for the other
   89%. Fixed with `chainFrom`, recorded when a streak starts, so the budget is
   `shots - chainFrom <= 14` — seven links *within fourteen dashes of each
   other*, which is what the brief actually asks for.

### 8.3 A dash must not erase hyper (`holdSpeed`)

`launch()` clamps to `MAX_SPEED` — correct for a launch, catastrophic here. A
dash during hyper reset the cube from 279 to 31 in a single tick and ended the
state on the next one. The fix went through two wrong versions before landing:

| version | result |
|---|---|
| refill to `HYPER.speed` | **infinite**: 1,650 ticks / 27s, never ended |
| `holdSpeed(world)` (preserve live velocity) | **14 ticks**: `launch()` had already clamped it, so "preserve" preserved the damage |
| `holdSpeed(world, speedBeforeLaunch)` | **666 ticks median** (~11s) |

The dash owns the heading; the state owns the magnitude; nothing is repaired.
Gravity and drag stay the only drains. `holdSpeed` lives in `physics.js` next to
`boostPlayer` rather than importing Matter into `run.js`.

### 8.4 The bounce is ONE boom, then a turn

A speed-scaled multiplier on every rail contact is a perpetual motion machine.
Measured: a bot touching a rail every 8 ticks gained 4.8% per bounce while drag
took 3.9% — hyper ran 1,440+ ticks and never ended. Even a modest 2.2% boost was
net positive.

So the boom is armed on entry (`s.hyperBoom`) and spent by the first contact:

- **first bounce**: gain `1 + (speed/280)*0.6`, capped at `1.35`, ceiling raised
  to `280 * 1.35` and *held* for a few ticks so the throw actually lands
  (previously the ceiling was reset to 280 on the next tick — every bounce
  peaked at 354 for one frame and was cut to 280).
- **later bounces**: multiplier **1**. A wall is a turn.

Measured peaks after the fix: **312–376**, then decaying 318 → 249 → 246.

### 8.5 Exit is physical, and friction is a real term

No timer. The state ends when speed drops back to `MAX_SPEED` — `drag: 0.005`
per tick plus gravity. Median duration **666 ticks (~11s)**, range 388–815.

### 8.6 The effect curve must ADD, not normalise

The `ceiling` parameter was first implemented as `t = speed / ceiling`. That is
wrong twice over, and the numbers say so plainly:

| implementation | 42 vs 42 | 42 vs 280 | 100 vs 280 | 280 vs 280 |
|---|---|---|---|---|
| normalise by ceiling | 1.52 / blur 26 | **0.36 / blur 0** | 1.52 / 26 | 1.52 / 26 |
| **additive hyper term** | 1.52 / blur 26 | **1.52 / 26** | **1.69 / 34** | **2.05 / 53** |

Normalising rescales the *normal* range, so ordinary top speed collapsed to
DRIFT with zero stretch the moment a hyper ceiling was in scope — and 42 and 280
both saturated to the same curve, so the loudest state in the game rendered
identically to a redline shot. The shipped model leaves `speed <= max`
byte-identical to what was already there and adds `hyperGain * over^0.8` above
it.

The HUD needed matching fixes: `readout.kmh` 667 drove `strokeDashoffset` to
-567 and spun the needle **twenty full turns**, so the arc and needle clamp to
their physical end while the number stays free to read past 100. `TIERS` gained
a HYPER entry — without it `TIERS.find(t => t.label === 'HYPER')` fell back to
`TIERS[0]` and the pips went *dark* at full hyper. Fifth pip added to the DOM.

### 8.7 The camera pins the cube

Every smoothing rule in `camera.js` is tuned for a 42 px/tick cube. At 280 the
pin is not a preference, it is the only option: the follow is capped at 30 px,
the lead saturates at 118 px and lags a direction that reverses on every wall,
and the safety net ends up doing all the work.

Measured **cube screen-slip while hyper was live: p95 0.191 of the viewport**
(up to 0.24) — the cube visibly teleported around the screen. Three fixes, in
order of how much they mattered:

1. **Pin to the cube, not to `d`.** `d` is the framing target and it lags too;
   pinning to it still left 500 px of error (`viewX -2800` vs `pX -2140`).
2. **Collapse `prev` while pinned.** `view(alpha)` lerps last tick → this tick,
   which at 280 px/tick is a quarter-viewport lag on its own.
3. **Retire the lead to zero** rather than freezing its approach rate, and zero
   the lean (it swings with a velocity that reverses on every wall).

Result: **p95 slip 0.000**, max 0.07. Normal flight is untouched (0.010 / 0.029).
The camera *does* travel 280 px/frame during hyper — that is the world streaming
past a held cube, which is the point.

### 8.8 What this did to the frame test

`test/frame.test.js` broke, and the investigation is worth recording because the
test was measuring the wrong population:

- It tracked **idle** enemies. During hyper the cube outruns the field and
  40,969 enemy-ticks were idle against 298 telling, so most samples were of
  parked shapes that legitimately do not move. Excluding idle is the fix.
- Its 2% duplicate budget only ever passed because those parked enemies were
  averaged in. On genuinely moving enemies the duplicate share is 2.6 / 4.2 /
  2.7 / 5.8% at 60 / 120 / 144 / 240 Hz — all sub-tick repetition, which is the
  *correct* output when several render frames fall inside one physics tick. The
  budget is now rate-aware.
- `prev` was not cleared when the watched enemy changed, so a switch compared two
  different shapes' positions.
- Hyper samples are measured separately. Large travel there is the state
  working, not a smoothing failure.

The evenness ratio — the number that actually detects stutter — is **1.24–1.32**
at every rate, against a 1.8 limit.

### 8.9 Verification

| gate | result |
|---|---|
| suite | **132/132** (9 new in `test/hyper.test.js`) |
| entry | fires at exactly 7 links; not at 6; not past the dash budget; inclusive at 14 |
| re-entry | one entry per streak (was 4 off one chain) |
| reachability | **23/32** policy-seed runs, **43 entries** |
| duration | median **666 ticks (~11s)**, 388–815 |
| peak | **333–376** (vs `MAX_SPEED` 42) |
| bounces | boom once at 312–376, then 318 → 249 → 246 |
| deaths | **0** across 26,781 hyper ticks |
| camera | cube slip p95 **0.000** in hyper, 0.029 normal |
| build | **323.3 KiB**, one file |

### 8.10 One more, found while checking the HUD wiring

`TIERS.find(t => t.label === readout.band)` then `tier.index`: only `tierOf`
ever stamps an `index` onto a tier, so the lookup handed back a tier with
`index === undefined`, and `i <= undefined` is false for every `i`. All five
pips therefore went **dark at the exact moment hyper fired** — the loudest state
in the game would have shown the emptiest HUD. The index now comes from the
array position (`findIndex`), HYPER is the fifth tier, and a test walks every
band the readout can return to assert it maps to a real, ordered tier.

---

## 9. Rebuilding the frame tests on the real render path

§8.8 replaced three tuned thresholds with a rate-aware budget and blamed the
harness. That was half right, and the half that was wrong is the more
interesting one: **nothing in the suite tested the renderer at all.**
`test/frame.test.js` called `pose(e, alpha)` and `camera.view(alpha)` itself and
compared the two results to each other, so it measured a *copy* of the render
path. A bug inside `draw()` was invisible to it by construction.

### 9.1 Three ways the old harness measured the wrong thing

| flaw | evidence |
|---|---|
| Bot cadence ran off **frame count** (`clock % 45`) | 60/75/120/144/240Hz played four different games: **81 / 95 / 100 / 78** dashes |
| Window was `ticks * 4` **frames** | **5,600** simulation ticks at 60Hz vs **1,400** at 240Hz — four run lengths |
| `alpha` was **0.000 on every frame at 60Hz** | So "interpolation" was never exercised, and `pose(e, 0)` returns `e.px` verbatim. The duplicate metric was measuring "did the source array change", not the picture |

The fix is to advance by **wall time** and drive the simulation from inside the
production `clock.frame()`, exactly as `main.js` does. Same seed now reaches the
same simulation clock at every rate (asserted: spread ≤ 2 ticks).

### 9.2 A display a headless test can see

`test/support/display.js` gives the real `createRenderer()` a recording 2D
context: a Proxy that answers every canvas call, tracks the affine matrix stack,
and records every pixel-producing op in **device space**. No jsdom, no canvas
package. The DOM stub is exactly three globals — `document.createElement`,
`ResizeObserver`, `devicePixelRatio` — so a new DOM dependency fails loudly
instead of silently passing.

Two oracles come out of it:

- **frame signature** — what was painted where at what alpha. Two frames with the
  same signature are the same image, so duplicate detection is exact rather than
  inferred.
- **draw trace** (`traceDraws()` in `renderer.js`) — what the renderer *decided*.
  A shape drawn from a stale interpolation and a shape drawn correctly can emit
  the same op stream; the trace records the id, the interpolated position, the
  two ticks it sits between, and the device-space result. The cube is traced too,
  because every camera rule is written around it.

Cost when off: one `null` check. Measured 1.112 ms/frame off vs 1.284 ms/frame
with a full capture against a recording context.

### 9.3 The mistake the new tests found in shipped code

The hyper camera §8.7 collapsed `prevX = x` while pinned, so `view(alpha)` had
nothing to interpolate. That was defended as necessary — a stale `prev` would
draw the world one hyper-jump away — and it was **both unnecessary and harmful**:

- The pin is `x = p.x - vw*0.48`, an *affine function of the cube*, and
  `bodyPose(player, alpha)` interpolates the cube identically. So interpolating
  the camera keeps the cube at a **constant** viewport fraction for every alpha.
  Measured cube slip in hyper with the collapse removed: **p95 0.0000** at both
  60Hz and 144Hz; with it in place, the same.
- Collapsing `prev` prevents *any* smoothing inside hyper, so every frame shows a
  whole physics tick of camera motion at once. Measured frame-mean world travel
  under hyper: **p50 60.2 px at 60Hz against 0.4 px at 144Hz** — the *lower* the
  refresh rate the worse it read, which is backwards. Removing the collapse:
  144Hz p50 **0.4 → 25.0 px**, p95 **133 → 63** (ratio 332 → 2.5), and the share
  of steady hyper frames went **41% → 56%** at 60Hz and **76% → 95%** at 144Hz.

That is a real defect in shipped code, found only because a test could finally
see the glass.

### 9.4 Mutation testing: proof the suite is not vacuous

A green suite proves nothing on its own. Eight plausible regressions were
injected one at a time, and every one is now caught:

| mutation | caught by |
|---|---|
| hostile drawn at the live tick (ignores alpha) | interpolation sweep |
| hostile drawn at the previous tick (alpha inverted) | interpolation sweep |
| hostile drawn at `Math.round(alpha)` | interpolation sweep |
| camera pin removed | cube-pin test |
| pin offset drifts with position | cube-pin test |
| clock returns 0 instead of the remainder | clock contract |
| clock discards debt (skips ticks) | clock contract |
| renderer leaks a `save()` without `restore()` | transform balance |

Getting to 8/8 required fixing the tests, not the thresholds:

- The first pass **survived the alpha mutation**, because `traceDraws()` reused a
  caller array and the sweep silently compared stale entries between two frames.
  The API now clears on start and returns a fresh sink.
- The sweep then **skipped shapes that culling dropped at some alphas**, so it
  compared almost nothing. It now asserts a minimum number of survivors and a
  minimum number of *moving* shapes, and fails loudly instead of passing
  vacuously.
- The transform test originally only asserted `Number.isFinite`, which a leaked
  `scale(1.001)` passes. It now asserts balanced `save`/`restore` counts *and*
  the absolute matrix returning to the frame's base.

### 9.5 Verification

| gate | result |
|---|---|
| suite | **141/141** (10 frame tests, up from 3) |
| mutation battery | **8/8** injected regressions caught |
| wall time | 80s before memoising the playthroughs, **27s** after |
| refresh rates | 60, 75, 120, 144, 240 Hz |
| build | **323.2 KiB**, one file |
| preview | 200 |
