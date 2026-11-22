import test from 'node:test';
import assert from 'node:assert/strict';
import Matter from 'matter-js';
import {MOVEMENT,flightEnvelope} from '../src/movement-model.js';
import {createPhysics,launch,stepPhysics,destroyPhysics,MAX_SPEED,STEP_MS} from '../src/physics.js';
import {predictAim} from '../src/aim.js';
import {createRun} from '../src/run.js';

test('movement parameters are immutable and maintain the fixed-step collision budget',()=>{
 assert.ok(Object.isFrozen(MOVEMENT));assert.equal(MAX_SPEED,MOVEMENT.maxSpeed);assert.equal(STEP_MS,1000/60);assert.equal(MOVEMENT.maxTravel,5);
 assert.deepEqual(flightEnvelope({launchGrace:8}),{minVy:-Infinity,maxVy:Infinity});
 assert.deepEqual(flightEnvelope({launchGrace:0}),{minVy:-26,maxVy:10});
 assert.equal(flightEnvelope({floorIgnore:10}).minVy,-Infinity);assert.equal(flightEnvelope({},true).minVy,-Infinity);
 assert.deepEqual(flightEnvelope({hyper:true}),{minVy:-Infinity,maxVy:Infinity});
});
test('new-launch preview matches physical integration through commitment and safety-limit transition',()=>{
 for(const vector of [{x:-32,y:-28,power:1},{x:0,y:42,power:1},{x:0,y:-42,power:1},{x:42,y:0,power:1}]){
  const world=createPhysics({seed:41,spawn:{x:0,y:0},solids:[]});
  try{
   const state={phase:'playing',line:-Infinity,flightRules:MOVEMENT,launchGrace:8},run={state,world,combat:{enemies:new Map()}};
   const prediction=predictAim(run,vector,{magnetic:false});assert.ok(launch(world,vector));
   for(let tick=1;tick<=30;tick++){
    stepPhysics(world);const limits=flightEnvelope(state),v=world.player.velocity;
    Matter.Body.setVelocity(world.player,{x:v.x,y:Math.max(limits.minVy,Math.min(limits.maxVy,v.y))});if(state.launchGrace>0)state.launchGrace--;
    if(tick%2===0){const q=prediction.path[tick/2-1];assert.ok(Math.hypot(world.player.position.x-q.x,world.player.position.y-q.y)<1e-6,`tick ${tick} ${JSON.stringify(vector)}`);}
    if(tick===1&&vector.y===42)assert.ok(world.player.velocity.y>35,'downward release must not collapse to fall cap immediately');
   }
  }finally{destroyPhysics(world);}
 }
});
test('production run owns an eight-tick commitment and then returns to bounded flight',()=>{
 const run=createRun(41,()=>{},{staged:true});
 try{
  Matter.Body.setPosition(run.world.player,{x:0,y:-5000});run.world.grounded=false;run.state.phase='playing';run.state.invul=999;run.state.line=0;
  assert.ok(run.dash({x:0,y:-42,power:1}));assert.equal(run.state.launchGrace,8);
  run.tick();assert.ok(run.world.player.velocity.y < -35);assert.equal(run.state.launchGrace,7);
  for(let i=0;i<8;i++)run.tick();assert.equal(run.state.launchGrace,0);assert.ok(run.world.player.velocity.y>=-MOVEMENT.ascent);
 }finally{run.dispose();}
});
