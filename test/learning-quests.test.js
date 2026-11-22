import test from 'node:test';
import assert from 'node:assert/strict';
import {learningOffers,createTicket,loadProfile,questInstruction} from '../src/quests.js';
test('procedural teaching is deterministic, varied, reachable and low stakes',()=>{
 const seen=new Set();for(let seed=1;seed<=40;seed++){
 const a=learningOffers({seed});assert.deepEqual(a,learningOffers({seed}));seen.add(a.flat().map(q=>q.id).join());
 assert.deepEqual(a.flat().map(q=>q.kind),['any','power','waveClear']);
 for(const q of a.flat()){assert.ok(q.points<=3);assert.ok(q.label.split(' ').length<=4);assert.ok(questInstruction(q).length>30);}
 }assert.ok(seen.size>5);
});
test('only demonstrated live skills unlock the next lesson; purchases and deaths cannot skip',()=>{
 const p=loadProfile('{}'),a=learningOffers({seed:2,learned:p.learned}),t=createTicket(a.flat().map(q=>q.id),'halo',p);
 for(let i=0;i<20;i++){t.event('dash',{power:1});t.event('cut',{kind:'fang',small:true});t.event('waveClear',{},false);}assert.deepEqual(p.learned,{SMASH:0,STYLE:0,CLIMB:0});
 for(let i=0;i<6;i++)t.event('cut',{kind:'fang'});t.event('waveClear');assert.deepEqual(p.learned,{SMASH:1,STYLE:1,CLIMB:1});
 assert.deepEqual(learningOffers({learned:p.learned}).flat().map(q=>q.kind),['cut','cleanBank','waveRest']);
 const reloaded=loadProfile(JSON.stringify(p));assert.deepEqual(reloaded.learned,p.learned);
 const next=createTicket(learningOffers({learned:reloaded.learned}).flat().map(q=>q.id),'halo',reloaded);assert.ok(next.rows.every(q=>q.value===0));
});
test('rest lesson requires real rest event and persisted mastery is bounded',()=>{
 const p=loadProfile('{"learned":{"SMASH":999,"STYLE":-2,"CLIMB":1}}');assert.deepEqual(p.learned,{SMASH:3,STYLE:0,CLIMB:1});
 const t=createTicket(learningOffers({learned:p.learned}).flat().map(q=>q.id),'halo',p),rest=t.rows.find(q=>q.kind==='waveRest');
 t.event('waveClear');assert.equal(rest.value,0);t.event('waveRest',{},false);assert.equal(rest.value,0);t.event('waveRest');assert.equal(rest.done,true);
});
test('clean-bank lesson ignores generic contacts, tutorials and floor recovery',()=>{
 const p=loadProfile('{"learned":{"STYLE":1}}'),t=createTicket(learningOffers({learned:p.learned}).flat().map(q=>q.id),'halo',p),row=t.rows.find(q=>q.kind==='cleanBank');
 assert.ok(row);for(let i=0;i<20;i++){t.event('bank');t.event('floorKick');t.event('cleanBank',{},false);}assert.equal(row.value,0);
 for(let i=0;i<row.goal;i++)t.event('cleanBank',{side:'right'});assert.equal(row.done,true);assert.equal(p.learned.STYLE,2);
});
