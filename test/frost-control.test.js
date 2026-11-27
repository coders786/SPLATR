import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createCanvas} from '@napi-rs/canvas';
import {createFrostControl,coldEligible,coldTiming,FROST} from '../src/frost-control.js';
import {frostStudy} from '../src/frost-study.js';
import {createRun} from '../src/run.js';
import {createPhysics,destroyPhysics,placePlayer,stopPlayer} from '../src/physics.js';
import {createCombat} from '../src/slasher.js';
import {createCombatSourceTrace} from '../src/combat-source-trace.js';
import {equipmentRules,normalizeEquipment,ITEMS,loadEquipment} from '../src/equipment.js';
import {PART_PERKS} from '../src/part-perks.js';
import {shopAbility,playerCanvas} from '../src/shop-language.js';
import {shopItems,shopStudy} from '../src/shop-catalog.js';
import {powerReadout} from '../src/power-readout.js';
import {drawFrostStatus,drawFrostLaunch,drawShopItemStudy,enemyIntent,enemyThreatIndicators,legacy_radar,drawCubeHero} from '../src/art/splatr-art-engine.js';
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-8,`${a} != ${b}`),actor=(id='a',kind='fang',x=0,y=0,hp=3)=>({id,kind,x,y,hp,mode:'idle'});
const setup=()=>{const cold=createFrostControl(),a=actor(),map=new Map([[a.id,a]]);cold.launch(1);return {cold,a,map};};
function aiFixture(){const world=createPhysics({seed:77,spawn:{x:-350,y:-400},pad:{x:-500,y:200,w:300,h:20}}),combat=createCombat(world),cold=createFrostControl();cold.launch(1);return {world,combat,cold,add:(kind='fang',id=kind,x=-200,y=-400)=>combat.add({id,kind,x,y,delay:999999,hp:10}),dispose(){cold.clear();combat.dispose();destroyPhysics(world);}};}
function fixture(extra={},observed=false){const events=[],trace=observed?createCombatSourceTrace(2048):null,r=createRun(77,(type,data)=>events.push({type,data}),{waveMode:true,equipment:{dash:'dash-ice',...extra},combatSourceTrace:trace});
 for(const e of [...r.combat.enemies.values()])r.combat.remove(e);Object.assign(r.state,{phase:'playing',opening:null,inputLock:false,invul:99999});r.state.wave.entry=0;placePlayer(r.world,{x:-350,y:-400});stopPlayer(r.world);r.world.grounded=false;
 r.combat.add({id:'sentinel',kind:'fang',x:700,y:-900,pinned:true,delay:999999});
 const add=(id='armor',kind='bastion',x=-320,y=-400,hp=10)=>r.combat.add({id,kind,x,y,hp,delay:999999});
 const shot=()=>{r.state.inputLock=false;r.state.edge=3;assert.equal(r.dash({x:30,y:0,power:30/42}),true);};
 const hit=e=>{r.combat.contacts.add(e);r.state.stop=1;r.tick();};
 const at=now=>{r.world.clock=now;r.state.blade=0;r.state.stop=1;r.combat.contacts.clear();r.tick();};return {r,events,trace,add,shot,hit,at};}

