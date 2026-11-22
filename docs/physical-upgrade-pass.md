# Physical upgrade and anticipation pass

## Shipped
- Upgrade choice cards now demonstrate the currently equipped creature with its actual sword/profile and the proposed modifier. Pure `drawWaveUpgradePreview` draws load/stretch/launch/settle phases, weapon changes and a simple illustrative target. These are art demonstrations, not miniature combat simulations.
- Preview updates reuse the existing wave UI frame update; no additional RAF or long-lived timer. Hidden documents do not animate. System reduced-motion and saved riot.motion preference use a static demonstration.
- Real weapon rendering accepts the temporary buff: Long Edge changes the resting blade length as well as active reach, Heavy Cleaver changes the blade silhouette/width, Armor Break uses a wedge, Glass Edge a thin rapier profile, Lasting Edge a split/echo edge. The underlying sword-family mechanics remain unchanged.
- Active weapon follow-through is simulation-age-driven; temporary weapons unfold during the first 18 simulation ticks of the next wave while input remains immediate. Existing dash poses/wakes/slash crescents remain.
- Twin Ward draws two physical plates at two charges and one at one charge; the last disappears at zero. One-hit ward now has a physical side plate. These do not alter hitboxes or equipped parts.
- Combat HUD is a compact instrument strip. Mobile places it on the upper right rather than a large central box. The detailed pace instrument stays hidden during uncharged ordinary pace, becoming visible during charge and advanced/breach stages. Active upgrade icon/stat and cycle markers remain.
- Upgrade cards get restrained hover/press/focus movement, with system reduced-motion opt-out. Mobile layouts keep previews, icons and trade-off stats in separate columns.

## Validation
- Full final suite: 485 passing, zero failures, 110s. Two added tests cover all eleven animated/static equipped previews, snapshot purity and real weapon/ward image differences.
- Self-contained production build: 678.35 kB / gzip 270.34 kB.
- Rest choices: 15 browser fixtures over five sizes, no dialog scroll and all three buttons fit.
- Active upgrades: 33 browser fixtures over three sizes, badges fit, spent ward and expiry clear correctly.
- Native sword input: 96 family/direction/mouse/touch cases pass.
- Wordless first play: four sizes pass, clean automatic wave-one transition and reward isolation retained.
- Inspected 390px rest-choice screenshot (equipped Zenith creature, cleaver/comet/ward previews) and 390px in-field Twin Ward screenshot (compact HUD and visible character).

## Scope and remaining work
This is the connected rendering/UI pass, not proof of retention or a finished game-feel overhaul. No new hit-stop, impact audio, encounter arrangement changes, focus-specific preview replay, particle-based shield break-off or selection-to-character travelling icon was introduced. Existing body/contact animation remains authoritative. No animation recording/native-device performance measurement or human playtest was completed; screenshots and deterministic frame comparisons are not substitutes for those. More buffs were deliberately not added.
