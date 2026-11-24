/** Pure five-wave skill contract. No movement, rendering, clock or store writes. */
export const BREAKTHROUGH=Object.freeze({surgeTicks:90,rechargeTicks:90,surgeFactor:1.18,sonicFactor:1.08,ceiling:58});
export function createBreakthrough(cycle=0){return {cycle,paceReady:false,surgeSpent:false,surgeTicks:0,recharge:0,sonic:false,banks:0,shattered:false};}
export function stepBreakthrough(previous,{dt=1,active=true,paceHeld=false,atPace=false,holding=false}={}){
 if(!active)return previous;
 const t=Number.isFinite(dt)?Math.max(0,Math.min(1,dt)):0;if(!t)return previous;
 const p={...previous,paceReady:previous.paceReady||paceHeld,surgeTicks:Math.max(0,previous.surgeTicks-t)};
 if(p.paceReady&&p.surgeSpent&&!p.sonic&&p.surgeTicks===0){p.recharge=atPace&&!holding?p.recharge+t:Math.max(0,p.recharge-t*.25);if(p.recharge>=BREAKTHROUGH.rechargeTicks){p.surgeSpent=false;p.recharge=0;}}
 return p;
}
export function launchSurge(previous){
 if(!previous?.paceReady||previous.surgeSpent||previous.sonic)return {state:previous,boost:false};
 return {state:{...previous,surgeSpent:true,surgeTicks:BREAKTHROUGH.surgeTicks,recharge:0},boost:true};
}
export function bankBreakthrough(previous){
 const sonic=!previous.sonic&&previous.surgeTicks>0;
 return {state:{...previous,banks:previous.banks+1,sonic:previous.sonic||sonic},sonic};
}
/**
 * CHUNK 1: the same five states, named the way the HUD names the meter they
 * belong to. `HOLD PACE` / `PACE READY` were a second vocabulary for RUSH in a
 * second corner of the screen; there is one meter and one word now.
 */
export function breakthroughLabel(p){return p?.sonic?'RUSH HELD':p?.surgeTicks>0?'RUSH HELD · BANK NOW':p?.paceReady&&!p.surgeSpent?'RUSH READY · NEXT LAUNCH':p?.paceReady?'HOLD PACE TO RECHARGE':'BUILD RUSH';}
export function placeBreach(arena,player,view){
 const v=view||{x:player.x-320,y:player.y-220,w:640,h:440};
 const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
 let x0=Math.max(arena.x+110,v.x+70),x1=Math.min(arena.x+arena.w-110,v.x+v.w-70),y0=Math.max(arena.y+110,v.y+(v.height?Math.min(v.h*.5,(v.height<500?140:310)/(v.scale||1)):80)),y1=Math.min(arena.y+arena.h-110,v.y+v.h-70);
 if(x0>x1){x0=arena.x+110;x1=arena.x+arena.w-110;}if(y0>y1){y0=arena.y+110;y1=arena.y+arena.h-110;}
 const candidates=[{x:player.x+230,y:player.y-70},{x:player.x-230,y:player.y-70},{x:player.x,y:player.y-210}].map(q=>({x:clamp(q.x,x0,x1),y:clamp(q.y,y0,y1)}));
 return candidates.sort((a,b)=>Math.hypot(b.x-player.x,b.y-player.y)-Math.hypot(a.x-player.x,a.y-player.y))[0];
}
export function crossesBreach(from,to,breach){
 if(![from.x,from.y,to.x,to.y,breach.x,breach.y].every(Number.isFinite))return false;
 const dx=to.x-from.x,dy=to.y-from.y,length=dx*dx+dy*dy;if(length<1)return false;
 const t=Math.max(0,Math.min(1,((breach.x-from.x)*dx+(breach.y-from.y)*dy)/length));
 return Math.hypot(from.x+t*dx-breach.x,from.y+t*dy-breach.y)<=(breach.r||42);
}

/** One next action for the dimension finish. Decorative field strain is NOT charge. */
export function breachCue(state={}){
 const b=state.breakthrough||{},p=state.wave?.pace||{};
 const result=(stage,title,detail,progress,step)=>Object.freeze({stage,title,detail,progress:Math.max(0,Math.min(1,progress||0)),step});
 if(state.wave?.breach?.ready||b.sonic)return result('cross',state.held?'RELEASE AIM':'DASH THROUGH','Fast dash through the seam',1,2);
 if(b.surgeTicks>0)return result('bank','HIT A WALL','Bank before the window closes',b.surgeTicks/BREAKTHROUGH.surgeTicks,1);
 if(b.paceReady&&!b.surgeSpent)return result('launch','DASH TO A WALL','Your next dash opens the bank window',1,1);
 if(b.paceReady)return result('recharge','BUILD SPEED','Keep moving to retry the bank',b.recharge/BREAKTHROUGH.rechargeTicks,0);
 return result('pace','BUILD SPEED','Keep speed above the marker',(p.progress||0)/180,0);
}
