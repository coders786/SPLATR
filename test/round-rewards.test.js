import test from 'node:test';
import assert from 'node:assert/strict';
import {roundReward,CURRENCY} from '../src/round-rewards.js';
test('every round has guaranteed CREDITS, independent of quests',()=>{
 assert.equal(CURRENCY,'CREDITS');assert.equal(roundReward().total,10);
 assert.deepEqual(roundReward({kills:11,score:2700,band:3}),{base:10,cuts:22,score:10,sectors:10,total:52});
});
test('round pay is bounded, integral, immutable and ignores invalid outcomes',()=>{
 assert.equal(roundReward({kills:1e12,score:1e12,band:1000}).total,320);
 assert.equal(roundReward({kills:NaN,score:Infinity,band:-7}).total,10);
 const s=Object.freeze({kills:3,score:1050,band:2});assert.equal(roundReward(s).total,25);assert.ok(Object.isFrozen(roundReward(s)));
});
