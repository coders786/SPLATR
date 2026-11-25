> **2026-11-24 functional shop update:** formerly style-only purchases now have
> perks in `src/part-perks.js`. The Works receipts below are updated; appearance
> descriptions remain visual evidence, not gameplay promises. See `functional-shop.md`.

# Shop inventory: visuals, effects and harmony

Source audit of the current 73-item catalogue and render/gameplay code. This describes implementation, not a promise that every combination has been manually viewed or playtested. The player can equip one item per slot; different-slot rules coexist, subject to each effect's conditions and caps. Slot alternatives cannot be equipped together. Prices and unlock requirements are shown in the Shop; buying and equipping are separate.

**Reading motion:** “time-based” means the renderer samples a clock; “event-driven” means an action or game state causes a visible change. Static parts still move with the character. Shop stories are illustrative 1.5-second demonstrations, not live miniature physics. Reduced-motion Shop previews use a fixed illustrative frame, and many in-game effects are reduced or suppressed; this does not freeze physics. Small render sizes can omit fine detail. Audio descriptions apply only when sound is enabled.

**Shared harmony:** cores set an energy palette used by details on shells, heads, tails and effects; world/material influence selected rims and treatments. Shared eyes track, blink and compress with the character performance. Sparks add authored visual fusion, not a standalone gameplay power. Apex recipes also match the separate sword-build system: a complete matching loadout changes sword performance, with tradeoffs and sometimes a follow-up attack, as listed below. Their equipped parts retain their own rules. Visual fusion selects the first matching Apex in catalogue order; sword selection prefers the most specific match and uses catalogue order for ties, so overlapping recipes can select different visual and sword families. Multiple Sparks can match. A style being visually compatible does not establish a special interaction with every other item.

## Head

### Bare Head (`none`)
- **Appearance and motion:** No attachment; static silhouette. The whole Cube still poses and moves.
- **Works:** No headgear. Clean silhouette.
- **Harmony:** No named Spark/Apex recipe includes this item; shared palette/material and ordinary slot interactions still apply.

### Gold Halo (`halo`)
- **Appearance and motion:** Gold elliptical ring with dark outline; gently rocks with time. Gameplay response is limited to aiming while falling.
- **Works:** While holding aim and falling, gravity is 15% lighter.
- **Harmony:** Spark CHRONO RING; Apex APEX SUN; Apex GLACIER CROWN; Apex PRISM ORACLE. Full required combinations are listed below.

### Cyber Ears (`neko`)
- **Appearance and motion:** Dark triangular ears with pink interiors and core-colored fittings. Ear geometry is static relative to the Cube; cosmetic sparks occur on EDGE return when motion is enabled. The catalogue says ears perk on launch, but no independent ear-perk was found in the current head renderer.
- **Works:** Adds 12 simulation ticks to the chain expiry window after a kill. Local perk feedback animates only with motion enabled.
- **Harmony:** Spark CHRONO CAT; Apex CHRONO WRAITH. Full required combinations are listed below.

### Viper Horns (`viper`)
- **Appearance and motion:** Curved crimson horns with bright inner edges; fixed to the Cube, not independently articulated.
- **Works:** 20% faster launch, 15% thinner cut. Blade lifetime scales down to preserve straight-line active reach; ballistic landing distance can change.
- **Harmony:** Spark JET VIPER; Apex LASER WYRM. Full required combinations are listed below.

### Broken Oni (`oni`)
- **Appearance and motion:** Asymmetric red broken horn and cracked mask plate; fixed geometry follows the Cube.
- **Works:** Defeat a Crown at 1 HEALTH to unlock. Kills at 1 HEALTH earn 50% more score.
- **Harmony:** Apex MECHA REAPER. Full required combinations are listed below.

### Cube Crown (`crown`)
- **Appearance and motion:** Gold pointed crown with pink center jewel; fixed geometry follows the Cube.
- **Works:** Removes two Crown/Bastion plates per hit. Launch speed is 8% lower; no effect on Hyper steering.
- **Harmony:** Spark TYRANT NOVA; Apex VOID KING; Apex FURNACE REGENT. Full required combinations are listed below.

### Samurai Crest (`samurai`)
- **Appearance and motion:** Dark headband with broad gold swept horns; fixed geometry follows the Cube.
- **Works:** Within 25 degrees of horizontal, cuts are 20% wider.
- **Harmony:** Apex INK RONIN; Apex GLASS SHOGUN. Full required combinations are listed below.

### Lightning Coil (`coil`)
- **Appearance and motion:** Twin metal uprights and an animated cyan zigzag between them; direct cuts trigger a separate electric hit.
- **Works:** A direct slice zaps one enemy within 160 pixels for one plate. Sparks cannot trigger more sparks.
- **Harmony:** Spark STORM RELAY; Apex ARC SENTINEL; Apex STORM CONDUCTOR. Full required combinations are listed below.

