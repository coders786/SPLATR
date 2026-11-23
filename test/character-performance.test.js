import test from 'node:test';
import assert from 'node:assert/strict';
import {createCanvas} from '@napi-rs/canvas';
import {resolveCharacterPerformance,resolveSlashSweep,drawSlashEffect,drawCubeHero} from '../src/art/splatr-art-engine.js';
test('one frozen presentation state separates aim, release and recovery without inventing contact',()=>{
 const idle=resolveCharacterPerformance(Object.freeze({}),20),aim=resolveCharacterPerformance({aiming:true},20),release=resolveCharacterPerformance({attackProgress:.18},20),recover=resolveCharacterPerformance({attackProgress:.8},20);
 assert.equal(idle.phase,'idle');assert.equal(aim.phase,'aim');assert.equal(release.phase,'release');assert.equal(recover.phase,'recover');
 assert.ok(aim.focus>idle.focus);assert.ok(release.release>recover.release);assert.ok(recover.recovery>release.recovery);assert.ok(release.tailLag>0);assert.ok(recover.tailLag<0);
 assert.equal(release.contact,0);assert.equal(resolveCharacterPerformance({contact:true}).contact,1);
 for(const d of [idle,aim,release,recover]){assert.ok(Object.isFrozen(d));assert.ok(Object.values(d).filter(v=>typeof v==='number').every(Number.isFinite));}
 assert.deepEqual(release,resolveCharacterPerformance({attackProgress:.18},20));
});
test('all eight slash styles advance their leading edge then trim their tail independent of opacity',()=>{
 for(const id of ['razor','katana','blood','laser','pixel','confetti','comic','glitch-fx']){
 const frames=[0,.08,.18,.35,.55,.75,.9,1].map(p=>resolveSlashSweep(p,id));
 for(let i=1;i<frames.length;i++){assert.ok(frames[i].head>=frames[i-1].head,id);assert.ok(frames[i].tail>=frames[i-1].tail,id);assert.ok(frames[i].head>=frames[i].tail);}
 assert.ok(frames[1].head<frames[3].head,id);assert.ok(frames.at(-2).head-frames.at(-2).tail<frames[3].head-frames[3].tail,id);assert.equal(frames.at(-1).head,frames.at(-1).tail);
 assert.deepEqual(resolveSlashSweep(.1,id,true),resolveSlashSweep(.9,id,true));
 }
});
function render(spec){const canvas=createCanvas(360,220),c=canvas.getContext('2d');c.translate(2,3);const matrix=c.getTransform();drawSlashEffect(c,{x:30,y:170,endX:315,endY:70,id:'laser',strength:.85,progress:.4,equipment:Object.freeze({core:'time'}),...spec});assert.deepEqual(c.getTransform(),matrix);assert.equal(c.globalAlpha,1);return canvas.toBuffer('image/png').toString('base64');}
test('slash has no invented endpoint impact; explicit real contact adds a local burst',()=>{
 assert.equal(render({}),render({contact:undefined}));assert.notEqual(render({}),render({contact:{x:220,y:95}}));assert.notEqual(render({progress:.05}),render({progress:.4}));
});
test('reduced motion suppresses release and lag, without erasing static intent',()=>{
 const d=resolveCharacterPerformance({aiming:true,attackProgress:.2,contact:true,reducedMotion:true});assert.ok(d.focus>0);assert.equal(d.release,0);assert.equal(d.tailLag,0);assert.equal(d.contact,0);
 const canvas=createCanvas(200,200),c=canvas.getContext('2d');const images=[];
 for(const time of [10,80]){c.clearRect(0,0,200,200);drawCubeHero(c,{x:100,y:100,radius:45,time,motion:false,equipment:{body:'segmented',core:'magnet',tail:'thrusters',eyes:'visor'},pose:{attackProgress:.3}});images.push(canvas.toBuffer('image/png').toString('base64'));}assert.equal(images[0],images[1]);
});

test('release and recovery channels enter and leave at rest without animation pops',()=>{
 const at=p=>resolveCharacterPerformance({attackProgress:p});
 assert.ok(Math.abs(at(0).release)<1e-12);
 assert.ok(at(.18).release>.7);
 assert.ok(Math.abs(at(.62-1e-7).release-at(.62+1e-7).release)<1e-5);
 assert.ok(Math.abs(at(.55-1e-7).recovery-at(.55+1e-7).recovery)<1e-5);
 assert.ok(Math.abs(at(1).release)<1e-12);assert.ok(Math.abs(at(1).recovery)<1e-12);
});
