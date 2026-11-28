# Cosmetic migration test note

Eyes, dash trails and arenas no longer provide gameplay effects. The legacy
integration cases explicitly marked `[retired cosmetic power]` describe the
old contract (for example that a fire trail burns enemies); they are kept as
skipped historical references, not passing evidence for the new behavior.
The standalone ability helpers still have their own tests. If any of those
abilities return as explicit gear, migrate their integration cases to the new
gear authority rather than enabling the old skin tests.

`cosmetic-isolation.test.js` checks every cosmetic choice against every weapon
recipe, legacy ownership and presets, honest shop descriptions, and seeded
combat. Browser coverage is in `scripts/cosmetic-garage-browser-qa.mjs`.
