import {createRun} from './run.js';
import {placePlayer,stopPlayer} from './physics.js';

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
].map(Object.freeze));

// Each objective is tied to an event or state in the same real combat simulation.
// Observations remain recorded if a player acts quickly; nothing blocks their controls.
export const TEACHING_STEPS=Object.freeze({
 slash:[['launch','LAUNCH','Tap a target, or pull back and release. A launch briefly activates your blade.'],['cut','CUT','Cross a target before the slash ends. A cut extends the blade and returns Edge.'],['clear','FINISH','Cut all three targets. You can reset or skip a lesson at any time.']],
 fang:[['tell','WATCH THE WARNING','The pointed lane shows where Fang will charge. Its body is safe during the warning.'],['attack','WATCH THE CHARGE','The bright chevron marks the charging body. Only this active charge hurts on contact.'],['clear','TRY IT','Dodge the lane, then launch through Fang while your blade is active.']],
 pulse:[['tell','WATCH THE WIND-UP','Look for the concentric rings gathering around Pulse.'],['attack','WATCH THE RING','The expanding rim is dangerous; the space behind it is safe.'],['clear','TRY IT','Dodge the rim or early-parry it at the start of a dash, then cut Pulse.']],
 prism:[['tell','WATCH THE SIGHTLINE','The dashed line shows the needle’s locked direction.'],['attack','WATCH THE SHOT','The moving needle hurts; the dashed warning line itself does not.'],['clear','TRY IT','Move off the line or cut toward the needle with an active blade, then cut Prism.']],
 link:[['tell','WATCH THE LINK','The line between these two Prisms charges before becoming dangerous.'],['attack','WATCH THE BEAM','The live beam hurts along the line between the two sentries.'],['clear','TRY IT','Cut either sentry to stop its link; clear both to finish. Early dash parry can block the beam.']],
 fork:[['tell','WATCH THE CROSS','The dashed cross marks a Fork swipe. Its body is still safe to touch.'],['attack','WATCH THE SWIPE','The solid cross is the active strike. Leave it or early-parry through it.'],['split','CUT THE FORK','Launch through the cross-shaped enemy. It splits into two small Fangs.'],['clear','CLEAR THE OFFSPRING','Cut both small Fangs. Their bodies hurt only while charging.']],
 bastion:[['tell','WATCH THE WEDGE','Bastion marks the direction and area of its shield slam.'],['attack','WATCH THE SLAM','The solid wedge is the active strike. Move out or early-parry it.'],['armor','CRACK THE ARMOR','Cut Bastion once. The first plate breaks and interrupts its attack.'],['clear','BREAK THE LAST PLATE','Launch through it again. Armor upgrades can remove more plates per cut.']],
 rift:[['tell','WATCH THE MARKER','The dashed circle marks where Rift will blink and strike. Leave the circle.'],['attack','WATCH THE LANDING','The solid landing circle is the strike; touching the Rift body alone is safe.'],['clear','TRY IT','Cut Rift before the blink to interrupt it, or follow after the strike.']],
 well:[['tell','WATCH THE COMPRESSION','The large dashed field pulls launched cubes. The smaller dashed circle warns of a strike.'],['attack','WATCH THE STRIKE','The solid inner circle is the damaging compression; leave it or interrupt Well.'],['pull','FEEL THE PULL','Launch near the larger field to feel the inward pull. The pull itself does not damage.'],['clear','TRY IT','Launch out of the field or cut through the core.']],
 crown:[['tell','WATCH THE SPOKES','The ten dashed spokes show the directions of Crown’s volley.'],['attack','WATCH THE VOLLEY','Needles travel out along those spokes; the lines themselves are only warnings.'],['armor','CRACK THE SHELL','Dodge or parry the needles, then cut a plate from Crown.'],['clear','BREAK THE CROWN','Cut the remaining plates. Defeating Crown restores one health, up to your maximum.']],
});
export function teachingScenario(id){return TEACHING_SCENARIOS.find(s=>s.id===id)||TEACHING_SCENARIOS[0];}

/** Isolated real wave combat. No profile, wallet, quests or earned rewards. */
export function createTeachingSession({scenario='slash',emit=()=>{}}={}){
 const lesson=teachingScenario(scenario),events=[],observed=new Set();let stepIndex=0,waiting=false;
 const run=createRun(841,(type,data)=>{events.push(type);if(events.length>32)events.shift();if(type==='tell'&&lesson.id!=='link')observed.add('tell');if(type==='cut')observed.add('cut');if(type==='armor')observed.add('armor');emit(type,data);},{waveMode:true,controlPractice:true});
 run.state.phase='playing';run.state.wave.entry=0;run.state.teachingArena=true;
 placePlayer(run.world,{x:0,y:0});stopPlayer(run.world);
 const positions=lesson.id==='link'?[[130,-190],[300,-110]]:lesson.count===3?[[160,-90],[255,-120],[350,-150]]:[[220,-120]];
 for(let i=0;i<positions.length;i++){
  const [x,y]=positions[i];run.combat.add({id:`lesson-${i}`,kind:lesson.kind,x,y,home:'wave',slot:i,wave:true,wavePlaced:true,delay:30+i*16,sentry:lesson.id==='link',pinned:lesson.id==='slash'});
 }
 if(lesson.id==='link')run.setPracticeLinks([{a:'lesson-0',b:'lesson-1',period:210}]);
 run.state.wave.total=run.combat.enemies.size;let disposed=false;
 const steps=TEACHING_STEPS[lesson.id];
 return {run,lesson,events,steps,get stepIndex(){return stepIndex;},get step(){return steps[stepIndex]||null;},get waiting(){return waiting;},get objectivesComplete(){return stepIndex>=steps.length;},get complete(){return run.combat.enemies.size===0||run.state.wave.phase!=='combat';},
  continueStep(){if(!waiting||disposed)return false;stepIndex++;waiting=stepIndex<steps.length&&observed.has(steps[stepIndex][0]);return true;},
  tick(aim=null){if(disposed||waiting||this.complete||run.state.phase!=='playing')return;
   const before=[...run.combat.enemies.values()];
   if(lesson.id==='well'&&run.world.launched&&before.some(e=>e.kind==='well'&&Math.hypot(e.x-run.world.player.position.x,e.y-run.world.player.position.y)<234))observed.add('pull');
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

export function teachingReadout(state={},enemies=[]){
 const o=state.opening;if(!o)return null;
 const remaining=Math.max(0,Number.isFinite(state.blade)?state.blade:0), parry=remaining>0&&(state.parry||0)>0;
 let title,tip;
 if(o.finishing){title='PRACTICE COMPLETE';tip='The real wave begins next. Practice points do not carry over.';}
 else if(o.returning){title='RETURNING';tip='The cube returns after a miss. Try the marked target again.';}
 else if(!o.rest){title=remaining>0?'SLASH ACTIVE':'SLASH ENDED';tip=remaining>0?'Cross a target before the blade ends. A kill extends it.':'The blade has ended. Wait for the reset, then launch again.';}
 else if(o.row===2){const hp=enemies.find(e=>e.kind==='bastion')?.hp;title=hp===1?'BASTION / ONE PLATE LEFT':'BASTION / TWO PLATES';tip=(state.edge||0)<=0?'Wait for an Edge to recharge, then cut again.':'Cut the shell, then launch again to break its second plate.';}
 else {title=`RACK ${Math.min(3,o.row+1)} / 3`;tip=o.row===0?'Tap a target, or pull back and release forward. Space also launches.':'Aim across the new row. These paper-rack cuts are free and have extra reach.';}
 return {title,tip,remaining,parry,free:!!o.free};
}
