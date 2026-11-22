# Chunk 3 — Subtle dimensional reactions

## Scope

Implements the first visual layer of the speed/dimension plan: normal-speed wakes, launch pressure, local clean-bank marks and speed-sensitive direct-kill disturbances. This is the restrained first-room treatment, not the completed Hyper/Sonic/breach sequence or five new playable dimension types.

All effects are **cosmetic**. No damage, mass, acceleration, velocity, aiming, score, credits, drop rates, enemy AI or wave-clear requirements were changed. Physics relationships inspire the visual intensity; this does not simulate literal light speed, physical energy transfer or environmental destruction.

## Delivered

### Normal movement

A moving player periodically leaves three short dust threads, aligned with travel and lightly bent into the wake. Faster movement increases their strength within a strict cap. A faint offset seam suggests reflection lag without drawing a confusing second creature. Stationary bodies cannot emit wakes merely because a velocity value exists.

### Launches

A valid launch creates a local pressure arc behind its departure point. The intensity responds to the change in the velocity vector rather than only the final speed, so a strong redirection can read as forceful. It is an anchored local cue, not a full-screen flash, camera shake or global background warp.

### Rebounds

Only validated clean-bank events produce the new compression cue and persistent hairline mark. Generic repeated contact, floor hops and corner jitter do not feed it. The pressure bow and seam extend inward from the contact normal, behind the action.

### Normal versus fast kills

Direct enemy cuts use actual body speed at the cut. Normal-speed cuts receive a compact directional pressure cue. Faster cuts receive a stronger cue and can leave a local hairline fracture. Intensity grows nonlinearly with speed but is capped; this is a visual kinetic-energy analogy, not a damage formula.

Small fragments, paper targets, secondary sword effects and propagated shear kills do not multiply dimensional strain. The ordinary combat art for these events is unchanged.

### Room memory and rest

Marks persist across waves within the five-wave cycle. Rest immediately settles transient wakes and pressure ripples while preserving the room's marks. The marks also have bounded simulation lifetimes; starting the next five-wave cycle initializes a clean field. There is no new strain meter or currency. Full room fracture connections and a deliberate breach remain later work.

### Reduced effects

Existing motion preference controls this layer. Reduced effects omit moving dust and expanding pressure arcs, retaining small static event notches and restrained static seam marks at the same locations. No new shake, blur, full-screen strobe or additive glow was added. All effects are drawn behind pads, hazards, enemies, player and HUD.

## Architecture and budgets

- `src/dimension-field.js`: pure, import-free, deterministic visual simulation; copied state and immutable records; no DOM, random source, clock, physics or store writes.
- `src/run.js`: records actual launches, validated banks and direct cuts, then advances the visual snapshot with simulation time only during live wave play. Hit-stop/inactive simulation does not age the field.
- `src/waves.js`: initializes the field, retains it within a cycle and settles transient effects on clear.
- `src/art/splatr-art-engine.js`: owns all new Canvas drawing through exported `drawDimensionField`. The full renderer calls it in world space before gameplay actors. Drawing reads but does not mutate simulation snapshots.
- Hard caps: **18 wakes, 8 pressure impulses, 14 persistent marks**. Wake emission is rate-limited to one per seven simulation ticks. Visual intensity, lengths and strain are bounded. Off-screen records are culled while drawing. There are no decorative physics bodies or external assets.

## Verification

- Full Node suite: **450 passed, zero failures**, 101.9 seconds.
- New tests cover immutable/deterministic updates, stationary no-emission, inactive freeze, speed-sensitive kill distinction, fragment/paper/secondary exclusions, launch acceleration, bank scars, safe-rest settling, buffer caps under 6,000 synthetic impacts, expiry, fractional simulation time, portable full/reduced Canvas output, snapshot immutability, actual launched bank evidence and cycle reset.
- Existing art-engine tests still pass: import-free portable module, no DOM/store/physics writes, drawing centralized in the engine, preserved catalogue/APIs.
- `scripts/dimension-field-browser-qa.mjs`: **32 real-simulation scenes** across 1280×720, 550×720, 390×680 and 860×440. Covers normal wakes, clean banks, normal/fast real target cuts, full/reduced effects, actual actor screen bounds, one target defeat, field snapshots unchanged by drawing and zero JavaScript errors. These are controlled fixtures, not human balance tests.
- Screenshots inspected: desktop normal wake, narrow-phone bank, landscape fast kill and desktop reduced bank. Effects remain local and behind actors; reduced mode retains event marks without expansion. Initial pressure cues are intentionally faint rather than cinematic.
- Speed foundation browser QA passes five sizes; clean-bank QA passes eight scenes/four sizes; master endscreen/retry QA passes desktop/phone/landscape; rest-layout QA passes fifteen fixtures/five sizes.
- Protected combat audit: **150/150 wave clears**, zero stalls, containment/effect caps intact. This verifies operability, not human fairness or difficulty.
- Production build passes self-contained single-file verification: **617.18 kB**, gzip **252.89 kB**, artifact **602.7 KiB**.

Scratch evidence/logs: `.arena/dimension-field/` (excluded from durable repository snapshots). Tests, browser script and this document are durable.

## Limits and next work

No human perception/comfort study, native-device performance proof, sustained frame-time benchmark, new long soak or retention gain is claimed. Buffer caps are not equivalent to measured frame-rate guarantees.

This chunk does not implement physically deformable walls, actual reflective surfaces, new dimension gameplay, aura spending, revised kill credits, a new damage model or mandatory pace gates. Next: unify rising speed, retained room strain and the five-wave milestone into readable breakthrough preparation, followed by a deliberately triggered breach. Human testing should establish whether ordinary-speed effects are noticeable enough without interfering with enemies before increasing their intensity.
