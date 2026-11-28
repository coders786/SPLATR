# Section 3 — the three checks, reported (not fixed)

Scope: report only, per the brief. Section 4 waits for Sections 1–2 to ship
(they have; commits `179b818`, `80e0ad2`, `c4306a0`) and for this report.

Method: every number below comes from driving `createRun` in Node against the
real modules — no reading of the drawing code and guessing. Probes are throwaway
(`g6.tmp.mjs`) and not committed.

---

## 1. Aim tether vs arc — **CONFIRMED, and it is worse than the recording showed**

### What is already true

The preview and the fired shot **do** share their vector. `predictAim()` calls
the same `magnetize()` the input layer calls (`aim.js:260`, `input.js:40`), and
`input.js` carries the comment "the vector that is DRAWN is the vector that is
fired". So the original suspicion — preview showing one direction and the game
firing another — does **not** reproduce. That part is honest.

### What is actually wrong

The preview draws a **constant-velocity** trajectory. The real cube decelerates
the whole way. `arcPath()` sweeps `projectilePoint(start, velocity, t)` for
`t = 2 … 190` (`ARC.maxTicks = 190`), and `projectilePoint` is
`v·t + ½gt²` — no drag term:

```js
export function projectilePoint(start, velocity, ticks) {
  const g = GRAVITY_Y * BASE_GRAVITY * STEP_MS * STEP_MS;
  return {
    x: start.x + velocity.x * ticks,
    y: start.y + velocity.y * ticks + 0.5 * g * ticks * ticks,
  };
}
```

Measured drag: the cube loses a steady **0.9851 per tick** (mean ratio across
ticks 2–40, one dash). Measured speed for a 28.3 px/tick launch: 28.3 at t=0,
**24.6 at t=10, 18.2 at t=30, 12.0 at t=50, 6.1 at t=80**. It then falls back
under gravity, which is why the real path turns around near y ≈ −1040 while the
preview keeps climbing.

### Error, measured at matched ticks (launch `{x:6, y:-28}` from the origin)

| tick | preview (x, y) | actual (x, y) | error |
| ---: | :------------- | :------------ | ----: |
| 10 | 60, −261 | 60, −261 | **0 px** |
| 20 | 120, −485 | 114, −463 | 23 px |
| 30 | 180, −671 | 166, −630 | 44 px |
| 40 | 240, −820 | 213, −757 | **69 px** |
| 50 | 300, −931 | 270, −878 | 61 px |
| 60 | 360, −1005 | 330, −970 | 46 px |

For scale, a shape radius is 31–67 px. **The preview is off by a full shape
radius by tick 40**, and it does not stop there: it is drawn out to 190 ticks,
by which point the cube has stopped and turned around. At the end of one
measured dash the preview terminated at **(1128, 1363)** while the cube was at
**(462, −1040)** — 2,500 px and an opposite heading.

### Why the error is worst in the middle

The error is zero at the start and rises, which is the signature of an omitted
drag term rather than a wrong direction. That matters for the fix: the first
~10 ticks are trustworthy, which is exactly the window the player uses for a
snap decision. The arc is wrong precisely where it is being read as "where will
I end up".

### Recommended fix (not applied)

Add the drag term to `projectilePoint`, or better, give the preview its own
integrator that steps `v *= 0.9851` per tick and applies gravity to the
velocity rather than as a closed-form `½gt²`. Two things to get right:

1. **Do not change `projectilePoint` alone.** It is also used by `guide.js`,
   `opening.js` and `guideboard.js`, where the constant-velocity arc is the
   intended path of a *scripted* element, not a prediction of the player's cube.
2. **Shorten `ARC.maxTicks`.** 190 ticks is 3.2 s of predicted flight; the cube
   stops at roughly tick 80. A preview drawn past the point where the cube has
   stopped is drawing a place the player cannot reach.

Then the reticle can be trusted, and the "snap" the brief asks for becomes a
matter of snapping to the honest end point instead of to a point 2,500 px away.

---

