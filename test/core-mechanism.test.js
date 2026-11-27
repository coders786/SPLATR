import test from 'node:test';
import assert from 'node:assert/strict';
import {createCanvas} from '@napi-rs/canvas';
import {CORE_MECHANISMS,resolveCoreMechanism,coreMechanismPose,drawCoreMechanismStudy,drawCubeHero} from '../src/art/splatr-art-engine.js';
import {ITEMS,normalizeEquipment,equipmentRules,loadEquipment} from '../src/equipment.js';
import {swordProfile} from '../src/swords.js';
import {HYBRIDS} from '../src/hybrids.js';
const cores=ITEMS.filter(i=>i.slot==='core'),bodies=ITEMS.filter(i=>i.slot==='body');
const eq=parts=>normalizeEquipment(parts);
function render(equipment,{radius=64,pose={},time=0,motion=false}={}){
 const canvas=createCanvas(320,250),c=canvas.getContext('2d');c.translate(1,2);c.globalAlpha=.8;c.setLineDash([2,4]);const transform=c.getTransform();
 drawCubeHero(c,{x:180,y:140,radius,equipment,time,motion,pose:{blink:1,...pose}});
 assert.deepEqual(c.getTransform(),transform);assert.equal(c.globalAlpha,.8);assert.deepEqual(c.getLineDash(),[2,4]);
 // Sample only the new cassette. Neither eyes/tails nor family shoulders can
 // satisfy distinctness/state assertions.
 const x=Math.floor(181-radius*.66),y=Math.floor(142+radius*.32),w=Math.ceil(radius*1.47),h=Math.ceil(radius*.63);
 return {core:Buffer.from(c.getImageData(x,y,w,h).data),interior:Buffer.from(c.getImageData(Math.ceil(181-radius*.52),Math.ceil(142+radius*.47),Math.floor(radius*1.10),Math.floor(radius*.36)).data),png:canvas.toBuffer('image/png')};
}

test('seven frozen mechanism grammars use catalogue names, not made-up power identities',()=>{
 assert.equal(Object.keys(CORE_MECHANISMS).length,7);const descriptions=[];
 for(const item of cores){const d=resolveCoreMechanism(item.id);assert.ok(Object.isFrozen(d));assert.equal(d.title,item.name);descriptions.push(d.mechanism);}
 assert.equal(new Set(descriptions).size,7);assert.equal(resolveCoreMechanism('constructor'),CORE_MECHANISMS.standard);assert.equal(resolveCoreMechanism('bad'),CORE_MECHANISMS.standard);
});

test('read-only live view is based on phase and real state, never elapsed time/pose/weapon charge',()=>{
 const state=Object.freeze({phase:'playing',chain:8,held:true,drive:12,focus:.6,hp:1,focusRecoveryActive:true,swordCharge:99,elapsed:9000,
 equipmentFx:Object.freeze({echoes:Object.freeze([Object.freeze({ticks:4}),Object.freeze({ticks:2,upgradeEcho:true}),Object.freeze({ticks:0})])})});
 const before=JSON.stringify(state),p=coreMechanismPose(state);assert.deepEqual(p,{coreLive:true,coreChain:8,coreEchoes:1,coreDrive:true,corePull:true,coreRecovering:true,coreFocus:.6,coreHull:1});assert.equal(JSON.stringify(state),before);
 assert.deepEqual(coreMechanismPose({...state,elapsed:0,swordCharge:0}),p);
 for(const phase of ['ready','dead','retired','paused']){const off=coreMechanismPose({...state,phase});assert.equal(off.coreLive,false);assert.equal(off.coreChain,0);assert.equal(off.coreEchoes,0);assert.equal(off.coreDrive,false);assert.equal(off.corePull,false);assert.equal(off.coreRecovering,false);assert.equal(off.coreHull,null);}
 assert.equal(coreMechanismPose({...state,opening:{}}).coreLive,false);
 assert.equal(coreMechanismPose({phase:'playing',chain:NaN,focus:Infinity}).coreChain,0);
 assert.equal(coreMechanismPose({phase:'playing',focus:-1}).coreFocus,0);assert.equal(coreMechanismPose({phase:'playing',focus:3}).coreFocus,1);
});

