# Combat engagement and health feedback

## Diagnosis

An ordinary run is deliberately frozen in `ready` until the first launch. Practice also prevents health damage. In the previous first-wave setup, the 60-tick entry freeze was followed by staggered 95–190 tick cooldowns. All twelve enemies were Fangs. Fangs could begin a 24-tick rush from 440 units away, even though their normal-speed rush travels about 259 units plus collision radii. Against a stationary player in controlled simulation, the warning and charge could therefore happen without reaching the player.

Before tuning, 12 stationary wave-one fixtures (playing state entered directly, no movement or attacks) produced the first tell at ticks 155–231 in 11 seeds; seed 9 produced none in 900 ticks. First health loss occurred at ticks 244–516 in those 11 seeds, and none in seed 9. These are fixed-step fixture observations, not player telemetry or wall-clock guarantees.

## Changes

- The first wave places its nearest safe Fang first and a Pulse nearby, retaining the finite 12-enemy budget, safe spawn exclusion, deterministic formations and a single early-wave threat slot. Entry is 30 simulation ticks; the first Fang has a 25-tick cooldown after entry. Other cooldowns and bounded pursuit are faster.
- A Fang waits until the player is within approximately its actual 24-tick rush reach before starting a tell. The existing 66-tick Fang warning and 24-tick rush remain intact; moving out of its fixed lane can still evade it. Pulse keeps its full warning and real expanding ring.
- Enemy intent badges are larger. The in-run status explains the actual ready state, safe body contact, early parry, a recorded block, wave-entry protection, and post-hit invulnerability. Actual health loss still records the source; a ward, Iron, parry or same-enemy cut grace never creates a damage receipt.
- Idle, tell and recovery body overlap remain harmless. Only a Fang in an active rush hurts by enemy body contact. Other enemy attacks damage through their own live hazards. Attacks can miss or be cut/parried; a 132-simulation-tick post-hit invulnerability window prevents repeated immediate losses. Wave wards, Iron's rush guard, and same-enemy cut grace can also block particular hits. Timers scale with simulation time; focus, hit-stop and frame pacing affect real elapsed time.

In the current controlled fixture, launching and then stopping the player without further input across seeds 0–29 produces a Fang tell at tick 55, the full 66-tick warning, and actual Fang-rush health loss around tick 130–131. This is a regression fixture, not forced damage or evidence that players will remain in the lane. A separate fixture moves the player perpendicular to the warned lane and verifies no health loss from that charge.

## Verification and limits

`test/combat-engagement.test.js` covers ready/launch gating, varied seeds, warning duration, actual hit attribution, safe contacts, blocked hits, reach and dodging. `scripts/combat-engagement-browser-qa.mjs` checks actual run state and HUD at desktop, phone and landscape sizes with motion enabled and reduced; the stationary post-launch input is deliberately controlled. Existing contact, hazards, camera independence and teaching tests remain relevant. Automated tests do not establish subjective fairness or comprehension; human playtesting is still needed.
