import test from 'node:test';
import assert from 'node:assert/strict';
import {createCanvas} from '@napi-rs/canvas';
import {createVisualTutorial,tutorialGuide,tutorialEscapeTarget,riftObjective,tutorialObjective,tutorialAnnouncement} from '../src/visual-tutorial.js';
import {enemyAttackZone,drawTutorialGuidance} from '../src/art/splatr-art-engine.js';
import {zoneHits} from '../src/slasher.js';

const enemy=(id,x,y,r=30)=>({id,x,y,r,hp:1});
test('objective cue follows real targets, gate state, and the actual Rift warning',()=>{
 const p={x:300,y:-700},rack=new Map([['tutorial/rack/0',enemy('tutorial/rack/0',100,0)],['tutorial/rack/1',enemy('tutorial/rack/1',140,0)]]);
 const lesson={stage:0,gateReady:false,gateBroken:false};
 assert.equal(tutorialGuide(lesson,rack,p).id,'tutorial/rack/1');
 lesson.gateReady=true;lesson.gateTarget={x:0,y:-170,axis:'x',direction:1};assert.equal(tutorialGuide(lesson,rack,p).kind,'gate');
 lesson.gateBroken=true;assert.deepEqual(tutorialGuide(lesson,rack,p),{kind:'cross',id:'cross',x:145,y:-170});
 Object.assign(lesson,{stage:1,gateReady:false,wallX:900});assert.deepEqual(tutorialGuide(lesson,rack,p),{kind:'bank',id:'bank',x:900,y:-700});
 const rift={...enemy('tutorial/rift',500,-700),mode:'idle'},enemies=new Map([[rift.id,rift]]);Object.assign(lesson,{stage:2,dodged:false});
 assert.equal(tutorialGuide(lesson,enemies,p).kind,'watch');
 rift.mode='tell';rift.attackId='real-warning';rift.attackZone=enemyAttackZone('rift',p.x,p.y,0,30);
 const dodge=tutorialGuide(lesson,enemies,p);assert.equal(dodge.kind,'dodge');assert.equal(dodge.id,'real-warning');assert.equal(zoneHits(rift.attackZone,dodge,dodge),false);
 rift.attackZone=enemyAttackZone('rift',750,-900,0,30);assert.notEqual(tutorialGuide(lesson,enemies,p).kind,'dodge');
 lesson.dodged=true;assert.equal(tutorialGuide(lesson,enemies,p).kind,'slice');
});

test('guide animation advances while ready, returns after inactivity, and hides while aiming',()=>{
 const course=createVisualTutorial(2);try{
  assert.equal(course.run.state.phase,'ready');assert.equal(course.visual.guide.kind,'slice');assert.ok(course.visual.guideVisible);
  const clock=course.visual.guideClock;for(let i=0;i<8;i++){course.run.tick();course.tick();}
  assert.ok(course.visual.guideClock>clock);assert.equal(course.run.world.clock,0);
  course.interact();assert.equal(course.visual.guideVisible,false);
  for(let i=0;i<100;i++){course.run.tick();course.tick();}assert.equal(course.visual.guideVisible,true);
  course.tick(true);assert.equal(course.visual.guideVisible,false);
  course.tick(false);assert.equal(course.visual.guideVisible,false);for(let i=0;i<100;i++)course.tick(false);assert.equal(course.visual.guideVisible,true);
 }finally{course.dispose();}
});

test('drawn guidance animates without altering context; reduced motion is a stable explanation',()=>{
 const view={x:0,y:0,width:390,height:680,scale:1},player={x:150,y:440};
 const lesson={guideVisible:true,guideClock:20,guide:{kind:'slice',x:260,y:330,r:20}};
 const render=(motion,clock,device='touch')=>{const c=createCanvas(390,680).getContext('2d');c.globalAlpha=.71;const transform=c.getTransform();drawTutorialGuidance(c,view,{...lesson,guideClock:clock},player,motion,device);assert.equal(c.globalAlpha,.71);assert.deepEqual(c.getTransform(),transform);return Buffer.from(c.getImageData(0,0,390,680).data);};
 assert.notDeepEqual(render(true,20),render(true,90),'hand and ghost move');
 assert.deepEqual(render(false,20),render(false,90),'reduced motion holds a stable explanatory frame');
 assert.notDeepEqual(render(false,20,'mouse'),render(false,20,'touch'),'pointer-specific illustration');
});

