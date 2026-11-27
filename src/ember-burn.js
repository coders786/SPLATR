/** Bounded target-identity burn ledger. No damage, physics, renderer or saves.
 * Each accepted application has exactly two absolute world-time deadlines.
 * Reapplication while burning does not stack, refresh or move a deadline. */
import {eyeSight} from './eye-toolkit.js';
export const EMBER=Object.freeze({range:56,neighbors:2,first:18,second:36,width:.9,maxTargets:24});
const kinds=new Set(['fang','prism','fork','bastion','crown','rift','pulse','well']);
export const burnEligible=e=>!!e&&kinds.has(e.kind)&&!e.paper&&!e.tutorialTargetPlayer&&!e.tutorialProtected;
export function createEmberBurn(){
 const active=new Map();let shot=-1,spent=false;
 function remove(target){active.delete(target);delete target.emberBurn;}
 return {
  launch(id){shot=id;spent=false;},
  ignite(center,{primary=false,now=0,enemies=[],geometry=[],makeSource=()=>null}={}){
   if(shot<0||!primary||spent||!burnEligible(center))return [];
   spent=true;
   const nearby=[...enemies].filter(e=>e!==center&&e.hp>0&&burnEligible(e)&&Math.hypot(e.x-center.x,e.y-center.y)<=EMBER.range&&eyeSight(center,e,geometry))
    .sort((a,b)=>Math.hypot(a.x-center.x,a.y-center.y)-Math.hypot(b.x-center.x,b.y-center.y)||String(a.id).localeCompare(String(b.id))).slice(0,EMBER.neighbors);
   const accepted=[];
   for(const target of [center,...nearby]){
    if(target.hp<=0||active.has(target)||active.size>=EMBER.maxTargets)continue;
    const status={target,shot,born:now,next:0,source:makeSource(target,shot),lastHit:-Infinity};
    active.set(target,status);target.emberBurn={born:now,expires:now+EMBER.second,next:now+EMBER.first,lastHit:-Infinity};accepted.push(target);
   }
   return accepted;
  },
  step(now,enemies,hit){
   for(const [target,status] of active){
    if(enemies.get(target.id)!==target||target.hp<=0||!burnEligible(target)){remove(target);continue;}
    while(status.next<2&&now>=status.born+[EMBER.first,EMBER.second][status.next]){
     // Spend the scheduled unit before entering any external death callback.
     const unit={shot:status.shot,index:status.next++,source:status.source,target};
     status.lastHit=now;target.emberBurn.lastHit=now;hit(target,unit);
     if(enemies.get(target.id)!==target||target.hp<=0)break;
    }
    if(status.next===2||enemies.get(target.id)!==target||target.hp<=0)remove(target);
    else target.emberBurn.next=status.born+[EMBER.first,EMBER.second][status.next];
   }
  },
  clear(){for(const target of active.keys())remove(target);shot=-1;spent=false;},
  view(){return Object.freeze({shot,spent,targets:active.size});},
 };
}

/** Deterministic lesson: same selection/deadlines as play, fresh local actors.
 * Time is slowed for inspection; this never writes to a real run or save. */
export function emberStudy(progress=0,started=true){
 const center={id:'armor',kind:'crown',hp:3,x:0,y:0},nearA={id:'near-a',kind:'fang',hp:1,x:30,y:-20},nearB={id:'near-b',kind:'fang',hp:1,x:30,y:20},blocked={id:'blocked',kind:'fang',hp:2,x:-30,y:0},boss={id:'boss',kind:'monolith',hp:10,x:0,y:40},far={id:'far',kind:'fang',hp:2,x:70,y:0},
  enemies=new Map([center,nearA,nearB,blocked,boss,far].map(e=>[e.id,e])),ledger=createEmberBurn(),hits=[],now=Math.max(0,Math.min(1,progress))*42;
 ledger.launch(1);let accepted=[];
 if(started){center.hp--;accepted=ledger.ignite(center,{primary:true,now:0,enemies:enemies.values(),geometry:[{x:-18,y:-9,w:4,h:18}]});ledger.step(now,enemies,(target,unit)=>{target.hp--;hits.push({id:target.id,index:unit.index});if(target.hp<=0)enemies.delete(target.id);});}
 const result={now,started,accepted:Object.freeze(accepted.map(e=>e.id)),hits:Object.freeze(hits.map(e=>Object.freeze(e))),targets:Object.freeze([center,nearA,nearB,blocked,boss,far].map(e=>Object.freeze({id:e.id,hp:e.hp,burning:!!e.emberBurn,lastHit:e.emberBurn?.lastHit??-Infinity}))),first:EMBER.first,second:EMBER.second,width:EMBER.width};
 ledger.clear();return Object.freeze(result);
}
