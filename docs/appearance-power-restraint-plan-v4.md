# SPLATR V4 — One shape, one readable power, one restrained payoff

> **Historical planning draft.** Use the single
> [unified upgrade harmony and implementation blueprint](unified-upgrade-harmony-implementation-plan.md)
> for current item powers, harmony, implementation hooks and regression gates.
> Its explicit combined-profile decisions supersede conflicting older wording below.

**Item-power design proposal. No new abilities or artwork are implemented by this document.**

> Read with [V5: full upgrade animation harmony](upgrade-animation-harmony-plan-v5.md).
> V4 remains the item-level appearance/power and restraint specification; V5 governs
> cross-item animation, materials, particles, event ownership and family resolution.
> Neither document is an implementation report.

This completes the appearance-led redesign beyond the elemental attacks.
It covers **all 58 non-Dash/non-Slash items individually**, based on the actual
rendered catalogue, plus restraint/composition rules for **all 73 items**.
The 15 attack profiles remain specified in `visual-physics-upgrade-plan-v3.md`;
V4 overrides their particle density, lingering-effect policy and conflicting
combinations. Do not implement multiple historical proposals simultaneously.

## The stronger rule

> First show what the object is. Then let it do the thing that object suggests.
> Use the smallest motion and clearest result that prove its power.

Ears should sense. Iron should block. Vents should cool. A spring-like segmented
shell should absorb and return force. A hologram should have a tightly defined
phasing interaction. A glowing crack should store/release heat, not randomly add
score. A crown that already breaks plates does not need an unrelated new ability.

A perk need not always alter body physics. Better information, resource handling
and scoring can be valid—but only when the instrument/material clearly explains
that role. Not every item needs particles. A sensor that lights the right marker
is more convincing than a sensor spraying confetti.

## Evidence and limits

Reviewed the actual rendered head/eye, shell/core, tail/world and aim/sensor
sheets produced by `node scripts/capture-upgrade-audit.mjs`, plus current rules in
`equipment.js`, `part-perks.js` and `power-readout.js`. Visible examples include
Cyber Ears' pink triangular receivers, Iron's heavy blue plates, Notched Frame's
inward side recesses, Segmented Frame's separate mint panels, Hologram's cyan mesh,
Anchor's linked pointed weight, and the distinct actual sensor displays.

These captures show existing art, not the proposed animation. They do not prove
how a new mechanic feels in play. All new values below are **prototype bounds**;
playtests decide balance. “Keep” means retain an existing coherent rule, not ship
unchanged static art. “Replace” removes the old passive when the new rule ships.

## 1. Don't let the juice overflow

### One readable phrase per event

**Gather → act → settle.** No animation loops stacked on top of that phrase.

- Ordinary button: 1px depression, icon compresses at most 3%, short clean return.
  No particles. No hover noise. Label remains stable.
- Select: one border seat and icon response, about 120ms. No card wobble.
- Buy/equip: one material-specific assembly/latch, about 180–240ms. At most
  2–4 decorative fragments for a genuinely important transaction, not every click.
- Combat activation: the actual attachment moves first; **one** primary contact
  mark; optional **0–6** material particles. Never require a burst for every perk.
- Damage/critical danger outranks success flair. If an attack and perk fire
  together, use one composite accent rather than two competing explosions.

### No dripping or visual residue without meaning

- No permanent particle emitter attached to every equipped slot.
- No endless ribbon, dripping ink, smoke curtain, rainbow exhaust or water trail.
- Default decorative accent: settle/fade in **100–180ms**; strongest contact may
  reach **250ms**. Never delay input, damage, bank or aim to wait for it.
- Detached particles end within roughly **8–18 ticks** unless a short material
  exception is explicitly reviewed. No persistent floor stains in this version.
- Gameplay status/attack indications persist for their **actual mechanic**:
  frozen rim until thaw, burn marker until expiry, charge notch while charged.
  Those are information, not permission for continuous ornamental particle spam.
- A real damaging trail/projectile must be identifiable and last exactly as long
  as its hit region. Dead debris looks dead, not like another attack.

### Shared starting limits

These replace—not add to—the V3 cosmetic requests:

| Limit | Starting proposal |
| --- | --- |
| Active harmless foreground particles, all loadout effects combined | 48 standard / 24 low |
| New harmless particles per simulation tick | 8 total, prioritize actual contact |
| Requested particles from an individual effect | 0–6; most equipment uses 0–3 |
| Simultaneous large decorative contact accents | 2, merge/drop lower-priority art |
| Purchase/equip UI particles | 4 total, one transaction burst at a time |
| Idle decorative emissions | 0 |
| Gameplay projectiles/status | Separate reserved limits; never removed by quality setting |

48 is a testable starting ceiling, not a measured performance result. Existing
sparks/dust must be folded into the shared allowance, not left running beside a
second 48-particle system. On low quality, remove ornament before silhouettes,
status indicators or meaningful contact boundaries. Ability strength stays equal.

### Composition ownership

- **Dash owns launch/travel. Slash owns the primary contact silhouette.**
- Head/shell/tail react through their own geometry, not another full-body aura.
- Core gets one small internal state cue, not a second huge shockwave.
- A successful bank produces one combined contact phrase even if Wings/Tide/
  Thrusters/world affinity also change different underlying values.
- Effects are spawned at actual world-space events, not every render. Old drops
  keep their original momentum when the player banks; don't rotate an old wake
  around the hero. Don't exaggerate force that the simulation did not apply.
- Use shape/brightness/line style as well as color. No stronger flash as a substitute
  for a meaningful upgrade. Don't cover face, incoming attack or aim origin.

## 2. Common rules for new mechanics

- Preserve saved ownership, item IDs, prices/unlocks unless deliberately reviewed,
  presets and challenge history. Tell existing owners what changed.
- The old perk is replaced, not secretly retained under the new power.
- Target information never auto-aims. Existing input, launch buffering and control
  response stay immediate. No new mandatory button or combat selection screen.
- No physical Cube rotation, hidden hurtbox resizing or skipped physics steps.
  Attachment flex is visual unless a real rule explicitly says otherwise.
- New damage is nonrecursive secondary unless explicitly a primary modifier.
  Boss armor/phases, tutorials and existing hit ownership remain authoritative.
- New force is collision/leash checked and bounded. No offscreen AI suspension
  used as a performance shortcut; ability-specific status is a different system.
- Do not stack status slow/freeze multipliers indefinitely. The strongest applicable
  slowdown wins; immunities/expiry use world simulation time, not slowed local AI time.
- Per-shot one-time bonuses consume stable event IDs. Pausing/rendering/replaying
  a preview cannot mint charges, resources, damage or rewards.
- No new elemental reaction bonus merely because two colors meet. Name, visualize
  and test a reaction before it can change combat.

## 3. How each specification is meant to be used

Each item gets: **observed shape → intended inference → real power → physical
boundary → animation phrase → exact decorative allowance → proof/counterexample**.
“Zero particles” is a deliberate design when the object's motion or data is enough.

Numbers are prototype values, not implementation claims. Current rules are stated
so replacement decisions are explicit. For each item, test correct trigger, an
ineligible case, deduplication, pause/reset and the no-extra-ornament presentation.

# I. HEAD — read the object before the stat

## 01. Bare Head — `none` · **Keep: clean baseline**
- **See / infer:** exposed folded brow, no hardware. This is a finished neutral choice, not a missing upgrade.
- **Power / physics:** no head modifier; normal movement/contact rules. Do not invent a hidden free-item weakness.
- **Phrase:** remove old attachment locally → brow settles in 100ms → face is still. Launch uses the shared body pose, no extra head bounce.
- **Juice:** 0 head particles; one soft equip click. No aura, glow ring or idle emission.
- **Proof:** switching from Viper/Crown removes their speed/width effects on the next run. Baseline remains legible beside highly upgraded equipment.

## 02. Gold Halo — `halo` · **Keep: supported fall**
- **See / infer:** a floating ring should support/suspend, not damage nearby targets.
- **Power:** current 15% lighter gravity while aiming and falling. No lift, hover or extra horizontal steering.
- **Physics:** actual eligible falling acceleration changes; rising/grounded movement does not. Release restores normal acceleration immediately.
- **Phrase:** tilted ring levels as support begins → lower crescent stays steady → tilt returns on release, within 140ms. Never orbit the whole Cube.
- **Juice:** 0 routine particles; at most 2 upward motes on the first qualifying support entry of a shot. No constant falling glitter.
- **Proof:** equal-input descent comparison; rising/empty-FOCUS cases show no magical suspension.

