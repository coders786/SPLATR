import test from 'node:test';import assert from 'node:assert/strict';import {createCanvas} from '@napi-rs/canvas';
import {drawFrameBite} from '../src/art/splatr-art-engine.js';
import {createDimensionField,disturbDimension} from '../src/dimension-field.js';
import {createRun} from '../src/run.js';import {placePlayer} from '../src/physics.js';
const render=(spec={})=>{const canvas=createCanvas(240,240),c=canvas.getContext('2d');drawFrameBite(c,{x:120,y:120,...spec});return canvas;};
test('frame bite is directional, force-sensitive, narrow and restores drawing context',()=>{
 assert.notDeepEqual(render({intensity:.15}).toBuffer('image/png'),render({intensity:.8}).toBuffer('image/png'));assert.notDeepEqual(render({angle:0}).toBuffer('image/png'),render({angle:Math.PI/2}).toBuffer('image/png'));
 const c=render({intensity:.8}).getContext('2d'),pixels=c.getImageData(0,0,240,240).data;let visible=0;for(let y=0;y<240;y++)for(let x=0;x<240;x++)if(pixels[(y*240+x)*4+3]){visible++;assert.ok(x>=119&&x<=133);assert.ok(y>=40&&y<=200);}assert.ok(visible>100);
 const ctx=createCanvas(100,100).getContext('2d');ctx.globalAlpha=.36;ctx.lineWidth=7;ctx.translate(3,4);const matrix=ctx.getTransform();drawFrameBite(ctx,{intensity:.8});assert.equal(ctx.globalAlpha,.36);assert.equal(ctx.lineWidth,7);assert.deepEqual(ctx.getTransform(),matrix);
});
test('frame bite expires, reduced mode is stationary, evidence remains quiet and inputs immutable',()=>{
 const spec=Object.freeze({intensity:.7,age:3,motion:false});assert.deepEqual(render(spec).toBuffer('image/png'),render(spec).toBuffer('image/png'));
 for(const age of [-1,18,100,NaN])assert.deepEqual(render({age}).toBuffer('image/png'),render({age:18}).toBuffer('image/png'));
 assert.notDeepEqual(render({age:2}).toBuffer('image/png'),render({age:9}).toBuffer('image/png'));assert.notDeepEqual(render({age:40,evidence:true}).toBuffer('image/png'),render({age:1800,evidence:true}).toBuffer('image/png'));
});
test('bank force uses normal closing speed, not high-speed grazing',()=>{
 const base=createDimensionField(),glance=disturbDimension(base,'bank',{x:0,y:0,speed:42,normalSpeed:10}),direct=disturbDimension(base,'bank',{x:0,y:0,speed:42,normalSpeed:42});assert.ok(direct.impulses[0].intensity>glance.impulses[0].intensity);assert.equal(base.impulses.length,0);
});
test('actual clean bank records inward normal force and replaces the generic impact ring',()=>{
 const r=createRun(41,()=>{},{waveMode:true});try{r.state.invul=99999;r.state.wave.entry=0;placePlayer(r.world,{x:1450,y:-450});r.dash({x:42,y:0,power:1});for(let i=0;i<10&&!r.state.wave.cleanBanks.total;i++)r.tick();assert.equal(r.state.wave.cleanBanks.total,1);const bank=r.state.dimension.impulses.find(i=>i.kind==='bank');assert.ok(bank.normalSpeed>20);assert.equal(bank.nx,-1);assert.equal(r.state.impact.source,'bank');assert.ok(r.world.player.velocity.x<0);}finally{r.dispose();}
});