## 2. Orange star pass-through — **CAUSED BY THE BLADE EXPIRY, and it is fixed**

### The two hypotheses in the brief

- *Was `s.blade` expired mid-flight?* — **Yes. This is the cause.**
- *Is the star in a non-slashable spawn/pulse state?* — **No. Ruled out.**

### The star is slashable in every state I could build

Driving a real dash into each species and letting the real contact loop resolve
it (not calling `cut()` directly):

| species | result |
| :------ | :----- |
| rift (orange star) | cut, hp 1 → gone |
| prism | cut, hp 1 → gone |
| well | cut, hp 1 → gone |
| fang | cut, hp 1 → gone |
| crown | cut, hp 3 → 2 |
| bastion | cut, hp 2 → 1 |
| fork | cut, hp 1 → gone |
| pulse | cut, hp 1 → gone |

Also checked the states that could plausibly be special:

- **Rift mid-`tell`** (its 90-tick telegraph, the state where it teleports on
  `e.x = e.px = e.tx`): still cut, and the cube passes through the warp mark
  cleanly.
- **Enemy on its spawn tick** (`age` 0–1, `mode: 'idle'`, the first frame after
  `combat.add`): rift, well and crown all cut normally. There is no spawn
  invulnerability window to find.

### The actual cause: the blade was live and invisible for 7 ticks

`s.blade` is `16 + 15 · (speed / MAX_SPEED)` on a launch — **16 to 31 ticks**.
A cut extends it: `s.blade = Math.min(38, s.blade + 7)`. But the renderer used
`fade('blade', time - swingStart)` against `ANIM.blade.life = 31`. So on a
multi-kill dash the hitbox ran to **38** while the animation died at **31**.

Measured on a real dash: **7 ticks** where `s.blade > 0` (6.7 down to 4.7) and
nothing was drawn at all. During those ticks the blade still cuts. That is the
"orange star passed through me and nothing happened" frame — it either did not
cut because the cube had already left the shape, or it cut and the player never
saw a blade to explain it.

Fixed in `c4306a0`: `ANIM.blade.life` is now 38 (the same number the hitbox
reads), the visual is driven by `s.blade` itself via `art.bladeAlpha()` instead
of by frame age, and the last four ticks strobe so expiry is telegraphed.

### The pink bullseye — **there is no spawn ring to swap**

I could not find a spawn telegraph ring anywhere in the codebase. `combat.add()`
creates the body and puts it in the world in the same call; there is no
pending-spawn state, no `birth` timer, and no ring drawn at a spawn point. The
pink concentric circles in the recording are most likely one of:

- the **aim reticle** (`renderer.js:149–150`), which draws four bracket arcs at
  `hit.r + 10/scale` on the *predicted target* — and given check 1, that target
  is often not where the cube will actually arrive. A reticle promising a hit
  that the drag curve will not deliver is exactly "a fake target that baits
  dashes";
- `renderer.js:1590`, the `ring` hazard (a Pulse shockwave), drawn `#b93863` +
  `#ffb7c8` — already a hazard, already spending to nothing.

**Recommendation:** do not swap a ring that does not exist. Fix check 1 first;
if the bullseye is the aim reticle, making the arc honest removes the bait by
itself. If a dashed warning style is still wanted after that, apply it to the
Pulse ring so the player can tell "this will hurt you" from "this is where your
shot lands".

---

## 3. Floor afterimages, and the minimap Crown icon

### Afterimages — **not `fea64f0`-only, and they cannot come from rail substeps**

Two separate answers, because the question has two halves.

**(a) Do ghosts linger from rail substeps?** No, and the reason is not speed —
it is phase. `ghostsFor()` returns `[]` unless `dash.ghost > 0.02`, and
`dash.ghost` is set from the **dash state machine**, not from velocity:
`ghost: 0` during the wind-up (`animation.js:650`) and `ghost: 1` only while
`slashAge < DASH.windup + DASH.active` (`animation.js:672`). A rail substep is
not a dash, so it produces no ghosts at any speed. A cube parked on the floor
produces **zero** afterimages.

