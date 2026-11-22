import test from 'node:test';
import assert from 'node:assert/strict';
import {encounterBrief,planEncounter,recommendWaveOffer} from '../src/encounters.js';
import {waveOffers,WAVE_ARENA} from '../src/waves.js';
import {createRun} from '../src/run.js';
import {placePlayer,stopPlayer} from '../src/physics.js';
function advance(r){for(const e of [...r.combat.enemies.values()])r.combat.remove(e);r.state.stop=0;r.tick();const q=r.state.wave.platform;placePlayer(r.world,{x:q.x+150,y:q.y-23});stopPlayer(r.world);for(let i=0;i<25&&r.state.wave.phase!=='choose';i++)r.tick();assert.equal(r.state.wave.phase,'choose');return r.state.wave.offers;}
test('pure finite plans: deterministic roles, safe spacing/bounds, frozen inputs and milestone cadence',()=>{
 const forms=new Set();
 for(let seed=0;seed<12;seed++)for(let number=1;number<=20;number++)for(const player of [{x:0,y:0},{x:0,y:-650},{x:680,y:-1000}]){
  Object.freeze(player);const p=planEncounter(seed,number,player);forms.add(p.formation);assert.ok(Object.isFrozen(p)&&Object.isFrozen(p.specs)&&Object.isFrozen(p.counts));assert.equal(p.specs.length,Math.min(30,12+(number-1)*3));assert.equal(p.milestone,number%5===0);
  const counts={};for(const e of p.specs){assert.equal(e.pinned,undefined);assert.equal(e.wavePlaced,true);assert.ok(e.x>=WAVE_ARENA.x+60&&e.x<=WAVE_ARENA.x+WAVE_ARENA.w-60);assert.ok(e.y>=WAVE_ARENA.y+60&&e.y<=WAVE_ARENA.y+WAVE_ARENA.h-60);assert.ok(Math.hypot(e.x-player.x,e.y-player.y)>=205);counts[e.kind]=(counts[e.kind]||0)+1;}
  for(const [kind,count]of Object.entries(p.counts))assert.equal(counts[kind]||0,count);for(let i=0;i<p.specs.length;i++)for(let j=0;j<i;j++)assert.ok(Math.hypot(p.specs[i].x-p.specs[j].x,p.specs[i].y-p.specs[j].y)>135);
  for(const link of p.links){assert.equal(p.specs.find(e=>e.id===link.a).kind,'prism');assert.equal(p.specs.find(e=>e.id===link.b).kind,'prism');}
 }
 assert.equal(forms.size,3);assert.deepEqual(planEncounter(41,4),planEncounter(41,4));assert.notDeepEqual(planEncounter(41,4).specs,planEncounter(42,4).specs);assert.equal(encounterBrief(NaN).number,1);
});
test('three upgrade categories are guaranteed; advice is deterministic and never changes an offer',()=>{
 for(let seed=0;seed<100;seed++)for(let wave=1;wave<10;wave++){const offers=waveOffers(seed,wave);assert.deepEqual(offers.map(b=>b.category),['ATTACK','HANDLING','STAKES']);assert.equal(new Set(offers.map(b=>b.id)).size,3);const fit=recommendWaveOffer(offers,{next:encounterBrief(3),hp:1});assert.ok(offers.some(b=>b.id===fit.id));}
 const offers=[{id:'barrier'},{id:'breaker'},{id:'bounty'}];assert.equal(recommendWaveOffer(offers,{next:encounterBrief(3),hp:1}).id,'barrier');assert.equal(recommendWaveOffer(offers,{next:encounterBrief(3),hp:3}).id,'breaker');
});
test('wave actors are alive AI, not pinned scenery: entry delay, movement, telegraphs and attacks',()=>{
 const r=createRun(131,()=>{},{waveMode:true});try{r.state.phase='playing';r.state.invul=99999;const enemy=[...r.combat.enemies.values()].sort((a,b)=>Math.hypot(a.x,a.y)-Math.hypot(b.x,b.y))[0],origin={x:enemy.x,y:enemy.y};
 for(let i=0;i<30;i++)r.tick();assert.deepEqual({x:enemy.x,y:enemy.y},origin);let tells=0,lunges=0;for(let i=0;i<600;i++){r.tick();for(const e of r.combat.enemies.values()){if(e.mode==='tell')tells++;if(e.mode==='rush')lunges++;}}
 assert.ok(Math.hypot(enemy.x-origin.x,enemy.y-origin.y)>1);assert.ok(tells>0,'real windups must occur');assert.ok(lunges>0,'real lunges must occur');
 }finally{r.dispose();}
});
test('wave Prism links use live endpoints and cancel after one endpoint dies',()=>{
 const r=createRun(41,()=>{},{waveMode:true});try{r.state.phase='playing';r.state.invul=99999;advance(r);r.chooseWaveBuff(r.state.wave.offers[0].id);assert.equal(r.state.wave.number,2);const prisms=[...r.combat.enemies.values()].filter(e=>e.kind==='prism');assert.equal(prisms.length,2);let seen=false;
 for(let i=0;i<650;i++){const a=prisms[0],b=prisms[1];placePlayer(r.world,{x:(a.x+b.x)/2,y:(a.y+b.y)/2});stopPlayer(r.world);r.tick();if(r.combat.links.length){seen=true;break;}}
 assert.ok(seen,'finite wave must actually produce a telegraphed link');r.combat.remove(prisms[0]);r.tick();assert.equal(r.combat.links.length,0);
 }finally{r.dispose();}
});
test('ward is one temporary block, not healing, repeated rewards or a permanent equipment change',()=>{
 const seed=Array.from({length:100},(_,i)=>i).find(i=>waveOffers(i,1).some(b=>b.id==='barrier')),r=createRun(seed,()=>{},{waveMode:true});try{r.state.phase='playing';r.state.invul=0;const saved=JSON.stringify(r.state.equipment);r.hurt('fixture');r.state.invul=0;assert.equal(r.state.damageTaken,1);advance(r);assert.equal(r.state.wave.report.hits,1);assert.equal(r.chooseWaveBuff('barrier'),true);const hp=r.state.hp;r.state.invul=0;r.hurt('fixture');assert.equal(r.state.hp,hp);assert.equal(r.state.waveShield,0);assert.equal(r.state.damageTaken,1);r.state.invul=0;r.hurt('fixture');assert.equal(r.state.hp,hp-1);assert.equal(r.state.damageTaken,2);assert.equal(JSON.stringify(r.state.equipment),saved);
 }finally{r.dispose();}
});
test('Fork children remain part of a finite wave: killing the last parent cannot summon rest early',()=>{
 const r=createRun(41,()=>{},{waveMode:true});try{r.state.phase='playing';r.state.invul=999999;for(let n=1;n<4;n++){advance(r);r.chooseWaveBuff(r.state.wave.offers[0].id);}
 const fork=[...r.combat.enemies.values()].find(e=>e.kind==='fork');assert.ok(fork);for(const e of [...r.combat.enemies.values()])if(e!==fork)r.combat.remove(e);
 placePlayer(r.world,{x:fork.x-85,y:fork.y});stopPlayer(r.world);r.state.edge=3;r.dash({x:24,y:0,power:24/42});for(let i=0;i<10&&r.combat.enemies.has(fork.id);i++)r.tick();assert.equal(r.combat.enemies.has(fork.id),false);assert.equal(r.state.wave.phase,'combat');const kids=[...r.combat.enemies.values()];assert.equal(kids.length,2);assert.ok(kids.every(e=>e.small&&e.kind==='fang'));r.combat.remove(kids[0]);r.state.stop=0;r.tick();assert.equal(r.state.wave.phase,'combat');r.combat.remove(kids[1]);r.state.stop=0;r.tick();assert.equal(r.state.wave.phase,'return');
 }finally{r.dispose();}
});
