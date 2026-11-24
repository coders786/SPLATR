import {platformMagnet} from './platform-magnet.js';
import {createBreakthrough,stepBreakthrough,placeBreach,crossesBreach,breachCue} from './breakthrough.js';
import {createDimensionField,settleDimensionField} from './dimension-field.js';
import {createCleanBanks} from './clean-banks.js';
import {createSpeedPace,stepSpeedPace} from './speed-pace.js';
import {encounterBrief,planEncounter,recommendWaveOffer} from './encounters.js';
import Matter from 'matter-js';
import {placePlayer,stopPlayer,setPlayerVelocity,setBulletTime} from './physics.js';
import {gainFracture,FRACTURE_PER_WAVE_CLEAR,FRACTURE_PER_DIMENSION_BREAK} from './fracture.js';
import {upgradeOffers} from './upgrades.js';
import {storyMomentForWave} from './story-arc.js';
// ── CHUNK 6B: THE BIGGER ARENA ──────────────────────────────────────────
//
// CHUNK 1 grew the arena 1800 x 1550 -> 2340 x 2015 (~1.3x on both axes).
// CHUNK 6B grows it again for the landlord: 3200 x 2600 (+37% width, +29%
// height) so the seam corridor, the banks and the boss fight get real
// canvas. The floor stays at +300 so the pad, the spawn and the trampoline
// keep their measured heights; every pixel of new room comes from the sides
// and the headroom above.
//
//   2340 * 1.368 = 3200   2015 * 1.29 = 2600
//   x = -3200/2 = -1600   y = 300 - 2600 = -2300
export const WAVE_ARENA=Object.freeze({x:-1600,y:-2300,w:3200,h:2600});
export const WAVE_BUFFS=Object.freeze([
 {id:'comet',title:'COMET DRIVE',stat:'DASH +25% / REACH −15%',note:'A faster launch with a shorter cutting line.',speed:1.25,reach:.85,category:'HANDLING'},
 {id:'cleaver',title:'HEAVY CLEAVER',stat:'+2 ARMOR / BLADE −4',note:'Break more armor with a shorter blade window.',armor:2,blade:-4,category:'ATTACK'},
 {id:'duelist',title:'GLASS EDGE',stat:'SCORE +50% / GRACE −4',note:'Higher score with less escape time after a cut.',score:1.5,guard:-4,category:'STAKES'},
 {id:'bastion',title:'TWIN WARD',stat:'BLOCK 2 / DASH −10%',note:'Block two enemy hits. Slower launches; no health restored.',shield:2,speed:.9,category:'STAKES'},
 {id:'fleet',title:'SWIFT EDGE',stat:'DASH +15%',note:'Faster launches. Same blade travel.',speed:1.15,category:'HANDLING'},
 {id:'reach',title:'LONG EDGE',stat:'REACH +20%',note:'Reach targets farther along your cutting line.',reach:1.2,category:'ATTACK'},
 {id:'breaker',title:'ARMOR BREAK',stat:'+1 ARMOR DAMAGE',note:'Strip an extra armored plate.',armor:1,category:'ATTACK'},
 {id:'linger',title:'LASTING EDGE',stat:'BLADE +8 TICKS',note:'Keep cutting longer after release.',blade:8,category:'ATTACK'},
 {id:'bounty',title:'BOUNTY EDGE',stat:'SCORE +25%',note:'More points from enemy cuts.',score:1.25,category:'STAKES'},
 {id:'guard',title:'SAFE EDGE',stat:'CUT GRACE +8',note:'More escape time after contact.',guard:8,category:'HANDLING'},
 {id:'barrier',title:'ONE-HIT WARD',stat:'BLOCK 1 HIT',note:'One otherwise damaging enemy hit is blocked next wave. No health is restored.',shield:1,category:'STAKES'},
].map(x=>Object.freeze(x)));
export const waveBrief=encounterBrief;

