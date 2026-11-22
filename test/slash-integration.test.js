import test from 'node:test';
import assert from 'node:assert/strict';
import {createCanvas} from '@napi-rs/canvas';
import {drawSlashEffect,drawCubeHero} from '../src/art/splatr-art-engine.js';
const snapshot=(draw)=>{const canvas=createCanvas(360,220),c=canvas.getContext('2d');c.translate(4,3);const before=c.getTransform();draw(c);assert.deepEqual(c.getTransform(),before);assert.equal(c.globalAlpha,1);return canvas.toBuffer('image/png').toString('base64');};
test('all seven slash styles evolve geometrically at constant strength and preserve state',()=>{
 for(const id of ['razor','katana','blood','laser','pixel','confetti','glitch-fx']){
  const frames=[.08,.36,.72].map(progress=>snapshot(c=>drawSlashEffect(c,{x:40,y:170,endX:310,endY:65,id,progress,strength:.8,equipment:Object.freeze({core:'echo'})})));
  assert.equal(new Set(frames).size,3,id);
 }
});
test('reduced-motion slash remains stable across progress, CORE seam remains distinct',()=>{
 const render=(core,progress)=>snapshot(c=>drawSlashEffect(c,{x:40,y:170,endX:310,endY:65,id:'laser',strength:.8,progress,equipment:{core},reducedMotion:true}));
 assert.equal(render('time',.1),render('time',.8));assert.notEqual(render('time',.4),render('echo',.4));
});
test('integrated mounts render deterministically across body and attachment families',()=>{
 for(const body of ['paper','iron','chamfer','notched','segmented'])for(const tail of ['ribbon','wings','thrusters','anchor','spectrum']){
  const equipment=Object.freeze({body,tail,head:'coil',core:'magnet'}),render=()=>snapshot(c=>drawCubeHero(c,{x:210,y:120,radius:35,time:38,equipment}));assert.equal(render(),render());
 }
});
