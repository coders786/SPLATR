import Matter from 'matter-js';
import {createDimensionField} from './dimension-field.js';
import {createBreakthrough, stepBreakthrough} from './breakthrough.js';
import {createCleanBanks} from './clean-banks.js';
import {createSpeedPace, stepSpeedPace} from './speed-pace.js';
import {planEncounter} from './encounters.js';
import {equipmentRules} from './equipment.js';
import {horizontalCutWidth} from './equipment-combat.js';
import {upgradeOffers} from './upgrades.js';
import {recommendWaveOffer} from './encounters.js';
import {gainFracture,FRACTURE_PER_WAVE_CLEAR} from './fracture.js';
import {LANDLORD_STORY,storyForWave,storyMomentForWave} from './story-arc.js';
// CHUNK 3: the landlord's cadence and the live bonus goal are rules, not
// director trivia — see flow.js for why each one is shaped the way it is.
import {landlordDue,goalFor,goalProgress,goalPayout} from './flow.js';
// CHUNK 4: the post — the run-length upgrade catalogue, granted on a clear
// with no chooser. See post.js for why it is a grant and not a draft.
import {postDue,choosePost,postLine} from './post.js';

// The targets are Matter sensor shapes queried by the same forward blade ray
// used for enemies. They are not proximity-triggered or timed objectives.
// CHUNK 4: `catalogRewards` and `postRewards` are DIFFERENT things and must not
// share a flag:
//   catalogRewards — the rest chooser. Continuous play keeps this OFF; that is
//                    the earlier decision recorded in waves.js, and turning it
//                    on here would stop the field at every clear (verified: the
//                    run parked in `phase:'choose'` with no picker on screen).
//   postRewards    — one auto-picked card per clear, no UI, no stop.
export function createContinuousDirector({seed,world,combat,state,emit=()=>{},intro=false,catalogRewards=false,postRewards=false,onUpgrade=null}) {
 const cells=new Map(), arena=world.arena, rules=equipmentRules(state.equipment);
 // CHUNK 1: the lift used to be the literal 1250 (the old arena top). Derive it
 // from the live arena so the 1.3x arena keeps spawn clearance honest. Captured
 // once -- `arena.y` is mutated sector-to-sector as the world grows upward.
 const LIFT = -arena.y;
 const wave=state.wave={number:1,phase:'combat',entry:0,age:0,total:0,remaining:0,cleared:0,platform:null,spawnPadGone:false,offers:[],recommendation:null,upgradeChosen:false,storyMoment:null,storyMomentTarget:null};
 const openingStory=storyForWave(1);
 const story=state.narrative={intro:!!intro,introAge:0,sector:1,chapter:openingStory.id,storyTitle:openingStory.title,storyChip:openingStory.chip,storyLine:openingStory.line,emotion:openingStory.emotion,locks:[],lockBursts:[],seal:null,fracture:null,reaction:null,rest:null,conduits:3};
 let targets=[],lastPosition={...world.player.position}, prismIds=new Set(),sealBody=null,sealGeometry=null;
 function body(x,y,r,label){return Matter.Bodies.circle(x,y,r,{isStatic:true,isSensor:true,label});}
 function removeSeal(){
  if(sealBody)Matter.Composite.remove(world.engine.world,sealBody);
  if(sealGeometry){const index=world.geometry.indexOf(sealGeometry);if(index>=0)world.geometry.splice(index,1);}
  sealBody=null;sealGeometry=null;
 }
 function install(){
  removeSeal();
  const chapter=storyForWave(wave.number);
  story.sector=wave.number;
  story.chapter=chapter.id;
  story.storyTitle=chapter.title;
  story.storyChip=chapter.chip;
  story.storyLine=chapter.line;
  story.emotion=chapter.emotion;
  story.lockBursts=[];
  const top=arena.y;
  story.locks=[-310,0,310].map((x,i)=>({id:i,x,y:top+370,r:38,broken:false,body:body(x,top+370,38,'anchor-lock')}));
  story.seal={x:arena.x+arena.w/2,y:top+205,w:arena.w,h:24,ready:false,armed:false};
  const q=story.seal;sealGeometry={x:q.x-q.w/2,y:q.y-q.h/2,w:q.w,h:q.h};
  sealBody=Matter.Bodies.rectangle(q.x,q.y,q.w,q.h,{isStatic:true,label:'sector-seal',friction:0,restitution:.1});
  world.geometry.push(sealGeometry);Matter.Composite.add(world.engine.world,sealBody);
  targets=story.locks;
 }
 function encounter(){
  const p=world.player.position,plan=planEncounter(seed,wave.number,{x:p.x,y:p.y-arena.y-LIFT});
  wave.brief=plan;wave.total=plan.total;wave.remaining=plan.total;wave.storyMoment=storyMomentForWave(wave.number,plan);wave.storyMomentTarget=null;
  const mods=state.upgradeModifiers||{};
  for(const spec of plan.specs){
   const hp=spec.kind==='bastion'&&Number.isFinite(mods.bastionArmor)?Math.max(1,2+mods.bastionArmor):undefined;
   combat.add({...(hp==null?spec:{...spec,hp}),y:spec.y+arena.y+LIFT,id:`sector/${wave.number}/${spec.slot}`});
  }
  const prisms=[...combat.enemies.values()].filter(e=>e.kind==='prism');
  prismIds=new Set(prisms.map(e=>e.id));
  wave.storyMomentTarget=wave.storyMoment
    ? [...combat.enemies.values()].find(enemy=>enemy.kind===wave.storyMoment.mechanic)||null
    : null;
  cells.clear();for(let i=0;i+1<prisms.length;i+=2)cells.set(`link/${i}`,{link:{a:prisms[i].id,b:prisms[i+1].id,period:300+i*30,age:0}});
  state.dimension=createDimensionField(wave.number-1);state.breakthrough=createBreakthrough(wave.number-1);
  wave.pace=createSpeedPace(wave.number);wave.cleanBanks=createCleanBanks();
  wave.startDamage=state.damageTaken||0;wave.startScore=state.score||0;wave.startCredits=state.killLedger?.credits||0;
  // CHUNK 3: the goal's "since this sector started" baseline. Taken from the
  // live counters, not assumed to be zero, because banks and crown kills are
  // run-scoped totals that a previous sector already moved.
  wave.startKills=state.kills||0;
  wave.startBanks=wave.cleanBanks.total||0;
  wave.startCrowns=state.killLedger?.rows?.crown?.kills||0;
  wave.startTicks=wave.age||0;
  wave.firstKillTick=-1;
  // CHUNK 4: per-sector notification markers for the wave-mode events this
  // director now publishes (pace hold, clean bank). Reset with the baselines.
  wave.paceNotified=false;
  wave.bankNotified=wave.cleanBanks.total||0;
  // CHUNK 3: ONE LIVE BONUS GOAL PER SECTOR. Chosen from what the field can
  // actually serve (no Crown, no crown goal) and never the same goal twice in a
  // row. It is announced with the sector so the player can play toward it from
  // the first cut rather than discovering it at the payout.
  wave.goal=goalFor({number:wave.number,seed,hasCrown:[...combat.enemies.values()].some(e=>e.kind==='crown')});
  wave.goalPaid=null;
  emit('waveStart',{number:wave.number,total:wave.total,goal:wave.goal.id});
 }
 function startSector(){install();encounter();}
 // CHUNK 3: the live goal's counters. Everything here already existed per
 // sector (kills, banks, crowns); the goal is the first thing to READ them
 // mid-fight instead of only at the receipt.
 function goalMetrics(){
  return {
   kills:Math.max(0,(state.kills||0)-(wave.startKills||0)),
   hits:Math.max(0,(state.damageTaken||0)-(wave.startDamage||0)),
   banks:Math.max(0,(wave.cleanBanks?.total||0)-(wave.startBanks||0)),
   crowns:Math.max(0,(state.killLedger?.rows?.crown?.kills||0)-(wave.startCrowns||0)),
   paceHeld:!!wave.pace?.held,
   overdrive:(state.overdriveBest||0)>0,
   firstKillTicks:Number.isFinite(wave.firstKillTick)?wave.firstKillTick-wave.startTicks:-1,
   ticks:Math.max(0,(wave.age||0)-(wave.startTicks||0)),
  };
 }
 // Read by the HUD every frame: {goal, fraction, met, text}. Cheap and
 // side-effect free so the presentation layer can call it as often as it likes.
 function goalReadout(){
  // No sector goal exists before the first real gate has been cut.
  if(story.intro||!wave.goal)return null;
  const m=goalMetrics(),p=goalProgress(wave.goal,m);
  return {goal:wave.goal,fraction:p.fraction,met:p.met,value:p.value,target:p.target,line:p.met?`${wave.goal.label} ✓`:wave.goal.line};
 }
 // Pays the goal exactly once, at the clear boundary, beside the flawless and
 // crown-pace payments rather than as a separate ceremony. Practice runs keep
 // their habit of banking nothing.
 function settleGoal(){
  if(state.practice||!wave.goal||wave.goalPaid)return null;
  const paid=goalPayout(wave.goal,goalMetrics());
  wave.goalPaid=paid?paid.id:false;
  if(!paid)return null;
  gainFracture(state,paid.fracture,emit);
  // The credit row goes through the same ledger shape every kill uses, so the
  // receipt that itemises a run cannot be missing the one payment that was not
  // a kill.
  if(state.killLedger&&Number.isFinite(paid.credits)&&paid.credits>0){
   const rows={...state.killLedger.rows},old=rows.goal||{kills:0,credits:0,points:0};
   state.killLedger={...state.killLedger,credits:Math.min(10000,(state.killLedger.credits||0)+paid.credits),rows:{...rows,goal:{kills:old.kills,credits:old.credits+paid.credits,points:old.points}}};
  }
  if(Number.isFinite(paid.credits))state.score=(state.score||0)+paid.credits*25;
  emit('goalPaid',{...paid,sector:wave.number});
  return paid;
 }
 function settleSectorReward(){
  // The goal is settled even in practice (where it is a no-op) so the flag is
  // set and a later real clear cannot re-pay the same sector's goal.
  settleGoal();
  if(state.practice)return;
  const mods=state.upgradeModifiers||{},hits=Math.max(0,(state.damageTaken||0)-(wave.startDamage||0)),score=Math.max(0,(state.score||0)-(wave.startScore||0));
  if(hits===0){
   if(Number.isFinite(mods.flawlessScore)&&mods.flawlessScore>1)state.score+=Math.floor(score*(mods.flawlessScore-1));
   if(Number.isFinite(mods.flawlessFracture)&&mods.flawlessFracture>0)gainFracture(state,mods.flawlessFracture,emit);
  }
  if(Number.isFinite(mods.crownPace)&&wave.pace?.best>=mods.crownPace){
   gainFracture(state,mods.crownFracture||0,emit);
   if(state.killLedger&&Number.isFinite(mods.crownCredits)&&mods.crownCredits>1){
    const earned=Math.max(0,(state.killLedger.credits||0)-(wave.startCredits||0));
    const extra=Math.max(0,Math.floor(earned*(mods.crownCredits-1)));
    state.killLedger={...state.killLedger,credits:Math.min(10000,state.killLedger.credits+extra)};
   }
  }
  gainFracture(state,FRACTURE_PER_WAVE_CLEAR+(mods.fractureClear||0),emit);
  state.waveMult=(state.waveMult||0)+1;
  admitPost();
  // CHUNK 4: the sector's outcome, for the next sector's fit ranker. Until now
  // `recommendWaveOffer` received `previous: wave.report` and `wave.report` was
  // never built in this mode — the ranker was scoring every card as a blind
  // guess. Same shape as waves.js's report, so one recommender serves both.
  wave.report=Object.freeze({
   ticks:Math.max(0,(wave.age||0)-(wave.startTicks||0)),
   cuts:(state.kills||0)-(wave.startKills||0),
   shots:0,
   score:Math.max(0,(state.score||0)-(wave.startScore||0)),
   hits:(state.damageTaken||0)-(wave.startDamage||0),
   paceBest:wave.pace?.best||0,
   paceHeld:!!wave.pace?.held,
   paceTarget:wave.pace?.target||0,
   cleanBanks:wave.cleanBanks?.total||0,
   bestBanks:wave.cleanBanks?.best||0,
   credits:(state.killLedger?.credits||0)-(wave.startCredits||0),
   goal:wave.goal?.id||null,
   goalMet:!!wave.goalPaid,
   shattered:!!state.shatters,
  });
 }
 // CHUNK 4: THE POST. One run-length card per clear, chosen by the fit ranker
 // that already existed but had no way to be reached. No picker, no pause: the
 // card arrives, the run continues, and the HUD prints what it was and why.
 //
 // Guarded by `postFor` (the sector it was mailed for) rather than a boolean, so
 // a clear that somehow runs twice cannot mail two cards and a later sector is
 // never denied one.
 function admitPost(){
  const sector=wave.number;
  if(state.practice||!postRewards||!postDue(sector)||wave.postFor===sector)return null;
  // The card arrives carrying the sector it came from; that marker is what
  // makes the grant idempotent without a second flag to keep in sync.
  const owned=(state.upgrades||[]).map(x=>x.id);
  const offers=upgradeOffers(seed,sector,{shattered:(state.shatters|0)>0||state.arenaMode==='SHATTERED',owned});
  const pick=choosePost(offers,{next:wave.brief,sword:state.sword,hp:state.hp,previous:wave.report});
  if(!pick)return null;
  const card=offers.find(x=>x.id===pick.id);
  // Mark the sector only AFTER the grant lands: a refused card (already owned,
  // or no upgrade sink) must not burn this sector's post.
  if(!onUpgrade||!onUpgrade(card))return null;
  wave.postFor=sector;
  const post={...pick,sector,name:card.title||pick.name,at:state.elapsed||0};
  state.post=post;
  emit('postPaid',{...post,line:postLine(post)});
  return post;
 }
 function rewardDimensionBreak(){
  if(state.practice)return;
  gainFracture(state,state.upgradeModifiers?.shatterFracture||FRACTURE_PER_DIMENSION_BREAK,emit);
 }
 function beginRestBeat(sector){
  if(!catalogRewards)return;
  // The continuous field keeps flowing, but a sector crossing gets the same
  // readable half-second landing beat as wave mode. Enemies are staged before
  // the beat so the camera never goes empty; director activity and chooser
  // input remain asleep until the beat is over.
  story.rest={sector,age:0,ticks:30};
  wave.phase='combat';
  wave.entry=30;
  wave.upgradeChosen=false;
  wave.offers=[];
  wave.recommendation=null;
 }
 function openCatalogRest(){
  if(!catalogRewards||wave.phase!=='combat'||!story.rest)return;
  if(story.rest.age<story.rest.ticks)return;
  story.rest=null;
  wave.phase='choose';
  wave.offers=upgradeOffers(seed,wave.number,{shattered:(state.shatters|0)>0||state.arenaMode==='SHATTERED',owned:(state.upgrades||[]).map(x=>x.id),luckyTwice:!!state.upgradeModifiers?.luckyTwice});
  wave.recommendation=recommendWaveOffer(wave.offers,{next:wave.brief,sword:state.sword,hp:state.hp,previous:wave.report});
  emit('waveRest',{number:wave.number,sector:wave.number,continuous:true});
 }
 function choose(id){
  if(!catalogRewards||wave.phase!=='choose')return false;
  const buff=wave.offers.find(x=>x.id===id);
  if(!buff)return false;
  const persistent=onUpgrade?onUpgrade(buff):false;
  if(!persistent)return false;
  state.waveBuff=buff;
  state.waveShield=state.upgradeModifiers?.shield||0;
  state.held=false;state.invul=Math.max(state.invul,30);wave.upgradeChosen=true;
  wave.offers=[];wave.recommendation=null;wave.phase='combat';wave.entry=30;
  emit('upgradeChosen',{id:buff.id,persistent:true,owned:(state.upgrades||[]).map(x=>x.id)});
  return true;
 }
 if(intro){story.fracture={x:0,y:-115,r:42,body:body(0,-115,42,'lockdown-fracture')};
  for(let i=0;i<2;i++)combat.add({id:`lockdown/fang/${i}`,kind:'fang',x:i?180:-180,y:-175,home:'lockdown',wave:true,wavePlaced:true,delay:140});
  wave.pace=createSpeedPace(1);wave.cleanBanks=createCleanBanks();state.dimension=createDimensionField(0);state.breakthrough=createBreakthrough(0);
 }else startSector();
 function rayHits(objects,from,to,width){return objects.length?Matter.Query.ray(objects.map(x=>x.body),from,to,width).map(hit=>hit.body.parent):[];}
 function tick(dt=1){
  const p=world.player.position,t=Math.max(0,Math.min(1,dt));
  wave.entry=Math.max(0,(wave.entry||0)-t);
  if(story.rest)story.rest.age+=t;
  openCatalogRest();
  if(wave.phase==='choose')return;
  const active=state.phase==='playing',directorActive=active&&wave.entry<=0;
  if(story.intro)story.introAge+=t;
  if(story.openingBurst){story.openingBurst.age+=t;if(story.openingBurst.age>100)story.openingBurst=null;}
  if(story.reaction){story.reaction.age+=t;if(story.reaction.age>=48)story.reaction=null;}
  if(story.lockBursts.length){
   for(const burst of story.lockBursts)burst.age+=t;
   story.lockBursts=story.lockBursts.filter(burst=>burst.age<30);
  }
  wave.age+=t;wave.remaining=combat.enemies.size;
  // CHUNK 3: a speed goal needs a timestamp, and the director is the only
  // place that knows when the sector's clock started.
  if(wave.firstKillTick<0&&(state.kills||0)>(wave.startKills||0))wave.firstKillTick=wave.age;
  const storyActive=active&&wave.entry<=0&&!state.stop&&!state.cutscene;
  // The first real Pulse is the only authored mid-wave set piece. The guard is
  // run-scoped, not wave-scoped, so a later sector cannot replay it.
  if(storyActive&&!state.midWaveStorySeen&&wave.storyMoment&&wave.remaining>0&&wave.total>0&&wave.remaining<=Math.max(1,Math.ceil(wave.total*.5))){
   state.midWaveStorySeen=true;
   const target=wave.storyMomentTarget;
   state.storyMoment={...wave.storyMoment,targetId:target?.id||null,targetX:target?.x,targetY:target?.y,targetR:target?.r,age:0};
   emit('storyMoment',{...state.storyMoment,number:wave.number,sector:story.sector});
  }
  // CHUNK 4: the Monolith's fall is checked unconditionally, not inside the
  // blade gate — the seam opens even if the killing cut spent the blade.
  if(state.monolith&&![...combat.enemies.values()].some(e=>e.kind==='monolith')){
   settleSectorReward();
   rewardDimensionBreak();
   const finished=wave.number;state.shatters++;wave.cleared++;state.band=++wave.number;story.sector=wave.number;
   story.reaction=finished<=3?{kind:finished===1?'smug':finished===2?'alarm':'split',age:0}:null;
   emit('dimensionBreak',{x:p.x,y:p.y,cycle:finished-1});emit('sector',{band:wave.number,name:`SECTOR ${wave.number}`});
   // CHUNK 4: continuous mode never emitted `waveClear`, so the 'CLEAR A WAVE'
   // lesson (and anything else listening for the wave-mode clear) could never
   // fire in the shipped mode. The sector seal breaking IS this mode's clear;
   // it says so now. The goal is already settled above, and it is idempotent.
   emit('waveClear',{number:finished,sector:finished,continuous:true,shattered:!!state.shatters});
   // CHUNK 6B: longer sector lifts — each corridor rises 1000px, and
   // the landlord fight happens on its own floor.
   arena.y-=1000;story.conduits=3;state.edge=state.edgeMax;state.focus=1;state.invul=Math.max(state.invul,45);
   state.monolith=false;
   startSector();beginRestBeat(wave.number);
   return;
  }
  if(story.sparkAge>0)story.sparkAge=Math.max(0,story.sparkAge-t);
  for(const id of prismIds)if(!combat.enemies.has(id)){prismIds.delete(id);if(wave.number===3){story.conduits=Math.max(0,story.conduits-1);story.sparkAge=30;}}
  const speed=Math.hypot(world.player.velocity.x,world.player.velocity.y);
  wave.pace=stepSpeedPace(wave.pace,{speed:Math.min(speed,(state.moved||0)/Math.max(.001,t)),dt:t,holding:!!state.held,active:directorActive});
  state.bestPace=Math.max(state.bestPace||0,wave.pace.best);
  // CHUNK 4: `paceHeld` was a wave-mode-only event, so the 'HOLD YOUR PACE'
  // lesson could never be earned in the shipped mode even though the run was
  // measuring the same thing every tick. Once per sector, on the first hold.
  if(directorActive&&wave.pace.held&&!wave.paceNotified){wave.paceNotified=true;emit('paceHeld',{number:wave.number,sector:wave.number,continuous:true});}
  // CHUNK 4: same for a clean bank. run.js emits `cleanBank` from the physics
  // path in wave mode; the continuous director does not run that path, so it
  // watches the bank total instead. One event per bank, never a per-tick stream.
  {
   const banks=wave.cleanBanks?.total||0;
   if(directorActive&&banks>wave.bankNotified){
    wave.bankNotified=banks;
    emit('cleanBank',{number:wave.number,sector:wave.number,total:banks,continuous:true});
   }
  }
  state.breakthrough=stepBreakthrough(state.breakthrough,{dt:t,active:directorActive,paceHeld:wave.pace.held,atPace:wave.pace.speed>=wave.pace.target,holding:!!state.held});
  if(directorActive&&state.blade>0){
   const a=state.slashAngle||0,mods=state.upgradeModifiers||{},reach=(state.reach||1)*(state.sword?.reach||1)*(mods.reach||1),span=82.8*reach,width=21.85*reach*horizontalCutWidth(a,rules)*(state.sword?.width||1)*(mods.width||1);
   const tip={x:p.x+Math.cos(a)*span,y:p.y+Math.sin(a)*span};
   const bladeHits=objects=>{const hits=rayHits(objects,p,tip,width);if(rules.closeWidth>1){const near=objects.filter(o=>Math.hypot(o.x-p.x,o.y-p.y)<=100);hits.push(...rayHits(near,p,tip,width*rules.closeWidth));}return hits;};
   if(story.intro&&bladeHits([story.fracture]).length){
    story.intro=false;story.openingBurst={x:story.fracture.x,y:story.fracture.y,age:0};story.fracture=null;state.edge=state.edgeMax;state.focus=1;
    // The real opening Fangs remain in the field when Sector 01 begins.
    startSector();emit('lockdownBreak',{x:p.x,y:p.y});
   }else if(!story.intro){
    const hits=new Set(bladeHits(targets.filter(x=>!x.broken)));
    for(const lock of targets)if(!lock.broken&&hits.has(lock.body)){
     lock.broken=true;story.conduits=Math.max(0,story.conduits-1);story.sparkAge=30;state.edge=Math.min(state.edgeMax,state.edge+1);
     story.lockBursts.push({x:lock.x,y:lock.y,index:lock.id,age:0});
     if(story.lockBursts.length>3)story.lockBursts.shift();
     emit('anchorBreak',{x:lock.x,y:lock.y,sector:wave.number,index:lock.id});
    }
    const seal=story.seal;seal.ready=targets.every(x=>x.broken);if(seal.ready&&sealBody)removeSeal();
    // CHUNK 4: a torn arena does not let the seam open. The Monolith answers.
    // CHUNK 3: and it answers on ITS OWN cadence, not only when the world has
    // already torn. The old rule required `arenaMode==='SHATTERED'`, which tied
    // the boss to a different system's progress bar — a player who never filled
    // the fracture never met the landlord at all, and the fight the game is
    // built around could be missed entirely in a short session. `landlordDue`
    // raises it on sectors 3, 7, 11… regardless; a torn arena still brings it
    // early, which is the one thing a tear is for.
    const landlord = landlordDue(wave.number) || state.arenaMode==='SHATTERED';
    if(seal.ready&&landlord&&!state.monolith){
    // Ordinary enemies still on the field are swept when the Monolith seats;
    // the seam is not for them.
    for(const e of [...combat.enemies.values()])combat.remove(e);combat.hazards.length=0;combat.links.length=0;
     state.monolith=true;
     story.chapter=LANDLORD_STORY.id;story.storyTitle=LANDLORD_STORY.title;story.storyChip=LANDLORD_STORY.chip;story.storyLine=LANDLORD_STORY.line;story.emotion=LANDLORD_STORY.emotion;
     const a=world.arena,mx=a.x+a.w/2,my=Math.min(p.y-520,seal.y-340);
     combat.add({id:'monolith/core',kind:'monolith',x:mx,y:my,home:'monolith',pinned:true,wavePlaced:true,delay:0,hp:10});
     story.reaction={kind:'split',age:0};
     state.edge=state.edgeMax;state.focus=1;state.held=false;state.invul=Math.max(state.invul,90);
     emit('monolithRise',{x:mx,y:my});
     lastPosition={x:p.x,y:p.y};
     return;
    }
     // A vulnerable seal must actually be crossed upward while the blade is live;
    // mere proximity, a passive touch, or approaching from above cannot advance.
    // CHUNK 4: while the Monolith stands in the seam, the crossing is void —
    // no meter spent, no silent sweep. The seam opens only when it falls.
    if(seal.ready&&!state.monolith&&lastPosition.y>seal.y&&p.y<=seal.y&&Math.abs(p.x-seal.x)<=seal.w/2){
      settleSectorReward();
      rewardDimensionBreak();
      // CHUNK 1: breaking a sector seal is this mode's wave clear; it banks the same +1 wave score bonus a wave-mode clear banks.
      const finished=wave.number;state.shatters++;wave.cleared++;state.band=++wave.number;story.sector=wave.number;
      story.reaction=finished<=3?{kind:finished===1?'smug':finished===2?'alarm':'split',age:0}:null;
      emit('dimensionBreak',{x:p.x,y:seal.y,cycle:finished-1});emit('sector',{band:wave.number,name:`SECTOR ${wave.number}`});
      // CHUNK 4: same clear, other door — the crossing path must announce it too
      // or the lesson depends on which route the player took.
      emit('waveClear',{number:finished,sector:finished,continuous:true,shattered:!!state.shatters});
      for(const e of [...combat.enemies.values()])combat.remove(e);combat.hazards.length=0;combat.links.length=0;
      // CHUNK 6B: longer sector lifts — each corridor rises 1000px, and
   // the landlord fight happens on its own floor.
   arena.y-=1000;story.conduits=3;state.edge=state.edgeMax;state.focus=1;state.invul=Math.max(state.invul,45);
      startSector();beginRestBeat(wave.number);
      if(finished===1){for(const [i,dx] of [-230,230].entries())combat.add({id:`crown/prism/${i}`,kind:'prism',x:Math.max(arena.x+80,Math.min(arena.x+arena.w-80,p.x+dx)),y:Math.max(arena.y+100,p.y-200),home:'crown',wave:true,wavePlaced:true,delay:150});}
    }
   }
  }
  lastPosition={x:p.x,y:p.y};
 }
 return {tick,cells,choose,goal:goalReadout,setPracticeLinks:()=>false,skipBreach:()=>false,dispose(){removeSeal();targets=[];cells.clear();}};
}