## 03. Cyber Ears — `neko` · **Replace chain grace: directional hearing**
- **See / infer:** pink inset triangular receivers should detect approaching danger. +12 chain ticks is not guessable from ears.
- **New power:** while aiming, indicate **one closest closing eligible hostile within 180 units**, based only on current motion/state. No future AI prediction. Visible short bearing marker; ordinary enemy tells remain free.
- **Physics:** no auto-turn, target snap, slowed enemy or player force. Information is the upgrade.
- **Phrase:** ears pivot independently toward the accepted bearing → one 80ms perk when the threat becomes relevant → hold, then relax when it leaves. Switching targets has a small visual hysteresis, not stale gameplay data.
- **Juice:** 0 particles. At most one quiet receiver tick per new stable threat, rate-limited.
- **Proof:** approaching versus receding enemy; blocker/sensor-eligibility rules applied honestly. No indicator outside range, no arrow pretending a target behind a wall is hittable.

## 04. Viper Horns — `viper` · **Keep: fast narrow strike**
- **See / infer:** swept paired red horns look streamlined and piercing.
- **Power:** current +20% launch speed, −15% cut width, existing active-reach compensation.
- **Physics:** preserve live speed ceiling, earned momentum and collision sweep. Volt cannot multiply this into an uncontrolled second boost.
- **Phrase:** horn inner edges tighten during aim → short needle-like launch highlight → fade by 120ms; actual horns stay rigidly attached.
- **Juice:** at most 2 short rear pin-sparks on committed launch; no additional trail if Dash already owns travel.
- **Proof:** faster arrival, narrower edge miss and unchanged compensation logic. Art must not draw a broad attack fan.

## 05. Broken Oni — `oni` · **Replace last-health score: last-stand edge**
- **See / infer:** broken horn/cracked mask suggests dangerous retaliation, not a gold-income item.
- **New power:** at exactly **1 health**, the first eligible primary armored contact per shot gains **+1 plate damage**, excluding monolith/Landlord and protected targets. Replace +50% score. Shared total extra-plate cap applies.
- **Physics:** ordinary speed, recoil and health; no lifesteal, shield or death prevention.
- **Phrase:** crack fills steadily at one health → accepted contact sends a short crack-to-horn pulse → horn goes quiet. No continuous red flashing.
- **Juice:** 0 idle; 2 ceramic chips only when the bonus really removes a plate. Short cracked-ceramic answer under the main Slash sound.
- **Proof:** compare health 2 versus 1, boss resistance and ordinary Fang. Preserve challenge unlock; Glass risk must remain real.

## 06. Cube Crown — `crown` · **Keep: weight behind an armor hit**
- **See / infer:** broad gold crown and heavy central jewel imply authority/weight.
- **Power:** current two-plate eligible hits with −8% launch speed. No universal double damage/boss bypass.
- **Physics:** preserve real armor recoil, speed penalty and remaining-plate limit. Cosmetic crown squash does not increase Matter mass.
- **Phrase:** jewel compresses on armor contact → two local plate notches separate in the combined contact mark → crown seats within 160ms.
- **Juice:** 0 launch spray; 2 metal chips only if Slash has spare contact budget. One low latch, not a royal fanfare.
- **Proof:** two plates versus one remaining; speed difference visible. If Oni/Glass/Slash also add plate damage, show one capped transaction, not multiple explosions.

## 07. Samurai Crest — `samurai` · **Keep: horizontal discipline**
- **See / infer:** outward gold tips should explain lateral cutting width.
- **Power:** existing +20% width within the valid near-horizontal angle band.
- **Physics:** no angle snapping or steering. One resolved envelope combines head/sword/Dash/Slash width.
- **Phrase:** crest tips align with the level band during aim → one flat lateral edge accent on valid release → neutral by 120ms. Outside the band stays quiet, no failure shake.
- **Juice:** 0 particles; two short graphic strokes count as the crest cue, not another full slash. Dry sheath click on eligibility entry, heavily rate-limited.
- **Proof:** just-inside/just-outside angle, both horizontal directions, combined width cap. The visual band and real condition use the same rule.

## 08. Lightning Coil — `coil` · **Keep: one real conductor**
- **See / infer:** two terminals joined by electricity should relay electricity.
- **Power:** current one-neighbor direct-cut zap within 160, nonrecursive. Share conduction deduplication with Volt.
- **Physics:** secondary target really loses its legal damage unit; no player acceleration or decorative-arc damage.
- **Phrase:** terminal pinch → one connected arc to the accepted target for 70–100ms → bridge returns to a dim steady state.
- **Juice:** arc plus **0–2** pin-sparks, never a radial storm. No idle spark emission.
- **Proof:** neighbor inside/outside range, no neighbor, shared Coil/Volt target, target removed before display. Never draw a successful hit without accepted damage.

## 09. Danger Beacon — `beacon` · **Keep: actual early warning**
- **See / infer:** visible amber lamp housing and cone are a warning instrument.
- **Power:** current Fang-windup warning. Unlike Ears, this is actual tell-state warning, not just a short-range closing bearing while aiming.
- **Physics:** no delay added to enemy attacks and no automatic dodge. Standard telegraphs stay unchanged.
- **Phrase:** housing turns toward real windup → one short amber sweep → steady small tell marker until canceled/resolved. No revolving disco cone.
- **Juice:** 0 particles. One relay click for a new warning group, not one siren per enemy.
- **Proof:** canceled tell clears instantly; offscreen-warning range is not enemy-art culling range. Oracle Radar gets a consistent shared tell symbol, not a duplicate huge arrow.

# II. EYES — expressions and instruments, not seven colored slits

## 10. Ninja Slits — `ninja` · **Keep: clear baseline**
- **See / infer:** sharp open slits communicate intention and alertness.
- **Power / physics:** standard sight/input, no modifier. Free eyes keep full power/cancel readability.
- **Phrase:** one blink when equipped → gaze follows intended action → brief launch compression. Suppress decorative blinks when they would hide the release cue.
- **Juice:** 0 particles, 0 gaze sounds. Equip has one soft tick.
- **Proof:** readable on every shell/world and at the smallest hero size; no change in aim/body motion compared with the same input on paid eyes.

## 11. Cyber Visor — `visor` · **Keep: immediate aim efficiency**
- **See / infer:** broad cyan glass calibrates targeting.
- **Power:** current −10% aim FOCUS drain, immediate and capped with other efficiency sources.
- **Physics:** world/player time and targeting stay unchanged; not auto-lock.
- **Phrase:** one scan aligns during aim entry in about 100ms → calibrated notch holds → clears on release. No constant scanning stripes.
- **Juice:** 0 particles; one quiet calibration tick on a meaningful aim entry, no per-frame audio.
- **Proof:** identical aim interval costs less FOCUS while the same trajectories unfold. Cap saturation is stated rather than shown as fictitious extra savings.

## 12. SSJ Blaze — `blaze` · **Replace drive score: ignition reserve**
- **See / infer:** gold-white flame-shaped eyes should awaken with Overdrive and supply an energetic release.
- **New power:** on actual **Overdrive entry**, return **one EDGE**, clamped to the current maximum, once per activation. Replace +8% drive score. No queued refund if already full, no timer extension.
- **Physics:** the returned EDGE permits a normal legal launch; it does not multiply velocity/damage or bypass depleted-input gates.
- **Phrase:** pale flame tips gather → brief white-hot eye opening at actual refund → settle into a steady hot shape during Drive.
- **Juice:** at most 2 short upward embers at entry; no target burn or idle flame shower. Shared EDGE cue replaces an extra fanfare.
- **Proof:** full-cap no-overfill, Riot's max 2 EDGE, simultaneous activation and retry. Ignition cannot feed itself through repeated visual events.

## 13. Glitch X-Eyes — `glitch` · **Keep: recovery reconstruction**
- **See / infer:** observed broken X/ring-like cyan/pink glyphs reconstruct between actions.
- **Power:** current +12% eligible passive FOCUS recovery.
- **Physics:** no teleport, body stutter or skipped frame. Resource changes remain continuous simulation-owned changes.
- **Phrase:** missing segments reseat once on recovery entry → steady completed glyph → separate slightly during aim. Never random jitter every frame.
- **Juice:** 0 routine particles; at most 2 pixels on equip, gone within 120ms. Short digital seat, no static-noise loop.
- **Proof:** actual faster recovery, none while recovery is ineligible; rapid cancel cannot mint FOCUS or replay noise.

