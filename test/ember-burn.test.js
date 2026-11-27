import test from 'node:test';
import assert from 'node:assert/strict';
import {createCanvas} from '@napi-rs/canvas';
import {createEmberBurn,EMBER,burnEligible,emberStudy} from '../src/ember-burn.js';
import {equipmentRules,ITEMS,normalizeEquipment} from '../src/equipment.js';
import {PART_PERKS} from '../src/part-perks.js';
import {primaryWidth} from '../src/primary-width.js';
import {powerReadout} from '../src/power-readout.js';
import {createRun} from '../src/run.js';
import {placePlayer,stopPlayer} from '../src/physics.js';
import {createCombatSourceTrace} from '../src/combat-source-trace.js';
import {shopStudy,shopItems} from '../src/shop-catalog.js';
import {playerCanvas,shopAbility} from '../src/shop-language.js';
import {drawShopItemStudy,drawEmberBurn} from '../src/art/splatr-art-engine.js';
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-8,`${a} != ${b}`),target=(id,x=0,y=0,kind='bastion',hp=10)=>({id,x,y,kind,hp});
function fixture(extra={},observe=false){
 const events=[],trace=observe?createCombatSourceTrace(4096):null,r=createRun(77,(type,data)=>events.push({type,data}),{waveMode:true,equipment:{dash:'dash-fire',...extra},combatSourceTrace:trace});
 for(const e of [...r.combat.enemies.values()])r.combat.remove(e);Object.assign(r.state,{phase:'playing',opening:null,inputLock:false,invul:99999});r.state.wave.entry=0;
 placePlayer(r.world,{x:-350,y:-400});stopPlayer(r.world);r.world.grounded=false;r.combat.add({id:'sentinel',kind:'fang',x:700,y:-900,pinned:true,delay:999999});
 const add=(id='armor',kind='bastion',x=-320,y=-400,hp=10)=>{const e=r.combat.add({id,kind,x,y,pinned:true,delay:999999});e.hp=hp;return e;};
 const shot=()=>{r.state.inputLock=false;r.state.edge=3;assert.equal(r.dash({x:42,y:0,power:1}),true);};
 const tickAt=now=>{r.world.clock=now;r.state.stop=1;r.combat.contacts.clear();r.state.blade=0;r.tick();};
 const hit=e=>{r.combat.contacts.add(e);r.state.stop=1;r.tick();};
 return {r,events,trace,add,shot,tickAt,hit};
}
test('Ember atomically replaces old duration, narrows after width cap and has honest searchable player receipts',()=>{
 const r=equipmentRules({dash:'dash-fire'}),b=equipmentRules({});assert.equal(PART_PERKS['dash-fire'].stat,'ignite');assert.equal(r.bladeExtra,b.bladeExtra);assert.equal(r.emberBurn,true);assert.equal(r.dashNarrowing,.9);
 near(primaryWidth(0,r).width,.9);near(primaryWidth(0,equipmentRules({head:'samurai',core:'magnet',dash:'dash-fire'}),{widthScale:.9}).width,1.2*.9*.9);
 assert.match(powerReadout('dash-fire').detail,/2 delayed fire hits/);assert.match(powerReadout('dash-fire').detail,/10% narrower/);assert.doesNotMatch(powerReadout('dash-fire').detail,/0.03s longer/);assert.ok(shopItems('dash',{query:'fire hits'}).some(i=>i.id==='dash-fire'));
 assert.match(shopAbility('dash-fire').limit,/bosses resist/);
});
test('first eligible primary admits surviving center plus nearest two distinct nonboss targets within56 and static sight',()=>{
 const b=createEmberBurn(),center=target('center'),a=target('a',30),tie=target('b',0,30),far=target('far',57),blocked=target('wall',-30),boss=target('boss',2,0,'monolith'),paper={...target('paper',1),paper:true},protectedActor={...target('tutorial',1),tutorialProtected:true};
 assert.deepEqual(b.ignite(center,{primary:true}),[],'no launch, no ignition');b.launch(1);assert.deepEqual(b.ignite(center,{primary:false,enemies:[a]}),[]);assert.equal(b.view().spent,false);assert.deepEqual(b.ignite(boss,{primary:true}),[]);assert.equal(b.view().spent,false);
 const accepted=b.ignite(center,{primary:true,enemies:[tie,far,a,blocked,boss,paper,protectedActor],geometry:[{x:-20,y:-5,w:2,h:10}]});assert.deepEqual(accepted.map(e=>e.id),['center','a','b']);assert.equal(b.view().spent,true);assert.deepEqual(b.ignite(far,{primary:true}),[]);assert.ok(!boss.emberBurn&&!paper.emberBurn&&!blocked.emberBurn);b.clear();assert.equal(center.emberBurn,undefined);
});
test('inclusive56 range, killed-primary neighbor admission, protected kinds and finite fixed capacity',()=>{
 const b=createEmberBurn(),center=target('c',0,0,'fang',0),edge=target('edge',56);b.launch(1);assert.deepEqual(b.ignite(center,{primary:true,enemies:[edge]}),[edge]);assert.equal(center.emberBurn,undefined);b.clear();
 for(const kind of ['monolith','unknown'])assert.equal(burnEligible(target(kind,0,0,kind)),false);
 const all=[];for(let i=0;i<EMBER.maxTargets+2;i++){const t=target(String(i),i*100);all.push(t);b.launch(i);b.ignite(t,{primary:true});}assert.equal(b.view().targets,24);assert.equal(all.at(-1).emberBurn,undefined);b.clear();assert.ok(all.every(t=>!t.emberBurn));
});
test('absolute18/36 deadlines fire once across fractional, repeated and large steps; expiry is finite',()=>{
 const b=createEmberBurn(),t=target('t'),map=new Map([[t.id,t]]),hits=[];b.launch(1);b.ignite(t,{primary:true,now:10});
 for(const now of [10,10.5,27.999])b.step(now,map,(_e,u)=>hits.push(u.index));assert.deepEqual(hits,[]);b.step(28,map,(_e,u)=>hits.push(u.index));b.step(28,map,()=>assert.fail('repeat'));assert.deepEqual(hits,[0]);b.step(45.9,map,()=>assert.fail('early'));b.step(46.25,map,(_e,u)=>hits.push(u.index));b.step(100,map,()=>assert.fail('expired'));assert.deepEqual(hits,[0,1]);assert.equal(t.emberBurn,undefined);assert.equal(b.view().targets,0);
 b.launch(2);b.ignite(t,{primary:true,now:100});b.step(200,map,(_e,u)=>hits.push(u.index));assert.deepEqual(hits,[0,1,0,1]);
});
test('new launches cannot stack/refresh active burns or redirect them to a reused target ID',()=>{
 const b=createEmberBurn(),t=target('t'),map=new Map([[t.id,t]]);b.launch(1);b.ignite(t,{primary:true,now:0});const status=t.emberBurn;b.launch(2);assert.deepEqual(b.ignite(t,{primary:true,now:17}),[]);assert.equal(t.emberBurn,status);assert.equal(status.expires,36);
 const replacement=target('t');map.set('t',replacement);b.step(18,map,()=>assert.fail('generation leak'));assert.equal(t.emberBurn,undefined);assert.equal(replacement.emberBurn,undefined);assert.equal(b.view().targets,0);
 b.launch(3);b.ignite(replacement,{primary:true,now:20});b.step(38,map,e=>{e.hp=0;map.delete(e.id);});b.step(56,map,()=>assert.fail('dead'));assert.equal(b.view().targets,0);
});
test('real first contact ignites after direct damage; boss/second contact/secondary sources cannot create burns',()=>{
 const f=fixture();try{f.shot();const boss=f.add('boss','monolith',-300,-400);f.hit(boss);assert.equal(f.r.emberStatus().spent,false);const a=f.add();f.hit(a);assert.equal(a.hp,9);assert.ok(a.emberBurn);const b=f.add('second','bastion',-250,-400);f.hit(b);assert.equal(b.emberBurn,undefined);assert.equal(f.events.filter(e=>e.type==='emberIgnite').length,1);}finally{f.r.dispose();}
 const g=fixture();try{g.shot();const e=g.add('echo','bastion',-500,-500);g.r.state.equipmentFx.echoes.push({x:-500,y:-500,ticks:30,hits:new Set(),sourceId:'none'});g.tickAt(1);assert.equal(e.hp,9);assert.equal(e.emberBurn,undefined);assert.equal(g.r.emberStatus().spent,false);}finally{g.r.dispose();}
});
test('real burn units bypass current-shot dedup but do not mutate direct-hit dedup or scale with Drive/kinetic',()=>{
 const f=fixture({eyes:'sniper',head:'crown'});try{f.shot();const e=f.add();f.hit(e);const before=e.hp,last=e.lastSlash,born=e.emberBurn.born;assert.equal(before,7);f.r.state.drive=100;f.r.state.kineticStage=4;f.r.state.arenaMode='SHATTERED';f.tickAt(born+17.99);assert.equal(e.hp,before);f.tickAt(born+18);assert.equal(e.hp,before-1);assert.equal(e.lastSlash,last);f.tickAt(born+36);assert.equal(e.hp,before-2);assert.equal(e.lastSlash,last);assert.equal(e.emberBurn,undefined);assert.equal(f.events.filter(e=>e.type==='emberHit').length,2);}finally{f.r.dispose();}
});
test('burn kills earn ordinary kills/score/credits once but no primary chain, EDGE/focus/blade, pulse charge or recursive procs',()=>{
 const f=fixture({head:'coil',core:'echo',tail:'spectrum'});try{f.shot();const e=f.add('victim','bastion',-320,-400,2);f.hit(e);assert.equal(e.hp,1);const born=e.emberBurn.born;Object.assign(f.r.state,{edge:1,focus:.3,chain:5,chainTime:100,blade:0,drive:0,swordCharge:0,swordContacts:0});
  const before={edge:1,chain:5,shots:f.r.state.shots,kills:f.r.state.kills,credits:f.r.state.killLedger?.credits||0};f.tickAt(born+18);
  assert.equal(f.r.combat.enemies.has(e.id),false);assert.equal(f.r.state.kills,before.kills+1);assert.ok(f.r.state.score>0);assert.equal(f.r.state.killLedger.credits,before.credits+4);assert.equal(f.r.state.edge,before.edge);assert.equal(f.r.state.chain,before.chain);assert.ok(f.r.state.focus<.4);assert.equal(f.r.state.blade,0);assert.equal(f.r.state.drive,0);assert.equal(f.r.state.swordCharge,0);assert.equal(f.r.state.swordContacts,0);assert.equal(f.r.state.equipmentFx.echoes.length,0);assert.equal(f.events.filter(e=>e.type==='spectrumRefill'||e.type==='blazeRefill'||e.type==='drive').length,0);
  f.tickAt(born+40);assert.equal(f.r.state.kills,before.kills+1);assert.equal(f.events.filter(e=>e.type==='cut'&&e.data.sourceKind==='ember-burn').length,1);
 }finally{f.r.dispose();}
});
test('burn uses world time, never hitstop calls; retirement, teaching and wave exit clean all status',()=>{
 for(const cleanup of ['retire','teaching','wave']){const f=fixture();try{f.shot();const e=f.add();f.hit(e);const hp=e.hp;for(let i=0;i<30;i++){f.r.state.stop=1;f.r.tick();}assert.equal(e.hp,hp,'frozen clock cannot pay burn');if(cleanup==='retire')f.r.retire();else if(cleanup==='teaching'){f.r.state.teachingArena=true;f.tickAt(20);}else{f.r.state.wave.platform={x:-500,y:200,w:300,h:24};f.r.state.wave.phase='return';f.tickAt(20);}assert.equal(e.emberBurn,undefined);assert.equal(f.r.emberStatus().targets,0);}finally{f.r.dispose();}}
});
test('observed burn sources retain launch parent/shot and distinct unit hits across a later launch; observation is passive',()=>{
 const run=observed=>{const f=fixture({},observed);try{f.shot();const e=f.add();f.hit(e);const born=e.emberBurn.born;f.shot();f.tickAt(born+18);f.tickAt(born+36);return {hp:e.hp,kills:f.r.state.kills,score:f.r.state.score,sources:f.trace?.entries()||[],events:f.events.filter(e=>e.type==='emberHit').map(e=>e.data)};}finally{f.r.dispose();}};
 const a=run(false),b=run(true);assert.deepEqual({...a,sources:[]},{...b,sources:[]});const hits=b.sources.filter(e=>e.type==='cut-result'&&e.sourceKind==='ember-burn');assert.equal(hits.length,2);assert.ok(hits.every(e=>e.accepted&&e.secondary&&e.fromShear&&e.sourceShotId===1&&e.shotId===2&&e.parentSourceId));assert.equal(hits[0].sourceId,hits[1].sourceId);
});
test('lesson executes the same spread/deadline ledger and burn rendering is bounded, state-safe and reduced-motion stable',()=>{
 const before=emberStudy(0,false),first=emberStudy(18/42,true),last=emberStudy(1,true);assert.equal(before.accepted.length,0);assert.deepEqual(first.accepted,['armor','near-a','near-b']);assert.equal(first.hits.length,3);assert.equal(last.hits.length,4);assert.ok(last.targets.filter(t=>['blocked','boss','far'].includes(t.id)).every(t=>!t.burning));
 const it=ITEMS.find(i=>i.id==='dash-fire'),eq=normalizeEquipment({dash:it.id}),draw=(time,motion)=>{const cv=createCanvas(640,400),c=playerCanvas(cv.getContext('2d'));drawShopItemStudy(c,640,400,{equipment:eq,study:shopStudy(it,time,motion,eq)});return cv.toBuffer('image/png');};assert.notDeepEqual(draw(0,true),draw(2400,true));assert.deepEqual(draw(0,false),draw(9999,false));
 const cv=createCanvas(100,100),c=cv.getContext('2d'),status=Object.freeze({born:0,expires:36,lastHit:18});c.globalAlpha=.5;c.translate(2,3);const matrix=c.getTransform();drawEmberBurn(c,{x:50,y:50,radius:20,status,now:18,motion:false});assert.deepEqual(c.getTransform(),matrix);assert.equal(c.globalAlpha,.5);assert.deepEqual(status,{born:0,expires:36,lastHit:18});
});
