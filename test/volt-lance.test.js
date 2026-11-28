import test from 'node:test';
import assert from 'node:assert/strict';
import {createCanvas} from '@napi-rs/canvas';
import {createVoltBurst,createVoltConduction,VOLT,voltEligible} from '../src/volt-lance.js';
import {voltStudy} from '../src/volt-study.js';
import {createRun} from '../src/run.js';
import {placePlayer,stopPlayer,setPlayerVelocity,createPhysics,destroyPhysics,launch,stepPhysics} from '../src/physics.js';
import {equipmentRules,ITEMS} from '../src/equipment.js';
import {PART_PERKS,perkScoreMultiplier} from '../src/part-perks.js';
import {primaryWidth} from '../src/primary-width.js';
import {createCombatSourceTrace} from '../src/combat-source-trace.js';
import {shopAbility,playerCanvas} from '../src/shop-language.js';
import {shopStudy} from '../src/shop-catalog.js';
import {drawVoltLaunch,drawVoltArc,drawVoltReadiness,drawShopItemStudy} from '../src/art/splatr-art-engine.js';
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-7,`${a} != ${b}`),enemy=(id,x,y=0,hp=5,kind='bastion')=>({id,x,y,hp,kind}),mapOf=(...e)=>new Map(e.map(e=>[e.id,e]));
function fixture(extra={},observed=false,dash='dash-lightning'){
 const events=[],trace=observed?createCombatSourceTrace(4096):null,r=createRun(77,(type,data)=>events.push({type,data}),{waveMode:true,equipment:{dash,...extra},combatSourceTrace:trace});
 for(const e of [...r.combat.enemies.values()])r.combat.remove(e);Object.assign(r.state,{phase:'playing',opening:null,inputLock:false,invul:99999});r.state.wave.entry=0;placePlayer(r.world,{x:-350,y:-400});stopPlayer(r.world);r.world.grounded=false;r.combat.add({id:'sentinel',kind:'fang',x:700,y:-900,pinned:true,delay:999999});
 const shot=(v={x:30,y:0,power:30/42})=>{r.state.inputLock=false;r.state.edge=3;assert.equal(r.dash(v),true);};
 const hit=e=>{r.combat.contacts.add(e);r.state.stop=1;r.tick();};
 const tick=()=>{r.state.stop=0;r.state.blade=0;r.tick();};
 const add=(id='origin',x=-320,y=-400,hp=10,kind='bastion')=>r.combat.add({id,kind,x,y,hp,delay:999999});
 return {r,events,trace,shot,hit,tick,add};
}
test('Volt atomic replacement: no old speed score,15% narrowing, no unrelated passive bonuses',()=>{
 const r=equipmentRules({dash:'dash-lightning'}),b=equipmentRules({});assert.equal(r.voltLance,true);assert.equal(r.dashNarrowing,.85);assert.equal(PART_PERKS['dash-lightning'].stat,'volt');assert.equal(perkScoreMultiplier(r.scorePerks,{speed:30}),1);
 for(const k of ['dashSpeed','bladeExtra','cutWidth','chainGrace','edgeMax','armorDamage','healthMax','focusDrain','focusRegen'])assert.equal(r[k],b[k],k);
 assert.equal(ITEMS.find(i=>i.id==='dash-lightning').price,300);assert.match(shopAbility('dash-lightning').limit,/no homing/i);assert.doesNotMatch(JSON.stringify(shopAbility('dash-lightning')),/\bticks?\b|simulation|primary/i);
});
test('owned burst adds12% exactly, holds4, removes only that contribution over6',()=>{
 const b=createVoltBurst();let v=b.launch({x:30,y:0});near(v.x,33.6);for(let i=0;i<4;i++){v=b.advance(v,i,1);b.observe(v);near(v.x,33.6);}for(let i=4;i<10;i++){v=b.advance(v,i,1);b.observe(v);near(v.x,33.6-.6*(i-3));}near(v.x,30);assert.equal(b.view(10).phase,'idle');
});
test('fractional/skipped deadlines and repeated intervals never over-remove or leave expired excess',()=>{
 for(const dt of [.1,.55,.8,1,12]){const b=createVoltBurst();let v=b.launch({x:24,y:-18}),t=0;while(t<10){v=b.advance(v,t,dt);b.observe(v);t+=dt;}near(v.x,24);near(v.y,-18);near(b.view(t).amount,0);}
 const b=createVoltBurst();let v=b.launch({x:30,y:0});v=b.advance(v,4,1);const once={...v};v=b.advance(v,4,1);assert.deepEqual(v,once);v=b.advance(v,30,1);near(v.x,30);
});
test('gravity is independent of the owned vector; proportional velocity caps scale ownership only',()=>{
 const b=createVoltBurst();let v=b.launch({x:30,y:0});v={x:v.x,y:8};b.observe(v);v=b.advance(v,4,6);near(v.x,30);near(v.y,8);
 const c=createVoltBurst();v=c.launch({x:30,y:0});v={x:v.x*.5,y:2};c.observe(v,{velocityScale:.5});v=c.advance(v,4,6);near(v.x,15);near(v.y,2);
});
test('zero, already-fast and Hyper motion cannot manufacture a new burst',()=>{
 for(const [v,opts]of [[{x:0,y:0},{}],[{x:70,y:0},{}],[{x:42.001,y:0},{}],[{x:30,y:0},{hyper:true}]]){const b=createVoltBurst();assert.deepEqual(b.launch(v,opts),v);assert.equal(b.view().amount,0);}
});
test('bank/contact, Hyper entry and unrelated recoil/boost cancel debt with no later clawback',()=>{
 for(const action of ['bank','boost','hyper','recoil']){const b=createVoltBurst();let v=b.launch({x:30,y:0});if(action==='bank'){v={x:-60,y:-10};b.observe(v,{discontinuity:true});}if(action==='boost')v={x:70,y:-10};if(action==='recoil')v={x:18,y:0};const expected={...v};v=b.advance(v,8,1,{hyper:action==='hyper'});assert.deepEqual(v,expected);assert.equal(b.view(9).amount,0);assert.deepEqual(b.advance(v,40,1),expected);}
});
test('owned relaunch projection subtracts only its own vector, never an external bank',()=>{
 const b=createVoltBurst(),v=b.launch({x:30,y:-10});assert.deepEqual(b.baseVelocity(v),{x:30,y:-10});assert.deepEqual(b.baseVelocity({x:80,y:-10}),{x:80,y:-10});
});
test('conduction needs launch and eligible direct contact; first attempt consumes even without a neighbor',()=>{
 const c=createVoltConduction(),e=enemy('origin',0),map=mapOf(e);assert.equal(c.contact(e,{primary:true,enemies:map}),false);c.launch(1);assert.equal(c.contact(e,{enemies:map}),false);assert.equal(c.contact(e,{primary:true,enemies:map}),true);map.set('late',enemy('late',30));assert.equal(c.contact(e,{primary:true,enemies:map,hit:()=>assert.fail()}),false);assert.equal(c.view().ready,false);assert.deepEqual(c.view().arc.links,[]);
});
test('nearest inclusive120/sight selection, stable ID ties, and blocked targets cannot steal the arc',()=>{
 const c=createVoltConduction(),e=enemy('origin',0),blocked=enemy('blocked',20),a=enemy('a',0,120),z=enemy('z',0,-120),outside=enemy('outside',120.001),map=mapOf(e,z,a,blocked,outside),hits=[];c.launch(1);c.contact(e,{primary:true,enemies:map,geometry:[{x:10,y:-5,w:5,h:10}],hit:t=>hits.push(t.id)});assert.deepEqual(hits,['a']);
});
test('Coil shares one first-contact reservation: Volt120 first, Coil160 second, no duplicated victim',()=>{
 const c=createVoltConduction(),e=enemy('origin',0),a=enemy('a',60),b=enemy('b',160),far=enemy('far',160.01),map=mapOf(e,a,b,far),hits=[];c.launch(1);c.contact(e,{primary:true,enemies:map,coil:true,hit:t=>hits.push(t.id)});assert.deepEqual(hits,['a','b']);assert.deepEqual(c.view().arc.links.map(l=>l.role),['volt','coil']);c.contact(e,{primary:true,enemies:map,coil:true,hit:()=>assert.fail()});
 const d=createVoltConduction();d.launch(2);const one=[];d.contact(e,{primary:true,enemies:mapOf(e,a),coil:true,hit:t=>one.push(t.id)});assert.deepEqual(one,['a']);
});
test('Coil still reaches160 when Volt has no120 neighbor; walls block either role',()=>{
 for(const blocked of [false,true]){const c=createVoltConduction(),e=enemy('origin',0),b=enemy('far',150),hits=[];c.launch(1);c.contact(e,{primary:true,enemies:mapOf(e,b),coil:true,geometry:blocked?[{x:130,y:-10,w:5,h:20}]:[],hit:t=>hits.push(t.id)});assert.deepEqual(hits,blocked?[]:['far']);}
});
test('boss, pinned, paper and protected targets excluded; dead direct origin can still conduct',()=>{
 for(const changes of [{kind:'monolith'},{kind:'unknown'},{pinned:true},{paper:true},{tutorialProtected:true},{tutorialTargetPlayer:true},{hp:0}])assert.equal(voltEligible({...enemy('e',0),...changes}),false);
 const c=createVoltConduction(),e=enemy('dead',0,0,0),a=enemy('a',50),hits=[];c.launch(1);assert.equal(c.contact(e,{primary:true,enemies:mapOf(a),hit:t=>hits.push(t.id)}),true);assert.deepEqual(hits,['a']);
});
test('source and target reservations precede callbacks; recycled/dead second actor never inherits a hit',()=>{
 const c=createVoltConduction(),e=enemy('origin',0),a=enemy('a',50),b=enemy('b',140),map=mapOf(e,a,b),hits=[];let sources=0;c.launch(1);c.contact(e,{primary:true,enemies:map,coil:true,makeSource:()=>{sources++;return 'source';},hit:(t,u)=>{assert.equal(u.source,'source');assert.equal(c.view().ready,false);hits.push(t.id);map.set('b',enemy('b',140));}});assert.equal(sources,1);assert.deepEqual(hits,['a']);
});
test('arc immutable receipts expire after6 without repeated damage or victim following',()=>{
 const c=createVoltConduction(),e=enemy('origin',0),a=enemy('a',50);c.launch(1);c.contact(e,{primary:true,now:2,enemies:mapOf(e,a)});a.x=200;assert.equal(c.view(7).arc.links[0].x,50);assert.ok(Object.isFrozen(c.view(7).arc.links[0]));assert.equal(c.view(8).arc,null);c.clear();assert.equal(c.view().arc,null);
});
test('real ordinary run gains12% velocity and measurably reaches farther before easing',()=>{
 const a=fixture(),b=fixture({},false,'dash-auto');try{a.shot();b.shot();near(a.r.world.player.velocity.x/b.r.world.player.velocity.x,1.12);for(let i=0;i<4;i++){a.tick();b.tick();}assert.ok(a.r.world.player.position.x>b.r.world.player.position.x+10);for(let i=0;i<10;i++){a.tick();b.tick();}assert.equal(a.r.voltStatus().burst.amount,0);assert.ok(a.r.world.player.velocity.x>=b.r.world.player.velocity.x-1e-5);}finally{a.r.dispose();b.r.dispose();}
});
test('rapid legal relaunches cannot compound boost and invalid/refused launches cannot consume ownership',()=>{
 const f=fixture();try{f.shot();const speed=f.r.world.player.speed,amount=f.r.voltStatus().burst.amount;f.r.state.inputLock=true;assert.equal(f.r.dash({x:42,y:0}),false);near(f.r.world.player.speed,speed);near(f.r.voltStatus().burst.amount,amount);f.r.state.inputLock=false;assert.equal(f.r.dash({x:0,y:0}),false);near(f.r.world.player.speed,speed);f.shot();near(f.r.world.player.speed,speed);f.shot();near(f.r.world.player.speed,speed);}finally{f.r.dispose();}
});
test('width cost composes once with Viper/Samurai/Magnet/Sniper without changing collider/reach/window',()=>{
 for(const head of ['none','viper','samurai'])for(const core of ['standard','magnet']){const a=fixture({head,core,eyes:'sniper'}),b=fixture({head,core,eyes:'sniper'},false,'dash-auto');try{a.shot();b.shot();const ga=a.r.primaryGeometry(),gb=b.r.primaryGeometry();near(ga.halfWidth/gb.halfWidth,.85);near(ga.closeWidth,gb.closeWidth);near(ga.span,gb.span);near(a.r.state.blade,b.r.state.blade);assert.deepEqual(a.r.world.player.vertices.map(p=>[p.x,p.y]),b.r.world.player.vertices.map(p=>[p.x,p.y]));near(primaryWidth(0,equipmentRules({dash:'dash-lightning',head,core})).width/primaryWidth(0,equipmentRules({head,core})).width,.85);}finally{a.r.dispose();b.r.dispose();}}
});
test('real relay is exact1 and isolated from kinetic/Drive/primary hit dedup and resource charges',()=>{
 const f=fixture({core:'echo',tail:'spectrum'},true);try{f.shot();const e=f.add(),n=f.add('neighbor',-320,-480,6);Object.assign(f.r.state,{kineticStage:4,drive:100,edge:1,focus:.3,swordCharge:0,swordContacts:0});const before=n.hp;f.hit(e);assert.equal(n.hp,before-1);assert.equal(n.lastSlash,-1);assert.equal(f.events.filter(e=>e.type==='voltHit').length,1);const hit=f.trace.entries().find(e=>e.type==='cut-result'&&e.sourceKind==='volt-conduction');assert.ok(hit.accepted&&hit.secondary&&hit.fromShear);assert.ok(hit.parentSourceId);assert.equal(hit.sourceShotId,1);f.hit(e);assert.equal(n.hp,before-1);}finally{f.r.dispose();}
});
test('real Coil+Volt max2 distinct isolated victims, no legacy Coil duplicate on armor or later primary',()=>{
 const f=fixture({head:'coil'});try{f.shot();const e=f.add(),a=f.add('a',-320,-480,10),b=f.add('b',-320,-550,10);f.hit(e);assert.equal(a.hp,9);assert.equal(b.hp,9);assert.deepEqual(f.events.filter(e=>e.type==='voltHit').map(e=>e.data.entityId),['a','b']);const other=f.add('second',-500,-400,10);f.hit(other);assert.equal(a.hp,9);assert.equal(b.hp,9);}finally{f.r.dispose();}
});
test('real secondary kill pays ordinary credits once, no extra primary kill or recursive Coil',()=>{
 const f=fixture({head:'coil',core:'echo',tail:'spectrum'});try{f.shot();const e=f.add(),a=f.add('a',-320,-480,1),b=f.add('b',-320,-550,10);f.r.state.edge=1;f.r.state.chain=2;f.r.state.chainTime=100;f.hit(e);assert.equal(a.hp,0);assert.equal(b.hp,9);assert.equal(f.r.state.kills,1);assert.equal(f.r.state.killLedger.credits,4);assert.equal(f.r.state.chain,2);assert.equal(f.r.state.edge,1);assert.equal(f.r.state.equipmentFx.echoes.length,0);}finally{f.r.dispose();}
});
test('real hitstop freezes the burst; bank cancels debt and preserves outgoing momentum',()=>{
 const f=fixture();try{const w=f.r.world;placePlayer(w,{x:w.arena.x+w.arena.w-45,y:-400});f.shot();const amount=f.r.voltStatus().burst.amount;for(let i=0;i<30;i++){f.r.state.stop=1;f.r.tick();}near(f.r.voltStatus().burst.amount,amount);assert.equal(w.clock,0);for(let i=0;i<5;i++)f.tick();assert.equal(f.r.voltStatus().burst.amount,0);assert.ok(['contact','external'].includes(f.r.voltStatus().burst.reason));}finally{f.r.dispose();}
});
test('existing faster momentum and actual Hyper launches stay unboosted and untrimmed by Volt',()=>{
 for(const hyper of [false,true]){const a=fixture(),b=fixture({},false,'dash-auto');try{for(const f of [a,b]){setPlayerVelocity(f.r.world,100,-10);f.r.world.playerCeiling=120;f.r.state.hyper=hyper;f.shot();}assert.deepEqual(a.r.world.player.velocity,b.r.world.player.velocity);assert.equal(a.r.voltStatus().burst.amount,0);for(let i=0;i<12;i++){a.tick();b.tick();}assert.deepEqual(a.r.world.player.velocity,b.r.world.player.velocity);}finally{a.r.dispose();b.r.dispose();}}
});
test('retire/dispose/teaching/wave exit clear finite ownership and links without a delayed proc',()=>{
 for(const action of ['retire','dispose','teaching','wave']){const f=fixture();try{f.shot();if(action==='retire')f.r.retire();if(action==='dispose')f.r.dispose();if(action==='teaching'){f.r.state.teachingArena=true;f.tick();}if(action==='wave'){f.r.state.wave.platform={x:-500,y:200,w:300,h:24};f.r.state.wave.phase='return';f.tick();}assert.equal(f.r.voltStatus().burst.amount,0);assert.equal(f.r.voltStatus().conduction.ready,false);assert.equal(f.r.world.playerBurstAllowance,0);}finally{f.r.dispose();}}
});
test('observing sources is inert and new arcs retain the primary launch parent',()=>{
 const play=observed=>{const f=fixture({head:'coil'},observed);try{f.shot();const e=f.add(),a=f.add('a',-320,-480,5);f.hit(e);return {hp:a.hp,score:f.r.state.score,events:f.events,trace:f.trace?.entries()||[]};}finally{f.r.dispose();}};const a=play(false),b=play(true);assert.deepEqual({...a,trace:[]},{...b,trace:[]});const cut=b.trace.find(e=>e.type==='cut-result'&&e.sourceKind==='volt-conduction');assert.ok(cut.parentSourceId);assert.equal(cut.sourceShotId,1);
});
test('cached production shop lesson proves measured burst, solo hit, blocked link and Coil distinct targets',()=>{
 const solo=voltStudy(3300),blocked=voltStudy(5800+3300),coil=voltStudy(11600+3300);assert.ok(solo.flightEnd.volt>solo.flightEnd.base*1.1);assert.equal(solo.sample.targets.find(e=>e.id==='near').hp,0);assert.equal(solo.sample.targets.find(e=>e.id==='coil').hp,2);assert.equal(blocked.sample.ledger.arc.links.length,0);assert.equal(coil.sample.ledger.arc.links.length,2);assert.equal(coil.sample.targets.find(e=>e.id==='coil').hp,1);assert.equal(coil.sample.targets.find(e=>e.id==='outside').hp,1);assert.deepEqual(voltStudy(0,false),voltStudy(99999,false));
});
test('draws are pure/balanced, finite and reduced-motion lessons are stable',()=>{
 const cv=createCanvas(640,400),c=cv.getContext('2d'),q=voltStudy(11600+3300),state=JSON.stringify(q),transform=c.getTransform();c.globalAlpha=.75;for(const motion of [true,false]){drawVoltLaunch(c,{x:80,y:80,vx:30,age:2,travel:70,motion});drawVoltArc(c,{conduction:q.sample.ledger,now:q.sample.now,motion});drawVoltReadiness(c,{ready:false});}assert.equal(c.globalAlpha,.75);assert.deepEqual(c.getTransform(),transform);assert.equal(JSON.stringify(q),state);
 const item=ITEMS.find(e=>e.id==='dash-lightning'),render=t=>{c.clearRect(0,0,640,400);drawShopItemStudy(playerCanvas(c),640,400,{study:shopStudy(item,t,false,{dash:'dash-lightning'}),equipment:{dash:'dash-lightning'}});return cv.toBuffer('image/png');};assert.deepEqual(render(0),render(99999));
});

