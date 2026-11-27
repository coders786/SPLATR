import {dashStudy} from './dash-study.js';
import {aimStudy} from './aim-study.js';
import {abilityShowcase} from './ability-showcase.js';
import {shopAbility} from './shop-language.js';
import {eyeToolkitStudy} from './eye-toolkit.js';
import {tailToolkitStudy} from './tail-toolkit.js';
import {reactiveShellStudy} from './needle-phase.js';
import {ITEMS} from './equipment.js';
import {powerReadout} from './power-readout.js';
import {PART_PERKS,resolvePartPerks} from './part-perks.js';
import {focusRecoveryStudy} from './focus-recovery.js';
import {armorShellStudy} from './armor-shell.js';
export const SHOP_GROUPS=Object.freeze([
 {id:'cube',label:'CUBE',icon:'core',slots:['head','eyes','body','core','tail']},
 {id:'attack',label:'ATTACK',icon:'blade',slots:['slash','dash']},
 {id:'sensors',label:'AIM & SCAN',icon:'target',slots:['pointer','radar','trajectory']},
 {id:'world',label:'WORLD',icon:'world',slots:['world']},
].map(g=>Object.freeze({...g,slots:Object.freeze(g.slots)})));
export const SLOT_LABELS=Object.freeze({head:'Head',eyes:'Eyes',body:'Shell',core:'Core',tail:'Tail',slash:'Blade FX',dash:'Dash FX',pointer:'Aim mark',radar:'Radar',trajectory:'Flight path',world:'Arena'});
export const shopGroup=slot=>SHOP_GROUPS.find(g=>g.slots.includes(slot))||SHOP_GROUPS[0];
export function shopItems(slot,{owned=[],wallet=0,filter='all',query=''}={}){
 const needle=String(query).trim().toLowerCase();
 return ITEMS.filter(it=>it.slot===slot&&(!needle||`${it.name} ${powerReadout(it).short} ${shopAbility(it.id).headline} ${shopAbility(it.id).effect}`.toLowerCase().includes(needle))&&(filter==='owned'?owned.includes(it.id):filter==='affordable'?it.price!==null&&!owned.includes(it.id)&&it.price<=wallet:filter==='challenge'?it.price===null:true));
}
export function classifyItem(item){
 const p=powerReadout(item),perk=PART_PERKS[item.id];
 const family=perk?.stat.startsWith('score:')?'score':perk?.stat==='blade'?'blade':(perk?.stat==='grace'||perk?.stat==='sequence')?'chain':perk?.stat==='focus'||perk?.stat==='recovery'?'focus':item.slot==='radar'||item.slot==='trajectory'?'sensor':item.price===0?'baseline':p.mode==='aim'?'focus':p.mode==='bounce'?'movement':p.mode==='hit'?'defense':'combat';
 return Object.freeze({family,label:({score:'SCORE',blade:'BLADE',chain:'CHAIN',focus:'FOCUS',sensor:'SENSOR',baseline:'STARTER',movement:'REBOUND',defense:'DEFENSE',combat:'COMBAT'})[family],trigger:p.trigger,benefit:p.short});
}
/** One readable demonstration, not eleven unrelated slots or a simulation claim. */
export function shopStudy(item,elapsed=0,motion=true,equipment={}){
 const dash=dashStudy(item,elapsed,motion,equipment),aim=aimStudy(item,elapsed,motion,equipment),p=powerReadout(item,equipment),classification=classifyItem(item),t=motion?Math.max(0,elapsed)%3000:1900;
 return Object.freeze({id:item.id,slot:item.slot,perk:PART_PERKS[item.id]||null,family:classification.family,
  phase:t<500?'READY':t<1400?'TRIGGER':'RESULT',progress:motion?Math.min(1,Math.max(0,(t-500)/900)):1,
  trigger:p.trigger,benefit:p.chips.join(' · '),title:item.name,motion,showcaseHeadline:shopAbility(item.id).headline,
  ...(aim?{aim}:{}),
  ...(dash?{dash}:{}),
  ...(['head','core'].includes(item.slot)?{showcase:abilityShowcase(item,elapsed,motion,equipment)}:{}),
  ...(item.slot==='eyes'?{eye:eyeToolkitStudy(item.id,elapsed,motion)}:{}),
  ...(item.slot==='tail'?{tail:tailToolkitStudy(item.id,elapsed,motion)}:{}),
  ...(['hologram','iron','prism'].includes(item.id)?{reactive:reactiveShellStudy(item.id,elapsed,motion)}:{}),
  ...(['chamfer','segmented'].includes(item.id)?{shell:armorShellStudy(item.id,elapsed,motion)}:{}),
  ...(item.id==='notched'?{recovery:focusRecoveryStudy(elapsed,{rate:resolvePartPerks({...equipment,body:'notched'}).focusRegen,withoutRate:resolvePartPerks({...equipment,body:'paper'}).focusRegen,drain:resolvePartPerks({...equipment,body:'paper'}).focusDrain,motion})}:{}),
 });
}

/** Compare resolved build identities, not just families: variants can differ. */
export function shopSwapNotice(current, preview) {
 if(!current.build || current.build===preview.build)return '';
 return preview.build ? `SIGNATURE SWAP / ${current.buildTitle} → ${preview.buildTitle}` : `BREAKS ${current.buildTitle} / STANDARD BLADE`;
}
