/** C63 cold authority. Local, finite and target-object keyed; never damage,
 * projectiles, player physics, saves or renderer-owned clocks. */
import {eyeSight} from './eye-toolkit.js';
export const FROST=Object.freeze({range:60,neighbors:1,freeze:18,slow:24,factor:.7,immunity:90,maxTargets:32});
const kinds=new Set(['fang','pulse','prism','fork','bastion','rift','well','crown']);
export const coldEligible=e=>!!e&&kinds.has(e.kind)&&!e.pinned&&!e.paper&&!e.tutorialProtected&&!e.tutorialTargetPlayer;
/** World interval integration makes a half-step across thaw honest. Status
 * affects a body's own AI clock only for light Fangs, never emitted hazards.
 * Other movement constraints compose by strongest choice, not multiplication. */
export function coldTiming(e,now,dt,otherScale=1){
 const span=Number.isFinite(dt)?Math.max(0,dt):0,s=e?.frostCold,
  overlap=s?.phase==='active'?Math.max(0,Math.min(now+span,s.until)-Math.max(now,s.born)):0,
  frozen=s?.kind==='freeze'?overlap:0,scale=Math.max(0,Math.min(1,otherScale)),
  constrained=s?.kind==='freeze'?0:FROST.factor,
  motion=span*scale-overlap*(scale-Math.min(scale,constrained));
 return {ai:span-frozen,motion,scale:span?motion/span:scale};
}
export function createFrostControl(){
 const targets=new Map();let shot=-1,spent=false;
 const remove=e=>{targets.delete(e);delete e.frostCold;};
 const available=(e,now)=>coldEligible(e)&&!(targets.get(e)?.immunityUntil>now)&&e.hp>0;
 return {
  launch(id){shot=id;spent=false;},
  contact(center,{primary=false,now=0,enemies=[],geometry=[]}={}){
   if(shot<0||!primary||spent||!coldEligible(center)||!Number.isFinite(now))return [];
   spent=true;
   const neighbor=[...enemies].filter(e=>e!==center&&available(e,now)&&Math.hypot(e.x-center.x,e.y-center.y)<=FROST.range&&eyeSight(center,e,geometry))
    .sort((a,b)=>Math.hypot(a.x-center.x,a.y-center.y)-Math.hypot(b.x-center.x,b.y-center.y)||String(a.id).localeCompare(String(b.id)))[0];
   const accepted=[];
   for(const e of [center,neighbor]){
    if(!e||!available(e,now)||(!targets.has(e)&&targets.size>=FROST.maxTargets))continue;
    const kind=e.kind==='fang'?'freeze':'slow',until=now+(kind==='freeze'?FROST.freeze:FROST.slow),
     status={kind,phase:'active',born:now,until,immunityUntil:until+FROST.immunity,thawedAt:null,shot};
    targets.set(e,status);e.frostCold=status;accepted.push(e);
   }
   return accepted;
  },
  advance(now,enemies,onThaw=()=>{}){
   for(const [e,s]of targets){
    if(enemies.get(e.id)!==e||e.hp<=0||!coldEligible(e)){remove(e);continue;}
    if(s.phase==='active'&&now>=s.until){
     // Replace the payload so snapshots cannot acquire a fabricated active tail.
     const next={...s,phase:'immune',thawedAt:s.until};targets.set(e,next);e.frostCold=next;onThaw(e,next);
    }
    if(now>=s.immunityUntil)remove(e);
   }
  },
  clear(){for(const e of targets.keys())remove(e);shot=-1;spent=false;},
  view(){return Object.freeze({shot,spent,targets:targets.size,active:[...targets.values()].filter(s=>s.phase==='active').length});},
 };
}
