import test from 'node:test';
import assert from 'node:assert/strict';
import {createTeachingSession} from '../src/teaching.js';
import {enemyAttackZone,drawEnemyZone} from '../src/art/splatr-art-engine.js';
import {zoneHits} from '../src/slasher.js';
import {placePlayer,stopPlayer} from '../src/physics.js';
import {createCanvas} from '@napi-rs/canvas';

const kinds=['fork','bastion','rift','well'];
function pointIn(zone){if(zone.radius)return{x:zone.x,y:zone.y};const poly=zone.polygons[0];return{x:poly.reduce((n,p)=>n+p.x,0)/poly.length,y:poly.reduce((n,p)=>n+p.y,0)/poly.length};}
function getRealZone(kind){
 const events=[],s=createTeachingSession({scenario:kind,emit:(type,data)=>events.push({type,data})});
 for(let i=0;i<300&&!s.waiting;i++)s.tick();assert.equal(s.waiting,true,`${kind} tell`);
 const e=[...s.run.combat.enemies.values()][0],zone=e.attackZone;assert.ok(zone);assert.ok(Object.isFrozen(zone));
 assert.ok(!s.run.combat.hazards.some(h=>h.kind==='zone'),'no damage during tell');
 placePlayer(s.run.world,{x:-500,y:-500});stopPlayer(s.run.world);s.continueStep();
 for(let i=0;i<300&&!s.waiting;i++)s.tick();assert.equal(s.waiting,true,`${kind} strike`);
 const hazard=s.run.combat.hazards.find(h=>h.kind==='zone');assert.ok(hazard);assert.equal(hazard.zone,zone,'same locked geometry is the live hitbox');
 return {s,e,zone,hazard,events};
}
test('all new attacks have a real warning, matching active hitbox and recovery',()=>{
 for(const kind of kinds){const {s,e,zone,hazard}=getRealZone(kind);assert.equal(e.mode,'recover');assert.equal(hazard.sourceId,e.id);assert.equal(hazard.attackId,e.attackId);assert.ok(zoneHits(zone,pointIn(zone),pointIn(zone)));s.dispose();}
});
test('zone collision handles safe gaps and high-speed swept crossings',()=>{
 const fork=enemyAttackZone('fork',0,0,0,31),b=enemyAttackZone('bastion',0,0,0,41),rift=enemyAttackZone('rift',0,0),well=enemyAttackZone('well',0,0);
 assert.equal(zoneHits(fork,{x:80,y:80},{x:80,y:80},0),false,'gap between arms is safe');
 assert.equal(zoneHits(fork,{x:80,y:90},{x:80,y:-90},0),true,'fast crossing hits');
 assert.equal(zoneHits(b,{x:-40,y:0},{x:-40,y:0},0),false,'behind shield is safe');
 assert.equal(zoneHits(b,{x:220,y:0},{x:0,y:0},0),true,'fast crossing hits wedge');
 assert.equal(zoneHits(rift,{x:110,y:0},{x:110,y:0},0),false);
 assert.equal(zoneHits(well,{x:140,y:0},{x:-140,y:0},0),true);
 const turned=enemyAttackZone('bastion',0,0,Math.PI/2,41);assert.equal(zoneHits(turned,{x:0,y:100},{x:0,y:100},0),true);assert.equal(zoneHits(turned,{x:100,y:0},{x:100,y:0},0),false);
});
test('genuine zone hits carry source, attack identity and correct cause for hurt, fatal and shield',()=>{
 for(const kind of kinds)for(const outcome of ['hurt','break','waveBlock']){
  const {s,hazard,events}=getRealZone(kind),r=s.run;r.state.invul=0;r.state.stop=0;r.state.blade=0;r.state.parry=0;
  if(outcome==='break')r.state.hp=1;if(outcome==='waveBlock')r.state.waveShield=1;
  placePlayer(r.world,pointIn(hazard.zone));stopPlayer(r.world);r.tick();
  const event=events.find(e=>e.type===outcome);assert.ok(event,`${kind} ${outcome}`);
  assert.equal(event.data.attack.kind,({fork:'fork-swipe',bastion:'bastion-slam',rift:'rift-strike',well:'well-compression'})[kind]);
  assert.equal(event.data.attack.sourceId,hazard.sourceId);assert.equal(event.data.attack.attackId,hazard.attackId);assert.ok(hazard.spent);
  s.dispose();
 }
});
test('cutting the source cancels the active zone; a spent zone cannot hit twice',()=>{
 for(const kind of kinds){const {s,e,hazard}=getRealZone(kind);let hits=0;
  placePlayer(s.run.world,pointIn(hazard.zone));stopPlayer(s.run.world);
  s.run.combat.attacks(1,()=>hits++);s.run.combat.attacks(1,()=>hits++);assert.equal(hits,1,kind);
  s.run.combat.interrupt(e);assert.ok(!s.run.combat.hazards.includes(hazard));assert.equal(e.mode,'idle');s.dispose();
 }
});
test('warnings and live zones have distinct readable shapes, and preserve canvas state',()=>{
 const signatures=new Set();for(const kind of kinds){const z=enemyAttackZone(kind,200,200,0,40),c=createCanvas(400,400),ctx=c.getContext('2d'),before=ctx.getTransform();drawEnemyZone(ctx,z,false,.5);assert.deepEqual(ctx.getTransform(),before);const warn=c.toBuffer('image/png');ctx.clearRect(0,0,400,400);drawEnemyZone(ctx,z,true,.5);const active=c.toBuffer('image/png');assert.notDeepEqual(warn,active);signatures.add(warn.toString('base64'));}assert.equal(signatures.size,4);
});

