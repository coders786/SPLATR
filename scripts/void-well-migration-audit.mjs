// Genuine before-source tree required. Controlled launches/convex queries isolate
// declared field/score changes; this is not an uncontrolled traversal or FPS benchmark.
import assert from 'node:assert/strict';
import {existsSync,mkdirSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {createRun} from '../src/run.js';
import {placePlayer,stopPlayer} from '../src/physics.js';
const dir=process.env.QA_BEFORE_SRC||'.arena/harmony-chunk20/before-src',out=process.env.QA_OUT_DIR||'.arena/harmony-chunk20/migration';assert.ok(existsSync(`${dir}/run.js`),'Genuine pre-edit source tree required');const {createRun:beforeRun}=await import(pathToFileURL(resolve(`${dir}/run.js`)));mkdirSync(out,{recursive:true});
function scenario(makeRun,equipment,angle){
 const r=makeRun(77,()=>{},{waveMode:true,equipment});try{
  for(const e of [...r.combat.enemies.values()])r.combat.remove(e);Object.assign(r.state,{phase:'playing',opening:null,inputLock:false,invul:99999});r.state.wave.entry=0;placePlayer(r.world,{x:-350,y:-400});stopPlayer(r.world);r.world.grounded=false;
  r.combat.add({id:'sentinel',kind:'fang',x:700,y:-900,pinned:true,delay:999999});assert.equal(r.dash({x:42*Math.cos(angle),y:42*Math.sin(angle),power:1}),true);
  const velocity={...r.world.player.velocity},blade=r.state.blade,collider=r.world.player.vertices.map(p=>[p.x,p.y]),first=r.primaryGeometry();r.state.stop=1;r.tick();const geometry=r.state.sweep;
  const p=r.world.player.position,e=r.combat.add({id:'armor',kind:'bastion',x:p.x+30,y:p.y,pinned:true});e.hp=20;r.combat.contacts.add(e);r.state.stop=1;r.tick();
  r.state.focus=1;r.focus(true);r.state.stop=1;r.tick();const focusCost=1-r.state.focus;
  return {velocity,blade,collider,first,geometry,damage:20-e.hp,focusCost};
 }finally{r.dispose();}
}
const results=[];
for(const dash of ['dash-auto','dash-fire','dash-ice','dash-void'])for(const head of ['none','samurai','viper'])for(const core of ['standard','magnet','time','grav'])for(const angle of [0,Math.PI/2])for(const eyes of ['ninja','sniper']){
 const equipment={dash,head,core,eyes,pointer:'pointer-cross'},before=scenario(beforeRun,equipment,angle),after=scenario(createRun,equipment,angle);
 assert.deepEqual(before.velocity,after.velocity);assert.deepEqual(before.collider,after.collider);assert.equal(after.blade,before.blade);assert.equal(after.damage,before.damage);
 for(const key of ['first','geometry']){assert.equal(after[key].span,before[key].span);assert.equal(after[key].closeRadius,before[key].closeRadius);assert.ok(Math.abs(after[key].halfWidth-before[key].halfWidth)<1e-8);assert.ok(Math.abs(after[key].halfWidth*after[key].closeWidth-before[key].halfWidth*before[key].closeWidth)<1e-8);}
 assert.ok(Math.abs(after.focusCost-before.focusCost)<1e-10,'focus cost remains unchanged');
 results.push({equipment,angle,before,after});
}
writeFileSync(`${out}/results.json`,JSON.stringify(results,null,2));console.log(`PASS ${results.length} genuine before/after cases: unchanged launch, collider, direct damage, widths, reach and focus across four dashes including Ember/Frost.`);

// Real physics invokes the production field force; do not hand-apply status.
function collapseScenario(makeRun,core,angle){
 const r=makeRun(77,()=>{},{waveMode:true,equipment:{dash:'dash-void',core}});try{
  for(const e of [...r.combat.enemies.values()])r.combat.remove(e);Object.assign(r.state,{phase:'playing',opening:null,inputLock:false,invul:99999});r.state.wave.entry=0;placePlayer(r.world,{x:-350,y:-400});stopPlayer(r.world);r.world.grounded=false;r.combat.add({id:'sentinel',kind:'fang',x:700,y:-900,pinned:true,delay:999999});r.dash({x:30*Math.cos(angle),y:30*Math.sin(angle),power:30/42});
  const x=-350+30*Math.cos(angle),y=-400+30*Math.sin(angle),center=r.combat.add({id:'center',kind:'crown',x,y,hp:3,delay:999999}),inner=r.combat.add({id:'inner',kind:'fang',x:x-55*Math.sin(angle),y:y+55*Math.cos(angle),hp:1,delay:999999}),outer=r.combat.add({id:'outer',kind:'fang',x:x+95*Math.sin(angle),y:y-95*Math.cos(angle),hp:1,delay:999999});r.combat.contacts.add(center);r.state.stop=1;r.tick();r.state.blade=0;
  for(const e of [center,inner,outer])Object.assign(e,{mode:'tell',clock:200,span:200,aim:Math.PI});placePlayer(r.world,{x:-500,y:-250});stopPlayer(r.world);
  for(let i=0;i<250&&r.world.clock<19;i++){r.state.blade=0;r.state.stop=0;r.tick();}
  return {clock:r.world.clock,centerHp:center.hp,innerHp:inner.hp,outerHp:outer.hp,innerDistance:Math.hypot(inner.x-x,inner.y-y),outerDistance:Math.hypot(outer.x-x,outer.y-y)};
 }finally{r.dispose();}
}
const forces=[];
for(const core of ['standard','time','grav','riot','echo','glass','magnet'])for(const angle of [0,Math.PI/2,Math.PI,-Math.PI/2]){
 const before=collapseScenario(beforeRun,core,angle),after=collapseScenario(createRun,core,angle);assert.equal(before.centerHp-after.centerHp,1);assert.equal(before.innerHp,1);assert.equal(after.innerHp,0);assert.equal(after.outerHp,1);assert.equal(before.outerHp,1);assert.ok(after.innerDistance<before.innerDistance);assert.ok(after.outerDistance<before.outerDistance);assert.ok(after.outerDistance>28);forces.push({core,angle,before,after});
}
writeFileSync(`${out}/force-results.json`,JSON.stringify(forces,null,2));
const scoreCases=[];
const {equipmentRules}=await import('../src/equipment.js'),{perkScoreMultiplier}=await import('../src/part-perks.js'),oldRules=(await import(pathToFileURL(resolve(`${dir}/equipment.js`)))).equipmentRules,oldMult=(await import(pathToFileURL(resolve(`${dir}/part-perks.js`)))).perkScoreMultiplier;
for(const dash of ['dash-auto','dash-void'])for(const body of ['paper','gold','obsidian'])for(const world of ['twilight','foundry'])for(const kind of ['fang','bastion','crown','monolith']){
 const eq={dash,body,world},conditions={kind,air:true},before=oldMult(oldRules(eq).scorePerks,conditions),after=perkScoreMultiplier(equipmentRules(eq).scorePerks,conditions),isArmor=['bastion','crown','monolith'].includes(kind);
 if(dash==='dash-void'&&isArmor)assert.ok(after<=before&&Math.abs(before-after)<=.12000001);else assert.equal(after,before);assert.equal(after,perkScoreMultiplier(equipmentRules({...eq,dash:'dash-auto'}).scorePerks,conditions));scoreCases.push({eq,kind,before,after});
}
writeFileSync(`${out}/score-results.json`,JSON.stringify(scoreCases,null,2));console.log(`PASS ${forces.length} genuine real-contact/physics field comparisons and ${scoreCases.length} explicit capped armor-score migrations.`);
