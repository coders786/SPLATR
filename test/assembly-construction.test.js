import test from 'node:test';
import assert from 'node:assert/strict';
import {createCanvas} from '@napi-rs/canvas';
import {resolveAssemblyConstruction,assemblyCacheStats,clearAssemblyCache,drawAssemblyStudy,drawCubeHero,drawSwordWeapon,ITEMS} from '../src/art/splatr-art-engine.js';
import {DEFAULT_EQUIPMENT,normalizeEquipment,equipmentRules,loadEquipment} from '../src/equipment.js';
import {HYBRIDS,activeHybrid} from '../src/hybrids.js';
import {swordProfile,SWORD_STYLES} from '../src/swords.js';
const bodies=ITEMS.filter(i=>i.slot==='body').map(i=>i.id);
const eq=parts=>normalizeEquipment({...DEFAULT_EQUIPMENT,...parts});
const frozen=value=>{if(value&&typeof value==='object'){assert.ok(Object.isFrozen(value));for(const v of Object.values(value))frozen(v);}};
function image(equipment,{radius=40,pose={},time=0,motion=false}={}){
 const canvas=createCanvas(360,260),c=canvas.getContext('2d');c.translate(1,2);c.globalAlpha=.7;c.setLineDash([3,5]);const before=c.getTransform();
 drawCubeHero(c,{x:205,y:155,radius,equipment,time,motion,pose});
 assert.deepEqual(c.getTransform(),before);assert.equal(c.globalAlpha,.7);assert.deepEqual(c.getLineDash(),[3,5]);
 return {canvas,c,png:canvas.toBuffer('image/png')};
}

test('all10 shell architectures expose distinct deeply frozen materials and fitted mount provenance',()=>{
 const names=[],mounts=[];
 for(const body of bodies){
  const input=Object.freeze(eq({body})),a=resolveAssemblyConstruction(input);frozen(a);
  assert.equal(a.body,body);assert.equal(a.core,'standard');names.push(a.material.name);mounts.push(a.material.mount);
  assert.deepEqual(a.headSeat,[0,-.96]);assert.deepEqual(a.weaponSeat,[.87,.62]);
  assert.equal(resolveAssemblyConstruction({...input}),a,'equal construction reuses immutable data');
 }
 assert.equal(new Set(names).size,10);assert.equal(new Set(mounts).size,10);
 assert.equal(resolveAssemblyConstruction({body:'constructor'}).body,'paper');assert.equal(resolveAssemblyConstruction({body:'bad'}).body,'paper');
});

test('static cache is bounded, contains no actor/time/ownership data and ignores unrelated scanner slots',()=>{
 clearAssemblyCache();const initial=resolveAssemblyConstruction(eq({}));
 assert.equal(resolveAssemblyConstruction(eq({radar:'radar-3',trajectory:'trajectory-3',pointer:'pointer-orbit',dash:'dash-fire'})),initial);
 for(let i=0;i<300;i++)resolveAssemblyConstruction({body:bodies[i%10],head:`unrecognized-${i}`});
 assert.equal(assemblyCacheStats().entries,assemblyCacheStats().limit);assert.equal(assemblyCacheStats().limit,128);
 clearAssemblyCache();assert.equal(assemblyCacheStats().entries,0);
});

test('all17 complete construction families use the same most-specific authority as the real sword',()=>{
 for(const h of HYBRIDS){const input=eq(h.parts),a=resolveAssemblyConstruction(input),s=swordProfile(input);
  assert.equal(a.family,s.build);assert.equal(a.family,activeHybrid(input).id);assert.equal(a.familyTitle,h.title);
 }
 const overlap=eq({...HYBRIDS.find(h=>h.id==='phantom').parts,...HYBRIDS.find(h=>h.id==='arcade').parts});
 assert.equal(resolveAssemblyConstruction(overlap).family,'arcade');
 const broken=eq({...overlap,core:'standard'});assert.equal(resolveAssemblyConstruction(broken).family,'phantom');
});

test('all10 shells stay visibly distinct at gameplay and inspection sizes with emission disabled',()=>{
 for(const radius of [23,64]){
  const frames=bodies.map(body=>image(eq({body}),{radius,pose:{emission:0}}).png.toString('base64'));
  assert.equal(new Set(frames).size,10);
 }
});

