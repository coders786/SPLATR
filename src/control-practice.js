import {createRun} from './run.js';
import {placePlayer,stopPlayer} from './physics.js';
import {createBreakthrough,stepBreakthrough} from './breakthrough.js';
import {controlCue} from './control-cues.js';
export {controlCue} from './control-cues.js';

export const CONTROL_DRILLS=Object.freeze([
 Object.freeze({id:'route',name:'FULL ROUTE',setup:'Start uncharged. Earn pace, Hyper, Sonic and a shatter; land on the rest platform.'}),
 Object.freeze({id:'bank',name:'BANK DRILL',setup:'Practice setup: Hyper starts precharged. Launch, then bank within its window.'}),
 Object.freeze({id:'breach',name:'BREACH DRILL',setup:'Practice setup: Sonic starts preloaded. Make a fresh launch through the breach, then land.'}),
]);
export function controlDrill(id){return CONTROL_DRILLS.find(d=>d.id===id)||CONTROL_DRILLS[0];}
/** Isolated real simulation. No storage, UI, quest ticket or currency connection.
 * Drill preloads are explicit practice setup, never carried into a real run. */
export function createControlSession({drill='route',equipment=null,emit=()=>{},view=null}={}){
 drill=controlDrill(drill).id;let disposed=false,started=false;
 const run=createRun(841,emit,{waveMode:true,controlPractice:true,equipment});run.state.phase='playing';run.state.invul=999999;
 placePlayer(run.world,{x:0,y:-650});stopPlayer(run.world);
 if(drill!=='route')run.state.breakthrough=stepBreakthrough(createBreakthrough(),{paceHeld:true});
 if(drill==='breach')run.state.breakthrough={...run.state.breakthrough,sonic:true};
 if(view)run.setView(view);
 return {run,drill,get cue(){return controlCue(run.state,drill);},
  start(view){if(disposed||started)return false;if(view)run.setView(view);run.tick();stopPlayer(run.world);started=true;return true;},
  tick(aim=null){if(disposed||!started||controlCue(run.state,drill).complete)return;run.setAim(aim);if(run.state.shots===0)return;run.tick();},
  dispose(){if(disposed)return;disposed=true;run.dispose();},
 };
}
