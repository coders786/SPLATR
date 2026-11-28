import test from 'node:test';
import assert from 'node:assert/strict';
import {createCanvas} from '@napi-rs/canvas';
import {ITEMS,equipmentRules,normalizeEquipment,loadEquipment} from '../src/equipment.js';
import {SHOP_ABILITIES,shopAbility,playerText,playerCanvas,secondsLabel} from '../src/shop-language.js';
import {abilityShowcase,SHOWCASE_IDS} from '../src/ability-showcase.js';
import {powerReadout} from '../src/power-readout.js';
import {shopStudy,shopItems} from '../src/shop-catalog.js';
import {drawShopItemStudy} from '../src/art/splatr-art-engine.js';
import {recoverFocus} from '../src/focus-recovery.js';
import {aimPull} from '../src/equipment-combat.js';
const forbidden=/\bticks?\b|\bsimulation\b|\bprimary\b|\bclamped\b|\bsource.admission\b/i;
test('all73 items have unique frozen plain-language appearance/use/limit cards, with no orphan IDs',()=>{
 assert.deepEqual(new Set(Object.keys(SHOP_ABILITIES)),new Set(ITEMS.map(i=>i.id)));assert.ok(Object.isFrozen(SHOP_ABILITIES));
 assert.equal(new Set(ITEMS.map(i=>shopAbility(i.id).headline)).size,73);
 for(const item of ITEMS){const copy=shopAbility(item.id),power=powerReadout(item);assert.ok(Object.isFrozen(copy));for(const text of Object.values(copy)){assert.ok(text.length>8,item.id);assert.doesNotMatch(text,forbidden,item.id);}assert.doesNotMatch(JSON.stringify(power),forbidden,item.id);assert.ok(power.short.length<=20);assert.ok(power.title.split(' ').length<=3);}
 for(const id of ['missing','__proto__','constructor',null])assert.throws(()=>shopAbility(id),RangeError);
});
test('time wording is display-only, handles legacy units and avoids naked T suffixes',()=>{
 assert.equal(secondsLabel(120),'2s');assert.equal(secondsLabel(45),'0.75s');assert.equal(secondsLabel(12),'0.2s');
 for(const text of ['120-world-tick cooldown','12 simulation ticks','4 world ticks','18 aim ticks','45-TICK COOLDOWN','six simulation ticks','8T','time ticks'])assert.doesNotMatch(playerText(text),/\bticks?\b|\d+T\b/i,text);
 assert.match(playerText('4 world ticks'),/0.07s/);assert.equal(playerText('WORLD CLOCK / PRIMARY CUT'),'game speed / direct CUT');
});
test('sixteen new showcase identities cover all nine heads and seven cores, other slots retain their studies',()=>{
 assert.deepEqual(new Set(SHOWCASE_IDS),new Set(ITEMS.filter(i=>['head','core'].includes(i.slot)).map(i=>i.id)));
 for(const it of ITEMS){const study=shopStudy(it,3300,false,normalizeEquipment({[it.slot]:it.id}));if(['head','core'].includes(it.slot)){assert.equal(study.showcase.illustration,true);assert.equal(study.showcase.id,it.id);}else assert.equal(study.showcase,undefined);}
 assert.equal(abilityShowcase(ITEMS.find(i=>i.id==='visor')),null);
});
test('showcase numeric benefits come from existing resolved rules, not a new balance table',()=>{
 for(const id of SHOWCASE_IDS){const it=ITEMS.find(i=>i.id===id),eq=normalizeEquipment({[it.slot]:id}),r=equipmentRules(eq),a=abilityShowcase(it,3300,false,eq);assert.ok(Object.isFrozen(a));assert.ok(Object.isFrozen(a.values));assert.equal(a.values.armor,r.armorDamage);assert.equal(a.values.driveKills,r.overdriveKills);assert.equal(a.values.edge,r.edgeMax);assert.equal(a.values.hull,r.healthMax);}
 const show=id=>abilityShowcase(ITEMS.find(i=>i.id===id),3300,false);
 assert.equal(show('halo').values.gravity,.85);assert.equal(show('viper').values.speed,1.2);assert.equal(show('viper').values.width,.85);assert.equal(show('samurai').values.horizontal,1.2);assert.equal(show('crown').values.armor,2);assert.equal(show('glass').values.hull,1);assert.equal(show('glass').values.score,2);assert.equal(show('riot').values.driveKills,4);assert.equal(show('riot').values.edge,2);
 const capped=abilityShowcase(ITEMS.find(i=>i.id==='neko'),3300,false,{body:'lava',slash:'comic'});assert.equal(capped.values.chain,0,'no fabricated extra grace at shared limit');
});
test('Grav and Time illustrations use the actual shared pull/recovery helpers',()=>{
 const show=id=>abilityShowcase(ITEMS.find(i=>i.id===id),3300,false);
 let e={kind:'fang',small:true,x:100,y:48};for(let i=0;i<45;i++)e={...e,...aimPull(e,{x:0,y:0},0)};assert.equal(show('grav').values.pullY,e.y);
 let fast=.25,base=.25;for(let i=0;i<60;i++){fast=recoverFocus(fast,2);base=recoverFocus(base,1);}assert.equal(show('time').values.focus,fast);assert.equal(show('time').values.without,base);
});
test('all73 player-facing study canvases have no tick/simulation jargon; adapters never alter context state',()=>{
 for(const item of ITEMS){const eq=normalizeEquipment({[item.slot]:item.id}),cv=createCanvas(640,400),real=cv.getContext('2d'),words=[];
  const capture=new Proxy(real,{get(t,k){const v=Reflect.get(t,k,t);return k==='fillText'?(text,...args)=>{words.push(String(text));return v.call(t,text,...args);}:typeof v==='function'?v.bind(t):v;},set:(t,k,v)=>Reflect.set(t,k,v,t)}),c=playerCanvas(capture);assert.equal(playerCanvas(capture),c);
  c.translate(2,3);c.globalAlpha=.8;const before=c.getTransform(),study=shopStudy(item,3300,false,eq),raw=JSON.stringify(study);drawShopItemStudy(c,640,400,{study,equipment:eq});assert.equal(JSON.stringify(study),raw);assert.deepEqual(c.getTransform(),before);assert.equal(c.globalAlpha,.8);assert.doesNotMatch(words.join(' '),/\bticks?\b|\bsimulation\b/i,item.id);assert.ok(words.length>0,item.id);
 }
});
test('sixteen studies are distinct, visibly progress and stay pixel-still under reduced motion',()=>{
 const results=new Set();for(const id of SHOWCASE_IDS){const it=ITEMS.find(i=>i.id===id),eq=normalizeEquipment({[it.slot]:id}),draw=(t,motion)=>{const cv=createCanvas(640,400);drawShopItemStudy(playerCanvas(cv.getContext('2d')),640,400,{study:shopStudy(it,t,motion,eq),equipment:eq});return cv.toBuffer('image/png');};assert.deepEqual(draw(0,false),draw(9999,false),id);assert.notDeepEqual(draw(0,true),draw(3300,true),id);results.add(draw(3300,false).toString('base64'));}assert.equal(results.size,16);
});
test('copy explicitly excludes unreleased elemental powers and correctly describes fragile/slow/limited tradeoffs',()=>{
 for(const id of ['dash-fire','dash-ice','dash-echo','sniper'])assert.match(shopAbility(id).effect,/look only/);
 assert.match(shopAbility('glass').effect,/maximum health is 1/);assert.match(shopAbility('riot').limit,/2 maximum EDGE/);assert.match(shopAbility('crown').limit,/8% launch speed/);assert.match(shopAbility('viper').effect,/15% narrower/);assert.match(shopAbility('coil').limit,/cannot create more zaps/);
});
test('search can find abilities in ordinary words without inventing a new power',()=>{
 assert.ok(shopItems('head',{query:'gravity'}).some(i=>i.id==='halo'));assert.ok(shopItems('core',{query:'ghost blade'}).some(i=>i.id==='echo'));assert.ok(shopItems('dash',{query:'Frost'}).some(i=>i.id==='dash-ice'));
});
test('Notched plain-language copy still reports the actual extra recovery at a shared cap',()=>{
 const p=powerReadout('notched',{eyes:'glitch',world:'synth',pointer:'pointer-orbit',dash:'dash-water'});assert.equal(p.chips[0],'RECOVERY +12%');assert.match(p.detail,/add \+12%/);assert.match(p.detail,/total recovery bonus is \+22%/);
});
test('showcases/copy never buy, equip, discover or modify caller-owned save data',()=>{
 const raw=JSON.stringify({version:1,owned:[],equipped:{head:'none'},presets:[null,null,null],discovered:[]}),save=loadEquipment(raw),before=JSON.stringify(save);
 for(const it of ITEMS){shopStudy(it,3300,false,save.equipped);shopAbility(it.id);powerReadout(it,save.equipped);}assert.equal(JSON.stringify(save),before);
});
