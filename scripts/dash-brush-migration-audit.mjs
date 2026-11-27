// Genuine before-source tree required. Controlled launches/convex queries isolate
// width/duration changes; this is not an uncontrolled traversal or FPS benchmark.
import assert from 'node:assert/strict';
import {existsSync,mkdirSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {createRun} from '../src/run.js';
import {placePlayer,stopPlayer} from '../src/physics.js';
const dir=process.env.QA_BEFORE_SRC||'.arena/harmony-chunk17/before-src',out=process.env.QA_OUT_DIR||'.arena/harmony-chunk17/migration';assert.ok(existsSync(`${dir}/run.js`),'Genuine pre-edit source tree required');const {createRun:beforeRun}=await import(pathToFileURL(resolve(`${dir}/run.js`)));mkdirSync(out,{recursive:true});
function scenario(makeRun,equipment,angle){
 const r=makeRun(77,()=>{},{waveMode:true,equipment});try{
  for(const e of [...r.combat.enemies.values()])r.combat.remove(e);Object.assign(r.state,{phase:'playing',opening:null,inputLock:false,invul:99999});r.state.wave.entry=0;placePlayer(r.world,{x:-350,y:-400});stopPlayer(r.world);r.world.grounded=false;
  r.combat.add({id:'sentinel',kind:'fang',x:700,y:-900,pinned:true,delay:999999});assert.equal(r.dash({x:42*Math.cos(angle),y:42*Math.sin(angle),power:1}),true);
  const velocity={...r.world.player.velocity},blade=r.state.blade,collider=r.world.player.vertices.map(p=>[p.x,p.y]),first=r.primaryGeometry();r.state.stop=1;r.tick();const geometry=r.state.sweep;
  const p=r.world.player.position,e=r.combat.add({id:'armor',kind:'bastion',x:p.x+30,y:p.y,pinned:true});e.hp=20;r.combat.contacts.add(e);r.state.stop=1;r.tick();
  return {velocity,blade,collider,first,geometry,damage:20-e.hp};
 }finally{r.dispose();}
}
const results=[];
for(const dash of ['dash-auto','dash-ink'])for(const head of ['none','samurai','viper'])for(const core of ['standard','magnet'])for(const angle of [0,Math.PI/2])for(const eyes of ['ninja','sniper']){
 const equipment={dash,head,core,eyes},before=scenario(beforeRun,equipment,angle),after=scenario(createRun,equipment,angle),ink=dash==='dash-ink',headGain=head==='samurai'&&angle===0?1.2:1,
  nearGain=core==='magnet'?1.2:1,far=Math.min(1.35,headGain*(ink?1.12:1)),near=Math.min(1.35,headGain*nearGain*(ink?1.12:1));
 assert.deepEqual(before.velocity,after.velocity);assert.deepEqual(before.collider,after.collider);assert.equal(after.blade,before.blade-(ink?1:0));assert.equal(after.damage,before.damage);
 for(const key of ['first','geometry']){assert.equal(after[key].span,before[key].span);assert.equal(after[key].closeRadius,before[key].closeRadius);assert.ok(Math.abs(after[key].halfWidth-before[key].halfWidth*far/headGain)<1e-8);assert.ok(Math.abs(after[key].halfWidth*after[key].closeWidth-before[key].halfWidth*before[key].closeWidth*near/(headGain*nearGain))<1e-8);}
 results.push({equipment,angle,before,after});
}
writeFileSync(`${out}/results.json`,JSON.stringify(results,null,2));console.log(`PASS ${results.length} genuine before/after cases: Ink width gain/old blade-time removal; explicit Samurai+Magnet near cap; unchanged launch/collider/reach/damage/near distance.`);
