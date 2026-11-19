# Speed animations, and the UX bugs found while measuring

Two requests: replace the rotation with actual animation, and give hyper and
sonic speed their own looks. Plus: hunt UX/visual bugs rather than maths bugs.

This is the plan, before any code.

---

## Part 0 — What "rotation" means, and what replaces it

`twist` is the channel I added two rounds ago. It rotates the body by up to 28°
on a diagonal. The intent was "the body turns into the corner", but a rotating
square at speed is ambiguous: it can read as spinning, as sliding, as a
mis-aimed sprite, or as the camera rolling. It is also the one channel that
fights the player's read of which way they are going, because a rotated square
and a square moving diagonally look similar.

**Replace it with deformation that has direction.** Specifically:

| remove | add | why |
|---|---|---|
| `twist` (rotate body ±28°) | **skew** along travel | a sheared square reads as *being dragged*, never as *turning*. Same "leaning into the corner" idea, without the ambiguity. |
| — | **per-corner lag** | the trailing corners trail behind the leading ones. This is the cel-animation read of speed and it is inherently directional. |

`twist` stays in the data (the eight poses keep their values) but the renderer
stops applying it as a rotation. Keeping the field means the pose table and its
tests do not change; only the interpretation does.

---

## Part 1 — Hyper speed animation

**What it is:** the 280 px/tick state, earned by seven consecutive links.
**What exists:** six static speed lines at 0.1–0.3 alpha. Deliberately quieted
after a "too much sensory load" report.

**The problem with quiet here:** the report was about hyper *on top of*
everything else firing at once. The fix reduced hyper to near-invisibility. A
player enters the biggest state the game offers and the change is six faint
lines.

**What hyper should do — a build, not a flash:**

1. **Entry burst (18 ticks)** — a hard expanding ring + a radial speed-line
   volley, all in acid. One-shot, so it cannot become noise. This is the
   "promotion" the design doc already claims it is.
2. **Sustained aura, escalating with `hyperLevel`** — the existing six lines
   become a proper field: count 6→12, length, opacity all scale with
   `hyperLevel`, so the player watches hyper *drain* as gravity takes it back.
3. **Body treatment** — the cube's own outline thickens and takes the acid tint
   while hyper is live. Right now only the arena décor knows.
4. **Wake trail** — the movement wake already exists; under hyper it should be
   continuous (a ribbon), not discrete strokes.

**Constraint I will hold:** no camera shake, no zoom, no full-screen flash.
Those were rejected earlier and they were rejected for good reasons.

---

## Part 2 — Sonic speed animation

**What it is:** a wall rebound at hyper speed, up to `HYPER_SPEED * 1.35` = 378.
The design doc calls this "a more sonic boom speed".

**The bug:** measured, **hyper 280 and sonic 378 render byte-identically.**
There is a boom effect at the contact point, but the *cube* does not change at
all. The single most rewarding thing the physics can do — being thrown back
harder than you arrived — has no own look after the frame it happens.

**What sonic should do:**

1. **A distinct silhouette** — at sonic speed the body goes longer and thinner
   than hyper's curve allows, with a **detached leading edge** (a bright
   outline ahead of the body, the classic "the ship is already there" cel).
2. **A pressure cone** — two short lines ahead of travel, converging. Reads as
   *supersonic* immediately and nothing else in the game uses that shape.
3. **Sustained ribbon that outlives the frame** — the rebound should leave a
   streak the cube flies away from.
4. **Escalate past hyper, not plateau** — sonic needs its own axis so 378 is
   visibly beyond 280.

---

## Part 3 — UX/visual bugs found by measurement

These are real, measured today. No maths bugs.

### 3.1 The speedometer needle is dead for the whole game

At full **normal** speed (42 px/tick — the p50 *and* p99 of ordinary flight) the
dial reads **39 km/h with the needle at −20°**, barely off its rest position. It
does 90% of its sweep between 108 and 280 — a region ordinary play never
reaches. Then during hyper it slams to the stop and stays there.

I caused this. Last round I rescaled the dial to the true 0–280 range so the
*label* would stop lying, and did not check the *needle*. The label is honest
now; the gauge is inert.

