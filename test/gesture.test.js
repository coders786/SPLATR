import test from 'node:test';import assert from 'node:assert/strict';import {readGesture,gestureSlop} from '../src/gesture.js';
test('the minimum drag is 8px screen space for mouse and touch',()=>{assert.equal(gestureSlop('mouse'),8);assert.equal(gestureSlop('touch'),8);});
test('mouse and touch share the 8px dead zone; pulls latch and returning cancels',()=>{
 for(const [type,slop]of [['mouse',8],['touch',8]]){
 const base={x:100,y:100,toX:100+slop-1,toY:100,type};assert.equal(readGesture(base).kind,'tap');const pull=readGesture({...base,toX:100+slop});assert.equal(pull.kind,'pull');assert.equal(pull.dx,-slop);assert.equal(readGesture({...base,dragged:true}).kind,'pull');assert.equal(readGesture({...base,dragged:true,toX:102}).kind,'cancel');assert.equal(readGesture({...base,dragged:true,toX:200}).kind,'pull');}
});
test('invalid coordinates cancel instead of becoming taps',()=>assert.equal(readGesture({x:0,y:0,toX:NaN,toY:1}).kind,'cancel'));

test('a latched pull survives threshold jitter but cancels inside its inner ring',()=>{
 for(const type of ['mouse','touch'])for(let angle=0;angle<Math.PI*2;angle+=.2){
 const slop=8,point=(distance,dragged)=>({x:0,y:0,toX:Math.cos(angle)*distance,toY:Math.sin(angle)*distance,type,dragged});
 assert.equal(readGesture(point(slop-.1,false)).kind,'tap');assert.equal(readGesture(point(slop-.1,true)).kind,'pull');assert.equal(readGesture(point(slop*.51,true)).kind,'pull');assert.equal(readGesture(point(slop*.49,true)).kind,'cancel');
 }
});
