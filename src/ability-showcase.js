import {primaryWidth} from './primary-width.js';
/** Labelled shop illustrations derived from existing item rules; never a run. */
import {equipmentRules} from './equipment.js';
import {aimPull} from './equipment-combat.js';
import {recoverFocus} from './focus-recovery.js';
export const SHOWCASE_IDS=Object.freeze(['none','halo','neko','viper','oni','crown','samurai','coil','beacon','standard','time','riot','glass','grav','magnet','echo']);
export function abilityShowcase(item,elapsed=0,motion=true,equipment={}){
 if(!SHOWCASE_IDS.includes(item.id))return null;
 const time=motion?Math.max(0,Number.isFinite(elapsed)?elapsed:0)%4800:3300,
  phase=time<1000?0:time<2900?1:2,progress=motion?Math.min(1,Math.max(0,(time-1000)/1900)):1,
  r=equipmentRules({...equipment,[item.slot]:item.id}),base=equipmentRules({...equipment,[item.slot]:item.slot==='head'?'none':'standard'});
 let focus=.25,without=.25;
 for(let i=0;i<Math.floor(progress*60);i++){focus=recoverFocus(focus,2);without=recoverFocus(without,1);}
 let pulled={kind:'fang',small:true,x:100,y:48};for(let i=0;i<Math.floor(progress*45);i++)pulled={...pulled,...aimPull(pulled,{x:0,y:0},0)};
 const values={gravity:r.aimFallGravity,speed:r.dashSpeed/base.dashSpeed,width:r.cutWidth/base.cutWidth,
  horizontal:r.horizontalWidth,armor:r.armorDamage,chain:r.chainGrace-base.chainGrace,
  driveKills:r.overdriveKills,edge:r.edgeMax,hull:r.healthMax,score:r.scoreMultiplier,
  lastHealth:r.lastHullBonus,closeWidth:primaryWidth(0,r).closeWidth,focus,without,pullY:pulled.y};
 return Object.freeze({id:item.id,slot:item.slot,illustration:true,motion,phase,progress,values:Object.freeze(values)});
}
