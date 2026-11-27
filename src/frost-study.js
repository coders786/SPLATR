/** Cached read-only lesson. Real combat.move/attacks and the production cold
 * ledger run in isolated worlds once, never on a live run or per render frame. */
import {createFrostControl,FROST} from './frost-control.js';
import {createPhysics,destroyPhysics,placePlayer,stopPlayer} from './physics.js';
import {createCombat} from './slasher.js';
let cache=null;
function track(chilled){
 const world=createPhysics({seed:77,spawn:{x:-350,y:-400},pad:{x:-500,y:200,w:300,h:20}}),combat=createCombat(world),cold=createFrostControl(),rows=[];
 try{
  placePlayer(world,{x:-350,y:-400});stopPlayer(world);
  const heavy=combat.add({id:'armor',kind:'bastion',x:-100,y:-400,delay:999999,hp:2}),fang=combat.add({id:'fang',kind:'fang',x:-70,y:-440,delay:999999}),
   blocked=combat.add({id:'blocked',kind:'fang',x:-150,y:-400,delay:999999}),far=combat.add({id:'far',kind:'fang',x:0,y:-400,delay:999999}),boss=combat.add({id:'boss',kind:'monolith',x:400,y:-1000,pinned:true});
  heavy.hp--;Object.assign(fang,{mode:'tell',clock:30,span:66,aim:Math.PI,lungeSpeed:10.8});
  const geometry=[{x:-132,y:-410,w:4,h:20}];cold.launch(1);const accepted=chilled?cold.contact(heavy,{primary:true,now:0,enemies:combat.enemies.values(),geometry}).map(e=>e.id):[];
  const needle={kind:'needle',source:'prism',sourceId:'already-fired',x:-100,y:-500,px:-100,py:-500,vx:-3,vy:0,age:0,life:200};combat.hazards.push(needle);
  for(let i=0;i<=240;i++){
   const now=i/2;world.clock=now;cold.advance(now,combat.enemies);
   const copy=e=>Object.freeze({id:e.id,x:e.x,y:e.y,angle:e.angle,kind:e.kind,hp:e.hp,clock:e.clock,span:e.span,mode:e.mode,status:e.frostCold?Object.freeze({...e.frostCold}):null});
   rows.push(Object.freeze({now,accepted:Object.freeze(accepted),heavy:copy(heavy),fang:copy(fang),blocked:copy(blocked),far:copy(far),boss:copy(boss),needleX:needle.x}));
   combat.move(.5,1);combat.attacks(.5,()=>{}, {filterPlayerHit:()=>false});
  }
  return Object.freeze(rows);
 }finally{cold.clear();combat.dispose();destroyPhysics(world);}
}
export function frostStudy(elapsed=0,motion=true){
 if(!cache)cache=Object.freeze({withCold:track(true),without:track(false)});
 const t=motion?Math.max(0,Number.isFinite(elapsed)?elapsed:0)%4800:2200,
  now=t<1000?0:t<2900?(t-1000)/1900*18:18+(t-2900)/1900*102,index=Math.min(240,Math.floor(now*2)),
  sample=cache.withCold[index],baseline=cache.without[index];
 return Object.freeze({illustration:true,motion,started:t>=1000,phase:t<1000?0:now<18?1:2,now:sample.now,sample,baseline,
  range:FROST.range,freeze:FROST.freeze,slow:FROST.slow,immunity:FROST.immunity,factor:FROST.factor,
  travel:Object.freeze({cold:Math.hypot(sample.heavy.x+100,sample.heavy.y+400),baseline:Math.hypot(baseline.heavy.x+100,baseline.heavy.y+400)}),
  needleTravel:Math.abs(sample.needleX+100)});
}
