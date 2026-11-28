import test from 'node:test';
import assert from 'node:assert/strict';
import Matter from 'matter-js';
import {createCanvas} from '@napi-rs/canvas';
import {createRepriseStroke,REPRISE,clipReprisePath,repriseCandidates,repriseEligible} from '../src/reprise-stroke.js';
import {repriseStudy} from '../src/reprise-study.js';
import {createRun} from '../src/run.js';
import {placePlayer,stopPlayer,stepPhysics} from '../src/physics.js';
import {createCombatSourceTrace} from '../src/combat-source-trace.js';
import {equipmentRules,ITEMS} from '../src/equipment.js';
import {PART_PERKS} from '../src/part-perks.js';
import {shopAbility,playerCanvas} from '../src/shop-language.js';
import {shopStudy} from '../src/shop-catalog.js';
import {drawReprisePath,drawRepriseLaunch,drawRepriseReadiness,drawShopItemStudy} from '../src/art/splatr-art-engine.js';
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-7,`${a} != ${b}`);
function enemy(id='a',x=42,y=0,hp=5,kind='bastion'){
 const e={id,x,y,hp,kind};e.body=Matter.Bodies.rectangle(x,y,8,8,{isSensor:true});e.body.plugin.enemy=e;return e;
}
const mapOf=(...e)=>new Map(e.map(e=>[e.id,e]));
function recorded(geometry=[]){const r=createRepriseStroke();r.admit({shot:1,point:{x:0,y:0}});r.record({from:{x:0,y:0},to:{x:160,y:0},start:0,end:5,geometry});return r;}
function fixture(extra={},observed=false){
 const events=[],trace=observed?createCombatSourceTrace(4096):null,r=createRun(77,(type,data)=>events.push({type,data}),{waveMode:true,equipment:{dash:'dash-echo',...extra},combatSourceTrace:trace});
 for(const e of [...r.combat.enemies.values()])r.combat.remove(e);Object.assign(r.state,{phase:'playing',opening:null,inputLock:false,invul:99999});r.state.wave.entry=0;placePlayer(r.world,{x:-350,y:-400});stopPlayer(r.world);r.world.grounded=false;r.combat.add({id:'sentinel',kind:'fang',x:700,y:-900,pinned:true,delay:999999});
 const shot=()=>{r.state.inputLock=false;r.state.edge=3;assert.equal(r.dash({x:30,y:0,power:30/42}),true);};
 const tick=()=>{r.state.stop=0;r.state.blade=0;r.tick();};
 const at=now=>{r.world.clock=now;r.state.stop=1;r.state.blade=0;r.combat.contacts.clear();r.tick();};
 const add=(id='armor',kind='bastion',x=-300,y=-400,hp=10)=>r.combat.add({id,kind,x,y,hp,delay:999999});
 return {r,events,trace,shot,tick,at,add};
}
test('atomic Echo migration removes grace and adds only the declared replay flag',()=>{
 const a=equipmentRules({dash:'dash-echo'}),b=equipmentRules({});assert.equal(a.reprise,true);assert.equal(PART_PERKS['dash-echo'].stat,'reprise');assert.equal(a.chainGrace,b.chainGrace);
 for(const key of ['dashSpeed','bladeExtra','cutWidth','dashNarrowing','armorDamage','edgeMax','healthMax','focusDrain','focusRegen'])assert.equal(a[key],b[key],key);
 const item=ITEMS.find(e=>e.id==='dash-echo');assert.equal(item.price,350);assert.match(shopAbility(item.id).effect,/0.2s/);assert.doesNotMatch(JSON.stringify(shopAbility(item.id)),/\bticks?\b|simulation|primary/i);
});
test('maximum140 traveled units /6 samples, copied buffers and immutable view',()=>{
 const r=recorded(),v=r.view(5);assert.equal(v.pending.path.length,6);near(v.pending.length,140);near(v.pending.path.at(-1).x,140);assert.equal(v.pending.sealed,'length');assert.ok(Object.isFrozen(v.pending.path[0]));assert.throws(()=>v.pending.path[0].x=55);
 const p={x:0,y:0},q=createRepriseStroke();q.admit({point:p});p.x=100;assert.equal(q.view().pending.path[0].x,0);
});
test('no launch, no traveled segment, or a genuine miss cannot manufacture a hit',()=>{
 const r=createRepriseStroke(),e=enemy();r.record({from:{x:0,y:0},to:{x:100,y:0},start:0,end:1});assert.equal(r.fire(100,mapOf(e),{hit:()=>assert.fail()}),false);
 r.admit({point:{x:0,y:0}});assert.equal(r.fire(12,mapOf(e),{hit:()=>assert.fail()}),true);const q=recorded();q.fire(12,mapOf(enemy('off',42,40)),{hit:()=>assert.fail()});assert.deepEqual(q.view(12).replay.hits,[]);
});
test('real replay uses due world time exactly once; repeated render/finish calls cannot age or repeat it',()=>{
 const r=recorded(),e=enemy(),hits=[];for(let i=0;i<30;i++){r.view(0);assert.equal(r.fire(0,mapOf(e)),false);}assert.equal(r.fire(11.999,mapOf(e)),false);assert.equal(r.fire(12,mapOf(e),{hit:t=>hits.push(t.id)}),true);assert.equal(r.fire(12,mapOf(e)),false);assert.equal(r.fire(200,mapOf(e)),false);assert.deepEqual(hits,['a']);assert.equal(r.view(15).replay.phase,'dissolve');assert.equal(r.view(18).replay,null);
});
test('late arrivals on old path hit; targets beside the moved player but not on path are safe',()=>{
 const r=recorded(),late=enemy('late',112,70),safe=enemy('safe',210,-100);late.y=0;Matter.Body.setPosition(late.body,late);const hits=[];r.fire(12,mapOf(late,safe),{hit:t=>hits.push(t.id)});assert.deepEqual(hits,['late']);
});
test('path-order cap2, stable ties and dedup across adjacent samples',()=>{
 const a=enemy('a',56),b=enemy('b',112),c=enemy('c',126),r=recorded(),hits=[];r.fire(12,mapOf(c,b,a),{hit:t=>hits.push(t.id)});assert.deepEqual(hits,['a','b']);
 assert.deepEqual(repriseCandidates([{x:0,y:0},{x:56,y:0},{x:140,y:0}],[a,a,b,c]).map(e=>e.id),['a','b']);
});
test('static solid stops entire lane including a grazing width and blocks targets beyond',()=>{
 for(const wall of [{x:70,y:-30,w:8,h:60},{x:70,y:5,w:8,h:20}]){
  const r=recorded([wall]),a=enemy('a',30),b=enemy('b',110),hits=[];assert.ok(r.view().pending.path.at(-1).x<70);assert.equal(r.view().pending.sealed,'wall');r.fire(12,mapOf(a,b),{geometry:[wall],hit:e=>hits.push(e.id)});assert.deepEqual(hits,['a']);
 }
});
test('new solids are checked again at replay and cannot leak an old promised lane through a wall',()=>{
 const r=recorded(),wall={x:60,y:-40,w:10,h:80},hits=[];r.fire(12,mapOf(enemy('a',28),enemy('b',112)),{geometry:[wall],hit:e=>hits.push(e.id)});assert.deepEqual(hits,['a']);assert.ok(r.view(12).replay.path.at(-1).x<60);assert.equal(clipReprisePath([],[]).length,0);
});
test('teleport and bank discontinuities seal recording, never join an untraveled chord',()=>{
 for(const discontinuity of [true,false]){const r=createRepriseStroke();r.admit({point:{x:0,y:0}});r.record({from:{x:0,y:0},to:{x:28,y:0},start:0,end:1,discontinuity});r.record({from:{x:100,y:100},to:{x:140,y:140},start:1,end:2});assert.equal(r.view().pending.sealed,'discontinuity');assert.deepEqual(r.view().pending.path.at(-1),{x:28,y:0});}
});
test('deadline clips a crossing substep instead of recording future travel',()=>{
 const r=createRepriseStroke();r.admit({point:{x:0,y:0}});r.record({from:{x:0,y:0},to:{x:100,y:0},start:10,end:14});near(r.view().pending.path.at(-1).x,50);
});
test('one reservation survives two and three rapid attempts, no source allocation or automatic queue while full',()=>{
 const r=createRepriseStroke();let sources=0;const options={point:{x:0,y:0},makeSource:()=>++sources};assert.equal(r.admit({...options,shot:1}),true);const before=r.view().pending;
 assert.equal(r.admit({...options,shot:2,now:1}),false);assert.equal(r.admit({...options,shot:3,now:2}),false);assert.deepEqual(r.view().pending,before);assert.equal(sources,1);r.fire(12,new Map());assert.equal(r.view(12).ready,true);assert.equal(r.fire(40,new Map()),false);assert.equal(r.admit({...options,shot:4,now:40}),true);assert.equal(sources,2);
});
test('protected/paper/pinned/unknown targets excluded; boss requires explicit active-phase permission',()=>{
 for(const changes of [{paper:true},{tutorialProtected:true},{tutorialTargetPlayer:true},{pinned:true},{kind:'unknown'},{hp:0}])assert.equal(repriseEligible({...enemy(),...changes}),false);
 const boss=enemy('boss',42,0,10,'monolith');boss.pinned=true;const r=recorded();r.fire(12,mapOf(boss),{hit:()=>assert.fail()});const q=recorded();let n=0;q.fire(12,mapOf(boss),{allowBoss:true,hit:()=>n++});assert.equal(n,1);
});
test('destroyed/replaced actors are not preselected at launch; dead callback targets are rechecked',()=>{
 const r=recorded(),a=enemy('a',28),b=enemy('b',56),map=mapOf(a,b),hits=[];r.fire(12,map,{hit:e=>{hits.push(e.id);map.delete('b');}});assert.deepEqual(hits,['a']);
});
test('cancel clears pending and visible replay without any early payout',()=>{
 const r=recorded();r.clear();assert.equal(r.view().pending,null);assert.equal(r.fire(100,mapOf(enemy()),{hit:()=>assert.fail()}),false);r.admit({point:{x:0,y:0}});r.fire(12,new Map());r.clear();assert.equal(r.view(12).replay,null);
});
test('real physics callback measures contiguous substeps without altering integration',()=>{
 const f=fixture(),g=fixture();try{f.shot();g.shot();const segments=[];stepPhysics(f.r.world,null,1,s=>segments.push(s));stepPhysics(g.r.world);assert.deepEqual(f.r.world.player.position,g.r.world.player.position);assert.deepEqual(f.r.world.player.velocity,g.r.world.player.velocity);assert.ok(segments.length>1);near(segments[0].start,0);near(segments.at(-1).end,f.r.world.clock);for(let i=1;i<segments.length;i++)assert.deepEqual(segments[i].from,segments[i-1].to);}finally{f.r.dispose();g.r.dispose();}
});
test('real run records travel; hitstop does not age pending; busy legal launch retains original source',()=>{
 const f=fixture();try{f.shot();f.tick();const p=f.r.repriseStatus().pending;assert.ok(p.length>0);for(let i=0;i<20;i++){f.r.state.stop=1;f.r.tick();}assert.equal(f.r.repriseStatus().pending.length,p.length);assert.equal(f.r.world.clock,1);f.shot();f.shot();assert.equal(f.r.repriseStatus().pending.sourceShot,1);assert.equal(f.events.filter(e=>e.type==='repriseStored').length,1);assert.equal(f.events.filter(e=>e.type==='repriseBusy').length,2);f.at(12);assert.equal(f.events.filter(e=>e.type==='repriseFired').length,1);f.at(25);assert.equal(f.events.filter(e=>e.type==='repriseFired').length,1);}finally{f.r.dispose();}
});
test('surviving primary victim can take exact1 again; lastSlash, charge and resources stay isolated',()=>{
 const f=fixture({head:'coil',core:'echo',eyes:'sniper',tail:'spectrum'},true);try{
 f.shot();f.tick();const e=f.add('armor','bastion',-333,-400,6);f.r.combat.contacts.add(e);f.r.state.blade=12;f.r.state.stop=1;f.r.tick();const hp=e.hp,last=e.lastSlash;Object.assign(f.r.state,{edge:1,focus:.3,chain:4,chainTime:100,blade:0,drive:0,swordCharge:0,swordContacts:0});f.at(11.99);assert.equal(e.hp,hp);f.at(12);assert.equal(e.hp,hp-1);assert.equal(e.lastSlash,last);assert.equal(f.r.state.edge,1);assert.equal(f.r.state.chain,4);assert.equal(f.r.state.swordCharge,0);assert.equal(f.r.state.swordContacts,0);assert.equal(f.r.state.equipmentFx.echoes.length,0);const cut=f.trace.entries().find(e=>e.type==='cut-result'&&e.sourceKind==='dash-reprise');assert.ok(cut?.accepted&&cut.secondary&&cut.fromShear);assert.equal(cut.sourceShotId,1);assert.ok(cut.parentSourceId);
 }finally{f.r.dispose();}
});
test('replay kill earns ordinary reward once but not EDGE/chain/Drive/sword/Coil recursion',()=>{
 const f=fixture({head:'coil',core:'echo',tail:'spectrum'});try{f.shot();f.tick();const e=f.add('victim','bastion',-333,-400,1);Object.assign(f.r.state,{edge:1,focus:.3,chain:4,chainTime:100,drive:0,swordCharge:0,swordContacts:0});const credits=f.r.state.killLedger.credits,kills=f.r.state.kills;f.at(12);assert.equal(e.hp,0);assert.equal(f.r.state.kills,kills+1);assert.equal(f.r.state.killLedger.credits,credits+4);assert.ok(f.r.state.score>0);assert.equal(f.r.state.edge,1);assert.equal(f.r.state.chain,4);assert.equal(f.r.state.drive,0);assert.equal(f.r.state.swordCharge,0);assert.equal(f.r.state.equipmentFx.echoes.length,0);f.at(30);assert.equal(f.r.state.kills,kills+1);}finally{f.r.dispose();}
});
test('boss gets exactly one chip only during its active phase, regardless of lens/Drive/upgrades',()=>{
 for(const active of [true,false]){const f=fixture();try{const e=f.add('boss','monolith',-333,-400,10);f.r.state.wave.phase='monolith';f.shot();f.tick();e.lensT=100;f.r.state.drive=100;f.r.state.kineticStage=4;if(!active){f.r.state.wave.platform={x:-500,y:200,w:300,h:24};f.r.state.wave.phase='return';}f.at(12);assert.equal(e.hp,active?9:10);}finally{f.r.dispose();}}
});
test('retire, death/dispose, teaching, practice and wave exit cancel without paying',()=>{
 for(const action of ['retire','dispose','teaching','practice','wave']){const f=fixture();try{f.shot();f.tick();const e=f.add('e','bastion',-333,-400);if(action==='retire')f.r.retire();if(action==='dispose')f.r.dispose();if(action==='teaching')f.r.state.teachingArena=true;if(action==='practice')f.r.state.practice=true;if(action==='wave'){f.r.state.wave.platform={x:-500,y:200,w:300,h:24};f.r.state.wave.phase='return';}if(!['retire','dispose'].includes(action))f.at(12);assert.equal(e.hp,10);assert.equal(f.r.repriseStatus().pending,null);assert.equal(f.events.filter(e=>e.type==='repriseHit').length,0);}finally{f.r.dispose();}}
});
test('source observer is inert and preserves original launch parent through a later launch',()=>{
 const play=observed=>{const f=fixture({},observed);try{f.shot();f.tick();const e=f.add('e','bastion',-333,-400);f.shot();f.at(12);return {hp:e.hp,score:f.r.state.score,events:f.events,trace:f.trace?.entries()||[]};}finally{f.r.dispose();}};
 const a=play(false),b=play(true);assert.deepEqual({...a,trace:[]},{...b,trace:[]});const cut=b.trace.find(e=>e.type==='cut-result'&&e.sourceKind==='dash-reprise');assert.equal(cut.sourceShotId,1);assert.equal(cut.shotId,2);assert.ok(cut.parentSourceId);
});
test('production-ledger lesson proves late hit/miss/wall and safe current hero neighborhood',()=>{
 const arrival=repriseStudy(3900),miss=repriseStudy(6400+3900),wall=repriseStudy(12800+3900);assert.equal(arrival.sample.targets[0].hp,1);assert.equal(arrival.sample.targets[1].hp,0);assert.equal(arrival.sample.targets[2].hp,1);assert.equal(arrival.sample.busy,false);assert.equal(miss.sample.targets[1].hp,1);assert.equal(wall.sample.targets[1].hp,1);assert.equal(wall.sample.ledger.replay.sealed,'wall');assert.deepEqual(repriseStudy(0,false),repriseStudy(99999,false));
});
test('renderer is pure, balanced, finite, reduced-motion steady and uses one pending/replay lane',()=>{
 const cv=createCanvas(640,400),c=cv.getContext('2d'),r=recorded(),before=r.view(6),state=JSON.stringify(before),transform=c.getTransform();c.globalAlpha=.75;
 for(const motion of [true,false]){drawReprisePath(c,{ledger:before,now:6,motion});drawRepriseLaunch(c,{x:20,y:20,vx:30,age:2,motion});drawRepriseReadiness(c,{ready:false});}assert.equal(JSON.stringify(before),state);assert.equal(c.globalAlpha,.75);assert.deepEqual(c.getTransform(),transform);
 r.fire(12,mapOf(enemy()),{});drawReprisePath(c,{ledger:r.view(12),now:12});drawReprisePath(c,{ledger:r.view(16),now:16});
 const item=ITEMS.find(e=>e.id==='dash-echo'),render=t=>{c.clearRect(0,0,640,400);drawShopItemStudy(playerCanvas(c),640,400,{study:shopStudy(item,t,false,{dash:'dash-echo'}),equipment:{dash:'dash-echo'}});return cv.toBuffer('image/png');};assert.deepEqual(render(0),render(99999));
});

