# Dimension impact frames — 2026-11-24

Major hits now produce an anime-style impact beat: a local ivory/black negative
stamp, a long split in the image, then angular glass/crack fans separating and
fading. It is screen-space artwork below the DOM HUD, not a postprocess that
moves hitboxes, pauses simulation or samples the canvas.

## Trigger and budget

- Dimension break, Landlord defeat, Crown kill, Throughcut, or a three-kill cut.
- Ordinary cuts, paper, small debris and secondary/shear hits cannot trigger it.
- Exactly one active envelope; no queue or stacked layers.
- 24 simulation ticks long; at least 90 simulation ticks between starts.
- First three ticks carry a local high-contrast contact stamp. No alternating
  polarity, full-screen white flash or repeated inversion.
- At most 12 fracture panes, no filters, readback or textures.
- Low shake reduces intensity/movement and omits the solid contact stamp.
- Motion off or shake off suppresses it; reset/field transition clears it.
- Draw calls cannot age the envelope. Only fixed renderer ticks advance it.

`createDimensionImpact()` and `drawDimensionImpact()` live in the standalone art
engine and are connected to its real event/tick/draw/reset paths. No damage,
physics stepping, camera lead, kill halves or decals were rewritten.

## Verification

Five tests cover trigger eligibility, cooldown, lifetime, snapshot isolation,
reduced motion, state-safe rendering, deterministic geometry and integration
with the actual renderer. Real-renderer frames were inspected at ink, fracture,
release, low and reduced-motion states.

Reproduce local captures (ignored artifacts):

```sh
node scripts/dimension-impact-frames.mjs
```

Outputs: `.arena/dimension-impact/`. These are canvas-only captures, not browser
HUD screenshots. No photosensitivity certification or real-device performance
claim is made.
