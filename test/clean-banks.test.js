import test from 'node:test';
import assert from 'node:assert/strict';
import {createCleanBanks,stepCleanBanks,steerBank} from '../src/clean-banks.js';
import {createRun} from '../src/run.js';
import {placePlayer,setPlayerVelocity} from '../src/physics.js';
const arena={x:0,y:0,w:1800,h:1550};
const left={side:'left',x:23,y:700,nx:1,ny:0,incomingX:-36,incomingY:0,outgoingX:34,outgoingY:-4};
const right={...left,side:'right',x:1777,nx:-1,incomingX:36,outgoingX:-34};
test('clean arrival is one event, needs launch, speed, closing angle and retained momentum',()=>{
 const initial=createCleanBanks();assert.equal(stepCleanBanks(initial,{contact:left,arena}).event,null);
 const a=stepCleanBanks(initial,{shot:1,contact:left,arena});assert.ok(a.event);assert.equal(a.state.total,1);assert.equal(initial.total,0);
 assert.equal(stepCleanBanks(initial,{shot:1,contact:{...left,incomingX:-8},arena}).event,null);
 assert.equal(stepCleanBanks(initial,{shot:1,contact:{...left,outgoingX:1,outgoingY:0},arena}).event,null);
 assert.equal(stepCleanBanks(initial,{shot:1,contact:{...left,incomingX:-3,incomingY:40},arena}).event,null);
});
test('repeated contacts, corner jitter, no separation and insufficient traversal cannot farm',()=>{
 let p=stepCleanBanks(createCleanBanks(),{shot:1,contact:left,arena}).state;
 for(let i=0;i<400;i++)p=stepCleanBanks(p,{shot:1,speed:40,distance:2,clearance:23,contact:left,arena}).state;
 assert.equal(p.total,1);
 assert.equal(stepCleanBanks(createCleanBanks(),{shot:1,contact:{...left,y:35},arena}).event,null);
 for(let i=0;i<30;i++)p=stepCleanBanks(p,{speed:40,distance:0,clearance:400}).state;
 assert.equal(stepCleanBanks(p,{speed:40,distance:40,clearance:400,contact:right,arena}).event,null,'jitter before separating cannot bank traversal credit');
 for(let i=0;i<35;i++)p=stepCleanBanks(p,{speed:40,distance:40,clearance:400}).state;
 const b=stepCleanBanks(p,{speed:40,distance:40,clearance:400,contact:right,arena});assert.ok(b.event);assert.equal(b.state.total,2);
 let fresh=stepCleanBanks(createCleanBanks(),{shot:1,contact:left,arena}).state;
 for(let i=0;i<30;i++)fresh=stepCleanBanks(fresh,{speed:40,distance:0,clearance:400}).state;
 assert.equal(stepCleanBanks(fresh,{contact:right,arena}).event,null,'teleport without measured traversal is not a route');
});
test('alternate route builds chain, slow/floor resets chain and floor requires new launch',()=>{
 let p=stepCleanBanks(createCleanBanks(),{shot:1,contact:left,arena}).state;
 for(let i=0;i<35;i++)p=stepCleanBanks(p,{speed:36,distance:36,clearance:200}).state;
 p=stepCleanBanks(p,{speed:36,contact:right,arena}).state;assert.equal(p.chain,2);assert.equal(p.best,2);
 p=stepCleanBanks(p,{contact:{side:'bottom'}}).state;assert.equal(p.chain,0);assert.equal(p.armed,false);
 for(let i=0;i<35;i++)p=stepCleanBanks(p,{speed:36,distance:36,clearance:200}).state;
 assert.equal(stepCleanBanks(p,{shot:1,contact:left,arena}).event,null);
 assert.ok(stepCleanBanks(p,{shot:2,contact:left,arena}).event);
});
test('steering preserves speed, clamps inward cone and rejects outward or invalid aim',()=>{
 for(const normal of [{x:1,y:0},{x:-1,y:0},{x:0,y:1}])for(const aim of [{x:1,y:-8},{x:-1,y:8},{x:0,y:1},{x:1,y:0}]){
 const v={x:normal.x*34,y:normal.y*34},out=steerBank(v,normal,aim);assert.ok(Math.abs(Math.hypot(out.x,out.y)-34)<1e-9);assert.ok(out.x*normal.x+out.y*normal.y>=17-1e-9);
 }
 const v={x:30,y:-4};assert.deepEqual(steerBank(v,{x:1,y:0},{x:-1,y:0}),v);assert.deepEqual(steerBank(v,{x:1,y:0},null),v);
});
test('inactive state freezes and slow-time cooldown uses simulation time',()=>{
 const a=stepCleanBanks(createCleanBanks(),{shot:1,contact:left,arena}).state;
 assert.deepEqual(stepCleanBanks(a,{shot:9,speed:99,distance:99,contact:right,active:false}).state,a);
 let p=a;for(let i=0;i<100;i++)p=stepCleanBanks(p,{dt:.1,speed:40,distance:4,clearance:200}).state;
 assert.equal(stepCleanBanks(p,{contact:right,arena}).event,null,'ten simulation ticks does not expire 24-tick cooldown');
});
function wallRun(steer=false){
 const events=[],r=createRun(41,(type,d)=>events.push({type,...d}),{waveMode:true});
 r.state.invul=99999;r.state.wave.entry=0;placePlayer(r.world,{x:820,y:-450});r.dash({x:42,y:0,power:1});
 if(steer){r.setAim({x:-1,y:-.6});r.focus(true);}
 for(let i=0;i<90&&!events.some(e=>e.type==='cleanBank');i++)r.tick();return {r,events};
}
test('actual physics bank captures incoming vector and steer changes exit without reversing aim',()=>{
 for(const steered of [false,true]){const {r,events}=wallRun(steered);try{
 const bank=events.find(e=>e.type==='cleanBank');assert.ok(bank,JSON.stringify(events.map(e=>e.type)));assert.equal(bank.side,'right');assert.equal(bank.steered,steered);assert.equal(r.state.wave.cleanBanks.total,1);assert.ok(r.world.player.velocity.x<0);
 if(steered)assert.ok(r.world.player.velocity.y<-8);else assert.equal(r.state.wave.pace.status,'holding','clamp tick is a verified moving bank, not a false slowdown');
 for(let i=0;i<10;i++)r.tick();assert.equal(r.state.wave.cleanBanks.total,1);
 }finally{r.dispose()}}
});
