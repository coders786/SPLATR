import {SPEED_PACE} from './speed-pace.js';
import {BREAKTHROUGH} from './breakthrough.js';

const ratio=(n,d)=>Math.min(1,Math.max(0,(Number.isFinite(n)?n:0)/d));
/** Shared factual state readout. Never claims a spent surge is still active. */
export function controlCue(state={},drill='route'){
 const wave=state.wave||{},b=state.breakthrough||{},pace=wave.pace||{};
 const result=(stage,title,hint,progress=0,complete=false)=>Object.freeze({stage,title,hint,progress:ratio(progress,1),complete});
 if(wave.phase==='choose')return drill==='breach'?result('complete','BREACH COMPLETE','You launched through the breach and landed. Full Route starts without preloaded Sonic.',1,true):result('complete','ROUTE COMPLETE','You reached the rest platform. Retry here or take the same controls into a real run.',1,true);
 if(drill==='bank'&&b.sonic)return result('complete','BANK COMPLETE','A clean bank during Hyper earned Sonic. Try Full Route to connect the skills.',1,true);
 if(wave.phase==='return')return result('land','LAND ON THE PLATFORM','The shatter is earned. Steer onto the summoned platform and let the cube settle.',1);
 if(b.sonic)return result('breach','LAUNCH THROUGH THE BREACH','Sonic is ready. Release any held aim, then make a fresh launch through the gold seam.',1);
 if(b.surgeTicks>0)return result('surge','BANK BEFORE HYPER ENDS',`Reach a side or top wall above target speed. ${(b.surgeTicks/60).toFixed(1)}s of simulation remain.`,ratio(b.surgeTicks,BREAKTHROUGH.surgeTicks));
 if(b.paceReady&&!b.surgeSpent)return result('launch','LAUNCH TO START HYPER','Aim toward a side wall. Your next launch starts the bank window.',1);
 if(b.paceReady)return result('recharge','MOVE TO RECHARGE HYPER','The window ended. Stay above target speed to recharge; holding aim does not count.',ratio(b.recharge,BREAKTHROUGH.rechargeTicks));
 return result('pace','KEEP MOVING ABOVE TARGET','Launch toward a side wall. Keep speed above target to charge; holding aim pauses progress.',ratio(pace.progress,SPEED_PACE.goalTicks));
}
