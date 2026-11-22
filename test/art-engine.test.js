import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,readdirSync} from 'node:fs';
import {createCanvas} from '@napi-rs/canvas';
import {createRun} from '../src/run.js';
import * as art from '../src/art/splatr-art-engine.js';
import {MAX_SPEED,RELEASE_GRAVITY,projectilePoint,releaseSamples} from '../src/physics.js';
const source=readFileSync(new URL('../src/art/splatr-art-engine.js',import.meta.url),'utf8');
const frozen=value=>{if(value&&typeof value==='object'&&!Object.isFrozen(value)){Object.freeze(value);Object.values(value).forEach(frozen);}return value;};

test('art engine is an import-free portable ES module, without DOM/store/physics writes',async()=>{
  assert.doesNotMatch(source,/^\s*import\s/m);
  for(const file of readdirSync(new URL('../src/',import.meta.url),{recursive:true}).filter(p=>p.endsWith('.js')&&p!=='art/splatr-art-engine.js')){
    assert.doesNotMatch(readFileSync(new URL('../src/'+file,import.meta.url),'utf8'),/\.(?:beginPath|fillRect|strokeRect|fillText|drawImage)\s*\(/,'Canvas drawing leaked outside the engine: '+file);
  }
  assert.doesNotMatch(source,/\b(?:document|window)\s*[.\[]|\b(?:localStorage|sessionStorage|ResizeObserver|requestAnimationFrame|getComputedStyle)\s*[.(]/);
  assert.doesNotMatch(source,/\b(?:Matter|Body|Engine|Composite)\s*\.|run\.setView|\.setVelocity\s*\(/);
  const portable=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
  for(const name of ['drawCubeHero','drawShopCardArt','drawSlashEffect','drawEnemyShape','drawWorldBackdrop','drawBestStrokeMini','evaluatePreviewPose','createArtRenderer'])assert.equal(typeof portable[name],'function',name);
  assert.equal(portable.HYBRIDS.length,17);assert.equal(portable.SPARKS.length,18);
});

test('preview pose and drag transitions are repeatable and never mutate snapshots',()=>{
  for(const mode of ['slice','aim','dash','bounce','hit'])for(const time of [0,18,32,48,77,120,241]){
    const a=art.evaluatePreviewPose(mode,time),b=art.evaluatePreviewPose(mode,time);
    assert.deepEqual(a,b);assert.ok(Number.isFinite(a.pose.x)&&Number.isFinite(a.pose.y));
    assert.deepEqual(art.evaluatePreviewPose(mode,987,{}, {motion:false}),art.evaluatePreviewPose(mode,18,{}, {motion:false}));
  }
  let state=art.evaluatePreviewPose('aim',0,{command:{type:'reset'}}).state;
  state=frozen(state);
  const aim=frozen({state,command:{type:'aim',x:466,y:180}});
  const before=JSON.stringify(aim),aimed=art.evaluatePreviewPose('aim',0,aim);
  assert.equal(JSON.stringify(aim),before);assert.equal(aimed.state.drag.x,466);
  const fired=art.evaluatePreviewPose('slice',0,frozen({state:aimed.state,command:{type:'fire',x:466,y:180},step:25}));
  assert.ok(fired.state.x!==state.x);assert.ok(fired.state.hits>=1);
  assert.equal(fired.state.drag,null);assert.equal(aimed.state.hits,0);
});

test('public art API renders every catalogue item and preserves context and specs',()=>{
  const canvas=createCanvas(640,400),ctx=canvas.getContext('2d');
  const eq=Object.fromEntries(art.SLOTS.map(slot=>[slot,art.ITEMS.find(x=>x.slot===slot).id]));
  const stable=()=>[ctx.globalAlpha,ctx.fillStyle,ctx.strokeStyle,ctx.lineWidth,ctx.font,ctx.getTransform().a,ctx.getTransform().b,ctx.getTransform().c,ctx.getTransform().d,ctx.getTransform().e,ctx.getTransform().f];
  for(const item of art.ITEMS){
    const equipment=frozen({...eq,[item.slot]:item.id}),spec=frozen({equipment,time:48,slot:item.slot,selected:true,motion:true});
    const before=JSON.stringify(spec),context=stable();
    art.drawShopCardArt(ctx,300,184,spec);
    art.drawCubeHero(ctx,{equipment,time:48,x:190,y:190,radius:48,cursor:{x:.5,y:-.3},pose:{combo:7,overdrive:true}});
    art.drawSlashEffect(ctx,{id:equipment.slash,x:30,y:200,endX:500,endY:160});
    art.drawWorldBackdrop(ctx,640,400,equipment.world,48,{x:20,y:-400});
    assert.equal(JSON.stringify(spec),before);assert.deepEqual(stable(),context);
  }
  for(const kind of Object.keys(art.legacy_shapes.TYPES)){
    art.drawEnemyShape(ctx,{kind,x:300,y:180,radius:40});art.drawFieldSpecimen(ctx,312,166,kind);
  }
  const stroke=frozen({origin:{x:0,y:0},angle:0,shot:2,kills:1,points:100,equipment:eq,marks:[{x:100,y:-20,r:24,kind:'fang',angle:0,cut:.2,hpBefore:1}]});
  assert.match(art.drawBestStrokeMini(ctx,640,120,stroke),/Stroke 2:.*100 points/);
  assert.ok(canvas.toBuffer('image/png').length>5000);
});

test('standalone main-game rendering never writes game state, bodies or viewport',()=>{
  const ctx=createCanvas(880,710).getContext('2d'),engine=art.createArtRenderer(ctx,{width:880,height:710});
  const run=createRun(42,()=>{}, {staged:true});
  const snapshot=()=>JSON.stringify({state:run.state,position:run.world.player.position,velocity:run.world.player.velocity,clock:run.world.clock,viewport:run.world.viewport});
  const input={...run,setView(){throw Error('renderer must not invoke a game setter');}};
  try{for(let i=0;i<3;i++){const before=snapshot();engine.tick(input,true);engine.draw(input,.5,null,true);assert.equal(snapshot(),before);}}finally{engine.dispose();run.dispose();}
});

test('engine analytic prediction remains in sync with gameplay physics constants',()=>{
  // Rendering must stay standalone without silently drifting from the real shot.
  assert.match(source,new RegExp(`var MAX_SPEED = ${MAX_SPEED};`));
  for(const t of [0,1,20,90]){
    const p=projectilePoint({x:12,y:34},{x:20,y:-15},t);
    assert.equal(p.y,34-15*t+.5*RELEASE_GRAVITY*t*t);
  }
  for(const velocity of [{x:15,y:-18},{x:42,y:-42},{x:0,y:10}])for(const limits of [{},{minVy:-26,maxVy:10},{ceiling:280}]){
    const start={x:12,y:-34},samples=releaseSamples(start,velocity,art.aimVisuals.ARC.maxTicks,limits);
    const path=art.aimVisuals.arcPath(start,velocity,limits);
    assert.deepEqual(path.points,samples.filter((_,i)=>i>0&&i%art.aimVisuals.ARC.step===0));
  }
});