test('C63 atomically replaces Frost aim discount with real cold; no hidden speed, width, blade or damage change',()=>{
 const r=equipmentRules({dash:'dash-ice'}),b=equipmentRules({});assert.equal(r.frostControl,true);assert.equal(r.focusDrain,1);assert.equal(PART_PERKS['dash-ice'].stat,'cold');
 for(const key of ['healthMax','edgeMax','cutWidth','dashNarrowing','bladeExtra','dashSpeed','armorDamage','focusRegen'])assert.equal(r[key],b[key],key);
 assert.match(powerReadout('dash-ice').detail,/Fangs freeze/);assert.match(shopAbility('dash-ice').limit,/no longer costs less/);assert.ok(shopItems('dash',{query:'Fangs freeze'}).some(i=>i.id==='dash-ice'));
});
test('cold is first-contact per accepted launch; no launch, secondary, boss and protected contacts cannot admit',()=>{
 const c=createFrostControl(),e=actor();assert.deepEqual(c.contact(e,{primary:true}),[]);c.launch(1);assert.deepEqual(c.contact(e),[]);assert.equal(c.view().spent,false);
 for(const change of [{kind:'monolith'},{kind:'none'},{pinned:true},{paper:true},{tutorialProtected:true},{tutorialTargetPlayer:true}]){assert.equal(coldEligible({...e,...change}),false);assert.deepEqual(c.contact({...e,...change},{primary:true}),[]);}
 assert.equal(c.view().spent,false);assert.deepEqual(c.contact(e,{primary:true}),[e]);assert.equal(c.view().spent,true);assert.deepEqual(c.contact(actor('b'),{primary:true}),[]);
});
test('surviving center plus at most one nearest distinct neighbor, inclusive60 with deterministic tie; dead victim can seed neighbor',()=>{
 const {cold:c,a}=setup(),one=actor('b','bastion',60),two=actor('c','fang',0,60),far=actor('far','fang',60.001),accepted=c.contact(a,{primary:true,enemies:[two,far,one]});assert.deepEqual(accepted.map(e=>e.id),['a','b']);assert.equal(a.frostCold.kind,'freeze');assert.equal(one.frostCold.kind,'slow');assert.equal(two.frostCold,undefined);
 c.clear();c.launch(2);a.hp=0;assert.deepEqual(c.contact(a,{primary:true,enemies:[two]}),[two]);assert.equal(a.frostCold,undefined);
});
test('sight refuses crossing and grazing solid spread, boss/teaching neighbors; immune nearest lets next eligible neighbor win',()=>{
 const {cold:c,a,map}=setup(),blocked=actor('blocked','fang',-20),boss=actor('boss','monolith',1),guard={...actor('guard','fang',2),tutorialProtected:true},nearby=actor('next','fang',0,30);
 assert.deepEqual(c.contact(a,{primary:true,enemies:[blocked,boss,guard,nearby],geometry:[{x:-12,y:-4,w:3,h:8}]}).map(e=>e.id),['a','next']);
 map.set(nearby.id,nearby);c.advance(18,map);c.launch(2);const other=actor('other','fang',0,50);assert.deepEqual(c.contact(a,{primary:true,now:20,enemies:[nearby,other]}),[other]);
});
test('absolute cold deadlines do not refresh; immunity starts at real thaw, not acceptance or a late inspection',()=>{
 const {cold:c,a,map}=setup();c.contact(a,{primary:true,now:10});assert.equal(a.frostCold.until,28);assert.equal(a.frostCold.immunityUntil,118);const status=a.frostCold;
 c.launch(2);assert.deepEqual(c.contact(a,{primary:true,now:27.99}),[]);assert.equal(a.frostCold,status);let thaws=0;c.advance(27.99,map,()=>thaws++);assert.equal(thaws,0);
 c.advance(28,map,()=>thaws++);assert.equal(thaws,1);assert.equal(a.frostCold.phase,'immune');assert.equal(a.frostCold.thawedAt,28);c.advance(40,map,()=>thaws++);assert.equal(thaws,1);
 c.launch(3);assert.deepEqual(c.contact(a,{primary:true,now:117.99}),[]);c.launch(4);assert.deepEqual(c.contact(a,{primary:true,now:118}),[a]);assert.equal(a.frostCold.until,136);c.advance(1000,map,()=>thaws++);assert.equal(a.frostCold,undefined);assert.equal(thaws,2);
});
test('heavy slow lasts24 then90 immunity; capacity includes recovery and cannot grow from repeated launches',()=>{
 const c=createFrostControl(),map=new Map();for(let i=0;i<35;i++){const e=actor(String(i),'crown',i*100);map.set(e.id,e);c.launch(i);c.contact(e,{primary:true});}assert.equal(c.view().targets,FROST.maxTargets);assert.equal(c.view().active,32);assert.equal(map.get('34').frostCold,undefined);
 c.advance(24,map);assert.equal(c.view().active,0);assert.equal(c.view().targets,32);assert.equal(map.get('0').frostCold.immunityUntil,114);c.advance(114,map);assert.equal(c.view().targets,0);
});
test('death, target generation, ineligible actors, clear/dispose remove both cold and immunity without fake thaw',()=>{
 for(const action of ['dead','replace','protected','clear']){const {cold:c,a,map}=setup();c.contact(a,{primary:true});if(action==='dead')a.hp=0;if(action==='replace')map.set(a.id,actor());if(action==='protected')a.tutorialProtected=true;if(action==='clear')c.clear();c.advance(18,map,()=>assert.fail('cancel cannot thaw'));assert.equal(a.frostCold,undefined);assert.equal(c.view().targets,0);assert.equal(map.get(a.id).frostCold,undefined);}
});
test('interval math preserves fractional expiry, safe zero/invalid dt, strongest movement choice rather than stacked slow',()=>{
 const {cold:c,a}=setup();c.contact(a,{primary:true});assert.deepEqual(coldTiming(a,0,1),{ai:0,motion:0,scale:0});near(coldTiming(a,17.75,.5).ai,.25);near(coldTiming(a,17.75,.5).motion,.25);assert.equal(coldTiming(a,0,0).motion,0);assert.equal(coldTiming(a,0,NaN).motion,0);
 const heavy=actor('h','bastion');c.launch(2);c.contact(heavy,{primary:true});near(coldTiming(heavy,0,1).motion,.7);near(coldTiming(heavy,0,1,.5).motion,.5);near(coldTiming(heavy,23.75,.5).motion,.425);near(coldTiming(heavy,24,.5).motion,.5);assert.equal(coldTiming(heavy,0,1).ai,1);
});
test('real Fang locomotion, initiation, existing tell and rush clocks stop; no phantom tell progress in frozen pose',()=>{
 for(const mode of ['idle','tell','rush','recover']){const f=aiFixture();try{const e=f.add();Object.assign(e,{mode,clock:30,cool:mode==='idle'?0:50,span:66,aim:0,lungeSpeed:10});f.cold.contact(e,{primary:true});const old={x:e.x,y:e.y,clock:e.clock,cool:e.cool,age:e.age,angle:e.angle};f.combat.move(1,1);assert.deepEqual({x:e.x,y:e.y,clock:e.clock,cool:e.cool,age:e.age,angle:e.angle},old,mode);assert.equal(e.mode,mode);assert.equal(e.vx,0);assert.equal(e.vy,0);
 f.world.clock=18;f.cold.advance(18,f.combat.enemies);f.combat.move(1,1);if(mode==='tell'||mode==='rush'||mode==='recover')assert.equal(e.clock,29);else assert.equal(e.mode,'tell');
 }finally{f.dispose();}}
});
test('a half-step crossing thaw resumes only the unfrozen fraction of real Fang motion and countdown',()=>{
 const f=aiFixture();try{const e=f.add();Object.assign(e,{mode:'rush',clock:24,aim:0,lungeSpeed:10});f.cold.contact(e,{primary:true});f.world.clock=17.75;const x=e.x;f.combat.move(.5,1);near(e.x-x,2.5);near(e.clock,23.75);near(e.vx,5);}finally{f.dispose();}
});
test('all seven non-Fang kinds slow only ordinary translation; heavy tells/recover clocks and attack emissions continue',()=>{
 for(const kind of ['bastion','crown','prism','fork','pulse','rift','well']){const a=aiFixture(),b=aiFixture();try{const e=a.add(kind),base=b.add(kind);a.cold.contact(e,{primary:true});const start={x:e.x,y:e.y};a.combat.move(1,1);b.combat.move(1,1);near(e.x-start.x,(base.x-start.x)*.7);near(e.y-start.y,(base.y-start.y)*.7);assert.equal(e.cool,base.cool);
 Object.assign(e,{mode:'tell',clock:2,span:84});Object.assign(base,{mode:'tell',clock:2,span:84});a.combat.move(.5,1);b.combat.move(.5,1);assert.equal(e.clock,1.5);assert.equal(e.clock,base.clock);a.combat.move(2,1);b.combat.move(2,1);assert.equal(e.mode,base.mode);assert.equal(a.combat.hazards.length,b.combat.hazards.length);
 }finally{a.dispose();b.dispose();}}
});
test('emitted needles, expanding rings and active zones keep their own timers while a nearby Fang is frozen',()=>{
 const f=aiFixture();try{const e=f.add();f.cold.contact(e,{primary:true});const needle={kind:'needle',sourceId:e.id,x:0,y:-700,px:0,py:-700,vx:3,vy:2,life:50,age:0},ring={kind:'ring',sourceId:e.id,x:0,y:-700,px:0,py:-700,radius:10,previousRadius:10,life:50,age:0},zone={kind:'zone',sourceId:e.id,x:0,y:-700,px:0,py:-700,zone:{x:0,y:-700,radius:5},life:10,age:0};f.combat.hazards.push(needle,ring,zone);f.combat.move(1,1);f.combat.attacks(1,()=>{});assert.equal(needle.x,3);assert.equal(needle.y,-698);near(ring.radius,13.45);assert.equal(zone.life,9);assert.equal(e.frostCold.phase,'active');}finally{f.dispose();}
});
test('cold does not change pinned boss actions, player velocity, enemy HP or direct-hit identity',()=>{
 const f=aiFixture();try{const e=f.combat.add({id:'boss',kind:'monolith',x:400,y:-1000,pinned:true,home:'monolith'}),old={hp:e.hp,lastSlash:e.lastSlash,velocity:{...f.world.player.velocity}};e.lashTell=10;assert.deepEqual(f.cold.contact(e,{primary:true}),[]);f.combat.move(1,1);assert.equal(e.lashTell,9);assert.equal(e.hp,old.hp);assert.equal(e.lastSlash,old.lastSlash);assert.deepEqual(f.world.player.velocity,old.velocity);}finally{f.dispose();}
});
test('zero AI dt is a true no-op, not NaN velocity or free timers',()=>{const f=aiFixture();try{const e=f.add();const before=JSON.stringify({x:e.x,y:e.y,cool:e.cool,vx:e.vx,age:e.age});for(const dt of [0,-1,NaN,Infinity])f.combat.move(dt,1);assert.equal(JSON.stringify({x:e.x,y:e.y,cool:e.cool,vx:e.vx,age:e.age}),before);}finally{f.dispose();}});
test('Hypno remains initiation-only; Frost preserves it through thaw without multiplying unrelated status clocks',()=>{
 const f=aiFixture();try{const e=f.add();e.hypnoUntil=50;e.cool=0;f.cold.contact(e,{primary:true});f.combat.move(1,1);assert.equal(e.cool,0);f.world.clock=18;f.cold.advance(18,f.combat.enemies);f.combat.move(1,1);assert.equal(e.mode,'idle');assert.ok(e.cool<0);f.world.clock=50;f.combat.move(1,1);assert.equal(e.mode,'tell');}finally{f.dispose();}
});
test('real primary armor contact chills survivor and one live neighbor; second contact cannot chill another group',()=>{
 const f=fixture();try{f.shot();const e=f.add(),n=f.add('neighbor','fang',-320,-450,1);f.hit(e);assert.equal(e.hp,9);assert.equal(e.frostCold.kind,'slow');assert.equal(n.frostCold.kind,'freeze');assert.equal(f.events.filter(e=>e.type==='frostContact').length,1);const next=f.add('next','bastion',-100,-400);f.hit(next);assert.equal(next.frostCold,undefined);assert.equal(f.r.frostStatus().spent,true);}finally{f.r.dispose();}
});
test('killed first victim still chills nearby survivor; no cold damage or recursive secondary spread/charge/rewards',()=>{
 const f=fixture({head:'coil',core:'echo'});try{f.shot();const victim=f.add('victim','fang',-320,-400,1),neighbor=f.add('neighbor','bastion',-320,-450,10);f.hit(victim);assert.equal(f.r.combat.enemies.has(victim.id),false);assert.equal(neighbor.frostCold.kind,'slow');const hp=neighbor.hp,kills=f.r.state.kills,chain=f.r.state.chain,charge=f.r.state.swordCharge;f.at(24);assert.equal(neighbor.hp,hp);assert.equal(f.r.state.kills,kills);assert.equal(f.r.state.chain,chain);assert.equal(f.r.state.swordCharge,charge);assert.equal(f.r.state.equipmentFx.echoes.length,0);assert.equal(f.events.filter(e=>e.type==='frostContact').length,1);}finally{f.r.dispose();}
 const g=fixture();try{g.shot();const e=g.add('echo','bastion',-500,-500);g.r.state.equipmentFx.echoes.push({x:-500,y:-500,ticks:30,hits:new Set(),sourceId:'none'});g.at(1);assert.equal(e.hp,9);assert.equal(e.frostCold,undefined);assert.equal(g.r.frostStatus().spent,false);}finally{g.r.dispose();}
});
test('actual run uses world clock, not hitstop/input calls; frozen Grav Fang cannot drift from an external aim pull',()=>{
 for(const core of ['standard','time','grav']){const f=fixture({core});try{f.shot();const e=f.add(),n=f.add('neighbor','fang',-320,-450,10);f.hit(e);const status=n.frostCold;for(let i=0;i<25;i++){f.r.state.stop=1;f.r.tick();}assert.equal(n.frostCold,status);assert.equal(status.phase,'active');
 if(core==='grav'){n.small=true;const x=n.x,y=n.y;f.r.focus(true);f.r.state.blade=0;f.r.state.stop=0;f.r.tick();near(n.x,x);near(n.y,y);}
 const hp=n.hp;f.at(status.until);assert.equal(n.frostCold.phase,'immune');assert.equal(n.frostCold.immunityUntil,status.until+90);assert.equal(n.hp,hp);assert.equal(f.events.filter(e=>e.type==='frostThaw'&&e.data.entityId===n.id).length,1);f.at(status.until+90);assert.equal(n.frostCold,undefined);
 }finally{f.r.dispose();}}
});
test('cold cost uses baseline focus with Time and pointer/visor discounts intact; slow world changes neither cold deadlines nor player release',()=>{
 for(const extra of [{},{core:'time'},{eyes:'visor',pointer:'pointer-cross'}]){const a=fixture(extra),b=fixture({...extra,dash:'dash-auto'});try{a.shot();b.shot();assert.deepEqual(a.r.world.player.velocity,b.r.world.player.velocity);a.r.focus(true);b.r.focus(true);a.r.state.stop=b.r.state.stop=0;a.r.tick();b.r.tick();near(a.r.state.focus,b.r.state.focus);near(a.r.world.clock,b.r.world.clock);assert.deepEqual(a.r.world.player.position,b.r.world.player.position);}finally{a.r.dispose();b.r.dispose();}}
});
test('death/retire/dispose/teaching/wave exit removes active and immune cold; no delayed thaw from canceled state',()=>{
 for(const action of ['retire','dispose','teaching','wave']){const f=fixture();try{f.shot();const e=f.add();f.hit(e);if(action==='retire')f.r.retire();if(action==='dispose')f.r.dispose();if(action==='teaching'){f.r.state.teachingArena=true;f.at(1);}if(action==='wave'){f.r.state.wave.platform={x:-500,y:200,w:300,h:24};f.r.state.wave.phase='return';f.at(1);}assert.equal(e.frostCold,undefined);assert.equal(f.r.frostStatus().targets,0);assert.equal(f.events.filter(e=>e.type==='frostThaw').length,0);}finally{f.r.dispose();}}
});
test('optional source observation never controls cold admission, real events, health or movement',()=>{
 const run=observed=>{const f=fixture({},observed);try{f.shot();const e=f.add(),n=f.add('n','fang',-320,-450,2);f.hit(e);f.at(18);f.at(24);return {hp:[e.hp,n.hp],x:[e.x,n.x],status:f.r.frostStatus(),events:f.events.filter(e=>/^frost/.test(e.type)),kills:f.r.state.kills};}finally{f.r.dispose();}};assert.deepEqual(run(false),run(true));
});
test('frozen tell/rush badges and edge notices tell the truth, heavy windups stay windups; radar uses a shape-coded status',()=>{
 const c=createFrostControl(),a={...actor('f','fang',500,0),clock:30,span:66,mode:'tell',r:20},h={...actor('h','bastion',550,0),clock:40,span:84,mode:'tell',r:30};c.launch(1);c.contact(a,{primary:true,enemies:[h]});assert.equal(enemyIntent(a).state,'FROZEN');assert.equal(enemyIntent(a).progress,1-30/66);assert.equal(enemyIntent(h).state,'WINDUP');
 const combat={enemies:new Map([[a.id,a],[h.id,h]]),hazards:[{x:600,y:0,sourceId:a.id,source:'prism',kind:'needle'}],links:[]},view={x:0,y:-100,w:400,h:300,width:400,height:300,scale:1};assert.ok(enemyThreatIndicators(view,combat).some(e=>e.state==='FROZEN'));assert.ok(enemyThreatIndicators(view,combat).some(e=>e.state==='ATTACK'));
 const radar=legacy_radar.localRadar({x:0,y:0,w:1000,h:1000},{x:0,y:0},{x:0,y:0,w:100,h:100},[a,h]);assert.deepEqual(radar.blips.map(e=>e.cold),['freeze','slow']);c.clear();assert.equal(enemyIntent(a).state,'WINDUP');
});
test('cached lesson uses real AI and production ledger: paused Fang30, heavy drift slowed, fired shot advances, thaw/resist exactly',()=>{
 const x=frostStudy(2200,true),y=frostStudy(3000,true),z=frostStudy(4799,true);assert.deepEqual(x.sample.accepted,['armor','fang']);assert.equal(x.sample.fang.clock,30);assert.ok(x.baseline.fang.clock<30);assert.ok(x.travel.cold<x.travel.baseline);assert.ok(x.needleTravel>0);assert.equal(x.sample.blocked.status,null);assert.equal(x.sample.far.status,null);assert.equal(x.sample.boss.status,null);assert.equal(y.sample.fang.status.phase,'immune');assert.equal(z.sample.fang.status,null);assert.ok(Object.isFrozen(x)&&Object.isFrozen(x.sample.fang));assert.equal(frostStudy(2200).sample,x.sample,'cached immutable frame, not a physics pass every render');
});
const image=(draw)=>{const cv=createCanvas(160,140),c=cv.getContext('2d');draw(c);return cv.toBuffer('image/png');};
test('closed freeze and open slow collars are distinct, deterministic, remain stable without motion and restore canvas state',()=>{
 const active={phase:'active',kind:'freeze',born:0,until:18,immunityUntil:108,thawedAt:null},args={x:80,y:70,radius:24,status:active,motion:false};assert.deepEqual(image(c=>drawFrostStatus(c,{...args,now:5})),image(c=>drawFrostStatus(c,{...args,now:15})));assert.notDeepEqual(image(c=>drawFrostStatus(c,{...args,now:5})),image(c=>drawFrostStatus(c,{...args,status:{...active,kind:'slow'},now:5})));
 const cv=createCanvas(160,140),c=cv.getContext('2d');c.translate(2,3);c.globalAlpha=.5;const matrix=c.getTransform();drawFrostStatus(c,{...args,now:5});drawFrostLaunch(c,{x:40,y:40,vx:30,vy:0,age:2});assert.deepEqual(c.getTransform(),matrix);assert.equal(c.globalAlpha,.5);assert.deepEqual(active,{phase:'active',kind:'freeze',born:0,until:18,immunityUntil:108,thawedAt:null});
});
test('cold rim clears at expiry, actual thaw gives bounded shards then quiet resistance not a fake freeze',()=>{
 const immune={phase:'immune',kind:'freeze',born:0,until:18,immunityUntil:108,thawedAt:18},draw=now=>image(c=>drawFrostStatus(c,{x:80,y:70,radius:24,status:immune,now}));assert.notDeepEqual(draw(18),draw(30));assert.deepEqual(draw(30),draw(90));assert.deepEqual(draw(108),image(()=>{}));assert.notDeepEqual(draw(18),image(()=>{}));
});
test('Frost launch is finite, directional, inert in reduced motion and never changes core/hero construction',()=>{
 const blank=image(()=>{}),draw=(age,motion=true,angle=0)=>image(c=>drawFrostLaunch(c,{x:80,y:70,vx:30,vy:0,age,motion,angle}));assert.notDeepEqual(draw(2),blank);assert.notDeepEqual(draw(2),draw(2,true,Math.PI/2));assert.deepEqual(draw(13),blank);assert.deepEqual(draw(2,false),blank);assert.deepEqual(draw(-1),blank);
 for(const core of ['riot','standard']){const eq=normalizeEquipment({core,dash:'dash-ice'});const hero=()=>image(c=>drawCubeHero(c,{x:80,y:70,radius:24,equipment:eq,time:0,motion:false}));assert.deepEqual(hero(),hero());}
});
test('shop animation demonstrates changing power states and pixel-still reduced motion; no save mutation or jargon',()=>{
 const it=ITEMS.find(i=>i.id==='dash-ice'),raw=JSON.stringify({version:1,owned:[it.id],equipped:{dash:it.id},presets:[{dash:it.id},null,null],discovered:[]}),save=loadEquipment(raw),before=JSON.stringify(save),draw=(time,motion)=>{const cv=createCanvas(640,400);drawShopItemStudy(playerCanvas(cv.getContext('2d')),640,400,{equipment:save.equipped,study:shopStudy(it,time,motion,save.equipped)});return cv.toBuffer('image/png');};assert.notDeepEqual(draw(0,true),draw(2200,true));assert.notDeepEqual(draw(2200,true),draw(3400,true));assert.deepEqual(draw(0,false),draw(99999,false));assert.equal(JSON.stringify(save),before);assert.doesNotMatch(Object.values(shopAbility(it.id)).join(' '),/\bticks?\b|\bsimulation\b|\bprimary\b/i);
});
test('the standalone artwork engine stays import-free; cold logic owns deadlines, not a render emitter',()=>{const art=readFileSync(new URL('../src/art/splatr-art-engine.js',import.meta.url),'utf8');assert.doesNotMatch(art,/^import\s/m);assert.doesNotMatch(readFileSync(new URL('../src/frost-control.js',import.meta.url),'utf8'),/requestAnimationFrame|setTimeout|Math.random/);});

test('a frozen rushing Fang is not an invulnerability pickup: real body collision still hurts',()=>{
 const f=fixture();try{f.shot();const e=f.add(),n=f.add('rush','fang',-320,-455,10);Object.assign(n,{mode:'rush',clock:20,aim:Math.PI,lungeSpeed:10.8});f.hit(e);assert.equal(n.frostCold.kind,'freeze');
 Object.assign(f.r.state,{blade:0,parry:0,invul:0,cutGrace:0,stop:0});f.r.state.cutImmunity.clear();placePlayer(f.r.world,{x:n.x,y:n.y});stopPlayer(f.r.world);f.r.tick();assert.equal(f.r.state.hp,2);assert.ok(f.events.some(e=>e.type==='hurt'));assert.equal(n.clock,20,'parked rush was not animated forward to inflict damage');
 }finally{f.r.dispose();}
});
