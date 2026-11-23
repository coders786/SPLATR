# Developer sandbox

Turn **Developer sandbox** on or off in Options. Switching reloads the page; if a run is in progress, a confirmation warns that it will end. The `dev=1` URL parameter makes the mode explicit and keeps it active on reload. Remove it (or switch off in Options) to return to the normal profile.

The sandbox uses its own local storage keys and audio preference. Purchases, equipment and discoveries, quest rewards, best scores, challenges, and settings persist in that sandbox only; they do not transfer to normal play. Clearing browser site data also clears the sandbox. It does not initialize the Poki SDK. A fresh sandbox opens on the title rather than forcing the first-play lesson; the normal first-play experience is unchanged.

The shop has unlimited credits for all **priced** items. Challenge-only items still require their challenges, and undiscovered hybrid recipes remain hidden. Equip purchases normally. Open **Field manual** for nine step-by-step live enemy drills, including linked Prisms, and control practice. During a sandbox run, pause to refill health, Edge and focus to the equipped build's actual maxima or download a bounded local combat trace as JSON. The trace is reset per run and holds at most 4,096 contact/damage events; it records simulation ticks and attack identities when available, not cue visibility, player perception, or wall-clock timing. It sends nothing over the network. Trace and refill controls are absent from normal runs.

These are testing aids, not evidence that enemies are balanced or their cues are readable. Human playtesting is still needed, including observation of whether players actually see and understand warnings.
