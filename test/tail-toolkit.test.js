import test from 'node:test';
import assert from 'node:assert/strict';
import {createCanvas} from '@napi-rs/canvas';
import {createRun,steerRetention} from '../src/run.js';
import {placePlayer,stopPlayer,setPlayerVelocity,MAX_PINBALL_SPEED} from '../src/physics.js';
import {createSpectrumSequence,viperRetention,tailToolkitStudy,tailToolkitReadout} from '../src/tail-toolkit.js';
import {equipmentRules,ITEMS,normalizeEquipment,loadEquipment} from '../src/equipment.js';
import {powerReadout} from '../src/power-readout.js';
import {shopStudy} from '../src/shop-catalog.js';
import {drawTailToolkit,drawCubeHero,drawShopItemStudy} from '../src/art/splatr-art-engine.js';
const tails=ITEMS.filter(i=>i.slot==='tail'),near=(a,b)=>assert.ok(Math.abs(a-b)<1e-9,`${a} != ${b}`);
function fixture(tail='spectrum',more={}){
 const events=[],r=createRun(77,(type,data)=>events.push({type,data}),{waveMode:true,equipment:{tail,...more}});
 for(const e of [...r.combat.enemies.values()])r.combat.remove(e);r.combat.add({id:'sentinel',kind:'fang',x:700,y:-900,pinned:true,delay:999999});
 Object.assign(r.state,{phase:'playing',opening:null,inputLock:false,invul:99999});r.state.wave.entry=0;placePlayer(r.world,{x:-350,y:-400});stopPlayer(r.world);r.world.grounded=false;return {r,events};
}
const step=r=>{r.state.stop=1;r.tick();};
function kill(r,id){
 if(r.state.edge<1)r.state.edge=1;assert.equal(r.dash({x:24,y:0,power:24/42}),true);
 const p=r.world.player.position,e=r.combat.add({id,kind:'fang',x:p.x+30,y:p.y,pinned:true,delay:999999});e.hp=1;r.combat.contacts.add(e);step(r);assert.equal(r.combat.enemies.has(id),false);return e;
}
test('Viper retains 15% of LOSS, not 15% speed; Hyper/gentle/bank ownership and zero momentum',()=>{
 near(viperRetention(.85,{speed:80}),.8725);near(viperRetention(.925,{speed:80}),.93625);
 for(const normal of [1,1.05])assert.equal(viperRetention(normal,{speed:80}),normal);
 for(const speed of [0,-1,NaN])assert.equal(viperRetention(.85,{speed}),.85);
 assert.equal(viperRetention(.9,{speed:140,hyper:true}),.9);assert.equal(viperRetention(.85,{speed:80,enabled:false}),.85);
});
test('real accepted Viper reversal changes80→68 to80→69.8 without changing direction, costs or ceiling',()=>{
 const a=fixture('ribbon'),b=fixture('viper-tails');try{
  for(const {r}of [a,b]){setPlayerVelocity(r.world,80,0);assert.equal(r.dash({x:-24,y:0,power:24/42}),true);}
  near(a.r.world.player.velocity.x,-68);near(b.r.world.player.velocity.x,-69.8);near(b.r.world.player.velocity.y,0);near(b.r.state.tailAbility.retained,1.8);
  assert.equal(a.r.state.edge,b.r.state.edge);assert.ok(b.r.world.playerCeiling<=MAX_PINBALL_SPEED);near(b.r.world.playerCeiling,69.8);assert.equal(b.r.state.tailAbility.action,'retention');
 }finally{a.r.dispose();b.r.dispose();}
});
test('Viper actual launches from rest, forward, Hyper and requested-speed floor have no invented gain',()=>{
 for(const [speed,x,hyper]of [[0,-24,false],[80,24,false],[140,-24,true],[10,-24,false]]){
  const a=fixture('ribbon'),b=fixture('viper-tails');try{for(const {r}of[a,b]){setPlayerVelocity(r.world,speed,0);r.state.hyper=hyper?120:0;r.dash({x,y:0,power:24/42});}assert.deepEqual(a.r.world.player.velocity,b.r.world.player.velocity);assert.equal(b.r.state.tailAbility.action,undefined);}finally{a.r.dispose();b.r.dispose();}
 }
 const {r}=fixture('viper-tails');try{setPlayerVelocity(r.world,80,0);r.state.inputLock=true;assert.equal(r.dash({x:-24,y:0,power:24/42}),false);assert.equal(r.state.tailAbility,null);}finally{r.dispose();}
});
test('Spectrum counts only unique eligible primary kills and completes once per three',()=>{
 const q=createSpectrumSequence(),targets=[{},{},{}];q.kill({}, {primary:false});q.kill({}, {primary:true,active:false});assert.equal(q.view().count,0);
 assert.equal(q.kill(targets[0],{primary:true}),0);assert.equal(q.kill(targets[0],{primary:true}),0);assert.equal(q.view().count,1);q.kill(targets[1],{primary:true});assert.equal(q.kill(targets[2],{primary:true,now:3}),1);assert.equal(q.view(3).count,0);assert.equal(q.view(3).remaining,120);assert.equal(q.view(3).ready,false);
});
test('Spectrum world-time cooldown has exact120 boundary; kills cannot bank an overflow sequence',()=>{
 const q=createSpectrumSequence(),kill=now=>q.kill({}, {primary:true,now});for(let i=0;i<3;i++)kill(10);assert.equal(q.view(10).remaining,120);
 for(let i=0;i<12;i++)assert.equal(kill(129.999),0);assert.equal(q.view(129.999).count,0);assert.equal(q.view(130).ready,true);
 assert.equal(kill(130),0);assert.equal(kill(130),0);assert.equal(kill(130),1);assert.equal(q.view(130).remaining,120);
});
test('Spectrum chain break/full-cap completion reset progress without deferred payout or cooldown refund',()=>{
 const q=createSpectrumSequence();q.kill({}, {primary:true});q.kill({}, {primary:true});q.breakChain();assert.equal(q.view().count,0);
 q.kill({}, {primary:true});q.kill({}, {primary:true,continued:false});assert.equal(q.view().count,1);
 q.kill({}, {primary:true});assert.equal(q.kill({}, {primary:true,edge:3,max:3}),0);assert.equal(q.view().remaining,120);q.breakChain();assert.equal(q.view().remaining,120);assert.equal(q.kill({}, {primary:true,edge:0,now:1}),0);assert.equal(q.view().count,0);
 q.reset();assert.equal(q.view().ready,true);assert.equal(q.view().count,0);
});
test('real Spectrum third primary kill returns one EXTRA EDGE after the ordinary kill refund',()=>{
 const a=fixture('ribbon'),b=fixture('spectrum');try{
  for(const {r}of[a,b]){r.state.edge=1;for(let i=0;i<3;i++)kill(r,'primary-'+i);}
  assert.equal(a.r.state.edge,1);assert.equal(b.r.state.edge,2);assert.equal(b.r.state.tailAbility.ready,false);assert.equal(b.r.state.tailAbility.remaining,120);assert.equal(b.events.filter(e=>e.type==='spectrumRefill').length,1);
  assert.equal(a.r.state.chainMax,b.r.state.chainMax,'old12 chain ticks removed');
  for(let i=0;i<3;i++)kill(b.r,'cooldown-'+i);assert.equal(b.events.filter(e=>e.type==='spectrumRefill').length,1);assert.equal(b.r.state.tailAbility.count,0);
 }finally{a.r.dispose();b.r.dispose();}
});
test('real full-EDGE Spectrum completion consumes cooldown but never flashes a nonexistent marginal refund',()=>{
 const {r,events}=fixture();try{for(let i=0;i<3;i++){r.state.edge=3;kill(r,'full-'+i);}assert.equal(r.state.edge,3);assert.equal(r.state.tailAbility.ready,false);assert.equal(r.state.tailAbility.flash,0);assert.equal(events.some(e=>e.type==='spectrumRefill'),false);}finally{r.dispose();}
});
test('real chain break and damage clear incomplete Spectrum bands, not completed cooldown',()=>{
 const {r}=fixture();try{kill(r,'one');kill(r,'two');assert.equal(r.state.tailAbility.count,2);r.state.chainTime=0;step(r);assert.equal(r.state.tailAbility.count,0);kill(r,'new');assert.equal(r.state.tailAbility.count,1);r.state.invul=0;r.hurt('QA');assert.equal(r.state.tailAbility.count,0);}finally{r.dispose();}
});
test('real secondary core echo and tutorial primary kills cannot advance Spectrum bands',()=>{
 const {r}=fixture();try{
  const p=r.world.player.position,e=r.combat.add({id:'echo-only',kind:'fang',x:p.x+100,y:p.y,pinned:true,delay:999999});e.hp=1;r.state.equipmentFx.echoes.push({x:e.x,y:e.y,ticks:30,hits:new Set(),sourceId:'qa'});step(r);assert.equal(r.combat.enemies.has(e.id),false);assert.equal(r.state.tailAbility.count,0);
  r.state.tutorialActive=true;kill(r,'tutorial');assert.equal(r.state.tailAbility,null);r.state.tutorialActive=false;step(r);assert.equal(r.state.tailAbility.count,0);
 }finally{r.dispose();}
});
test('Wings uses the real first-wall latch, rejects second contact, and is not made flight by art',()=>{
 const {r}=fixture('wings');try{r.state.edge=0;step(r);assert.equal(r.state.tailAbility.ready,true);const a=r.world.arena;placePlayer(r.world,{x:a.x+27,y:-400});setPlayerVelocity(r.world,-20,0);for(let i=0;i<8&&r.state.tailAbility.ready;i++){r.state.stop=0;r.tick();}assert.equal(r.state.tailAbility.ready,false);assert.equal(r.state.edge,1);assert.match(tailToolkitReadout(r.state.tailAbility),/SPENT/);
  placePlayer(r.world,{x:-350,y:-400});stopPlayer(r.world);step(r);r.state.edge=0;
  r.world.struck={surface:'rail',nx:-1,ny:0,x:0,y:-400,depth:10};step(r);assert.equal(r.state.tailAbility.ready,false);assert.equal(r.state.edge,0,'second airborne wall gives no refill');
  r.world.floorKick={vy:-22,rescue:true};step(r);assert.equal(r.state.tailAbility.ready,true,'real floor event rearms');}finally{r.dispose();}
});
test('resource/retention tail states are cleared at death/retire/dispose',()=>{
 for(const id of ['spectrum','wings','viper-tails'])for(const how of ['death','retire','dispose']){const {r}=fixture(id);step(r);assert.ok(r.state.tailAbility);if(how==='death'){r.state.invul=0;r.state.hp=1;r.hurt('QA');}else r[how]();assert.equal(r.state.tailAbility,null);assert.equal(tailToolkitReadout(r.state.tailAbility),'');if(how!=='dispose')r.dispose();}
});
test('replacement tails preserve IDs/prices/saves; Viper score and Spectrum grace are actually removed',()=>{
 const v=equipmentRules({tail:'viper-tails'}),s=equipmentRules({tail:'spectrum'});assert.equal(v.viperRetention,true);assert.equal(v.scorePerks.length,0);assert.equal(s.spectrumSequence,true);assert.equal(s.chainGrace,0);
 for(const [id,price]of [['viper-tails',250],['spectrum',600]]){assert.equal(ITEMS.find(i=>i.id===id).price,price);const saved=loadEquipment(JSON.stringify({owned:[id],equipped:{tail:id},presets:[{tail:id}]}));assert.equal(saved.equipped.tail,id);assert.equal(saved.presets[0].tail,id);assert.ok(powerReadout(id).detail);}
});
const rig=(id,view=null,more={})=>{const cv=createCanvas(320,270),c=cv.getContext('2d');c.translate(245,130);c.scale(60,60);drawTailToolkit(c,{equipment:normalizeEquipment({tail:id}),pose:{tailAbility:view,...more},radius:60});return cv.toBuffer('image/png');};
test('seven distinct tail rigs are stable at rest, state balanced and input immutable',()=>{
 const outputs=[];for(const tail of tails){const equipment=normalizeEquipment({tail:tail.id}),pose=Object.freeze({reducedMotion:true}),c=createCanvas(100,100).getContext('2d');c.translate(2,3);c.globalAlpha=.4;const m=c.getTransform();drawTailToolkit(c,{equipment,pose});assert.deepEqual(c.getTransform(),m);assert.equal(c.globalAlpha,.4);outputs.push(rig(tail.id).toString('base64'));assert.deepEqual(rig(tail.id),rig(tail.id));}assert.equal(new Set(outputs).size,7);
});
test('hardware tells real readiness/count/activity; generic pose cannot create jets or light count cells',()=>{
 for(const id of ['wings','ghost','spectrum']){
  const a={kind:id,ready:true,count:0,active:false},b={kind:id,ready:false,count:2,active:true,remaining:120};assert.notDeepEqual(rig(id,a),rig(id,b));assert.deepEqual(rig(id,{...b,kind:'wrong'}),rig(id,null));
 }
 assert.deepEqual(rig('thrusters'),rig('thrusters',null,{lift:1,speed:80,attack:1}));assert.notDeepEqual(rig('thrusters'),rig('thrusters',{kind:'thrusters',action:'jet',flash:1}));assert.deepEqual(rig('thrusters'),rig('thrusters',{kind:'thrusters',action:'jet',flash:1},{reducedMotion:true}));
});
test('enlarged seven-tail studies are labelled illustrations and reduced-motion pixel-stable',()=>{
 for(const tail of tails){const eq=normalizeEquipment({tail:tail.id}),draw=time=>{const cv=createCanvas(640,400),c=cv.getContext('2d'),labels=[],fn=c.fillText.bind(c);c.fillText=(s,...args)=>{labels.push(s);fn(s,...args);};drawShopItemStudy(c,640,400,{equipment:eq,study:shopStudy(tail,time,false,eq)});assert.ok(labels.some(s=>s.includes('ILLUSTRATION')));return cv.toBuffer('image/png');};assert.deepEqual(draw(0),draw(9000));assert.equal(tailToolkitStudy(tail.id).illustration,true);}
});
test('real Thruster cue requires an earned marginal boost; capped/unearned banks leave the nozzles dry',()=>{
 for(const [speed,earned,want]of [[20,true,true],[42,true,false],[20,false,false]]){
  const {r}=fixture('thrusters');try{
   r.dash({x:24,y:0,power:24/42});r.state.sinceDash=earned;setPlayerVelocity(r.world,speed,0);
   r.world.struck={surface:'rail',nx:-1,ny:0,x:0,y:-400,depth:10,arrivalSpeed:speed};step(r);
   assert.equal(r.state.tailAbility.action==='jet',want);
   if(want){near(r.world.player.velocity.x,20*1.14*1.08);assert.ok(r.world.player.velocity.x<=r.world.playerCeiling);}
  }finally{r.dispose();}
 }
});
