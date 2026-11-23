# Enemy art: mechanisms, not decoration

This is a live-combat art pass, not a change to enemy physics or a claim that players already understand it. Every opponent keeps the authoritative `TYPES` outer shape and radius used by its Matter sensor. Interior drawing is clipped to that silhouette; the old Well spikes outside its pentagon are removed so decoration does not suggest a larger body hitbox. The same vector renderer is used in real waves and the interactive Field Manual drills.

## Visual vocabulary

| Enemy | Resting identity | Real wind-up / attack relationship |
|---|---|---|
| Fang | Forward wedge, loaded rear spring and nose. | Spring compresses from the actual tell clock; rush chevron appears on real rush only. Only a charging Fang body hurts. |
| Pulse | Concentric drum membrane with outward fins. | Inner diaphragm compresses with its tell; the real moving ring, not the filled interior, hurts. |
| Prism | Diamond housing and circular aperture. | A single barrel replaces the aperture only during its real tell or while its shot is active. The barrel's world direction is the actual locked `aim`; the sightline is only a warning. Linked Prisms still show their real beam between their centers. |
| Fork | Four cross arms, two outward-facing Fang forms and a dividing seam. | Four arms brighten with the real swipe wind-up; the actual cross zone shows its bounds. The two forms suggest the existing split, not the exact child trajectories. |
| Bastion | Shield silhouette with two armor blocks. | A forward pointer appears only during its real slam tell and aligns with the locked wedge. The blocks and crack reflect actual remaining hp. |
| Rift | Dark broken star with a split-gate mark, not a glittering pickup. | A charge arc uses the tell clock. Its actual marked landing zone bears the same gate mark and becomes the real solid strike. |
| Well | Pentagon with four teeth pointing inward around a dark center. | The pull is independent of the compression strike. An inner charge arc follows the real tell, while the existing larger pull field and smaller strike zone remain distinct. |
| Crown | Octagonal armor, three plate blocks, ten radial ports. | During the real volley tell, ten directional ports rotate to the locked projectile angles. The three blocks track real hp, including armor upgrades that remove multiple plates. |

## Geometry and motion

Shapes are drawn in local coordinates normalized by enemy radius `r`: the longest core features are constrained to approximately 0.7–0.9 `r`, then clipped to the actual outer polygon. Critical light/dark mechanism strokes use approximately 0.065–0.11 `r`; at a 20 CSS-pixel projected radius these correspond to about 1.3–2.2 CSS pixels. This is a design calculation, **not** a guarantee of legibility at every camera scale. Existing screen-space warning outlines and explicit labels supplement the small body art.

Wind-up progress is `clamp(1 - clock / span, 0, 1)`. Prism and Crown barrel directions are transformed from the actual world `aim` into the rotating body frame (`aim - renderedAngle`); they do not point at a guessed future target. Each armor block is driven by actual remaining hp. A state-triggered mark is not played on an unrelated time loop. Reduced-motion play retains static state and geometry; it does not suppress gameplay rotation or a real moving projectile. Existing warning zones, hazard shapes, blade precedence, hp and collision rules were not changed.

## Verification and limits

The test suite checks eight distinct rendered bodies at several radii, state-derived aim/progress/armor, changes during real wind-ups, a shared Rift landing mark and preservation of canvas state. Browser fixtures exercise the real step-by-step encounters on desktop and phone with motion on/off. These checks confirm that code is wired and renders; they do not establish that every shape is recognizable amid effects, overlapping enemies, alternate backdrops or at all zoom levels. Uncoached player observation and tuning remain necessary.
