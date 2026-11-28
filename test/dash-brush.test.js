import test from 'node:test';
import assert from 'node:assert/strict';
import {createCanvas} from '@napi-rs/canvas';
import {positiveWidth,primaryWidth,PRIMARY_WIDTH_CAP,INK_WIDTH} from '../src/primary-width.js';
import {primaryGeometry,precisionShot} from '../src/primary-contact.js';
import {equipmentRules,ITEMS,normalizeEquipment,loadEquipment} from '../src/equipment.js';
import {PART_PERKS} from '../src/part-perks.js';
import {SWORD_STYLES,swordProfile} from '../src/swords.js';
import {createRun} from '../src/run.js';
import {createPhysics,destroyPhysics,placePlayer,stopPlayer} from '../src/physics.js';
import {createCombat} from '../src/slasher.js';
import {DASH_STUDY_IDS,dashStudy} from '../src/dash-study.js';
import {powerReadout,primaryReadout} from '../src/power-readout.js';
import {shopStudy,shopItems} from '../src/shop-catalog.js';
import {shopAbility,playerCanvas} from '../src/shop-language.js';
import {drawShopItemStudy} from '../src/art/splatr-art-engine.js';
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-8,`${a} != ${b}`);
const item=id=>ITEMS.find(i=>i.id===id);
function fixture(dash='dash-ink',extra={}){
 const events=[],r=createRun(77,(type,data)=>events.push({type,data}),{waveMode:true,equipment:{dash,...extra}});
 for(const e of [...r.combat.enemies.values()])r.combat.remove(e);
 Object.assign(r.state,{phase:'playing',opening:null,inputLock:false,invul:99999});r.state.wave.entry=0;
 placePlayer(r.world,{x:-350,y:-400});stopPlayer(r.world);r.world.grounded=false;
 r.combat.add({id:'sentinel',kind:'fang',x:700,y:-900,pinned:true,delay:999999});
 return {r,events};
}
test('Ink atomically trades its old blade time for real width, with honest shop/search/build receipts',()=>{
 const r=equipmentRules({dash:'dash-ink'}),base=equipmentRules({});assert.equal(PART_PERKS['dash-ink'].stat,'width');assert.equal(r.bladeExtra,base.bladeExtra);assert.equal(r.inkWidth,INK_WIDTH);
 for(const k of ['dashSpeed','aimFallGravity','armorDamage','edgeMax','healthMax','scoreMultiplier','chainGrace','focusDrain','focusRegen'])assert.equal(r[k],base[k],k);
 assert.match(powerReadout('dash-ink').detail,/up to 12% wider/);assert.match(powerReadout('dash-ink').detail,/No extra cutting time/);assert.doesNotMatch(powerReadout('dash-ink').detail,/0.02s longer/);
 assert.equal(primaryReadout({dash:'dash-ink'},SWORD_STYLES.standard).width,112);assert.ok(shopItems('dash',{query:'wider'}).some(i=>i.id==='dash-ink'));
 const limited=powerReadout('dash-ink',{head:'samurai',core:'magnet'});assert.match(limited.detail,/12% width farther out and 0% on a close pass/);
});
test('positive gains have stable head/core/dash/slash receipts, cap before narrowing, and preserve temporary width once',()=>{
 const rules=equipmentRules({head:'samurai',core:'magnet',dash:'dash-ink'}),q=primaryWidth(0,rules,precisionShot('sniper',1));
 near(q.far.total,1.344);near(q.near.total,1.35);near(q.narrowing,.9);near(q.width,1.344*.9);near(q.closeWidth,1.35/1.344);near(q.closeRadius,120);
 assert.deepEqual(q.near.entries.map(e=>e.id),['head','core','dash','slash']);assert.equal(q.near.entries[1].capLimited,true);assert.equal(q.near.entries[2].capLimited,true);near(q.near.entries[2].applied,1);
 assert.ok(Object.isFrozen(q));assert.ok(Object.isFrozen(q.near.entries));assert.equal(PRIMARY_WIDTH_CAP,1.35);
 const v=primaryWidth(0,equipmentRules({head:'viper',dash:'dash-ink'}),precisionShot('sniper',1));near(v.width,1.12*.85*.9);
 for(const sword of Object.values(SWORD_STYLES))for(const reach of [1,1.12,1.6]){const g=primaryGeometry({rules,sword,reach,width:1.25,shot:precisionShot('sniper',1)});near(g.geometry.span,82.8*sword.reach*reach);near(g.geometry.halfWidth,21.85*sword.reach*reach*sword.width*1.25*1.344*.9);near(g.geometry.halfWidth*g.closeWidth,21.85*sword.reach*reach*sword.width*1.25*1.35*.9);}
 near(positiveWidth([{id:'a',factor:1.2},{id:'b',factor:1.2}]).total,1.35);
});
test('horizontal condition includes left/right boundaries, near distance stays legacy-owned and Ink never shrinks capped coverage',()=>{
 for(const angle of [0,Math.PI,25*Math.PI/180,-25*Math.PI/180])near(primaryWidth(angle,equipmentRules({head:'samurai',dash:'dash-ink'})).far.total,1.344);
 for(const angle of [26*Math.PI/180,Math.PI/2])near(primaryWidth(angle,equipmentRules({head:'samurai',dash:'dash-ink'})).far.total,1.12);
 for(const head of ['none','samurai','viper'])for(const core of ['standard','magnet'])for(const angle of [0,.7,Math.PI/2]){
  const ink=primaryWidth(angle,equipmentRules({head,core,dash:'dash-ink'})),base=primaryWidth(angle,equipmentRules({head,core}));assert.ok(ink.far.total>=base.far.total);assert.ok(ink.near.total>=base.near.total);assert.equal(ink.closeRadius,base.closeRadius);
 }
});
test('actual convex sweeps gain an off-axis contact; shape/angle/range results use the same resolved band geometry',()=>{
 for(const angle of [0,Math.PI/4,Math.PI/2]){
  const w=createPhysics({spawn:{x:0,y:0}}),c=createCombat(w);try{
   const e=c.add({id:'edge',kind:'fang',x:70*Math.cos(angle)-12.8*Math.sin(angle),y:70*Math.sin(angle)+12.8*Math.cos(angle),size:.05,pinned:true});
   for(const [dash,hit] of [['dash-auto',false],['dash-ink',true]]){const g=primaryGeometry({angle,rules:equipmentRules({dash}),sword:SWORD_STYLES.standard});c.contacts.clear();assert.deepEqual(c.sweepBlade(angle,g.reach,g.width,g.closeWidth,g.closeRadius),g.geometry);assert.equal(c.contacts.has(e),hit,`${angle}/${dash}`);}
   const behind=c.add({id:'behind',kind:'fang',x:-60*Math.cos(angle),y:-60*Math.sin(angle),pinned:true});c.contacts.clear();c.sweepBlade(angle,1,1.12);assert.equal(c.contacts.has(behind),false);
  }finally{c.dispose();destroyPhysics(w);}
 }
});
test('real launch has identical velocity/collider/window, wider actual published sweep and no persistent dash damage',()=>{
 const a=fixture(),b=fixture('dash-auto');try{
  for(const f of [a,b])assert.equal(f.r.dash({x:42,y:0,power:1}),true);
  assert.deepEqual(a.r.world.player.velocity,b.r.world.player.velocity);assert.equal(a.r.state.blade,b.r.state.blade);assert.deepEqual(a.r.world.player.vertices.map(p=>[p.x,p.y]),b.r.world.player.vertices.map(p=>[p.x,p.y]));
  a.r.state.stop=b.r.state.stop=1;a.r.tick();b.r.tick();near(a.r.state.sweep.halfWidth,b.r.state.sweep.halfWidth*1.12);near(a.r.state.sweep.span,b.r.state.sweep.span);near(a.r.state.inkCutScale,1.12);
  const p=a.r.world.player.position,e=a.r.combat.add({id:'armor',kind:'bastion',x:p.x+30,y:p.y,pinned:true});e.hp=20;for(let i=0;i<3;i++){a.r.combat.contacts.add(e);a.r.state.stop=1;a.r.tick();}assert.equal(e.hp,19,'one shot never repeats a hit');
  a.r.state.blade=0;for(let i=0;i<45;i++){a.r.state.stop=1;a.r.tick();}assert.equal(e.hp,19);assert.equal(a.r.state.equipmentFx.projectiles.length,0);assert.equal(a.r.state.equipmentFx.echoes.length,0);
 }finally{a.r.dispose();b.r.dispose();}
});
test('near-band cap is real in shape queries, not canceled by smaller ratios or accidental shorter close radius',()=>{
 const w=createPhysics({spawn:{x:0,y:0}}),c=createCombat(w);try{
  const rules=equipmentRules({head:'samurai',core:'magnet',dash:'dash-ink'}),g=primaryGeometry({rules,sword:SWORD_STYLES.standard,reach:1.6});near(g.closeRadius,120);near(g.closeWidth,1.35/1.344);
  const nearTarget=c.add({id:'near',kind:'fang',x:110,y:24.05,size:.02,pinned:true}),farTarget=c.add({id:'far',kind:'fang',x:125,y:24.05,size:.02,pinned:true});c.contacts.clear();c.sweepBlade(0,g.reach,g.width,g.closeWidth,g.closeRadius);assert.equal(c.contacts.has(nearTarget),true);assert.equal(c.contacts.has(farTarget),false);
 }finally{c.dispose();destroyPhysics(w);}
});
test('all eight dash lessons have frozen rule-derived values, actual marginal caps and honest unreleased-power exclusions',()=>{
 assert.deepEqual(new Set(DASH_STUDY_IDS),new Set(ITEMS.filter(i=>i.slot==='dash').map(i=>i.id)));
 for(const id of DASH_STUDY_IDS){const q=dashStudy(item(id),3400,false);assert.ok(Object.isFrozen(q));assert.equal(q.illustration,true);assert.equal(shopStudy(item(id),3400,false).dash.id,id);}
 near(dashStudy(item('dash-ink'),3400,false).farGain,1.12);assert.equal(dashStudy(item('dash-ink'),3400,false,{head:'samurai',core:'magnet'}).nearGain,1);
 assert.equal(dashStudy(item('dash-fire'),3400,false).blade,0);assert.equal(dashStudy(item('dash-echo'),3400,false,{head:'neko',body:'lava',slash:'comic'}).grace,0);
 assert.equal(dashStudy(item('dash-water'),3400,false,{eyes:'glitch',world:'synth',pointer:'pointer-orbit'}).recovery,3);assert.equal(dashStudy(item('dash-void'),3400,false,{body:'gold',world:'foundry'}).scorePoints,0);
 assert.match(shopAbility('dash-fire').limit,/10% narrower/);assert.match(shopAbility('dash-ice').limit,/bosses resist/);assert.match(shopAbility('dash-echo').limit,/One pending replay/);
 assert.equal(dashStudy(item('halo')),null);
});
test('all eight lessons render distinct/progressing/still scenes with plain copy and no input/context mutation',()=>{
 const outputs=new Set();for(const id of DASH_STUDY_IDS){const eq=normalizeEquipment({dash:id}),draw=(time,motion)=>{const cv=createCanvas(640,400),c=playerCanvas(cv.getContext('2d')),study=shopStudy(item(id),time,motion,eq),raw=JSON.stringify(study),words=[];c.translate(2,3);c.globalAlpha=.8;const matrix=c.getTransform(),proxy=new Proxy(c,{get:(o,k)=>k==='fillText'?(s,...args)=>{words.push(s);o.fillText(s,...args);}:typeof o[k]==='function'?o[k].bind(o):o[k],set:(o,k,v)=>(o[k]=v,true)});drawShopItemStudy(proxy,640,400,{study,equipment:eq,sword:swordProfile(eq)});assert.equal(JSON.stringify(study),raw);assert.deepEqual(c.getTransform(),matrix);near(c.globalAlpha,.8);assert.doesNotMatch(words.join(' '),/\bticks?\b|\bsimulation\b|\bprimary\b/i);return cv.toBuffer('image/png');};assert.notDeepEqual(draw(0,true),draw(3400,true),id);assert.deepEqual(draw(0,false),draw(9999,false),id);outputs.add(draw(3400,false).toString('base64'));}assert.equal(outputs.size,8);
});
test('dash prices/ownership/save version/presets remain unchanged',()=>{
 assert.deepEqual(ITEMS.filter(i=>i.slot==='dash').map(i=>[i.id,i.price]),[['dash-auto',0],['dash-ink',150],['dash-fire',250],['dash-lightning',300],['dash-ice',300],['dash-water',250],['dash-void',350],['dash-echo',350]]);
 const raw={version:1,owned:DASH_STUDY_IDS,equipped:{dash:'dash-ink'},presets:[{dash:'dash-ice'},null,{dash:'dash-auto'}],discovered:[]},saved=loadEquipment(JSON.stringify(raw));assert.equal(saved.version,1);assert.equal(saved.equipped.dash,'dash-ink');assert.equal(saved.presets[0].dash,'dash-ice');assert.equal(saved.presets[2].dash,'dash-auto');
});
test('Magnet explanation reflects the capped near band, including a nearly spent combined bonus',async()=>{
 const {abilityShowcase}=await import('../src/ability-showcase.js');near(abilityShowcase(item('magnet'),3400,false,{head:'samurai'}).values.closeWidth,1.125);near(abilityShowcase(item('magnet'),3400,false,{head:'samurai',dash:'dash-ink'}).values.closeWidth,1.35/1.344);
});
test('real high-speed rail traversal keeps the same solid-body collision and rebound with Ink',async()=>{
 const {setPlayerVelocity}=await import('../src/physics.js');
 for(const speed of [42,120,180]){
  const a=fixture('dash-ink'),b=fixture('dash-auto');try{
   for(const f of [a,b]){placePlayer(f.r.world,{x:1550,y:-400});assert.equal(f.r.dash({x:42,y:0,power:1}),true);f.r.world.playerCeiling=speed;setPlayerVelocity(f.r.world,speed,0);f.r.tick();}
   assert.deepEqual(a.r.world.player.position,b.r.world.player.position);assert.deepEqual(a.r.world.player.velocity,b.r.world.player.velocity);assert.ok(a.r.world.player.position.x<=1577.1);assert.equal(a.r.state.hp,b.r.state.hp);near(a.r.state.sweep.halfWidth,b.r.state.sweep.halfWidth*1.12);
  }finally{a.r.dispose();b.r.dispose();}
 }
});
