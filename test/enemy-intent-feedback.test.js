import test from 'node:test';
import assert from 'node:assert/strict';
import {createCanvas} from '@napi-rs/canvas';
import {enemyIntent,enemyIntentBadges,drawEnemyIntentBadges,drawPlayerDamageReceipt} from '../src/art/splatr-art-engine.js';
import {createRun} from '../src/run.js';

const enemy=(kind,extra={})=>({id:kind,kind,x:200,y:210,r:25,mode:'idle',clock:0,span:80,...extra});
test('each opponent has a truthful verb, and a windup bar comes from the real clock',()=>{
 const verbs={fang:'RUSH',pulse:'RING',prism:'SHOT',fork:'SWIPE / SPLIT',bastion:'SLAM',rift:'BLINK STRIKE',well:'PULL / CRUSH',crown:'VOLLEY'};
 for(const [kind,verb] of Object.entries(verbs)){
  assert.equal(enemyIntent(enemy(kind)).label,`${kind.toUpperCase()} / ${verb}`);
  assert.equal(enemyIntent(enemy(kind)).state,'IDLE');
  assert.equal(enemyIntent(enemy(kind,{mode:'tell',clock:60})).progress,.25);
  assert.equal(enemyIntent(enemy(kind,{mode:'tell',clock:10})).progress,.875);
 }
 assert.equal(enemyIntent(enemy('fang',{mode:'rush'})).state,'ATTACK');
 assert.equal(enemyIntent(enemy('bastion',{mode:'recover'})).state,'RECOVER');
 assert.equal(enemyIntent(enemy('bastion',{mode:'recover'}),[{sourceId:'bastion',spent:false}]).state,'ATTACK');
 assert.equal(enemyIntent(enemy('bastion',{mode:'recover'}),[{sourceId:'bastion',spent:true}]).state,'RECOVER');
 assert.equal(enemyIntent(enemy('fang',{paper:true})),null);
 const a=enemy('prism'),b=enemy('prism',{id:'other'}),link={a,b,mode:'tell',f:.4};
 assert.deepEqual(enemyIntent(a,[],[link]),{label:'LINK / BEAM',state:'WINDUP',progress:.4});
 assert.equal(enemyIntent(a,[],[{...link,mode:'live'}]).state,'ATTACK');
});
test('badge selection is bounded, prioritizes real tells, avoids player and restores canvas state',()=>{
 const v={x:0,y:0,w:390,h:680,width:390,height:680,scale:1};
 const entries=[enemy('fang',{x:190,y:280,mode:'tell',clock:40}),enemy('pulse',{x:200,y:280}),enemy('prism',{x:320,y:380,mode:'tell',clock:40}),enemy('rift',{x:100,y:470}),enemy('well',{x:200,y:520}),enemy('crown',{x:40,y:600})];
 const combat={enemies:new Map(entries.map(e=>[e.id,e])),hazards:[],links:[]};
 const badges=enemyIntentBadges(v,combat,{x:195,y:360});assert.ok(badges.length<=4);assert.equal(badges[0].state,'WINDUP');
 assert.ok(badges.every(b=>Math.hypot(b.x-195,b.y-360)>=70));
 const ctx=createCanvas(390,680).getContext('2d'),before=ctx.getTransform();drawEnemyIntentBadges(ctx,v,combat,{x:195,y:360});assert.deepEqual(ctx.getTransform(),before);
});
test('only actual health loss creates a receipt; blocked hits do not change it',()=>{
 const run=createRun(3,()=>{},{});try{
  run.state.phase='playing';run.state.invul=0;
  assert.equal(run.state.lastDamage,null);assert.equal(run.hurt('Pulse wave'),true);
  assert.deepEqual(run.state.lastDamage,{cause:'Pulse wave',hp:2,hpMax:3,tick:run.state.elapsed});
  assert.equal(run.hurt('Fang'),false);assert.equal(run.state.lastDamage.cause,'Pulse wave');
  const ctx=createCanvas(390,680).getContext('2d'),v={x:-195,y:-340,width:390,height:680,scale:1};
  drawPlayerDamageReceipt(ctx,v,{x:0,y:0},run.state);assert.ok(ctx.getImageData(195,282,1,1).data[3]>0);
  run.state.elapsed+=91;const blank=createCanvas(390,680).getContext('2d');drawPlayerDamageReceipt(blank,v,{x:0,y:0},run.state);assert.equal(blank.getImageData(195,282,1,1).data[3],0);
 }finally{run.dispose();}
});