test('all7 mechanisms are distinct inside the cassette on all10 materials, at23px and inspection size',()=>{
 for(const radius of [23,64])for(const body of bodies)for(const emission of [0,1]){
  const frames=cores.map(core=>render(eq({body:body.id,core:core.id}),{radius,pose:{emission}}).core.toString('base64'));
  assert.equal(new Set(frames).size,7,`${body.id}/${radius}/emission${emission}`);
 }
});

test('the7 core carriers retain10 distinct material shapes/finishes without energy',()=>{
 for(const core of cores){const frames=bodies.map(body=>render(eq({body:body.id,core:core.id}),{pose:{emission:0}}).core.toString('base64'));assert.equal(new Set(frames).size,10,core.id);}
});

test('no idle charge, fake pull, Drive or stored blade is inferred from aiming/attack/chain/combo/weapon pose',()=>{
 for(const item of cores){const equipment=eq({core:item.id}),idle=render(equipment).core;
  for(const pose of [{aiming:true},{attackProgress:.3},{combo:8},{overdrive:true},{coreChain:2},{coreEchoes:1},{coreDrive:true},{corePull:true},{coreRecovering:true,coreFocus:.7}]){
   assert.deepEqual(render(equipment,{pose}).core,idle,`${item.id}/${JSON.stringify(pose)}`);
  }
 }
});

test('actual Echo chain cells and stationary-source mark are separate, bounded and never a next-dash charge',()=>{
 const equipment=eq({core:'echo'}),live=chain=>({coreLive:true,coreChain:chain}),frames=[0,1,2].map(n=>render(equipment,{pose:live(n)}).core);
 assert.notDeepEqual(frames[0],frames[1]);assert.notDeepEqual(frames[1],frames[2]);assert.deepEqual(frames[0],render(equipment,{pose:live(3)}).core);assert.deepEqual(frames[2],render(equipment,{pose:live(8)}).core);
 const source=render(equipment,{pose:{...live(0),coreEchoes:1}}).core;assert.notDeepEqual(source,frames[0]);assert.notDeepEqual(source,frames[1]);assert.deepEqual(source,render(equipment,{pose:{...live(0),coreEchoes:100}}).core);
 // Square Pixel finish cannot add ornamental pretend charge cells.
 assert.deepEqual(render(equipment).interior,render(eq({core:'echo',slash:'pixel'})).interior);
});

test('real Drive, aim-pull, passive FOCUS return and dead fragile hull change only their owning mechanism',()=>{
 const cases=[['riot',{coreDrive:true}],['grav',{corePull:true}],['time',{coreRecovering:true,coreFocus:.6}],['glass',{coreHull:0}]];
 for(const [core,pose] of cases){const equipment=eq({core});assert.notDeepEqual(render(equipment).core,render(equipment,{pose:{coreLive:true,...pose}}).core,core);}
 for(const item of cores)if(!cases.some(([id])=>id===item.id))assert.deepEqual(render(eq({core:item.id})).core,render(eq({core:item.id}),{pose:{coreLive:true,coreDrive:true,corePull:true,coreRecovering:true,coreFocus:1,coreHull:0}}).core);
});

test('all70 core/material combinations freeze ambient motion, retaining truthful static live state in reduced motion',()=>{
 for(const core of cores)for(const body of bodies){const equipment=eq({core:core.id,body:body.id}),pose={coreLive:true,coreChain:2,coreEchoes:1,corePull:true,coreDrive:true,coreRecovering:true,coreFocus:.7};
 assert.deepEqual(render(equipment,{time:0,pose}).png,render(equipment,{time:999,pose}).png,`${body.id}/${core.id}`);}
});