### Danger Beacon (`beacon`)
- **Appearance and motion:** Amber lamp and translucent cone pulse with time; a separate threat bracket reacts to Fang wind-up.
- **Works:** Shows an amber threat bracket when a Fang begins winding up, before its charge.
- **Harmony:** Spark SKY SIGNAL; Apex RESCUE PALADIN. Full required combinations are listed below.

## Eyes

### Ninja Slits (`ninja`)
- **Appearance and motion:** Pale angled slits with moving glints; shared eye blink, gaze and focus compression.
- **Works:** Classic expressive eyes.
- **Harmony:** No named Spark/Apex recipe includes this item; shared palette/material and ordinary slot interactions still apply.

### Cyber Visor (`visor`)
- **Appearance and motion:** Broad dark-to-cyan glass band with a moving diagonal scan and focus accents; shared gaze/blink compression.
- **Works:** Aiming consumes 10% less FOCUS. Does not slow physics further. Local perk feedback animates only with motion enabled.
- **Harmony:** Apex CYBER PHANTOM; Apex ARCADE SOVEREIGN. Full required combinations are listed below.

### SSJ Blaze (`blaze`)
- **Appearance and motion:** Warm bright slits with time-varying small flame highlights; focus strengthens flicker, shared gaze/blink applies.
- **Works:** Earn 8% more kill score in overdrive. All equipment score perks together cap at +25%. Local perk feedback animates only with motion enabled.
- **Harmony:** No named Spark/Apex recipe includes this item; shared palette/material and ordinary slot interactions still apply.

### Glitch X-Eyes (`glitch`)
- **Appearance and motion:** Pale eye shapes with offset cyan and pink outlines that change in stepped time increments; shared gaze/blink applies.
- **Works:** Passive FOCUS recovery is 12% faster when not aiming. Local perk feedback animates only with motion enabled.
- **Harmony:** No named Spark/Apex recipe includes this item; shared palette/material and ordinary slot interactions still apply.

### Smug Half-Lid (`smug`)
- **Appearance and motion:** Half-lidded palette-colored slits with moving glints and shared gaze/blink. Catalogue promises gold opening in Overdrive, but the current eyes branch has no dedicated Overdrive-gold/open animation; do not count it as implemented.
- **Works:** Adds 12 simulation ticks to the chain expiry window after a kill. Local perk feedback animates only with motion enabled.
- **Harmony:** No named Spark/Apex recipe includes this item; shared palette/material and ordinary slot interactions still apply.

### Hypno Spiral (`hypno`)
- **Appearance and motion:** Purple concentric circles with rotating spiral strokes and tracking highlights; focus influences the spin.
- **Works:** Aiming consumes 15% less FOCUS. Does not slow physics further. Local perk feedback animates only with motion enabled.
- **Harmony:** Apex STAR EATER; Apex SPECTRAL BRIAR. Full required combinations are listed below.

### Sniper Dot (`sniper`)
- **Appearance and motion:** Dark band and red central sight with rotating tick marks and a gaze-shifted highlight.
- **Works:** Earn 10% more kill score at full power. All equipment score perks together cap at +25%. Local perk feedback animates only with motion enabled.
- **Harmony:** No named Spark/Apex recipe includes this item; shared palette/material and ordinary slot interactions still apply.

## Body

### Paper Ninja (`paper`)
- **Appearance and motion:** Cream-white paper shell with shaded folded planes and ink outline; material itself is static, but the Cube and eyes animate.
- **Works:** White paper shell with a bold black edge.
- **Harmony:** Apex INK RONIN. Full required combinations are listed below.

### Obsidian Stealth (`obsidian`)
- **Appearance and motion:** Dark matte shell with inset, core-tinted seams. No independent shell animation established; reacts visually to palette and Void rim treatment.
- **Works:** Earn 8% more kill score while airborne. All equipment score perks together cap at +25%. Local perk feedback animates only with motion enabled.
- **Harmony:** Spark NIGHT SIGNAL. Full required combinations are listed below.

### Hologram Wire (`hologram`)
- **Appearance and motion:** Translucent cyan wire-like shell and visible animated core chamber; shared pose animation. It does not grant invisibility.
- **Works:** Aiming consumes 12% less FOCUS. Does not slow physics further. Local perk feedback animates only with motion enabled.
- **Harmony:** Spark CORRUPT.EXE; Apex CYBER PHANTOM; Apex CHRONO WRAITH. Full required combinations are listed below.

### Prism Shell (`prism`)
- **Appearance and motion:** Purple faceted shell with fine highlights. Facet geometry is static; wall contact launches visible upward needles.
- **Works:** Faceted crystal. Side-wall contact launches two upward needles; each removes one Fang plate. 45-tick cooldown.
- **Harmony:** Spark RIFT LENS; Apex LASER WYRM; Apex PRISM ORACLE. Full required combinations are listed below.