function retainUpgrade(state,buff){
 if(!buff?.fields)return false;
 const f=buff.fields,m={...(state.upgradeModifiers||{}),ids:[...(state.upgradeModifiers?.ids||[]),buff.id]};
 for(const key of ['speed','reach','width','score','credits'])if(Number.isFinite(f[key]))m[key]=(m[key]??1)*f[key];
 for(const key of ['armor','blade','guard','shield','hyperRefund','pacePip','fractureClear','startFracture'])if(Number.isFinite(f[key]))m[key]=(m[key]??0)+f[key];
 if(Number.isFinite(f.shatterFracture))m.shatterFracture=f.shatterFracture;
 if(Number.isFinite(f.healthMax))m.healthMax=Math.min(m.healthMax??Infinity,f.healthMax);
 if(Number.isFinite(f.aimFallGravity))m.aimFallGravity=Math.max(m.aimFallGravity??.1,f.aimFallGravity);
 if(Number.isFinite(f.bladeDecay))m.bladeDecay=(m.bladeDecay??1)*f.bladeDecay;
 if(Number.isFinite(f.executeThreshold))m.executeThreshold=Math.max(m.executeThreshold??0,f.executeThreshold);
 if(Number.isFinite(f.executeMultiplier))m.executeMultiplier=(m.executeMultiplier??1)*f.executeMultiplier;
 state.upgrades=[...(state.upgrades||[]),buff];state.upgradeModifiers=Object.freeze({...m,ids:Object.freeze(m.ids)});
 return true;
}
export function waveOffers(seed,wave,options=null){
 // The two-argument export is the compatibility surface for the original
 // eleven temporary wave modifiers. The 6C director opts into the 40-card,
 // run-length catalogue without changing deterministic callers that still
 // inspect the old offer contract.
 if(options?.catalog)return upgradeOffers(seed,wave,options);
 let n=(seed^Math.imul(wave,2654435761))>>>0;const pool=[...WAVE_BUFFS];
 for(let i=pool.length-1;i>0;i--){n=(Math.imul(n,1664525)+1013904223)>>>0;const j=n%(i+1);[pool[i],pool[j]]=[pool[j],pool[i]];}
 return Object.freeze(['ATTACK','HANDLING','STAKES'].map(category=>{
  const buff=pool.find(buff=>buff.category===category);
  n=(Math.imul(n,1664525)+1013904223)>>>0;
  // A bounded windfall, earned only when chosen; never rerolled by reopening.
  if(n%5!==0)return buff;
  const lucky={...buff,lucky:true};
  if(buff.id==='fleet'){lucky.speed=1.25;lucky.luckyStat='Speed +25%';}
  else if(buff.id==='reach'){lucky.reach=1.3;lucky.luckyStat='Reach +30%';}
  else if(buff.id==='linger'){lucky.blade=12;lucky.luckyStat='Slash time +0.20s';}
  else if(buff.id==='guard'){lucky.guard=12;lucky.luckyStat='Exit window +0.20s';}
  else if(buff.id==='bounty'){lucky.score=1.4;lucky.luckyStat='Score +40%';}
  else return buff; // Tradeoffs and shield counts never secretly change.
  return Object.freeze(lucky);
 }));
}
export const waveUpgradeOffers=upgradeOffers;
/** Finite budgets. No timer/kill-count proxy can clear a wave while a real
 * enemy or Fork fragment remains alive. Buffs are replaced, never stacked. */
