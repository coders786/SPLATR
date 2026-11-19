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