### Bastion Iron (`iron`)
- **Appearance and motion:** Dark steel-like plated shell. Geometry is mostly static; Fang guard is event-driven, not extra permanent armor.
- **Works:** Blocks one Fang rush per run and pushes you clear. Arena walls already do no health damage.
- **Harmony:** Spark MAGNET GUARD; Apex MECHA REAPER; Apex RESCUE PALADIN. Full required combinations are listed below.

### Lava Cracked (`lava`)
- **Appearance and motion:** Charcoal shell with colored cracks; their brightness responds to combo count rather than a continuous flame simulation.
- **Works:** Adds 18 simulation ticks to the chain expiry window after a kill. Local perk feedback animates only with motion enabled.
- **Harmony:** Spark MAGMA FLAIL; Spark FURNACE HEART; Apex FURNACE REGENT. Full required combinations are listed below.

### Gold Foil (`gold`)
- **Appearance and motion:** Gold facets with a pulsing white star glint when almost still; otherwise the shell is fixed to the Cube.
- **Works:** Earn 10% more kill score on every kill. All equipment score perks together cap at +25%. Local perk feedback animates only with motion enabled.
- **Harmony:** Apex APEX SUN. Full required combinations are listed below.

### Chamfer Frame (`chamfer`)
- **Appearance and motion:** Beveled eight-corner frame with core-linked caps and shaded panels; static profile, shared character motion.
- **Works:** Adds 1 simulation ticks to the active launch blade. Local perk feedback animates only with motion enabled.
- **Harmony:** Spark CRYO LENS; Apex GLACIER CROWN; Apex STORM CONDUCTOR. Full required combinations are listed below.

### Notched Frame (`notched`)
- **Appearance and motion:** Inward side notches and core-linked vents; static profile, shared character motion.
- **Works:** Aiming consumes 8% less FOCUS. Does not slow physics further. Local perk feedback animates only with motion enabled.
- **Harmony:** Spark RAZOR LEAF; Spark GLASS EDGE; Apex SPECTRAL BRIAR; Apex GLASS SHOGUN. Full required combinations are listed below.

### Segmented Frame (`segmented`)
- **Appearance and motion:** Layered side plates, core-colored conduits and world-influenced rim; static profile, shared character motion.
- **Works:** Adds 12 simulation ticks to the chain expiry window after a kill. Local perk feedback animates only with motion enabled.
- **Harmony:** Spark ARC RELAY; Apex ARC SENTINEL. Full required combinations are listed below.

## Core

### Standard Heart (`standard`)
- **Appearance and motion:** Default heart/palette; standard non-hologram shell does not draw a separate core chamber. Shared Cube/eye motion remains.
- **Works:** Balanced movement. Three EDGE bars.
- **Harmony:** No named Spark/Apex recipe includes this item; shared palette/material and ordinary slot interactions still apply.

### Time Crystal (`time`)
- **Appearance and motion:** Crystal-like core chamber with core-colored energy; animated chamber treatment and event-driven recovery window after a kill.
- **Works:** Kills start a 120-tick window of twice-normal passive FOCUS recovery.
- **Harmony:** Spark CHRONO RING; Spark CRYO LENS; Spark CHRONO CAT; Apex GLACIER CROWN; Apex CHRONO WRAITH. Full required combinations are listed below.

### Riot Reactor (`riot`)
- **Appearance and motion:** Reactor-like core with warm energetic palette; animated chamber treatment and Overdrive activation after qualifying chain kills.
- **Works:** Overdrive activates every four consecutive kills instead of six (1.5x faster). Maximum two EDGE bars.
- **Harmony:** Spark FURNACE HEART; Apex FURNACE REGENT. Full required combinations are listed below.

### Glass Cannon (`glass`)
- **Appearance and motion:** Fragile crystal-like core with tinted chamber; shared chamber motion, no physical shattering guarantee on equip.
- **Works:** Challenge: reach SECTOR 05. Double score; maximum 1 HEALTH, including Crown repairs.
- **Harmony:** Spark TYRANT NOVA; Spark GLASS EDGE; Apex GLASS SHOGUN. Full required combinations are listed below.

### Grav Core (`grav`)
- **Appearance and motion:** Purple spiral chamber rotates over time; the real pull only affects eligible small Fangs while aiming.
- **Works:** While aiming, pulls small Fangs within 220 pixels gently toward the aim line. Maximum 0.35 pixels per simulation tick.
- **Harmony:** Spark RIFT LENS; Apex VOID KING; Apex STAR EATER; Apex PRISM ORACLE. Full required combinations are listed below.

