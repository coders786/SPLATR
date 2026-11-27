> **2026-11-24 functional shop update:** formerly style-only purchases now have
> perks in `src/part-perks.js`. The Works receipts below are updated; appearance
> descriptions remain visual evidence, not gameplay promises. See `functional-shop.md`.

# Shop inventory: visuals, effects and harmony

Source audit of the current 73-item catalogue and render/gameplay code. This describes implementation, not a promise that every combination has been manually viewed or playtested. The player can equip one item per slot; different-slot rules coexist, subject to each effect's conditions and caps. Slot alternatives cannot be equipped together. Prices and unlock requirements are shown in the Shop; buying and equipping are separate.

**Reading motion:** “time-based” means the renderer samples a clock; “event-driven” means an action or game state causes a visible change. Static parts still move with the character. Generic Shop stories are illustrative demonstrations. The C63 Frost ability lesson additionally caches two isolated production-AI comparison tracks; it never steps a live run or writes saves. Reduced-motion Shop previews use a fixed illustrative frame, and many in-game effects are reduced or suppressed; this does not freeze physics. Small render sizes can omit fine detail. Audio descriptions apply only when sound is enabled.

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
- **Works:** Within 25 degrees of horizontal, cuts gain up to20% width. Positive part-width bonuses now share a+35% cap (chunk17); independent narrowing and temporary width apply separately.
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

Seven fitted face rigs share blink/gaze/expression without independent idle scans. Shop → Cube → Eyes → Part in action is a free, labelled read-only illustration, not a second combat authority. IDs, prices and ownership are unchanged.

### Ninja Slits (`ninja`)
- **Appearance and motion:** Two pale hand-cut apertures with folded ink rims; ordinary gaze, blink and tense squint. No status lights or attack geometry.
- **Works:** Classic expressive eyes; no hidden accuracy or resource modifier.
- **Harmony:** No named Spark/Apex recipe includes this item; shared palette/material and ordinary slot interactions still apply.

### Cyber Visor (`visor`)
- **Appearance and motion:** Fitted cyan glass, dark mounting rim and inset terminals. Calibration bars light only during real usable aim; no continuous scan or target-lock claim.
- **Works:** Aiming consumes 10% less FOCUS under the shared 30% reduction cap. No additional physics slow or aim assistance.
- **Harmony:** Apex CYBER PHANTOM; Apex ARCADE SOVEREIGN. Full required combinations are listed below.

