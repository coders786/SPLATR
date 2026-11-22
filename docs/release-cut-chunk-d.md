# Roadmap Chunk D — Release Cut and Settling World

Replaced the previous six-pane shatter burst with a local material release following the genuine crossing angle. Successful shatter eligibility, traversal radius, speed/shot checks, movement, rewards and platform mechanics remain unchanged.

## Sequence

1. Connection: narrow high-contrast cut on the real crossing direction, gone within seven simulation ticks.
2. Separation: two unequal local surface sections peel across the cut. Offset dark undersides and short folded edges give thickness without a wireframe crystal.
3. Fracture: three unequal corner fragments detach, not a radial ring.
4. Reveal: clipped quiet underlayer stays stationary in world orientation. Foundry/Tokyo show service beams; foundry has a restrained furnace-depth patch; manga shows underdrawing, registration and incomplete halftone; void/synth expose missing/displaced contours; default shows muted structural silhouettes. No unrelated texture or swirling tunnel.
5. Clearance: squared opacity falloff rapidly subdues the cut site. Existing transient lifecycle remains 64 ticks. A small fixed displaced-seam trace remains during rest and clears on next-wave spawn.

After a genuine shatter, the platform receives one restrained under-deck settling cue during its first 28 ticks. No additional platform motion, physical impulse, camera shake or pause. Skipping the breach does not create release artwork, trace or shatter-specific settling.

Reduced motion uses fixed peel/fragment geometry and opacity expiry rather than travelling/rotating pieces. Artwork draws behind actors. No fullscreen flashes, inversion, canvas-copy distortion, filters, RNG or renderer-side gameplay writes.

## Validation

- 564/564 full Node tests passed.
- Three new tests: distinct world construction, crossing-angle sensitivity, local bounds/expiry; rapid contrast reduction and context restoration for release/trace/settlement; actual successful crossing creates evidence exactly once, skipping cannot, next wave clears it.
- scripts/release-cut-browser-qa.mjs: 96 captures from real successful crossings = four worlds × three sizes × full/reduced × ages 1/12/40/70. Initial success is produced by actual dash/crossing; prerequisite Sonic state is fixture setup. For late-art inspection only, fixture holds the actor above the deck by resetting position/velocity each tick to avoid the chooser freezing simulation early. Checks one genuine shatter, existing rest platform, persistent evidence, transient expiry, unchanged wave state during draw, visible actor, zero page errors.
- Foundry phone separation and manga phone reduced aftermath inspected. The actor remains visible; platform has stronger contrast by the quiet phase.
- 48 sealed/ready/rejection seam regression scenes passed.
- 16 magnet/return-camera/edge-route regression scenes passed.
- Single-file production build passed: 743.13 kB / gzip 290.50 kB.
- Captures .arena/release-cut/; logs .arena/icons/release-cut-{focused,tests,build,browser,stitch,platform}.log.

These deterministic checks do not establish real-device comfort/frame pacing or unfamiliar-player recognition. No automatic upgrade choice or change to rest safety/collision boundaries. Rest evidence is decorative, not an open path or persistent level destruction.
