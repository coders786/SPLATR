import test from 'node:test';import assert from 'node:assert/strict';import {createCanvas} from '@napi-rs/canvas';import {resolveFangAnticipation,drawFangIntent} from '../src/art/splatr-art-engine.js';
test('Fang loads, releases and returns from real clocks; other actors/reduced mode unchanged',()=>{
 const e=Object.freeze({kind:'fang',mode:'tell',clock:1,span:66});const pose=resolveFangAnticipation(e);assert.ok(pose.x<.91&&pose.y>1.06&&pose.offset<0);const rush=resolveFangAnticipation({...e,mode:'rush',clock:24});assert.ok(rush.x>1.12&&rush.offset>0);assert.ok(resolveFangAnticipation({...e,mode:'rush',clock:1}).x<1.001);
 for(const extra of [{kind:'prism'},{mode:'idle'}])assert.deepEqual(resolveFangAnticipation({...e,...extra}),{x:1,y:1,offset:0});assert.deepEqual(resolveFangAnticipation(e,false),{x:1,y:1,offset:0});
});
test('intent is directional, clock-sensitive, deterministic and restores context',()=>{
 const draw=extra=>{const canvas=createCanvas(420,220);drawFangIntent(canvas.getContext('2d'),{x:60,y:110,...extra});return canvas.toBuffer('image/png');};assert.notDeepEqual(draw({clock:66}),draw({clock:1}));assert.notDeepEqual(draw({aim:0}),draw({aim:1}));assert.deepEqual(draw({clock:22}),draw({clock:22}));
 const c=createCanvas(420,220).getContext('2d');c.globalAlpha=.6;c.lineWidth=5;c.translate(2,3);const transform=c.getTransform();drawFangIntent(c,Object.freeze({x:50,y:110,r:22,clock:10}));assert.equal(c.globalAlpha,.6);assert.equal(c.lineWidth,5);assert.deepEqual(c.getTransform(),transform);
});