### Magnet Dynamo (`magnet`)
- **Appearance and motion:** Magnet-shaped two-tone chamber with a time-moving highlight and shared breathing/release response; actual widening is conditional on a close pass.
- **Works:** Close passes within 100 pixels have a 20% wider blade, helping real two-contact Throughcuts. Quest rules unchanged.
- **Harmony:** Spark ARC ANGEL; Spark ARC RELAY; Spark MAGNET GUARD; Apex ARC SENTINEL; Apex RESCUE PALADIN. Full required combinations are listed below.

### Echo Heart (`echo`)
- **Appearance and motion:** Pink elliptical core element rotates subtly with time and recovery; a separate stationary ghost blade appears on the qualifying third chain kill.
- **Works:** Every third direct chain kill leaves a stationary ghost blade for 30 simulation ticks, slicing nearby Fangs once each.
- **Harmony:** Spark PIXEL ECHO; Spark STORM RELAY; Apex ARCADE SOVEREIGN; Apex STORM CONDUCTOR. Full required combinations are listed below.

## Tail

### Ninja Ribbon (`ribbon`)
- **Appearance and motion:** Dark cloth ribbon with core-colored inset follows the Cube with animated sway and lag; cosmetic.
- **Works:** Yellow-green ribbon that follows your movement.
- **Harmony:** No named Spark/Apex recipe includes this item; shared palette/material and ordinary slot interactions still apply.

### Prism Wings (`wings`)
- **Appearance and motion:** Layered purple feather-like wings flex gently; recharge is triggered by first side-wall contact in an airborne streak.
- **Works:** First side-wall contact per airborne streak restores one EDGE. Floor contact resets it.
- **Harmony:** Spark ARC ANGEL; Spark SKY SIGNAL; Apex STAR EATER; Apex RESCUE PALADIN. Full required combinations are listed below.

### Ghost Scarf (`ghost`)
- **Appearance and motion:** Pale translucent spectral scarf form sways behind the Cube; the current hero ribbon renderer draws one main shape despite the catalogue saying twin ribbons; the extended blade is a gameplay duration change, not a second automatic hit.
- **Works:** Twin spectral ribbons. Adds six simulation ticks to each launch blade; never repeats a hit on the same enemy in one shot.
- **Harmony:** Apex CYBER PHANTOM; Apex CHRONO WRAITH. Full required combinations are listed below.

### Viper Tails (`viper-tails`)
- **Appearance and motion:** Two red/pink streamers with bright ends, time-based wave and movement lag; cosmetic.
- **Works:** Earn 10% more kill score at speed 18+. All equipment score perks together cap at +25%. Local perk feedback animates only with motion enabled.
- **Harmony:** Apex MECHA REAPER. Full required combinations are listed below.

### Anchor Chain (`anchor`)
- **Appearance and motion:** Gray linked chain and heavy pointed weight sway and lag; floor rebound triggers the real area effect.
- **Works:** Floor rebound is 15% stronger and clears Fangs within 170 pixels. Floor recovery cooldown still applies.
- **Harmony:** Spark MAGMA FLAIL; Apex VOID KING; Apex FURNACE REGENT. Full required combinations are listed below.

### Mini Thrusters (`thrusters`)
- **Appearance and motion:** Paired gray nozzles with core-tinted flames that flicker and lengthen with lift/release; rebound bonus only on earned rail rebounds.
- **Works:** Twin jet nozzles. Earned rail rebounds are 8% stronger; cannot compound above the existing speed ceiling.
- **Harmony:** Spark JET VIPER. Full required combinations are listed below.

### Neon Spectrum (`spectrum`)
- **Appearance and motion:** Single rainbow streamer waves; hue cycles faster with player speed. Cosmetic.
- **Works:** Adds 12 simulation ticks to the chain expiry window after a kill. Local perk feedback animates only with motion enabled.
- **Harmony:** Spark RAZOR LEAF; Apex SPECTRAL BRIAR; Apex PRISM ORACLE. Full required combinations are listed below.

## Slash

### White Razor (`razor`)
- **Appearance and motion:** Bright white razor-like arc and pale impact shards; event animation on slash/impact, not a persistent idle effect.
- **Works:** White cut flash and shard impact.
- **Harmony:** No named Spark/Apex recipe includes this item; shared palette/material and ordinary slot interactions still apply.

### Katana Ink (`katana`)
- **Appearance and motion:** Dark and white brush-cut arc with ink-like droplets; animates on slash/impact.
- **Works:** Adds 2 simulation ticks to the active launch blade. Local perk feedback animates only with motion enabled.
- **Harmony:** Apex INK RONIN; Apex GLASS SHOGUN. Full required combinations are listed below.

### Neon Laser (`laser`)
- **Appearance and motion:** Cyan/pink luminous cut; a temporary 30-tick scar is created at launch. Cosmetic, not sustained beam damage.
- **Works:** Adds 3 simulation ticks to the active launch blade. Local perk feedback animates only with motion enabled.
- **Harmony:** Apex LASER WYRM; Apex GLACIER CROWN; Apex STORM CONDUCTOR. Full required combinations are listed below.