## 14. Smug Half-Lid — `smug` · **Keep: unhurried chain composure**
- **See / infer:** relaxed half-lids imply breathing room, not destructive energy.
- **Power:** retain +12 chain ticks. This is one of the legitimate non-damage identities; do not force an attack onto an expression.
- **Physics:** no enemy stun/player speed change. The real chain timer extends.
- **Phrase:** one lid lifts after a qualifying kill → holds through a short calm response → settles; no universal spark effect. A small chain-notch receipt proves the timing.
- **Juice:** 0 particles, no laugh/voice cue; at most the shared aggregate chain click.
- **Proof:** baseline chain expires earlier in the demonstration; no new bonus when already at the build cap. Eyelid animation is actually authored, not merely promised in text.

## 15. Hypno Spiral — `hypno` · **Replace cheap aim: brief daze**
- **See / infer:** spirals directed at an enemy imply a bounded hypnosis effect, not generic resource efficiency.
- **New power:** after **18 continuous aim ticks**, daze one eligible Fang within **140** and clear static sight for **12 ticks**: defer initiation of a new attack. Existing rush/projectiles and movement continue. Per-target **90-tick immunity**; one target per hold. Replace −15% aim drain.
- **Physics:** this is a local AI initiation gate, not global slow time, mind-control steering or invulnerability.
- **Phrase:** spirals converge → one thin link reaches accepted target → a small spiral-notch marks real daze → clean release. No spinning screen.
- **Juice:** 0 particles; short low focus click once on acceptance, not on a resisted attempt.
- **Proof:** tell already started is not retroactively canceled, wall/range blocks it, boss resists, aim tap cannot trigger it. Freeze/Time conflicts use explicit status policy.

## 16. Sniper Dot — `sniper` · **Replace full-power score: precise first puncture**
- **See / infer:** actual red central sight should improve a committed accurate shot.
- **New power:** a shot released at authoritative power **≥0.9** gets **+1 plate on its first eligible nonboss primary armored contact**, with **−10% width for that shot**. Replace +10% score; extra-plate cap prevents multiplicative armor deletion.
- **Physics:** no homing, target snap or flight correction. The narrowness is real and visible; no reward from simply holding a full sight without a successful hit.
- **Phrase:** sight ticks converge with real power → solid dot at eligibility → one pin-like contact mark on accepted bonus.
- **Juice:** 0 launch particles; at most 1 bright pin-spark inside the shared Slash contact. One lock click, no alarm.
- **Proof:** below-threshold, off-axis miss, second victim and protected boss. Laser/Katana combinations resolve their geometry/plate limits once.

# III. SHELL — materials that behave like their construction

## 17. Paper Ninja — `paper` · **Keep: folded neutral shell**
- **See / infer:** white folded faces, bold black perimeter. Paper should flex, not behave like armor plating.
- **Power / physics:** no shell modifier. No secret fire vulnerability or paid-tier accuracy difference; collision body stays the normal square.
- **Phrase:** faces fold into place over 180ms → one short crease compression on launch/contact → settle. Never physically rotate or resize the body.
- **Juice:** 0 ambient; up to 2 tiny paper fibers on a hard contact only if the Slash budget permits. No dripping ink, cloth confetti or persistent crease damage suggesting lost health.
- **Proof:** baseline fully usable; shape readable on Manga; no phantom collision changes during a fold.

## 18. Obsidian Stealth — `obsidian` · **Replace aerial score: quiet approach**
- **See / infer:** matte black inset facets suggest reduced detection rather than airborne money.
- **New power:** after **18 ticks at speed <6 while not aiming**, Quiet state reduces **new eligible Fang acquisition range to 75%** of normal. Ends immediately on aim, launch or damage. Existing tells/rushes/hazards, already-alert enemies and bosses are unaffected. Replace airborne +8% score.
- **Physics:** no invisibility, collision immunity, target teleport or canceling an ongoing attack. The player's movement remains normal; new acquisition is the only AI change.
- **Phrase:** inset seams close → steady subdued surface with a clear neutral outline → seams reopen as Quiet ends. Body stays visible, opacity never used as a fake dodge.
- **Juice:** 0 particles. One soft stone seat; no smoke cloud.
- **Proof:** comparison of new acquisition boundaries; already-alert Fang still pursues, close enemy still detects. No offscreen safety claim or idle auto-clear behavior.

## 19. Hologram Wire — `hologram` · **Replace efficiency: precision phase gate**
- **See / infer:** translucent cyan mesh should allow a narrowly defined object to pass through, not just reduce a meter.
- **New power:** during the **first 4 ticks of a legal launch**, phase through **one eligible hostile needle**, then start **120-tick recharge**. Replace −12% aim cost. Initial scope excludes beams, zones, rings, contact attacks, bosses' protected mechanics and tutorial hazards.
- **Physics:** only that needle/player hit pair is suppressed until clear; the needle continues normally. Player still collides with walls and enemies. No general invulnerability, teleport or deletion of all projectiles.
- **Phrase:** ready mesh has one closed calibration cell → launch opens that cell briefly → accepted needle passes through → cell stays dark until ready. Ordinary launch without interception does not falsely play a block.
- **Juice:** 0 travel particles; 2 cyan vertex motes on actual interception, 120ms maximum.
- **Proof:** correct timing/type, a second needle, a Fang rush and a wall. Show the limitation before purchase, not in a tiny tooltip.

## 20. Prism Shell — `prism` · **Keep: physical refraction needles**
- **See / infer:** large purple facets split a contact into sharp outgoing pieces.
- **Power:** current two upward side-wall needles with 45-tick cooldown and current damage eligibility.
- **Physics:** two actual projectiles retain collision/lifetime rules. Floor contact is not side-wall activation; avoid duplicate corner procs.
- **Phrase:** contact-side facets pinch → exactly two bright solid needles launch → two small readiness notches drain/refill with real cooldown. Face remains visible.
- **Juice:** needles are gameplay objects, not particle quota. Add only **0–2** dead facet chips. Do not scatter ten identical-looking crystals and make only two secretly dangerous.
- **Proof:** valid side wall, floor/cooldown counterexamples, solid-blocked needle and exact ready state. Wings shares the contact accent rather than making a second burst.

## 21. Bastion Iron — `iron` · **Keep: one structural guard**
- **See / infer:** thick blue steel faces with bevels should absorb one hard impact.
- **Power:** existing one Fang-rush guard per run; no protection from everything.
- **Physics:** preserve the current collision-safe push-clear and its real direction. No blanket mass increase, floor immunity perk or new permanent health.
- **Phrase:** intact latch ready → plate compresses at actual block → latch opens into a persistent spent dent. Restoring health does not visually repair the consumed guard.
- **Juice:** one solid compression mark and **2–3** short metal flakes, within 180ms. One low clack under priority damage cues; no screen shake.
- **Proof:** first rush blocked, second normal, unrelated hazard unblocked. It must remain obvious that Glass still has one health.

## 22. Lava Cracked — `lava` · **Replace chain grace: banked heat**
- **See / infer:** dark shell with magma seams should store and spend heat.
- **New power:** each qualifying primary kill adds **1 heat, max 3**. At 3, the next eligible primary nonboss armored contact consumes all heat and applies **one secondary burn unit after 18 ticks**. No spread/aura. Heat clears after **90 ticks without a new qualifying kill**. Replace +18 chain ticks.
- **Physics:** no body temperature/gravity change, no automatic touch damage. Bosses/protected targets do not consume/payout the attack under a hidden alternate rule; show resistance.
- **Phrase:** each kill lights one existing crack segment → full shell has a steady center seam → accepted contact transfers one thin hot seam to its target → shell cools. No perpetual flame coat.
- **Juice:** 0 per heat increment; at most **2 embers** on actual heat transfer. The real burn tick uses one small target contraction, not another burst.
- **Proof:** exact charge/decay, no secondary kill charging, no burn recursion with Ember, no heat payout from rendering or re-equipping.

## 23. Gold Foil — `gold` · **Keep: visible value, not armor**
- **See / infer:** gold material naturally implies a value/score affinity; this score perk is coherent.
- **Power:** current +10% qualifying kill-score contribution under the shared equipment cap. No extra shop credits, hidden purchase discount or damage.
- **Physics:** gold color does not increase player mass/recoil/restitution. Harmless foil curls are not Confetti Slash flechettes.
- **Phrase:** folded face seats → one 100ms specular crosses on an accepted scoring event → steady material. No frequent idle star sparkle.
- **Juice:** 0 combat particles; at most 2 small curved scraps on equip only. One aggregated scoring cue, not coin rain.
- **Proof:** base/bonus score and saturated-cap no-gain case; clear separation of SCORE and CREDITS. No gold flechette art emitted by the shell.

