# HYPER — derived specification

> **Vision:** walls at ~78,000px. Land 7 consecutive kills → the cube is given enough speed
> to reach the wall quickly. If you are *already near the wall* when you earn it, the bounce
> compounds into a much bigger sonic boom. Slashing stays ON through all of it, and the whole
> state decays naturally through friction, gravity and physics — you are not on a timer.

Every number below is **derived from the sim**, not chosen. The derivation is shown so it can
be re-run when anything changes.

---

## 0. A blocking bug found while deriving this

`snapshot()` in `physics.js` called `capVelocity(body)` **with no ceiling argument**, on every
tick, *before* the substep count was computed. `world.playerCeiling` was honoured inside the
substep loop and then silently undone at the top of the next tick.

**Consequence:** every speed increase attempted all session was erased. Measured peak speed
never once exceeded **42.1** against a stated ceiling of 88. Attempts to "reach the wall"
all produced exactly 2,345px of climb regardless of launch speed — because 42 was the only
speed the cube was ever allowed to have.

Fixed by threading the ceiling through `snapshot()`. After the fix:

| ceiling | climb reached | substeps |
|---|---|---|
| 42 | 2,345 px | 9 |
| 120 | 19,191 px | 25 |
| 200 | 53,323 px | 41 |
| 280 | 104,522 px | 57 |

Nothing else in this document works until that line is correct. It is the foundation.

---

## 1. The wall distance → required speed

Solved by bisection against the real integrator, not by a formula:

| speed | climb | reaches 78,000? |
|---|---|---|
| 180 | 43,190 | no |
| 210 | 58,790 | no |
| 240 | 76,789 | no |
| **242** | **78,000** | **exactly** |
| 260 | 90,122 | yes |
| 280 | 104,522 | yes |

**HYPER_SPEED = 280.** 242 is the bare minimum and touching it would mean the wall is reached
only from a perfect vertical launch with no interception. 280 gives **~34,000px of margin**
(44%), which is what makes the wall reachable *while slashing things on the way up* — each
kill and each bank costs a little energy, and the margin absorbs it.

**Wall at y = −78,000**, matching the brief's 78km.

---

## 2. The decay curve (why no timer is needed)

From 250 with no input, gravity alone:

| speed | time | state |
|---|---|---|
| 250 | 0.0 s | HYPER |
| 200 | 2.2 s | HYPER |
| 100 | 6.7 s | falling out |
| 42 | **9.2 s** | normal |

**Hyper lasts ~9.2 seconds** and needs no clock: it is a consequence of physics. This is
exactly what the brief asked for — "until you slow down from friction and gravity and other
physics forces." Slashing accelerates the decay (each cut converts forward speed), so the
player who slashes hardest is also the one who burns hyper fastest. That is a real tension
and it is free.

---

## 3. Entry — 7 consecutive, 14 dashes

Measured: with the current escalating window, a 7-chain lands on **dash 10–17** across 8 seeds
(median 11). A budget of **10 would fire on zero runs**.

**Budget = 14 dashes.** Derivation: median is 11, worst observed is 17. 14 sits between them —
it clears the median case comfortably while still requiring a genuinely fast opening. The
player feels "I nailed seven of them before I could breathe", which is the sensation the brief
describes; the specific number 10 was an implementation detail that the data says is
impossible.

`HYPER_ENTRY = { chain: 7, dashes: 14 }`.

**Why it must be gateable at all:** with a 14-dash budget a slow, careful player who chains 7
over 30 dashes does *not* get hyper. The gate is the difference between "I survived" and "I
performed".

---

## 4. What HYPER does

| | normal | HYPER |
|---|---|---|
| speed ceiling | 42 | **280** |
| blade | launch-scoped timer | **always on, never expires** |
| contact | cut if bladed, else damage | **always a cut** |
| on bounce | boost ×1.14, capped 2.1× | **compounds — see §5** |
| exit | — | speed decays below 42 (§2) |

The permanently-on blade is what produces "continuously slashing mode": with `s.blade > 0` the
contact loop calls `cut()` instead of `hurt()`, so every shape touched becomes chaos. No new
collision code is needed — the existing rule already does this correctly. Hyper only has to
keep the blade from expiring.

---

