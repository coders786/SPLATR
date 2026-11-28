# Arcade audit: implementation ledger

This is a working ledger, not a completion claim. Item numbers refer to the supplied 95-item audit. The **current rule** column records implemented behavior, not the proposed fantasy. Listing an item does not mean that its requested art, animation, sound, or interactions are complete. User decisions retain powered Gear & Mods slots and merge speed and combo into one Rush; outstanding work is tracked below.

## Item rules inspected (1–73)

| # | Current item | Slot | Current player-facing rule |
|---|---|---|---|
| 1 | Bare Head (**none**) | head | No headgear, no extra rules. |
| 2 | Gold Halo (**halo**) | head | While you aim during a fall, gravity is 15% lighter. |
| 3 | Cyber Ears (**neko**) | head | You get about 0.2s more to land your next combo kill. |
| 4 | Viper Horns (**viper**) | head | Dash 20% faster through a 15% narrower cutting lane. |
| 5 | Broken Oni (**oni**) | head | Kills earn 50% more score while you have just 1 health. |
| 6 | Cube Crown (**crown**) | head | Strip 2 armor plates per direct hit from a Crown or Bastion. |
| 7 | Samurai Crest (**samurai**) | head | Nearly horizontal cuts are 20% wider. |
| 8 | Lightning Coil (**coil**) | head | A direct cut zaps one nearby enemy for 1 plate. |
| 9 | Danger Beacon (**beacon**) | head | An amber warning marks a Fang as it prepares to charge. |
| 10 | Ninja Slits (**ninja**) | eyes | Changes the look only. No gameplay modifiers. |
| 11 | Cyber Visor (**visor**) | eyes | Changes the look only. No gameplay modifiers. |
| 12 | SSJ Blaze (**blaze**) | eyes | Changes the look only. No gameplay modifiers. |
| 13 | Glitch X-Eyes (**glitch**) | eyes | Changes the look only. No gameplay modifiers. |
| 14 | Smug Half-Lid (**smug**) | eyes | Changes the look only. No gameplay modifiers. |
| 15 | Hypno Spiral (**hypno**) | eyes | Changes the look only. No gameplay modifiers. |
| 16 | Sniper Dot (**sniper**) | eyes | Changes the look only. No gameplay modifiers. |
| 17 | Paper Ninja (**paper**) | body | A light paper shell with no stat change. |
| 18 | Obsidian Stealth (**obsidian**) | body | Airborne kills earn 8% more score. |
| 19 | Hologram Wire (**hologram**) | body | At the very start of a dash, pass through one Prism or Crown needle. |
| 20 | Prism Shell (**prism**) | body | A side-wall rebound sends out two upward needles that damage Fangs. |
| 21 | Bastion Iron (**iron**) | body | Block one Fang rush per run and get pushed clear. |
| 22 | Lava Cracked (**lava**) | body | Get about 0.3s more between combo kills. |
| 23 | Gold Foil (**gold**) | body | Every kill earns 10% more score. |
| 24 | Chamfer Frame (**chamfer**) | body | Armor hits push you back 20% less. |
| 25 | Notched Frame (**notched**) | body | Focus recovers 12% faster when you are not aiming. |
| 26 | Segmented Frame (**segmented**) | body | Save 20% of forward speed lost on your first armor shove, up to 4 speed. |
| 27 | Standard Heart (**standard**) | core | Start with 3 EDGE and 3 health. |
| 28 | Time Crystal (**time**) | core | A kill doubles passive focus recovery for 2s. |
| 29 | Riot Reactor (**riot**) | core | Enter Rush every 4 combo kills instead of 6; sustained speed can also start Rush. |
| 30 | Glass Cannon (**glass**) | core | Earn double score, but your maximum health is 1. |
| 31 | Grav Core (**grav**) | core | While aiming, gently draw small nearby Fangs toward your aiming line. |
| 32 | Magnet Dynamo (**magnet**) | core | Cuts within 100px are 20% wider. |
| 33 | Echo Heart (**echo**) | core | Every third direct combo kill leaves a ghost blade for 0.5s of game time. |
| 34 | Ninja Ribbon (**ribbon**) | tail | Your original ribbon follows your movement. |
| 35 | Prism Wings (**wings**) | tail | Your first side-wall contact while airborne refills 1 EDGE. |
| 36 | Ghost Scarf (**ghost**) | tail | Your dash can keep cutting for an extra 0.1s of game time. |
| 37 | Viper Tails (**viper-tails**) | tail | Keep 15% of the speed you would normally lose on a steering dash. |
| 38 | Anchor Chain (**anchor**) | tail | Floor rebounds are 15% stronger and clear Fangs within 170px. |
| 39 | Mini Thrusters (**thrusters**) | tail | Qualifying rail rebounds are 8% stronger. |
| 40 | Neon Spectrum (**spectrum**) | tail | Three direct kills in one combo return 1 extra EDGE. |
| 41 | White Razor (**razor**) | slash | The standard cutting flash with no extra modifier. |
| 42 | Katana Ink (**katana**) | slash | Your dash can cut for about 0.03s longer in game time. |
| 43 | Neon Laser (**laser**) | slash | Your dash can cut for about 0.05s longer in game time. |
| 44 | Glitch Tear (**glitch-fx**) | slash | Your dash can cut for about 0.03s longer in game time. |
| 45 | Gold Confetti (**confetti**) | slash | Multi-kills earn 12% more score. |
| 46 | Comic Impact (**comic**) | slash | Get about 0.3s more between combo kills. |
| 47 | Pixel Shatter (**pixel**) | slash | Your dash can cut for about 0.03s longer in game time. |
| 48 | Adaptive Dash (**dash-auto**) | dash | Changes the look only. No gameplay modifiers. |
| 49 | Ink Dash (**dash-ink**) | dash | Changes the look only. No gameplay modifiers. |
| 50 | Ember Dash (**dash-fire**) | dash | Changes the look only. No gameplay modifiers. |
| 51 | Volt Dash (**dash-lightning**) | dash | Changes the look only. No gameplay modifiers. |
| 52 | Frost Dash (**dash-ice**) | dash | Changes the look only. No gameplay modifiers. |
| 53 | Tide Dash (**dash-water**) | dash | Changes the look only. No gameplay modifiers. |
| 54 | Void Dash (**dash-void**) | dash | Changes the look only. No gameplay modifiers. |
| 55 | Echo Dash (**dash-echo**) | dash | Changes the look only. No gameplay modifiers. |
| 56 | Field Reticle (**pointer-reticle**) | pointer | Marks the point where you begin aiming. |
| 57 | Prism Pointer (**pointer-diamond**) | pointer | Your dash can cut for about 0.02s longer in game time. |
| 58 | Orbit Pointer (**pointer-orbit**) | pointer | Focus recovers 10% faster when not aiming. |
| 59 | Crosshair Pointer (**pointer-cross**) | pointer | Aiming uses 8% less focus. |
| 60 | Field Radar (**radar-base**) | radar | Marks nearby off-screen enemies with red edge arrows. |
| 61 | Long-Range Array (**radar-1**) | radar | Edge arrows detect enemies 35% farther away. |
| 62 | Threat Array (**radar-2**) | radar | Edge arrows reach 70% farther and mark off-screen projectiles and danger zones. |
| 63 | Oracle Array (**radar-3**) | radar | Edge arrows reach 120% farther and highlight enemy wind-ups, charges and active hazards. |
| 64 | Field Trajectory (**trajectory-base**) | trajectory | Shows a short predicted path while aiming. |
| 65 | Vector Lens (**trajectory-1**) | trajectory | Shows more of your predicted launch path. |
| 66 | Impact Lens (**trajectory-2**) | trajectory | Adds travel-time marks and a first-impact marker to a longer path. |
| 67 | Oracle Lens (**trajectory-3**) | trajectory | Shows the longest path, impact marker, speed, angle and estimated travel time. |
| 68 | Twilight Undercut (**twilight**) | world | Changes the look only. No gameplay modifiers. |
| 69 | Cyber Tokyo (**tokyo**) | world | Changes the look only. No gameplay modifiers. |
| 70 | Blood Foundry (**foundry**) | world | Changes the look only. No gameplay modifiers. |
| 71 | Manga Paper (**manga**) | world | Changes the look only. No gameplay modifiers. |
| 72 | Synthwave Grid (**synth**) | world | Changes the look only. No gameplay modifiers. |
| 73 | Pro Void (**void**) | world | Changes the look only. No gameplay modifiers. |

