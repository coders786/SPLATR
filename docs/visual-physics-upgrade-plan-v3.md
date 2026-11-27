# SPLATR V3 — Upgrades must change the action, not decorate it

> **Historical planning draft.** The self-contained
> [unified upgrade harmony and implementation blueprint](unified-upgrade-harmony-implementation-plan.md)
> now consolidates the attack powers with all other items, restrained effects,
> explicit Laser/extension and source-admission decisions, and per-item tests.
> Do not implement this older draft independently.

**Attack-power specification. Planning and visual audit only; no new abilities implemented.**

> Read with [V4: appearance, power and restraint for the complete loadout](appearance-power-restraint-plan-v4.md).
> V3 remains the detailed source for the 15 Dash/Slash powers. V4 replaces V3's
> assignments for the other 58 items and overrides cosmetic density, residue,
> composition and conflicting stacking rules. [V5](upgrade-animation-harmony-plan-v5.md)
> governs cross-upgrade animation/particle harmony and shared family resolution.
> Earlier conflicting proposals are historical.

This supersedes the combat/elemental direction in `shop-item-design-v2.md`.
V2's blanket exclusion of burning, freezing, extra damaging fragments and delayed
attacks was wrong for this brief: it protected a cosmetic architecture instead
of designing satisfying powers. Preserve saves and core control reliability,
not the assumption that every element must be the same dash with a small passive.

The new standard:

> With the item name, color and stat text hidden, a player should recognize the
> material from its motion, then correctly anticipate its main physical effect.

A fire upgrade must do more than tint a trail orange. Ice must do more than save
FOCUS. A laser should not be an ordinary curved sword arc painted cyan. We need
**an attack silhouette, a force signature, material particles, an actual result,
and readable limits.** More particles alone do not solve the problem either.

## 1. What I actually inspected

Rendered all 73 current catalogue items using the existing art engine. For the
8 dash and 7 slash choices, rendered the actual shop functions at 240, 410, 570
and 850 milliseconds. Also read the production elemental/slash drawing, launch,
collision, armor and secondary-attack paths.

Reproduce the current-art audit with `node scripts/capture-upgrade-audit.mjs`.
It generates ignored local images without changing game state or shipped art.
Local audit captures, not proposed artwork:
- `.arena/visual-replan/dash-stages.png`
- `.arena/visual-replan/slash-stages.png`
- `.arena/visual-replan/heads-eyes.png`
- `.arena/visual-replan/shells-cores.png`
- `.arena/visual-replan/tails-worlds.png`
- `.arena/visual-replan/aim-sensors.png`

These are illustrative samples, not a claim that four sampled frames cover every
animation frame, real-world device or equipment combination.

### Specific failures

1. `resolveShopDashPose` has one x/y/speed progression for all eight options.
   `drawShopElementDash` swaps elemental decoration but uses that same staging.
   Every element loads, launches and brakes essentially the same way.
2. `drawElementalDash` explicitly describes itself as having no particles or
   gameplay mutations. It branches between flame wedges, zigzags, diamonds,
   curves, rings and outlines, but they all share an age/speed fade envelope.
   The hard age limit and speed-dependent cutoff erase aftermath at rest.
3. The viewed dash frames show the same hero and smear; several material cues
   become faint near the body. Fire lacks rising detached embers, water lacks
   droplet inertia/splash and ice lacks a target becoming frozen.
4. `drawEquipmentSlash` shares one curved sweep construction for most styles,
   with palette/band-width variations; Pixel changes the drawing into blocks.
   It is not seven different attack geometries or consequences.
5. `drawShopElementSlash` uses one swing/target-split schedule. It does not pass
   the contact point into the slash helper's optional contact-impact route.
   Its generic contact tick cannot show each style's full contact personality.
6. Production has shared sparks/shards and style-related impacts elsewhere;
   saying the whole game has zero particles would be inaccurate. The real issue
   is missing **material-specific causal effects**, not the absolute absence
   of every particle in every rendering path.
7. `dashElement` can infer fire/ice/etc. from equipment even for Adaptive Dash.
   If explicit elements gain real powers, this visual resolver cannot also be
   the gameplay resolver or the free adapter would inherit paid mechanics.
8. Physics launch currently has explicit momentum preservation and speed ceilings;
   armor contact has a real shove/grace response. Rendering cannot invent new
   forces, teleport the body, or reset those systems merely to look stronger.

## 2. The design correction

An upgrade is built in five linked layers:

| Layer | Required question | Example: Frost Dash |
| --- | --- | --- |
| Shape | What is the material before reading text? | Forward crystal wedge, frost facets |
| Action | What different action does it perform? | Contact-driven cold burst, not orange ribbon with blue color |
| Physics | What changes in the simulated world? | Eligible small enemies stop briefly; heavy targets only chill |
| Material | How do pieces move and expire? | Angular chips retain launch velocity, spin, then melt/fade |
| Proof | What visibly changed because of the power? | Interrupted rush, visibly frozen target, timed thaw, later immunity |

These are prototype designs, not balanced values or implemented features. Numbers
below are starting bounds for experiments. Old paid passives are **replaced by**
new attack profiles, not quietly stacked underneath every new power.

### Core controls that remain stable

- Input releases remain immediate. Windup is built during the player's existing
  hold or drawn around the first live ticks; it cannot delay an emergency dash.
- No new mandatory button, selector or mid-combat modal. One equipped Dash profile
  and one Slash profile modify the existing action.
- Preserve the axis-aligned physical Cube. Twist flame, cloth, weapon and fragments,
  not the player's Matter body. Do not add spin to make motion look energetic.
- No skipped physics steps, changed `CAMERA.lead`, fake teleports, invisible walls
  or automatic target steering. New displacements use collision-safe movement.
- Re-aim/redirect rules, EDGE requirements, existing buffers and legal cancels
  remain recognizable. Never add a hidden launch lockout to justify an animation.
- Motion-off removes distracting travel/flash, **not the paid power**. A frozen
  enemy remains mechanically frozen and is identified by a steady status symbol.

## 3. Separate three kinds of physics

**Player physics:** velocity, preserved momentum, gravity, rail reflection,
armor recoil, speed ceiling and collision sweep. Only simulation code may write.

**Target/attack physics:** actual projectile sweeps, damage sources, knockback,
chill/freeze clocks, burn ticks and field forces. Enemies are mostly custom/sensor
actors, not ordinary dynamic Matter bodies; do not call `Body.applyForce` on them
and assume that implements gameplay. Integrate forces into their existing motion.

**Particle physics:** harmless ember drag/buoyancy, chip gravity, water droplets,
foil flutter and dissolving pixels. Most particles are analytic, pooled and need
no Matter body. Their collisions can be approximated/cosmetic unless they are
explicitly registered damaging fragments. Cosmetic debris never becomes an attack
merely because its drawing overlaps an enemy.

## 4. What "juice" means here

Every attack needs all six beats, with different timing/shape by material:

1. **Prepare:** aim/pose shows where force is gathering; no artificial input delay.
2. **Release:** a strong, short initial silhouette and clear leading contact edge.
3. **Travel:** visible spacing, stretch and debris convey speed and material.
4. **Contact:** local normal-directed response—pierce, splash, fracture, arc or slam.
5. **Consequence:** actual burn, freeze, displacement, secondary hit or cut geometry.
6. **Aftermath:** particles/status outlive the traveling hero where appropriate;
   the ability does not vanish simply because the player stopped moving.

Working times below use 60Hz simulation ticks. Particle numbers are **per-event
requests subject to shared caps**, not guarantees to allocate that many objects.
No new global hitstop for every elemental hit; preserve existing contact handling.

# 5. DASHES — complete replacement specifications

## D0. Adaptive Dash — `dash-auto`

**Visual observed:** default ink-like wake/smear; the resolver may select another
material from the build. **Role:** polished neutral movement, no elemental power.

- **Ability:** retain the normal launch/cut rules. Never inherit freeze, burn,
  electrical relay or implosion merely because a matching core selects that palette.
- **Motion:** crisp 1–2 tick preparation squash, clean launch wedge, short smear
  and readable bank compression. Existing input remains immediate.
- **Particles:** 3–5 neutral speed flecks at launch, 2–4 normal-directed contact
  chips on collision. No flame tongues or ice cocoons on targets without that power.
- **Icon/form:** central Cube inside an open forward wedge. An adaptive accent
  may borrow core color, but explicit paid-power silhouettes stay distinguishable.
- **Preview:** baseline movement plus real contact, not an empty horizontal glide.
- **Boundary / chosen policy:** simplify Adaptive to neutral, nonliteral core-energy
  styling. It may borrow the core's accent color, but full flame tongues, freezing
  collars, relay branches and collapse wells belong to explicit powers. Do **not**
  keep an identical fire wake on Adaptive while only the purchased version burns.
- **Acceptance:** free kit remains satisfying and readable, but players can tell
  immediately that the explicit upgrades offer different powers.

## D1. Ink Dash — `dash-ink` — **Brush Cutter**

**Visual observed:** dark short wedge very close to Adaptive; no independent ink
droplets traveling away from the player. **New fantasy:** a broad nib physically
draws a clean cutting stroke through a group.

