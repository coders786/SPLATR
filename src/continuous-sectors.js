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

// The targets are Matter sensor shapes queried by the same forward blade ray
// used for enemies. They are not proximity-triggered or timed objectives.
export function createContinuousDirector({seed,world,combat,state,emit=()=>{},intro=false,catalogRewards=false,onUpgrade=null}) {
 const cells=new Map(), arena=world.arena, rules=equipmentRules(state.equipment);
 // CHUNK 1: the lift used to be the literal 1250 (the old arena top). Derive it
 // from the live arena so the 1.3x arena keeps spawn clearance honest. Captured
 // once -- `arena.y` is mutated sector-to-sector as the world grows upward.
 const LIFT = -arena.y;
 const wave=state.wave={number:1,phase:'combat',entry:0,age:0,total:0,remaining:0,cleared:0,platform:null,spawnPadGone:false,offers:[],recommendation:null,upgradeChosen:false};
 const story=state.narrative={intro:!!intro,introAge:0,sector:1,locks:[],seal:null,fracture:null,reaction:null,rest:null,conduits:3};
 let targets=[],lastPosition={...world.player.position}, prismIds=new Set(),sealBody=null,sealGeometry=null;
 function body(x,y,r,label){return Matter.Bodies.circle(x,y,r,{isStatic:true,isSensor:true,label});}
 function removeSeal(){
  if(sealBody)Matter.Composite.remove(world.engine.world,sealBody);
  if(sealGeometry){const index=world.geometry.indexOf(sealGeometry);if(index>=0)world.geometry.splice(index,1);}
  sealBody=null;sealGeometry=null;
 }
 function install(){
  removeSeal();
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
  wave.brief=plan;wave.total=plan.total;wave.remaining=plan.total;
  const mods=state.upgradeModifiers||{};
  for(const spec of plan.specs){
   const hp=spec.kind==='bastion'&&Number.isFinite(mods.bastionArmor)?Math.max(1,2+mods.bastionArmor):undefined;
   combat.add({...(hp==null?spec:{...spec,hp}),y:spec.y+arena.y+LIFT,id:`sector/${wave.number}/${spec.slot}`});
  }
  const prisms=[...combat.enemies.values()].filter(e=>e.kind==='prism');
  prismIds=new Set(prisms.map(e=>e.id));
  cells.clear();for(let i=0;i+1<prisms.length;i+=2)cells.set(`link/${i}`,{link:{a:prisms[i].id,b:prisms[i+1].id,period:300+i*30,age:0}});
  state.dimension=createDimensionField(wave.number-1);state.breakthrough=createBreakthrough(wave.number-1);
  wave.pace=createSpeedPace(wave.number);wave.cleanBanks=createCleanBanks();
  wave.startDamage=state.damageTaken||0;wave.startScore=state.score||0;wave.startCredits=state.killLedger?.credits||0;
  emit('waveStart',{number:wave.number,total:wave.total});
 }
 function startSector(){install();encounter();}
 function settleSectorReward(){
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
  if(story.reaction){story.reaction.age+=t;if(story.reaction.age>=48)story.reaction=null;}
  wave.age+=t;wave.remaining=combat.enemies.size;
  // CHUNK 4: the Monolith's fall is checked unconditionally, not inside the
  // blade gate — the seam opens even if the killing cut spent the blade.
  if(state.monolith&&![...combat.enemies.values()].some(e=>e.kind==='monolith')){
   settleSectorReward();
   rewardDimensionBreak();
   const finished=wave.number;state.shatters++;wave.cleared++;state.band=++wave.number;story.sector=wave.number;
   story.reaction=finished<=3?{kind:finished===1?'smug':finished===2?'alarm':'split',age:0}:null;
   emit('dimensionBreak',{x:p.x,y:p.y,cycle:finished-1});emit('sector',{band:wave.number,name:`SECTOR ${wave.number}`});
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
  state.breakthrough=stepBreakthrough(state.breakthrough,{dt:t,active:directorActive,paceHeld:wave.pace.held,atPace:wave.pace.speed>=wave.pace.target,holding:!!state.held});
  if(directorActive&&state.blade>0){
   const a=state.slashAngle||0,mods=state.upgradeModifiers||{},reach=(state.reach||1)*(state.sword?.reach||1)*(mods.reach||1),span=82.8*reach,width=21.85*reach*horizontalCutWidth(a,rules)*(state.sword?.width||1)*(mods.width||1);
   const tip={x:p.x+Math.cos(a)*span,y:p.y+Math.sin(a)*span};
   const bladeHits=objects=>{const hits=rayHits(objects,p,tip,width);if(rules.closeWidth>1){const near=objects.filter(o=>Math.hypot(o.x-p.x,o.y-p.y)<=100);hits.push(...rayHits(near,p,tip,width*rules.closeWidth));}return hits;};
   if(story.intro&&bladeHits([story.fracture]).length){
    story.intro=false;story.fracture=null;state.edge=state.edgeMax;state.focus=1;
    // The real opening Fangs remain in the field when Sector 01 begins.
    startSector();emit('lockdownBreak',{x:p.x,y:p.y});
   }else if(!story.intro){
    const hits=new Set(bladeHits(targets.filter(x=>!x.broken)));
    for(const lock of targets)if(!lock.broken&&hits.has(lock.body)){
     lock.broken=true;story.conduits=Math.max(0,story.conduits-1);story.sparkAge=30;state.edge=Math.min(state.edgeMax,state.edge+1);
     emit('anchorBreak',{x:lock.x,y:lock.y,sector:wave.number,index:lock.id});
    }
    const seal=story.seal;seal.ready=targets.every(x=>x.broken);if(seal.ready&&sealBody)removeSeal();
    // CHUNK 4: a torn arena does not let the seam open. The Monolith answers.
    if(seal.ready&&state.arenaMode==='SHATTERED'&&!state.monolith){
    // Ordinary enemies still on the field are swept when the Monolith seats;
    // the seam is not for them.
    for(const e of [...combat.enemies.values()])combat.remove(e);combat.hazards.length=0;combat.links.length=0;
     state.monolith=true;
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
 return {tick,cells,choose,setPracticeLinks:()=>false,skipBreach:()=>false,dispose(){removeSeal();targets=[];cells.clear();}};
}
