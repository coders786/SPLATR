// Genuine before-source tree required. Controlled launches/convex queries isolate
// declared field/score changes; this is not an uncontrolled traversal or FPS benchmark.
import assert from 'node:assert/strict';
import {existsSync,mkdirSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {createRun} from '../src/run.js';
import {placePlayer,stopPlayer} from '../src/physics.js';
const dir=process.env.QA_BEFORE_SRC||'.arena/harmony-chunk21/before-src',out=process.env.QA_OUT_DIR||'.arena/harmony-chunk21/migration';assert.ok(existsSync(`${dir}/run.js`),'Genuine pre-edit source tree required');const {createRun:beforeRun}=await import(pathToFileURL(resolve(`${dir}/run.js`)));mkdirSync(out,{recursive:true});
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
 assert.deepEqual(before.velocity,after.velocity);assert.deepEqual(before.collider,after.collider);assert.equal(after.blade,before.blade);assert.equal(after.damage,before.damage);
 for(const key of ['first','geometry']){assert.equal(after[key].span,before[key].span);assert.equal(after[key].closeRadius,before[key].closeRadius);assert.ok(Math.abs(after[key].halfWidth-before[key].halfWidth)<1e-8);assert.ok(Math.abs(after[key].halfWidth*after[key].closeWidth-before[key].halfWidth*before[key].closeWidth)<1e-8);}
 assert.ok(Math.abs(after.focusCost-before.focusCost)<1e-10,'focus cost remains unchanged');
 results.push({equipment,angle,before,after});
}
writeFileSync(`${out}/results.json`,JSON.stringify(results,null,2));console.log(`PASS ${results.length} genuine before/after cases: unchanged launch, collider, direct damage, widths, reach and focus across all eight dashes including Echo/Ember/Frost/Void.`);


// Genuine before/post grace migration: other loadout bonuses retain the cap.
const {equipmentRules}=await import('../src/equipment.js'),oldRules=(await import(pathToFileURL(resolve(`${dir}/equipment.js`)))).equipmentRules;
const grace=[];
for(const head of ['none','neko','coil'])for(const body of ['paper','lava','obsidian'])for(const slash of ['razor','comic','katana']){
 const eq={head,body,slash,dash:'dash-echo'},a=oldRules(eq),b=equipmentRules(eq),base=oldRules({...eq,dash:'dash-auto'});assert.equal(b.chainGrace,base.chainGrace);assert.equal(a.chainGrace,Math.min(36,base.chainGrace+12));grace.push({eq,before:a.chainGrace,after:b.chainGrace});
}
writeFileSync(`${out}/grace-results.json`,JSON.stringify(grace,null,2));console.log(`PASS ${grace.length} genuine old-grace replacements; unrelated loadout grace and cap preserved.`);

// Real physics records before actors enter the path. Old and new launch and
// movement are identical; only the admitted replay may chip their armor.
function replayScenario(makeRun,core,angle){
 const events=[],r=makeRun(77,(type,data)=>events.push({type,data}),{waveMode:true,equipment:{dash:'dash-echo',core}});try{
  for(const e of [...r.combat.enemies.values()])r.combat.remove(e);Object.assign(r.state,{phase:'playing',opening:null,inputLock:false,invul:99999});r.state.wave.entry=0;placePlayer(r.world,{x:-350,y:-400});stopPlayer(r.world);r.world.grounded=false;r.combat.add({id:'sentinel',kind:'fang',x:700,y:-900,pinned:true,delay:999999});
  const shot=()=>{r.state.inputLock=false;r.state.edge=3;assert.equal(r.dash({x:30*Math.cos(angle),y:30*Math.sin(angle),power:30/42}),true);};shot();r.state.blade=0;r.state.stop=0;r.tick();
  const add=(id,d,side=0)=>r.combat.add({id,kind:'bastion',x:-350+d*Math.cos(angle)-side*Math.sin(angle),y:-400+d*Math.sin(angle)+side*Math.cos(angle),hp:3,delay:999999});
  const a=add('a',10),b=add('b',25),safe=add('safe',200,120);shot();shot();r.world.clock=12;r.state.stop=1;r.state.blade=0;r.combat.contacts.clear();r.tick();
  return {a:a.hp,b:b.hp,safe:safe.hp,stored:events.filter(e=>e.type==='repriseStored').length,busy:events.filter(e=>e.type==='repriseBusy').length,fired:events.filter(e=>e.type==='repriseFired').length,velocity:{...r.world.player.velocity}};
 }finally{r.dispose();}
}
const replays=[];
for(const core of ['standard','time','grav','riot','echo','glass','magnet'])for(const angle of [0,Math.PI/2,Math.PI,-Math.PI/2]){
 const before=replayScenario(beforeRun,core,angle),after=replayScenario(createRun,core,angle);assert.equal(before.a,3);assert.equal(before.b,3);assert.equal(after.a,2);assert.equal(after.b,2);assert.equal(after.safe,3);assert.equal(after.stored,1);assert.equal(after.busy,2);assert.equal(after.fired,1);assert.deepEqual(after.velocity,before.velocity);replays.push({core,angle,before,after});
}
writeFileSync(`${out}/replay-results.json`,JSON.stringify(replays,null,2));console.log(`PASS ${replays.length} genuine actual-physics replay comparisons:all7cores/four bearings; only two old-path armor units, safe off-path neighbor, one source and no overwritten/queued attack.`);
