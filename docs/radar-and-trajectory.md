# Radar and trajectory viewer

## Plan and implementation

Restore the missing pointer trajectory, retain a useful free baseline, and make radar and trajectory independent, persistent equipment slots. Each paid tier is bought with the existing in-game CREDITS, then equipped; tiers are alternatives, not mandatory sequential purchases. All tiers can be previewed for free in the Shop under **RADAR** and **VECTOR**. Existing profiles and presets migrate to the free defaults.

| Slot | Level | Price | Visible information |
| --- | --- | ---: | --- |
| Radar | Field Radar | Free | Local real enemy and objective markers |
| Radar | Long-Range Array | 1,200 | 35% greater range |
| Radar | Threat Array | 3,000 | 70% greater range and active hazard markers |
| Radar | Oracle Array | 6,500 | 120% greater range, active hazards, live tell rings and current heading |
| Vector | Field Trajectory | Free | Short launch path while aiming |
| Vector | Vector Lens | 1,200 | Extended path |
| Vector | Impact Lens | 3,000 | Longer path and time ticks |
| Vector | Oracle Lens | 6,500 | Longest path and a compact speed, angle and impact-time estimate |

The radar uses existing live combat data, not invented threats. Increased range compresses the same view into the existing compact panel. The path uses the actual adjusted/magnetized release vector and the existing release physics samples. It stops at the first static solid or analytic arena rail; the estimate is a snapshot of current target positions, not a promise about moving enemies, future hazards or rebound paths. Angle is screen-space (negative is upward); speed is in world pixels per simulation tick. The upgrades add information and presentation, not movement, damage or targeting bonuses. The first-time visual course keeps its existing uncluttered presentation.

## Verification

`test/sensor-upgrades.test.js` checks migration, prices, ownership, insufficient funds, tier selection, real radar ranges and hazard/tell rendering, rail collision prediction, preview drawing, canvas state and the real pointer-aim renderer. Existing launch-agreement tests compare the calculated free-flight samples with the actual physics engine. `scripts/sensor-upgrades-browser-qa.mjs` exercises purchase/equip/reload, insufficient funds and native mouse/touch aiming on desktop, phone and landscape, with and without reduced motion. Its screenshots live in the disposable `.arena/sensors/` directory.
