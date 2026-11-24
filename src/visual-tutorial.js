import {createRun} from './run.js';
// The course is authored against fixed room bounds. CHUNK 1 grew the shared
// wave arena ~1.3x for the field game; pinning the tutorial to its authored
// room keeps the handcrafted gates, walls and scripted bank legible instead of
// stretching them across a bigger table they were never tuned for.
const TUTORIAL_ARENA = Object.freeze({x:-900,y:-1250,w:1800,h:1550});
import {placePlayer,stopPlayer} from './physics.js';
import {zoneHits} from './slasher.js';
import Matter from 'matter-js';

// Four adjoining rooms in one continuous, fixed coordinate system. Openings are
// deliberately wider than the rotating cube. A gate occupies each opening until
// its objective is completed and the blade actually reaches it.
const GATES=Object.freeze([
 {x:0,y:-170,w:30,h:260,axis:'x',direction:1},
 {x:650,y:-475,w:260,h:30,axis:'y',direction:-1},
 {x:0,y:-850,w:30,h:250,axis:'x',direction:-1},
 {x:-525,y:-1095,w:250,h:30,axis:'y',direction:-1},
]);
const WALLS=Object.freeze([
 {x:-15,y:-1250,w:30,h:275},{x:-15,y:-725,w:30,h:425},{x:-15,y:-40,w:30,h:340},
 {x:-900,y:-490,w:1420,h:30},{x:780,y:-490,w:120,h:30},
 {x:-900,y:-1110,w:250,h:30},{x:-400,y:-1110,w:400,h:30},
]);

// CHUNK 5 — THE LEARNING GROUND's course banners. Every room has ONE
// sentence for what to do and ONE for why the room exists. The why is the
// difference between a player performing and a player learning.
export const TUTORIAL_LINES=Object.freeze({
 0:Object.freeze({title:'THE RACK',why:'The blade is short. Let the shapes come to you — cut all three.'}),
 1:Object.freeze({title:'THE WALL',why:'Speed is the whole game. Bank off the marked wall.'}),
 2:Object.freeze({title:'THE RIFT',why:'It only fights what it can see. Step close — when the red circle comes, be outside it.'}),
 3:Object.freeze({title:'THE CROWN',why:'Three plates stand between you and the field.'}),
});
// After this many ticks with no objective-relevant progress, the guide
// escalates from instruction to directive. ~6.5 seconds at 60Hz.
export const STALL_TICKS=390;
/** The why-line under the banner. Reads the same state the gate reads. */
export function tutorialWhy(visual,enemies=null){
 const line=TUTORIAL_LINES[Math.min(Math.max(visual?.stage|0,0),3)];
 if(!line)return '';
 if(visual.stage===2){
  if(visual.dodged)return 'Two targets remain — cut the Rift, then the Fang.';
  const mode=enemies?.get?.('tutorial/rift')?.mode;
  if(mode==='idle'||mode==null)return 'It sleeps beyond its ring. Stepping closer WAKES it — that is the lesson.';
  if(mode==='tell')return 'The red circle is its one dangerous moment. Be outside it.';
  if(mode==='recover'||mode==='attack')return 'It just struck. Wait for the next circle — then be outside it.';
  return 'It is awake. Watch for the red circle.';
 }
 if(visual.stage===1)return (visual.gateReady||visual.gateBroken)?'The bank is the mechanic. The rest of the game is more of this.':'The bank sets up everything after it. Aim for the wall, not the room.';
 return line.why;
}

/** Resolve the next visual cue from real objectives and enemy warning state.
 * No cue opens a gate, changes combat, or automatically plays an input. */
// A real, reachable point outside the live circle, kept inside the room and
// visible viewport. The diamond is a tap destination, never another hazard.
export function tutorialEscapeTarget(zone,p,rift,view) {
 const bounded=(x,y)=>({x:Math.max(55,Math.min(845,x)),y:Math.max(-1050,Math.min(-550,y))});
 const candidates=[];
 for(const [dx,dy] of [[1,0],[-1,0],[0,-1],[0,1]])for(const distance of [210,170,260,140]){
  const q=bounded(p.x+dx*distance,p.y+dy*distance),actual=Math.hypot(q.x-p.x,q.y-p.y);
  if(actual<100||zoneHits(zone,q,q,40))continue;
  const visible=!view?.scale||((q.x-view.x)*view.scale>=34&&(q.x-view.x)*view.scale<=view.width-34&&(q.y-view.y)*view.scale>=72&&(q.y-view.y)*view.scale<=view.height-48);
  const enemyDistance=Math.hypot(q.x-rift.x,q.y-rift.y);
  candidates.push({...q,dx,dy,visible,score:(visible?2000:0)+Math.min(enemyDistance,400)+(dy===0?500:0)-Math.abs(actual-210)});
 }
 candidates.sort((a,b)=>b.score-a.score);
 return candidates[0]||bounded(p.x+(p.x<450?230:-230),p.y-120);
}

