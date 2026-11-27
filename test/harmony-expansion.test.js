import test from 'node:test';
import assert from 'node:assert/strict';
import {createCanvas} from '@napi-rs/canvas';
import {SHAPE_MODIFIERS,resolveVisualHarmony,drawCubeHero,ITEMS} from '../src/art/splatr-art-engine.js';
import {equipmentRules,loadEquipment,buyEquipment} from '../src/equipment.js';

test('harmony is deterministic, CORE-owned and world-lit without changing equipment',()=>{
 const eq=Object.freeze({core:'time',body:'iron',world:'tokyo'}),a=resolveVisualHarmony(eq,24,{combo:4});
 assert.deepEqual(a,resolveVisualHarmony(eq,24,{combo:4}));assert.ok(Object.isFrozen(a));
 const foundry=resolveVisualHarmony({...eq,world:'foundry'},24,{combo:4});
 assert.equal(a.primary,foundry.primary);assert.equal(a.trim,foundry.trim);assert.notEqual(a.rim,foundry.rim);
 assert.notEqual(a.trim,resolveVisualHarmony({...eq,core:'grav'},24).trim);
 assert.ok(a.energy>resolveVisualHarmony(eq,24).energy);assert.ok(a.pulse>=.7&&a.pulse<=1);
});
test('three immutable functional shape profiles stay inside the original body bounds',()=>{
 assert.equal(SHAPE_MODIFIERS.length,3);
 for(const p of SHAPE_MODIFIERS){assert.ok(Object.isFrozen(p.outline));for(const point of p.outline){assert.ok(Object.isFrozen(point));assert.ok(point.every(n=>n>=-1&&n<=1));}
  const item=ITEMS.find(x=>x.id===p.id);assert.equal(item.slot,'body');assert.match(item.detail,({chamfer:/primary armor shove component by 20%/,notched:/FOCUS recovery is 12%/,segmented:/20% of actual forward momentum/})[p.id]);
  assert.notDeepEqual(equipmentRules({body:p.id}),equipmentRules({body:'paper'}));
  assert.equal(equipmentRules({body:p.id}).healthMax,3);
 }
});
test('shape modifier purchases and migration preserve ownership without free unlocks',()=>{
 for(const p of SHAPE_MODIFIERS){const state=loadEquipment('{}'),item=ITEMS.find(x=>x.id===p.id);assert.ok(!state.owned.includes(p.id));const result=buyEquipment(state,p.id,item.price);assert.equal(result.wallet,0);const loaded=loadEquipment(JSON.stringify({...result.state,equipped:{body:p.id}}));assert.equal(loaded.equipped.body,p.id);}
});
test('all cosmetic profiles render different pixels with balanced Canvas state',()=>{
 const c=createCanvas(180,180),ctx=c.getContext('2d'),images=[];
 for(const body of ['paper',...SHAPE_MODIFIERS.map(x=>x.id)]){ctx.clearRect(0,0,180,180);const before=ctx.getTransform();drawCubeHero(ctx,{x:105,y:100,radius:48,equipment:{body,core:'echo',tail:'ribbon'}});assert.deepEqual(ctx.getTransform(),before);assert.equal(ctx.globalAlpha,1);images.push(c.toBuffer('image/png').toString('base64'));}
 assert.equal(new Set(images).size,4);
});

test('new Sparks evolve into their Apex while retaining the two-part fusion',async()=>{
 const {HYBRIDS,SPARKS,activeHybrid,activeSparks,mutationTitle,drawHybridAura,drawSparkMutation}=await import('../src/hybrids.js');
 const pairs=[['cryolens','glacier'],['razorleaf','briar'],['relay','sentinel'],['afterimage','arcade']];
 const canvas=createCanvas(240,240),c=canvas.getContext('2d'),pixels=[];
 for(const [sparkId,apexId] of pairs){
  const spark=SPARKS.find(h=>h.id===sparkId),apex=HYBRIDS.find(h=>h.id===apexId);
  assert.ok(spark&&apex);assert.equal(activeHybrid(spark.parts),null);
  assert.ok(activeSparks(apex.parts).some(h=>h.id===sparkId));assert.equal(mutationTitle(apex.parts),apex.title);
  for(const slot of Object.keys(apex.parts)){const partial={...apex.parts};delete partial[slot];assert.notEqual(activeHybrid(partial)?.id,apexId);}
  c.resetTransform();c.clearRect(0,0,240,240);c.translate(120,120);c.scale(42,42);
  const before=c.getTransform(),eq=Object.freeze({...apex.parts});
  drawHybridAura(c,eq,39,{combo:6});drawSparkMutation(c,eq,39,'front',{combo:6});
  assert.deepEqual(c.getTransform(),before);assert.equal(c.globalAlpha,1);assert.deepEqual(c.getLineDash(),[]);
  assert.ok(c.getImageData(0,0,240,240).data.some((n,i)=>i%4===3&&n>0));pixels.push(canvas.toBuffer('image/png').toString('base64'));
 }
 assert.equal(new Set(pixels).size,4);
});
