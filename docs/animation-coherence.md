# Animation coherence contract

This renderer uses one causal owner for each visible event. A visual may add
measured evidence of the event, but it must not invent a second direction,
clock, contact, or hazard.

| Event | Authoritative source | Primary visual | Allowed evidence | Explicitly not stacked |
| --- | --- | --- | --- | --- |
| Dash | `state.launchAngle`, `state.slashAge` | one elemental launch wake | launch dust, brake sparks, after-images sampled from real positions, body deformation | cube smear cels, local lead/trail marks, generic speed wedge, generic airborne smear |
| Slash/contact | contact snapshot and the committed slash angle | blade or sword | one local contact burst plus actual shards | a generic impact wave for a cut |
| Fall/landing | `fallAge`, measured downward velocity, `landAge`, and `grounded` | fall pose or grounded squash | upward fall streaks and a grounded ring | a landing ring while airborne |
| Bank | real rail contact and inward normal | dimension-field frame bite | measured bank scar and a bank-owned boom when applicable | generic impact wave or a second generic boom |
| Hurt/death | immutable contact snapshot and fatal state | local damage reaction | fracture and damage stain | slash/contact geometry |
| Enemy tell | enemy `mode`, `clock`, `span`, and `aim` | warning attached to the enemy | the separately launched active hazard | treating a tell as the hazard itself |
| THE WATCH | teaching callbacks and real rehearsal phase | tutorial guidance/watch scene | real tell, resolve, hurt, miss, and retry states | a fabricated tutorial-only combat result |

## Dash direction ownership

`run.dash()` records `state.launchAngle`. During the dash lifetime, renderer
layers use that bearing even if the physics velocity changes after a rail
reflection, bank, collision, or steering update. Velocity magnitude may shape
an envelope; it may not redirect the wake, dust, deformation, or brake marks.

The position sampler is different: its job is to show where the cube really
was. It may supply trailing evidence, but it is not allowed to become another
velocity-derived direction source. `dashFor(age, vx, vy, launchAngle)` keeps the
velocity-only form for pure animation callers and previews while the production
renderer always supplies the launch snapshot when one exists.

The gameplay dash stack therefore has three readable jobs:

1. one elemental wake says **which way the launch committed**;
2. dust and sparks punctuate launch and brake events;
3. the body deformation and measured after-images say **when and how far the
   cube moved**.

The standalone cube-smear painter remains available for the shop/lab art API,
but production gameplay does not draw it on top of the wake.

## Test contract

Renderer tests must drive `createRun`/`createRenderer` and inspect the recording
canvas, not only call a pure curve. Direction tests mutate velocity after a
real launch and verify the drawn launch geometry still uses `launchAngle`.
Event tests use real contact snapshots and bank state, then verify draw order,
paint, alpha, transforms, and suppression of contradictory layers.
