import test from 'node:test';
import assert from 'node:assert/strict';
import {createCanvas} from '@napi-rs/canvas';
import {createRun} from '../src/run.js';
import {placePlayer,stopPlayer,setPlayerVelocity} from '../src/physics.js';
import {equipmentRules,loadEquipment,ITEMS} from '../src/equipment.js';
import {powerReadout} from '../src/power-readout.js';
import {ARMOR_SHELL,armorShellRecoil,storeArmorLoss,activeArmorSpring,returnArmorSpring,armorShellStudy} from '../src/armor-shell.js';
import {drawCubeHero,drawArmorShellStudy} from '../src/art/splatr-art-engine.js';
import {shopStudy} from '../src/shop-catalog.js';
import {MOVEMENT} from '../src/movement-model.js';
import {swordAttack,SWORD_STYLES} from '../src/swords.js';
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-10,`${a} != ${b}`);
function setup(body='paper',extra={}){
 const events=[];const r=createRun(77,(type,data)=>events.push({type,data}),{waveMode:true,equipment:{...extra,body}});
 for(const e of [...r.combat.enemies.values()])r.combat.remove(e);
 r.state.phase='playing';r.state.invul=999999;r.state.wave.entry=0;
 placePlayer(r.world,{x:-350,y:-400});stopPlayer(r.world);r.world.grounded=false;
 r.combat.add({id:'sentinel',kind:'fang',x:700,y:-900,pinned:true,delay:999999});
 assert.equal(r.dash({x:30,y:0,power:30/42}),true);
 const plate=(id='plate',kind='bastion',hp=8,x=-275)=>{const e=r.combat.add({id,kind,x,y:-400,pinned:true,delay:999999});e.hp=hp;return e;};
 const hit=(e,velocity={x:30,y:0})=>{setPlayerVelocity(r.world,velocity.x,velocity.y);r.state.stop=1;r.combat.contacts.add(e);r.tick();return {...r.world.player.velocity};};
 return {r,events,plate,hit};
}

test('shell replacements remove old blade/chain perks and retain capacity, prices and ownership',()=>{
 const base=equipmentRules({}),chamfer=equipmentRules({body:'chamfer'}),segmented=equipmentRules({body:'segmented'});
 assert.equal(chamfer.bladeExtra,base.bladeExtra);assert.equal(chamfer.armorRecoilScale,.8);
 assert.equal(segmented.chainGrace,base.chainGrace);assert.equal(segmented.armorSpring,true);
 for(const r of [chamfer,segmented]){assert.equal(r.healthMax,3);assert.equal(r.armorDamage,1);assert.equal(r.dashSpeed,1);}
 for(const [id,price] of [['chamfer',280],['segmented',380]]){
  assert.equal(ITEMS.find(i=>i.id===id).price,price);
  assert.equal(loadEquipment(JSON.stringify({owned:[id],equipped:{body:id},presets:[{body:id}]})).equipped.body,id);
  assert.doesNotMatch(powerReadout(id).chips.join(' '),/CHAIN \+|BLADE \+/);
 }
});

test('actual primary armor shove: Paper30→23, Chamfer30→24.4, equal damage and unchanged position',()=>{
 const a=setup(),b=setup('chamfer');
 try{
  const pa=a.plate(),pb=b.plate(),va=a.hit(pa),vb=b.hit(pb);
  near(va.x,23);near(vb.x,24.4);near(va.y,vb.y);assert.equal(pa.hp,pb.hp);
  assert.deepEqual(a.r.world.player.position,b.r.world.player.position);
  assert.equal(b.r.state.shellImpact.age,0);assert.equal(b.r.state.shellImpact.angle,0);
  assert.equal(a.r.state.shellImpact,null);assert.equal(a.r.state.shellSpring,null);
  assert.equal(a.r.state.blade,b.r.state.blade,'old blade tick is removed');
 }finally{a.r.dispose();b.r.dispose();}
});

