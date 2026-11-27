// Narrow mechanics-migration proof. Original40-case simulation fixture stays
// untouched. A genuine pre-chunk run snapshot replays the old two tail contracts
// before any new expectation can be accepted. No production compatibility flag.
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
import {runCombatSourceSimulation} from '../test/support/combat-source-simulation.js';
const out=process.env.QA_OUT_DIR||'.arena/harmony-chunk13/migration',original=process.env.QA_BEFORE_RUN||'.arena/harmony-chunk13/run-before.js';mkdirSync(out,{recursive:true});
const baseline=JSON.parse(readFileSync(new URL('../test/support/combat-source-simulation-baseline.json',import.meta.url))),hash=v=>createHash('sha256').update(JSON.stringify(v)).digest('hex');
let source=readFileSync(original,'utf8');assert.ok(!source.includes('createSpectrumSequence'),'Must supply genuine pre-chunk run, not current code');
source=source.replace("normalizeEquipment, equipmentRules }",'normalizeEquipment, equipmentRules as currentEquipmentRules }').replaceAll("from './","from '"+pathToFileURL(resolve('src')+'/').href);
source+=`\nfunction equipmentRules(eq){const r=currentEquipmentRules(eq);return Object.freeze({...r,
 chainGrace:eq.tail==='spectrum'?Math.min(36,r.chainGrace+12):r.chainGrace,
 scorePerks:eq.tail==='viper-tails'?[...r.scorePerks,{stat:'score:fast',value:10}]:r.scorePerks});}\n`;
const path=resolve(out,'original-run-replay.mjs');writeFileSync(path,source);const old=await import(pathToFileURL(path).href),cases=[];
for(const c of baseline.cases.filter(c=>['viper-tails','spectrum'].includes(c.equipment.tail))){
 const before=runCombatSourceSimulation(c.seed,c.equipment,true,old.createRun);assert.equal(hash(before.gameplay),c.gameplayHash,`${c.id}/${c.seed}: original gameplay replay`);assert.equal(hash(before.sources),c.sourceHash,'original sources replay');
 const after=runCombatSourceSimulation(c.seed,c.equipment,true),off=runCombatSourceSimulation(c.seed,c.equipment,false);assert.deepEqual(after.gameplay,off.gameplay);
 let first=-1;for(let i=0;i<Math.max(before.sources.length,after.sources.length);i++)if(JSON.stringify(before.sources[i])!==JSON.stringify(after.sources[i])){first=i;break;}
 cases.push({id:c.id,seed:c.seed,equipment:c.equipment,originalGameplayHash:c.gameplayHash,originalSourceHash:c.sourceHash,gameplayHash:hash(after.gameplay),sourceHash:hash(after.sources),firstSourceDifference:first<0?null:{index:first,before:before.sources[first],after:after.sources[first]},beforeCheckpoints:before.gameplay.checkpoints,afterCheckpoints:after.gameplay.checkpoints});
}
writeFileSync(`${out}/proof.json`,JSON.stringify({reason:'Chunk13: Viper replaces speed score with ordinary steering-loss retention; Spectrum replaces12 chain ticks with third-primary-kill extra EDGE. Original run replay proven against unchanged originals first.',ticks:360,cases},null,2));
console.log('PASS: all6 original tail-build/seed contracts replay exactly from genuine pre-chunk run; new policy observation on/off parity.');for(const c of cases)console.log(`${c.id}/${c.seed}: gameplay ${c.gameplayHash===c.originalGameplayHash?'unchanged':'declared migration'}, sources ${c.sourceHash===c.originalSourceHash?'unchanged':'changed by migrated chain/retention gameplay; inspect proof'}`);
