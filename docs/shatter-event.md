# The Shatter Event & the SHATTERED arena — CHUNK 3

At 100% FRACTURE the meter fires by itself, once per run: the bar is spent,
the cube holds for six ticks, the hull gains a point (never less than 2),
the dash refills to full, and the arena the rest of the run is played in
itself becomes the monster — pinball rails, and a kinetic charge that turns
every border contact into a countdown to an OVERCHARGED, lethal cut.

## 1. The trigger and what it does

`gainFracture` is the only way the meter fills. At the top of each field
tick — never inside the opening lesson, and only in phase `playing` — the
run checks `s.fracture.pct >= FRACTURE_MAX` (100). The tick AFTER the gain
that filled the bar fires `shatterEvent()` exactly once per run
(`s.shatterDone`; every reset path clears it). Firing it consumes the
meter via `consumeFracture(state)` (`src/fracture.js`): pct 0, tier/sky
reset, returns the spent value.

The event, in order:

1. `world.arenaMode = state.arenaMode = 'SHATTERED'` — the gate every
   SHATTERED code path reads (rails, floor, ceiling bleed, renderer, cuts).
2. `s.stop = Math.max(s.stop, 6)` — the existing entity-only hitstop:
   `stepPhysics` does not integrate for six ticks and enemy contact zones
   freeze, while the camera, springs and effect clocks keep running — the
   still-image-of-the-moment reading of "freeze", not a dead render.
3. Hull +1 (`s.hpMax` cap), **floor of 2** — a 1-hull cube survives the
   tear at 2; nobody walks away from the end of the world on one hit.
4. Dash refilled (`s.edge = edgeMax`, recharge/buffer cleared) — the tear
   hands you the launch to spend the arena with.
5. Kinetic ladder reset to ×1.
6. `s.shatter = 78` — the singularity-flash clock the renderer reads
   (~1.3s at 60Hz; ticks every frame, including hitstop).
7. `shatterEvent` is emitted.

**The shell's half** (`src/main.js`, `case 'shatterEvent'`): persists
`riot.fracturePct = 0` (a reload cannot resurrect 100), flips all three
fracture mounts to 0/STABLE (out of SHATTER EVENT READY), `audio.shatter()`,
a long `ALL FOUR BORDERS ARE LIVE` callout, `buzz(70)`. A
`kineticOvercharge` event becomes `OVERCHARGED — LETHAL`; a
`kineticStage` event flows through for the aura-equipped HUD to ride.

## 2. SHATTERED physics — the rails pay back

Constants: `PINBALL_RESTITUTION = 1.3`, `MAX_PINBALL_SPEED = 320` (the
absolute ceiling, already imported by Chunk 2 for the launch clamp),
`SHATTER_FLOOR_MIN = 8` px/tick.

- **Sides / ceiling.** Below-ARRIVE arrivals zero out as before. Real
  arrivals reflect at 1.30x (was 0.85 / 0.9), capped at MAX_PINBALL_SPEED,
  `v.y` hopped upward-only as usual, `wallIgnore` respected,
  `world.bumped = true` published (the one-tick ladder feed; mirrors
  `world.floorKick`).
- **Floor.** An arrival at ≥ `SHATTER_FLOOR_MIN` is a bumper too: 1.30x
  reflect, capped, `floorKick = {vy, speed, rescue: false}` and
  `world.bumped = true`. **A 1.3x slap pays speed, never a dash pip** —
  otherwise the floor is a pip farm. A gentler fall keeps the trampoline
  kick exactly as before (one pip below cap; the anti-softlock rescue is
  not negotiable), with `floorIgnore` (12 ticks) unchanged.
- **The reflect has to survive the substep cap.** `capVelocity` runs after
  every Matter substep, so every SHATTERED reflect raises
  `world.playerCeiling` to the reflected speed (the same mechanism every
  bank reward uses). The ordinary ceiling bleed (0.22/tick toward
  `MAX_SPEED * dashSpeed`) eases it back over ~hundreds of ticks — a bank
  is fast for a while, not forever.
- **The rail-bank ratchet** in the run (the ordinary CHAIN-beyond-the-limit
  machinery) opens to `MAX_PINBALL_SPEED` when `arenaMode === 'SHATTERED'`:
  its `CEIL` is 320 and the rally lift keeps `max(ceiling, arrival) + 1.6`
  — it can never pull the ceiling back under the reflect the physics just
  threw.
- **Envelope.** `flightEnvelope`'s `arenaMode === 'SHATTERED'` branch
  (reserved in Chunk 2) already exempts the ascent/fall clamps; drag-launch
  momentum preservation and the `dash()` ceiling ratchet (Chunk 2) are
  unchanged. Only `MAX_PINBALL_SPEED` bounds a SHATTERED flight.
- Non-SHATTERED play is byte-identical: `railBounce` computes `SHATTERED`
  once; every other rail behaves exactly as before (pinned by
  `test/chunk3.test.js`).

