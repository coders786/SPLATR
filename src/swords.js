import {HYBRIDS} from './hybrids.js';
import {isCosmeticSlot} from './cosmetic-slots.js';

/** Authoritative, immutable styles. No luck, targeting correction or save writes.
 * Width multiplies the existing forward sensor; reach is measured from cube centre.
 * Zenith exchanges baseline coverage for a bounded, non-recursive second strike. */
export const SWORD_STYLES=Object.freeze(Object.fromEntries([
 {id:'standard',name:'FIELD BLADE',family:'standard',width:1,reach:1,ticks:0,armor:0,color:'#deff73',strength:'Reliable forward cut.',cost:'No signature follow-up.',receipt:'STANDARD / PART POWERS ONLY'},
 {id:'cleaver',name:'SPLIT MAUL',family:'cleaver',width:1.3,reach:.86,ticks:-3,armor:0,color:'#e3f776',strength:'30% wider cutting lane.',cost:'14% shorter reach; 3 fewer blade ticks.',receipt:'WIDTH +30% / REACH -14% / WINDOW -3'},
 {id:'rapier',name:'NEEDLE OATH',family:'rapier',width:.72,reach:1.25,ticks:0,armor:0,color:'#98e9ff',strength:'25% longer forward reach.',cost:'28% narrower cutting lane.',receipt:'REACH +25% / WIDTH -28%'},
 {id:'breaker',name:'FAULT ENGINE',family:'breaker',width:.92,reach:.9,ticks:-3,armor:1,color:'#ffbd79',strength:'+1 damage against armored targets.',cost:'10% shorter reach; 8% narrower; 3 fewer ticks.',receipt:'ARMOR +1 / REACH -10% / WIDTH -8% / WINDOW -3'},
 {id:'reaper',name:'PALE HARVEST',family:'reaper',width:.84,reach:1,ticks:8,armor:0,color:'#f7accc',strength:'8 extra active blade ticks.',cost:'16% narrower cutting lane.',receipt:'WINDOW +8 / WIDTH -16%'},
 {id:'echo',name:'AFTER OATH',family:'echo',width:.82,reach:.95,ticks:-2,armor:0,color:'#cdb7ff',delay:18,secondaryRange:270,secondaryWidth:22,targetCap:3,strength:'Delayed cut along the original lane; up to 3 targets.',cost:'18% narrower; 5% shorter; 2 fewer ticks.',receipt:'ECHO / 18-TICK DELAY / 3 TARGETS / NARROWER CUT'},
 {id:'pulse',name:'ARC CAPACITOR',family:'pulse',width:.85,reach:.96,ticks:-2,armor:0,color:'#99f5e3',chargeMax:3,secondaryRange:220,secondaryWidth:40,targetCap:3,strength:'3 direct contacts charge a forward pulse on your next dash.',cost:'15% narrower; 4% shorter; 2 fewer ticks.',receipt:'3 CONTACTS -> NEXT-DASH PULSE / NARROWER CUT'},
].map(x=>[x.id,Object.freeze(x)])));
const assignments={
 wyrm:['rapier','apex'],ronin:['rapier','apex'],king:['breaker','apex'],phantom:['echo','zenith'],reaper:['reaper','apex'],eater:['pulse','zenith'],sun:['cleaver','apex'],
 glacier:['reaper','apex'],briar:['reaper','apex'],sentinel:['breaker','apex'],arcade:['echo','zenith'],storm:['pulse','zenith'],forge:['cleaver','apex'],wraith:['echo','zenith'],bulwark:['breaker','apex'],razoredge:['rapier','apex'],orbit:['pulse','zenith'],
};
// Seventeen tuned signatures share six readable animation families. The variants
// change usage (coverage, commitment or secondary cadence), not hidden damage tiers.
const variants=Object.freeze({
 wyrm:{name:'WIRE LANCE',reach:1.30,width:.68,ticks:-1},
 ronin:{name:'PAPER OATH',reach:1.16,width:.88,ticks:-1},
 razoredge:{name:'GLASS NEEDLE',reach:1.32,width:.65},
 king:{name:'GRAV CHISEL',reach:.92,ticks:-4},
 sentinel:{name:'RAIL FAULT',reach:.84,width:1.04,ticks:0},
 bulwark:{name:'RESCUE EDGE'},
 reaper:{name:'MECHA HOOK'},
 glacier:{name:'CHRONO HOOK',ticks:10,width:.78,reach:.95},
 briar:{name:'BRIAR HOOK',ticks:6,width:.90,reach:1.08},
 sun:{name:'SUN SPLITTER',width:1.32},
 forge:{name:'FURNACE SLAB',width:1.45,reach:.80,ticks:-4},
 phantom:{name:'PHASE OATH',delay:22,secondaryRange:300,secondaryWidth:16,targetCap:2,width:.78,reach:1},
 arcade:{name:'PIXEL REPRISE',delay:14,secondaryRange:230,secondaryWidth:28,targetCap:3,width:.86,reach:.90},
 wraith:{name:'AFTER OATH'},
 eater:{name:'STAR CAPACITOR',chargeMax:4,secondaryRange:300,secondaryWidth:26,targetCap:3,width:.80,reach:1},
 storm:{name:'ARC CAPACITOR'},
 orbit:{name:'ORBIT ENGINE',chargeMax:4,secondaryRange:250,secondaryWidth:32,targetCap:4,width:.88},
});
function describeStyle(style){
 const signed=n=>`${n>=0?'+':''}${n}`;
 const deltas=[['REACH',Math.round((style.reach-1)*100),'%'],['WIDTH',Math.round((style.width-1)*100),'%'],['WINDOW',style.ticks,' TICKS'],['ARMOR',style.armor,'']].filter(([,n])=>n!==0);
 const costs=deltas.filter(([,n])=>n<0).map(([key,n,unit])=>`${key.toLowerCase()} ${n}${unit.toLowerCase()}`);
 const bonus=deltas.filter(([,n])=>n>0).map(([key,n,unit])=>`${key.toLowerCase()} ${signed(n)}${unit.toLowerCase()}`);
 const strength=style.family==='echo'?`Delayed lane: ${style.delay} ticks, ${style.secondaryRange}px, up to ${style.targetCap} targets.`:style.family==='pulse'?`${style.chargeMax} direct contacts charge a ${style.secondaryRange}px next-dash pulse; up to ${style.targetCap} targets.`:bonus.length?bonus.join(' / ')+'.':style.strength;
 const special=style.family==='echo'?`ECHO ${style.delay}T / ${style.secondaryRange}PX / ${style.targetCap} TARGETS`:style.family==='pulse'?`${style.chargeMax} CONTACTS / PULSE ${style.secondaryRange}PX / ${style.targetCap} TARGETS`:'';
 return {...style,strength,cost:costs.length?costs.join(' / ')+'.':style.cost,receipt:[special,...deltas.map(([key,n,unit])=>`${key} ${signed(n)}${unit}`)].filter(Boolean).join(' / ')};
}
export const SWORD_BUILDS=Object.freeze(HYBRIDS.map(h=>Object.freeze({id:h.id,title:h.title,parts:h.parts,color:h.color,style:assignments[h.id][0],tier:assignments[h.id][1]})));
const gearBuilds=SWORD_BUILDS.map(build=>({build,parts:Object.entries(build.parts).filter(([slot])=>!isCosmeticSlot(slot))})).filter(x=>x.parts.length>=2).sort((a,b)=>b.parts.length-a.parts.length);
export function swordProfile(equipment={}){
 // A visual recipe can still change the art, but never the sword. Match only
 // gameplay slots, preferring the most specific recipe and catalogue order.
 const build=gearBuilds.find(x=>x.parts.every(([slot,id])=>equipment[slot]===id))?.build||null;
 const style=build?describeStyle({...SWORD_STYLES[build.style],...variants[build.id]}):SWORD_STYLES.standard;
 return Object.freeze({...style,build:build?.id||null,buildTitle:build?.title||'MIXED LOADOUT',tier:build?.tier||'standard',color:build?.color||style.color});
}
export function effectiveSword(profile,buff=null){
 return Object.freeze({...profile,reach:profile.reach*(buff?.reach||1),ticks:profile.ticks+(buff?.blade||0),armor:profile.armor+(buff?.armor||0)});
}
export function swordAttack(profile,origin,angle,shot,kind=profile.family){
 const dx=Math.cos(angle),dy=Math.sin(angle);
 return {kind,shot,x:origin.x,y:origin.y,tx:origin.x+dx*(profile.secondaryRange||0),ty:origin.y+dy*(profile.secondaryRange||0),angle,width:profile.secondaryWidth||0,delay:kind==='echo'?profile.delay:1,life:14,fired:false,hits:new Set(),targetCap:profile.targetCap||0};
}
/** Allocation bounded by the caller; ray geometry is resolved against real enemy sensors. */
export function advanceSwordAttacks(attacks,dt,query,hit){
 for(const a of attacks){
  if(!a.fired){a.delay-=dt;if(a.delay<=0){a.fired=true;for(const e of query(a)){if(a.hits.size>=a.targetCap)break;if(a.hits.has(e.id))continue;a.hits.add(e.id);hit(e,a);}}}
  else a.life-=dt;
 }
 return attacks.filter(a=>!a.fired||a.life>0);
}
