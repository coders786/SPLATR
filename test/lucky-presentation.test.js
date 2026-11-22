import test from 'node:test';import assert from 'node:assert/strict';import {buffPresentation,BUFF_PRESENTATION} from '../src/buff-presentation.js';import {waveOffers} from '../src/waves.js';
test('lucky stat presentation derives from applied numbers, not stale labels',()=>{
 for(const [id,properties,expected]of [['fleet',{speed:1.25},'Speed +25%'],['reach',{reach:1.3},'Reach +30%'],['bounty',{score:1.4},'Score +40%'],['linger',{blade:12},'Slash time +0.20s'],['guard',{guard:12},'Exit window +0.20s']]){
 const buff=Object.freeze({id,...properties,lucky:true,luckyStat:'WRONG'}),copy=buffPresentation(buff);assert.equal(copy.stat,expected);assert.equal(copy.name,BUFF_PRESENTATION[id].name);assert.ok(copy.accessibleName.includes('Lucky'));assert.equal(copy.usualStat,BUFF_PRESENTATION[id].stat);}
});
test('actual seeded offers share correct lucky labels and unchanged ordinary copy',()=>{
 const ids=new Set();for(let seed=0;seed<300;seed++)for(const b of waveOffers(seed,4)){const copy=buffPresentation(b);assert.equal(copy.lucky,!!b.lucky);if(b.lucky){ids.add(b.id);assert.equal(copy.stat,b.luckyStat);}else{assert.equal(copy.stat,BUFF_PRESENTATION[b.id].stat);assert.equal(copy.cost,BUFF_PRESENTATION[b.id].cost);}}assert.equal(ids.size,5);assert.equal(buffPresentation({id:'invalid'}),null);
});
