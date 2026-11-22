# SPLATR: fairness, combat clarity, and progressive-disclosure redesign

**Status: staged implementation in progress.** Camera independence, core quest
progressive disclosure, presentation timing/body fixes, pure prize settlement,
populated-rollover browser checks, quick-peek controls and opt-in combat traces
have now been implemented. See the newest entry in `fix-round-status.md` for
current evidence (308 passing tests) and remaining scope. The research/design
specification below records the original proposal; its future-tense language is
not an assertion that every listed phase is still unimplemented.

The original research pass changed documentation only; subsequent implementation
passes and test results are recorded separately in the status log.
The supplied 00:00–00:37 description is a bug-report transcript, not a video
available for independent frame inspection. Timestamped observations below are
reported symptoms. Source findings are independently inspected in this checkout.
The previous 298-test result is historical baseline evidence, not proof that the
new video scenarios pass. Existing result-card fit and single-server port 3000
are constraints to preserve.

## 1. Evidence corrections before designing

### Endowed progress is not a promised retention multiplier

Nunes and Drèze's study distributed 300 car-wash cards and reported 34% versus
19% redemption over nine months, with eight purchases still required in both
conditions. This is 15 percentage points, approximately 79% relative improvement,
in that study—not a forecast for SPLATR. The paper also discusses moderators,
including the explanation for the endowment. [2](https://www.psicologo-milano.it/wp-content/uploads/2013/08/images_immagini_file_endowedloyalty.pdf)

**Decision:** do not silently inflate prize denominators or grant hidden pity.
`20/120` is 16.7%, not 20%; `25/125` would be 20% while still requiring 100.
Neither represents an actual reduction in player effort. Keep existing costs and
saves stable for the first release. If we later offer a welcome gift, use a real,
explicit, once-only credit and test it separately from the HUD redesign.

### Goal distance supports clarity, not a magic threshold

Kivetz, Urminsky and Zheng report acceleration near rewards in coffee and
music-rating programs and faster completion with endowed progress. Their paper
does not establish a universal 65%, 75%, or 80% UI trigger or an expected effect
size for an action game. [1](https://www.columbia.edu/~rk566/Session4/Goal-Gradient_Illusionary_Goal_Progress.pdf)

**Decision:** always show truthful remaining effort on result/pause screens;
use 65% only as a tunable visual-design hypothesis, not a scientific constant.
Prefer `28 POINTS LEFT` to urgency, countdowns, or “don't lose your progress.”

### Working-memory limits are not HUD item limits

Cowan's review concerns roughly 3–5 chunks under specified experimental
conditions, with contributions from rehearsal, expertise, grouping and other
stores. It does not equate one HUD widget with one memory chunk or prescribe
three persistent game indicators. [3](https://clcs-sustech.github.io/course/cse5026/2025/readings/Cowan.2001.the-magical-number-4-in-short-term-memory.pdf)

**Decision:** use survival/tactical/strategic tiers as our design framework,
not a universal law attributed to Hodent. Evaluate readability and task
performance rather than counting widgets and assuming cognitive load fell.

### Separate remembering from resuming

Ghibellini and Meier's 2025 meta-analysis reports no general unfinished-task
memory advantage, but a general tendency to resume interrupted tasks. That is
not proof that an untouched 0/1 goal is bad, or that manufactured frustration
improves a game. [1](https://www.nature.com/articles/s41599-025-05000-w)

**Decision:** preserve genuine progress, offer clear next actions, and make
stopping easy. Optimize perceived fairness, understanding and voluntary return,
not compulsion or maximum session length.

### Accessibility constrains the redesign

Game Accessibility Guidelines recommends readable text, redundant signals
rather than color alone, accessible controls, and avoiding flickering patterns.
[1](https://gameaccessibilityguidelines.com/basic/)

**Decision:** tiny pips can be tiny visuals, but not tiny input targets. Do not
replace words with unexplained color-only status or require holding a key.

## 2. Source-grounded issue register

| Priority | Reported symptom | Source evidence / uncertainty | First action |
| --- | --- | --- | --- |
| P0 | HULL HIT during a three-Fang cut, 00:09 | `run.js` resolves contacts using mutable `s.blade`; `hurt()` clears blade/chain. Per-target cut immunity already exists. The transcript alone cannot prove whether the damage came before an eligible cut, from a late contact, or from another hazard. | Record an ordered collision/combat trace, reproduce the cluster, then resolve eligible cuts before damage. Do not add blanket invulnerability first. |
| P0 | Giant white curves remain during drift | Renderer has separate aim, movement ribbon, slash, shear, beam and smear systems. Beams have life 12; the movement ribbon continues sampling while playing. A long curve is not automatically a beam. | Tag visual primitives by owner, shot and age; identify the actual emitter. Establish lifetime and maximum-segment budgets per effect. |
| P0 | Body exceeds travel proportions during a cut | `boundedBody` explicitly excludes splat, `landFor(...)` and `s.impact`; connected cuts set `landAge = 0`. This is a concrete path around the airborne-only cap. | Enforce a final body-envelope contract during real cuts, not only quiet airborne test states. |
| P1 | Ghosts remain at 26 DRIFT | `ghostFor(speed, MAX_SPEED)` gates a separate ghost system by speed; `ghostClock`, `push` and `ghosts.tick(1/60)` run in draw. Thus the active-dash gate is absent and state depends on render count. | Move sampling/aging to fixed update; require active dash for emission and bounded decay after it. |
| P1 | Purple object is cropped at right edge | Could be a Prism, world projectile, or overlay pointer. Source culls with view padding and has several overlay paths. World-wall containment is not camera containment. | Identify the primitive in a tagged capture before changing physics or clamping the camera. |
| P1 | Finished quest stays on combat HUD | `quest-ui.js:hudDraw()` maintains all three rows indefinitely, including complete rows. | Replace permanent rows with pips; move detail to pause/peek/results. |
| P1 | Radar disappears early | Renderer tests a rectangle expanded by 48px and applies `.20` target opacity to the entire radar, including contacts. | Exact player-body overlap; background-only dimming. |
| P1 | Radar text is unreadable | Explicit `9px monospace` labels and VIEW/NEAR captions remain in minimap drawing. | Remove captions; teach symbols in pause/manual, not microtext. |
| P1 | `+20 SAVED · 0 INK` is contradictory | Result copy directly concatenates saved prize progress and `profile.coins`, two different balances. | Show prize-point earnings and saved total together; separate wallet elsewhere and omit zero. |
| P2 | Prize fill lacks a meaningful transfer | A prize meter and sparks already exist; presence of animations does not establish that they visibly communicate source → destination or handle unlock rollover. | Drive the animation from one immutable settlement receipt. |
| P2 | STYLE 0/1 has no visible route forward | `triple1` is deliberately a binary goal. It is not a bookkeeping defect. | Offer a clearly named alternative quest as a separate balance experiment, not invisible partial credit for a triple. |

## 3. Release sequence and dependencies

### Phase A — Reproduce and instrument, without changing rewards

Add a bounded, development-only ring buffer and export JSON on demand. Fields:
`tick`, `shotId`, `entityId`, normalized event time/TOI, event type, blade-active
snapshot, hp before/after, protection reason, damage source, effect ID and age.
No network telemetry by default; no user identifiers or raw input recording.

Build deterministic fixtures for:
- Three Fangs: contact/cut events inserted in each order, varying spacing,
  shallow/vertical entry, final blade tick, hitstop, and 30/60/144Hz rendering.
- Mixed threats: Fang cluster plus shield survivor, needle, Crown debris and
  Prism link. Distinguish legitimate damage from same-pass punishment.
- Dash → cut → drift; dash → no hit → drift; drift at speed 26; repeated
  `draw()` without simulation advancement; pause/resume and reduced motion.
- Right-edge Prism, its projectile, generic pointer, portal pointer, and camera
  scroll/zoom at 1280×720, 960×720, 550×720, 860×440 and 390×844.

**Gate:** every video symptom is mapped to a fixture or explicitly remains
unconfirmed. Record baseline captures before the corresponding fix.

### Phase B — Combat fairness and a single visual contract

#### Combat transaction

1. Freeze attack eligibility for the current simulation step/shot.
2. Gather candidate cuts, body contacts and hazards; normalize their event time.
3. Resolve valid cuts deterministically before conflicting body damage. Deaths
   and harmless debris cannot subsequently hurt from a stale contact list.
4. Preserve per-target exit protection. If the reproduced case needs additional
   cluster protection, scope it to eligible enemies swept by this shot, with a
   short bounded grace window; do not protect unrelated hazards globally.
5. Resolve remaining legitimate damage once, with a source/protection trace.
6. Emit presentation events after state resolution so score/hit receipts cannot
   contradict the combat outcome due to queued processing.

**Contract:** an enemy validly cut during the same pass cannot cause body damage
for that cut contact. A missed or expired-blade attack is not invulnerable. Armor
is not silently converted into a guaranteed kill. Keep projectile/link counterplay.

#### Effect ownership and clocks

Introduce shared effect metadata (`kind`, `shotId`, `bornPresentationTick`,
`expiresPresentationTick`, position samples). Cosmetic age uses unpaused real
presentation time, not slowed world time; rendering reads state without aging it.
Pause may freeze or clear cosmetic state consistently; hitstop does not extend
white streaks. Reset, practice, retry and Vault transitions clear owned effects.

Initial design budgets (proposed, not research-derived):
- Hot cut core: 80–120ms; residual halo gone by 250ms.
- Completed slash/ribbon: no visible remainder after 350ms from its end.
- Emit ghosts only during the active dash interval; at most three; residual
  ghosts gone within 100ms after that interval. None during ordinary drift.
- Never connect a ribbon across launch resets, teleports, banks that change
  continuity, or camera resets. Reject an implausibly long adjacent segment.
- Keep aim preview strictly tied to actual held aim; idle cursor is not aiming.
- Final body cap remains the existing stricter **1.25×** travel limit, not a new
  1.35× allowance. Return to square within five recovery ticks, including real
  cut/impact combinations. If a wall splat keeps a separate artistic envelope,
  specify and test it explicitly rather than letting transforms multiply.

#### Border policy

HUD arrows and icons must be fully inside radius-aware screen bounds. Active
spawns retain radius+28 clearance. Fix the actual offending path rather than
clamping every world actor to a moving camera. A scrolling world's natural
partial entry is not equivalent to a clipped HUD indicator. If design demands
full silhouette before engagement, use telegraph → safe activation with no
invisible collision, and recycle unsafe entries. Never restore HUD clip holes.

### Phase C — Progressive-disclosure quests, without read-noise substitution

Default combat HUD: score/chain, hull/edge/focus, existing contextual tactical
feedback, and exactly three silent quest pips. Remove the full quest-row DOM
from the live HUD; hiding text visually is insufficient if it still intercepts
input or occupies layout.

Pip vocabulary: empty outline = not started; partly filled/marked = progress;
filled/check = done. Color is supplementary. No endless amber pulse. Group pips
inside one at-least-44×44 CSS-pixel button, with an accessible name summarizing
completion and how to open details. Teach the three categories in the picker.

Full details:
- Pause: two columns on landscape/desktop, menu left and live quests + prize
  right. Portrait can stack if necessary; preserve reachable Resume first.
- Quick peek: Q reveals within 100ms and may animate for up to 200ms. Support
  hold-to-peek and a toggle alternative. Touch uses the pip button. Close with
  release/toggle/Escape; clear held state on blur, death, pause and Vault entry.
- Do **not** commandeer Tab by default: retain keyboard focus navigation. Offer
  it only as an explicit remapping. Hover is optional and must not become the
  only discovery or access method.
- Opening peek must not fire, redirect or buffer a dash, move focus into a trap,
  advance a quest, change time scale, or replace the player's aim vector.

Progress acknowledgement:
- One strip maximum; 1.2s nominal lifetime. Completion can preempt a progress
  strip. Repeated updates coalesce to the latest count, never queue a backlog.
- Default to meaningful milestones/completion, not every Fang hit. Cap
  noncritical progress to one strip per six seconds; otherwise 1.2s-on-every-hit
  becomes another permanently visible quest tracker.
- Safety warning/portal announcement outranks quest feedback. No layout shift
  under score, no blocking survival HUD. Reduced motion uses static appearance.
- Detailed progress is always available in pause, regardless of toast duration.

### Phase D — Radar as a glanceable spatial aid

- Delete both text captions. Keep the camera footprint only if recognition
  testing shows it helps; it must remain lower contrast than threat symbols.
- Keep player at 70–75% down the box (25–30% from bottom); this is already near
  the current value. Do not claim moving 75% to 72% fixes crowding.
- Use a stable, continuous projection around the player with a documented
  local range. Audit current unequal up/down mapping slopes and contact density.
- On-screen threats: dim but crisp, not removed entirely. Nearby off-screen
  threats: brighter directional markers on a **border lane**, separate from
  position-preserving interior markers. Preserve bearing, avoid snapping all
  distant threats into an undifferentiated stack.
- Enemy vocabulary: red triangle for Fang; gold diamond for boss; neutral purple
  dot for other threats. Portal is a distinct gold ring, not another enemy class.
  Player uses a lime wedge/dot with a dark outline. Shape is not optional color.
- Minimum contact footprint 4 CSS px, larger priority markers 6–8px; cluster
  low-priority overlaps deterministically. Never hide player, portal or an
  imminent threat behind an arbitrary cluster marker. Limit flashing; default
  offscreen distinction is luminance/shape, optional slow pulse only.
- Determine overlap using the rendered player bounds against the exact radar
  rectangle. Background opacity may drop (e.g. .65 → .30); contact/player/portal
  contrast does not. No 48px proximity fade of the entire panel.
- Do not promote the new icon meanings into another tiny legend. Put a readable
  explanation in pause/manual and evaluate whether it is needed after onboarding.

Speedometer: retain secondary priority and actor-overlap fade; measure actual
text bounds at each viewport and move/remove the DRIFT/CRUISE word if it touches
ticks or the number. Do not infer speed from the label to gate ghosts—use the
explicit dash phase.

### Phase E — Truthful result feedback, then optional quest balance

Create one settlement object for result rendering:
`settlementId`, old/new prize ID, previous saved amount, earned points, applied
points, unlocked item, remainder, wallet change, and per-quest earnings/kept.
Settlement occurs once before animation. Opening the screen again, skipping an
animation or retrying cannot grant currency twice.

Example, unchanged economy:

```
GOLD HALO                    72 / 100
+20 POINTS SAVED             28 POINTS LEFT
[filled track]              [RETRY SAME QUESTS]
```

Omit a zero ink balance. If ink remains a distinct spendable currency, explain it
in the reward/pause interface rather than concatenating it to prize progress.
`DONE +10` must visually feed prize points, not suggest ink was earned.

Animate true 52 → 72 over roughly 450–650ms, optionally using small quest-to-meter
particles. Present the final numbers immediately to assistive technology. Retry
stays usable immediately; reduced motion jumps to the final state without sparks.
For rollover (e.g. 92 + 20), show unlock at 100 and 12 toward the next prize using
the receipt, not `currentSaved - earned`, which becomes wrong across an unlock.
No flashing when a hidden tab resumes. Maintain zero-scroll result geometry.

Keep RETRY SAME QUESTS honest: same selected IDs. Completed quests have no KEPT
carry; do not silently auto-replace them. A separate explicit NEW QUESTS action
may be offered. Preserve per-ID, non-stacking head starts and tutorial exclusion.

**Separate optional experiment:** introduce a new STYLE quest ID `flow3` with
label `3 FLOW MARKS` and readable helper `Triple cut, or 3 double cuts`.
One distinct double-cut dash earns one mark; a triple-cut dash earns three total
(not one plus one plus three from its successive kills). Deduplicate by shot ID;
finish once; preserve existing per-ID carry limits. This is an alternative goal,
not partial completion of `1 TRIPLE CUT`. Keep the old challenge available.
Balance its payout with measured attempts/time, not an assumed equivalent effort.
Do not add a hidden 20% mercy spark or retroactively relabel saved goals.

## 4. Acceptance and regression plan

Add these tests; retain the existing five named Master QA acceptance tests:

1. `test_cluster_cut_damage_transaction`: permutation-invariant eligible cluster
   cuts; zero illegal hull loss; legitimate projectile/expired-blade controls.
2. `test_effect_lifetime_and_draw_purity`: four refresh rates, 90% aim slowdown,
   hitstop, pause/reset; no finished dash trace after 350ms; repeated draws do
   not emit/age effects or mutate ghost count.
3. `test_body_envelope_during_real_multicut`: actual cut/landing/impact state,
   eight headings, normal/hyper speeds; not merely quiet airborne pose fixtures.
4. `test_border_actor_and_overlay_classification`: reproduce each candidate
   purple primitive; radius-aware overlay bounds and no hidden collidable actor.
5. `test_quest_disclosure_and_input_isolation`: no permanent live quest labels;
   three redundant-state pips; pause/peek/touch/keyboard; no accidental shot or
   time-scale change; no stuck peek after blur/Vault/retry.
6. `test_quest_toast_coalescing`: bounded simultaneous count, no backlog,
   priority preemption, reduced motion and event-storm occupancy limits.
7. `test_radar_projection_overlap_and_priority`: exact overlap only; background
   versus symbol alpha; range/bearing, crowded contacts and portal invariants.
8. `test_prize_settlement_animation_and_rollover`: 52+20, 92+20, zero earnings,
   owned prizes/chest, re-open/retry mid-animation; settlement remains idempotent.
9. If the balance experiment is approved, `test_flow_marks_per_shot_and_carry`:
   double/triple deduplication, alternate ID, practice exclusion, per-ID carry.

Browser matrix: actual populated pause, result, peek, quest completion and radar
views at all Phase-A sizes; keyboard, pointer and touch emulation; reduced motion;
long/localized strings and text scaling. Assert descendant clipping and button
bounds, not only `scrollHeight === clientHeight` on an overflow-hidden parent.
Capture actual combat fixture sequences as well as static layout screenshots.

## 5. Metrics: player benefit first

All targets below are **proposed project acceptance goals**, not published
psychological constants or measurements we have already obtained.

| Question | Measure | Initial goal / decision rule |
| --- | --- | --- |
| Is cutting fair? | Illegal hull-loss events / eligible cluster-cut transactions | Zero in deterministic fixtures; investigate every field trace |
| Are effects bounded? | Last visible trace time after dash end; draw-side mutations | <350ms; zero mutations |
| Is combat HUD quieter? | Permanent quest text rows; simultaneous quest strips | Zero rows; at most one contextual strip |
| Is progress understandable? | Player can explain saved amount, remaining points and retry carry | At least 80% correct in a formative task; report counts, not precision claims |
| Is radar useful? | Time/error locating next offscreen threat and portal | Compare paired, order-counterbalanced versions; no assumed gain |
| Is feedback distracting? | Missed telegraphs, incoming hits around toast/peek, self-report | No observed safety regression; completion cues must not mask hazards |
| Does control work? | Accidental dash, stuck peek, lost keyboard focus | Zero in scripted flows; log each playtest incident |
| Does the result card fit? | Clipped descendants/buttons and scrolling at tested sizes | Zero failures, including full content and rollover receipt |
| Is performance preserved? | p50/p95 frame CPU, long frames, DOM updates under event storms | Baseline on the same device/seed; investigate >10% p95 regression |

Start with 8–12 formative players across experience levels and input methods,
using counterbalanced tasks. This finds usability failures; it is not a powered
retention experiment. Ask neutral questions such as “What happens if you retry?”
and “Where is the next threat?” rather than leading with “Was the cleaner HUD
better?” Report individual errors and uncertainty.

Only after combat and presentation gates pass should a controlled experiment
compare progress copy or the new STYLE quest. Change one dimension at a time,
choose the primary metric and minimum worthwhile effect from baseline data, and
calculate sample size before looking at treatment results. Guardrails include
fairness complaints, task understanding, accidental inputs and easy voluntary
exit. Do not maximize session length or reuse the car-wash effect size as the
expected treatment effect.

## 6. Delivery order and stop rules

1. **Evidence fixtures and combat trace.** No economy changes.
2. **Combat transaction, final body envelope, effect clock/ownership.** Must pass
   before decorative feedback is added.
3. **Quest disclosure and pause/peek input behavior.** Preserve ledger semantics.
4. **Radar and speed-dial readability.** Validate with populated combat scenes.
5. **Settlement receipt/copy/animation.** Preserve prices, saves and instant Retry.
6. **Optional STYLE alternative / real starter-credit experiment**, separately
   approved and balanced. No automatic quest replacement.
7. **Full regression + real browser fixtures + formative playtest report.**

Each stage is a small reviewable change on the current branch, with before/after
captures and a regression test. A failed combat/input invariant blocks the next
stage. Do not weaken a visual test simply because a new policy changes its
fixture; repair the fixture to test the intended invariant and document why.
DimensionShatter and further reward spectacle remain outside this clarity pass.

## Source access notes

- Nunes & Drèze: inspected a mirrored author manuscript, including Study 1
  methods/results; publisher DOI page was access-restricted.
- Kivetz et al.: inspected the Columbia-hosted manuscript.
- Cowan: inspected the original review PDF hosted by a university course.
- Ghibellini & Meier: original journal search result supplied abstract and
  results; direct page retrieval failed. No claim of reading inaccessible text.
- Accessibility: inspected the Game Accessibility Guidelines basic checklist.
