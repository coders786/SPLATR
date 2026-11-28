# Actual Armory — all-item motion pass

This pass changes the real store, not only a separate review page.

## Visible changes
- All 73 catalogue items across 11 slots use the same new item-stage renderer on their shelf and in the selected preview.
- Every visible shelf card animates, including unselected/unhovered cards. Offscreen cards retain their baked still; work is bounded by the catalogue (maximum 10 cards in a slot), with viewport culling and a 30fps cap.
- Selected items use one large stage instead of the default split-screen story. The optional comparison tool still intentionally compares two loadouts.
- Three beats per item: appearance, action, payoff. The table below records each authored identity. Each item has a distinct immutable particle path; those same item-specific edges assemble, carry the action trace, and release as payoff FX. Motion uses shared families with item-specific silhouette geometry, fitted production art, and slot-specific action cues—not 219 wholly separate animation engines.
- Matching blue-black fields and restrained item-colored accents connect shelf and selected stage. Neutral mounting equipment isolates what is being sold; Compare and Practice retain fitted equipment.

## Safety and controls
Store-only illustrations. No new damage, projectile, charge, entitlement, price, save migration or combat rule. Reduced motion is still, manual steps freeze all secondary animation, and Pause holds both shelf and selected performance. Production build-specific combat art is preserved.

## Evidence
- [Actual store selected-canvas motion](actual-store-motion.webm): 16.8 seconds, Volt Dash → Gold Halo → Grav Core. This is the actual default store canvas, not gameplay or an auxiliary study.
- Native desktop/mobile screenshots are in native/.
- Selected-canvas crops for every item and beat are in items/. These are taken by driving real store buttons.
- Reproduce: LD_LIBRARY_PATH=/tmp/al2023/lib node scripts/store-performances-qa.mjs
- Unit tests: node --test test/store-performances.test.js
- Original pre-pass renderer/controller retained compressed in baseline/.