### Power / physical difference
- Replace the +1-tick passive with a **12% wider primary cutting corridor** during
  this shot's normal active window. Do not enlarge the player's body/hurtbox.
- Keep baseline launch velocity, gravity and speed retention. Ink's advantage is
  reliable contact width, not hidden propulsion or random splash damage.
- No persistent ink hazard. The stain after the stroke is visibly inactive.
- Total width still combines with sword/head geometry under a deliberate cap;
  prototype final width cap 1.35× the resolved unmodified sword profile, reviewed
  against existing width upgrades rather than blindly multiplying every bonus.

### Animation / particle behavior
- **Prepare:** nib-like dark leading wedge gathers beneath the hero's leading edge.
- **Launch, 0–3 ticks:** one broad black-to-cream brush smear, visibly wider than
  neutral, with dry bristle gaps on the nonleading edge.
- **Travel:** emit 4–6 irregular drops from the real traveled stroke at spaced
  distance intervals, not one spawn every render frame. Drops inherit 20–35% of
  player velocity, have mild gravity and strong drag, life 12–22 ticks.
- **Contact:** 3–5 ink flakes eject mostly perpendicular to the actual cut line;
  one flattened dark stain stays at the contact in world space for up to 24 ticks.
- **Recovery:** stroke thins from back to front; active pale edge ends exactly
  with the hit window. Body returns immediately to readable idle proportions.

### Proof / sound / edge cases
- Paired offset targets show an actual extra contact the baseline misses.
- Dry brush snap → short tearing-paper contact; no wet blood-like audio.
- Test width, no same-target extra hits, distance-based emissions, wall-clipped
  stains, diagonals, low FPS and no +1-tick passive left silently stacked.

## D2. Ember Dash — `dash-fire` — **Combustion Rush**

**Visual observed:** orange tapered geometry on the common dash pose; little
material separation and no burning target. **New fantasy:** explosive launch,
hot contact, a short actual burn—not merely a score bonus or warmer ribbon.

### Power / physical difference
- Replace +2 blade ticks with **Ignite** on the first primary contact of a shot.
- Initial prototype: ignite the surviving directly hit eligible nonboss target,
  plus at most **two nearby eligible nonboss enemies within 56 world units** of
  that contact. Nearby spread requires clear static-geometry line of sight.
- Burn deals **one secondary armor/health unit at tick +18 and +36**, then ends.
  No stacking intensity; reapplication refreshes a bounded expiry but does not
  reset it rapidly enough to manufacture extra immediate ticks.
- Initial target classes must be explicit: ordinary Fangs/Crowns/Bastions through
  the normal damage rules; exclude Landlord/monolith and protected tutorial actors
  until a separate boss design exists. Never bypass invulnerability/phase rules.
- Tradeoff prototype: **primary cut corridor −10%**. Stronger finish/small spread,
  slightly less forgiving first contact. Keep ordinary player velocity/gravity;
  an explosive drawing is not permission for untested speed multiplication.
- Burn is secondary: no recursive ignition, Coil chains, Echo counters or primary
  chain/resource procs. Kill/score ownership remains attributed, once.

### Animation / particles
- **Prepare:** leading seam becomes pale-hot, outer flame stays darker orange.
- **Release:** short 2–3 tick ignition cone; hero remains visible inside its edge.
- **Travel:** 8–12 detached embers over the burst, inherited velocity ~25%, strong
  drag and slight upward drift; life 16–30 ticks, shrink from bright core to coal.
- **Contact:** localized outward flame lick and 5–7 faster sparks directed away
  from contact. Do not cover the whole enemy with an opaque flame sprite.
- **Burn:** small flame clings to marked target; each real damage tick briefly
  contracts it and emits 1–2 embers. Death/expiry clears the flame immediately.
- **Aftermath:** 1–2 fading coal flecks remain where hit occurred, not glued to the
  player's current position after a rebound. No damaging fire trail by accident.

### Proof / sound / failure gate
- Demonstrate armored survivor losing two later units, a nearby victim igniting,
  and a wall blocking spread. A missed rush produces no magically burning targets.
- Short ignition “fwoof,” dry contact crackle, tiny real-tick accents. No endless
  fire loop per target and no full-screen red flash.
- Reject if players cannot tell what is actively burning, dead targets keep
  ticking, burn perpetually refreshes itself, or the area damage auto-clears waves.

## D3. Volt Dash — `dash-lightning` — **Arc Lance**

**Visual observed:** zigzag rails behind the same moving Cube. **New fantasy:** a
brief rapid conduction stroke followed by an actual enemy-to-enemy discharge.

### Power / physical difference
- Replace speed-score passive with two clearly bounded properties:
  **ordinary launch burst +12% for 4 ticks**, and **one relay hit** on the first
  primary contact to an eligible neighbor within **120 units** and clear sight.
- Burst modifies the authoritative launch profile/ceiling, not velocity inside
  drawing. Over the next 6 ticks remove only its own temporary excess contribution;
  never erase momentum earned from a bank/Hyper or pull an already-faster player
  down to an ordinary ceiling. Skip the extra burst above its ordinary boost band.
- Relay deals one secondary unit, selects one target deterministically and
  cannot relay again. Tradeoff prototype: primary width −15%.
- Coil synergy needs a shared conduction budget: at most **two distinct relay
  victims for the primary contact**, never two secondary hits on the same victim.
  Coil still has its own longer-range eligibility; avoid destroying its identity.
- No teleport, invulnerability, target homing or skipped collision sweep.

### Animation / particles
- **Prepare:** one compact charge point and two thin angular branches near the
  leading edge, not long crackles across the entire screen.
- **Release:** compressed bright lance for 1 tick, then 2 short jagged rails.
  Larger gap between successive world samples communicates actual burst speed.
- **Travel:** 6–10 spark pinheads eject tangent to the launch, life 5–12 ticks;
  zigzag branches change at a low authored rate, not random noise every draw.
- **Contact:** a connected 2–4 segment arc links the real victims for 4–6 ticks.
  The secondary target visibly flinches/loses its real plate. On no neighbor,
  discharge ends locally rather than drawing a false arc into empty space.
- **Brake/bank:** sparks fan along the actual collision tangent. A rebound starts
  contact aftermath without rotating the old launch wake into a new fake path.

### Proof / tests
- Compare time-to-position and the narrower corridor, then show neighbor inside
  and outside relay range. Test at maximum bank speed for tunneling/regressions.
- Sharp short electrical “crack,” with a small higher relay answer. Not constant buzz.
- Reject if boost deceleration steals stored speed, two sources double-hit one
  neighbor, or lightning appearance exists without real conduction feedback.

## D4. Frost Dash — `dash-ice` — **Rime Breaker**

**Visual observed:** scattered diamond shapes, same movement and no frozen enemy.
**New fantasy:** drive a crystal wedge into a group and briefly arrest its motion.

### Power / physical difference
- Replace aim-cost passive with a **contact cold burst** once per shot, affecting
  the struck survivor and at most one nearby eligible enemy within **60 units**
  with static line of sight.
- Ordinary small Fang: **freeze locomotion and initiation/progression of its own
  future attack windup for 18 ticks**. Already emitted projectiles/hazards continue
  normally; do not freeze a projectile merely because its owner is frozen.
- Heavy nonboss enemy: **30% locomotion slow for 24 ticks**, no frozen attack clock.
  Monolith/Landlord: no freeze/slow in the first version, explicit resistant state.
- After thaw, **90-tick per-target cold immunity** prevents repeated permanent
  freeze. New frost hits cannot stack or extend a target through that immunity.
- Base player velocity, gravity, controls and hitbox stay unchanged. The meaningful
  physics change is target arrest, not making the whole game or player time slow.
- Freeze is not invulnerability for the player; physical overlap/damage handling
  needs an explicit safe rule consistent with stopped attack state, not a hidden
  global damage immunity. Existing cut grace still applies to the primary victim.

### Animation / particles
- **Prepare/release:** one bright forward facet, broad darker lower facet; wedge
  fractures on contact, not three diamonds floating behind an ordinary dash.
- **Travel:** 6–8 angular ice chips inherit ~45% launch speed, have slight gravity,
  low drag and small rotation. Life 16–28 ticks; each keeps angular silhouette.
- **Contact:** outward crystal collar clamps around the target, with 5–7 chips
  ejected away from impact. It stops moving exactly when the status is accepted.
- **Frozen:** angular rim plus steady snow-notch; visible timer notch drains.
- **Thaw:** collar cracks into 3 harmless pieces over 4 ticks; target resumes its
  paused local state, with no retroactively released attack compressed into one tick.

### Proof / tests
- Show a charging Fang arresting, a heavy target slowing and a resistant boss.
  Show a second application during immunity failing with a small crossed facet.
- Fine fracture → muted clamp → short thaw crack, not a continuous glass storm.
- Reject if hazards disappear, tells silently skip, immunity is invisible, frozen
  enemies resume with a surprise instant lunge, or status changes depend on FPS.

## D5. Tide Dash — `dash-water` — **Undertow Bank**

