import test from 'node:test';
import assert from 'node:assert/strict';
import {ITEMS,SLOTS,equipmentRules,normalizeEquipment,loadEquipment} from '../src/equipment.js';
import {HYBRIDS,activeHybrid} from '../src/hybrids.js';
import {aimPull,horizontalCutWidth,nearestEquipmentTarget,EQUIPMENT_LIMITS} from '../src/equipment-combat.js';
import {createRun} from '../src/run.js';
import {createCanvas} from '@napi-rs/canvas';
import {cube} from '../src/art.js';
import {drawEquipmentWorld,drawEquipmentSlash,drawEquipmentEffects} from '../src/equipment-art.js';
import Matter from 'matter-js';

test('complete catalog has exact expanded slot counts and every hybrid part is real',()=>{
 assert.equal(ITEMS.length,73);assert.deepEqual(SLOTS.map(slot=>ITEMS.filter(x=>x.slot===slot).length),[9,7,10,7,7,7,8,4,4,4,6]);
 for(const recipe of HYBRIDS){for(const [slot,id] of Object.entries(recipe.parts))assert.ok(ITEMS.some(x=>x.slot===slot&&x.id===id));assert.equal(activeHybrid(normalizeEquipment(recipe.parts))?.id,recipe.id);}
});
test('aim pull is bounded, forward-only and never moves big Fangs or other species',()=>{
 const p={x:0,y:0},small={kind:'fang',small:true,x:100,y:20};const q=aimPull(small,p,0);assert.ok(q.y<20);assert.ok(Math.abs(Math.hypot(q.x-small.x,q.y-small.y)-.35)<1e-9);
 for(const e of [{...small,small:false},{...small,kind:'crown'},{...small,x:-100},{...small,x:300}])assert.equal(aimPull(e,p,0),null);
});
test('Samurai horizontal width and Magnet close width are independent from reach and quests',()=>{
 const r=equipmentRules({head:'samurai',core:'magnet'});assert.equal(horizontalCutWidth(0,r),1.2);assert.equal(horizontalCutWidth(Math.PI/2,r),1);assert.equal(r.closeWidth,1.2);
});
function fixture(eq={}){
 const r=createRun(19,()=>{},{staged:false,equipment:eq});r.state.phase='playing';for(const e of [...r.combat.enemies.values()])r.combat.remove(e);Matter.Body.setPosition(r.world.player,{x:0,y:0});r.dash({x:20,y:-10,power:.7});r.state.stop=1;
 return r;
}
function add(r,id,kind,x=200,y=-100){return r.combat.add({id,kind,x,y,home:'catalog-test',slot:-1,pinned:true});}
test('Cube Crown removes exactly two armor plates instead of one and has a slower launch',()=>{
 for(const [head,damage] of [['none',1],['crown',2]]){const r=fixture({head});const e=add(r,'armor','bastion');e.hp=4;r.combat.contacts.add(e);r.tick();assert.equal(e.hp,4-damage);assert.equal(r.state.dashSpeed,head==='crown'?.92:1);r.dispose();}
});
test('Coil selects one nearest victim, never chains recursively into a third target',()=>{
 const r=fixture({head:'coil'}),a=add(r,'first','fang'),b=add(r,'next','fang',240,-100),c=add(r,'last','fang',280,-100);
 a.hp=b.hp=c.hp=1;r.combat.contacts.add(a);r.tick();assert.ok(!r.combat.enemies.has(a.id));assert.ok(!r.combat.enemies.has(b.id));assert.ok(r.combat.enemies.has(c.id));assert.equal(r.state.kills,2);assert.ok(r.state.equipmentFx.bursts.some(x=>x.style==='spark'));r.dispose();
});
test('Iron blocks one Fang rush, not needles, and grants no hidden immunity',()=>{
 const r=fixture({body:'iron'});r.state.invul=0;const hp=r.state.hp;assert.equal(r.hurt('Fang',null,{kind:'fang-rush'}),false);assert.equal(r.state.hp,hp);assert.equal(r.state.invul,0);assert.equal(r.state.guardSpent,true);assert.equal(r.hurt('Fang',null,{kind:'fang-rush'}),true);assert.equal(r.state.hp,hp-1);r.dispose();
 const q=fixture({body:'iron'});q.state.invul=0;assert.equal(q.hurt('Fang needle'),true);assert.ok(!q.state.guardSpent);q.dispose();
});
test('Echo spawns at every third direct chain kill and cannot recursively spawn more echoes',()=>{
 const r=fixture({core:'echo'});r.state.chain=2;r.state.chainTime=100;const e=add(r,'third','fang');e.hp=1;r.combat.contacts.add(e);r.tick();assert.equal(r.state.equipmentFx.echoes.length,1);assert.ok(r.state.equipmentFx.echoes[0].ticks<=30);r.dispose();
});
test('Prism side wall spawns exactly two bounded needles with a cooldown',()=>{
 const r=fixture({body:'prism'});r.world.struck={surface:'rail',x:0,y:0,nx:1,ny:0,depth:1};r.tick();assert.equal(r.state.equipmentFx.projectiles.length,2);
 r.state.stop=1;r.world.struck={surface:'rail',x:0,y:0,nx:1,ny:0,depth:1};r.tick();assert.ok(r.state.equipmentFx.projectiles.length<=2);assert.equal(EQUIPMENT_LIMITS.projectiles,8);r.dispose();
});
test('Anchor floor wave clears only nearby Fangs and does not crash a bank-only ledger',()=>{
 const r=fixture({tail:'anchor'});r.state.stroke=null;r.state.blade=0;r.state.floorIgnore=0;const a=add(r,'near','fang',80,0),b=add(r,'far','fang',300,0),c=add(r,'armor','bastion',90,0);a.hp=1;
 r.world.floorKick={vy:-13.5};r.tick();assert.ok(!r.combat.enemies.has(a.id));assert.ok(r.combat.enemies.has(b.id));assert.ok(r.combat.enemies.has(c.id));assert.ok(r.state.equipmentFx.bursts.some(x=>x.style==='floor'));r.dispose();
});
test('target tie-breaking is deterministic and range-limited',()=>{
 const a={id:'a',x:10,y:0,hp:1,kind:'fang'},b={...a,id:'b'};assert.equal(nearestEquipmentTarget([b,a],{x:0,y:0},20).id,'a');assert.equal(nearestEquipmentTarget([a],{x:0,y:0},5),null);
});
test('all five hybrid artworks, six worlds, seven slash styles render without Canvas transform leaks',()=>{
 const c=createCanvas(360,250).getContext('2d'),before=c.getTransform();
 for(const h of HYBRIDS){const eq=normalizeEquipment(h.parts);drawEquipmentWorld(c,360,250,eq.world,20);cube(c,180,140,40,0,20,1,{equipment:eq,combo:8,speed:30});assert.deepEqual(c.getTransform(),before);}
 for(const it of ITEMS.filter(x=>x.slot==='world')){drawEquipmentWorld(c,360,250,it.id,20);assert.deepEqual(c.getTransform(),before);}
 for(const it of ITEMS.filter(x=>x.slot==='slash')){drawEquipmentSlash(c,20,180,300,70,it.id,.6);assert.deepEqual(c.getTransform(),before);}
 drawEquipmentEffects(c,{projectiles:[],echoes:[],bursts:[]});assert.deepEqual(c.getTransform(),before);
});
test('hybrid discovery save migration keeps only valid title IDs',()=>{
 assert.deepEqual(loadEquipment(JSON.stringify({discovered:['sun','bogus']})).discovered,['sun']);
});

