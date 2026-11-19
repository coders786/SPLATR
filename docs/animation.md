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
