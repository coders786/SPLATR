import { resolvePartPerks } from './part-perks.js';
import { MUTATIONS } from './hybrids.js';
import {ITEMS,SLOTS} from './art/splatr-art-engine.js';
export {ITEMS,SLOTS};
export const DEFAULT_EQUIPMENT = Object.freeze(Object.fromEntries(SLOTS.map(slot => [slot,ITEMS.find(x=>x.slot===slot).id])));
export function normalizeEquipment(value={}, owned=ITEMS.map(x=>x.id)) {
  return Object.freeze(Object.fromEntries(SLOTS.map(slot => [slot, ITEMS.some(x=>x.slot===slot && x.id===value?.[slot] && owned.includes(x.id)) ? value[slot] : DEFAULT_EQUIPMENT[slot]])));
}
export function loadEquipment(raw) {
  let p; try { p=JSON.parse(raw); } catch { p={}; }
  const owned=ITEMS.filter(x=>x.price===0 || p?.owned?.includes(x.id)).map(x=>x.id);
  return {version:1,owned,discovered:MUTATIONS.map(h=>h.id).filter(id=>Array.isArray(p?.discovered)&&p.discovered.includes(id)),equipped:normalizeEquipment(p?.equipped,owned),presets:Array.from({length:3},(_,i)=>p?.presets?.[i] ? normalizeEquipment(p.presets[i],owned) : null)};
}
export function randomEquipment(owned, random=Math.random) {
  return normalizeEquipment(Object.fromEntries(SLOTS.map(slot=>{const pool=ITEMS.filter(x=>x.slot===slot&&owned.includes(x.id));return [slot,pool[Math.min(pool.length-1,Math.floor(random()*pool.length))].id];})),owned);
}
export function buyEquipment(state,id,wallet) {
  const found=ITEMS.find(x=>x.id===id);
  if(!found || found.price===null || state.owned.includes(id) || !Number.isSafeInteger(wallet) || wallet<found.price) return null;
  return {wallet:wallet-found.price,state:{...state,owned:[...state.owned,id]}};
}

/** Resolved once per run. Rendering never owns or modifies these rules. */
export function equipmentRules(equipment) {
  const eq=normalizeEquipment(equipment);
  const perks = resolvePartPerks(eq);
  return Object.freeze({
    ...perks,
    healthMax:eq.core==='glass'?1:3,
    scoreMultiplier:eq.core==='glass'?2:1,
    lastHullBonus:eq.head==='oni'?1.5:1,
    edgeMax:eq.core==='riot'?2:3,
    dashSpeed:eq.head==='viper'?1.2:eq.head==='crown'?.92:1,
    cutWidth:eq.head==='viper'?.85:1,
    inkWidth:1,
    emberBurn:false,
    frostControl:false,
    voidWell:false,
    reprise:false,
    voltLance:false,
    dashNarrowing:1,
    bladeExtra:(eq.tail==='ghost'?6:0)+perks.perkBlade,
    overdriveKills:eq.core==='riot'?4:6,
    aimFallGravity:eq.head==='halo'?.85:1,
    focusRecoveryTicks:eq.core==='time'?120:0,
    wallRecharge:eq.tail==='wings',
    viperRetention:eq.tail==='viper-tails',spectrumSequence:eq.tail==='spectrum',
    armorDamage:eq.head==='crown'?2:1,
    horizontalWidth:eq.head==='samurai'?1.2:1,
    coil:eq.head==='coil',
    blazeEntry:false,
    hypnoDaze:false,
    earlyWarning:eq.head==='beacon',
    wallNeedles:eq.body==='prism',
    bumpGuard:eq.body==='iron',
    needlePhase:eq.body==='hologram',
    armorRecoilScale:eq.body==='chamfer'?.8:1,
    armorSpring:eq.body==='segmented',
    gravityPull:eq.core==='grav',
    closeWidth:eq.core==='magnet'?1.2:1,
    echo:eq.core==='echo',
    floorBoost:eq.tail==='anchor'?1.15:1,
    floorWave:eq.tail==='anchor',
    reboundBoost:eq.tail==='thrusters'?1.08:1,
  });
}