test('Thrusters add eight percent to an earned rebound without raising its ceiling',()=>{
 const speeds=[];
 for(const tail of ['ribbon','thrusters']){const r=fixture({tail});r.world.struck={surface:'rail',x:0,y:0,nx:1,ny:0,depth:1};r.tick();speeds.push(Math.hypot(r.world.player.velocity.x,r.world.player.velocity.y));assert.ok(speeds.at(-1)<=r.world.playerCeiling);r.dispose();}
 assert.ok(Math.abs(speeds[1]/speeds[0]-1.08)<1e-9);
});
test('Anchor boosts one eligible floor kick fifteen percent without repeating floor credit',()=>{
 const velocities=[];
 for(const tail of ['ribbon','anchor']){const r=fixture({tail});r.state.floorIgnore=0;Matter.Body.setVelocity(r.world.player,{x:0,y:-12});r.world.floorKick={vy:-12};r.tick();velocities.push(r.world.player.velocity.y);r.state.stop=1;r.world.floorKick={vy:-12};r.tick();assert.equal(r.state.floorKicks,1);r.dispose();}
 assert.ok(Math.abs(velocities[1]/velocities[0]-1.15)<1e-9);
});
test('Eye, Slash and World perks preserve health, dash speed and primary armor',()=>{
 const baseline=equipmentRules({});
 for(const item of ITEMS.filter(x=>['eyes','slash','world'].includes(x.slot))){const r=equipmentRules({[item.slot]:item.id});for(const field of ['healthMax','dashSpeed','armorDamage','cutWidth'])assert.equal(r[field],baseline[field],item.id+': '+field);}
});
