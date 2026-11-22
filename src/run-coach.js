/** One factual observation + one optional action. No recipe, purchase pressure,
 * diagnosis of player intent, random choice or persistence. */
const count=n=>Number.isFinite(n)?Math.max(0,Math.floor(n)):0;
export function runCoaching(state={}){
 const shots=count(state.shots),kills=count(state.kills),pace=count(state.bestPace),banks=count(state.cleanBankTotal),shatters=count(state.shatters);
 const tip=(id,evidence,action)=>Object.freeze({id,evidence,action,text:`${evidence} ${action}`});
 if(!shots)return tip('launch','No launches yet.','Tap a target, or pull back and release forward. Arrows and Space also work.');
 if(!kills)return tip('contact',`${shots} launches; no kills.`, 'A dash must carry the active blade through a target. Try CUT LANE in Shop practice.');
 if(shatters)return tip('experiment',`${shatters} dimension${shatters===1?'':'s'} shattered.`, 'Try a different part in Shop practice; compare its strength and tradeoff before equipping.');
 if(state.breakthrough?.sonic)return tip('breach','Sonic was earned.', 'After the fifth-wave clear, make a fresh launch through the breach—or rest without shattering.');
 if(state.breakthrough?.paceReady)return tip('bank','Hyper was charged.', 'Clean-bank during the next Hyper surge to earn Sonic. A missed surge recharges by moving at target pace.');
 if(pace>=60&&!banks)return tip('steer',`Best pace streak: ${(pace/60).toFixed(1)}s.`, 'Aim inward just before a side-wall rebound to steer; keep moving to charge Hyper.');
 if(state.sword?.family==='pulse'&&count(state.swordCharge)>0)return tip('pulse',`${count(state.swordCharge)}/${count(state.sword.chargeMax)} pulse contacts charged.`, 'Fill the charge with direct contacts, then launch to release the pulse.');
 if(state.sword?.family==='echo')return tip('echo',`${kills} kills with a delayed-lane sword.`, 'The follow-up stays on your original line. Compare CUT LANE and SPLIT LANE in practice.');
 return tip('pace',`${kills} kills; best pace streak ${(pace/60).toFixed(1)}s.`, 'Keep moving above the HUD target to charge Hyper. Normal waves do not require it.');
}
