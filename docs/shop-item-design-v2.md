# SPLATR — Detailed item identity, ability and interaction design

**Version 2 · 73 individual item specifications · planning only**

> Superseded by the single [unified upgrade harmony and implementation blueprint](unified-upgrade-harmony-implementation-plan.md).
> V2's conflicting rules and cosmetic-only elemental restrictions are historical;
> do not implement this draft independently.

This replaces the earlier interaction-juice plan as the proposed design direction.
It is not a changelog: none of the new mechanics, icons or animations described
here should be advertised as implemented. Current rules were checked against the
catalogue, equipment resolver and perk/readout modules in this checkout.

## What was wrong with the first plan

It assigned motifs to existing numbers, but did not sufficiently answer why a
player would choose one item over another, what happens between pressing a button
and seeing a result, or how an artist/programmer verifies the result. “Make it
spark” is not an animation specification; “+score because neon” is not enough of
an identity. This revision gives every item a separate specification and explicitly
redesigns several weak fits instead of treating every existing passive as sacred.

## How to read this document

- **Current:** implemented baseline, not a promise of future behavior.
- **Target — retain/refine:** keep the mechanic, improve explanation and feedback.
- **Target — redesign:** proposed replacement, requiring mechanics tests, balance
  review and updated receipts before release. Do not silently add it on top.
- New timings/percentages are **first-prototype values**, not balance conclusions.
- Animation milliseconds are presentation time. Mechanics use the existing 60Hz
  simulation clock: 6 ticks ≈ 100ms; 12 ≈ 200ms; 30 ≈ 500ms; 60 = 1 second.
- A visual “echo,” flame, frost crystal or crack never deals damage by itself.
  Damage/resource changes must come from an explicit authoritative rule.
- All listed combinations are cross-slot playstyle suggestions, **not new named
  fusion recipes or guaranteed sword profiles**. Existing Apex recipe matching
  remains a separate system and must be regression-tested if a rule changes.

## A. Four layers of item identity

1. **Shape:** a silhouette understandable without its name or color.
2. **Verb:** what the player is encouraged to do: hold aim, line up horizontally,
   bank off a wall, maintain a chain, attack armor, or accept risk.
3. **Proof:** an observable change in a real stat/event, shown without a paragraph.
4. **Personality:** a local sound/animation that belongs to that shape and verb.

Do not force every purchase into a new active skill. Some items should be simple
and reliable; others should reward a specific technique. The free kit remains
fully playable and legible. Paid utility is not permission to weaken the free
controls, hide standard enemy telegraphs, or sell basic accessibility.

## B. The redesigned shop card

- Primary: distinctive item icon, item name, one-line verb: **FLOAT WHILE AIMING**,
  **BREAK TWO PLATES**, **RECHARGE ON A WALL**—not vague “epic power.”
- Secondary: one compact benefit, a visible condition and any tradeoff.
- States: free baseline / unowned / challenge / owned / equipped / previewed.
- Large selected view: attachment close-up, then a repeatable demonstration.
- Two deliberate actions: Buy to own, Equip to use. Selection only previews.
- For redesigned items, use a versioned receipt and migrate ownership by the same
  item ID. Do not reset credits, presets, challenge unlocks or discoveries.
- Where a cap reduces the selected item's effective benefit, show **BUILD CAP
  REACHED** or the actual marginal gain. Do not advertise an unattainable total.

## C. Interaction choreography shared by all items

### Pointer-down → selected → purchase → equipped

1. **Down, 0–70ms:** depress the inner surface 1–2px; icon compresses to 96%.
   Start acknowledgement on pointer-down; never wait for purchase completion.
2. **Release, 70–170ms:** return with a small controlled overshoot. The card's
   selected edge seats once; no bouncing text or modal movement.
3. **Preview, next paint:** selected item's icon locks in and its demo restarts.
   Hover can inspect but never overwrite the actual equipped badge.
4. **Purchase success, 0–280ms after authoritative success:** stamp OWNED, settle
   the wallet once, emit at most 6 local fragments in that item's material.
   Purchase failure never plays the success stamp or spends twice.
5. **Equip success, 0–240ms:** attachment assembles according to its own section
   below; equipped badge latches. Loading an already-equipped item is quiet.
6. **Close/reopen:** no unfinished purchase burst, stale held pointer, replayed
   sound or surprise animation backlog. Restore focus sensibly.

### Other controls and outcomes

- Navigation: directional edge-notch moves once; short dry tick. No particles.
- Toggle: a physical detent and visible state label, not only a color change.
- Pause: local panel reveal; stop gameplay/audio correctly, not a cinematic pause.
- Resume/retry: decisive snap, immediate control; no animation input lockout.
- Valid aim: tension notches engage; canceled aim visibly releases without firing.
- Armor contact, lethal cut, earned bank, guard block and damage have distinct
  local stamps. Do not reuse the same explosion for success and failure.
- Chains: each link seats; Overdrive: reactor locks in; score/credits: settle once.
  Existing rare dimension impacts remain rare; ordinary clicks never trigger them.
- Disabled/locked: small bracket contraction and readable reason, not screen shake.

## D. Icon art contract

Author **73 unique bundled vector symbols**, one per item ID. A 32×32 construction
grid uses a dark outline, 2px nominal strokes, 2px safety inset and clear negative
space. Check at 20px monochrome, 28px card size and 48px detail size. Maximum three
large shapes and one signature accent per small icon; tiny text and color-only
tier differences fail review. Larger previews may expose more material detail.

Slot glyphs are not item glyphs. A benefit badge is not a substitute for an item
icon. The actual worn attachment and icon must share the same defining contour.
SVG symbols serve DOM UI; portable Canvas art remains inside the art engine,
using shared path data or a bounded raster atlas—not DOM access in engine code.

## E. Hard limits and common acceptance tests

- UI effects: propose a global maximum of 3 local bursts/24 fragments, not one
  emitter per button. Drop cosmetic overflow rather than defer it into a backlog.
- Combat feedback: one primary accent per event plus an aggregate benefit receipt;
  simultaneous items cannot produce eleven overlapping labels or full-screen FX.
- No additional postprocessing pass or shader texture read. Prefer baked sprites,
  bounded pools and transforms/opacity on existing small DOM surfaces.
- Respect mute, hidden-tab/context suspension, reduced motion and optional haptics.
  Reduced motion uses the same final state without travel, flashing or overshoot.
- One source of truth for actual rules, values, cooldowns, eligibility and caps.
  Visuals consume stable event IDs; drawing twice cannot proc or play audio twice.
- Existing caps remain unless a tested design change explicitly revises them:
  perk blade +8 ticks, chain grace +36 ticks, aim-cost reduction 30%, passive
  recovery bonus 40%, conditional equipment score bonus 25%. Existing special
  core/head score rules must remain explicit rather than assumed inside that cap.
- Proposed instant FOCUS refunds are a separate path: prototype aggregate limit
  **8% of maximum FOCUS per shot**, no overfill and no refill from secondary kills.
  Do not apply passive-recovery multipliers to those refunds.
- Same-slot alternatives cannot stack. Reflections, secondary zaps, echoes and
  decorative fragments must not recursively trigger primary-cut rewards.
- For each entry: test the positive case, one just-outside boundary, no duplicate
  activation, pause/resume/cleanup, four viewport sizes and reduced motion.
- Real-device frame-time and memory measurements remain necessary. Controlled
  RAF/browser screenshots are correctness checks, not evidence of locked 60 FPS.

---

# I. CUBE / HEAD — nine different decisions

## 01. Bare Head — `none`
**Identity: the clean, readable original. Current: free baseline, no head modifier. Target: retain.**
- **Player reason:** choose an uncluttered face and neutral rules. Free equipment should feel deliberately designed, not like missing content. Do not add a hidden disadvantage to make paid heads attractive.
- **Icon:** square brow with one folded upper corner and two uninterrupted eye openings. No hat outline, question mark or empty-slot cross. At 20px it must look like a finished Cube head.
- **Art/animation:** selection removes the old attachment with a 90ms local retract, then seats the clean brow over 110ms. Do not make the entire hero disappear while swapping. Ordinary gaze, blink and launch squash remain.
- **Gameplay proof:** show the standard head beside two alternate heads, with “NO HEAD MODIFIER”; baseline speed and cut width are labelled 100%. Do not claim head choice itself provides health—the normal health also depends on the core.
- **Sound/purchase:** soft paper click on equip; no purchase celebration for a free default. Already equipped is silent.
- **Build/readability:** useful with elaborate shells/tails because it preserves facial space. Default silhouette remains recognizable in every world.
- **Specific gate:** removing Viper must remove both its speed bonus and width penalty on the next applicable run; removing Crown must remove its speed cost. Saved selection survives reload.

## 02. Gold Halo — `halo`
**Identity: a stabilizing suspension ring. Current: 15% lighter gravity while aiming and falling. Target: retain/refine.**
- **Player decision:** buy extra time to compose an aerial shot, not flight, a double jump, or invulnerability. It should reward deliberate airborne aiming.
- **Icon:** tilted gold ellipse above a small downward chevron, with an open gap between them. The ring is the primary silhouette; the arrow explains suspension without resembling a clock.
- **Rule boundaries:** active only when the existing aim/fall rule is eligible. Releasing aim restores normal gravity immediately. No extra horizontal steering, global slow motion, or additional stacking multiplier from its visual motion.
- **Art/state:** idle ring tilts slightly; on eligibility it levels over 100ms and its lower edge becomes a narrow bright crescent. Inactive while rising/grounded. Release leaves one 100ms fading crescent, not repeated particle rings.
- **Shop demo:** two identical falling Cubs enter aim together; baseline and Halo descend different distances under the real gravity rule. An aim-release beat shows both returning to normal. Label “FALL GRAVITY −15%,” not “15% slower game.”
- **Sound:** a quiet suspended metallic note only at eligible-state entry, with retrigger suppression; landing stops the accent.
- **Pair/test:** Time Crystal supports longer focus management, but does not multiply gravity reduction. Verify rising, falling, grounded, canceled aim and empty FOCUS separately.

## 03. Cyber Ears — `neko`
**Identity: alert antennae that keep the next target in mind. Current: +12 chain ticks. Target: retain with genuinely articulated ears.**
- **Player decision:** forgiving continuity after a kill; easier retargeting, not more damage. The attachment should visibly “hear” a completed action and stay attentive through the extra grace.
- **Icon:** two dark triangular ears with inset triangular cavities, connected by a short broken waveform. Pink accent is optional; the paired-ear silhouette must work in monochrome.
- **Rule:** existing qualifying-kill grace +12 ticks, under the +36 build cap. No automatic target selection, nearby-enemy revelation or resource refill. Show the effective additional grace if another item has already reached the cap.
- **Art/state:** equip ears fold outward then seat upright in 180ms. On a qualifying kill, one ear flicks at 0–70ms and the other answers at 40–110ms; two link notches brighten for the actual extension. Launch gets a smaller compression, not a fake benefit trigger.
- **Shop demo:** kill target A, aim at B late; baseline chain expires first while the ear-equipped chain still exists. Use a visible 12-tick difference, not an arbitrary long rescue window.
- **Sound:** paired tiny servo clicks, one combined cue per kill event.
- **Pair/test:** Time recovery is complementary. Test cap saturation, chain reset, secondary-kill exclusion and rapid multi-kills without an ear-animation backlog.

## 04. Viper Horns — `viper`
**Identity: fast, narrow, committed strikes. Current: +20% launch speed, −15% cut width with active-reach compensation. Target: retain.**
- **Icon:** two swept crimson horn blades forming a long narrow negative-space arrow. Do not use a snake head: the worn horns should be recognizable.
- **Player decision/rule:** trade a wider safety margin for speed. Preserve existing blade-lifetime compensation so speed does not silently become a free straight-line range buff. Ballistic landing distance can still differ; show that honestly.
- **Art/state:** equip horns seat from opposing diagonals, 160ms. At launch, inner horn edges brighten for 70ms; a two-line local compression marks acceleration. They do not bend the hitbox or leave a permanent red trail.
- **Shop demo:** synchronized launch lanes show faster arrival and visibly narrower contact bands. Include an edge-offset target the baseline catches and Viper misses. This tradeoff is more important than a flashy speed streak.
- **Sound:** short, dry whip/crack rather than a bass explosion. The highest-speed cue has a rate cap.
- **Build:** Thrusters is a high-commitment movement option, not permission to exceed the speed ceiling. Sniper rewards full-power accuracy; it does not repair the lost cut width.
- **Specific gate:** compare center and edge contacts, horizontal range compensation, floor landing and high-speed camera tracking; no camera-lead changes to make the item feel faster.

## 05. Broken Oni — `oni`
**Identity: visible defiance at the last health point. Current: challenge unlock; +50% kill score at 1 health. Target: retain, with stronger risk communication.**
- **Icon:** one intact horn, one snapped stump, and one diagonal mask crack. Symmetry would erase the item's identity. A small exposed core wedge sits inside the break.
- **Rule:** retain the existing Crown-at-1-health unlock and one-health score condition. No added damage, shield, lifesteal or death prevention. State clearly that SCORE is not shop CREDITS. Existing special score stacking must be shown in the build receipt.
- **Art/state:** equip the cracked plate in two uneven pieces, 220ms. At health >1 the crack is dark. At exactly 1 it fills with a steady ember line over 120ms. Qualifying kills send one pulse along that crack; no persistent flashing low-health overlay.
- **Shop demo:** identical kills at 2 health and 1 health show different score receipts; a separate incoming hit demonstrates that the item does not save you. Preview cannot simulate earning the actual unlock.
- **Sound:** one low cracked ceramic knock on activation; qualifying kill adds a short dry ring, subordinate to hurt sounds.
- **Pair/test:** Glass Cannon creates permanent eligibility but also permanent one-hit risk. Iron's one guard remains visibly separate. Test healing out of eligibility, run reset, challenge persistence and no rewards from repeated rendering.

## 06. Cube Crown — `crown`
**Identity: a heavy armor-crushing headpiece. Current: two plates per eligible hit, −8% launch speed. Target: retain.**
- **Icon:** three-point crown above two short plate bars, one splitting under the center point. Jewel remains a secondary detail, not a coin symbol.
- **Rule/choice:** specialize against Crown/Bastion armor without claiming universal double damage. Retain which targets the current rule affects; do not imply a new boss bypass. The speed cost stays on the card and preview.
- **Art/state:** crown drops only a few local pixels and seats with a heavy 220ms squash. On an eligible two-plate event, the jewel compresses and a two-step fracture appears at the enemy, not across the screen. One plate left means one actual remaining plate breaks.
- **Shop demo:** baseline and Crown strike identical armored targets; show actual remaining plates, then a short side-by-side speed comparison. A normal Fang shows no imaginary second reward.
- **Sound:** two tightly spaced metallic plate clicks merged into one cue; equip has a short heavy latch, not royal fanfare on every selection.
- **Build:** Foundry's armor-score affinity can complement this head. Cannot combine Crown with Oni or Samurai because all occupy Head.
- **Specific gate:** test one-plate remainder, target exclusions, speed penalties, Hyper steering remaining unchanged, and no extra proc per broken decorative plate fragment.

