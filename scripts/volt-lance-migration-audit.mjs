// Genuine before-source tree required. Controlled launches/convex queries isolate
// declared field/score changes; this is not an uncontrolled traversal or FPS benchmark.
import assert from 'node:assert/strict';
import {existsSync,mkdirSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import Matter from 'matter-js';
import {createRun} from '../src/run.js';
import {placePlayer,stopPlayer} from '../src/physics.js';
const dir=process.env.QA_BEFORE_SRC||'.arena/harmony-chunk22/before-src',out=process.env.QA_OUT_DIR||'.arena/harmony-chunk22/migration';assert.ok(existsSync(`${dir}/run.js`),'Genuine pre-edit source tree required');const {createRun:beforeRun}=await import(pathToFileURL(resolve(`${dir}/run.js`)));mkdirSync(out,{recursive:true});
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
for(const dash of ['dash-auto','dash-ink','dash-fire','dash-lightning','dash-ice','dash-water','dash-void','dash-echo'])for(const head of ['none','samurai','viper'])for(const core of ['standard','magnet','time','grav'])for(const angle of [0,Math.PI/2])for(const eyes of ['ninja','sniper']){
 const equipment={dash,head,core,eyes,pointer:'pointer-cross'},before=scenario(beforeRun,equipment,angle),after=scenario(createRun,equipment,angle);
 if(dash==='dash-lightning'){for(const k of ['x','y'])assert.ok(Math.abs(after.velocity[k]-before.velocity[k]*1.12)<1e-7);}else assert.deepEqual(before.velocity,after.velocity);assert.deepEqual(before.collider,after.collider);assert.equal(after.blade,before.blade);assert.equal(after.damage,before.damage);
 for(const key of ['first','geometry']){assert.equal(after[key].span,before[key].span);assert.equal(after[key].closeRadius,before[key].closeRadius);assert.ok(Math.abs(after[key].halfWidth-before[key].halfWidth*(dash==='dash-lightning'?.85:1))<1e-8);assert.ok(Math.abs(after[key].halfWidth*after[key].closeWidth-before[key].halfWidth*before[key].closeWidth*(dash==='dash-lightning'?.85:1))<1e-8);}
 assert.ok(Math.abs(after.focusCost-before.focusCost)<1e-10,'focus cost remains unchanged');
 results.push({equipment,angle,before,after});
}
writeFileSync(`${out}/results.json`,JSON.stringify(results,null,2));console.log(`PASS ${results.length} genuine before/after cases: protected launch/collider/damage/reach/focus across8dashes; only Volt gains12% ordinary launch and15% narrower cut.`);



const {equipmentRules}=await import('../src/equipment.js'),{perkScoreMultiplier}=await import('../src/part-perks.js'),oldRules=(await import(pathToFileURL(resolve(`${dir}/equipment.js`)))).equipmentRules,oldScore=(await import(pathToFileURL(resolve(`${dir}/part-perks.js`)))).perkScoreMultiplier;
const scores=[];
for(const body of ['paper','gold','obsidian'])for(const world of ['twilight','foundry'])for(const speed of [0,17.99,18,42]){
 const eq={dash:'dash-lightning',body,world},b=oldScore(oldRules(eq).scorePerks,{speed,air:true,kind:'bastion'}),a=perkScoreMultiplier(equipmentRules(eq).scorePerks,{speed,air:true,kind:'bastion'}),control=oldScore(oldRules({...eq,dash:'dash-auto'}).scorePerks,{speed,air:true,kind:'bastion'});assert.equal(a,control);assert.ok(b>=a);scores.push({eq,speed,before:b,after:a});
}
writeFileSync(`${out}/score-results.json`,JSON.stringify(scores,null,2));console.log(`PASS ${scores.length} genuine capped speed-score removals; unrelated rewards remain.`);
function fast(makeRun,core,angle,hyper){
 const r=makeRun(77,()=>{},{waveMode:true,equipment:{dash:'dash-lightning',core}});try{
  for(const e of [...r.combat.enemies.values()])r.combat.remove(e);Object.assign(r.state,{phase:'playing',opening:null,inputLock:false,invul:99999,hyper});r.state.wave.entry=0;placePlayer(r.world,{x:-350,y:-400});stopPlayer(r.world);r.world.grounded=false;r.combat.add({id:'sentinel',kind:'fang',x:700,y:-900,pinned:true,delay:999999});
  const {Body}=Matter;Body.setVelocity(r.world.player,{x:100*Math.cos(angle),y:100*Math.sin(angle)});r.world.playerCeiling=140;r.dash({x:30*Math.cos(angle),y:30*Math.sin(angle),power:30/42});
  const rows=[];for(let i=0;i<3;i++){r.state.stop=0;r.state.blade=0;r.tick();rows.push({p:{...r.world.player.position},v:{...r.world.player.velocity},ceiling:r.world.playerCeiling});}return rows;
 }finally{r.dispose();}
}

const protectedFlight=[];
for(const core of ['standard','time','grav','riot','echo','glass','magnet'])for(const angle of [0,Math.PI/2,Math.PI,-Math.PI/2])for(const hyper of [false,true]){const before=fast(beforeRun,core,angle,hyper),after=fast(createRun,core,angle,hyper);assert.deepEqual(after,before);protectedFlight.push({core,angle,hyper,before,after});}
writeFileSync(`${out}/protected-flight.json`,JSON.stringify(protectedFlight,null,2));console.log(`PASS ${protectedFlight.length} genuine faster-momentum/Hyper trajectories exactly preserved across7cores/four bearings.`);
