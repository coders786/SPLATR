import test from 'node:test';
import assert from 'node:assert/strict';
import {createCanvas} from '@napi-rs/canvas';
import {SNIPER,precisionShot,primaryGeometry,legacyPrimaryBase,extraPlateReceipt,commitPrecision} from '../src/primary-contact.js';
import {AIM_STUDY_IDS,aimStudy} from '../src/aim-study.js';
import {equipmentRules,normalizeEquipment,ITEMS} from '../src/equipment.js';
import {swordProfile,SWORD_STYLES} from '../src/swords.js';
import {sweepGeometry} from '../src/slice-safe.js';
import {horizontalCutWidth} from '../src/equipment-combat.js';
import {createRun} from '../src/run.js';
import {placePlayer,stopPlayer} from '../src/physics.js';
import {shopStudy,shopItems} from '../src/shop-catalog.js';
import {powerReadout,primaryReadout} from '../src/power-readout.js';
import {PART_PERKS} from '../src/part-perks.js';
import {shopAbility,playerCanvas} from '../src/shop-language.js';
import {drawShopItemStudy,aimVisuals,trajectorySamples,radarRange} from '../src/art/splatr-art-engine.js';
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-8,`${a} != ${b}`);
function fixture(equipment={eyes:'sniper'}){
 const events=[],r=createRun(77,(type,data)=>events.push({type,data}),{waveMode:true,equipment});
 for(const e of [...r.combat.enemies.values()])r.combat.remove(e);
 Object.assign(r.state,{phase:'playing',opening:null,inputLock:false,invul:99999});r.state.wave.entry=0;
 placePlayer(r.world,{x:-350,y:-400});stopPlayer(r.world);r.world.grounded=false;
 r.combat.add({id:'sentinel',kind:'fang',x:700,y:-900,pinned:true,delay:999999});
 const shot=(power=1)=>{r.state.edge=3;r.state.inputLock=false;assert.equal(r.dash({x:42*power,y:0,power}),true);};
 const hit=(id,kind='bastion',hp=20)=>{const p=r.world.player.position,e=r.combat.add({id,kind,x:p.x+30,y:p.y,pinned:true,delay:999999});e.hp=hp;r.combat.contacts.add(e);r.state.stop=1;r.tick();return hp-e.hp;};
 return {r,events,shot,hit};
}
test.skip('[retired cosmetic power] Sniper atomically replaces score with a released-power first-armor perk and plain tradeoff',()=>{
 assert.equal(PART_PERKS.sniper.stat,'puncture');assert.deepEqual(equipmentRules({eyes:'sniper'}).scorePerks,[]);
 assert.match(powerReadout('sniper').detail,/10% narrower/);assert.match(powerReadout('sniper').detail,/No homing or score bonus/);
 assert.match(shopAbility('sniper').effect,/Crown or Bastion/);assert.ok(shopItems('eyes',{query:'plate'}).some(i=>i.id==='sniper'));
 assert.ok(primaryReadout({eyes:'sniper'},SWORD_STYLES.standard).conditional.some(s=>/first armor/.test(s)));
 for(const power of [.899,.9,1]){const s=precisionShot('sniper',power,3);assert.equal(s.eligible,power>=.9);assert.equal(s.widthScale,power>=.9?.9:1);}
 for(const power of [NaN,undefined,0])assert.equal(precisionShot('sniper',power).eligible,false);
 assert.equal(precisionShot('ninja',1).eligible,false);
});
test('legacy family geometry stays exact except the explicitly migrated Samurai+Magnet near cap; narrowing comes last',()=>{
 for(const sword of Object.values(SWORD_STYLES))for(const head of ['none','viper','samurai'])for(const core of ['standard','magnet'])for(const angle of [0,24*Math.PI/180,26*Math.PI/180,Math.PI/2,Math.PI])for(const reach of [1,1.12,1.6]){
  const rules=equipmentRules({head,core}),old={reach:reach*sword.reach,width:horizontalCutWidth(angle,rules)*sword.width*1.2,closeWidth:rules.closeWidth},actual=primaryGeometry({angle,rules,sword,reach,width:1.2});const oldGeo=sweepGeometry(old);if(head==='samurai'&&core==='magnet'&&Math.abs(Math.sin(angle))<=Math.sin(25*Math.PI/180)){assert.deepEqual(actual.geometry,{...oldGeo,closeWidth:1.35/1.2});}else assert.deepEqual(actual.geometry,oldGeo);
  const narrow=primaryGeometry({angle,rules,sword,reach,width:1.2,shot:precisionShot('sniper',.9)});near(narrow.geometry.span,actual.geometry.span);near(narrow.geometry.halfWidth,actual.geometry.halfWidth*.9);near(narrow.geometry.closeRadius,actual.geometry.closeRadius);near(narrow.closeWidth,actual.closeWidth);
 }
 const base=primaryGeometry({rules:equipmentRules({}),sword:SWORD_STYLES.standard});near(base.geometry.span,82.8);near(base.geometry.halfWidth,21.85);
});
test('legacy base adapter preserves secondary / Drive / shear / armor order',()=>{
 for(const secondary of [false,true])for(const drive of [false,true])for(const fromShear of [false,true])for(const kind of ['fang','crown','bastion','monolith'])for(const swordArmor of [0,1,2]){
  const q={secondary,drive,fromShear,kind,armorDamage:2,swordArmor,shearDamage:4},old=secondary?1:drive?3:!fromShear&&['crown','bastion'].includes(kind)?2+swordArmor:fromShear?4:1;assert.equal(legacyPrimaryBase(q),old);
 }
});
test('first eligibility commits once; boss and every secondary keep it, full extra-plate cap consumes honestly',()=>{
 const s=precisionShot('sniper',1,7);
 for(const kind of ['monolith','fang','prism'])assert.equal(commitPrecision(s,{primary:true,kind}),null);
 for(let i=0;i<8;i++)assert.equal(commitPrecision(s,{primary:false,kind:'crown'}),null);
 assert.equal(s.spent,false);const receipt=commitPrecision(s,{primary:true,kind:'crown',other:[{id:'head',plates:1},{id:'core',plates:1}]});
 assert.equal(s.spent,true);assert.equal(receipt.total,2);assert.deepEqual(receipt.entries.at(-1),{id:'sniper',requested:1,applied:0,capLimited:true});assert.equal(receipt.consumed,true);
 assert.equal(commitPrecision(s,{primary:true,kind:'bastion'}),null);assert.ok(Object.isFrozen(receipt));
 assert.equal(extraPlateReceipt([{id:'a',plates:1},{id:'b',plates:4}]).total,2);
});
test.skip('[retired cosmetic power] real shot snapshots authoritative power and width; below-threshold/second armor do not gain plates',()=>{
 for(const power of [.899,.9,1]){
  const f=fixture();try{f.shot(power);near(f.r.state.precisionShot.power,power);const geometry=f.r.primaryGeometry();near(geometry.halfWidth,21.85*(power>=.9?.9:1));
   assert.equal(f.hit('first'),power>=.9?2:1);assert.equal(f.hit('second','crown'),1);assert.equal(f.events.filter(e=>e.type==='precisionPuncture').length,power>=.9?1:0);
   assert.equal(f.r.state.sweep.halfWidth,geometry.halfWidth);f.shot(1);assert.equal(f.hit('third'),2);assert.equal(f.r.state.precisionShot.spent,true);
  }finally{f.r.dispose();}
 }
});
test.skip('[retired cosmetic power] real full-power commitment survives boss, nonarmor and duplicate contacts; no velocity/homing writer',()=>{
 const f=fixture();try{f.shot();assert.equal(f.hit('boss','monolith'),2);assert.equal(f.r.state.precisionShot.spent,false);f.hit('normal','fang');assert.equal(f.r.state.precisionShot.spent,false);assert.equal(f.hit('armor'),2);const receipt=f.r.state.precisionReceipt;const armor=f.r.combat.enemies.get('armor'),hp=armor.hp;f.r.combat.contacts.add(armor);f.r.state.stop=1;f.r.tick();assert.equal(armor.hp,hp);assert.equal(f.r.state.precisionReceipt,receipt);assert.equal(f.events.filter(e=>e.type==='precisionPuncture').length,1);
 }finally{f.r.dispose();}
 const a=fixture({eyes:'sniper'}),b=fixture({eyes:'ninja'});try{a.shot();b.shot();assert.deepEqual(a.r.world.player.velocity,b.r.world.player.velocity);near(a.r.state.slashAngle,b.r.state.slashAngle);a.hit('kill','fang',1);b.hit('kill','fang',1);assert.equal(a.r.state.score,b.r.state.score);}finally{a.r.dispose();b.r.dispose();}
});
test.skip('[retired cosmetic power] Sniper adds one after existing Drive/kinetic damage, preserves Crown + legacy sword armor terms',()=>{
 for(const [eq,drive,expected] of [[{},false,2],[{head:'crown'},false,3],[{},true,4],[{head:'crown'},true,4]]){
  const f=fixture({eyes:'sniper',...eq});try{f.shot();if(drive)f.r.state.drive=100;assert.equal(f.hit('plate'),expected);}finally{f.r.dispose();}
 }
 const f=fixture();try{f.shot();f.r.state.arenaMode='SHATTERED';f.r.state.kineticStage=2;assert.equal(f.hit('banked'),3,'not (1+1)×2');}finally{f.r.dispose();}
});
test('twelve gear aiming lessons use real sample horizons, radar ranges and frozen rule-derived data',()=>{
 assert.equal(AIM_STUDY_IDS.length,13);
 for(const id of AIM_STUDY_IDS.filter(id=>id!=='sniper')){const item=ITEMS.find(i=>i.id===id),eq=normalizeEquipment({[item.slot]:id}),q=aimStudy(item,3400,false,eq);assert.ok(Object.isFrozen(q));assert.equal(q.illustration,true);assert.equal(q.id,id);assert.equal(shopStudy(item,3400,false,eq).aim.id,id);
  if(item.slot==='trajectory'){assert.equal(q.visible.length,Math.min(q.path.length,trajectorySamples(id)));const forecast=aimVisuals.arcPath({x:0,y:0},{x:22,y:-14},{geometry:[{x:1900,y:-2000,w:40,h:5000}]});assert.deepEqual(q.path.slice(1),forecast.points.map(({x,y})=>({x,y})));if(q.impact)assert.deepEqual(q.impact,forecast.end);}
  if(item.slot==='radar')assert.equal(q.range,radarRange(id));
 }
 assert.equal(aimStudy(ITEMS.find(i=>i.id==='halo')),null);
 assert.equal(aimStudy(ITEMS.find(i=>i.id==='pointer-orbit'),3400,false,{eyes:'glitch',world:'synth',dash:'dash-water'}).recoveryPoints,10,'cosmetics do not consume recovery cap');
 assert.equal(aimStudy(ITEMS.find(i=>i.id==='pointer-diamond'),3400,false,{tail:'ghost',slash:'laser',dash:'dash-fire'}).blade,1);
});
test('all twelve gear aiming scenes are distinct, progress, preserve inputs/context and freeze under reduced motion',()=>{
 const outputs=new Set();for(const id of AIM_STUDY_IDS.filter(id=>id!=='sniper')){const item=ITEMS.find(i=>i.id===id),eq=normalizeEquipment({[item.slot]:id}),draw=(t,motion)=>{const cv=createCanvas(640,400),c=playerCanvas(cv.getContext('2d')),q=shopStudy(item,t,motion,eq),before=JSON.stringify(q),words=[];c.translate(2,3);c.globalAlpha=.8;const matrix=c.getTransform();const proxy=new Proxy(c,{get:(o,k)=>k==='fillText'?(s,...args)=>{words.push(s);o.fillText(s,...args);}:typeof o[k]==='function'?o[k].bind(o):o[k],set:(o,k,v)=>(o[k]=v,true)});drawShopItemStudy(proxy,640,400,{study:q,equipment:eq});assert.deepEqual(c.getTransform(),matrix);near(c.globalAlpha,.8);assert.equal(JSON.stringify(q),before);assert.doesNotMatch(words.join(' '),/\bticks?\b|\bsimulation\b|\bprimary\b/i);return cv.toBuffer('image/png');};assert.deepEqual(draw(0,false),draw(9900,false),id);assert.notDeepEqual(draw(0,true),draw(3400,true),id);outputs.add(draw(3400,false).toString('base64'));}assert.equal(outputs.size,12);
});
test('real convex shape query misses an off-axis sliver only after Sniper narrowing; no radial fallback',async()=>{
 const {createPhysics,destroyPhysics}=await import('../src/physics.js'),{createCombat}=await import('../src/slasher.js');const w=createPhysics({spawn:{x:0,y:0}}),c=createCombat(w);
 try{
  const e=c.add({id:'edge',kind:'fang',x:70,y:12,size:.05,pinned:true}),rules=equipmentRules({}),sword=SWORD_STYLES.standard;
  for(const [power,hit] of [[.899,true],[.9,false],[1,false]]){const q=primaryGeometry({rules,sword,shot:precisionShot('sniper',power)});c.contacts.clear();const swept=c.sweepBlade(0,q.reach,q.width,q.closeWidth);assert.deepEqual(swept,q.geometry);assert.equal(c.contacts.has(e),hit);}
  const behind=c.add({id:'behind',kind:'fang',x:-60,y:0,pinned:true});c.contacts.clear();c.sweepBlade(0,1,.9);assert.equal(c.contacts.has(behind),false);
 }finally{c.dispose();destroyPhysics(w);}
});
test.skip('[retired cosmetic power] real delayed core/upgrade echoes cannot spend Sniper; an eligible new primary still can',()=>{
 for(const upgradeEcho of [false,true]){
  const f=fixture();try{f.shot();const e=f.r.combat.add({id:'echo-plate',kind:'bastion',x:-500,y:-500,pinned:true});e.hp=10;
   f.r.state.equipmentFx.echoes.push({x:-500,y:-500,ticks:30,hits:new Set(),sourceId:'not-target',upgradeEcho});f.r.state.stop=1;f.r.tick();assert.equal(e.hp,9);assert.equal(f.r.state.precisionShot.spent,false);assert.equal(f.hit('direct-plate'),2);
  }finally{f.r.dispose();}
 }
});
test.skip('[retired cosmetic power] refused launches do not rearm a consumed precision shot; later speed cannot grant/erase eligibility',()=>{
 const f=fixture();try{f.shot();f.hit('first');const shot=f.r.state.precisionShot;f.r.state.inputLock=true;assert.equal(f.r.dash({x:42,y:0,power:1}),false);assert.equal(f.r.state.precisionShot,shot);f.r.state.inputLock=false;f.shot(.899);f.r.world.player.velocity.x=100;assert.equal(f.hit('weak'),1);f.shot(1);f.r.world.player.velocity.x=0;assert.equal(f.hit('slowed'),2);}finally{f.r.dispose();}
});
test('only an explicit active precision width scale narrows the rendered blade; default live art stays unchanged',async()=>{
 const {drawSwordWeapon}=await import('../src/art/splatr-art-engine.js'),sword=SWORD_STYLES.standard;
 const draw=(active,widthScale)=>{const cv=createCanvas(320,200),c=cv.getContext('2d');drawSwordWeapon(c,{x:80,y:100,radius:32,sword,active,motion:false,widthScale});return cv.toBuffer('image/png');};
 assert.deepEqual(draw(true,undefined),draw(true,1));assert.notDeepEqual(draw(true,1),draw(true,SNIPER.width));assert.deepEqual(draw(false,1),draw(false,SNIPER.width));
});
