import test from 'node:test';
import assert from 'node:assert/strict';
import {createCanvas} from '@napi-rs/canvas';
import {drawEnemyShape,drawEnemyZone,enemyAttackZone,resolveEnemyMechanism,legacy_shapes} from '../src/art/splatr-art-engine.js';
const kinds=['fang','pulse','prism','fork','bastion','rift','well','crown'];
const image=(kind,options={},radius=30,angle=0)=>{const c=createCanvas(160,160),ctx=c.getContext('2d'),before=ctx.getTransform();drawEnemyShape(ctx,{kind,x:80,y:80,radius,angle,options});assert.deepEqual(ctx.getTransform(),before);return {canvas:c,png:c.toBuffer('image/png')};};
test('mechanisms derive aim, charge, active and armor from authoritative state',()=>{
 const before=Object.freeze({mode:'tell',clock:20,span:80,aim:1.4,hp:2});
 const state=resolveEnemyMechanism('crown',before,.4);assert.ok(Math.abs(state.aim-1)<1e-12);assert.deepEqual({...state,aim:1},{charging:true,active:false,progress:.75,aim:1,plates:2,ports:10});
 assert.equal(resolveEnemyMechanism('prism',{mode:'idle',aim:2}).charging,false);
 assert.equal(resolveEnemyMechanism('fang',{mode:'rush'}).active,true);
 assert.equal(resolveEnemyMechanism('bastion',{hp:1}).plates,1);
 assert.equal(resolveEnemyMechanism('crown',{hp:-2}).plates,0);
 assert.equal(resolveEnemyMechanism('no-such-enemy'),null);
 assert.deepEqual(before,{mode:'tell',clock:20,span:80,aim:1.4,hp:2});
});
test('eight silhouettes and mechanisms stay distinct at gameplay and enlarged sizes',()=>{
 for(const radius of [14,30,48]){
  const signatures=kinds.map(k=>image(k,{hp:legacy_shapes.TYPES[k].hp},radius).png.toString('base64'));
  assert.equal(new Set(signatures).size,8);
  for(const kind of kinds){const {canvas}=image(kind,{},radius),data=canvas.getContext('2d').getImageData(0,0,160,160).data;let colored=0;for(let i=3;i<data.length;i+=4)if(data[i]>0)colored++;assert.ok(colored>radius*radius*.35,`${kind} ${radius}`);}
 }
});
test('all real windups have state-driven visual changes and armor reflects real hp',()=>{
 for(const kind of kinds){
  const idle=image(kind,{mode:'idle',hp:legacy_shapes.TYPES[kind].hp}).png;
  const tell=image(kind,{mode:'tell',clock:10,span:80,aim:0,hp:legacy_shapes.TYPES[kind].hp}).png;
  assert.notDeepEqual(tell,idle,`${kind} charging art`);
 }
 for(const kind of ['bastion','crown']){
  const max=legacy_shapes.TYPES[kind].hp,art=[];for(let hp=1;hp<=max;hp++)art.push(image(kind,{hp}).png.toString('base64'));
  assert.equal(new Set(art).size,max,`${kind} plate count`);
 }
 assert.notDeepEqual(image('prism',{mode:'tell',clock:40,span:80,aim:0}).png,image('prism',{mode:'tell',clock:40,span:80,aim:Math.PI/2}).png);
 assert.deepEqual(image('prism',{mode:'idle',aim:0}).png,image('prism',{mode:'idle',aim:Math.PI/2}).png,'idle does not suggest an unlocked firing direction');
});
test('Rift landing warning and active strike use the same real zone and restore canvas state',()=>{
 const z=enemyAttackZone('rift',80,80),c=createCanvas(160,160),ctx=c.getContext('2d'),before=ctx.getTransform();
 drawEnemyZone(ctx,z,false,1);const warning=c.toBuffer('image/png');assert.deepEqual(ctx.getTransform(),before);
 ctx.clearRect(0,0,160,160);drawEnemyZone(ctx,z,true,1);assert.notDeepEqual(c.toBuffer('image/png'),warning);assert.deepEqual(ctx.getTransform(),before);
});
