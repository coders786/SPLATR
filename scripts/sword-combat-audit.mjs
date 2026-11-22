import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
import {createRun} from '../src/run.js';
import {SWORD_BUILDS} from '../src/swords.js';
const results=[];mkdirSync('.arena/swords',{recursive:true});
for(const b of SWORD_BUILDS)for(const seed of [41,131,712]){
 const r=createRun(seed,()=>{},{waveMode:true,equipment:b.parts});r.state.phase='playing';r.state.invul=999999;
 let ticks=0,peakFx=0;try{
  for(;ticks<1800&&r.state.wave.phase==='combat';ticks++){
   if(ticks%24===0&&r.state.edge>0){const target=r.nearest();if(target)r.dash(r.aimAt(target,false));}
   r.tick();const p=r.world.player.position;
   assert.ok(Number.isFinite(p.x)&&Number.isFinite(p.y));assert.ok(Number.isFinite(r.state.score));assert.ok(r.state.swordFx.length<=3);peakFx=Math.max(peakFx,r.state.swordFx.length);
   if(r.state.sword.family==='pulse')assert.ok(r.state.swordCharge>=0&&r.state.swordCharge<=r.state.sword.chargeMax);
   for(const e of r.combat.enemies.values()){assert.ok(e.x>=r.world.arena.x+e.r-.01&&e.x<=r.world.arena.x+r.world.arena.w-e.r+.01);assert.ok(e.y>=r.world.arena.y+e.r-.01&&e.y<=r.world.arena.y+r.world.arena.h-e.r+.01);}
  }
  assert.ok(r.state.kills>0,`${b.id} never connects`);results.push({id:b.id,seed,ticks,kills:r.state.kills,remaining:r.combat.enemies.size,phase:r.state.wave.phase,peakFx});
 }finally{r.dispose();}
}
writeFileSync('.arena/swords/combat-audit.json',JSON.stringify(results,null,2));console.log(`PASS ${results.length} bounded real-combat fixtures / all 17 signatures / three seeds; ${results.filter(r=>r.phase==='return').length} first waves cleared by simple aim bot (not human balance evidence)`);
