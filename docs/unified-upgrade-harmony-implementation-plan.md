# SPLATR — Unified upgrade, harmony and regression-safe implementation blueprint

**Status: design blueprint; implementation has started in small chunks.**
See [implementation progress and actual verification](upgrade-harmony-implementation-progress.md).
S0 baseline capture, S1 shared family selection and S2a shadow-only combat-source
observation are complete. S2b's compatibility boundary now covers every current
attack route; admission/transaction policy is still pending. The independent shop/UI subset of
S9b now includes all73 item icons, search, transaction/swap receipts, bounded
interaction feedback and the short-screen shop fix. New powers, replacement
perks, source-admission migration, geometry/status redesign and remaining harmony
work below are still targets, not shipped behavior. Do not read this blueprint as
a completion report.

This is the **single implementation specification** for the upgrade redesign. It consolidates appearance-led powers, physical consequences, all 73 item designs, construction/material harmony, all 18 Sparks, all 17 Apex profiles, interaction feedback and restrained particles. Older V1–V5 proposals are historical inputs, not parallel specifications to implement together.

**No honest plan can guarantee zero new bugs.** The objective is to prevent known failure modes, isolate intentional changes, detect regressions early and make each release reversible without losing purchases or progress. An unchecked gate below means **do not enable that feature**, not “probably fine.”

## Navigation