### Glitch Tear (`glitch-fx`)
- **Appearance and motion:** Offset pink/cyan stepped cut and blocky fragments, animated during slash/impact; sound accent when audio is enabled.
- **Works:** Adds 2 simulation ticks to the active launch blade. Local perk feedback animates only with motion enabled.
- **Harmony:** Spark CORRUPT.EXE; Spark NIGHT SIGNAL. Full required combinations are listed below.

### Gold Confetti (`confetti`)
- **Appearance and motion:** Gold foil-like fragments on impact, with a bright chime if audio is enabled; event-driven.
- **Works:** Earn 12% more kill score on multi-cuts. All equipment score perks together cap at +25%. Local perk feedback animates only with motion enabled.
- **Harmony:** Apex APEX SUN. Full required combinations are listed below.

### Comic Impact (`comic`)
- **Appearance and motion:** Bold black/yellow comic-style impact burst; event-driven rather than always visible.
- **Works:** Adds 18 simulation ticks to the chain expiry window after a kill. Local perk feedback animates only with motion enabled.
- **Harmony:** No named Spark/Apex recipe includes this item; shared palette/material and ordinary slot interactions still apply.

### Pixel Shatter (`pixel`)
- **Appearance and motion:** Small square fragments animate and fall after impact; they are non-colliding decoration.
- **Works:** Adds 2 simulation ticks to the active launch blade. Local perk feedback animates only with motion enabled.
- **Harmony:** Spark PIXEL ECHO; Apex ARCADE SOVEREIGN. Full required combinations are listed below.

## World

### Twilight Undercut (`twilight`)
- **Appearance and motion:** Industrial twilight skyline, rooftops, chains and environmental detail; procedural parallax and moving ambient elements. Room effects can respond to gameplay separately.
- **Works:** Original twilight arena.
- **Harmony:** No named Spark/Apex recipe includes this item; shared palette/material and ordinary slot interactions still apply.

### Cyber Tokyo (`tokyo`)
- **Appearance and motion:** Cool blue skyline with diagonal rain and moving light streaks. Time-based ambience; danger colors stay distinct.
- **Works:** Earn 8% more kill score at speed 18+. All equipment score perks together cap at +25%. Local perk feedback animates only with motion enabled.
- **Harmony:** No named Spark/Apex recipe includes this item; shared palette/material and ordinary slot interactions still apply.

### Blood Foundry (`foundry`)
- **Appearance and motion:** Crimson furnace skyline, orange pipes and rising sparks; time-based embers. Has its own deeper audio character.
- **Works:** Earn 12% more kill score vs armored foes. All equipment score perks together cap at +25%. Local perk feedback animates only with motion enabled.
- **Harmony:** No named Spark/Apex recipe includes this item; shared palette/material and ordinary slot interactions still apply.

### Manga Paper (`manga`)
- **Appearance and motion:** Warm paper, printed skyline, hatching and comic marks. The backdrop itself is essentially static, not a moving manga animation.
- **Works:** Earn 10% more kill score on multi-cuts. All equipment score perks together cap at +25%. Local perk feedback animates only with motion enabled.
- **Harmony:** Apex INK RONIN. Full required combinations are listed below.

### Synthwave Grid (`synth`)
- **Appearance and motion:** Striped sunset, violet mountains and perspective grid; horizontal grid lines move with time; higher synth voice.
- **Works:** Passive FOCUS recovery is 15% faster when not aiming. Local perk feedback animates only with motion enabled.
- **Harmony:** Apex ARCADE SOVEREIGN. Full required combinations are listed below.

### Pro Void (`void`)
- **Appearance and motion:** Black field, sparse stars, dark ringed orb and slowly drifting floating fragments; restrained audio. Stars/orb are not claimed as independent animations.
- **Works:** Earn 15% more kill score vs landlords. All equipment score perks together cap at +25%. Local perk feedback animates only with motion enabled.
- **Harmony:** No named Spark/Apex recipe includes this item; shared palette/material and ordinary slot interactions still apply.

## Dash

### Adaptive Dash (`dash-auto`)
- **Appearance and motion:** Selects the ink/fire/ice/lightning/echo/void/water style from build and equipment priorities; the wake appears on dash and its material/colors also follow the build.
- **Works:** Dash trails follow your equipment and sword. Cosmetic only.
- **Harmony:** No named Spark/Apex recipe includes this item; shared palette/material and ordinary slot interactions still apply.

### Ink Dash (`dash-ink`)
- **Appearance and motion:** Dark brushlike streak/wake, animated on dash; style only.
- **Works:** Adds 1 simulation ticks to the active launch blade. Local perk feedback animates only with motion enabled.
- **Harmony:** No named Spark/Apex recipe includes this item; shared palette/material and ordinary slot interactions still apply.

