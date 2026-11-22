import test from 'node:test';
import assert from 'node:assert/strict';
import {createCanvas} from '@napi-rs/canvas';
import {resolveArtDirection,drawCubeHero,drawShopCardArt,HYBRIDS,SPARKS,ITEMS} from '../src/art/splatr-art-engine.js';
function render(eq,radius=40){const canvas=createCanvas(260,260),c=canvas.getContext('2d'),before=c.getTransform();drawCubeHero(c,{x:160,y:145,radius,time:28,equipment:Object.freeze(eq),pose:Object.freeze({blink:1})});assert.deepEqual(c.getTransform(),before);assert.equal(c.globalAlpha,1);assert.deepEqual(c.getLineDash(),[]);return canvas.toBuffer('image/png').toString('base64');}
test('one immutable art direction preserves recipe identity at each surface scale',()=>{
 for(const recipe of HYBRIDS){const small=resolveArtDirection(recipe.parts,23),card=resolveArtDirection(recipe.parts,40),large=resolveArtDirection(recipe.parts,60);assert.equal(small.family,recipe.id);assert.equal(card.family,recipe.id);assert.equal(large.family,recipe.id);assert.deepEqual([small.detail,card.detail,large.detail],[0,1,2]);assert.ok(Object.isFrozen(small));assert.equal(small.energy,large.energy);}
 assert.equal(resolveArtDirection({}).family,null);
});
test('every Spark and Apex renders with balanced state at gameplay, card and study sizes',()=>{
 for(const recipe of [...SPARKS,...HYBRIDS])for(const size of [23,40,60]){const image=render({...recipe.parts},size);assert.ok(image.length>500,recipe.id);}
 const canv=createCanvas(230,130),c=canv.getContext('2d');for(const recipe of HYBRIDS)for(const slot of ['head','eyes','body','core','tail','slash','world']){const before=c.getTransform();drawShopCardArt(c,230,130,{equipment:recipe.parts,slot,time:28,motion:false});assert.deepEqual(c.getTransform(),before);assert.equal(c.globalAlpha,1);}
});
test('hybrid integration leaves the same build eye pixels unchanged',()=>{
 const remove={wyrm:'slash',ronin:'slash',king:'head',phantom:'tail',reaper:'tail',eater:'tail',sun:'slash',glacier:'slash',briar:'tail',sentinel:'head',arcade:'slash',storm:'slash',forge:'tail',wraith:'tail',bulwark:'tail',razoredge:'slash',orbit:'tail'};
 for(const h of HYBRIDS){const canvas=createCanvas(200,200),c=canvas.getContext('2d');const draw=eq=>{c.clearRect(0,0,200,200);drawCubeHero(c,{x:100,y:110,radius:50,time:28,equipment:eq,pose:{blink:1}});return Buffer.from(c.getImageData(66,89,68,23).data).toString('base64');};
  // Remove only an ingredient that cannot itself change the eye artwork.
  const partial={...h.parts};delete partial[remove[h.id]];
  assert.equal(draw(h.parts),draw(partial),h.id+' altered the eye region');
 }
});
test('expanded recipe membership and original item catalogue keep all worlds selectable',()=>{
 assert.equal(ITEMS.length,53);assert.equal(HYBRIDS.length,17);assert.equal(SPARKS.length,18);assert.equal(ITEMS.filter(x=>x.slot==='world').length,6);
});
