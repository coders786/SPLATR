import test from 'node:test';
import assert from 'node:assert/strict';
import {createCanvas} from '@napi-rs/canvas';
import {resolveCoreFx,drawCoreDashFx,drawElementalDash,drawSlashEffect,drawCubeHero,drawShopElementDash,drawShopElementSlash,drawSwordWeapon} from '../src/art/splatr-art-engine.js';
const cores=['standard','grav','riot','time','glass','magnet','echo'];
const dashes=['dash-ink','dash-fire','dash-lightning','dash-ice','dash-water','dash-void','dash-echo'];
const slashes=['razor','blood','laser','katana','confetti','comic','pixel','glitch-fx'];
const imageCanvas=createCanvas(400,240);
const image=fn=>{const c=imageCanvas.getContext('2d');c.reset();fn(c);return imageCanvas.toBuffer('image/png');};
const alpha=fn=>{const cv=createCanvas(400,240);fn(cv.getContext('2d'));const p=cv.getContext('2d').getImageData(0,0,400,240).data;return Buffer.from(p.filter((_,i)=>i%4===3)).toString('base64');};
const dash=(c,eq,extra={})=>drawElementalDash(c,{x:240,y:120,vx:32,vy:0,age:3,travel:60,radius:24,equipment:eq,...extra});
const slash=(c,eq,extra={})=>drawSlashEffect(c,{x:80,y:170,endX:320,endY:90,id:eq.slash,equipment:eq,progress:.37,...extra});

test('seven immutable cosmetic grammars retain core ownership and safe fallback',()=>{
 const keys=new Set();for(const core of cores){const eq=Object.freeze({core});const fx=resolveCoreFx(eq);assert.ok(Object.isFrozen(fx));assert.equal(fx.id,core);assert.ok(fx.spread>=.7&&fx.spread<=1.2);keys.add(fx.index);assert.deepEqual(fx,resolveCoreFx(eq));}assert.equal(keys.size,7);assert.deepEqual(resolveCoreFx({core:'unknown'}),resolveCoreFx());assert.deepEqual(resolveCoreFx(null),resolveCoreFx());
});
test('all 49 dash/core combinations are deterministic, including five specialized powers',()=>{
 for(const id of dashes){const outputs=new Set();for(const core of cores){const eq=Object.freeze({core,dash:id});const a=image(c=>dash(c,eq));assert.deepEqual(a,image(c=>dash(c,eq)));outputs.add(a.toString('base64'));}assert.equal(outputs.size,7,id);}
});
test('core changes particle geometry, not just hue; all seven shapes differ in monochrome',()=>{
 const shapes=new Set(cores.map(core=>alpha(c=>drawCoreDashFx(c,{x:240,y:120,vx:32,age:3,equipment:{core}}))));assert.equal(shapes.size,7);
});
test('all 56 slash/core combinations retain variation and stable reduced-motion illustrations',()=>{
 for(const id of slashes){const outputs=new Set();for(const core of cores){const eq=Object.freeze({core,slash:id});const a=image(c=>slash(c,eq));assert.deepEqual(a,image(c=>slash(c,eq)));outputs.add(a.toString('base64'));
 assert.deepEqual(image(c=>slash(c,eq,{progress:.1,reducedMotion:true})),image(c=>slash(c,eq,{progress:.9,time:999,reducedMotion:true})));}assert.equal(outputs.size,7,id);}
});
test('wake pieces expire, remain behind the shell, reject invalid input and honor motion off',()=>{
 const blank=image(()=>{});for(const spec of [{motion:false},{age:-1},{age:10},{age:100},{age:NaN},{vx:0},{vx:Infinity},{radius:0},{x:NaN}])assert.deepEqual(image(c=>drawCoreDashFx(c,{x:240,y:120,vx:32,age:3,...spec})),blank);
 const cv=createCanvas(400,240),c=cv.getContext('2d');drawCoreDashFx(c,{x:240,y:120,vx:32,age:3});const pixels=c.getImageData(0,0,400,240).data;let n=0;for(let y=0;y<240;y++)for(let x=0;x<400;x++)if(pixels[(y*400+x)*4+3]){n++;assert.ok(x<240,'no leading projectile');assert.ok(x>=100&&y>70&&y<170,'bounded rear wake');}assert.ok(n>0);
 for(const id of dashes)assert.deepEqual(image(c=>dash(c,{dash:id},{motion:false})),blank);
});
test('new cosmetics preserve transform, alpha, line style and immutable equipment',()=>{
 const eq=Object.freeze({core:'magnet',dash:'dash-lightning',slash:'katana'}),c=createCanvas(400,240).getContext('2d');c.translate(3,5);c.rotate(.3);c.globalAlpha=.41;c.lineWidth=7;c.strokeStyle='#123456';const t=c.getTransform();
 for(const draw of [()=>dash(c,eq),()=>slash(c,eq),()=>drawCoreDashFx(c,{x:200,y:120,vx:30,age:3,equipment:eq})]){draw();assert.deepEqual(c.getTransform(),t);assert.equal(c.globalAlpha,.41);assert.equal(c.lineWidth,7);assert.equal(c.strokeStyle,'#123456');}
});
test('a real contact has a different receipt; swing endpoint alone never fabricates it',()=>{
 const eq={core:'echo',slash:'katana'},spec={contact:{x:320,y:90}};assert.notDeepEqual(image(c=>slash(c,eq)),image(c=>slash(c,eq,spec)));assert.deepEqual(image(c=>slash(c,eq)),image(c=>slash(c,eq,{contact:{x:NaN,y:90}})));
});
test('chamber accents respond to release but freeze with reduced motion and keep idle unchanged',()=>{
 const hero=(c,pose)=>drawCubeHero(c,{x:200,y:120,radius:60,equipment:{core:'time'},time:0,motion:!pose.reducedMotion,pose:{blink:1,...pose}});
 assert.notDeepEqual(image(c=>hero(c,{attackProgress:.3})),image(c=>hero(c,{attackProgress:-1})));
 assert.deepEqual(image(c=>hero(c,{attackProgress:.1,reducedMotion:true})),image(c=>hero(c,{attackProgress:.7,reducedMotion:true})));
});
test('shop samples share live core variation, and reduced dash studies are time independent',()=>{
 for(const draw of [drawShopElementDash,drawShopElementSlash]){
 const render=(core,time,motion)=>image(c=>draw(c,400,240,{equipment:{core,dash:'dash-fire',slash:'katana'},time,motion}));
 assert.notDeepEqual(render('grav',410,true),render('time',410,true));assert.deepEqual(render('grav',100,false),render('grav',900,false));
 }
});

test('the actual active sword receives core-owned shed and respects the motion gate',()=>{
 const render=(core,active,motion=true)=>image(c=>drawSwordWeapon(c,{x:140,y:120,radius:30,angle:0,active,motion,age:3,equipment:{core},sword:{family:'standard',color:'#bada55',reach:1,width:1}}));
 const outputs=new Set(cores.map(core=>render(core,true).toString('base64')));assert.equal(outputs.size,7);
 // Shell/socket already contains core-owned colors at rest: only compare the
 // new release layer through the motion gate, not unrelated construction.
 for(const core of cores)assert.notDeepEqual(render(core,true,true),render(core,true,false));
});
