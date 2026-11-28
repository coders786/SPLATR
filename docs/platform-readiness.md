# Release readiness — 2026-11-24

## Verdict

**Ready for a private web playtest, not yet a verified Poki/global release.**
The standalone build is uploadable HTML, but packaging is not platform approval.
Poki is curated; Inspector validation and platform review still have to happen.
Other platforms have their own SDK, ads, metadata and review requirements.

This audit follows the official requirements and HTML5 integration guide:

- https://developers.poki.com/guide/requirements-quality
- https://developers.poki.com/guide/sdk-html5

## What is implemented and verified here

| Area | Evidence |
| --- | --- |
| Standalone packaging | `npm run build` produces a single HTML with embedded fonts/scripts, vector art and license notices. No external gameplay assets. Final artifact: 983.63 kB / 364.64 kB gzip. |
| Poki packaging | `npm run build:poki` passes the same packaging check. It enables the official remote SDK loader; the normal build does not. |
| SDK foundation | `src/poki.js` initializes asynchronously, handles missing/blocked SDK, and deduplicates loading/start/stop notifications. Bridge unit tests cover its state transitions. |
| Quest removal | No quest/deed controller is imported by the game entry. No boards, claims, drawer, quest HUD, prize track or Vault is instantiated. |
| Economy | A standalone wallet migrates earned credits/valid owned parts. Exact-price purchase validation and once-per-run settlement are tested. |
| Functional shop | Paid formerly visual-only items now affect blade time, chain grace, focus or qualifying kill score. Existing equipment/sensors retain their rules. New perks have numeric descriptions and local activation feedback. |
| Impact art | Major-hit anime contact stamp and dimension-fracture fans, with lifetime/cooldown and reduced-motion/shake-off gates. |
| Automated suite | 951/951 Node tests passed after the final contact-stamp adjustment, including all 5 impact tests. |
| Chromium smoke | Built Poki HTML with SDK network requests intentionally blocked: shop purchase/equip, reload persistence, native mouse/touch input, pause/end/retry and credit receipts pass at 960×540, 640×360, 390×844 and 844×390; no page errors or `[SPLATR]` console errors. |
| Layout fixes from browser evidence | Both Retry/Home remain visible at 640×360; perk details and next-run timing have reserved space in the shop. |

The focused browser smoke uses a controlled RAF clock, seeded old-wallet save,
and actual browser clicks/taps/keyboard. It is not a performance measurement,
new-player tutorial completion, long-run soak, or proof of organic progression.
Captures and measurements: `.arena/shop-release/` (ignored).

## Work remaining before Poki release

### 1. Ads and complete SDK lifecycle — blocker

`src/poki.js` currently has **no `commercialBreak()` / `rewardedBreak()` flow**.
Implement a non-overlapping natural-break opportunity on explicit continue or
retry intent, with game input disabled, gameplay stopped and all audio muted
while an ad plays. Restore the player's chosen audio settings even if the SDK
rejects or no ad is served. Do not add internal ad-frequency timers. Rewarded
ads are optional; never grant an unconfirmed reward.

Audit every interruption, including nested practice /
shop dialogs, against `gameplayStart` / `gameplayStop`. Bridge unit tests do not
prove that every shell path calls them correctly. Run the official SDK in Poki
Inspector, not only with a stub or blocked SDK.

### 2. Clean public release configuration — blocker

The game still ships a Developer sandbox option, URL-based debug run handle and
combat-trace/refill tooling. Gate these behind a development/QA build flag and
ensure normal/Poki release builds cannot enable them through URL or saved prefs.
Keep player-facing fault reporting, but strip testing conveniences from release.

### 3. Browser/device qualification — release gate

- Real Android Chrome and iPhone/iPad Safari, tablets, high-DPI and low-end GPU.
- Exact Poki embed sizes: 640×360, 836×470, 1031×580; resizing and orientation.
- Fresh-player tutorial completion with actual pointer/touch inputs, including
  skip, retry and returning-player behaviour.
- Tab hide/show, brief blur vs long blur, interruption resume, fullscreen and
  audio-unlock behaviour on real browsers.
- Opaque/sandboxed iframe and blocked-storage sessions end-to-end, including
  purchase, reload and clearly communicating session-only persistence.
- Long native-input runs across multiple dimension breaks; no recurring frame
  errors, memory growth, runaway particles or accidental time skipping.
- Measure frame-time and loading on representative devices/networks. Software
  headless Chromium and controlled RAF are not real-device performance evidence.

**Existing harness debt:** `scripts/preview-smoke.mjs` was attempted. Its iframe
boot/storage-isolation assertions passed, but it timed out waiting for the old
`#hud[data-place="room"]` tutorial, which was replaced by the visual tutorial.
Do not mark that smoke green. Update the retired-room scenario to the current
course, then rerun full iframe coverage. The new focused shop smoke does not
replace that tutorial test.

### 4. Balance, clarity and accessibility — playtest gate

Playtest the newly functional loadouts, their stacking caps and credit pacing.
Free starter items describe baseline utility, not hidden extra bonuses. Verify
that a new player can earn a useful purchase without farming instant retire.
Human-check effect intensity, audio levels, hazard legibility, motion-off and
low-shake options. The impact effect is bounded but not photosensitivity-certified.

### 5. Submission assets and review — external gate

Prepare static and animated thumbnails, description, controls and platform
metadata. Check the current platform asset specifications before exporting.
Remove forbidden outbound branding/ads, review the external-resource policy,
and supply a hosted privacy policy + in-game UI if required by the data/link
behaviour of the final integration. Verify rights/notices for every asset.
Submit through the developer portal and resolve platform feedback; no upload or
approval has been performed in this session.

## Other web platforms

For your own site or an HTML5 host such as itch.io, use the **normal** build and
package `dist/index.html` at the ZIP root if that host requests a ZIP. This is
suitable for private/beta testing now, not a promise that all devices are ready.
Do not ship the Poki SDK build to unrelated hosts. Add each portal's required
SDK/ad lifecycle independently; Poki's bridge does not integrate other portals.

## Reproduction

```sh
npm test
npm run build
npm run build:poki
# Serve the chosen dist/ artifact with Vite preview, then:
CHROME_BIN=/path/to/chromium PREVIEW_URL=http://127.0.0.1:5175/ \
  node scripts/shop-release-qa.mjs
node scripts/dimension-impact-frames.mjs
```

Chromium 158 was installed only in ignored `.cache/browser/`; its bundled Linux
libraries were extracted to `/tmp/al2023/lib`. No browser dependency was added
to package.json. For this sandbox, the smoke used `LD_LIBRARY_PATH` plus
`--no-sandbox --disable-dev-shm-usage --use-gl=angle --use-angle=swiftshader
--enable-unsafe-swiftshader`. Web security was not disabled.
