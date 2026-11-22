import test from 'node:test';
import assert from 'node:assert/strict';
import {QUESTS,proceduralOffers,questInstruction,createTicket,loadProfile} from '../src/quests.js';
test('seeded contracts are reproducible, diverse and preserve category/tier coverage',()=>{
 const signatures=new Set();
 for(let seed=1;seed<=100;seed++){
  const a=proceduralOffers({seed,bestBand:5}),b=proceduralOffers({seed,bestBand:5});assert.deepEqual(a,b);
  assert.equal(new Set(a.flat().map(q=>q.id)).size,9);signatures.add(a.flat().map(q=>q.id).join(','));
  for(const [i,category]of ['SMASH','STYLE','CLIMB'].entries())assert.deepEqual(a[i].map(q=>[q.category,q.tier]),[0,1,2].map(t=>[category,t]));
 }
 assert.ok(signatures.size>80);
 for(const q of QUESTS){assert.ok(q.label.split(' ').length<=4);assert.ok(questInstruction(q).length>8);assert.ok(Object.isFrozen(q));}
});
test('contracts avoid recent offers when alternatives exist and gate late species for beginners',()=>{
 const first=proceduralOffers({seed:21,bestBand:1});assert.ok(first.flat().every(q=>!['crown','fork'].includes(q.target)));
 const recent=first.flat().map(q=>q.id),second=proceduralOffers({seed:21,bestBand:1,recent});
 for(const col of second)for(const q of col){const pool=QUESTS.filter(x=>x.category===q.category&&x.tier===q.tier&&!['crown','fork'].includes(x.target));if(pool.some(x=>!recent.includes(x.id)))assert.ok(!recent.includes(q.id));}
});
test('power quests require real cuts after committed power, not aiming, fragments, tutorial or empty launches',()=>{
 const t=createTicket(['cut8','fast3','air8'],'halo',loadProfile('{}'));
 for(let i=0;i<20;i++)t.event('dash',{power:1});assert.equal(t.rows[1].value,0);
 t.event('cut',{kind:'fang',small:true});t.event('cut',{kind:'fang',paper:true});t.event('cut',{kind:'fang'},false);assert.equal(t.rows[1].value,0);
 t.event('dash',{power:.5});t.event('cut',{kind:'fang'});assert.equal(t.rows[1].value,0);
 t.event('dash',{power:1});for(let i=0;i<3;i++)t.event('cut',{kind:'fang'});assert.equal(t.rows[1].done,true);assert.equal(t.rows[0].value,4);
});
test('new contract Head Starts retain stable IDs and cannot farm prize progress on retry',()=>{
 const p=loadProfile('{}');let t=createTicket(['cut8','fast3','air8'],'halo',p);
 for(let i=0;i<6;i++)t.event('cut',{kind:'fang'});assert.ok(t.die().saved>0);
 for(let i=0;i<5;i++){t=createTicket(['cut8','fast3','air8'],'halo',p);assert.equal(t.rows[0].value,3);assert.equal(t.die().saved,0);}
});
