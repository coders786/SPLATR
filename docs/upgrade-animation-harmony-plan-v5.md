# SPLATR V5 — Full harmony: one build, not eleven effects

> **Historical planning draft.** Superseded by the single
> [unified upgrade harmony and implementation blueprint](unified-upgrade-harmony-implementation-plan.md).
> The unified document includes the item powers, composition rules, per-item
> implementation/tests and explicit combined-profile decisions. References to
> authority below describe this older draft, not the current implementation plan.

**Planning only. No new animation, particle behavior, rule resolver or power has
been implemented by this specification.**

V3 specifies the proposed 15 attack powers. V4 specifies the proposed other 58
item powers and restraint limits. **V5 is the composition contract over both:**
how those parts change one another's animation, mounting, particles, timing,
lighting, audio and explanation when a single item is swapped.

V5 does not silently add damage multipliers or unlock elemental powers through a
palette choice. Harmony is a visible relationship first. Existing functional
Apex sword profiles remain actual mechanics, resolved explicitly and preserved.

# 1. The goal

> Any legal loadout should look assembled for one purpose. Changing one part
> should create a specific, understandable difference in that assembly—not just
> attach another independent animation on top.

A shell can change how a head is mounted. A core can change how energy travels
through the weapon and tail. A weapon finish can change how a real contact breaks
up. A world can change the surface light and response at its rails. A sensor can
change how an actual power is explained during aim. None of these relationships
requires another particle emitter or a secret stat increase.

**Harmony is not uniformity:** every part must retain its own recognizable shape,
material and advertised ability. A lava shell does not turn an explicitly selected
Frost Dash into fire. A Time core does not freeze everything that looks crystalline.
A gold world reflection does not make a paper scarf into a damaging metal weapon.

# 2. Architecture facts checked in this checkout

- `resolveVisualHarmony` already shares core hues and world rims and mixes body
  material into trim. `materialMount` has Hologram/Iron-specific mounting.
- `resolveCharacterPerformance` supplies shared charge/release/recovery cues.
- `resolveUpgradeConstruction` chooses a broad material using spectral/furnace/
  metal/crystal/paper precedence. This can erase a lower-priority material instead
  of composing its specific layer.
- `activeSparks` returns every matching two-part Spark; current Spark drawing can
  add multiple fitted marks. That is not yet an event-owned, budgeted hierarchy.
- There are **18 Sparks and 17 Apex recipes**. Some Apex profiles have real reach,
  width, timing, armor, delayed attacks or charged pulses through `swords.js`.
- Art's `activeHybrid` picks the first complete recipe. `swordProfile` chooses the
  most specific, with catalogue order as tie-break. Recipe-union checks found four
  concrete disagreement fixtures: Phantom/Arcade, Phantom/Wraith, Reaper/Arcade,
  and Briar/Glass Shogun. These are representative fixtures, not proof that only
  four full loadouts can disagree.
- Current slot counts yield **663,828,480 syntactically valid full combinations**
  before ownership/unlock constraints, and **2,402 distinct cross-slot item pairs**.
  Hand-authoring an animation for every loadout is neither necessary nor testable.

The solution is a small deterministic composition grammar, explicit meaningful
pair integrations and a shared authoritative family result—not 663 million clips.

# 3. Three levels of harmony

## Level A — universal construction

Applies to every legal mix, even without a named recipe:
- Attachment roots use the selected shell's mounting/material construction.
- One shared body action envelope drives mounted parts, each with its own lag/
  rigidity response. Never eleven unrelated bounce/sine clocks.
- Core circuitry connects through supported sockets to equipped powered parts.
- Element identity is preserved; core/world lighting occupies secondary channels.
- Each event gets one composed contact response and one sound phrase.

## Level B — relational integration

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

## Level C — resolved family integration

A completed Apex gives one selected whole-build construction language and the
existing corresponding functional sword profile. Sparks can supply small local
connections inside it, not fight it with competing titles, giant halos or auras.
A named build is a curated expression of the same universal grammar, not a second
renderer ignoring every non-recipe slot.

# 4. Ownership: which item is allowed to change what?

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

# 5. Resolution order and explainability

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

# 6. The three kinds of change caused by one item swap

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

# 7. Material harmony without losing attack identity

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

# 8. Color harmony and contrast

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

