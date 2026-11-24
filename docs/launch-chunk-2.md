# Launch fix — Chunk 2: the three-colour law, safe-to-slice, and the hit you can read

Scope: **Module 2** of the unified launch fix doc, built on Chunk 1's modules
rather than beside them. Module 2 asks for three things and this pass delivers
all three: a strict colour law, a *visible* "safe to slice" state on what the
current blade can actually cut, and polish on the damage reaction (the
slow-motion window and a pointer that names its attacker).

Nothing here changes controls, scoring, wave rules or hit geometry. The two new
modules are pure and headless-tested; the art engine paints their output.

## What the player can now see

| Report complaint | Now |
| --- | --- |
| "I cannot tell what is dangerous and what is a target. Everything is pink." | **Three voices, and only three.** Green = you may cut this. Red = this hurts. Gold = this pays. Bodies are never green: the enemy palette is *asserted* off the safe band by a test that re-reads the engine's own literals. |
| Nothing told you whether the thing in front of you was cuttable | A **green bracket** appears on exactly the bodies the live blade would reach — computed from the same `sweepGeometry` the hit test uses, so it cannot promise a cut the swing would refuse. Four corner ticks, a dark underlay, one pip. No body, no blade → **no mark at all** (frame 02 proves the honesty). |
| Armour and bounties were indistinguishable from ordinary targets | The bracket stays green (it is still a cut) and gains **a red notch** for plates (Bastion, Crown, Landlord: *you can cut it, it will not die*) and **a gold chevron** for the Crown (the one body that pays health back). |
| The Bastion body was gold (`#ffba52`, hue 39°) in a species that pays nothing | Recoloured to **hot rust `#ff6b3d`** (hue 15°). Gold is left to the Crown, the pad and the drops. |
| Hazard tells were four warm tints, one of them gold | Every strike zone, wind-up rim, live ring, slam shock, needle and intent badge is spoken in the **lethal** family. The old pink ring core (`#b93863`) and amber shock core (`#ffe4b3`) are gone. |
| Getting hit was a line, and you still had to work out *what* | The **killer pointer**: the attacker's name is printed at its own body in the same rose as the line (`FANG HIT`), pinned to the viewport edge with a chevron when it is off-screen. On-screen there is no compass word — the line is the compass. |
| Nothing gave you time to read any of it | **A real slow-motion window**: `hitPace` holds the world at 0.15× for two ticks after the impact frame, then eases back to 1.0 over fifteen more (~0.28 s). Spent through `stepPhysics`'s `pace` argument, never by skipping ticks — physics and gravity stay coupled, so the committed parabola survives. |
| The law itself was never explained | One **bottom-edge ticker**, `GREEN CUTS · RED HURTS · GOLD PAYS`, retired on the third kill, on Chunk 1's existing ticker lane (no second notification lane was added). |

## The two new pure modules

- `src/color-law.js` — the law as maths. `hueOf` / `chromaOf` / `lawOf` /
  `readsGreen`, the three inks (`LAW`), the pale highlight inks (`LAW_INK`) and
  the strong pips (`LAW_PIP`), the frozen `ENEMY_HUES` reference, the reward
  set, and the legend's own retirement rule. A grey has no chroma and is
  scenery; an unknown role errs **lethal**, never safe.
- `src/slice-safe.js` — "safe to slice" as geometry, not decoration.
  `sweepGeometry` is now the ONE definition of the blade's ray (span =
  3.6 body-radii, half-width, radial tolerance), consumed by
  `slasher.js`'s `sweepBlade` for the real hit test; `sweepCovers` answers
  circle-against-capsule, which is the shape `Matter.Query.ray` actually
  queries. Marks are ranked reachable-before-shouting, nearest-first, capped at
  8 so a crowded wave cannot turn a marker into a paragraph.

## Changed

- `src/art/splatr-art-engine.js` — the `LAW` palette; `resolveSliceMark` and
  `drawSliceSafe` (two-pass brackets: dark underlay then colour, so the mark
  survives a bright body); the lethal-voice recolours above; `setAimFeedback`
  now accepts the slice snapshot and paints it between the bodies and the
  hazards; the killer pointer (name at the body, tag stem, off-screen chevron);
  radar blips that are not bodies are diamonds in a neutral tone instead of a
  rose dot that reads as one more creature.
- `src/slasher.js` — `sweepBlade` builds its ray from `sweepGeometry` and
  returns it, so the hit test and the marker share one source of truth.
- `src/run.js` — publishes `state.sweep` (the geometry it actually swept with)
  and `state.hitAge`; `pace` is now `min(…, hitPace(s.hitAge))`. The hitstop
  (`s.stop`) is unchanged and still owns the impact frame.
- `src/damage-feedback.js` — `hitPace`, `HIT_WINDOW_TICKS`, `bearingWord`, and
  `bearing` / `slow` on the reaction snapshot.
- `src/hud-copy.js` — `damageBearing`, which appends the compass word and still
  honours the four-word ceiling.
- `src/main.js` — feeds the slice snapshot from the run's own sweep, records
  the compass word only for off-screen attackers, drives the law ticker.
- `index.html` / `src/style.css` — `#law-hint` on the existing bottom ticker
  lane, with the three colours as the only coloured tokens on it.

## Verification

- `npm test` — **821 passed, 0 failed** (Chunk 1's 801 plus 20 new checks in
  `test/chunk2-slice.test.js`).
- `npm run build` — single-file build verified, 970.3 kB / 362.9 kB gzip.
- `node scripts/chunk2-frames.mjs` — rasterises the real renderer headlessly:
  marks on a Bastion and a Crown in reach, the same field with the blade spent
  (0 marks), the killer pointer on a near attacker, an off-screen attacker
  (`CROWN HIT`, chevron at the edge), the slow window, and reduced motion.
  Frames in `.arena/chunk2/` (git-ignored, regenerate on demand).

Tests worth naming, because they are the ones that would catch a regression:

- the engine's own palette literals are re-read and asserted off the safe and
  gold bands (`every enemy BODY is off the safe band…`, `the engine still
  paints the palette this module was checked against`);
- the marker is compared against the REAL `sweepBlade` on a live run — including
  that a body **behind** the swing is never marked;
- a body straddling the blade's tip must be marked, because Matter's inflated
  ray reaches it (a first version under-promised here);
- a real hit must slow the world **and** advance the clock (`ticks are spent,
  not swallowed`), and the window must close on its own.

Not claimed: no browser was available in this sandbox, so the DOM side
(`#law-hint`'s exact rendering, the ticker stacking at 960×540) is asserted from
markup/CSS and the pure models, not from a screenshot. The existing browser
suite (`scripts/*-browser-qa.mjs`) is unchanged and still needs a Chromium run
before launch.