## 24. Chamfer Frame — `chamfer` · **Replace blade tick: glancing recoil**
- **See / infer:** actual eight-corner bevels should shed an impact rather than arbitrarily lengthen a weapon timer.
- **New power:** reduce the existing **primary armor-contact recoil component by 20%**. Replace +1 blade tick. Only the armor shove component changes; ordinary velocity, rail restitution and hit damage do not.
- **Physics:** calculate from the authoritative incoming velocity/shove, not from the already-clamped final vector. Never add speed above what the unshoved player carried, remove earned Hyper momentum, or create outward wall penetration.
- **Phrase:** leading bevel catches the contact → small diagonal slide highlight follows the actual glancing direction → returns in 120ms. Physical square remains square.
- **Juice:** 0–2 corner chips, not a metal explosion. Light hard tap.
- **Proof:** compare outgoing velocity against identical armor; normal hit and wall bank unchanged. No extra active blade duration left underneath.

## 25. Notched Frame — `notched` · **Replace aim efficiency: vent cooling**
- **See / infer:** inward side vents release spent energy; they should help recovery rather than act like another targeting visor.
- **New power:** **+12% eligible passive FOCUS recovery while not aiming**, under the shared 40% recovery-bonus cap. Replace −8% aim drain.
- **Physics:** no jet propulsion or drag change. Recovered FOCUS is the real benefit; vents are not thrusters.
- **Phrase:** vents stay dark during drain → one short outward vent line on recovery entry → steady small open notch while recovery is active → dark at full/aim.
- **Juice:** 0 routine particles; a single pair of short graphic vent lines is enough. No smoke, steam curtain or continuous hissing.
- **Proof:** faster real recovery, no aim discount, no overfill/cancel farming. Existing owners keep the item with an updated receipt.

## 26. Segmented Frame — `segmented` · **Replace chain grace: compression spring**
- **See / infer:** separate mint plates should compress, store and return a bounded amount of force.
- **New power:** first eligible armor shove of a shot stores **20% of the removed forward momentum, max 4 speed units**. Next legal launch within **45 ticks** may return that amount, but not exceed the recorded pre-impact speed or current legal ceiling. One charge, refresh never stacks. Replace +12 chain ticks.
- **Physics:** store only actual loss; a kill without recoil stores nothing. A new launch can never mint speed by hitting repeated armor. Canceled aim does not spend the charge; expiry discards it.
- **Phrase:** plates compress along true contact → one seam remains visibly compressed → next launch releases it → panels settle within 150ms.
- **Juice:** 0 particles; plate motion and one ratchet click prove the mechanic.
- **Proof:** recoverable versus nonexistent loss, expiry, wall collision, high-speed ceiling, no charge farm. Resolve Chamfer as an alternative shell, not a stackable shell bonus.

# IV. CORE — the engine's motion must show its state

## 27. Standard Heart — `standard` · **Keep: balanced capacity**
- **See / infer:** plain central chamber, balanced charge.
- **Power / physics:** current default health/3 EDGE, ordinary movement/resource rules. Never weaken the free engine to make others attractive.
- **Phrase:** chamber seats → small inward notch engages on real EDGE return → steady. Don't draw a giant floating device absent from the equipped art.
- **Juice:** 0 particles, no constant heartbeat sound. Shared resource cue only.
- **Proof:** correct capacities after switching from Glass/Riot; no stale special-core force or charge. Opaque shells still convey state through a small supported inset/receipt, not a new hole cut in every material.

## 28. Time Crystal — `time` · **Replace recovery multiplier: small time lens**
- **See / infer:** actual blue crystal/clock-like chamber suggests local time distortion, not simply faster FOCUS refill.
- **New power:** continuous aim for **12 ticks** opens a **12-tick local lens** around one selected eligible nonboss enemy within **120** and static sight; its locomotion and own windup progression run at **80%**. Source cooldown **60 ticks**; release ends the lens. Replace post-kill 2× recovery.
- **Physics:** use target-local dt, never skip the world's physics. Emitted projectiles/hazards keep normal time. Global status expiry/immunity clocks stay on world dt; no slowing a freeze timer to extend it forever.
- **Phrase:** crystal halves align → thin steady clock bracket encloses the accepted target → a slow tick proves reduced progression → closes cleanly. No full-screen warp.
- **Juice:** 0 particles. One fine clock tick on acceptance, not per frame.
- **Proof:** measurable local motion/tell difference; outside range, released aim, bosses and already-frozen targets follow explicit stronger-status policy. Never silently compound existing aim slow.

## 29. Riot Reactor — `riot` · **Keep: early ignition, less reserve**
- **See / infer:** inset bolt/reactor should visibly charge toward a real burst state.
- **Power:** existing four-kill Overdrive requirement, max EDGE 2. No second unrelated power added.
- **Physics:** existing Drive effects remain authoritative. Reactor art cannot multiply speed again, especially with Viper/Volt.
- **Phrase:** four small reactor notches seat one per eligible kill → one compact ignition on real Drive entry → steady hot core → cool on exit. Chain break clears matching progress.
- **Juice:** 0 charge particles; **up to 3** short core sparks on entry only, suppressed if Dash/contact already owns the accent. No continuous exhaust.
- **Proof:** correct direct/secondary counts, 2 EDGE tradeoff, new Blaze refund cannot exceed capacity or trigger repeated activations.

## 30. Glass Cannon — `glass` · **Replace double score: real fragile offense**
- **See / infer:** sharp red crystal/fragile chamber should mean strong offense with real fragility, not only high scoreboard income.
- **New power:** **+1 primary damage unit against eligible nonboss armor**, still **max health 1** including repair paths. Replace 2× score. No bonus to burn, fragments, echoes, fields or other secondary damage. Shared extra-plate cap applies.
- **Physics:** normal player velocity/recoil, no passive glass shield or immunity. Monolith/Landlord phase/plate rules remain unchanged.
- **Phrase:** sharp internal point seats into the chamber → steady fine fracture communicates fragility → primary bonus contact gives one sharp local fracture notch. No constantly shedding shards.
- **Juice:** 0 idle/travel particles; at most 2 glass chips on an accepted bonus if contact budget remains. Actual death uses existing failure handling.
- **Proof:** stronger eligible primary, same boss, one-health death, no healing above cap. Oni/Sniper/Crown cannot turn stacked bonuses into an unbounded execute.

## 31. Grav Core — `grav` · **Keep: actual small-target pull**
- **See / infer:** visible purple spiral should bend nearby motion inward.
- **Power:** existing aim-only small-Fang pull within 220, current per-tick bound. No new score/resource substitute.
- **Physics:** actual eligible target displacement, existing walls/leash respected. Void/Time/Frost interactions must use capped force/status resolution, not multiplying every local dt/force independently.
- **Phrase:** spiral tightens during aim → 1–2 sparse inward tracers only on the affected target → relax on release. Boundary outline is faint and optional, not a huge vortex tunnel.
- **Juice:** at most **2 total moving flecks** for the field, not per target, no idle emission.
- **Proof:** real small-target displacement, large-target resistance, release, range/blockers. Player body is never attracted/teleported.

## 32. Magnet Dynamo — `magnet` · **Keep: close-range edge focusing**
- **See / infer:** observed two-pole red/blue chamber should visibly pinch/concentrate energy at close contact.
- **Power:** retain current +20% close-cut width within 100. The icon/short label becomes **CLOSE-CUT FIELD** so it does not promise long-range enemy attraction.
- **Physics:** broaden the actual primary close-contact envelope; no pulling enemies, stealing projectiles or extra damage. One resolved envelope with new Slash/Dash geometry.
- **Phrase:** poles close slightly as contact enters the real band → short broad edge seats at the contact → open back. No body scaling.
- **Juice:** 0 particles; at most one small field line. Dry magnetic latch mixed into the primary hit.
- **Proof:** near/far victim and capped width. If blind review still reads “pull” rather than “focus,” redesign the pole/field art or rename—not invent an unrelated extra perk.