**Visual observed:** paired faint curves attached to the same dash. **New fantasy:**
carry flow along a surface and shove light threats out of the landing/bank space.

### Power / physical difference
- Replace passive recovery with **surface-flow handling and one pressure splash**.
- On a valid earned rail bank, retain/increase only the outgoing tangential
  component by up to **8%**, with no extra normal impulse and no crossing the
  existing earned-speed ceiling. One Tide enhancement per shot. No continuous
  wall surfing or unlimited multiplication from contact jitter.
- First primary contact or first accepted bank in that shot emits the one splash,
  whichever happens first. Push at most **two eligible light nonboss enemies
  within 64 units** away from its real origin, over 4 ticks, **≤24 units total**.
- The push is collision-aware and post/leash-aware; no moving enemies through
  solids, into unspawned space or across the arena. No default splash damage,
  healing or hidden invulnerability. The power is positional control + bank flow.
- Existing player armor shove still applies. The wave cannot cancel it simply
  because the water drawing looks soft. Ordinary gravity remains unchanged.

### Animation / particles
- **Prepare:** a broad low wave lip gathers behind the leading edge.
- **Release:** two unequal water ribbons, one clearly leading, not symmetric wings.
- **Travel:** 8–12 droplets inherit ~60% local velocity, then arc under gravity;
  life 18–32 ticks. Bigger drops lead and small spray lags, conveying inertia.
- **Contact/bank:** flatten a wave fan along the actual contact plane. A bank's
  tangential flow ribbon follows the **new** outgoing trajectory, while detached
  incoming drops continue their old velocity. This is physical continuity.
- **Push:** affected enemies displace with the visible pressure front; no fake
  knockback animation if their simulation position did not change.
- **Aftermath:** 2 short world-space ripples fade; no permanent slippery floor.

### Proof / tests
- Demonstrate bank vector components, two enemies pushed clear, heavy target
  unmoved, wall blocking the push and a second splash denied in the same shot.
- Low splash “whap,” droplets/pluck tail, no ocean loop or screen distortion pass.
- Reject if wave art implies damage, enemies tunnel/leash-snap, or hidden tangential
  boosts accumulate into an uncontrolled speed exploit.

## D6. Void Dash — `dash-void` — **Collapse Well**

**Visual observed:** a few broken half-rings with no material response. **New fantasy:**
a cut creates a short local inward force, then a small real collapse—not teleport.

### Power / physical difference
- Replace armor-score passive with one **18-tick collapse field** at the first
  primary contact, maximum one live field from this dash source at a time.
- Field radius **110 units**, affects at most **three eligible nonboss survivors**
  chosen deterministically. Pull is bounded to **32 total units per target**,
  collision-aware; do not move immovable/heavy actors that existing rules exclude.
- At expiry, targets actually within **28 units** of the core receive **one
  secondary unit** once. Being inside the outer visual ring alone causes no damage.
- One pulse, no persistent black-hole DPS, no automatic repeated capture,
  no absorption of enemy projectiles, no boss teleport/execute.
- Player launch remains normal. Void does not phase through walls, skip dangerous
  travel, or grant invulnerability. Its physically meaningful change is enemy
  displacement and a final tight contact region.
- New fields replace an older source field without cashing out the abandoned
  field early. Prototype source cooldown 36 ticks to limit field spam.

### Animation / particles
- **Prepare/release:** negative-space leading crescent with a narrow pale keyline;
  never make the actual player disappear.
- **Travel:** 5–7 broken orbital slivers detach; their curvature is local to their
  spawn, not an endless tunnel locked to the camera.
- **Field:** transparent outer radius, small dark center under enemies, 8 sparse
  inward-moving flecks with inward acceleration. Captured targets get one inward
  force indication. Core damage radius is distinct and much smaller.
- **Collapse:** ring compresses over the last 3 ticks, a single local white seam
  marks the real pulse, then 3–4 fragments eject and fade. No full-screen blackout.

### Proof / tests
- Show a near target pulled into the core and damaged, a farther captured target
  left outside core and not damaged, a wall obstruction and resistant boss.
- Short inhalation followed by dry compact “thunk,” no persistent sub-bass drone.
- Reject if enemies snap to center, pulse applies to outer-ring targets, field
  removal leaks references, or stacked Grav/void forces bypass displacement caps.

## D7. Echo Dash — `dash-echo` — **Reprise Stroke**

**Visual observed:** three open outlines fading behind the standard dash. **New
fantasy:** an actual delayed attack retraces a bounded part of your previous stroke.

### Power / physical difference
- Replace chain-grace passive with **one secondary replay after 12 ticks**.
- Record a bounded world-space section of the attack's traveled stroke, maximum
  **140 units / 6 samples**, clipped at real solids and at the first discontinuity.
  Replay that recorded geometry once; it never chases the player's new position.
- Replay hits at most **two eligible targets**, one secondary unit each. It may
  hit a surviving primary victim once through its own distinct attack-source ID;
  this is an explicit new secondary hit, not permission for repeated primary hits.
- Respect boss phase/damage rules; no extra boss plate bypass. No replay spawning
  another replay, proccing Coil, counting primary chain kills or recreating burn.
- Player is not rewound, duplicated physically or made invulnerable. Both actual
  body and delayed attack have unmistakably different opacity/contours.
- Share a bounded delayed-attack budget with Echo Heart/sword echoes; do not
  silently erase an equipped item's attacks. If budgets conflict, resolve the
  design during combo review rather than dropping gameplay attacks as cosmetics.

### Animation / particles
- **Prepare:** one offset outline lags a few local pixels behind the real silhouette.
- **Launch:** actual hero stays solid; one stored stroke is shown as a thin pending
  outline with a clear delay notch, no three opaque clones.
- **Replay:** recorded outline briefly becomes a bright thin cutting plane at its
  actual activation time; emit 4–6 geometric fragments off the repeated contact.
- **Aftermath:** fragments drift slightly away from the old path, decelerate and
  dissolve over 12–20 ticks. Original launch particles keep their own lifetime.

### Proof / tests
- Show a target arriving late into the recorded path taking the secondary hit;
  one outside that old path remains safe despite the player now being beside it.
- Distinct primary “tak” and delayed thinner “tik,” both bounded and event-owned.
- Reject if echo follows camera/player, hits a victim repeatedly, traces through
  walls after a bank, or the active replay looks identical to dead afterimage art.

# 6. SLASHES — geometry and contact must differ, not only color

The current action already launches a body and resolves blade contacts; this plan
is **not** adding an independent mandatory melee button. A Slash profile modifies
that existing attack's collision envelope/contact consequence. A stationary shop
swing is an explanatory view, not evidence that gameplay has a new control mode.

Resolved sword families, in-run upgrades and finish profiles need one combined
attack construction. Do not draw a huge laser while leaving a narrow arc as its
hitbox, and do not blindly multiply a rapier, cleaver, Viper and every new profile.

## S0. White Razor — `razor` — **Clean Reference Cut**
- **Observed:** narrow pale crescent; baseline action. Keep it free and crisp.
- **Geometry/power:** normal resolved sword geometry and timing; no penalty,
  secret inaccuracy or weakened hitbox to make upgrades look necessary.
- **Motion:** fastest visual setup, one clean leading edge, restrained follow-through.
  Every visible active edge must correspond to its actual cutting region.
- **Contact:** 3–5 small neutral chips along the true cut normal, one brief contact
  tick; target halves use the existing cut system, not a replacement animation.
- **Particle physics:** fast small chips, mild gravity/drag, 8–16 tick life. No
  persistent streaks or colored elemental behavior.
- **Demo:** show a miss, clean cut and armor survivor—not an automatically split
  dummy regardless of what the actual strike would have done.
- **Icon/audio:** single tapered white wedge; dry precise swish and material hit.
- **Boundary:** all other finishes must demonstrate a benefit and tradeoff against
  this honest reference, without being allowed unreadable screen-filling art.

## S1. Katana Ink — `katana` — **Draw-Cut**
**Observed:** essentially the same curved slash in different bands. **New feel:**
a long deliberate cut that opens along a sharp drawn line, with brush breakup.

- **Power/geometry:** replace +2 ticks with **+15% primary reach, −15% primary
  corridor width** relative to the resolved sword. Normal duration/hit-once rules.
  Prototype maximum final reach relative to base sword 1.35×; existing sword
  effects and caps require explicit combination rules, not unlimited multiplication.
- **Kinetics:** no extra player propulsion or body spin. Existing armor recoil
  remains; long narrow reach is the advantage and demands alignment.
- **Prepare:** weapon edge aligns and the brush tip narrows while aiming.
- **Release:** a relatively straight tapered cut with a broken dry rear edge,
  not the exact same semicircular arc as Comic. Draw the line in attack direction.
- **Contact:** two opposing ink lobes slide a few pixels along the true cut normal;
  6–8 small asymmetric drops inherit tangent motion, then fall with drag.
- **Aftermath:** one 10–18 tick ink seam remains at actual contact, obviously dead.
  Keep pale live edge separate from black residual ink against every world.
