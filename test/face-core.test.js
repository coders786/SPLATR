import test from 'node:test';
import assert from 'node:assert/strict';
import {createCanvas} from '@napi-rs/canvas';
import {drawCubeHero} from '../src/art/splatr-art-engine.js';
function render(eyes,core,time,pose={},motion=true){
 const canvas=createCanvas(240,240),c=canvas.getContext('2d');c.translate(2,3);const before=c.getTransform();
 const equipment=Object.freeze({body:'paper',eyes,core});drawCubeHero(c,{x:120,y:120,radius:75,time,equipment,motion,pose:Object.freeze({blink:1,...pose})});
 assert.deepEqual(c.getTransform(),before);assert.equal(c.globalAlpha,1);
 // Only sample the eye surface, so CORE/tail animation cannot satisfy eye tests.
 return {face:Buffer.from(c.getImageData(65,78,115,48).data).toString('base64'),core:Buffer.from(c.getImageData(85,145,80,52).data).toString('base64')};
}
test('all seven eye styles animate inside their own face region, not just the CORE',()=>{
 for(const id of ['ninja','smug','blaze','visor','hypno','glitch','sniper'])assert.notEqual(render(id,'standard',11).face,render(id,'standard',43).face,id);
});
test('each eye style visibly responds to aim and attack at identical animation time',()=>{
 for(const id of ['ninja','smug','blaze','visor','hypno','glitch','sniper']){
 const idle=render(id,'standard',20).face;
 assert.notEqual(idle,render(id,'standard',20,{aiming:true,look:[.8,-.3]}).face,id+' aim');
 assert.notEqual(idle,render(id,'standard',20,{attack:1}).face,id+' attack');
 }
});
test('recessed CORE mechanisms animate and reduced motion freezes both channels',()=>{
 for(const core of ['grav','time','magnet','riot','echo','glass']){
 assert.notEqual(render('visor',core,11).core,render('visor',core,43).core,core);
 assert.deepEqual(render('hypno',core,11,{},false),render('hypno',core,43,{},false));
 }
});