## 33. Echo Heart — `echo` · **Keep: counted stationary memory**
- **See / infer:** pink chamber with concentric/offset form suggests a remembered attack.
- **Power:** current every-third-direct-chain-kill stationary ghost blade for 30 ticks, existing eligibility/hit-once rules.
- **Physics:** actual secondary attack source at its recorded location; no physical duplicate player or homing memory.
- **Phrase:** three internal count notches → one thin stationary blade outline → accepted secondary contact briefly brightens it → dissolves on expiry. Different contour from Echo Dash's traveled replay.
- **Juice:** **0–2** geometric fragments only at an actual ghost contact, no orbiting idle pixels.
- **Proof:** direct/secondary provenance, target once per source, full charge/reset and bounded coexistence with sword/Dash echoes. Do not silently drop promised attacks when cosmetic budgets fill.

# V. TAIL — motion follows the material, power follows the attachment

## 34. Ninja Ribbon — `ribbon` · **Keep: clean cloth baseline**
- **See / infer:** one lime folded ribbon follows movement; it is not a weapon.
- **Power / physics:** normal rebound/control, no extra force or hurtbox. Cloth lag is visual only.
- **Phrase:** knot seats → one bounded cloth bend under acceleration → small delayed fold after bank → settles. Never stretches into a scene-wide colored rope.
- **Juice:** 0 particles, no idle rustling or flutter loop at rest. At most shared cloth release accent.
- **Proof:** direction changes readable, face/active edge not hidden, no new hitbox or secret drag. The free tail feels polished without a perk invented to fill a card.

## 35. Prism Wings — `wings` · **Keep: one airborne wall recharge**
- **See / infer:** actual large layered crystal feathers catch a wall contact and reopen reserve.
- **Power:** current +1 EDGE on first side-wall contact per airborne streak; floor resets.
- **Physics:** no flight, hover or lift. Resource gain enables an ordinary legal launch.
- **Phrase:** ready inner feather lit → one flex along true contact normal → small refill notch joins EDGE → inner feather dark while spent. Floor rearms quietly.
- **Juice:** 0 routine particles; at most **2 facet chips** on accepted refill, one shared bank cue. No huge feather cloud.
- **Proof:** second airborne wall contact gives nothing; floor reset; full EDGE no-overfill. Needle Shell/Tide/world effects share one contact phrase.

## 36. Ghost Scarf — `ghost` · **Keep: lingering cutting window**
- **See / infer:** translucent pale scarf leaves a brief presence after the body passes.
- **Power:** current special +6 blade ticks; no repeated primary hit on the same victim.
- **Physics:** normal body motion; extra active time belongs to the resolved primary attack, not the scarf's cloth collider. Laser's explicitly shorter thrust must define whether/how Ghost extends it before enabling that combination.
- **Phrase:** author the advertised **two unequal folds** rather than recoloring one ribbon → thin local active-edge memory → folds return to quiet cloth when the hit window ends.
- **Juice:** 0 constant motes; **at most 2** dissolving points at active-window expiry, no drifting spectral fog.
- **Proof:** late eligible contact versus already-hit victim; harmless scarf after expiry; do not confuse it with Echo Core/Dash's separately damaging sources.

## 37. Viper Tails — `viper-tails` · **Replace speed score: directional retention**
- **See / infer:** twin taut red streamers behave like stabilizers during a committed redirection.
- **New power:** reduce the **ordinary direction-change speed loss by 15% of that loss** on legal relaunch. If normal retention is 0.85, target retention becomes 0.8725—not +15% speed. Never exceed incoming momentum or override a stronger bank/Hyper retention rule. Replace +10% speed score.
- **Physics:** actual launch-retention calculation changes; no auto-turn, free acceleration or steering after release.
- **Phrase:** strands fan in the old direction → tighten toward the new launch → relax. One stitch line aligns with accepted retention, not a perpetual glow.
- **Juice:** 0 particles. One short cloth tension snap, mixed with launch.
- **Proof:** zero incoming speed gives no bonus, forward continuation no invented gain, reversal correct, high-speed ceiling intact. Do not alter `CAMERA.lead` to fake smoothness.

## 38. Anchor Chain — `anchor` · **Keep: earned floor force**
- **See / infer:** linked heavy weight transfers force into the floor.
- **Power:** current +15% qualified floor rebound plus local Fang clear within 170, existing cooldown/eligibility.
- **Physics:** real existing floor impulse/attack; no global extra gravity, body rotation or new slam button. Chain's visible pendulum cannot write another impulse.
- **Phrase:** links lag → weight compresses at actual qualified floor event → one flat contact mark along floor → links settle. Side-wall touch does not play the slam.
- **Juice:** **2–4 grit chips**, low and outward, within 180ms. No radial rubble ring; existing halves/decals remain the result system.
- **Proof:** floor/corner classification, cooldown, outside-radius target, target exclusions and no lingering ground hazard after the contact mark fades.

## 39. Mini Thrusters — `thrusters` · **Keep: a short earned jet kick**
- **See / infer:** actual two small nozzles should fire short directed exhaust, not decorative permanent flames.
- **Power:** current +8% earned rail rebound, existing speed ceiling.
- **Physics:** existing qualified impulse only. No wall rubbing acceleration, hover or continuous thrust. Tide's tangent adjustment resolves with this once, not repeated after clamping.
- **Phrase:** nozzles telescope → 60–90ms paired exhaust at real bank → seat. Incoming dead particles keep their velocity; new exhaust follows actual outgoing direction.
- **Juice:** **2–4 hot flecks** only on accepted boost. No idle exhaust or trail longer than the travel owner already needs.
- **Proof:** invalid touch/cap has no false full-power burst; measured outgoing velocity matches direction/strength. Cooldown/repeated callbacks do not multiply.

## 40. Neon Spectrum — `spectrum` · **Replace chain grace: completed-sequence refill**
- **See / infer:** distinct colored ribbon segments suggest completing a sequence, not seven elemental damage types.
- **New power:** **three qualifying primary kills in one chain** complete three bands and return **one EDGE**, then start **120-tick source cooldown**. At most one stored sequence, no overflow queue; chain break clears incomplete progress. Replace +12 chain ticks.
- **Physics:** resources only, normal launch forces. No random element selection, extra damage or real rainbow projectiles.
- **Phrase:** one band seats per kill → completed bands briefly converge at the knot → shared EDGE notch fills → ribbon returns to subdued stripes. No permanent cycling hue.
- **Juice:** 0 per count; **up to 2 small band fragments** on accepted refill if not masked by the main kill cue. Shared sound, not three chimes.
- **Proof:** secondaries excluded, cap/cooldown, no count replay, simultaneous kills and chain reset. Echo Core's third-kill attack remains a different source/shape.

# VI. AIM MARK — meaningful instruments, not little weapon buffs

## 41. Field Reticle — `pointer-reticle` · **Keep: reliable free contact point**
- **See / infer:** four open ticks show exactly where the gesture began.
- **Power / physics:** free complete origin, power and cancel readout. No aim force, velocity bonus or inaccurate base tier.
- **Phrase:** press seats ticks in ≤60ms → tension responds to real pull → valid release opens/clears; canceled gesture contracts/clears without a fake shot.
- **Juice:** 0 particles, one engagement tick at most. No cursor trail or feedback listener causing another launch.
- **Proof:** touch capture loss, keyboard equivalents, canvas scaling/DPR and true drag origin. The target remains visible through the gap.

## 42. Prism Pointer — `pointer-diamond` · **Replace blade tick: geometric corridor**
- **See / infer:** nested faceted diamonds are a measuring lens, not extra blade lifetime.
- **New power:** display the actual resolved **primary cutting-width envelope** over the available forecast during aim. Replace +1 blade tick. Conditional/unknown future margins are dashed, not shown as guaranteed hits.
- **Physics:** no damage, reach, target snapping or changed trajectory. Pure information calculated from the same attack profile.
- **Phrase:** facets unfold to two thin corridor edges → follow geometry immediately → fold shut on cancel/release. No animated slow reveal hiding retargeting.
- **Juice:** 0 particles; one quiet calibration click on equip. Keep lines faint enough to preserve red hazards and existing bracket semantics.
- **Proof:** Viper/Katana narrowness, Comic width, Laser's line, caps, obstacles and moving-target uncertainty. No paid predictive bounce or extra world simulation step.

## 43. Orbit Pointer — `pointer-orbit` · **Keep: recovery indicator**
- **See / infer:** broken arc/satellite returns into its notch as energy returns.
- **Power:** current +10% eligible passive FOCUS recovery, shared cap.
- **Physics:** pointer movement cannot generate FOCUS or influence body flight. No orbiting damaging satellite.
- **Phrase:** satellite follows true aim direction → on recovery it moves once toward a dock over 120ms → steady dock → undocks at drain. The FOCUS meter remains available off-touch.
- **Juice:** 0 particles, one quiet docking tick only on meaningful recovery entry. No endlessly spinning orb.
- **Proof:** identical recovery intervals, full cap, aim cancellation spam, mobile resting state and no idle audio/animation buildup.

