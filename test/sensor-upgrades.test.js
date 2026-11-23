import test from 'node:test';
import assert from 'node:assert/strict';
import {createCanvas} from '@napi-rs/canvas';
import {ITEMS,loadEquipment,normalizeEquipment,buyEquipment,equipmentRules} from '../src/equipment.js';
import {localRadar} from '../src/radar.js';
import {sensorTier,trajectorySamples,drawSensorPreview,drawShopCardArt} from '../src/art/splatr-art-engine.js';
import {predictAim} from '../src/aim.js';
import {createRun} from '../src/run.js';
import {placePlayer,stopPlayer} from '../src/physics.js';
import {installDom,createDisplay} from './support/display.js';
import {createRenderer} from '../src/renderer.js';

test('two independent sensors migrate old saves and have three costly, individually owned tiers',()=>{
 const old=loadEquipment(JSON.stringify({owned:['halo'],equipped:{head:'halo'},presets:[{head:'halo'}]}));
 assert.equal(old.equipped.radar,'radar-base');assert.equal(old.equipped.trajectory,'trajectory-base');assert.equal(old.presets[0].radar,'radar-base');
 for(const slot of ['radar','trajectory']){
  assert.deepEqual(ITEMS.filter(x=>x.slot===slot).map(x=>x.price),[0,1200,3000,6500]);
  for(let i=1;i<=3;i++){
   const id=`${slot}-${i}`,item=ITEMS.find(x=>x.id===id);assert.equal(buyEquipment(old,id,item.price-1),null);
   const bought=buyEquipment(old,id,item.price);assert.equal(bought.wallet,0);assert.equal(buyEquipment(bought.state,id,99999),null);
   const equipped=normalizeEquipment({...bought.state.equipped,[slot]:id},bought.state.owned);
   const loaded=loadEquipment(JSON.stringify({...bought.state,equipped,presets:[equipped]}));assert.equal(loaded.equipped[slot],id);assert.equal(loaded.presets[0][slot],id);
   assert.equal(sensorTier(loaded.equipped[slot],slot),i);assert.deepEqual(equipmentRules(equipped),equipmentRules(old.equipped),'sensor does not alter physics or combat');
  }
  assert.equal(normalizeEquipment({[slot]:`${slot}-3`},old.owned)[slot],`${slot}-base`,'unowned upgrades cannot equip');
 }
 assert.deepEqual([0,1,2,3].map(i=>trajectorySamples(i?`trajectory-${i}`:'trajectory-base')),[24,36,55,95]);
});

test('radar upgrade range reveals only real contacts and keeps the camera footprint bounded',()=>{
 const v={x:-400,y:-600,w:800,h:600},p={x:0,y:0},box={x:0,y:0,w:150,h:150};
 const enemies=[{id:'near',kind:'fang',x:200,y:-250},{id:'far',kind:'rift',x:1000,y:-400,mode:'tell'},{id:'beyond',kind:'crown',x:1900,y:-400}];
 const base=localRadar(v,p,box,enemies),extended=localRadar(v,p,box,enemies,null,{range:2.2});
 assert.deepEqual(base.blips.map(x=>x.id),['near']);assert.deepEqual(extended.blips.map(x=>x.id),['near','far']);assert.equal(extended.blips[1].mode,'tell');assert.ok(extended.viewport.w<base.viewport.w);
 for(const b of extended.blips)assert.ok(b.x>=extended.left&&b.x<=extended.right&&b.y>=extended.top&&b.y<=extended.bottom);
 assert.deepEqual(localRadar(v,p,box,enemies,null,{range:999}).blips,extended.blips);
});

test('calculated trajectory ends at the real analytic rail, not beyond it',()=>{
 const r=createRun(4,()=>{},{waveMode:true,controlPractice:true});try{
  for(const e of [...r.combat.enemies.values()])r.combat.remove(e);placePlayer(r.world,{x:700,y:-400});stopPlayer(r.world);r.state.phase='playing';
  const predicted=predictAim(r,{x:40,y:0,power:40/42,lock:null},{magnetic:false});
  assert.equal(predicted.end.kind,'wall');assert.ok(Math.abs(predicted.end.x-(r.world.arena.x+r.world.arena.w-23))<1);assert.ok(predicted.end.ticks>0);
  assert.ok(predicted.path.every(p=>p.x<=predicted.end.x+1));
 }finally{r.dispose();}
});

test('sensor previews are distinct across tiers and preserve canvas state',()=>{
 for(const slot of ['radar','trajectory']){
  const images=[];for(let level=0;level<=3;level++){
   const canvas=createCanvas(300,170),ctx=canvas.getContext('2d');ctx.translate(2,3);ctx.globalAlpha=.6;const before=ctx.getTransform();
   drawSensorPreview(ctx,300,170,{slot,level,motion:false});assert.equal(ctx.globalAlpha,.6);assert.deepEqual(ctx.getTransform(),before);images.push(canvas.toBuffer('image/png').toString('base64'));
   drawShopCardArt(ctx,300,170,{slot,equipment:{[slot]:level?`${slot}-${level}`:`${slot}-base`},motion:false});assert.deepEqual(ctx.getTransform(),before);
  }assert.equal(new Set(images).size,4);
 }
});

test('real renderer draws trajectory for pointer aiming and oracle flight calculations',()=>{
 const dom=installDom(),{canvas,ctx}=createDisplay(1280,720),renderer=createRenderer(canvas);
 const run=createRun(7,()=>{},{waveMode:true,controlPractice:true,equipment:{trajectory:'trajectory-3'}});
 try{
  for(const e of [...run.combat.enemies.values()])run.combat.remove(e);placePlayer(run.world,{x:0,y:-450});stopPlayer(run.world);run.state.phase='playing';renderer.field(run.world.player.position);
  const aim={x:32,y:-18,power:.88,lock:null,anchor:{x:0,y:-450}};
  ctx.__reset();renderer.draw(run,1,null,false);const idle=ctx.__ops.length;
  ctx.__reset();renderer.draw(run,1,aim,false);assert.ok(ctx.__ops.length>idle,'pointer aim adds a visible calculated path');
  assert.ok(ctx.__ops.some(op=>op.kind==='text'&&op.text.startsWith('SPD ')),'oracle shows the actual flight receipt');
 }finally{run.dispose();renderer.dispose();dom.uninstall();}
});


test('equipped radar displays actual hazards and live tells only at their tiers',()=>{
 const dom=installDom();try{
  for(const level of [0,1,2,3]){
   const {canvas,ctx}=createDisplay(1280,720),renderer=createRenderer(canvas),run=createRun(5,()=>{},{waveMode:true,controlPractice:true,equipment:{radar:level?`radar-${level}`:'radar-base'}});
   try{
    run.state.phase='playing';placePlayer(run.world,{x:0,y:-400});stopPlayer(run.world);for(const e of [...run.combat.enemies.values()])run.combat.remove(e);
    const e=run.combat.add({id:'warn',kind:'fang',x:100,y:-500,pinned:true,wavePlaced:true});e.mode='tell';e.clock=30;e.span=66;
    run.combat.hazards.push({kind:'needle',source:'prism',x:200,y:-500,px:200,py:-500,angle:0,life:50});renderer.field(run.world.player.position);renderer.draw(run,1,null,false);
    assert.equal(ctx.__ops.some(o=>o.paint==='#ffb080'),level>=2,`hazard tier ${level}`);
    assert.equal(ctx.__ops.some(o=>o.paint==='#ffb491'),level>=3,`live tell tier ${level}`);
   }finally{run.dispose();renderer.dispose();}
  }
 }finally{dom.uninstall();}
});
