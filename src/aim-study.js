/** Read-only, deterministic shop examples. They share the real prediction,
 * radar projection, resource rules and precision policy; never step a run. */
import {swordProfile} from './swords.js';
import {equipmentRules} from './equipment.js';
import {recoverFocus} from './focus-recovery.js';
import {precisionShot,SNIPER} from './primary-contact.js';
import {aimVisuals,legacy_radar,radarRange,trajectorySamples,sensorTier} from './art/splatr-art-engine.js';
export const AIM_STUDY_IDS=Object.freeze(['sniper','pointer-reticle','pointer-diamond','pointer-orbit','pointer-cross','radar-base','radar-1','radar-2','radar-3','trajectory-base','trajectory-1','trajectory-2','trajectory-3']);
const start=Object.freeze({x:0,y:0}),velocity=Object.freeze({x:22,y:-14}),wall=Object.freeze({x:1900,y:-2000,w:40,h:5000});
const flight=aimVisuals.arcPath(start,velocity,{geometry:[wall]});
const freezePoints=points=>Object.freeze(points.map(p=>Object.freeze({x:p.x,y:p.y})));
const path=freezePoints([start,...flight.points]);
export function aimStudy(item,elapsed=0,motion=true,equipment={}){
 if(!AIM_STUDY_IDS.includes(item.id))return null;
 const t=motion?Math.max(0,Number.isFinite(elapsed)?elapsed:0)%4800:3400,phase=t<1000?0:t<2900?1:2,progress=motion?Math.min(1,Math.max(0,(t-1000)/1900)):1,
  eq={...equipment,[item.slot]:item.id},rules=equipmentRules(eq),base=equipmentRules({...eq,[item.slot]:item.slot==='pointer'?'pointer-reticle':item.slot==='eyes'?'ninja':`${item.slot}-base`});
 let focus=.25,without=.25;for(let i=0;i<Math.floor(progress*60);i++){focus=recoverFocus(focus,rules.focusRegen);without=recoverFocus(without,base.focusRegen);}
 const range=radarRange(item.id),tier=sensorTier(item.id,item.slot),radar=legacy_radar.localRadar({x:-100,y:-100,w:200,h:200},{x:0,y:0},{x:0,y:0,w:220,h:150},[{id:'near',kind:'fang',x:80,y:-40},{id:'middle',kind:'crown',x:260,y:-180},{id:'far',kind:'prism',x:410,y:-300}],null,{range}),
  count=Math.min(path.length,trajectorySamples(item.id)),visible=freezePoints(path.slice(0,count)),impact=tier>=2&&count===path.length&&flight.end?Object.freeze({...flight.end}):null;
 return Object.freeze({id:item.id,slot:item.slot,illustration:true,motion,phase,progress,tier,range,
  radar:Object.freeze({player:Object.freeze(radar.player),viewport:Object.freeze(radar.viewport),blips:Object.freeze(radar.blips.map(p=>Object.freeze({...p})))}),
  armor:rules.armorDamage+swordProfile(eq).armor,recoveryPoints:Math.round((rules.focusRegen-base.focusRegen)*100),focus,without,drain:rules.focusDrain/base.focusDrain,blade:rules.bladeExtra-base.bladeExtra,
  path,visible,impact,speed:Math.hypot(velocity.x,velocity.y),angle:Math.atan2(velocity.y,velocity.x)*180/Math.PI,
  power:phase===0?.6:SNIPER.power,precision:Object.freeze(precisionShot(item.id,SNIPER.power)),narrow:SNIPER.width});
}