**Fix:** a non-linear sweep that gives ordinary play the first half of the dial.

### 3.2 Speed past the normal limit is visually silent

Measured: 42 and 120 px/tick differ only by the stretch transform. A player
doing 120 (nearly 3× the limit) sees no escalation because `hyper` is a *state*
that has not been earned. So the game says "you are as fast as you can be"
right up until it says "everything changed".

**Fix:** the stretch/streak curve keeps escalating with raw speed, independent
of the state. The state can stay a bonus on top.

### 3.3 The tier pips can contradict the number

`readout.band` drives the pips and `readout.kmh` drives the number, and after
the recalibration they disagree in the ordinary range: 42 shows "39" with the
needle near rest, but lights 2/5 pips as CRUISE.

### 3.4 Hyper ending is announced, hyper *starting* is only text

`say('HYPER · 280')` is a line of text. Every other major event in the game has
a drawn mark. (The entry burst in Part 1 fixes this.)

### 3.5 The eight poses still rotate

The thing the user actually asked about. Covered in Part 0.

---

## Order of work

1. **Skew replaces twist** (Part 0) — smallest, unblocks everything else.
2. **Speed past the limit escalates** (3.2) — the base curve both speed states
   build on.
3. **Hyper: entry burst + escalating aura + body tint** (Part 1).
4. **Sonic: own silhouette + pressure cone + ribbon** (Part 2).
5. **Dial: non-linear sweep, pips from the same source** (3.1, 3.3).

Each step gets a test that asserts the **drawn frame changes**, not that a pure
function returns a number — that distinction has caught three bugs in this
project so far, and one of them was a test that passed with the feature deleted.

---

## What I am explicitly not doing

- No camera shake, zoom or roll for any of these.
- No new full-screen overlays.
- Not touching hyper's *entry conditions* (7 links / 14 dashes) — those are
  specified, and changing them is a balance decision, not an animation one.
- Not removing `twist` from the pose data, only from the render path.

---

## Built, and what measuring it changed

All five parts shipped. The measured record:

| part | before | after |
|---|---|---|
| skew | body rotated ±28° on a diagonal | sheared: E −0.062, NE −0.149, NW +0.149, W −0.087, S none |
| hyper entry | a line of HUD text | 391 ops during the 18-tick burst, 376 after it ends |
| hyper aura | 6 static lines | 6→12 lines, alpha 0.12+0.42k, escalates 370→376 ops |
| sonic | **byte-identical to hyper** | 376 vs 380 ops, different geometry |
| overspeed blur | exactly 19.00 for every speed above 42 | 19.0 → 33.3 across 42 → 378 |
| dial at full normal speed | 39 km/h, needle at −20° | 70 km/h, needle at +36° |

`docs/img/speed-states.png` is the same frame at four speeds: normal, the entry
burst, sustained hyper, and a sonic rebound.

### The bug this round found, which predates it

Every direction-derived effect was anchored to `p.angle`, but the body frame is
rotated by `p.angle + lean`. Flying **east**, `lean` is +19.5°, so the wake and
the smear were drawn 19.5° off the cube's path — it reads as the cube sliding
sideways. On a **diagonal** it is worse: the cube is rotated 45° as well, so
`atan2` of a rotated vector put the effect at an essentially arbitrary angle.

Reverting the fix makes the new test fail with *"E: lean 19.5deg, no effect ends
on the travel bearing"*, so the test pins the bug rather than merely passing.

### Two things the plan asked for that the measurement rejected

- **A separate ribbon for hyper** (plan 1.4). Built, rendered, and it duplicated
  the morph wedge that already existed — two big acid wedges behind one cube is
  exactly the stacking this document warns about. Removed. The existing wedge
  now grows with `roar` instead, so it stops looking identical at 280 and 378.
- **A `strokeRect` body tint** (plan 1.3). The body is a tapered quadrilateral,
  not an axis-aligned box, so the outline hung off the silhouette on every edge.
  Replaced with a glow drawn *behind* `cube()`.
- **The sonic silhouette block** was a no-op on the first pass: it scaled inside
  a `save()`/`restore()` with nothing drawn between them. Measured by deleting
  it — not one pixel changed. It now wraps the `cube()` call itself.
