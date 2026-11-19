# Mastery — Execution Plan

Companion to `docs/mastery.md` (the design). This is the build spec: exact changes,
constraints discovered in code review, verification gates, and what could go wrong.

Status: **chunks 1–3 COMPLETE and verified.** 4–6 pending.

---

## RESULTS (measured, not estimated)

| Chunk | Before | After | Gate |
|---|---|---|---|
| 1. Chain window | maxChain 112 == kills 112, 0 breaks | maxChain p50 21 (range 14–32), 1–6 breaks/run | **PASS** |
| 2. Throughcut | 0.17 per run | **1.90 per run**, 19 across 10 seeds, no seed at 0 | **PASS** |
| 3. Form separation | — | **3 forms** (WEAVER 12, TEMPO 7, BANK 5), modal **50%** | **PASS** |

Test suite: **116/116** (was 102 — 14 new tests: 13 form + 1 anti-farm invariant).

### Corrections found during execution

1. **`s.elapsed` is a TICK count, not milliseconds.** Dividing by 1000 reported a
   30-second run as 1.8s and inflated tempo ~30x, which made GHOST fire on all 20 seeds
   of the first separation trial. `readForm` now takes `elapsedTicks` and converts once.
2. **The obvious throughcut fix was wrong.** Counting every contact let two Fork children
   charge a shear, so one plate could farm the move. A test caught it. The shipped rule
   is `full >= 1 && contacts >= 2` — chips contribute to the count but can never
   satisfy it alone.
3. **Separation must be tested across POLICIES, not seeds.** The bot used `suggestion()`
   every run, so all 20 seeds played identically and all read TEMPO — a property of the
   policy, not the game. Re-tested across 4 cadences x 6 seeds.
4. **Thresholds set by rank, not feel.** The first constants sat at wildly different
   percentiles (weave near p75, bank above max), so weave could never lead and bank never
   could. They are now each the **p60** of that axis's own measured distribution.
5. **Grade lines needed widening.** With the cap at 4.0, a third of runs pinned to grade
   III and the top grade stopped meaning anything. Cap raised to 6, lines at 1.7 / 2.8.
   Grades now spread I:11 / II:3 / III:10 across the test set.

---

---

## Chunk 1 — Escalating chain window

**Measured basis:** median kill gap is 19 ticks; window was 144 = 7.5× the gap, so it never
expired. `maxChain` 112 == `kills` 112, zero resets in 2200 ticks.

### Changes

| File | Change |
|---|---|
| `src/run.js` | Replace the `CHAIN_TIME` constant with a function `chainWindow(chain)`; use it at the kill site; expose the window on state. |
| `src/run.js` | Add `s.chainMax` (ticks remaining when the window was last refreshed) so the HUD can normalise correctly. |
| `src/main.js` | `chain-meter` divides by `s.chainMax`, not by a constant. |

### Constraints from code review

1. **`CHAIN_TIME` is imported by `main.js` and used as a divisor.**
   With a varying window, `chainTime / CHAIN_TIME` reads wrong (a full bar at 96/144).
   The HUD must divide by the window that was actually granted, so state has to carry it.
2. **`CHAIN_TIME` is exported.** It stays exported (now as the *maximum* window) so the
   import doesn't break and any external reader still gets a sane number.
3. **Existing tests set `s.chainTime` directly** (`run.test.js:49`, `combat.test.js:204`)
   and assert the chain expires. Those keep passing — the *decay* is unchanged; only the
   *grant* varies. Verified by running the suite.
4. **`chainWindow` must be monotonic and bounded.** Floor 24 (measured: the curve bottoms
   out naturally at ~28 links, so the floor never binds — it exists only as a guard).

### Curve

```
chainWindow(chain) = max(24, 96 - chain * 6)
```

First link 96 ticks (generous, forgiving). Link 10 → 36. Link 12 → 24 (floor).
A 30-link chain therefore requires sustained tempo, not survival.

### Gate

- `maxChain` separates from `kills` (target: not equal, 1–6 breaks/run)
- kills/dash unchanged or better vs baseline 0.59
- `npm test` 102/102

---

## Chunk 2 — Throughcut reachability

**Measured basis:** 0.17/run because `primaries === 2` required two *direct* hits in one arc.

### Change (one line, `src/stroke.js`)

```
if (!fromShear && !e.small) stroke.primaries++;
```

was

```
if (!fromShear) stroke.primaries++;
```