# 9. Shared choreography, separate state clocks

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

# 10. Core × explicit Dash: 49 treatments, no hidden extra powers

Each cell states a **secondary presentation treatment**. Apply only on that core's
real relevant event/state; otherwise use its quiet socket styling. The Dash keeps
its V3/V4 power, range, hitbox, status and primary material. This is not 49 new attacks.

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

# 11. Dash × Slash: all 56 combinations by semantic rule

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

# 12. All 73 items: what one swap changes in the whole build

Each row specifies an **outward harmony contribution**, not another passive
power. Functional eligibility comes from V3/V4 and actual rules. “Reaction” is a
request into the shared choreography, not a new independent animation/emitter.
Default parts contribute a deliberate neutral construction rather than nothing.

## Head: 9

| Item ID | Local identity / motion | Outward contribution and accepted-event link | Must not overwrite |
| --- | --- | --- | --- |
| `none` | Clean brow, direct expression | Clears head sockets/effects; preserves uncluttered weapon/core read | No stealth stat, no reduction in free input clarity |
| `halo` | Ring levels on actual supported fall | Head socket aligns with core inset; cloth/embers inherit actual changed body velocity | No world time slow or new particle gravity outside real motion |
| `neko` | Ears track one accepted hearing bearing | Eye gaze may acknowledge that bearing when no active input takes priority; matching tiny Radar bearing style if equipped | Cannot turn aim, invent map contacts or add a detection aura |
| `viper` | Rigid narrow forward horns | Shared release stretches along actual velocity; tail tension and world-spaced particle gaps reflect real speed | No hidden second speed multiplier or wider Slash |
| `oni` | One-health crack lights; bonus contact pulses | Core-to-head seam routes the accepted last-stand event; shared plate mark shows capped bonus | No red flame coat, free heal or duplicate damage cue |
| `crown` | Heavy jewel seat and plate count response | Shell mount becomes load-bearing visually; one shared metallic contact answer | Cannot add player mass or repaint every particle gold |
| `samurai` | Tips align with true horizontal band | Pointer corridor/weapon leading edge show actual resolved eligible width | No angle snap, bracket-role recolor or decorative fake coverage |
| `coil` | Terminal bridge and real relay | Conductive fitted routes connect core/head; secondary arc uses true victims and shared Volt source limits | No relay from decorative sparks or every Prism needle by default |
| `beacon` | Lamp turns toward accepted windup | Same tell icon/phase as Radar; input gaze wins over decorative head direction | No delayed enemy attack, duplicate large warning or global amber wash |

## Eyes: 7

| Item ID | Local identity / motion | Outward contribution and accepted-event link | Must not overwrite |
| --- | --- | --- | --- |
| `ninja` | Sharp baseline gaze/blink | Keeps face as stable focal point; all energy routing avoids eye cuts | No extra shimmer required to look complete |
| `visor` | One calibration sweep then still | Core/pointer calibration notch can align on real aim entry; resource receipt aggregates | No target lock, continuous mesh scan or extra time slowdown |
| `blaze` | Brief hot opening at actual Drive entry | Reactor/EDGE response composes into one ignition; Dash retains its own material | No Ember burn from eyes, continuous fire plume or extra Drive duration |
| `glitch` | Broken glyph reseats on actual recovery | Hologram/Notched routes use the same recovery event with stepped line art instead of extra pixels | No skipped physics/display frames, random hitbox jumps or FOCUS farming |
| `smug` | One calm eyelid response after qualifying kill | Chain notch shared with other grace sources, not multiple floating link effects | No hidden stun, target taunt or unlisted damage |
| `hypno` | Spirals converge and accepted daze gets one marker | Sensor tell display reflects the true deferred initiation; Time uses distinct clock glyph | No global spiral overlay, continuous beam or extra AI control |
| `sniper` | Real-power sight calibration | Pointer/weapon share accurate eligibility and narrow envelope; primary plate accent merges | No guaranteed hit, homing, extra beam or second geometry resolver |

## Shell: 10

