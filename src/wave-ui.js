import {BUFF_PRESENTATION,buffPresentation} from './buff-presentation.js';
import {iconNode,prependIcon,BUFF_ICONS,STAGE_ICONS} from './ui-icons.js';
import {controlCue} from './control-cues.js';
import {breakthroughLabel,breachCue} from './breakthrough.js';
import {SPEED_PACE} from './speed-pace.js';
import {drawSwordWeapon,drawEncounterRoster,drawWaveUpgradePreview} from './art/splatr-art-engine.js';
function luckyStamp(copy){const stamp=document.createElement('small');stamp.className='buff-lucky';stamp.textContent='LUCKY';stamp.setAttribute('aria-hidden','true');stamp.title='Boosted roll · Normally '+copy.usualStat;return stamp;}
export function createWaveUI({getRun,resetInput,motion=()=>!matchMedia('(prefers-reduced-motion: reduce)').matches}){
 const hud=document.createElement('section');hud.className='wave-hud';hud.hidden=true;hud.setAttribute('aria-label','Wave progress');document.querySelector('#game').append(hud);
 const pace=document.createElement('section');pace.className='speed-pace';pace.setAttribute('aria-label','Speed practice');
 pace.innerHTML='<div class="speed-pace-readout"><b class="pace-action"></b><span class="pace-speed"></span></div><div class="pace-track" role="meter" aria-label="Movement speed in pixels per second" aria-valuemin="0"><i class="pace-target"></i><i class="pace-needle"></i></div><div class="pace-caption"><span class="pace-target-label"></span><span class="pace-progress"></span></div><div class="bank-feedback"></div>';
 const paceAction=pace.querySelector('.pace-action'),paceSpeed=pace.querySelector('.pace-speed'),paceTrack=pace.querySelector('.pace-track'),paceTarget=pace.querySelector('.pace-target'),paceNeedle=pace.querySelector('.pace-needle'),paceLabel=pace.querySelector('.pace-target-label'),paceProgress=pace.querySelector('.pace-progress'),bankFeedback=pace.querySelector('.bank-feedback');
 const cycle=document.createElement('div');cycle.className='cycle-progress';cycle.setAttribute('role','img');for(let i=0;i<5;i++){const marker=document.createElement('i');cycle.append(marker);}
 const skip=document.createElement('button');skip.type='button';skip.className='breach-skip';skip.textContent='SKIP TO REST';prependIcon(skip,'land');skip.setAttribute('aria-label','Rest without shattering. Keep normal rewards; no shatter record.');
 for(const name of ['pointerdown','pointerup','keydown','keyup'])skip.addEventListener(name,e=>e.stopPropagation());
 skip.onclick=()=>{resetInput();if(getRun()?.skipBreach())document.querySelector('#arena')?.focus({preventScroll:true});};
 const dialog=document.createElement('dialog');dialog.className='wave-upgrades';dialog.setAttribute('aria-labelledby','wave-upgrade-title');document.querySelector('#game').append(dialog);
 const announcement=document.createElement('section');announcement.className='wave-announcement';announcement.hidden=true;announcement.setAttribute('aria-label','Encounter briefing');document.querySelector('#game').append(announcement);
 const pressed=new Set();let needsFreshPress=false;
 document.addEventListener('keydown',e=>pressed.add(e.code),true);document.addEventListener('keyup',e=>pressed.delete(e.code),true);
 let shown=null,choiceRun=null;
 dialog.setAttribute('closedby','none');
 const choiceRequired=()=>choiceRun&&getRun()===choiceRun&&choiceRun.state.wave?.phase==='choose'&&['ready','playing'].includes(choiceRun.state.phase);
 const restoreChoice=()=>{if(choiceRequired()&&!dialog.open&&!document.hidden){dialog.showModal();dialog.querySelector('button')?.focus({preventScroll:true});}};
 dialog.addEventListener('close',()=>queueMicrotask(restoreChoice));
 document.addEventListener('keydown',e=>{if(dialog.open&&e.code==='Escape'){e.preventDefault();e.stopImmediatePropagation();}},true);
 dialog.addEventListener('cancel',e=>{e.preventDefault();e.stopImmediatePropagation();});
 dialog.addEventListener('keydown',e=>e.stopPropagation());dialog.addEventListener('keyup',e=>e.stopPropagation());
 function update(){
  if(dialog.open&&!document.hidden){const now=performance.now(),animate=motion();for(const canvas of dialog.querySelectorAll('.upgrade-creature-preview')){const time=animate&&canvas.previewStart?Math.max(0,Math.min(1100,now-canvas.previewStart)):1100,key=animate?Math.round(time):'still';if(canvas.previewFrame===key)continue;canvas.previewFrame=key;drawWaveUpgradePreview(canvas.getContext('2d'),canvas.width,canvas.height,{...canvas.previewSpec,time,motion:animate});}}
  const run=getRun(),wave=run?.state.wave;restoreChoice();
  if(!wave||run.state.narrative||!['ready','playing'].includes(run.state.phase)){hud.hidden=true;announcement.hidden=true;if(dialog.open)dialog.close();shown=null;return;}
  hud.hidden=document.querySelector('#panel')?.open||false;hud.dataset.phase=wave.phase;
  const line=wave.phase==='breach'?'SHATTER THE DIMENSION':wave.phase==='combat'?`WAVE ${String(wave.number).padStart(2,'0')} · ${wave.remaining} LEFT`:wave.phase==='return'?(wave.magnet?.active?'MAGNET · LANDING':wave.shattered?'SHATTERED · LAND ON PLATFORM':'WAVE CLEAR · LAND ON PLATFORM'):'REST · CHOOSE ONE';
  const sword=run.state.sword;
  const entering=wave.phase==='combat'&&wave.entry>0;
  announcement.hidden=!entering||document.querySelector('#panel')?.open||false;
  if(entering&&announcement.dataset.wave!==String(wave.number)){announcement.dataset.wave=String(wave.number);announcement.replaceChildren();const small=document.createElement('small'),name=document.createElement('h3'),lesson=document.createElement('p');small.textContent=`WAVE ${wave.number} / ${wave.brief?.milestone?'BREAK WAVE':'ENGAGE'}`;name.textContent=wave.brief?.name||'CLEAR THE FIELD';lesson.textContent=wave.brief?.lesson||'Cut every target.';announcement.append(small,name,lesson);}

  const activeBuff=run.state.waveBuff,activeCopy=activeBuff?buffPresentation(activeBuff):null;const text=wave.phase==='combat'?`W${String(wave.number).padStart(2,'0')} · ${wave.remaining}`:line;
  const sub=sword?`${run.state.breakthrough?'':sword.tier.toUpperCase()+' / '+sword.family.toUpperCase()}${run.state.waveShield?' / WARD READY':''}${sword.family==='pulse'?` / ${run.state.swordCharge}/${sword.chargeMax}${run.state.swordCharge>=sword.chargeMax?' READY':''}`:''}`:'';
  const receiptKey=text+sub+(activeBuff?.id||'')+run.state.waveShield;if(hud.dataset.receipt!==receiptKey){hud.dataset.receipt=receiptKey;hud.replaceChildren();const main=document.createElement('strong'),style=document.createElement('span');main.textContent=text;style.textContent=sub;style.hidden=!sub;hud.append(main,style);if(activeBuff){const badge=document.createElement('div');badge.className='active-wave-upgrade';badge.dataset.buff=activeBuff.id;badge.dataset.spent=String(activeBuff.shield&&!run.state.waveShield);badge.setAttribute('aria-label',`${activeCopy.accessibleName}: ${activeCopy.stat}.${activeCopy.cost?' Cost: '+activeCopy.cost+'.':''} This wave only.${activeBuff.shield&&!run.state.waveShield?' Shield spent.':''}`);badge.title=badge.getAttribute('aria-label');badge.append(iconNode(BUFF_ICONS[activeBuff.id]||'blade'));const stat=document.createElement('b');const label=document.createElement('span');label.className='active-buff-name';label.textContent=activeCopy.name;if(activeCopy.lucky)label.append(luckyStamp(activeCopy));badge.dataset.lucky=String(activeCopy.lucky);badge.append(label);stat.textContent=activeBuff.shield?(run.state.waveShield?'BLOCK ×'+run.state.waveShield+(activeBuff.speed?' / DASH −10%':''):'SPENT'):activeCopy.stat;badge.append(stat);hud.append(badge);}}

  const local=(wave.number-1)%5;
  cycle.setAttribute('aria-label',`Dimension ${Math.floor((wave.number-1)/5)+1}. Wave ${local+1} of 5. Fifth wave is the break wave.`);
  [...cycle.children].forEach((m,i)=>{m.dataset.passed=String(i<local);m.dataset.current=String(i===local);m.dataset.break=String(i===4);});
  if(cycle.parentNode!==hud)hud.append(cycle);
  const p=wave.pace,cue=controlCue(run.state);if(pace.dataset.icon!==STAGE_ICONS[cue.stage]){pace.querySelector('.pace-state-icon')?.remove();const symbol=iconNode(STAGE_ICONS[cue.stage]||'speed');symbol.classList.add('pace-state-icon');pace.querySelector('.speed-pace-readout').prepend(symbol);pace.dataset.icon=STAGE_ICONS[cue.stage];}
  pace.hidden=!p||!['combat','breach'].includes(wave.phase);
  if(p&&!pace.hidden){
   if(pace.parentNode!==hud)hud.append(pace);
   pace.dataset.status=p.status;
   const banks=wave.cleanBanks;
   bankFeedback.dataset.active=String(!!banks?.flash);
   bankFeedback.textContent=banks?.flash?`${banks.steered?'STEERED BANK':'CLEAN BANK'}${banks.chain>1?' ×'+banks.chain:''} · ${Math.round(banks.retention*100)}%`:run.state.breakthrough?breakthroughLabel(run.state.breakthrough):banks?.total?`${banks.total} BANKS · ×${banks.best}`:'';
   paceAction.textContent=wave.phase==='breach'?breachCue(run.state).title:run.state.phase==='ready'?'LAUNCH':entering?'GET READY':p.held?'PACE READY':p.status==='holding'?'HOLD PACE':p.status==='recover'?'RECOVER':'BUILD SPEED';
   const display=Math.round(p.displaySpeed*60),target=Math.round(p.target*60),percent=Math.round(p.progress/SPEED_PACE.goalTicks*100);
   paceSpeed.textContent=`${display} px/s`;
   paceLabel.textContent=`TARGET ${target}+`;
   paceProgress.textContent=run.state.breakthrough?.sonic?'SONIC HELD':cue.stage==='surge'?`HYPER ${(run.state.breakthrough.surgeTicks/60).toFixed(1)}s`:cue.stage==='recharge'?`RECHARGE ${Math.round(cue.progress*100)}%`:run.state.breakthrough?.paceReady?'HYPER READY':`HYPER CHARGE ${percent}%`;
   pace.dataset.relevant=String(wave.phase==='breach'||cue.stage!=='pace'||p.progress>0);
   const ceiling=SPEED_PACE.displayCeiling;
   paceTrack.style.background=`linear-gradient(to right,#71677e 0%,#71677e ${p.target/ceiling*100}%,#758c48 ${p.target/ceiling*100}%,#758c48 100%)`;
   paceTarget.style.left=`${p.target/ceiling*100}%`;paceNeedle.style.left=`${Math.min(99,p.displaySpeed/ceiling*100)}%`;
   paceTrack.setAttribute('aria-valuemax',String(Math.round(ceiling*60)));paceTrack.setAttribute('aria-valuenow',String(Math.min(display,ceiling*60)));paceTrack.setAttribute('aria-valuetext',`${display} pixels per second; target ${target} or higher. Pace practice ${percent} percent.`);
  }

  if(wave.phase==='breach'){
   const finish=breachCue(run.state);pace.dataset.stage=finish.stage;
   paceSpeed.textContent='STEP '+(finish.step+1)+'/3';
   paceLabel.textContent=finish.detail;
   paceProgress.textContent=finish.stage==='bank'?(run.state.breakthrough.surgeTicks/60).toFixed(1)+'s':finish.stage==='cross'?'READY':Math.round(finish.progress*100)+'%';
   bankFeedback.textContent='';bankFeedback.dataset.active='false';
  }

  skip.hidden=wave.phase!=='breach';if(!skip.hidden&&skip.parentNode!==hud)hud.append(skip);

  if(wave.phase==='choose'&&shown!==wave.number){
   shown=wave.number;choiceRun=run;needsFreshPress=pressed.has('Space')||pressed.has('Enter');resetInput();dialog.replaceChildren();
   const title=document.createElement('h2');title.id='wave-upgrade-title';title.textContent=`WAVE ${wave.number} CLEAR`;
   const note=document.createElement('p');note.textContent='CHOOSE ONE · NEXT WAVE ONLY';dialog.append(title,note);
   if(wave.report){const receipt=document.createElement('div');receipt.className='wave-clear-report';const seconds=Math.floor(wave.report.ticks/60);receipt.textContent=`${wave.report.cuts} CUTS / ${wave.report.shots} LAUNCHES / ${Math.floor(seconds/60)}:${String(seconds%60).padStart(2,'0')} / ${wave.report.hits===0?'NO HEALTH LOST':wave.report.hits+' HEALTH LOST'}`;if(wave.report.paceBest!==undefined)receipt.textContent+=` / PACE BEST ${(wave.report.paceBest/60).toFixed(1)}s`;if(wave.report.cleanBanks!==undefined)receipt.textContent+=` / ${wave.report.cleanBanks} CLEAN BANKS`;if(wave.report.credits!==undefined)receipt.textContent+=` / +${wave.report.credits} CREDITS`;if(wave.report.shattered)receipt.textContent+=' / DIMENSION SHATTERED';receipt.setAttribute('aria-label',receipt.textContent);receipt.replaceChildren();for(const [symbol,value]of [['target',wave.report.cuts],['coin','+'+(wave.report.credits||0)]]){const item=document.createElement('span');item.append(iconNode(symbol),document.createTextNode(String(value)));receipt.append(item);}dialog.append(receipt);}
   if(wave.next){const brief=document.createElement('section');brief.className='wave-next-brief';const text=document.createElement('div'),name=document.createElement('b'),lesson=document.createElement('small');name.textContent=`NEXT / ${wave.next.name}`;lesson.textContent=`${wave.next.total} initial targets / ${wave.next.lesson}`;text.append(name,lesson);const roster=document.createElement('canvas');roster.width=360;roster.height=60;roster.setAttribute('aria-label',`${wave.next.total} targets: ${wave.next.threat}`);drawEncounterRoster(roster.getContext('2d'),360,60,wave.next);brief.append(text,roster);dialog.append(brief);}

   if(sword){const strip=document.createElement('div');strip.className='wave-sword-strip';const art=document.createElement('canvas');art.width=180;art.height=64;drawSwordWeapon(art.getContext('2d'),{x:18,y:33,radius:28,sword,active:true,reach:1.2,motion:false});const label=document.createElement('span');label.textContent=`${sword.name} / ${sword.tier.toUpperCase()}`;strip.append(art,label);dialog.append(strip);}
   const last=document.createElement('p');last.className='wave-expiry';last.textContent=wave.expiredBuff?`${wave.expiredBuff.title} ENDED AT CLEAR / CHOOSE ITS REPLACEMENT`:'PRIMARY SWORD MODIFIER / NO PERMANENT PURCHASE';dialog.append(last);

   const cards=document.createElement('div');cards.className='wave-upgrade-cards';
   for(const buff of wave.offers){const copy=buffPresentation(buff);const b=document.createElement('button');b.type='button';b.dataset.buff=buff.id;b.dataset.lucky=String(copy.lucky);b.setAttribute('aria-label',`${copy.accessibleName}. ${copy.effect}. ${copy.stat}.${copy.cost?' Cost: '+copy.cost+'.':''} Next wave only. Choose.`);const badge=iconNode(BUFF_ICONS[buff.id]||'blade');badge.classList.add('buff-icon');b.append(badge);const preview=document.createElement('canvas');preview.className='upgrade-creature-preview';preview.width=360;preview.height=200;preview.setAttribute('aria-hidden','true');preview.previewSpec={equipment:run.state.equipment,sword,buff};preview.previewStart=0;const replay=()=>{if(motion()&&performance.now()-(dialog.storyOpened||0)>250)preview.previewStart=performance.now();};b.addEventListener('pointerenter',replay);b.addEventListener('focus',replay);drawWaveUpgradePreview(preview.getContext('2d'),preview.width,preview.height,{...preview.previewSpec,time:1100,motion:motion()});b.append(preview);
    const category=document.createElement('span');category.className='wave-choice-category';category.textContent=buff.category||'MODIFIER';b.append(category);if(wave.recommendation?.id===buff.id){b.dataset.fit='true';const fit=document.createElement('em');fit.className='wave-choice-fit';fit.textContent='TACTICAL FIT';b.append(fit);}
    const name=document.createElement('b'),stat=document.createElement('strong'),desc=document.createElement('small');name.textContent=copy.name;if(copy.lucky)name.append(luckyStamp(copy));stat.textContent=copy.stat;if(copy.cost){const trade=document.createElement('span');trade.className='buff-tradeoff';trade.textContent='COST: '+copy.cost;stat.append(trade);}desc.textContent=copy.effect;const choose=document.createElement('span');choose.className='buff-choose';choose.textContent='CHOOSE';b.append(name,stat,desc,choose);b.prepend(name);b.title=(copy.lucky?'Lucky roll. Normally '+copy.usualStat+'. ':'')+copy.effect+'. '+copy.stat+(copy.cost?'. Cost: '+copy.cost:'')+'. Next wave only.';
    b.addEventListener('pointerdown',e=>{if(e.button===0)needsFreshPress=false;});b.addEventListener('keydown',e=>{if(['Space','Enter'].includes(e.code)){if(e.repeat)e.preventDefault();else needsFreshPress=false;}});
    b.onclick=()=>{if(needsFreshPress||run!==getRun())return;if(run.chooseWaveBuff(buff.id)){resetInput();dialog.close();document.querySelector('#arena').focus({preventScroll:true});}};cards.append(b);
   }dialog.append(cards);if(wave.recommendation){const reason=document.createElement('p');reason.className='wave-fit-reason';reason.textContent=wave.recommendation.reason;dialog.append(reason);}dialog.storyOpened=performance.now();dialog.showModal();cards.querySelector('button').focus();
  }
 }
 return {update,get open(){return dialog.open;}};
}