test('burst stays swept against a thin static wall; collision transfers ownership instead of tunneling',()=>{
 const world=createPhysics({spawn:{x:0,y:-300},solids:[{x:70,y:-600,w:2,h:600}]}),burst=createVoltBurst();try{
 launch(world,{x:42,y:0});const v=burst.launch(world.player.velocity);setPlayerVelocity(world,v.x,v.y);world.playerBurstAllowance=burst.view().amount;let struck=false;
 for(let i=0;i<6;i++){stepPhysics(world,dt=>{const q=burst.advance(world.player.velocity,world.clock,dt);if(Math.hypot(q.x-world.player.velocity.x,q.y-world.player.velocity.y)>1e-8)setPlayerVelocity(world,q.x,q.y);world.playerBurstAllowance=burst.view(world.clock).amount;},1,segment=>{struck||=segment.discontinuity;burst.observe(world.player.velocity,segment);world.playerBurstAllowance=burst.view(world.clock).amount;});assert.ok(world.player.position.x<70);}
 assert.ok(struck);assert.equal(burst.view(world.clock).amount,0);
 }finally{destroyPhysics(world);}
});
test('real killed primary victim still supplies one fixed conduction origin',()=>{
 const f=fixture();try{f.shot();const e=f.add('origin',-320,-400,1,'fang'),a=f.add('neighbor',-320,-480,5);f.hit(e);assert.equal(e.hp<=0,true);assert.equal(a.hp,4);assert.deepEqual(f.r.voltStatus().conduction.arc.origin,{x:e.x,y:e.y});assert.equal(f.events.filter(e=>e.type==='voltHit').length,1);}finally{f.r.dispose();}
});
