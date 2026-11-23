import test from 'node:test';
import assert from 'node:assert/strict';
import {createVisualTutorial} from '../src/visual-tutorial.js';
import {createRun} from '../src/run.js';
import {PAD} from '../src/levels.js';
import {placePlayer,stopPlayer} from '../src/physics.js';
import {zoneHits} from '../src/slasher.js';
import {createCanvas} from '@napi-rs/canvas';
import {drawTutorialWall} from '../src/art/splatr-art-engine.js';

// Deterministic decisions use the same dash, collision, enemy AI and physics as
// the game. No stage advancement or success flags are set by the bot.
function exitAim(course){const q=course.visual.gateTarget,p=course.run.world.player.position,aligned=Math.abs(q.axis==='x'?p.y-q.y:p.x-q.x)<85;return course.visual.gateBroken&&aligned?{x:q.x+(q.axis==='x'?q.direction*200:0),y:q.y+(q.axis==='y'?q.direction*200:0)}:q;}
function decide(course,i){
 const r=course.run,p=r.world.player.position;if(i%35!==0)return;
 let target;
 if(course.stage===0)target=course.visual.gateReady?exitAim(course):[...r.combat.enemies.values()][1]||[...r.combat.enemies.values()][0];
 if(course.stage===1){if(!course.visual.gateReady)r.dash({x:42,y:0,power:1});else target=exitAim(course);}
 if(course.stage===2){const e=r.combat.enemies.get('tutorial/rift');
  if(!course.visual.dodged&&e?.mode==='tell'&&zoneHits(e.attackZone,p,p)){const dx=p.x-e.attackZone.x,dy=p.y-e.attackZone.y,d=Math.hypot(dx,dy);target={x:p.x+(d>20?dx/d:0)*250,y:p.y+(d>20?dy/d:-1)*250};}
  else if(course.visual.dodged)target=course.visual.gateReady?exitAim(course):[...r.combat.enemies.values()][0];
 }
 if(course.stage===3)target=course.visual.gateReady?exitAim(course):[...r.combat.enemies.values()][0];
 if(target)r.dash(r.aimAt(target,false));
}
function reach(course,stage,limit=2500){for(let i=0;i<limit&&course.stage<stage;i++){decide(course,i);course.run.tick();course.tick();}assert.equal(course.stage,stage);}

test('four physical rooms require blade-opened gates and actual doorway crossings',()=>{
 for(const seed of [1,11,41]){
  const events=[],course=createVisualTutorial(seed,(type,data)=>events.push({type,data})),r=course.run;
  try{
   assert.equal(course.stage,0);assert.deepEqual([...r.combat.enemies.values()].map(e=>e.kind),['fang','fang','fang']);
   assert.equal(r.world.engine.world.bodies.filter(b=>b.label==='tutorial-wall').length,7);
   assert.equal(r.world.engine.world.bodies.filter(b=>b.label==='tutorial-gate').length,1);
   assert.ok(r.dash(r.aimAt([...r.combat.enemies.values()][1],false)));
   for(let i=0;i<120&&!course.visual.gateReady;i++){r.tick();course.tick();}
   assert.equal(course.visual.gateReady,true);assert.equal(events.filter(e=>e.type==='cut'&&e.data.entityId?.startsWith('tutorial/rack/')).length,3);assert.equal(r.state.shots,1);
   let previous=course.stage,transitions=[];
   for(let i=0;i<3000&&course.stage<4;i++){
    decide(course,i);const before={...r.world.player.position};r.tick();course.tick();
    if(course.stage!==previous){const after=r.world.player.position;assert.ok(Math.hypot(after.x-before.x,after.y-before.y)<80,'crossing never teleports the cube');transitions.push({stage:course.stage,x:after.x,y:after.y});previous=course.stage;}
   }
   assert.deepEqual(transitions.map(t=>t.stage),[1,2,3,4]);
   assert.ok(transitions[0].x>40);assert.ok(transitions[1].y< -515);assert.ok(transitions[2].x< -40);assert.ok(transitions[3].y< -1135);
   assert.ok(events.some(e=>e.type==='bank'&&e.data.nx<-.5));assert.ok(events.some(e=>e.type==='tutorialDodge'));
   assert.equal(events.filter(e=>e.type==='armor'&&e.data.kind==='crown').length,2);assert.equal(events.filter(e=>e.type==='cut'&&e.data.kind==='crown').length,1);
   assert.equal(r.world.engine.world.bodies.filter(b=>b.label==='tutorial-gate').length,0);
   for(let i=0;i<45;i++){r.tick();course.tick();}assert.equal(course.finished,true);assert.equal(r.state.hp,3);assert.equal(r.state.phase,'playing');
  }finally{course.dispose();}
 }
});