| Item ID | Local identity / motion | Outward contribution and accepted-event link | Must not overwrite |
| --- | --- | --- | --- |
| `paper` | Folded faces, brief crease flex | Folded mounts on horns/nozzles/weapon; optional matte substrate fiber | Attack-native fire/water/foil is not replaced by paper |
| `obsidian` | Keylined matte facets and Quiet state | Recessed sockets, muted nonsemantic trim; sensor still displays real acquired threats | No invisible player, dim danger, canceled tells or disappearing attacks |
| `hologram` | Vertex cage and one real phase gate | Projected head/tail brackets; core chamber transmitted; phase cell explains eligible needle pass | Cannot make active attacks ghostly/harmless-looking or phase walls |
| `prism` | Faceted shell with two needle-ready notches | Crystal mount collars; real two needles remain distinct from ornament; core route through facets | No random refraction projectiles or automatic multi-element split |
| `iron` | Bolted plate and one spent guard | Rigid attachment roots; accepted guard/armor contact gives compact compression, optional metal substrate chip | No universal extra mass, metallic water, extra guard charge or double burst |
| `lava` | Chargeable internal crack network | Actual stored heat routes toward accepting primary edge; Anchor's weight uses a thermal fitted seam | No permanent external burn aura, early heat damage or fire conversion of Frost |
| `gold` | Folded gold planes and one accepted score glint | Foil edging on compatible mounts; score response folds into shared receipt | No active flechettes from shell, gold rain or coin/score confusion |
| `chamfer` | Beveled contour and glancing contact line | Mount corners inherit bevel; actual reduced recoil feeds shared contact/body response | No physical octagonal collider, ghost blade duration or reflected hazards |
| `notched` | Recessed vent gates | Cooling routes core/Orbit/Glitch through one recovery notch; small open socket channels | No jet force, smoke system or four separate recovery emitters |
| `segmented` | Interlocking plates and stored compression | Head/tail roots follow the same real charged plate displacement; next launch releases once | No extra whole-body squash, invented momentum or endless ratchet sound |

## Core: 7

| Item ID | Local identity / motion | Outward contribution and accepted-event link | Must not overwrite |
| --- | --- | --- | --- |
| `standard` | Balanced chamber | Neutral small energy routes; clean mounts, shared accepted resource return | Free kit must not look disconnected or incomplete |
| `time` | Crystal calibration and actual local lens | Clock notches on powered roots, Halo alignment; target tell instruments follow actual local progression | No automatic slowing of attacks/particles/status expiry or cooler fake Fire |
| `riot` | Four-step real ignition | Short core-to-powered-part route at Drive entry; one combined Blaze/resource phrase | No independent idle flames, second speed boost or every-part explosion |
| `glass` | Fine fractured point, real fragility | Thin keyed fracture in supported collars; accepted bonus contact gets one crisp edge response | Does not transform all particles into damaging glass, provide shield or add hits |
| `grav` | Spiral active only with real pull | Inward core/socket routing; actual affected target has tiny sparse tether; Void field stays separate | No cosmetic idle vortex, fake projectile bending or duplicated force |
| `magnet` | Two poles focus eligible close edge | Paired conductor trim on weapon/Coil/Wing roots; actual close-cut width visible in aim | No long-range pull, free second zap or extra refill |
| `echo` | Three-count chamber and stationary blade | Thin offset source contour, discrete count pattern on supported hardware; distinguish all echo source IDs | No extra damaging clone/replay from a trim effect or particle remnant |

## Tail: 7

| Item ID | Local identity / motion | Outward contribution and accepted-event link | Must not overwrite |
| --- | --- | --- | --- |
| `ribbon` | One short damped cloth fold | Reads body acceleration and one bank follow-through with selected shell knot/mount | Cannot extend into live blade silhouette or impose real drag |
| `wings` | Feathers flex once on accepted refill | Core/root readiness mark and EDGE receipt synchronize; paired Beacon tell shape stays separate | No actual lift, refill from every feather or extra light ring |
| `ghost` | Twin unequal translucent folds | Actual longer active edge gets a restrained contour, supported endpoint residue may dissolve thinly | Never adds an unsourced hit or hides active projectile boundaries |
| `viper-tails` | Two taut stabilizing strands | Relauch tension follows real retained direction/speed; source spacing reflects actual momentum | No target homing, free acceleration, poisonous flame or camera-lead change |
| `anchor` | Linked weight follows then floor compresses | Shell-specific weight collar; actual floor-force origin owns one low contact mark | No second floor impulse, new gravity, tail-wide damage collider or rubble spray |
| `thrusters` | Nozzles telescope on real earned boost | Shared root uses shell material, core conduit seats at actual bank; one short exhaust | No permanent flame trail, idle thrust or repeated cap multiplication |
| `spectrum` | Three stateful band groups | Core/EDGE grant uses one completion route; Notched vent line may carry matching bands briefly | No random elemental power, rainbow recolor of every attack or constant hue cycling |

