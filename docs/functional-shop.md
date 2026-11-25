# Functional shop — 2026-11-24

Every one of the 73 catalogue entries now has a gameplay/baseline receipt.
Existing combat parts, challenge unlocks, radar range/hazard sensing and flight
path lenses keep their real rules. Free starter parts clearly describe their
baseline utility; they do not gain hidden buffs.

Previously visual-only paid parts now grant explicit perks via `part-perks.js`:

- Blade time: Katana +2 ticks, Laser +3, Ember Dash +2, Chamfer +1, etc.
- Chain grace: Cyber Ears +12 ticks, Lava Shell +18, Comic Impact +18, etc.
- Focus efficiency: Visor −10% aim cost, Hypno −15%, Hologram −12%, etc.
- Passive focus recovery: Glitch Eyes +12%, Tide Dash +10%, Synthworld +15%.
- Conditional kill score: Tokyo at speed, Foundry against armored foes, Manga
  on multi-cuts, Void against Landlords, Blaze during Overdrive, etc. Gold is
  unconditional +10%. Score perks do not trigger secondary proc chains.

Hard composition caps: +8 perk blade ticks (separate from Ghost's +6), +36 chain
ticks, 30% less focus use, 40% faster passive recovery, 25% extra perk kill score.
These change simulation numbers, not just UI text. No new damage immunity,
physics skipping, enemy damage recursion or camera lead changes were added.

Shop fixes: proper item-story preview on opening non-dash slots, visible benefit
explanations and next-run equip timing, accurate badges/details, and a numeric
base-vs-part demo for new perks. Purchases remain BUY then EQUIP; owning something
does not silently replace the current loadout. Unaffordable and challenge parts
remain disabled. Save IDs and existing presets are unchanged.

Effects: local blade chevrons, focus arcs, chain links and score diamonds confirm
new perk activation. All expire after 30 simulation ticks and disappear with
motion disabled. Shop comparisons become static with reduced motion.

Tests include real-run resource drain/recovery, blade duration, an actual enemy
cut paying score, actual chain expiry extension, caps, catalogue receipts and
canvas state/reduced-motion guards. Old stat-neutral assertions were updated to
reflect the requested design change while retaining health/speed/armor bounds.

Balance still needs human playtesting. These are bounded first-pass values,
not a claim that every combination is equally strong.
