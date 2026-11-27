# Plan: tactile interactions + 73 recognizable shop items

> Superseded by the single [unified upgrade harmony and implementation blueprint](unified-upgrade-harmony-implementation-plan.md).
> This first proposal is historical; do not implement it independently.

Status: **design proposal only; no gameplay/UI implementation in this pass.**

## Direction

Make the game feel like a sharp, mechanical anime toy—not a screen full of
particles. Every action gets immediate acknowledgement, important outcomes get a
stronger payoff, and every item follows the same chain:

**recognizable shape → readable icon → sensible ability → matching activation → honest receipt.**

Keep the new nested shop, existing ownership, credits, purchases, challenge
unlocks, and saved loadouts. Keep the dark ink/acid-lime/cyan visual language.
Do not add quests, automatic combat, pop-up navigation ceremonies, or a Phaser
migration. No default camera shake or full-screen flashes for ordinary UI clicks.

## 1. Feedback language: everything responds, not everything explodes

| Action | Visual response | Sound / optional touch response |
| --- | --- | --- |
| Hover / keyboard focus | Outline locks in; icon lifts 1px; label stays still. No continuous pulsing. | No hover sound. |
| Pointer / keyboard press | Immediate 1–2px depression, icon compresses about 4%; interruptible 60–90ms response. | Short muted mechanical tick when enabled. |
| Successful generic click | 120–180ms return/overshoot on icon or button inner surface; one clipped edge streak. | Short confirm click, distinct from purchase. |
| Category / slot change | Selected marker snaps into place; content swaps with a short local reveal. No sliding entire modal. | Light navigation tick, rate-limited during rapid browsing. |
| Select shop item | Selected card edge catches light; unique icon stamps in; large preview replays that item's trigger. | One selection tick. Never purchase automatically. |
| Buy succeeds | One stamp on the action button; wallet changes once; 4–8 small icon-shaped flecks travel locally; card becomes OWNED. | Two-note purchase cue; optional very short haptic. No confetti curtain. |
| Equip succeeds | Equipped badge clicks into place; preview attachment seats/snaps onto the Cube. | Firm equip latch. No repeat fanfare if already equipped. |
| Cannot afford / locked | Local short bracket nudge and clear missing-credits/unlock text. No whole-screen shake. | Soft low rejection click; no repeated buzzing while held. |
| Filter has no results | Clear empty state, selected filter retained, Reset filter action. | Silent. |
| Pause / resume | Small panel reveal, visible focus placement; resume has no input-blocking animation. | Existing audio pauses/resumes correctly. |
| Start / retry | Decisive icon snap and short local wipe; controls become live immediately. | Short launch cue; never delay gameplay for an animation. |
| Aim / release | Reticle tension, charge-notch engagement, release snap aligned to actual input. | Charge/release cues reflect real state, not decorative fake charge. |
| Cut / armor break / perfect bank | Distinct local contact stamps and silhouette response; magnitude follows the actual event. | Small, medium, large cue tiers; strongest simultaneous cue wins. |
| Damage / guard consumption | Directional local hit response, health/guard receipt visible; player never disappears into effects. | Distinct hurt/block cues, with cooldown. |
| Chain / Overdrive / rewards | Chain link seats, reactor locks in, credits settle once. Existing rare dimension-impact remains special. | Escalating but capped accents; no sound for every rendered frame. |
| Settings / modal close | Switch detent, exit icon settles, focus returns to its invoking control. | Quiet tick. |

### Rules for all feedback

- Click feedback acknowledges the real DOM/input action; it must not create a
  second click, delay a purchase, or swallow a fast follow-up input.
- Give an action instant acknowledgement, then celebrate only after success.
- Distinguish hover, pressed, selected, previewed, owned, equipped, and locked.
- Keyboard, touch, and mouse get equivalent meaningful feedback. Touch must not
  depend on hover. Disabled buttons still explain why they are unavailable.
- Repeated selections do not stack animations, DOM nodes, timers or sounds.
- Reduced motion: static border/icon-state changes and readable receipts;
  no bounce, directional travel, camera motion, or flashing. Mute stays respected.
- Haptics are optional, off unless enabled, feature-detected, and never required.

## 2. Icon system: one authored icon for every catalogue ID

**73 items → 73 distinct primary icons**, not eleven slot icons reused with new
colors. Slot icons remain navigation aids; ability badges remain secondary.

