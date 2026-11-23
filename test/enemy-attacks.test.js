import test from 'node:test';
import assert from 'node:assert/strict';
import {createTeachingSession} from '../src/teaching.js';
import {placePlayer,stopPlayer} from '../src/physics.js';
import {createCanvas} from '@napi-rs/canvas';
import {drawEnemyAttackImpact} from '../src/art/splatr-art-engine.js';
import Matter from 'matter-js';

function scene(kind,mode='idle',small=false,equipment=null){
 const events=[],session=createTeachingSession({scenario:'fang',emit:(type,data)=>events.push({type,data})}),r=session.run;
 for(const e of [...r.combat.enemies.values()])r.combat.remove(e);
 placePlayer(r.world,{x:0,y:-150});stopPlayer(r.world);r.state.invul=0;r.state.blade=0;r.state.parry=0;
 const e=r.combat.add({id:'target',kind,x:0,y:-150,home:'wave',wave:true,pinned:true,small});
 e.mode=mode;e.clock=24;e.aim=0;r.combat.contacts.add(e);
 return {session,r,e,events};
}
test('only an actively rushing Fang damages on body contact',()=>{
 for(const kind of ['fang','pulse','prism','fork','bastion','rift','well','crown'])for(const mode of ['idle','tell','rush']){
  const {session,r}=scene(kind,mode);const before=r.state.hp;r.tick();
  assert.equal(r.state.hp,before-(kind==='fang'&&mode==='rush'?1:0),`${kind} ${mode}`);session.dispose();
 }
 const {session,r}=scene('fang','rush',true);r.tick();assert.equal(r.state.hp,2,'Fork offspring are Fangs and rush in the same way');session.dispose();
});
test('active blade still cuts instead of suffering a Fang rush',()=>{
 const {session,r,e}=scene('fang','rush');r.state.blade=12;r.tick();assert.equal(r.state.hp,3);assert.equal(r.combat.enemies.has(e.id),false);session.dispose();
});
test('pulse and needle attacks still really damage and carry the actual attack kind into events',()=>{
 for(const [source,kind,expected] of [['pulse','ring','pulse-ring'],['prism','needle','prism-needle'],['crown','needle','crown-needle']]){
  const {session,r,events}=scene('bastion');const p=r.world.player.position;
  r.combat.hazards.push(kind==='ring'?{kind,source,x:p.x-20,y:p.y,px:p.x-20,py:p.y,age:0,life:30,radius:20,previousRadius:20}:{kind,source,x:p.x,y:p.y,px:p.x,py:p.y,vx:0,vy:0,angle:0,age:0,life:30});
  const old=r.state.hp;r.tick();assert.equal(r.state.hp,old-1,expected);
  assert.equal(events.find(e=>e.type==='hurt')?.data.attack.kind,expected);session.dispose();
 }
});
test('enemy impacts have nine different shapes, stable reduced-motion frames and bounded lifecycle',()=>{
 const kinds=['fang-rush','pulse-ring','prism-needle','crown-needle','prism-link','fork-swipe','bastion-slam','rift-strike','well-compression'],signatures=new Set();
 for(const kind of kinds){
  const render=(age,motion=true)=>{const c=createCanvas(150,150);const ctx=c.getContext('2d');const before=ctx.getTransform();drawEnemyAttackImpact(ctx,{x:75,y:75,attack:{kind,angle:0},age,motion});assert.deepEqual(ctx.getTransform(),before);return c;};
  const a=render(2),b=render(2);assert.deepEqual(a.toBuffer('image/png'),b.toBuffer('image/png'));signatures.add(Array.from(a.getContext('2d').getImageData(0,0,150,150).data.filter((_,i)=>i%4===3)).join(','));
  assert.deepEqual(render(18).toBuffer('image/png'),createCanvas(150,150).toBuffer('image/png'));assert.deepEqual(render(3,false).toBuffer('image/png'),render(3,false).toBuffer('image/png'));
 }
 assert.equal(signatures.size,kinds.length);
});

test('physical sensor contact follows the same Fang rush rule',()=>{
 for(const [kind,mode,damage] of [['fang','rush',1],['fang','idle',0],['bastion','idle',0]]){
  const {session,r}=scene(kind,mode);r.combat.contacts.clear();r.tick();assert.equal(r.state.hp,3-damage,`${kind} ${mode}`);session.dispose();
 }
});
test('a real linked Prism beam supplies a distinct impact event',()=>{
 const events=[],session=createTeachingSession({scenario:'link',emit:(type,data)=>events.push({type,data})}),r=session.run;let i=0;
 for(const e of r.combat.enemies.values()){e.pinned=true;e.mode='idle';e.x=i++?200:-200;e.y=0;Matter.Body.setPosition(e.body,{x:e.x,y:e.y});}
 placePlayer(r.world,{x:0,y:0});stopPlayer(r.world);
 for(let n=0;n<200&&!events.some(e=>e.type==='hurt');n++){r.combat.hazards.length=0;r.state.invul=0;session.tick();if(session.waiting)session.continueStep();}
 assert.equal(events.find(e=>e.type==='hurt')?.data.attack.kind,'prism-link');session.dispose();
});
test('fatal hits and shielded hits carry their real attack identity',()=>{
 for(const shield of [false,true]){const {session,r,events}=scene('bastion');const p=r.world.player.position;r.state.hp=1;r.state.waveShield=shield?1:0;
 r.combat.hazards.push({kind:'needle',source:'crown',x:p.x,y:p.y,px:p.x,py:p.y,vx:0,vy:0,angle:0,age:0,life:30});r.tick();
 assert.equal(events.find(e=>e.type===(shield?'waveBlock':'break'))?.data.attack.kind,'crown-needle');session.dispose();}
});

test('contact damage is decided at the collision substep, not a later mode change',()=>{
 for(const [atContact,atResolution,damage] of [['tell','rush',0],['rush','idle',1]]){
  const {session,r,e}=scene('fang',atContact);r.combat.contacts.clear();
  Matter.Events.trigger(r.world.engine,'collisionStart',{pairs:[{collision:{parentA:r.world.player,parentB:e.body}}]});
  e.mode=atResolution;e.x=400;e.y=-300;Matter.Body.setPosition(e.body,{x:e.x,y:e.y});r.tick();
  assert.equal(r.state.hp,3-damage,`${atContact} -> ${atResolution}`);session.dispose();
 }
});

test('Iron blocks a real Fang rush without a second hit from that same charge',async()=>{
 const {createRun}=await import('../src/run.js');const r=createRun(841,()=>{},{waveMode:true,controlPractice:true,equipment:{body:'iron'}});
 try{r.state.phase='playing';r.state.wave.entry=0;r.state.invul=0;placePlayer(r.world,{x:0,y:-150});stopPlayer(r.world);
  const e=r.combat.add({id:'charger',kind:'fang',x:0,y:-150,home:'wave',wave:true,pinned:true});e.mode='rush';e.clock=24;e.aim=0;
  r.tick();assert.equal(r.state.hp,3);assert.equal(r.state.guardSpent,true);assert.ok(r.state.cutImmunity.get(e.id)>0);
  // Even if pinned at a wall and re-contacted, that same charge has only spent the guard.
  placePlayer(r.world,{x:e.x,y:e.y});stopPlayer(r.world);r.tick();assert.equal(r.state.hp,3);
 }finally{r.dispose();}
});
