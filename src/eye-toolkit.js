/** Eye authority helpers. No renderer, RNG, save fields or damage source. */
export const HYPNO=Object.freeze({hold:18,range:140,daze:12,immunity:90});
/** Closed segment against static AABBs, including endpoints and grazing walls. */
export function eyeSight(a,b,geometry=[]){
 for(const r of geometry){
  let lo=0,hi=1;
  for(const [key,size] of [['x','w'],['y','h']]){
   const d=b[key]-a[key],min=r[key],max=min+r[size];
   if(Math.abs(d)<1e-10){if(a[key]<min||a[key]>max){lo=2;break;}}
   else {const t0=(min-a[key])/d,t1=(max-a[key])/d;lo=Math.max(lo,Math.min(t0,t1));hi=Math.min(hi,Math.max(t0,t1));}
  }
  if(lo<=hi)return false;
 }
 return true;
}
export function blazeEntryGrant({fresh=false,active=false,edge=0,max=3}={}){
 return fresh&&active&&edge<max?Math.min(1,max-edge):0;
}
export function createHypnoHold(){
 let age=0,spent=false,target=null,immunity=new WeakMap();
 const release=()=>{age=0;spent=false;};
 return {
  release,
  step({held=false,active=false,dt=0,now=0,origin={x:0,y:0},enemies=[],geometry=[]}={}){
   if(!active||!held){release();return null;}
   age=Math.min(HYPNO.hold,age+Math.max(0,dt));
   if(age<HYPNO.hold||spent)return null;
   const e=[...enemies].filter(e=>e.kind==='fang'&&e.hp>0&&e.mode==='idle'&&!e.pinned&&!e.paper&&!e.tutorialTargetPlayer&&!(immunity.get(e)>now)&&Math.hypot(e.x-origin.x,e.y-origin.y)<=HYPNO.range&&eyeSight(origin,e,geometry))
    .sort((a,b)=>Math.hypot(a.x-origin.x,a.y-origin.y)-Math.hypot(b.x-origin.x,b.y-origin.y)||String(a.id).localeCompare(String(b.id)))[0];
   if(!e)return null;
   spent=true;target=e;immunity.set(e,now+HYPNO.immunity);e.hypnoUntil=now+HYPNO.daze;return e;
  },
  view(now=0){return Object.freeze({kind:'hypno',age,spent,remaining:Math.max(0,(target?.hypnoUntil||0)-now),targetId:target?.id??null});},
  reset(){release();target=null;immunity=new WeakMap();},
 };
}
/** These are deliberately labelled illustrations, not run-state callbacks. */
export function eyeToolkitStudy(id,elapsed=0,motion=true){
 const t=motion?Math.max(0,elapsed)%4200:2900,beat=t<1000?0:t<2500?1:2;
 const data={
  ninja:['CLEAR SIGHT / BASELINE','NO STAT MODIFIER','Gaze and blink only. No hidden accuracy bonus.'],
  visor:['CYAN GLASS / AIM EFFICIENCY','AIM COST −10%','Readout lights only while usable aim is held.'],
  blaze:['FLAME CUTS / ENTER OVERDRIVE','OVERDRIVE → +1 EDGE','Refills after your usual kill reward. Nothing saved at full EDGE.'],
  glitch:['OFFSET X / RECOVERY CIRCUIT','PASSIVE FOCUS +12%','Split conductors close only during actual recovery.'],
  smug:['HALF LID / CHAIN GRACE','COMBO TIME +0.2s','Gold opening indicates real Overdrive, not a new power.'],
  hypno:['SPIRAL / MAKE A FANG HESITATE','HOLD AIM FOR 0.3s','One nearby idle Fang. Walls block. Attacks already started continue.'],
  sniper:['CRIMSON SIGHT / PRECISION','FIRST ARMOR HIT +1 PLATE','Release at 90% power or more. Shot is 10% narrower. Bosses resist.'],
 }[id]||[];
 const pose={blink:1,breathe:0,aiming:beat===1,eyeAbility:{kind:id,active:beat===1,flash:motion&&id==='blaze'&&beat===1?1:0,age:beat===1?18:0,spent:beat===2,remaining:id==='hypno'&&beat===2?12:0},focusRecovering:id==='glitch'&&beat===1,focusLevel:beat===1?.5:1,overdrive:['smug','blaze'].includes(id)&&beat>0,combo:id==='smug'&&beat>0?5:0,eyePower:beat===1?1:0};
 return Object.freeze({kind:id,illustration:true,motion,beat,label:data[0],benefit:data[1],detail:data[2],pose:Object.freeze(pose)});
}