test('Rift objective names the current input, retry, progress and physical gate',()=>{
 const v={stage:2,dodged:false,gateReady:false,guide:{kind:'watch'}},e=new Map([['tutorial/rift',{}]]);
 assert.equal(riftObjective(v,e),'1/3 · WAIT FOR THE RED CIRCLE');
 v.guide={kind:'dodge',dx:-1,dy:0};assert.equal(riftObjective(v,e),'1/3 · TAP THE GREEN DIAMOND');
 assert.equal(riftObjective(v,e,'mouse'),'1/3 · SHIFT+CLICK THE GREEN DIAMOND');assert.equal(riftObjective(v,e,'keys'),'1/3 · HOLD LEFT ARROW + SPACE');
 assert.equal(tutorialAnnouncement(v,'x','touch'),'Tap to the left of your cube, outside the red circle.');assert.equal(tutorialAnnouncement(v,'x','keys'),'Hold the left arrow key and press Space to escape the red circle.');v.guide={kind:'dodge',dx:0,dy:-1};assert.equal(tutorialAnnouncement(v,'x','touch'),'Tap above your cube, outside the red circle.');
 v.guide.kind='resolve';assert.equal(riftObjective(v,e),'1/3 · STAY OUTSIDE UNTIL IT STRIKES');
 v.guide.kind='wait-next';assert.equal(riftObjective(v,e),'1/3 · WAIT FOR THE NEXT RED CIRCLE');
 v.guide.kind='watch';v.dodgeFeedback=50;assert.equal(riftObjective(v,e),'MISSED · WAIT FOR THE NEXT RED CIRCLE');
 v.dodged=true;v.successTicks=50;e.set('tutorial/fang',{});assert.equal(riftObjective(v,e),'GOOD! 2/3 · SLICE SHAPES · 2 LEFT');
 v.successTicks=0;e.delete('tutorial/rift');assert.equal(riftObjective(v,e),'2/3 · SLICE SHAPES · 1 LEFT');
 v.gateReady=true;assert.equal(riftObjective(v,e),'3/3 · SLICE THE GLOWING GATE');v.gateBroken=true;assert.equal(riftObjective(v,e),'3/3 · GO THROUGH THE OPEN GATE');
 v.stage=3;assert.equal(riftObjective(v,e),'');
});

test('escape diamond stays in the visible room and outside the actual danger near walls',()=>{
 const view={x:0,y:-1100,width:450,height:350,scale:.5},rift={x:450,y:-750};
 for(const p of [{x:100,y:-900},{x:800,y:-650},{x:450,y:-800},{x:100,y:-600},{x:800,y:-1000}]){
  const zone=enemyAttackZone('rift',p.x,p.y,0,30),q=tutorialEscapeTarget(zone,p,rift,view);
  assert.equal(zoneHits(zone,q,q,40),false,JSON.stringify({p,q}));
  assert.ok(q.x>=55&&q.x<=845&&q.y>=-1050&&q.y<=-550);
  assert.ok((q.x-view.x)*view.scale>=34&&(q.x-view.x)*view.scale<=view.width-34);
  assert.ok((q.y-view.y)*view.scale>=72&&(q.y-view.y)*view.scale<=view.height-48);
 }
});

test('escape indicator remains visible while aiming and reduced motion is stable',()=>{
 const v={x:0,y:0,width:390,height:680,scale:1},p={x:180,y:350};
 const lesson={guideVisible:true,guideClock:20,guide:{kind:'dodge',x:280,y:350}};
 const render=(motion,clock,device)=>{const c=createCanvas(390,680).getContext('2d');drawTutorialGuidance(c,v,{...lesson,guideClock:clock},p,motion,device);return Buffer.from(c.getImageData(0,0,390,680).data);};
 assert.deepEqual(render(false,20,'touch'),render(false,90,'touch'));assert.notDeepEqual(render(false,20,'touch'),render(false,20,'keys'));
});

test('every room has a short action and real progress',()=>{
 const v={stage:0,gateReady:false},rack=new Map([['tutorial/rack/0',{}],['tutorial/rack/1',{}]]);
 assert.equal(tutorialObjective(v,rack,'touch'),'TAP A SHAPE · 2 LEFT');assert.equal(tutorialObjective(v,rack,'keys'),'ARROWS + SPACE · 2 LEFT');
 v.gateReady=true;assert.equal(tutorialObjective(v,rack),'SLICE THE GLOWING GATE');v.gateBroken=true;assert.equal(tutorialObjective(v,rack),'GO THROUGH THE OPEN GATE');
 Object.assign(v,{stage:1,gateReady:false});assert.equal(tutorialObjective(v,rack),'BOUNCE OFF THE GLOWING RIGHT WALL');
 v.stage=3;assert.equal(tutorialObjective(v,new Map([['tutorial/crown',{hp:3}]])),'SLICE THE SHAPE · 3 HITS LEFT');
 v.stage=4;assert.equal(tutorialObjective(v,rack),'');
});
