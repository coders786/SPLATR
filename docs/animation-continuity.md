# Animation continuity pass

The game still uses its simulation clock for gameplay. Rendering samples the
previous-to-current tick with the existing frame interpolation fraction for the
dash, slash, landing and wall-splat ages. A fresh event begins at age zero;
rendering never predicts a future event. The cube stays axis-aligned in all
8 directions.

Dash anticipation now meets the active phase at the same scale, core offset and
edge lighting; the active phase meets recovery at the same values. A quintic
release retains the sharp acceleration while eliminating a one-frame jump.
Slash smear is continuous across swing, impact and settle, while the contact
flash remains deliberately sharp. The shared character release channel starts
at zero and returns to zero, and near-stationary movement blends into the held
pose using a cubic smoothstep between 0.6 and 6 pixels per tick.

Dash particles are emitted and advanced on simulation ticks instead of draws,
so additional frames do not change their lifetime or position. Reduced motion
clears the particle system. The shop dash study uses the same deforming pose as
gameplay and no longer rotates the character. None of these changes affects
physics, collision, attack timing, equipment rules or currency.