## Dash: 8

| Item ID | Local identity / motion | Outward contribution and accepted-event link | Must not overwrite |
| --- | --- | --- | --- |
| `dash-auto` | Neutral explicit-power-free launch | Picks supported core accent on neutral geometry; mounts/finish still compose | Cannot impersonate a literal bought elemental power |
| `dash-ink` | Broad brush travel | Slash contact joins the same traveled stroke where compatible; shell affects only root/substrate | No ink hazard, endless stain or all-body paper recolor |
| `dash-fire` | Ignition, short embers, real burn | Powered seams can acknowledge real heat; burn status/contact source remains distinct from Lava charge | No extra ignition from core color, continuous ember hose or recursive burn |
| `dash-lightning` | Actual burst speed, one relay | Viper/tail motion follows real burst; Coil connection shares conduction ledger/cue | No two relay hits on one victim or lost bank speed during boost removal |
| `dash-ice` | Forward facet and real cold state | Crystal contact skin fits Slash shape; sensors show actual freeze/thaw/tell state | Cannot turn every core/feather into an ice projectile or stack time multipliers |
| `dash-water` | One directional crest, actual push/bank | Incoming drops/outgoing wave preserve real vectors; Thruster/World use one bank phrase | No second fake splash, permanent wet floor or free conductivity damage |
| `dash-void` | Force boundary, smaller pulse core | Grav/source trim differentiates continuous aim pull from contact field; victims show actual force | No camera tunnel, whole-scene blackout or larger hidden pulse |
| `dash-echo` | One real delayed recorded stroke | Core/sword echo contours differentiated; tail/finish residue remains subordinate | No decorative clone hitbox, moving replay source or dropped promised attacks |

## Slash: 7

| Item ID | Local identity / motion | Outward contribution and accepted-event link | Must not overwrite |
| --- | --- | --- | --- |
| `razor` | Crisp true reference edge | Clean material contact lets Dash consequence speak; baseline weapon hardware still material-fitted | No weak/inaccurate free hitbox or duplicate finish aura |
| `katana` | Long/narrow draw-cut | Root wrapping uses shell; element sits on true leading region; sparse native brush breakup | No huge crescent hiding narrow geometry or paper particles replacing every element |
| `laser` | Straight actual line thrust | Hardware emitter remains fitted to sword family; element colors only permitted edge/collar | No old active arc, fake penetration, doubled source or harmful dead scar |
| `glitch-fx` | One attached delayed fault | Hologram/Glitch integrate a clean fitted seam; accepted delayed chip owns its pulse | No global distortion, duplicate delay timers or extra primary contacts |
| `confetti` | Reserved active foil fan after primary kill | Core/world light catches active facets; harmless foil distinguished; shared kill event budgets | No endless celebratory rain or secondary-proc flechette recursion |
| `comic` | Broad close pressure contact | Dash material shapes one contact lip; push direction uses actual normal | No doubled starburst/splash, global hitstop or implied pressure damage |
| `pixel` | Real plate-removal fragments | Echo/Glitch can alter harmless terminal outline treatment; active squares remain solid and readable | No collision quantization, extra damaging chips from art or secondary recursion |

## Pointer: 4

| Item ID | Local identity / motion | Outward contribution and accepted-event link | Must not overwrite |
| --- | --- | --- | --- |
| `pointer-reticle` | Accurate free origin/power/cancel | Shared calibration language with actual weapon, no ornamental ripple | Cannot hide required control information behind purchases |
| `pointer-diamond` | Real current cutting-width corridor | Samples composed sword/head/Dash/Slash geometry; conditional margins dashed | No invented future hits, body width change or second simulator |
| `pointer-orbit` | Recovery satellite docks once | Notched/Glitch/World share one accepted recovery phrase; shell/core style its instrument housing | No orbiting damaging object or refill by dragging in circles |
| `pointer-cross` | Stable calibrated brackets | Visor/Sniper eligibility expressed with one small notch while true power stays separate | No target snap, guaranteed-hit alarm or duplicate floating crosshairs |

