import test from 'node:test';
import assert from 'node:assert/strict';
import {ITEMS,DEFAULT_EQUIPMENT,loadEquipment,equipmentRules} from '../src/equipment.js';
import {resolvePartPerks} from '../src/part-perks.js';
import {swordProfile,SWORD_BUILDS} from '../src/swords.js';
import {shopAbility} from '../src/shop-language.js';
import {powerReadout} from '../src/power-readout.js';
import {shopGroup,shopStudy} from '../src/shop-catalog.js';
import {runCombatSourceSimulation} from './support/combat-source-simulation.js';
const slots=['eyes','dash','world'];
const choices=slot=>ITEMS.filter(x=>x.slot===slot);

test('every cosmetic choice leaves perks, rules and weapon selection unchanged for every signature build',()=>{
 for(const parts of [{},...SWORD_BUILDS.map(b=>b.parts)]){
  const eq={...DEFAULT_EQUIPMENT,...parts},rules=equipmentRules(eq),perks=resolvePartPerks(eq),sword=swordProfile(eq);
  for(const slot of slots)for(const item of choices(slot)){
   const changed={...eq,[slot]:item.id};
   assert.deepEqual(equipmentRules(changed),rules,`${slot} ${item.id}`);
   assert.deepEqual(resolvePartPerks(changed),perks,`${slot} ${item.id}`);
   assert.deepEqual(resolvePartPerks({other:item.id}),resolvePartPerks({}),`${item.id} cannot grant perks under another key`);
   assert.deepEqual(swordProfile(changed),sword,`${slot} ${item.id}`);
  }
 }
});
test('legacy owned skins and all preset selections survive migration',()=>{
 const equipped={...DEFAULT_EQUIPMENT,eyes:'sniper',dash:'dash-fire',world:'manga'};
 const data={version:1,owned:['sniper','dash-fire','manga','hypno','dash-echo','synth'],equipped,presets:[equipped,{eyes:'hypno',dash:'dash-echo',world:'synth'},null]};
 const save=loadEquipment(JSON.stringify(data));
 for(const id of data.owned)assert.ok(save.owned.includes(id));
 for(const slot of slots)assert.equal(save.equipped[slot],equipped[slot]);
 assert.deepEqual(slots.map(x=>save.presets[1][x]),['hypno','dash-echo','synth']);
 assert.deepEqual(loadEquipment(JSON.stringify(save)),save);
});
test('cosmetics are honestly described and do not preview retired abilities',()=>{
 for(const slot of slots)for(const item of choices(slot)){
  assert.equal(shopGroup(slot).id,'style');assert.equal(powerReadout(item).cosmetic,true);
  assert.match(shopAbility(item.id).effect,/look only/i);assert.match(item.detail,/Appearance only/i);
  const study=shopStudy(item,1500,true,{...DEFAULT_EQUIPMENT,[slot]:item.id});
  assert.equal(study.family,'cosmetic');assert.equal(study.perk,null);assert.equal(study.eye,undefined);assert.equal(study.dash,undefined);assert.equal(study.aim,undefined);
 }
});
test('live seeded combat produces the same simulation and sources across combined cosmetics',()=>{
 const gear={...DEFAULT_EQUIPMENT,body:'hologram',tail:'ghost',core:'echo'};
 const baseline=runCombatSourceSimulation(77,gear,true);
 for(const style of [{eyes:'sniper',dash:'dash-fire',world:'manga'},{eyes:'hypno',dash:'dash-echo',world:'synth'},{eyes:'blaze',dash:'dash-lightning',world:'foundry'}]){
  const actual=runCombatSourceSimulation(77,{...gear,...style},true);
  assert.deepEqual(actual.gameplay,baseline.gameplay,JSON.stringify(style));
  assert.deepEqual(actual.sources,baseline.sources,JSON.stringify(style));
 }
});
