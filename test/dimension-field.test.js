import test from 'node:test';
import assert from 'node:assert/strict';
import {createCanvas} from '@napi-rs/canvas';
import {createDimensionField,stepDimensionField,disturbDimension,settleDimensionField,DIMENSION_FIELD} from '../src/dimension-field.js';
import {drawDimensionField} from '../src/art/splatr-art-engine.js';
import {createRun} from '../src/run.js';
import {placePlayer} from '../src/physics.js';
const hit={x:180,y:150,speed:20,angle:0};
const frozen=value=>{if(value&&typeof value==='object'){Object.freeze(value);Object.values(value).forEach(frozen)}return value};
test('field is immutable, deterministic, and creates wakes only from movement',()=>{
 const original=frozen(createDimensionField());let a=original,b=createDimensionField();
 for(let i=0;i<30;i++){const input={x:20+i*6,y:30,vx:6,vy:0,distance:6};a=stepDimensionField(a,input);b=stepDimensionField(b,input)}assert.deepEqual(a,b);assert.equal(original.wakes.length,0);assert.ok(a.wakes.length>0);
 let idle=createDimensionField();for(let i=0;i<120;i++)idle=stepDimensionField(idle,{vx:40,vy:0,distance:0});assert.equal(idle.wakes.length,0);assert.equal(idle.strain,0);
 assert.equal(stepDimensionField(a,{active:false}),a,'pause freezes exact visual snapshot');
});
test('speed-sensitive direct kills differ; fragments, paper, secondary effects and invalid events do not add strain',()=>{
 const base=createDimensionField(),normal=disturbDimension(base,'cut',hit),fast=disturbDimension(base,'cut',{...hit,speed:42});
 assert.ok(fast.impulses[0].intensity>normal.impulses[0].intensity);assert.equal(normal.scars.length,0);assert.equal(fast.scars.length,1);assert.ok(fast.strain>normal.strain);
 for(const extra of [{small:true},{paper:true},{secondary:true},{speed:NaN}])assert.equal(disturbDimension(base,'cut',{...hit,...extra}),base);
 assert.equal(disturbDimension(base,'unknown',hit),base);
});
test('hard launches respond to acceleration; clean banks leave persistent local scars',()=>{
 const base=createDimensionField(),soft=disturbDimension(base,'launch',{...hit,acceleration:4}),hard=disturbDimension(base,'launch',{...hit,acceleration:42});assert.ok(hard.impulses[0].intensity>soft.impulses[0].intensity);assert.equal(hard.scars.length,0);
 const bank=disturbDimension(hard,'bank',{...hit,speed:42,nx:1,ny:0});assert.equal(bank.scars.length,1);const rest=settleDimensionField(bank);assert.equal(rest.wakes.length,0);assert.equal(rest.impulses.length,0);assert.deepEqual(rest.scars,bank.scars);assert.equal(rest.strain,bank.strain);
});
test('all buffers are capped, effects expire, and fractional time ages proportionally',()=>{
 let p=createDimensionField();for(let i=0;i<6000;i++){p=disturbDimension(p,'bank',{...hit,x:i%300,speed:900});p=stepDimensionField(p,{x:120,y:80,vx:30,vy:0,distance:30});assert.ok(p.wakes.length<=DIMENSION_FIELD.wakes);assert.ok(p.impulses.length<=DIMENSION_FIELD.impulses);assert.ok(p.scars.length<=DIMENSION_FIELD.scars);assert.ok(p.strain<=1);}
 let a=disturbDimension(createDimensionField(),'bank',hit),b=a;for(let i=0;i<10;i++)a=stepDimensionField(a);for(let i=0;i<100;i++)b=stepDimensionField(b,{dt:.1});assert.ok(Math.abs(a.impulses[0].age-b.impulses[0].age)<1e-9);
 for(let i=0;i<1900;i++)p=stepDimensionField(p);assert.equal(p.impulses.length,0);assert.equal(p.scars.length,0);assert.equal(p.wakes.length,0);
});
test('portable engine draws visible restrained full/reduced cues without mutating snapshots',()=>{
 let p=disturbDimension(createDimensionField(),'launch',{...hit,acceleration:42});p=disturbDimension(p,'bank',{...hit,x:110,y:110,speed:42});frozen(p);
 const buffers=[];for(const motion of [true,false]){const canvas=createCanvas(360,260),c=canvas.getContext('2d');c.fillStyle='#15151e';c.fillRect(0,0,360,260);const before=canvas.toBuffer('image/png');drawDimensionField(c,p,{x:0,y:0,w:360,h:260,scale:1},motion);const after=canvas.toBuffer('image/png');assert.notDeepEqual(after,before);buffers.push(after);const same=createCanvas(360,260),sc=same.getContext('2d');sc.fillStyle='#15151e';sc.fillRect(0,0,360,260);drawDimensionField(sc,p,{x:0,y:0,w:360,h:260,scale:1},motion);assert.deepEqual(same.toBuffer('image/png'),after);}
 assert.notDeepEqual(buffers[0],buffers[1]);
});
test('actual launched wall bank adds evidence; clear settles transients, next cycle resets',()=>{
 const r=createRun(41,()=>{},{waveMode:true});try{
 r.state.invul=99999;r.state.wave.entry=0;placePlayer(r.world,{x:820,y:-450});r.dash({x:42,y:0,power:1});assert.ok(r.state.dimension.impulses.some(i=>i.kind==='launch'));
 for(let i=0;i<6;i++)r.tick();assert.ok(r.state.dimension.scars.some(i=>i.kind==='bank'));
 for(const e of [...r.combat.enemies.values()])r.combat.remove(e);r.tick();assert.equal(r.state.wave.phase,'return');assert.equal(r.state.dimension.impulses.length,0);assert.ok(r.state.dimension.scars.length>0);
 r.state.wave.phase='choose';r.state.wave.offers=[{id:'test'}];r.chooseWaveBuff('test');assert.ok(r.state.dimension.scars.length>0,'same room remembers across waves');
 r.state.wave.number=5;r.state.wave.phase='choose';r.state.wave.offers=[{id:'test'}];r.chooseWaveBuff('test');assert.equal(r.state.dimension.cycle,1);assert.equal(r.state.dimension.scars.length,0);
 }finally{r.dispose()}
});