test('a real blade cut interrupts Bastion before its active slam can hurt',()=>{
 const {s,e,hazard,events}=getRealZone('bastion'),r=s.run;
 r.state.invul=0;r.state.stop=0;placePlayer(r.world,{x:e.x-55,y:e.y});stopPlayer(r.world);
 assert.equal(r.dash({x:30,y:0,power:1}),true);r.tick();
 assert.ok(events.some(x=>x.type==='armor'));assert.equal(e.hp,1);assert.ok(!r.combat.hazards.includes(hazard));assert.equal(r.state.hp,3);s.dispose();
});

test('new attack zones do not advance or hit during player hitstop',()=>{
 const {s,hazard}=getRealZone('well'),r=s.run;placePlayer(r.world,pointIn(hazard.zone));stopPlayer(r.world);r.state.invul=0;r.state.blade=0;r.state.parry=0;r.state.stop=3;
 const age=hazard.age,hp=r.state.hp;for(let i=0;i<3;i++)r.tick();assert.equal(hazard.age,age);assert.equal(r.state.hp,hp);r.tick();assert.equal(r.state.hp,hp-1);s.dispose();
});

test('shared threat budget counts a lingering volley once and defers new attacks',async()=>{
 const {createPhysics,destroyPhysics}=await import('../src/physics.js');const {createCombat}=await import('../src/slasher.js');
 const w=createPhysics({spawn:{x:0,y:0}}),c=createCombat(w);
 try{
  const crown=c.add({kind:'crown',id:'crown',x:220,y:0,home:'lab',delay:0,wavePlaced:true});
  const pulse=c.add({kind:'pulse',id:'pulse',x:-220,y:0,home:'lab',delay:0,wavePlaced:true});
  c.move(1,1);assert.equal(crown.mode,'tell');assert.equal(pulse.mode,'idle');
  for(let i=0;i<84;i++)c.move(1,1);assert.equal(c.hazards.filter(h=>h.source==='crown').length,10);
  const ids=new Set(c.hazards.map(h=>h.attackId));assert.equal(ids.size,1,'one Crown volley is one threat');
  for(let i=0;i<30;i++){c.move(1,1);c.attacks(1,()=>{});assert.equal(pulse.mode,'idle','lingering needles reserve the early-wave threat slot');}
  c.hazards.length=0;for(let i=0;i<100&&pulse.mode==='idle';i++)c.move(1,1);assert.equal(pulse.mode,'tell','a deferred attack eventually gets a turn');
 }finally{c.dispose();destroyPhysics(w);}
});
