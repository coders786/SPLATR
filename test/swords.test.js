import test from 'node:test';
import assert from 'node:assert/strict';
import {createCanvas} from '@napi-rs/canvas';
import {SWORD_STYLES,SWORD_BUILDS,swordProfile,effectiveSword,swordAttack,advanceSwordAttacks} from '../src/swords.js';
import {drawSwordWeapon,drawSwordAttack,HYBRIDS} from '../src/art/splatr-art-engine.js';
import {createRun} from '../src/run.js';
import {placePlayer,stopPlayer} from '../src/physics.js';
const build=id=>SWORD_BUILDS.find(b=>b.id===id).parts;
function setup(id){const r=createRun(123,()=>{},{waveMode:true,equipment:build(id)});for(const e of [...r.combat.enemies.values()])r.combat.remove(e);r.state.phase='playing';r.state.invul=999999;placePlayer(r.world,{x:-350,y:-100});stopPlayer(r.world);return r;}
function enemy(r,id,kind,x,y=-100){return r.combat.add({id,kind,x,y,pinned:true,delay:999999});}
test('all 17 full builds have explicit stable tiers/styles; sparks and mixed loadouts never grant a signature',()=>{
 assert.equal(SWORD_BUILDS.length,17);assert.equal(SWORD_BUILDS.filter(b=>b.tier==='zenith').length,6);
 const signatures=SWORD_BUILDS.map(b=>{const s=swordProfile(b.parts);return JSON.stringify([s.family,s.width,s.reach,s.ticks,s.armor,s.delay,s.chargeMax,s.secondaryRange,s.secondaryWidth,s.targetCap]);});assert.equal(new Set(signatures).size,17,'every full build has an explicit distinct tuning signature');
 for(const b of SWORD_BUILDS){assert.ok(Object.isFrozen(b));const s=swordProfile(b.parts);assert.equal(s.build,b.id);assert.equal(s.family,b.style);assert.equal(s.tier,b.tier);assert.ok(Object.isFrozen(s));assert.deepEqual(b.parts,HYBRIDS.find(h=>h.id===b.id).parts);if(b.tier==='zenith')assert.ok(['echo','pulse'].includes(s.family));}
 assert.equal(swordProfile({}).family,'standard');assert.equal(swordProfile({head:'coil',core:'echo'}).family,'standard');
});
test('all specialized styles spend baseline power; effective temporary values replace instead of mutating',()=>{
 for(const s of Object.values(SWORD_STYLES)){assert.ok(Object.isFrozen(s));if(s.id!=='standard')assert.ok(s.width<1||s.reach<1||s.ticks<0);const t=effectiveSword(s,{reach:1.2,blade:8,armor:1});assert.equal(t.reach,s.reach*1.2);assert.equal(t.ticks,s.ticks+8);assert.equal(t.armor,s.armor+1);assert.equal(effectiveSword(s).ticks,s.ticks);}
});
test('fixed delayed lanes, target caps, one execution, and no homing or recursive callbacks',()=>{
 const s=SWORD_STYLES.echo,a=swordAttack(s,{x:10,y:20},Math.PI,4),hits=[];
 assert.ok(Math.abs(a.tx+260)<1e-8);assert.equal(a.ty,20+Math.sin(Math.PI)*270);
 const pool=[0,1,2,3,4].map(id=>({id}));let queue=[a];for(let i=0;i<17;i++)queue=advanceSwordAttacks(queue,1,()=>pool,e=>hits.push(e.id));assert.equal(hits.length,0);
 queue=advanceSwordAttacks(queue,1,()=>pool,e=>hits.push(e.id));assert.deepEqual(hits,[0,1,2]);for(let i=0;i<20;i++)queue=advanceSwordAttacks(queue,1,()=>pool,e=>hits.push(e.id));assert.equal(hits.length,3);assert.equal(queue.length,0);
});
test('live Echo can damage a plate already cut by the primary without changing the launch direction',()=>{
 const r=setup('wraith');try{const e=enemy(r,'plate','bastion',-175);const startHp=e.hp;assert.ok(r.dash({x:24,y:0,power:24/42}));const tx=r.state.swordFx[0].tx;for(let i=0;i<90&&r.state.wave.phase==='combat';i++)r.tick();assert.ok(!r.combat.enemies.has(e.id)||e.hp<=startHp-2);assert.equal(tx,-80);assert.equal(r.state.swordContacts,0);assert.ok(r.state.swordFx.length<=3);}finally{r.dispose();}
});
test('live Pulse charges only direct contacts; full charge spends on next dash; lanes do not charge themselves',()=>{
 const r=setup('storm');try{enemy(r,'sentinel','fang',700,-900);
 for(let i=0;i<3;i++){placePlayer(r.world,{x:-350,y:-100});stopPlayer(r.world);const target=enemy(r,`target${i}`,'bastion',-275);r.state.edge=3;assert.ok(r.dash({x:24,y:0,power:24/42}));for(let t=0;t<8&&target.lastSlash!==r.state.shots;t++){r.state.stop=0;r.tick();}r.combat.remove(target);}
 assert.equal(r.state.swordCharge,3);const n=r.state.swordContacts;r.state.edge=3;r.state.blade=0;assert.ok(r.dash({x:-24,y:0,power:24/42}));assert.equal(r.state.swordCharge,0);assert.equal(r.state.swordFx.at(-1).kind,'pulse');for(let i=0;i<2;i++)r.tick();assert.ok(r.state.swordContacts<=n+1);
 }finally{r.dispose();}
});
test('Breaker strips an additional armored plate with a real narrower/shorter sensor profile',()=>{
 const r=setup('bulwark');try{const e=enemy(r,'armored','bastion',-275);const hp=e.hp;r.dash({x:24,y:0,power:24/42});for(let i=0;i<5&&e.hp===hp;i++)r.tick();assert.equal(e.hp,hp-2);assert.equal(r.state.sword.width,.92);assert.equal(r.state.sword.reach,.9);}finally{r.dispose();}
});
test('rest clears pending strikes, charge and equipment projectiles; repeated choose ticks cannot progress them',()=>{
 const r=setup('storm');try{r.state.swordCharge=3;r.state.swordFx.push(swordAttack(SWORD_STYLES.echo,{x:0,y:0},0,1));r.state.equipmentFx.echoes.push({x:0,y:0,ticks:30,hits:new Set()});r.tick();assert.equal(r.state.wave.phase,'return');assert.equal(r.state.swordCharge,0);assert.equal(r.state.swordFx.length,0);assert.equal(r.state.equipmentFx.echoes.length,0);}finally{r.dispose();}
});
test('all blade phases draw at tiny/live/large scales with balanced canvas state and no save mutation',()=>{
 const c=createCanvas(500,300).getContext('2d');let saves=0,restores=0;const save=c.save.bind(c),restore=c.restore.bind(c);c.save=()=>{saves++;save();};c.restore=()=>{restores++;restore();};
 for(const sword of Object.values(SWORD_STYLES))for(const radius of [12,24,48])for(const active of [false,true])for(const angle of [0,Math.PI/2,Math.PI,-Math.PI/2]){
  const before=c.getTransform();drawSwordWeapon(c,{x:100,y:100,radius,active,angle,sword,charge:3});const a=swordAttack(SWORD_STYLES.echo,{x:20,y:30},angle,1);a.fired=true;drawSwordAttack(c,a,sword);assert.deepEqual(c.getTransform(),before);
 }assert.equal(saves,restores);
});
