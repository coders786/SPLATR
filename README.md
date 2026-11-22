# SPLATR: Shape Riot

A full-screen **2D geometry slasher**. You're the square with the scarf. Cut shapes, climb, and beat your best score. There's no finish line.

## Play

- **Start run** on a new save puts three paper triangles in front of you. Click, tap or press **Space**; try cutting the whole rack in one swing. A small paper strip under the cube draws the move you're on. Nothing attacks here, and a miss brings you back for another go.
- The next rack is across your path. Then there's one hexagon: the first cut cracks it, the second breaks it. Take your points and Overdrive into the field. One live red triangle shows its charge lane before the fight starts. When you clear the racks, one net waits above the Redline. It catches you once and refills your cuts.
- The guide is spent by your **first Start**, so a later run begins with the single triangle. It does not matter whether you finish, skip, reload or never swing. **Pause → Skip the racks** goes straight to the field for this run. **Options → Run opening** can show the orientation on every run (**Gradual**) or use the original mixed field (**Full field**). Racks, a debrief score and the field all belong to the same run.
- **Touch / mouse:** tap a destination, or hold anywhere, pull **backward** and release. A longer pull gives more speed. Holding in flight slows time; a held target stays aimed until release. The dotted arc previews the shot.
- **Keyboard:** arrows / WASD set a direction; Space slashes. Hold Shift for focus and use left/right to fine-adjust the angle. On the racks and at a fresh launch, an unaimed Space takes the offered shot. In flight it repeats your last direction.
- **Pause:** P, Escape or the pause icon. Blurring or hiding the tab pauses a live run and cancels a held shot. Options, the field manual and Resume are available without losing the run. **M** toggles audio; **F** requests browser fullscreen where supported.

The game fills the available viewport even if the browser disallows fullscreen. It needs neither a landscape lock nor a virtual joystick. Best score and preferences are saved in your browser. In an embed that blocks storage, the first Start still counts for the rest of that visit.

## How to score

In the field you have **three hull and three cuts**. The cutting room gives you a longer blade and free cuts on paper. The marks under the flying cube are remaining cuts. One cut regenerates after 76 simulation ticks without a full stock; a kill restores one immediately and refills focus. A chain advances the score multiplier up to ×8. Every sixth consecutive kill starts **Overdrive**: a blade with 38% more reach, double the multiplier, and enough damage to split a Crown in one hit. A hull hit breaks the chain. Height unlocks encounters; it doesn't earn points by itself.

**Stroke ≠ chain.** A new dash starts a new stroke, not a new chain. The second direct full-size kill on one stroke earns a **flat +300** and sends a short, straight cut forward from that shape. It strips two plates (three in Overdrive), scores any kills, and can only fire once per launch. Small Fangs score and refund a cut but don’t arm it. The notches preview a possible pair at their current positions; moving enemies and gravity wells can spoil the line. At run end the paper slip prints the most valuable stroke you actually made.

| Shape | What to watch for | Counter |
| --- | --- | --- |
| Fang · triangle | Locks a bearing, then lunges. | Cross the dotted line after it commits. |
| Pulse · circle | Sends an expanding shock ring. | Start a fresh dash through the front; the interior behind it is safe. |
| Prism · diamond | Sights a needle; two sentries can also charge a beam. | Cut into the needle. Split either sentry to disable a link. |
| Fork · cross | Splits into two small Fangs. | Save a redirect for the offspring to extend the chain. |
| Bastion · hexagon | Presses in behind two plates. | Take two cuts, shear it from a softer pair, or use Overdrive. |
| Rift · star | Marks an intercept and blinks there. | Leave the outlined star before it closes. |
| Well · pentagon | Pulls the cube toward its core. | Dash out of the field or through the core. |
| Crown · octagon | Hunts every third sector, with three plates and a radial volley. | Read the spokes. Breaking the Crown repairs one hull. |

