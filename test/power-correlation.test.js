import test from 'node:test';
import assert from 'node:assert/strict';
import {createCanvas} from '@napi-rs/canvas';
import {powerChoreography,drawPowerClockwork,drawPowerPayoff,createPowerPayoffs,drawEmberBurn,drawFrostStatus,drawVoltArc,drawVoidField} from '../src/art/splatr-art-engine.js';
import {createEmberBurn} from '../src/ember-burn.js';
import {createFrostControl} from '../src/frost-control.js';
import {createVoltConduction} from '../src/volt-lance.js';
import {createRepriseStroke} from '../src/reprise-stroke.js';
import {createVoidWell} from '../src/void-well.js';
const foe=(id,x=160,kind='bastion')=>({id,x,y:160,px:x,py:160,r:20,kind,hp:10});
const image=draw=>{const canvas=createCanvas(420,340),c=canvas.getContext('2d');draw(c);return canvas.toBuffer('image/png').toString('base64');},blank=image(()=>{});
const frozen=x=>{if(x&&typeof x==='object'&&!Object.isFrozen(x)){Object.freeze(x);Object.values(x).forEach(frozen);}return x;};

test('burn cells come from real two-deadline ledger and actual damage stamp, never predict a hit',()=>{
 const b=createEmberBurn(),e=foe('b'),map=new Map([[e.id,e]]);b.launch(1);b.ignite(e,{primary:true,now:10});
 let q=powerChoreography({enemies:[e],now:10});assert.deepEqual(q.burn[0].remaining,[1,1]);assert.equal(q.burn[0].hit,0);
 q=powerChoreography({enemies:[e],now:28});assert.equal(q.burn[0].remaining[0],0);assert.equal(q.burn[0].hit,0,'deadline alone must not flash');
 b.step(28,map,()=>{});q=powerChoreography({enemies:[e],now:28});assert.equal(q.burn[0].hit,1);assert.equal(q.burn[0].remaining[1],1);
 b.step(46,map,()=>{});assert.equal(powerChoreography({enemies:[e],now:46}).burn.length,0);
});
test('frost shape tracks real freeze versus slow, then immunity without an active tail',()=>{
 const f=createFrostControl(),a=foe('a',160,'fang'),b=foe('b',180),map=new Map([[a.id,a],[b.id,b]]);f.launch(1);f.contact(a,{primary:true,now:5,enemies:map.values()});
 const q=powerChoreography({enemies:map.values(),now:5});assert.deepEqual(q.cold.map(e=>e.kind),['freeze','slow']);assert.ok(q.cold.every(e=>e.active&&e.remaining===1));
 f.advance(23,map);const thaw=powerChoreography({enemies:map.values(),now:23});assert.equal(thaw.cold[0].immune,true);assert.equal(thaw.cold[0].active,false);assert.equal(thaw.cold[1].active,true);
 f.advance(119,map);assert.equal(powerChoreography({enemies:map.values(),now:119}).cold.length,0);
});
test('accepted Volt endpoints only, no phantom arc for a miss, finite flash',()=>{
 const v=createVoltConduction(),center=foe('c'),other=foe('o',210),map=new Map([[center.id,center],[other.id,other]]);v.launch(1);v.contact(center,{primary:true,now:10,enemies:map});
 const q=powerChoreography({state:{volt:{conduction:v.view(11)}},now:11});assert.deepEqual(q.volt.links,[{x:210,y:160,role:'volt'}]);
 assert.equal(powerChoreography({state:{volt:{conduction:v.view(16)}},now:16}).volt,null);
 v.launch(2);v.contact(center,{primary:true,now:20,enemies:new Map()});assert.equal(powerChoreography({state:{volt:{conduction:v.view(21)}},now:21}).volt,null);
});
test('well folds require actual movement in the latest step and expire with field',()=>{
 const w=createVoidWell(),a=foe('a',180),map=new Map([[a.id,a]]);w.launch(1);w.contact(foe('center'),{primary:true,now:10,enemies:map.values()});
 assert.equal(powerChoreography({state:{voidWell:w.view(10)},now:10}).well.targets.length,0);
 w.move(10,1,map);assert.equal(powerChoreography({state:{voidWell:w.view(11)},now:11}).well.targets.length,1);
 const field={...w.view(11),targets:[{x:180,y:160,moved:10,lastMove:0}]};assert.equal(powerChoreography({state:{voidWell:field},now:11}).well.targets.length,0);
 assert.equal(powerChoreography({state:{voidWell:field},now:field.expires}).well,null);
});
test('reprise stitches retain measured bends and are gone at replay, not a new blade',()=>{
 const r=createRepriseStroke();r.admit({point:{x:80,y:160},now:10});r.record({from:{x:80,y:160},to:{x:108,y:160},start:10,end:11});r.record({from:{x:108,y:160},to:{x:108,y:188},start:11,end:12});
 const pending=r.view(15).pending,q=powerChoreography({state:{reprise:r.view(15)},now:15});assert.deepEqual(q.reprise.path,pending.path);assert.equal(q.reprise.path[1].y,160);assert.equal(q.reprise.path.at(-1).x,108);
 assert.equal(powerChoreography({state:{reprise:r.view(22)},now:22}).reprise,null);
});
test('projection is read only, interpolated, culled and bounded to ten statuses per kind',()=>{
 const enemies=Array.from({length:30},(_,i)=>({...foe(i),px:120,emberBurn:{born:0,expires:36,lastHit:-Infinity},frostCold:{phase:'active',kind:'slow',born:0,until:24}}));frozen(enemies);
 const before=JSON.stringify(enemies),q=powerChoreography({enemies,now:5,alpha:.5});assert.equal(q.burn.length,10);assert.equal(q.cold.length,10);assert.equal(q.burn[0].x,140);assert.equal(JSON.stringify(enemies),before);
 assert.equal(powerChoreography({enemies,now:5,view:{x:900,y:900,w:100,h:100}}).burn.length,0);assert.deepEqual(powerChoreography({enemies,now:NaN}).cold,[]);
});
test('clockwork is deterministic, animates on real clocks and restores caller canvas state',()=>{
 const e={...foe('e'),emberBurn:{born:0,expires:36,lastHit:18}};frozen(e);
 const draw=now=>image(c=>{c.translate(4,3);c.globalAlpha=.7;c.setLineDash([3,4]);const matrix=c.getTransform();drawPowerClockwork(c,{enemies:[e],now});assert.equal(c.globalAlpha,.7);assert.deepEqual([...c.getLineDash()],[3,4]);assert.deepEqual(c.getTransform(),matrix);});
 assert.notEqual(draw(19),blank);assert.equal(draw(19),draw(19));assert.notEqual(draw(19),draw(29));assert.equal(image(c=>drawPowerClockwork(c,{enemies:[e],now:36})),blank);
});
test('secondary payoff accepts only real damage callback names, bounded capacity and detached snapshots',()=>{
 const p=createPowerPayoffs();for(const type of ['dash','cut','emberIgnite','voltContact','voidCollapse','repriseFired'])p.event(type,{x:160,y:160});assert.equal(p.snapshot().length,0);
 for(const type of ['emberHit','voltHit','voidHit','repriseHit'])p.event(type,{x:160,y:160});assert.deepEqual(p.snapshot().map(e=>e.kind),['fire','lightning','void','echo']);
 p.event('emberHit',{x:NaN,y:0});assert.equal(p.snapshot().length,4);for(let i=0;i<20;i++)p.event('emberHit',{x:i,y:160});assert.equal(p.snapshot().length,8);const copy=p.snapshot();copy[0].x=999;assert.notEqual(p.snapshot()[0].x,999);p.reset();assert.equal(p.snapshot().length,0);
});
test('payoff pauses, expires, draws without ticking and reset clears it',()=>{
 const p=createPowerPayoffs();p.event('voidHit',{x:160,y:160});const before=JSON.stringify(p.snapshot());p.tick(false);assert.equal(JSON.stringify(p.snapshot()),before);
 const a=image(c=>p.draw(c));assert.notEqual(a,blank);assert.equal(JSON.stringify(p.snapshot()),before);assert.equal(image(c=>p.draw(c,{view:{x:1000,y:1000,w:100,h:100}})),blank);
 for(let i=0;i<24;i++)p.tick();assert.equal(p.snapshot().length,0);assert.equal(image(c=>p.draw(c)),blank);
});
test('four aftermaths are visibly distinct, time limited and available without motion',()=>{
 const frames=new Set();for(const kind of ['fire','lightning','void','echo']){
  const spec={x:160,y:160,kind,index:1};const a=image(c=>drawPowerPayoff(c,{...spec,age:1}));frames.add(a);assert.notEqual(a,blank);assert.notEqual(a,image(c=>drawPowerPayoff(c,{...spec,age:12})));assert.equal(image(c=>drawPowerPayoff(c,{...spec,age:18})),blank);
  assert.equal(a,image(c=>drawPowerPayoff(c,{...spec,age:1})));assert.notEqual(image(c=>drawPowerPayoff(c,{...spec,age:3,motion:false})),blank);
 }assert.equal(frames.size,4);
});
test('burn flickers, Frost entry locks and Volt kink travels; reduced motion removes those transforms',()=>{
 const burn={x:160,y:160,status:{born:0,expires:36,next:18,lastHit:-Infinity}};
 assert.notEqual(image(c=>drawEmberBurn(c,{...burn,now:8})),image(c=>drawEmberBurn(c,{...burn,now:12})));
 assert.equal(image(c=>drawEmberBurn(c,{...burn,now:8,motion:false})),image(c=>drawEmberBurn(c,{...burn,now:12,motion:false})));
 const frost={x:160,y:160,status:{kind:'freeze',phase:'active',born:0,until:18},labels:false};
 assert.notEqual(image(c=>drawFrostStatus(c,{...frost,now:1})),image(c=>drawFrostStatus(c,{...frost,now:4})));
 assert.equal(image(c=>drawFrostStatus(c,{...frost,now:1,motion:false})),image(c=>drawFrostStatus(c,{...frost,now:4,motion:false})));
 const conduction={arc:{born:0,expires:6,origin:{x:120,y:160},links:[{x:260,y:160,role:'volt'}]}};
 assert.notEqual(image(c=>drawVoltArc(c,{conduction,now:1})),image(c=>drawVoltArc(c,{conduction,now:4})));
 assert.equal(image(c=>drawVoltArc(c,{conduction,now:1,motion:false})),image(c=>drawVoltArc(c,{conduction,now:4,motion:false})));
});
test('Void shutter stays in core, field expiry and read-only snapshots remain intact',()=>{
 const field=frozen({phase:'pull',x:160,y:160,born:0,expires:18,radius:84,core:24,targets:[]}),before=JSON.stringify(field);
 assert.notEqual(image(c=>drawVoidField(c,{field,now:3})),image(c=>drawVoidField(c,{field,now:12})));assert.equal(JSON.stringify(field),before);
});