## 07. Samurai Crest — `samurai`
**Identity: disciplined horizontal iaido. Current: +20% cut width within 25° of horizontal. Target: retain with precise eligibility feedback.**
- **Icon:** swept crest horns over one level blade line; outer tips span wide horizontally rather than resembling Viper's forward arrow.
- **Rule:** use the existing angle normalization and threshold in both directions. Do not make the aiming assistant rotate the user's shot. The wider band is earned through alignment, not purchased auto-aim.
- **Art/state:** equip headband wraps, then crest tips unfold over 210ms. During aim, crest tips briefly align when entering the valid angle band; steady highlight while eligible. Outside it, return to neutral without a failure shake.
- **Shop demo:** toggle between 0°, just inside the allowed angle and just outside. The cut-band overlay changes from base width to +20%; enemy positions remain identical. Angle labels must use the same rule as gameplay.
- **Sound:** sheath-like scrape on equip and a short clean swish on eligible release; no repeated ping while hovering near the threshold.
- **Build:** Katana Ink and Paper Ninja create a legible precision aesthetic. Named sword-profile changes are still resolved separately and must not be promised from only two pieces.
- **Specific gate:** test positive/negative horizontal directions, wrap-around angles, boundary jitter and exactly-once threshold feedback; keep bracket coloring independent of item role.

## 08. Lightning Coil — `coil`
**Identity: a real two-terminal electrical relay. Current: direct cut zaps one neighbor within 160 for one plate. Target: retain; make routing obvious.**
- **Icon:** two squared uprights joined by one jagged bridge; no generic standalone bolt. A single small outer endpoint signals one secondary target, not unlimited chain lightning.
- **Rule:** retain eligibility, range, one-plate limit and no recursive spark procs. If no eligible neighbor exists, the coil gives a small discharge-to-self indication, not a beam toward empty space. Deterministic target selection must come from combat code.
- **Art/state:** terminals assemble separately in 180ms. Idle bridge is restrained. On a valid proc, charge gathers for a maximum visual 40ms, then one 70ms segmented arc connects the real source/target positions. Damage timing is never delayed to wait for the arc.
- **Shop demo:** two close targets receive primary/secondary results; move neighbor outside 160 and show no zap. Label the second hit “SECONDARY — NO CHAIN PROC.”
- **Sound:** one short electrical snap, not a sustained buzz; simultaneous procs aggregate.
- **Build/test:** Echo Heart may coexist, but a Coil kill must not feed its direct-kill counter unless that is explicitly the authoritative rule. Test armor remainder, removed targets, equal-distance ties and repeated event delivery.

## 09. Danger Beacon — `beacon`
**Identity: an industrial warning instrument, not a decorative party light. Current: amber early Fang-windup bracket. Target: retain/refine.**
- **Icon:** low lamp housing with a directional wedge and a notch-shaped warning cutout. Avoid an exclamation point alone; the physical beacon is the recognizable item.
- **Rule:** warn on actual eligible Fang windup, preserving ordinary enemy telegraphs for everyone. No future-attack prediction, auto-dodge or fabricated all-clear guarantee. Offscreen behavior must respect existing warning rules rather than the 100px enemy-art cull.
- **Art/state:** equip lamp cap twists one eighth-turn and locks, 190ms. Idle is dim. Windup entry produces one amber sweep toward the threat and a persistent local tell marker for its true duration. Clearing/canceling windup clears the alert immediately.
- **Shop demo:** a Fang begins winding up behind the player; show the warning earlier than the charge, then contrast canceled windup. Demonstrate that the player still has to move.
- **Sound:** optional low-volume two-click relay only on new danger entry, coalesced across simultaneous threats. No continuous siren.
- **Build:** Oracle Radar gives a map-level tell; Beacon gives a local directional warning. Combine their UI without duplicating two large arrows.
- **Specific gate:** moving/despawned enemies, camera-edge threats, hidden tabs, reduced motion and multiple simultaneous/canceled tells.

# II. CUBE / EYES — seven attitudes and aiming tools

## 10. Ninja Slits — `ninja`
**Identity: clear intent with no instrument between player and target. Current: free eyes, standard aim. Target: retain.**
- **Icon:** two asymmetric tapered slits separated by a broad central bridge; no face outline needed. Strong contrast in every core palette.
- **Rule/choice:** baseline visibility and normal targeting. The free eyes must keep the same input responsiveness, aim power readout and enemy readability as purchased eyes.
- **Animation:** on equip, eyelids close over 60ms, new slit shape opens over 90ms. During play, gaze follows existing intent, blink is short and suppressed during critical release readability. Launch compresses the slits; no extra glow ring.
- **Demo:** user-controlled target tracking, aim tension and one clean release. Label “STANDARD AIM — NO EYE MODIFIER,” with no fake damage comparison.
- **Sound/juice:** dry cloth-like tick on equip only; normal clicks use the shared feedback language. Do not make a blink audible.
- **Build:** a deliberate option for visually complex cores or shells; no paid icon should make this silhouette look disabled.
- **Specific gate:** test gaze extremes, small hero scale, dark/bright worlds, reduced motion and no information loss compared with purchased eyes.

## 11. Cyber Visor — `visor`
**Identity: immediate digital targeting efficiency. Current: aim costs 10% less FOCUS. Target: retain as the reliable no-ramp option.**
- **Icon:** continuous shallow visor with one diagonal scan cut and a square calibration notch; visibly different from Crosshair Pointer.
- **Rule:** 10% lower aim drain from the first eligible tick, within the shared 30% cap. No extra time slowdown, free aim at zero FOCUS, or target lock.
- **Animation:** equip visor wipes across the face over 160ms. Aim entry brings one scan line to rest on the gaze direction; an outer notch remains lit while reduced drain applies. Stop scanning continuously after settling.
- **Demo:** synchronized FOCUS bars under the same aim duration, with the visor bar draining less from the start. End both examples with the same real release power.
- **Sound:** one tiny digital acknowledgement on aim entry, not a machine-gun tick every time the scan line updates.
- **Build:** Hologram Wire is compatible but combined efficiency must show its true capped value. Hypno is an alternative eye choice with a proposed longer-hold specialization.
- **Specific gate:** short taps benefit immediately, canceled aim returns to neutral, zero-FOCUS rules remain unchanged, and cost reduction never alters `stepPhysics` frequency.

## 12. SSJ Blaze — `blaze`
**Identity: an excited reactor that feeds on Overdrive action. Current: +8% score during Overdrive. Target: redesign into controlled Overdrive sustain.**
- **Proposed rule:** replace that score passive with **2% maximum FOCUS returned per primary direct kill while Overdrive is active**, at most 8% per Overdrive activation and within the aggregate 8%-per-shot refund gate. No refill from sparks/echoes, no health recovery, no extra Overdrive duration. Prototype values require testing.
- **Icon:** two upward flame-shaped eyes around a compact four-point hot center. Not a full hair silhouette that is absent from the equipped item.
- **Animation:** equip opens pale eyes, then two short flame tips ignite, 190ms. During normal play they remain warm but quiet. Overdrive lights a steady white-hot center. Each accepted refund adds one short inward ember traveling toward the FOCUS meter; spent refund budget leaves dark tick marks.
- **Demo:** enter real illustrative Overdrive, make four qualifying kills, show +2% receipts, then a fifth kill with no refund. Explicitly show “NO HEAL / NO DRIVE EXTENSION.”
- **Sound:** short rising ignition on state entry; subdued ember click for accepted refunds.
- **Build/test:** pairs with Riot's faster activation but must not self-sustain infinite Overdrive. Test caps, simultaneous kills, state expiry and activation reset.

## 13. Glitch X-Eyes — `glitch`
**Identity: broken pixels rebuilding themselves between attacks. Current: +12% passive FOCUS recovery while not aiming. Target: retain.**
- **Icon:** one angular X and one broken ring with a two-pixel offset; keep this asymmetry consistent with the intended equipped artwork. No duplicated generic X icon.
- **Rule:** faster existing passive recovery, not random teleportation, invulnerability frames or focus refunds on input spam. Normal recovery eligibility still applies; no regeneration above maximum.
- **Animation:** equip assembles three stepped pixel groups over 180ms, without a full-screen glitch. During recovery, a small missing eye segment reseats once, then remains stable; aiming displaces it again. Limit discontinuity to a few face pixels.
- **Demo:** baseline and Glitch bars recover from the same low value. Switch to aim and show the recovery stopping under normal rules. Never visually fill before the underlying value changes.
- **Sound:** a short low-volume stepped chirp on recovery entry, at most once per meaningful transition; avoid static noise loops.
- **Build:** pairs with Time or Tide but displays the actual aggregate recovery rate and eligibility. Blade-extension items do not inherit “glitch damage.”
- **Specific gate:** repeated aim/cancel cannot create extra FOCUS; transitions remain calm in reduced motion and at low frame rates.

## 14. Smug Half-Lid — `smug`
**Identity: relaxed composure after a successful cut. Current: +12 chain ticks. Target: redesign into a short retargeting discount.**
- **Proposed rule:** after a primary direct kill, open a **24-tick Composure window**. Aim entered during it gets an additional **15 percentage points of drain reduction for at most 12 aim ticks**, still under the shared 30% drain-reduction cap. One charge; another kill refreshes rather than stacks. Existing +12 grace is replaced, not retained.
- **Icon:** one heavy half-lid and one lifted outer corner, with a small flat calm line underneath. No chain badge as the primary icon after the redesign.
- **Animation:** equip eyelids settle lazily over 180ms. Kill lifts one eyebrow for 80ms and displays one calm notch. Eligible aim consumes the notch and narrows the eyes; expiry simply lowers it. Overdrive may open the eyes gold, but does not grant another unlisted buff.
- **Demo:** cut → aim promptly versus cut → wait too long; show the discount only in the first case, using equal aim durations.
- **Sound:** soft latch on charge grant/consume, never a voiced laugh.
- **Build/test:** distinguishes it from constant Visor efficiency and long-hold Hypno. Test window boundaries, cap saturation, refreshed charges and secondary kills.

## 15. Hypno Spiral — `hypno`
**Identity: deep concentration that develops during a sustained aim. Current: constant 15% lower aim cost. Target: refine into a ramped specialization.**
- **Proposed rule:** start at **5% lower drain**, increase linearly to **20% lower drain across 24 consecutive aim ticks**, then hold. Normal aim release resets the ramp; all reductions share the 30% cap. This replaces the existing flat 15%. Do not slow enemies or alter physics time.
- **Icon:** two offset spiral discs, one broad inward curl and one smaller curl; legible at 20px without dense hypnotic striping.
- **Animation:** spirals begin loosely aligned, tighten and settle as the ramp develops. Avoid endlessly high-contrast spinning. At full concentration, one steady inner notch appears; no strobing.
- **Demo:** compare a six-tick tap and a 36-tick hold against the immediate Visor. Explain “SHORT AIM: VISOR / LONG HOLD: HYPNO” as a comparison, not an automatic equipment recommendation.
- **Sound:** restrained descending focus tone on reaching the stable state, once per hold and only if sound enabled.
- **Build:** Halo gives falling space to build concentration; Time helps recovery between holds, not the ramp speed.
- **Specific gate:** interrupted aim, empty FOCUS, pause, cap ordering and exact ramp integral. A slower display refresh must not change the resource calculation.