test('glancing recoil handles diagonal, zero and reversed velocity without adding speed or stripping Hyper',()=>{
 for(const v of [{x:0,y:0},{x:-30,y:0},{x:30,y:20},{x:120,y:30}])for(const angle of [0,Math.PI/3,Math.PI]){
  const after=armorShellRecoil(v,angle,7,180,true);
  assert.ok(Math.hypot(after.x,after.y)<=Math.hypot(v.x,v.y)+1e-12);
 }
 const f=setup('chamfer');try{f.r.world.playerCeiling=180;const out=f.hit(f.plate(),{x:120,y:0});near(out.x,114.4);}finally{f.r.dispose();}
 near(armorShellRecoil({x:120,y:0},0,7,180,true).x,114.4);
});

test('segmented stores actual primary forward loss once per shot, not repeated overlaps or kills',()=>{
 const f=setup('segmented');try{
  f.hit(f.plate());const s=f.r.state,charge=s.shellSpring;
  near(charge.amount,1.4);near(charge.preSpeed,30);assert.equal(charge.expiresAt,s.elapsed+45);
  f.hit(f.plate('other'),{x:36,y:0});assert.equal(s.shellSpring,charge,'no refresh or stacking');
  s.shellSpring=null;f.hit(f.plate('third'));assert.equal(s.shellSpring,null,'no second store in the same shot');
 }finally{f.r.dispose();}
 const kill=setup('segmented');try{kill.hit(kill.plate('paper','fang',1));assert.equal(kill.r.state.shellSpring,null);}finally{kill.r.dispose();}
});

test('zero-speed armor cannot store invented recoil; tangential/gaining motion cannot mint a reserve',()=>{
 const f=setup('segmented');try{f.hit(f.plate(),{x:0,y:0});assert.equal(f.r.state.shellSpring,null);}finally{f.r.dispose();}
 assert.equal(storeArmorLoss({x:10,y:0},{x:12,y:0},0,0),null);
 assert.equal(storeArmorLoss({x:10,y:0},{x:10,y:7},0,0),null);
 near(storeArmorLoss({x:100,y:0},{x:0,y:0},0,0).amount,4);
});

test('one accepted launch returns reserve within preimpact/legal ceilings; never slows a faster launch',()=>{
 const f=setup('segmented');try{
  f.hit(f.plate());const before={...f.r.world.player.position};
  assert.equal(f.r.dash({x:24,y:0,power:24/42}),true);
  near(f.r.world.player.velocity.x,25.4);assert.equal(f.r.state.shellSpring,null);
  near(f.r.state.shellRelease.amount,1.4);assert.deepEqual(f.r.world.player.position,before);
  assert.equal(f.events.filter(e=>e.type==='shellReturn').length,1);
  assert.equal(f.r.dash({x:24,y:0,power:24/42}),true);
  assert.equal(f.events.filter(e=>e.type==='shellReturn').length,1,'charge pays out only once');
 }finally{f.r.dispose();}
 const c=storeArmorLoss({x:30,y:0},{x:23,y:0},0,0);
 near(returnArmorSpring({x:29.5,y:0},c,1,42).x,30);
 near(returnArmorSpring({x:25,y:0},c,1,25.5).x,25.5);
 near(returnArmorSpring({x:60,y:0},c,1,180).x,60);
 near(returnArmorSpring({x:0,y:0},c,1,42).amount,0);
});

