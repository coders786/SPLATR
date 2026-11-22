import test from 'node:test';import assert from 'node:assert/strict';import {createCanvas} from '@napi-rs/canvas';
import {drawWakeSeparation,drawDimensionField} from '../src/art/splatr-art-engine.js';import {createDimensionField,stepDimensionField} from '../src/dimension-field.js';
const render=(extra={})=>{const canvas=createCanvas(280,200);drawWakeSeparation(canvas.getContext('2d'),{x:180,y:100,speed:42,age:3,...extra});return canvas;};
test('wake separation is speed/direction-sensitive, behind the actor and spatially bounded',()=>{
 assert.notDeepEqual(render().toBuffer('image/png'),render({speed:56}).toBuffer('image/png'));assert.notDeepEqual(render().toBuffer('image/png'),render({angle:Math.PI/2}).toBuffer('image/png'));
 const data=render().getContext('2d').getImageData(0,0,280,200).data;let count=0;for(let y=0;y<200;y++)for(let x=0;x<280;x++)if(data[(y*280+x)*4+3]){count++;assert.ok(x<150&&x>75);assert.ok(y>55&&y<145);assert.ok(Math.abs(y-100)>20);}assert.ok(count>100);
});
test('wake separation suppresses low speed, reduced motion, disabled option and expired/invalid samples',()=>{
 const blank=render({enabled:false}).toBuffer('image/png');for(const extra of [{speed:27},{motion:false},{age:-1},{age:18},{speed:NaN},{x:NaN}])assert.deepEqual(render(extra).toBuffer('image/png'),blank);
 const ctx=createCanvas(280,200).getContext('2d');ctx.globalAlpha=.4;ctx.lineWidth=5;ctx.translate(2,8);const matrix=ctx.getTransform();drawWakeSeparation(ctx,Object.freeze({x:180,y:100,speed:42,age:4}));assert.equal(ctx.globalAlpha,.4);assert.equal(ctx.lineWidth,5);assert.deepEqual(ctx.getTransform(),matrix);
});
test('world wake samples use measured displacement, not blocked velocity; no pause/freeze emission',()=>{
 let field=createDimensionField();for(let i=0;i<20;i++)field=stepDimensionField(field,{vx:42,vy:0,distance:1});assert.equal(field.wakes.length,0);
 for(let i=0;i<7;i++)field=stepDimensionField(field,{vx:42,vy:0,distance:42});assert.ok(field.wakes.some(w=>w.speed===42));assert.equal(stepDimensionField(field,{active:false}),field);const still=stepDimensionField(field,{vx:42,vy:0,distance:0});assert.equal(still.wakes.length,field.wakes.length);
});
test('field separates at most three newest samples, leaving input unchanged',()=>{
 const base=createDimensionField(),wake=i=>({id:i,x:140+i*5,y:90,angle:0,speed:42,age:2,life:28,intensity:.5});const recent=[wake(5),wake(6),wake(7)];const field={...base,wakes:[wake(0),...recent]};const before=JSON.stringify(field),draw=f=>{const c=createCanvas(280,200);drawDimensionField(c.getContext('2d'),f,{x:0,y:0,w:280,h:200,scale:1});return c.toBuffer('image/png');};assert.deepEqual(draw(field),draw({...field,wakes:recent}));assert.equal(JSON.stringify(field),before);
});
test('field separation option removes fast background geometry without changing snapshots',()=>{
 const field={...createDimensionField(),wakes:[{x:180,y:100,speed:42,age:3,life:28,angle:0,intensity:.5}]},before=JSON.stringify(field);
 const canvas=createCanvas(280,200);drawDimensionField(canvas.getContext('2d'),field,null,true,{separation:false});assert.equal(canvas.getContext('2d').getImageData(0,0,280,200).data.some((v,i)=>i%4===3&&v>0),false);assert.equal(JSON.stringify(field),before);
});