test('premature cuts and standing in a real Rift strike do not count as a dodge',()=>{
 const events=[],course=createVisualTutorial(1,(type,data)=>events.push({type,data})),r=course.run;
 try{
  reach(course,2);assert.equal(r.combat.enemies.has('tutorial/fang'),false);const fang=r.combat.enemies.get('tutorial/rift');
  placePlayer(r.world,{x:fang.x+65,y:fang.y});stopPlayer(r.world);assert.ok(r.dash(r.aimAt(fang,false)));
  for(let i=0;i<25;i++){r.tick();course.tick();}
  assert.equal(fang.hp,1);assert.ok(r.combat.enemies.has(fang.id));assert.equal(course.visual.dodged,false);assert.ok(events.some(e=>e.type==='tutorialBump'));
  placePlayer(r.world,{x:600,y:-700});stopPlayer(r.world);r.state.blade=0;
  let observed=false,resolved=false,shotFired=false;for(let i=0;i<900;i++){
   stopPlayer(r.world);r.tick();course.tick();const e=r.combat.enemies.get('tutorial/rift');
   if(e?.mode==='tell'&&zoneHits(e.attackZone,r.world.player.position,r.world.player.position)){observed=true;if(!shotFired){shotFired=r.dash({x:0,y:-10,power:.25});}}
   if(observed&&e?.mode==='recover'){resolved=true;break;}
  }
  assert.ok(observed&&resolved&&shotFired,'real warning and unsuccessful dash resolved');assert.equal(course.visual.dodged,false);assert.equal(course.stage,2);assert.equal(r.state.hp,3);
  assert.equal(events.some(e=>e.type==='tutorialDodge'),false);assert.ok(course.visual.dodgeFeedback>0,'missed warning has explicit retry feedback');
 }finally{course.dispose();}
});

test('an unlocked solid gate waits for a real blade contact',()=>{
 const course=createVisualTutorial(20),r=course.run;
 try{
  for(const e of [...r.combat.enemies.values()])r.combat.remove(e);
  for(let i=0;i<20;i++){r.tick();course.tick();}
  assert.equal(course.visual.gateReady,true);assert.equal(course.stage,0);
  assert.equal(r.world.engine.world.bodies.filter(b=>b.label==='tutorial-gate').length,1);
  for(let i=0;i<300&&course.stage===0;i++){if(i%35===0)r.dash(r.aimAt(course.visual.gateTarget,false));r.tick();course.tick();}
  assert.equal(course.stage,1);assert.ok(course.visual.gate);
 }finally{course.dispose();}
});

test('replaying the course never mutates the shared normal-run launch pad',()=>{
 const original={...PAD};
 for(let i=0;i<3;i++){
  const course=createVisualTutorial(i);assert.deepEqual(PAD,original);assert.equal(course.run.world.geometry[0].x,original.x-400);course.dispose();
 }
 const normal=createRun(8,()=>{},{waveMode:true,controlPractice:true});try{assert.deepEqual(PAD,original);assert.equal(normal.world.geometry[0].x,original.x);}finally{normal.dispose();}
});

test('a locked divider blocks a real dash before the rack is cleared',()=>{
 const course=createVisualTutorial(5),r=course.run;
 try{placePlayer(r.world,{x:-150,y:-170});stopPlayer(r.world);assert.ok(r.dash({x:42,y:0,power:1}));for(let i=0;i<60;i++){r.tick();course.tick();}assert.ok(r.world.player.position.x<0);assert.equal(course.stage,0);assert.equal(course.visual.gateBroken,false);}
 finally{course.dispose();}
});

test('a real connected cut protects that same collision batch, but not a later attack',()=>{
 for(const kind of ['fang','prism','bastion','crown']){
  const r=createRun(12,()=>{},{waveMode:true,controlPractice:true});try{
   r.state.phase='playing';r.state.wave.entry=0;r.state.invul=0;placePlayer(r.world,{x:0,y:-300});stopPlayer(r.world);
   const e=r.combat.add({id:'target',kind,x:0,y:-300,pinned:true,wavePlaced:true});r.state.blade=10;r.state.shots=1;r.combat.contacts.add(e);
   const p=r.world.player.position;const ring=()=>({kind:'ring',source:'pulse',x:p.x-20,y:p.y,px:p.x-20,py:p.y,age:0,life:30,radius:20,previousRadius:20});
   r.combat.hazards.push(ring());r.tick();assert.ok(e.hp<({fang:1,prism:1,bastion:2,crown:3}[kind]),kind);assert.equal(r.state.hp,3,`${kind}: actual cut + hazard`);
   r.state.blade=0;r.state.parry=0;r.state.invul=0;r.combat.hazards.push(ring());r.tick();assert.equal(r.state.hp,2,`${kind}: separate later hazard remains dangerous`);
  }finally{r.dispose();}
 }
});

test('stencil drawing restores state and works with all four real stages',()=>{
 for(let stage=0;stage<4;stage++){const ctx=createCanvas(390,680).getContext('2d');ctx.globalAlpha=.7;const transform=ctx.getTransform();drawTutorialWall(ctx,390,680,{stage,wallAlpha:.22});assert.equal(ctx.globalAlpha,.7);assert.deepEqual(ctx.getTransform(),transform);assert.ok(ctx.getImageData(0,0,390,680).data.some(v=>v!==0));}
});
