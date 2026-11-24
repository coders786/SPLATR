# CHUNK 6 — THE SHATTER ARC (plan)

One line up top, so nobody loses it:

> **Make the Dimension Shatter the thing the game is *about* — earned in the
> first four seconds, paid off in the middle, and won in the ending — and
> make every screen that teaches, rewards or warns tell its story with
> moving pictures and light, not paragraphs.**

Shadow of doubt everywhere below — numbers marked `REVISIT` want playtesting
before they are frozen. Nothing in this document is implemented yet.

|                       | Before                          | After (this chunk)                                   |
| --------------------- | ------------------------------- | ---------------------------------------------------- |
| Dimension Shatter     | a HUD event + pop text + SFX    | a short, silent, visual cutscene + permanent state change in the world |
| Why/how (first 4 s)   | nothing tells you               | a 4-second cold open: **THE WATCHER** tears the seam open; **CUT.** |
| Wave guidance         | walls of text / HUD jargon      | visual story beats per wave, 3-word highlight chips |
| Progress bar          | 20px ribbon nobody sees         | diegetic spine + burst feedback + escalating tier sky |
| Boss (Monolith)       | sits there, does nothing        | enormous, active, telegraphed; MC-style boss bar     |
| Arena                 | 2340×2015                       | 3200×2600, longer sector lifts                       |
| Upgrades              | 11 cards, stats as text         | 40 cards, 5 tracks, DIMENSION jackpot tier, certified before→after |
| Speed                 | "bank and bounce until enormous"| earned with slashes + banks: the MOMENTUM pip economy |
| Hyper steering        | drag = world goes 10× slow      | world holds at ≥ 0.55 speed-time; steering never demotes hyper |
| Enemy lessons         | 3 text steps + narration        | **THE WATCH**: slow-motion rehearsal, 3-word chips   |

---

## 1. What the player actually asked, read closely

Verbatim, condensed but not paraphrased where it matters:

> "enemy lessons should stop to tell it should happen and slow down and
> remove text … this game is for web gamers and the best way to increase
> bounce rate is adding text and ambiguity"
> "the dimension shattering even[sic] should be the part of the cutscene
> short visual told story. the dimension shattering feature reworked
> completely"
> "visuals worked completely" — the rework ships **with its visuals**, or it
> does not ship
> "the progress bar is not getting in game attention so fix it"
> "add a tiny bit of story and sense of progression and rogue lite visual and
> stat upgrade selection showed using before and after … add 40 upgrades and
> visuals worked so plan it completely using thinking as much as possible and
> try to match the feel of human dopamine like stage"
> "add a micro story each wave until the dimension shatter and the boss
> should be enomourus[sic] and show boss hp like mc"
> "dimension shattering should be a earned thing which the first 4sec player
> should know why they have to shatter dimension and how shown in cutscenes
> between waves"
> "don't use text and walls it[sic] text to guide use visual story telling.
> use slight highlihted[sic] text to do it"
> "the player shouldn't be just bouncing and gaining enoumourus[sic] speed
> they have to earn it using good slashes and some bounces"
> "in hyper speed when i try to steer the cube it loses it's hyper speed fix
> it … when i drag while the cube is moving on it's own in hyper speed it
> loses it's speed which is not good for hyper speed steerers"
> "monlith[sic] is not doing a single thing and the arena is too small. so
> plan it with next chunk"

Everything below is mapped to those eleven clauses:

| # | clause | spec section |
| - | ------ | ------------ |
| 1 | lessons: happen, slow, no text | §10 THE WATCH |
| 2 | dimension shatter reworked + cutscene-told | §5 THE SHATTER |
| 3 | progress bar gets attention | §9 THE SPINE |
| 4 | story + progression + rogue-lite 40 upgrades + before/after | §11–§13 |
| 5 | micro story each wave until the shatter | §6 |
| 6 | enormous boss, MC boss bar | §7 |
| 7 | SHATTER is earned; 4-second why/how | §3, §5 |
| 8 | visual storytelling, highlight chips only | §4 |
| 9 | speed is earned (slashes + bounces) | §14 |
| 10 | hyper steering keeps speed | §14.3 |
| 11 | Monolith does a thing; arena bigger | §7, §8 |

---

## 2. Design pillars

1. **The camera is the narrator.** If a beat needs a sentence longer than
   five words, the beat is redesigned, not reworded.
2. **Every promise has a texture.** "Earned" means pips and plates, not an
   abstract legitimacy counter. If the player cannot point at it, it does
   not exist.
3. **Dopamine is a cadence, not a fireworks show.** Small reward every
   8–12 s, medium every sector, one enormous one per run. Never two
   enormous rewards in a row; the second teaches the brain to ignore the
   first.
4. **Zero text walls, ever.** HUD words are at most 3 words and only the
   highlighted chip class (§4). Instructional prose lives in the Field
   Manual, not in play.
5. **Reduced motion and skip are first-class.** Every cinematic has a
   reduced-motion variant and a one-key skip after 0.8 s.
6. **Nothing is a fake.** The shop sells real mechanics, the Monolith runs
   the real rules, the cutscenes dramatize real systems — the player is
   never graded on information only a cutscene knows.

---

## 3. THE 4-SECOND COLD OPEN ("first 4sec player should know why and how")

Today the run opens on a Cutting Room pad with racks and zero framing. The
new cold open (first run of a session only, skippable with any key/tap
after 1 s; reduced-motion variant cuts 3↔4s and drops flash):

| t (s) | visual | audio | words (highlighted chip) |
| ----- | ------ | ----- | ------------------------ |
| 0.0–0.8 | black. Two eyes open in the dark, very slowly — the mask assembles from falling sparks overhead | one low sawtooth bell | none |
| 0.8–1.6 | **THE WATCHER** (existing two-horned silhouette, `narrativeBackdrop`) ignites gold along its horns; below it the seam — the `narrativeWorld` fracture line — glows and *breathes* | second bell, lower | none |
| 1.6–2.6 | the world **tears**: white-amber crack flash racing the seam line; shards drift down like snow; the rack shapes below glow acid | thin glass-crack riser → a deep sub | none |
| 2.6–3.3 | the pad under the player slams forward; the three rack Fangs drop into frame, collinear, paper-white | single dry thud | **CUT.** |
| 3.3–4.0 | camera settles to the existing ready-cam; HUD fades in piece by piece (pad → blades → chain pips → spine) | tempo of the run begins | **CUT THE WORLD.** fades at 4.0s |

