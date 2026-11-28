import {TEACHING_SCENARIOS,teachingScenario,createTeachingSession} from './teaching.js';
import {createRenderer} from './renderer.js';
import {createInput} from './input.js';
import {createClock} from './clock.js';
import {healthDamageLabel} from './health-ui.js';
import {drawTrainingCard} from './art/splatr-art-engine.js';

/**
 * The picker is a sight, not a paragraph and not a native select pretending to
 * be a lesson. The short labels are the only visible copy; the real encounter
 * is what teaches the detail after the card is chosen.
 */
export const LESSON_CARD_COPY=Object.freeze({
 slash:Object.freeze({title:'SLASH WINDOW',signal:'TIMING',move:'CUT'}),
 fang:Object.freeze({title:'FANG',signal:'CHARGE',move:'DODGE'}),
 pulse:Object.freeze({title:'PULSE',signal:'RING WAVE',move:'PARRY'}),
 prism:Object.freeze({title:'PRISM',signal:'SIGHTLINE',move:'STEP'}),
 link:Object.freeze({title:'LINK',signal:'BEAM',move:'BREAK'}),
 fork:Object.freeze({title:'FORK',signal:'SPLIT',move:'CUT TWICE'}),
 bastion:Object.freeze({title:'BASTION',signal:'ARMOR',move:'BREAK PLATES'}),
 rift:Object.freeze({title:'RIFT',signal:'BLINK',move:'STEP IN'}),
 well:Object.freeze({title:'WELL',signal:'PULL',move:'ESCAPE'}),
 crown:Object.freeze({title:'CROWN',signal:'VOLLEY',move:'PARRY'}),
 monolith:Object.freeze({title:'MONOLITH',signal:'SEAM',move:'REACH'}),
});

function cardCopy(lesson){return LESSON_CARD_COPY[lesson.id]||{title:lesson.name,signal:'LIVE CUE',move:'WATCH'};}

