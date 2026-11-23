# Cube dash smear cels

The active dash now draws three clipped, staggered slices of the cube silhouette
behind its sharp current position. Each cel repeats the equipped body profile,
material color, simplified eyes and core color; it is not a separate hitbox or
another projectile. A light remnant of the previous flat echoes is retained,
while the older full-cube blur copies are suppressed during the active dash.

For velocity `v`, each slice is displaced by `-normalize(v) * d`. The distances
are `radius * [0.86, 1.30, 1.82] * min(speed / 42, 1) * envelope`, where
`envelope = sin(pi * (age - windup) / active)^0.8`. This yields continuous
entrance and exit, speed-dependent separation, and equal distances in cardinal
and diagonal directions. Horizontal motion uses horizontal slices; vertical
motion uses vertical slices. The hero and the slices are never rotated to face
the direction of travel.

The effect samples the existing interpolated dash age and uses no random or
frame-local clock. It disappears on wall splat, at low speed, during recovery,
and with motion disabled. The shop dash study and manual practice use the same
renderer, so players can inspect it. Geometry and drawing are presentation
only; gameplay speed, collision, damage and dash timing are unchanged.
