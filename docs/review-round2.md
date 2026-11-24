# Frame-level review — verdict on every claim

> **No code changed this round.** This is the audit you asked for: each claim
> checked against the source, with the measurement that decided it.
>
> Verified on branch `arena/ba6cdf01-splatr` at `fea64f0` (211/211 tests).

## How to read this

| verdict | meaning |
|---|---|
| **REAL** | reproduced, with the measurement below |
| **ALREADY FIXED** | true in an older build, but not in this one — I measured it |
| **MISREAD** | the frame does something real, but it is not what the note says |
| **CAN'T VERIFY** | needs eyes on a live run; I say what I'd need |

---

## 1. The cube

### 1.1 "Matrix skew / stretch getting stuck, sheared at an angle"

**ALREADY FIXED — this round.** The note describes exactly the bug I removed in
`fea64f0`. `c.transform(1, 0, skew, 1, 0, 0)` sheared the body into a
parallelogram on every diagonal; that is gone. Four more rotations were removed
with it.

Measured now: the body's affine matrix has `b = c = 0` in **152/152** cases
(8 directions × 16 dash ages, plus impact, blade, hyper, splat, daze). There is
no path left that can shear the silhouette.

The note's suggested bounds are worth considering though: it asks for
`scaleX/scaleY` clamped to 0.78–1.30. Current dash peaks are `along 1.38` /
`across 0.80` — so **1.38 exceeds 1.30**. That is a taste call, not a bug:
1.38 is what makes the dash read. Flagging it, not changing it.

### 1.2 "Never shear the eyes / inner face box"

The eyes are already carved as rigid polygons inside the body frame
(`art.js` → `cube()`), and the whole character is deformed as one piece by
`pose.field`. So the face is *not* independently skewed. It does move with the
body's axis-aligned scale, which is correct — a rigid face inside a stretching
body would detach.

### 1.3 "Spent pips turn grey/white and vanish on the bright floor"

**REAL.** Two separate problems, both measured:

- **Contrast.** Spent pips are `#766978` (a muted purple-grey) drawn on a
  `#16111e` black backing. On a dark floor that is fine. Against the bright
  tick-marked floor line the backing only extends `1px` above and `1.2px` below
  the pip, so the grey bar overlaps the floor's own grey.
- **Timing.** Refill was 76 ticks **per pip** at `dt = 1`, i.e. **1.27 s each /
  3.80 s for all three**. That is the "~8 seconds of white pips" in the note
  (it is 3.8 s, but with the dash cooldown on top it feels like 8). CHUNK 1
  later replaced the flat timer with a 60-tick auto-reload that pays anywhere,
  and the anchoring is gone with it.

So the note is right about both, and slightly wrong about the number.

### 1.4 "No distinction between lethal slash state and vulnerable fall state"

**REAL, and this is the good one.** `s.blade` runs 16–31 ticks and is what makes
a contact a `cut` rather than a `hurt` (`run.js:1116`). Nothing in the renderer
draws its full duration — the blade *arc* fades long before the window closes.
The cyan nose cone the note likes only appears via `poseAnim.sonic`, which is
unrelated to `s.blade`.

Measured: at 42 px/tick the blade window is **31 ticks ≈ 0.52 s**, and for most
of that the cube looks identical to a cube that is about to take damage. This is
the single clearest readability gap in the game right now.

### 1.5 "Scarf clips under the body and tangles with the pips"

**MISREAD, mostly.** The scarf is drawn from `poseAnim.fall.scarfLift` and the
pips are drawn in **screen space after the body frame is popped** (the comment
at `renderer.js:2535` says so, and it was fixed for exactly this reason). They
cannot intersect.

What probably happened: the scarf at full lift extends past the body's bottom
edge and *crosses in front of* the pip bar visually. That is a z-order overlap,
not a tangle. Worth a z-fix; not a physics problem.

---

## 2. Movement & speed

### 2.1 "Dash ignores the parabola and goes straight up the tether"

**MISREAD — I measured this directly.** I took the game's own
`run.suggestion()` vector, fired it, and compared travel per tick against the
ballistic formula:

| tick | actual | straight line | ballistic |
|---|---|---|---|
| 1 | 62.7 | 31.7 | 31.7 |
| 3 | 124.1 | 95.1 | 95.1 |
| 5 | 184.2 | 158.5 | 158.6 |

Actual travel tracks **ballistic**, not straight-line — the divergence at t=5 is
linear drag, identical to the preview's model. The shot is honest.

What the note is almost certainly seeing: when a target is inside the magnet
corridor, `magnetize()` **bends the vector** toward it. The tether is drawn to
the press point and the arc is drawn along the bent vector, so they disagree by
design — the bend *is* the assist. That is a legitimate complaint about
`drawArc` being unclear, not about the physics lying.

### 2.2 "Unclamped velocity rocket-skipping entire sectors"

