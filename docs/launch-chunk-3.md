# CHUNK 3 — FLOW: the landlord's rhythm, a longer OVERDRIVE, and a goal you can lose

**Status:** built, 844/844 headless tests, `npm run build` verified (975.94 kB / 364.53 kB gzip).
**No browser QA.** Chromium is not runnable in this sandbox, so nothing here claims
to have been *seen* in a browser. Every claim below is either a headless assertion,
a rendered Skia frame, or explicitly marked as unverified.

---

## 1. What this chunk did NOT build, and why that is the finding

The launch doc's Modules 3–5 list fifteen items. Six of them already ship in this
repository, and building them again would have been churn on working systems.
This was checked in the code, not assumed:

| Doc item | Reality in this repo | Verdict |
|---|---|---|
| Bisected cut halves, per-kind variants | `bisect`/`cutHalf`/shard spawn in the art engine | **already there** |
| Paint/plate decals that persist | `imprints`, capped by `MOTION.maxImprints` | **already there** |
| +1 cut on kill | `s.edge = min(edgeMax, s.edge + 1)` on every kill | **already there** |
| Squash/stretch with interpolation | `stretchFor`/`squashed`/`landFor` | **already there** |
| Camera look-ahead | `CAMERA.lead`, pinned by `test/motion.test.js` | **already there — left alone** |
| 85% wave auto-clear | measured below | **dropped on evidence** |

The doc's own numbers also disagreed with the build in one place: it asks for the
landlord "every 3rd–4th wave", but the shipped boss needed a **torn arena** to
appear at all, so the cadence was not a cadence.

## 2. The 85% auto-clear was measured, then dropped

The rationale for it is a straggler that soft-locks a wave. That state did not
reproduce. A trivial bot (launch at the nearest body whenever a cut was available,
no aiming, no dodging) cleared **all 12 bodies of sector 1 in 12–17 launches, zero
HP lost**, on three seeds, leaving the field empty.

So the item would not fix a stall; it would change what "clear" means — a body
alive on your screen vanishing without being cut. That is a worse bug than the one
it claims to fix. **Not built.** If a real playtest shows a stuck field, the honest
fix is a hunt cue (the field telling you where the last thing is), not a silent
sweep, and `src/flow.js` is where that would go.

## 3. What WAS missing, and is now built

### 3a. The Landlord has a cadence of its own — `src/flow.js`

**The complaint:** the boss was gated on `arenaMode === 'SHATTERED'`, i.e. on a
*different system's* progress bar. A player who never filled the fracture to 100%
never met the landlord — the fight the whole game is built around could be missed
entirely in a short session, and there was no countdown, no promise, no rhythm.

**The fix:** `landlordDue(n)` raises it on sectors **4, 8, 12 …**, independent of
fracture. A torn arena still brings it early — that is the one thing a tear is for.

Sector 4, not 3, is deliberate: sectors 1–3 are the authored story ladder (a cut,
then fear, then the conduit/rage chapter), and the first sector with nothing
scripted over it is where a boss belongs. The doc's "3rd–4th" allows it. The
existing `test/continuous-sectors.test.js` sector-3 walk agrees, unchanged.

`nextLandlord()` exists so the HUD can promise the fight in advance rather than
surprising the player.

### 3b. OVERDRIVE is 5 seconds, not 2.9

`OVERDRIVE = { ticks: 300, seconds: 5 }`, up from 175. **One number, one file:**
it used to be the literal `175` in `run.js` *and* again in `main.js` as the fill
divisor. The HUD now divides by the same constant, so the bar cannot draw past its
own track after the change.

This is the only change in the chunk that makes the player stronger, so it is named
in `flow.js` rather than buried, and the grant is what is tested (a real kill on a
chain boundary), not the field assignment.

### 3c. One live bonus goal per sector — the actual new system

There was **no objective system at all**: `challenge` events only gated cosmetic
unlocks, and the three anchor locks were a fixed chore, identical every sector,
with no way to fail them.

Now every sector carries one goal, chosen from five, shown live in the HUD, and
paid at the clear boundary beside the existing flawless/crown-pace payments:

| Goal | Directive | Judged on |
|---|---|---|
| `firstblood` | `CUT IN 8s` | first kill of the sector, timed |
| `pace` | `HOLD RUSH ONCE` | pace held at least once |
| `banks` | `2 CLEAN BANKS` | clean banks this sector |
| `overdrive` | `REACH OVERDRIVE` | Overdrive reached this run |
| `gold` | `BREAK A CROWN` | crown kills this sector |

Pays **+2 credits and +2 fracture** — the two currencies the game already has.
Never health: health is what the run is about.

Two properties are enforced by construction, not hoped for, because both failed
in the first implementation and the measurements are in the code comments:

1. **No repeat in adjacent sectors.** A plain `hash(seed, n) % 5` repeated the
   previous sector's goal in 5 of every 11 transitions and dealt one run the same
   goal on sectors 1, 3 and 5 — a deck of four goals behaving like two. The index
   is now walked with a derangement step; measured over 400 seeds × 25 sectors,
   **0 repeats in 9600 transitions**, deals within 1.5% of even.
2. **No impossible ask.** `gold` is only dealt when the field actually holds a
   Crown (0 violations over 200 seeds × 30 sectors). A goal you cannot complete
   is worse than no goal.

Sector 1 is authored — always `firstblood` — because a random deck would hand a
first-time player "reach Overdrive" before they have made a single cut.

## 4. Where it lives

| File | Role |
|---|---|
| `src/flow.js` (**new, pure**) | cadence, Overdrive length, goal deck, judging, payout |
| `src/continuous-sectors.js` | per-sector baselines, `goalReadout()`, `settleGoal()` at the clear, landlord gate |
| `src/run.js` | `overdriveBest`, grant through `OVERDRIVE.ticks`, `run.waveGoal()` accessor |
| `src/wave-ui.js` | the `BONUS` chip, appended **after** the receipt rebuild |
| `src/style.css` | the chip, in the colour law's reward gold → safe green when met |
| `src/quest-ui.js`, `src/main.js` | payout toast + the audio beat |
| `test/chunk3-flow.test.js` | 23 tests |

## 5. The bug worth writing down

The wave HUD is a `replaceChildren` target: any time the wave line changes (i.e.
any time a body leaves the field) every child is wiped. A goal chip appended
earlier in the frame is erased on **exactly the frames the player is winning**.

The chip is therefore appended after the rebuild, and
`test/chunk3-flow.test.js` pins the ordering by killing a body and re-reading the
HUD. That test was confirmed to **fail** when the block is moved before the
rebuild — it is a test that can fail, not decoration. The first version of the fix
carried a redundant "re-append just in case" line; it was dead code (deleting it
changed nothing), so it is gone and the comment says why.

## 6. Unverified / open

- **No browser frame.** The chip's CSS is asserted structurally (present, bearing
  the directive, `data-met` flipping) against the real `index.html` in happy-dom —
  never seen rendered. Its spacing next to `cycle-progress` in the real HUD is
  therefore unconfirmed.
- **The landlord's real difficulty at sector 4** is untested by a human. The
  existing Monolith tests pass unchanged, but nobody has fought it on the new
  schedule.
- `wave-ui.js` remains one long-lived file of inline one-liners; this chunk added
  to it in the existing style rather than reformatting it.
- `scripts/.bot.mjs` and `scripts/.measure.mjs` (throwaway probes) are deleted.
