import {iconNode,prependIcon,STAGE_ICONS} from './ui-icons.js';
import {createControlSession,CONTROL_DRILLS,controlDrill} from './control-practice.js';
import {createRenderer} from './renderer.js';
import {createInput} from './input.js';
import {createClock} from './clock.js';

/** Optional controls laboratory. Every open owns/disposes its input, physics,
 * observer and RAF. No wallet, storage, profile or real-run reference. */
export function createControlPracticeUI({resetInput,motion=()=>true,onClose=()=>{},onOpen=()=>{}}){
 const el=(tag,cls,text)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(text)e.textContent=text;return e;};
 const dialog=el('dialog','control-practice');dialog.setAttribute('aria-labelledby','control-practice-title');
 const header=el('header'),identity=el('div'),title=el('h2','','CONTROL PRACTICE');title.id='control-practice-title';identity.append(el('small','','SAFE PRACTICE'),title);
 const back=el('button','','BACK');back.type='button';prependIcon(back,'back');back.onclick=()=>dialog.close();header.append(identity,back);
 const toolbar=el('div','control-toolbar'),label=el('label','','DRILL'),select=el('select');select.setAttribute('aria-label','Control drill');for(const d of CONTROL_DRILLS){const o=el('option','',d.name);o.value=d.id;select.append(o);}label.append(select);
 const retry=el('button','control-retry','RESTART');retry.type='button';prependIcon(retry,'retry');toolbar.append(label,retry);
 const setup=el('p','control-setup'),canvas=el('canvas');canvas.tabIndex=0;canvas.setAttribute('aria-label','Safe arena. Mouse: pull back, release to launch the opposite way; Shift+click aims directly; right-click cancels. Touch: pull back and release. Arrows aim and Space launches; Shift focuses.');
 const readout=el('section','control-readout'),heading=el('div'),step=el('b'),speed=el('span');heading.append(step,speed);
 const diagram=el('div','control-visual-cue');diagram.setAttribute('aria-hidden','true');readout.append(diagram);
 const track=el('progress');track.max=1;track.setAttribute('aria-label','Current practice step progress');const hint=el('p');readout.prepend(heading);readout.append(track,hint);
 const footer=el('p','control-help gesture-hints');for(const [id,text]of [['pull','Pull back'],['release','Release'],['target','Shift+click: direct']]){const item=el('span','',text);item.prepend(iconNode(id));footer.append(item);}
 const announce=el('p','control-announcement');announce.setAttribute('role','status');announce.setAttribute('aria-live','polite');
 dialog.append(header,toolbar,setup,canvas,readout,footer,announce);document.querySelector('#game').append(dialog);
 let session=null,renderer=null,input=null,raf=0,lastStage='',drill='route';const clock=createClock();
 function teardown(){cancelAnimationFrame(raf);raf=0;input?.dispose();input=null;session?.dispose();session=null;renderer?.dispose();renderer=null;clock.reset();lastStage='';}
 function rebuild(){
  teardown();resetInput();setup.textContent=controlDrill(drill).setup;setup.classList.add('icon-sr-only');canvas.title=controlDrill(drill).setup;dialog.dataset.drill=drill;renderer=createRenderer(canvas);renderer.reset(841);renderer.setShakeLevel('off');
  session=createControlSession({drill,emit:(type,data)=>{renderer?.event(type,data,motion());if(type==='waveClear'||type==='waveRest')input?.reset();}});
  const r=session.run,b=canvas.getBoundingClientRect();r.setViewport(b.width,b.height);renderer.field(r.world.player.position);renderer.draw(r,1,null,motion());session.start(renderer.questView());
  input=createInput(canvas,{get:()=>session?.run,active:()=>dialog.open&&!!session&&!session.cue.complete&&!document.hidden,point:renderer.worldPoint,assist:()=>false,engage(){},commit:v=>session?.run.dash(v)||false,lock:{once:null,tick(){}}});
  draw(1);update();canvas.focus({preventScroll:true});raf=requestAnimationFrame(frame);
 }
 function draw(alpha=1){
  if(!session||!renderer)return;const r=session.run,p=r.world.player.position,b=canvas.getBoundingClientRect();
  renderer.draw(r,alpha,input?.aim||null,motion());
  const v=renderer.questView(),x=(p.x-v.x)*v.scale,y=(p.y-v.y)*v.scale;
  // Camera easing cannot finish after the lesson freezes. Recover visual framing
  // only; never move the player, gate or physics to make a screenshot pass.
  if(x<28||x>b.width-28||y<28||y>b.height-28||(x>b.width-122&&y>b.height-122)){
   renderer.field(p);renderer.draw(r,1,input?.aim||null,motion());
  }
  r.setView(renderer.questView());
 }
 function update(){
  if(!session)return;const r=session.run,cue=session.cue,p=r.state.wave.pace,actual=Math.round(Math.hypot(r.world.player.velocity.x,r.world.player.velocity.y)*60),target=Math.round(p.target*60);
  dialog.dataset.stage=cue.stage;if(step.dataset.label!==cue.title){step.textContent=({pace:'BUILD SPEED',launch:'LAUNCH',surge:'WALL BANK',recharge:'RECHARGE',breach:'BREAK THROUGH',land:'LAND',complete:'COMPLETE'})[cue.stage]||cue.title;prependIcon(step,STAGE_ICONS[cue.stage]||'speed');step.dataset.label=cue.title;diagram.replaceChildren();for(const name of ({pace:['pull','release','speed'],launch:['pull','release','bolt'],surge:['bolt','bank','bolt'],recharge:['bank','retry','bolt'],breach:['pull','release','breach'],land:['land','check'],complete:['check','play']})[cue.stage]||['target'])diagram.append(iconNode(name));}hint.textContent=cue.hint;hint.classList.add('icon-sr-only');step.title=cue.hint;track.value=cue.progress;speed.textContent=`${actual} / ${target}+ px/s`;canvas.dataset.actorX=String((r.world.player.position.x-renderer.questView().x)*renderer.questView().scale);canvas.dataset.actorY=String((r.world.player.position.y-renderer.questView().y)*renderer.questView().scale);const retryLabel=cue.complete?'TRY AGAIN':'RESTART';if(retry.dataset.label!==retryLabel){retry.textContent=retryLabel;prependIcon(retry,'retry');retry.dataset.label=retryLabel;}
  if(lastStage!==cue.stage){lastStage=cue.stage;announce.textContent=`${cue.title}. ${cue.hint}`;if(cue.complete)input?.reset();}
  canvas.dataset.shots=String(r.state.shots);canvas.dataset.banks=String(r.state.cleanBankTotal);canvas.dataset.shatters=String(r.state.shatters);
 }
 function frame(now){
  if(!dialog.open||!session)return;
  if(document.hidden){input?.reset();clock.reset();raf=requestAnimationFrame(frame);return;}
  const r=session.run,b=canvas.getBoundingClientRect();r.setViewport(b.width,b.height);
  const alpha=clock.frame(now,()=>{if(session.cue.complete)return;input.retry();input.tick();session.tick(input.aim);renderer.tick(r,motion());});
  draw(alpha);update();raf=requestAnimationFrame(frame);
 }
 select.onchange=()=>{drill=select.value;rebuild();};retry.onclick=rebuild;
 for(const type of ['keydown','keyup'])dialog.addEventListener(type,e=>{if(e.code==='Escape'||e.target!==canvas)e.stopPropagation();});
 // Arena keyboard input is handled at window by createInput; main is explicitly
 // inactive while this modal is open. Native controls retain native key behavior.
 dialog.addEventListener('close',()=>{teardown();resetInput();onClose();});
 const visibility=()=>{if(dialog.open){input?.reset();clock.reset();}};document.addEventListener('visibilitychange',visibility);
 return {dispose(){teardown();document.removeEventListener('visibilitychange',visibility);if(dialog.open)dialog.close();dialog.remove();},open(){if(dialog.open)return;drill='route';select.value=drill;resetInput();onOpen();dialog.showModal();rebuild();},get isOpen(){return dialog.open;}};
}