(Note: an earlier round recorded the gate as "55 % of `MAX_SPEED`". That is
wrong and is corrected here — the real gate is the dash phase, and a slow dash
still ghosts.)

**(b) Were the afterimages `fea64f0`-only?** They are not tied to that commit,
but they were real and they were being drawn in a way that *looks* like a
linger: before `179b818` the contact channel never cleared, so `world.contact`
reported `surface: 'rail'` on **289 of 300** parked ticks. Any effect keyed on
"am I touching a rail" therefore ran continuously while the cube sat still,
which is precisely a lingering trail on the floor. That is fixed: a resting cube
now reports **0** contact events over 300 ticks, an arrival reports **1**.

So: afterimages during a dash are expected and phase-driven, but a trail that
persists while the cube is *stationary* was the sticky-contact bug, and it is
gone.

### Minimap Crown icon — **MISREAD, but there is a 3.8 px truth underneath it**

The suspicion was that the Crown is drawn through the minimap's arena scale
matrix (67 px radius × a small scale ≈ 3 px) and therefore clips the frame. That
is **not** what happens. The hostile pass is drawn in **device space** after
`toMap()` has already converted the position:

```js
for (const e of combat.enemies.values()) {
  const q = toMap(e.x, e.y);
  ...
  c.arc(q.x, q.y, crown ? 2.8 : 1.6, 0, TAU);
}
```

A Crown icon is a **fixed 2.8 px radius** at every zoom, on every screen. It does
not inherit the 0.045 matrix the cube once vanished through — that bug was in a
different call path and is already fixed.

There is also an explicit edge cull (`q.x < wx0 - 1 || q.x > wx1 + 1`),
so an icon is skipped when its centre is more than 1 px outside the plotted
arena. Measured on a 900 px canvas (box 226, plot 212, inset 7):

| quantity | value |
| :------- | ----: |
| wall line from panel edge | 7 px |
| worst-case icon centre (cull allows 1 px out) | wall + 1 px |
| icon extent with `r = 2.8` | wall + **3.8 px** |
| does it leave the panel? | **no** — 3.2 px of margin left |

So the icon can **cross the drawn wall line by 3.8 px** (its centre is allowed
1 px outside, plus a 2.8 px radius), but it can never reach the panel border and
be clipped by the frame. What a player would see near a wall is a dot straddling
the wall stroke, not an icon cut off by the minimap edge. That is a cosmetic
nit — one line, clamping `q` to the inset box before drawing — not the reported
clipping.

**Recommendation:** treat this as **not worth a change** as reported. If the
HULL HIT / BASTION clipping in the recording is real, it is somewhere other than
the minimap and needs a fresh frame reference to find. The report above is what
the code does; the recording may be showing the world-space Crown near the arena
edge with the camera at its limit, which is a different (and plausible) clip.

---

## Summary

| # | Claim | Verdict |
| :- | :---- | :------ |
| 1 | Preview ≠ fired vector | **MISREAD** — they share `magnetize()` |
| 1 | Arc does not match the real trajectory | **REAL** — no drag term; 69 px error by tick 40, drawn to 190 ticks |
| 2 | Star passed through because `s.blade` expired | **REAL** — blade live 38 ticks, drawn 31 |
| 2 | Star in a non-slashable spawn/pulse state | **MISREAD** — all 8 species cut in every state tested |
| 2 | Pink bullseye spawn ring baits dashes | **CAN'T VERIFY** — no spawn ring exists; likely the aim reticle |
| 3 | Floor afterimages from rail substeps | **MISREAD** — ghosts are gated on dash phase (`dash.ghost`), not on rails or speed |
| 3 | Ghosts lingering pre-`179b818` | **REAL (fixed)** — sticky contact ran 289/300 ticks |
| 3 | Minimap Crown icon clips the frame | **MISREAD** — drawn in device space at a fixed 2.8 px, with an edge cull; can cross the wall stroke by 3.8 px but cannot leave the panel |
