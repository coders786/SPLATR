# Falling, rotation, and a cube that feels alive

Three requests: the falling animation, "no rotation", and make the cube lively.
Answers to the two questions: **remove the pose lean** (keep a small waddle and
the death roll), and **jelly + face, equally**.

Measured before writing any of it.

---

## What is actually wrong

### 1. The fall goes silent at vy 80

| vy | tall | wide | eyes | scarf |
|---|---|---|---|---|
| 80 | 1.663 | 0.599 | 0.10 | 3.55 |
| 140 | 1.663 | 0.599 | 0.10 | 3.55 |
| 280 | 1.663 | 0.599 | 0.10 | 3.55 |
| 378 | 1.663 | 0.599 | 0.10 | 3.55 |

`rush` is `clamp01((vy - 20) / 60)`, so it saturates at **vy 80**. Everything
faster — a hyper dive, a terminal plunge — renders identically to a routine
drop. This is the same bug as the horizontal blur last round, still live on the
vertical axis.

### 2. The fall lean is non-monotone

`fall.lean` is `-0.16 * (1 - easeInCubic(k))` and it is **added** to the pose's
own lean. Measured at the body:

| vy | drawn angle |
|---|---|
| 0 | +4.7° |
| 8 | **−12.4°** |
| 20 | **0.0°** |
| 90 | 0.0° |

The body rocks *back* 12° while barely moving, then snaps upright exactly when
the fall becomes real. It reads as a stumble, not as resisting a drop.

### 3. Rotation: the body rotates, then un-rotates around itself

`lean` is a literal rotation in the pose table (E = 0.34 rad = 19.5°). At the
body the renderer applies `rotate(+19.5)` … `cube(angle=p.angle)` …
`rotate(−19.5)`. `cube()` rotates by `p.angle` (≈0), so the *shape* ends up
upright and the 19.5° is spent tilting the **deformation** — which at low speed
is nearly zero. Net visible effect: very little, paid for in complexity.

---

## Part 0 — remove the lean

`lean` becomes an **expression** channel, not a rotation: it now drives which
corner of the body dips, replacing the rotation 1:1. Removed from the pose
table's render path; the value stays in the data so the eight-pose tests keep
their identity, exactly as `twist` was handled last round.

Kept, per your call: the small waddle (cheap, and it sells walking) and the
death roll.

## Part 1 — the fall, escalating end to end

- `rush` becomes `clamp01((vy - plunge) / 200)` so it saturates at **220**, not
  80, and the whole 20→220 range is distinguishable.
- A third axis, `dive`, for `vy > 220`: the body gives up fighting and goes
  streamlined. New vocabulary, so 220 and 378 differ.
- The fall lean becomes monotone: starts at 0 and grows to a hard back-lean as
  the drop gets serious. No rock-back at low speed.
- Eyes: currently bottom at 0.10 by vy 20. They should stay open longer and
  close as the *dive* locks in, so the eye is a readout of the fall's stage
  rather than of a threshold it crossed immediately.

## Part 2 — jelly: per-corner deformation

`trace()` is the single funnel every polygon in `cube()` goes through, so the
deformation belongs there: each vertex is displaced by a smooth field in cube
space, with the four corners leading and lagging by their own amounts.

One spring, critically damped, fed by every impact already recorded
(`impact`, `land`, dash, wall bank). `skinFrom()` turns that spring into a
`{x, y, grip}` field. Cost: a handful of multiplies per vertex, no new draw
calls, so the frame budget does not move.

`grip` is the cell read: a **solid** cube with a little follow-through, never a
jelly blob. A blob reads as soft and unserious; this character is a cube.

## Part 3 — face and idle life

All of it already has a channel; the channels are just not wired to anything
that moves:

| channel | today | proposed |
|---|---|---|
| eyes | 1 or 0.1, a threshold | blink on a timer; squint when a threat is near |
| breathe | does not exist | idle scale pulse, ~1.5s, at rest only |
| scarf | `wave = sin(flutter * 0.09)` | same, but driven by real air speed |
| eye direction | fixed in the sprite | looks toward `nearest()` |

## Order of work

1. Lean → expression (Part 0) — unblocks the fall, removes the rotation.
2. Fall escalation + monotone lean (Part 1).
3. Jelly field (Part 2).
4. Face and idle (Part 3).

Each part gets a test on the drawn frame, and each test is verified by
reverting the code and watching it fail — the one rule that has caught every
real bug in this project so far.

## Not doing

- No camera shake, zoom or roll.
- No change to hyper's entry conditions.
- Not making the cube a gelatinous blob: deformation is small and it recovers.

---

## Built — and what measuring it changed

| part | before | after |
|---|---|---|
| body rotation | `rotate(lean)`, E +19.5°, then undone around `cube()` | **0.0° in all eight directions** |
| fall at vy 80 / 140 / 280 / 378 | identical (tall 1.663, wide 0.599) | 1.362 / 1.466 / 1.713 / 1.795 |
| fall lean at vy 8 / 12 / 20 | −9.2° → −12.4° → 0.0° (rocks back, then snaps) | 0.0° → 0.4° → 11.5°, monotone |
| eyes | hardcoded to close by vy 20 | stay open to 220, close as the dive locks |
| jelly | did not exist | peals 0.31 light hit / 0.89 hard, settles ~14 ticks |
| blink | did not exist | eye area 639 → 386 → 639, irregular cycle |
| gaze | fixed in the sprite | tracks `nearest()` in the body's own frame |

`docs/img/lively.png` is the same cube at rest, flying east, flying west, and in
a 280 dive.

### Three bugs found on the way, all mine or older

- **`fallFor` returned an `eyes` curve nobody read.** `cubePose` did
  `lerp(eyes, 0, fall.k * 0.9)` — a hardcoded zero. The face closed on a
  threshold instead of on the fall's own stage.
- **The fall's squash only used `k`**, which saturates at vy 20, so the blend
  was complete a quarter of the way down the curve. Now weighted by
  `k + rush + dive`.
- **The jelly field was passed as the 7th argument to a 6-parameter `poly`**, so
  it was silently dropped: `poly(c, colour, pts, edge, width, null, F)`. Measured
  by driving the real `cube()` — the body was 46×46 with and without a field
  that scaled it 1.5×. This is the kind of bug a pure-function test cannot see.

I also briefly reported that a landing "flung the cube off screen". That was
wrong: my render harness cropped a fixed region while the camera moved. The real
cube was at (498, 676) the whole time, and the breathing scale was leaking
outside `cube()`'s own `save()` — which I did fix, but it was never the cause of
what I described.
