import test from 'node:test';
import assert from 'node:assert/strict';
import {runCoaching} from '../src/run-coach.js';
import {recommendWaveOffer} from '../src/encounters.js';
import {WAVE_BUFFS} from '../src/waves.js';
test('one contextual practice action follows measured run milestones, without recipes or purchase pressure',()=>{
 const base={shots:10,kills:5};for(const [extra,id]of [[{},'pace'],[{kills:0},'contact'],[{shots:0},'launch'],[{bestPace:100},'steer'],[{breakthrough:{paceReady:true}},'bank'],[{breakthrough:{sonic:true}},'breach'],[{shatters:1},'experiment'],[{sword:{family:'echo'}},'echo'],[{sword:{family:'pulse',chargeMax:3},swordCharge:2},'pulse']]){const s={...base,...extra},before=JSON.stringify(s),r=runCoaching(s);assert.equal(r.id,id);assert.ok(r.evidence&&r.action);assert.ok(r.text.length<260);assert.equal(JSON.stringify(s),before);assert.doesNotMatch(r.text,/buy|recipe|ingredients|must purchase/i);}
});
test('invalid telemetry does not produce NaN/Infinity or fabricate diagnoses',()=>{
 for(const n of [NaN,Infinity,-100,undefined]){const r=runCoaching({shots:n,kills:n,bestPace:n,shatters:n});assert.equal(r.id,'launch');assert.doesNotMatch(r.text,/NaN|Infinity/);}
});
test('rest recommendations use observed hits and launch counts, while urgent ward and armor counters retain priority',()=>{
 const find=id=>WAVE_BUFFS.find(b=>b.id===id);
 const report={hits:2,shots:20,cuts:5};const a=recommendWaveOffer(['reach','guard','bounty'].map(find),{hp:2,previous:report});assert.equal(a.id,'guard');assert.match(a.reason,/2 hull lost/);
 const b=recommendWaveOffer(['linger','fleet','bounty'].map(find),{hp:2,previous:report});assert.equal(b.id,'linger');assert.match(b.reason,/20 launches for 5 cuts/);
 assert.equal(recommendWaveOffer(['breaker','guard','barrier'].map(find),{hp:1,next:{counts:{bastion:2}},previous:report}).id,'barrier');
 assert.equal(recommendWaveOffer(['breaker','guard','bounty'].map(find),{hp:3,next:{counts:{bastion:2}},previous:report}).id,'breaker');
});