## Radar: 4

| Item ID | Local identity / motion | Outward contribution and accepted-event link | Must not overwrite |
| --- | --- | --- | --- |
| `radar-base` | Truthful local contacts | Actual target movement/status changes update existing symbols without delay | No fake scan latency, cosmetic-particle contacts or changed AI |
| `radar-1` | Extended receiver/range | Longer-range hardware/preview ring fits World contrast and current contact scale | No extra hazard/tell data from visual family alone |
| `radar-2` | Separate active danger channel | Real needles/flechettes/hazards use correct ownership/marker type; friendly attacks don't become threats | No conflating chips with hostile projectiles or future tell prediction |
| `radar-3` | Actual tell arcs and heading | Beacon/Ears/Hypno/Time/Frost report one consistent authoritative state | No advancing fake tells on frozen target, omniscience or full-map flash |

## Trajectory: 4

| Item ID | Local identity / motion | Outward contribution and accepted-event link | Must not overwrite |
| --- | --- | --- | --- |
| `trajectory-base` | Short accurate forecast | Actual composed launch/known forces sampled in its real horizon | No paid accuracy, extra steering or unsupported bounce line |
| `trajectory-1` | Longer truthful horizon | Same profile/snapshot as Pointer corridor; source-specific conditional boundaries explained | No longer physical dash merely because display is longer |
| `trajectory-2` | Current impact and time ticks | Accepted estimate reads composed geometry/solids, with uncertainty for moving enemies | No guaranteed secondary splash/echo victim or fake terminal impact |
| `trajectory-3` | Longest current analysis | Exposes actual resolved speed/angle/time; predicts only supported known horizon | No changing physics to satisfy display or future-AI/bounce guarantee |

## World: 6

| Item ID | Local identity / motion | Outward contribution and accepted-event link | Must not overwrite |
| --- | --- | --- | --- |
| `twilight` | Quiet neutral industrial stage | Neutral rim/contact contrast, no extra stage power or ambient emitter | Free kit readability, status colors and baseline physics |
| `tokyo` | Visible charged rail circuit | Actual accepted World bank contribution shares current line with hardware/body response | No city strobe, random wind or duplicate jet/electric burst |
| `foundry` | Visible forge-prime channel | Actual Forge charge gets one hot tool notch; Lava/Ember heat sources remain individually legible | No permanent flame tint, hot floor damage or extra hidden plate multiplication |
| `manga` | Quiet paper panel stage | Real chain handoff gets one cropped UI/panel notch; Ink/Comic use existing ink context | No full-screen flash, time pause, wall of speed lines or damage from hatching |
| `synth` | Static charging grid | Actual recovery source contributes one aligned grid/resource mark, no extra inward particle stream | No music-beat FOCUS, scrolling floor physics or constant sunset pulse |
| `void` | Keylined negative-space boss stage | Real recoil-sink contact uses short inward rim; active Void field stays a separate local object | No background gravitational damage, hidden hazards or black-on-black player |

# 13. Cross-slot influence matrix

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

# 14. All 18 Sparks: integrations, not extra emitters

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

# 15. All 17 Apex families: construction + truthful action

The selected family comes from the existing **most-specific, catalogue-tied
functional sword selection**. It is not the first artistic match. Every other
completed recipe can remain listed as a discovery, but may not contribute a
second sword mesh, secondary attack or competing family aura.

These are choreography requirements around existing sword parameters, not
newly tuned parameters. Snapshot live values from `swordProfile`/effective rules;
do not duplicate the following numbers in rendering code. V3/V4 proposals can
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
- Important precedence case: proposed Laser's six-tick damage gate and straight
  geometry must be resolved with the longer sword window before drawing. Show
  exact active line, then a clearly dead fitted afterimage only if budget permits.
- Decide and test the authoritative rule in the attack-clock slice; never show
  twenty harmful-looking laser ticks because the family has a long base window.

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

