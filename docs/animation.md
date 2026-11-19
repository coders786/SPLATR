# Animation system — anime-inspired

Four systems, all driven by the existing integer tick clock and interpolated by
the render `alpha`. The governing rule: **nothing here may add sensory load.**
The previous round removed 30% of the stretch curve and a spinning aura because
the player could not track the cube. Anime motion is not "more effects" — it is
*sharper* effects with *real* timing. Every system below is built on three
anime-specific principles and nothing else:

1. **Ma (間), the held beat.** Anime action is mostly stillness, punctuated by
   one decisive frame. A slash is 2 frames of huge arc and 8 frames of nothing.
   Never a continuous wobble.
2. **Smear + impact frame.** The single most identifiable anime technique: the
   extreme pose is not drawn, it is *smeared* into a wedge, and the contact is a
   flat high-contrast frame. We already have `morphWedge` and the shear ink; they
   become the slash.
3. **Chibi squash & snap.** Character weight is expressed by 1–2 frame
   exaggeration that snaps back with easing, not by bobbing. Squash on landing,
   stretch on launch, no idle sway.

## 1. Slash animation (`slashFor`)

**The problem:** a slash is currently a static blade shape that appears and
fades. There is no swing.

**The design:** a 4-phase performance over ~14 frames, triggered on every
`beginStroke` (each dash) and re-punctuated on each contact.

| phase | frames | what the eye sees |
|---|---|---|
| wind-up | 0–2 | blade rotates BACK past the swing origin by 22°, body counter-rotates 0.6 rad. The "preparation". |
| swing | 3–6 | the blade sweeps 200° in 4 frames, drawn as a **morph-wedge smear** with a bright leading edge. `easeOutQuint` — all the speed is in frame 3. |
| impact | 6–7 | a flat 2-frame hold: the arc is drawn solid white at full width, the screen gets a 1px flash of the arc only (no full-screen flash). |
| settle | 8–14 | the arc fades from the tail, decelerating. The blade drifts to rest. |

The key anime property: **the swing is asymmetric in time.** 4 frames to cross
180°, 8 frames to settle. A symmetric ease reads as a machine; this reads as a
sword.

## 2. Falling animation (`fallFor`)

**The problem:** the cube is a single static silhouette in the air, whether it
is climbing at 280 or dropping at terminal velocity.

**The design:** a fall is *not* just inverted stretch. Anime falling has a
distinct vocabulary:

- **gathering:** in the first frames of a descent the cube tilts backwards
  against its travel (a "resisting gravity" lean) and the scarf lifts.
- **plunge:** past ~14px/tick downward the silhouette becomes a vertical wedge,
  nose-down, with the eyes closed to two lines. The trailing smear runs
  *upward*, opposite the cube — the air is being left behind.
- **land:** the impact squash. 1 frame at **1.42x wide / 0.66x tall**,
  `easeOutElastic` back to 1.0 over 8 frames. Anime impact squashes hard and
  recovers with one overshoot, not a sine wobble.

## 3. Movement animation, 8 directions, interpolated (`moveFor`)

**The problem:** the cube's facing is `p.angle` from physics (angular velocity
on launch). It does not *aim*; it does not lean; there is no sense of the cube
pushing in a direction.

**The design:** movement is quantised to **8 directions** (N, NE, E, SE, S, SW,
W, NW) but the *rendered* pose is **interpolated continuously** between them.
This is the brief's "8 directions must be interpolated": the state machine has 8
discrete poses, the renderer blends the two nearest by angle, so the animation is
smooth while the poses stay distinct and readable.

Each of the 8 poses is a small, deliberate body-language:

| dir | lean | squash axis | scarf | eye |
|---|---|---|---|---|
| N (climbing) | 0° | tall 1.08 | streams down | forward |
| NE / NW | ±12° | tall 1.04 | diagonal | forward |
| E / W | ±22° | neutral | horizontal | forward |
| SE / SW | ±14° | wide 1.05 | up-back | down |
| S (falling) | 0° | tall 1.10 → plunge | up | closed |

Blending: `w = 1 - frac(angleOctant)`, mix lean, squash and scarf phase. When
the velocity is near zero the cube holds the last pose (no snapping to N).

**Interpolation contract:** all of these are driven by `alpha` where it matters
(position), and by a *renderer-local* eased phase where the animation is
discrete (the swing, the land squash). The two are never mixed: physics
interpolation must stay exact so the camera pin (p95 < 0.02px) still holds.

## Verification

