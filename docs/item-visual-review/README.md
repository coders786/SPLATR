# Screenshot-driven item visibility review

## Open the evidence

- `SPLATR-item-visual-review.pdf`: 34-page report, item-by-item observations, and 30 contact sheets containing 438 genuine timed browser screenshots (219 before, 219 after).
- `index.html`: portable, self-contained screenshot gallery. Includes all 73 items, before/after stages, full shop views, selected mobile/reduced-motion views and actual card animation frames. No network dependencies; screenshots are JPEG-encoded copies, not redrawn art.
- `item-observations.md`: searchable written findings for every item.
- `manifest.json`: capture metadata, original capture hashes, clock/viewport information and subjective review categories. Paths in capture metadata refer to local QA scratch output; the portable HTML/PDF contain the durable evidence.
- `validation.txt`: build/test/browser-check summaries.

## Conclusions

The user's concern was justified. Testing the renderer and detecting changed pixels did not establish a substantial visible animation upgrade. Of the 73 sampled previews, the subjective review marked 20 clear, 32 diagram-heavy, 14 subtle and 7 baselines. This is **not** an all-items visual-quality pass. In particular, many head/core effects are bars, eye/tail effects are tiny, and Ember/Volt use small actors amid dense charts.

Visibility fixes made during this review:

1. Restore drawing for visible selected/hovered catalogue card canvases. Previously the card remained on its first baked frame despite hover/selection handlers.
2. Default normal shell browsing/reopening to the ability instead of assembly. Preserve explicit Assembly, reference gallery and practice controls. Treat body ability studies as read-only illustrations consistently.
3. Supply measured travel to dash artwork so travel-gated rear rails can appear. Hold an explicitly labelled active reference rather than an age/speed combination that suppressed the elemental effect.
4. Keep Echo's late enemy within the lesson panel, including before its arrival starts. Move the safe-neighborhood labels away from the actor.
5. Correct the discovery-card canvas context target while restoring the missing canvas update path.

No gameplay balancing or save schema changes were made for these visibility repairs. The already-existing uncommitted Echo/Volt upgrades remain separate work.

## Method and limits

Fresh normal production build, actual Chromium browser, 1440×1000 desktop, all 73 catalogue items at 600/1800/4100 milliseconds. Before capture used direct item links; after capture used the ordinary Shop/category/slot/item click path. Both requestAnimationFrame and performance.now advance together. Each capture guards equipment and wallet state and page errors. All 15 before and all 15 after sheets were visually inspected. Echo was subsequently corrected again, recaptured and visually rechecked; the final PDF/HTML substitute that final capture.

Additional UI checks cover 1440×1000, 390×844, 844×390, and reduced motion at 390×844. These check actual visible card image changes, pause, read-only stage input role, canvas bounds, explicit assembly access, reopening, and unchanged saves after the shop's normal initial normalization. Seven existing assembly/gallery layouts were rerun, including explicit buy/equip separation.

Three frames sample an animation, not every event in its full loop. These captures concern shop illustrations, not a new live-game visual audit. Emulated viewports do not establish real-device performance. Static baselines need not gain fictitious combat powers.

## Reproduce

With the repository's dependencies installed and a compatible Chromium binary available:

```sh
npm run build
npm run preview -- --host 0.0.0.0 --port 5188 --strictPort

# In a separate shell. CHROME_BIN may override /tmp/chromium.
QA_OUT_DIR=.arena/item-visual-review/before node scripts/item-screenshot-review.mjs
QA_BROWSE=1 QA_OUT_DIR=.arena/item-visual-review/after node scripts/item-screenshot-review.mjs
QA_BROWSE=1 QA_ITEMS=dash-echo QA_OUT_DIR=.arena/item-visual-review/after-echo-final node scripts/item-screenshot-review.mjs
node scripts/item-visibility-browser-qa.mjs
node scripts/package-item-visual-review.mjs
node scripts/item-visual-review-pdf.mjs
npm test
PREVIEW_URL=http://127.0.0.1:5188 node scripts/assembly-browser-qa.mjs
```

The before images in this deliverable predate the visibility repairs; rerunning the first command against the final source captures the current version, not the historical before state. `PREVIEW_URL`, `QA_OUT_DIR`, `QA_ITEMS` and `CHROME_BIN` can configure the capture harness. This sandbox additionally requires `LD_LIBRARY_PATH=/tmp/al2023/lib` for Chromium.

Final recorded validation: **1,402 tests pass; 12 ordinary-click visibility cases pass; 7 assembly cases pass; normal production build passes; git diff whitespace check passes.** None of those counts is treated as an aesthetic grade.