export function tutorialGuide(visual, enemies, p, view=null) {
 if(visual.stage>=4)return null;
 const living=[...enemies.values()];
 if(visual.gateReady){
  const q=visual.gateTarget;if(!q)return null;
  return visual.gateBroken
   ? {kind:'cross',id:'cross',x:q.x+(q.axis==='x'?q.direction*145:0),y:q.y+(q.axis==='y'?q.direction*145:0)}
   : {kind:'gate',id:'gate',x:q.x,y:q.y};
 }
 if(visual.stage===0){const rack=living.filter(e=>e.id.startsWith('tutorial/rack/'));const e=rack[Math.floor(rack.length/2)];return e?{kind:'slice',id:e.id,x:e.x,y:e.y,r:e.r}:null;}
 if(visual.stage===1)return {kind:'bank',id:'bank',x:visual.wallX,y:p.y};
 if(visual.stage===2&&!visual.dodged){
  const rift=enemies.get('tutorial/rift');if(!rift)return null;
  const zone=rift.mode==='tell'?rift.attackZone:null;
  if(zone&&zoneHits(zone,p,p)){
   const target=tutorialEscapeTarget(zone,p,rift,view);
   return {kind:'dodge',id:rift.attackId,x:target.x,y:target.y,dx:target.dx??Math.sign(target.x-p.x),dy:target.dy??Math.sign(target.y-p.y),urgent:true};
  }
  if(visual.escapePending)return {kind:'resolve',id:rift.attackId,x:rift.x,y:rift.y};
  if(zone)return {kind:'wait-next',id:rift.attackId,x:rift.x,y:rift.y};
  const distance=Math.hypot(rift.x-p.x,rift.y-p.y);
  if(distance>620)return {kind:'approach',id:rift.id,x:rift.x-(rift.x-p.x)*300/distance,y:rift.y-(rift.y-p.y)*300/distance};
  const left=p.x-50,right=850-p.x,side=right>=left?1:-1;
  return {kind:'watch',id:rift.id,x:rift.x,y:rift.y,r:rift.r,safeX:Math.max(50,Math.min(850,p.x+side*210)),safeY:p.y};
 }
 const e=living.find(e=>e.id==='tutorial/crown')||living.find(e=>e.id==='tutorial/fang'||e.id==='tutorial/rift');
 return e?{kind:'slice',id:e.id,x:e.x,y:e.y,r:e.r,hp:e.hp}:null;
}

/** A concise instruction based on the same state that controls the gate. */
export function riftObjective(visual,enemies,device='touch') {
 if(visual.stage!==2)return '';
 if(visual.gateReady)return visual.gateBroken?'3/3 · GO THROUGH THE OPEN GATE':'3/3 · SLICE THE GLOWING GATE';
 if(visual.dodged){const left=['tutorial/rift','tutorial/fang'].filter(id=>enemies.has(id)).length;return `${visual.successTicks>0?'GOOD! ':''}2/3 · SLICE SHAPES · ${left} LEFT`;}
 const kind=visual.guide?.kind;
 const stall=visual.stall;
 if(kind==='dodge')return device==='keys'?`1/3 · HOLD ${escapeDirection(visual.guide).toUpperCase()} ARROW + SPACE`:`1/3 · ${device==='mouse'?'CLICK':'TAP'} THE GREEN DIAMOND`;
 if(kind==='resolve')return '1/3 · STAY OUTSIDE UNTIL IT STRIKES';
 if(kind==='wait-next')return stall?'GO — WAIT FOR THE RED CIRCLE, THEN BE OUTSIDE IT':'1/3 · WAIT FOR THE NEXT RED CIRCLE';
 if(visual.dodgeFeedback>0)return 'MISSED · WAIT FOR THE NEXT RED CIRCLE';
 if(kind==='approach')return stall?'GO — STEP INTO THE RING, THE CIRCLE COMES NEXT':'1/3 · STEP INTO THE RING · IT WAKES WHEN YOU GET CLOSE';
 if(kind==='watch')return stall?'GO — WAIT FOR THE CIRCLE, THEN BE OUTSIDE IT':'1/3 · WAIT FOR THE RED CIRCLE';
 return '1/3 · IT IS AWAKE · WAIT FOR THE RED CIRCLE';
}

