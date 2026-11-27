import {voidStudy} from './void-study.js';
import {frostStudy} from './frost-study.js';
import {emberStudy} from './ember-burn.js';
/** Read-only lessons for existing dash powers. No attacks, physics steps or save writes. */
import {equipmentRules} from './equipment.js';
import {perkScoreMultiplier} from './part-perks.js';
import {primaryWidth} from './primary-width.js';
import {recoverFocus} from './focus-recovery.js';
export const DASH_STUDY_IDS=Object.freeze(['dash-auto','dash-ink','dash-fire','dash-lightning','dash-ice','dash-water','dash-void','dash-echo']);
export function dashStudy(item,elapsed=0,motion=true,equipment={}){
 if(!DASH_STUDY_IDS.includes(item.id))return null;
 const t=motion?Math.max(0,Number.isFinite(elapsed)?elapsed:0)%4800:3400,phase=t<1000?0:t<2900?1:2,progress=motion?Math.min(1,Math.max(0,(t-1000)/1900)):1,
  r=equipmentRules({...equipment,dash:item.id}),b=equipmentRules({...equipment,dash:'dash-auto'}),withWidth=primaryWidth(0,r),withoutWidth=primaryWidth(0,b),
  conditions={air:true,speed:24,power:1,kind:'bastion'},score=perkScoreMultiplier(r.scorePerks,conditions),baseScore=perkScoreMultiplier(b.scorePerks,conditions);
 let focus=.25,without=.25;for(let i=0;i<Math.floor(progress*60);i++){focus=recoverFocus(focus,r.focusRegen);without=recoverFocus(without,b.focusRegen);}
 return Object.freeze({id:item.id,illustration:true,motion,phase,progress,poseTime:motion?phase===0?100:phase===1?300+progress*210:440:440,
  ...(item.id==='dash-fire'?{ember:emberStudy(progress,phase>0)}:{}),
  ...(item.id==='dash-ice'?{frost:frostStudy(elapsed,motion)}:{}),
  ...(item.id==='dash-void'?{void:voidStudy(elapsed,motion)}:{}),
  width:withWidth,farGain:withWidth.far.total/withoutWidth.far.total,nearGain:withWidth.near.total/withoutWidth.near.total,
  blade:r.bladeExtra-b.bladeExtra,grace:r.chainGrace-b.chainGrace,drain:r.focusDrain/b.focusDrain,
  recovery:Math.round((r.focusRegen-b.focusRegen)*100),focus,without,score,baseScore,scorePoints:Math.round((score-baseScore)*100)});
}