### Ember Dash (`dash-fire`)
- **Appearance and motion:** Layered warm flame-like ribbons, animated on dash; no burning damage.
- **Works:** Adds 2 simulation ticks to the active launch blade. Local perk feedback animates only with motion enabled.
- **Harmony:** No named Spark/Apex recipe includes this item; shared palette/material and ordinary slot interactions still apply.

### Volt Dash (`dash-lightning`)
- **Appearance and motion:** Angular electric streaks, animated on dash; no added zap.
- **Works:** Earn 10% more kill score at speed 18+. All equipment score perks together cap at +25%. Local perk feedback animates only with motion enabled.
- **Harmony:** No named Spark/Apex recipe includes this item; shared palette/material and ordinary slot interactions still apply.

### Frost Dash (`dash-ice`)
- **Appearance and motion:** Crystalline fragments/wake, animated on dash; no freeze.
- **Works:** Aiming consumes 8% less FOCUS. Does not slow physics further. Local perk feedback animates only with motion enabled.
- **Harmony:** No named Spark/Apex recipe includes this item; shared palette/material and ordinary slot interactions still apply.

### Tide Dash (`dash-water`)
- **Appearance and motion:** Flowing curved water-like ribbons, animated on dash; no water physics.
- **Works:** Passive FOCUS recovery is 10% faster when not aiming. Local perk feedback animates only with motion enabled.
- **Harmony:** No named Spark/Apex recipe includes this item; shared palette/material and ordinary slot interactions still apply.

### Void Dash (`dash-void`)
- **Appearance and motion:** Broken orbital ring wake, animated on dash; no gravity effect.
- **Works:** Earn 12% more kill score vs armored foes. All equipment score perks together cap at +25%. Local perk feedback animates only with motion enabled.
- **Harmony:** No named Spark/Apex recipe includes this item; shared palette/material and ordinary slot interactions still apply.

### Echo Dash (`dash-echo`)
- **Appearance and motion:** Geometric afterimage wake, animated on dash; no extra attack.
- **Works:** Adds 12 simulation ticks to the chain expiry window after a kill. Local perk feedback animates only with motion enabled.
- **Harmony:** No named Spark/Apex recipe includes this item; shared palette/material and ordinary slot interactions still apply.

## Pointer

### Field Reticle (`pointer-reticle`)
- **Appearance and motion:** Segmented origin reticle displayed during pointer aiming; follows input state, cosmetic.
- **Works:** A segmented reticle marks the point where you press. Cosmetic only.
- **Harmony:** No named Spark/Apex recipe includes this item; shared palette/material and ordinary slot interactions still apply.

### Prism Pointer (`pointer-diamond`)
- **Appearance and motion:** Faceted diamond marking the drag origin; input-driven, cosmetic.
- **Works:** Adds 1 simulation ticks to the active launch blade. Local perk feedback animates only with motion enabled.
- **Harmony:** No named Spark/Apex recipe includes this item; shared palette/material and ordinary slot interactions still apply.

### Orbit Pointer (`pointer-orbit`)
- **Appearance and motion:** Broken circular arcs around the drag origin; input-driven, cosmetic.
- **Works:** Passive FOCUS recovery is 10% faster when not aiming. Local perk feedback animates only with motion enabled.
- **Harmony:** No named Spark/Apex recipe includes this item; shared palette/material and ordinary slot interactions still apply.

### Crosshair Pointer (`pointer-cross`)
- **Appearance and motion:** Four precision brackets around the drag origin; input-driven, cosmetic.
- **Works:** Aiming consumes 8% less FOCUS. Does not slow physics further. Local perk feedback animates only with motion enabled.
- **Harmony:** No named Spark/Apex recipe includes this item; shared palette/material and ordinary slot interactions still apply.

## Radar

### Field Radar (`radar-base`)
- **Appearance and motion:** Local circular radar with player, enemy and objective marks; updates as positions change. No extended range or additional hazard/tell layer.
- **Works:** The standard local radar tracks nearby enemies and objectives.
- **Harmony:** No named Spark/Apex recipe includes this item; shared palette/material and ordinary slot interactions still apply.

### Long-Range Array (`radar-1`)
- **Appearance and motion:** Larger-range radar display; markers update with gameplay. No tier-2 hazard or tier-3 tell/heading upgrade.
- **Works:** See 35% farther on the radar. Existing enemy and objective markers remain visible.
- **Harmony:** No named Spark/Apex recipe includes this item; shared palette/material and ordinary slot interactions still apply.

### Threat Array (`radar-2`)
- **Appearance and motion:** Radar with active projectile/danger-zone markings as well as normal markers; updates with live hazards.
- **Works:** See 70% farther and mark nearby active projectiles and danger zones.
- **Harmony:** No named Spark/Apex recipe includes this item; shared palette/material and ordinary slot interactions still apply.