function escapeDirection(guide) {
 return Math.abs(guide?.dx||0)>=Math.abs(guide?.dy||0)?(guide?.dx<0?'left':'right'):(guide?.dy<0?'up':'down');
}
/** Directional equivalent for players who cannot see the diamond. */
export function tutorialAnnouncement(visual,objective,device='touch') {
 if(visual.stage!==2||visual.guide?.kind!=='dodge')return objective;
 const direction=escapeDirection(visual.guide);
 const where={left:'to the left of',right:'to the right of',up:'above',down:'below'}[direction];
 return device==='keys'?`Hold the ${direction} arrow key and press Space to escape the red circle.`:`${device==='mouse'?'Click':'Tap'} ${where} your cube, outside the red circle.`;
}

/** One short action at the edge of the screen for every live room. */
export function tutorialObjective(visual,enemies,device='touch') {
 if(visual.stage===2)return riftObjective(visual,enemies,device);
 if(visual.stage>=4)return '';
 if(visual.gateReady)return visual.gateBroken?'GO THROUGH THE OPEN GATE':'SLICE THE GLOWING GATE';
 if(visual.stage===0){
  const left=[...enemies.keys()].filter(id=>id.startsWith('tutorial/rack/')).length;
  const action=`${device==='keys'?'ARROWS + SPACE':device==='mouse'?'CLICK A SHAPE':'TAP A SHAPE'} · ${left} LEFT`;
  return visual.stall?`${action} — IT CANNOT HIT BACK, CUT FREELY`:action;
 }
 if(visual.stage===1)return visual.stall?'GO — THE WALL IS MARKED, HIT IT':'BOUNCE OFF THE GLOWING RIGHT WALL';
 const crown=enemies.get('tutorial/crown');
 return crown?(visual.stall?`GO — ${crown.hp} ${crown.hp===1?'HIT':'HITS'} LEFT · BREAK THE PLATES`:`SLICE THE SHAPE · ${crown.hp} ${crown.hp===1?'HIT':'HITS'} LEFT`):'';
}

