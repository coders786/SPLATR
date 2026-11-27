/** Precision Hologram gate. This module owns no world/hazard/player and never
 * mutates them. One accepted needle/player pair is ignored until clear. */
export const NEEDLE_PHASE=Object.freeze({window:4,recharge:120,flash:7});
export function eligiblePhaseNeedle(h){
 return !!h&&h.kind==='needle'&&['prism','crown'].includes(h.source)&&!h.spent&&!h.tutorial&&!h.protected&&!h.boss;
}
/** First contact along the same relative-circle sweep used by hostile needles.
 * Null for misses. Clipping time at this entry (not the end of the frame)
 * makes a crossing of the4-tick deadline deterministic at fractional pace. */
export function needleEntryFraction(h,p,previous,radius){
 const ax=previous.x-h.px,ay=previous.y-h.py,dx=p.x-h.x-ax,dy=p.y-h.y-ay;
 if(![ax,ay,dx,dy,radius].every(Number.isFinite)||radius<0)return null;
 const cc=ax*ax+ay*ay-radius*radius;if(cc<=0)return 0;
 const aa=dx*dx+dy*dy;if(aa<=1e-16)return null;
 const bb=2*(ax*dx+ay*dy),disc=bb*bb-4*aa*cc;if(disc<0)return null;
 const entry=(-bb-Math.sqrt(disc))/(2*aa);return entry>=0&&entry<=1?entry:null;
}
export function createNeedlePhase(){
 let readyAt=0,launchAt=-Infinity,lastPass=-Infinity,suppressed=new WeakSet();
 return {
  launch(now){if(Number.isFinite(now))launchAt=now;},
  /**0 normal resolution,1 existing suppressed pair,2 newly accepted pass.
   * `active` is authority eligibility, not an animation/opacity test. */
  filter(h,touching,{active=false,now=0,previousTime=now,player,previous,radius}={}){
   if(!h||typeof h!=='object')return 0;
   if(suppressed.has(h)){
    const clear=!player||Math.hypot(player.x-h.x,player.y-h.y)>radius;
    if(clear)suppressed.delete(h);
    return touching?1:0;
   }
   if(!active||!touching||!eligiblePhaseNeedle(h)||!player||!previous||!Number.isFinite(now)||!Number.isFinite(previousTime))return 0;
   const fraction=needleEntryFraction(h,player,previous,radius);if(fraction===null)return 0;
   const at=previousTime+Math.max(0,now-previousTime)*fraction;
   if(at<launchAt||at>=launchAt+NEEDLE_PHASE.window||at<readyAt)return 0;
   readyAt=at+NEEDLE_PHASE.recharge;lastPass=at;
   if(Math.hypot(player.x-h.x,player.y-h.y)<=radius)suppressed.add(h);
   return 2;
  },
  view(now){const remaining=Math.max(0,readyAt-now),age=now-lastPass;
   return {kind:'hologram',ready:remaining<=0,remaining,window:remaining<=0&&now>=launchAt&&now<launchAt+NEEDLE_PHASE.window,
    flash:age>=0&&age<NEEDLE_PHASE.flash?1-age/NEEDLE_PHASE.flash:0,spent:remaining>0};
  },
  reset(){readyAt=0;launchAt=lastPass=-Infinity;suppressed=new WeakSet();},
 };
}
/** Labelled shop policy illustration, not a live combat replay. The gate is
 * the same one used before hostile needle damage in the run. */
export function reactiveShellStudy(id,elapsed=0,motion=true){
 const t=motion?Math.max(0,Number.isFinite(elapsed)?elapsed:0)%4400:1850;
 if(id==='hologram'){
  const gate=createNeedlePhase();gate.launch(0);
  const frame=t<750?'READY':t<1500?'WINDOW':t<2700?'PASS':'RECHARGE';
  if(t>=1500)gate.filter({kind:'needle',source:'prism',x:0,y:0,px:0,py:0},true,{active:true,now:2,previousTime:2,player:{x:0,y:0},previous:{x:0,y:0},radius:25.24});
  const now=t<750?10:t<1500?1:t<2700?2.6:Math.min(121,2+(t-2700)*.06),v=gate.view(now);
  return {...v,phase:frame,time:t,needleX:frame==='PASS'?30:frame==='WINDOW'?-100:-170};
 }
 if(id==='iron'){const spent=t>=1700;return {kind:id,ready:!spent,remaining:0,window:false,flash:spent&&t<1850?1-(t-1700)/150:0,spent,phase:spent?'SPENT / RESTORE HEALTH DOES NOT RESET GUARD':'READY / ONE FANG RUSH',time:t};}
 return {kind:'prism',ready:t<1500||t>=3500,remaining:t<1500?0:t>=3500?0:Math.max(1,45-(t-1500)*.0225),window:false,flash:t>=1500&&t<1700?1-(t-1500)/200:0,spent:false,phase:t<1500?'READY / TWO NEEDLES':t<3500?'FIRED /45-TICK COOLDOWN':'READY / TWO NEEDLES',time:t};
}

/** Short true-state HUD copy; no timer or readiness is owned by the HUD. */
export function reactiveShellReadout(view){
 if(!view)return '';
 if(view.kind==='hologram')return view.window?'PHASE OPEN / ONE NEEDLE':view.ready?'PHASE READY / DASH TO DODGE':`PHASE RECHARGE ${(view.remaining/60).toFixed(1)}s`;
 if(view.kind==='iron')return view.spent?'GUARD SPENT / THIS RUN':'GUARD READY / FANG RUSH';
 if(view.kind==='prism')return view.ready?'NEEDLES READY / SIDE WALL':`NEEDLES RELOAD ${(view.remaining/60).toFixed(1)}s`;
 return '';
}