### Construction

- Author a compact, bundled vector icon atlas (SVG symbols for DOM usage), keyed
  by item ID. No external icon fonts, runtime image generation, or remote assets.
- Design on a 32×32 grid with a dark keyline, consistent stroke weight, and one
  restrained accent. Check at 20, 28 and 48 CSS pixels and in monochrome.
- Icons depict the actual attachment/material/energy shape. Radar/trajectory
  tiers change geometry and analysis marks, not merely color or Roman numerals.
- Reuse the same design in card corner, selected-item heading, equipped state,
  purchase feedback, and loadout summaries. The existing full-Cube thumbnail
  remains a try-on view, **not** the only way to identify an item.
- Canvas previews use art-engine-owned drawing or pre-rasterized versions of the
  same icon paths. Browser DOM work must not leak into the portable art engine.
- Decorative icons get aria-hidden. Buttons retain the item name plus real
  action/state as their accessible name. Never replace useful words with icons.

## 3. Item-by-item identity sheet

These are the proposed identities and feedback treatments for all current
items. Unless explicitly marked **candidate rule change** below, keep existing
mechanics/values and make their cause and visual explanation stronger. Numbers
must come from the rule model, not duplicated UI strings.

### Cube → Head (9)

| Item ID / name | Unique icon | Appearance-led role and activation |
| --- | --- | --- |
| `none` Bare Head | Unadorned cube brow | Honest free baseline; no attachment or fake bonus. Clean pose/outline on equip. |
| `halo` Gold Halo | Tilted elliptical ring above a fall chevron | Ring stabilizes a falling aim: existing 15% lighter aim-fall gravity. Halo levels when active. |
| `neko` Cyber Ears | Paired triangular ears with a short link waveform | Alert ears keep the chain alive: +12 chain ticks. Ears perk and a link extends on a real kill. |
| `viper` Viper Horns | Swept twin horns forming a narrow arrow | Streamlined rush: +20% dash speed, −15% cut width. Horn edges snap forward; preview shows the narrower blade too. |
| `oni` Broken Oni | One broken horn with a cracked mask corner | Last-health defiance: +50% kill score at 1 health. Crack catches red light only when eligible. |
| `crown` Cube Crown | Three-point crown crushing two small plate bars | Heavy armor authority: two-plate hits with −8% launch speed. Crown stamps on plate break; show the speed cost. |
| `samurai` Samurai Crest | Swept crest over a level cutting line | Disciplined horizontal cut: +20% width near horizontal. Crest aligns with the valid angle band. |
| `coil` Lightning Coil | Two posts bridged by a zigzag | Conductive relay: direct cuts zap one eligible neighbor within the existing range. One real arc; no recursive chains. |
| `beacon` Danger Beacon | Capped lamp with a directional warning wedge | Early Fang-windup warning. Lamp switches from idle to amber alert when the actual tell starts. |

### Cube → Eyes (7)

| Item ID / name | Unique icon | Appearance-led role and activation |
| --- | --- | --- |
| `ninja` Ninja Slits | Paired angled eye cuts | Free clear-sight baseline; expressive blink/gaze, no invented combat buff. |
| `visor` Cyber Visor | Single scan visor with one calibrated notch | Efficient targeting: 10% less aim FOCUS cost. Scan line settles while aiming. |
| `blaze` SSJ Blaze | Two flame-shaped eyes with a rising flare | Overdrive aggression: +8% qualifying kill score during Overdrive. Flame tips ignite only in the real state. |
| `glitch` Glitch X-Eyes | Offset X-eyes with two stepped pixels | Reconstructing focus: +12% passive recovery while not aiming. Broken pixels reseat as FOCUS returns. |
| `smug` Smug Half-Lid | Two asymmetrical half-lids over a link | Unhurried chain control: +12 chain ticks. A short knowing eye-open response follows a qualifying kill. |
| `hypno` Hypno Spiral | Twin spirals with an inward focus notch | Concentration: 15% less aim cost, not enemy mind control. Spirals tighten during aim. |
| `sniper` Sniper Dot | Single central sight with four fine ticks | Full-power precision: +10% qualifying kill score. Sight ticks engage at the actual power threshold. |

### Cube → Shell (10)

