import {prependIcon} from './ui-icons.js';
import {readGesture} from './gesture.js';
import {createRun} from './run.js';
import {placePlayer,stopPlayer} from './physics.js';
import {swordProfile} from './swords.js';
import {normalizeEquipment,ITEMS} from './equipment.js';
import {primaryReadout} from './power-readout.js';
import {PRACTICE_SCENARIOS,PRACTICE_TICKS,practiceScenario,practiceTargets,trialObservation,trialReceipt,compareTrials} from './practice-trials.js';
import {drawSwordChamber} from './art/splatr-art-engine.js';

/** Real run/combat inspection. Local trials never equip, purchase, discover or pay. */
export function createSwordDesk({resetInput,motion=()=>true}){
 const dialog=document.createElement('dialog');dialog.className='sword-desk';dialog.setAttribute('aria-labelledby','sword-desk-title');document.querySelector('#game').append(dialog);
 let run=null,equipment=null,preview=null,baseline=null,last=0,acc=0,auto=false,age=0,pointer=null,press=null,shotsAt=0,panX=0,panY=0;
 let scenario='lane',loadout='preview',initial=[],started=false,finished=false,results={};
 const el=(tag,cls,text)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(text)e.textContent=text;return e;};
 const button=(text,fn,cls='')=>{const b=el('button',cls,text);b.type='button';b.onclick=fn;return b;};
 const header=el('header'),identity=el('div'),eyebrow=el('small'),title=el('h2');title.id='sword-desk-title';identity.append(eyebrow,title);
 const close=button('BACK',()=>dialog.close(),'sword-desk-close');prependIcon(close,'back');header.append(identity,close);
 const content=el('div','sword-desk-content'),stage=el('section','sword-stage'),canvas=el('canvas');canvas.width=640;canvas.height=360;canvas.tabIndex=0;canvas.setAttribute('aria-label','Actual combat test chamber. Tap a target, or pull back and release forward. Space fires forward.');
 const settings=el('div','trial-settings'),scenarioLabel=el('label','','TEST'),scenarioSelect=el('select'),loadoutLabel=el('label','','LOADOUT'),loadoutSelect=el('select');scenarioSelect.setAttribute('aria-label','Practice scenario');loadoutSelect.setAttribute('aria-label','Practice loadout');
 for(const s of PRACTICE_SCENARIOS){const o=el('option','',s.name);o.value=s.id;scenarioSelect.append(o);}
 for(const [id,name]of [['preview','TRYING ON'],['equipped','EQUIPPED']]){const o=el('option','',name);o.value=id;loadoutSelect.append(o);}
 scenarioLabel.append(scenarioSelect);loadoutLabel.append(loadoutSelect);settings.append(scenarioLabel,loadoutLabel);
 const lesson=el('p','trial-lesson'),controls=el('div','sword-test-controls'),fire=button('FIRE',()=>{if(auto){auto=false;rebuild();}shoot();}),reset=button('RESET',()=>rebuild()),toggle=button('AUTO OFF',()=>{auto=!auto;rebuild();});
 const resultNotice=el('p','trial-announcement');resultNotice.setAttribute('role','status');resultNotice.setAttribute('aria-live','polite');
 const receipt=el('p','sword-test-receipt'),help=el('p','sword-test-help','4s SIMULATION TRIAL / PULL BACK · RELEASE FORWARD / NO REWARDS');prependIcon(fire,'play');prependIcon(reset,'retry');controls.append(fire,reset,toggle);
 const comparison=el('section','trial-comparison');comparison.setAttribute('aria-label','Local trial observations');const comparisonTitle=el('b','','THIS VISIT ONLY'),comparisonRows=el('div'),comparisonNote=el('p','','Same scenario, fresh start. Manual aim and launch timing vary; these are observations, not a power ranking.');comparison.append(comparisonTitle,comparisonRows,comparisonNote);
 stage.append(settings,lesson,canvas,controls,receipt,help,resultNotice);
 const info=el('aside','sword-spec'),sidebar=el('div','trial-sidebar');sidebar.append(comparison,info);content.append(stage,sidebar);dialog.append(header,content);
 function clearPointer(){const id=pointer;pointer=null;press=null;if(id!==null&&canvas.hasPointerCapture(id))canvas.releasePointerCapture(id);}
 function observe(){return trialObservation({scenario,loadout,mode:auto?'auto':'manual',ticks:age,shots:run.state.shots,initial,remaining:[...run.combat.enemies.values()]});}
 function comparisonKey(which){return `${scenario}/${auto?'auto':'manual'}/${which}`;}
 function drawComparison(){
  comparisonRows.replaceChildren();for(const [id,name]of [['preview','TRYING ON'],['equipped','EQUIPPED']]){const r=results[comparisonKey(id)],row=el('p');row.append(el('strong','',name),el('span','',r?trialReceipt(r):'No completed trial'));comparisonRows.append(row);}
  const a=results[comparisonKey('equipped')],b=results[comparisonKey('preview')],delta=compareTrials(a,b),signed=n=>`${n>0?'+':''}${n}`;
  comparisonNote.textContent=delta?`Trying on vs equipped: ${signed(delta.kills)} targets, ${signed(delta.damage)} HP, ${signed(delta.shots)} launches. ${auto?'Scripted demo, not optimal play.':'Manual timing and aim vary.'} No overall power ranking.`:'Same scenario, fresh start. Finish both loadouts to compare. Manual timing and aim vary; no overall power ranking.';
 }
 function rebuild(){
  clearPointer();run?.dispose();run=createRun(712,()=>{},{waveMode:true,equipment});
  for(const e of [...run.combat.enemies.values()])run.combat.remove(e);
  run.state.phase='playing';run.state.invul=999999;run.state.wave.entry=0;
  placePlayer(run.world,{x:-350,y:-100});stopPlayer(run.world);
  for(const spec of practiceTargets(scenario))run.combat.add(spec);
  initial=[...run.combat.enemies.values()].map(e=>({id:e.id,hp:e.hp}));run.state.wave.total=initial.length;age=0;shotsAt=0;acc=0;last=0;panX=panY=0;started=finished=false;
  resultNotice.textContent='';lesson.textContent=practiceScenario(scenario).lesson;toggle.textContent=auto?'AUTO ON':'AUTO OFF';toggle.setAttribute('aria-pressed',String(auto));dialog.dataset.scenario=scenario;dialog.dataset.loadout=loadout;dialog.dataset.status='ready';describe();drawComparison();render();
 }
 function shoot(to=null){
  if(!run)return;if(finished)rebuild();if(run.state.wave.phase!=='combat')return;
  const p=run.world.player.position,dx=(to?.x??420)-p.x,dy=(to?.y??p.y)-p.y,n=Math.hypot(dx,dy)||1;
  run.state.edge=run.state.edgeMax;run.state.blade=0;run.state.stop=0;
  if(run.dash({x:dx/n*36,y:dy/n*36,power:36/42})){started=true;shotsAt=age;dialog.dataset.status='running';}
 }
 scenarioSelect.onchange=()=>{scenario=scenarioSelect.value;rebuild();};
 loadoutSelect.onchange=()=>{loadout=loadoutSelect.value;equipment=loadout==='equipped'?baseline:preview;rebuild();};
 const point=e=>{const r=canvas.getBoundingClientRect();return{x:((e.clientX-r.left)/r.width*640-320)/.65+panX,y:((e.clientY-r.top)/r.height*360-235)/.65+panY};};
 canvas.onpointerdown=e=>{if(e.button!==0||pointer!==null)return;e.preventDefault();if(auto){auto=false;rebuild();}pointer=e.pointerId;press={x:e.clientX,y:e.clientY,toX:e.clientX,toY:e.clientY,type:e.pointerType,dragged:false};canvas.setPointerCapture(pointer);canvas.focus({preventScroll:true});};
 canvas.onpointerup=e=>{if(e.pointerId!==pointer)return;e.preventDefault();press.toX=e.clientX;press.toY=e.clientY;const g=readGesture(press),p=run.world.player.position,target=g.kind==='tap'?point(e):{x:p.x+g.dx,y:p.y+g.dy};clearPointer();if(g.kind!=='cancel')shoot(target);};
 canvas.onpointermove=e=>{if(e.pointerId!==pointer||!press)return;press.toX=e.clientX;press.toY=e.clientY;press.dragged=readGesture(press).dragged;};
 canvas.onpointercancel=clearPointer;canvas.onlostpointercapture=()=>pointer=null;
 document.defaultView?.addEventListener('blur',clearPointer);
 canvas.onkeydown=e=>{if(e.code==='Space'){e.preventDefault();if(!e.repeat){if(auto){auto=false;rebuild();}shoot();}}};
 for(const type of ['keydown','keyup'])dialog.addEventListener(type,e=>e.stopPropagation());
 dialog.addEventListener('close',()=>{clearPointer();run?.dispose();run=null;results={};resetInput();});
 function describe(){const s=swordProfile(equipment),rules=primaryReadout(equipment,s),changed=Object.keys(preview).filter(k=>preview[k]!==baseline[k]).map(k=>ITEMS.find(i=>i.id===preview[k]).name);eyebrow.textContent=`${loadout==='equipped'?'EQUIPPED':'FREE TRY-ON'} / ${s.tier.toUpperCase()}`;title.textContent=s.name;dialog.dataset.family=s.family;dialog.dataset.tier=s.tier;info.replaceChildren();
  for(const [label,text]of [['STYLE',s.family.toUpperCase()],['TEST LOADOUT',loadout==='equipped'?'Your saved equipped kit.':changed.length?`Trying on: ${changed.join(', ')}.`:'Same parts as your equipped kit.'],['PRIMARY BASE',`DASH ${rules.speed}% / WIDTH ${rules.width}% / REACH ${rules.reach}% / WINDOW ${rules.window>=0?'+':''}${rules.window}T / ARMOR ${rules.armor} / EDGE ${rules.edge} / HEALTH ${rules.hull} / SCORE ×${rules.score}${rules.conditional.length?' / '+rules.conditional.join(' '):''}`],['STRENGTH',s.strength],['TRADEOFF',s.cost],['EXACT RULE',s.receipt],['TEST RULES','Stationary targets; no damage to you. Edge refills before each practice launch. Four seconds of simulation from your first launch, or until all targets are cut. Reset never saves a partial trial.'],['YOUR MIX','Only the selected loadout is tested. No parts are bought or equipped here; unknown combinations stay secret.']]){const secondary=['TEST RULES','YOUR MIX'].includes(label),b=el(secondary?'details':'section');if(secondary){b.append(el('summary','',label),el('p','',text));}else b.append(el('small','',label),el('p','',text));if(label==='PRIMARY BASE')b.className='trial-primary-rules';info.append(b);}
 }
 function render(){
  if(!run)return;const c=canvas.getContext('2d'),s=run.state,p=run.world.player.position;
  panX=p.x<-350?p.x+350:Math.max(0,p.x-350);panY=p.y<-230?p.y+230:Math.max(0,p.y-50);
  drawSwordChamber(c,{equipment,state:s,player:p,enemies:[...run.combat.enemies.values()],time:age,motion:motion(),panX,panY,labelScale:Math.max(1,640/Math.max(1,canvas.clientWidth))});
  receipt.textContent=`${finished?'TRIAL COMPLETE':started?'TESTING':'READY · FIRE TO START'} / ${trialReceipt(observe())}${s.sword.family==='pulse'?` / CHARGE ${s.swordCharge}/${s.sword.chargeMax}`:''}`;
  canvas.dataset.kills=String(s.kills);canvas.dataset.charge=String(s.swordCharge);canvas.dataset.shots=String(s.shots);canvas.dataset.actorX=String(320+(p.x-panX)*.65);canvas.dataset.actorY=String(235+(p.y-panY)*.65);
 }
 function step(){
  if(finished)return;
  if(auto&&!started)shoot();
  if(!started)return;
  if(auto&&age-shotsAt>=45&&run.combat.enemies.size){const p=run.world.player.position,target=[...run.combat.enemies.values()].sort((a,b)=>Math.hypot(a.x-p.x,a.y-p.y)-Math.hypot(b.x-p.x,b.y-p.y))[0];shoot(target);}
  run.tick();age++;
  if(age>=PRACTICE_TICKS||run.combat.enemies.size===0){finished=true;dialog.dataset.status='complete';results[comparisonKey(loadout)]=observe();resultNotice.textContent=`Trial complete. ${trialReceipt(observe())}`;drawComparison();}
 }
 let raf=0,disposed=false;
 function frame(now){
  raf=0;if(disposed||!dialog.open)return;
  if(dialog.open&&run&&!document.hidden){const dt=Math.min(80,last?now-last:0);acc+=dt;while(acc>=1000/60){step();acc-=1000/60;}render();}last=now;raf=requestAnimationFrame(frame);
 }
 return{dispose(){disposed=true;cancelAnimationFrame(raf);clearPointer();run?.dispose();run=null;if(dialog.open)dialog.close();dialog.remove();},open(eq,current=eq){preview=normalizeEquipment(eq);baseline=normalizeEquipment(current);equipment=preview;loadout='preview';scenario='lane';auto=false;results={};scenarioSelect.value=scenario;loadoutSelect.value=loadout;rebuild();resetInput();dialog.showModal();last=0;acc=0;render();if(!raf)raf=requestAnimationFrame(frame);},get isOpen(){return dialog.open;}};
}
