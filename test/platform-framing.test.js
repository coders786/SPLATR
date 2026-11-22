import test from 'node:test';import assert from 'node:assert/strict';import {createCamera,frameRun} from '../src/camera.js';
test('return framing fits full deck and cube at fixed scale, with no combat-camera change',()=>{
 for(const [w,h]of [[390,680],[550,720],[860,440],[1280,720]])for(const direction of [-1,1]){
 const camera=createCamera();camera.resize(w,h);const p={x:direction*230,y:-80},deck={x:-150,y:0,w:300,h:24};camera.reset(p);const scale=camera.view().scale;
 for(let i=0;i<120;i++)frameRun(camera,{state:{phase:'playing',wave:{phase:'return',platform:deck}},world:{player:{position:p,velocity:{x:0,y:0}}}},false);
 const view=camera.view();assert.equal(view.scale,scale);for(const x of [deck.x,deck.x+deck.w,p.x])assert.ok((x-view.x)*scale>=0&&(x-view.x)*scale<=w,JSON.stringify({w,h,direction,view}));assert.ok((deck.y+60-view.y)*scale<h);
 }
});
test('landing correction respects existing per-tick camera caps',()=>{
 const camera=createCamera();camera.resize(390,680);camera.reset({x:400,y:0});const run={state:{phase:'playing',wave:{phase:'return',platform:{x:-150,y:0,w:300,h:24}}},world:{player:{position:{x:400,y:0},velocity:{x:0,y:0}}}};
 for(let i=0;i<40;i++){const before=camera.view();frameRun(camera,run,true);const after=camera.view();assert.ok(Math.abs(after.x-before.x)<=20);assert.ok(Math.abs(after.y-before.y)<=30);assert.equal(after.scale,before.scale);}
});
test('combat frameRun remains identical to the ordinary camera path',()=>{
 const a=createCamera(),b=createCamera(),p={x:280,y:-180},v={x:14,y:-5};for(const camera of [a,b]){camera.resize(390,680);camera.reset(p);}
 for(let i=0;i<30;i++){frameRun(a,{state:{phase:'playing',wave:{phase:'combat'}},world:{player:{position:p,velocity:v}}},true);b.tick(p,v,false,true,null,0);assert.deepEqual(a.view(),b.view());}
});
