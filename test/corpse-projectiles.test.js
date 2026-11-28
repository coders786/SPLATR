import test from 'node:test';
import assert from 'node:assert/strict';
import {flingCorpse,stepCorpseProjectiles,CORPSE_SHARD} from '../src/corpse-projectiles.js';
import {createRun} from '../src/run.js';
import {placePlayer,stopPlayer} from '../src/physics.js';

test('splinters are capped, respect walls, and hit only the first eligible actor',()=>{
 const shards=[];for(let i=0;i<12;i++)flingCorpse(shards,{x:0,y:0,id:`old${i}`},0,1);assert.equal(shards.length,CORPSE_SHARD.cap);
 const target={id:'victim',kind:'fang',x:15,y:0,r:4,hp:1},enemies=new Map([[target.id,target]]),hits=[];
 stepCorpseProjectiles(shards,{dt:1,enemies,geometry:[{x:7,y:-20,w:2,h:40}],onHit:e=>hits.push(e)});assert.equal(hits.length,0);assert.equal(shards.length,0);
 flingCorpse(shards,{x:0,y:0,id:'origin'},0,1);stepCorpseProjectiles(shards,{dt:1,enemies,onHit:e=>hits.push(e)});assert.deepEqual(hits,[target]);assert.equal(shards.length,0);
});

test('a real fast arcade kill throws a harmless-to-player shard that damages another target without combo credit',()=>{
 const events=[],r=createRun(2,(type,data)=>events.push({type,data}),{waveMode:true,continuous:true});
 try{
  for(const e of [...r.combat.enemies.values()])r.combat.remove(e);
  for(let i=0;i<2;i++)r.combat.add({id:`target/${i}`,kind:'fang',x:0,y:-200-i*140,pinned:true,delay:999999,wave:true});
  r.combat.add({id:'keep',kind:'fang',x:1400,y:-2000,pinned:true,delay:999999,wave:true});
  r.state.phase='playing';r.state.wave.entry=0;r.state.invul=9999;placePlayer(r.world,{x:0,y:-80});stopPlayer(r.world);r.dash({x:0,y:-42,power:1});
  for(let i=0;i<35;i++){r.tick();if(r.state.kills>0)r.state.blade=0;}
  assert.equal(r.state.kills,2);assert.equal(r.state.chain,1);assert.equal(r.state.hp,r.state.hpMax);
  assert.ok(events.some(e=>e.type==='cut'&&e.data.entityId==='target/1'&&e.data.sourceKind==='corpse-shard'&&e.data.secondary));
 }finally{r.dispose();}
});