## Gameplay and UI (74–95)

| # | Area | Current assessment |
|---|---|---|
| 74 | Player and controls | Direct aim default, saved slingshot, 120 ms buffer, held aim survives empty focus, cancel and blur safeguards implemented; full specified squash, camera and animation pass remains. Brown screen-fixed spine was removed; its identity in the recording was not confirmed. |
| 75 | Rush | Continuous arcade now grants one five-second Rush from sustained speed or combo kills, with one meter and shared score/armor rewards. A direct kill emits bounded, line-of-sight chain blasts (one damage each, up to six targets); further balance and visual polish remain. |
| 76 | Triangle | Existing enemy and wave hit-stop remain; requested split-hull animation and full lunge art pass not verified/implemented. |
| 77 | Spawn and sightlines | Dark-backed warning lines improved; requested spawn gate and converging-rail timing still require inspection. |
| 78 | Pulse | Pulse rings retain their original rules. In arcade they also spawn a telegraphed mine; a blade bats it into a friendly projectile, while armed contact hurts the player. Further balancing and chain-bomb behavior remain. |
| 79 | Armored bumper | Existing plate-break behavior is present; distinct material and jaw animation need review. |
| 80 | Shielded dart | Existing armor combat remains; requested shield effects need review. |
| 81 | Rail beam | Warning contrast improved; emitter rig and complete state animation remain. |
| 82 | Prism links | Cutting a linked Prism in arcade now creates a temporary green friendly beam to its surviving partner, with a short warmup and bounded one-hit-per-enemy damage; it ends if the partner dies. Further visual and balance review remains. |
| 83 | Rift drop pod | Requested entry art and formation launch need review. |
| 84 | Monolith | Arcade boss has 10 HP, ordinary hits chip it and overcharge hits harder; debris is harmless. Actual 25–35 second fight length, full phases, diegetic armor and effects are not verified. |
| 85 | Debris | Monolith debris is non-damaging, including hazard collision checks; no live orbiting shard mechanic has been added. |
| 86 | Course gates and bounce pads | Real-wave environmental toys requested; not added. |
| 87 | Course finish rift | Requested rift and transition pass not completed. |
| 88 | Credit pickups and tether | Tether candidate removed; physical magnetized credit shards not implemented. Current rewards remain ledger-based. |
| 89 | Crown healing | Existing Crown repair rules need a diegetic heal effect. |
| 90 | Main menu | Existing menu remains; requested interactive diorama and menu animation pass not completed. |
| 91 | Garage | Two tabs, hidden search/filter/build UI and one-step buy/equip implemented. The mini sandbox runs isolated real combat with the selected gear against respawning light and armored targets, with no save or rewards; powered slots are retained by user decision. |
| 92 | Options/training | Direct aim option, Training Arena naming and Sandbox Cheats label implemented; live setting previews and direct gym remain. |
| 93 | HUD | Permanent central wave card removed; transient announcement and compact corner information implemented. Full score/HP/combo animation pass remains. |
| 94 | Radar, charge and pips | Gameplay minimap and top hairline removed; peripheral arrows, boss charge wording and larger Edge diamonds implemented. Exact presentation and requested animations need further review. |
| 95 | Pause | Restart/options, current gear summary, 400 ms frozen resume cue, input-safe queue, 400 ms fixed-step slow-motion ramp, and end confirmation after Wave 2 implemented. Requested extra visual polish remains. |

## Cross-cutting gaps

- Fast primary kills now throw a capped friendly physical splinter that damages one enemy, and arcade Pulse mines can be batted; both need balancing. Elemental wall combinations are not implemented; Prism node hijacking now creates a temporary friendly, bounded beam.
- The art and sound blueprint for all 73 items and 22 entities has not been individually implemented or validated; reduced-motion, clarity, and performance need to be preserved throughout.
- Economy and signature-weapon balancing need playtesting; no claim is made that boss duration or progression targets have been met.
- User chose to retain existing powered head, shell, blade and aiming slots in Gear & Mods; eyes, dash FX and arenas remain cosmetic.
- User chose a unified Rush: arcade speed and combo triggers now share the same state and reward; legacy breach behavior is retained separately. Validate balancing and accessible teaching of its chain explosions.