## 16. Sniper Dot — `sniper`
**Identity: commit to a fully formed shot. Current: +10% qualifying kill score at full power. Target: retain with honest threshold indication.**
- **Icon:** single crimson center dot inside a dark narrow band and four detached range ticks. It must differ from the free reticle through a central sight-band silhouette.
- **Rule:** read the authoritative power condition (currently the qualifying score helper's ≥0.9 threshold) rather than pretending only a mathematically exact 1.0 counts. Snapshot eligibility at the correct shot/kill point; no bonus merely for holding aim long.
- **Animation:** equip sight slides into the band over 160ms. During aim, ticks converge as actual power rises; at eligibility they seat once and the dot becomes solid. A valid high-power kill adds one small score stamp at the victim.
- **Demo:** two releases just below/at the real threshold, then one miss. Show that eligibility alone does not pay score and that this is not increased damage.
- **Sound:** subtle lock click, not an auto-aim lock-on alarm. Suppress chatter around the threshold with presentation hysteresis, without changing the scoring boundary.
- **Build/test:** works with Viper's accuracy challenge. Verify low-power kill, high-power miss, secondary kills and conflicting cursor/eye glyphs.

# III. CUBE / SHELL — ten materials with readable behavior

## 17. Paper Ninja — `paper`
**Identity: the bold folded-paper original. Current: free baseline shell. Target: retain as a high-quality material, not a blank placeholder.**
- **Icon:** folded square with an off-center diagonal crease and one exposed dark underside. Paper can be recognized without an origami bird or tiny text.
- **Rule:** balanced shell; no extra armor, fire vulnerability, cheaper aim or concealed penalty. Do not describe ordinary base health as a unique shell upgrade.
- **Animation:** equip folds the two visible faces inward over 200ms, preserving eyes and hitbox center. Existing squash stretches the drawing only. Edge crease darkens briefly at impact, then restores without persistent damage texture implying lost health.
- **Demo:** show turn, aim, release and bank under baseline rules; on contact, identify the real collision/body outline. A paper material is not an excuse for a larger decorative silhouette hiding the hitbox.
- **Sound:** soft paper fold on equip, crisp dry cut accents that do not replace actual material-contact sounds.
- **Build:** pairs visually with Samurai/Katana/Manga; only an actual full recipe may claim its special sword profile.
- **Specific gate:** small-scale ink outline, bright Manga background, all core palettes, and no geometry/hitbox change from fold animations.

## 18. Obsidian Stealth — `obsidian`
**Identity: a quiet aerial shell that regroups between strikes. Current: +8% airborne kill score. Target: redesign into airborne recovery.**
- **Proposed rule:** replace the score bonus with **+15% passive FOCUS recovery while airborne and not aiming**, subject to ordinary recovery eligibility and the aggregate 40% recovery cap. No invisibility, aggro reset, collision immunity or extra vertical lift.
- **Icon:** asymmetrical black shard over a clear empty undercut; a thin inset seam provides shape, not a ghost symbol implying stealth mechanics.
- **Animation:** equip dark facets slide together over 220ms. Grounded seams are dim. Eligible aerial recovery traces one restrained inset line toward the core over 160ms and stays steady. Aiming closes that line immediately.
- **Demo:** identical low-FOCUS characters grounded, airborne-idle and airborne-aiming. Only the middle gains the extra rate. Keep the character visible against Void through a neutral keyline.
- **Sound:** subdued stone seat on equip; recovery has no continuous audio loop.
- **Build:** Ghost Scarf supports aerial continuation; Halo helps positioning but does not let recovery run while aiming. Different-slot recovery bonuses still hit the shared cap.
- **Specific gate:** ledge departure, brief wall contact versus floor grounding, paused simulation, cap ordering and no recovery from repeated visual eligibility transitions.

## 19. Hologram Wire — `hologram`
**Identity: an aiming computation cage with a visible engine. Current: aim costs 12% less FOCUS. Target: retain; improve its distinct presentation and core visibility.**
- **Icon:** open wireframe cube, one missing face and a central diamond. It must not resemble the solid Prism Shell.
- **Rule:** continuous 12% aim efficiency under the existing cap, not phasing through enemies or walls. The physical body stays solid. Core animations visible through it must represent whichever core is actually equipped.
- **Animation:** equip vertices appear first, edges connect in 140ms, then the transparent faces settle by 220ms. During aim, the front grid straightens and a narrow core-to-sight line appears. Do not fill the whole hero with noisy scan lines.
- **Demo:** compare equal-duration aim drain, then collide with a wall to explicitly demonstrate solidity. Swap between Standard/Time/Echo cores to show that the shell reveals rather than replaces the core.
- **Sound:** three tiny ascending assembly ticks combined into one short cue; no looping digital hum.
- **Build:** Visor supports a transparent targeting build, but cap status must be visible. Existing fusion recipes stay separate from this shell's individual passive.
- **Specific gate:** transparency over busy backgrounds, overlap with face/attachments, fallback rendering and aim-cancel without retained wire effects.

## 20. Prism Shell — `prism`
**Identity: faceted wall-contact refraction. Current: two upward wall needles, one Fang plate each, 45-tick cooldown. Target: retain.**
- **Icon:** solid faceted square splitting into two thin upward shards. Exactly two exits distinguish it from a generic crystal.
- **Rule:** retain actual side-wall eligibility, Fang targeting and cooldown. Floor bounces do not become side-wall procs. No needle recursion into more needles, no decorative shards dealing damage, no cooldown reset from rendering.
- **Animation:** equip facets join with a 200ms crystalline seat. Ready state has two narrow lit edge notches. Valid wall contact flashes those two facets and launches two existing projectiles; notches darken through the cooldown, refill once ready.
- **Demo:** side-wall bank launches two needles, an immediate repeated touch shows cooldown, then readiness returns. Display actual 45-tick interval and a floor-contact counterexample.
- **Sound:** paired high glass ticks, restrained compared with a primary cut; one readiness click may be omitted in dense combat.
- **Build:** Wings complements the same wall event in another slot; one proc display should combine “EDGE +1” and the needle indication without two big explosions.
- **Specific gate:** contact jitter, corners, cooldown expiry, target removals and existing projectile lifetime/ownership cleanup.

## 21. Bastion Iron — `iron`
**Identity: one meaningful emergency plate. Current: blocks one Fang rush per run and pushes the player clear. Target: retain with unmistakable spent state.**
- **Icon:** heavy square plate, two rivets and a central latch; one intact latch is the reusable small-state marker.
- **Rule:** not general immunity, not wall-damage resistance (walls already do no health damage), not protection from every hazard. After the real Fang guard is consumed, it stays spent for that run. Loading menus or re-equipping in the shop cannot refill a live run's guard.
- **Animation:** equip plate seats in 230ms with tiny downward compression. On valid guard, plate dents inward for 60ms, clears the collision visibly, then leaves a dark open latch. Keep the face readable and distinguish from a health-loss animation.
- **Demo:** first valid rush is blocked; second causes the normal outcome. Include a different hazard that the plate does not block. Mark “1 / RUN,” not a regenerating shield bar.
- **Sound:** low metallic clack on equip/block, short broken-latch tail when spent; no continuous clanking while moving.
- **Build:** Glass/Oni gain a safety opportunity, not a second permanent health point. Validate whether that hit consumed health through actual state receipts.
- **Specific gate:** simultaneous rush contacts, pause/retry, run reset and duplicate event handling must consume exactly one guard.

## 22. Lava Cracked — `lava`
**Identity: heat retained between kills. Current: +18 chain ticks. Target: retain as a thermal-memory chain tool.**
- **Icon:** charcoal square divided by three uneven cracks, one central molten wedge; no flame outside the shell silhouette.
- **Rule:** +18 chain grace under the existing +36 cap. Heat is the visual metaphor for the real chain timer, not hidden burn damage, heat-based speed or an extra resource to grind.
- **Animation:** equip black facets close around a warm seam over 210ms. Qualifying kills send a single 100ms pulse from center to corners. Crack brightness then follows normalized remaining chain life, not wall-clock time or endless sine pulsing. Chain expiry leaves a quick dull-red afterglow, no screen flash.
- **Demo:** baseline and Lava timers after the same kill; kill again late enough that only the Lava build continues. Stop the demo after expiry so the cool-down is understandable.
- **Sound:** quiet ceramic/ember tick on a valid heat refresh; chain-expiry sound remains shared rather than one extra cue per equipped grace item.
- **Build:** Anchor makes a readable heated-floor-impact style, but only the full existing recipe creates any named fusion appearance.
- **Specific gate:** chained kills, cap saturation, no kills, pause and hidden-tab debt; timer brightness may never imply grace after it has expired.

## 23. Gold Foil — `gold`
**Identity: premium value, not stronger metal. Current: +10% qualifying kill score. Target: retain as the simple score specialist.**
- **Icon:** folded foil corner with one cut-out four-point glint; negative space must distinguish foil from Cube Crown.
- **Rule:** the existing capped +10% equipment kill-score contribution. Never show additional credits, armor, purchase discounts or a higher health maximum. Existing exclusions for secondary/opening events remain authoritative.
- **Animation:** equip a folded face wraps onto the shell over 210ms. At accepted score payout, one 120ms glint travels across the face and a small score delta appears alongside the normal score receipt. A nearly-still idle glint is infrequent and never brighter than danger telegraphs.
- **Demo:** same eligible kill with and without foil, base score and marginal increase shown separately. A nonqualifying event demonstrates no hidden payout. If capped by other gear, preview the actual build gain, not +10% again.
- **Sound:** short restrained coin-like ping for accepted aggregate scoring, never a cash-register cue implying currency.
- **Build:** Gold Confetti makes multi-cut scoring stronger only within the shared cap; Crown is compatible but belongs to a different slot and role.
- **Specific gate:** rounding, cap saturation, fractional contributions and score/credit label distinction across languages/layouts.

## 24. Chamfer Frame — `chamfer`
**Identity: a beveled edge that stays useful a fraction longer. Current: +1 blade tick. Target: retain as a modest always-on geometry perk.**
- **Icon:** octagonal outer corner around a thin diagonal edge; show the missing square corners clearly. No generic shield.
- **Rule:** +1 active-blade tick within the perk blade cap, not a larger physical Cube, extra health or longer rendered trail pretending to be a hitbox. Existing swing/target hit-once rules remain unchanged.
- **Animation:** equip corner caps seat in four alternating pairs over 180ms. Launch puts a thin local specular line on the leading bevel. The extra active tick retains that line; after activity ends, it extinguishes before decorative motion finishes.
- **Demo:** slow annotated timeline magnifies the one-tick difference; a carefully positioned late contact demonstrates benefit. Label “TIMELINE MAGNIFIED” so the apparent duration is not mistaken for normal speed.
- **Sound:** light ceramic click on equip; no unique extra impact sound unless the extension actually changes a contact outcome.
- **Build:** combines with longer-window gear but must show when it contributes zero because of the cap. Chamfer is the reliable alternative to proposed conditional Segmented charging.
- **Specific gate:** exactly one extra tick, no same-target rehit, no physics-body resize and no effect attached after activity ends.

## 25. Notched Frame — `notched`
**Identity: vented sides that release spent aiming heat. Current: 8% lower aim cost. Target: redesign into passive cooling.**
- **Proposed rule:** replace drain reduction with **+12% passive FOCUS recovery while not aiming**, under the 40% recovery cap. This distinguishes a vented shell from the aim-computing Hologram Wire without a new heat meter.
- **Icon:** squared silhouette with two inward side cutouts and one short outgoing vent line. Keep concave corners visible at 20px.
- **Animation:** equip side pieces slide around the cutouts over 190ms. When recovery begins, one soft two-line exhaust leaves the vents for 120ms; thereafter vents stay faintly open. Aim closes the glow, not the physical cutout. No continuous smoke emitter.
- **Demo:** same low FOCUS after release, compare recovery bars; re-enter aim and demonstrate no drain discount. Clearly update the old item's receipt during migration so owners do not expect the former passive.
- **Sound:** soft vent tap on recovery entry, suppressed during rapid aim cancel. Equip has a hollow mechanical click.
- **Build:** pairs with sustained-aim Hypno through recovery between holds; overlaps with Glitch but cap visibility prevents wasted apparent stacking.
- **Specific gate:** passive-only eligibility, no instant refill, edge cases at max FOCUS and old saved loadouts retaining item ownership.

## 26. Segmented Frame — `segmented`
**Identity: articulated plates that store a bank's compression for the next cut. Current: +12 chain ticks. Target: redesign into a bank-charged edge.**
- **Proposed rule:** a fully earned rail rebound arms **+2 blade ticks on the next launched shot**, expiring after **60 ticks**. One charge, refresh not stack; no charge from idle wall contact, no consumption by canceled aim. Its bonus belongs under the +8 perk-blade cap. Replace the old grace passive.
- **Icon:** three overlapping stepped plates, with one short compressed spring-like gap. Different silhouette from Iron's solid plate and Chamfer's one-piece bevel.
- **Animation:** equip plates interlock sequentially, 240ms. Valid bank compresses them for 70ms; charged seams stay lit. Launch releases the plates outward a few local pixels, then seats them as the extra edge expires.
- **Demo:** bank → charged shot → late valid contact; contrast floor touch/expired charge and an ordinary uncharged shot. Include a charge icon so activation is not hidden in decorative seams.
- **Sound:** three small ratchet teeth on charge, one compact release click; never a perpetual rattle.
- **Build/test:** Thrusters shares the earned-bank verb but adds impulse rather than blade time. Test expiry, cap, multi-contact same bank, retries and no charge stealing from preview sessions.

# IV. CUBE / CORE — seven engines, each with a readable state machine

## 27. Standard Heart — `standard`
**Identity: a balanced engine, not a missing special effect. Current: 3 EDGE, normal health/recovery. Target: retain.**
- **Icon:** solid central diamond within three evenly spaced short chamber ribs. It should communicate balanced capacity rather than a generic health pickup.
- **Rule:** default resource/health configuration, without additional perks. The core remains a meaningful choice because Riot reduces capacity and Glass reduces health; do not weaken baseline regeneration to manufacture a reason to buy.
- **Animation:** equip chamber closes around the diamond in 200ms. One restrained beat follows a real EDGE return or launch; no constant large pulse. In an opaque shell show a small supported core inset/receipt, not an X-ray hole arbitrarily cut into the material.
- **Demo:** show three actual EDGE cells and normal health, use one shot, then recover under ordinary rules. Compare capacities directly with Riot and Glass without implying that all core differences are visible at idle.
- **Sound:** neutral short engine latch; resource-ready audio remains shared.
- **Build:** supports gear whose playstyle needs full EDGE capacity. Changing the palette is not a gameplay modification.
- **Specific gate:** resetting from every special core restores the correct capacities; no retained Glass health limit, Time recovery window or Echo counter.

## 28. Time Crystal — `time`
**Identity: a wound crystal that returns focus after a kill. Current: 120-tick 2× passive recovery window after a kill. Target: retain/refine.**
- **Icon:** faceted hourglass crystal with a visible narrow neck and one falling internal shard. Not an ordinary clock face borrowed from another item.
- **Rule:** keep the current qualifying trigger and 120-tick window. State whether additional kills refresh the existing window according to the authoritative rule; do not stack multiple independent 2× multipliers. Aiming still follows normal recovery eligibility. No time rewind or changed physics stepping.
- **Animation:** equip upper/lower crystal halves join over 220ms. Accepted kill fills the upper half instantly; a steady internal fill transfers downward over the actual remaining window. Expiry leaves a clear empty chamber. No pendulum distracting near the eyes.
- **Demo:** kill, recover, briefly aim, release, then let the two-second window expire. Show that the window timer continues normally rather than granting two seconds of guaranteed regeneration.
- **Sound:** quiet crystal wind at activation and a tiny terminal tick; one cue if several kills refresh in the same simulation step.
- **Build/test:** Hypno and Halo support deliberate aiming; recovery percentages need a clear effective-rate receipt. Test refresh semantics, cap/multiplier order, pause and repeated event IDs.

## 29. Riot Reactor — `riot`
**Identity: volatile early ignition with less reserve. Current: Overdrive every four consecutive kills; max EDGE 2. Target: retain with counted ignition.**
- **Icon:** square reactor iris with four bold ignition teeth and two external capacity tabs. Avoid a generic lightning bolt that hides the tradeoff.
- **Rule:** keep the existing four-kill trigger, chain reset and Overdrive duration/behavior. Two EDGE maximum is visible before purchase. Cosmetic reactor charge must not survive a chain break when the actual counter does not.
- **Animation:** equip iris locks through four 40ms steps. Each real qualifying count lights one tooth; fourth closes the iris and emits one compact 180ms local ignition. During Overdrive the center stays hot, not flashing. Exit cools it over 160ms without delaying mechanics.
- **Demo:** count four valid kills, show activation and two EDGE cells, then contrast a broken chain. Never silently fill four teeth from secondary cosmetic procs.
- **Sound:** four short ascending mechanical tones, coalesced if multiple kills arrive together; shared Overdrive cue replaces, rather than layers with, a huge second fanfare.
- **Build:** proposed Blaze sustain fits this core but its refund budget must not feed infinite chains or extend Overdrive.
- **Specific gate:** two/three-EDGE transitions at run creation, direct/secondary kill accounting, chain break and deterministic simultaneous-kill order.

## 30. Glass Cannon — `glass`
**Identity: a beautiful, visibly fragile score engine. Current: Sector 05 challenge; 2× score, max health 1 including repairs. Target: retain.**
- **Icon:** diamond crystal with one deep diagonal fracture and a sharp inner spear. Use a single health notch as a secondary badge, not tiny “×2” inside the primary icon.
- **Rule:** keep the existing unlock, score multiplier and hard health maximum. No passive shield, guaranteed critical hit or automatic heal. Crown repairs cannot raise the cap. Make interaction with Oni and the equipment score cap explicit in build readout.
- **Animation:** equip fragile crystal lowers into a protective visual bracket over 240ms; bracket is cosmetic and must not look like an available guard. A fine crack remains visible at rest. Accepted kill lights a split specular glint for 100ms; damage uses the actual death outcome, not a fake surviving shatter.
- **Demo:** compare equal eligible kill score, show one health, then an unguarded valid hit ending the run. Do not turn risk into a tiny footnote.
- **Sound:** glass seat on equip and a restrained twin harmonic on scoring, subordinate to danger cues.
- **Build/test:** Iron offers one specific block; it does not transform health into two. Test all repair paths, score rounding and unlock/save persistence.

## 31. Grav Core — `grav`
**Identity: a bounded aiming well that bends nearby small threats. Current: small-Fang pull within 220, at most 0.35px/tick. Target: retain.**
- **Icon:** off-center spiral well bending one incoming straight line; do not use a horseshoe magnet, reserved for Magnet Dynamo.
- **Rule:** preserve eligible enemy sizes/kinds, range, aim-only activation and displacement cap. No boss dragging, teleporting targets onto the blade, damage from field lines, or stronger pull at low FPS.
- **Animation:** equip two orbital arcs seat around the well over 220ms. Aiming forms a restrained field bracket around the actual eligible area. Only influenced enemies receive tiny inward tether dashes; stop on release immediately. Field boundary is faint and optional in dense play.
- **Demo:** one small Fang inside 220, one outside and one ineligible heavy enemy. Show the real gradual displacement toward the aim line, then release. Use magnification if necessary, never exaggerate force in an unlabeled replay.
- **Sound:** short low inward “woom” on field entry, no continuous sub-bass masking hazards.
- **Build:** Prism offers wall-driven secondary attacks; Grav only changes eligible positioning. Oracle Lens predictions must use the current displaced snapshot, not pretend future enemy positions are certain.
- **Specific gate:** range boundary, capped movement per simulation tick, release/cancel, wall geometry and no render-side entity writes.

## 32. Magnet Dynamo — `magnet`
**Identity: a close-pass edge condenser. Current: +20% cut width within 100. Target: retain and stop suggesting long-range attraction.**
- **Icon:** open two-pole magnet pinching a short cutting wedge; unlike Grav's spiral, its negative space is a clear U-shape.
- **Rule:** use existing proximity/contact logic and eligible cut calculation. Do not add enemy pull, armor bypass, longer reach or passive damage. Close-cut width must combine with other width modifiers in the authoritative order.
- **Animation:** equip poles clamp around a small rotor in 200ms. During aim, a short close-range bracket can explain potential width; accepted close contact pulls pole tips inward for 80ms and broadens the real blade accent locally. Distant contacts leave it neutral.
- **Demo:** same target just inside/outside the true 100-unit condition; show contact-band widths and a real two-contact Throughcut example. Do not claim every close pass guarantees a Throughcut.
- **Sound:** two small magnetic latch clicks, merged with the primary contact cue.
- **Build:** Crown broadens armor utility while Magnet helps close alignment, but they remain separate effects. Same-slot Grav and Echo cannot be combined.
- **Specific gate:** exact distance sample location/timing, moving targets, width stacking, no extra hits on the same enemy and no misleading range circle.

## 33. Echo Heart — `echo`
**Identity: three successful beats leave one stationary memory. Current: every third direct chain kill leaves a 30-tick ghost blade affecting eligible Fangs once. Target: retain.**
- **Icon:** central heart-diamond with two incomplete offset outlines and three small count breaks; the stationary after-image is clearer than a sound-wave speaker.
- **Rule:** preserve direct-kill count, eligible victims, lifetime and per-target hit-once ownership. No recursive echoes, no tail-following damaging clone, no persisted charge across chain resets unless the actual rule says so.
- **Animation:** equip outlines converge into the center over 210ms. Qualifying kills light 1/3, 2/3, 3/3 segments; third leaves a single local ghost blade at its true world position. Remaining life drains through the outline, then it collapses without a second hit.
- **Demo:** count exactly three direct kills, leave a ghost, move away while a nearby Fang meets it. Show a secondary kill not advancing the next counter and a target already hit not being sliced twice by that ghost.
- **Sound:** three soft taps build to a short hollow double-note on spawn; expiry is silent.
- **Build:** Pixel complements geometric appearance; named echo swords have their own timers and ownership. Display both sources without merging damage logic.
- **Specific gate:** overlapping ghost sources, chain reset, target ID reuse, pause, run dispose and independent source lifetimes.

# V. CUBE / TAIL — seven motion signatures

## 34. Ninja Ribbon — `ribbon`
**Identity: the clean read of movement and recovery. Current: free tail baseline. Target: retain.**
- **Icon:** one folded streamer with a clear kink and forkless end; not twin Viper strands or a translucent ghost duplicate.
- **Rule:** ordinary rebound rules. It should not secretly damp movement, reduce steering, or give a phantom “full control” stat above the baseline everyone already has.
- **Animation:** equip knot cinches in 150ms and cloth unfurls over 90ms. During movement, use existing bounded lag/sway; release and bank give a single natural follow-through. It must not extend so far that players mistake the tail for the active blade.
- **Demo:** idle → launch → earned bank → rest, with a collision/body outline available. The ribbon illustrates motion but does not claim an extra game effect.
- **Sound:** cloth snap on equip and valid launch, integrated with the normal launch cue; no cloth rustle every frame.
- **Build:** works with every material and core palette. The free ribbon deserves the same pose polish as expensive tails.
- **Specific gate:** tail clipping against face/core icons, reduced-motion pose, low-speed stability and no trailing shape suggesting a second hurtbox or projectile.

## 35. Prism Wings — `wings`
**Identity: recover one unit by touching a wall in flight. Current: first side-wall contact per airborne streak restores one EDGE; floor resets. Target: retain.**
- **Icon:** two faceted feather stacks framing one open refill notch. Not a flying-bird outline that promises free flight.
- **Rule:** preserve first-contact gate, +1 EDGE, maximum capacity and floor-reset semantics. No refill from repeated contact jitter, no stacking charges by sliding along one wall, no double jump.
- **Animation:** equip feathers fan out sequentially over 230ms. Ready state exposes one bright inner feather. Valid wall event flexes wings once and sends a single small refill mark toward EDGE. That feather stays dark while spent; floor reset restores it without fireworks.
- **Demo:** airborne wall contact refills; a second wall contact without floor does not; floor then a new airborne contact rearms it. Show no extra benefit when EDGE is already full.
- **Sound:** one short glass-flex plus shared EDGE-ready note only if resource actually increased.
- **Build:** Prism Shell complements wall play in another slot. Thrusters/Anchor cannot stack because they are alternative tails.
- **Specific gate:** corners classified consistently, first contact while already full, floor reset, zero-EDGE states and a spent icon readable through busy worlds.

## 36. Ghost Scarf — `ghost`
**Identity: a lingering cutting presence, not another attacker. Current: +6 blade ticks. Target: retain and make the advertised twin-fold silhouette real.**
- **Icon:** two unequal translucent scarf folds tapering from one knot, outlined so transparency is not required to identify them.
- **Rule:** retain the special +6 extension and its documented relationship to the separate +8 perk-blade cap. No second hit on the same enemy per shot, no autonomous ghost damage, no longer physics dash unless another system already provides it.
- **Animation:** equip knot appears first, then two scarf folds emerge over 240ms. During launch, a thin scarf-edge afterline stays present through the true blade window, then detaches into a harmless 100ms fade. Keep the active/inactive edge visually different.
- **Demo:** a late-arriving eligible target is cut within the extended window; the same target crossing twice does not take repeat damage. Include a clearly labelled active timeline.
- **Sound:** faint short airy tail on launch; never endless whisper loops.
- **Build:** Time/Hologram creates a readable aerial-focus aesthetic; Echo Core remains a different source of an actual stationary attack.
- **Specific gate:** renderer currently has a simpler scarf silhouette—author the twin folds rather than only changing text. Test real window, cap interaction, hit ownership and transparency fallback.

## 37. Viper Tails — `viper-tails`
**Identity: streamers that reward maintaining real speed. Current: +10% qualifying score at speed ≥18. Target: retain as a visible momentum benchmark.**
- **Icon:** two narrow forkless streamers forming an outward V, with one stitch notch each. Different from Viper Horns' forward-cutting arrow.
- **Rule:** measure speed exactly where the scoring rule does; threshold is 18, not a guess from trail length. No bonus acceleration, bleed damage or idle score accumulation. Keep the global equipment score cap.
- **Animation:** equip knots seat together, tails separate over 220ms. Below threshold they droop with movement. At eligibility, stitches align into one bright short pattern; accepted eligible kills make that pattern snap once. Avoid on/off chatter around the threshold visually without changing scoring.
- **Demo:** identical kill just below and at threshold, with speed and actual score shown. A fast miss demonstrates that speed alone earns nothing.
- **Sound:** light two-strand whip at eligible launch, then scoring uses the aggregate score cue.
- **Build:** Viper Horns supports reaching speed but keeps its narrow-width tradeoff. Tokyo adds score only under the cap.
- **Specific gate:** sample point, velocity sign/magnitude, threshold rounding, pause and no cosmetic speed meter used for mechanics.

## 38. Anchor Chain — `anchor`
**Identity: a committed downward weight that turns floor contact into an attack. Current: +15% floor rebound and Fang clear within 170, existing cooldown. Target: retain.**
- **Icon:** three broad links ending in the actual pointed weight, with one flattened impact notch beneath it. Do not depict a boat anchor absent from the attachment.
- **Rule:** retain earned floor-recovery/cooldown conditions, target eligibility and radius. No every-frame ground stomp, no air slam button, no side-wall activation and no damage from decorative chain links.
- **Animation:** equip links drop sequentially then settle, 260ms. On the real floor rebound, weight compresses toward contact and a low local crescent spreads only across the floor area. Link motion never moves the physical body or changes landing timing.
- **Demo:** qualifying floor rebound beside nearby/outside-radius Fangs; immediate repeat under cooldown shows no clear; side-wall bank is a counterexample.
- **Sound:** compact weighted thud with a short chain rattle, capped and subordinate to damage warnings.
- **Build:** Lava gives a coherent thermal-floor visual; Crown occupies another slot but their effects must be counted independently.
- **Specific gate:** floor/side corners, repeated contact events, large targets, cooldown reset and no burst covering hazards near the landing point.

## 39. Mini Thrusters — `thrusters`
**Identity: a precise kick on an earned rail bank. Current: +8% rebound on valid earned rail events, existing speed cap. Target: retain.**
- **Icon:** paired rectangular nozzles with short triangular exhaust cutouts, not a rocket suggesting free steering or flight.
- **Rule:** bonus is conditional on the existing earned-bank definition. No continuous acceleration, fuel meter, wall-hover exploit or compounding above the speed ceiling. No bonus from passive touches.
- **Animation:** equip nozzle brackets slide in over 200ms; both nozzles align with the hero. Valid bank emits two 90ms baked exhaust wedges and a small inward-to-outward mechanical recoil. Idle exhaust is almost absent; no persistent full-length flame trails.
- **Demo:** approach a rail identically with/without thrusters, compare the actual outgoing velocities, then show the speed cap flattening the difference at maximum. Include an unearned-contact example.
- **Sound:** short paired “pfft” impulse; no engine drone. Haptic, if opted in, is a single tiny click-like pulse.
- **Build:** Segmented's proposed bank charge and Volt's proposed resource refund occupy other slots; all share one event identity but have different outcomes.
- **Specific gate:** caps, corner classification, duplicate bank signals, shallow grazes and no modification to player input direction.

## 40. Neon Spectrum — `spectrum`
**Identity: a continuous ribbon that remembers a chain through color bands. Current: +12 chain ticks. Target: retain, but replace uninformative hue cycling with stateful bands.**
- **Icon:** one folded ribbon divided into three interlocking geometric bands; distinguish it in monochrome using alternating cutouts, not seven colored stripes.
- **Rule:** existing +12 chain grace under +36 cap. Speed may affect small cloth motion, but colors cannot imply an unimplemented speed buff. No rainbow damage, bonus per color, or hidden combo multiplier.
- **Animation:** equip the ribbon unfurls from a knot in 240ms. Each qualifying kill advances one short band pattern; the illuminated length represents remaining chain life. At expiry, bands settle to a quiet two-tone material rather than continuing celebratory cycling.
- **Demo:** one chain, an extended late follow-up and expiry. Compare it with Cyber Ears as two shapes supporting the same simple benefit; not every item needs a new hidden mechanic to justify its look.
- **Sound:** short clean resonant tick, with aggregate chain feedback suppressing stacked item pings.
- **Build:** Hypno/Notched is visually coherent; exact named fusions require their actual ingredients.
- **Specific gate:** color-blind/monochrome distinction, band count independent of invented reward tiers, cap saturation and no animation backlog from rapid multi-kills.

# VI. ATTACK / BLADE FX — seven distinct contact materials

## 41. White Razor — `razor`
**Identity: the reference blade—one contact, one clean line. Current: free standard blade window. Target: retain.**
- **Icon:** a single tapered white wedge with a dark clipped root, no decorative spark cluster. It should define the simplest blade silhouette in the shop.
- **Rule:** normal damage, timing and hit ownership. Never make the free blade look dull or conceal its active duration to sell brighter alternatives.
- **Animation:** equip the blade finish draws from root to tip over 140ms, then immediately rests. In play use a compact white leading edge, one contact notch, and a short exit taper. Inactive decorations are dimmer/thinner than the active edge.
- **Demo:** show windup → active window → contact → inactive follow-through with a labelled timeline. The hero must not slide through the slash rig as though slash and dash were the same action.
- **Sound:** clean short swish and actual contact material; no added bass layer. Generic selection gets the shared button click, not a full weapon swing.
- **Build:** universally readable on all worlds, especially dense neon backgrounds. Paid blades must meet the same clarity standard.
- **Specific gate:** no repeated contact on one target, correct active/inactive distinction, readable low-motion pose and no persistent trail across idle frames.

## 42. Katana Ink — `katana`
**Identity: a brush-drawn edge that finishes its stroke. Current: +2 blade ticks. Target: retain as the controlled ink finish.**
- **Icon:** broad-to-fine brush cut with one squared bristle gap and one detached ink drop; not a detailed sword illustration unrecognizable at small size.
- **Rule:** +2 active ticks under the +8 perk cap, with ordinary per-shot hit restrictions. Ink droplets are cosmetic; there is no bleed or floor hazard. Keep named sword geometry separate from this selected finish.
- **Animation:** selection lays a 150ms brush stroke across the icon, clipped inside its tile. Real attack has an ink-dark rear plane, a pale active leading edge and at most 3 drops that exit perpendicular to contact. End the active highlight on the actual final tick; residual ink fades harmlessly.
- **Demo:** one normal-speed stroke followed by a magnified timeline showing the two added ticks and a late eligible contact. A revisited victim does not get cut again.
- **Sound:** dry brush/sword swish, small paper snap on contact; no liquid splatter suggesting blood mechanics.
- **Build:** Samurai rewards horizontal alignment; Paper/Manga support ink readability. Only the complete recipe changes the resolved sword.
- **Specific gate:** brush darkness against Void, bright active edge on Manga, extension cap and no decoy blade drawn ahead of the true contact.

## 43. Neon Laser — `laser`
**Identity: a precise luminous incision. Current: +3 blade ticks and a temporary cosmetic scar. Target: retain with a strict live-edge/scar distinction.**
- **Icon:** straight narrow light wedge with one small emitter collar and a split cyan/pink edge. Different from Volt Dash's angular bolt.
- **Rule:** +3 active ticks under the perk cap. The approximately half-second visual scar is not a half-second damaging laser. No infinite beam, piercing beyond current blade rules or damage while idle.
- **Animation:** equip emitter collar snaps on in 120ms and line ignites for 60ms. Active edge is pale and solid; residual scar is thin, low-alpha and broken at its ends. Use a pre-baked small glow if needed, not a second bloom pass. Maximum scar counts remain bounded.
- **Demo:** show a valid late contact inside the extra window, then a new target crossing only the fading scar with no damage. This negative example is essential for honest visuals.
- **Sound:** small electric cut accent at contact, no continuous laser loop or repeated hum every frame.
- **Build:** Coil may produce a separate actual secondary arc; distinguish scar from that arc by contour and lifetime.
- **Specific gate:** active threshold, scar harmlessness, saturated builds, multiple recent scars and fallback rendering without GL.

## 44. Glitch Tear — `glitch-fx`
**Identity: a local cut reconstructed across a discontinuity. Current: +2 blade ticks. Target: retain; do not turn every cut into full-screen corruption.**
- **Icon:** one stepped slash split into two offset blocks, with a narrow continuous central seam. Monochrome offset must still read.
- **Rule:** +2 active ticks, no teleport, delayed second damage pass, hitbox skip or frame skipping. Art can look discontinuous while the authoritative blade path stays continuous.
- **Animation:** equip two halves misalign for 40ms then stitch by 170ms. Contact creates a bounded local red/cyan offset only around the blade segment for about 90ms. Two tiny square remnants fall away; no camera or HUD displacement.
- **Demo:** overlay the continuous true cutting path beneath stepped art; show one victim receiving one real hit. A magnified timeline explains duration, not an invented time freeze.
- **Sound:** one short granular click aligned to contact, filtered to avoid harsh repeated static.
- **Build:** Hologram/Glitch Eyes is visually coherent, but passive recovery and blade extension remain independent. Named fusion effects must not introduce hidden extra damage.
- **Specific gate:** original/shifted drawing cannot be mistaken for two active blades; verify hit count, effect bounds, reduced-motion static seam and no extra shader read.

## 45. Gold Confetti — `confetti`
**Identity: celebrate a genuinely efficient multi-cut. Current: +12% qualifying multi-cut score. Target: retain and make qualification visible.**
- **Icon:** three angular foil diamonds above a two-contact cut line, with broad empty space rather than a dense party-popper drawing.
- **Rule:** use the existing “additional kill in the same shot” qualification and global score cap. Specify whether the first kill qualifies in the authoritative receipt; do not retroactively promise a bonus not awarded. No confetti collisions or extra credit payout.
- **Animation:** ordinary one-kill contact has at most one foil glint. A real multi-cut adds a 180–260ms fan of 4–6 pooled foil pieces confined near contact/receipt. Purchase celebration may reuse their shape, not the gameplay score rule. No persistent rain.
- **Demo:** one kill versus two and three kills in a shot, with per-kill base/bonus receipts. A two-shot pair is a counterexample, not a multi-cut.
- **Sound:** one soft bright chime on qualification, pitch/volume capped; simultaneous kills aggregate to one cue.
- **Build:** Manga rewards a related condition, but sum to the shared cap; Gold Foil does not create unlimited multiplier growth.
- **Specific gate:** kill ordering, secondary-kill exclusions, rounding, event replay and global fragment budget during dense waves.

## 46. Comic Impact — `comic`
**Identity: one action punctuates the next panel. Current: +18 chain ticks. Target: retain with an uncluttered chain handoff.**
- **Icon:** uneven four-lobed ink burst, one cut-out corner and a single embedded continuation notch. No unreadable “POW!” text at icon scale.
- **Rule:** +18 chain grace within the +36 cap; no stun, extra damage or “impact freeze” affecting physics. The ordinary contact stamp cannot trigger the rare dimension-break sequence on its own.
- **Animation:** equip ink burst folds into the selected corner over 170ms. Real contact produces a small asymmetric black/acid-lime punctuation for 70–100ms. Qualifying kill extends one connected chain segment; the stamp disappears well before the chain does. No floating comic word over every enemy.
- **Demo:** first target becomes one compact comic panel; a late second target forms the next while the true chain remains active. Include the baseline timer as proof, not decorative panels alone.
- **Sound:** short dry “tak” with a small body, distinct from metal armor break. Stronger simultaneous cues override it.
- **Build:** Manga shares visual language, but background hatching never replaces red/green/gold hazard semantics.
- **Specific gate:** text-free localization, background contrast, no fake enemy stun and actual chain eligibility/cap behavior.

## 47. Pixel Shatter — `pixel`
**Identity: a cutting edge that resolves into discrete chips. Current: +2 blade ticks; harmless 30-tick square debris. Target: retain with sharper pixel discipline.**
- **Icon:** stair-step wedge dissolving into exactly three different-sized square gaps. Avoid Glitch's offset double seam and Confetti's diamond scatter.
- **Rule:** +2 active ticks under cap, no repeated collision on each debris square, no “pixel damage,” no screen-resolution change. Debris uses the existing cosmetic lifetime and pooling budget.
- **Animation:** equip assembles four block groups in 160ms, no busy tile-by-tile fill. Active edge is continuous enough to track despite stepped contour. On contact 3–5 chips separate with deterministic small velocities, then fall harmlessly. Pixel movement can be visually quantized without quantizing player physics.
- **Demo:** one late valid cut followed by harmless debris passing a second target. Freeze-frame option distinguishes active blade from dead chips; mark the explanatory freeze as demo-only.
- **Sound:** short two-step digital impact, no long arcade jingle for each victim.
- **Build:** Echo Heart can create a real stationary blade independently; its outline and ownership must not be confused with debris. Existing sword echoes keep their own rules.
- **Specific gate:** particle caps, no target references retained by chips, no collision bodies for debris and legible active edge without GL.

# VII. ATTACK / DASH FX — eight launch identities, not eight colored copies

## 48. Adaptive Dash — `dash-auto`
**Identity: a free visual adapter that belongs to the build. Current: cosmetic element chosen by existing equipment/sword priority. Target: retain, expose the resolved source.**
- **Icon:** central core diamond nested in a clean forward wedge, with one open side that accepts a small material insert.
- **Rule:** no extra stat or elemental damage. The selected dash appearance follows existing priority rules; preview should say “CURRENTLY: LIGHTNING / FROM …” using the actual resolver, not a new hand-maintained decision tree.
- **Animation:** equip wedge picks up the resolved core/material accent over 180ms. On launch, use the same short-lived and bounded style as the selected resolved family, but never activate a paid dash's separate mechanic merely because it looks similar.
- **Demo:** change representative compatible build components and show the resolved appearance/source updating. Contrast an explicit dash selection that overrides auto visuals. Demonstrate unchanged baseline launch rules.
- **Sound:** adapt the small finish accent, not the entire contact/danger sound identity. Do not allocate multiple overlapping sound voices for a fusion.
- **Build:** deliberately safe for players who want coherent visuals without another modifier to track.
- **Specific gate:** precedence ties, named sword overrides, explicit-style override, default fallback and no paid benefit leaking through auto selection.

## 49. Ink Dash — `dash-ink`
**Identity: a decisive brush launch. Current: +1 blade tick. Target: retain as a simple low-complexity dash choice.**
- **Icon:** broad brush-comet head with a dry split tail; distinguish it from Katana's sideways cut by a forward launch arrow silhouette.
- **Rule:** +1 active-blade tick inside the perk cap. No floor ink hazard, enemy slow or changed launch distance. The wake follows the launch, not a blade floating permanently behind the hero.
- **Animation:** equip a brush tip seats onto the dash wedge over 150ms. Launch lays down one compact taper with at most two dry gaps; it detaches and fades within about 160ms. Braking has a separate tiny ink notch, not a trail stretched while stationary.
- **Demo:** READY → committed forward launch → brake → still pose. Compare active timelines for the single tick. Keep slash-only demo spatially separate so players understand the selected slot.
- **Sound:** short forward brush snap and dry brake tap, lower priority than a cut or damage cue.
- **Build:** Paper/Katana is aesthetically consistent; their extension bonuses still share the cap. Modest benefit is acceptable when honestly priced and legible.
- **Specific gate:** cap saturation, idle wake cleanup, interrupted launches and no extra Canvas surface per emitted stroke.

## 50. Ember Dash — `dash-fire`
**Identity: heat prepares surviving armor for a follow-up. Current: +2 blade ticks. Target: redesign into one bounded Scorch mark.**
- **Proposed rule:** replace the extension with: a **primary direct cut that leaves an eligible Crown/Bastion alive applies Scorch for 60 ticks**. A later primary cut from a **different shot** consumes it for **one extra armor plate**, not health damage. One mark per enemy; no stacking, timer damage, refresh on consumption or secondary proc. Exclude Landlords initially pending boss balance.
- **Icon:** flame wedge enclosing one dark plate with a heated notch; communicates armor preparation rather than generic speed.
- **Animation:** launch gets two compact flame ribbons. Accepted mark leaves one small orange seam on the real target; consuming cut releases 3 short embers and clears it. Expiry cools quietly. No burning entire enemies or red wash over hazards.
- **Demo:** armored survivor → marked seam → different-shot follow-up → extra plate breaks. Contrast a timer expiring with no damage and a Fang that receives no mark.
- **Sound:** short heat tick on application and crisp cooled-metal crack on consumption.
- **Build/test:** Crown may improve the first cut but cannot multiply the mark. Test plate order, different-shot gate, invulnerable/excluded targets, no periodic damage and all mark cleanup paths.

## 51. Volt Dash — `dash-lightning`
**Identity: discharge a clean bank back into the engine. Current: +10% speed-conditioned score. Target: redesign into a bank-energy refund.**
- **Proposed rule:** replace score with **5% maximum FOCUS returned on the first fully earned rail rebound in a shot**, subject to the aggregate 8%-per-shot refund cap and a 30-tick item cooldown. Idle contact, floor bounce, secondary effects and repeated contact callbacks do not pay. No speed increase or target zap.
- **Icon:** angular lightning kink entering a small open battery notch; not Coil's bridged terminals.
- **Animation:** launch has two short angular electric pieces. On accepted bank, a 100ms arc travels from rail contact toward the core and one refund notch fills. Spent/cooldown state is a dark kink; do not imply another available refund while it is gated.
- **Demo:** earned bank refunds, immediate wall jitter does not, a later valid shot after cooldown may. Show full FOCUS preventing overfill.
- **Sound:** compact electrical return “zip,” not an explosion; aggregate with other bank audio.
- **Build:** Thrusters adds impulse and Segmented stores blade time; all may consume the same true bank event once, without event duplication.
- **Specific gate:** shot IDs, cooldown, aggregate cap, return-to-floor, run reset and no bank farming from touching a wall without a real launch.

## 52. Frost Dash — `dash-ice`
**Identity: cold precision that holds form during a sustained aim. Current: 8% lower aim cost. Target: retain the mechanic; make the self-control fantasy explicit.**
- **Icon:** long faceted frost wedge inside two steady aiming brackets. Not a snowflake alone, which suggests enemy freezing.
- **Rule:** existing 8% aim drain reduction inside the 30% cap. No enemy slow, stun, ice floor, change to time scale or weaker physics gravity. Do not sell “freeze” if there is no freeze mechanic.
- **Animation:** equip two frost facets interlock over 190ms. Aiming settles a small crystalline bracket at the drag origin; release breaks it into at most three harmless chips. The dash wake is brief, translucent and detached before idle.
- **Demo:** equal-duration aiming with different FOCUS drain, then equal enemy movement with/without the item. Explicitly label “PRECISION / NOT ENEMY FREEZE.” This avoids bait-and-switch from elemental art.
- **Sound:** fine glass calibration click on aim entry and a small brittle release snap; no repeated ice crack on every aim update.
- **Build:** Hypno/Time supports a measured aiming build, but caps must reveal redundancy. Halo's gravity behavior remains separate.
- **Specific gate:** no AI/timer modification, cap order, reduced-motion crystal pose and no full-screen cold tint reducing danger-color contrast.

## 53. Tide Dash — `dash-water`
**Identity: recover focus by continuing a smooth rebound rhythm. Current: +10% passive recovery. Target: redesign into a short bank-flow window.**
- **Proposed rule:** an accepted earned rebound opens **45 ticks of +25% passive FOCUS recovery while not aiming**, under the shared 40% cap. Replace the always-on +10%; additional accepted rebounds refresh the window rather than multiply it. Use existing earned-event gates; wall rubbing is not flow.
- **Icon:** single curling ribbon returning into a reservoir notch, unlike Orbit Pointer's broken circular ring.
- **Animation:** equip wave curls around the dash wedge in 200ms. Launch produces one compact liquid ribbon. On accepted rebound, a return ripple folds toward the core for 140ms; an open ring drains over the true recovery window. No droplets lasting through idle.
- **Demo:** valid rebound → recover → aim interrupts actual recovery while the timer continues → release before expiry. Contrast passive waiting with no bank.
- **Sound:** short soft liquid-return pluck, not an endless ocean ambience loop.
- **Build:** Obsidian can support aerial recovery but combined bonuses stop at cap. Time's special multiplier interaction must be explicitly tested and displayed.
- **Specific gate:** event definition, refreshed versus stacked windows, aim eligibility, floor-recovery cooldown and no healing or FOCUS gain from the cosmetic ripple itself.

## 54. Void Dash — `dash-void`
**Identity: harvest the gap left by real broken armor. Current: +12% armored-foe score. Target: redesign into a plate-break refund.**
- **Proposed rule:** replace score with **3% maximum FOCUS returned when a primary cut actually removes at least one eligible armor plate**, at most **two distinct enemies per shot** and within the aggregate 8% refund cap. Multiple plates on one enemy still pay once. No payout from armorless kills, invulnerable contact, secondary needles/zaps or cosmetic cracks.
- **Icon:** broken orbital wedge passing through one open armor plate; negative-space gap is essential, not simply a black version of Ember.
- **Animation:** launch leaves two short broken arcs. Accepted plate event draws a small inward silhouette notch that disappears into the core in 120ms. Keep the player and hazard edges fully visible; no darkening the whole screen.
- **Demo:** plate break pays once, another plate on the same victim in the same shot does not; a second distinct armored victim pays; a third is gated. Mark “RESOURCE / NOT ARMOR BYPASS.”
- **Sound:** dry inward thump plus normal plate sound, not a second bass explosion.
- **Build/test:** Crown can help break armor but never pays per plate. Verify target/shot identity, refunds at full FOCUS, cleanup and secondary-event exclusions.

## 55. Echo Dash — `dash-echo`
**Identity: a visual memory that keeps a sequence connected. Current: +12 chain ticks. Target: retain, deliberately separate from Echo Heart's damaging ghost.**
- **Icon:** one solid forward wedge with two shorter open-outline wedges behind it. The primary shape must stay visibly different from Echo Heart's central chamber.
- **Rule:** existing +12 chain grace under cap. Afterimages are never actors, targets, attack sources or collision bodies. No second shot, automatic redirection, invulnerability or FOCUS refund.
- **Animation:** equip outline wedges collapse into the solid one over 180ms. Launch records at most two short-lived geometric positions, fading within about 140ms. Only the actual player carries the active-edge highlight; a tiny chain notch persists for the actual grace extension.
- **Demo:** launch to first kill, late retarget to second while the true chain remains alive, then show an afterimage overlapped by a target with no damage. Do not simulate echoes by drawing several fully opaque heroes.
- **Sound:** one short delayed tonal tail attached to the original launch cue, with no new attack sound on the decorative copies.
- **Build:** Echo Core can coexist, but its stationary ghost uses a distinct outline/receipt. Existing echo sword effects remain separate sources.
- **Specific gate:** clone-free gameplay state, effect caps, rapid launches and reduced-motion single final silhouette.

# VIII. AIM & SCAN / AIM MARK — four different information tools

## 56. Field Reticle — `pointer-reticle`
**Identity: the reliable free point of contact. Current: segmented origin reticle, standard power readout. Target: retain with exceptional clarity.**
- **Icon:** four open segments with a broad center gap and one short origin tick. No center fill obscuring a small target.
- **Rule:** touch/mouse press location, drag intent, cancel zone and actual power remain fully available without purchasing a pointer. No hidden accuracy penalty or input latency. Position is the true press origin, not an auto-corrected target position.
- **Animation:** press seats four segments in 60ms; drag tension engages existing power marks. Valid release snaps outward 2px and fades within 100ms; canceled input contracts and clears without the launch snap. Keyboard focus gets an equivalent visible state.
- **Demo:** interactive press, pull, cancel and release, with a clear forward-launch indicator. Teach the existing gesture rather than introduce a new control scheme only in the shop.
- **Sound:** small engagement tick on press, shared release cue only on a real launch; no sound for pointer movement.
- **Build:** keeps the standard informational foundation beneath every other pointer choice. All upgrades must preserve a color-independent cancel/readiness distinction.
- **Specific gate:** scaled CSS/backing stores, high-DPR screens, touch capture loss, page blur, two-finger interruption and no extra shot from feedback listeners.

## 57. Prism Pointer — `pointer-diamond`
**Identity: a faceted sight that exposes cutting geometry. Current: +1 blade tick. Target: redesign into an honest blade-width instrument.**
- **Proposed rule:** replace the arbitrary duration perk with a **bounded cutting-corridor overlay while aiming**. It shows the current resolved blade width along the currently predicted active path, clipped to the actual available forecast and capped active reach. It adds no damage, time or aim correction. If conditional width cannot be predicted truthfully for a future contact, show the base envelope and a separately dashed conditional margin.
- **Icon:** split diamond lens with a short central path and two diverging facet edges. Readable as a diamond before the tiny corridor cue.
- **Animation:** four facets seat around the origin over 100ms. During aim, the two corridor edges settle without oscillation; release collapses them into the diamond. Use neutral faint marks, never repaint existing slice brackets by role.
- **Demo:** same centerline near an offset target, reveal actual contact-band width; compare Viper/Samurai conditional margins and explain uncertainty. Never draw a guaranteed-hit green tunnel through moving enemies.
- **Sound:** one restrained crystal calibration click; no per-sample ticking.
- **Build/test:** Lens supplies path length; pointer supplies width. Test width order, curve sampling, occlusion, conditional states, low-budget fallback and updated owner-facing receipt after removing +1 tick.

## 58. Orbit Pointer — `pointer-orbit`
**Identity: a sight that visibly regroups while focus returns. Current: +10% passive recovery while not aiming. Target: retain; keep pointer information distinct from the passive.**
- **Icon:** broken circular track with one large satellite and one empty docking notch. No full radar crosshair that suggests map range.
- **Rule:** existing 10% passive recovery contribution under cap; does not restore FOCUS from spinning the mouse, holding the pointer still, or pressing/releasing rapidly. Gameplay resource eligibility remains authoritative.
- **Animation:** equip arcs assemble in 170ms. While aiming the satellite holds at the true drag direction, not arbitrary orbital motion. On recovery entry it traverses at most one short arc over 180ms, docks, and the notch remains filled only while recovery is actually active. Empty/full states are quiet.
- **Demo:** low FOCUS → release → recover faster; re-enter aim and show recovery stopping. Pointer art may summarize state but cannot become the only FOCUS display, especially when not touching the screen.
- **Sound:** soft docking click, suppressed during rapid re-entry; passive regeneration never runs a looping sound.
- **Build:** Glitch/Notched may complement it but actual marginal gain at cap must be visible. It does not enlarge Radar range.
- **Specific gate:** passive-only gating, no input farming, mobile no-pointer resting state, assistive focus and correct cleanup after cancel/capture loss.

## 59. Crosshair Pointer — `pointer-cross`
**Identity: efficient immediate alignment. Current: 8% lower aim FOCUS cost. Target: retain with minimal occlusion.**
- **Icon:** four detached L-brackets around a square negative-space center, one slightly longer bottom tick. Different from Sniper's single dot and Field Reticle's curved segments.
- **Rule:** existing 8% drain reduction inside the 30% cap, no magnetic aim assist, precision damage bonus or snapped direction. Core gesture and power threshold remain unchanged.
- **Animation:** brackets begin slightly open on press, move inward no more than 2px across 80ms and stay stable while aiming. Valid release gives one sharp outward reset; canceled input quietly retracts. Do not let decorative bracket motion misrepresent power.
- **Demo:** match drag distance/aim duration against baseline, compare FOCUS spent; a moving target still requires the user to aim. Pair the actual power meter with a plain “AIM COST −8%” receipt.
- **Sound:** dry calibration tick and ordinary release; never a target-acquired cue suggesting guaranteed contact.
- **Build:** Visor makes an immediate-efficiency build, but Hypno's proposed ramp uses the same cap; show the effective combined drain reduction over time.
- **Specific gate:** cap order, origin stability during drag, touch-size readability, gesture cancellation and no bracket obscuring hazard centers.

# IX. AIM & SCAN / RADAR — four explicitly different information tiers

All radar tiers use a consistent symbol language: ordinary target silhouette,
objective diamond, hazardous projectile/danger geometry, and windup/tell marks.
Use shape as well as color. The scan animation is presentation, not the source of
truth: live markers must not wait for a decorative sweep to pass them.

## 60. Field Radar — `radar-base`
**Identity: a compact local map that is useful from the beginning. Current: nearby enemies/objectives. Target: retain.**
- **Icon:** one open circular range arc, player triangle and one square contact; enough negative space to distinguish Long-Range's outer antennas.
- **Rule:** current base range and available contact/objective types. Standard warnings and visible gameplay remain available without an upgrade. No artificial update lag or hidden free-tier inaccuracy.
- **Animation:** equip/player-map frame seats in 160ms. Contact entry gets a small 90ms marker seat; continuous positions interpolate only visually and remain tied to current snapshots. Contacts exiting actual range disappear/clip according to the established rule, not after a random fade suggesting continued tracking.
- **Demo:** known enemies/objective move into and out of the real base envelope, with world and radar views linked by a highlighted matching symbol. No top-tier hazard layers in the free demo.
- **Sound:** quiet UI latch on equip; no beep for every contact crossing a border during camera movement.
- **Build:** Beacon complements local danger warning without moving threat logic into radar art.
- **Specific gate:** world-to-radar scaling, range boundary, objectives, mobile HUD area and no stale destroyed-target markers.

## 61. Long-Range Array — `radar-1`
**Identity: larger antenna reach, same honest contact vocabulary. Current: +35% radar range. Target: retain.**
- **Icon:** two broad antenna arcs extending beyond a half-circle with one distant contact. Not the base icon recolored with “I.”
- **Rule:** radius becomes 1.35× current base, not +35 percentage points on another radar tier. Radar tiers occupy one slot and never stack. Does not add tier-2 hazard markers or tier-3 tells.
- **Animation:** equip outer antenna arms extend over 220ms. In the comparison demo the old base envelope stays dashed and the new envelope seats outside it. During gameplay avoid a permanent expanding pulse—range is steady information.
- **Demo:** place one contact outside base but inside 1.35× range, and another just outside the upgrade. Keep actual enemy positions unchanged. The same-size HUD must explain that farther coverage may compress spacing, not enlarge physical distances.
- **Sound:** one soft two-part array-lock cue; ordinary distant contacts remain silent by default.
- **Build:** suitable for route planning with Vector Lens, but radar shows current contacts, not a future hit confirmation.
- **Specific gate:** radius-versus-area copy, tier replacement, edge clamping, marker overlap and no accidental active-hazard layer inherited from a previous selection.

## 62. Threat Array — `radar-2`
**Identity: interpret active danger, not just enemy locations. Current: +70% range plus active projectiles/danger zones. Target: retain with strong layer separation.**
- **Icon:** antenna arcs enclosing a cut-out hazard diamond and one short projectile dash. Not merely a third ring on Long-Range.
- **Rule:** radius 1.70× base; draw only actual eligible active hazards within available sensor rules. Do not promise advance windup tells from tier 3 or prediction of moving projectiles beyond known state. Danger-zone outlines should distinguish area from an enemy dot.
- **Animation:** equip hazard layer appears after the contact layer in two 80ms steps. New danger gets one local marker emphasis, not a pulsing entire radar. Expired hazards disappear promptly; moving projectiles remain small directional dashes.
- **Demo:** fixed enemy marker, real active projectile and temporary danger area. Show projectile before/after entering range, and danger disappearing when canceled. Compare identical field snapshots with Field Radar.
- **Sound:** no constant scanner alarm. Existing danger audio is shared/coalesced; optional one entry tick only for a new high-priority danger ID.
- **Build:** Beacon retains local directional specificity; neither should draw duplicate huge warning panels.
- **Specific gate:** hazard lifetimes, friendly/cosmetic projectile exclusion, clutter budgets, overlapping danger areas and no read of hidden future state.

## 63. Oracle Array — `radar-3`
**Identity: a richer live tactical instrument, not prophecy. Current: +120% range, hazards, live windups and player heading. Target: retain with exact language.**
- **Icon:** split full-array ring, one directional heading needle and a short windup arc around a contact. Different geometry, not tiny “III.”
- **Rule:** radius 2.20× base; layer existing live tells/heading over tier-2 information. A canceled windup cancels its marker. No guaranteed future path, stealth reveal beyond current sensor permissions, or automatic dodge.
- **Animation:** equip contact/hazard/tell layers lock in across 240ms. Windup segments advance from the actual tell progression; heading needle follows current facing/heading source. Limit animation to affected markers, not spinning the entire map.
- **Demo:** a visible enemy begins winding up, changes/cancels state, then a second actually charges. Compare the local map state at each moment. Label “LIVE WINDUP,” never “PREDICTED HIT.”
- **Sound:** high-quality but restrained one-shot instrument latch; combat tells retain their normal audio priorities. Price must not buy louder danger fatigue.
- **Build:** Oracle Lens supplies launch analysis, not the same information; side-by-side demos must show the distinction.
- **Specific gate:** exact +120% radius, stale tell cleanup, heading at near-zero movement, extreme map compression and many simultaneous marker lifecycles without memory growth.

# X. AIM & SCAN / FLIGHT PATH — four trustworthy forecasting tools

All path tiers use the existing current-snapshot physics estimate. Do not draw
through current solid surfaces, promise future moving-enemy locations, forecast
unsupported bounces, or alter the launched trajectory to match the line.

## 64. Field Trajectory — `trajectory-base`
**Identity: free confirmation of launch intent. Current: short calculated path ending at the first current solid surface. Target: retain.**
- **Icon:** three-point curved arc leaving an open origin dot and ending in a short clipped segment. No impact bullseye reserved for higher analysis.
- **Rule:** same underlying launch math as upgraded paths, simply shorter information horizon. It must not be less accurate inside its displayed interval. Canceling aim clears it; real collisions still own the result.
- **Animation:** on valid aim, reveal the existing short path from origin in at most 80ms, but update geometry immediately as aim changes. A reveal animation cannot leave yesterday's line in place during a fast retarget.
- **Demo:** drag to alter angle/power, show short estimate, release and compare the real initial flight. Place a current wall to demonstrate clipping. Make it clear that an enemy may move after release.
- **Sound:** small shared aim-engagement tick; no sound per path resample or dot.
- **Build:** every pointer can use it; no upgrade is required to understand basic input direction.
- **Specific gate:** estimate/launch equation parity, varying gravity states, short-horizon accuracy, solid clipping, CSS scaling and no stale path on pointercancel.

## 65. Vector Lens — `trajectory-1`
**Identity: see farther along the same truthful equation. Current: extended calculated path. Target: retain, make horizon length explicit.**
- **Icon:** longer curved arc passing through one tilted lens shape, ending open. Distinguish lens hardware from Radar's antenna arcs.
- **Rule:** extend only the currently implemented horizon/sample configuration. Do not invent a range percentage if code uses discrete tick/sample settings. Still stops at the first current solid surface; no new impact-time analysis or bounce forecast.
- **Animation:** equip lens slides around the origin in 190ms. Demo can show baseline segment solid and added segment lightly emphasized; live aiming updates all samples together, without a slow draw-on hiding changes.
- **Demo:** same input/current field, short baseline end versus longer upgraded end, and an obstacle truncating both. A target beyond the baseline horizon becomes visible in the estimate, not automatically guaranteed to be hit.
- **Sound:** quiet lens-seat click; continuous aim is silent apart from existing input cues.
- **Build:** Long-Range Radar aids route planning in a different frame of reference. Neither should imply information about a future enemy teleport/attack.
- **Specific gate:** true horizon from resolver, sample budget at low frame rate, early collision, no old high-tier time ticks retained and line contrast on every world.

## 66. Impact Lens — `trajectory-2`
**Identity: understand when and where the current estimate first ends. Current: longer path, time ticks, current-snapshot first-impact marker. Target: retain with explicit uncertainty.**
- **Icon:** curved path with two large time notches ending at a bracket-shaped impact stop, no miniature numerals.
- **Rule:** marker comes from the existing first-current-impact calculation. It is not a future guaranteed collision with an enemy that may move. Do not show a marker if the displayed horizon has not reached an actual predicted current-snapshot impact.
- **Animation:** equip lens ring locks, then two notches seat over 200ms. Tick positions update with calculation, not a decorative regular spacing. A valid impact marker forms in 80ms; when prediction changes it moves/updates immediately rather than lingering as an afterimage.
- **Demo:** fixed wall contact with ticks, then a moving enemy showing why current-snapshot estimates can change. Include a no-impact-within-horizon state and explain the open endpoint.
- **Sound:** one subtle contact-marker acquisition click with a cooldown, not a beep at every recalculation.
- **Build:** Prism Pointer's proposed width envelope complements timing; compute them from shared snapshots.
- **Specific gate:** time-unit conversion, no fabricated impact, moving geometry snapshots, cancellation and tick counts independent of display refresh.

## 67. Oracle Lens — `trajectory-3`
**Identity: the most complete launch instrument, still not an oracle of future AI. Current: longest path, impact marker, speed, angle and estimated time. Target: retain.**
- **Icon:** split lens surrounding a long curved arc, one speed slash and a terminal analysis bracket. No text at small size; contour distinguishes it from Impact Lens.
- **Rule:** expose actual existing launch speed/angle/estimated time, with labels indicating estimate and current snapshot. Do not forecast bounces or future enemy decisions, and never steer the shot after release to make the prediction look right.
- **Animation:** equip analysis brackets seat in three 70ms beats. During aim, numbers update at a readable throttled display rate while underlying path sampling remains correct. Avoid jittering layout when digits change; fixed-width numeral cells and explicit units.
- **Demo:** alter angle and power, compare displayed values with recorded actual launch, then show a moving-target mismatch explained by snapshot uncertainty. A wall stops the first forecast; there is no imaginary post-bounce segment.
- **Sound:** small instrument-ready triad on equip only; no per-digit clicks or continuous “analysis” noise.
- **Build:** Oracle Radar adds live threats but does not upgrade this estimate into AI prediction. Both must fit mobile HUD without covering the player.
- **Specific gate:** data source agreement, unit/rounding correctness, insufficient horizon, resized layouts, number throttling and no extra simulation step to obtain a cosmetic prediction.

# XI. WORLD / ARENA — six environments with explicit affinities

World selection must not covertly change collision geometry, spawning, enemy
speed or danger colors. Keep the current single-slot selection for this version,
but label every paid world with an explicit **ARENA AFFINITY** receipt. Its passive
is a run modifier, not a claim that a background pipe physically produced damage.
If playtests show persistent confusion, a later separate scenery/affinity selector
needs its own save migration rather than silently changing the current contract.

## 68. Twilight Undercut — `twilight`
**Identity: the deliberate neutral arena. Current: free twilight theme, no affinity bonus. Target: retain.**
- **Icon:** low layered horizon under a small crescent-shaped sky cutout; no building detail too small to recognize at 20px.
- **Art direction:** muted plum distance, restrained industrial silhouettes and neutral play-plane contrast. Character outline, green cut information, red danger and gold reward must remain more salient than architecture. Static masses should use the existing bounded bake path where supported.
- **Rule:** current collision/spawn rules and baseline score/recovery. No hidden penalty for staying with the free arena. World palette is not a physics material.
- **Selection/equip:** horizon layers seat with a short 220ms local panel reveal in the shop; gameplay entry remains immediate. Do not pan the whole camera or add a loading delay for drama.
- **Demo:** one shared representative encounter used by every world, with a toggleable neutral contrast/telegraph overlay. Show “BASELINE AFFINITY” and the unchanged outcome.
- **Sound:** restrained neutral procedural voice; no large background music addition required by this plan. Respect existing mute/audio-unlock rules.
- **Build/test:** reference scene for all icon/material reviews. Test light/dark characters, hazard overlap, portrait/landscape and no retained previous-world passive after selection changes for the next run.

## 69. Cyber Tokyo — `tokyo`
**Identity: rushing through an electric city. Current: +8% qualifying score at speed ≥18. Target: retain as a rush affinity.**
- **Icon:** stepped skyline crossed by one diagonal speed lane; two broad building blocks and one antenna, not a detailed city stamp.
- **Art direction:** electric-blue distance, sparse neon and diagonal rain confined to scenery. Bake static skyline; rain uses a small deterministic set, not hundreds of independent emitters. No red/green traffic signs competing with gameplay semantics.
- **Rule:** preserve speed threshold and capped equipment-score contribution. No actual traffic hazards, free acceleration, extra enemy spawns or score simply for moving. Use current kill-time speed sampling.
- **Selection/activation:** skyline neon powers on left-to-right over 240ms in the preview. During a qualifying fast kill, one tiny nearby neon edge catches light and the normal score receipt shows the marginal bonus. No full-city strobe per victim.
- **Demo:** the same target killed below/at threshold, actual speed and score shown. Keep arena geometry/target placement identical to Twilight for comparison.
- **Sound:** short synthetic rush accent on an accepted event; no intrusive city siren loop.
- **Build/test:** Viper/Tails can support speed play but capped bonuses remain capped. Verify speed sampling, skyline caching, rain budget and readability of ordinary red windups against neon.

## 70. Blood Foundry — `foundry`
**Identity: armor is valuable material to break. Current: +12% qualifying score against armored foes. Target: retain as an armor-hunter affinity.**
- **Icon:** square furnace mouth with a divided plate inside and two heavy jambs. Different from Lava's cracked shell and Ember's pointed flame wedge.
- **Art direction:** deep crimson sky, large dark furnace masses and small orange pipe highlights. Keep actual danger reds distinctly brighter/outlined; warm environment color cannot erase hazard geometry. No new molten-floor collision areas.
- **Rule:** use the authoritative armored-foe predicate, not whether an artist drew armor fragments. No affinity payoff merely for hitting a plate; score is awarded on eligible kills. No passive health damage or stronger Crown mechanics.
- **Selection/activation:** preview furnace shutters open over 240ms. A qualifying armored kill causes a brief 120ms local plate-edge heat accent and normal score receipt, not a global red flash.
- **Demo:** identical armored and ordinary victims, show eligibility, base score and capped marginal gain. Explain that an Ember Scorch mark itself does not earn the world score bonus.
- **Sound:** short low foundry knock, with no bass pulse obscuring incoming attacks. Existing procedural theme voice can be deepened within the audio budget.
- **Build/test:** Crown and proposed Void reward related but distinct events. Test armored predicate, boss classification, secondary kills, score cap and crimson/danger contrast on low-quality displays.

## 71. Manga Paper — `manga`
**Identity: compose several cuts into one readable panel. Current: +10% qualifying multi-cut score. Target: retain.**
- **Icon:** folded page corner with two parallel diagonal cut marks and one cropped panel border. Different from Paper Shell's single fold and Comic's burst.
- **Art direction:** warm off-white page, broad sparse hatching and heavy distant ink forms. The environment may be monochrome; red danger/green cuts/gold rewards retain their established readable distinction. No moving black speed-line curtain across the player.
- **Rule:** same-shot multi-cut score condition and equipment cap. Separate shots do not become a multi-cut because their decorative panels overlap. Do not grant extra time or chain grace from the world itself.
- **Selection/activation:** one panel corner folds flat in 210ms. Accepted multi-cut adds a small cropped ink frame around the aggregate contact region for about 100ms, behind characters and never around the whole screen. No giant “K.O.” obscuring threats.
- **Demo:** one, two and three direct kills in a shot versus two kills in separate shots, with actual qualifying receipts and no retroactive fictional first-kill bonus.
- **Sound:** concise dry page snap on qualification, coalesced with Comic/Confetti to avoid three celebratory layers.
- **Build/test:** existing Ink Ronin recipe must still resolve normally. Test kill order, background contrast, flash-sensitive mode and no camera/framing changes caused by decorative panels.

## 72. Synthwave Grid — `synth`
**Identity: a steady recovery rhythm. Current: +15% passive FOCUS recovery while not aiming. Target: retain as the simple always-on recovery affinity.**
- **Icon:** three perspective grid rays ending at a clipped half-disc with two broad horizontal cuts. It must read without violet/pink color.
- **Art direction:** restrained striped sunset, low-value mountain layers and a static receding grid. Grid geometry is baked or reused; no endless perspective animation suggesting actual floor motion. Playable boundaries remain visually and physically unchanged.
- **Rule:** existing 15% passive recovery contribution under the 40% cap and ordinary eligibility. No FOCUS gain from a beat, music timing, screen refresh or decorative sunset pulse.
- **Selection/activation:** grid lines seat from near to far over 230ms in the preview. Recovery start gives one small local line convergence near the resource display; then the scene stays steady. Multiple recovery items share a single coherent receipt.
- **Demo:** same low FOCUS and idle duration against Twilight, then aim to show recovery gating. If the build already hits the cap, explicitly show zero additional gain instead of a fictitious faster bar.
- **Sound:** small stable synth interval, once per meaningful recovery transition at most. No always-on music system or per-tick beep required.
- **Build/test:** contrasts with Tide's proposed timed bank window. Test cap ordering, special Time multiplier, mute, idle-tab behavior and static-background allocation stability.

## 73. Pro Void — `void`
**Identity: uncompromising boss focus and negative space. Current: +15% qualifying Landlord kill score. Target: retain as a boss affinity, not armor erasure.**
- **Icon:** negative-space eclipse split by one boss-plate-shaped notch. Use a neutral outline so it remains legible on black; avoid a black square with no recognizable silhouette.
- **Art direction:** near-black distance with sparse boundary marks and subdued incidental sound. Never remove important platform edges, character keylines, aim cancellation marks or enemy telegraphs in the name of minimalism.
- **Rule:** existing qualifying Landlord/boss-score predicate under the equipment cap. Ordinary armor does not automatically qualify. No boss damage increase, shield bypass, invulnerability, spawn manipulation or guaranteed boss reward from a hit.
- **Selection/activation:** preview decorative scenery contracts to a framed negative-space field over 240ms, without changing gameplay geometry. Actual qualifying boss payout closes one small eclipse around the receipt for 160ms; ordinary hits do not darken the screen.
- **Demo:** ordinary armored kill versus eligible Landlord kill, with base/bonus receipts. Include an Obsidian character and thin projectile to prove visibility survives the darkest combination.
- **Sound:** short dry low note at accepted boss payout; preserve warning audio even when ambience is sparse.
- **Build/test:** Crown/Ember/Void Dash remain their own armor mechanics. Verify boss predicate, cap/rounding, dark-on-dark contrast, zero extra postprocessing and all hazards visible without bloom.

---

# XII. Ability redesign ledger — what really changes

The identity work covers **all 73 items**. Most retain clear existing mechanics;
**11 proposed mechanical revisions** remove weak or redundant identities. These
are replacements, not eleven free extra passives added to current rules.

| Item | Old mechanic | Proposed replacement/refinement | Risk to investigate |
| --- | --- | --- | --- |
| SSJ Blaze | Overdrive score +8% | 2% max FOCUS per primary Overdrive kill; 8% per activation, aggregate shot cap | Overdrive sustain loops |
| Smug Half-Lid | Chain grace +12 ticks | Kill grants one short retargeting aim-discount window | Frequent input toggles / discount stacking |
| Hypno Spiral | Flat aim cost −15% | Aim discount ramps 5%→20% over 24 aim ticks | Exact integrated cost and short-hold tradeoff |
| Obsidian Stealth | Airborne score +8% | Airborne, not-aiming passive recovery +15% | Grounding edge cases / recovery stacking |
| Notched Frame | Aim cost −8% | Not-aiming passive recovery +12% | Duplicate-role value and cap saturation |
| Segmented Frame | Chain grace +12 ticks | Earned rail bank arms +2 blade ticks on next shot; 60-tick expiry | Shot snapshot / repeated contact callbacks |
| Ember Dash | Blade +2 ticks | Surviving eligible armor marked; later different-shot primary consumes for +1 plate | Boss balance / mark lifecycle / plate-order edge cases |
| Volt Dash | Speed score +10% | First earned rail bank refunds 5% max FOCUS, 30-tick cooldown | Bank farming / aggregate refunds |
| Tide Dash | Passive recovery +10% | Earned rebound starts 45-tick +25% recovery window | Event classification / timer refresh |
| Void Dash | Armor score +12% | Actual primary plate break refunds 3%, two distinct enemies per shot | Target/shot identity and armor recursion |
| Prism Pointer | Blade +1 tick | Truthful bounded cutting-width corridor overlay | Prediction uncertainty / information density |

**Review rule:** a candidate does not ship merely because it has an appealing
animation. Compare its tactical choice, marginal value, exploit surface and clarity
against the old rule. Keep the old rule if the replacement is not an improvement.
Actual elemental enemy freezing, burn-over-time, teleporting, new projectiles and
extra damaging clones are deliberately excluded from this version: each needs
substantial AI/physics/balance/ownership work that should not be hidden inside a
button-juice request.

# XIII. Exact event/state contracts

## 1. Source events, not render guesses

The simulation produces facts. The presentation never calculates a kill or
awards FOCUS based on a timer, ring fill, collision-looking frame or sound.
Use explicit records along these lines, adapted to existing architecture:

- `PrimaryCutResolved`: run ID, simulation tick, shot ID, target ID, source,
  qualifying power/speed snapshot, plates before/after, killed flag.
- `KillResolved`: same stable provenance plus primary/secondary classification,
  authoritative score breakdown and health/drive/air eligibility snapshots.
- `EarnedRailRebound`: one accepted bank token, run/shot IDs, contact point/normal,
  outgoing velocity and existing earned-bank/cooldown qualification.
- `QualifiedFloorRecovery`: a distinct accepted floor token. Ordinary floor
  landing, wall rubbing and duplicate contact callbacks are not this event.
- `AimState`: begin/cancel/release, drain eligibility and authoritative current
  power; `ResourceChanged`: actual before/after values and accepted source IDs.
- `ThreatState`: stable target ID, tell start/progression/cancel, current position.
- `RunEnded/Disposed`: drop marks, charges, animation voices, delayed callbacks
  and cached per-target bookkeeping owned by that run.

Do not require these exact event names or a whole new event framework if the
current modules already expose equivalent facts. The important contract is
stable provenance and authoritative timing.

## 2. Proposed replacement mechanics, resolved precisely

- **Blaze:** eligibility sampled at the authoritative primary-kill event while
  Overdrive is active. Track accepted refund count/budget per drive activation.
  Existing recovery multipliers do not increase the fixed refund.
- **Smug:** a primary direct kill grants one Composure charge until tick+24.
  Entering aim at or before its defined expiry consumes it and applies the extra
  discount for up to 12 consecutive aim ticks. Leaving aim ends it; toggling aim
  cannot restart it. New grants refresh one stored charge, never create a queue.
  Define simultaneous kill/grant versus aim-consume order once and test it.
- **Hypno:** ramp is simulation-owned. A paused frame contributes no aim ticks;
  release/cancel resets it. The shared 30% cap applies to the combined effective
  discount each tick. The preview plots actual integrated drain, not just 20%.
- **Segmented:** an accepted rail event arms one charge. A launch snapshots the
  charge into that shot's blade budget, then consumes it. Expiry before launch
  cancels the charge; expiry after launch does not retroactively shrink the shot.
  Same-shot rebound cannot extend that already-launched shot by mutating its
  snapshot; it prepares the next shot. Canceling aim is not a launch.
- **Scorch:** only a direct primary hit leaving an eligible armored target alive
  can apply a mark. A consuming hit must belong to a different shot. Resolve
  bonus plate loss once within the same contact transaction, without triggering
  another primary contact. A consuming hit cannot immediately reapply the mark.
  If a marked victim dies or despawns, dispose the mark. One mark per target;
  repeated nonconsuming applications refresh duration only where explicitly
  allowed—initial prototype uses **no refresh from the applying shot**.
- **Volt:** first accepted rail rebound per shot; item cooldown and aggregate
  refund budget both must permit payment. Mark the event handled even if FOCUS
  is full, so later visual replay cannot cash it in. No carryover refund queue.
- **Tide:** accepts fully earned rail rebounds and cooldown-qualified floor
  recovery—not ordinary landing. Sets an expiry at event tick+45, replacing the
  prior expiry with the new one. Recovery eligibility still excludes aiming.
- **Void:** count distinct target IDs for actual primary plate removal, not plate
  count. Max two per shot; no second payment for the same target. Exclude future
  Scorch bonus plate accounting from creating a separate duplicate refund event.
- **Prism Pointer:** information-only; samples the current resolved path and
  width rules without stepping the real world. If a future conditional cannot
  be known, label/dash it rather than displaying false precision.

## 3. Resource/cap order

Preserve existing authoritative ordering unless a deliberate balance change is
approved. New fixed refunds use percentages of maximum FOCUS, not guessed raw
engine units. Clamp the accepted total to missing FOCUS and the per-shot budget.
When several refunds compete for the last available budget, choose one stable
ordering and expose a single aggregate receipt; no renderer-order dependence.
Do not let an integer-rounding implementation turn many 2% events into zero or
accumulate infinite fractional carry between runs. Unit tests must pin the
rounding strategy. Passive regen and instant refunds remain separate paths.

# XIV. Material-specific juice recipes

The 73 items reuse a small set of technical rigs, but their poses, contours and
accepted triggers differ. Reusing a rig is not permission to reskin one particle
explosion 73 times.

| Material/system | Motion grammar | Contact/equip sound grammar | Avoid |
| --- | --- | --- | --- |
| Paper / ink | fold, brush taper, dry breakup | short fold/scrape/snap | liquid blood simulation, full-page wipe |
| Metal / plates | seat, compress, ratchet, latch | short low clack/ring | screen shake for every latch |
| Crystal / prism | facet lock, split edge, precise glint | fine glass tick | glitter cloud hiding the hero |
| Electrical | sharp kink, one connected arc, dock | short zip/click | endless buzz or global glitch |
| Flame / heat | core-to-edge pulse, cool seam | small ember/ceramic snap | unimplemented damage-over-time |
| Water / cloth | one return curl, lag, settle | soft pluck/cloth snap | persistent ribbons covering aim |
| Void / shadow | inward gap, interrupted outline | dry inward low tap | blacking out gameplay |
| Digital / pixel | stepped assemble, small discrete chips | short granular tick | frame skipping or fake time freeze |
| Sensors | calibrated notch, immediate data change | quiet instrument latch | decorative scans delaying real markers |

Global priority: **damage/critical danger > primary gameplay outcome > resource
ready > purchase/equip confirmation > routine navigation**. A maximum-volume
priority cue suppresses/merges lower layers instead of all playing at once.
No hover sound and no continuous animation/audio solely because a card is visible.

# XV. Preview storyboards and proof requirements

Each selected item has **two views**, accessible without leaving the shop:

1. **LOOK:** large attachment/material turn/pose, unique icon and equip reaction.
2. **WORKS:** an item-specific 3–4 second event demonstration with its actual
   trigger, a labelled result and a counterexample/tradeoff.

A standard 3.2-second Works storyboard is a starting rhythm, not a requirement to
fit every cooldown into the same fake duration:
- 0–500ms: readable neutral pose and condition.
- 500–1,500ms: action/trigger with baseline comparison where useful.
- 1,500–2,500ms: result, accepted value and a short boundary/counterexample.
- 2,500–3,200ms: clear reset, no purchase/equip state change.

Timer demonstrations may use a labelled magnified timeline or a longer cycle.
Do not silently compress a 60-tick mechanic into 100ms and present that as actual
speed. Sensor demos show a fixed, known scene; score demos show the true formula
and rounding; rebound demos show a valid and invalid contact; guard demos show
ready, consumed and not-covered hazards. Refund demos show a full-resource case.

The rigs should invoke pure rule/readout helpers or consume deterministic
recorded snapshots. Do not run 73 miniature Matter worlds in the background.
Only the selected visible demo animates; offscreen card icons are static. Pause,
Replay, reduced-motion result poses and narrow/mobile layouts remain supported.

# XVI. Build examples to validate, not new free synergy bonuses

- **Aerial planner:** Halo + Hypno + Obsidian + Time + Ghost. Test that Obsidian
  recovers only outside aim, Halo only reduces eligible falling gravity and
  Hypno's ramp does not grant more physical slow time.
- **Rail technician:** Beacon + Glitch + Segmented + Standard + Thrusters + Volt.
  One bank may provide several different accepted outcomes; aggregate feedback
  must be readable. Thrusters cannot exceed cap, Volt cannot pay twice and the
  Segmented charge belongs to the next launch.
- **Armor specialist:** Crown + Visor + Iron + Magnet + Ribbon + Ember/ Void
  (choose exactly one dash). Armor removal, Scorch and plate refunds must not
  recursively create more contacts or pay per decorative fragment.
- **Last-health wager:** Oni + Sniper + Iron + Glass + Ghost. Glass health cap and
  Iron guard are separate; no animation suggests two health or guaranteed safety.
- **Chain stylist:** Cyber Ears + Ninja + Lava + Echo + Spectrum + Comic. Show the
  +36 grace cap and only one aggregate chain response. Secondary ghost kills must
  not recursively recharge everything.
- **Information setup:** free balanced kit + Prism Pointer + Oracle Radar +
  Oracle Lens. More information must not become auto-aim, bounce prediction or
  future-AI omniscience. Mobile information density is the main acceptance risk.

# XVII. Production sequence: detailed, reversible chunks

## Chunk 1 — freeze the design/data contract, not the codebase

Inventory all 73 IDs, current prices/unlocks, perk values, target predicates,
recipe dependencies and ownership/save keys. Record the 11 proposed revisions
behind a design-version/feature-flag strategy appropriate to this app. Add
catalogue coverage assertions. Keep the old plan as history, mark this as the
current proposal. **Exit:** every row links to an actual rule or an explicitly
unimplemented replacement; no missing item or undisclosed changed benefit.

## Chunk 2 — polish one end-to-end vertical slice

Use **Cyber Ears, Bastion Iron and Ember Dash** as three different cases: a simple
retained passive, a consumable state and a proposed target-mark mechanic. Build
icon → card → press/select → buy/equip → preview → real activation → cleanup for
these before scaling. Ember replacement stays isolated until mechanically tested.
**Exit:** the feel/clarity is approved without requiring 73 completed animations;
state and ability changes are distinguishable from decorative polish.

## Chunk 3 — shared button/control feel

Implement one delegated, cancellable feedback controller; explicit transaction
success/failure hooks; common sound priority/rate limiter; opt-in haptics only if
worth supporting. Cover all menu/settings/shop/result controls plus keyboard and
touch. Respect `prefers-reduced-motion` and the game's own motion preference.
**Exit:** no double spend/shot, no animation queue growth under rapid clicks, no
stale effects after close, muted/hidden pages quiet, focused buttons accessible.

## Chunk 4 — author all 73 icons, review silhouette before effects

Draft in actual worn-shape families, not generic ability-icon families. Produce
large and 20px monochrome review sheets, then check each in its real card at four
viewports. Keep a one-to-one ID map. Fix confusing pairs first: Halo/Time,
Coil/Volt, Prism Shell/Pointer/Wings, Iron/Segmented, Grav/Magnet,
Echo Core/Dash/Scarf, Field/Crosshair/Sniper, all sensor tiers.
**Exit:** 73 distinct contours, no missing fallback, no color-only tiers, bundled
assets with no external requests, names/states accessible without the icon.

## Chunk 5 — retained-mechanic reactions and previews

Implement by event family, not arbitrary catalogue order: aim efficiency, passive
recovery, chain grace, blade windows, scoring, armor/guard, bank resources,
secondary attacks, sensors. Reuse efficient rigs and rule-derived receipts.
Ship small subchunks with tests. **Exit:** each retained item has its Look/Works
views and a real-event reaction; no feedback triggers merely from being rendered.

## Chunk 6 — eleven revisions, in risk order

1. Obsidian/Notched: passive-condition replacements and owner-facing receipts.
2. Hypno/Smug: deterministic aiming-state windows and cap-integrated drain.
3. Blaze/Volt/Tide/Void: resource provenance, budgets and accepted-event gates.
4. Segmented: next-shot charge snapshot and expiration semantics.
5. Ember: per-target Scorch lifetime, plate transaction and different-shot gate.
6. Prism Pointer: truthful geometry overlay with bounded prediction workload.

Do not switch every redesign on at once. Compare one representative build before
and after; retain old behavior where the new role is not clearly better. **Exit:**
positive/negative/boundary tests plus actual playtests; exploit/cap review passed.

## Chunk 7 — integration, accessibility and performance qualification

- Full Node suite and standard/Poki single-file builds.
- Four viewport sizes: 960×540, 640×360, 390×844, 844×390; mouse, native touch,
  keyboard-only navigation, rapid selection/buy/retry, reduced motion and mute.
- Save migration: old wallet, owned parts, presets, challenge unlocks and discovery
  state retained; item IDs stable; purchases single-fire; no active-run rules
  silently changing because the shop preview changed.
- State lifecycle: aim cancel, pointer capture loss, pause, hidden tab, BFCache,
  WebGL unavailable/lost/restored and disposal of every new listener/timer/pool.
- Combat correctness: direct versus secondary, same-shot deduplication, plate
  remainders, removed targets, simultaneous kills, charge expiry, rate caps,
  saturated builds and deterministic rounding. Existing recipes still resolve.
- Memory: repeated browse/open/close and dense combat must return to a stable
  plateau; no per-frame atlas creation, retained dead-target marks or sound voices.
- Device profiling on real 2GB Android and low-end Chromebook: p50/p95/p99 frame
  times, >33ms frames, worst interactions, GC and memory after repeated sessions.
  Report raw before/after data; never claim 60 FPS from a software-GL screenshot.

# XVIII. Final acceptance checklist

A build is ready to review only when:

1. Every one of the 73 items has a distinct icon, readable role, actual trigger,
   truthful outcome/tradeoff, Look/Works demonstration and tested cleanup path.
2. The 11 revised mechanics have new rule tests and a deliberate migration;
   none is merely an extra hidden buff on top of the previous passive.
3. Button feedback is instant and proportional; success/failure sounds match the
   transaction result. The UI remains usable during every animation.
4. Effects cannot obscure the hero, hazard tells, aim origin or the next input.
   Free defaults remain polished, accurate and fully playable.
5. Multiple item activations combine into a readable result rather than an
   explosion of labels, particles and audio. Limits hold in worst-case builds.
6. Motion-off, muted, color-independent and keyboard/touch paths convey the same
   meaning. No important mechanic is taught only by a moving or audible cue.
7. Existing gameplay stepping, camera lead, wave progression and independent
   sword profiles remain intact unless a separately reviewed mechanic requires
   an explicit change. No shortcut performance freeze of offscreen combat.
8. New effects stay within the existing renderer architecture, optional single-pass
   compositor and bounded memory budgets; device performance claims are measured.

**Deliverable of this planning pass:** this specification only. Implementation,
actual icon artwork, mechanic values and performance certification are not done
merely because they have been described in detail here.
