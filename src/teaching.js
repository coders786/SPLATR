import {createRun} from './run.js';
import {placePlayer,stopPlayer,setBulletTime} from './physics.js';

/** Real combat lessons. Copy describes normal rules; no simulated attacks. */
export const TEACHING_SCENARIOS=Object.freeze([
 {id:'slash',name:'SLASH WINDOW',kind:'fang',count:3},
 {id:'fang',name:'FANG / TRIANGLE',kind:'fang'},
 {id:'pulse',name:'PULSE / CIRCLE',kind:'pulse'},
 {id:'prism',name:'PRISM / DIAMOND',kind:'prism'},
 {id:'link',name:'LINKED PRISMS',kind:'prism',count:2},
 {id:'fork',name:'FORK / CROSS',kind:'fork'},
 {id:'bastion',name:'BASTION / SHIELD',kind:'bastion'},
 {id:'rift',name:'RIFT / STAR',kind:'rift'},
 {id:'well',name:'WELL / PENTAGON',kind:'well'},
 {id:'crown',name:'CROWN / OCTAGON',kind:'crown'},
 {id:'monolith',name:'MONOLITH / THE LANDLORD',kind:'monolith'},
].map(Object.freeze));

// The original guided adapter remains available to old integrations and tests.
// The shipped lesson dialog uses THE_WATCH below: it never pauses the real run
// behind a NEXT button.
export const TEACHING_STEPS=Object.freeze({
 slash:[['launch','LAUNCH','Aim at a target and release. In slingshot mode, pull away and release; longer pulls launch harder. A launch briefly activates your blade.'],['cut','CUT','Cross a target before the slash ends. A cut extends the blade and returns Edge.'],['clear','FINISH','Cut all three targets. You can reset or skip a lesson at any time.']],
 fang:[['tell','WATCH THE WARNING','The pointed lane shows where Fang will charge. Its body is safe during the warning.'],['attack','WATCH THE CHARGE','The bright chevron marks the charging body. Only this active charge hurts on contact.'],['clear','TRY IT','Dodge the lane, then launch through Fang while your blade is active.']],
 pulse:[['tell','WATCH THE WIND-UP','Look for the concentric rings gathering around Pulse.'],['attack','WATCH THE RING','The expanding rim is dangerous; the space behind it is safe.'],['clear','TRY IT','Dodge the rim or early-parry it at the start of a dash, then cut Pulse.']],
 prism:[['tell','WATCH THE SIGHTLINE','The dashed line shows the needle’s locked direction.'],['attack','WATCH THE SHOT','The moving needle hurts; the dashed warning line itself does not.'],['clear','TRY IT','Move off the line or cut toward the needle with an active blade, then cut Prism.']],
 link:[['tell','WATCH THE LINK','The line between these two Prisms charges before becoming dangerous.'],['attack','WATCH THE BEAM','The live beam hurts along the line between the two sentries.'],['clear','TRY IT','Cut either sentry to stop its link; clear both to finish. Early dash parry can block the beam.']],
 fork:[['tell','WATCH THE CROSS','The dashed cross marks a Fork swipe. Its body is still safe to touch.'],['attack','WATCH THE SWIPE','The solid cross is the active strike. Leave it or early-parry through it.'],['split','CUT THE FORK','Launch through the cross-shaped enemy. It splits into two small Fangs.'],['clear','CLEAR THE OFFSPRING','Cut both small Fangs. Their bodies hurt only while charging.']],
 bastion:[['tell','WATCH THE WEDGE','Bastion marks the direction and area of its shield slam.'],['attack','WATCH THE SLAM','The solid wedge is the active strike. Move out or early-parry it.'],['armor','CRACK THE ARMOR','Cut Bastion once. The first plate breaks and interrupts its attack.'],['clear','BREAK THE LAST PLATE','Launch through it again. Armor upgrades can remove more plates per cut.']],
 rift:[['approach','STEP INTO ITS RING','The Rift only fights what it can see. Beyond its dashed ring it sleeps; step inside it and it wakes.'],['tell','WATCH THE WARNING','The dashed circle marks where Rift will blink and strike. Leave the circle.'],['clear','TRY IT','Cut Rift before the blink to interrupt it, or follow after the strike. The body itself never hurts.']],
 monolith:[['approach','GET UNDER IT','The Monolith never moves. Reach its face and attack its plates.'],['charge','BANK THE RAILS','Ordinary cuts break one plate. A banked OVERCHARGED cut (stage 4) deals extra damage — build pace and clean-bank a wall.'],['clear','FIVE PLATES','Five ordinary cuts or four OVERCHARGED cuts fell it. Every cut hurts it; the lens adds one damage.']],
 well:[['tell','WATCH THE COMPRESSION','The large dashed field pulls launched cubes. The smaller dashed circle warns of a strike.'],['attack','WATCH THE STRIKE','The solid inner circle is the damaging compression; leave it or interrupt Well.'],['pull','FEEL THE PULL','Launch near the larger field to feel the inward pull. The pull itself does not damage.'],['clear','TRY IT','Launch out of the field or cut through the core.']],
 crown:[['tell','WATCH THE SPOKES','The ten dashed spokes show the directions of Crown’s volley.'],['attack','WATCH THE VOLLEY','Needles travel out along those spokes; the lines themselves are only warnings.'],['armor','CRACK THE SHELL','Dodge or parry the needles, then cut a plate from Crown.'],['clear','BREAK THE CROWN','Cut the remaining plates. Defeating Crown restores 1 health, up to your maximum.']],
});

