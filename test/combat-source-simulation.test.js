import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {SWORD_BUILDS} from '../src/swords.js';
import {runCombatSourceSimulation} from './support/combat-source-simulation.js';

const baseline = JSON.parse(readFileSync(new URL('./support/combat-source-simulation-baseline.json', import.meta.url)));
// C24/C26 intentionally replace two shell perks. Keep the original40-case
// baseline intact: only these six declared cases have new gameplay receipts.
// Their source histories still match the ORIGINAL resolver exactly.
const shellBaseline = JSON.parse(readFileSync(new URL('./support/armor-shell-simulation-baseline.json', import.meta.url)));
const tailBaseline = JSON.parse(readFileSync(new URL('./support/tail-toolkit-simulation-baseline.json', import.meta.url)));
const hash = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');

test('simulation baseline covers every full build, standard and two mixed loadouts at both seeds', () => {
  assert.equal(baseline.ticks, 360); assert.equal(baseline.cases.length, 40);
  assert.deepEqual(new Set(baseline.cases.map(c => c.id)), new Set(['standard', ...SWORD_BUILDS.map(b => b.id), 'mixed-coil-prism-anchor', 'mixed-echo-ghost']));
  assert.deepEqual(new Set(baseline.cases.map(c => c.seed)), new Set([19, 77]));
});
test('only the six declared Chamfer/Segmented cases use intentional shell-mechanics expectations', () => {
  assert.equal(shellBaseline.cases.length, 6);
  assert.deepEqual(shellBaseline.cases.map(c => `${c.id}:${c.seed}`), ['glacier:19','glacier:77','sentinel:19','sentinel:77','storm:19','storm:77']);
  for (const c of shellBaseline.cases) {
    const original=baseline.cases.find(b=>b.id===c.id&&b.seed===c.seed);
    assert.deepEqual(c.equipment, original.equipment);
    assert.equal(c.originalGameplayHash, original.gameplayHash);
    assert.equal(c.originalSourceHash, original.sourceHash);
    assert.notEqual(c.gameplayHash, original.gameplayHash, 'explicit power replacement, not a compatibility rebaseline');
    assert.equal(c.sourceHash, original.sourceHash, 'source diagnostics remain unchanged even for replaced perks');
  }
});

test('only six declared tail-build seeds carry chunk13 power migration receipts; original40 fixtures remain intact',()=>{
  const affected=baseline.cases.filter(c=>['viper-tails','spectrum'].includes(c.equipment.tail));
  assert.equal(tailBaseline.cases.length,6);assert.deepEqual(tailBaseline.cases.map(c=>`${c.id}:${c.seed}`),affected.map(c=>`${c.id}:${c.seed}`));
  for(const c of tailBaseline.cases){const original=baseline.cases.find(x=>x.id===c.id&&x.seed===c.seed);assert.deepEqual(c.equipment,original.equipment);assert.equal(c.originalGameplayHash,original.gameplayHash);assert.equal(c.originalSourceHash,original.sourceHash);}
  const changed=tailBaseline.cases.filter(c=>c.sourceHash!==c.originalSourceHash);assert.deepEqual(changed.map(c=>`${c.id}:${c.seed}`),['briar:77']);assert.match(changed[0].sourceReason,/Chain expires/);
});

for (const fixture of baseline.cases) {
  const shell=shellBaseline.cases.find(c=>c.id===fixture.id&&c.seed===fixture.seed);
  const tail=tailBaseline.cases.find(c=>c.id===fixture.id&&c.seed===fixture.seed);
  test(`${fixture.id} seed${fixture.seed}: 360 physics ticks / ${tail?'intentional tail mechanics':shell?'intentional shell mechanics':'original gameplay'} / ${tail&&tail.sourceHash!==fixture.sourceHash?'declared chain-timing diagnostics':'original diagnostics'}`, () => {
    const off = runCombatSourceSimulation(fixture.seed, fixture.equipment);
    const on = runCombatSourceSimulation(fixture.seed, fixture.equipment, true);
    assert.deepEqual(on.gameplay, off.gameplay, 'observation must not change gameplay');
    assert.equal(hash(on.gameplay), (tail||shell||fixture).gameplayHash, tail?'intentional tail migration differs from declared chunk13 expectations':shell?'intentional shell mechanics differ from declared chunk8 expectations':'state/physics/events/legacy trace differ from saved original resolver');
    assert.equal(hash(on.sources), (tail||fixture).sourceHash, 'source history differs from saved original resolver');
    assert.ok(on.gameplay.checkpoints.at(-1).state.kills > 0, 'simulation actually reached combat');
  });
}
