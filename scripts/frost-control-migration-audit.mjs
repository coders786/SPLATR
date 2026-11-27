// Genuine before-source tree required. Controlled launches/convex queries isolate
// width/duration changes; this is not an uncontrolled traversal or FPS benchmark.
import assert from 'node:assert/strict';
import {existsSync,mkdirSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {createRun} from '../src/run.js';
import {placePlayer,stopPlayer} from '../src/physics.js';
const dir=process.env.QA_BEFORE_SRC||'.arena/harmony-chunk19/before-src',out=process.env.QA_OUT_DIR||'.arena/harmony-chunk19/migration';assert.ok(existsSync(`${dir}/run.js`),'Genuine pre-edit source tree required');const {createRun:beforeRun}=await import(pathToFileURL(resolve(`${dir}/run.js`)));mkdirSync(out,{recursive:true});
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
for(const dash of ['dash-auto','dash-fire','dash-ice'])for(const head of ['none','samurai','viper'])for(const core of ['standard','magnet','time','grav'])for(const angle of [0,Math.PI/2])for(const eyes of ['ninja','sniper']){
 const equipment={dash,head,core,eyes,pointer:'pointer-cross'},before=scenario(beforeRun,equipment,angle),after=scenario(createRun,equipment,angle),frost=dash==='dash-ice';
 assert.deepEqual(before.velocity,after.velocity);assert.deepEqual(before.collider,after.collider);assert.equal(after.blade,before.blade);assert.equal(after.damage,before.damage);
 for(const key of ['first','geometry']){assert.equal(after[key].span,before[key].span);assert.equal(after[key].closeRadius,before[key].closeRadius);assert.ok(Math.abs(after[key].halfWidth-before[key].halfWidth)<1e-8);assert.ok(Math.abs(after[key].halfWidth*after[key].closeWidth-before[key].halfWidth*before[key].closeWidth)<1e-8);}
 assert.ok(Math.abs(after.focusCost-before.focusCost*(frost?.92/.84:1))<1e-10,'only removed Frost eight-point aim discount; Pointer remains');
 results.push({equipment,angle,before,after});
}
writeFileSync(`${out}/results.json`,JSON.stringify(results,null,2));console.log(`PASS ${results.length} genuine before/after launch, collider, direct damage, geometry and focus comparisons: only Frost eight-point aim discount removed; existing Pointer remains. Includes Time/Grav and Ember regressions.`);

// Real admitted contact/AI migration, not hand-applied status or a new baseline.
const coldCases=[];
function coldScenario(makeRun,core,angle){
 const r=makeRun(77,()=>{},{waveMode:true,equipment:{dash:'dash-ice',core}});try{
  for(const e of [...r.combat.enemies.values()])r.combat.remove(e);Object.assign(r.state,{phase:'playing',opening:null,inputLock:false,invul:99999});r.state.wave.entry=0;placePlayer(r.world,{x:-350,y:-400});stopPlayer(r.world);r.world.grounded=false;
  r.combat.add({id:'sentinel',kind:'fang',x:700,y:-900,pinned:true,delay:999999});r.dash({x:30*Math.cos(angle),y:30*Math.sin(angle),power:30/42});
  const cx=-350+30*Math.cos(angle),cy=-400+30*Math.sin(angle),e=r.combat.add({id:'heavy',kind:'bastion',x:cx,y:cy,hp:10,delay:999999}),n=r.combat.add({id:'neighbor',kind:'fang',x:cx-50*Math.sin(angle),y:cy+50*Math.cos(angle),delay:999999});Object.assign(n,{mode:'tell',clock:30,span:66,aim:Math.PI});
  r.combat.contacts.add(e);r.state.stop=1;r.tick();r.state.blade=0;const hp=e.hp,origin={x:e.x,y:e.y},rows=[];
  for(let t=0;t<24;t++){r.world.clock=t;r.combat.move(1,1);r.world.clock=t+1;r.state.stop=1;r.combat.contacts.clear();r.tick();if([0,17,23].includes(t))rows.push({t:t+1,heavy:{x:e.x,y:e.y},fangClock:n.clock,fangMode:n.mode});}
  return {hp,origin,rows};
 }finally{r.dispose();}
}
for(const core of ['standard','time','grav','riot','echo','glass','magnet'])for(const angle of [0,Math.PI/2,Math.PI,-Math.PI/2]){
 const before=coldScenario(beforeRun,core,angle),after=coldScenario(createRun,core,angle);assert.equal(before.hp,after.hp);assert.deepEqual(before.origin,after.origin);
 const distance=r=>Math.hypot(r.rows[0].heavy.x-r.origin.x,r.rows[0].heavy.y-r.origin.y);assert.ok(Math.abs(distance(after)/distance(before)-.7)<1e-8);
 assert.equal(after.rows[1].fangClock,30);assert.equal(before.rows[1].fangClock,12);assert.equal(after.rows[2].fangClock,24);assert.equal(before.rows[2].fangClock,6);
 coldCases.push({core,angle,before,after});
}
writeFileSync(`${out}/cold-contact-results.json`,JSON.stringify(coldCases,null,2));console.log(`PASS ${coldCases.length} genuine primary-contact/AI comparisons: heavy first-step displacement70%, Fang attack countdown paused18 then resumes, identical direct damage.`);