test('all17 fitted family assemblies remain distinct at small and large sizes and reduced motion is stable',()=>{
 for(const radius of [23,58]){
  const frames=[];for(const h of HYBRIDS){const input=Object.freeze(eq(h.parts));
   const a=image(input,{radius,time:0}),b=image(input,{radius,time:1000});assert.deepEqual(a.png,b.png,h.id);frames.push(a.png.toString('base64'));
  }assert.equal(new Set(frames).size,17);
 }
});

test('assembly never invents cooling, spring charge, contact glints or power activation at idle',()=>{
 for(const [body,pose] of [['notched',{focusRecovering:true,focusLevel:.5,recoveryAge:8}],['segmented',{shellAmount:1.4}],['chamfer',{shellGlanceAge:0,shellContactAngle:0}]]){
  const input=eq({body,core:'echo'});assert.notDeepEqual(image(input).png,image(input,{pose}).png,body);
 }
 for(const input of [eq({}),...HYBRIDS.map(h=>eq(h.parts))]){
  const before=JSON.stringify(input),rules=equipmentRules(input),sword=swordProfile(input);
  image(input,{pose:{aiming:true},motion:true,time:12});assert.equal(JSON.stringify(input),before);
  assert.deepEqual(equipmentRules(input),rules);assert.deepEqual(swordProfile(input),sword);
 }
});

test('scanner or explicit dash/slash swaps do not repaint the base shell assembly',()=>{
 const a=eq({body:'iron',head:'neko',core:'glass'});
 for(const change of [{radar:'radar-3'},{trajectory:'trajectory-3'},{pointer:'pointer-orbit'},{dash:'dash-ice'},{slash:'katana'}]){
  // This loadout cannot complete a family, so only the owning effect changes.
  assert.deepEqual(image(a).png,image(eq({...a,...change})).png);
 }
});

test('material weapon roots leave the distal primary blade geometry and finish unchanged',()=>{
 for(const style of Object.values(SWORD_STYLES)){
  let baseline=null;
  for(const body of bodies){const canvas=createCanvas(400,220),c=canvas.getContext('2d');
   drawSwordWeapon(c,{x:70,y:100,radius:50,angle:0,active:true,aiming:false,equipment:eq({body}),sword:style,motion:false});
   // Material keyed roots end before1.3r; this crop begins at1.5r.
   const blade=Buffer.from(c.getImageData(145,45,245,110).data);
   if(!baseline)baseline=blade;else assert.deepEqual(blade,baseline,`${body}/${style.id}`);
  }
 }
});

test('assembly inspection shares the hero, balances Canvas state, states references and is time-stable when reduced',()=>{
 const render=(input,time=0,motion=false,reference=false)=>{
  const canvas=createCanvas(640,400),c=canvas.getContext('2d');c.translate(2,3);c.globalAlpha=.6;const matrix=c.getTransform(),text=[];
  const fill=c.fillText.bind(c);c.fillText=(value,...args)=>{text.push(value);return fill(value,...args);};
  drawAssemblyStudy(c,640,400,{equipment:input,sword:swordProfile(input),time,motion,reference});
  assert.deepEqual(c.getTransform(),matrix);assert.equal(c.globalAlpha,.6);return {png:canvas.toBuffer('image/png'),text};
 };
 for(const h of HYBRIDS){const input=Object.freeze(eq(h.parts)),a=render(input),b=render(input,9999);
  assert.deepEqual(a.png,b.png);assert.ok(a.text.includes(h.title));assert.ok(a.text.some(t=>t.includes('POWERS STAY IN PART IN ACTION')));
 }
 const example=render(eq(HYBRIDS[0].parts),0,false,true);assert.ok(example.text.some(t=>t.includes('OWNERSHIP UNCHANGED')));
 drawAssemblyStudy(null,640,400);assert.notDeepEqual(render(eq({body:'paper'})).png,render(eq({body:'iron'})).png);
});

test('new construction needs no migration and does not grant reference-build ownership or discoveries',()=>{
 const raw=JSON.stringify({owned:['iron'],equipped:{body:'iron'},presets:[{body:'iron'},null,null],discovered:[]});
 const before=loadEquipment(raw);
 for(const h of HYBRIDS){resolveAssemblyConstruction(eq(h.parts));image(eq(h.parts));}
 assert.deepEqual(loadEquipment(raw),before);assert.equal(before.owned.includes('prism'),false);assert.deepEqual(before.discovered,[]);
});
