// Requires the genuine pre-edit run/art/perk snapshots in a matching source tree.
// Controlled contacts isolate this intentional migration; not a native playthrough.
import assert from 'node:assert/strict';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {mkdirSync,writeFileSync,existsSync} from 'node:fs';
import {createRun} from '../src/run.js';
import {placePlayer,stopPlayer} from '../src/physics.js';
const dir=process.env.QA_BEFORE_SRC||'.arena/harmony-chunk16/before-src',out=process.env.QA_OUT_DIR||'.arena/harmony-chunk16/migration';
assert.ok(existsSync(`${dir}/run.js`),'Genuine before-source tree required');const {createRun:beforeRun}=await import(pathToFileURL(resolve(`${dir}/run.js`)));mkdirSync(out,{recursive:true});
function scenario(makeRun,{power=1,eyes='sniper',head='none',drive=false}={}){
 const events=[],r=makeRun(77,(type,data)=>events.push({type,data}),{waveMode:true,equipment:{eyes,head}});
 try{
  for(const e of [...r.combat.enemies.values()])r.combat.remove(e);
  Object.assign(r.state,{phase:'playing',opening:null,inputLock:false,invul:99999});r.state.wave.entry=0;
  placePlayer(r.world,{x:-350,y:-400});stopPlayer(r.world);r.world.grounded=false;
  r.combat.add({id:'sentinel',kind:'fang',x:700,y:-900,pinned:true,delay:999999});assert.equal(r.dash({x:42*power,y:0,power}),true);
  if(drive)r.state.drive=100;
  const velocity={...r.world.player.velocity},contacts=[];
  for(const [id,kind,hp] of [['boss','monolith',20],['first','bastion',20],['second','crown',20],['score','fang',1]]){
   const p=r.world.player.position,e=r.combat.add({id,kind,x:p.x+30,y:p.y,pinned:true,delay:999999});e.hp=hp;r.combat.contacts.add(e);r.state.stop=1;r.tick();contacts.push({id,damage:hp-e.hp});
  }
  return {velocity,contacts,score:r.state.score,width:r.state.sweep.halfWidth,events:events.filter(e=>e.type==='precisionPuncture').map(e=>({type:e.type,entityId:e.data.entityId,total:e.data.total}))};
 }finally{r.dispose();}
}
const results=[];
for(const eyes of ['ninja','sniper'])for(const power of [.899,.9,1])for(const head of ['none','crown'])for(const drive of [false,true]){
 const options={eyes,power,head,drive},before=scenario(beforeRun,options),after=scenario(createRun,options),eligible=eyes==='sniper'&&power>=.9;
 assert.deepEqual(before.velocity,after.velocity,'no launch/steering change');
 for(let i=0;i<before.contacts.length;i++)assert.equal(after.contacts[i].damage,before.contacts[i].damage+(eligible&&i===1?1:0));
 assert.ok(Math.abs(after.width-before.width*(eligible?.9:1))<1e-8);
 if(eligible){assert.equal(after.events.length,1);assert.ok(after.score<before.score,'old full-power score removed');}
 else assert.deepEqual(after,before,'all other controlled outcomes identical');
 results.push({options,before,after});
}
writeFileSync(`${out}/results.json`,JSON.stringify(results,null,2));console.log(`PASS ${results.length} genuine before/after controlled cases: only declared Sniper first armor +1, width ×.9 and removed score; boss/second victim/launch unchanged.`);
