# Enemy opponents: attacks over accidental contact

Research and design plan · 22 November 2026 · **Combat prototypes implemented; human validation and tuning remain**

## Goal

Make opponents feel deliberate and dangerous because they *attack*, not because the cube happened to brush a shape after its slash expired. Preserve the game's fast, launch-through-enemies identity. A good loss has a specific cause the player can recognize and a plausible action they could have taken; a good win still requires reading, aiming and managing Edge. Do not simply make enemies harmless or increase health pools.

## Next visual and training milestones

| Mechanic | Shipped cue and interactive checkpoint | Next work, not yet implemented |
|---|---|---|
| Slash | Stationary live targets; pause after launch, cut, and clear. | Test whether players can identify the blade window without reading the bar. |
| Fang | Locked rail-clamped lane, active body chevron; pause at tell and charge. | Validate conservative corridor width against the real polygon sensor on devices. |
| Pulse | Dashed nested wind-up and solid expanding hit rim; pause at tell and ring. | Compare ring contrast on every backdrop and test safe-interior understanding. |
| Prism | Dashed locked sightline and a single diamond needle; pause at tell and shot. | Add a legible, bounded off-screen source cue; never imply the sightline itself damages. |
| Linked Prisms | Charging line and solid live beam between actual endpoints; checkpoints at both phases. | Test overlapping needle/beam cues and whether cutting either source is discoverable. |
| Fork | Dashed cross warning, solid cross swipe; split seam, then two real small Fangs. | Test spawn overlap and whether the seam communicates splitting. |
| Bastion | Two plate marks and a dashed forward wedge before its slam. | Test wedge readability and armor recovery under real play. |
| Rift | Dashed landing circle followed by its real blink strike. | Test destination visibility at the edge of the camera and during fast movement. |
| Well | Dashed 234-unit pull field and separate smaller compression warning; live checkpoints. | Verify pull strength is perceptible and distinct from the damaging inner zone. |
| Crown | Ten actual sightline angles, distinct barbed needle silhouette, armor checkpoint. | Test projected spoke contrast and gaps at smallest viewports and on every backdrop. |

Attack-warning strokes target 2 CSS pixels on small screens while geometry remains in world space. Reduced-motion mode keeps cues static where possible without suppressing actual moving hazards. Training camera magnification is separate from gameplay and input is transformed through the same camera. These are implementation choices, not measured accessibility guarantees.

Priority: (1) recruit novice touch and desktop testers to explain cues and damage without coaching; (2) instrument wall-clock visibility and off-screen attack timing locally; (3) tune each new move with recorded play; (4) test coordination and overlapping threats before further balance changes. Record sample sizes and failures; do not treat screenshots or platform benchmarks as proof of player comprehension.

## Evidence and its limits

