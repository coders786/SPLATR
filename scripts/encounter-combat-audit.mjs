import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
import {createRun} from '../src/run.js';
import {SWORD_BUILDS} from '../src/swords.js';
import {placePlayer,stopPlayer} from '../src/physics.js';
mkdirSync('.arena/encounter-upgrade',{recursive:true});const report=[];
for(const id of ['sun','ronin','bulwark','wraith','storm'])for(const seed of [41,131,712]){
 const equipment=SWORD_BUILDS.find(b=>b.id===id).parts,r=createRun(seed,()=>{},{waveMode:true,equipment});r.state.phase='playing';r.state.invul=999999;
 try{for(let number=1;number<=10;number++){
  let ticks=0,tells=0,rushes=0,links=0,hazards=0,maxEnemies=0;
  for(;ticks<3000&&r.state.wave.phase==='combat';ticks++){
   if(ticks%24===0&&r.state.edge>0){const e=r.nearest();if(e)r.dash(r.aimAt(e,false));}
   r.tick();tells+=Number([...r.combat.enemies.values()].some(e=>e.mode==='tell'));rushes+=Number([...r.combat.enemies.values()].some(e=>e.mode==='rush'));links+=Number(r.combat.links.length>0);hazards=Math.max(hazards,r.combat.hazards.length);maxEnemies=Math.max(maxEnemies,r.combat.enemies.size);
   assert.ok(r.state.swordFx.length<=3);for(const e of r.combat.enemies.values()){const a=r.world.arena;assert.ok(e.x>=a.x+e.r-.01&&e.x<=a.x+a.w-e.r+.01);assert.ok(e.y>=a.y+e.r-.01&&e.y<=a.y+a.h-e.r+.01);}
  }
  const skippedShatter=r.state.wave.phase==='breach';if(skippedShatter){assert.equal(r.combat.enemies.size,0);assert.equal(r.skipBreach(),true);}
  const row={id,seed,number,skippedShatter,name:r.state.wave.brief.name,phase:r.state.wave.phase,ticks,tells,rushes,linkTicks:links,maxHazards:hazards,maxEnemies};report.push(row);
  if(r.state.wave.phase!=='return')break;
  assert.equal(r.combat.enemies.size,0);assert.equal(r.state.waveBuff,null);assert.equal(r.state.swordFx.length,0);
  const q=r.state.wave.platform;placePlayer(r.world,{x:q.x+150,y:q.y-24});stopPlayer(r.world);for(let i=0;i<30&&r.state.wave.phase!=='choose';i++)r.tick();assert.equal(r.state.wave.phase,'choose');
  assert.equal(r.chooseWaveBuff(r.state.wave.recommendation.id),true);
 }
 }finally{r.dispose();}
}
writeFileSync('.arena/encounter-upgrade/combat-audit.json',JSON.stringify(report,null,2));const clears=report.filter(r=>r.phase==='return').length,stalls=report.filter(r=>r.phase!=='return');console.log(JSON.stringify({fixtures:report.length,clears,stalls,notes:'Protected aim bot; milestone breaches explicitly skipped after combat. Placement only during rest. Combat operability/containment, not shatter or human balance.'},null,2));assert.equal(clears,150);assert.deepEqual(stalls,[]);assert.ok(report.some(r=>r.tells>0));assert.ok(report.some(r=>r.rushes>0));assert.ok(report.some(r=>r.linkTicks>0));assert.ok(report.some(r=>r.maxHazards>0));
