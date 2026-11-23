import {TEACHING_SCENARIOS,teachingScenario,createTeachingSession} from './teaching.js';
import {createRenderer} from './renderer.js';
import {createInput} from './input.js';
import {createClock} from './clock.js';
import {healthDamageLabel} from './health-ui.js';
import {iconNode} from './ui-icons.js';

/** An isolated real run: enemy AI, collision, controls and blade are genuine. */
export function createTeachingUI({resetInput=()=>{},motion=()=>true,onOpen=()=>{},onClose=()=>{},openControl=()=>{}}={}){
 const el=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text)n.textContent=text;return n;};
 const dialog=el('dialog','teaching-guide');dialog.setAttribute('aria-labelledby','teaching-title');
 const header=el('header'),identity=el('div'),title=el('h2','','LIVE TRAINING');title.id='teaching-title';identity.append(el('small','','SAFE PRACTICE / NO REWARDS'),title);
 const close=el('button','teaching-close','CLOSE');close.type='button';close.onclick=()=>dialog.close();header.append(identity,close);
 const menu=el('details','teaching-menu'),menuSummary=el('summary','','LESSONS & OPTIONS');menu.append(menuSummary);
 const tools=el('div','teaching-tools'),label=el('label','','LESSON'),select=el('select');select.setAttribute('aria-label','Choose live training lesson');
 for(const lesson of TEACHING_SCENARIOS){const o=el('option','',lesson.name);o.value=lesson.id;select.append(o);}label.append(select);
 const reset=el('button','','RESET'),previous=el('button','','PREVIOUS'),next=el('button','','SKIP LESSON');reset.type=previous.type=next.type='button';tools.append(label,reset,previous,next);
 const directions=el('div','teaching-directions'),stepRow=el('div','teaching-step-row'),watch=el('p','teaching-step-label'),stepNext=el('button','teaching-step-next','NEXT STEP'),action=el('p','teaching-step-action');stepNext.type='button';stepRow.append(watch,stepNext);const illustration=el('div','teaching-illustration');illustration.setAttribute('aria-hidden','true');directions.append(stepRow,illustration,action);
 const controls=el('p','teaching-controls','TAP a target or PULL BACK & RELEASE · ARROWS / WASD + SPACE to launch · HOLD or SHIFT in flight to focus');const healthHelp=el('p','teaching-health-help','HEALTH: Only a charging Fang can hurt by contact. Enemy attacks cost 1 health; at 0, the run ends. A Crown can restore 1.');
 const stage=el('div','teaching-stage'),canvas=el('canvas');canvas.tabIndex=0;canvas.setAttribute('aria-label','Live combat practice. Tap a target, or pull back and release. Arrows or WASD aim; Space launches; Shift focuses.');stage.append(canvas);
 const meters=el('div','teaching-meters'),blade=el('div','teaching-blade'),bladeName=el('b'),track=el('progress'),bladeTime=el('span');track.max=38;track.setAttribute('aria-label','Remaining active slash window');blade.append(bladeName,track,bladeTime);
 const stats=el('p','teaching-stats'),enemyState=el('p','teaching-enemy-state');meters.append(blade,stats,enemyState);
 const basics=el('details','teaching-basics'),summary=el('summary','','CONTROLS, RESOURCES & WAVE RULES');basics.append(summary,healthHelp);
 for(const [head,text] of [
  ['CONTROLS','Tap a target, or pull back and release forward. Arrows / WASD aim and Space launches. Hold in flight or hold Shift to focus and slow time.'],
  ['SLASH & PARRY','A dash activates the blade briefly; a kill extends it. Clean wall banks and Hyper can also keep it active. Early parry can stop rings, needles and Prism links, but is not general invulnerability. An active blade can also parry needles when facing them.'],
  ['EDGE / FOCUS / HEALTH','A launch spends Edge. A kill restores one Edge and refills Focus. Edge also recharges in the air. Running out of Health ends a real run.'],
  ['CHAIN / THROUGHCUT','Keep killing before the chain timer expires; a hit breaks the chain. Six consecutive kills normally trigger Overdrive. Two full-size kills in one launch can release a forward Throughcut.'],
  ['WAVES','Clear every target, including Fork offspring. Land and settle on the rest platform to choose an upgrade. Break waves add a breach before the platform.'],
  ['PACE / BREACH','Build pace by moving above target speed. Launch to begin Hyper, then clean-bank a side or top wall during its window to earn Sonic. Release aim and make a fresh launch through the breach.'],
 ]){const p=el('p');p.append(el('b','',head+' · '),document.createTextNode(text));basics.append(p);}
 const advanced=el('button','teaching-advanced','TRY PACE & BREACH DRILL');advanced.type='button';advanced.onclick=()=>{dialog.close();openControl();};basics.append(advanced);
 const announce=el('p','teaching-announcement');announce.setAttribute('role','status');announce.setAttribute('aria-live','polite');
 menu.append(tools,controls,meters,basics);dialog.append(stage,header,menu,directions,announce);document.querySelector('#game').append(dialog);
 let session=null,renderer=null,input=null,raf=0,windowPeak=1,lastShots=-1,lastNotice='',lastStep=-1,lastWaiting=false;const clock=createClock();
 function teardown(){cancelAnimationFrame(raf);raf=0;input?.dispose();input=null;session?.dispose();session=null;renderer?.dispose();renderer=null;clock.reset();}
 function rebuild(){
  teardown();resetInput();const lesson=teachingScenario(select.value);dialog.dataset.lesson=lesson.id;
  renderer=createRenderer(canvas);renderer.reset(841);renderer.setTrainingScale(lesson.id==='slash'?1:lesson.id==='link'?1.15:1.3);renderer.setShakeLevel('off');
  session=createTeachingSession({scenario:lesson.id,emit:(type,data)=>{renderer?.event(type,data,motion());const message={tell:'Enemy is preparing an attack.',armor:'Armor cracked. Launch again.',cut:'Target cut. Edge restored; blade extended.',parry:'Attack parried.',hurt:`Health −1: ${healthDamageLabel(data.cause)}.`,break:`Health 0: ${healthDamageLabel(data.cause)}. Press Reset to try again.`}[type];if(message){lastNotice=message;announce.textContent=message;}}});
  const run=session.run,rect=canvas.getBoundingClientRect();run.setViewport(rect.width,rect.height);renderer.field(run.world.player.position);renderer.draw(run,1,null,motion());run.setView(renderer.questView());
  input=createInput(canvas,{get:()=>session?.run,active:()=>dialog.open&&!menu.open&&!!session&&!session.waiting&&!session.complete&&session.run.state.phase==='playing'&&!document.hidden,point:(x,y)=>{const b=canvas.getBoundingClientRect();return renderer.worldPoint(x-b.left,y-b.top);},assist:()=>false,engage(){},commit:v=>session?.run.dash(v)||false,lock:{once:null,tick(){}}});
  windowPeak=1;lastShots=-1;lastNotice='';lastStep=-1;lastWaiting=false;announce.textContent='Live practice. Follow the steps or skip a lesson at any time.';update();canvas.focus({preventScroll:true});raf=requestAnimationFrame(frame);
 }
 function update(){
  if(!session)return;const r=session.run,s=r.state,remaining=Math.max(0,s.blade||0);
  if(s.shots!==lastShots){lastShots=s.shots;windowPeak=Math.max(1,remaining);}windowPeak=Math.max(windowPeak,remaining);
  const mode=remaining>0?'SLASH ACTIVE':s.shots?'SLASH ENDED':'READY TO LAUNCH';bladeName.textContent=mode;blade.dataset.active=String(remaining>0);track.max=windowPeak;track.value=remaining;
  bladeTime.textContent=remaining>0?`${Math.ceil(remaining)} sim ticks remaining${s.parry>0?' · PARRY ACTIVE':''}`:'Launch to start a new blade window';
  stats.textContent=`HEALTH ${s.hp}/${s.hpMax}  ·  EDGE ${s.edge}/${s.edgeMax}  ·  FOCUS ${Math.round(s.focus*100)}%  ·  CHAIN ${s.chain}`;
  const live=[...r.combat.enemies.values()],enemy=live.find(e=>!e.small)||live[0],links=r.combat.links;
  const lessonNumber=TEACHING_SCENARIOS.findIndex(x=>x.id===session.lesson.id)+1,step=session.step;
  dialog.dataset.step=String(session.stepIndex+1);dialog.dataset.objectives=String(session.objectivesComplete);
  const retryNeeded=(session.complete||s.phase!=='playing')&&!session.waiting&&!session.objectivesComplete;
  stepNext.hidden=!(session.waiting||session.objectivesComplete||retryNeeded);
  stepNext.textContent=session.waiting?(session.stepIndex===session.steps.length-1?'FINISH STEP':'NEXT STEP'):retryNeeded?'TRY AGAIN':lessonNumber===TEACHING_SCENARIOS.length?'FINISH':'NEXT LESSON';
  const visual=retryNeeded?['retry']:session.objectivesComplete?['check','forward']:({launch:['pull','release'],cut:['blade','target'],clear:['blade','check'],tell:['target'],attack:['forward'],split:['blade','target'],armor:['breaker'],pull:['pull','release']})[step?.[0]]||['target'];
  const signature=visual.join('/');if(illustration.dataset.visual!==signature){illustration.dataset.visual=signature;illustration.replaceChildren(...visual.map(name=>iconNode(name)));}
  if(session.objectivesComplete){
   watch.textContent=`LESSON ${lessonNumber} / ${TEACHING_SCENARIOS.length} · COMPLETE`;
   action.textContent='Nice work. Continue to the next lesson.';
  }else if(session.complete&&!session.waiting){
   watch.textContent=`LESSON ${lessonNumber} / ${TEACHING_SCENARIOS.length} · ENEMY CLEARED EARLY`;
   action.textContent='Try again to see the missed warning.';
  }else if(s.phase!=='playing'&&!session.waiting){
   watch.textContent='PRACTICE ENDED';action.textContent='Try again to practice this move.';
  }else if(step){
   watch.textContent=`LESSON ${lessonNumber} / ${TEACHING_SCENARIOS.length} · STEP ${session.stepIndex+1} / ${session.steps.length} · ${step[1]}`;
   action.textContent=session.waiting?'PAUSED · '+step[2]:step[2];
  }
  previous.disabled=lessonNumber===1;next.textContent=session.objectivesComplete?(lessonNumber===TEACHING_SCENARIOS.length?'FINISH TRAINING':'NEXT LESSON'):'SKIP LESSON';
  if(lastStep!==session.stepIndex||lastWaiting!==session.waiting){lastStep=session.stepIndex;lastWaiting=session.waiting;announce.textContent=watch.textContent+'. '+action.textContent;if(session.waiting)input?.reset();}
  if(s.phase!=='playing')enemyState.textContent='PRACTICE ENDED / Press RESET to try again.';
  else if(session.complete)enemyState.textContent=session.waiting?'CLEARED / Finish the current step.':'CLEARED / Reset or choose the next lesson.';
  else {const phase=enemy?.mode==='tell'?'WINDING UP':enemy?.mode==='rush'?'LUNGING':enemy?.mode==='recover'?'RECOVERING':'MOVING';const link=links.length?` · LINK ${links[0].mode.toUpperCase()}`:'';const hazards=r.combat.hazards.length;enemyState.textContent=`${live.length} TARGET${live.length===1?'':'S'} · ${enemy?.kind?.toUpperCase()||'ENEMY'} ${phase}${['bastion','crown'].includes(enemy?.kind)?` · ${enemy.hp} PLATE${enemy.hp===1?'':'S'}`:''}${link}${hazards?` · ${hazards} ACTIVE HAZARD${hazards===1?'':'S'}`:''}`;}
  canvas.dataset.shots=String(s.shots);canvas.dataset.elapsed=String(s.elapsed);canvas.dataset.blade=String(remaining);canvas.dataset.targets=String(live.length);dialog.dataset.status=s.phase!=='playing'?'ended':session.complete?'cleared':'live';
  if(session.complete&&!session.waiting&&lastNotice!=='cleared'){lastNotice='cleared';announce.textContent=action.textContent;input?.reset();}
 }
 function frame(now){
  if(!dialog.open||!session)return;if(document.hidden||menu.open){input?.reset();clock.reset();raf=requestAnimationFrame(frame);return;}
  const r=session.run,b=canvas.getBoundingClientRect();r.setViewport(b.width,b.height);
  const alpha=clock.frame(now,()=>{if(session.waiting)return;input.retry();input.tick();session.tick(input.aim);renderer.tick(r,motion());});
  renderer.draw(r,alpha,input.aim,motion());r.setView(renderer.questView());update();raf=requestAnimationFrame(frame);
 }
 stepNext.onclick=()=>{if(!session)return;if(session.waiting)session.continueStep();else if(session.objectivesComplete){next.click();return;}else if(session.complete||session.run.state.phase!=='playing'){rebuild();return;}input?.reset();clock.reset();update();canvas.focus({preventScroll:true});};
 menu.addEventListener('toggle',()=>{input?.reset();clock.reset();});
 select.onchange=()=>{menu.open=false;rebuild();};reset.onclick=()=>{menu.open=false;rebuild();};previous.onclick=()=>{const i=TEACHING_SCENARIOS.findIndex(s=>s.id===select.value);if(i>0){menu.open=false;select.value=TEACHING_SCENARIOS[i-1].id;rebuild();}};
 next.onclick=()=>{const i=TEACHING_SCENARIOS.findIndex(s=>s.id===select.value);if(i===TEACHING_SCENARIOS.length-1){dialog.close();return;}menu.open=false;select.value=TEACHING_SCENARIOS[i+1].id;rebuild();};
 for(const type of ['keydown','keyup'])dialog.addEventListener(type,e=>{if(e.code==='Escape'||e.target!==canvas)e.stopPropagation();});
 dialog.addEventListener('close',()=>{teardown();resetInput();onClose();});
 return {open(id='slash'){if(dialog.open)return;onOpen();menu.open=false;dialog.showModal();select.value=teachingScenario(id).id;rebuild();},get isOpen(){return dialog.open;}};
}
