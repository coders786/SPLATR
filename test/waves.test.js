import test from 'node:test';
import assert from 'node:assert/strict';
import {createRun} from '../src/run.js';
import {waveOffers,WAVE_ARENA} from '../src/waves.js';
import {placePlayer,stopPlayer} from '../src/physics.js';
function clear(r){for(const e of [...r.combat.enemies.values()])r.combat.remove(e);r.state.stop=0;r.tick();}
function land(r){const q=r.state.wave.platform;placePlayer(r.world,{x:q.x+q.w/2,y:q.y-23});stopPlayer(r.world);for(let i=0;i<25&&r.state.wave.phase!=='choose';i++){r.state.stop=0;r.tick();}}
test('finite wave: no stream rescue, last enemy gates rest, real platform and three deterministic choices',()=>{
 const r=createRun(131,()=>{},{waveMode:true});try{
 assert.deepEqual(r.world.arena,WAVE_ARENA);assert.equal(r.combat.enemies.size,12);r.state.phase='playing';r.state.invul=99999;
 for(const e of [...r.combat.enemies.values()].slice(1))r.combat.remove(e);
 for(let i=0;i<300;i++)r.tick();assert.equal(r.state.wave.phase,'combat');assert.equal(r.combat.enemies.size,1);
 clear(r);assert.equal(r.state.wave.phase,'return');assert.ok(r.world.engine.world.bodies.some(b=>b.label==='wave-rest'));assert.equal(r.state.wave.spawnPadGone,true);assert.ok(r.world.geometry.includes(r.state.wave.platform));
 assert.equal(r.chooseWaveBuff('fleet'),false);land(r);assert.equal(r.state.wave.phase,'choose');assert.equal(r.state.wave.offers.length,3);assert.equal(new Set(r.state.wave.offers.map(x=>x.id)).size,3);
 const clock=r.world.clock;for(let i=0;i<50;i++)r.tick();assert.equal(r.world.clock,clock);assert.equal(r.chooseWaveBuff('bogus'),false);
 const buff=r.state.wave.offers[0];assert.equal(r.chooseWaveBuff(buff.id),true);assert.equal(r.state.wave.number,2);assert.equal(r.state.wave.phase,'combat');assert.equal(r.combat.enemies.size,15);assert.equal(r.state.waveBuff.id,buff.id);assert.equal(r.state.wave.platform,null);assert.equal(r.world.geometry.length,0);assert.equal(r.chooseWaveBuff(buff.id),false);
 clear(r);assert.equal(r.state.waveBuff,null);assert.equal(r.state.dashSpeed,1);assert.equal(r.state.wave.expiredBuff.id,buff.id);land(r);assert.equal(r.state.wave.phase,'choose');const second=r.state.wave.offers.find(x=>x.id!==buff.id);r.chooseWaveBuff(second.id);assert.equal(r.state.waveBuff.id,second.id);assert.equal(r.state.dashSpeed,second.speed||1);assert.equal(r.combat.enemies.size,18);
 }finally{r.dispose();}
});
test('seeded offers stable and do not mutate frozen catalogue',()=>{assert.deepEqual(waveOffers(1,1),waveOffers(1,1));assert.notDeepEqual(waveOffers(1,1),waveOffers(1,2));});