| Item ID / name | Unique icon | Appearance-led role and activation |
| --- | --- | --- |
| `paper` Paper Ninja | Folded paper cube corner | Free balanced shell. Fold crease seats on equip; no claim of extra armor. |
| `obsidian` Obsidian Stealth | Black faceted shard above an air-gap line | Lightweight aerial specialization; current airborne +8% score remains until redesign testing. Edge glint while airborne, never fake invisibility. |
| `hologram` Hologram Wire | Open wireframe cube with a scan plane | Computed aim: 12% less FOCUS cost. Wireframe sharpens during aim, but collisions stay real. |
| `prism` Prism Shell | Facet splitting into two rising needles | Refraction on side-wall contact: existing two needles/cooldown. Facet lights at the launch points. |
| `iron` Bastion Iron | Riveted plate with a central shield seam | One rush block per run. Plate compresses on the real block, then shows a spent notch. |
| `lava` Lava Cracked | Cracked square with an ember center | Retained combo heat: +18 chain ticks. Cracks heat on kills and cool as the real chain expires. Not burn damage. |
| `gold` Gold Foil | Folded gold corner with a small scoring star | Precious finish rewards kills: +10% qualifying score. One restrained glint at payout; not extra shop credits. |
| `chamfer` Chamfer Frame | Beveled octagonal corner enclosing a blade edge | Beveled edge retains the blade for +1 tick. Bevel catches light during the real extension. |
| `notched` Notched Frame | Inset side-notch pair with a vent slit | Vented aim efficiency: 8% less FOCUS cost. Notches illuminate while aiming. |
| `segmented` Segmented Frame | Three interlocking shell plates | Momentum stored between actions: +12 chain ticks. Plate seams latch on a kill and release at chain expiry. |

### Cube → Core (7)

| Item ID / name | Unique icon | Appearance-led role and activation |
| --- | --- | --- |
| `standard` Standard Heart | Solid diamond around a balanced center | Free balanced 3 EDGE / 3 health baseline. Stable heartbeat; no fake special power. |
| `time` Time Crystal | Hourglass-shaped crystal | Post-kill recovery window: existing 2× recovery for 120 ticks. Crystal fills then empties with that timer; no physics slowdown. |
| `riot` Riot Reactor | Reactor chamber with four ignition teeth | Four chain kills to Overdrive, max EDGE 2. Four teeth ignite sequentially; show the capacity tradeoff. |
| `glass` Glass Cannon | Fractured crystal with a sharp central point | Risk/reward: 2× score, max health 1. Crack stays visible; activation never implies a free shield. |
| `grav` Grav Core | Spiral well bending an incoming line | Existing small-Fang pull while aiming. Inward field marks connect only to eligible targets. |
| `magnet` Magnet Dynamo | Open two-pole magnet pinching a blade | Close-range wider cut within 100. Pole gap closes when eligible; no promise of long-range enemy attraction. |
| `echo` Echo Heart | Heart/diamond with one offset outline | Every third qualifying chain kill leaves the existing ghost blade. Count marks culminate in one stationary echo. |

### Cube → Tail (7)

| Item ID / name | Unique icon | Appearance-led role and activation |
| --- | --- | --- |
| `ribbon` Ninja Ribbon | Single folded streamer | Free baseline rebound control. Cloth follow-through, no unearned multiplier. |
| `wings` Prism Wings | Faceted wing pair with one refill notch | First airborne side-wall touch refills one EDGE. Wings flex once; spent state resets at floor contact. |
| `ghost` Ghost Scarf | Two tapering translucent scarf folds | Lingering blade: +6 ticks, no repeated hit on one enemy. Scarf trails lightly only through the actual active window. |
| `viper-tails` Viper Tails | Twin forked streamers shaped as speed arrows | +10% qualifying score at speed 18+. Streamers straighten at the real threshold, relax below it. |
| `anchor` Anchor Chain | Short linked chain and pointed weight | Stronger floor rebound (+15%) and existing local Fang clear. Weight taps the floor at the real event. |
| `thrusters` Mini Thrusters | Twin nozzles with short exhaust wedges | +8% earned rail rebound within the speed cap. Flame kick on valid rail banks, not permanent acceleration. |
| `spectrum` Neon Spectrum | Ribbon divided into interlocked bands | Chain continuity: +12 ticks. Bands light in sequence on kills; no permanent rainbow particle spray. |

### Attack → Blade FX (7)

