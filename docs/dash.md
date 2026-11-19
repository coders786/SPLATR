# Dash: an 8-way directional animation, with rotation locked at 0

Specified in full by the brief. This is the plan, after measuring what exists.

---

## The golden rule, and what currently breaks it

**Verified today:** the body is a beveled HEXAGON (6 points), not a square, and
on a diagonal it is drawn with a **skew**: `c.transform(1, 0, skew, 1, 0, 0)`.
A skew turns the body into a parallelogram — the vertical edges stop being
vertical. That is a rotation in every sense that matters to the eye, and it
violates the rule outright. **It is removed.**

The bevel is kept. It is the character's silhouette; the brief says "square
with an outer shell", and a beveled square is still axis-aligned. What is
enforced is stricter than "looks square": after every transform that touches
the body, the drawn body must be a **rectangle in screen space**.

## The controller

`run.dash(v)` already exists: it validates the launch, sets phase, decrements
the edge budget, starts the stroke and emits `dash`. It does NOT need rewriting
and I will not rewrite it — the balance (14 dashes, 7-link hyper gate) is
specified and out of scope.

What is added is the **animation controller** on top of it:

- `octant(vx, vy)` → 0..7, index 0 = East, counter-clockwise, matching `DIRS`.
- `dashFor(age)` → the phase and its channels, driven off the existing
  `s.slashAge`, NOT a second clock. A second timer could drift from the blade
  and draw a dash that disagrees with the cut.

## The timeline

The brief's 2 / 5 / 3 frames map onto the existing `SLASH` split
(windup 2, swing 4, impact 2, settle 6) closely enough to reuse the ages:

| phase | ticks | what is drawn |
|---|---|---|
| windup | 0–1 | squash ACROSS the dash axis, core pulls back, leading wall flashes |
| active | 2–6 | stretch ALONG the dash axis, core pinned to the leading wall, trailing wall dissolves into dashes |
| recover | 7–11 | overshoot on the leading side, elastic settle, core re-centres |

## Channels, and who reads them

| channel | reader |
|---|---|
| `along` / `across` | the body's own scale, composed with the pose's `tall`/`wide` |
| `core {x, y}` | the inner core (reuses the eye offset channel; dash overrides gaze) |
| `lead {x, y}` | which wall(s) glow: `+1`/`-1`/`0` per axis |
| `trail` | which wall(s) dissolve into dashes |

Diagonal dashes set **both** axes: two leading walls, two trailing walls, core
wedged into the corner. No rotation, no diamond.

## Wall splat

When a dash is interrupted by a wall, the body flattens against the wall it hit
(axis-aligned, wider than tall or taller than wide depending on the wall), then
springs back. Reuses the jelly spring already built, fed with the impact normal.

## Not doing

- Not touching the dash budget, the hyper gate, or how `launch()` computes speed.
- Not adding a second animation clock that can drift from the blade.

---

## Round 2 results — what was built, and what the measurements said

### The golden rule, enforced at the transform

Four separate body rotations were still in `renderer.js` after the skew was
removed. All four were found by measuring the affine matrix at the moment the
body is emitted, not by reading the code:

| site | what it was | rotation measured |
|---|---|---|
| pose stretch | `rotate(h)·scale·rotate(-h)` | up to 2° every frame |
| swing counter | `c.rotate(poseAnim.counter)` | ±18° |
| blade snap | `rotate·scale·rotate` | 6° |
| contact squash | `rotate(q.axis)·scale·rotate` | 11° |
| aim load | `rotate(a)·scale(a)` | 4° |

All five are now axis-aligned: each one resolves its deformation onto the two
screen axes instead of rotating the frame to apply it.

**Invariant, measured at the glass:** the body's transform has `b = c = 0` in
**152/152** cases (8 directions × 16 dash ages, plus impact, blade, hyper,
splat and daze). Mutation-checked: reintroducing any rotation makes the test
fail with `b = 4.399`.

### Diagonals must not fake a direction

`along`/`across` used to map to X/Y unconditionally, so a **south-east dash came
out WIDE AND SHORT** — the silhouette of an *eastward* dash. A cube that looks
like it is moving east while its trail goes south-east is worse than no
deformation at all.

Diagonals now get a mild **uniform** scale (`sx = sy`). A uniform scale cannot
imply a direction, which is correct: past 45° the direction is carried by the
two lit walls, the corner-wedged core, and the diagonal speed lines.

### The VFX, and the bugs that only showed up on the glass

- **Ghosts** were first drawn at 0–2.6 px from the body centre, i.e. *inside* a
  34 px-wide body — they read as three vertical stripes across the cube. Fixed
  to start at the body's own trailing wall (now −44 / −57 / −69 px). Their
  offset used `lead` raw, so diagonal trails were **1.41× too long**; now
  normalised, and the trail measures identically in all 8 directions.
- **Wall splat** was wired with the wrong field name (`{nx,ny}` passed where
  `{x,y}` was expected), so `splatFor` correctly refused and **nothing was
  drawn**. The whole feature was silently dead. Found by asserting body SIZE at
  the glass — a pose-level test cannot see this class of bug.
- **Particles** are counted on the glass: 13 rects at rest → 18 on launch → 25
  on brake.

### Test coverage added

`test/dash.test.js` — 19 tests: octant naming, lead/trail walls, the three
phases in order, backward anticipation, core pinning, recovery without a pop,
diagonal uniformity, ghost spacing/fade, dust-vs-spark direction, splat phases,
the splat interrupt rule, and the golden rule measured on the real renderer.

`test/support/display.js` now records the **matrix** on every emitted op. Device
points describe *where* a shape landed, never *how* the frame was oriented; the
off-diagonal terms are the rotation, and an axis-alignment invariant reads them
and nothing else.