/** THE WATCH: one state machine for every real enemy rehearsal. */
export const THE_WATCH=Object.freeze({
 idle:Object.freeze({id:'idle',chip:'WATCH IT.'}),
 tell:Object.freeze({id:'tell',chip:'WAIT…'}),
 resolve:Object.freeze({id:'resolve',chip:'NOW.'}),
 missed:Object.freeze({id:'missed',chip:'IT MISSED.'}),
 hurt:Object.freeze({id:'hurt',chip:'IT FOUND YOU.'}),
 cut:Object.freeze({id:'cut',chip:'CUT IT.'}),
 reach:Object.freeze({id:'reach',chip:'REACH IT.'}),
 complete:Object.freeze({id:'complete',chip:'CLEAR.'}),
});
export const WATCH_REDUCED_SCALE=.6;
export const WATCH_TELEGRAPH_SCALE=.32;

export function teachingScenario(id){return TEACHING_SCENARIOS.find(s=>s.id===id)||TEACHING_SCENARIOS[0];}

function lessonPositions(lesson){
 return lesson.id==='monolith'?[[30,-280]]:lesson.id==='link'?[[130,-190],[300,-110]]:lesson.count===3?[[160,-90],[255,-120],[350,-150]]:[[220,-120]];
}
function enemySpecs(lesson,{rehearsal=false}={}){
 return lessonPositions(lesson).map(([x,y],i)=>({
  id:`lesson-${i}`,kind:lesson.kind,x,y,home:'wave',slot:i,wave:true,wavePlaced:true,delay:30+i*16,
  sentry:lesson.id==='link',pinned:lesson.id==='monolith'||(!rehearsal&&lesson.id==='slash'),
  ...(lesson.id==='rift'?{wakeAt:200}:{}),
 }));
}