### SSJ Blaze (`blaze`)
- **Appearance and motion:** Paired flame-cut sockets; steady hot material during actual Overdrive and a short local bright opening only after an actual marginal EDGE grant. Full-cap entry stays quiet apart from the truthful steady Drive state.
- **Works:** On fresh real Overdrive entry, return one EDGE **after the ordinary kill refund**, clamped to the current maximum (including Riot's 2). Full cap consumes entry with no queued grant. Refreshing active Drive does not refund again; no timer extension beyond ordinary Drive. Replaces the old +8% Drive score perk.
- **Harmony:** No named Spark/Apex recipe includes this item; shared palette/material and ordinary slot interactions still apply. Uses the shared EDGE cue; no burning target, flame shower or damaging emitter.

### Glitch X-Eyes (`glitch`)
- **Appearance and motion:** Offset X and ring inside dark sockets, connected by broken cyan/pink conductors. The bridge closes during real passive FOCUS recovery, not idle wall-clock color cycling or a full-screen flash.
- **Works:** Passive FOCUS recovery is 12% faster when not aiming, under the shared 40% recovery cap. Existing recovery authority retained.
- **Harmony:** No named Spark/Apex recipe includes this item; shared palette/material and ordinary slot interactions still apply.

### Smug Half-Lid (`smug`)
- **Appearance and motion:** Real half lids over inset apertures; a quiet notch reflects a live chain and the eyes actually open gold during Overdrive. Neither expression grants a new power.
- **Works:** Adds 12 simulation ticks to the existing chain expiry window after a kill, under the shared +36 cap. Existing chain policy retained.
- **Harmony:** No named Spark/Apex recipe includes this item; shared palette/material and ordinary slot interactions still apply.

### Hypno Spiral (`hypno`)
- **Appearance and motion:** Two continuous spiral lenses converge with real usable hold progress. Actual accepted daze adds a short thin local link and a small target notch; reduced motion retains the notch and omits the link. No spinning screen, global clock or perpetual beam.
- **Works:** After 18 continuous **fixed aim updates** (60 Hz, frozen during hitstop), admit one nearest eligible idle Fang within 140 and clear static AABB sight. New attack initiation is deferred for 12 **world ticks**; movement, cooldown, existing tells/rushes/projectiles continue. One target per hold; 90-world-tick per-object/generation immunity from acceptance. Walls, bosses, already-attacking, pinned/training and dead targets resist. Input lock, stun, depletion and teaching contexts cannot charge it. Release resets hold, not target immunity. Replaces the old 15% aim discount.
- **Harmony:** Apex STAR EATER; Apex SPECTRAL BRIAR. Uses the existing world clock, including Time/focus slowdown; creates no damage source, extra slow or immunity. That Hypno change did not implement Frost; C63/chunk19 below adds Frost independently.

### Sniper Dot (`sniper`)
- **Appearance and motion:** Fitted off-center crimson lens in a dark sight band, with ticks converging from the actual input aim power and a solid eligibility dot at 0.9. No independently rotating targeting reticle or guaranteed-hit claim.
- **Works:** **C16 replaced in chunk16:** at90%+ released power, the first direct Crown/Bastion hit removes one extra plate and the shot is10% narrower. Bosses, ordinary targets and secondary contacts do not spend the allowance. New equipment plates share a+2 cap; Crown/legacy sword armor keep their established base order. No homing, flight correction or residual score bonus.
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
- **Appearance and motion:** Projected mesh shell, vertex aperture and one calibration cell. Its cell opens only during the legal launch gate, darkens after actual interception and relights on true recharge. Two short vertex marks acknowledge a real pass; no invisible player or ambient particle stream.
- **Works:** Chunk11 replacement: first 4 world ticks of a legal launch can phase one hostile Prism/Crown needle, then 120 world-tick recharge. Only that needle/player pair is suppressed until clear; the needle continues normally. No wall/enemy/beam/ring/zone/boss/tutorial immunity, no extra invulnerability. The old 12% aim-cost discount is removed. Price 500, ownership and saves unchanged.
- **Harmony:** Spark CORRUPT.EXE; Apex CYBER PHANTOM; Apex CHRONO WRAITH. Full required combinations are listed below.

### Prism Shell (`prism`)
- **Appearance and motion:** Purple faceted shell with exactly two fitted needle hardpoints. Their lit/empty state reads the actual45-tick cooldown; wall contact still launches exactly two real upward needles. No ornamental projectile swarm.
- **Works:** Faceted crystal. Side-wall contact launches two upward needles; each removes one Fang plate. 45-tick cooldown.
- **Harmony:** Spark RIFT LENS; Apex LASER WYRM; Apex PRISM ORACLE. Full required combinations are listed below.

### Bastion Iron (`iron`)
- **Appearance and motion:** Dark steel plate with one physical guard latch. Actual first Fang-rush block breaks it into a persistent spent dent; health repair does not reset it. No infinite shield bubble or extra permanent hull.
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
- **Appearance and motion:** Beveled eight-corner frame; an authority-driven, core-colored leading-bevel line follows a real primary armor shove, then clears in7 simulation steps. Reduced motion holds a static local cue without sliding. Square physics body is unchanged; zero new particles.
- **Works:** Reduces only primary armor recoil by20%, bounded by incoming speed and the legal ceiling. Replaces the old +1 blade tick. No extra damage, armor, health, reflected hazards or rail restitution changes. Shop shows30 incoming →23 ordinary /24.4 Chamfer.
- **Harmony:** Spark CRYO LENS; Apex GLACIER CROWN; Apex STORM CONDUCTOR. Full required combinations are listed below.

### Notched Frame (`notched`)
- **Appearance and motion:** Recessed side vents open in the core palette during actual passive FOCUS recovery, close at full/aim, and show one short paired entry line. Reduced motion retains static open gates without the entry lines. No routine particles or thrust.
- **Works:** +12 percentage points of passive FOCUS recovery bonus while not aiming, subject to the shared +40% cap. Replaces the former 8% aim-cost discount. Shop comparison and detailed receipts show this build’s actual capped marginal contribution; existing ownership, price and saves are unchanged.
- **Harmony:** Spark RAZOR LEAF; Spark GLASS EDGE; Apex SPECTRAL BRIAR; Apex GLASS SHOGUN. Full required combinations are listed below.

### Segmented Frame (`segmented`)
- **Appearance and motion:** Interlocking side plates compress along the real shove direction and hold one core-linked ratchet seam while a reserve exists. Head/tail attachment seats follow the small plate displacement, not a new whole-body squash. A paid launch settles panels within9 simulation steps; reduced motion keeps a static charged state only. No new particles.
- **Works:** First primary armor shove of a shot stores20% of actual forward momentum loss, max4 speed, for45 simulation ticks. Next accepted launch returns it once without exceeding recorded pre-impact speed or current legal ceiling; no loss means no reserve. Cancel/refusal/buffering do not spend it before an actual launch; expiry discards it. Replaces the old +12 chain-grace ticks. IDs, prices and saves are unchanged.
- **Harmony:** Spark ARC RELAY; Apex ARC SENTINEL. Full required combinations are listed below.

## Core

### Standard Heart (`standard`)
- **Appearance and motion:** Default heart/palette with the fitted sealed cross-brace cassette delivered in chunk10; opaque shells remain capped, not transparent. Shared Cube/eye motion remains.
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
- **Works:** Close passes gain up to20% width, under the shared+35% positive-width cap (chunk17). Existing near-band distance/body-contact behavior is retained; Quest rules unchanged.
- **Harmony:** Spark ARC ANGEL; Spark ARC RELAY; Spark MAGNET GUARD; Apex ARC SENTINEL; Apex RESCUE PALADIN. Full required combinations are listed below.

### Echo Heart (`echo`)
- **Appearance and motion:** Pink elliptical core element rotates subtly with time and recovery; a separate stationary ghost blade appears on the qualifying third chain kill.
- **Works:** Every third direct chain kill leaves a stationary ghost blade for 30 simulation ticks, slicing nearby Fangs once each.
- **Harmony:** Spark PIXEL ECHO; Spark STORM RELAY; Apex ARCADE SOVEREIGN; Apex STORM CONDUCTOR. Full required combinations are listed below.

## Tail

### Ninja Ribbon (`ribbon`)
- **Appearance and motion:** One folded lime cloth strip, stitched hem and shell-fitted knot. Bounded action/vertical-travel bend, no independent idle sine or extra force.
- **Works:** Yellow-green ribbon that follows your movement.
- **Harmony:** No named Spark/Apex recipe includes this item; shared palette/material and ordinary slot interactions still apply.

### Prism Wings (`wings`)
- **Appearance and motion:** Two rigid crystal feather banks meet a fitted recharge cartridge. Inner latch reflects the actual first-wall ready/spent state; only an accepted refill flexes it. No lift/flight.
- **Works:** First side-wall contact per airborne streak restores one EDGE. Floor contact resets it.
- **Harmony:** Spark ARC ANGEL; Spark SKY SIGNAL; Apex STAR EATER; Apex RESCUE PALADIN. Full required combinations are listed below.

### Ghost Scarf (`ghost`)
- **Appearance and motion:** Two unequal translucent folded ends, with a small root mark following the actual primary blade window. The cloth itself is not a collider or a second hit source.
- **Works:** Twin spectral ribbons. Adds six simulation ticks to each launch blade; never repeats a hit on the same enemy in one shot.
- **Harmony:** Apex CYBER PHANTOM; Apex CHRONO WRAITH. Full required combinations are listed below.

### Viper Tails (`viper-tails`)
- **Appearance and motion:** Two broad tension streamers with folded pale seams and a material-fitted stabilizer clamp. A short stitch acknowledges an actual marginal retention gain, never idle time or a rejected launch.
- **Works:** Retains 15% of ordinary direction-change speed LOSS on legal relaunch; 85% becomes87.25%, not +15% speed. Rest/gentle continuation/Hyper/stronger retention keep their existing rules. Replaces the old speed-score bonus.
- **Harmony:** Apex MECHA REAPER. Full required combinations are listed below.

### Anchor Chain (`anchor`)
- **Appearance and motion:** Chunky articulated chain and a blunt split-face weight with a recessed collar. Only the actual qualified floor event seats its impact seam; no damaging tail collider or new slam button.
- **Works:** Floor rebound is 15% stronger and clears Fangs within 170 pixels. Floor recovery cooldown still applies.
- **Harmony:** Spark MAGMA FLAIL; Apex VOID KING; Apex FURNACE REGENT. Full required combinations are listed below.

### Mini Thrusters (`thrusters`)
- **Appearance and motion:** Twin faceted nozzle cans, dry bores at rest and fitted metal mounts. Paired short exhaust exists only after a real accepted marginal rebound boost; ordinary release, idle lift or a capped bank cannot light it.
- **Works:** Twin jet nozzles. Earned rail rebounds are 8% stronger; cannot compound above the existing speed ceiling.
- **Harmony:** Spark JET VIPER. Full required combinations are listed below.

### Neon Spectrum (`spectrum`)
- **Appearance and motion:** Three separated fixed-color bands and three actual primary-sequence cells. No cycling hue, elemental projectiles or per-count particles. Cooldown marks persist statically with reduced motion.
- **Works:** Three primary kills in one chain return one EXTRA EDGE after the ordinary kill refund;120-world-tick source cooldown. Secondary kills do not count. Chain break clears incomplete bands; completing at full EDGE consumes the sequence without queued payout. Replaces the old12 chain ticks.
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
- **Appearance and motion:** Broad dark brush nib with three dry bristle gaps, animated on dash; current active weapon also reflects the wider cutting lane. No persistent ink hazard.
- **Works:** Chunk17 replaces the old extra cutting time with up to12% primary lane width. Positive width gains share a+35% cap before narrower-shot tradeoffs; no extra speed, body size, reach or repeated same-shot hit.
- **Harmony:** No named Spark/Apex recipe includes this item; shared palette/material and ordinary slot interactions still apply.

### Ember Dash (`dash-fire`)
- **Appearance and motion:** Brief ignition cone, three detached velocity-inheriting launch embers, up to two contact embers and tiny steady target-attached heat seams. Real damage contracts the seam; expiry/death clears it. Reduced motion retains the steady status mark without launch/contact movement.
- **Works:** (chunk18 / C61) First eligible direct contact per accepted launch ignites its surviving nonboss victim and up to two eligible neighbors within56 and clear static sight. Fire removes one armor/health unit at world+18 and+36, if the target survives. Active burns never stack or refresh; no extra cutting time. Primary cutting width is10% narrower after positive-width gains, independently of Sniper/Viper.
- **Limits:** Bosses/protected teaching actors resist; no burn-on-burn, Coil relay, Echo charge, chain/EDGE/FOCUS/blade/Drive refund or propulsion. Ordinary death removal, score/credits, Fork children and Crown repair remain. Local target capacity24.
- **Harmony:** Shared launch construction and target-status seam; short ignition-cone/seam icon. Free slowed lesson executes the actual burn selection/deadline ledger on local Crown/Fang actors, including blocked/far/boss exclusions. Read-only lesson never changes a live run or save. Prices/IDs/ownership/presets unchanged.

### Volt Dash (`dash-lightning`)
- **Appearance and motion:** Angular electric streaks, animated on dash; no added zap.
- **Works:** Earn 10% more kill score at speed 18+. All equipment score perks together cap at +25%. Local perk feedback animates only with motion enabled.
- **Harmony:** No named Spark/Apex recipe includes this item; shared palette/material and ordinary slot interactions still apply.

### Frost Dash (`dash-ice`)
- **Appearance and motion:** Compact forward facets replace the old diamond spray for Frost only. Three contact chips, a closed stop-collar/paused pose on frozen Fangs, open drag brackets on slower heavy bodies; actual thaw breaks the rim into two short pieces, then a quiet broken notch denotes cold resistance. Static status survives reduced motion. Warm Riot/Lava core construction remains warm; no melted-ice bonus damage.
- **Works:** (chunk19 / C63) First eligible direct contact per accepted launch chills its surviving nonboss target and at most one eligible neighbor within60 and clear static sight. Fangs freeze their own locomotion and attack clocks for18 world units. Other ordinary nonboss locomotion runs at70% for24; heavy tells/attack emissions are not slowed. Expiry starts90 of target-object cold immunity; active/immune targets cannot be refreshed. The old8% aim discount is removed. No added damage, score/resource grant, player speed, width or collision change.
- **Limits:** Bosses and pinned/protected teaching actors resist. Existing needles/rings/zones keep updating independently; frozen rushing bodies still hurt on contact. Non-locomotion attacks such as a Rift blink are not canceled. Dead/recycled targets, run retirement/dispose and wave/teaching exit clear local cold without a fake thaw. Ledger capacity32 includes recovery; no enemy can be held frozen indefinitely.
- **Harmony:** Same authority drives cold collars, live state labels and shape-coded radar marks; intent vocabulary reports frozen tells while emitted threats stay dangerous. Grav cannot slide a frozen small Fang through its aim pull. Hypno retains its separate initiation-only behavior. Time remains its current focus-recovery perk and shares the world clock, not a second local cold multiplier. The free lesson compares actual isolated production AI with/without cold and advances an already-fired needle; no player-owned data is modified.

### Tide Dash (`dash-water`)
- **Appearance and motion:** Flowing curved water-like ribbons, animated on dash; no water physics.
- **Works:** Passive FOCUS recovery is 10% faster when not aiming. Local perk feedback animates only with motion enabled.
- **Harmony:** No named Spark/Apex recipe includes this item; shared palette/material and ordinary slot interactions still apply.

### Void Dash (`dash-void`)
- **Appearance and motion:** Keylined launch crescent, a stationary transparent broken pull boundary, a much smaller solid core with a real countdown seam, at most3 inward cues on moved targets, one compact collapse and quiet fade. The core renders over large enemy bodies but below lethal hazards; no screen blackout, fog, projectile orbit or player-protection bubble. Aim-only terminal bars show the actual source recharge.
- **Works:** (chunk20 / C65) First eligible direct contact per accepted launch can place one18-world-time-unit field at its actual fixed hit origin, with36 cooldown from admission. Select up to3 nearest movable nonboss survivors within110 and static sight once; each receives at most32 total source displacement, swept-solid/arena/post-leash constrained. Only admitted target generations still within28 and clear sight at expiry take one secondary armor/health unit. No early payout, refresh, eviction, replacement targeting or late-arrival damage. The old12% armored-kill score perk is removed.
- **Limits:** Bosses/pinned/protected teaching actors resist. No projectile absorption, player phase/speed/width/collider change, chain extension or EDGE/FOCUS/blade/Drive/charge refund. Death/retire/dispose/wave/teaching cleanup cancels the pending field without payout. Ordinary secondary kills still earn score/credits, Fork children and Crown repair. New source identity retains its admitted shot/parent across later launches.
- **Harmony:** Grav yields its weaker aim-pull on selected affected targets rather than doubling the force; ordinary enemy AI and emitted hazards continue. Frozen motion constraints remain respected if present. Icon separates the outer pull ring from the small strike core. The free enlarged lesson executes the actual finite field/movement/pulse ledger on isolated actors and demonstrates an inner kill, outer pull without damage and wall/far/boss exclusions. No saved-data or ownership mutation.

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
- **Works:** Chunk17 replaces the old extra cutting time with up to12% primary lane width. Positive width gains share a+35% cap before narrower-shot tradeoffs; no extra speed, body size, reach or repeated same-shot hit.
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

## Ability-first shop presentation — chunk15

Every one of the73 items now has a player-language appearance/effect/use/limit record in `src/shop-language.js`, used by the decision shelf, accessible guide, full-details sheet and power readout. Internal rule descriptions above retain exact mechanics for engineering audit; player-visible durations use seconds or brief phrases instead of internal units. Some game-time windows stretch in slow motion; small displayed durations are approximate. No old generic perk is silently replaced in this chunk.

All9 heads and7 cores have dedicated slowed explanatory scenes in `ability-showcase.js`/`drawAbilityShowcase`, using their existing resolved benefits and tradeoffs. Halo shows gentler falling, Cyber Ears combo time, Viper faster/narrower cuts, Oni last-health score, Crown two plates/slower launch, Samurai sideways width, Coil a single neighbor zap, Beacon a pre-rush warning; cores show balance, post-kill recovery, earlier Drive/less EDGE, double score/one health, gentle small-Fang pull, close-cut width and a stationary third-kill blade. Existing gameplay construction and attack rendering are unchanged. Scenes are read-only illustrations; explicit practice is still the place for real combat tests. The phone guide is scrollable; short landscape keeps the stage compact and exposes the full text through details in the Shop pane.

Appearance is **not** a license to claim future powers: at that checkpoint Ember did not burn (superseded by chunk18); at that checkpoint Frost did not freeze (superseded by chunk19); Echo Dash does not repeat attacks, worlds do not gain new collision/status fields, and (at that checkpoint) Sniper did not puncture armor. See chunk15 progress for its historical proof; chunk16 below supersedes Sniper; chunk18 below supersedes Ember; chunk19 below supersedes Frost.

## Chunk16 checkpoint — precision and aiming, not hidden accuracy

Sniper's crimson sight now earns its visual promise: **release at90%+ → first direct nonboss armor +1 plate**, traded for a **10% narrower shot**. The old score perk is removed from the authoritative perk table, catalogue, guide, power cards, search and illustrations together. No target lock, homing, secondary eligibility or boss shortcut. Actual hit coverage is narrowed, the active weapon reflects it, and the first-frame marker reads the run's resolved geometry. Existing body-contact/collider safety remains intact; this is not a global B8 geometry rebalance.

**13 free lessons** replace the older static/abstract studies for Sniper,4 aim marks,4 radars and4 flight paths. Same current-build mark/hero construction; actual recovery/drain/blade rules, shared1/1.35/1.7/2.2 radar reach/projection, and the true wall-clipped predictor with24/36/55/95 horizons drive the examples. Oracle data comes from that path, not a canned time/speed label. Higher-tier danger and heading details remain explicitly informational. Gray forecast reference is labelled as an example, not a guarantee or predictive ricochet. No sensor or pointer balance change: Prism Pointer's existing extra cutting time remains until its separate C42 information-envelope migration.

Aim marks now open at **See the ability**, with read-only semantics and no hidden sandbox fire. Explicit **Drag Arrow** and **Show Practice Controls** remain available. Buying/equipping, prices, IDs, ownership, discoveries, presets and save schema are unchanged. Player wording remains ordinary seconds/phrases, with no exposed simulation timing jargon.

See chunk16 progress:13 new tests,52 native item/layout cases,24 genuine pre/post controlled migration cases, all73 shop regression,28 eye regressions,13 replaced-study comparisons and1260/392 unchanged live/default render cells. These are controlled correctness/layout tests, not real-device FPS or uncontrolled gameplay qualification. Original40 simulation fixtures and previous explicit migration fixtures are preserved; no new baseline overwrite.

**Final chunk16 validation:**1267/1267 tests,52/52 native aiming lessons (including explicit practice/Drag Arrow),24 genuine mechanics comparisons,13 replaced-study render comparisons and the1260/392 unchanged render matrices all pass. Both build modes pass at1128.01kB raw/416.61kB gzip. No save migration or deployment.

## Chunk17 checkpoint — Ink width and dash lessons

Ink's broad nib now means **up to12% wider direct cuts**, not a tiny duration extension. Its old extra cutting time is removed. Positive width from eligible Samurai/Magnet/Ink now caps at+35% before independent narrowing and temporary upgrades. **Explicit changed combination:** Samurai+Magnet's old1.44 near-width multiplier becomes1.35 even without Ink. Adding Ink then gives12% farther out and0% more where already capped; its power details/lesson show that actual marginal result. No bigger player body, increased reach/speed, persistent ink damage or repeated same-shot hit. Existing close-distance/body/static-query policies remain unchanged.

All8 Dash FX have new free **See the ability** lessons combining actual production trail samples with current-benefit diagrams. At the chunk17 checkpoint Fire still added cutting time (replaced in chunk18); Frost still saved aim cost then (replaced in chunk19); Tide helps recovery; Volt and, at that checkpoint, Void give conditional score (Void replaced in chunk20) and Echo adds combo grace—not unshipped elemental powers. Explicit Elemental Dash and practice controls remain selectable. A redundant external study title is hidden in read-only ability views to avoid portrait clipping; the canvas already names the item.

**Proof:**11 new tests;1278 full tests;32 native dash/layout cases including practice/reset/purchase/save/plain-language/still gates;48 genuine mechanics comparisons;8 changed-study,1260 unchanged hero,343 unchanged non-Ink attack and49 changed Ink render comparisons. Existing shop6/all73 and targeted core2×7 checks pass. Both single-file build modes pass at1135.51kB raw/418.88kB gzip. Prices, ownership and saved data unchanged. See progress for the intentional near-width exception and deferred reach/elemental/choreography/device-performance work.

## Chunk18 checkpoint — Ember contact ignition

Ember now delivers the power its appearance suggests: the first direct contact ignites its surviving eligible target and at most two nearby nonboss neighbors, with two delayed fire units and a10% narrower cutting lane. Walls block spread; active burns never stack or refresh. No extra cutting time, speed, body size, primary resource refunds or recursive attacks. Ordinary kills/score/credits/Fork children/Crown repair remain. The narrowed active weapon, tiny actual-status seam, sparse3+2 launch/contact embers and unique ignition/seam icon share that meaning.

The free slowed lesson executes the real bounded selection/deadline ledger on local actors and labels actual seconds, blocked spread, boss resistance and the width cost. No purchase or practice activation required; saves/IDs/prices/presets unchanged. Other7 dash lessons and unrelated hero/attack art are protected by genuine pre-edit pixel comparisons. See chunk18 progress for11 added tests,72 genuine mechanics cases,32 native shop cases,4 native live-render sequences and existing shop/core regression coverage. This replaces the historical chunk15/17 no-burn/duration claims for Ember only.

**Final chunk18 validation:**1289/1289 tests,32 native shop cases,4 native live-render sequences,72 genuine mechanics comparisons and all declared visual/shop/core regression gates PASS. Both build modes PASS at1144.23kB raw/421.76kB gzip (Poki421.75). No saved-data migration or original simulation-baseline update.

## Chunk19 checkpoint — Frost control, actual status animation and an AI-backed lesson

Frost now chills its first surviving eligible direct victim and at most one sight-checked neighbor. Fangs freeze for0.3s; heavier ordinary enemies move30% slower for0.4s without delaying their attacks. Actual thaw starts1.5s of cold resistance. The old aim-cost discount is removed. Bosses/protected actors resist; already-fired attacks and frozen rushing bodies remain dangerous. No added damage, speed, width or primary-resource grant.

Closed stop-collar/held Fang pose, open heavy drag brackets, live **FROZEN/SLOWED** labels, real radar shapes, actual thaw fragments and a quiet resistance notch all read the same authority. Warm cores retain their construction. The free enlarged lesson compares immutable samples of the real isolated enemy AI with/without Frost, including paused/resuming countdown, slower movement, continuing shot and exclusions. See chunk19 progress for29 tests,172 genuine pre/post cases,32 native shop cases,16 native live-render sequences, protected visual matrices and all73-item/core regressions. No save/ownership/price/preset migration or original fixture overwrite.

**Final chunk19 validation:**1318/1318 tests;32 native dash/shop cases;16 native real-run/AI/render sequences;172 genuine mechanics comparisons; protected visual matrices and existing shop6/all73/core2×7 regressions PASS. Both builds PASS at1156.05kB raw/426.47kB gzip. Original3 simulation fixture files remain byte-identical to pre19.

## Chunk20 checkpoint — Void pull boundary / small collapse core

Void's old armored-kill score perk is replaced by a fixed-origin contact field: select up to3 eligible movable nonboss survivors, pull them within a bounded distance for0.3s, then apply one secondary hit only to selected targets still in the small core. Walls, post leash and arena bounds constrain force; bosses resist. One live field,0.6s source recharge, no eviction/stack/early payout/late-target capture, primary-resource refund or player protection.

The item now uses a keylined launch crescent, transparent broken outer pull boundary, smaller solid core/countdown, actual-victim inward cues, compact real collapse and aim-only readiness terminal. The core paints over large enemy bodies but below hostile hazards. The enlarged free shop cutaway uses the actual ledger to show an inner kill versus an outer target pulled without damage, plus blocker/range/boss exclusions. Other7 dash lessons and unrelated hero/attack art remain protected. See chunk20 progress for28 new tests,268 genuine mechanics cases,32 native shop cases,16 native real-run/physics/render sequences and declared visual/shop/core regression gates. Ownership, prices, saves, presets and original simulation fixtures unchanged.

**Final chunk20 validation:**1346/1346 tests;32 native dash/shop cases;16 native real-run/physics/render sequences;268 genuine mechanics comparisons; all declared visual/shop/core regression gates PASS. Both builds PASS at1168.94kB raw/430.89kB gzip (Poki430.88). Original3 simulation fixture files remain byte-identical to pre20.
