import {TEACHING_SCENARIOS,teachingScenario,createTeachingSession} from './teaching.js';
import {createRenderer} from './renderer.js';
import {createInput} from './input.js';
import {createClock} from './clock.js';
import {healthDamageLabel} from './health-ui.js';

/** The shipped lesson surface: a real encounter with THE WATCH chip state. */
export function createTeachingUI({resetInput=()=>{},motion=()=>true,onOpen=()=>{},onClose=()=>{}}={}){
 const el=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text!=null)n.textContent=text;return n;};
 const dialog=el('dialog','teaching-guide');dialog.setAttribute('aria-labelledby','teaching-title');
 const header=el('header'),identity=el('div'),title=el('h2','','LIVE TRAINING');title.id='teaching-title';identity.append(el('small','','THE WATCH / NO REWARDS'),title);
 const picker=el('label','teaching-lesson-picker','LESSON'),select=el('select');select.setAttribute('aria-label','Choose live training lesson');
 for(const lesson of TEACHING_SCENARIOS){const o=el('option','',lesson.name);o.value=lesson.id;select.append(o);}picker.append(select);
 const close=el('button','teaching-close','CLOSE');close.type='button';close.onclick=()=>dialog.close();header.append(identity,picker,close);
 const menu=el('details','teaching-menu'),menuSummary=el('summary','','CONTROLS & COUNTERS');menu.append(menuSummary);
 const controls=el('p','teaching-controls','TAP a target or PULL BACK & RELEASE · ARROWS / WASD + SPACE · HOLD or SHIFT to focus');
 const healthHelp=el('p','teaching-health-help','REAL ATTACKS · A hit restarts this rehearsal · no score, wallet or fracture carries out.');
 const basics=el('details','teaching-basics'),summary=el('summary','','WHAT THE ARENA SHOWS');basics.append(summary,healthHelp);
 for(const [head,text] of [
  ['CONTROLS','Tap a target, or pull back and release forward. Arrows / WASD aim and Space launches. Hold in flight or hold Shift to focus.'],
  ['SLASH','A dash activates the blade. A cut is real; the first kill ends this rehearsal.'],
  ['PARRY','An early dash can stop rings, needles and linked beams. It is not general invulnerability.'],
  ['PRACTICE','Dying silently repeats the same encounter. Try At Speed unlocks after a real cut or reach.'],
 ]){const p=el('p');p.append(el('b','',head+' · '),document.createTextNode(text));basics.append(p);}
 menu.append(controls,basics);
 const stage=el('div','teaching-stage'),canvas=el('canvas');canvas.tabIndex=0;canvas.setAttribute('aria-label','Live enemy rehearsal. Tap a target, or pull back and release. Arrows or WASD aim; Space launches; Shift focuses.');stage.append(canvas);
 const directions=el('div','teaching-directions'),chip=el('div','watch-chip story-chip','WATCH IT.');chip.setAttribute('aria-live','polite');chip.setAttribute('role','status');
 const lessonMark=el('small','watch-lesson-mark'),trySpeed=el('button','watch-try-speed','TRY AT SPEED');trySpeed.type='button';trySpeed.hidden=true;
 const action=el('p','watch-action');action.setAttribute('aria-hidden','true');directions.append(lessonMark,chip,action,trySpeed);
 const meters=el('div','teaching-meters'),blade=el('div','teaching-blade'),bladeName=el('b'),track=el('progress'),bladeTime=el('span');track.max=38;track.setAttribute('aria-label','Remaining active slash window');blade.append(bladeName,track,bladeTime);
 const stats=el('p','teaching-stats'),enemyState=el('p','teaching-enemy-state');meters.append(blade,stats,enemyState);
 const announce=el('p','teaching-announcement');announce.setAttribute('role','status');announce.setAttribute('aria-live','polite');
 dialog.append(stage,header,menu,directions,meters,announce);document.querySelector('#game').append(dialog);
 let session=null,renderer=null,input=null,raf=0,windowPeak=1,lastShots=-1,lastRestart=0;const clock=createClock();
 function teardown(){cancelAnimationFrame(raf);raf=0;input?.dispose();input=null;session?.dispose();session=null;renderer?.dispose();renderer=null;clock.reset();}
 function rebuild(){
  teardown();resetInput();const lesson=teachingScenario(select.value);dialog.dataset.lesson=lesson.id;
  const reducedMotion=!motion();
  renderer=createRenderer(canvas);renderer.reset(841);renderer.setTrainingScale(lesson.id==='slash'?1:lesson.id==='link'?1.15:1.3);renderer.setShakeLevel('off');
  session=createTeachingSession({scenario:lesson.id,rehearsal:true,reducedMotion,emit:(type,data)=>{
   renderer?.event(type,data,motion());
   const message={tell:'WAIT…',parry:'IT MISSED.',armor:'CUT IT.',cut:'CUT IT.',hurt:`IT FOUND YOU. ${healthDamageLabel(data?.cause)}.` ,rehearsalRestart:'WATCH IT.'}[type];
   if(message)announce.textContent=message;
  }});
  const run=session.run,rect=canvas.getBoundingClientRect();run.setViewport(rect.width,rect.height);renderer.field(run.world.player.position);renderer.draw(run,1,null,motion());run.setView(renderer.questView());
  input=createInput(canvas,{get:()=>session?.run,active:()=>dialog.open&&!menu.open&&!!session&&!session.complete&&session.run.state.phase==='playing'&&!document.hidden,point:(x,y)=>{const b=canvas.getBoundingClientRect();return renderer.worldPoint(x-b.left,y-b.top);},assist:()=>false,engage(){},commit:v=>session?.run.dash(v)||false,lock:{once:null,tick(){}}});
  windowPeak=1;lastShots=-1;lastRestart=0;announce.textContent='Live rehearsal. Let the arena show the attack.';update();canvas.focus({preventScroll:true});raf=requestAnimationFrame(frame);
 }
 function update(){
  if(!session)return;const r=session.run,s=r.state,remaining=Math.max(0,s.blade||0);
  if(s.shots!==lastShots){lastShots=s.shots;windowPeak=Math.max(1,remaining);}windowPeak=Math.max(windowPeak,remaining);
  const mode=remaining>0?'SLASH ACTIVE':s.shots?'SLASH ENDED':'READY';bladeName.textContent=mode;blade.dataset.active=String(remaining>0);track.max=windowPeak;track.value=remaining;
  bladeTime.textContent=remaining>0?`${Math.ceil(remaining)} TICKS${s.parry>0?' · PARRY':''}`:'LAUNCH TO CUT';
  stats.textContent=`HEALTH ${s.hp}/${s.hpMax}  ·  EDGE ${s.edge}/${s.edgeMax}  ·  FOCUS ${Math.round(s.focus*100)}%  ·  CHAIN ${s.chain}`;
  const live=[...r.combat.enemies.values()],enemy=live.find(e=>!e.small)||live[0],links=r.combat.links;
  const phase=session.phase;chip.textContent=session.chip;chip.dataset.phase=phase;dialog.dataset.phase=phase;dialog.dataset.speedMode=session.speedMode;dialog.dataset.reducedMotion=String(session.reducedMotion);
  lessonMark.textContent=`${session.lesson.name} · ${session.speedMode==='speed'?'REAL SPEED':'REHEARSAL'}`;
  trySpeed.hidden=!session.complete;trySpeed.disabled=!session.complete;action.textContent=session.complete?'FIRST CUT / AGAIN?':phase==='tell'?'ATTACK TELEGRAPH':phase==='resolve'?'ATTACK LIVE':phase==='hurt'?'RESTARTING':' ';
  const restart=session.restarted;if(restart!==lastRestart){lastRestart=restart;announce.textContent='WATCH IT.';}
  enemyState.textContent=session.complete?'CLEAR / TRY AT SPEED':`${live.length} TARGET${live.length===1?'':'S'} · ${enemy?.kind?.toUpperCase()||'ENEMY'}${enemy?.mode==='tell'?' · TELL':enemy?.mode==='rush'?' · ATTACK':enemy?.mode==='recover'?' · RECOVER':''}${links.length?` · LINK ${links[0].mode.toUpperCase()}`:''}${r.combat.hazards.length?` · ${r.combat.hazards.length} HAZARD${r.combat.hazards.length===1?'':'S'}`:''}`;
  canvas.dataset.shots=String(s.shots);canvas.dataset.elapsed=String(s.elapsed);canvas.dataset.blade=String(remaining);canvas.dataset.targets=String(live.length);dialog.dataset.status=session.complete?'cleared':s.phase!=='playing'?'ended':'live';
  if(session.complete){input?.reset();announce.textContent='CUT IT. TRY AT SPEED.';}
 }
 function frame(now){
  if(!dialog.open||!session)return;if(document.hidden||menu.open){input?.reset();clock.reset();raf=requestAnimationFrame(frame);return;}
  const r=session.run,b=canvas.getBoundingClientRect();r.setViewport(b.width,b.height);
  const alpha=clock.frame(now,()=>{input.retry();input.tick();session.tick(input.aim);renderer.tick(r,motion());});
  renderer.draw(r,alpha,input.aim,motion());r.setView(renderer.questView());update();raf=requestAnimationFrame(frame);
 }
 trySpeed.onclick=()=>{if(session?.tryAtSpeed()){input?.reset();clock.reset();canvas.focus({preventScroll:true});update();}};
 menu.addEventListener('toggle',()=>{input?.reset();clock.reset();});
 select.onchange=()=>{rebuild();};
 for(const type of ['keydown','keyup'])dialog.addEventListener(type,e=>{if(e.code==='Escape'||e.target!==canvas)e.stopPropagation();});
 dialog.addEventListener('close',()=>{teardown();resetInput();onClose();});
 return {open(id='slash'){if(dialog.open)return;onOpen();menu.open=false;dialog.showModal();select.value=teachingScenario(id).id;rebuild();},get isOpen(){return dialog.open;}};
}
