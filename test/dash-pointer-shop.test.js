import test from 'node:test';
import assert from 'node:assert/strict';
import {createCanvas} from '@napi-rs/canvas';
import {ITEMS,loadEquipment,buyEquipment,normalizeEquipment,equipmentRules} from '../src/equipment.js';
import {DASH_ELEMENTS,dashElement,pointerVisual,drawShopCardArt,drawDragArrowPreview} from '../src/art/splatr-art-engine.js';

test('old saves migrate to adaptive dash and reticle, purchases and presets round trip',()=>{
 const old=loadEquipment(JSON.stringify({owned:['time'],equipped:{core:'time'},presets:[{core:'time'}]}));
 assert.equal(old.equipped.dash,'dash-auto');assert.equal(old.equipped.pointer,'pointer-reticle');assert.equal(old.presets[0].dash,'dash-auto');
 for(const id of ['dash-fire','pointer-orbit']){
  const item=ITEMS.find(x=>x.id===id);assert.equal(buyEquipment(old,id,item.price-1),null);
  const receipt=buyEquipment(old,id,item.price);assert.equal(receipt.wallet,0);
  const equip=normalizeEquipment({...receipt.state.equipped,[item.slot]:id},receipt.state.owned);
  const reloaded=loadEquipment(JSON.stringify({...receipt.state,equipped:equip,presets:[equip]}));
  assert.equal(reloaded.equipped[item.slot],id);assert.equal(reloaded.presets[0][item.slot],id);
  assert.deepEqual(equipmentRules(equip),equipmentRules(old.equipped));
 }
});
test('explicit dash selection overrides sword and equipment; adaptive preserves existing identity',()=>{
 for(const element of DASH_ELEMENTS)assert.equal(dashElement({dash:'dash-'+element,core:'time'},{build:'forge'}),element);
 assert.equal(dashElement({dash:'dash-auto',core:'time'}),'ice');
 assert.equal(dashElement({dash:'dash-auto',core:'time'},{build:'forge'}),'fire');
});
test('press marks are distinct, bounded, stable, power-aware and show cancellation',()=>{
 const ids=ITEMS.filter(x=>x.slot==='pointer').map(x=>x.id),paths=new Set();
 for(const id of ids){const equipment=Object.freeze({pointer:id}),a=pointerVisual({equipment,power:.5}),b=pointerVisual({equipment,power:.5});assert.deepEqual(a,b);paths.add(a.path);
  for(const [x,y] of a.paths.flat())assert.ok(Math.hypot(x,y)<=19);
  assert.notEqual(pointerVisual({equipment,power:0}).path,pointerVisual({equipment,power:1}).path);
  assert.equal(pointerVisual({equipment,cancel:true}).color,'#ee8d93');
 }assert.equal(paths.size,ids.length);
});
test('dash and pointer shop cards and previews use selected styles and restore context',()=>{
 for(const slot of ['dash','pointer']){
  const images=[];for(const item of ITEMS.filter(x=>x.slot===slot)){
   const canvas=createCanvas(300,184),c=canvas.getContext('2d');c.globalAlpha=.5;c.translate(2,3);const transform=c.getTransform();
   drawShopCardArt(c,300,184,{slot,equipment:{[slot]:item.id},time:18,motion:false});
   assert.equal(c.globalAlpha,.5);assert.deepEqual(c.getTransform(),transform);images.push(canvas.toBuffer('image/png'));
  }
  // Adaptive and explicit ink can legitimately match with a default build.
  assert.ok(new Set(images.map(b=>b.toString('base64'))).size>=ITEMS.filter(x=>x.slot===slot).length-1);
 }
 const canvas=createCanvas(300,170),c=canvas.getContext('2d');drawDragArrowPreview(c,300,170,{equipment:{pointer:'pointer-orbit'}});assert.ok(canvas.toBuffer('image/png').length>1000);
});

test('captured touch draws selected origin at press and clears it on cancel',async()=>{
 const {Window}=await import('happy-dom');const {createInput}=await import('../src/input.js');
 const previous=globalThis.window,win=new Window();globalThis.window=win;
 const canvas=win.document.createElement('canvas');win.document.body.append(canvas);
 Object.defineProperties(canvas,{clientWidth:{value:800},clientHeight:{value:600}});
 canvas.setPointerCapture=()=>{};canvas.hasPointerCapture=()=>false;canvas.releasePointerCapture=()=>{};
 const run={state:{equipment:{pointer:'pointer-diamond',dash:'dash-fire'}},aimAt:()=>({target:null}),focus(){}};
 const input=createInput(canvas,{get:()=>run,active:()=>true,point:(x,y)=>({x,y}),assist:()=>false,engage(){},lock:{tick(){}},commit:()=>true});
 const event=(type,x,y)=>new win.PointerEvent(type,{bubbles:true,isPrimary:true,pointerId:1,pointerType:'touch',button:0,clientX:x,clientY:y});
 try{
  canvas.dispatchEvent(event('pointerdown',100,120));const overlay=win.document.querySelector('svg');
  assert.equal(overlay.style.display,'block');assert.equal(overlay.dataset.pointer,'pointer-diamond');assert.equal(overlay.querySelector('.pointer-origin').getAttribute('transform'),'translate(100 120)');
  win.dispatchEvent(event('pointermove',60,120));assert.equal(overlay.querySelector('.pointer-origin').getAttribute('transform'),'translate(100 120)');assert.notEqual(overlay.querySelector('.drag-head').getAttribute('d'),'');
  canvas.dispatchEvent(event('pointercancel',60,120));assert.equal(overlay.style.display,'none');
 }finally{input.dispose();globalThis.window=previous;win.happyDOM.abort();}
});