/** Isolated real wave combat. No profile, wallet, quests or earned rewards. */
function createGuidedSession({scenario='slash',emit=()=>{}}={}){
 const lesson=teachingScenario(scenario),events=[],observed=new Set();let stepIndex=0,waiting=false;
 const run=createRun(841,(type,data)=>{events.push(type);if(events.length>32)events.shift();if(type==='tell'&&lesson.id!=='link')observed.add('tell');if(type==='cut')observed.add('cut');if(type==='armor')observed.add('armor');emit(type,data);},{waveMode:true,controlPractice:true});
 if(lesson.id==='monolith'){run.state.arenaMode='SHATTERED';run.world.arenaMode='SHATTERED';run.state.kineticStage=1;run.state.kineticBounces=0;}
 run.state.phase='playing';run.state.wave.entry=0;run.state.teachingArena=true;
 placePlayer(run.world,{x:0,y:0});stopPlayer(run.world);
 for(const spec of enemySpecs(lesson))run.combat.add(spec);
 if(lesson.id==='link')run.setPracticeLinks([{a:'lesson-0',b:'lesson-1',period:210}]);
 run.state.wave.total=run.combat.enemies.size;let disposed=false;
 const steps=TEACHING_STEPS[lesson.id];
 return {run,lesson,events,steps,get stepIndex(){return stepIndex;},get step(){return steps[stepIndex]||null;},get waiting(){return waiting;},get objectivesComplete(){return stepIndex>=steps.length;},get complete(){return run.combat.enemies.size===0||run.state.wave.phase!=='combat';},
  continueStep(){if(!waiting||disposed)return false;stepIndex++;waiting=stepIndex<steps.length&&observed.has(steps[stepIndex][0]);return true;},
  tick(aim=null){if(disposed||waiting||this.complete||run.state.phase!=='playing')return;
   const before=[...run.combat.enemies.values()];
   if(lesson.id==='well'&&run.world.launched&&before.some(e=>e.kind==='well'&&Math.hypot(e.x-run.world.player.position.x,e.y-run.world.player.position.y)<234))observed.add('pull');
   if(lesson.id==='rift'&&before.some(e=>e.kind==='rift'&&Math.hypot(e.x-run.world.player.position.x,e.y-run.world.player.position.y)<200))observed.add('approach');
   if(lesson.id==='monolith'){
    if(before.some(e=>e.kind==='monolith'&&Math.hypot(e.x-run.world.player.position.x,e.y-run.world.player.position.y)<180))observed.add('approach');
    if(run.state.kineticStage>=4)observed.add('charge');
   }
   run.setAim(aim);run.tick();const live=[...run.combat.enemies.values()];
   if(run.state.shots>0)observed.add('launch');
   if(lesson.id==='fork'&&live.some(e=>e.kind==='fang'&&e.small))observed.add('split');
   if(lesson.id==='link'){
    if(run.combat.links.some(l=>l.mode==='tell'))observed.add('tell');
    if(run.combat.links.some(l=>l.mode==='live'))observed.add('attack');
   }else if(lesson.id==='fang'&&live.some(e=>e.kind==='fang'&&e.mode==='rush'))observed.add('attack');
   else if(['fork','bastion','rift','well'].includes(lesson.id)&&run.combat.hazards.some(h=>h.kind==='zone'&&h.source===lesson.kind))observed.add('attack');
   else if(['pulse','prism','crown'].includes(lesson.id)&&run.combat.hazards.some(h=>h.source===lesson.kind&&h.age>=8))observed.add('attack');
   if(this.complete)observed.add('clear');
   waiting=stepIndex<steps.length&&observed.has(steps[stepIndex][0]);
  },
  dispose(){if(!disposed){disposed=true;run.dispose();}}
 };
}