### Oracle Array (`radar-3`)
- **Appearance and motion:** Highest-range radar adds hazard marks, enemy wind-up cues and heading; updates with current game state.
- **Works:** See 120% farther, active hazards and live enemy wind-ups, plus your current heading.
- **Harmony:** No named Spark/Apex recipe includes this item; shared palette/material and ordinary slot interactions still apply.

## Trajectory

### Field Trajectory (`trajectory-base`)
- **Appearance and motion:** Short calculated line while aiming; changes as aim and snapshot change, stops at the first current solid surface.
- **Works:** A short calculated launch path appears while aiming. Stops at the first solid surface.
- **Harmony:** No named Spark/Apex recipe includes this item; shared palette/material and ordinary slot interactions still apply.

### Vector Lens (`trajectory-1`)
- **Appearance and motion:** Longer calculated aiming line; input-driven, no tier-2 impact marker/time ticks.
- **Works:** Shows more of the calculated launch path while aiming.
- **Harmony:** No named Spark/Apex recipe includes this item; shared palette/material and ordinary slot interactions still apply.

### Impact Lens (`trajectory-2`)
- **Appearance and motion:** Longer line with time ticks and current-snapshot first-impact marker; updates as aim changes.
- **Works:** A longer path adds time ticks and a first-impact marker for the current field snapshot.
- **Harmony:** No named Spark/Apex recipe includes this item; shared palette/material and ordinary slot interactions still apply.

### Oracle Lens (`trajectory-3`)
- **Appearance and motion:** Longest path with marker plus live speed, angle and estimated time; no moving-enemy future prediction or bounce forecast.
- **Works:** Shows the longest visible path, impact marker and live speed, angle and estimated time. Enemies can move; it does not predict bounces.
- **Harmony:** No named Spark/Apex recipe includes this item; shared palette/material and ordinary slot interactions still apply.

## Complete visual fusion recipes

These reveal discoverable combinations. They describe exact required slots. Sparks are visual; each Apex can also select the listed functional sword profile. Dash, pointer, radar and trajectory are not recipe ingredients.

### Spark

- **CHRONO RING:** head: Gold Halo + core: Time Crystal.
- **JET VIPER:** head: Viper Horns + tail: Mini Thrusters.
- **ARC ANGEL:** tail: Prism Wings + core: Magnet Dynamo.
- **MAGMA FLAIL:** body: Lava Cracked + tail: Anchor Chain.
- **CORRUPT.EXE:** body: Hologram Wire + slash: Glitch Tear.
- **TYRANT NOVA:** head: Cube Crown + core: Glass Cannon.
- **CRYO LENS:** body: Chamfer Frame + core: Time Crystal.
- **RAZOR LEAF:** body: Notched Frame + tail: Neon Spectrum.
- **ARC RELAY:** body: Segmented Frame + core: Magnet Dynamo.
- **PIXEL ECHO:** core: Echo Heart + slash: Pixel Shatter.
- **STORM RELAY:** head: Lightning Coil + core: Echo Heart.
- **FURNACE HEART:** body: Lava Cracked + core: Riot Reactor.
- **CHRONO CAT:** head: Cyber Ears + core: Time Crystal.
- **MAGNET GUARD:** body: Bastion Iron + core: Magnet Dynamo.
- **GLASS EDGE:** body: Notched Frame + core: Glass Cannon.
- **RIFT LENS:** body: Prism Shell + core: Grav Core.
- **SKY SIGNAL:** head: Danger Beacon + tail: Prism Wings.
- **NIGHT SIGNAL:** body: Obsidian Stealth + slash: Glitch Tear.

### Apex

