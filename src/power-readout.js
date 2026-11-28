import {primaryWidth} from './primary-width.js';
import {readablePower} from './shop-language.js';
import {PART_PERKS,BASE_PARTS} from './part-perks.js';
import {equipmentRules,normalizeEquipment,ITEMS} from './equipment.js';
/** Literal individual-part receipts. Full-build sword styles are resolved in
 * swords.js; a cosmetic part is never advertised as a standalone combat power. */
const powers={
 'dash-lightning':['ϟ','ARC LANCE','LAUNCH / FIRST DIRECT HIT',['BRIEF BURST +12%','CUT −15% / 1 NEARBY ARC'],'slice'],
 'dash-echo':['≋','REPRISE STROKE','LEGAL LAUNCH / SLOT READY',['OLD PATH / AFTER 0.2s','UP TO 2 / 1 EXTRA HIT'],'slice'],
 'dash-void':['◉','COLLAPSE WELL','FIRST DIRECT CONTACT / READY',['PULL UP TO 3 / 0.3s','SMALL CORE: 1 EXTRA HIT'],'slice'],
 'dash-ice':['◇','RIME BREAKER','FIRST DIRECT CONTACT',['FANG FREEZE / 0.3s','HEAVY MOVEMENT −30% / 0.4s'],'slice'],
 'dash-fire':['♨','CONTACT IGNITION','FIRST DIRECT CONTACT',['2 DELAYED FIRE HITS','SHOT WIDTH −10%'],'slice'],
 sniper:['⊙','PRECISION PUNCTURE','RELEASE AT 90%+ POWER',['FIRST ARMOR +1 PLATE','SHOT WIDTH −10%'],'slice'],
 blaze:['ϟ','IGNITION RESERVE','ENTER OVERDRIVE',['+1 EDGE / CAP KEPT','NO QUEUED REFUND'],'slice'],
 hypno:['◎','LOCAL DAZE','HOLD AIM / 0.3s',['ONE NEARBY FANG','BRIEF ATTACK DELAY'],'aim'],
 'viper-tails':['➜','DIRECTIONAL RETENTION','LEGAL REDIRECTION',['LESS SPEED LOST','WHEN TURNING'],'bounce'],
 spectrum:['▰','THREE-BAND REFILL','3 PRIMARY KILLS / ONE CHAIN',['+1 EDGE / CAP KEPT','120-TICK COOLDOWN'],'slice'],
 hologram:['◇','PRECISION PHASE','JUST AFTER A DASH',['ONE PRISM / CROWN NEEDLE','2s RECHARGE'],'hit'],
 chamfer:['◇','GLANCING RECOIL','PRIMARY ARMOR CONTACT',['ARMOR RECOIL −20%','NO EXTRA BLADE TIME'],'hit'],
 segmented:['▤','COMPRESSION SPRING','FIRST PRIMARY ARMOR LOSS / SHOT',['STORE 20% / MAX 4 SPEED','USE WITHIN 0.75s'],'hit'],
 halo:['◷','FLOAT AIM','WHILE AIMING',['FALL GRAV −15%'],'aim'],
 viper:['➜','FASTER DASH','EVERY DASH',['SPEED +20%','CUT WIDTH −15%'],'dash'],
 oni:['◆','LAST HEALTH','AT 1 HEALTH',['KILL SCORE +50%'],'hit'],
 crown:['▰','BREAK ARMOR','ON DIRECT HIT',['2 PLATES','SPEED −8%'],'slice'],
 samurai:['╱','WIDE CUT','NEAR HORIZONTAL',['CUT WIDTH +20%'],'slice'],
 coil:['ϟ','CHAIN ZAP','ON DIRECT CUT',['ZAP +1 ENEMY','NO REPEATING ZAPS'],'slice'],
 beacon:['!','EARLY WARNING','FANG WINDUP',['THREAT BRACKET'],'aim'],
 prism:['↗','WALL NEEDLES','ON SIDE WALL',['2 NEEDLES','45-TICK COOLDOWN'],'bounce'],
 iron:['▣','RUSH SHIELD','FANG RUSH',['1 BLOCK / RUN'],'hit'],
 grav:['◈','AIM PULL','WHILE AIMING',['SMALL FANGS','SMALL NEARBY FANGS'],'aim'],
 magnet:['◎','CLOSE CUT','WITHIN 100',['CUT WIDTH +20%'],'slice'],
 echo:['≋','GHOST BLADE','EVERY 3 CHAIN KILLS',['30 TICKS','HITS FANGS'],'slice'],
 anchor:['↓','FLOOR BREAKER','ON FLOOR REBOUND',['KICK +15%','CLEARS NEARBY FANGS'],'bounce'],
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
 'trajectory-2':['↗','IMPACT LENS','WHILE AIMING',['LONGER PATH','TRAVEL-TIME MARKS'],'aim'],
 'trajectory-3':['↗','ORACLE LENS','WHILE AIMING',['LONGEST PATH','FLIGHT ANALYSIS'],'aim'],
};
const quick={'dash-lightning':'BURST → CONTACT ARC','dash-echo':'OLD PATH → REPLAY','dash-void':'PULL → CORE HIT','dash-ice':'CONTACT → COLD','dash-fire':'CONTACT → BURN',sniper:'FIRST ARMOR +1',blaze:'DRIVE ENTRY +1 EDGE',hypno:'HOLD / LOCAL DAZE','viper-tails':'KEEP 15% OF LOSS',spectrum:'3 KILLS / +1 EDGE',hologram:'PHASE 1 NEEDLE',chamfer:'ARMOR SHOVE −20%',segmented:'STORE LOSS / MAX 4',halo:'FALL GRAV −15%',oni:'LAST HEALTH +50%',coil:'ZAP +1 ENEMY',beacon:'EARLY WARNING',prism:'2 WALL NEEDLES',iron:'BLOCK 1 RUSH',grav:'PULL NEARBY FANGS',echo:'GHOST EVERY 3',wings:'WALL +1 EDGE',time:'FOCUS RECOVERY ×2'};
export function powerReadout(item,equipment=null){
 const value=typeof item==='string'?ITEMS.find(x=>x.id===item):item;
 if(!value)throw new RangeError('Unknown equipment');
 const perk=PART_PERKS[value.id],base=BASE_PARTS[value.id];
 if(value.id==='dash-ink'){
  const eq=normalizeEquipment({...equipment,dash:'dash-ink'}),r=equipmentRules(eq),withInk=primaryWidth(0,r),without=primaryWidth(0,{...r,inkWidth:1}),far=Math.round((withInk.far.total/without.far.total-1)*100),near=Math.round((withInk.near.total/without.near.total-1)*100);
  return readablePower({icon:'▰',title:'BRUSH CUTTER',trigger:'EVERY DIRECT CUT',chips:Object.freeze(['CUT WIDTH UP TO +12%','WIDTH BONUS LIMIT +35%']),mode:'slice',cosmetic:false,short:'CUT WIDTH +12%',detail:perk.detail,
   buildNote:`With your current parts, a level cut gains ${far}% width farther out and ${near}% on a close pass. Other angles can change the shared limit.`},value.id);
 }
 if(value.id==='notched'){
  const equipped=normalizeEquipment({...equipment,body:'notched'}),rate=equipmentRules(equipped).focusRegen,
    without=equipmentRules({...equipped,body:'paper'}).focusRegen,marginal=Math.round((rate-without)*100);
  return readablePower({icon:'↗',title:'VENT COOLING',trigger:'RELEASE AIM / MISSING FOCUS',
    chips:Object.freeze([`RECOVERY +${marginal}%`,`TOTAL +${Math.round((rate-1)*100)}% / CAP 40%`]),mode:'aim',cosmetic:false,short:'VENT RETURN +12%',
    detail:perk.detail+` Shared recovery bonus caps at 40%; this build gains +${marginal} percentage points. Vents open only while FOCUS actually returns. No aim-cost discount or thrust.`},value.id);
 }
 const p=powers[value.id] || (perk ? ['✦',perk.title,perk.trigger,[perk.chip],'slice'] : base ? ['◇',base[0],'BASELINE',[base[1]],'slice'] : null);
 if(!p)throw new RangeError(`Missing gameplay receipt: ${value.id}`);
 return readablePower({icon:p[0],title:p[1],trigger:p[2],chips:Object.freeze([...p[3]]),mode:p[4],cosmetic:false,short:quick[value.id]||p[3][0],detail:perk ? perk.detail + ({grace:' Combined chain grace caps at +36 ticks.',focus:' Combined aim-cost reduction caps at 30%.',recovery:' Combined passive recovery bonus caps at 40%.',blade:' Combined extra perk blade time caps at +8 ticks, in addition to Ghost.'}[perk.stat]||'') : value.detail},value.id);
}
export function buildReadout(equipment){
 const rules=equipmentRules(normalizeEquipment(equipment));
 return Object.freeze({speed:Math.round(rules.dashSpeed*100),width:Math.round(rules.cutWidth*rules.inkWidth*rules.dashNarrowing*100),edge:rules.edgeMax,hull:rules.healthMax,score:rules.scoreMultiplier,
 label:`SPD ${Math.round(rules.dashSpeed*100)}% · EDGE ${rules.edgeMax} · HEALTH ${rules.healthMax}`});
}

/** Comparable unconditional primary-blade rules. Conditional part powers remain
 * separate: a close-range/horizontal bonus is never sold as always-on width. */
export function primaryReadout(equipment,sword){
 const r=equipmentRules(normalizeEquipment(equipment));
 return Object.freeze({speed:Math.round(r.dashSpeed*100),width:Math.round(r.cutWidth*r.inkWidth*r.dashNarrowing*(sword?.width??1)*100),reach:Math.round((sword?.reach??1)*100),window:r.bladeExtra+(sword?.ticks??0),armor:r.armorDamage+(sword?.armor??0),edge:r.edgeMax,hull:r.healthMax,score:r.scoreMultiplier,
 conditional:Object.freeze([...(r.horizontalWidth>1?['Near-horizontal width up to +20%; combined bonus limit +35%.']:[]),...(r.closeWidth>1?['Within 100px: width up to +20%; combined bonus limit +35%.']:[]),...(equipment?.eyes==='sniper'?['At 90%+ release: first armor +1 plate; shot width −10%.']:[]),...(r.lastHullBonus>1?['At 1 health: kill score +50%.']:[])])});
}
