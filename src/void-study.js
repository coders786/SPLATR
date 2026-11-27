/** Isolated immutable samples of the real field/movement/pulse ledger. No
 * parallel radius/damage timer; no live run, RNG, ownership or save access. */
import {createVoidWell,VOID} from './void-well.js';
let frames=null;
function build(){
 const well=createVoidWell(),a={id:'armor',kind:'crown',hp:2,x:0,y:0,r:16},b={id:'inner',kind:'fang',hp:1,x:54,y:0,r:11},outer={id:'outer',kind:'fang',hp:1,x:-92,y:0,r:11},blocked={id:'blocked',kind:'fang',hp:1,x:0,y:-50,r:11},far={id:'far',kind:'fang',hp:1,x:128,y:0,r:11},boss={id:'boss',kind:'monolith',hp:10,x:0,y:76,r:16},all=[a,b,outer,blocked,far,boss],map=new Map(all.map(e=>[e.id,e])),geometry=[{x:-13,y:-33,w:26,h:6}],rows=[],hits=[];
 well.launch(1);well.contact(a,{primary:true,now:0,enemies:map.values(),geometry});
 for(let i=0;i<=52;i++){
  const now=i/2;well.finish(now,map,(e)=>{e.hp--;hits.push(e.id);if(e.hp<=0)map.delete(e.id);},geometry);
  rows.push(Object.freeze({now,field:well.view(now),hits:Object.freeze([...hits]),targets:Object.freeze(all.map(e=>Object.freeze({...e}))),geometry:Object.freeze(geometry.map(e=>Object.freeze({...e})))}));
  well.move(now,.5,map,{geometry});
 }
 well.clear();return Object.freeze(rows);
}
export function voidStudy(elapsed=0,motion=true){
 frames??=build();const t=motion?Math.max(0,Number.isFinite(elapsed)?elapsed:0)%5400:2700,started=t>=900,
 now=t<900?0:t<3700?(t-900)/2800*18:18+(t-3700)/1700*8,index=Math.min(52,Math.floor(now*2));
 return Object.freeze({illustration:true,motion,started,phase:t<900?0:now<18?1:2,sample:frames[index],radius:VOID.radius,core:VOID.core,travel:VOID.travel,cooldown:VOID.cooldown});
}