Each new run rolls a seed. In Auto, the first rows use triangles and two-plate shells. The next rows add circles, then diamonds. Crosses, wells, stars and linked sentries come later. Full field starts with the original four mirrored opening arrangements. Both paths lead to the same five encounter formations, district mixes and recurring Crown hunts. Go sideways for another chain or climb into a new sector. Only the nearby field is loaded; cutting a shape, leaving its cell and coming back does not respawn it for free points.

## Run or distribute

Requires Node.js 22.12+ to develop or build. A modern browser is all you need to play the built game.

```sh
npm ci
npm start           # build, verify, and serve the playable preview on port 5173
npm run dev         # local development / HMR in a top-level browser tab
npm test            # deterministic simulation, art, camera and SDK checks
npm run build       # standalone dist/index.html; checks the actual artifact
npm run preview     # serve the built game (or open the HTML directly)
```

**For an embedded/shared preview, use `npm start`, not the Vite development server.** A sandboxed iframe can have an opaque origin: the HTML loads, but the browser rejects the dev server’s external ESM requests. The built game needs only the document request and works without granting the iframe storage access or relaxing CORS. The repository-root `index.html` is a build input; `dist/index.html` is the file you can play directly. While `npm start` is running, `npm run test:preview` checks startup and a scored slash inside a scripts-only iframe (Chrome required; set `CHROME_BIN` if needed).

The standalone is **one offline HTML file** with inline code, vector drawing routines, four font subsets and licenses. Sound effects and the switchable beat track are synthesized after user input. No external art, fonts, analytics or SDK requests are required. `dist/` and dependencies are intentionally not versioned.

For a host that requires the official Poki SDK v2, `npm run build:poki` produces the portal variant in the same location. Only that mode fetches the SDK if the host hasn't supplied it. Failed or delayed initialization does not block play. Run `npm run build` again for the offline version. Validate a hosted portal submission in the portal's own test environment.

## Implementation and checks

- `src/levels.js` generates stable 1,600 × 1,240-unit cells by seed and integer address, with staggered spawn slots rather than a grid. The active neighbourhood is at most 3 × 3. Defeats are bitmasks per visited cell; the tide prunes unreachable rows.
- `src/opening.js` runs the paper racks: real blade contacts, a brief return on a miss, and a handoff into the same scoring run. `src/storyboard.js` draws the wordless first-run guide from actual game states; it never plays the game for you.
- `src/run.js` owns survival, scoring and transitions; `src/slasher.js` owns enemy AI, compound sensors, blade contact, needles, rings and links. Neither needs the DOM. The test driver that plays long runs is not part of the shipped game.
- `src/physics.js` and `src/clock.js` advance Matter at fixed 60 Hz with bounded catch-up and collision substeps. `src/camera.js` and `src/renderer.js` blend previous/current states using the fractional tick remainder, including in focus. The framebuffer is viewport-sized, capped at 2× device pixel ratio and about 2.6 megapixels, not the size of the world.
- `src/shapes.js`, `src/art.js` and `src/atmosphere.js` draw flat silhouettes, the title illustration, sector scenery and fragments. `src/input.js` handles captured pointers and keyboard aiming. `src/main.js` connects these to the menus, HUD, storage, audio and optional portal lifecycle.
- **[The cutting room: the first four swings and the wordless guide](docs/cutting-room.md).**
- **[Throughcut: the art/UI/juice audit, research, and real play frames](docs/throughcut.md).** [Menu, HUD and silhouette design references](docs/shape-riot.md).

With Chrome installed, run **`npm run test:browser` after the standalone build**. Set `CHROME_BIN` if the executable is not in its standard installation; `CAPTURE_DIR` optionally saves screenshots. The suite opens the built HTML over `file://`, denies HTTP requests, navigates the manual and settings, uses actual pointer input to Throughcut across multiple sectors and checks the best-stroke print, verifies a death/retry and saved best, and plays the paper racks, shell, handoff, first-air focus and net with keyboard and native touch input. It checks a first Start from both mouse and keyboard, that later runs get no proof strip, that a reload/skip/retirement spends the guide, reduced motion, and rotation. This is browser emulation, not a physical-device benchmark.
