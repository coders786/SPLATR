# Chunk 2 — Controlled clean banks

## Delivered

A wave-specific clean-bank skill layer now recognizes real wall arrivals, lets an inward aim steer the exit, and supplies restrained HUD/audio feedback. Existing direct-release aiming, floor recovery, finite enemies, legacy rail rewards and recoverable pace practice remain. This chunk adds no currency, score multiplier, mandatory speed gate, Hyper/Sonic rewrite, breach or dimensional VFX.

### Recognition

`src/clean-banks.js` is a pure, import-free model. It returns copied state/events and cannot write physics, the DOM, equipment or storage.

A clean bank requires:

- A prior real launch in the current wave. Falling onto the floor alone does not arm it.
- A real physics contact on a side wall or ceiling, not an arbitrary nearby position.
- Incoming speed at least the wave's pace target, a meaningful closing component (at least half the target), and an outgoing speed retaining at least 70% of incoming speed.
- No corner contact within 90 world pixels of an adjacent boundary.
- Between subsequent banks: 24 simulation ticks, departure to a 64-pixel boundary clearance and at least 140 pixels of measured traversal after departing. Travel is bounded by actual movement/speed; jitter before departure cannot bank route credit.

Physics publishes incoming velocity alongside the existing rail contact. Repeated solver contact ticks cannot create clean events. The floor disarms recognition and ends the chain; another launch is needed. Prolonged slowing or a long interval ends the current chain without deleting the wave's total or best chain. Rest, entry grace, tutorial, death, paused/inactive and hit-stop simulation cannot advance the clean-bank layer.

### Steering

Hold an inward aim before wall contact to steer the rebound. Pointer aiming and keyboard aiming use the existing focus/aim path; no extra mandatory button was added.

Steering rotates the already-resolved exit velocity, preserving its magnitude. The outgoing direction is constrained to an inward 120-degree cone (±60 degrees from the inward normal). Outward, missing or invalid aim leaves the ordinary reflection alone. A steered bank receives the existing eight-tick launch-direction grace so ordinary ascent limits do not immediately erase the chosen direction. It does not create an additional speed multiplier, edge refund, permanent acceleration or free dash.

Legacy rail boost/refund behavior is preserved; it is distinct from this stricter skill recognition. Steering and clean-bank feedback apply only to live wave combat.

### Feedback and teaching

- The existing pace panel shows CLEAN BANK or STEERED BANK, speed retained, and chain count when relevant. After the short event receipt it shows the wave total/best chain; before the first bank it explains inward steering.
- Retention is a capped kept-speed fraction (up to 100%), not a claim that ordinary rail boosts cannot add speed.
- Wave generic bank announcements no longer compete with validated clean-bank feedback. Non-wave feedback remains unchanged. Existing engine-owned impact art is reused; no new screen flash or camera effect was added.
- The clear report records clean-bank total and best chain in state; its compact visible receipt includes the total.
- The second Cut Technique teaching lesson is now CLEAN BANK. Only validated `cleanBank` events advance it; generic banks, floor kicks and non-live/tutorial events cannot.
- Speed display begins at its first real live sample instead of visibly ramping from a fictitious zero at launch. Subsequent display smoothing remains. On a validated bank's clamp tick, pace reads actual exit velocity once rather than mistaking shortened clamp displacement for a stall. Non-bank/stuck bodies retain displacement-bounded sampling.

## Verification

- Final full Node suite: **444 passed, zero failures**, 84.0 seconds, after the clamp-tick integration refinement. Focused bank/pace/wave/learning suite: **17 passed**.
- New deterministic bank tests cover launch requirement, incoming/normal speed, retention, duplicate contacts, corner rejection, separation/traversal, jitter credit, teleport without traversal, chaining, floor disarm, cooldown under slow time, inactive freeze, inward cone, speed-preserving rotation and real physics normal/steered arrivals. A lesson test covers generic-contact/floor/tutorial exclusion.
- `scripts/clean-bank-browser-qa.mjs`: eight real-physics scenes (normal and steered) at 1280×720, 550×720, 390×680 and 860×440; one clean event, expected steering, inward velocity, HUD bounds, actor screen bounds, zero JavaScript errors. Screenshots generated and inspected for desktop, narrow phone and landscape. The fixture initializes the camera at its near-wall setup position rather than allowing a test-only teleport to leave the actor out of view.
- `scripts/speed-foundation-browser-qa.mjs`: five-size real-app HUD/Space-start checks remain passing.
- `scripts/master-browser-qa.mjs`: desktop/phone/landscape results/buttons/retry remain passing.
- `scripts/rest-choice-layout-browser-qa.mjs`: fifteen rest-layout fixtures remain passing.
- `scripts/encounter-combat-audit.mjs`: **150/150 protected wave clears**, zero stalls, containment/effect limits retained. This is an operability audit, not human difficulty evidence.
- Final production single-file build passes: **612.42 kB**, gzip **251.23 kB**, self-contained artifact **598.1 KiB**.

Scratch logs/screenshots are under `.arena/clean-banks/` (excluded from durable snapshots). Tests, scripts and this record are durable.

## Limits / next chunk

Steering requires deliberate inward aim at contact; this is not continuous free steering or automatic target snapping. Clean banks award no extra currency and do not unlock Shatter yet. Thresholds remain prototype tuning values. No unfamiliar-player study, native-device proof, fresh long soak, retention or enjoyment result is claimed.

Next chunk: subtle normal-speed environmental reactions, then stronger acceleration/rebound/kill feedback feeding persistent dimensional strain, while keeping enemies and collision edges readable.
