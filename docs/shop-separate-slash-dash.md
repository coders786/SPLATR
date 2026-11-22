# Separate slash and dash animation rework

User clarified both animations should coexist and rejected the previous presentation quality. Restored separate WEAPON SLASH and ELEMENTAL DASH options alongside ITEM STORY and DRAG ARROW.

This chunk changes Shop demonstration choreography, not combat timing or the global gameplay effects.

Slash: stationary actor with a visible blade wind-up, rapid sweep, target contact and separated specimen, follow-through and held cut study. No elemental dash inside the slash preview. The weapon follows a defined angle and existing finish art follows sweep progress. Contact and split are deterministic and local.

Dash: longer compression anticipation, a short cubic-eased launch across 150 scene units, directional body stretch, real elemental trail, short braking/settling beat and a clean stop. The previous slow linear slide and never-ending attached idle trail are removed. Idle has no live trail; reduced motion is explicitly a fixed early-action study so selected elements can still be compared without movement.

Both use the existing equipment and sword identity, not independent new unlocks. No input, ability, damage, movement or resource changes. Face remains above trail; no extra camera shake or full-screen effects.

Validation:
- 570/570 Node tests passed, including three new separation/choreography tests.
- 19 Shop/native-mouse cases passed: slash/dash/arrow at four sizes plus seven build-driven arrow releases.
- Loop/pause/resume/reduced-motion regression passed. Corrected the loop test to sample the full loop instead of treating two equal frames within the intentionally long result hold as failure.
- Phone slash wind-up capture inspected; actor/blade and specimen fit the preview.
- Production single-file build: 745.52 kB / gzip 291.22 kB.
- Logs .arena/icons/shop-action-{focused,tests,build,browser,loop}.log.

Technical checks do not establish user satisfaction with the new animation, physical-device performance or unfamiliar-player recognition. Gameplay slash/dash renderer quality beyond these Shop sequences remains a separate possible revision.
