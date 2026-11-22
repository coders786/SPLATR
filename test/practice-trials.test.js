import test from 'node:test';
import assert from 'node:assert/strict';
import {PRACTICE_SCENARIOS,practiceTargets,practiceScenario,trialObservation,compareTrials,trialReceipt} from '../src/practice-trials.js';
import {createRun} from '../src/run.js';
import {placePlayer,stopPlayer} from '../src/physics.js';
import {swordProfile,SWORD_BUILDS} from '../src/swords.js';
import {normalizeEquipment} from '../src/equipment.js';
test('practice fixtures are fixed, frozen and fresh copies never modify the catalogue',()=>{
 assert.equal(PRACTICE_SCENARIOS.length,3);assert.ok(Object.isFrozen(PRACTICE_SCENARIOS[0].targets[0]));assert.equal(practiceScenario('garbage').id,'lane');
 const a=practiceTargets('armor'),b=practiceTargets('armor');a[0].x=100;assert.notEqual(a[0].x,b[0].x);assert.equal(new Set(b.map(t=>t.id)).size,b.length);
});
test('trial observations count actual target HP and removals; only comparable fixtures have deltas',()=>{
 const initial=[{id:'a',hp:2},{id:'b',hp:1}];const a=trialObservation({scenario:'armor',initial,remaining:[{id:'a',hp:1},{id:'b',hp:1}],shots:2,ticks:240,loadout:'equipped'});
 const b=trialObservation({scenario:'armor',initial,remaining:[{id:'a',hp:1}],shots:3,ticks:240});assert.equal(a.damage,1);assert.equal(b.kills,1);assert.equal(b.damage,2);assert.deepEqual(compareTrials(a,b),{kills:1,damage:1,shots:1});assert.equal(compareTrials(a,{...b,scenario:'spread'}),null);assert.equal(compareTrials(a,{...b,mode:'auto'}),null);assert.equal(compareTrials(a,{...b,totalHp:10}),null);assert.match(trialReceipt(b),/1\/2 TARGETS · 2\/3 HP · 3 LAUNCHES · 4.0s/);assert.deepEqual(initial,[{id:'a',hp:2},{id:'b',hp:1}]);
});
test('observations bound invalid values and do not reward healing or unrelated enemies',()=>{
 const r=trialObservation({initial:[{id:'a',hp:2}],remaining:[{id:'a',hp:100},{id:'extra',hp:1}],shots:NaN,ticks:Infinity});assert.equal(r.damage,0);assert.equal(r.kills,0);assert.equal(r.shots,0);assert.equal(r.ticks,0);
});
test('all signature styles execute real deterministic trial fixtures, without partial target damage masquerading as kills',()=>{
 for(const equipment of [{},...SWORD_BUILDS.map(b=>normalizeEquipment(b.parts))])for(const scenario of PRACTICE_SCENARIOS){
 const r=createRun(712,()=>{},{waveMode:true,equipment});try{
 for(const e of [...r.combat.enemies.values()])r.combat.remove(e);for(const t of practiceTargets(scenario.id))r.combat.add(t);const initial=[...r.combat.enemies.values()].map(e=>({id:e.id,hp:e.hp}));
 r.state.phase='playing';r.state.invul=999999;r.state.wave.entry=0;placePlayer(r.world,{x:-350,y:-100});stopPlayer(r.world);
 for(let i=0;i<240&&r.combat.enemies.size;i++){if(i%45===0){r.state.edge=r.state.edgeMax;r.state.blade=0;r.state.stop=0;const p=r.world.player.position,t=[...r.combat.enemies.values()][0],dx=t.x-p.x,dy=t.y-p.y,n=Math.hypot(dx,dy)||1;r.dash({x:dx/n*36,y:dy/n*36,power:36/42});}r.tick();}
 const result=trialObservation({scenario:scenario.id,initial,remaining:[...r.combat.enemies.values()],shots:r.state.shots,ticks:240});assert.ok(result.damage<=result.totalHp);assert.equal(result.kills,initial.length-r.combat.enemies.size);assert.ok(result.shots>0,swordProfile(equipment).name);assert.ok(result.damage>=result.kills);
 }finally{r.dispose();}}
});
