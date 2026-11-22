import test from 'node:test';import assert from 'node:assert/strict';
import {planEncounter,encounterBrief} from '../src/encounters.js';import {waveOffers,WAVE_BUFFS} from '../src/waves.js';
test('seeded drafts vary roles and match the actual next-wave briefing',()=>{
 const drafts=new Set();for(let seed=0;seed<200;seed++)for(let wave=1;wave<=30;wave++){
 const p=planEncounter(seed,wave);assert.deepEqual(p.counts,encounterBrief(wave,seed).counts);assert.equal(p.total,Math.min(30,12+(wave-1)*3));assert.equal(Object.values(p.counts).reduce((a,b)=>a+b,0),p.total);assert.ok(p.counts.fang>=5);assert.equal(p.counts.crown||0,wave%5===0?1:0);if(wave===4)drafts.add(JSON.stringify(p.counts));
 }assert.ok(drafts.size>=4);assert.deepEqual(planEncounter(56,7),planEncounter(56,7));
});
test('welcome luck is reproducible, bounded, optional and leaves the catalogue untouched',()=>{
 let lucky=0,ordinary=0;const before=JSON.stringify(WAVE_BUFFS);
 for(let seed=0;seed<500;seed++)for(let wave=1;wave<10;wave++){
 const offers=waveOffers(seed,wave);assert.deepEqual(offers,waveOffers(seed,wave));assert.equal(new Set(offers.map(b=>b.id)).size,3);
 for(const b of offers){assert.ok(Object.isFrozen(b));if(b.lucky){lucky++;assert.ok(b.luckyStat);assert.ok(['fleet','reach','guard','linger','bounty'].includes(b.id));assert.ok((b.speed||1)<=1.25);assert.ok((b.reach||1)<=1.3);}else ordinary++;}
 }assert.ok(lucky>100&&ordinary>lucky);assert.equal(JSON.stringify(WAVE_BUFFS),before);
});
