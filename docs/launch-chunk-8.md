# Chunk 8 — the deed book, and the pause made honest

**Shipped:** 120 reasoned quests, a five-lane board, and §3 of the chunk-7 plan:
the pause now reads the run, distinguishes a deliberate pause from an
interruption, clamps the first frame after a resume, offers a copyable fault
report, and no longer pauses for a glance at another window.

---

## 1. The quest system, rewritten

The old board dealt three quests from a flat pool. The new board deals three
**lanes** — CUT, MOTION, RHYTHM, HUNT, DEPTH — and three different **axes**
inside them:

| Axis | The question it asks |
| --- | --- |
| `volume` | the long game: a lifetime tally |
| `streak` | an unbroken run: one mistake resets it |
| `moment` | one deliberate stroke, window, or angle |
| `peak` | a best-in-run tally of ordinary business |

Axes are **derived from the metric**, never authored on the deed. A card's
promise and its arithmetic therefore cannot drift apart. The dealer leans
toward the player's weakest lane, and a fresh board always contains three
deeds, three lanes, and three axes.

The book holds **120 custom deeds**. Each one states why it exists and what it
does to the player: a deed is not a quota, it is a reason to play differently
for one run. The tracker (`src/deed-tracker.js`) gates idle farming with
`QUIET_SPEED = 6`, so standing still does not progress a deed.

## 2. §3 of the chunk-7 plan, shipped

| Item | What changed |
| --- | --- |
| 3.1 Pause reads the run | The pause screen shows the three held deeds in board language: lane, accent, numeric `current / target`, done state. |
| 3.2 Deliberate vs interruption | A deliberate pause offers the full menu. An automatic pause hides contracts/manual/options and offers only Resume and End run — no shop while the player is away. |
| 3.3 First delta after resume | `frame(realNow)` clamps the first post-resume delta to `MAX_FRAME_GAP_MS = 64`, and returning from a hidden tab resets the reference. |
| 3.4 Copy report | `src/frame-report.js` builds a plain-text report: timestamp, seed, page, run state, wave, failure count, error table, held deeds, and the last five `[SPLATR]` console lines. The shell only copies it to the clipboard. |
| 3.5 Blur debounce | `BLUR_GRACE_MS = 400`: a glance at another window cancels the pending pause; a real interruption still pauses with its cause recorded. |

The duplicated `dev-fault` handler in `src/main.js` was removed. There is now
exactly one handler, wired to `frameReport(...)`, and the console ring is
captured once at boot.

## 3. Tests that were lying, fixed

Two tests were red because they were dishonest, not because the game was
broken:

- `test/chunk8-deeds.test.js` now plays a real `createRun`: a shape is placed
  in the arena, the blade is launched at it, and the run's own events prove
  whatever the dealer dealt. It also pins `pauseRead()`'s shape.
- `test/quest-ui.test.js` no longer hard-codes an event stream against a dealt
  board. Its `session()` helper exercises the whole event vocabulary, so the
  portal test tests the portal, not the dealer's mood.

New coverage: `test/chunk8-pause.test.js` (12 tests) pins the blur debounce,
the resume clamp, the interruption gate, the pause deed rows, and the report
module by behaviour.

## 4. Files

| File | Change |
| --- | --- |
| `src/deeds.js` | 120-deed book; derived `AXIS_OF` across volume/streak/moment/peak |
| `src/deed-tracker.js` | deed progress tracking with the quiet-speed gate |
| `src/frame-report.js` | pure report builder + console ring (`CONSOLE_LINES = 5`) |
| `src/main.js` | report wiring, single `dev-fault` handler, pause/blur/clamp shell |
| `src/quest-ui.js` | `pauseRead()`, vault sweep, board dealing |
| `test/chunk8-deeds.test.js` | real-run deed test; `pauseRead()` shape assertions |
| `test/chunk8-tracker.test.js` | tracker behaviour |
| `test/chunk8-pause.test.js` | §3 pause/report suite |
| `test/quest-ui.test.js` | vocabulary-wide portal session |

**Verified:** 935/935 tests; `npm run build` → 1,050.80 kB / 388.88 kB gzip,
one-file vector-art check passed.

**Not verified:** no real browser in this environment, so the visual read of
the pause panel and the actual rAF behaviour under a real `blur` remain
unconfirmed. The shell rules are pinned structurally; the report is pinned by
behaviour.
