import test from 'node:test';
import assert from 'node:assert/strict';
import {ITEMS,equipmentRules,normalizeEquipment,loadEquipment} from '../src/equipment.js';
import {MUTATIONS,SPARKS,HYBRIDS,activeHybrid} from '../src/hybrids.js';
import {powerReadout,buildReadout} from '../src/power-readout.js';
import {drawCubeHero,resolveVisualHarmony} from '../src/art/splatr-art-engine.js';
import {createCanvas} from '@napi-rs/canvas';

test('all 53 powers have short frozen receipts and cosmetic parts never claim combat stats',()=>{
 for(const item of ITEMS){const p=powerReadout(item);assert.ok(Object.isFrozen(p));assert.ok(Object.isFrozen(p.chips));assert.ok(p.title.split(' ').length<=3);assert.ok(p.chips.length<=2);assert.ok(p.short.length<=20);if(p.cosmetic){assert.equal(p.title,'STYLE ONLY');assert.deepEqual(p.chips,['NO COMBAT CHANGE']);}}
 for(const id of ['visor','hologram','chamfer','laser','pixel','manga'])assert.ok(powerReadout(id).cosmetic,id);
 assert.throws(()=>powerReadout('not-an-item'),RangeError);
});
test('quick stats exactly match authoritative equipment rules and show costs as well as benefits',()=>{
 for(const eq of [{},{head:'viper'},{core:'glass'},{core:'riot'},{head:'crown'}]){const rules=equipmentRules(eq),p=buildReadout(eq);assert.equal(p.speed,Math.round(rules.dashSpeed*100));assert.equal(p.width,Math.round(rules.cutWidth*100));assert.equal(p.edge,rules.edgeMax);assert.equal(p.hull,rules.healthMax);assert.equal(p.score,rules.scoreMultiplier);}
 assert.deepEqual(powerReadout('viper').chips,['SPEED +20%','CUT WIDTH −15%']);assert.ok(powerReadout('glass').chips.includes('MAX HULL 1'));
});
test('35 valid distinct mutation recipes retain every original ID and load discoveries without granting ownership',()=>{
 assert.equal(MUTATIONS.length,35);assert.equal(SPARKS.length,18);assert.equal(HYBRIDS.length,17);assert.equal(new Set(MUTATIONS.map(x=>x.id)).size,35);
 for(const h of MUTATIONS){assert.ok(Object.isFrozen(h.parts));for(const [slot,id]of Object.entries(h.parts))assert.ok(ITEMS.some(x=>x.slot===slot&&x.id===id));}
 for(const id of ['wyrm','ronin','king','phantom','reaper','eater','sun','glacier','briar','sentinel','arcade'])assert.ok(HYBRIDS.some(h=>h.id===id));
 const loaded=loadEquipment(JSON.stringify({discovered:MUTATIONS.map(x=>x.id)}));assert.equal(loaded.discovered.length,35);assert.ok(!loaded.owned.includes('coil'));
});
test('new Apex frames preserve CORE color authority across all worlds, sizes, and Canvas state',()=>{
 for(const recipe of HYBRIDS.slice(-6)){
  assert.equal(activeHybrid(recipe.parts).id,recipe.id);
  for(const world of ITEMS.filter(x=>x.slot==='world'))for(const radius of [23,40,60]){
   const eq=normalizeEquipment({...recipe.parts,world:world.id}),c=createCanvas(280,240).getContext('2d'),before=c.getTransform(),palette=resolveVisualHarmony(eq,28);
   assert.equal(palette.primary,resolveVisualHarmony({...eq,world:'twilight'},28).primary);
   drawCubeHero(c,{x:150,y:145,radius,time:28,equipment:Object.freeze(eq),pose:Object.freeze({blink:1,aiming:true})});assert.deepEqual(c.getTransform(),before);assert.equal(c.globalAlpha,1);
  }
 }
});

test('practice primary base receipts include literal part/style costs but never conditional coverage as baseline',async()=>{
 const {primaryReadout}=await import('../src/power-readout.js'),{swordProfile}=await import('../src/swords.js');
 const v=primaryReadout({head:'viper'},swordProfile({head:'viper'}));assert.equal(v.speed,120);assert.equal(v.width,85);assert.equal(v.hull,3);
 const c=primaryReadout({head:'crown',tail:'ghost'},swordProfile({head:'crown',tail:'ghost'}));assert.equal(c.speed,92);assert.equal(c.armor,2);assert.equal(c.window,6);
 const conditional=primaryReadout({head:'samurai',core:'magnet'},swordProfile({head:'samurai',core:'magnet'}));assert.equal(conditional.width,100);assert.equal(conditional.conditional.length,2);assert.ok(Object.isFrozen(conditional.conditional));
 const glass=primaryReadout({core:'glass'},swordProfile({core:'glass'}));assert.equal(glass.hull,1);assert.equal(glass.score,2);
});
