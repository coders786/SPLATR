# CHUNK 5 — THE QUEST BOARD: from three grey boxes to a reason to play

**Status:** built, 880/880 headless tests, `npm run build` verified.
**No browser QA** (no Chrome binary in this sandbox) — layout claims are pinned
structurally against the real `index.html` in happy-dom, not seen rendered.

---

## 1. What was actually wrong

The screenshot is honest, and the problem is not the colour of the boxes.

**The reward was hidden.** `drawPicker` put the entire prize row — the only part
of the screen that answers "why would I do this?" — inside
`<details><summary>Optional rewards</summary>`. Alongside a toggle already
labelled **GUIDED QUESTS · ON**, the board said:

> here are three chores · and, folded away, marked *optional*, the thing you get.

Everything else follows from that. Three columns of nine near-identical
`GOAL · 2` buttons are a menu with no stakes; the value proposition was one
disclosure triangle below the fold.

**The categories were a taxonomy, not a goal.** AIM & TARGETS / CUT TECHNIQUE /
WAVE RHYTHM are a designer's filing system. Nothing in them tells a player what
kind of round to have.

**The reward for finishing was 3 credits.** Learning lessons pay
`points: 3` each, nine for a full board, against a first cosmetic priced at
**100**. A player can complete the entire learning ladder and still not own a
single thing.

**The board reset on every run.** No long-term progress existed at all: the
pick survived in memory only, so the same three rows greeted you each time.

## 2. What it is now

A **bounty board**. Each run posts three contracts, one per lane, each carrying
its own reward — and the reward is on the contract, not in a fold.

| before | after |
|---|---|
| 3 columns × 3 tiers = 9 buttons | 1 contract per lane, 3 total — a choice you can read |
| reward in `<details>Optional rewards` | **B +100** printed on every contract |
| "YOUR PRIZE" = one distant hat | the contract's own points pay immediately |
| AIM & TARGETS | **SMASH** — "break things" |
| CUT TECHNIQUE | **STYLE** — "cut like a pro" |
| WAVE RHYTHM | **CLIMB** — "get further" |
| resets every run | **STREAK** — consecutive completed runs, shown live |
| lessons pay 3 | lessons pay 30 |
| 100-credit hat as the only carrot | the ladder pays first: hat 40 · wings 75 · crown 120 |

**The ladder now completes before the shop starts.** The first cosmetic used to
cost more than the entire tutorial ladder could earn; it is now reachable from
about two completed runs, and the three cosmetics total less than the old price
of one.

**STREAK is the new long-term hook**: complete every contract in a run and the
streak climbs; break one and it resets. It is displayed on the board and in the
HUD, so there is something to protect across runs — the thing the system never
had.

**A run auto-posts the contract you will actually keep.** If the ticket is
already open when the run ends, the next one is auto-selected instead of asking
you to re-pick a board you have already chosen.

## 3. Files

| File | Role |
|---|---|
| `src/quests.js` | `CONTRACT_POINTS`, `LANES`, `lessonPoints`, `boardSummary`, rebalanced `PARTS`, lesson points 3 → 30 |
| `src/quest-ui.js` | bounties panel replaces the 9-button matrix; streak; auto-post |
| `src/style.css` | `.bounty-*` — lanes, reward stamps, pips, streak |
| `test/chunk5-quests.test.js` | 20 tests |

## 4. Honest limits

- **This does not fix the top-level menu.** Your screenshot shows QUESTS
  sandwiched between LIVE ENEMY TRAINING and CONTROL PRACTICE — three peers that
  are not peers. That is a menu-information-architecture job, and doing it here
  would mean re-laying-out a screen this chunk did not otherwise touch.
- **Balance is unplayed.** 30 credits a lesson is 10× the old value and is
  argued from the shop's prices, not from a session.
- No browser, so the new board's real spacing is pinned by structure only.