function createRehearsalSession({scenario='slash',emit=()=>{},reducedMotion=false}={}){
 const lesson=teachingScenario(scenario),events=[],phaseHistory=[{phase:'idle',tick:0,detail:null}];
 let disposed=false,fast=false,done=false,finishPending=false,restartCount=0,tellTick=-1,actionSeen=false,cutSeen=false;
 let run;
 const watch={phase:'idle',chip:THE_WATCH.idle.chip,reason:'',restarted:0};
 const scale=()=>fast?null:(reducedMotion?WATCH_REDUCED_SCALE:WATCH_TELEGRAPH_SCALE);
 const transition=(id,detail=null)=>{
  const next=THE_WATCH[id]||THE_WATCH.idle;
  if(watch.phase===next.id&&!detail)return;
  watch.phase=next.id;watch.chip=next.chip;watch.reason=detail?.reason||id;
  phaseHistory.push({phase:next.id,tick:run?.state.elapsed??0,detail});
  if(phaseHistory.length>48)phaseHistory.shift();
 };
 const clearWorld=()=>{
  for(const e of [...run.combat.enemies.values()])run.combat.remove(e);
  run.combat.hazards.length=0;run.combat.links.length=0;
 };
 const spawn=()=>{
  for(const spec of enemySpecs(lesson,{rehearsal:true}))run.combat.add(spec);
  if(lesson.id==='link')run.setPracticeLinks([{a:'lesson-0',b:'lesson-1',period:210}]);
 };
 const configure=()=>{
  run.state.phase='playing';run.state.wave.entry=0;run.state.wave.phase='combat';
  run.state.teachingArena=true;run.state.teachingRehearsal=true;run.state.practice=true;
  run.state.teachingTargetId=run.combat.enemies.keys().next().value||null;
  run.state.invul=0;run.state.hp=run.state.hpMax;run.state.fatal=null;run.state.cause='';
  if(lesson.id==='monolith'){run.state.arenaMode='SHATTERED';run.world.arenaMode='SHATTERED';}
  run.world.slowScale=null;run.world.slow=false;run.world.focusScale=1;setBulletTime(run.world,false,true);
  placePlayer(run.world,{x:0,y:0});stopPlayer(run.world);
  run.state.wave.total=run.combat.enemies.size;actionSeen=false;cutSeen=false;tellTick=-1;done=false;finishPending=false;
  const initialTell=[...run.combat.enemies.values()].some(e=>e.mode==='tell')||run.combat.links.some(l=>l.mode==='tell');
  transition(initialTell?'tell':'idle');
  if(initialTell&&!fast){tellTick=run.state.elapsed;run.world.slowScale=scale();run.world.slow=true;setBulletTime(run.world,true,true);}
 };
 const callback=(type,data)=>{
  events.push(type);if(events.length>96)events.shift();emit(type,data);
  if(type==='tell'){tellTick=run?.state.elapsed??0;if(!actionSeen)transition('tell');}
  else if(type==='hurt'){actionSeen=true;run.world.slow=false;transition('hurt',{cause:data?.cause});}
  else if(type==='parry'){actionSeen=true;run.world.slow=false;transition('missed',{reason:'parry'});}
  else if(type==='armor'){actionSeen=true;run.world.slow=false;transition('cut',{reason:'armor'});}
  else if(type==='cut'){actionSeen=true;cutSeen=true;run.world.slow=false;transition('cut',{reason:'kill',entityId:data?.entityId});done=true;finishPending=true;}
  else if(type==='over'){run.world.slow=false;transition('hurt',{reason:'death'});}
 };
 const build=()=>{
  run=createRun(841,callback,{waveMode:true,controlPractice:true,catalogRewards:false});
  spawn();configure();
 };
 const restart=(reason='reset')=>{
  clearWorld();
  run.state.hp=run.state.hpMax;run.state.phase='playing';run.state.fatal=null;run.state.cause='';run.state.death=0;run.state.stop=0;run.state.invul=0;
  run.state.edge=run.state.edgeMax;run.state.recharge=0;run.state.blade=0;run.state.parry=0;run.state.shots=0;run.state.kills=0;run.state.chain=0;run.state.chainTime=0;run.state.hyper=false;run.state.hyperLevel=0;run.state.hyperAge=0;run.state.wave.phase='combat';
  run.world.clock=0;run.world.previousClock=0;run.world.slow=false;run.world.slowScale=scale();run.world.focusScale=1;run.world.launched=false;run.world.grounded=true;
  spawn();configure();
  restartCount++;watch.restarted=restartCount;
  if(reason==='death'){events.push('rehearsalRestart');emit('rehearsalRestart',{reason:'death',count:restartCount});}
 };
 build();
 const activeAttack=()=>[...run.combat.enemies.values()].some(e=>e.mode==='rush')||run.combat.hazards.some(h=>!h.spent&&h.age>0)||run.combat.links.some(l=>l.mode==='live');
 const telegraph=()=>[...run.combat.enemies.values()].some(e=>e.mode==='tell')||run.combat.links.some(l=>l.mode==='tell');
 const updateTarget=()=>{const e=[...run.combat.enemies.values()].find(x=>!x.small)||[...run.combat.enemies.values()][0];run.state.teachingTargetId=e?.id||null;};
 const tick=(aim=null)=>{
  if(disposed)return;
  if(finishPending){finishPending=false;transition('complete',{reason:'settled'});return;}
  if(done)return;
  // A rehearsal death is a loop, not a failure screen. Let the real death
  // animation/countdown happen, then rebuild the same real encounter.
  if(run.state.phase==='over'){restart('death');return;}
  const beforeShots=run.state.shots,beforeTell=telegraph(),beforePhase=watch.phase;
  const preTell=beforePhase==='tell'&&!fast&&!actionSeen&&run.state.phase==='playing';
  run.world.slowScale=preTell?scale():null;
  if(preTell&&!run.world.slow){run.world.slow=true;setBulletTime(run.world,true,true);}
  run.setAim(aim);run.tick();
  if(run.state.phase==='over'){restart('death');return;}
  if(lesson.id==='monolith'){
   const m=[...run.combat.enemies.values()].find(e=>e.kind==='monolith');
   if(m&&Math.hypot(m.x-run.world.player.position.x,m.y-run.world.player.position.y)<180){
    done=true;finishPending=true;run.world.slow=false;setBulletTime(run.world,false,true);run.state.teachingTargetId=m.id;transition('reach',{reason:'face'});return;
   }
  }
  const acted=run.state.shots>beforeShots;
  if(acted){
   actionSeen=true;run.world.slow=false;
   if(beforePhase==='idle'||beforePhase==='tell')transition('resolve',{reason:'launch'});
  }
  const afterTell=telegraph();
  if((beforeTell||beforePhase==='tell')&&!afterTell&&activeAttack()&&!actionSeen)transition('resolve',{reason:'strike'});
  if(beforePhase==='resolve'&&!afterTell&&!activeAttack()&&!actionSeen)transition('missed',{reason:'dodge'});
  if(watch.phase==='tell'&&tellTick>=0&&run.state.elapsed-tellTick>36&&!afterTell&&!activeAttack())transition('missed',{reason:'late'});
  updateTarget();
  const slow=watch.phase==='tell'&&!fast&&!actionSeen&&run.state.phase==='playing';
  run.world.slowScale=slow?scale():null;
  if(slow){run.world.slow=true;setBulletTime(run.world,true);}else if(run.world.slow){run.world.slow=false;setBulletTime(run.world,false);}
 };
 const tryAtSpeed=()=>{
  if(!done)return false;
  fast=true;restart('speed');return true;
 };
 const reset=()=>{if(disposed)return false;fast=false;restart('reset');return true;};
 return {
  get run(){return run;},lesson,events,phaseHistory,
  reducedMotion:!!reducedMotion,get speedMode(){return fast?'speed':'rehearsal';},
  get rehearsal(){return true;},get waiting(){return false;},get complete(){return done;},get objectivesComplete(){return done;},
  get phase(){return watch.phase;},get chip(){return watch.chip;},get watch(){return {...watch};},get restarted(){return restartCount;},
  get step(){return null;},get stepIndex(){return 0;},get steps(){return [];},tick,tryAtSpeed,reset,
  dispose(){if(!disposed){disposed=true;run.dispose();}},
 };
}

