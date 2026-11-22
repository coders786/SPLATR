# Camera independence and core-loop UX patch

## Root cause and correction

The user's camera/enemy report was a real simulation bug, not merely a rendering
issue. `src/slasher.js` used `world.viewport` to mutate existing actors:

1. First camera entry could remove an enemy for failing screen-space spawn rules.
2. An offscreen timeout could delete it after 120 ticks.
3. Fang/Prism/Crown X coordinates and velocity were clamped/reflected against the
   moving viewport, pulling actors along with the camera.
4. Crown repositioning and Rift destinations used viewport-safe fallback points.

These existing-actor camera dependencies were removed. Enemies remain in world
space and obey world-arena containment, player-distance AI and telegraphed world
positions. The camera still controls projection/culling, radar and placement of
NEW viewport-watchdog spawns; it does not retroactively move or delete enemies.
World-stream lifecycle and actual combat removals remain legitimate.

The earlier first-entry recycling test asserted the wrong behavior and has been
replaced, not preserved as an acceptance rule. A new regression advances two
identical AI worlds for 400 ticks while only one receives extreme alternating
camera pans/zooms. IDs/counts, coordinates, velocities, modes and destinations
must remain identical every tick across Fang, Prism, Crown, Rift and Bastion.

## Core-loop UX work implemented

- Removed the permanent three quest text rows under Score. Added three compact,
  shape-redundant pips in a usable button; Pause contains full quest/prize details.
- Q or the pip button toggles the noninteractive quick-peek panel. Escape closes
  it without also pausing. Blur, menu, run end and retry clear peek state.
  Tab retains native navigation. This release provides toggle peek, not a
  separately configured hold-to-peek mode.
- Single 1.2-second contextual progress/completion toast; ordinary milestone
  announcements are throttled/coalesced rather than queued for every Fang hit.
- Omitted zero ink from result copy, named saved prize points explicitly, added
  points-left text and near-goal gold emphasis; shortened fill-animation delay.
  Existing prices, real balances, selected quests and carry rules are unchanged.
- Radar microtext removed. Only its background yields on actual player-body
  overlap; markers keep contrast. No expanded 48px whole-panel fade.
- Ghost emission/aging moved from draw to fixed update and gated to active dash;
  residual ghosts are short-lived, drift clears dash traces, and reset clears
  all transient lists. Cosmetic tick age no longer slows during held aim.
- Final body envelope applies during connected cuts/impact/landing, not only
  quiet airborne poses. Explicit wall splat remains a separate animation.
- Contact batches use one attack eligibility snapshot; six Fang-cluster contact
  permutations verify three cuts without hull loss. No blanket invulnerability
  was added for unrelated hazards.

## Verification performed

- **301/301 automated tests PASS**, duration 59.7s.
- Production build PASS: **408.14 kB**, gzip **182.00 kB**, single-file check PASS.
- Real Chromium (Puppeteer, no Playwright), loading the built HTML through
  `file://`: 1280×720, 550×720 and 860×440. Checks include no live quest rows,
  three pips, Q/Escape peek behavior, full Pause quest rows, end-card/button
  bounds, no result scrolling, Retry and zero JavaScript errors. Pause captures
  were also generated and the 860×440 layout inspected.
- Existing controller/canvas Vault grant/Bank exercise still passes.
- `git diff --check` clean.

### Independent Python pixel verification

`node scripts/camera-image-qa.mjs` produces real Skia-rendered before/after
camera-pan PNGs with unchanged world actors. Python/Pillow then reads the actual
pixels, detects the Fang in both frames, measures its centroid displacement and
compares it with camera projection metadata:

```
world_position_unchanged: true
enemy_visible_in_both_images: true
expected_screen_dx: -86.61654135338347
measured_pixel_dx: -86.65145903042566
projection_error_px: 0.034917677042187734
```

Run `python3 scripts/verify-camera-images.py` with Pillow available. This sandbox
installed it locally under `.cache/python` (not system-wide), so the invocation
was `PYTHONPATH=.cache/python python3 scripts/verify-camera-images.py`.
Generated comparison/report files live under `.arena/camera-qa/` and are ignored.
This is deterministic image verification, not an exhaustive procedural-seed or
native-pointer gameplay playtest.

## Server state and remaining scope

**All SPLATR development servers are stopped**, as requested. Browser checks
used the built file directly; no replacement server was started.

This implements the urgent camera correction and primary clarity/input work
from `next-iteration-research-plan.md`. It does not claim implementation of the
optional alternative STYLE quest, a new starter-credit economy, full settlement
rollover choreography, a general combat trace exporter, or a human usability/
retention study. Those remain separate work; no fake progress or auto-swapping
quests was introduced.