## 5. The bounce — and the near-wall bonus

This is the part the brief is most specific about: *"if the user is already near the wall
reaching this speed, bouncing off the wall gives you a more sonic boom speed."*

**The rule:** the bounce's energy gain scales with **how fast you were going when you hit**,
not with a constant. A wall hit at hyper speed returns more than it took.

```
gain = 1 + (speedAtImpact / HYPER_SPEED) * NEAR_WALL_BONUS      // NEAR_WALL_BONUS = 0.6
```

- Hit the wall at 42 (normal speed): gain ≈ 1.0 — a normal billiard bounce.
- Hit at 280 (full hyper): gain ≈ **1.6** — the wall throws you back harder than you arrived.
- Because you were *already fast on arrival*, the rebound is what the brief calls "a more
  sonic boom speed".

**This makes the near-wall case fall out of the physics rather than needing a special case.**
A player who earns hyper close to the wall arrives fast; one who earns it far away spends the
margin getting there. Same rule, different outcome, no branching.

Cap the rebound at `HYPER_SPEED * 1.35` so a chain of bounces compounds into spectacle rather
than into a number the integrator cannot survive.

---

## 6. Wall visibility

The brief says **semi-visible**. Today the arena is drawn **only on the minimap** — in the
world there is nothing to see. Required:

- A **ghost rail** at the boundary, drawn in screen space at the edge of vision.
- **Opacity scales with proximity**: invisible far away, solid enough to aim at inside ~2,500px.
- **Flares on contact**, tied to the existing sonic-boom effect.
- Must never be drawn as a hard line at distance — "semi-visible" is a reveal, and a wall you
  can always see is not a wall, it is scenery.

---

## 7. Performance — measured, and a non-issue

I flagged this as the top risk in the first draft. It is not.

| speed | substeps | physics cost |
|---|---|---|
| 42 | 9 | 0.095 ms (1% of frame) |
| 200 | 41 | 0.031 ms (0%) |
| 250 | 51 | 0.033 ms (0%) |
| full tick, 26 enemies | 7 | 0.256 ms (**2% of frame**) |

Even 51 substeps costs a fraction of a millisecond. **No substep capping is needed**, and the
`MAX_TRAVEL` mitigation from the first draft is dropped — it would have added tunnelling risk
to solve a problem that does not exist.

---

## 8. Build order

| # | Chunk | Verifiable |
|---|---|---|
| 0 | **`snapshot()` ceiling fix** — already done, needs a regression test | peak speed > 42 with a raised ceiling |
| 1 | Wall at −78,000 + ghost rail rendering | visible, brightens on approach |
| 2 | Hyper entry gate (7 / 14) | fires on real seeds, not just synthetic ones |
| 3 | Hyper state: ceiling 280, blade held on | kills/sec during hyper vs normal |
| 4 | Compounding bounce + near-wall bonus | rebound speed > arrival speed |
| 5 | Full verification + build + preview | 118/118+, no frame drops |

---

## 9. Open questions

1. **Does the wall damage you if you arrive without hyper?** Falling to a wall at normal speed
   and bouncing normally seems right, but it changes the Redline's role.
2. **Should the ghost rail exist on the sides too, or only the top?** Sides are 1,900–2,300px
   and currently reachable; making them semi-visible changes ordinary play.
3. **The bottom.** At 16,000px the floor is now inside reachable hyper range — a hyper shot
   *downward* would hit it. Is that intended, or should the floor be pushed below 78,000?

---

## Decisions (settled) and what shipped

The open questions in this document were answered: walls at **78,000**, a
**14**-dash budget (`HYPER.dashes`), and hyper ends through **friction and
gravity** rather than a timer. The bottom wall replaced the Redline; no wall
damages the player; no ghost rails are drawn. The implementation, its four
measured bugs and the full verification table are in `docs/hyper-build.md` §8.

The one thing in this document that was **wrong** is worth flagging here because
it was load-bearing: §5's effect-curve design (`t = speed / ceiling`) does not
work. Normalising by the ceiling rescales the normal range and makes 42 and 280
render identically. The shipped curve adds a hyper term above the limit instead,
leaving ordinary flight byte-identical. Numbers in `docs/hyper-build.md` §8.6.
