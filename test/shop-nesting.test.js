import test from 'node:test';
import assert from 'node:assert/strict';
import {createCanvas} from '@napi-rs/canvas';
import {ITEMS,SLOTS,normalizeEquipment} from '../src/equipment.js';
import {SHOP_GROUPS,SLOT_LABELS,shopGroup,shopItems,classifyItem,shopStudy} from '../src/shop-catalog.js';
import {UI_ICONS} from '../src/ui-icons.js';
import {createArtBake,drawShopItemStudy} from '../src/art/splatr-art-engine.js';

test('four nested families partition every slot once with readable names and valid icons',()=>{
 assert.equal(SHOP_GROUPS.length,4);const slots=SHOP_GROUPS.flatMap(g=>g.slots);
 assert.equal(new Set(slots).size,SLOTS.length);assert.deepEqual(new Set(slots),new Set(SLOTS));
 for(const g of SHOP_GROUPS){assert.ok(UI_ICONS[g.icon]);assert.ok(g.slots.length<=5);for(const s of g.slots){assert.equal(shopGroup(s).id,g.id);assert.ok(SLOT_LABELS[s]);}}
});
test('availability filters are exact; challenges are never advertised as affordable',()=>{
 assert.deepEqual(shopItems('head',{owned:['none','halo'],filter:'owned'}).map(i=>i.id),['none','halo']);
 const affordable=shopItems('head',{owned:['none'],wallet:250,filter:'affordable'});
 assert.ok(affordable.some(i=>i.id==='neko'));assert.ok(!affordable.some(i=>i.id==='oni'||i.id==='viper'||i.id==='none'));
 assert.deepEqual(shopItems('head',{filter:'challenge'}).map(i=>i.id),['oni']);
});
test('classification reflects the implemented benefit rather than calling all effects combat',()=>{
 const get=id=>classifyItem(ITEMS.find(i=>i.id===id));
 assert.equal(get('laser').family,'blade');assert.equal(get('visor').family,'focus');assert.equal(get('gold').family,'score');assert.equal(get('neko').family,'chain');assert.equal(get('radar-1').family,'sensor');assert.equal(get('none').family,'baseline');
 for(const item of ITEMS){const c=classifyItem(item);assert.ok(c.trigger&&c.benefit&&c.label);assert.ok(Object.isFrozen(c));}
});
test('item studies show ready, trigger, result; reduced motion is a stable result frame',()=>{
 const it=ITEMS.find(i=>i.id==='neko');assert.equal(shopStudy(it,0).phase,'READY');assert.equal(shopStudy(it,900).phase,'TRIGGER');assert.equal(shopStudy(it,2100).phase,'RESULT');assert.deepEqual(shopStudy(it,0,false),shopStudy(it,2300,false));
});
test('all item studies preserve canvas state; paid perk families have distinct visuals',()=>{
 const images=new Set();
 for(const item of ITEMS){const canvas=createCanvas(480,300),c=canvas.getContext('2d');c.globalAlpha=.6;c.translate(1,2);const before=c.getTransform();const study=shopStudy(item,1900),eq=Object.freeze(normalizeEquipment({[item.slot]:item.id}));
  drawShopItemStudy(c,480,300,{study,equipment:eq});assert.deepEqual(c.getTransform(),before,item.id);assert.equal(c.globalAlpha,.6,item.id);
  if(['visor','neko','gold','katana','dash-fire'].includes(item.id))images.add(canvas.toBuffer('image/png').toString('base64'));
 }assert.equal(images.size,5);
});
test('raster baking draws once, invalidates dimensions, evicts and releases bounded surfaces',()=>{
 const surfaces=[],bake=createArtBake({surface:()=>{const s=createCanvas(1,1);surfaces.push(s);return s;},maxEntries:2,maxPixels:1000}),c=createCanvas(50,50).getContext('2d');let calls=0;const paint=()=>calls++;
 bake.paint(c,'a',10,10,paint);bake.paint(c,'a',10,10,paint);assert.equal(calls,1);
 bake.paint(c,'b',10,10,paint);bake.paint(c,'c',10,10,paint);assert.equal(bake.stats().entries,2);assert.equal(surfaces[0].width,1);
 bake.paint(c,'c',12,12,paint);assert.equal(calls,4);bake.clear();assert.deepEqual(bake.stats(),{entries:0,pixels:0});
});