## 44. Crosshair Pointer — `pointer-cross` · **Keep: stable aim efficiency**
- **See / infer:** four precision L-brackets signal controlled alignment.
- **Power:** current −8% aim drain, shared efficiency cap. Do not promise lock-on or precision damage.
- **Physics:** no direction snapping, auto-correction or momentum modification.
- **Phrase:** brackets contract at most 2px on press → hold still during aim → clear crisply on release. Actual power still has its own accurate readout.
- **Juice:** 0 particles, no target-acquired alarm. Tiny dry calibration click.
- **Proof:** lower actual cost with same input/trajectory, center gap readable, cap saturation and correct cancel state. Motion must not jitter with every sample update.

# VII. RADAR — hardware silhouette predicts the information layer

All radar tiers keep live truthful updates. A decorative sweep never delays contact
information. Shapes distinguish enemies/objectives, projectiles/areas and tells;
color alone is insufficient. No sensor changes enemy AI/physics just to make its
preview more dramatic.

## 45. Field Radar — `radar-base` · **Keep: accurate local map**
- **See / infer:** one circular receiver with one contact. Free instrument, not faulty equipment.
- **Power:** current nearby enemies/objectives; normal warnings remain available for free.
- **Physics:** reports actual state, no hidden enemy delay or speed change.
- **Phrase:** frame seats once → contacts enter/update/leave accurately → no constant sweeping glow.
- **Juice:** 0 particles, 0 border-crossing beeps. One equip tick.
- **Proof:** range boundary and destroyed target cleanup. Demo pairs world/map positions so the player understands scale and ownership.

## 46. Long-Range Array — `radar-1` · **Keep: wider antenna reach**
- **See / infer:** add two visibly extended receiver arms to its icon/hardware—not just a small “I.”
- **Power:** current 1.35× base range, no hazard/tell layers from higher tiers.
- **Physics:** same accurate current-world positions. Larger view compresses spacing, not physical distances.
- **Phrase:** antenna arms extend once → far contact outside dashed base ring becomes available → stable map.
- **Juice:** 0 particles; quiet array latch only. Range boundary doesn't keep pinging.
- **Proof:** contact inside base/upgrade/beyond upgrade; radius-versus-area copy correct, no inherited top-tier stale layers after switching.

## 47. Threat Array — `radar-2` · **Keep: separate danger channel**
- **See / infer:** receiver plus a square hazard notch/secondary channel. Observed orange dots need actual distinct projectile/area geometry.
- **Power:** current 1.70× base range and active hazards. No future tell prediction.
- **Physics:** active projectile dash follows actual heading, area outline follows actual danger lifetime. Newly frozen owner does not erase an already-emitted hazard.
- **Phrase:** hazard channel seats after contact layer → a new hazard gets one small outline emphasis → normal live tracking/clear.
- **Juice:** 0 particles, no full-radar pulse/siren. Shared danger sound outranks decoration.
- **Proof:** friendly/cosmetic fragment exclusion, overlap, cancellation and actual range. Meaningful tiny markers cannot be replaced by larger busy graphics.

## 48. Oracle Array — `radar-3` · **Keep: live tell and heading analysis**
- **See / infer:** full receiver with directional needle and one external tell arc, distinct from lower-tier silhouettes.
- **Power:** current 2.20× base range, active hazards, live windup and player heading. No future-AI omniscience.
- **Physics:** data follows V3/V4 actual freeze, daze, slow or interrupt. A paused/canceled tell must not show a decorative countdown progressing normally.
- **Phrase:** layers latch once → affected tell arc advances only with authoritative progress → clears immediately when canceled/resolved. Map itself does not rotate/pulse for flair.
- **Juice:** 0 particles. One small equip cue, no per-tick audio.
- **Proof:** live threat lifecycle, immobile heading, multiple targets, hidden tab and mobile density. Reuse Beacon's tell language without duplicating oversized arrows.

# VIII. FLIGHT PATH — improved analysis, never paid truthfulness

All tiers use the current-snapshot prediction and actual launch profile. Free is
not made inaccurate. No future moving-enemy guarantee, unsupported bounce forecast
or physical steering to force a wrong line to become true.

## 49. Field Trajectory — `trajectory-base` · **Keep: short honest forecast**
- **See / infer:** open origin, short dotted arc, no terminal analysis hardware.
- **Power:** current short path to first current solid, complete basic direction/power understanding.
- **Physics:** same equation/profile as actual launch, including relevant loadout forces in its horizon. Does not change motion.
- **Phrase:** line appears promptly → geometry updates immediately with input → clears on cancel. No long draw-on animation.
- **Juice:** 0 particles/audio per sample.
- **Proof:** actual flight agreement in shown interval, Halo/Volt conditions, obstacle clipping, no stale old line on rapid retarget.

## 50. Vector Lens — `trajectory-1` · **Keep: longer known horizon**
- **See / infer:** extended lens barrel/long arc in its unique icon.
- **Power:** current longer forecast with the same accuracy in overlapping intervals. No fabricated percentage if code uses sample/tick settings.
- **Physics:** reports actual curve, does not add launch range or speed. Stops at first current solid as before.
- **Phrase:** lens seats → dashed baseline endpoint highlights added horizon once → all samples update together.
- **Juice:** 0 particles; one equip click, no per-dot sounds.
- **Proof:** short versus extended horizon, early obstacle, current conditional motion and no inherited Impact/Oracle data after tier downgrade.

## 51. Impact Lens — `trajectory-2` · **Keep: first-impact timing**
- **See / infer:** lens, time notches and a distinct terminal bracket.
- **Power:** current longer path/time ticks/current-snapshot first-impact marker.
- **Physics:** no prediction after unsupported bounce; no fake collision when no hit exists within horizon. An enemy may move later.
- **Phrase:** terminal marker seats once when a real estimate exists → follows recalculation immediately → opens when there is no estimate.
- **Juice:** 0 particles; marker acquisition sound normally silent or strongly rate-limited. No flashing target-lock animation.
- **Proof:** actual units/timing, no-impact state, moving snapshots, Prism Pointer width overlay and authoritative clipping. No predicted splash/burn guaranteed merely because the line passes nearby.

## 52. Oracle Lens — `trajectory-3` · **Keep: longest explicit analysis**
- **See / infer:** split analysis lens, long curve, terminal bracket and speed slash in its icon. No tiny numerals required to recognize it.
- **Power:** current longest path, marker, speed/angle/estimated time; label estimate/current snapshot honestly.
- **Physics:** no future AI, homing or forecast beyond supported collisions. Volt's temporary boost needs real-profile sampling; Tide's post-bank change remains outside the unsupported bounce forecast.
- **Phrase:** instrument layers seat once → stable fixed-width numbers update at readable frequency while geometry stays current → clears on cancel.
- **Juice:** 0 particles, no digit clicks or analysis hum.
- **Proof:** value source agreement, conditional profiles, horizon/no-impact states, small-screen readability and no extra real-world physics steps for display.

# IX. WORLD — the environment must visibly explain its affinity

Worlds cannot be sold as arbitrary score multipliers hidden under a background.
The proposal below retains the existing collision/spawn layout but gives each
paid world **one visible surface/instrument affinity**. It remains one World slot,
not a new menu or random encounter system. Its actual current perk is explicitly
replaced where noted. Collision-safe rail paint/panel/instrument cues must make
the run modifier visible before activation; scenery alone never deals damage.

## 53. Twilight Undercut — `twilight` · **Keep: neutral reference stage**
- **See / infer:** muted plum industrial layers, no powered rail equipment. This is the finished baseline.
- **Power / physics:** current standard collision, spawns, forces/resources; no affinity bonus and no free-world penalty.
- **Phrase:** short local backdrop seat on selection, then stable scenery. Contact material contributes only under the foreground attack's shared cue.
- **Juice:** 0 extra ambient/affinity particles. Existing quiet environment details must not compete with meaningful attack debris.
- **Proof:** every elemental power remains legible without bloom; compare the same encounter under the same inputs. Changing world for a future run cannot leave another world's modifier attached.