| Item ID / name | Unique icon | Appearance-led role and activation |
| --- | --- | --- |
| `razor` White Razor | One clean white slash wedge | Free standard blade duration. Crisp contact edge, immediate clean exit. |
| `katana` Katana Ink | Brush stroke ending in a sharp tip | +2 blade ticks. Ink edge follows through slightly longer; decorative ink never deals damage. |
| `laser` Neon Laser | Straight beam with a small emitter notch | +3 blade ticks. Brief precise luminous cut; not a continuous damaging beam. |
| `glitch-fx` Glitch Tear | Stepped split slash with two offset blocks | +2 blade ticks. Local discontinuity/stitched after-edge; no screen-wide glitch on every hit. |
| `confetti` Gold Confetti | Three foil diamonds around a multi-cut notch | +12% qualifying multi-cut score. A few foil pieces on actual multi-cuts, not all pointer clicks. |
| `comic` Comic Impact | Uneven ink burst with a chain-link center | +18 chain ticks. One readable hit punctuation; chain link visibly persists. |
| `pixel` Pixel Shatter | Stair-step blade dissolving into square chips | +2 blade ticks. Quantized edge holds then breaks into a tiny fixed-budget chip burst; no duplicate hits. |

### Attack → Dash FX (8)

| Item ID / name | Unique icon | Appearance-led role and activation |
| --- | --- | --- |
| `dash-auto` Adaptive Dash | Core diamond inside a clean forward wedge | Free adaptive visual baseline; uses the core palette with normal dash rules. |
| `dash-ink` Ink Dash | Tapered brush comet | +1 blade tick. Short ink follow-through ends with the active edge. |
| `dash-fire` Ember Dash | Compact flame wedge with a hot cutting tip | +2 blade ticks. Ember-bright cutting tip; not burn damage or damage-over-time. |
| `dash-lightning` Volt Dash | Angular bolt inside a speed chevron | +10% qualifying score at speed 18+. Bolt snaps once at threshold; not the Coil's neighbor zap. |
| `dash-ice` Frost Dash | Ice shard inside a precision bracket | 8% less aim cost. Frost facets align while aiming; no enemy freeze or time slowdown. |
| `dash-water` Tide Dash | Curling wave flowing back into a notch | +10% passive FOCUS recovery. Short return ripple while recovering, not healing. |
| `dash-void` Void Dash | Dark wedge cutting through a split plate | +12% qualifying score against armor. Plate-shadow accent on eligible hits, not armor bypass. |
| `dash-echo` Echo Dash | One solid wedge and two offset outline wedges | +12 chain ticks. Small echoes reinforce continuation; they do not repeat damage. |

### Aim & Scan → Aim mark (4)

| Item ID / name | Unique icon | Appearance-led role and activation |
| --- | --- | --- |
| `pointer-reticle` Field Reticle | Open four-notch field reticle | Free standard power readout. Charge marks reflect real input. |
| `pointer-diamond` Prism Pointer | Faceted diamond sight bisected by an edge | +1 blade tick. Sight forms a sharpened diamond at release. |
| `pointer-orbit` Orbit Pointer | Small satellite on a broken circular track | +10% passive recovery. Satellite docks during recovery, not while FOCUS is draining. |
| `pointer-cross` Crosshair Pointer | Fine cross with a calibrated central gap | 8% less aim cost. Four arms settle into alignment during aim. |

### Aim & Scan → Radar (4)

| Item ID / name | Unique icon | Appearance-led role and activation |
| --- | --- | --- |
| `radar-base` Field Radar | One sweep arc with a contact dot | Free nearby-contact sensor. Only actual available contacts are shown. |
| `radar-1` Long-Range Array | Paired antenna arcs with an outer contact | Existing +35% range. Preview compares the actual range envelopes. |
| `radar-2` Threat Array | Antenna arcs around a hazard diamond | Existing +70% range plus active hazards. Hazard symbols differ from ordinary contacts. |
| `radar-3` Oracle Array | Full array with a short tell/windup arc | Existing +120% range plus hazards/tells. Windup arc shows real tell state, not invented future certainty. |

### Aim & Scan → Flight path (4)

