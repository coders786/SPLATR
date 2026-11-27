# CHUNK 6 — RIOT CONTRACTS: gutted and rebuilt

**Status:** built, 880/880 headless tests, `npm run build` verified (995.17 kB / 368.97 kB gzip), live preview rebuilt.
**No browser QA** (no Chrome binary). Layout is pinned structurally against the real `index.html`.

You were right that it was an identity crisis, and the diagnosis was sharper than
mine: I treated chunk 5 as a layout problem when four unrelated things were in one
box. This is a rebuild, not a re-skin.

---

## 1. The five identity failures, and what happened to each

| # | The problem | The fix |
|---|---|---|
| 1 | Graduation-cap `QUESTS` on a slasher menu | `CONTRACTS`, with the **target/reticle** icon (`#i-target`). No cap in the app any more. |
| 2 | `LIVE ENEMY TRAINING` + `CONTROL PRACTICE` in a rewards modal, while `PRACTICE & HELP` already existed | Moved to the **PRACTICE & HELP page** (`#manual-modes` in `index.html`). Deleted from the modal, markup and all. |
| 3 | Cards read as tutorial tooltips | **Tutorials-as-contracts removed from the board entirely.** Objectives are one line, hard-capped at 52 chars by test, and the test fails on "Tap a…", "Pull back…", "Press…". |
| 4 | Duplicate shop at the bottom | Deleted. One `SHOP →` button in the header opens the **real** shop; wallet balance sits beside it. |
| 5 | `BOUNTIES · ON` toggle — nobody turns off rewards | **Removed.** `questsEnabled` is now a `const true`; a saved `optional-quests: off` can no longer disable rewards. |

## 2. The new system

**Three pillars**, each a different promise:

| Pillar | Colour | Kind | Reads from |
|---|---|---|---|
| `/// CARNAGE` | `#ff3366` | cumulative, survives death | durable `profile.tally` |
| `/// STYLE` | `#00f0ff` | precision, per run | this run's peaks |
| `/// SURVIVAL` | `#dfff00` | distance, per run | this run's peaks |

**The loop:** live numeric bars → `CLAIM ♦ +N` when a card completes → clear all
three and the **BOARD SWEEP** pays `+75` and deals a fresh, richer board with a
sweep counter that climbs. **One free reroll per board**, then `♦10` per swap.
Progress carries between runs, so CARNAGE is never wasted.

**Look:** deep violet-black surfaces (`#14101e` gradient), 1px crisp borders, a
**3px pillar-coloured top border** per card (the pastel gold header is gone), the
title skewed `-6deg` like the title screen, `///` motif on the tag, and a
segmented glow bar. `REWARD` left / `♦ +N` right in the footer; a completed card
turns acid-lime with a pulsing `CLAIM` button.

## 3. Two real bugs the tests caught

Both would have shipped as "the screen is fine, the numbers are broken":

1. **`CLAIM ♦ +undefined`.** A board is *saved as ids* and restored through
   `contractById`, which returned the catalogue row — and `pay` only existed on
   freshly dealt cards. Claiming a restored board paid `NaN`. Payout is now
   derived from (pillar, tier) inside `contractById`.
2. **Dead slots.** When a pillar's whole pool was complete, `dealContract` fell
   back to the pool *including finished contracts*, so CARNAGE posted a card you
   had already cleared. It now **escalates**: the least-complete contract is
   re-posted with its target pushed out by another full target's worth
   (50 → 100 → 150), so the pillar keeps climbing instead of recycling.

## 4. Removed rather than left fighting

Chunk 5's **STREAK** is deleted. Sweeps are the long-term hook now, and two
competing meta-progressions on one screen is exactly the identity crisis this
chunk was fixing. `streak`, `bestStreak`, `LANES`, `boardSummary` and the
`.bounty-*` styles are all gone.

## 5. Files

| File | Role |
|---|---|
| `src/contracts.js` (**new, pure**) | pillars, pool, dealing, escalation, sweep, reroll economy |
| `src/quest-ui.js` | the board rewritten; tutorial matrix deleted; tallies fed from live events |
| `src/quests.js` | durable `tally`, `board` state, streak fields removed |
| `index.html` | `#manual-modes` on the practice page |
| `src/style.css` | `.riot-*` replaces `.bounty-*` |
| `test/chunk6-contracts.test.js` | 20 tests, including the five absences |

## 6. Unverified — read this before judging the balance

- **No browser.** Every layout claim is structural. The skew, the 3px accents and
  the glow have never been seen rendered by me.
- **Balance is a guess.** Pay is 25–60 per contract, +75 a sweep. CARNAGE targets
  (50 kills etc.) assume a run clears ~15–25 bodies; nobody has played this.
- **Escalated CARNAGE targets can get steep** (1050 in the degenerate test).
  Real play would need several sweeps before that bites, but it is untuned.
- The **practice page** now has two buttons above the visual manual; how that
  looks alongside the existing manual art is unconfirmed.