Rules that make this honest:

- "Why" = the Watcher is sealing the world off; the only way deeper is
  through the seam — it is being *cut*, and pieces of the world are
  escaping. No sentence; the imagery is the reason.
- "How" = you cut things. First rack, first pull: the opening teaches it
  without a single instruction (existing Cutting Room does this — the
  cold open just gives it a cause).
- Every cold-open element already exists in `src/art/splatr-art-engine.js`
  (`narrativeBackdrop`, `narrativeWorld`, the mask, the seam); this chunk
  sequences and lights them. No new core art, one new overlay painter
  (`src/cutscene.js`, §5.1).

Why this works for the 4-second requirement: the player sees (1) an
enemy, (2) a wound, (3) the instruction *in one word* — and never reads a
paragraph. That is why and how.

---

## 4. The text policy (visual storytelling + highlighted chips)

**The rule:** during play, at most one string is legible at a time, ≤ 4
words, set in the `.story-chip` class only. Everything else is HUD chrome.

- `.story-chip` — `Space Grotesk 600`, letter-spacing 0.18em, acid
  highlight fill (`#ddff89` on `#101310` or inverse), slight skewX(-6deg),
  150–300 ms fade in, 700 ms fade out. Never blinks; never stacks.
- Where chips may appear: the cold open (§3), the SHATTER cinematic
  (§5.4), boss-plate pops ("TWO LEFT"), Monolith fall ("THE SEAM KNOWS
  YOU"), lesson rehearsal phases (§10), fracture thresholds
  ("TREMORS", "FAULT LINES" — already the FRACTURE tier labels, reused).
- Where chips may NOT appear: between normal waves (micro-beats are
  **silent** — §6), menus (menus keep their own layouts), the chooser
  (§12), the pause screen.
- Menus and the Field Manual are exempt from the chip class but not from
  brevity: any single panel copy trimmed to ≤ 12 words where possible.
- Accessibility: every chip is `aria-hidden` (combat-relevant content is
  always also available via ordinary focus order / the objective line) or
  has an equivalent in the existing `#tutorial-objective` region for the
  learning ground.

Concrete removals this chunk proposes (full audit in §4.4):

1. `pop('SHATTERED', …)` and `pop('THE MONOLITH RISES', …)` strings —
   replaced by silent cinematics + one chip (§5.4, §7.4).
2. `say('The Dimension Shatters.')` etc. — voice lines kept but demoted
   (no longer the primary carrier); one over the drop, never over the tear.
3. Wave HUD line `CLEAR THE FIELD` — deleted; the roster brief already
   shows what's left, visually (`drawEncounterRoster`).
4. `SECTOR 01/02/03` and `WAVE N` persistent readouts — reduced to a
   1.4 s chip on transition, then gone.
5. All `BREAK WAVE / CLEAR TARGETS` style strings in `#district` — gone.

---

## 5. THE SHATTER, reworked completely

### 5.1 Where it lives today (anchors)

- `run.js` `shatterEvent()` — fires at meter 100: sets `arenaMode =
  'SHATTERED'`, 6 ticks of freeze, +1 hull, dash refill, sets
  `s.shatter = 78`, emits `shatterEvent`. Meter is spent by
  `consumeFracture`.
- `main.js` — on `shatterEvent`: `persistFractureMirror(0)`,
  `setFractureUI(0)`, `audio.shatter()`, `buzz(70)`, `say(...)`,
  `pop('ALL FOUR BORDERS ARE LIVE', …)`.
- The breach path (legacy wave director, `waves.js`): meter ≠ trigger —
  every 5th clear opens `wave.phase='breach'` and the player must *bank
  during Hyper and launch through the ready breach* — a genuine earn.
  Continuous sectors (`continuous-sectors.js`) instead gate on **three
  anchor locks + the seal**; the SHATTER meter is an independent persistent
  system fed by cuts (`FRACTURE_PER_KILL = 0.4`, `_WAVE_CLEAR = 2.5`,
  `_DIMENSION_BREAK = 6`, `_MONOLITH = 12`).
- So today "the shatter happens" in two disconnected vocabularies with zero
  seeding in the first seconds of the run and no payoff framing. That is
  the ambiguity to kill.

### 5.2 The new fiction and rule set

**THE LAW**: the Watcher seals the world one sector at a time. A seal
honds shut unless cut — a tear doesn't open for free. The only things
that cut the world are SHAPE-RIOT blades. Therefore the Cutter's job is
to bring a piece of the Watcher's own machinery (a seal) to the edge — and
shatter it.

In mechanics:

1. The FRACTURE meter (0–100) fills from *everything* (as today) — but now
   each tier has an in-world signature (sky stages, §9.3) so the player
   reads progress in the world, not the ribbon.
2. When the meter hits 100 **the next seal the player fully empowers is
   armed** — the tier reads `CRITICAL COLLAPSE` and the HUD line goes
   `THE SEAL HOLDS ITS BREATH` (≤ 4 words, chip class).
3. Crossing that seal (as the ordinary crossing — live blade, upward, pace
   floor, exactly like today's seal crossing) **fires the SHATTER as the
   consequence**: singularity, sky tear, the seam becomes a permanent
   aurora behind the player. The world is SHATTERED — one emergency per
   run; the next fill arms the next sector.
4. If the player reaches a seal *before* the meter is at 100, the seal
   holds — it does **not** open. The player learns: the tear is earned.
   The line `THE METER IS THE KEY` is shown **once**, at the moment the
   player first faceplants into a held seal (never as ambient text).
5. Continuity: in wave mode the breach becomes the same event (bank in
   Hyper → launch through → SHATTER as reward), removing the two
   vocabularies.

Why this is the honest fix for "earned thing": the player cannot stumble
into the best spectacle in the game; they must fill the meter and then
*win the crossing*. Both are skill-expressive. The 4-second cold open
makes the promise legible; the breach delivers it (§5.4).

### 5.3 Reworked SHATTER event (technical)

State changes on fire:
- `s.shatterDone = true`; `arenaMode='SHATTERED'`; rails live 1.3×
  (`MAX_PINBALL_SPEED` cap); `kineticStage=1` (unchanged ladder);
  6-tick world freeze retained; +1 hull (≥ 2 floor) retained; dash refill
  retained; meter consumed (now: 100 → 0).
- `s.shatter` goes 78 → **140 ticks** and becomes the cinematic clock
  consumed by the renderer (flash decays in phases, not one linear fade);
  pole camera shake is exposed as `s.shatterShake` for the frame painter;
  border lights go permanent in the renderer for the rest of the run.
- New: `s.shatterRung = 1 + Math.floor(s.shattersDone)` — each subsequent
  SHATTER in a run (wave mode across five-wave cycles) escalates the
  cinematic by one rung (more shards, deeper singularity core, an extra
  Watcher crack) — never changes the rules, only the show.

Cutscene driver (new `src/cutscene.js`):

```
createCutscene({ beats, onDone, reducedMotion, skipKeys, onSkip })
  beats: Array<{ id, ticks, draw(ctx, t, world), lockInput?: boolean,
                 sfx?: string, chip?: { text, at } }>
  - pure reducer: tick(dt) → { playing, finished, skipped }
  - lockInput drives `s.inputLock` (renderer + physics read this; existing
    `focus()`/aim paths already respect `!state.held` style gates — the
    lock suppresses dash entirely)
  - reduced motion: ticks × 0.6, flash beats halved amplitude, no zoom
  - skip: after 0.8 s of the beat, any key/pointer ends the cutscene
  - zero permanent world state written by the cutscene itself; the WORLD
    ops (arenaMode, hull refill…) are plain calls in the emit path exactly
    where `shatterEvent()` does them today — cutscenes dramatize state,
    they never create it
  - draws on the same canvas via a small overlay pass after the foreground
    layer; no DOM video, no new asset bundle except glyph shapes (paths)
```

### 5.4 The SHATTER cinematic — shot list (input locked, ~4.2 s)

| t | visual | audio |
| - | ------ | ----- |
| 0.00–0.10 | absolute freeze (existing 6-tick stop); all particles stop; the mask on-screen snaps its head toward the player | silence |
| 0.10–0.45 | singularity core appears at the player's chest position, hollow black with an acid rim; the world *bends* toward it (vignette pulls, border lattice warps) | sub rise; heart drops one beat |
| 0.45–0.85 | white-amber crack flash sweeping from core to all four edges (48 px/frame around the arena borders); shards lift in rings | glass-crack riser → tearing sub |
| 0.85–1.60 | the sky opens: `FRACTURE_SKY[4]` COLLAPSE SKY drops in; 12–16 drifting shards settle and STAY for the rest of the run (already implemented); the Watcher mask splits visibly down the middle on-screen | deep tear; low choir swell |
| 1.60–2.20 | borders ignite — one pulse travelling clockwise; the acid rim becomes aurora; ember rain starts | four low bells, one per border |
| 2.20–3.00 | camera dollies back and up 1.1× (the world, not the cube, is the subject for the only time in the game); the SHATTER pip on the spine bursts full-bright | heartbeat resumes, double-time for 2 s |
| 3.00–4.20 | control returns with zero warning; the world is simply undeniable; the pip row shows **IT HOLDS.** chip for 0.9 s (then gone forever) | silence for exactly three seconds, then the run's tempo |

Chip budget: exactly one (`IT HOLDS.`). Everything else is light, shards,
and sound. Reduced motion: no dolly-back, no vignette pull, flash at 0.35
amplitude, total 2.6 s.

### 5.5 The breach becomes the ceremony

In wave mode, crossing the breach during Hyper → the same cinematic.
In continuous mode, the armed-seal crossing → same cinematic. Two paths,
one heart. The 6.0 fracture reward fires on completion; the +12 from the
Monolith is the other friend you never see coming (§7).

---

## 6. Micro-story each wave, until the SHATTER (silent beats)

Plays on the same live canvas, never blocks input, never between two
beats back to back. Each beat ≤ 2.0 s. Beats do not author new states —
they read `wave.number`, `story.sector`, `fracture.tier`, `s.shatters`,
`monolith` and dramatize.

| after | beat (visual only) | watcher state |
| ----- | ------------------- | ------------- |
| W1 clear | the mask's good eye blinks — off to the side, like a player who missed something | normal |
| W2 clear | one of three conduits in the sector backdrop (existing paint) flickers and *dims* | curious |
| W3 clear | the mask's split seam-line opens one notch wider; crack-glow breathes | alarmed |
| W4 clear | the mask's two horns ignite, faint white on the tips — it understands | ready |
| SHATTER | §5.4 | split |
| S(+1) clear | SHATTERED aurora behind the player pulses with each slash for 2 s (this is the reward, felt) | silent |
| Monolith seated | §7.4 cinematic | landlord |
| Monolith fallen | §7.5 | kneeling — horns lowered; two-frame hold |
| Sector 10 breach | the mask wipes one eye with a claw — *almost* a laugh | amused |
| Run end | the seam narrows to a pinstripe and goes dark; one ember drifts loose | asleep |

Rules: no text, no blocking, all beats skippable by construction (they
are decoration drawn in the overlay pass), all respect reduced motion
(skip ambient animation, keep pose changes).

Between waves there is no prose — `drawEncounterRoster` already shows the
next wave composition as icons; that is the entire "story of the next
wave". This chunk deletes any text equivalent, including the roster's
heading (§4).

---

## 7. THE MONOLITH, reworked — enormous, active, legible

### 7.1 The complaint, and the truth of it

Today: `kind:'monolith'`, `r: 130`, `hp: 10`, `pinned: true`, zero AI
branches in `slasher.js` — one damage rule (banked OVERCHARGED cuts take
a plate), no movement, no attacks, no telegraph, nothing. It is a door.
The user's report is exactly right.

### 7.2 Size and presence

- Radius **130 → 215**; the looming slab fills the upper third of the seam
  (the existing trapezoid painter scales; the outline K grows ×1.65).
  Placement unchanged (`seal.y − 340`, real seam).
- The arena behind it darkens one level (`narrativeBackdrop` tier +1
  devotion to shadows) so the slab reads against the sky, not the pips.
- Its silhouette is now tall enough to *cow* — top edge off-frame at
  100% zoom; the camera does one free 2-frame push-up when it seats.

### 7.3 What it does (three behaviors, all telegraphed, all dodgeable)

| behavior | interval | telegraph | effect |
| -------- | -------- | --------- | ------ |
| **SEISMIC LASH** | every 6.0 s | floor crack-lines crawl outward from its base for 0.9 s, dust motes, low rumble | four debris arcs launch in a fan; each is a real hazard body; hitting the player costs 1 hull; dodge by banking/being airborne; parryable (counts as a block) |
| **PLATE SLAM** | every 4.5 s (while ≥ 3 plates remain) | one plate slots loose visibly — the seam glows white for 0.5 s | a 150-px AOE shockwave ring at its base when that plate drops; jump/dash through the ring or be shoved 220 px + stunned 0.35 s (stun = no air control only) |
| **GRAVITY LENS** | every 9.0 s | the core iris (existing ember) dilates; the rim beads bright | for 1.5 s the world accelerates the cube *toward the slab* (2.1 px/tick² along the line); the player must answer with banks orslashes; the slab takes +1 damage from anything it pulls through it for that window ("it doesn't get to choose what hits it") |

All three are timed from `performance.clock`-style ticks inside the wave
director; all three stop the instant the Monolith falls; none of them are
hazards during the 1.8 s fall cinematic. The slab never moves — it is a
fixed landmark, which is what makes the pull fair.

Difficulty note: none of these damage the player during entry/invul, and
the field is cleared when the Monolith seats (existing behavior), so the
fight is always 1v1-plus-telegraph.

### 7.4 The seating cinematic (3.6 s, input locked)

| t | visual | audio |
| - | ------ | ----- |
| 0.00–0.40 | the seal shudders; the last remaining lock-glints go flat; dust falls UPWARD out of the seam | rising drone |
| 0.40–1.10 | the slab *descends* into the seam from off-frame — 1.6 s of weight with three ticks thudding the camera | sub thumps ×3 |
| 1.10–2.20 | its five plates ignite one by one (bottom → top), the beam-split ring dominates the frame | five bells, tuned, rising |
| 2.20–3.00 | the world leans: the vignette collapses, all color desaturates except the ember | hold one note |
| 3.00–3.60 | control returns; the boss bar slams in (§7.6); one chip: **THE LANDLORD.** | the run's tempo re-enters |

### 7.5 The fall cinematic (2.6 s)

Five plate-kernels pop, ember geyser, the slab doesn't crumble — it
*photographs* into shards like the sky did; the seam welds itself shut
behind him with a hiss; +12 tribute lands as designed; chip: **THE SEAM
KNOWS YOU.**

### 7.6 The boss bar (Minecraft-style, bottom center)

New DOM `#bossbar` (index.html, sibling of `#tutorial-objective`):

```
                 ⟠  THE MONOLITH · SEAMKEEPER  ⟠        ← 9px Space Mono, gold (#ffd75e) with 1px black border, letterspaced
   ┌───────────────────────────────────────────┐
   │ ▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮                  │   ← segmented bar, 5 segments of 2 plates, violet notches;
   │  0.0s                                10  │     drains per 2 HP; each lost segment pops with a crack flash
   └───────────────────────────────────────────┘
```

- Hidden unless `wave.phase === 'monolith'`.
- Updates per plate, not per HP tick (5 clean steps — the plates are the
  unit of drama); each step shakes the bar 6 px, plays a deep clack, and
  fires one ember burst across the HUD.
- Reduced motion: bar pops, no embers, no shake.
- `aria`: role="progressbar" with `aria-valuemin/max/now` = plates left,
  not HP fraction. Palette: MC parity is the reference — `#3c2f4a` rail,
  `#b77cff` fill, `#ffd75e` name — but saturations pulled ~15% toward the
  game's existing FRACTURE violet so it does not read as a mod.
- Adds zero new rules; pure projection of `hp / 10` by twos.

### 7.7 The arena size fix (with Monolith in the seam)

`WAVE_ARENA` (in `src/waves.js`, commented CHUNK 1) goes
`{x:-1170, y:-1715, w:2340, h:2015} → {x:-1600, y:-2300, w:3200, h:2600}`
(+37% width, +29% height). The floor stays at `y + h = 300` so the pad,
spawn and trampoline keep their measured heights; the headroom above is
what grows. Sector lifts `arena.y -= 850 → -= 1000`. Stream-cell density
unchanged (width is free). The camera's `questView` gains 12% lookahead so
large aerial swings read. The minimap panel resizes proportionally.
Expected feel: the corridor becomes a canvas; banking matters again.

---

## 8. THE SPINE — making the progress bar impossible to miss

Three redundant channels, all painting the same truth:

### 8.1 New: the diegetic spine (in-canvas, foreground)

A vertical stress-crack down the lower third of the playfield —
the same seam motif as `narrativeWorld`, but horizontal-minimal: a thin
dark stroke with ember light seeping through, brightening from 0–100 as
the meter fills. Every kill: the spine flashes a pulse traveling toward
the top edge + a small `+0.4` ember glyph drifts up from the cut point
(canvas, not DOM — no layout cost). At ≥ 75 the spine audibly ticks every
second; at 100 it MELTS white and the `CRITICAL COLLAPSE` frame edge glow
arms (§9.3).

### 8.2 The ribbon, demoted but not deleted (`#fracture-hud`)

- height 20px → **34px**, stepped in from the 8px safe area;
- `SHATTER EVENT` label shrinks to 7px (it decorates, never instructs);
- the % figure doubles; the tier word grows 1.4×;
- on every fill: a 600 ms `fracture-gain` class animates the fill with a
  bright sweep + the ribbon flares' glow; on tier change: full ribbon
  pops, screen edge vignettes inward (`.fracture-surge`), and the HUD
  waterline glints once.
- `data-ready=true` behavior (the ready shimmer) retained unchanged.

### 8.3 The right-edge track becomes THE RAIL OF SEALS

`narrativeTrack()` (canvas overlay, top-right inside playfield): the
three lock pips + seal diamond grow 1.6×, colored per lock, and now fire
particle bursts on each lock break; when the seal is ready the diamond is
dragged by a millimeter of float and the camera pushes 24 px toward it for
0.5 s once per approach. No text is added; the old chevron ("edge points
toward the seal") is kept and gets a highlight-flash on 100%.

### 8.4 Audio attention

On gain ≥ 2.5 (a wave clear), a soft three-note chime family; on tier
change, the tier's own motif; on 100, a heartbeat drum until the tear.
Floorless silent banks of quiet: the game gets louder about the meter as
it fills — escalation is the attention mechanic.

### 8.5 Honest limits

None of this measures attention; it is a bet on motion-chroma-audio
salience. The success criterion for QA is: a first-time player can say
"the world is about to break" without ever being told. That gets
playtested, not asserted.

---

## 9. Why the sky already teaches (fracture tiers as free storytelling)

The build already paints five `FRACTURE_SKY` stages from the meter (0 /
10 / 35 / 60 / 88 → CLEAR SKY, HAZE, CRACKED SKY, SPLIT SKY, COLLAPSE
SKY) and four `FRACTURE_TIERS` (STABLE / TREMORS / FAULT LINES /
CRITICAL COLLAPSE). The chunk does not add a meter; it **promotes the sky
to be the primary UI**:

- the spine (§8.1) brightens per stage;
- tier rumble already fires (`rumble` 480/240/120 ticks) — now the
  rumble is paired with a one-frame muzzle flash from the sky edge;
- the title menu's SHATTER EVENT card already exists — on run return it
  now shows the tear's scar for one second (the only time the menu ever
  shows time-based motion; `persistFractureMirror` drives it).

That's the "sense of progression" job for free: the player is always
*inside the number*.

---

## 10. THE WATCH — enemy lessons that let it happen

Replacing today's three text steps + `NEXT STEP` button + reminder text
in `teaching-ui.js`. The design, per lesson, is always the same skeleton:

1. **THE ARENA IS THE LESSON.** The lesson spawns the real enemy, real
   field, zero instructions. A thin white spotlight ring sits on the
   enemy; the camera frames it and nothing else.
2. **TIME DILATES.** The world runs at **0.32×** (`world.slow` forced
   regardless of focus input) while the attack telegraphs — the player
   reads the wind-up in their bones, not their eyes.
3. **ONE CHIP, THREE WORDS, MAX.** The phase chip flips as the state
   flips: `WATCH IT.` → (tell) `WAIT…` → (strike) `NOW.` / on dodge ->
   `IT MISSED.` / on being hit -> `IT FOUND YOU.` / on a cut -> `CUT IT.`
4. **ANY ACTION ENDS IT.** The lesson has no Next button. Acting —
   launching, slashing, blocking — is the only advance. Survive the one
   scripted attack; the field offers the enemy for the finish; first
   kill ends the lesson with the standard pop and a single ember flourish.
5. **REPEAT UNTIL HONEST.** Dying in a lesson restarts silently from
   phase 1 (never a fail state) — the contrast between 0.32× and the real
   speed IS the lesson's content.
6. **"TRY AT SPEED"** — one small button (not a wall) re-runs it at 1.0×;
   unlocked only after the first clear of that lesson.

Effects on existing copy: `TEACHING_STEPS` (`teaching.js`) loses every
`label`/`action` pair — replaced by `phases: { idle, tell, resolve }`
chips; the `.teaching-step-*` DOM is deleted; the illustration canvas
stays (it is drawn, not text); the dialog chrome shrinks to a single
`CLOSE` and the lesson select. The LIVE TRAINING hub (Chunk 5) keeps its
three-door framing; the lessons door body copy is trimmed to ≤ 12 words
total. All 11 lessons get the skeleton; Fang/Pulse/Prism/Fork/Bastion/
Rift/Well/Crown/Monolith/Fang/Link all fit it identically (the Monolith
lesson stays a broken-door joke: it never attacks — the chip is just
`REACH IT.` and the lesson ends on the face, exactly as shipped).

Files touched: `src/teaching-ui.js`, `src/teaching.js`, `src/style.css`,
`index.html` (behind the same dialog), `test/teaching.test.js` (new
assertions: no `.teaching-step-*` in DOM, chip sequence equals the state
machine, lessons completable by simulated input, repeat-on-death loop),
`test/chunk5.test.js` (remove the removed-class assertions).

Reduced motion: time dilation drops to 0.6×, chip fades instant instead
of pulse, spotlight steady.

---

## 11. Earned speed — the MOMENTUM pip economy (§14.2)

The problem is a real measurement problem: a banked rally plus wall-hammering
hands the cube permanent enormous speed, which erases the pitch of "fast"
(nothing to spend) and the pitch of "earned" (no achievement). Fix is a
three-pip economy, honest and visible:

- **MOMENTUM** — three pips above the dash rack. Filled by: a cut on an
  enemy at ≥ 60% `MAX_SPEED` (one pip), a wall bank at ≥ `target pace` from
  `speed-pace.js` (one pip). No other source grants pips. Pips decay one
  every 14 s of no cut and no bank.
- **Speed floors while pips are held**: 1 pip ≥ 1.0×; 2 pips ≥ 1.25×;
  3 pips → **HYPER is available** (chain requirement relaxed from 7 to 5).
  Bounces alone can never fill pips (bank grants pips, not power). A cut
  without pace grants nothing (killing a slow shape pays points, not
  propulsion).
- **Visual**: the three pips sit in-world in the spine (§8.1) — they glow
  when earned, shatter when spent on Hyper. The "enormous speed" moment
  becomes legible and composed, not wall-derived.
- **Banks diminish**: effective rebound for arrival speed > 160 px/tick
  becomes `1 + 0.35 × (160 / arrival)` — banks stop compounding above
  160, so hyper is a destination, not a staircase of bounces.
- **Rails (SHATTERED) unchanged**: 1.3× is the world's reward, not the
  player's grind — it is deliberately exempt.
- REVISIT: pip decay 14 s, pace thresholds — tune in 6F against the
  speed-pace telemetry (`wave.pace.target`, `state.moved`).

---

## 12. Hyper steering — the actual bug, and the actual fix

The user's report is precise: "when i drag while the cube is moving on it's
own in hyper speed it loses it's speed". The mechanism is found and named;
this is not folklore:

1. **Held drag engages focus** (`focus(on)` in `src/run.js:628`) →
   `setBulletTime(world, on)` → `SLOW_MIN = 0.1` (`movement-model.js`,
   `focusScale: .1`) — the world time dilates 10×. At 280 px/tick the
   cube covers one pixel per real frame — it *feels* and *measures* as
   losing its speed. Gravity is lightened in step (×0.1), so even the
   fall looks dead. This is the perceived 90% loss.
2. **Release at speed**, `launch()` preserves speed via retention
   (`steerRetention`, run.js:653) — 0.85 floor even on a full reversal,
   1.0 (1.05 bank-steer) otherwise — the math is fine; the *felt* blender
   is (1).
3. Hyper's exit has physical teeth (drag `0.011`, ticks budget `360`,
   ceiling floor `HYPER.speed = 280`, ascent cap exempt) — those stay.

The fix (state, not symptoms):

- `SLOW_MIN` stays `0.1` for ordinary flight.
- New: `setBulletTimeScale(on, speed)` — if `s.hyper === true ||
  speed > HYPER.speed * 0.6`, held-drag floors `world.focusScale` at
  **0.55** instead of 0.10 (still half the world's speed, never a crawl;
  gravity stays at ×0.4 under hold, not ×0.1).
- `steerRetention` at hyper: angleDiff ≤ 90° → **1.05** (full keep),
  ≥ 120° → **0.90** (the reversal floor rises from 0.85). Ordinary flight
  untouched.
- Held-drag at hyper costs the same focus meter (unchanged) — a real
  cost, one the player already understands.
- The ceiling never drops below `HYPER.speed` while hyper is live (the
  existing exit block does exactly this; regression-asserted).

Tests (`test/hyper-steering.test.js`, new):

- dash after a 120° reversal at 280 px/tick exits ≥ 252 px/tick.
- held frame: `world.engine.timing.timeScale ≥ 0.5` at hyper speed.
- ceiling stays ≥ 280 while held at hyper.
- ordinary (non-hyper) held frame unchanged: timeScale floor 0.1.
- pip-economy: bank grants pips but never raises rebound above the 1.35
  cap; pip count gates hyper entry at chain ≥ 5 + 3 pips.

---

## 13. Ninety-degree turns in one sentence — the UPGRADE DOCTRINE

Writing "before/after" honestly means codifying:

- A card shows **its own math, not vibes**: `+25% → 47 → 59 px/tick`
  as a two-bar glyph pair (`.statBefore`, `.statAfter`) beside the glyph.
- Every stat bar has a named floor (min) and a named cap (max) the bar
  renders against — no invented units, no hidden normalization.
- The pick screen is **frozen behind a 300 ms input lock** so the player
  reads, not react-clicks; the recommended card (TACTICAL FIT logic in
  `recommendWaveOffer`) shows a subtle edge glow, never an arrow.
- Choosing is **loud**: 80 ms card stun + flash + one glyph-burst; the
  next wave begins with a half-beat of silence and the new stat materially
  visible in the first 3 seconds of the wave.
- Every upgrade is either **real** (a rule in code, §14) or doesn't ship.

### 13.1 The forty (5 tracks × 8)

Notation: `→` = the before→after the card renders; cost = a stated
trade-off when not free. Ids in `camelCase`; tier: C/R are common/rare
weights, **D = DIMENSION tier, rolls only after the first SHATTER of the
run**. All numbers REVISIT `6F`.

**THE MOMENTUM TRACK** (speed you can see)

| id | card | before → after | cost | tier |
| -- | ---- | -------------- | ---- | ---- |
| fleet | SWIFT EDGE | Dash speed 42 → 48 | — | C |
| comet | COMET DRIVE | Dash 42 → 53 / Reach 100 → 85 | short blade | R |
| guard | SAFE EDGE | Exit window 0.13 → 0.26 s | — | C |
| afterburn | AFTERBURN | +8% rebound per wall bank (max +24%) | — | R |
| slashback | SLASHBACK | a cut in hyper refunds 0.35 s | — | R |
| secondwind | SECOND WIND | at pace ≥ 31 px/tick for 4 s: +1 edge pip | — | R |
| bankloop | BANK LOOP | wall rebound 1.0 → 1.12× (max 1.28×) | — | C |
| poise | POISE | held-aim gravity keep 0.10 → 0.35 while falling | — | C |

**THE CUT TRACK** (damage and reach you can feel)

| id | card | before → after | cost | tier |
| -- | ---- | -------------- | ---- | ---- |
| cleaver | HEAVY CLEAVER | plate strip 1 → 3 / blade 14 → 10 | shorter window | R |
| reach | LONG EDGE | reach 1.00 → 1.20 | — | C |
| breaker | ARMOR BREAK | armor break +1 plate | — | C |
| linger | LASTING EDGE | blade 14 → 22 ticks | — | R |
| thinedge | THIN EDGE | width −25% / reach 1.00 → 1.60 | razor-line | R |
| doublejoint | DOUBLE JOINT | 2+ shapes one slash: 2nd takes ×2 damage | — | R |
| restlessedge | RESTLESS EDGE | blade decay −30% a tick | — | C |
| executioner | EXECUTIONER | shapes < 20% hp take ×1.5 | — | R |

**THE STAKES TRACK** (risk with a price tag)

| id | card | before → after | cost | tier |
| -- | ---- | -------------- | ---- | ---- |
| duelist | GLASS EDGE | score ×1 → ×1.5 / exit window 0.13 → 0.06 | fragility | R |
| bounty | BOUNTY EDGE | score ×1 → ×1.25 | — | C |
| bastion | TWIN WARD | 2 blocks per wave / dash ×0.90 | — | C |
| barrier | ONE-HIT WARD | 1 free block this wave | — | C |
| glassorbit | GLASS ORBIT | score ×1 → ×1.35 / max hp 3 → 2 | breakable | R |
| ironnerve | IRON NERVE | first hit each wave deals 0 | — | C |
| hollowbonus | HOLLOW BONUS | flawless wave: +60% score | — | R |
| debtsettlement | DEBT SETTLEMENT | fracture per clear 2.5 → 6.0 | — | R |

**THE REBIRTH TRACK** (the run that remembers)

| id | card | before → after | cost | tier |
| -- | ---- | -------------- | ---- | ---- |
| memoryofseams | MEMORY OF SEAMS | each run starts at 10% fracture | — | R |
| stampedsteel | STAMPED STEEL | Bastions always spawn with −1 plate | — | C |
| embertax | EMBER TAX | credits +10% | — | C |
| covenant | COVENANT | flawless clear: +2.0 fracture | — | R |
| ashreader | ASH READER | offers reveal their lucky roll before pick | — | C |
| sharddividend | SHARD DIVIDEND | shatter pays +6 fracture (was 6 → 12) | — | R |
| gambler | GAMBLER | every 4th card is free lucky | — | R |
| kingmaker | KINGMAKER | Monolith falls: +3 max hp permanently | — | D-adjacent |

**THE DIMENSION TRACK** (rolls only after the first SHATTER; the jackpot room)

| id | card | before → after | cost | tier |
| -- | ---- | -------------- | ---- | ---- |
| godsmother | GODSMOTHER | post-SHATTER: borders 1.35× for 12 s | — | D |
| tearborn | TEARBORN | SHATTER grants +1 max hp this run | — | D |
| phaseline | PHASELINE | SHATTERED: assisted cut line shows for 2 s | — | D |
| ghostlash | GHOST LASH | every 3rd slash echoes, 1 dmg free | — | D |
| crowncinders | CROWN OF CINDERS | pace > 140 for a wave: +1 fracture, credits ×1.5 | — | D |
| landlordskey | LANDLORD'S KEY | Monolith plates take double from OVERCHARGE | — | D |
| wheelofwatcher | WHEEL OF THE WATCHER | a lucky roll can roll twice (jackpot) | — | D |
| theending | THE ENDING | final wave, full hp: wave multiplier ×2 | — | D |

Count: 8 + 8 + 8 + 8 + 8 = **40**. Weights: C 1.0, R 0.35, D 0.12 (D only
after first shatter; before that, D cards don't exist in the pool), and
the `recommendWaveOffer` TACTICAL FIT logic stays; `lucky` conversion
passes through `buffPresentation`-style honest derivation (no authored
lucky strings).

### 13.2 Where it sits in the run

The continuous mode removed the legacy per-wave chooser deliberately
(`continuous-narrative-plan.md`) — this chunk reintroduces a **rest beat**
after each seal crossing (not per wave): a half-second landing beat on the
new sector's floor, the chooser opens with **three** of the 40, the pick
is free, effects last to run end (not "next wave only" — rogue-lite
meaning), and the chooser cannot be reopened for that sector. Wave mode
keeps its five-wave cadence with the same 40. Practice mode unchanged
(nothing is owned or earned; cards show but never apply).

Effects routing: new id → `src/upgrades.js` declarative table with a
small set of effect lanes, all consumed by systems that already exist
(equipment rules, waveBuff path, pace, hyperStep, fracture.js) — no new
parallel rule engine. Credits/shields/score lanes reuse `killLedger` and
`state.countShield/waveShield`.

### 13.3 Dopamine ladder per rest beat

1. settle (0.4 s of floor landing, camera exhale)
2. the tear-scar shimmers (if SHATTERED) for 0.6 s
3. chooser cards deal in one-by-one at 90 ms intervals with a riser tick
4. read (300 ms lock) → pick (burst, shake 4, SFX chord) → the first
   slash next wave benefits immediately and visibly
5. every ~3rd offer deals a lucky (unchanged rate, now legible)

Between rests the player gets: micro (every cut), sector (per seal),
chapter (SHATTER), and one climax per run (Monolith). Four octaves, one
crescendo — the shape of dopamine, not the substance of it.

---

## 14. The full cheatsheet of new numbers (implementor-facing)

### 14.1 World and arena

| thing | value | file |
| ----- | ----- | ---- |
| ARENA (continuous/wave) | `x:-1600, y:-2300, w:3200, h:2600` (floor +300) | `src/waves.js` `WAVE_ARENA` |
| sector lift | `arena.y -= 1000` | `continuous-sectors.js` |
| SHATTERED rebound | 1.3× borders, cap 320, unchanged | physics.js `MAX_PINBALL_SPEED` |
| hyper | 280 / chain 5 (with 3 pips) or 7 / budget 360 ticks | run.js `HYPER` |
| pip economy | §11 | `src/speed-pace.js` + HUD |

### 14.2 SHATTER

| thing | value |
| ----- | ----- |
| meter | 0→100, `FRACTURE_PER_KILL 0.4`, `_WAVE_CLEAR 2.5`, `_BREAK 6`, `_MONOLITH 12` |
| tiers | STABLE / TREMORS 25 / FAULT LINES 50 / CRITICAL 75 — unchanged |
| sky | 5 stages, unchanged thresholds |
| 6-tick freeze | kept |
| hull | +1, floor 2, kept |
| cinematic length | 4.2 s (`s.shatter = 140`) |
| reduced motion | 2.6 s, no dolly, flash ×0.35 |
| skip | any key after 0.8 s |
| rung scaling | `s.shattersDone` rungs |

### 14.3 Monolith

| thing | value |
| ----- | ----- |
| kind | `monolith`, r 215, hp 10 (plates ×2), pinned |
| seat | on SHATTERED third-lock break, unchanged gate |
| seismic lash | 6.0 s interval, 0.9 s crack telegraph, 4 arcs, 1 hull hit |
| plate slam | 4.5 s, telegraphed 0.5 s, AOE 150, shove 220 px, stun 0.35 s |
| gravity lens | 9.0 s interval, 1.5 s duration, 2.1 px/tick² pull, double plates that window |
| boss bar | segments 5, bottom-center, MC parity palette, updates per plate |

### 14.4 Upgrades

| thing | value |
| ----- | ----- |
| pool size | 40 (5 tracks × 8) |
| offer | 3 per rest beat |
| cadence | per sector clear (continuous) / per 5-wave cycle (wave mode) |
| duration | run length |
| tiers | C 1.0 / R 0.35 / D 0.12 (D gated on first SHATTER) |
| lucky | unchanged, revealed by ASH READER |
| TACTICAL FIT | `recommendWaveOffer` retained |

---

## 15. Slicing (each lands green or not at all)

- **6A — the hook** (P0): cold open + cutscene driver + SHATTER cinematic +
  text audit (§4 removals) + spine (§8.1) + ribbon surge (§8.2).
  Tests: cutscene reducer, skip/reduce-motion gates, chip budget audit,
  the cold open fires exactly once per session.
- **6B — the landlord** (P0): Monolith enlargement + three behaviors +
  boss bar + arena size-up + sector lifts.
  Tests: telegraph→hit timings, stun/shove vectors, pull direction, plate
  doubling window, arena bounds & spawn stay +300, boss bar plate sync.
- **6C — the reward** (P1): 40-upgrade catalog + chooser v2 (before→after
  bars, deal-in animation, read lock) + DIMENSION tier gating + post-seal
  rest beat. Tests: catalog integrity (40, unique ids, costs parse, D
  excluded pre-shatter), presentation derivation, rest-beat wiring.
- **6D — earned speed** (P1): pip economy + rebound diminish + hyper
  entry relaxation + `slowFloor` at hyper + retention curve + tests
  (§12/§14.2). Tuning pass with telemetry.
- **6E — THE WATCH** (P1): lessons rehearsal rewrite + chip state machine
  + reduced-motion variants + practice-mode grace.
- **6F — balance & docs**: full Chromium QA sweep (desktop/mobile/reduced
  motion, normal/SHATTERED), `docs/shatter-arc.md` as-built report,
  risky-number revisit list, `docs/img/shatter-*.png` before/after shots.

Sequencing rationale: 6A+6B are the "whoa" slice and carry the user's
verbatim ask first; 6C–6E are the depth slices; 6F proves them.

---

## 16. Verification and QA

- Suite gates: every slice keeps the suite green; new tests listed per
  slice (target +45 tests: reducer 8, monolith 9, boss bar 4, upgrades 10,
  presentation 4, hyper/pip 8, pacing/lesson 6).
- Browser QA (`qa-browser/chunk6-*.mjs`, SwiftShader where it holds, real
  Chromium where it doesn't): cold open ×2 (first-run and returning
  player), full 5-wave arc in headed Chrome, Monolith fight to fall,
  chooser before→after interaction, reduced-motion run, mobile landscape.
- Coverage honesty: headless cannot prove *enjoyment*; it proves state
  machines, input locks, timings and no console errors. Feel claims are
  tuning bets, flagged REVISIT honestly. The current implementation and
  browser limitation are recorded in `docs/shatter-arc-as-built.md`.
- Perf: cutscene overlay adds < 1 ms/frame (vector path count < 40);
  boss bar DOM writes only on plate change; chooser re-renders only on
  deal steps.

## 17. Risks, and what this plan does **not** claim

- **Scope is the primary risk.** Even executed cleanly this is 4–6 slices
  of work after approval; 6A+6B alone is a full chunk. If the budget is
  one chunk, cut 6E first, then 6C's DIMENSION tier.
- Comprehension is a bet, not a guarantee — no sample of "web gamers" is
  ever guaranteed to understand anything in 4 s; the plan minimizes cost
  of misreading, it does not eliminate it.
- The rogue-lite chooser re-enters a space the authors deliberately
  retired (`continuous-narrative-plan.md`); reviewers should re-litigate
  that decision with fresh eyes before 6C lands.
- The pip economy changes hyper entry economy; old muscle memory will
  feel wrong until it clicks — the ARCHITECTURE must let us revert the
  pip gate without reverting the steering fix.
- Nothing here touches monetization, meta-progression beyond fracture,
  or the tutorial's existing 4-room safety net.
- No claim is made that this raises retention, engagement, conversion or
  anything else. It is designed to be watched and felt, then measured
  honestly.

## 18. Open decisions for the user (before 6A starts)

1. **Slice order** — 6A→6B→6C→6D→6E→6F as listed, or do you want 6D
   (steering fix, smallest) shipped first as its own micro-chunk?
2. **The name** — THE WATCHER is a working name synthesized from the
   existing mask art; alternatives: THE KEEPER, THE LANDLORD (Monolith's
   alias), THE SAW. Pick one.
3. **Wave mode vs continuous mode** — this plan makes both play the
   5.x cinematics; continuous stays the shipped browser build, wave mode
   stays for practice. Is that acceptable, or should wave mode be deleted
   once continuous carries SHATTER?
4. **Chooser cadence** — post-seal (per sector) as specced, or also per
   wave like the old five-wave rhythm?
5. **Text chips** — the cold open's final chip (`CUT THE WORLD.`) is the
   longest line I would ever allow (3 words); strike it if you want a
   single word only.
6. **Arena size** — 3200×2600 as specced, or bigger? (Diminishing returns
   past ~3400 wide; camera readability bounds it.)
7. **Commit policy** — this plan is on disk now as
   `docs/shatter-arc-plan.md`; nothing is committed. Commit plan +
   nothing else, with the rest of the uncommitted tree, or hold all?