# 16. Conflicts must resolve in mechanics before animation

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
| Oni + Glass + Sniper + Foundry + Crown | Apply V4 combined extra-plate cap, preserve source explanations and separately reviewed legacy sword/kinetic contributions | One plate-contact phrase and aggregate receipt, not five bursts |
| Tokyo + Tide + Thrusters + Viper Tails | Apply actual additive/multiplicative ordering and V4 bank cap; retention is not another speed grant; Hyper stays separately governed | Single release/boost packet whose spacing follows final actual speed |
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
behavior unless a V3/V4 replacement explicitly changes it.

A profile needs distinct start tick, total active window, Laser gate, delayed
source delay and harmless residue age. Current slash progress derived from
`1 - min(1, s.blade / 12)` stays at zero when blade ticks exceed twelve. Audit this
before promising long-window choreography. Fixing presentation progress must not
shorten a Reaper's actual window or extend a Laser's real harmful phase.

For counters, use actual qualifying hits/kills, not the number of visual contacts.
A direct hit that removes multiple plates is not several pulse-charge events
unless its rule explicitly says so. The event adapter must preserve collision
shot dedup, armor grace, boss resistance, source caps and existing credit awards.

# 17. One event, one composed response

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

# 18. Particle and motion budget: replace, then omit

V4's proposed harmless foreground caps remain the ceiling: **48 Standard / 24
Low**, at most **8 births per simulation tick** globally, each individual ordinary
response **0–6**, default decorative age **100–180ms**, strongest local accent
**≤250ms**. UI feedback gets at most **4** harmless particles and shares the global
foreground allowance if visible over gameplay; never treat it as a second
unlimited pool. At most **two large local contact accents**. No idle emissions,
drips, stains, endless ribbons or delayed particle debt.

These are proposed V4/V5 limits, not claims about the current implementation's
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

# 19. Single-swap review: visible changes and deliberate invariants

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

# 20. Aim, shop, icons, interaction and sound must agree

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

# 21. Verification: prove the swap, not just the screenshot

## Automated contracts to add during implementation

1. **Catalogue:** all73 IDs resolve; defaults are complete; unknown IDs use existing
   normalization. All18 Sparks and17 Apex recipes compile without missing sockets.
2. **Pair sweep:** enumerate all2,402 cross-slot pairs in a baseline loadout;
   assert finite valid descriptors, deterministic precedence and budget ownership.
   This proves structural compatibility, not artistic quality by itself.
3. **Family selection:** all17 exact recipes plus all compatible recipe unions
   agree with functional sword selection. Include the four known disagreements
   as named regression fixtures; test specificity and equal-length catalogue ties.
4. **Swap locality:** each of the73 catalogue choices from a baseline plus curated
   recipe-edge transitions. Sensor swaps cannot change combat snapshots; known
   family-breaking swaps must change the correct sword and remove old routes.
5. **Attack grid:** all8 Dash ×7 Slash combinations; each with7 cores gives392
   semantic combinations. Include every shell as construction tests; sample head/
   tail/world variations with meaningful event fixtures, not a false exhaustive
   claim over663 million builds.
6. **Geometry/timing:** Pointer/Trajectory/gameplay read the same profile; narrow
   rapier+Laser, long-window Reaper+Laser, Samurai angle boundary, Sniper power
   threshold, wall obstruction, boss resistance, armor grace and shot dedup.
7. **Event provenance:** no secondary-to-primary escalation, replay/field/relay/
   fragment recursion, fragment charge farming, repeat kill receipts or resource
   overflow. Real status expiry unaffected by lens/presentation slowdowns.
8. **Budgets:** worst mixed builds at saturation; ≤48/24 harmless foreground,
   ≤8 births/tick, individual≤6, UI≤4, ≤2 large accents; actual sources never
   dropped to satisfy cosmetics. No persistent growing queues/allocations.
9. **Lifecycle:** repeat equip/unequip, preview open/close, restart, pause/hidden/
   resume, resize and quality changes. Counts return to baseline, no stale routes,
   listeners, timers or double purchase acknowledgements.
10. **Compatibility:** saves/owned items/credits/prices/presets unchanged; planned
    replacement powers only replace legacy benefits in their approved slices.

## Visual review board

Capture deterministic current/proposed comparisons for each swap fixture in§19:
idle, prepare, release, first contact, active aftermath, recovered. Review both
isolated and crowded situations at small play scale, portrait/landscape and
Low/Standard, grayscale/color-vision checks and reduced motion.

