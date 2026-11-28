/** Cached immutable production burst+physics and conduction receipts. These
 * isolated examples never access a live run, ownership, saves or RNG. */
import {createPhysics,launch,stepPhysics,setPlayerVelocity,destroyPhysics} from './physics.js';
import {createVoltBurst,createVoltConduction} from './volt-lance.js';
let tracks=null;
function flight(enabled){
 const world=createPhysics({spawn:{x:0,y:0},solids:[]}),burst=createVoltBurst(),rows=[];
 launch(world,{x:30,y:0});if(enabled){const v=burst.launch(world.player.velocity);setPlayerVelocity(world,v.x,v.y);world.playerBurstAllowance=burst.view().amount;}
 for(let i=0;i<=12;i++){
  rows.push(Object.freeze({x:world.player.position.x,y:world.player.position.y,speed:world.player.speed,burst:burst.view(world.clock)}));
  stepPhysics(world,dt=>{if(enabled){const v=burst.advance(world.player.velocity,world.clock,dt);if(Math.hypot(v.x-world.player.velocity.x,v.y-world.player.velocity.y)>1e-8)setPlayerVelocity(world,v.x,v.y);world.playerBurstAllowance=burst.view(world.clock).amount;}},1,enabled?segment=>{burst.observe(world.player.velocity,segment);world.playerBurstAllowance=burst.view(world.clock).amount;}:null);
 }
 destroyPhysics(world);return Object.freeze(rows);
}
function scene(coil,blocked){
 const ledger=createVoltConduction(),center={id:'direct',kind:'bastion',hp:2,x:0,y:0},near={id:'near',kind:'fang',hp:1,x:68,y:-34},far={id:'coil',kind:'bastion',hp:2,x:140,y:0},wall={id:'blocked',kind:'fang',hp:1,x:48,y:48},outside={id:'outside',kind:'fang',hp:1,x:194,y:-33},actors=[center,near,far,wall,outside],map=new Map(actors.map(e=>[e.id,e])),geometry=[{x:18,y:25,w:80,h:7},...(blocked?[{x:25,y:-35,w:7,h:35}]:[])],rows=[];
 ledger.launch(1);
 for(let i=0;i<=12;i++){
  if(i===5)ledger.contact(center,{primary:true,now:i,enemies:map,geometry,coil,hit:e=>{e.hp--;if(e.hp<=0)map.delete(e.id);}});
  rows.push(Object.freeze({now:i,ledger:ledger.view(i),targets:Object.freeze(actors.map(e=>Object.freeze({...e}))),geometry:Object.freeze(geometry.map(e=>Object.freeze({...e})))}));
 }
 return Object.freeze(rows);
}
export function voltStudy(elapsed=0,motion=true){
 tracks??=Object.freeze({base:flight(false),volt:flight(true),scenes:Object.freeze([scene(false,false),scene(false,true),scene(true,false)])});
 const t=motion?Math.max(0,Number.isFinite(elapsed)?elapsed:0):3300,section=motion?Math.floor(t/5800)%3:2,age=motion?t%5800:3300,
 now=age<800?0:age<3000?(age-800)/2200*5:5+(age-3000)/2800*7,index=Math.min(12,Math.floor(now));
 return Object.freeze({illustration:true,motion,scene:section,phase:now===0?0:now<5?1:2,sample:tracks.scenes[section][index],baseline:tracks.base[index],flight:tracks.volt[index],flightEnd:Object.freeze({base:tracks.base[4].x,volt:tracks.volt[4].x})});
}