| Item ID / name | Unique icon | Appearance-led role and activation |
| --- | --- | --- |
| `trajectory-base` Field Trajectory | Short dotted ballistic arc | Free short-path prediction using actual trajectory rules. |
| `trajectory-1` Vector Lens | Longer arc through a small lens | Existing extended prediction. Longer line, same honest physics. |
| `trajectory-2` Impact Lens | Arc with time ticks and a terminal bracket | Existing longer path/time ticks. Preview highlights the meaning of ticks. |
| `trajectory-3` Oracle Lens | Lens over a path with multiple analysis marks | Existing longest path/flight analysis. No auto-aim or guaranteed hit claim. |

### World → Arena (6)

These purchases are **arena affinities**, not physical changes to level geometry.
Their passives must be stated clearly rather than hidden behind a background skin.

| Item ID / name | Unique icon | Appearance-led role and activation |
| --- | --- | --- |
| `twilight` Twilight Undercut | Low horizon under a crescent slab | Free standard-contrast arena. No extra stat. |
| `tokyo` Cyber Tokyo | Stepped neon skyline with a speed lane | Rush-city affinity: +8% qualifying score at speed 18+. A local neon accent acknowledges eligible cuts. |
| `foundry` Blood Foundry | Furnace mouth enclosing a cracked plate | Armor-forging affinity: +12% qualifying armored-foe score. Brief furnace-hot contact accent; no global red wash. |
| `manga` Manga Paper | Folded ink page with two cut lines | Multi-cut composition: +10% qualifying multi-cut score. One local ink panel notch on the real event. |
| `synth` Synthwave Grid | Receding grid ending in a half-disc | Rhythmic recovery: +15% passive FOCUS regen. One small grid accent on recovery start, not perpetual scrolling UI. |
| `void` Pro Void | Negative-space eclipse with a boss-plate notch | Boss-hunter affinity: +15% qualifying Landlord score. Eclipse closes at a real boss payout, not every hit. |

### Candidate rule changes—not silently bundled with the art pass

Some current passives remain thin thematic links. Give these a deliberate
mechanics-design pass after the icon/feedback foundation, rather than inventing
73 independent damage systems:

1. **Obsidian Stealth:** test replacing airborne score with faster FOCUS recovery
   while airborne and not aiming. A dark, light aerial shell then changes how you
   play, without adding invisibility/invulnerability. Must share the recovery cap.
2. **Volt Dash:** compare its speed-score role against a small earned-rail-recovery
   role. Do not duplicate Coil's zap or allow infinite EDGE/boost loops.
3. **Frost Dash:** compare current aiming efficiency against a short post-bank
   aiming-efficiency window. It must not freeze enemies or change physics time.
4. **Void Dash:** compare armor bounty against an armor-contact resource rebate
   with a strict per-shot/target gate. Do not bypass plates or auto-kill bosses.
5. **World items:** retain explicit affinity labels for now. Consider separating
   scenery choice from affinity choice later if players read them as cosmetic;
   this is a save/UI migration, not a small animation tweak.

These candidates require comparative playtests and final values before shipping.
The safe default is the identity table's current authoritative rules. No lost
ownership, surprise price changes, or removed benefit without a migration plan.

## 4. One source of truth for meaning

Introduce an ID-keyed item-presentation catalogue that references authoritative
rules instead of hardcoding a separate copy of gameplay values. Suggested shape:

`{ iconId, visualMotif, role, triggerId, previewId, feedbackId, tradeoffKeys }`

- Gameplay resolver owns values, caps, target eligibility, cooldowns and procs.
- Presentation references that data for benefit chips, explanation and demos.
- Actual gameplay emits a bounded item activation event when a condition truly
  changes an outcome. No cosmetic animation infers a proc from elapsed time.
- Each proc identifies source item, triggering event and a stable event token so
  multiple draws cannot replay the same sound/celebration.
- Multiple eligible perks aggregate: show the strongest primary response plus a
  small combined receipt, not eleven simultaneous popups.
- Baselines say BASELINE. Challenge requirements and tradeoffs stay visible.
- Never confuse SCORE with CREDITS; never draw a status effect that is not real.

## 5. Preview design

Each item gets a controlled **Ready → Trigger → Result** demonstration:

1. Isolate the attachment/material at a readable scale.
2. Show one trigger: aim, kill, full power, side wall, floor bank, damage or armor.
3. Show the real effect, including eligibility and costs.
4. Return cleanly to neutral. Pause/Replay works without changing equipment.