i.e. stop requiring `!e.small`, so a skillfully-lined contact with a **grazed** or
split-fragment plate counts toward the release.

### Constraints from code review — this is the subtle one

1. **`small` is a Fork's two spawned children** (`slasher.js:468`). They are real shapes
   and they can be cut. Counting them is correct: a player who lines up a fork and its
   children *has* threaded a line.
2. **But `fromShear` contacts must stay excluded.** The shear wave's own kills cannot feed
   back into earning the shear, or one stroke re-earns itself forever. The existing
   `stroke.released` latch already prevents a second release on the same stroke; keeping
   `!fromShear` preserves the invariant that the wave never pays for itself.
3. **`stroke.test.js:215` asserts `primaries === 2`** in a scenario whose first two marks
   are a direct fang and a direct prism, with a fork and well killed `fromShear`. Since
   `fromShear` stays excluded, the count is unchanged → test still passes. **Must verify.**
4. **`stroke.test.js:86` asserts one direct contact is not enough.** Unchanged.
5. The release still latches once per stroke (`stroke.released`), so this raises
   *reachability*, not *frequency per stroke*.

### Gate

- throughcut/run rises from 0.17 to roughly 1.5–3.0 (measured 2.33 in the probe)
- `stroke.test.js` passes unchanged
- no rise in `primaries` where it matters (the latch still caps at one release/stroke)

---

## Chunk 3 — `src/form.js`, the form reader

A **pure module**: takes a finished (or in-progress) run state, returns the form read.
No DOM, no engine, no side effects. That makes it unit-testable and safe to run every frame.

### Inputs (all already tracked in `run.state`)

| Axis | Source field | Normalisation |
|---|---|---|
| Weave | `throughcuts` | per dash |
| Bank | `banks` | per dash |
| Tempo | `kills / elapsed` | per second |
| Yield | `kills / shots` | per launch |

### Output

```
{ form: 'weaver'|'banker'|'redline'|'butcher'|'ghost'|'unformed',
  grade: 0|1|2|3,
  axes: { weave, bank, tempo, yield },   // normalised 0..1
  lead: 'weave'|'bank'|... }             // which axis won
```

### Rules

- Every axis normalises against a **threshold table**, not a raw count, so one bank and
  one throughcut are comparable.
- `grade` from the magnitude of the leading axis: I at 0.5, II at 1.0, III at 2.0.
- **GHOST** is a special case: requires high yield *and* hull intact *and* ≥1 grade —
  it is the "untouchable" read and must be earned, not defaulted to.
- If no axis clears 0.5 → `unformed`, grade 0.
- Death does not zero the read (your "a form anyway" decision): the axes are computed from
  what happened, not from whether the run ended.

### Constraints

1. **Must not divide by zero** on a 1-tick or 1-shot run.
2. **Must be cheap** — it may be called per frame for the live HUD.
3. **Thresholds are constants in this chunk** (per the plan's own honesty section); they
   get replaced with distribution-aware values only if measurement shows they don't separate.
4. **No import cycle**: `form.js` must not import `run.js`.

### Gate

- Unit tests: thresholds, grades, GHOST gating, zero-division, unformed case.
- **Separation across 20 seeds**: at least 3 distinct forms occur, and the modal form is
  under ~70% of runs. If this fails, the honest response is to report it, not to fudge
  thresholds until it looks good.

---

## Chunks 4–6 (presentation, after the substance is verified)

4. Live HUD readout — `×6 ▓▓▓▓▓░░░ WEAVING`, can change mid-run, deliberately quiet.
5. Debrief stamp + contact-print framing as the run's trophy.
6. Full suite, build, preview restart, commit.

---

## Verification protocol

Every chunk runs the same gate before moving on:

```
npm test                     # 102/102, no regressions
node /tmp/mastery.mjs        # the 10-seed distribution table
node /tmp/band.mjs           # assist vs random vs idle separation
```

Plus a chunk-specific probe. Nothing is committed until all three agree.

## Known risks

1. **Forms may not separate** — the primary risk, stated in the design doc. Measured in
   chunk 3's gate; reported honestly either way.
2. **Chain steepness** — if 96 → 24 is too steep for real play, `maxChain` collapses to
   a handful and the ladder's tempo axis gets noisy. Fix is to raise the floor, not to
   flatten the curve.
3. **Throughcut overshoot** — if loosening pushes it to 5+/run it stops feeling earned.
   Target band is 1.5–3.0; above 4, revert to requiring at least one direct primary.