- **Demo:** farther aligned victim hit, near off-axis victim missed; true reach/
  width overlay. Magnified timing is labelled, not an invented slow-time ability.
- **Audio/icon:** dry sheath/brush scrape ending in sharp paper tear; brush blade
  with a single bristle notch, distinct from Ink Dash's forward comet.
- **Test:** collision reach, no sword double-scaling, zero accidental extra ticks,
  and the unchanged existing halves/decals remain authoritative.

## S2. Neon Laser — `laser` — **Line Thrust**
**Observed:** cyan curved crescent and fading scar, not a laser-like attack.
**New feel:** a rigid narrow luminous incision with unambiguous line-of-sight.

- **Power/geometry:** replace +3 ticks with a **straight forward cutting corridor
  of +25% reach and −35% width for its initial 6 active ticks**. Beyond that use a
  quiet normal recovery, not a second full arc. Pick one authoritative primary
  contact envelope per phase; do not leave old arc damage underneath the beam.
  This shorter active window is a deliberate tradeoff, not an accidental expiry
  bug. Preserve existing per-victim cut grace/armor safety so a successful thrust
  cannot immediately punish the player for still overlapping its survivor.
- **Obstruction:** solid geometry clips the thrust. Surviving armor terminates
  forward contacts behind that survivor for that tick; a killed light target can
  permit the line to reach one more, maximum two primary victims per initial pulse.
  Review this limit against sword-family upgrades before shipping.
- **Kinetics:** normal player velocity, no hitscan teleport. Existing hit/damage
  order determines whether armor survives; rendering cannot decide penetration.
- **Release:** pale white center, cyan shell, short emitter flare. It must look
  straight, not like a rainbow crescent. Use baked glow, not stacked bloom passes.
- **Particles:** 4–6 pin sparks at contacted material, predominantly sideways;
  life 6–12 ticks. A terminal armor flash appears only where the beam stopped.
- **Aftermath:** thin broken low-alpha scar may last 18–24 ticks but is harmless
  after the 6-tick active pulse. Show this state distinction explicitly.
- **Demo:** aligned pair, off-axis miss, and surviving armor blocking a rear victim.
- **Audio/icon:** short electrical “tssip”; straight ray with emitter collar.
- **Test:** line clipping, phased envelopes, source hit ledger, no same-shot double
  primary hit and no apparent longer beam than the reachable collision region.

## S3. Glitch Tear — `glitch-fx` — **Fault Split**
**Observed:** two colored offsets of the shared arc. **New feel:** the first cut
leaves a local instability that physically breaks one more piece of surviving armor.

- **Power:** replace +2 ticks with **one delayed secondary armor chip after 6 ticks**
  on the first eligible nonboss armored primary survivor per shot. Maximum one
  fault mark per target; secondary damage cannot spawn faults. Initial version
  excludes monolith/Landlord and protected/invulnerable targets.
- **Geometry/kinetics:** primary geometry remains resolved sword geometry. No
  teleport, discontinuous player movement, whole-screen distortion or skipped step.
- **Prepare:** one small seam appears out of alignment along the leading edge.
- **Contact:** the seam attaches to the actual contacted plate, not a random point
  on the screen. The target remains in the world and can move normally.
- **Delayed result:** at the true +6 tick, two plate slices shear a few local pixels
  apart and one actual chip is resolved. If target died/despawned, cancel the
  attack and do not create a ghost payout. No periodic chip loop.
- **Particles:** 4–6 rectangular fragments step once sideways, then coast/fall over
  10–18 ticks; do not jitter randomly every frame. Limited red/cyan inset edges.
- **Audio/icon:** first contact click, delayed short granular crack; split stepped
  slash icon with a central seam, not a generic glitch eye.
- **Demo/test:** surviving armor loses a delayed unit; normal Fang dies only once;
  boss resists. Test duplicate marks, death before timer, status reset and no
  fake delayed flash without its actual damage result.

## S4. Gold Confetti — `confetti` — **Foil Flechettes**
**Observed:** gold crescent; confetti is not a distinct active attack in the staged
slash. **New feel:** a successful cut kicks a short fan of sharp gold foil forward.

- **Power:** replace multi-cut score passive with a **first-primary-kill burst**:
  spawn at most **three real flechettes**, fan ±25° about the actual outgoing cut
  direction, speed prototype **12 units/tick**, life **10 ticks**, hard range
  **120 units**. Each deals one secondary unit to one eligible light nonboss
  victim and dies on contact/solid. At most **two distinct secondary victims**
  per burst; no recursive bursts or automatic target steering.
- **Tradeoff:** the burst requires a real primary kill; an armored survivor gives
  no fan. No free fragment attack merely for clicking or missing a target.
- **Material readability:** damaging flechettes are sharp bright solid diamonds;
  harmless celebratory foil is slower, outlined/curled, never visually identical.
  Emit 3–5 cosmetic scraps in addition only when the budget permits.
- **Kinetics:** primary player movement/recoil unchanged; projectile sweeps prevent
  fragments tunneling through thin targets or walls at low frame rates.
- **Animation:** clean first cut → tiny outward foil fan → fragments strike or
  expire. Dead foil tumbles/flutter-falls for 16–28 ticks without becoming damage.
- **Audio/icon:** crisp foil flick and at most one secondary bright tick; fan of
  three sharp diamonds, not a party-popper implying only a cosmetic celebration.
- **Demo/test:** lethal primary unlocks fan, armored nonlethal does not, walls
  block shards and secondaries never create more bursts. Review price/value rather
  than retaining a high price justified only by the old score passive.

## S5. Comic Impact — `comic` — **Panel Hammer**
**Observed:** yellow/black shared crescent. **New feel:** a broad local hit whose
force visibly pushes and interrupts nearby light enemies.

- **Power/geometry:** replace +18 chain ticks with **+20% primary corridor width,
  −10% reach**, plus one first-contact **72-unit directional pressure cone**.
  Cone pushes at most **two eligible light nonboss targets**, maximum **20 units
  across 4 ticks**, and interrupts their current interruptible windup once.
- **Limits:** no shock-cone damage in the initial version, no displacement of
  heavy/boss actors, no wall tunneling, no extra hitstop or enemy-wide stun lock.
  Per-target prototype 60-tick impact-immunity prevents repeat-interrupt farming.
- **Kinetics:** heavy-looking squash is local art, not player spin/instant stop.
  Ordinary armor contact still has its real shove; do not hide it under a starburst.
- **Animation:** broad flat cutting face → compressed asymmetric burst at actual
  contact → short normal-directed pressure lines → target displacement. Use one
  irregular burst, not a giant round explosion or floating “POW” covering enemies.
- **Particles:** 5–7 flat ink chips, fast initial kick, strong drag, life 8–16 ticks;
  2 longer punctuation strokes may linger up to 12 ticks behind the targets.
- **Audio/icon:** short low “thak” with a dry upper crack; clipped four-lobed panel
  burst. No global camera shake to fake mass.
- **Demo/test:** close off-axis contact succeeds, distant victim misses, light
  targets move, heavy one stays. Test interruption ownership/cooldown and truthful
  no-damage cone feedback.

## S6. Pixel Shatter — `pixel` — **Plate Breakup**
**Observed:** blocks sampled along the shared curve; no distinct shattering power
in the staged attack. **New feel:** actual broken armor becomes a brief physical
secondary threat, while dead pixels remain harmless debris.

- **Power:** replace +2 ticks with one burst on the **first primary armor-removal
  contact per shot**. Eject **two real square fragments** away from the target,
  in a deterministic outward fan relative to the incoming cut, speed **8 units/
  tick**, life **14 ticks**, maximum **100 units**. Each may hit one eligible
  nonboss target for one secondary unit, then expires. No reflection recursion.
- **Trigger distinction:** Confetti requires a primary kill and fires forward;
  Pixel requires plate removal and spits heavier fragments sideways. Do not
  implement both as the same colored projectile fan with different names.
- **Geometry/kinetics:** original primary shape remains step-contoured but follows
  its real continuous contact rules. Do not quantize player physics to a pixel grid.
- **Animation:** a contacted plate divides into 2 large active squares and 4–6
  tiny cosmetic chips. Active squares have a solid lit edge and straight readable
  motion; dead chips darken, tumble under gravity and fade over 18–30 ticks.
- **Audio/icon:** short stepped crunch, one lower secondary hit tick; stair-step
  cut ending in two large blocks, not Glitch's offset slit.
- **Demo/test:** armored hit produces fragments, bare Fang contact does not; a wall
  stops fragments; secondary plate loss never spawns more. Use swept collisions,
  stable source IDs and a bounded projectile slot reservation before launch.

# 7. How Dash and Slash combine without a mess

A Dash defines **travel/material power**. A Slash defines **contact geometry or
finish power**. Both can matter, but neither may blindly duplicate the other's
primary hit. One simulation transaction resolves the shot and emits a combined
contact record with separately attributed consequences.

### Eight representative combinations