- **[A — Product contract](#a-product-contract):** one assembled build, bounded consequences, protected invariants.
- **[B — Implementation architecture](#b-implementation-architecture-and-safety-contracts):** owners, dependencies, clocks, geometry, events, migration.
- **[C — Complete item work orders](#c-complete-catalogue-work-orders):** all 73 items, each with appearance, power, animation, restraint, harmony contribution, implementation hook and positive/negative tests.
- **[D — Composition language](#d-full-harmony-implementation-language):** materials, colors, action envelopes, core×Dash, Dash×Slash, all 18 Sparks and all 17 Apex recipes.
- **[E — Integrated feedback](#e-integrated-events-feedback-and-single-swap-acceptance):** events, conflicts, budgets, single swaps, instruments, shop, audio and reduced motion.
- **[F — Delivery and release](#f-delivery-regression-prevention-and-release-qualification):** dependency-ordered small chunks, risk register, test matrices, acceptance evidence and rollback protocol.

## Item index

Each link opens the item’s power, icon, animation, harmony boundary, code hook and regression work order in this document.

- **Head:** [none](#item-none), [halo](#item-halo), [neko](#item-neko), [viper](#item-viper), [oni](#item-oni), [crown](#item-crown), [samurai](#item-samurai), [coil](#item-coil), [beacon](#item-beacon).
- **Eyes:** [ninja](#item-ninja), [visor](#item-visor), [blaze](#item-blaze), [glitch](#item-glitch), [smug](#item-smug), [hypno](#item-hypno), [sniper](#item-sniper).
- **Body:** [paper](#item-paper), [obsidian](#item-obsidian), [hologram](#item-hologram), [prism](#item-prism), [iron](#item-iron), [lava](#item-lava), [gold](#item-gold), [chamfer](#item-chamfer), [notched](#item-notched), [segmented](#item-segmented).
- **Core:** [standard](#item-standard), [time](#item-time), [riot](#item-riot), [glass](#item-glass), [grav](#item-grav), [magnet](#item-magnet), [echo](#item-echo).
- **Tail:** [ribbon](#item-ribbon), [wings](#item-wings), [ghost](#item-ghost), [viper-tails](#item-viper-tails), [anchor](#item-anchor), [thrusters](#item-thrusters), [spectrum](#item-spectrum).
- **Slash:** [razor](#item-razor), [katana](#item-katana), [laser](#item-laser), [glitch-fx](#item-glitch-fx), [confetti](#item-confetti), [comic](#item-comic), [pixel](#item-pixel).
- **World:** [twilight](#item-twilight), [tokyo](#item-tokyo), [foundry](#item-foundry), [manga](#item-manga), [synth](#item-synth), [void](#item-void).
- **Dash:** [dash-auto](#item-dash-auto), [dash-ink](#item-dash-ink), [dash-fire](#item-dash-fire), [dash-lightning](#item-dash-lightning), [dash-ice](#item-dash-ice), [dash-water](#item-dash-water), [dash-void](#item-dash-void), [dash-echo](#item-dash-echo).
- **Pointer:** [pointer-reticle](#item-pointer-reticle), [pointer-diamond](#item-pointer-diamond), [pointer-orbit](#item-pointer-orbit), [pointer-cross](#item-pointer-cross).
- **Radar:** [radar-base](#item-radar-base), [radar-1](#item-radar-1), [radar-2](#item-radar-2), [radar-3](#item-radar-3).
- **Trajectory:** [trajectory-base](#item-trajectory-base), [trajectory-1](#item-trajectory-1), [trajectory-2](#item-trajectory-2), [trajectory-3](#item-trajectory-3).

**Implementation starts at S0 in Part F, not by enabling all proposed powers at once.** Parts B4/B8/B9 resolve combined timing, geometry and source policy before any dependent feature ships.

# A. Product contract

## A1. The experience

> A player recognizes the part, guesses its power, sees it fit into the build, and understands the real result when it activates.

Harmony is **causal agreement**, not painting everything one color. One shared release moves the assembly; each material has a local response. Actual movement feeds tails and world-spaced particles. Actual accepted outcomes drive contact/status/resource cues. Changing one slot changes the correct relationships without reviving removed perks or leaving old emitters behind.

Four tests apply to every connection:
1. **Identity:** what object/material is this, including on the free kit?
2. **Cause:** which actual state/event enables its response?
3. **Substitution:** which generic cue does it replace rather than stack over?
4. **Boundary:** what behavior must it leave unchanged?

## A2. Protected invariants

- Keep the existing Canvas2D/Matter architecture and standalone art engine. No Phaser migration, renderer rewrite or unrelated mass module extraction.
- Preserve all catalogue IDs, slot ownership, prices, unlocks, wallet credits, discoveries and presets. SCORE and CREDITS remain separate. No destructive save rewrite.
- Free items remain complete controls/readable baseline choices. Purchased sensors add truthful information, not accuracy withheld from free controls.
- Keep continuous play chooser-free. Do not restore quests, rest-platform ceremonies, mode pickers, duplicated shops or old quest UI simply because files/tests remain in the repository.
- Do not change `CAMERA.lead`, repaint slice brackets by role, add 85% autoclear, rebuild cut halves/decals/+1-cut systems, wire goals into `src/waves.js` or skip physics steps to manufacture a new slowdown.
- Do not introduce freeze/offscreen suppression of gameplay enemies or drop active attacks to meet an ornamental particle quota.
- Preserve current launch commitment, input capture/cancel behavior, collision sweep, armor grace, boss phase rules, reward ownership and lifecycle cleanup except where an individually approved work order explicitly changes a perk.
- Existing optional screen treatment remains at most one pass / three texture reads, no extra framebuffer chain or stacked bloom/vignette/chromatic passes. Fake bloom uses bounded static/baked art.
- Render resolution/caches/pools remain bounded; keep the existing 100ms metadata /100px visibility policy with moving-bounds checks where needed. No claim of real-device FPS from software rendering.

## A3. Authority and intentional changes

This blueprint contains both **retained implemented behavior** and **new target behavior**. A description of a target is never evidence it already works. Item cards use “keep/replace/new” to make the distinction explicit.

Precedence inside this document:
1. Protected invariants and explicit combined-profile decisions in Part B.
2. Actual source eligibility, geometry, clocks and caps.
3. Per-item target powers in Part C.
4. Composition/material recipes and event budgets in Parts D/E.
5. Optional ornamental choices.

An animation may not override mechanics. Conversely, if a proposed mechanic contradicts a protected invariant, do not silently force it through: amend the work order, tests and visible receipt before implementation. Baseline behavior is preserved by default, not every old generic perk forever. An intended replacement removes only its specified old benefit **in the same chunk** that delivers the new benefit, display and tests.

# B. Implementation architecture and safety contracts

## B1. Actual module ownership inspected in this checkout

| Current module(s) | Existing responsibility / risk | Planned integration boundary |
| --- | --- | --- |
| `src/art/splatr-art-engine.js`, `src/equipment.js` | Catalogue lives in art engine; equipment reexports it and normalizes ownership/save values | Keep catalogue identity stable. Add derived descriptors alongside existing entry points; do not create an art→equipment→art import cycle |
| `src/part-perks.js`, `src/equipment.js` | Legacy additive perks and run rules; caps blade8, chain36, drain30%, recovery40%, equipment score25% | Replace per-ID mappings atomically as work orders ship. Keep untouched perks/caps; expose source contributions rather than duplicate arithmetic in art |
| `src/swords.js`, `src/hybrids.js` | Immutable sword styles,17 assignments; most-specific recipe then catalogue-order tie | Use this selection for functional AND artistic family. Keep all discoveries separately |
| `src/run.js` (`createRun`, launch path, `cut`, equipment updates, bank/contact handling) | Owns live charges, resource mutation, primary/secondary damage, kill/armor events and equipment source arrays | Run remains sole committer. Adapt existing paths incrementally; never run legacy and new damage handlers for the same contact |
| `src/equipment-combat.js` | Deterministic eligible targeting, Grav aim pull, conditional horizontal width | Extend pure eligibility/ordering helpers; explicit static sight and source exclusions, deterministic ties |
| `src/slasher.js` (`move`, `attacks`) | Custom enemy movement, tell progression, hazard integration; not just dynamic Matter bodies | Add per-enemy locomotion/tell modifiers at declared operations. Hazards get world dt, not their owner's frozen dt |
| `src/physics.js`, `src/movement-model.js` | Player integration, legal speed/retention/rail contact and collision envelope | Compute declared momentum/bank adjustments at one existing authority point. No Body writes from render; preserve sweep and ceiling ownership |
| `src/slice-safe.js`, `src/aim.js`, `src/input.js` | Shared attack-sweep/preview geometry, input calibration and committed direction | Same resolved launch/attack parameters used by collision and preview. Do not re-apply assistance or add another predictive world step |
| `src/clock.js`, `src/run.js` timing, physics world clock | Fixed-step accumulator, control counters, pace-scaled simulation, existing hitstop gating | Name time domains explicitly before adding statuses; no new global early returns or extra integration gates |
| Art engine; `src/harmony.js`, `src/art.js`, equipment/hero-art compatibility facades | Shared visual performance/material/mounts; some broad material precedence | Evolve resolver behind stable facades. Fix per-surface construction without changing combat through a drawing function |
| `src/renderer.js`, `src/main.js`, `src/render-budget.js`, `src/bake.js`, `src/uber-postfx.js` | Scene event consumption, caches, effects, presentation lifecycle | One budget owner covers migrated legacy emitters as well as new ones; do not change unrelated camera/scenery logic |
| `src/power-readout.js`, catalogue/shop UI/demo, Pointer/Radar/trajectory rendering | Receipts, preview and user-facing information | Derive copy/geometry from authoritative descriptors. Invalid preview actions cannot mutate a live run or wallet |
| `src/shop-wallet.js`, `src/equipment.js` persistence/purchase helpers | Credits, owned IDs, equipment/presets | No schema change required for derived harmony. Purchase remains a single validated transaction; preview is never a purchase |
| `src/audio.js`, UI icon/interaction paths | Accepted action sounds and controls | One bounded phrase per event group; central mute/disposal ownership |

Names of new helpers/files below are **proposed**, not statements that those files exist. Prefer a small pure helper plus a narrow adapter over invasive extraction of `run.js` or the art monolith in a feature chunk.

## B2. Layered dependency graph

```text
catalogue + normalized owned equipment + released feature policy
          ↓
static part rules + selected sword family + source eligibility definitions
          ↓
launch snapshot / attack geometry / clocks / conditional modifier evaluation
          ↓
existing run + physics + custom combat commit accepted results once
          ↓
immutable accepted event + live authoritative status/readiness view
          ↓
construction/material resolver + one action/event compositor
          ↓
Canvas2D / optional existing post / UI / audio
```

Pointer/trajectory consume the same launch solver without committing a shot. Radar consumes actual supported state, not the ornamental scene. The compositor never calls `cut`, awards credits, advances a charge or writes velocity.

Suggested small seams:
- **Profile helper:** pure resolution/provenance, used by run/aim/preview. Do not cache conditional health/power/range forever at equip time.
- **Source policy helper:** explicit trigger/proc eligibility, target selection and caps; unknown source defaults to no equipment proc eligibility.
- **Status helper:** bounded per-target state, deadlines and strongest-local-status selection; no renderer timers.
- **Presentation descriptor helper:** immutable static construction plus cheap live parameters. Event consumption tracked in per-scene state, never inside frozen descriptors.

Static cache key includes equipment IDs, selected family, shipped-rule revision and detail/material policy. World tint/detail variants invalidate only their own cached art. Simulation snapshots must not include viewport/DPR/quality. Never put mutable run objects in a globally reused preview cache.

## B3. Time-domain ledger — remove ambiguity before coding

Current code mixes fixed run counters, pace-scaled physics/substeps and presentation ages. `src/clock.js` limits catch-up to six fixed steps; `run.js` has an existing stopped-physics branch while effect/control ages keep progressing. This plan **does not add skipped `stepPhysics` calls or expand that stop behavior**. Preserve current behavior first, then test every new timer at those boundaries.

| Domain | Target ownership | Examples / required tests |
| --- | --- | --- |
| Control step | One call to the active run's fixed update, only while its lifecycle permits | Input holding, legacy resource rates/counters remain unchanged until explicitly migrated; no dependence on RAF count |
| World simulation delta | Existing world/pace progress, independent of a target-local modifier | New burn/fault/replay deadlines, status expiry/immunity, source cooldown/charge expiry use this domain; aim pace may slow world progression, a frozen target may not slow these deadlines |
| Target locomotion delta | Base world/substep delta × strongest permitted movement factor | Fang freeze0, heavy cold.7, Time.8; no products; no divide-by-zero velocity when frozen |
| Target initiation/tell delta | Separately selected factor/gate by target state | Frost may freeze eligible Fang windup; Time scales supported tell; Hypno defers new initiation only. Heavy cold does not freeze tell |
| Hazard delta | World/substep delta | Already emitted needle/ring/zone continues even if owner freezes/dies as its existing lifecycle specifies |
| Presentation age | Accepted event age + optional render interpolation | Harmless accents expire ≤250ms of active presentation time, no power mutates when a tween completes; hidden/pause/resume has no queued celebration debt |

New gameplay “ticks” in this blueprint mean nominal60Hz **world simulation units**, unless a card explicitly retains a legacy clock. Capture before/after world time or pass the existing integrated delta; do not increment a world deadline once per physics substep *and* once per outer run tick. Do not use `Date.now`, `setTimeout` or frame count for status damage. Test fractions such as .1/.55/.8 world progress and threshold-crossing steps.

When a world deadline is crossed, process each due event once, in stable order; disposal/target death cancels owned deadlines. Tab-hidden/paused time is not simulated on resume. Target reset/ID reuse gets a generation key so an old burn cannot attach to a new enemy with the same visible ID.

## B4. Combined geometry and the Laser conflict — explicit target decision

**One authoritative attack profile** records base dimensions, family values, current temporary upgrades, source-specific part modifiers, conditional geometry, obstruction and active gates. Collision, aim, icons/demos and live drawing read that result. Family replaces base family parameters; it is not multiplied by a second generic family profile. Existing temporary upgrades apply once.

- Width contributions carry units, condition, source and cap policy. Ink's proposed1.35 limit is measured relative to the resolved unmodified sword width; it is not a cap on the player's hurtbox or a reason to strip another unrelated mechanic. Before the width slice ships, one tested helper must encode the full chosen order for Viper, Samurai horizontal band, Magnet distance band, Sniper power, Slash and current temporary upgrades.
- Keep absolute resolved geometry and a provenance list; do not ask art to re-derive multiplication order from IDs. Conditional near-width is evaluated per target/contact distance; preview shows its spatial band, not an everywhere-wide corridor.
- Ray/sweep queries use actual enemy shapes and static obstruction, not radius-only decorative contact. High speed requires swept geometry; don't miss hits by sampling just the endpoint.

**Chosen refinement of the older Laser proposal:** six ticks is the **base thrust gate**, not an unconditional hard cap that deletes Ghost/Reaper benefits. Proposed combined gate:

`laserGate = min(resolvedPrimaryWindow, max(1, 6 + familyTickDelta + retainedPartBladeDelta + liveUpgradeBladeDelta))`

Only currently shipped, explicitly retained extension sources enter those deltas, exactly once. Remove Laser's old generic+3 when its replacement ships. Ghost's+6 remains; Glacier's+10 family ticks remain; temporary blade upgrades remain once. For example, without other modifiers, Standard Laser gets6, Ghost Laser12, Glacier Laser16. Negative family ticks shorten the gate, never below1; a shorter primary window always wins. Family `ticks` already containing live upgrades must be decomposed or used without adding that upgrade again.

This is an **intentional combined-profile design refinement**, superseding earlier wording that every Laser must end at six ticks. Range/width/obstruction costs still apply. The feature cannot ship until fixtures verify the formula against the existing base window, actual live upgrades and Ghost/Glacier/Storm/rapier variants. No separate harmless curved sword continues to damage behind the line.

A progress value uses recorded start/initial duration and its correct gate, not `1-min(1,remaining/12)`. Age0 must remain observable; multiple contacts/chain extension cannot rewind a finished visual or reactivate a closed Laser gate unless a separately specified new attack starts.

## B5. Source and transaction contract

Replace ambiguous boolean combinations incrementally with explicit **source kinds**, while keeping a compatibility adapter until all callers migrate. Proposed fields:

`runId, shotId, sourceId, parentSourceId, sourceKind, targetId/generation, eventId, tick, acceptedOutcome, geometryRef, position, normal, incomingVelocity, hpBefore/After, resourcesBefore/After, modifierContributions`

Source kinds distinguish direct primary, shear/legacy special source, Prism needle, Coil/Volt relay, sword replay/pulse, core blade, Dash replay/field/burn, fault, foil and pixel fragment. Harmless particles have **no combat source**.

Per-contact transaction:
1. Validate lifecycle, alive/eligible target, source phase, line of sight/geometry, immunity and existing shot/armor-grace rules.
2. Reserve accepted-source/target identity before invoking any child source; reject duplicates deterministically.
3. Evaluate actual modifiers and resolve capped damage/recoil/status outcome without drawing.
4. Commit hp/state once. Commit a kill only on an alive→dead transition; chain/score/credits ownership remains in the existing reward authority.
5. Apply eligible resource/charge changes in declared source order, clamp once, record marginal contributions; no overflow escrow.
6. Admit legal child sources using explicit policy. They cannot re-enter the primary trigger pipeline merely because their contact used the same helper.
7. Emit a result for UI/visual/audio consumers. One consumer failing to paint cannot undo/duplicate damage or a purchase.

Do not rewrite the entire combat transaction in one chunk. First shadow-record source identity/outcomes around current `cut`; assert unchanged results. Then move one source type at a time behind the explicit adapter. Never call both old and new `cut` paths for one accepted source.

Stable ordering is simulation tick → shot/source sequence → target-distance criterion → stable target ID. Sorting a temporary candidate list may not mutate the combat map's gameplay iteration order. Random decorative choices use a separate seeded/hash stream, never consume gameplay RNG.

## B6. Saturation: cap eligibility before promising a proc

Current source arrays have limits and some eviction paths (`swordFx` removes oldest beyond3; equipment echoes shift at the limit). A visual-only refactor must preserve baseline source behavior. A mechanics slice must explicitly decide admission, then eliminate silent eviction of an already accepted delayed attack.

Target policy: **reserve a source slot before spending/accepting that activation**. Pending/active accepted sources finish; cosmetics never evict them. A saturated source is not currently eligible, displays its capped state and cannot consume a stored charge. A later eligible contact/launch can try again under that source's rule; there is no automatic delayed payout queue. Trigger-only sources without stored charge simply require available admission capacity as part of their published trigger condition. This is a deliberate mechanics change from any legacy eviction and needs its own approval/test fixture before enabling.

Keep protected sources bounded by declared gameplay caps/target caps/lifetimes; “protected” never means unlimited. Two-Echo/three-Echo saturation must be tested under rapid legal launches before release. Reject a combination that cannot keep its promises legibly rather than hiding harmful sources.

## B7. Migration, ownership and fallback

- Feature activation is a **single build/run policy**, not independent UI/art/combat booleans. A work order ships mechanics, readout, preview and presentation together. Default disabled until its gate passes.
- Snapshot the released policy and equipment at run creation. Shop hover cannot mutate it. No live swapping is required by this plan; future swaps need explicit charge-transfer rules first.
- A helper can shadow-compute a candidate profile for logs without committing damage, RNG, allocations on every draw, wallet state or duplicate events.
- Fallback for an invalid cosmetic descriptor is clean baseline art plus a visible development diagnostic; do not silently use baseline damage for an invalid gameplay profile. Validate gameplay profiles at run start and prevent enabling a broken feature before a run can begin.
- Never persist ephemeral charges, event queues, descriptors or feature flags in the equipment save. Existing version1 parsing/normalization remains authoritative. Test corrupted/unknown/unowned IDs and legacy presets.
- Rollback is a revert/disabled build feature at a run boundary, not a live mid-shot branch change. It must not remove purchased IDs, refund/spend credits again or replay a discovery toast. A new run rebuilds transient state from retained ownership.


## B8. Concrete composition decisions and invariants to test

### Geometry normalization

The current `sweepGeometry` couples half-width to reach and has a separate broad close-radius tolerance. Simply drawing a narrower laser over that tolerance could still hit a target far off the visible line. Simply multiplying reach twice could also widen a supposedly narrow Katana. Treat these as **combat changes**, not just art fixes.

Target solver for redesigned profiles:
1. Obtain reference absolute span/half-width from the existing family-only geometry. This preserves the selected sword's baseline geometry, including its existing reach/width relationship.
2. Apply new reach multipliers to span, not implicitly to half-width again. Katana1.15 or Laser1.25 versus Comic.9; positive new part-reach gain caps at1.35 relative to that family reference. Existing temporary reach upgrade is accounted once in its established category, not accidentally capped away.
3. New positive corridor gains (Ink1.12, Comic1.20, eligible Samurai1.20, near-band Magnet1.20) form a product capped at1.35. Apply independent narrowing factors afterwards: Viper.85, Ember.90, Volt.85, eligible Sniper.90, Katana.85 or Laser.65. A narrowing tradeoff cannot be canceled by capping the total after the reduction. Existing temporary width upgrade stays separately accounted once.
4. Record marginal gains in stable order: head → core → Dash → Slash; that affects explanation at a cap, not damage results dependent on equip order. All positive gains participate before negatives. A capped-away gain is shown as capped, not faked by thicker art.
5. Family reference/conditional evaluation does not change the player's square collider. Laser's maximum two primary victims is **per shot/thrust**, not reset every tick. Sort by along-ray distance; surviving eligible armor/static solid stops contacts behind it for that tick. A new tick may not reset the two-victim ledger.
6. Redesigned narrow profiles use the explicit resolved near-contact region, not an invisible legacy radial fallback. Preserve cut-immunity/armor-grace safety, not accidental extra coverage. Default/Razor legacy geometry must remain baseline-equivalent until its deliberate geometry adapter ships. Golden fixtures must document any intended near-contact difference for redesigned profiles.

This normalized solver is the target for the redesign, not a claim that current collision already behaves this way. Before enabling it, assert known reference dimensions numerically and compare them against actual shape queries. Don't update expected screenshots to hide changed hit coverage.

### Damage and resource order

- First retain current ordinary/Drive/shear/boss base logic through an adapter; then apply eligible new nonboss equipment plate contributions under the+2 extra-plate limit. Legacy sword/temporary armor contributions remain a separately named term, with exact fixtures. Never turn a secondary into a Drive primary just by passing a flag.
- A “first eligible” plate perk is consumed when its eligible armor contact is committed even if its marginal damage is zero due to the shared cap; report **cap-limited**, not a promised unused extra plate. Explicit boss exclusions do not consume Foundry/Sniper eligibility. Foundry's charge expires normally. This resolves what happens at the cap instead of leaving it to call order.
- Stable primary-kill resource phase: update actual primary-chain eligibility/counts → process existing earned base return → Wings if its separate wall event is accepted → Blaze on true Drive transition → Spectrum completion. Clamp at capacity on each committed contribution and record marginal delta. No suppressed grant becomes a future payout; Spectrum completion starts its cooldown even when EDGE is full. No UI tween triggers a resource grant.
- A simultaneous wall/kill is ordered by actual simulation event sequence, not by rendering order. Tests cover both valid sequences with no overflow. Use actual max health/EDGE when repairing/refilling; Glass never heals above1, Riot never refills above2.

### Bank and displacement combination

- Measure contact normal/tangent from the real earned bank, not the tail or splash pose. Apply existing base/kinetic/Hyper rebound rules first using their current exemption/ceiling ownership.
- New eligible requests use one baseline outgoing vector `v0`. Tokyo and Thrusters request scalar gains; Tide requests tangent-only gain. Sum their eligible additive vector requests into `delta`; choose a common scale `lambda` in [0,1] so `|v0 + lambda*delta|` is at most `min(1.12*|v0|, max(|v0|, applicableLegalCeiling))`. Solve the bounded magnitude constraint deterministically (quadratic or fixed bounded monotone solve for these nonnegative aligned requests); do not approximate the combined cap by summing individual speed increases, which can undercount a vector combination. Record each source's scaled vector contribution. Zero-speed/unearned contacts generate no gain. The cap cannot strip baseline earned faster momentum. Never sequentially compound the gains three times.
- Preserve source-specific per-shot/cooldown eligibility. Accepted contribution can be zero at a ceiling; don't draw full exhaust if no thrust was applied. A negative/zero computed gain cannot become a positive one through normalization.
- Target displacement from Tide/Comic/Void/Grav uses one collision-aware helper with target radius/solids/leash and a total per-source displacement ledger. Do not clamp individual x/y separately in a way that permits diagonal excess. Combining sources preserves each budget and uses stable source order; it does not increase radius or bypass heavy/boss immunity.
- Compute stored Segmented momentum from **actual forward loss attributable to armor**, not total speed lost to walls/friction/ceiling. Recoil-reduction applies strongest eligible source to the shove component. Record unmodified incoming, actual shove and collision-safe final vector for tests.

### Status combination

Maintain independent movement factor, tell-progression factor, initiation gate and world expiry. Do not pass `dt=0` through all of `slasher.move`: it divides displacement by dt and owns nonmovement state too. Freeze only declared movement/tell operations; update sensor position and finite velocity safely with the base delta. Keep existing threat-slot/global cadence and emitted hazards on their baseline world timing.

Cold immunity starts on actual thaw/expiry and is not slowed by Time. Daze never rewinds a tell. Death/despawn/dispose removes all owned status references. Phase gate suppresses the particular needle/player pair; other defenses retain current precedence. Never set a general invulnerability flag to approximate a narrow needle phase.


## B9. Explicit source eligibility matrix

This is the **target policy for redesigned equipment procs**. Existing special shear/kinetic/temporary-upgrade semantics are characterized separately; do not silently classify them as ordinary primary or rewrite their established rewards in this redesign.

| Source | Normal eligible damage / death accounting | Equipment primary chain / counters / refunds | May create equipment child sources? | Geometry / dedup owner |
| --- | --- | --- | --- | --- |
| Direct legal primary blade/thrust | Existing authoritative damage and once-only death/reward path | Yes, only the accepted direct contact/kill specified by each card | Only named first-contact/first-kill/plate-removal triggers, caps and cooldowns | Shot+target ledger, armor grace and exact resolved shape; Laser max2 victims |
| Prism needle | Current eligible target/damage policy retained until deliberately revised | No new primary eligibility | No Coil/Volt/burn/fault/foil/pixel/echo chain | Projectile source+target, solid/swept/lifetime policy |
| Coil or Volt relay | One normal accepted secondary unit per allowed distinct relay victim | No | No | Shared conduction ledger, sight/range, child source ID |
| Sword delayed lane | Existing variant damage/phase/cap | No | No | Original immutable lane, source target set, actual delay |
| Sword earned pulse | Existing variant damage/phase/cap | No; cannot charge itself | No | Charged source admission, true lane and target cap |
| Echo core stationary blade | Existing eligible secondary hit policy | No | No | Recorded position,30-world-tick target ledger |
| Echo Dash replay | Eligible secondary unit under card | No | No | Clipped stored path, source hit-once, cap2 |
| Ember/Lava burn | Eligible scheduled secondary damage, attributed once | No | No; cannot re-ignite or create other equipment procs | Target generation+status source+due-tick index |
| Void field pulse | Eligible secondary unit only within actual core at expiry | No | No | Field source, expiry fired flag, actual pulse geometry |
| Glitch fault | One eligible delayed secondary armor chip | No | No | Attached target generation, one accepted mark, due tick |
| Confetti flechette | Eligible one-unit secondary hit | No | No | Projectile/contact terminal state, burst cap2 distinct victims |
| Pixel fragment | Eligible one-unit secondary hit | No | No | Projectile/contact terminal state, no secondary shatter |
| Harmless particle, fitted Spark route, family stitch, UI tween | Never | Never | Never | Presentation event key only; no combat ID |

Secondary kills still pass through the existing legitimate once-only kill/score/wave-removal authority; **not granting primary equipment procs does not mean deleting legitimate rewards**. Tests distinguish equipment primary-chain eligibility from legacy global kill/reward behavior. A wave clear caused by a legal secondary source must still resolve exactly once. Do not casually change challenge/discovery eligibility while refactoring the equipment source adapter.

### Audit outcome versus activation

Record request, admission, acceptance and actual marginal result separately. Examples: source full (not admitted); boss resistant (not accepted for that status); plate bonus capped (eligible contact accepted but zero marginal bonus); target dead (deadline canceled). Only real outcomes play success cues. This vocabulary prevents renderer guesses and makes failure cases reproducible.


# C. Complete catalogue work orders

Every card below is self-contained for its item and combines the latest retained design with an implementation note. **B4 governs Laser extensions; E governs all harmless particle/lifetime budgets.** Attack storyboards retain their material/motion direction, but old longer-lived decoration and larger emission counts have been replaced by the small per-item allowance printed in each attack card.

Implementation-note abbreviations:
- **RULE:** `equipment.js` / `part-perks.js` and pure profile helper.
- **RUN:** launch/cut/resource/bank paths in `run.js` and `equipment-combat.js`.
- **AI:** `slasher.js` custom target movement/initiation/tells; hazards remain separate.
- **MOVE:** `physics.js` / `movement-model.js`, using one existing legal movement hook.
- **ART:** standalone art engine plus existing compatibility entry points/event compositor.
- **INFO:** aim/pointer/radar/trajectory and authoritative preview/readout adapters.
- **SAVE/UI:** existing wallet/equipment/customize/main interaction authority.

Each work order's listed negative tests supplement, not replace, the global gates in Part F.


<a id="item-none"></a>

## C01. Bare Head — `none` · **Keep: clean baseline**

- **See / infer:** exposed folded brow, no hardware. This is a finished neutral choice, not a missing upgrade.
- **Power / physics:** no head modifier; normal movement/contact rules. Do not invent a hidden free-item weakness.
- **Phrase:** remove old attachment locally → brow settles in 100ms → face is still. Launch uses the shared body pose, no extra head bounce.
- **Juice:** 0 head particles; one soft equip click. No aura, glow ring or idle emission.
- **Proof:** switching from Viper/Crown removes their speed/width effects on the next run. Baseline remains legible beside highly upgraded equipment.

### Icon and receipt

- **Unique icon construction:** Open folded brow with empty head socket; neutral baseline dot, no false shield.
- **Receipt:** show the actual benefit/condition/cost from this card and the resolved policy; remove the replaced generic claim atomically. Icon never supplies the only status/control information.

### Harmony boundary

- **Outward contribution:** Clears head sockets/effects; preserves uncluttered weapon/core read
- **Protect:** No stealth stat, no reduction in free input clarity

### Implementation and regression gate

- **Hook / migration:** RULE/ART: retain default normalization and clean brow socket; remove old head-specific state only on creation of the next run, not on a live hover. No new perk.
- **Must prove:** Compare default hp/speed/geometry against baseline; switching preview from Coil/Crown must remove their hardware without changing live rules.

<a id="item-halo"></a>

## C02. Gold Halo — `halo` · **Keep: supported fall**

- **See / infer:** a floating ring should support/suspend, not damage nearby targets.
- **Power:** current 15% lighter gravity while aiming and falling. No lift, hover or extra horizontal steering.
- **Physics:** actual eligible falling acceleration changes; rising/grounded movement does not. Release restores normal acceleration immediately.
- **Phrase:** tilted ring levels as support begins → lower crescent stays steady → tilt returns on release, within 140ms. Never orbit the whole Cube.
- **Juice:** 0 routine particles; at most 2 upward motes on the first qualifying support entry of a shot. No constant falling glitter.
- **Proof:** equal-input descent comparison; rising/empty-FOCUS cases show no magical suspension.

### Icon and receipt

- **Unique icon construction:** Tilted ring over down-arrow support notch; distinct from Orbit's incomplete circular pointer.
- **Receipt:** show the actual benefit/condition/cost from this card and the resolved policy; remove the replaced generic claim atomically. Icon never supplies the only status/control information.

### Harmony boundary

- **Outward contribution:** Head socket aligns with core inset; cloth/embers inherit actual changed body velocity
- **Protect:** No world time slow or new particle gravity outside real motion

### Implementation and regression gate

- **Hook / migration:** RULE/MOVE: keep existing supported-fall multiplier at its current gravity hook. ART derives ring leveling from true support/fall state and common head socket; core route shares the same event.
- **Must prove:** Falling aim versus ascending/ordinary flight; Time does not multiply gravity again; no stacked rings or extra physics write.

<a id="item-neko"></a>

## C03. Cyber Ears — `neko` · **Replace chain grace: directional hearing**

- **See / infer:** pink inset triangular receivers should detect approaching danger. +12 chain ticks is not guessable from ears.
- **New power:** while aiming, indicate **one closest closing eligible hostile within 180 units**, based only on current motion/state. No future AI prediction. Visible short bearing marker; ordinary enemy tells remain free.
- **Physics:** no auto-turn, target snap, slowed enemy or player force. Information is the upgrade.
- **Phrase:** ears pivot independently toward the accepted bearing → one 80ms perk when the threat becomes relevant → hold, then relax when it leaves. Switching targets has a small visual hysteresis, not stale gameplay data.
- **Juice:** 0 particles. At most one quiet receiver tick per new stable threat, rate-limited.
- **Proof:** approaching versus receding enemy; blocker/sensor-eligibility rules applied honestly. No indicator outside range, no arrow pretending a target behind a wall is hittable.

### Icon and receipt

- **Unique icon construction:** Two triangular receivers around a single bearing chevron; not a cat face promising a pet.
- **Receipt:** show the actual benefit/condition/cost from this card and the resolved policy; remove the replaced generic claim atomically. Icon never supplies the only status/control information.

### Harmony boundary

- **Outward contribution:** Eye gaze may acknowledge that bearing when no active input takes priority; matching tiny Radar bearing style if equipped
- **Protect:** Cannot turn aim, invent map contacts or add a detection aura

### Implementation and regression gate

- **Hook / migration:** RULE/AI/RUN: atomically replace its legacy chain-grace mapping with the hearing selector/bearing state. Query eligible threats deterministically without changing AI or retargeting input; INFO and ear ART consume one result.
- **Must prove:** Front/back bearings, no eligible threat, range/blocker policy from card; remove exactly12 old grace ticks; hearing cannot stop an already active attack.

<a id="item-viper"></a>

## C04. Viper Horns — `viper` · **Keep: fast narrow strike**

- **See / infer:** swept paired red horns look streamlined and piercing.
- **Power:** current +20% launch speed, −15% cut width, existing active-reach compensation.
- **Physics:** preserve live speed ceiling, earned momentum and collision sweep. Volt cannot multiply this into an uncontrolled second boost.
- **Phrase:** horn inner edges tighten during aim → short needle-like launch highlight → fade by 120ms; actual horns stay rigidly attached.
- **Juice:** at most 2 short rear pin-sparks on committed launch; no additional trail if Dash already owns travel.
- **Proof:** faster arrival, narrower edge miss and unchanged compensation logic. Art must not draw a broad attack fan.

### Icon and receipt

- **Unique icon construction:** Twin swept narrow horns and forward speed gap; narrow corridor notch signals commitment.
- **Receipt:** show the actual benefit/condition/cost from this card and the resolved policy; remove the replaced generic claim atomically. Icon never supplies the only status/control information.

### Harmony boundary

- **Outward contribution:** Shared release stretches along actual velocity; tail tension and world-spaced particle gaps reflect real speed
- **Protect:** No hidden second speed multiplier or wider Slash

### Implementation and regression gate

- **Hook / migration:** RULE/MOVE: retain current speed/width tradeoff in the launch/profile solver. ART reads resolved velocity for horn alignment, spacing and Jet Viper; no second multiplier in a recipe.
- **Must prove:** Same input produces current speed and narrower width; Volt and Hyper ceilings; Viper+Thrusters grants no extra unlisted acceleration.

<a id="item-oni"></a>

## C05. Broken Oni — `oni` · **Replace last-health score: last-stand edge**

- **See / infer:** broken horn/cracked mask suggests dangerous retaliation, not a gold-income item.
- **New power:** at exactly **1 health**, the first eligible primary armored contact per shot gains **+1 plate damage**, excluding monolith/Landlord and protected targets. Replace +50% score. Shared total extra-plate cap applies.
- **Physics:** ordinary speed, recoil and health; no lifesteal, shield or death prevention.
- **Phrase:** crack fills steadily at one health → accepted contact sends a short crack-to-horn pulse → horn goes quiet. No continuous red flashing.
- **Juice:** 0 idle; 2 ceramic chips only when the bonus really removes a plate. Short cracked-ceramic answer under the main Slash sound.
- **Proof:** compare health 2 versus 1, boss resistance and ordinary Fang. Preserve challenge unlock; Glass risk must remain real.

### Icon and receipt

- **Unique icon construction:** One broken horn and a single low-health fracture; no coin mark.
- **Receipt:** show the actual benefit/condition/cost from this card and the resolved policy; remove the replaced generic claim atomically. Icon never supplies the only status/control information.

### Harmony boundary

- **Outward contribution:** Core-to-head seam routes the accepted last-stand event; shared plate mark shows capped bonus
- **Protect:** No red flame coat, free heal or duplicate damage cue

### Implementation and regression gate

- **Hook / migration:** RULE/RUN: replace last-hull score multiplier with eligible low-health primary plate contribution. Evaluate hp at accepted contact; tag contribution for shared extra-plate cap and one head seam.
- **Must prove:** Hp1 versus hp2, surviving eligible armor versus boss/secondary, repeated target contact; no1.5 score residue and no duplicate crack burst.

<a id="item-crown"></a>

## C06. Cube Crown — `crown` · **Keep: weight behind an armor hit**

- **See / infer:** broad gold crown and heavy central jewel imply authority/weight.
- **Power:** current two-plate eligible hits with −8% launch speed. No universal double damage/boss bypass.
- **Physics:** preserve real armor recoil, speed penalty and remaining-plate limit. Cosmetic crown squash does not increase Matter mass.
- **Phrase:** jewel compresses on armor contact → two local plate notches separate in the combined contact mark → crown seats within 160ms.
- **Juice:** 0 launch spray; 2 metal chips only if Slash has spare contact budget. One low latch, not a royal fanfare.
- **Proof:** two plates versus one remaining; speed difference visible. If Oni/Glass/Slash also add plate damage, show one capped transaction, not multiple explosions.

### Icon and receipt

- **Unique icon construction:** Broad three-point crown over one plate notch; weight base differentiates Halo.
- **Receipt:** show the actual benefit/condition/cost from this card and the resolved policy; remove the replaced generic claim atomically. Icon never supplies the only status/control information.

### Harmony boundary

- **Outward contribution:** Shell mount becomes load-bearing visually; one shared metallic contact answer
- **Protect:** Cannot add player mass or repaint every particle gold

### Implementation and regression gate

- **Hook / migration:** RULE/RUN/ART: preserve current speed cost and ordinary armor bonus; route extra plate through capped contribution ledger when that slice enables. Keep one fitted crown collar and aggregate contact phrase.
- **Must prove:** Old baseline until cap slice; afterwards combined Crown/Glass/Sniper/Foundry cap, boss exceptions, unchanged weight drawing cannot alter Matter mass.

<a id="item-samurai"></a>

## C07. Samurai Crest — `samurai` · **Keep: horizontal discipline**

- **See / infer:** outward gold tips should explain lateral cutting width.
- **Power:** existing +20% width within the valid near-horizontal angle band.
- **Physics:** no angle snapping or steering. One resolved envelope combines head/sword/Dash/Slash width.
- **Phrase:** crest tips align with the level band during aim → one flat lateral edge accent on valid release → neutral by 120ms. Outside the band stays quiet, no failure shake.
- **Juice:** 0 particles; two short graphic strokes count as the crest cue, not another full slash. Dry sheath click on eligibility entry, heavily rate-limited.
- **Proof:** just-inside/just-outside angle, both horizontal directions, combined width cap. The visual band and real condition use the same rule.

### Icon and receipt

- **Unique icon construction:** Crest tips bracketing a horizontal band; angle eligibility is visible.
- **Receipt:** show the actual benefit/condition/cost from this card and the resolved policy; remove the replaced generic claim atomically. Icon never supplies the only status/control information.

### Harmony boundary

- **Outward contribution:** Pointer corridor/weapon leading edge show actual resolved eligible width
- **Protect:** No angle snap, bracket-role recolor or decorative fake coverage

### Implementation and regression gate

- **Hook / migration:** RULE/RUN/INFO: keep existing horizontal eligibility helper and feed its resolved geometry to collision/aim/weapon edge. Head tips are a pose response, not direction correction.
- **Must prove:** Angles just inside/on/outside25 degrees, both horizontal directions, diagonal Sniper/Laser; same eligibility in corridor and collision.

<a id="item-coil"></a>

## C08. Lightning Coil — `coil` · **Keep: one real conductor**

- **See / infer:** two terminals joined by electricity should relay electricity.
- **Power:** current one-neighbor direct-cut zap within 160, nonrecursive. Share conduction deduplication with Volt.
- **Physics:** secondary target really loses its legal damage unit; no player acceleration or decorative-arc damage.
- **Phrase:** terminal pinch → one connected arc to the accepted target for 70–100ms → bridge returns to a dim steady state.
- **Juice:** arc plus **0–2** pin-sparks, never a radial storm. No idle spark emission.
- **Proof:** neighbor inside/outside range, no neighbor, shared Coil/Volt target, target removed before display. Never draw a successful hit without accepted damage.

### Icon and receipt

- **Unique icon construction:** Two head terminals linked to one external node; real relay, no continuous bolt aura.
- **Receipt:** show the actual benefit/condition/cost from this card and the resolved policy; remove the replaced generic claim atomically. Icon never supplies the only status/control information.

### Harmony boundary

- **Outward contribution:** Conductive fitted routes connect core/head; secondary arc uses true victims and shared Volt source limits
- **Protect:** No relay from decorative sparks or every Prism needle by default

### Implementation and regression gate

- **Hook / migration:** RUN: preserve current relay eligibility through an explicit Coil source adapter; integrate Volt's shared distinct-victim conduction ledger. ART draws only committed links and one fitted source route.
- **Must prove:** No neighbor, sight/range/tie, Coil+Volt two distinct max victims, no relay-on-relay or duplicate armor unit; count direct pulse charge unchanged.

<a id="item-beacon"></a>

## C09. Danger Beacon — `beacon` · **Keep: actual early warning**

- **See / infer:** visible amber lamp housing and cone are a warning instrument.
- **Power:** current Fang-windup warning. Unlike Ears, this is actual tell-state warning, not just a short-range closing bearing while aiming.
- **Physics:** no delay added to enemy attacks and no automatic dodge. Standard telegraphs stay unchanged.
- **Phrase:** housing turns toward real windup → one short amber sweep → steady small tell marker until canceled/resolved. No revolving disco cone.
- **Juice:** 0 particles. One relay click for a new warning group, not one siren per enemy.
- **Proof:** canceled tell clears instantly; offscreen-warning range is not enemy-art culling range. Oracle Radar gets a consistent shared tell symbol, not a duplicate huge arrow.

### Icon and receipt

- **Unique icon construction:** Small lamp facing an open tell arc; no healing cross.
- **Receipt:** show the actual benefit/condition/cost from this card and the resolved policy; remove the replaced generic claim atomically. Icon never supplies the only status/control information.

### Harmony boundary

- **Outward contribution:** Same tell icon/phase as Radar; input gaze wins over decorative head direction
- **Protect:** No delayed enemy attack, duplicate large warning or global amber wash

### Implementation and regression gate

- **Hook / migration:** INFO/AI/ART: observe actual accepted tell state with current early-warning rule; share symbol/bearing with Radar. No new enemy timers or decorative prediction.
- **Must prove:** Start/expire/interrupted/frozen tells, offscreen warnings under current policy; lamp/Radar agree and no idle alarm spam.

<a id="item-ninja"></a>

## C10. Ninja Slits — `ninja` · **Keep: clear baseline**

- **See / infer:** sharp open slits communicate intention and alertness.
- **Power / physics:** standard sight/input, no modifier. Free eyes keep full power/cancel readability.
- **Phrase:** one blink when equipped → gaze follows intended action → brief launch compression. Suppress decorative blinks when they would hide the release cue.
- **Juice:** 0 particles, 0 gaze sounds. Equip has one soft tick.
- **Proof:** readable on every shell/world and at the smallest hero size; no change in aim/body motion compared with the same input on paid eyes.

### Icon and receipt

- **Unique icon construction:** Two clean pointed eye slits with open central gap; baseline sight.
- **Receipt:** show the actual benefit/condition/cost from this card and the resolved policy; remove the replaced generic claim atomically. Icon never supplies the only status/control information.

### Harmony boundary

- **Outward contribution:** Keeps face as stable focal point; all energy routing avoids eye cuts
- **Protect:** No extra shimmer required to look complete

### Implementation and regression gate

- **Hook / migration:** ART: keep face contour and shared action expression; no particles/perk to fill a card. Facial draw state uses balanced save/restore at every scale.
- **Must prove:** Default idle and action readability, canvas state unchanged, no hidden aim/resource bonus.

<a id="item-visor"></a>

## C11. Cyber Visor — `visor` · **Keep: immediate aim efficiency**

- **See / infer:** broad cyan glass calibrates targeting.
- **Power:** current −10% aim FOCUS drain, immediate and capped with other efficiency sources.
- **Physics:** world/player time and targeting stay unchanged; not auto-lock.
- **Phrase:** one scan aligns during aim entry in about 100ms → calibrated notch holds → clears on release. No constant scanning stripes.
- **Juice:** 0 particles; one quiet calibration tick on a meaningful aim entry, no per-frame audio.
- **Proof:** identical aim interval costs less FOCUS while the same trajectories unfold. Cap saturation is stated rather than shown as fictitious extra savings.

### Icon and receipt

- **Unique icon construction:** Single stable horizontal lens with one calibration tick; not Sniper's dot.
- **Receipt:** show the actual benefit/condition/cost from this card and the resolved policy; remove the replaced generic claim atomically. Icon never supplies the only status/control information.

### Harmony boundary

- **Outward contribution:** Core/pointer calibration notch can align on real aim entry; resource receipt aggregates
- **Protect:** No target lock, continuous mesh scan or extra time slowdown

### Implementation and regression gate

- **Hook / migration:** RULE/INFO/ART: retain10% efficiency contribution and cap; use true aim-entry/power state for one calibration sweep. Preview consumes a copy of the same profile.
- **Must prove:** Drain at cap and after release, no additional assistance call, no repeated sweep from held aim or pointer movement.

<a id="item-blaze"></a>

## C12. SSJ Blaze — `blaze` · **Replace drive score: ignition reserve**

- **See / infer:** gold-white flame-shaped eyes should awaken with Overdrive and supply an energetic release.
- **New power:** on actual **Overdrive entry**, return **one EDGE**, clamped to the current maximum, once per activation. Replace +8% drive score. No queued refund if already full, no timer extension.
- **Physics:** the returned EDGE permits a normal legal launch; it does not multiply velocity/damage or bypass depleted-input gates.
- **Phrase:** pale flame tips gather → brief white-hot eye opening at actual refund → settle into a steady hot shape during Drive.
- **Juice:** at most 2 short upward embers at entry; no target burn or idle flame shower. Shared EDGE cue replaces an extra fanfare.
- **Proof:** full-cap no-overfill, Riot's max 2 EDGE, simultaneous activation and retry. Ignition cannot feed itself through repeated visual events.

### Icon and receipt

- **Unique icon construction:** Flared eyelids around one filled reserve notch; ignition grant, not fire damage.
- **Receipt:** show the actual benefit/condition/cost from this card and the resolved policy; remove the replaced generic claim atomically. Icon never supplies the only status/control information.

### Harmony boundary

- **Outward contribution:** Reactor/EDGE response composes into one ignition; Dash retains its own material
- **Protect:** No Ember burn from eyes, continuous fire plume or extra Drive duration

### Implementation and regression gate

- **Hook / migration:** RULE/RUN: replace drive-only score mapping with once-per-real-Drive-entry EDGE reserve grant from card. Detect state transition, not every frame with drive>0; aggregate resource event.
- **Must prove:** Entry/continuation/exit/reentry, full EDGE, Riot capacity2 and secondary kills; no old8% drive score and no grant from preview or restart residue.

<a id="item-glitch"></a>

## C13. Glitch X-Eyes — `glitch` · **Keep: recovery reconstruction**

- **See / infer:** observed broken X/ring-like cyan/pink glyphs reconstruct between actions.
- **Power:** current +12% eligible passive FOCUS recovery.
- **Physics:** no teleport, body stutter or skipped frame. Resource changes remain continuous simulation-owned changes.
- **Phrase:** missing segments reseat once on recovery entry → steady completed glyph → separate slightly during aim. Never random jitter every frame.
- **Juice:** 0 routine particles; at most 2 pixels on equip, gone within 120ms. Short digital seat, no static-noise loop.
- **Proof:** actual faster recovery, none while recovery is ineligible; rapid cancel cannot mint FOCUS or replay noise.

### Icon and receipt

- **Unique icon construction:** Broken X eye seated into a recovery notch; distinct from Slash fault's parallel slit.
- **Receipt:** show the actual benefit/condition/cost from this card and the resolved policy; remove the replaced generic claim atomically. Icon never supplies the only status/control information.

### Harmony boundary

- **Outward contribution:** Hologram/Notched routes use the same recovery event with stepped line art instead of extra pixels
- **Protect:** No skipped physics/display frames, random hitbox jumps or FOCUS farming

### Implementation and regression gate

- **Hook / migration:** RULE/RUN/ART: retain12% eligible recovery, use existing nonaiming resource authority and shared40% cap. One recovery-entry seam participates with Notched/Orbit/Synth.
- **Must prove:** Held aim, full FOCUS, cap saturation and cancel spam; recovery never changes physics dt or emits per-frame pixels.

<a id="item-smug"></a>

## C14. Smug Half-Lid — `smug` · **Keep: unhurried chain composure**

- **See / infer:** relaxed half-lids imply breathing room, not destructive energy.
- **Power:** retain +12 chain ticks. This is one of the legitimate non-damage identities; do not force an attack onto an expression.
- **Physics:** no enemy stun/player speed change. The real chain timer extends.
- **Phrase:** one lid lifts after a qualifying kill → holds through a short calm response → settles; no universal spark effect. A small chain-notch receipt proves the timing.
- **Juice:** 0 particles, no laugh/voice cue; at most the shared aggregate chain click.
- **Proof:** baseline chain expires earlier in the demonstration; no new bonus when already at the build cap. Eyelid animation is actually authored, not merely promised in text.

### Icon and receipt

- **Unique icon construction:** One lowered lid over short chain handoff tick; calm continuation.
- **Receipt:** show the actual benefit/condition/cost from this card and the resolved policy; remove the replaced generic claim atomically. Icon never supplies the only status/control information.

### Harmony boundary

- **Outward contribution:** Chain notch shared with other grace sources, not multiple floating link effects
- **Protect:** No hidden stun, target taunt or unlisted damage

### Implementation and regression gate

- **Hook / migration:** RULE/RUN/ART: retain12 chain ticks under36 cap after eligible direct kill; eyelid and shared chain notch use the accepted extension result.
- **Must prove:** Primary versus secondary/zero-value cap contribution; no chain extension on a miss and no duplicate chain event from an expression.

<a id="item-hypno"></a>

## C15. Hypno Spiral — `hypno` · **Replace cheap aim: brief daze**

- **See / infer:** spirals directed at an enemy imply a bounded hypnosis effect, not generic resource efficiency.
- **New power:** after **18 continuous aim ticks**, daze one eligible Fang within **140** and clear static sight for **12 ticks**: defer initiation of a new attack. Existing rush/projectiles and movement continue. Per-target **90-tick immunity**; one target per hold. Replace −15% aim drain.
- **Physics:** this is a local AI initiation gate, not global slow time, mind-control steering or invulnerability.
- **Phrase:** spirals converge → one thin link reaches accepted target → a small spiral-notch marks real daze → clean release. No spinning screen.
- **Juice:** 0 particles; short low focus click once on acceptance, not on a resisted attempt.
- **Proof:** tell already started is not retroactively canceled, wall/range blocks it, boss resists, aim tap cannot trigger it. Freeze/Time conflicts use explicit status policy.

### Icon and receipt

- **Unique icon construction:** One spiral eye ending at an initiation-stop notch; no global clock.
- **Receipt:** show the actual benefit/condition/cost from this card and the resolved policy; remove the replaced generic claim atomically. Icon never supplies the only status/control information.

### Harmony boundary

- **Outward contribution:** Sensor tell display reflects the true deferred initiation; Time uses distinct clock glyph
- **Protect:** No global spiral overlay, continuous beam or extra AI control

### Implementation and regression gate

- **Hook / migration:** RULE/AI: remove15% aim efficiency and add card's held-aim one-target initiation defer with sight/range/cooldown. Store per-source target/generation; do not freeze existing tell/active rush.
- **Must prove:** Below hold threshold, target loss, blocked sight, boss, already-telling Fang, Time/Frost overlap; no old drain discount remains.

<a id="item-sniper"></a>

## C16. Sniper Dot — `sniper` · **Replace full-power score: precise first puncture**

- **See / infer:** actual red central sight should improve a committed accurate shot.
- **New power:** a shot released at authoritative power **≥0.9** gets **+1 plate on its first eligible nonboss primary armored contact**, with **−10% width for that shot**. Replace +10% score; extra-plate cap prevents multiplicative armor deletion.
- **Physics:** no homing, target snap or flight correction. The narrowness is real and visible; no reward from simply holding a full sight without a successful hit.
- **Phrase:** sight ticks converge with real power → solid dot at eligibility → one pin-like contact mark on accepted bonus.
- **Juice:** 0 launch particles; at most 1 bright pin-spark inside the shared Slash contact. One lock click, no alarm.
- **Proof:** below-threshold, off-axis miss, second victim and protected boss. Laser/Katana combinations resolve their geometry/plate limits once.

### Icon and receipt

- **Unique icon construction:** Central dot inside converging sight ticks and narrow corridor; precise full-power puncture.
- **Receipt:** show the actual benefit/condition/cost from this card and the resolved policy; remove the replaced generic claim atomically. Icon never supplies the only status/control information.

### Harmony boundary

- **Outward contribution:** Pointer/weapon share accurate eligibility and narrow envelope; primary plate accent merges
- **Protect:** No guaranteed hit, homing, extra beam or second geometry resolver

### Implementation and regression gate

- **Hook / migration:** RULE/RUN/INFO: replace10% full-power score with shot-snapshotted power>=.9 narrowness and first-eligible-armor contribution. Consume first eligibility only by declared target policy, never by a cosmetic contact.
- **Must prove:** Power .899/.9/1, second armored victim, boss exclusion, cap-limited damage, no homing and no residual score perk.

<a id="item-paper"></a>

## C17. Paper Ninja — `paper` · **Keep: folded neutral shell**

- **See / infer:** white folded faces, bold black perimeter. Paper should flex, not behave like armor plating.
- **Power / physics:** no shell modifier. No secret fire vulnerability or paid-tier accuracy difference; collision body stays the normal square.
- **Phrase:** faces fold into place over 180ms → one short crease compression on launch/contact → settle. Never physically rotate or resize the body.
- **Juice:** 0 ambient; up to 2 tiny paper fibers on a hard contact only if the Slash budget permits. No dripping ink, cloth confetti or persistent crease damage suggesting lost health.
- **Proof:** baseline fully usable; shape readable on Manga; no phantom collision changes during a fold.

### Icon and receipt

- **Unique icon construction:** Folded square corner and short crease; neutral material, no damage leaf.
- **Receipt:** show the actual benefit/condition/cost from this card and the resolved policy; remove the replaced generic claim atomically. Icon never supplies the only status/control information.

### Harmony boundary

- **Outward contribution:** Folded mounts on horns/nozzles/weapon; optional matte substrate fiber
- **Protect:** Attack-native fire/water/foil is not replaced by paper

### Implementation and regression gate

- **Hook / migration:** ART: default folded mounts and brief crease response; optional substrate fiber substitutes in contact budget. RULE stays neutral.
- **Must prove:** No player collider/material-force change; Fire stays embers, Confetti attacks stay filled foil, no idle fibers.

<a id="item-obsidian"></a>

## C18. Obsidian Stealth — `obsidian` · **Replace aerial score: quiet approach**

- **See / infer:** matte black inset facets suggest reduced detection rather than airborne money.
- **New power:** after **18 ticks at speed <6 while not aiming**, Quiet state reduces **new eligible Fang acquisition range to 75%** of normal. Ends immediately on aim, launch or damage. Existing tells/rushes/hazards, already-alert enemies and bosses are unaffected. Replace airborne +8% score.
- **Physics:** no invisibility, collision immunity, target teleport or canceling an ongoing attack. The player's movement remains normal; new acquisition is the only AI change.
- **Phrase:** inset seams close → steady subdued surface with a clear neutral outline → seams reopen as Quiet ends. Body stays visible, opacity never used as a fake dodge.
- **Juice:** 0 particles. One soft stone seat; no smoke cloud.
- **Proof:** comparison of new acquisition boundaries; already-alert Fang still pursues, close enemy still detects. No offscreen safety claim or idle auto-clear behavior.

### Icon and receipt

- **Unique icon construction:** Matte inset facet with closed quiet seam and visible outline; not invisible silhouette.
- **Receipt:** show the actual benefit/condition/cost from this card and the resolved policy; remove the replaced generic claim atomically. Icon never supplies the only status/control information.

### Harmony boundary

- **Outward contribution:** Recessed sockets, muted nonsemantic trim; sensor still displays real acquired threats
- **Protect:** No invisible player, dim danger, canceled tells or disappearing attacks

### Implementation and regression gate

- **Hook / migration:** RULE/AI/RUN: remove airborne score; track quiet hold and immediate exits; apply acquisition range only when an eligible unalert Fang tests NEW acquisition. Keep prior alert/tell state untouched.
- **Must prove:** 18-tick threshold, speed6 boundary, aim/launch/damage exits, close target, already-alert enemy and boss; no invisibility or aerial score residue.

<a id="item-hologram"></a>

## C19. Hologram Wire — `hologram` · **Replace efficiency: precision phase gate**

- **See / infer:** translucent cyan mesh should allow a narrowly defined object to pass through, not just reduce a meter.
- **New power:** during the **first 4 ticks of a legal launch**, phase through **one eligible hostile needle**, then start **120-tick recharge**. Replace −12% aim cost. Initial scope excludes beams, zones, rings, contact attacks, bosses' protected mechanics and tutorial hazards.
- **Physics:** only that needle/player hit pair is suppressed until clear; the needle continues normally. Player still collides with walls and enemies. No general invulnerability, teleport or deletion of all projectiles.
- **Phrase:** ready mesh has one closed calibration cell → launch opens that cell briefly → accepted needle passes through → cell stays dark until ready. Ordinary launch without interception does not falsely play a block.
- **Juice:** 0 travel particles; 2 cyan vertex motes on actual interception, 120ms maximum.
- **Proof:** correct timing/type, a second needle, a Fang rush and a wall. Show the limitation before purchase, not in a tiny tooltip.

### Icon and receipt

- **Unique icon construction:** Vertex cage with one open needle-pass cell; a single needle remains drawn beyond it.
- **Receipt:** show the actual benefit/condition/cost from this card and the resolved policy; remove the replaced generic claim atomically. Icon never supplies the only status/control information.

### Harmony boundary

- **Outward contribution:** Projected head/tail brackets; core chamber transmitted; phase cell explains eligible needle pass
- **Protect:** Cannot make active attacks ghostly/harmless-looking or phase walls

### Implementation and regression gate

- **Hook / migration:** RULE/RUN: remove12% aim efficiency; add ready phase cell, legal-launch age and per-hazard-pair suppression before player damage is committed. Needle continues its existing lifecycle; recharge only on accepted interception.
- **Must prove:** First4 ticks and boundary crossing, two needles same tick deterministic winner, clear/reentry pair, wall/Fang/zone/ring/boss exclusions; no invulnerability flag or deleted hazard.

<a id="item-prism"></a>

## C20. Prism Shell — `prism` · **Keep: physical refraction needles**

- **See / infer:** large purple facets split a contact into sharp outgoing pieces.
- **Power:** current two upward side-wall needles with 45-tick cooldown and current damage eligibility.
- **Physics:** two actual projectiles retain collision/lifetime rules. Floor contact is not side-wall activation; avoid duplicate corner procs.
- **Phrase:** contact-side facets pinch → exactly two bright solid needles launch → two small readiness notches drain/refill with real cooldown. Face remains visible.
- **Juice:** needles are gameplay objects, not particle quota. Add only **0–2** dead facet chips. Do not scatter ten identical-looking crystals and make only two secretly dangerous.
- **Proof:** valid side wall, floor/cooldown counterexamples, solid-blocked needle and exact ready state. Wings shares the contact accent rather than making a second burst.

### Icon and receipt

- **Unique icon construction:** Faceted shell with exactly two small solid needle hardpoints; not generic sparkle diamond.
- **Receipt:** show the actual benefit/condition/cost from this card and the resolved policy; remove the replaced generic claim atomically. Icon never supplies the only status/control information.

### Harmony boundary

- **Outward contribution:** Crystal mount collars; real two needles remain distinct from ornament; core route through facets
- **Protect:** No random refraction projectiles or automatic multi-element split

### Implementation and regression gate

- **Hook / migration:** RUN/ART: keep qualified side-wall callback/cooldown; source-tag exactly two real needles, retain sweep/solid policy. Use two root readiness notches; no fake extra crystal missiles.
- **Must prove:** Floor/corner double callback, cooldown45, pool saturation, high-speed and blocked needle, no primary-proc escalation from needle kills.

<a id="item-iron"></a>

## C21. Bastion Iron — `iron` · **Keep: one structural guard**

- **See / infer:** thick blue steel faces with bevels should absorb one hard impact.
- **Power:** existing one Fang-rush guard per run; no protection from everything.
- **Physics:** preserve the current collision-safe push-clear and its real direction. No blanket mass increase, floor immunity perk or new permanent health.
- **Phrase:** intact latch ready → plate compresses at actual block → latch opens into a persistent spent dent. Restoring health does not visually repair the consumed guard.
- **Juice:** one solid compression mark and **2–3** short metal flakes, within 180ms. One low clack under priority damage cues; no screen shake.
- **Proof:** first rush blocked, second normal, unrelated hazard unblocked. It must remain obvious that Glass still has one health.

### Icon and receipt

- **Unique icon construction:** Bolted square plate with one latched guard notch; not an infinite bubble shield.
- **Receipt:** show the actual benefit/condition/cost from this card and the resolved policy; remove the replaced generic claim atomically. Icon never supplies the only status/control information.

### Harmony boundary

- **Outward contribution:** Rigid attachment roots; accepted guard/armor contact gives compact compression, optional metal substrate chip
- **Protect:** No universal extra mass, metallic water, extra guard charge or double burst

### Implementation and regression gate

- **Hook / migration:** RUN/ART: keep current guard consumption in player-defense ordering; publish accepted defense kind/remaining charge. Bolted compression replaces generic shell/contact burst.
- **Must prove:** Blocked versus ineligible hit, one guard only, existing ward/parry ordering, restart and preview state isolation; no extra shield from Magnet Guard.

<a id="item-lava"></a>

## C22. Lava Cracked — `lava` · **Replace chain grace: banked heat**

- **See / infer:** dark shell with magma seams should store and spend heat.
- **New power:** each qualifying primary kill adds **1 heat, max 3**. At 3, the next eligible primary nonboss armored contact consumes all heat and applies **one secondary burn unit after 18 ticks**. No spread/aura. Heat clears after **90 ticks without a new qualifying kill**. Replace +18 chain ticks.
- **Physics:** no body temperature/gravity change, no automatic touch damage. Bosses/protected targets do not consume/payout the attack under a hidden alternate rule; show resistance.
- **Phrase:** each kill lights one existing crack segment → full shell has a steady center seam → accepted contact transfers one thin hot seam to its target → shell cools. No perpetual flame coat.
- **Juice:** 0 per heat increment; at most **2 embers** on actual heat transfer. The real burn tick uses one small target contraction, not another burst.
- **Proof:** exact charge/decay, no secondary kill charging, no burn recursion with Ember, no heat payout from rendering or re-equipping.

### Icon and receipt

- **Unique icon construction:** Cracked dark square with three internal heat cells; no dripping flame outline.
- **Receipt:** show the actual benefit/condition/cost from this card and the resolved policy; remove the replaced generic claim atomically. Icon never supplies the only status/control information.

### Harmony boundary

- **Outward contribution:** Actual stored heat routes toward accepting primary edge; Anchor's weight uses a thermal fitted seam
- **Protect:** No permanent external burn aura, early heat damage or fire conversion of Frost

### Implementation and regression gate

- **Hook / migration:** RULE/RUN: remove18 grace ticks; count real eligible primary heat according to card, spend only on eligible heat-finisher acceptance, schedule its burn with distinct source identity and world deadlines.
- **Must prove:** Zero/partial/full heat, cap, no target/boss, secondary kills, death/expiry; Lava+Ember cannot recursively ignite or keep old grace.

<a id="item-gold"></a>

## C23. Gold Foil — `gold` · **Keep: visible value, not armor**

- **See / infer:** gold material naturally implies a value/score affinity; this score perk is coherent.
- **Power:** current +10% qualifying kill-score contribution under the shared equipment cap. No extra shop credits, hidden purchase discount or damage.
- **Physics:** gold color does not increase player mass/recoil/restitution. Harmless foil curls are not Confetti Slash flechettes.
- **Phrase:** folded face seats → one 100ms specular crosses on an accepted scoring event → steady material. No frequent idle star sparkle.
- **Juice:** 0 combat particles; at most 2 small curved scraps on equip only. One aggregated scoring cue, not coin rain.
- **Proof:** base/bonus score and saturated-cap no-gain case; clear separation of SCORE and CREDITS. No gold flechette art emitted by the shell.

### Icon and receipt

- **Unique icon construction:** Folded foil corner with small score tally; no wallet/credit coin icon.
- **Receipt:** show the actual benefit/condition/cost from this card and the resolved policy; remove the replaced generic claim atomically. Icon never supplies the only status/control information.

### Harmony boundary

- **Outward contribution:** Foil edging on compatible mounts; score response folds into shared receipt
- **Protect:** No active flechettes from shell, gold rain or coin/score confusion

### Implementation and regression gate

- **Hook / migration:** RULE/RUN/ART: retain score contribution and25% cap in existing score authority, never wallet authority. Foil shell root and one aggregated score glint replace old generic pulse.
- **Must prove:** Score/base/bonus/cap, credits unchanged except established reward path, no foil projectile generated by shell and no double score receipt.

<a id="item-chamfer"></a>

## C24. Chamfer Frame — `chamfer` · **Replace blade tick: glancing recoil**

**Implementation checkpoint:** delivered in chunk8; see [progress / verification](upgrade-harmony-implementation-progress.md#chunk-8-armor-contact-shells--chamfer-and-segmented-c24c26). Void-world recoil replacement remains future C58 work, not an implicit part of this checkpoint.

- **See / infer:** actual eight-corner bevels should shed an impact rather than arbitrarily lengthen a weapon timer.
- **New power:** reduce the existing **primary armor-contact recoil component by 20%**. Replace +1 blade tick. Only the armor shove component changes; ordinary velocity, rail restitution and hit damage do not.
- **Physics:** calculate from the authoritative incoming velocity/shove, not from the already-clamped final vector. Never add speed above what the unshoved player carried, remove earned Hyper momentum, or create outward wall penetration.
- **Phrase:** leading bevel catches the contact → small diagonal slide highlight follows the actual glancing direction → returns in 120ms. Physical square remains square.
- **Juice:** 0–2 corner chips, not a metal explosion. Light hard tap.
- **Proof:** compare outgoing velocity against identical armor; normal hit and wall bank unchanged. No extra active blade duration left underneath.

### Icon and receipt

- **Unique icon construction:** Eight-corner silhouette with a glancing diagonal line; not extra blade-time mark.
- **Receipt:** show the actual benefit/condition/cost from this card and the resolved policy; remove the replaced generic claim atomically. Icon never supplies the only status/control information.

### Harmony boundary

- **Outward contribution:** Mount corners inherit bevel; actual reduced recoil feeds shared contact/body response
- **Protect:** No physical octagonal collider, ghost blade duration or reflected hazards

### Implementation and regression gate

- **Hook / migration:** RULE/RUN/MOVE: remove+1 generic blade tick; expose armor shove vector before clamp and scale only that component by .8 if eligible. ART follows real glancing vector.
- **Must prove:** Armor versus ordinary hit/wall, incoming zero/Hyper, collision-safe outgoing velocity, Void strongest reduction not sum; old blade duration removed.

<a id="item-notched"></a>

## C25. Notched Frame — `notched` · **Replace aim efficiency: vent cooling**

**Implementation checkpoint:** delivered in chunk7; see [progress / verification](upgrade-harmony-implementation-progress.md#chunk-7-notched-frame--visible-vent-cooling-c25). Other item cards remain design requirements, not implied implementation.

- **See / infer:** inward side vents release spent energy; they should help recovery rather than act like another targeting visor.
- **New power:** **+12% eligible passive FOCUS recovery while not aiming**, under the shared 40% recovery-bonus cap. Replace −8% aim drain.
- **Physics:** no jet propulsion or drag change. Recovered FOCUS is the real benefit; vents are not thrusters.
- **Phrase:** vents stay dark during drain → one short outward vent line on recovery entry → steady small open notch while recovery is active → dark at full/aim.
- **Juice:** 0 routine particles; a single pair of short graphic vent lines is enough. No smoke, steam curtain or continuous hissing.
- **Proof:** faster real recovery, no aim discount, no overfill/cancel farming. Existing owners keep the item with an updated receipt.

### Icon and receipt

- **Unique icon construction:** Square with two recessed vent slots and short recovery arrow; no thruster flame.
- **Receipt:** show the actual benefit/condition/cost from this card and the resolved policy; remove the replaced generic claim atomically. Icon never supplies the only status/control information.

### Harmony boundary

- **Outward contribution:** Cooling routes core/Orbit/Glitch through one recovery notch; small open socket channels
- **Protect:** No jet force, smoke system or four separate recovery emitters

### Implementation and regression gate

- **Hook / migration:** RULE/RUN/ART: replace8% aim efficiency with12% eligible recovery under40% cap. Recovery authority emits an entry/state view; vent gates/lines have no own timer-based grant.
- **Must prove:** Held/unheld/full/cancel boundaries, Glitch+Synth+Orbit cap, no old drain discount, no wall thrust or per-frame particles.

<a id="item-segmented"></a>

## C26. Segmented Frame — `segmented` · **Replace chain grace: compression spring**

**Implementation checkpoint:** delivered in chunk8; see [progress / verification](upgrade-harmony-implementation-progress.md#chunk-8-armor-contact-shells--chamfer-and-segmented-c24c26). Void-world recoil replacement remains future C58 work, not an implicit part of this checkpoint.

- **See / infer:** separate mint plates should compress, store and return a bounded amount of force.
- **New power:** first eligible armor shove of a shot stores **20% of the removed forward momentum, max 4 speed units**. Next legal launch within **45 ticks** may return that amount, but not exceed the recorded pre-impact speed or current legal ceiling. One charge, refresh never stacks. Replace +12 chain ticks.
- **Physics:** store only actual loss; a kill without recoil stores nothing. A new launch can never mint speed by hitting repeated armor. Canceled aim does not spend the charge; expiry discards it.
- **Phrase:** plates compress along true contact → one seam remains visibly compressed → next launch releases it → panels settle within 150ms.
- **Juice:** 0 particles; plate motion and one ratchet click prove the mechanic.
- **Proof:** recoverable versus nonexistent loss, expiry, wall collision, high-speed ceiling, no charge farm. Resolve Chamfer as an alternative shell, not a stackable shell bonus.

### Icon and receipt

- **Unique icon construction:** Interlocking plates with one compressed spring seam; stored loss, not armor bonus.
- **Receipt:** show the actual benefit/condition/cost from this card and the resolved policy; remove the replaced generic claim atomically. Icon never supplies the only status/control information.

### Harmony boundary

- **Outward contribution:** Head/tail roots follow the same real charged plate displacement; next launch releases once
- **Protect:** No extra whole-body squash, invented momentum or endless ratchet sound

### Implementation and regression gate

- **Hook / migration:** RULE/RUN/MOVE: remove12 grace ticks; record real lost-forward momentum during eligible primary armor shove, one capped charge/deadline. Spend on accepted next launch after solving legal ceiling; ART mirrors stored compression.
- **Must prove:** No actual loss,20%/max4/45-tick expiry, cancel aim preserves, failed launch does not spend, preimpact ceiling, repeated armor cannot mint speed.

<a id="item-standard"></a>

## C27. Standard Heart — `standard` · **Keep: balanced capacity**

- **See / infer:** plain central chamber, balanced charge.
- **Power / physics:** current default health/3 EDGE, ordinary movement/resource rules. Never weaken the free engine to make others attractive.
- **Phrase:** chamber seats → small inward notch engages on real EDGE return → steady. Don't draw a giant floating device absent from the equipped art.
- **Juice:** 0 particles, no constant heartbeat sound. Shared resource cue only.
- **Proof:** correct capacities after switching from Glass/Riot; no stale special-core force or charge. Opaque shells still convey state through a small supported inset/receipt, not a new hole cut in every material.

### Icon and receipt

- **Unique icon construction:** Centered plain chamber with three reserve seats; balanced baseline.
- **Receipt:** show the actual benefit/condition/cost from this card and the resolved policy; remove the replaced generic claim atomically. Icon never supplies the only status/control information.

### Harmony boundary

- **Outward contribution:** Neutral small energy routes; clean mounts, shared accepted resource return
- **Protect:** Free kit must not look disconnected or incomplete

### Implementation and regression gate

- **Hook / migration:** RULE/ART: retain baseline health/EDGE and neutral chamber; reset special core transient state at next run creation. One shared accepted resource inset; no fake periodic heartbeat.
- **Must prove:** Glass/Riot preview->Standard resets displayed caps; live run unchanged; default full capacities and no retained Grav/Time/Echo state.

<a id="item-time"></a>

## C28. Time Crystal — `time` · **Replace recovery multiplier: small time lens**

- **See / infer:** actual blue crystal/clock-like chamber suggests local time distortion, not simply faster FOCUS refill.
- **New power:** continuous aim for **12 ticks** opens a **12-tick local lens** around one selected eligible nonboss enemy within **120** and static sight; its locomotion and own windup progression run at **80%**. Source cooldown **60 ticks**; release ends the lens. Replace post-kill 2× recovery.
- **Physics:** use target-local dt, never skip the world's physics. Emitted projectiles/hazards keep normal time. Global status expiry/immunity clocks stay on world dt; no slowing a freeze timer to extend it forever.
- **Phrase:** crystal halves align → thin steady clock bracket encloses the accepted target → a slow tick proves reduced progression → closes cleanly. No full-screen warp.
- **Juice:** 0 particles. One fine clock tick on acceptance, not per frame.
- **Proof:** measurable local motion/tell difference; outside range, released aim, bosses and already-frozen targets follow explicit stronger-status policy. Never silently compound existing aim slow.

### Icon and receipt

- **Unique icon construction:** Split crystal around a small local clock bracket; no full-screen time circle.
- **Receipt:** show the actual benefit/condition/cost from this card and the resolved policy; remove the replaced generic claim atomically. Icon never supplies the only status/control information.

### Harmony boundary

- **Outward contribution:** Clock notches on powered roots, Halo alignment; target tell instruments follow actual local progression
- **Protect:** No automatic slowing of attacks/particles/status expiry or cooler fake Fire

### Implementation and regression gate

- **Hook / migration:** RULE/AI/RUN: remove current120-tick post-kill double recovery; add held-aim selector,12-tick local lens/60 cooldown as card. Apply .8 only to declared locomotion/tell paths; status expiry/hazards use world dt.
- **Must prove:** Hold12 boundary, release, outside120/sight/boss, Frost strongest choice, cooldown fractional dt, emitted hazard unaffected, old double regen absent.

<a id="item-riot"></a>

## C29. Riot Reactor — `riot` · **Keep: early ignition, less reserve**

- **See / infer:** inset bolt/reactor should visibly charge toward a real burst state.
- **Power:** existing four-kill Overdrive requirement, max EDGE 2. No second unrelated power added.
- **Physics:** existing Drive effects remain authoritative. Reactor art cannot multiply speed again, especially with Viper/Volt.
- **Phrase:** four small reactor notches seat one per eligible kill → one compact ignition on real Drive entry → steady hot core → cool on exit. Chain break clears matching progress.
- **Juice:** 0 charge particles; **up to 3** short core sparks on entry only, suppressed if Dash/contact already owns the accent. No continuous exhaust.
- **Proof:** correct direct/secondary counts, 2 EDGE tradeoff, new Blaze refund cannot exceed capacity or trigger repeated activations.

### Icon and receipt

- **Unique icon construction:** Reactor bolt surrounded by four ignition notches and two reserve seats.
- **Receipt:** show the actual benefit/condition/cost from this card and the resolved policy; remove the replaced generic claim atomically. Icon never supplies the only status/control information.

### Harmony boundary

- **Outward contribution:** Short core-to-powered-part route at Drive entry; one combined Blaze/resource phrase
- **Protect:** No independent idle flames, second speed boost or every-part explosion

### Implementation and regression gate

- **Hook / migration:** RULE/RUN/ART: preserve four-kill Drive and EDGE2. Expose real charge/entry transition and one ignition route shared with Blaze/Lava; no new functional synergy multiplier.
- **Must prove:** Direct/secondary counts, chain reset, overflow refund, Drive entry once, cap2 even after repair; no repeated ignition at every draw.

<a id="item-glass"></a>

## C30. Glass Cannon — `glass` · **Replace double score: real fragile offense**

- **See / infer:** sharp red crystal/fragile chamber should mean strong offense with real fragility, not only high scoreboard income.
- **New power:** **+1 primary damage unit against eligible nonboss armor**, still **max health 1** including repair paths. Replace 2× score. No bonus to burn, fragments, echoes, fields or other secondary damage. Shared extra-plate cap applies.
- **Physics:** normal player velocity/recoil, no passive glass shield or immunity. Monolith/Landlord phase/plate rules remain unchanged.
- **Phrase:** sharp internal point seats into the chamber → steady fine fracture communicates fragility → primary bonus contact gives one sharp local fracture notch. No constantly shedding shards.
- **Juice:** 0 idle/travel particles; at most 2 glass chips on an accepted bonus if contact budget remains. Actual death uses existing failure handling.
- **Proof:** stronger eligible primary, same boss, one-health death, no healing above cap. Oni/Sniper/Crown cannot turn stacked bonuses into an unbounded execute.

### Icon and receipt

- **Unique icon construction:** Fine pointed fractured chamber with one hull pip; offense/fragility both visible.
- **Receipt:** show the actual benefit/condition/cost from this card and the resolved policy; remove the replaced generic claim atomically. Icon never supplies the only status/control information.

### Harmony boundary

- **Outward contribution:** Thin keyed fracture in supported collars; accepted bonus contact gets one crisp edge response
- **Protect:** Does not transform all particles into damaging glass, provide shield or add hits

### Implementation and regression gate

- **Hook / migration:** RULE/RUN: replace2x score with1 extra eligible nonboss primary plate, retain healthMax1 through every repair/health initialization path. Contribution uses shared cap and fragility has a persistent shape read.
- **Must prove:** Death/repair/max-health upgrade routes, boss/secondary exclusions, capped combo, score returns to intended ordinary multiplier with other bonuses retained.

<a id="item-grav"></a>

## C31. Grav Core — `grav` · **Keep: actual small-target pull**

- **See / infer:** visible purple spiral should bend nearby motion inward.
- **Power:** existing aim-only small-Fang pull within 220, current per-tick bound. No new score/resource substitute.
- **Physics:** actual eligible target displacement, existing walls/leash respected. Void/Time/Frost interactions must use capped force/status resolution, not multiplying every local dt/force independently.
- **Phrase:** spiral tightens during aim → 1–2 sparse inward tracers only on the affected target → relax on release. Boundary outline is faint and optional, not a huge vortex tunnel.
- **Juice:** at most **2 total moving flecks** for the field, not per target, no idle emission.
- **Proof:** real small-target displacement, large-target resistance, release, range/blockers. Player body is never attracted/teleported.

### Icon and receipt

- **Unique icon construction:** Inset spiral with inward target-facing line; not distant enemy teleport.
- **Receipt:** show the actual benefit/condition/cost from this card and the resolved policy; remove the replaced generic claim atomically. Icon never supplies the only status/control information.

### Harmony boundary

- **Outward contribution:** Inward core/socket routing; actual affected target has tiny sparse tether; Void field stays separate
- **Protect:** No cosmetic idle vortex, fake projectile bending or duplicated force

### Implementation and regression gate

- **Hook / migration:** RUN/AI/ART: keep current aimPull bounds and eligible small Fang selection; integrate actual displacement/sensor sync using existing collision/leash policy. Render sparse route only for actual affected targets.
- **Must prove:** Range220/front band/release/large target/solid, simultaneous Void field, no player force; no particle callback writing position.

<a id="item-magnet"></a>

## C32. Magnet Dynamo — `magnet` · **Keep: close-range edge focusing**

- **See / infer:** observed two-pole red/blue chamber should visibly pinch/concentrate energy at close contact.
- **Power:** retain current +20% close-cut width within 100. The icon/short label becomes **CLOSE-CUT FIELD** so it does not promise long-range enemy attraction.
- **Physics:** broaden the actual primary close-contact envelope; no pulling enemies, stealing projectiles or extra damage. One resolved envelope with new Slash/Dash geometry.
- **Phrase:** poles close slightly as contact enters the real band → short broad edge seats at the contact → open back. No body scaling.
- **Juice:** 0 particles; at most one small field line. Dry magnetic latch mixed into the primary hit.
- **Proof:** near/far victim and capped width. If blind review still reads “pull” rather than “focus,” redesign the pole/field art or rename—not invent an unrelated extra perk.

### Icon and receipt

- **Unique icon construction:** Opposed pole blocks bracketing a short broad edge; close width, not tractor beam.
- **Receipt:** show the actual benefit/condition/cost from this card and the resolved policy; remove the replaced generic claim atomically. Icon never supplies the only status/control information.

### Harmony boundary

- **Outward contribution:** Paired conductor trim on weapon/Coil/Wing roots; actual close-cut width visible in aim
- **Protect:** No long-range pull, free second zap or extra refill

### Implementation and regression gate

- **Hook / migration:** RULE/RUN/INFO: retain20% close-width benefit within100; shared attack profile evaluates near band per target and draws it conditionally. Arc Angel/guard/relay roots remain nonfunctional stitching.
- **Must prove:** 99.9/100/100.1 distance, Laser/Ink caps, no enemy attraction, no width applied to far targets or hurtbox.

<a id="item-echo"></a>

## C33. Echo Heart — `echo` · **Keep: counted stationary memory**

- **See / infer:** pink chamber with concentric/offset form suggests a remembered attack.
- **Power:** current every-third-direct-chain-kill stationary ghost blade for 30 ticks, existing eligibility/hit-once rules.
- **Physics:** actual secondary attack source at its recorded location; no physical duplicate player or homing memory.
- **Phrase:** three internal count notches → one thin stationary blade outline → accepted secondary contact briefly brightens it → dissolves on expiry. Different contour from Echo Dash's traveled replay.
- **Juice:** **0–2** geometric fragments only at an actual ghost contact, no orbiting idle pixels.
- **Proof:** direct/secondary provenance, target once per source, full charge/reset and bounded coexistence with sword/Dash echoes. Do not silently drop promised attacks when cosmetic budgets fill.

### Icon and receipt

- **Unique icon construction:** Three count notches above a stationary offset blade; not Dash's traveled replay.
- **Receipt:** show the actual benefit/condition/cost from this card and the resolved policy; remove the replaced generic claim atomically. Icon never supplies the only status/control information.

### Harmony boundary

- **Outward contribution:** Thin offset source contour, discrete count pattern on supported hardware; distinguish all echo source IDs
- **Protect:** No extra damaging clone/replay from a trim effect or particle remnant

### Implementation and regression gate

- **Hook / migration:** RUN/ART: preserve third qualifying direct-chain-kill stationary source and30-tick lifetime through explicit source adapter. Separate core count from sword pulse/replay; reserve admission before accepting new source policy.
- **Must prove:** Third kill once, chain break, source/target hit-once, saturation, death/reset cleanup and simultaneous Dash/sword echoes; no secondary recharge loop.

<a id="item-ribbon"></a>

## C34. Ninja Ribbon — `ribbon` · **Keep: clean cloth baseline**

- **See / infer:** one lime folded ribbon follows movement; it is not a weapon.
- **Power / physics:** normal rebound/control, no extra force or hurtbox. Cloth lag is visual only.
- **Phrase:** knot seats → one bounded cloth bend under acceleration → small delayed fold after bank → settles. Never stretches into a scene-wide colored rope.
- **Juice:** 0 particles, no idle rustling or flutter loop at rest. At most shared cloth release accent.
- **Proof:** direction changes readable, face/active edge not hidden, no new hitbox or secret drag. The free tail feels polished without a perk invented to fill a card.

### Icon and receipt

- **Unique icon construction:** One short folded cloth strip tied to a knot; no damaging tip.
- **Receipt:** show the actual benefit/condition/cost from this card and the resolved policy; remove the replaced generic claim atomically. Icon never supplies the only status/control information.

### Harmony boundary

- **Outward contribution:** Reads body acceleration and one bank follow-through with selected shell knot/mount
- **Protect:** Cannot extend into live blade silhouette or impose real drag

### Implementation and regression gate

- **Hook / migration:** ART: common tail socket plus bounded damped cloth response from shared action/actual acceleration. No gameplay modifier.
- **Must prove:** Direction reversal/bank and settle, tiny-scale clipping, no live blade extension or drag; no independent idle sine/exhaust.

<a id="item-wings"></a>

## C35. Prism Wings — `wings` · **Keep: one airborne wall recharge**

- **See / infer:** actual large layered crystal feathers catch a wall contact and reopen reserve.
- **Power:** current +1 EDGE on first side-wall contact per airborne streak; floor resets.
- **Physics:** no flight, hover or lift. Resource gain enables an ordinary legal launch.
- **Phrase:** ready inner feather lit → one flex along true contact normal → small refill notch joins EDGE → inner feather dark while spent. Floor rearms quietly.
- **Juice:** 0 routine particles; at most **2 facet chips** on accepted refill, one shared bank cue. No huge feather cloud.
- **Proof:** second airborne wall contact gives nothing; floor reset; full EDGE no-overfill. Needle Shell/Tide/world effects share one contact phrase.

### Icon and receipt

- **Unique icon construction:** Layered feather pair around one wall-refill notch; no flight up-arrow.
- **Receipt:** show the actual benefit/condition/cost from this card and the resolved policy; remove the replaced generic claim atomically. Icon never supplies the only status/control information.

### Harmony boundary

- **Outward contribution:** Core/root readiness mark and EDGE receipt synchronize; paired Beacon tell shape stays separate
- **Protect:** No actual lift, refill from every feather or extra light ring

### Implementation and regression gate

- **Hook / migration:** RUN/ART: retain first side-wall EDGE refill per airborne streak, floor rearm; aggregate accepted contribution with other resources. Fitted feather root shares bank contact normal.
- **Must prove:** Second wall, floor reset, corner, full EDGE, no flight, cap order with Spectrum/Blaze and no double grant from Spark route.

<a id="item-ghost"></a>

## C36. Ghost Scarf — `ghost` · **Keep: lingering cutting window**

- **See / infer:** translucent pale scarf leaves a brief presence after the body passes.
- **Power:** current special +6 blade ticks; no repeated primary hit on the same victim.
- **Physics:** normal body motion; extra active time belongs to the resolved primary attack, not the scarf's cloth collider. B4 explicitly includes Ghost's+6 in the Laser gate; verify the composed window before enabling that combination.
- **Phrase:** author the advertised **two unequal folds** rather than recoloring one ribbon → thin local active-edge memory → folds return to quiet cloth when the hit window ends.
- **Juice:** 0 constant motes; **at most 2** dissolving points at active-window expiry, no drifting spectral fog.
- **Proof:** late eligible contact versus already-hit victim; harmless scarf after expiry; do not confuse it with Echo Core/Dash's separately damaging sources.

### Icon and receipt

- **Unique icon construction:** Two unequal translucent folded ends beside a short active-window tail mark.
- **Receipt:** show the actual benefit/condition/cost from this card and the resolved policy; remove the replaced generic claim atomically. Icon never supplies the only status/control information.

### Harmony boundary

- **Outward contribution:** Actual longer active edge gets a restrained contour, supported endpoint residue may dissolve thinly
- **Protect:** Never adds an unsourced hit or hides active projectile boundaries

### Implementation and regression gate

- **Hook / migration:** RULE/RUN/ART: keep+6 primary ticks with truthful active edge and two unequal cloth folds. B4 explicitly composes its Laser gate; cloth never participates in collision.
- **Must prove:** Late target versus already-hit target, Standard/Katana/Laser windows, harmless expiry and core/Dash echo distinction; no source emitted by scarf art.

<a id="item-viper-tails"></a>

## C37. Viper Tails — `viper-tails` · **Replace speed score: directional retention**

- **See / infer:** twin taut red streamers behave like stabilizers during a committed redirection.
- **New power:** reduce the **ordinary direction-change speed loss by 15% of that loss** on legal relaunch. If normal retention is 0.85, target retention becomes 0.8725—not +15% speed. Never exceed incoming momentum or override a stronger bank/Hyper retention rule. Replace +10% speed score.
- **Physics:** actual launch-retention calculation changes; no auto-turn, free acceleration or steering after release.
- **Phrase:** strands fan in the old direction → tighten toward the new launch → relax. One stitch line aligns with accepted retention, not a perpetual glow.
- **Juice:** 0 particles. One short cloth tension snap, mixed with launch.
- **Proof:** zero incoming speed gives no bonus, forward continuation no invented gain, reversal correct, high-speed ceiling intact. Do not alter `CAMERA.lead` to fake smoothness.

### Icon and receipt

- **Unique icon construction:** Two taut streamers joining an old/new-direction corner; loss retention, not homing.
- **Receipt:** show the actual benefit/condition/cost from this card and the resolved policy; remove the replaced generic claim atomically. Icon never supplies the only status/control information.

### Harmony boundary

- **Outward contribution:** Relauch tension follows real retained direction/speed; source spacing reflects actual momentum
- **Protect:** No target homing, free acceleration, poisonous flame or camera-lead change

### Implementation and regression gate

- **Hook / migration:** RULE/MOVE/RUN: replace speed-score with .15 of ordinary redirection LOSS retained, evaluated before final legal launch clamp. Use actual incoming/committed direction and stronger existing retention ownership.
- **Must prove:** Zero incoming, straight/reverse/diagonal, .85->.8725 illustrative case, bank/Hyper precedence; no +15% speed interpretation or camera change.

<a id="item-anchor"></a>

## C38. Anchor Chain — `anchor` · **Keep: earned floor force**

- **See / infer:** linked heavy weight transfers force into the floor.
- **Power:** current +15% qualified floor rebound plus local Fang clear within 170, existing cooldown/eligibility.
- **Physics:** real existing floor impulse/attack; no global extra gravity, body rotation or new slam button. Chain's visible pendulum cannot write another impulse.
- **Phrase:** links lag → weight compresses at actual qualified floor event → one flat contact mark along floor → links settle. Side-wall touch does not play the slam.
- **Juice:** **2–4 grit chips**, low and outward, within 180ms. No radial rubble ring; existing halves/decals remain the result system.
- **Proof:** floor/corner classification, cooldown, outside-radius target, target exclusions and no lingering ground hazard after the contact mark fades.

### Icon and receipt

- **Unique icon construction:** Linked chain and weight seated on a floor contact line; not side-wall jet.
- **Receipt:** show the actual benefit/condition/cost from this card and the resolved policy; remove the replaced generic claim atomically. Icon never supplies the only status/control information.

### Harmony boundary

- **Outward contribution:** Shell-specific weight collar; actual floor-force origin owns one low contact mark
- **Protect:** No second floor impulse, new gravity, tail-wide damage collider or rubble spray

### Implementation and regression gate

- **Hook / migration:** RUN/MOVE/ART: retain existing qualified floor impulse/local Fang clear radius170 and eligibility/cooldown. One linked weight compression consumes true floor event, not tail animation contact.
- **Must prove:** Sidewall/corner/floor, repeated callback, outside170/target exclusions, capped bank math; no second impulse from Magma Flail or Forge.

<a id="item-thrusters"></a>

## C39. Mini Thrusters — `thrusters` · **Keep: a short earned jet kick**

- **See / infer:** actual two small nozzles should fire short directed exhaust, not decorative permanent flames.
- **Power:** current +8% earned rail rebound, existing speed ceiling.
- **Physics:** existing qualified impulse only. No wall rubbing acceleration, hover or continuous thrust. Tide's tangent adjustment resolves with this once, not repeated after clamping.
- **Phrase:** nozzles telescope → 60–90ms paired exhaust at real bank → seat. Incoming dead particles keep their velocity; new exhaust follows actual outgoing direction.
- **Juice:** **2–4 hot flecks** only on accepted boost. No idle exhaust or trail longer than the travel owner already needs.
- **Proof:** invalid touch/cap has no false full-power burst; measured outgoing velocity matches direction/strength. Cooldown/repeated callbacks do not multiply.

### Icon and receipt

- **Unique icon construction:** Two short nozzles aimed away from a bank chevron; no constant flames.
- **Receipt:** show the actual benefit/condition/cost from this card and the resolved policy; remove the replaced generic claim atomically. Icon never supplies the only status/control information.

### Harmony boundary

- **Outward contribution:** Shared root uses shell material, core conduit seats at actual bank; one short exhaust
- **Protect:** No permanent flame trail, idle thrust or repeated cap multiplication

### Implementation and regression gate

- **Hook / migration:** RUN/MOVE/ART: retain8% earned rebound contribution, integrate once in shared bank ledger/cap. Only accepted marginal boost telescopes nozzles/short exhaust.
- **Must prove:** Invalid/rubbing wall, repeated callback, ceiling-limited contribution, Tide/Tokyo combined12% target cap and stronger Hyper semantics; no idle thrust.

<a id="item-spectrum"></a>

## C40. Neon Spectrum — `spectrum` · **Replace chain grace: completed-sequence refill**

- **See / infer:** distinct colored ribbon segments suggest completing a sequence, not seven elemental damage types.
- **New power:** **three qualifying primary kills in one chain** complete three bands and return **one EDGE**, then start **120-tick source cooldown**. At most one stored sequence, no overflow queue; chain break clears incomplete progress. Replace +12 chain ticks.
- **Physics:** resources only, normal launch forces. No random element selection, extra damage or real rainbow projectiles.
- **Phrase:** one band seats per kill → completed bands briefly converge at the knot → shared EDGE notch fills → ribbon returns to subdued stripes. No permanent cycling hue.
- **Juice:** 0 per count; **up to 2 small band fragments** on accepted refill if not masked by the main kill cue. Shared sound, not three chimes.
- **Proof:** secondaries excluded, cap/cooldown, no count replay, simultaneous kills and chain reset. Echo Core's third-kill attack remains a different source/shape.

### Icon and receipt

- **Unique icon construction:** Three discrete band groups converging toward one reserve notch; not seven elements.
- **Receipt:** show the actual benefit/condition/cost from this card and the resolved policy; remove the replaced generic claim atomically. Icon never supplies the only status/control information.

### Harmony boundary

- **Outward contribution:** Core/EDGE grant uses one completion route; Notched vent line may carry matching bands briefly
- **Protect:** No random elemental power, rainbow recolor of every attack or constant hue cycling

### Implementation and regression gate

- **Hook / migration:** RULE/RUN/ART: remove12 chain ticks; track three qualifying primary kills in same chain, grant at most1 EDGE with120 source cooldown. No stored overflow payout; bands reflect actual progression.
- **Must prove:** Simultaneous kills/order, chain reset, full EDGE, cooldown boundary, secondary exclusion; no auto-elements or repeated refill on completed visual band.

<a id="item-pointer-reticle"></a>

## C41. Field Reticle — `pointer-reticle` · **Keep: reliable free contact point**

- **See / infer:** four open ticks show exactly where the gesture began.
- **Power / physics:** free complete origin, power and cancel readout. No aim force, velocity bonus or inaccurate base tier.
- **Phrase:** press seats ticks in ≤60ms → tension responds to real pull → valid release opens/clears; canceled gesture contracts/clears without a fake shot.
- **Juice:** 0 particles, one engagement tick at most. No cursor trail or feedback listener causing another launch.
- **Proof:** touch capture loss, keyboard equivalents, canvas scaling/DPR and true drag origin. The target remains visible through the gap.

### Icon and receipt

- **Unique icon construction:** Four open origin ticks around a clear center; no weapon blade.
- **Receipt:** show the actual benefit/condition/cost from this card and the resolved policy; remove the replaced generic claim atomically. Icon never supplies the only status/control information.

### Harmony boundary

- **Outward contribution:** Shared calibration language with actual weapon, no ornamental ripple
- **Protect:** Cannot hide required control information behind purchases

### Implementation and regression gate

- **Hook / migration:** INFO/UI: retain true gesture origin, power and cancel; draw from existing input state in screen/world conversion once. No extra listeners per frame or repeated launch callback.
- **Must prove:** DPR/resize/scroll-safe coordinates, touch capture loss, pointercancel, keyboard, hidden/resume; no path/physics change.

<a id="item-pointer-diamond"></a>

## C42. Prism Pointer — `pointer-diamond` · **Replace blade tick: geometric corridor**

- **See / infer:** nested faceted diamonds are a measuring lens, not extra blade lifetime.
- **New power:** display the actual resolved **primary cutting-width envelope** over the available forecast during aim. Replace +1 blade tick. Conditional/unknown future margins are dashed, not shown as guaranteed hits.
- **Physics:** no damage, reach, target snapping or changed trajectory. Pure information calculated from the same attack profile.
- **Phrase:** facets unfold to two thin corridor edges → follow geometry immediately → fold shut on cancel/release. No animated slow reveal hiding retargeting.
- **Juice:** 0 particles; one quiet calibration click on equip. Keep lines faint enough to preserve red hazards and existing bracket semantics.
- **Proof:** Viper/Katana narrowness, Comic width, Laser's line, caps, obstacles and moving-target uncertainty. No paid predictive bounce or extra world simulation step.

### Icon and receipt

- **Unique icon construction:** Nested open facets forming two measured corridor edges; no extra tick-time claim.
- **Receipt:** show the actual benefit/condition/cost from this card and the resolved policy; remove the replaced generic claim atomically. Icon never supplies the only status/control information.

### Harmony boundary

- **Outward contribution:** Samples composed sword/head/Dash/Slash geometry; conditional margins dashed
- **Protect:** No invented future hits, body width change or second simulator

### Implementation and regression gate

- **Hook / migration:** RULE/INFO: remove+1 tick; draw actual conditional primary envelope from same launch/profile helper at existing forecast horizon. Mark near/angle/power uncertainty rather than predicting guaranteed victims.
- **Must prove:** All Dash/Slash profiles, near/far Magnet and Samurai boundaries, occlusion; combat snapshots identical apart from intentionally removed old tick, no extra world step.

<a id="item-pointer-orbit"></a>

## C43. Orbit Pointer — `pointer-orbit` · **Keep: recovery indicator**

- **See / infer:** broken arc/satellite returns into its notch as energy returns.
- **Power:** current +10% eligible passive FOCUS recovery, shared cap.
- **Physics:** pointer movement cannot generate FOCUS or influence body flight. No orbiting damaging satellite.
- **Phrase:** satellite follows true aim direction → on recovery it moves once toward a dock over 120ms → steady dock → undocks at drain. The FOCUS meter remains available off-touch.
- **Juice:** 0 particles, one quiet docking tick only on meaningful recovery entry. No endlessly spinning orb.
- **Proof:** identical recovery intervals, full cap, aim cancellation spam, mobile resting state and no idle audio/animation buildup.

### Icon and receipt

- **Unique icon construction:** Broken pointer arc with one satellite dock; no damaging orbital body.
- **Receipt:** show the actual benefit/condition/cost from this card and the resolved policy; remove the replaced generic claim atomically. Icon never supplies the only status/control information.

### Harmony boundary

- **Outward contribution:** Notched/Glitch/World share one accepted recovery phrase; shell/core style its instrument housing
- **Protect:** No orbiting damaging object or refill by dragging in circles

### Implementation and regression gate

- **Hook / migration:** RULE/INFO/ART: retain10% eligible recovery under40% cap. Satellite docks on actual recovery entry/state and stops at full; no callback grants resource.
- **Must prove:** Cancel spam, cap with Notched/Glitch/Synth, no spin at idle, input snapshots and family unchanged.

<a id="item-pointer-cross"></a>

## C44. Crosshair Pointer — `pointer-cross` · **Keep: stable aim efficiency**

- **See / infer:** four precision L-brackets signal controlled alignment.
- **Power:** current −8% aim drain, shared efficiency cap. Do not promise lock-on or precision damage.
- **Physics:** no direction snapping, auto-correction or momentum modification.
- **Phrase:** brackets contract at most 2px on press → hold still during aim → clear crisply on release. Actual power still has its own accurate readout.
- **Juice:** 0 particles, no target-acquired alarm. Tiny dry calibration click.
- **Proof:** lower actual cost with same input/trajectory, center gap readable, cap saturation and correct cancel state. Motion must not jitter with every sample update.

### Icon and receipt

- **Unique icon construction:** Four stable L brackets around open center; no lock-on target fill.
- **Receipt:** show the actual benefit/condition/cost from this card and the resolved policy; remove the replaced generic claim atomically. Icon never supplies the only status/control information.

### Harmony boundary

- **Outward contribution:** Visor/Sniper eligibility expressed with one small notch while true power stays separate
- **Protect:** No target snap, guaranteed-hit alarm or duplicate floating crosshairs

### Implementation and regression gate

- **Hook / migration:** RULE/INFO: retain8% aim efficiency under30 cap; brackets react to true aim state, no target acquisition or direction snap. Stable clear on all cancellation paths.
- **Must prove:** Efficiency capped/uncapped, stationary jitter, touch and keyboard cancel; same launch vector and no extra acquisition cue.

<a id="item-radar-base"></a>

## C45. Field Radar — `radar-base` · **Keep: accurate local map**

- **See / infer:** one circular receiver with one contact. Free instrument, not faulty equipment.
- **Power:** current nearby enemies/objectives; normal warnings remain available for free.
- **Physics:** reports actual state, no hidden enemy delay or speed change.
- **Phrase:** frame seats once → contacts enter/update/leave accurately → no constant sweeping glow.
- **Juice:** 0 particles, 0 border-crossing beeps. One equip tick.
- **Proof:** range boundary and destroyed target cleanup. Demo pairs world/map positions so the player understands scale and ownership.

### Icon and receipt

- **Unique icon construction:** Receiver with one plain local-contact dot; baseline live data.
- **Receipt:** show the actual benefit/condition/cost from this card and the resolved policy; remove the replaced generic claim atomically. Icon never supplies the only status/control information.

### Harmony boundary

- **Outward contribution:** Actual target movement/status changes update existing symbols without delay
- **Protect:** No fake scan latency, cosmetic-particle contacts or changed AI

### Implementation and regression gate

- **Hook / migration:** INFO: retain free local contacts/updates; consume actual run objects via readonly view. Contact glyphs do not wait for decorative sweep.
- **Must prove:** Enemy spawn/death, hostile hazard distinction, scale/viewport, no AI/physics/RNG mutation from render.

<a id="item-radar-1"></a>

## C46. Long-Range Array — `radar-1` · **Keep: wider antenna reach**

- **See / infer:** add two visibly extended receiver arms to its icon/hardware—not just a small “I.”
- **Power:** current 1.35× base range, no hazard/tell layers from higher tiers.
- **Physics:** same accurate current-world positions. Larger view compresses spacing, not physical distances.
- **Phrase:** antenna arms extend once → far contact outside dashed base ring becomes available → stable map.
- **Juice:** 0 particles; quiet array latch only. Range boundary doesn't keep pinging.
- **Proof:** contact inside base/upgrade/beyond upgrade; radius-versus-area copy correct, no inherited top-tier stale layers after switching.

### Icon and receipt

- **Unique icon construction:** Receiver with an additional range arc; preserve local-dot base silhouette.
- **Receipt:** show the actual benefit/condition/cost from this card and the resolved policy; remove the replaced generic claim atomically. Icon never supplies the only status/control information.

### Harmony boundary

- **Outward contribution:** Longer-range hardware/preview ring fits World contrast and current contact scale
- **Protect:** No extra hazard/tell data from visual family alone

### Implementation and regression gate

- **Hook / migration:** INFO: retain extended range only from actual tier rule; root/housing fitted to current construction without implying more powers.
- **Must prove:** Just inside/outside range, updates same tick as base, no added tells/damage or preview mutation.

<a id="item-radar-2"></a>

## C47. Threat Array — `radar-2` · **Keep: separate danger channel**

- **See / infer:** receiver plus a square hazard notch/secondary channel. Observed orange dots need actual distinct projectile/area geometry.
- **Power:** current 1.70× base range and active hazards. No future tell prediction.
- **Physics:** active projectile dash follows actual heading, area outline follows actual danger lifetime. Newly frozen owner does not erase an already-emitted hazard.
- **Phrase:** hazard channel seats after contact layer → a new hazard gets one small outline emphasis → normal live tracking/clear.
- **Juice:** 0 particles, no full-radar pulse/siren. Shared danger sound outranks decoration.
- **Proof:** friendly/cosmetic fragment exclusion, overlap, cancellation and actual range. Meaningful tiny markers cannot be replaced by larger busy graphics.

### Icon and receipt

- **Unique icon construction:** Receiver with separate diamond hazard channel; distinct from range arc tier.
- **Receipt:** show the actual benefit/condition/cost from this card and the resolved policy; remove the replaced generic claim atomically. Icon never supplies the only status/control information.

### Harmony boundary

- **Outward contribution:** Real needles/flechettes/hazards use correct ownership/marker type; friendly attacks don't become threats
- **Protect:** No conflating chips with hostile projectiles or future tell prediction

### Implementation and regression gate

- **Hook / migration:** INFO: retain danger channel with correct ownership/type for needles/zones/rings. New friendly attacks never enter hostile marker list by material resemblance.
- **Must prove:** Friendly foil/Prism versus hostile needle, behind/edge policy, expired hazard removal; no gameplay-source culling by display range.

<a id="item-radar-3"></a>

## C48. Oracle Array — `radar-3` · **Keep: live tell and heading analysis**

- **See / infer:** full receiver with directional needle and one external tell arc, distinct from lower-tier silhouettes.
- **Power:** current 2.20× base range, active hazards, live windup and player heading. No future-AI omniscience.
- **Physics:** data follows Part C actual freeze, daze, slow or interrupt. A paused/canceled tell must not show a decorative countdown progressing normally.
- **Phrase:** layers latch once → affected tell arc advances only with authoritative progress → clears immediately when canceled/resolved. Map itself does not rotate/pulse for flair.
- **Juice:** 0 particles. One small equip cue, no per-tick audio.
- **Proof:** live threat lifecycle, immobile heading, multiple targets, hidden tab and mobile density. Reuse Beacon's tell language without duplicating oversized arrows.

### Icon and receipt

- **Unique icon construction:** Receiver with heading chevron and segmented tell arc; not another dot count.
- **Receipt:** show the actual benefit/condition/cost from this card and the resolved policy; remove the replaced generic claim atomically. Icon never supplies the only status/control information.

### Harmony boundary

- **Outward contribution:** Beacon/Ears/Hypno/Time/Frost report one consistent authoritative state
- **Protect:** No advancing fake tells on frozen target, omniscience or full-map flash

### Implementation and regression gate

- **Hook / migration:** INFO/AI: show authoritative windup heading/progress; share Beacon/Hypno/Time/Frost state semantics. Read target-local tell progress directly, not age-since-animation-start.
- **Must prove:** Frozen/scaled/deferred/active/recovery states, bosses current policy and dead targets; Radar never advances or predicts AI.

<a id="item-trajectory-base"></a>

## C49. Field Trajectory — `trajectory-base` · **Keep: short honest forecast**

- **See / infer:** open origin, short dotted arc, no terminal analysis hardware.
- **Power:** current short path to first current solid, complete basic direction/power understanding.
- **Physics:** same equation/profile as actual launch, including relevant loadout forces in its horizon. Does not change motion.
- **Phrase:** line appears promptly → geometry updates immediately with input → clears on cancel. No long draw-on animation.
- **Juice:** 0 particles/audio per sample.
- **Proof:** actual flight agreement in shown interval, Halo/Volt conditions, obstacle clipping, no stale old line on rapid retarget.

### Icon and receipt

- **Unique icon construction:** Short sampled flight line from open origin; no enemy guarantee.
- **Receipt:** show the actual benefit/condition/cost from this card and the resolved policy; remove the replaced generic claim atomically. Icon never supplies the only status/control information.

### Harmony boundary

- **Outward contribution:** Actual composed launch/known forces sampled in its real horizon
- **Protect:** No paid accuracy, extra steering or unsupported bounce line

### Implementation and regression gate

- **Hook / migration:** INFO/MOVE: preserve free short accurate forecast, current assistance path and known-force horizon. Call same launch solver in readonly mode without integrating live bodies.
- **Must prove:** Existing30-tick launch-agreement fixtures, no assist twice or extra RNG/world.clock advance, cancel does not commit.

<a id="item-trajectory-1"></a>

## C50. Vector Lens — `trajectory-1` · **Keep: longer known horizon**

- **See / infer:** extended lens barrel/long arc in its unique icon.
- **Power:** current longer forecast with the same accuracy in overlapping intervals. No fabricated percentage if code uses sample/tick settings.
- **Physics:** reports actual curve, does not add launch range or speed. Stops at first current solid as before.
- **Phrase:** lens seats → dashed baseline endpoint highlights added horizon once → all samples update together.
- **Juice:** 0 particles; one equip click, no per-dot sounds.
- **Proof:** short versus extended horizon, early obstacle, current conditional motion and no inherited Impact/Oracle data after tier downgrade.

### Icon and receipt

- **Unique icon construction:** Extended sampled line with clear horizon end; no physical range arrow.
- **Receipt:** show the actual benefit/condition/cost from this card and the resolved policy; remove the replaced generic claim atomically. Icon never supplies the only status/control information.

### Harmony boundary

- **Outward contribution:** Same profile/snapshot as Pointer corridor; source-specific conditional boundaries explained
- **Protect:** No longer physical dash merely because display is longer

### Implementation and regression gate

- **Hook / migration:** INFO: extend supported forecast horizon through existing sensor tier rule; use same snapshot/solver and uncertainty policy. No physical reach benefit.
- **Must prove:** Baseline portion identical to free tier, capped samples, moving target uncertainty and no post-obstruction promise.

<a id="item-trajectory-2"></a>

## C51. Impact Lens — `trajectory-2` · **Keep: first-impact timing**

- **See / infer:** lens, time notches and a distinct terminal bracket.
- **Power:** current longer path/time ticks/current-snapshot first-impact marker.
- **Physics:** no prediction after unsupported bounce; no fake collision when no hit exists within horizon. An enemy may move later.
- **Phrase:** terminal marker seats once when a real estimate exists → follows recalculation immediately → opens when there is no estimate.
- **Juice:** 0 particles; marker acquisition sound normally silent or strongly rate-limited. No flashing target-lock animation.
- **Proof:** actual units/timing, no-impact state, moving snapshots, Prism Pointer width overlay and authoritative clipping. No predicted splash/burn guaranteed merely because the line passes nearby.

### Icon and receipt

- **Unique icon construction:** Sampled line ending at an impact tick with time marks.
- **Receipt:** show the actual benefit/condition/cost from this card and the resolved policy; remove the replaced generic claim atomically. Icon never supplies the only status/control information.

### Harmony boundary

- **Outward contribution:** Accepted estimate reads composed geometry/solids, with uncertainty for moving enemies
- **Protect:** No guaranteed secondary splash/echo victim or fake terminal impact

### Implementation and regression gate

- **Hook / migration:** INFO: add actual current first-impact estimate/time ticks from profile and static scene; mark unsupported future dynamic outcomes uncertain.
- **Must prove:** Wall before enemy, near/far range, time labels under aim pace, no guaranteed future replay/secondary hit or physics step.

<a id="item-trajectory-3"></a>

## C52. Oracle Lens — `trajectory-3` · **Keep: longest explicit analysis**

- **See / infer:** split analysis lens, long curve, terminal bracket and speed slash in its icon. No tiny numerals required to recognize it.
- **Power:** current longest path, marker, speed/angle/estimated time; label estimate/current snapshot honestly.
- **Physics:** no future AI, homing or forecast beyond supported collisions. Volt's temporary boost needs real-profile sampling; Tide's post-bank change remains outside the unsupported bounce forecast.
- **Phrase:** instrument layers seat once → stable fixed-width numbers update at readable frequency while geometry stays current → clears on cancel.
- **Juice:** 0 particles, no digit clicks or analysis hum.
- **Proof:** value source agreement, conditional profiles, horizon/no-impact states, small-screen readability and no extra real-world physics steps for display.

### Icon and receipt

- **Unique icon construction:** Long sampled line with calibrated angle/time bracket and uncertainty break.
- **Receipt:** show the actual benefit/condition/cost from this card and the resolved policy; remove the replaced generic claim atomically. Icon never supplies the only status/control information.

### Harmony boundary

- **Outward contribution:** Exposes actual resolved speed/angle/time; predicts only supported known horizon
- **Protect:** No changing physics to satisfy display or future-AI/bounce guarantee

### Implementation and regression gate

- **Hook / migration:** INFO: expose longest supported analysis and true resolved values. Bound cached samples and invalidate on actual launch/geometry changes, not every draw.
- **Must prove:** Launch vector/time/angle parity, viewport/quality doesn't change combat hash, long-session cache bound and unsupported bounce never shown certain.

<a id="item-twilight"></a>

## C53. Twilight Undercut — `twilight` · **Keep: neutral reference stage**

- **See / infer:** muted plum industrial layers, no powered rail equipment. This is the finished baseline.
- **Power / physics:** current standard collision, spawns, forces/resources; no affinity bonus and no free-world penalty.
- **Phrase:** short local backdrop seat on selection, then stable scenery. Contact material contributes only under the foreground attack's shared cue.
- **Juice:** 0 extra ambient/affinity particles. Existing quiet environment details must not compete with meaningful attack debris.
- **Proof:** every elemental power remains legible without bloom; compare the same encounter under the same inputs. Changing world for a future run cannot leave another world's modifier attached.

### Icon and receipt

- **Unique icon construction:** Quiet plum rail/cube silhouette with no powered affinity circuit.
- **Receipt:** show the actual benefit/condition/cost from this card and the resolved policy; remove the replaced generic claim atomically. Icon never supplies the only status/control information.

### Harmony boundary

- **Outward contribution:** Neutral rim/contact contrast, no extra stage power or ambient emitter
- **Protect:** Free kit readability, status colors and baseline physics

### Implementation and regression gate

- **Hook / migration:** RULE/ART: retain neutral world rules/geometry, apply calm rim/contrast through world adapter only. No stat invented to match paid worlds.
- **Must prove:** Every attack readable, no previous world affinity leakage after new run; stage/preview cannot change spawn seed or collisions.

<a id="item-tokyo"></a>

## C54. Cyber Tokyo — `tokyo` · **Replace speed score: charged rail circuit**

- **See / infer:** actual blue skyline/neon wiring gains a restrained conductive stripe on the existing rail frame; not an invisible passive.
- **New power:** first accepted earned rail rebound per shot gets **+5% outgoing speed**, within the existing legal ceiling. Replace +8% speed score. Prototype combined **new** world/Tide/Thruster positive bank gain limit: **12%**, applied once, with existing kinetic/Hyper rules reviewed separately.
- **Physics:** real rebound change, no wind, auto-homing or speed from idle wall contact. Do not alter collision geometry or previously earned speed.
- **Phrase:** rail segment is visibly wired before contact → tiny current catch at actual bank → same segment settles; foreground nozzles/splash own the main motion.
- **Juice:** 0 extra particles; one short rail-line graphic, at most 100ms. No city strobe or constant electrical rain.
- **Proof:** valid/unearned contact, cap, same-shot repeat and unchanged danger colors. Show measured incoming/outgoing vectors in preview.

### Icon and receipt

- **Unique icon construction:** Skyline rail carrying one conductive bank stripe; not a lightning-damage bolt.
- **Receipt:** show the actual benefit/condition/cost from this card and the resolved policy; remove the replaced generic claim atomically. Icon never supplies the only status/control information.

### Harmony boundary

- **Outward contribution:** Actual accepted World bank contribution shares current line with hardware/body response
- **Protect:** No city strobe, random wind or duplicate jet/electric burst

### Implementation and regression gate

- **Hook / migration:** RULE/RUN/MOVE/ART: replace8% speed score with first-earned-bank-per-shot5% contribution under combined12% policy. Real rail event owns one current line; reset shot flag only on accepted launch.
- **Must prove:** Unqualified/corner/repeated contact, zero marginal cap, Thrusters/Tide/Hyper, no old score and unchanged rails/spawns.

<a id="item-foundry"></a>

## C55. Blood Foundry — `foundry` · **Replace armor score: forge priming**

- **See / infer:** existing hot pipe/furnace scene gains a visible safe furnace-channel stripe on eligible rails. This primes a tool, not a damaging lava floor.
- **New power:** an earned rail rebound arms **one Forge charge for 45 ticks**. The next eligible primary nonboss armor contact consumes it for **+1 plate**, under the shared extra-plate cap. Replace +12% armor score; refresh one charge, never stack. Floor landing alone does not prime.
- **Physics:** real plate result; no player gravity/temperature simulation, automatic burn or environmental contact damage. Bosses/protected targets remain excluded and do not silently eat a paid charge.
- **Phrase:** channel receives the bank → one small heated notch appears on the active edge → actual armor hit consumes it → tool returns to normal. Don't overlay fire on every equipped attachment.
- **Juice:** 0 on charge, **up to 2** small metal pin-sparks within the shared contact. No furnace smoke curtain.
- **Proof:** expiry, no armor, excluded boss, duplicate bank, combined Glass/Crown cap. World geometry and spawn timing remain identical.

### Icon and receipt

- **Unique icon construction:** Forge pipe feeding one rail-to-tool charge notch; no lava hazard floor.
- **Receipt:** show the actual benefit/condition/cost from this card and the resolved policy; remove the replaced generic claim atomically. Icon never supplies the only status/control information.

### Harmony boundary

- **Outward contribution:** Actual Forge charge gets one hot tool notch; Lava/Ember heat sources remain individually legible
- **Protect:** No permanent flame tint, hot floor damage or extra hidden plate multiplication

### Implementation and regression gate

- **Hook / migration:** RULE/RUN: replace12% armor score with one45-tick bank-prime charge and next eligible nonboss primary plate contribution. Consume on declared eligible contact with cap provenance; no stored stack.
- **Must prove:** Floor-only no prime, expiry, duplicate bank, boss excludes/doesn't eat charge, cap-limited charge policy, no old score and no environmental burn.

<a id="item-manga"></a>

## C56. Manga Paper — `manga` · **Replace multi-cut score: panel continuation**

- **See / infer:** actual warm page and sparse ink panels frame consecutive actions as one sequence.
- **New power:** **+12 chain grace ticks after qualifying primary kills**, under the shared +36 cap. Replace +10% multi-cut score. No altered physical time or “pause the world” panel effect.
- **Physics:** real chain clock only; player/enemy motion and collisions stay normal.
- **Phrase:** one small cropped panel corner seats near the chain indicator on extension → remains a thin handoff notch only while relevant → clears at chain break. No new boxes around every enemy or whole-screen black/white flash.
- **Juice:** 0 particles. One shared chain/page-click at most; equipped Ears/Smug/Spectrum cannot each add another panel animation.
- **Proof:** late continuation and cap saturation, no secondary-proc chain extension, no physics stop. Hatching remains static/background only; red hazards and existing cut halves keep their normal readability.

### Icon and receipt

- **Unique icon construction:** Cropped paper panel corner next to one chain handoff tick.
- **Receipt:** show the actual benefit/condition/cost from this card and the resolved policy; remove the replaced generic claim atomically. Icon never supplies the only status/control information.

### Harmony boundary

- **Outward contribution:** Real chain handoff gets one cropped UI/panel notch; Ink/Comic use existing ink context
- **Protect:** No full-screen flash, time pause, wall of speed lines or damage from hatching

### Implementation and regression gate

- **Hook / migration:** RULE/RUN/ART: replace10% multi-score with12 direct-kill chain ticks under36 cap. One HUD panel corner follows accepted extension without camera/time change.
- **Must prove:** Late chain continuation, saturation, child kills excluded, chain break cleanup; no old multi score or full-screen panel flash.

<a id="item-synth"></a>

## C57. Synthwave Grid — `synth` · **Keep recovery: visible charging grid**

- **See / infer:** actual perspective grid acts as a coherent low-key energy circuit, not a scrolling floor.
- **Power:** current +15% eligible passive FOCUS recovery under shared cap. This is a useful simple option; no rhythm minigame or automatic regen from a music beat.
- **Physics:** body motion/geometry unchanged. Resource amount follows actual dt/eligibility, never displayed pulses.
- **Phrase:** on meaningful recovery entry, **one** short grid segment aligns toward the resource inset → small charge-notch holds steady → clears at aim/full. Sunset/mountains stay quiet.
- **Juice:** 0 particles. No endless perspective motion, pulsing sky or constant synth loop.
- **Proof:** lower-to-full recovery comparison, aiming stops recovery, saturated builds show marginal value accurately. Notched/Orbit/Glitch combine to one resource response, not four inward particle streams.

### Icon and receipt

- **Unique icon construction:** Perspective grid with one bounded inward recovery segment; no rhythm note.
- **Receipt:** show the actual benefit/condition/cost from this card and the resolved policy; remove the replaced generic claim atomically. Icon never supplies the only status/control information.

### Harmony boundary

- **Outward contribution:** Actual recovery source contributes one aligned grid/resource mark, no extra inward particle stream
- **Protect:** No music-beat FOCUS, scrolling floor physics or constant sunset pulse

### Implementation and regression gate

- **Hook / migration:** RULE/RUN/ART: retain15% eligible recovery under40 cap. One fitted background-to-resource notch on recovery entry; backdrop pulse cannot grant FOCUS.
- **Must prove:** Full/held/capped recovery, same geometry/spawns, no perpetual animation/audio and no grant from music beat.

<a id="item-void"></a>

## C58. Pro Void — `void` · **Replace boss score: recoil sink**

- **See / infer:** negative-space eclipse/boundaries absorb a heavy boss contact, not all nearby matter.
- **New power:** on the first surviving **Landlord/monolith primary armor contact per shot**, reduce the existing recoil component by **30%**. Replace +15% boss score. With Chamfer, use the stronger applicable recoil reduction, not their sum.
- **Physics:** preserve incoming earned momentum/ceiling; modify only the known armor shove component. No boss damage increase, phasing, projectile absorption or global gravity pull.
- **Phrase:** a small pale contact rim contracts inward with actual reduced recoil → settles in ≤140ms. Decorative distant eclipse stays distant; only equipped Void Dash creates a real local collapse field.
- **Juice:** 0 additional particles; one short dry low contact answer, not a bass drone or screen blackout.
- **Proof:** measured boss recoil versus neutral stage, ordinary enemy unaffected, no repeated payoff, dark character/hazards visible. Boss damage/phase rules are unchanged.

### Icon and receipt

- **Unique icon construction:** Negative-space eclipse above a pale contracting boss-contact rim; not local collapse ring.
- **Receipt:** show the actual benefit/condition/cost from this card and the resolved policy; remove the replaced generic claim atomically. Icon never supplies the only status/control information.

### Harmony boundary

- **Outward contribution:** Real recoil-sink contact uses short inward rim; active Void field stays a separate local object
- **Protect:** No background gravitational damage, hidden hazards or black-on-black player

### Implementation and regression gate

- **Hook / migration:** RULE/RUN/MOVE: replace15% boss score with first surviving primary boss armor recoil reduction30% per shot. Choose stronger of eligible recoil reducers; only scale armor shove component.
- **Must prove:** Boss surviving/contact/dedup, ordinary enemy unaffected except its own Chamfer, phase restrictions, Hyper preimpact momentum and no old score or local field.

<a id="item-dash-auto"></a>

## C59. `dash-auto` — Adaptive Dash / neutral complete baseline

- **Appearance → power:** an open forward wedge, clean Cube and core-accented root signal ordinary launch/cut. Adaptive does not grant the explicit elemental effects that its tint resembles.
- **Mechanics:** retain ordinary launch velocity, primary window, collision/health/resources. No freeze, burn, relay, field or replay from material selection.
- **Shared phrase:** immediate legal release → short neutral travel wedge → true bank/contact compression → settle. Any preparation is visual response, never added input delay. Core changes only small neutral sockets.
- **Icon/preview/proof:** Cube in open wedge; compare real miss, cut, armor survivor and bank. All 7 cores stay neutral in source logs; free aim remains complete.

### Ornament limit / stop rule

0–2 neutral flecks; no literal fire/ice/void material disguise. Protected actual attacks/status are separate; shared scene budget can reduce ornament further.

### Icon and receipt

- **Unique icon construction:** Solid Cube inside open neutral forward wedge; no literal element glyph.
- **Receipt:** show the actual benefit/condition/cost from this card and the resolved policy; remove the replaced generic claim atomically. Icon never supplies the only status/control information.

### Harmony boundary

- **Outward contribution:** Picks supported core accent on neutral geometry; mounts/finish still compose
- **Protect:** Cannot impersonate a literal bought elemental power

### Implementation and regression gate

- **Hook / migration:** RULE/ART/INFO: keep normal launch/cut with neutral adaptive accent only. Explicit power eligibility cannot be inferred from core tint/material; eliminate literal paid-element silhouettes in Adaptive.
- **Must prove:** All 7 cores, no burn/freeze/relay/field/replay source from neutral Dash; baseline speed and free control readability preserved.

<a id="item-dash-ink"></a>

## C60. `dash-ink` — Ink Dash / Brush Cutter

- **Appearance → power:** broad brush nib and dry bristle gaps mean wider contact, not a persistent ink hazard.
- **Mechanics:** replace old+1 tick with+12% primary corridor width, within B8 positive-width policy. Baseline velocity/gravity/retention and same-target shot dedup remain.
- **Shared phrase:** leading nib gathers at aim → one broad cream/dark traveled stroke → perpendicular dry fibers at true contact → back-to-front taper. No floor stain or drops continuing after recovery.
- **Icon/preview/proof:** wide nib/comet, distinct from Katana's long brush blade. Offset target hit versus neutral miss, no hurtbox growth or extra same-target hit; wall/diagonal/high-speed sweep.

### Ornament limit / stop rule

2–4 dry fibers; 120ms taper, no drops/stain persisting on floor. Protected actual attacks/status are separate; shared scene budget can reduce ornament further.

### Icon and receipt

- **Unique icon construction:** Broad forward nib/comet with dry rear bristle gaps; not long Katana blade.
- **Receipt:** show the actual benefit/condition/cost from this card and the resolved policy; remove the replaced generic claim atomically. Icon never supplies the only status/control information.

### Harmony boundary

- **Outward contribution:** Slash contact joins the same traveled stroke where compatible; shell affects only root/substrate
- **Protect:** No ink hazard, endless stain or all-body paper recolor

### Implementation and regression gate

- **Hook / migration:** RULE/RUN/INFO: replace+1 generic tick with12% width contribution to resolved primary geometry under declared cap/order. Shared traveled brush samples supply bounded native ornament.
- **Must prove:** Offset target extra contact, same target once, high-speed sweep/obstruction, no hurtbox enlargement or persistent ink hazard; old tick removed.

<a id="item-dash-fire"></a>

## C61. `dash-fire` — Ember Dash / Combustion Rush

- **Appearance → power:** pale-hot leading seam/orange outside means contact ignition and delayed heat, not another score tint.
- **Mechanics:** replace old+2 ticks. First primary contact ignites its surviving eligible nonboss victim plus at most2 eligible nonboss neighbors within56 with static sight. Burn deals1 secondary armor/health unit at+18 and+36 world ticks then ends. No stacked intensity; reapplication may refresh bounded expiry but never creates immediate extra ticks or a permanent self-refresh. Ordinary Fang/Crown/Bastion use normal damage/phase rules; protected tutorial actors and bosses excluded. Primary width.90 is the tradeoff; no extra player propulsion.
- **Shared phrase:** brief launch ignition → sparse detached embers inheriting actual velocity → one contact flame lip → tiny steady target burn seam. Real damage tick contracts seam, no continuous emitter; death/expiry clears it.
- **Icon/preview/proof:** tapered ignition flame; surviving armor later loses actual units, neighbor inside/outside56, static blocker, reapply and target-death cases. Burn cannot ignite, charge Echo, relay or gain primary resources.

### Ornament limit / stop rule

3–5 launch/contact embers total; steady tiny burn seam, no continuous emitter. Protected actual attacks/status are separate; shared scene budget can reduce ornament further.

### Icon and receipt

- **Unique icon construction:** Short ignition cone beside a target-attached burn seam; no full-body flame.
- **Receipt:** show the actual benefit/condition/cost from this card and the resolved policy; remove the replaced generic claim atomically. Icon never supplies the only status/control information.

### Harmony boundary

- **Outward contribution:** Powered seams can acknowledge real heat; burn status/contact source remains distinct from Lava charge
- **Protect:** No extra ignition from core color, continuous ember hose or recursive burn

### Implementation and regression gate

- **Hook / migration:** RULE/RUN: replace+2 ticks with first-primary Ignite policy, two world-deadline burn ticks and bounded sight-checked neighbor selection. Snapshot source/target generation, damage policy and ownership; no recursive proc.
- **Must prove:** Ticks18/36 once including fractional dt, maximum2 neighbors within56, wall/boss/dead target/reapply edge, width tradeoff, no old duration or burn-on-burn.

<a id="item-dash-lightning"></a>

## C62. `dash-lightning` — Volt Dash / Arc Lance

- **Appearance → power:** narrow angular lance, wider travel-sample gaps and an actual connected victim arc mean a brief burst plus conduction.
- **Mechanics:** replace speed-score. Ordinary launch burst+12% for4 ticks; over next6 remove only its own temporary excess, never bank/Hyper momentum or speed already beyond its ordinary boost band. Primary width.85. First primary contact may relay1 secondary unit to one eligible neighbor within120/static sight. With Coil, shared ledger permits at most2 distinct relay victims, never two hits on one neighbor. Coil retains its longer-range eligibility.
- **Shared phrase:** compact terminal prepares → sharp lance releases → authored sparse angular rails → actual accepted link connects real victims → old sparks keep old vectors on bank. No target homing, teleport or constant buzz.
- **Icon/preview/proof:** split terminal/lance; measured time-to-position and corridor cost, no-neighbor, blocked link, Coil dedup, fast bank/Hyper and tunneling fixtures.

### Ornament limit / stop rule

1 connected arc + 0–2 pins; ≤100ms decorative crackle, no endless rail zigzags. Protected actual attacks/status are separate; shared scene budget can reduce ornament further.

### Icon and receipt

- **Unique icon construction:** Narrow angular lance linked to one neighbor node; speed gap plus relay.
- **Receipt:** show the actual benefit/condition/cost from this card and the resolved policy; remove the replaced generic claim atomically. Icon never supplies the only status/control information.

### Harmony boundary

- **Outward contribution:** Viper/tail motion follows real burst; Coil connection shares conduction ledger/cue
- **Protect:** No two relay hits on one victim or lost bank speed during boost removal

### Implementation and regression gate

- **Hook / migration:** RULE/RUN/MOVE: remove speed-score; solve12% ordinary burst4 plus removal of only own excess over6; shared Coil/Volt conduction ledger for first primary contact. Source offsets never edit stored bank velocity blindly.
- **Must prove:** Time-to-position, zero/existing faster momentum, Hyper/bank preservation, tunnel sweep, no-neighbor and two distinct max relay victims; no old speed score.

<a id="item-dash-ice"></a>

## C63. `dash-ice` — Frost Dash / Rime Breaker

- **Appearance → power:** solid forward facets and a stable target cold rim mean real motion control, not scattered cosmetic diamonds.
- **Mechanics:** replace aim discount. Once per shot cold burst affects struck survivor plus at most1 eligible neighbor within60/static sight. Ordinary small Fang freezes locomotion and its own windup initiation/progression for18 world ticks; already emitted hazards continue. Heavy nonboss locomotion factor.70 for24, tell unaffected. Boss initially resists. Actual thaw starts90 world-tick cold immunity; repeat hits cannot extend freeze through it. Player physics unchanged.
- **Shared phrase:** clear leading facet → true cold contact → sparse chips → persistent shape-coded cold state → real thaw. Riot/Lava roots can stay warm without converting cold to melt damage.
- **Icon/preview/proof:** facet collar with stop-notch; moving/telling Fang stops, heavy remains active but slower, boss/needle unaffected, range/wall/immunity and Time strongest-status tests.

### Ornament limit / stop rule

2–4 chips on contact, steady status rim; 2 chips on actual thaw only if budget permits. Protected actual attacks/status are separate; shared scene budget can reduce ornament further.

### Icon and receipt

- **Unique icon construction:** Leading facet wedge beside a closed motion-stop rim; no Time clock.
- **Receipt:** show the actual benefit/condition/cost from this card and the resolved policy; remove the replaced generic claim atomically. Icon never supplies the only status/control information.

### Harmony boundary

- **Outward contribution:** Crystal contact skin fits Slash shape; sensors show actual freeze/thaw/tell state
- **Protect:** Cannot turn every core/feather into an ice projectile or stack time multipliers

### Implementation and regression gate

- **Hook / migration:** RULE/RUN/AI: replace aim discount with once-per-shot survivor+one-neighbor cold. Track Fang freeze18, heavy slow.7 for24, post-thaw immunity90 on world clock. Separate hazard update and protected boss policy.
- **Must prove:** Nearby60/sight, repeated hit immunity, frozen tell versus heavy tell, active needle continues, Time strongest choice and safe dt0; no retained drain discount.

<a id="item-dash-water"></a>

## C64. `dash-water` — Tide Dash / Undertow Bank

- **Appearance → power:** asymmetric liquid crest flattens on the actual surface; detached drops continue incoming direction while new flow follows outgoing bank.
- **Mechanics:** replace recovery perk. One earned bank per shot requests up to8% outgoing tangent-only gain, no added normal impulse, under B8 combined12% new-bank policy/legal ceilings. First primary contact OR first accepted bank, whichever happens first, emits one pressure splash: at most2 eligible light nonboss enemies within64, pushed away from real origin across4 ticks, ≤24 total units each. Collision/leash aware, no damage/healing/invulnerability or passive slippery floor.
- **Shared phrase:** low crest prepares → short unequal leading/trailing flow → one flattened contact lip → drops die quickly, no puddle/ribbon curtain. Enemy pressure visualization follows actual displacement.
- **Icon/preview/proof:** crest bent around surface corner; tangent/normal vectors, denied second splash, heavy resistance, wall-safe push and no wall-rub farming.

### Ornament limit / stop rule

One crest + 2–4 droplets; no continuous ribbon, floor puddle, curtain or drips. Protected actual attacks/status are separate; shared scene budget can reduce ornament further.

### Icon and receipt

- **Unique icon construction:** One crest bending along a surface corner; tangent flow and pressure lip.
- **Receipt:** show the actual benefit/condition/cost from this card and the resolved policy; remove the replaced generic claim atomically. Icon never supplies the only status/control information.

### Harmony boundary

- **Outward contribution:** Incoming drops/outgoing wave preserve real vectors; Thruster/World use one bank phrase
- **Protect:** No second fake splash, permanent wet floor or free conductivity damage

### Implementation and regression gate

- **Hook / migration:** RULE/RUN/MOVE: replace recovery perk with actual normal/forward pressure and one earned tangent-bank adjustment. Shared bank solver accounts Tide/Tokyo/Thrusters once and shows marginal gain.
- **Must prove:** Small/heavy/boss force, walls/corners, no idle farm, max-speed retention and combined12% cap; no old recovery perk or second splash impulse.

<a id="item-dash-void"></a>

## C65. `dash-void` — Void Dash / Collapse Well

- **Appearance → power:** transparent outer force boundary and much smaller pale-keylined core distinguish pull from damage.
- **Mechanics:** replace armor-score. First primary contact can admit one18-world-tick field, radius110, at most3 eligible movable nonboss survivors, deterministic selection, ≤32 total displacement each with solids/leash respected. At expiry, eligible targets actually within28 take1 secondary unit once. No outer-ring damage, boss execute, projectile absorption or player phase. Source cooldown36. **One-live-field admission replaces older wording that a new field evicts an accepted older one.** No early payout on cancel/dispose.
- **Shared phrase:** compact keylined travel crescent → field at actual contact origin → sparse inward cues only on affected targets → one small real expiry pulse → quiet. No screen tunnel/blackout.
- **Icon/preview/proof:** large open ring/small core; inner/outer targets, blocked pull, resistant boss, Grav overlap, deadline/pulse once and field cleanup.

### Ornament limit / stop rule

Clear field boundary + at most 3 inward flecks; no dark fog or orbit tunnel. Protected actual attacks/status are separate; shared scene budget can reduce ornament further.

### Icon and receipt

- **Unique icon construction:** Large open force ring enclosing a much smaller core dot; distinguishes pull/damage radii.
- **Receipt:** show the actual benefit/condition/cost from this card and the resolved policy; remove the replaced generic claim atomically. Icon never supplies the only status/control information.

### Harmony boundary

- **Outward contribution:** Grav/source trim differentiates continuous aim pull from contact field; victims show actual force
- **Protect:** No camera tunnel, whole-scene blackout or larger hidden pulse

### Implementation and regression gate

- **Hook / migration:** RULE/RUN/AI: remove armor-score; admit one bounded18-tick contact field under card's source/radius/pulse rules. Integrate custom enemy force with walls/leash; pull and pulse are separate from source ornament.
- **Must prove:** No valid contact, inside/outside true radius, expiry/pulse once, bosses/solid blockers, Grav overlap/cap and no recursive kill procs; no old score bonus.

<a id="item-dash-echo"></a>

## C66. `dash-echo` — Echo Dash / Reprise Stroke

- **Appearance → power:** one thin stored stroke becomes an active cutting plane later; the solid player never rewinds or duplicates physically.
- **Mechanics:** replace12 chain ticks. Record actual traveled path, max140 units/6 samples, clipped at static solids and first discontinuity. After12 world ticks replay once; max2 eligible targets,1 secondary unit each. It may hit a surviving primary victim once under its distinct source ID. Respect boss phases/damage rules; no primary resources, Coil, burn or replay recursion. Shared delayed-source admission follows B6; mutable path buffers stay owned until replay disposal.
- **Shared phrase:** small source offset → pending old-world-path outline → true delayed plane → sparse harmless geometric dissolve, no opaque clone stack.
- **Icon/preview/proof:** separated solid/outline strokes with delay notch; late-arriving victim hit, target beside current player but outside old path safe, wall/bank clipping and core/sword source distinction.

### Ornament limit / stop rule

One pending outline, one real replay; 0–2 dead fragments, no three opaque heroes. Protected actual attacks/status are separate; shared scene budget can reduce ornament further.

### Icon and receipt

- **Unique icon construction:** Separated solid launch stroke and outlined recorded path with a delay notch.
- **Receipt:** show the actual benefit/condition/cost from this card and the resolved policy; remove the replaced generic claim atomically. Icon never supplies the only status/control information.

### Harmony boundary

- **Outward contribution:** Core/sword echo contours differentiated; tail/finish residue remains subordinate
- **Protect:** No decorative clone hitbox, moving replay source or dropped promised attacks

### Implementation and regression gate

- **Hook / migration:** RULE/RUN: remove12 grace ticks; record bounded real traveled samples/collision-aware path once, schedule one replay with source ownership and hit-once ledger. No live-target tracking or pooled mutable path reuse.
- **Must prove:** Miss path, replay timing/caps/blockers, original target again under explicit secondary rules, rapid-launch capacity, core/sword distinction and no old grace.

<a id="item-razor"></a>

## C67. `razor` — White Razor / Clean Reference Cut

- **Appearance → power:** clean pale reference edge, no hidden penalty or weaker free controls.
- **Mechanics:** ordinary resolved sword geometry/window and hit-once rules. Existing halves/decals/result handling remains.
- **Shared phrase:** crisp release edge → true material contact → short settle; no ambient slash at idle. Selected Dash keeps its native contact meaning.
- **Icon/preview/proof:** single tapered white edge; miss/cut/armor survivor, baseline geometry unchanged and no damage after expiry.

### Ornament limit / stop rule

2–3 contact chips, no lingering slash at idle. Protected actual attacks/status are separate; shared scene budget can reduce ornament further.

### Icon and receipt

- **Unique icon construction:** One clean tapered white cutting edge; neutral reference.
- **Receipt:** show the actual benefit/condition/cost from this card and the resolved policy; remove the replaced generic claim atomically. Icon never supplies the only status/control information.

### Harmony boundary

- **Outward contribution:** Clean material contact lets Dash consequence speak; baseline weapon hardware still material-fitted
- **Protect:** No weak/inaccurate free hitbox or duplicate finish aura

### Implementation and regression gate

- **Hook / migration:** RULE/ART: retain reference geometry and normal active edge; neutral weapon root still receives shell/core fitted construction. No bonus needed to complete the baseline.
- **Must prove:** Compare default attack envelope/window/damage and after-expiry drawing; no extra curved arc beneath another selected finish.

<a id="item-katana"></a>

## C68. `katana` — Katana Ink / Draw-Cut

- **Appearance → power:** a long, relatively straight tapered line with dry broken rear edge means deliberate reach at a width cost, not the same large semicircle as Comic.
- **Mechanics:** replace+2 ticks with reach1.15/width.85 relative to family reference; B8 absolute geometry/reach cap applies. Normal primary timing/dedup, no player spin/propulsion or extra bleed.
- **Shared phrase:** tip aligns during aim → narrow draw-cut → one dry normal-directed breakup → short clearly dead seam. Native Dash element stays on actual leading region, shell affects only mount/substrate.
- **Icon/preview/proof:** long brush blade with bristle notch, not Ink Dash comet; aligned farther target hit, nearby lateral target missed; obstruction and family/head/core combinations.

### Ornament limit / stop rule

2–4 brush flecks; dead seam clears in ≤150ms, no dripping ink. Protected actual attacks/status are separate; shared scene budget can reduce ornament further.

### Icon and receipt

- **Unique icon construction:** Long narrow brush blade with one broken bristle notch; distinct from Dash nib.
- **Receipt:** show the actual benefit/condition/cost from this card and the resolved policy; remove the replaced generic claim atomically. Icon never supplies the only status/control information.

### Harmony boundary

- **Outward contribution:** Root wrapping uses shell; element sits on true leading region; sparse native brush breakup
- **Protect:** No huge crescent hiding narrow geometry or paper particles replacing every element

### Implementation and regression gate

- **Hook / migration:** RULE/RUN/INFO: remove old+2 generic ticks when long/narrow Draw-Cut profile enables. Resolve range/width and source window once; ART is one actual leading draw-cut with short dead brush residue.
- **Must prove:** Near-long target, lateral miss, obstruction, rapier/head/core combinations, no old+2 accidentally retained or double family dimension multiplication.

<a id="item-laser"></a>

## C69. `laser` — Neon Laser / Line Thrust

- **Appearance → power:** fitted emitter and rigid straight pale core/cyan shell mean an obstructed forward thrust, never a cosmetic beam over a harmful old arc.
- **Mechanics:** replace+3 generic ticks; reach1.25/width.65 versus family reference. Six-tick BASE active gate composes extensions under B4, including Ghost and long-window families. Static solids clip line; surviving eligible armor blocks forward victims for that tick. Killed light target can permit another, max2 primary victims per shot/thrust. Preserve per-victim cut grace/armor safety; no teleport or fake penetration.
- **Shared phrase:** short emitter flare → exact active straight core → small terminal contact → clearly harmless broken scar. When gate closes, no live curved follow-up remains. B4 governs examples6/12/16 ticks, not universal hard-six expiry.
- **Icon/preview/proof:** straight ray with collar; near/off-axis/behind-armor cases, walls, family/upgrade ticks once, gate boundary, no residual scar damage.

### Ornament limit / stop rule

Thin active core, 1–2 contact sparks; dead scar ≤150ms, no looping beam. Protected actual attacks/status are separate; shared scene budget can reduce ornament further.

### Icon and receipt

- **Unique icon construction:** Straight ray emerging from emitter collar and ending at solid stop tick.
- **Receipt:** show the actual benefit/condition/cost from this card and the resolved policy; remove the replaced generic claim atomically. Icon never supplies the only status/control information.

### Harmony boundary

- **Outward contribution:** Hardware emitter remains fitted to sword family; element colors only permitted edge/collar
- **Protect:** No old active arc, fake penetration, doubled source or harmful dead scar

### Implementation and regression gate

- **Hook / migration:** RULE/RUN/INFO/ART: replace old+3 generic ticks with straight obstructed Line Thrust and B4 gate. Combat uses same swept/ray geometry as preview, not old curved arc with laser painting.
- **Must prove:** Standard6/Ghost12/Glacier16 absent other modifiers, negative family/upgrade deltas once, wall at ray boundary, high speed, exact active expiry and no dead scar damage.

<a id="item-glitch-fx"></a>

## C70. `glitch-fx` — Glitch Tear / Fault Split

- **Appearance → power:** one local stepped fault attached to a contacted plate, not frame-wide offset noise.
- **Mechanics:** replace+2 ticks. First eligible nonboss primary armored survivor per shot receives one delayed secondary armor chip at+6 world ticks. Max1 fault per target; secondary cannot schedule a fault. Boss/protected/invulnerable targets excluded; normal damage acceptance is rechecked at execution; death/despawn cancels. Primary geometry stays resolved sword geometry.
- **Shared phrase:** small source seam → attached fault → one actual delayed plate answer → short rectangular dead breakup. No gameplay/frame discontinuity or periodic chip loop.
- **Icon/preview/proof:** offset stepped slit; survivor loses unit at+6, death before timer yields none, duplicate marks denied and boss resists.

### Ornament limit / stop rule

Seam plus 2–3 rectangular fragments at real chip; no frame-wide offset/jitter. Protected actual attacks/status are separate; shared scene budget can reduce ornament further.

### Icon and receipt

- **Unique icon construction:** Two offset parallel plate slits around one small delay notch; not Glitch X eyes.
- **Receipt:** show the actual benefit/condition/cost from this card and the resolved policy; remove the replaced generic claim atomically. Icon never supplies the only status/control information.

### Harmony boundary

- **Outward contribution:** Hologram/Glitch integrate a clean fitted seam; accepted delayed chip owns its pulse
- **Protect:** No global distortion, duplicate delay timers or extra primary contacts

### Implementation and regression gate

- **Hook / migration:** RULE/RUN: remove old+2 ticks; on first eligible primary armor contact attach one delayed fault under card's damage eligibility. Mark source before scheduling; child contact cannot attach another fault.
- **Must prove:** Survivor/death/expiry/boss, exactly one delayed chip at deadline, repeated collision, phase/immunity rules, no global frame tear or generic duration residue.

<a id="item-confetti"></a>

## C71. `confetti` — Gold Confetti / Foil Flechettes

- **Appearance → power:** primary kill kicks sharp filled diamonds forward; harmless foil is sparse dull/outlined curls, not identical glitter.
- **Mechanics:** replace multi-cut score. First eligible primary kill per shot may reserve up to3 flechettes in deterministic±25° fan about actual cut direction. Prototype speed12, life10 world ticks, max120 range;1 secondary unit then expire on target/solid, eligible light nonboss targets only, max2 distinct secondary victims per burst. No homing/reflection/recursive fan. Normal movement/recoil.
- **Shared phrase:** true lethal cut → small active forward fan → committed secondary contacts/expiry; optional curls use remaining shared allowance only.
- **Icon/preview/proof:** three sharp diamonds, not party-popper; miss/armored survivor/no capacity yield no accepted fan, walls/sweeps, second primary kill and child kill cannot refan. Prices remain unchanged by this plan.

### Ornament limit / stop rule

Reserved damaging diamonds stay readable; 0–2 harmless curls, no celebration rain. Protected actual attacks/status are separate; shared scene budget can reduce ornament further.

### Icon and receipt

- **Unique icon construction:** Three sharp forward diamonds in a bounded fan; no party-popper celebration symbol.
- **Receipt:** show the actual benefit/condition/cost from this card and the resolved policy; remove the replaced generic claim atomically. Icon never supplies the only status/control information.

### Harmony boundary

- **Outward contribution:** Core/world light catches active facets; harmless foil distinguished; shared kill event budgets
- **Protect:** No endless celebratory rain or secondary-proc flechette recursion

### Implementation and regression gate

- **Hook / migration:** RULE/RUN/ART: remove multi-kill score mapping; reserve bounded flechette source set on first eligible primary kill. Actual rays/projectiles have distinct filled geometry and collision/owner IDs; ornament curls separate.
- **Must prove:** Miss, first/second kill same shot, walls, target cap/pool, secondary kill excluded, no recursive foil or bonus score residue.

<a id="item-comic"></a>

## C72. `comic` — Comic Impact / Panel Hammer

- **Appearance → power:** broad flat close cutting face and asymmetric pressure lip mean close coverage and real directional displacement, not full-screen POW.
- **Mechanics:** replace18 grace ticks. Width1.20/reach.90 with B8 caps; first-contact72-unit directional pressure cone affects max2 eligible light nonboss targets, ≤20 displacement over4 world ticks, can interrupt current interruptible windup once. Target60-tick impact immunity; no cone damage/heavy/boss displacement, wall tunneling, global stun or new hitstop.
- **Shared phrase:** broad face → one normal-directed compressed contact → short pressure lines following actual target motion → settle. Frost/Tide compose that same lip, not a second starburst/splash.
- **Icon/preview/proof:** clipped asymmetric four-lobed panel mark; close lateral hit/far miss, light displacement/heavy resistance, interrupt immunity and no extra pressure damage.

### Ornament limit / stop rule

One asymmetric contact mark + 0–2 flat chips, no global shake/POW curtain. Protected actual attacks/status are separate; shared scene budget can reduce ornament further.

### Icon and receipt

- **Unique icon construction:** Broad asymmetric four-lobed close pressure mark with short normal lines.
- **Receipt:** show the actual benefit/condition/cost from this card and the resolved policy; remove the replaced generic claim atomically. Icon never supplies the only status/control information.

### Harmony boundary

- **Outward contribution:** Dash material shapes one contact lip; push direction uses actual normal
- **Protect:** No doubled starburst/splash, global hitstop or implied pressure damage

### Implementation and regression gate

- **Hook / migration:** RULE/RUN/MOVE/INFO: replace18 grace ticks with broad/short primary profile and accepted normal-directed pressure from card. Displace custom enemies through collision-safe helper, not only Matter force.
- **Must prove:** Side miss versus wider close hit, far miss, small/heavy/boss pressure policy, no wall penetration or extra pressure damage, old grace absent.

<a id="item-pixel"></a>

## C73. `pixel` — Pixel Shatter / Plate Breakup

- **Appearance → power:** plate removal releases two filled square threats sideways; tiny dead outlined/dark chips never secretly deal damage.
- **Mechanics:** replace+2 ticks. First primary armor-removal contact per shot may reserve2 square fragments in deterministic outward fan relative to incoming cut; speed8, life14 world ticks, range100. Each hits one eligible nonboss target for1 secondary unit then expires; solid-clipped/swept, no reflection/shatter recursion. Original primary motion/hit geometry stays continuous, not grid-quantized.
- **Shared phrase:** actual plate splits → two active side fragments → real contact/expiry → sparse dead terminal squares. Echo/Glitch can style harmless outline, not turn it into another attack.
- **Icon/preview/proof:** stepped cut/two blocks; no armor removal means no burst, wall stops fragments, child armor loss cannot shatter, source/pool reservation exact.

### Ornament limit / stop rule

Active squares distinct; 1–3 tiny dead chips, no voxel shower. Protected actual attacks/status are separate; shared scene budget can reduce ornament further.

### Icon and receipt

- **Unique icon construction:** One stepped broken plate ejecting two large side squares; not a generic grid.
- **Receipt:** show the actual benefit/condition/cost from this card and the resolved policy; remove the replaced generic claim atomically. Icon never supplies the only status/control information.

### Harmony boundary

- **Outward contribution:** Echo/Glitch can alter harmless terminal outline treatment; active squares remain solid and readable
- **Protect:** No collision quantization, extra damaging chips from art or secondary recursion

### Implementation and regression gate

- **Hook / migration:** RULE/RUN/ART: replace+2 ticks with bounded first actual plate-removal fragment source. Filled active squares and tiny outlined/dead chips must have separate class/source IDs.
- **Must prove:** No plate removed, repeated plate contact, child armor hit, wall clipping/swept hits/cap; no shatter recursion, old duration removed.

# D. Full harmony implementation language

## D0. Data-driven connections, not hundreds of special-case emitters

Each integration is authored as a small declarative **connection recipe**:

`id, requiredParts, familyConstraint?, sourceAnchor, destinationAnchor,
ownedSurface/channel, enabledState/event, treatment, replaces, forbiddenWrites,
priority, fallbackAtSmallScale`

This is a conceptual schema, not a request to build a general-purpose node editor. Use only the mount/route types the existing art can draw. Validate anchor names when equipment resolves; tiny-size fallback is a static notch or omitted ornament, never a different power.

- Every shell supplies head/core/tail/weapon root anchors in body-local coordinates, including a folded or inset implementation for opaque shells. No auto-cut transparent holes through Iron/Paper just to show a core.
- Head/eye/tail part defines its own contour/clearance envelope. The socket negotiates bounded local offset, not body scale, collider or camera position. Mirror with attack direction only where that part is authored to mirror; avoid flipping labels or asymmetrical face features accidentally.
- Shared pose has an explicit order: authoritative body position/orientation → shared action envelope → local socket transform → material compliance → part-local bounded response. Never apply the same squash in both parent and child space.
- Threat gaze, aim gaze and damage expression use one priority selection: damage/death safety/read → committed player input → actual accepted threat → neutral. Ears may keep a bearing while eyes follow input. A recipe cannot make the whole face blink away during a harmful attack.
- Mandatory readiness/state shapes remain visible. Optional local animation priority is accepted contact → legal release → recovery → decorative equip acknowledgement. A low-priority flourish cannot restart/cancel a higher-priority action or hide a spent guard/phase cell.
- During release→bank→relaunch, anchor transform is continuous from the actual socket. Old world-space particles stay in world space. New release replaces optional tail follow-through smoothly; it never blends collision or input commitment.
- Shell/core/world can modify **different channels of the same route**. Compile repeated route segments by anchor/channel; the route doesn't get drawn three times because three Sparks reference it.

### Implementing every Spark safely

The18 named pairings below compile to **local route/mount treatments only**. Generic compiler behavior handles matching, provenance, merge and scale fallback. Each named ID needs one authored treatment descriptor and a snapshot/anchor test using its exact current parts. No Spark descriptor imports RUN/AI, awards a stat or creates a combat entity. Test removal when either ingredient changes and overlaps sharing the same roots.

- Clock/mount group: `chrono`, `cryolens`, `blink` — head/core frame transforms and actual-state notches.
- Bank/material group: `jet`, `flail` — nozzle/weight root response to existing accepted movement events.
- Resource/conductor group: `angel`, `relay`, `stormlink`, `guardlink`, `lifeline` — directional routes/readiness shapes, no duplicate grant/relay.
- Fracture/fault group: `corrupt`, `tyrant`, `glassedge`, `darklink` — one fitted seam and one shared accepted contact.
- Count/material group: `razorleaf`, `afterimage`, `furnace`, `riftlens` — distinguish progression/charge/source class rather than multiply effects.

### Implementing every Apex safely

The17 family recipes below use the **one selected `swordProfile(...).build`** as input. Author construction per build ID, but use six shared weapon animation families. Variant values are read from the immutable actual sword profile, never pasted into an animation switch. Non-recipe slots still use the universal grammar.

- Rapier: `wyrm`, `ronin`, `razoredge` — one forward narrow weapon/construction adapter.
- Breaker: `king`, `sentinel`, `bulwark` — one compact armor-contact adapter.
- Reaper: `reaper`, `glacier`, `briar` — one actual-window sustain adapter; record initial duration rather than assuming twelve ticks.
- Cleaver: `sun`, `forge` — one short/wide contact adapter with clear reach cost.
- Echo: `phantom`, `arcade`, `wraith` — one original-lane pending/active adapter using the actual variant delay/cap.
- Pulse: `eater`, `storm`, `orbit` — one charge-cell/next-dash source adapter using actual variant charge count/range/cap.

Each exact recipe gets: selected-ID test; numeric profile unchanged from baseline where intended; all pose/scale draw-state tests; recipe-breaking swap; and actual combat fixture for its family plus per-variant parameter test. All compatible recipe unions must select the same family in art/readout/combat. Nonselected completed recipes remain discoveries, not a second sword renderer.


## D1. Three levels of harmony


### Level A — universal construction

Applies to every legal mix, even without a named recipe:
- Attachment roots use the selected shell's mounting/material construction.
- One shared body action envelope drives mounted parts, each with its own lag/
  rigidity response. Never eleven unrelated bounce/sine clocks.
- Core circuitry connects through supported sockets to equipped powered parts.
- Element identity is preserved; core/world lighting occupies secondary channels.
- Each event gets one composed contact response and one sound phrase.

### Level B — relational integration

A compatible pair changes **how an existing surface/event behaves**, not adds a
new full-body effect. Examples:
- Iron + Thrusters: bolted nozzle mounts, sharp mechanical recoil and short exhaust.
- Hologram + Thrusters: projected brackets and a brief vertex re-seat, while real
  nozzle thrust is still identical unless its functional rule says otherwise.
- Time + Halo: crystal notches align with the ring during the actual Time lens/
  supported-fall states; no extra time slow/gravity multiplier.
- Ghost + Pixel: active blade/pixel sources retain hard contact geometry, while
  harmless terminal chips dissolve as outlined squares instead of mist.

A pair integration consumes/replaces a generic cue. It does not add an emitter.

### Level C — resolved family integration

A completed Apex gives one selected whole-build construction language and the
existing corresponding functional sword profile. Sparks can supply small local
connections inside it, not fight it with competing titles, giant halos or auras.
A named build is a curated expression of the same universal grammar, not a second
renderer ignoring every non-recipe slot.


## D2. Ownership: which item is allowed to change what?


| Channel | Main owner | Legal contributors | Protected boundary |
| --- | --- | --- | --- |
| Body contour/material | Shell | World rim, core inset, one fitted family detail | No hidden collider change or loss of shell silhouette |
| Physical motion and attack result | Authoritative resolved rules | Actual accepted powers/forces/status | Rendering cannot write force/damage/timing |
| Launch/travel identity | Explicit Dash | Actual velocity, supported material accents, core secondary trim | Can't borrow another element's power/silhouette |
| Primary contact geometry/finish | Resolved attack + Slash | Sword family dimensions, valid head/core modifiers | One truthful collision envelope, not two overlapping blades |
| Energy routing/rhythm | Core | Actual charge/resource state, mounted hardware | No fake charge/proc; no retiming damage for a pretty pulse |
| Head/eyes/tail performance | That part | Shared action, shell mount, real part state | Preserve meaning and facial/gesture readability |
| Ambient/surface light | World | Actual scene light direction | Can't repaint hazard/status semantics or attack element |
| Aim graphics | Pointer + actual attack snapshot | Trajectory, actual conditional geometry | No future guarantees or target correction |
| Contact/map information | Radar + actual state | Existing warnings/status provenance | No artificial scan delay or new AI knowledge |
| Family silhouette | Resolved Apex ID | Existing selected parts; local Spark stitches | No unrelated giant replacement form |
| Cosmetic budget | One scene/event compositor | All legal requests | Drop ornament, never accepted attacks/status information |

**No slot owns everything.** In particular, Core is not a universal recolor;
World is not a force-field shader; Shell is not permission to transform all real
projectiles into a different damaging material.


## D3. Resolution order and explainability


One pure conceptual pipeline, adapted to existing modules rather than an engine
migration:

1. Normalize loadout and read actual run/attack state.
2. Resolve **functional** item rules, existing sword profile, current upgrades,
   attack-source identities, geometry, timing and caps.
3. Pick the one primary family ID using the same specificity/tie-break result as
   the functional sword. Collect all discoveries separately.
4. Resolve shell construction and attachment sockets/clearance.
5. Resolve explicit attack identities, protected geometry and status markers.
6. Apply per-surface core energy connections and actual-state timing responses.
7. Apply allowed local pair integrations and the selected family construction.
8. Apply world light/reflection and real surface-contact response.
9. Allocate the shared event/scene visual and audio budget, preserving semantic
   cues first; freeze an immutable presentation snapshot.
10. Render the same snapshot in game, shop, thumbnails, Codex and recordings,
    adjusted only for scale/detail/quality—not different fictional abilities.

Suggested descriptor concepts, not a mandated implementation API:

`{ rulesRef, familyId, mounts, surfaceMaterials, actionEnvelope, protectedShapes,
   energyRoutes, particleTreatments, activeSourceCues, lighting, budgets, explain }`

Each resolved field needs provenance: **who owns it, which item modified it,
which event enabled it, which modifier lost a conflict, and why**. The shop can
then show a concise truthful explanation rather than a mysterious “fusion +30%.”

Resolve immutable/static construction when equipment changes. Update cheap event/
state parameters during play. Do not rebuild recipes, paths, gradients, palettes
or the full harmony graph every draw.


## D4. The three kinds of change caused by one item swap


## Construction changes — visible immediately

Mount, material, socket silhouette, supported core chamber, weapon-root fitting,
world-facing rim. Can be inspected at idle without constantly emitting particles.

## Performance changes — visible during the right action

Rigidity, lag, compression, calibrated alignment, actual velocity response,
recovery pose. Examples: Iron's rigid mount versus Ribbon's cloth lag; an actual
charged Segmented plate releasing into the next legal launch.

## Consequence changes — visible only after an accepted event

Guard consumption, refill, real secondary attack, frozen rim, burn seam, stored
momentum release. A pretty motion alone never creates a consequence.

A swap is not required to alter every channel. Changing radar should change the
instrument/data display, not fire color or the hero's jump. **Purposeful locality
is part of harmony**, not evidence the swap was ignored.


## D5. Material harmony without losing attack identity


## Shell construction matrix

These are **mount/contact-substrate rules**, not universal replacements for every
attack particle. Attack-native material stays intact.

| Shell | Head/tail/weapon root | Mounted action response | Optional local substrate fragment |
| --- | --- | --- | --- |
| Paper | Folded tabs / wrapped slot | Short fold flex, fast settle | Small matte paper fiber |
| Obsidian | Inset keyed dark seat | Tight rigid seat, restrained edge catch | Dark angular flake, neutral keyline |
| Hologram | Vertex bracket / projected socket | Mesh opens/re-seats on real phase event; otherwise stable | Thin outlined vertex fragment |
| Prism | Faceted collar | Sharp facet lock, no rubber wobble | Angular crystal chip distinct from real needles |
| Iron | Bolted plate/collar | Compact hard compression only on actual contact | Small heavy metal flake |
| Lava | Dark cracked thermal seat | Real heat segments route to socket, no blanket flame | Tiny coal only on actual heat transfer |
| Gold | Folded foil edging | Clean foil crease and single specular | Bent dull curl, never an active flechette |
| Chamfer | Beveled continuous seat | Glancing highlight along actual recoil direction | Tiny hard corner chip |
| Notched | Recessed vented socket | Cooling gate opens during true recovery | Usually none; one short vent line suffices |
| Segmented | Interlocking floating plate seat | Real recoil compresses plates; stored charge holds/release | None; plate motion is the cue |

**Example:** Ember + Iron + Katana still has real fire embers and an ink draw-cut.
Iron supplies the rigid mount and, if appropriate, up to one metal substrate chip.
It must not replace all ink/fire with silver sparks. Conversely a paper shell does
not turn a real metal/foil projectile into a harmless fiber.

## Particle composition grammar

Every emitted object carries a semantic class:

1. **Gameplay projectile / active attack trace:** geometry/lifetime/visibility owned
   by its actual attack. Protected from cosmetic quotas and fake material swaps.
2. **Gameplay status marker:** burn, cold, daze, ready/spent, force area. Accurate,
   shape-coded, persists for true state; not an endless particle emitter.
3. **Attack-native ornament:** Ember ember, Ink fiber, Tide droplet, Pixel dead chip.
   Primary material and motion remain recognizable.
4. **Contact substrate:** one small optional fragment reflecting real contact/
   shell surface; replaces part of ornament allowance, not another burst.
5. **Family stitch:** tiny fitted structural detail; usually no particles at all.

Process: source/event → native type → allowed treatment → world-space initial
conditions → budget → age/draw. Material treatment cannot change an object's class.
A harmless curl never silently becomes a damaging flechette; an active needle
never becomes low-opacity ambient glitter because the core is spectral.

Use actual emitted position, incoming velocity and contact normal. Rebound does
not rotate old particles around the player. Apply an actual gameplay field to
cosmetic particles only when a declared treatment supports it and cannot imply
false range/damage. Don't create an idle gravity well just to curve a few motes.


## D6. Color harmony and contrast


Use semantic channels, not an average of every equipped color:
- Native material owns body fill and each attachment's defining face.
- Dash/Slash/status own their semantic leading edge/marker.
- Core owns small energy sockets, internal conduits and secondary trim.
- World owns one low-value directed rim/reflection, never danger colors.
- Family owns one fitted accent treatment, subordinate to the above.

Prototype constraint: at least ~70% of an element's small visible signature stays
native in shape/value; core/world accents occupy the remainder. Treat that as an
art-review bound, not a literal full-screen pixel quota or blend formula.

Fire stays hot-readable with Time; cold stays crystalline with Riot; Void keeps a
pale boundary in Pro Void; Obsidian retains a keyline in every world. Test grayscale
and color-vision variants. Core color is never the sole active/spent indicator.

Avoid continuous pulse borrowing. Standard/Time/Riot energy patterns are enabled
by **actual related state**; idle remains still. Damage/glow intensity does not
mean extra power unless the source accepted that power.


## D7. Shared choreography, separate state clocks


One action supplies prepare/release/contact/recovery markers. Each material maps
those into bounded local motion:
- rigid parts: short compression and snap-seat;
- cloth: small inherited lag and fast damped fold;
- facets: align, lock, release a narrow glint;
- mesh: calibrate/re-seat, not constant scan noise;
- energy: route a single visible pulse on actual grant/consume.

Never stack independent body squashes. The physical Cube remains axis-aligned;
mounted parts use shared sockets and their local response. A tail may lag but it
cannot drag the hitbox or fake a longer damaging blade.

Simulation time owns attacks, status expiry, cooldown, source charges and accepted
particle birth. Optional presentation interpolation smooths them; no animation
retimes an accepted hit. Time's target-local dt cannot extend world-clock burn/
freeze immunity. Paused tabs cannot return with queued harmony procs/celebrations.


## D8. Core × explicit Dash: 49 treatments, no hidden extra powers


Each cell states a **secondary presentation treatment**. Apply only on that core's
real relevant event/state; otherwise use its quiet socket styling. The Dash keeps
its Part C power, range, hitbox, status and primary material. This is not 49 new attacks.

| Core ↓ / Dash → | Ink | Ember | Volt | Frost | Tide | Void | Echo |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Standard | Clean root; dry finish | Neutral hot center | Neutral terminals | Clear clean facets | Plain crest/drops | Plain pale core boundary | Plain pending/replay distinction |
| Time | Two small calibration cuts at source | Clock-notch source collar; flame stays hot | Even source notches; real arc timing unchanged | Crystal source ticks; accepted cold clock stays accurate | Steady source-ring ticks; no slow droplets by default | Thin source timing notch; field/pulse unretimed | Clear separate core-lens and replay clocks |
| Riot | Sharp reactor-fed root stroke | Brief hotter source seam at Drive entry only | Compact energized root at Drive entry; no free relay | Warm root, cold outward wedge; no fake melt | Hot socket, liquid crest; no steam power | Hot root notch, negative field remains clear | One ignition root plus unchanged delayed path |
| Glass | Fine fractured source collar | Clear pointed hot root; no extra shrapnel damage | Narrow glass-insulated terminal collar | Transparent source facets distinct from target freeze | Fine glass lip; drops remain fluid | Fine pale inner rim, no extra damaging radius | Thin segmented source outline, actual replay remains legible |
| Grav | Inward socket routing while real aim pull acts | Small inward source route, not fake ember attraction outside field | Bent source inlay; arc follows actual targets | Spiral socket beneath stable facets | Inward root curl only; no added tide pull | Keep aim-pull and contact-field boundaries separate | Spiral source inset, replay remains stored world path |
| Magnet | Paired focused source rails on eligible close cut | Two-pole hot edge marker on real close cut | Paired short conductor marks, no extra zap | Twin facet root pinches at eligible contact | Paired source stream channels, no enemy pull | Paired rim marks, no larger well | Dual source latch, not a second replay |
| Echo | Short outlined root lag, no extra live edge | One small afterglow at source, not extra burn ticks | Outlined source cadence, real relay count unchanged | One outlined source facet, no second freeze | Short root echo, no extra push splash | Broken source contour, one real field only | Distinct stationary-Core counter/source vs traveling Dash replay |

Adaptive Dash is intentionally not a full element column: it can borrow the core's
small neutral energy accent, but cannot mimic literal burn/freeze/relay/collapse
power through the appearance resolver.


## D9. Dash × Slash: all 56 combinations by semantic rule


Dash controls traveled material; Slash controls primary contact construction;
actual resolved attack owns the hit geometry. Reuse the following seven finish
rules across all eight Dash choices, then apply conflict policies below.

| Slash | What every Dash inherits at primary contact | What must not happen |
| --- | --- | --- |
| Razor | Clean reference live edge and true material contact | No second elemental crescent underneath it |
| Katana | Resolved long/narrow draw-cut, sparse dry edge breakup | Do not turn water/fire into ink damage or add another hidden hitbox |
| Laser | Straight authoritative thrust/obstruction, emitter root fitted to material | No old curved arc still hurting behind a straight beam |
| Glitch | Only accepted attached Fault gets its delayed seam/chip | No global screen tear or repeated delay proc from every particle |
| Confetti | Only a legal primary kill launches reserved sharp flechettes | Burn/echo/field/foil secondaries cannot spawn more foil fans |
| Comic | Broad short contact and one accepted pressure direction | No full-screen burst or physically fake enemy knockback |
| Pixel | Actual plate removal can launch the declared solid fragments | Cosmetic/secondary plate drawing cannot recursively shatter |

A material-compatible finish changes structure: Frost+Katana is a long faceted
leading wedge with dry draw-cut residue; Tide+Comic is one flattened water-lip
contact, not a blue starburst pasted over a second splash; Volt+Laser is a straight
conducting incision, not cyan arc + yellow arc + generic white arc.

Where a finish changes the actual envelope, the composed geometry must be sampled
once by combat, shop and aim overlays. Do not silently suppress a selected part's
benefit to make art easier. Incompatible parameter ranges are a design rejection
requiring a declared combined profile before the combination ships.


## D10. Cross-slot influence matrix


A directed arrow means a declared supported relationship, not a stat stack.

- **Shell → Head / Tail / Core / Weapon:** sockets, support clearance, root material,
  local contact compliance. Does not rewrite attack-native material.
- **Core → powered Head / Eye / Tail / Weapon root:** source trim and actual-state
  route timing. Does not overwrite semantic element or instrument readings.
- **Dash → body performance / Tail / traveled contact context:** actual velocity,
  source material, emitted trajectory. Does not change eye benefit or world geometry.
- **Slash → primary contact / weapon leading edge / attack overlays:** actual
  composed shape and finish. Does not invent another independent body impulse.
- **Head → actual conditional envelope / warning bearing / shared source cue:**
  only as its real rule supports. No universal camera shake or face occlusion.
- **Eyes → expression / actual resource/threat eligibility / Pointer notch:** never
  retargeting force or hidden accuracy.
- **Tail → socket load / actual bank-resource/momentum response / short residue:**
  cloth movement alone cannot extend damage.
- **World → rim / actual accepted surface affinity / instrument contrast:** no
  replacement of any semantic shape or hazard palette.
- **Pointer / Trajectory → view of the same attack profile:** no other way around;
  the displayed forecast cannot change the launched profile.
- **Radar → view of current state:** no influence on enemy motion/spawning simply
  to improve harmony.
- **Family → one structural grammar across supported surfaces:** never a second
  set of gameplay powers separate from the existing resolved sword profile.

This matrix is sparse on purpose. Not every one of 2,402 pairs needs a bespoke
interaction. Every pair needs **a deterministic compatible result**, and selected
pairs earn an extra fitted connection only when it clarifies actual behavior.


## D11. All 18 Sparks: integrations, not extra emitters


Recipe IDs and parts below are the current catalogue, not proposed replacements.
A Spark's static fitted detail may remain at rest. Its animated accent requires
an accepted event. Each row **replaces the corresponding generic connection**.
Multiple matched Sparks remain discovered, but their visible routing is compiled
into a single set of sockets/paths. They do not each get a particle allocation.

| Spark ID / actual parts | Fitted integration and shared choreography | Particle substitution / forbidden implication |
| --- | --- | --- |
| `chrono` — Halo + Time | Ring seats around crystal axis. During real supported fall, ring levels; during actual aim lens, a small crystal index moves on that same ring. Separate states can coexist without double rings. | One socket glint replaces both generic head/core glints. No extra slow, freeze or gravity reduction. |
| `jet` — Viper + Thrusters | Horns and nozzle axes share the actual release vector. Nozzles compress then extend on the accepted bank; horns remain rigid. | Existing short exhaust becomes a directional tapered packet; no additional contrail or second acceleration. |
| `angel` — Wings + Magnet | Two feather roots bracket paired magnetic terminals. Actual refill travels inward along one root; eligible close-cut state opens the weapon-side pole. | Root line replaces generic refill motes. Feathers do not zap targets, lift the cube or refill twice. |
| `flail` — Lava + Anchor | Chain enters a fitted heat-resistant socket. Weight follows real movement with bounded lag, then compresses once at actual floor impact; heat charge stays in the shell. | One small thermal contact edge replaces separate Anchor dust and Lava cosmetic sparks. No newly burning floor or second force. |
| `corrupt` — Hologram + Glitch Slash | One deliberate fault seam links projected cage to the weapon collar. Real phase passage and delayed armor fault use different seam segments/states. | Harmless terminal fault is a projected sliver instead of both pixels and mist. Never random flicker, lost frames or another delayed strike. |
| `tyrant` — Crown + Glass | Crown weight is held by a fine fractured collar. Actual eligible plate bonus lights one fracture and one jewel; actual damage cracks the fragile core, not an imaginary shield. | A single crisp contact chip replaces crown sparks plus glass spray. Bonus caps remain authoritative, no nova attack. |
| `cryolens` — Chamfer + Time | Bevels become a stable frame around the clock crystal; the real glancing recoil line and aim-lens index have different directions. | One clean facet highlight; no snow or freeze power from the recipe's name. |
| `razorleaf` — Notched + Spectrum | Three band channels terminate in three small vent slots. Qualifying kill progression advances one state; completion routes once toward EDGE. | Short banded vent tick replaces a rainbow ribbon plus recovery spray. No damaging leaves or elemental roulette. |
| `relay` — Segmented + Magnet | Opposing poles sit on two plates. Actual recoil compression and momentum release stretch the connector with the plates; close-cut state uses the weapon terminal. | Connector carries the pulse rather than emitting sparks. No magnetic spring force or extra stored momentum. |
| `afterimage` — Echo core + Pixel Slash | Three chamber counts use square terminal caps. The real stationary Echo blade remains outlined; real Pixel fragments are filled and carry their own hit IDs. | Harmless square dissolve replaces generic afterimage mist. Does not spawn an extra replay from a fragment. |
| `stormlink` — Coil + Echo core | Coil terminal carries a three-step source counter with distinct relay and blade marks. Real Coil zap never originates from a harmless Echo contour. | At most one fitted connector flash per accepted event group, not two arcs. No recursive zap/echo chain. |
| `furnace` — Lava + Riot | Riot ignition aligns shell crack gates for one beat. Stored Lava heat retains its separate visible count, even during Drive. | Ignition seam replaces generic core flare; actual burn particles remain at their real source. No idle furnace plume or implicit doubled burn. |
| `blink` — Neko + Time | Ear pivots hold the last valid hearing direction while clock index reports actual lens state; pupils may acknowledge, not retarget. | No particle needed. One short socket response replaces both tiny glints. No teleport, slow aura or hearing enemies through unsupported rules. |
| `guardlink` — Iron + Magnet | Paired poles fit behind a bolted guard plate. Actual consumed guard compresses its latch; close-cut readiness occupies a separate edge notch. | One metallic contact answer; no extra protective magnetic bubble or charge. |
| `glassedge` — Notched + Glass | Fine fracture routes stop at vent recesses instead of crossing the face. Real recovery opens a gate; bonus contact uses a sharp leading notch. | One clipped facet chip, no glass mist and vent plume simultaneously; no extra armor or recovery. |
| `riftlens` — Prism + Grav | Crystal facets frame the true core spiral. Real Prism needles originate from their actual hardpoints; actual pull tether begins at the core field origin. | Refraction stays a fitted facet line. No cosmetic needles, extra gravity lens or bending trajectories not simulated. |
| `lifeline` — Beacon + Wings | Lamp and feather roots share one fitted support. Accepted threat tell points outward; qualifying kill/refill travels inward. Their direction makes them distinguishable. | Route line replaces refill confetti; no second alarm circle or healing aura. |
| `darklink` — Obsidian + Glitch Slash | A narrow keylined fault socket remains readable on the matte shell. Quiet-acquisition state never dims the live delayed-fault marker. | One fault reseat, no noisy camouflage cloud or darkness that hides hazards. |

**Spark overlap example:** Notched + Glass + Spectrum matches `glassedge` and
`razorleaf`. Use the same three vent roots; a fracture line belongs to structure,
Spectrum owns progression bands, recovery owns the opening motion. At contact,
only the eligible Glass bonus gets a chip; there are not two Spark bursts. Crown
adds `tyrant` but joins the same Glass contact phrase and capped plate receipt.


## D12. All 17 Apex families: construction + truthful action


The selected family comes from the existing **most-specific, catalogue-tied
functional sword selection**. It is not the first artistic match. Every other
completed recipe can remain listed as a discovery, but may not contribute a
second sword mesh, secondary attack or competing family aura.

These are choreography requirements around existing sword parameters, not
newly tuned parameters. Snapshot live values from `swordProfile`/effective rules;
do not duplicate the following numbers in rendering code. Part C proposals can
change actual parts through their own explicitly tested implementation slices.

## `wyrm` — Laser Wyrm
- **Parts:** Viper, Prism, Laser. **Sword:** Wire Lance / rapier; 1.30 reach,
  .68 width, -1 blade tick relative to standard.
- Horn, Prism hardpoints and emitter form one clean forward assembly. Chamber
  routes through the emitter collar; Prism needle sockets remain separate.
- Release is straight and narrow. Laser's real short active line replaces, not
  overlays, an old wide crescent. Needles retain distinct source silhouettes.
- Native Dash occupies travel; its contact lip meets this line without creating
  a dragon beam, homing head or three overlapping weapon trails.

## `ronin` — Ink Ronin
- **Parts:** Samurai, Paper, Katana, Manga. **Sword:** Paper Oath / rapier;
  1.16 reach, .88 width, -1 tick.
- Folded mounts, wrapped weapon root and still horn tips; one drawn line unites
  aim and release. Manga background stays quiet, not a full-screen speed-line layer.
- A precise long cut and brief folded follow-through show commitment. Conditional
  horizontal bonus comes from the actual rules, not a permanently wider brush.
- Ink Dash can join the brush gesture. Other explicit elements keep their native
  leading read; the recipe does not grant Ink, bleed or an extra sword stroke.

## `king` — Void King
- **Parts:** Crown, Grav, Anchor. **Sword:** Grav Chisel / breaker; .92 reach,
  .92 width, -4 ticks, +1 armored damage from the sword profile.
- A heavy crown mount, compact inward core route and linked weight make a balanced
  assembly. Body stays upright; no invented heavy Matter mass or aim delay.
- Short committed contact compresses once. Anchor floor impulse, Grav pull and
  sword armor benefit keep distinct accepted-event origins.
- No giant dark crown halo. If Void Dash is equipped, its field remains the one
  visible force boundary at its actual location; the family adds no field.

## `phantom` — Cyber Phantom
- **Parts:** Visor, Hologram, Ghost. **Sword:** Phase Oath / echo; 1.00 reach,
  .78 width, -2 ticks; delayed lane 22 ticks / 300px / width16 / cap2.
- Projected brackets support twin folds; Visor reads as stable calibration, not
  global glitch. Actual phase charge has a separate vertex-cell marker.
- Primary edge is solid where harmful. Delayed sword lane uses a narrow outlined
  pending mark, then solid active contact at the original lane.
- Ghost residue is harmless and faint; no third phantom body. A different explicit
  Dash remains visible and cannot be erased by transparency.

## `reaper` — Mecha Reaper
- **Parts:** Oni, Iron, Viper Tails. **Sword:** Mecha Hook / reaper; 1.00 reach,
  .84 width, +8 ticks.
- Bolted horns, metal tail roots and an angular hook share the same hard support.
  Strands load on real direction changes, not a separate flapping cycle.
- Sustained active edge remains legible for its real duration; body settles once,
  not one recoil per tick. Last-health Oni seam is visible only when eligible.
- No circular scythe hitbox, extra bleed or permanent red sparks.

## `eater` — Star Eater
- **Parts:** Hypno, Grav, Wings. **Sword:** Star Capacitor / pulse; 1.00 reach,
  .80 width, -2 ticks; four direct contacts → next-dash pulse, 300px / width26 / cap3.
- Wing roots frame the core spiral; Hypno keeps one real target daze, not a cosmic
  stare controlling every enemy. Four distinct charge cells explain the real sword.
- Next-dash pulse is a protected forward source, not a full-screen implosion.
  Grav's actual pull tether is separate and quiet; refill follows its real event.
- No damaging stars from feathers or charge from cosmetic/secondary contacts.

## `sun` — Apex Sun
- **Parts:** Halo, Gold, Confetti. **Sword:** Sun Splitter / cleaver; .86 reach,
  1.32 width, -3 ticks.
- Ring, folded foil mount and broad close weapon form a compact sun-tool, not an aura.
- Wide/short contact is the main read. Actual first-primary-kill flechettes use
  filled foil silhouettes; optional celebration shares remaining contact budget.
- No gold rain, extra circular solar damage or fake longer reach from bloom.

## `glacier` — Glacier Crown
- **Parts:** Chamfer, Time, Halo, Laser. **Sword:** Chrono Hook / reaper;
  .95 reach, .78 width, +10 ticks.
- Beveled clock frame seats the ring and laser emitter. Recipe name does not
  confer Frost; a non-Frost Dash stays non-Frost.
- B4 defines the composed Laser gate: six base ticks plus declared extensions,
  limited by the actual primary window. Glacier Laser has16 ticks absent other
  modifiers; its long-window family benefit is not silently erased. Show that
  exact active line, then only clearly harmless fitted residue within budget.
- Test this at gate boundaries with real collision and aim profiles. Never derive
  harmful timing from an arbitrary twelve-tick visual-progress divisor.

## `briar` — Spectral Briar
- **Parts:** Notched, Hypno, Spectrum. **Sword:** Briar Hook / reaper;
  1.08 reach, .90 width, +6 ticks.
- Three Spectrum channels end at vent roots; a restrained hook keeps the face
  clear. Hypno daze marker stays on its real target.
- Long-window edge uses one sustained contour; qualifying kill sequence advances
  one band. Completion/refill uses a single inward route.
- No damaging vines, multi-target hypnosis or rainbow fog from the name.

## `sentinel` — Arc Sentinel
- **Parts:** Segmented, Magnet, Coil. **Sword:** Rail Fault / breaker;
  .84 reach, 1.04 width, unchanged ticks, +1 armored damage.
- Sliding plate connectors and Coil terminal form one short rail; poles flank
  the true close-range edge. Plate compression reads stored real momentum.
- One firm short contact; actual relay arcs only between valid victims. Armor,
  momentum release and relay are separate ledger entries in one contact phrase.
- No all-around force field, damaging plate shrapnel or continuous lightning net.

## `arcade` — Arcade Sovereign
- **Parts:** Echo core, Pixel Slash, Visor, Synth. **Sword:** Pixel Reprise / echo;
  .90 reach, .86 width, -2 ticks; delayed lane14 ticks / 230px / width28 / cap3.
- Square chamber cells, calibrated Visor and fitted grid-collar share a stable
  pixel grammar without pixelating enemies or the entire screen.
- Sword replay, stationary core blade and active Pixel fragments retain separate
  filled/outlined geometries and source icons; one merged cosmetic dissolve.
- No replay from every fragment, beat-triggered power or grid-wide shockwave.

## `storm` — Storm Conductor
- **Parts:** Coil, Chamfer, Echo core, Laser. **Sword:** Arc Capacitor / pulse;
  .96 reach, .85 width, -2 ticks; three contacts → pulse220px / width40 / cap3.
- Beveled conductor collar joins Coil and emitter; three pulse cells are separate
  from core's three-kill blade count using shape as well as position.
- Laser active line, actual relay and earned next-dash pulse are distinct harmful
  sources. Coil route can flash once, not once per each secondary victim.
- No storm weather, electric damage solely from family color or infinite relay loop.

## `forge` — Furnace Regent
- **Parts:** Crown, Lava, Riot, Anchor. **Sword:** Furnace Slab / cleaver;
  .80 reach, 1.45 width, -4 ticks.
- Forge-fastened crown and weight share heat-resistant sockets. One chamber
  ignition opens the crack route; actual stored heat has its own count.
- Very broad close slab contact, then one weight settle. Accepted burn stays on
  its real target; floor impulse is not another furnace explosion.
- Foundry world, if equipped, contributes one forge-prime mark to this assembly,
  not another eruption or uncapped armor stack.

## `wraith` — Chrono Wraith
- **Parts:** Neko, Hologram, Time, Ghost. **Sword:** After Oath / echo;
  .95 reach, .82 width, -2 ticks; delayed lane18 ticks / 270px / width22 / cap3.
- Transparent vertex mounts, directed ears and two quiet folds. Clock ring is an
  inset at the core, never a second Halo head attachment.
- Delayed sword source uses its actual original lane; phase pass and Time aim lens
  are separate. Cosmetic float does not slow the replay or immunity clock.
- No teleport, globally frozen trail or extra attack from every fold.

## `bulwark` — Rescue Paladin
- **Parts:** Beacon, Iron, Magnet, Wings. **Sword:** Rescue Edge / breaker;
  .90 reach, .92 width, -3 ticks, +1 armored damage.
- Lamp and feathers bolt into one guard frame. Outward threat direction and inward
  accepted refill use different paths with one shared guard latch.
- One short armored contact and truthful remaining guard state. Relay-like trim
  is just wiring; no zap without an actual source.
- No healer aura, automatic rescue, hazard immunity or extra life from the title.

## `razoredge` — Glass Shogun
- **Parts:** Samurai, Notched, Glass, Katana. **Sword:** Glass Needle / rapier;
  1.32 reach, .65 width, unchanged ticks.
- Horn tips and fine fracture collar align with a long, narrow true edge. Vents
  remain distinct from cracks and use one recovery motion.
- Conditional horizontal geometry and actual capped plate bonus appear only when
  eligible. Narrow coverage must not be disguised by a huge glass crescent.
- No glass projectile cone, automatic target puncture or immunity to fragility.

## `orbit` — Prism Oracle
- **Parts:** Halo, Prism, Grav, Spectrum. **Sword:** Orbit Engine / pulse;
  .96 reach, .88 width, -2 ticks; four contacts → pulse250px / width32 / cap4.
- Ring frames faceted shell and spiral chamber. Spectrum progression bands,
  four sword cells and Prism needle hardpoints occupy different physical regions.
- Earned forward pulse has its true line footprint, not the ring's circumference.
  Needles, pull and refill are individually sourced but share one root response.
- No orbiting damaging satellites, homing refraction or all-target gravity well.

## Family overlap and single-swap transitions

For a loadout with Visor/Hologram/Ghost/Echo core/Pixel/Synth, both `phantom` and
`arcade` match. Select **Arcade** because four recipe parts outrank three; keep
Phantom as a completed discovery, not another sword. Neko/Hologram/Time/Ghost plus
Visor selects **Wraith**, not Phantom. Oni/Iron/Viper Tails plus Visor/Echo/Pixel/
Synth selects **Arcade**, not Reaper. Samurai/Notched/Glass/Katana plus Hypno/
Spectrum selects **Glass Shogun**, not Briar.

At equal specificity use existing catalogue order, never equip order, object-key
order, dominant color, last shop click or an arbitrary summed recipe score.

A single swap may therefore have **global but explainable** consequences: swapping
Echo core → Standard in the first example breaks Arcade and leaves Phantom,
changing the real sword to Phase Oath. Show a compact “ARCADE → PHANTOM / sword
profile changed” receipt plus actual new dimensions/timing. Do not claim this is
only a cosmetic core-color swap. Conversely, a Pointer change cannot select a
new family when no recipe references Pointer.


# E. Integrated events, feedback and single-swap acceptance

## E1. Conflicts must resolve in mechanics before animation


## Element/status coexistence

| Combination | Authoritative resolution to implement/test | One coherent presentation |
| --- | --- | --- |
| Fire + cold-looking Time/Chamfer/Glacier | No cold power exists merely from these shapes/names | Hot outward Fire; crystal/clock confined to sockets |
| Frost + Riot/Lava/Foundry | Frost remains a true cold source. Actual stored Lava burn, if independently eligible under its rule, has a separate source/status. No implicit elemental cancellation or steam damage | Cold wedge leads; hot stored charge stays internal. If both statuses are accepted, compact separate shape-coded target marks, not a particle cloud |
| Time lens + Frost + Hypno | Strongest permitted movement slow/freeze wins rather than multiplied zero speed; daze only affects its declared initiation rule. World-clock expiry/immunity unchanged | One motion-status rim, plus a small initiation/tell mark if relevant. No three overlapping clocks |
| Grav + Void Dash + Anchor | Keep aim pull, contact field and floor impulse source/timing distinct; combine force through actual existing clamps/immune/boss rules | Actual force arrows/affected targets only; one contact accent. Do not average origins into a fake giant field |
| Volt Dash + Coil | One declared relay eligibility/dedup ledger, bounded valid victims. No relay-on-relay proc | One real arc per accepted link; hardware route may flash once |
| Echo core + Echo Dash + echo-family sword | Three distinct source kinds with their existing/proposed eligibility and origin. One cannot generate another through secondary contact. No silent removal of a paid power | Stationary core blade / stored traveled stroke / delayed original sword lane have distinct geometry and readiness marks. No decorative fourth clone |
| Katana or Laser + rapier family + Samurai + Sniper | One geometry composition with declared modifier order and limits; no arithmetic inferred by renderer | Same resolved envelope in aim and impact, with conditional margins marked |
| Oni + Glass + Sniper + Foundry + Crown | Apply shared combined extra-plate cap, preserve source explanations and separately reviewed legacy sword/kinetic contributions | One plate-contact phrase and aggregate receipt, not five bursts |
| Tokyo + Tide + Thrusters + Viper Tails | Apply actual additive/multiplicative ordering and combined bank cap; retention is not another speed grant; Hyper stays separately governed | Single release/boost packet whose spacing follows final actual speed |
| Notched + Glitch eyes + Synth + Orbit Pointer | One accepted recovery with source contributions, actual caps and eligibility | One resource route/receipt, not four fountains |

Do not add elemental reaction mechanics (melt, vaporize, conductivity, shatter
bonus) merely because two selected colors suggest them. If desired later, each
needs a separately approved rule, costs/caps, source provenance and tests. The
harmony plan itself grants none.

## Resolve timing, geometry and resource order explicitly

For the implementation slice, capture a baseline fixture for each relevant existing
composition before changing it. Establish an authoritative attack profile that
records base weapon, family override, valid part modifiers, conditional effects,
caps, obstruction and **separate active gates**. Preserve existing documented
behavior unless a Part C replacement explicitly changes it.

A profile needs distinct start tick, total active window, Laser gate, delayed
source delay and harmless residue age. Current slash progress derived from
`1 - min(1, s.blade / 12)` stays at zero when blade ticks exceed twelve. Audit this
before promising long-window choreography. Fixing presentation progress must not
shorten a Reaper's actual window or extend a Laser's real harmful phase.

For counters, use actual qualifying hits/kills, not the number of visual contacts.
A direct hit that removes multiple plates is not several pulse-charge events
unless its rule explicitly says so. The event adapter must preserve collision
shot dedup, armor grace, boss resistance, source caps and existing credit awards.


## E2. One event, one composed response


## Required event provenance

A conceptual accepted event contains:

`eventId, shotId, sourceId, sourceKind, parentSourceId, simulationTick,
position, normal, incomingVelocity, targetId, acceptedOutcome,
geometryRef, statusesGranted, resourceDelta, chargeDeltas`

Not every engine event needs every field. But unknown provenance cannot default
to “primary” or become eligible to farm resources. Rendering consumes immutable
results; it never writes a second hit because a particle touched an enemy.

Distinguish primary blade, Prism needle, Coil relay, sword replay/pulse, core
blade, Dash replay/field/burn, Glitch fault, Pixel fragment and Confetti flechette.
Use explicit eligibility, not fuzzy name checks or “everything except particles.”
A harmless particle has no combat source at all.

## Shared choreography example: Frost + Comic + Iron + Magnet

1. **Prepare:** actual aim corridor reflects close-cut eligibility and short/broad
   Comic geometry. Iron bolts stay rigid; the two poles ready. No ice emission.
2. **Release:** one body release; tail follows actual acceleration. Frost's forward
   wedge establishes travel. Magnet source notch stays at the root.
3. **Accepted contact:** one flattened faceted pressure lip at the true contact
   normal. Enemy push/freeze occurs only if combat accepted it. Eligible guard
   consumption compresses the Iron latch once; no generic white star on top.
4. **After contact:** actual frozen rim persists as state, not snow. Up to the
   remaining small shared allowance of dead ice shards, at most one substrate
   flake. Resource changes merge into one core/pointer receipt.
5. **Recovery:** one shared settle; no new freeze burst when the tail catches up.

## Simultaneous kill, armor break, freeze, refill, charge and bank

Preserve the real damage/armor response and readable actual status. Use one
contact phrase for this contact group, one consolidated resource receipt at the
player, and compact persistent charge cells. World bank occurs at its real
surface event; if it happens the same tick, its brief line occupies the surface,
not another full-body burst. The queue stores accepted gameplay sources, not an
unbounded backlog of delayed decorations.

Coalesce duplicate requests with a stable key such as `(eventId, channel,
region)`. Group primary visual contact accents within a declared short
simulation-tick window (prototype: two ticks), without merging damage events,
status timers or legally distinct attacks. At most two large local contact
accents may be visible; other accepted hits keep their minimal hit/status read.


## E3. Particle and motion budget: replace, then omit


The harmless foreground caps are: **48 Standard / 24
Low**, at most **8 births per simulation tick** globally, each individual ordinary
response **0–6**, default decorative age **100–180ms**, strongest local accent
**≤250ms**. UI feedback gets at most **4** harmless particles and shares the global
foreground allowance if visible over gameplay; never treat it as a second
unlimited pool. At most **two large local contact accents**. No idle emissions,
drips, stains, endless ribbons or delayed particle debt.

These are proposed this blueprint’s limits, not claims about the current implementation's
30-spark/90-dust pools. Integration must account for all existing emitters before
calling the combined budget enforced.

### Event allocation order

1. Actual attack entities/traces and essential status/tell information: protected
   and separately bounded by gameplay source caps. Cosmetic budget pressure cannot
   silently delete a hit, pending earned replay, hazard or remaining guard read.
2. True active contact boundary/direction and concise real outcome.
3. One native material response; optional substrate chip **substitutes** within it.
4. One meaningful fitted energy route (line/shape, usually no particles).
5. Tiny family garnish only if still useful and inside the same allowance.

Prefer **transform / replace / merge / omit** in that order before emitting more.
A Frost shard can receive a subtle world rim; it does not need a separate rim
spark. A Spark wire can carry the accepted core pulse; it does not need a floating
orb following the wire. A recovery receipt can sum deltas, retaining per-source
explanation in the shop/debug view.

### Concrete budget examples

- Frost + Comic + Iron + Magnet + Arc Angel: 0 idle. Ordinary contact budget might
  use two harmless ice shards and one small substrate chip; the pressure lip,
  pole route and feather-root refill are fitted shapes. **Not six per item.**
- Lava + Riot + Crown + Anchor + Ember + Confetti + Foundry: ignition is one shell
  seam. Legal foil attacks are gameplay objects with their own caps. Contact may
  use two embers and one dull substrate coal; no additional furnace/sun/crown rain.
- Echo core + Echo Dash + Arcade + Pixel: keep all legally scheduled sources.
  Harmless square dissolution uses one shared allowance. If gameplay-only visual
  density becomes unreadable, that is a source-design/cap review, not permission
  to hide active entities at random.

Fixed-size/reused descriptors and bounded pools; no per-particle recipe lookup or
per-frame gradient/material allocation. Existing 100ms metadata /100px culling
policy still checks moving bounds as needed; do not cull a dangerous source just
because its owner is offscreen when its actual range enters view.

Keep Canvas2D/Matter and the existing optional one-pass shader with at most three
texture reads. No extra framebuffer chain, stacked bloom/vignette/chromatic
passes or fake full-screen fusion flash. Bake tiny static mount/glow art where
useful; preserve existing bounded caches and resolution policy.


## E4. Single-swap review: visible changes and deliberate invariants


All comparisons use the same input and deterministic contact fixture. “One swap”
does not mean pretending real mechanically changed movement stays identical.
First compare mounts at rest, then equal input, then accepted outcome.

| One changed slot | What must visibly change | What must stay invariant |
| --- | --- | --- |
| Paper → Iron, with Thrusters + Frost + Katana | Folded roots become bolted collars; mounted flex becomes compact hard response; actual guard has one latch/read | Frost stays cold, Katana stays its actual long/narrow edge, no global metallic recolor or new nozzle speed |
| Iron → Hologram, with Neko + Time + Ghost | Vertex brackets replace bolts; actual phase cell/read appears; completing Wraith can select its real sword and delayed lane | Hearing bearing and target-local lens stay truthful; no artistic teleport or bonus ghosts |
| Standard → Riot, with Frost + Katana | Chamber/socket routing changes; actual Drive entry ignites one root pulse; cold attack retains its outer shape | No melt power or automatic fire damage; no new particles at idle |
| Time → Grav, with Tide + Thrusters | Clock socket replaced by spiral; actual pull cues replace lens cues; water crest and nozzle roots remain assembled | No fake slowing of drops or second water force; any actual rules/family change is disclosed |
| Ribbon → Anchor, with Lava + Comic | Cloth lag replaced by linked weighted follow; one real floor-contact compression, thermal mount integration | Comic geometry not replaced by a giant flail hitbox; tail has no independent undocumented damage |
| Wings → Thrusters, with Viper + Magnet | Feather refill route removed, nozzle mounts/accepted bank extension appear; Jet Viper integration replaces generic nozzle cue | Magnet close-cut source preserved; losing Wing refill actually removes its receipt |
| Ink → Frost, with Iron + Echo core + Katana | Travel brush becomes forward facets; native contact fibers become cold material; real cold marker only on accepted victims | Iron remains Iron, core chamber count remains legible, no second katana slash or auto-echo freeze |
| Katana → Laser, with Volt + Prism | Real envelope/active gate becomes the composed straight incision; emitter is fitted into existing Prism roots; needles remain distinct | No lingering old crescent collision; Volt relay remains bounded; no fake Laser penetration |
| Comic → Pixel, with Tide + Glass | Pressure contact is removed, eligible plate-removal fragments get their own filled square source; water travel remains continuous | No old Comic push preserved accidentally; Glass bonus remains capped |
| Halo → Coil, with Chamfer + Echo core + Laser | Ring mount becomes conductor. Breaking Glacier/completing Storm changes selected family and actual sword to charged pulse; show new cells/geometry | No inherited Glacier long window; Time-only cues absent if no Time equipped; no decorative weather |
| Ninja → Sniper, with Samurai + Diamond Pointer | Eye sight and true full-power puncture eligibility get calibrated in the existing corridor | No homing or fake wider all-angle attack; no new elemental particles |
| Reticle → Diamond | Show the actual composed corridor and conditional margins, in the same world contrast | Input, damage, family, colors of emitted attack particles and launch behavior unchanged |
| Radar Base → Radar 3 | Actual tell/heading information appears in supported display regions; Beacon uses same tell vocabulary | No new AI knowledge beyond rule, no enemy slowdown, no full-body animation change |
| Trajectory Base → Trajectory 3 | Forecast horizon/analysis detail increases from the same launch snapshot | No physical range increase or guaranteed future victim |
| Foundry → Void world, with Lava + Ember + Anchor | World rim and stage contrast change, forge-prime contribution disappears, actual Void boss-recoil source becomes available under its rule | Fire stays visibly fire, shell remains Lava, no extra damaging void field or camera tunnel |

### Transition lifecycle

- Default: gameplay equipment is fixed for the run or changed at an existing safe
  boundary. Do not add a pause/rest/picker ceremony just to support harmony.
- If live swaps already exist or are later permitted, snapshot source rules,
  geometry, palette and ownership on launch. A fired Ember burn cannot turn into
  Frost because the player opened a shop; a scheduled earned replay keeps its
  launch identity. State transfer/reset must be specified per actual charge rule,
  never refill a charge by unequip/re-equip.
- Swap presentation removes old sockets/routes deterministically; no orphaned
  emitter, duplicated listener, stale shader state or old family mesh. A brief
  harmless fitted transition is optional, never an input lock.
- Changing only Pointer/Radar/Trajectory leaves combat-source snapshot hashes
  unchanged. Changing a recipe ingredient may change the family; disclose it.
- Saves keep existing IDs/ownership/prices/credits and presets. Cosmetic descriptors
  are derived/cacheable, not a second saved equipment truth.


## E5. Aim, shop, icons, interaction and sound must agree


## Same build in every view

Small shop tiles use static/few-frame fitted construction and each item's unique
silhouette icon. They do not run the full foreground effect stack. Loadout preview
uses the same family/material resolver and a short accepted-action fixture to
show prepare → release → contact → settle. The preview must distinguish a fixture
outcome from a guaranteed real enemy hit. No continuous emission just because
an item is selected.

For a hovered swap show at most three compact, derived lines:
1. **Local:** “Bolted roots → projected vertex mounts.”
2. **Shared:** “Phase cell added; Frost edge unchanged.”
3. **Rules/family if changed:** “Arcade → Phantom / delayed lane now 22 ticks.”

No invented “harmony +%” score. A detail panel can expand source/cap explanations.
A recipe completion pulse is a fitted silhouette/collar response and one quiet
confirmation; it does not shower the entire screen or stack 18 Spark toasts.
Keep all discoveries available in existing collection UI without adding a quest
system or duplicate shop.

## Control/button juice

- Hover/focus: small icon seat/edge highlight, no particles or layout movement.
- Press: bounded inset/compression; release on the same control restores once.
- Successful purchase/equip: one acknowledged icon/socket response, one credit
  change, one compact equip receipt. Rapid clicks cannot duplicate purchase,
  trail a backlog of sounds or stack whole-preview squash.
- Unaffordable/locked: concise local resistance cue and truthful reason. No
  spending particles, no successful-equipment sound.
- Keyboard focus/touch use the same semantic state. Never rely only on hover,
  hue, sound, motion or a tiny particle to explain success.

## Audio and motion priority

One action sound phrase: weapon/attack supplies the transient, shell can supply
one short material texture, real status/proc may add one quiet confirmation when
needed. Core/World/Spark/Apex do not each add a loop. Limit ordinary overlapping
contact phrases (prototype: three), coalesce same-source microcontacts, and never
mask hostile tells. Keep controls/purchase sounds short and separately limited.
Mute/interrupt cleanup must not replay buffered sound on resume.

Reduced motion removes tiny lag, decorative interpolation, glints/afterimages,
shake and optional impact flicker first. Keep static active/spent shapes, actual
attack footprint, source timing, input feedback and essential enemy tells.
Low quality reduces ornaments and fitted tertiary details, never purchased
mechanical benefits or accurate aim. Offscreen sources and pause/resume still
use true simulation state, not accumulated animation time.


# F. Delivery, regression prevention and release qualification

## F1. Nonnegotiable chunk protocol

Every chunk is a small reviewable diff with one gameplay/presentation purpose. Do not combine an engine extraction, changed damage semantics, redesigned UI and all 73 visuals in one patch.

1. **Specify:** name affected IDs, hook, intended numeric/state change, retained behavior, replaced legacy mapping, dependent chunks, safety budgets and rollback boundary.
2. **Characterize:** record deterministic current results before editing: normalized equipment, profile, accepted source log, movement/resource outcomes, wallet/save fixture, current images. Known defects get named regression fixtures, not hidden baseline acceptance.
3. **Test target:** add positive, negative, boundary and conflict tests. A changed old expectation requires a written intended-change reason beside the replacement assertion. Never delete unrelated tests to obtain green.
4. **Implement behind one atomic policy:** pure helper first, narrow adapter second, no duplicate legacy/new writer. Mechanics/readout/preview/icon/animation agree before enabling a replacement. Incomplete replacement stays disabled; retain old purchased benefit for that run policy.
5. **Verify locally:** targeted unit/integration suite, all existing tests, both production builds, affected browser flows and deterministic comparison board. Inspect diagnostics/counts and actual outcome, not just no console error.
6. **Review regression budget:** baseline-equivalence for unrelated state, bounded new state/allocations, before/after visual inference and reduced motion. If the chunk fixes one issue but adds unexplained drift, stop.
7. **Enable at next-run boundary:** no live pending-source reinterpretation. Retest enabled configuration, not just disabled default. Remove stale compatibility branch only after all callers migrate and gates pass.
8. **Rollback exercise:** disable/revert chunk in development, load the same save/preset, run a new session and verify owned items/credits and unaffected behavior. The rollback path is tested, not merely mentioned.

Small implementation commits/checkpoints may be used when implementation is requested; this planning turn neither commits nor pushes nor changes gameplay.

## F2. Dependency-ordered delivery map

Each row can have multiple small subchunks; no row is permission to touch everything at once.

| Stage | Scope / expected output | Dependencies and exit gate |
| --- | --- | --- |
| S0 — Baseline ledger | Current test/build/browser status, exact recipe/source/clock/save snapshots and known defects | No gameplay change. Separate environmental failure from code failure; do not claim historical results are current |
| S1 — One family authority | Art/shop/readout selected family follows existing sword specificity/ties; discoveries separate | S0; all 17 exact recipes, compatible unions/four known mismatch fixtures; sword numeric values unchanged |
| S2a — Source identity in shadow | Explicit IDs/ownership/source kinds around existing direct/secondary paths | S0; event/score/charge/hp logs baseline-equivalent, no added RNG or damage call |
| S2b — Admission and transaction adapter | One migrated source at a time; dedup, alive→dead once, bounded accepted source policy | S2a; rapid launch saturation/source cleanup and reward order pass before new child sources |
| S3a — Geometry reference solver | Single absolute dimensions/provenance adapter, initially equivalent for retained profiles | S0/S1; collision/aim/preview parity, no hidden extra close-radius coverage |
| S3b — Clock/status seam | Base/target/hazard timing contracts, bounded state and finite velocity under freeze | S2a; fake-status tests plus existing pace/hazard/physics suite unchanged |
| S4a — Universal mounts | Paper/Iron/Hologram roots first, then all ten shell adapters and common part sockets | S1; pose/scale/clearance/draw-state checks and idle no emissions; no rule change |
| S4b — One event budget/action owner | Migrate existing cosmetic sources incrementally, shared action priority, pooled requests | S2a/S4a; no duplicate contact/bank/recovery bursts; all old emitters accounted before global budget claim |
| S5 — Nonattack proof trio | Notched recovery, Segmented stored loss, Hologram needle phase, **one per subchunk** | Relevant S2/S3/S4 seams; each old perk removed only with complete new test/preview/readout; no unrelated combat drift |
| S6a — Cold/control contrast | Frost then Comic then their pair | S2b/S3/S4; frozen tell versus emitted hazard, immunity, collision-aware push and one composed contact |
| S6b — Precision geometry | Katana then Laser, Ghost/Glacier timing integration | S3a/S4; B4 formula, obstruction/two-victim cap, actual narrow coverage and unchanged grace |
| S6c — Speed/force contrast | Volt, Tide, Void, one per subchunk | S2b/S3; conduction dedup, own-excess removal, bank cap, field displacement/pulse and no eviction |
| S6d — Delayed/projectile contrast | Ember, Glitch Slash, Echo Dash, Confetti, Pixel, one per subchunk | S2b/S3; due events once, source caps, walls, expiry, primary/secondary proc separation |
| S6e — Remaining attack baseline | Ink/Adaptive/Razor and all attack/core grid | S3/S4; target widths/neutral identity/reference cut, no accidental old generic perk stacking |
| S7a — Awareness and initiation | Neko, Obsidian, Hypno, Time, one per subchunk | S3b/S4; new acquisition only, one-target hold/cooldown, no global AI/threat cadence freeze |
| S7b — Offense/resource replacements | Oni, Blaze, Sniper, Lava, Glass, Spectrum, one per subchunk | S2b; shared plate/resource order, charge/health caps, secondary exclusions and explicit legacy removals |
| S7c — Momentum and worlds | Chamfer, Viper Tails, Tokyo, Foundry, Manga, Void world, one per subchunk | S3/S6c; true vector/charge accounting, no speed minting or old score residue; stable world geometry/spawns |
| S7d — Retained part performances | Remaining heads/eyes/shells/cores/tails; per-card polish in groups of at most3 | S4/S6/S7 as relevant; benefits retained and material identity/source/readiness visible |
| S8a — All core treatments/Sparks | Seven core grammars,49 explicit-Dash treatments,18 pair recipes grouped by D0 | S4 plus relevant real powers; merge generic routes and test overlap/removal, no independent emitter/proc |
| S8b — All Apex choreography | Six family adapters,17 build variants in small batches | S1/S3/S6/S8a; truthful variant windows/geometry, all non-recipe slots still integrated, no duplicate signature |
| S9a — Instruments | Diamond replacement, all Pointer/Radar/Trajectory previews and display states | S3/S6/S7; same profile/target-local state, no input/AI/RNG mutation or paid accuracy trick |
| S9b — UI/world/audio parity | Unique item icons, nested shop interactions, truthful swap receipts, accepted sounds and world rim adapters | S4/S8/S9a; purchase transaction/cancel/focus/lifecycle, no quest UI or mode ceremony |
| S10 — Complete qualification | Full coverage, swap board, source saturation soak, saves/credits, quality/accessibility and device measurements | All gates below; unresolved high-risk cases prevent feature activation, not just a footnote |

### Complete item accountability

The per-item implementation hook/test printed in every Part C card is its work order even for retained items. A stage is not complete merely because “cores” or “sensors” was checked off. Maintain a73-row implementation ledger with columns:

`id | retain/replace | legacy mapping removed? | rule/source | pose/icon | preview/readout | positive | negative | boundary | conflict | lifecycle | enabled policy | evidence`

Use N/A only with a reason (for example a neutral baseline has no damaging source), not to skip an item. The18 Spark/17 Apex rows get a parallel descriptor/selection/overlap/scale test ledger. Nothing claims implemented coverage until its row links to actual tests and evidence.

## F3. Reuse existing regression suites; add narrow tests

These are inspected repository paths, not tests written or run by this document.

| Area | Existing starting points | New coverage to add with the relevant chunk |
| --- | --- | --- |
| Catalogue/perks/receipts | `test/equipment.test.js`, `test/part-perks.test.js`, `test/catalog-complete.test.js`, `test/power-readout.test.js`, `test/shop-item-audit.test.js` | All 73 work orders, per-ID legacy subtraction, released-policy parity, marginal cap explanations |
| Family/sword behavior | `test/swords.test.js`, `test/hybrids-challenges.test.js`, `test/harmony-expansion.test.js`, `test/harmony.test.js` | Selected family agrees everywhere, all compatible unions, exact17 variants, nonselected discoveries don't add sources |
| Launch/speed/contacts | `test/launch-agreement.test.js`, `test/movement-contract.test.js`, `test/speed.test.js`, `test/hyper.test.js`, `test/clean-banks.test.js`, `test/physics.test.js` | Own-excess Volt, retained loss, proportional bank cap, no zero-speed farming, finite collision-safe shove |
| Combat/AI/status | `test/combat.test.js`, `test/enemy-attacks.test.js`, `test/enemy-zones.test.js`, `test/run-integrity.test.js`, `test/combat-trace.test.js` | Explicit source policy matrix, world-vs-local timers, same-tick kill dedup, death/generation reset, freeze0 safety |
| Art/performance/material | `test/body-construction.test.js`, `test/character-performance.test.js`, `test/face-core.test.js`, `test/art-engine.test.js`, `test/upgrade-construction.test.js` | Every socket/channel owner, all pose/scale draws, no duplicate transform, source-vs-ornament signatures |
| Instruments/input | `test/aim.test.js`, `test/sensor-upgrades.test.js`, `test/radar.test.js`, `test/input.test.js`, `test/drag-input-spec.test.js` | Same geometry hash, conditional near bands, frozen tell data, DPR/touch-capture loss, no double assist |
| Shop/purchases/previews | `test/shop-wallet.test.js`, `test/shop-demo.test.js`, `test/shop-nesting.test.js`, `test/shop-action-separation.test.js`, `test/upgrade-preview.test.js`, `test/ui-icons.test.js` | One click→one transaction, cancelled/locked/failed equip, unique icon semantics, truthful fixture preview, no live-run mutation |
| Lifecycle/render/audio | `test/web-performance.test.js`, `test/render-visibility.test.js`, `test/bake.test.js`, `test/impact-limits.test.js`, `test/audio.test.js`, `test/upgrade-contact-lifecycle.test.js` | All cosmetic sources budgeted, hidden/resume no debt, idempotent cleanup, cache/pool bounds, GL fallback/restoration, sound coalescing |

Old tests sometimes assert the old generic perks or inspect source text. Replace those assertions **only with the intentionally changed work order**, preserving equivalent outcome assertions and adding the negative “old benefit absent” test. A regex/source check alone does not prove runtime behavior. Historical quest/practice tests may test isolated modules; that does not authorize reattaching them to the current game UI.

## F4. Coverage tiers — test the large space honestly

The catalogue currently has663,828,480 syntactic loadouts and2,402 cross-slot item pairs before ownership constraints. No practical screenshot board exhausts all loadouts. Use complementary finite guarantees:

1. **Data completeness:** all 73 items once in the work-order ledger; exact18 Spark/17 Apex IDs/parts; IDs unique, slot-correct and save-compatible.
2. **Pure-descriptor pair sweep:** enumerate every2,402 cross-slot pair in a neutral fixture; valid anchors, finite dimensions, deterministic channels, no forbidden writes. Add direct pair recipes even when their state is inactive. This is structural coverage, not proof of combat/art quality.
3. **Attack matrix:**8 Dash×7 Slash=56; ×7 cores=392. Test profile/source invariants for every cell; all 10 shells exercise construction without turning this into3920 full browser sessions. Relevant stateful head/tail/world interactions get focused event fixtures.
4. **Recipe overlaps:** all 17 exact Apex, all compatible pairwise recipe unions and higher compatible unions from bounded subset enumeration; enumerate18 Spark subsets compatible by slot for resolver tests. Assert final family equals sword selection rather than a brittle count of four failures forever. Known union examples remain named regressions.
5. **Seeded generative cases:** generate normalized loadouts and legal action sequences with recorded seed/command log. Check finite state, hp/resource bounds, source caps, no dead-target reward, source/target once, no cosmetic mutation. On failure minimize to the shortest action/loadout case and promote to permanent test. Random tests supplement boundaries; they do not replace them or claim exhaustive safety.
6. **Metamorphic checks:** draw zero/one/ten times between identical ticks; change resolution/quality/world rim/sensor display; reorder equipment-object keys; pause without elapsed simulation; open/close preview. Assert unchanged relevant combat/RNG/wallet snapshots. For intended sensor-perk replacements compare against the new source policy, not the intentionally removed old+1 tick.
7. **Boundary table:** threshold−epsilon / exact / +epsilon for power, range, angle, speed, world deadlines, immunity, caps, source admission and wall clipping. Test fractional dt and event order where two deadlines cross in one step.
8. **Human inference:** compare at small actual play scale. A result can pass unit tests and still look like a damaging harmless particle; fail art review until corrected.

## F5. Risk register and prevention recipe

| Failure mode | Prevent / detect | Response before enable |
| --- | --- | --- |
| Art chooses different Apex than combat | Single selected build authority + union tests | Keep old art feature disabled until shared selection works; do not retune sword to match first art recipe |
| Old perk plus replacement both apply | Per-ID atomic mapping test and old-benefit-negative assertion | Revert replacement chunk; preserve ownership, not double power |
| Buff/family ticks added twice | One profile provenance graph, numeric variant/window tests | Stop geometry slice, fix adapter before artwork tuning |
| Laser appears narrow but broad radial fallback still hits | Exact near/off-axis shape fixtures and shared absolute geometry | Deliberate redesign adapter, not image-only change |
| Reaper/Ghost benefit erased by six-tick laser | B4 composed gate tests | Do not ship universal hard-six override |
| Secondary attack farms primary counters | Explicit source eligibility table, unknown denied, parent-source test | Migrate offending call path; no ad-hoc string exclusions |
| Same enemy dies/awards twice | Alive→dead transaction identity and target-generation key | Fix committer; UI dedup alone insufficient |
| Pending source disappears at capacity | Reserve before accept/spend; saturation trace | Publish/test source eligibility cap; never solve by cosmetic culling |
| Freeze creates NaN or stalls global AI | Per-operation target dt, finite velocity assertions, hazard/global cadence controls | Keep status disabled; don't pass dt0 through whole move loop |
| Timers extend through target slow forever | World deadline ledger, strongest-status fixtures | Correct timer domain, not shorten art |
| Momentum gain repeats or erases Hyper | One contact ledger, original vector/own-excess tracking, high-speed tests | Revert movement subchunk; no camera compensation |
| Live preview changes live run/RNG/save | Separate readonly snapshot or isolated disposed fixture, mutation hash test | Detach preview adapter and restore authority boundary |
| New particles bypass budget through legacy emitter | Emitter inventory and aggregate counters at scene boundary | No global budget claim until every emitter is accounted for |
| Changed material hides real damaging projectile | Semantic class+shape protection, grayscale/small-scale board | Remove cosmetic material treatment, not source visibility |
| Rapid click buys/equips twice | Existing validated wallet transaction, disabled/in-flight control guard, double-input tests | Roll back UI handler; no compensation credit loop |
| Event route throws after damage | Render event drain isolated from simulation; immutable committed result, error diagnostic | Fix consumer without replaying transaction |
| Cached preview leaks old family/guard | Equipment/policy/material key + per-scene state separation | Clear bounded cache at proper boundary; no global mutable profile |
| Listener/timer/GL/pool leak | Repeated lifecycle tests and counts returning to baseline | Stop next chunk, fix ownership/dispose idempotency |
| Tests green only because expectations were loosened | Intended-change ledger + independent negative/baseline assertions | Require explanation/review; reject blanket snapshot refresh |
| Software browser result mistaken for mobile FPS | Record environment and actual-device p50/p95/p99 frame/memory trace | Report performance unverified until measured; don't claim locked60FPS |

## F6. Commands and evidence, not just intentions

During implementation:
- Start with `node --test test/<affected>.test.js` for the named runtime tests; new test filenames are chosen by their chunk. Then run `npm test`, not only the new suite.
- Run `npm run build` and `npm run build:poki`; inspect actual bundle-check output/delta against the repository's configured limit. Passing these does not certify platform acceptance.
- Use current relevant browser QA scripts after inspecting their assumptions, for example `scripts/shop-nested-qa.mjs`, `scripts/harmony-browser-qa.mjs`, `scripts/swords-browser-qa.mjs`, `scripts/sensor-upgrades-browser-qa.mjs`, `scripts/upgrade-construction-browser-qa.mjs`. They are starting points, not guaranteed current acceptance harnesses. Do not rely on obsolete room assumptions in `scripts/preview-smoke.mjs` or reconnect removed quest UI to satisfy an old script.
- Serve browser QA on0.0.0.0 with allowed preview hosts and relative browser-facing service paths. A running dev server is a live preview, not test evidence by itself.
- Check `git diff --check` and inspect changed/untracked files. Generated captures/logs belong in ignored scratch space, not huge committed datasets. Keep only small durable regression fixtures required by the repository's conventions.

Every stage records: exact revision/policy, seed/loadout/input sequence, command/environment, result, intentional deltas, unresolved failures, source/budget counts, capture locations and rollback result. Do not report a target test as passing before it exists/runs. A source-inspection check is labeled as such.

## F7. Visual and lifecycle sign-off

Use the single-swap fixtures in E as the comparison board: idle, prepare, release, accepted contact, active status/secondary, recovered. Include small/large preview, portrait/landscape, Standard/Low, reduced motion, grayscale and color-vision checks. No idle emitter, dripping stain, endless ribbon, hidden player or permanently pulsing backdrop.

Repeat: preview open/close; shop family/filter changes; same item equip; purchase double-tap; preset load; run restart; hidden/resume; resize/DPR; quality toggle; mute/unmute; supported GL loss/restore. Verify no stale route, duplicate sound, double transaction, retained target reference or delayed attack after disposal. Observe plateauing live resource counts rather than asserting heap must return byte-for-byte after garbage collection.

Actual device profiling uses representative supported desktop/mobile/tablet hardware, crowded legal sources, UI overlays and prolonged play; record frame distribution and memory/resource trends. No blanket FPS claim based on a desktop/software-GPU trace. Fix density by removing weak ornament, not weakening purchased effects, hiding threats or skipping physics.

## F8. Definition of complete

The unified redesign is complete only when:
- All 73 item work-order rows are implemented/verified or explicitly disabled with their old released benefit retained, with no claim of full completion for disabled rows.
- All 18 Spark integrations and17 Apex constructions use shared rules/selection and pass overlap/scale/removal checks.
- Full rule/source/aim/preview/readout agreement holds in tested contexts; no animation writes mechanics.
- Accepted attacks/status survive cosmetic saturation while gameplay sources remain explicitly bounded.
- Wallet/save/preset/credit and continuous-play invariants pass; quests stay detached.
- Global particle/audio/cache/lifecycle limits are measured, not inferred from one isolated emitter.
- Current tests/builds, browser comparison board and required device checks are recorded with unresolved work stated honestly.
- Rollback keeps owned IDs/credits and rebuilds clean transient state at a run boundary.

**The standard is not “no bugs are possible.” It is “every intended change has an owner, every known risk has a test/gate, and nothing ships on the strength of attractive screenshots alone.”**

### Implementation checkpoint — chunk9 assembled construction

Delivered the shared ten-shell lower-chassis/material-socket pass, seventeen fitted family front assemblies and enlarged free read-only shop inspection (`?assembly=1`). This is the appearance/construction portion of D1–D5, not completion of all item mechanics or source-admission policy. Static frozen descriptors are bounded128; small-scale detail gates and existing actual-state cues remain authoritative. Explicit dash/slash and distal blade geometry are protected. See the chunk9 entry in `upgrade-harmony-implementation-progress.md` for scope, native seven-case gallery/transaction QA, original-renderer pixel comparisons and remaining gates.

### Implementation checkpoint — chunk10 core mechanisms

Delivered seven fitted core mechanisms across all ten shell materials, actual-state read-only core cues, protected chamber interior/fitted Spark terminals, and the shared installed/enlarged shop inspection (`?coreView=<core-id>`). The original49 Core×Dash treatments and any not-yet-implemented Part C mechanics remain future work: this chunk does not invent powers or change source admission. Time exposes real passive return only, not a guessed private bonus timer. See chunk10 progress for all70 core/material pixel evidence,392 unchanged attack cells, actual-run authority tests and seven-case native core-inspection QA.

### Implementation checkpoint — chunk11 reactive shells

C19 Hologram's precision needle phase is implemented: accepted-launch4-world-tick gate, one exact eligible Prism/Crown needle pair until clear,120-world-tick accepted-use recharge, swept entry-time boundary, no old aim discount or general invulnerability. Iron's existing one-use guard and Prism's existing two-needle cooldown now have fitted true-state hardware/HUD and enlarged ability studies. This is not completion of future Prism swept/solid/source-admission gates. See chunk11 progress for16 focused tests,12 native cases,252 visual combinations and392 unchanged attack-render cells; old gameplay baselines remain intact.

### Implementation checkpoint — chunk12 world architecture and free panoramas

Delivered the screen-wide architectural presentation block for C54–C58: Tokyo service towers/skybridge, Foundry pressure vessel/furnace/hoist, Manga printed panels/ink facades, Synth obelisks/terraced perspective deck and Void broken orbital gate/eclipse. All five now have continuous two-plane camera-relative travel and shared gameplay/public-preview geometry; renderer-owned bounded half-resolution bakes keep the static construction off the hot path. C53 stays neutral: existing industrial district/rules retained, one quiet distant crane added, no new ambient particles. World Panorama is a free, read-only shop tour using this same adapter, with native pause, reduced-motion still and existing separate explicit buy/equip.

**This does not complete C54–C58 powers.** Existing world perks/receipts are unchanged; no bank-speed contribution, forge prime, replacement chain grace, grid refund or C58 recoil was enabled or visually claimed. No physics/camera-lead/collision/spawn/source-admission/save edits. See chunk12 in `upgrade-harmony-implementation-progress.md` for 21 focused tests, 24 native layout/world cases, genuine before/after evidence and remaining device/readability qualification.

### Implementation checkpoint — chunk13 seven-tail toolkit and two real power replacements

C34–C40 now share seven distinct fitted tail constructions in the live character and enlarged shop studies: single folded baseline cloth, paired crystal feather banks/recharge latch, two unequal spectral cloth ends, twin tension stabilizers, interlocked heavy chain/blunt weight, twin dry-idle jet cans, and three discrete Spectrum bands/cells. Actual read-only tail state drives readiness/count/activity and accepted marginal event cues. No independent idle tail sine, persistent jet flame, cycling Spectrum hue, extra damaging tail collider or particle emitter was added. Committed dash ownership remains protected from later velocity changes.

**C37 implemented:** ordinary steering loss is reduced by15% of the loss on legal Viper relaunch (.85→.8725); Hyper, gentle stronger retention and the existing legal speed clamp retain priority. Old+10% speed score is removed. **C40 implemented:** three unique eligible primary kills within one chain pay at most one extra EDGE after the ordinary kill refund, then120 world ticks of cooldown; secondaries/tutorials do not count, incomplete chain progress clears on break and full EDGE consumes completion without queued payout. Old+12 chain ticks are removed. Prices250/600, IDs, ownership, presets and save schema stay unchanged. Other tail powers retain existing rules.

See chunk13 progress for17 focused cases,28 native layout/item cases,980 genuine hero comparisons,392 unchanged attack cells, exact old-contract replay and the explicitly bounded six-build/seed migration receipts. This does not complete the remaining elemental/world power replacements, Ghost/Laser shared-window redesign or source-admission transactions.

### Implementation checkpoint — chunk14 eye systems / ignition and local daze

C10–C16 now have seven distinct fitted face constructions and free enlarged read-only eye studies using the same hero renderer: hand-cut Ninja slits, mounted cyan glass, flame-cut ignition sockets, broken X/ring recovery conductors, actual half lids/gold Drive opening, continuous Hypno spirals and a crimson precision lens. Existing gaze/blink/attack expression is preserved; ability lighting uses actual read-only state, not decorative idle scanning. No new particles, textures, body collider, targeting assist or attack resolver.

**C12 implemented:** a fresh real Overdrive entry grants at most one extra EDGE after the ordinary kill refund, capped at current capacity; full consumes, active refresh does not regrant, and no queued payout or additional timer extension exists. Old +8% Drive score is removed atomically. **C15 implemented:** 18 continuous fixed usable-aim updates (60 Hz input clock, frozen during hitstop) admit one idle Fang within140 and clear static sight; only NEW initiation is gated for12 world ticks. Motion/existing attacks continue. One per hold,90-world-tick target-object immunity from acceptance. Using the input clock for the hold avoids requiring more slowed world time than a normal focus tank can supply. Daze and immunity use the same real world clock as Time/focus; no compounded slow. Walls, bosses, already-attacking/pinned/training/dead targets, lock, stun, depleted focus and teaching contexts do not admit. Old15% aim discount is removed.

**C11/C13/C14 existing mechanics retained; C10 stays baseline. C16's +10% full-power score is retained, not its planned puncture replacement.** The new sight reflects actual aim-power eligibility but adds no armor damage, width reduction or guaranteed hit. No claim that all C10–C16 choreography/sound or remaining elemental/world/source-admission work is complete.

See chunk14 in `upgrade-harmony-implementation-progress.md`:15 focused tests,28 native eye/layout cases,980 genuine pre-edit visual comparisons,392 unchanged attack-render cells,1243 passing full-suite tests and preserved original simulation fixtures. Prices, ownership, save schema and family identities remain unchanged.

### Implementation checkpoint — chunk15 ability-first shop and player-language boundary

Delivered16 item-specific head/core ability showcases, the same fitted hero plus clear explanatory diagrams, and an accessible appearance→effect→use→limit guide for **all73 catalogue entries**. Normal head/core browsing defaults to “See the ability”; assembly/core hardware inspection and explicit practice remain available. The new slate/cream shop treatment preserves navigation, free try-on, challenge locks and separate purchase/equip.

Player-facing shop/readout/canvas/discovery/practice wording now uses seconds or brief plain-language phrases rather than internal timing units. Exact combat numbers remain internal; short display durations are approximate. Notched retains its actual marginal bonus at the shared cap. Deferred Ember/Frost/Echo/Sniper powers are explicitly excluded, not advertised by their visual metaphor. This checkpoint changes **presentation and explanations, not item balance**.

See chunk15 progress for11 new tests,64 native item/layout cases, all73 shop regression coverage, genuine pre-edit UI/copy comparisons,1260 unchanged live-hero cells,392 unchanged attack cells, the read-only Space-scroll fix, full-suite/build results and remaining mechanics/device gates.

### Implementation checkpoint — chunk16 precision puncture and aiming-tool lessons

C16 now replaces Sniper's old full-power score with the planned first eligible nonboss armor puncture. An accepted dash snapshots existing authoritative released power; at ≥.9, its first committed direct Crown/Bastion contact gains exactly one extra plate and the whole shot's forward corridor is ×.9 width. Ordinary victims, bosses, duplicates and secondary routes do not spend the allowance. No homing, extra beam, projectile or score bonus. The bonus is added **after** legacy Drive/kinetic/execute/second-target damage, not multiplied by it; Crown/legacy sword/temporary armor terms retain their previous named base order. Reset/rejected-launch ownership is explicit.

`primary-contact.js` provides a tested **legacy-order adapter**, shot narrowing and +2 extra-equipment-plate receipts (including consumed/cap-limited entries). This is **not** the complete B8 redesigned reach/positive-width solver: no new Katana/Laser/Ink/Comic/Foundry modifiers are enabled, the established close-contact/body collider rules remain, and legacy family reach still has its established width relationship. No global geometry migration or accidental radial fallback is claimed. The first-frame marker fallback now reads the run's resolved geometry rather than omitting equipment/temporary/shot factors. The active rendered weapon also uses the explicit shot width scale; inactive/default art is unchanged.

Thirteen free read-only shop lessons cover Sniper, all4 aim marks, all4 radars and all4 flight paths. Actual pointer construction, marginal recovery/drain/blade rules, live radar range/projection and the real wall-clipped release predictor drive the examples. Conditional bonuses/limits are labelled; forecast gray is an illustrative full reference, not a paid extra prediction. Oracle's data is derived from that same trajectory. Pointer defaults to See the ability; Drag Arrow and explicit practice remain available. No pointer/sensor balance changes: C42's information-envelope migration remains deferred, so Prism Pointer still honestly shows its existing extra cutting time.

See chunk16 progress/audit for genuine before/after migration evidence, native device-layout cases, baseline preservation and final build/test results. Older chunk14/15 statements about *retaining* Sniper's score were historical checkpoints and are superseded by this atomic C16 migration.

**Final chunk16 gate:**1267 tests and52 native aiming-tool cases pass;24 genuine pre/post mechanics cases and13 changed-study/1260 unchanged-hero/392 unchanged-default-attack render checks pass. Both build modes pass (1128.01kB raw/416.61kB gzip). See progress for exact scope and deferred policies.

### Implementation checkpoint — chunk17 Brush Cutter / eight dash lessons

C60 now replaces Ink's old+1 blade step with **up to12% primary width**, with actual convex-query coverage and unchanged launch/body/reach/dedup. The positive-width portion of B8 now has one far/near resolver: eligible Samurai, near Magnet and Ink compose in head→core→Dash→Slash receipt order under1.35; independent narrowing follows; family geometry and temporary upgrades stay separate. **Deliberate compatibility change:** Samurai+Magnet's previous1.44 near width now caps at1.35, including without Ink. This prevents Ink from making an uncapped old combination worse; its capped near-band marginal gain is correctly shown as0%. Original family/reference reach coupling and the legacy near distance are retained, not silently normalized or shortened.

Eight free dash ability lessons explain current rules using real production dash samples, width/recovery/score helpers and marginal cap receipts. Default Dash FX opens See the ability; Elemental Dash/practice remain available. Ink's broader nib/icon and active weapon show its wider-cut purpose. Remaining dash powers retain their existing honest benefits and exclusions—no premature burn/freeze/relay/pull/replay claims. C59 neutral-only Adaptive geometry and C60's complete traveled-stroke/contact/taper/sound choreography remain deferred, alongside the rest of the reach/elemental/world/source-admission work.

**Final gate:**1278 tests;32 native dash/layout/practice/transaction cases;48 genuine pre/post mechanics comparisons;8 replaced-study/1260 unchanged-hero/343 unchanged-other-attack/49 explicitly changed-Ink render cells all pass. Existing shop6/all73 and targeted core2×7 regressions pass. Both build modes pass at1135.51kB raw/418.88kB gzip. No saved-data migration or simulation-baseline overwrite. See chunk17 progress for exact compatibility exception, native coverage and limitations.

### Implementation checkpoint — chunk18 C61 Ember contact ignition

C61 is implemented with the conservative **no active-burn refresh** policy: one admitted direct contact per accepted launch, surviving victim plus nearest≤2 eligible nonboss neighbors within56 and static sight, one secondary unit at world+18/+36, capacity24, then expiry. Ember's old+2 blade duration is gone; independent width×.90 is the cost. Dedicated burn damage avoids legacy secondary primary-resource grants; ordinary death/score/credit/Fork/Crown aftermath remains. Source shot/parent and target identity persist across subsequent launches; teaching/boss/death/wave/run cleanup is explicit.

Three launch embers, at most two contact embers, a brief ignition cone and tiny steady target-status seams replace the broad fire ribbons for Ember only. Actual units contract the seam; reduced motion retains static status. The shop icon/receipts and free slowed damage sequence migrate atomically; the local demonstration executes the same finite burn ledger. Other dash lessons, generic family fire treatments, hero construction, purchases and saved data remain protected. See chunk18 progress for genuine pre-edit comparisons, focused/native/full tests and stated qualification limits. This does not complete global S2b/B8/status infrastructure or the remaining dash work orders.

**Final chunk18 gate:**1289 tests;32 native dash/shop cases;4 native real-run/render sequences;72 genuine pre/post mechanics cases; replaced Ember/7 unchanged lessons,1260 unchanged heroes,343 unchanged unrelated attacks,49 changed Ember attacks PASS. Shop6/all73 and core2×7 regressions PASS. Both single-file builds PASS at1144.23kB raw/421.76kB gzip (Poki421.75). No original fixture overwrite or saved-data migration.

### Implementation checkpoint — chunk19 C63 Frost motion control

C63 now replaces the8% aim discount with first eligible primary contact: surviving nonboss victim+nearest≤1 eligible neighbor within60/static sight. Fangs pause locomotion and own AI clocks18 world-time units; other ordinary bodies receive locomotion×.70 for24, **not** a slower attack timer. Actual expiry starts90 immunity; no refresh/stack/reapplication through it. Pinned/protected teaching actors and bosses resist. Local active+immune capacity32, target-generation/death/run/wave cleanup, fractional-interval integration and zero-dt safety are explicit. Frozen rushing contact and emitted hazards remain dangerous; no damage/player physics/resource change. Grav respects frozen zero motion; Time remains its existing focus recovery/common world clock rather than an invented second slowdown.

Launch facets,3 contact chips, closed frozen/open slowed rims, static reduced-motion status, actual2-piece thaw, resistance notch and local status labels/radar marks follow the production ledger/AI. The new facet/stop-collar icon and player-language receipts replace old discount/no-freeze claims together. The enlarged free lesson caches isolated production-AI with/without tracks and shows paused countdown, heavy drift, resumed motion, recovery and continuing emitted danger. Other7 dash powers/lessons and generic family ice art remain unchanged.

C62 Volt remains pending; this is one complete C63 status/animation/shop block, not a claim of global status/S2b/B8 completion. See chunk19 progress for29 focused tests,144+28 genuine mechanics comparisons,32 native shop cases,16 native live-render sequences, protected visual matrices and stated qualification limits.

**Final chunk19 gate:**1318 tests;32 native dash/shop cases;16 native real-run/AI/render sequences;172 genuine pre/post mechanics cases; replaced Frost/7 unchanged lessons,1260 unchanged heroes,343 unchanged unrelated attacks and49 changed Frost attack cells PASS. Shop6/all73/core2×7 PASS. Both single-file builds PASS at1156.05kB raw/426.47kB gzip. No original fixture overwrite, saved-data migration or deployment.

### Implementation checkpoint — chunk20 C65 Void Collapse Well

C65 replaces the12% armored-kill score perk with one fixed-origin18-world-unit contact field, up to3 nearest sight-clear movable nonboss survivors within110, at most32 actual source displacement each under swept solids/arena/post leash, then one exact secondary unit only for admitted surviving generations within28/static sight at expiry. One-live-field/no eviction/no refresh and36 cooldown from admission are explicit. No cancel payout, late-target capture, boss damage, primary refunds, projectile absorption or player phase. Grav yields its weaker pull on affected targets; cold constraints are respected. Ember's established scheduled-unit authority is shared without changing its contract; global S2b/status redesign remains pending.

Keylined launch crescent, split outer/core boundary layers, actual-victim inward cues, compact core-limited pulse and aim-only recharge terminal follow the real source. Hostile attacks remain painted above the field. The new ring/core icon and enlarged free ledger-backed shop cutaway replace old score claims together. Other7 dash powers/lessons, hero construction, generic family art and saved transactions are preserved. See chunk20 progress for28 new tests,192+28+48 genuine comparisons,32 native shop cases,16 native real-run/physics/render sequences and qualification limits. Volt/Tide/Echo replacements remain pending; this is one complete C65 item block.

**Final chunk20 gate:**1346 tests;32 native dash/shop cases;16 native real-run/physics/render sequences;268 genuine pre/post mechanics cases; replaced Void/7 unchanged lessons,1260 unchanged heroes,343 unchanged unrelated attacks and49 changed Void attack cells PASS. Shop6/all73/core2×7 PASS. Both single-file builds PASS at1168.94kB raw/430.89kB gzip (Poki430.88). No original fixture overwrite, saved-data migration or deployment.


## Implementation checkpoint — chunk21 / C66 Echo Dash

**Implemented as one complete item block:** Reprise Stroke replaces12 chain-grace units, keeping ID/price350/saves. An opt-in real-physics subsegment observer records at most140 traveled units/six samples on a12-unit-wide lane; measured sharp bends consume vertices, capacity exhaustion seals, and static solids/bank/relaunch/discontinuity stop recording. After12 world units, one old-path replay queries actual enemy convex bodies at replay time, deterministic path order, max2 targets/exact1 secondary unit each. Current solids clip the path again. Surviving primary victims may be hit once more under the distinct dash-reprise source; late arrivals can enter, off-path current-player neighbors stay safe. Bosses take one unscaled chip only during active boss combat, with ordinary boss defeat bookkeeping. No primary-resource/Coil/burn/replay recursion.

**Resolved B6 admission:** exactly one pending reservation. Accepted attacks are not evicted by later legal launches, visual caps or mutable-buffer reuse. Busy launches seal the original recording but are ineligible for another source; they allocate no source and queue nothing. Pending clears only on fire or explicit lifecycle cancellation without payout. Hitstop does not advance the deadline. Boss-active cleanup preserves this source while retaining unrelated noncombat cleanup policies.

**Visual/shop delivery:** small source offset, one real pending outlined path/countdown notch, one bright true-width replay above bodies/below hazards, actual-hit seams,0–2 harmless dissolve notches and aim-only slot readiness. No opaque hero stack. New solid/outline/delay-notch icon. Enlarged immutable production-ledger shop examples show travel/wait/replay, survivor and late-arrival hits, current-player-neighbor safety, miss, wall clipping, busy launch and dash/core/sword source distinction. Plain player copy removes the old combo claim atomically.

**Evidence:**26 focused tests;384+27+28=439 genuine pre/post controlled mechanics comparisons;7 other lessons/1260 heroes/343 other attack cells pixel-identical,49 Echo cells deliberately changed;32 native dash/shop cases plus4 final Echo polish cases;16 real-run/physics/render sequences; shop6/all73/core2×7 regressions PASS. Normal/Poki single-file builds PASS1182.63kB raw/436.21kB gzip. Full suite1372/1372PASS, plus48 targeted tests after final paint readability polish. Original3 simulation fixtures remain byte-identical to their genuine pre21 copies. Global source/status/geometry stages, Volt/Tide and full Spark/Apex remain pending; this is not their completion.


## Implementation checkpoint — chunk22 / C62 Volt Dash

**Plan executed:** replace fast-kill score with owned ordinary-launch burst, narrower geometry and one first-contact conduction reservation; rebuild the matching lance/link/readiness/icon and large shop demonstration, then prove movement, source and transaction boundaries.

Arc Lance adds12% ordinary launch velocity for4 world units and removes only its own vector over6, with a separate finite physics allowance. Legal relaunch cannot compound the contribution. Faster-than-ordinary/Hyper launches do not gain another burst; gravity stays independent, actual caps scale ownership, and bank/static SAT contact/Hyper/unrelated velocity writers transfer ownership without a later clawback. Primary width.85 composes once; no old speed-score perk, collider/reach/window/passive-resource change.

First eligible direct contact, including a killed origin, consumes one attempt. Volt selects one nearest eligible nonboss within120/static sight; with Coil, the same reserved contact can add one different victim within160/static sight. Volt reserves first, no duplicates, no later-contact retries, no queue. Standalone Coil is unchanged. Distinct volt-conduction source delivers exact1 isolated secondary damage, normal kill bookkeeping but no primary-resource/Coil/status/replay recursion. Target identity is rechecked before each commit.

Compact source terminal → narrow lance/actual-travel rails → actual accepted fixed-endpoint network with0–2 pins → short fade. The new icon and enlarged isolated production-physics/conduction shop lesson show measured burst,15% lane cost, real wall/no-link outcomes and distinct Coil targets; Coil visibly equips only within the labelled comparison. No opaque homing bolts, endless crackle or saved-data mutation. The opt-in physics observer also recognizes actual SAT static contact, preserving Echo's intended stop-at-discontinuity rule.

Evidence:28 focused tests;384+24+56=464 genuine pre/post comparisons;32 native shop cases;16 native real-run/physics/render cases;7 other lessons/1260 heroes/343 other attack cells pixel-identical and49 deliberate Volt cells. Full final gates are recorded in chunk22 progress. Tide/global source/status/geometry/full Spark-Apex work remains pending.

**Final chunk22 qualification:**1400/1400 tests,32 native dash/shop cases plus4 final Volt cases,16 native run/physics/render cases,464 genuine pre/post mechanics comparisons and the protected visual matrices PASS. Existing shop6/all73/core2×7 PASS. Normal/Poki builds PASS1195.61kB raw/440.74–440.73kB gzip. Original3 simulation fixtures byte-identical; no saved-data migration or deployment. See chunk22 progress for exact evidence and controlled-fixture/device-performance limitations.

### Appearance / activation continuation — C1–C9 head systems

The post-shelf visual continuation rebuilds all8 fitted head attachments, their SVG icons, material-owned sockets and item-specific active hardware. Real state now drives Halo stabilization, Cyber Ear chain trace, Viper launch fins, Oni's last-health lining, Crown blade jaws, Samurai's horizontal-cut edges, Coil's accepted-relay bridge and Beacon's actual-tell lamp. Idle electrical motion/light-cone claims are removed; the bare-head construction and non-head default attack art are protected. The same production artwork appears in shop Look/Action/Result, live play and practice.

This is a substantial **presentation block**, with no new power or balance migration. In particular **C64 Tide, the combined bank solver and remaining global source/status/geometry work are still pending**. Final1433-test/build/native review results and honest qualification boundaries are recorded in the progress log and `docs/item-correlation/implementation.md`.


## Presentation continuation — airy assembly and item correlation

The next broad visual block simplifies the shared shop/live assembly rather than adding more hardware: all ten shell materials use one contour, broad material planes and a single characteristic gesture. Removed redundant chassis plates, the generic eye mask, extra attachment collars, ornamental family shoulder rigs and decorative routing. Seven real core mechanisms keep their protected internals and real activation receipts inside a flatter material-owned carrier. Eight existing head silhouettes and actual-state cues remain; family weapon identities remain in their weapons. Vent, spring, phase and armor state receipts stay state-owned.

The shop now has warm-paper stages, larger two-column portraits, quieter stock labels, restrained contact shadows and flatter synchronized comparisons. Isolated head/core/eye/tail views show the part next to its fitted character. Near-wordless story beats and free read-only previews remain. Screenshot feedback enlarged phone objects and comparison scenes, restored luminous FX contrast with flat dark display fields, and corrected broad planes erasing shaped-shell contours.

**Final gate:** 1437/1437 full tests PASS (271146.326973ms), four new airy-art tests, final focused51 PASS; single-file build1249.2KiB PASS; 207 native screenshots plus80 explicitly labeled offline art references; genuine saved-source native before/after; two intermediate screenshot rounds plus final contrast/contour refinement; seven shop layout/motion cases,22 shelves and3 separate Buy/Equip flows PASS;16 controlled native live-renderer conditions PASS, including actual Coil relay, read-only draws and truthful reduced state.140 material/core/scale cells deliberately changed;392 slash/dash cells exactly preserved. Gallery1280/390 and diff check PASS. Review, source hashes, compressed genuine baselines, implementation and limits: `docs/airy-review/`.

No damage, balance, source ownership, collision, price, save or attack-art migration. **C64 Tide bank/pressure and other pending mechanical work remain pending.** This is presentation continuation, not completion of those migrations. Scripted screenshot/renderer checks are not recruited-player comprehension or physical-device performance evidence. No commit/push or data migration.


## Presentation continuation — signature particles, core motion and material character

User-requested juice follow-up: all7 catalogue slash styles now have style-owned finite debris and layered edge engraving, including a signature on the actual active sword; all8 dash choices have distinct bounded launch debris alongside the smaller core-owned binding marks. All7 core mechanisms have name-related internal motion while keeping real charge/Drive/pull/recovery/hull/echo authority unchanged. All10 bodies receive material-specific edge detail/planes and selected material animation; the default cloth band gains a pinned-knot, delayed-tip, damped analytical response. No generic eye-mask/chassis cage or unbounded particle system is reintroduced.

Scope is7 slashes +8 dashes +7 cores +10 bodies +default cloth, not a redesign of every sensor/world/wave upgrade. Cosmetics do not change damage, attack-source ownership, collision, targets, charge, timing, price, saves or presets. Actual head/eye/tail cues remain truthful; reduced motion freezes ambient core/cloth motion and disables new debris. **C64 Tide’s mechanical bank/pressure migration remains pending.**

**Final checks:**1442/1442 full tests PASS (266020.465785ms),5 new tests and36 focused PASS;64 native upgrade previews (32 selections×desktop/portrait),16 controlled native live renderer conditions including an admitted Coil relay, and prior7-layout/motion +22-shelf +3 Buy/Equip-flow regression PASS.138 retained JPGs:64 native UI,38 controlled live,32 clearly labeled production-art study captures,4 layout regression frames; a20.8-second production-art WebM and interactive per-item motion review. Build/single-file1255.5KiB and diff check PASS. Review/implementation/validation/genuine compressed before-source: `docs/upgrade-juice/`. Scripted checks, not recruited-player comprehension, normal-play footage or device-FPS certification. No commit/push or data migration.


## Presentation continuation — seventeen-build event harmony

All17 completed recipes now have a frozen build-specific motif and coordinated summon/dash/attack/power/kill choreography layered over the preceding per-item FX. Shared recipe priority matches combat; incomplete/mixed kits get no named-build overlay. Build colors lead and a small core-colored inlay connects the composition. Explicit per-recipe paths distinguish brush paper, segmented wyrm fins, inward crown/star gravity, phase brackets, reaper hooks, sun rays, glacier facets, briar forks, rail channels, pixel crowns, storm forks, falling slag, rewinding traces, paladin plates, glass needles and orbit crescents.

Production triggers use committed dash age/bearing, actual active blade, already-fired secondary powers and existing confirmed-cut snapshots. A renderer-only36-tick arrival clock waits through ready/opening/tutorial, advances only in play and resets per run/changed completed build. It does not modify simulation or expire before play. No unbounded emitters, fake hits, charge, shields or damage. Motion off disables the new transient layers while established truthful cues remain.

**Final gate:**1448/1448 full tests PASS (372368.769686ms),6 new build tests,26 focused PASS; all17×5 event stages geometrically distinct in monochrome;34 controlled native run cases (17×desktop/portrait), accepted dashes, actual admitted kills, matching event snapshots and read-only draws PASS.110 native JPGs +85 labeled production-art study captures and24-second six-build/five-event WebM. Initial canvas-resize blank captures corrected in the harness and paint-checked before final capture; screenshot feedback strengthened scale and all17 material trajectories. Existing shop7 layout/motion cases,22 shelves,3 separate Buy/Equip flows PASS. Build/single-file1261.8KiB and diff check PASS. Review, immutable baseline, implementation and validation: `docs/build-harmony/`.

No gameplay/run module, source ownership, damage, collider, resource, recipe, price, save or preset migration for this continuation. **C64 Tide and deferred mechanics remain pending.** Controlled native cases and art-study footage are not normal-play video, recruited-player comprehension or device-FPS qualification. No commit/push.

### Actual-store presentation correction

Follow-up to the user's rejection of static/disjoint Armory shelves: the production store now uses one consistent item-stage renderer for all 73 items, with three scored beats, unique item particle paths and matching FX, animation for every visible card, and a larger selected scene. Optional comparison and practice remain separate; Buy and Equip remain distinct. Final validation: 1453 tests, 219 actual UI item/beat captures, 7-layout/22-shelf/3-transaction regression, reduced/manual hold and production build PASS. See `docs/store-performances/implementation.md` and `validation.json`. Presentation-only, not C64 Tide completion or a change to the mechanical authority above.