- Research on self-determination theory links players' experiences of autonomy and competence with motivation; experiments found that difficult-to-master interfaces can undermine perceived competence and enjoyment. These are general psychological findings, not proof that a particular SPLATR contact rule will improve retention. [1](https://selfdeterminationtheory.org/wp-content/uploads/2015/01/2014_PrzyDeciRigbyRyan_JPSP.pdf) [2](https://selfdeterminationtheory.org/wp-content/uploads/2014/04/2010_PrzybylskiRigbyRyan_ROGP.pdf)
- Clear telegraphs make consequences and counterplay legible; cue visibility, timing and collision consistency matter, not merely the existence of an animation. This is design guidance to test with actual players, not a guarantee. [3](https://medium.com/@bensstein/playing-fair-where-hard-games-and-fun-games-overlap-1ed4164714c3)
- Poki's current developer documentation says its player-fit test uses 500 plays, with 3+ minutes average playtime and at least 25% of plays exceeding 3 minutes as a threshold for the next stage. It recommends 5+ minutes average playtime and 65%+ conversion to play as broader goals; it describes its typical game as ~70% conversion and 6+ minutes playtime. These are **platform-wide, not SPLATR or action-game results**. [4](https://developers.poki.com/guide/how-testing-works)
- Poki defines conversion to play as visitors reaching the first `gameplayStart()` event; its web-fit test compares CTR, time on page and conversion against relevant categories. Don't confuse this with tutorial completion or a return visit. [5](https://developers.poki.com/guide/web-fit-test)
- Poki recommends short, repeatable loops around three minutes and rapid access to play; its guidance also asks for skippable, intuitive instruction. Those are platform recommendations, not evidence that every player wants a three-minute session. [6](https://developers.poki.com/guide/engagement) [7](https://developers.poki.com/guide/requirements-quality)
- The GameAnalytics 2026 report describes **2025 mobile games**, not browser games: approximately 22% median D1 and under 4% median D7. Retention definitions, user mix and platforms differ; these are contextual numbers, not web targets or SPLATR measurements. [8](https://www.gameanalytics.com/reports/2026-mobile-pc-gaming-benchmarks)

No real-player SPLATR damage distribution, retention or engagement data was available in this repository or this research. The user's contact-damage concern is an important report and design priority, not a measured frequency. Validate the change against observed play.

## Implementation status (combat and training pass)

The scoped contact rule and nine attack-specific impact marks are implemented. Interactive lessons now checkpoint actual events one at a time, pause on each demonstration, and resume only on **Next step**. Skipping, reset and lesson selection remain available. The field manual opens these live drills directly instead of replaying illustrations. The slash lesson uses harmless stationary targets; the enemy lessons still run actual AI, hazards, movement and combat. This is practice, not a new attack simulator. A fast kill can bypass an observation; the lesson says so and offers Reset rather than claiming that it was seen. See `docs/enemy-contact-and-impact.md` for the contact details.

Fork swipe, Bastion slam, Rift landing strike and Well compression are implemented as fixed, explicitly warned zones, with 78/84/90/90-tick tells and 14-tick active lifetimes. A real cut interrupts and cancels them, including a nonlethal armor cut; early dash parry can block them. Their source and zone geometry are snapshotted at wind-up, swept cube collision is evaluated against the same geometry, and each has a unique attack ID. Camera movement never changes enemy simulation. Instead, off-screen tells, landing zones, active hazards and link endpoints receive labeled edge indicators in the renderer (up to five at a time). This is not a proof that HUD occlusion, visibility or every overlap is fair; an explicit guarantee that an attack cannot become dangerous before its warning was perceived remains unimplemented. The user still needs to see and understand these in uncoached playtests; screenshot and automated checks cannot establish readability or fun.

### Implemented zone specification

All dimensions are world units, and hit detection expands the warned shape by the player's effective collision radius (`0.44 × 46`). The same immutable zone object is rendered as a dashed tell and a solid active area. The player sweep is tested against edges/inside, so crossing between simulation ticks is not missed. Each zone can hit at most once, remains active for 14 simulation ticks, and is canceled on a successful source cut (including a nonlethal Bastion armor cut); early dash parry can block it. It freezes with its source during player hitstop. New zone hits carry their own attack ID, source ID, direction and cause, including shielded/fatal hits; the optional local damage trace records these identities.

| Enemy | Tell, active geometry, recovery |
|---|---|
| Fork | 78-tick tell; two 252×50 perpendicular bars fixed at its wind-up angle; 38-tick recovery. It still splits into two small Fangs on defeat. |
| Bastion | 84-tick tell; locked forward wedge begins at `0.65 × radius`, extends to `radius + 136`, and widens from ±28 to ±69; 38-tick recovery. Two armor plates remain. |
| Rift | 90-tick tell; radius-88 circle at the locked blink destination; teleports then strikes, with 38-tick recovery. |
| Well | 90-tick tell; radius-112 compression circle, distinct from the radius-234 pull field; 38-tick recovery. |

These values and the shared cadence are initial tuning, not human reaction-time standards. The shared director counts nearby winding/recovering attacks, linked beams and unspent lingering hazards by attack ID (a Crown volley counts once), with one slot at difficulty 1–2 and two later. This reduces simultaneous threats but does not prove that all possible crossing combinations leave an escape route. Off-screen notices are capped, and HUD overlap/readability is not guaranteed. The full planned local lifecycle instrumentation, consented user research and controlled A/B rollout have not been performed.

## What the current code actually does

- `src/run.js` resolves contacts using a blade snapshot: active blade cuts take priority, and otherwise only Fang in its active rush can hurt on body contact. `src/slasher.js` records the rush state at the collision substep. Idle, telling and recovering bodies are safe, as are all non-Fang bodies. Same-enemy cut grace and Iron's one-use Fang-rush block remain.
- Fang charges, Pulse emits a ring, Prism fires a needle, and Crown fires ten needles. Linked Prisms warn and beam. Fork has a cross swipe and splits, Bastion has a wedge slam and armor, Rift has a marked blink strike, and Well pulls and has a close compression. Enemy drift and ordinary overlap are harmless. See `src/slasher.js`.
- There is already a shared turn/beat limiter, so designing another director must build on it, not stack a conflicting second scheduler. Blade/hazard parry rules, armor, the Fork's offspring and the Edge/Focus economy also already exist.
- Existing optional `combatTrace` captures some contacts and damage (`src/combat-trace.js`, `src/run.js`); it is not production analytics and does not yet establish player-level rates. The current first-time live teaching arena must track any new combat rules.

## Proposed core rule: bodies are not attacks

**Recommended prototype:** idle, wind-up and recovery body overlap causes no Hull damage. The player and enemy can pass through each other as their current sensors allow. Damage only comes from an explicit, telegraphed attack's active hitbox, including a Fang's *active rush* and other intentional melee attacks. A touch during a Fang tell is safe; the visibly active lunge can hurt. Show active versus safe/recovery states consistently. Keep ordinary slash sweeps, armor damage, same-enemy cut grace, Edge refunds, player hurt invulnerability and existing parries unless testing identifies a specific conflict.

A body that is already overlapping when its attack activates must not produce an unseen instant hit: define a visible close-range warning and either a minimum warning + exit route or require the attack hitbox to leave/re-enter before it can hit. Pick and test one behavior consistently; don't secretly invalidate the attack after it visually connects. Use per-attack IDs and one-hit limits; respawn, invulnerability, hitstop and overlapping hazards must not create double hits. Cuts that kill or interrupt the source cancel only the attack types explicitly designed to be interruptible. Reflect that in the visuals.

**Risk:** removing passive damage can permit standing inside an enemy or idling. Counter with deliberate close-range attacks and coordinated spacing, not invisible collision damage, unavoidable instant bursts, or a generic timer that kills stationary players. Keep player agency during all warnings. Compare against a control before deciding whether physical separation or a non-damaging push is desirable.

## Individual opponents: implemented prototypes and tuning intent

All numbers are **starting hypotheses**, not measured reaction-time standards. Sim ticks are 60 Hz at normal time; Focus, game speed, hitstop and dropped-frame policy alter real elapsed time. Measure actual visible wall-clock windows on the supported settings and phones. Start with wind-ups (Fang 66, Pulse/Prism 76, Fork 78, Bastion/Crown 84, Rift/Well 90 simulation ticks; beam tell 78), then tune based on tests rather than shortening them by default.

| Enemy | Deliberate attack and readable cue | Player response / recovery |
|---|---|---|
| Fang | Preserve its pointed lane tell and committed rush. Only its distinct rush strike can damage, not idle drift, tell or recovery. | Step/launch outside lane, cut the Fang, or dash across before impact; visible post-lunge recovery. |
| Pulse | Preserve a clear growing ring with a visible dangerous front, plus source wind-up. | Exit the front or early-parry it; inside a passed ring remains safe. |
| Prism | Preserve its aimed needle and a locked sightline, distinguish it from the decorative line. | Move off the line or face/parry the needle with an active blade under existing rules. |
| Linked Prisms | Preserve a visible charge and active beam between both sources; cancel the beam when either endpoint dies. | Cross before activation, early-parry, or cut a source. No unannounced off-screen live beam. |
| Fork | Preserve splitting into two small Fangs. Prototype a short, marked cross-shaped swipe if the player lingers close; no idle contact hurt. | Leave the marked area or interrupt, then address the two children. Children retain Fang rules; test spawn overlap and double hits. |
| Bastion | Preserve two plates. Prototype a deliberate, forward-facing short shield slam, with a visible wedge and recovery. | Get out of the wedge or interrupt where allowed; break plates over subsequent launches. Do not make the body itself a hidden hazard. |
| Rift | Preserve the marked blink, but give the landing a bounded, visibly timed strike zone; arrival itself must not become untelegraphed contact damage. | Leave the landing marker or interrupt before the commit; a brief recovery follows. |
| Well | Preserve the airborne pull. Prototype a visible short-range compression/pulse after a wind-up, instead of lethal passive overlap. | Launch out, cross/cut the core, or evade the marked pulse. Make pull and damage visually distinct. |
| Crown | Preserve three plates and radial needles. Telegraph the spokes at their actual angles and maintain an approachable gap. | Move through a gap, face/parry a needle, or interrupt if designed to be interruptible; plate count and recovery remain legible. |

These four moves are now playable prototypes, not validated balance. They use distinct geometries and existing turn scheduling. Playtest them individually and together before claiming fairness or final tuning.

## Timing, fairness and threat coordination

1. **Attack lifecycle:** approach/position → visible tell → commit (target lane or destination locks) → clearly active hitbox → recovery. Save an immutable attack ID and exact geometry at commit. No damage during generic approach/tell/recovery.
2. **Reaction budget:** start by keeping current timings and instrument first visible tell, commit, first possible impact and player input in both wall-clock and simulation time. For high-speed movement, lead must cover not only human reaction but also travel and turning/launch availability. If an attack becomes unavoidable before its cue is observable, delay/cancel/reposition it rather than faking a warning.
3. **Visibility:** render the actual attack region with shape/line pattern and motion, not color alone; pair with optional audio. On small screens, avoid HUD coverage; use an edge indicator for off-screen threats. An off-screen attack should not become dangerous before a player has a meaningful visible warning. Preserve reduced-motion readability.
4. **Scheduling:** extend the existing `takeTurn`/beam cadence. Prototype a budget of one major committed attack early, then at most two later, including lingering hazards and beams in the accounting. Limit simultaneous unavoidable intersections; reserve an escape route. Queue or skip deferred attacks without starvation. Sustained pressure should come from movement and sequential decisions, not synchronized unavoidable attacks.
5. **Close-quarters:** define what happens when a tell begins on top of a player, when the player cuts a source, when a player spawns, and during hitstop/Focus. Restore control after damage with existing invulnerability; do not allow overlapping active hitboxes to drain multiple Hull in one frame.
6. **Prevent camping:** test an idle player, a player continuously overlapping, and one circling at the boundary. Enemy attacks should eventually threaten them with a visible, avoidable sequence. No infinite safe spot; no automatic punishment merely for standing still.
7. **Maintain slash identity:** make travel-versus-blade status legible; allow an active blade to cut eligible bodies before attack damage resolves in the same simulation step, as appropriate to existing rules. Avoid accidentally turning a body-contact removal into free kills or full invulnerability.

## Measurement design

### Baseline and instrumentation first

Use seeded automated runs and opt-in recorded playtests, before changing balance. Extend the existing trace locally with `attack_id`, enemy ID/kind, attack type, lifecycle timestamps, cue/active world geometry, source visibility, player HP, slash/parry state, Edge, input device, wave, speed setting and actual damage attribution. Record `enemy_body_idle`, `enemy_body_tell`, `enemy_body_rush`, `needle`, `ring`, `beam`, `rift_strike`, and other damage distinctly; one damage event and one fatal cause per Hull loss/death. Attribution must be captured at resolution, not guessed later from proximity. Avoid persistent identifiers, precise pointer paths or recordings unless explicitly consented and retained appropriately.

Poki blocks external requests by default [7](https://developers.poki.com/guide/requirements-quality). Keep traces local/debug-only unless an approved, privacy-compliant collection route exists; platform dashboards/SDK events and optional consented studies are separate from an imagined analytics backend. Do not ship debug traces or silently introduce external tracking.

Suggested denominators, reported per player and segmented by first-session vs returning, mouse/keyboard vs touch, wave and build:

- **Passive-contact damage share** = Hull losses from idle/tell/recovery body overlap ÷ all Hull losses. Also report fatal share. Do not count an active Fang rush as passive contact.
- **Attack hit rate** = attacks that cause ≥1 Hull loss ÷ attacks that become active, by type; also count tells canceled by player action and lost offscreen. Group by attack ID, not frames.
- **Fairness/readability:** in a blinded post-death interview ask “what hit you?” and “what could you do differently?”; score correct identification and plausible counter independently. Log whether the cue was observable, not merely created.
- **First-session funnel:** game loaded → first valid launch → first kill → first damage → first death → retry → first wave clear; report time, drop-off and tutorial skipped/completed. Include all entrants in relevant denominators, not just survivors.
- **Difficulty and engagement guardrails:** Hull losses per active gameplay minute, wave-clear rate, first-death time, retries per player, quit within 30 seconds after death, session length distribution, D1/D7 returns where actually measurable. Short sessions and quits are signals, **not diagnoses of frustration**; pauses/background tabs do not count as active time.
- Split results by device, skill, wave and first/returning player. Report denominators, missing data and confidence intervals. D1/D7 require a stable privacy-compliant identity and a defined cohort/return window; without it report unavailable rather than treating visits as unique people.

### Experiment and success criteria

- Randomize eligible first-time players into current combat A and attack-only-contact B, keeping tutorial, content, acquisition source, hardware, monetization and release schedule as consistent as possible. Assignment is per player, sticky when feasible; define consent, eligibility, primary outcome, sample size and fixed analysis window before starting. Do not adapt enemy difficulty secretly during the experiment.
- Primary UX hypothesis: B improves the percentage of sampled deaths players can correctly explain with an actionable response. Primary gameplay guardrail: no material decline in intentional-attack threat, wave difficulty or replay desire. Compare causal attribution alongside the numbers; passive-contact share alone will mechanically fall under B and does not prove an improved game.
- Candidate internal targets **after baseline**: passive contact approaches zero; ≥80% of interviewed players correctly identify the fatal attack and plausible response; no meaningful decrease in first-wave challenge or retries. These are provisional design goals, not industry benchmarks. Set practical margins and minimum samples with the team before launch.
- As a rough planning calculation, detecting an absolute 10-point difference between two proportions near 50%, with 80% power and two-sided 5% significance, takes about **392 independent players per variant** under standard approximations; a 5-point difference takes about **1,568 per variant**. Actual rates, clustering, attrition and multiple comparisons alter this. Small teams should use directional results and confidence intervals, not claim proof.
- Usability before statistics: recruit novice and experienced players on real touch and desktop hardware, including reduced-motion/sound-off play. Observe fresh first encounters without coaching, capture consented recordings, and ask neutral questions. Ten recordings are useful for finding problems, not estimating population-level retention. Poki describes ten recordings per playtest and a separate 500-play fit test. [4](https://developers.poki.com/guide/how-testing-works)

## Phased implementation and acceptance gates

1. **Baseline + fixtures:** instrument local traces, replay seeded encounters and collect consented first-session observations; record actual damage shares and visible cue timing. No live balance change.
2. **Vertical slice:** switch passive bodies to non-damaging and make Fang's active rush the only body-sourced damage; keep existing ring/needle/beam rules. Add debug attack geometry and explicit visible state. Test overlapping start, swept high-speed collisions, attack interrupt, immunity, Focus and background pause.
3. **Arm the passive roster:** prototype one distinct move each for Bastion, Fork and Well and the Rift landing strike. Update the live interactive teaching arena with real attacks and counters, not illustrations. Preserve player controls, unlocks, shop discovery and weapon semantics.
4. **Coordinate and tune:** reuse the existing turn system, cap concurrent major threats, verify counterplay on mobile, high speed, overlapping warnings and off-screen spawns. Validate that idle/camping strategies are pressured and risky aggressive play is still rewarded.
5. **Playtest and controlled rollout:** blind A/B when a valid deployment/collection route exists; otherwise state that the result is qualitative. Gate on readability and fun as well as technical correctness and metrics. Roll back or adjust on unfair-hit regressions.

Automated acceptance: tests for all eight enemy types and linked beams; passive overlap never harms; explicit active attacks hit exactly once and are avoidable/interruptible as specified; fast sweeps do not tunnel; parry and blade precedence are correct; armor, children, wave clear, upgrades, post-cut grace and rest are intact; no impossible warning overlap; simulation remains deterministic; training runs are isolated. Browser QA covers small touch screens and desktop, reduced motion, warning contrast, actual hitbox overlays, focus, background pause/resume and stable frame rate. Human tests must confirm cues and deaths are understood; automation cannot prove fairness or enjoyment.

## Art direction extension: opponents should look like what they do

### Diagnosis and visual principles

SPLATR has a coherent geometric language, but the current roster often communicates **species mainly as a polygon and color**. A circle, diamond, cross or star does not inherently tell a new player “ring attack,” “aimed needle,” “splits into two,” or “teleports.” Color corrections alone do not resolve that comprehension gap. In the current renderer, `TYPES` and actual sensor outlines are in `src/art/splatr-art-engine.js` and `src/slasher.js`; `warnings()` already draws a Fang lane, Prism/Crown sight lines, a Rift destination and Well arcs, but a cue existing is not proof that it is legible on a phone. Some contemplated new attack designs above do not exist yet.

Use a shared **cut-paper machine** language: dark ink exterior, a single high-contrast functional core, visible construction seams, and one recognisable mechanism per enemy. Do not turn the cube-shaped player into a creature or replace enemies with unrelated illustrations. The useful principle is *form informs function*: a recognizable silhouette can suggest the attack's direction and mechanics before the attack begins. [9](https://www.jasondeheras.com/gamedesign) [10](https://book.leveldesignbook.com/process/combat/enemy)

- **Three-layer hierarchy:** (1) outer silhouette identifies the opponent; (2) a large built-in mechanism indicates what it does; (3) the attack telegraph indicates exact danger. Reserve small scratches and texture for expendable decoration. All essential identification should survive grayscale, muted audio and reduced motion. [11](https://learn.microsoft.com/en-us/xbox/accessibility/accessibility-feature-tags)
- **One clear visual verb per type**, paired with its gameplay: thrust, expand, aim, split, guard, relocate, pull or radiate. A warning is not a cosmetic animation: its displayed direction, extent, timing and cancellation must use the same authoritative attack state and geometry as the actual hit.
- **States read differently without color:** idle silhouette; exaggerated wind-up pose; solid, bounded active strike; visibly relaxed recovery. Color and sound reinforce these shapes but do not carry the entire message. Do not animate a dangerous-looking strike when no strike is possible.
- **Damage should be attributable:** at the moment a real hit resolves, show a brief directional cue and health loss; retain the exact last-hit name for the end screen. Avoid claiming which specific attack hit unless the simulation captures that cause. The current contacts and hazard paths have different attribution detail, so attack IDs and real geometry must be added before precise replays are promised.

### Roster art/behavior map — original proposals (see implementation status above)

| Type | Instant recognition and visual mechanism | Wind-up → active → recovery | Player interpretation / art constraint |
|---|---|---|---|
| **Fang** | A forward-pointed triangular wedge with a rear-loaded spring, visually distinct front and back. | Rear compresses along the *locked* lane → wedge thrusts along that lane → spring uncoils and dims. | “It will rush this way.” The active collision must match the wedge/path; keep the pre-existing polygon sensor unless a tested hitbox change is explicitly made. |
| **Pulse** | Circular drum with a thick concentric diaphragm, not a coin or pickup. | Diaphragm compresses → an outlined annular front grows from the source → diaphragm relaxes. | “The moving rim hurts; the area behind it is safe.” Draw ring thickness around the same radius collision uses, not a misleading solid disc. |
| **Prism** | Diamond housing with a single narrow barrel and a visible sight aperture. | Aperture narrows on a locked line → one visibly moving needle → shutter opens. | “Shot travels on this line.” Linked units add a clear pair of sockets/cable between the actual endpoints, not decorative links on all diamonds. |
| **Fork** | Cross with a visibly central seam dividing two nested forward-pointing Fangs. | Proposed swipe: arm folds toward the marked cross → bounded swipe → arm unlocks; death tears at seam into two children. | “This splits in two.” Children emerge where the real entities spawn; avoid implying a swipe until that move is actually implemented. |
| **Bastion** | Low, broad shield-shaped body with **two physically readable nested plate layers**, not a generic hexagon. | Proposed slam: plate draws back and the actual wedge is outlined → short slam → exposed opening; cracks track real `hp`. | “Armor needs repeated cuts.” Plate marks reflect actual remaining armor and armor-damage upgrades; no fake third plate. |
| **Rift** | Angular broken star with a detached offset core and a notch, designed not to resemble a shiny collectible. | Source and real destination share a matching keyed outline → proposed landing strike only as shown → source settles. | “It moves to the marked spot.” Do not imply area damage until the landing strike exists. Keep the current blink distinct from proposed changes. |
| **Well** | Pentagon housing a dark inward spiral with broken radial intake teeth; no glossy gem highlight. | Existing inward field uses inward-pointing flow → proposed pulse marks its own separate boundary → field resumes. | “This pulls me,” not “this is loot” or “this is a Prism.” Don't depict an attack pulse in production until implemented. |
| **Crown** | Largest octagonal machine with three layered armor bars and a ring of fixed radial ports. | Ports and actual spokes charge → ten matching needles fire → ports close; bars follow real armor. | “Armored radial volley.” A Crown's health repair is shown only when health really increases, and never as a health pickup. |

### Mathematical visual constraints to prototype

These are starting design tolerances for usability tests, not claims that current art meets them:

1. Derive visual dimensions from each enemy's actual radius `r`, camera scale `s` and viewport. Critical outer silhouettes should remain recognizable at the **smallest observed on-screen size**, not only in a large character sheet. Measure the resulting CSS-pixel width in real gameplay at 390×680, 1280×720 and landscape; preserve a clear hitbox-to-art relationship if minimum screen-space stroke widths are introduced.
2. Put the defining mechanism inside roughly the central 60–75% of the silhouette, with at most one dominant feature; test variants against real zoom and background instead of assuming more detail improves recognition. Keep at least a thin high-contrast boundary between mechanism and body; verify screenshot contrast in grayscale, on each world backdrop.
3. Aim for a minimum **2 CSS-pixel** critical warning stroke after projection `worldStroke × s` on the smallest target viewport, with a non-color shape cue. Limit the correction to warnings, not the physical hitbox; instrument actual projected widths and ensure the visual boundary still describes the collision rule.
4. Project the existing Fang's planned rush length from its actual speed and active duration (`lungeSpeed × 24` world units before rail clipping). Its current telegraph follows the rail-clamped path, including sliding after an axis reaches a wall. Include the player's collision radius when making the displayed danger region intelligible; confirm with a debug overlay and swept collision tests.
5. For Pulse, calculate the warning/front from the actual `radius`/`previousRadius` and collision tolerance, including the player radius. For Prism and Crown, align sightlines to locked `aim` and real projectile angles; show projectile motion as the hazard, not the entire sightline as continuously damaging. For linked beams use actual endpoint positions and tell/live lifecycle. For Rift, the destination marker and active damage use the locked `tx`/`ty` zone.
6. Show armor layers and damage marks directly from `hp`/`hpMax`, including upgraded armor damage that skips a plate. No independent animation or art timer may fake an active attack or a restored health point.

### Art production and validation

- **Prototype in live simulation**, not a still illustration: first build Fang and Pulse as the two extremes (directional versus radial). Reuse the real player controls and combat code in the live training arena. Include idle/tell/active/recovery and actual HUD reactions; use a developer-only collision overlay for comparison.
- Produce one spec per enemy: visual vocabulary, silhouette and palette, state machine-to-pose mapping, attack geometry source, reduced-motion equivalent, hit and death cues, and intentional exclusions. Ensure there is no confusing “loot” silhouette, fake projectile, ambiguous armor mark or untracked warning.
- Independently test each at three zooms on every world, overlapping another enemy, against an active slash, sound off, reduced motion and grayscale. Verify hitboxes with deterministic frames and separate browser/device observation. A minimum stroke guideline or screenshot does not prove accessibility.
- In uncoached 1:1 sessions, ask a new player to identify an enemy's likely action, point out the dangerous area during its tell, and explain the last hit after a death. Record misunderstandings and sample size. Iterate until the body, warning and actual behavior agree; do not confuse recognition of a still image with recognition during play.
- Bring the same working enemies and explanations into the interactive introduction; explain only what the current rules actually do. Keep introductions skippable and do not reveal undiscovered shop recipes. Do not deploy the proposed art ahead of the associated mechanic if it would teach players a false rule.
