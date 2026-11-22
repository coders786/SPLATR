import test from 'node:test';
import assert from 'node:assert/strict';
import {createCanvas} from '@napi-rs/canvas';
import {drawCombatAccent,drawSwordWeapon,drawElementalDash,drawCutExit} from '../src/art/splatr-art-engine.js';
// Structural upgrades now live on the equipped weapon rather than a generic
// overlay. Test their composed presentation, as the live renderer does.
const render=spec=>{const c=createCanvas(240,240),ctx=c.getContext('2d');drawCombatAccent(ctx,{x:120,y:120,...spec});if(['fleet','comet'].includes(spec.buff))drawElementalDash(ctx,{x:120,y:120,vx:24,age:2,buff:spec.buff});if(spec.buff==='guard')drawCutExit(ctx,{x:120,y:120,remaining:20,source:{id:'a',x:160,y:120},sourceId:'a'});if(['reach','cleaver','fleet','comet','linger'].includes(spec.buff))drawSwordWeapon(ctx,{x:120,y:120,radius:18,active:true,motion:false,buff:{id:spec.buff},reach:spec.buff==='reach'?1.2:spec.buff==='comet'?.85:1});return c.toBuffer('image/png');};
test('dash/slash accents evolve over simulation ages, settle completely and preserve input snapshots',()=>{
 const spec=Object.freeze({age:2,blade:12,angle:.4,motion:true});assert.deepEqual(render(spec),render(spec));assert.notDeepEqual(render(spec),render({...spec,age:9}));assert.deepEqual(render({age:30}),render({age:-1}));assert.notDeepEqual(render({age:2}),render({age:2,angle:Math.PI}));
});
test('eleven modifier silhouettes are distinct; spent ward disappears and reduced-motion trail is absent',()=>{
 const ids=['comet','cleaver','duelist','bastion','fleet','reach','breaker','linger','bounty','guard','barrier'];const signatures=ids.map(buff=>render({buff,shield:1}).toString('base64'));assert.equal(new Set(signatures).size,11);assert.deepEqual(render({buff:'barrier',shield:0}),render({}));assert.deepEqual(render({age:2,motion:false}),render({age:9,motion:false}));assert.deepEqual(render({age:2,blade:12,motion:false}),render({age:9,blade:12,motion:false}));
});
test('accent restores canvas transforms, alpha, line width and colors',()=>{const c=createCanvas(200,200),ctx=c.getContext('2d');ctx.globalAlpha=.7;ctx.lineWidth=5;ctx.fillStyle='#123456';const before=ctx.getTransform();drawCombatAccent(ctx,{x:70,y:80,angle:2,age:3,blade:12,buff:'fleet'});assert.deepEqual(ctx.getTransform(),before);assert.ok(Math.abs(ctx.globalAlpha-.7)<.01);assert.equal(ctx.lineWidth,5);assert.equal(ctx.fillStyle,'#123456');});
