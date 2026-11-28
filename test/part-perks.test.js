import test from 'node:test';
import assert from 'node:assert/strict';
import Matter from 'matter-js';
import {createCanvas} from '@napi-rs/canvas';
import {ITEMS,equipmentRules} from '../src/equipment.js';
import {powerReadout} from '../src/power-readout.js';
import {PART_PERKS,resolvePartPerks,perkScoreMultiplier} from '../src/part-perks.js';
import {createRun} from '../src/run.js';
import {drawPartPerkPulse,drawPartPerkDemo} from '../src/art/splatr-art-engine.js';

test('every part has an honest receipt; active perks belong to real gear',()=>{
 for(const it of ITEMS){const read=powerReadout(it);assert.equal(read.cosmetic,['eyes','dash','world'].includes(it.slot),it.id);assert.doesNotMatch(read.title,/STYLE ONLY/);assert.ok(read.detail);}
 for(const id of Object.keys(PART_PERKS)){const it=ITEMS.find(i=>i.id===id);assert.ok(it,id);assert.ok(it.price>0);if(!['eyes','dash','world'].includes(it.slot))assert.ok(it.detail.includes(PART_PERKS[id].detail),id);}
});
test('stacked perks have explicit hard limits and conditional score is not always on',()=>{
 const p=resolvePartPerks({a:'neko',b:'lava',c:'comic',d:'spectrum',e:'dash-echo'});assert.equal(p.chainGrace,36);
 assert.equal(resolvePartPerks({a:'dash-echo'}).chainGrace,0,'Echo replaces, rather than stacks, the old combo grace');
 const f=resolvePartPerks({a:'hypno',b:'hologram',c:'dash-ice',d:'pointer-cross'});assert.equal(f.focusDrain,.92,'Hypno and Frost no longer discount aim; only Pointer remains');
 assert.equal(resolvePartPerks({a:'visor',b:'visor',c:'visor',d:'visor'}).focusDrain,1,'cosmetic IDs never grant focus');
 const r=resolvePartPerks({a:'glitch',b:'synth',c:'dash-water',d:'pointer-orbit'});assert.equal(r.focusRegen,1.1);
 const s=resolvePartPerks({a:'gold',b:'foundry',c:'dash-void',d:'confetti'}).scorePerks;
 assert.equal(perkScoreMultiplier(s,{kind:'fang'}),1.1);assert.equal(perkScoreMultiplier(s,{kind:'crown',kills:2}),1.22);
 assert.equal(perkScoreMultiplier(resolvePartPerks({a:'sniper'}).scorePerks,{power:.5}),1);
 assert.equal(perkScoreMultiplier(resolvePartPerks({a:'sniper'}).scorePerks,{power:1}),1);
});
test('new blade perks compose with Ghost without altering speed, health or armor',()=>{
 const base=equipmentRules({}),r=equipmentRules({tail:'ghost',slash:'katana',dash:'dash-fire',pointer:'pointer-diamond',body:'chamfer'});
 // Chamfer no longer contributes the old +1 tick; the other parts still do.
 assert.equal(r.bladeExtra,9);assert.equal(r.healthMax,base.healthMax);assert.equal(r.dashSpeed,base.dashSpeed);assert.equal(r.armorDamage,base.armorDamage);
 const a=createRun(19,()=>{},{staged:false}),b=createRun(19,()=>{},{staged:false,equipment:{slash:'katana'}});
 try{a.dash({x:30,y:-10,power:1});b.dash({x:30,y:-10,power:1});assert.equal(b.state.blade-a.state.blade,2);assert.ok(b.state.equipmentFx.bursts.some(b=>b.style==='perk-blade'));}finally{a.dispose();b.dispose();}
});
test('cosmetic eyes do not alter the live focus resource',()=>{
 const run=(equipment)=>createRun(77,()=>{},{staged:false,equipment});const a=run({}),b=run({eyes:'visor'}),c=run({eyes:'glitch'});
 try{
  for(const r of [a,b,c]){r.state.phase='playing';Matter.Body.setPosition(r.world.player,{x:0,y:-1000});r.world.grounded=false;r.state.focus=.5;r.focus(true);r.tick();}
  assert.equal(b.state.focus,a.state.focus,'visor cannot change focus cost');
  for(const r of [a,c]){r.focus(false);r.state.focus=.5;r.tick();}
  assert.equal(c.state.focus,a.state.focus,'glitch cannot change focus recovery');
 }finally{for(const r of [a,b,c])r.dispose();}
});
function cutOnce(equipment){
 let r,receipt;
 r=createRun(51,(type,d)=>{if(type==='cut'&&!receipt)receipt={...d,chainMax:r.state.chainMax};},{staged:false,equipment});
 try{
  r.state.phase='playing';r.state.invul=99999;
  for(const e of [...r.combat.enemies.values()])r.combat.remove(e);
  Matter.Body.setPosition(r.world.player,{x:0,y:-1000});Matter.Body.setVelocity(r.world.player,{x:0,y:0});r.world.grounded=false;
  r.combat.add({id:'perk-target',kind:'fang',x:300,y:-1000,pinned:true,delay:999999});
  r.dash({x:300,y:0,power:1});for(let i=0;i<30&&!receipt;i++){r.state.stop=0;r.tick();}
  assert.ok(receipt,'real blade cuts a real enemy');return receipt;
 }finally{r.dispose();}
}
test('real kills receive conditional score and chain grace through the authoritative run',()=>{
 const base=cutOnce({}),gold=cutOnce({body:'gold'}),neko=cutOnce({head:'neko'});
 assert.ok(gold.points>base.points,'gold bonus reaches earned points');
 assert.equal(neko.chainMax-base.chainMax,12,'neko extends the actual chain deadline');
});
test('perk receipt animation is bounded, state-safe, and reduced-motion safe',()=>{
 for(const kind of ['focus','blade','chain','score']){
  const canvas=createCanvas(200,160),c=canvas.getContext('2d');c.translate(3,4);c.globalAlpha=.7;const before=c.getTransform();
  drawPartPerkPulse(c,{x:100,y:80,kind,age:5});assert.deepEqual(c.getTransform(),before);assert.equal(c.globalAlpha,.7);
  const quiet=createCanvas(200,160),q=quiet.getContext('2d'),empty=quiet.toBuffer('image/png');
  drawPartPerkPulse(q,{age:5,motion:false});assert.deepEqual(quiet.toBuffer('image/png'),empty);
  drawPartPerkPulse(q,{age:30});assert.deepEqual(quiet.toBuffer('image/png'),empty);
 }
 const image=time=>{const canvas=createCanvas(640,400);drawPartPerkDemo(canvas.getContext('2d'),640,400,{...PART_PERKS.visor,time,motion:false});return canvas.toBuffer('image/png');};assert.deepEqual(image(0),image(1000));
});
