import test from 'node:test';
import assert from 'node:assert/strict';
import {createCanvas} from '@napi-rs/canvas';
import {createVoidWell,voidMove,voidEligible,VOID} from '../src/void-well.js';
import {voidStudy} from '../src/void-study.js';
import {equipmentRules,ITEMS,loadEquipment} from '../src/equipment.js';
import {createRun} from '../src/run.js';
import {placePlayer,stopPlayer} from '../src/physics.js';
import {createCombatSourceTrace} from '../src/combat-source-trace.js';
import {PART_PERKS,perkScoreMultiplier} from '../src/part-perks.js';
import {shopAbility,playerCanvas} from '../src/shop-language.js';
import {shopStudy,shopItems} from '../src/shop-catalog.js';
import {powerReadout} from '../src/power-readout.js';
import {drawVoidField,drawVoidLaunch,drawVoidReadiness,drawShopItemStudy} from '../src/art/splatr-art-engine.js';
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-8,`${a} != ${b}`),enemy=(id='e',x=0,y=0,kind='bastion',hp=10)=>({id,x,y,kind,hp,r:4}),mapOf=(...e)=>new Map(e.map(t=>[t.id,t]));
const setup=()=>{const well=createVoidWell(),e=enemy(),map=mapOf(e);well.launch(1);return {well,e,map};};
function fixture(extra={},observed=false){const events=[],trace=observed?createCombatSourceTrace(4096):null,r=createRun(77,(type,data)=>events.push({type,data}),{waveMode:true,equipment:{dash:'dash-void',...extra},combatSourceTrace:trace});
 for(const e of [...r.combat.enemies.values()])r.combat.remove(e);Object.assign(r.state,{phase:'playing',opening:null,inputLock:false,invul:99999});r.state.wave.entry=0;placePlayer(r.world,{x:-350,y:-400});stopPlayer(r.world);r.world.grounded=false;r.combat.add({id:'sentinel',kind:'fang',x:700,y:-900,pinned:true,delay:999999});
 const add=(id='armor',kind='bastion',x=-320,y=-400,hp=10)=>r.combat.add({id,kind,x,y,hp,delay:999999});
 const shot=()=>{r.state.inputLock=false;r.state.edge=3;assert.equal(r.dash({x:30,y:0,power:30/42}),true);};
 const hit=e=>{r.combat.contacts.add(e);r.state.stop=1;r.tick();};const at=now=>{r.world.clock=now;r.state.blade=0;r.state.stop=1;r.combat.contacts.clear();r.tick();};return {r,events,trace,add,shot,hit,at};}