## 54. Cyber Tokyo — `tokyo` · **Replace speed score: charged rail circuit**
- **See / infer:** actual blue skyline/neon wiring gains a restrained conductive stripe on the existing rail frame; not an invisible passive.
- **New power:** first accepted earned rail rebound per shot gets **+5% outgoing speed**, within the existing legal ceiling. Replace +8% speed score. Prototype combined **new** world/Tide/Thruster positive bank gain limit: **12%**, applied once, with existing kinetic/Hyper rules reviewed separately.
- **Physics:** real rebound change, no wind, auto-homing or speed from idle wall contact. Do not alter collision geometry or previously earned speed.
- **Phrase:** rail segment is visibly wired before contact → tiny current catch at actual bank → same segment settles; foreground nozzles/splash own the main motion.
- **Juice:** 0 extra particles; one short rail-line graphic, at most 100ms. No city strobe or constant electrical rain.
- **Proof:** valid/unearned contact, cap, same-shot repeat and unchanged danger colors. Show measured incoming/outgoing vectors in preview.

## 55. Blood Foundry — `foundry` · **Replace armor score: forge priming**
- **See / infer:** existing hot pipe/furnace scene gains a visible safe furnace-channel stripe on eligible rails. This primes a tool, not a damaging lava floor.
- **New power:** an earned rail rebound arms **one Forge charge for 45 ticks**. The next eligible primary nonboss armor contact consumes it for **+1 plate**, under the shared extra-plate cap. Replace +12% armor score; refresh one charge, never stack. Floor landing alone does not prime.
- **Physics:** real plate result; no player gravity/temperature simulation, automatic burn or environmental contact damage. Bosses/protected targets remain excluded and do not silently eat a paid charge.
- **Phrase:** channel receives the bank → one small heated notch appears on the active edge → actual armor hit consumes it → tool returns to normal. Don't overlay fire on every equipped attachment.
- **Juice:** 0 on charge, **up to 2** small metal pin-sparks within the shared contact. No furnace smoke curtain.
- **Proof:** expiry, no armor, excluded boss, duplicate bank, combined Glass/Crown cap. World geometry and spawn timing remain identical.

## 56. Manga Paper — `manga` · **Replace multi-cut score: panel continuation**
- **See / infer:** actual warm page and sparse ink panels frame consecutive actions as one sequence.
- **New power:** **+12 chain grace ticks after qualifying primary kills**, under the shared +36 cap. Replace +10% multi-cut score. No altered physical time or “pause the world” panel effect.
- **Physics:** real chain clock only; player/enemy motion and collisions stay normal.
- **Phrase:** one small cropped panel corner seats near the chain indicator on extension → remains a thin handoff notch only while relevant → clears at chain break. No new boxes around every enemy or whole-screen black/white flash.
- **Juice:** 0 particles. One shared chain/page-click at most; equipped Ears/Smug/Spectrum cannot each add another panel animation.
- **Proof:** late continuation and cap saturation, no secondary-proc chain extension, no physics stop. Hatching remains static/background only; red hazards and existing cut halves keep their normal readability.

## 57. Synthwave Grid — `synth` · **Keep recovery: visible charging grid**
- **See / infer:** actual perspective grid acts as a coherent low-key energy circuit, not a scrolling floor.
- **Power:** current +15% eligible passive FOCUS recovery under shared cap. This is a useful simple option; no rhythm minigame or automatic regen from a music beat.
- **Physics:** body motion/geometry unchanged. Resource amount follows actual dt/eligibility, never displayed pulses.
- **Phrase:** on meaningful recovery entry, **one** short grid segment aligns toward the resource inset → small charge-notch holds steady → clears at aim/full. Sunset/mountains stay quiet.
- **Juice:** 0 particles. No endless perspective motion, pulsing sky or constant synth loop.
- **Proof:** lower-to-full recovery comparison, aiming stops recovery, saturated builds show marginal value accurately. Notched/Orbit/Glitch combine to one resource response, not four inward particle streams.

## 58. Pro Void — `void` · **Replace boss score: recoil sink**
- **See / infer:** negative-space eclipse/boundaries absorb a heavy boss contact, not all nearby matter.
- **New power:** on the first surviving **Landlord/monolith primary armor contact per shot**, reduce the existing recoil component by **30%**. Replace +15% boss score. With Chamfer, use the stronger applicable recoil reduction, not their sum.
- **Physics:** preserve incoming earned momentum/ceiling; modify only the known armor shove component. No boss damage increase, phasing, projectile absorption or global gravity pull.
- **Phrase:** a small pale contact rim contracts inward with actual reduced recoil → settles in ≤140ms. Decorative distant eclipse stays distant; only equipped Void Dash creates a real local collapse field.
- **Juice:** 0 additional particles; one short dry low contact answer, not a bass drone or screen blackout.
- **Proof:** measured boss recoil versus neutral stage, ordinary enemy unaffected, no repeated payoff, dark character/hazards visible. Boss damage/phase rules are unchanged.

# X. Attack profiles: keep the power, cut the excess ornament

The V3 document has the full mechanics, collision and storyboard specification
for these **15** items. The following is the current V4 presentation contract;
use it instead of V3's larger decorative emission counts/lingering suggestions.
Gameplay projectiles/attack traces in this table are **not cosmetic particles**.

| Item | Readable power signature | V4 ornament allowance / stop rule |
| --- | --- | --- |
| Adaptive Dash — `dash-auto` | Neutral launch, no borrowed paid elemental powers | 0–2 neutral flecks; no literal fire/ice/void material disguise |
| Ink Dash — `dash-ink` | Broad brush nib / actual wider corridor | 2–4 dry fibers; 120ms taper, no drops/stain persisting on floor |
| Ember Dash — `dash-fire` | Contact ignition / real bounded burn | 3–5 launch/contact embers total; steady tiny burn seam, no continuous emitter |
| Volt Dash — `dash-lightning` | Rapid narrow lance / real relay arc | 1 connected arc + 0–2 pins; ≤100ms decorative crackle, no endless rail zigzags |
| Frost Dash — `dash-ice` | Facet contact / actual freeze or heavy slow | 2–4 chips on contact, steady status rim; 2 chips on actual thaw only if budget permits |
| Tide Dash — `dash-water` | Surface-flattened wave / actual push-bank flow | One crest + 2–4 droplets; no continuous ribbon, floor puddle, curtain or drips |
| Void Dash — `dash-void` | Small core within larger force radius / actual pull-pulse | Clear field boundary + at most 3 inward flecks; no dark fog or orbit tunnel |
| Echo Dash — `dash-echo` | One delayed **active** recorded stroke | One pending outline, one real replay; 0–2 dead fragments, no three opaque heroes |
| White Razor — `razor` | Clean actual reference edge | 2–3 contact chips, no lingering slash at idle |
| Katana Ink — `katana` | Long narrow real draw-cut | 2–4 brush flecks; dead seam clears in ≤150ms, no dripping ink |
| Neon Laser — `laser` | Straight actual thrust with real obstruction | Thin active core, 1–2 contact sparks; dead scar ≤150ms, no looping beam |
| Glitch Tear — `glitch-fx` | Attached plate fault / one delayed chip | Seam plus 2–3 rectangular fragments at real chip; no frame-wide offset/jitter |
| Gold Confetti — `confetti` | Primary kill → actual forward flechettes | Reserved damaging diamonds stay readable; 0–2 harmless curls, no celebration rain |
| Comic Impact — `comic` | Broad close hit / actual directional pressure | One asymmetric contact mark + 0–2 flat chips, no global shake/POW curtain |
| Pixel Shatter — `pixel` | Actual plate removal → side-ejected fragments | Active squares distinct; 1–3 tiny dead chips, no voxel shower |

No visual-quality setting reduces the number/damage/lifetime of a promised attack.
A gameplay state keeps its small readable marker for its true duration, even when
all optional decorative fragments are disabled. A brief contact accent is not a
replacement for showing a real field, projectile or frozen state.

# XI. Composition examples — how a fully equipped Cube stays readable

## Example A: Frost + Comic + Iron + Riot

**One contact transaction, not four explosions.**

1. Frost's crystal wedge communicates travel. No separate aura from every item.
2. Comic owns the broad contact mark/pressure direction; Frost uses a small rim
   on accepted cold targets, not another starburst.
3. If Iron is actually consumed, its plate compression takes priority over the
   successful-contact celebration. Damage/block result must remain unmistakable.
4. Riot updates one internal notch. If Drive starts, its 2–3 sparks are suppressed
   while the current contact accent is busy; the mechanical state still updates.
5. Decorative fragment total requested at contact ≤6. Status geometry stays even
   if all six cosmetic requests are dropped under the shared budget.

## Example B: Tide + Razor + Wings + Prism + Tokyo

