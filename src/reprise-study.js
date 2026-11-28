/** Isolated samples of the production replay authority and convex-body query.
 * No live run, save, RNG or parallel hit/timer implementation. */
import Matter from 'matter-js';
import {createRepriseStroke} from './reprise-stroke.js';
let scenes=null;
function build(kind){
 const ledger=createRepriseStroke(),geometry=kind===2?[{x:89,y:-30,w:8,h:60}]:[],all=[],enemies=new Map(),rows=[];
 const add=(id,x,y,hp=2)=>{const e={id,kind:'bastion',x,y,hp,r:9};e.body=Matter.Bodies.rectangle(x,y,18,18,{isSensor:true});e.body.plugin.enemy=e;all.push(e);enemies.set(id,e);return e;};
 const old=add('survivor',42,0),late=add('late',116,28,1),safe=add('safe',128,-58,1);
 ledger.admit({shot:1,now:0,point:{x:0,y:0}});let busy=null;
 for(let now=0;now<=19;now+=.5){
  if(now>0&&now<=5)ledger.record({from:{x:(now-.5)*28,y:0},to:{x:now*28,y:0},start:now-.5,end:now,geometry});
  if(now===6){ledger.seal('relaunch');busy=ledger.admit({shot:2,now,point:{x:154,y:-58}});}
  // These are actor poses, not a second attack calculation. Only fire can hit.
  late.y=kind===1?28:Math.max(0,28-Math.max(0,now-5)*10);Matter.Body.setPosition(late.body,late);
  ledger.fire(now,enemies,{geometry,hit:e=>{e.hp--;if(e.hp<=0)enemies.delete(e.id);}});
  rows.push(Object.freeze({now,ledger:ledger.view(now),busy,geometry:Object.freeze(geometry.map(g=>Object.freeze({...g}))),targets:Object.freeze(all.map(e=>Object.freeze({id:e.id,kind:e.kind,x:e.x,y:e.y,r:e.r,hp:e.hp}))),hero:Object.freeze({x:now<5?now*28:154,y:now<5?0:-58})}));
 }
 return Object.freeze(rows);
}
export function repriseStudy(elapsed=0,motion=true){
 scenes??=Object.freeze([0,1,2].map(build));const time=motion?Math.max(0,Number.isFinite(elapsed)?elapsed:0):3900,scene=motion?Math.floor(time/6400)%3:0,t=motion?time%6400:3900,
 now=t<800?0:t<3500?(t-800)/2700*12:12+(t-3500)/2900*7,index=Math.min(38,Math.floor(now*2));
 return Object.freeze({illustration:true,motion,scene,phase:now===0?0:now<12?1:2,sample:scenes[scene][index]});
}