export function createWaveDirector({seed,world,combat,state,emit=()=>{},baseDashSpeed=1,controlPractice=false,catalogRewards=false,onUpgrade=null}){
 let platformBody=null,dwell=0;
 const cells=new Map();let start=null;
 const wave=state.wave={number:controlPractice?5:1,phase:'combat',total:0,remaining:0,platform:null,offers:[],cleared:0,storyMoment:null,storyMomentTarget:null};
 function removePlatform(){if(platformBody)Matter.Composite.remove(world.engine.world,platformBody);const index=world.geometry.indexOf(wave.platform);if(index>=0)world.geometry.splice(index,1);platformBody=null;wave.platform=null;wave.magnet=null;dwell=0;}
 function spawn(){
  const cycle=Math.floor((wave.number-1)/5);if(!state.dimension||state.dimension.cycle!==cycle)state.dimension=createDimensionField(cycle);
  if(!state.breakthrough||state.breakthrough.cycle!==cycle)state.breakthrough=createBreakthrough(cycle);
  // CHUNK 2: the formed cracks in the world field angrier formations.
  // `fracture.tier` is 0 for a fresh meter, so untouched saves behave as before.
  const plan=planEncounter(seed,wave.number,world.player.position,state.fracture?.tier??0);wave.total=controlPractice?0:plan.total;wave.brief=plan;wave.storyMoment=controlPractice?null:storyMomentForWave(wave.number,plan);wave.storyMomentTarget=null;wave.pace=createSpeedPace(wave.number);wave.cleanBanks=createCleanBanks();wave.age=0;wave.entry=controlPractice?0:30;wave.breach=null;wave.paceNotified=false;wave.shattered=false;wave.shatterFx=null;wave.shatterTrace=null;
  start={elapsed:state.elapsed,kills:state.kills,shots:state.shots,score:state.score,damage:state.damageTaken||0,credits:state.killLedger?.credits||0};
  const mods=state.upgradeModifiers||{};
  for(const spec of controlPractice?[]:plan.specs){
   const hp=spec.kind==='bastion'&&Number.isFinite(mods.bastionArmor)?Math.max(1,2+mods.bastionArmor):undefined;
   combat.add(hp==null?spec:{...spec,hp});
  }
  cells.clear();(controlPractice?[]:plan.links).forEach((link,i)=>cells.set(`wave-link/${i}`,{link:{...link}}));
  wave.storyMomentTarget=wave.storyMoment
    ? [...combat.enemies.values()].find(enemy=>enemy.kind===wave.storyMoment.mechanic)||null
    : null;
  state.invul=Math.max(state.invul,30);
  // Persistent ward cards recharge at the start of each wave; legacy cards
  // still use the one-wave `waveShield` assignment in choose().
  if(state.upgradeModifiers?.shield)state.waveShield=state.upgradeModifiers.shield;
  wave.remaining=combat.enemies.size;emit('waveStart',{number:wave.number,total:wave.total});
 }
 function rest(){
  state.dimension=settleDimensionField(state.dimension);
  wave.breach=null;
  wave.phase='return';wave.upgradeChosen=false;wave.expiredBuff=state.waveBuff||null;wave.expiredShield=state.waveShield;state.waveBuff=null;state.dashSpeed=baseDashSpeed*(state.upgradeModifiers?.speed||1);state.held=false;setBulletTime(world,false,true);wave.report=Object.freeze({ticks:state.elapsed-start.elapsed,cuts:state.kills-start.kills,shots:state.shots-start.shots,score:state.score-start.score,hits:(state.damageTaken||0)-start.damage,paceBest:wave.pace.best,paceHeld:wave.pace.held,paceTarget:wave.pace.target,cleanBanks:wave.cleanBanks.total,bestBanks:wave.cleanBanks.best,credits:(state.killLedger?.credits||0)-start.credits,shattered:!!wave.shattered});cells.clear();state.waveShield=0;wave.next=waveBrief(wave.number+1,seed);wave.restAge=0;wave.cleared++;combat.hazards.length=0;combat.links.length=0;
  // Retire the launch pad before summoning the rest deck. Otherwise the old
  // pad can hold the player above the new one forever at the spawn point.
  if(!wave.spawnPadGone){for(const body of [...world.engine.world.bodies])if(body.isStatic&&!body.isSensor)Matter.Composite.remove(world.engine.world,body);world.geometry.length=0;wave.spawnPadGone=true;}
  const p=world.player.position,a=world.arena;
  const x=Math.max(a.x+190,Math.min(a.x+a.w-190,p.x)),y=Math.max(a.y+150,Math.min(a.y+a.h-90,p.y+90));
  wave.platform={x:x-150,y,w:300,h:24};world.geometry.push(wave.platform);
  platformBody=Matter.Bodies.rectangle(x,y+12,300,24,{isStatic:true,label:'wave-rest',friction:1,restitution:0});Matter.Composite.add(world.engine.world,platformBody);
  state.edge=state.edgeMax;state.focus=1;state.hyper=false;state.hyperLevel=0;state.blade=0;state.chain=0;state.chainTime=0;state.stop=0;
  // ── CHUNK 1: +1 BONUS SCORE MULTIPLIER PER CLEAR ─────────────────────────
  // Every cleared wave banks a permanent +1 into the run's score multiplier
  // (see the cut scorer in run.js). Dying still ends the run; it never claws
  // the bonus back. Capped there at the chain ladder's own ceiling.
  state.waveMult=(state.waveMult||0)+1;
  // CHUNK 6C: the run-length cards resolve at the clear boundary, where the
  // game can honestly know whether the wave was flawless and whether its pace
  // threshold was actually held. These are additive rewards, never UI-only
  // promises.
  const mods=state.upgradeModifiers||{}, report=wave.report;
  if(!controlPractice&&report?.hits===0){
   if(Number.isFinite(mods.flawlessScore)&&mods.flawlessScore>1){
    const bonus=Math.floor(Math.max(0,report.score)*(mods.flawlessScore-1));
    state.score+=bonus;
   }
   if(Number.isFinite(mods.flawlessFracture)&&mods.flawlessFracture>0)gainFracture(state,mods.flawlessFracture,emit);
  }
  if(!controlPractice&&Number.isFinite(mods.crownPace)&&wave.pace.best>=mods.crownPace){
   gainFracture(state,mods.crownFracture||0,emit);
   if(state.killLedger&&Number.isFinite(mods.crownCredits)&&mods.crownCredits>1){
    const extra=Math.max(0,Math.floor(Math.max(0,report.credits)*(mods.crownCredits-1)));
    state.killLedger={...state.killLedger,credits:Math.min(10000,state.killLedger.credits+extra)};
   }
  }
  // No-stakes control practice does not fracture the world.
  if(!controlPractice)gainFracture(state,FRACTURE_PER_WAVE_CLEAR+(mods.fractureClear||0),emit);
  emit('waveClear',{number:wave.number,platform:wave.platform,shattered:!!wave.shattered,waveMult:state.waveMult});
 }
 function tick(dt=1){
  if(wave.shatterFx){wave.shatterFx.age+=dt;if(wave.shatterFx.age>=64)wave.shatterFx=null;}
  if(['combat','breach','monolith'].includes(wave.phase)){
   wave.age+=dt;wave.entry=Math.max(0,wave.entry-dt);
   // Movement is measured after integration. Normalise slow simulation time;
   // require actual displacement as well as velocity (no stuck-wall credit).
   const v=world.player.velocity,velocity=Math.hypot(v.x,v.y);
   const measured=Number.isFinite(state.moved)?state.moved/Math.max(.001,dt):0;
   // A validated arrival can have a short displacement on its clamp tick.
   // Use its real exit velocity once; do not mistake a good rebound for a stall.
   const bankedNow=wave.cleanBanks.flash===54&&wave.cleanBanks.lastAt===wave.cleanBanks.ticks;
   wave.pace=stepSpeedPace(wave.pace,{speed:bankedNow?velocity:Math.min(velocity,measured),dt,holding:!!state.held,active:state.phase==='playing'&&!state.opening&&!state.tutorialActive&&wave.entry<=0&&!state.stop});
   state.bestPace=Math.max(state.bestPace||0,wave.pace.best);
   const active=state.phase==='playing'&&!state.opening&&!state.tutorialActive&&wave.entry<=0&&!state.stop;
   state.breakthrough=stepBreakthrough(state.breakthrough,{dt,active,paceHeld:wave.pace.held,atPace:wave.pace.speed>=wave.pace.target,holding:!!state.held});
   if(active&&wave.pace.held&&!wave.paceNotified){wave.paceNotified=true;emit('paceHeld',{number:wave.number});}
   wave.remaining=combat.enemies.size;
   const storyActive=state.phase==='playing'&&!state.opening&&!state.tutorialActive&&wave.entry<=0&&!state.stop&&!state.cutscene;
   // The first wave's real Pulse is the only authored mid-wave set piece. The
   // guard lives on the run state, while the half-formation threshold makes
   // the timing gameplay-earned rather than a timer-only interruption.
   if(storyActive&&!state.midWaveStorySeen&&wave.storyMoment&&wave.remaining>0&&wave.total>0&&wave.remaining<=Math.max(1,Math.ceil(wave.total*.5))){
    state.midWaveStorySeen=true;
    const target=wave.storyMomentTarget;
    state.storyMoment={...wave.storyMoment,targetId:target?.id||null,targetX:target?.x,targetY:target?.y,targetR:target?.r,age:0};
    emit('storyMoment',{...state.storyMoment,number:wave.number});
   }
   if((wave.phase==='monolith')&&wave.remaining===0){
    // The Monolith fell. The rest deck rises — the ordinary end-of-wave ritual.
    rest();
    return;
   }
   if(wave.phase==='combat'&&wave.remaining===0){
    if(wave.number%5!==0)rest();
    // ── CHUNK 4: THE MONOLITH ────────────────────────────────────────────
    // A torn arena does not breach; it manifests. The fifth clear opens no
    // portal — the tear's landlord stands. One slab. Ten health, five plates,
    // and only a banked OVERCHARGED cut takes a plate.
    else if(state.arenaMode==='SHATTERED'&&!controlPractice){
     wave.phase='monolith';cells.clear();combat.hazards.length=0;combat.links.length=0;
     const a=world.arena,mx=a.x+a.w/2,my=a.y+a.h*0.30;
     combat.add({id:'monolith/core',kind:'monolith',x:mx,y:my,home:'monolith',pinned:true,wavePlaced:true,delay:0,hp:10});
     state.edge=state.edgeMax;state.focus=1;state.held=false;state.invul=Math.max(state.invul,90);setBulletTime(world,false,true);
     emit('monolithRise',{x:mx,y:my});
    }
    else{
     wave.phase='breach';cells.clear();combat.hazards.length=0;combat.links.length=0;
     const p=world.player.position,q=placeBreach(world.arena,p,world.viewport);
     wave.breach={...q,r:42,ready:false,armed:false,readyShot:state.shots,previous:{...p},age:0,lastFeedbackShot:-1,cue:breachCue(state)};
     state.edge=state.edgeMax;state.focus=1;state.held=false;setBulletTime(world,false,true);emit('breachOpen',q);
    }
   }
   if(wave.phase==='breach'){
    const b=wave.breach,p=world.player.position;
    state.invul=Math.max(state.invul,90);state.edge=state.edgeMax;state.focus=1;combat.hazards.length=0;combat.links.length=0;
    if(active){
     b.age+=dt;if(b.feedback){b.feedback.age+=dt;if(b.feedback.age>=24)b.feedback=null;}
     if(state.breakthrough.sonic&&!b.ready){b.ready=true;b.readyShot=state.shots;emit('breachReady',{x:b.x,y:b.y});}
     if(b.ready&&!b.armed&&!state.held){b.armed=true;b.readyShot=state.shots;}
     else if(b.ready&&b.armed&&!state.held&&state.shots>b.readyShot&&velocity>=wave.pace.target&&crossesBreach(b.previous,p,b)){
      wave.shatterFx={x:b.x,y:b.y,age:0,angle:Math.atan2(v.y,v.x),speed:velocity};wave.shatterTrace={x:b.x,y:b.y,angle:Math.atan2(v.y,v.x)};state.shatters++;state.breakthrough={...state.breakthrough,shattered:true};wave.shattered=true;
      if(!controlPractice)gainFracture(state,state.upgradeModifiers?.shatterFracture||FRACTURE_PER_DIMENSION_BREAK,emit);
      emit('dimensionBreak',{x:b.x,y:b.y,cycle:state.breakthrough.cycle});rest();
     }
     if(wave.phase==='breach'){
      b.cue=breachCue(state);
      if(!state.held&&state.shots>0&&state.shots!==b.lastFeedbackShot&&velocity>4&&crossesBreach(b.previous,p,b)){
       const kind=!b.ready?breachCue(state).title:state.shots<=b.readyShot?'NEW DASH':'MORE SPEED';
       b.feedback={kind,reason:!b.ready?'sealed':state.shots<=b.readyShot?'fresh':'slow',age:0,angle:Math.atan2(v.y,v.x)};b.lastFeedbackShot=state.shots;
       emit('breachContact',{x:b.x,y:b.y,kind,reason:b.feedback.reason,angle:b.feedback.angle,speed:velocity});
      }
     }
    }
    b.previous={...p};
   }
  }else if(wave.phase==='return'){
   wave.restAge++;
   combat.hazards.length=0;
   const q=wave.platform,p=world.player.position,v=world.player.velocity;
   const magnet=platformMagnet(q,p,v,{active:state.phase==='playing',held:state.held,launchGrace:state.launchGrace,dt,arena:world.arena});
   wave.magnet=magnet.active?{active:true,route:magnet.route}:null;
   if(magnet.active)setPlayerVelocity(world,magnet.vx,magnet.vy);
   const on=Math.abs(p.x-(q.x+q.w/2))<q.w/2-24&&Math.abs(p.y-(q.y-23))<14&&v.y>=-1;
   dwell=on?dwell+1:0;
   if(dwell>=12){placePlayer(world,{x:p.x,y:q.y-23});stopPlayer(world);state.held=false;wave.phase='choose';
    // CHUNK 6C: wave mode is the one place the chooser is intentionally
    // retained (continuous mode stays chooser-free by user decision). D-tier
    // cards appear only after the run has actually Shattered; selected cards
    // remain owned for the run instead of expiring at the next clear.
    wave.offers=catalogRewards
      ? waveOffers(seed,wave.number,{catalog:true,shattered:(state.shatters|0)>0||state.arenaMode==='SHATTERED',owned:(state.upgrades||[]).map(x=>x.id),luckyTwice:!!state.upgradeModifiers?.luckyTwice})
      : waveOffers(seed,wave.number);
    wave.recommendation=recommendWaveOffer(wave.offers,{next:wave.next,sword:state.sword,hp:state.hp,previous:wave.report});emit('waveRest',{number:wave.number});}
  }
 }
 function choose(id){
  // Phase is the authoritative read-lock for the legacy compatibility path;
  // callers may restore a serialized/rest fixture by setting `choose` and its
  // offer hand without also carrying this historical sentinel.
  if(wave.phase!=='choose')return false;
  let buff=wave.offers.find(x=>x.id===id);
  // Compatibility: older callers may choose one of the original eleven by
  // id after the 6C deck has dealt a catalog hand. That path remains a
  // temporary modifier; visible 6C cards always carry `fields`.
  if(!buff){
   const legacy=WAVE_BUFFS.find(x=>x.id===id);
   if(!legacy)return false;
   buff=legacy;
  }
  const persistent=catalogRewards&&(onUpgrade?onUpgrade(buff):retainUpgrade(state,buff));
  if(catalogRewards&&!persistent)return false;
  state.waveBuff=buff;
  state.waveShield=persistent?(state.upgradeModifiers?.shield||0):(buff.shield||0);
  state.dashSpeed=baseDashSpeed*(persistent?(state.upgradeModifiers?.speed||1):(buff.speed||1));
  state.edge=state.edgeMax;state.focus=1;state.held=false;state.invul=Math.max(state.invul,90);state.launchGrace=0;
  state.upgradeReadLock=0;state.upgradeDeal=(state.upgradeDeal||0)+1;
  removePlatform();wave.upgradeChosen=true;wave.offers=[];wave.number++;wave.phase='combat';state.band=wave.number;
  emit('upgradeChosen',{id:buff.id,persistent,owned:(state.upgrades||[]).map(x=>x.id)});
  emit('sector',{band:wave.number,name:`WAVE ${wave.number}`});spawn();return true;
 }
 spawn();
 return {tick,choose,cells,setPracticeLinks(links){
  if(!controlPractice||!Array.isArray(links))return false;
  const valid=links.every(l=>l&&l.a!==l.b&&combat.enemies.get(l.a)?.kind==='prism'&&combat.enemies.get(l.b)?.kind==='prism'&&Number.isFinite(l.period)&&l.period>=140);
  if(!valid)return false;cells.clear();links.forEach((l,i)=>cells.set(`practice-link/${i}`,{link:{a:l.a,b:l.b,period:l.period,age:0}}));return true;
 },skipBreach(){if(wave.phase!=='breach'||state.phase!=='playing')return false;rest();return true;},dispose(){removePlatform();cells.clear();}};
}
