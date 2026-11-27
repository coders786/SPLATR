import test from 'node:test';
import assert from 'node:assert/strict';
import {createCanvas} from '@napi-rs/canvas';
import {resolveBodyConstruction,drawCubeHero,ITEMS} from '../src/art/splatr-art-engine.js';
import {equipmentRules} from '../src/equipment.js';
const bodies=ITEMS.filter(i=>i.slot==='body').map(i=>i.id);
function pixels(body,emission=1,eyes='ninja'){
 const canvas=createCanvas(180,180),c=canvas.getContext('2d');c.translate(1,2);const initial=c.getTransform();
 drawCubeHero(c,{x:90,y:90,radius:61,time:26,equipment:Object.freeze({body,eyes,core:'echo'}),pose:Object.freeze({blink:1,emission})});
 assert.deepEqual(c.getTransform(),initial);assert.equal(c.globalAlpha,1);
 return {all:canvas.toBuffer('image/png').toString('base64'),face:Buffer.from(c.getImageData(47,57,100,48).data).toString('base64'),c};
}
test('every BODY has a deeply frozen construction descriptor and distinct cavity',()=>{
 assert.equal(bodies.length,10);const cavities=[];
 for(const body of bodies){const d=resolveBodyConstruction(body);assert.equal(d.id,body);assert.ok(Object.isFrozen(d));assert.ok(Object.isFrozen(d.cavity));for(const p of d.cavity){assert.ok(Object.isFrozen(p));assert.ok(p.every(v=>Math.abs(v)<.5));}cavities.push(JSON.stringify(d.cavity));}
 assert.equal(new Set(cavities).size,bodies.length);assert.equal(resolveBodyConstruction('missing'),resolveBodyConstruction('paper'));
});
test('BODY materials remain distinct with CORE emission disabled',()=>{
 const frames=bodies.map(body=>pixels(body,0).all);assert.equal(new Set(frames).size,10);
 for(const body of bodies)assert.notEqual(pixels(body,0).all,pixels(body,1).all,body);
});
test('construction changes face pixels and survives all eye combinations',()=>{
 const faces=bodies.map(body=>pixels(body,0).face);assert.equal(new Set(faces).size,10);
 for(const body of bodies)for(const eyes of ['ninja','smug','blaze','visor','hypno','glitch','sniper'])pixels(body,1,eyes);
});
test('shape profiles grant bounded perks without changing hull or armor',()=>{
 for(const body of ['chamfer','notched','segmented']){const r=equipmentRules({body});assert.equal(r.healthMax,3);assert.equal(r.armorDamage,1);assert.equal(r.dashSpeed,1);assert.notDeepEqual(r,equipmentRules({body:'paper'}));}
});