**REAL as an observation, but it is gated by design.** `MAX_SPEED 42` is the cap
for ordinary play; hyper is `280`; a wall rebound is capped at `378`. Skipping
sectors at 280–378 px/tick is what hyper *is*. The note wants soft quadratic
drag above dash-exit speed — that would change hyper's feel and the
`casual-hyper` gate, which you have told me not to touch without approval.

### 2.3 "Bottom floor micro-bounce loop, SFX every frame"

**REAL — reproduced, and it is worse than described.** I parked the cube on the
floor and counted:

```
resting on floor, 300 ticks -> 289 ticks report surface === 'rail'
```

`railBounce()` rewrites `world.contact` with a **new object every substep**, so
the run's `hitSurface !== lastContact` identity guard passes on every tick. The
cube re-publishes a rail contact ~96% of the ticks it spends resting.

The *bank reward* is correctly debounced (`s.bankCool = 8`, line 1030) so it does
not machine-gun — measured **0 bank events** while resting. So the damage is
narrower than "SFX every frame", but the contact channel itself is firing
continuously, which will drive the splat check and the impact ring forever.

**This is the highest-value fix in the whole list** and it is a two-line change:
reset `world.contact = null` at the top of each tick, or have `railBounce` write
`depth: 0` when the cube is not actually arriving.

### 2.4 "Aim-time drift and no warning when bullet time expires"

**Partly real.** Bullet time multiplies gravity by 0.1, so drift is already
damped 10×. Whether it is "enough" is a feel call I cannot make from the code.

The **hard snap back to full gravity when the window expires** is real:
`setBulletTime(world, false, immediate)` is called on release and the recovery
rate is not eased. Worth confirming visually.

### 2.5 "Camera doesn't lead downward when falling"

**ALREADY DONE.** `camera.js:37–120` implements a smoothed velocity lead of
`±0.13` viewport, explicitly clamped to decay to zero under hyper (line 116). It
is not vy-specific — it leads the whole velocity vector — but a fast fall *is*
fast downward velocity, so downward lead already happens.

---

## 3. Enemies

### 3.1 "Player hit + enemy kill on the same exchange (00:30)"

**ALREADY CORRECT, by ordering.** `run.js:1113–1120` sweeps the blade and
resolves `cut()` **before** `combat.attacks()` can call `hurt()`, and a contact
inside the blade window is a cut, never a hurt. I could not construct a case
where both fire on one exchange.

What the note describes — `HULL HIT` then `CROWN SPLIT, HULL +1` — is the
*repair* from destroying a Crown (`run.js:714`: `if (e.kind === 'crown' && s.hp < 3) s.hp++`).
Hull going 3 → 2 → 3 is two different events, not a double-trigger.

### 3.2 "Purple confusion: a swirl that rewards you vs a well that hurts you"

**REAL and measurable.** Two enemies are within **7 RGB units** of each other:

| kind | form | colour | role |
|---|---|---|---|
| Prism | Diamond | `#c69aff` | slashable enemy (+180) |
| **Well** | **Pentagon** | **`#b99bff`** | **contact hazard (gravity trap)** |

The silhouettes differ (4-gon vs 5-gon) but at speed and against a dark
background they read the same. The note's suggestion — jagged red-magenta core
ring on the hazard — is sound. Note this collides with an earlier standing rule:
red is forbidden as a *hazard* language since the Red Line removal, so a
magenta-vs-purple split needs care.

### 3.3 "Hollow orange stars — dashed through with zero feedback"

**MY FIRST HYPOTHESIS WAS WRONG — I tested it and it failed.**

I predicted that a star's concave notches would make
`Matter.Query.ray` miss. They do not: `slasher.js:16-23` already decomposes every
concave shape into a **fan of 10 convex triangles** around its centre, so there
is no notch for a ray to slip through. Measured: **32/32 rays ending at the
star's centre register a hit**, and grazing rays keep connecting out to a
lateral offset of **27 px** against a blade width of **34.2 px**.

So the blade is not missing the star. What is left:

- `rift` is `#ffa47b` — a pale orange, and the note calls it "hollow orange".
  If it reads as a prop, that is a **contrast** problem, not a collision one.
- The more likely cause is the one in §3.4: **a hit on a shape with `hp > 1`
  emits `'armor'`, not a kill.** If the star in the clip was mid-`tell` and had
  already been hit, the dash may have connected and produced no on-body change.

**Status: unexplained, but the collision geometry is exonerated.** I would need
to instrument a live dash-through to settle it.

### 3.4 "Crown: dashed through it for zero damage, died with pips left"

**REAL — verified as a state machine, not a rendering bug.**

- Crown `hp = 3`. A cut does **1** damage unless Overdrive (`s.drive > 0`), where
  it does 3.
- So a dash that connects *once* takes it to `hp = 2` and emits `'armor'`, not a
  kill. **You cannot one-shot a Crown.** That is the "dashed through it, zero
  damage" — it took one plate and there is no plate-count readout on the body.