/** The shipped lesson surface: a real encounter with THE WATCH chip state. */
export function createTeachingUI({resetInput=()=>{},motion=()=>true,onOpen=()=>{},onClose=()=>{}}={}){
 const el=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text!=null)n.textContent=text;return n;};
 const dialog=el('dialog','teaching-guide');dialog.setAttribute('aria-labelledby','teaching-title');dialog.dataset.mode='picker';
 const header=el('header'),identity=el('div'),title=el('h2','','LIVE TRAINING');title.id='teaching-title';identity.append(el('small','','THE WATCH / NO REWARDS'),title);
 const picker=el('div','teaching-lesson-picker');
 const select=el('select','sr');select.setAttribute('aria-label','Choose live training lesson');
 for(const lesson of TEACHING_SCENARIOS){const o=el('option','',lesson.name);o.value=lesson.id;select.append(o);}
 const changeLesson=el('button','teaching-change-lesson','CHOOSE SHAPE');changeLesson.type='button';picker.append(select,changeLesson);
 const close=el('button','teaching-close','CLOSE');close.type='button';close.onclick=()=>dialog.close();header.append(identity,picker,close);

 const pickerScreen=el('section','teaching-picker');pickerScreen.setAttribute('aria-labelledby','teaching-picker-title');
 const pickerHead=el('div','teaching-picker-head'),pickerTitle=el('h1','','CHOOSE A SHAPE');pickerTitle.id='teaching-picker-title';
 pickerHead.append(el('small','','THE WATCH / LIVE SIGHT'),pickerTitle,el('p','','ONE CUE. ONE MOVE. THEN PLAY.'));
 const cardGrid=el('div','teaching-picker-grid');
 for(const lesson of TEACHING_SCENARIOS){
  const copy=cardCopy(lesson),button=el('button','teaching-lesson-card');button.type='button';button.dataset.lesson=lesson.id;
  button.setAttribute('aria-label',`${copy.title}. ${copy.signal}. ${copy.move}.`);
  const preview=el('canvas','lesson-preview');preview.width=280;preview.height=150;preview.dataset.lesson=lesson.id;
  const info=el('span','teaching-lesson-card-copy');info.append(el('strong','',copy.title),el('small','',copy.signal),el('em','',copy.move));
  button.append(preview,info);
  button.onclick=()=>{select.value=lesson.id;rebuild();};
  cardGrid.append(button);
 }
 const pickerFoot=el('small','teaching-picker-foot','THE ARENA SHOWS THE REST.');pickerScreen.append(pickerHead,cardGrid,pickerFoot);

 const menu=el('details','teaching-menu'),menuSummary=el('summary','','CONTROLS');menu.append(menuSummary);
 const controls=el('p','teaching-controls','MOUSE · POINT / RELEASE  ·  HOLD · POWER  ·  TOUCH · TAP / PULL  ·  KEYS · ARROWS + SPACE');
 const healthHelp=el('p','teaching-health-help','HIT · REPEAT  ·  CUT · CLEAR  ·  NO REWARDS');
 menu.append(controls,healthHelp);
 const stage=el('div','teaching-stage'),canvas=el('canvas');canvas.tabIndex=0;canvas.setAttribute('aria-label','Live enemy rehearsal. Mouse: pull back, release to launch the opposite way; Shift+click aims directly; right-click cancels. Touch: tap or pull back and release. Arrows or WASD aim; Space launches; Shift focuses.');stage.append(canvas);
 const directions=el('div','teaching-directions'),chip=el('div','watch-chip story-chip','WATCH IT.');chip.setAttribute('aria-live','polite');chip.setAttribute('role','status');
 const lessonMark=el('small','watch-lesson-mark'),trySpeed=el('button','watch-try-speed','TRY AT SPEED');trySpeed.type='button';trySpeed.hidden=true;
 const action=el('p','watch-action');action.setAttribute('aria-hidden','true');directions.append(lessonMark,chip,action,trySpeed);
 const meters=el('div','teaching-meters'),blade=el('div','teaching-blade'),bladeName=el('b'),track=el('progress'),bladeTime=el('span');track.max=38;track.setAttribute('aria-label','Remaining active slash window');blade.append(bladeName,track,bladeTime);
 const stats=el('p','teaching-stats'),enemyState=el('p','teaching-enemy-state');meters.append(blade,stats,enemyState);
 const announce=el('p','teaching-announcement');announce.setAttribute('role','status');announce.setAttribute('aria-live','polite');
 dialog.append(pickerScreen,stage,header,menu,directions,meters,announce);document.querySelector('#game').append(dialog);
 let session=null,renderer=null,input=null,raf=0,pickerMode=true,windowPeak=1,lastShots=-1,lastRestart=0;const clock=createClock();
 function teardown(){cancelAnimationFrame(raf);raf=0;input?.dispose();input=null;session?.dispose();session=null;renderer?.dispose();renderer=null;clock.reset();}
 function paintPicker(now=0){
  for(const button of cardGrid.querySelectorAll('.teaching-lesson-card')){
   const lesson=teachingScenario(button.dataset.lesson),selected=lesson.id===select.value;
   button.setAttribute('aria-pressed',String(selected));
   drawTrainingCard(button.querySelector('canvas'),280,150,{lessonId:lesson.id,kind:lesson.kind,count:lesson.count||1,time:now,selected,motion:motion()});
  }
 }
 function pickerFrame(now){
  if(!dialog.open||!pickerMode)return;
  paintPicker(now);
  raf=requestAnimationFrame(pickerFrame);
 }
 function showPicker(id=select.value){
  teardown();resetInput();pickerMode=true;select.value=teachingScenario(id).id;dialog.dataset.mode='picker';pickerScreen.hidden=false;paintPicker(0);const chosen=cardGrid.querySelector(`[data-lesson="${select.value}"]`);chosen?.focus({preventScroll:true});raf=requestAnimationFrame(pickerFrame);
 }
 function rebuild(){
  teardown();resetInput();pickerMode=false;dialog.dataset.mode='lesson';pickerScreen.hidden=true;const lesson=teachingScenario(select.value);dialog.dataset.lesson=lesson.id;
  const reducedMotion=!motion();
  renderer=createRenderer(canvas);renderer.reset(841);renderer.setTrainingScale(lesson.id==='slash'?1:lesson.id==='link'?1.15:1.3);renderer.setShakeLevel('off');
  session=createTeachingSession({scenario:lesson.id,rehearsal:true,reducedMotion,emit:(type,data)=>{
   renderer?.event(type,data,motion());
   const message={tell:'WAIT…',parry:'IT MISSED.',armor:'CUT IT.',cut:'CUT IT.',hurt:`IT FOUND YOU. ${healthDamageLabel(data?.cause)}.` ,rehearsalRestart:'WATCH IT.'}[type];
   if(message)announce.textContent=message;
  }});
  const run=session.run,rect=canvas.getBoundingClientRect();run.setViewport(rect.width,rect.height);renderer.field(run.world.player.position);renderer.draw(run,1,null,motion());run.setView(renderer.questView());
  input=createInput(canvas,{get:()=>session?.run,active:()=>dialog.open&&!menu.open&&!!session&&!session.complete&&session.run.state.phase==='playing'&&!document.hidden,point:renderer.worldPoint,assist:()=>false,engage(){},commit:v=>session?.run.dash(v)||false,lock:{once:null,tick(){}}});
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
 changeLesson.onclick=()=>showPicker(select.value);
 menu.addEventListener('toggle',()=>{input?.reset();clock.reset();});
 select.onchange=()=>{rebuild();};
 for(const type of ['keydown','keyup'])dialog.addEventListener(type,e=>{if(e.code==='Escape'||e.target!==canvas)e.stopPropagation();});
 dialog.addEventListener('close',()=>{teardown();pickerMode=false;pickerScreen.hidden=true;resetInput();onClose();});
 return {dispose(){teardown();if(dialog.open)dialog.close();dialog.remove();},open(id='slash'){if(dialog.open)return;onOpen();menu.open=false;select.value=teachingScenario(id).id;dialog.showModal();showPicker(select.value);},get isOpen(){return dialog.open;}};
}