## 3. The kinetic charge — border banks, paid in force

Every processed `world.bumped` raises the ladder one stage, only in
SHATTERED: **×1 → ×2 → ×3 → OVERCHARGED (stage 4)**, capped at 4.
`kineticStage` events fire on 2 and 3; `kineticOvercharge` fires on 4.
Resting (pad contact, `world.grounded`) drains the ladder to ×1.

The cut reads the stage before draining it:

```
kin  = min(4, max(1, kineticStage))     (1 outside SHATTERED)
e.hp -= kin >= 4 ? e.hp + 1 : baseDamage * kin
```

OVERCHARGED is **lethal outright** — plates, Crowns, Bastions, paper, the
works — and any cut (any stage) drains the ladder back to ×1. A Bastion
plate killed this way never existed.

**The aura** (art engine): ×2 ring cyan `#9bf6ff`, ×3 magenta `#ff5db1`,
×4 white with orbiting flecks and `F=m·a` etched beneath the cube; a darker
second ring for ×3+; all gated behind `arenaMode === 'SHATTERED'` and drawn
in the cube's local space. Motion-gated pulse; static under Reduce Motion.

## 4. The look

- **The flash** (`drawShatteredSky`, while `s.shatter > 0`): a white-hot
  radial bloom burns out by ~46% of the clock; a black accretion-ringed disc
  swells from a point and collapses out of existence; the ember-lit shard
  field fades in around it.
- **The sky after** (same function, clock drained): 12–16 slabs of plum
  night, count and layout hash-seeded (`hash(4242, …)` — deterministic per
  shard index), ember light burning up from below the world, a hot
  under-rim on every shard and a hairline seam on its face. Static geometry;
  only the breathing pulse and ember glow animate, and both freeze under
  Reduce Motion / Screen Shake OFF.
- **The rails** (`drawShatteredRails`): live-wire neon on the four
  border lines — wide pink glow, cyan core, white-hot inner line, corner
  nodes; motion-gated pulse. Drawn before the world transform, like the
  fracture sky it replaces at `s.arenaMode === 'SHATTERED' || s.shatter > 0`.
- A late-arriving rendering bug, caught by QA: the two new primitives were
  first injected *inside* `drawEquipmentWorld` (after its opening line), so
  the module never saw them — `drawShatteredSky is not defined`, thrown on
  the first SHATTERED frame, took the render loop down with it and froze
  the flash clock at 77. They are module-scope now, and the
  chunk2-reserved "sky stays shards after the spend" behavior holds.

## 5. Decisions and deliberate deviations

- **1.3x floor slaps pay no dash pip** (farm prevention). The gentle-fall
  trampoline rescue still pays one pip — the anti-softlock is untouched.
- **Six-tick hold = entity-only hitstop**, the game's existing semantic;
  not a full stop of the world (camera/FX keep breathing).
- **The tear is a field event**: gated on `phase === 'playing' && !s.opening`,
  so a stored-100 profile cannot detonate the lesson racks mid-tutorial.
- **SHATTERED persists for the rest of the run**; reset blocks
  (`enterField`, `resetRunState`, new run) clear `arenaMode`,
  `kineticStage/Bounces`, `shatter`, `shatterDone`.
- **The meter stays spendable/rebuildable**: pct rebuilds at the usual
  0.4/kill, +2.5/wave, +6/shatter rates; the result screen shows both the
  spend (`+x.x THIS RUN` tracks the rebuild) and the persistent remainder.
- **The 0-pip floor anti-softlock still pays** (`railAway` + edge === 0)
  even off a SHATTERED slam — that rescue is a rule, not a reward.

## 6. Verification

- `npm test`: **692 passing** (16 new in `test/chunk3.test.js`): meter
  spend, trigger exactly-once semantics, hull floor of 2, dash refill,
  1.3x side/ceiling/floor reflects with the 320 cap, trampoline rescue
  below `SHATTER_FLOOR_MIN`, kinetic ladder raise/drain/lethal semantics,
  and non-SHATTERED byte-identity.
- `qa-browser/chunk3-qa.mjs` (targets :5173, debug handle): a stored-100
  profile tears on the first field tick of the drag that starts play —
  SHATTERED recorded, pct 0 everywhere (HUD, storage, result debrief),
  flash clock drains 77 → 0, **kineticStage climbed to 2–3 from ordinary
  rail banks during play**, RUN ENDED shows the honest remainder, Reduce
  Motion tears cleanly, a fresh profile does nothing, and the run ends
  with **zero page errors**. Screenshots: `qa-browser/shot3-*.png`.
- Not yet seen live: an OVERCHARGED one-shot in the browser build (the
  lethal path is headless-verified), and the flash/shards have been
  verified by state, log and render stability — not by eye.

## Chunk 4 (MONOLITH) — delivered

Superseded: the Monolith has been built. See `docs/monolith.md` — the tear's
landlord now answers in the seam on torn fields, in both directors.