test('cancel/hold/refused/invalid/locked launch preserve reserve, expiry uses45 world steps',()=>{
 const f=setup('segmented');try{
  f.hit(f.plate());const s=f.r.state,c=s.shellSpring,focus=s.focus;
  for(let i=0;i<20;i++){f.r.focus(true);f.r.focus(false);}
  assert.equal(s.shellSpring,c);assert.equal(s.focus,focus);
  assert.equal(f.r.dash({x:0,y:0,power:0}),false);assert.equal(s.shellSpring,c);
  s.inputLock=true;assert.equal(f.r.dash({x:24,y:0,power:.5}),false);assert.equal(s.shellSpring,c);s.inputLock=false;
  s.edge=0;s.recharge=0;assert.equal(f.r.dash({x:24,y:0,power:.5}),false);assert.equal(s.shellSpring,c);
  for(let i=0;i<44;i++){s.stop=1;f.r.tick();}
  assert.equal(s.shellSpring,c);s.stop=1;f.r.tick();assert.equal(s.shellSpring,null);
  assert.equal(activeArmorSpring(c,c.expiresAt-1),true);assert.equal(activeArmorSpring(c,c.expiresAt),false);
 }finally{f.r.dispose();}
});

test('a buffered launch spends nothing until the accepted launch actually occurs',()=>{
 const f=setup('segmented');try{
  f.hit(f.plate());const s=f.r.state,c=s.shellSpring;s.edge=0;s.recharge=MOVEMENT.recharge-2;
  assert.equal(f.r.dash({x:24,y:0,power:.5}),true);
  assert.ok(s.edgeBuffer);assert.equal(s.shellSpring,c);assert.equal(s.shellRelease,null);
  s.stop=1;f.r.tick();assert.equal(s.shellSpring,c);
  for(let i=0;i<4&&!s.shellRelease;i++){s.stop=1;f.r.tick();}
  assert.equal(s.edgeBuffer,null);assert.equal(s.shellSpring,null);assert.ok(s.shellRelease.amount>0);
 }finally{f.r.dispose();}
});

test('real secondary sword echoes do not trigger shell powers',()=>{
 for(const body of ['chamfer','segmented']){
  const f=setup(body);try{
   const plate=f.plate();f.r.state.blade=0;
   f.r.state.swordFx.push({...swordAttack({...SWORD_STYLES.echo,targetCap:2},{x:plate.x-90,y:plate.y},0,1),delay:0});
   f.r.state.stop=0;f.r.tick();assert.equal(plate.hp,7,'real secondary armor contact occurred');
   assert.equal(f.r.state.shellSpring,null);assert.equal(f.r.state.shellImpact,null);
  }finally{f.r.dispose();}
 }
});

test('legacy shear contacts preserve their ordinary shove and cannot store or glance',()=>{
 for(const body of ['chamfer','segmented']){
  const f=setup(body);try{
   const first=f.plate('first','fang',1),second=f.plate('second','fang',1,-230),armor=f.plate('shear-armor','bastion',8,-30);
   f.hit(first);f.hit(second);
   assert.ok(f.events.some(e=>e.type==='shear'),'real two-kill shear released');
   assert.equal(armor.hp,6,'real legacy-shear armor damage');
   near(f.r.world.player.velocity.x,23);
   assert.equal(f.r.state.shellSpring,null);assert.equal(f.r.state.shellImpact,null);
  }finally{f.r.dispose();}
 }
});

test('spring cannot create wall penetration: reserve launch leaves collision to the existing rail solver',()=>{
 const f=setup('segmented');try{
  f.hit(f.plate());const world=f.r.world;
  const view={x:-420,y:-800,w:840,h:800};f.r.setView(view);
  // An ordinary arena wall launch uses unchanged swept physics. This tests
  // the reserve adds velocity only, never rewrites position through a wall.
  const a=world.arena;assert.ok(a);placePlayer(world,{x:a.x+40,y:-400});
  const before={...world.player.position};f.r.dash({x:-24,y:0,power:.6});
  assert.deepEqual(world.player.position,before);
  assert.ok(Math.hypot(world.player.velocity.x,world.player.velocity.y)<=30);
  for(let i=0;i<6;i++){f.r.state.stop=0;f.r.tick();}
  assert.ok(world.player.position.x>=a.x);assert.ok(world.player.position.x<=a.x+a.w);
  assert.ok(world.player.velocity.x>0,'real wall reflection still occurs');
  assert.equal(f.r.state.shellSpring,null);
 }finally{f.r.dispose();}
});

