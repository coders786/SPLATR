import {createDimensionField} from './dimension-field.js';
import {createCleanBanks} from './clean-banks.js';
import {createSpeedPace, stepSpeedPace} from './speed-pace.js';
import {planEncounter} from './encounters.js';
import {upgradeOffers} from './upgrades.js';
import {recommendWaveOffer} from './encounters.js';
import {gainFracture,FRACTURE_PER_WAVE_CLEAR} from './fracture.js';
// CHUNK 3: the landlord's cadence and the live bonus goal are rules, not
// director trivia — see flow.js for why each one is shaped the way it is.
import {landlordDue,goalFor,goalProgress,goalPayout} from './flow.js';
// CHUNK 4: the post — the run-length upgrade catalogue, granted on a clear
// with no chooser. See post.js for why it is a grant and not a draft.
import {postDue,choosePost,postLine} from './post.js';

// CHUNK 4: `catalogRewards` and `postRewards` are DIFFERENT things and must not
// share a flag:
//   catalogRewards — the rest chooser. Continuous play keeps this OFF; that is
//                    the earlier decision recorded in waves.js, and turning it
//                    on here would stop the field at every clear (verified: the
//                    run parked in `phase:'choose'` with no picker on screen).
//   postRewards    — one auto-picked card per clear, no UI, no stop.
export function createContinuousDirector({seed,world,combat,state,emit=()=>{},catalogRewards=false,postRewards=false,onUpgrade=null,onRush=null}) {
 const cells=new Map(), arena=world.arena;
 const wave=state.wave={number:1,phase:'combat',entry:0,age:0,total:0,remaining:0,cleared:0,platform:null,spawnPadGone:false,offers:[],recommendation:null,upgradeChosen:false};
 const arcade=state.arcade={sector:1,rest:null};
 function encounter(){
  const p=world.player.position;
  // Keep each new formation near the player without forcing movement through a
  // doorway. The formation remains fully within the expanded arcade field.
  const x=Math.max(arena.x+1000,Math.min(arena.x+arena.w-1000,p.x));
  const y=Math.max(arena.y+1700,Math.min(arena.y+arena.h-300,p.y+350));
  const plan=planEncounter(seed,wave.number,{x:p.x-x,y:p.y-y});
  wave.brief=plan;wave.total=plan.total;wave.remaining=plan.total;
  const mods=state.upgradeModifiers||{};
  for(const spec of plan.specs){
   const hp=spec.kind==='bastion'&&Number.isFinite(mods.bastionArmor)?Math.max(1,2+mods.bastionArmor):undefined;
   combat.add({...(hp==null?spec:{...spec,hp}),x:spec.x+x,y:spec.y+y,id:`sector/${wave.number}/${spec.slot}`});
  }
  const prisms=[...combat.enemies.values()].filter(e=>e.kind==='prism');
  cells.clear();for(let i=0;i+1<prisms.length;i+=2)cells.set(`link/${i}`,{link:{a:prisms[i].id,b:prisms[i+1].id,period:300+i*30,age:0}});
  state.dimension=createDimensionField(wave.number-1);
  // The arcade has one Rush, not a second pace-triggered surge state.
  state.breakthrough=null;
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
 function startSector(){arcade.sector=wave.number;encounter();}
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
  if(!wave.goal)return null;
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
 function beginRestBeat(sector){
  if(!catalogRewards)return;
  // The continuous field keeps flowing, but a sector crossing gets the same
  // readable half-second landing beat as wave mode. Enemies are staged before
  // the beat so the camera never goes empty; director activity and chooser
  // input remain asleep until the beat is over.
  arcade.rest={sector,age:0,ticks:30};
  wave.phase='combat';
  wave.entry=30;
  wave.upgradeChosen=false;
  wave.offers=[];
  wave.recommendation=null;
 }
 function openCatalogRest(){
  if(!catalogRewards||wave.phase!=='combat'||!arcade.rest)return;
  if(arcade.rest.age<arcade.rest.ticks)return;
  arcade.rest=null;
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
 startSector();
 function advance(p){
  const finished=wave.number;
  settleSectorReward();
  wave.cleared++;state.band=++wave.number;arcade.sector=wave.number;
  state.monolith=false;
  combat.hazards.length=0;combat.links.length=0;
  state.edge=state.edgeMax;state.focus=1;state.invul=Math.max(state.invul,45);
  emit('waveClear',{number:finished,sector:finished,continuous:true,shattered:false});
  emit('sector',{band:wave.number,name:`SECTOR ${wave.number}`});
  // Arcade waves replaced vertical sectors; keep the fifth-stage challenge
  // attainable in real runs, but never unlock it from isolated practice.
  if(wave.number===5&&!state.practice)emit('challenge',{id:'glass'});
  startSector();beginRestBeat(wave.number);
 }
 function tick(dt=1){
  const p=world.player.position,t=Math.max(0,Math.min(1,dt));
  wave.entry=Math.max(0,(wave.entry||0)-t);
  if(arcade.rest)arcade.rest.age+=t;
  openCatalogRest();
  if(wave.phase==='choose')return;
  const active=state.phase==='playing',directorActive=active&&wave.entry<=0;
  wave.age+=t;wave.remaining=combat.enemies.size;
  if(wave.firstKillTick<0&&(state.kills||0)>(wave.startKills||0))wave.firstKillTick=wave.age;
  // Real enemies, including spawned fragments, must all be defeated. Bosses
  // arrive as an arcade encounter, not as a door or staged transition.
  if(directorActive&&wave.remaining===0){
   if(!state.monolith && (landlordDue(wave.number)||state.arenaMode==='SHATTERED')){
    state.monolith=true;
    const mx=Math.max(arena.x+200,Math.min(arena.x+arena.w-200,p.x));
    const my=Math.max(arena.y+200,Math.min(arena.y+arena.h-200,p.y-520));
    combat.add({id:'monolith/core',kind:'monolith',x:mx,y:my,home:'monolith',pinned:true,wavePlaced:true,delay:0,hp:10});
    wave.remaining=combat.enemies.size;
    state.edge=state.edgeMax;state.focus=1;state.invul=Math.max(state.invul,90);
    emit('monolithRise',{x:mx,y:my});
   }else advance(p);
   return;
  }
  const speed=Math.hypot(world.player.velocity.x,world.player.velocity.y);
  wave.pace=stepSpeedPace(wave.pace,{speed:Math.min(speed,(state.moved||0)/Math.max(.001,t)),dt:t,holding:!!state.held,active:directorActive});
  state.bestPace=Math.max(state.bestPace||0,wave.pace.best);
  // CHUNK 4: `paceHeld` was a wave-mode-only event, so the 'HOLD YOUR PACE'
  // lesson could never be earned in the shipped mode even though the run was
  // measuring the same thing every tick. Once per sector, on the first hold.
  if(directorActive&&wave.pace.held&&!wave.paceNotified){wave.paceNotified=true;emit('paceHeld',{number:wave.number,sector:wave.number,continuous:true});onRush?.('speed');}
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

 }
 return {tick,cells,choose,goal:goalReadout,setPracticeLinks:()=>false,skipBreach:()=>false,dispose(){cells.clear();}};
}
