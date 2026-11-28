import test from 'node:test';
import assert from 'node:assert/strict';
import {createCanvas} from '@napi-rs/canvas';
import {headMechanismPose,drawCubeHero,drawShopPartPortrait,drawVisualShopStory} from '../src/art/splatr-art-engine.js';
import {ITEMS,normalizeEquipment,equipmentRules} from '../src/equipment.js';
import {createRun} from '../src/run.js';
import {placePlayer,stopPlayer} from '../src/physics.js';
import {shopStudy} from '../src/shop-catalog.js';
import {visualStoryFrame,visualStudyTime} from '../src/visual-story.js';
const heads=ITEMS.filter(i=>i.slot==='head'),bodies=ITEMS.filter(i=>i.slot==='body');
const head=(id,extra={},enemies=[],velocity={y:1})=>headMechanismPose({phase:'playing',equipment:{head:id},...extra},enemies,velocity).headAbility;
function region(id,{body='paper',core='standard',active=false,radius=64,time=0,motion=false,extra={}}={}){
 const c=createCanvas(320,280).getContext('2d'),equipment=Object.freeze(normalizeEquipment({head:id,body,core}));c.translate(1,2);c.globalAlpha=.8;c.setLineDash([2,4]);const transform=c.getTransform();
 drawCubeHero(c,{x:165,y:175,radius,equipment,time,motion,pose:{blink:1,breathe:0,headAbility:{kind:id,active},...extra}});
 assert.deepEqual(c.getTransform(),transform);assert.equal(c.globalAlpha,.8);assert.deepEqual(c.getLineDash(),[2,4]);
 const data=c.getImageData(0,Math.max(0,Math.floor(175-radius*2.2)),320,Math.ceil(radius*1.35)).data;return Buffer.from(data);
}
test('real head conditions are independent; unrelated posing cannot grant activation',()=>{
 for(const id of heads.map(i=>i.id)){assert.equal(head(id).active,false,id);assert.equal(head(id,{combo:99,overdrive:true,elapsed:999,swordCharge:99,attackProgress:.5}).active,false,id);}
 assert.equal(head('halo',{held:true}).active,true);assert.equal(head('halo',{held:true,depleted:true}).active,false);assert.equal(head('halo',{held:true},[],{y:-1}).active,false);
 assert.equal(head('neko',{chain:1}).active,true);assert.equal(head('neko',{chain:0}).active,false);
 assert.equal(head('oni',{hp:1}).active,true);assert.equal(head('oni',{hp:2}).active,false);
 assert.equal(head('viper',{blade:12,slashAge:2}).active,true);assert.equal(head('viper',{blade:12,slashAge:11}).active,false);
 assert.equal(head('crown',{blade:1}).active,true);assert.equal(head('samurai',{blade:1,slashAngle:0}).active,true);assert.equal(head('samurai',{blade:1,slashAngle:Math.PI/2}).active,false);
 assert.equal(head('coil',{blade:12}).active,false);assert.equal(head('coil',{equipmentFx:{bursts:[{style:'spark',ticks:29}]}}).active,true);assert.equal(head('coil',{equipmentFx:{bursts:[{style:'spark',ticks:24}]}}).active,false);
 assert.equal(head('coil',{volt:{conduction:{arc:{links:[{role:'coil'}]}}}}).active,true);assert.equal(head('coil',{volt:{conduction:{arc:{links:[{role:'near'}]}}}}).active,false);
 assert.equal(head('beacon',{},[{kind:'fang',mode:'tell'}]).active,true);for(const e of [{kind:'fang',mode:'rush'},{kind:'bastion',mode:'tell'}])assert.equal(head('beacon',{},[e]).active,false);
});
test('dead, ready, teaching and opening states cannot retain a false head receipt',()=>{
 for(const extra of [{phase:'dead'},{phase:'ready'},{phase:'paused'},{opening:{}},{tutorialActive:true},{visualTutorial:true}])for(const item of heads){const state={phase:'playing',equipment:{head:item.id},held:true,chain:3,hp:1,blade:12,slashAge:2,slashAngle:0,equipmentFx:{bursts:[{style:'spark',ticks:30}]},...extra};assert.equal(headMechanismPose(state,[{kind:'fang',mode:'tell'}],{y:10}).headAbility.active,false,item.id);}
 const s=Object.freeze({phase:'playing',equipment:Object.freeze({head:'neko'}),chain:2}),copy=JSON.stringify(s),p=headMechanismPose(s);assert.ok(Object.isFrozen(p)&&Object.isFrozen(p.headAbility));assert.equal(JSON.stringify(s),copy);
});
test('nine head silhouettes are distinct at play and inspection size on every shell',()=>{
 for(const radius of [23,64])for(const body of bodies){const shapes=new Set(heads.map(i=>{const data=region(i.id,{body:body.id,radius});return Buffer.from(data.filter((_,j)=>j%4===3)).toString('base64');}));assert.equal(shapes.size,9,`${body.id}/${radius}`);}
});
test('all eight real attachment receipts are visible at gameplay size, with no idle clock emission',()=>{
 for(const item of heads.filter(i=>i.id!=='none'))for(const radius of [23,64]){
 assert.notDeepEqual(region(item.id,{radius}),region(item.id,{radius,active:true}),item.id);
 assert.deepEqual(region(item.id,{radius,time:0,motion:true}),region(item.id,{radius,time:9876,motion:true}),`no idle beam/crackle ${item.id}`);
 assert.deepEqual(region(item.id,{radius,active:true,time:0}),region(item.id,{radius,active:true,time:9876}),`stable reduced state ${item.id}`);
 assert.deepEqual(region(item.id,{radius}),region(item.id,{radius,extra:{headAbility:{kind:'wrong-head',active:true}}}),`mismatched receipt ${item.id}`);
 }
});
test('head product art and all wordless story beats reuse the production hardware, without writes',()=>{
 for(const item of heads){const equipment=Object.freeze(normalizeEquipment({head:item.id})),save=JSON.stringify(equipment);for(let beat=0;beat<3;beat++){const frame=visualStoryFrame(0,false,beat),study=shopStudy(item,visualStudyTime('head',item.id,frame),false,equipment),c=createCanvas(640,400).getContext('2d');let words=0;c.fillText=()=>words++;drawVisualShopStory(c,640,400,{equipment,study,frame,surface:createCanvas(640,400)});assert.equal(words,0);drawShopPartPortrait(c,300,184,{equipment,slot:'head'});assert.equal(JSON.stringify(equipment),save);}}
});
test('a real accepted Coil relay lights hardware; an empty primary contact does not fabricate a zap',()=>{
 for(const neighbor of [false,true]){const r=createRun(77,()=>{},{waveMode:true,equipment:{head:'coil'}});try{
 for(const e of [...r.combat.enemies.values()])r.combat.remove(e);Object.assign(r.state,{phase:'playing',opening:null,inputLock:false,invul:99999});r.state.wave.entry=0;placePlayer(r.world,{x:-350,y:-400});stopPlayer(r.world);r.world.grounded=false;r.combat.add({id:'sentinel',kind:'fang',x:700,y:-900,pinned:true,delay:999999});
 assert.equal(r.dash({x:24,y:0,power:24/42}),true);assert.equal(headMechanismPose(r.state).headAbility.active,false);
 const e=r.combat.add({id:'direct',kind:'fang',x:-320,y:-400,hp:3,pinned:true,delay:999999});if(neighbor)r.combat.add({id:'near',kind:'fang',x:-320,y:-460,hp:3,pinned:true,delay:999999});
 r.combat.contacts.add(e);r.state.stop=1;r.tick();assert.equal(headMechanismPose(r.state).headAbility.active,neighbor);
 const before=JSON.stringify(r.state.equipment),hp=e.hp;headMechanismPose(r.state,r.combat.enemies.values(),r.world.player.velocity);assert.equal(e.hp,hp);assert.equal(JSON.stringify(r.state.equipment),before);
 }finally{r.dispose();}}
});