| Combination | What the player should see and feel | What must actually happen |
| --- | --- | --- |
| Ember + Katana | Hot brush draw-cut, long narrow pale edge, ash/ink separation | Katana reach/width; one legal ignite transaction, no ink damage |
| Frost + Comic | Crystal wedge clamps the front while broad pressure pushes sides | Cold and pressure share a target status-resolution policy; no invisible freeze on pushed targets |
| Volt + Laser | Fast narrow electric thrust with a visible stop and one relay branch | Both widths/reaches resolve once; one primary source, shared conduction budget |
| Tide + Razor | Clean white edge over a broad directional splash | Normal primary cut, actual bounded push and legal bank tangent handling |
| Void + Glitch | Inward slivers and one delayed attached plate crack | Field pulse and Fault have distinct IDs/timers; no mutual recursion |
| Echo + Confetti | Real first kill fans foil; one delayed recorded stroke follows | Echo/foil are secondary; neither triggers another foil burst |
| Ink + Pixel | Broad brush contact and solid side-ejected plate squares | Ink width capped once; Pixel triggers on actual plate loss only |
| Adaptive + any | Neutral polished travel with that Slash's visible finish | Never inherit elemental gameplay from an adaptive palette choice |

### Conflict rules to settle in the prototype
- **Cold + push/pull:** displacement can move frozen targets only if defined as
  external force; their self-motion/attack clocks stay frozen. Prefer shattering
  the cosmetic collar only on a real damage event, not movement alone.
- **Fire + cold:** no automatic “melt for double damage” hidden synergy. Initial
  version permits timed states with distinct icons; choose a visible, testable
  policy before enabling cross-source elemental interactions.
- **Delayed damage:** Burn, Fault, Echo, projectile fragments and field pulses
  share an explicit **secondary provenance** policy. No primary chain/reward
  recursion; boss phase/protection checks still run when damage resolves.
- **Budgets:** never drop a promised gameplay projectile or freeze because a
  cosmetic particle pool is full. Reserve gameplay slots or reject/limit a power
  according to its declared cooldown. Drop only harmless visuals under pressure.
- **Stacking:** geometry, speed, armor removal and target/status caps are separate.
  A single arbitrary “all buffs multiply” formula is not acceptable.

# 8. The other 58 items: inspected appearance → embodied behavior

These are concise V3 assignments for **every remaining item**, not permission to
leave their visuals static. V2's detailed UI/ownership tests remain useful, but
any V2 rule conflicting with this physical direction is superseded. Items marked
**new** need mechanics review; **retain** means the current actual ability is
already plausible and needs a stronger physical read, not an invented second buff.

Every entry states what may change in **player/target physics** versus harmless
attachment/particle motion. Static material identity must survive a no-color test.

## Head — 9

### `none` Bare Head — retain neutral
Uncovered square brow is the clear baseline. Quick facial compression on launch,
small normal-directed neutral chips on contact; no hat-shaped aura. No change to
mass, gravity, speed, aim or damage. Removes the previous head's visual hardware
without leaving its modifier on the next run. Free should feel finished, not weak.

### `halo` Gold Halo — retain actual float
The floating ring must level when the player aims while falling; rising/grounded
states stay neutral. Keep real −15% eligible falling gravity, normal controls and
no lift. Release makes the ring tilt again; 2–3 detached light motes drift upward
as cosmetic evidence of support. Show two fall trajectories, not a floating pose
with identical physical descent.

### `neko` Cyber Ears — retain chain grace, show alertness
The visible paired triangular antenna-ears need hinged articulation: compress on
launch, perk alternately after a qualifying kill and remain attentive during the
extra 12 chain ticks. No added player force, enemy stun or invisible auto-aim.
Two tiny receiver ticks/light flecks confirm the timer extension. The ears must
actually move; changing a text label is not an animation.

### `viper` Viper Horns — retain fast narrow commitment
The swept red horns imply forward piercing, already matching +20% launch speed
and −15% width with current active-reach compensation. Tight backward sparks and
one needle-like leading highlight, not a wide flame fan. Preserve physical body
orientation, banked momentum and speed ceilings. Explicit Volt interaction must
cap boost once rather than multiply two unreviewed accelerations.

### `oni` Broken Oni — retain last-health defiance
The single snapped horn and cracked plate glow from inside only at the real
one-health condition. One fissure pulse on a qualifying +50% score kill, 3 small
ceramic chips on equip—not perpetual falling damage debris. No healing, damage
increase or mass change. The look must communicate dangerous survival rather than
an intact regenerative shield.

### `crown` Cube Crown — retain heavy plate breaker
Gold points seat with a short local downward compression and metallic chips on
actual two-plate contacts. Keep two-plate eligible damage and −8% launch speed;
no physical increase in body size/mass, no boss bypass. Jewel makes a two-step
plate pulse, not a coin shower. Retain existing armor recoil and clearly show
plate remainder when only one is left.

### `samurai` Samurai Crest — retain horizontal discipline
Broad gold crest tips spread sideways as the shot enters the ±25° valid band,
matching +20% horizontal width. Emit 2 short lateral bristle strokes on an eligible
release; no steering forces or target snapping. The silhouette and contact band
must both widen horizontally. Cross-slot Katana/Ink width must use the combined
geometry cap, not three independent oversized damage regions.

### `coil` Lightning Coil — retain real electrical relay
Twin uprights gather charge, send a connected arc to the actual secondary victim,
then throw 4–6 fast small sparks. Existing one-neighbor/160-range rule remains.
No body propulsion. Coordinate with Volt through shared per-contact conduction
limits; a drawn third/fourth branch must not imply unlimited chain damage. No
neighbor means a short contained discharge, not a false hit flash.

### `beacon` Danger Beacon — retain warning instrument
The actual low lamp housing twists toward a live Fang tell; amber sweep stops
when the tell cancels. One relay click and 1–2 tiny lamp sparks on new alert,
not a constant particle fountain. No player physics/AI delay added. Keep the
directional warning visible even when offscreen enemy art is culled; standard
telegraphs remain free and unchanged.

## Eyes — 7

### `ninja` Ninja Slits — retain clean expression
Sharp slits compress with launch and return promptly; one tiny glint follows actual
look direction. No continuous glowing mask, resource perk or aiming force. The
free eye shape is the readability reference. Never rotate/move the physical body
to make a gaze response look stronger.

### `visor` Cyber Visor — retain efficient immediate aim
The broad cyan glass band scans once then aligns, representing actual 10% lower
FOCUS drain from aim entry. A thin calibrated notch stays steady; no repeated
pixel rain. No additional physics slow, target lock or bullet-time multiplier.
Show lower drain under identical world/player motion rather than slowing the
world in the upgraded preview.

### `blaze` SSJ Blaze — retain Overdrive affinity, embody ignition
The observed gold-white slits need distinct flame tips and a hot center during
actual Overdrive; 3–5 short upward embers on activation and qualifying kills.
Keep current +8% eligible Overdrive score initially; do not confuse this eye with
Ember's real burn or secretly ignite enemies. No body speed/mass change. The V2
FOCUS-refund replacement is not part of this V3 attack-first scope.

### `glitch` Glitch X-Eyes — retain reconstruction
Observed offset cyan/pink broken glyphs reseat during actual +12% passive recovery.
2–3 pixel flecks step outward once then settle; no global frame skipping/teleport.
Core motion stays continuous, recovery remains simulation-owned. The final face
must match the selected asymmetric shape rather than simply recolor Ninja Slits.

### `smug` Smug Half-Lid — retain composure
Half-lids lift after a real kill, then settle through current +12 chain ticks;
Overdrive opens them with a short gold accent if art supports it. No player
velocity or attack timing change. One dry eyebrow/eyelid response, no generic
spark explosion. Defer V2's complex aiming-discount window until the elemental
powers are proven—do not redesign every subsystem at once.

### `hypno` Hypno Spiral — retain concentration
Purple spirals tighten gradually during aim and settle rather than spin constantly.
Keep current −15% aim drain in this scope; no AI hypnosis, player spin or further
physics slowdown. A couple inward motes and lower actual resource drain prove the
benefit. If real enemy hypnosis is wanted later, it needs a separate target-state
design; do not imply it now through stunned-enemy artwork.

### `sniper` Sniper Dot — retain full-power precision
The real central red sight and thin ticks converge as power reaches its actual
qualifying threshold, then click once. Preserve +10% qualifying full-power score,
no damage/aim correction. A real valid kill gets one precise score-notch stamp;
a miss gets none. Leave the target visible in the sight gap and avoid confusing
the eye with a guaranteed-hit laser indicator.

## Shell — 10

### `paper` Paper Ninja — retain folded baseline
Observed white planes/black edge flex as folded faces on launch and bank. Small
paper fibers eject on real contact, with fast drag and mild gravity, no extra
health/armor or secret fire vulnerability. Normal mass/physics remain. Any paper
crease compression is art only and cannot resize collision geometry.

### `obsidian` Obsidian Stealth — retain current aerial affinity initially
The actual very dark faceted shell needs a light neutral keyline, narrow edge
speculars and 2–4 angular black chips at real contacts. Retain current +8%
airborne score, no invisibility or aggro cancellation. Physical descent/velocity
stay normal. Do not disappear into Void or use a trailing smoke cloud to disguise
that the shell has no stealth mechanic; improve naming/copy if users infer one.

