/** Fixed, public practice fixtures and literal observations, never a power rating.
 * No storage, DOM, random, movement or reward writes. */
export const PRACTICE_TICKS=240;
export const PRACTICE_SCENARIOS=Object.freeze([
 {id:'lane',name:'CUT LANE',lesson:'Aligned light targets. Test forward reach and blade duration.',targets:[['fang',-170,-108],['fang',-15,-102],['fang',170,-90]]},
 {id:'armor',name:'ARMOR LINE',lesson:'Two armored targets. Compare repeat passes and plate breaking.',targets:[['bastion',-145,-108],['bastion',120,-102]]},
 {id:'spread',name:'SPLIT LANE',lesson:'Targets above and below the line. Test coverage, not just reach.',targets:[['fang',-145,-155],['fang',0,-60],['fang',170,-150]]},
].map(s=>Object.freeze({...s,targets:Object.freeze(s.targets.map(t=>Object.freeze([...t])))})));
export function practiceScenario(id){return PRACTICE_SCENARIOS.find(s=>s.id===id)||PRACTICE_SCENARIOS[0];}
export function practiceTargets(id){return practiceScenario(id).targets.map(([kind,x,y],i)=>({id:`sword-test/${i}`,kind,x,y,pinned:true,delay:999999}));}
const safe=n=>Number.isFinite(n)?Math.max(0,Math.floor(n)):0;
export function trialObservation({scenario='lane',loadout='preview',mode='manual',ticks=0,shots=0,initial=[],remaining=[]}={}){
 const live=new Map(remaining.map(e=>[e.id,e]));let kills=0,damage=0,totalHp=0;
 for(const e of initial){const hp=safe(e.hp);totalHp+=hp;const now=live.get(e.id);if(!now)kills++;damage+=Math.max(0,hp-Math.min(hp,safe(now?.hp)));}
 return Object.freeze({scenario:practiceScenario(scenario).id,loadout,mode:mode==='auto'?'auto':'manual',ticks:Math.min(PRACTICE_TICKS,safe(ticks)),shots:safe(shots),kills,targets:initial.length,damage,totalHp});
}
export function compareTrials(a,b){
 if(!a||!b||a.scenario!==b.scenario||a.mode!==b.mode||a.targets!==b.targets||a.totalHp!==b.totalHp)return null;
 return Object.freeze({kills:b.kills-a.kills,damage:b.damage-a.damage,shots:b.shots-a.shots});
}
export function trialReceipt(r){return `${r.kills}/${r.targets} TARGETS · ${r.damage}/${r.totalHp} HP · ${r.shots} LAUNCHES · ${(r.ticks/60).toFixed(1)}s`;}
