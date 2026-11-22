# Section 4b — what a real run looked like

Round 2 closed at `8a6f6a4`. This is the "run it again with the new things in"
pass, and it did its job: **rasterising the actual renderer found three
defects that the test suite could not see, all of which fail silently.**

The frames in `docs/review-frames/` are the real `createRun` + `createRenderer`
driven by a seeded bot, drawn onto a real Skia surface (`@napi-rs/canvas`).
They are not a browser: the HTML HUD (`#score`, `#speedo`, the RUN ENDED page)
is not in them. `scripts/render-frames.mjs` reproduces them.

---

## 1. Score popups printed at the wrong size — shipped bug

```js
c.font = `800 ${m.big ? 26 : 17}px/1 var(--type, sans-serif)`;
```

A canvas `font` string is parsed by the CSS *font shorthand* grammar. `var()`
is substituted by the cascade for **declaration** values only; a font assigned
from script is not a declaration, so the substitution never happens, the string
is invalid, and the spec says an invalid font **leaves the previous value
untouched**. Every popup therefore inherited whatever font the last draw pass
had set. In capture that was `10px sans-serif` — the numbers were roughly a
third of their intended size.

Fixed with a literal stack. `test/font.test.js` now rejects `var(` in any
`.font =` assignment and pins the popup size, because this failure is
invisible to any test that stubs the 2D context — the assignment "succeeds".

## 2. The blade window dimmed instead of flickering

The last-four-ticks rule was `floor(time * 0.5 + left) % 2`. Traced at one
tick per frame, the final four ticks came out:

```
blade 4 → on      blade 3 → OFF
blade 2 → OFF     blade 1 → on
```

Two dark ticks in a row. That reads as the effect **failing**, not as the
window closing — the opposite of a telegraph. It is now keyed on the remaining
ticks alone: `on / off / on / off`, one toggle per tick, three transitions.

## 3. Popups printed on top of the blade

The popup anchored at the cut point, and the cut point is exactly where the
blade is. `+2820` sat across the sword and the Crown. Two causes, two fixes:

* **Position.** It now offsets along the cut *normal*, biased upward, so it
  sits beside the stroke rather than along it.
* **Colour.** The number was acid — and so are the blade, the cut beam and the
  Overdrive ring. Big totals now print white; the acid stays exclusive to the
  things that are acid.

Near-simultaneous cuts also **merge** into one popup carrying the true total,
with a brief snap so the eye registers that the number grew. The rule is a
pure `recordPopup()` so it is unit-tested (6 tests) rather than inferred from
pixels.

---

## Still unverified

Everything that lives in the DOM. The near-rank nudge on the RUN ENDED page
(`#next-rank`), the `#speedo` move and the Reduce Motion toggle are HTML/CSS
and cannot appear in these frames. They were verified by reading state and
markup, not by looking at a rendered page — that distinction stands.

## Subjective calls worth a human eye

* `+2820` at 26px still brushes the blade tip when the cut is near-vertical.
  It is legible now because of the colour split, but a player mid-chain may
  still find the stack busy. Worth a look on a real screen.
* The Crown's **plate count** is hard to read at phone scale; the **crack**
  carries the message instead. That works, but it means hp 3 and hp 2 look
  more alike than the brief intended.
