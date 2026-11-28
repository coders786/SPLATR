import test from 'node:test';
import assert from 'node:assert/strict';
import {createCanvas} from '@napi-rs/canvas';
import {sideRebound} from '../src/rebound-response.js';
import {createReboundMorph,createArtRenderer} from '../src/art/splatr-art-engine.js';
import {createRun} from '../src/run.js';
import {placePlayer,setPlayerVelocity,stepPhysics} from '../src/physics.js';
const bank={x:100,y:180,nx:1,ny:0,incomingX:-36,incomingY:18,outgoingX:30.6,outgoingY:13.28};
const rig=()=>({state:{phase:'playing',shots:0,held:false,equipment:{dash:'dash-fire'}},world:{clock:0,player:{position:{x:180,y:180},velocity:{x:30,y:4}}}});
const advance=(fx,r,n)=>{for(let i=0;i<n;i++){r.world.clock++;fx.tick(r,true);}};
function image(fx,motion=true){const cv=createCanvas(400,360),c=cv.getContext('2d');fx.draw(c,{hero:{x:180,y:180},scale:1,motion});return cv.toBuffer('image/png');}
test('side rebounds retain 85% normal speed and downward tangent instead of rewriting every fall upward',()=>{
 for(const direction of [-1,1])for(const y of [-40,0,12,30,80]){const v={x:-direction*36,y},out=sideRebound(v,direction);assert.equal(out.x,36*.85*direction);if(y>=12)assert.ok(out.y>0);else assert.ok(out.y<=-4);assert.ok(Math.hypot(out.x,out.y)<=Math.hypot(v.x,v.y)+1e-9);}
});
test('shattered restitution stays finite/capped; ordinary flat arrivals retain the lift',()=>{
 const flat=sideRebound({x:-20,y:0},1);assert.equal(flat.x,17);assert.equal(flat.y,-4);
 const fast=sideRebound({x:300,y:300},-1,{shattered:true});assert.ok(fast.x<0&&fast.y>0);assert.ok(Math.hypot(fast.x,fast.y)<=320+1e-9);
});
test('same-wall re-entry during debounce reflects without publishing another reward contact',()=>{
 const r=createRun(41,()=>{},{waveMode:true});try{const w=r.world,a=w.arena;placePlayer(w,{x:a.x+24,y:a.y+500});setPlayerVelocity(w,-30,16);w.wallIgnore={left:w.clock+20,right:0};stepPhysics(w);assert.ok(w.player.velocity.x>0,'cannot pin an outward launch against its ignored rail');assert.ok(w.player.velocity.y>0,'fall tangent survives');assert.equal(w.struck,null);assert.equal(w.player.angle,0);}finally{r.dispose();}
});
test('real run bank publishes measured entry and exit vectors for the morph, not invented directions',()=>{
 const events=[],r=createRun(41,(type,d)=>events.push({type,...d}),{waveMode:true});try{r.state.invul=99999;r.state.wave.entry=0;placePlayer(r.world,{x:1450,y:-450});r.dash({x:42,y:10,power:1});for(let i=0;i<100&&!events.some(e=>e.type==='bank');i++)r.tick();const b=events.find(e=>e.type==='bank');assert.ok(b);for(const key of ['incomingX','incomingY','outgoingX','outgoingY'])assert.ok(Number.isFinite(b[key]),key);assert.ok(b.incomingX>0&&b.outgoingX<0);}finally{r.dispose();}
});
test('morph admission rejects fake/grazing contacts and copies valid contact payloads',()=>{
 const fx=createReboundMorph(),r=rig();fx.tick(r);fx.event('cleanBank',bank);fx.event('bank',{...bank,incomingX:-2});fx.event('bank',{...bank,nx:NaN});assert.equal(fx.snapshot().queued,0);
 const data={...bank};fx.event('bank',data);data.x=999;advance(fx,r,1);assert.equal(fx.snapshot().banks[0].x,100);assert.equal(fx.snapshot().banks[0].element,'fire');
});
test('compression blends to spindle, stays bounded/upright, and expires in simulation time',()=>{
 const fx=createReboundMorph(),r=rig();fx.tick(r);fx.event('bank',bank);advance(fx,r,1);const a=image(fx),snapshot=fx.snapshot();assert.equal(snapshot.age,0);assert.ok(snapshot.body.x<1&&snapshot.body.y>1);
 for(let i=0;i<8;i++){advance(fx,r,1);const b=fx.bodyScale();assert.ok(b.x>=.85&&b.x<=1.15&&b.y>=.85&&b.y<=1.15);}
 assert.notDeepEqual(a,image(fx));advance(fx,r,60);assert.equal(fx.snapshot().banks.length,0);assert.deepEqual(fx.bodyScale(),{x:1,y:1});assert.equal(fx.snapshot().flight,0);
});
test('morph draw is idempotent/read-only and restores canvas state',()=>{
 const fx=createReboundMorph(),r=rig();fx.tick(r);fx.event('bank',bank);advance(fx,r,9);const snapshot=JSON.stringify(fx.snapshot()),game=JSON.stringify(r);assert.deepEqual(image(fx),image(fx));assert.equal(JSON.stringify(fx.snapshot()),snapshot);assert.equal(JSON.stringify(r),game);
 const c=createCanvas(400,360).getContext('2d');c.translate(3,5);c.globalAlpha=.7;c.lineWidth=7;const before=[c.getTransform().toString(),c.globalAlpha,c.lineWidth,c.strokeStyle];fx.draw(c,{hero:{x:180,y:180}});assert.deepEqual([c.getTransform().toString(),c.globalAlpha,c.lineWidth,c.strokeStyle],before);
});
test('fixed six-contact budget, reduced motion, pause, new-run and reset cleanup',()=>{
 const fx=createReboundMorph(),r=rig();fx.tick(r);for(let i=0;i<100;i++)fx.event('bank',{...bank,y:100+i});assert.equal(fx.snapshot().queued,6);advance(fx,r,1);assert.equal(fx.snapshot().banks.length,6);
 const still=fx.snapshot();fx.tick(r,true);assert.deepEqual(fx.snapshot(),still,'drawing or a stopped physics clock does not age morph');
 fx.tick(r,false);assert.equal(fx.snapshot().banks.length,0);assert.equal(fx.snapshot().energy,0);const blank=createCanvas(400,360).toBuffer('image/png');assert.deepEqual(image(fx,false),blank);
 fx.event('bank',bank);fx.tick(rig());assert.equal(fx.snapshot().banks.length,0);fx.reset();assert.equal(fx.snapshot().queued,0);
});

test('the real body painter clamps COMPOSED splat + dash + rebound, even after impact ownership changes',()=>{
 const c=createCanvas(960,540).getContext('2d');let renderer;const r=createRun(41,(type,d)=>renderer?.event(type,d,true),{waveMode:true});renderer=createArtRenderer(c,{width:960,height:540});
 try{r.state.invul=99999;r.state.wave.entry=0;for(const e of [...r.combat.enemies.values()])r.combat.remove(e);placePlayer(r.world,{x:1450,y:-450});renderer.field(r.world.player.position,false);r.dash({x:42,y:14,power:1});let contacts=0;
 for(let i=0;i<30;i++){r.tick();renderer.tick(r,true);renderer.draw(r,1,null,true);if(r.state.splat)contacts++;const b=renderer.bodyEnvelope();for(const scale of Object.values(b))assert.ok(scale>=.8&&scale<=1.25);}
 assert.ok(contacts>0,'must exercise an actual wall splat');
 }finally{renderer.dispose();r.dispose();}
});