- `test/animation.test.js` (16 tests): the 8 direction poses are distinct;
  blending produces a pose strictly between its neighbours; the swing passes
  through all 4 phases in order; the swing is asymmetric in time; the blade
  cocks back before swinging; the squash peaks > 1.35x, preserves area, and
  overshoots exactly once; the smear never pops back up after the peak; and
  **all three systems fire during a real 1,800-tick run.**

### What the measurement changed

Two design decisions were wrong and were caught by testing rather than by
looking:

1. **The impact frame was as smeared as the swing** (0.42 vs a peak of 1.0 was
   the fix). A smeared hold makes the hit read as soft and late; anime impact
   frames are SHARP and the smear belongs to the travel before them.

2. **The landing squash was dead code.** It passed every unit assertion and
   fired zero times across six full runs, because nothing in this game lands:
   the cube launches off a pad, climbs, and never comes back down. Measured
   landings per run: `0, 0, 0, 0, 0, 0`. The squash is now keyed on a connected
   cut (17–48 per run) — the real impact in this game, and the moment that
   actually deserves an impact frame.

   This is why the last test exists. A direct call to `landFor()` proves the
   curve is right and proves nothing about whether the player ever sees it.
- Mutation battery: remove the wind-up → the phase-order test fails; make the
  swing symmetric → the asymmetry test fails; skip the land squash → fails.
- Existing guards that must not regress: cube pin p95 < 0.02px, calm p95 < 0.25,
  transform balance, 145 existing tests.

## What the second measurement changed

The first pass shipped with 13 green tests and one claim I never checked: that
the pose I computed was the pose on screen. It was not. `landFor` documents
`wide: 1 + 0.42*q` as ">1 = wider than tall", and the renderer applied
`c.scale(1 / wide, 1 / tall)` — the reciprocal. **Every one of the eight
directions and every landing was drawn backwards.** The landing stretched tall
and thin like a pulled spring instead of splatting wide; the northward lean grew
broader instead of taller; the plunge flattened into a pancake instead of
stretching into a needle.

It survived because of how I checked it. I instrumented `ctx.scale`, saw
`(0.704, 1.515)` on a landing frame instead of `(1, 1)`, and called the squash
"proven". The probe confirmed *an effect existed*; it never asked whether the
effect pointed the right way. Proving the mechanism is not proving the result.

The fix is one line, and the test that catches it compares `sx` to `sy` rather
than merely checking they differ:

```js
assert.ok(aniso.some(([sx, sy]) => sx / sy > 1.05),
  'the squash must make the body WIDER than tall, not narrower');
```

Sampling also had to move. My first attempt hooked `save()`, which reads the
matrix *before* the character's scale is applied — the view transform, always
uniform, passing no matter what the body did. Hooking `scale()` directly is what
makes the assertion mean anything.

Two other things were computed and thrown away: the eyes and the scarf. Both now
reach the canvas. `cube()` takes a `pose` argument — `eyes` closes each lid
toward its own centre line so it reads as a squint and not a vanished face, and
`lift` pulls the scarf tips back and up. `pose = null` reproduces the old drawing
exactly, so the title screen and the score slip are untouched. The fall trail is
drawn now too, upward and behind the body, and it scales with how hard the cube
is actually falling.

The lesson worth keeping: **a test that calls a pure function proves the curve,
not the frame.** Every animation test that only imported `animation.js` would
have passed with the character rendering inside-out.

## The HUD was lying about speed

Three things were wrong in the same corner of the game, and only one of them was
where the report pointed.

**The dial was pegged.** `speedReadout` scaled to `MAX_SPEED` (42), so 42 read
100. But 42 is not a ceiling a player occasionally touches — measured over five
casual runs it was the p50, p90 *and* p99 of ordinary flight. The needle sat
against the stop for essentially the whole game, and the only thing left for it
to say was "HYPER", which it said at 44 px/tick. Of every HYPER label in a real
run, **27% were false**, and the fastest speed it mislabelled was 106.7 px/tick
against a true hyper of 280.

The dial now spans the speed the game can actually reach (0-280), and the tiers
sit on measured positions:

| speed | reads | band |
|---|---|---|
| 42 (ordinary p50/p99) | 39 | CRUISE |
| 108 (fastest ordinary, 5 seeds) | 62 | EDGE |
| 151 (hyper p50) | 73 | HYPER |
| 280 (hyper ceiling) | 100 | HYPER |

Ordinary play is now the middle of the dial instead of its ceiling.

**And HYPER is a state, not a speed.** The band was `speed > max`, so any bounce
that carried the cube past 42 earned the banner. It now keys on the game's
actual hyper state — seven consecutive links. False labels: **332 -> 0**.

