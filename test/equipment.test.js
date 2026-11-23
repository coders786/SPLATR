import test from 'node:test';
import assert from 'node:assert/strict';
import {ITEMS,SLOTS,DEFAULT_EQUIPMENT,loadEquipment,normalizeEquipment,buyEquipment,randomEquipment,equipmentRules} from '../src/equipment.js';
import {createRun} from '../src/run.js';
import Matter from 'matter-js';
import {createCanvas} from '@napi-rs/canvas';
import {cube} from '../src/art.js';
import {drawEquipmentWorld,drawEquipmentSlash} from '../src/equipment-art.js';

test('equipment catalog: unique items and stable slot defaults',()=>{
  assert.equal(ITEMS.length,73);assert.equal(new Set(ITEMS.map(x=>x.id)).size,73);
  for(const slot of SLOTS) assert.ok(ITEMS.filter(x=>x.slot===slot).length>=3);
  assert.equal(DEFAULT_EQUIPMENT.head,'none');
});
test('equipment migration recovers malformed saves and rejects unowned/wrong-slot parts',()=>{
  for(const raw of ['{','null','[]']) assert.deepEqual(loadEquipment(raw).equipped,DEFAULT_EQUIPMENT);
  const state=loadEquipment(JSON.stringify({owned:['halo','invented'],equipped:{head:'halo',body:'halo',tail:'wings'},presets:[{head:'halo'}]}));
  assert.equal(state.equipped.head,'halo');assert.equal(state.equipped.body,'paper');assert.equal(state.equipped.tail,'ribbon');assert.equal(state.presets.length,3);assert.ok(Object.isFrozen(state.equipped));
});
test('purchase is pure, exact cost, rejects duplicates and insufficient funds',()=>{
  const state=loadEquipment('{}');assert.equal(buyEquipment(state,'halo',249),null);
  const result=buyEquipment(state,'halo',300);assert.equal(result.wallet,50);assert.ok(result.state.owned.includes('halo'));assert.ok(!state.owned.includes('halo'));assert.equal(buyEquipment(result.state,'halo',500),null);
});
test('randomize only selects owned parts, never modifies presets or wallet',()=>{
  const state=loadEquipment('{}');for(let i=0;i<100;i++){const eq=randomEquipment(state.owned);assert.deepEqual(eq,DEFAULT_EQUIPMENT);}assert.equal(state.presets[0],null);
});
test('run takes immutable equipment snapshot and records it on the stroke',()=>{
  const input={head:'halo',tail:'wings'};const run=createRun(44,()=>{},{staged:false,equipment:input});
  input.head='neko';assert.equal(run.state.equipment.head,'halo');assert.ok(Object.isFrozen(run.state.equipment));
  assert.ok(run.dash({x:15,y:-24,power:.8}));assert.equal(run.state.stroke.equipment.head,'halo');run.dispose();
});
test('every initial item renders at combat and preview scale without canvas state leaks',()=>{
  const c=createCanvas(320,240).getContext('2d');
  for(const it of ITEMS){const eq=normalizeEquipment({...DEFAULT_EQUIPMENT,[it.slot]:it.id});for(const size of [15,48]){
    drawEquipmentWorld(c,320,240,eq.world,24);const before=c.getTransform();cube(c,160,120,size,.3,25,1,{equipment:eq,field:{sx:1.1,sy:.9,grip:.8}});drawEquipmentSlash(c,50,190,270,80,eq.slash,.8);assert.deepEqual(c.getTransform(),before);
  }}
});

test('Halo reduces falling aim gravity exactly 15% without changing normal movement',()=>{
  const plain=createRun(44,()=>{},{staged:false}),halo=createRun(44,()=>{},{staged:false,equipment:{head:'halo'}});
  for(const run of [plain,halo]){run.state.phase='playing';Matter.Body.setPosition(run.world.player,{x:0,y:-400});Matter.Body.setVelocity(run.world.player,{x:0,y:5});run.world.grounded=false;run.focus(true);assert.equal(run.state.held,true);run.tick();}
  assert.equal(halo.world.engine.gravity.scale,plain.world.engine.gravity.scale,'enemy/world gravity unchanged');
  assert.equal(halo.world.playerGravityMultiplier,.85);
  assert.ok(halo.world.player.velocity.y<plain.world.player.velocity.y);
  assert.equal(halo.state.hp,plain.state.hp);plain.dispose();halo.dispose();
});

test('resolved equipment rules compose trade-offs and remain immutable',()=>{
  const r=equipmentRules({head:'viper',core:'riot',tail:'ghost'});
  assert.equal(r.edgeMax,2);assert.equal(r.dashSpeed,1.2);assert.equal(r.cutWidth,.85);assert.equal(r.bladeExtra,6);assert.equal(r.overdriveKills,4);assert.ok(Object.isFrozen(r));
});
test('Viper launch is exactly 20% faster and Ghost adds six ticks without extending base active travel',()=>{
  const runs=[{}, {head:'viper'}, {head:'viper',tail:'ghost'}].map(equipment=>createRun(19,()=>{},{staged:false,equipment}));
  for(const run of runs)assert.ok(run.dash({x:20,y:-20,power:.7}));
  const speed=r=>Math.hypot(r.world.player.velocity.x,r.world.player.velocity.y);
  assert.ok(Math.abs(speed(runs[1])/speed(runs[0])-1.2)<1e-9);
  assert.ok(Math.abs(runs[1].state.blade*1.2-runs[0].state.blade)<1e-9);
  assert.equal(runs[2].state.blade-runs[1].state.blade,6);
  for(const r of runs)r.dispose();
});
test('Riot resource cap survives portal return, recovery and a new run',()=>{
  const r=createRun(19,()=>{},{staged:false,equipment:{core:'riot'}});
  assert.equal(r.state.edgeMax,2);assert.equal(r.state.edge,2);
  r.state.questPortal={x:0,y:0};assert.ok(r.leaveQuestVault());assert.equal(r.state.edge,2);
  for(let i=0;i<120;i++)r.tick();assert.ok(r.state.edge<=2);r.dispose();
  const plain=createRun(19);assert.equal(plain.state.edgeMax,3);assert.equal(plain.state.edge,3);plain.dispose();
});
test('Neon scar lasts thirty simulation ticks and renderer has no damage ownership',()=>{
  const r=createRun(19,()=>{},{staged:false,equipment:{slash:'laser'}});r.dash({x:0,y:-20,power:.5});assert.equal(r.state.equipmentScar.ticks,30);
  r.tick();assert.equal(r.state.equipmentScar.ticks,29);r.dispose();
});

test('Riot activates Overdrive at four consecutive kills; standard still needs six',()=>{
  for(const [core,expected] of [['standard',6],['riot',4]]){
    const activations=[];let r;
    r=createRun(19,type=>{if(type==='drive')activations.push(r.state.chain);},{staged:false,equipment:{core}});
    r.state.chain=3;r.state.chainTime=100;r.dash(r.suggestion());
    for(let i=0;i<22;i++)r.tick();
    assert.equal(activations[0],expected);assert.ok(r.state.edge<=r.state.edgeMax);r.dispose();
  }
});
