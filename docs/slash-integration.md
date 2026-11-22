# Slash animation and integrated attachments

## Visual changes

- Equipment slashes now change curvature and blade thickness over normalized sweep progress instead of only fading the same crescent.
- Two restrained trailing cuts decay behind the edge; traveling flecks follow the same quadratic path.
- A thin CORE-colored seam connects slash energy to the equipped build while retaining each slash's original palette.
- Laser glow and secondary blade edges follow the animated curve. Impact fragments spread during follow-through.
- The game's default slash arc also inherits CORE primary/light colors.
- Headgear receives top-plane seating shadows and socket lips. Tails receive inset collars, facing planes, contact seams and small CORE-linked fasteners. Thrusters have separate upper/lower sockets; wing, ribbon and chain sockets follow their actual root locations.
- All geometry remains presentation-only. No catalogue, prices, recipes, collision, input, movement or combat rules changed.

## API compatibility

`drawSlashEffect(ctx, spec)` adds optional `progress` (0..1), `time` (ticks), `equipment`, and `reducedMotion`. Existing arguments/defaults remain valid. Legacy `drawEquipmentSlash` accepts an optional final motion descriptor; old calls remain valid. Without explicit progress, progress derives from fading strength. Reduced motion freezes sweep geometry and disables traveling flecks/trailing cuts.

Lab automatic and manual cuts pass explicit progress and equipment; the gameplay equipment blade passes its existing lifetime. No new clock or gameplay state is introduced.

## Verification

- `npm test`: **374 passed, zero failed**, 80.25 seconds.
- Production single-file build: **516.37 kB**, gzip **221.85 kB**, bundle verification passed.
- Chromium visual study: 12 distinct frames across four slash styles, plus three attachment studies; zero page errors and balanced Canvas state. Directly inspected screenshots, corrected detached laser glow, regenerated and inspected final screenshots.
- Chromium development and production layout gates passed, including compact viewports.
- Chromium harmony/Codex/native-cut and reduced-motion/keyboard/cancellation/focus/try-on checks passed.
- Expanded 630-render mutation matrix and Manual/live-game/Best-Stroke adapter checks passed during this change.
- Focused tests cover seven evolving slash styles at constant opacity, reduced-motion stability, CORE accent distinction, deterministic attachment rendering and Canvas state restoration.

Reproduce the dedicated screenshot study with `CHROME_BIN=/path/to/chromium node scripts/slash-integration-browser-qa.mjs` against the existing port-3000 dev server. Screenshot outputs go to ignored `.arena/slash-integration/`.

Authoritative artwork remains `src/art/splatr-art-engine.js` with zero imports, DOM dependencies, storage access or physics writes.
