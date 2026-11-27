# CHUNK 4 — THE POST: a run that grows without asking you to stop

**Status:** built, 860/860 headless tests, `npm run build` verified (979.44 kB / 365.16 kB gzip).
**No browser QA.** Chromium is not runnable in this sandbox. Every claim below is a
headless assertion against the real run, or is marked unverified.

---

## 1. The finding

The game ships with **40 upgrade cards**, a three-card deal, and a TACTICAL FIT
recommender. **None of it was reachable.** The shipped configuration was
`continuous: true, catalogRewards: false`, and the continuous director returns
before it ever opens the deck.

Measured on a real run before touching anything — two sectors cleared, the full
30-tick rest beat each:

```
after sector 1: phase=combat offers=0 upgrades=0
after sector 2: phase=combat offers=0 upgrades=0
waveRest fired: 0 | upgradeChosen: 0
```

Credits still reached the cosmetic shop, so they were not dead — but the in-run
reward layer was: a full run only ever grew by score, fracture and health.

The chooser was removed from continuous play **deliberately** (recorded in
`waves.js:229`, *"continuous mode stays chooser-free by user decision"*). So the
fix is not to put it back. Per the decision taken for this chunk: **the post** —
one auto-picked card per clear, no UI, no pause, chosen by fit.

## 2. What was built

### 2a. The post — `src/post.js` (new, pure)

Clearing a sector mails one run-length card. `recommendWaveOffer` — which already
existed and was already written to score a hand against the sector you just
fought and the one that is next — picks it. That is the point: the interesting
decision is made **from your own play**, not from a menu.

The card arrives with its reason ("Cross the field faster; your aim direction
stays yours"), because an unexplained grant is indistinguishable from a bug and a
player who cannot see why they got CLEAVER will not change how they play.

The receipt prints in the HUD for 8 seconds, then retires — it lands on the
busiest frame in the game (a clear), and a receipt that outlives its beat is
clutter.

### 2b. `postRewards` is a separate flag from `catalogRewards`

This is the bug the runtime check caught, and it is worth recording because the
obvious implementation was wrong. Enabling `catalogRewards` does **not** just
"enable the catalogue": it also enables `openCatalogRest`, the **chooser**. The
first attempt flipped it, and the run immediately parked:

```
after sector 1: phase=choose offers=3 upgrades=0   ← no picker on screen
waveClear emitted: 1                                ← the run had stopped
```

The field stopped at every clear with nothing to click. The two concerns are now
separate flags:

| flag | means | shipped |
|---|---|---|
| `catalogRewards` | *ask the player* — the rest chooser | **off** (unchanged, by the earlier decision) |
| `postRewards` | *give it to them* — the auto-grant | **on** |

The run now plays through: three sectors, three cards, no pause.

### 2c. Three lessons were uncompletable in the shipped mode

`continuous-sectors.js` published fewer events than `waves.js`, and three lesson
rows listened for the wave-mode ones. Verified by logging every event a real
shipped run emits: `waveClear` NO, `waveRest` NO, `paceHeld` NO.

| lesson | was | now |
|---|---|---|
| `USE THE REST` | needed `waveRest` — **uncompletable** (the chooser no longer exists) | replaced with `BREAK THE SEAL` — "Cut all three anchors, then launch up through the open seam." |
| `CLEAR A WAVE` | needed `waveClear` — never emitted | the seal break and the Monolith's fall now emit it |
| `HOLD YOUR PACE` | needed `paceHeld` — never emitted | emitted once per sector, on the first hold |
| `CLEAN BANK` | `cleanBank` only came from the wave-mode physics path | the director watches the bank total and emits once per bank |

All nine tutorials are now reachable in the shipped mode.

### 2d. The recommender was scoring blind

`recommendWaveOffer(..., {previous: wave.report})` — and `wave.report` was never
built in continuous mode, so every card was ranked with no history. The director
now builds a per-sector report on clear, same shape as the wave-mode one, so one
recommender serves both modes.

## 3. Where it lives

| File | Role |
|---|---|
| `src/post.js` (**new, pure**) | due rule, fit pick, receipt line, expiry |
| `src/continuous-sectors.js` | `admitPost()`, `wave.report`, the three missing events |
| `src/run.js` | `postRewards` option, ownership gate accepts either path, `upgradesChanged` |
| `src/main.js` | `catalogRewards:false, postRewards:true` |
| `src/wave-ui.js`, `src/style.css` | the post receipt |
| `src/quests.js` | the replaced lesson |
| `test/chunk4-post.test.js` | 16 tests |
| `test/learning-quests.test.js` | 2 tests re-pointed (intent kept, targets updated) |

## 4. Two things I got wrong first, and fixed

- **The receipt never expired.** The comment claimed it cleared itself; the code
  set `hidden=false` and never turned it off, so the last card sat in the HUD for
  the rest of the run. Now `postVisible(post, elapsed)` with `POST.showTicks=480`.
  The test fails if the expiry is removed (verified).
- **A refused grant burned the sector's post.** `wave.postFor` was set *before*
  `onUpgrade` ran, so a card that failed to apply marked the sector done and the
  player silently got nothing. The marker is now set only after the grant lands.

## 5. Unverified / open

- **No browser frame.** The receipt is asserted in happy-dom against the real
  `index.html` (present, named card, reason, expiry) — never seen rendered. Its
  height inside the HUD next to the goal chip is unconfirmed; the HUD now has a
  second variable-height child under the wave line.
- **Balance is unplayed.** A card per sector is a real power curve and nobody has
  felt it. If a run outgrows the field, `POST.every` is the one knob.
- **Wave mode's own chooser still works** (`catalogRewards: true` there is
  unchanged and still tested), but wave mode is not the shipped mode, so this
  chunk did not verify it by hand.
- `shipped` config in tests is hand-mirrored from `main.js:1239`; if that call
  drifts, the tests would keep passing against a stale configuration.