### `hologram` Hologram Wire — retain real aim efficiency
Observed translucent blue shell/visible chamber builds from vertices into faces.
Aim straightens the wire cage and reduces real drain by 12%. 3 tiny vertex motes
on equip, a couple on accepted resource-state transition, no constant scanner
noise. No wall phasing/invulnerability; collision is exactly as solid as Paper.
Show that collision in its demo to avoid a false physics affordance.

### `prism` Prism Shell — retain two physical needles
Actual purple facets align toward the wall normal before emitting the two existing
projectiles on accepted side-wall contact. 5–7 harmless facet chips eject with
inherited contact velocity; the **two damaging needles** must have distinct solid
leading tips. Keep 45-tick cooldown, no floor activation. Wall geometry/collision
must matter; never make all pretty shards secretly damage-capable.

### `iron` Bastion Iron — retain one real guard
Dark beveled plates compress at the actual blocked Fang rush, with 5–8 heavy
metal flakes, a short ring and a persistent spent latch/dent. Existing collision-safe
push-clear is real and must match the direction of the visible compression.
No extra body mass, general immunity or recharging plate suggested by idle glow.
Second rush behaves normally; owner sees the plate is spent.

### `lava` Lava Cracked — retain chain heat, not duplicate Ember
The observed dark crack network brightens from center outward on real chain
refresh. 2–4 coal flecks at heat entry, then steady crack glow follows remaining
chain life. Keep +18 chain ticks; **no burn aura** from the shell in this scope.
Unlike Ember Dash's actual target flames, heat stays inside the shell, making the
lack of external damage legible. No new gravity/temperature simulation.

### `gold` Gold Foil — retain score value
Observed gold facets visibly crease and seat, with one moving specular on an
accepted +10% score outcome. 3 tiny harmless foil curls settle under gravity on
equip, not damaging flechettes; no projectile burst from this shell. No added
armor/mass or credits. Distinguish smooth curved foil scraps from the Slash's
solid sharp active diamonds.

### `chamfer` Chamfer Frame — retain edge durability
The real light-blue beveled corners catch a leading highlight through the +1
active blade tick. At contact, 3–4 tiny hard corner chips fan along the cut normal;
no oversized armor dent or changed body support shape. The eight-sided drawing
is not a new physical collider. Preserve the longer-lived edge's precise end,
not just a longer harmless trail.

### `notched` Notched Frame — retain aim efficiency initially
Observed side recesses and stepped pink frame open two small luminous vent gaps
during aim; retain −8% aim drain. Short 2–3 mote vent discharge on release,
no continuous smoke plume. No force from the vents, no physical change to drag or
body width. Defer V2's replacement recovery passive; show the real current
benefit instead of spreading additional rule changes through the art pass.

### `segmented` Segmented Frame — retain chain storage initially
The observed mint plates must actually shift relative to the base shell on kill,
then latch through +12 chain ticks. Two small plate-to-plate sparks, one latch
click; chain expiry releases a seam, not the entire body. No altered mass/recoil
or extra bank charge in this V3 scope. The V2 next-shot bank-charge proposal is
superseded until attack profiles and their stacking are settled.

## Core — 7

### `standard` Standard Heart — retain balanced engine
Use the actual neutral chamber/palette, three clear EDGE-capacity cues and a small
physical-looking heartbeat on real resource return. No new force, projectile or
damage effect. A couple of tiny neutral motes seat inward on equip; do not draw
an empty slot or huge floating core that is not visible on the actual character.

### `time` Time Crystal — retain recovery clock
Observed blue crystal shows a real internal transfer over its 120-tick post-kill
2× recovery window. Two short clock-facet glints on trigger, no global time warp
or skipping physics. Player and enemies move normally except the game's existing
aim-time system. Preview must contrast FOCUS recovery under identical trajectories,
not imply Halo's gravity or Frost's enemy stop.

### `riot` Riot Reactor — retain four-step ignition
Observed lightning-reactor inset expands locally on accepted counts, four ignition
notches close into Overdrive. 6–8 short hot sparks on activation and a controlled
exhaust, not endless flames during idle. Keep four-kill gate and max EDGE 2;
existing Overdrive motion/damage rules remain authoritative. Do not give another
unbounded speed multiplier because Volt also appears electric.

### `glass` Glass Cannon — retain fragile wager
Observed red crystal glints through a fine permanent fracture, a sharp 3–5 shard
assemble on equip and actual shatter only with the real failure outcome. Keep
2× score/max health 1. No shield implied by a rotating glass bubble, no mass or
restitution buff from crystal art. Guard from Iron remains a separate visible
single use; challenge ownership persists.

### `grav` Grav Core — retain existing aim pull
Actual purple spiral visibly bends sparse eligible target tracers during its
existing 220-range/0.35-unit-per-tick pull. No target teleport or force through
solid blockers. The player is not pulled. Coordinate with Void field through a
bounded combined target displacement policy; separate steady aim tether from a
short contact-collapse field so players can recognize the source.

### `magnet` Magnet Dynamo — retain close-cut compression
Observed red/blue chamber poles pinch the leading cut band at an actual close
pass, matching +20% width within 100. 2–3 tiny magnet sparks at accepted contact,
no distant targets moving toward it. No mass/gravity change. Icon should show
open poles, not Grav's spiral; close-width envelope and combined Slash/Dash width
cap need one truthful prediction.

### `echo` Echo Heart — retain third-kill stationary ghost
Actual pink/black chamber counts three direct chain kills, then leaves the real
30-tick stationary blade with 4–6 geometric fragments. No moving physical clone.
Differentiate its stationary world marker from Echo Dash's recorded moving
stroke replay. Two sources may coexist only with explicit damage-source ownership
and gameplay budgets; neither primary-counts the other's secondary kills.

## Tail — 7

### `ribbon` Ninja Ribbon — retain cloth baseline
Actual lime cloth bends with inherited lag, banks with a delayed fold and settles
quickly. 1–2 tiny fibers on a hard accepted contact; no spurious speed particles
at rest. No new mass, drag or bank bonus. Keep a clear gap from active blade art
so players cannot mistake the tail for a second damaging weapon.

### `wings` Prism Wings — retain physical refill event
Observed large layered feathers flex on the first valid airborne wall contact;
one inner feather goes dark when +1 EDGE has been used. 4–6 prism chips/feather
motes move away from the real wall normal. No flight, reduced gravity or hover.
Floor rearms the one refill without fireworks. Preview must show the second wall
contact failing before the floor reset.

### `ghost` Ghost Scarf — retain lingering blade
Observed single soft scarf under-delivers the advertised twin form; author two
unequal ghost folds and a thin trailing active-edge outline through the actual
+6 blade ticks. 3–4 slow dissolving motes, no extra hurtbox/clone. After active
window ends, folds remain cloth-like and dim, not a live damaging ribbon. Do not
change existing same-enemy-per-shot protection to fake a stronger scarf.

### `viper-tails` Viper Tails — retain speed affinity
Actual two segmented crimson strands pull straight under real velocity and slacken
under braking. Stitches light at speed ≥18, 2–3 short trailing sparks on an eligible
kill. Retain +10% qualifying speed score, no new propulsion or snake-poison proc.
They must visibly differ from Horns and cannot look like live electric cables
that should be zapping victims.

### `anchor` Anchor Chain — retain floor force
Actual links and diamond weight need independent lag and a heavy floor-contact
compression timed to the real +15% rebound/170-range Fang clear. 6–10 floor grit
chips fly along the surface; damage/radius belongs to the actual ability, not each
debris piece. No added global gravity or player rotation. Keep floor cooldown
and do not trigger a second force from rendering chain impact.

### `thrusters` Mini Thrusters — retain directed impulse
Observed tiny nozzles should visibly telescope and emit two short directional
exhaust bursts on the real +8% earned rail rebound. 5–8 fast hot flecks inherit
nozzle direction and decay, not permanent full-length flames. Preserve speed cap,
no flight/continuous acceleration. With Tide, explicitly resolve tangential bank
modification separately from Thrusters' existing rebound impulse.

### `spectrum` Neon Spectrum — retain continuity
Actual narrow rainbow strip becomes a readable folded ribbon with band-state
changes on current +12 chain ticks; avoid perpetual speed-based hue churn implying
another velocity bonus. 3 tiny colored-but-shape-distinct motes on a real chain
extension, no multi-element damage. Physical cloth is visual only; body trajectory
and hitbox do not change.

## Aim mark — 4

### `pointer-reticle` Field Reticle — retain trustworthy origin
Observed open four-notch origin stays attached to the actual press position and
shows power/cancel plainly. No auto-aim, simulated recoil or movement force. One
small dustless snap on valid release, not a projectile emitted from the cursor.
Free input clarity remains identical to purchased pointers.

### `pointer-diamond` Prism Pointer — new geometric information target
Observed three nested cyan diamonds imply a lens, not blade lifetime. Replace
+1 blade tick with a bounded actual cutting-width corridor overlay during aim,
as V2 proposed, updated to resolve V3 geometries/conditional envelopes. No fake
piercing/homing/physics force. Facets unfold to the real width, 2–3 calibration
motes only on equip; uncertain future conditional areas are dashed, not promised.

