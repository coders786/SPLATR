# Dash and pointer customization

The shop has two independent cosmetic slots. Adaptive Dash preserves the old
build/sword-driven trail; the seven paid dash treatments explicitly override its
element, not movement speed, collision or damage. Field Reticle is free; the
other press marks are purchasable. Old equipment and presets acquire both free
defaults on load. Ownership and equipping remain separate steps.

The press mark stays at the original screen-space touch or mouse-down point,
including while the camera moves. The existing dead-zone ring, pull direction,
and cancel behavior are unchanged. The center diamond grows from 3 to 6 pixels
with normalized pull power; the largest mark fits within 19 pixels of the origin.
The orbit uses four equal angular segments, with eight line segments per arc, and
all variants share the same geometry in gameplay and the shop. Red indicates a
cancelled pull. No looping motion or extra flashes are needed to communicate a
press, so the mark also works with reduced motion.

Dash trails continue to use velocity direction and simulation age, with a
quadratically fading initial smear instead of an abrupt three-tick cutoff. The
hero's collision and dash timing are unchanged. Reduced-motion gameplay still
suppresses animated trails; the shop presents a static reference pose.