test.skip('[retired cosmetic power] Void replaces armor-score atomically; no other rule bonus is silently added',()=>{
 const r=equipmentRules({dash:'dash-void'}),b=equipmentRules({});assert.equal(r.voidWell,true);assert.equal(PART_PERKS['dash-void'].stat,'collapse');assert.equal(perkScoreMultiplier(r.scorePerks,{kind:'bastion'}),1);
 for(const key of ['dashSpeed','bladeExtra','cutWidth','dashNarrowing','edgeMax','armorDamage','healthMax','focusDrain','focusRegen','chainGrace'])assert.equal(r[key],b[key],key);
 assert.match(powerReadout('dash-void').detail,/small center/);assert.match(shopAbility('dash-void').limit,/No extra score for defeating armor/);assert.ok(shopItems('dash',{query:'pull field'}).some(i=>i.id==='dash-void'));
});
test('no launch, secondary or ineligible direct contact can place a field',()=>{
 const w=createVoidWell(),e=enemy();assert.equal(w.contact(e,{primary:true}),null);w.launch(1);assert.equal(w.contact(e),null);
 for(const changes of [{kind:'monolith'},{kind:'unknown'},{pinned:true},{paper:true},{tutorialTargetPlayer:true},{tutorialProtected:true}]){assert.equal(voidEligible({...e,...changes}),false);assert.equal(w.contact({...e,...changes},{primary:true}),null);}
 assert.equal(w.view().spent,false);assert.ok(w.contact(e,{primary:true,enemies:[e]}));assert.equal(w.view().spent,true);assert.equal(w.contact(enemy('other'),{primary:true}),null);
});
test('one fixed-origin field selects at most three nearest sight-clear eligible survivors, stable ties and inclusive110',()=>{
 const {well:w,e}=setup(),a=enemy('a',60),b=enemy('b',0,60),edge=enemy('edge',110),outside=enemy('outside',110.001),blocked=enemy('blocked',-20),boss=enemy('boss',1,0,'monolith');
 const f=w.contact(e,{primary:true,enemies:[b,edge,blocked,outside,a,boss,e],geometry:[{x:-12,y:-4,w:3,h:8}]});assert.deepEqual(f.targets.map(e=>e.id),['e','a','b']);assert.equal(f.x,0);assert.equal(f.y,0);assert.equal(f.radius,110);assert.equal(f.core,28);
 w.clear();w.launch(2);e.hp=0;const second=w.contact(e,{primary:true,enemies:[edge,outside,boss]});assert.deepEqual(second.targets.map(t=>t.id),['edge']);
});
test('a killed primary may supply origin; no survivors still creates an honest empty field, not a phantom victim',()=>{
 const {well:w,e}=setup();e.hp=0;const f=w.contact(e,{primary:true,enemies:[]});assert.equal(f.targets.length,0);assert.equal(f.phase,'pull');assert.equal(w.finish(18,new Map(),()=>assert.fail()),true);assert.equal(w.view(18).hits,0);
});
test('new launch cannot evict or refresh accepted field; cooldown is36 from admission, denial spends that shot',()=>{
 const {well:w,e,map}=setup();const f=w.contact(e,{primary:true,now:10,enemies:map.values()});w.launch(2);assert.equal(w.contact(enemy('later',20),{primary:true,now:20,enemies:map.values()}),null);assert.equal(w.view(20).id,f.id);assert.equal(w.view(20).born,10);w.finish(28,map,()=>{});w.launch(3);assert.equal(w.contact(e,{primary:true,now:45.99,enemies:map.values()}),null);assert.equal(w.contact(e,{primary:true,now:46,enemies:map.values()}),null,'denied first contact spends same shot');w.launch(4);assert.ok(w.contact(e,{primary:true,now:46,enemies:map.values()}));
});
test('one pulse after18 world units, never hitstop calls or repeated finish; outer targets never receive damage',()=>{
 const {well:w,e}=setup(),inner=enemy('in',28),outer=enemy('out',28.001),map=mapOf(e,inner,outer),hits=[];w.contact(e,{primary:true,enemies:map.values()});for(let i=0;i<20;i++)assert.equal(w.finish(0,map,()=>assert.fail()),false);assert.equal(w.finish(17.999,map,()=>assert.fail()),false);assert.equal(w.finish(18,map,t=>hits.push(t.id)),true);w.finish(18,map,()=>assert.fail('duplicate'));w.finish(50,map,()=>assert.fail('duplicate'));assert.deepEqual(hits,['e','in']);
});
test('only admitted generations inside core at expiry can be hit: no late-target capture, stale ID or moved-out victim',()=>{
 const {well:w,e}=setup(),a=enemy('a',20),b=enemy('b',25),map=mapOf(e,a,b);w.contact(e,{primary:true,enemies:map.values()});e.x=80;map.set(a.id,enemy(a.id,0));const late=enemy('late',0);map.set(late.id,late);const hits=[];w.finish(18,map,t=>hits.push(t.id));assert.deepEqual(hits,['b']);assert.equal(w.view(18).hits,1);
});
test('walls and bosses block expiry damage; no early payout on clear/dispose or removal',()=>{
 const {well:w,e,map}=setup();w.contact(e,{primary:true,enemies:map.values()});assert.equal(w.finish(18,map,()=>assert.fail('wall'),[{x:-1,y:-1,w:2,h:2}]),true);w.clear();w.launch(2);w.contact(e,{primary:true,enemies:map.values()});w.clear();w.finish(100,map,()=>assert.fail('cancel'));assert.equal(w.view(100).phase,'ready');w.launch(3);w.contact(e,{primary:true,enemies:map.values()});map.delete(e.id);w.finish(18,map,()=>assert.fail('removed'));assert.equal(w.view(18).targets.length,0);
});
test('continuous pull integrates fractional/large intervals once, max32 each; fixed center never follows player/target',()=>{
 for(const dt of [.25,.5,1,18,100]){const {well:w,e}=setup(),n=enemy('n',80),map=mapOf(e,n);w.contact(e,{primary:true,enemies:map.values()});for(let now=0;now<18;now+=dt)w.move(now,dt,map);near(n.x,48);near(w.view(18).targets.find(t=>t.id==='n').moved,32);w.move(0,100,map);near(n.x,48);assert.equal(w.view(18).x,0);assert.equal(w.view(18).y,0);}
});
test('zero/invalid dt, frozen targets and exhausted force produce no movement, no NaN and no hidden catchup',()=>{
 const {well:w,e}=setup(),n=enemy('n',80),map=mapOf(e,n);w.contact(e,{primary:true,enemies:map.values()});for(const dt of [0,-1,NaN,Infinity])w.move(0,dt,map);assert.equal(n.x,80);w.move(0,9,map,{motionScale:()=>0});assert.equal(n.x,80);w.move(9,9,map);near(n.x,64);near(w.view(18).targets.find(t=>t.id==='n').moved,16);
});
test('pull respects swept solids with body radius, arena borders and post leash even under a huge step',()=>{
 const e={...enemy('e',50),r:5};const p=voidMove(e,-100,0,{geometry:[{x:10,y:-20,w:2,h:40}]});assert.ok(p.x>17&&p.x<17.01);assert.equal(p.y,0);const border=voidMove(e,-100,0,{arena:{x:0,y:-100,w:200,h:200}});near(border.x,5);
 const leash=voidMove({...e,postX:160,postY:0},-10,0);near(leash.x,50);const towardHome=voidMove({...e,postX:170,postY:0},10,0);near(towardHome.x,60);
 const diagonal=voidMove({...e,x:60,y:60,postX:0,postY:0},100,100);near(Math.hypot(diagonal.x,diagonal.y),110);
});
test('new static blocker stops continuous pull; actual displacement budget counts movement not requested force',()=>{
 const {well:w,e}=setup(),n=enemy('n',80),map=mapOf(e,n);w.contact(e,{primary:true,enemies:map.values()});w.move(0,9,map,{geometry:[{x:40,y:-10,w:2,h:20}]});assert.equal(n.x,80);assert.equal(w.view(9).targets.find(t=>t.id==='n').moved,0);w.move(9,9,map);near(n.x,64);
});
test('pull does not chase targets outside110 or replace a removed victim; view snapshots are immutable and pruned',()=>{
 const {well:w,e}=setup(),n=enemy('n',80),map=mapOf(e,n);const f=w.contact(e,{primary:true,enemies:map.values()});n.x=120;w.move(0,1,map);assert.equal(n.x,120);assert.equal(w.owns(n,0),false);map.delete(n.id);w.finish(1,map,()=>assert.fail());assert.deepEqual(w.view(1).targets.map(e=>e.id),['e']);assert.equal(f.targets.length,2);assert.ok(Object.isFrozen(f.targets[0]));
});
test('pulse consumes admission before callbacks; reentrant finish cannot hit twice and original shot/source survive launches',()=>{
 const {well:w,e,map}=setup(),source=Object.freeze({id:'original'});w.contact(e,{primary:true,enemies:map.values(),makeSource:()=>source});w.launch(2);let hits=0;w.finish(18,map,(_e,u)=>{hits++;assert.equal(u.shot,1);assert.equal(u.source,source);assert.equal(w.finish(18,map,()=>assert.fail()),false);});assert.equal(hits,1);assert.equal(w.view(18).sourceShot,1);assert.equal(w.view(18).shot,2);
});
test.skip('[retired cosmetic power] real first direct contact admits field; next launch cannot move its origin or refresh it; boss contact cannot admit',()=>{
 const f=fixture();try{f.shot();const e=f.add();f.hit(e);assert.equal(e.hp,9);assert.equal(f.r.voidStatus().phase,'pull');const original=f.r.voidStatus();f.shot();const next=f.add('next','crown',-100,-500);f.hit(next);assert.equal(f.r.voidStatus().x,original.x);assert.equal(f.r.voidStatus().born,original.born);assert.equal(f.events.filter(e=>e.type==='voidOpen').length,1);}finally{f.r.dispose();}
 const b=fixture();try{b.shot();const boss=b.add('boss','monolith',-320,-400);b.hit(boss);assert.equal(b.r.voidStatus().phase,'ready');assert.equal(b.r.voidStatus().spent,false);}finally{b.r.dispose();}
});
test.skip('[retired cosmetic power] real collapse deals exact one secondary armor unit after18, independent of current power, hit dedup or upgraded damage',()=>{
 const f=fixture({eyes:'sniper'});try{f.shot();const e=f.add();f.hit(e);const before=e.hp,last=e.lastSlash,born=f.r.voidStatus().born;Object.assign(f.r.state,{drive:100,kineticStage:4,arenaMode:'SHATTERED'});f.at(born+17.99);assert.equal(e.hp,before);f.at(born+18);assert.equal(e.hp,before-1);assert.equal(e.lastSlash,last);f.at(born+100);assert.equal(e.hp,before-1);assert.equal(f.events.filter(e=>e.type==='voidHit').length,1);assert.equal(f.events.filter(e=>e.type==='voidCollapse').length,1);}finally{f.r.dispose();}
});
test.skip('[retired cosmetic power] collapse kills earn normal credits/score once without chain, EDGE/focus/blade/Drive, Echo/Pulse charge or recursive proc',()=>{
 const f=fixture({head:'coil',core:'echo',tail:'spectrum'});try{f.shot();const e=f.add('victim','bastion',-320,-400,2);f.hit(e);assert.equal(e.hp,1);const born=f.r.voidStatus().born;Object.assign(f.r.state,{edge:1,focus:.3,chain:5,chainTime:100,blade:0,drive:0,swordCharge:0,swordContacts:0});const kills=f.r.state.kills,credits=f.r.state.killLedger.credits;f.at(born+18);
 assert.equal(f.r.combat.enemies.has(e.id),false);assert.equal(f.r.state.kills,kills+1);assert.equal(f.r.state.killLedger.credits,credits+4);assert.ok(f.r.state.score>0);assert.equal(f.r.state.edge,1);assert.equal(f.r.state.chain,5);assert.ok(f.r.state.focus<.4);assert.equal(f.r.state.blade,0);assert.equal(f.r.state.drive,0);assert.equal(f.r.state.swordCharge,0);assert.equal(f.r.state.swordContacts,0);assert.equal(f.r.state.equipmentFx.echoes.length,0);assert.equal(f.events.filter(e=>e.type==='voidOpen').length,1);f.at(born+40);assert.equal(f.r.state.kills,kills+1);
 }finally{f.r.dispose();}
});
test('legacy secondary attacks cannot create a collapse field or consume a primary-contact admission',()=>{
 const f=fixture();try{f.shot();const e=f.add('echo','bastion',-500,-500);f.r.state.equipmentFx.echoes.push({x:-500,y:-500,ticks:30,hits:new Set(),sourceId:'none'});f.at(1);assert.equal(e.hp,9);assert.equal(f.r.voidStatus().spent,false);assert.equal(f.r.voidStatus().phase,'ready');}finally{f.r.dispose();}
});
test.skip('[retired cosmetic power] real movement commits both body and world coordinates; field force is bounded and Grav does not add a second pull',()=>{
 for(const core of ['standard','grav','time']){const f=fixture({core});try{f.shot();const e=f.add(),n=f.add('small','fang',-320,-480,10);n.small=true;f.hit(e);f.r.state.blade=0;placePlayer(f.r.world,{x:-420,y:-400});stopPlayer(f.r.world);if(core==='grav')f.r.focus(true);for(let i=0;i<10;i++){f.r.state.stop=0;f.r.tick();}
 const entry=f.r.voidStatus().targets.find(e=>e.id===n.id);assert.ok(entry.moved>0&&entry.moved<=32);near(n.x,n.body.position.x);near(n.y,n.body.position.y);assert.equal(f.r.state.kills,0);
 }finally{f.r.dispose();}}
});
test('real hitstop cannot spend field life or pull budget; retiring/teaching/wave exit/dispose cancels without pulse',()=>{
 for(const action of ['retire','teaching','wave','dispose']){const f=fixture();try{f.shot();const e=f.add(),n=f.add('neighbor','fang',-320,-480,10);f.hit(e);const initial=f.r.voidStatus();for(let i=0;i<30;i++){f.r.state.stop=1;f.r.tick();}assert.equal(f.r.voidStatus().born,initial.born);assert.equal(n.y,-480);assert.equal(f.events.filter(e=>e.type==='voidCollapse').length,0);
 if(action==='retire')f.r.retire();if(action==='dispose')f.r.dispose();if(action==='teaching'){f.r.state.teachingArena=true;f.at(18);}if(action==='wave'){f.r.state.wave.platform={x:-500,y:200,w:300,h:24};f.r.state.wave.phase='return';f.at(18);}assert.equal(f.r.voidStatus().phase,'ready');assert.equal(f.events.filter(e=>e.type==='voidHit').length,0);
 }finally{f.r.dispose();}}
});
test.skip('[retired cosmetic power] observed source retains original parent/launch across later shot; optional tracing cannot change gameplay',()=>{
 const run=observed=>{const f=fixture({},observed);try{f.shot();const e=f.add();f.hit(e);f.shot();f.at(18);return {hp:e.hp,kills:f.r.state.kills,score:f.r.state.score,events:f.events.filter(e=>e.type==='voidHit'),sources:f.trace?.entries()||[]};}finally{f.r.dispose();}};const a=run(false),b=run(true);assert.deepEqual({...a,sources:[]},{...b,sources:[]});const hit=b.sources.find(e=>e.type==='cut-result'&&e.sourceKind==='void-collapse');assert.ok(hit.accepted&&hit.secondary&&hit.fromShear);assert.equal(hit.sourceShotId,1);assert.equal(hit.shotId,2);assert.ok(hit.parentSourceId);
});
test.skip('[retired cosmetic power] ordinary Fork children and Crown repair survive isolated secondary kill bookkeeping',()=>{
 for(const kind of ['fork','crown']){const f=fixture();try{f.shot();const e=f.add(kind,kind,-320,-400,2);f.hit(e);f.r.state.hp=2;f.at(18);assert.equal(f.r.combat.enemies.has(e.id),false);if(kind==='fork')assert.equal([...f.r.combat.enemies.values()].filter(e=>e.small).length,2);else assert.equal(f.r.state.hp,3);}finally{f.r.dispose();}}
});
test('production-ledger lesson shows inner hit, outer pull without damage, wall/boss/far resistance and fixed-source progress',()=>{
 const a=voidStudy(2700),b=voidStudy(4000);assert.equal(a.sample.field.phase,'pull');assert.deepEqual(a.sample.field.targets.map(e=>e.id),['armor','inner','outer']);assert.deepEqual(b.sample.hits,['armor','inner']);assert.equal(b.sample.targets.find(e=>e.id==='inner').hp,0);assert.equal(b.sample.targets.find(e=>e.id==='outer').hp,1);near(b.sample.targets.find(e=>e.id==='outer').x,-60);assert.equal(b.sample.targets.find(e=>e.id==='boss').hp,10);assert.equal(b.sample.targets.find(e=>e.id==='blocked').y,-50);assert.equal(b.sample.targets.find(e=>e.id==='far').x,128);assert.equal(voidStudy(2700).sample,a.sample);assert.ok(Object.isFrozen(a.sample.field.targets[0]));
});
const image=fn=>{const cv=createCanvas(320,280);fn(cv.getContext('2d'));return cv.toBuffer('image/png');};
test('field rendering is deterministic, bounded, state-safe and reduced-motion static; collapse cannot outgrow the core',()=>{
 const {well:w,e,map}=setup();w.contact(e,{primary:true,enemies:map.values()});const field=w.view(9),draw=(now,motion)=>image(c=>drawVoidField(c,{field:{...field,x:160,y:140},now,motion}));assert.deepEqual(draw(9,false),draw(9,false));assert.notDeepEqual(draw(2,true),draw(12,true));assert.deepEqual(image(c=>drawVoidField(c,{field:{...field,phase:'ready'}})),image(()=>{}));
 const c=createCanvas(320,280).getContext('2d');c.translate(2,3);c.globalAlpha=.5;const matrix=c.getTransform();drawVoidField(c,{field,now:9});drawVoidLaunch(c,{x:50,y:50,vx:30,vy:0,age:3});assert.deepEqual(c.getTransform(),matrix);assert.equal(c.globalAlpha,.5);assert.equal(field.radius,110);assert.equal(field.core,28);
});
test('void launch follows launch bearing, ends promptly and does not fake motion when disabled',()=>{
 const draw=(age,motion=true,angle=0)=>image(c=>drawVoidLaunch(c,{x:160,y:140,vx:30,vy:0,age,motion,angle})),blank=image(()=>{});assert.notDeepEqual(draw(2),blank);assert.notDeepEqual(draw(2),draw(2,true,1));for(const age of [-1,15,Infinity])assert.deepEqual(draw(age),blank);assert.deepEqual(draw(2,false),blank);
});
test('free shop lesson changes through placement/pull/pulse, stays pixel-still under reduced motion and preserves saved ownership/presets',()=>{
 const it=ITEMS.find(i=>i.id==='dash-void'),save=loadEquipment(JSON.stringify({version:1,owned:[it.id],equipped:{dash:it.id},presets:[{dash:it.id},null,null]})),before=JSON.stringify(save),draw=(time,motion)=>{const cv=createCanvas(640,400);drawShopItemStudy(playerCanvas(cv.getContext('2d')),640,400,{equipment:save.equipped,study:shopStudy(it,time,motion,save.equipped)});return cv.toBuffer('image/png');};assert.notDeepEqual(draw(0,true),draw(2700,true));assert.notDeepEqual(draw(2700,true),draw(4000,true));assert.deepEqual(draw(0,false),draw(9999,false));assert.equal(JSON.stringify(save),before);assert.doesNotMatch(Object.values(shopAbility(it.id)).join(' '),/\bticks?\b|\bsimulation\b|\bprimary\b/i);
});

