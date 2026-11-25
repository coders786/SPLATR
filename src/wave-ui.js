import {BUFF_PRESENTATION,buffPresentation} from './buff-presentation.js';
import {iconNode,prependIcon,BUFF_ICONS,STAGE_ICONS} from './ui-icons.js';
import {controlCue} from './control-cues.js';
import {breakthroughLabel,breachCue} from './breakthrough.js';
import {rushReadout} from './hud-copy.js';
import {postVisible} from './post.js';
import {SPEED_PACE} from './speed-pace.js';
import {drawSwordWeapon,drawEncounterRoster,drawWaveUpgradePreview} from './art/splatr-art-engine.js';
function luckyStamp(copy){const stamp=document.createElement('small');stamp.className='buff-lucky';stamp.textContent='LUCKY';stamp.setAttribute('aria-hidden','true');stamp.title='Boosted roll · Normally '+copy.usualStat;return stamp;}
function comparisonBars(copy){
 const wrap=document.createElement('div');wrap.className='upgrade-comparison';wrap.setAttribute('aria-hidden','true');
 for(const bar of copy?.comparisons||[]){
  const row=document.createElement('div');row.className='upgrade-comparison-row';
  const label=document.createElement('span');label.textContent=bar.label;
  const before=document.createElement('i');before.className='stat-before';before.style.setProperty('--bar-fill',`${Math.round(bar.fillBefore*100)}%`);
  const after=document.createElement('i');after.className='stat-after';after.style.setProperty('--bar-fill',`${Math.round(bar.fillAfter*100)}%`);
  const values=document.createElement('b');values.textContent=`${bar.beforeText} → ${bar.afterText}`;
  row.append(label,before,after,values);wrap.append(row);
 }
 return wrap;
}
export function createWaveUI({getRun,resetInput,motion=()=>!matchMedia('(prefers-reduced-motion: reduce)').matches}){
 const hud=document.createElement('section');hud.className='wave-hud';hud.hidden=true;hud.setAttribute('aria-label','Wave progress');document.querySelector('#game').append(hud);
 // CHUNK 3: the sector's bonus goal. Built once, moved back into the HUD each
 // frame (the HUD is a replaceChildren target, so a child it owned would be
 // wiped), and hidden whenever there is no goal to show.
 const goalChip=document.createElement('div');goalChip.className='wave-goal';goalChip.hidden=true;goalChip.setAttribute('role','status');
 // CHUNK 4: THE POST RECEIPT. A run-length card arrives on every clear with no
 // picker, so the HUD has to say WHICH card and WHY — an unexplained buff is
 // indistinguishable from a bug. Shown for a short window after it lands.
 const postLine=document.createElement('div');postLine.className='wave-post';postLine.hidden=true;postLine.setAttribute('role','status');
 let postShownFor=-1;
 // CHUNK 6B: THE LANDLORD'S BAR — Minecraft parity, bottom center. Five
 // cells, one per plate; a pure projection of the boss's plates, read once a
 // frame. Appended to #game (not inside the rebuilt .wave-hud) so the wipe can
 // never eat it; hidden unless the landlord is actually on the field.
 const bossbar=document.getElementById('bossbar');
 const bossCells=bossbar?[...bossbar.querySelectorAll('.bossbar-rail i')]:[];
 let bossPlates=-1;
 function updateBossbar(run){
  if(!bossbar)return;
  const boss=run?.combat?.enemies?[...run.combat.enemies.values()].find(e=>e.kind==='monolith'&&e.home==='monolith'):null;
  const show=!!boss&&['ready','playing'].includes(run.state.phase)&&!document.querySelector('#panel')?.open;
  bossbar.hidden=!show;
  if(!show){bossPlates=-1;return;}
  const plates=Math.max(0,Math.min(5,Math.ceil(Math.max(0,boss.hp)/2)));
  if(plates===bossPlates)return;
  const fell=bossPlates>plates&&bossPlates!==-1;
  bossPlates=plates;
  for(const [i,cell]of bossCells.entries())cell.classList.toggle('on',i<plates);
  bossbar.setAttribute('aria-valuenow',String(plates));
  bossbar.setAttribute('aria-valuetext',`${plates} of 5 plates`);
  if(fell){
   // One plate fell: pop the rail, flash the crack, sweep a single ember
   // line across. Reduced motion keeps the state change, drops the show.
   bossbar.classList.remove('crack');
   bossbar.classList.remove('sweep');
   void bossbar.offsetWidth;
   bossbar.classList.add('crack','sweep');
  }
 }
 const pace=document.createElement('section');pace.className='speed-pace';pace.setAttribute('aria-label','Speed practice');
 pace.innerHTML='<div class="speed-pace-readout"><b class="pace-action"></b><span class="pace-speed"></span></div><div class="pace-track" role="meter" aria-label="Movement speed in pixels per second" aria-valuemin="0"><i class="pace-target"></i><i class="pace-needle"></i></div><div class="pace-caption"><span class="pace-target-label"></span><span class="pace-progress"></span></div><div class="bank-feedback"></div>';
 // CHUNK 6: the MOMENTUM ledger — three diamonds, always visible with the
// wave HUD during a live run (the dial itself is hidden in wave mode). HUD
// rebuilds wipe children, so this re-appends itself exactly like cycle/pips.
const momentumRow=document.createElement('div');momentumRow.className='momentum-row';momentumRow.setAttribute('aria-hidden','true');momentumRow.innerHTML='<span class="momentum-label">MOMENTUM</span><span class="momentum-pips"><i></i><i></i><i></i></span>';
const momentumPipEls=[...momentumRow.querySelectorAll('.momentum-pips i')];
const paceAction=pace.querySelector('.pace-action'),paceSpeed=pace.querySelector('.pace-speed'),paceTrack=pace.querySelector('.pace-track'),paceTarget=pace.querySelector('.pace-target'),paceNeedle=pace.querySelector('.pace-needle'),paceLabel=pace.querySelector('.pace-target-label'),paceProgress=pace.querySelector('.pace-progress'),bankFeedback=pace.querySelector('.bank-feedback');
 const cycle=document.createElement('div');cycle.className='cycle-progress';cycle.setAttribute('role','img');for(let i=0;i<5;i++){const marker=document.createElement('i');cycle.append(marker);}
 // CHUNK 1: a slim pip row showing how many shapes are left in the wave.
 // Built fresh only when the count changes; purely visual (the aria-live
 // text already announces the count to screen readers).
 const pips=document.createElement('div');pips.className='wave-pips';pips.setAttribute('aria-hidden','true');
 const skip=document.createElement('button');skip.type='button';skip.className='breach-skip';skip.textContent='SKIP TO REST';prependIcon(skip,'land');skip.setAttribute('aria-label','Rest without shattering. Keep normal rewards; no shatter record.');
 for(const name of ['pointerdown','pointerup','keydown','keyup'])skip.addEventListener(name,e=>e.stopPropagation());
 skip.onclick=()=>{resetInput();if(getRun()?.skipBreach())document.querySelector('#arena')?.focus({preventScroll:true});};
 const dialog=document.createElement('dialog');dialog.className='wave-upgrades';dialog.setAttribute('aria-labelledby','wave-upgrade-title');document.querySelector('#game').append(dialog);
 const announcement=document.createElement('section');announcement.className='wave-announcement';announcement.hidden=true;announcement.setAttribute('aria-label','Encounter briefing');document.querySelector('#game').append(announcement);
 const pressed=new Set();let needsFreshPress=false;
 document.addEventListener('keydown',e=>pressed.add(e.code),true);document.addEventListener('keyup',e=>pressed.delete(e.code),true);
 let shown=null,choiceRun=null,choiceLockedUntil=0;
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
  // The landlord's bar hides with the run's own chrome on any exit path.
  updateBossbar(run);
  // CHUNK 1: the wave HUD belongs to the live continuous mode too. The old
  // `run.state.narrative` carve-out hid it there entirely, so the shipped
  // field never showed a wave counter or a pip row at all. The narrative does
  // still own the intro banner logic below (entry timers), not visibility.
  if(!wave||!['ready','playing'].includes(run.state.phase)){hud.hidden=true;announcement.hidden=true;if(dialog.open)dialog.close();shown=null;return;}
  hud.hidden=document.querySelector('#panel')?.open||false;hud.dataset.phase=wave.phase;
  const line=wave.phase==='breach'?'SHATTER THE DIMENSION':wave.phase==='combat'?`WAVE ${String(wave.number).padStart(2,'0')} · ${wave.remaining} LEFT`:wave.phase==='return'?(wave.magnet?.active?'MAGNET · LANDING':wave.shattered?'SHATTERED · LAND ON PLATFORM':'WAVE CLEAR · LAND ON PLATFORM'):'REST · CHOOSE ONE';
  const sword=run.state.sword;
  const entering=wave.phase==='combat'&&wave.entry>0;
  // CHUNK 6A (§4): the brief is the authored content; the fallbacks were
  // the instruction-walls. No brief, no banner.
  const briefName=wave.brief?.name||'',briefLesson=wave.brief?.lesson||'';
  const briefless=!briefName&&!briefLesson;
  announcement.hidden=!entering||briefless||document.querySelector('#panel')?.open||false;
  if(entering&&!briefless&&announcement.dataset.wave!==String(wave.number)){announcement.dataset.wave=String(wave.number);announcement.replaceChildren();const small=document.createElement('small'),name=document.createElement('h3'),lesson=document.createElement('p');small.textContent=`WAVE ${wave.number} / ${wave.brief?.milestone?'BREAK WAVE':'ENGAGE'}`;name.textContent=briefName;lesson.textContent=briefLesson;if(!briefName)name.hidden=true;if(!briefLesson)lesson.hidden=true;announcement.append(small,name,lesson);}

  const activeBuff=run.state.waveBuff,activeCopy=activeBuff?buffPresentation(activeBuff):null;const text=wave.phase==='combat'?`W${String(wave.number).padStart(2,'0')} · ${wave.remaining}`:line;
  let sub=sword?`${run.state.breakthrough?'':sword.tier.toUpperCase()+' / '+sword.family.toUpperCase()}${run.state.waveShield?' / WARD READY':''}${sword.family==='pulse'?` / ${run.state.swordCharge}/${sword.chargeMax}${run.state.swordCharge>=sword.chargeMax?' READY':''}`:''}`:'';
  // CHUNK 1: +N WAVE BONUS is folded into the sub line so the multiplier
  // feels banked, not hidden.
  const waveBonus=Math.min(8,run.state.waveMult||0);if(waveBonus>0)sub=`${sub?sub+' / ':''}+${waveBonus} WAVE`;
  // CHUNK 3: the goal chip is a live readout, so its own contents are NOT part
  // of the receipt key — but the chip must survive the replaceChildren below,
  // which wipes every child of the HUD. It is re-appended at the end of this
  // block and again after the rebuild, so it is always the last child.
  const receiptKey=text+sub+(activeBuff?.id||'')+run.state.waveShield;if(hud.dataset.receipt!==receiptKey){hud.dataset.receipt=receiptKey;hud.replaceChildren();const main=document.createElement('strong'),style=document.createElement('span');main.textContent=text;style.textContent=sub;style.hidden=!sub;hud.append(main,style);if(activeBuff){const badge=document.createElement('div');badge.className='active-wave-upgrade';badge.dataset.buff=activeBuff.id;badge.dataset.spent=String(activeBuff.shield&&!run.state.waveShield);badge.setAttribute('aria-label',`${activeCopy.accessibleName}: ${activeCopy.stat}.${activeCopy.cost?' Cost: '+activeCopy.cost+'.':''} This wave only.${activeBuff.shield&&!run.state.waveShield?' Shield spent.':''}`);badge.title=badge.getAttribute('aria-label');badge.append(iconNode(BUFF_ICONS[activeBuff.id]||'blade'));const stat=document.createElement('b');const label=document.createElement('span');label.className='active-buff-name';label.textContent=activeCopy.name;if(activeCopy.lucky)label.append(luckyStamp(activeCopy));badge.dataset.lucky=String(activeCopy.lucky);badge.append(label);stat.textContent=activeBuff.shield?(run.state.waveShield?'BLOCK ×'+run.state.waveShield+(activeBuff.speed?' / DASH −10%':''):'SPENT'):activeCopy.stat;badge.append(stat);hud.append(badge);}}

  // ── CHUNK 3: THE LIVE BONUS GOAL ────────────────────────────────────────
  // One chip, one line, in the HUD the player is already reading. It is a
  // DIRECTIVE ("BREAK A CROWN"), not a scoreboard, and it carries its own
  // progress so the sector's objective is never a thing you discover on the
  // receipt. Nothing about the goal is stored here: every frame reads the
  // director, which owns the counters.
  //
  // ORDER MATTERS: this block sits AFTER the receipt's replaceChildren above.
  // The receipt wipes every child of the HUD when the wave text changes (any
  // body leaving the field), so a chip appended before it would be erased on
  // exactly the frames the player is winning. Appending after the rebuild is
  // what makes the chip survive — there is no second re-append hiding a bug
  // here, and test/chunk3-flow.test.js pins it by killing a body.
  {
   const readout=run.waveGoal?run.waveGoal():null;
   const show=!!readout&&!!readout.goal&&wave.phase==='combat';
   goalChip.hidden=!show;
   if(show){
    const key=`${readout.goal.id}/${readout.met}/${readout.value}`;
    if(goalChip.dataset.key!==key){
     goalChip.dataset.key=key;
     goalChip.dataset.met=String(!!readout.met);
     goalChip.replaceChildren();
     const label=document.createElement('span');label.textContent='BONUS';
     const body=document.createElement('b');body.textContent=readout.met?`${readout.goal.label} ✓`:readout.goal.line;
     goalChip.append(label,body);
     if(!readout.met&&!readout.goal.bool&&!readout.goal.lower){
      const fill=document.createElement('i');
      fill.style.setProperty('--fill',`${Math.round((readout.fraction||0)*100)}%`);
      goalChip.append(fill);
     }
    }
    if(goalChip.parentNode!==hud)hud.append(goalChip);
   }else if(goalChip.parentNode)goalChip.remove();
  }

  // ── CHUNK 4: THE POST ───────────────────────────────────────────────────
  // One receipt per clear: the card and the ranker's one-line reason. It lives
  // in the HUD beside the goal chip and clears itself when the next sector's
  // fight begins, because a receipt that outlives its sector becomes clutter.
  {
   const post=run.state.post;
   // The receipt is a beat, not a status: it expires on its own, so the HUD
   // goes back to just the fight. See POST.showTicks.
   const show=!!post&&wave.phase==='combat'&&postVisible(post,run.state.elapsed);
   if(show&&post.sector!==postShownFor){
    postShownFor=post.sector;
    postLine.replaceChildren();
    const tag=document.createElement('span');tag.textContent='POST';
    const card=document.createElement('b');card.textContent=String(post.name||post.id||'').toUpperCase();
    const why=document.createElement('em');why.textContent=post.reason||'';
    postLine.append(tag,card,why);
    postLine.dataset.card=String(post.id||'');
   }
   postLine.hidden=!show;
   if(show&&postLine.parentNode!==hud)hud.append(postLine);
   else if(!show&&postLine.parentNode)postLine.remove();
  }

  const local=(wave.number-1)%5;
  cycle.setAttribute('aria-label',`Dimension ${Math.floor((wave.number-1)/5)+1}. Wave ${local+1} of 5. Fifth wave is the break wave.`);
  [...cycle.children].forEach((m,i)=>{m.dataset.passed=String(i<local);m.dataset.current=String(i===local);m.dataset.break=String(i===4);});
  if(cycle.parentNode!==hud)hud.append(cycle);
  {
   const showPips=wave.phase==='combat'&&wave.total>0;
   pips.hidden=!showPips;
   if(showPips){
    const key=`${wave.total}/${wave.remaining}`;
    if(pips.dataset.key!==key){
     pips.dataset.key=key;pips.replaceChildren();pips.dataset.dense=String(wave.total>14);
     for(let i=0;i<wave.total;i++){const pip=document.createElement('i');pip.dataset.live=String(i>=wave.total-wave.remaining);pips.append(pip);}
    }
    if(pips.parentNode!==hud)hud.insertBefore(pips,cycle.nextSibling);
   }else if(pips.parentNode)pips.remove();
  }
  const p=wave.pace,cue=controlCue(run.state);if(pace.dataset.icon!==STAGE_ICONS[cue.stage]){pace.querySelector('.pace-state-icon')?.remove();const symbol=iconNode(STAGE_ICONS[cue.stage]||'speed');symbol.classList.add('pace-state-icon');pace.querySelector('.speed-pace-readout').prepend(symbol);pace.dataset.icon=STAGE_ICONS[cue.stage];}
  pace.hidden=!p||!['combat','breach'].includes(wave.phase);
  if(p&&!pace.hidden){
   if(pace.parentNode!==hud)hud.append(pace);
   pace.dataset.status=p.status;
   const banks=wave.cleanBanks;
   bankFeedback.dataset.active=String(!!banks?.flash);
   bankFeedback.textContent=banks?.flash?`${banks.steered?'STEERED BANK':'CLEAN BANK'}${banks.chain>1?' ×'+banks.chain:''} · ${Math.round(banks.retention*100)}%`:run.state.breakthrough?breakthroughLabel(run.state.breakthrough):banks?.total?`${banks.total} BANKS · ×${banks.best}`:'';
   // ── CHUNK 1: ONE BAR, ONE WORD ───────────────────────────────────────
   // HOLD PACE, PACE READY, the overcharge pill and two raw speed numbers
   // were three names for this one meter, in three corners of the screen. The
   // bar is RUSH now. The speed figures stay in the DOM (the meter's aria
   // values and the headless checks read them) but are never painted: see
   // `.pace-speed` in style.css.
   const display=Math.round(p.displaySpeed*60),target=Math.round(p.target*60),percent=Math.round(p.progress/SPEED_PACE.goalTicks*100);
   const rush=rushReadout(p,run.state.breakthrough,run.state.drive);
   paceAction.textContent=wave.phase==='breach'?breachCue(run.state).title:run.state.phase==='ready'?'LAUNCH':entering?'GET READY':rush.label;
   pace.dataset.ready=String(rush.ready);
   paceSpeed.textContent=`${display} px/s`;
   paceLabel.textContent=`TARGET ${target}+`;
   paceProgress.textContent=`${Math.round(rush.fill*100)}%`;
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
  // CHUNK 6B: the landlord's bar tracks the plates, never the HP ticks —
  // five clean steps, the plates are the unit of drama.
  updateBossbar(run);

  {
   const mcount=run.state.momentum?.count??0;
   if(momentumRow.dataset.count!==String(mcount)){momentumRow.dataset.count=String(mcount);for(const [i,el]of momentumPipEls.entries())el.classList.toggle('on',i<mcount);}
   if(momentumRow.parentNode!==hud)hud.append(momentumRow);
  }

  skip.hidden=wave.phase!=='breach';if(!skip.hidden&&skip.parentNode!==hud)hud.append(skip);

  if(wave.phase==='choose'&&shown!==wave.number){
   shown=wave.number;choiceRun=run;needsFreshPress=pressed.has('Space')||pressed.has('Enter');
   const catalogDeal=wave.offers.some(x=>x.fields);
   choiceLockedUntil=catalogDeal?performance.now()+300:0;
   run.state.upgradeReadLock=catalogDeal?18:0;
   resetInput();dialog.replaceChildren();
   if(catalogDeal)dialog.dataset.readLock='300';else delete dialog.dataset.readLock;
   const title=document.createElement('h2');title.id='wave-upgrade-title';title.textContent=`WAVE ${wave.number} CLEAR`;
   const note=document.createElement('p');note.textContent=catalogDeal?'CHOOSE ONE · RUN-LENGTH REWARD':'CHOOSE ONE · NEXT WAVE ONLY';dialog.append(title,note);
   if(wave.report){const receipt=document.createElement('div');receipt.className='wave-clear-report';const seconds=Math.floor(wave.report.ticks/60);receipt.textContent=`${wave.report.cuts} CUTS / ${wave.report.shots} LAUNCHES / ${Math.floor(seconds/60)}:${String(seconds%60).padStart(2,'0')} / ${wave.report.hits===0?'NO HEALTH LOST':wave.report.hits+' HEALTH LOST'}`;if(wave.report.paceBest!==undefined)receipt.textContent+=` / PACE BEST ${(wave.report.paceBest/60).toFixed(1)}s`;if(wave.report.cleanBanks!==undefined)receipt.textContent+=` / ${wave.report.cleanBanks} CLEAN BANKS`;if(wave.report.credits!==undefined)receipt.textContent+=` / +${wave.report.credits} CREDITS`;if(wave.report.shattered)receipt.textContent+=' / DIMENSION SHATTERED';receipt.setAttribute('aria-label',receipt.textContent);receipt.replaceChildren();for(const [symbol,value]of [['target',wave.report.cuts],['coin','+'+(wave.report.credits||0)]]){const item=document.createElement('span');item.append(iconNode(symbol),document.createTextNode(String(value)));receipt.append(item);}dialog.append(receipt);}
   if(wave.next){const brief=document.createElement('section');brief.className='wave-next-brief';const text=document.createElement('div'),name=document.createElement('b'),lesson=document.createElement('small');name.textContent=`NEXT / ${wave.next.name}`;lesson.textContent=`${wave.next.total} initial targets / ${wave.next.lesson}`;text.append(name,lesson);const roster=document.createElement('canvas');roster.width=360;roster.height=60;roster.setAttribute('aria-label',`${wave.next.total} targets: ${wave.next.threat}`);drawEncounterRoster(roster.getContext('2d'),360,60,wave.next);brief.append(text,roster);dialog.append(brief);}

   // CHUNK 7: only draw the sword prop when the canvas can actually paint. The
   // strip is decoration inside the wave-clear panel; the panel is not, so a
   // canvas with no 2D context must cost us the strip and nothing else.
   if(sword){const strip=document.createElement('div');strip.className='wave-sword-strip';const art=document.createElement('canvas');art.width=180;art.height=64;const ctx=art.getContext&&art.getContext('2d');const label=document.createElement('span');label.textContent=`${sword.name} / ${sword.tier.toUpperCase()}`;if(ctx){drawSwordWeapon(ctx,{x:18,y:33,radius:28,sword,active:true,reach:1.2,motion:false});strip.append(art,label);dialog.append(strip);}}
   const last=document.createElement('p');last.className='wave-expiry';last.textContent=catalogDeal?'OWNED UNTIL RUN END · ONE PICK PER WAVE':wave.expiredBuff?`${wave.expiredBuff.title} ENDED AT CLEAR / CHOOSE ITS REPLACEMENT`:'PRIMARY SWORD MODIFIER / NO PERMANENT PURCHASE';dialog.append(last);

   const cards=document.createElement('div');cards.className='wave-upgrade-cards';
   for(const [dealIndex,buff] of wave.offers.entries()){
    const copy=buffPresentation(buff);if(!copy)continue;
    const b=document.createElement('button');b.type='button';b.dataset.buff=buff.id;b.dataset.tier=buff.tier||'legacy';b.dataset.catalog=String(!!buff.fields);b.dataset.deal=String(dealIndex);b.style.setProperty('--deal-delay',`${dealIndex*90}ms`);b.dataset.lucky=String(copy.lucky);
    const duration=buff.fields?'Run length':'Next wave';
    b.setAttribute('aria-label',`${copy.accessibleName}. ${copy.effect}. ${copy.stat}.${copy.cost?' Cost: '+copy.cost+'.':''} ${duration}. Choose.`);
    const badge=iconNode(BUFF_ICONS[buff.id]||'blade');badge.classList.add('buff-icon');b.append(badge);
    const preview=document.createElement('canvas');preview.className='upgrade-creature-preview';preview.width=360;preview.height=200;preview.setAttribute('aria-hidden','true');preview.previewSpec={equipment:run.state.equipment,sword,buff};preview.previewStart=0;
    const replay=()=>{if(motion()&&performance.now()-(dialog.storyOpened||0)>250)preview.previewStart=performance.now();};b.addEventListener('pointerenter',replay);b.addEventListener('focus',replay);drawWaveUpgradePreview(preview.getContext('2d'),preview.width,preview.height,{...preview.previewSpec,time:1100,motion:motion()});b.append(preview);
    const category=document.createElement('span');category.className='wave-choice-category';category.textContent=buff.category||'MODIFIER';b.append(category);
    if(wave.recommendation?.id===buff.id){b.dataset.fit='true';const fit=document.createElement('em');fit.className='wave-choice-fit';fit.textContent='TACTICAL FIT';b.append(fit);}
    const name=document.createElement('b'),stat=document.createElement('strong'),desc=document.createElement('small');name.textContent=copy.name;if(copy.lucky)name.append(luckyStamp(copy));stat.textContent=copy.stat;if(copy.cost){const trade=document.createElement('span');trade.className='buff-tradeoff';trade.textContent='COST: '+copy.cost;stat.append(trade);}desc.textContent=copy.effect;
    b.append(name,stat,comparisonBars(copy),desc);const choose=document.createElement('span');choose.className='buff-choose';choose.textContent='CHOOSE';b.append(choose);b.title=(copy.lucky?'Lucky roll. Normally '+copy.usualStat+'. ':'')+copy.effect+'. '+copy.stat+(copy.cost?'. Cost: '+copy.cost:'')+'. '+duration+'.';
    b.addEventListener('pointerdown',e=>{if(e.button===0)needsFreshPress=false;});b.addEventListener('keydown',e=>{if(['Space','Enter'].includes(e.code)){if(e.repeat)e.preventDefault();else needsFreshPress=false;}});
    b.onclick=()=>{if(needsFreshPress||performance.now()<choiceLockedUntil||run!==getRun())return;if(run.chooseWaveBuff(buff.id)){resetInput();dialog.close();document.querySelector('#arena').focus({preventScroll:true});}};cards.append(b);
   }
   dialog.append(cards);if(wave.recommendation){const reason=document.createElement('p');reason.className='wave-fit-reason';reason.textContent=wave.recommendation.reason;dialog.append(reason);}dialog.storyOpened=performance.now();dialog.showModal();const firstCard=cards.querySelector('button');if(firstCard)firstCard.focus();
  }
 }
 return {update,get open(){return dialog.open;}};
}
