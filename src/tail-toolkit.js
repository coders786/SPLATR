/** Tail powers only. No render timers, particle sources or extra collision route. */
export const SPECTRUM=Object.freeze({kills:3,cooldown:120});
/** Retain 15% of ordinary steering LOSS, never multiply speed by 1.15.
 * Hyper and already stronger-than-normal (>1) bank retention keep ownership. */
export function viperRetention(normal,{speed=0,hyper=false,enabled=true}={}){
 if(!enabled||hyper||!(speed>0)||!Number.isFinite(normal)||normal>=1||normal<0)return normal;
 return normal+(1-normal)*.15;
}
export function createSpectrumSequence(){
 let count=0,until=-Infinity,flashAt=-Infinity,seen=new WeakSet();
 const clear=()=>{count=0;};
 return {
  kill(target,{now=0,continued=true,primary=false,active=true,edge=0,max=3}={}){
   if(!active||!primary||!target||typeof target!=='object'||seen.has(target)||!Number.isFinite(now))return 0;
   seen.add(target);if(!continued)clear();if(now<until){clear();return 0;}
   if(++count<SPECTRUM.kills)return 0;
   clear();until=now+SPECTRUM.cooldown;
   // Completing at cap consumes the sequence. No queued refund on a later shot.
   const grant=edge<max?1:0;if(grant)flashAt=now;return grant;
  },
  breakChain:clear,
  view(now=0){return Object.freeze({kind:'spectrum',count,ready:now>=until,remaining:Math.max(0,until-now),flash:Math.max(0,1-(now-flashAt)/7)});},
  reset(){clear();until=flashAt=-Infinity;seen=new WeakSet();},
 };
}
/** Labelled, slowed illustrative shop states, never substituted for the run. */
export function tailToolkitStudy(id,elapsed=0,motion=true){
 const p=motion?Math.max(0,elapsed)%4200/4200:.7,beat=p<.24?0:p<.55?1:2;
 const titles={ribbon:'FOLDED CLOTH / NO EXTRA FORCE',wings:'FIRST SIDE WALL / +1 EDGE',ghost:'CUT FOR 0.1s LONGER','viper-tails':'KEEP 15% OF STEERING LOSS',anchor:'FLOOR KICK +15% / FANGS 170',thrusters:'EARNED BANK +8% / CAP KEPT',spectrum:'3 PRIMARY KILLS / +1 EDGE'};
 return Object.freeze({kind:id,illustration:true,beat,phase:beat===0?'READY':beat===1?'TRIGGER':'RESULT',motion,
  label:titles[id]||titles.ribbon,
  view:Object.freeze({kind:id,ready:id==='wings'?beat===0:id==='spectrum'?beat!==2:true,count:id==='spectrum'&&beat===1?2:0,remaining:id==='spectrum'&&beat===2?120:0,active:id==='ghost'&&beat>0,flash:motion&&beat===1?1:0,action:beat===1?({thrusters:'jet',anchor:'floor','viper-tails':'retention',wings:'refill'}[id]||null):null,retained:id==='viper-tails'&&beat>0?.0225:0}),
 });
}
export function tailToolkitReadout(view){
 if(!view)return '';
 if(view.kind==='wings')return view.ready?'WINGS / WALL REFILL READY':'WINGS SPENT / FLOOR REARMS';
 if(view.kind==='spectrum')return view.ready?`SPECTRUM ${view.count}/3 CUTS`:`SPECTRUM RECHARGE ${(view.remaining/60).toFixed(1)}s`;
 if(view.kind==='viper-tails'&&view.action==='retention'&&view.flash>0)return `VIPER KEPT ${view.retained.toFixed(1)} SPEED`;
 return '';
}