- **LASER WYRM:** head: Viper Horns + body: Prism Shell + slash: Neon Laser. Sword: **WIRE LANCE** (rapier); REACH +30% / WIDTH -32% / WINDOW -1 TICKS.
- **INK RONIN:** head: Samurai Crest + body: Paper Ninja + slash: Katana Ink + world: Manga Paper. Sword: **PAPER OATH** (rapier); REACH +16% / WIDTH -12% / WINDOW -1 TICKS.
- **VOID KING:** head: Cube Crown + core: Grav Core + tail: Anchor Chain. Sword: **GRAV CHISEL** (breaker); REACH -8% / WIDTH -8% / WINDOW -4 TICKS / ARMOR +1.
- **CYBER PHANTOM:** eyes: Cyber Visor + body: Hologram Wire + tail: Ghost Scarf. Sword: **PHASE OATH** (echo); ECHO 22T / 300PX / 2 TARGETS / WIDTH -22% / WINDOW -2 TICKS.
- **MECHA REAPER:** head: Broken Oni + body: Bastion Iron + tail: Viper Tails. Sword: **MECHA HOOK** (reaper); WIDTH -16% / WINDOW +8 TICKS.
- **STAR EATER:** eyes: Hypno Spiral + core: Grav Core + tail: Prism Wings. Sword: **STAR CAPACITOR** (pulse); 4 CONTACTS / PULSE 300PX / 3 TARGETS / WIDTH -20% / WINDOW -2 TICKS.
- **APEX SUN:** head: Gold Halo + body: Gold Foil + slash: Gold Confetti. Sword: **SUN SPLITTER** (cleaver); REACH -14% / WIDTH +32% / WINDOW -3 TICKS.
- **GLACIER CROWN:** body: Chamfer Frame + core: Time Crystal + head: Gold Halo + slash: Neon Laser. Sword: **CHRONO HOOK** (reaper); REACH -5% / WIDTH -22% / WINDOW +10 TICKS.
- **SPECTRAL BRIAR:** body: Notched Frame + eyes: Hypno Spiral + tail: Neon Spectrum. Sword: **BRIAR HOOK** (reaper); REACH +8% / WIDTH -10% / WINDOW +6 TICKS.
- **ARC SENTINEL:** body: Segmented Frame + core: Magnet Dynamo + head: Lightning Coil. Sword: **RAIL FAULT** (breaker); REACH -16% / WIDTH +4% / ARMOR +1.
- **ARCADE SOVEREIGN:** core: Echo Heart + slash: Pixel Shatter + eyes: Cyber Visor + world: Synthwave Grid. Sword: **PIXEL REPRISE** (echo); ECHO 14T / 230PX / 3 TARGETS / REACH -10% / WIDTH -14% / WINDOW -2 TICKS.
- **STORM CONDUCTOR:** head: Lightning Coil + body: Chamfer Frame + core: Echo Heart + slash: Neon Laser. Sword: **ARC CAPACITOR** (pulse); 3 CONTACTS / PULSE 220PX / 3 TARGETS / REACH -4% / WIDTH -15% / WINDOW -2 TICKS.
- **FURNACE REGENT:** head: Cube Crown + body: Lava Cracked + core: Riot Reactor + tail: Anchor Chain. Sword: **FURNACE SLAB** (cleaver); REACH -20% / WIDTH +45% / WINDOW -4 TICKS.
- **CHRONO WRAITH:** head: Cyber Ears + body: Hologram Wire + core: Time Crystal + tail: Ghost Scarf. Sword: **AFTER OATH** (echo); ECHO 18T / 270PX / 3 TARGETS / REACH -5% / WIDTH -18% / WINDOW -2 TICKS.
- **RESCUE PALADIN:** head: Danger Beacon + body: Bastion Iron + core: Magnet Dynamo + tail: Prism Wings. Sword: **RESCUE EDGE** (breaker); REACH -10% / WIDTH -8% / WINDOW -3 TICKS / ARMOR +1.
- **GLASS SHOGUN:** head: Samurai Crest + body: Notched Frame + core: Glass Cannon + slash: Katana Ink. Sword: **GLASS NEEDLE** (rapier); REACH +32% / WIDTH -35%.
- **PRISM ORACLE:** head: Gold Halo + body: Prism Shell + core: Grav Core + tail: Neon Spectrum. Sword: **ORBIT ENGINE** (pulse); 4 CONTACTS / PULSE 250PX / 4 TARGETS / REACH -4% / WIDTH -12% / WINDOW -2 TICKS.

## Useful interaction boundaries

- Adaptive Dash has explicit priorities: certain completed sword builds override equipment; then Coil or Neon Laser can select lightning, Time can select ice, Echo selects echo, Grav selects void, Wings/Magnet select water, and Blaze/Riot select fire. Explicit dash styles override this selection. These are visual choices, not added elemental damage.
- Glass Cannon's one-health maximum makes Broken Oni's one-health score condition especially relevant; their separate score rules still apply according to the scoring code. Crown is another head item, so it cannot be worn together with Oni.
- Prism's wall needles, Wings' side-wall EDGE recharge and Thrusters' earned rail rebound can complement wall play, but Wings and Thrusters both occupy the tail slot and cannot be equipped together. Anchor is also a tail alternative.
- Radar and trajectory are separate equip slots and can be combined. The trajectory is a current-field estimate, not a guarantee about future enemy movement or a predicted bounce.
- Visual recipe matching is distinct from equipped item mechanics, but Apex recipes also resolve to functional sword profiles in the separate sword/build system. The profile receipt above is the actual tradeoff; a visual theme alone is not evidence of elemental damage, defense or status effects.

## Sources in this checkout

- `src/art/splatr-art-engine.js`: catalogue, hero layers, world, slash/dash, radar, trajectory, shop stories and recipe art.
- `src/equipment.js`, `src/run.js`, `src/hybrids.js`, `src/swords.js`: equipment rules, effect triggers, recipe matching and sword profiles.
- `docs/shape-lab-harmony.md`, `docs/radar-and-trajectory.md`, `docs/silent-equipment-stories.md`: existing design and implementation boundaries.