test('sharp measured corners consume real samples rather than shortcutting into an untraveled diagonal',()=>{
 const r=createRepriseStroke();r.admit({point:{x:0,y:0}});r.record({from:{x:0,y:0},to:{x:14,y:0},start:0,end:1});r.record({from:{x:14,y:0},to:{x:14,y:14},start:1,end:2});assert.deepEqual(r.view().pending.path,[{x:0,y:0},{x:14,y:0},{x:14,y:14}]);
 let from={x:14,y:14};for(let i=0;i<20;i++){const to={x:from.x+(i%2?0:14),y:from.y+(i%2?14:0)};r.record({from,to,start:2+i/10,end:2+(i+1)/10});from=to;}assert.ok(r.view().pending.path.length<=6);assert.equal(r.view().pending.sealed,'samples');
});

test('real arena bank seals the recorded lane instead of following reflected flight',()=>{
 const f=fixture();try{const w=f.r.world,edge=w.arena.x+w.arena.w;placePlayer(w,{x:edge-45,y:-400});stopPlayer(w);f.shot();
 for(let i=0;i<5;i++)f.tick();const pending=f.r.repriseStatus().pending;assert.ok(pending?.sealed);assert.ok(['discontinuity','wall'].includes(pending.sealed));const saved=pending.path;for(let i=0;i<3;i++)f.tick();assert.deepEqual(f.r.repriseStatus().pending.path,saved);assert.ok(saved.every(p=>p.x<=edge));
 }finally{f.r.dispose();}
});
test('replay boss finishing blow shares normal boss reward and cannot fire monolithDown twice',()=>{
 const f=fixture();try{const e=f.add('boss','monolith',-333,-400,1);f.r.state.wave.phase='monolith';f.shot();f.tick();const before=f.r.state.monoliths;f.at(12);assert.equal(e.hp,0);assert.equal(f.r.state.monoliths,before+1);assert.equal(f.events.filter(e=>e.type==='monolithDown').length,1);f.at(30);assert.equal(f.events.filter(e=>e.type==='monolithDown').length,1);}finally{f.r.dispose();}
});
test('Echo lesson actors fit inside the demonstration panel even before late arrival starts',()=>{
 for(let elapsed=0;elapsed<19200;elapsed+=50){
  const {sample}=repriseStudy(elapsed);
  for(const actor of [...sample.targets,{...sample.hero,r:11}]){
   const top=250+(actor.y-actor.r)*1.8,bottom=250+(actor.y+actor.r)*1.8;
   assert.ok(top>=115&&bottom<=331,`${elapsed}ms actor ${actor.id||'hero'} must fit panel: ${top}..${bottom}`);
  }
 }
});