### `pointer-orbit` Orbit Pointer — retain recovery instrument
Observed broken orbital arcs dock to true aim direction, then show actual +10%
passive recovery through one short inward sweep after release. No orbiting
projectile, attraction or resource farming from pointer movement. The ring's
motion is purely an instrument; player's velocity/gravity unchanged.

### `pointer-cross` Crosshair Pointer — retain stable efficiency
Observed four precision brackets close a couple of pixels and stop during the
actual −8% aim cost. No target snap, extra damage or pixel-perfect forced direction.
One small calibration click, no constant emitter. Crosshair gap leaves the enemy
visible, and body/path physics are identical under the same input.

## Radar — 4

### `radar-base` Field Radar — retain live local information
Observed circular grid with contacts/objectives stays accurate without decorative
sweep delays. Entry markers get one small seat, no particles blocking tiny
symbols. No altered enemy behavior, spawn rate or movement. Free radar is not
intentionally inaccurate to make paid arrays useful.

### `radar-1` Long-Range Array — retain reach
Observed screen differs little beyond markers/copy; add visibly extended antenna
arms to the hardware icon and a dashed base-range comparison in preview. Actual
range 1.35× base, same current-contact vocabulary. No new hazard/tell prediction,
no target forces or damage. One array-lock click, no beeps on every border crossing.

### `radar-2` Threat Array — retain hazard layer
Current orange hazard dots need distinct projectile dashes/area outlines, not
just another colored enemy marker. Actual range 1.70× base plus real active hazards.
No future-AI knowledge or physics changes. Markers react to lifecycle events;
spent hazards clear immediately. Small indicator flicker cannot resemble an
explosion that would imply the radar damaged something.

### `radar-3` Oracle Array — retain live tell analysis
Current dashed tell ring becomes a readable actual windup arc with heading needle
and a hardware icon featuring a secondary receiver. Range 2.20× base plus live
hazards/tells, not future guaranteed attacks. No time slowdown. Freeze/interrupt
from V3 abilities must update/cancel the real tell display rather than showing a
countdown continuing through a physically frozen enemy.

## Flight path — 4

### `trajectory-base` Field Trajectory — retain free short forecast
Observed short curve is the honest base estimate, no inaccurate low tier. Immediate
updates follow the same current-snapshot launch math as gameplay. No force makes
the launched body follow a wrong line. With explicit elemental speed changes,
even the free forecast must account for the actual launch profile in its horizon.

### `trajectory-1` Vector Lens — retain extended horizon
Observed longer version adds distance, not different physics. Give its icon an
extended lens barrel/long arc; show a dashed base endpoint in comparison. No extra
velocity or world stepping for a cosmetic forecast. V3 boost/rail modifications
must be reflected only where deterministically predictable, not guessed.

### `trajectory-2` Impact Lens — retain first-impact analysis
Observed time ticks/end ring must use real sample time and current-solid clipping.
Show the upgraded lens hardware and terminal bracket, no particles competing with
ticks. Does not predict future moving targets, unsupported bounces or secondary
field damage. No body impulse from the sight; it reports, never corrects physics.

### `trajectory-3` Oracle Lens — retain longest live analysis
Observed speed/angle/time box remains fixed-width and legible while all values
reflect the combined actual loadout. No omniscient future-AI or bounce guarantee.
V3 Volt's transient boost needs explicit estimated-horizon treatment, and Tide
bank assistance cannot be predicted past the existing unsupported first collision.
No simulated force or paid change in launch accuracy.

## World — 6

### `twilight` Twilight Undercut — retain neutral stage
Observed muted industrial geometry remains the contrast baseline. Small local
contact dust uses stage material; no background-driven forces or hidden stat
penalty. Free world still supports every new elemental outcome visibly, with
no need for bloom to identify the active edge or a frozen target.

### `tokyo` Cyber Tokyo — retain speed affinity
Observed blue skyline/diagonal rain supports +8% qualifying speed score. A short
local neon catch on a real eligible kill and baked skyline—not stronger wind,
slippery physics or unseen traffic. Environmental rain is cosmetic and distinct
from Tide's physical contact droplets. Do not sell weather art as a force field.

### `foundry` Blood Foundry — retain armor affinity
Observed warm red sun/orange pipes justify industrial armor-score identity, +12%
on eligible armored kills. Local furnace grit on contact, no lava-floor damage
or automatic enemy burn. Ember status stays recognizably target-attached against
the warm background. Danger reds must retain contrast and ordinary world geometry.

### `manga` Manga Paper — retain multi-cut composition
Observed warm paper skyline gets sparse static hatching; +10% qualifying multi-cut
score stays explicit. One cropped local panel notch on an actual multi-cut; not
an entire black/white flash on every hit. No changed gravity, chain time or enemy
stun. Real Comic push and Katana ink remain distinguishable from scenery marks.

### `synth` Synthwave Grid — retain recovery rhythm
Observed perspective grid and sunset stay physically static; +15% eligible passive
recovery is real and labelled. One resource-entry grid accent, no constantly
scrolling floor implying motion or beat-driven free FOCUS. No new music-timing
mechanic/forces. Ice/Wet effects must not be mistaken for colored grid reflections.

### `void` Pro Void — retain boss affinity
Observed black field/eclipse must preserve neutral hero/hazard keylines. Existing
+15% eligible Landlord score, no background black-hole force or armor bypass.
Only an actual equipped Void Dash may create a physical collapse well. Separate
that local active radius from the purely decorative distant eclipse; sparse
ambient dust must not look like capturable/damaging targets.

# 9. Particles are a system, not sprinkles added in draw()

## Event-owned particle records

At accepted launch/contact/status tick/thaw/projectile-hit events, create bounded
visual records containing source event ID, world position, initial velocity,
material, size, life, rotation/spin, and optional contact normal. Simulation-timed
cosmetic updates are separate from drawing. Drawing twice never spawns twice.
Use stable seeded variation so a replay/screenshot reproduces the pattern.

### Material motion contracts

| Material | Initial movement | Subsequent motion | End condition |
| --- | --- | --- | --- |
| Ink | inherited tangent + normal spray | strong drag, light gravity, little spin | shrink/dry fade |
| Ember | short outward impulse, some inherited travel | strong drag + upward drift | pale hot → orange → dark coal |
| Electrical spark | fast tangent/pin burst | fast drag, very short branches | abrupt thin taper |
| Ice chip | moderate inherited speed, faceted outward kick | weak gravity, visible spin, medium drag | small fracture/melt fade |
| Water | large drops lead, tiny spray lags | gravity arcs, moderate drag, flatten at cosmetic floor | short ripple or fade |
| Void sliver | local orbital/inward velocity | bounded inward acceleration | core collapse then dead fragments |
| Echo shard | offset along recorded path | gentle separation/drag | outline dissolves |
| Foil | sharp real projectile or separate dead curl | projectile: swept straight; dead curl: tumble/drag/gravity | attack expires on hit/solid; debris fades |
| Pixel | square active fragment or separate tiny chip | active: swept; dead: gravity + discrete visual spin | no ghost collisions after expiry |

Never attach all particles to the player's current transform. The wake segments
already emitted should stay in world space, especially after a bank changes the
body direction. Persistent aftermath has its own lifetime; `speed < 4` cannot
silently erase every effect.

## Starting budgets, to validate on target devices

- Propose **128 active harmless material particles total** on standard quality,
  **64** on low quality, replacing/merging existing cosmetic allocation where
  necessary rather than adding this on top of every old dust emitter.
- At most **24 new harmless particles across a simulation tick**; prioritize
  contact/status proof over trailing decoration. Drop background spark overflow.
- Gameplay projectiles/status objects are separately reserved and bounded:
  prototype maximum **8 active player fragment projectiles**, **2 elemental
  delayed-stroke objects** and **1 Void Dash field**. When supported combinations
  exceed those bounds, gate the ability at a declared cooldown or enlarge the
  measured reservation—never secretly drop accepted damage because art is busy.
- At most 3 local UI bursts / 24 UI flecks; separate budget from combat.
- Use baked particle stamps/ADD glows, one existing compositor, no runtime blur
  filters or stacked glow pipelines. Static icon paths are cached once.
- No Matter bodies for cosmetic particles. Gameplay fragment sweeps must be cheap
  and use existing spatial/collision helpers, not per-particle world engines.
- Low quality reduces fragments, smoke and lingering art; **never damage, freeze
  duration, projectile count or player physics**. Readable status/attack boundaries
  remain even when all optional particles are off.

# 10. Combat implementation model

## Authoritative loadout/attack profile

Introduce a pure resolved profile, conceptually:

`{ dashPower, slashGeometry, finishPower, motionProfile, statusPolicy, caps }`

The exact module/API names should follow the repo, not require a new engine.
Keep `dashElement` as a visual helper or replace its use with a resolved visual
profile. Never make a palette choice the source of a damage rule.

