import test from 'node:test';
import assert from 'node:assert/strict';
import {labPoint,labPullTarget} from '../src/lab-input.js';
test('lab pointer mapping preserves canvas coordinates at native and scaled sizes',()=>{for(const scale of [.2,.5,1,2]){const r={left:17,top:29,width:640*scale,height:400*scale};assert.deepEqual(labPoint(r,17+466*scale,29+180*scale),{x:466,y:180,inside:true});}});
test('letterbox bars are not actionable; the drawn center still maps to center',()=>{for(const r of [{left:0,top:0,width:800,height:400},{left:0,top:0,width:640,height:600}]){const p=labPoint(r,r.width/2,r.height/2);assert.equal(p.x,320);assert.equal(p.y,200);assert.equal(p.inside,true);assert.equal(labPoint(r,1,1).inside,false);}});
test('zero-size canvas and non-finite events cannot start a drag',()=>{assert.equal(labPoint({width:0,height:0,left:0,top:0},0,0).inside,false);assert.equal(labPoint({width:640,height:400,left:0,top:0},NaN,100).inside,false);});

test('preview pull fits the stage without bending the outgoing launch',()=>{const state={x:190,y:190};for(const [dx,dy]of [[-800,-400],[800,400],[-800,400],[800,-400]]){const t=labPullTarget(state,{dx,dy},2),x=t.x-state.x,y=t.y-state.y;assert.ok(t.x>=20&&t.x<=620&&t.y>=30&&t.y<=300);assert.ok(Math.abs(x*dy-y*dx)<1e-7);assert.ok(x*dx+y*dy>0);}});