test('the actual collapse pulse never paints a damaging radius beyond28; aim-only terminal shows recharge, not a shield',()=>{
 const cv=createCanvas(320,280),c=cv.getContext('2d'),radii=[],arc=c.arc.bind(c);c.arc=(x,y,r,...rest)=>{radii.push({r,color:c.strokeStyle});arc(x,y,r,...rest);};
 drawVoidField(c,{field:{x:160,y:140,radius:110,core:28,born:0,expires:18,phase:'collapse'},now:21});assert.ok(radii.some(e=>e.r===110));assert.ok(radii.filter(e=>e.color==='#f1e7f8').every(e=>e.r<=28));
 const draw=readyIn=>image(c=>drawVoidReadiness(c,{x:150,y:130,radius:22,readyIn}));assert.notDeepEqual(draw(36),draw(0));assert.deepEqual(draw(0),draw(-20));
});
test.skip('[retired cosmetic power] Grav and field share selected victims rather than silently adding a second force',()=>{
 const run=core=>{const f=fixture({core});try{f.shot();const e=f.add(),n=f.add('small','fang',-320,-480,10);n.small=true;f.hit(e);for(const target of [e,n])Object.assign(target,{mode:'tell',clock:200,span:200});f.r.state.blade=0;placePlayer(f.r.world,{x:-430,y:-330});stopPlayer(f.r.world);f.r.focus(true);f.r.state.stop=0;f.r.tick();return {x:n.x,y:n.y,moved:f.r.voidStatus().targets.find(e=>e.id===n.id).moved};}finally{f.r.dispose();}};assert.deepEqual(run('grav'),run('standard'));
});
