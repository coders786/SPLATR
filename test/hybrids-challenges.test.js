import test from 'node:test';
import assert from 'node:assert/strict';
import {HYBRIDS,activeHybrid,hybridHint,collectionBadges,drawHybridAura} from '../src/hybrids.js';
import {ITEMS,loadEquipment,buyEquipment} from '../src/equipment.js';
import {createRun} from '../src/run.js';
import {BAND} from '../src/levels.js';
import {createCanvas} from '@napi-rs/canvas';

test('all eleven exact hybrid recipes; Ronin requires four parts, no partial aura',()=>{
  assert.equal(HYBRIDS.length,17);
  for(const h of HYBRIDS){assert.equal(activeHybrid(h.parts)?.id,h.id);const partial={...h.parts};delete partial[Object.keys(partial).at(-1)];assert.equal(activeHybrid(partial),null);assert.match(hybridHint(partial),new RegExp(`${Object.keys(h.parts).length-1} OF ${Object.keys(h.parts).length}`));}
  assert.equal(activeHybrid({eyes:'visor',body:'hologram',tail:'ghost'})?.title,'CYBER PHANTOM');
});
test('challenge items are never free migration defaults or purchasable at any balance',()=>{
  const s=loadEquipment('{}');for(const id of ['oni','glass']){assert.ok(!s.owned.includes(id));assert.equal(buyEquipment(s,id,99999),null);}
  assert.ok(loadEquipment(JSON.stringify({owned:['oni','glass']})).owned.includes('glass'));
});
test('collection badges require every currently catalogued item in a slot',()=>{
  const owned=ITEMS.map(x=>x.id);assert.equal(collectionBadges(ITEMS,owned).length,11);assert.ok(!collectionBadges(ITEMS,owned.filter(x=>x!=='oni')).includes('head'));
});
test('all aura drawings preserve canvas state',()=>{
  const c=createCanvas(160,160).getContext('2d');c.translate(80,80);c.scale(25,25);
  for(const h of HYBRIDS){const before=c.getTransform();drawHybridAura(c,h.parts,20);assert.deepEqual(c.getTransform(),before);assert.equal(c.globalAlpha,1);}
});
function crownKill(equipment={},hp=3){
  const events=[];const r=createRun(19,(type,d)=>events.push({type,d}),{staged:false,equipment});
  r.state.phase='playing';r.state.hp=hp;r.dash({x:20,y:-10,power:.7});r.state.stop=1;
  const e=r.combat.add({id:'challenge-crown',kind:'crown',x:200,y:-100,home:'test',slot:-1,pinned:true});e.hp=1;r.combat.contacts.add(e);r.tick();
  return {r,events};
}
test('real Crown kill checks Hull before repair; normal kill does not unlock Oni',()=>{
  for(const hp of [1,2]){const {r,events}=crownKill({},hp);assert.equal(r.state.kills,1);assert.equal(events.some(x=>x.type==='challenge'&&x.d.id==='oni'),hp===1);r.dispose();}
});
test('Glass doubles score, caps repair to one Hull, and dies in one unprotected hit',()=>{
  const a=crownKill({},1),b=crownKill({core:'glass'},1);
  assert.equal(b.r.state.score,2*a.r.state.score);assert.equal(b.r.state.hp,1);assert.equal(b.r.state.hpMax,1);
  b.r.state.invul=0;b.r.hurt('test');assert.equal(b.r.state.hp,0);a.r.dispose();b.r.dispose();
});
test('Oni gives exactly 50 percent bonus only at one Hull',()=>{
  const normal=crownKill({},1),low=crownKill({head:'oni'},1),healthy=crownKill({head:'oni'},2);
  assert.equal(low.r.state.score,Math.floor(normal.r.state.score*1.5));assert.equal(healthy.r.state.score,normal.r.state.score);
  for(const x of [normal,low,healthy])x.r.dispose();
});
test('sector challenge grants Glass at displayed sector five, never four',()=>{
  for(const [sector,expected] of [[4,false],[5,true]]){const events=[];const r=createRun(19,(t,d)=>{if(t==='challenge')events.push(d.id);},{staged:false});r.dash({x:0,y:-20,power:.5});r.state.peak=(sector-1)*BAND;r.tick();assert.equal(events.includes('glass'),expected);r.dispose();}
});