test('shared inspection says no live charge, balances Canvas state and never grants a locked core',()=>{
 const raw=JSON.stringify({owned:[],equipped:{core:'standard'},discovered:[],presets:[null,null,null]}),before=loadEquipment(raw);
 const draw=(equipment,time)=>{const cv=createCanvas(640,400),c=cv.getContext('2d'),text=[];c.translate(2,3);c.globalAlpha=.5;const transform=c.getTransform(),fill=c.fillText.bind(c);c.fillText=(v,...rest)=>{text.push(v);return fill(v,...rest);};
 drawCoreMechanismStudy(c,640,400,{equipment,motion:false,time});assert.deepEqual(c.getTransform(),transform);assert.equal(c.globalAlpha,.5);return {png:cv.toBuffer('image/png'),text};};
 for(const item of cores){const equipment=Object.freeze(eq({core:item.id})),a=draw(equipment,0);assert.deepEqual(a.png,draw(equipment,9999).png);assert.ok(a.text.includes(item.name.toUpperCase()));assert.ok(a.text.some(t=>t.includes('NO LIVE CHARGE')));assert.ok(a.text.some(t=>t.includes('BUY AND EQUIP ARE SEPARATE')));}
 assert.deepEqual(loadEquipment(raw),before);assert.equal(before.owned.includes('glass'),false);drawCoreMechanismStudy(null,640,400);
});

test('new machinery leaves all10x7 part rules and17 completed sword profiles unmodified',()=>{
 for(const body of bodies)for(const core of cores){const equipment=eq({body:body.id,core:core.id}),rules=equipmentRules(equipment),sword=swordProfile(equipment);render(equipment,{pose:coreMechanismPose({phase:'playing',chain:2,drive:2,held:true})});assert.deepEqual(equipmentRules(equipment),rules);assert.deepEqual(swordProfile(equipment),sword);}
 for(const h of HYBRIDS){const equipment=eq(h.parts),sword=swordProfile(equipment);render(equipment);assert.deepEqual(swordProfile(equipment),sword);}
});

test('real run kills/aim/recovery/death feed the mechanism view without a presentation-owned clock',async()=>{
 const {createRun}=await import('../src/run.js'),{placePlayer,stopPlayer}=await import('../src/physics.js');
 for(const core of ['echo','riot','grav','time']){
  const r=createRun(77,()=>{},{waveMode:true,equipment:{core}});
  try{
   for(const e of [...r.combat.enemies.values()])r.combat.remove(e);
   r.combat.add({id:'sentinel',kind:'fang',x:700,y:-900,pinned:true,delay:999999});
   Object.assign(r.state,{phase:'playing',opening:null,inputLock:false,invul:999999});r.state.wave.entry=0;
   placePlayer(r.world,{x:-350,y:-400});stopPlayer(r.world);r.world.grounded=false;
   const read=()=>coreMechanismPose(r.state),tick=()=>{r.state.stop=1;r.tick();};
   const max=core==='riot'?4:core==='echo'?3:1;
   for(let i=0;i<max;i++){
    const p=r.world.player.position,e=r.combat.add({id:`kill-${i}`,kind:'fang',x:p.x+50,y:p.y,pinned:true,delay:999999});
    r.state.inputLock=false;assert.equal(r.dash({x:24,y:0,power:24/42}),true);r.combat.contacts.add(e);tick();
    assert.equal(r.combat.enemies.has(e.id),false);assert.equal(read().coreChain,i+1);
   }
   if(core==='echo'){assert.ok(read().coreEchoes>0);assert.equal(read().coreChain%3,0);assert.equal(r.state.swordCharge,0);}
   if(core==='riot')assert.equal(read().coreDrive,true);
   if(core==='grav'){r.focus(true);assert.equal(read().corePull,true);r.focus(false);assert.equal(read().corePull,false);}
   if(core==='time'){r.state.focus=.4;r.focus(false);tick();assert.equal(read().coreRecovering,true);assert.equal(read().coreFocus,r.state.focus);r.focus(true);assert.equal(read().coreRecovering,false);}
   r.state.invul=0;r.state.hp=1;r.hurt('core-QA');assert.equal(read().coreLive,false);assert.equal(read().coreChain,0);assert.equal(read().coreEchoes,0);assert.equal(read().coreDrive,false);
  }finally{r.dispose();}
 }
});