/** `rehearsal:true` is the new 6E path; guided remains a compatibility adapter. */
export function createTeachingSession(options={}){
 return options.rehearsal?createRehearsalSession(options):createGuidedSession(options);
}

export function teachingReadout(state={},enemies=[]){
 const o=state.opening;if(!o)return null;
 const remaining=Math.max(0,Number.isFinite(state.blade)?state.blade:0), parry=remaining>0&&(state.parry||0)>0;
 let title,tip;
 if(o.finishing){title='PRACTICE COMPLETE';tip='The real wave begins next. Practice points do not carry over.';}
 else if(o.returning){title='RETURNING';tip='The cube returns after a miss. Try the marked target again.';}
 else if(!o.rest){title=remaining>0?'SLASH ACTIVE':'SLASH ENDED';tip=remaining>0?'Cross a target before the blade ends. A kill extends it.':'The blade has ended. Wait for the reset, then launch again.';}
 else if(o.row===2){const hp=enemies.find(e=>e.kind==='bastion')?.hp;title=hp===1?'BASTION / ONE PLATE LEFT':'BASTION / TWO PLATES';tip=(state.edge||0)<=0?'Wait for an Edge to recharge, then cut again.':'Cut the shell, then launch again to break its second plate.';}
 else {title=`RACK ${Math.min(3,o.row+1)} / 3`;tip=o.row===0?'Aim at a target and release to cut. Space also launches.':'Aim across the new row. These paper-rack cuts are free and have extra reach.';}
 return {title,tip,remaining,parry,free:!!o.free};
}