## Item score
|Item|Appearance|Action|Payoff|Motion family|
|---|---|---|---|---|
|Bare Head (none)|Fold in|Cloth breath|Light settle|drift|
|Gold Halo (halo)|Ring assemble|Suspended fall|Feather release|float|
|Cyber Ears (neko)|Ears unfold|Chain flick|Twin recoil|spring|
|Viper Horns (viper)|Fin lock|Forward snap|Venom slivers|fan|
|Broken Oni (oni)|Broken join|Last-heart flare|Crack scatter|split|
|Ninja Slits (ninja)|Apertures open|Focused glance|Ink whiskers|fan|
|Cyber Visor (visor)|Lens slide|Scan sweep|Light traces|scan|
|SSJ Blaze (blaze)|Flame wake|Hot entry|Ember eyelids|rise|
|Paper Ninja (paper)|Fold planes|Paper flex|Crease dust|fold|
|Obsidian Stealth (obsidian)|Facet emerge|Edge turn|Dark shards|split|
|Hologram Wire (hologram)|Projection build|Phase scan|Projection slices|scan|
|Standard Heart (standard)|Heart assemble|Quiet heartbeat|Balanced motes|pulse|
|Time Crystal (time)|Crystal tune|Time calibration|Clock facets|orbit|
|Riot Reactor (riot)|Reactor clamp|Piston surge|Reactor sparks|zig|
|Glass Cannon (glass)|Glass form|Fracture glint|Fragile splinters|split|
|Ninja Ribbon (ribbon)|Knot tie|Cloth wave|Hem threads|ribbon|
|Prism Wings (wings)|Feathers unfold|Wall feather|Feather scatter|fan|
|Ghost Scarf (ghost)|Ghost extrude|Aftercloth drift|Phase threads|phase|
|White Razor (razor)|Edge draw|Razor sweep|Cold slivers|fan|
|Katana Ink (katana)|Ink load|Brush cut|Ink flecks|fold|
|Neon Laser (laser)|Filament grow|Neon sweep|Laser sparks|scan|
|Twilight Undercut (twilight)|Dusk reveal|Dust travel|Evening drift|float|
|Cyber Tokyo (tokyo)|Neon ignite|Rain passage|Rain streaks|scan|
|Blood Foundry (foundry)|Furnace wake|Heat passage|Foundry cinders|rise|
|Cube Crown (crown)|Crown seat|Armor jaws|Gold plates|drop|
|Samurai Crest (samurai)|Crest unfurl|Wide sweep|Blade needles|fan|
|Lightning Coil (coil)|Wind inductors|Contact relay|Charge shed|zig|
|Danger Beacon (beacon)|Lamp rise|Threat tell|Signal glints|scan|
|Glitch X-Eyes (glitch)|Pixel boot|Broken scan|Color tear|step|
|Smug Half-Lid (smug)|Lids lift|Confident squint|Gold wink|float|
|Hypno Spiral (hypno)|Spiral unwind|Hold spiral|Daze fragments|orbit|
|Sniper Dot (sniper)|Scope extend|Crosshair close|Needle glint|inward|
|Prism Shell (prism)|Crystal grow|Facet split|Prismatic chips|orbit|
|Bastion Iron (iron)|Plates clamp|Guard contact|Steel rivets|drop|
|Lava Cracked (lava)|Rock cool|Seam breathe|Lava embers|rise|
|Gold Foil (gold)|Gold cast|Burnished pass|Golden leaf|glint|
|Grav Core (grav)|Iris assemble|Gravity turn|Inward arcs|inward|
|Magnet Dynamo (magnet)|Poles align|Opposed dynamo|Pole filings|inward|
|Echo Heart (echo)|Echo stack|Delayed trace|Offset echoes|step|
|Viper Tails (viper-tails)|Twin tails split|Retention whip|Twin-tip shed|ribbon|
|Anchor Chain (anchor)|Links descend|Weight swing|Floor grit|drop|
|Mini Thrusters (thrusters)|Nozzles seat|Jet opening|Exhaust flecks|rise|
|Neon Spectrum (spectrum)|Bands weave|Three-band wave|Spectrum threads|ribbon|
|Glitch Tear (glitch-fx)|Tear open|Offset slash|RGB fragments|step|
|Gold Confetti (confetti)|Gold ribbon|Paper flourish|Tumbling confetti|drop|
|Comic Impact (comic)|Ink wedge|Graphic sweep|Comic wedges|burst|
|Pixel Shatter (pixel)|Pixel build|Stepped cut|Pixel chips|step|
|Manga Paper (manga)|Ink print|Panel passage|Paper scratches|fold|
|Synthwave Grid (synth)|Grid boot|Synth passage|Neon pixels|step|
|Chamfer Frame (chamfer)|Bevel align|Glance away|Armor splints|fan|
|Notched Frame (notched)|Vent seat|Cooling breath|Vapor cuts|vent|
|Segmented Frame (segmented)|Segments seat|Spring compress|Ratchet release|spring|
|Adaptive Dash (dash-auto)|Slip align|Adaptive launch|Slip flecks|drift|
|Ink Dash (dash-ink)|Ink compress|Wide ink launch|Ink chips|fold|
|Ember Dash (dash-fire)|Heat gather|Ember launch|Rising embers|rise|
|Volt Dash (dash-lightning)|Fork align|Volt lance|Split sparks|zig|
|Frost Dash (dash-ice)|Frost facet|Frost launch|Ice splinters|fan|
|Tide Dash (dash-water)|Tide gather|Water launch|Droplet wake|wave|
|Void Dash (dash-void)|Void fold|Well launch|Inward fragments|inward|
|Echo Dash (dash-echo)|Echo align|Reprise launch|Trailing corners|phase|
|Field Reticle (pointer-reticle)|Reticle build|Pull focus|Aim pinpricks|pulse|
|Prism Pointer (pointer-diamond)|Diamond join|Diamond focus|Facet pins|inward|
|Orbit Pointer (pointer-orbit)|Orbit unfurl|Orbit aim|Orbital ticks|orbit|
|Crosshair Pointer (pointer-cross)|Cross lock|Cross focus|Cross splints|scan|
|Field Radar (radar-base)|Map open|Player pulse|Map dust|pulse|
|Long-Range Array (radar-1)|Sweep reveal|Extended sweep|Range ticks|scan|
|Threat Array (radar-2)|Blips arrive|Threat sweep|Typed blips|orbit|
|Oracle Array (radar-3)|Field arrange|Direction sweep|Bearing flecks|fan|
|Field Trajectory (trajectory-base)|Guide unfold|Short guide|Guide motes|drift|
|Vector Lens (trajectory-1)|Path extend|Long guide|Path dashes|fan|
|Impact Lens (trajectory-2)|Rail reveal|Bank trace|Bounce pins|split|
|Oracle Lens (trajectory-3)|Route weave|Multi-bank trace|Route facets|zig|
|Pro Void (void)|Void emerge|Star passage|Imploding stars|inward|