1. Incoming droplets retain old momentum; a new wave lip follows the true bank.
2. Wings folds one feather and the HUD shows one actual EDGE gain if not full.
3. Prism's **two real damaging needles** are bright/solid and protected from the
   cosmetic quota; Tide gets at most 2 optional dead droplets here.
4. Tokyo's rail circuit catches light once; no second electric particle burst.
5. One bank cue combines accepted outcomes. Surface-normal/consequence must agree;
   no five separate camera bumps, resource labels or sound voices.

## Example C: Ember + Confetti + Lava + Gold

1. Ember owns launch flame silhouette, not a whole-body fire coat.
2. A qualifying primary kill may launch actual foil flechettes; they look sharp,
   straight and bright. Harmless foil curls look bent/dim.
3. Lava advances one crack/heat segment silently. It doesn't ignite an external
   aura while already-bright Ember flames indicate real target burn.
4. Gold's actual score contribution is part of one aggregate receipt. No coin
   shower; no suggestion that score equals shop credits.
5. On real later burn damage, one small target seam contraction suffices. No new
   flechette/Lava charge/primary chain proc from the secondary burn kill.

## Example D: quiet reconnaissance

Obsidian + Ears + Visor + Standard + Ribbon + Field Reticle + Oracle Radar.

- Quiet acquisition state uses a steady inset outline, not invisibility smoke.
- Ears pivot toward a single real closing bearing; Beacon is an alternative head,
  so there is no impossible same-slot pileup.
- Visor aligns once, Radar updates live symbols, Ribbon settles.
- **Zero ongoing ornamental particles.** The upgrade still feels strong because
  information and state are useful and precise. Strong does not always mean loud.

# XII. Ability contracts and stacking that the artwork must not hide

## One authoritative result

Each accepted activation contains run/shot/source/target/event identity, actual
state/value before and after, origin/normal and simulation tick. The renderer
reacts to that result. It cannot infer damage from a drawn chip or issue a new
power because an animation reached its bright frame.

- Keep player physics, target/AI/status physics and harmless particle motion
  separate. No `Body` writes in the art engine; custom enemies need their own
  collision-aware movement logic, not imagined dynamic Matter behavior.
- A timed effect uses simulation ticks. Pause/hidden tabs cannot create catch-up
  damage/refill spam on return. Disposal clears all source-owned state.
- Capture launch/charge/resource changes once, before rendering. Old profiles
  don't linger when changing an equipped item for the next run.
- No existing live run changes because a shop preview selected another part.

## New proposed cap policies

These are explicit design decisions to test, not claims about current code:

- **Extra plate damage:** new equipment bonuses from Oni/Glass/Sniper/Foundry
  plus Crown's extra plate contribute at most **+2 units beyond the applicable
  ordinary primary base** on one eligible nonboss contact. Damage order and
  existing sword/kinetic special cases must be reviewed separately. Do not cap a
  promised legacy boss/kinetic mechanic incidentally while adding this system.
- **Recoil reduction:** strongest applicable source, not additive. Chamfer 20%
  for eligible armor; Pro Void 30% for its boss case. Neither increases velocity
  above the collision-safe pre-shove value or strips banked speed.
- **New positive bank gains:** proposed 12% combined allowance for Tokyo/Tide/
  Thruster contributions, within legal ceilings; preserve unrelated established
  kinetic/Hyper semantics. Show marginal contribution when cap-limited.
- **Acquisition versus threat state:** Obsidian only affects **new** eligible Fang
  acquisition. Ears/Beacon/Radar report actual current state and never make a
  hostile forget an already-started attack.
- **Target time:** world/aim dt remains the base. Time applies a declared local
  0.8 factor; other power slow/freeze sources choose the strongest applicable
  local status, not their product. Expiry/immunity stay on world simulation time.
- **Resources:** no refill over maximum, no stored payout when full, no recursive
  refund on secondary kills. Multiple accepted refills use one stable ordering and
  one aggregate HUD response. Do not invent catch-up credit after the resource drains.
- **Current generic caps:** retained drain/recovery/chain effects still obey their
  declared shared caps. Remove old generic perks only as their replacement ships,
  with accurate readouts and migration notes.

## What to do when the visual inference fails

A blind reviewer seeing Magnet might still expect attraction rather than close-cut
focusing. That is a genuine design problem. Do not argue that a paragraph makes
it intuitive. Either strengthen the pole-to-edge focusing animation/icon/name, or
schedule a separately specified magnetic interaction. A rejected affordance is a
reason to iterate the design—not automatically add another hidden power.

# XIII. Prototype and review gates

## Gate 1 — three other-upgrade vertical slices

Build these before scaling 58 attachment performances:

1. **Notched Frame:** easiest material/verb change; real recovery, vents, zero
   particle emitter. Proves restraint and truthful resource demonstration.
2. **Segmented Frame:** actual stored/released momentum, visible plate compression,
   no particles. Proves force ownership without a glitter substitute.
3. **Hologram Wire:** narrow real phase interaction with one legal needle and all
   counterexamples. Proves power boundaries cannot be faked by transparency.

Use one known real gameplay fixture plus isolated preview recordings from the
same rules. No separate shop-only animation that always awards the power.

## Gate 2 — blind inference, not an essay contest

For each item, show short normal-speed clips with name/stat text hidden. Ask:
- What physical object/material is it?
- What changed because it activated?
- Where did the power act, and when did it end?
- Which visible thing was a real attack versus harmless debris?

Proposed starting criterion: 4/5 human reviewers correctly identify the main verb
and actual result for an item before acceptance. This is a target, **not a measured
result**. Test color-independent versions too. If they say “same dash but more
sparkles,” fail it. If they cannot find the player/threat, reduce it.

## Gate 3 — every item gets a positive and negative demonstration

- Primary proof: a real changed outcome, resource value, contact envelope, target
  status, force vector or information layer.
- Negative proof: out of range, wrong timing/target, spent, full resource, cap,
  immunity or resistant boss. It must not look like a successful proc.
- Free baselines demonstrate reliable normal behavior, not fake upgraded stats.
- Sensors use identical snapshot data, stronger tiers add information, not truth.
- Look/Works previews run only for the visible selected item. No 58 extra physics
  worlds, all-card idle effects or unreleased callbacks after close.

## Gate 4 — full-loadout restraint

Test representative combinations above plus worst-case legal builds. Record
foreground particle count, major cue overlap, simultaneous audio voices, status
readability and actual input latency. Global queues remain bounded and do not
replay old celebrations. Gameplay still works if every cosmetic particle is off.

## Gate 5 — regression and devices

Full tests and normal/Poki builds; purchase/equip/reload/retry; native touch,
keyboard, mouse; 960×540, 640×360, 390×844, 844×390; reduced motion/mute; pointer
capture loss; visibility/BFCache; unsupported/lost/restored GL; ownership and old
loadouts; memory after repeated run/shop resets.

Measure real 2GB Android and low-end Chromebook under concurrent **actual**
abilities/status/projectiles, not only an empty dash. Report frame-time percentiles,
GC and memory before/after. Never trade lower quality for less paid power, freeze
AI offscreen to hide cost, or claim locked 60 FPS from controlled-RAF screenshots.

# XIV. Delivery in chunks

1. **Freeze the current decision ledger:** V3 for 15 attack powers, V4 for 58 other
   items plus all restraint/stacking. Mark conflicting older rules superseded.
2. **Prototype Gate 1:** Notched, Segmented, Hologram, one at a time, before icon
   production. Mechanics tests first; no wholesale unreviewed physics rewrite.
3. **Shared restrained feedback:** cancellable press/select/transaction controller,
   explicit success/failure hooks, sound priority limiter, reduced-motion poses.
4. **Family batches:** head/eyes → shells/cores → tails → instruments → worlds.
   Separate retained-rule art from new-rule rollout; small reviewable patches.
5. **Attack integration:** implement/prove V3 powers with V4 ornament limits. Existing
   halves/decals, camera lead, physics stepping and continuous-mode flow stay intact.
6. **73 icon set and final copy:** author icons from approved actual silhouettes
   and power verbs, not ahead of unstable mechanics. Check 20px monochrome and
   real card context. Names/accessibility labels survive decorative icon removal.
7. **Balance, saves, qualification:** compare old/new choices, update receipts and
   prices only deliberately, preserve ownership/challenges/credits, profile devices.

**Done is not "all items sparkle." Done is "you can read what this upgrade does,
feel a real difference when it matters, and still see the next thing you must do."**
