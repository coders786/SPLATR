# The meter system

Six readouts that now read as one instrument panel, plus two that did not exist.

## The bug in the screenshot

The speedometer's needle was **not attached to the dial**.

```css
/* before */
.speedo-needle line { transform-box: fill-box; transform-origin: bottom center;
                      transform: rotate(-90deg); }   /* rotates the LINE */
```
```js
needle.style.transform = `rotate(${-90 + share * 180}deg)`;  // rotates the <g>
```

Two different elements. The `<g>` carried no transform at all, so it was a
plain block box — a 100%-width strip at the top of the dial — and
`transform-origin: bottom center` on the line meant nothing, because the line
was never the thing being turned.

What rendered: two long white bars above the gauge, and no needle at the hub.
The dial has been reading as an arc plus a stray mark.

The rotation now lives on the group, in viewBox units:

```css
.speedo-needle { transform-box: view-box; transform-origin: 60px 62px; }
```

**Why no test caught it.** Every existing assertion checked the *number* — and
the number was right. Nothing asserted that the number was attached to the
thing being drawn. `test_meter_dom_css_agreement` now does, and it fails on the
original CSS (verified by reintroducing the defect).

## The family

| readout | before | now |
| :-- | :-- | :-- |
| Hull | 12px skewed blocks | 7px track, shared label |
| **Edge** | *nothing* | 3 lime pips + recharge timer |
| **Focus** | *nothing* | continuous bar, 54px |
| Chain | 2px rule | 7px track, `--v` fill |
| Overdrive | a coloured word | label + `--v` fill |
| Form rank | 3px ticks | 5px pips, same skew |
| Speed | dial | dial, corrected |

Every meter shares a 9px letterspaced label above its readout, one track
height, one skew, one empty colour and one fill mechanism (`--v`).

## Two meters that did not exist

**Edge** — the three cut charges, spent on every slash and re-earned only by
airborne time. There was no readout anywhere. A player whose cuts stopped
working had nothing on screen explaining why; the only feedback was the slash
not happening.

**Focus** — the bullet-time reserve. Drains while held, regenerates while not,
and it is the entire risk/reward of aiming mid-flight. Also invisible.

Edge's 60-tick (one-second) auto-reload is drawn across the next pip's slot as
a fill sweep inside the pip itself, so the meter never jumps from empty to full
without warning. The refill runs anywhere — no wall or floor required.

## The dial

- Ticks placed by trigonometry on the actual arc (radius 50, centre 60,62).
  Several previously sat *inside* the arc, which is why the gauge never looked
  like it had a scale.
- The SURGE threshold — where speed lines appear — is now marked. It was the
  most useful number on the gauge and entirely invisible.
- The arc stops at the top of the scale; the needle may go 15% past it. HYPER
  reads as "off the end" without a bar leaving its track.
- Arc and needle come from one function (`dialGeometry`) so they cannot drift.

## Layout collision found and fixed

The dial was positioned at `--top + 66px`, written when the top-right corner was
a single 34px hull strip. The three-meter column is **71px**, so the dial's top
sat inside the bottom meter. Offset is now 81px, and
`test_hud_corner_does_not_overlap` derives the number from the CSS rather than
from a comment — it recomputes the column height from the label size, gap and
track height it parses out of the stylesheet.

## Verified

```
✓ meters              edge 2/3 regen 50% · focus 50% · a full meter owes 0
✓ dial geometry       rest -90deg .. top speed 70% .. hyper over=true
✓ meter DOM/CSS       47 HUD ids all present · needle rotates group about 60,62
✓ hud corner          meter column 71px · dial starts +81px · clear by 10px
```

244 tests pass.

## Not verified

**No browser render was performed.** Everything above is structural and
arithmetic. The needle fix is verified by asserting the CSS/JS agree on *which
element* rotates and *about which point* — not by seeing it turn. The new
meters are verified as readout functions and as DOM contracts; I have not seen
them on screen, and the visual balance of a 71px column in the corner is a
judgement that needs an eye.

Specifically unchecked: whether three stacked meters read as clutter at phone
sizes, and whether the lime Edge pips are distinguishable from the orange hull
pips at a glance.

---

## CHUNK 2 — the SHATTER EVENT bar (Dimension Fracture)

The eighth readout is not an instrument; it is a countdown. The **Dimension
Fracture** is a persistent 0–100 seam across the world that fills as the
player cuts. It lives outside any single run: `localStorage["riot.fracturePct"]`
(`riot.dev.fracturePct` in the sandbox) is the storage home; `run.state.fracture`
is the live meter; `src/fracture.js` is the rulebook.

- **Feeds:** every cut +0.4, every cleared wave +2.5, every Dimension Shatter
  in a breach +6. No-stakes control practice and lessons never fracture the
  world. Interrupted sessions keep what they tore open — gains land in
  storage on the event, not at run end.
- **Tiers (25 / 50 / 75):** STABLE → TREMORS → FAULT LINES → CRITICAL
  COLLAPSE. Each threshold escalates three things at once: the sky (cracks,
  ember light, a dead light well), the sound (a tier-gated tremor cue on the
  run's own clock — 8s / 4s / 2s cadence, never on the menu), and the field
  (two bonus Fangs per tier in `encounters.js`, capped under the spawn grid).
- **Sky stages (10 / 35 / 60 / 88):** HAZE → CRACKED SKY → SPLIT SKY →
  COLLAPSE SKY. These sit deliberately *below* the warning tiers: the horizon
  warns before the HUD words do. Stage 4 draws one white-hot fissure; all
  geometry is hash-seeded and static under Reduce Motion / Screen shake OFF.
- **Mounts:** the slim ribbon across the arena top, the menu panel bar under
  the nav, and the RUN ENDED debrief (with a `+x.x THIS RUN` line). One
  anatomy, three homes, kept in step by a single `setFractureUI(pct)`.
- **100%:** the bar reads SHATTER EVENT READY. Chunk 3 spends it; nothing in
  Chunk 2 triggers the event.
- **Spent (Chunk 3):** the tick after the gain that fills the bar fires the
  tear itself — the bar zeroes (spend persisted to `riot.fracturePct`), the
  arena becomes SHATTERED for the rest of the run, and the meter rebuilds
  from ordinary play. See `docs/shatter-event.md`.
