import test from 'node:test';
import assert from 'node:assert/strict';
import {healthDamageLabel,healthDeathMessage} from '../src/health-ui.js';
import {powerReadout,primaryReadout} from '../src/power-readout.js';
import {ITEMS} from '../src/equipment.js';
import {WAVE_BUFFS} from '../src/waves.js';
import {TEACHING_SCENARIOS} from '../src/teaching.js';

test('health feedback distinguishes body contact from real hazards',()=>{
 assert.equal(healthDamageLabel('Fang'),'Fang rush');
 assert.equal(healthDamageLabel('Pulse wave'),'Pulse wave');
 assert.equal(healthDamageLabel('Prism needle'),'Prism needle');
 assert.equal(healthDamageLabel('Prism link'),'Prism link');
 assert.equal(healthDeathMessage('Bastion',3),'Health 0/3 · Run over. Last hit: Bastion contact.');
 assert.equal(healthDeathMessage('Prism needle',1),'Health 0/1 · Run over. Last hit: Prism needle.');
});

test('player-facing equipment, upgrade and training text says health, not hull',()=>{
 const words=[...ITEMS.flatMap(item=>[item.title,item.name,item.tag,item.detail,item.description,item.note,item.ability,item.effect].filter(x=>typeof x==='string')),...WAVE_BUFFS.flatMap(b=>[b.title,b.stat,b.note]),...TEACHING_SCENARIOS.flatMap(s=>[s.watch,s.action]),...['oni','glass','standard'].flatMap(id=>{const r=powerReadout(id);return [r.title,r.when,...r.chips].filter(Boolean)}),...primaryReadout({head:'oni'}).conditional];
 assert.doesNotMatch(words.join(' '),/\bhull\b/i);assert.ok(powerReadout('glass').chips.includes('MAX HEALTH 1'));
});
