import {PART_PERKS,BASE_PARTS} from './part-perks.js';
import {equipmentRules,normalizeEquipment,ITEMS} from './equipment.js';
/** Literal individual-part receipts. Full-build sword styles are resolved in
 * swords.js; a cosmetic part is never advertised as a standalone combat power. */
const powers={
 halo:['◷','FLOAT AIM','WHILE AIMING',['FALL GRAV −15%'],'aim'],
 viper:['➜','FASTER DASH','EVERY DASH',['SPEED +20%','CUT WIDTH −15%'],'dash'],
 oni:['◆','LAST HEALTH','AT 1 HEALTH',['KILL SCORE +50%'],'hit'],
 crown:['▰','BREAK ARMOR','ON DIRECT HIT',['2 PLATES','SPEED −8%'],'slice'],
 samurai:['╱','WIDE CUT','NEAR HORIZONTAL',['CUT WIDTH +20%'],'slice'],
 coil:['ϟ','CHAIN ZAP','ON DIRECT CUT',['1 NEARBY TARGET','RANGE 160'],'slice'],
 beacon:['!','EARLY WARNING','FANG WINDUP',['THREAT BRACKET'],'aim'],
 prism:['↗','WALL NEEDLES','ON SIDE WALL',['2 NEEDLES','45-TICK COOLDOWN'],'bounce'],
 iron:['▣','RUSH SHIELD','FANG RUSH',['1 BLOCK / RUN'],'hit'],
 grav:['◈','AIM PULL','WHILE AIMING',['SMALL FANGS','RANGE 220'],'aim'],
 magnet:['◎','CLOSE CUT','WITHIN 100',['CUT WIDTH +20%'],'slice'],
 echo:['≋','GHOST BLADE','EVERY 3 CHAIN KILLS',['30 TICKS','HITS FANGS'],'slice'],
 anchor:['↓','FLOOR BREAKER','ON FLOOR REBOUND',['KICK +15%','FANG CLEAR 170'],'bounce'],
 thrusters:['➤','JET REBOUND','EARNED RAIL BANK',['REBOUND +8%','SPEED CAP KEPT'],'bounce'],
 wings:['↟','WALL REFILL','FIRST AIRBORNE WALL',['+1 EDGE'],'bounce'],
 ghost:['≋','LONGER BLADE','EVERY DASH',['+6 BLADE TICKS'],'dash'],
 time:['◷','FOCUS RECOVERY','AFTER A KILL',['2× RECOVERY','120 TICKS'],'aim'],
 riot:['ϟ','QUICK OVERDRIVE','CONSECUTIVE KILLS',['4 KILLS TO DRIVE','MAX EDGE 2'],'slice'],
 glass:['◆','DOUBLE SCORE','ALL RUN',['SCORE ×2','MAX HEALTH 1'],'hit'],
 standard:['◇','BALANCED','ALL RUN',['3 EDGE','3 HEALTH'],'slice'],
 'radar-base':['◎','LOCAL RADAR','ALL RUN',['NEARBY CONTACTS'],'aim'],
 'radar-1':['◎','LONG-RANGE RADAR','ALL RUN',['RANGE +35%'],'aim'],
 'radar-2':['◎','THREAT RADAR','ALL RUN',['RANGE +70%','ACTIVE HAZARDS'],'aim'],
 'radar-3':['◎','ORACLE RADAR','ALL RUN',['RANGE +120%','HAZARDS + TELLS'],'aim'],
 'trajectory-base':['↗','FLIGHT PATH','WHILE AIMING',['SHORT PATH'],'aim'],
 'trajectory-1':['↗','VECTOR LENS','WHILE AIMING',['EXTENDED PATH'],'aim'],
 'trajectory-2':['↗','IMPACT LENS','WHILE AIMING',['LONGER PATH','TIME TICKS'],'aim'],
 'trajectory-3':['↗','ORACLE LENS','WHILE AIMING',['LONGEST PATH','FLIGHT ANALYSIS'],'aim'],
};
const quick={halo:'FALL GRAV −15%',oni:'LAST HEALTH +50%',coil:'ZAP +1 ENEMY',beacon:'EARLY WARNING',prism:'2 WALL NEEDLES',iron:'BLOCK 1 RUSH',grav:'PULL NEARBY FANGS',echo:'GHOST EVERY 3',wings:'WALL +1 EDGE',time:'FOCUS RECOVERY ×2'};
export function powerReadout(item){
 const value=typeof item==='string'?ITEMS.find(x=>x.id===item):item;
 if(!value)throw new RangeError('Unknown equipment');
 const perk=PART_PERKS[value.id],base=BASE_PARTS[value.id];
 const p=powers[value.id] || (perk ? ['✦',perk.title,perk.trigger,[perk.chip],'slice'] : base ? ['◇',base[0],'BASELINE',[base[1]],'slice'] : null);
 if(!p)throw new RangeError(`Missing gameplay receipt: ${value.id}`);
 return Object.freeze({icon:p[0],title:p[1],trigger:p[2],chips:Object.freeze([...p[3]]),mode:p[4],cosmetic:false,short:quick[value.id]||p[3][0],detail:perk ? perk.detail + ({grace:' Combined chain grace caps at +36 ticks.',focus:' Combined aim-cost reduction caps at 30%.',recovery:' Combined passive recovery bonus caps at 40%.',blade:' Combined extra perk blade time caps at +8 ticks, in addition to Ghost.'}[perk.stat]||'') : value.detail});
}
export function buildReadout(equipment){
 const rules=equipmentRules(normalizeEquipment(equipment));
 return Object.freeze({speed:Math.round(rules.dashSpeed*100),width:Math.round(rules.cutWidth*100),edge:rules.edgeMax,hull:rules.healthMax,score:rules.scoreMultiplier,
 label:`SPD ${Math.round(rules.dashSpeed*100)}% · EDGE ${rules.edgeMax} · HEALTH ${rules.healthMax}`});
}

/** Comparable unconditional primary-blade rules. Conditional part powers remain
 * separate: a close-range/horizontal bonus is never sold as always-on width. */
export function primaryReadout(equipment,sword){
 const r=equipmentRules(normalizeEquipment(equipment));
 return Object.freeze({speed:Math.round(r.dashSpeed*100),width:Math.round(r.cutWidth*(sword?.width??1)*100),reach:Math.round((sword?.reach??1)*100),window:r.bladeExtra+(sword?.ticks??0),armor:r.armorDamage+(sword?.armor??0),edge:r.edgeMax,hull:r.healthMax,score:r.scoreMultiplier,
 conditional:Object.freeze([...(r.horizontalWidth>1?['Near-horizontal width +20%.']:[]),...(r.closeWidth>1?['Within 100px: width +20%.']:[]),...(r.lastHullBonus>1?['At 1 health: kill score +50%.']:[])])});
}
