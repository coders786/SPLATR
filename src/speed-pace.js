/** Pure speed-foundation model. Speed is px / nominal 60 Hz step; time is
 * simulation ticks, never Date.now(). This model never writes movement. */
export const SPEED_PACE = Object.freeze({goalTicks:180,graceTicks:45,decay:.35,displayCeiling:60});
export function paceTarget(wave=1){return Math.min(30,18+(Math.max(1,Math.floor(Number(wave)||1))-1)*1.5);}
export function createSpeedPace(wave=1){return {wave,target:paceTarget(wave),speed:0,displaySpeed:0,progress:0,below:0,streak:0,best:0,held:false,status:'ready',activeTicks:0};}
export function stepSpeedPace(previous,{speed=0,dt=1,active=true,holding=false}={}){
 const p={...previous};
 if(!active)return p;
 const time=Number.isFinite(dt)?Math.max(0,Math.min(1,dt)):0;
 if(!time)return p;
 p.speed=Number.isFinite(speed)?Math.max(0,speed):0;
 p.displaySpeed=p.activeTicks===0?p.speed:p.displaySpeed+(p.speed-p.displaySpeed)*(1-Math.exp(-time/6));
 p.activeTicks+=time;
 if(!holding&&p.speed>=p.target){
  p.below=0;p.streak+=time;p.best=Math.max(p.best,p.streak);
  p.progress=Math.min(SPEED_PACE.goalTicks,p.progress+time);
  if(p.progress>=SPEED_PACE.goalTicks)p.held=true;
  p.status=p.held?'held':'holding';
 }else{
  const before=p.below;p.below+=time;
  const drain=Math.max(0,p.below-SPEED_PACE.graceTicks)-Math.max(0,before-SPEED_PACE.graceTicks);
  if(drain>0){p.streak=0;if(!p.held)p.progress=Math.max(0,p.progress-drain*SPEED_PACE.decay);}
  p.status=p.held?'held':p.progress>0&&p.below<=SPEED_PACE.graceTicks?'recover':'build';
 }
 return p;
}