test('death, retire, ready-return and dispose clear plate state, impact and release clocks are bounded',()=>{
 for(const action of ['death','retire','ready','dispose']){
  const f=setup('segmented');try{
   f.hit(f.plate());assert.ok(f.r.state.shellSpring);
   if(action==='death'){f.r.state.hp=1;f.r.state.invul=0;f.r.hurt('QA');}
   else if(action==='retire')f.r.retire();else if(action==='ready'){f.r.state.opening={};assert.equal(f.r.skipOpening(),true);}else f.r.dispose();
   assert.equal(f.r.state.shellSpring,null);assert.equal(f.r.state.shellImpact,null);assert.equal(f.r.state.shellRelease,null);
  }finally{if(action!=='dispose')f.r.dispose();}
 }
 const f=setup('chamfer');try{f.hit(f.plate());for(let i=0;i<7;i++){f.r.state.stop=1;f.r.tick();}assert.equal(f.r.state.shellImpact,null);}finally{f.r.dispose();}
});

const heroImage=(body,pose={},motion=true)=>{
 const canvas=createCanvas(220,220),c=canvas.getContext('2d');c.translate(1,2);c.globalAlpha=.6;const before=c.getTransform();
 drawCubeHero(c,{x:110,y:110,radius:60,equipment:Object.freeze({body,head:'neko',tail:'ribbon',core:'echo'}),time:0,motion,pose:Object.freeze({blink:1,...pose})});
 assert.deepEqual(c.getTransform(),before);assert.equal(c.globalAlpha,.6);return canvas.toBuffer('image/png');
};
test('rendered plates/glance change only their shell, canvas state is balanced, reduced motion is static',()=>{
 assert.notDeepEqual(heroImage('chamfer'),heroImage('chamfer',{shellGlanceAge:0,shellContactAngle:0}));
 assert.deepEqual(heroImage('paper'),heroImage('paper',{shellAmount:1.4,shellGlanceAge:0}));
 assert.notDeepEqual(heroImage('chamfer',{shellGlanceAge:0,shellContactAngle:0}),heroImage('chamfer',{shellGlanceAge:0,shellContactAngle:Math.PI/2}));
 assert.notDeepEqual(heroImage('segmented'),heroImage('segmented',{shellReleaseAge:0,shellReleasedAmount:1.4}));
 assert.notDeepEqual(heroImage('segmented'),heroImage('segmented',{shellAmount:1.4}));
 assert.notDeepEqual(heroImage('segmented',{shellAmount:1.4}),heroImage('segmented',{shellAmount:1.4,shellContactAngle:Math.PI/2}));
 assert.deepEqual(heroImage('segmented',{shellReleaseAge:2},false),heroImage('segmented',{},false));
 assert.deepEqual(heroImage('chamfer',{shellGlanceAge:0},false),heroImage('chamfer',{shellGlanceAge:5},false));
});

test('shop policies show exact recoil/storage/accepted return, cap and stable reduced-motion states',()=>{
 near(armorShellStudy('chamfer',1100).outgoing,24.4);
 const charged=armorShellStudy('segmented',1100),released=armorShellStudy('segmented',1800);
 near(charged.stored,1.4);near(released.returned,1.4);near(released.nextSpeed,25.4);
 assert.equal(ARMOR_SHELL.lifetime,45);
 for(const id of ['chamfer','segmented']){
  assert.deepEqual(armorShellStudy(id,0,false),armorShellStudy(id,3000,false));
  const image=(time,motion=true)=>{const canvas=createCanvas(480,300),c=canvas.getContext('2d');c.translate(1,2);const before=c.getTransform();
   drawArmorShellStudy(c,480,300,{study:shopStudy(ITEMS.find(i=>i.id===id),time,motion),equipment:{body:id}});
   assert.deepEqual(c.getTransform(),before);return canvas.toBuffer('image/png');};
  assert.notDeepEqual(image(0),image(1100));assert.deepEqual(image(0,false),image(3000,false));
 }
});