Use a few reusable authored rigs rather than 73 miniature physics simulations:
AIM, CHAIN, CUT WINDOW, SCORE CONDITION, ARMOR, DEFENSE, REBOUND, RESOURCE,
SENSOR RANGE, TRAJECTORY. Override the selected part's geometry and reaction.
Where timing/range matters, compare baseline vs equipped with labelled values.
A decorative hero pose alone does not demonstrate an ability.

## 6. Performance and accessibility budget

- UI feedback prefers transform/opacity on existing small elements; no layout
  animation, animated full-screen blur, extra GL pass or particle-per-button loop.
- One shared cancellable feedback controller; delegated DOM events, explicit
  success/failure events for purchases/equips; dispose all listeners/resources.
- Starting budgets: at most 3 simultaneous local UI bursts and 24 UI flecks total;
  replace/merge old bursts, don't build a queue. Tune against measurements.
- Shared audio limiter: suppress rapid navigation repeats; retain strongest cue
  policy for simultaneous combat. Menu sounds must respect mute/suspension.
- Cache repeated icon rasters. Keep the shop's visible-only 30Hz ceiling and
  dormant closed dialogs. Do not animate all catalogue icons continuously.
- Keep the existing rare impact/compositor budget; no extra shader texture reads.
- All stats readable without sound, motion, haptics or color discrimination.
- Do not alter physics stepping, camera lead, hit ownership or AI for UI polish.
- Locked 60 FPS remains a measured device target, not a promise from unit tests.

## 7. Implementation chunks and acceptance gates

### Chunk A — shared interaction feel

Implement button/toggle/tab/card feedback, consistent sound routing, reduced
motion and failure states. Add explicit buy/equip success hooks.

Accept when mouse/touch/keyboard each acknowledge one action exactly once;
rapid clicking cannot double-spend, queue animation storms, or delay input;
muted/hidden/disposed states are quiet; all four shop layouts remain usable.

### Chunk B — all 73 item icons

Author the atlas and presentation mapping. Replace generic item-corner symbols
with distinct item icons; retain useful slot and role badges separately.

Accept when catalogue IDs and icon IDs match one-to-one; no missing/duplicate
primary designs; every icon survives monochrome/20px inspection; ownership and
names remain legible. Capture a review sheet for audit—not a shipped giant asset.

### Chunk C — make item appearances react

Add selected attachment equip reactions and actual-event activation feedback by
family: heads/eyes/shells/cores/tails first, then blade/dash/aim/sensors/world.
Wire visual states to existing gameplay rules. No mechanic changes in this chunk.

Accept when trigger counts match actual events, spent guards/expired windows
look spent/expired, and multi-perk builds remain readable within effect caps.

### Chunk D — honest, item-specific demonstrations

Implement the reusable trigger rigs and per-item overrides. Include baseline vs
part comparisons, tradeoffs, condition labels, and truthful sensor/path examples.

Accept when every paid/challenge item's claimed advantage can be seen in its
preview; reduced motion still explains the result; previewing never buys/equips
or changes the active run.

### Chunk E — focused ability redesign and balance

Evaluate the explicitly listed weak-fit candidates, one family at a time. Record
old/new rules and target loops. Add mechanics tests before enabling changes.
Keep ownership and loadouts; provide truthful updated receipts. No blanket
stat inflation or recursive procs. Leave candidates unchanged if playtests do not
show a clear improvement.

### Chunk F — regression and device profiling

Run full tests, normal/Poki builds, four-viewport purchase/equip/reload/retry
checks, keyboard/touch/rapid-click and reduced-motion/muted tests, GL fallback and
lifecycle tests. Add a catalogue coverage test and deterministic trigger tests.
Profile repeated shop browsing and dense combat on actual target devices; report
frame-time percentiles, long frames, allocation/GC, cache use and memory growth.
Only claim a performance improvement with measured before/after evidence.

## Definition of done

- 73 recognizable item icons; each item's role makes sense next to its appearance.
- Every actionable control responds; feedback importance matches action importance.
- Demos, labels and gameplay agree; no fake burning/freezing/zaps/armor bypass.
- UI remains readable during combined loadouts and rapid interaction.
- Existing wallet/equipment ownership survives, purchases remain single-fire.
- No extra postprocessing pass; bounded effects and complete feedback cleanup.
- No regressions to gameplay, accessibility, responsiveness or platform lifecycle.
