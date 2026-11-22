# SPLATR — Mastery Design

> **The definition we're building to (yours):**
> Mastery is *knowledge and effective utilisation of the core mechanics* — enough to
> trivially defeat the core motive with little hazard and in little time. The reward is
> **dopamine and pro-player aesthetics.**

That is not a badge collection. It is a capability difference: the player who understands
the mechanics plays a game where **hazard and time stop applying**. The name is how you see
it, not the substance.

---

## 1. What the measurements say

Everything below was measured on the real sim, 6 seeds × 1800–2200 ticks.

| Finding | Number | Consequence |
|---|---|---|
| `maxChain` == `kills` | 112 / 112, **0 breaks in 2200 ticks** | The chain never expires. ×8 multiplier is a permanent constant — it measures *session length*, not chaining. |
| Hull is never lost | `hpLost 0` for both competent play **and idling** | "Bypass hazard" is currently free. There is no hazard to demonstrate mastery over. |
| Throughcut is unreachable | **0.17 per run** | The most mastery-shaped mechanic in the codebase (`primaries === 2`) almost never fires. |
| Conversion separates skill | **1770% vs 100%** | This is the real axis. A master turns one contact into ~18 kills; a novice gets exactly one. |

**The chain bug is the headline.** A window of 144 ticks against a median kill gap of 19
ticks means the chain window can never expire. `maxChain` was never measuring chaining —
it was measuring *how long you survived*, which `kills` already measures.

---

## 2. The mastery thesis

**Mastery = conversion of contact under tempo.**

- **Conversion** — one launch becomes many kills (chain → throughcut → shear → bank rally).
- **Tempo** — kills per second.
- **Safety** — hull preserved *while* converting.

A master converts one launch into a screen-clearing cascade in two seconds and is never
touched. A novice converts one launch into one kill and takes damage. Same mechanics,
different game. That is the entire ladder.

**The progression rule that follows:** chaos rises with every rung; hazard stays flat.
That satisfies "chaos must exceed hazard" and produces the pro-aesthetic feel — the screen
gets *louder and safer* as you get better, which is what skill looks like from the inside.

---

## 3. The three fixes that make the ladder real

Without these the ladder is cosmetic — you'd be grading numbers that don't carry information.

### 3.1 Escalating chain window ✅ *measured, ready*

```
s.chainTime = Math.max(24, 96 - s.chain * 6);
```

First link is generous (96 ticks) so learning is forgiving. Each further link shortens the
leash, so holding a long chain demands genuine tempo rather than merely staying alive.

**Measured result:**

| | before | after |
|---|---|---|
| `maxChain` vs `kills` | 112 / 112 (identical) | 30 vs ~85 (**separated**) |
| chain breaks per run | 0 | **1–6** |
| kills/dash | 0.59 | 0.72 |

The floor never binds — the curve bottoms out at ~28 links naturally, so **the chain's own
length is its ceiling**. No artificial cap needed.

### 3.2 Throughcut reachability ✅ *measured, ready*

Count every contact in the stroke, not just direct primaries:

```
if (!fromShear) stroke.primaries++;
```

**Measured:** 0.17 → **2.33 per run**. Reachable by a skilled player most runs, still
requires a deliberate line. Two shapes lined up is a plan, not an accident.

### 3.3 The safety metric ✅ *resolved*

Clearance **does not** work — assist play has *negative* clearance (it collides constantly
and cuts everything). The metric that separates skill is **conversion**: contact that
becomes a kill rather than damage. Already in the game; nothing was reading it.

---

## 4. The form system

### 4.1 Every run gets a form; strength varies

Four axes, all already tracked in `run.state`:

| Axis | Source | What it says |
|---|---|---|
| **Weave** | `throughcuts` | you cut lines through the field |
| **Bank** | `banks` | you use the table as a weapon |
| **Tempo** | `kills / elapsed` | you never stop |
| **Yield** | `kills / shots` | every launch pays |

The dominant normalised axis becomes the **form**. Its magnitude becomes the **grade**.

### 4.2 Five forms

| Form | Signature | Reads as |
|---|---|---|
| **WEAVER** | throughcut-dominant | precision, threading |
| **BANKER** | bank-dominant | geometry, the table is yours |
| **REDLINE** | tempo-dominant | aggression, velocity |
| **BUTCHER** | yield-dominant | certainty, efficiency |
| **GHOST** | high yield + hull intact | untouchable |

**Grade I / II / III** on magnitude. Everybody gets a form; a weak Weaver is still a Weaver.
That is the "tiered" decision — never nothing, never inflated.

### 4.3 Death still earns a form

A short violent run can still be a **REDLINE I**. Death does not erase identity. Only a run
that crossed *no* threshold reads **UNFORMED**.

---

## 5. Where it surfaces — both

### 5.1 Live (builds during play)

The HUD already has the chain meter and multiplier. Add one line beneath it that *names what
is forming, without naming it fully*:

```
  ×6   ▓▓▓▓▓░░░   WEAVING
```

It appears once an axis passes ~60% of its grade-I threshold, and it can **change** — if you
start banking, the readout shifts. That instability is the point: the run's identity is
contested until the end.

Deliberately quiet. No new panel, no popup, no sound. The mastery readout sits where the
player is already looking for the multiplier.

### 5.2 Debrief (confirmed)

The debrief already draws the **contact print** (`print.js`) of the player's best stroke —
the single most identity-rich artifact in the game — and then throws it away. That print
*is* the form's proof.

```
        ┌─────────────────────────┐
        │   [ contact print ]     │
        │                         │
        └─────────────────────────┘
             W E A V E R  ·  I I

  3 throughcuts · 12 link chain · 0.71 kills per dash
```

The print becomes the run's **trophy**, generated from real geometry, never the same twice.
This is the pro-aesthetic: the artifact is a trace of what you actually did, not a badge.

### 5.3 What does NOT change

Per your "feedback, not power" decision:

- **No new unlocks.** Rungs gate nothing.
- **No difficulty reduction** for lower rungs.
- **No permanent buffs.** Fresh run = fresh game.
- The small capability moments that *already exist* (bank refunds an edge, throughcut buys a
  beat) stay exactly as they are — but the game now **tells you they happened**.

---

## 6. Build order

| # | Step | Risk | Verifiable |
|---|---|---|---|
| 1 | Chain escalation | low — measured | `maxChain` separates from `kills` |
| 2 | Throughcut loosening | low — measured | 2.33/run |
| 3 | `src/form.js` — read the run, return form + grade | low | unit-testable, pure |
| 4 | Live HUD readout | medium — must stay quiet | visual |
| 5 | Debrief stamp + print framing | medium | visual |
| 6 | Tests + build + preview | — | 102/102 |

Steps 1–3 are the substance. 4–5 are presentation and can be tuned after you see them.

---

## 7. The one thing I am least sure about

**Forms may not separate in practice.** If the assist converts so reliably that *every* run
is a BUTCHER, the form system collapses into one name and we've built a badge with five
skins.

The mitigation is to normalise against the run's own opportunity: a run that spawned mostly
plates should be compared against how many plates were *available to be woven*, not against
an absolute throughcut count. That's a distribution-aware threshold rather than a constant —
more correct, more work.

I'd like to build steps 1–3 with constant thresholds first and **measure whether the forms
actually separate across 20 seeds** before committing to the distribution-aware version.