- `run.js` owns launch/shot state and accepted consequence events.
- `physics.js` owns player velocity, swept collision and bank response.
- `slasher.js`/combat-owned state owns enemy status clocks, target movement and
  damage-source eligibility, respecting existing tells and attacks.
- Portable art engine consumes immutable visual snapshots/events; all Canvas
  drawing remains there. Browser adapter handles surfaces and optional GL only.
- Pool secondary attacks with reserved identity/lifetime. Do not reuse living
  enemy IDs or pool bodies blindly; target marks clear on despawn/run disposal.

## Provenance and target state

Every damaging/status event needs run ID, shot ID, source ID/type, target ID,
accepted simulation tick, and explicit primary/secondary classification. A shared
hit ledger distinguishes one primary hit from legal once-only delayed hits.

Status clocks advance on actual simulation dt; pause/hidden tabs do not fast-forward
burn/freeze/replay into a surprise burst. Don't conflate renderer age, target AI
local clock and global world clock. Immunity and effect expiry are distinct timers.

Scoring, chain counting, Coil, Echo, in-run upgrades, kinetic stage, cut immunity,
armor shove and boss-specific plate rules must all use that provenance. Secondary
power may hurt/kill through the existing pipeline but cannot recursively become
another primary attack. No fake bypass through `hp--` in a drawing function.

## Shared limits and combinations

- Resolve final primary geometry once. Existing named sword-family behavior
  remains significant; a finish may adjust its envelope, not spawn an invisible
  old blade plus a new one for double damage.
- Preserve damage phase/protection checks **when delayed damage resolves**, not
  only when a target was marked. Remove attacks for despawned/protected targets
  according to their explicit rule, not by dangling entity references.
- Player speed contribution is source-owned. Removing Volt's burst cannot erase
  a rail-earned speed increment or reset the current ceiling incorrectly.
- Cap target displacement from concurrent Grav/Void/Tide, validate the final move
  against solids/allowed post bounds, and emit a truthful resistance/blocked state.
- Do not add ad hoc rules to `src/waves.js`; keep unrelated counters/directors out
  of cosmetic/attack logic. Continuous play remains chooser-free.

# 11. Icons and UI must advertise the new verb

Build the item icon from **actual observed shape + one physical action cue**:

- Ember: flame wedge enclosing one heated armor seam.
- Volt: compressed bolt splitting into one connected relay branch.
- Frost: forward facet clamping a small frozen contour.
- Tide: curled wave flattened against a bank surface.
- Void: open outer well and visibly smaller collapse core.
- Echo: solid stroke plus one delayed open copy with a timing notch.
- Ink: wide nib and a dry split tail.
- Laser: rigid emitter-to-tip line, never a crescent.
- Katana: long narrow brush edge and one bristle break.
- Glitch: attached plate seam with one delayed separation notch.
- Confetti: sharp forward flechette fan, not harmless party curls.
- Comic: broad impact face and lateral pressure marks.
- Pixel: contacted plate dividing into large square fragments.

Create 73 unique item symbols as previously requested, using actual inspected
silhouettes for the other items. Do not use the same bolt for Coil/Volt/Riot or the
same crystal for Halo/Time/Prism. Check silhouette at 20px, mono, and on the actual
card. Keep real text labels and explicit limits; icons don't replace accessibility.

Button juice should borrow material: a foil stamp for a foil purchase, crystal
seat for a prism equip, mechanical latch for iron, dry brush edge for ink. Generic
navigation stays quieter. Transaction success, not the click itself, triggers the
OWNED/EQUIPPED payoff. No double spending, queued sounds or input-blocking reveal.

# 12. Replace the shop's misleading demonstrations

The current no-target dash glide cannot prove a contact power. The shared slash
split cannot prove every weapon has a distinct physical effect.

Each attack preview needs:
1. A **neutral run** under identical initial position/velocity/target geometry.
2. The **upgraded run** with the real resolved profile and equivalent inputs.
3. One visible consequence and one limit: burn vs wall-blocked spread; freeze vs
   resistance; laser line vs off-axis miss; delayed echo vs wrong old position.
4. A short normal-speed loop; optional labelled magnified timing/geometry overlay.
5. Pause/Replay and a reduced-motion explanatory result pose.

Use a deterministic, isolated real mechanics fixture for the selected item or
recorded snapshots produced by that fixture. Do not approximate freeze, laser
reach or projectile contact in a separate hand-scripted shop model that always
splits its dummy. **The preview and gameplay must consume the same attack profile
and consequence rules.** Closed/offscreen demos stop; don't run 73 physics worlds.

Include contact normals, actual travel distance, incoming/outgoing velocities,
accepted target IDs, status lifetimes and attack-source IDs in recorded fixtures.
Pass contact data to the style-specific impact renderer; don't rely only on
`progress` and hope material particles appear by themselves.

# 13. Definition-of-done tests based on what the player can infer

## Silhouette / inference review

Before reading descriptions, a small human playtest should identify the material
and predict the main effect from short grayscale clips. Suggested acceptance
starting point: **4 of 5 reviewers identify each explicit element and its main
verb**, then report confusion pairs. This is a proposed review criterion, not a
result already measured. If ice is read as glitter, fix art/behavior—not its label.

## Causal proof

- Fire: an actual burn tick reduces legal HP/armor and moves its status cue once.
- Frost: a target's actual position/local attack timeline pauses or slows as stated.
- Water: real displacement/bank vector matches splash direction and bounds.
- Volt: measured launch difference and real relay target match the visual arc.
- Void: target enters the actual core before taking its one pulse; outer ring is safe.
- Echo: replay geometry is stored world geometry; moving player cannot drag it.
- Slash: primary/secondary contact regions match what was drawn at each phase.
- Every miss/resistant/expired state looks different from accepted success.

## Correctness / performance review

Test every timing/range boundary, same-shot/source deduplication, target death,
solids, diagonal/corner banks, maximum velocity, existing boss/armor rules, opening
and tutorials, damage immunity, score/chain economy and all representative combined
builds. Keep existing halves/decals/contact accounting rather than rebuilding them.

Then full tests/builds; native mouse/touch/keyboard flow at 960×540, 640×360,
390×844 and 844×390; muted/reduced motion; context loss/fallback; page lifecycle;
old ownership/loadouts; repeated browse/run/reset memory stability.

Measure real 2GB Android / school Chromebook frame-time percentiles, allocation,
GC and memory under **worst-case status/projectile combinations**, not just empty
movement. Keep damage/physics identical across quality levels. No locked-60-FPS
claim from Canvas captures or controlled-RAF software GL.

# 14. Implementation sequence — prove the action before painting 73 icons

### Chunk A — one vertical slice that cannot be mistaken for a reskin
Implement **Frost Dash + White Razor** first: actual target status, accepted-event
particles, thaw/resistance/immunity, real mechanics preview and tests. Compare
against baseline with names/colors hidden. If this still reads as blue glitter,
stop and redesign before building six more elements.

### Chunk B — contrasting material/force proof
Implement **Ember + Katana** and **Tide + Razor**. These exercise timed damage,
long/narrow geometry, world-space embers/drops, contact normals and real target
push/bank behavior. Validate input responsiveness, no hidden control delays and
material-specific aftermath surviving the player's stop/bank.

### Chunk C — high-speed and delayed-source proof
Implement **Volt + Laser**, then **Echo + Glitch**. Exercise burst/ceiling safety,
straight collision envelopes, relay budgets, stored stroke geometry and delayed
source ownership. Existing momentum, armor and echo-family regression tests are
mandatory; don't solve failures by disabling physics on frames.

### Chunk D — bounded fields and damaging fragments
Implement **Void**, **Confetti** and **Pixel**, then **Comic** pressure. These need
explicit spatial queries/sweeps, target force limits, reservations and nonrecursive
provenance. Balance against Coil/Prism/Echo/Anchor so paid powers remain choices,
not automatic all-enemy clearing. Tune prototype numbers only after real play.

### Chunk E — physical attachment performances
Animate the inspected heads, eyes, shells, cores and tails using their actual
trigger/state assignments above. Make feathers/ears/links/nozzles/plates move as
those objects, not just apply a universal bounce and glow. Add the 73 icons and
material purchase/equip feedback once the final verbs are stable.

### Chunk F — information, scenery, economy and release qualification
Update radar/lenses for new statuses/motion and strict forecast limits; audit
world contrast; update prices/receipts deliberately without deleting ownership.
All affected saves keep item IDs/purchases/challenges/presets. Old generic attack
passives are removed only together with their implemented replacement and truthful
receipt. Profile target hardware and finalize caps/quality controls.

## What this version deliberately stops doing

- No claiming a longer passive timer is a meaningful fire/ice power.
- No pretending colored ribbons are a physical upgrade.
- No making the demo split every target regardless of collision/damage rules.
- No forbidding burn/freeze/fragment attacks merely to preserve a cosmetic renderer.
- No adding 73 unrelated cooldown minigames, 73 Matter engines or screen-filling
  particle storms. Strong effects are local, causal and distinguishable.

**This pass delivers a revised, visually audited plan—not the implemented repair.**
The repair is complete only when the actual gameplay, collision, particles and
preview pass the causal/silhouette tests above, not when this document is longer.
