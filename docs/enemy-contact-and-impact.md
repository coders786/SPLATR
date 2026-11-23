# Enemy contact and attack impacts

## Rule

Only the Fang species can damage by body contact, and only while its committed charge is active. This includes the small Fang offspring of a Fork. Idle, telling and recovering bodies are safe; all other enemy bodies are safe. An active blade still cuts on contact, with the existing armor and cut-grace rules. Pulse rings, Prism/Crown needles, and Prism links remain independently damaging; their existing parry and timing rules are unchanged. Fork now marks a cross swipe, Bastion marks a forward slam, Rift marks its landing strike, and Well marks a close compression. These are explicit timed area attacks, not body-contact damage. Well also pulls; Fork still splits; Bastion still has armor.

Matter's actual collision callback records whether a Fang was charging **at that substep**. This prevents a later mode change from turning safe touch into damage or erasing a rush that did connect. The normal damage invulnerability still applies. The Fang's existing telegraphed lane is followed by a visible pointed charge bracket on its real body. Active blades take precedence over damage at contact.

Bastion Iron's old bump block would have become useless, so it now blocks one Fang charge per run. It pushes away and protects against a second hit from that same charge, including if a wall prevents full separation. Descriptions and training reflect the change.

## Hit feedback

Each successful enemy hit supplies its real attack identity and direction to the renderer; shielded and lethal hits carry the same snapshot. Local, short-lived effects draw above the player: Fang's directional bite, Pulse's concentric rings, a single Prism needle/diamond, Crown's radial spokes, parallel Prism-link bands, a Fork cross, Bastion wedge, Rift radiating strike, and Well inward compression. Geometry, not color alone, differs. Effects have fixed tick lifetimes, bounded screen-size scaling and static reduced-motion poses; they never add damage or imply a second attack. Existing source labels identify the cause on the HUD and result screen. No impact is emitted just because a harmless body is touched.

## Verification

Automated coverage includes all eight enemy types and Fang offspring, idle/tell/charge contacts, substep mode changes, blade priority, the real Iron guard, surviving/fatal/shielded attack metadata, real ring/needle/link and four zone hits, cancellation, swept crossings, off-screen indicators and camera-independent simulation, and distinct deterministic reduced-motion impact geometry. Browser fixtures exercise real attack outcomes and render each effect at desktop and phone sizes, with motion on and off. These checks establish implementation behavior, not that unobserved players understand or enjoy it; playtesting is still needed.