**The camera teleported into its pin.** `pinned = speed > MAX_SPEED` hard-set the
camera to the cube, so on a fall the cube sat at screen-y 0.827 at 42 px/tick and
0.560 at 48 — a **231px jump in one frame**, 27% of the viewport, on every fall
through the line. The pin is now an easing weight, damped over ~5 ticks: worst
single-frame displacement **27% -> 18.6%**, p50 **1.02% -> 0.67%**, p99.9 **40%
-> 15.9%**.

The five remaining jumps are real physics: hyper entry (`boostPlayer`) takes the
cube from ~40 to 277 in one tick. That is a burst the game means to deliver, so
the camera absorbs it over a few frames rather than pretending it did not happen.

**The red band at the bottom is gone.** It was the last thing still wearing the
Red Line's costume — a row of rose teeth reading "do not cross", when the bottom
is a wall identical to the other three and touching it costs a bounce. It is now
a cool ruler with tick marks that crowd as the floor nears, plus one amber line
in the final stretch. No red, no teeth.

## Baking the curves, and making the poses actually visible

Two changes, one measured cause.

### The poses were too small to see

The eight direction poses covered **6.0px of travel on a 46px body** — tall
0.95..1.08, lean 22.9°, eyes never more than half shut. Measured, that is a
square twitching, not a character moving. The numbers had been chosen for how
they looked in a table, not against the size of the thing being drawn.

The range is now sized against the body:

| channel | before | after | on a 46px body |
|---|---|---|---|
| tall | 0.95–1.08 (6.0px) | 0.86–1.20 | **15.6px** |
| lean | 22.9° | 39° | — |
| twist | *did not exist* | 28° | new |
| wide | 0.96–1.08 | 0.88–1.18 | 13.8px |

`twist` is new and it is the one that makes a diagonal legible. Without it NE
and NW are "north, slightly tilted" — both corners read as variants of the same
pose rather than as their own decision. With it, the body turns INTO the corner.

`stretch` is also new: how hard the cube is being dragged along its own heading
by speed alone. It is applied in the heading's frame (rotate, scale, unrotate),
so a cube thrown east gets longer east, not taller — which is different from
`tall`/`wide` (the pose's own proportions) and from the airborne streak (which
only fires off the ground).

### The curves are baked

`src/bake.js` bakes the per-frame curves into flat `Float64Array`s at module
load. Measured over 2M evaluations each:

| function | live | baked | speedup |
|---|---|---|---|
| `slashFor` | 521.8ms | 72.0ms | **7.2×** |
| `landFor` | 210.4ms | 6.7ms | **31.3×** |
| `moveFor` | 250.7ms | 5.5ms | **45.7×** |

Real-run draw cost: p50 **0.35 → 0.41ms** with *more* animation drawn on top,
p99 3.97 → 1.49ms, and **0 of 1500 frames** over the 16.7ms budget.

`animation.js` keeps the pure functions — they are the specification, and the
tests still hold them to their shape. The renderer reads the tables because it
is the thing running 60 times a second. The bake is not an approximation: the
slash table was verified against `slashFor` across five bearings × 14 ticks with
a worst error of **8.9e-16**, i.e. float precision.

**The one real risk of a table is staleness**, and the first guard against it did
not work. Comparing `SLASH_TABLE` to a fresh `bakeSlash()` catches a hand-edited
table but not the failure that matters: edit the curve and forget the table, and
both sides re-derive from the same source at import time, so they move together
and the comparison is green on a renderer drawing the old shape. Verified by
mutation — scaling the swing smear by 1.3 in `animation.js` left every re-bake
comparison passing.

`test/bake.test.js` therefore pins the table against **numbers** (swing peak
smear is exactly 1, the settle inherits the impact value exactly, the landing
opens at 1.42 × 0.66), not against a second bake. Changing a curve now forces
someone to come and change the pinned values, which is the moment they notice
the renderer reads a table.

### More to look at

With the budget freed, two layers were added:

- **Slash:** radial speed lines fanning along the travelled arc (3–7 of them,
  more at the peak) plus two afterimages of the leading edge. This is the
  cel-animation trick — you do not blur a fast object, you draw it where it WAS.
  Peak swing went from **+3 ops over idle to +12**, and the impact frame stays
  clean so the contrast sells the stop.
- **Movement:** a wake of 2–6 strokes streaming off the trailing edge, scaled by
  the same `stress` that drives the stretch, fanned across the body's width. At
  rest: none. Full launch: 363 ops against 348 at rest.

Bundle: 330.1 → **332.9 KiB**, gzip 154.7 KiB. The raster ban in
`scripts/check-bundle.mjs` still holds — everything added is geometry.