/** One isolated physical course: opening a door never moves the player's body. */
export function createVisualTutorial(seed,emit=()=>{}) {
 let run,stage=0,pending=null,finished=false,gateBody=null,gateRect=null,riftTell=null,refillTicks=0,gateTouch=false,parries=0;
 const structures=[];
 const visual={stage:0,age:0,guideUsed:false,guideFade:1,wallX:null,gate:null,gateTarget:GATES[0],gateReady:false,gateBroken:false,walls:[...WALLS],dodged:false,bumpAttempts:0,bumpCooldown:0,bumpFlash:0,finishDelay:0,wallAlpha:.22,guide:null,guideClock:0,guideIdle:150,guideVisible:true,guideEngaged:false,stall:false,stallTicks:0,progressSig:''};
 function event(type,data){
  emit(type,data);
  if(stage===1&&type==='bank'&&data.nx<-.5)pending='bank';
  if(stage===2&&type==='parry')parries++;
 }
 run=createRun(seed,event,{waveMode:true,controlPractice:true,arena:TUTORIAL_ARENA});
 const s=run.state;s.visualTutorial=visual;s.teachingArena=true;s.tutorialActive=true;s.wave.phase='combat';s.wave.entry=0;s.invul=0;s.edge=s.edgeMax=3;
 // Move the existing launch pad, not the player after a transition. All four
 // rooms stay inside the real wave arena used by both physics and enemy AI.
 const pad=run.world.geometry[0],padBody=run.world.engine.world.bodies.find(b=>b.isStatic&&!b.isSensor);
 // The level's PAD is shared globally. Clone the rectangle before translating
 // it, so Learn replays and the subsequent normal run keep the standard pad.
 run.world.geometry[0]={...pad,x:pad.x-400};Matter.Body.translate(padBody,{x:-400,y:0});
 placePlayer(run.world,{x:-400,y:0});stopPlayer(run.world);Object.assign(run.world.player.plugin.previous,{x:-400,y:0,angle:run.world.player.angle});
 const gateCollision=({pairs})=>{for(const pair of pairs){const a=pair.collision.parentA,b=pair.collision.parentB;if(gateBody&&((a===gateBody&&b===run.world.player)||(b===gateBody&&a===run.world.player)))gateTouch=true;}};
 Matter.Events.on(run.world.engine,'collisionStart collisionActive',gateCollision);
 function addSolid(rect,label){
  const geometry={...rect},body=Matter.Bodies.rectangle(rect.x+rect.w/2,rect.y+rect.h/2,rect.w,rect.h,{isStatic:true,label,friction:0,restitution:.25});
  run.world.geometry.push(geometry);Matter.Composite.add(run.world.engine.world,body);return {geometry,body};
 }
 function removeSolid(solid){if(!solid)return;Matter.Composite.remove(run.world.engine.world,solid.body);const i=run.world.geometry.indexOf(solid.geometry);if(i>=0)run.world.geometry.splice(i,1);}
 for(const rect of WALLS)structures.push(addSolid(rect,'tutorial-wall'));
 function spawn(kind,id,x,y,options={}){return run.combat.add({id,kind,x,y,home:'tutorial',wave:true,wavePlaced:true,delay:35,...options});}
 function removeGate(){if(gateBody)removeSolid({body:gateBody,geometry:gateRect});gateBody=gateRect=null;}
 function installGate(q){removeGate();if(!q)return;const solid=addSolid({x:q.x-q.w/2,y:q.y-q.h/2,w:q.w,h:q.h},'tutorial-gate');gateBody=solid.body;gateRect=solid.geometry;}
 for(let i=0;i<3;i++)spawn('fang',`tutorial/rack/${i}`,-305+i*62,-54-i*35,{pinned:true});
 installGate(GATES[0]);
 function enter(next){
  stage=visual.stage=next;visual.age=0;visual.gateReady=false;visual.gateBroken=false;visual.guideIdle=150;visual.guideClock=0;pending=null;visual.stall=false;visual.stallTicks=0;visual.progressSig='';
  s.edge=3;s.focus=1;run.combat.hazards.length=0;visual.wallX=next===1?TUTORIAL_ARENA.x+TUTORIAL_ARENA.w:null;
  visual.gateTarget=GATES[next]||null;
  if(next===2){visual.dodged=false;riftTell=null;run.world.tutorialEnemyBounds={x:15,y:-1095,w:885,h:605};spawn('rift','tutorial/rift',535,-665,{gentle:true,tutorialTargetPlayer:true,delay:45,wakeAt:330});}
  if(next===3){run.world.tutorialEnemyBounds=null;spawn('crown','tutorial/crown',-180,-810,{pinned:true});}
  if(next===4)visual.finishDelay=42;
  installGate(visual.gateTarget);
 }
 function updateDodge(){
  const e=run.combat.enemies.get('tutorial/rift'),p=run.world.player.position;
  if(!e||visual.dodged)return;
  if(e.mode==='tell'&&e.attackZone){
   if(!riftTell||riftTell.id!==e.attackId)riftTell={id:e.attackId,zone:e.attackZone,shots:s.shots,bumps:visual.bumpAttempts,parries,threatened:false};
   if(!riftTell.threatened&&zoneHits(riftTell.zone,p,p)){riftTell.threatened=true;riftTell.shots=s.shots;riftTell.bumps=visual.bumpAttempts;riftTell.parries=parries;}
   // Give time to read before input, then resolve the real strike promptly
   // after a clean escape so a long wait cannot bounce the cube back into it.
   if(riftTell.threatened&&s.shots>riftTell.shots&&visual.bumpAttempts===riftTell.bumps&&parries===riftTell.parries&&!zoneHits(riftTell.zone,p,p))e.clock=Math.min(e.clock,3);
  }else if(riftTell&&e.attackId===riftTell.id&&e.mode==='recover'){
   if(riftTell.threatened&&s.shots>riftTell.shots&&visual.bumpAttempts===riftTell.bumps&&parries===riftTell.parries&&!zoneHits(riftTell.zone,p,p)){
    visual.dodged=true;visual.successTicks=120;s.edge=Math.max(2,s.edge);
    // Introduce the Fang only after the real escape. One verb at a time; the
    // new target is placed clear of both the player and the recovering Rift.
    const side=p.x<450?1:-1,x=Math.max(70,Math.min(830,p.x+side*240)),y=Math.max(-1010,Math.min(-570,p.y-100));
    spawn('fang','tutorial/fang',x,y,{delay:120});emit('tutorialDodge',{x:p.x,y:p.y});
   }else visual.dodgeFeedback=120;
   riftTell=null;
  }else if(e.mode!=='tell')riftTell=null;
 }
 let guideKey='';
 function updateGuide(){
  visual.escapePending=!!(riftTell?.threatened&&s.shots>riftTell.shots&&riftTell.zone&&!zoneHits(riftTell.zone,run.world.player.position,run.world.player.position));
  const next=tutorialGuide(visual,run.combat.enemies,run.world.player.position,run.world.viewport),key=next?`${next.kind}/${next.id}`:'';
  if(key!==guideKey){guideKey=key;visual.guideClock=0;visual.guideIdle=150;}
  else visual.guideClock++;
  const wasVisible=visual.guideVisible;visual.guide=next;visual.guideVisible=!!next&&(next.kind==='dodge'||(!visual.guideEngaged&&!s.held&&(visual.stage===2||!!next.urgent||visual.guideIdle>=100)));
  if(visual.guideVisible&&!wasVisible)visual.guideClock=0;
 }
 updateGuide();
 return {run,visual,get stage(){return stage;},get finished(){return finished;},
  interact(){visual.guideUsed=true;visual.guideIdle=0;visual.guideVisible=false;},
  tick(engaged=false){
   if(finished)return;
   visual.guideEngaged=!!engaged;
   visual.age++;
   // ── CHUNK 5: STALL ESCALATION ─────────────────────────────────────
   // Track objective-relevant progress per room; nothing changes → the
   // banner escalates from instruction to directive.
   const progress=(()=>{
    if(stage===0)return `rack:${[...run.combat.enemies.keys()].filter(id=>id.startsWith('tutorial/rack/')).length}`;
    if(stage===1)return `bank:${Number(pending==='bank')}:${Number(visual.gateReady)}`;
    if(stage===2){const rift=run.combat.enemies.get('tutorial/rift');return `rift:${Number(visual.dodged)}:${rift?.mode||'gone'}:${run.combat.enemies.size}`;}
    if(stage===3){const crown=run.combat.enemies.get('tutorial/crown');return `crown:${crown?crown.hp:'gone'}`;}
    return 'end';})();
   if(progress!==visual.progressSig){visual.progressSig=progress;visual.stallTicks=0;visual.stall=false;}
   else if(++visual.stallTicks>STALL_TICKS)visual.stall=true;
   if(visual.guideEngaged)visual.guideIdle=0;else visual.guideIdle++;visual.wallAlpha+=((s.held?.08:.22)-visual.wallAlpha)*.18;visual.bumpCooldown=Math.max(0,visual.bumpCooldown-1);visual.bumpFlash=Math.max(0,visual.bumpFlash-1);visual.dodgeFeedback=Math.max(0,(visual.dodgeFeedback||0)-1);visual.successTicks=Math.max(0,(visual.successTicks||0)-1);
   visual.guideFade=Math.max(0,visual.guideFade-(visual.guideUsed?.08:0));
   if(visual.gate&&++visual.gate.age>32)visual.gate=null;
   if(stage===4){if(--visual.finishDelay<=0)finished=true;updateGuide();return;}
   if(stage===2)updateDodge();
   // No dead-end if a player spends the last dash while resting on a room wall.
   if(s.edge<=0){if(++refillTicks>=75){s.edge=1;refillTicks=0;}}else refillTicks=0;
   const complete=(stage===0&&![...run.combat.enemies.keys()].some(id=>id.startsWith('tutorial/rack/')))||(stage===1&&pending==='bank')||(stage===2&&visual.dodged&&!run.combat.enemies.has('tutorial/fang')&&!run.combat.enemies.has('tutorial/rift'))||(stage===3&&!run.combat.enemies.has('tutorial/crown'));
   visual.gateReady=complete;
   const p=run.world.player.position,q=visual.gateTarget;
   // Breaking opens a real passage; room state changes only after crossing it.
   if(!visual.gateBroken&&complete&&q&&s.blade>0&&gateTouch){
    visual.gate={x:q.x,y:q.y,age:0};visual.gateBroken=true;removeGate();
   }
   gateTouch=false;
   if(visual.gateBroken&&q&&(p[q.axis]-q[q.axis])*q.direction>60){
    // A shutter closes behind the cube after the crossing. This keeps gravity
    // from dropping a player into an earlier room and stranding the encounter.
    if(stage<3){const rect={x:q.x-q.w/2,y:q.y-q.h/2,w:q.w,h:q.h};structures.push(addSolid(rect,'tutorial-shutter'));visual.walls.push(rect);}
    enter(stage+1);
   }
   updateGuide();
  },dispose(){Matter.Events.off(run.world.engine,'collisionStart collisionActive',gateCollision);removeGate();for(const wall of structures)removeSolid(wall);run.dispose();}
 };
}
