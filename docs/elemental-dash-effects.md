# Procedural elemental dash pass

## Research and application
- https://canmom.art/animation/smears — detailed animation analysis: a smear bridges fast poses and creates contrast; it should not replace the readable character for an entire action. Applied as a brief two-tick directional shape with the hero drawn cleanly in front, followed by a rapidly decaying wake.
- https://www.21-draw.com/12-principles-of-animation/ — anticipation, timing and spacing. Existing pull-back aiming is anticipation; release is immediate. Exponential length contraction and cubic speed-slit contraction provide nonlinear spacing, followed by quadratic opacity decay. No gameplay tween, delayed launch or physics interpolation was introduced.

These are general animation references, not a reconstruction of specific JJK footage. No full-screen impact flash, color inversion or extra camera shake was added.

## Equipment identity, not a new damage system
`dashElement(equipment,sword)` chooses one presentation identity with deterministic precedence:
1. sun/forge/wyrm build: fire
2. storm/sentinel build, coil or laser: lightning
3. glacier build or time core: ice
4. phantom/wraith/arcade build or echo core: echo
5. king/eater/orbit build or grav core: void
6. wings or magnet: water
7. blaze or riot: fire
8. other equipment: ink

This intentionally changes no damage, collision, attack windows, inventory, unlocks, sword profiles or rewards. Water is a visual metaphor for existing flowing/polar equipment, not a newly purchasable water power. Hybrid recipes remain undisclosed in the player UI.

## Distinct procedural geometry
- Ink: torn black wedge and broken paper-white dry-brush lines.
- Fire: layered offset tapered tongues in hot orange/gold.
- Lightning: angular double zigzags with two small branch forks.
- Ice: separated diamond shards rather than a continuous glow ribbon.
- Water: paired curved bezier ribbons folding toward the wake.
- Void: three compressed inward crescent contours and inward-pointing accents.
- Echo: three broken, shrinking square-shell contours, not full duplicate characters.

All follow current velocity (including bank direction), stay local (maximum wake length 180 world units), and render behind the hero. No random particles, filters, unbounded lists or texture assets. The generic trail is not drawn simultaneously during the effect window. Slow motion (<4 units/tick), invalid input, expired age and motion-off draw nothing. Each save/restore is paired. Pure engine stays free of imports/DOM/game-state mutation.

Timing: strongest connection smear in the first three ticks; distinctive geometry decays over at most 20 ticks (~333ms at 60Hz). The existing clean character and weapon remain the focal point. Snapshot visuals also call the shared effect if their captured player includes velocity; they do not invent movement for static actors.

## Validation
- Added four deterministic tests: identity mapping, all seven silhouettes distinct by alpha geometry (not merely hue), stable render, suppression/expiry/invalid data, context restoration and frozen input.
- Full suite: 499/499 PASS, 154.7s.
- Browser: seven timing studies and 21 actual-renderer fixtures over 1280x720, 390x680, 860x440. Zero JS errors. Tests wait for initial ResizeObserver callback before drawing and assert nonblank pixels. Earlier blank screenshot was a harness ordering error, corrected before reporting success.
- Inspected timing-study and actual fire gameplay screenshots. Hero stays visible; effects do not cross the whole screen.
- Prior-plan regression: all eleven boost choices across 16 rest layouts/four sizes, idle pixel stability and no dialog scrolling PASS.
- Master browser: end-card/buttons fit, retry, no scroll/no JS errors at three sizes PASS.
- Production self-contained build: 705.06 kB, gzip 279.01 kB.

QA screenshots: `.arena/elemental-dash/timing-study.png`, `.arena/elemental-dash/fire-live.png`.

## Remaining previous-plan validation: unfamiliar-player protocol
Not executed: this environment has no recruited players or real low-end handset. Automated/synthetic checks do not measure comprehension, comfort or retention.

Recruit 5–8 unfamiliar players; show only the game. Do not explain controls or define the card names. Record:
1. Launch and clear a wave with no verbal assistance. Note first incorrect input and any request for help.
2. Before choosing a card: ask "What changes if you choose this? How long does it last? What do you lose?" Record verbatim; do not correct until the task ends.
3. Let the player buy/equip a Shop item, return to play, identify their current upgrade and retry. Observe whether buy versus equip and temporary versus permanent are understood.
4. Show dash clips without labels/color, randomized order; ask which are different and what visual cue distinguishes them. Do not imply they confer extra damage.
5. Ask about discomfort after 2 minutes with effects on and offer motion-off immediately. Stop on any symptoms; do not require an exposure comparison.
6. On real Android hardware measure frame pacing through chained launches, bank turns, background/resume and a ten-minute session. Collect p95/p99 frame times rather than only average FPS.

Provisional release gates (not achieved claims): at least 4/5 correctly predict a card benefit and its lifetime without coaching; no hidden/unreachable actions; every participant can disable effects; resolve any motion-discomfort report before widening beta. Compare wrong choices and requests for help against the prior build rather than declaring success from preference alone.
