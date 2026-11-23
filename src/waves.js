import {platformMagnet} from './platform-magnet.js';
import {createBreakthrough,stepBreakthrough,placeBreach,crossesBreach,breachCue} from './breakthrough.js';
import {createDimensionField,settleDimensionField} from './dimension-field.js';
import {createCleanBanks} from './clean-banks.js';
import {createSpeedPace,stepSpeedPace} from './speed-pace.js';
import {encounterBrief,planEncounter,recommendWaveOffer} from './encounters.js';
import Matter from 'matter-js';
import {placePlayer,stopPlayer,setPlayerVelocity,setBulletTime} from './physics.js';
export const WAVE_ARENA=Object.freeze({x:-900,y:-1250,w:1800,h:1550});
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
export function waveOffers(seed,wave){
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
/** Finite budgets. No timer/kill-count proxy can clear a wave while a real
 * enemy or Fork fragment remains alive. Buffs are replaced, never stacked. */
export function createWaveDirector({seed,world,combat,state,emit=()=>{},baseDashSpeed=1,controlPractice=false}){
 let platformBody=null,dwell=0;
 const cells=new Map();let start=null;
 const wave=state.wave={number:controlPractice?5:1,phase:'combat',total:0,remaining:0,platform:null,offers:[],cleared:0};
 function removePlatform(){if(platformBody)Matter.Composite.remove(world.engine.world,platformBody);const index=world.geometry.indexOf(wave.platform);if(index>=0)world.geometry.splice(index,1);platformBody=null;wave.platform=null;wave.magnet=null;dwell=0;}
 function spawn(){
  const cycle=Math.floor((wave.number-1)/5);if(!state.dimension||state.dimension.cycle!==cycle)state.dimension=createDimensionField(cycle);
  if(!state.breakthrough||state.breakthrough.cycle!==cycle)state.breakthrough=createBreakthrough(cycle);
  const plan=planEncounter(seed,wave.number,world.player.position);wave.total=controlPractice?0:plan.total;wave.brief=plan;wave.pace=createSpeedPace(wave.number);wave.cleanBanks=createCleanBanks();wave.age=0;wave.entry=controlPractice?0:30;wave.breach=null;wave.paceNotified=false;wave.shattered=false;wave.shatterFx=null;wave.shatterTrace=null;
  start={elapsed:state.elapsed,kills:state.kills,shots:state.shots,score:state.score,damage:state.damageTaken||0,credits:state.killLedger?.credits||0};
  for(const spec of controlPractice?[]:plan.specs)combat.add(spec);
  cells.clear();(controlPractice?[]:plan.links).forEach((link,i)=>cells.set(`wave-link/${i}`,{link:{...link}}));
  state.invul=Math.max(state.invul,30);
  wave.remaining=combat.enemies.size;emit('waveStart',{number:wave.number,total:wave.total});
 }
 function rest(){
  state.dimension=settleDimensionField(state.dimension);
  wave.breach=null;
  wave.phase='return';wave.expiredBuff=state.waveBuff||null;wave.expiredShield=state.waveShield;state.waveBuff=null;state.dashSpeed=baseDashSpeed;state.held=false;setBulletTime(world,false,true);wave.report=Object.freeze({ticks:state.elapsed-start.elapsed,cuts:state.kills-start.kills,shots:state.shots-start.shots,score:state.score-start.score,hits:(state.damageTaken||0)-start.damage,paceBest:wave.pace.best,paceHeld:wave.pace.held,paceTarget:wave.pace.target,cleanBanks:wave.cleanBanks.total,bestBanks:wave.cleanBanks.best,credits:(state.killLedger?.credits||0)-start.credits,shattered:!!wave.shattered});cells.clear();state.waveShield=0;wave.next=waveBrief(wave.number+1,seed);wave.restAge=0;wave.cleared++;combat.hazards.length=0;combat.links.length=0;
  // Retire the launch pad before summoning the rest deck. Otherwise the old
  // pad can hold the player above the new one forever at the spawn point.
  if(!wave.spawnPadGone){for(const body of [...world.engine.world.bodies])if(body.isStatic&&!body.isSensor)Matter.Composite.remove(world.engine.world,body);world.geometry.length=0;wave.spawnPadGone=true;}
  const p=world.player.position,a=world.arena;
  const x=Math.max(a.x+190,Math.min(a.x+a.w-190,p.x)),y=Math.max(a.y+150,Math.min(a.y+a.h-90,p.y+90));
  wave.platform={x:x-150,y,w:300,h:24};world.geometry.push(wave.platform);
  platformBody=Matter.Bodies.rectangle(x,y+12,300,24,{isStatic:true,label:'wave-rest',friction:1,restitution:0});Matter.Composite.add(world.engine.world,platformBody);
  state.edge=state.edgeMax;state.focus=1;state.hyper=false;state.hyperLevel=0;state.blade=0;state.chain=0;state.chainTime=0;state.stop=0;
  emit('waveClear',{number:wave.number,platform:wave.platform,shattered:!!wave.shattered});
 }
 function tick(dt=1){
  if(wave.shatterFx){wave.shatterFx.age+=dt;if(wave.shatterFx.age>=64)wave.shatterFx=null;}
  if(['combat','breach'].includes(wave.phase)){
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
   if(wave.phase==='combat'&&wave.remaining===0){
    if(wave.number%5!==0)rest();
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
   if(dwell>=12){placePlayer(world,{x:p.x,y:q.y-23});stopPlayer(world);state.held=false;wave.phase='choose';wave.offers=waveOffers(seed,wave.number);wave.recommendation=recommendWaveOffer(wave.offers,{next:wave.next,sword:state.sword,hp:state.hp,previous:wave.report});emit('waveRest',{number:wave.number});}
  }
 }
 function choose(id){
  if(wave.phase!=='choose')return false;
  const buff=wave.offers.find(x=>x.id===id);if(!buff)return false;
  state.waveBuff=buff;state.waveShield=buff.shield||0;state.dashSpeed=baseDashSpeed*(buff.speed||1);state.edge=state.edgeMax;state.focus=1;state.held=false;state.invul=Math.max(state.invul,90);state.launchGrace=0;
  removePlatform();wave.offers=[];wave.number++;wave.phase='combat';state.band=wave.number;
  emit('sector',{band:wave.number,name:`WAVE ${wave.number}`});spawn();return true;
 }
 spawn();
 return {tick,choose,cells,setPracticeLinks(links){
  if(!controlPractice||!Array.isArray(links))return false;
  const valid=links.every(l=>l&&l.a!==l.b&&combat.enemies.get(l.a)?.kind==='prism'&&combat.enemies.get(l.b)?.kind==='prism'&&Number.isFinite(l.period)&&l.period>=140);
  if(!valid)return false;cells.clear();links.forEach((l,i)=>cells.set(`practice-link/${i}`,{link:{a:l.a,b:l.b,period:l.period,age:0}}));return true;
 },skipBreach(){if(wave.phase!=='breach'||state.phase!=='playing')return false;rest();return true;},dispose(){removePlatform();cells.clear();}};
}
