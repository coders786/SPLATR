import test from 'node:test';
import assert from 'node:assert/strict';
import {createGarageCombat} from '../src/garage-combat.js';

test('Garage practice uses isolated selected loadout and real combat',()=>{
 const box=createGarageCombat();
 try{
  box.configure({head:'coil',core:'riot'});
  assert.equal(box.run.state.equipment.head,'coil');assert.equal(box.run.state.rushKillTarget,4);
  assert.equal(box.run.state.kills,0);assert.equal(box.fire(box.state.dummy.x,box.state.dummy.y),true);
  for(let i=0;i<50&&box.state.hits===0;i++)box.tick();
  assert.ok(box.state.hits>0,'real target was cut');assert.ok(box.run.state.kills>0);
  const old=box.run;box.configure({head:'crown',core:'glass'});
  assert.notEqual(box.run,old);assert.equal(box.run.state.hpMax,1);assert.equal(box.state.hits,0);
  assert.equal(box.run.state.equipment.head,'crown');
 }finally{box.dispose();}
});

test('practice focus and cancelled aim do not launch; repeat targets respawn',()=>{
 const box=createGarageCombat();try{
  box.configure({});const run=box.run;
  assert.ok(box.aim(385,180));assert.deepEqual(box.state.drag,{x:385,y:180});box.cancel();assert.equal(run.state.held,false);assert.equal(run.state.shots,0);
  assert.equal(box.fire(385,180),true);for(let i=0;i<150;i++)box.tick();
  assert.ok(box.state.hits>0);assert.ok(run.combat.enemies.has('garage/fang'),'target respawns for repeat practice');
 }finally{box.dispose();}
});