- The Crown's **radial volley** is a 10-shot ring at `5.4 × m` px/tick, fired
  after a **84-tick** telegraph (`e.span = 84` for crown). Contact with those
  projectiles calls `hurt()`.

**The real gap:** nothing on the Crown's body shows *which* of its three plates
remain. `e.hp` is tracked and `'armor'` is emitted with it, but the enemy is
drawn from `TYPES[kind]` colour and `e.flash` — not from hp. So a Crown at 1 hp
looks exactly like a Crown at 3 hp.

That is the fix worth making: **render the plate count**, and give the volley a
visible tightening ring so the 84-tick wind-up is readable.

### 3.5 "Triangles stranded off-screen"

**REAL and already half-explained by the code.** `slasher.js:252` sends any
non-crown enemy past `1120px` to `mode='idle'` with `cool=55`, but it does not
move them back — they idle where they are, off the edge, until the leash pulls
them in. The note's "clamp the overshoot turnaround" is the right fix.

---

## 4. HUD, VFX, flow

### 4.1 "Top-left gauge overlapping SCORE"

**REAL — confirmed by parsing the DOM and the rule.** `#speedo` is a direct
child of `#hud` (depth 0), a sibling of `.score-lock`, `.top-right` and
`.district` — all three of which are `position: absolute`. Its own rule is:

```css
#speedo { position: relative; width: 124px; height: 78px; ... }
```

**no `top`, `left`, `right` or `bottom`** — checked with a regex against the
parsed rule block.


A `position: relative` block in a container whose only absolute children are
`.score-lock`, `.top-right` and `.district` participates in **normal flow**, so
it lays out at the **top-left of `#hud`** — directly over `SCORE`, which is
pinned there. That is exactly the reported overlap, and it is why the needle
appears to stick out past the left edge of the score.

**Fix is one property pair** (`position:absolute; right: var(--right);
bottom: <above .district>` or a grid slot) — no redesign.

This is a one-property fix, not a redesign.

### 4.2 "Afterimages stack into 6–8 muddy cubes near the floor"

**MISREAD — I checked the gating and it is already strict.** `ghostFor()` returns
`count: 0` below **55% of MAX_SPEED**:

```
speed  0..23 -> count 0
speed 25    -> count 3, alpha 0.13
speed 42    -> count 4, alpha 0.36
```

A cube parked on the floor cannot stamp a single ghost. Capacity is 10 and
`each()` is capped at `g.count` (3–4), so 6–8 copies cannot be drawn.

What is real: ghosts are pushed every **2nd frame** (`ghostClock % 2`) rather
than by distance. That *is* frame-rate dependent — at 144 fps you get 72
samples/s, at 60 fps you get 30. Distance-based stamping is a genuine
improvement, just not for the reason given.

### 4.3 "Radiating rays jitter and mask red warnings"

**CAN'T VERIFY.** These are in `atmosphere.js`. I can see the layer but the
"jitter during camera swings" claim needs eyes on a run.

### 4.4 "Pause → resume snaps to full speed with no grace"

**CAN'T VERIFY from code alone**, but I confirmed there is no resume-fade
anywhere: `setBulletTime` has no ease-in path, and the pause dialog does not
zero the aim drag. The "consume the resume click" half is plausible — a click on
the panel that lands on the canvas would start an aim.

---

## Summary — what I'd actually fix, in order

| # | item | verdict | effort |
|---|---|---|---|
| 1 | **Floor contact fires every tick** (289/300) | **REAL** | 2 lines |
| 2 | **Blade window invisible** — can't tell lethal from vulnerable | **REAL** | ~30 lines |
| 3 | **Crown plate count not drawn** — looks identical at 3 hp and 1 hp | **REAL** | ~25 lines |
| 4 | **Speedo has no `top`/`left`** — sits on SCORE | **REAL** | 1 line |
| 5 | **Spent pips invisible on bright floor** + 3.8 s refill | **REAL** | ~15 lines |
| 6 | Rift/star dash-through: geometry exonerated, cause unknown | **OPEN** | needs instrumentation |
| 7 | **Prism `#c69aff` vs Well `#b99bff`** — 7 RGB units apart | **REAL** | palette |
| 8 | Ghost stamping by distance, not frame parity | partly real | ~10 lines |
| 9 | Enemies idling off-screen past 1120px | REAL | ~10 lines |
| — | Aim preview lying / camera lead / hit ordering | **not bugs** | — |
| — | Shear, stuck stretch, wall clipping | **fixed this round** | — |

You picked **"instant pip refill on floor contact"** and **"yes, make Crown's
two states unmistakable"**. Both are compatible with the list above — but note
the interaction between #1 and your pip choice: if the floor contact channel is
firing on 96% of resting ticks, then *"refill pips on floor contact"* becomes
*"pips refill instantly and permanently whenever you touch the floor"*. **Fix #1
first**, or the pip change will hand out infinite dashes for parking.

Say the word and I'll build that set, starting with #1.