For every clip ask:
- Can a viewer identify the changed item without the label?
- Does the new part visibly connect to the existing construction?
- Can they distinguish active attacks/status from dead decoration?
- Did any unchanged part lose identity or imply a new power?
- Does the strongest instant show one readable action, not a pile of overlays?
- Is the screen quiet again within the decorative lifetime bound?

A screenshot alone cannot prove force, active timing, delayed-source correctness,
resource eligibility or absence of emitter leaks. Pair visuals with event logs,
profile snapshots, counts and gameplay regressions. Desktop/software-GPU QA is
not proof of mobile FPS; measure actual target devices before performance claims.

# 22. Chunked implementation sequence

**Each chunk is separately reviewable. This document implements none of them.**

### Chunk 1 — Shared identity and baseline fixtures
Audit/source-lock the current recipes, sword selection, clocks and accepted-event
paths. Add shared selected-family descriptor while preserving functional sword
priority; migrate art labels/preview to it. Keep discovery list separate. Tests:
all recipes/unions, four mismatch regressions, saves and existing combat suite.
Deliverable: one truthful family in shop, aim and play, without new effects.

### Chunk 2 — Universal construction and action ownership
Implement per-surface material/mount sockets and shared action envelope; remove
broad material precedence only where replacement coverage exists. Start Paper/
Iron/Hologram × Ribbon/Thrusters × Standard/Time. Verify one swap changes root/
response rather than every particle; no independent body squash. Expand to all
shells/attachments before claiming universal coverage.

### Chunk 3 — Accepted-event compositor and hard budgets
Wrap/migrate current emitters into semantic classes; source-tag accepted attacks,
merge cosmetic requests, enforce scene limits and lifecycle cleanup. Preserve
actual gameplay sources and their caps. No new emitter until old sources are
accounted for. Add overlay counts/debug provenance and saturation regressions.

### Chunk 4 — Attack harmony, one small batch at a time
First **Frost + Katana/Comic + Iron**, then **Volt + Laser/Coil**, then **Tide +
Comic/Thrusters**; each batch delivers source behavior, geometry, preview,
particles and source-specific tests together. Implement remaining Dash/Slash
semantics in bounded subsequent batches. V3/V4 mechanics must ship explicitly,
not silently as a side effect of palette composition.

### Chunk 5 — Core routing, local contributions and all Sparks
Add7 core route grammars and the49 explicit-Dash treatments. Integrate18 Sparks
in groups: mount/clock; resource/conductor; heat/fault/fracture. Include all73
contribution rows and directed-slot contract tests. Replace generic cues rather
than accumulate. Review overlapping Spark fixtures before the next group.

### Chunk 6 — Curated Apex choreography
Implement17 profiles grouped by the six existing sword families: rapier,
breaker, reaper, cleaver, echo, pulse. Standard remains complete. Existing variant
values/secondary rules stay authoritative. Review multi-Echo and capacitor source
readability before adding any ornamental family detail.

### Chunk 7 — Instruments, worlds and interaction parity
Use shared snapshots in Pointer/Trajectory/Radar and every preview. Add world
rim/contact adapters, unique icon interactions, honest swap receipts, bounded
sound, reduced motion and Low detail. No quest UI, new mode ceremony or duplicated
shop. Do not change CAMERA.lead or unrelated wave logic.

### Chunk 8 — Full compatibility and device sign-off
Run whole catalogue/pair/core-attack grid plus curated gameplay/replay/lifecycle
coverage. Review clips and actual device traces. Fix overflow by removing weak
ornament, not hiding useful state or skipping physics. Build/test results must
be reported as actually measured, with pending work named.

# 23. Final acceptance contract

**A successful harmony implementation is not “everything glows the core color.”**

It is:
- One readable assembly, made from recognizable purchased parts.
- One shared action with local material response.
- One truthful geometry/timing/source model in gameplay and preview.
- Native attack particles selectively transformed, not multiplied.
- One selected functional/visual Apex; all valid discoveries still recognized.
- A single swap that has specific visible consequences—and clear invariants.
- Quiet idle, short meaningful action and bounded aftermath.

When a proposed connection cannot explain **what changed, who owns it, which real
event enables it, what it replaces and what must remain unchanged**, do not ship
that connection. Leave the simpler coherent result.
